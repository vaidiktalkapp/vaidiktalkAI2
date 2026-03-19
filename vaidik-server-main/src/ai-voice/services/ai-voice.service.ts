import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { AiAstrologerProfile, AiAstrologerProfileDocument } from '../../ai-astrologers/schemas/ai-astrologers-profile.schema';
import { CallSession, CallSessionDocument } from '../../calls/schemas/call-session.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { AgoraService } from '../../calls/services/agora.service';
import { WalletService } from '../../payments/services/wallet.service';

@Injectable()
export class AiVoiceService {
  private readonly logger = new Logger(AiVoiceService.name);
  private readonly vapiApiKey: string;
  private readonly vapiBaseUrl = 'https://api.vapi.ai';

  constructor(
    private configService: ConfigService,
    private agoraService: AgoraService,
    private walletService: WalletService,
    @InjectModel(AiAstrologerProfile.name)
    private aiProfileModel: Model<AiAstrologerProfileDocument>,
    @InjectModel(CallSession.name)
    private sessionModel: Model<CallSessionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {
    this.vapiApiKey = this.configService.get<string>('VAPI_API_KEY') || '';
    if (!this.vapiApiKey) {
      this.logger.warn('Vapi API Key not configured');
    }
  }

  /**
   * ✅ Initiate an AI Voice Call into an Agora Channel
   */
  async initiateAiVoiceCall(userId: string, aiId: string, language: string = 'English'): Promise<any> {
    // 1. Validate User & AI Profile
    const [user, aiProfile] = await Promise.all([
      this.userModel.findById(userId),
      this.aiProfileModel.findById(aiId),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!aiProfile) throw new NotFoundException('AI Astrologer not found');

    // 2. Check Wallet Balance (Minimum 5 minutes)
    const ratePerMinute = aiProfile.ratePerMinute || 10;
    const minBalanceRequired = ratePerMinute * 5;
    const hasBalance = await this.walletService.checkBalance(userId, minBalanceRequired);

    if (!hasBalance) {
      throw new BadRequestException(`Insufficient balance. Minimum ₹${minBalanceRequired} required.`);
    }

    // 3. Setup Agora Channel
    const channelName = `AI_CALL_${Date.now()}_${userId.substring(18)}`;
    const userUid = this.agoraService.generateUid();
    const botUid = userUid + 1000; // Unique UID for the AI bot

    const userToken = this.agoraService.generateRtcToken(channelName, userUid);
    const botToken = this.agoraService.generateRtcToken(channelName, botUid);

    // 4. Create Session Record
    const sessionId = `AI_VOICE_${Date.now()}`;
    const session = new this.sessionModel({
      sessionId,
      userId: new Types.ObjectId(userId),
      astrologerId: new Types.ObjectId(aiId), // Using AI ID as astrologerId
      isAi: true,
      callType: 'audio',
      ratePerMinute,
      status: 'active', // AI calls start immediately
      startTime: new Date(),
      channelName,
      userStatus: { userId: new Types.ObjectId(userId), isOnline: true },
      astrologerStatus: { astrologerId: new Types.ObjectId(aiId), isOnline: true },
    });
    await session.save();

    // 5. Trigger Vapi.ai to join the Agora Channel
    try {
      const vapiResponse = await axios.post(
        `${this.vapiBaseUrl}/call`,
        {
          assistant: {
            name: aiProfile.name,
            model: {
              provider: 'openai',
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `${aiProfile.systemPromptAddition || ''}\n\nLanguage: ${language}. Keep responses short and conversational.`,
                },
              ],
            },
            voice: {
              provider: 'elevenlabs',
              voiceId: aiProfile.voiceId || 'pMSpe79Vf0vVp3n37rV6', // Default Indian/Neutral voice
            },
            // Vapi native Agora integration
            transport: {
              provider: 'agora',
              channelName,
              appId: this.agoraService.getAppId(),
              token: botToken,
              uid: botUid,
            },
          },
          phoneNumberId: null, // This is a web/SDK call via Agora
        },
        {
          headers: { Authorization: `Bearer ${this.vapiApiKey}` },
        }
      );

      return {
        success: true,
        sessionId,
        agora: {
          channelName,
          token: userToken,
          uid: userUid,
          appId: this.agoraService.getAppId(),
        },
        vapiCallId: vapiResponse.data.id,
      };
    } catch (error: any) {
      this.logger.error(`Failed to trigger Vapi: ${error.response?.data?.message || error.message}`);
      // Cleanup session if AI fails to join
      await this.sessionModel.deleteOne({ sessionId });
      throw new InternalServerErrorException('Celestial voice connection failed. Please try again.');
    }
  }

  /**
   * Handle Webhooks from Vapi.ai (e.g., when call ends)
   */
  async handleVapiWebhook(payload: any): Promise<void> {
    const { type, call } = payload;

    if (type === 'call.ended') {
      const { channelName, startedAt, endedAt } = call;
      const session = await this.sessionModel.findOne({ channelName, status: 'active' });

      if (session) {
        const start = new Date(startedAt || session.startTime);
        const end = new Date(endedAt || new Date());
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
        const billedMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
        const totalAmount = billedMinutes * session.ratePerMinute;

        this.logger.log(`💰 AI Voice call ended: Session=${session.sessionId}, Duration=${durationSeconds}s, Billed=${billedMinutes}m, Amount=₹${totalAmount}`);

        // 1. Update Session
        session.status = 'ended';
        session.endTime = end;
        session.duration = durationSeconds;
        session.billedMinutes = billedMinutes;
        session.totalAmount = totalAmount;
        session.vapiCallId = call.id;
        await session.save();

        // 2. Process Payment
        if (totalAmount > 0) {
          try {
            const aiProfile = await this.aiProfileModel.findById(session.astrologerId);
            const aiName = aiProfile?.name || 'AI Astrologer';

            await this.walletService.deductFromWallet(
              session.userId.toString(),
              totalAmount,
              session.orderId || session.sessionId,
              `AI Voice Consultation`,
              undefined,
              {
                sessionId: session.sessionId,
                durationSeconds,
                billedMinutes,
                isAi: true,
              },
              aiName
            );
            
            session.isPaid = true;
            await session.save();
          } catch (error: any) {
            this.logger.error(`❌ Payment deduction failed for AI session ${session.sessionId}: ${error.message}`);
          }
        }
      }
    }
  }
}

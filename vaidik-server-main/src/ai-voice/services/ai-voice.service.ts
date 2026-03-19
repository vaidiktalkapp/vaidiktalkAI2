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
    // 1. Validate ID formats
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format. Must be a 24-character hex string.');
    }
    if (!Types.ObjectId.isValid(aiId)) {
      throw new BadRequestException('Invalid aiId format. Must be a 24-character hex string.');
    }

    // 2. Validate User & AI Profile
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

    // 3. Create Unique Channel/Session ID
    const channelName = `AI_VOICE_${Date.now()}_${userId.substring(18)}`;

    // 4. Create Call Session Record in Database
    const session = await this.sessionModel.create({
      sessionId: channelName,
      userId: new Types.ObjectId(userId),
      astrologerId: new Types.ObjectId(aiId),
      orderId: `AI_ORDER_${Date.now()}_${userId.substring(20)}`,
      callType: 'audio',
      status: 'active',
      isAi: true,
      ratePerMinute: ratePerMinute,
      startTime: new Date(),
    });

    // 5. Trigger Vapi.ai Web Call Configuration
    try {
      const vapiResponse = await axios.post(
        `${this.vapiBaseUrl}/call`,
        {
          assistant: {
            name: aiProfile.name,
            model: {
              provider: 'google', 
              model: 'gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `${aiProfile.systemPromptAddition || ''}\n\nLanguage: ${language}. Keep responses short and conversational.`,
                },
              ],
            },
            voice: {
              provider: '11labs',
              voiceId: aiProfile.voiceId || 'vJ4HEJ2r9hMd3EsmSExR', 
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${this.vapiApiKey}` },
        }
      );

      // Save the actual Vapi Call ID for webhook tracking
      await this.sessionModel.updateOne(
        { sessionId: channelName },
        { vapiCallId: vapiResponse.data.id }
      );

      return {
        success: true,
        sessionId: channelName,
        vapi: {
          vapiCallId: vapiResponse.data.id,
          vapiWebToken: vapiResponse.data.webToken || null,
          assistantId: vapiResponse.data.assistantId,
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to trigger Vapi: ${error.response?.data?.message || JSON.stringify(error.response?.data) || error.message}`);
      await this.sessionModel.deleteOne({ sessionId: channelName });
      throw new InternalServerErrorException('AI Voice connection failed. Please check Vapi/Gemini keys.');
    }
  }

  /**
   * Handle Webhooks from Vapi.ai (e.g., when call ends)
   */
  async handleVapiWebhook(payload: any): Promise<void> {
    const { message } = payload;
    const { type, call } = message || payload;

    if (type === 'call.ended') {
      const { id: vapiCallId, startedAt, endedAt } = call;
      const session = await this.sessionModel.findOne({ 
        $or: [
          { vapiCallId: vapiCallId },
          { sessionId: call.customer?.number } // Fallback for some vapi types
        ],
        status: 'active' 
      });

      if (session) {
        const start = new Date(startedAt || session.startTime);
        const end = new Date(endedAt || new Date());
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
        const billedMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
        const ratePerMinute = session.ratePerMinute || 10; // Use ratePerMinute from session
        const totalAmount = billedMinutes * ratePerMinute;

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

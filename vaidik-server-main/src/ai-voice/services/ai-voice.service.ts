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
import { AstronomyService } from '../../ai-astrologers/services/astronomy.service';
import { AiAstrologyEngineService } from '../../ai-astrologers/services/ai-astrology-engine.service';

@Injectable()
export class AiVoiceService {
  private readonly logger = new Logger(AiVoiceService.name);
  private readonly vapiApiKey: string;
  private readonly vapiBaseUrl = 'https://api.vapi.ai';

  constructor(
    private configService: ConfigService,
    private agoraService: AgoraService,
    private walletService: WalletService,
    private astronomyService: AstronomyService,
    private aiAstrologyEngine: AiAstrologyEngineService,
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

    // 5. Calculate Astrological Context (The "Base" for AI Response)
    let astroDataContext = '';
    try {
      if (user.dateOfBirth && user.timeOfBirth && user.placeOfBirth) {
        this.logger.log(`🔭 Calculating birth chart for user: ${user.name || userId}`);
        const dob = user.dateOfBirth.toISOString().split('T')[0];
        const { lat, lon } = await this.astronomyService.geocodePlaceOfBirth(user.placeOfBirth);
        const astroData = await this.astronomyService.calculateAllData(dob, user.timeOfBirth, lat.toString(), lon.toString());

        astroDataContext = `
ASTRO_DATA (SEEKER CHART):
- Name: ${user.name || 'Seeker'}
- DOB: ${dob}
- TOB: ${user.timeOfBirth}
- POB: ${user.placeOfBirth}
- Lagna: ${astroData.kundli?.main_chart?.Lagna || 'Unknown'}
- Moon Sign: ${astroData.kundli?.main_chart?.Moon || 'Unknown'}
- Current Dasha: ${astroData.dasha?.current_mahadasha || 'Unknown'}
- Planetary Placements: ${JSON.stringify(astroData.kundli?.planets || {})}
        `.trim();
      } else {
        astroDataContext = `
ASTRO_DATA: Birth details incomplete for ${user.name || 'Seeker'}. 
Please ask the user for their Date, Time, and Place of birth if they want a precise reading.
        `.trim();
      }
    } catch (error) {
      this.logger.error(`❌ Astrology calculation failed for Voice Call: ${error.message}`);
      astroDataContext = 'ASTRO_DATA: Technical error fetching chart. Use intuitive guidance.';
    }

    // 6. Determine Language (Priority: Parameter > AI Profile > User Profile > Default)
    let callLanguage = language;
    
    if (!callLanguage || callLanguage === 'English') {
      if (aiProfile.languages && aiProfile.languages.length > 0) {
        callLanguage = aiProfile.languages[0];
      } else if (user.appLanguage) {
        // Map ISO codes to full names if needed for our mapping
        const isoToFull: Record<string, string> = { 'en': 'English', 'hi': 'Hindi' };
        callLanguage = isoToFull[user.appLanguage] || user.appLanguage;
      }
    }

    if (!callLanguage) callLanguage = 'English';

    // 7. Generate Dynamic Greeting using AI Engine
    const dynamicGreeting = await this.aiAstrologyEngine.generateDynamicGreeting(user.name || 'Seeker', callLanguage);

    // 8. Build Master Prompt from Admin-Managed Profile
    const expertise = aiProfile.expertise || 'Vedic';
    const personalityType = aiProfile.personalityType || 'Traditional';
    
    const masterPrompt = `
    ${astroDataContext}

    IDENTITY: You are ${aiProfile.name}, a ${personalityType} ${expertise} expert.
    BIO: ${aiProfile.bio || 'Professional astrologer.'}
    TONE: ${aiProfile.tone || 'calm, confident, and compassionate'}.
    STYLE: ${aiProfile.styleGuide || 'Provide clear, spiritual guidance.'}
    FOCUS: ${aiProfile.focusArea || 'Life guidance.'}

    CRITICAL RULES FOR VOICE:
    1. **GREETING**: Greet the user warmly ONLY in the first message. Do NOT repeat greetings in every response.
    2. **CONVERSATIONAL**: Keep responses concise (under 2-3 sentences).
    3. **ASTROLOGY FOCUS**: Always steer the conversation back to planets, Dashas, or spiritual guidance.
    4. **NO MARKDOWN**: Do NOT use **bold** or *italics*. Speak in plain text.
    5. **STORE POLICY**: If asked for remedies, suggest vaidiktalk.store.
    `.trim();

    const languageMapping: Record<string, { transcriber: string, voice: string, provider: string }> = {
      'English': { transcriber: 'en', voice: 'en-IN-NeerjaNeural', provider: 'azure' },
      'en': { transcriber: 'en', voice: 'en-IN-NeerjaNeural', provider: 'azure' },
      'Hindi': { transcriber: 'hi', voice: 'hi-IN-SwaraNeural', provider: 'azure' },
      'hi': { transcriber: 'hi', voice: 'hi-IN-SwaraNeural', provider: 'azure' },
    };

    const langConfig = languageMapping[callLanguage] || languageMapping['English'];

    // 9. Determine Voice and Provider (Admin Overrides)
    let finalVoiceId = langConfig.voice;
    let finalProvider = langConfig.provider;

    if (aiProfile.voiceId && aiProfile.voiceId !== 'pMSpe79Vf0vVp3n37rV6') {
      finalVoiceId = aiProfile.voiceId;
      // Heuristic for provider: IDs with dashes are usually Azure/Google, 20-char alphanumeric are ElevenLabs
      finalProvider = (finalVoiceId.includes('-') || finalVoiceId.includes('_')) ? 'azure' : 'elevenlabs';
      this.logger.log(`🎭 Using Admin-configured voice: ${finalVoiceId} (Provider: ${finalProvider})`);
    }

    const vapiConfig = {
      name: aiProfile.name,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${masterPrompt}\n\n${aiProfile.systemPromptAddition || ''}\n\nLanguage: ${callLanguage}. Speak ONLY in ${callLanguage}.`,
          },
        ],
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: langConfig.transcriber,
      },
      voice: {
        provider: finalProvider as any,
        voiceId: finalVoiceId,
      },
      firstMessage: dynamicGreeting,
      maxDurationSeconds: Math.floor((user.wallet?.balance || 0) / ratePerMinute) * 60,
      metadata: {
        sessionId: channelName,
      },
      recordingEnabled: true,
      serverMessages: ['end-of-call-report', 'status-update', 'transcript'],
    };

    return {
      success: true,
      sessionId: channelName,
      vapiConfig, // The App uses this with vapi.start(vapiConfig)
    };
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
          { sessionId: call.metadata?.sessionId }, // Use metadata we passed at start
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

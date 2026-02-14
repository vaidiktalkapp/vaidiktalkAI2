import { Injectable, NotFoundException, BadRequestException, Logger, Optional, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession, ChatSessionDocument } from '../../chat/schemas/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../../chat/schemas/chat-message.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { WalletTransaction, WalletTransactionDocument } from '../../payments/schemas/wallet-transaction.schema';
import { AiAstrologerProfile, AiAstrologerProfileDocument } from '../schemas/ai-astrologers-profile.schema';
import { StartAiChatDto } from '../dto/start-ai-chat.dto';
import { AdminNotificationGateway } from '../../admin/features/notifications/gateways/admin-notification.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiChatSessionService implements OnModuleInit {
    private readonly logger = new Logger(AiChatSessionService.name);

    async onModuleInit() {
        this.logger.log('🚀 [AiChatSessionService] Initializing and checking for stale sessions...');
        await this.cleanupStaleSessions();
    }
    constructor(
        @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
        @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
        @InjectModel(AiAstrologerProfile.name) private aiAstrologerModel: Model<AiAstrologerProfileDocument>,
        @Optional() private readonly notificationGateway: AdminNotificationGateway,
    ) { }

    /**
     * Periodic cleanup for stale AI sessions (every 5 minutes)
     * Ends sessions that have been active for too long or have no recent activity.
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async cleanupStaleSessions() {
        this.logger.log('🧹 [AiChatSessionService] Running stale session cleanup...');

        try {
            const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes of inactivity
            const now = new Date();

            // Find all active AI sessions
            const activeAiSessions = await this.chatSessionModel.find({
                orderId: /^AI-/,
                status: 'active'
            });

            if (activeAiSessions.length === 0) return;

            let cleanedCount = 0;
            for (const session of activeAiSessions) {
                const startTime = session.startTime || session.createdAt;
                const lastActivity = session.lastMessageAt || session.updatedAt || startTime;

                const inactivityDuration = now.getTime() - new Date(lastActivity).getTime();
                const totalDuration = now.getTime() - new Date(startTime).getTime();
                const maxDurationMs = (session.maxDurationSeconds || 3600) * 1000;

                // 1. End if max duration reached (with 2 min grace)
                const isMaxDurationReached = totalDuration > (maxDurationMs + 120000);

                // 2. End if stale (no messages for 10 mins)
                const isStale = inactivityDuration > STALE_THRESHOLD_MS;

                if (isMaxDurationReached || isStale) {
                    const reason = isMaxDurationReached ? 'max_duration_reached' : 'inactivity_timeout';
                    this.logger.log(`Cleaning up stale AI session: ${session.sessionId} | Reason: ${reason}`);
                    await this.settleSession(session.sessionId, undefined, reason);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                this.logger.log(`✅ [AiChatSessionService] Cleaned up ${cleanedCount} stale sessions.`);
            }
        } catch (error) {
            this.logger.error('❌ [AiChatSessionService] Error in stale session cleanup:', error);
        }
    }

    async startSession(userId: string, dto: StartAiChatDto): Promise<ChatSession> {
        // 1. Validate IDs
        const validUserId = new Types.ObjectId(userId);
        const validAstrologerId = new Types.ObjectId(dto.astrologerId);

        // 2. Fetch AI profile and User for rate and balance
        const [aiProfile, user] = await Promise.all([
            this.aiAstrologerModel.findById(validAstrologerId),
            this.userModel.findById(validUserId)
        ]);

        if (!aiProfile) {
            throw new NotFoundException('AI Astrologer profile not found');
        }

        const ratePerMinute = aiProfile.ratePerMinute || 0;
        let maxDurationSeconds = 3600; // Default 1 hour for free/low rate

        if (ratePerMinute > 0 && user) {
            const balance = user.wallet?.balance || 0;
            // PARTIAL MINUTE SUPPORT:
            // Allow chat if balance is at least enough for ~6 seconds of chat (approx 10% of a minute at typical rates)
            // or simply check if they have a non-trivial positive balance.
            const minRequiredBalance = 2; // Allow burning down to nearly zero

            if (balance < minRequiredBalance) {
                // Only block if they really have almost zero balance
                throw new BadRequestException(`Insufficient balance. Please recharge.`);
            }

            // Calculate EXACT duration in seconds supported by the balance
            // Formula: (Balance / RatePerMinute) * 60
            maxDurationSeconds = Math.floor((balance / ratePerMinute) * 60);
        }

        const session = new this.chatSessionModel({
            sessionId: uuidv4(),
            userId: validUserId,
            astrologerId: validAstrologerId,
            astrologerModel: 'AiAstrologerProfile',
            orderId: `AI-${Date.now()}`,
            status: 'active',
            startTime: new Date(),
            ratePerMinute: ratePerMinute,
            maxDurationSeconds: maxDurationSeconds,
            maxDurationMinutes: maxDurationSeconds / 60, // Allow fractional minutes for record keeping
            userBirthChart: {
                name: dto.userName,
                dateOfBirth: dto.dateOfBirth,
                timeOfBirth: dto.timeOfBirth,
                placeOfBirth: dto.placeOfBirth
            },
            language: dto.language || 'English',
            totalCost: 0,
            isGreetingGenerated: false,
            createdAt: new Date(),
        });

        const savedSession = await session.save();

        // 3. Update astrologer profile total sessions
        // ❌ REMOVED: Premature increment. totalSessions is updated in settleSession (end of chat).
        // This prevents double counting (once at start, once at end).
        /*
        await this.aiAstrologerModel.updateOne(
            { _id: validAstrologerId },
            { $inc: { totalSessions: 1 } }
        );
        */

        this.logger.log(`✅ [startSession] Saved new session: ${savedSession.sessionId} (Order: ${savedSession.orderId}) for User: ${savedSession.userId}`);

        // Notify Admin
        try {
            this.notificationGateway?.notifyRealtimeActivity({
                type: 'ai_order',
                message: `New AI Chat started by ${user?.name || 'User'}`,
                data: {
                    sessionId: savedSession.sessionId,
                    orderId: savedSession.orderId,
                    userId: savedSession.userId,
                    astrologerId: savedSession.astrologerId,
                    status: 'active'
                }
            });
        } catch (e) {
            this.logger.error('Failed to notify admin about new session', e);
        }

        return savedSession;
    }

    async saveMessage(
        sessionId: string,
        content: string,
        senderType: 'user' | 'astrologer',
        senderId: string
    ): Promise<{ message: ChatMessage; session: ChatSession }> {
        const cleanId = sessionId.trim();
        const session = await this.chatSessionModel.findOne({
            $or: [{ sessionId: cleanId }, { orderId: cleanId }]
        });
        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const isSenderUser = senderType === 'user';
        // Note: ChatMessage schema only accepts 'User' or 'Astrologer' enum values
        // We normalize the model name for message storage, while session uses dynamic refPath
        const messageId = uuidv4();
        const senderModel = isSenderUser ? 'User' : 'Astrologer';
        const receiverId = isSenderUser ? session.astrologerId : session.userId;
        const receiverModel = isSenderUser ? 'Astrologer' : 'User';

        const message = new this.chatMessageModel({
            messageId,
            sessionId: session.sessionId, // Standardize on the actual UUID
            orderId: session.orderId,
            senderId: new Types.ObjectId(senderId),
            senderModel: senderModel,
            receiverId: new Types.ObjectId(receiverId.toString()),
            receiverModel: receiverModel,
            content: content,
            message: content, // Dual field support
            sender: senderType, // Dual field support
            type: 'text',
            sentAt: new Date(),
            deliveryStatus: 'sent',
            readAt: isSenderUser ? undefined : new Date(), // AI reads instantly, User reads when they see it
            isEnhanced: senderType === 'astrologer',
            qualityScore: senderType === 'astrologer' ? this.calculateQualityScore(content) : undefined,
        });

        // Update lastMessageAt
        session.lastMessageAt = new Date();
        await session.save();

        await message.save();

        // Update session last message
        session.lastMessage = {
            content: content,
            type: 'text',
            sentBy: senderType,
            sentAt: new Date()
        };
        session.messageCount = (session.messageCount || 0) + 1;
        session.lastMessageAt = new Date();
        await session.save();

        return { message, session };
    }

    async getSession(sessionId: string): Promise<ChatSession | null> {
        return this.chatSessionModel.findOne({
            $or: [{ sessionId }, { orderId: sessionId }]
        });
    }

    async markGreetingGenerated(sessionId: string): Promise<boolean> {
        const result = await this.chatSessionModel.updateOne(
            {
                $or: [{ sessionId }, { orderId: sessionId }],
                isGreetingGenerated: { $ne: true }
            },
            { isGreetingGenerated: true }
        );
        return result.modifiedCount > 0;
    }

    async getUser(userId: string): Promise<User | null> {
        return this.userModel.findById(userId);
    }

    async endSession(sessionId: string, userId?: string, reason: string = 'user_ended', userRating?: number): Promise<ChatSession | null> {
        const query: any = {
            $or: [{ sessionId }, { orderId: sessionId }]
        };
        if (userId) query.userId = userId;

        const session = await this.chatSessionModel.findOne(query);
        if (!session) return null;
        if (session.status === 'ended') return session;

        return this.settleSession(session.sessionId, userRating, reason);
    }

    /**
     * Settles a chat session: calculates duration, cost, updates wallet and stats.
     */
    async settleSession(sessionId: string, userRating?: number, reason: string = 'ended'): Promise<ChatSession | null> {
        try {
            const session = await this.chatSessionModel.findOne({ sessionId });
            if (!session || session.status === 'ended') return session;

            // Calculate duration
            const startTime = session.startTime || session.createdAt;
            const durationSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
            const finalDuration = Math.max(durationSeconds, 1);

            // Fetch astrologer data for rate
            const astrologer = await this.aiAstrologerModel.findById(session.astrologerId);
            if (!astrologer) {
                this.logger.error(`[SETTLEMENT ERROR] Missing astrologer ${session.astrologerId} for session ${sessionId}`);
                session.status = 'ended';
                session.endTime = new Date();
                session.duration = finalDuration;
                await session.save();
                return session;
            }

            // Calculate cost
            const rate = astrologer.ratePerMinute || 0;
            const durationMinutes = finalDuration / 60;
            const cappedMinutes = Math.min(durationMinutes, 180); // 3h cap
            const calculatedCost = Math.ceil(cappedMinutes * rate);

            // Fetch user to get current balance
            const user = await this.userModel.findById(session.userId);
            const userBalance = user?.wallet?.balance || 0;

            // Cap cost to user's balance to prevent over-deduction
            const totalCost = Math.min(calculatedCost, userBalance);
            const finalCost = Math.max(totalCost, 0);

            this.logger.log(`[SETTLEMENT] Session ${sessionId}: duration=${finalDuration}s, rate=₹${rate}/min, calculated=₹${calculatedCost}, capped=₹${finalCost}, balance=₹${userBalance}`);

            // Update Session
            session.endTime = new Date();
            session.duration = finalDuration;
            session.totalCost = finalCost;
            session.totalAmount = finalCost;
            session.platformCommission = 0; // AI doesn't have "commission", it's direct revenue
            session.status = 'ended';
            session.endReason = reason;
            if (userRating) session.userSatisfactionRating = userRating;
            await session.save();

            // Notify Admin of End
            try {
                this.notificationGateway?.notifyRealtimeActivity({
                    type: 'ai_order', // Keep generic type or use 'ai_order_ended' if frontend supports
                    message: `AI Chat ended (Duration: ${Math.floor(finalDuration / 60)}m)`,
                    data: {
                        sessionId: session.sessionId,
                        orderId: session.orderId,
                        totalCost: finalCost,
                        duration: finalDuration,
                        status: 'ended'
                    }
                });
            } catch (e) {
                this.logger.error('Failed to notify admin about session end', e);
            }

            // Deduct from user wallet (user already fetched above for balance check)
            if (user && finalCost > 0) {
                const balanceBefore = user.wallet.balance;

                // Deduct from cash balance first, then bonus balance
                let remainingToDeduct = finalCost;

                if (user.wallet.cashBalance >= remainingToDeduct) {
                    user.wallet.cashBalance -= remainingToDeduct;
                    remainingToDeduct = 0;
                } else {
                    remainingToDeduct -= user.wallet.cashBalance;
                    user.wallet.cashBalance = 0;
                    user.wallet.bonusBalance = Math.max(0, user.wallet.bonusBalance - remainingToDeduct);
                }

                user.wallet.balance = user.wallet.cashBalance + user.wallet.bonusBalance;
                user.wallet.totalSpent = (user.wallet.totalSpent || 0) + finalCost;
                user.wallet.lastTransactionAt = new Date();
                await user.save();

                this.logger.log(`[SETTLEMENT] User ${user._id} wallet updated: ₹${balanceBefore} -> ₹${user.wallet.balance}`);

                // Create transaction
                await this.walletTransactionModel.create({
                    transactionId: `TXN-${uuidv4()}`,
                    userId: user._id,
                    userModel: 'User',
                    type: 'deduction',
                    amount: finalCost,
                    description: `AI Chat with ${astrologer.name}`,
                    sessionId: session.sessionId,
                    balanceBefore,
                    balanceAfter: user.wallet.balance,
                    status: 'completed'
                });
            }

            // Update astrologer stats
            astrologer.totalSessions = (astrologer.totalSessions || 0) + 1;
            astrologer.totalRevenue = (astrologer.totalRevenue || 0) + finalCost;
            astrologer.averageSessionDuration = Math.floor(
                (((astrologer.averageSessionDuration || 0) * (astrologer.totalSessions - 1)) + finalDuration) / astrologer.totalSessions
            );
            if (userRating) {
                astrologer.satisfactionScore = (
                    (((astrologer.satisfactionScore || 4.5) * (astrologer.totalSessions - 1)) + userRating) / astrologer.totalSessions
                );
            }
            await astrologer.save();
            this.logger.log(`[SETTLEMENT] Astrologer ${astrologer.name} stats updated.`);

            this.logger.log(`[SETTLEMENT SUCCESS] Session ${sessionId} fully settled.`);
            return session;
        } catch (error) {
            this.logger.error(`[SETTLEMENT ERROR] Failed to settle session ${sessionId}:`, error);
            throw error;
        }
    }

    async updateProfilePerformanceStats(astrologerId: string, latency: number, accuracy: number): Promise<void> {
        try {
            const profile = await this.aiAstrologerModel.findById(astrologerId);
            if (!profile) return;

            const total = profile.totalSessions || 1;
            profile.averageLatency = (((profile.averageLatency || 0) * (total - 1)) + latency) / total;
            profile.averageAccuracy = (((profile.averageAccuracy || 0) * (total - 1)) + accuracy) / total;
            await profile.save();
        } catch (error) {
            this.logger.error(`Failed to update performance stats for ${astrologerId}:`, error.message);
        }
    }

    private calculateQualityScore(content: string): number {
        let score = 7; // Increased base score
        if (content.length > 300) score += 2;
        else if (content.length > 100) score += 1;

        // Language-agnostic indicators of depth (length, structured lists, etc.)
        if (content.includes('1.') || content.includes('2.')) score += 1;

        // Core spiritual/astrological keywords (English & Hindi)
        if (/vibration|energy|karma|path|destiny|cycle|timing|guidance|remedy|blessing|Graha|Bhava|Dasha|Nakshatra|Yoga|रवि|चंद्र|मंगल|बुध|नक्षत्र|योग|दशा/i.test(content)) {
            score += 2;
        }

        return Math.min(score, 10);
    }

    async getSessionDetails(sessionId: string, userId: string): Promise<any> {
        const cleanId = sessionId.trim();
        this.logger.log(`🔍 [getSessionDetails] Looking up session: "${cleanId}" for user: ${userId}`);
        this.logger.log(`📋 [getSessionDetails] ID format check: length=${cleanId.length}, starts with "AI-"=${cleanId.startsWith('AI-')}`);

        // Build a comprehensive query to match sessionId (UUID), orderId (AI-[timestamp]), or MongoDB _id
        const query: any = {
            $or: [
                { sessionId: cleanId },  // UUID match
                { orderId: cleanId }      // AI-[timestamp] match
            ]
        };

        // If sessionId looks like a valid MongoDB ObjectId (24 hex chars), add _id query
        if (sessionId.match(/^[0-9a-fA-F]{24}$/)) {
            this.logger.log(`📋 [getSessionDetails] ID appears to be MongoDB ObjectId, adding _id query`);
            query.$or.push({ _id: sessionId });
        }

        // Add user ownership check
        query.userId = userId;

        this.logger.log(`🔍 [getSessionDetails] Query: ${JSON.stringify(query)}`);

        const session = await this.chatSessionModel.findOne(query).lean();

        if (!session) {
            this.logger.error(`❌ [getSessionDetails] Session NOT FOUND in DB`);
            this.logger.error(`❌ [getSessionDetails] Query used: ${JSON.stringify(query)}`);

            // Try to find any session for this user to help debug
            const anySessions = await this.chatSessionModel.find({ userId }).select('sessionId orderId _id').limit(3).lean();
            if (anySessions.length > 0) {
                this.logger.error(`❌ [getSessionDetails] User has ${anySessions.length} other sessions:`);
                anySessions.forEach(s => {
                    this.logger.error(`   - sessionId: ${s.sessionId}, orderId: ${s.orderId}, _id: ${s._id}`);
                });
            } else {
                this.logger.error(`❌ [getSessionDetails] User has NO sessions at all`);
            }

            return null;
        }

        this.logger.log(`✅ [getSessionDetails] Session FOUND: sessionId=${session.sessionId}, orderId=${session.orderId}, _id=${session._id}`);
        this.logger.log(`👤 [getSessionDetails] Session Owner: ${session.userId}, Requesting User: ${userId}`);

        // User ownership already verified in query, so we know they match

        // Populate astrologer if needed
        let astrologer: any = null;
        if (session.astrologerId) {
            astrologer = await this.aiAstrologerModel.findById(session.astrologerId).lean();
            if (!astrologer) {
                this.logger.warn(`⚠️ [getSessionDetails] Astrologer ID ${session.astrologerId} not found in AI Profile DB.`);
            } else {
                this.logger.log(`✅ [getSessionDetails] Populated astrologer: ${astrologer.name}`);
            }
        } else {
            this.logger.warn(`⚠️ [getSessionDetails] Session has no astrologerId!`);
        }

        // 3. Fetch messages for the session (CRITICAL for showing history/greeting)
        const messages = await this.getRecentMessages(session.sessionId, 50);
        this.logger.log(`💬 [getSessionDetails] Found ${messages.length} messages for session ${session.sessionId}`);

        return {
            ...session,
            astrologer,
            messages
        };
    }

    async getAiChatHistory(userId: string, page: number, limit: number): Promise<{ history: any[], total: number }> {
        const skip = (page - 1) * limit;
        const [history, total] = await Promise.all([
            this.chatSessionModel.find({ userId, orderId: /^AI-/ })
                .populate('astrologerId', 'name image specialization bio expertise rating experience')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.chatSessionModel.countDocuments({ userId, orderId: /^AI-/ })
        ]);

        const mappedHistory = history.map(session => ({
            ...session,
            _id: session._id.toString(),
            totalMessages: session.messageCount || 0,
            startedAt: session.startTime || session.createdAt,
            astrologer: session.astrologerId ? {
                ...session.astrologerId,
                name: (session.astrologerId as any).name,
                profileImage: (session.astrologerId as any).image,
                experienceYears: (session.astrologerId as any).experience || 5
            } : null
        }));

        return { history: mappedHistory, total };
    }



    async getRecentMessages(sessionId: string, limit: number = 10): Promise<any[]> {
        return this.chatMessageModel.find({
            $or: [{ sessionId }, { orderId: sessionId }]
        })
            .sort({ sentAt: -1 })
            .limit(limit)
            .sort({ sentAt: 1 }) // Return in chronological order
            .lean();
    }
}

import { Injectable, NotFoundException, BadRequestException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallSession, CallSessionDocument } from '../schemas/call-session.schema';
import { OrdersService } from '../../orders/services/orders.service';
import { OrderPaymentService } from '../../orders/services/order-payment.service';
import { WalletService } from '../../payments/services/wallet.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { ChatMessageService } from '../../chat/services/chat-message.service';
import { Astrologer, AstrologerDocument } from '../../astrologers/schemas/astrologer.schema';
import { EarningsService } from '../../astrologers/services/earnings.service';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { PenaltyService } from '../../astrologers/services/penalty.service';
import { CallGateway } from '../gateways/calls.gateway';
import { AstrologerBlockingService } from '../../astrologers/services/astrologer-blocking.service';
import { UserBlockingService } from 'src/users/services/user-blocking.service';
import { AvailabilityService } from '../../astrologers/services/availability.service';

@Injectable()
export class CallSessionService {
  private readonly logger = new Logger(CallSessionService.name);
  private sessionTimers = new Map<string, NodeJS.Timeout>();
  private joinTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectModel(CallSession.name) private sessionModel: Model<CallSessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Astrologer.name) private astrologerModel: Model<AstrologerDocument>,
    @Inject(forwardRef(() => CallGateway))
    private callGateway: CallGateway,
    private ordersService: OrdersService,
    private orderPaymentService: OrderPaymentService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private notificationService: NotificationService,
    private chatMessageService: ChatMessageService,
    private earningsService: EarningsService,
    private penaltyService: PenaltyService,
    private blockingService: AstrologerBlockingService,
    private userBlockingService: UserBlockingService,
    private availabilityService: AvailabilityService,
  ) { }

  private generateSessionId(): string {
    return `CALL_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  private toObjectId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
  }

  // ===== INITIATE CALL =====
  async initiateCall(sessionData: {
    userId: string;
    astrologerId: string;
    astrologerName: string;
    callType: 'audio' | 'video';
    ratePerMinute: number;
  }): Promise<any> {
    const isBlocked = await this.blockingService.isUserBlocked(sessionData.astrologerId, sessionData.userId);
    if (isBlocked) {
      throw new BadRequestException('You have been blocked by this astrologer.');
    }

    // ✅ PREVENT DOUBLE CALLS: Check if user already has an active/pending session
    const existingSession = await this.sessionModel.findOne({
      userId: this.toObjectId(sessionData.userId),
      status: { $in: ['initiated', 'waiting', 'waiting_in_queue', 'active'] }
    });

    if (existingSession) {
      throw new BadRequestException('You already have an active call request. Please wait or end it before starting a new one.');
    }

    // ✅ PREVENT DOUBLE BOOKING: Strict check against astrologer's Real-Time Availability
    const isAvailable = await this.availabilityService.isAvailableNow(sessionData.astrologerId);
    if (!isAvailable) {
      throw new BadRequestException('Astrologer is currently busy or offline. Please try again later.');
    }
    const isAstrologerBlocked = await this.userBlockingService.isAstrologerBlocked(this.toObjectId(sessionData.userId), sessionData.astrologerId);
    if (isAstrologerBlocked) {
      throw new BadRequestException('You have blocked this astrologer. Unblock them to continue.');
    }
    const estimatedCost = sessionData.ratePerMinute * 5;
    const hasBalance = await this.walletService.checkBalance(
      sessionData.userId,
      estimatedCost
    );

    if (!hasBalance) {
      throw new BadRequestException(
        `Insufficient balance. Minimum ₹${estimatedCost} required to start call.`
      );
    }

    const sessionId = this.generateSessionId();

    const conversationThread = await this.ordersService.findOrCreateConversationThread(
      sessionData.userId,
      sessionData.astrologerId,
      sessionData.astrologerName,
      sessionData.ratePerMinute
    );

    const order = await this.ordersService.createOrder({
      userId: sessionData.userId,
      astrologerId: sessionData.astrologerId,
      astrologerName: sessionData.astrologerName,
      type: 'call',
      callType: sessionData.callType,
      ratePerMinute: sessionData.ratePerMinute,
      sessionId: sessionId
    });

    const sessionNumber = order.sessionHistory.filter(s =>
      s.sessionType === 'audio_call' || s.sessionType === 'video_call'
    ).length + 1;

    const session = new this.sessionModel({
      sessionId,
      userId: this.toObjectId(sessionData.userId),
      astrologerId: this.toObjectId(sessionData.astrologerId),
      orderId: order.orderId,
      conversationThreadId: order.conversationThreadId,
      sessionNumber,
      callType: sessionData.callType,
      ratePerMinute: sessionData.ratePerMinute,
      status: 'initiated',
      requestCreatedAt: new Date(),
      ringTime: new Date(),
      maxDurationMinutes: 0,
      maxDurationSeconds: 0,
      timerStatus: 'not_started',
      timerMetrics: {
        elapsedSeconds: 0,
        remainingSeconds: 0
      },
      userStatus: {
        userId: this.toObjectId(sessionData.userId),
        isOnline: false,
        isMuted: false,
        isVideoOn: sessionData.callType === 'video',
        connectionQuality: 'offline'
      },
      astrologerStatus: {
        astrologerId: this.toObjectId(sessionData.astrologerId),
        isOnline: false,
        isMuted: false,
        isVideoOn: sessionData.callType === 'video',
        connectionQuality: 'offline'
      }
    });

    await session.save();

    this.setRequestTimeout(sessionId, order.orderId, sessionData.userId);

    const astroNotifType = sessionData.callType === 'video' ? 'call_request_video' : 'call_request_audio';

    const user = await this.userModel.findById(sessionData.userId).select('name profileImage').lean();
    const userName = user?.name || 'User';
    const userProfilePic = user?.profileImage || '';

    this.notificationService.sendNotification({
      recipientId: sessionData.astrologerId,
      recipientModel: 'Astrologer',
      type: astroNotifType,
      title: 'Incoming call request',
      message: `You have a new ${sessionData.callType} call request.`,
      data: {
        type: astroNotifType,
        mode: 'call',
        callType: sessionData.callType,
        sessionId,
        orderId: order.orderId,
        conversationThreadId: order.conversationThreadId,
        userId: sessionData.userId,
        userName,
        userProfilePic,
        astrologerId: sessionData.astrologerId,
        ratePerMinute: sessionData.ratePerMinute,
        sessionNumber,
        step: 'user_initiated',
        fullScreen: 'true',
      },
      priority: 'urgent',
    }).catch(err => this.logger.error(`Call incoming notification error: ${err.message}`));

    return {
      success: true,
      message: 'Call initiated - waiting for astrologer',
      data: {
        sessionId: session.sessionId,
        orderId: order.orderId,
        conversationThreadId: order.conversationThreadId,
        sessionNumber,
        status: 'initiated',
        callType: sessionData.callType,
        ratePerMinute: sessionData.ratePerMinute
      }
    };
  }

  // ===== ACCEPT CALL =====
  async acceptCall(sessionId: string, astrologerId: string): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId });
    if (!session) throw new NotFoundException('Session not found');

    if (session.status !== 'initiated') {
      throw new BadRequestException('Call not in initiated state');
    }

    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId)!);
      this.sessionTimers.delete(sessionId);
    }

    session.status = 'waiting';
    session.acceptedAt = new Date();
    await session.save();

    // ✅ Temporarily mark as busy for 2 minutes while ringing (user joins in next 60s)
    await this.availabilityService.setBusy(astrologerId, new Date(Date.now() + 2 * 60 * 1000));

    this.setUserJoinTimeout(sessionId);

    const userNotifType = session.callType === 'video' ? 'call_video' : 'call_audio';

    const astrologer = await this.astrologerModel.findById(astrologerId).select('name profilePicture').lean();
    const astrologerName = astrologer?.name || 'Astrologer';
    const astrologerImage = astrologer?.profilePicture || '';

    this.notificationService.sendNotification({
      recipientId: session.userId.toString(),
      recipientModel: 'User',
      type: userNotifType,
      title: 'Astrologer is ready',
      message: 'Tap to join your call now.',
      data: {
        type: userNotifType,
        mode: 'call',
        callType: session.callType,
        sessionId: session.sessionId,
        orderId: session.orderId,
        astrologerId,
        astrologerName,
        astrologerImage,
        ratePerMinute: session.ratePerMinute,
        step: 'astrologer_accepted',
      },
      priority: 'urgent',
    }).catch(err => this.logger.error(`Call accepted notification error: ${err.message}`));

    if (this.callGateway && typeof this.callGateway.notifyUserOfAcceptance === 'function') {
      this.callGateway.notifyUserOfAcceptance(sessionId, astrologerId, {
        orderId: session.orderId,
        callType: session.callType,
        ratePerMinute: session.ratePerMinute
      }).catch(err => this.logger.error(`Failed to emit call_accepted socket: ${err.message}`));
    }

    return {
      success: true,
      message: 'Call accepted',
      status: 'waiting',
      data: {
        sessionId: session.sessionId,
        orderId: session.orderId,
        callType: session.callType,
        ratePerMinute: session.ratePerMinute,
        astrologerId,
        astrologerName,
        astrologerImage,
        userId: session.userId
      }
    };
  }

  // ===== REJECT CALL =====
  async rejectCall(sessionId: string, astrologerId: string, reason: string): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId });

    if (!session) {
      // If not found, imply it's already gone
      throw new NotFoundException('Session not found');
    }

    // ✅ FIX: Be specific about state. If cancelled, return 'already cancelled' logic instead of erroring 
    if (session.status === 'cancelled' || session.status === 'rejected') {
      // Return success so controller doesn't throw 400
      return { success: true, message: 'Call already cancelled' };
    }

    if (session.status !== 'initiated' && session.status !== 'waiting') {
      throw new BadRequestException(`Call cannot be rejected at this stage (${session.status})`);
    }

    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId)!);
      this.sessionTimers.delete(sessionId);
    }

    session.status = 'rejected';
    session.endedBy = astrologerId;
    session.endReason = 'astrologer_rejected';
    session.endTime = new Date();
    await session.save();

    // ✅ Clear busy status since the call was rejected
    await this.availabilityService.setAvailable(astrologerId);

    // Apply Penalty Logic
    try {
      await this.penaltyService.applyPenalty({
        astrologerId,
        type: 'missed_appointment',
        amount: 30, // ₹30 penalty for rejecting call
        reason: 'Call request rejected',
        description: `Rejected ${session.callType} call request`,
        orderId: session.orderId,
        userId: session.userId.toString(),
        appliedBy: 'system',
      });
    } catch (error: any) {
      this.logger.error(`❌ Failed to apply penalty: ${error.message}`);
    }

    try {
      await this.ordersService.cancelOrder(session.orderId, session.userId.toString(), reason, 'astrologer');
    } catch (e: any) {
      this.logger.error(`❌ Failed to cancel order during call rejection: ${e.message}`);
    }

    // Send Push Notification
    this.notificationService.sendNotification({
      recipientId: session.userId.toString(),
      recipientModel: 'User',
      type: 'request_rejected',
      title: 'Call request rejected',
      message: 'Astrologer rejected your call request.',
      data: {
        type: 'request_rejected',
        mode: 'call',
        sessionId: session.sessionId,
      },
      priority: 'high',
    }).catch(err => this.logger.error(`Call rejected notification error: ${err.message}`));

    if (this.callGateway && typeof this.callGateway.notifyUserOfRejection === 'function') {
      this.callGateway.notifyUserOfRejection(sessionId, astrologerId, reason)
        .catch(err => this.logger.error(`Failed to emit call_rejected socket: ${err.message}`));
    }

    return { success: true, message: 'Call rejected' };
  }

  // ===== START CALL SESSION =====
  async startSession(sessionId: string): Promise<any> {
    const session = await this.getSession(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    // ✅ CHECK: If already active, return existing state immediately
    if (session.status === 'active') {
      this.logger.warn(`Session ${sessionId} is already active. Returning existing state.`);
      return {
        success: true,
        message: 'Call session already active',
        data: {
          status: 'active',
          maxDurationMinutes: session.maxDurationMinutes,
          maxDurationSeconds: session.maxDurationSeconds,
          ratePerMinute: session.ratePerMinute,
          callType: session.callType,
        },
      };
    }

    if (session.status !== 'waiting' && session.status !== 'waiting_in_queue') {
      throw new BadRequestException(`Session not in valid state to start: ${session.status}`);
    }

    const walletBalance = await this.walletService.getBalance(session.userId.toString());
    const maxDurationMinutes = Math.floor(walletBalance / session.ratePerMinute);
    const maxDurationSeconds = maxDurationMinutes * 60;

    if (maxDurationMinutes < 1) {
      throw new BadRequestException('Insufficient balance to start call');
    }

    session.status = 'active';
    session.startTime = new Date();
    session.maxDurationMinutes = maxDurationMinutes;
    session.maxDurationSeconds = maxDurationSeconds;
    session.timerStatus = 'running';
    session.timerMetrics.elapsedSeconds = 0;
    session.timerMetrics.remainingSeconds = maxDurationSeconds;
    session.timerMetrics.lastUpdatedAt = new Date();

    // ✅ Set accurate Wait Time for the User App
    const busyUntil = new Date(Date.now() + maxDurationSeconds * 1000);
    await this.availabilityService.setBusy(session.astrologerId.toString(), busyUntil);

    if (session.userStatus) {
      session.userStatus.isOnline = true;
      session.userStatus.connectionQuality = 'good';
    }
    if (session.astrologerStatus) {
      session.astrologerStatus.isOnline = true;
      session.astrologerStatus.connectionQuality = 'good';
    }

    await session.save();
    this.clearUserJoinTimeout(sessionId);
    await this.ordersService.updateOrderStatus(session.orderId, 'active');
    this.setAutoEndTimer(sessionId, maxDurationSeconds);

    this.logger.log(`Call session started: ${sessionId}`);

    return {
      success: true,
      message: 'Call session started',
      data: {
        status: 'active',
        maxDurationMinutes,
        maxDurationSeconds,
        ratePerMinute: session.ratePerMinute,
        callType: session.callType,
      },
    };
  }

  // ===== END CALL SESSION (OPTIMIZED) =====
  async endSession(
    sessionId: string,
    endedBy: string,
    reason: string,
    recordingUrl?: string,         // Optional now
    recordingS3Key?: string,       // Optional now
    recordingDuration?: number,    // Optional now
  ): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId });
    if (!session) throw new NotFoundException('Session not found');

    if (this.sessionTimers.has(sessionId)) {
      clearTimeout(this.sessionTimers.get(sessionId)!);
      this.sessionTimers.delete(sessionId);
    }

    // Idempotency Check
    if (session.status === 'ended' || session.status === 'cancelled') {
      return {
        success: true,
        message: 'Call session already ended',
        data: {
          sessionId,
          actualDuration: session.duration || 0,
          billedMinutes: session.billedMinutes || 0,
          chargeAmount: session.totalAmount || 0,
          status: session.status
        }
      };
    }

    let actualDurationSeconds = 0;

    if (session.status === 'active' && session.startTime) {
      const endTime = new Date();
      actualDurationSeconds = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      if (reason === 'timeout' && actualDurationSeconds > session.maxDurationSeconds) {
        actualDurationSeconds = session.maxDurationSeconds;
      }

      session.duration = actualDurationSeconds;
      session.billedMinutes = Math.max(1, Math.ceil(actualDurationSeconds / 60));

      session.totalAmount = session.billedMinutes * session.ratePerMinute;
      session.platformCommission = (session.totalAmount * 50) / 100;
      session.astrologerEarning = session.totalAmount - session.platformCommission;
    }

    // Process Payment
    if (session.status === 'active' && session.totalAmount > 0) {
      try {
        const [user, astrologer] = await Promise.all([
          this.userModel.findById(session.userId).select('name').lean(),
          this.astrologerModel.findById(session.astrologerId).select('name').lean(),
        ]);

        const paymentResult = await this.walletService.processSessionPayment({
          userId: session.userId.toString(),
          astrologerId: session.astrologerId.toString(),
          amount: session.totalAmount,
          orderId: session.orderId,
          sessionId: session.sessionId,
          sessionType: session.callType === 'audio' ? 'audio_call' : 'video_call',
          userName: user?.name || 'User',
          astrologerName: astrologer?.name || 'Astrologer',
          durationMinutes: session.billedMinutes,
        });

        if (paymentResult.success) {
          await this.earningsService.updateEarnings(
            session.astrologerId.toString(),
            session.totalAmount,
            'call',
          );
          session.isPaid = true;
        }
      } catch (error: any) {
        this.logger.error(`❌ Payment failed for session ${sessionId}: ${error.message}`);
        session.isPaid = false;
      }
    }

    session.status = 'ended';
    session.endTime = new Date();
    session.endedBy = endedBy;
    session.endReason = reason;
    session.timerStatus = 'ended';

    // ✅ If recording is provided immediately (unlikely in parallel mode, but supported)
    if (recordingUrl && actualDurationSeconds > 0) {
      session.hasRecording = true;
      session.recordingUrl = recordingUrl;
      session.recordingS3Key = recordingS3Key;
      session.recordingDuration = recordingDuration || actualDurationSeconds;
      session.recordingType = session.callType === 'audio' ? 'voice_note' : 'video';
      session.recordingStartedAt = session.startTime;
      session.recordingEndedAt = new Date();

      // Async chat message creation
      this.createRecordingChatMessage(
        sessionId, session.orderId, session.conversationThreadId!,
        session.userId.toString(), session.astrologerId.toString(),
        session.callType as 'audio' | 'video', recordingUrl, recordingS3Key!,
        session.recordingDuration, actualDurationSeconds
      ).then(mid => {
        this.sessionModel.updateOne({ sessionId }, { recordingMessageId: mid }).exec();
      }).catch(e => this.logger.error('Chat msg failed', e));
    }

    if (session.userStatus) session.userStatus.isOnline = false;
    if (session.astrologerStatus) session.astrologerStatus.isOnline = false;

    await session.save();

    // ✅ Clear busy status since the call ended
    await this.availabilityService.setAvailable(session.astrologerId.toString());

    // Async Order Completion
    this.ordersService.completeSession(session.orderId, {
      sessionId: sessionId,
      sessionType: session.callType === 'audio' ? 'audio_call' : 'video_call',
      actualDurationSeconds: actualDurationSeconds,
      billedMinutes: session.billedMinutes,
      chargedAmount: session.totalAmount,
      recordingUrl: recordingUrl,
      recordingS3Key: recordingS3Key,
      recordingDuration: session.recordingDuration,
      endedBy: session.endedBy,
    }).catch(e => this.logger.error('Order completion update failed', e));

    return {
      success: true,
      message: 'Call session ended',
      data: {
        sessionId,
        actualDuration: actualDurationSeconds,
        billedMinutes: session.billedMinutes,
        chargeAmount: session.totalAmount,
        status: 'ended',
      },
    };
  }

  // ✅ NEW METHOD: Called asynchronously by Gateway after recording stops
  async updateRecordingAfterEnd(sessionId: string, url: string, key: string, duration: number) {
    try {
      const session = await this.sessionModel.findOne({ sessionId });
      if (!session) return;

      session.hasRecording = true;
      session.recordingUrl = url;
      session.recordingS3Key = key;
      session.recordingDuration = duration || session.duration;
      // Ensure correct Enum value
      session.recordingType = session.callType === 'audio' ? 'voice_note' : 'video';

      await session.save();
      this.logger.log(`🎥 Recording updated for ended session: ${sessionId}`);

      // 1. Sync to Chat Message
      await this.createRecordingChatMessage(
        sessionId, session.orderId, session.conversationThreadId!,
        session.userId.toString(), session.astrologerId.toString(),
        session.callType as 'audio' | 'video', url, key, session.recordingDuration, session.duration
      );

      // 2. ✅ Sync to Order History (FIX FOR ADMIN PANEL)
      await this.ordersService.updateSessionRecording(
        session.orderId,
        sessionId,
        {
          recordingUrl: url,
          recordingS3Key: key,
          recordingDuration: duration,
          recordingType: session.recordingType
        }
      );

    } catch (e) {
      this.logger.error(`Failed to update recording for ${sessionId}: ${e.message}`);
    }
  }

  /**
   * Find and extend any active session for a specific user
   */
  async extendActiveSessionForUser(userId: string): Promise<any> {
    const activeSession = await this.sessionModel.findOne({
      userId: this.toObjectId(userId),
      status: 'active'
    });

    if (activeSession) {
      return this.extendActiveSession(activeSession.sessionId);
    }
  }

  private async createRecordingChatMessage(sessionId: string, orderId: string, conversationThreadId: string, userId: string, astrologerId: string, callType: 'audio' | 'video', recordingUrl: string, recordingS3Key: string, recordingDuration: number, actualDurationSeconds: number): Promise<string> {
    const mins = Math.floor(actualDurationSeconds / 60);
    const secs = actualDurationSeconds % 60;
    const durationText = `${mins}:${String(secs).padStart(2, '0')}`;
    const messageType = callType === 'video' ? 'video' : 'voice_note';
    const content = callType === 'video' ? `📹 Video Call Recording - ${durationText}` : `🎤 Voice Call Recording - ${durationText}`;

    const message = await this.chatMessageService.sendMessage({
      sessionId: sessionId, orderId: orderId, senderId: userId, senderModel: 'System' as any, receiverId: astrologerId, receiverModel: 'Astrologer',
      type: messageType, content, fileUrl: recordingUrl, fileS3Key: recordingS3Key, fileDuration: recordingDuration, isCallRecording: true, linkedSessionId: sessionId,
    });
    return message.messageId;
  }

  private setRequestTimeout(sessionId: string, orderId: string, userId: string) {
    const timeout = setTimeout(async () => {
      try {
        const session = await this.sessionModel.findOne({ sessionId });
        if (!session || (session.status !== 'initiated' && session.status !== 'waiting')) return;

        session.status = 'cancelled';
        session.endReason = 'astrologer_no_response';
        session.endTime = new Date();
        await session.save();

        // ✅ Clear busy status since the call was cancelled by timeout
        await this.availabilityService.setAvailable(session.astrologerId.toString());

        try {
          await this.penaltyService.applyPenalty({
            astrologerId: session.astrologerId.toString(),
            type: 'late_response',
            amount: 30, // ₹30 penalty for not responding to call
            reason: 'No response to call request',
            description: `Did not respond to ${session.callType} call request within 3 minutes`,
            orderId: session.orderId,
            userId: session.userId.toString(),
            appliedBy: 'system',
          });
        } catch (error: any) { }

        await this.ordersService.handleOrderTimeout(orderId);
        this.sessionTimers.delete(sessionId);
      } catch (error: any) { }
    }, 3 * 60 * 1000);
    this.sessionTimers.set(sessionId, timeout);
  }

  private setAutoEndTimer(sessionId: string, maxDurationSeconds: number) {
    const timeout = setTimeout(async () => {
      try {
        await this.endSession(sessionId, 'system', 'timeout');
        this.sessionTimers.delete(sessionId);
      } catch (error: any) { }
    }, maxDurationSeconds * 1000);
    this.sessionTimers.set(sessionId, timeout);
  }

  /**
   * Extend an active session (e.g., after recharge)
   */
  async extendActiveSession(sessionId: string): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId });
    if (!session || session.status !== 'active') return;

    const user = await this.userModel.findById(session.userId).select('wallet').lean();
    if (!user) return;

    const currentBalance = user.wallet.balance || 0;
    const newMaxDurationMinutes = Math.floor(currentBalance / session.ratePerMinute);
    const newMaxDurationSeconds = newMaxDurationMinutes * 60;

    if (newMaxDurationSeconds > session.maxDurationSeconds) {
      this.logger.log(`📈 Extending call session ${sessionId}: ${session.maxDurationSeconds}s -> ${newMaxDurationSeconds}s`);

      session.maxDurationSeconds = newMaxDurationSeconds;
      await session.save();

      // 1. Update the Service-level auto-end timeout
      if (this.sessionTimers.has(sessionId)) {
        clearTimeout(this.sessionTimers.get(sessionId)!);
      }
      this.setAutoEndTimer(sessionId, newMaxDurationSeconds);

      // 2. Update the Gateway-level ticker
      this.callGateway.updateSessionTimer(sessionId, newMaxDurationSeconds);

      // 3. Update Busy status
      const busyUntil = new Date(Date.now() + newMaxDurationSeconds * 1000);
      await this.availabilityService.setBusy(session.astrologerId.toString(), busyUntil);

      return {
        success: true,
        newMaxDurationSeconds
      };
    }
  }

  private setUserJoinTimeout(sessionId: string) {
    if (this.joinTimers.has(sessionId)) {
      clearTimeout(this.joinTimers.get(sessionId)!);
      this.joinTimers.delete(sessionId);
    }
    const timeout = setTimeout(async () => {
      try {
        const session = await this.sessionModel.findOne({ sessionId });
        if (!session) return;
        if (session.status === 'waiting' || session.status === 'waiting_in_queue') {
          await this.callGateway.terminateCall(sessionId, 'system', 'user_no_show');
        }
        this.joinTimers.delete(sessionId);
      } catch (error: any) { }
    }, 60 * 1000);
    this.joinTimers.set(sessionId, timeout);
  }

  private clearUserJoinTimeout(sessionId: string) {
    if (this.joinTimers.has(sessionId)) {
      clearTimeout(this.joinTimers.get(sessionId)!);
      this.joinTimers.delete(sessionId);
    }
  }

  async getSession(sessionId: string): Promise<CallSessionDocument | null> {
    return this.sessionModel.findOne({ sessionId }).exec();
  }

  async getUserActiveSessions(userId: string): Promise<CallSessionDocument[]> {
    return this.sessionModel
      .find({
        userId: this.toObjectId(userId),
        status: { $in: ['initiated', 'waiting', 'waiting_in_queue', 'active'] }
      })
      .populate('astrologerId', 'name profilePicture isOnline')
      .sort({ createdAt: -1 });
  }

  async updateParticipantStatus(sessionId: string, userId: string, role: string, statusUpdate: any): Promise<void> {
    const updateField = role === 'user' ? 'userStatus' : 'astrologerStatus';
    const updateObj: any = {};
    Object.keys(statusUpdate).forEach(key => {
      updateObj[`${updateField}.${key}`] = statusUpdate[key];
    });
    await this.sessionModel.findOneAndUpdate({ sessionId }, { $set: updateObj });
  }

  async endCall(sessionId: string, options: { endedBy: string; reason: string }): Promise<any> {
    return this.endSession(sessionId, options.endedBy, options.reason);
  }

  async continueCall(sessionId: string, userId: string): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId, userId: this.toObjectId(userId), isActive: true });
    if (!session) throw new NotFoundException('Call not found');
    const walletBalance = await this.walletService.getBalance(userId);
    const maxDurationMinutes = Math.floor(walletBalance / session.ratePerMinute);
    if (maxDurationMinutes < 5) throw new BadRequestException(`Insufficient balance.`);
    session.maxDurationMinutes = maxDurationMinutes;
    session.status = 'waiting';
    await session.save();
    return { success: true, message: 'Call ready', sessionId, maxDurationMinutes, callType: session.callType };
  }

  async cancelCall(sessionId: string, userId: string, reason: string, cancelledBy: any): Promise<any> {
    const session = await this.sessionModel.findOne({ sessionId, userId: this.toObjectId(userId), status: { $in: ['initiated', 'waiting'] } });
    if (!session) throw new NotFoundException('Call not found');
    session.status = 'cancelled';
    session.endReason = reason;
    session.endedBy = cancelledBy;
    session.endTime = new Date();
    await session.save();

    // ✅ Clear busy status since the call was cancelled by user
    await this.availabilityService.setAvailable(session.astrologerId.toString());

    return { success: true, message: 'Call cancelled' };
  }

  async getAstrologerCallSessions(
    astrologerId: string,
    filters: { page: number; limit: number; status?: string }
  ): Promise<any> {
    const skip = (filters.page - 1) * filters.limit;
    const query: any = {
      astrologerId: this.toObjectId(astrologerId)
    };

    if (filters.status) {
      query.status = filters.status;
    }

    const [sessions, total] = await Promise.all([
      this.sessionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .populate('userId', 'name profileImage phoneNumber')
        .lean(),
      this.sessionModel.countDocuments(query)
    ]);

    return {
      success: true,
      data: {
        sessions,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      }
    };
  }

  async getAstrologerCallSessionDetails(sessionId: string, astrologerId: string): Promise<any> {
    const session = await this.sessionModel.findOne({
      sessionId,
      astrologerId: this.toObjectId(astrologerId)
    })
      .populate('userId', 'name profileImage phoneNumber gender dateOfBirth placeOfBirth timeOfBirth')
      .lean();

    if (!session) {
      throw new NotFoundException('Call session not found');
    }

    return { success: true, data: session };
  }

  async getCallHistory(userId: string, page: number, limit: number): Promise<any> {
    const skip = (page - 1) * limit;
    const query = { userId: this.toObjectId(userId) };

    const [sessions, total] = await Promise.all([
      this.sessionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('astrologerId', 'name profilePicture')
        .lean(),
      this.sessionModel.countDocuments(query)
    ]);

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

}
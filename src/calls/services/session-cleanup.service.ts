import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CallSessionService } from './call-session.service';
import { ChatSessionService } from '../../chat/services/chat-session.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CallSession, CallSessionDocument } from '../schemas/call-session.schema';
import { ChatSession, ChatSessionDocument } from '../../chat/schemas/chat-session.schema';
import { AvailabilityService } from '../../astrologers/services/availability.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(
    private readonly callSessionService: CallSessionService,
    private readonly chatSessionService: ChatSessionService,
    private readonly availabilityService: AvailabilityService,
    @InjectModel(CallSession.name) private callModel: Model<CallSessionDocument>,
    @InjectModel(ChatSession.name) private chatModel: Model<ChatSessionDocument>,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async cleanupStaleSessions() {
    this.logger.log('Checking for stale call and chat sessions...');
    await Promise.all([
      this.cleanupCalls(),
      this.cleanupChats(),
    ]);
  }

  private async cleanupCalls() {
    const OFFLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes offline threshold
    const INITIATED_THRESHOLD = 3 * 60 * 1000; // 3 minutes timeout for acceptance
    const WAITING_THRESHOLD = 3 * 60 * 1000; // 3 minutes timeout for joining
    const now = new Date();

    try {
      // 1. Clean up active calls where a party triggers offline threshold
      const staleCalls = await this.callModel.find({
        status: 'active',
        $or: [
          { 'astrologerStatus.isOnline': false, 'astrologerStatus.lastSeen': { $lt: new Date(now.getTime() - OFFLINE_THRESHOLD) } },
          { 'userStatus.isOnline': false, 'userStatus.lastSeen': { $lt: new Date(now.getTime() - OFFLINE_THRESHOLD) } },
        ]
      });

      for (const call of staleCalls) {
        this.logger.warn(`[Cleanup] Ending stale active Call: ${call.sessionId} due to offline participant`);
        await this.callSessionService.endSession(call.sessionId, 'system', 'stale_timeout');
      }

      // 2. Clean up initiated requests (Astrologer did not accept in 3 mins)
      const hangingInitiated = await this.callModel.find({
        status: 'initiated',
        requestCreatedAt: { $lt: new Date(now.getTime() - INITIATED_THRESHOLD) }
      });

      for (const call of hangingInitiated) {
        this.logger.warn(`[Cleanup] Cancelling initiated Call request: ${call.sessionId} due to no response`);
        await this.callModel.updateOne({ sessionId: call.sessionId }, { 
          status: 'cancelled', 
          endReason: 'astrologer_no_response_timeout', 
          endTime: new Date(),
          endedBy: 'system'
        });
        await this.availabilityService.setAvailable(call.astrologerId.toString());
      }

      // 3. Clean up waiting requests (User did not join in 60s)
      const hangingWaiting = await this.callModel.find({
        status: { $in: ['waiting', 'waiting_in_queue'] },
        acceptedAt: { $lt: new Date(now.getTime() - WAITING_THRESHOLD) }
      });

      for (const call of hangingWaiting) {
        this.logger.warn(`[Cleanup] Cancelling waiting Call: ${call.sessionId} due to user no-show`);
        await this.callModel.updateOne({ sessionId: call.sessionId }, { 
          status: 'cancelled', 
          endReason: 'user_no_show_timeout', 
          endTime: new Date(),
          endedBy: 'system'
        });
        await this.availabilityService.setAvailable(call.astrologerId.toString());
      }

    } catch (e: any) {
      this.logger.error(`Error during Call cleanup: ${e.message}`);
    }
  }

  private async cleanupChats() {
    const OFFLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes offline threshold
    const INITIATED_THRESHOLD = 3 * 60 * 1000; // 3 minutes timeout for acceptance
    const WAITING_THRESHOLD = 3 * 60 * 1000; // 3 minutes timeout for joining
    const now = new Date();

    try {
      // 1. Clean up active chats where a party triggers offline threshold
      const staleChats = await this.chatModel.find({
        status: 'active',
        $or: [
          { 'astrologerStatus.isOnline': false, 'astrologerStatus.lastSeen': { $lt: new Date(now.getTime() - OFFLINE_THRESHOLD) } },
          { 'userStatus.isOnline': false, 'userStatus.lastSeen': { $lt: new Date(now.getTime() - OFFLINE_THRESHOLD) } },
        ]
      });

      for (const chat of staleChats) {
        this.logger.warn(`[Cleanup] Ending stale active Chat: ${chat.sessionId} due to offline participant`);
        await this.chatSessionService.endSession(chat.sessionId, 'system', 'stale_timeout');
      }

      // 2. Clean up initiated requests (Astrologer did not accept in 3 mins)
      const hangingInitiated = await this.chatModel.find({
        status: 'initiated',
        requestCreatedAt: { $lt: new Date(now.getTime() - INITIATED_THRESHOLD) }
      });

      for (const chat of hangingInitiated) {
        this.logger.warn(`[Cleanup] Cancelling initiated Chat request: ${chat.sessionId} due to no response`);
        await this.chatModel.updateOne({ sessionId: chat.sessionId }, { 
          status: 'cancelled', 
          endReason: 'astrologer_no_response_timeout', 
          endTime: new Date(),
          endedBy: 'system'
        });
        await this.availabilityService.setAvailable(chat.astrologerId.toString());
      }

      // 3. Clean up waiting requests (User did not join in 60s)
      const hangingWaiting = await this.chatModel.find({
        status: { $in: ['waiting', 'waiting_in_queue'] },
        acceptedAt: { $lt: new Date(now.getTime() - WAITING_THRESHOLD) }
      });

      for (const chat of hangingWaiting) {
        this.logger.warn(`[Cleanup] Cancelling waiting Chat: ${chat.sessionId} due to user no-show`);
        await this.chatModel.updateOne({ sessionId: chat.sessionId }, { 
          status: 'cancelled', 
          endReason: 'user_no_show_timeout', 
          endTime: new Date(),
          endedBy: 'system'
        });
        await this.availabilityService.setAvailable(chat.astrologerId.toString());
      }

    } catch (e: any) {
      this.logger.error(`Error during Chat cleanup: ${e.message}`);
    }
  }
}

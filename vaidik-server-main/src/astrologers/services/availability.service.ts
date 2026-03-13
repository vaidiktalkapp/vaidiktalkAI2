import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Astrologer, AstrologerDocument } from '../schemas/astrologer.schema';
import { UpdateWorkingHoursDto } from '../dto/update-working-hours.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { CallSession, CallSessionDocument } from '../../calls/schemas/call-session.schema';
import { ChatSession, ChatSessionDocument } from '../../chat/schemas/chat-session.schema';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Astrologer.name) private astrologerModel: Model<AstrologerDocument>,
    @InjectModel(CallSession.name) private callSessionModel: Model<CallSessionDocument>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
  ) { }

  /**
   * ✅ NEW: Check if astrologer has any active/initiated session
   */
  public async hasActiveSession(astrologerId: string | Types.ObjectId): Promise<boolean> {
    const activeStatuses = ['initiated', 'ringing', 'waiting', 'waiting_in_queue', 'active'];

    const [activeCall, activeChat] = await Promise.all([
      this.callSessionModel.exists({
        astrologerId,
        status: { $in: activeStatuses }
      }),
      this.chatSessionModel.exists({
        astrologerId,
        status: { $in: activeStatuses }
      })
    ]);

    return !!(activeCall || activeChat);
  }

  async getActiveSessionCount(astrologerId: string): Promise<number> {
    const activeStatuses = ['initiated', 'ringing', 'waiting', 'waiting_in_queue', 'active'];
    const [callCount, chatCount] = await Promise.all([
      this.callSessionModel.countDocuments({
        astrologerId: new Types.ObjectId(astrologerId),
        status: { $in: activeStatuses }
      }),
      this.chatSessionModel.countDocuments({
        astrologerId: new Types.ObjectId(astrologerId),
        status: { $in: activeStatuses }
      })
    ]);
    return callCount + chatCount;
  }

  public isWithinWorkingHours(workingHours: any[]): boolean {
    if (!workingHours?.length) return false;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];

    const todaySchedule = workingHours.find(w => w.day?.toLowerCase() === currentDay);

    // ✅ Fix: Allow missing 'isOpen' if slots exist (Robustness)
    if (!todaySchedule?.slots?.length) return false;
    if (todaySchedule.isOpen === false) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return todaySchedule.slots.some(slot => {
      if (slot.isActive === false) return false;
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      return currentMinutes >= (startH * 60 + startM) && currentMinutes < (endH * 60 + endM);
    });
  }

  /**
   * ✅ NEW STATUS LOGIC:
   * 1. Live -> 'live'
   * 2. isAvailable == false OR busyUntil -> 'busy' (Visible but occupied)
   * 3. Schedule OR isOnline -> 'online'
   */
  public getRealTimeStatus(astrologer: any): 'live' | 'busy' | 'online' | 'offline' {
    if (!astrologer || !astrologer.availability) return 'offline';
    const av = astrologer.availability;

    // 1. Live status
    if (av.isLive) return 'live';

    // 2. Reachability check FIRST
    const isManuallyOnline = av.isOnline === true; // explicit toggle
    const isScheduled = this.isWithinWorkingHours(av.workingHours); // weekly schedule
    const isReachable = isManuallyOnline || isScheduled;

    // 3. Not reachable at all — always offline (ignore any stale flags)
    if (!isReachable) return 'offline';

    // 4. Busy via timed session (applies to both manual and scheduled astrologers)
    const isBusyTimer = av.busyUntil && new Date(av.busyUntil) > new Date();
    if (isBusyTimer) return 'busy';

    // 5. Busy via manual flag ONLY for astrologers who explicitly turned on their toggle.
    //    If the astrologer is only "reachable" via schedule but isOnline is false,
    //    we cannot trust isAvailable=false (it may be stale from a previous session).
    const isBusyManual = isManuallyOnline && av.isAvailable === false;
    if (isBusyManual) return 'busy';

    return 'online';
  }

  async updateWorkingHours(astrologerId: string, updateDto: UpdateWorkingHoursDto): Promise<any> {
    const astrologer = await this.astrologerModel.findById(astrologerId);
    if (!astrologer) {
      throw new NotFoundException('Astrologer not found');
    }

    astrologer.availability.workingHours = updateDto.workingHours as any;
    await astrologer.save();

    return {
      success: true,
      message: 'Working hours updated successfully',
      data: astrologer.availability.workingHours
    };
  }

  async updateAvailability(astrologerId: string, updateDto: UpdateAvailabilityDto): Promise<any> {
    const updateFields: any = {};

    if (updateDto.isOnline !== undefined) {
      updateFields['availability.isOnline'] = updateDto.isOnline;
      // When going offline, clear stale busy flags so they don't linger
      if (updateDto.isOnline === false) {
        updateFields['availability.isAvailable'] = true;
        updateFields['availability.busyUntil'] = null;
      }
    }
    if (updateDto.isAvailable !== undefined) {
      updateFields['availability.isAvailable'] = updateDto.isAvailable;
    }
    if (updateDto.busyUntil !== undefined) {
      updateFields['availability.busyUntil'] = new Date(updateDto.busyUntil);
    }
    updateFields['availability.lastActive'] = new Date();

    const astrologer = await this.astrologerModel.findByIdAndUpdate(
      astrologerId,
      { $set: updateFields },
      { new: true }
    ).select('availability');

    if (!astrologer) {
      throw new NotFoundException('Astrologer not found');
    }

    return {
      success: true,
      message: 'Availability updated successfully',
      data: astrologer.availability
    };
  }

  async setBusy(astrologerId: string, busyUntil: Date): Promise<void> {
    await this.astrologerModel.findByIdAndUpdate(astrologerId, {
      $set: {
        'availability.isAvailable': false,
        'availability.busyUntil': busyUntil
      }
    });
  }

  async setAvailable(astrologerId: string): Promise<void> {
    await this.astrologerModel.findByIdAndUpdate(astrologerId, {
      $set: {
        'availability.isAvailable': true,
        'availability.busyUntil': null,
        'availability.lastActive': new Date()
      }
    });
  }

  /**
   * ✅ FIXED: Robust check for initiating calls/chats
   * Ensures no request is sent if already Live, Busy, or Offline
   */
  async isAvailableNow(astrologerId: string): Promise<boolean> {
    const astrologer = await this.astrologerModel.findById(astrologerId).select('availability accountStatus').lean();
    if (!astrologer || astrologer.accountStatus !== 'active') return false;

    const av = astrologer.availability;
    const now = new Date();

    // 1. Busy Logic (Always Enforced)
    if (av.isLive) return false;
    if (av.busyUntil && new Date(av.busyUntil) > now) return false;
    if (av.isAvailable === false) return false;

    // ✅ NEW: One User at a Time Enforcement
    const hasSession = await this.hasActiveSession(astrologerId);
    if (hasSession) return false;

    // 2. Priority Logic
    // ✔ Toggle ON = Universal availability
    if (av.isOnline) return true;

    // ✔ Toggle OFF = Follow schedule
    return this.isWithinWorkingHours(av.workingHours);
  }

  async getWorkingHours(astrologerId: string): Promise<any> {
    const astrologer = await this.astrologerModel
      .findById(astrologerId)
      .select('availability')
      .lean();

    if (!astrologer) {
      throw new NotFoundException('Astrologer not found');
    }

    return {
      success: true,
      data: astrologer.availability
    };
  }
}

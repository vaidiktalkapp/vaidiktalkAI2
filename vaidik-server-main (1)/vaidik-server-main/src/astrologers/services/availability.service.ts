import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Astrologer, AstrologerDocument } from '../schemas/astrologer.schema';
import { UpdateWorkingHoursDto } from '../dto/update-working-hours.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Astrologer.name) private astrologerModel: Model<AstrologerDocument>,
  ) {}

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

    // 1. Live
    if (av.isLive) return 'live';

    // 2. Busy (Manual Busy Flag OR Timer)
    // User confirmed: isAvailable=false means "Busy in call/chat", NOT Offline.
    if (av.isAvailable === false) return 'busy';
    if (av.busyUntil && new Date(av.busyUntil) > new Date()) return 'busy';

    // 3. Online (Manual Toggle OR Scheduled)
    const isScheduled = this.isWithinWorkingHours(av.workingHours);
    
    // If they are scheduled OR manually online, they are Online.
    // (Note: To take a break during schedule, the user must use a specific "Break" feature 
    // or we assume isOnline=false is the break. But for now, we follow the visibility rule).
    if (av.isOnline || isScheduled) {
       return 'online';
    }

    return 'offline';
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

    if (av.isLive) return false;
    if (av.busyUntil && new Date(av.busyUntil) > now) return false;
    if (av.isAvailable === false) return false; // Manual "Take a Break"

    // Allow if manually Online OR Scheduled
    const isScheduled = this.isWithinWorkingHours(av.workingHours);
    return (av.isOnline || isScheduled);
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

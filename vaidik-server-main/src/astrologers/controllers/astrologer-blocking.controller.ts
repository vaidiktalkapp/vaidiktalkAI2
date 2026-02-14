import { Controller, Post, Body, UseGuards, Req, BadRequestException, Get, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AstrologerBlockingService } from '../services/astrologer-blocking.service';

@Controller('astrologer') // Matches frontend route: /astrologer/block-user
@UseGuards(JwtAuthGuard)
export class AstrologerBlockingController {
  constructor(private readonly blockingService: AstrologerBlockingService) {}

  @Post('block-user')
  async blockUser(@Req() req, @Body() body: { userId: string; reason?: string }) {
    const astrologerId = req.user.userId; // Assumes logged-in user is an Astrologer
    
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.blockingService.blockUser(astrologerId, body.userId, body.reason);
  }

  @Delete('unblock-user/:userId')
  async unblockUser(@Req() req, @Param('userId') userId: string) {
    const astrologerId = req.user.userId;
    return this.blockingService.unblockUser(astrologerId, userId);
  }

  @Get('blocked-users')
  async getBlockedUsers(@Req() req) {
    const astrologerId = req.user.userId;
    return this.blockingService.getBlockedUsers(astrologerId);
  }
}
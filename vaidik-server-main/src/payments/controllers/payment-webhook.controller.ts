import { Controller, Post, Body, Headers, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { RazorpayService } from '../services/razorpay.service';

@Controller('webhooks/payment')
export class PaymentWebhookController {
  constructor(
    private walletService: WalletService,
    private razorpayService: RazorpayService,
  ) { }

  // Razorpay Webhook
  @Post('razorpay')
  async handleRazorpayWebhook(@Body() payload: any, @Res() res: Response) {
    try {
      // Handle different events
      if (payload.event === 'payment.captured') {
        const payment = payload.payload.payment.entity;
        await this.walletService.verifyPayment(
          payment.notes.transactionId,
          payment.id,
          'completed'
        );
      }

      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false });
    }
  }

  // Apple IAP Webhook (Server Notifications V2)
  @Post('apple')
  async handleAppleWebhook(@Body() payload: any, @Res() res: Response) {
    try {
      // Apple sends signed payloads (JWS). 
      // For now, we acknowledge to Apple that we received it.
      // In a full implementation, you'd decode this to handle refunds/revocations.
      console.log('🍎 Apple Webhook Received:', JSON.stringify(payload, null, 2));

      return res.status(HttpStatus.OK).send();
    } catch (error) {
      console.error('❌ Apple Webhook Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

}

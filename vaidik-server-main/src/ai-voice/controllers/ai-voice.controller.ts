import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AiVoiceService } from '../services/ai-voice.service';

@Controller('ai-voice')
export class AiVoiceController {
  private readonly logger = new Logger(AiVoiceController.name);

  constructor(private readonly aiVoiceService: AiVoiceService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiateCall(
    @Body() data: { userId: string; aiId: string; language?: string }
  ) {
    this.logger.log(`📥 Initiating AI Voice Call: User=${data.userId}, AI=${data.aiId}`);
    return this.aiVoiceService.initiateAiVoiceCall(data.userId, data.aiId, data.language);
  }

  @Post('webhook/vapi')
  @HttpCode(HttpStatus.OK)
  async handleVapiWebhook(@Body() payload: any) {
    this.logger.log(`📥 Received Vapi.ai Webhook: Type=${payload.type}`);
    return this.aiVoiceService.handleVapiWebhook(payload);
  }
}

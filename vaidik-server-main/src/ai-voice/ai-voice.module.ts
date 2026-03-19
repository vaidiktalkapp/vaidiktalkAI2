import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiVoiceController } from './controllers/ai-voice.controller';
import { AiVoiceService } from './services/ai-voice.service';
import { AiAstrologerProfile, AiAstrologerProfileSchema } from '../ai-astrologers/schemas/ai-astrologers-profile.schema';
import { CallSession, CallSessionSchema } from '../calls/schemas/call-session.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CallsModule } from '../calls/calls.module';
import { PaymentsModule } from '../payments/payments.module';
import { AiAstrologersModule } from '../ai-astrologers/ai-astrologers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiAstrologerProfile.name, schema: AiAstrologerProfileSchema },
      { name: CallSession.name, schema: CallSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CallsModule,
    PaymentsModule,
    AiAstrologersModule,
  ],
  controllers: [AiVoiceController],
  providers: [AiVoiceService],
  exports: [AiVoiceService],
})
export class AiVoiceModule {}

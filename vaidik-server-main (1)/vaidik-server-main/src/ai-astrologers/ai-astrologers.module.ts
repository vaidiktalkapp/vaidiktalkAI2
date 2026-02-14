import { Module, forwardRef } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { AiAstrologersController } from './controllers/ai-astrologers.controller';
import { AiOrdersController } from './controllers/ai-orders.controller';
import { AiHistoryController } from './controllers/ai-history.controller';
import { AiChatSessionService } from './services/chat-session.service';
import { AiAstrologyEngineService } from './services/ai-astrology-engine.service';
import { AiAnalyticsService } from './services/ai-analytics.service'; // Added import
import { AstronomyService } from './services/astronomy.service';
import { ChatSession, ChatSessionSchema } from '../chat/schemas/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/schemas/chat-message.schema';
import { AiAstrologerProfile, AiAstrologerProfileSchema } from './schemas/ai-astrologers-profile.schema';
import { WalletTransaction, WalletTransactionSchema } from '../payments/schemas/wallet-transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminModule } from '../admin/admin.module';
import { UploadModule } from '../upload/upload.module';
import { AiChatGateway } from './gateways/ai-chat.gateway';
import { AstrologersModule } from '../astrologers/astrologers.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ChatSession.name, schema: ChatSessionSchema },
            { name: ChatMessage.name, schema: ChatMessageSchema },
            { name: AiAstrologerProfile.name, schema: AiAstrologerProfileSchema },
            { name: WalletTransaction.name, schema: WalletTransactionSchema },
            { name: User.name, schema: UserSchema },
        ]), forwardRef(() => AdminModule),
        UploadModule,
        AstrologersModule,
    ],
    controllers: [AiAstrologersController, AiOrdersController, AiHistoryController],
    providers: [
        AiChatSessionService,
        AiAstrologyEngineService,
        AstronomyService,
        AiChatGateway,
        AiAnalyticsService, // Added to providers list
    ],
    exports: [AiChatSessionService, AiAstrologyEngineService, MongooseModule], // Export if needed by other modules
})
export class AiAstrologersModule { }

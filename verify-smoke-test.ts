
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { WalletService } from './src/payments/services/wallet.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const walletService = app.get(WalletService);
    const ChatSessionModel = app.get(getModelToken('ChatSession'));

    console.log('🚀 Starting Verification Smoke Test...');

    try {
        const result = await walletService.verifyPayment(
            'recharge_test_001',
            'pay_test_001',
            'completed'
        );

        console.log('✅ verifyPayment Result:', JSON.stringify(result, null, 2));

        // Wait a bit for the async triggerSessionExtension to finish
        console.log('⏳ Waiting for async session extension...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const updatedSession = await ChatSessionModel.findOne({ sessionId: 'session_extension_test_001' });
        console.log('📊 Updated Session:', JSON.stringify(updatedSession, null, 2));

        if (updatedSession && updatedSession.maxDurationSeconds > 300) {
            console.log('🎊 SUCCESS: Session extended from 300s to ' + updatedSession.maxDurationSeconds + 's');
        } else {
            console.error('❌ FAILURE: Session not extended or not found');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await app.close();
    }
}

bootstrap();

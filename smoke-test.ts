import { WalletService } from './src/payments/services/wallet.service';
import { ChatSessionService } from './src/chat/services/chat-session.service';
import { CallSessionService } from './src/calls/services/call-session.service';
import { ModuleRef } from '@nestjs/core';

async function runSmokeTest() {
    console.log('🚀 Starting Smoke Test for Wallet & Session Extension');

    // Mock Dependencies
    const mockChatSessionService = {
        extendActiveSessionForUser: jest.fn().mockResolvedValue({ success: true }),
    };
    const mockCallSessionService = {
        extendActiveSessionForUser: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockModuleRef = {
        get: (token: any) => {
            if (token === ChatSessionService) return mockChatSessionService;
            if (token === CallSessionService) return mockCallSessionService;
            return null;
        },
    } as unknown as ModuleRef;

    const walletService = new WalletService(
        {} as any, // transactionModel
        {} as any, // userModel
        {} as any, // giftCardModel
        {} as any, // walletRefundModel
        {} as any, // rechargePackModel
        {} as any, // razorpayService
        {} as any, // appleIapService
        mockModuleRef
    );

    const userId = 'user_123';
    console.log(`📡 Triggering session extension for user: ${userId}`);

    // triggerSessionExtension is private, so we'll access it via casting or test its caller.
    // For this smoke test, we'll cast to any.
    (walletService as any).triggerSessionExtension(userId);

    // Since it's a background task (Promise.all), we wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ Chat session extension called:', (mockChatSessionService.extendActiveSessionForUser as any).mock.calls.length > 0);
    console.log('✅ Call session extension called:', (mockCallSessionService.extendActiveSessionForUser as any).mock.calls.length > 0);

    if ((mockChatSessionService.extendActiveSessionForUser as any).mock.calls.length > 0 &&
        (mockCallSessionService.extendActiveSessionForUser as any).mock.calls.length > 0) {
        console.log('🎉 SMOKE TEST PASSED!');
        process.exit(0);
    } else {
        console.error('❌ SMOKE TEST FAILED!');
        process.exit(1);
    }
}

// Mock jest.fn() as we are not in jest
const jest = {
    fn: () => {
        const fn: any = (...args: any[]) => {
            fn.mock.calls.push(args);
            return fn.mock.results[0]?.value;
        };
        fn.mock = { calls: [], results: [] };
        fn.mockResolvedValue = (val: any) => {
            fn.mock.results.push({ type: 'return', value: Promise.resolve(val) });
            return fn;
        };
        fn.mockReturnValue = (val: any) => {
            fn.mock.results.push({ type: 'return', value: val });
            return fn;
        };
        return fn;
    }
};

runSmokeTest().catch(err => {
    console.error('💥 Error running smoke test:', err);
    process.exit(1);
});

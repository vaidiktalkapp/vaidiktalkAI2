// src/types/ai-astrologer.ts
export interface AIAstrologer {
    _id: string;
    name: string;
    personality: string;
    profilePicture?: string;
    bio?: string;
    specializations: string[];
    languages: string[];
    description?: string;

    // AI Configuration
    aiModel: string; // e.g., "GPT-4", "Claude", "Gemini"
    knowledgeBase: string;
    responseStyle: string; // e.g., "Traditional", "Modern", "Mystical"

    // Additional Profile Fields
    experience?: number;
    education?: string;
    focusArea?: string;
    tone?: string;
    styleGuide?: string;

    // Pricing
    pricing: {
        chat: number;
        call: number;
        videoCall: number;
    };

    // Performance Metrics
    ratings: {
        average: number;
        total: number;
    };

    stats: {
        totalChats: number;
        totalCalls: number;
        totalVideoCallMinutes: number;
        totalEarnings: number;
        averageResponseTime: number; // in seconds
        chatResolutionRate: number; // percentage
        customerSatisfactionScore: number; // 0-100
    };

    // Financial
    wallet: {
        balance: number;
        totalEarnings: number;
        totalWithdrawals: number;
        lastWithdrawalDate?: string;
    };

    // Status & Availability
    accountStatus: 'active' | 'inactive' | 'suspended' | 'pending';
    isChatEnabled: boolean;
    isCallEnabled: boolean;
    isVideoCallEnabled: boolean;
    availability: {
        isOnline: boolean;
        isAvailable: boolean;
        workingHours?: {
            start: string;
            end: string;
        };
    };

    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy?: string; // Admin who created this AI
}

export interface AIAstrologerChatLog {
    _id: string;
    aiAstrologerId: string;
    userId: string;
    userName: string;
    userProfile?: string;

    messages: {
        sender: 'user' | 'ai';
        message: string;
        timestamp: string;
        sentiment?: string; // positive, negative, neutral
    }[];

    duration: number; // in minutes
    startTime: string;
    endTime?: string;

    rating?: number; // 1-5
    feedback?: string;
    resolution: 'resolved' | 'pending' | 'escalated';

    earnings: number;
    createdAt: string;
}

export interface AIAstrologerTransaction {
    _id: string;
    aiAstrologerId: string;
    type: 'earning' | 'withdrawal' | 'refund' | 'adjustment';
    amount: number;
    description: string;
    relatedChatLogId?: string;
    status: 'completed' | 'pending' | 'failed';
    paymentMethod?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AIAstrologerPerformanceMetrics {
    aiAstrologerId: string;
    aiAstrologerName: string;
    aiAstrologerProfile?: string;

    // Revenue
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    totalRevenue: number;

    // Chat Metrics
    totalChats: number;
    averageChatsPerDay: number;
    averageChatDuration: number;
    averageChatEarning: number;

    // Customer Satisfaction
    averageRating: number;
    totalRatings: number;
    customerSatisfactionScore: number;
    repeatCustomerRate: number; // percentage

    // Trending
    trend: 'up' | 'down' | 'stable';
    changePercentage: number; // compared to previous period

    // Peak hours
    peakHour?: string;
    peakDay?: string;

    // Performance Rank
    rank?: number;

    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAIAstrologerPayload {
    name: string;
    personality: string;
    profilePicture?: string;
    bio?: string;
    specializations: string[];
    languages: string[];
    description?: string;
    aiModel: string;
    knowledgeBase: string;
    responseStyle: string;
    pricing: {
        chat: number;
        call: number;
        videoCall: number;
    };
    // New fields
    experience?: number;
    education?: string;
    focusArea?: string;
    tone?: string;
    styleGuide?: string;
    isAvailable?: boolean;
}

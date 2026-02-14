// src/types/astrologer.ts
export interface Astrologer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  profilePicture?: string;
  bio?: string;
  experienceYears: number;
  specializations: string[];
  languages: string[];
  pricing: {
    chat: number;
    call: number;
    videoCall: number;
  };
  ratings: {
    average: number;
    total: number;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalEarnings: number;
    totalMinutes: number;
  };
  profileCompletion: {
    isComplete: boolean;
    percentage: number;
    steps: Record<string, boolean>;
  };
  accountStatus: string;
  isChatEnabled: boolean;
  isCallEnabled: boolean;
  isLiveStreamEnabled: boolean;
  availability: {
    isOnline: boolean;
    isAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AstrologerPerformance {
  astrologer: {
    name: string;
    profilePicture?: string;
    experienceYears: number;
    specializations: string[];
  };
  performance: {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: string;
  };
  recentOrders: any[];
}

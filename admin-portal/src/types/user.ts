// src/types/user.ts
export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  profileImage?: string;
  gender?: string;
  dateOfBirth?: string;
  status: 'active' | 'suspended' | 'blocked' | 'deleted';
  isPhoneVerified: boolean;
  registrationMethod: string;
  wallet: {
    balance: number;
    totalRecharged: number;
    totalSpent: number;
    currency: string;
  };
  stats: {
    totalSessions: number;
    totalMinutesSpent: number;
    totalAmount: number;
    totalRatings: number;
  };
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivity {
  recentOrders: Array<{
    orderId: string;
    type: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    transactionId: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  favoriteAstrologers: Array<{
    _id: string;
    name: string;
    profilePicture?: string;
    specializations: string[];
  }>;
}

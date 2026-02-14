// src/types/index.ts

export interface Admin {
  _id: string;
  adminId: string;
  name: string;
  email: string;
  roleType: string;
  isSuperAdmin: boolean;
  permissions: string[];
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface DashboardStats {
  users: { total: number; active: number };
  astrologers: { total: number; active: number };
  orders: { total: number; completed: number };
  revenue: { total: number; today: number };
}

export interface User {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  accountStatus: string;
  createdAt: Date;
  lastActive?: Date;
}

export interface Astrologer {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  onboarding: {
    status: string;
    tokenNumber: string;
  };
  pricing: {
    chat: number;
    call: number;
    videoCall: number;
  };
  stats: {
    totalEarnings: number;
    totalSessions: number;
  };
  accountStatus: string;
  createdAt: Date;
}

export interface Order {
  _id: string;
  orderId: string;
  userId: any;
  astrologerId: any;
  type: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

export interface Transaction {
  _id: string;
  userId: any;
  type: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface PayoutRequest {
  _id: string;
  payoutId: string;
  astrologerId: any;
  amount: number;
  status: string;
  createdAt: Date;
}

export * from './ai-astrologer';

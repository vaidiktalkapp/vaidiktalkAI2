// src/types/moderation.ts

export interface SafetyReport {
  _id: string;
  ticketId: string; // e.g., "RPT-2024-001"
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reason: string;     // e.g., "Abusive Language", "Scam"
  description: string;
  
  // Who sent the report?
  reporter: {
    id: string;
    name: string;
    role: 'user' | 'astrologer'; 
    avatar?: string;
  };

  // Who is being reported?
  reportedEntity: {
    id: string;
    name: string;
    role: 'user' | 'astrologer';
    avatar?: string;
  };
}

// Unified interface for the Block List table
export interface BlockedEntity {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'astrologer';
  blockedAt: string;
  blockedReason?: string;
  walletBalance?: number;
}
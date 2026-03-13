// src/types/order.ts
export interface Order {
  _id: string;
  orderId: string;
  conversationThreadId?: string;

  // References
  userId: {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    profileImage?: string;
    wallet?: any;
  };
  astrologerId: {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    profilePicture?: string;
    specializations?: string[];
    experienceYears?: number;
  };
  astrologerName: string;

  // Type & Status
  type: 'chat' | 'call' | 'conversation';
  callType?: 'audio' | 'video';
  status: string;

  // Session IDs
  chatSessionId?: string;
  callSessionId?: string;
  currentSessionId?: string;
  currentSessionType?: string;

  // Timing
  requestCreatedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  lastInteractionAt?: string;

  // Queue Info
  queuePosition?: number;
  expectedWaitTime?: number;
  estimatedStartTime?: string;

  // Billing
  ratePerMinute: number;
  maxDurationMinutes: number;
  actualDurationSeconds: number;
  billedMinutes: number;
  totalAmount: number;
  totalUsedDurationSeconds: number;
  totalBilledMinutes: number;

  // Payment
  payment: {
    status: 'hold' | 'charged' | 'refunded' | 'failed' | 'none';
    heldAmount: number;
    chargedAmount: number;
    refundedAmount: number;
    transactionId?: string;
    holdTransactionId?: string;
    chargeTransactionId?: string;
    refundTransactionId?: string;
    heldAt?: string;
    chargedAt?: string;
    refundedAt?: string;
    failureReason?: string;
  };

  // Cancellation
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: 'user' | 'astrologer' | 'system' | 'admin';

  // Recording
  hasRecording: boolean;
  recordingUrl?: string;
  recordingS3Key?: string;
  recordingDuration?: number;
  recordingType?: 'voice_note' | 'video' | 'none';
  recordingStartedAt?: string;
  recordingEndedAt?: string;

  // Session History
  sessionHistory: SessionHistoryItem[];
  totalSessions: number;
  totalChatSessions: number;
  totalCallSessions: number;

  // Stats
  messageCount: number;
  isActive: boolean;
  lastSessionEndTime?: string;

  // Review
  rating?: number;
  review?: string;
  reviewSubmitted: boolean;
  reviewSubmittedAt?: string;

  // Refund
  refundRequest?: RefundRequest;

  // Meta
  isDeleted: boolean;
  deletedAt?: string;
  metadata?: Record<string, any>;
}

export interface SessionHistoryItem {
  sessionId: string;
  sessionType: 'chat' | 'audio_call' | 'video_call';
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  billedMinutes: number;
  chargedAmount: number;
  recordingUrl?: string;
  recordingType?: string;
  endedBy?: string;
  status?: 'completed' | 'cancelled' | 'failed';
}

export interface RefundRequest {
  requestedAt: string;
  requestedBy: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
  refundAmount?: number;
  refundPercentage?: number;
}

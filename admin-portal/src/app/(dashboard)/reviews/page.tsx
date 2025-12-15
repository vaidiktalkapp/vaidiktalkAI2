'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface Review {
  _id: string;
  orderId: string;
  rating: number;
  review: string;
  reviewSubmittedAt: string;
  reviewModerationStatus?: string; // Made optional to handle missing data
  reviewModerationReason?: string;
  userId: {
    _id: string;
    name: string;
    phoneNumber: string;
    profileImage?: string;
  };
  astrologerId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    ratings: {
      average: number;
      total: number;
    };
  };
  type: string;
  actualDurationSeconds: number;
}

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Action State
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'flag' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getReviews({ 
        status: filter === 'all' ? undefined : filter, 
        page, 
        limit: 20,
      });
      setReviews(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getReviewStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await adminApi.approveReview(reviewId);
      toast.success('Review approved successfully');
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedReview || !reason.trim() || !actionType) return;

    try {
      if (actionType === 'reject') {
        await adminApi.rejectReview(selectedReview, reason);
        toast.success('Review rejected successfully');
      } else {
        await adminApi.flagReview(selectedReview, reason);
        toast.success('Review flagged for manual check');
      }
      
      // Reset state
      setSelectedReview(null);
      setActionType(null);
      setReason('');
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${actionType} review`);
    }
  };

  const refreshData = () => {
    fetchReviews();
    fetchStats();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 min';
    const mins = Math.floor(seconds / 60);
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  // ✅ FIXED: Safety check for undefined status
  const canActOnReview = (status?: string) => {
    if (!status) return true; // Default to allowing action if status is missing (assume pending)
    const s = status.toLowerCase();
    return s === 'pending' || s === 'flagged';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
          <p className="text-gray-600 mt-1">Manage ratings and feedback from users</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard 
            label="Pending" 
            value={stats.pending || 0} 
            icon={Clock} 
            active={filter === 'pending'} 
            onClick={() => setFilter('pending')}
            color="text-yellow-600"
          />
          <StatCard 
            label="Approved" 
            value={stats.approved || 0} 
            icon={CheckCircle} 
            active={filter === 'approved'} 
            onClick={() => setFilter('approved')}
            color="text-green-600"
          />
          <StatCard 
            label="Rejected" 
            value={stats.rejected || 0} 
            icon={XCircle} 
            active={filter === 'rejected'} 
            onClick={() => setFilter('rejected')}
            color="text-red-600"
          />
          <StatCard 
            label="Flagged" 
            value={stats.flagged || 0} 
            icon={Flag} 
            active={filter === 'flagged'} 
            onClick={() => setFilter('flagged')}
            color="text-orange-600"
          />
          <StatCard 
            label="Total" 
            value={stats.total || 0} 
            icon={MessageSquare} 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
            color="text-blue-600"
          />
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex gap-4 items-center bg-white p-2 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID, user name, or astrologer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No reviews found</h3>
          <p className="text-gray-500 mt-1">There are no reviews matching the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Left: Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* User Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {review.userId?.profileImage ? (
                          <img src={review.userId.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 font-bold">{review.userId?.name?.[0] || 'U'}</span>
                        )}
                      </div>
                      
                      {/* User Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{review.userId?.name || 'Unknown User'}</h4>
                          <span className="text-xs text-gray-500">• {new Date(review.reviewSubmittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              fill={i < review.rating ? "orange" : "none"} 
                              className={i < review.rating ? "text-orange-400" : "text-gray-300"} 
                            />
                          ))}
                          <span className="text-xs font-medium ml-1 text-gray-700">{review.rating}.0</span>
                        </div>
                      </div>
                    </div>

                    <Badge className={`capitalize ${getStatusColor(review.reviewModerationStatus)}`}>
                      {review.reviewModerationStatus || 'Pending'}
                    </Badge>
                  </div>

                  <p className="mt-4 text-gray-700 leading-relaxed">
                    {review.review ? (
                      review.review
                    ) : (
                      <span className="italic text-gray-400">No written review provided.</span>
                    )}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded w-fit">
                    <span>Order: <span className="font-mono font-medium">{review.orderId}</span></span>
                    <span>•</span>
                    <span className="capitalize">{review.type || 'Service'}</span>
                    <span>•</span>
                    <span>{formatDuration(review.actualDurationSeconds)}</span>
                  </div>

                  {/* Actions Section */}
                  {canActOnReview(review.reviewModerationStatus) && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(review.orderId || review._id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle size={16} className="mr-1.5" /> Approve
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setSelectedReview(review.orderId || review._id); setActionType('reject'); }}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle size={16} className="mr-1.5" /> Reject
                      </Button>

                      {review.reviewModerationStatus !== 'flagged' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => { setSelectedReview(review.orderId || review._id); setActionType('flag'); }}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <Flag size={16} className="mr-1.5" /> Flag
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Action Input Form */}
                  {selectedReview === (review.orderId || review._id) && actionType && (
                    <div className="mt-4 p-4 bg-gray-50 border rounded-lg animate-in fade-in slide-in-from-top-2">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Reason for {actionType === 'reject' ? 'Rejection' : 'Flagging'}
                      </h5>
                      <Textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason here..."
                        className="mb-3 bg-white"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleActionSubmit} disabled={!reason.trim()}>
                          Confirm {actionType === 'reject' ? 'Reject' : 'Flag'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => { setSelectedReview(null); setActionType(null); setReason(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Astrologer Context */}
                <div className="w-full md:w-64 bg-gray-50 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Reviewed Astrologer</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {review.astrologerId?.profilePicture ? (
                        <img src={review.astrologerId.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-purple-700 font-bold">{review.astrologerId?.name?.[0] || 'A'}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{review.astrologerId?.name || 'Unknown'}</p>
                      <div className="flex items-center text-xs text-gray-600 mt-0.5">
                        <Star size={10} fill="currentColor" className="text-yellow-500 mr-1" />
                        <span>{review.astrologerId?.ratings?.average?.toFixed(1) || '0.0'} ({review.astrologerId?.ratings?.total || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-medium text-gray-600 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon: Icon, active, onClick, color }: any) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-indigo-500 border-transparent' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon size={20} className={color} />
        </div>
      </CardContent>
    </Card>
  );
}

// ✅ FIXED: Handle undefined status safely
function getStatusColor(status?: string) {
  if (!status) return 'bg-gray-100 text-gray-700'; // Fallback
  
  switch (status.toLowerCase()) {
    case 'approved': return 'bg-green-100 text-green-700 hover:bg-green-100';
    case 'rejected': return 'bg-red-100 text-red-700 hover:bg-red-100';
    case 'flagged': return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
    case 'pending': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
    default: return 'bg-gray-100 text-gray-700';
  }
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner'; // or your toast library

interface Review {
  _id: string;
  orderId: string;
  rating: number;
  review: string;
  reviewSubmittedAt: string;
  reviewModerationStatus: string;
  reviewModerationReason?: string;
  reviewModeratedAt?: string;
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
      approvedReviews: number;
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
  
  // Rejection/Flag UI
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'flag' | null>(null);
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getReviews({ status: filter, page, limit: 20 });
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

  const handleApprove = async (orderId: string) => {
    try {
      await adminApi.approveReview(orderId);
      toast.success('Review approved successfully');
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      console.error('Error approving review:', error);
      toast.error(error.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleRejectOrFlag = async () => {
    if (!selectedReview || !reason.trim() || !actionType) return;

    try {
      if (actionType === 'reject') {
        await adminApi.rejectReview(selectedReview, reason);
        toast.success('Review rejected successfully');
      } else {
        await adminApi.flagReview(selectedReview, reason);
        toast.success('Review flagged successfully');
      }
      
      setSelectedReview(null);
      setActionType(null);
      setReason('');
      fetchReviews();
      fetchStats();
    } catch (error: any) {
      console.error(`Error ${actionType}ing review:`, error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} review`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      flagged: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-600 mt-2">Approve, reject, or flag user reviews</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter('pending')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter('approved')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter('rejected')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter('flagged')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Flagged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.flagged}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-2 border-blue-200 cursor-pointer" onClick={() => setFilter('all')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {['pending', 'approved', 'rejected', 'flagged', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user or astrologer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={review.userId?.profileImage || '/default-avatar.png'}
                      alt={review.userId?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{review.userId?.name}</p>
                        <Badge className={`${getStatusColor(review.reviewModerationStatus)} border`}>
                          {review.reviewModerationStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{review.userId?.phoneNumber}</p>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                        <span className="text-sm ml-2 font-medium">
                          {review.rating}/5
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-gray-700 mt-3 leading-relaxed">
                        {review.review || <span className="italic text-gray-400">No comment</span>}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Order:</span> {review.orderId}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{review.type}</span>
                        <span>•</span>
                        <span>{formatDuration(review.actualDurationSeconds)}</span>
                        <span>•</span>
                        <span>{new Date(review.reviewSubmittedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Moderation Info */}
                      {review.reviewModerationReason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-sm font-medium text-gray-700">Moderation Note:</p>
                          <p className="text-sm text-gray-600 mt-1">{review.reviewModerationReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Astrologer Info */}
                  <div className="lg:w-64 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={review.astrologerId?.profilePicture || '/default-avatar.png'}
                        alt={review.astrologerId?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{review.astrologerId?.name}</p>
                        <p className="text-xs text-gray-600">{review.astrologerId?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Rating:</span>
                        <span className="font-medium">{review.astrologerId?.ratings?.average.toFixed(1)}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Reviews:</span>
                        <span className="font-medium">{review.astrologerId?.ratings?.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved:</span>
                        <span className="font-medium">{review.astrologerId?.ratings?.approvedReviews}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {review.reviewModerationStatus === 'pending' && (
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => handleApprove(review.orderId)}
                    >
                      <CheckCircle size={16} className="mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        setSelectedReview(review.orderId);
                        setActionType('reject');
                      }}
                    >
                      <XCircle size={16} className="mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => {
                        setSelectedReview(review.orderId);
                        setActionType('flag');
                      }}
                    >
                      <Flag size={16} className="mr-1" /> Flag
                    </Button>
                  </div>
                )}

                {/* Reject/Flag Form */}
                {selectedReview === review.orderId && actionType && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Reason for {actionType === 'reject' ? 'rejection' : 'flagging'}:
                    </label>
                    <Textarea
                      placeholder={`Enter reason for ${actionType}...`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleRejectOrFlag}
                        disabled={!reason.trim()}
                      >
                        Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(null);
                          setActionType(null);
                          setReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

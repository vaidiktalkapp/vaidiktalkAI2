'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MessageCircle, Star, TrendingUp, Wallet, Award } from 'lucide-react';
import Link from 'next/link';

export default function AIAstrologerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const aiAstrologerId = params.id as string;

  const { data: astrologer, isLoading } = useQuery({
    queryKey: ['ai-astrologer', aiAstrologerId],
    queryFn: async () => {
      const response = await adminApi.getAIAstrologerDetails(aiAstrologerId);
      return response.data.data;
    },
    enabled: !!aiAstrologerId,
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!astrologer) {
    return <div className="p-6 text-center">AI Astrologer not found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{astrologer.name}</h1>
          <p className="text-gray-600 mt-1">{astrologer.personality}</p>
        </div>
        <Link href={`/ai-astrologers/${aiAstrologerId}/edit`}>
          <Button className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Section */}
        <Card className="p-6 md:col-span-1">
          <div className="text-center">
            {astrologer.profilePicture && (
              <img
                src={astrologer.profilePicture}
                alt={astrologer.name}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
              />
            )}
            <h2 className="text-xl font-semibold mb-1">{astrologer.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{astrologer.personality}</p>

            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              <Badge>{astrologer.aiModel}</Badge>
              <Badge variant="outline">{astrologer.responseStyle}</Badge>
            </div>

            <div
              className={`inline-block px-4 py-2 rounded-full font-medium mb-4 ${astrologer.accountStatus === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : astrologer.accountStatus === 'inactive'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-red-100 text-red-800'
                }`}
            >
              {astrologer.accountStatus.charAt(0).toUpperCase() + astrologer.accountStatus.slice(1)}
            </div>

            {astrologer.bio && (
              <p className="text-sm text-gray-600">{astrologer.bio}</p>
            )}
          </div>
        </Card>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Chats</p>
                <p className="text-2xl font-bold text-indigo-600 tracking-tight">{astrologer.stats?.totalChats || 0}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600 tracking-tight">{(astrologer.ratings?.average || 0).toFixed(1)}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-emerald-600 tracking-tight">₹{(astrologer.stats?.totalEarnings || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold text-indigo-600 tracking-tight">₹{(astrologer.wallet?.balance || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="specializations">Specializations</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            {astrologer.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{astrologer.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">AI Configuration</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Model:</span>
                    <span className="font-medium">{astrologer.aiModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voice ID:</span>
                    <span className="font-medium">{astrologer.voiceId || 'Default'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Availability</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${astrologer.availability?.isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                      {astrologer.availability?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className={`font-medium ${astrologer.availability?.isAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {astrologer.availability?.isAvailable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chat Enabled:</span>
                    <span className={`font-medium ${astrologer.isChatEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
                      {astrologer.isChatEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {astrologer.knowledgeBase && (
              <div>
                <h3 className="font-semibold mb-2">Knowledge Base</h3>
                <p className="text-gray-700">{astrologer.knowledgeBase}</p>
              </div>
            )}
          </TabsContent>

          {/* Specializations Tab */}
          <TabsContent value="specializations" className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {(astrologer.specializations || []).map((spec: string) => (
                  <Badge key={spec} className="px-3 py-1 text-sm">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {(astrologer.languages || []).map((lang: string) => (
                  <Badge key={lang} variant="outline" className="px-3 py-1 text-sm">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Chat Price</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-indigo-600 tracking-tight">₹{astrologer.pricing?.chat || 0}</p>
                  <p className="text-sm text-gray-500">/min</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Call Price</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-emerald-600 tracking-tight">₹{astrologer.pricing?.call || 0}</p>
                  <p className="text-sm text-gray-500">/min</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Video Call</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-indigo-600 tracking-tight">₹{astrologer.pricing?.videoCall || 0}</p>
                  <p className="text-sm text-gray-500">/min</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-3">Chat Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Chats:</span>
                    <span className="font-medium">{astrologer.stats?.totalChats || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Avg Duration:</span>
                    <span className="font-medium">{(astrologer.stats?.totalMinutes || 0)} min</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Avg Response Time:</span>
                    <span className="font-medium">N/A</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Customer Satisfaction</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{(astrologer.ratings?.average || 0).toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Ratings:</span>
                    <span className="font-medium">{astrologer.ratings?.total || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/ai-astrologers/${aiAstrologerId}/edit`}>
            <Button variant="outline">Edit Profile</Button>
          </Link>
          <Link href="/ai-astrologers/chat-logs">
            <Button variant="outline">View Chat Logs</Button>
          </Link>
          <Link href="/ai-astrologers/wallet-billing">
            <Button variant="outline">View Transactions</Button>
          </Link>
          <Link href="/ai-astrologers/performance-analytics">
            <Button variant="outline">Performance Metrics</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

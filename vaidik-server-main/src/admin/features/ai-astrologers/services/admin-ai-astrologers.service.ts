import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiAstrologerProfile, AiAstrologerProfileDocument } from '../../../../ai-astrologers/schemas/ai-astrologers-profile.schema';
import { ChatSession, ChatSessionDocument } from '../../../../chat/schemas/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../../../../chat/schemas/chat-message.schema';
import { WalletTransaction, WalletTransactionDocument } from '../../../../payments/schemas/wallet-transaction.schema';
import { AdminNotificationGateway } from '../../notifications/gateways/admin-notification.gateway';

@Injectable()
export class AdminAiAstrologersService {
    private readonly logger = new Logger(AdminAiAstrologersService.name);

    constructor(
        @InjectModel(AiAstrologerProfile.name) private aiProfileModel: Model<AiAstrologerProfileDocument>,
        @InjectModel(ChatSession.name) private sessionModel: Model<ChatSessionDocument>,
        @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
        @InjectModel(WalletTransaction.name) private transactionModel: Model<WalletTransactionDocument>,
        private readonly notificationGateway: AdminNotificationGateway,
    ) { }

    // ===== 1. AI ASTROLOGER MANAGEMENT (CRUD) =====

    async create(data: any): Promise<any> {
        this.logger.log(`🏗️ Creating AI Astrologer with data: ${JSON.stringify(data)}`);
        // Map DTO fields if necessary
        if (data.personality && !data.personalityType) data.personalityType = data.personality;
        if (data.profilePicture && !data.image) data.image = data.profilePicture;
        if (data.experienceYears && data.experience === undefined) data.experience = data.experienceYears;
        if (data.specializations && !data.specialization) data.specialization = data.specializations;
        if (data.pricing?.chat !== undefined && data.ratePerMinute === undefined) data.ratePerMinute = data.pricing.chat;

        this.logger.debug(`📝 Normalized data for creation: ${JSON.stringify(data)}`);

        const newProfile = new this.aiProfileModel(data);
        const saved = await newProfile.save();

        this.notificationGateway.notifyRealtimeActivity({
            type: 'system',
            message: `New AI Astrologer created: ${saved.name}`,
            data: { id: saved._id, name: saved.name }
        });
        return saved;
    }

    async findAll(query: any): Promise<any> {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (status && status !== 'all') {
            if (status === 'active') filter.isAvailable = true;
            if (status === 'inactive') filter.isAvailable = false;
        }

        const [rawProfiles, total] = await Promise.all([
            this.aiProfileModel.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }).lean(),
            this.aiProfileModel.countDocuments(filter)
        ]);

        const astrologers = rawProfiles.map(profile => this.mapProfileForAdmin(profile));
        const totalPages = Math.ceil(total / limit);

        return {
            astrologers,
            profiles: astrologers, // Alias
            items: astrologers, // Alias
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    async findOne(id: string): Promise<any> {
        const profile = await this.aiProfileModel.findById(id).lean();
        if (!profile) throw new NotFoundException('AI Astrologer not found');
        return this.mapProfileForAdmin(profile);
    }

    private mapProfileForAdmin(profile: any) {
        if (!profile) return null;
        const obj = profile.toObject ? profile.toObject() : profile;

        return {
            ...obj,
            _id: obj._id?.toString(),
            id: obj._id?.toString(),
            profilePicture: obj.image,
            experienceYears: obj.experience,
            specializations: obj.specialization,
            expertise: obj.expertise,
            isOnline: obj.isAvailable,
            accountStatus: obj.isAvailable ? 'active' : 'inactive',
            pricing: {
                chat: obj.ratePerMinute || 0,
                call: obj.ratePerMinute || 0,
                videoCall: 0
            },
            ratePerMinute: obj.ratePerMinute || 0,
            displayName: obj.name,
            totalOrders: obj.totalSessions || 0,
            totalEarnings: obj.totalRevenue || 0
        };
    }

    async updateStatus(id: string, status: string) {
        // Assuming status 'active' maps to isAvailable=true
        const isAvailable = status === 'active';
        return this.update(id, { isAvailable });
    }

    async update(id: string, data: any): Promise<any> {
        this.logger.log(`update: Updating AI Astrologer ${id} with data: ${JSON.stringify(data)}`);
        if (data.personality && !data.personalityType) data.personalityType = data.personality;
        if (data.profilePicture && !data.image) data.image = data.profilePicture;
        if (data.experienceYears !== undefined && data.experience === undefined) data.experience = data.experienceYears;
        if (data.specializations && !data.specialization) data.specialization = data.specializations;
        if (data.pricing?.chat !== undefined && data.ratePerMinute === undefined) data.ratePerMinute = data.pricing.chat;

        this.logger.debug(`📝 Normalized data for update: ${JSON.stringify(data)}`);

        const updated = await this.aiProfileModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) throw new NotFoundException('AI Astrologer not found');

        this.notificationGateway.notifyRealtimeActivity({
            type: 'system',
            message: `AI Astrologer updated: ${updated.name}`,
            data: { id, name: updated.name }
        });

        return this.mapProfileForAdmin(updated);
    }

    async delete(id: string): Promise<any> {
        const profile = await this.aiProfileModel.findById(id);
        if (!profile) throw new NotFoundException('AI Astrologer not found');
        const name = profile.name;
        await this.aiProfileModel.findByIdAndDelete(id);

        this.notificationGateway.notifyRealtimeActivity({
            type: 'system',
            message: `AI Astrologer deleted: ${name}`,
            data: { id, name }
        });
        return { success: true, message: 'AI Astrologer deleted' };
    }

    async toggleAvailability(id: string): Promise<any> {
        const profile = await this.aiProfileModel.findById(id);
        if (!profile) throw new NotFoundException('AI Astrologer not found');
        profile.isAvailable = !profile.isAvailable;
        const saved = await profile.save();

        this.notificationGateway.notifyRealtimeActivity({
            type: 'system',
            message: `AI Astrologer ${saved.name} is now ${saved.isAvailable ? 'Online' : 'Offline'}`,
            data: { id, name: saved.name, isAvailable: saved.isAvailable }
        });
        return saved;
    }

    // ===== 2. ANALYTICS & PERFORMANCE =====

    async getQuickStats(): Promise<any> {
        // Calculate growth rate (Current vs Previous period)
        const now = new Date();
        const startOfToday = new Date(now.getTime());
        startOfToday.setHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday.getTime());
        startOfYesterday.setDate(startOfToday.getDate() - 1);

        const [
            totalAI,
            activeAI,
            totalSessions,
            totalRevenue,
            sessionStats,
            uniqueUsers,
            todaySessions,
            yesterdaySessions
        ] = await Promise.all([
            this.aiProfileModel.countDocuments(),
            this.aiProfileModel.countDocuments({ isAvailable: true }),
            this.sessionModel.countDocuments({ orderId: /AI-/ }),
            this.sessionModel.aggregate([
                { $match: { orderId: /AI-/, status: 'ended' } },
                { $group: { _id: null, total: { $sum: "$totalCost" } } }
            ]),
            this.sessionModel.aggregate([
                { $match: { orderId: /AI-/ } },
                { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
            ]),
            this.sessionModel.distinct('userId', { orderId: /AI-/ }),
            this.sessionModel.countDocuments({ orderId: /AI-/, createdAt: { $gte: startOfToday } }),
            this.sessionModel.countDocuments({ orderId: /AI-/, createdAt: { $gte: startOfYesterday, $lt: startOfToday } })
        ]);

        let growthRate = 0;
        if (yesterdaySessions > 0) {
            growthRate = ((todaySessions - yesterdaySessions) / yesterdaySessions) * 100;
        } else if (todaySessions > 0) {
            growthRate = 100; // 100% growth if we had 0 yesterday
        }

        return {
            totalAI,
            activeAI,
            total: totalAI,
            active: activeAI,
            totalSessions,
            totalRevenue: totalRevenue[0]?.total || 0,
            averageSessionDuration: Math.round(sessionStats[0]?.avgDuration || 0),
            totalUsers: uniqueUsers.length,
            growthRate: parseFloat(growthRate.toFixed(1))
        };
    }

    async getPerformanceMetrics(): Promise<any> {
        const profiles = await this.aiProfileModel.find()
            .select('name rating totalSessions averageSessionDuration satisfactionScore totalRevenue averageLatency averageAccuracy viewCount')
            .sort({ rating: -1 })
            .lean();

        const metrics = profiles.map(profile => {
            const totalSessions = (profile as any).totalSessions || 0;
            const viewCount = (profile as any).viewCount || totalSessions;

            const conversionRate = viewCount > 0
                ? (totalSessions / Math.max(viewCount, totalSessions)) * 100
                : 0;

            return {
                ...profile,
                conversionRate: parseFloat(conversionRate.toFixed(1))
            };
        });

        return { items: metrics };
    }

    async getOverallStats(timeRange: string = 'monthly'): Promise<any> {
        const { start, end, groupByFormat } = this.getTimeRangeDates(timeRange);

        const [revenueData, hourlyData] = await Promise.all([
            this.sessionModel.aggregate([
                {
                    $match: {
                        $or: [
                            { astrologerModel: 'AiAstrologerProfile' },
                            { orderId: /^AI-/ }
                        ],
                        status: 'ended',
                        endTime: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: groupByFormat, date: "$endTime", timezone: 'Asia/Kolkata' } },
                        sessions: { $sum: 1 },
                        revenue: { $sum: "$totalCost" }
                    }
                },
                { $project: { date: "$_id", sessions: 1, revenue: 1, _id: 0 } },
                { $sort: { "date": 1 } }
            ]),
            this.sessionModel.aggregate([
                {
                    $match: {
                        $or: [
                            { astrologerModel: 'AiAstrologerProfile' },
                            { orderId: /^AI-/ }
                        ],
                        startTime: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: { $hour: { date: "$startTime", timezone: 'Asia/Kolkata' } },
                        sessions: { $sum: 1 }
                    }
                },
                { $project: { hour: "$_id", sessions: 1, _id: 0 } },
                { $sort: { "hour": 1 } }
            ])
        ]);

        // Fill gaps for revenue chart
        const revenueChart = this.fillDateGaps(revenueData, start, end, timeRange);

        // Fill gaps for peak hours (Ensure all 24 hours are represented)
        const peakHours: any[] = [];
        for (let h = 0; h < 24; h++) {
            const hourData = hourlyData.find(item => item.hour === h);
            peakHours.push({
                hour: h.toString(),
                sessions: hourData?.sessions || 0,
            });
        }

        return { revenueChart, peakHours };
    }

    // ===== 3. CHAT LOGS & INTERACTIONS =====

    async getChatLogs(query: any): Promise<any> {
        const { page = 1, limit = 20, search, aiAstrologerId } = query;
        const skip = (page - 1) * limit;

        const filter: any = { orderId: /AI-/ };
        if (aiAstrologerId) filter.astrologerId = new Types.ObjectId(aiAstrologerId);

        const [logs, total] = await Promise.all([
            this.sessionModel.find(filter)
                .populate('userId', 'name email image avatar profilePicture')
                .populate('astrologerId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            this.sessionModel.countDocuments(filter)
        ]);

        return {
            items: logs.map(log => this.mapLogForAdmin(log)),
            logs: logs.map(log => this.mapLogForAdmin(log)), // Alias
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        };
    }

    private mapLogForAdmin(log: any) {
        return {
            _id: log._id,
            sessionId: log.sessionId,
            userName: log.userId?.name || 'Unknown',
            userProfile: log.userId?.image || log.userId?.avatar || log.userId?.profilePicture,
            aiAstrologerId: log.astrologerId?._id,
            aiAstrologerName: log.astrologerId?.name,
            duration: Math.round((log.duration || 0) / 60),
            messages: log.messageCount || 0,
            rating: log.userSatisfactionRating,
            earnings: log.totalCost || 0,
            resolution: log.status === 'ended' ? 'resolved' : log.status,
            createdAt: log.createdAt
        };
    }

    async getChatLogDetails(id: string): Promise<any> {
        // Handle both ObjectId and sessionId string
        const filter = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { sessionId: id };

        const session = await this.sessionModel.findOne(filter)
            .populate('userId', 'name email avatar profilePicture')
            .populate('astrologerId', 'name image')
            .lean();

        if (!session) throw new NotFoundException('Session not found');

        const messages = await this.messageModel.find({
            $or: [
                { sessionId: session.sessionId },
                { orderId: session.orderId },
                { sessionId: id } // Fallback for direct matches
            ]
        }).sort({ sentAt: 1 }).lean();

        return { ...session, messages };
    }

    async getChatMessages(sessionId: string): Promise<any> {
        return this.messageModel.find({ sessionId }).sort({ sentAt: 1 }).lean();
    }

    async getChatStatistics(): Promise<any> {
        const [stats, statusGroups, ratingStats] = await Promise.all([
            this.getQuickStats(),
            this.sessionModel.aggregate([
                { $match: { orderId: /AI-/ } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            this.sessionModel.aggregate([
                { $match: { orderId: /AI-/, userSatisfactionRating: { $exists: true, $ne: null } } },
                { $group: { _id: null, avgRating: { $avg: "$userSatisfactionRating" } } }
            ])
        ]);

        return {
            totalChats: stats.totalSessions,
            totalRevenue: stats.totalRevenue,
            avgDuration: stats.averageSessionDuration,
            avgRating: parseFloat((ratingStats[0]?.avgRating || 0).toFixed(1)) || 4.5,
            statusGroups
        };
    }

    // ===== 4. WALLET & BILLING =====

    async getTransactions(query: any): Promise<any> {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.transactionModel.find({ description: /AI Chat/i })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            this.transactionModel.countDocuments({ description: /AI Chat/i })
        ]);

        const formattedItems = items.map(txn => {
            let astroName = 'Unknown AI';
            if (txn.description && txn.description.includes('with ')) {
                astroName = txn.description.split('with ')[1];
            }
            return {
                ...txn,
                userName: (txn.userId as any)?.name || 'Unknown',
                userEmail: (txn.userId as any)?.email,
                aiAstrologerId: { name: astroName }
            };
        });

        return {
            items: formattedItems,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        };
    }

    async getWalletStats(): Promise<any> {
        const stats = await this.transactionModel.aggregate([
            { $match: { description: /AI Chat/i } },
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);
        return stats;
    }

    // ===== 5. EXPORT =====

    async exportProfiles(): Promise<string> {
        const profiles = await this.aiProfileModel.find().lean();
        return this.jsonToCsv(profiles, ['name', 'personalityType', 'rating', 'totalSessions', 'isAvailable']);
    }

    async exportChats(): Promise<string> {
        const chats = await this.sessionModel.find({ orderId: /AI-/ }).lean();
        return this.jsonToCsv(chats, ['sessionId', 'userId', 'astrologerId', 'status', 'totalCost', 'duration']);
    }

    async exportBilling(): Promise<string> {
        const txns = await this.transactionModel.find({ description: /AI Chat/i }).lean();
        return this.jsonToCsv(txns, ['transactionId', 'userId', 'amount', 'type', 'status', 'createdAt']);
    }

    private jsonToCsv(data: any[], fields: string[]): string {
        const header = fields.join(',') + '\n';
        const rows = data.map(item => {
            return fields.map(field => {
                let val = item[field];
                if (val instanceof Date) val = val.toISOString();
                if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
                return val ?? '';
            }).join(',');
        }).join('\n');
        return header + rows;
    }

    // ===== 6. ENHANCED ANALYTICS (Moved from AnalyticsService) =====

    private fillDateGaps(data: any[], start: Date, end: Date, timeRange: string) {
        const filledData: any[] = [];
        const dataMap = new Map(data.map((item) => [item.date || item._id, item]));

        const current = new Date(start);

        while (current <= end) {
            const dateStr = this.formatDateForTimeRange(current, timeRange);
            const existing = dataMap.get(dateStr);

            filledData.push({
                date: dateStr,
                revenue: existing?.revenue || existing?.totalRevenue || 0,
                sessions: existing?.sessions || existing?.totalSessions || 0,
                avgDuration: existing?.avgDuration || 0,
            });

            // Increment based on time range
            if (timeRange === 'daily') {
                current.setHours(current.getHours() + 1);
            } else if (timeRange === 'yearly') {
                current.setMonth(current.getMonth() + 1);
            } else {
                current.setDate(current.getDate() + 1);
            }
        }

        return filledData;
    }

    private formatDateForTimeRange(date: Date, timeRange: string): string {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);

        if (timeRange === 'daily') {
            return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')} ${String(istDate.getHours()).padStart(2, '0')}:00`;
        } else if (timeRange === 'yearly') {
            return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}`;
        } else {
            return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
        }
    }

    private getTimeRangeDates(timeRange: string, startDate?: string, endDate?: string) {
        // Use Asia/Kolkata timezone for starting/ending dates
        const getISTNow = () => {
            const now = new Date();
            const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
            return new Date(istString);
        };

        const istNow = getISTNow();
        let start: Date;
        let end: Date = new Date(istNow);
        let groupByFormat: string;

        if (timeRange === 'custom' && startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            groupByFormat = '%Y-%m-%d';
        } else {
            switch (timeRange) {
                case 'daily':
                    start = new Date(istNow);
                    start.setHours(0, 0, 0, 0);
                    groupByFormat = '%Y-%m-%d %H:00';
                    break;
                case 'weekly':
                case 'last7days':
                    start = new Date(istNow);
                    start.setDate(istNow.getDate() - 7);
                    groupByFormat = '%Y-%m-%d';
                    break;
                case 'last30days':
                    start = new Date(istNow);
                    start.setDate(istNow.getDate() - 30);
                    groupByFormat = '%Y-%m-%d';
                    break;
                case 'monthly':
                    start = new Date(istNow);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    groupByFormat = '%Y-%m-%d';
                    break;
                case 'yearly':
                    start = new Date(istNow);
                    start.setMonth(0, 1);
                    start.setHours(0, 0, 0, 0);
                    groupByFormat = '%Y-%m';
                    break;
                default:
                    start = new Date(istNow);
                    start.setMonth(istNow.getMonth() - 1);
                    groupByFormat = '%Y-%m-%d';
            }
        }

        end.setHours(23, 59, 59, 999);

        // Shift back to UTC based on IST offset for DB queries
        const istOffset = 5.5 * 60 * 60 * 1000;
        const startUtc = new Date(start.getTime() - istOffset);
        const endUtc = new Date(end.getTime() - istOffset);

        return { start: startUtc, end: endUtc, groupByFormat };
    }

    async getAIRevenueAnalytics(timeRange: string, startDate?: string, endDate?: string): Promise<any> {
        try {
            const { start, end, groupByFormat } = this.getTimeRangeDates(timeRange, startDate, endDate);

            const revenueData = await this.sessionModel.aggregate([
                {
                    $match: {
                        $or: [
                            { astrologerModel: 'AiAstrologerProfile' },
                            { orderId: /^AI-/ }
                        ],
                        status: 'ended',
                        endTime: { $gte: start, $lte: end },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: groupByFormat, date: '$endTime', timezone: 'Asia/Kolkata' } },
                        totalRevenue: { $sum: "$totalCost" },
                        totalSessions: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const totals = {
                totalRevenue: revenueData.reduce((sum, item) => sum + (item.totalRevenue || item.revenue || 0), 0),
                totalSessions: revenueData.reduce((sum, item) => sum + (item.totalSessions || item.sessions || 0), 0),
                avgSessionDuration: revenueData.reduce((sum, item) => sum + (item.avgDuration || 0), 0) / (revenueData.length || 1),
            };

            const filledChartData = this.fillDateGaps(revenueData, start, end, timeRange);

            return {
                success: true,
                data: {
                    chartData: filledChartData,
                    totals,
                    period: { start, end, timeRange },
                },
            };
        } catch (error) {
            this.logger.error(`Error getting AI revenue analytics: ${error.message}`, error.stack);
            return { success: false, error: error.message };
        }
    }

    async getAITimeSlotAnalysis(): Promise<any> {
        try {
            const timeSlotData = await this.sessionModel.aggregate([
                {
                    $match: {
                        astrologerModel: 'AiAstrologerProfile',
                        status: { $in: ['active', 'ended'] },
                        startTime: { $exists: true },
                    },
                },
                {
                    $project: {
                        hour: { $hour: { date: '$startTime', timezone: 'Asia/Kolkata' } },
                        dayOfWeek: { $dayOfWeek: { date: '$startTime', timezone: 'Asia/Kolkata' } },
                        duration: 1,
                        totalAmount: 1,
                    },
                },
                {
                    $group: {
                        _id: {
                            hour: '$hour',
                            dayOfWeek: '$dayOfWeek',
                        },
                        sessionCount: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        totalRevenue: { $sum: '$totalAmount' },
                    },
                },
            ]);

            return { success: true, data: timeSlotData };
        } catch (error) {
            this.logger.error(`Error getting AI time slot analysis: ${error.message}`, error.stack);
            return { success: false, error: error.message };
        }
    }

    async getAIAstrologerComparison(metric: string = 'revenue', limit: number = 10): Promise<any> {
        try {
            const profiles = await this.aiProfileModel.find().lean();

            const comparisonData = profiles.map(profile => {
                const totalSessions = (profile as any).totalSessions || 0;
                const viewCount = (profile as any).viewCount || totalSessions;

                // Conversion = (Total Successful Sessions / Total Profile Views)
                // We use Math.max(viewCount, totalSessions) to ensure conversion doesn't exceed 100%
                const conversionRate = viewCount > 0
                    ? (totalSessions / Math.max(viewCount, totalSessions)) * 100
                    : 0;

                return {
                    id: (profile as any)._id,
                    name: profile.name,
                    totalRevenue: (profile as any).totalRevenue || 0,
                    totalSessions: totalSessions,
                    rating: (profile as any).rating || 0,
                    satisfactionScore: (profile as any).satisfactionScore || 0,
                    avgSessionDuration: (profile as any).averageSessionDuration || 0,
                    conversionRate: parseFloat(conversionRate.toFixed(1))
                };
            });

            const sorted = this.sortByMetric(comparisonData, metric).slice(0, limit);

            return { success: true, data: sorted };
        } catch (error) {
            this.logger.error(`Error comparing AI astrologers: ${error.message}`, error.stack);
            return { success: false, error: error.message };
        }
    }

    private sortByMetric(astrologers: any[], metric: string) {
        switch (metric) {
            case 'revenue':
                return astrologers.sort((a, b) => b.totalRevenue - a.totalRevenue);
            case 'sessions':
                return astrologers.sort((a, b) => b.totalSessions - a.totalSessions);
            case 'conversion':
                return astrologers.sort((a, b) => b.conversionRate - a.conversionRate);
            case 'satisfaction':
                return astrologers.sort((a, b) => b.satisfactionScore - a.satisfactionScore);
            case 'duration':
                return astrologers.sort((a, b) => b.avgSessionDuration - a.avgSessionDuration);
            default:
                return astrologers.sort((a, b) => b.totalRevenue - a.totalRevenue);
        }
    }
}

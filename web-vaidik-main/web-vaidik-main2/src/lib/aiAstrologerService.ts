// src/lib/aiAstrologerService.ts
import { apiClient } from './api';

export interface AiAstrologer {
    _id: string;
    name: string;
    specialization: string[];
    bio: string;
    profileImage: string;
    rating: number;
    responseTime: number;
    totalChats: number;
    status: 'active' | 'inactive';
    modelType?: string;
    chatRate?: number;
    rate?: number;
    experienceYears?: number;
    languages?: string[];
}

export interface AiChatMessage {
    _id: string;
    orderId: string;
    senderId: string;
    senderModel: 'User' | 'AiAstrologer';
    senderName?: string;
    content: string;
    type: 'text' | 'image' | 'audio' | 'video';
    status: 'sent' | 'delivered' | 'read';
    sentAt: string;
    fileUrl?: string;
    mediaUrl?: string;
    url?: string;
    thumbnailUrl?: string;
    fileDuration?: number;
    fileName?: string;
}

export interface AiChatOrder {
    _id: string;
    userId: string;
    aiAstrologerId: string;
    astrologerType: 'ai';
    type: 'chat' | 'call';
    status: 'active' | 'ended' | 'initiated' | 'waiting' | 'insufficient_funds';
    startedAt: string;
    endedAt?: string;
    duration?: number;
    messages?: AiChatMessage[];
    astrologer?: AiAstrologer;
    totalMessages?: number;
    totalCost?: number;     // Amount spent on this session
    orderId?: string;        // AI-[timestamp] format
    sessionId?: string;      // UUID format
    activeSession?: { sessionId: string };
}

class AiAstrologerService {

    /**
     * Get all active AI astrologers
     */
    async getAllAiAstrologers(): Promise<AiAstrologer[]> {
        try {
            console.log('🔍 [AI Astrologer Service] Fetching AI astrologers...');
            console.log('🔍 [AI Astrologer Service] API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1');

            // Check if token exists
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('accessToken');
                console.log('🔍 [AI Astrologer Service] Auth token present:', !!token);
                if (token) {
                    console.log('🔍 [AI Astrologer Service] Token preview:', token.substring(0, 20) + '...');
                }
            }

            const response = await apiClient.get('/ai-astrologers');
            console.log('✅ [AI Astrologer Service] Raw response:', response);
            console.log('✅ [AI Astrologer Service] Response data:', response.data);
            console.log('✅ [AI Astrologer Service] Response.data.data:', response.data.data);
            console.log('✅ [AI Astrologer Service] Type of response.data:', typeof response.data);
            console.log('✅ [AI Astrologer Service] Is Array?:', Array.isArray(response.data));
            console.log('✅ [AI Astrologer Service] Is response.data.data Array?:', Array.isArray(response.data.data));

            // Try multiple possible response structures
            let astrologers: AiAstrologer[] = [];

            if (response.data.data && Array.isArray(response.data.data)) {
                astrologers = response.data.data;
                console.log('✅ Using response.data.data (standard format)');
            } else if (Array.isArray(response.data)) {
                astrologers = response.data;
                console.log('✅ Using response.data (direct array)');
            } else if (response.data.astrologers && Array.isArray(response.data.astrologers)) {
                astrologers = response.data.astrologers;
                console.log('✅ Using response.data.astrologers');
            } else {
                console.warn('⚠️ Unknown response structure!');
                console.log('Full response object:', JSON.stringify(response.data, null, 2));
            }

            // Normalize the data format to ensure consistent field names
            const normalizedAstrologers: AiAstrologer[] = astrologers.map((a: any) => ({
                _id: a._id || a.id || '',
                name: a.name || 'Unknown AI',
                specialization: Array.isArray(a.specialization) ? a.specialization :
                    Array.isArray(a.specializations) ? a.specializations : [],
                bio: a.bio || a.about || '',
                profileImage: a.profileImage || a.profilePicture || a.image || '',
                rating: typeof a.rating === 'number' ? a.rating : (a.ratings?.average || 4.8),
                responseTime: typeof a.responseTime === 'number' ? a.responseTime : 5,
                totalChats: typeof a.totalChats === 'number' ? a.totalChats : (a.totalSessions || a.ratings?.total || a.stats?.totalOrders || 0),
                status: a.status || 'active',
                modelType: a.modelType || '',
                chatRate: Number(a.chatRate || a.rate || a.price || a.pricing?.chat || a.pricing?.rate || a.chatPrice || a.cost || 0),
                rate: Number(a.rate || a.chatRate || a.price || a.pricing?.rate || a.pricing?.chat || a.chatPrice || a.cost || 0),
                experienceYears: Number(a.experienceYears || a.experience || 5),
                languages: Array.isArray(a.languages) ? a.languages :
                    Array.isArray(a.spokenLanguages) ? a.spokenLanguages :
                        (a.languages ? a.languages.split(',').map((l: any) => l.trim()) :
                            (a.spokenLanguages ? a.spokenLanguages.split(',').map((l: any) => l.trim()) :
                                ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi']))
            }));

            // Log specific rate info for debugging
            normalizedAstrologers.forEach(astro => {
                console.log(`💰 [AI Astrologer Service] ${astro.name} rate:`, astro.chatRate);
            });

            console.log('✅ [AI Astrologer Service] Normalized astrologers:', normalizedAstrologers);
            console.log('✅ [AI Astrologer Service] Count:', normalizedAstrologers.length);

            return normalizedAstrologers;
        } catch (error: any) {
            // Enhanced error logging
            console.error('❌ [AI Astrologer Service] Failed to fetch AI astrologers');
            console.error('❌ Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            });

            // Handle network errors, 404, and other errors gracefully
            if (error.response?.status === 404) {
                console.warn('⚠️ AI Astrologers endpoint not implemented on backend yet');
                return [];
            } else if (error.response?.status === 401) {
                // This is expected for guest users if the backend enforces auth
                // but since we want public access, we just log it as a warning and return empty
                console.log('ℹ️ [AI Astrologer Service] Public access: No active session or token invalid.');
                return [];
            } else if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
                console.warn('⚠️ Backend server is not running. AI Astrologers feature unavailable.');
                return [];
            } else {
                console.error('❌ Unexpected error:', error.message);
                return [];
            }
        }
    }

    /**
     * Get specific AI astrologer by ID
     */
    async getAiAstrologer(id: string): Promise<AiAstrologer> {
        try {
            const response = await apiClient.get(`/ai-astrologers/${id}`);
            const a = response.data.data;

            if (!a) return a;

            // Normalize the data format
            const normalized: AiAstrologer = {
                _id: a._id || a.id || id,
                name: a.name || 'Unknown AI',
                specialization: Array.isArray(a.specialization) ? a.specialization :
                    Array.isArray(a.specializations) ? a.specializations : [],
                bio: a.bio || a.about || '',
                profileImage: a.profileImage || a.profilePicture || a.image || '',
                rating: Number(a.rating || a.ratings?.average || 4.8),
                responseTime: Number(a.responseTime || 5),
                totalChats: Number(a.totalChats || a.totalSessions || a.ratings?.total || a.stats?.totalOrders || 0),
                status: a.status || 'active',
                modelType: a.modelType || '',
                chatRate: Number(a.chatRate || a.rate || a.price || a.pricing?.chat || a.pricing?.rate || a.chatPrice || a.cost || 0),
                rate: Number(a.rate || a.chatRate || a.price || a.pricing?.rate || a.pricing?.chat || a.chatPrice || a.cost || 0),
                experienceYears: Number(a.experienceYears || a.experience || 5),
                languages: Array.isArray(a.languages) ? a.languages :
                    Array.isArray(a.spokenLanguages) ? a.spokenLanguages :
                        (a.languages ? a.languages.split(',').map((l: any) => l.trim()) :
                            (a.spokenLanguages ? a.spokenLanguages.split(',').map((l: any) => l.trim()) :
                                ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi']))
            };

            return normalized;
        } catch (error) {
            console.error(`❌ [AI Astrologer Service] Failed to fetch AI astrologer ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search AI astrologers with filters
     */
    async searchAiAstrologers(params: any): Promise<{ success: boolean; data: AiAstrologer[] }> {
        try {
            const response = await apiClient.get('/ai-astrologers', { params });
            return {
                success: true,
                data: response.data.data || []
            };
        } catch (error: any) {
            console.warn('⚠️ Failed to search AI astrologers. Backend may not be ready yet.');
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Start an AI chat order with intake data
     */
    async startAiChatOrder(
        aiAstrologerId: string,
        orderType: 'chat' = 'chat',
        intakeData?: {
            name: string;
            dateOfBirth: string;
            timeOfBirth: string;
            placeOfBirth: string;
            query: string;
            language: string;
        }
    ): Promise<AiChatOrder> {
        try {
            console.log('🚀 [AI Astrologer Service] Starting AI chat order...');
            console.log('  - aiAstrologerId:', aiAstrologerId);
            console.log('  - intakeData:', intakeData);

            // Backend expects these field names
            const payload: any = {
                astrologerId: aiAstrologerId, // Backend uses 'astrologerId' not 'aiAstrologerId'
                orderType
            };

            // Add intake data if provided
            if (intakeData) {
                payload.userName = intakeData.name;
                payload.dateOfBirth = intakeData.dateOfBirth;
                payload.timeOfBirth = intakeData.timeOfBirth;
                payload.placeOfBirth = intakeData.placeOfBirth;
                payload.language = (intakeData as any).language || 'English';
                payload.message = intakeData.query; // Backend uses 'message' not 'query'
            }

            console.log('📤 [AI Astrologer Service] Sending payload:', payload);

            const response = await apiClient.post('/ai-orders/ai', payload);
            console.log('✅ [AI Astrologer Service] Order created raw:', JSON.stringify(response.data, null, 2));

            // Handle different response structures
            // Backend returns: { success: true, data: { session, orderId, sessionId, status } }
            let data = response.data.data || response.data.order || response.data;

            // CRITICAL: Extract the orderId (format: "AI-[timestamp]") which is the primary identifier
            let orderId: string | undefined;

            if (data.orderId) {
                // Direct orderId field (preferred)
                orderId = data.orderId;
            } else if (data.session?.orderId) {
                // orderId nested in session object
                orderId = data.session.orderId;
            } else if (data.session?._id) {
                // Fallback to MongoDB _id from session
                orderId = data.session._id.toString();
            }

            if (!orderId) {
                console.error('❌ [AI Astrologer Service] Invalid order creation response (Missing orderId):', data);
                throw new Error('Invalid response from server - missing Order ID');
            }

            console.log('✅ [AI Astrologer Service] Extracted orderId:', orderId);

            // Return normalized order object with _id set to orderId for compatibility
            const normalizedOrder: AiChatOrder = {
                _id: orderId,
                orderId: orderId,
                sessionId: data.sessionId || data.session?.sessionId,
                userId: data.session?.userId || data.userId || '',
                aiAstrologerId: data.session?.astrologerId || data.astrologerId || '',
                astrologerType: 'ai',
                type: 'chat',
                status: data.status || data.session?.status || 'active',
                startedAt: data.session?.startTime || data.session?.createdAt || new Date().toISOString(),
                ...data.session,
                ...data
            };

            return normalizedOrder;
        } catch (error: any) {
            console.error('❌ [AI Astrologer Service] Failed to create AI chat order');
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }

    /**
     * Get AI chat conversation with normalization
     */
    async getAiChatConversation(orderId: string): Promise<AiChatOrder> {
        try {
            console.log(`🔍 [AI Astrologer Service] Fetching conversation for orderId: ${orderId}...`);
            const response = await apiClient.get(`/ai-orders/ai/${orderId}`);
            console.log('📦 [AI Astrologer Service] Raw Response from /orders:', response.data);

            // EXTREMELY RESILIENT EXTRACTION
            let data = response.data.data || response.data.order || response.data.session || response.data;
            console.log('📝 [AI Astrologer Service] Extracted Data Object:', data ? 'Present' : 'Missing');

            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
                console.error('❌ [AI Astrologer Service] Empty response for order:', orderId);
                return { _id: orderId } as AiChatOrder;
            }

            // Extract order data, handling possible nesting (as seen in user logs)
            let orderData = data;
            const session = data.session || data;
            console.log('🖇️ [AI Astrologer Service] Session Object:', session ? 'Present' : 'Missing');

            // Normalize astrologerId (check both levels)
            let rawAstrologerId = orderData.astrologerId || session.astrologerId || orderData.aiAstrologerId;

            // CRITICAL FIX: Handle when astrologerId is an object instead of a string
            const astrologerId = typeof rawAstrologerId === 'object' && rawAstrologerId?._id
                ? rawAstrologerId._id
                : (typeof rawAstrologerId === 'string' ? rawAstrologerId : null);

            console.log('👤 [AI Astrologer Service] Raw astrologerId:', rawAstrologerId);
            console.log('👤 [AI Astrologer Service] Normalized astrologerId:', astrologerId);

            // Normalize the order and its messages
            const messages = (orderData.messages || session.messages || []).map((msg: any) => ({
                ...msg,
                _id: msg._id || msg.id,
                content: msg.content || msg.message || '',
                senderModel: msg.senderModel === 'Astrologer' ? 'AiAstrologer' : (msg.senderModel || (msg.senderId === astrologerId ? 'AiAstrologer' : 'User')),
                sentAt: msg.sentAt || msg.createdAt || new Date().toISOString()
            }));

            // Inject Greeting if present (Top level in creation response)
            const greeting = orderData.greeting || session.greeting;
            if (greeting && !messages.some((m: any) => m.content === greeting)) {
                console.log('💌 [AI Astrologer Service] Injecting greeting...');
                messages.unshift({
                    _id: 'greeting-' + orderId,
                    senderModel: 'AiAstrologer',
                    content: greeting,
                    sentAt: orderData.createdAt || session.createdAt || new Date().toISOString(),
                    type: 'text'
                });
            }

            // Inject Initial Response if present (Top level in creation response)
            const initialResponse = orderData.initialResponse || session.initialResponse;
            if (initialResponse && !messages.some((m: any) => m.content === initialResponse)) {
                console.log('💬 [AI Astrologer Service] Injecting initial response...');
                messages.push({
                    _id: 'initial-' + orderId,
                    senderModel: 'AiAstrologer',
                    content: initialResponse,
                    sentAt: new Date(new Date(orderData.createdAt || session.createdAt || Date.now()).getTime() + 500).toISOString(),
                    type: 'text'
                });
            }

            // Normalize the final order object
            const normalizedOrder: AiChatOrder = {
                ...orderData,
                ...session, // Spread session properties (like startTime, language, etc.)
                _id: orderData._id || orderData.id || orderId,
                aiAstrologerId: astrologerId,
                astrologerType: 'ai',
                startedAt: orderData.startedAt || session.startedAt || orderData.startTime || session.startTime || orderData.createdAt || session.createdAt,
                messages: messages
            };

            // CRITICAL: Fetch astrologer if missing (to ensure timer starts and name/images show)
            if (!normalizedOrder.astrologer && astrologerId) {
                try {
                    console.log(`📡 [AI Astrologer Service] Populating missing astrologer ${astrologerId}...`);
                    let fullAstro = null;
                    try {
                        fullAstro = await this.getAiAstrologer(astrologerId);
                    } catch (err) {
                        console.warn(`⚠️ [AI Astrologer Service] Direct fetch failed, trying search fallback...`);
                        const allPros = await this.getAllAiAstrologers();
                        fullAstro = allPros.find(p => p._id === astrologerId) || null;
                    }

                    if (fullAstro) {
                        normalizedOrder.astrologer = fullAstro;
                        console.log(`✅ [AI Astrologer Service] Successfully populated astrologer: ${fullAstro.name}`);
                    } else {
                        console.error(`❌ [AI Astrologer Service] Could not find astrologer ${astrologerId} even with fallback!`);
                    }
                } catch (e) {
                    console.error(`❌ [AI Astrologer Service] Failed to populate astrologer ${astrologerId}:`, e);
                }
            } else if (normalizedOrder.astrologer) {
                console.log(`✅ [AI Astrologer Service] Astrologer already present: ${normalizedOrder.astrologer.name}`);
            } else {
                console.warn(`⚠️ [AI Astrologer Service] No astrologer and no astrologerId found!`);
            }

            console.log('✅ [AI Astrologer Service] Final Normalized Order:', {
                id: normalizedOrder._id,
                astro: normalizedOrder.astrologer?.name,
                msgCount: normalizedOrder.messages?.length
            });
            return normalizedOrder;
        } catch (error) {
            console.error(`❌ [AI Astrologer Service] Failed to fetch AI chat conversation ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Send message in AI chat (via Socket.io - handled in chatService)
     */
    async sendAiMessage(
        orderId: string,
        aiAstrologerId: string,
        message: string,
        zodiacSign?: string
    ): Promise<void> {
        // This is handled via Socket.io in chatService
        // This is just a placeholder for API-based approach if needed
        try {
            const response = await apiClient.post(`/ai-orders/ai/${orderId}/messages`, {
                aiAstrologerId,
                content: message,
                zodiacSign
            });
            return response.data.data;
        } catch (error) {
            console.error('Failed to send AI message:', error);
            throw error;
        }
    }

    /**
     * End AI chat
     */
    async endAiChat(orderId: string): Promise<AiChatOrder> {
        try {
            // ✅ Use POST to match backend expectation and sendBeacon pattern
            const response = await apiClient.post(`/ai-orders/ai/${orderId}/end`, {});
            return response.data.data;
        } catch (error) {
            console.error('Failed to end AI chat:', error);
            throw error;
        }
    }

    /**
     * Get AI chat history for user with normalization
     */
    async getAiChatHistory(page: number = 1, limit: number = 10): Promise<{ success: boolean; data: AiChatOrder[] }> {
        try {
            console.log('🔍 [AI Astrologer Service] Fetching AI chat history...');
            // Use the dedicated AI history endpoint
            const response = await apiClient.get('/ai-orders/ai', {
                params: { page, limit }
            });

            const historyData = response.data.data?.history || response.data.data || [];
            const historyArray = Array.isArray(historyData) ? historyData : [];

            console.log(`📦 [AI Astrologer Service] Raw history items: ${historyArray.length}`);

            // Normalize history data
            const normalizedHistory: AiChatOrder[] = historyArray.map((session: any) => {
                // Extract astrologer info, handling populated object or ID
                const astrologer = session.astrologer || {};
                const astrologerId = (session.astrologerId && typeof session.astrologerId === 'object')
                    ? (session.astrologerId._id || session.astrologerId.id)
                    : (session.astrologerId || astrologer._id || astrologer.id);

                return {
                    ...session,
                    _id: session._id || session.id || session.orderId,
                    orderId: session.orderId || session._id,
                    aiAstrologerId: astrologerId,
                    // Map backend fields to frontend interface
                    totalMessages: session.messageCount !== undefined ? session.messageCount : (session.totalMessages || 0),
                    startedAt: session.startTime || session.startedAt || session.createdAt,
                    // Map totalCost/totalAmount for display
                    totalCost: (session.totalCost > 0) ? session.totalCost : (session.totalAmount || session.cost || 0),
                    astrologer: {
                        _id: astrologerId,
                        name: astrologer.name || 'AI Astrologer',
                        profileImage: astrologer.profileImage || astrologer.profilePicture || '',
                        specialization: astrologer.specialization || [],
                        ...astrologer
                    }
                };
            });

            console.log('✅ [AI Astrologer Service] Normalized history items:', normalizedHistory.length);

            return {
                success: true,
                data: normalizedHistory
            };
        } catch (error) {
            console.error('❌ [AI Astrologer Service] Failed to fetch AI chat history:', error);
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Delete AI chat order
     */
    async deleteAiChatOrder(orderId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiClient.delete(`/ai-orders/ai/${orderId}`);
            return {
                success: true,
                message: response.data.message || 'Order deleted successfully'
            };
        } catch (error: any) {
            console.error('Failed to delete AI chat order:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete order'
            };
        }
    }
}

export default new AiAstrologerService();

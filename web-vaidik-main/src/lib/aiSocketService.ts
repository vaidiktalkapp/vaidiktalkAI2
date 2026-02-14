// src/lib/aiSocketService.ts
import { io, Socket } from 'socket.io-client';
import { apiClient } from './api';

export interface AiChatMessage {
    _id: string;
    orderId: string;
    sessionId?: string;
    senderId: string;
    senderModel: 'User' | 'Astrologer'; // Mapped from AiAstrologer
    content: string;
    type: 'text' | 'image' | 'audio' | 'video';
    status: 'sent' | 'delivered' | 'read';
    sentAt: string;
}

class AiSocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private isSocketConnected: boolean = false;
    private connectionPromise: Promise<Socket> | null = null;

    getSocket(): Socket | null {
        return this.socket;
    }

    // Connect to Socket.io AI Chat Namespace
    async connect(token: string, userId?: string): Promise<Socket> {
        if (this.socket?.connected) {
            return this.socket;
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._establishConnection(token, userId);

        try {
            const socket = await this.connectionPromise;
            return socket;
        } finally {
            this.connectionPromise = null;
        }
    }

    private async _establishConnection(token: string, userId?: string): Promise<Socket> {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

        return new Promise((resolve, reject) => {
            // ✅ CONNECT TO /ai-chat namespace
            this.socket = io(`${SOCKET_URL}/ai-chat`, {
                auth: {
                    token,
                    userId,
                    role: 'User'
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            const timeout = setTimeout(() => {
                reject(new Error('AI Chat socket connect timeout'));
            }, 10000);

            this.socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('✅ [AI Socket] Connected:', this.socket?.id);
                this.isSocketConnected = true;
                this._reattachListeners();
                resolve(this.socket!);
            });

            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.error('❌ [AI Socket] Connection error:', error);
                this.isSocketConnected = false;
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 [AI Socket] Disconnected:', reason);
                this.isSocketConnected = false;
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isSocketConnected = false;
            console.log('👋 [AI Socket] Disconnected manually');
        }
    }

    isConnected(): boolean {
        return this.isSocketConnected && this.socket?.connected === true;
    }

    // Join AI Chat Session
    joinSession(sessionId: string, userId: string, orderId?: string) {
        if (!this.socket) {
            console.warn('❌ [AI Socket] Not connected, cannot join session');
            return;
        }

        console.log('🔗 [AI Socket] Joining AI session:', { sessionId, orderId });
        this.socket.emit('join_ai_chat', {
            sessionId,
            orderId,
            userId
        });
    }

    leaveSession(sessionId: string, userId: string) {
        if (!this.socket) return;
        this.socket.emit('leave_ai_chat', { sessionId, userId });
    }

    // Send Message
    sendMessage(
        sessionId: string,
        content: string,
        userId: string,
        orderId?: string
    ) {
        if (!this.socket || !this.isConnected()) {
            console.warn('⚠️ [AI Socket] Not connected, attempting to reconnect...');
            return;
        }

        const payload = {
            sessionId,
            orderId: orderId || sessionId,
            message: content,
            userId
        };

        console.log('📤 [AI Socket] Sending AI message:', payload);
        this.socket.emit('send_ai_message', payload);
    }

    // End Chat (Socket Emit)
    endChat(sessionId: string, userId: string, rating?: number) {
        if (!this.socket) return;
        this.socket.emit('end_ai_chat', { sessionId, userId, rating });
    }

    // Event Listeners
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);

        if (this.socket) {
            this.socket.on(event, callback as any);
        }
    }

    off(event: string, callback?: Function) {
        if (callback) {
            const listeners = this.listeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
            this.socket?.off(event, callback as any);
        } else {
            this.listeners.delete(event);
            this.socket?.off(event);
        }
    }

    private _reattachListeners() {
        if (!this.socket) return;
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(cb => {
                if (!this.socket?.hasListeners(event)) {
                    this.socket?.on(event, cb as any);
                }
            });
        });
    }
}

export const aiSocketService = new AiSocketService();
export default aiSocketService;

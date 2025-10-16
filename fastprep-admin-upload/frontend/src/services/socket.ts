import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { SocketEvents, Message, Conversation, ConversationStatus, Priority } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Connection management
  joinConversations(userId: string) {
    this.socket?.emit('join_conversations', userId);
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  // Message events
  onNewMessage(callback: (data: { message: Message }) => void) {
    this.socket?.on('new_message', callback);
  }

  onMessageReadUpdate(callback: (data: { messageId: string; userId: string; readAt: string }) => void) {
    this.socket?.on('message_read_update', callback);
  }

  markMessageAsRead(conversationId: string, messageId: string, userId: string) {
    this.socket?.emit('message_read', { conversationId, messageId, userId });
  }

  // Conversation events
  onConversationAssigned(callback: (data: { conversationId: string; assignedTo: string }) => void) {
    this.socket?.on('conversation_assigned', callback);
  }

  onConversationUpdated(callback: (data: { conversationId: string; status?: ConversationStatus; priority?: Priority }) => void) {
    this.socket?.on('conversation_updated', callback);
  }

  onConversationStatusUpdated(callback: (data: { conversationId: string; status?: ConversationStatus; priority?: Priority }) => void) {
    this.socket?.on('conversation_status_updated', callback);
  }

  assignConversation(conversationId: string, assignedTo: string) {
    this.socket?.emit('assign_conversation', { conversationId, assignedTo });
  }

  updateConversationStatus(conversationId: string, status?: ConversationStatus, priority?: Priority) {
    this.socket?.emit('update_conversation_status', { conversationId, status, priority });
  }

  // Typing events
  onUserTyping(callback: (data: { userId: string; userName: string; conversationId: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string; conversationId: string }) => void) {
    this.socket?.on('user_stopped_typing', callback);
  }

  startTyping(conversationId: string, userId: string, userName: string) {
    this.socket?.emit('typing_start', { conversationId, userId, userName });
  }

  stopTyping(conversationId: string, userId: string) {
    this.socket?.emit('typing_stop', { conversationId, userId });
  }

  // Notification events
  onNotification(callback: (data: { type: string; message: string; data?: any }) => void) {
    this.socket?.on('notification', callback);
  }

  // Utility methods
  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  // Remove specific listener
  removeListener(event: string, callback?: (...args: any[]) => void) {
    this.socket?.removeListener(event, callback);
  }
}

// Create singleton instance
const socketService = new SocketService();

// Hook for using socket service
export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketService.connect(token);
        socketService.joinConversations(user.id);
      }
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated, user]);

  return socketService;
};

export default socketService;

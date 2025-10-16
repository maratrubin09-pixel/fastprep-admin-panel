const { Conversation, Message, User } = require('../models');

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.setupHandlers();
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their assigned conversations
      socket.on('join_conversations', async (userId) => {
        try {
          const conversations = await Conversation.findAll({
            where: { assignedTo: userId },
            attributes: ['id']
          });

          conversations.forEach(conversation => {
            socket.join(`conversation_${conversation.id}`);
          });

          socket.join(`user_${userId}`);
          console.log(`User ${userId} joined ${conversations.length} conversations`);
        } catch (error) {
          console.error('Error joining conversations:', error);
        }
      });

      // Join specific conversation
      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
      });

      // Leave conversation
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`User ${socket.id} left conversation ${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
          userId: data.userId,
          userName: data.userName,
          conversationId: data.conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
          userId: data.userId,
          conversationId: data.conversationId
        });
      });

      // Handle message status updates
      socket.on('message_read', async (data) => {
        try {
          const { conversationId, messageId, userId } = data;
          
          await Message.update(
            { isRead: true, readAt: new Date() },
            { where: { id: messageId } }
          );

          socket.to(`conversation_${conversationId}`).emit('message_read_update', {
            messageId,
            userId,
            readAt: new Date()
          });
        } catch (error) {
          console.error('Error updating message read status:', error);
        }
      });

      // Handle conversation assignment
      socket.on('assign_conversation', async (data) => {
        try {
          const { conversationId, assignedTo } = data;
          
          await Conversation.update(
            { assignedTo },
            { where: { id: conversationId } }
          );

          // Notify the assigned user
          this.io.to(`user_${assignedTo}`).emit('conversation_assigned', {
            conversationId,
            assignedTo
          });

          // Notify conversation room
          socket.to(`conversation_${conversationId}`).emit('conversation_assigned', {
            conversationId,
            assignedTo
          });
        } catch (error) {
          console.error('Error assigning conversation:', error);
        }
      });

      // Handle conversation status updates
      socket.on('update_conversation_status', async (data) => {
        try {
          const { conversationId, status, priority } = data;
          
          const updateData = {};
          if (status) updateData.status = status;
          if (priority) updateData.priority = priority;

          await Conversation.update(updateData, {
            where: { id: conversationId }
          });

          socket.to(`conversation_${conversationId}`).emit('conversation_status_updated', {
            conversationId,
            status,
            priority
          });
        } catch (error) {
          console.error('Error updating conversation status:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  // Emit new message to conversation
  emitNewMessage(conversationId, message) {
    this.io.to(`conversation_${conversationId}`).emit('new_message', {
      message
    });
  }

  // Emit conversation update
  emitConversationUpdate(conversationId, update) {
    this.io.to(`conversation_${conversationId}`).emit('conversation_updated', {
      conversationId,
      ...update
    });
  }

  // Emit notification to user
  emitNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  // Emit conversation assignment
  emitConversationAssignment(conversationId, assignedTo) {
    this.io.to(`conversation_${conversationId}`).emit('conversation_assigned', {
      conversationId,
      assignedTo
    });

    this.io.to(`user_${assignedTo}`).emit('conversation_assigned', {
      conversationId,
      assignedTo
    });
  }

  // Emit typing indicator
  emitTyping(conversationId, userId, userName) {
    this.io.to(`conversation_${conversationId}`).emit('user_typing', {
      userId,
      userName,
      conversationId
    });
  }

  // Emit typing stop
  emitTypingStop(conversationId, userId) {
    this.io.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
      userId,
      conversationId
    });
  }

  // Broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast to specific room
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  // Get rooms
  getRooms() {
    return this.io.sockets.adapter.rooms;
  }
}

module.exports = SocketHandlers;

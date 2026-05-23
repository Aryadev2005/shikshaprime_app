import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';
import { validationResult } from 'express-validator';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Send direct message between users
   * POST /api/chat/messages/direct
   */
  sendDirectMessage = async (req, res: Response, next: NextFunction) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        senderUserId,
        senderUserType,
        recipientUserId,
        recipientUserType,
        messageText,
        messageType
      } = req.body;

      const result = await this.chatService.sendDirectMessage({
        senderUserId: parseInt(senderUserId),
        senderUserType,
        recipientUserId: parseInt(recipientUserId),
        recipientUserType,
        messageText,
        messageType: messageType || 'text',
      }, req.tenant);

      return res.status(201).json(result);

    } catch (error: any) {
      console.error('Error in sendDirectMessage:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send direct message',
      });
    }
  };

  /**
   * Send broadcast message to class
   * POST /api/chat/messages/class-broadcast
   */
  sendClassBroadcast = async (req, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        senderUserId,
        senderUserType,
        programId,
        departmentId, 
        academicYearId,
        classId,
        subject,
        messageText,
        messageType
      } = req.body;

      const result = await this.chatService.sendClassBroadcast({
        senderUserId: parseInt(senderUserId),
        senderUserType,
        programId,
        departmentId,
        academicYearId, 
        classId,
        subject,
        messageText,
        messageType: messageType || 'announcement',
      }, req.tenant);

      return res.status(201).json(result);

    } catch (error: any) {
      console.error('Error in sendClassBroadcast:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send class broadcast',
      });
    }
  };

  /**
   * Get conversations for a user
   * GET /api/chat/conversations?userId=123&userType=teacher&page=1&limit=20
   */
  getConversations = async (req, res: Response, next: NextFunction) => {
    try {
      const { userId, userType, page, limit } = req.query;

      console.log('🔍 getConversations called with:', { userId, userType, page, limit });

      if (!userId || !userType) {
        console.log('❌ Missing userId or userType');
        return res.status(400).json({
          success: false,
          message: 'userId and userType are required',
        });
      }

      const result = await this.chatService.getConversations({
        userId: parseInt(userId as string),
        userType: userType as 'teacher' | 'student' | 'admin' | 'staff',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      }, req.tenant);

      console.log('✅ getConversations result:', {
        success: result.success,
        conversationCount: result.conversations?.length || 0,
      });

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('❌ Error in getConversations:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get conversations',
      });
    }
  };

  /**
   * Get messages in a conversation
   * GET /api/chat/conversations/:conversationId/messages?userId=123&userType=teacher&page=1&limit=50
   */
  getMessages = async (req, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const { userId, userType, page, limit } = req.query;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId is required',
        });
      }

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'userId and userType are required',
        });
      }

      const result = await this.chatService.getMessages({
        conversationId: parseInt(conversationId),
        userId: parseInt(userId as string),
        userType: userType as 'teacher' | 'student' | 'admin' | 'staff',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      }, req.tenant);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in getMessages:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get messages',
      });
    }
  };

  /**
   * Get unread message count
   * GET /api/chat/messages/unread-count?userId=123&userType=teacher
   */
  getUnreadCount = async (req, res: Response, next: NextFunction) => {
    try {
      const { userId, userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'userId and userType are required',
        });
      }

      const result = await this.chatService.getUnreadCount(
        parseInt(userId as string),
        userType as 'teacher' | 'student' | 'admin' | 'staff',
        req.tenant
      );

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in getUnreadCount:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unread count',
      });
    }
  };

  /**
   * Mark conversation as read
   * PUT /api/chat/conversations/:conversationId/read
   */
  markConversationAsRead = async (req, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const { userId, userType } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'conversationId is required',
        });
      }

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'userId and userType are required',
        });
      }

      const result = await this.chatService.markConversationAsRead(
        parseInt(conversationId),
        parseInt(userId),
        userType,
        req.tenant
      );

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in markConversationAsRead:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark conversation as read',
      });
    }
  };

  /**
   * Get students by class (for class broadcasts)
   * GET /api/chat/students/class/:classId
   */
  getStudentsByClass = async (req, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'classId is required',
        });
      }

      const result = await this.chatService.getStudentsByClass(parseInt(classId), req.tenant);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in getStudentsByClass:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get students by class',
      });
    }
  };

  /**
   * Get available teachers
   * GET /api/chat/teachers?excludeUserId=123
   */
  getTeachers = async (req, res: Response, next: NextFunction) => {
    try {
      const { excludeUserId } = req.query;

      const result = await this.chatService.getTeachers(req.tenant,
        excludeUserId ? parseInt(excludeUserId as string) : undefined
      );

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('Error in getTeachers:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get teachers',
      });
    }
  };

  /**
   * Health check endpoint
   * GET /api/chat/health
   */
  health = async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'Chat Service',
      status: 'OK',
      timestamp: new Date().toISOString(),
    });
  };
}
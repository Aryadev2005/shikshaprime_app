import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();
const chatController = new ChatController();

// Rate limiters
const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middlewares
const validateSendDirectMessage = [
  body('senderUserId')
    .isInt({ min: 1 })
    .withMessage('Sender user ID must be a positive integer'),
  body('senderUserType')
    .isIn(['teacher', 'student', 'admin', 'staff'])
    .withMessage('Invalid sender user type'),
  body('recipientUserId')
    .isInt({ min: 1 })
    .withMessage('Recipient user ID must be a positive integer'),
  body('recipientUserType')
    .isIn(['teacher', 'student', 'admin', 'staff'])
    .withMessage('Invalid recipient user type'),
  body('messageText')
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message text is required and must be less than 5000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'announcement', 'important'])
    .withMessage('Invalid message type'),
];

const validateSendClassBroadcast = [
  body('senderUserId')
    .isInt({ min: 1 })
    .withMessage('Sender user ID must be a positive integer'),
  body('senderUserType')
    .isIn(['teacher', 'admin', 'staff'])
    .withMessage('Only teachers, admins, and staff can send class broadcasts'),
  body('programId')
    .notEmpty()
    .isString()
    .withMessage('Program ID is required and must be a string'),
  body('departmentId')
    .notEmpty()
    .isString()
    .withMessage('Department ID is required and must be a string'),
  body('academicYearId')
    .notEmpty()
    .isString()
    .withMessage('Academic Year ID is required and must be a string'),
  body('classId')
    .notEmpty()
    .isString()
    .withMessage('Class ID is required and must be a string'),
  body('subject')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('Subject is required and must be less than 255 characters'),
  body('messageText')
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message text is required and must be less than 5000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'announcement', 'important'])
    .withMessage('Invalid message type'),
];

const validateUserQuery = [
  query('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  query('userType')
    .isIn(['teacher', 'student', 'admin', 'staff'])
    .withMessage('Invalid user type'),
];

const validateMarkAsRead = [
  param('conversationId')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('userType')
    .isIn(['teacher', 'student', 'admin', 'staff'])
    .withMessage('Invalid user type'),
];

// Routes

// Health check
router.get('/health', chatController.health);

// Message endpoints
router.post('/messages/direct', 
  messageRateLimit, 
  validateSendDirectMessage, 
  chatController.sendDirectMessage
);

router.post('/messages/class-broadcast', 
  messageRateLimit, 
  validateSendClassBroadcast, 
  chatController.sendClassBroadcast
);

router.get('/messages/unread-count', 
  generalRateLimit, 
  validateUserQuery, 
  chatController.getUnreadCount
);

// Conversation endpoints
router.get('/conversations', 
  generalRateLimit, 
  validateUserQuery, 
  chatController.getConversations
);

router.get('/conversations/:conversationId/messages', 
  generalRateLimit,
  [
    param('conversationId').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer'),
    ...validateUserQuery,
  ],
  chatController.getMessages
);

router.put('/conversations/:conversationId/read', 
  generalRateLimit, 
  validateMarkAsRead, 
  chatController.markConversationAsRead
);

// Recipient endpoints (for composing messages)
router.get('/students/class/:classId', 
  generalRateLimit,
  [
    param('classId').isInt({ min: 1 }).withMessage('Class ID must be a positive integer'),
  ],
  chatController.getStudentsByClass
);

router.get('/teachers', 
  generalRateLimit, 
  chatController.getTeachers
);

export default router;
/**
* Communication & Media Routes v3
* Live streaming, Chat, Messaging, Video calls
* @version 3.0.0
*/
const express = require('express');
const router = express.Router();
const { param, query, body, matchedData } = require('express-validator');
const mediaController = require('../../controllers/mediaController');
const chatController = require('../../controllers/chatController');
const messageController = require('../../controllers/messageController');
const notificationController = require('../../controllers/notificationController');
const auth = require('../../middlewares/auth');
const validation = require('../../middlewares/validation');
const role = require('../../constants/role');
const rateLimit = require('../../middlewares/rateLimit');
const upload = require('../../middlewares/upload');
const { EventEmitter } = require('events');
const streamEvents = new EventEmitter();

// ========================
// 🛡️ Middleware
// ========================
router.use(auth.verifyToken);

// ========================
// 📺 لایو استریمینگ (Live Streaming)
// ========================

/**
* @route   POST /api/v3/streams
* @desc    Create new live stream
* @access  Admin, Manager, Teacher
*/
router.post('/streams',
  rateLimit.streamLimiter,
  body('title').isLength({ min: 3, max: 100 }).withMessage('عنوان باید ۳ تا ۱۰۰ کاراکتر باشد'),
  body('description').optional().isLength({ max: 1000 }),
  body('category').isIn(['education', 'entertainment', 'gaming', 'sports', 'other']),
  body('isPrivate').optional().isBoolean(),
  body('scheduledAt').optional().isISO8601(),
  validation.validate,
  mediaController.createStream
);

/**
* @route   GET /api/v3/streams
* @desc    Get all active/upcoming streams
* @access  All authenticated
*/
router.get('/streams',
  query('status').optional().isIn(['live', 'upcoming', 'ended', 'all']),
  query('category').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  mediaController.getStreams
);

/**
* @route   GET /api/v3/streams/:streamId
* @desc    Get stream details
* @access  All authenticated
*/
router.get('/streams/:streamId',
  param('streamId').isMongoId(),
  validation.validate,
  mediaController.getStreamById
);

/**
* @route   POST /api/v3/streams/:streamId/start
* @desc    Start live stream
* @access  Stream owner
*/
router.post('/streams/:streamId/start',
  rateLimit.streamLimiter,
  param('streamId').isMongoId(),
  validation.validate,
  mediaController.startStream
);

/**
* @route   POST /api/v3/streams/:streamId/end
* @desc    End live stream
* @access  Stream owner
*/
router.post('/streams/:streamId/end',
  rateLimit.streamLimiter,
  param('streamId').isMongoId(),
  validation.validate,
  mediaController.endStream
);

/**
* @route   POST /api/v3/streams/:streamId/view
* @desc    Join stream as viewer
* @access  All authenticated
*/
router.post('/streams/:streamId/view',
  param('streamId').isMongoId(),
  validation.validate,
  mediaController.joinStream
);

/**
* @route   GET /api/v3/streams/:streamId/viewers
* @desc    Get current viewers list
* @access  Stream owner
*/
router.get('/streams/:streamId/viewers',
  param('streamId').isMongoId(),
  validation.validate,
  mediaController.getViewers
);

/**
* @route   POST /api/v3/streams/:streamId/reaction
* @desc    Send reaction to stream
* @access  All viewers
*/
router.post('/streams/:streamId/reaction',
  rateLimit.reactionLimiter,
  param('streamId').isMongoId(),
  body('type').isIn(['like', 'love', 'fire', 'heart', 'clap', '😂', '😢']),
  validation.validate,
  mediaController.sendReaction
);

/**
* @route   POST /api/v3/streams/:streamId/report
* @desc    Report stream
* @access  All authenticated
*/
router.post('/streams/:streamId/report',
  body('reason').isLength({ min: 10, max: 500 }),
  body('type').isIn(['spam', 'inappropriate', 'harassment', 'other']),
  validation.validate,
  mediaController.reportStream
);

// ========================
// 💬 لایو چت (Live Chat)
// ========================

/**
* @route   GET /api/v3/chats/rooms
* @desc    Get all chat rooms
* @access  All authenticated
*/
router.get('/chats/rooms',
  query('type').optional().isIn(['public', 'private', 'group']),
  validation.validate,
  chatController.getRooms
);

/**
* @route   POST /api/v3/chats/rooms
* @desc    Create chat room
* @access  All authenticated
*/
router.post('/chats/rooms',
  rateLimit.chatLimiter,
  body('name').isLength({ min: 2, max: 50 }),
  body('type').isIn(['public', 'private', 'group']),
  body('members').optional().isArray({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  validation.validate,
  chatController.createRoom
);

/**
* @route   GET /api/v3/chats/rooms/:roomId
* @desc    Get room messages
* @access  Room members
*/
router.get('/chats/rooms/:roomId',
  param('roomId').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validation.validate,
  chatController.getMessages
);

/**
* @route   POST /api/v3/chats/rooms/:roomId/messages
* @desc    Send message in room
* @access  Room members
*/
router.post('/chats/rooms/:roomId/messages',
  rateLimit.messageLimiter,
  param('roomId').isMongoId(),
  body('content').isLength({ min: 1, max: 2000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'audio', 'video']),
  body('replyTo').optional().isMongoId(),
  validation.validate,
  chatController.sendMessage
);

/**
* @route   WebSocket /api/v3/chats/ws
* @desc    Real-time chat WebSocket endpoint
* @access  Authenticated
*/
router.ws('/chats/ws', chatController.handleWebSocket);

/**
* @route   POST /api/v3/chats/rooms/:roomId/typing
* @desc    Send typing indicator
* @access  Room members
*/
router.post('/chats/rooms/:roomId/typing',
  param('roomId').isMongoId(),
  body('isTyping').isBoolean(),
  validation.validate,
  chatController.sendTypingIndicator
);

/**
* @route   POST /api/v3/chats/rooms/:roomId/read
* @desc    Mark messages as read
* @access  Room members
*/
router.post('/chats/rooms/:roomId/read',
  param('roomId').isMongoId(),
  body('messageId').isMongoId(),
  validation.validate,
  chatController.markAsRead
);

// ========================
// 📨 پیام رسانی خصوصی (Private Messaging)
// ========================

/**
* @route   GET /api/v3/messages
* @desc    Get all conversations
* @access  Authenticated
*/
router.get('/messages',
  query('page').optional().isInt({ min: 1 }),
  validation.validate,
  messageController.getConversations
);

/**
* @route   GET /api/v3/messages/:conversationId
* @desc    Get messages in conversation
* @access  Participants
*/
router.get('/messages/:conversationId',
  param('conversationId').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  messageController.getMessages
);

/**
* @route   POST /api/v3/messages
* @desc    Send new message / Start conversation
* @access  Authenticated
*/
router.post('/messages',
  rateLimit.messageLimiter,
  body('recipientId').isMongoId(),
  body('content').isLength({ min: 1, max: 5000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'audio', 'video', 'voice']),
  body('attachments').optional().isArray({ max: 10 }),
  validation.validate,
  messageController.sendMessage
);

/**
* @route   POST /api/v3/messages/:messageId/read
* @desc    Mark message as read
* @access  Recipient
*/
router.post('/messages/:messageId/read',
  param('messageId').isMongoId(),
  validation.validate,
  messageController.markAsRead
);

/**
* @route   DELETE /api/v3/messages/:messageId
* @desc    Delete message (for yourself)
* @access  Sender
*/
router.delete('/messages/:messageId',
  param('messageId').isMongoId(),
  validation.validate,
  messageController.deleteMessage
);

/**
* @route   POST /api/v3/messages/:conversationId/block
* @desc    Block user in conversation
* @access  Authenticated
*/
router.post('/messages/:conversationId/block',
  param('conversationId').isMongoId(),
  validation.validate,
  messageController.blockUser
);

/**
* @route   POST /api/v3/messages/:conversationId/archive
* @desc    Archive conversation
* @access  Authenticated
*/
router.post('/messages/:conversationId/archive',
  param('conversationId').isMongoId(),
  validation.validate,
  messageController.archiveConversation
);

// ========================
// 🔔 اعلان‌ها (Notifications)
// ========================

/**
* @route   GET /api/v3/notifications
* @desc    Get user notifications
* @access  Authenticated
*/
router.get('/notifications',
  query('type').optional().isIn(['all', 'unread', 'read']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validation.validate,
  notificationController.getNotifications
);

/**
* @route   GET /api/v3/notifications/unread-count
* @desc    Get unread notifications count
* @access  Authenticated
*/
router.get('/notifications/unread-count',
  notificationController.getUnreadCount
);

/**
* @route   PATCH /api/v3/notifications/:notificationId/read
* @desc    Mark notification as read
* @access  Authenticated
*/
router.patch('/notifications/:notificationId/read',
  param('notificationId').isMongoId(),
  validation.validate,
  notificationController.markAsRead
);

/**
* @route   POST /api/v3/notifications/read-all
* @desc    Mark all notifications as read
* @access  Authenticated
*/
router.post('/notifications/read-all',
  notificationController.markAllAsRead
);

/**
* @route   DELETE /api/v3/notifications/:notificationId
* @desc    Delete notification
* @access  Authenticated
*/
router.delete('/notifications/:notificationId',
  param('notificationId').isMongoId(),
  validation.validate,
  notificationController.deleteNotification
);

/**
* @route   POST /api/v3/notifications/settings
* @desc    Update notification preferences
* @access  Authenticated
*/
router.post('/notifications/settings',
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('sms').optional().isBoolean(),
  body('types').optional().isArray(),
  validation.validate,
  notificationController.updateSettings
);

// ========================
// 📞 تماس ویدیویی (Video Calls)
// ========================

/**
* @route   POST /api/v3/calls
* @desc    Start video call
* @access  Authenticated
*/
router.post('/calls',
  rateLimit.callLimiter,
  body('calleeId').isMongoId(),
  body('type').isIn(['video', 'audio']),
  body('roomName').optional().isLength({ max: 50 }),
  validation.validate,
  mediaController.startCall
);

/**
* @route   POST /api/v3/calls/:callId/join
* @desc    Join video call
* @access  Invited user
*/
router.post('/calls/:callId/join',
  param('callId').isMongoId(),
  validation.validate,
  mediaController.joinCall
);

/**
* @route   POST /api/v3/calls/:callId/end
* @desc    End video call
* @access  Call owner
*/
router.post('/calls/:callId/end',
  param('callId').isMongoId(),
  validation.validate,
  mediaController.endCall
);

/**
* @route   WebSocket /api/v3/calls/ws
* @desc    Real-time video call signaling
*/
router.ws('/calls/ws', mediaController.handleCallSignaling);

module.exports = router;
/**
* Education & Automation Routes v4
* Online Classroom, AI, Automation, Webhooks
* @version 4.0.0
*/
const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');
const classroomController = require('../../controllers/classroomController');
const automationController = require('../../controllers/automationController');
const aiController = require('../../controllers/aiController');
const webhookController = require('../../controllers/webhookController');
const scheduleController = require('../../controllers/scheduleController');
const auth = require('../../middlewares/auth');
const validation = require('../../middlewares/validation');
const role = require('../../constants/role');
const rateLimit = require('../../middlewares/rateLimit');

// ========================
// 🛡️ Middleware
// ========================
router.use(auth.verifyToken);

// ========================
// 🎓 کلاس درس آنلاین (Online Classroom)
// ========================

/**
* @route   GET /api/v4/courses
* @desc    Get all available courses
* @access  All authenticated
*/
router.get('/courses',
  query('category').optional(),
  query('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'all']),
  query('status').optional().isIn(['active', 'draft', 'archived']),
  query('search').optional().isLength({ min: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['title', 'createdAt', 'price', 'rating']),
  validation.validate,
  classroomController.getCourses
);

/**
* @route   POST /api/v4/courses
* @desc    Create new course
* @access  Teacher, Admin
*/
router.post('/courses',
  rateLimit.courseLimiter,
  body('title').isLength({ min: 3, max: 200 }),
  body('description').isLength({ min: 10, max: 5000 }),
  body('category').isLength({ min: 2 }),
  body('level').isIn(['beginner', 'intermediate', 'advanced']),
  body('price').optional().isFloat({ min: 0 }),
  body('thumbnail').optional().isURL(),
  body('isFree').optional().isBoolean(),
  body('tags').optional().isArray({ max: 10 }),
  body('requirements').optional().isArray(),
  body('objectives').optional().isArray(),
  validation.validate,
  classroomController.createCourse
);

/**
* @route   GET /api/v4/courses/:courseId
* @desc    Get course details
* @access  Enrolled users or public
*/
router.get('/courses/:courseId',
  param('courseId').isMongoId(),
  validation.validate,
  classroomController.getCourseById
);

/**
* @route   POST /api/v4/courses/:courseId/enroll
* @desc    Enroll in course
* @access  Authenticated
*/
router.post('/courses/:courseId/enroll',
  rateLimit.enrollLimiter,
  param('courseId').isMongoId(),
  validation.validate,
  classroomController.enrollCourse
);

/**
* @route   GET /api/v4/courses/:courseId/curriculum
* @desc    Get course curriculum (chapters & lessons)
* @access  Enrolled users
*/
router.get('/courses/:courseId/curriculum',
  param('courseId').isMongoId(),
  validation.validate,
  classroomController.getCurriculum
);

/**
* @route   POST /api/v4/courses/:courseId/chapters
* @desc    Add chapter to course
* @access  Course owner
*/
router.post('/courses/:courseId/chapters',
  rateLimit.contentLimiter,
  param('courseId').isMongoId(),
  body('title').isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('order').optional().isInt({ min: 1 }),
  validation.validate,
  classroomController.addChapter
);

/**
* @route   POST /api/v4/courses/:courseId/chapters/:chapterId/lessons
* @desc    Add lesson to chapter
* @access  Course owner
*/
router.post('/courses/:courseId/chapters/:chapterId/lessons',
  rateLimit.contentLimiter,
  param('courseId').isMongoId(),
  param('chapterId').isMongoId(),
  body('title').isLength({ min: 2, max: 200 }),
  body('type').isIn(['video', 'text', 'quiz', 'assignment', 'document']),
  body('content').isObject(),
  body('duration').optional().isInt({ min: 0 }),
  body('order').optional().isInt({ min: 1 }),
  body('isFree').optional().isBoolean(),
  validation.validate,
  classroomController.addLesson
);

/**
* @route   POST /api/v4/courses/:courseId/lessons/:lessonId/complete
* @desc    Mark lesson as completed
* @access  Enrolled users
*/
router.post('/courses/:courseId/lessons/:lessonId/complete',
  param('courseId').isMongoId(),
  param('lessonId').isMongoId(),
  validation.validate,
  classroomController.completeLesson
);

/**
* @route   POST /api/v4/courses/:courseId/lessons/:lessonId/progress
* @desc    Update video/watch progress
* @access  Enrolled users
*/
router.post('/courses/:courseId/lessons/:lessonId/progress',
  param('courseId').isMongoId(),
  param('lessonId').isMongoId(),
  body('progress').isFloat({ min: 0, max: 100 }),
  body('currentTime').optional().isFloat({ min: 0 }),
  validation.validate,
  classroomController.updateProgress
);

/**
* @route   POST /api/v4/courses/:courseId/quizzes
* @desc    Submit quiz answers
* @access  Enrolled users
*/
router.post('/courses/:courseId/quizzes/:quizId/submit',
  param('courseId').isMongoId(),
  param('quizId').isMongoId(),
  body('answers').isArray({ min: 1 }),
  validation.validate,
  classroomController.submitQuiz
);

/**
* @route   GET /api/v4/courses/:courseId/certificate
* @desc    Get course completion certificate
* @access  Completed course
*/
router.get('/courses/:courseId/certificate',
  param('courseId').isMongoId(),
  validation.validate,
  classroomController.getCertificate
);

/**
* @route   POST /api/v4/courses/:courseId/reviews
* @desc    Add course review
* @access  Enrolled users
*/
router.post('/courses/:courseId/reviews',
  rateLimit.reviewLimiter,
  param('courseId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 1000 }),
  validation.validate,
  classroomController.addReview
);

/**
* @route   GET /api/v4/courses/:courseId/reviews
* @desc    Get course reviews
* @access  Public
*/
router.get('/courses/:courseId/reviews',
  param('courseId').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  validation.validate,
  classroomController.getReviews
);

/**
* @route   POST /api/v4/courses/:courseId/discussion
* @desc    Add discussion post
* @access  Enrolled users
*/
router.post('/courses/:courseId/discussion',
  rateLimit.discussionLimiter,
  param('courseId').isMongoId(),
  body('content').isLength({ min: 5, max: 2000 }),
  body('lessonId').optional().isMongoId(),
  body('parentId').optional().isMongoId(),
  validation.validate,
  classroomController.addDiscussion
);

/**
* @route   GET /api/v4/my-courses
* @desc    Get enrolled courses
* @access  Authenticated
*/
router.get('/my-courses',
  query('status').optional().isIn(['in_progress', 'completed', 'all']),
  validation.validate,
  classroomController.getMyCourses
);

/**
* @route   GET /api/v4/my-courses/:courseId/progress
* @desc    Get course progress
* @access  Enrolled users
*/
router.get('/my-courses/:courseId/progress',
  param('courseId').isMongoId(),
  validation.validate,
  classroomController.getCourseProgress
);

// ========================
// 🤖 هوش مصنوعی (AI Features)
// ========================

/**
* @route   POST /api/v4/ai/chat
* @desc    AI Chat assistant
* @access  Authenticated
*/
router.post('/ai/chat',
  rateLimit.aiLimiter,
  body('message').isLength({ min: 1, max: 2000 }),
  body('context').optional().isObject(),
  body('model').optional().isIn(['gpt-4', 'gpt-3.5', 'claude']),
  validation.validate,
  aiController.chat
);

/**
* @route   POST /api/v4/ai/summarize
* @desc    Summarize text/content
* @access  Authenticated
*/
router.post('/ai/summarize',
  rateLimit.aiLimiter,
  body('content').isLength({ min: 100, max: 10000 }),
  body('maxLength').optional().isInt({ min: 50, max: 500 }),
  validation.validate,
  aiController.summarize
);

/**
* @route   POST /api/v4/ai/quiz-generator
* @desc    Generate quiz from content
* @access  Teacher
*/
router.post('/ai/quiz-generator',
  rateLimit.aiLimiter,
  body('content').isLength({ min: 100, max: 10000 }),
  body('questionCount').optional().isInt({ min: 1, max: 20 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  validation.validate,
  aiController.generateQuiz
);

/**
* @route   POST /api/v4/ai/translate
* @desc    Translate content
* @access  Authenticated
*/
router.post('/ai/translate',
  rateLimit.aiLimiter,
  body('content').isLength({ min: 1, max: 5000 }),
  body('targetLang').isLength({ min: 2, max: 5 }),
  body('sourceLang').optional(),
  validation.validate,
  aiController.translate
);

/**
* @route   POST /api/v4/ai/code-review
* @desc    AI Code review
* @access  Authenticated
*/
router.post('/ai/code-review',
  rateLimit.aiLimiter,
  body('code').isLength({ min: 10, max: 10000 }),
  body('language').isIn(['javascript', 'python', 'java', 'cpp', 'go', 'rust']),
  validation.validate,
  aiController.codeReview
);

/**
* @route   POST /api/v4/ai/image-generate
* @desc    Generate AI image
* @access  Premium users
*/
router.post('/ai/image-generate',
  rateLimit.aiLimiter,
  body('prompt').isLength({ min: 5, max: 500 }),
  body('size').optional().isIn(['256x256', '512x512', '1024x1024']),
  body('style').optional().isIn(['realistic', 'cartoon', 'abstract', 'anime']),
  validation.validate,
  aiController.generateImage
);

// ========================
// ⚙️ اتوماسیون (Automation)
// ========================

/**
* @route   GET /api/v4/automations
* @desc    Get all automations
* @access  Admin, Manager
*/
router.get('/automations',
  query('status').optional().isIn(['active', 'inactive', 'all']),
  validation.validate,
  automationController.getAutomations
);

/**
* @route   POST /api/v4/automations
* @desc    Create new automation
* @access  Admin
*/
router.post('/automations',
  rateLimit.automationLimiter,
  body('name').isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('trigger').isObject(),
  body('actions').isArray({ min: 1, max: 20 }),
  body('conditions').optional().isArray(),
  body('isActive').optional().isBoolean(),
  validation.validate,
  automationController.createAutomation
);

/**
* @route   GET /api/v4/automations/:id
* @desc    Get automation details
* @access  Owner
*/
router.get('/automations/:id',
  param('id').isMongoId(),
  validation.validate,
  automationController.getById
);

/**
* @route   PUT /api/v4/automations/:id
* @desc    Update automation
* @access  Owner
*/
router.put('/automations/:id',
  rateLimit.automationLimiter,
  param('id').isMongoId(),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('trigger').optional().isObject(),
  body('actions').optional().isArray(),
  body('conditions').optional().isArray(),
  validation.validate,
  automationController.update
);

/**
* @route   PATCH /api/v4/automations/:id/toggle
* @desc    Toggle automation status
* @access  Owner
*/
router.patch('/automations/:id/toggle',
  param('id').isMongoId(),
  validation.validate,
  automationController.toggle
);

/**
* @route   DELETE /api/v4/automations/:id
* @desc    Delete automation
* @access  Owner
*/
router.delete('/automations/:id',
  param('id').isMongoId(),
  validation.validate,
  automationController.delete
);

/**
* @route   GET /api/v4/automations/:id/logs
* @desc    Get automation execution logs
* @access  Owner
*/
router.get('/automations/:id/logs',
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validation.validate,
  automationController.getLogs
);

/**
* @route   POST /api/v4/automations/:id/test
* @desc    Test automation
* @access  Owner
*/
router.post('/automations/:id/test',
  param('id').isMongoId(),
  validation.validate,
  automationController.test
);

// ========================
// 🪝 وب‌هوک (Webhooks)
// ========================

/**
* @route   GET /api/v4/webhooks
* @desc    Get all webhooks
* @access  Admin
*/
router.get('/webhooks',
  validation.validate,
  webhookController.getAll
);

/**
* @route   POST /api/v4/webhooks
* @desc    Create webhook
* @access  Admin
*/
router.post('/webhooks',
  rateLimit.webhookLimiter,
  body('url').isURL().withMessage('URL معتبر نیست'),
  body('events').isArray({ min: 1 }),
  body('events.*').isIn([
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.completed', 'order.cancelled',
    'payment.success', 'payment.failed',
    'course.enrolled', 'course.completed',
    'stream.started', 'stream.ended'
  ]),
  body('secret').optional().isLength({ min: 16, max: 64 }),
  body('isActive').optional().isBoolean(),
  validation.validate,
  webhookController.create
);

/**
* @route   DELETE /api/v4/webhooks/:id
* @desc    Delete webhook
* @access  Admin
*/
router.delete('/webhooks/:id',
  param('id').isMongoId(),
  validation.validate,
  webhookController.delete
);

/**
* @route   POST /api/v4/webhooks/:id/test
* @desc    Test webhook
* @access  Admin
*/
router.post('/webhooks/:id/test',
  param('id').isMongoId(),
  validation.validate,
  webhookController.test
);

// ========================
// 📅 زمان‌بندی (Scheduling)
// ========================

/**
* @route   GET /api/v4/schedules
* @desc    Get all scheduled tasks
* @access  Admin
*/
router.get('/schedules',
  query('status').optional().isIn(['pending', 'running', 'completed', 'failed']),
  validation.validate,
  scheduleController.getAll
);

/**
* @route   POST /api/v4/schedules
* @desc    Create scheduled task
* @access  Admin
*/
router.post('/schedules',
  rateLimit.scheduleLimiter,
  body('name').isLength({ min: 2, max: 100 }),
  body('task').isObject(),
  body('cronExpression').matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])\/([1-9]|1[0-2])) (\*|[0-6])$/),
  body('timezone').optional().isLength({ max: 50 }),
  body('isActive').optional().isBoolean(),
  validation.validate,
  scheduleController.create
);

/**
* @route   DELETE /api/v4/schedules/:id
* @desc    Delete scheduled task
* @access  Admin
*/
router.delete('/schedules/:id',
  param('id').isMongoId(),
  validation.validate,
  scheduleController.delete
);

/**
* @route   POST /api/v4/schedules/:id/run
* @desc    Run scheduled task manually
* @access  Admin
*/
router.post('/schedules/:id/run',
  param('id').isMongoId(),
  validation.validate,
  scheduleController.runNow
);

module.exports = router;
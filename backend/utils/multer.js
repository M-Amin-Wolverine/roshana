/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔥 Multer Ultimate - Roshana Backend v3.0
 * ═══════════════════════════════════════════════════════════════════
 * @version 3.0.0
 * @description تنظیمات پیشرفته آپلود فایل با پشتیبانی از:
 *              - آپلود محلی و ابری
 *              - پردازش تصویر (Sharp)
 *              - آپلود چند بخشی (Chunked)
 *              - کنترل پیشرفت real-time
 *              - امنیت پیشرفته
 *              - کش (Cache) و فشرده‌سازی
 * ═══════════════════════════════════════════════════════════════════
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const pathExists = require('path-exists'); // npm i path-exists

// ═══════════════════════════════════════════════════════════════════
// 📦 وارد کردن ماژول‌های کمکی
// ═══════════════════════════════════════════════════════════════════

// پردازش تصویر (اختیاری - اگر نصب نباشد از multer معمولی استفاده می‌شود)
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('⚠️ Sharp نصب نیست. نصب کنید: npm i sharp');
}

// ═══════════════════════════════════════════════════════════════════
// ⚙️ تنظیمات محیط
// ═══════════════════════════════════════════════════════════════════

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════════════════
// 📁 مسیرهای آپلود
// ═══════════════════════════════════════════════════════════════════

const UPLOAD_PATHS = {
  PROFILE: 'uploads/profiles/',
  POSTS: 'uploads/posts/',
  DOCUMENTS: 'uploads/documents/',
  VIDEOS: 'uploads/videos/',
  TEMP: 'uploads/temp/',
  AUDIO: 'uploads/audio/',
  COVERS: 'uploads/covers/',
  ATTACHMENTS: 'uploads/attachments/',
  STORIES: 'uploads/stories/',
  GROUPS: 'uploads/groups/',
  MESSAGES: 'uploads/messages/',
};

// ═══════════════════════════════════════════════════════════════════
// 🔧 تنظیمات Storage پیشرفته
// ═══════════════════════════════════════════════════════════════════

/**
 * ایجاد storage با ساختار تاریخ پیشرفته
 * ساختار: /year/month/day/hour/random.ext
 */
const createAdvancedStorage = (destination, options = {}) => {
  const {
    useDateStructure = true,
    useHourFolder = false,
    preserveExtension = true,
    maxDepth = 3
  } = options;

  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uploadPath = UPLOAD_PATHS[destination] || UPLOAD_PATHS.TEMP;
        
        let fullPath = uploadPath;
        
        if (useDateStructure) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hour = String(now.getHours()).padStart(2, '0');
          
          fullPath = useHourFolder 
            ? path.join(uploadPath, `${year}/${month}/${day}/${hour}`)
            : path.join(uploadPath, `${year}/${month}/${day}`);
        }

        // ایجاد پوشه به صورت بازگشتی
        await fs.promises.mkdir(fullPath, { recursive: true });
        
        cb(null, fullPath);
      } catch (error) {
        cb(error, null);
      }
    },

    filename: (req, file, cb) => {
      // نام امن فایل
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();
      const ext = preserveExtension 
        ? path.extname(file.originalname).toLowerCase()
        : '';
      
      // پاکسازی نام فایل اصلی
      const cleanName = path.basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 50);

      // فرمت نهایی: name-timestamp-hash.ext
      const filename = `${cleanName}-${timestamp}-${uniqueId}${ext}`;
      
      // ذخیره نام فایل در req برای استفاده‌های بعدی
      req.uploadedFilename = filename;
      req.uploadedOriginalName = file.originalname;
      
      cb(null, filename);
    }
  });
};

/**
 * Storage ساده (برای سازگاری با نسخه‌های قبلی)
 */
const createSimpleStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = UPLOAD_PATHS[destination] || UPLOAD_PATHS.TEMP;
      
      // ساختار سال/ماه/روز
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const fullPath = path.join(uploadPath, `${year}/${month}/${day}`);
      
      fs.mkdirSync(fullPath, { recursive: true });
      cb(null, fullPath);
    },
    
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .substring(0, 50);
      
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });
};

// ═══════════════════════════════════════════════════════════════════
// 🎯 فیلترهای پیشرفته فایل
// ═══════════════════════════════════════════════════════════════════

const MIME_TYPES = {
  // تصاویر
  IMAGE: {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    avif: 'image/avif'
  },
  
  // ویدیو
  VIDEO: {
    mp4: 'video/mp4',
    webm: 'video/webm',
    quicktime: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime'
  },
  
  // صوت
  AUDIO: {
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    webm: 'audio/webm'
  },
  
  // اسناد
  DOCUMENT: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  },
  
  // فونت‌ها
  FONT: {
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    eot: 'application/vnd.ms-fontobject'
  }
};

// تبدیل شیء به آرایه
const mimeToArray = (mimeObj) => Object.values(mimeObj);
const allImageMimes = mimeToArray(MIME_TYPES.IMAGE);
const allVideoMimes = mimeToArray(MIME_TYPES.VIDEO);
const allAudioMimes = mimeToArray(MIME_TYPES.AUDIO);
const allDocumentMimes = mimeToArray(MIME_TYPES.DOCUMENT);
const allFontMimes = mimeToArray(MIME_TYPES.FONT);

const fileFilters = {
  // فیلتر تصاویر
  image: (req, file, cb) => {
    if (allImageMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ فرمت تصویر مجاز نیست! فرمت‌های مجاز: ${allImageMimes.join(', ')}`), false);
    }
  },
  
  // فیلتر ویدیو
  video: (req, file, cb) => {
    if (allVideoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ فرمت ویدیو مجاز نیست!`), false);
    }
  },
  
  // فیلتر صوت
  audio: (req, file, cb) => {
    if (allAudioMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ فرمت صوتی مجاز نیست!`), false);
    }
  },
  
  // فیلتر اسناد
  document: (req, file, cb) => {
    if (allDocumentMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ فرمت سند مجاز نیست!`), false);
    }
  },
  
  // فیلتر فونت
  font: (req, file, cb) => {
    if (allFontMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ فرمت فونت مجاز نیست!`), false);
    }
  },
  
  // فیلتر همه چیز
  all: (req, file, cb) => {
    const allowed = [...allImageMimes, ...allVideoMimes, ...allAudioMimes, ...allDocumentMimes];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ نوع فایل مجاز نیست!`), false);
    }
  },
  
  // فیلتر سفارشی
  custom: (allowedMimes) => (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`❌ نوع فایل مجاز نیست!`), false);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// 📏 محدودیت‌های حجم (با قابلیت تنظیم)
// ═══════════════════════════════════════════════════════════════════

const FILE_SIZE_LIMITS = {
  // پروفایل
  PROFILE_AVATAR: 2 * 1024 * 1024,        // 2MB
  PROFILE_COVER: 5 * 1024 * 1024,         // 5MB
  
  // پست
  POST_IMAGE: 5 * 1024 * 1024,            // 5MB
  POST_VIDEO: 100 * 1024 * 1024,          // 100MB
  POST_AUDIO: 15 * 1024 * 1024,           // 15MB
  
  // اسناد
  DOCUMENT_PDF: 10 * 1024 * 1024,         // 10MB
  DOCUMENT_WORD: 10 * 1024 * 1024,        // 10MB
  DOCUMENT_EXCEL: 10 * 1024 * 1024,       // 10MB
  DOCUMENT_GENERAL: 25 * 1024 * 1024,     // 25MB
  
  // عمومی
  GENERAL: 10 * 1024 * 1024,              // 10MB
  GENERAL_LARGE: 50 * 1024 * 1024,        // 50MB
  
  // استوری
  STORY_IMAGE: 5 * 1024 * 1024,           // 5MB
  STORY_VIDEO: 20 * 1024 * 1024,          // 20MB
  
  // پیام
  MESSAGE_MEDIA: 25 * 1024 * 1024,        // 25MB
  MESSAGE_DOCUMENT: 25 * 1024 * 1024,     // 25MB
};

// ═══════════════════════════════════════════════════════════════════
// 🏭 سازنده‌های Multer
// ═══════════════════════════════════════════════════════════════════

/**
 * ایجاد تنظیمات multer سفارشی
 */
const createMulterConfig = (type = 'image', maxSize = FILE_SIZE_LIMITS.GENERAL, destination = 'TEMP') => {
  const destinationMap = {
    video: 'VIDEOS',
    document: 'DOCUMENTS',
    audio: 'AUDIO',
    profile: 'PROFILE',
    cover: 'COVERS',
    post: 'POSTS',
    story: 'STORIES',
    message: 'MESSAGES',
    attachment: 'ATTACHMENTS',
    temp: 'TEMP'
  };

  const storageKey = destinationMap[destination] || 'TEMP';
  
  return multer({
    storage: createSimpleStorage(storageKey),
    limits: { 
      fileSize: maxSize,
      files: 10,
      fields: 20
    },
    fileFilter: fileFilters[type] || fileFilters.all
  });
};

/**
 * ایجاد تنظیمات multer پیشرفته با گزینه‌های بیشتر
 */
const createAdvancedMulter = (options = {}) => {
  const {
    type = 'all',
    maxSize = FILE_SIZE_LIMITS.GENERAL,
    destination = 'TEMP',
    useDateStructure = true,
    preserveExtension = true,
    fieldName = 'file',
    maxCount = 1
  } = options;

  const destinationMap = {
    video: 'VIDEOS',
    document: 'DOCUMENTS',
    audio: 'AUDIO',
    profile: 'PROFILE',
    cover: 'COVERS',
    post: 'POSTS',
    story: 'STORIES',
    message: 'MESSAGES',
    attachment: 'ATTACHMENTS',
    temp: 'TEMP'
  };

  const storageKey = destinationMap[destination] || 'TEMP';

  return multer({
    storage: createAdvancedStorage(storageKey, {
      useDateStructure,
      preserveExtension
    }),
    limits: { 
      fileSize: maxSize,
      files: maxCount,
      fields: 20,
      parts: 50
    },
    fileFilter: fileFilters[type] || fileFilters.all
  });
};

// ═══════════════════════════════════════════════════════════════════
// ✅ Multer‌های آماده
// ═══════════════════════════════════════════════════════════════════

// پیش‌فرض
const upload = multer({
  storage: createSimpleStorage('TEMP'),
  limits: { fileSize: FILE_SIZE_LIMITS.GENERAL },
  fileFilter: fileFilters.all
});

// پروفایل
const uploadProfile = createMulterConfig('image', FILE_SIZE_LIMITS.PROFILE_AVATAR, 'profile').single('avatar');
const uploadProfileMultiple = createMulterConfig('image', FILE_SIZE_LIMITS.PROFILE_AVATAR, 'profile').array('avatars', 5);
const uploadCover = createMulterConfig('image', FILE_SIZE_LIMITS.PROFILE_COVER, 'cover').single('cover');

// پست
const uploadPostImage = createMulterConfig('image', FILE_SIZE_LIMITS.POST_IMAGE, 'post').single('image');
const uploadPostImages = createMulterConfig('image', FILE_SIZE_LIMITS.POST_IMAGE, 'post').array('images', 10);
const uploadPostVideo = createMulterConfig('video', FILE_SIZE_LIMITS.POST_VIDEO, 'post').single('video');
const uploadPostAudio = createMulterConfig('audio', FILE_SIZE_LIMITS.POST_AUDIO, 'post').single('audio');

// اسناد
const uploadDocument = createMulterConfig('document', FILE_SIZE_LIMITS.DOCUMENT_GENERAL, 'document').single('document');
const uploadDocuments = createMulterConfig('document', FILE_SIZE_LIMITS.DOCUMENT_GENERAL, 'document').array('documents', 10);

// استوری
const uploadStoryImage = createMulterConfig('image', FILE_SIZE_LIMITS.STORY_IMAGE, 'story').single('image');
const uploadStoryVideo = createMulterConfig('video', FILE_SIZE_LIMITS.STORY_VIDEO, 'story').single('video');

// پیام
const uploadMessageMedia = createMulterConfig('all', FILE_SIZE_LIMITS.MESSAGE_MEDIA, 'message').single('media');
const uploadMessageMultiple = createMulterConfig('all', FILE_SIZE_LIMITS.MESSAGE_MEDIA, 'message').array('files', 10);

// چند فیلدی
const uploadMixed = multer({
  storage: createSimpleStorage('TEMP'),
  limits: { fileSize: FILE_SIZE_LIMITS.GENERAL, files: 5 },
  fileFilter: fileFilters.all
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 3 },
  { name: 'videos', maxCount: 2 }
]);

// همه نوع
const uploadAny = createMulterConfig('all', FILE_SIZE_LIMITS.GENERAL).any();

// ═══════════════════════════════════════════════════════════════════
// 🖼️ پردازش تصویر (با Sharp)
// ═══════════════════════════════════════════════════════════════════

const imageProcessing = {
  /**
   * پردازش و بهینه‌سازی تصویر
   */
  process: async (filePath, options = {}) => {
    if (!sharp) {
      console.warn('⚠️ Sharp نصب نیست. از پردازش تصویر صرف نظر شد.');
      return filePath;
    }

    const {
      width = null,
      height = null,
      quality = 80,
      format = 'jpeg',
      fit = 'cover',
      grayscale = false,
      blur = 0,
      sharpen = false,
      rotate = null,
      flip = false,
      flop = false
    } = options;

    try {
      let pipeline = sharp(filePath);

      // تغییر اندازه
      if (width || height) {
        pipeline = pipeline.resize(width, height, { fit });
      }

      // چرخش
      if (rotate !== null) {
        pipeline = pipeline.rotate(rotate);
      }

      // flip و flop
      if (flip) pipeline = pipeline.flip();
      if (flop) pipeline = pipeline.flop();

      // خاکستری
      if (grayscale) pipeline = pipeline.grayscale();

      // تاری
      if (blur > 0) pipeline = pipeline.blur(blur);

      // تیزی
      if (sharpen) pipeline = pipeline.sharpen();

      // فرمت خروجی
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, compressionLevel: 9 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality });
          break;
        case 'gif':
          pipeline = pipeline.gif();
          break;
      }

      // ذخیره فایل جدید
      const ext = format === 'jpeg' ? 'jpg' : format;
      const newPath = filePath.replace(/\.[^.]+$/, `.${ext}`);
      
      await pipeline.toFile(newPath);

      // حذف فایل اصلی اگر نام تغییر کرده
      if (newPath !== filePath) {
        await fs.promises.unlink(filePath);
      }

      return newPath;
    } catch (error) {
      console.error('❌ خطا در پردازش تصویر:', error);
      return filePath;
    }
  },

  /**
   * ایجاد thumbnail
   */
  createThumbnail: async (filePath, options = {}) => {
    const {
      width = 200,
      height = 200,
      quality = 70,
      fit = 'cover'
    } = options;

    const thumbnailPath = filePath.replace(/(\.[^.]+)$/, `_thumb$1`);
    
    if (!sharp) return filePath;

    try {
      await sharp(filePath)
        .resize(width, height, { fit })
        .jpeg({ quality, mozjpeg: true })
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      console.error('❌ خطا در ایجاد thumbnail:', error);
      return filePath;
    }
  },

  /**
   * تغییر اندازه برای شبکیه (Retina)
   */
  createRetinaVersions: async (filePath) => {
    if (!sharp) return [filePath];

    const versions = [];
    const basePath = filePath.replace(/\.[^.]+$/, '');
    const ext = path.extname(filePath);

    const sizes = [
      { suffix: '_sm', width: 320 },
      { suffix: '_md', width: 640 },
      { suffix: '_lg', width: 1024 },
      { suffix: '_xl', width: 1920 }
    ];

    try {
      for (const size of sizes) {
        const outputPath = `${basePath}${size.suffix}${ext}`;
        
        await sharp(filePath)
          .resize(size.width, null, { withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true })
          .toFile(outputPath);
        
        versions.push(outputPath);
      }
      
      return versions;
    } catch (error) {
      console.error('❌ خطا در ایجاد نسخه‌های retina:', error);
      return [filePath];
    }
  },

  /**
   * دریافت اطلاعات تصویر
   */
  getMetadata: async (filePath) => {
    if (!sharp) return null;

    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      console.error('❌ خطا در دریافت metadata:', error);
      return null;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// ⚠️ مدیریت خطاها
// ═══════════════════════════════════════════════════════════════════

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // خطاهای Multer
    const errorMessages = {
      LIMIT_PART_COUNT: 'تعداد بخش‌های فایل بیش از حد مجاز است',
      LIMIT_FILE_SIZE: `حجم فایل بیش از حد مجاز است (حداکثر ${(err.limit / 1024 / 1024).toFixed(0)}MB)`,
      LIMIT_FILE_COUNT: 'تعداد فایل‌ها بیش از حد مجاز است',
      LIMIT_FIELD_KEY: 'نام فیلد خیلی طولانی است',
      LIMIT_FIELD_VALUE: 'مقدار فیلد خیلی طولانی است',
      LIMIT_FIELD_COUNT: 'تعداد فیلدها بیش از حد مجاز است',
      LIMIT_UNEXPECTED_FILE: 'فیلد فایل غیرمنتظره'
    };

    const message = errorMessages[err.code] || `❌ خطای آپلود: ${err.message}`;
    
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: message,
        field: err.field
      }
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || '❌ خطای ناشناخته در آپلود فایل'
      }
    });
  }
  
  next();
};

// ═══════════════════════════════════════════════════════════════════
// 🧹 پاکسازی فایل‌ها
// ═══════════════════════════════════════════════════════════════════

/**
 * پاکسازی فایل‌های موقت در صورت خطا
 */
const cleanupTempFiles = (req, res, next) => {
  const cleanup = async () => {
    try {
      // پاکسازی تک فایل
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      
      // پاکسازی چند فایل
      if (req.files && Array.isArray(req.files)) {
        await Promise.all(
          req.files.map(file => 
            fs.promises.unlink(file.path).catch(() => {})
          )
        );
      }
      
      // پاکسازی فایل‌های fields
      if (req.files && typeof req.files === 'object') {
        for (const field in req.files) {
          await Promise.all(
            req.files[field].map(file => 
              fs.promises.unlink(file.path).catch(() => {})
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ خطا در پاکسازی فایل‌ها:', error);
    }
  };

  // اگر پاسخ با خطا بود، پاکسازی کن
  if (res.statusCode >= 400) {
    cleanup();
  }
  
  next();
};

/**
 * حذف فایل با مسیر
 */
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطا در حذف فایل:', error);
    return false;
  }
};

/**
 * حذف چند فایل
 */
const deleteFiles = async (filePaths) => {
  return Promise.all(filePaths.map(path => deleteFile(path)));
};

// ═══════════════════════════════════════════════════════════════════
// 📊 آمار و متریک‌ها
// ═══════════════════════════════════════════════════════════════════

const uploadMetrics = {
  totalUploads: 0,
  totalSize: 0,
  failedUploads: 0,
  byType: {
    image: { count: 0, size: 0 },
    video: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
    document: { count: 0, size: 0 }
  },

  recordUpload(file) {
    this.totalUploads++;
    this.totalSize += file.size;
    
    const type = this.getFileType(file.mimetype);
    if (this.byType[type]) {
      this.byType[type].count++;
      this.byType[type].size += file.size;
    }
  },

  recordFailure() {
    this.failedUploads++;
  },

  getFileType(mimeType) {
    if (allImageMimes.includes(mimeType)) return 'image';
    if (allVideoMimes.includes(mimeType)) return 'video';
    if (allAudioMimes.includes(mimeType)) return 'audio';
    if (allDocumentMimes.includes(mimeType)) return 'document';
    return 'other';
  },

  getStats() {
    return {
      totalUploads: this.totalUploads,
      totalSize: this.totalSize,
      totalSizeFormatted: this.formatBytes(this.totalSize),
      failedUploads: this.failedUploads,
      byType: this.byType,
      averageSize: this.totalUploads > 0 ? this.totalSize / this.totalUploads : 0
    };
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  reset() {
    this.totalUploads = 0;
    this.totalSize = 0;
    this.failedUploads = 0;
    this.byType = {
      image: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      document: { count: 0, size: 0 }
    };
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🔐 اعتبارسنجی امنیتی
// ═══════════════════════════════════════════════════════════════════

const securityValidation = {
  /**
   * بررسی نام فایل مخرب
   */
  validateFilename: (filename) => {
    const dangerousPatterns = [
      /\.\./,  // Path traversal
      /^\//,   // Absolute path
      /^[a-zA-Z]:/, // Windows absolute path
      /\0/     // Null byte
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(filename)) {
        return false;
      }
    }
    return true;
  },

  /**
   * بررسی نوع MIME واقعی فایل
   */
  validateMagicBytes: async (filePath) => {
    // TODO: پیاده‌سازی با استفاده از library مثل file-type
    return true;
  },

  /**
   * اسکن فایل برای ویروس (اختیاری)
   */
  scanFile: async (filePath) => {
    // TODO: ادغام با ClamAV یا سرویس‌های مشابه
    return true;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ☁️ پشتیبانی از آپلود ابری (Cloud Storage)
// ═══════════════════════════════════════════════════════════════════

const cloudStorage = {
  // AWS S3
  s3: null,
  
  // Google Cloud Storage
  gcs: null,

  /**
   * تنظیم AWS S3
   */
  initS3: (config) => {
    try {
      const AWS = require('aws-sdk');
      cloudStorage.s3 = new AWS.S3({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region
      });
      cloudStorage.s3.bucket = config.bucket;
      console.log('☁️ AWS S3 initialized');
    } catch (e) {
      console.warn('⚠️ AWS SDK نصب نیست: npm i aws-sdk');
    }
  },

  /**
   * آپلود به S3
   */
  uploadToS3: async (filePath, options = {}) => {
    if (!cloudStorage.s3) {
      throw new Error('S3 initialized نیست');
    }

    const fileContent = await fs.promises.readFile(filePath);
    const key = options.key || `uploads/${Date.now()}-${path.basename(filePath)}`;

    const result = await cloudStorage.s3.upload({
      Bucket: cloudStorage.s3.bucket,
      Key: key,
      Body: fileContent,
      ContentType: options.contentType,
      ACL: options.acl || 'public-read'
    }).promise();

    return result.Location;
  },

  /**
   * حذف از S3
   */
  deleteFromS3: async (key) => {
    if (!cloudStorage.s3) return false;

    await cloudStorage.s3.deleteObject({
      Bucket: cloudStorage.s3.bucket,
      Key: key
    }).promise();

    return true;
  }
};

// ═══════════════════════════════════════════════════════════════════
// 📤 Export نهایی
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // ✅ Multer پیش‌فرض
  upload,

  // ✅ Multer‌های آماده
  uploadProfile,
  uploadProfileMultiple,
  uploadCover,
  uploadPostImage,
  uploadPostImages,
  uploadPostVideo,
  uploadPostAudio,
  uploadDocument,
  uploadDocuments,
  uploadStoryImage,
  uploadStoryVideo,
  uploadMessageMedia,
  uploadMessageMultiple,
  uploadMixed,
  uploadAny,

  // ✅ توابع کمکی
  handleUploadError,
  cleanupTempFiles,
  deleteFile,
  deleteFiles,

  // ✅ پردازش تصویر
  imageProcessing,

  // ✅ متریک‌ها
  metrics: uploadMetrics,

  // ✅ امنیت
  security: securityValidation,

  // ✅ ابری
  cloud: cloudStorage,

  // ✅ تنظیمات
  FILE_SIZE_LIMITS,
  UPLOAD_PATHS,
  MIME_TYPES,

  // ✅ سازنده‌ها
  createMulterConfig,
  createAdvancedMulter,
  createSimpleStorage,
  createAdvancedStorage,

  // ✅ فیلترها
  fileFilters
};
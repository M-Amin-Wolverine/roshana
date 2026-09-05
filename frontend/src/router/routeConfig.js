// routes/routeConfig.js - کانفیگ جامع روت‌ها

// ==================== انواع داده‌ها ====================
/**
 * @typedef {Object} RouteConfig
 * @property {string} path - مسیر روت
 * @property {string} title - عنوان فارسی
 * @property {string} enTitle - عنوان انگلیسی
 * @property {string} icon - آیکون
 * @property {string} description - توضیحات
 * @property {string[]} breadcrumb - مسیر breadcrumb
 * @property {string[]} roles - نقش‌های مجاز
 * @property {string[]} permissions - مجوزهای لازم
 * @property {boolean} isHidden - مخفی در منو
 * @property {boolean} isExternal - لینک خارجی
 * @property {string} component - کامپوننت
 * @property {Object} meta - متا دیتای سئو
 * @property {Object} animation - تنظیمات انیمیشن
 * @property {Object} layout - لایهوت مورد نظر
 */

// ==================== تنظیمات اصلی ====================
export const routeConfig = {
  // 🌐 صفحات عمومی (بدون نیاز به احراز هویت)
  public: {
    home: {
      path: '/home',
      title: 'خانه',
      enTitle: 'Home',
      icon: '🏠',
      description: 'صفحه اصلی سامانه',
      breadcrumb: ['خانه'],
      layout: 'auth',
      meta: {
        title: 'خانه | دانشگاه روشنا',
        description: 'سامانه جامع دانشگاهی - دانشگاه روشنا',
        keywords: 'دانشگاه, آموزش, سامانه',
        ogImage: '/images/og/home.jpg',
      },
      animation: { type: 'fade', duration: 300 }
    },
    login: {
      path: '/auth/login',
      title: 'ورود به سیستم',
      enTitle: 'Login',
      icon: '🔑',
      description: 'ورود به حساب کاربری',
      breadcrumb: ['خانه', 'ورود'],
      isHidden: true,
      layout: 'auth',
      meta: {
        title: 'ورود | دانشگاه روشنا',
        description: 'ورود به سامانه دانشگاهی',
      },
      animation: { type: 'slide', direction: 'left', duration: 400 }
    },
    register: {
      path: '/auth/register',
      title: 'ثبت‌نام',
      enTitle: 'Register',
      icon: '📝',
      description: 'ثبت‌نام در سامانه',
      breadcrumb: ['خانه', 'ثبت‌نام'],
      isHidden: true,
      layout: 'auth',
      meta: {
        title: 'ثبت‌نام | دانشگاه روشنا',
        description: 'ثبت‌نام در سامانه دانشگاهی',
      },
      animation: { type: 'slide', direction: 'right', duration: 400 }
    },
    forgotPassword: {
      path: '/auth/forgot-password',
      title: 'فراموشی رمز عبور',
      enTitle: 'Forgot Password',
      icon: '🔐',
      description: 'بازیابی رمز عبور',
      breadcrumb: ['خانه', 'فراموشی رمز'],
      isHidden: true,
      layout: 'auth',
      meta: {
        title: 'فراموشی رمز | دانشگاه روشنا',
        description: 'بازیابی رمز عبور',
      },
      animation: { type: 'fade', duration: 300 }
    },
    verifyEmail: {
      path: '/auth/verify-email/:token',
      title: 'تایید ایمیل',
      enTitle: 'Verify Email',
      isHidden: true,
      layout: 'auth',
    },
    resetPassword: {
      path: '/auth/reset-password/:token',
      title: 'بازیابی رمز عبور',
      enTitle: 'Reset Password',
      isHidden: true,
      layout: 'auth',
    },
  },

  // 🔒 صفحات خصوصی (نیاز به احراز هویت)
  private: {
    // 📊 داشبورد
    dashboard: {
      path: '/app/dashboard',
      title: 'داشبورد',
      enTitle: 'Dashboard',
      icon: '📊',
      description: 'مشاهده وضعیت کلی',
      breadcrumb: ['خانه', 'داشبورد'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'داشبورد | دانشگاه روشنا',
        description: 'مشاهده وضعیت تحصیلی و امور دانشگاه',
        keywords: 'داشبورد, دانشگاه, تحصیل',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },

    // 📚 آموزش
    classroom: {
      path: '/app/classroom',
      title: 'کلاس آنلاین',
      enTitle: 'Classroom',
      icon: '🎓',
      description: 'شرکت در کلاس‌های مجازی',
      breadcrumb: ['خانه', 'آموزش', 'کلاس آنلاین'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'کلاس آنلاین | دانشگاه روشنا',
        description: 'شرکت در کلاس‌های مجازی',
        keywords: 'کلاس آنلاین, آموزش, مجازی',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    classroomDetail: {
      path: '/app/classroom/:classId',
      title: 'جزئیات کلاس',
      enTitle: 'Class Detail',
      icon: '🎓',
      breadcrumb: ['خانه', 'آموزش', 'کلاس آنلاین', 'جزئیات'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      isHidden: true,
    },
    live: {
      path: '/app/live',
      title: 'پخش زنده',
      enTitle: 'Live Stream',
      icon: '📺',
      description: 'مشاهده کلاس‌های زنده',
      breadcrumb: ['خانه', 'آموزش', 'پخش زنده'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'پخش زنده | دانشگاه روشنا',
        description: 'مشاهده کلاس‌های زنده',
        keywords: 'پخش زنده, استریم, آموزش',
      },
      animation: { type: 'zoom', duration: 400 }
    },
    library: {
      path: '/app/library',
      title: 'کتابخانه',
      enTitle: 'Library',
      icon: '📚',
      description: 'دسترسی به منابع علمی',
      breadcrumb: ['خانه', 'آموزش', 'کتابخانه'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'کتابخانه | دانشگاه روشنا',
        description: 'دسترسی به منابع علمی و کتاب‌ها',
        keywords: 'کتابخانه, منابع, علمی',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    calendar: {
      path: '/app/calendar',
      title: 'تقویم آموزشی',
      enTitle: 'Calendar',
      icon: '📅',
      description: 'مشاهده برنامه کلاسی و امتحانات',
      breadcrumb: ['خانه', 'آموزش', 'تقویم'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'تقویم | دانشگاه روشنا',
        description: 'برنامه کلاسی و امتحانات',
        keywords: 'تقویم, برنامه, امتحان',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },

    // 💬 ارتباطات
    messaging: {
      path: '/app/messaging',
      title: 'پیام‌رسان',
      enTitle: 'Messaging',
      icon: '💬',
      description: 'ارسال و دریافت پیام',
      badge: { value: 0, color: 'red' },
      breadcrumb: ['خانه', 'ارتباطات', 'پیام‌رسان'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'پیام‌رسان | دانشگاه روشنا',
        description: 'ارسال و دریافت پیام',
        keywords: 'پیام, چت, ارتباط',
      },
      animation: { type: 'slide', direction: 'right', duration: 300 }
    },
    messagingDetail: {
      path: '/app/messaging/:conversationId',
      title: 'گفتگو',
      enTitle: 'Conversation',
      icon: '💬',
      breadcrumb: ['خانه', 'ارتباطات', 'پیام‌رسان', 'گفتگو'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      isHidden: true,
    },
    forum: {
      path: '/app/forum',
      title: 'فروم',
      enTitle: 'Forum',
      icon: '🎮',
      description: 'گفتگو و تبادل نظر',
      breadcrumb: ['خانه', 'ارتباطات', 'فروم'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'فروم | دانشگاه روشنا',
        description: 'فروم گفتگوی دانشجویان',
        keywords: 'فروم, گفتگو, انجمن',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    forumDetail: {
      path: '/app/forum/:topicId',
      title: 'موضوع',
      enTitle: 'Topic',
      icon: '🎮',
      breadcrumb: ['خانه', 'ارتباطات', 'فروم', 'موضوع'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      isHidden: true,
    },

    // 🛠 خدمات
    automation: {
      path: '/app/automation',
      title: 'اتوماسیون',
      enTitle: 'Automation',
      icon: '⚙️',
      description: 'امور اداری و اتوماسیون',
      breadcrumb: ['خانه', 'خدمات', 'اتوماسیون'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'اتوماسیون | دانشگاه روشنا',
        description: 'امور اداری و اتوماسیون',
        keywords: 'اتوماسیون, اداری, درخواست',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    food: {
      path: '/app/food',
      title: 'تغذیه',
      enTitle: 'Food Service',
      icon: '🍽️',
      description: 'سفارش غذا و مشاهده منو',
      breadcrumb: ['خانه', 'خدمات', 'تغذیه'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'تغذیه | دانشگاه روشنا',
        description: 'سفارش غذا و منوی روزانه',
        keywords: 'تغذیه, غذا, سلف',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    transport: {
      path: '/app/transport',
      title: 'حمل‌ونقل',
      enTitle: 'Transport',
      icon: '🚌',
      description: 'سرویس دانشگاه و تاکسی',
      breadcrumb: ['خانه', 'خدمات', 'حمل‌ونقل'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'حمل‌ونقل | دانشگاه روشنا',
        description: 'سرویس دانشگاه و حمل‌ونقل',
        keywords: 'حمل‌ونقل, سرویس, تاکسی',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    dormitory: {
      path: '/app/dormitory',
      title: 'خوابگاه',
      enTitle: 'Dormitory',
      icon: '🏠',
      description: 'مدیریت خوابگاه',
      breadcrumb: ['خانه', 'خدمات', 'خوابگاه'],
      roles: ['student', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'خوابگاه | دانشگاه روشنا',
        description: 'مدیریت امور خوابگاه',
        keywords: 'خوابگاه, اسکان, خوابگاهی',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },

    // 💰 مالی
    wallet: {
      path: '/app/wallet',
      title: 'کیف‌پول',
      enTitle: 'Wallet',
      icon: '💳',
      description: 'مدیریت اعتبار و پرداخت',
      breadcrumb: ['خانه', 'مالی', 'کیف‌پول'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'کیف‌پول | دانشگاه روشنا',
        description: 'مدیریت اعتبار و پرداخت',
        keywords: 'کیف‌پول, پرداخت, اعتبار',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    transactions: {
      path: '/app/transactions',
      title: 'تراکنش‌ها',
      enTitle: 'Transactions',
      icon: '💰',
      description: 'تاریخچه تراکنش‌ها',
      breadcrumb: ['خانه', 'مالی', 'تراکنش‌ها'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'تراکنش‌ها | دانشگاه روشنا',
        description: 'تاریخچه تراکنش‌ها',
        keywords: 'تراکنش, پرداخت, مالی',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    payments: {
      path: '/app/payments',
      title: 'پرداخت‌ها',
      enTitle: 'Payments',
      icon: '💵',
      description: 'پرداخت آنلاین',
      breadcrumb: ['خانه', 'مالی', 'پرداخت‌ها'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'پرداخت | دانشگاه روشنا',
        description: 'پرداخت آنلاین شهریه و سایر موارد',
        keywords: 'پرداخت, شهریه, آنلاین',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },

    // 👤 پروفایل
    profile: {
      path: '/app/profile',
      title: 'پروفایل',
      enTitle: 'Profile',
      icon: '👤',
      description: 'مشاهده و ویرایش پروفایل',
      breadcrumb: ['خانه', 'پروفایل'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'پروفایل | دانشگاه روشنا',
        description: 'مشاهده و ویرایش پروفایل کاربری',
        keywords: 'پروفایل, اطلاعات, کاربر',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    profileDetail: {
      path: '/app/profile/:userId',
      title: 'پروفایل کاربر',
      enTitle: 'User Profile',
      icon: '👤',
      breadcrumb: ['خانه', 'پروفایل', 'کاربر'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      isHidden: true,
    },
    settings: {
      path: '/app/settings',
      title: 'تنظیمات',
      enTitle: 'Settings',
      icon: '⚙️',
      description: 'تنظیمات حساب کاربری',
      breadcrumb: ['خانه', 'تنظیمات'],
      roles: ['student', 'teacher', 'admin', 'superadmin'],
      layout: 'main',
      meta: {
        title: 'تنظیمات | دانشگاه روشنا',
        description: 'تنظیمات حساب کاربری',
        keywords: 'تنظیمات, حساب, امنیت',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
  },

  // 👑 صفحات مدیریت
  admin: {
    dashboard: {
      path: '/admin/dashboard',
      title: 'پنل مدیریت',
      enTitle: 'Admin Dashboard',
      icon: '📊',
      description: 'پنل مدیریت سیستم',
      breadcrumb: ['مدیریت', 'داشبورد'],
      roles: ['admin', 'superadmin'],
      layout: 'admin',
      meta: {
        title: 'پنل مدیریت | دانشگاه روشنا',
        description: 'پنل مدیریت سیستم',
        keywords: 'مدیریت, پنل, ادمین',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    users: {
      path: '/admin/users',
      title: 'مدیریت کاربران',
      enTitle: 'User Management',
      icon: '👥',
      description: 'مدیریت کاربران سیستم',
      breadcrumb: ['مدیریت', 'کاربران'],
      roles: ['admin', 'superadmin'],
      permissions: ['users.view'],
      layout: 'admin',
      meta: {
        title: 'مدیریت کاربران | دانشگاه روشنا',
        description: 'مدیریت کاربران سیستم',
        keywords: 'کاربران, مدیریت, ادمین',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    userDetail: {
      path: '/admin/users/:userId',
      title: 'جزئیات کاربر',
      enTitle: 'User Detail',
      icon: '👤',
      breadcrumb: ['مدیریت', 'کاربران', 'جزئیات'],
      roles: ['admin', 'superadmin'],
      permissions: ['users.view', 'users.edit'],
      layout: 'admin',
      isHidden: true,
    },
    reports: {
      path: '/admin/reports',
      title: 'گزارشات',
      enTitle: 'Reports',
      icon: '📈',
      description: 'مشاهده گزارشات سیستم',
      breadcrumb: ['مدیریت', 'گزارشات'],
      roles: ['admin', 'superadmin'],
      permissions: ['reports.view'],
      layout: 'admin',
      meta: {
        title: 'گزارشات | دانشگاه روشنا',
        description: 'گزارشات سیستم',
        keywords: 'گزارش, آمار, تحلیل',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    settings: {
      path: '/admin/settings',
      title: 'تنظیمات سیستم',
      enTitle: 'System Settings',
      icon: '⚙️',
      description: 'تنظیمات سیستم',
      breadcrumb: ['مدیریت', 'تنظیمات'],
      roles: ['superadmin'],
      permissions: ['settings.manage'],
      layout: 'admin',
      meta: {
        title: 'تنظیمات سیستم | دانشگاه روشنا',
        description: 'تنظیمات سیستم',
        keywords: 'تنظیمات, سیستم, مدیریت',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
    logs: {
      path: '/admin/logs',
      title: 'لاگ‌های سیستم',
      enTitle: 'System Logs',
      icon: '📝',
      description: 'مشاهده لاگ‌های سیستم',
      breadcrumb: ['مدیریت', 'لاگ‌ها'],
      roles: ['superadmin'],
      layout: 'admin',
      meta: {
        title: 'لاگ‌ها | دانشگاه روشنا',
        description: 'لاگ‌های سیستم',
        keywords: 'لاگ, سیستم, خطا',
      },
      animation: { type: 'fadeUp', duration: 400 }
    },
  },

  // ⚠️ صفحات خطا
  error: {
    notFound: {
      path: '/404',
      title: 'صفحه یافت نشد',
      enTitle: 'Not Found',
      icon: '❌',
      description: 'صفحه مورد نظر یافت نشد',
      breadcrumb: ['خطا', '404'],
      layout: 'auth',
      meta: {
        title: '404 | دانشگاه روشنا',
        description: 'صفحه یافت نشد',
      },
      animation: { type: 'fade', duration: 300 }
    },
    forbidden: {
      path: '/forbidden',
      title: 'دسترسی غیرمجاز',
      enTitle: 'Forbidden',
      icon: '🚫',
      description: 'دسترسی به این صفحه مجاز نیست',
      breadcrumb: ['خطا', 'دسترسی'],
      layout: 'auth',
      meta: {
        title: 'دسترسی غیرمجاز | دانشگاه روشنا',
        description: 'دسترسی غیرمجاز',
      },
      animation: { type: 'fade', duration: 300 }
    },
    maintenance: {
      path: '/maintenance',
      title: 'در حال تعمیر',
      enTitle: 'Maintenance',
      icon: '🔧',
      description: 'سایت در حال تعمیر است',
      breadcrumb: ['خطا', 'تعمیرات'],
      layout: 'auth',
      meta: {
        title: 'تعمیرات | دانشگاه روشنا',
        description: 'سایت در حال تعمیر است',
      },
      animation: { type: 'fade', duration: 300 }
    },
  }
}

// ==================== کانفیگ منو ====================
export const menuConfig = {
  // منوی اصلی (سمت راست)
  main: {
    dashboard: { ...routeConfig.private.dashboard, order: 1 },
    education: {
      title: 'آموزش',
      enTitle: 'Education',
      icon: '🎓',
      order: 2,
      children: [
        { ...routeConfig.private.classroom, order: 1 },
        { ...routeConfig.private.live, order: 2 },
        { ...routeConfig.private.library, order: 3 },
        { ...routeConfig.private.calendar, order: 4 },
      ]
    },
    communication: {
      title: 'ارتباطات',
      enTitle: 'Communication',
      icon: '💬',
      order: 3,
      children: [
        { ...routeConfig.private.messaging, order: 1 },
        { ...routeConfig.private.forum, order: 2 },
      ]
    },
    services: {
      title: 'خدمات',
      enTitle: 'Services',
      icon: '🛠',
      order: 4,
      children: [
        { ...routeConfig.private.automation, order: 1 },
        { ...routeConfig.private.food, order: 2 },
        { ...routeConfig.private.transport, order: 3 },
        { ...routeConfig.private.dormitory, order: 4 },
      ]
    },
    financial: {
      title: 'مالی',
      enTitle: 'Financial',
      icon: '💰',
      order: 5,
      children: [
        { ...routeConfig.private.wallet, order: 1 },
        { ...routeConfig.private.transactions, order: 2 },
        { ...routeConfig.private.payments, order: 3 },
      ]
    },
    profile: {
      title: 'پروفایل',
      enTitle: 'Profile',
      icon: '👤',
      order: 6,
      children: [
        { ...routeConfig.private.profile, order: 1 },
        { ...routeConfig.private.settings, order: 2 },
      ]
    },
  },

  // منوی مدیریت
  admin: {
    dashboard: { ...routeConfig.admin.dashboard, order: 1 },
    users: { ...routeConfig.admin.users, order: 2 },
    reports: { ...routeConfig.admin.reports, order: 3 },
    settings: { ...routeConfig.admin.settings, order: 4 },
    logs: { ...routeConfig.admin.logs, order: 5 },
  }
}

// ==================== کانفیگ API ====================
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email',
    },
    user: {
      profile: '/users/profile',
      updateProfile: '/users/profile',
      changePassword: '/users/change-password',
      uploadAvatar: '/users/avatar',
    },
    classroom: {
      list: '/classrooms',
      detail: (id) => `/classrooms/${id}`,
      join: (id) => `/classrooms/${id}/join`,
      materials: (id) => `/classrooms/${id}/materials`,
    },
    messaging: {
      conversations: '/messaging/conversations',
      messages: (id) => `/messaging/conversations/${id}/messages`,
      send: '/messaging/send',
    },
    admin: {
      users: '/admin/users',
      userDetail: (id) => `/admin/users/${id}`,
      reports: '/admin/reports',
      settings: '/admin/settings',
      logs: '/admin/logs',
    }
  }
}

// ==================== توابع کمکی ====================

/**
 * دریافت تمام روت‌ها به صورت یکجا
 */
export const getAllRoutes = () => ({
  ...routeConfig.public,
  ...routeConfig.private,
  ...routeConfig.admin,
  ...routeConfig.error
})

/**
 * دریافت عنوان صفحه
 * @param {string} pathname - مسیر جاری
 * @returns {string}
 */
export const getPageTitle = (pathname) => {
  const allRoutes = getAllRoutes()
  
  // بررسی مسیرهای داینامیک
  for (const [key, route] of Object.entries(allRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return route.title
      }
    }
    if (route.path === pathname) {
      return route.title
    }
  }
  
  return 'دانشگاه روشنا'
}

/**
 * دریافت breadcrumb
 * @param {string} pathname - مسیر جاری
 * @returns {string[]}
 */
export const getBreadcrumb = (pathname) => {
  const allRoutes = getAllRoutes()
  
  for (const [key, route] of Object.entries(allRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return route.breadcrumb || ['خانه']
      }
    }
    if (route.path === pathname) {
      return route.breadcrumb || ['خانه']
    }
  }
  
  return ['خانه']
}

/**
 * دریافت متا دیتای صفحه
 * @param {string} pathname - مسیر جاری
 * @returns {Object}
 */
export const getPageMeta = (pathname) => {
  const allRoutes = getAllRoutes()
  
  for (const [key, route] of Object.entries(allRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return route.meta || {}
      }
    }
    if (route.path === pathname) {
      return route.meta || {}
    }
  }
  
  return {}
}

/**
 * بررسی اینکه آیا روت نیاز به احراز هویت دارد
 * @param {string} pathname - مسیر جاری
 * @returns {boolean}
 */
export const isPrivateRoute = (pathname) => {
  const privateRoutes = { ...routeConfig.private, ...routeConfig.admin }
  
  for (const [key, route] of Object.entries(privateRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return true
      }
    }
    if (route.path === pathname) {
      return true
    }
  }
  
  return false
}

/**
 * بررسی اینکه آیا روت admin است
 * @param {string} pathname - مسیر جاری
 * @returns {boolean}
 */
export const isAdminRoute = (pathname) => {
  for (const [key, route] of Object.entries(routeConfig.admin)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return true
      }
    }
    if (route.path === pathname) {
      return true
    }
  }
  
  return false
}

/**
 * دریافت layout مناسب
 * @param {string} pathname - مسیر جاری
 * @returns {string}
 */
export const getLayout = (pathname) => {
  const allRoutes = getAllRoutes()
  
  for (const [key, route] of Object.entries(allRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return route.layout || 'auth'
      }
    }
    if (route.path === pathname) {
      return route.layout || 'auth'
    }
  }
  
  return 'auth'
}

/**
 * دریافت تنظیمات انیمیشن
 * @param {string} pathname - مسیر جاری
 * @returns {Object}
 */
export const getAnimation = (pathname) => {
  const allRoutes = getAllRoutes()
  
  for (const [key, route] of Object.entries(allRoutes)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`)
      if (regex.test(pathname)) {
        return route.animation || { type: 'fade', duration: 300 }
      }
    }
    if (route.path === pathname) {
      return route.animation || { type: 'fade', duration: 300 }
    }
  }
  
  return { type: 'fade', duration: 300 }
}

/**
 * فیلتر کردن منو بر اساس نقش
 * @param {Object} menu - کانفیگ منو
 * @param {string[]} userRoles - نقش‌های کاربر
 * @param {string[]} userPermissions - مجوزهای کاربر
 * @returns {Object}
 */
export const filterMenuByRole = (menu, userRoles = [], userPermissions = []) => {
  const filtered = {}
  
  for (const [key, item] of Object.entries(menu)) {
    // بررسی نقش‌ها
    if (item.roles && !item.roles.some(role => userRoles.includes(role))) {
      continue
    }
    
    // بررسی مجوزها
    if (item.permissions && !item.permissions.some(perm => userPermissions.includes(perm))) {
      continue
    }
    
    // بررسی children
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (child.roles && !child.roles.some(role => userRoles.includes(role))) {
          return false
        }
        if (child.permissions && !child.permissions.some(perm => userPermissions.includes(perm))) {
          return false
        }
        return true
      })
      
      if (filteredChildren.length > 0) {
        filtered[key] = { ...item, children: filteredChildren }
      }
    } else {
      filtered[key] = item
    }
  }
  
  return filtered
}

/**
 * مرتب‌سازی منو بر اساس order
 * @param {Object} menu - کانفیگ منو
 * @returns {Array}
 */
export const sortMenuByOrder = (menu) => {
  return Object.values(menu)
    .filter(item => !item.isHidden)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * تبدیل routeConfig به فرمت react-router
 * @returns {Array}
 */
export const generateRoutes = () => {
  const routes = []
  
  // Public routes
  for (const [key, config] of Object.entries(routeConfig.public)) {
    routes.push({
      path: config.path,
      element: config.component,
      meta: config,
    })
  }
  
  // Private routes
  for (const [key, config] of Object.entries(routeConfig.private)) {
    routes.push({
      path: config.path,
      element: config.component,
      meta: config,
    })
  }
  
  // Admin routes
  for (const [key, config] of Object.entries(routeConfig.admin)) {
    routes.push({
      path: config.path,
      element: config.component,
      meta: config,
    })
  }
  
  // Error routes
  for (const [key, config] of Object.entries(routeConfig.error)) {
    routes.push({
      path: config.path,
      element: config.component,
      meta: config,
    })
  }
  
  return routes
}

// ==================== کانفیگ‌های اضافی ====================

// نقش‌های کاربر
export const roles = {
  student: {
    label: 'دانشجو',
    enLabel: 'Student',
    color: '#4CAF50',
    permissions: [
      'classroom.join',
      'messaging.send',
      'forum.post',
      'wallet.view',
      'food.order',
      'transport.request',
      'dormitory.request',
    ]
  },
  teacher: {
    label: 'استاد',
    enLabel: 'Teacher',
    color: '#2196F3',
    permissions: [
      'classroom.create',
      'classroom.manage',
      'messaging.send',
      'forum.post',
      'wallet.view',
      'grades.enter',
    ]
  },
  admin: {
    label: 'مدیر',
    enLabel: 'Admin',
    color: '#FF9800',
    permissions: [
      'users.view',
      'users.edit',
      'users.delete',
      'reports.view',
      'settings.manage',
      'classroom.manage',
    ]
  },
  superadmin: {
    label: 'مدیر ارشد',
    enTitle: 'Super Admin',
    color: '#F44336',
    permissions: [
      '*', // همه مجوزها
    ]
  }
}

// پیام‌های خطا
export const errorMessages = {
  401: 'لطفا وارد سیستم شوید',
  403: 'دسترسی به این بخش ندارید',
  404: 'صفحه مورد نظر یافت نشد',
  500: 'خطای سرور رخ داده است',
  network: 'خطا در اتصال به اینترنت',
}

// تنظیمات پیش‌فرض
export const defaults = {
  pageSize: 20,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  supportedVideoTypes: ['video/mp4', 'video/webm'],
  dateFormat: 'YYYY/MM/DD',
  timeFormat: 'HH:mm',
  currency: 'IRT',
  language: 'fa',
  direction: 'rtl',
}

export default routeConfig
// ============================================================
//  ╔══════════════════════════════════════════════════════════════════╗
//  ║   Fartak Ultimate i18n System v6.0 - نسخه نهایی آتشین          ║
//  ║   بدون خطا - با کش هوشمند - پشتیبانی از React & Vanilla JS     ║
//  ╚══════════════════════════════════════════════════════════════════╝
// ============================================================
import React from 'react';

(function(global) {
  'use strict';

  // ============================================================
  //  📦 ترجمه‌های کامل - نسخه نهایی
  // ============================================================

  const TRANSLATIONS = {
    fa: {
      // ناوبری
      "home": "خانه",
      "login": "ورود",
      "signup": "ثبت‌نام",
      "logout": "خروج",
      "dashboard": "داشبورد",
      "forum": "فروم",
      "profile": "پروفایل",
      "settings": "تنظیمات",
      "notifications": "اعلان‌ها",
      "messages": "پیام‌ها",
      "contact": "تماس با ما",
      "about": "درباره ما",
      
      // قیمت‌گذاری
      "free": "رایگان",
      "toman": "تومان",
      "dollar": "دلار",
      "month": "ماه",
      "year": "سال",
      "oneTime": "یک‌بار",
      "billedMonthly": "مبلغ ماهانه",
      "billedYearly": "مبلغ سالانه",
      "lifetimeAccess": "دسترسی مادام‌العمر",
      "savePercent": "ذخیره {percent}٪",
      "getStartedBtn": "شروع کنید",
      "choosePlan": "انتخاب پلن",
      "contactSales": "تماس با فروش",
      "buyOnce": "خرید یکبار",
      "mostPopular": "محبوب‌ترین",
      "bestValue": "بهترین ارزش",
      "enrollNow": "ثبت‌نام →",
      "noResults": "دوره‌ای یافت نشد",
      "moneyBack": "ضمانت بازگشت ۳۰ روزه",
      
      // هیرو سکشن
      "heroBadge": "✨ پلتفرم هوشمند نسل آینده",
      "heroTitle": "بوم‌سیستم یکپارچه دانشگاهی",
      "heroDesc": "توانمندسازی آموزش با ابزارهای هوش مصنوعی، یادگیری مشارکتی و ارتباطات بی‌وقفه",
      "getStarted": "شروع کنید",
      "watchDemo": "مشاهده دمو",
      "heroStats": "بیش از {count} کاربر فعال",
      
      // ماژول‌ها
      "modulesTitle": "ماژول‌های قدرتمند فرتاک",
      "modulesDesc": "۱۲ ماژول هوشمند در یک پلتفرم یکپارچه",
      "moduleCourseware": "📚 درس‌افزار",
      "moduleCoursewareDesc": "مدیریت محتوای آموزشی پیشرفته",
      "moduleSci": "🔬 روشنا سای",
      "moduleSciDesc": "منابع علمی هوشمند با AI",
      "moduleLive": "📺 پخش زنده",
      "moduleLiveDesc": "استریم با کیفیت 4K",
      "moduleMeeting": "🎥 میتینگ",
      "moduleMeetingDesc": "جلسات آنلاین حرفه‌ای",
      "moduleConnect": "🔗 روشنا کانکت",
      "moduleConnectDesc": "کلاس آنلاین تعاملی",
      "moduleMessenger": "💬 روشنا مسنجر",
      "moduleMessengerDesc": "فروم درسی و پیام‌رسان",
      "moduleAutomation": "🤖 اتوماسیون",
      "moduleAutomationDesc": "فرآیندهای هوشمند بدون کد",
      "moduleGallery": "🖼️ گالری",
      "moduleGalleryDesc": "رسانه و محتوا",
      "modulePoll": "📊 نظرسنجی",
      "modulePollDesc": "تحلیل بازخورد لحظه‌ای",
      "moduleSecurity": "🛡️ امنیت",
      "moduleSecurityDesc": "سیستم حفاظت پیشرفته",
      "moduleDataCenter": "💾 دیتاسنتر",
      "moduleDataCenterDesc": "ذخیره‌سازی ابری امن",
      "moduleApiGateway": "🔌 API Gateway",
      "moduleApiGatewayDesc": "اتصال به سامانه‌های خارجی",
      
      // آمار
      "statsUsers": "کاربر فعال",
      "statsCourses": "دوره تخصصی",
      "statsUniversities": "دانشگاه همکار",
      "statsSatisfaction": "رضایت کاربران",
      "statsLiveNow": "آنلاین",
      "statsCountries": "کشور",
      
      // دوره‌ها
      "popularCourses": "🔥 دوره‌های محبوب",
      "popularCoursesDesc": "پرطرفدارترین دوره‌های فرتاک",
      "searchPlaceholder": "جستجوی دوره، استاد یا موضوع...",
      "filterAll": "همه",
      "filterBeginner": "مبتدی",
      "filterIntermediate": "متوسط",
      "filterAdvanced": "پیشرفته",
      "sortBy": "مرتب‌سازی بر اساس",
      "sortPopular": "محبوب‌ترین",
      "sortNewest": "جدیدترین",
      "sortPriceLow": "ارزان‌ترین",
      "sortPriceHigh": "گران‌ترین",
      "studentsCount": "{count} دانشجو",
      "rating": "امتیاز {rating}",
      
      // قیمت‌گذاری
      "pricingTitle": "💰 پلن‌های قیمت‌گذاری",
      "pricingDesc": "پلن مناسب خود را انتخاب کنید",
      "monthly": "ماهانه",
      "yearly": "سالانه",
      "yearlySave": "دو ماه رایگان",
      "features": "امکانات",
      "featureUsers": "تا {count} کاربر همزمان",
      "featureStorage": "{size} فضای ابری",
      "featureSupport": "پشتیبانی {hours} ساعته",
      "featureApi": "دسترسی API",
      "featureSla": "گارانتی {percent}٪ آپتایم",
      
      // نظرات کاربران
      "testimonialsTitle": "💬 نظرات مشتریان",
      "testimonialsDesc": "مورد اعتماد دانشگاه‌های برتر جهان",
      "verifiedUser": "کاربر تایید شده",
      "publishedOn": "نشر شده در {date}",
      
      // همکاران
      "partnersTitle": "🤝 همکاران ما",
      "partnersDesc": "بیش از ۱۰۰۰ موسسه به ما اعتماد دارند",
      
      // فوتر
      "footerDesc": "پلتفرم یکپارچه هوشمند برای آموزش مدرن",
      "quickLinks": "لینک‌های سریع",
      "aboutUs": "درباره ما",
      "contactUs": "تماس با ما",
      "blog": "وبلاگ",
      "support": "پشتیبانی",
      "faq": "سوالات متداول",
      "privacy": "حریم خصوصی",
      "terms": "قوانین و مقررات",
      "services": "سرویس‌ها",
      "automation": "اتوماسیون",
      "gallery": "گالری",
      "downloadApp": "دانلود اپلیکیشن",
      "webApp": "برنامه وب",
      "allRightsReserved": "تمامی حقوق محفوظ است",
      "builtWith": "ساخته شده با ❤️ برای آموزش",
      
      // پیام‌های سیستمی
      "loading": "در حال بارگذاری...",
      "error": "خطایی رخ داده است",
      "success": "عملیات با موفقیت انجام شد",
      "warning": "هشدار",
      "info": "اطلاعیه",
      "retry": "تلاش مجدد",
      "cancel": "انصراف",
      "confirm": "تایید",
      "save": "ذخیره",
      "delete": "حذف",
      "edit": "ویرایش",
      "add": "افزودن",
      "close": "بستن",
      "back": "بازگشت",
      "next": "بعدی",
      "submit": "ارسال",
      "search": "جستجو",
      "filter": "فیلتر",
      "clear": "پاک کردن",
      "showMore": "نمایش بیشتر",
      "showLess": "نمایش کمتر",
      "copy": "کپی",
      "copied": "کپی شد!",
      "share": "اشتراک‌گذاری",
      "download": "دانلود",
      "upload": "آپلود",
      "refresh": "بروزرسانی",
      
      // خطاها
      "error404": "صفحه مورد نظر یافت نشد",
      "error500": "خطای داخلی سرور",
      "errorNetwork": "خطای اتصال به اینترنت",
      "errorAuth": "لطفا وارد شوید",
      "errorPermission": "شما دسترسی لازم را ندارید",
      "tryAgain": "لطفا مجددا تلاش کنید",
      
      // فرم‌ها
      "name": "نام",
      "email": "ایمیل",
      "password": "رمز عبور",
      "confirmPassword": "تکرار رمز عبور",
      "rememberMe": "مرا به خاطر بسپار",
      "forgotPassword": "رمز عبور را فراموش کرده‌اید؟",
      "resetPassword": "بازیابی رمز عبور",
      "sendResetLink": "ارسال لینک بازیابی",
      
      // روزها
      "saturday": "شنبه",
      "sunday": "یکشنبه",
      "monday": "دوشنبه",
      "tuesday": "سه‌شنبه",
      "wednesday": "چهارشنبه",
      "thursday": "پنجشنبه",
      "friday": "جمعه",
      
      // ماه‌ها
      "january": "ژانویه",
      "february": "فوریه",
      "march": "مارس",
      "april": "آوریل",
      "may": "می",
      "june": "ژوئن",
      "july": "ژوئیه",
      "august": "اوت",
      "september": "سپتامبر",
      "october": "اکتبر",
      "november": "نوامبر",
      "december": "دسامبر",
      
      // زمان
      "justNow": "همین الان",
      "minutesAgo": "{count} دقیقه پیش",
      "hoursAgo": "{count} ساعت پیش",
      "daysAgo": "{count} روز پیش",
      "weeksAgo": "{count} هفته پیش",
      "monthsAgo": "{count} ماه پیش",
      "yearsAgo": "{count} سال پیش",
      
      // اعلان‌ها
      "welcomeMessage": "به فرتاک خوش آمدید! 🎉",
      "welcomeDesc": "خوشحالیم که به خانواده بزرگ فرتاک پیوستید",
      "purchaseSuccess": "خرید شما با موفقیت انجام شد ✅",
      "purchaseDesc": "پلن {plan} برای شما فعال شد",
      "saveSuccess": "تغییرات با موفقیت ذخیره شد",
      "deleteConfirm": "آیا از حذف این آیتم اطمینان دارید؟",
      
      // SEO
      "metaTitle": "فرتاک - سامانه جامع مدیریت آموزشی",
      "metaDesc": "پلتفرم هوشمند آموزش دیجیتال با قابلیت‌های پیشرفته هوش مصنوعی",
      "metaKeywords": "آموزش آنلاین، مدیریت دانشگاه، کلاس مجازی، فرتاک",
      
      // RTL
      "dir": "rtl",
      "textAlign": "right"
    },
    
    en: {
      "home": "Home",
      "login": "Login",
      "signup": "Sign Up",
      "logout": "Logout",
      "dashboard": "Dashboard",
      "forum": "Forum",
      "profile": "Profile",
      "settings": "Settings",
      "notifications": "Notifications",
      "messages": "Messages",
      "contact": "Contact",
      "about": "About",
      
      "free": "Free",
      "toman": "Toman",
      "dollar": "USD",
      "month": "month",
      "year": "year",
      "oneTime": "one-time",
      "billedMonthly": "billed monthly",
      "billedYearly": "billed yearly",
      "lifetimeAccess": "lifetime access",
      "savePercent": "Save {percent}%",
      "getStartedBtn": "Get Started",
      "choosePlan": "Choose Plan",
      "contactSales": "Contact Sales",
      "buyOnce": "Buy Once",
      "mostPopular": "Most Popular",
      "bestValue": "Best Value",
      "enrollNow": "Enroll Now →",
      "noResults": "No courses found.",
      "moneyBack": "30-day money-back guarantee",
      
      "heroBadge": "✨ Next-Gen Intelligent Platform",
      "heroTitle": "Unified Academic Ecosystem",
      "heroDesc": "Empowering education with AI-driven tools, collaborative learning, and seamless communication",
      "getStarted": "Get Started",
      "watchDemo": "Watch Demo",
      "heroStats": "{count}+ active users",
      
      "modulesTitle": "Fartak Powerful Modules",
      "modulesDesc": "12 intelligent modules in one unified platform",
      "moduleCourseware": "📚 Courseware",
      "moduleCoursewareDesc": "Advanced educational content management",
      "moduleSci": "🔬 Roshena Sci",
      "moduleSciDesc": "AI-powered scientific resources",
      "moduleLive": "📺 Live Streaming",
      "moduleLiveDesc": "4K quality streaming",
      "moduleMeeting": "🎥 Meeting",
      "moduleMeetingDesc": "Professional online meetings",
      "moduleConnect": "🔗 Roshena Connect",
      "moduleConnectDesc": "Interactive online classes",
      "moduleMessenger": "💬 Roshena Messenger",
      "moduleMessengerDesc": "Forum & messaging system",
      "moduleAutomation": "🤖 Automation",
      "moduleAutomationDesc": "No-code smart processes",
      "moduleGallery": "🖼️ Gallery",
      "moduleGalleryDesc": "Media & content management",
      "modulePoll": "📊 Poll & Survey",
      "modulePollDesc": "Real-time feedback analysis",
      "moduleSecurity": "🛡️ Security",
      "moduleSecurityDesc": "Advanced protection system",
      "moduleDataCenter": "💾 Data Center",
      "moduleDataCenterDesc": "Secure cloud storage",
      "moduleApiGateway": "🔌 API Gateway",
      "moduleApiGatewayDesc": "External system integration",
      
      "statsUsers": "Active Users",
      "statsCourses": "Courses",
      "statsUniversities": "Partner Universities",
      "statsSatisfaction": "Satisfaction Rate",
      "statsLiveNow": "Live Now",
      "statsCountries": "Countries",
      
      "popularCourses": "🔥 Popular Courses",
      "popularCoursesDesc": "Most enrolled courses on Fartak",
      "searchPlaceholder": "Search courses, instructors or topics...",
      "filterAll": "All",
      "filterBeginner": "Beginner",
      "filterIntermediate": "Intermediate",
      "filterAdvanced": "Advanced",
      "sortBy": "Sort by",
      "sortPopular": "Most Popular",
      "sortNewest": "Newest",
      "sortPriceLow": "Price: Low to High",
      "sortPriceHigh": "Price: High to Low",
      "studentsCount": "{count} students",
      "rating": "{rating} rating",
      
      "pricingTitle": "💰 Pricing Plans",
      "pricingDesc": "Choose the perfect plan for your needs",
      "monthly": "Monthly",
      "yearly": "Yearly",
      "yearlySave": "2 months free",
      "features": "Features",
      "featureUsers": "Up to {count} concurrent users",
      "featureStorage": "{size} cloud storage",
      "featureSupport": "{hours}/7 support",
      "featureApi": "API access",
      "featureSla": "{percent}% uptime guarantee",
      
      "testimonialsTitle": "💬 What Our Clients Say",
      "testimonialsDesc": "Trusted by leading institutions worldwide",
      "verifiedUser": "Verified User",
      "publishedOn": "Published on {date}",
      
      "partnersTitle": "🤝 Trusted By",
      "partnersDesc": "1000+ institutions trust us",
      
      "footerDesc": "Unified intelligent platform for modern education",
      "quickLinks": "Quick Links",
      "aboutUs": "About Us",
      "contactUs": "Contact Us",
      "blog": "Blog",
      "support": "Support",
      "faq": "FAQ",
      "privacy": "Privacy Policy",
      "terms": "Terms of Service",
      "services": "Services",
      "automation": "Automation",
      "gallery": "Gallery",
      "downloadApp": "Download App",
      "webApp": "Web App",
      "allRightsReserved": "All rights reserved.",
      "builtWith": "Built with ❤️ for education",
      
      "loading": "Loading...",
      "error": "An error occurred",
      "success": "Operation completed successfully",
      "warning": "Warning",
      "info": "Information",
      "retry": "Retry",
      "cancel": "Cancel",
      "confirm": "Confirm",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "close": "Close",
      "back": "Back",
      "next": "Next",
      "submit": "Submit",
      "search": "Search",
      "filter": "Filter",
      "clear": "Clear",
      "showMore": "Show More",
      "showLess": "Show Less",
      "copy": "Copy",
      "copied": "Copied!",
      "share": "Share",
      "download": "Download",
      "upload": "Upload",
      "refresh": "Refresh",
      
      "error404": "Page not found",
      "error500": "Internal server error",
      "errorNetwork": "Network error",
      "errorAuth": "Please login to continue",
      "errorPermission": "You don't have permission",
      "tryAgain": "Please try again",
      
      "name": "Name",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "rememberMe": "Remember me",
      "forgotPassword": "Forgot password?",
      "resetPassword": "Reset Password",
      "sendResetLink": "Send reset link",
      
      "saturday": "Saturday",
      "sunday": "Sunday",
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      
      "january": "January",
      "february": "February",
      "march": "March",
      "april": "April",
      "may": "May",
      "june": "June",
      "july": "July",
      "august": "August",
      "september": "September",
      "october": "October",
      "november": "November",
      "december": "December",
      
      "justNow": "Just now",
      "minutesAgo": "{count} minutes ago",
      "hoursAgo": "{count} hours ago",
      "daysAgo": "{count} days ago",
      "weeksAgo": "{count} weeks ago",
      "monthsAgo": "{count} months ago",
      "yearsAgo": "{count} years ago",
      
      "welcomeMessage": "Welcome to Fartak! 🎉",
      "welcomeDesc": "Glad to have you in the Fartak family",
      "purchaseSuccess": "Purchase successful ✅",
      "purchaseDesc": "{plan} plan has been activated",
      "saveSuccess": "Changes saved successfully",
      "deleteConfirm": "Are you sure you want to delete this item?",
      
      "metaTitle": "Fartak - Comprehensive Educational Management System",
      "metaDesc": "AI-powered digital education platform with advanced features",
      "metaKeywords": "online education, university management, virtual classroom, Fartak",
      
      "dir": "ltr",
      "textAlign": "left"
    }
  };


  class FartakI18n {
    constructor() {
      this.supportedLocales = ['fa', 'en'];
      this.defaultLocale = 'fa';
      this.currentLocale = this.getSavedLocale();
      this.translations = TRANSLATIONS;
      this.listeners = new Set();
      
      this.applyDirection();
    }
    
    getSavedLocale() {
      try {
        const saved = localStorage.getItem('fartak-locale');
        if (saved && this.supportedLocales.includes(saved)) return saved;
        const browserLang = navigator.language?.split('-')[0] || '';
        if (this.supportedLocales.includes(browserLang)) return browserLang;
        return this.defaultLocale;
      } catch {
        return this.defaultLocale;
      }
    }
    
    setLocale(locale) {
      if (!this.supportedLocales.includes(locale)) locale = this.defaultLocale;
      this.currentLocale = locale;
      localStorage.setItem('fartak-locale', locale);
      this.applyDirection();
      this.notifyListeners();
      return locale;
    }
    
    applyDirection() {
      const isRTL = this.currentLocale === 'fa';
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = this.currentLocale;
    }
    
    t(key, params = {}) {
      let text = this.translations[this.currentLocale]?.[key];
      if (!text) text = this.translations.en?.[key];
      if (!text) text = key;
      
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
      });
      return text;
    }
    
    onChange(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    
    notifyListeners() {
      this.listeners.forEach(cb => cb(this.currentLocale));
    }
    
    getCurrentLocale() { return this.currentLocale; }
    isRTL() { return this.currentLocale === 'fa'; }
  }

  // ایجاد نمونه
  const i18n = new FartakI18n();
  const t = (key, params) => i18n.t(key, params);
  const changeLanguage = (locale) => i18n.setLocale(locale);
  const useTranslation = () => {
    const [locale, setLocale] = React.useState(i18n.getCurrentLocale());
    React.useEffect(() => i18n.onChange(setLocale), []);
    return {
      t: i18n.t.bind(i18n),
      changeLanguage: i18n.setLocale.bind(i18n),
      locale,
      isRTL: i18n.isRTL()
    };
  };

  // ذخیره در گلوبال
  global.FartakI18n = { i18n, t, changeLanguage, useTranslation, TRANSLATIONS };
  
})(typeof window !== 'undefined' ? window : global);

// Export نهایی (برای import در React)
const { i18n, t, changeLanguage, useTranslation, TRANSLATIONS } = window.FartakI18n;

export default { i18n, t, changeLanguage, useTranslation, TRANSLATIONS };
export { i18n, t, changeLanguage, useTranslation, TRANSLATIONS };
export const getLocale = () => i18n.getCurrentLocale();
export const setLocale = (locale) => i18n.setLocale(locale);

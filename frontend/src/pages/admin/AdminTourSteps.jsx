// ============================================================
// src/pages/admin/AdminTourSteps.js - ULTIMATE ENTERPRISE VERSION
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, FaTimes, FaVolumeUp, FaVolumeMute, 
  FaPause, FaPlay, FaForward, FaBackward, 
  FaStar, FaTrophy, FaMedal, FaRocket, FaBrain,
  FaKeyboard, FaMousePointer, FaHandPointer, FaQuestionCircle,
  FaSmile, FaChartLine, FaLightbulb, FaFire
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

// سیستم ذخیره پیشرفت
const TourProgressStorage = {
  KEY: 'admin-tour-progress',
  
  get() {
    try {
      const saved = localStorage.getItem(this.KEY);
      return saved ? JSON.parse(saved) : { currentStep: 0, completed: false, startedAt: null };
    } catch {
      return { currentStep: 0, completed: false, startedAt: null };
    }
  },
  
  save(progress) {
    localStorage.setItem(this.KEY, JSON.stringify({
      ...progress,
      lastUpdated: new Date().toISOString()
    }));
  },
  
  complete() {
    const progress = this.get();
    progress.completed = true;
    progress.completedAt = new Date().toISOString();
    progress.completedSteps = progress.completedSteps || [];
    this.save(progress);
    
    // 🏅 اعطای نشان
// ✅ درست
    const badge = {
    id: 'tour-master',
    name: 'پنل‌شناس حرفه‌ای',
    icon: '🏅',
    description: 'تور آموزشی پنل مدیریت را کامل کردید',
    earnedAt: new Date().toISOString()
    };
    TourProgressStorage.giveBadge(badge);
    this.giveBadge(badge);
    
    // 🎉 جشن
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  },
  
  giveBadge(badge) {
    try {
      const badges = JSON.parse(localStorage.getItem('admin-badges') || '[]');
      const exists = badges.find(b => b.id === badge.id);
      if (!exists) {
        badges.push(badge);
        localStorage.setItem('admin-badges', JSON.stringify(badges));
      }
    } catch {
      // ignore
    }
  },
  
  markStepComplete(stepIndex) {
    const progress = this.get();
    if (!progress.completedSteps) progress.completedSteps = [];
    if (!progress.completedSteps.includes(stepIndex)) {
      progress.completedSteps.push(stepIndex);
      this.save(progress);
    }
  },
  
  isStepComplete(stepIndex) {
    const progress = this.get();
    return progress.completedSteps?.includes(stepIndex) || false;
  },
  
  getCompletionPercentage() {
    const progress = this.get();
    const total = AdminTourSteps.length;
    const completed = progress.completedSteps?.length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  },
  
  reset() {
    localStorage.removeItem(this.KEY);
  }
};

// ═══════════════════════════════════════════════════════════
// 🎮 QUIZ SYSTEM
// ═══════════════════════════════════════════════════════════

const QuizSystem = {
  questions: {},
  
  register(stepIndex, quiz) {
    this.questions[stepIndex] = quiz;
  },
  
  get(stepIndex) {
    return this.questions[stepIndex];
  },
  
  hasQuiz(stepIndex) {
    return !!this.questions[stepIndex];
  }
};

// کامپوننت Quiz
const TourQuiz = ({ quiz, onComplete, onSkip }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    const correct = index === quiz.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      toast.success('✅ پاسخ صحیح!', { icon: '🎯' });
      setTimeout(() => onComplete(), 1500);
    } else {
      toast.error('❌ دوباره تلاش کن!', { icon: '💪' });
    }
  };
  
  return (
    <motion.div 
      className="tour-quiz"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h4 className="quiz-question">
        <FaQuestionCircle /> {quiz.question}
      </h4>
      
      <div className="quiz-options">
        {quiz.options.map((option, index) => (
          <motion.button
            key={index}
            className={`quiz-option ${
              selectedAnswer === index 
                ? isCorrect ? 'correct' : 'incorrect'
                : ''
            } ${
              showFeedback && index === quiz.correctAnswer ? 'correct flash' : ''
            }`}
            onClick={() => handleAnswer(index)}
            disabled={showFeedback && isCorrect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
            {showFeedback && index === quiz.correctAnswer && (
              <FaCheckCircle className="correct-icon" />
            )}
          </motion.button>
        ))}
      </div>
      
      {showFeedback && (
        <motion.div
          className="quiz-feedback"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {isCorrect ? (
            <div className="feedback-correct">
              <FaSmile /> {quiz.feedback?.correct || 'عالی!繼續 بده!'}
            </div>
          ) : (
            <div className="feedback-wrong">
              <FaLightbulb /> {quiz.feedback?.wrong || 'اشکال نداره! یاد میگیری'}  
            </div>
          )}
        </motion.div>
      )}
      
      <button className="skip-quiz-btn" onClick={onSkip}>
        رد کردن سوال 〉
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎬 INTERACTIVE DEMO SYSTEM
// ═══════════════════════════════════════════════════════════

const InteractiveDemo = ({ demo, onComplete }) => {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const handleAction = () => {
    if (step < demo.steps.length - 1) {
      setStep(prev => prev + 1);
      demo.onStep?.(step + 1);
    } else {
      setCompleted(true);
      toast.success('✅ دمو کامل شد!', { icon: '🎉' });
      onComplete();
    }
  };
  
  return (
    <motion.div 
      className="interactive-demo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!completed && (
        <>
          <div className="demo-step">
            <span className="demo-step-number">
              {step + 1} / {demo.steps.length}
            </span>
            <p className="demo-instruction">{demo.steps[step]}</p>
          </div>
          
          <motion.div 
            className="demo-target"
            animate={{ 
              boxShadow: ['0 0 0 0 rgba(59,130,246,0.4)', '0 0 0 15px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0.4)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={handleAction}
          >
            <FaHandPointer className="demo-pointer" />
            <span>اینجا کلیک کن!</span>
          </motion.div>
        </>
      )}
      
      {completed && (
        <motion.div 
          className="demo-complete"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <FaCheckCircle />
          <span>عالی! یاد گرفتی!</span>
        </motion.div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 SYSTEM DE VOICEOVER (خواندن متن)
// ═══════════════════════════════════════════════════════════

class VoiceoverSystem {
  constructor() {
    this.enabled = false;
    this.speaking = false;
    this.synth = window.speechSynthesis;
    this.voice = null;
    
    // پیدا کردن صدای فارسی
    this.findPersianVoice();
  }
  
  findPersianVoice() {
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang.includes('fa')) || 
                 voices.find(v => v.lang.includes('ar')) ||
                 voices[0];
  }
  
  speak(text) {
    if (!this.enabled) return;
    
    // پاک کردن ایموجی‌ها
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = this.voice;
    utterance.lang = 'fa-IR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    this.speaking = true;
    utterance.onend = () => { this.speaking = false; };
    utterance.onerror = () => { this.speaking = false; };
    
    this.synth.speak(utterance);
  }
  
  stop() {
    this.synth.cancel();
    this.speaking = false;
  }
  
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    return this.enabled;
  }
}

const voiceover = new VoiceoverSystem();

// ═══════════════════════════════════════════════════════════
// 📊 ANALYTICS SYSTEM
// ═══════════════════════════════════════════════════════════

const TourAnalytics = {
  events: [],
  
  track(event, data = {}) {
    const eventData = {
      event,
      ...data,
      timestamp: new Date().toISOString(),
      step: data.step || null,
      url: window.location.pathname
    };
    
    this.events.push(eventData);
    
    // ذخیره در localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('tour-analytics') || '[]');
      saved.push(eventData);
      localStorage.setItem('tour-analytics', JSON.stringify(saved.slice(-100)));
    } catch {
      // ignore
    }
    
    // ارسال به سرور (در صورت آنلاین بودن)
    if (navigator.onLine) {
      this.sendToServer(eventData);
    }
    
    // گوگل آنالیتیکس
    if (window.gtag) {
      window.gtag('event', `tour_${event}`, {
        event_category: 'tour',
        event_label: data.step
      });
    }
  },
  
  sendToServer(data) {
    fetch('/api/analytics/tour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  },
  
  getStats() {
    const starts = this.events.filter(e => e.event === 'start').length;
    const completes = this.events.filter(e => e.event === 'complete').length;
    const abandons = this.events.filter(e => e.event === 'abandon').length;
    const totalStepsClicked = this.events.filter(e => e.event === 'step-click').length;
    
    return {
      totalStarts: starts,
      totalCompletes: completes,
      totalAbandons: abandons,
      completionRate: starts > 0 ? ((completes / starts) * 100).toFixed(1) : 0,
      averageStepsPerSession: starts > 0 ? (totalStepsClicked / starts).toFixed(1) : 0,
      mostPopularStep: this.getMostPopularStep(),
      averageTimePerStep: this.getAverageTimePerStep(),
      completionOverTime: this.getCompletionOverTime()
    };
  },
  
  getMostPopularStep() {
    const stepCounts = {};
    this.events
      .filter(e => e.event === 'step-view')
      .forEach(e => {
        stepCounts[e.step] = (stepCounts[e.step] || 0) + 1;
      });
    
    const sorted = Object.entries(stepCounts).sort(([,a], [,b]) => b - a);
    return sorted[0] ? { step: parseInt(sorted[0][0]), count: sorted[0][1] } : null;
  },
  
  getAverageTimePerStep() {
    const stepTimes = {};
    const stepCounts = {};
    
    this.events
      .filter(e => e.event === 'step-time')
      .forEach(e => {
        stepTimes[e.step] = (stepTimes[e.step] || 0) + e.duration;
        stepCounts[e.step] = (stepCounts[e.step] || 0) + 1;
      });
    
    const result = {};
    Object.keys(stepTimes).forEach(step => {
      result[step] = Math.round(stepTimes[step] / stepCounts[step]);
    });
    
    return result;
  },
  
  getCompletionOverTime() {
    const completions = this.events
      .filter(e => e.event === 'complete')
      .map(e => e.timestamp);
    
    return completions;
  },
  
  reset() {
    this.events = [];
    localStorage.removeItem('tour-analytics');
  }
};

// ═══════════════════════════════════════════════════════════
// 🎯 BADGE SYSTEM
// ═══════════════════════════════════════════════════════════

const TourBadges = {
  badges: [
    {
      id: 'tour-starter',
      name: 'کاوشگر',
      icon: '🔍',
      description: 'تور آموزشی را شروع کردید',
      condition: (progress) => progress.startedAt !== null
    },
    {
      id: 'tour-halfway',
      name: 'نیمه راه',
      icon: '🏃',
      description: '۵۰٪ تور را کامل کردید',
      condition: (progress) => TourProgressStorage.getCompletionPercentage() >= 50
    },
    {
      id: 'tour-speedrunner',
      name: 'سریع‌ترین',
      icon: '⚡',
      description: 'تور را در کمتر از ۵ دقیقه کامل کردید',
      condition: (progress) => {
        if (!progress.completedAt || !progress.startedAt) return false;
        const duration = new Date(progress.completedAt) - new Date(progress.startedAt);
        return duration < 5 * 60 * 1000;
      }
    },
    {
      id: 'tour-quiz-master',
      name: 'نابغه',
      icon: '🧠',
      description: 'همه کوئیزها را در اولین تلاش پاسخ دادید',
      condition: (progress) => progress.quizFirstTry === true
    },
    {
      id: 'tour-complete',
      name: 'پنل‌شناس',
      icon: '🏅',
      description: 'تور آموزشی را کامل کردید',
      condition: (progress) => progress.completed === true
    }
  ],
  
  checkAndAward(progress) {
    const earned = [];
    const existingBadges = JSON.parse(localStorage.getItem('admin-badges') || '[]');
    
    this.badges.forEach(badge => {
      const alreadyEarned = existingBadges.find(b => b.id === badge.id);
      if (!alreadyEarned && badge.condition(progress)) {
        earned.push(badge);
        TourProgressStorage.giveBadge(badge);
        
        // نمایش نوتیفیکیشن
        toast.success(`🏅 نشان "${badge.name}" را دریافت کردید!`, {
          icon: badge.icon,
          duration: 5000
        });
      }
    });
    
    return earned;
  }
};

// ═══════════════════════════════════════════════════════════
// 🎬 MAIN TOUR STEPS
// ═══════════════════════════════════════════════════════════

const AdminTourSteps = [
  // ==================== مرحله ۰: خوش‌آمدگویی ====================
  {
    target: 'body',
    title: '🚀 به پنل مدیریت فرتاک خوش اومدی!',
    content: `
      <div style="text-align: center;">
        <p style="font-size: 1.2rem; margin-bottom: 15px;">
          🎉 تبریک! شما حالا یه ادمین حرفه‌ای هستی!
        </p>
        <p style="color: #6b7280; margin-bottom: 20px;">
          بیا یه تور سریع بزنیم تا با قابلیت‌های خفن پنل آشنا بشی.
          قول میدم بعد از این تور، سرعت کارت <strong>۱۰ برابر</strong> بشه!
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <span style="background: #3b82f620; color: #3b82f6; padding: 5px 12px; border-radius: 20px;">⏱️ حدود ۵ دقیقه</span>
          <span style="background: #10b98120; color: #10b981; padding: 5px 12px; border-radius: 20px;">🎮 با کوئیز</span>
          <span style="background: #f59e0b20; color: #f59e0b; padding: 5px 12px; border-radius: 20px;">🏅 با جایزه</span>
        </div>
      </div>
    `,
    placement: 'center',
    disableBeacon: true,
    spotlightPadding: 0,
    styles: {
      tooltip: {
        fontSize: '16px',
        maxWidth: '550px',
        padding: '30px'
      }
    }
  },

  // ==================== مرحله ۱: منوی مدیریت ====================
  {
    target: '.admin-sidebar',
    title: '🎯 منوی مدیریت هوشمند',
    content: `
      <p>این منوی contextual-aware بر اساس <strong>نقش (Role)</strong> شما شخصی‌سازی شده!</p>
      <ul style="margin: 10px 0; padding-right: 20px;">
        <li>🔍 جستجوی سریع در منو</li>
        <li>📌 Drag & Drop برای مرتب‌سازی</li>
        <li>⌨️ با <kbd>Ctrl+B</kbd> منو رو جمع کن</li>
        <li>👆 راست‌کلیک برای آپشن‌های بیشتر</li>
      </ul>
      <p style="color: #6b7280; font-size: 0.9rem;">💡 نکته: منوی collapsed هم با hover کار میکنه!</p>
    `,
    placement: 'right',
    disableBeacon: true,
    quiz: {
      question: 'با کدوم کلید می‌تونی منو رو جمع کنی؟',
      options: ['Ctrl+M', 'Ctrl+B', 'Ctrl+S', 'Ctrl+H'],
      correctAnswer: 1,
      feedback: {
        correct: 'درسته! حالا امتحانش کن 😎',
        wrong: 'اشکال نداره! Ctrl+B رو یادت بمونه'
      }
    }
  },

  // ==================== مرحله ۲: جستجوی هوشمند ====================
  {
    target: '.global-search-input',
    title: '🔍 جستجوی هوشمند با AI',
    content: `
      <p>با <kbd>⌘K</kbd> یا <kbd>Ctrl+K</kbd> جستجو رو باز کن!</p>
      <p style="color: #6b7280;">قابلیت‌های خفن:</p>
      <ul>
        <li>🗣️ جستجو با <strong>زبان طبیعی</strong></li>
        <li>📊 <code>filter:status=active</code></li>
        <li>📅 <code>date:today</code></li>
        <li>👤 <code>user:admin</code></li>
      </ul>
      <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; margin-top: 10px;">
        <em>مثال: "کاربرایی که هفته پیش ثبت‌نام کردن و فعال هستن"</em>
      </div>
    `,
    placement: 'bottom',
    spotlightClicks: true,
    interactive: true,
    demo: {
      steps: [
        'گام ۱: کلید ⌘K رو فشار بده',
        'گام ۲: عبارت "users active" رو تایپ کن',
        'گام ۳: روی نتیجه کلیک کن'
      ]
    }
  },

  // ==================== مرحله ۳: تب‌ها ====================
  {
    target: '.admin-tabs-container',
    title: '📑 تب‌های هوشمند با State Preservation',
    content: `
      <p>مثل مرورگر کار کن!</p>
      <table style="width: 100%; font-size: 0.9rem;">
        <tr><td><kbd>⌘T</kbd></td><td>تب جدید</td></tr>
        <tr><td><kbd>⌘W</kbd></td><td>بستن تب</td></tr>
        <tr><td><kbd>⌘⇧T</kbd></td><td>بازیابی تب بسته شده</td></tr>
        <tr><td><kbd>⌘1-9</kbd></td><td>سوئیچ به تب</td></tr>
      </table>
      <p style="color: #10b981; margin-top: 10px;">✨ تب‌ها state خودشون رو حتی بعد از رفرش حفظ می‌کنن!</p>
    `,
    placement: 'bottom',
    quiz: {
      question: 'چطور می‌تونی آخرین تب بسته شده رو برگردونی؟',
      options: ['⌘T', '⌘⇧T', '⌘R', '⌘⇧R'],
      correctAnswer: 1,
      feedback: {
        correct: 'عالیه! حالا امتحانش کن 🎯',
        wrong: '⌘⇧T رو یادت بمونه!'
      }
    }
  },

  // ==================== مرحله ۴: نوتیفیکیشن‌ها ====================
  {
    target: '.notification-wrapper',
    title: '🔔 مرکز نوتیفیکیشن هوشمند',
    content: `
      <p>نوتیفیکیشن‌ها بر اساس اولویت دسته‌بندی شدن:</p>
      <div style="display: flex; gap: 10px; margin: 10px 0;">
        <span style="background: #ef444420; color: #ef4444; padding: 3px 10px; border-radius: 20px;">🔴 حیاتی</span>
        <span style="background: #f59e0b20; color: #f59e0b; padding: 3px 10px; border-radius: 20px;">🟡 مهم</span>
        <span style="background: #3b82f620; color: #3b82f6; padding: 3px 10px; border-radius: 20px;">🔵 اطلاع‌رسانی</span>
      </div>
      <ul>
        <li>⚡ WebSocket Real-time</li>
        <li>🔔 Push Notification حتی وقتی تب بسته‌ست</li>
        <li>🎵 هشدار صوتی برای موارد حیاتی</li>
        <li>📱 ارسال به موبایل</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۵: پروفایل و گیمیفیکیشن ====================
  {
    target: '.user-wrapper',
    title: '👤 پروفایل و سیستم گیمیفیکیشن',
    content: `
      <p>اینجا فقط پروفایل نیست!</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0;">
        <span>✨ دستاوردها و Badge‌ها</span>
        <span>📊 XP و Level شما</span>
        <span>🏆 جایگاه در لیدربورد</span>
        <span>🎯 چالش‌های روزانه</span>
        <span>💎 امتیازهای قابل تبدیل</span>
        <span>🎨 تم‌های unlockable</span>
      </div>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۶: Floating Actions ====================
  {
    target: '.floating-actions',
    title: '⚡ Command Palette شناور',
    content: `
      <p>Dock هوشمند با قابلیت‌های:</p>
      <ul>
        <li>💻 <strong>ترمینال داخلی</strong> با ۵۰+ دستور</li>
        <li>📁 <strong>فایل منیجر</strong> Drag & Drop</li>
        <li>👥 <strong>همکاری لحظه‌ای</strong> با Cursor دیگران</li>
        <li>🎥 <strong>ضبط اسکرین‌کست</strong> برای گزارش باگ</li>
        <li>🤖 <strong>Chat با AI Assistant</strong></li>
        <li>📊 <strong>Performance Profiler</strong></li>
      </ul>
    `,
    placement: 'left'
  },

  // ==================== مرحله ۷: تم‌ها ====================
  {
    target: '.theme-switcher',
    title: '🎨 شخصی‌سازی پیشرفته',
    content: `
      <div style="display: flex; gap: 15px; margin: 10px 0; justify-content: center;">
        <div style="background: #ffffff; color: #1f2937; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb;">
          🌞 Light
        </div>
        <div style="background: #1e293b; color: #f1f5f9; padding: 15px; border-radius: 10px; text-align: center;">
          🌙 Dark
        </div>
        <div style="background: linear-gradient(135deg, #1e293b, #ffffff); color: white; padding: 15px; border-radius: 10px; text-align: center;">
          🌓 System
        </div>
      </div>
      <p>با <kbd>⌘D</kbd> سریع تم رو عوض کن!</p>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۸: داشبورد (شرطی) ====================
  {
    target: '.dashboard-grid',
    title: '📊 داشبورد قابل شخصی‌سازی',
    content: `
      <p>ویجت‌ها رو بکش و رها کن!</p>
      <ul>
        <li>📈 نمودارهای تعاملی</li>
        <li>🎯 KPI Cards با انیمیشن</li>
        <li>🔴 رصد لحظه‌ای کاربران آنلاین</li>
        <li>📊 گزارش‌های آماده با Drill-down</li>
        <li>💾 Layout ذخیره میشه</li>
      </ul>
      <p style="color: #6b7280; font-size: 0.85rem;">
        🖱️ راست‌کلیک روی ویجت‌ها → Export to PDF
      </p>
    `,
    placement: 'bottom',
    showCondition: () => window.location.pathname === '/admin/dashboard'
  },

  // ==================== مرحله ۹: Data Grid ====================
  {
    target: '.data-grid-toolbar',
    title: '🗃️ Data Grid حرفه‌ای',
    content: `
      <p style="font-size: 1.1rem;">اکسلی روی استروئید! 🚀</p>
      <ul>
        <li>📋 کپی‌پیست مثل اکسل</li>
        <li>🔍 فیلتر پیشرفته با RegEx</li>
        <li>📊 Sort چندستونی</li>
        <li>🎨 Conditional Formatting</li>
        <li>📤 Export به Excel/CSV/PDF/JSON</li>
        <li>💾 Saved Views</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۰: ویرایشگر ====================
  {
    target: '.rich-editor-toolbar',
    title: '✍️ ویرایشگر Markdown + WYSIWYG',
    content: `
      <p>یه ویرایشگر که هم Markdown و هم WYSIWYG رو ساپورت می‌کنه!</p>
      <ul>
        <li>🖼️ Drag & Drop عکس</li>
        <li>📎 آپلود فایل با Progress Bar</li>
        <li>🤖 AI Writing Assistant</li>
        <li>📝 Template‌های آماده</li>
        <li>👥 @mention کاربران</li>
        <li>📋 Clipboard History (Ctrl+Shift+V)</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۱: Split View ====================
  {
    target: '.split-view-handle',
    title: '🪟 Split View Pro',
    content: `
      <table style="width: 100%; font-size: 0.9rem;">
        <tr><td><kbd>⌘\\</kbd></td><td>Split عمودی</td></tr>
        <tr><td><kbd>⌘⇧\\</kbd></td><td>Split افقی</td></tr>
        <tr><td><kbd>⌘⇧P</kbd></td><td>پین کردن پنل</td></tr>
      </table>
      <p style="color: #6b7280; margin-top: 10px;">↔️ مرز بین پنل‌ها رو بکش!</p>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۲: آفلاین ====================
  {
    target: '.connection-status',
    title: '📡 Offline-First Architecture',
    content: `
      <p>حتی بدون اینترنت کار کن!</p>
      <div style="display: flex; gap: 10px; margin: 10px 0;">
        <span style="background: #10b98120; color: #10b981; padding: 5px 10px; border-radius: 20px;">🟢 آنلاین</span>
        <span style="background: #f59e0b20; color: #f59e0b; padding: 5px 10px; border-radius: 20px;">🟡 کند</span>
        <span style="background: #ef444420; color: #ef4444; padding: 5px 10px; border-radius: 20px;">🔴 آفلاین</span>
      </div>
      <ul>
        <li>⏳ Pending Changes قابل مشاهده</li>
        <li>🔄 Auto Sync هنگام اتصال</li>
        <li>💾 کار با داده محلی</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۳: عملیات گروهی ====================
  {
    target: '.bulk-operations-bar',
    title: '📦 Batch Operations Pro',
    content: `
      <p>وقتی چند آیتم انتخاب کنی این نوار ظاهر میشه:</p>
      <ul>
        <li>✏️ ویرایش گروهی</li>
        <li>🏷️ برچسب‌گذاری گروهی</li>
        <li>📧 ارسال ایمیل گروهی</li>
        <li>🗑️ حذف گروهی</li>
        <li>📤 Export انتخاب‌شده‌ها</li>
      </ul>
      <p style="color: #6b7280; font-size: 0.85rem;">
        💡 <kbd>Shift+Click</kbd> برای انتخاب بازه، <kbd>Ctrl+Click</kbd> برای انتخاب تکی
      </p>
    `,
    placement: 'top'
  },

  // ==================== مرحله ۱۴: کیبورد ====================
  {
    target: '.keyboard-shortcuts-help',
    title: '⌨️ میانبرهای کیبورد',
    content: `
      <p>حرفه‌ای‌ها فقط با کیبورد کار می‌کنن!</p>
      <table style="width: 100%; font-size: 0.85rem;">
        <tr><td><kbd>?</kbd></td><td>این راهنما</td></tr>
        <tr><td><kbd>⌘K</kbd></td><td>Command Palette</td></tr>
        <tr><td><kbd>⌘/</kbd></td><td>جستجو در صفحه</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>بستن مدال</td></tr>
      </table>
      <p style="color: #3b82f6; margin-top: 10px;">⚡ می‌تونی همه شورتکات‌ها رو شخصی‌سازی کنی!</p>
    `,
    placement: 'bottom',
    quiz: {
      question: 'با کدوم کلید Command Palette باز میشه؟',
      options: ['⌘K', '⌘P', '⌘Space', 'همه موارد'],
      correctAnswer: 3,
      feedback: {
        correct: 'عالیه! همه اینا کار میکنن 🎯',
        wrong: 'همه موارد درسته! ⌘K, ⌘P, و ⌘Space'
      }
    }
  },

  // ==================== مرحله ۱۵: سطح دسترسی ====================
  {
    target: '.permission-indicator',
    title: '🛡️ سطح دسترسی شما',
    content: `
      <p>Role-Based Access Control با granular permissions:</p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0;">
        <span style="background: #dc262620; color: #dc2626; padding: 5px 12px; border-radius: 20px;">👑 Super Admin</span>
        <span style="background: #3b82f620; color: #3b82f6; padding: 5px 12px; border-radius: 20px;">🛡️ Admin</span>
        <span style="background: #10b98120; color: #10b981; padding: 5px 12px; border-radius: 20px;">✏️ Editor</span>
        <span style="background: #6b728020; color: #6b7280; padding: 5px 12px; border-radius: 20px;">👁️ Viewer</span>
      </div>
      <p style="color: #6b7280; font-size: 0.85rem;">📋 همه عملیات‌ها audit log دارن!</p>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۶: اتوماسیون ====================
  {
    target: '.automation-rules',
    title: '🤖 اتوماسیون هوشمند',
    content: `
      <p>If This Then That برای پنل ادمین!</p>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin: 10px 0;">
        <p style="margin: 0; font-size: 0.9rem;">
          <strong>مثال:</strong><br/>
          "اگه کاربر ۳ روز غیرفعال بود → ایمیل یادآوری"<br/>
          "اگه موجودی محصول کم شد → نوتیفیکیشن به مدیر"<br/>
          "هر شب ۱۲ → بک‌اپ خودکار"
        </p>
      </div>
      <p>می‌تونی رول‌های پیچیده با چند شرط بسازی!</p>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۷: Accessibility ====================
  {
    target: '.accessibility-menu',
    title: '♿ دسترسی‌پذیری',
    content: `
      <p>ما برای همه طراحی کردیم:</p>
      <ul>
        <li>🖱️ ناوبری کامل با کیبورد</li>
        <li>🔍 Screen Reader Optimized</li>
        <li>🎨 High Contrast Mode</li>
        <li>📏 Font Size Adjustment</li>
        <li>🌍 RTL کامل برای فارسی/عربی</li>
        <li>⚡ Reduce Motion</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۱۸: AI Assistant ====================
  {
    target: '.ai-assistant-btn',
    title: '🤖 دستیار هوشمند AI',
    content: `
      <p>با AI Assistant می‌تونی:</p>
      <ul>
        <li>🎯 کارهای تکراری رو اتوماتیک کنی</li>
        <li>📊 گزارش‌های هوشمند بگیری</li>
        <li>🔮 روندهای آینده رو پیش‌بینی کنی</li>
        <li>💬 با زبان طبیعی از سیستم سوال بپرسی</li>
      </ul>
      <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; margin-top: 10px;">
        <em>🗣️ "کاربرایی که احتمال ریزش دارن رو نشون بده"</em>
      </div>
    `,
    placement: 'left',
    quiz: {
      question: 'AI Assistant چه کارایی میتونه انجام بده؟',
      options: [
        'پیش‌بینی روندها',
        'پاسخ به سوالات با زبان طبیعی',
        'اتوماسیون کارهای تکراری',
        'همه موارد'
      ],
      correctAnswer: 3,
      feedback: {
        correct: 'درسته! AI Assistant همه این کارها رو میکنه 🤖',
        wrong: 'همه موارد درسته! AI Assistant کلی قابلیت داره'
      }
    }
  },

  // ==================== مرحله ۱۹: API & Webhooks ====================
  {
    target: '.api-settings',
    title: '🔌 یکپارچه‌سازی با سیستم‌های دیگه',
    content: `
      <p>به راحتی به بقیه سیستم‌ها وصل شو:</p>
      <ul>
        <li>🔗 Webhook‌های custom</li>
        <li>📡 API با GraphQL</li>
        <li>🔑 API Key Management</li>
        <li>📊 WebSocket real-time</li>
      </ul>
    `,
    placement: 'bottom'
  },

  // ==================== مرحله ۲۰: پایان ====================
  {
    target: 'body',
    title: '🎉 تبریک! تور کامل شد!',
    content: () => {
      const completion = TourProgressStorage.getCompletionPercentage();
      const badgeCount = (JSON.parse(localStorage.getItem('admin-badges') || '[]')).length;
      return `
        <div style="text-align: center;">
          <p style="font-size: 1.3rem; margin-bottom: 15px;">
            🏅 تو حالا یه <strong>ادمین حرفه‌ای</strong> هستی!
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px;">📊 آمار تور شما:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
              <span>✅ مراحل: ۲۰/۲۰</span>
              <span>🎯 کوئیزها: ${completion}٪</span>
              <span>🏅 نشان‌ها: ${badgeCount} عدد</span>
              <span>⏱️ زمان: ${new Date().toLocaleTimeString('fa-IR')}</span>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <p style="color: #6b7280;">نشان‌های دریافتی:</p>
            <div style="display: flex; gap: 10px; justify-content: center; font-size: 2rem;">
              🏅 🔍 🧠 ⚡ 🏃
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9rem;">
            💡 هر جا گیج شدی، کلید <kbd>?</kbd> رو بزن تا این راهنما دوباره ظاهر بشه.
          </p>
          <p style="color: #6b7280; font-size: 0.9rem;">
            📚 برای آموزش‌های ویدیویی به <code>/docs/tutorials</code> سر بزن.
          </p>
        </div>
      `;
    },
    placement: 'center',
    footer: ( // footer هم می‌تواند تابع باشد (اختیاری)
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <button 
          className="tour-btn-primary"
          onClick={() => {
            TourProgressStorage.complete();
            TourAnalytics.track('complete');
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            toast.success('🏅 نشان "پنل‌شناس حرفه‌ای" به شما اعطا شد!', { duration: 5000 });
          }}
        >
          🚀 بزن بریم!
        </button>
      </div>
    )
  }
];

// ثبت کوئیزها
AdminTourSteps.forEach((step, index) => {
  if (step.quiz) {
    QuizSystem.register(index, step.quiz);
  }
});

// ═══════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════

export { 
  AdminTourSteps as default,
  TourProgressStorage,
  TourAnalytics,
  TourBadges,
  QuizSystem,
  InteractiveDemo,
  VoiceoverSystem,
  voiceover
};

export const TourConfig = {
  // شخصی‌سازی‌های ظاهری
  styles: {
    tooltip: {
      borderRadius: '16px',
      boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '25px',
      fontSize: '15px',
      maxWidth: '500px',
      direction: 'rtl',
      textAlign: 'right'
    },
    spotlight: {
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
    },
    dot: {
      backgroundColor: '#3b82f6'
    }
  },
  
  // رفتار هوشمند
  showProgress: true,
  showSkipButton: true,
  disableOverlayClose: true,
  continuous: true,
  
  // Locale
  locale: {
    back: '⏪ قبلی',
    close: '✕ بستن',
    last: '🏁 پایان',
    next: '⏩ بعدی',
    skip: '⏭️ رد کردن'
  },
  
  // شرط‌های اجرا
  startCondition: () => {
    const isNewUser = localStorage.getItem('isNewAdmin') === 'true';
    const requested = sessionStorage.getItem('showTour') === 'true';
    const neverCompleted = !TourProgressStorage.get().completed;
    return isNewUser || requested || !neverCompleted;
  },
  
  // Callback‌های پیشرفته
  onStepChange: (currentStep, nextStep) => {
    TourAnalytics.track('step-change', { from: currentStep, to: nextStep });
    
    // Mark previous step as complete
    if (currentStep !== undefined) {
      TourProgressStorage.markStepComplete(currentStep);
    }
    
    // Check badges
    const progress = TourProgressStorage.get();
    TourBadges.checkAndAward(progress);
  },
  
  onTourStart: () => {
    TourAnalytics.track('start');
    const progress = TourProgressStorage.get();
    progress.startedAt = new Date().toISOString();
    TourProgressStorage.save(progress);
  },
  
  onTourComplete: () => {
    TourProgressStorage.complete();
    TourAnalytics.track('complete');
    
    // اعطای نشان‌های نهایی
    const progress = TourProgressStorage.get();
    TourBadges.checkAndAward(progress);
    
    // جشن
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    });
    
    Swal.fire({
      title: '🎉 تبریک!',
      html: `
        <p>تور آموزشی با موفقیت به پایان رسید!</p>
        <p style="color: #6b7280;">نشان‌های جدید دریافت کردی:</p>
        <div style="font-size: 2rem;">🏅 🔍 🧠 ⚡</div>
        <p style="margin-top: 15px;">حالا یه ادمین حرفه‌ای هستی! 🚀</p>
      `,
      icon: 'success',
      confirmButtonText: '🚀 بزن بریم!',
      showCloseButton: true
    });
  }
};
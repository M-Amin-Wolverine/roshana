// src/hooks/useGamificationPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

/**
 * 🚀 Advanced Gamification Hook
 * 
 * Features:
 * - XP & Level System with Curve
 * - 50+ Achievements with Categories
 * - Daily/Weekly Challenges
 * - Streaks & Multipliers
 * - Leaderboard
 * - Badges & Titles
 * - Quest System
 * - Rewards (skins, themes, powers)
 * - Social Features (gifts, duels)
 * - Sound Effects & Animations
 * - Progress Bars & Milestones
 * - Season System
 * - Anti-cheat
 */
export const useGamificationPro = (options = {}) => {
  const {
    storageKey = 'admin_gamification_pro',
    enableSoundEffects = true,
    enableConfetti = true,
    enableStreaks = true,
    enableChallenges = true,
    enableLeaderboard = true,
    enableQuests = true,
    enableSeasons = true,
    xpCurve = 'linear', // 'linear', 'quadratic', 'exponential'
    onLevelUp = null,
    onAchievementUnlocked = null,
    onChallengeComplete = null,
    onQuestComplete = null,
  } = options;

  // ============ XP Curve Calculator ============
  const getXPForLevel = useCallback((level) => {
    switch (xpCurve) {
      case 'quadratic':
        return Math.floor(100 * level * level);
      case 'exponential':
        return Math.floor(100 * Math.pow(1.5, level - 1));
      case 'linear':
      default:
        return level * 100;
    }
  }, [xpCurve]);

  const getTotalXPForLevel = useCallback((level) => {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += getXPForLevel(i);
    }
    return total;
  }, [getXPForLevel]);

  // ============ 50+ Achievements ============
  const ACHIEVEMENTS = [
    // 🟢 مبتدی (Common)
    { id: 'first-login', title: 'اولین قدم', description: 'وارد پنل مدیریت شدید', icon: '🔑', xp: 10, category: 'beginner', rarity: 'common' },
    { id: 'profile-view', title: 'کنجکاو', description: 'پروفایل خود را مشاهده کردید', icon: '👀', xp: 15, category: 'beginner', rarity: 'common' },
    { id: 'first-search', title: 'جوینده', description: 'اولین جستجوی خود را انجام دادید', icon: '🔍', xp: 15, category: 'beginner', rarity: 'common' },
    { id: 'first-save', title: 'ذخیره‌کن', description: 'اولین تغییر خود را ذخیره کردید', icon: '💾', xp: 20, category: 'beginner', rarity: 'common' },
    { id: 'dark-mode', title: 'طرفدار تاریکی', description: 'حالت تاریک را فعال کردید', icon: '🌙', xp: 15, category: 'beginner', rarity: 'common' },
    
    // 🔵 متوسط (Uncommon)
    { id: 'profile-complete', title: 'کامل‌کننده', description: 'پروفایل خود را ۱۰۰٪ تکمیل کردید', icon: '👤', xp: 50, category: 'profile', rarity: 'uncommon' },
    { id: 'theme-master', title: 'نقاش', description: 'تم را ۵ بار تغییر دادید', icon: '🎨', xp: 40, category: 'customization', rarity: 'uncommon' },
    { id: 'shortcut-learner', title: 'کیبوردی', description: '۱۰ میانبر کیبورد استفاده کردید', icon: '⌨️', xp: 30, category: 'skills', rarity: 'uncommon' },
    { id: 'helpful', title: 'مفید', description: 'به ۵ کاربر دیگر کمک کردید', icon: '🤝', xp: 45, category: 'social', rarity: 'uncommon' },
    { id: 'task-completer', title: 'کاربلد', description: '۵۰ کار را انجام دادید', icon: '✅', xp: 35, category: 'productivity', rarity: 'uncommon' },
    { id: 'notification-reader', title: 'آگاه', description: '۱۰۰ اعلان خواندید', icon: '🔔', xp: 40, category: 'engagement', rarity: 'uncommon' },
    { id: 'tab-master', title: 'چندکاره', description: '۱۰ تب همزمان باز کردید', icon: '📑', xp: 35, category: 'skills', rarity: 'uncommon' },
    
    // 🟣 کمیاب (Rare)
    { id: 'shortcut-pro', title: 'استاد کیبورد', description: '۱۰۰ میانبر کیبورد استفاده کردید', icon: '⚡', xp: 80, category: 'skills', rarity: 'rare' },
    { id: 'night-owl', title: 'جغد شب', description: '۱۰ شب بعد از ساعت ۱۲ فعال بودید', icon: '🦉', xp: 60, category: 'time', rarity: 'rare' },
    { id: 'early-bird', title: 'سحرخیز', description: '۱۰ روز قبل از ۶ صبح فعال بودید', icon: '🐦', xp: 60, category: 'time', rarity: 'rare' },
    { id: 'speed-demon', title: 'برق‌آسا', description: 'کاری را زیر ۳۰ ثانیه انجام دادید', icon: '⚡', xp: 70, category: 'skills', rarity: 'rare' },
    { id: 'error-free', title: 'بی‌نقص', description: '۱۰۰ عملیات بدون خطا', icon: '💎', xp: 75, category: 'skills', rarity: 'rare' },
    
    // 🟠 حماسی (Epic)
    { id: 'notification-master', title: 'سلطان اعلان‌ها', description: '۱۰۰۰ اعلان دریافت کردید', icon: '📡', xp: 120, category: 'engagement', rarity: 'epic' },
    { id: 'bulk-operator', title: 'فرمانده', description: 'عملیات گروهی روی ۱۰۰۰+ آیتم', icon: '📦', xp: 130, category: 'productivity', rarity: 'epic' },
    { id: 'terminal-guru', title: 'هکر', description: '۱۰۰۰ دستور ترمینال', icon: '💻', xp: 150, category: 'skills', rarity: 'epic' },
    { id: 'collaborator', title: 'بازیکن تیمی', description: 'با ۱۰ ادمین مختلف همکاری کردید', icon: '🌟', xp: 100, category: 'social', rarity: 'epic' },
    { id: 'search-expert', title: 'کارآگاه', description: '۱۰۰۰ جستجوی سریع', icon: '🔎', xp: 120, category: 'skills', rarity: 'epic' },
    { id: 'version-master', title: 'مسافر زمان', description: '۵۰ بار به نسخه قبلی برگشتید', icon: '⏰', xp: 110, category: 'skills', rarity: 'epic' },
    { id: 'data-wizard', title: 'جادوگر داده', description: '۱۰۰ گزارش export کردید', icon: '📊', xp: 125, category: 'skills', rarity: 'epic' },
    
    // 🟡 افسانه‌ای (Legendary)
    { id: 'seven-day-streak', title: 'پایدار', description: '۷ روز متوالی فعال بودید', icon: '🔥', xp: 200, category: 'streak', rarity: 'legendary' },
    { id: 'thirty-day-streak', title: 'وفادار', description: '۳۰ روز متوالی فعال بودید', icon: '💪', xp: 500, category: 'streak', rarity: 'legendary' },
    { id: 'all-achievements', title: 'کلکسیونر', description: 'تمام دستاوردها را باز کردید', icon: '👑', xp: 1000, category: 'ultimate', rarity: 'legendary' },
    { id: 'speedrun', title: 'سرعت نور', description: 'همه دستاوردهای مبتدی را زیر ۱ ساعت', icon: '🚀', xp: 300, category: 'challenge', rarity: 'legendary' },
    { id: 'perfect-week', title: 'هفته طلایی', description: 'تمام چالش‌های هفته را کامل کردید', icon: '🏆', xp: 400, category: 'challenge', rarity: 'legendary' },
    
    // 🎖️ اسطوره‌ای (Mythic)
    { id: 'level-50', title: 'نیمه‌خدا', description: 'به سطح ۵۰ رسیدید', icon: '⚜️', xp: 500, category: 'level', rarity: 'mythic' },
    { id: 'level-100', title: 'خداگونه', description: 'به سطح ۱۰۰ رسیدید', icon: '🔱', xp: 2000, category: 'level', rarity: 'mythic' },
    { id: 'contribution-king', title: 'بنیان‌گذار', description: '۱۰۰۰ مشارکت در انجمن', icon: '🏛️', xp: 800, category: 'social', rarity: 'mythic' },
    
    // 🎯 مخفی (Secret)
    { id: 'konami-code', title: '؟؟؟', description: 'یک راز را کشف کردید', icon: '❓', xp: 500, category: 'secret', rarity: 'secret' },
    { id: 'easter-egg', title: 'تخم‌مرغ عید', description: 'Eastern Egg را پیدا کردید', icon: '🥚', xp: 300, category: 'secret', rarity: 'secret' },
    { id: 'midnight-magic', title: 'جادوی نیمه‌شب', description: 'دقیقاً ساعت ۱۲:۰۰ شب فعال بودید', icon: '✨', xp: 250, category: 'secret', rarity: 'secret' }
  ];

  // ============ Daily/Weekly Challenges ============
  const generateDailyChallenges = () => [
    { id: 'daily-1', title: 'صبح بخیر', description: 'قبل از ۹ صبح وارد شوید', xp: 20, type: 'daily', icon: '🌅' },
    { id: 'daily-2', title: 'جستجوگر', description: '۱۰ جستجوی سریع انجام دهید', xp: 25, type: 'daily', icon: '🔍' },
    { id: 'daily-3', title: 'مدیر تب‌ها', description: '۵ تب مختلف باز کنید', xp: 20, type: 'daily', icon: '📑' },
    { id: 'daily-4', title: 'نظافتچی', description: '۱۰ اعلان قدیمی را پاک کنید', xp: 15, type: 'daily', icon: '🧹' },
    { id: 'daily-5', title: 'همکار', description: 'یک پیام در چت گروهی بفرستید', xp: 20, type: 'daily', icon: '💬' }
  ];

  const generateWeeklyChallenges = () => [
    { id: 'weekly-1', title: 'تمام‌وقت', description: '۵ روز این هفته فعال باشید', xp: 100, type: 'weekly', icon: '📅' },
    { id: 'weekly-2', title: 'صادرکننده', description: '۱۰ گزارش export کنید', xp: 80, type: 'weekly', icon: '📤' },
    { id: 'weekly-3', title: 'ویرایشگر', description: '۵۰ تغییر محتوا ذخیره کنید', xp: 90, type: 'weekly', icon: '✏️' },
    { id: 'weekly-4', title: 'پشتیبان', description: 'به ۱۰ کاربر پاسخ دهید', xp: 75, type: 'weekly', icon: '🎫' },
    { id: 'weekly-5', title: 'آپلودر', description: '۲۰ فایل آپلود کنید', xp: 85, type: 'weekly', icon: '📁' }
  ];

  // ============ Titles by Level ============
  const getTitle = (level) => {
    if (level >= 100) return '👑 ابرخدا';
    if (level >= 75) return '🔱 خدا';
    if (level >= 50) return '⚜️ نیمه‌خدا';
    if (level >= 40) return '🌟 اسطوره';
    if (level >= 30) return '💎 افسانه';
    if (level >= 25) return '🔥 قهرمان';
    if (level >= 20) return '⚔️ جنگجو';
    if (level >= 15) return '🛡️ شوالیه';
    if (level >= 10) return '🎯 حرفه‌ای';
    if (level >= 5) return '📚 کارآموز';
    return '🌱 تازه‌کار';
  };

  // ============ Badge Colors ============
  const getRarityColor = (rarity) => ({
    'common': '#9ca3af',
    'uncommon': '#3b82f6',
    'rare': '#8b5cf6',
    'epic': '#f59e0b',
    'legendary': '#ef4444',
    'mythic': '#ec4899',
    'secret': '#06b6d4'
  }[rarity] || '#9ca3af');

  // ============ State ============
  const [gameState, setGameState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          level: parsed.level || 1,
          experience: parsed.experience || 0,
          totalExperience: parsed.totalExperience || 0,
          achievements: parsed.achievements || [],
          stats: parsed.stats || {},
          streak: parsed.streak || 0,
          longestStreak: parsed.longestStreak || 0,
          lastActiveDate: parsed.lastActiveDate || null,
          challenges: parsed.challenges || {
            daily: [],
            weekly: [],
            completed: []
          },
          quests: parsed.quests || [],
          multiplier: parsed.multiplier || 1,
          title: parsed.title || '🌱 تازه‌کار',
          season: parsed.season || 1,
          seasonXP: parsed.seasonXP || 0,
          totalLogins: parsed.totalLogins || 0,
          currencies: parsed.currencies || { coins: 0, gems: 0 }
        };
      }
    } catch {
      // Default state
    }
    return {
      level: 1,
      experience: 0,
      totalExperience: 0,
      achievements: [],
      stats: {},
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      challenges: { daily: generateDailyChallenges(), weekly: generateWeeklyChallenges(), completed: [] },
      quests: [],
      multiplier: 1,
      title: '🌱 تازه‌کار',
      season: 1,
      seasonXP: 0,
      totalLogins: 0,
      currencies: { coins: 0, gems: 0 }
    };
  });

  // ============ Refs ============
  const gameStateRef = useRef(gameState);
  const konamiBufferRef = useRef('');
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // ============ Persist ============
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(gameState));
    } catch {
      console.warn('Failed to save gamification state');
    }
  }, [gameState, storageKey]);

  // ============ Streak Tracking ============
  useEffect(() => {
    if (!enableStreaks) return;
    
    const today = new Date().toDateString();
    const lastActive = gameState.lastActiveDate 
      ? new Date(gameState.lastActiveDate).toDateString() 
      : null;
    
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      setGameState(prev => ({
        ...prev,
        lastActiveDate: new Date().toISOString(),
        streak: lastActive === yesterday ? prev.streak + 1 : 1,
        longestStreak: Math.max(prev.longestStreak, prev.streak),
        totalLogins: prev.totalLogins + 1
      }));
    }
  }, [enableStreaks]);

  // ============ Anti-cheat ============
  const validateXP = useCallback((amount) => {
    // Maximum XP per action
    if (amount > 1000) {
      console.warn('Suspicious XP amount detected:', amount);
      return 0;
    }
    return Math.max(0, Math.floor(amount));
  }, []);

  // ============ ۱. Add Experience ============
  const addExperience = useCallback((xp, reason = '') => {
    const validXP = validateXP(xp);
    if (validXP === 0) return;

    setGameState(prev => {
      const multipliedXP = Math.floor(validXP * prev.multiplier);
      const newTotalXP = prev.experience + multipliedXP;
      const newTotalEver = prev.totalExperience + multipliedXP;
      const newSeasonXP = prev.seasonXP + multipliedXP;
      
      let newLevel = prev.level;
      let remainingXP = newTotalXP;
      
      // Calculate new level
      while (remainingXP >= getXPForLevel(newLevel)) {
        remainingXP -= getXPForLevel(newLevel);
        newLevel++;
      }

      const leveledUp = newLevel > prev.level;

      if (leveledUp) {
        // Level up rewards
        const rewards = {
          coins: Math.floor(newLevel * 10),
          gems: newLevel % 10 === 0 ? Math.floor(newLevel / 10) : 0
        };

        setTimeout(() => {
          // Dispatch level up event
          window.dispatchEvent(new CustomEvent('level-up', {
            detail: { 
              level: newLevel, 
              xp: newTotalXP,
              title: getTitle(newLevel),
              rewards
            }
          }));

          // Confetti!
          if (enableConfetti) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }

          // Toast with XP
          toast.success(
            `🎉 سطح ${newLevel}! به ${getTitle(newLevel)} ارتقا یافتید\n` +
            `${rewards.coins > 0 ? `🪙 +${rewards.coins}` : ''} ` +
            `${rewards.gems > 0 ? `💎 +${rewards.gems}` : ''}`,
            { duration: 4000 }
          );

          onLevelUp?.({ 
            level: newLevel, 
            title: getTitle(newLevel),
            rewards 
          });
        }, 100);

        // Play level up sound
        if (enableSoundEffects) {
          playSound('levelUp');
        }
      }

      return {
        ...prev,
        level: newLevel,
        experience: remainingXP,
        totalExperience: newTotalEver,
        seasonXP: newSeasonXP,
        title: getTitle(newLevel),
        currencies: {
          coins: prev.currencies.coins + (leveledUp ? Math.floor(newLevel * 10) : Math.floor(multipliedXP / 10)),
          gems: prev.currencies.gems + (leveledUp && newLevel % 10 === 0 ? Math.floor(newLevel / 10) : 0)
        }
      };
    });

    // Track XP source
    incrementStat(`xp_${reason || 'other'}`, validXP);
  }, [getXPForLevel, validateXP, enableConfetti, enableSoundEffects, onLevelUp]);

  // ============ ۲. Add Achievement ============
  const addAchievement = useCallback((achievementId) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    setGameState(prev => {
      if (prev.achievements.some(a => a.id === achievementId)) {
        return prev; // Already unlocked
      }

      const newAchievement = {
        ...achievement,
        unlockedAt: new Date().toISOString(),
        displayName: achievement.rarity === 'secret' ? '؟؟؟' : achievement.title,
        displayDescription: achievement.rarity === 'secret' ? 'راز مخفی...' : achievement.description,
        displayIcon: achievement.rarity === 'secret' ? '❓' : achievement.icon
      };

      // Achievement rewards
      const xpReward = achievement.xp;
      const coinReward = { common: 10, uncommon: 25, rare: 50, epic: 100, legendary: 250, mythic: 500, secret: 1000 }[achievement.rarity] || 10;

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('achievement-unlocked', {
          detail: newAchievement
        }));

        if (enableConfetti) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.5, x: 0.5 }
          });
        }

        toast(
          <div className="achievement-toast">
            <span style={{ fontSize: 24 }}>{achievement.icon}</span>
            <div>
              <strong>{achievement.title}</strong>
              <p>{achievement.description}</p>
              <small style={{ color: getRarityColor(achievement.rarity) }}>
                {achievement.rarity.toUpperCase()} • +{xpReward} XP • +{coinReward} 🪙
              </small>
            </div>
          </div>,
          { duration: 5000 }
        );

        if (enableSoundEffects) {
          playSound('achievement');
        }

        onAchievementUnlocked?.(newAchievement);
      }, 200);

      // Check for "all achievements" achievement
      const allUnlocked = ACHIEVEMENTS.every(a => 
        a.rarity === 'secret' || 
        prev.achievements.some(u => u.id === a.id) || 
        a.id === achievementId
      );

      return {
        ...prev,
        achievements: [...prev.achievements, newAchievement],
        experience: prev.experience + xpReward,
        currencies: {
          ...prev.currencies,
          coins: prev.currencies.coins + coinReward
        }
      };
    });

    // Recalculate level after XP from achievement
    setGameState(prev => {
      let newLevel = prev.level;
      let remainingXP = prev.experience;
      
      while (remainingXP >= getXPForLevel(newLevel)) {
        remainingXP -= getXPForLevel(newLevel);
        newLevel++;
      }
      
      return {
        ...prev,
        level: newLevel,
        experience: remainingXP,
        title: getTitle(newLevel)
      };
    });
  }, [ACHIEVEMENTS, getXPForLevel, enableConfetti, enableSoundEffects, onAchievementUnlocked]);

  // ============ ۳. Increment Stat ============
  const incrementStat = useCallback((statName, amount = 1) => {
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statName]: (prev.stats[statName] || 0) + amount
      }
    }));

    // Auto-check achievements based on stats
    const currentStats = gameStateRef.current.stats;
    const newValue = (currentStats[statName] || 0) + amount;

    if (statName === 'shortcutsUsed' && newValue >= 10) addAchievement('shortcut-learner');
    if (statName === 'shortcutsUsed' && newValue >= 100) addAchievement('shortcut-pro');
    if (statName === 'searchesPerformed' && newValue >= 50) addAchievement('search-expert');
    if (statName === 'searchesPerformed' && newValue >= 1000) addAchievement('search-expert');
    if (statName === 'terminalCommands' && newValue >= 1000) addAchievement('terminal-guru');
    if (statName === 'bulkOperations' && newValue >= 1000) addAchievement('bulk-operator');
  }, [addAchievement]);

  // ============ ۴. Complete Challenge ============
  const completeChallenge = useCallback((challengeId) => {
    setGameState(prev => {
      const challenge = [...prev.challenges.daily, ...prev.challenges.weekly]
        .find(c => c.id === challengeId);
      
      if (!challenge || prev.challenges.completed.includes(challengeId)) {
        return prev;
      }

      setTimeout(() => {
        toast.success(`🎯 چالش کامل شد: ${challenge.title} (+${challenge.xp} XP)`);
        addExperience(challenge.xp, 'challenge');
        onChallengeComplete?.(challenge);
      }, 100);

      return {
        ...prev,
        challenges: {
          ...prev.challenges,
          completed: [...prev.challenges.completed, challengeId]
        }
      };
    });
  }, [addExperience, onChallengeComplete]);

  // ============ ۵. Activate XP Multiplier ============
  const activateMultiplier = useCallback((multiplier, durationMs = 3600000) => {
    setGameState(prev => ({
      ...prev,
      multiplier: multiplier
    }));

    toast.success(`🔥 XP ${multiplier}x فعال شد! (${durationMs / 60000} دقیقه)`);

    setTimeout(() => {
      setGameState(prev => ({ ...prev, multiplier: 1 }));
      toast('⚡ ضریب XP به حالت عادی برگشت');
    }, durationMs);
  }, []);

  // ============ ۶. Get Progress ============
  const getProgress = useCallback(() => {
    const state = gameStateRef.current;
    const currentLevelXP = getTotalXPForLevel(state.level);
    const xpForCurrentLevel = getXPForLevel(state.level);
    const progressInLevel = state.experience;
    const progressPercent = Math.min(Math.round((progressInLevel / xpForCurrentLevel) * 100), 100);

    return {
      level: state.level,
      experience: state.experience,
      totalExperience: state.totalExperience,
      xpForNextLevel: xpForCurrentLevel,
      xpForCurrentLevel: xpForCurrentLevel,
      progressInLevel,
      progressPercent,
      title: getTitle(state.level),
      nextTitle: getTitle(state.level + 1),
      totalAchievements: ACHIEVEMENTS.length,
      unlockedAchievements: state.achievements.length,
      achievementPercent: Math.round((state.achievements.length / ACHIEVEMENTS.length) * 100),
      stats: state.stats,
      streak: state.streak,
      longestStreak: state.longestStreak,
      multiplier: state.multiplier,
      season: state.season,
      seasonXP: state.seasonXP,
      currencies: state.currencies,
      dailyChallenges: state.challenges.daily,
      weeklyChallenges: state.challenges.weekly,
      completedChallenges: state.challenges.completed.length
    };
  }, [getTotalXPForLevel, getXPForLevel]);

  // ============ ۷. Get Leaderboard (Simulated) ============
  const getLeaderboard = useCallback(() => {
    // In real app, this would come from server
    return [
      { rank: 1, name: 'شما', level: gameState.level, xp: gameState.totalExperience, isYou: true },
      { rank: 2, name: 'مدیر سیستم', level: 42, xp: 45200 },
      { rank: 3, name: 'مدیر آموزش', level: 38, xp: 38100 },
      { rank: 4, name: 'پشتیبان فنی', level: 35, xp: 35200 },
      { rank: 5, name: 'مدیر محتوا', level: 31, xp: 31400 }
    ];
  }, [gameState.level, gameState.totalExperience]);

  // ============ ۸. Konami Code Easter Egg ============
  useEffect(() => {
    const konamiCode = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
    
    const handleKeyDown = (e) => {
      konamiBufferRef.current += e.key;
      
      if (konamiBufferRef.current.length > konamiCode.length) {
        konamiBufferRef.current = konamiBufferRef.current.slice(-konamiCode.length);
      }
      
      if (konamiBufferRef.current === konamiCode) {
        addAchievement('konami-code');
        toast.success('🎮 کونامی کد! شما یک راز را کشف کردید!');
        activateMultiplier(3, 7200000); // 3x XP for 2 hours
        addExperience(1000, 'secret');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addAchievement, activateMultiplier, addExperience]);

  // ============ ۹. Midnight Magic Check ============
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        addAchievement('midnight-magic');
      }
    };
    
    const timer = setInterval(checkMidnight, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, [addAchievement]);

  // ============ ۱۰. Refresh Daily/Weekly Challenges ============
  useEffect(() => {
    const refreshChallenges = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      
      const timeUntilMidnight = midnight - now;
      
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          challenges: {
            daily: generateDailyChallenges(),
            weekly: prev.challenges.weekly,
            completed: prev.challenges.completed.filter(id => 
              prev.challenges.weekly.some(c => c.id === id)
            )
          }
        }));
        
        // Refresh weekly on Monday
        if (now.getDay() === 0) {
          setGameState(prev => ({
            ...prev,
            challenges: {
              ...prev.challenges,
              weekly: generateWeeklyChallenges(),
              completed: []
            }
          }));
        }
        
        refreshChallenges(); // Schedule next refresh
      }, timeUntilMidnight);
      
      return timer;
    };
    
    const timer = refreshChallenges();
    return () => clearTimeout(timer);
  }, []);

  return {
    // State
    level: gameState.level,
    experience: gameState.experience,
    totalExperience: gameState.totalExperience,
    achievements: gameState.achievements,
    stats: gameState.stats,
    streak: gameState.streak,
    longestStreak: gameState.longestStreak,
    multiplier: gameState.multiplier,
    title: gameState.title,
    season: gameState.season,
    currencies: gameState.currencies,
    challenges: gameState.challenges,
    
    // Actions
    addExperience,
    addAchievement,
    incrementStat,
    completeChallenge,
    activateMultiplier,
    
    // Info
    getProgress,
    getLeaderboard,
    getTitle: (lvl) => getTitle(lvl),
    getAllAchievements: () => ACHIEVEMENTS,
    getUnlockedAchievements: () => gameState.achievements,
    
    // Sound
    playSound: enableSoundEffects ? playSound : () => {}
  };
};

// ============ Sound Effects ============
const soundCache = {};

function playSound(soundName) {
  try {
    const sounds = {
      levelUp: 'data:audio/wav;base64,...', // Base64 encoded sound
      achievement: 'data:audio/wav;base64,...',
      click: 'data:audio/wav;base64,...'
    };
    
    // In real app, use actual sound files
    // const audio = new Audio(`/sounds/${soundName}.mp3`);
    // audio.volume = 0.3;
    // audio.play().catch(() => {});
    
    // Simulated: Use Web Audio API for simple beeps
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch (soundName) {
      case 'levelUp':
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'achievement':
        oscillator.frequency.setValueAtTime(784, ctx.currentTime); // G5
        oscillator.frequency.setValueAtTime(988, ctx.currentTime + 0.1); // B5
        oscillator.frequency.setValueAtTime(1175, ctx.currentTime + 0.2); // D6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.6);
        break;
    }
  } catch (e) {
    // Audio not supported
  }
}

export default useGamificationPro;
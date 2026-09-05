// ============================================================
// src/components/GamificationWidgetPro.jsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationPro } from '../../hooks/useGamificationPro';
import { 
  FaStar, FaFire, FaTrophy, FaMedal, FaCrown, FaGem,
  FaChevronDown, FaChevronUp, FaBolt, FaCoins,
  FaCalendar, FaChartLine, FaUser, FaUsers,
  FaCheck, FaTimes, FaLock, FaUnlock, FaEye,
  FaEyeSlash, FaRedo, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// ۱. Level Up Modal
// ═══════════════════════════════════════════════════════════
const LevelUpModal = ({ levelUpData, onClose }) => {
  if (!levelUpData) return null;
  
  return (
    <motion.div 
      className="level-up-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="level-up-modal"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 10 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div 
          className="level-up-icon"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          🎉
        </motion.div>
        
        <h2>ارتقا به سطح {levelUpData.level}!</h2>
        <h3 className="level-up-title">{levelUpData.title}</h3>
        
        {levelUpData.rewards && (
          <div className="level-up-rewards">
            {levelUpData.rewards.coins > 0 && (
              <motion.span 
                className="reward-item"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <FaCoins /> +{levelUpData.rewards.coins} سکه
              </motion.span>
            )}
            {levelUpData.rewards.gems > 0 && (
              <motion.span 
                className="reward-item"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <FaGem /> +{levelUpData.rewards.gems} الماس
              </motion.span>
            )}
          </div>
        )}
        
        <motion.button 
          className="level-up-btn"
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🚀 بزن بریم!
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۲. XP Animation
// ═══════════════════════════════════════════════════════════
const XPAnimation = ({ xpGain }) => {
  if (!xpGain) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        key={xpGain.id}
        className="xp-animation"
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -80, scale: 1.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <span>+{xpGain.amount} XP</span>
        <FaBolt />
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════
// ۳. Mini Profile Card
// ═══════════════════════════════════════════════════════════
const MiniProfileCard = ({ title, level, totalExperience, streak, currencies }) => {
  const getBorderColor = (lvl) => {
    if (lvl >= 50) return '#ec4899'; // mythic
    if (lvl >= 25) return '#ef4444'; // legendary
    if (lvl >= 15) return '#f59e0b'; // epic
    return '#3b82f6'; // default
  };
  
  return (
    <motion.div 
      className="mini-profile-card"
      style={{ borderColor: getBorderColor(level) }}
      whileHover={{ y: -2 }}
    >
      <div className="profile-avatar" style={{ 
        background: `linear-gradient(135deg, ${getBorderColor(level)}, #3b82f6)` 
      }}>
        <span>{level}</span>
      </div>
      
      <div className="profile-info">
        <h4>{title}</h4>
        <span className="level-text">سطح {level}</span>
        <span className="xp-text">{totalExperience.toLocaleString()} XP کل</span>
        
        <div className="profile-quick-stats">
          {streak > 0 && (
            <span className="quick-stat" title="روزهای متوالی">
              <FaFire /> {streak}
            </span>
          )}
          <span className="quick-stat" title="سکه">
            <FaCoins /> {currencies?.coins || 0}
          </span>
          <span className="quick-stat" title="الماس">
            <FaGem /> {currencies?.gems || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۴. Level Badge with Progress Ring
// ═══════════════════════════════════════════════════════════
const LevelBadge = ({ level, progressPercent, experience, xpForNextLevel, xpGain, multiplier }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (progressPercent / 100) * circumference;
  
  return (
    <motion.div 
      className="level-badge-container"
      whileHover={{ scale: 1.02 }}
    >
      <div className="level-circle">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="level-number-container">
          <motion.span 
            className="level-number"
            key={level}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {level}
          </motion.span>
        </div>
      </div>
      
      <div className="level-details">
        <div className="xp-bar-container">
          <div className="xp-bar">
            <motion.div 
              className="xp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="xp-text">
            <FaStar /> {experience.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
        
        {multiplier > 1 && (
          <motion.div 
            className="multiplier-active"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <FaBolt /> XP {multiplier}x فعال
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۵. Stats Grid
// ═══════════════════════════════════════════════════════════
const StatsGrid = ({ stats }) => {
  const statItems = [
    { label: 'دستاورد کل', value: stats.totalAchievements, icon: <FaTrophy />, color: '#f59e0b' },
    { label: 'باز شده', value: stats.unlockedAchievements, icon: <FaUnlock />, color: '#10b981' },
    { label: 'درصد تکمیل', value: `${stats.achievementPercent}%`, icon: <FaChartLine />, color: '#3b82f6' },
    { label: 'چالش‌ها', value: stats.completedChallenges, icon: <FaMedal />, color: '#8b5cf6' },
  ];
  
  return (
    <div className="stats-grid">
      {statItems.map((item, idx) => (
        <motion.div 
          key={idx} 
          className="stat-item"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <span className="stat-icon" style={{ color: item.color }}>{item.icon}</span>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۶. Challenges Section
// ═══════════════════════════════════════════════════════════
const ChallengesSection = ({ challenges, completed, type, onComplete }) => {
  const [expanded, setExpanded] = useState(false);
  const displayChallenges = expanded ? challenges : challenges.slice(0, 3);
  
  return (
    <div className="challenges-section">
      <div className="challenges-header" onClick={() => setExpanded(!expanded)}>
        <h4>
          {type === 'daily' ? '🎯 چالش‌های روزانه' : '🏆 چالش‌های هفتگی'}
        </h4>
        <span className="challenges-count">
          {completed.length}/{challenges.length}
        </span>
        <button className="expand-btn">
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      <AnimatePresence>
        <div className="challenges-list">
          {displayChallenges.map((challenge) => {
            const isCompleted = completed.includes(challenge.id);
            
            return (
              <motion.div 
                key={challenge.id} 
                className={`challenge-item ${isCompleted ? 'completed' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={!isCompleted ? { x: 4 } : {}}
              >
                <span className="challenge-icon">{challenge.icon}</span>
                <div className="challenge-info">
                  <span className="challenge-title">{challenge.title}</span>
                  <span className="challenge-desc">{challenge.description}</span>
                </div>
                <span className="challenge-xp">+{challenge.xp} XP</span>
                <motion.button
                  className={`challenge-btn ${isCompleted ? 'done' : ''}`}
                  onClick={() => !isCompleted && onComplete(challenge.id)}
                  disabled={isCompleted}
                  whileHover={!isCompleted ? { scale: 1.1 } : {}}
                  whileTap={!isCompleted ? { scale: 0.9 } : {}}
                >
                  {isCompleted ? <FaCheck /> : 'شروع'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۷. Achievements Showcase
// ═══════════════════════════════════════════════════════════
const AchievementsShowcase = ({ achievements, allAchievements, getRarityColor }) => {
  const [showAll, setShowAll] = useState(false);
  const unlockedIds = new Set(achievements.map(a => a.id));
  const recentAchievements = achievements.slice(-8).reverse();
  
  return (
    <div className="achievements-showcase">
      <div className="achievements-header" onClick={() => setShowAll(!showAll)}>
        <h4>🏅 دستاوردها</h4>
        <span className="achievements-count">
          {achievements.length}/{allAchievements.length}
        </span>
        <button className="expand-btn">
          {showAll ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {/* Recent Achievements Grid */}
      <div className="recent-achievements-grid">
        {recentAchievements.map((a) => (
          <motion.div
            key={a.id}
            className="achievement-badge-mini"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.1 }}
            title={`${a.title}: ${a.description}`}
          >
            <span className="badge-icon">{a.icon}</span>
            <span 
              className="badge-rarity-dot"
              style={{ background: getRarityColor(a.rarity) }}
            />
          </motion.div>
        ))}
        
        {achievements.length === 0 && (
          <p className="no-achievements">هنوز دستاوردی کسب نکردید!</p>
        )}
      </div>
      
      {/* All Achievements (Expandable) */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            className="all-achievements-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {allAchievements.map((a) => {
              const isUnlocked = unlockedIds.has(a.id);
              
              return (
                <div 
                  key={a.id} 
                  className={`achievement-row ${isUnlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className="achievement-icon">
                    {isUnlocked ? a.icon : <FaLock />}
                  </span>
                  <div className="achievement-info">
                    <span className="achievement-name">
                      {isUnlocked ? a.title : '؟؟؟'}
                    </span>
                    {isUnlocked && (
                      <span className="achievement-desc">{a.description}</span>
                    )}
                  </div>
                  <div className="achievement-meta">
                    <span 
                      className="achievement-rarity"
                      style={{ color: getRarityColor(a.rarity) }}
                    >
                      {a.rarity}
                    </span>
                    <span className="achievement-xp">+{a.xp} XP</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۸. Leaderboard
// ═══════════════════════════════════════════════════════════
const Leaderboard = ({ entries }) => {
  const [expanded, setExpanded] = useState(false);
  const displayEntries = expanded ? entries : entries.slice(0, 5);
  
  return (
    <div className="leaderboard-section">
      <div className="leaderboard-header" onClick={() => setExpanded(!expanded)}>
        <h4><FaTrophy /> برترین‌ها</h4>
        <button className="expand-btn">
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      <div className="leaderboard-list">
        {displayEntries.map((entry, idx) => (
          <motion.div
            key={idx}
            className={`leaderboard-item ${entry.isYou ? 'you' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <span className="leader-rank">
              {entry.rank <= 3 ? (
                <span className="rank-medal">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </span>
              ) : (
                `#${entry.rank}`
              )}
            </span>
            
            <div className="leader-info">
              <span className="leader-name">
                {entry.isYou ? '👈 شما' : entry.name}
              </span>
              <span className="leader-level">سطح {entry.level}</span>
            </div>
            
            <div className="leader-xp">
              <span>{entry.xp.toLocaleString()} XP</span>
              {entry.isYou && (
                <motion.span 
                  className="you-badge"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  شما
                </motion.span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ۹. Season Info
// ═══════════════════════════════════════════════════════════
const SeasonInfo = ({ season, seasonXP, seasonMaxXP = 10000 }) => {
  const progress = Math.min((seasonXP / seasonMaxXP) * 100, 100);
  
  return (
    <motion.div 
      className="season-info"
      whileHover={{ y: -2 }}
    >
      <div className="season-header">
        <h4><FaCalendar /> فصل {season}</h4>
        <span className="season-reward">🎁 پاداش پایان فصل</span>
      </div>
      
      <div className="season-progress">
        <div className="season-xp-bar">
          <motion.div 
            className="season-xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="season-milestones">
          {[0, 25, 50, 75, 100].map(m => (
            <div 
              key={m} 
              className={`milestone ${progress >= m ? 'reached' : ''}`}
              title={`${m}%`}
            >
              <div className="milestone-dot" />
              {m === 0 ? 'شروع' : m === 100 ? '🏆' : `${m}%`}
            </div>
          ))}
        </div>
      </div>
      
      <span className="season-xp-text">
        {seasonXP.toLocaleString()} / {seasonMaxXP.toLocaleString()} XP
      </span>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const GamificationWidgetPro = ({ compact = false }) => {
  // ============ Gamification Hook ============
  const {
    level,
    experience,
    totalExperience,
    achievements,
    stats: gameStats,
    streak,
    longestStreak,
    multiplier,
    title,
    currencies,
    challenges,
    season,
    seasonXP,
    addExperience,
    addAchievement,
    incrementStat,
    completeChallenge,
    activateMultiplier,
    getProgress,
    getLeaderboard,
    getAllAchievements,
    getUnlockedAchievements,
    playSound
  } = useGamificationPro({
    enableConfetti: true,
    enableSoundEffects: true,
    xpCurve: 'linear',
    onLevelUp: ({ level, title, rewards }) => {
      console.log(`🎉 Level Up! ${level} - ${title}`);
    },
    onAchievementUnlocked: (achievement) => {
      console.log(`🏅 Achievement: ${achievement.title}`);
    }
  });

  // ============ State ============
  const [levelUpData, setLevelUpData] = useState(null);
  const [xpGain, setXpGain] = useState(null);

  // ============ Progress ============
  const progress = getProgress();
  const allAchievements = getAllAchievements();
  const leaderboard = getLeaderboard();

  // ============ Listen for Level Up ============
  useEffect(() => {
    const handleLevelUp = (e) => {
      setLevelUpData(e.detail);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => setLevelUpData(null), 4000);
    };
    
    window.addEventListener('level-up', handleLevelUp);
    return () => window.removeEventListener('level-up', handleLevelUp);
  }, []);

  // ============ Helper: Get Rarity Color ============
  const getRarityColor = (rarity) => ({
    'common': '#9ca3af',
    'uncommon': '#3b82f6',
    'rare': '#8b5cf6',
    'epic': '#f59e0b',
    'legendary': '#ef4444',
    'mythic': '#ec4899',
    'secret': '#06b6d4'
  }[rarity] || '#9ca3af');

  // ============ Test Actions (Dev Only) ============
  const handleTestXP = (amount) => {
    setXpGain({ amount, id: Date.now() });
    addExperience(amount, 'test');
    setTimeout(() => setXpGain(null), 1500);
  };

  // ============ Compact Mode ============
  if (compact) {
    return (
      <div className="gamification-compact">
        <div className="compact-level">
          <span className="compact-level-num">{level}</span>
          <div className="compact-xp-bar">
            <div className="compact-xp-fill" style={{ width: `${progress.progressPercent}%` }} />
          </div>
          <span className="compact-xp-text">{progress.progressPercent}%</span>
        </div>
        <div className="compact-stats">
          <span title="سکه"><FaCoins /> {currencies.coins}</span>
          <span title="الماس"><FaGem /> {currencies.gems}</span>
          {streak > 0 && <span title="روز متوالی"><FaFire /> {streak}</span>}
        </div>
      </div>
    );
  }

  // ============ Full Mode ============
  return (
    <div className="gamification-widget-pro">
      {/* XP Animation */}
      <XPAnimation xpGain={xpGain} />
      
      {/* Level Up Modal */}
      <AnimatePresence>
        {levelUpData && (
          <LevelUpModal 
            levelUpData={levelUpData} 
            onClose={() => setLevelUpData(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mini Profile Card */}
      <MiniProfileCard 
        title={title}
        level={level}
        totalExperience={totalExperience}
        streak={streak}
        currencies={currencies}
      />

      {/* Level Badge with Progress Ring */}
      <LevelBadge 
        level={level}
        progressPercent={progress.progressPercent}
        experience={experience}
        xpForNextLevel={progress.xpForNextLevel}
        xpGain={xpGain}
        multiplier={multiplier}
      />

      {/* Stats Grid */}
      <StatsGrid stats={{
        totalAchievements: progress.totalAchievements,
        unlockedAchievements: progress.unlockedAchievements,
        achievementPercent: progress.achievementPercent,
        completedChallenges: progress.completedChallenges
      }} />

      {/* Multiplier & Streak */}
      {(streak > 0 || multiplier > 1) && (
        <div className="status-badges">
          {streak > 0 && (
            <motion.div 
              className="badge streak-badge"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaFire /> {streak} روز متوالی
              <span className="badge-sub">رکورد: {longestStreak}</span>
            </motion.div>
          )}
          {multiplier > 1 && (
            <motion.div 
              className="badge multiplier-badge"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <FaBolt /> XP {multiplier}x
            </motion.div>
          )}
        </div>
      )}

      {/* Currencies */}
      <div className="currencies-display">
        <motion.div className="currency-item" whileHover={{ scale: 1.05 }}>
          <FaCoins className="coin-icon" />
          <span>{currencies.coins.toLocaleString()}</span>
          <span className="currency-label">سکه</span>
        </motion.div>
        <motion.div className="currency-item" whileHover={{ scale: 1.05 }}>
          <FaGem className="gem-icon" />
          <span>{currencies.gems.toLocaleString()}</span>
          <span className="currency-label">الماس</span>
        </motion.div>
      </div>

      {/* Daily Challenges */}
      <ChallengesSection
        challenges={challenges.daily}
        completed={challenges.completed}
        type="daily"
        onComplete={completeChallenge}
      />

      {/* Weekly Challenges */}
      <ChallengesSection
        challenges={challenges.weekly}
        completed={challenges.completed}
        type="weekly"
        onComplete={completeChallenge}
      />

      {/* Season Info */}
      <SeasonInfo season={season} seasonXP={seasonXP} />

      {/* Achievements */}
      <AchievementsShowcase
        achievements={achievements}
        allAchievements={allAchievements}
        getRarityColor={getRarityColor}
      />

      {/* Leaderboard */}
      <Leaderboard entries={leaderboard} />

      {/* Test Actions (Dev Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="test-actions">
          <h4>🧪 تست (فقط توسعه)</h4>
          <div className="test-buttons">
            <button onClick={() => handleTestXP(10)}>+۱۰ XP</button>
            <button onClick={() => handleTestXP(50)}>+۵۰ XP</button>
            <button onClick={() => handleTestXP(100)}>+۱۰۰ XP</button>
            <button onClick={() => handleTestXP(500)}>+۵۰۰ XP</button>
            <button onClick={() => activateMultiplier(2, 60000)}>
              <FaBolt /> 2x (۱ دقیقه)
            </button>
            <button onClick={() => activateMultiplier(3, 60000)}>
              <FaBolt /> 3x (۱ دقیقه)
            </button>
            <button onClick={() => addAchievement('first-login')}>
              🏅 دستاورد تست
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Export sub-components for reuse
// ═══════════════════════════════════════════════════════════
export {
  LevelUpModal,
  XPAnimation,
  MiniProfileCard,
  LevelBadge,
  StatsGrid,
  ChallengesSection,
  AchievementsShowcase,
  Leaderboard,
  SeasonInfo
};

export default GamificationWidgetPro;
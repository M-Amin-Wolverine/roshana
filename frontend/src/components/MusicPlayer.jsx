// components/MusicPlayer.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { gsap } from 'gsap';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward,
  FaRandom, FaRedo, FaHeart, FaList, FaTimes,
  FaMusic, FaExpand, FaCompress, FaCog, FaPalette,
  FaKeyboard, FaWaveSquare, FaRobot, FaUserAstronaut,
  FaBolt, FaGhost, FaFire, FaGem, FaMeteor
} from 'react-icons/fa';

// ====================== AUDIO ENGINE ======================
class UltraAudioEngine {
  constructor() {
    this.audioContext = null;
    this.analyserNode = null;
    this.stereoWidener = null;
    this.pitchShifter = null;
    this.timeStretch = null;
    this.compressor = null;
    this.crossfadeNode = null;
    this.isInitialized = false;
  }

  async initialize() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // تنظیمات پیشرفته صوتی
    this.masterGain = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    // Stereo Widener
    this.stereoWidener = this.audioContext.createStereoPanner();
    this.stereoWidener.pan.value = 0;
    
    // Compressor برای بیس قوی‌تر
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -50;
    this.compressor.knee.value = 40;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0;
    this.compressor.release.value = 0.25;
    
    // Pitch Shifter (با استفاده از delay line)
    this.pitchShifter = this.audioContext.createDelay();
    this.pitchShifter.delayTime.value = 0;
    
    this.isInitialized = true;
    return this.audioContext;
  }

  setStereoWidth(width) {
    if (this.stereoWidener) {
      this.stereoWidener.pan.value = width; // -1 to 1
    }
  }

  setPitch(octaves) {
    if (this.pitchShifter) {
      this.pitchShifter.delayTime.value = Math.abs(octaves) * 0.1;
    }
  }

  createCrossfade(duration = 3) {
    // Crossfade هوشمند بین دو source
    const now = this.audioContext.currentTime;
    this.masterGain.gain.setValueAtTime(1, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + duration/2);
    this.masterGain.gain.linearRampToValueAtTime(1, now + duration);
  }
}

// ====================== THEME SYSTEM ======================
const themes = {
  cyberpunk: {
    name: 'Neon Cyberpunk',
    icon: FaBolt,
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      background: 'linear-gradient(135deg, #0a0a0f, #1a0033)',
      surface: 'rgba(255, 0, 255, 0.1)',
      text: '#e0e0ff',
      accent: '#ffd700',
      neon: '#ff00ff',
      glow: '0 0 20px rgba(255,0,255,0.5)',
      border: 'rgba(255,0,255,0.3)'
    },
    effects: {
      glitch: true,
      scanlines: true,
      neonGlow: true
    }
  },
  glassMinimal: {
    name: 'Glass Minimal',
    icon: FaGem,
    colors: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      surface: 'rgba(255,255,255,0.1)',
      text: '#ffffff',
      accent: '#667eea',
      neon: 'rgba(255,255,255,0.8)',
      glow: '0 8px 32px rgba(102,126,234,0.2)',
      border: 'rgba(255,255,255,0.2)'
    },
    effects: {
      glassmorphism: true,
      blur: '20px',
      frostedGlass: true
    }
  },
  materialYou: {
    name: 'Material You',
    icon: FaPalette,
    colors: {
      primary: '#6750A4',
      secondary: '#625B71',
      background: 'linear-gradient(135deg, #FFFBFE, #F5EFFF)',
      surface: 'rgba(103,80,164,0.08)',
      text: '#1C1B1F',
      accent: '#E8DEF8',
      neon: 'rgba(103,80,164,0.4)',
      glow: '0 4px 16px rgba(103,80,164,0.15)',
      border: 'rgba(103,80,164,0.12)'
    },
    effects: {
      materialDesign: true,
      dynamicColor: true,
      ripple: true
    }
  }
};

// ====================== 3D WATERFALL SPECTRUM ======================
const WaterfallSpectrum = ({ analyserNode, isPlaying, theme }) => {
  const meshRef = useRef();
  const particlesRef = useRef();
  
  useFrame(() => {
    if (analyserNode && isPlaying) {
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(dataArray);
      
      // Update 3D waterfall
      if (meshRef.current) {
        const geometry = meshRef.current.geometry;
        const positions = geometry.attributes.position.array;
        
        // Shift waterfall down
        for (let i = positions.length - 1; i >= 3; i--) {
          positions[i] = positions[i - 3];
        }
        
        // Add new row
        for (let i = 0; i < dataArray.length; i++) {
          const height = dataArray[i] / 255;
          positions[i * 3 + 1] = height * 5;
        }
        
        geometry.attributes.position.needsUpdate = true;
      }
      
      // Update particles with mouse interaction
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.001;
        particlesRef.current.material.color = new THREE.Color(theme.colors.neon);
      }
    }
  });
  
  return (
    <>
      {/* Waterfall Plane */}
      <mesh ref={meshRef} rotation={[-Math.PI / 4, 0, 0]} position={[0, 0, -2]}>
        <planeGeometry args={[10, 5, 256, 128]} />
        <shaderMaterial
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform vec3 color;
            uniform float time;
            void main() {
              float intensity = vUv.y;
              vec3 neonColor = color * (1.0 + sin(vUv.x * 20.0 + time) * 0.5);
              gl_FragColor = vec4(neonColor * intensity, intensity * 0.8);
            }
          `}
          uniforms={{
            color: { value: new THREE.Color(theme === 'cyberpunk' ? '#ff00ff' : '#667eea') },
            time: { value: 0 }
          }}
          transparent
          wireframe
        />
      </mesh>
      
      {/* Interactive Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={1000}
            array={new Float32Array(3000).map(() => (Math.random() - 0.5) * 10)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={theme === 'cyberpunk' ? '#ff00ff' : '#667eea'}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.8}
        />
      </points>
      
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
};

// ====================== MAIN COMPONENT ======================
const MusicPlayer = () => {
  // ============ STATE MANAGEMENT ============
  const [currentTheme, setCurrentTheme] = useState('cyberpunk');
  const [layout, setLayout] = useState('full'); // compact, full, minimal, dj
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.18);
  const [stereoWidth, setStereoWidth] = useState(0);
  const [pitchShift, setPitchShift] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showThemeBuilder, setShowThemeBuilder] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  
  // Gesture states
  const swipeX = useMotionValue(0);
  const swipeY = useMotionValue(0);
  const scale = useMotionValue(1);
  
  // Refs
  const audioRef = useRef(null);
  const audioEngine = useRef(null);
  const canvasRef = useRef(null);
  const threeContainerRef = useRef(null);
  const particlesCanvasRef = useRef(null);
  
  // ============ CUSTOM SHORTCUTS SYSTEM ============
  const [shortcuts, setShortcuts] = useState({
    'Space': { action: 'togglePlay', description: 'پخش/مکث' },
    'ArrowRight': { action: 'seekForward', description: 'جلو ۱۰ ثانیه' },
    'ArrowLeft': { action: 'seekBackward', description: 'عقب ۱۰ ثانیه' },
    'ArrowUp': { action: 'volumeUp', description: 'افزایش صدا' },
    'ArrowDown': { action: 'volumeDown', description: 'کاهش صدا' },
    'KeyM': { action: 'toggleMute', description: 'قطع/وصل صدا' },
    'KeyS': { action: 'toggleShuffle', description: 'حالت تصادفی' },
    'KeyR': { action: 'toggleRepeat', description: 'تکرار' },
    'KeyL': { action: 'toggleLike', description: 'لایک' },
    'KeyP': { action: 'pitchUp', description: 'بالا بردن پیچ' },
    'KeyO': { action: 'pitchDown', description: 'پایین آوردن پیچ' },
  });
  
  // ============ MACRO SYSTEM ============
  const [macros, setMacros] = useState([
    {
      id: 1,
      name: 'Party Mode',
      sequence: ['toggleShuffle', 'volumeUp', 'volumeUp', 'stereoWidener'],
      icon: FaFire
    },
    {
      id: 2,
      name: 'Chill Mode',
      sequence: ['crossfade3s', 'pitchDown', 'volumeDown'],
      icon: FaGhost
    }
  ]);
  
  // ============ AUDIO ENGINE INITIALIZATION ============
  useEffect(() => {
    audioEngine.current = new UltraAudioEngine();
    
    return () => {
      if (audioEngine.current.audioContext) {
        audioEngine.current.audioContext.close();
      }
    };
  }, []);
  
  // ============ HAPTIC FEEDBACK ============
  const triggerHaptic = useCallback((pattern = [100]) => {
    if (hapticEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [hapticEnabled]);
  
  // Haptic aligned with bass
  useEffect(() => {
    if (isPlaying && hapticEnabled && audioEngine.current?.analyserNode) {
      const interval = setInterval(() => {
        const dataArray = new Uint8Array(audioEngine.current.analyserNode.frequencyBinCount);
        audioEngine.current.analyserNode.getByteFrequencyData(dataArray);
        
        const bassIntensity = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10;
        if (bassIntensity > 128) {
          const intensity = Math.min(Math.floor((bassIntensity - 128) / 128 * 200), 200);
          navigator.vibrate?.(intensity);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, hapticEnabled]);
  
  // ============ GESTURE HANDLERS ============
  const handleSwipe = useCallback((event, info) => {
    const { offset } = info;
    
    if (Math.abs(offset.x) > 100) {
      // Swipe horizontal - change track
      offset.x > 0 ? changeTrack('prev') : changeTrack('next');
      triggerHaptic([50]);
    } else if (Math.abs(offset.y) > 100) {
      // Swipe vertical - change layout
      cycleLayout();
      triggerHaptic([30, 50, 30]);
    }
  }, [triggerHaptic]);
  
  const cycleLayout = () => {
    const layouts = ['compact', 'full', 'minimal', 'dj'];
    const currentIndex = layouts.indexOf(layout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setLayout(layouts[nextIndex]);
  };
  
  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const shortcut = shortcuts[e.code];
      if (shortcut) {
        e.preventDefault();
        executeAction(shortcut.action);
        triggerHaptic([20]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, triggerHaptic]);
  
  const executeAction = useCallback((action) => {
    switch(action) {
      case 'togglePlay':
        togglePlay();
        break;
      case 'seekForward':
        if (audioRef.current) audioRef.current.currentTime += 10;
        break;
      case 'seekBackward':
        if (audioRef.current) audioRef.current.currentTime -= 10;
        break;
      case 'volumeUp':
        setVolume(prev => Math.min(prev + 0.05, 1));
        break;
      case 'volumeDown':
        setVolume(prev => Math.max(prev - 0.05, 0));
        break;
      case 'stereoWidener':
        setStereoWidth(prev => prev === 0 ? 0.8 : 0);
        break;
      case 'pitchUp':
        setPitchShift(prev => prev + 0.1);
        break;
      case 'pitchDown':
        setPitchShift(prev => prev - 0.1);
        break;
      case 'crossfade3s':
        audioEngine.current?.setCrossfade(3);
        break;
    }
  }, []);
  
  // ============ MACRO EXECUTION ============
  const executeMacro = useCallback((macroId) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;
    
    let delay = 0;
    macro.sequence.forEach(action => {
      setTimeout(() => {
        executeAction(action);
        triggerHaptic([30]);
      }, delay);
      delay += 300;
    });
  }, [macros, executeAction, triggerHaptic]);
  
  // ============ RENDER LAYOUTS ============
  const renderDJMode = () => (
    <div className="dj-mode grid grid-cols-2 gap-4 p-4">
      {/* دو waveform همزمان */}
      <div className="col-span-2 bg-slate-900/50 rounded-xl p-4">
        <canvas ref={canvasRef} className="w-full h-32" />
      </div>
      
      {/* کنترل‌های DJ */}
      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <label className="text-xs text-gray-400">Pitch Shift</label>
          <input
            type="range"
            min="-12"
            max="12"
            value={pitchShift * 12}
            onChange={(e) => {
              setPitchShift(parseFloat(e.target.value) / 12);
              audioEngine.current?.setPitch(parseFloat(e.target.value) / 12);
            }}
            className="w-full accent-cyan-400"
          />
          <div className="text-center text-cyan-400 font-mono">
            {pitchShift > 0 ? '+' : ''}{pitchShift.toFixed(2)}x
          </div>
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-3">
          <label className="text-xs text-gray-400">Playback Rate</label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={playbackRate}
            onChange={(e) => {
              setPlaybackRate(parseFloat(e.target.value));
              if (audioRef.current) audioRef.current.playbackRate = parseFloat(e.target.value);
            }}
            className="w-full accent-purple-400"
          />
          <div className="text-center text-purple-400 font-mono">
            {playbackRate}x
          </div>
        </div>
      </div>
      
      {/* Crossfader */}
      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <label className="text-xs text-gray-400">Stereo Width</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={stereoWidth}
            onChange={(e) => {
              setStereoWidth(parseFloat(e.target.value));
              audioEngine.current?.setStereoWidth(parseFloat(e.target.value));
            }}
            className="w-full accent-yellow-400"
          />
        </div>
        
        <div className="bg-slate-900/50 rounded-xl p-3">
          <label className="text-xs text-gray-400">Crossfade</label>
          <input
            type="range"
            min="0"
            max="10"
            value={crossfadeDuration}
            onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
            className="w-full accent-red-400"
          />
          <div className="text-center text-red-400 font-mono">
            {crossfadeDuration}s
          </div>
        </div>
      </div>
      
      {/* Macro Buttons */}
      <div className="col-span-2 flex gap-2">
        {macros.map(macro => (
          <button
            key={macro.id}
            onClick={() => executeMacro(macro.id)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 p-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            <macro.icon />
            {macro.name}
          </button>
        ))}
      </div>
    </div>
  );
  
  // ============ THEME BUILDER ============
  const ThemeBuilder = () => (
    <AnimatePresence>
      {showThemeBuilder && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-slate-900 rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-white mb-4">Theme Builder</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`p-4 rounded-xl transition-all ${
                    currentTheme === key
                      ? 'ring-2 ring-cyan-400 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: theme.colors.background }}
                >
                  <theme.icon className="text-2xl mx-auto mb-2" style={{ color: theme.colors.neon }} />
                  <p className="text-xs text-white">{theme.name}</p>
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Custom Primary Color</label>
              <input
                type="color"
                className="w-full h-10 rounded cursor-pointer"
                onChange={(e) => {
                  // Custom color implementation
                }}
              />
            </div>
            
            <button
              onClick={() => setShowThemeBuilder(false)}
              className="w-full mt-4 bg-gray-800 text-white p-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // ============ MAIN RENDER ============
  const currentThemeConfig = themes[currentTheme];
  
  return (
    <div className="ultra-music-player" style={{
      '--primary': currentThemeConfig.colors.primary,
      '--secondary': currentThemeConfig.colors.secondary,
      '--background': currentThemeConfig.colors.background,
      '--surface': currentThemeConfig.colors.surface,
      '--text': currentThemeConfig.colors.text,
      '--accent': currentThemeConfig.colors.accent,
      '--neon': currentThemeConfig.colors.neon,
      '--glow': currentThemeConfig.colors.glow,
      '--border': currentThemeConfig.colors.border,
    }}>
      {/* ============ 3D Background ============ */}
      <div ref={threeContainerRef} className="fixed inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <WaterfallSpectrum
            analyserNode={audioEngine.current?.analyserNode}
            isPlaying={isPlaying}
            theme={currentTheme}
          />
        </Canvas>
      </div>
      
      {/* ============ MAIN PLAYER ============ */}
      <motion.div
        className={`player-container ${layout}-layout`}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleSwipe}
        style={{ x: swipeX, y: swipeY, scale }}
      >
        {/* Glitch Effect Overlay */}
        {currentThemeConfig.effects.glitch && (
          <div className="glitch-overlay" data-text="ROSHANA PLAYER">
            ROSHANA PLAYER
          </div>
        )}
        
        {/* Scanlines */}
        {currentThemeConfig.effects.scanlines && (
          <div className="scanlines" />
        )}
        
        {/* Player Content Based on Layout */}
        <AnimatePresence mode="wait">
          {layout === 'dj' ? (
            renderDJMode()
          ) : (
            <motion.div
              key={layout}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Album Art with Parallax */}
              <motion.div
                className="album-art-container"
                whileHover={{ scale: 1.05 }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <motion.img
                  src="/cover.jpg"
                  className="w-full max-w-xs mx-auto rounded-2xl shadow-2xl"
                  style={{
                    transform: `rotateY(${useTransform(swipeX, [-100, 100], [-15, 15])}deg)`
                  }}
                  animate={{
                    boxShadow: isPlaying
                      ? `0 0 30px ${currentThemeConfig.colors.neon}`
                      : '0 0 10px rgba(0,0,0,0.3)'
                  }}
                />
              </motion.div>
              
              {/* Waveform Visualizer */}
              <canvas
                ref={canvasRef}
                className="w-full h-24 my-6 rounded-lg"
                style={{
                  background: currentThemeConfig.colors.surface,
                  backdropFilter: currentThemeConfig.effects.glassmorphism ? 'blur(20px)' : 'none'
                }}
              />
              
              {/* Controls */}
              <div className="controls">
                {/* Theme Switcher */}
                <button
                  onClick={() => setShowThemeBuilder(true)}
                  className="theme-switch-btn"
                >
                  <FaPalette />
                </button>
                
                {/* Layout Switcher */}
                <button
                  onClick={cycleLayout}
                  className="layout-switch-btn"
                >
                  <FaWaveSquare />
                </button>
                
                {/* Shortcuts Customizer */}
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="shortcuts-btn"
                >
                  <FaKeyboard />
                </button>
                
                {/* Haptic Toggle */}
                <button
                  onClick={() => setHapticEnabled(!hapticEnabled)}
                  className={`haptic-btn ${hapticEnabled ? 'active' : ''}`}
                >
                  {hapticEnabled ? <FaBolt /> : <FaGhost />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* ============ SHORTCUTS CUSTOMIZER ============ */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl p-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400">
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(shortcuts).map(([key, shortcut]) => (
                <div key={key} className="bg-slate-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <kbd className="px-2 py-1 bg-slate-700 rounded text-cyan-400 text-sm">
                      {key.replace('Key', '')}
                    </kbd>
                    <span className="text-gray-300 text-sm">{shortcut.description}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="New shortcut..."
                    className="mt-2 w-full bg-slate-700 rounded p-1 text-white text-sm"
                    onKeyDown={(e) => {
                      e.preventDefault();
                      const newShortcuts = { ...shortcuts };
                      delete newShortcuts[key];
                      setShortcuts({
                        ...newShortcuts,
                        [e.code]: shortcut
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ============ THEME BUILDER ============ */}
      <ThemeBuilder />
      
      {/* ============ AUDIO ELEMENT ============ */}
      <audio ref={audioRef} />
    </div>
  );
};

export default MusicPlayer;
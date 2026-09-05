// src/pages/admin/AdminCollaborationPanelUltra.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  FaUsers, FaUser, FaUserPlus, FaTimes, FaLock, FaUnlock,
  FaComments, FaPaperPlane, FaSmile, FaEllipsisV, FaEye,
  FaEyeSlash, FaUserCheck, FaUserClock, FaUserMinus,
  FaFileAlt, FaShare, FaLink, FaCopy, FaCrown, FaShieldAlt,
  FaPen, FaTrash, FaBan, FaEnvelope, FaSearch, FaPhone,
  FaVideo, FaMicrophone, FaMicrophoneSlash, FaDesktop,
  FaHandPaper, FaThumbsUp, FaReply, FaEdit, FaCheck,
  FaCheckDouble, FaClock, FaCalendar, FaBell, FaBellSlash,
  FaPaintBrush, FaMousePointer, FaUndo, FaRedo,
  FaChevronDown, FaChevronUp, FaPlus, FaMinus,
  FaFolder, FaImage, FaPaperclip, FaCode, FaMapMarkerAlt,
  FaUserTag, FaHistory, FaStar, FaRegStar, FaPause,
  FaSquare, FaCircle, FaFont, FaEraser, FaDownload,
  FaUpload, FaComment, FaCommentSlash, FaPalette,
  FaHighlighter, FaCut, FaBold, FaItalic, FaUnderline,
  FaHeading, FaListUl, FaListOl, FaQuoteRight, FaTable,
  FaGlobe, FaCalendarPlus, FaCalendarAlt, FaCalendarCheck,
  FaGoogle, FaMicrosoft
} from 'react-icons/fa';
import { 
  MdOnlinePrediction, MdOfflineBolt, MdScreenShare,
  MdStopScreenShare, MdDraw, MdAddComment 
} from 'react-icons/md';
import { BiSolidVideo, BiSolidVideoOff } from 'react-icons/bi';
import { BsCursorFill, BsPencilFill, BsEraserFill } from 'react-icons/bs';
import { TbRectangle, TbCircle, TbLine } from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';

// ==================== ۱. CURSOR POSITION REAL-TIME ====================
const RemoteCursors = ({ collaborators, currentUserId }) => {
  return (
    <div className="remote-cursors-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {collaborators
          .filter(c => c.id !== currentUserId && c.cursor && c.presence === 'online')
          .map(user => (
            <motion.div
              key={user.id}
              style={{ position: 'absolute', left: user.cursor.x, top: user.cursor.y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ color: user.color }}>
                <path d="M5 3l14 9-7 2-4 7-3-18z" fill={user.color} stroke="white" strokeWidth="1" />
              </svg>
              <motion.span 
                style={{ 
                  backgroundColor: user.color, 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px', 
                  position: 'absolute', 
                  top: 20, 
                  left: 10,
                  whiteSpace: 'nowrap'
                }}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {user.name}
              </motion.span>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

// ==================== ۲. VOICE CHAT (WebRTC) ====================
const VoiceChat = ({ participants, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState({});
  const [audioLevel, setAudioLevel] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const localStreamRef = useRef(null);
  
  useEffect(() => {
    startVoiceChat();
    return () => stopVoiceChat();
  }, []);
  
  const startVoiceChat = async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      localStreamRef.current = stream;
      
      setTimeout(() => {
        setConnectionStatus('connected');
        toast.success('🎙️ اتصال صوتی برقرار شد');
      }, 1500);
      
      // Simulate audio levels for participants
      const interval = setInterval(() => {
        setAudioLevel(prev => {
          const newLevels = { local: Math.random() * 100 };
          participants.forEach(p => { newLevels[p.id] = Math.random() * 100; });
          return newLevels;
        });
        setIsSpeaking(prev => {
          const newSpeaking = { local: Math.random() > 0.5 };
          participants.forEach(p => { newSpeaking[p.id] = Math.random() > 0.5; });
          return newSpeaking;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } catch (error) {
      setConnectionStatus('disconnected');
      toast.error('❌ دسترسی به میکروفون رد شد');
    }
  };
  
  const stopVoiceChat = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    toast('🎙️ اتصال صوتی قطع شد');
  };
  
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = isMuted; });
    setIsMuted(!isMuted);
  };
  
  return (
    <motion.div 
      style={{ position: 'fixed', bottom: 20, right: 20, background: '#1a1a2e', borderRadius: 16, padding: 20, zIndex: 10000, minWidth: 300 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <span style={{ color: '#10b981' }}>● {connectionStatus === 'connected' ? 'متصل' : connectionStatus === 'connecting' ? 'در حال اتصال...' : 'قطع'}</span>
        <span style={{ color: '#94a3b8' }}>{participants.length + 1} نفر</span>
        <button onClick={() => { stopVoiceChat(); onClose(); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FaTimes /></button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
        {/* Local */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#3b82f6', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <FaUser size={24} color="white" />
            {isSpeaking['local'] && (
              <motion.div 
                style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #3b82f6' }}
                animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
          </div>
          <span style={{ color: 'white', fontSize: 12, display: 'block', marginTop: 5 }}>شما</span>
          {isMuted && <FaMicrophoneSlash color="#ef4444" size={12} style={{ marginTop: 3 }} />}
          <div style={{ width: '100%', height: 4, background: '#334155', borderRadius: 2, marginTop: 5 }}>
            <motion.div style={{ height: '100%', background: '#3b82f6', borderRadius: 2 }} animate={{ width: `${(audioLevel['local'] || 0) * 1.5}%` }} />
          </div>
        </div>
        
        {/* Participants */}
        {participants.map(p => (
          <div key={p.id} style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: p.color, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <FaUser size={24} color="white" />
              {isSpeaking[p.id] && (
                <motion.div 
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${p.color}` }}
                  animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
            </div>
            <span style={{ color: 'white', fontSize: 12, display: 'block', marginTop: 5 }}>{p.name}</span>
            <div style={{ width: '100%', height: 4, background: '#334155', borderRadius: 2, marginTop: 5 }}>
              <motion.div style={{ height: '100%', background: p.color, borderRadius: 2 }} animate={{ width: `${(audioLevel[p.id] || 0) * 1.5}%` }} />
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 15 }}>
        <button onClick={toggleMute} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isMuted ? '#ef4444' : '#334155', color: 'white' }}>
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={() => setIsDeafened(!isDeafened)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isDeafened ? '#ef4444' : '#334155', color: 'white' }}>
          {isDeafened ? <FaBellSlash /> : <FaBell />}
        </button>
        <button onClick={() => { stopVoiceChat(); onClose(); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white' }}>
          <FaPhone style={{ transform: 'rotate(135deg)' }} />
        </button>
      </div>
    </motion.div>
  );
};

// ==================== ۳. WHITEBOARD COLLABORATION ====================
const Whiteboard = ({ collaborators, onClose }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const startPosRef = useRef(null);
  
  const tools = [
    { id: 'pen', icon: <BsPencilFill size={18} />, label: 'قلم' },
    { id: 'eraser', icon: <BsEraserFill size={18} />, label: 'پاک‌کن' },
    { id: 'rectangle', icon: <TbRectangle size={18} />, label: 'مستطیل' },
    { id: 'circle', icon: <TbCircle size={18} />, label: 'دایره' },
    { id: 'line', icon: <TbLine size={18} />, label: 'خط' },
    { id: 'text', icon: <FaFont size={18} />, label: 'متن' }
  ];
  
  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF6600', '#6600FF'];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);
  
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const img = new Image();
    img.src = history[newIndex];
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx?.drawImage(img, 0, 0);
    };
  };
  
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const img = new Image();
    img.src = history[newIndex];
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx?.drawImage(img, 0, 0);
    };
  };
  
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };
  
  const startDraw = (e) => {
    const coords = getCoords(e);
    startPosRef.current = coords;
    const ctx = canvasRef.current?.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCoords(e);
    const ctx = canvasRef.current?.getContext('2d');
    
    // Restore previous state for shapes
    if (['rectangle', 'circle', 'line'].includes(tool) && history[historyIndex]) {
      const img = new Image();
      img.src = history[historyIndex];
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        drawShape(ctx, startPosRef.current, coords);
      };
    } else if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };
  
  const drawShape = (ctx, start, end) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    const w = end.x - start.x;
    const h = end.y - start.y;
    
    switch (tool) {
      case 'rectangle':
        ctx.strokeRect(start.x, start.y, w, h);
        break;
      case 'circle':
        const r = Math.sqrt(w * w + h * h);
        ctx.beginPath();
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
    }
  };
  
  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };
  
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('📥 تصویر ذخیره شد');
  };
  
  return (
    <motion.div 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, padding: 12, background: '#1e293b', alignItems: 'center', flexWrap: 'wrap' }}>
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} 
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tool === t.id ? '#3b82f6' : '#334155', color: 'white' }}
            title={t.label}
          >{t.icon}</button>
        ))}
        <div style={{ width: 1, height: 24, background: '#475569', margin: '0 4px' }} />
        {colors.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
          />
        ))}
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 30, height: 30, cursor: 'pointer' }} />
        <div style={{ width: 1, height: 24, background: '#475569', margin: '0 4px' }} />
        <input type="range" min="1" max="20" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} style={{ width: 100 }} />
        <span style={{ color: 'white', fontSize: 12 }}>{lineWidth}px</span>
        <div style={{ flex: 1 }} />
        <button onClick={undo} disabled={historyIndex <= 0} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#334155', color: 'white', opacity: historyIndex <= 0 ? 0.5 : 1 }}><FaUndo /></button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#334155', color: 'white', opacity: historyIndex >= history.length - 1 ? 0.5 : 1 }}><FaRedo /></button>
        <button onClick={saveAsImage} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#334155', color: 'white' }}><FaDownload /></button>
        <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white' }}><FaTimes /></button>
      </div>
      
      {/* Collaborators */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 12px', background: '#0f172a' }}>
        {collaborators.map(c => (
          <div key={c.id} style={{ width: 24, height: 24, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }} title={c.name}>
            {c.name[0]}
          </div>
        ))}
      </div>
      
      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          style={{ background: 'white', borderRadius: 8, boxShadow: '0 0 30px rgba(0,0,0,0.5)', cursor: 'crosshair', maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    </motion.div>
  );
};

// ==================== ۴. DOCUMENT COLLABORATION ====================
const CollaborativeEditor = ({ document: initialDoc, collaborators, onClose }) => {
  const [content, setContent] = useState(initialDoc?.content || '');
  const [title, setTitle] = useState(initialDoc?.title || 'سند بدون عنوان');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions] = useState([
    { id: 1, date: '2024-01-15 10:30', author: 'ادمین اصلی', changes: 'افزودن بخش مقدمه' },
    { id: 2, date: '2024-01-15 09:00', author: 'مدیر آموزش', changes: 'ویرایش بخش دوم' },
    { id: 3, date: '2024-01-14 18:00', author: 'ادمین اصلی', changes: 'ایجاد سند' }
  ]);
  const editorRef = useRef(null);
  
  const handleContentChange = (e) => {
    setContent(e.target.value);
    const textBeforeCursor = e.target.value.substring(0, e.target.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorPosition({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };
  
  const handleTextSelect = () => {
    const textarea = editorRef.current;
    if (!textarea) return;
    setSelectedText(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd));
  };
  
  const insertFormatting = (format) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const tags = { bold: ['**', '**'], italic: ['*', '*'], underline: ['__', '__'], heading: ['\n## ', '\n'], list: ['\n- ', ''], code: ['`', '`'] };
    const [open, close] = tags[format] || ['', ''];
    const newContent = content.substring(0, start) + open + selected + close + content.substring(end);
    setContent(newContent);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + open.length, start + open.length + selected.length); }, 0);
  };
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `comment-${Date.now()}`, text: newComment, author: 'ادمین اصلی',
      timestamp: new Date().toISOString(), selectedText, resolved: false, replies: []
    }]);
    setNewComment('');
    toast.success('💬 نظر اضافه شد');
  };
  
  const handleResolveComment = (commentId) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c));
  };
  
  const handleReplyToComment = (commentId, replyText) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...c.replies, { id: `reply-${Date.now()}`, text: replyText, author: 'ادمین اصلی', timestamp: new Date().toISOString() }] };
      }
      return c;
    }));
  };
  
  const renderedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
  
  return (
    <motion.div 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #334155' }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1 }} />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>خط {cursorPosition.line}, ستون {cursorPosition.col}</span>
          <button onClick={() => setShowVersionHistory(!showVersionHistory)} style={{ padding: '6px 12px', borderRadius: 6, background: '#334155', border: 'none', color: 'white', cursor: 'pointer', fontSize: 12 }}><FaHistory size={12} /> تاریخچه</button>
          <button onClick={() => setShowComments(!showComments)} style={{ padding: '6px 12px', borderRadius: 6, background: '#334155', border: 'none', color: 'white', cursor: 'pointer', fontSize: 12 }}><MdAddComment size={12} /> نظرات ({comments.length})</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FaTimes /></button>
        </div>
        
        {/* Collaborators */}
        <div style={{ display: 'flex', gap: 8, padding: '6px 20px', borderBottom: '1px solid #334155' }}>
          {collaborators.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.color }} title={c.name}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}>{c.name[0]}</div>
              {c.name}
            </div>
          ))}
        </div>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 20px', borderBottom: '1px solid #334155' }}>
          {[{ f: 'bold', i: <FaBold size={14} /> }, { f: 'italic', i: <FaItalic size={14} /> }, { f: 'underline', i: <FaUnderline size={14} /> }, { f: 'heading', i: <FaHeading size={14} /> }, { f: 'list', i: <FaListUl size={14} /> }, { f: 'code', i: <FaCode size={14} /> }].map(item => (
            <button key={item.f} onClick={() => insertFormatting(item.f)} style={{ padding: '6px 10px', borderRadius: 6, background: '#334155', border: 'none', color: 'white', cursor: 'pointer' }}>{item.i}</button>
          ))}
        </div>
        
        {/* Editor + Preview */}
        <div style={{ flex: 1, display: 'flex' }}>
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            onSelect={handleTextSelect}
            style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: 'none', padding: 20, resize: 'none', fontSize: 14, lineHeight: 1.8, fontFamily: 'monospace' }}
            placeholder="شروع به نوشتن کنید..."
          />
          <div style={{ flex: 1, background: '#1a1a2e', padding: 20, overflow: 'auto', color: '#e2e8f0', borderLeft: '1px solid #334155' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>پیش‌نمایش</div>
            <div dangerouslySetInnerHTML={{ __html: renderedContent }} style={{ lineHeight: 1.8 }} />
          </div>
        </div>
        
        {/* Version History Popup */}
        <AnimatePresence>
          {showVersionHistory && (
            <motion.div style={{ position: 'absolute', top: 50, right: 10, background: '#1e293b', borderRadius: 12, padding: 16, width: 300, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h4 style={{ color: 'white', marginBottom: 10 }}><FaHistory /> تاریخچه نسخه‌ها</h4>
              {versions.map(v => (
                <div key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{v.date}</div>
                  <div style={{ color: 'white', fontSize: 13 }}>{v.changes}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>توسط {v.author}</div>
                  <button onClick={() => toast.info('نسخه بازیابی شد')} style={{ marginTop: 4, padding: '4px 8px', borderRadius: 4, background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11 }}>بازیابی</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div style={{ width: 350, background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}
            initial={{ width: 0, opacity: 0 }} animate={{ width: 350, opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
            <div style={{ padding: 16, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'white' }}>نظرات ({comments.length})</h4>
              <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {comments.map(c => (
                <div key={c.id} style={{ marginBottom: 16, padding: 12, background: '#0f172a', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{c.author}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(c.timestamp).toLocaleTimeString('fa-IR')}</span>
                    <button onClick={() => handleResolveComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.resolved ? '#10b981' : '#94a3b8' }}><FaCheck size={12} /></button>
                  </div>
                  {c.selectedText && <div style={{ background: '#334155', padding: '4px 8px', borderRadius: 4, fontSize: 12, color: '#fbbf24', marginBottom: 6 }}>"{c.selectedText}"</div>}
                  <p style={{ color: '#e2e8f0', fontSize: 13 }}>{c.text}</p>
                  {c.replies.map(r => (
                    <div key={r.id} style={{ margin: '6px 0 0 16px', padding: '6px 8px', background: '#1e293b', borderRadius: 4, fontSize: 12, color: '#cbd5e1' }}>
                      <strong>{r.author}: </strong>{r.text}
                    </div>
                  ))}
                  <input placeholder="پاسخ..." onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { handleReplyToComment(c.id, e.target.value); e.target.value = ''; } }}
                    style={{ width: '100%', marginTop: 8, padding: '6px 8px', borderRadius: 4, border: 'none', background: '#1e293b', color: 'white', fontSize: 12 }} />
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #334155', display: 'flex', gap: 8 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="نظر جدید..." onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontSize: 13 }} />
              <button onClick={handleAddComment} style={{ padding: '8px 12px', borderRadius: 8, background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer' }}><FaPaperPlane /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== ۵. MEETING SCHEDULER ====================
const MeetingScheduler = ({ collaborators, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [meetingType, setMeetingType] = useState('voice');
  const [reminders, setReminders] = useState(['15min']);
  const [connectToCalendar, setConnectToCalendar] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const timeSlots = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const durationOptions = [15, 30, 45, 60, 90, 120];
  
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const today = new Date();
  
  const handleSchedule = () => {
    if (!title) { toast.error('عنوان جلسه الزامی است'); return; }
    if (selectedParticipants.length === 0) { toast.error('حداقل یک شرکت‌کننده انتخاب کنید'); return; }
    toast.success('✅ جلسه برنامه‌ریزی شد');
    setShowSuccess(true);
  };
  
  if (showSuccess) {
    return (
      <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div style={{ background: '#1e293b', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 400 }}
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <FaCalendarCheck size={64} color="#10b981" />
          <h3 style={{ color: 'white', marginTop: 20 }}>جلسه برنامه‌ریزی شد!</h3>
          <div style={{ color: '#94a3b8', marginTop: 15, textAlign: 'right' }}>
            <p><strong>عنوان:</strong> {title}</p>
            <p><strong>تاریخ:</strong> {selectedDate.toLocaleDateString('fa-IR')}</p>
            <p><strong>ساعت:</strong> {selectedTime}</p>
            <p><strong>مدت:</strong> {duration} دقیقه</p>
            <p><strong>شرکت‌کنندگان:</strong> {selectedParticipants.length} نفر</p>
          </div>
          {connectToCalendar && <p style={{ color: '#34a853', fontSize: 14, marginTop: 10 }}><FaGoogle /> به Google Calendar اضافه شد</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 8, background: '#334155', border: 'none', color: 'white', cursor: 'pointer' }}>بستن</button>
            <button onClick={() => toast.success('📧 دعوت‌نامه ارسال شد')} style={{ padding: '10px 24px', borderRadius: 8, background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer' }}><FaEnvelope /> ارسال دعوت‌نامه</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div style={{ background: '#1e293b', borderRadius: 20, padding: 30, maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: 'white' }}><FaCalendarPlus /> برنامه‌ریزی جلسه جدید</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FaTimes /></button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
          {/* Left - Form */}
          <div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 5 }}>عنوان جلسه *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: بررسی عملکرد ماهانه"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f172a', border: 'none', color: 'white', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 5 }}>توضیحات</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات جلسه..." rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0f172a', border: 'none', color: 'white', fontSize: 14, resize: 'vertical' }} />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 5 }}>نوع جلسه</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: 'voice', i: <FaMicrophone size={14} />, l: 'صوتی' }, { v: 'video', i: <BiSolidVideo size={14} />, l: 'تصویری' }, { v: 'hybrid', i: <FaDesktop size={14} />, l: 'ترکیبی' }].map(t => (
                  <button key={t.v} onClick={() => setMeetingType(t.v)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: meetingType === t.v ? '#3b82f6' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                    {t.i} {t.l}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 5 }}>مدت زمان</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {durationOptions.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: duration === d ? '#3b82f6' : '#334155', color: 'white', fontSize: 13 }}>{d} دقیقه</button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 5 }}>یادآوری</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[{ v: '5min', l: '۵ دقیقه قبل' }, { v: '15min', l: '۱۵ دقیقه قبل' }, { v: '30min', l: '۳۰ دقیقه قبل' }, { v: '1hour', l: '۱ ساعت قبل' }].map(r => (
                  <label key={r.v} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={reminders.includes(r.v)} onChange={() => setReminders(prev => prev.includes(r.v) ? prev.filter(x => x !== r.v) : [...prev, r.v])} />
                    {r.l}
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <button onClick={() => { setConnectToCalendar(!connectToCalendar); if (!connectToCalendar) toast.success('📅 به Google Calendar متصل شد'); }}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: connectToCalendar ? '#34a853' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                <FaGoogle /> {connectToCalendar ? 'متصل شد ✓' : 'اتصال به Google Calendar'}
              </button>
            </div>
          </div>
          
          {/* Right - Calendar & Participants */}
          <div>
            {/* Mini Calendar */}
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 8 }}>انتخاب تاریخ</label>
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>◀</button>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {selectedDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>▶</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>
                  {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = day === selectedDate.getDate();
                    return (
                      <button key={day} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                        style={{ padding: '4px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                          background: isSelected ? '#3b82f6' : 'transparent', color: isToday ? '#fbbf24' : isSelected ? 'white' : '#e2e8f0' }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Time Slots */}
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 8 }}>انتخاب ساعت</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {timeSlots.map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    style={{ padding: '6px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                      background: selectedTime === t ? '#3b82f6' : '#334155', color: 'white' }}>{t}</button>
                ))}
              </div>
            </div>
            
            {/* Participants */}
            <div style={{ marginBottom: 15 }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 8 }}>شرکت‌کنندگان ({selectedParticipants.length})</label>
              <div style={{ maxHeight: 150, overflow: 'auto', background: '#0f172a', borderRadius: 8, padding: 8 }}>
                {collaborators.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <input type="checkbox" checked={selectedParticipants.includes(c.id)} onChange={() => setSelectedParticipants(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} />
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}>{c.name[0]}</div>
                    <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{c.name}</span>
                    <span>{c.presence === 'online' ? '🟢' : c.presence === 'idle' ? '🟡' : '⚫'}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button onClick={handleSchedule} disabled={!title || selectedParticipants.length === 0}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: (!title || selectedParticipants.length === 0) ? '#475569' : '#3b82f6', color: 'white', fontSize: 15, fontWeight: 'bold' }}>
              <FaCalendarCheck /> برنامه‌ریزی جلسه
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== MAIN COLLABORATION PANEL (نسخه کامل) ====================
const AdminCollaborationPanelUltra = ({ onClose, collaborators: initialCollabs }) => {
  // ============ DATA ============
  const PRESENCE_STATUS = { ONLINE: 'online', IDLE: 'idle', BUSY: 'busy', OFFLINE: 'offline' };
  
  const initialCollaborators = initialCollabs || [
    { id: 'user-1', name: 'ادمین اصلی', role: 'مدیر سیستم', presence: 'online', color: '#3b82f6', currentView: '/admin/dashboard', cursor: { x: 450, y: 320 }, avatar: null, isTyping: false, isMuted: false },
    { id: 'user-2', name: 'مدیر آموزش', role: 'مدیر', presence: 'online', color: '#10b981', currentView: '/admin/users', cursor: { x: 200, y: 150 }, avatar: null, isTyping: false, isMuted: true },
    { id: 'user-3', name: 'پشتیبان فنی', role: 'پشتیبانی', presence: 'idle', color: '#f59e0b', currentView: '/admin/support', cursor: { x: 0, y: 0 }, avatar: null, isTyping: false },
    { id: 'user-4', name: 'مدیر محتوا', role: 'مدیر', presence: 'offline', color: '#8b5cf6', currentView: '/admin/cms', cursor: { x: 0, y: 0 }, avatar: null },
    { id: 'user-5', name: 'طراح گرافیک', role: 'طراح', presence: 'online', color: '#ec4899', currentView: '/admin/media', cursor: { x: 600, y: 400 }, avatar: null, isTyping: true }
  ];
  
  const initialMessages = [
    { id: 'msg-1', userId: 'user-2', text: 'سلام، من در حال بررسی کاربران جدید هستم', timestamp: '2024-01-15T10:30:00', type: 'text', edited: false, reactions: [] },
    { id: 'msg-2', userId: 'user-1', text: 'عالیه! لطفاً کاربرانی که امروز ثبت‌نام کردن رو تایید کن', timestamp: '2024-01-15T10:31:00', type: 'text', edited: false, reactions: [{ emoji: '👍', users: ['user-3'] }] },
    { id: 'msg-3', userId: 'user-3', text: 'من چند تا تیکت پشتیبانی جدید دارم', timestamp: '2024-01-15T10:32:00', type: 'text', edited: false, reactions: [] },
    { id: 'msg-4', userId: 'user-2', text: 'بله حتماً، بفرستید', timestamp: '2024-01-15T10:33:00', type: 'text', edited: false, reactions: [] },
    { id: 'msg-5', userId: 'system', text: 'کاربر "طراح گرافیک" به پنل پیوست', timestamp: '2024-01-15T10:35:00', type: 'system', edited: false, reactions: [] }
  ];
  
  const initialLocks = [
    { resourceId: '/admin/settings', lockedBy: 'user-1', lockedAt: new Date().toISOString(), reason: 'تنظیمات حساس' },
    { resourceId: '/admin/database', lockedBy: 'user-2', lockedAt: new Date(Date.now() - 3600000).toISOString(), reason: 'به‌روزرسانی دیتابیس' }
  ];
  
  // ============ STATE ============
  const [collaborators] = useState(initialCollaborators);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [locks] = useState(initialLocks);
  const [showUserMenu, setShowUserMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // NEW: Additional features state
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showCollaborativeEditor, setShowCollaborativeEditor] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userStatus, setUserStatus] = useState('online');
  
  // ============ REFS ============
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // ============ EFFECTS ============
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  
  // ============ HELPERS ============
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const getPresenceColor = (p) => ({ online: '#10b981', idle: '#f59e0b', busy: '#ef4444', offline: '#6b7280' }[p] || '#6b7280');
  const getPresenceLabel = (p) => ({ online: 'آنلاین', idle: 'غیرفعال', busy: 'مشغول', offline: 'آفلاین' }[p] || 'آفلاین');
  
  // ============ HANDLERS ============
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, { id: `msg-${Date.now()}`, userId: 'user-1', text: newMessage, timestamp: new Date().toISOString(), type: 'text', edited: false, reactions: [], replyTo: replyTo?.id || null }]);
    setNewMessage('');
    setReplyTo(null);
  };
  
  const handleAddReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const existing = m.reactions?.find(r => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes('user-1')) return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, users: r.users.filter(u => u !== 'user-1') } : r).filter(r => r.users.length > 0) };
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, users: [...r.users, 'user-1'] } : r) };
      }
      return { ...m, reactions: [...(m.reactions || []), { emoji, users: ['user-1'] }] };
    }));
    setShowReactionPicker(null);
  };
  
  const handleEditMessage = (msgId, newText) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: newText, edited: true } : m));
    setEditingMessage(null);
  };
  
  const handleDeleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };
  
  const handleLockResource = (resourceId) => {
    toast.success(locks.find(l => l.resourceId === resourceId) ? '🔓 قفل باز شد' : '🔒 صفحه قفل شد');
  };
  
  const handleShareView = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('📋 لینک کپی شد');
  };
  
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, userId: 'user-1', text: `📎 ${file.name}`, timestamp: new Date().toISOString(), type: 'file', edited: false, reactions: [] }]);
    });
    toast.success(`${acceptedFiles.length} فایل ارسال شد`);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });
  
  // ============ FILTERS ============
  const filteredCollaborators = collaborators.filter(c => !searchUserQuery || c.name.toLowerCase().includes(searchUserQuery.toLowerCase()));
  const onlineCount = collaborators.filter(c => c.presence === 'online').length;
  
  // ============ RENDER ============
  return (
    <motion.div 
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: '#0f172a', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30 }}
    >
      {/* ============ REMOTE CURSORS ============ */}
      <RemoteCursors collaborators={collaborators} currentUserId="user-1" />
      
      {/* ============ HEADER ============ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaUsers size={20} color="#6C5CE7" />
          <div>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>همکاری گروهی</span>
            <span style={{ color: '#94a3b8', fontSize: 11, display: 'block' }}>{onlineCount} آنلاین</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Quick Action Buttons */}
          <button onClick={() => setShowVoiceChat(true)} title="چت صوتی" style={{ padding: 6, borderRadius: 8, background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaMicrophone size={14} /></button>
          <button onClick={() => setShowWhiteboard(true)} title="وایت‌بورد" style={{ padding: 6, borderRadius: 8, background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><MdDraw size={14} /></button>
          <button onClick={() => setShowCollaborativeEditor(true)} title="ویرایشگر مشترک" style={{ padding: 6, borderRadius: 8, background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaEdit size={14} /></button>
          <button onClick={() => setShowMeetingScheduler(true)} title="برنامه‌ریزی جلسه" style={{ padding: 6, borderRadius: 8, background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaCalendarPlus size={14} /></button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
        </div>
      </div>
      
      {/* ============ TABS ============ */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
        {[
          { id: 'users', icon: <FaUsers size={14} />, label: 'کاربران', count: onlineCount },
          { id: 'chat', icon: <FaComments size={14} />, label: 'گفتگو', count: messages.length },
          { id: 'locks', icon: <FaLock size={14} />, label: 'قفل‌ها', count: locks.length }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: '10px', background: activeTab === tab.id ? '#1e293b' : 'transparent', border: 'none', color: activeTab === tab.id ? '#6C5CE7' : '#94a3b8', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {tab.icon} {tab.label}
            {tab.count > 0 && <span style={{ background: '#6C5CE7', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{tab.count}</span>}
          </button>
        ))}
      </div>
      
      {/* ============ CONTENT ============ */}
      <div style={{ flex: 1, overflow: 'auto' }} {...getRootProps()}>
        <input {...getInputProps()} />
        
        {/* Drag overlay */}
        {isDragActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(108,92,231,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <FaPaperclip size={40} color="#6C5CE7" />
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {/* === USERS TAB === */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ padding: '10px 16px' }}>
                <input type="text" placeholder="جستجوی کاربر..." value={searchUserQuery} onChange={e => setSearchUserQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: 'white', fontSize: 13 }} />
              </div>
              
              {['online', 'idle', 'offline'].map(status => {
                const users = filteredCollaborators.filter(c => c.presence === status);
                if (users.length === 0) return null;
                return (
                  <div key={status} style={{ marginBottom: 16 }}>
                    <h4 style={{ padding: '8px 16px', color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getPresenceColor(status), marginRight: 6 }} />
                      {getPresenceLabel(status)} — {users.length}
                    </h4>
                    {users.map(user => (
                      <motion.div key={user.id} whileHover={{ x: 4, background: 'rgba(255,255,255,0.05)' }}
                        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                          {getInitials(user.name)}
                          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: getPresenceColor(user.presence), border: '2px solid #0f172a' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'white', fontSize: 14 }}>{user.name}</span>
                            {user.id === 'user-1' && <FaCrown size={10} color="#fbbf24" />}
                            {user.isTyping && <span style={{ color: '#10b981', fontSize: 10 }}>در حال تایپ...</span>}
                          </div>
                          <span style={{ color: '#64748b', fontSize: 11 }}>{user.role}</span>
                        </div>
                        <FaEllipsisV size={12} color="#64748b" style={{ cursor: 'pointer' }}
                          onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)} />
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </motion.div>
          )}
          
          {/* === CHAT TAB === */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {messages.map(msg => {
                  if (msg.userId === 'system') return (
                    <div key={msg.id} style={{ textAlign: 'center', color: '#64748b', fontSize: 11, margin: '8px 0' }}>
                      {msg.text} • {new Date(msg.timestamp).toLocaleTimeString('fa-IR')}
                    </div>
                  );
                  
                  const user = collaborators.find(c => c.id === msg.userId);
                  const isMe = msg.userId === 'user-1';
                  
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', gap: 8, marginBottom: 12, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      {!isMe && <div style={{ width: 28, height: 28, borderRadius: '50%', background: user?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, flexShrink: 0 }}>{getInitials(user?.name)}</div>}
                      <div style={{ maxWidth: '70%' }}>
                        {!isMe && <span style={{ color: '#94a3b8', fontSize: 10, display: 'block', marginBottom: 2 }}>{user?.name}</span>}
                        <div style={{ padding: '8px 12px', borderRadius: 12, background: isMe ? '#6C5CE7' : '#1e293b', color: 'white', fontSize: 13, wordBreak: 'break-word' }}>
                          {editingMessage === msg.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input value={msg.text} onChange={e => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: e.target.value } : m))}
                                onKeyDown={e => { if (e.key === 'Enter') handleEditMessage(msg.id, msg.text); if (e.key === 'Escape') setEditingMessage(null); }}
                                style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: 'none', background: 'white', color: 'black', fontSize: 12 }} autoFocus />
                              <button onClick={() => handleEditMessage(msg.id, msg.text)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}><FaCheck size={12} /></button>
                              <button onClick={() => setEditingMessage(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><FaTimes size={12} /></button>
                            </div>
                          ) : (
                            <span>{msg.text} {msg.edited && <small style={{ color: '#94a3b8' }}>(ویرایش شده)</small>}</span>
                          )}
                        </div>
                        
                        {/* Reactions */}
                        {msg.reactions?.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                            {msg.reactions.map(r => (
                              <span key={r.emoji} onClick={() => handleAddReaction(msg.id, r.emoji)}
                                style={{ padding: '2px 6px', borderRadius: 10, background: '#1e293b', fontSize: 12, cursor: 'pointer' }}>{r.emoji} {r.users.length}</span>
                            ))}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => { if (!editingMessage) e.currentTarget.style.opacity = 1; }} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          <button onClick={() => setReplyTo(msg)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><FaReply size={10} /></button>
                          {isMe && <button onClick={() => setEditingMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><FaEdit size={10} /></button>}
                          {isMe && <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><FaTrash size={10} /></button>}
                          <button onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><FaSmile size={10} /></button>
                        </div>
                        <span style={{ color: '#64748b', fontSize: 9 }}>{new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Reply Bar */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    style={{ padding: '6px 16px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}><FaReply size={10} /> پاسخ به {collaborators.find(c => c.id === replyTo.userId)?.name}</span>
                    <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><FaTimes size={10} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Input */}
              <div style={{ padding: 12, display: 'flex', gap: 8, borderTop: '1px solid #1e293b' }}>
                <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaSmile /></button>
                <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="پیام..." rows={1} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: 'white', fontSize: 13, resize: 'none' }} />
                <button onClick={handleSendMessage} disabled={!newMessage.trim()} style={{ padding: '8px 12px', borderRadius: 8, background: '#6C5CE7', border: 'none', color: 'white', cursor: 'pointer', opacity: newMessage.trim() ? 1 : 0.5 }}><FaPaperPlane /></button>
              </div>
              
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div style={{ position: 'absolute', bottom: 60, left: 10 }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                    <EmojiPicker onEmojiClick={(e) => { setNewMessage(prev => prev + e.emoji); inputRef.current?.focus(); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* === LOCKS TAB === */}
          {activeTab === 'locks' && (
            <motion.div key="locks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 16 }}>
              <button onClick={() => handleLockResource(window.location.pathname)}
                style={{ width: '100%', padding: 10, borderRadius: 8, marginBottom: 16, background: locks.find(l => l.resourceId === window.location.pathname) ? '#ef4444' : '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {locks.find(l => l.resourceId === window.location.pathname) ? <><FaUnlock /> باز کردن قفل این صفحه</> : <><FaLock /> قفل کردن این صفحه</>}
              </button>
              
              {locks.map(lock => {
                const user = collaborators.find(c => c.id === lock.lockedBy);
                return (
                  <motion.div key={lock.resourceId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    style={{ padding: 12, background: '#1e293b', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <FaLock color="#f59e0b" size={12} />
                      <span style={{ color: '#e2e8f0', fontSize: 13, wordBreak: 'break-all' }}>{lock.resourceId}</span>
                    </div>
                    {lock.reason && <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{lock.reason}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: user?.color, fontSize: 11 }}>{user?.name}</span>
                      <span style={{ color: '#64748b', fontSize: 10 }}>{new Date(lock.lockedAt).toLocaleTimeString('fa-IR')}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* ============ MODALS ============ */}
      <AnimatePresence>
        {showVoiceChat && (
          <VoiceChat 
            participants={collaborators.filter(c => c.id !== 'user-1' && c.presence === 'online')} 
            onClose={() => setShowVoiceChat(false)} 
          />
        )}
        {showWhiteboard && (
          <Whiteboard 
            collaborators={collaborators.filter(c => c.presence === 'online')} 
            onClose={() => setShowWhiteboard(false)} 
          />
        )}
        {showCollaborativeEditor && (
          <CollaborativeEditor 
            collaborators={collaborators.filter(c => c.presence === 'online')} 
            document={{ title: 'سند مشترک', content: '## به ویرایشگر مشترک خوش آمدید!\n\nاین یک سند collaborative است.\n\n- همه می‌توانند همزمان ویرایش کنند\n- تغییرات real-time است\n- می‌توانید نظر بگذارید' }}
            onClose={() => setShowCollaborativeEditor(false)} 
          />
        )}
        {showMeetingScheduler && (
          <MeetingScheduler 
            collaborators={collaborators} 
            onClose={() => setShowMeetingScheduler(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminCollaborationPanelUltra;
export { RemoteCursors, VoiceChat, Whiteboard, CollaborativeEditor, MeetingScheduler };
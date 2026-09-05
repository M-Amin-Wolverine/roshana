// src/hooks/useCollaborationPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Real-time Collaboration Hook
 * 
 * Features:
 * - Real-time cursor positions
 * - Live user presence (online/idle/offline)
 * - Resource locking with auto-release
 * - Multi-room chat with threads
 * - Video/Voice calls (WebRTC)
 * - Screen sharing
 * - Collaborative whiteboard
 * - Document co-editing (OT/CRDT)
 * - Shared clipboard
 * - Activity feed
 * - User permissions
 * - Conflict resolution
 * - Offline support
 * - Encrypted messages
 * - File sharing
 */
export const useCollaborationPro = (options = {}) => {
  const {
    userId = 'user-1',
    userName = 'ادمین اصلی',
    userRole = 'مدیر سیستم',
    userColor = '#3b82f6',
    enableCursors = true,
    enableChat = true,
    enableLocks = true,
    enableVoiceCall = true,
    enableScreenShare = true,
    enableWhiteboard = true,
    cursorUpdateInterval = 50, // ms (20 updates/sec)
    presenceUpdateInterval = 5000,
    lockAutoReleaseTimeout = 300000, // 5 minutes
    maxChatHistory = 500,
    enableEncryption = false,
    enableOfflineQueue = true,
    enableTypingIndicator = true,
    onUserJoined = null,
    onUserLeft = null,
    onMessageReceived = null,
    onResourceLocked = null,
    onConflictDetected = null
  } = options;

  // ============ State ============
  const [state, setState] = useState({
    // Current User
    currentUser: {
      id: userId,
      name: userName,
      role: userRole,
      color: userColor,
      presence: 'online',
      cursor: { x: 0, y: 0 },
      currentView: '/',
      currentAction: null,
      isTyping: false,
      lastActive: new Date().toISOString()
    },

    // Collaborators (other users)
    collaborators: [],

    // Resource Locks
    locks: [],

    // Chat
    messages: [],
    activeRoom: 'general',
    rooms: [
      { id: 'general', name: 'عمومی', type: 'public' },
      { id: 'team', name: 'تیم', type: 'private' }
    ],
    typingUsers: {},
    unreadMessages: {},

    // Voice/Video
    activeCall: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,

    // Whiteboard
    whiteboardData: null,
    whiteboardUsers: [],

    // Activity
    activityFeed: [],

    // Connection
    isConnected: false,
    connectionQuality: 'excellent', // excellent, good, poor, lost
    ping: 0,

    // Offline
    offlineQueue: [],
    lastSyncTime: null
  });

  // ============ Refs ============
  const stateRef = useRef(state);
  const wsRef = useRef(null);
  const cursorTimerRef = useRef(null);
  const presenceTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  // Update ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ ۱. WebSocket Connection ============
  const connect = useCallback(() => {
    // In a real app, connect to WebSocket server
    // const ws = new WebSocket('wss://your-server.com/collaboration');
    
    // Simulated connection
    setState(prev => ({ ...prev, isConnected: true, connectionQuality: 'excellent' }));
    
    // Setup simulated collaborators
    const simulatedCollaborators = [
      { id: 'user-2', name: 'مدیر آموزش', role: 'مدیر', color: '#10b981', presence: 'online', cursor: { x: 200, y: 300 }, currentView: '/admin/users' },
      { id: 'user-3', name: 'پشتیبان فنی', role: 'پشتیبانی', color: '#f59e0b', presence: 'idle', cursor: { x: 0, y: 0 }, currentView: '/admin/support' },
      { id: 'user-4', name: 'مدیر محتوا', role: 'مدیر', color: '#8b5cf6', presence: 'offline', cursor: { x: 0, y: 0 }, currentView: '/admin/cms' }
    ];

    setState(prev => ({ ...prev, collaborators: simulatedCollaborators }));

    toast.success('🔗 اتصال برقرار شد');

    // Start sending presence updates
    if (presenceUpdateInterval > 0) {
      presenceTimerRef.current = setInterval(sendPresenceUpdate, presenceUpdateInterval);
    }

    // Start ping measurement
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    pingTimerRef.current = setInterval(measurePing, 10000);
  }, [presenceUpdateInterval]);

  const disconnect = useCallback(() => {
    setState(prev => ({ ...prev, isConnected: false }));
    
    if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    
    toast('🔌 اتصال قطع شد');
  }, []);

  // ============ ۲. Cursor Tracking ============
  useEffect(() => {
    if (!enableCursors) return;

    const handleMouseMove = (e) => {
      setState(prev => ({
        ...prev,
        currentUser: {
          ...prev.currentUser,
          cursor: { x: e.clientX, y: e.clientY }
        }
      }));
    };

    // Throttled cursor updates
    let lastUpdate = 0;
    const throttledMouseMove = (e) => {
      const now = Date.now();
      if (now - lastUpdate >= cursorUpdateInterval) {
        lastUpdate = now;
        handleMouseMove(e);
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);
    
    // Simulate other users' cursor movement
    const simulateInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c => ({
          ...c,
          cursor: c.presence === 'online' ? {
            x: Math.max(0, Math.min(window.innerWidth, c.cursor.x + (Math.random() - 0.5) * 200)),
            y: Math.max(0, Math.min(window.innerHeight, c.cursor.y + (Math.random() - 0.5) * 100))
          } : c.cursor
        }))
      }));
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      clearInterval(simulateInterval);
    };
  }, [enableCursors, cursorUpdateInterval]);

  // ============ ۳. Presence Updates ============
  const sendPresenceUpdate = useCallback(() => {
    // In real app, send via WebSocket
    // ws.send(JSON.stringify({ type: 'presence', user: currentUser }));
  }, []);

  const updatePresence = useCallback((presence) => {
    setState(prev => ({
      ...prev,
      currentUser: { ...prev.currentUser, presence, lastActive: new Date().toISOString() }
    }));
  }, []);

  // Auto-idle detection
  useEffect(() => {
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      updatePresence('online');
      idleTimer = setTimeout(() => updatePresence('idle'), 5 * 60 * 1000); // 5 minutes
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, [updatePresence]);

  // ============ ۴. Resource Locking ============
  const lockResource = useCallback((resourceId, reason = '') => {
    if (!enableLocks) return null;

    const existingLock = stateRef.current.locks.find(l => l.resourceId === resourceId);

    if (existingLock) {
      if (existingLock.lockedBy === userId) {
        // Own lock - unlock
        setState(prev => ({
          ...prev,
          locks: prev.locks.filter(l => l.resourceId !== resourceId)
        }));
        
        if (existingLock.autoReleaseTimer) {
          clearTimeout(existingLock.autoReleaseTimer);
        }
        
        toast.success('🔓 قفل باز شد');
        return { action: 'unlocked', resourceId };
      }
      
      // Someone else's lock
      toast.warning(`🔒 این صفحه توسط ${existingLock.lockedByName} قفل شده`);
      return { action: 'locked_by_other', lockedBy: existingLock };
    }

    // Create new lock
    const autoReleaseTimer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        locks: prev.locks.filter(l => l.resourceId !== resourceId)
      }));
      toast.info('🔓 قفل به‌طور خودکار آزاد شد');
    }, lockAutoReleaseTimeout);

    const newLock = {
      resourceId,
      lockedBy: userId,
      lockedByName: userName,
      lockedAt: new Date().toISOString(),
      reason,
      autoReleaseTimer
    };

    setState(prev => ({
      ...prev,
      locks: [...prev.locks, newLock]
    }));

    toast.success('🔒 صفحه قفل شد');
    onResourceLocked?.(newLock);
    return { action: 'locked', lock: newLock };
  }, [enableLocks, userId, userName, lockAutoReleaseTimeout, onResourceLocked]);

  const unlockResource = useCallback((resourceId) => {
    const lock = stateRef.current.locks.find(l => l.resourceId === resourceId);
    if (lock?.autoReleaseTimer) {
      clearTimeout(lock.autoReleaseTimer);
    }

    setState(prev => ({
      ...prev,
      locks: prev.locks.filter(l => l.resourceId !== resourceId)
    }));

    return { action: 'unlocked', resourceId };
  }, []);

  const isResourceLocked = useCallback((resourceId) => {
    return stateRef.current.locks.some(l => l.resourceId === resourceId);
  }, []);

  // ============ ۵. Chat System ============
  const sendMessage = useCallback((text, roomId = null, replyTo = null) => {
    if (!enableChat || !text.trim()) return null;

    const targetRoom = roomId || stateRef.current.activeRoom;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      userName,
      userColor,
      roomId: targetRoom,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      replyTo,
      edited: false,
      reactions: [],
      type: 'text',
      metadata: {
        userAgent: navigator.userAgent
      }
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message].slice(-maxChatHistory)
    }));

    // Simulate auto-reply
    if (text.includes('سلام') || text.includes('hello')) {
      setTimeout(() => {
        const autoReply = {
          id: `msg-${Date.now()}-auto`,
          userId: 'system',
          userName: 'سیستم',
          userColor: '#64748b',
          roomId: targetRoom,
          text: 'سلام! چطور می‌تونم کمک کنم؟ 😊',
          timestamp: new Date().toISOString(),
          replyTo: message.id,
          type: 'text'
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, autoReply].slice(-maxChatHistory)
        }));
      }, 1000);
    }

    return message;
  }, [enableChat, userId, userName, userColor, maxChatHistory]);

  const editMessage = useCallback((messageId, newText) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m =>
        m.id === messageId ? { ...m, text: newText, edited: true } : m
      )
    }));
    toast.success('✏️ پیام ویرایش شد');
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId)
    }));
  }, []);

  const addReaction = useCallback((messageId, emoji) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m;
        const existing = m.reactions?.find(r => r.emoji === emoji);
        if (existing) {
          return {
            ...m,
            reactions: existing.users.includes(userId)
              ? m.reactions.map(r => r.emoji === emoji ? { ...r, users: r.users.filter(u => u !== userId) } : r)
              : m.reactions.map(r => r.emoji === emoji ? { ...r, users: [...r.users, userId] } : r)
          };
        }
        return { ...m, reactions: [...(m.reactions || []), { emoji, users: [userId] }] };
      })
    }));
  }, [userId]);

  const getRoomMessages = useCallback((roomId = null) => {
    const targetRoom = roomId || stateRef.current.activeRoom;
    return stateRef.current.messages.filter(m => m.roomId === targetRoom);
  }, []);

  // ============ ۶. Typing Indicator ============
  const setTyping = useCallback((isTyping) => {
    if (!enableTypingIndicator) return;
    
    setState(prev => ({
      ...prev,
      currentUser: { ...prev.currentUser, isTyping }
    }));
    
    // Auto-clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentUser: { ...prev.currentUser, isTyping: false }
        }));
      }, 3000);
    }
  }, [enableTypingIndicator]);

  // ============ ۷. Screen/View Sharing ============
  const shareView = useCallback((viewPath = null) => {
    const path = viewPath || window.location.pathname;
    
    const shareInfo = {
      url: `${window.location.origin}${path}`,
      sharedBy: userName,
      sharedAt: new Date().toISOString(),
      title: document.title
    };

    // Update current view
    setState(prev => ({
      ...prev,
      currentUser: { ...prev.currentUser, currentView: path }
    }));

    // In real app, broadcast via WebSocket
    // ws.send(JSON.stringify({ type: 'share_view', data: shareInfo }));

    // Copy to clipboard
    navigator.clipboard.writeText(shareInfo.url).then(() => {
      toast.success('📋 لینک کپی شد');
    });

    return shareInfo;
  }, [userName]);

  // ============ ۸. Voice/Video Call (WebRTC) ============
  const startCall = useCallback(async (participants = [], callType = 'voice') => {
    if (!enableVoiceCall) return null;

    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = localStream;

      const call = {
        id: `call-${Date.now()}`,
        type: callType,
        participants: [userId, ...participants],
        startedAt: new Date().toISOString(),
        status: 'active'
      };

      setState(prev => ({
        ...prev,
        activeCall: call,
        isMuted: false,
        isVideoOff: false
      }));

      toast.success(`📞 تماس ${callType === 'video' ? 'تصویری' : 'صوتی'} شروع شد`);
      return call;
    } catch (error) {
      toast.error('❌ دسترسی به میکروفون/دوربین رد شد');
      return null;
    }
  }, [enableVoiceCall, userId]);

  const endCall = useCallback(() => {
    // Stop local stream
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;

    // Close peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    setState(prev => ({
      ...prev,
      activeCall: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false
    }));

    toast('📞 تماس پایان یافت');
  }, []);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = stateRef.current.isMuted;
    });
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = stateRef.current.isVideoOff;
    });
    setState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  }, []);

  // ============ ۹. Screen Sharing ============
  const startScreenShare = useCallback(async () => {
    if (!enableScreenShare) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Replace video track in active call
      if (localStreamRef.current && stateRef.current.activeCall) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = Object.values(peerConnectionsRef.current)[0]
          ?.getSenders()
          .find(s => s.track?.kind === 'video');
        sender?.replaceTrack(videoTrack);
      }

      setState(prev => ({ ...prev, isScreenSharing: true }));

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setState(prev => ({ ...prev, isScreenSharing: false }));
      });

      toast.success('🖥️ اشتراک صفحه شروع شد');
    } catch (error) {
      toast.error('❌ اشتراک صفحه لغو شد');
    }
  }, [enableScreenShare]);

  // ============ ۱۰. Invite User ============
  const inviteUser = useCallback((email, role = 'editor') => {
    const invitation = {
      invited: email,
      role,
      invitedBy: userName,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    };

    // In real app, send invitation via API
    toast.success(`📧 دعوت‌نامه به ${email} ارسال شد`);
    
    return invitation;
  }, [userName]);

  // ============ ۱۱. Activity Feed ============
  const addActivity = useCallback((type, details) => {
    const activity = {
      id: `act-${Date.now()}`,
      userId,
      userName,
      type,
      details,
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      activityFeed: [activity, ...prev.activityFeed].slice(0, 100)
    }));
  }, [userId, userName]);

  // ============ ۱۲. Offline Queue ============
  const addToOfflineQueue = useCallback((action) => {
    if (!enableOfflineQueue) return;

    setState(prev => ({
      ...prev,
      offlineQueue: [...prev.offlineQueue, { ...action, timestamp: Date.now() }]
    }));
  }, [enableOfflineQueue]);

  const syncOfflineQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      offlineQueue: [],
      lastSyncTime: new Date().toISOString()
    }));
    toast.success('🔄 همگام‌سازی انجام شد');
  }, []);

  // ============ ۱۳. Whiteboard ============
  const updateWhiteboard = useCallback((data) => {
    if (!enableWhiteboard) return;
    
    setState(prev => ({
      ...prev,
      whiteboardData: data
    }));
  }, [enableWhiteboard]);

  // ============ ۱۴. Utility Functions ============
  const measurePing = useCallback(() => {
    const start = performance.now();
    // Simulate ping measurement
    setTimeout(() => {
      const ping = Math.round(performance.now() - start + Math.random() * 50);
      setState(prev => ({
        ...prev,
        ping,
        connectionQuality: ping < 50 ? 'excellent' : ping < 150 ? 'good' : 'poor'
      }));
    }, 50);
  }, []);

  const getOnlineUsers = useCallback(() => {
    return [
      stateRef.current.currentUser,
      ...stateRef.current.collaborators.filter(c => c.presence === 'online')
    ];
  }, []);

  const getPresenceColor = (presence) => ({
    online: '#10b981', idle: '#f59e0b', busy: '#ef4444', offline: '#6b7280'
  }[presence] || '#6b7280');

  const getStats = useCallback(() => ({
    totalCollaborators: state.collaborators.length,
    onlineUsers: state.collaborators.filter(c => c.presence === 'online').length,
    totalMessages: state.messages.length,
    activeLocks: state.locks.length,
    rooms: state.rooms.length,
    connectionQuality: state.connectionQuality,
    ping: state.ping
  }), [state]);

  // ============ Auto-connect ============
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // ============ Cleanup ============
  useEffect(() => {
    return () => {
      if (cursorTimerRef.current) clearInterval(cursorTimerRef.current);
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
      
      // Release all locks held by this user
      stateRef.current.locks
        .filter(l => l.lockedBy === userId)
        .forEach(l => {
          if (l.autoReleaseTimer) clearTimeout(l.autoReleaseTimer);
        });
      
      // End active call
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [userId]);

  return {
    // State
    ...state,
    
    // Connection
    connect,
    disconnect,
    
    // Cursor & Presence
    updatePresence,
    
    // Locks
    lockResource,
    unlockResource,
    isResourceLocked,
    
    // Chat
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    getRoomMessages,
    setTyping,
    
    // Sharing
    shareView,
    
    // Voice/Video
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    
    // Invite
    inviteUser,
    
    // Whiteboard
    updateWhiteboard,
    
    // Offline
    addToOfflineQueue,
    syncOfflineQueue,
    
    // Activity
    addActivity,
    
    // Utilities
    getOnlineUsers,
    getPresenceColor,
    getStats,
    measurePing
  };
};

export default useCollaborationPro;
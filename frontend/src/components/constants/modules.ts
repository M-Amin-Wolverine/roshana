// constants/modules.ts
import { Module } from '../types/modules';
export const DEFAULT_MODULES: Module[] = [
  { id: 'courseware', name: 'CourseWare', icon: '📚', required: true, active: true, expiryDate: null },
  { id: 'roshena-sci', name: 'Roshena Sci', icon: '🔬', active: false, expiryDate: null },
  { id: 'live-classes', name: 'Live Classes', icon: '📡', active: true, expiryDate: '2025-06-15' },
  { id: 'meeting', name: 'Meeting Hub', icon: '💼', active: false, expiryDate: null },
  { id: 'connect', name: 'Connect', icon: '🔗', active: true, expiryDate: null },
  { id: 'messenger', name: 'Messenger', icon: '💬', active: true, expiryDate: null },
  { id: 'automation', name: 'Automation', icon: '🤖', active: false, expiryDate: null },
  { id: 'media', name: 'Media Gallery', icon: '🖼️', active: false, expiryDate: null },
  { id: 'poll', name: 'Poll & Survey', icon: '📊', active: true, expiryDate: null },
  { id: 'security', name: 'Security Suite', icon: '🛡️', active: false, expiryDate: null },
  { id: 'storage', name: 'Data Center', icon: '💾', active: false, expiryDate: null },
  { id: 'api', name: 'API Gateway', icon: '🔌', active: false, expiryDate: null }
];
// src/pages/admin/AdminWorkflowManagerPro.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  FaPlus, FaTimes, FaSave, FaTrash, FaEdit,
  FaPlay, FaPause, FaStop, FaCheck, FaClock,
  FaEnvelope, FaBell, FaDatabase, FaCode,
  FaUserPlus, FaBook, FaChartBar, FaCog,
  FaArrowsAlt, FaHistory, FaToggleOn, FaToggleOff,
  FaExclamationTriangle, FaRedo, FaCopy,
  FaHourglass, FaCalendarCheck, FaFilter,
  FaSearch, FaDownload, FaUpload, FaShare,
  FaClone, FaTag, FaLayerGroup, FaProjectDiagram,
  FaEye, FaEyeSlash, FaLock, FaUnlock,
  FaChevronDown, FaChevronUp, FaGripVertical,
  FaInfoCircle, FaQuestionCircle, FaBug,
  FaRunning, FaFlagCheckered, FaStepForward,
  FaUndo, FaCloud, FaSms, FaWhatsapp, FaTelegram,
  FaSlack, FaDiscord, FaChartLine, FaChartPie,
  FaFileExport, FaFileImport, FaFileCode,
  FaCodeBranch, FaRandom, FaMicrochip, FaRobot,
  FaStar, FaRegStar, FaStarHalfAlt,FaClipboardList    // ← اینها را اضافه کنید

} from 'react-icons/fa';
import { LuWorkflow } from 'react-icons/lu';
import { toast } from 'react-hot-toast';

// ==================== Workflow Editor Components ====================

// Visual Flow Editor Component
const FlowEditor = ({ workflow, onChange }) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const canvasRef = useRef(null);
  
  // Convert workflow to visual nodes
  useEffect(() => {
    const newNodes = [];
    let x = 100;
    let y = 200;
    
    // Trigger node
    newNodes.push({
      id: 'trigger',
      type: 'trigger',
      label: TRIGGER_TYPES.find(t => t.value === workflow.trigger)?.label || 'Trigger',
      x: 100,
      y: 200
    });
    
    // Action nodes
    workflow.actions.forEach((action, idx) => {
      newNodes.push({
        id: `action-${idx}`,
        type: 'action',
        label: ACTION_TYPES.find(a => a.value === action.type)?.label || 'Action',
        x: 300 + idx * 200,
        y: 200
      });
    });
    
    setNodes(newNodes);
    
    // Create connections
    const newConnections = [];
    for (let i = 1; i < newNodes.length; i++) {
      newConnections.push({
        from: newNodes[i-1].id,
        to: newNodes[i].id
      });
    }
    setConnections(newConnections);
  }, [workflow]);
  
  return (
    <div className="flow-editor" ref={canvasRef}>
      <svg className="connections-layer">
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <motion.path
              key={idx}
              d={`M ${fromNode.x + 80} ${fromNode.y} 
                  C ${fromNode.x + 180} ${fromNode.y}, 
                    ${toNode.x - 100} ${toNode.y}, 
                    ${toNode.x} ${toNode.y}`}
              stroke="#6C5CE7"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            />
          );
        })}
      </svg>
      
      {nodes.map(node => (
        <motion.div
          key={node.id}
          className={`flow-node ${node.type} ${selectedNode === node.id ? 'selected' : ''}`}
          style={{ left: node.x, top: node.y }}
          drag
          dragMomentum={false}
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedNode(node.id)}
        >
          <div className="node-header">
            <span>{node.type === 'trigger' ? '🔔' : '⚡'}</span>
            <span>{node.label}</span>
          </div>
          <div className="node-ports">
            <div className="port input" />
            <div className="port output" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Condition Builder Component
const ConditionBuilder = ({ conditions, onChange }) => {
  const operators = [
    { value: 'equals', label: 'برابر با' },
    { value: 'not_equals', label: 'نابرابر با' },
    { value: 'contains', label: 'شامل' },
    { value: 'not_contains', label: 'شامل نباشد' },
    { value: 'greater_than', label: 'بزرگتر از' },
    { value: 'less_than', label: 'کوچکتر از' },
    { value: 'between', label: 'بین' },
    { value: 'in', label: 'یکی از' },
    { value: 'not_in', label: 'هیچکدام از' },
    { value: 'regex', label: 'Regex' },
    { value: 'exists', label: 'وجود دارد' },
    { value: 'empty', label: 'خالی است' }
  ];
  
  const addCondition = () => {
    onChange([...conditions, { 
      id: Date.now(),
      field: '', 
      operator: 'equals', 
      value: '',
      logic: 'AND'
    }]);
  };
  
  const updateCondition = (id, updates) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  
  const removeCondition = (id) => {
    onChange(conditions.filter(c => c.id !== id));
  };
  
  const addGroup = () => {
    onChange([...conditions, { id: Date.now(), type: 'group', logic: 'AND', conditions: [] }]);
  };
  
  return (
    <div className="condition-builder">
      {conditions.map((condition, idx) => (
        <div key={condition.id} className="condition-item">
          {idx > 0 && (
            <select 
              value={condition.logic} 
              onChange={(e) => updateCondition(condition.id, { logic: e.target.value })}
              className="logic-select"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          )}
          
          {condition.type === 'group' ? (
            <div className="condition-group">
              <div className="group-header">
                <span>گروه شرطی</span>
                <div>
                  <select value={condition.logic}>
                    <option value="AND">همه (AND)</option>
                    <option value="OR">حداقل یکی (OR)</option>
                  </select>
                  <button onClick={() => removeCondition(condition.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <ConditionBuilder 
                conditions={condition.conditions}
                onChange={(newConditions) => {
                  updateCondition(condition.id, { conditions: newConditions });
                }}
              />
            </div>
          ) : (
            <div className="condition-row">
              <select 
                value={condition.field}
                onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                className="field-select"
              >
                <option value="">انتخاب فیلد...</option>
                <option value="user.email">ایمیل کاربر</option>
                <option value="user.role">نقش کاربر</option>
                <option value="user.created_at">تاریخ ثبت‌نام</option>
                <option value="course.price">قیمت دوره</option>
                <option value="course.category">دسته‌بندی دوره</option>
                <option value="payment.amount">مبلغ پرداخت</option>
                <option value="payment.status">وضعیت پرداخت</option>
                <option value="custom.field1">فیلد سفارشی ۱</option>
                <option value="custom.field2">فیلد سفارشی ۲</option>
              </select>
              
              <select 
                value={condition.operator}
                onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                className="operator-select"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                placeholder="مقدار..."
                className="value-input"
              />
              
              <button onClick={() => removeCondition(condition.id)} className="btn-remove">
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      ))}
      
      <div className="condition-actions">
        <button onClick={addCondition} className="btn-add">
          <FaPlus /> افزودن شرط
        </button>
        <button onClick={addGroup} className="btn-add-group">
          <FaLayerGroup /> افزودن گروه
        </button>
      </div>
    </div>
  );
};

// Template Editor Component
const TemplateEditor = ({ template, onChange }) => {
  const [variables, setVariables] = useState([
    { key: '{{user.name}}', description: 'نام کاربر' },
    { key: '{{user.email}}', description: 'ایمیل کاربر' },
    { key: '{{course.title}}', description: 'عنوان دوره' },
    { key: '{{course.price}}', description: 'قیمت دوره' },
    { key: '{{date.now}}', description: 'تاریخ فعلی' },
    { key: '{{company.name}}', description: 'نام شرکت' },
  ]);
  
  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template;
    const newText = text.substring(0, start) + variable + text.substring(end);
    onChange(newText);
  };
  
  return (
    <div className="template-editor">
      <div className="template-toolbar">
        <button><FaUndo /></button>
        <button><FaRedo /></button>
        <div className="separator" />
        <span>متغیرها:</span>
        <div className="variable-chips">
          {variables.map(v => (
            <button 
              key={v.key} 
              className="variable-chip"
              onClick={() => insertVariable(v.key)}
              title={v.description}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>
      
      <textarea
        id="template-editor"
        value={template}
        onChange={(e) => onChange(e.target.value)}
        placeholder="متن قالب را وارد کنید..."
        className="template-textarea"
      />
      
      <div className="template-preview">
        <h4>پیش‌نمایش</h4>
        <div className="preview-content">
          {template.replace(/\{\{.*?\}\}/g, (match) => {
            const mockData = {
              '{{user.name}}': 'علی محمدی',
              '{{user.email}}': 'ali@example.com',
              '{{course.title}}': 'آموزش React پیشرفته',
              '{{course.price}}': '۴۹۹,۰۰۰ تومان',
              '{{date.now}}': new Date().toLocaleDateString('fa-IR'),
              '{{company.name}}': 'شرکت فرتاک'
            };
            return mockData[match] || match;
          })}
        </div>
      </div>
    </div>
  );
};

// ==================== Enhanced Trigger & Action Types ====================
const TRIGGER_TYPES = [
  { value: 'user_register', label: 'ثبت‌نام کاربر جدید', icon: FaUserPlus, category: 'user' },
  { value: 'user_login', label: 'ورود کاربر', icon: FaUserPlus, category: 'user' },
  { value: 'user_update', label: 'به‌روزرسانی پروفایل', icon: FaEdit, category: 'user' },
  { value: 'user_delete', label: 'حذف کاربر', icon: FaTrash, category: 'user' },
  { value: 'course_enroll', label: 'ثبت‌نام در دوره', icon: FaBook, category: 'course' },
  { value: 'course_complete', label: 'اتمام دوره', icon: FaCheck, category: 'course' },
  { value: 'course_review', label: 'ثبت نظر دوره', icon: FaStar, category: 'course' },
  { value: 'payment_received', label: 'دریافت پرداخت', icon: FaChartBar, category: 'payment' },
  { value: 'payment_failed', label: 'پرداخت ناموفق', icon: FaExclamationTriangle, category: 'payment' },
  { value: 'payment_refund', label: 'بازگشت وجه', icon: FaUndo, category: 'payment' },
  { value: 'ticket_created', label: 'ایجاد تیکت', icon: FaBell, category: 'support' },
  { value: 'ticket_answered', label: 'پاسخ تیکت', icon: FaBell, category: 'support' },
  { value: 'ticket_closed', label: 'بستن تیکت', icon: FaCheck, category: 'support' },
  { value: 'schedule', label: 'زمان‌بندی شده', icon: FaClock, category: 'system' },
  { value: 'database_change', label: 'تغییر در دیتابیس', icon: FaDatabase, category: 'system' },
  { value: 'api_call', label: 'فراخوانی API', icon: FaCode, category: 'system' },
  { value: 'webhook_incoming', label: 'Webhook ورودی', icon: FaArrowsAlt, category: 'system' },
  { value: 'file_uploaded', label: 'آپلود فایل', icon: FaUpload, category: 'system' },
  { value: 'manual', label: 'دستی', icon: FaPlay, category: 'system' }
];

const ACTION_TYPES = [
  { 
    value: 'send_email', 
    label: 'ارسال ایمیل', 
    icon: FaEnvelope, 
    color: '#3b82f6',
    configFields: ['to', 'subject', 'template', 'attachments']
  },
  { 
    value: 'send_sms', 
    label: 'ارسال پیامک', 
    icon: FaSms, 
    color: '#10b981',
    configFields: ['to', 'message']
  },
  { 
    value: 'send_whatsapp', 
    label: 'ارسال واتساپ', 
    icon: FaWhatsapp, 
    color: '#25D366',
    configFields: ['to', 'message', 'template']
  },
  { 
    value: 'send_telegram', 
    label: 'ارسال تلگرام', 
    icon: FaTelegram, 
    color: '#0088cc',
    configFields: ['chat_id', 'message']
  },
  { 
    value: 'send_slack', 
    label: 'ارسال Slack', 
    icon: FaSlack, 
    color: '#4A154B',
    configFields: ['channel', 'message']
  },
  { 
    value: 'send_discord', 
    label: 'ارسال Discord', 
    icon: FaDiscord, 
    color: '#5865F2',
    configFields: ['channel', 'message']
  },
  { 
    value: 'create_notification', 
    label: 'ایجاد اعلان', 
    icon: FaBell, 
    color: '#f59e0b',
    configFields: ['title', 'message', 'type', 'link']
  },
  { 
    value: 'update_database', 
    label: 'به‌روزرسانی دیتابیس', 
    icon: FaDatabase, 
    color: '#8b5cf6',
    configFields: ['table', 'fields', 'where']
  },
  { 
    value: 'run_script', 
    label: 'اجرای اسکریپت', 
    icon: FaCode, 
    color: '#ec4899',
    configFields: ['script', 'language', 'timeout']
  },
  { 
    value: 'run_python', 
    label: 'اجرای Python', 
    icon: FaCode, 
    color: '#3776AB',
    configFields: ['script', 'timeout']
  },
  { 
    value: 'ai_process', 
    label: 'پردازش هوش مصنوعی', 
    icon: FaRobot, 
    color: '#7C3AED',
    configFields: ['prompt', 'model', 'output_field']
  },
  { 
    value: 'assign_role', 
    label: 'تخصیص نقش', 
    icon: FaUserPlus, 
    color: '#06b6d4',
    configFields: ['user_id', 'role']
  },
  { 
    value: 'generate_report', 
    label: 'تولید گزارش', 
    icon: FaChartBar, 
    color: '#14b8a6',
    configFields: ['report_type', 'format', 'email_to']
  },
  { 
    value: 'generate_certificate', 
    label: 'صدور گواهینامه', 
    icon: FaFileCode, 
    color: '#f97316',
    configFields: ['template', 'user_id', 'course_id']
  },
  { 
    value: 'webhook', 
    label: 'Webhook خروجی', 
    icon: FaArrowsAlt, 
    color: '#63666a',
    configFields: ['url', 'method', 'headers', 'body']
  },
  { 
    value: 'delay', 
    label: 'تأخیر', 
    icon: FaClock, 
    color: '#64748b',
    configFields: ['duration', 'unit']
  },
  { 
    value: 'conditional', 
    label: 'شرط', 
    icon: FaCodeBranch, 
    color: '#eab308',
    configFields: ['conditions']
  },
  { 
    value: 'loop', 
    label: 'حلقه', 
    icon: FaRedo, 
    color: '#ef4444',
    configFields: ['iterations', 'collection']
  },
  { 
    value: 'parallel', 
    label: 'موازی', 
    icon: FaRandom, 
    color: '#06b6d4',
    configFields: ['branches']
  },
  { 
    value: 'log', 
    label: 'ثبت لاگ', 
    icon: FaClipboardList, 
    color: '#6b7280',
    configFields: ['message', 'level']
  }
];

// ==================== Enhanced Initial Data ====================
const initialWorkflows = [
  {
    id: 'wf-1',
    name: 'خوش‌آمدگویی کاربر جدید',
    description: 'ارسال ایمیل و اعلان خوش‌آمدگویی به کاربران جدید با تخفیف ویژه',
    trigger: 'user_register',
    conditions: [
      { id: 1, field: 'user.source', operator: 'equals', value: 'website', logic: 'AND' }
    ],
    actions: [
      { 
        type: 'send_email', 
        config: { 
          template: 'welcome_email',
          subject: 'به خانواده ما خوش آمدید! 🎉',
          delay: 0 
        } 
      },
      { 
        type: 'delay', 
        config: { duration: 3600, unit: 'seconds' } 
      },
      { 
        type: 'send_sms', 
        config: { 
          message: '{{user.name}} عزیز، کد تخفیف ۲۰٪ شما: WELCOME20',
          delay: 0 
        } 
      },
      { 
        type: 'assign_role', 
        config: { role: 'new_member' } 
      }
    ],
    enabled: true,
    priority: 'high',
    lastRun: '2024-01-15T10:30:00',
    runCount: 1245,
    successRate: 98.5,
    tags: ['onboarding', 'marketing'],
    version: 2,
    author: 'مدیر سیستم',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-15T10:00:00',
    logs: []
  },
  {
    id: 'wf-2',
    name: 'یادآوری تکمیل دوره',
    description: 'ارسال یادآوری به دانشجویانی که دوره را بیش از ۷ روز نیمه‌کاره رها کرده‌اند',
    trigger: 'schedule',
    conditions: [
      { id: 1, field: 'user.last_activity', operator: 'greater_than', value: '7', logic: 'AND' },
      { id: 2, field: 'course.progress', operator: 'between', value: '10,90', logic: 'AND' }
    ],
    actions: [
      { 
        type: 'send_email', 
        config: { 
          template: 'course_reminder',
          subject: 'دوره‌ات منتظرته! 🎓',
          delay: 0 
        } 
      },
      {
        type: 'conditional',
        config: {
          conditions: [
            { field: 'user.email_opened', operator: 'not_equals', value: 'true' }
          ],
          trueActions: [
            { type: 'send_sms', config: { message: 'یادت نره دوره‌ات رو کامل کنی!' } }
          ]
        }
      }
    ],
    enabled: true,
    priority: 'medium',
    lastRun: '2024-01-15T08:00:00',
    runCount: 892,
    successRate: 95.2,
    tags: ['engagement', 'courses'],
    version: 1,
    author: 'تیم آموزش',
    createdAt: '2024-01-05T00:00:00',
    updatedAt: '2024-01-10T14:00:00',
    logs: []
  },
  {
    id: 'wf-3',
    name: 'صدور گواهینامه هوشمند',
    description: 'صدور خودکار گواهینامه پس از اتمام دوره با نمره قبولی بالای ۷۰',
    trigger: 'course_complete',
    conditions: [
      { id: 1, field: 'course.score', operator: 'greater_than', value: '70', logic: 'AND' },
      { id: 2, field: 'course.type', operator: 'in', value: 'premium,vip', logic: 'AND' }
    ],
    actions: [
      { 
        type: 'generate_certificate', 
        config: { 
          template: 'premium_certificate',
          format: 'pdf' 
        } 
      },
      { 
        type: 'send_email', 
        config: { 
          template: 'certificate',
          attach: true,
          subject: 'گواهینامه شما آماده است! 🏆',
          delay: 0 
        } 
      },
      {
        type: 'create_notification',
        config: {
          title: 'تبریک! 🎉',
          message: 'گواهینامه دوره {{course.title}} صادر شد',
          type: 'success',
          link: '/certificates'
        }
      },
      {
        type: 'ai_process',
        config: {
          prompt: 'یک پیام تبریک شخصی‌سازی شده برای کاربر {{user.name}} بنویس',
          model: 'gpt-4',
          output_field: 'personal_message'
        }
      }
    ],
    enabled: true,
    priority: 'high',
    lastRun: '2024-01-15T11:00:00',
    runCount: 567,
    successRate: 99.1,
    tags: ['certificates', 'courses'],
    version: 3,
    author: 'مدیر سیستم',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-15T09:00:00',
    logs: []
  },
  {
    id: 'wf-4',
    name: 'واکنش به پرداخت ناموفق',
    description: 'ارسال راهنمایی و پیشنهاد ویژه برای کاربران با پرداخت ناموفق',
    trigger: 'payment_failed',
    conditions: [],
    actions: [
      {
        type: 'parallel',
        config: {
          branches: [
            [
              { type: 'send_email', config: { template: 'payment_failed_help' } },
              { type: 'send_sms', config: { message: 'پرداخت ناموفق بود. راهنمایی:' } }
            ],
            [
              { type: 'log', config: { message: 'پرداخت ناموفق کاربر {{user.id}}', level: 'warning' } },
              { type: 'webhook', config: { url: 'https://api.example.com/payment-failed', method: 'POST' } }
            ]
          ]
        }
      }
    ],
    enabled: true,
    priority: 'high',
    lastRun: '2024-01-15T12:00:00',
    runCount: 234,
    successRate: 97.8,
    tags: ['payments', 'support'],
    version: 1,
    author: 'تیم مالی',
    createdAt: '2024-01-08T00:00:00',
    updatedAt: '2024-01-08T00:00:00',
    logs: []
  }
];

// ==================== Main Workflow Manager Pro Component ====================
const AdminWorkflowManagerPro = ({ onClose }) => {
  // ============ State ============
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // cards, list, flow
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [showLogs, setShowLogs] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(null);
  const [expandedWorkflows, setExpandedWorkflows] = useState(new Set());
  const [dragOverWorkflow, setDragOverWorkflow] = useState(null);
  const [workflowToClone, setWorkflowToClone] = useState(null);
  
  // ============ All Tags ============
  const allTags = useCallback(() => {
    const tags = new Set();
    workflows.forEach(w => w.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [workflows]);
  
  // ============ Toggle Workflow ============
  const handleToggleWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    ));
    
    const workflow = workflows.find(w => w.id === workflowId);
    toast.success(
      workflow?.enabled 
        ? '⏸️ گردش کار متوقف شد' 
        : '▶️ گردش کار فعال شد',
      { icon: workflow?.enabled ? '⏸️' : '▶️' }
    );
  };
  
  // ============ Run Workflow ============
  const handleRunWorkflow = async (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    
    const executionId = `exec-${Date.now()}`;
    const startTime = Date.now();
    
    // Add to logs
    const logEntry = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date().toISOString(),
      steps: []
    };
    
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, logs: [...(w.logs || []), logEntry] } : w
    ));
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000)),
      {
        loading: `🔄 در حال اجرای "${workflow?.name}"...`,
        success: () => {
          // Update log
          setWorkflows(prev => prev.map(w => {
            if (w.id === workflowId) {
              const updatedLogs = w.logs.map(l => 
                l.id === executionId 
                  ? { ...l, status: 'completed', endTime: new Date().toISOString(), duration: Date.now() - startTime }
                  : l
              );
              return { ...w, logs: updatedLogs, lastRun: new Date().toISOString(), runCount: w.runCount + 1 };
            }
            return w;
          }));
          return `✅ "${workflow?.name}" با موفقیت اجرا شد`;
        },
        error: () => {
          setWorkflows(prev => prev.map(w => {
            if (w.id === workflowId) {
              const updatedLogs = w.logs.map(l => 
                l.id === executionId ? { ...l, status: 'failed', endTime: new Date().toISOString() } : l
              );
              return { ...w, logs: updatedLogs };
            }
            return w;
          }));
          return `❌ خطا در اجرای "${workflow?.name}"`;
        }
      }
    );
  };
  
  // ============ Clone Workflow ============
  const handleCloneWorkflow = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const clone = {
      ...workflow,
      id: `wf-${Date.now()}`,
      name: `${workflow.name} (کپی)`,
      enabled: false,
      lastRun: null,
      runCount: 0,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: []
    };
    
    setWorkflows(prev => [...prev, clone]);
    toast.success('✅ گردش کار کپی شد');
  };
  
  // ============ Export/Import ============
  const handleExport = (workflowId = null) => {
    const data = workflowId 
      ? workflows.find(w => w.id === workflowId)
      : workflows;
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow${workflowId ? `-${workflowId}` : 's'}-${Date.now()}.json`;
    a.click();
    
    toast.success('📥 گردش کار export شد');
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const newWorkflows = Array.isArray(data) ? data : [data];
        
        setWorkflows(prev => [...prev, ...newWorkflows.map(w => ({
          ...w,
          id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lastRun: null,
          runCount: 0,
          logs: []
        }))]);
        
        toast.success(`📤 ${newWorkflows.length} گردش کار import شد`);
      } catch (error) {
        toast.error('❌ فایل نامعتبر است');
      }
    };
    reader.readAsText(file);
  };
  
  // ============ Delete Workflow ============
  const handleDeleteWorkflow = (workflowId) => {
    if (!confirm('آیا از حذف این گردش کار مطمئن هستید؟\nاین عملیات قابل بازگشت نیست.')) return;
    
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    setSelectedWorkflows(prev => prev.filter(id => id !== workflowId));
    toast.success('🗑️ گردش کار حذف شد');
  };
  
  // ============ Bulk Actions ============
  const handleBulkEnable = () => {
    setWorkflows(prev => prev.map(w => 
      selectedWorkflows.includes(w.id) ? { ...w, enabled: true } : w
    ));
    toast.success(`✅ ${selectedWorkflows.length} گردش کار فعال شد`);
  };
  
  const handleBulkDisable = () => {
    setWorkflows(prev => prev.map(w => 
      selectedWorkflows.includes(w.id) ? { ...w, enabled: false } : w
    ));
    toast.success(`⏸️ ${selectedWorkflows.length} گردش کار غیرفعال شد`);
  };
  
  const handleBulkDelete = () => {
    if (!confirm(`آیا از حذف ${selectedWorkflows.length} گردش کار مطمئن هستید؟`)) return;
    
    setWorkflows(prev => prev.filter(w => !selectedWorkflows.includes(w.id)));
    setSelectedWorkflows([]);
    toast.success(`🗑️ ${selectedWorkflows.length} گردش کار حذف شد`);
  };
  
  // ============ Save Workflow ============
  const handleSaveWorkflow = (workflow) => {
    if (workflow.id && workflows.find(w => w.id === workflow.id)) {
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? { ...workflow, updatedAt: new Date().toISOString(), version: (w.version || 1) + 1 }
          : w
      ));
      toast.success('✅ گردش کار به‌روزرسانی شد');
    } else {
      const newWorkflow = {
        ...workflow,
        id: `wf-${Date.now()}`,
        lastRun: null,
        runCount: 0,
        successRate: 100,
        version: 1,
        author: 'کاربر جاری',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: []
      };
      setWorkflows(prev => [...prev, newWorkflow]);
      toast.success('✨ گردش کار جدید ایجاد شد');
    }
    
    setEditingWorkflow(null);
    setShowCreateModal(false);
  };
  
  // ============ Filter & Search ============
  const filteredWorkflows = workflows.filter(w => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = w.name.toLowerCase().includes(q);
      const matchesDesc = w.description?.toLowerCase().includes(q);
      const matchesTrigger = TRIGGER_TYPES.find(t => t.value === w.trigger)?.label.toLowerCase().includes(q);
      const matchesTags = w.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchesName && !matchesDesc && !matchesTrigger && !matchesTags) return false;
    }
    if (filterStatus === 'enabled' && !w.enabled) return false;
    if (filterStatus === 'disabled' && w.enabled) return false;
    if (filterCategory !== 'all') {
      const trigger = TRIGGER_TYPES.find(t => t.value === w.trigger);
      if (trigger?.category !== filterCategory) return false;
    }
    if (filterTag !== 'all' && !w.tags?.includes(filterTag)) return false;
    return true;
  });
  
  // ============ Stats ============
  const stats = useCallback(() => ({
    total: workflows.length,
    enabled: workflows.filter(w => w.enabled).length,
    disabled: workflows.filter(w => !w.enabled).length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runCount, 0),
    avgSuccessRate: workflows.length > 0 
      ? (workflows.reduce((sum, w) => sum + (w.successRate || 100), 0) / workflows.length).toFixed(1)
      : 100,
    last24hRuns: workflows.reduce((sum, w) => {
      // Simulate: در واقعیت لاگ‌ها رو بررسی می‌کنیم
      return sum + Math.floor(Math.random() * 50);
    }, 0)
  }), [workflows]);
  
  return (
    <motion.div 
      className="admin-workflow-manager-pro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ============ Header ============ */}
      <div className="workflow-header">
        <div className="header-left">
          <LuWorkflow size={28} />
          <div>
            <h2>مدیریت گردش کار</h2>
            <span className="header-subtitle">Workflow Automation Engine</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-import"
            onClick={() => document.getElementById('workflow-import-input').click()}
          >
            <FaUpload /> import
          </button>
          <input
            id="workflow-import-input"
            type="file"
            accept=".json"
            onChange={handleImport}
            hidden
          />
          
          <button className="btn-export" onClick={() => handleExport()}>
            <FaDownload /> Export همه
          </button>
          
          <button 
            className="btn-create"
            onClick={() => {
              setEditingWorkflow({
                name: '',
                description: '',
                trigger: '',
                conditions: [],
                actions: [],
                enabled: true,
                priority: 'medium',
                tags: []
              });
              setShowCreateModal(true);
            }}
          >
            <FaPlus /> ایجاد گردش کار جدید
          </button>
          
          <button onClick={onClose} className="btn-close">
            <FaTimes />
          </button>
        </div>
      </div>
      
      {/* ============ Stats Bar ============ */}
      <div className="workflow-stats-bar">
        <div className="stat-item">
          <LuWorkflow />
          <div>
            <span className="stat-value">{stats().total}</span>
            <span className="stat-label">کل</span>
          </div>
        </div>
        <div className="stat-item success">
          <FaToggleOn />
          <div>
            <span className="stat-value">{stats().enabled}</span>
            <span className="stat-label">فعال</span>
          </div>
        </div>
        <div className="stat-item warning">
          <FaToggleOff />
          <div>
            <span className="stat-value">{stats().disabled}</span>
            <span className="stat-label">غیرفعال</span>
          </div>
        </div>
        <div className="stat-item">
          <FaPlay />
          <div>
            <span className="stat-value">{stats().totalRuns.toLocaleString()}</span>
            <span className="stat-label">کل اجراها</span>
          </div>
        </div>
        <div className="stat-item">
          <FaCheck />
          <div>
            <span className="stat-value">{stats().avgSuccessRate}%</span>
            <span className="stat-label">موفقیت</span>
          </div>
        </div>
        <div className="stat-item">
          <FaClock />
          <div>
            <span className="stat-value">{stats().last24hRuns}</span>
            <span className="stat-label">۲۴ ساعت اخیر</span>
          </div>
        </div>
      </div>
      
      {/* ============ Filters Toolbar ============ */}
      <div className="workflow-filters-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="جستجو در گردش کارها... (نام، توضیحات، تگ)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="filter-group">
          <div className="filter-buttons">
            <button 
              className={filterStatus === 'all' ? 'active' : ''}
              onClick={() => setFilterStatus('all')}
            >
              همه
            </button>
            <button 
              className={filterStatus === 'enabled' ? 'active' : ''}
              onClick={() => setFilterStatus('enabled')}
            >
              فعال‌ها
            </button>
            <button 
              className={filterStatus === 'disabled' ? 'active' : ''}
              onClick={() => setFilterStatus('disabled')}
            >
              غیرفعال‌ها
            </button>
          </div>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">همه دسته‌ها</option>
            <option value="user">👤 کاربر</option>
            <option value="course">📚 دوره</option>
            <option value="payment">💰 پرداخت</option>
            <option value="support">🎫 پشتیبانی</option>
            <option value="system">⚙️ سیستم</option>
          </select>
          
          {allTags().length > 0 && (
            <select 
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="filter-select"
            >
              <option value="all">همه تگ‌ها</option>
              {allTags().map(tag => (
                <option key={tag} value={tag}>🏷️ {tag}</option>
              ))}
            </select>
          )}
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
            >
              <FaThLarge />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
            <button 
              className={viewMode === 'flow' ? 'active' : ''}
              onClick={() => setViewMode('flow')}
            >
              <FaProjectDiagram />
            </button>
          </div>
        </div>
      </div>
      
      {/* ============ Bulk Actions Bar ============ */}
      <AnimatePresence>
        {selectedWorkflows.length > 0 && (
          <motion.div 
            className="bulk-actions-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span>{selectedWorkflows.length} گردش کار انتخاب شده</span>
            <button onClick={handleBulkEnable}>
              <FaToggleOn /> فعال‌سازی
            </button>
            <button onClick={handleBulkDisable}>
              <FaToggleOff /> غیرفعال‌سازی
            </button>
            <button onClick={() => handleExport()}>
              <FaDownload /> Export
            </button>
            <button onClick={handleBulkDelete} className="danger">
              <FaTrash /> حذف
            </button>
            <button onClick={() => setSelectedWorkflows([])}>
              <FaTimes /> لغو انتخاب
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ============ Workflow List ============ */}
      <div className={`workflow-list ${viewMode}`}>
        <AnimatePresence>
          {filteredWorkflows.map((workflow, index) => {
            const triggerInfo = TRIGGER_TYPES.find(t => t.value === workflow.trigger);
            const TriggerIcon = triggerInfo?.icon || FaCog;
            const isSelected = selectedWorkflows.includes(workflow.id);
            const isExpanded = expandedWorkflows.has(workflow.id);
            
            return (
              <motion.div
                key={workflow.id}
                className={`workflow-card ${isSelected ? 'selected' : ''} ${viewMode}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                drag={viewMode === 'flow' ? 'x' : false}
              >
                {/* Selection Checkbox */}
                <div className="workflow-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      setSelectedWorkflows(prev => 
                        prev.includes(workflow.id)
                          ? prev.filter(id => id !== workflow.id)
                          : [...prev, workflow.id]
                      );
                    }}
                  />
                </div>
                
                {/* Main Card Content */}
                <div className="workflow-card-main">
                  <div className="workflow-card-header">
                    <div className="workflow-info">
                      <h3>{workflow.name}</h3>
                      <p>{workflow.description || 'بدون توضیحات'}</p>
                      
                      {/* Version & Author */}
                      <div className="workflow-meta-info">
                        <span className="meta-badge">v{workflow.version || 1}</span>
                        <span className="meta-author">توسط {workflow.author || 'نامشخص'}</span>
                        <span className="meta-date">
                          {new Date(workflow.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="workflow-status">
                      <button
                        className={`toggle-btn ${workflow.enabled ? 'active' : ''}`}
                        onClick={() => handleToggleWorkflow(workflow.id)}
                      >
                        {workflow.enabled ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                      </button>
                      
                      <span className={`priority-badge ${workflow.priority}`}>
                        {workflow.priority === 'high' ? '🔴 بالا' : 
                         workflow.priority === 'medium' ? '🟡 متوسط' : '🟢 پایین'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {workflow.tags?.length > 0 && (
                    <div className="workflow-tags">
                      {workflow.tags.map(tag => (
                        <span key={tag} className="tag" onClick={() => setFilterTag(tag)}>
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Flow Diagram (Mini) */}
                  <div className="workflow-flow-mini" onClick={() => setExpandedWorkflows(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(workflow.id)) newSet.delete(workflow.id);
                    else newSet.add(workflow.id);
                    return newSet;
                  })}>
                    <div className="flow-node-mini trigger">
                      <TriggerIcon size={14} />
                      <span>{triggerInfo?.label || workflow.trigger}</span>
                    </div>
                    
                    {(workflow.conditions?.length || 0) > 0 && (
                      <>
                        <div className="flow-arrow">→</div>
                        <div className="flow-condition-badge">⚡</div>
                      </>
                    )}
                    
                    <div className="flow-arrow">→</div>
                    
                    <div className="flow-actions-mini">
                      {workflow.actions.slice(0, 3).map((action, idx) => {
                        const actionInfo = ACTION_TYPES.find(a => a.value === action.type);
                        const ActionIcon = actionInfo?.icon || FaCog;
                        return (
                          <div key={idx} className="flow-action-chip-mini" style={{ '--color': actionInfo?.color }}>
                            <ActionIcon size={12} />
                          </div>
                        );
                      })}
                      {workflow.actions.length > 3 && (
                        <span className="more-actions">+{workflow.actions.length - 3}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        className="workflow-expanded-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {/* Conditions */}
                        {workflow.conditions?.length > 0 && (
                          <div className="detail-section conditions">
                            <h4><FaFilter /> شرایط</h4>
                            {workflow.conditions.map((c, idx) => (
                              <span key={idx} className="condition-badge">
                                {c.field} {c.operator} {c.value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Actions Detail */}
                        <div className="detail-section actions">
                          <h4><FaPlay /> اقدامات</h4>
                          {workflow.actions.map((action, idx) => {
                            const actionInfo = ACTION_TYPES.find(a => a.value === action.type);
                            const ActionIcon = actionInfo?.icon || FaCog;
                            
                            return (
                              <div key={idx} className="action-detail-card" style={{ '--color': actionInfo?.color }}>
                                <div className="action-header">
                                  <ActionIcon />
                                  <span>{actionInfo?.label || action.type}</span>
                                  <span className="action-step">{idx + 1}</span>
                                </div>
                                {action.config && (
                                  <div className="action-config">
                                    {Object.entries(action.config).map(([key, value]) => (
                                      <span key={key} className="config-item">
                                        <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Success Rate */}
                        <div className="detail-section stats">
                          <div className="mini-stat">
                            <span className="mini-stat-label">نرخ موفقیت</span>
                            <div className="mini-progress">
                              <div 
                                className="mini-progress-fill" 
                                style={{ width: `${workflow.successRate || 100}%`, background: (workflow.successRate || 100) > 95 ? '#10b981' : '#f59e0b' }} 
                              />
                            </div>
                            <span className="mini-stat-value">{workflow.successRate || 100}%</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Card Footer */}
                  <div className="workflow-card-footer">
                    <div className="workflow-meta">
                      {workflow.lastRun && (
                        <span className="meta-item" title="آخرین اجرا">
                          <FaHistory size={12} />
                          {new Date(workflow.lastRun).toLocaleDateString('fa-IR')}
                        </span>
                      )}
                      <span className="meta-item" title="تعداد اجرا">
                        <FaPlay size={12} />
                        {workflow.runCount.toLocaleString()}
                      </span>
                      <span className="meta-item" title="نرخ موفقیت">
                        <FaCheck size={12} />
                        {workflow.successRate || 100}%
                      </span>
                    </div>
                    
                    <div className="workflow-card-actions">
                      <button 
                        onClick={() => setShowLogs(showLogs === workflow.id ? null : workflow.id)}
                        title="مشاهده لاگ‌ها"
                        className={showLogs === workflow.id ? 'active' : ''}
                      >
                        <FaClipboardList size={14} />
                      </button>
                      <button 
                        onClick={() => handleRunWorkflow(workflow.id)}
                        disabled={!workflow.enabled}
                        title="اجرای دستی"
                      >
                        <FaPlay size={14} />
                      </button>
                      <button 
                        onClick={() => handleCloneWorkflow(workflow.id)}
                        title="کپی کردن"
                      >
                        <FaClone size={14} />
                      </button>
                      <button 
                        onClick={() => handleExport(workflow.id)}
                        title="Export"
                      >
                        <FaDownload size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingWorkflow(workflow);
                          setShowCreateModal(true);
                        }}
                        title="ویرایش"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        title="حذف"
                        className="danger"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Logs Panel */}
                  <AnimatePresence>
                    {showLogs === workflow.id && (
                      <motion.div 
                        className="workflow-logs-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <h4><FaClipboardList /> تاریخچه اجرا</h4>
                        <div className="logs-list">
                          {(workflow.logs || []).length === 0 ? (
                            <p className="no-logs">هنوز لاگی ثبت نشده</p>
                          ) : (
                            workflow.logs.slice(-10).reverse().map(log => (
                              <div key={log.id} className={`log-entry ${log.status}`}>
                                <span className="log-status">
                                  {log.status === 'completed' ? '✅' : log.status === 'failed' ? '❌' : '🔄'}
                                </span>
                                <span className="log-time">
                                  {new Date(log.startTime).toLocaleTimeString('fa-IR')}
                                </span>
                                <span className="log-duration">
                                  {log.duration ? `${log.duration}ms` : '---'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Empty State */}
        {filteredWorkflows.length === 0 && (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LuWorkflow size={64} />
            <h3>هیچ گردش کاری یافت نشد</h3>
            <p>
              {searchQuery || filterCategory !== 'all' || filterTag !== 'all'
                ? 'فیلترها رو تغییر بده'
                : 'اولین گردش کار خودت رو بساز!'}
            </p>
            <button onClick={() => {
              setEditingWorkflow({
                name: '',
                description: '',
                trigger: '',
                actions: [],
                conditions: [],
                enabled: true,
                priority: 'medium',
                tags: []
              });
              setShowCreateModal(true);
            }}>
              <FaPlus /> ایجاد اولین گردش کار
            </button>
          </motion.div>
        )}
      </div>
      
      {/* ============ Create/Edit Modal ============ */}
      <AnimatePresence>
        {showCreateModal && editingWorkflow && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              className="modal-content workflow-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {editingWorkflow.id ? 'ویرایش گردش کار' : 'ایجاد گردش کار جدید'}
                </h3>
                <div className="modal-header-actions">
                  {editingWorkflow.id && (
                    <span className="version-badge">v{(editingWorkflow.version || 1) + 1}</span>
                  )}
                  <button onClick={() => setShowCreateModal(false)}>
                    <FaTimes />
                  </button>
                </div>
              </div>
              
              <div className="modal-body">
                {/* Basic Info */}
                <div className="form-section">
                  <h4><FaInfoCircle /> اطلاعات پایه</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>نام گردش کار *</label>
                      <input
                        type="text"
                        value={editingWorkflow.name}
                        onChange={(e) => setEditingWorkflow(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: خوش‌آمدگویی کاربر جدید"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>اولویت</label>
                      <div className="priority-selector">
                        {['high', 'medium', 'low'].map(p => (
                          <button
                            key={p}
                            className={`priority-option ${p} ${editingWorkflow.priority === p ? 'selected' : ''}`}
                            onClick={() => setEditingWorkflow(prev => ({ ...prev, priority: p }))}
                          >
                            {p === 'high' ? '🔴 بالا' : p === 'medium' ? '🟡 متوسط' : '🟢 پایین'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>توضیحات</label>
                    <textarea
                      value={editingWorkflow.description}
                      onChange={(e) => setEditingWorkflow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="توضیح دهید این گردش کار چه کاری انجام می‌دهد..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>تگ‌ها</label>
                    <div className="tags-input">
                      {(editingWorkflow.tags || []).map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag}
                          <button onClick={() => {
                            const newTags = [...editingWorkflow.tags];
                            newTags.splice(idx, 1);
                            setEditingWorkflow(prev => ({ ...prev, tags: newTags }));
                          }}>
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="تگ جدید..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            setEditingWorkflow(prev => ({
                              ...prev,
                              tags: [...(prev.tags || []), e.target.value.trim()]
                            }));
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Trigger Section */}
                <div className="form-section">
                  <h4><FaPlay /> محرک (Trigger)</h4>
                  <div className="trigger-grid">
                    {Object.entries(
                      TRIGGER_TYPES.reduce((groups, t) => {
                        const cat = t.category || 'other';
                        if (!groups[cat]) groups[cat] = [];
                        groups[cat].push(t);
                        return groups;
                      }, {})
                    ).map(([category, triggers]) => (
                      <div key={category} className="trigger-category">
                        <h5>
                          {category === 'user' ? '👤 کاربر' :
                           category === 'course' ? '📚 دوره' :
                           category === 'payment' ? '💰 پرداخت' :
                           category === 'support' ? '🎫 پشتیبانی' :
                           category === 'system' ? '⚙️ سیستم' : '📁 سایر'}
                        </h5>
                        <div className="trigger-options">
                          {triggers.map(trigger => {
                            const Icon = trigger.icon;
                            const isSelected = editingWorkflow.trigger === trigger.value;
                            return (
                              <motion.button
                                key={trigger.value}
                                className={`trigger-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => setEditingWorkflow(prev => ({ ...prev, trigger: trigger.value }))}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Icon />
                                <span>{trigger.label}</span>
                                {isSelected && <FaCheck className="check-icon" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Conditions Section */}
                <div className="form-section">
                  <h4><FaFilter /> شرایط اجرا (اختیاری)</h4>
                  <ConditionBuilder
                    conditions={editingWorkflow.conditions || []}
                    onChange={(conditions) => setEditingWorkflow(prev => ({ ...prev, conditions }))}
                  />
                </div>
                
                {/* Actions Section */}
                <div className="form-section">
                  <h4><FaRunning /> اقدامات (Actions)</h4>
                  
                  <Reorder.Group
                    axis="y"
                    values={editingWorkflow.actions}
                    onReorder={(newOrder) => setEditingWorkflow(prev => ({ ...prev, actions: newOrder }))}
                    className="actions-list"
                  >
                    {editingWorkflow.actions.map((action, idx) => {
                      const actionInfo = ACTION_TYPES.find(a => a.value === action.type);
                      const ActionIcon = actionInfo?.icon || FaCog;
                      
                      return (
                        <Reorder.Item key={idx} value={action}>
                          <motion.div 
                            className="action-editor-card"
                            layout
                            style={{ '--action-color': actionInfo?.color || '#6C5CE7' }}
                          >
                            <div className="action-header">
                              <FaGripVertical className="drag-handle" />
                              <span className="action-number">{idx + 1}</span>
                              
                              <select
                                value={action.type}
                                onChange={(e) => {
                                  const newActions = [...editingWorkflow.actions];
                                  newActions[idx] = { type: e.target.value, config: {} };
                                  setEditingWorkflow(prev => ({ ...prev, actions: newActions }));
                                }}
                                className="action-type-select"
                              >
                                <option value="">انتخاب اقدام...</option>
                                {ACTION_TYPES.map(a => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                              
                              <button
                                className="btn-remove-action"
                                onClick={() => {
                                  const newActions = editingWorkflow.actions.filter((_, i) => i !== idx);
                                  setEditingWorkflow(prev => ({ ...prev, actions: newActions }));
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            {action.type && (
                              <div className="action-config-panel">
                                {actionInfo?.configFields?.map(field => (
                                  <div key={field} className="config-field">
                                    <label>{field}</label>
                                    {field === 'template' ? (
                                      <div className="template-field">
                                        <select
                                          value={action.config?.[field] || ''}
                                          onChange={(e) => {
                                            const newActions = [...editingWorkflow.actions];
                                            newActions[idx] = {
                                              ...newActions[idx],
                                              config: { ...newActions[idx].config, [field]: e.target.value }
                                            };
                                            setEditingWorkflow(prev => ({ ...prev, actions: newActions }));
                                          }}
                                        >
                                          <option value="">انتخاب قالب...</option>
                                          <option value="welcome_email">ایمیل خوش‌آمدگویی</option>
                                          <option value="course_reminder">یادآوری دوره</option>
                                          <option value="certificate">گواهینامه</option>
                                          <option value="payment_failed">پرداخت ناموفق</option>
                                          <option value="custom">سفارشی...</option>
                                        </select>
                                        {action.config?.[field] === 'custom' && (
                                          <TemplateEditor
                                            template={action.config?.custom_template || ''}
                                            onChange={(value) => {
                                              const newActions = [...editingWorkflow.actions];
                                              newActions[idx] = {
                                                ...newActions[idx],
                                                config: { ...newActions[idx].config, custom_template: value }
                                              };
                                              setEditingWorkflow(prev => ({ ...prev, actions: newActions }));
                                            }}
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={action.config?.[field] || ''}
                                        onChange={(e) => {
                                          const newActions = [...editingWorkflow.actions];
                                          newActions[idx] = {
                                            ...newActions[idx],
                                            config: { ...newActions[idx].config, [field]: e.target.value }
                                          };
                                          setEditingWorkflow(prev => ({ ...prev, actions: newActions }));
                                        }}
                                        placeholder={`مقدار ${field}...`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                  
                  <button
                    className="btn-add-action"
                    onClick={() => {
                      setEditingWorkflow(prev => ({
                        ...prev,
                        actions: [...prev.actions, { type: '', config: {} }]
                      }));
                    }}
                  >
                    <FaPlus /> افزودن اقدام جدید
                  </button>
                </div>
              </div>
              
              <div className="modal-footer">
                <button onClick={() => setShowCreateModal(false)} className="btn-cancel">
                  انصراف
                </button>
                <button 
                  onClick={() => handleSaveWorkflow(editingWorkflow)} 
                  className="btn-save"
                  disabled={!editingWorkflow.name || !editingWorkflow.trigger || editingWorkflow.actions.length === 0}
                >
                  <FaSave /> ذخیره گردش کار
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminWorkflowManagerPro;
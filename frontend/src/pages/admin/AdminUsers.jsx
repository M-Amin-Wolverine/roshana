// ============================================================
// AdminUsers.jsx - نسخه فوق‌العاده مدیریت کاربران
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaUserGraduate, FaChalkboardTeacher, FaUserShield,
  FaEnvelope, FaPhone, FaCalendarAlt, FaCheckCircle,
  FaTimesCircle, FaDownload, FaUpload, FaEye,
  FaChevronLeft, FaChevronRight, FaSync, FaBan,
  FaKey, FaUserCheck, FaUserClock, FaUsersCog,
  FaSpinner, FaExclamationTriangle, FaIdCard,
  FaMapMarkerAlt, FaVenusMars, FaGraduationCap,
  FaBuilding, FaLayerGroup, FaChartLine, FaUserTag,
  FaHistory, FaLock, FaUnlock, FaPaperPlane,
  FaFilter as FaFilterIcon, FaTimes, FaCheck,
  FaCog, FaSignOutAlt, FaUserCog, FaUserMinus,
  FaUserAstronaut, FaUserNinja, FaUserSecret
} from 'react-icons/fa';
//import { dashboardService } from '../../services/api';
//import * as XLSX from 'xlsx';
import './AdminPages.css';

// ============================================================
// ثابت‌ها و تنظیمات
// ============================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const USER_ROLES = [
  { value: 'student', label: 'دانشجو', icon: FaUserGraduate, color: '#3B82F6' },
  { value: 'professor', label: 'استاد', icon: FaChalkboardTeacher, color: '#10B981' },
  { value: 'admin', label: 'مدیر', icon: FaUserShield, color: '#8B5CF6' },
  { value: 'super_admin', label: 'مدیر کل', icon: FaUserSecret, color: '#EF4444' },
  { value: 'staff', label: 'کارمند', icon: FaUserCog, color: '#F59E0B' },
  { value: 'guest', label: 'مهمان', icon: FaUserAstronaut, color: '#94A3B8' }
];

const USER_STATUSES = [
  { value: 'active', label: 'فعال', icon: FaCheckCircle, color: '#10B981' },
  { value: 'inactive', label: 'غیرفعال', icon: FaTimesCircle, color: '#94A3B8' },
  { value: 'pending', label: 'در انتظار', icon: FaUserClock, color: '#F59E0B' },
  { value: 'blocked', label: 'مسدود', icon: FaBan, color: '#EF4444' },
  { value: 'suspended', label: 'تعلیق', icon: FaUserMinus, color: '#DC2626' }
];

const GENDERS = [
  { value: 'male', label: 'مرد', icon: FaVenusMars },
  { value: 'female', label: 'زن', icon: FaVenusMars },
  { value: 'other', label: 'سایر', icon: FaVenusMars }
];

const ANIMATION_VARIANTS = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  scaleIn: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  stagger: { animate: { transition: { staggerChildren: 0.05 } } }
};

// ============================================================
// کامپوننت‌های کمکی پیشرفته
// ============================================================

// Skeleton Loader برای جدول
const TableSkeleton = ({ rows = 5 }) => (
  <div className="table-skeleton">
    {Array(rows).fill(null).map((_, i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
      </div>
    ))}
  </div>
);

// کارت آمار پیشرفته
const AdvancedStatCard = ({ title, value, icon: Icon, color, trend, subtitle, loading }) => (
  <motion.div 
    className="advanced-stat-card"
    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    {loading ? (
      <div className="stat-loading">
        <div className="skeleton-shimmer" />
      </div>
    ) : (
      <>
        <div className="stat-header">
          <div className={`stat-icon ${color}`}>
            <Icon />
          </div>
          {trend && (
            <span className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
              {trend > 0 ? <FaChartLine /> : <FaChartLine style={{ transform: 'rotate(180deg)' }} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="stat-body">
          <span className="stat-value">{value?.toLocaleString('fa-IR') || 0}</span>
          <span className="stat-label">{title}</span>
          {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        </div>
      </>
    )}
  </motion.div>
);

// فیلتر بار پیشرفته
const AdvancedFilterBar = ({ filters, setFilters, onExport, onImport, onBulkAction, selectedCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    const count = Object.values(filters).filter(v => v && v !== '').length;
    setActiveFilters(count);
  }, [filters]);

  return (
    <div className="advanced-filter-bar">
      <div className="filter-bar-main">
        <div className="search-box-advanced">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="جستجو بر اساس نام، ایمیل، شماره تماس یا کد دانشجویی..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          {filters.search && (
            <button 
              className="clear-search"
              onClick={() => setFilters({...filters, search: ''})}
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="filter-actions">
          <button 
            className={`filter-toggle ${activeFilters > 0 ? 'active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaFilterIcon />
            فیلترها
            {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
          </button>
          
          <button className="btn-secondary" onClick={onExport}>
            <FaDownload /> خروجی
          </button>
          
          <button className="btn-secondary" onClick={onImport}>
            <FaUpload /> ورود
          </button>
          
          <button className="btn-primary" onClick={() => {}}>
            <FaUserPlus /> کاربر جدید
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div 
            className="bulk-actions-bar"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <span className="selected-count">{selectedCount} کاربر انتخاب شده</span>
            <div className="bulk-buttons">
              <button onClick={() => onBulkAction('activate')}>
                <FaCheckCircle /> فعال‌سازی
              </button>
              <button onClick={() => onBulkAction('deactivate')}>
                <FaBan /> غیرفعال‌سازی
              </button>
              <button onClick={() => onBulkAction('send_message')}>
                <FaPaperPlane /> ارسال پیام
              </button>
              <button className="danger" onClick={() => onBulkAction('delete')}>
                <FaTrash /> حذف گروهی
              </button>
              <button onClick={() => onBulkAction('clear')}>
                <FaTimes /> لغو
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="filter-panel-advanced"
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="filter-panel-header">
              <h4>فیلترهای پیشرفته</h4>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="filter-grid">
              <div className="filter-group">
                <label>نقش کاربر</label>
                <select 
                  value={filters.role}
                  onChange={(e) => setFilters({...filters, role: e.target.value})}
                >
                  <option value="">همه نقش‌ها</option>
                  {USER_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>وضعیت</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">همه وضعیت‌ها</option>
                  {USER_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>جنسیت</label>
                <select 
                  value={filters.gender}
                  onChange={(e) => setFilters({...filters, gender: e.target.value})}
                >
                  <option value="">همه</option>
                  {GENDERS.map(gender => (
                    <option key={gender.value} value={gender.value}>{gender.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>دانشکده</label>
                <select 
                  value={filters.faculty}
                  onChange={(e) => setFilters({...filters, faculty: e.target.value})}
                >
                  <option value="">همه</option>
                  <option value="engineering">فنی و مهندسی</option>
                  <option value="science">علوم پایه</option>
                  <option value="humanities">علوم انسانی</option>
                  <option value="art">هنر</option>
                </select>
              </div>

              <div className="filter-group">
                <label>سال ورود</label>
                <select 
                  value={filters.entryYear}
                  onChange={(e) => setFilters({...filters, entryYear: e.target.value})}
                >
                  <option value="">همه</option>
                  {Array.from({ length: 10 }, (_, i) => 1403 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>تأیید ایمیل</label>
                <select 
                  value={filters.emailVerified}
                  onChange={(e) => setFilters({...filters, emailVerified: e.target.value})}
                >
                  <option value="">همه</option>
                  <option value="true">تأیید شده</option>
                  <option value="false">تأیید نشده</option>
                </select>
              </div>
            </div>

            <div className="filter-panel-footer">
              <button 
                className="btn-secondary"
                onClick={() => setFilters({
                  search: '', role: '', status: '', gender: '',
                  faculty: '', entryYear: '', emailVerified: ''
                })}
              >
                پاک کردن همه
              </button>
              <button className="btn-primary" onClick={() => setIsOpen(false)}>
                اعمال فیلترها
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// مودال جزئیات کاربر
const UserDetailModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  
  const tabs = [
    { id: 'info', label: 'اطلاعات پایه', icon: FaIdCard },
    { id: 'academic', label: 'اطلاعات تحصیلی', icon: FaGraduationCap },
    { id: 'activity', label: 'فعالیت‌ها', icon: FaHistory },
    { id: 'permissions', label: 'دسترسی‌ها', icon: FaLock }
  ];

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="modal-content modal-lg"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="user-header">
                <div className="user-avatar-large">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h2>{user.firstName} {user.lastName}</h2>
                  <p>@{user.username}</p>
                  <span className={`status-badge ${user.status}`}>
                    {USER_STATUSES.find(s => s.value === user.status)?.label}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={onClose}>
                <FaTimesCircle size={24} />
              </button>
            </div>

            <div className="modal-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon /> {tab.label}
                </button>
              ))}
            </div>

            <div className="modal-body">
              {activeTab === 'info' && (
                <div className="user-info-grid">
                  <div className="info-item">
                    <FaEnvelope /> <span>ایمیل:</span> {user.email}
                  </div>
                  <div className="info-item">
                    <FaPhone /> <span>تلفن:</span> {user.phone || '—'}
                  </div>
                  <div className="info-item">
                    <FaIdCard /> <span>کد ملی:</span> {user.nationalCode || '—'}
                  </div>
                  <div className="info-item">
                    <FaCalendarAlt /> <span>تاریخ تولد:</span> {user.birthDate || '—'}
                  </div>
                  <div className="info-item">
                    <FaVenusMars /> <span>جنسیت:</span> {GENDERS.find(g => g.value === user.gender)?.label || '—'}
                  </div>
                  <div className="info-item">
                    <FaMapMarkerAlt /> <span>آدرس:</span> {user.address || '—'}
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="user-info-grid">
                  <div className="info-item">
                    <FaIdCard /> <span>شماره دانشجویی:</span> {user.studentId || '—'}
                  </div>
                  <div className="info-item">
                    <FaBuilding /> <span>دانشکده:</span> {user.faculty || '—'}
                  </div>
                  <div className="info-item">
                    <FaLayerGroup /> <span>رشته:</span> {user.field || '—'}
                  </div>
                  <div className="info-item">
                    <FaCalendarAlt /> <span>سال ورود:</span> {user.entryYear || '—'}
                  </div>
                  <div className="info-item">
                    <FaGraduationCap /> <span>ترم:</span> {user.semester || '—'}
                  </div>
                  <div className="info-item">
                    <FaChartLine /> <span>معدل:</span> {user.gpa || '—'}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="activity-timeline">
                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <strong>تاریخ ثبت‌نام</strong>
                      <p>{user.registeredAt}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <FaKey />
                    </div>
                    <div>
                      <strong>آخرین ورود</strong>
                      <p>{user.lastLogin || '—'}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon">
                      <FaHistory />
                    </div>
                    <div>
                      <strong>تعداد ورود</strong>
                      <p>{user.loginCount || 0} بار</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="permissions-section">
                  <h4>نقش‌های کاربر</h4>
                  <div className="role-list">
                    {USER_ROLES.map(role => (
                      <label key={role.value} className="role-checkbox">
                        <input 
                          type="checkbox"
                          checked={user.role === role.value}
                          readOnly
                        />
                        <role.icon /> {role.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>
                بستن
              </button>
              <button className="btn-primary" onClick={() => onUpdate(user)}>
                <FaEdit /> ویرایش کاربر
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// کامپوننت اصلی
// ============================================================

const AdminUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    gender: '',
    faculty: '',
    entryYear: '',
    emailVerified: ''
  });
  const [pagination, setPagination] = useState({ page: 1, perPage: 10 });
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [modalState, setModalState] = useState({
    type: null,
    user: null
  });

  // React Query - Fetch Users
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-users', filters, pagination.page, pagination.perPage, sortBy, sortOrder],
    queryFn: () => dashboardService.getUsers({
      ...filters,
      page: pagination.page,
      limit: pagination.perPage,
      sortBy,
      sortOrder
    }),
    keepPreviousData: true
  });

  // React Query - Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: () => dashboardService.getUserStats(),
    initialData: {
      total: 1250,
      active: 980,
      newThisMonth: 145,
      pending: 23,
      blocked: 12,
      verified: 1100
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('کاربر با موفقیت بروزرسانی شد');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteUserMutation = useMutation({
    mutationFn: dashboardService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
      toast.success('کاربر با موفقیت حذف شد');
    },
    onError: (error) => toast.error(error.message)
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, userIds }) => dashboardService.bulkUserAction(action, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
      toast.success(`عملیات گروهی با موفقیت انجام شد`);
    },
    onError: (error) => toast.error(error.message)
  });

  // Handlers
  const handleExport = () => {
    const data = usersData?.users.map(u => ({
      'نام': u.firstName,
      'نام خانوادگی': u.lastName,
      'نام کاربری': u.username,
      'ایمیل': u.email,
      'تلفن': u.phone,
      'نقش': USER_ROLES.find(r => r.value === u.role)?.label,
      'وضعیت': USER_STATUSES.find(s => s.value === u.status)?.label,
      'تاریخ ثبت‌نام': u.registeredAt
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('گزارش کاربران ذخیره شد');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      toast.loading('در حال پردازش فایل...');
      // اینجا می‌تونی فایل رو به API بفرستی
      setTimeout(() => {
        toast.success('فایل با موفقیت پردازش شد');
        refetch();
      }, 2000);
    };
    input.click();
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.error('هیچ کاربری انتخاب نشده است');
      return;
    }

    if (action === 'clear') {
      setSelectedUsers([]);
      return;
    }

    if (action === 'delete' && !confirm(`${selectedUsers.length} کاربر حذف شوند؟`)) {
      return;
    }

    bulkActionMutation.mutate({ action, userIds: selectedUsers });
  };

  const toggleSelectAll = () => {
    const currentPageUsers = usersData?.users || [];
    if (selectedUsers.length === currentPageUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentPageUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleBadge = (role) => {
    const roleInfo = USER_ROLES.find(r => r.value === role) || USER_ROLES[0];
    const Icon = roleInfo.icon;
    return (
      <span className="role-badge" style={{ backgroundColor: roleInfo.color + '20', color: roleInfo.color }}>
        <Icon /> {roleInfo.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusInfo = USER_STATUSES.find(s => s.value === status) || USER_STATUSES[1];
    const Icon = statusInfo.icon;
    return (
      <span className="status-badge" style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
        <Icon /> {statusInfo.label}
      </span>
    );
  };

  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / pagination.perPage);

  if (error) {
    return (
      <div className="error-state">
        <FaExclamationTriangle size={64} />
        <h3>خطا در بارگذاری کاربران</h3>
        <p>{error.message}</p>
        <button className="btn-primary" onClick={refetch}>
          <FaSync /> تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page admin-users-ultimate">
      {/* Header */}
      <div className="page-header-ultimate">
        <div className="header-content">
          <div>
            <h1>
              <FaUsersCog className="header-icon" />
              مدیریت کاربران
            </h1>
            <p>مدیریت کامل کاربران، نقش‌ها و دسترسی‌های سیستم</p>
          </div>
          <div className="header-stats-mini">
            <div className="mini-stat">
              <FaUserCheck />
              <span>{stats.active} فعال</span>
            </div>
            <div className="mini-stat">
              <FaUserClock />
              <span>{stats.pending} در انتظار</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-advanced">
        <AdvancedStatCard 
          title="کل کاربران" 
          value={stats.total} 
          icon={FaUsersCog} 
          color="blue" 
          trend={12}
          subtitle={`${stats.verified} تأیید شده`}
          loading={statsLoading}
        />
        <AdvancedStatCard 
          title="کاربران فعال" 
          value={stats.active} 
          icon={FaUserCheck} 
          color="green" 
          trend={8}
          subtitle={`${Math.round((stats.active / stats.total) * 100)}% از کل`}
          loading={statsLoading}
        />
        <AdvancedStatCard 
          title="ثبت‌نام جدید" 
          value={stats.newThisMonth} 
          icon={FaUserPlus} 
          color="purple" 
          trend={15}
          subtitle="در ۳۰ روز گذشته"
          loading={statsLoading}
        />
        <AdvancedStatCard 
          title="در انتظار تأیید" 
          value={stats.pending} 
          icon={FaUserClock} 
          color="orange"
          subtitle="نیاز به بررسی"
          loading={statsLoading}
        />
      </div>

      {/* Filter Bar */}
      <AdvancedFilterBar 
        filters={filters}
        setFilters={setFilters}
        onExport={handleExport}
        onImport={handleImport}
        onBulkAction={handleBulkAction}
        selectedCount={selectedUsers.length}
      />

      {/* Active Filters */}
      {Object.entries(filters).some(([_, v]) => v && v !== '') && (
        <div className="active-filters">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '') return null;
            let label = value;
            if (key === 'role') label = USER_ROLES.find(r => r.value === value)?.label;
            if (key === 'status') label = USER_STATUSES.find(s => s.value === value)?.label;
            
            return (
              <span key={key} className="filter-tag">
                {key}: {label}
                <button onClick={() => setFilters({...filters, [key]: ''})}>
                  <FaTimes />
                </button>
              </span>
            );
          })}
          <button 
            className="clear-filters"
            onClick={() => setFilters({
              search: '', role: '', status: '', gender: '',
              faculty: '', entryYear: '', emailVerified: ''
            })}
          >
            پاک کردن همه
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container-advanced">
        {isLoading ? (
          <TableSkeleton rows={pagination.perPage} />
        ) : users.length === 0 ? (
          <div className="empty-state-advanced">
            <FaUsersCog size={80} />
            <h3>کاربری یافت نشد</h3>
            <p>کاربری با این مشخصات در سیستم وجود ندارد</p>
            <button className="btn-primary">
              <FaUserPlus /> ایجاد کاربر جدید
            </button>
          </div>
        ) : (
          <table className="data-table-advanced">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>کاربر</th>
                <th>اطلاعات تماس</th>
                <th>کد دانشجویی/پرسنلی</th>
                <th>نقش</th>
                <th>وضعیت</th>
                <th>تاریخ ثبت‌نام</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={selectedUsers.includes(user.id) ? 'selected' : ''}
                >
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" />
                        ) : (
                          <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <strong>{user.firstName} {user.lastName}</strong>
                        <small>@{user.username}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info-cell">
                      <div><FaEnvelope /> {user.email}</div>
                      {user.phone && <div><FaPhone /> {user.phone}</div>}
                    </div>
                  </td>
                  <td>
                    <span className="id-cell">
                      {user.studentId || user.employeeId || <span className="text-muted">—</span>}
                    </span>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <div className="date-cell">
                      <FaCalendarAlt /> {user.registeredAt}
                    </div>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button 
                        className="action-btn"
                        onClick={() => setModalState({ type: 'view', user })}
                        title="مشاهده"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        title="ویرایش"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => {}}
                        title="ارسال پیام"
                      >
                        <FaPaperPlane />
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={() => setModalState({ type: 'delete', user })}
                        title="حذف"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <div className="pagination-advanced">
          <div className="pagination-info">
            نمایش {(pagination.page - 1) * pagination.perPage + 1} تا{' '}
            {Math.min(pagination.page * pagination.perPage, usersData?.total || 0)} از{' '}
            {usersData?.total?.toLocaleString('fa-IR') || 0} کاربر
          </div>
          
          <div className="pagination-controls">
            <button 
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              <FaChevronRight />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={pagination.page === pageNum ? 'active' : ''}
                  onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                >
                  {pageNum.toLocaleString('fa-IR')}
                </button>
              );
            })}
            
            {totalPages > 5 && pagination.page < totalPages - 2 && (
              <>
                <span>...</span>
                <button onClick={() => setPagination(p => ({ ...p, page: totalPages }))}>
                  {totalPages.toLocaleString('fa-IR')}
                </button>
              </>
            )}
            
            <button 
              disabled={pagination.page === totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              <FaChevronLeft />
            </button>
          </div>

          <select 
            value={pagination.perPage}
            onChange={(e) => setPagination({ page: 1, perPage: Number(e.target.value) })}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} در صفحه</option>
            ))}
          </select>
        </div>
      )}

      {/* Modals */}
      <UserDetailModal 
        user={modalState.user}
        isOpen={modalState.type === 'view'}
        onClose={() => setModalState({ type: null, user: null })}
        onUpdate={(user) => {
          setModalState({ type: null, user: null });
          navigate(`/admin/users/${user.id}/edit`);
        }}
      />

      <AnimatePresence>
        {modalState.type === 'delete' && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content confirm-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="confirm-icon danger">
                <FaExclamationTriangle />
              </div>
              <h3>حذف کاربر</h3>
              <p>آیا از حذف کاربر <strong>"{modalState.user?.firstName} {modalState.user?.lastName}"</strong> اطمینان دارید؟</p>
              <p className="warning-text">این عملیات قابل بازگشت نیست و تمام داده‌های کاربر حذف خواهد شد!</p>
              
              <div className="user-preview">
                <div className="user-avatar-large">
                  {modalState.user?.firstName?.[0]}{modalState.user?.lastName?.[0]}
                </div>
                <div>
                  <strong>{modalState.user?.firstName} {modalState.user?.lastName}</strong>
                  <span>{modalState.user?.email}</span>
                  <span>{USER_ROLES.find(r => r.value === modalState.user?.role)?.label}</span>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModalState({ type: null, user: null })}>
                  انصراف
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => {
                    deleteUserMutation.mutate(modalState.user.id);
                    setModalState({ type: null, user: null });
                  }}
                  disabled={deleteUserMutation.isLoading}
                >
                  {deleteUserMutation.isLoading ? <FaSpinner className="spinning" /> : <FaTrash />}
                  حذف کاربر
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
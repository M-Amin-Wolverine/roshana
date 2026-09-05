// ============================================================
// AdminCourses.jsx - نسخه فوق‌العاده مدیریت دوره‌ها
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaBook, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaUsers, FaStar, FaClock, FaCalendarAlt, FaVideo,
  FaImage, FaDollarSign, FaTag, FaCheckCircle, FaTimesCircle,
  FaChevronLeft, FaChevronRight, FaSync, FaEye,
  FaDownload, FaChartLine, FaLayerGroup, FaGraduationCap,
  FaSpinner, FaExclamationTriangle, FaCloudUploadAlt,
  FaList, FaThLarge, FaSort, FaSortUp, FaSortDown,
  FaCopy, FaArchive, FaShare, FaCertificate, FaPlay,
  FaPause, FaLock, FaGlobe, FaBan, FaCheck
} from 'react-icons/fa';
//import { dashboardService } from '../../services/api';
//import * as XLSX from 'xlsx';
import './AdminPages.css';

// ============================================================
// ثابت‌ها و تنظیمات
// ============================================================

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
const CATEGORIES = [
  'برنامه‌نویسی', 'طراحی', 'کسب و کار', 'زبان', 
  'ریاضیات', 'فیزیک', 'هنر', 'موسیقی', 'ورزشی'
];
const LEVELS = [
  { value: 'beginner', label: 'مقدماتی', color: '#10B981' },
  { value: 'intermediate', label: 'متوسط', color: '#F59E0B' },
  { value: 'advanced', label: 'پیشرفته', color: '#EF4444' },
  { value: 'expert', label: 'حرفه‌ای', color: '#8B5CF6' }
];
const STATUSES = [
  { value: 'draft', label: 'پیش‌نویس', color: '#94A3B8' },
  { value: 'published', label: 'منتشر شده', color: '#10B981' },
  { value: 'archived', label: 'بایگانی', color: '#6B7280' },
  { value: 'under_review', label: 'در انتظار بررسی', color: '#F59E0B' }
];

const ANIMATION_VARIANTS = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  scaleIn: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }
};

// ============================================================
// کامپوننت‌های کمکی پیشرفته
// ============================================================

// Skeleton Loader برای کارت دوره
const CourseCardSkeleton = () => (
  <div className="course-card skeleton">
    <div className="course-image skeleton-shimmer" />
    <div className="course-content">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text short" />
      <div className="course-meta">
        <div className="skeleton-meta" />
        <div className="skeleton-meta" />
        <div className="skeleton-meta" />
      </div>
      <div className="skeleton-footer" />
    </div>
  </div>
);

// کارت دوره پیشرفته
const AdvancedCourseCard = ({ course, onEdit, onDelete, onView, onDuplicate, onToggleStatus }) => {
  const levelInfo = LEVELS.find(l => l.value === course.level) || LEVELS[0];
  const statusInfo = STATUSES.find(s => s.value === course.status) || STATUSUS[0];
  
  return (
    <motion.div 
      className="course-card-advanced"
      whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Course Image */}
      <div className="course-image-wrapper">
        <img 
          src={course.thumbnail || '/api/placeholder/400/250'} 
          alt={course.title}
          loading="lazy"
        />
        <div className="course-overlay">
          <button className="overlay-btn" onClick={() => onView(course)}>
            <FaEye /> مشاهده
          </button>
          <button className="overlay-btn" onClick={() => onEdit(course)}>
            <FaEdit /> ویرایش
          </button>
        </div>
        
        {/* Badges */}
        <div className="course-badges">
          <span className="level-badge" style={{ backgroundColor: levelInfo.color }}>
            {levelInfo.label}
          </span>
          <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>
        
        {/* Featured Badge */}
        {course.isFeatured && (
          <div className="featured-badge">
            <FaStar /> ویژه
          </div>
        )}
      </div>
      
      {/* Course Content */}
      <div className="course-content">
        <h3 className="course-title" onClick={() => onView(course)}>
          {course.title}
        </h3>
        <p className="course-description">{course.description}</p>
        
        {/* Meta Info */}
        <div className="course-meta-grid">
          <div className="meta-item">
            <FaUsers className="meta-icon" />
            <span>{course.studentsCount?.toLocaleString('fa-IR') || 0}</span>
            <small>دانشجو</small>
          </div>
          <div className="meta-item">
            <FaVideo className="meta-icon" />
            <span>{course.lessonsCount || 0}</span>
            <small>جلسه</small>
          </div>
          <div className="meta-item">
            <FaClock className="meta-icon" />
            <span>{course.duration || '۰'}</span>
            <small>ساعت</small>
          </div>
          <div className="meta-item">
            <FaStar className="meta-icon star" />
            <span>{course.rating?.toFixed(1) || '۰.۰'}</span>
            <small>امتیاز</small>
          </div>
        </div>
        
        {/* Instructor & Price */}
        <div className="course-footer-info">
          <div className="instructor-info">
            <img src={course.instructorAvatar || '/api/placeholder/32/32'} alt="" />
            <span>{course.instructor}</span>
          </div>
          <div className="price-info">
            {course.price === 0 ? (
              <span className="free-price">رایگان</span>
            ) : (
              <>
                <span className="price-value">
                  {course.price?.toLocaleString('fa-IR')}
                </span>
                <span className="price-unit">تومان</span>
              </>
            )}
            {course.discountPrice && (
              <span className="discount-price">
                {course.discountPrice.toLocaleString('fa-IR')}
              </span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {course.completionRate > 0 && (
          <div className="course-progress">
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${course.completionRate}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span>{course.completionRate}% تکمیل شده</span>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="course-actions">
        <motion.button 
          className="action-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleStatus(course)}
          title={course.status === 'published' ? 'عدم انتشار' : 'انتشار'}
        >
          {course.status === 'published' ? <FaBan /> : <FaCheck />}
        </motion.button>
        
        <motion.button 
          className="action-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDuplicate(course)}
          title="کپی دوره"
        >
          <FaCopy />
        </motion.button>
        
        <motion.button 
          className="action-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(course)}
          title="ویرایش"
        >
          <FaEdit />
        </motion.button>
        
        <motion.button 
          className="action-btn danger"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(course)}
          title="حذف"
        >
          <FaTrash />
        </motion.button>
      </div>
    </motion.div>
  );
};

// مودال پیشرفته دوره
const CourseModalAdvanced = ({ course, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState(course || {
    title: '', description: '', instructor: '', instructorId: '',
    category: '', level: 'beginner', price: 0, discountPrice: null,
    duration: '', status: 'draft', thumbnail: '', trailerUrl: '',
    requirements: [], objectives: [], tags: [], isFeatured: false,
    hasCertificate: true, language: 'fa', maxStudents: null
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      // شبیه‌سازی آپلود
      await new Promise(r => setTimeout(r, 1000));
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, thumbnail: imageUrl }));
      toast.success('تصویر با موفقیت آپلود شد');
    } catch (error) {
      toast.error('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'اطلاعات پایه', icon: FaBook },
    { id: 'details', label: 'جزئیات', icon: FaList },
    { id: 'media', label: 'رسانه', icon: FaImage },
    { id: 'pricing', label: 'قیمت‌گذاری', icon: FaDollarSign },
    { id: 'settings', label: 'تنظیمات', icon: FaCog }
  ];

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
            className="modal-content modal-xl"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{mode === 'add' ? '➕ ایجاد دوره جدید' : '✏️ ویرایش دوره'}</h2>
                <p>{mode === 'add' ? 'اطلاعات دوره جدید را وارد کنید' : 'اطلاعات دوره را ویرایش کنید'}</p>
              </div>
              <button className="modal-close" onClick={onClose}>
                <FaTimesCircle size={24} />
              </button>
            </div>

            {/* Tabs */}
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

            <form onSubmit={handleSubmit} className="course-form-advanced">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <motion.div 
                  className="tab-content"
                  variants={ANIMATION_VARIANTS.fadeIn}
                  initial="initial"
                  animate="animate"
                >
                  <div className="form-group">
                    <label>عنوان دوره *</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="مثال: آموزش جامع React.js"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>توضیحات دوره *</label>
                    <textarea 
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="توضیحات کامل دوره..."
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>دسته‌بندی *</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">انتخاب کنید</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>سطح دوره *</label>
                      <div className="level-selector">
                        {LEVELS.map(level => (
                          <label key={level.value} className="level-option">
                            <input
                              type="radio"
                              name="level"
                              value={level.value}
                              checked={formData.level === level.value}
                              onChange={(e) => setFormData({...formData, level: e.target.value})}
                            />
                            <span style={{ backgroundColor: level.color }}>
                              {level.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>مدرس *</label>
                      <input 
                        type="text" 
                        value={formData.instructor}
                        onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>مدت زمان دوره</label>
                      <input 
                        type="text" 
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        placeholder="مثال: ۲۴ ساعت"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>تگ‌ها</label>
                    <input 
                      type="text" 
                      value={formData.tags?.join(', ')}
                      onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})}
                      placeholder="React, JavaScript, Web Development"
                    />
                  </div>
                </motion.div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <motion.div 
                  className="tab-content"
                  variants={ANIMATION_VARIANTS.fadeIn}
                  initial="initial"
                  animate="animate"
                >
                  <div className="form-group">
                    <label>پیش‌نیازها</label>
                    <textarea 
                      rows={3}
                      value={formData.requirements?.join('\n')}
                      onChange={(e) => setFormData({...formData, requirements: e.target.value.split('\n').filter(r => r.trim())})}
                      placeholder="هر خط یک پیش‌نیاز..."
                    />
                  </div>

                  <div className="form-group">
                    <label>اهداف دوره</label>
                    <textarea 
                      rows={3}
                      value={formData.objectives?.join('\n')}
                      onChange={(e) => setFormData({...formData, objectives: e.target.value.split('\n').filter(o => o.trim())})}
                      placeholder="هر خط یک هدف..."
                    />
                  </div>

                  <div className="form-group">
                    <label>زبان دوره</label>
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="fa">فارسی</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <motion.div 
                  className="tab-content"
                  variants={ANIMATION_VARIANTS.fadeIn}
                  initial="initial"
                  animate="animate"
                >
                  <div className="form-group">
                    <label>تصویر شاخص دوره</label>
                    <div className="image-upload-area">
                      {formData.thumbnail ? (
                        <div className="image-preview">
                          <img src={formData.thumbnail} alt="Preview" />
                          <button 
                            type="button" 
                            className="remove-image"
                            onClick={() => setFormData({...formData, thumbnail: ''})}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <label className="upload-label">
                          <FaCloudUploadAlt size={48} />
                          <span>کلیک کنید یا تصویر را بکشید</span>
                          <small>PNG, JPG, WebP - حداکثر ۵ مگابایت</small>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            hidden
                          />
                        </label>
                      )}
                      {uploading && <FaSpinner className="spinning" />}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>لینک ویدیو معرفی</label>
                    <input 
                      type="text" 
                      value={formData.trailerUrl}
                      onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </motion.div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <motion.div 
                  className="tab-content"
                  variants={ANIMATION_VARIANTS.fadeIn}
                  initial="initial"
                  animate="animate"
                >
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>قیمت (تومان)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>قیمت با تخفیف</label>
                      <input 
                        type="number" 
                        value={formData.discountPrice || ''}
                        onChange={(e) => setFormData({...formData, discountPrice: e.target.value ? Number(e.target.value) : null})}
                        min="0"
                      />
                    </div>
                  </div>

                  {formData.price > 0 && formData.discountPrice && (
                    <div className="discount-info">
                      <FaTag /> تخفیف: 
                      {Math.round((1 - formData.discountPrice / formData.price) * 100)}%
                    </div>
                  )}

                  <div className="form-group">
                    <label>حداکثر ظرفیت</label>
                    <input 
                      type="number" 
                      value={formData.maxStudents || ''}
                      onChange={(e) => setFormData({...formData, maxStudents: e.target.value ? Number(e.target.value) : null})}
                      placeholder="نامحدود"
                    />
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div 
                  className="tab-content"
                  variants={ANIMATION_VARIANTS.fadeIn}
                  initial="initial"
                  animate="animate"
                >
                  <div className="form-group">
                    <label>وضعیت دوره</label>
                    <div className="status-selector">
                      {STATUSES.map(status => (
                        <label key={status.value} className="status-option">
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            checked={formData.status === status.value}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                          />
                          <span style={{ backgroundColor: status.color }}>
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="settings-grid">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      />
                      <FaStar className="featured-icon" /> دوره ویژه
                    </label>

                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={formData.hasCertificate}
                        onChange={(e) => setFormData({...formData, hasCertificate: e.target.checked})}
                      />
                      <FaCertificate /> گواهی پایان دوره
                    </label>
                  </div>
                </motion.div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary">
                  {mode === 'add' ? (
                    <><FaPlus /> ایجاد دوره</>
                  ) : (
                    <><FaCheck /> ذخیره تغییرات</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// کامپوننت اصلی
// ============================================================

const AdminCourses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    status: '',
    instructor: ''
  });
  const [modalState, setModalState] = useState({
    type: null,
    course: null
  });
  const [selectedCourses, setSelectedCourses] = useState([]);

  // React Query - Fetch Courses
  const { 
    data: coursesData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-courses', filters, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () => dashboardService.getCourses({
      ...filters,
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder
    }),
    keepPreviousData: true
  });

  // React Query - Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-courses-stats'],
    queryFn: () => dashboardService.getCourseStats(),
    initialData: {
      total: 48,
      published: 35,
      draft: 8,
      archived: 5,
      students: 3240,
      revenue: 156000000,
      avgRating: 4.7,
      totalHours: 1240
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: dashboardService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('دوره با موفقیت ایجاد شد');
    },
    onError: (error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dashboardService.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('دوره با موفقیت بروزرسانی شد');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: dashboardService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('دوره با موفقیت حذف شد');
    },
    onError: (error) => toast.error(error.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => dashboardService.updateCourseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      toast.success('وضعیت دوره تغییر کرد');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: dashboardService.bulkDeleteCourses,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      setSelectedCourses([]);
      toast.success('دوره‌های انتخاب شده حذف شدند');
    }
  });

  // Handlers
  const handleSaveCourse = (courseData) => {
    if (modalState.type === 'add') {
      createMutation.mutate(courseData);
    } else {
      updateMutation.mutate({ id: modalState.course.id, data: courseData });
    }
    setModalState({ type: null, course: null });
  };

  const handleDeleteCourse = () => {
    deleteMutation.mutate(modalState.course.id);
    setModalState({ type: null, course: null });
  };

  const handleToggleStatus = (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    toggleStatusMutation.mutate({ id: course.id, status: newStatus });
  };

  const handleDuplicate = (course) => {
    const duplicatedCourse = {
      ...course,
      title: `${course.title} (کپی)`,
      status: 'draft',
      studentsCount: 0,
      rating: 0
    };
    createMutation.mutate(duplicatedCourse);
  };

  const handleExport = () => {
    const data = coursesData?.courses.map(c => ({
      'عنوان': c.title,
      'مدرس': c.instructor,
      'دسته‌بندی': c.category,
      'سطح': LEVELS.find(l => l.value === c.level)?.label,
      'دانشجویان': c.studentsCount,
      'قیمت': c.price,
      'وضعیت': STATUSES.find(s => s.value === c.status)?.label
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, `courses-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('گزارش با موفقیت ذخیره شد');
  };

  const handleBulkAction = (action) => {
    if (selectedCourses.length === 0) {
      toast.error('هیچ دوره‌ای انتخاب نشده است');
      return;
    }
    
    switch (action) {
      case 'delete':
        if (confirm(`${selectedCourses.length} دوره حذف شوند؟`)) {
          bulkDeleteMutation.mutate(selectedCourses);
        }
        break;
      case 'publish':
        selectedCourses.forEach(id => {
          toggleStatusMutation.mutate({ id, status: 'published' });
        });
        setSelectedCourses([]);
        break;
      case 'archive':
        selectedCourses.forEach(id => {
          toggleStatusMutation.mutate({ id, status: 'archived' });
        });
        setSelectedCourses([]);
        break;
    }
  };

  const courses = coursesData?.courses || [];
  const totalPages = Math.ceil((coursesData?.total || 0) / pageSize);

  if (error) {
    return (
      <div className="error-state">
        <FaExclamationTriangle size={64} />
        <h3>خطا در بارگذاری دوره‌ها</h3>
        <p>{error.message}</p>
        <button className="btn-primary" onClick={refetch}>
          <FaSync /> تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page admin-courses-ultimate">
      {/* Header */}
      <div className="page-header-ultimate">
        <div className="header-content">
          <div>
            <h1>
              <FaBook className="header-icon" />
              مدیریت دوره‌های آموزشی
            </h1>
            <p>ایجاد، ویرایش و مدیریت دوره‌های آموزشی دانشگاه روشنا</p>
          </div>
          <div className="header-stats">
            <div className="quick-stat">
              <FaBook />
              <span>{stats.total} دوره</span>
            </div>
            <div className="quick-stat">
              <FaUsers />
              <span>{stats.students?.toLocaleString('fa-IR')} دانشجو</span>
            </div>
            <div className="quick-stat">
              <FaStar className="star" />
              <span>{stats.avgRating} امتیاز</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {selectedCourses.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedCourses.length} دوره انتخاب شده</span>
              <button onClick={() => handleBulkAction('publish')}>
                <FaCheck /> انتشار
              </button>
              <button onClick={() => handleBulkAction('archive')}>
                <FaArchive /> بایگانی
              </button>
              <button className="danger" onClick={() => handleBulkAction('delete')}>
                <FaTrash /> حذف
              </button>
              <button onClick={() => setSelectedCourses([])}>
                <FaTimes /> لغو
              </button>
            </div>
          )}
          
          <button className="btn-secondary" onClick={handleExport}>
            <FaDownload /> خروجی Excel
          </button>
          <button 
            className="btn-primary"
            onClick={() => setModalState({ type: 'add', course: null })}
          >
            <FaPlus /> دوره جدید
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-advanced">
        <div className="stat-card-advanced">
          <div className="stat-icon blue">
            <FaBook />
          </div>
          <div className="stat-content">
            <span className="stat-label">کل دوره‌ها</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-trend positive">+۸ دوره جدید</span>
          </div>
        </div>
        
        <div className="stat-card-advanced">
          <div className="stat-icon green">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">منتشر شده</span>
            <span className="stat-value">{stats.published}</span>
            <span className="stat-trend">{Math.round((stats.published / stats.total) * 100)}%</span>
          </div>
        </div>
        
        <div className="stat-card-advanced">
          <div className="stat-icon orange">
            <FaSpinner />
          </div>
          <div className="stat-content">
            <span className="stat-label">پیش‌نویس</span>
            <span className="stat-value">{stats.draft}</span>
          </div>
        </div>
        
        <div className="stat-card-advanced">
          <div className="stat-icon purple">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-label">درآمد کل</span>
            <span className="stat-value">
              {(stats.revenue / 1000000).toFixed(1)}M
            </span>
            <span className="stat-trend positive">↑ ۱۲٪</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar-advanced">
        <div className="search-box-advanced">
          <FaSearch />
          <input 
            type="text" 
            placeholder="جستجو در عنوان، توضیحات یا مدرس..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="">همه دسته‌ها</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={filters.level}
            onChange={(e) => setFilters({...filters, level: e.target.value})}
          >
            <option value="">همه سطوح</option>
            {LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>

          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">همه وضعیت‌ها</option>
            {STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        <div className="view-controls">
          <div className="sort-control">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">تاریخ ایجاد</option>
              <option value="title">عنوان</option>
              <option value="studentsCount">تعداد دانشجو</option>
              <option value="price">قیمت</option>
              <option value="rating">امتیاز</option>
            </select>
            <button 
              className="sort-order"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
            </button>
          </div>

          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {Object.values(filters).some(v => v) && (
        <div className="active-filters">
          {Object.entries(filters).map(([key, value]) => value && (
            <span key={key} className="filter-tag">
              {key}: {value}
              <button onClick={() => setFilters({...filters, [key]: ''})}>
                <FaTimes />
              </button>
            </span>
          ))}
          <button 
            className="clear-filters"
            onClick={() => setFilters({ search: '', category: '', level: '', status: '' })}
          >
            پاک کردن همه
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="loading-grid">
          {Array(8).fill(null).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state-advanced">
          <FaBook size={80} />
          <h3>دوره‌ای یافت نشد</h3>
          <p>می‌توانید اولین دوره خود را ایجاد کنید</p>
          <button 
            className="btn-primary"
            onClick={() => setModalState({ type: 'add', course: null })}
          >
            <FaPlus /> ایجاد دوره جدید
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="courses-grid-advanced">
          {courses.map(course => (
            <AdvancedCourseCard
              key={course.id}
              course={course}
              onEdit={(c) => setModalState({ type: 'edit', course: c })}
              onDelete={(c) => setModalState({ type: 'delete', course: c })}
              onView={(c) => navigate(`/admin/courses/${c.id}`)}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        <div className="table-container-advanced">
          <table className="data-table-advanced">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox"
                    checked={selectedCourses.length === courses.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCourses(courses.map(c => c.id));
                      } else {
                        setSelectedCourses([]);
                      }
                    }}
                  />
                </th>
                <th>دوره</th>
                <th>مدرس</th>
                <th>دسته‌بندی</th>
                <th>سطح</th>
                <th>دانشجویان</th>
                <th>امتیاز</th>
                <th>قیمت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => {
                const levelInfo = LEVELS.find(l => l.value === course.level);
                const statusInfo = STATUSES.find(s => s.value === course.status);
                
                return (
                  <tr key={course.id}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses(prev => [...prev, course.id]);
                          } else {
                            setSelectedCourses(prev => prev.filter(id => id !== course.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <div className="course-info-cell">
                        <img src={course.thumbnail || '/api/placeholder/40/40'} alt="" />
                        <div>
                          <strong>{course.title}</strong>
                          <small>{course.duration} • {course.lessonsCount} جلسه</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="instructor-cell">
                        <img src={course.instructorAvatar || '/api/placeholder/24/24'} alt="" />
                        <span>{course.instructor}</span>
                      </div>
                    </td>
                    <td>{course.category}</td>
                    <td>
                      <span className="level-tag" style={{ backgroundColor: levelInfo?.color }}>
                        {levelInfo?.label}
                      </span>
                    </td>
                    <td>{course.studentsCount?.toLocaleString('fa-IR') || 0}</td>
                    <td>
                      <div className="rating-cell">
                        <FaStar className="star" />
                        <span>{course.rating?.toFixed(1) || '۰.۰'}</span>
                      </div>
                    </td>
                    <td>
                      {course.price === 0 ? (
                        <span className="free-tag">رایگان</span>
                      ) : (
                        course.price?.toLocaleString('fa-IR')
                      )}
                    </td>
                    <td>
                      <span className="status-tag" style={{ backgroundColor: statusInfo?.color }}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button onClick={() => navigate(`/admin/courses/${course.id}`)}>
                          <FaEye />
                        </button>
                        <button onClick={() => setModalState({ type: 'edit', course })}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDuplicate(course)}>
                          <FaCopy />
                        </button>
                        <button className="danger" onClick={() => setModalState({ type: 'delete', course })}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-advanced">
          <div className="pagination-info">
            نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, coursesData?.total || 0)} از {coursesData?.total} دوره
          </div>
          
          <div className="pagination-controls">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <FaChevronRight />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={currentPage === pageNum ? 'active' : ''}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span>...</span>
                <button onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
              </>
            )}
            
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <FaChevronLeft />
            </button>
          </div>

          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} در صفحه</option>
            ))}
          </select>
        </div>
      )}

      {/* Modals */}
      <CourseModalAdvanced
        course={modalState.course}
        isOpen={modalState.type === 'add' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, course: null })}
        onSave={handleSaveCourse}
        mode={modalState.type}
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
              <h3>حذف دوره</h3>
              <p>آیا از حذف دوره <strong>"{modalState.course?.title}"</strong> اطمینان دارید؟</p>
              <p className="warning-text">این عملیات قابل بازگشت نیست و تمام داده‌های مرتبط حذف خواهند شد!</p>
              
              <div className="course-preview">
                <img src={modalState.course?.thumbnail} alt="" />
                <div>
                  <span>{modalState.course?.studentsCount} دانشجو</span>
                  <span>{modalState.course?.lessonsCount} جلسه</span>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModalState({ type: null, course: null })}>
                  انصراف
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleDeleteCourse}
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? <FaSpinner className="spinning" /> : <FaTrash />}
                  حذف دوره
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCourses;
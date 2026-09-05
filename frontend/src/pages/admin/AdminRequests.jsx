// ============================================================
// AdminRequests.jsx - مدیریت درخواست‌ها و تیکت‌ها
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaClock,
  FaSearch, FaFilter, FaEye, FaReply, FaTrash, FaUser,
  FaCalendarAlt, FaTag, FaChevronLeft, FaChevronRight,
  FaSync, FaEnvelope, FaPhone, FaExclamationTriangle
} from 'react-icons/fa';
import './AdminPages.css';

// ============================================================
// کامپوننت‌های کمکی
// ============================================================

const RequestDetailModal = ({ request, isOpen, onClose, onUpdateStatus, onReply }) => {
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState(request?.status || 'pending');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(request.id, replyText);
      setReplyText('');
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    onUpdateStatus(request.id, newStatus);
  };

  return (
    <AnimatePresence>
      {isOpen && request && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="modal-content modal-lg"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>جزئیات درخواست #{request.id}</h2>
              <button className="modal-close" onClick={onClose}>
                <FaTimesCircle />
              </button>
            </div>

            <div className="request-detail">
              <div className="request-info">
                <div className="info-row">
                  <span className="label">عنوان:</span>
                  <span className="value">{request.title}</span>
                </div>
                <div className="info-row">
                  <span className="label">متقاضی:</span>
                  <span className="value">
                    <FaUser /> {request.userName} ({request.userEmail})
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">تاریخ ثبت:</span>
                  <span className="value">
                    <FaCalendarAlt /> {request.createdAt}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">نوع درخواست:</span>
                  <span className="value">
                    <span className={`type-badge ${request.type}`}>
                      {request.type === 'support' && 'پشتیبانی'}
                      {request.type === 'course' && 'مربوط به دوره'}
                      {request.type === 'payment' && 'پرداخت'}
                      {request.type === 'technical' && 'فنی'}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">اولویت:</span>
                  <span className="value">
                    <span className={`priority-badge ${request.priority}`}>
                      {request.priority === 'high' && <FaExclamationTriangle />}
                      {request.priority === 'high' && 'بالا'}
                      {request.priority === 'medium' && 'متوسط'}
                      {request.priority === 'low' && 'پایین'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="request-message">
                <h4>توضیحات درخواست:</h4>
                <p>{request.description}</p>
              </div>

              {request.replies && request.replies.length > 0 && (
                <div className="request-replies">
                  <h4>پاسخ‌های قبلی:</h4>
                  {request.replies.map((reply, index) => (
                    <div key={index} className={`reply-item ${reply.isAdmin ? 'admin' : 'user'}`}>
                      <div className="reply-header">
                        <span className="reply-author">{reply.author}</span>
                        <span className="reply-time">{reply.time}</span>
                      </div>
                      <p className="reply-content">{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="request-actions">
                <div className="status-selector">
                  <label>وضعیت:</label>
                  <div className="status-buttons">
                    <button 
                      className={`status-btn ${status === 'pending' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('pending')}
                    >
                      <FaClock /> در انتظار
                    </button>
                    <button 
                      className={`status-btn ${status === 'in-progress' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('in-progress')}
                    >
                      <FaSync className="spinning" /> در حال بررسی
                    </button>
                    <button 
                      className={`status-btn ${status === 'resolved' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('resolved')}
                    >
                      <FaCheckCircle /> حل شده
                    </button>
                  </div>
                </div>

                <div className="reply-box">
                  <textarea 
                    placeholder="پاسخ خود را بنویسید..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <button 
                    className="btn-primary"
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                  >
                    <FaReply /> ارسال پاسخ
                  </button>
                </div>
              </div>
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

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    priority: '',
    status: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10
  });
  const [stats, setStats] = useState({
    total: 23,
    pending: 8,
    inProgress: 5,
    resolved: 10
  });

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockRequests = [
        { id: 1, title: 'مشکل در دسترسی به دوره React', userName: 'علی رضایی', userEmail: 'ali@example.com', type: 'course', priority: 'high', status: 'pending', createdAt: '۱۴۰۲/۰۹/۱۵', description: 'بعد از پرداخت، دوره در پنل من نمایش داده نمی‌شود.' },
        { id: 2, title: 'درخواست استرداد وجه', userName: 'سارا محمدی', userEmail: 'sara@example.com', type: 'payment', priority: 'medium', status: 'in-progress', createdAt: '۱۴۰۲/۰۹/۱۴', description: 'متاسفانه دوره با انتظارات من مطابقت نداشت.' },
        { id: 3, title: 'خطا در ثبت‌نام', userName: 'رضا نوروزی', userEmail: 'reza@example.com', type: 'technical', priority: 'high', status: 'pending', createdAt: '۱۴۰۲/۰۹/۱۳', description: 'هنگام ثبت‌نام خطای ۵۰۰ دریافت می‌کنم.' },
        { id: 4, title: 'سوال درباره مدرک دوره', userName: 'فاطمه حسینی', userEmail: 'fatemeh@example.com', type: 'support', priority: 'low', status: 'resolved', createdAt: '۱۴۰۲/۰۹/۱۰', description: 'آیا مدرک دوره معتبر است؟' },
        { id: 5, title: 'مشکل در دانلود فایل‌ها', userName: 'محمد کریمی', userEmail: 'mohammad@example.com', type: 'technical', priority: 'medium', status: 'in-progress', createdAt: '۱۴۰۲/۰۹/۱۲', description: 'فایل‌های جلسه سوم قابل دانلود نیست.' },
      ];

      let filtered = mockRequests;
      if (filters.search) {
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.userName.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      if (filters.type) {
        filtered = filtered.filter(r => r.type === filters.type);
      }
      if (filters.priority) {
        filtered = filtered.filter(r => r.priority === filters.priority);
      }
      if (filters.status) {
        filtered = filtered.filter(r => r.status === filters.status);
      }

      setRequests(filtered);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest({
      ...request,
      replies: [
        { author: request.userName, text: request.description, time: request.createdAt, isAdmin: false }
      ]
    });
    setModalOpen(true);
  };

  const handleUpdateStatus = (requestId, newStatus) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: newStatus } : r
    ));
    if (selectedRequest) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const handleReply = (requestId, replyText) => {
    const newReply = {
      author: 'مدیر سیستم',
      text: replyText,
      time: new Date().toLocaleTimeString('fa-IR'),
      isAdmin: true
    };
    
    setSelectedRequest(prev => ({
      ...prev,
      replies: [...(prev.replies || []), newReply]
    }));
  };

  const handleDeleteRequest = (requestId) => {
    if (window.confirm('آیا از حذف این درخواست اطمینان دارید؟')) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const paginatedRequests = requests.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const totalPages = Math.ceil(requests.length / pagination.perPage);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: FaClock, label: 'در انتظار', color: 'orange' },
      'in-progress': { icon: FaSync, label: 'در حال بررسی', color: 'blue' },
      resolved: { icon: FaCheckCircle, label: 'حل شده', color: 'green' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`status-badge ${badge.color}`}>
        <badge.icon /> {badge.label}
      </span>
    );
  };

  return (
    <div className="admin-page admin-requests">
      {/* هدر صفحه */}
      <div className="page-header">
        <div>
          <h1><FaClipboardList /> مدیریت درخواست‌ها</h1>
          <p>بررسی و پاسخگویی به درخواست‌های کاربران</p>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="stats-mini-grid">
        <div className="stat-mini-card">
          <FaClipboardList className="icon" />
          <div>
            <span className="label">کل درخواست‌ها</span>
            <span className="value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-mini-card warning">
          <FaClock className="icon" />
          <div>
            <span className="label">در انتظار</span>
            <span className="value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-mini-card info">
          <FaSync className="icon" />
          <div>
            <span className="label">در حال بررسی</span>
            <span className="value">{stats.inProgress}</span>
          </div>
        </div>
        <div className="stat-mini-card success">
          <FaCheckCircle className="icon" />
          <div>
            <span className="label">حل شده</span>
            <span className="value">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="filter-toolbar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="جستجو در درخواست‌ها..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-selects">
          <select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">همه انواع</option>
            <option value="support">پشتیبانی</option>
            <option value="course">دوره</option>
            <option value="payment">پرداخت</option>
            <option value="technical">فنی</option>
          </select>

          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="">همه اولویت‌ها</option>
            <option value="high">بالا</option>
            <option value="medium">متوسط</option>
            <option value="low">پایین</option>
          </select>

          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="in-progress">در حال بررسی</option>
            <option value="resolved">حل شده</option>
          </select>
        </div>
      </div>

      {/* جدول درخواست‌ها */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading">
            <FaSync className="spinning" />
            <p>در حال بارگذاری درخواست‌ها...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>عنوان</th>
                <th>متقاضی</th>
                <th>نوع</th>
                <th>اولویت</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map(request => (
                <motion.tr 
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={request.priority === 'high' ? 'high-priority' : ''}
                >
                  <td>#{request.id}</td>
                  <td>
                    <div className="request-title">
                      {request.priority === 'high' && <FaExclamationTriangle className="high-priority-icon" />}
                      {request.title}
                    </div>
                  </td>
                  <td>
                    <div className="user-info-compact">
                      <strong>{request.userName}</strong>
                      <small>{request.userEmail}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge ${request.type}`}>
                      {request.type === 'support' && 'پشتیبانی'}
                      {request.type === 'course' && 'دوره'}
                      {request.type === 'payment' && 'پرداخت'}
                      {request.type === 'technical' && 'فنی'}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${request.priority}`}>
                      {request.priority === 'high' && 'بالا'}
                      {request.priority === 'medium' && 'متوسط'}
                      {request.priority === 'low' && 'پایین'}
                    </span>
                  </td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{request.createdAt}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon-sm"
                        onClick={() => handleViewRequest(request)}
                        title="مشاهده و پاسخ"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-icon-sm danger"
                        onClick={() => handleDeleteRequest(request.id)}
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

        {!loading && requests.length === 0 && (
          <div className="empty-state">
            <FaClipboardList size={64} />
            <h3>درخواستی یافت نشد</h3>
            <p>همه درخواست‌ها بررسی شده‌اند</p>
          </div>
        )}
      </div>

      {/* صفحه‌بندی */}
      {!loading && requests.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            نمایش {requests.length} درخواست
          </div>
          <div className="pagination-controls">
            <button 
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              <FaChevronRight />
            </button>
            <span className="page-indicator">
              صفحه {pagination.page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
            <button 
              disabled={pagination.page === totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              <FaChevronLeft />
            </button>
          </div>
        </div>
      )}

      {/* مودال جزئیات درخواست */}
      <RequestDetailModal 
        request={selectedRequest}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onReply={handleReply}
      />
    </div>
  );
};

export default AdminRequests;
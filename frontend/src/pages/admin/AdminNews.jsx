import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaPlus, FaEdit, FaTrash, FaSave, FaTimes,
  FaEye, FaEyeSlash, FaSearch, FaFilter,
  FaCalendarAlt, FaTag, FaImage, FaCheck
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    category_id: null,
    tags: [],
    is_published: false
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cms/news`);
      const data = await res.json();
      if (data.success) setNews(data.data);
    } catch (error) {
      toast.error('خطا در دریافت اخبار');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `${API_BASE_URL}/api/admin/cms/news/${editingId}`
        : `${API_BASE_URL}/api/admin/cms/news`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingId ? 'خبر ویرایش شد' : 'خبر جدید ایجاد شد');
        fetchNews();
        resetForm();
      }
    } catch (error) {
      toast.error('خطا در ذخیره خبر');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این خبر مطمئن هستید؟')) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/admin/cms/news/${id}`, { method: 'DELETE' });
      toast.success('خبر حذف شد');
      fetchNews();
    } catch (error) {
      toast.error('خطا در حذف خبر');
    }
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || '',
      image: item.featured_image || '',
      category_id: item.category_id,
      tags: item.tags ? JSON.parse(item.tags) : [],
      is_published: item.status === 'published'
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ title: '', content: '', excerpt: '', image: '', category_id: null, tags: [], is_published: false });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredNews = news.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === 'published' && item.status !== 'published') return false;
    if (filterStatus === 'draft' && item.status !== 'draft') return false;
    return true;
  });

  return (
    <div className="admin-news">
      <div className="page-header">
        <h2>📰 مدیریت اخبار</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <FaPlus /> خبر جدید
        </button>
      </div>

      {/* Search & Filter */}
      <div className="toolbar">
        <div className="search-box">
          <FaSearch />
          <input 
            placeholder="جستجوی خبر..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          {['all', 'published', 'draft'].map(status => (
            <button
              key={status}
              className={filterStatus === status ? 'active' : ''}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'همه' : status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="news-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>عنوان خبر *</label>
                  <input 
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>تصویر شاخص</label>
                  <input 
                    value={form.image}
                    onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="آدرس تصویر"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>خلاصه</label>
                <textarea 
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="form-group">
                <label>متن کامل *</label>
                <textarea 
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  required
                />
              </div>
              
              <div className="form-actions">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={form.is_published}
                    onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                  />
                  <span>منتشر شود</span>
                </label>
                
                <div className="buttons">
                  <button type="button" className="btn-cancel" onClick={resetForm}>
                    <FaTimes /> انصراف
                  </button>
                  <button type="submit" className="btn-primary">
                    <FaSave /> {editingId ? 'ویرایش' : 'ذخیره'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News List */}
      <div className="news-list">
        {loading ? (
          <div className="loading">در حال بارگذاری...</div>
        ) : filteredNews.length === 0 ? (
          <div className="empty">هیچ خبری یافت نشد</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>عنوان</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th>بازدید</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map(item => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>
                    <div className="news-title-cell">
                      {item.featured_image && (
                        <img src={item.featured_image} alt="" className="news-thumb" />
                      )}
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status}`}>
                      {item.status === 'published' ? '✅ منتشر شده' : '📝 پیش‌نویس'}
                    </span>
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>{item.view_count || 0}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-icon" title="ویرایش">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-icon danger" title="حذف">
                      <FaTrash />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminNews;
// ============================================================
// AdminSliders.jsx - نسخه Ultra
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaImage,
  FaSave, FaTimes, FaUpload, FaSearch, FaSort, FaFilter,
  FaChevronUp, FaChevronDown, FaGripVertical, FaExpand,
  FaCompress, FaCopy, FaCheck, FaSpinner, FaLink,
  FaCalendarAlt, FaClock, FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const AdminSliders = () => {
  // ============ State ============
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('order_index');
  const [expandedSlider, setExpandedSlider] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    mobile_image: '',
    link_url: '',
    link_text: '',
    button_color: '#3b82f6',
    button_text_color: '#ffffff',
    is_active: true,
    order_index: 0,
    start_date: '',
    end_date: '',
    overlay_opacity: 0.3,
    text_position: 'center' // left, center, right
  });

  const fileInputRef = useRef(null);

  // ============ Effects ============
  useEffect(() => { fetchSliders(); }, []);

  // ============ API Calls ============
  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/cms/sliders`);
      const data = await res.json();
      if (data.success) setSliders(data.data || []);
    } catch (error) {
      toast.error('❌ خطا در دریافت اسلایدرها');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.image) {
      toast.error('آدرس تصویر الزامی است');
      return;
    }

    setIsSaving(true);

    try {
      const url = editingId 
        ? `${API_BASE_URL}/api/admin/cms/sliders/${editingId}`
        : `${API_BASE_URL}/api/admin/cms/sliders`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? '✅ اسلایدر ویرایش شد' : '✅ اسلایدر جدید اضافه شد');
        fetchSliders();
        resetForm();
      } else {
        toast.error(data.message || 'خطا در ذخیره');
      }
    } catch (error) {
      toast.error('❌ خطا در ارتباط با سرور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این اسلایدر مطمئن هستید؟')) return;

    try {
      await fetch(`${API_BASE_URL}/api/admin/cms/sliders/${id}`, { method: 'DELETE' });
      toast.success('🗑️ اسلایدر حذف شد');
      fetchSliders();
    } catch (error) {
      toast.error('❌ خطا در حذف');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/cms/sliders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      setSliders(prev => prev.map(s => 
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
      
      toast.success(currentStatus ? '⏸️ اسلایدر غیرفعال شد' : '▶️ اسلایدر فعال شد');
    } catch (error) {
      toast.error('❌ خطا در تغییر وضعیت');
    }
  };

  const handleDuplicate = async (slider) => {
    const duplicatedForm = {
      ...slider,
      title: `${slider.title} (کپی)`,
      order_index: sliders.length + 1
    };
    
    try {
      await fetch(`${API_BASE_URL}/api/admin/cms/sliders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedForm)
      });
      toast.success('📋 اسلایدر کپی شد');
      fetchSliders();
    } catch (error) {
      toast.error('❌ خطا در کپی');
    }
  };

  const handleEdit = (slider) => {
    setForm({
      title: slider.title || '',
      subtitle: slider.subtitle || '',
      description: slider.description || '',
      image: slider.image || '',
      mobile_image: slider.mobile_image || '',
      link_url: slider.link_url || '',
      link_text: slider.link_text || '',
      button_color: slider.button_color || '#3b82f6',
      button_text_color: slider.button_text_color || '#ffffff',
      is_active: slider.is_active !== false,
      order_index: slider.order_index || 0,
      start_date: slider.start_date || '',
      end_date: slider.end_date || '',
      overlay_opacity: slider.overlay_opacity || 0.3,
      text_position: slider.text_position || 'center'
    });
    setEditingId(slider.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm({
      title: '', subtitle: '', description: '', image: '', mobile_image: '',
      link_url: '', link_text: '', button_color: '#3b82f6', button_text_color: '#ffffff',
      is_active: true, order_index: 0, start_date: '', end_date: '',
      overlay_opacity: 0.3, text_position: 'center'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleReorder = async (newOrder) => {
    // Optimistic update
    setSliders(newOrder);
    
    try {
      const updates = newOrder.map((slider, index) => ({
        id: slider.id,
        order_index: index + 1
      }));
      
      await fetch(`${API_BASE_URL}/api/admin/cms/sliders/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updates })
      });
      
      toast.success('✅ ترتیب اسلایدرها بروزرسانی شد');
    } catch (error) {
      fetchSliders(); // Revert on error
      toast.error('❌ خطا در تغییر ترتیب');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, image: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // ============ Computed ============
  const filteredSliders = sliders
    .filter(s => {
      if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus === 'active' && !s.is_active) return false;
      if (filterStatus === 'inactive' && s.is_active) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'order_index') return (a.order_index || 0) - (b.order_index || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'date') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

  const stats = {
    total: sliders.length,
    active: sliders.filter(s => s.is_active).length,
    inactive: sliders.filter(s => !s.is_active).length
  };

  // ============ Loading State ============
  if (loading) {
    return (
      <div className="admin-loading">
        <FaSpinner className="spinning" size={32} />
        <p>در حال بارگذاری اسلایدرها...</p>
      </div>
    );
  }

  return (
    <div className="admin-sliders-ultra">
      {/* ============ Header ============ */}
      <div className="page-header">
        <div className="header-left">
          <h2>
            <FaImage className="header-icon" />
            مدیریت اسلایدرها
          </h2>
          <p>مدیریت اسلایدرها و بنرهای صفحه اصلی</p>
        </div>
        <div className="header-right">
          <div className="quick-stats">
            <span className="stat-badge active">{stats.active} فعال</span>
            <span className="stat-badge inactive">{stats.inactive} غیرفعال</span>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'بستن فرم' : 'اسلایدر جدید'}
          </button>
        </div>
      </div>

      {/* ============ Form ============ */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="slider-form-advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="form-header">
                <h3>{editingId ? '✏️ ویرایش اسلایدر' : '➕ اسلایدر جدید'}</h3>
              </div>

              <div className="form-grid">
                {/* ستون اصلی */}
                <div className="form-col">
                  <div className="form-group">
                    <label>عنوان <span className="required">*</span></label>
                    <input 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="مثال: ترم جدید شروع شد!"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>زیرعنوان</label>
                    <input 
                      value={form.subtitle}
                      onChange={e => setForm({...form, subtitle: e.target.value})}
                      placeholder="متن زیر عنوان..."
                    />
                  </div>

                  <div className="form-group">
                    <label>توضیحات</label>
                    <textarea 
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="توضیحات اضافی..."
                      rows={3}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>آدرس تصویر <span className="required">*</span></label>
                      <div className="image-input-group">
                        <input 
                          value={form.image}
                          onChange={e => setForm({...form, image: e.target.value})}
                          placeholder="https://example.com/slider.jpg"
                          required
                        />
                        <button 
                          type="button" 
                          className="btn-upload"
                          onClick={() => fileInputRef.current?.click()}
                          title="آپلود تصویر"
                        >
                          <FaUpload />
                        </button>
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          hidden
                        />
                      </div>
                    </div>
                  </div>

                  {form.image && (
                    <div className="image-preview">
                      <img 
                        src={form.image} 
                        alt="Preview" 
                        onClick={() => setPreviewImage(form.image)}
                      />
                      <div className="preview-overlay">
                        <FaEye /> کلیک برای بزرگنمایی
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>تصویر موبایل</label>
                      <input 
                        value={form.mobile_image}
                        onChange={e => setForm({...form, mobile_image: e.target.value})}
                        placeholder="نسخه موبایل (اختیاری)"
                      />
                    </div>

                    <div className="form-group">
                      <label>متن دکمه</label>
                      <input 
                        value={form.link_text}
                        onChange={e => setForm({...form, link_text: e.target.value})}
                        placeholder="مثال: بیشتر بخوانید"
                      />
                    </div>
                  </div>
                </div>

                {/* ستون کناری */}
                <div className="form-col">
                  <div className="form-group">
                    <label>لینک</label>
                    <div className="input-with-icon">
                      <FaLink className="input-icon" />
                      <input 
                        value={form.link_url}
                        onChange={e => setForm({...form, link_url: e.target.value})}
                        placeholder="https://example.com/page"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>موقعیت متن</label>
                      <div className="position-selector">
                        {['right', 'center', 'left'].map(pos => (
                          <button
                            key={pos}
                            type="button"
                            className={`position-btn ${form.text_position === pos ? 'active' : ''}`}
                            onClick={() => setForm({...form, text_position: pos})}
                          >
                            {pos === 'right' ? 'راست' : pos === 'center' ? 'وسط' : 'چپ'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>رنگ دکمه</label>
                      <div className="color-input">
                        <input 
                          type="color" 
                          value={form.button_color}
                          onChange={e => setForm({...form, button_color: e.target.value})}
                        />
                        <input 
                          type="text"
                          value={form.button_color}
                          onChange={e => setForm({...form, button_color: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>رنگ متن دکمه</label>
                      <div className="color-input">
                        <input 
                          type="color" 
                          value={form.button_text_color}
                          onChange={e => setForm({...form, button_text_color: e.target.value})}
                        />
                        <input 
                          type="text"
                          value={form.button_text_color}
                          onChange={e => setForm({...form, button_text_color: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>شفافیت overlay</label>
                      <div className="range-input">
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1"
                          value={form.overlay_opacity}
                          onChange={e => setForm({...form, overlay_opacity: parseFloat(e.target.value)})}
                        />
                        <span>{Math.round(form.overlay_opacity * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>تاریخ شروع</label>
                      <input 
                        type="date" 
                        value={form.start_date}
                        onChange={e => setForm({...form, start_date: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>تاریخ پایان</label>
                      <input 
                        type="date" 
                        value={form.end_date}
                        onChange={e => setForm({...form, end_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ترتیب نمایش</label>
                    <input 
                      type="number" 
                      value={form.order_index}
                      onChange={e => setForm({...form, order_index: parseInt(e.target.value) || 0})}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={form.is_active}
                        onChange={e => setForm({...form, is_active: e.target.checked})}
                      />
                      <span className="checkbox-custom" />
                      <span>اسلایدر فعال باشد</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  <FaTimes /> انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {isSaving ? 'در حال ذخیره...' : editingId ? 'بروزرسانی' : 'ذخیره'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Toolbar ============ */}
      <div className="slider-toolbar">
        <div className="search-box">
          <FaSearch />
          <input 
            placeholder="جستجوی اسلایدر..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="filter-buttons">
            {[
              { value: 'all', label: 'همه' },
              { value: 'active', label: 'فعال' },
              { value: 'inactive', label: 'غیرفعال' }
            ].map(f => (
              <button
                key={f.value}
                className={filterStatus === f.value ? 'active' : ''}
                onClick={() => setFilterStatus(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="order_index">مرتب‌سازی: ترتیب</option>
            <option value="title">مرتب‌سازی: عنوان</option>
            <option value="date">مرتب‌سازی: تاریخ</option>
          </select>
        </div>
      </div>

      {/* ============ Sliders Grid ============ */}
      {filteredSliders.length === 0 ? (
        <div className="empty-state">
          <FaImage size={64} />
          <h3>اسلایدری یافت نشد</h3>
          <p>
            {search || filterStatus !== 'all' 
              ? 'فیلترها را تغییر دهید' 
              : 'اولین اسلایدر خود را ایجاد کنید'}
          </p>
          {!search && filterStatus === 'all' && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> ایجاد اسلایدر
            </button>
          )}
        </div>
      ) : (
        <Reorder.Group 
          axis="y" 
          values={filteredSliders}
          onReorder={handleReorder}
          className="sliders-grid-reorder"
        >
          {filteredSliders.map((slider, index) => (
            <Reorder.Item key={slider.id} value={slider}>
              <motion.div 
                className={`slider-card-advanced ${!slider.is_active ? 'inactive' : ''}`}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Drag Handle */}
                <div className="drag-handle">
                  <FaGripVertical />
                </div>

                {/* Image */}
                <div className="slider-image-section">
                  <img 
                    src={slider.image} 
                    alt={slider.title}
                    onClick={() => setPreviewImage(slider.image)}
                  />
                  <div className="image-order-badge">#{slider.order_index || index + 1}</div>
                  
                  {!slider.is_active && (
                    <div className="inactive-overlay">
                      <FaEyeSlash />
                      <span>غیرفعال</span>
                    </div>
                  )}

                  {/* Date Range */}
                  {(slider.start_date || slider.end_date) && (
                    <div className="date-range-badge">
                      <FaCalendarAlt size={10} />
                      {slider.start_date && new Date(slider.start_date).toLocaleDateString('fa-IR')}
                      {slider.start_date && slider.end_date && ' → '}
                      {slider.end_date && new Date(slider.end_date).toLocaleDateString('fa-IR')}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="slider-content-section">
                  <div className="slider-header">
                    <h4>{slider.title}</h4>
                    <button 
                      className="expand-btn"
                      onClick={() => setExpandedSlider(expandedSlider === slider.id ? null : slider.id)}
                    >
                      {expandedSlider === slider.id ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                  
                  {slider.subtitle && (
                    <p className="slider-subtitle">{slider.subtitle}</p>
                  )}

                  {slider.link_url && (
                    <a href={slider.link_url} className="slider-link" target="_blank">
                      <FaLink size={10} /> {slider.link_text || slider.link_url}
                    </a>
                  )}

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSlider === slider.id && (
                      <motion.div 
                        className="slider-expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {slider.description && (
                          <p className="slider-description">{slider.description}</p>
                        )}

                        <div className="slider-meta">
                          <span>
                            <FaClock size={10} />
                            ایجاد: {new Date(slider.created_at).toLocaleDateString('fa-IR')}
                          </span>
                          {slider.updated_at && (
                            <span>
                              <FaClock size={10} />
                              بروزرسانی: {new Date(slider.updated_at).toLocaleDateString('fa-IR')}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="slider-actions-section">
                  <button 
                    className={`action-btn ${slider.is_active ? 'success' : 'warning'}`}
                    onClick={() => handleToggle(slider.id, slider.is_active)}
                    title={slider.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                  >
                    {slider.is_active ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  
                  <button 
                    className="action-btn"
                    onClick={() => handleEdit(slider)}
                    title="ویرایش"
                  >
                    <FaEdit />
                  </button>
                  
                  <button 
                    className="action-btn"
                    onClick={() => handleDuplicate(slider)}
                    title="کپی"
                  >
                    <FaCopy />
                  </button>
                  
                  <button 
                    className="action-btn danger"
                    onClick={() => handleDelete(slider.id)}
                    title="حذف"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* ============ Image Preview Modal ============ */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            className="image-preview-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              className="preview-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <img src={previewImage} alt="Preview" />
              <button 
                className="close-preview"
                onClick={() => setPreviewImage(null)}
              >
                <FaTimes />
              </button>
              <a 
                href={previewImage} 
                target="_blank" 
                className="open-original"
              >
                <FaExpand /> مشاهده در تب جدید
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Stats Footer ============ */}
      <div className="slider-stats-footer">
        <span>مجموع: {stats.total} اسلایدر</span>
        <span className="separator">|</span>
        <span className="active-color">{stats.active} فعال</span>
        <span className="separator">|</span>
        <span className="inactive-color">{stats.inactive} غیرفعال</span>
      </div>
    </div>
  );
};

export default AdminSliders;
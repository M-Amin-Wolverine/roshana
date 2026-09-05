// ============================================================
// AdminReports.jsx - گزارشات و آمار پیشرفته
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaDownload, FaCalendarAlt, FaFilter,
  FaUsers, FaBook, FaDollarSign, FaChartBar, FaChartPie,
  FaFileExcel, FaFilePdf, FaPrint, FaSync
} from 'react-icons/fa';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import './AdminPages.css';

// ============================================================
// کامپوننت‌های کمکی
// ============================================================

const ReportCard = ({ title, children, actions }) => (
  <motion.div 
    className="report-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="report-header">
      <h3>{title}</h3>
      <div className="report-actions">{actions}</div>
    </div>
    <div className="report-content">
      {children}
    </div>
  </motion.div>
);

const KPIWidget = ({ title, value, change, icon: Icon, color }) => (
  <div className={`kpi-widget ${color}`}>
    <div className="kpi-icon">
      <Icon />
    </div>
    <div className="kpi-content">
      <span className="kpi-title">{title}</span>
      <span className="kpi-value">{value}</span>
      {change && (
        <span className={`kpi-change ${change > 0 ? 'positive' : 'negative'}`}>
          {change > 0 ? '+' : ''}{change}% نسبت به ماه قبل
        </span>
      )}
    </div>
  </div>
);

// ============================================================
// کامپوننت اصلی
// ============================================================

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: [],
    users: [],
    courses: [],
    categories: []
  });

  const COLORS = ['#4361ee', '#06d6a0', '#ffd166', '#ef476f', '#118ab2', '#8338ec'];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // داده‌های نمونه
      const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
      
      setReportData({
        revenue: months.map(month => ({
          name: month,
          درآمد: Math.floor(Math.random() * 50000000) + 20000000,
          سود: Math.floor(Math.random() * 30000000) + 10000000
        })),
        users: months.map(month => ({
          name: month,
          'کاربران جدید': Math.floor(Math.random() * 200) + 50,
          'کاربران فعال': Math.floor(Math.random() * 500) + 200
        })),
        courses: months.map(month => ({
          name: month,
          'ثبت‌نام دوره': Math.floor(Math.random() * 150) + 30,
          'تکمیل دوره': Math.floor(Math.random() * 100) + 20
        })),
        categories: [
          { name: 'برنامه‌نویسی', value: 45 },
          { name: 'طراحی', value: 20 },
          { name: 'کسب و کار', value: 15 },
          { name: 'زبان', value: 10 },
          { name: 'ریاضیات', value: 6 },
          { name: 'سایر', value: 4 }
        ]
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
    alert(`گزارش با فرمت ${format} در حال آماده‌سازی است...`);
  };

  const formatCurrency = (value) => {
    return (value / 1000000).toFixed(1) + 'M تومان';
  };

  return (
    <div className="admin-page admin-reports">
      {/* هدر صفحه */}
      <div className="page-header">
        <div>
          <h1><FaChartLine /> گزارشات و آمار</h1>
          <p>نمایش آمار و گزارشات تحلیلی سیستم</p>
        </div>
        <div className="header-actions">
          <select 
            className="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">هفته جاری</option>
            <option value="month">ماه جاری</option>
            <option value="quarter">سه ماهه</option>
            <option value="year">سال جاری</option>
          </select>
          <button className="btn-secondary" onClick={() => handleExport('excel')}>
            <FaFileExcel /> Excel
          </button>
          <button className="btn-secondary" onClick={() => handleExport('pdf')}>
            <FaFilePdf /> PDF
          </button>
          <button className="btn-icon" onClick={fetchReportData}>
            <FaSync className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="kpi-grid">
        <KPIWidget 
          title="درآمد کل"
          value="۱۵۶ میلیون تومان"
          change={12.5}
          icon={FaDollarSign}
          color="green"
        />
        <KPIWidget 
          title="کاربران فعال"
          value="۲,۴۵۰ نفر"
          change={8.3}
          icon={FaUsers}
          color="blue"
        />
        <KPIWidget 
          title="دوره‌های فعال"
          value="۴۸ دوره"
          change={-2.1}
          icon={FaBook}
          color="purple"
        />
        <KPIWidget 
          title="نرخ تکمیل دوره"
          value="۷۸٪"
          change={5.2}
          icon={FaChartBar}
          color="orange"
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <FaSync className="spinning" size={40} />
          <p>در حال بارگذاری گزارشات...</p>
        </div>
      ) : (
        <>
          {/* نمودار درآمد */}
          <ReportCard 
            title="روند درآمد و سود"
            actions={
              <>
                <button className="btn-icon-sm" onClick={() => handleExport('excel')}>
                  <FaDownload />
                </button>
              </>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={reportData.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="درآمد" fill="#4361ee" stroke="#4361ee" fillOpacity={0.3} />
                <Bar dataKey="سود" fill="#06d6a0" />
              </ComposedChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* نمودار کاربران */}
          <div className="reports-grid-2">
            <ReportCard title="رشد کاربران">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData.users}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="کاربران جدید" stroke="#4361ee" strokeWidth={2} />
                  <Line type="monotone" dataKey="کاربران فعال" stroke="#06d6a0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ReportCard>

            <ReportCard title="ثبت‌نام و تکمیل دوره‌ها">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.courses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ثبت‌نام دوره" fill="#ffd166" />
                  <Bar dataKey="تکمیل دوره" fill="#06d6a0" />
                </BarChart>
              </ResponsiveContainer>
            </ReportCard>
          </div>

          {/* نمودار دایره‌ای دسته‌بندی دوره‌ها */}
          <div className="reports-grid-2">
            <ReportCard title="توزیع دوره‌ها بر اساس دسته‌بندی">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ReportCard>

            <ReportCard title="آمار خلاصه">
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-label">میانگین درآمد ماهانه</span>
                  <span className="summary-value">۳۲.۵ میلیون تومان</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">بیشترین درآمد</span>
                  <span className="summary-value">شهریور (۵۴ میلیون)</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">میانگین ثبت‌نام روزانه</span>
                  <span className="summary-value">۲۴ کاربر</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">محبوب‌ترین دوره</span>
                  <span className="summary-value">React.js (۱,۲۵۰ دانشجو)</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">نرخ بازگشت سرمایه</span>
                  <span className="summary-value positive">۲۴۵٪</span>
                </div>
              </div>
            </ReportCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
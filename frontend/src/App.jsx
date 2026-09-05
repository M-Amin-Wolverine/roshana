// ============================================
// 🚀 App.jsx - نسخه نهایی با هوم عمومی
// ============================================
/* 
import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
// در App.jsx اضافه کن:
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminRequests from './pages/admin/AdminRequests';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';*/

// ... بقیه صفحات


// ============================================
// 📦 Lazy Loading
// ============================================
/*const HomePage = lazy(() => import('./pages/home/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const OtpVerifyPageUltimate = lazy(() => import('./pages/otp-verify/OtpVerifyPageUltimate'))
/* const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage')) */
/*const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))*/

// ============================================
// ⏳ Loader
// ============================================
/*const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  }}>
    ⏳ در حال بارگذاری...
  </div>
)
*/
// ============================================
// 🔒 Protected Route (فقط برای صفحاتی که نیاز به لاگین دارن)
// ============================================
/*const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <PageLoader />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}*/

// ============================================
// 🎯 کامپوننت اصلی App
// ============================================
/*function App() {
  const { loading } = useAuth()
  
  if (loading) return <PageLoader />
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>*/
        {/* 📍 صفحات عمومی - همه می‌تونن ببینن */}
        /*<Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} /> 
        <Route path="/Reset-passwd" element={<ResetPasswordPage />} /> 
        <Route path="/Forgot-passwd" element={<ForgotPasswordPage />} /> 
        <Route path="/otp-verify" element={<OtpVerifyPageUltimate />} />
        // در Routes اضافه کن:
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>*/
{/*         <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} /> */}
        
        {/* 🔒 صفحات خصوصی - فقط لاگین شده‌ها */}
{/*         <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } /> */}
        
        {/* 📄 صفحه 404 */}
        /*<Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App */
// ============================================
// 🚀 App.jsx - نسخه نهایی با هوم عمومی
// (فقط ThemeProvider و ThemeManager اضافه شده)
// ============================================

import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// ✅ اضافه کردن ThemeProvider
import { ThemeProvider } from './context/ThemeContext'
import ThemeManager from './components/ThemeManager/ThemeManager'
import SignupPage from './pages/SignupPage';
import ActivationPage from './pages/ActivationPage';
import ModuleManager from './pages/admin/ModuleManager';
// Admin imports
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminRequests from './pages/admin/AdminRequests';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';

// ============================================
// 📦 Lazy Loading
// ============================================
const HomePage = lazy(() => import('./pages/home/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const OtpVerifyPageUltimate = lazy(() => import('./pages/otp-verify/OtpVerifyPageUltimate'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// ============================================
// ⏳ Loader
// ============================================
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  }}>
    ⏳ در حال بارگذاری...
  </div>
)

// ============================================
// 🔒 Protected Route
// ============================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <PageLoader />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// ============================================
// 🎯 کامپوننت اصلی App
// ============================================
function App() {
  const { loading } = useAuth()
  
  if (loading) return <PageLoader />
  
  return (
    // ✅ کل اپلیکیشن رو با ThemeProvider بپیچ
    <ThemeProvider>
      <Suspense fallback={<PageLoader />}>
                <Routes>
          {/* 📍 صفحات عمومی */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/Register" element={<RegisterPage />} />
          <Route path="/Reset-passwd" element={<ResetPasswordPage />} />
          <Route path="/Forgot-passwd" element={<ForgotPasswordPage />} />
          <Route path="/otp-verify" element={<OtpVerifyPageUltimate />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/activation" element={<ActivationPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>
          
          {/* ✅ این Route را داخل Routes بیاورید */}
          <Route path="/admin/modules" element={
            <ProtectedRoute>
              <ModuleManager />
            </ProtectedRoute>
          } />
          
          {/* 📄 صفحه 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* ✅ پنل مدیریت تم - همیشه در دسترس */}
        <ThemeManager />
      </Suspense>
    </ThemeProvider>
  )
}

export default App
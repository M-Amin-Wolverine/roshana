import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'

// Layouts
import MainLayout from '../components/layout/MainLayout'
import AuthLayout from '../components/layout/AuthLayout'
import AdminLayout from '../components/layout/AdminLayout'

// صفحات با Lazy Loading
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
)

// صفحات عمومی
const Home = lazy(() => import('../pages/home/Home'))
const Login = lazy(() => import('../pages/LoginPage/LoginPage'))
const Register = lazy(() => import('../pages/auth/RegisterPage'))
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPasswordPage'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPasswordPage'))

// صفحات داشبورد
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const Classroom = lazy(() => import('../pages/classroom/Classroom'))
const Live = lazy(() => import('../pages/live/Live'))
const Library = lazy(() => import('../pages/library/Library'))
const Calendar = lazy(() => import('../pages/calendar/Calendar'))

// صفحات ارتباطی
const Messaging = lazy(() => import('../pages/messaging/Messaging'))
const Forum = lazy(() => import('../pages/forum/Forum'))

// صفحات خدمات
const Automation = lazy(() => import('../pages/automation/Automation'))
const Food = lazy(() => import('../pages/food/Food'))
const Transport = lazy(() => import('../pages/transport/Transport'))
const Dormitory = lazy(() => import('../pages/dormitory/Dormitory'))

// صفحات مالی
const Wallet = lazy(() => import('../pages/wallet/Wallet'))
const Transactions = lazy(() => import('../pages/wallet/Transactions'))
const Payments = lazy(() => import('../pages/wallet/Payments'))

// صفحات پروفایل
const Profile = lazy(() => import('../pages/profile/Profile'))
const Settings = lazy(() => import('../pages/settings/Settings'))

// صفحات مدیریت
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const Users = lazy(() => import('../pages/admin/Users'))
const UserDetail = lazy(() => import('../pages/admin/UserDetail'))
const Reports = lazy(() => import('../pages/admin/Reports'))
const AdminSettings = lazy(() => import('../pages/admin/Settings'))
const SystemLogs = lazy(() => import('../pages/admin/Logs'))

// صفحات خطا
const NotFound = lazy(() => import('../pages/errors/NotFound'))
const Forbidden = lazy(() => import('../pages/errors/Forbidden'))
const Maintenance = lazy(() => import('../pages/errors/Maintenance'))

// 🔐 Protected Route
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/forbidden'
}) => {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to={fallbackPath} state={{ requiredRoles }} replace />
  }

  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return <Navigate to={fallbackPath} state={{ requiredPermissions }} replace />
  }

  return children
}

// 🚪 Public Only Route
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }
  
  return children
}

// 📜 اسکرول به بالا
const ScrollToTop = () => {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  
  return null
}

// 🔁 ریدایرکت هوشمند بر اساس نقش
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/app/dashboard" replace />
}

// 🎯 Suspense Wrapper
const PageWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
)

// ==================== روتر اصلی ====================
const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ==================== صفحات عمومی ==================== */}
        
        <Route path="/" element={<RoleBasedRedirect />} />
        
        {/* ✅ صفحه لاگین در /login */}
        <Route 
          path="/login" 
          element={
            <PublicOnlyRoute>
              <PageWrapper>
                <AuthLayout>
                  <Login />
                </AuthLayout>
              </PageWrapper>
            </PublicOnlyRoute>
          } 
        />

        {/* صفحه خانه عمومی */}
        <Route 
          path="/home" 
          element={
            <PageWrapper>
              <AuthLayout>
                <Home />
              </AuthLayout>
            </PageWrapper>
          } 
        />

        {/* صفحات احراز هویت */}
        <Route path="/auth" element={<PublicOnlyRoute><PageWrapper><AuthLayout /></PageWrapper></PublicOnlyRoute>}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* ==================== صفحات محافظت‌شده ==================== */}
        
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <PageWrapper>
                <MainLayout />
              </PageWrapper>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="classroom" element={<Classroom />} />
          <Route path="classroom/:classId" element={<Classroom />} />
          <Route path="live" element={<Live />} />
          <Route path="library" element={<Library />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="messaging/:conversationId" element={<Messaging />} />
          <Route path="forum" element={<Forum />} />
          <Route path="forum/:topicId" element={<Forum />} />
          <Route path="automation" element={<Automation />} />
          <Route path="food" element={<Food />} />
          <Route path="transport" element={<Transport />} />
          <Route path="dormitory" element={<Dormitory />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ==================== صفحات مدیریت ==================== */}
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <PageWrapper>
                <AdminLayout />
              </PageWrapper>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ProtectedRoute requiredPermissions={['users.view']}><Users /></ProtectedRoute>} />
          <Route path="users/:userId" element={<ProtectedRoute requiredPermissions={['users.view', 'users.edit']}><UserDetail /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute requiredPermissions={['reports.view']}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute requiredPermissions={['settings.manage']}><AdminSettings /></ProtectedRoute>} />
          <Route path="logs" element={<ProtectedRoute requiredRoles={['superadmin']}><SystemLogs /></ProtectedRoute>} />
        </Route>

        {/* ==================== صفحات خطا ==================== */}
        
        <Route path="/404" element={<PageWrapper><NotFound /></PageWrapper>} />
        <Route path="/forbidden" element={<PageWrapper><Forbidden /></PageWrapper>} />
        <Route path="/maintenance" element={<PageWrapper><Maintenance /></PageWrapper>} />
        
        {/* 🔄 ریدایرکت همه مسیرهای ناشناخته */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  )
}

export default AppRouter
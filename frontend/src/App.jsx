import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { APP_ROUTES } from './constants/routes'
import { PRIVATE_ROLES, ROLES } from './constants/roles'
import LoadingSpinner from './components/ui/LoadingSpinner'
import AIChatBubble from './components/ai/AIChatBubble'

// Lazy load pages for Route-level code splitting
const HomePage = lazy(() => import('./pages/public/HomePage'))
const LoginPage = lazy(() => import('./pages/public/LoginPage'))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'))
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/shared/DashboardPage'))
const ForbiddenPage = lazy(() => import('./pages/shared/ForbiddenPage'))
const NotFoundPage = lazy(() => import('./pages/shared/NotFoundPage'))
const SportPage = lazy(() => import('./pages/public/SportPage'))
const MatchDetailPage = lazy(() => import('./pages/public/MatchDetailPage'))
const NewsListPage = lazy(() => import('./pages/public/NewsListPage'))
const NewsDetailPage = lazy(() => import('./pages/public/NewsDetailPage'))
const SeatSelectPage = lazy(() => import('./pages/audience/SeatSelectPage'))
const CheckoutPage = lazy(() => import('./pages/audience/CheckoutPage'))
const PaymentSuccessPage = lazy(() => import('./pages/audience/PaymentSuccessPage'))
const MyTicketsPage = lazy(() => import('./pages/audience/MyTicketsPage'))
const CheckerDashboard = lazy(() => import('./pages/checker/CheckerDashboard'))
const QRScanPage = lazy(() => import('./pages/checker/QRScanPage'))
const LiveSeatMapPage = lazy(() => import('./pages/checker/LiveSeatMapPage'))
const EditorDashboard = lazy(() => import('./pages/editor/EditorDashboard'))
const NewsCreatePage = lazy(() => import('./pages/editor/NewsCreatePage'))
const NewsEditPage = lazy(() => import('./pages/editor/NewsEditPage'))
const EditorNotificationsPage = lazy(() => import('./pages/editor/EditorNotificationsPage'))
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'))
const MatchCreatePage = lazy(() => import('./pages/manager/MatchCreatePage'))
const MatchEditPage = lazy(() => import('./pages/manager/MatchEditPage'))
const StandConfigPage = lazy(() => import('./pages/manager/StandConfigPage'))
const MatchAnalyticsPage = lazy(() => import('./pages/manager/MatchAnalyticsPage'))
const ManagerNotificationsPage = lazy(() => import('./pages/manager/ManagerNotificationsPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ApprovalsPage = lazy(() => import('./pages/admin/ApprovalsPage'))
const UserManagePage = lazy(() => import('./pages/admin/UserManagePage'))
const SportsManagePage = lazy(() => import('./pages/admin/SportsManagePage'))
const LeagueManagePage = lazy(() => import('./pages/admin/LeagueManagePage'))
const RevenueReportPage = lazy(() => import('./pages/admin/RevenueReportPage'))

export default function App() {
  return (
    <div className="app-shell flex flex-col min-h-screen relative">
      <Navbar />
      <main className="app-main flex-1 relative">
        <Suspense fallback={<LoadingSpinner text="Đang tải trang..." />}>
          <Routes>
            <Route path={APP_ROUTES.HOME} element={<HomePage />} />
            <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={APP_ROUTES.NEWS} element={<NewsListPage />} />
            <Route path={APP_ROUTES.NEWS_DETAIL} element={<NewsDetailPage />} />
            <Route path={APP_ROUTES.MATCH_DETAIL} element={<MatchDetailPage />} />
            <Route path={APP_ROUTES.SPORTS} element={<SportPage />} />
            <Route path={APP_ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

            <Route element={<ProtectedRoute allowedRoles={PRIVATE_ROLES} />}>
              <Route path={APP_ROUTES.ONBOARDING} element={<OnboardingPage />} />
              <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.AUDIENCE]} />}>
              <Route path={APP_ROUTES.SEAT_SELECT} element={<SeatSelectPage />} />
              <Route path={APP_ROUTES.CHECKOUT} element={<CheckoutPage />} />
              <Route path={APP_ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
              <Route path={APP_ROUTES.MY_TICKETS} element={<MyTicketsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.CHECKER]} />}>
              <Route path={APP_ROUTES.CHECKER_DASHBOARD} element={<CheckerDashboard />} />
              <Route path={APP_ROUTES.CHECKER_SCAN} element={<QRScanPage />} />
              <Route path={APP_ROUTES.CHECKER_LIVE_SEATS} element={<LiveSeatMapPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.EDITOR]} />}>
              <Route path={APP_ROUTES.EDITOR_DASHBOARD} element={<EditorDashboard />} />
              <Route path={APP_ROUTES.EDITOR_NEWS_CREATE} element={<NewsCreatePage />} />
              <Route path={APP_ROUTES.EDITOR_NEWS_EDIT} element={<NewsEditPage />} />
              <Route path={APP_ROUTES.EDITOR_NOTIFICATIONS} element={<EditorNotificationsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]} />}>
              <Route path={APP_ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
              <Route path={APP_ROUTES.MANAGER_MATCH_CREATE} element={<MatchCreatePage />} />
              <Route path={APP_ROUTES.MANAGER_MATCH_EDIT} element={<MatchEditPage />} />
              <Route path={APP_ROUTES.MANAGER_STAND_CONFIG} element={<StandConfigPage />} />
              <Route path={APP_ROUTES.MANAGER_ANALYTICS} element={<MatchAnalyticsPage />} />
              <Route path={APP_ROUTES.MANAGER_NOTIFICATIONS} element={<ManagerNotificationsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
              <Route path={APP_ROUTES.ADMIN_APPROVALS} element={<ApprovalsPage />} />
              <Route path={APP_ROUTES.ADMIN_USERS} element={<UserManagePage />} />
              <Route path={APP_ROUTES.ADMIN_SPORTS} element={<SportsManagePage />} />
              <Route path={APP_ROUTES.ADMIN_LEAGUES} element={<LeagueManagePage />} />
              <Route path={APP_ROUTES.ADMIN_REVENUE_REPORT} element={<RevenueReportPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
            <Route path="" element={<Navigate to={APP_ROUTES.HOME} replace />} />
          </Routes>
        </Suspense>
      </main>
      <AIChatBubble />
      <Footer />
    </div>
  )
}

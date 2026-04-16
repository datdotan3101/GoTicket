import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { APP_ROUTES } from './constants/routes'
import { PRIVATE_ROLES, ROLES } from './constants/roles'
import HomePage from './pages/public/HomePage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import DashboardPage from './pages/shared/DashboardPage'
import ForbiddenPage from './pages/shared/ForbiddenPage'
import NotFoundPage from './pages/shared/NotFoundPage'
import SportPage from './pages/public/SportPage'
import MatchDetailPage from './pages/public/MatchDetailPage'
import NewsListPage from './pages/public/NewsListPage'
import NewsDetailPage from './pages/public/NewsDetailPage'
import SeatSelectPage from './pages/audience/SeatSelectPage'
import CheckoutPage from './pages/audience/CheckoutPage'
import PaymentSuccessPage from './pages/audience/PaymentSuccessPage'
import MyTicketsPage from './pages/audience/MyTicketsPage'
import CheckerDashboard from './pages/checker/CheckerDashboard'
import QRScanPage from './pages/checker/QRScanPage'
import LiveSeatMapPage from './pages/checker/LiveSeatMapPage'
import EditorDashboard from './pages/editor/EditorDashboard'
import NewsCreatePage from './pages/editor/NewsCreatePage'
import NewsEditPage from './pages/editor/NewsEditPage'
import EditorNotificationsPage from './pages/editor/EditorNotificationsPage'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import MatchCreatePage from './pages/manager/MatchCreatePage'
import MatchEditPage from './pages/manager/MatchEditPage'
import StandConfigPage from './pages/manager/StandConfigPage'
import MatchAnalyticsPage from './pages/manager/MatchAnalyticsPage'
import ManagerNotificationsPage from './pages/manager/ManagerNotificationsPage'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
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

          <Route path="*" element={<NotFoundPage />} />
          <Route path="" element={<Navigate to={APP_ROUTES.HOME} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import GuestRoute from './components/layout/GuestRoute'
import { APP_ROUTES } from './constants/routes'
import { PRIVATE_ROLES, ROLES } from './constants/roles'
import LoadingSpinner from './components/ui/LoadingSpinner'
import AIChatBubble from './components/ai/AIChatBubble'
import AdminLayout from './common/AdminLayout'
import ManagerLayout from './common/ManagerLayout'

// Lazy load pages for Route-level code splitting
const HomePage = lazy(() => import('./pages/public/HomePage'))
const LoginPage = lazy(() => import('./pages/public/LoginPage'))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'))
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/shared/DashboardPage'))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))
const ForbiddenPage = lazy(() => import('./pages/shared/ForbiddenPage'))
const NotFoundPage = lazy(() => import('./pages/shared/NotFoundPage'))
const SportPage = lazy(() => import('./pages/public/SportPage'))
const MatchDetailPage = lazy(() => import('./pages/public/MatchDetailPage'))
const SearchResultsPage = lazy(() => import('./pages/public/SearchResultsPage'))
const SeatSelectPage = lazy(() => import('./pages/audience/SeatSelectPage'))
const CheckoutPage = lazy(() => import('./pages/audience/CheckoutPage'))
const PaymentSuccessPage = lazy(() => import('./pages/audience/PaymentSuccessPage'))
const MyTicketsPage = lazy(() => import('./pages/audience/MyTicketsPage'))
const TicketDetailPage = lazy(() => import('./pages/audience/TicketDetailPage'))
const CheckerDashboard = lazy(() => import('./pages/checker/CheckerDashboard'))
const QRScanPage = lazy(() => import('./pages/checker/QRScanPage'))
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'))
const MatchCreatePage = lazy(() => import('./pages/manager/MatchCreatePage'))
const MatchEditPage = lazy(() => import('./pages/manager/MatchEditPage'))
const StandConfigPage = lazy(() => import('./pages/manager/StandConfigPage'))
const MatchAnalyticsPage = lazy(() => import('./pages/manager/MatchAnalyticsPage'))
const ManagerMatchesPage = lazy(() => import('./pages/manager/ManagerMatchesPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UserManagePage = lazy(() => import('./features/admin/users/UserManagePage'))
const SportsManagePage = lazy(() => import('./pages/admin/SportsManagePage'))
const LeagueManagePage = lazy(() => import('./pages/admin/LeagueManagePage'))
const MatchManagePage = lazy(() => import('./pages/admin/MatchManagePage'))
const ClubManagePage = lazy(() => import('./pages/admin/ClubManagePage'))
const StadiumManagePage = lazy(() => import('./pages/admin/StadiumManagePage'))
const MailboxPage = lazy(() => import('./pages/common/MailboxPage'))

export default function App() {
  return (
    <div className="app-shell flex flex-col min-h-screen relative">
      <Navbar />
      <main className="app-main flex-1 relative">
        <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
          <Routes>
            <Route path={APP_ROUTES.HOME} element={<HomePage />} />
            <Route element={<GuestRoute />}>
              <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
            </Route>
            <Route path={APP_ROUTES.SEARCH} element={<SearchResultsPage />} />
            <Route path={APP_ROUTES.MATCH_DETAIL} element={<MatchDetailPage />} />
            <Route path={APP_ROUTES.SPORTS} element={<SportPage />} />
            <Route path={APP_ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

            <Route element={<ProtectedRoute allowedRoles={PRIVATE_ROLES} />}>
              <Route path={APP_ROUTES.ONBOARDING} element={<OnboardingPage />} />
              <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.AUDIENCE]} />}>
              <Route path={APP_ROUTES.SEAT_SELECT} element={<SeatSelectPage />} />
              <Route path={APP_ROUTES.CHECKOUT} element={<CheckoutPage />} />
              <Route path={APP_ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
              <Route path={APP_ROUTES.MY_TICKETS} element={<MyTicketsPage />} />
              <Route path={APP_ROUTES.TICKET_DETAIL} element={<TicketDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.CHECKER]} />}>
              <Route path={APP_ROUTES.CHECKER_DASHBOARD} element={<CheckerDashboard />} />
              <Route path={APP_ROUTES.CHECKER_SCAN} element={<QRScanPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]} />}>
              <Route element={<ManagerLayout />}>
                <Route path={APP_ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
                <Route path={APP_ROUTES.MANAGER_MATCHES} element={<ManagerMatchesPage />} />
                <Route path={APP_ROUTES.MANAGER_MATCH_CREATE} element={<MatchCreatePage />} />
                <Route path={APP_ROUTES.MANAGER_MATCH_EDIT} element={<MatchEditPage />} />
                <Route path={APP_ROUTES.MANAGER_STAND_CONFIG} element={<StandConfigPage />} />
                <Route path={APP_ROUTES.MANAGER_ANALYTICS} element={<MatchAnalyticsPage />} />
                <Route path={APP_ROUTES.MANAGER_MAILBOX} element={<MailboxPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route element={<AdminLayout />}>
                <Route path={APP_ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                <Route path={APP_ROUTES.ADMIN_USERS} element={<UserManagePage />} />
                <Route path={APP_ROUTES.ADMIN_MANAGERS} element={<UserManagePage />} />
                <Route path={APP_ROUTES.ADMIN_SPORTS} element={<SportsManagePage />} />
                <Route path={APP_ROUTES.ADMIN_LEAGUES} element={<LeagueManagePage />} />
                <Route path={APP_ROUTES.ADMIN_MATCHES} element={<MatchManagePage />} />
                <Route path={APP_ROUTES.ADMIN_CLUBS} element={<ClubManagePage />} />
                <Route path={APP_ROUTES.ADMIN_STADIUMS} element={<StadiumManagePage />} />
                <Route path={APP_ROUTES.ADMIN_MAILBOX} element={<MailboxPage />} />
              </Route>
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

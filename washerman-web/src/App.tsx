import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { washermenApi } from './api/washermen';
import { AppLayout } from './components/layout/AppLayout';
import { PageSpinner } from './components/ui/Spinner';

import { PhoneEntryPage } from './pages/auth/PhoneEntryPage';
import { OTPPage } from './pages/auth/OTPPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { PricingPage } from './pages/pricing/PricingPage';
import { AccountingPage } from './pages/accounting/AccountingPage';
import { CustomerLedgerPage } from './pages/accounting/CustomerLedgerPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { ReviewsPage } from './pages/profile/ReviewsPage';
import { NotificationsPage } from './pages/profile/NotificationsPage';

function AuthGuard() {
  const { isAuthenticated, setWasherman, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    washermenApi.getProfile()
      .then((r) => setWasherman(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [isAuthenticated, setWasherman, logout]);

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/auth/phone" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  { path: '/auth/phone', element: <PhoneEntryPage /> },
  { path: '/auth/otp', element: <OTPPage /> },
  { path: '/auth/register', element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/', element: <DashboardPage /> },
        { path: '/orders', element: <OrdersListPage /> },
        { path: '/orders/:id', element: <OrderDetailPage /> },
        { path: '/pricing', element: <PricingPage /> },
        { path: '/accounting', element: <AccountingPage /> },
        { path: '/accounting/:customerId', element: <CustomerLedgerPage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/profile/edit', element: <EditProfilePage /> },
        { path: '/profile/reviews', element: <ReviewsPage /> },
        { path: '/profile/notifications', element: <NotificationsPage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  const { loadTokens } = useAuthStore();
  useEffect(() => { loadTokens(); }, [loadTokens]);
  return <RouterProvider router={router} />;
}

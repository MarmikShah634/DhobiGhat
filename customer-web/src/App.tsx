import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { customersApi } from './api/customers';
import { AppLayout } from './components/layout/AppLayout';
import { PageSpinner } from './components/ui/Spinner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';

// Auth pages
import { PhoneEntryPage } from './pages/auth/PhoneEntryPage';
import { OTPPage } from './pages/auth/OTPPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// App pages
import { HomePage } from './pages/home/HomePage';
import { BrowsePage } from './pages/browse/BrowsePage';
import { WashermanProfilePage } from './pages/browse/WashermanProfilePage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { NewOrderPage } from './pages/orders/NewOrderPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { FavouritesPage } from './pages/favourites/FavouritesPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { NotificationsPage } from './pages/profile/NotificationsPage';
import { AccountingPage } from './pages/profile/AccountingPage';

function AuthGuard() {
  const { isAuthenticated, setCustomer, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    customersApi.getProfile()
      .then((r) => setCustomer(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [isAuthenticated, setCustomer, logout]);

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
        { path: '/', element: <HomePage /> },
        { path: '/browse', element: <BrowsePage /> },
        { path: '/browse/:id', element: <WashermanProfilePage /> },
        { path: '/orders', element: <OrdersListPage /> },
        { path: '/orders/new', element: <NewOrderPage /> },
        { path: '/orders/:id', element: <OrderDetailPage /> },
        { path: '/favourites', element: <FavouritesPage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/profile/edit', element: <EditProfilePage /> },
        { path: '/profile/notifications', element: <NotificationsPage /> },
        { path: '/profile/accounting', element: <AccountingPage /> },
      ],
    }],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default function App() {
  const { loadTokens } = useAuthStore();
  useEffect(() => { loadTokens(); }, [loadTokens]);
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

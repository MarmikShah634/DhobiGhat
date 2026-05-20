import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <div className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      <Toaster position="top-right" toastOptions={{ style: { background: '#0F1F3D', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.08)' }, iconTheme: { primary: '#F5C842', secondary: '#0A1628' } }} />
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-6xl font-black text-gold mb-2">404</p>
        <h1 className="text-xl font-bold text-text-primary mb-2">Page not found</h1>
        <p className="text-text-secondary text-sm mb-6">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </div>
    </div>
  );
}

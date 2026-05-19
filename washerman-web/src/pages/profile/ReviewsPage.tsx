import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { reviewsApi, type Review } from '@/api/reviews';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`${sz} ${i < rating ? 'fill-gold text-gold' : 'text-text-disabled'}`} />)}
    </span>
  );
}

export function ReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getMyReviews().then((r) => setReviews(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));

  return (
    <motion.div className="flex flex-col gap-6 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary">Reviews</h1>
      </div>

      {loading ? <PageSpinner /> : reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews yet" subtitle="Reviews from customers will appear here" />
      ) : (
        <>
          <Card>
            <div className="flex gap-8 items-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-5xl font-black text-gold">{avg.toFixed(1)}</p>
                <Stars rating={Math.round(avg)} size="md" />
                <p className="text-xs text-text-secondary">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {counts.map(({ s, n }) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary w-4">{s}</span>
                    <Star className="w-3 h-3 text-gold shrink-0" />
                    <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: reviews.length ? `${(n / reviews.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-text-disabled w-4 text-right">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gold-muted flex items-center justify-center text-gold text-sm font-bold shrink-0">
                    {(r.customer_name ?? 'C').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-text-primary text-sm">{r.customer_name ?? 'Customer'}</p>
                      <p className="text-xs text-text-disabled">{formatDate(r.created_at)}</p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                </div>
                {r.comment && <p className="text-text-secondary text-sm pl-11">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

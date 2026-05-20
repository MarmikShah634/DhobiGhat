import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Heart } from 'lucide-react';
import { washermenApi, type Washerman } from '@/api/washermen';
import { customersApi } from '@/api/customers';
import { pricingApi, type PricingGrid } from '@/api/pricing';
import { reviewsApi, type Review } from '@/api/reviews';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise } from '@/lib/utils';
import toast from 'react-hot-toast';

export function WashermanProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, setCustomer } = useAuthStore();
  const [washerman, setWasherman] = useState<Washerman | null>(null);
  const [grid, setGrid] = useState<PricingGrid | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      washermenApi.getById(id),
      pricingApi.getGrid(id).catch(() => null),
      reviewsApi.getForWasherman(id).catch(() => ({ data: [] })),
      customersApi.getFavourites().catch(() => ({ data: [] })),
    ]).then(([wRes, gRes, rRes, fRes]) => {
      setWasherman(wRes.data);
      setGrid(gRes?.data ?? null);
      setReviews(rRes.data);
      setIsFav(fRes.data.some((f) => f.washerman.id === id));
    }).catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async () => {
    if (!id) return;
    setSelecting(true);
    try {
      const res = await customersApi.selectWasherman(id);
      setCustomer(res.data);
      toast.success(`${washerman?.business_name ?? washerman?.name} selected!`);
    } catch { toast.error('Could not select washerman'); }
    finally { setSelecting(false); }
  };

  const toggleFav = async () => {
    if (!id) return;
    try {
      if (isFav) { await customersApi.removeFavourite(id); setIsFav(false); }
      else { await customersApi.addFavourite(id); setIsFav(true); }
    } catch { toast.error('Could not update favourites'); }
  };

  if (loading) return <PageSpinner />;
  if (!washerman) return null;

  const isSelected = customer?.washerman_id === washerman.id;
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold text-text-primary flex-1">Washerman Profile</h1>
        <button onClick={toggleFav} className="p-2 rounded-xl hover:bg-surface-hover">
          <Heart className={`w-5 h-5 ${isFav ? 'fill-error text-error' : 'text-text-disabled'}`} />
        </button>
      </div>

      {/* Profile card */}
      <Card>
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold-muted flex items-center justify-center text-gold font-bold text-2xl shrink-0">
            {washerman.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">{washerman.business_name ?? washerman.name}</h2>
            {washerman.business_name && <p className="text-text-secondary text-sm">{washerman.name}</p>}
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {washerman.area && <span className="flex items-center gap-1 text-xs text-text-secondary"><MapPin className="w-3 h-3" />{washerman.area}</span>}
              {avg && <span className="flex items-center gap-1 text-xs text-gold"><Star className="w-3 h-3 fill-gold" />{avg.toFixed(1)} ({reviews.length})</span>}
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${washerman.is_available ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                {washerman.is_available ? '● Open' : '● Closed'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {isSelected ? (
            <div className="flex items-center gap-2 text-gold text-sm font-semibold">
              ✓ Your current washerman
            </div>
          ) : (
            <Button fullWidth onClick={handleSelect} loading={selecting} disabled={!washerman.is_available}>
              {washerman.is_available ? 'Select this Washerman' : 'Currently Unavailable'}
            </Button>
          )}
        </div>
      </Card>

      {/* Price grid */}
      {grid && grid.items.length > 0 && grid.wash_types.length > 0 && (
        <Card>
          <h3 className="font-bold text-text-primary mb-4">Price List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-text-secondary font-medium pb-3 pr-4">Item</th>
                  {grid.wash_types.map((wt) => <th key={wt.id} className="text-center text-gold font-medium pb-3 px-2">{wt.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {grid.items.map((item) => (
                  <tr key={item.id} className="border-t border-surface-border">
                    <td className="py-2.5 pr-4 text-text-primary font-medium">{item.name}</td>
                    {grid.wash_types.map((wt) => {
                      const entry = grid.grid.find((g) => g.item_id === item.id && g.wash_type_id === wt.id);
                      return <td key={wt.id} className="py-2.5 px-2 text-center text-text-secondary">{entry ? formatPaise(entry.price_paise) : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <h3 className="font-bold text-text-primary mb-4">Reviews ({reviews.length})</h3>
          <div className="flex flex-col gap-4">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-muted flex items-center justify-center text-gold text-xs font-bold shrink-0">
                  {(r.customer_name ?? 'C').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{r.customer_name ?? 'Customer'}</span>
                    <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-gold text-gold' : 'text-text-disabled'}`} />)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-text-secondary mt-0.5">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Heart } from 'lucide-react';
import { washermenApi, type Washerman } from '@/api/washermen';
import { customersApi } from '@/api/customers';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

export function BrowsePage() {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const [washermen, setWashermen] = useState<Washerman[]>([]);
  const [query, setQuery] = useState('');
  const [availOnly, setAvailOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await washermenApi.search({ query: query || undefined, available_only: availOnly || undefined, limit: 30 });
      setWashermen(res.data.data);
    } catch {} finally { setLoading(false); }
  }, [query, availOnly]);

  useEffect(() => {
    customersApi.getFavourites().then((r) => setFavourites(new Set(r.data.map((f) => f.washerman.id)))).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleFav = async (e: React.MouseEvent, washermanId: string) => {
    e.stopPropagation();
    try {
      if (favourites.has(washermanId)) {
        await customersApi.removeFavourite(washermanId);
        setFavourites((prev) => { const s = new Set(prev); s.delete(washermanId); return s; });
      } else {
        await customersApi.addFavourite(washermanId);
        setFavourites((prev) => new Set([...prev, washermanId]));
      }
    } catch { toast.error('Could not update favourites'); }
  };

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-1">Browse</h1>
        <p className="text-text-secondary text-sm">Find the right washerman for you</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or area…" className="w-full bg-bg-secondary border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-gold transition-colors" />
        </div>
        <button onClick={() => setAvailOnly(!availOnly)} className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${availOnly ? 'bg-gold text-bg-primary border-gold' : 'border-surface-border text-text-secondary hover:border-gold/50'}`}>
          Available
        </button>
      </div>

      {loading ? <PageSpinner /> : washermen.length === 0 ? (
        <EmptyState icon="🔍" title="No washermen found" subtitle="Try adjusting your search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {washermen.map((w) => (
            <Card key={w.id} hover onClick={() => navigate(`/browse/${w.id}`)} className="relative">
              <button onClick={(e) => toggleFav(e, w.id)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-hover">
                <Heart className={`w-4 h-4 ${favourites.has(w.id) ? 'fill-error text-error' : 'text-text-disabled'}`} />
              </button>
              <div className="flex gap-3 pr-8">
                <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center text-gold font-bold text-lg shrink-0">
                  {w.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary">{w.business_name ?? w.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {w.area && <span className="flex items-center gap-1 text-xs text-text-secondary"><MapPin className="w-3 h-3" />{w.area}</span>}
                    {w.average_rating && <span className="flex items-center gap-1 text-xs text-gold"><Star className="w-3 h-3 fill-gold" />{w.average_rating.toFixed(1)}</span>}
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${w.is_available ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: w.is_available ? '#2ECC71' : '#E74C3C' }} />
                      {w.is_available ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {customer?.washerman_id === w.id && <span className="text-xs text-gold font-semibold mt-1 block">Your washerman</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

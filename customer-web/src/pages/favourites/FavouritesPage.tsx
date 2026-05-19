import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star } from 'lucide-react';
import { customersApi } from '@/api/customers';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Favourite { id: string; washerman: { id: string; name: string; business_name?: string; area?: string; average_rating?: number; } }

export function FavouritesPage() {
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersApi.getFavourites().then((r) => setFavourites(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const remove = async (washermanId: string) => {
    try {
      await customersApi.removeFavourite(washermanId);
      setFavourites((prev) => prev.filter((f) => f.washerman.id !== washermanId));
    } catch { toast.error('Could not remove favourite'); }
  };

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Favourites</h1>
        <p className="text-text-secondary text-sm mt-1">{favourites.length} saved washerman{favourites.length !== 1 ? 'en' : ''}</p>
      </div>

      {loading ? <PageSpinner /> : favourites.length === 0 ? (
        <EmptyState icon="❤️" title="No favourites yet" subtitle="Tap the heart on any washerman to save them here" action={{ label: 'Browse Washermen', onClick: () => navigate('/browse') }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favourites.map((fav) => (
            <Card key={fav.id} hover onClick={() => navigate(`/browse/${fav.washerman.id}`)}>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center text-gold font-bold text-lg shrink-0">
                  {fav.washerman.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary">{fav.washerman.business_name ?? fav.washerman.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {fav.washerman.area && <span className="flex items-center gap-1 text-xs text-text-secondary"><MapPin className="w-3 h-3" />{fav.washerman.area}</span>}
                    {fav.washerman.average_rating && <span className="flex items-center gap-1 text-xs text-gold"><Star className="w-3 h-3 fill-gold" />{fav.washerman.average_rating.toFixed(1)}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(fav.washerman.id); }} className="p-1.5 rounded-lg hover:bg-surface-hover shrink-0 self-start">
                  <Heart className="w-4 h-4 fill-error text-error" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

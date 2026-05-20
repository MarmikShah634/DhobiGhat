import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { accountingApi } from '@/api/accounting';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPaise } from '@/lib/utils';

const RANGES = [{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }];

interface Summary {
  total_earned_paise: number; total_unpaid_paise: number; total_orders: number;
  customers: Array<{ customer_id: string; customer_name: string; total_paise: number; unpaid_paise: number; order_count: number; }>;
}

export function AccountingPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accountingApi.getSummary({ range }).then((r) => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Accounting</h1>
        <p className="text-text-secondary text-sm mt-1">Track your earnings and dues</p>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${range === r.key ? 'bg-gold text-bg-primary border-gold' : 'border-surface-border text-text-secondary hover:border-gold/50'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '💰 Earned', value: formatPaise(summary?.total_earned_paise ?? 0), color: 'text-gold' },
              { label: '⏳ Unpaid', value: formatPaise(summary?.total_unpaid_paise ?? 0), color: summary?.total_unpaid_paise ? 'text-warning' : 'text-success' },
              { label: '📋 Orders', value: String(summary?.total_orders ?? 0), color: 'text-text-primary' },
            ].map((k) => (
              <Card key={k.label} className="text-center flex flex-col gap-1">
                <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                <p className="text-xs text-text-secondary">{k.label}</p>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-primary mb-3">Customers</h2>
            {(summary?.customers ?? []).length === 0 ? (
              <EmptyState icon="📊" title="No data" subtitle="No orders in this period" />
            ) : (
              <div className="flex flex-col gap-3">
                {(summary?.customers ?? []).map((c) => (
                  <Card key={c.customer_id} hover onClick={() => navigate(`/accounting/${c.customer_id}`, { state: { customerName: c.customer_name } })}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gold-muted flex items-center justify-center text-gold font-bold shrink-0">
                        {c.customer_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary">{c.customer_name}</p>
                        <p className="text-text-secondary text-xs">{c.order_count} order{c.order_count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gold">{formatPaise(c.total_paise)}</p>
                        {c.unpaid_paise > 0 && <p className="text-xs text-warning font-medium">{formatPaise(c.unpaid_paise)} due</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-disabled shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { accountingApi } from '@/api/accounting';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatPaise } from '@/lib/utils';

const RANGES = [{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }];

export function AccountingPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState<{ total_spent_paise: number; total_due_paise: number; total_orders: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accountingApi.getSummary({ range }).then((r) => setSummary(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  return (
    <motion.div className="flex flex-col gap-6 max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-text-primary">Accounting</h1>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${range === r.key ? 'bg-gold text-bg-primary border-gold' : 'border-surface-border text-text-secondary hover:border-gold/50'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Spent', value: formatPaise(summary?.total_spent_paise ?? 0), color: 'text-gold' },
            { label: 'Amount Due', value: formatPaise(summary?.total_due_paise ?? 0), color: summary?.total_due_paise ? 'text-warning' : 'text-success' },
            { label: 'Orders', value: String(summary?.total_orders ?? 0), color: 'text-text-primary' },
          ].map((item) => (
            <Card key={item.label} className="flex flex-col items-center gap-1 text-center">
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-text-secondary">{item.label}</p>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

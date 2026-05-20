import { getStatusColor, getStatusLabel } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {getStatusLabel(status)}
    </span>
  );
}

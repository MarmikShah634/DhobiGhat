import { Button } from './Button';

interface EmptyStateProps { icon?: string; title: string; subtitle?: string; action?: { label: string; onClick: () => void }; }

export function EmptyState({ icon = '📭', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="text-5xl">{icon}</span>
      <div>
        <p className="text-lg font-semibold text-text-primary">{title}</p>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <Button variant="secondary" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

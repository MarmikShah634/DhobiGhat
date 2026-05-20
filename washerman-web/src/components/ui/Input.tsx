import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, prefix, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
    <div className={cn('flex items-center bg-bg-primary border rounded-xl transition-colors focus-within:border-gold', error ? 'border-error' : 'border-surface-border')}>
      {prefix && <span className="pl-4 text-text-disabled text-sm select-none">{prefix}</span>}
      <input
        ref={ref}
        className={cn('flex-1 bg-transparent px-4 py-3 text-text-primary placeholder-text-disabled focus:outline-none text-sm', prefix && 'pl-1', className)}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-error">{error}</p>}
  </div>
));
Input.displayName = 'Input';

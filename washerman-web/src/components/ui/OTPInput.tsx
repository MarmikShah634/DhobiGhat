import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const LEN = 6;

export function OTPInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const update = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    if (val && idx < LEN - 1) refs.current[idx + 1]?.focus();
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(LEN).fill('').map((_, i) => text[i] ?? '');
    setDigits(next);
    refs.current[Math.min(text.length, LEN - 1)]?.focus();
    if (text.length === LEN) onComplete(text);
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => update(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)} onPaste={handlePaste}
          className={cn('w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-bg-primary text-text-primary focus:outline-none transition-all', d ? 'border-gold text-gold' : 'border-surface-border focus:border-gold/60')}
        />
      ))}
    </div>
  );
}

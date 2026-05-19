import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void; highlighted?: boolean; }

export function Card({ children, className, hover, onClick, highlighted }: CardProps) {
  const Comp = onClick ? motion.div : 'div';
  const motionProps = onClick ? { whileHover: { y: -2 }, whileTap: { scale: 0.99 } } : {};
  return (
    <Comp
      className={cn('bg-bg-secondary border rounded-2xl p-5', highlighted ? 'border-gold shadow-[0_0_20px_rgba(245,200,66,0.15)]' : 'border-surface-border', hover && 'hover:border-gold/30 transition-colors cursor-pointer', className)}
      onClick={onClick}
      {...(motionProps as object)}
    >
      {children}
    </Comp>
  );
}

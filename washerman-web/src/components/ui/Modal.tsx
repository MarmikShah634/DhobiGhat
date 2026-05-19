import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; }

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative bg-bg-secondary border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-2xl" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}>
            <div className="flex items-center justify-between mb-5">
              {title && <h3 className="text-lg font-bold text-text-primary">{title}</h3>}
              <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-surface-hover text-text-secondary"><X className="w-5 h-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

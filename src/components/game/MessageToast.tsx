'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

export function MessageToast() {
  const { message, clearMessage } = useGameStore();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearMessage, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ ease: [0.23, 1, 0.32, 1] }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="glass shadow-soft rounded-2xl px-5 py-2.5 max-w-xs text-center">
            <p className="text-xs text-text-secondary tracking-relaxed">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

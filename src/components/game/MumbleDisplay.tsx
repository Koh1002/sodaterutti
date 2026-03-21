'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMumble } from '@/lib/mumble';
import { useGameStore } from '@/stores/game-store';

export function MumbleDisplay() {
  const { character } = useGameStore();
  const [mumble, setMumble] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!character) return;

    const showMumble = () => {
      const hour = new Date().getHours();
      const text = getMumble(character, hour);
      if (text) {
        setMumble(text);
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }
    };

    const initialTimer = setTimeout(showMumble, 1000);
    const interval = setInterval(() => {
      const delay = 15000 + Math.random() * 15000;
      setTimeout(showMumble, delay);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [character]);

  return (
    <AnimatePresence>
      {visible && mumble && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="relative glass-warm rounded-xl px-3 py-1.5 shadow-sm max-w-[200px]"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[rgba(250,248,245,0.65)] border-t border-l border-warm-200/50 rotate-45" />
          <p className="text-xs text-warm-600 text-center relative z-10 tracking-relaxed">{mumble}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

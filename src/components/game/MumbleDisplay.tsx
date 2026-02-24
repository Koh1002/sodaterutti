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
        // 5秒後に消す
        setTimeout(() => setVisible(false), 5000);
      }
    };

    // 初回表示（1秒後）
    const initialTimer = setTimeout(showMumble, 1000);
    // 15-30秒おきにつぶやく
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
          className="relative bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md border border-purple-100 max-w-[200px]"
        >
          {/* 吹き出しの三角（上向き：キャラの方を指す） */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 border-t border-l border-purple-100 rotate-45" />
          <p className="text-sm text-gray-700 text-center relative z-10">{mumble}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

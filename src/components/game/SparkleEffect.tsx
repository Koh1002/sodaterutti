'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

/** ステータス回復時のキラキラエフェクト */
export function SparkleEffect({ active }: { active: boolean }) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (!active) return;

    const newSparkles: Sparkle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 60,
      size: 8 + Math.random() * 8,
      delay: i * 0.1,
    }));

    setSparkles(newSparkles);
    const timer = setTimeout(() => setSparkles([]), 1200);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.3], rotate: [0, 180, 360] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: s.delay, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 16 16" fill="none">
            <path
              d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
              fill="#E3D5CA"
              opacity="0.7"
            />
          </svg>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

/** ドック上でのミニキラキラ（ステータス回復フィードバック） */
export function MiniSparkle({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <motion.span
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], y: -12, scale: [0, 1, 0] }}
      transition={{ duration: 0.6 }}
      className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
          fill="#D5BDAF"
          opacity="0.8"
        />
      </svg>
    </motion.span>
  );
}

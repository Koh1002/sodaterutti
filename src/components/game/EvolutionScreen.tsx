'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';

type Species = Database['public']['Tables']['species']['Row'];

interface EvolutionScreenProps {
  fromSpecies: Species;
  toSpecies: Species;
  characterName: string;
  onComplete: () => void;
}

export function EvolutionScreen({ fromSpecies, toSpecies, characterName, onComplete }: EvolutionScreenProps) {
  const [phase, setPhase] = useState<'glow' | 'transform' | 'reveal'>('glow');
  const [fromImgError, setFromImgError] = useState(false);
  const [toImgError, setToImgError] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transform'), 2000);
    const t2 = setTimeout(() => setPhase('reveal'), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const fromSrc = fromImgError
    ? getPlaceholderSvg(fromSpecies.image_key)
    : getCharacterImagePath(fromSpecies.image_key);
  const toSrc = toImgError
    ? getPlaceholderSvg(toSpecies.image_key)
    : getCharacterImagePath(toSpecies.image_key);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-black flex items-center justify-center z-50"
    >
      <div className="text-center space-y-6 p-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          {phase === 'reveal' ? 'しんかした！' : '...！？'}
        </motion.h2>

        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          {/* パーティクル */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * (phase === 'transform' ? 100 : 40),
                y: Math.sin((i / 12) * Math.PI * 2) * (phase === 'transform' ? 100 : 40),
                opacity: phase === 'reveal' ? 0 : [0, 1, 0.5],
                scale: phase === 'transform' ? [1, 2, 1] : 1,
              }}
              transition={{ duration: 1.5, repeat: phase === 'reveal' ? 0 : Infinity, delay: i * 0.1 }}
            />
          ))}

          {/* グロー */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: phase === 'transform'
                ? '0 0 60px 30px rgba(255,255,100,0.8)'
                : '0 0 30px 15px rgba(255,255,100,0.3)',
            }}
            transition={{ duration: 1 }}
          />

          <AnimatePresence mode="wait">
            {phase !== 'reveal' ? (
              <motion.div
                key="from"
                animate={{
                  scale: phase === 'transform' ? [1, 1.3, 0] : [1, 1.05, 1],
                  opacity: phase === 'transform' ? [1, 1, 0] : 1,
                  filter: phase === 'transform' ? 'brightness(3)' : 'brightness(1)',
                }}
                transition={{ duration: phase === 'transform' ? 1.5 : 2, repeat: phase === 'glow' ? Infinity : 0 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Image
                  src={fromSrc}
                  alt={fromSpecies.name}
                  width={192}
                  height={192}
                  className="object-contain drop-shadow-[0_0_20px_rgba(255,255,200,0.8)]"
                  onError={() => setFromImgError(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="to"
                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8, bounce: 0.5 }}
              >
                <Image
                  src={toSrc}
                  alt={toSpecies.name}
                  width={192}
                  height={192}
                  className="object-contain drop-shadow-[0_0_20px_rgba(255,255,200,0.8)]"
                  onError={() => setToImgError(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {phase === 'reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <p className="text-white text-lg">
              <span className="font-bold text-yellow-300">{characterName}</span>は
              <span className="font-bold text-pink-300">{toSpecies.name}</span>にしんかした！
            </p>
            {toSpecies.rarity !== 'common' && (
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.8 }}
                className={`text-lg font-bold ${
                  toSpecies.rarity === 'legendary' ? 'text-yellow-400' : 'text-purple-300'
                }`}
              >
                {toSpecies.rarity === 'legendary' ? '★ 伝説のキャラクター！' : '☆ レアキャラクター！'}
              </motion.p>
            )}
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition backdrop-blur-sm border border-white/30"
            >
              やったね！
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

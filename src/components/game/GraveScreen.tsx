'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';

type Species = Database['public']['Tables']['species']['Row'];

interface GraveScreenProps {
  characterName: string;
  species: Species;
  ageDays: number;
  generation: number;
  cause: 'death_age' | 'death_sick';
  onRestart: () => void;
}

export function GraveScreen({ characterName, species, ageDays, generation, cause, onRestart }: GraveScreenProps) {
  const [phase, setPhase] = useState<'memorial' | 'restart'>('memorial');
  const [imgError, setImgError] = useState(false);

  const imageSrc = imgError
    ? getPlaceholderSvg(species.image_key)
    : getCharacterImagePath(species.image_key);

  const causeMessage = cause === 'death_age'
    ? `${characterName}は天寿をまっとうしました`
    : `${characterName}は病気で旅立ちました...`;

  if (phase === 'restart') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center z-50 p-4"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="text-5xl opacity-50"
          >
            🥚
          </motion.div>
          <p className="text-sm text-text-primary font-light tracking-airy">
            あたらしいたまごが見つかった
          </p>
          <p className="text-xs text-text-tertiary tracking-relaxed">
            {characterName}の思いを受け継いで...
          </p>
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-muted-blue/80 text-white font-medium rounded-2xl hover:bg-muted-blue transition shadow-soft text-sm tracking-relaxed press-effect"
          >
            たまごを温める
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-[#3D3A38] via-[#2E2B29] to-[#1E1C1A] flex items-center justify-center z-50 p-4"
    >
      <div className="text-center space-y-6 max-w-sm">
        {/* 星空パーティクル */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-base-200 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-28 h-28 mx-auto mb-4 relative opacity-70">
            <Image
              src={imageSrc}
              alt={species.name}
              width={112}
              height={112}
              className="object-contain grayscale"
              onError={() => setImgError(true)}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(227,213,202,0.2) 0%, transparent 70%)',
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-light text-white/80 tracking-airy">
            さようなら、{characterName}
          </h2>
          <p className="text-base-400 text-xs tracking-relaxed">{causeMessage}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="glass-dark rounded-2xl p-4 space-y-2"
        >
          <p className="text-white/60 text-[10px] font-medium tracking-airy">おもいで</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40 tracking-relaxed font-num">
            <span>なまえ: {characterName}</span>
            <span>しゅぞく: {species.name}</span>
            <span>ねんれい: {ageDays}日</span>
            <span>せだい: {generation}代目</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          onClick={() => setPhase('restart')}
          className="px-8 py-3 glass-dark text-white/80 font-medium rounded-2xl transition hover:bg-white/15 text-sm tracking-relaxed press-effect"
        >
          おもいでにする
        </motion.button>
      </div>
    </motion.div>
  );
}

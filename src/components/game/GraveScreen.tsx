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
        className="fixed inset-0 bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center z-50 p-4"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="text-8xl"
          >
            🥚
          </motion.div>
          <p className="text-lg text-purple-600 font-bold">
            あたらしいたまごが見つかった！
          </p>
          <p className="text-sm text-gray-500">
            {characterName}の思いを受け継いで...
          </p>
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition shadow-lg"
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
      className="fixed inset-0 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center z-50 p-4"
    >
      <div className="text-center space-y-6 max-w-sm">
        {/* 星空パーティクル */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-32 h-32 mx-auto mb-4 relative opacity-80">
            <Image
              src={imageSrc}
              alt={species.name}
              width={128}
              height={128}
              className="object-contain grayscale"
              onError={() => setImgError(true)}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,200,0.3) 0%, transparent 70%)',
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
          <h2 className="text-2xl font-bold text-white">
            さようなら、{characterName}
          </h2>
          <p className="text-gray-300 text-sm">{causeMessage}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2"
        >
          <p className="text-white/80 text-sm font-bold">おもいで</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
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
          className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition backdrop-blur-sm border border-white/30"
        >
          おもいでにする
        </motion.button>
      </div>
    </motion.div>
  );
}

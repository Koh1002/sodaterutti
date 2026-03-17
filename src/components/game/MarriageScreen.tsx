'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';

type Species = Database['public']['Tables']['species']['Row'];
type MarriageCandidate = Database['public']['Tables']['marriage_candidates']['Row'];

interface MarriageCandidateWithSpecies extends MarriageCandidate {
  speciesName: string;
}

interface MarriageScreenProps {
  characterName: string;
  characterSpecies: Species;
  candidates: MarriageCandidateWithSpecies[];
  onSelect: (candidateId: string) => void;
  onClose: () => void;
}

export function MarriageScreen({ characterName, characterSpecies, candidates, onSelect, onClose }: MarriageScreenProps) {
  const [phase, setPhase] = useState<'select' | 'ceremony' | 'egg'>('select');
  const [selectedCandidate, setSelectedCandidate] = useState<MarriageCandidateWithSpecies | null>(null);

  const handleSelect = (candidate: MarriageCandidateWithSpecies) => {
    setSelectedCandidate(candidate);
    setPhase('ceremony');
    setTimeout(() => {
      setPhase('egg');
    }, 3500);
  };

  useEffect(() => {
    if (phase === 'egg') {
      const timer = setTimeout(() => {
        if (selectedCandidate) onSelect(selectedCandidate.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, selectedCandidate, onSelect]);

  if (phase === 'ceremony' && selectedCandidate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-b from-pink-200 via-pink-100 to-white flex items-center justify-center z-50"
      >
        <div className="text-center space-y-6 p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="text-5xl"
          >
            💒
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-pink-600"
          >
            けっこんしき
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-6"
          >
            <div className="text-center">
              <CandidateImage imageKey={characterSpecies.image_key} name={characterSpecies.name} size={96} />
              <p className="text-sm font-bold text-pink-700 mt-2">{characterName}</p>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
              className="text-4xl"
            >
              💕
            </motion.span>
            <div className="text-center">
              <CandidateImage imageKey={selectedCandidate.image_key} name={selectedCandidate.name} size={96} />
              <p className="text-sm font-bold text-pink-700 mt-2">{selectedCandidate.name}</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="text-pink-500 text-lg"
          >
            おめでとうございます！
          </motion.p>

          {/* ハートパーティクル */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl"
              style={{ left: `${15 + Math.random() * 70}%`, top: `${20 + Math.random() * 60}%` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 1, 0], y: -50 }}
              transition={{ duration: 2, delay: 1 + i * 0.3, repeat: Infinity }}
            >
              💗
            </motion.span>
          ))}
        </div>
      </motion.div>
    );
  }

  if (phase === 'egg') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center z-50"
      >
        <div className="text-center space-y-6 p-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg text-gray-600"
          >
            {characterName}は{selectedCandidate?.name || 'パートナー'}と旅立ちました...
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', bounce: 0.5 }}
            className="text-8xl"
          >
            🥚
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xl font-bold text-purple-600"
          >
            あたらしいたまごが生まれた！
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // 候補選択フェーズ
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center z-50 p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl">💒</span>
          <h2 className="text-xl font-bold text-pink-600 mt-2">けっこんあいて</h2>
          <p className="text-sm text-gray-500 mt-1">
            {characterName}の結婚相手を選んでください
          </p>
        </div>

        <div className="space-y-3">
          {candidates.map((candidate, i) => {
            const personality = candidate.personality as { type: string; description: string } | null;
            return (
              <motion.button
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                onClick={() => handleSelect(candidate)}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-4 text-left border border-pink-100 hover:border-pink-300"
              >
                <div className="w-16 h-16 shrink-0">
                  <CandidateImage imageKey={candidate.image_key} name={candidate.name} size={64} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-pink-700">{candidate.name}</p>
                  <p className="text-xs text-gray-500">{candidate.speciesName}</p>
                  {personality && (
                    <p className="text-xs text-pink-400 mt-1">{personality.description}</p>
                  )}
                </div>
                <span className="text-pink-300 text-xl">💕</span>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          まだ結婚しない
        </button>
      </div>
    </motion.div>
  );
}

function CandidateImage({ imageKey, name, size }: { imageKey: string; name: string; size: number }) {
  const [error, setError] = useState(false);
  const src = error ? getPlaceholderSvg(imageKey, size) : getCharacterImagePath(imageKey);

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setError(true)}
    />
  );
}

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
        className="fixed inset-0 bg-gradient-to-b from-[#F5CDD0] via-[#F5EBE0] to-white flex items-center justify-center z-50"
      >
        <div className="text-center space-y-6 p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="text-4xl opacity-50"
          >
            ♡
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base font-light text-muted-rose tracking-airy"
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
              <CandidateImage imageKey={characterSpecies.image_key} name={characterSpecies.name} size={80} />
              <p className="text-xs text-text-secondary mt-2 tracking-relaxed">{characterName}</p>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
              className="text-2xl text-muted-rose/50"
            >
              ♡
            </motion.span>
            <div className="text-center">
              <CandidateImage imageKey={selectedCandidate.image_key} name={selectedCandidate.name} size={80} />
              <p className="text-xs text-text-secondary mt-2 tracking-relaxed">{selectedCandidate.name}</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="text-muted-rose text-sm tracking-airy"
          >
            おめでとうございます
          </motion.p>

          {/* パーティクル */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-base opacity-40"
              style={{ left: `${15 + Math.random() * 70}%`, top: `${20 + Math.random() * 60}%` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 0.4, 0], y: -40 }}
              transition={{ duration: 2.5, delay: 1 + i * 0.3, repeat: Infinity }}
            >
              ♡
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
        className="fixed inset-0 bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center z-50"
      >
        <div className="text-center space-y-6 p-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-text-tertiary tracking-relaxed"
          >
            {characterName}は{selectedCandidate?.name || 'パートナー'}と旅立ちました...
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', bounce: 0.5 }}
            className="text-5xl opacity-50"
          >
            🥚
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-sm font-light text-text-primary tracking-airy"
          >
            あたらしいたまごが生まれた
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-[#F5CDD0]/30 to-base-100 flex items-center justify-center z-50 p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-2xl opacity-40">♡</span>
          <h2 className="text-base font-light text-muted-rose mt-2 tracking-airy">けっこんあいて</h2>
          <p className="text-[10px] text-text-tertiary mt-1 tracking-relaxed">
            {characterName}の結婚相手を選んでください
          </p>
        </div>

        <div className="space-y-2.5">
          {candidates.map((candidate, i) => {
            const personality = candidate.personality as { type: string; description: string } | null;
            return (
              <motion.button
                key={candidate.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => handleSelect(candidate)}
                className="w-full glass rounded-2xl p-4 shadow-soft hover:shadow-soft-md transition flex items-center gap-4 text-left hover:bg-white/50 press-effect"
              >
                <div className="w-14 h-14 shrink-0">
                  <CandidateImage imageKey={candidate.image_key} name={candidate.name} size={56} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary tracking-relaxed">{candidate.name}</p>
                  <p className="text-[10px] text-text-tertiary tracking-relaxed">{candidate.speciesName}</p>
                  {personality && (
                    <p className="text-[10px] text-muted-rose mt-0.5 tracking-relaxed">{personality.description}</p>
                  )}
                </div>
                <span className="text-muted-rose/40 text-sm">♡</span>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-[10px] text-text-tertiary hover:text-text-secondary transition tracking-relaxed"
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

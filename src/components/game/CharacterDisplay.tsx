'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import { MumbleDisplay } from './MumbleDisplay';
import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type Species = Database['public']['Tables']['species']['Row'];

interface CharacterDisplayProps {
  character: Character;
  species: Species | null;
  onTap?: () => void;
}

// タッチ時のリアクションアニメーション
const touchReactions = [
  { y: [0, -30, 0, -15, 0], rotate: 0, x: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
  { rotate: [0, 15, -15, 10, -10, 0], x: [0, 10, -10, 5, -5, 0], y: 0, scale: 1, transition: { duration: 0.7, ease: 'easeInOut' as const } },
  { rotate: [0, 360], scale: [1, 1.15, 1], y: 0, x: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
  { x: [0, -5, 5, -5, 5, -3, 3, 0], y: 0, rotate: 0, scale: 1, transition: { duration: 0.4 } },
  { y: [0, -40, 0], scale: [1, 1.2, 1], rotate: 0, x: 0, transition: { duration: 0.5, type: 'spring' as const, stiffness: 300 } },
];

export function CharacterDisplay({ character, species, onTap }: CharacterDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const reactingRef = useRef(false);
  const controls = useAnimation();
  const imageKey = species?.image_key || 'baby_boy';
  const imageSrc = imgError
    ? getPlaceholderSvg(imageKey)
    : getCharacterImagePath(imageKey);

  const getIdleAnimation = useCallback(() => {
    if (character.is_sleeping) {
      return {
        y: [0, -3, 0], x: 0, rotate: 0, scale: 1,
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
      };
    }
    if (character.is_sick) {
      return {
        x: [-2, 2, -2], y: 0, rotate: 0, scale: 1,
        transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const },
      };
    }
    return {
      y: [0, -8, 0], x: 0, rotate: 0, scale: 1,
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
    };
  }, [character.is_sleeping, character.is_sick]);

  useEffect(() => {
    if (!reactingRef.current) {
      controls.start(getIdleAnimation());
    }
  }, [controls, getIdleAnimation]);

  const handleTap = useCallback(async () => {
    if (reactingRef.current || character.is_sleeping) return;
    reactingRef.current = true;

    const reaction = touchReactions[Math.floor(Math.random() * touchReactions.length)];
    await controls.start(reaction);
    controls.start(getIdleAnimation());
    reactingRef.current = false;

    onTap?.();
  }, [character.is_sleeping, controls, getIdleAnimation, onTap]);

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* 名前 + ステージ情報 */}
      <div className="mb-2 text-center flex items-center gap-2">
        <span className="text-base font-medium text-warm-700 tracking-relaxed">
          {character.name || species?.name || '???'}
        </span>
        {species && (
          <span className="text-[10px] text-warm-400 tracking-relaxed">
            ({species.name})
          </span>
        )}
        <span className="text-[10px] text-warm-400 tracking-relaxed">
          {stageLabel(character.stage)}
        </span>
      </div>

      {/* 部屋の背景 + キャラクター */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-2xl overflow-hidden shadow-sm border border-white/30">
        {/* 部屋背景画像 */}
        <Image
          src="/images/bg_room.png"
          alt="部屋"
          fill
          className="object-cover"
          priority
        />

        {/* キャラクター画像（中央配置） */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={controls}
            className="relative w-40 h-40 cursor-pointer"
            onClick={handleTap}
          >
            <Image
              src={imageSrc}
              alt={species?.name || 'キャラクター'}
              width={160}
              height={160}
              onError={() => setImgError(true)}
              className="object-contain drop-shadow-md"
              priority
            />

            {/* 睡眠中表示 */}
            {character.is_sleeping && (
              <motion.span
                className="absolute -top-2 -right-2 text-lg opacity-60"
                animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -8, -16] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                zzz
              </motion.span>
            )}

            {/* 病気表示 */}
            {character.is_sick && (
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-dusty-200/80 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-xs">✕</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* うんち表示 */}
        {character.poop_count > 0 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {Array.from({ length: Math.min(character.poop_count, 3) }).map((_, i) => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full bg-warm-400/40 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                <span className="text-[10px]">●</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* つぶやき */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <MumbleDisplay />
        </div>
      </div>
    </div>
  );
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    baby: 'ベビー期',
    kids: 'キッズ期',
    young: 'ヤング期',
    adult: 'アダルト期',
  };
  return labels[stage] || stage;
}

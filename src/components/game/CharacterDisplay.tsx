'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import { MumbleDisplay } from './MumbleDisplay';
import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type Species = Database['public']['Tables']['species']['Row'];

interface CharacterDisplayProps {
  character: Character;
  species: Species | null;
}

export function CharacterDisplay({ character, species }: CharacterDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const imageKey = species?.image_key || 'baby_boy';
  const imageSrc = imgError
    ? getPlaceholderSvg(imageKey)
    : getCharacterImagePath(imageKey);

  // アニメーション定義
  const getAnimation = () => {
    if (character.is_sleeping) {
      return {
        y: [0, -3, 0],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
      };
    }
    if (character.is_sick) {
      return {
        x: [-2, 2, -2],
        transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const },
      };
    }
    return {
      y: [0, -8, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
    };
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* 名前 + ステージ情報（1行にまとめてコンパクトに） */}
      <div className="mb-1 text-center flex items-center gap-2">
        <span className="text-lg font-bold text-purple-700">
          {character.name || species?.name || '???'}
        </span>
        {species && (
          <span className="text-xs text-gray-400">
            ({species.name})
          </span>
        )}
        <span className="text-xs text-gray-400">
          {stageLabel(character.stage)}
        </span>
      </div>

      {/* 部屋の背景 + キャラクター */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-2xl overflow-hidden shadow-inner">
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
            animate={getAnimation()}
            className="relative w-40 h-40"
          >
            <Image
              src={imageSrc}
              alt={species?.name || 'キャラクター'}
              width={160}
              height={160}
              onError={() => setImgError(true)}
              className="object-contain drop-shadow-lg"
              priority
            />

            {/* 睡眠中のzzz表示 */}
            {character.is_sleeping && (
              <motion.span
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💤
              </motion.span>
            )}

            {/* 病気表示 */}
            {character.is_sick && (
              <motion.span
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🤒
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* うんち表示 */}
        {character.poop_count > 0 && (
          <div className="absolute bottom-3 right-4 flex gap-1">
            {Array.from({ length: Math.min(character.poop_count, 3) }).map((_, i) => (
              <motion.span
                key={i}
                className="text-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                💩
              </motion.span>
            ))}
          </div>
        )}

        {/* つぶやき（部屋の下部にオーバーレイ） */}
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import { MumbleDisplay } from './MumbleDisplay';
import { SparkleEffect } from './SparkleEffect';
import { useParallax } from '@/hooks/useParallax';
import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type Species = Database['public']['Tables']['species']['Row'];

interface CharacterDisplayProps {
  character: Character;
  species: Species | null;
  onTap?: () => void;
}

const touchReactions = [
  { y: [0, -30, 0, -15, 0], rotate: 0, x: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
  { rotate: [0, 12, -12, 8, -8, 0], x: [0, 8, -8, 4, -4, 0], y: 0, scale: 1, transition: { duration: 0.7, ease: 'easeInOut' as const } },
  { rotate: [0, 360], scale: [1, 1.1, 1], y: 0, x: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
  { x: [0, -4, 4, -4, 4, -2, 2, 0], y: 0, rotate: 0, scale: 1, transition: { duration: 0.4 } },
  { y: [0, -35, 0], scale: [1, 1.15, 1], rotate: 0, x: 0, transition: { duration: 0.5, type: 'spring' as const, stiffness: 300 } },
];

export function CharacterDisplay({ character, species, onTap }: CharacterDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const reactingRef = useRef(false);
  const prevHappinessRef = useRef(character.happiness);
  const controls = useAnimation();
  const parallax = useParallax(6);
  const imageKey = species?.image_key || 'baby_boy';
  const imageSrc = imgError
    ? getPlaceholderSvg(imageKey)
    : getCharacterImagePath(imageKey);

  // ステータス回復検知 → キラキラ発火
  useEffect(() => {
    if (character.happiness > prevHappinessRef.current) {
      setShowSparkle(true);
      const timer = setTimeout(() => setShowSparkle(false), 1200);
      prevHappinessRef.current = character.happiness;
      return () => clearTimeout(timer);
    }
    prevHappinessRef.current = character.happiness;
  }, [character.happiness]);

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
      y: [0, -6, 0], x: 0, rotate: 0, scale: 1,
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
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
        <span className="text-[15px] font-light text-text-primary tracking-airy">
          {character.name || species?.name || '???'}
        </span>
        {species && character.name && (
          <span className="text-[10px] text-text-tertiary tracking-relaxed">
            {species.name}
          </span>
        )}
        <span className="text-[10px] text-text-tertiary tracking-relaxed font-light">
          {stageLabel(character.stage)}
        </span>
      </div>

      {/* 部屋の背景 + キャラクター（パララックス対応） */}
      <div className="relative w-full max-w-sm aspect-[3/2] rounded-3xl overflow-hidden shadow-soft border border-white/30">
        {/* 背景レイヤー（パララックス） */}
        <div
          className="absolute inset-[-8px] parallax-layer"
          style={{ transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)` }}
        >
          <Image
            src="/images/bg_room.png"
            alt="部屋"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* キャラクター画像（パララックス：背景と逆方向に微妙に動く） */}
        <div
          className="absolute inset-0 flex items-center justify-center parallax-layer"
          style={{ transform: `translate(${parallax.x * -0.3}px, ${parallax.y * -0.3}px)` }}
        >
          {/* キャラの影（地面に楕円で落ちる） */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-24 h-4 bg-black/8 rounded-[100%] blur-[3px]" />

          <motion.div
            animate={controls}
            className="relative w-40 h-40 cursor-pointer character-shadow select-none"
            onClick={handleTap}
          >
            <Image
              src={imageSrc}
              alt={species?.name || 'キャラクター'}
              width={160}
              height={160}
              onError={() => setImgError(true)}
              className="object-contain"
              priority
            />

            {/* キラキラエフェクト */}
            <SparkleEffect active={showSparkle} />

            {character.is_sleeping && (
              <motion.span
                className="absolute -top-1 -right-1 font-display text-base text-text-tertiary"
                animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -8, -16] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                zzz
              </motion.span>
            )}

            {character.is_sick && (
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full glass flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4A4A7" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 8v4M12 16h.01" />
                </svg>
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
                className="w-3.5 h-3.5 rounded-full bg-base-300/60"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15, type: 'spring' }}
              />
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

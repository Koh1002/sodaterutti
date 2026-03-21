'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface AlbumFrameProps {
  imageSrc: string;
  caption?: string;
  date?: string;
  className?: string;
}

/**
 * ポラロイド風フレーム — ペットとの思い出を保存する「アルバム」機能の基盤コンポーネント
 */
export function AlbumFrame({ imageSrc, caption, date, className = '' }: AlbumFrameProps) {
  return (
    <motion.div
      className={`inline-block bg-white rounded-sm shadow-soft-md p-2 pb-8 ${className}`}
      initial={{ opacity: 0, rotate: -3, scale: 0.9 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ rotate: -2, scale: 1.03 }}
    >
      <div className="relative w-44 h-44 overflow-hidden rounded-sm bg-base-100">
        <Image
          src={imageSrc}
          alt={caption || '思い出'}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-2 px-1 text-center">
        {caption && (
          <p className="text-[11px] text-text-primary tracking-relaxed leading-snug">
            {caption}
          </p>
        )}
        {date && (
          <p className="text-[9px] text-text-tertiary font-display tracking-airy mt-0.5">
            {date}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface AlbumGridProps {
  children: React.ReactNode;
}

/** アルバム一覧グリッド */
export function AlbumGrid({ children }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 justify-items-center">
      {children}
    </div>
  );
}

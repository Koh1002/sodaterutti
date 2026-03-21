'use client';

import { useEffect, useState, useCallback } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * パララックス効果フック
 * ジャイロセンサー（モバイル）またはマウス位置（デスクトップ）に応じて
 * 微細な座標オフセットを返す
 */
export function useParallax(intensity: number = 8): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const x = ((e.clientX - centerX) / centerX) * intensity;
    const y = ((e.clientY - centerY) / centerY) * intensity;
    setOffset({ x, y });
  }, [intensity]);

  useEffect(() => {
    // ジャイロセンサー（モバイル）
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma || 0; // 左右の傾き（-90〜90）
      const beta = e.beta || 0;   // 前後の傾き（-180〜180）
      const x = (gamma / 45) * intensity;
      const y = ((beta - 45) / 45) * intensity; // 45度を中心に
      setOffset({
        x: Math.max(-intensity, Math.min(intensity, x)),
        y: Math.max(-intensity, Math.min(intensity, y)),
      });
    };

    // ジャイロが使える環境ではジャイロを使用、なければマウスにフォールバック
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, intensity]);

  return offset;
}

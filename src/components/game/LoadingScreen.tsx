'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
  'ちょっとまってね',
  'そだててます…',
  'おめかし中…',
  'おやつ準備中…',
  'もうすぐだよ',
];

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const [message] = useState(
    () => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
          style={{ background: '#F5EBE0' }}
        >
          {/* 背景の柔らかいグラデーション */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, rgba(227,213,202,0.6) 0%, transparent 70%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={showContent ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-col items-center gap-6"
          >
            {/* キャラクターのトコトコアニメーション */}
            <div className="relative">
              {/* 地面の影 */}
              <motion.div
                animate={{ scale: [1, 0.85, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/[0.06] rounded-[100%] blur-[2px]"
              />
              <div className="animate-tokotoko">
                <Image
                  src="/images/egg_normal.png"
                  alt="loading"
                  width={100}
                  height={100}
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>
            </div>

            {/* テキスト */}
            <div className="text-center space-y-2">
              <p className="text-sm text-text-secondary tracking-airy font-light">
                {message}
              </p>
              {/* ドットアニメーション */}
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-base-mocha/50 loading-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-base-mocha/50 loading-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-base-mocha/50 loading-dot-3" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

export function NewEggScreen() {
  const { createNewEgg } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'hatching' | 'naming'>('intro');
  const [name, setName] = useState('');

  const handleStart = () => {
    setPhase('hatching');
    setTimeout(() => setPhase('naming'), 2000);
  };

  const handleName = async () => {
    await createNewEgg(name || undefined);
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-8"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl opacity-50"
          >
            🥚
          </motion.div>
          <h2 className="text-lg font-light text-text-primary tracking-airy">
            たまごを発見！
          </h2>
          <p className="text-text-tertiary text-xs tracking-relaxed leading-relaxed">
            新しいたまごが見つかりました。<br />
            育ててみましょう
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-muted-blue/80 text-white font-medium rounded-2xl hover:bg-muted-blue transition shadow-soft text-sm tracking-relaxed press-effect"
          >
            たまごを温める
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'hatching') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
        <motion.div className="text-center space-y-6">
          <motion.div
            animate={{
              rotate: [-3, 3, -3],
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="text-6xl opacity-60"
          >
            🥚
          </motion.div>
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-sm text-text-secondary tracking-airy"
          >
            ピキピキ...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="text-center space-y-6 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-4xl opacity-40"
        >
          ✧
        </motion.div>
        <h2 className="text-lg font-light text-text-primary tracking-airy">
          たまごから生まれた！
        </h2>
        <p className="text-text-tertiary text-xs tracking-relaxed">
          名前をつけてあげましょう
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="名前を入力（省略可）"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="pet-nickname"
          id="pet-nickname"
          data-form-type="other"
          className="w-full px-4 py-3 border border-base-200 rounded-2xl focus:ring-2 focus:ring-muted-blue/30 focus:border-muted-blue/40 outline-none text-center bg-white/40 backdrop-blur-sm text-text-primary placeholder:text-text-tertiary tracking-relaxed text-sm"
        />
        <button
          onClick={handleName}
          className="w-full py-3 bg-muted-blue/80 text-white font-medium rounded-2xl hover:bg-muted-blue transition shadow-soft text-sm tracking-relaxed press-effect"
        >
          {name ? `「${name}」に決定` : 'スキップして始める'}
        </button>
      </motion.div>
    </div>
  );
}

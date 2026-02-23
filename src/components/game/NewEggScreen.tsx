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
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl"
          >
            🥚
          </motion.div>
          <h2 className="text-2xl font-bold text-purple-600">
            たまごを発見！
          </h2>
          <p className="text-gray-500">
            新しいたまごが見つかりました。<br />
            育ててみましょう！
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition shadow-lg"
          >
            たまごを温める
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'hatching') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div className="text-center space-y-6">
          <motion.div
            animate={{
              rotate: [-5, 5, -5],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="text-8xl"
          >
            🥚
          </motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-xl font-bold text-purple-600"
          >
            ピキピキ...！
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-8xl"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold text-purple-600">
          たまごから生まれた！
        </h2>
        <p className="text-gray-500">
          名前をつけてあげましょう
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="名前を入力（省略可）"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-center"
        />
        <button
          onClick={handleName}
          className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition shadow-lg"
        >
          {name ? `「${name}」に決定！` : 'スキップして始める'}
        </button>
      </motion.div>
    </div>
  );
}

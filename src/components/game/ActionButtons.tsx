'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

export function ActionButtons() {
  const { character, feed, giveSnack, clean, cure, discipline, toggleSleep } = useGameStore();
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);

  if (!character) return null;

  const actions = [
    {
      label: 'ごはん',
      icon: '🍚',
      onClick: () => setShowFoodMenu(!showFoodMenu),
      disabled: character.is_sleeping,
    },
    {
      label: 'あそぶ',
      icon: '🎮',
      onClick: () => setShowMiniGame(true),
      disabled: character.is_sleeping || character.is_sick || character.stamina < 10,
    },
    {
      label: 'そうじ',
      icon: '🧹',
      onClick: () => clean(),
      disabled: character.poop_count <= 0,
    },
    {
      label: 'ちりょう',
      icon: '💊',
      onClick: () => cure(),
      disabled: !character.is_sick,
    },
    {
      label: 'しつけ',
      icon: '👆',
      onClick: () => discipline(),
      disabled: character.is_sleeping,
    },
    {
      label: character.is_sleeping ? 'おこす' : 'ねる',
      icon: '🌙',
      onClick: () => toggleSleep(),
      disabled: false,
    },
  ];

  return (
    <div className="space-y-3">
      {/* メインアクションボタン */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex flex-col items-center justify-center p-3 rounded-xl
              font-medium text-sm transition-all
              ${action.disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-purple-50 text-gray-700 shadow-sm hover:shadow active:shadow-inner border border-gray-200'
              }
            `}
          >
            <span className="text-2xl mb-1">{action.icon}</span>
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* 食事メニュー */}
      <AnimatePresence>
        {showFoodMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl shadow-md p-3 border border-gray-100"
          >
            <p className="text-xs text-gray-500 mb-2 text-center">なにを食べる？</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'onigiri' as const, icon: '🍙', label: 'おにぎり' },
                { key: 'bread' as const, icon: '🍞', label: 'パン' },
                { key: 'cake' as const, icon: '🍰', label: 'ケーキ' },
              ].map((food) => (
                <button
                  key={food.key}
                  onClick={() => {
                    feed(food.key);
                    setShowFoodMenu(false);
                  }}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-yellow-50 transition"
                >
                  <span className="text-2xl">{food.icon}</span>
                  <span className="text-xs text-gray-600">{food.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  giveSnack();
                  setShowFoodMenu(false);
                }}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-yellow-50 transition"
              >
                <span className="text-2xl">🍪</span>
                <span className="text-xs text-gray-600">おやつ</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ミニゲーム（じゃんけん） */}
      <AnimatePresence>
        {showMiniGame && (
          <MiniGameJanken onClose={() => setShowMiniGame(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// =========================================
// じゃんけんミニゲーム
// =========================================

type Hand = 'rock' | 'scissors' | 'paper';

function MiniGameJanken({ onClose }: { onClose: () => void }) {
  const { play } = useGameStore();
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState(0);
  const [playerHand, setPlayerHand] = useState<Hand | null>(null);
  const [cpuHand, setCpuHand] = useState<Hand | null>(null);
  const [roundResult, setRoundResult] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);

  const hands: { key: Hand; emoji: string; label: string }[] = [
    { key: 'rock', emoji: '✊', label: 'グー' },
    { key: 'scissors', emoji: '✌️', label: 'チョキ' },
    { key: 'paper', emoji: '🖐️', label: 'パー' },
  ];

  const judge = (player: Hand, cpu: Hand): 'win' | 'lose' | 'draw' => {
    if (player === cpu) return 'draw';
    if (
      (player === 'rock' && cpu === 'scissors') ||
      (player === 'scissors' && cpu === 'paper') ||
      (player === 'paper' && cpu === 'rock')
    ) return 'win';
    return 'lose';
  };

  const playRound = (hand: Hand) => {
    const cpuChoices: Hand[] = ['rock', 'scissors', 'paper'];
    const cpu = cpuChoices[Math.floor(Math.random() * 3)];
    const result = judge(hand, cpu);

    setPlayerHand(hand);
    setCpuHand(cpu);

    let newWins = wins;
    if (result === 'win') {
      newWins = wins + 1;
      setWins(newWins);
      setRoundResult('かち！');
    } else if (result === 'lose') {
      setRoundResult('まけ...');
    } else {
      setRoundResult('あいこ！');
    }

    const newRound = round + 1;
    setRound(newRound);

    if (newRound >= 3) {
      setGameOver(true);
      play(newWins);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && gameOver && onClose()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-bold text-center text-purple-600 mb-4">
          じゃんけんゲーム
        </h3>

        <p className="text-center text-sm text-gray-500 mb-4">
          {gameOver ? '結果発表！' : `${round + 1}/3 ラウンド`}
        </p>

        {/* 結果表示 */}
        {playerHand && cpuHand && (
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <span className="text-4xl">{hands.find(h => h.key === playerHand)?.emoji}</span>
              <p className="text-xs text-gray-500 mt-1">あなた</p>
            </div>
            <span className="text-2xl font-bold text-purple-400">VS</span>
            <div className="text-center">
              <span className="text-4xl">{hands.find(h => h.key === cpuHand)?.emoji}</span>
              <p className="text-xs text-gray-500 mt-1">あいて</p>
            </div>
          </div>
        )}

        {roundResult && (
          <p className={`text-center text-lg font-bold mb-4 ${
            roundResult === 'かち！' ? 'text-green-500' :
            roundResult === 'まけ...' ? 'text-red-400' :
            'text-yellow-500'
          }`}>
            {roundResult}
          </p>
        )}

        {!gameOver ? (
          <div className="flex justify-center gap-4">
            {hands.map((hand) => (
              <motion.button
                key={hand.key}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => playRound(hand.key)}
                className="flex flex-col items-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition"
              >
                <span className="text-4xl">{hand.emoji}</span>
                <span className="text-xs text-gray-600 mt-1">{hand.label}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-2xl font-bold">
              {wins >= 2 ? '🎉 大成功！' : wins >= 1 ? '✨ 成功！' : '😅 残念...'}
            </p>
            <p className="text-sm text-gray-500">{wins}勝 / 3回</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
            >
              とじる
            </button>
          </div>
        )}

        {/* 戦績 */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < round
                  ? i < wins ? 'bg-green-400' : 'bg-red-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

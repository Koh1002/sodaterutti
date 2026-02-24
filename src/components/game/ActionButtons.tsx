'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { checkMiniGameCooldown } from '@/lib/game-logic';
import { MiniGameMemory } from './MiniGameMemory';
import { MiniGameRhythm } from './MiniGameRhythm';
import { MiniGameQuiz } from './MiniGameQuiz';

interface ActionButtonsProps {
  onWalk: () => void;
}

export function ActionButtons({ onWalk }: ActionButtonsProps) {
  const { character, feed, giveSnack, clean, cure, discipline, toggleSleep, playMiniGame, setMessage } = useGameStore();
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (!character) return null;

  const actions = [
    {
      label: 'ごはん',
      icon: '🍚',
      onClick: () => { setShowFoodMenu(!showFoodMenu); setShowGameMenu(false); },
      disabled: character.is_sleeping,
      gradient: 'from-orange-400 to-amber-400',
    },
    {
      label: 'あそぶ',
      icon: '🎮',
      onClick: () => { setShowGameMenu(!showGameMenu); setShowFoodMenu(false); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 10,
      gradient: 'from-purple-400 to-indigo-400',
    },
    {
      label: 'おさんぽ',
      icon: '👟',
      onClick: () => { setShowFoodMenu(false); setShowGameMenu(false); onWalk(); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 15,
      gradient: 'from-emerald-400 to-green-400',
    },
    {
      label: 'そうじ',
      icon: '🧹',
      onClick: () => clean(),
      disabled: character.poop_count <= 0,
      gradient: 'from-sky-400 to-cyan-400',
    },
    {
      label: 'ちりょう',
      icon: '💊',
      onClick: () => cure(),
      disabled: !character.is_sick,
      gradient: 'from-rose-400 to-pink-400',
    },
    {
      label: 'しつけ',
      icon: '👆',
      onClick: () => discipline(),
      disabled: character.is_sleeping,
      gradient: 'from-yellow-400 to-amber-300',
    },
    {
      label: character.is_sleeping ? 'おこす' : 'ねる',
      icon: '🌙',
      onClick: () => toggleSleep(),
      disabled: false,
      gradient: 'from-indigo-400 to-blue-500',
    },
  ];

  const miniGames = [
    { key: 'janken', icon: '✊', label: 'じゃんけん' },
    { key: 'memory', icon: '🃏', label: '神経衰弱' },
    { key: 'rhythm', icon: '🎵', label: 'リズム' },
    { key: 'quiz', icon: '❓', label: 'クイズ' },
  ];

  const handleStartGame = (gameKey: string) => {
    const { canPlay, remaining } = checkMiniGameCooldown(character, gameKey);
    if (!canPlay) {
      setMessage(`あと${remaining}分待ってね`);
      return;
    }
    setShowGameMenu(false);
    setActiveGame(gameKey);
  };

  const handleGameComplete = (gameKey: string, score: number, extra?: { fastClear?: boolean }) => {
    playMiniGame(gameKey, score, extra);
  };

  return (
    <div className="space-y-3">
      {/* メインアクションボタン */}
      <div className="grid grid-cols-4 gap-2.5">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.92 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex flex-col items-center justify-center py-3 px-1 rounded-2xl
              font-medium text-sm transition-all
              ${action.disabled
                ? 'bg-gray-200/80 text-gray-400 cursor-not-allowed'
                : `bg-gradient-to-b ${action.gradient} text-white shadow-md hover:shadow-lg active:shadow-sm`
              }
            `}
          >
            <span className="text-2xl mb-1">{action.icon}</span>
            <span className="text-xs font-bold">{action.label}</span>
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
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-orange-100"
          >
            <p className="text-sm text-gray-500 mb-3 text-center font-medium">なにを食べる？</p>
            <div className="grid grid-cols-4 gap-2.5">
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
                  className="flex flex-col items-center py-3 rounded-xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
                >
                  <span className="text-2xl">{food.icon}</span>
                  <span className="text-xs text-gray-700 font-medium mt-1">{food.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  giveSnack();
                  setShowFoodMenu(false);
                }}
                className="flex flex-col items-center py-3 rounded-xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
              >
                <span className="text-2xl">🍪</span>
                <span className="text-xs text-gray-700 font-medium mt-1">おやつ</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ミニゲーム選択メニュー */}
      <AnimatePresence>
        {showGameMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-purple-100"
          >
            <p className="text-sm text-gray-500 mb-3 text-center font-medium">なにであそぶ？</p>
            <div className="grid grid-cols-4 gap-2.5">
              {miniGames.map((game) => {
                const { canPlay } = checkMiniGameCooldown(character, game.key);
                return (
                  <button
                    key={game.key}
                    onClick={() => handleStartGame(game.key)}
                    className={`flex flex-col items-center py-3 rounded-xl transition ${
                      canPlay ? 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200' : 'opacity-40 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{game.icon}</span>
                    <span className="text-xs text-gray-700 font-medium mt-1">{game.label}</span>
                    {!canPlay && (
                      <span className="text-[10px] text-gray-400 mt-0.5">CD中</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ミニゲーム: じゃんけん */}
      <AnimatePresence>
        {activeGame === 'janken' && (
          <MiniGameJanken
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('janken', score, { fastClear: score >= 3 })}
          />
        )}
      </AnimatePresence>

      {/* ミニゲーム: 神経衰弱 */}
      <AnimatePresence>
        {activeGame === 'memory' && (
          <MiniGameMemory
            onClose={() => setActiveGame(null)}
            onComplete={(score, fastClear) => handleGameComplete('memory', score, { fastClear })}
          />
        )}
      </AnimatePresence>

      {/* ミニゲーム: リズム */}
      <AnimatePresence>
        {activeGame === 'rhythm' && (
          <MiniGameRhythm
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('rhythm', score)}
          />
        )}
      </AnimatePresence>

      {/* ミニゲーム: クイズ */}
      <AnimatePresence>
        {activeGame === 'quiz' && (
          <MiniGameQuiz
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('quiz', score)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =========================================
// じゃんけんミニゲーム（既存）
// =========================================

type Hand = 'rock' | 'scissors' | 'paper';

function MiniGameJanken({ onClose, onComplete }: { onClose: () => void; onComplete: (score: number) => void }) {
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
      onComplete(newWins);
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
              {wins >= 3 ? '👑 パーフェクト！' : wins >= 2 ? '🎉 大成功！' : wins >= 1 ? '✨ 成功！' : '😅 残念...'}
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

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { checkMiniGameCooldown } from '@/lib/game-logic';
import { MiniGameMemory } from './MiniGameMemory';
import { MiniGameRhythm } from './MiniGameRhythm';
import { MiniGameQuiz } from './MiniGameQuiz';
import { MiniGameWhack } from './MiniGameWhack';

interface ActionButtonsProps {
  onWalk: () => void;
}

// ボトムシートモーダル（食事・遊び選択用）
function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe"
          >
            {/* ハンドルバー */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <p className="text-base text-gray-700 font-bold text-center mb-3">{title}</p>
            <div className="px-5 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ActionButtons({ onWalk }: ActionButtonsProps) {
  const { character, feed, giveSnack, clean, cure, discipline, pet, toggleSleep, playMiniGame, setMessage } = useGameStore();
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [petCooldown, setPetCooldown] = useState(false);

  if (!character) return null;

  const handlePet = () => {
    if (petCooldown) {
      setMessage('もう少し待ってね');
      return;
    }
    pet();
    setPetCooldown(true);
    setTimeout(() => setPetCooldown(false), 2 * 60 * 1000); // 2分クールダウン
  };

  const actions = [
    {
      label: 'ご飯',
      icon: '🍚',
      onClick: () => { setShowFoodMenu(true); setShowGameMenu(false); },
      disabled: character.is_sleeping,
      gradient: 'from-orange-400 to-amber-400',
    },
    {
      label: '遊ぶ',
      icon: '🎮',
      onClick: () => { setShowGameMenu(true); setShowFoodMenu(false); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 10,
      gradient: 'from-purple-400 to-indigo-400',
    },
    {
      label: '散歩',
      icon: '👟',
      onClick: () => { setShowFoodMenu(false); setShowGameMenu(false); onWalk(); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 15,
      gradient: 'from-emerald-400 to-green-400',
    },
    {
      label: '撫でる',
      icon: '🤚',
      onClick: handlePet,
      disabled: character.is_sleeping || petCooldown,
      gradient: 'from-pink-300 to-rose-300',
    },
    {
      label: '掃除',
      icon: '🧹',
      onClick: () => clean(),
      disabled: character.is_sleeping || character.cleanliness >= 100,
      gradient: 'from-sky-400 to-cyan-400',
    },
    {
      label: '治療',
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
      label: character.is_sleeping ? '起こす' : '寝る',
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
    { key: 'whack', icon: '🐹', label: 'もぐらたたき' },
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

      {/* 食事メニュー（ボトムシート） */}
      <BottomSheet
        isOpen={showFoodMenu}
        onClose={() => setShowFoodMenu(false)}
        title="何を食べる？"
      >
        <div className="grid grid-cols-4 gap-3">
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
              className="flex flex-col items-center py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
            >
              <span className="text-3xl">{food.icon}</span>
              <span className="text-sm text-gray-700 font-medium mt-1.5">{food.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              giveSnack();
              setShowFoodMenu(false);
            }}
            className="flex flex-col items-center py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
          >
            <span className="text-3xl">🍪</span>
            <span className="text-sm text-gray-700 font-medium mt-1.5">おやつ</span>
          </button>
        </div>
      </BottomSheet>

      {/* ミニゲーム選択（ボトムシート） */}
      <BottomSheet
        isOpen={showGameMenu}
        onClose={() => setShowGameMenu(false)}
        title="何で遊ぶ？"
      >
        <div className="grid grid-cols-3 gap-3">
          {miniGames.map((game) => {
            const { canPlay } = checkMiniGameCooldown(character, game.key);
            return (
              <button
                key={game.key}
                onClick={() => canPlay && handleStartGame(game.key)}
                className={`flex flex-col items-center py-4 rounded-2xl transition ${
                  canPlay ? 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200' : 'opacity-40 cursor-not-allowed bg-gray-50'
                }`}
              >
                <span className="text-3xl">{game.icon}</span>
                <span className="text-sm text-gray-700 font-medium mt-1.5">{game.label}</span>
                {!canPlay && (
                  <span className="text-[11px] text-gray-400 mt-0.5">クール中</span>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>

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

      {/* ミニゲーム: もぐらたたき */}
      <AnimatePresence>
        {activeGame === 'whack' && (
          <MiniGameWhack
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('whack', score)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =========================================
// じゃんけんミニゲーム
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
      setRoundResult('勝ち！');
    } else if (result === 'lose') {
      setRoundResult('負け...');
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
              <p className="text-xs text-gray-500 mt-1">相手</p>
            </div>
          </div>
        )}

        {roundResult && (
          <p className={`text-center text-lg font-bold mb-4 ${
            roundResult === '勝ち！' ? 'text-green-500' :
            roundResult === '負け...' ? 'text-red-400' :
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
              className="px-6 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition font-bold"
            >
              閉じる
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

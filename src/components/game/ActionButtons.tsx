'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { checkMiniGameCooldown } from '@/lib/game-logic';
import { MiniGameMemory } from './MiniGameMemory';
import { MiniGameRhythm } from './MiniGameRhythm';
import { MiniGameQuiz } from './MiniGameQuiz';
import { MiniGameWhack } from './MiniGameWhack';
import { CompactStatus } from './StatusBar';

interface ActionButtonsProps {
  onWalk: () => void;
}

// ボトムシートモーダル
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

// サブアクションメニュー（上に飛び出すポップアップ）
function SubActionMenu({
  isOpen,
  onClose,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: { icon: string; label: string; onClick: () => void; disabled?: boolean }[];
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-1"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => { if (!action.disabled) { action.onClick(); onClose(); } }}
                disabled={action.disabled}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition ${
                  action.disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-[10px] text-gray-600 font-medium">{action.label}</span>
              </button>
            ))}
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
    setTimeout(() => setPetCooldown(false), 2 * 60 * 1000);
  };

  // メイン5つのドックアクション
  const dockActions = [
    {
      icon: '🍚',
      label: 'ごはん',
      onClick: () => { setShowFoodMenu(true); setShowGameMenu(false); setShowMoreMenu(false); },
      disabled: character.is_sleeping,
      active: showFoodMenu,
    },
    {
      icon: '🎮',
      label: 'あそぶ',
      onClick: () => { setShowGameMenu(true); setShowFoodMenu(false); setShowMoreMenu(false); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 10,
      active: showGameMenu,
    },
    {
      icon: '👟',
      label: 'さんぽ',
      onClick: () => { setShowFoodMenu(false); setShowGameMenu(false); setShowMoreMenu(false); onWalk(); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 15,
      active: false,
    },
    {
      icon: '🧹',
      label: 'おそうじ',
      onClick: () => { clean(); setShowFoodMenu(false); setShowGameMenu(false); setShowMoreMenu(false); },
      disabled: character.is_sleeping || character.cleanliness >= 100,
      active: false,
    },
    {
      icon: '•••',
      label: 'その他',
      onClick: () => { setShowMoreMenu(!showMoreMenu); setShowFoodMenu(false); setShowGameMenu(false); },
      disabled: false,
      active: showMoreMenu,
    },
  ];

  // 「その他」メニューの中身
  const moreActions = [
    { icon: '🤚', label: 'なでる', onClick: handlePet, disabled: character.is_sleeping || petCooldown },
    { icon: '💊', label: '治療', onClick: () => cure(), disabled: !character.is_sick },
    { icon: '👆', label: 'しつけ', onClick: () => discipline(), disabled: character.is_sleeping },
    { icon: character.is_sleeping ? '☀️' : '🌙', label: character.is_sleeping ? '起こす' : 'ねる', onClick: () => toggleSleep(), disabled: false },
  ];

  const miniGames = [
    { key: 'janken', icon: '✊', label: 'じゃんけん' },
    { key: 'memory', icon: '🃏', label: '神経衰弱' },
    { key: 'rhythm', icon: '🎵', label: 'リズム' },
    { key: 'quiz', icon: '❓', label: 'クイズ' },
    { key: 'whack', icon: '🐹', label: 'もぐら' },
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
    <>
      {/* ボトムドック */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="max-w-lg mx-auto">
          {/* コンパクトステータス表示 */}
          <div className="flex justify-center gap-3 px-4 mb-2">
            <CompactStatus icon="🍔" value={character.hunger} color="#fb923c" />
            <CompactStatus icon="💕" value={character.happiness} color="#f472b6" />
            <CompactStatus icon="💪" value={character.stamina} color="#4ade80" />
            <CompactStatus icon="✨" value={character.cleanliness} color="#60a5fa" />
            {character.is_sick && (
              <div className="flex items-center">
                <span className="text-sm animate-pulse">🤒</span>
              </div>
            )}
          </div>

          {/* ドックバー */}
          <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 px-2 pt-2 pb-2">
            <div className="flex items-end justify-around max-w-sm mx-auto relative">
              {dockActions.map((action, i) => (
                <div key={action.label} className="relative">
                  {/* 「その他」のサブメニュー */}
                  {i === 4 && (
                    <SubActionMenu
                      isOpen={showMoreMenu}
                      onClose={() => setShowMoreMenu(false)}
                      actions={moreActions}
                    />
                  )}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`flex flex-col items-center gap-0.5 w-16 py-1.5 rounded-2xl transition-all ${
                      action.disabled
                        ? 'opacity-30 cursor-not-allowed'
                        : action.active
                          ? 'bg-purple-50'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <span className={`text-2xl transition-transform ${action.active ? 'scale-110' : ''}`}>
                      {action.icon}
                    </span>
                    <span className={`text-[10px] font-medium transition-colors ${
                      action.active ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {action.label}
                    </span>
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 食事メニュー */}
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
              onClick={() => { feed(food.key); setShowFoodMenu(false); }}
              className="flex flex-col items-center py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
            >
              <span className="text-3xl">{food.icon}</span>
              <span className="text-sm text-gray-700 font-medium mt-1.5">{food.label}</span>
            </button>
          ))}
          <button
            onClick={() => { giveSnack(); setShowFoodMenu(false); }}
            className="flex flex-col items-center py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition"
          >
            <span className="text-3xl">🍪</span>
            <span className="text-sm text-gray-700 font-medium mt-1.5">おやつ</span>
          </button>
        </div>
      </BottomSheet>

      {/* ミニゲーム選択 */}
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

      <AnimatePresence>
        {activeGame === 'memory' && (
          <MiniGameMemory
            onClose={() => setActiveGame(null)}
            onComplete={(score, fastClear) => handleGameComplete('memory', score, { fastClear })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame === 'rhythm' && (
          <MiniGameRhythm
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('rhythm', score)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame === 'quiz' && (
          <MiniGameQuiz
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('quiz', score)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame === 'whack' && (
          <MiniGameWhack
            onClose={() => setActiveGame(null)}
            onComplete={(score) => handleGameComplete('whack', score)}
          />
        )}
      </AnimatePresence>
    </>
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

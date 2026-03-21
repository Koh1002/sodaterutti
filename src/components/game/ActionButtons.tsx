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

/** BottomSheet */
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
            className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass rounded-t-4xl shadow-soft-md pb-safe"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[3px] bg-base-300/50 rounded-full" />
            </div>
            <p className="text-xs text-text-secondary font-medium text-center mb-3 tracking-airy">{title}</p>
            <div className="px-5 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** アウトラインアイコン */
function ActionIcon({ type, size = 21 }: { type: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case 'meal':
      return <svg {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>;
    case 'play':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>;
    case 'walk':
      return <svg {...props}><path d="M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" stroke="none" /><path d="M7 21l3-4" /><path d="M16 21l-2-4-3-3 1-6" /><path d="M6 12l2-3 4.5-1" /><path d="M15 7l-1.5 4" /></svg>;
    case 'clean':
      return <svg {...props}><path d="M12 3v5" /><path d="M5.5 8h13l-1.5 13H7L5.5 8z" /><path d="M9 12v4" /><path d="M15 12v4" /></svg>;
    case 'sleep':
      return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case 'wake':
      return <svg {...props}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
    case 'more':
      return <svg {...props}><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /></svg>;
    case 'pet':
      return <svg {...props}><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>;
    case 'cure':
      return <svg {...props}><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10" /><path d="M17 4v8a5 5 0 0 1-10 0V4" /></svg>;
    case 'discipline':
      return <svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
    default:
      return null;
  }
}

/** ステータスカラー（くすみ系） */
const statusColors = {
  hunger: '#C4A4A7',     // くすみローズ
  happiness: '#B5A0A8',  // モーヴ
  stamina: '#B9BAA3',    // セージグリーン
  cleanliness: '#8E9AAF', // くすみブルー
};

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

  const closeAll = () => { setShowFoodMenu(false); setShowGameMenu(false); setShowMoreMenu(false); };

  const dockActions = [
    {
      icon: 'meal',
      label: 'ごはん',
      onClick: () => { closeAll(); setShowFoodMenu(true); },
      disabled: character.is_sleeping,
      active: showFoodMenu,
    },
    {
      icon: 'play',
      label: 'あそぶ',
      onClick: () => { closeAll(); setShowGameMenu(true); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 10,
      active: showGameMenu,
    },
    {
      icon: 'walk',
      label: 'さんぽ',
      onClick: () => { closeAll(); onWalk(); },
      disabled: character.is_sleeping || character.is_sick || character.stamina < 15,
      active: false,
    },
    {
      icon: 'clean',
      label: 'おそうじ',
      onClick: () => { closeAll(); clean(); },
      disabled: character.is_sleeping || character.cleanliness >= 100,
      active: false,
    },
    {
      icon: character.is_sleeping ? 'wake' : 'sleep',
      label: character.is_sleeping ? '起こす' : 'ねる',
      onClick: () => { closeAll(); toggleSleep(); },
      disabled: false,
      active: false,
    },
  ];

  const moreActions = [
    { icon: 'pet', label: 'なでる', onClick: handlePet, disabled: character.is_sleeping || petCooldown },
    { icon: 'cure', label: '治療', onClick: () => cure(), disabled: !character.is_sick },
    { icon: 'discipline', label: 'しつけ', onClick: () => discipline(), disabled: character.is_sleeping },
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
      {/* ===== Floating Bottom Dock ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-safe">
        <div className="max-w-lg mx-auto">
          {/* コンパクトステータス */}
          <div className="flex justify-center gap-5 px-4 pb-2">
            <CompactStatus icon="◐" value={character.hunger} label="お腹" color={statusColors.hunger} />
            <CompactStatus icon="◑" value={character.happiness} label="気持ち" color={statusColors.happiness} />
            <CompactStatus icon="◒" value={character.stamina} label="体力" color={statusColors.stamina} />
            <CompactStatus icon="◓" value={character.cleanliness} label="清潔" color={statusColors.cleanliness} />
            {character.is_sick && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs opacity-50">!</span>
                <div className="flex gap-[3px]">{Array.from({length:5}).map((_,i) => <div key={i} className="w-[5px] h-[5px] rounded-full bg-muted-rose/70" />)}</div>
                <span className="text-[8px] text-muted-rose tracking-wide">病気</span>
              </div>
            )}
          </div>

          {/* Floating ドックバー */}
          <div className="glass rounded-3xl shadow-soft-md mb-1">
            <div className="flex items-center justify-around max-w-md mx-auto px-1 py-1.5">
              {dockActions.map((action) => (
                <motion.button
                  key={action.label}
                  whileTap={{ scale: 0.88, y: 1 }}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
                    action.disabled
                      ? 'opacity-20 cursor-not-allowed'
                      : action.active
                        ? 'bg-white/40'
                        : 'active:bg-white/30'
                  }`}
                >
                  <span className={`transition-transform ${action.active ? 'scale-110 text-muted-blue' : 'text-text-secondary'}`}>
                    <ActionIcon type={action.icon} />
                  </span>
                  <span className={`text-[9px] font-medium mt-0.5 tracking-relaxed transition-colors ${
                    action.active ? 'text-muted-blue' : 'text-text-tertiary'
                  }`}>
                    {action.label}
                  </span>
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.88, y: 1 }}
                onClick={() => { closeAll(); setShowMoreMenu(true); }}
                className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
                  showMoreMenu ? 'bg-white/40' : 'active:bg-white/30'
                }`}
              >
                <span className={showMoreMenu ? 'text-muted-blue' : 'text-text-secondary'}>
                  <ActionIcon type="more" />
                </span>
                <span className={`text-[9px] font-medium mt-0.5 tracking-relaxed ${
                  showMoreMenu ? 'text-muted-blue' : 'text-text-tertiary'
                }`}>
                  その他
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* その他メニュー */}
      <BottomSheet isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} title="その他のアクション">
        <div className="grid grid-cols-3 gap-3">
          {moreActions.map((action) => (
            <button
              key={action.label}
              onClick={() => { if (!action.disabled) { action.onClick(); setShowMoreMenu(false); } }}
              disabled={action.disabled}
              className={`flex flex-col items-center py-4 rounded-2xl transition tracking-relaxed press-effect ${
                action.disabled ? 'opacity-20 cursor-not-allowed bg-base-100/50' : 'bg-base-100/50 hover:bg-base-100 active:bg-base-200'
              }`}
            >
              <span className="text-text-secondary mb-1">
                <ActionIcon type={action.icon} size={26} />
              </span>
              <span className="text-xs text-text-secondary font-medium mt-1">{action.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 食事メニュー */}
      <BottomSheet isOpen={showFoodMenu} onClose={() => setShowFoodMenu(false)} title="何を食べる？">
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'onigiri' as const, icon: '🍙', label: 'おにぎり' },
            { key: 'bread' as const, icon: '🍞', label: 'パン' },
            { key: 'cake' as const, icon: '🍰', label: 'ケーキ' },
          ].map((food) => (
            <button
              key={food.key}
              onClick={() => { feed(food.key); setShowFoodMenu(false); }}
              className="flex flex-col items-center py-4 rounded-2xl bg-base-100/50 hover:bg-base-100 active:bg-base-200 transition tracking-relaxed press-effect"
            >
              <span className="text-2xl opacity-80">{food.icon}</span>
              <span className="text-[10px] text-text-secondary font-medium mt-1.5">{food.label}</span>
            </button>
          ))}
          <button
            onClick={() => { giveSnack(); setShowFoodMenu(false); }}
            className="flex flex-col items-center py-4 rounded-2xl bg-base-100/50 hover:bg-base-100 active:bg-base-200 transition tracking-relaxed press-effect"
          >
            <span className="text-2xl opacity-80">🍪</span>
            <span className="text-[10px] text-text-secondary font-medium mt-1.5">おやつ</span>
          </button>
        </div>
      </BottomSheet>

      {/* ミニゲーム選択 */}
      <BottomSheet isOpen={showGameMenu} onClose={() => setShowGameMenu(false)} title="何で遊ぶ？">
        <div className="grid grid-cols-3 gap-3">
          {miniGames.map((game) => {
            const { canPlay } = checkMiniGameCooldown(character, game.key);
            return (
              <button
                key={game.key}
                onClick={() => canPlay && handleStartGame(game.key)}
                className={`flex flex-col items-center py-4 rounded-2xl transition tracking-relaxed press-effect ${
                  canPlay ? 'bg-base-100/50 hover:bg-base-100 active:bg-base-200' : 'opacity-25 cursor-not-allowed bg-base-100/30'
                }`}
              >
                <span className="text-2xl opacity-80">{game.icon}</span>
                <span className="text-[10px] text-text-secondary font-medium mt-1.5">{game.label}</span>
                {!canPlay && (
                  <span className="text-[9px] text-text-tertiary mt-0.5">クール中</span>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ミニゲーム */}
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/15 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && gameOver && onClose()}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="glass rounded-3xl p-6 w-full max-w-sm shadow-soft-md"
      >
        <h3 className="text-base font-medium text-center text-text-primary mb-3 tracking-airy">
          じゃんけんゲーム
        </h3>
        <p className="text-center text-[10px] text-text-tertiary mb-4 tracking-relaxed font-num">
          {gameOver ? '結果発表' : `${round + 1}/3 ラウンド`}
        </p>
        {playerHand && cpuHand && (
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <span className="text-3xl">{hands.find(h => h.key === playerHand)?.emoji}</span>
              <p className="text-[9px] text-text-tertiary mt-1 tracking-relaxed">あなた</p>
            </div>
            <span className="font-num text-xs text-text-tertiary tracking-airy">VS</span>
            <div className="text-center">
              <span className="text-3xl">{hands.find(h => h.key === cpuHand)?.emoji}</span>
              <p className="text-[9px] text-text-tertiary mt-1 tracking-relaxed">相手</p>
            </div>
          </div>
        )}
        {roundResult && (
          <p className={`text-center text-sm font-medium mb-4 tracking-relaxed ${
            roundResult === '勝ち！' ? 'text-muted-sage' :
            roundResult === '負け...' ? 'text-muted-rose' :
            'text-text-tertiary'
          }`}>
            {roundResult}
          </p>
        )}
        {!gameOver ? (
          <div className="flex justify-center gap-3">
            {hands.map((hand) => (
              <motion.button
                key={hand.key}
                whileTap={{ scale: 0.9, y: 2 }}
                onClick={() => playRound(hand.key)}
                className="flex flex-col items-center p-3 rounded-2xl bg-base-100/50 hover:bg-base-100 transition press-effect"
              >
                <span className="text-3xl">{hand.emoji}</span>
                <span className="text-[9px] text-text-tertiary mt-1 tracking-relaxed">{hand.label}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-lg font-light text-text-primary tracking-relaxed">
              {wins >= 3 ? 'パーフェクト！' : wins >= 2 ? '大成功！' : wins >= 1 ? '成功！' : '残念...'}
            </p>
            <p className="font-num text-[10px] text-text-tertiary tracking-relaxed">{wins}勝 / 3回</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-muted-blue/80 text-white rounded-xl hover:bg-muted-blue transition font-medium text-sm tracking-relaxed press-effect"
            >
              閉じる
            </button>
          </div>
        )}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < round
                  ? i < wins ? 'bg-muted-sage' : 'bg-muted-rose/60'
                  : 'bg-base-200'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameInstructionPopup } from './GameInstructionPopup';

interface MiniGameWhackProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

const GAME_DURATION = 15000; // 15秒
const SPAWN_INTERVAL = 900; // 0.9秒ごとに出現
const MOLE_VISIBLE_TIME = 1200; // 1.2秒間表示

interface Mole {
  id: number;
  hole: number;
  isGood: boolean; // true=たたく false=たたいちゃダメ
  appearedAt: number;
}

export function MiniGameWhack({ onClose, onComplete }: MiniGameWhackProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [tappedHoles, setTappedHoles] = useState<Set<number>>(new Set());
  const nextId = useRef(0);
  const completed = useRef(false);

  const handleStartGame = () => {
    setShowInstructions(false);
    setGameActive(true);
  };

  // タイマー
  useEffect(() => {
    if (gameOver || !gameActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 100;
        if (next <= 0) {
          setGameOver(true);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, gameActive]);

  // ゲーム終了時にスコア送信
  useEffect(() => {
    if (gameOver && !completed.current) {
      completed.current = true;
      onComplete(score);
    }
  }, [gameOver, score, onComplete]);

  // もぐら出現
  useEffect(() => {
    if (gameOver || !gameActive) return;
    const interval = setInterval(() => {
      const hole = Math.floor(Math.random() * 9);
      const isGood = Math.random() > 0.25; // 75%は良いもぐら
      const id = nextId.current++;
      const now = Date.now();

      setMoles((prev) => {
        // 同じ穴に既にいたら出さない
        if (prev.some((m) => m.hole === hole)) return prev;
        return [...prev, { id, hole, isGood, appearedAt: now }];
      });

      // 一定時間後に消す
      setTimeout(() => {
        setMoles((prev) => prev.filter((m) => m.id !== id));
      }, MOLE_VISIBLE_TIME);
    }, SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [gameOver, gameActive]);

  const handleTap = useCallback((mole: Mole) => {
    if (gameOver) return;
    setMoles((prev) => prev.filter((m) => m.id !== mole.id));
    setTappedHoles((prev) => new Set(prev).add(mole.hole));
    setTimeout(() => {
      setTappedHoles((prev) => {
        const next = new Set(prev);
        next.delete(mole.hole);
        return next;
      });
    }, 200);

    if (mole.isGood) {
      setScore((s) => s + 1);
    } else {
      setMisses((m) => m + 1);
      setScore((s) => Math.max(0, s - 2));
    }
  }, [gameOver]);

  const timePercent = (timeLeft / GAME_DURATION) * 100;
  const finalScore = Math.max(0, Math.min(3, Math.floor(score / 4)));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && gameOver && onClose()}
    >
      <GameInstructionPopup
        isOpen={showInstructions}
        title="もぐらたたき"
        emoji="🐹"
        instructions={[
          '穴から出てくるもぐらをタップしよう',
          '🐹をタップするとスコアアップ！',
          '💣は避けてね（スコアが減るよ）',
          '15秒間でたくさんゲットしよう！',
        ]}
        onStart={handleStartGame}
      />
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-bold text-center text-amber-600 mb-2">
          もぐらたたき
        </h3>

        {!gameOver && (
          <>
            {/* タイマーバー */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-100"
                  style={{ width: `${timePercent}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-600 w-10 text-right">
                {Math.ceil(timeLeft / 1000)}秒
              </span>
            </div>

            <p className="text-center text-sm text-gray-500 mb-3">
              スコア: <span className="font-bold text-amber-600 text-lg">{score}</span>
              {misses > 0 && <span className="text-red-400 ml-2">ミス: {misses}</span>}
            </p>

            {/* 3x3 グリッド */}
            <div className="grid grid-cols-3 gap-2 aspect-square max-w-[280px] mx-auto">
              {Array.from({ length: 9 }).map((_, i) => {
                const mole = moles.find((m) => m.hole === i);
                const isTapped = tappedHoles.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => mole && handleTap(mole)}
                    className={`
                      rounded-2xl border-2 flex items-center justify-center text-3xl
                      transition-all duration-100
                      ${isTapped
                        ? 'bg-yellow-200 border-yellow-400 scale-95'
                        : mole
                          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 active:scale-90'
                          : 'bg-amber-800/20 border-amber-800/10'
                      }
                    `}
                  >
                    {mole ? (
                      <motion.span
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="select-none"
                      >
                        {mole.isGood ? '🐹' : '💣'}
                      </motion.span>
                    ) : (
                      <span className="text-lg opacity-30">🕳️</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">🐹をタップ！💣は避けてね</p>
          </>
        )}

        {gameOver && (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl font-bold">
              {finalScore >= 3 ? '👑 パーフェクト！' : finalScore >= 2 ? '🎉 大成功！' : finalScore >= 1 ? '✨ 成功！' : '😅 残念...'}
            </p>
            <p className="text-sm text-gray-500">{score}匹ゲット！（ミス: {misses}回）</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-bold"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

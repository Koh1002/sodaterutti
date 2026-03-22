'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameInstructionPopup } from './GameInstructionPopup';

interface MiniGameRhythmProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

interface Note {
  id: number;
  targetTime: number;
  emoji: string;
  hit: 'perfect' | 'good' | 'miss' | null;
}

const NOTE_EMOJIS = ['🎵', '⭐', '💖', '🌟', '🎶'];
const TOTAL_NOTES = 10;
const PERFECT_WINDOW = 100; // ms
const GOOD_WINDOW = 250;   // ms
const GAME_DURATION = 8000; // 8秒
const NOTE_INTERVAL = GAME_DURATION / TOTAL_NOTES;

export function MiniGameRhythm({ onClose, onComplete }: MiniGameRhythmProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState({ perfect: 0, good: 0, miss: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastHit, setLastHit] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // ゲーム初期化
  useEffect(() => {
    const generatedNotes: Note[] = Array.from({ length: TOTAL_NOTES }, (_, i) => ({
      id: i,
      targetTime: NOTE_INTERVAL * (i + 1),
      emoji: NOTE_EMOJIS[Math.floor(Math.random() * NOTE_EMOJIS.length)],
      hit: null,
    }));
    setNotes(generatedNotes);
  }, []);

  // アニメーションループ
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min(1, elapsed / (GAME_DURATION + 500)));

      // 自動miss判定
      if (currentNoteIndex < notes.length) {
        const note = notes[currentNoteIndex];
        if (elapsed > note.targetTime + GOOD_WINDOW) {
          setNotes(prev => prev.map((n, i) =>
            i === currentNoteIndex ? { ...n, hit: 'miss' } : n
          ));
          setScore(prev => ({ ...prev, miss: prev.miss + 1 }));
          setLastHit('MISS');
          setCurrentNoteIndex(prev => prev + 1);
        }
      }

      // ゲーム終了判定
      if (elapsed > GAME_DURATION + 800) {
        setGameOver(true);
        const finalScore = score.perfect * 3 + score.good * 1;
        const gameScore = finalScore >= 20 ? 3 : finalScore >= 10 ? 2 : finalScore >= 5 ? 1 : 0;
        onComplete(gameScore);
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameStarted, gameOver, currentNoteIndex, notes, score, onComplete]);

  const handleTap = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = Date.now();
      return;
    }
    if (gameOver || currentNoteIndex >= notes.length) return;

    const elapsed = Date.now() - startTimeRef.current;
    const note = notes[currentNoteIndex];
    const diff = Math.abs(elapsed - note.targetTime);

    let hit: 'perfect' | 'good' | 'miss';
    if (diff <= PERFECT_WINDOW) {
      hit = 'perfect';
      setScore(prev => ({ ...prev, perfect: prev.perfect + 1 }));
      setLastHit('PERFECT!');
    } else if (diff <= GOOD_WINDOW) {
      hit = 'good';
      setScore(prev => ({ ...prev, good: prev.good + 1 }));
      setLastHit('GOOD!');
    } else {
      hit = 'miss';
      setScore(prev => ({ ...prev, miss: prev.miss + 1 }));
      setLastHit('MISS');
    }

    setNotes(prev => prev.map((n, i) =>
      i === currentNoteIndex ? { ...n, hit } : n
    ));
    setCurrentNoteIndex(prev => prev + 1);
  }, [gameStarted, gameOver, currentNoteIndex, notes]);

  const totalHits = score.perfect + score.good + score.miss;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <GameInstructionPopup
        isOpen={showInstructions}
        title="リズムゲーム"
        emoji="🎵"
        instructions={[
          'マークが光ったらタップ！',
          'タイミングよく押してPERFECTを狙おう',
          '10個のノートが流れてくるよ',
          'PERFECTが多いほど高得点！',
        ]}
        onStart={() => setShowInstructions(false)}
      />
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-center text-purple-600 mb-3">
          リズムゲーム
        </h3>

        {!gameStarted ? (
          <div className="text-center space-y-4 py-6">
            <div className="text-5xl">🎵</div>
            <p className="text-sm text-gray-500">
              マークが光ったらタップ！<br />
              タイミングよく押してね！
            </p>
            <button
              onClick={handleTap}
              className="px-8 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition text-lg"
            >
              スタート！
            </button>
          </div>
        ) : !gameOver ? (
          <div className="space-y-4">
            {/* プログレスバー */}
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* ノート表示 */}
            <div className="flex flex-wrap gap-2 justify-center min-h-[48px]">
              {notes.map((note) => {
                const elapsed = Date.now() - startTimeRef.current;
                const isActive = note.id === currentNoteIndex &&
                  Math.abs(elapsed - note.targetTime) < GOOD_WINDOW * 2;

                return (
                  <div
                    key={note.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${
                      note.hit === 'perfect' ? 'bg-yellow-200 scale-110' :
                      note.hit === 'good' ? 'bg-green-200' :
                      note.hit === 'miss' ? 'bg-red-200 opacity-50' :
                      isActive ? 'bg-purple-300 animate-pulse scale-125' :
                      'bg-gray-100'
                    }`}
                  >
                    {note.emoji}
                  </div>
                );
              })}
            </div>

            {/* 判定表示 */}
            <div className="text-center h-8">
              {lastHit && (
                <motion.p
                  key={totalHits}
                  initial={{ opacity: 1, scale: 1.3 }}
                  animate={{ opacity: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`text-lg font-bold ${
                    lastHit === 'PERFECT!' ? 'text-yellow-500' :
                    lastHit === 'GOOD!' ? 'text-green-500' :
                    'text-red-400'
                  }`}
                >
                  {lastHit}
                </motion.p>
              )}
            </div>

            {/* タップボタン */}
            <motion.button
              whileTap={{ scale: 0.9, backgroundColor: '#a855f7' }}
              onClick={handleTap}
              className="w-full py-8 bg-purple-400 text-white rounded-2xl text-2xl font-bold active:bg-purple-600 transition"
            >
              TAP!
            </motion.button>
          </div>
        ) : (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl font-bold">
              {score.perfect >= 7 ? '🎵 リズムマスター！' :
               score.perfect >= 4 ? '⭐ ナイス！' : '🎶 がんばった！'}
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-yellow-600 font-bold">{score.perfect}</p>
                <p className="text-xs text-gray-500">PERFECT</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-green-600 font-bold">{score.good}</p>
                <p className="text-xs text-gray-500">GOOD</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-red-400 font-bold">{score.miss}</p>
                <p className="text-xs text-gray-500">MISS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
            >
              とじる
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

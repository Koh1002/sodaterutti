'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameInstructionPopup } from './GameInstructionPopup';

interface MiniGameMemoryProps {
  onClose: () => void;
  onComplete: (score: number, fastClear: boolean) => void;
}

const CARD_EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🌸', '⭐', '🎵'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MiniGameMemory({ onClose, onComplete }: MiniGameMemoryProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // 初期化
  useEffect(() => {
    const emojis = [...CARD_EMOJIS, ...CARD_EMOJIS];
    const shuffled = emojis
      .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  const handleStartGame = () => {
    setShowInstructions(false);
    setStartTime(Date.now());
  };

  // タイマー
  useEffect(() => {
    if (gameOver || startTime === 0) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, gameOver]);

  const handleCardClick = useCallback((cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first)!;
      const secondCard = newCards.find(c => c.id === second)!;

      if (firstCard.emoji === secondCard.emoji) {
        // マッチ！
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          ));
          const newMatches = matches + 1;
          setMatches(newMatches);
          setFlippedCards([]);
          setIsChecking(false);

          if (newMatches === CARD_EMOJIS.length) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
            setGameOver(true);
            // スコア：少ない手数・短い時間ほど高スコア
            const score = elapsed <= 30 ? 3 : elapsed <= 60 ? 2 : 1;
            onComplete(score, elapsed <= 30);
          }
        }, 300);
      } else {
        // 不一致
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }, [cards, flippedCards, isChecking, matches, onComplete, startTime]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <GameInstructionPopup
        isOpen={showInstructions}
        title="神経衰弱"
        emoji="🃏"
        instructions={[
          'カードをタップしてめくろう',
          '同じ絵柄のペアを見つけよう',
          '8ペア全部揃えたらクリア！',
          '30秒以内なら最高得点！',
        ]}
        onStart={handleStartGame}
      />
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-center text-purple-600 mb-2">
          神経衰弱
        </h3>

        <div className="flex justify-between text-xs text-gray-500 mb-3 px-1">
          <span>{moves}手</span>
          <span>{matches}/{CARD_EMOJIS.length}ペア</span>
          <span>{elapsedTime}秒</span>
        </div>

        {!gameOver ? (
          <div className="grid grid-cols-4 gap-2">
            {cards.map(card => (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                  card.isMatched
                    ? 'bg-green-100 border-2 border-green-300'
                    : card.isFlipped
                    ? 'bg-purple-50 border-2 border-purple-300'
                    : 'bg-purple-200 hover:bg-purple-300 border-2 border-purple-200'
                }`}
                disabled={card.isFlipped || card.isMatched}
              >
                {card.isFlipped || card.isMatched ? card.emoji : '?'}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl font-bold">
              {elapsedTime <= 30 ? '🧠 天才！' : elapsedTime <= 60 ? '⭐ すごい！' : '✨ クリア！'}
            </p>
            <p className="text-sm text-gray-500">{moves}手 / {elapsedTime}秒</p>
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

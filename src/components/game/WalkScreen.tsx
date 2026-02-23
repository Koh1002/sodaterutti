'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomWalkEvents, calculateWalkEffects, hasRareEvent, type WalkEvent } from '@/lib/walk-events';
import { useGameStore } from '@/stores/game-store';

interface WalkScreenProps {
  onClose: () => void;
}

type WalkPhase = 'walking' | 'events' | 'summary';

export function WalkScreen({ onClose }: WalkScreenProps) {
  const { walk } = useGameStore();
  const [phase, setPhase] = useState<WalkPhase>('walking');
  const [events, setEvents] = useState<WalkEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [effects, setEffects] = useState<Record<string, number>>({});

  useEffect(() => {
    // 散歩開始 → 2秒後にイベント表示
    const walkEvents = getRandomWalkEvents(3);
    setEvents(walkEvents);
    setEffects(calculateWalkEffects(walkEvents));

    const timer = setTimeout(() => setPhase('events'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      // すべてのイベント表示後、効果を適用
      walk(effects, hasRareEvent(events));
      setPhase('summary');
    }
  };

  const currentEvent = events[currentEventIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-green-200 via-green-100 to-yellow-50 z-50 flex flex-col items-center justify-center p-6"
    >
      <AnimatePresence mode="wait">
        {phase === 'walking' && (
          <motion.div
            key="walking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ x: [-20, 20, -20] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-8xl"
            >
              🚶
            </motion.div>
            <p className="text-xl font-bold text-green-700">おさんぽ中...</p>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-green-400 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'events' && currentEvent && (
          <motion.div
            key={`event-${currentEventIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              {events.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= currentEventIndex ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-6xl"
            >
              {currentEvent.emoji}
            </motion.div>

            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {currentEvent.title}
                {currentEvent.rarity === 'rare' && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full">
                    レア！
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{currentEvent.description}</p>
            </div>

            {/* 効果表示 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(currentEvent.effects).map(([key, val]) => (
                <span
                  key={key}
                  className={`text-xs px-2 py-1 rounded-full ${
                    (val || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}
                >
                  {effectLabel(key)} {(val || 0) > 0 ? '+' : ''}{val}
                </span>
              ))}
            </div>

            <button
              onClick={handleNextEvent}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
            >
              {currentEventIndex < events.length - 1 ? 'つぎへ' : 'おさんぽ終了！'}
            </button>
          </motion.div>
        )}

        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center space-y-4"
          >
            <div className="text-5xl">🏠</div>
            <h3 className="text-lg font-bold text-gray-800">おかえり！</h3>
            <p className="text-sm text-gray-500">たのしいおさんぽだったね！</p>

            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              {Object.entries(effects).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{effectLabel(key)}</span>
                  <span className={val > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {val > 0 ? '+' : ''}{val}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition"
            >
              とじる
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function effectLabel(key: string): string {
  const labels: Record<string, string> = {
    happiness: 'きもち',
    hunger: 'おなか',
    stamina: 'たいりょく',
    weight: 'たいじゅう',
    cleanliness: 'きれいさ',
  };
  return labels[key] || key;
}

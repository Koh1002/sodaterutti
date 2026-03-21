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
      className="fixed inset-0 bg-gradient-to-b from-[#E8EFE8] via-[#F0F4EE] to-base-50 z-50 flex flex-col items-center justify-center p-6"
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
              animate={{ x: [-15, 15, -15] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl opacity-50"
            >
              🚶
            </motion.div>
            <p className="text-sm text-text-secondary tracking-airy">おさんぽ中...</p>
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-muted-sage rounded-full"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'events' && currentEvent && (
          <motion.div
            key={`event-${currentEventIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ ease: [0.23, 1, 0.32, 1] }}
            className="glass rounded-3xl shadow-soft-md p-6 w-full max-w-sm text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              {events.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i <= currentEventIndex ? 'bg-muted-sage' : 'bg-base-200'
                  }`}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-5xl opacity-70"
            >
              {currentEvent.emoji}
            </motion.div>

            <div>
              <h3 className="text-sm font-medium text-text-primary tracking-relaxed">
                {currentEvent.title}
                {currentEvent.rarity === 'rare' && (
                  <span className="ml-2 text-[9px] px-2 py-0.5 bg-base-200/60 text-muted-blue rounded-full tracking-wide">
                    レア
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-tertiary mt-2 tracking-relaxed leading-relaxed">{currentEvent.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {Object.entries(currentEvent.effects).map(([key, val]) => (
                <span
                  key={key}
                  className={`font-num text-[10px] px-2.5 py-1 rounded-full tracking-relaxed ${
                    (val || 0) > 0 ? 'bg-muted-sage/15 text-muted-sage' : 'bg-muted-rose/15 text-muted-rose'
                  }`}
                >
                  {effectLabel(key)} {(val || 0) > 0 ? '+' : ''}{val}
                </span>
              ))}
            </div>

            <button
              onClick={handleNextEvent}
              className="w-full py-3 bg-muted-sage/80 text-white rounded-2xl font-medium text-sm hover:bg-muted-sage transition tracking-relaxed press-effect"
            >
              {currentEventIndex < events.length - 1 ? 'つぎへ' : 'おさんぽ終了'}
            </button>
          </motion.div>
        )}

        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.23, 1, 0.32, 1] }}
            className="glass rounded-3xl shadow-soft-md p-6 w-full max-w-sm text-center space-y-4"
          >
            <div className="text-3xl opacity-50">🏠</div>
            <h3 className="text-sm font-medium text-text-primary tracking-airy">おかえり！</h3>
            <p className="text-xs text-text-tertiary tracking-relaxed">たのしいおさんぽだったね</p>

            <div className="bg-base-100/50 rounded-2xl p-3 space-y-1.5">
              {Object.entries(effects).map(([key, val]) => (
                <div key={key} className="flex justify-between text-xs tracking-relaxed">
                  <span className="text-text-secondary">{effectLabel(key)}</span>
                  <span className={`font-num ${val > 0 ? 'text-muted-sage' : 'text-muted-rose'}`}>
                    {val > 0 ? '+' : ''}{val}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-muted-blue/80 text-white rounded-2xl font-medium text-sm hover:bg-muted-blue transition tracking-relaxed press-effect"
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

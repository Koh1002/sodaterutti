'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

interface DailyMissionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyMissionPanel({ isOpen, onClose }: DailyMissionPanelProps) {
  const { dailyMissions, claimMissionReward } = useGameStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/15 backdrop-blur-[2px] flex items-end justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass rounded-t-4xl w-full max-w-lg p-5 pb-8 shadow-soft-md"
          >
            <div className="flex justify-center pt-0 pb-2">
              <div className="w-9 h-[3px] bg-base-300/50 rounded-full" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-text-primary tracking-airy">
                きょうのミッション
              </h3>
              <button onClick={onClose} className="text-text-tertiary text-lg hover:text-text-secondary transition press-effect">
                &times;
              </button>
            </div>

            {dailyMissions.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6 tracking-relaxed">
                ミッションを読み込み中...
              </p>
            ) : (
              <div className="space-y-2.5">
                {dailyMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      mission.is_completed
                        ? 'bg-muted-sage/10 border-muted-sage/20'
                        : 'bg-base-100/40 border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-xs font-medium tracking-relaxed ${
                          mission.is_completed ? 'text-muted-sage' : 'text-text-primary'
                        }`}>
                          {mission.is_completed ? '● ' : '○ '}
                          {mission.mission_label}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 bg-base-200/40 rounded-full h-[4px] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                mission.is_completed ? 'bg-muted-sage/70' : 'bg-muted-blue/50'
                              }`}
                              style={{
                                width: `${Math.min(100, (mission.current_count / mission.target_count) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="font-num text-[10px] text-text-tertiary">
                            {mission.current_count}/{mission.target_count}
                          </span>
                        </div>
                      </div>

                      {mission.is_completed && (
                        <button
                          onClick={() => claimMissionReward(mission.id)}
                          className="ml-3 px-3 py-1.5 bg-muted-sage/70 text-white text-[10px] rounded-xl font-medium hover:bg-muted-sage transition tracking-relaxed press-effect"
                        >
                          受取
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-text-tertiary mt-1 tracking-relaxed">
                      報酬: {rewardLabel(mission.reward_type)} +{mission.reward_amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function rewardLabel(type: string): string {
  const labels: Record<string, string> = {
    happiness: 'きもち',
    hunger: 'おなか',
    stamina: 'たいりょく',
    cleanliness: 'きれいさ',
  };
  return labels[type] || type;
}

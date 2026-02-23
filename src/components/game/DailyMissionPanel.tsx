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
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-t-2xl w-full max-w-lg p-5 pb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                📋 きょうのミッション
              </h3>
              <button onClick={onClose} className="text-gray-400 text-xl">
                &times;
              </button>
            </div>

            {dailyMissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                ミッションを読み込み中...
              </p>
            ) : (
              <div className="space-y-3">
                {dailyMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      mission.is_completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          mission.is_completed ? 'text-green-600' : 'text-gray-700'
                        }`}>
                          {mission.is_completed ? '✅ ' : '⬜ '}
                          {mission.mission_label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {/* 進捗バー */}
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                mission.is_completed ? 'bg-green-400' : 'bg-purple-400'
                              }`}
                              style={{
                                width: `${Math.min(100, (mission.current_count / mission.target_count) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {mission.current_count}/{mission.target_count}
                          </span>
                        </div>
                      </div>

                      {mission.is_completed && (
                        <button
                          onClick={() => claimMissionReward(mission.id)}
                          className="ml-3 px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg font-medium hover:bg-green-600 transition"
                        >
                          受取
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
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

'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface GameInstructionPopupProps {
  isOpen: boolean;
  title: string;
  emoji: string;
  instructions: string[];
  onStart: () => void;
  /** マルチプレイヤー時: 相手の準備待ち状態 */
  waitingForOthers?: boolean;
}

export function GameInstructionPopup({
  isOpen,
  title,
  emoji,
  instructions,
  onStart,
  waitingForOthers,
}: GameInstructionPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <div className="text-center mb-4">
              <span className="text-5xl block mb-2">{emoji}</span>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-xs font-bold text-gray-500 mb-2">遊び方</p>
              {instructions.map((text, i) => (
                <div key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {waitingForOthers ? (
              <div className="text-center space-y-3">
                <div className="flex justify-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-gray-400">
                  すべてのプレイヤーの準備が完了するまでお待ちください
                </p>
              </div>
            ) : (
              <button
                onClick={onStart}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg text-base active:scale-95 transition"
              >
                OK、開始！
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

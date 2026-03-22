'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameInstructionPopup } from './GameInstructionPopup';

interface MiniGameQuizProps {
  onClose: () => void;
  onComplete: (score: number) => void;
}

interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  emoji: string;
}

const QUIZ_POOL: QuizQuestion[] = [
  {
    question: 'たまごっちが最初に発売されたのはいつ？',
    choices: ['1996年', '1997年', '1998年', '2000年'],
    correctIndex: 0,
    emoji: '🥚',
  },
  {
    question: 'おなかがすいたキャラにあげるべきものは？',
    choices: ['おもちゃ', 'ごはん', 'おくすり', 'おふろ'],
    correctIndex: 1,
    emoji: '🍚',
  },
  {
    question: 'きれいさが下がる原因は？',
    choices: ['たべすぎ', 'あそびすぎ', 'うんち', 'ねむり'],
    correctIndex: 2,
    emoji: '💩',
  },
  {
    question: 'キャラが進化するために大切なことは？',
    choices: ['お世話をしっかりする', 'なにもしない', 'ずっと寝かせる', 'おやつだけあげる'],
    correctIndex: 0,
    emoji: '🌟',
  },
  {
    question: '体重が増えすぎるとどうなる？',
    choices: ['進化しやすくなる', '幸せになる', '進化に影響する', '特に何も起きない'],
    correctIndex: 2,
    emoji: '⚖️',
  },
  {
    question: '散歩に行くと何がいいことがある？',
    choices: ['おなかがへる', 'きもちがよくなる', '病気が治る', '体重が増える'],
    correctIndex: 1,
    emoji: '🚶',
  },
  {
    question: 'ベビー期の次のステージは？',
    choices: ['ヤング期', 'アダルト期', 'キッズ期', 'シニア期'],
    correctIndex: 2,
    emoji: '👶',
  },
  {
    question: '病気を治すにはどうする？',
    choices: ['ごはんをあげる', 'そうじする', 'ちりょうする', 'あそぶ'],
    correctIndex: 2,
    emoji: '💊',
  },
  {
    question: 'じゃんけんでグーに勝てるのは？',
    choices: ['チョキ', 'パー', 'グー', 'どれでも勝てない'],
    correctIndex: 1,
    emoji: '✊',
  },
  {
    question: 'しつけをするとどうなる？',
    choices: ['幸福度が上がる', 'しつけ度が上がる', '体重が減る', 'おなかがいっぱいになる'],
    correctIndex: 1,
    emoji: '👆',
  },
  {
    question: '夜中(0時〜6時)のキャラクターはどうなる？',
    choices: ['元気になる', '自動で寝る', '進化する', 'お腹がすく'],
    correctIndex: 1,
    emoji: '🌙',
  },
  {
    question: 'キャラクターの世代が上がるのはいつ？',
    choices: ['進化した時', '結婚した時', '10日経った時', 'レベルアップ時'],
    correctIndex: 1,
    emoji: '👪',
  },
];

export function MiniGameQuiz({ onClose, onComplete }: MiniGameQuizProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const QUESTION_COUNT = 5;

  // 初期化: ランダム5問選出
  useEffect(() => {
    const shuffled = [...QUIZ_POOL].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, QUESTION_COUNT));
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (choiceIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(choiceIndex);
    setShowResult(true);

    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < QUESTION_COUNT - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
        setShowResult(false);
      } else {
        setGameOver(true);
        const finalCorrect = correctCount + (isCorrect ? 1 : 0);
        const score = finalCorrect >= 4 ? 3 : finalCorrect >= 3 ? 2 : finalCorrect >= 1 ? 1 : 0;
        onComplete(score);
      }
    }, 1200);
  };

  if (questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <GameInstructionPopup
        isOpen={showInstructions}
        title="クイズ"
        emoji="❓"
        instructions={[
          'ランダムに5問出題されるよ',
          '4つの選択肢から正解を選ぼう',
          '4問以上正解で最高得点！',
        ]}
        onStart={() => setShowInstructions(false)}
      />
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-center text-purple-600 mb-2">
          クイズ
        </h3>

        {!gameOver ? (
          <div className="space-y-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentIndex + 1}/{QUESTION_COUNT}問</span>
              <span>{correctCount}問正解</span>
            </div>

            {/* 進捗ドット */}
            <div className="flex gap-1 justify-center">
              {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < currentIndex ? 'bg-green-400' :
                    i === currentIndex ? 'bg-purple-400' :
                    'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="text-center py-2">
              <span className="text-4xl mb-2 block">{currentQuestion.emoji}</span>
              <p className="text-sm font-medium text-gray-800">{currentQuestion.question}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {currentQuestion.choices.map((choice, i) => {
                let btnClass = 'bg-gray-50 hover:bg-purple-50 border-gray-200';
                if (showResult) {
                  if (i === currentQuestion.correctIndex) {
                    btnClass = 'bg-green-100 border-green-400';
                  } else if (i === selectedIndex) {
                    btnClass = 'bg-red-100 border-red-400';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={!showResult ? { scale: 0.98 } : undefined}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedIndex !== null}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm transition ${btnClass}`}
                  >
                    <span className="text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {choice}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 py-4">
            <p className="text-3xl font-bold">
              {correctCount >= 4 ? '🧠 ものしり博士！' :
               correctCount >= 3 ? '⭐ すごい！' :
               correctCount >= 1 ? '📚 がんばった！' : '😅 ドンマイ！'}
            </p>
            <p className="text-sm text-gray-500">
              {QUESTION_COUNT}問中 {correctCount}問正解！
            </p>
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

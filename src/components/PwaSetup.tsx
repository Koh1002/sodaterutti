'use client';

import { useEffect, useState } from 'react';

export default function PwaSetup() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    }

    // 通知許可がまだ未決定の場合、少し遅延してからプロンプトを表示
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    setShowPrompt(false);
    if (permission === 'granted') {
      console.log('Notification permission granted');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-purple-200 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-700">通知をオンにしよう！</p>
          <p className="text-xs text-gray-500 mt-1">
            お昼の時間にごはんリマインダーをお届けします
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAllow}
          className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-lg transition"
        >
          オンにする
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition"
        >
          あとで
        </button>
      </div>
    </div>
  );
}

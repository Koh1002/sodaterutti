const THRESHOLD = 30;

type StatKey = 'hunger' | 'cleanliness' | 'happiness';

const STAT_ALERTS: Record<StatKey, { body: string; icon: string }> = {
  hunger: {
    body: 'お腹が空いてピンチ！ご飯をあげよう',
    icon: '🍔',
  },
  cleanliness: {
    body: '掃除はいかが？',
    icon: '✨',
  },
  happiness: {
    body: 'もう飽きちゃった、、？',
    icon: '💕',
  },
};

// 通知済みフラグ（回復したらリセット）
const notified = new Set<StatKey>();

export function checkStatNotifications(stats: Record<StatKey, number>) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  for (const key of Object.keys(STAT_ALERTS) as StatKey[]) {
    const value = stats[key];
    if (value < THRESHOLD && !notified.has(key)) {
      notified.add(key);
      const alert = STAT_ALERTS[key];
      navigator.serviceWorker?.ready.then((reg) => {
        reg.showNotification('そだてるっち', {
          body: alert.body,
          icon: '/icon-192.png',
          tag: `stat-${key}`,
        });
      });
    } else if (value >= THRESHOLD) {
      notified.delete(key);
    }
  }
}

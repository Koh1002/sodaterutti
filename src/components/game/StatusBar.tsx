'use client';

interface StatusBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  icon: string;
}

export function StatusBar({ label, value, maxValue = 100, color, icon }: StatusBarProps) {
  const percentage = Math.round((value / maxValue) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg w-6 text-center shrink-0" role="img" aria-label={label}>{icon}</span>
      <div className="flex-1 bg-black/10 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[11px] text-white/80 w-7 text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** コンパクトなステータスインジケーター（ボトムドック上に表示） */
export function CompactStatus({ icon, value, color }: { icon: string; value: number; color: string }) {
  const percentage = Math.round((value / 100) * 100);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* 背景リング */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
          <circle
            cx="20" cy="20" r={radius} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="text-sm">{icon}</span>
      </div>
    </div>
  );
}

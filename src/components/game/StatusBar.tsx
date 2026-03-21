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
export function CompactStatus({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* 背景リング */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
          <circle
            cx="22" cy="22" r={radius} fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="text-base leading-none">{icon}</span>
      </div>
      <span className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</span>
    </div>
  );
}

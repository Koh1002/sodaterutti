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
    <div className="flex items-center gap-2.5">
      <span className="text-xl w-7 text-center" role="img" aria-label={label}>{icon}</span>
      <span className="text-sm text-gray-700 w-16 shrink-0 font-medium">{label}</span>
      <div className="flex-1 bg-gray-200/70 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-12 text-right font-medium">{value}/{maxValue}</span>
    </div>
  );
}

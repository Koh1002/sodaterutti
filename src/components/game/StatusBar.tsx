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
      <span className="text-lg w-6 text-center" role="img" aria-label={label}>{icon}</span>
      <span className="text-xs text-gray-600 w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{value}/{maxValue}</span>
    </div>
  );
}

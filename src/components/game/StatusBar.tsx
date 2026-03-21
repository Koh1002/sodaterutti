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
      <span className="text-sm w-5 text-center shrink-0 opacity-60" role="img" aria-label={label}>{icon}</span>
      <div className="flex-1 bg-base-200/50 rounded-full h-[5px] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-num text-[10px] text-text-tertiary w-7 text-right tabular-nums">{value}</span>
    </div>
  );
}

/** コンパクトなミニマルステータス（ドット＋細バー） */
export function CompactStatus({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  const dots = 5;
  const filledDots = Math.round((value / 100) * dots);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs leading-none opacity-50">{icon}</span>
      <div className="flex gap-[3px]">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className="w-[5px] h-[5px] rounded-full transition-all duration-500"
            style={{
              backgroundColor: i < filledDots ? color : 'rgba(0,0,0,0.06)',
              opacity: i < filledDots ? 0.8 : 0.3,
            }}
          />
        ))}
      </div>
      <span className="text-[8px] text-text-tertiary tracking-wide">{label}</span>
    </div>
  );
}

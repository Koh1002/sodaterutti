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
      <span className="text-base w-5 text-center shrink-0" role="img" aria-label={label}>{icon}</span>
      <div className="flex-1 bg-warm-200/50 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-warm-500 w-7 text-right font-medium tabular-nums tracking-relaxed">{value}</span>
    </div>
  );
}

/** コンパクトなミニマルステータス（ドット＋細バー） */
export function CompactStatus({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  // 5段階のドット表示
  const dots = 5;
  const filledDots = Math.round((value / 100) * dots);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* アイコン */}
      <span className="text-sm leading-none opacity-70">{icon}</span>
      {/* ドットゲージ */}
      <div className="flex gap-[3px]">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className="w-[5px] h-[5px] rounded-full transition-all duration-500"
            style={{
              backgroundColor: i < filledDots ? color : 'rgba(0,0,0,0.08)',
              opacity: i < filledDots ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      {/* ラベル */}
      <span className="text-[9px] text-warm-400 font-medium tracking-airy">{label}</span>
    </div>
  );
}

/**
 * キャラクター画像マッピング
 * 画像が未生成の場合はSVGプレースホルダーを返す
 */

const IMAGE_BASE_PATH = '/images';

/** image_key から画像パスを返す。画像が存在しない場合はプレースホルダーSVGのdata URIを返す */
export function getCharacterImagePath(imageKey: string): string {
  return `${IMAGE_BASE_PATH}/${imageKey}.png`;
}

/** 表情差分スプライトシートのパスを返す */
export function getExpressionImagePath(imageKey: string): string {
  return `${IMAGE_BASE_PATH}/${imageKey}_expressions.png`;
}

/** プレースホルダーSVG（画像未生成時のフォールバック） */
export function getPlaceholderSvg(label: string, size: number = 256): string {
  const colors: Record<string, string> = {
    baby_boy: '#87CEEB',
    baby_girl: '#FFB6C1',
    kids_marucchi: '#FFFFFF',
    kids_kuchitamacchi: '#FFD700',
    kids_mohitamacchi: '#90EE90',
    kids_mizutamacchi: '#DDA0DD',
    young_marucchi: '#E0E8FF',
    young_kuchicchi: '#FFA500',
    young_mohicchi: '#228B22',
    young_mizucchi: '#6A5ACD',
    young_hoshicchi: '#FFD700',
    young_nijicchi: '#FF69B4',
    adult_mamecchi: '#FFD700',
    adult_memecchi: '#FF69B4',
    adult_kuchipacchi: '#32CD32',
    adult_kikicchi: '#191970',
    adult_flowacchi: '#FFB6C1',
    adult_oyajicchi: '#808080',
    adult_nijirocchi: '#FF6347',
    adult_hoshizoracchi: '#000080',
    adult_hikaricchi: '#FFD700',
    adult_yamicchi: '#4B0082',
    egg_normal: '#FFFACD',
    egg_cracked: '#FFFACD',
    egg_hatching: '#FFFACD',
  };

  const bgColor = colors[label] || '#E8E8E8';
  const displayName = label.replace(/_/g, ' ').replace(/^(adult|kids|young|baby) /, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="20"/>
    <circle cx="${size/2}" cy="${size/2 - 15}" r="${size/4}" fill="white" opacity="0.5"/>
    <circle cx="${size/2 - 20}" cy="${size/2 - 25}" r="8" fill="#333"/>
    <circle cx="${size/2 + 20}" cy="${size/2 - 25}" r="8" fill="#333"/>
    <ellipse cx="${size/2}" cy="${size/2 + 5}" rx="15" ry="8" fill="#333" opacity="0.3"/>
    <text x="${size/2}" y="${size - 30}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#555">${displayName}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 背景画像パスを時間帯で返す */
export function getBackgroundForTime(hour: number): string {
  if (hour >= 6 && hour < 10) return `${IMAGE_BASE_PATH}/bg_morning.png`;
  if (hour >= 10 && hour < 17) return `${IMAGE_BASE_PATH}/bg_afternoon.png`;
  if (hour >= 17 && hour < 20) return `${IMAGE_BASE_PATH}/bg_evening.png`;
  return `${IMAGE_BASE_PATH}/bg_night.png`;
}

/** 背景プレースホルダーを時間帯で返す（ニュアンスカラー） */
export function getBackgroundPlaceholder(hour: number): string {
  const configs: Record<string, { bg: string; sky: string }> = {
    morning: { bg: '#FFFDF8', sky: '#FFF3D6' },     // クリーム〜ウォームホワイト
    afternoon: { bg: '#F4F7F4', sky: '#E8EFE8' },    // セージ系の淡いグリーン
    evening: { bg: '#FFF5F5', sky: '#F5CDD0' },      // ダスティピンク
    night: { bg: '#3D3A38', sky: '#2A2725' },         // ウォームダーク
  };

  let period = 'night';
  if (hour >= 6 && hour < 10) period = 'morning';
  else if (hour >= 10 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 20) period = 'evening';

  const { bg, sky } = configs[period];
  return `linear-gradient(180deg, ${sky} 0%, ${bg} 100%)`;
}

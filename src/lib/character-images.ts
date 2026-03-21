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
    baby_boy: '#B5C7D3',
    baby_girl: '#D5B5BC',
    kids_marucchi: '#E3D5CA',
    kids_kuchitamacchi: '#D5C4A0',
    kids_mohitamacchi: '#B9BAA3',
    kids_mizutamacchi: '#C5B5C8',
    young_marucchi: '#C5CDE0',
    young_kuchicchi: '#D5B88A',
    young_mohicchi: '#7A9A7E',
    young_mizucchi: '#8E8AAF',
    young_hoshicchi: '#D5C4A0',
    young_nijicchi: '#D5899A',
    adult_mamecchi: '#D5C4A0',
    adult_memecchi: '#D5899A',
    adult_kuchipacchi: '#8BAF8E',
    adult_kikicchi: '#5A5A7A',
    adult_flowacchi: '#D5B5BC',
    adult_oyajicchi: '#9A9A9A',
    adult_nijirocchi: '#C5837A',
    adult_hoshizoracchi: '#5A5A7A',
    adult_hikaricchi: '#D5C4A0',
    adult_yamicchi: '#6A5A7A',
    egg_normal: '#F5EBE0',
    egg_cracked: '#F5EBE0',
    egg_hatching: '#F5EBE0',
  };

  const bgColor = colors[label] || '#E3D5CA';
  const displayName = label.replace(/_/g, ' ').replace(/^(adult|kids|young|baby) /, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="20"/>
    <circle cx="${size/2}" cy="${size/2 - 15}" r="${size/4}" fill="white" opacity="0.3"/>
    <circle cx="${size/2 - 20}" cy="${size/2 - 25}" r="6" fill="#4A4A4A" opacity="0.5"/>
    <circle cx="${size/2 + 20}" cy="${size/2 - 25}" r="6" fill="#4A4A4A" opacity="0.5"/>
    <ellipse cx="${size/2}" cy="${size/2 + 5}" rx="12" ry="6" fill="#4A4A4A" opacity="0.15"/>
    <text x="${size/2}" y="${size - 30}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4A4A4A" opacity="0.5">${displayName}</text>
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
    morning: { bg: '#FBF8F4', sky: '#F5EBE0' },     // クリーム
    afternoon: { bg: '#F0F2ED', sky: '#E8EDE4' },    // セージ系
    evening: { bg: '#F5EAEC', sky: '#E8D5D8' },      // モーヴ
    night: { bg: '#3D3A38', sky: '#2A2725' },         // ウォームダーク
  };

  let period = 'night';
  if (hour >= 6 && hour < 10) period = 'morning';
  else if (hour >= 10 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 20) period = 'evening';

  const { bg, sky } = configs[period];
  return `linear-gradient(180deg, ${sky} 0%, ${bg} 100%)`;
}

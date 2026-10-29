const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUMBER_FONT = "Verdana, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const JP_FONT =
  "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', 'Noto Sans CJK JP', Verdana, sans-serif";

// 現行の「国民の祝日」。振替休日・国民の休日はここには含めない。
function isPublicHoliday(date: Date): boolean {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const fixedDays = [
    '1/1',
    '2/11',
    '2/23',
    '4/29',
    '5/3',
    '5/4',
    '5/5',
    '8/11',
    '11/3',
    '11/23',
  ];
  if (fixedDays.includes(`${month}/${day}`)) return true;

  // 第何月曜日かを日にちから求める。
  const week = Math.ceil(day / 7);
  if (date.getUTCDay() === 1) {
    if ((month === 1 || month === 10) && week === 2) return true;
    if ((month === 7 || month === 9) && week === 3) return true;
  }

  // 春分・秋分の近似式（1980年以降の係数）。
  const correction = 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4);
  return (
    (month === 3 && day === Math.floor(20.8431 + correction)) ||
    (month === 9 && day === Math.floor(23.2488 + correction))
  );
}

// 曜日を赤にするための祝日判定（2022年以降のルール）。
function isHoliday(year: number, month: number, day: number): boolean {
  const time = Date.UTC(year, month - 1, day);
  if (isPublicHoliday(new Date(time))) return true;

  // 国民の休日：前日と翌日がともに「国民の祝日」。
  if (
    isPublicHoliday(new Date(time - DAY_MS)) &&
    isPublicHoliday(new Date(time + DAY_MS))
  )
    return true;

  // 振替休日：直前に続く「国民の祝日」の中に日曜日がある。
  for (
    const previous = new Date(time - DAY_MS);
    isPublicHoliday(previous);
    previous.setUTCDate(previous.getUTCDate() - 1)
  ) {
    if (previous.getUTCDay() === 0) return true;
  }
  return false;
}

export default {
  fetch(request: Request): Response {
    // 画像のURLは日本語・英語の2つだけ。
    const path = new URL(request.url).pathname;
    if (path !== '/today/jp.svg' && path !== '/today/en.svg') {
      return new Response('Not Found', { status: 404 });
    }

    // UTCに9時間足してUTCフィールドを読むと、環境によらず日本時間になる。
    const date = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const weekday = date.getUTCDay();
    const labels = path === '/today/jp.svg' ? WEEKDAYS_JP : WEEKDAYS_EN;
    const weekdayClass =
      weekday === 0 || isHoliday(year, month, day)
        ? 'holiday'
        : weekday === 6
          ? 'saturday'
          : '';

    // 枠・日にち・曜日。色はCSSだけで指定し、ダーク時に上書きする。
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
  <style>
    rect { fill: #ffffff; stroke: #cccccc; }
    text { fill: #212121; }
    .holiday { fill: #e53935; }
    .saturday { fill: #1565c0; }
    @media (prefers-color-scheme: dark) {
      rect { fill: #252a30; stroke: #404551; }
      text { fill: #f2f2f2; }
      .saturday { fill: #64b5f6; }
    }
  </style>
  <rect x='10' y='10' width='380' height='280' stroke-width='2' />
  <text x='200' y='160' text-anchor='middle' font-size='160' font-weight='600' font-family="${NUMBER_FONT}">${day}</text>
  <text class='${weekdayClass}' x='200' y='260' text-anchor='middle' font-size='80' font-weight='600' font-family="${JP_FONT}">${labels[weekday]}</text>
</svg>
`;

    // 固定URLでも、アクセスのたびにその日の画像を返す。
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  },
};

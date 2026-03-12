// ============================================================
// Relative time formatting with locale support (ko / en / ja)
// ============================================================

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

type TimeStrings = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
  weeksAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
  yearsAgo: (n: number) => string;
};

const strings: Record<string, TimeStrings> = {
  en: {
    justNow: "just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    weeksAgo: (n) => `${n}w ago`,
    monthsAgo: (n) => `${n}mo ago`,
    yearsAgo: (n) => `${n}y ago`,
  },
  ko: {
    justNow: "방금 전",
    minutesAgo: (n) => `${n}분 전`,
    hoursAgo: (n) => `${n}시간 전`,
    daysAgo: (n) => `${n}일 전`,
    weeksAgo: (n) => `${n}주 전`,
    monthsAgo: (n) => `${n}개월 전`,
    yearsAgo: (n) => `${n}년 전`,
  },
  ja: {
    justNow: "たった今",
    minutesAgo: (n) => `${n}分前`,
    hoursAgo: (n) => `${n}時間前`,
    daysAgo: (n) => `${n}日前`,
    weeksAgo: (n) => `${n}週間前`,
    monthsAgo: (n) => `${n}ヶ月前`,
    yearsAgo: (n) => `${n}年前`,
  },
};

export function getRelativeTime(
  date: Date | string,
  locale: string = "en",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();

  const t = strings[locale] ?? strings.en;

  if (diff < MINUTE) return t.justNow;
  if (diff < HOUR) return t.minutesAgo(Math.floor(diff / MINUTE));
  if (diff < DAY) return t.hoursAgo(Math.floor(diff / HOUR));
  if (diff < WEEK) return t.daysAgo(Math.floor(diff / DAY));
  if (diff < MONTH) return t.weeksAgo(Math.floor(diff / WEEK));
  if (diff < YEAR) return t.monthsAgo(Math.floor(diff / MONTH));
  return t.yearsAgo(Math.floor(diff / YEAR));
}

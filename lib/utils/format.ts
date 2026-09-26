export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatWeightKg(grams: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(grams / 1000);
}

export function formatWeightG(grams: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(grams));
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateKorean(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} (${WEEKDAYS_KO[d.getDay()]})`;
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "로그인 기록 없음";
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  return `${Math.floor(diffMonth / 12)}년 전`;
}

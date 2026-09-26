const KST_TIME_ZONE = "Asia/Seoul";

const kstDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 서버 실행 환경(Vercel 함수는 기본 UTC)과 무관하게 항상 한국 시간(KST) 기준
 * 오늘 날짜를 반환한다. new Date()의 로컬 타임존에 의존하면 서버가 UTC로
 * 동작할 때 00~09시(KST) 사이에 날짜가 하루 밀리는 문제가 생긴다.
 */
export function todayDateString(): string {
  return kstDateFormatter.format(new Date());
}

/**
 * timestamptz(예: created_at)를 "YYYY-MM-DD" 캘린더 날짜로 바꿀 때 사용한다.
 * isoString.slice(0, 10) 은 DB가 반환하는 UTC ISO 문자열을 그대로 잘라
 * UTC 날짜를 보여주므로, 한국 시간 00~09시 사이에 등록/수정된 항목은
 * 하루 전 날짜로 표시되는 문제가 있다.
 */
export function toKstDateString(isoString: string): string {
  return kstDateFormatter.format(new Date(isoString));
}

export function yearMonthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * 로컬 타임존을 거치지 않고 UTC 기준 순수 캘린더 연산으로 날짜를 더한다.
 * (new Date(`${dateStr}T00:00:00`) 는 로컬 자정으로 해석되므로, 그 결과를
 * toISOString()으로 다시 변환하면 UTC+ 타임존에서는 하루가 밀린다.)
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

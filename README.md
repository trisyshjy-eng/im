# 재고관리 (재고 현황 웹 애플리케이션)

생산품·소스류 재고를 실시간으로 파악하는 재고 관리 웹 애플리케이션. 일일 생산량/출고량
입력만으로 재고수량·재고량이 자동 계산되고, 월별 마감(전월재고 이월)도 실시간 트리거로
자동 처리된다.

- **Framework**: Next.js 16 (App Router, Server Actions)
- **DB & Auth**: Supabase (Postgres + Supabase Auth + RLS)
- **Styling**: Tailwind CSS v4
- **배포 대상**: Vercel

## 1. 최초 설정

### 1) 환경 변수

`.env.local.example`을 참고해 `.env.local`을 채운다 (Supabase 프로젝트 설정 → API).

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

배포 환경에서는 이메일 링크(초대/비밀번호 재설정)가 올바른 도메인으로 가도록
`NEXT_PUBLIC_SITE_URL` (예: `https://your-domain.com`)도 설정한다.

### 2) 데이터베이스 마이그레이션 적용 (필수, 1회)

Supabase 대시보드 → **SQL Editor** 에서 `supabase/migrations/0001_init.sql` 파일의
전체 내용을 붙여넣고 실행한다. (테이블, RLS 정책, 재고 자동 계산 트리거가 모두 포함됨)

원한다면 `supabase/seed.sql`도 이어서 실행해 샘플 품목을 등록할 수 있다.

### 3) (운영 환경 필수) 이메일 발송용 커스텀 SMTP 설정

Supabase 기본 내장 이메일 발송은 시간당 몇 통 수준으로 매우 낮게 제한되어 있어,
"사용자 초대"·"비밀번호 재설정" 기능을 실제로 쓰려면 **Supabase 대시보드 →
Authentication → Emails → SMTP Settings** 에서 자체 SMTP(예: Resend, SendGrid 등)를
연결해야 한다. 설정하지 않으면 초대 시 "이메일 발송 한도를 초과했습니다" 오류가 발생할 수 있다.

### 4) 최초 관리자 계정 생성

이 앱은 **관리자가 사용자를 초대하는 구조**라서, 맨 처음 관리자 계정은 수동으로 만들어야 한다.

1. Supabase 대시보드 → **Authentication → Users → Add user** 로 이메일/비밀번호를 직접 생성한다.
   (또는 "Send invite" 사용)
2. **Table Editor → profiles** 테이블에서 방금 생성된 사용자의 `role`을 `admin`으로 수정한다.
3. 이후부터는 앱의 "사용자 관리" 화면에서 관리자가 나머지 사용자를 초대하면,
   가입 시 `role`이 초대한 값으로 자동 설정된다.

### 5) 개발 서버 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → 로그인 화면으로 리다이렉트.

## 2. 폴더 구조

```
app/
  (auth)/login, (auth)/reset-password    # 인증 화면 (사이드바 없음)
  (dashboard)/dashboard, stock, daily-entry,
              items, history, users       # 메인 화면 (공통 사이드바 레이아웃)
  api/export/stock, api/export/history    # CSV 내보내기 Route Handler
  auth/confirm                            # 이메일 링크(초대/재설정) 콜백
lib/
  supabase/client.ts   # 브라우저 클라이언트 (anon key)
  supabase/server.ts   # 서버 클라이언트 (Server Component/Action, 세션 쿠키 기반)
  supabase/admin.ts    # service role 클라이언트 (사용자 초대 등 admin 전용, server-only)
  auth/get-profile.ts  # 로그인/역할 가드 헬퍼
  data/*.ts            # 서버 전용 데이터 조회 함수
  actions/*.ts         # "use server" Server Actions (mutation)
  utils/*.ts           # 날짜/숫자 포맷, 재고 상태 판정 등
  types/database.ts    # Supabase 테이블에 대응하는 TypeScript 타입
components/
  layout/Sidebar.tsx
  ui/*.tsx             # Button, Modal, StatCard, StatusBadge, PageHeader 등 공용 컴포넌트
supabase/
  migrations/0001_init.sql   # 스키마 + RLS + 트리거 (SQL Editor에서 1회 실행)
  seed.sql                   # 샘플 품목 (선택)
proxy.ts               # 세션 갱신 + 로그인 가드 (Next.js 16의 middleware.ts 후속 규약)
```

## 3. 아키텍처 핵심 결정

- **RBAC**: `profiles.role` ∈ `admin | writer | viewer`.
  - admin: 전체 관리 (품목/사용자 CRUD 포함)
  - writer(입력자): 일일 입력 작성/수정 가능, 품목·사용자 관리 불가
  - viewer(조회자): 조회 및 내보내기만 가능
  - 페이지 단위 가드(`requireRole`)와 Postgres RLS 정책 이중으로 적용된다.
- **재고 자동 계산**: `daily_stock_entries` insert/update/delete 시 Postgres 트리거가
  `전일재고 + 생산수량 - 출고수량` 체인을 해당 품목의 이후 날짜 전체에 대해
  윈도우 함수로 재계산한다. 과거 날짜를 수정해도 이후 재고가 자동으로 다시 계산된다.
- **월별 마감(전월재고 이월)**: 별도 배치/스케줄러 없이, 위 트리거가 매 저장 시점에
  `monthly_summaries`를 실시간으로 갱신한다.
- **재고 부족/임박 판정**: 품목마다 `min_stock_qty`(부족 기준), `warning_stock_qty`(임박 기준)
  두 값을 관리자가 설정한다. `품목 관리` 등록/수정 폼에서 입력.
- **동시 입력 정합성**: 재계산 함수가 해당 품목 행을 `FOR UPDATE`로 잠가 동시 수정 시
  경쟁 조건을 방지하고, `stock_qty >= 0` DB 제약으로 음수 재고를 원천 차단한다.

## 4. 알려진 단순화 사항 (MVP 범위)

- "엑셀 다운로드"는 Excel에서 바로 열리는 UTF-8 CSV로 구현했다 (별도 .xlsx 라이브러리 없이 MVP 범위 유지).
- 일일 입력 화면의 "임시저장/저장" 버튼은 데이터 모델에 별도 초안(draft) 상태가 없어 하나의 "저장" 버튼으로 통합했다.
- "최근 입력 내역"은 별도 감사 로그 테이블 없이 `daily_stock_entries`의 `updated_at`/`updated_by`를 기반으로 표시한다.

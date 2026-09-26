-- ============================================================================
-- 타임존 버그 수정: current_item_stock 뷰가 Postgres 세션 기본 타임존(UTC)의
-- current_date를 사용하고 있어, 한국 시간 00~09시 사이에는 "오늘"이 하루
-- 전 날짜로 계산되는 문제가 있었다. Asia/Seoul 기준으로 명시적으로 고정한다.
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================================

create or replace view public.current_item_stock
with (security_invoker = true)
as
select distinct on (item_id)
  item_id, entry_date, stock_qty, stock_amount_g
from public.daily_stock_entries
where entry_date <= (now() at time zone 'Asia/Seoul')::date
order by item_id, entry_date desc;

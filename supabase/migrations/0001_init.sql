-- ============================================================================
-- 재고 관리 웹 애플리케이션 — 초기 스키마 + RLS
-- Supabase SQL Editor에서 전체 내용을 한 번에 실행하세요.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles (Supabase Auth 사용자와 1:1 연결)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'writer', 'viewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is '역할: admin(관리자)/writer(입력자)/viewer(조회자)';

-- RLS 정책에서 재귀 없이 현재 사용자 역할을 조회하기 위한 SECURITY DEFINER 헬퍼
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

-- 신규 가입(관리자 초대) 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer'),
    'active'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. items (품목 마스터)
-- ----------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('생산품', '소스류')),
  spec_weight_g numeric(12, 3) not null check (spec_weight_g > 0),
  is_active boolean not null default true,
  min_stock_qty integer not null default 0 check (min_stock_qty >= 0),
  warning_stock_qty integer not null default 0 check (warning_stock_qty >= min_stock_qty),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

comment on column public.items.min_stock_qty is '재고 부족 판정 기준 수량 (이 값 이하면 "부족")';
comment on column public.items.warning_stock_qty is '재고 임박 판정 기준 수량 (이 값 이하면 "임박", min_stock_qty 이상이어야 함)';

create index idx_items_category on public.items (category, is_active);

-- ----------------------------------------------------------------------------
-- 3. daily_stock_entries (일일 생산/출고 기록 + 자동 계산된 재고)
-- ----------------------------------------------------------------------------
create table public.daily_stock_entries (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  entry_date date not null,
  produced_qty integer not null default 0 check (produced_qty >= 0),
  shipped_qty integer not null default 0 check (shipped_qty >= 0),
  spec_weight_g numeric(12, 3) not null,
  prev_stock_qty integer not null default 0,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  produced_amount_g numeric(14, 3) generated always as (produced_qty * spec_weight_g) stored,
  shipped_amount_g numeric(14, 3) generated always as (shipped_qty * spec_weight_g) stored,
  stock_amount_g numeric(14, 3) generated always as (stock_qty * spec_weight_g) stored,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, entry_date)
);

comment on column public.daily_stock_entries.stock_qty is '전일재고수량 + 생산수량 - 출고수량 (트리거로 자동 계산, 직접 수정 불가)';

create index idx_daily_stock_entries_date on public.daily_stock_entries (entry_date);
create index idx_daily_stock_entries_item_date on public.daily_stock_entries (item_id, entry_date);

-- 품목별 "현재 시점" 재고 (가장 최근 입력일 기준) 를 조회하기 위한 뷰.
-- security_invoker: 조회자의 RLS 권한으로 평가되도록 강제한다.
create view public.current_item_stock
with (security_invoker = true)
as
select distinct on (item_id)
  item_id, entry_date, stock_qty, stock_amount_g
from public.daily_stock_entries
where entry_date <= (now() at time zone 'Asia/Seoul')::date
order by item_id, entry_date desc;

grant select on public.current_item_stock to authenticated;

-- 등록 시 품목의 현재 규격(g)을 스냅샷으로 저장 (이후 품목 규격이 바뀌어도 과거 이력은 보존)
create or replace function public.trg_snapshot_spec_weight()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select spec_weight_g into new.spec_weight_g
  from public.items where id = new.item_id;
  return new;
end;
$$;

create trigger before_insert_daily_stock_entries_snapshot
  before insert on public.daily_stock_entries
  for each row execute function public.trg_snapshot_spec_weight();

-- ----------------------------------------------------------------------------
-- 4. monthly_summaries (월별 재고 요약 — 전월재고 자동 이월)
-- ----------------------------------------------------------------------------
create table public.monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  year_month char(7) not null, -- 'YYYY-MM'
  prev_month_stock_qty integer not null default 0,
  month_end_stock_qty integer not null default 0,
  month_end_stock_amount_g numeric(14, 3) not null default 0,
  updated_at timestamptz not null default now(),
  unique (item_id, year_month)
);

create index idx_monthly_summaries_item_month on public.monthly_summaries (item_id, year_month);

-- ----------------------------------------------------------------------------
-- 5. 실시간 재고 재계산 (전일재고 체인 + 월별 마감 자동 이월)
-- ----------------------------------------------------------------------------

-- 특정 품목의 월별 요약을 from_month부터 데이터가 있는 마지막 달까지 재계산
create or replace function public.recalc_item_monthly_summaries(p_item_id uuid, p_from_month date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', p_from_month)::date;
  v_max_month date;
  v_month_end_qty integer;
  v_month_end_amount numeric;
  v_prev_qty integer;
  v_prev_amount numeric;
begin
  select date_trunc('month', max(entry_date))::date into v_max_month
  from public.daily_stock_entries where item_id = p_item_id;

  if v_max_month is null then
    return;
  end if;

  if v_month > v_max_month then
    v_month := v_max_month;
  end if;

  while v_month <= v_max_month loop
    select stock_qty, stock_amount_g into v_month_end_qty, v_month_end_amount
    from public.daily_stock_entries
    where item_id = p_item_id
      and entry_date >= v_month
      and entry_date < (v_month + interval '1 month')
    order by entry_date desc
    limit 1;

    select month_end_stock_qty, month_end_stock_amount_g into v_prev_qty, v_prev_amount
    from public.monthly_summaries
    where item_id = p_item_id
      and year_month = to_char(v_month - interval '1 month', 'YYYY-MM');

    v_prev_qty := coalesce(v_prev_qty, 0);
    v_prev_amount := coalesce(v_prev_amount, 0);

    if v_month_end_qty is null then
      -- 해당 월에 입력 이력이 없으면 전월 말 재고를 그대로 이월
      v_month_end_qty := v_prev_qty;
      v_month_end_amount := v_prev_amount;
    end if;

    insert into public.monthly_summaries (item_id, year_month, prev_month_stock_qty, month_end_stock_qty, month_end_stock_amount_g)
    values (p_item_id, to_char(v_month, 'YYYY-MM'), v_prev_qty, v_month_end_qty, v_month_end_amount)
    on conflict (item_id, year_month) do update
      set prev_month_stock_qty = excluded.prev_month_stock_qty,
          month_end_stock_qty = excluded.month_end_stock_qty,
          month_end_stock_amount_g = excluded.month_end_stock_amount_g,
          updated_at = now();

    v_month := (v_month + interval '1 month')::date;
  end loop;
end;
$$;

-- 특정 품목의 daily_stock_entries를 from_date부터 끝까지 "전일재고 + 생산 - 출고" 체인으로 재계산
create or replace function public.recalc_item_stock_from(p_item_id uuid, p_from_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seed integer;
begin
  -- 동시 편집 시 동일 품목에 대한 재계산이 직렬화되도록 행 잠금
  perform 1 from public.items where id = p_item_id for update;

  select stock_qty into v_seed
  from public.daily_stock_entries
  where item_id = p_item_id and entry_date < p_from_date
  order by entry_date desc
  limit 1;

  v_seed := coalesce(v_seed, 0);

  with running as (
    select id, entry_date,
      v_seed + sum(produced_qty - shipped_qty) over (order by entry_date rows between unbounded preceding and current row) as new_stock
    from public.daily_stock_entries
    where item_id = p_item_id and entry_date >= p_from_date
  ),
  calc as (
    select id,
      new_stock,
      lag(new_stock, 1, v_seed) over (order by entry_date) as new_prev
    from running
  )
  update public.daily_stock_entries d
  set stock_qty = c.new_stock,
      prev_stock_qty = c.new_prev,
      updated_at = now()
  from calc c
  where d.id = c.id
    and (d.stock_qty is distinct from c.new_stock or d.prev_stock_qty is distinct from c.new_prev);

  perform public.recalc_item_monthly_summaries(p_item_id, date_trunc('month', p_from_date)::date);
end;
$$;

-- daily_stock_entries 변경 시 재계산 트리거 (재귀 방지: pg_trigger_depth 가드)
create or replace function public.trg_recalc_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    perform public.recalc_item_stock_from(old.item_id, old.entry_date);
    return old;
  else
    perform public.recalc_item_stock_from(new.item_id, new.entry_date);
    return new;
  end if;
end;
$$;

create trigger after_change_daily_stock_entries_recalc
  after insert or update of produced_qty, shipped_qty or delete on public.daily_stock_entries
  for each row execute function public.trg_recalc_stock();

-- 일일 입력 화면에서 사용하는 upsert 헬퍼.
-- created_by는 최초 등록자로 보존하고, 수정 시 updated_by/updated_at만 갱신한다.
-- SECURITY INVOKER(기본값)이므로 daily_stock_entries의 RLS(관리자+입력자)가 그대로 적용된다.
create or replace function public.upsert_daily_stock_entry(
  p_item_id uuid,
  p_entry_date date,
  p_produced_qty integer,
  p_shipped_qty integer,
  p_actor uuid
)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.daily_stock_entries (item_id, entry_date, produced_qty, shipped_qty, created_by, updated_by)
  values (p_item_id, p_entry_date, p_produced_qty, p_shipped_qty, p_actor, p_actor)
  on conflict (item_id, entry_date) do update
    set produced_qty = excluded.produced_qty,
        shipped_qty = excluded.shipped_qty,
        updated_by = excluded.updated_by,
        updated_at = now();
end;
$$;

grant execute on function public.upsert_daily_stock_entry(uuid, date, integer, integer, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.daily_stock_entries enable row level security;
alter table public.monthly_summaries enable row level security;

-- profiles: 본인 or 관리자만 조회, 수정은 관리자만 (역할 상승 방지)
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "profiles_update_admin" on public.profiles
  for update using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- items: 로그인 사용자 전체 조회, 등록/수정/삭제는 관리자만
create policy "items_select" on public.items
  for select using (auth.uid() is not null);

create policy "items_insert_admin" on public.items
  for insert with check (public.current_user_role() = 'admin');

create policy "items_update_admin" on public.items
  for update using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "items_delete_admin" on public.items
  for delete using (public.current_user_role() = 'admin');

-- daily_stock_entries: 로그인 사용자 전체 조회, 입력/수정은 관리자+입력자, 삭제는 관리자만
create policy "daily_stock_entries_select" on public.daily_stock_entries
  for select using (auth.uid() is not null);

create policy "daily_stock_entries_insert_writer" on public.daily_stock_entries
  for insert with check (public.current_user_role() in ('admin', 'writer'));

create policy "daily_stock_entries_update_writer" on public.daily_stock_entries
  for update using (public.current_user_role() in ('admin', 'writer'))
  with check (public.current_user_role() in ('admin', 'writer'));

create policy "daily_stock_entries_delete_admin" on public.daily_stock_entries
  for delete using (public.current_user_role() = 'admin');

-- monthly_summaries: 로그인 사용자 조회만 가능 (쓰기는 트리거의 SECURITY DEFINER 함수만 수행)
create policy "monthly_summaries_select" on public.monthly_summaries
  for select using (auth.uid() is not null);

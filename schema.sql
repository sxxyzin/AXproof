-- AX Proof · Supabase 스키마
-- Supabase → SQL Editor 에 붙여넣고 Run
-- 서버(api/)만 service_role 키로 접근합니다. 브라우저용 anon 키에는 아무 권한도 주지 않습니다.

create table if not exists public.axp_records (
  id          text primary key,              -- '{컬렉션}:{레코드 id}'
  col         text not null,                 -- users, projects, logs ...
  owner       text,                          -- 레코드 소유자(userId), 조회 최적화용
  data        jsonb not null,
  created_at  timestamptz not null default now(),   -- 서버 시각
  updated_at  timestamptz not null default now()
);

create index if not exists axp_records_col_idx   on public.axp_records (col);
create index if not exists axp_records_owner_idx on public.axp_records (col, owner);

-- RLS 켜고 정책을 만들지 않음 → anon/authenticated 키로는 읽기·쓰기 불가 (service_role 만 가능)
alter table public.axp_records enable row level security;

-- 최초 생성 시각은 바꿀 수 없게
create or replace function public.axp_keep_created() returns trigger
language plpgsql as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists axp_keep_created on public.axp_records;
create trigger axp_keep_created before update on public.axp_records
  for each row execute function public.axp_keep_created();

-- 사용자별 하루 AI 호출 한도. 서버리스 동시 요청에도 원자적으로 증가합니다.
create or replace function public.axp_take_quota(p_key text, p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare accepted text;
begin
  insert into public.axp_records(id, col, data)
    values ('quotas:' || p_key, 'quotas', jsonb_build_object('id', p_key, 'count', 1))
  on conflict (id) do update
    set data = jsonb_set(axp_records.data, '{count}', to_jsonb((axp_records.data->>'count')::integer + 1))
    where (axp_records.data->>'count')::integer < p_limit
  returning id into accepted;
  return accepted is not null;
end $$;
revoke all on function public.axp_take_quota(text, integer) from public, anon, authenticated;
grant execute on function public.axp_take_quota(text, integer) to service_role;

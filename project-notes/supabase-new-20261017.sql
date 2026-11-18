-- NEW SQL (2026-10-17): বিজয়ী ঘোষণা + কাস্টম লটারি লিস্ট + ওয়েবসাইটে অন/অফ
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-community.sql (mc2_is_admin())।

create table if not exists mc2_draws (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  draw_date date not null default current_date,
  kind text not null default 'week' check (kind in ('week','month','custom')),
  title text not null,
  descr text,
  source text,
  winners jsonb not null default '[]'::jsonb,
  show boolean not null default true
);
create table if not exists mc2_dlists (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  items jsonb not null default '[]'::jsonb
);
create table if not exists mc2_draw_cfg (k text primary key, v text);
insert into mc2_draw_cfg (k, v) values ('show', '1') on conflict (k) do nothing;
alter table mc2_draws enable row level security;
alter table mc2_dlists enable row level security;
alter table mc2_draw_cfg enable row level security;   -- সরাসরি পড়া/লেখা বন্ধ; সব নিচের ফাংশন দিয়ে

-- বিজয়ীর তালিকা থেকে শুধু নিরাপদ ফিল্ড রাখে
create or replace function mc2_draw_clean(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', left(trim(w ->> 'name'), 80),
    'dept', left(coalesce(w ->> 'dept', ''), 80),
    'batch', left(coalesce(w ->> 'batch', ''), 40),
    'rank', case when (w ->> 'rank') ~ '^\d{1,6}$' then (w ->> 'rank')::int end,
    'score', case when (w ->> 'score') ~ '^\d{1,6}$' then (w ->> 'score')::int end,
    'note', left(coalesce(w ->> 'note', ''), 200))), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) w
  where length(trim(coalesce(w ->> 'name', ''))) > 0
$$;

-- পাবলিক: সাইটের বিজয়ী পেজ (অফ থাকলে on=false, কিছুই দেয় না)
create or replace function mc2_draws_public(p_limit int default 30, p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare on_ boolean; r jsonb;
begin
  select coalesce((select v from mc2_draw_cfg where k = 'show'), '1') = '1' into on_;
  if not on_ then return jsonb_build_object('on', false, 'rows', '[]'::jsonb); end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into r from (
    select id, draw_date, kind, title, descr, winners from mc2_draws where show
    order by draw_date desc, id desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x;
  return jsonb_build_object('on', true, 'rows', r);
end $$;

-- অ্যাডমিন
create or replace function mc2_draw_admin_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb; on_ boolean;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select coalesce((select v from mc2_draw_cfg where k = 'show'), '1') = '1' into on_;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into r from (select * from mc2_draws order by draw_date desc, id desc limit 500) x;
  return jsonb_build_object('on', on_, 'rows', r);
end $$;

create or replace function mc2_draw_save(p jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; t text; k text; w jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  t := left(trim(coalesce(p ->> 'title', '')), 120);
  if length(t) < 2 then raise exception 'title needed'; end if;
  k := case when p ->> 'kind' in ('week', 'month', 'custom') then p ->> 'kind' else 'week' end;
  w := mc2_draw_clean(p -> 'winners');
  if jsonb_array_length(w) > 300 then raise exception 'too many'; end if;
  if (p ->> 'id') ~ '^\d+$' and exists (select 1 from mc2_draws where id = (p ->> 'id')::bigint) then
    update mc2_draws set title = t, kind = k, draw_date = coalesce(nullif(p ->> 'date', '')::date, draw_date),
      descr = nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''), source = left(coalesce(p ->> 'source', ''), 120),
      winners = w, show = coalesce((p ->> 'show')::boolean, true) where id = (p ->> 'id')::bigint returning id into v;
  else
    insert into mc2_draws (title, kind, draw_date, descr, source, winners, show)
    values (t, k, coalesce(nullif(p ->> 'date', '')::date, current_date), nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''),
      left(coalesce(p ->> 'source', ''), 120), w, coalesce((p ->> 'show')::boolean, true)) returning id into v;
  end if;
  return v;
end $$;

create or replace function mc2_draw_show(p_id bigint, p_show boolean) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if; update mc2_draws set show = p_show where id = p_id; end $$;
create or replace function mc2_draw_del(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if; delete from mc2_draws where id = p_id; end $$;
create or replace function mc2_draw_cfg_set(p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if;
  insert into mc2_draw_cfg (k, v) values ('show', case when p_on then '1' else '0' end) on conflict (k) do update set v = excluded.v; end $$;

-- কাস্টম লটারি লিস্ট (নামের তালিকা)
create or replace function mc2_dlist_all() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(x) from (select id, name, items, created_at from mc2_dlists order by id desc limit 200) x), '[]'::jsonb); end $$;
create or replace function mc2_dlist_save(p_id bigint, p_name text, p_items jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; it jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name, ''))) < 1 then raise exception 'name needed'; end if;
  select coalesce(jsonb_agg(to_jsonb(left(trim(e), 80))), '[]'::jsonb) into it
    from jsonb_array_elements_text(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e where length(trim(e)) > 0;
  if jsonb_array_length(it) > 3000 then raise exception 'too many'; end if;
  if p_id is not null and exists (select 1 from mc2_dlists where id = p_id) then
    update mc2_dlists set name = left(trim(p_name), 80), items = it where id = p_id returning id into v;
  else insert into mc2_dlists (name, items) values (left(trim(p_name), 80), it) returning id into v; end if;
  return v;
end $$;
create or replace function mc2_dlist_del(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if; delete from mc2_dlists where id = p_id; end $$;

revoke all on function mc2_draw_clean(jsonb), mc2_draws_public(int, int), mc2_draw_admin_list(), mc2_draw_save(jsonb), mc2_draw_show(bigint, boolean), mc2_draw_del(bigint), mc2_draw_cfg_set(boolean), mc2_dlist_all(), mc2_dlist_save(bigint, text, jsonb), mc2_dlist_del(bigint) from public, anon;
grant execute on function mc2_draws_public(int, int) to anon, authenticated;
grant execute on function mc2_draw_admin_list(), mc2_draw_save(jsonb), mc2_draw_show(bigint, boolean), mc2_draw_del(bigint), mc2_draw_cfg_set(boolean), mc2_dlist_all(), mc2_dlist_save(bigint, text, jsonb), mc2_dlist_del(bigint) to authenticated;

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; missing ফাঁকা এলে সব ঠিক):
-- select n as missing from unnest(array['mc2_draws_public','mc2_draw_admin_list','mc2_draw_save','mc2_draw_show','mc2_draw_del','mc2_draw_cfg_set','mc2_dlist_all','mc2_dlist_save','mc2_dlist_del']) n where not exists (select 1 from pg_proc where proname = n);

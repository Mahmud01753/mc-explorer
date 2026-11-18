-- NEW SQL (2026-10-18): লটারি ফোল্ডার (হোমে অন/অফ, ফেসবুক ফোল্ডার, বিজয়ীর চাবি) + ভেরিফাই/বাদ ফ্ল্যাগ + ফেসবুক নাম/লিস্ট/বিজয়ী আনলিমিটেড (১ লাখ পর্যন্ত)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-new-20261017.sql (mc2_draws, mc2_is_admin())।

alter table mc2_draws add column if not exists home boolean not null default false;      -- হোমে দেখাবে কি না (ডিফল্ট অফ)
alter table mc2_draws add column if not exists fb boolean not null default false;        -- ফেসবুক ফোল্ডার
alter table mc2_draws add column if not exists fbnames jsonb not null default '[]'::jsonb; -- ফেসবুক ফোল্ডারের নাম (শুধু অ্যাডমিন)
alter table mc2_draws add column if not exists wkeys jsonb not null default '[]'::jsonb;   -- বিজয়ীর চাবি (শুধু অ্যাডমিন; একবার জিতলে আর ওঠে না)
alter table mc2_draws add column if not exists srcs jsonb not null default '[]'::jsonb;    -- কোন কোন লিস্ট থেকে এসেছে

create table if not exists mc2_entry_flags (
  k text primary key,
  st text not null check (st in ('ok', 'no', 'ex')),   -- ok = ভেরিফাইড, no = নট ভেরিফাইড, ex = লটারি থেকে বাদ
  at timestamptz not null default now()
);
alter table mc2_entry_flags enable row level security;   -- সরাসরি পড়া/লেখা বন্ধ; শুধু নিচের ফাংশন

create or replace function mc2_txt_arr(p jsonb, p_max int) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(to_jsonb(left(trim(e), 90))), '[]'::jsonb)
  from (select e from jsonb_array_elements_text(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) e
        where length(trim(e)) > 0 limit p_max) q
$$;

-- সেভ (আগের ফাংশন বদলে নতুন ফিল্ডসহ)
create or replace function mc2_draw_save(p jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; t text; k text; w jsonb; fn jsonb; wk jsonb; sr jsonb; hm boolean; fbb boolean;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  t := left(trim(coalesce(p ->> 'title', '')), 120);
  if length(t) < 2 then raise exception 'title needed'; end if;
  k := case when p ->> 'kind' in ('week', 'month', 'custom') then p ->> 'kind' else 'week' end;
  w := mc2_draw_clean(p -> 'winners');
  if jsonb_array_length(w) > 100000 then raise exception 'too many'; end if;
  fn := mc2_draw_clean(p -> 'fbnames');
  if jsonb_array_length(fn) > 100000 then raise exception 'too many'; end if;
  wk := mc2_txt_arr(p -> 'wkeys', 200000);
  sr := mc2_txt_arr(p -> 'srcs', 500);
  hm := coalesce((p ->> 'home')::boolean, false);
  fbb := coalesce((p ->> 'fb')::boolean, false);
  if (p ->> 'id') ~ '^\d+$' and exists (select 1 from mc2_draws where id = (p ->> 'id')::bigint) then
    update mc2_draws set title = t, kind = k, draw_date = coalesce(nullif(p ->> 'date', '')::date, draw_date),
      descr = nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''), source = left(coalesce(p ->> 'source', ''), 120),
      winners = w, show = coalesce((p ->> 'show')::boolean, true), home = hm, fb = fbb, fbnames = fn, wkeys = wk, srcs = sr
    where id = (p ->> 'id')::bigint returning id into v;
  else
    insert into mc2_draws (title, kind, draw_date, descr, source, winners, show, home, fb, fbnames, wkeys, srcs)
    values (t, k, coalesce(nullif(p ->> 'date', '')::date, current_date), nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''),
      left(coalesce(p ->> 'source', ''), 120), w, coalesce((p ->> 'show')::boolean, true), hm, fbb, fn, wk, sr) returning id into v;
  end if;
  return v;
end $$;

-- হোমে দেখানোর সুইচ (প্রতিটি ফোল্ডারের আলাদা)
create or replace function mc2_draw_home_set(p_id bigint, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if; update mc2_draws set home = coalesce(p_on, false) where id = p_id; end $$;

-- পাবলিক: হোমে যেসব ফোল্ডার অন (মাস্টার সুইচ অফ থাকলে কিছুই দেয় না); শুধু নিরাপদ ফিল্ড, কোনো চাবি/ফেসবুক-নাম নয়
create or replace function mc2_draws_home() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare on_ boolean; r jsonb;
begin
  select coalesce((select v from mc2_draw_cfg where k = 'show'), '1') = '1' into on_;
  if not on_ then return jsonb_build_object('on', false, 'rows', '[]'::jsonb); end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into r from (
    select id, draw_date, kind, title, descr, winners from mc2_draws
    where home and jsonb_array_length(winners) > 0 order by draw_date desc, id desc limit 12) x;
  return jsonb_build_object('on', true, 'rows', r);
end $$;

-- ভেরিফাই / বাদ ফ্ল্যাগ
create or replace function mc2_dlist_save(p_id bigint, p_name text, p_items jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; it jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name, ''))) < 1 then raise exception 'name needed'; end if;
  select coalesce(jsonb_agg(to_jsonb(left(trim(e), 90))), '[]'::jsonb) into it
    from jsonb_array_elements_text(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e where length(trim(e)) > 0;
  if jsonb_array_length(it) > 100000 then raise exception 'too many'; end if;
  if p_id is not null and exists (select 1 from mc2_dlists where id = p_id) then
    update mc2_dlists set name = left(trim(p_name), 80), items = it where id = p_id returning id into v;
  else insert into mc2_dlists (name, items) values (left(trim(p_name), 80), it) returning id into v; end if;
  return v;
end $$;

create or replace function mc2_flag_all() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_object_agg(k, st) from mc2_entry_flags), '{}'::jsonb); end $$;
create or replace function mc2_flag_set(p_k text, p_st text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_k, '')) < 3 or length(p_k) > 120 then raise exception 'bad key'; end if;
  if p_st is null or p_st = '' then delete from mc2_entry_flags where k = p_k; return; end if;
  if p_st not in ('ok', 'no', 'ex') then raise exception 'bad status'; end if;
  insert into mc2_entry_flags (k, st) values (p_k, p_st) on conflict (k) do update set st = excluded.st, at = now();
end $$;

revoke all on function mc2_txt_arr(jsonb, int), mc2_draw_save(jsonb), mc2_draw_home_set(bigint, boolean), mc2_draws_home(), mc2_flag_all(), mc2_flag_set(text, text) from public, anon;
grant execute on function mc2_draws_home() to anon, authenticated;
grant execute on function mc2_draw_save(jsonb), mc2_draw_home_set(bigint, boolean), mc2_flag_all(), mc2_flag_set(text, text) to authenticated;

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; missing ফাঁকা এলে সব ঠিক):
-- select n as missing from unnest(array['mc2_draw_save','mc2_draw_home_set','mc2_draws_home','mc2_flag_all','mc2_flag_set','mc2_txt_arr']) n where not exists (select 1 from pg_proc where proname = n);

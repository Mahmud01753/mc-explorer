-- MC Explorer pending SQL, অংশ 5/5। সব অংশ ক্রমে একটার পর একটা চালান। আবার চালালেও ক্ষতি নেই।
create or replace function mc2_ac_live(p_session int, p_voter text, p_nick text, p_typing boolean default false, p_after bigint default -1) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v text := coalesce(p_voter, ''); nk text := coalesce(nullif(mc2_ac_clean(p_nick, 30), ''), 'বেনামি'); h record; last bigint; ty jsonb; ev jsonb;
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' then return jsonb_build_object('err', 1); end if;
  if not exists (select 1 from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active) then return jsonb_build_object('err', 2); end if;
  if not mc2_ac_rl('live:v:' || v || ':60', 90, 60) then return jsonb_build_object('err', 3); end if;
  if mc2_ac_block(v) is null then
    with gone as (delete from mc2_ac_here where session_id = p_session and voter <> v and at < now() - interval '75 seconds' returning voter, nick)
      insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
    select * into h from mc2_ac_here where session_id = p_session and voter = v;
    if not found or h.at < now() - interval '75 seconds' then insert into mc2_ac_events(session_id, voter, kind, nick) values (p_session, v, 'join', nk); end if;
    insert into mc2_ac_here(session_id, voter, nick, at, typing_at) values (p_session, v, nk, now(), case when p_typing then now() end)
    on conflict (session_id, voter) do update set nick = excluded.nick, at = now(), typing_at = case when p_typing then now() end;
  end if;
  if p_after is null or p_after < 0 then
    select coalesce(max(id), 0) into last from mc2_ac_events where session_id = p_session; ev := '[]'::jsonb;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'k', e.kind, 'n', e.nick, 't', (extract(epoch from e.created_at) * 1000)::bigint, 'o', e.voter = v) order by e.id), '[]'::jsonb), coalesce(max(e.id), p_after)
      into ev, last from (select * from mc2_ac_events where session_id = p_session and id > p_after order by id limit 30) e;
  end if;
  select coalesce(jsonb_agg(x.nick order by x.typing_at), '[]'::jsonb) into ty
    from (select nick, typing_at from mc2_ac_here where session_id = p_session and voter <> v and typing_at > now() - interval '5 seconds' order by typing_at limit 10) x;
  return jsonb_build_object('last', last, 'ev', ev, 'ty', ty);
end $$;
grant execute on function mc2_ac_live(int, text, text, boolean, bigint) to anon, authenticated;

create or replace function mc2_ac_leave(p_session int, p_voter text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' or not mc2_ac_rl('leave:v:' || p_voter || ':60', 30, 60) then return; end if;
  with gone as (delete from mc2_ac_here where session_id = p_session and voter = p_voter returning voter, nick)
    insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
end $$;
grant execute on function mc2_ac_leave(int, text) to anon, authenticated;

create or replace function mc2_ac_purge_live() returns void language sql security definer set search_path = public as $$
  delete from mc2_ac_events where created_at < now() - interval '1 day';
  delete from mc2_ac_here where at < now() - interval '1 day' $$;
revoke all on function mc2_ac_purge_live() from public, anon, authenticated;
create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); perform mc2_ac_purge_live(); end if; end $$;
grant execute on function mc2_ac_tick() to anon, authenticated;

create index if not exists mc2_scores_dept on mc2_scores (dept);
create index if not exists mc2_scores_batch on mc2_scores (batch);
create index if not exists mc2_scores_score on mc2_scores (score desc);

create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
      and (q is null or s.name ilike '%' || q || '%')
  ), pick as (select * from base where p_mode = 'all' or rn = 1),
  ranked as (select pick.*, rank() over (order by score desc) as rk, count(*) over () as total_n from pick),
  page as (select * from ranked order by rk, created_at, id offset ofs limit lim)
  select jsonb_build_object('total', coalesce((select max(total_n) from page), 0),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'rk', rk, 'name', name, 'dept', dept, 'batch', batch, 'score', score,
        'ok', coalesce(ok, 0), 'wrong', greatest(coalesce(total, 0) - coalesce(ok, 0), 0), 'total', coalesce(total, 0), 'pct', pct,
        'ts', (extract(epoch from created_at) * 1000)::bigint) order by rk, created_at, id) from page), '[]'::jsonb)) into res;
  return res || jsonb_build_object('depts', coalesce((select jsonb_agg(z.d order by z.d) from (select distinct dept as d from mc2_scores) z), '[]'::jsonb),
                                   'batches', coalesce((select jsonb_agg(z.b order by z.b) from (select distinct batch as b from mc2_scores where batch is not null and batch <> '') z), '[]'::jsonb));
end $$;
grant execute on function mc2_board(text, text, timestamptz, timestamptz, text, text, int, int) to anon, authenticated;

create table if not exists mc2_cards (
  id bigint generated always as identity primary key,
  device text not null,
  name text not null, dept text not null, batch text,
  score int not null, pct int not null, ok int, total int,
  rec jsonb not null,
  thumb text not null,
  photo text,
  show boolean not null default true,   -- false = লিডারবোর্ডের টপ ৩-এ ছবি দেখানো হবে না (অ্যাডমিন লুকালে)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists mc2_cards_u on mc2_cards (device, lower(name));
create index if not exists mc2_cards_s on mc2_cards (score desc);
create index if not exists mc2_cards_t on mc2_cards (updated_at desc);
alter table mc2_cards enable row level security;
revoke all on mc2_cards from anon, authenticated;
grant select, update, delete on mc2_cards to authenticated;
drop policy if exists "admin cards" on mc2_cards;
create policy "admin cards" on mc2_cards for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - interval '2 seconds' then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= 20 then return 'slow'; end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  return 'ok';
end $$;
grant execute on function mc2_card_save(text, text, text, text, int, jsonb, text, text) to anon, authenticated;

create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x where x.device = t.device and lower(x.name) = lower(t.name) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;
grant execute on function mc2_top_cards(text, text, timestamptz, timestamptz) to anon, authenticated;

alter table mc2_places add column if not exists orig_name text;

alter table mc2_ac_messages add column if not exists file_expired boolean not null default false;
grant select (file_expired) on mc2_ac_messages to anon;
insert into mc2_ac_cfg(key, value) values ('file_keep_min', '1440') on conflict do nothing;

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440);
        fd int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440);
        n int; paths text[]; fp text[];
begin
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id
    where coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s
    where s.id = m.session_id and coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  get diagnostics n = row_count;
  if fd > 0 then
    select coalesce(array_agg(file_path), '{}') into fp from mc2_ac_messages where file_path is not null and created_at < now() - make_interval(mins => fd);
    update mc2_ac_messages set file_path = null, file_expired = true where file_path is not null and created_at < now() - make_interval(mins => fd);
    paths := paths || fp;
  end if;
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'file_default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.name as dept, s.name, s.keep_min, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

create or replace function mc2_ac_admin_file_keep(p_min int) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  if p_min is null or p_min < 0 or p_min > 525600 then raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন'; end if;
  insert into mc2_ac_cfg(key, value) values ('file_keep_min', to_jsonb(p_min)) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_log(null, 'keep_set', 'ফাইল ডিফল্ট = ' || p_min || ' মিনিট', null, a);
end $$;

create or replace function mc2_ac_seenlist(p_msg bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(z.n order by z.at), '[]'::jsonb) from (
    select case when count(*) over (partition by lower(s.nick)) > 1 then s.nick || ' (' || mc2_uid(s.voter) || ')' else s.nick end as n, s.at
    from mc2_ac_seen s join mc2_ac_messages m on m.session_id = s.session_id
    where m.id = p_msg and s.last_id >= m.id and s.voter <> m.voter) z $$;
grant execute on function mc2_ac_seenlist(bigint) to anon, authenticated;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

-- ================= supabase-ui-settings.sql =================
-- MC Explorer: হোম / নিয়ম-পপআপ / ফল-কার্ডের বাটন অন-অফ সেটিংস (ছোট ফাইল — এটা একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql চালানো থাকতে হবে (mc2_settings টেবিল সেখানে; সাইট ওটা পাবলিকলি পড়তে পারে, শুধু অ্যাডমিন লিখতে পারে)।
-- কী করে: mc2_settings-এ নতুন key 'ui_cfg' (JSON: {"off":["চাবি",...]}) সেভ করার অনুমতি দেয়, আর এই key সেভ করলে
-- কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে তা ঠিক করে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 100 and 5000) then raise exception 'png_max_kb must be 0 or 100..5000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- আগে: যেকোনো সেটিংস সেভে প্রশ্ন নতুন করে বানাত। এখন: 'ui_cfg' বাদে বাকি key-র জন্য আগের মতোই।
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key <> 'ui_cfg') execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('ui_cfg', '{"off":[]}') on conflict (key) do nothing;

-- ================= supabase-new-20261017c.sql =================
-- MC Explorer: কার্ড PNG-এর KB ইচ্ছামতো (১০–১০,০০,০০০ KB; ০ = আনলিমিটেড) + কাস্টম কার্ড সাইজ (চওড়া×উচ্চতা) সেটিংস (ছোট ফাইল — একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql ও supabase-ui-settings.sql চালানো থাকতে হবে (সেগুলো চালানোই আছে)।
-- কী করে: (১) 'png_max_kb'-এর সীমা ১০০–৫০০০ থেকে বাড়িয়ে ১০–১০,০০,০০০ করে (০ = আনলিমিটেড);
--          (২) mc2_settings-এ নতুন key 'card_cfg' ({"on":bool,"w":..,"h":..,"sw":..,"sh":..}) সেভ করার অনুমতি দেয় (১০০–৮০০০ px);
--          (৩) 'card_cfg' সেভ করলে কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg')) execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('card_cfg', '{"on":false,"w":1080,"h":1400,"sw":1080,"sh":1920}') on conflict (key) do nothing;
-- NEW SQL (2026-10-18): লটারি ফোল্ডার (হোমে অন/অফ, ফেসবুক ফোল্ডার, বিজয়ীর চাবি) + ভেরিফাই/বাদ ফ্ল্যাগ
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

-- supabase-new-20261019.sql — জায়গা বাঁচানো ও গতি (২০২৬-১০-১৯)। আবার চালালেও ক্ষতি নেই।
-- ১) mc2_scores / mc2_visits-এ device ইনডেক্স (গতি) + মোছার জন্য সময়-ইনডেক্স
-- ২) আইপি-সীমা উদার: লিডারবোর্ড/টপ৩ ৬০→৬০০ প্রতি মিনিট; কার্ড সেভ ১৫০০/ঘণ্টা, স্কোর জমা ১৫০০/ঘণ্টা, কনটেস্ট এন্ট্রি ৩০০/ঘণ্টা (প্রতি আইপি)। এগুলো ও আগের ডিভাইস-সীমা (স্কোর ৩০/ঘণ্টা, ভিজিট ৪০/ঘণ্টা, কার্ড ২০/ডিভাইস, ২ সেকেন্ড ব্যবধান) এখন ডিফল্ট; সবই অ্যাডমিন '🧹 অটো-ক্লিন' ট্যাব থেকে বদলানো যায়
-- ৩) কার্ডে pinned: যেটা একবার টপ ৩-এ এসেছে সেটা কখনো অটো-মোছা হবে না
-- ৪) অটো-ক্লিনআপ (অ্যাডমিন "🧹 অটো-ক্লিন" ট্যাব থেকে নিয়ন্ত্রণ): ছোট ব্যাচে, আগে অন্য ডেটা, কার্ড: সংখ্যা card_max (ডিফল্ট ১০০০) ছাড়ালে বাড়তি পুরোনোগুলো, দিনের সীমা ছাড়া; স্কোর ও ইউজার ইনফো টেবিল অক্ষত
-- এই ফাইল Free প্ল্যানের ৫০০ MB সীমা ধরে বানানো; কিছুই একসাথে সব মোছে না।

create index if not exists mc2_scores_dev_ct on mc2_scores (device, created_at);
create index if not exists mc2_visits_dev_ct on mc2_visits (device, created_at);
create index if not exists mc2_visits_ct on mc2_visits (created_at);
create index if not exists mc2_answers_ct on mc2_answers (created_at);
create index if not exists mc2_presence_ls on mc2_presence (last_seen);

alter table mc2_cards add column if not exists pinned boolean not null default false;
update mc2_cards c set pinned = true where not c.pinned and (select count(*) from mc2_cards x where x.score > c.score) < 3;

create table if not exists mc2_cleanup_cfg (id int primary key check (id = 1), cfg jsonb not null default '{}'::jsonb);
create table if not exists mc2_cleanup_log (id bigint generated always as identity primary key, ts timestamptz not null default now(), what text not null, n int not null, note text);
alter table mc2_cleanup_cfg enable row level security;
alter table mc2_cleanup_log enable row level security;
revoke all on mc2_cleanup_cfg, mc2_cleanup_log from anon, authenticated;

create or replace function mc2_cleanup_defaults() returns jsonb language sql immutable as $$
  select jsonb_build_object('on', true, 'others_on', true, 'db_mb', 500, 'start_pct', 70, 'card_pct', 80, 'card_max', 1000, 'batch', 200, 'card_batch', 50,
    'min_age_days', 7, 'card_min_days', 0, 'visits_days', 0, 'answers_days', 0, 'presence_days', 0, 'cards_days', 0,
    'ip_view_min', 600, 'ip_card_hr', 1500, 'ip_score_hr', 1500, 'ip_entry_hr', 300, 'score_dev_hr', 30, 'visit_dev_hr', 40, 'card_per_dev', 20, 'card_gap_sec', 2)
$$;

create or replace function mc2_cleanup_cfg_get() returns jsonb language sql stable security definer set search_path = public as $$
  select mc2_cleanup_defaults() || coalesce((select cfg from mc2_cleanup_cfg where id = 1), '{}'::jsonb)
$$;

create or replace function mc2_lim(p_k text) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (cfg ->> p_k)::int from mc2_cleanup_cfg where id = 1), (mc2_cleanup_defaults() ->> p_k)::int)
$$;

create or replace function mc2_cleanup_cards(p_n int, p_days int, p_dry boolean, p_note text) returns int
language plpgsql security definer set search_path = public as $$
declare d int := 0;
begin
  if p_n <= 0 then return 0; end if;
  -- টপ ৩ (এখন বা কখনো) ও pinned কখনো নয়। শুধু কার্ড মোছে: mc2_scores (স্কোর) ও ইউজার ইনফো টেবিল অক্ষত থাকে।
  if p_dry then
    select count(*) into d from (select 1 from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3
      and x.updated_at < now() - make_interval(days => p_days) limit p_n) z;
  else
    delete from mc2_cards where id in (select x.id from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3
      and x.updated_at < now() - make_interval(days => p_days) order by x.updated_at limit p_n);
    get diagnostics d = row_count;
    if d > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_cards', d, p_note); end if;
  end if;
  return d;
end $$;
revoke all on function mc2_cleanup_cards(int, int, boolean, text) from public, anon, authenticated;

create or replace function mc2_cleanup_run(p_dry boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); sz bigint; pct numeric; ncards int; pressure boolean; lim int; minage int;
  t record; dd int; cond text; d int; other int := 0; cd int; cl int; cmax int; ca int; res jsonb := '{}'::jsonb;
begin
  if not coalesce((c ->> 'on')::boolean, true) then return jsonb_build_object('on', false); end if;
  sz := pg_database_size(current_database());
  pct := round(sz * 100.0 / ((c ->> 'db_mb')::numeric * 1048576), 1);
  select count(*) into ncards from mc2_cards;
  pressure := pct >= (c ->> 'start_pct')::numeric and coalesce((c ->> 'others_on')::boolean, true);
  lim := greatest((c ->> 'batch')::int, 1); minage := greatest((c ->> 'min_age_days')::int, 1);
  for t in select * from (values ('mc2_visits', 'created_at', 'visits_days'), ('mc2_answers', 'created_at', 'answers_days'), ('mc2_presence', 'last_seen', 'presence_days')) v(tbl, col, key) loop
    dd := (c ->> t.key)::int;
    cond := format('(%s > 0 and %I < now() - make_interval(days => %s))', dd, t.col, dd);
    if pressure then cond := cond || format(' or %I < now() - make_interval(days => %s)', t.col, minage); end if;
    if p_dry then
      execute format('select count(*) from (select 1 from %I where %s limit %s) z', t.tbl, cond, lim) into d;
    else
      execute format('delete from %I where ctid = any(array(select ctid from %I where %s order by %I limit %s))', t.tbl, t.tbl, cond, t.col, lim);
      get diagnostics d = row_count;
      if d > 0 then insert into mc2_cleanup_log(what, n, note) values (t.tbl, d, case when pressure then 'pressure' else 'age' end); end if;
    end if;
    other := other + d; res := res || jsonb_build_object(t.tbl, d);
  end loop;
  cd := (c ->> 'cards_days')::int; cl := greatest((c ->> 'card_batch')::int, 1); cmax := (c ->> 'card_max')::int; ca := (c ->> 'card_min_days')::int;
  -- কার্ড ১) সময় ধরে (cards_days > 0), ২) সংখ্যা card_max ছাড়ালে বাড়তি পুরোনোগুলো (দিনের সীমা নেই, প্রতিবারে card_batch), ৩) DB card_pct% ভরলে ও অন্য ডেটা শেষ হলে
  d := 0; if cd > 0 then d := mc2_cleanup_cards(cl, cd, p_dry, 'age'); end if;
  res := res || jsonb_build_object('cards_age', d);
  d := 0;
  if ncards > cmax then d := mc2_cleanup_cards(least(cl, ncards - cmax), ca, p_dry, 'count'); end if;
  if d = 0 and pct >= (c ->> 'card_pct')::numeric and other = 0 then d := mc2_cleanup_cards(cl, ca, p_dry, 'pressure'); end if;
  res := res || jsonb_build_object('cards_pressure', d);
  if not p_dry and random() < 0.05 then delete from mc2_cleanup_log where ts < now() - interval '60 days'; end if;
  return res || jsonb_build_object('pct', pct, 'size_mb', round(sz / 1048576.0, 1), 'cards', ncards, 'pressure', pressure, 'dry', p_dry);
end $$;
revoke all on function mc2_cleanup_run(boolean) from public, anon, authenticated;

create or replace function mc2_cleanup_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  if mc2_ac_rl('cleanup', 1, 600) then perform mc2_cleanup_run(false); end if;
exception when others then null;
end $$;
revoke all on function mc2_cleanup_tick() from public, anon, authenticated;

create or replace function mc2_cleanup_admin_get() returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); sz bigint := pg_database_size(current_database());
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object('cfg', c, 'size_mb', round(sz / 1048576.0, 1), 'pct', round(sz * 100.0 / ((c ->> 'db_mb')::numeric * 1048576), 1),
    'cards', (select count(*) from mc2_cards), 'pinned', (select count(*) from mc2_cards where pinned),
    'visits', (select count(*) from mc2_visits), 'answers', (select count(*) from mc2_answers), 'presence', (select count(*) from mc2_presence),
    'log', coalesce((select jsonb_agg(jsonb_build_object('ts', l.ts, 'what', l.what, 'n', l.n, 'note', l.note) order by l.ts desc) from (select * from mc2_cleanup_log order by ts desc limit 20) l), '[]'::jsonb));
end $$;

create or replace function mc2_cleanup_admin_set(p_cfg jsonb) returns void language plpgsql security definer set search_path = public as $$
declare k text; v numeric; lo numeric; hi numeric;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_cfg is null or jsonb_typeof(p_cfg) <> 'object' then raise exception 'bad cfg'; end if;
  for k in select jsonb_object_keys(p_cfg) loop
    if k in ('on', 'others_on') then
      if jsonb_typeof(p_cfg -> k) <> 'boolean' then raise exception '% must be true/false', k; end if;
    else
      if k not in ('db_mb', 'start_pct', 'card_pct', 'card_max', 'batch', 'card_batch', 'min_age_days', 'card_min_days', 'visits_days', 'answers_days', 'presence_days', 'cards_days',
                   'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'card_gap_sec') then raise exception 'unknown key %', k; end if;
      if jsonb_typeof(p_cfg -> k) <> 'number' then raise exception '% must be a number', k; end if;
      v := (p_cfg ->> k)::numeric;
      lo := case when k in ('db_mb', 'batch', 'card_batch', 'min_age_days', 'card_max', 'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev') then 1 when k in ('start_pct', 'card_pct') then 10 else 0 end;
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct') then 99 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k = 'card_max' then 1000000
                 when k in ('ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr') then 1000000 when k in ('score_dev_hr', 'visit_dev_hr') then 100000 when k = 'card_per_dev' then 1000 when k = 'card_gap_sec' then 60 else 3650 end;
      if v < lo or v > hi or v <> trunc(v) then raise exception '% must be a whole number % to %', k, lo, hi; end if;
    end if;
  end loop;
  insert into mc2_cleanup_cfg(id, cfg) values (1, p_cfg) on conflict (id) do update set cfg = excluded.cfg;
end $$;

create or replace function mc2_cleanup_admin_run(p_dry boolean default true) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return mc2_cleanup_run(coalesce(p_dry, true));
end $$;
revoke all on function mc2_cleanup_admin_get(), mc2_cleanup_admin_set(jsonb), mc2_cleanup_admin_run(boolean) from public, anon;
grant execute on function mc2_cleanup_admin_get(), mc2_cleanup_admin_set(jsonb), mc2_cleanup_admin_run(boolean) to authenticated;

-- আইপি-সীমা উদার + কার্ড pinned + অটো-ক্লিনআপ হুক (নিচের ফাংশনগুলো আগের সংস্করণের কপি, শুধু নির্দেশিত লাইন বদলানো)
create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('card:ip:' || mc2_ip(), mc2_lim('ip_card_hr'), 3600) then return 'slow'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - make_interval(secs => mc2_lim('card_gap_sec')) then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= mc2_lim('card_per_dev') then return 'slow'; end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  if (select count(*) from mc2_cards x where x.score > v.score) < 3 then update mc2_cards set pinned = true where device = p_device and lower(name) = lower(v.name); end if;
  if random() < 0.1 then begin perform mc2_cleanup_tick(); exception when others then null; end; end if;
  return 'ok';
end $$;

create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('rows', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':m', mc2_lim('ip_view_min'), 60) then return jsonb_build_object('err', 'slow'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where not coalesce(s.hidden, false) and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x where x.device = t.device and lower(x.name) = lower(t.name) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;

create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('total', 0, 'rows', '[]'::jsonb, 'depts', '[]'::jsonb, 'batches', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':m', mc2_lim('ip_view_min'), 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where not coalesce(s.hidden, false) and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
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

create or replace function mc2_submit_score(p_name text, p_dept text, p_batch text, p_club text, p_title text, p_pct int, p_score int, p_ok int, p_total int, p_device text, p_info jsonb)
returns text language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 30 or char_length(coalesce(p_dept, '')) not between 1 and 60
     or p_pct not between 0 and 100 or p_score not between 0 and 1000 or char_length(coalesce(p_device, '')) not between 8 and 40 then return 'invalid'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('score:ip:' || mc2_ip(), mc2_lim('ip_score_hr'), 3600) then return 'slow'; end if;
  if (select count(*) from mc2_scores where device = p_device and created_at > now() - interval '1 hour') >= mc2_lim('score_dev_hr') then return 'slow'; end if;
  insert into mc2_scores(name, dept, batch, club, title, pct, score, ok, total, device, ip, ua, info)
  values (trim(p_name), p_dept, left(p_batch, 40), left(p_club, 60), left(p_title, 60), p_pct, p_score, p_ok, p_total, p_device, mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
  return 'ok';
end $$;

create or replace function mc2_log_visit(p_device text, p_page text, p_info jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 then return; end if;
  if (select count(*) from mc2_visits where device = p_device and created_at > now() - interval '1 hour') >= mc2_lim('visit_dev_hr') then return; end if;
  insert into mc2_visits(device, page, ip, ua, info) values (p_device, left(p_page, 100), mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
  if random() < 0.02 then perform mc2_cleanup_tick(); end if;
end $$;

create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); perform mc2_ac_purge_live(); end if; perform mc2_cleanup_tick(); end $$;

create or replace function submit_entry(p_name text, p_link text, p_shot text, p_contact text, p_pct int, p_score int, p_device text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then raise exception 'bad name'; end if;
  if p_link is null or length(p_link) > 400 or p_link !~* '^https?://([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)/' then raise exception 'bad link'; end if;
  if p_shot is null or length(p_shot) > 500 then raise exception 'bad shot'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('entry:ip:' || mc2_ip(), mc2_lim('ip_entry_hr'), 3600) then raise exception 'slow'; end if;
  insert into contest_entries (name, fb_link, shot_url, contact, pct, score, device)
  values (trim(p_name), trim(p_link), p_shot, nullif(left(trim(coalesce(p_contact, '')), 300), ''), p_pct, p_score, nullif(left(coalesce(p_device, ''), 80), ''))
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'duplicate';
end $$;

-- নাম-চেক: ৫টা সারিতেই true এলে ঠিক
select 'mc2_cards.pinned' as item, exists (select 1 from information_schema.columns where table_name = 'mc2_cards' and column_name = 'pinned') as ok
union all select 'mc2_lim', exists (select 1 from pg_proc where proname = 'mc2_lim')
union all select 'mc2_cleanup_run', exists (select 1 from pg_proc where proname = 'mc2_cleanup_run')
union all select 'mc2_cleanup_admin_get', exists (select 1 from pg_proc where proname = 'mc2_cleanup_admin_get')
union all select 'mc2_scores_dev_ct', exists (select 1 from pg_indexes where indexname = 'mc2_scores_dev_ct');

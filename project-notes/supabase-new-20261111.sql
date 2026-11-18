-- কার্ডওয়ালা ইউজার সব তালিকায় সবসময় দেখানো:
--   লিডারবোর্ড (পাবলিক + অ্যাডমিন "ফলাফল"), সেরা ৩ কার্ড, অ্যাডমিন লিডারবোর্ড তালিকা, অ্যাডমিন ইউজার/ভিজিটর তালিকা।
-- স্কোর (mc2_scores) বা ভিজিটর রেকর্ড (mc2_presence) না থাকলে কার্ডের rec থেকে নাম ও মার্ক নিয়ে দেখানো হয়।
-- নিয়ম:
--   • কার্ড আছে অথচ ওই ডিভাইসের একই নামে কোনো স্কোর-সারি নেই  →  কার্ডের নাম/মার্ক দিয়ে একটি সারি যোগ হয়।
--   • স্কোর-সারি আছে কিন্তু অ্যাডমিন লুকিয়ে (hide) রেখেছেন → লুকানোই থাকে (হাইড ফিচার অক্ষুণ্ণ)।
--   • কার্ড থেকে আসা সারির id ঋণাত্মক (-কার্ড id); তাই ওই সারিতে এডিট/হাইড/ডিলিট কিছু করবে না (আসল স্কোর-সারি নেই)।
--   • আগের ফাংশনগুলোর সর্বশেষ সংস্করণ থেকে শুধু কার্ড-সারি যোগ করা হয়েছে; বাকি সব আগের মতোই।
-- আগে চালানো থাকতে হবে: supabase-new-20261024.sql (জেন্ডার কলাম), supabase-new-20261108.sql (ইউজার ফিল্টার)।
-- একবার চালালেই হবে; আবার চালালেও ক্ষতি নেই।

-- ===== ১) সহায়ক: প্রতিটি কার্ডের নাম/মার্ক (rec থেকে; না পেলে কার্ডের কলাম) =====
create or replace function mc2_card_rows() returns table(cid bigint, device text, name text, dept text, batch text, score int, ok int, total int, pct int, gender text, cat timestamptz, has_score boolean, has_photo boolean, photo_show boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.device,
    coalesce(nullif(btrim(c.rec ->> 'name'), ''), c.name),
    coalesce(nullif(btrim(c.rec ->> 'dept'), ''), c.dept),
    nullif(coalesce(nullif(btrim(c.rec ->> 'batch'), ''), c.batch, ''), ''),
    case when c.rec ->> 'score' ~ '^[0-9]{1,4}$' then (c.rec ->> 'score')::int else c.score end,
    case when c.rec ->> 'ok' ~ '^[0-9]{1,4}$' then (c.rec ->> 'ok')::int else c.ok end,
    case when c.rec ->> 'total' ~ '^[0-9]{1,4}$' then (c.rec ->> 'total')::int else c.total end,
    case when c.rec ->> 'pct' ~ '^[0-9]{1,3}$' then (c.rec ->> 'pct')::int else c.pct end,
    c.gender, c.updated_at,
    exists (select 1 from mc2_scores s where s.device = c.device and lower(s.name) = lower(c.name)),
    c.photo is not null, c.show
  from mc2_cards c
$$;
revoke all on function mc2_card_rows() from public, anon, authenticated;

-- ===== ২) সহায়ক: ভিজিটর তালিকার জন্য উপস্থিতি + (উপস্থিতি না থাকলে) কার্ডওয়ালা ডিভাইস =====
create or replace function mc2_presence_plus() returns table(voter text, nick text, game_name text, game_dept text, game_batch text, chat_dept text, chat_session text, page text, ip text, country text, region text, city text, ua text, info jsonb, last_seen timestamptz, visits int, offline boolean, gender text, card_best int)
language sql stable security definer set search_path = public as $$
  select p.voter, p.nick, coalesce(p.game_name, k.name), coalesce(p.game_dept, k.dept), coalesce(p.game_batch, k.batch), p.chat_dept, p.chat_session, p.page, p.ip, p.country, p.region, p.city, p.ua, p.info,
    p.last_seen, p.visits, p.offline, coalesce(p.gender, k.gender), k.score
  from mc2_presence p
  left join lateral (select x.name, x.dept, x.batch, x.score, x.gender from mc2_card_rows() x where x.device = p.voter order by x.score desc, x.cid limit 1) k on true
  union all
  select k.device, null::text, k.name, k.dept, k.batch, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::jsonb,
    k.cat, 0, true, k.gender, k.score
  from (select distinct on (x.device) x.* from mc2_card_rows() x order by x.device, x.score desc, x.cid) k
  where not exists (select 1 from mc2_presence p where p.voter = k.device)
$$;
revoke all on function mc2_presence_plus() from public, anon, authenticated;

-- ===== ৩) পাবলিক লিডারবোর্ড (এবং অ্যাডমিনের "ফলাফল" ট্যাব) =====
create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('total', 0, 'rows', '[]'::jsonb, 'depts', '[]'::jsonb, 'batches', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':m', mc2_lim('ip_view_min'), 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with src as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at from mc2_scores s where not coalesce(s.hidden, false)
    union all
    select -k.cid, k.name, k.dept, k.batch, k.score, k.ok, k.total, k.pct, k.cat from mc2_card_rows() k where not k.has_score
  ), base as (
    select src.*, row_number() over (partition by lower(src.name), src.dept, coalesce(src.batch, '') order by src.score desc, src.created_at) as rn
    from src
    where (nullif(p_dept, '') is null or src.dept = p_dept) and (nullif(p_batch, '') is null or src.batch = p_batch)
      and (p_from is null or src.created_at >= p_from) and (p_to is null or src.created_at < p_to)
      and (q is null or src.name ilike '%' || q || '%')
  ), pick as (select * from base where p_mode = 'all' or rn = 1),
  ranked as (select pick.*, rank() over (order by score desc) as rk, count(*) over () as total_n from pick),
  page as (select * from ranked order by rk, created_at, id offset ofs limit lim)
  select jsonb_build_object('total', coalesce((select max(total_n) from page), 0),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'rk', rk, 'name', name, 'dept', dept, 'batch', batch, 'score', score,
        'ok', coalesce(ok, 0), 'wrong', greatest(coalesce(total, 0) - coalesce(ok, 0), 0), 'total', coalesce(total, 0), 'pct', pct,
        'ts', (extract(epoch from created_at) * 1000)::bigint) order by rk, created_at, id) from page), '[]'::jsonb)) into res;
  return res || jsonb_build_object('depts', coalesce((select jsonb_agg(z.d order by z.d) from (select dept as d from mc2_scores union select dept from mc2_card_rows() where not has_score) z), '[]'::jsonb),
                                   'batches', coalesce((select jsonb_agg(z.b order by z.b) from (select batch as b from mc2_scores union select batch from mc2_card_rows() where not has_score) z where z.b is not null and z.b <> ''), '[]'::jsonb));
end $$;

-- ===== ৪) সেরা ৩ (পাবলিক) =====
create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('rows', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':m', mc2_lim('ip_view_min'), 60) then return jsonb_build_object('err', 'slow'); end if;
  with src as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device, null::bigint as cid from mc2_scores s where not coalesce(s.hidden, false)
    union all
    select -k.cid, k.name, k.dept, k.batch, k.score, k.ok, k.total, k.pct, k.cat, k.device, k.cid from mc2_card_rows() k where not k.has_score
  ), base as (
    select src.*, row_number() over (partition by lower(src.name), src.dept, coalesce(src.batch, '') order by src.score desc, src.created_at) as rn
    from src
    where (nullif(p_dept, '') is null or src.dept = p_dept) and (nullif(p_batch, '') is null or src.batch = p_batch)
      and (p_from is null or src.created_at >= p_from) and (p_to is null or src.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x
    where (t.cid is not null and x.id = t.cid) or (t.cid is null and x.device = t.device and lower(x.name) = lower(t.name)) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;

-- ===== ৫) অ্যাডমিন: লিডারবোর্ড এন্ট্রি তালিকা =====
create or replace function mc2_board_admin_list(p_q text default null, p_dept text default null, p_batch text default null, p_state text default 'all', p_limit int default 50, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); lim int := least(greatest(coalesce(p_limit, 50), 1), 200); res jsonb; tot int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with u as (
    select s.id, s.name, s.dept, s.batch, s.score as sc, s.ok, s.total, s.hidden, (extract(epoch from s.created_at) * 1000)::bigint as ts,
      exists (select 1 from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)) as has_card,
      coalesce((select bool_or(c.photo is not null) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), false) as has_photo,
      coalesce((select bool_and(c.show) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), true) as photo_show
    from mc2_scores s
    union all
    select -k.cid, k.name, k.dept, k.batch, k.score, k.ok, k.total, false, (extract(epoch from k.cat) * 1000)::bigint, true, k.has_photo, coalesce(k.photo_show, true)
    from mc2_card_rows() k where not k.has_score
  ), f as (
    select * from u where (q is null or u.name ilike '%' || q || '%') and (nullif(p_dept, '') is null or u.dept = p_dept) and (nullif(p_batch, '') is null or u.batch = p_batch)
      and (p_state = 'all' or (p_state = 'hidden' and u.hidden) or (p_state = 'shown' and not u.hidden))
  )
  select (select count(*) from f), coalesce((select jsonb_agg(r order by r.sc desc, r.id) from (select * from f order by sc desc, id offset greatest(coalesce(p_offset, 0), 0) limit lim) r), '[]'::jsonb) into tot, res;
  return jsonb_build_object('total', tot, 'rows', res);
end $$;

-- ===== ৬) অ্যাডমিন: ইউজার/ভিজিটর তালিকা (পুরোনো ও নতুন ফিল্টারসহ ফাংশন) =====
create or replace function mc2_admin_users(p_q text default '', p_online boolean default false, p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%'; t int; r jsonb;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select count(*) into t from mc2_presence_plus() p where (not p_online or mc2_online(p.last_seen, p.offline))
    and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, p.city, p.region, mc2_uid(p.voter))) like q);
  select coalesce(jsonb_agg(to_jsonb(x) order by x.ls desc), '[]'::jsonb) into r from (
    select p.voter, mc2_uid(p.voter) uid, p.nick, p.game_name gname, p.game_dept gdept, p.game_batch gbatch, p.chat_dept cdept, p.chat_session csess, p.page, p.ip, p.country, p.region, p.city, left(p.ua, 200) ua, p.visits, p.gender, p.info,
      (select substring(e.contact from '(?:\+?88)?01[3-9][0-9]{8}') from contest_entries e where e.device = p.voter and e.contact is not null order by e.id desc limit 1) phone,
      (extract(epoch from p.last_seen) * 1000)::bigint ls, mc2_online(p.last_seen, p.offline) online, coalesce((select max(s.score) from mc2_scores s where s.device = p.voter), p.card_best) best
    from mc2_presence_plus() p where (not p_online or mc2_online(p.last_seen, p.offline))
      and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, p.city, p.region, mc2_uid(p.voter))) like q)
    order by p.last_seen desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x;
  return jsonb_build_object('total', t, 'rows', r);
end $$;

create or replace function mc2_admin_users2(
  p_q text default '', p_status text default 'all', p_gender text default '', p_dept text default '', p_sess text default '', p_country text default '',
  p_dev text default '', p_os text default '', p_br text default '', p_phone text default '', p_score text default '', p_active text default '', p_sort text default 'new', p_from text default '', p_to text default '',
  p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%';
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  return (
    with b as (
      select p.*, mc2_uid(p.voter) uid_, mc2_online(p.last_seen, p.offline) onl, (extract(epoch from p.last_seen) * 1000)::bigint ls_,
        coalesce((select max(s.score) from mc2_scores s where s.device = p.voter), p.card_best) best_,
        (select substring(e.contact from '(?:\+?88)?01[3-9][0-9]{8}') from contest_entries e where e.device = p.voter and e.contact is not null order by e.id desc limit 1) phone_,
        case when coalesce(p.ua, '') = '' then '' when p.ua ~* 'iPad|Tablet' then 'tab' when p.ua ~* 'Mobi|Android|iPhone' then 'mob' else 'pc' end dk_,
        case when p.ua ~ 'Android' then 'and' when p.ua ~ 'iPhone|iPad' then 'ios' when p.ua ~ 'Windows NT' then 'win' when p.ua ~ 'Mac OS X' then 'mac' when p.ua ~ 'Linux' then 'lin' else '' end ok_,
        case when p.ua ~ 'FBAN|FBAV|FB_IAB' then 'fb' when p.ua ~ 'Messenger' then 'msg' when p.ua ~ 'Instagram' then 'ig' when p.ua ~ 'SamsungBrowser/' then 'sam' when p.ua ~ 'EdgA?/' then 'edg'
             when p.ua ~ 'OPR/' then 'opr' when p.ua ~ 'Firefox/' then 'ff' when p.ua ~ 'Chrome/' then 'chr' when p.ua ~ 'Version/[0-9.]+.*Safari' then 'saf' else 'oth' end bk_
      from mc2_presence_plus() p
    ), f as (
      select * from b where
        (q = '%%' or lower(concat_ws(' ', nick, game_name, game_dept, game_batch, chat_dept, chat_session, ip, city, region, uid_)) like q)
        and (p_status not in ('on', 'off') or (p_status = 'on') = onl)
        and (p_gender = '' or (p_gender in ('m', 'f') and gender = p_gender) or (p_gender = 'x' and coalesce(gender, '') not in ('m', 'f')))
        and (p_dept = '' or game_dept = p_dept or chat_dept = p_dept)
        and (p_sess = '' or game_batch = p_sess or chat_session = p_sess)
        and (p_country = '' or country = p_country)
        and (p_dev = '' or dk_ = p_dev) and (p_os = '' or ok_ = p_os) and (p_br = '' or bk_ = p_br)
        and (p_phone = '' or (p_phone = 'yes' and phone_ is not null) or (p_phone = 'no' and phone_ is null))
        and (p_score = '' or (p_score = 'yes' and best_ is not null) or (p_score = 'no' and best_ is null))
        and (p_active = '' or (p_active = 'today' and last_seen >= date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka')
             or (p_active = '7' and last_seen > now() - interval '7 days') or (p_active = '30' and last_seen > now() - interval '30 days')
             or (p_active = 'old' and last_seen <= now() - interval '30 days') or p_active = 'custom')
        and (p_from = '' or last_seen >= (p_from::date)::timestamp at time zone 'Asia/Dhaka')
        and (p_to = '' or last_seen < (p_to::date + 1)::timestamp at time zone 'Asia/Dhaka')
    )
    select jsonb_build_object(
      'total', (select count(*) from f),
      'rows', coalesce((select jsonb_agg(to_jsonb(x) - 'rn' order by x.rn) from (
          select row_number() over (order by case when p_sort = 'score' then best_ end desc nulls last, case when p_sort = 'visits' then visits end desc nulls last,
                   case when p_sort = 'old' then last_seen end asc, last_seen desc) rn,
            voter, uid_ uid, nick, game_name gname, game_dept gdept, game_batch gbatch, chat_dept cdept, chat_session csess, page, ip, country, region, city, left(ua, 200) ua, visits, gender, info,
            phone_ phone, ls_ ls, onl online, best_ best
          from f) x where x.rn > greatest(p_offset, 0) and x.rn <= greatest(p_offset, 0) + least(greatest(p_limit, 1), 100)), '[]'::jsonb),
      'depts', coalesce((select jsonb_agg(v order by v) from (select game_dept v from b union select chat_dept from b) z where v is not null and btrim(v) <> ''), '[]'::jsonb),
      'sessions', coalesce((select jsonb_agg(v order by v) from (select game_batch v from b union select chat_session from b) z where v is not null and btrim(v) <> ''), '[]'::jsonb),
      'countries', coalesce((select jsonb_agg(v order by v) from (select distinct country v from b) z where v ~ '^[A-Z]{2}$' and v not in ('XX', 'T1')), '[]'::jsonb)));
end $$;

revoke all on function mc2_admin_users(text, boolean, int, int) from public, anon; grant execute on function mc2_admin_users(text, boolean, int, int) to authenticated;
revoke all on function mc2_admin_users2(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, int, int) from public, anon;
grant execute on function mc2_admin_users2(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, int, int) to authenticated;
notify pgrst, 'reload schema';

-- চেক: সবগুলো ok = true এলে ঠিক
select 'কার্ডওয়ালা সব তালিকায়' as item,
  to_regprocedure('mc2_card_rows()') is not null and to_regprocedure('mc2_presence_plus()') is not null as ok;

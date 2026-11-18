-- NEW SQL (2026-10-17 b): (১) বিভাগ-ভিত্তিক চ্যাট ও অ্যাটাচমেন্ট মোছার সময়, (২) চ্যাটের সক্রিয় ইউজার তালিকা (ব্যান অবস্থাসহ), (৩) ভিজিটর ট্যাবের অনলাইন তালিকা (দেশ, ফোন মডেল, শেষ সক্রিয়)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। পুরোনো কিছু বদলায় না (শুধু মোছার ফাংশন বিভাগের সময় মানতে শেখে); আবার চালালেও সমস্যা নেই।
-- আগে চালানো থাকতে হবে: moderation, live-board, additions, userinfo (সবই চালানো আছে)।

-- ========== ১) বিভাগ-ভিত্তিক মোছার সময় ==========
-- মিনিটে। খালি (null) = ডিফল্ট অনুযায়ী; 0 = কখনো মুছবে না। চ্যাট: সেশনের সময > বিভাগের সময > ডিফল্ট। অ্যাটাচমেন্ট: বিভাগের সময > ডিফল্ট।
alter table mc2_ac_depts add column if not exists keep_min int check (keep_min is null or keep_min between 0 and 525600);
alter table mc2_ac_depts add column if not exists file_keep_min int check (file_keep_min is null or file_keep_min between 0 and 525600);

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440);
        fd int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440);
        n int; paths text[]; fp text[];
begin
  -- বার্তার মেয়াদ: সেশন > বিভাগ > ডিফল্ট
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id join mc2_ac_depts dp on dp.id = s.dept_id
    where coalesce(s.keep_min, dp.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, dp.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s, mc2_ac_depts dp
    where s.id = m.session_id and dp.id = s.dept_id and coalesce(s.keep_min, dp.keep_min, d) > 0
      and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, dp.keep_min, d));
  get diagnostics n = row_count;
  -- শুধু ফাইলের মেয়াদ (বিভাগ > ডিফল্ট): বার্তা থাকে, ফাইল মুছে "ফাইলের মেয়াদ শেষ" দেখায়
  select coalesce(array_agg(m.file_path), '{}') into fp
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id join mc2_ac_depts dp on dp.id = s.dept_id
    where m.file_path is not null and coalesce(dp.file_keep_min, fd) > 0 and m.created_at < now() - make_interval(mins => coalesce(dp.file_keep_min, fd));
  update mc2_ac_messages m set file_path = null, file_expired = true from mc2_ac_sessions s, mc2_ac_depts dp
    where s.id = m.session_id and dp.id = s.dept_id and m.file_path is not null and coalesce(dp.file_keep_min, fd) > 0
      and m.created_at < now() - make_interval(mins => coalesce(dp.file_keep_min, fd));
  paths := paths || fp;
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

-- অ্যাডমিন পেজের জন্য: আগের সব কিছু + বিভাগের সময় ('depts', প্রতি সেশনে 'dept_id', 'dkeep', 'dfile')
create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'file_default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440),
    'depts', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'keep_min', d.keep_min, 'file_keep_min', d.file_keep_min) order by d.sort, d.name) from mc2_ac_depts d), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.id as dept_id, d.name as dept, s.name, s.keep_min, d.keep_min as dkeep, d.file_keep_min as dfile, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

-- বিভাগের সময় বদল (Save বোতাম): p_chat_min = চ্যাটের সময়, p_file_min = অ্যাটাচমেন্টের সময়; null = ডিফল্ট অনুযায়ী; 0 = কখনো না
create or replace function mc2_ac_admin_dept_keep(p_dept int, p_chat_min int, p_file_min int) returns jsonb language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); nm text;
begin
  if (p_chat_min is not null and (p_chat_min < 0 or p_chat_min > 525600)) or (p_file_min is not null and (p_file_min < 0 or p_file_min > 525600)) then
    raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন';
  end if;
  update mc2_ac_depts set keep_min = p_chat_min, file_keep_min = p_file_min where id = p_dept returning name into nm;
  if nm is null then raise exception 'বিভাগ পাওয়া যায়নি'; end if;
  perform mc2_ac_log(null, 'keep_set', 'বিভাগ ' || nm || ': চ্যাট = ' || coalesce(p_chat_min::text, 'ডিফল্ট') || ', ফাইল = ' || coalesce(p_file_min::text, 'ডিফল্ট') || ' মিনিট', null, a);
  return jsonb_build_object('chat', p_chat_min, 'file', p_file_min);
end $$;

-- ========== ২) চ্যাটের সক্রিয় ইউজার (অ্যাডমিন: সব তথ্য + ব্যান অবস্থা) ==========
-- p_hours = 0: শুধু এখন চ্যাটে অনলাইন; p_hours > 0: অনলাইন + গত p_hours ঘণ্টায় বার্তা পাঠানো (সর্বোচ্চ ৭২০)। p_dept খালি = সব বিভাগ।
create or replace function mc2_ac_admin_active(p_hours int default 24, p_dept int default null) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.onl desc, x.ls desc nulls last) from (
    select a.voter, mc2_uid(a.voter) as uid,
      coalesce(lm.nick, p.nick, 'বেনামি') as nick,
      coalesce(dd.name, p.chat_dept) as dept, coalesce(ss.name, p.chat_session) as sess,
      coalesce(mc2_online(p.last_seen, p.offline), false) as onl,
      (extract(epoch from greatest(p.last_seen, lm.created_at)) * 1000)::bigint as ls,
      (select count(*) from mc2_ac_messages g where g.voter = a.voter and not g.deleted) as msgs,
      p.ip, p.country, p.region, p.city, left(p.ua, 200) as ua, p.info ->> 'model' as model,
      coalesce(mc2_ac_block(a.voter), 'ok') as st, md.until, md.reason, coalesce(md.verified, false) as verified, coalesce(md.warns, 0) as warns,
      (select count(distinct r.reporter) from mc2_ac_reports r where r.target = a.voter and r.status = 'valid') as valid_cnt
    from (
      select voter from mc2_presence where page = '#anon' and mc2_online(last_seen, offline)
      union
      select voter from mc2_ac_messages where p_hours > 0 and created_at > now() - make_interval(hours => least(p_hours, 720))
    ) a
    left join mc2_presence p on p.voter = a.voter
    left join lateral (select g.nick, g.dept_id, g.session_id, g.created_at from mc2_ac_messages g where g.voter = a.voter order by g.id desc limit 1) lm on true
    left join mc2_ac_depts dd on dd.id = lm.dept_id
    left join mc2_ac_sessions ss on ss.id = lm.session_id
    left join mc2_ac_mod md on md.voter = a.voter
    where p_dept is null or dd.id = p_dept or p.chat_dept_id = p_dept
    limit 300) x), '[]'::jsonb);
end $$;

-- ========== ৩) ভিজিটর ট্যাব: অনলাইন সংখ্যা + দেশভিত্তিক গণনা + অনলাইনদের তালিকা ==========
create or replace function mc2_admin_online_full() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare dday date := (now() at time zone 'Asia/Dhaka')::date;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  return jsonb_build_object(
    'online', (select count(*) from mc2_presence where mc2_online(last_seen, offline)),
    'today', (select count(*) from mc2_presence where (last_seen at time zone 'Asia/Dhaka')::date = dday),
    'total', (select count(*) from mc2_presence),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('c', c, 'n', n) order by n desc, c) from (
      select coalesce(nullif(upper(country), ''), '') as c, count(*) as n from mc2_presence where mc2_online(last_seen, offline) group by 1) z), '[]'::jsonb),
    'rows', coalesce((select jsonb_agg(to_jsonb(t) order by t.ls desc) from (
      select p.voter as v, mc2_uid(p.voter) as u, coalesce(p.game_name, p.nick, 'অজানা') as n, coalesce(p.game_dept, p.chat_dept) as d, coalesce(p.game_batch, p.chat_session) as s,
        p.page as pg, p.ip, p.country, p.region, p.city, left(p.ua, 200) as ua, p.info ->> 'model' as model, p.visits,
        (extract(epoch from p.last_seen) * 1000)::bigint as ls, (extract(epoch from p.joined_at) * 1000)::bigint as jn
      from mc2_presence p where mc2_online(p.last_seen, p.offline) order by p.last_seen desc limit 300) t), '[]'::jsonb));
end $$;
revoke all on function mc2_admin_online_full() from public, anon; grant execute on function mc2_admin_online_full() to authenticated;

-- অ্যাডমিন RPC-র অনুমতি (নতুন ফাংশনসহ)
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

notify pgrst, 'reload schema';

-- নাম-চেক (Run করার পর এটা আলাদা চালান; দুটোই ঠিক থাকলে cols_ok = 2 ও funcs_ok = 3):
-- select (select count(*) from information_schema.columns where table_name = 'mc2_ac_depts' and column_name in ('keep_min', 'file_keep_min')) as cols_ok,
--        (select count(distinct proname) from pg_proc where proname in ('mc2_ac_admin_dept_keep', 'mc2_ac_admin_active', 'mc2_admin_online_full')) as funcs_ok;

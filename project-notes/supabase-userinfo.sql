-- MC Explorer — User Info, অনলাইন স্ট্যাটাস, Visitor List, Join/Leave, Last Active (একটাই ফাইল)
-- Supabase SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আগের সব SQL (contest, community, titles, gallery, anonchat) চালানো থাকতে হবে। আবার চালালেও ক্ষতি নেই।
-- ⚠️ এটা চালানোর পরে নতুন সাইট ফাইল (presence.js, anonchat.js, contest.js ইত্যাদি) আপলোড করুন।

-- পুরস্কার ফর্মের সাথে ডিভাইস মেলাতে (ঐচ্ছিক কলাম; পুরোনো জমা এতে খালি থাকবে)
alter table contest_entries add column if not exists device text;
drop function if exists submit_entry(text, text, text, text, int, int);
create or replace function submit_entry(p_name text, p_link text, p_shot text, p_contact text, p_pct int, p_score int, p_device text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then raise exception 'bad name'; end if;
  if p_link is null or length(p_link) > 400 or p_link !~* '^https?://([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)/' then raise exception 'bad link'; end if;
  if p_shot is null or length(p_shot) > 500 then raise exception 'bad shot'; end if;
  insert into contest_entries (name, fb_link, shot_url, contact, pct, score, device)
  values (trim(p_name), trim(p_link), p_shot, nullif(left(trim(coalesce(p_contact, '')), 300), ''), p_pct, p_score, nullif(left(coalesce(p_device, ''), 80), ''))
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'duplicate';
end $$;
revoke all on function submit_entry(text, text, text, text, int, int, text) from public;
grant execute on function submit_entry(text, text, text, text, int, int, text) to anon;

-- সহায়ক ফাংশন: পাবলিক ইউজার আইডি (ডিভাইস আইডি থেকে ফেরানো যায় না) ও অনলাইন নিয়ম (১০০ সেকেন্ডের মধ্যে সাড়া পেলে অনলাইন)
create or replace function mc2_uid(v text) returns text language sql immutable as $$ select 'U' || upper(substr(md5('mc2|' || coalesce(v, '')), 1, 7)) $$;
create or replace function mc2_online(ls timestamptz, off boolean) returns boolean language sql stable as $$ select not coalesce(off, false) and ls > now() - interval '100 seconds' $$;
grant execute on function mc2_uid(text), mc2_online(timestamptz, boolean) to anon, authenticated;

-- উপস্থিতি টেবিল (প্রতি ডিভাইসে একটা সারি); সরাসরি শুধু অ্যাডমিন পড়তে পারে
create table if not exists mc2_presence (
  voter text primary key,
  nick text, game_name text, game_dept text, game_batch text,
  chat_dept text, chat_session text, chat_dept_id int, chat_session_id int,
  page text, ip text, country text, region text, city text, ua text, info jsonb,
  first_seen timestamptz not null default now(), last_seen timestamptz not null default now(), joined_at timestamptz not null default now(),
  visits int not null default 1, offline boolean not null default false
);
create index if not exists mc2_presence_ls on mc2_presence (last_seen desc);
alter table mc2_presence enable row level security;
revoke all on mc2_presence from anon, authenticated;
grant select, delete on mc2_presence to authenticated;
drop policy if exists "pres admin" on mc2_presence;
create policy "pres admin" on mc2_presence for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- সাইট থেকে হার্টবিট (প্রতি ৩০ সেকেন্ডে)। আইপি ও আনুমানিক লোকেশন সার্ভার নিজে হেডার থেকে নেয় (দেশ প্রায় সবসময়, শহর/অঞ্চল সবসময় নয়)
create or replace function mc2_presence_ping(p_device text, p_nick text, p_gname text, p_gdept text, p_gbatch text, p_cdept text, p_csess text, p_cdept_id int, p_csess_id int, p_page text, p_info jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v text := left(coalesce(p_device, ''), 40); o record;
begin
  if char_length(v) < 8 then return; end if;
  select last_seen, offline into o from mc2_presence where voter = v;
  if found and o.last_seen > now() - interval '3 seconds' and not o.offline then return; end if;
  insert into mc2_presence(voter, nick, game_name, game_dept, game_batch, chat_dept, chat_session, chat_dept_id, chat_session_id, page, ip, country, region, city, ua, info)
  values (v, nullif(left(btrim(coalesce(p_nick, '')), 30), ''), nullif(left(btrim(coalesce(p_gname, '')), 30), ''), nullif(left(p_gdept, 60), ''), nullif(left(p_gbatch, 40), ''),
    nullif(left(p_cdept, 60), ''), nullif(left(p_csess, 40), ''), p_cdept_id, p_csess_id, left(p_page, 60), mc2_ip(), left(mc2_hdr('cf-ipcountry'), 8), left(mc2_hdr('cf-region'), 60), left(mc2_hdr('cf-ipcity'), 60),
    left(mc2_hdr('user-agent'), 400), case when p_info is not null and pg_column_size(p_info) < 3000 then p_info end)
  on conflict (voter) do update set
    nick = excluded.nick, game_name = excluded.game_name, game_dept = excluded.game_dept, game_batch = excluded.game_batch,
    chat_dept = excluded.chat_dept, chat_session = excluded.chat_session, chat_dept_id = excluded.chat_dept_id, chat_session_id = excluded.chat_session_id,
    page = excluded.page, ip = coalesce(excluded.ip, mc2_presence.ip), country = coalesce(excluded.country, mc2_presence.country), region = coalesce(excluded.region, mc2_presence.region), city = coalesce(excluded.city, mc2_presence.city),
    ua = coalesce(excluded.ua, mc2_presence.ua), info = coalesce(excluded.info, mc2_presence.info),
    joined_at = case when mc2_presence.offline or mc2_presence.last_seen < now() - interval '100 seconds' then now() else mc2_presence.joined_at end,
    visits = mc2_presence.visits + case when mc2_presence.offline or mc2_presence.last_seen < now() - interval '30 minutes' then 1 else 0 end,
    last_seen = now(), offline = false;
end $$;
grant execute on function mc2_presence_ping(text, text, text, text, text, text, text, int, int, text, jsonb) to anon, authenticated;

-- পেজ বন্ধ করলে সাথে সাথে অফলাইন
create or replace function mc2_presence_leave(p_device text) returns void language sql security definer set search_path = public as $$
  update mc2_presence set offline = true where voter = left(coalesce(p_device, ''), 40) $$;
grant execute on function mc2_presence_leave(text) to anon, authenticated;

-- চ্যাটের পোলিং: আগের সব কিছু + প্রতি বার্তায় ইউজার আইডি ('u') ও অনলাইন ('a'), আর রুমে অনলাইন সংখ্যা ('on')
create or replace function mc2_ac_meta(p_session int, p_min bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('up', mc2_ac_upload_on(),
    'on', (select count(*) from mc2_presence p where p.chat_session_id = p_session and p.page = '#anon' and mc2_online(p.last_seen, p.offline)),
    'rows', coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', m.id, 'n', m.nick, 'd', m.deleted, 'o', m.voter = p_voter, 'u', mc2_uid(m.voter),
      'a', exists (select 1 from mc2_presence p where p.voter = m.voter and mc2_online(p.last_seen, p.offline)),
      'r', (select coalesce(jsonb_object_agg(e, c), '{}'::jsonb) from (select emoji e, count(*) c from mc2_ac_reactions r where r.message_id = m.id group by emoji) z),
      'm', (select emoji from mc2_ac_reactions r where r.message_id = m.id and r.voter = p_voter),
      's', (select count(*) from mc2_ac_seen s where s.session_id = m.session_id and s.last_id >= m.id and s.voter <> m.voter)) x
    from mc2_ac_messages m where m.session_id = p_session and m.id >= p_min and not m.hidden order by m.id desc limit 500) t), '[]'::jsonb)) $$;
grant execute on function mc2_ac_meta(int, bigint, text) to anon, authenticated;

-- চ্যাটের User Info (সবাই দেখে): সদস্য তালিকা। আইপি/ডিভাইস/লোকেশন/ফোন এখানে নেই।
create or replace function mc2_ac_members(p_session int) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.onl desc, x.ls desc nulls last), '[]'::jsonb) from (
    select mc2_uid(v.voter) u,
      coalesce((select m.nick from mc2_ac_messages m where m.voter = v.voter and m.session_id = p_session order by m.id desc limit 1), p.nick, 'বেনামি') n,
      coalesce(mc2_online(p.last_seen, p.offline), false) onl,
      (extract(epoch from p.last_seen) * 1000)::bigint ls
    from (select voter from mc2_ac_messages where session_id = p_session and not hidden and created_at > now() - interval '30 days' group by voter
          union select voter from mc2_presence where chat_session_id = p_session and page = '#anon' and mc2_online(last_seen, offline)) v
    left join mc2_presence p on p.voter = v.voter
    limit 80) x $$;
grant execute on function mc2_ac_members(int) to anon, authenticated;

-- চ্যাটে নাম ক্লিক করলে: ইউজার কার্ড (সবাই দেখে; শুধু নাম, আইডি, বিভাগ, সেশন, স্কোর, অনলাইন, Last Active)
create or replace function mc2_ac_usercard(p_session int, p_uid text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text; p mc2_presence; dn text; sn text;
begin
  select m.voter into v from mc2_ac_messages m where m.session_id = p_session and mc2_uid(m.voter) = p_uid limit 1;
  if v is null then select pr.voter into v from mc2_presence pr where pr.chat_session_id = p_session and mc2_uid(pr.voter) = p_uid limit 1; end if;
  if v is null then return null; end if;
  select * into p from mc2_presence where voter = v;
  select d.name, s.name into dn, sn from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session;
  return jsonb_build_object('u', p_uid,
    'n', coalesce((select m.nick from mc2_ac_messages m where m.voter = v and m.session_id = p_session order by m.id desc limit 1), p.nick, 'বেনামি'),
    'dept', dn, 'sess', sn,
    'best', (select max(score) from mc2_scores where device = v), 'pct', (select max(pct) from mc2_scores where device = v), 'plays', (select count(*) from mc2_scores where device = v),
    'onl', coalesce(mc2_online(p.last_seen, p.offline), false), 'ls', (extract(epoch from p.last_seen) * 1000)::bigint,
    'msgs', (select count(*) from mc2_ac_messages where voter = v and session_id = p_session and not deleted));
end $$;
grant execute on function mc2_ac_usercard(int, text) to anon, authenticated;

-- ---------- অ্যাডমিন (শুধু mc2_admins; সার্ভারেও যাচাই) ----------
-- ড্যাশবোর্ডের অনলাইন বক্স (প্রতি ৮ সেকেন্ডে পোল): অনলাইন সংখ্যা, আজকের ও মোট ভিজিটর, অনলাইন তালিকা
create or replace function mc2_admin_online() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare dday date := (now() at time zone 'Asia/Dhaka')::date;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  return jsonb_build_object(
    'online', (select count(*) from mc2_presence where mc2_online(last_seen, offline)),
    'today', (select count(*) from mc2_presence where (last_seen at time zone 'Asia/Dhaka')::date = dday),
    'total', (select count(*) from mc2_presence),
    'rows', coalesce((select jsonb_agg(to_jsonb(t) order by t.ls desc) from (
      select p.voter v, mc2_uid(p.voter) u, coalesce(p.game_name, p.nick, 'অজানা') n, coalesce(p.game_dept, p.chat_dept) d, coalesce(p.game_batch, p.chat_session) s, p.page pg,
        (extract(epoch from p.last_seen) * 1000)::bigint ls
      from mc2_presence p where mc2_online(p.last_seen, p.offline) order by p.last_seen desc limit 200) t), '[]'::jsonb));
end $$;
revoke all on function mc2_admin_online() from public, anon; grant execute on function mc2_admin_online() to authenticated;

-- Visitor List (খোঁজা, শুধু অনলাইন ফিল্টার, পেজিং)
create or replace function mc2_admin_users(p_q text default '', p_online boolean default false, p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%'; t int; r jsonb;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select count(*) into t from mc2_presence p where (not p_online or mc2_online(p.last_seen, p.offline))
    and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, mc2_uid(p.voter))) like q);
  select coalesce(jsonb_agg(to_jsonb(x) order by x.ls desc), '[]'::jsonb) into r from (
    select p.voter, mc2_uid(p.voter) uid, p.nick, p.game_name gname, p.game_dept gdept, p.game_batch gbatch, p.chat_dept cdept, p.chat_session csess, p.page, p.ip, p.country, p.region, p.city, left(p.ua, 200) ua, p.visits,
      (extract(epoch from p.last_seen) * 1000)::bigint ls, mc2_online(p.last_seen, p.offline) online, (select max(s.score) from mc2_scores s where s.device = p.voter) best
    from mc2_presence p where (not p_online or mc2_online(p.last_seen, p.offline))
      and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, mc2_uid(p.voter))) like q)
    order by p.last_seen desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x;
  return jsonb_build_object('total', t, 'rows', r);
end $$;
revoke all on function mc2_admin_users(text, boolean, int, int) from public, anon; grant execute on function mc2_admin_users(text, boolean, int, int) to authenticated;

-- নাম ক্লিক করলে পুরো User Info (ডিভাইস আইডি দিয়ে)। প্রেজেন্স না থাকলে স্কোর/ভিজিট/বার্তার লগ থেকে যা পাওয়া যায়।
create or replace function mc2_admin_user(p_voter text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p mc2_presence; v text := left(coalesce(p_voter, ''), 80);
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select * into p from mc2_presence where voter = v;
  return jsonb_build_object('voter', v, 'uid', mc2_uid(v), 'known', p.voter is not null,
    'nick', p.nick, 'gname', coalesce(p.game_name, (select s.name from mc2_scores s where s.device = v order by s.id desc limit 1)), 'gdept', coalesce(p.game_dept, (select s.dept from mc2_scores s where s.device = v order by s.id desc limit 1)),
    'gbatch', coalesce(p.game_batch, (select s.batch from mc2_scores s where s.device = v order by s.id desc limit 1)), 'cdept', p.chat_dept, 'csess', p.chat_session, 'page', p.page,
    'ip', coalesce(p.ip, (select s.ip from mc2_scores s where s.device = v and s.ip is not null order by s.id desc limit 1), (select x.ip from mc2_visits x where x.device = v and x.ip is not null order by x.id desc limit 1), (select m.ip from mc2_ac_messages m where m.voter = v and m.ip is not null order by m.id desc limit 1)),
    'country', p.country, 'region', p.region, 'city', p.city,
    'ua', coalesce(p.ua, (select s.ua from mc2_scores s where s.device = v and s.ua is not null order by s.id desc limit 1), (select x.ua from mc2_visits x where x.device = v and x.ua is not null order by x.id desc limit 1)),
    'info', coalesce(p.info, (select s.info from mc2_scores s where s.device = v and s.info is not null order by s.id desc limit 1), (select x.info from mc2_visits x where x.device = v and x.info is not null order by x.id desc limit 1)),
    'first', p.first_seen, 'last', p.last_seen, 'joined', p.joined_at, 'visits', p.visits, 'online', coalesce(mc2_online(p.last_seen, p.offline), false),
    'best', (select max(score) from mc2_scores where device = v), 'bestpct', (select max(pct) from mc2_scores where device = v), 'plays', (select count(*) from mc2_scores where device = v),
    'scores', coalesce((select jsonb_agg(to_jsonb(t)) from (select name, dept, batch, score, pct, title, created_at from mc2_scores where device = v order by id desc limit 8) t), '[]'::jsonb),
    'msgs', (select count(*) from mc2_ac_messages where voter = v),
    'lastmsgs', coalesce((select jsonb_agg(to_jsonb(t)) from (select m.nick, m.body, m.created_at, s.name sess from mc2_ac_messages m left join mc2_ac_sessions s on s.id = m.session_id where m.voter = v and m.body <> '' order by m.id desc limit 5) t), '[]'::jsonb),
    'contact', (select e.contact from contest_entries e where e.device = v and e.contact is not null order by e.id desc limit 1),
    'phone', (select substring(e.contact from '(?:\+?88)?01[3-9][0-9]{8}') from contest_entries e where e.device = v and e.contact is not null order by e.id desc limit 1));
end $$;
revoke all on function mc2_admin_user(text) from public, anon; grant execute on function mc2_admin_user(text) to authenticated;

notify pgrst, 'reload schema';

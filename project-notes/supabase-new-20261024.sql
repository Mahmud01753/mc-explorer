-- MC Explorer — জেন্ডার সব জায়গায় + ভিজিটর লিস্টে ফোন/ডিভাইস তথ্য (একটাই ফাইল, একবার Run; আবার চালালেও ক্ষতি নেই)
-- আগে ব্যাকআপ নিন। এটা চালানোর পরে নতুন সাইট ফাইল আপলোড করুন (community.js, admin-*.js, sw.js)।
-- জেন্ডার কোড: m = ছেলে/স্যার, f = মেয়ে/ম্যাম, x = ভিজিটর/অজানা। সোর্স: খেলোয়াড়ের "আমি কে?" পছন্দ (সাইট এখন info.g হিসেবে পাঠায়)।

-- ১) কলাম
alter table mc2_presence add column if not exists gender text;
alter table mc2_scores add column if not exists gender text;
alter table mc2_visits add column if not exists gender text;
alter table mc2_cards add column if not exists gender text;
alter table contest_entries add column if not exists gender text;

-- ২) নতুন সারিতে নিজে নিজে জেন্ডার বসানো (স্কোর/ভিজিট/কার্ড/পুরস্কার ফর্ম): আগে info.g বা কার্ডের kind, না থাকলে ওই ডিভাইসের উপস্থিতি-সারি থেকে।
--    তাই স্কোর-সেভ, কার্ড-সেভ, submit_entry ফাংশন বদলাতে হয়নি।
create or replace function mc2_gender_fill() returns trigger language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(new); g text; dev text;
begin
  if new.gender is not null then return new; end if;
  g := coalesce(j -> 'info' ->> 'g', case j -> 'rec' ->> 'kind' when 'male' then 'm' when 'sir' then 'm' when 'female' then 'f' when 'mam' then 'f' when 'visitor' then 'x' end);
  if g is null and TG_TABLE_NAME <> 'mc2_presence' then
    dev := j ->> 'device';
    if dev is not null then select p.gender into g from mc2_presence p where p.voter = dev; end if;
  end if;
  if g in ('m', 'f', 'x') then new.gender := g; end if;
  return new;
end $$;
revoke all on function mc2_gender_fill() from public, anon, authenticated;
drop trigger if exists mc2_gender_fill_t on mc2_presence; create trigger mc2_gender_fill_t before insert on mc2_presence for each row execute function mc2_gender_fill();
drop trigger if exists mc2_gender_fill_t on mc2_scores;   create trigger mc2_gender_fill_t before insert on mc2_scores   for each row execute function mc2_gender_fill();
drop trigger if exists mc2_gender_fill_t on mc2_visits;   create trigger mc2_gender_fill_t before insert on mc2_visits   for each row execute function mc2_gender_fill();
drop trigger if exists mc2_gender_fill_t on mc2_cards;    create trigger mc2_gender_fill_t before insert on mc2_cards    for each row execute function mc2_gender_fill();
drop trigger if exists mc2_gender_fill_t on contest_entries; create trigger mc2_gender_fill_t before insert on contest_entries for each row execute function mc2_gender_fill();

-- ৩) পুরোনো ডেটা ভরা (যেখানে পাওয়া যায়): আগে কার্ডের kind থেকে, তারপর কার্ড থেকে স্কোর/উপস্থিতি/ভিজিট/পুরস্কার ফর্মে ডিভাইস মিলিয়ে
update mc2_cards set gender = case rec ->> 'kind' when 'male' then 'm' when 'sir' then 'm' when 'female' then 'f' when 'mam' then 'f' when 'visitor' then 'x' end
  where gender is null and rec ->> 'kind' in ('male', 'sir', 'female', 'mam', 'visitor');
update mc2_scores s set gender = d.gender from (select distinct on (device) device, gender from mc2_cards where gender is not null order by device, updated_at desc) d where s.gender is null and s.device = d.device;
update mc2_presence p set gender = d.gender from (select distinct on (device) device, gender from mc2_cards where gender is not null order by device, updated_at desc) d where p.gender is null and p.voter = d.device;
update mc2_visits v set gender = d.gender from (select distinct on (device) device, gender from mc2_cards where gender is not null order by device, updated_at desc) d where v.gender is null and v.device = d.device;
update contest_entries e set gender = d.gender from (select distinct on (device) device, gender from mc2_cards where gender is not null order by device, updated_at desc) d where e.gender is null and e.device = d.device;

-- ৪) হার্টবিট: info.g থেকে জেন্ডার উপস্থিতিতে রাখে (আগের সিগনেচরই, সাইটের পুরোনো ফাইলেও চলবে)
create or replace function mc2_presence_ping(p_device text, p_nick text, p_gname text, p_gdept text, p_gbatch text, p_cdept text, p_csess text, p_cdept_id int, p_csess_id int, p_page text, p_info jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v text := left(coalesce(p_device, ''), 40); o record;
begin
  if char_length(v) < 8 then return; end if;
  select last_seen, offline into o from mc2_presence where voter = v;
  if found and o.last_seen > now() - interval '3 seconds' and not o.offline then return; end if;
  insert into mc2_presence(voter, nick, game_name, game_dept, game_batch, chat_dept, chat_session, chat_dept_id, chat_session_id, page, ip, country, region, city, ua, info, gender)
  values (v, nullif(left(btrim(coalesce(p_nick, '')), 30), ''), nullif(left(btrim(coalesce(p_gname, '')), 30), ''), nullif(left(p_gdept, 60), ''), nullif(left(p_gbatch, 40), ''),
    nullif(left(p_cdept, 60), ''), nullif(left(p_csess, 40), ''), p_cdept_id, p_csess_id, left(p_page, 60), mc2_ip(), left(mc2_hdr('cf-ipcountry'), 8), left(mc2_hdr('cf-region'), 60), left(mc2_hdr('cf-ipcity'), 60),
    left(mc2_hdr('user-agent'), 400), case when p_info is not null and pg_column_size(p_info) < 3000 then p_info end,
    case when p_info ->> 'g' in ('m', 'f', 'x') then p_info ->> 'g' end)
  on conflict (voter) do update set
    nick = excluded.nick, game_name = excluded.game_name, game_dept = excluded.game_dept, game_batch = excluded.game_batch,
    chat_dept = excluded.chat_dept, chat_session = excluded.chat_session, chat_dept_id = excluded.chat_dept_id, chat_session_id = excluded.chat_session_id,
    page = excluded.page, ip = coalesce(excluded.ip, mc2_presence.ip), country = coalesce(excluded.country, mc2_presence.country), region = coalesce(excluded.region, mc2_presence.region), city = coalesce(excluded.city, mc2_presence.city),
    ua = coalesce(excluded.ua, mc2_presence.ua), info = coalesce(excluded.info, mc2_presence.info), gender = coalesce(excluded.gender, mc2_presence.gender),
    joined_at = case when mc2_presence.offline or mc2_presence.last_seen < now() - interval '100 seconds' then now() else mc2_presence.joined_at end,
    visits = mc2_presence.visits + case when mc2_presence.offline or mc2_presence.last_seen < now() - interval '30 minutes' then 1 else 0 end,
    last_seen = now(), offline = false;
end $$;

-- ৫) Visitor List: জেন্ডার, ফোন নম্বর (পুরস্কার ফর্মে দিলে), পুরো ডিভাইস info, শহর/অঞ্চল দিয়ে খোঁজা
create or replace function mc2_admin_users(p_q text default '', p_online boolean default false, p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%'; t int; r jsonb;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select count(*) into t from mc2_presence p where (not p_online or mc2_online(p.last_seen, p.offline))
    and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, p.city, p.region, mc2_uid(p.voter))) like q);
  select coalesce(jsonb_agg(to_jsonb(x) order by x.ls desc), '[]'::jsonb) into r from (
    select p.voter, mc2_uid(p.voter) uid, p.nick, p.game_name gname, p.game_dept gdept, p.game_batch gbatch, p.chat_dept cdept, p.chat_session csess, p.page, p.ip, p.country, p.region, p.city, left(p.ua, 200) ua, p.visits, p.gender, p.info,
      (select substring(e.contact from '(?:\+?88)?01[3-9][0-9]{8}') from contest_entries e where e.device = p.voter and e.contact is not null order by e.id desc limit 1) phone,
      (extract(epoch from p.last_seen) * 1000)::bigint ls, mc2_online(p.last_seen, p.offline) online, (select max(s.score) from mc2_scores s where s.device = p.voter) best
    from mc2_presence p where (not p_online or mc2_online(p.last_seen, p.offline))
      and (q = '%%' or lower(concat_ws(' ', p.nick, p.game_name, p.game_dept, p.game_batch, p.chat_dept, p.chat_session, p.ip, p.city, p.region, mc2_uid(p.voter))) like q)
    order by p.last_seen desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x;
  return jsonb_build_object('total', t, 'rows', r);
end $$;
revoke all on function mc2_admin_users(text, boolean, int, int) from public, anon; grant execute on function mc2_admin_users(text, boolean, int, int) to authenticated;

-- ৬) একজনের পুরো তথ্য: জেন্ডার যোগ
create or replace function mc2_admin_user(p_voter text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p mc2_presence; v text := left(coalesce(p_voter, ''), 80);
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select * into p from mc2_presence where voter = v;
  return jsonb_build_object('voter', v, 'uid', mc2_uid(v), 'known', p.voter is not null,
    'gender', coalesce(p.gender, (select s.gender from mc2_scores s where s.device = v and s.gender is not null order by s.id desc limit 1), (select c.gender from mc2_cards c where c.device = v and c.gender is not null order by c.updated_at desc limit 1)),
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

-- ৭) অ্যাডমিনের সব ট্যাবে চিহ্ন বসানোর জন্য: ডিভাইস→জেন্ডার (d) ও নাম→জেন্ডার (n, আনুমানিক)
create or replace function mc2_admin_genders() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  return jsonb_build_object(
    'd', (select coalesce(jsonb_object_agg(device, gender), '{}'::jsonb) from (
           select distinct on (device) device, gender from (
             select device, gender, created_at t from mc2_scores where gender is not null and device is not null
             union all select voter, gender, last_seen from mc2_presence where gender is not null) a
           order by device, t desc) b),
    'n', (select coalesce(jsonb_object_agg(k, gender), '{}'::jsonb) from (
           select distinct on (lower(name)) lower(name) k, gender from mc2_scores where gender is not null order by lower(name), created_at desc) c));
end $$;
revoke all on function mc2_admin_genders() from public, anon; grant execute on function mc2_admin_genders() to authenticated;

notify pgrst, 'reload schema';

-- নাম-চেক: সবগুলো ok = true এলে ঠিক
select 'gender কলাম (৫ টেবিল)' as item, (select count(*) from information_schema.columns where column_name = 'gender' and table_name in ('mc2_presence', 'mc2_scores', 'mc2_visits', 'mc2_cards', 'contest_entries')) = 5 as ok
union all select 'অ্যাডমিন জেন্ডার ফাংশন', to_regprocedure('mc2_admin_genders()') is not null
union all select 'ট্রিগার (৫টি)', (select count(*) from pg_trigger where tgname = 'mc2_gender_fill_t') = 5;

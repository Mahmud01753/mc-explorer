-- MC Explorer pending SQL, অংশ 2/5। সব অংশ ক্রমে একটার পর একটা চালান। আবার চালালেও ক্ষতি নেই।
create or replace function mc2_ac_send(p_session int, p_nick text, p_body text, p_voter text, p_reply bigint default null, p_kind text default 'text', p_path text default null, p_fname text default null, p_size bigint default null, p_mime text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare q record; b text := btrim(coalesce(p_body, '')); n text := left(btrim(coalesce(p_nick, '')), 30); v text := left(coalesce(p_voter, ''), 80); k text := coalesce(p_kind, 'text'); r bigint; rid bigint; rn text; rt text;
begin
  select s.id, s.dept_id into q from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active;
  if not found then return 0; end if;
  if k not in ('text', 'image', 'video', 'audio', 'file') or char_length(b) > 400 or v = '' then return -1; end if;
  if k = 'text' then
    if char_length(b) < 1 then return -1; end if;
  else
    if not mc2_ac_upload_on() then return -2; end if;
    if p_path is null or p_path not like p_session::text || '/%' or not exists (select 1 from storage.objects where bucket_id = 'mc2-chat' and name = p_path) then return -1; end if;
  end if;
  if n = '' then n := 'বেনামি'; end if;
  if exists (select 1 from mc2_ac_messages where voter = v and created_at > now() - interval '2 seconds') then return -1; end if;
  if (select count(*) from mc2_ac_messages where voter = v and created_at > now() - interval '1 minute') >= 20 then return -1; end if;
  if p_reply is not null then
    select id, nick, left(case when deleted then 'মুছে ফেলা বার্তা' when body = '' then '📎 ' || coalesce(file_name, 'ফাইল') else body end, 80) into rid, rn, rt
      from mc2_ac_messages where id = p_reply and session_id = p_session and not hidden;
  end if;
  insert into mc2_ac_messages(dept_id, session_id, nick, body, voter, ip, reply_to, reply_nick, reply_text, kind, file_path, file_name, file_size, file_mime)
  values (q.dept_id, q.id, n, b, v, mc2_ip(), rid, rn, rt, k, case when k = 'text' then null else p_path end, case when k = 'text' then null else left(p_fname, 120) end, case when k = 'text' then null else p_size end, case when k = 'text' then null else left(p_mime, 100) end)
  returning id into r;
  return r;
end $$;
grant execute on function mc2_ac_send(int, text, text, text, bigint, text, text, text, bigint, text) to anon, authenticated;

create or replace function mc2_ac_unsend(p_msg bigint, p_voter text) returns boolean language plpgsql security definer set search_path = public as $$
declare c int;
begin
  update mc2_ac_messages set deleted = true, body = '', kind = 'text', file_path = null, file_name = null, file_size = null, file_mime = null, reply_to = null, reply_nick = null, reply_text = null
    where id = p_msg and voter = p_voter and not deleted and created_at > now() - interval '5 minutes';
  get diagnostics c = row_count;
  if c > 0 then delete from mc2_ac_reactions where message_id = p_msg; update mc2_ac_messages set reply_text = 'মুছে ফেলা বার্তা' where reply_to = p_msg; end if;
  return c > 0;
end $$;
grant execute on function mc2_ac_unsend(bigint, text) to anon, authenticated;

create or replace function mc2_ac_react(p_msg bigint, p_voter text, p_emoji text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') = '' or char_length(coalesce(p_emoji, '')) not between 1 and 16 then return; end if;
  if not exists (select 1 from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id join mc2_ac_depts d on d.id = s.dept_id where m.id = p_msg and not m.hidden and not m.deleted and s.active and d.active) then return; end if;
  if exists (select 1 from mc2_ac_reactions where message_id = p_msg and voter = p_voter and emoji = p_emoji) then delete from mc2_ac_reactions where message_id = p_msg and voter = p_voter;
  else insert into mc2_ac_reactions(message_id, voter, emoji) values (p_msg, p_voter, p_emoji) on conflict (message_id, voter) do update set emoji = excluded.emoji; end if;
end $$;
grant execute on function mc2_ac_react(bigint, text, text) to anon, authenticated;

create or replace function mc2_ac_seen(p_session int, p_voter text, p_nick text, p_last bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') = '' or not exists (select 1 from mc2_ac_sessions where id = p_session) then return; end if;
  insert into mc2_ac_seen(session_id, voter, nick, last_id) values (p_session, left(p_voter, 80), left(p_nick, 30), coalesce(p_last, 0))
  on conflict (session_id, voter) do update set last_id = greatest(mc2_ac_seen.last_id, excluded.last_id), nick = excluded.nick, at = now();
end $$;
grant execute on function mc2_ac_seen(int, text, text, bigint) to anon, authenticated;
create or replace function mc2_ac_seenlist(p_msg bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(s.nick order by s.at), '[]'::jsonb) from mc2_ac_seen s join mc2_ac_messages m on m.session_id = s.session_id where m.id = p_msg and s.last_id >= m.id and s.voter <> m.voter $$;
grant execute on function mc2_ac_seenlist(bigint) to anon, authenticated;

create or replace function mc2_ac_rename(p_voter text, p_nick text) returns void language plpgsql security definer set search_path = public as $$
declare n text := left(btrim(coalesce(p_nick, '')), 30);
begin
  if n = '' or coalesce(p_voter, '') = '' then return; end if;
  update mc2_ac_messages set nick = n where voter = p_voter and nick <> n;
  update mc2_ac_seen set nick = n where voter = p_voter;
end $$;
grant execute on function mc2_ac_rename(text, text) to anon, authenticated;

create or replace function mc2_ac_meta(p_session int, p_min bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('up', mc2_ac_upload_on(), 'rows', coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', m.id, 'n', m.nick, 'd', m.deleted, 'o', m.voter = p_voter,
      'r', (select coalesce(jsonb_object_agg(e, c), '{}'::jsonb) from (select emoji e, count(*) c from mc2_ac_reactions r where r.message_id = m.id group by emoji) z),
      'm', (select emoji from mc2_ac_reactions r where r.message_id = m.id and r.voter = p_voter),
      's', (select count(*) from mc2_ac_seen s where s.session_id = m.session_id and s.last_id >= m.id and s.voter <> m.voter)) x
    from mc2_ac_messages m where m.session_id = p_session and m.id >= p_min and not m.hidden order by m.id desc limit 500) t), '[]'::jsonb)) $$;
grant execute on function mc2_ac_meta(int, bigint, text) to anon, authenticated;

insert into mc2_ac_depts(name, sort) select name, sort from mc2_chat_rooms where name <> 'ক্যাম্পাস লাউঞ্জ' on conflict do nothing;
insert into mc2_ac_sessions(dept_id, name, sort) select d.id, x.n, x.o from mc2_ac_depts d,
  (values ('২০১৭-১৮',1),('২০১৮-১৯',2),('২০১৯-২০',3),('২০২০-২১',4),('২০২১-২২',5),('২০২২-২৩',6),('২০২৩-২৪',7),('২০২৪-২৫',8),('২০২৫-২৬',9),('অ্যালামনাই',10)) as x(n, o)
  on conflict do nothing;

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

create or replace function mc2_uid(v text) returns text language sql immutable as $$ select 'U' || upper(substr(md5('mc2|' || coalesce(v, '')), 1, 7)) $$;
create or replace function mc2_online(ls timestamptz, off boolean) returns boolean language sql stable as $$ select not coalesce(off, false) and ls > now() - interval '100 seconds' $$;
grant execute on function mc2_uid(text), mc2_online(timestamptz, boolean) to anon, authenticated;

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

create or replace function mc2_presence_leave(p_device text) returns void language sql security definer set search_path = public as $$
  update mc2_presence set offline = true where voter = left(coalesce(p_device, ''), 40) $$;
grant execute on function mc2_presence_leave(text) to anon, authenticated;

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

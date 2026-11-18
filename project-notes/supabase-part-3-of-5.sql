-- MC Explorer pending SQL, অংশ 3/5। সব অংশ ক্রমে একটার পর একটা চালান। আবার চালালেও ক্ষতি নেই।
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

create table if not exists mc2_ac_rl (k text primary key, ws timestamptz not null default now(), n int not null default 0);
alter table mc2_ac_rl enable row level security;
revoke all on mc2_ac_rl from anon, authenticated;
create or replace function mc2_ac_rl(p_k text, p_limit int, p_secs int) returns boolean language plpgsql security definer set search_path = public as $$
declare c int;
begin
  insert into mc2_ac_rl(k, ws, n) values (p_k, now(), 1)
  on conflict (k) do update set
    n = case when mc2_ac_rl.ws < now() - make_interval(secs => p_secs) then 1 else mc2_ac_rl.n + 1 end,
    ws = case when mc2_ac_rl.ws < now() - make_interval(secs => p_secs) then now() else mc2_ac_rl.ws end
  returning n into c;
  if random() < 0.01 then delete from mc2_ac_rl where ws < now() - interval '1 day'; end if;
  return c <= p_limit;
end $$;
revoke all on function mc2_ac_rl(text, int, int) from public, anon, authenticated;

create or replace function mc2_ac_clean(t text, p_len int) returns text language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(t, ''), E'[[:cntrl:]\\u200B\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]', '', 'g')), p_len) $$;

create or replace function mc2_ac_ftypes() returns jsonb language sql immutable as $$ select '{
 "jpg":["image","image/jpeg",10],"jpeg":["image","image/jpeg",10],"png":["image","image/png",10],"gif":["image","image/gif",10],"webp":["image","image/webp",10],
 "mp4":["video","video/mp4",25],"webm":["video","video/webm",25],"mov":["video","video/quicktime",25],
 "mp3":["audio","audio/mpeg",15],"m4a":["audio","audio/mp4",15],"wav":["audio","audio/wav",15],"ogg":["audio","audio/ogg",15],"aac":["audio","audio/aac",15],
 "pdf":["file","application/pdf",15],"txt":["file","text/plain",2],"csv":["file","text/csv",5],
 "doc":["file","application/msword",15],
 "docx":["file","application/vnd.openxmlformats-officedocument.wordprocessingml.document",15],
 "xls":["file","application/vnd.ms-excel",15],
 "xlsx":["file","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",15],
 "ppt":["file","application/vnd.ms-powerpoint",25],
 "pptx":["file","application/vnd.openxmlformats-officedocument.presentationml.presentation",25]}'::jsonb $$;
grant execute on function mc2_ac_ftypes() to anon, authenticated;

alter table mc2_ac_messages add column if not exists mod_removed boolean not null default false;
grant select (mod_removed) on mc2_ac_messages to anon;
create unique index if not exists mc2_ac_m_file on mc2_ac_messages (file_path) where file_path is not null;

create table if not exists mc2_ac_mod (
  voter text primary key,
  state text not null default 'ok' check (state in ('ok', 'restricted', 'banned')),
  until timestamptz,                         -- restricted: বাধ্যতামূলক; banned: খালি = স্থায়ী
  reason text,
  review boolean not null default false,     -- ৩টি বৈধ রিপোর্ট হলে true (অ্যাডমিনের Review তালিকায় আসে)
  review_at timestamptz,
  verified boolean not null default false,   -- যাচাই শেষ (স্থায়ী ব্যানের শর্ত)
  verified_by text, verified_at timestamptz, verified_note text,
  warns int not null default 0,
  updated_at timestamptz not null default now(),
  check (state <> 'restricted' or until is not null)
);
create table if not exists mc2_ac_modlog (
  id bigserial primary key, voter text, action text not null, reason text, until timestamptz,
  admin text, msg_id bigint, report_id bigint, created_at timestamptz not null default now()
);
create index if not exists mc2_ac_modlog_v on mc2_ac_modlog (voter, id desc);
create table if not exists mc2_ac_warns (
  id bigserial primary key, voter text not null, reason text not null, msg_id bigint,
  acked boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists mc2_ac_warns_v on mc2_ac_warns (voter, acked);
create table if not exists mc2_ac_reports (
  id bigserial primary key,
  message_id bigint references mc2_ac_messages(id) on delete set null,
  session_id int, target text not null, target_nick text, reporter text not null,
  reason text not null check (reason in ('abuse', 'harass', 'threat', 'adult', 'spam', 'privacy', 'illegal', 'other')),
  note text check (note is null or char_length(note) <= 200),
  snap_body text, snap_kind text, snap_file text, snap_fname text,   -- রিপোর্টের সময়ের কপি (পরে মুছলেও প্রমাণ থাকে)
  status text not null default 'open' check (status in ('open', 'valid', 'rejected')),
  reviewed_by text, reviewed_at timestamptz, admin_note text,
  created_at timestamptz not null default now(),
  unique (message_id, reporter)
);
create index if not exists mc2_ac_reports_t on mc2_ac_reports (target, status);
create index if not exists mc2_ac_reports_s on mc2_ac_reports (status, id desc);
alter table mc2_ac_mod enable row level security; alter table mc2_ac_modlog enable row level security;
alter table mc2_ac_warns enable row level security; alter table mc2_ac_reports enable row level security;
revoke all on mc2_ac_mod, mc2_ac_modlog, mc2_ac_warns, mc2_ac_reports from anon, authenticated;

create or replace function mc2_ac_adm() returns text language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'অনুমতি নেই' using errcode = '42501'; end if;
  return coalesce(auth.jwt() ->> 'email', 'admin');
end $$;
revoke all on function mc2_ac_adm() from public, anon;
grant execute on function mc2_ac_adm() to authenticated;

create or replace function mc2_ac_block(p_voter text) returns text language sql stable security definer set search_path = public as $$
  select case when m.state = 'banned' and (m.until is null or m.until > now()) then 'banned'
              when m.state = 'restricted' and m.until > now() then 'restricted' end
  from mc2_ac_mod m where m.voter = p_voter $$;
revoke all on function mc2_ac_block(text) from public, anon, authenticated;

create or replace function mc2_ac_me(p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    's', coalesce(mc2_ac_block(p_voter), 'ok'),
    'u', (select case when m.until is not null then (extract(epoch from m.until) * 1000)::bigint end from mc2_ac_mod m where m.voter = p_voter),
    'r', (select m.reason from mc2_ac_mod m where m.voter = p_voter and mc2_ac_block(p_voter) is not null),
    'w', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'r', w.reason) order by w.id) from mc2_ac_warns w where w.voter = p_voter and not w.acked), '[]'::jsonb)) $$;
revoke all on function mc2_ac_me(text) from public, anon, authenticated;

create or replace function mc2_ac_log(p_voter text, p_action text, p_reason text, p_until timestamptz, p_admin text, p_msg bigint default null, p_report bigint default null) returns void
language sql security definer set search_path = public as $$
  insert into mc2_ac_modlog(voter, action, reason, until, admin, msg_id, report_id) values (p_voter, p_action, p_reason, p_until, p_admin, p_msg, p_report) $$;
revoke all on function mc2_ac_log(text, text, text, timestamptz, text, bigint, bigint) from public, anon, authenticated;

create or replace function mc2_ac_upload_gate() returns boolean language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip();
begin
  if ip is null then return true; end if;
  return mc2_ac_rl('up:ip:' || ip || ':60', 20, 60);
end $$;
grant execute on function mc2_ac_upload_gate() to anon, authenticated;

do $$ begin
  update storage.buckets set public = true, file_size_limit = 26214400,
    allowed_mime_types = (select array_agg(distinct e.v ->> 1) from jsonb_each(mc2_ac_ftypes()) e(k, v))
  where id = 'mc2-chat';
exception when undefined_column then
  update storage.buckets set public = true, file_size_limit = 26214400 where id = 'mc2-chat';
end $$;
drop policy if exists "ac up" on storage.objects;
create policy "ac up" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'mc2-chat' and mc2_ac_upload_on()
    and name ~ '^[0-9]{1,9}/[a-z0-9]{8,40}\.[a-z0-9]{1,5}$'
    and (mc2_ac_ftypes() -> lower(substring(name from '\.([A-Za-z0-9]+)$'))) is not null
    and split_part(name, '/', 1) in (select id::text from mc2_ac_sessions)
    and mc2_ac_upload_gate());
drop policy if exists "ac adm sel" on storage.objects; drop policy if exists "ac adm del" on storage.objects;
create policy "ac adm sel" on storage.objects for select to authenticated using (bucket_id = 'mc2-chat' and mc2_is_admin());
create policy "ac adm del" on storage.objects for delete to authenticated using (bucket_id = 'mc2-chat' and mc2_is_admin());

drop function if exists mc2_ac_send(int, text, text, text, bigint, text, text, text, bigint, text);
create or replace function mc2_ac_send(p_session int, p_nick text, p_body text, p_voter text, p_reply bigint default null, p_kind text default 'text', p_path text default null, p_fname text default null, p_size bigint default null, p_mime text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare q record; o record; ft jsonb; ext text; kd text := 'text'; fn text; fsz bigint; fmt text; r bigint; rid bigint; rn text; rt text;
  b text := mc2_ac_clean(p_body, 400); nk text := mc2_ac_clean(p_nick, 30); v text := coalesce(p_voter, ''); ip text := mc2_ip();
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' then return -1; end if;
  select s.id, s.dept_id into q from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active;
  if not found then return 0; end if;
  if mc2_ac_block(v) is not null then return -3; end if;
  perform mc2_ac_tick();
  if nk = '' then nk := 'বেনামি'; end if;
  if p_path is null then
    if b = '' then return -1; end if;
    if (select count(*) from regexp_matches(b, '(https?://|www\.)', 'gi')) > 3 then return -1; end if;
    if exists (select 1 from mc2_ac_messages where voter = v and kind = 'text' and body = b and created_at > now() - interval '20 seconds') then return -4; end if;
  else
    if not mc2_ac_upload_on() then return -2; end if;
    if p_path !~ ('^' || p_session::text || '/[a-z0-9]{8,40}\.[a-z0-9]{1,5}$') then return -5; end if;
    ext := lower(substring(p_path from '\.([a-z0-9]+)$'));
    ft := mc2_ac_ftypes() -> ext;
    if ft is null then return -5; end if;
    select (metadata ->> 'size')::bigint as sz, metadata ->> 'mimetype' as mt, created_at as ca into o from storage.objects where bucket_id = 'mc2-chat' and name = p_path;
    if not found then return -5; end if;
    if o.ca < now() - interval '15 minutes' then return -5; end if;                       -- পুরোনো/অন্যের ফাইল নয়
    if split_part(coalesce(o.mt, ''), ';', 1) <> (ft ->> 1) then return -5; end if;       -- মাইম মিলতে হবে
    if o.sz is null or o.sz < 1 or o.sz > (ft ->> 2)::bigint * 1048576 then return -5; end if;
    if exists (select 1 from mc2_ac_messages where file_path = p_path) then return -5; end if;
    kd := ft ->> 0; fsz := o.sz; fmt := ft ->> 1;
    fn := mc2_ac_clean(translate(coalesce(p_fname, ''), '/\', '__'), 120);
    if fn = '' then fn := 'ফাইল.' || ext; end if;
    if not mc2_ac_rl('file:v:' || v || ':60', 5, 60) or not mc2_ac_rl('file:v:' || v || ':3600', 30, 3600) then return -4; end if;
  end if;
  if exists (select 1 from mc2_ac_messages where voter = v and created_at > now() - interval '2 seconds') then return -4; end if;
  if not mc2_ac_rl('send:v:' || v || ':60', 20, 60) then return -4; end if;
  if ip is not null and not mc2_ac_rl('send:ip:' || ip || ':60', 60, 60) then return -4; end if;
  if p_reply is not null then
    select id, nick, left(case when deleted then 'মুছে ফেলা বার্তা' when body = '' then '📎 ' || coalesce(file_name, 'ফাইল') else body end, 80) into rid, rn, rt
      from mc2_ac_messages where id = p_reply and session_id = p_session and not hidden;
  end if;
  insert into mc2_ac_messages(dept_id, session_id, nick, body, voter, ip, reply_to, reply_nick, reply_text, kind, file_path, file_name, file_size, file_mime)
  values (q.dept_id, q.id, nk, b, v, ip, rid, rn, rt, kd, case when kd = 'text' then null else p_path end, case when kd = 'text' then null else fn end,
          case when kd = 'text' then null else fsz end, case when kd = 'text' then null else fmt end)
  returning id into r;
  return r;
end $$;
grant execute on function mc2_ac_send(int, text, text, text, bigint, text, text, text, bigint, text) to anon, authenticated;

create or replace function mc2_ac_react(p_msg bigint, p_voter text, p_emoji text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(coalesce(p_emoji, '')) not between 1 and 16 then return; end if;
  if mc2_ac_block(p_voter) is not null then return; end if;
  if not mc2_ac_rl('react:v:' || p_voter || ':60', 40, 60) then return; end if;
  if not exists (select 1 from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id join mc2_ac_depts d on d.id = s.dept_id where m.id = p_msg and not m.hidden and not m.deleted and s.active and d.active) then return; end if;
  if exists (select 1 from mc2_ac_reactions where message_id = p_msg and voter = p_voter and emoji = p_emoji) then delete from mc2_ac_reactions where message_id = p_msg and voter = p_voter;
  else insert into mc2_ac_reactions(message_id, voter, emoji) values (p_msg, p_voter, p_emoji) on conflict (message_id, voter) do update set emoji = excluded.emoji; end if;
end $$;
grant execute on function mc2_ac_react(bigint, text, text) to anon, authenticated;

create or replace function mc2_ac_rename(p_voter text, p_nick text) returns void language plpgsql security definer set search_path = public as $$
declare n text := mc2_ac_clean(p_nick, 30);
begin
  if n = '' or coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then return; end if;
  if mc2_ac_block(p_voter) is not null then return; end if;
  if not mc2_ac_rl('ren:v:' || p_voter || ':3600', 10, 3600) then return; end if;
  update mc2_ac_messages set nick = n where voter = p_voter and nick <> n;
  update mc2_ac_seen set nick = n where voter = p_voter;
end $$;
grant execute on function mc2_ac_rename(text, text) to anon, authenticated;

create or replace function mc2_ac_report(p_msg bigint, p_voter text, p_reason text, p_note text default null) returns int
language plpgsql security definer set search_path = public as $$
declare v text := coalesce(p_voter, ''); m record; ip text := mc2_ip(); nt text := nullif(mc2_ac_clean(p_note, 200), '');
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' or coalesce(p_reason, '') not in ('abuse', 'harass', 'threat', 'adult', 'spam', 'privacy', 'illegal', 'other') then return -1; end if;
  if mc2_ac_block(v) = 'banned' then return -3; end if;
  select x.id, x.session_id, x.voter, x.nick, x.body, x.kind, x.file_path, x.file_name into m
    from mc2_ac_messages x join mc2_ac_sessions s on s.id = x.session_id join mc2_ac_depts d on d.id = s.dept_id
    where x.id = p_msg and not x.hidden and not x.deleted and s.active and d.active;
  if not found then return 0; end if;
  if m.voter = v then return -2; end if;
  if exists (select 1 from mc2_ac_reports where message_id = p_msg and reporter = v) then return -6; end if;
  if not mc2_ac_rl('rep:v:' || v || ':3600', 8, 3600) or not mc2_ac_rl('rep:v:' || v || ':86400', 20, 86400)
     or (ip is not null and not mc2_ac_rl('rep:ip:' || ip || ':3600', 30, 3600)) then return -4; end if;
  insert into mc2_ac_reports(message_id, session_id, target, target_nick, reporter, reason, note, snap_body, snap_kind, snap_file, snap_fname)
  values (m.id, m.session_id, m.voter, m.nick, v, p_reason, nt, left(m.body, 400), m.kind, m.file_path, m.file_name)
  on conflict do nothing;
  return 1;
end $$;
grant execute on function mc2_ac_report(bigint, text, text, text) to anon, authenticated;

create or replace function mc2_ac_ack_warn(p_voter text, p_id bigint) returns void language sql security definer set search_path = public as $$
  update mc2_ac_warns set acked = true where id = p_id and voter = p_voter $$;
grant execute on function mc2_ac_ack_warn(text, bigint) to anon, authenticated;

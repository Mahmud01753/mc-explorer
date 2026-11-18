-- MC Explorer — চ্যাট মডারেশন + ফাইল নিরাপত্তা + রেট লিমিট (বেনামি চ্যাটের জন্য)
-- কী আছে: রিপোর্ট (কারণ + ইতিহাস), সতর্কতা, সাময়িক Restriction/Ban, Unban, ৩টি বৈধ রিপোর্টে Review,
--          যাচাই (Verify) ছাড়া স্থায়ী ব্যান নয়, Input Validation, Rate Limiting, ফাইলের ধরন/সাইজ/মাইম যাচাই (সার্ভারে)।
-- চালানোর ক্রম: supabase-gallery.sql -> supabase-anonchat.sql -> supabase-userinfo.sql -> এই ফাইল। আবার চালালেও ক্ষতি নেই।
-- (supabase-pending-all.sql-এ সবই এই ক্রমে একসাথে আছে।)

-- ========== ১) রেট লিমিটার (ভেতরের কাজে; ক্লায়েন্ট সরাসরি ডাকতে পারে না) ==========
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

-- ========== ২) ইনপুট পরিষ্কার (কন্ট্রোল/বাইডি-ওভাররাইড অক্ষর বাদ; বাংলার ZWJ/ZWNJ রাখা হয়) ==========
create or replace function mc2_ac_clean(t text, p_len int) returns text language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(t, ''), E'[[:cntrl:]\\u200B\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]', '', 'g')), p_len) $$;

-- ========== ৩) অনুমোদিত ফাইলের তালিকা: এক্সটেনশন -> [ধরন, মাইম, সর্বোচ্চ MB] ==========
-- (ক্লায়েন্টের anonchat.js-এর FT তালিকার সাথে মিল রাখুন। SVG/HTML/JS/EXE/ZIP ইচ্ছা করেই নেই।)
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

-- ========== ৪) মডারেশন টেবিল (সবই RLS চালু, সরাসরি অ্যাক্সেস বন্ধ; শুধু নিচের RPC দিয়ে) ==========
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

-- ========== ৫) ভেতরের সহায়ক ফাংশন ==========
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

-- ফাইল আপলোডের সরাসরি Storage পথেও রেট লিমিট (আইপি না পেলে আটকায় না — সবাইকে একসাথে আটকানো এড়াতে)
create or replace function mc2_ac_upload_gate() returns boolean language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip();
begin
  if ip is null then return true; end if;
  return mc2_ac_rl('up:ip:' || ip || ':60', 20, 60);
end $$;
grant execute on function mc2_ac_upload_gate() to anon, authenticated;

-- ========== ৬) নিরাপদ ফাইল স্টোরেজ ==========
-- বাকেটে শুধু অনুমোদিত মাইম; সর্বোচ্চ ২৫ MB। আপলোড পলিসি: ON/OFF সুইচ + কঠোর নাম + অনুমোদিত এক্সটেনশন + সেশন আছে + রেট লিমিট।
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
-- অ্যাডমিন বার্তা মুছলে ফাইলও বাকেট থেকে মুছতে পারবে
drop policy if exists "ac adm sel" on storage.objects; drop policy if exists "ac adm del" on storage.objects;
create policy "ac adm sel" on storage.objects for select to authenticated using (bucket_id = 'mc2-chat' and mc2_is_admin());
create policy "ac adm del" on storage.objects for delete to authenticated using (bucket_id = 'mc2-chat' and mc2_is_admin());

-- ========== ৭) বার্তা পাঠানো (সব যাচাই সার্ভারে) ==========
-- ফল: id>0 সফল | 0 সেশন বন্ধ | -1 ভুল ইনপুট | -2 আপলোড বন্ধ | -3 ব্যান/Restriction | -4 খুব দ্রুত/বেশি | -5 ফাইল অনুমোদিত নয়
drop function if exists mc2_ac_send(int, text, text, text, bigint, text, text, text, bigint, text);
create or replace function mc2_ac_send(p_session int, p_nick text, p_body text, p_voter text, p_reply bigint default null, p_kind text default 'text', p_path text default null, p_fname text default null, p_size bigint default null, p_mime text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare q record; o record; ft jsonb; ext text; kd text := 'text'; fn text; fsz bigint; fmt text; r bigint; rid bigint; rn text; rt text;
  b text := mc2_ac_clean(p_body, 400); nk text := mc2_ac_clean(p_nick, 30); v text := coalesce(p_voter, ''); ip text := mc2_ip();
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' then return -1; end if;
  select s.id, s.dept_id into q from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active;
  if not found then return 0; end if;
  if not mc2_ac_can(p_session, v) then return -6; end if;   -- পাসওয়ার্ড দেওয়া চ্যাটে ঢোকেনি
  if mc2_ac_block(v) is not null then return -3; end if;
  perform mc2_ac_tick();
  if nk = '' then nk := 'বেনামি'; end if;
  if p_path is null then
    -- টেক্সট বার্তা
    if b = '' then return -1; end if;
    if (select count(*) from regexp_matches(b, '(https?://|www\.)', 'gi')) > 3 then return -1; end if;
    if exists (select 1 from mc2_ac_messages where voter = v and kind = 'text' and body = b and created_at > now() - interval '20 seconds') then return -4; end if;
  else
    -- ফাইল বার্তা: ধরন সার্ভারেই বের হয় (ক্লায়েন্টের দেওয়া ধরন/সাইজ/মাইম বিশ্বাস করা হয় না)
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

-- রিঅ্যাকশন ও নাম বদল: ব্যান চেক + রেট লিমিট + যাচাই
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

-- ========== ৮) রিপোর্ট (সবাই পাঠাতে পারে) ==========
-- ফল: 1 সফল | 0 বার্তা নেই/মুছে গেছে | -1 ভুল ইনপুট | -2 নিজের বার্তা | -3 ব্যান | -4 বেশি রিপোর্ট (রেট লিমিট) | -6 আগেই রিপোর্ট করেছেন
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

-- সতর্কবার্তা "বুঝেছি" চাপলে
create or replace function mc2_ac_ack_warn(p_voter text, p_id bigint) returns void language sql security definer set search_path = public as $$
  update mc2_ac_warns set acked = true where id = p_id and voter = p_voter $$;
grant execute on function mc2_ac_ack_warn(text, bigint) to anon, authenticated;

-- পোলিংয়ে নিজের স্ট্যাটাস (ban/restrict/সতর্কতা) সহ — আগের mc2_ac_meta-র সব আছে, শুধু 'me' যোগ হয়েছে
create or replace function mc2_ac_meta(p_session int, p_min bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('up', mc2_ac_upload_on(), 'me', mc2_ac_me(p_voter),
    'on', (select count(*) from mc2_presence p where p.chat_session_id = p_session and p.page = '#anon' and mc2_online(p.last_seen, p.offline)),
    'rows', coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', m.id, 'n', m.nick, 'd', m.deleted, 'o', m.voter = p_voter, 'u', mc2_uid(m.voter),
      'a', exists (select 1 from mc2_presence p where p.voter = m.voter and mc2_online(p.last_seen, p.offline)),
      'r', (select coalesce(jsonb_object_agg(e, c), '{}'::jsonb) from (select emoji e, count(*) c from mc2_ac_reactions r where r.message_id = m.id group by emoji) z),
      'm', (select emoji from mc2_ac_reactions r where r.message_id = m.id and r.voter = p_voter),
      's', (select count(*) from mc2_ac_seen s where s.session_id = m.session_id and s.last_id >= m.id and s.voter <> m.voter)) x
    from mc2_ac_messages m where m.session_id = p_session and m.id >= p_min and not m.hidden order by m.id desc limit 500) t), '[]'::jsonb)) $$;
grant execute on function mc2_ac_meta(int, bigint, text) to anon, authenticated;

-- ========== ৯) অ্যাডমিন RPC (সবগুলো mc2_is_admin() ছাড়া চলে না) ==========
create or replace function mc2_ac_admin_reports(p_status text default 'open', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc), '[]'::jsonb) from (
    select r.id, r.message_id, r.target, mc2_uid(r.target) as tuid, r.target_nick, mc2_uid(r.reporter) as ruid, r.reason, r.note,
      r.snap_body, r.snap_kind, r.snap_file, r.snap_fname, r.status, r.admin_note, r.created_at, r.reviewed_at,
      (select count(distinct r2.reporter) from mc2_ac_reports r2 where r2.target = r.target and r2.status = 'valid') as valid_cnt,
      coalesce(mc2_ac_block(r.target), 'ok') as st,
      (select (m.deleted or m.hidden) from mc2_ac_messages m where m.id = r.message_id) as gone,
      (select d.name || ' · ' || s.name from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = r.session_id) as place
    from mc2_ac_reports r where (p_status = 'all' or r.status = p_status)
    order by r.id desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x);
end $$;

-- রিপোর্ট বৈধ/অবৈধ করা। একই ইউজারের বিরুদ্ধে ৩ জন আলাদা রিপোর্টারের বৈধ রিপোর্ট হলে নিজে থেকে "Review"-তে ওঠে।
create or replace function mc2_ac_admin_review(p_id bigint, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); t text; cnt int; was boolean := false; rv boolean := false;
begin
  if p_status not in ('valid', 'rejected', 'open') then raise exception 'ভুল অবস্থা'; end if;
  update mc2_ac_reports set status = p_status, reviewed_by = case when p_status = 'open' then null else a end, reviewed_at = case when p_status = 'open' then null else now() end,
    admin_note = nullif(left(mc2_ac_clean(p_note, 300), 300), '') where id = p_id returning target into t;
  if t is null then raise exception 'রিপোর্ট পাওয়া যায়নি'; end if;
  perform mc2_ac_log(t, case p_status when 'valid' then 'report_valid' when 'rejected' then 'report_rejected' else 'report_reopen' end, mc2_ac_clean(p_note, 300), null, a, null, p_id);
  select count(distinct reporter) into cnt from mc2_ac_reports where target = t and status = 'valid';
  if p_status = 'valid' and cnt >= 3 then
    select coalesce((select review from mc2_ac_mod where voter = t), false) into was;
    if not was then
      insert into mc2_ac_mod(voter, review, review_at) values (t, true, now())
      on conflict (voter) do update set review = true, review_at = now(), updated_at = now();
      perform mc2_ac_log(t, 'review_flag', cnt || 'টি বৈধ রিপোর্ট — Review দরকার', null, 'system', null, p_id);
      rv := true;
    end if;
  end if;
  return jsonb_build_object('valid_cnt', cnt, 'review_flagged', rv);
end $$;

-- বার্তা মোছা (সবার জন্য; "অ্যাডমিন সরিয়েছেন" দেখায়)। ফেরত: ফাইলের পথ — অ্যাডমিন পেজ Storage থেকেও মুছে দেয়।
create or replace function mc2_ac_admin_remove(p_msg bigint, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); m record;
begin
  select id, voter, file_path into m from mc2_ac_messages where id = p_msg;
  if not found then raise exception 'বার্তা পাওয়া যায়নি'; end if;
  update mc2_ac_messages set deleted = true, mod_removed = true, body = '', kind = 'text', file_path = null, file_name = null, file_size = null, file_mime = null, reply_to = null, reply_nick = null, reply_text = null where id = p_msg;
  update mc2_ac_messages set reply_text = 'মুছে ফেলা বার্তা' where reply_to = p_msg;
  delete from mc2_ac_reactions where message_id = p_msg;
  perform mc2_ac_log(m.voter, 'msg_remove', mc2_ac_clean(p_reason, 300), null, a, p_msg);
  return jsonb_build_object('file', m.file_path);
end $$;

-- সতর্ক করা: ইউজার পরের পোলিংয়ে সতর্কবার্তা দেখে "বুঝেছি" চাপে
create or replace function mc2_ac_admin_warn(p_voter text, p_reason text, p_msg bigint default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); rs text := mc2_ac_clean(p_reason, 300);
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then raise exception 'ভুল ইউজার'; end if;
  if char_length(rs) < 3 then raise exception 'সতর্কতার কারণ লিখুন'; end if;
  insert into mc2_ac_warns(voter, reason, msg_id) values (p_voter, rs, p_msg);
  insert into mc2_ac_mod(voter, warns) values (p_voter, 1) on conflict (voter) do update set warns = mc2_ac_mod.warns + 1, updated_at = now();
  perform mc2_ac_log(p_voter, 'warn', rs, null, a, p_msg);
end $$;

-- সাময়িক Restriction (শুধু পড়তে পারবে) বা Ban। p_minutes: ৫ মিনিট থেকে ৩০ দিন (৪৩২০০)।
-- স্থায়ী ব্যান = kind 'ban' + p_minutes খালি; এর জন্য আগে (১) ৩ জন আলাদা রিপোর্টারের বৈধ রিপোর্ট ও (২) Verify (যাচাই) লাগে।
create or replace function mc2_ac_admin_sanction(p_voter text, p_kind text, p_minutes int, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); rs text := mc2_ac_clean(p_reason, 300); u timestamptz; perm boolean := (p_minutes is null or p_minutes <= 0); ok boolean; cnt int;
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then raise exception 'ভুল ইউজার'; end if;
  if p_kind not in ('restrict', 'ban') then raise exception 'ভুল ধরন'; end if;
  if char_length(rs) < 3 then raise exception 'কারণ লিখুন'; end if;
  if perm then
    if p_kind <> 'ban' then raise exception 'Restriction সাময়িকই হয় — সময় দিন'; end if;
    select count(distinct reporter) into cnt from mc2_ac_reports where target = p_voter and status = 'valid';
    select coalesce((select verified from mc2_ac_mod where voter = p_voter), false) into ok;
    if cnt < 3 or not ok then raise exception 'স্থায়ী ব্যানের আগে ৩টি বৈধ রিপোর্ট ও যাচাই (Verify) লাগবে — এখন সাময়িক ব্যান দিন'; end if;
    u := null;
  else
    if p_minutes < 5 or p_minutes > 43200 then raise exception 'সময় ৫ মিনিট থেকে ৩০ দিনের মধ্যে দিন'; end if;
    u := now() + make_interval(mins => p_minutes);
  end if;
  insert into mc2_ac_mod(voter, state, until, reason, review) values (p_voter, case p_kind when 'ban' then 'banned' else 'restricted' end, u, rs, false)
  on conflict (voter) do update set state = excluded.state, until = excluded.until, reason = excluded.reason, review = false, updated_at = now();
  perform mc2_ac_log(p_voter, case when p_kind = 'ban' and perm then 'ban_perm' else p_kind end, rs, u, a);
  return jsonb_build_object('state', case p_kind when 'ban' then 'banned' else 'restricted' end, 'until', u);
end $$;

create or replace function mc2_ac_admin_unban(p_voter text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  update mc2_ac_mod set state = 'ok', until = null, reason = null, updated_at = now() where voter = p_voter;
  perform mc2_ac_log(p_voter, 'unban', mc2_ac_clean(p_reason, 300), null, a);
end $$;

-- যাচাই (Verify): ৩ জন আলাদা রিপোর্টারের বৈধ রিপোর্ট থাকলে, প্রমাণ দেখে লিখিত নোটসহ; এরপরই স্থায়ী ব্যান সম্ভব
create or replace function mc2_ac_admin_verify(p_voter text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); nt text := mc2_ac_clean(p_note, 300); cnt int;
begin
  select count(distinct reporter) into cnt from mc2_ac_reports where target = p_voter and status = 'valid';
  if cnt < 3 then raise exception 'যাচাইয়ের জন্য কমপক্ষে ৩ জন আলাদা রিপোর্টারের বৈধ রিপোর্ট লাগবে (এখন %)', cnt; end if;
  if char_length(nt) < 10 then raise exception 'যাচাইয়ে কী দেখেছেন তা অন্তত ১০ অক্ষরে লিখুন'; end if;
  insert into mc2_ac_mod(voter, verified, verified_by, verified_at, verified_note, review) values (p_voter, true, a, now(), nt, false)
  on conflict (voter) do update set verified = true, verified_by = a, verified_at = now(), verified_note = nt, review = false, updated_at = now();
  perform mc2_ac_log(p_voter, 'verify', nt, null, a);
end $$;

-- Review শেষ, কোনো শাস্তি ছাড়া
create or replace function mc2_ac_admin_clear_review(p_voter text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  update mc2_ac_mod set review = false, updated_at = now() where voter = p_voter;
  perform mc2_ac_log(p_voter, 'review_clear', mc2_ac_clean(p_note, 300), null, a);
end $$;

-- যেসব ইউজারের দিকে নজর দরকার (Review / Restriction / Ban / সতর্কতা)
create or replace function mc2_ac_admin_mods() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.review desc, x.upd desc), '[]'::jsonb) from (
    select m.voter, mc2_uid(m.voter) as uid,
      coalesce((select g.nick from mc2_ac_messages g where g.voter = m.voter order by g.id desc limit 1), 'বেনামি') as nick,
      coalesce(mc2_ac_block(m.voter), 'ok') as st, m.until, m.reason, m.review, m.verified, m.warns,
      (select count(distinct r.reporter) from mc2_ac_reports r where r.target = m.voter and r.status = 'valid') as valid_cnt,
      (select count(*) from mc2_ac_reports r where r.target = m.voter and r.status = 'open') as open_cnt,
      m.updated_at as upd
    from mc2_ac_mod m where m.review or m.warns > 0 or m.state <> 'ok' order by m.updated_at desc limit 200) x);
end $$;

-- একজন ইউজারের সম্পূর্ণ ইতিহাস: অবস্থা + তার বিরুদ্ধে রিপোর্ট (কারণসহ) + সব অ্যাডমিন/সিস্টেম অ্যাকশন
create or replace function mc2_ac_admin_history(p_voter text) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object(
    'uid', mc2_uid(p_voter),
    'nick', coalesce((select g.nick from mc2_ac_messages g where g.voter = p_voter order by g.id desc limit 1), 'বেনামি'),
    'st', coalesce(mc2_ac_block(p_voter), 'ok'),
    'mod', (select to_jsonb(m) - 'voter' from mc2_ac_mod m where m.voter = p_voter),
    'valid_cnt', (select count(distinct reporter) from mc2_ac_reports where target = p_voter and status = 'valid'),
    'reports', coalesce((select jsonb_agg(to_jsonb(z) order by z.id desc) from (
        select r.id, r.reason, r.note, r.status, r.snap_body, r.snap_kind, r.snap_fname, r.created_at, mc2_uid(r.reporter) as ruid, r.admin_note
        from mc2_ac_reports r where r.target = p_voter order by r.id desc limit 100) z), '[]'::jsonb),
    'log', coalesce((select jsonb_agg(to_jsonb(l) order by l.id desc) from (
        select id, action, reason, until, admin, msg_id, report_id, created_at from mc2_ac_modlog where voter = p_voter order by id desc limit 100) l), '[]'::jsonb));
end $$;

-- ফাইল আপলোড ON/OFF (লগসহ)। বন্ধ করলে সার্ভারে সব আপলোড বন্ধ; আবার চালু করলে কোড বদলাতে হয় না।
create or replace function mc2_ac_admin_upload(p_on boolean) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  insert into mc2_ac_cfg(key, value) values ('upload', to_jsonb(coalesce(p_on, true))) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_log(null, case when coalesce(p_on, true) then 'upload_on' else 'upload_off' end, null, null, a);
end $$;

-- ========== ১০) চ্যাট ও ফাইল স্বয়ংক্রিয় মোছা (ডিফল্ট ১ দিন; অ্যাডমিন বদলাতে পারে; চ্যাট-বক্স (সেশন) অনুযায়ী আলাদা সময়; এখনই মোছা) ==========
-- সময় মিনিটে। 0 = কখনো মুছবে না। সেশনের keep_min খালি = ডিফল্ট। মোছা চলে চ্যাট ব্যবহারের সময় (সর্বোচ্চ ৫ মিনিট পরপর), তাই কোনো cron লাগে না।
alter table mc2_ac_sessions add column if not exists keep_min int check (keep_min is null or keep_min between 0 and 525600);
insert into mc2_ac_cfg(key, value) values ('keep_min', '1440') on conflict do nothing;

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440); n int; paths text[];
begin
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id
    where coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s
    where s.id = m.session_id and coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  get diagnostics n = row_count;
  -- ফাইল: মেয়াদোত্তীর্ণ বার্তার ফাইল + কোনো বার্তায় না লাগা ১ দিনের পুরোনো আপলোড। (Supabase সরাসরি SQL-মোছা আটকালে এই অংশ চুপচাপ বাদ যায়; বার্তা তবু মুছে যায়।)
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); end if; end $$;
grant execute on function mc2_ac_tick() to anon, authenticated;

create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.name as dept, s.name, s.keep_min, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

-- সময় বদল: p_session খালি = সবার ডিফল্ট (০..৫,২৫,৬০০ মিনিট, ০ = কখনো না); p_session থাকলে শুধু সেই চ্যাট-বক্স (p_min খালি = ডিফল্ট অনুযায়ী)
create or replace function mc2_ac_admin_keep(p_session int, p_min int) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  if p_min is not null and (p_min < 0 or p_min > 525600) then raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন'; end if;
  if p_session is null then
    if p_min is null then raise exception 'ডিফল্ট সময় দিন'; end if;
    insert into mc2_ac_cfg(key, value) values ('keep_min', to_jsonb(p_min)) on conflict (key) do update set value = excluded.value;
  else
    update mc2_ac_sessions set keep_min = p_min where id = p_session;
    if not found then raise exception 'চ্যাট-বক্স পাওয়া যায়নি'; end if;
  end if;
  perform mc2_ac_log(null, 'keep_set', coalesce(p_session::text, 'ডিফল্ট') || ' = ' || coalesce(p_min::text, 'ডিফল্ট অনুযায়ী') || ' মিনিট', null, a);
end $$;

-- এখনই মোছা: p_session খালি = সব চ্যাট-বক্স; p_older_min = শুধু এর চেয়ে পুরোনো (০ = সব)। ফাইলের পথ ফেরত আসে — অ্যাডমিন পেজ Storage API দিয়ে বাইটসহ মুছে দেয়।
create or replace function mc2_ac_admin_purge_now(p_session int default null, p_older_min int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); paths text[]; n int; t timestamptz := now() - make_interval(mins => greatest(coalesce(p_older_min, 0), 0));
begin
  select coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into paths from mc2_ac_messages where (p_session is null or session_id = p_session) and created_at < t;
  delete from mc2_ac_messages where (p_session is null or session_id = p_session) and created_at < t;
  get diagnostics n = row_count;
  perform mc2_ac_log(null, 'purge', coalesce(p_session::text, 'সব চ্যাট') || ' · ' || n || 'টি বার্তা · ' || coalesce(p_older_min, 0) || ' মিনিটের পুরোনো', null, a);
  return jsonb_build_object('deleted', n, 'files', to_jsonb(paths));
end $$;

-- অ্যাডমিন RPC: শুধু লগইন করা ইউজার ডাকতে পারে (ভেতরে আবার mc2_is_admin() যাচাই হয়)
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

-- রিঅ্যাকশন পপআপ: কে কোন রিঅ্যাকশন দিয়েছে (শুধু নাম ও ইমোজি; ডিভাইস/ইউজার আইডি যায় না। 'o' = নিজের)
create or replace function mc2_ac_reactors(p_msg bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'n', coalesce((select mm.nick from mc2_ac_messages mm where mm.voter = r.voter and mm.session_id = m.session_id order by mm.id desc limit 1),
                  (select s.nick from mc2_ac_seen s where s.voter = r.voter and s.session_id = m.session_id limit 1), 'বেনামি'),
    'e', r.emoji, 'o', r.voter = p_voter) order by r.emoji), '[]'::jsonb)
  from mc2_ac_reactions r join mc2_ac_messages m on m.id = r.message_id
  where r.message_id = p_msg and not m.hidden and not m.deleted $$;
grant execute on function mc2_ac_reactors(bigint, text) to anon, authenticated;

-- ========== চ্যাট রুমের পাসওয়ার্ড (অ্যাডমিন প্যানেলের সেশন-লিস্ট থেকে বসে/বদলায়/সরে) ==========
-- পাসওয়ার্ড শুধু হ্যাশ হয়ে থাকে (anon দেখতে পায় না; শুধু has_pw দেখে)। ঠিক পাসওয়ার্ড দিলে ডিভাইস mc2_ac_access-এ ঢোকে;
-- পড়া (RLS) ও পাঠানো (mc2_ac_send) দুটোই সার্ভারে আটকানো। পাসওয়ার্ড বদলালে/সরালে আগের সবার অ্যাক্সেস মুছে যায়।
alter table mc2_ac_sessions add column if not exists pw_hash text;
alter table mc2_ac_sessions add column if not exists pw_on boolean not null default false;   -- ডিফল্ট: বন্ধ। অ্যাডমিন চালু/বন্ধ করে (পাসওয়ার্ড সেভ থাকে)
alter table mc2_ac_sessions drop column if exists has_pw;
alter table mc2_ac_sessions add column has_pw boolean generated always as (pw_hash is not null and pw_on) stored;
revoke select on mc2_ac_sessions from anon;
grant select (id, dept_id, name, sort, active, keep_min, has_pw) on mc2_ac_sessions to anon;
create table if not exists mc2_ac_access (session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, at timestamptz not null default now(), primary key (session_id, voter));
alter table mc2_ac_access enable row level security; revoke all on mc2_ac_access from anon, authenticated;
create or replace function mc2_ac_pwh(p_session int, p_pw text) returns text language sql immutable set search_path = public as $$
  select encode(sha256(convert_to('mc2ac:' || p_session::text || ':' || p_pw, 'UTF8')), 'hex') $$;
revoke all on function mc2_ac_pwh(int, text) from public, anon, authenticated;
create or replace function mc2_ac_hdr_voter() returns text language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-voter', '') $$;
grant execute on function mc2_ac_hdr_voter() to anon, authenticated;
create or replace function mc2_ac_can(p_session int, p_voter text) returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from mc2_ac_sessions s where s.id = p_session and s.has_pw)
      or exists (select 1 from mc2_ac_access a where a.session_id = p_session and a.voter = coalesce(p_voter, '')) $$;
grant execute on function mc2_ac_can(int, text) to anon, authenticated;
drop policy if exists "ac m read" on mc2_ac_messages;
create policy "ac m read" on mc2_ac_messages for select to anon using (not hidden and mc2_ac_can(session_id, mc2_ac_hdr_voter()));
-- ঢোকা: 1 = ঢুকেছে/পাসওয়ার্ড লাগে না, 2 = পাসওয়ার্ড লাগবে, -2 = ভুল, -4 = বেশি চেষ্টা, 0 = চ্যাট বন্ধ, -1 = অবৈধ
create or replace function mc2_ac_join(p_session int, p_voter text, p_pw text default '') returns int language plpgsql security definer set search_path = public as $$
declare h text; ip text := mc2_ip();
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then return -1; end if;
  select case when has_pw then pw_hash end into h from mc2_ac_sessions where id = p_session and active;
  if not found then return 0; end if;
  if h is null then return 1; end if;
  if exists (select 1 from mc2_ac_access where session_id = p_session and voter = p_voter) then return 1; end if;
  if coalesce(p_pw, '') = '' then return 2; end if;
  if not mc2_ac_rl('pw:v:' || p_voter || ':600', 8, 600) or (ip is not null and not mc2_ac_rl('pw:ip:' || ip || ':600', 40, 600)) then return -4; end if;
  if h <> mc2_ac_pwh(p_session, p_pw) then return -2; end if;
  insert into mc2_ac_access(session_id, voter) values (p_session, p_voter) on conflict do nothing;
  return 1;
end $$;
grant execute on function mc2_ac_join(int, text, text) to anon, authenticated;
-- অ্যাডমিন: পাসওয়ার্ড বসানো/বদলানো (খালি = সরানো)
create or replace function mc2_ac_admin_setpw(p_session int, p_pw text) returns void language plpgsql security definer set search_path = public as $$
declare w text := btrim(coalesce(p_pw, ''));
begin
  perform mc2_ac_adm();
  if w = '' then update mc2_ac_sessions set pw_hash = null, pw_on = false where id = p_session;
  else
    if char_length(w) not between 3 and 40 then raise exception 'পাসওয়ার্ড ৩ থেকে ৪০ অক্ষরের হতে হবে'; end if;
    update mc2_ac_sessions set pw_hash = mc2_ac_pwh(p_session, w), pw_on = true where id = p_session;
  end if;
  delete from mc2_ac_access where session_id = p_session;
end $$;
revoke all on function mc2_ac_admin_setpw(int, text) from public, anon;
grant execute on function mc2_ac_admin_setpw(int, text) to authenticated;
-- অ্যাডমিন: পাসওয়ার্ড চালু/বন্ধ (সেভ করা পাসওয়ার্ড থাকে; চালু করলে সবাইকে আবার দিতে হয়)
create or replace function mc2_ac_admin_pwon(p_session int, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  if p_on and not exists (select 1 from mc2_ac_sessions where id = p_session and pw_hash is not null) then raise exception 'আগে পাসওয়ার্ড দিন'; end if;
  update mc2_ac_sessions set pw_on = p_on where id = p_session;
  delete from mc2_ac_access where session_id = p_session;
end $$;
revoke all on function mc2_ac_admin_pwon(int, boolean) from public, anon;
grant execute on function mc2_ac_admin_pwon(int, boolean) to authenticated;
-- চ্যাট ছাড়লে (Leave) নিজের অ্যাক্সেস মুছে যায়: আবার ঢুকতে পাসওয়ার্ড লাগবে
create or replace function mc2_ac_unjoin(p_session int, p_voter text) returns void language sql security definer set search_path = public as $$
  delete from mc2_ac_access where session_id = p_session and voter = coalesce(p_voter, '') $$;
grant execute on function mc2_ac_unjoin(int, text) to anon, authenticated;

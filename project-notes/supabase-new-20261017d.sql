-- MC Explorer — নতুন SQL (২০২৬-১০-১৭ d): রিঅ্যাকশন নামের তালিকা + চ্যাট রুমের পাসওয়ার্ড (ডিফল্ট বন্ধ, অ্যাডমিন চালু/বন্ধ, ছাড়লে আবার পাসওয়ার্ড)।
-- Supabase SQL Editor-এ একবার চালান (supabase-moderation.sql আগে চালানো থাকতে হবে)। আবার চালালেও ক্ষতি নেই।

-- চ্যাট পাঠানো: পাসওয়ার্ড দেওয়া রুমে না ঢুকলে -6
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

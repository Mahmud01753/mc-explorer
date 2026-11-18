-- MC Explorer — বেনামি চ্যাট (সব এক ফাইলে): বিভাগ → সেশন → চ্যাট, রিঅ্যাকশন, রিপ্লাই, Seen, নাম Edit, মোছা, ফাইল আপলোড + ON/OFF।
-- Supabase SQL Editor-এ একবার চালান। আগে supabase-community.sql চালানো থাকতে হবে। আবার চালালেও ক্ষতি নেই।
create table if not exists mc2_ac_depts (id serial primary key, name text not null unique check (char_length(name) between 1 and 60), sort int not null default 100, active boolean not null default true);
create table if not exists mc2_ac_sessions (id serial primary key, dept_id int not null references mc2_ac_depts(id) on delete cascade, name text not null check (char_length(name) between 1 and 40), sort int not null default 100, active boolean not null default true, unique (dept_id, name));
create table if not exists mc2_ac_messages (id bigserial primary key, dept_id int not null references mc2_ac_depts(id) on delete cascade, session_id int not null references mc2_ac_sessions(id) on delete cascade, nick text not null, body text not null, voter text not null, ip text, hidden boolean not null default false, created_at timestamptz not null default now());
create index if not exists mc2_ac_m on mc2_ac_messages (session_id, id desc);

alter table mc2_ac_depts enable row level security; alter table mc2_ac_sessions enable row level security; alter table mc2_ac_messages enable row level security;
revoke all on mc2_ac_depts, mc2_ac_sessions, mc2_ac_messages from anon, authenticated;
grant select on mc2_ac_depts, mc2_ac_sessions to anon;
grant select, insert, update, delete on mc2_ac_depts, mc2_ac_sessions, mc2_ac_messages to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select (id, session_id, nick, body, created_at) on mc2_ac_messages to anon;

drop policy if exists "ac d read" on mc2_ac_depts; drop policy if exists "ac d admin" on mc2_ac_depts;
drop policy if exists "ac s read" on mc2_ac_sessions; drop policy if exists "ac s admin" on mc2_ac_sessions;
drop policy if exists "ac m read" on mc2_ac_messages; drop policy if exists "ac m admin" on mc2_ac_messages;
create policy "ac d read" on mc2_ac_depts for select to anon using (active);
create policy "ac s read" on mc2_ac_sessions for select to anon using (active and exists (select 1 from mc2_ac_depts d where d.id = dept_id and d.active));
create policy "ac m read" on mc2_ac_messages for select to anon using (not hidden);
create policy "ac d admin" on mc2_ac_depts for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
create policy "ac s admin" on mc2_ac_sessions for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
create policy "ac m admin" on mc2_ac_messages for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

alter table mc2_ac_messages
  add column if not exists reply_to bigint, add column if not exists reply_nick text, add column if not exists reply_text text,
  add column if not exists kind text not null default 'text', add column if not exists file_path text, add column if not exists file_name text,
  add column if not exists file_size bigint, add column if not exists file_mime text, add column if not exists deleted boolean not null default false;
grant select (id, session_id, nick, body, created_at, reply_to, reply_nick, reply_text, kind, file_path, file_name, file_size, file_mime, deleted) on mc2_ac_messages to anon;

-- সেটিংস: আপলোড ON/OFF (অ্যাডমিন প্যানেল থেকে বদলায়)
create table if not exists mc2_ac_cfg (key text primary key, value jsonb not null);
alter table mc2_ac_cfg enable row level security;
revoke all on mc2_ac_cfg from anon, authenticated;
grant select on mc2_ac_cfg to anon; grant select, insert, update, delete on mc2_ac_cfg to authenticated;
drop policy if exists "ac c read" on mc2_ac_cfg; drop policy if exists "ac c admin" on mc2_ac_cfg;
create policy "ac c read" on mc2_ac_cfg for select to anon using (true);
create policy "ac c admin" on mc2_ac_cfg for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
insert into mc2_ac_cfg(key, value) values ('upload', 'true') on conflict do nothing;
create or replace function mc2_ac_upload_on() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from mc2_ac_cfg where key = 'upload'), true) $$;
grant execute on function mc2_ac_upload_on() to anon, authenticated;

-- ফাইল স্টোরেজ (সর্বোচ্চ ২৫ MB; OFF থাকলে সরাসরি আপলোডও বন্ধ; এক্সিকিউটেবল/HTML/SVG/JS নিষেধ)
insert into storage.buckets (id, name, public, file_size_limit) values ('mc2-chat', 'mc2-chat', true, 26214400)
  on conflict (id) do update set public = true, file_size_limit = 26214400;
drop policy if exists "ac up" on storage.objects;
create policy "ac up" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'mc2-chat' and mc2_ac_upload_on() and name ~ '^[0-9]+/[A-Za-z0-9._-]+$' and name !~* '\.(exe|bat|cmd|sh|apk|msi|js|mjs|html?|svg|php|jar|scr|com)$');

-- রিঅ্যাকশন, Seen
create table if not exists mc2_ac_reactions (message_id bigint not null references mc2_ac_messages(id) on delete cascade, voter text not null, emoji text not null check (char_length(emoji) between 1 and 16), primary key (message_id, voter));
create table if not exists mc2_ac_seen (session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, nick text, last_id bigint not null default 0, at timestamptz not null default now(), primary key (session_id, voter));
alter table mc2_ac_reactions enable row level security; alter table mc2_ac_seen enable row level security;
revoke all on mc2_ac_reactions, mc2_ac_seen from anon, authenticated;
grant select, delete on mc2_ac_reactions, mc2_ac_seen to authenticated;
drop policy if exists "ac r admin" on mc2_ac_reactions; drop policy if exists "ac se admin" on mc2_ac_seen;
create policy "ac r admin" on mc2_ac_reactions for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
create policy "ac se admin" on mc2_ac_seen for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- বার্তা পাঠানো (টেক্সট বা ফাইল, রিপ্লাইসহ)। ফল: id>0 সফল | 0 সেশন বন্ধ | -1 ভুল/খুব দ্রুত | -2 আপলোড বন্ধ
drop function if exists mc2_ac_send(int, text, text, text);
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

-- Delete for Everyone: নিজের বার্তা, ৫ মিনিটের মধ্যে (সার্ভার যাচাই করে)
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

-- রিঅ্যাকশন (একই ইমোজি আবার চাপলে সরে যায়)
create or replace function mc2_ac_react(p_msg bigint, p_voter text, p_emoji text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') = '' or char_length(coalesce(p_emoji, '')) not between 1 and 16 then return; end if;
  if not exists (select 1 from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id join mc2_ac_depts d on d.id = s.dept_id where m.id = p_msg and not m.hidden and not m.deleted and s.active and d.active) then return; end if;
  if exists (select 1 from mc2_ac_reactions where message_id = p_msg and voter = p_voter and emoji = p_emoji) then delete from mc2_ac_reactions where message_id = p_msg and voter = p_voter;
  else insert into mc2_ac_reactions(message_id, voter, emoji) values (p_msg, p_voter, p_emoji) on conflict (message_id, voter) do update set emoji = excluded.emoji; end if;
end $$;
grant execute on function mc2_ac_react(bigint, text, text) to anon, authenticated;

-- Seen
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

-- নাম Edit: আগের বার্তার নামও বদলায়
create or replace function mc2_ac_rename(p_voter text, p_nick text) returns void language plpgsql security definer set search_path = public as $$
declare n text := left(btrim(coalesce(p_nick, '')), 30);
begin
  if n = '' or coalesce(p_voter, '') = '' then return; end if;
  update mc2_ac_messages set nick = n where voter = p_voter and nick <> n;
  update mc2_ac_seen set nick = n where voter = p_voter;
end $$;
grant execute on function mc2_ac_rename(text, text) to anon, authenticated;

-- পোলিং: আপলোড চালু কিনা + প্রতি বার্তার রিঅ্যাকশন/Seen/মোছা/মালিক
create or replace function mc2_ac_meta(p_session int, p_min bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('up', mc2_ac_upload_on(), 'rows', coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', m.id, 'n', m.nick, 'd', m.deleted, 'o', m.voter = p_voter,
      'r', (select coalesce(jsonb_object_agg(e, c), '{}'::jsonb) from (select emoji e, count(*) c from mc2_ac_reactions r where r.message_id = m.id group by emoji) z),
      'm', (select emoji from mc2_ac_reactions r where r.message_id = m.id and r.voter = p_voter),
      's', (select count(*) from mc2_ac_seen s where s.session_id = m.session_id and s.last_id >= m.id and s.voter <> m.voter)) x
    from mc2_ac_messages m where m.session_id = p_session and m.id >= p_min and not m.hidden order by m.id desc limit 500) t), '[]'::jsonb)) $$;
grant execute on function mc2_ac_meta(int, bigint, text) to anon, authenticated;

-- শুরুর তালিকা: আগের চ্যাট গ্রুপের নাম থেকে বিভাগ, প্রতিটিতে ২০১৭-১৮ থেকে ২০২৫-২৬ সেশন (অ্যাডমিন প্যানেলে বদলানো যাবে)
insert into mc2_ac_depts(name, sort) select name, sort from mc2_chat_rooms where name <> 'ক্যাম্পাস লাউঞ্জ' on conflict do nothing;
insert into mc2_ac_sessions(dept_id, name, sort) select d.id, x.n, x.o from mc2_ac_depts d,
  (values ('২০১৭-১৮',1),('২০১৮-১৯',2),('২০১৯-২০',3),('২০২০-২১',4),('২০২১-২২',5),('২০২২-২৩',6),('২০২৩-২৪',7),('২০২৪-২৫',8),('২০২৫-২৬',9),('অ্যালামনাই',10)) as x(n, o)
  on conflict do nothing;

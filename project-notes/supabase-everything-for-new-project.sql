-- ⚠️ বাকি SQL: শেষের supabase-new-20261018j.sql অংশ (লিডারবোর্ড নিয়ন্ত্রণ + চ্যাটের ফাইল টাইপ) ও তার পরের supabase-new-20261018k.sql অংশ (ইউজারের অবস্থা: 📵 সাড়া পাওয়া যায়নি)। এর ওপরের সবই আগে চালানো।
-- ✅ এখন কোনো SQL বাকি নেই — সবই চালানো হয়ে গেছে (সর্বশেষ supabase-new-20261017c.sql-ও)। এই ফাইল শুধু নতুন Supabase প্রজেক্টের জন্য ব্যাকআপ/রেফারেন্স; চালু সাইটে আবার চালাতে হবে না।
-- (পুরোনো বর্ণনা:) MC Explorer — PENDING ALL SQL: সব SQL এই এক ফাইলেই আছে। অন্য কোনো SQL ফাইল লাগবে না। Supabase SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই।
-- আগে চালানো থাকতে হবে (আবার চালাবেন না): supabase-contest.sql, supabase-community.sql, supabase-titles.sql
-- এর ভেতরে যা আছে (ক্রম অনুযায়ী):
--   1) supabase-gallery.sql    — ছবির গ্যালারি, ক্যাটাগরি, স্বয়ংক্রিয় MCQ, কুইজ সেটিংস, উত্তর সংরক্ষণ, ড্যাশবোর্ড
--   2) supabase-anonchat.sql   — বেনামি চ্যাট: বিভাগ/সেশন, রিঅ্যাকশন, রিপ্লাই, Seen, নাম বদল, মোছা, ফাইল আপলোড
--   3) supabase-userinfo.sql   — User Info, অনলাইন স্ট্যাটাস, ভিজিটর তালিকা, Join/Leave ফিড
--   4) supabase-moderation.sql — রিপোর্ট, সতর্ক, ব্যান/Unban, Review, রেট লিমিট, ফাইল নিরাপত্তা, স্বয়ংক্রিয় মোছা
--   5) supabase-live-board.sql — টাইপিং ও Join/Leave লাইন, লিডারবোর্ড ফিল্টার
--   6) supabase-cards.sql      — কার্ড সংরক্ষণ, টপ ৩ কার্ড
--   7) supabase-additions.sql  — ছবির মূল ফাইলের নাম, চ্যাট-ফাইলের আলাদা মেয়াদ, Seen তালিকায় একই নামের ID
--   8) supabase-new-20261017c.sql — কাস্টম কার্ড সাইজ (card_cfg) + PNG KB সীমা ১০–১০,০০,০০০ (০ = আনলিমিটেড) [চালানো হয়েছে]


-- ================= supabase-gallery.sql =================
-- MC Explorer: ছবির গ্যালারি + ক্যাটাগরি + স্বয়ংক্রিয় MCQ + কুইজ সেটিংস + উত্তর সংরক্ষণ + ড্যাশবোর্ড
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run করুন। বারবার চালালেও সমস্যা নেই।
-- আগে চালানো থাকতে হবে: supabase-contest.sql, supabase-community.sql (mc2_admins, mc2_is_admin(), mc2_places এগুলো সেখানে বানানো)।

-- ---------- ক্যাটাগরি ----------
create table if not exists mc2_categories (
  name text primary key check (char_length(name) between 1 and 40),
  sort int not null default 100
);
alter table mc2_categories enable row level security;
revoke all on mc2_categories from anon, authenticated;
grant select on mc2_categories to anon;
grant select, insert, update, delete on mc2_categories to authenticated;
drop policy if exists "cat read" on mc2_categories; drop policy if exists "cat admin" on mc2_categories;
create policy "cat read" on mc2_categories for select to anon, authenticated using (true);
create policy "cat admin" on mc2_categories for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
insert into mc2_categories(name, sort) values
  ('ক্যাম্পাসের ভবন', 1), ('গেট ও প্রবেশপথ', 2), ('মিলনায়তন', 3), ('বিভাগ ও একাডেমিক', 4), ('খোলা জায়গা ও দৃশ্য', 5)
on conflict (name) do nothing;

-- ---------- ছবির টেবিলে নতুন কলাম ----------
alter table mc2_places add column if not exists category text references mc2_categories(name) on update cascade on delete set null;
alter table mc2_places add column if not exists updated_at timestamptz not null default now();
create index if not exists mc2_places_cat on mc2_places (category);

create or replace function mc2_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists t_mc2_places_touch on mc2_places;
create trigger t_mc2_places_touch before update on mc2_places for each row execute function mc2_touch();

-- ---------- কুইজ সেটিংস (অ্যাডমিন বদলাতে পারে, সবাই পড়তে পারে) ----------
create table if not exists mc2_settings (key text primary key check (char_length(key) <= 40), value jsonb not null);
alter table mc2_settings enable row level security;
revoke all on mc2_settings from anon, authenticated;
grant select on mc2_settings to anon;
grant select, insert, update, delete on mc2_settings to authenticated;
drop policy if exists "set read" on mc2_settings; drop policy if exists "set admin" on mc2_settings;
create policy "set read" on mc2_settings for select to anon, authenticated using (true);
create policy "set admin" on mc2_settings for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 100 and 5000) then raise exception 'png_max_kb must be 0 or 100..5000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

insert into mc2_settings(key, value) values ('quiz_count', '10'), ('quiz_categories', '[]'), ('wrong_options', '3'), ('png_max_kb', '0')
on conflict (key) do nothing;

-- ---------- স্বয়ংক্রিয় প্রশ্ন (প্রতিটি চালু ছবির জন্য একটি MCQ) ----------
-- সঠিক উত্তর = ছবির নাম। ভুল অপশন = আগে একই ক্যাটাগরির অন্য ছবির নাম (কাছাকাছি), কম পড়লে বাকি ক্যাটাগরি থেকে।
create table if not exists mc2_questions (
  place_id bigint primary key references mc2_places(id) on delete cascade,
  question text not null,
  correct text not null,
  wrong text[] not null,
  updated_at timestamptz not null default now()
);
alter table mc2_questions enable row level security;
revoke all on mc2_questions from anon, authenticated;
grant select on mc2_questions to anon, authenticated;
drop policy if exists "q read" on mc2_questions;
create policy "q read" on mc2_questions for select to anon, authenticated using (true);

create or replace function mc2_rebuild_questions() returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select least(greatest(coalesce((select (value #>> '{}')::int from mc2_settings where key = 'wrong_options'), 3), 3), 4) into n;
  delete from mc2_questions q where not exists (select 1 from mc2_places p where p.id = q.place_id and p.active);
  insert into mc2_questions(place_id, question, correct, wrong, updated_at)
  select p.id, 'এটা কোন জায়গা?', p.bn,
    coalesce((
      select array_agg(o.bn) from (
        select d.bn from (
          select distinct on (x.bn) x.bn, (x.category is not distinct from p.category) as sm, random() as r
          from mc2_places x where x.active and x.bn <> p.bn order by x.bn
        ) d order by d.sm desc, d.r limit n
      ) o
    ), '{}'), now()
  from mc2_places p where p.active
  on conflict (place_id) do update set question = excluded.question, correct = excluded.correct, wrong = excluded.wrong, updated_at = now();
end $$;
revoke all on function mc2_rebuild_questions() from public, anon, authenticated;

create or replace function mc2_trg_rebuild() returns trigger language plpgsql security definer set search_path = public as $$
begin perform mc2_rebuild_questions(); return null; end $$;
drop trigger if exists t_mc2_places_q on mc2_places;
drop trigger if exists t_mc2_places_q_i on mc2_places; drop trigger if exists t_mc2_places_q_u on mc2_places; drop trigger if exists t_mc2_places_q_d on mc2_places;
create trigger t_mc2_places_q_i after insert on mc2_places for each statement execute function mc2_trg_rebuild();
create trigger t_mc2_places_q_u after update on mc2_places for each statement execute function mc2_trg_rebuild();
create trigger t_mc2_places_q_d after delete on mc2_places for each statement execute function mc2_trg_rebuild();
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each statement execute function mc2_trg_rebuild();

-- অ্যাডমিন বাটন থেকে হাতে নতুন করে বানাতে
create or replace function mc2_admin_rebuild() returns int language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  perform mc2_rebuild_questions();
  select count(*) into c from mc2_questions;
  return c;
end $$;
revoke all on function mc2_admin_rebuild() from public, anon;
grant execute on function mc2_admin_rebuild() to authenticated;

-- ---------- আগের ১৩টি স্থির ছবি অ্যাডমিন প্যানেলে আনা (একবারই; ছবির ফাইল সাইটের images/places/ ফোল্ডারেই থাকে) ----------
insert into mc2_places(bn, en, img, category)
select v.bn, v.en, v.img, v.cat from (values
  ('কলা ভবন', 'Arts Building', 'images/places/kola1.jpg', 'ক্যাম্পাসের ভবন'),
  ('কলা ভবন', 'Arts Building', 'images/places/kola2.jpg', 'ক্যাম্পাসের ভবন'),
  ('ছাত্র মিলনায়তন', 'Students Auditorium', 'images/places/chatro.jpg', 'মিলনায়তন'),
  ('মেইন গেইট', 'Main Gate', 'images/places/gate1.jpg', 'গেট ও প্রবেশপথ'),
  ('একাডেমিক ভবন (নিউ)', 'New Academic Building', 'images/places/academic.jpg', 'বিভাগ ও একাডেমিক'),
  ('কেমিস্ট্রি বিভাগ', 'Chemistry Department', 'images/places/chem.jpg', 'বিভাগ ও একাডেমিক'),
  ('জারুলতলা', 'Jarul Tola', 'images/places/jarul.jpg', 'খোলা জায়গা ও দৃশ্য'),
  ('২য় গেইট', 'Second Gate', 'images/places/gate2.jpg', 'গেট ও প্রবেশপথ'),
  ('পাখির ভিউ', 'Bird''s Eye View', 'images/places/aerial.jpg', 'খোলা জায়গা ও দৃশ্য'),
  ('পাখির ভিউয়ে পুকুর', 'Pond Bird''s Eye View', 'images/places/pond.jpg', 'খোলা জায়গা ও দৃশ্য'),
  ('প্রশাসনিক ভবন', 'Administrative Building', 'images/places/admin.jpg', 'ক্যাম্পাসের ভবন'),
  ('কলেজ ম্যাপ', 'College Map', 'images/places/map.jpg', 'খোলা জায়গা ও দৃশ্য'),
  ('মোহনা মিলনায়তন', 'Mohona Auditorium', 'images/places/mohona.jpg', 'মিলনায়তন'),
  ('গ্রন্থাগার', 'Library', 'images/places/library.jpg', 'বিভাগ ও একাডেমিক')
) as v(bn, en, img, cat)
where not exists (select 1 from mc2_places p where p.img = v.img);

-- ---------- প্রতিটি উত্তরের রেকর্ড (সঠিক/ভুল সার্ভার নিজে যাচাই করে) ----------
create table if not exists mc2_answers (
  id bigint generated always as identity primary key,
  session text not null,
  device text not null,
  name text,
  place_id bigint references mc2_places(id) on delete set null,
  place_bn text,
  chosen text,
  correct_ans text,
  is_correct boolean not null,
  skipped boolean not null default false,
  ms int,
  pts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mc2_answers_s on mc2_answers (session);
create index if not exists mc2_answers_p on mc2_answers (place_id);
create index if not exists mc2_answers_t on mc2_answers (created_at desc);
alter table mc2_answers enable row level security;
revoke all on mc2_answers from anon, authenticated;
grant select, delete on mc2_answers to authenticated;
drop policy if exists "answers admin" on mc2_answers;
create policy "answers admin" on mc2_answers for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create or replace function mc2_submit_answers(p_session text, p_device text, p_name text, p_answers jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare a jsonb; q mc2_questions; ch text; ms int; ok boolean; sk boolean; pts int; cnt int := 0;
begin
  if char_length(coalesce(p_session, '')) not between 8 and 40 or char_length(coalesce(p_device, '')) not between 8 and 40
     or p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) not between 1 and 50 then return 'invalid'; end if;
  if exists (select 1 from mc2_answers where session = p_session) then return 'dup'; end if;
  if (select count(distinct session) from mc2_answers where device = p_device and created_at > now() - interval '1 hour') >= 20 then return 'slow'; end if;
  for a in select value from jsonb_array_elements(p_answers) loop
    select * into q from mc2_questions where place_id = nullif(a ->> 'pid', '')::bigint;
    if not found then continue; end if;
    ch := left(a ->> 'c', 120);
    sk := coalesce((a ->> 's')::boolean, false) or ch is null;
    ms := least(greatest(coalesce(round((a ->> 'ms')::numeric)::int, 0), 0), 600000);
    ok := (not sk) and ch = q.correct;
    pts := case when ok then greatest(5, 100 - 5 * floor(ms / 1000.0)::int) else 0 end;
    insert into mc2_answers(session, device, name, place_id, place_bn, chosen, correct_ans, is_correct, skipped, ms, pts)
    values (p_session, p_device, left(trim(coalesce(p_name, '')), 30), q.place_id, q.correct, case when sk then null else ch end, q.correct, ok, sk, ms, pts);
    cnt := cnt + 1;
  end loop;
  return case when cnt > 0 then 'ok' else 'invalid' end;
exception when others then return 'invalid';
end $$;
revoke all on function mc2_submit_answers(text, text, text, jsonb) from public;
grant execute on function mc2_submit_answers(text, text, text, jsonb) to anon, authenticated;

-- ---------- ড্যাশবোর্ড (শুধু অ্যাডমিন) ----------
create or replace function mc2_dash() returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'plays', (select count(*) from mc2_scores),
    'plays_today', (select count(*) from mc2_scores where created_at >= (date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka')),
    'avg_pct', (select coalesce(round(avg(pct)), 0)::int from mc2_scores),
    'visitors', (select count(distinct device) from mc2_visits),
    'places', (select count(*) from mc2_places),
    'active', (select count(*) from mc2_places where active),
    'questions', (select count(*) from mc2_questions),
    'answers', (select count(*) from mc2_answers),
    'correct', (select count(*) from mc2_answers where is_correct),
    'prize', (select count(*) from contest_entries),
    'days', (select coalesce(json_agg(json_build_object('d', t.d, 'n', t.n) order by t.d), '[]'::json) from (
        select (created_at at time zone 'Asia/Dhaka')::date as d, count(*) as n from mc2_scores
        where created_at > now() - interval '14 days' group by 1) t),
    'hard', (select coalesce(json_agg(json_build_object('bn', t.bn, 'n', t.n, 'pct', t.pct)), '[]'::json) from (
        select place_bn as bn, count(*) as n, round(100.0 * avg(is_correct::int))::int as pct from mc2_answers
        where place_bn is not null group by place_bn having count(*) >= 3 order by 3, 2 desc limit 8) t),
    'easy', (select coalesce(json_agg(json_build_object('bn', t.bn, 'n', t.n, 'pct', t.pct)), '[]'::json) from (
        select place_bn as bn, count(*) as n, round(100.0 * avg(is_correct::int))::int as pct from mc2_answers
        where place_bn is not null group by place_bn having count(*) >= 3 order by 3 desc, 2 desc limit 8) t),
    'cats', (select coalesce(json_agg(json_build_object('cat', t.cat, 'n', t.n, 'pct', t.pct)), '[]'::json) from (
        select coalesce(p.category, 'ক্যাটাগরিহীন') as cat, count(*) as n, round(100.0 * avg(a.is_correct::int))::int as pct
        from mc2_answers a join mc2_places p on p.id = a.place_id group by 1 order by 2 desc) t)
  );
end $$;
revoke all on function mc2_dash() from public, anon;
grant execute on function mc2_dash() to authenticated;

-- সব ঠিকঠাক চালু হলে প্রথমবার প্রশ্নগুলো এখনই তৈরি হয়ে যাক
select mc2_rebuild_questions();

-- ================= supabase-anonchat.sql =================
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

-- ================= supabase-userinfo.sql =================
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

-- ================= supabase-moderation.sql =================
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

-- ================= supabase-live-board.sql =================
-- MC Explorer — (ক) চ্যাটে Live Typing Indicator + Join/Leave System Message, (খ) লিডারবোর্ডের ফিল্টার/র‍্যাংক।
-- চালানোর ক্রম: supabase-moderation.sql-এর পরে (supabase-pending-all.sql-এ সবই ক্রমে আছে)। আবার চালালেও ক্ষতি নেই।

-- ========== (ক) লাইভ উপস্থিতি, টাইপিং, Join/Leave ==========
create table if not exists mc2_ac_here (
  session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, nick text,
  at timestamptz not null default now(), typing_at timestamptz, primary key (session_id, voter));
create table if not exists mc2_ac_events (
  id bigserial primary key, session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text,
  kind text not null check (kind in ('join', 'leave')), nick text, created_at timestamptz not null default now());
create index if not exists mc2_ac_events_s on mc2_ac_events (session_id, id desc);
alter table mc2_ac_here enable row level security; alter table mc2_ac_events enable row level security;
revoke all on mc2_ac_here, mc2_ac_events from anon, authenticated;

-- একটাই কল: নিজের হাজিরা + টাইপিং পাঠায়; ফেরত দেয় কারা টাইপ করছে ও নতুন Join/Leave।
-- p_after < 0 (প্রথমবার) = শুধু বর্তমান শেষ id নেয়, পুরোনো ইভেন্ট ফেরত দেয় না।
-- ৭৫ সেকেন্ড সাড়া না দিলে (ট্যাব বন্ধ/নেট নেই) সবার পোলিংয়ের সময় নিজে থেকে "Leave" ধরা হয়।
create or replace function mc2_ac_live(p_session int, p_voter text, p_nick text, p_typing boolean default false, p_after bigint default -1) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v text := coalesce(p_voter, ''); nk text := coalesce(nullif(mc2_ac_clean(p_nick, 30), ''), 'বেনামি'); h record; last bigint; ty jsonb; ev jsonb;
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' then return jsonb_build_object('err', 1); end if;
  if not exists (select 1 from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active) then return jsonb_build_object('err', 2); end if;
  if not mc2_ac_rl('live:v:' || v || ':60', 90, 60) then return jsonb_build_object('err', 3); end if;
  if mc2_ac_block(v) is null then
    with gone as (delete from mc2_ac_here where session_id = p_session and voter <> v and at < now() - interval '75 seconds' returning voter, nick)
      insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
    select * into h from mc2_ac_here where session_id = p_session and voter = v;
    if not found or h.at < now() - interval '75 seconds' then insert into mc2_ac_events(session_id, voter, kind, nick) values (p_session, v, 'join', nk); end if;
    insert into mc2_ac_here(session_id, voter, nick, at, typing_at) values (p_session, v, nk, now(), case when p_typing then now() end)
    on conflict (session_id, voter) do update set nick = excluded.nick, at = now(), typing_at = case when p_typing then now() end;
  end if;
  if p_after is null or p_after < 0 then
    select coalesce(max(id), 0) into last from mc2_ac_events where session_id = p_session; ev := '[]'::jsonb;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'k', e.kind, 'n', e.nick, 't', (extract(epoch from e.created_at) * 1000)::bigint, 'o', e.voter = v) order by e.id), '[]'::jsonb), coalesce(max(e.id), p_after)
      into ev, last from (select * from mc2_ac_events where session_id = p_session and id > p_after order by id limit 30) e;
  end if;
  select coalesce(jsonb_agg(x.nick order by x.typing_at), '[]'::jsonb) into ty
    from (select nick, typing_at from mc2_ac_here where session_id = p_session and voter <> v and typing_at > now() - interval '5 seconds' order by typing_at limit 10) x;
  return jsonb_build_object('last', last, 'ev', ev, 'ty', ty);
end $$;
grant execute on function mc2_ac_live(int, text, text, boolean, bigint) to anon, authenticated;

-- ঘর ছাড়লে সাথে সাথে Leave
create or replace function mc2_ac_leave(p_session int, p_voter text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' or not mc2_ac_rl('leave:v:' || p_voter || ':60', 30, 60) then return; end if;
  with gone as (delete from mc2_ac_here where session_id = p_session and voter = p_voter returning voter, nick)
    insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
end $$;
grant execute on function mc2_ac_leave(int, text) to anon, authenticated;

-- পুরোনো ইভেন্ট/হাজিরা পরিষ্কার (মোছার টিক-এর সাথে চলে)
create or replace function mc2_ac_purge_live() returns void language sql security definer set search_path = public as $$
  delete from mc2_ac_events where created_at < now() - interval '1 day';
  delete from mc2_ac_here where at < now() - interval '1 day' $$;
revoke all on function mc2_ac_purge_live() from public, anon, authenticated;
create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); perform mc2_ac_purge_live(); end if; end $$;
grant execute on function mc2_ac_tick() to anon, authenticated;

-- ========== (খ) লিডারবোর্ড: সব ফলাফল স্থায়ীভাবে mc2_scores-এ (প্রতিটি খেলা, স্বয়ংক্রিয় মোছার আওতার বাইরে); ফিল্টার + র‍্যাংক সার্ভারে ==========
create index if not exists mc2_scores_dept on mc2_scores (dept);
create index if not exists mc2_scores_batch on mc2_scores (batch);
create index if not exists mc2_scores_score on mc2_scores (score desc);

-- p_mode 'best' = প্রত্যেকের (নাম+বিভাগ+সেশন) সেরা ফল; 'all' = সব খেলা। র‍্যাংক = ফিল্টার করা তালিকার ভেতরে (সমান স্কোরে সমান র‍্যাংক)।
-- ফিল্টার: বিভাগ, সেশন, তারিখ (p_from <= সময় < p_to), নাম খোঁজা। ভুল = মোট প্রশ্ন − সঠিক। আইপি/ডিভাইস কখনো ফেরত যায় না।
create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
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
grant execute on function mc2_board(text, text, timestamptz, timestamptz, text, text, int, int) to anon, authenticated;

-- ===================== supabase-cards.sql (কার্ড সংরক্ষণ + সেরা ৩) =====================
-- MC Explorer — ইউজারের কার্ড সংরক্ষণ (অ্যাডমিনের জন্য ছোট নমুনা) + লিডারবোর্ডের টপ ৩ কার্ড/ছবি।
-- চালানোর ক্রম: supabase-live-board.sql-এর পরে (supabase-pending-all.sql-এর শেষে যোগ করা আছে)। আবার চালালেও ক্ষতি নেই।
--
-- কীভাবে কম জায়গা নেয়, অথচ ডাউনলোডে ফুল কোয়ালিটি:
--   থাকে: (১) ছোট প্রিভিউ JPEG (~৩০–৫০ KB), (২) ছোট বর্গাকার ছবি (~৩০–৫০ KB, ঐচ্ছিক), (৩) কার্ড আঁকার ছোট্ট তথ্য (rec, কয়েক শ বাইট)।
--   ডাউনলোডের সময় অ্যাডমিন পেজ ওই তথ্য আর ছবি থেকে ১০৮০×১৪০০ কার্ড ও ১০৮০×১৯২০ স্টোরি আবার আঁকে — ইউজার যে কার্ড ডাউনলোড করে হুবহু সেটাই।

create table if not exists mc2_cards (
  id bigint generated always as identity primary key,
  device text not null,
  name text not null, dept text not null, batch text,
  score int not null, pct int not null, ok int, total int,
  rec jsonb not null,
  thumb text not null,
  photo text,
  show boolean not null default true,   -- false = লিডারবোর্ডের টপ ৩-এ ছবি দেখানো হবে না (অ্যাডমিন লুকালে)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists mc2_cards_u on mc2_cards (device, lower(name));
create index if not exists mc2_cards_s on mc2_cards (score desc);
create index if not exists mc2_cards_t on mc2_cards (updated_at desc);
alter table mc2_cards enable row level security;
revoke all on mc2_cards from anon, authenticated;
grant select, update, delete on mc2_cards to authenticated;
drop policy if exists "admin cards" on mc2_cards;
create policy "admin cards" on mc2_cards for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- কার্ড সেভ: স্কোর সত্যিই mc2_scores-এ আছে কি না মিলিয়ে দেখে (ভুয়া স্কোরে কার্ড/টপ ৩ হবে না)।
-- প্রতি (ডিভাইস + নাম)-এ একটাই কার্ড; নতুন স্কোর আগের চেয়ে কম হলে পুরোনো সেরা কার্ড থাকে, সমান/বেশি হলে বদলায়।
create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - interval '2 seconds' then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= 20 then return 'slow'; end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  return 'ok';
end $$;
grant execute on function mc2_card_save(text, text, text, text, int, jsonb, text, text) to anon, authenticated;

-- লিডারবোর্ডের টপ ৩ (ফিল্টার একই: বিভাগ, সেশন, তারিখ; প্রত্যেকের সেরা ফল)। কার্ড/ছবি থাকলে সাথে আসে।
-- পাবলিকে যায়: নাম, বিভাগ, সেশন, স্কোর, সঠিক/মোট, কার্ড আঁকার তথ্য, ছবি (শুধু অ্যাডমিন লুকিয়ে না রাখলে)। ডিভাইস/আইপি কখনো না।
create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x where x.device = t.device and lower(x.name) = lower(t.name) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;
grant execute on function mc2_top_cards(text, text, timestamptz, timestamptz) to anon, authenticated;


-- ========== (সংযোজন) supabase-additions.sql ==========
-- MC Explorer — সংযোজন (2026-10-17): ছবির মূল ফাইলের নাম, চ্যাট-ফাইলের আলাদা মেয়াদ (ডিফল্ট ১ দিন, অ্যাডমিন বদলাতে পারে),
-- Seen তালিকায় একই নামের ইউজার আলাদা করা। আগে চালানো থাকতে হবে: gallery, anonchat, userinfo, moderation (মোছা অংশ), live-board। ফাইলটি idempotent।

-- ১) ছবির মূল ফাইলের নাম (Display Name = bn আলাদা থাকে)
alter table mc2_places add column if not exists orig_name text;

-- ২) চ্যাটের ফাইল/অ্যাটাচমেন্টের আলাদা মেয়াদ। মিনিটে; ০ = কখনো না। ডিফল্ট ১৪৪০ (১ দিন)।
alter table mc2_ac_messages add column if not exists file_expired boolean not null default false;
grant select (file_expired) on mc2_ac_messages to anon;
insert into mc2_ac_cfg(key, value) values ('file_keep_min', '1440') on conflict do nothing;

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440);
        fd int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440);
        n int; paths text[]; fp text[];
begin
  -- বার্তার মেয়াদ (সেশন অনুযায়ী বা ডিফল্ট)
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id
    where coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s
    where s.id = m.session_id and coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  get diagnostics n = row_count;
  -- শুধু ফাইলের মেয়াদ: বার্তা থাকে, ফাইল মুছে "ফাইলের মেয়াদ শেষ" দেখায়
  if fd > 0 then
    select coalesce(array_agg(file_path), '{}') into fp from mc2_ac_messages where file_path is not null and created_at < now() - make_interval(mins => fd);
    update mc2_ac_messages set file_path = null, file_expired = true where file_path is not null and created_at < now() - make_interval(mins => fd);
    paths := paths || fp;
  end if;
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'file_default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.name as dept, s.name, s.keep_min, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

create or replace function mc2_ac_admin_file_keep(p_min int) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  if p_min is null or p_min < 0 or p_min > 525600 then raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন'; end if;
  insert into mc2_ac_cfg(key, value) values ('file_keep_min', to_jsonb(p_min)) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_log(null, 'keep_set', 'ফাইল ডিফল্ট = ' || p_min || ' মিনিট', null, a);
end $$;

-- ৩) Seen তালিকা: একই নামের একাধিক ইউজার থাকলে নামের পাশে তাদের আলাদা ID দেখায়
create or replace function mc2_ac_seenlist(p_msg bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(z.n order by z.at), '[]'::jsonb) from (
    select case when count(*) over (partition by lower(s.nick)) > 1 then s.nick || ' (' || mc2_uid(s.voter) || ')' else s.nick end as n, s.at
    from mc2_ac_seen s join mc2_ac_messages m on m.session_id = s.session_id
    where m.id = p_msg and s.last_id >= m.id and s.voter <> m.voter) z $$;
grant execute on function mc2_ac_seenlist(bigint) to anon, authenticated;

-- অ্যাডমিন RPC-র অনুমতি আবার বসানো (নতুন ফাংশনসহ)
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

-- ================= supabase-ui-settings.sql =================
-- MC Explorer: হোম / নিয়ম-পপআপ / ফল-কার্ডের বাটন অন-অফ সেটিংস (ছোট ফাইল — এটা একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql চালানো থাকতে হবে (mc2_settings টেবিল সেখানে; সাইট ওটা পাবলিকলি পড়তে পারে, শুধু অ্যাডমিন লিখতে পারে)।
-- কী করে: mc2_settings-এ নতুন key 'ui_cfg' (JSON: {"off":["চাবি",...]}) সেভ করার অনুমতি দেয়, আর এই key সেভ করলে
-- কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে তা ঠিক করে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 100 and 5000) then raise exception 'png_max_kb must be 0 or 100..5000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- আগে: যেকোনো সেটিংস সেভে প্রশ্ন নতুন করে বানাত। এখন: 'ui_cfg' বাদে বাকি key-র জন্য আগের মতোই।
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key <> 'ui_cfg') execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('ui_cfg', '{"off":[]}') on conflict (key) do nothing;

-- ================= supabase-new-20261017c.sql =================
-- MC Explorer: কার্ড PNG-এর KB ইচ্ছামতো (১০–১০,০০,০০০ KB; ০ = আনলিমিটেড) + কাস্টম কার্ড সাইজ (চওড়া×উচ্চতা) সেটিংস (ছোট ফাইল — একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql ও supabase-ui-settings.sql চালানো থাকতে হবে (সেগুলো চালানোই আছে)।
-- কী করে: (১) 'png_max_kb'-এর সীমা ১০০–৫০০০ থেকে বাড়িয়ে ১০–১০,০০,০০০ করে (০ = আনলিমিটেড);
--          (২) mc2_settings-এ নতুন key 'card_cfg' ({"on":bool,"w":..,"h":..,"sw":..,"sh":..}) সেভ করার অনুমতি দেয় (১০০–৮০০০ px);
--          (৩) 'card_cfg' সেভ করলে কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg')) execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('card_cfg', '{"on":false,"w":1080,"h":1400,"sw":1080,"sh":1920}') on conflict (key) do nothing;
-- NEW SQL (2026-10-18): লটারি ফোল্ডার (হোমে অন/অফ, ফেসবুক ফোল্ডার, বিজয়ীর চাবি) + ভেরিফাই/বাদ ফ্ল্যাগ
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-new-20261017.sql (mc2_draws, mc2_is_admin())।

alter table mc2_draws add column if not exists home boolean not null default false;      -- হোমে দেখাবে কি না (ডিফল্ট অফ)
alter table mc2_draws add column if not exists fb boolean not null default false;        -- ফেসবুক ফোল্ডার
alter table mc2_draws add column if not exists fbnames jsonb not null default '[]'::jsonb; -- ফেসবুক ফোল্ডারের নাম (শুধু অ্যাডমিন)
alter table mc2_draws add column if not exists wkeys jsonb not null default '[]'::jsonb;   -- বিজয়ীর চাবি (শুধু অ্যাডমিন; একবার জিতলে আর ওঠে না)
alter table mc2_draws add column if not exists srcs jsonb not null default '[]'::jsonb;    -- কোন কোন লিস্ট থেকে এসেছে

create table if not exists mc2_entry_flags (
  k text primary key,
  st text not null check (st in ('ok', 'no', 'ex')),   -- ok = ভেরিফাইড, no = নট ভেরিফাইড, ex = লটারি থেকে বাদ
  at timestamptz not null default now()
);
alter table mc2_entry_flags enable row level security;   -- সরাসরি পড়া/লেখা বন্ধ; শুধু নিচের ফাংশন

create or replace function mc2_txt_arr(p jsonb, p_max int) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(to_jsonb(left(trim(e), 90))), '[]'::jsonb)
  from (select e from jsonb_array_elements_text(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) e
        where length(trim(e)) > 0 limit p_max) q
$$;

-- সেভ (আগের ফাংশন বদলে নতুন ফিল্ডসহ)
create or replace function mc2_draw_save(p jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; t text; k text; w jsonb; fn jsonb; wk jsonb; sr jsonb; hm boolean; fbb boolean;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  t := left(trim(coalesce(p ->> 'title', '')), 120);
  if length(t) < 2 then raise exception 'title needed'; end if;
  k := case when p ->> 'kind' in ('week', 'month', 'custom') then p ->> 'kind' else 'week' end;
  w := mc2_draw_clean(p -> 'winners');
  if jsonb_array_length(w) > 100000 then raise exception 'too many'; end if;
  fn := mc2_draw_clean(p -> 'fbnames');
  if jsonb_array_length(fn) > 100000 then raise exception 'too many'; end if;
  wk := mc2_txt_arr(p -> 'wkeys', 200000);
  sr := mc2_txt_arr(p -> 'srcs', 500);
  hm := coalesce((p ->> 'home')::boolean, false);
  fbb := coalesce((p ->> 'fb')::boolean, false);
  if (p ->> 'id') ~ '^\d+$' and exists (select 1 from mc2_draws where id = (p ->> 'id')::bigint) then
    update mc2_draws set title = t, kind = k, draw_date = coalesce(nullif(p ->> 'date', '')::date, draw_date),
      descr = nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''), source = left(coalesce(p ->> 'source', ''), 120),
      winners = w, show = coalesce((p ->> 'show')::boolean, true), home = hm, fb = fbb, fbnames = fn, wkeys = wk, srcs = sr
    where id = (p ->> 'id')::bigint returning id into v;
  else
    insert into mc2_draws (title, kind, draw_date, descr, source, winners, show, home, fb, fbnames, wkeys, srcs)
    values (t, k, coalesce(nullif(p ->> 'date', '')::date, current_date), nullif(left(trim(coalesce(p ->> 'descr', '')), 2000), ''),
      left(coalesce(p ->> 'source', ''), 120), w, coalesce((p ->> 'show')::boolean, true), hm, fbb, fn, wk, sr) returning id into v;
  end if;
  return v;
end $$;

-- হোমে দেখানোর সুইচ (প্রতিটি ফোল্ডারের আলাদা)
create or replace function mc2_draw_home_set(p_id bigint, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if; update mc2_draws set home = coalesce(p_on, false) where id = p_id; end $$;

-- পাবলিক: হোমে যেসব ফোল্ডার অন (মাস্টার সুইচ অফ থাকলে কিছুই দেয় না); শুধু নিরাপদ ফিল্ড, কোনো চাবি/ফেসবুক-নাম নয়
create or replace function mc2_draws_home() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare on_ boolean; r jsonb;
begin
  select coalesce((select v from mc2_draw_cfg where k = 'show'), '1') = '1' into on_;
  if not on_ then return jsonb_build_object('on', false, 'rows', '[]'::jsonb); end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into r from (
    select id, draw_date, kind, title, descr, winners from mc2_draws
    where home and jsonb_array_length(winners) > 0 order by draw_date desc, id desc limit 12) x;
  return jsonb_build_object('on', true, 'rows', r);
end $$;

-- ভেরিফাই / বাদ ফ্ল্যাগ
create or replace function mc2_dlist_save(p_id bigint, p_name text, p_items jsonb) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; it jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(trim(coalesce(p_name, ''))) < 1 then raise exception 'name needed'; end if;
  select coalesce(jsonb_agg(to_jsonb(left(trim(e), 90))), '[]'::jsonb) into it
    from jsonb_array_elements_text(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) e where length(trim(e)) > 0;
  if jsonb_array_length(it) > 100000 then raise exception 'too many'; end if;
  if p_id is not null and exists (select 1 from mc2_dlists where id = p_id) then
    update mc2_dlists set name = left(trim(p_name), 80), items = it where id = p_id returning id into v;
  else insert into mc2_dlists (name, items) values (left(trim(p_name), 80), it) returning id into v; end if;
  return v;
end $$;

create or replace function mc2_flag_all() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_object_agg(k, st) from mc2_entry_flags), '{}'::jsonb); end $$;
create or replace function mc2_flag_set(p_k text, p_st text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_k, '')) < 3 or length(p_k) > 120 then raise exception 'bad key'; end if;
  if p_st is null or p_st = '' then delete from mc2_entry_flags where k = p_k; return; end if;
  if p_st not in ('ok', 'no', 'ex') then raise exception 'bad status'; end if;
  insert into mc2_entry_flags (k, st) values (p_k, p_st) on conflict (k) do update set st = excluded.st, at = now();
end $$;

revoke all on function mc2_txt_arr(jsonb, int), mc2_draw_save(jsonb), mc2_draw_home_set(bigint, boolean), mc2_draws_home(), mc2_flag_all(), mc2_flag_set(text, text) from public, anon;
grant execute on function mc2_draws_home() to anon, authenticated;
grant execute on function mc2_draw_save(jsonb), mc2_draw_home_set(bigint, boolean), mc2_flag_all(), mc2_flag_set(text, text) to authenticated;

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; missing ফাঁকা এলে সব ঠিক):
-- select n as missing from unnest(array['mc2_draw_save','mc2_draw_home_set','mc2_draws_home','mc2_flag_all','mc2_flag_set','mc2_txt_arr']) n where not exists (select 1 from pg_proc where proname = n);


-- ================= supabase-new-20261018j.sql (PENDING) =================
-- NEW SQL (2026-10-18 j): কাজ ৩ লিডারবোর্ড নিয়ন্ত্রণ + কাজ ৫ চ্যাটের কাস্টম ফাইল টাইপ/MB
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই। এই SQL চালানোর আগেও সাইট আগের মতো চলে।
-- আগে চালানো থাকতে হবে: সব আগের SQL (চালানোই আছে)।
-- ক) mc2_scores.hidden + board_cfg {board_on} + mc2_board/mc2_top_cards (hidden বাদ, বন্ধ থাকলে খালি) + অ্যাডমিন RPC।
-- খ) mc2_ac_cfg key 'ftypes' = {"ext":[ধরন, মাইম, সর্বোচ্চ MB, চালু?]}; mc2_ac_ftypes() এখান থেকে পড়ে, না থাকলে ডিফল্ট তালিকা।
-- device/IP পাবলিক ফাংশনে কখনো বেরোয় না।

alter table mc2_scores add column if not exists hidden boolean not null default false;
create index if not exists mc2_scores_hidden on mc2_scores (hidden) where hidden;

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 500 then raise exception 'wrong_options must be 1..500'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  elsif new.key = 'home_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'home_cfg must be an object'; end if;
  elsif new.key = 'board_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 1000 then raise exception 'board_cfg must be an object'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;

drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg', 'home_cfg', 'board_cfg')) execute function mc2_trg_rebuild();

create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('total', 0, 'rows', '[]'::jsonb, 'depts', '[]'::jsonb, 'batches', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
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

create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('rows', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
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

-- ===== অ্যাডমিন: লিডারবোর্ড এন্ট্রি তালিকা/এডিট/হাইড/ডিলিট/ছবি (সবগুলো mc2_is_admin() ছাড়া চলে না) =====
create or replace function mc2_board_admin_list(p_q text default null, p_dept text default null, p_batch text default null, p_state text default 'all', p_limit int default 50, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); lim int := least(greatest(coalesce(p_limit, 50), 1), 200); res jsonb; tot int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  select count(*) into tot from mc2_scores s where (q is null or s.name ilike '%' || q || '%') and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
    and (p_state = 'all' or (p_state = 'hidden' and s.hidden) or (p_state = 'shown' and not s.hidden));
  select coalesce(jsonb_agg(r order by r.sc desc, r.id), '[]'::jsonb) into res from (
    select s.id, s.name, s.dept, s.batch, s.score as sc, s.ok, s.total, s.hidden, (extract(epoch from s.created_at) * 1000)::bigint as ts,
      exists (select 1 from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)) as has_card,
      coalesce((select bool_or(c.photo is not null) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), false) as has_photo,
      coalesce((select bool_and(c.show) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), true) as photo_show
    from mc2_scores s where (q is null or s.name ilike '%' || q || '%') and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_state = 'all' or (p_state = 'hidden' and s.hidden) or (p_state = 'shown' and not s.hidden))
    order by s.score desc, s.id offset greatest(coalesce(p_offset, 0), 0) limit lim) r;
  return jsonb_build_object('total', tot, 'rows', res);
end $$;

create or replace function mc2_board_admin_edit(p_id bigint, p_name text, p_dept text, p_batch text, p_score int) returns text
language plpgsql security definer set search_path = public as $$
declare o mc2_scores%rowtype; nm text := trim(coalesce(p_name, ''));
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  select * into o from mc2_scores where id = p_id; if not found then return 'missing'; end if;
  if char_length(nm) not between 1 and 30 or char_length(coalesce(p_dept, '')) not between 1 and 60 or p_score not between 0 and 1000 or char_length(coalesce(p_batch, '')) > 40 then return 'invalid'; end if;
  update mc2_scores set name = nm, dept = p_dept, batch = nullif(trim(coalesce(p_batch, '')), ''), score = p_score, pct = round(p_score / 10.0)::int where id = p_id;
  if lower(o.name) <> lower(nm) or o.name <> nm then
    begin update mc2_cards set name = nm where device = o.device and lower(name) = lower(o.name);
    exception when unique_violation then null; end;
  end if;
  return 'ok';
end $$;

create or replace function mc2_board_admin_hide(p_ids bigint[], p_hide boolean) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  update mc2_scores set hidden = coalesce(p_hide, true) where id = any(coalesce(p_ids, '{}'));
  get diagnostics n = row_count; return n;
end $$;

create or replace function mc2_board_admin_delete(p_ids bigint[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  delete from mc2_scores where id = any(coalesce(p_ids, '{}'));
  get diagnostics n = row_count; return n;
end $$;

-- p_mode: 'hide' = সেরা ৩-এ ছবি লুকানো; 'show' = আবার দেখানো; 'remove' = ছবি মুছে ফেলা
create or replace function mc2_board_admin_photo(p_ids bigint[], p_mode text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if p_mode not in ('hide', 'show', 'remove') then return 0; end if;
  update mc2_cards c set show = case p_mode when 'hide' then false when 'show' then true else c.show end, photo = case when p_mode = 'remove' then null else c.photo end
    from mc2_scores s where s.id = any(coalesce(p_ids, '{}')) and c.device = s.device and lower(c.name) = lower(s.name);
  get diagnostics n = row_count; return n;
end $$;

-- ===== চ্যাটের ফাইল টাইপ: ডিফল্ট + ডাটাবেজ (mc2_ac_cfg key 'ftypes') =====
create or replace function mc2_ac_ftypes_default() returns jsonb language sql immutable as $$ select '{
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
create or replace function mc2_ac_ftypes() returns jsonb language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from mc2_ac_cfg where key = 'ftypes' and jsonb_typeof(value) = 'object')
    then coalesce((select jsonb_object_agg(e.key, e.value) from mc2_ac_cfg c, jsonb_each(c.value) e where c.key = 'ftypes' and jsonb_typeof(c.value) = 'object' and coalesce(e.value ->> 3, 'true') <> 'false'), '{}'::jsonb)
    else mc2_ac_ftypes_default() end $$;
grant execute on function mc2_ac_ftypes() to anon, authenticated;
grant execute on function mc2_ac_ftypes_default() to anon, authenticated;

-- বাকেটের সীমা চালু টাইপগুলো থেকে (সর্বোচ্চ MB ও সব মাইম)
create or replace function mc2_ac_apply_bucket() returns void language plpgsql security definer set search_path = public as $$
declare ft jsonb := mc2_ac_ftypes(); mx bigint; mt text[];
begin
  select coalesce(max((v ->> 2)::numeric), 25)::bigint * 1048576 into mx from jsonb_each(ft) e(k, v);
  select array_agg(distinct v ->> 1) into mt from jsonb_each(ft) e(k, v);
  begin update storage.buckets set public = true, file_size_limit = mx, allowed_mime_types = mt where id = 'mc2-chat';
  exception when undefined_column then update storage.buckets set public = true, file_size_limit = mx where id = 'mc2-chat'; end;
end $$;

create or replace function mc2_ac_ftypes_admin() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  return coalesce((select value from mc2_ac_cfg where key = 'ftypes' and jsonb_typeof(value) = 'object'), mc2_ac_ftypes_default());
end $$;

create or replace function mc2_ac_ftypes_set(p_list jsonb) returns text language plpgsql security definer set search_path = public as $$
declare e record; n int := 0;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if p_list is null or jsonb_typeof(p_list) <> 'object' or pg_column_size(p_list) > 20000 then return 'invalid'; end if;
  for e in select key, value from jsonb_each(p_list) loop
    n := n + 1;
    if e.key !~ '^[a-z0-9]{1,5}$' or e.key in ('html', 'htm', 'svg', 'js', 'xhtml', 'xml', 'php', 'mjs') then return 'bad_ext:' || e.key; end if;
    if jsonb_typeof(e.value) <> 'array' or jsonb_array_length(e.value) < 3 then return 'bad_row:' || e.key; end if;
    if (e.value ->> 0) not in ('image', 'video', 'audio', 'file') then return 'bad_kind:' || e.key; end if;
    if (e.value ->> 1) !~ '^[a-z0-9.+-]+/[a-z0-9.+_-]+$' or char_length(e.value ->> 1) > 100 or (e.value ->> 1) in ('text/html', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/xhtml+xml') then return 'bad_mime:' || e.key; end if;
    if jsonb_typeof(e.value -> 2) <> 'number' or (e.value ->> 2)::numeric not between 1 and 5000 then return 'bad_mb:' || e.key; end if;
  end loop;
  if n > 200 then return 'too_many'; end if;
  insert into mc2_ac_cfg(key, value) values ('ftypes', p_list) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_apply_bucket();
  return 'ok';
end $$;
grant execute on function mc2_board_admin_list(text, text, text, text, int, int), mc2_board_admin_edit(bigint, text, text, text, int), mc2_board_admin_hide(bigint[], boolean), mc2_board_admin_delete(bigint[]), mc2_board_admin_photo(bigint[], text),
  mc2_ac_ftypes_admin(), mc2_ac_ftypes_set(jsonb), mc2_ac_apply_bucket() to authenticated;
select mc2_ac_apply_bucket();

-- নাম-চেক: সবগুলো true এলে ঠিক
select 'hidden column' as name, exists (select 1 from information_schema.columns where table_name = 'mc2_scores' and column_name = 'hidden') as ok
union all select 'board fn has hidden', (select prosrc like '%hidden%' and prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_board' limit 1)
union all select 'top fn has hidden', (select prosrc like '%hidden%' and prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_top_cards' limit 1)
union all select 'check fn has board_cfg', (select prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_settings_check' limit 1)
union all select 'admin rpcs', (select count(*) = 8 from pg_proc where proname in ('mc2_board_admin_list', 'mc2_board_admin_edit', 'mc2_board_admin_hide', 'mc2_board_admin_delete', 'mc2_board_admin_photo', 'mc2_ac_ftypes_admin', 'mc2_ac_ftypes_set', 'mc2_ac_apply_bucket'))
union all select 'ftypes reads cfg', (select prosrc like '%ftypes%' from pg_proc where proname = 'mc2_ac_ftypes' limit 1);


-- ================= supabase-new-20261018k.sql (PENDING) ==========
-- NEW SQL (2026-10-18 k): ইউজারের অবস্থা ৪টা — নতুন 📵 "সাড়া পাওয়া যায়নি" (মান 'nr')
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। পুরোনো ফ্ল্যাগের ডেটা (ok / no / ex) একটুও বদলায় না। আবার চালালেও সমস্যা নেই।
-- আগে চালানো থাকতে হবে: supabase-new-20261018.sql (mc2_entry_flags, mc2_flag_set) — আগেই চালানো আছে।
-- না চালানো পর্যন্ত সাইট আগের মতোই চলে; শুধু 📵 বাছলে "নতুন SQL চালান" বার্তা আসে।

do $$
declare c record;
begin
  -- আগের check (st in ok/no/ex) সরিয়ে ৪ মানের নতুন check; নামে 'ex' আছে এমন check-ই সরে (নিজের আগের চালানোও)
  for c in select conname from pg_constraint
           where conrelid = 'public.mc2_entry_flags'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%''ex''%'
  loop
    execute format('alter table public.mc2_entry_flags drop constraint %I', c.conname);
  end loop;
  alter table public.mc2_entry_flags add constraint mc2_entry_flags_st_chk check (st in ('ok', 'no', 'ex', 'nr'));
end $$;

create or replace function mc2_flag_set(p_k text, p_st text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_k, '')) < 3 or length(p_k) > 120 then raise exception 'bad key'; end if;
  if p_st is null or p_st = '' then delete from mc2_entry_flags where k = p_k; return; end if;
  if p_st not in ('ok', 'no', 'ex', 'nr') then raise exception 'bad status'; end if;   -- ok = ভেরিফাইড, no = নন-ভেরিফাইড, ex = বাদ, nr = সাড়া পাওয়া যায়নি
  insert into mc2_entry_flags (k, st) values (p_k, p_st) on conflict (k) do update set st = excluded.st, at = now();
end $$;
revoke all on function mc2_flag_set(text, text) from public, anon;
grant execute on function mc2_flag_set(text, text) to authenticated;

-- নাম-চেক: দুটো সারিতেই ok = true এলে ঠিক
select 'mc2_entry_flags check (nr)' as item, exists (select 1 from pg_constraint where conrelid = 'public.mc2_entry_flags'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%''nr''%') as ok
union all
select 'mc2_flag_set (nr)', exists (select 1 from pg_proc where proname = 'mc2_flag_set' and prosrc like '%''nr''%');


-- ================= supabase-new-20261018l.sql =================
-- NEW SQL (2026-10-18 l): নতুন অটো ফোল্ডারের নাম আটকানো — mc2_ufolders.name check-এ '🎮 খেলেছে' ও '🎮🎁 খেলেছে + ফর্ম জমা' যোগ
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। আবার চালালেও সমস্যা নেই। আগের কোনো ফোল্ডার/ডেটা বদলায় না।
-- আগে চালানো থাকতে হবে: supabase-new-20261018g.sql (mc2_ufolders) — আগেই চালানো আছে।
-- না চালানো পর্যন্ত সাইট আগের মতোই চলে (শুধু ডাটাবেজে এই ৪ নামে নতুন কাস্টম ফোল্ডার আটকাবে না; অ্যাডমিন প্যানেল নিজেই আগে থেকে এই নামগুলো আটকায়)।
-- NOT VALID = শুধু নতুন/বদলানো সারিতে নিয়ম খাটে; আগে থেকে থাকা কোনো ফোল্ডারের নাম এই ৪টার একটা হলেও ALTER ব্যর্থ হয় না।

do $$
declare c record;
begin
  -- আগের name-check সরানো (যার ভেতরে '👥 সব ইউজার' আছে — নিজের আগের চালানোও), তারপর ৪ নামের নতুন check
  for c in select conname from pg_constraint
           where conrelid = 'public.mc2_ufolders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%সব ইউজার%'
  loop
    execute format('alter table public.mc2_ufolders drop constraint %I', c.conname);
  end loop;
  alter table public.mc2_ufolders add constraint mc2_ufolders_name_chk
    check (char_length(btrim(name)) between 1 and 80 and btrim(name) not in ('👥 সব ইউজার', '🎁 ফর্ম জমা', '🎮 খেলেছে', '🎮🎁 খেলেছে + ফর্ম জমা')) not valid;
end $$;

-- নাম-চেক: ok = true এলে ঠিক
select 'mc2_ufolders name check (৪টা অটো নাম)' as item,
  exists (select 1 from pg_constraint where conrelid = 'public.mc2_ufolders'::regclass and contype = 'c'
          and pg_get_constraintdef(oid) like '%সব ইউজার%' and pg_get_constraintdef(oid) like '%ফর্ম জমা%' and pg_get_constraintdef(oid) like '%খেলেছে%') as ok;

-- ===== supabase-new-20261019.sql (নতুন, এখনো চালানো হয়নি) =====
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


-- ===== supabase-new-20261020b.sql =====
-- supabase-new-20261020b.sql — পার্ট ৫: স্ক্রিনশট ও বিন (একবার Run; আগে ব্যাকআপ; ...19c ও ...20 আগে চালানো থাকতে হবে)
-- ১) Storage চাপে স্ক্রিনশট মোছা বন্ধ (mc2_cleanup_stage থেকে 'sshot' ধাপ বাদ; mc2_shot_stage এখন কিছুই মোছে না)।
-- ২) শুধু Verified স্ক্রিনশট, যাচাইয়ের shot_ok_days (ডিফল্ট ৭) দিন পর মুছবে। shot_no_days এখন আর কাজ করে না।
--    অবস্থা (mc2_entry_flags.st): ok=Verified | no=Unverified | কোনো ফ্ল্যাগ নেই=Pending | ex/nr/অন্য=Unknown।
--    ফ্ল্যাগের চাবি অ্যাডমিন অ্যাপের মতোই: device থাকলে 'd:'||device, নইলে 'n:'||lower(trim(name)); একটাই চাবি দেখা হয়।
-- ৩) বিন: মেয়াদ bin_days (ডিফল্ট ৩০); bin_days = ০ বা অটো-ক্লিন বন্ধ থাকলে বিন কখনো নিজে খালি হয় না (চাপের ধাপেও না)।

create or replace function mc2_shot_status(p_dev text, p_name text) returns text language sql stable security definer set search_path = public as $$
  select case coalesce((select f.st from mc2_entry_flags f
                         where f.k = case when nullif(trim(coalesce(p_dev, '')), '') is not null then 'd:' || p_dev else 'n:' || lower(trim(coalesce(p_name, ''))) end), '')
    when 'ok' then 'verified' when 'no' then 'unverified' when '' then 'pending' else 'unknown' end $$;

create or replace function mc2_shot_ok_at(p_dev text, p_name text) returns timestamptz language sql stable security definer set search_path = public as $$
  select f.at from mc2_entry_flags f
   where f.st = 'ok' and f.k = case when nullif(trim(coalesce(p_dev, '')), '') is not null then 'd:' || p_dev else 'n:' || lower(trim(coalesce(p_name, ''))) end $$;
create or replace function mc2_shot_ok(p_dev text, p_name text) returns boolean language sql stable security definer set search_path = public as $$
  select mc2_shot_status(p_dev, p_name) = 'verified' $$;
revoke all on function mc2_shot_status(text, text), mc2_shot_ok_at(text, text), mc2_shot_ok(text, text) from public, anon, authenticated;

-- জায়গার চাপে কখনো স্ক্রিনশট মোছে না
create or replace function mc2_shot_stage(p_lim int, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
begin o_bytes := 0; o_n := 0; end $$;
revoke all on function mc2_shot_stage(int) from public, anon, authenticated;

create or replace function mc2_cleanup_stage(p_stage text, p_lim int, p_c jsonb, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
declare t record; bb bigint; nn int; paths text[]; ca int := coalesce((p_c ->> 'card_min_days')::int, 0);
begin
  o_bytes := 0; o_n := 0;
  perform set_config('mc2.nobin', 'on', true);
  if p_stage = 'bin' and coalesce((p_c ->> 'bin_days')::int, 0) <= 0 then null;  -- বিন OFF (০ দিন): চাপেও বিন খালি হবে না
  elsif p_stage = 'bin' then
    with d as (delete from mc2_bin where id in (select id from mc2_bin order by deleted_at limit p_lim) returning bytes) select coalesce(sum(bytes), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'chat' then
    with d as (delete from mc2_ac_messages where id in (select id from mc2_ac_messages order by id limit p_lim) returning file_path, pg_column_size(mc2_ac_messages.*) b)
      select coalesce(sum(b), 0), count(*), coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into o_bytes, o_n, paths from d;
    if array_length(paths, 1) > 0 then
      begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'mc2-chat' and name = any (paths); exception when others then null; end;
    end if;
  elsif p_stage = 'extra' then
    with d as (delete from mc2_cards where id in (select x.id from (select id, pinned, updated_at, row_number() over (partition by device order by updated_at desc) rn from mc2_cards) x where x.rn > 5 and not x.pinned order by x.updated_at limit p_lim) returning pg_column_size(mc2_cards.*) b)
      select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'low' then
    for t in select * from (values ('mc2_visits', 'created_at'), ('mc2_answers', 'created_at'), ('mc2_presence', 'last_seen')) v(tbl, col) loop
      execute format('with d as (delete from %I where ctid = any(array(select ctid from %I order by %I limit %s)) returning pg_column_size(%I.*) b) select coalesce(sum(b), 0), count(*) from d', t.tbl, t.tbl, t.col, p_lim, t.tbl) into bb, nn;
      o_bytes := o_bytes + bb; o_n := o_n + nn; exit when o_n > 0;
    end loop;
  elsif p_stage = 'cards' then
    with d as (delete from mc2_cards where id in (select x.id from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3 and x.updated_at < now() - make_interval(days => ca) order by x.updated_at limit p_lim) returning pg_column_size(mc2_cards.*) b)
      select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'schat' then
    begin
      perform set_config('storage.allow_delete_query', 'true', true);
      with d as (delete from storage.objects where id in (select id from storage.objects where bucket_id = 'mc2-chat' order by created_at limit p_lim) returning coalesce((metadata ->> 'size')::bigint, 0) b) select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
    exception when others then o_bytes := 0; o_n := 0; end;
  end if;
  perform set_config('mc2.nobin', '', true);
end $$;

-- শুধু Verified: যাচাইয়ের shot_ok_days দিন পর ছবির ফাইল মোছে (লগ-সারি থাকে, shot_url = 'deleted')। Unverified/Unknown/Pending কখনো নয়।
create or replace function mc2_shot_purge() returns int language plpgsql security definer set search_path = public as $$
declare ok int := coalesce((mc2_cleanup_cfg_get() ->> 'shot_ok_days')::int, 7); ids bigint[]; n int := 0;
begin
  if ok > 0 then
    select coalesce(array_agg(x.id), '{}') into ids from (
      select e.id from contest_entries e
       where e.shot_url like '%/object/public/contest/%' and mc2_shot_status(e.device, e.name) = 'verified'
         and mc2_shot_ok_at(e.device, e.name) < now() - make_interval(days => ok) limit 200) x;
    if array_length(ids, 1) > 0 then perform mc2_shot_remove(ids); n := array_length(ids, 1); end if;
  end if;
  if n > 0 then insert into mc2_cleanup_log(what, n, note) values ('shots', n, 'verified+' || ok || 'd'); end if;
  return n;
end $$;
revoke all on function mc2_shot_purge() from public, anon, authenticated;

-- বিন: OFF (bin_days = 0) বা অটো-ক্লিন বন্ধ থাকলে কিছুই মোছে না
create or replace function mc2_bin_sweep() returns int language plpgsql security definer set search_path = public as $$
declare d int := mc2_lim('bin_days'); n int := 0;
begin
  if not coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true) then return 0; end if;
  if d > 0 then delete from mc2_bin where deleted_at < now() - make_interval(days => d); get diagnostics n = row_count; end if;
  return n;
end $$;
revoke all on function mc2_bin_sweep() from public, anon, authenticated;

-- সেভ করা পুরোনো shot_no_days সরানো (এটা এখন অব্যবহৃত)
update mc2_cleanup_cfg set cfg = cfg - 'shot_no_days' where id = 1;

select 'ok' as result, (select count(*) from contest_entries where shot_url like '%/object/public/contest/%') as shots_left;


-- ================= supabase-new-20261020c.sql =================
-- supabase-new-20261020c.sql — টপ ৩-এর স্থায়ী ইতিহাস (একবার Run; আবার চালালেও ক্ষতি নেই)
-- আগে ...19, ...19b, ...19c চালানো থাকতে হবে (mc2_cards.pinned লাগে)। কোনো পুরোনো ফাংশন/টেবিল বদলায় না; mc2_card_save-ও না।
-- টপ = mc2_cards-এ স্কোর অনুযায়ী ১–৩ নম্বর (সমান স্কোরে একই Rank; pinned-এর নিয়মের মতোই)।
-- ১) mc2_top_hist: প্রতি কার্ডে একটা সারি — কার্ড ID, মালিক ID (device), প্রথম টপে যাওয়ার সময়/স্কোর, মোট কতবার টপে এসেছে, সর্বোচ্চ ও বর্তমান Rank (বর্তমান NULL = এখন টপে নেই)।
-- ২) mc2_top_log: প্রতিটি ঘটনা — enter (টপে ঢোকা, তারিখ+স্কোরসহ) / change (Rank বদল: আগের→পরের) / leave (টপ থেকে নামা)।
-- ৩) কার্ড সেভ/স্কোর বদল/মোছায় ট্রিগার নিজে ইতিহাস হালনাগাদ করে; ইতিহাসে ভুল হলেও কার্ড সেভ আটকায় না।
-- ৪) কার্ড মুছে গেলেও ইতিহাস থাকে (কার্ডের সাথে সংযোগ-নিষেধ নেই)। অটো-ক্লিনআপ এই দুই টেবিল ছোঁয় না।

create table if not exists mc2_top_hist (
  card_id bigint primary key,
  device text not null,
  name text,
  first_top_at timestamptz not null default now(),
  first_score int,
  times_in_top int not null default 1 check (times_in_top >= 1),
  best_rank smallint check (best_rank between 1 and 3),
  cur_rank smallint check (cur_rank between 1 and 3),
  last_top_at timestamptz not null default now(),
  last_score int,
  updated_at timestamptz not null default now()
);
create index if not exists mc2_top_hist_dev on mc2_top_hist (device);
create index if not exists mc2_top_hist_first on mc2_top_hist (first_top_at desc);
create index if not exists mc2_top_hist_cur on mc2_top_hist (cur_rank) where cur_rank is not null;

create table if not exists mc2_top_log (
  id bigint generated always as identity primary key,
  card_id bigint not null,
  device text not null,
  name text,
  kind text not null check (kind in ('enter', 'change', 'leave')),
  old_rank smallint,
  new_rank smallint,
  score int,
  at timestamptz not null default now(),
  note text
);
create index if not exists mc2_top_log_card on mc2_top_log (card_id, at desc);
create index if not exists mc2_top_log_dev on mc2_top_log (device, at desc);
create index if not exists mc2_top_log_at on mc2_top_log (at desc);

alter table mc2_top_hist enable row level security;
alter table mc2_top_log enable row level security;
revoke all on mc2_top_hist, mc2_top_log from anon, authenticated;
grant select on mc2_top_hist, mc2_top_log to authenticated;
drop policy if exists "admin top hist" on mc2_top_hist;
create policy "admin top hist" on mc2_top_hist for select to authenticated using (mc2_is_admin());
drop policy if exists "admin top log" on mc2_top_log;
create policy "admin top log" on mc2_top_log for select to authenticated using (mc2_is_admin());

-- বর্তমান টপ ৩ মিলিয়ে ইতিহাস হালনাগাদ। ফেরত: কতটা ঘটনা লেখা হলো। p_backfill = true হলে সময় = কার্ডের updated_at (শুধু প্রথমবারের ভরাটে)।
create or replace function mc2_top_sync(p_backfill boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare r record; h record; n int := 0; ids bigint[] := '{}'; ts timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('mc2_top_sync'));
  for r in select t.id, t.device, t.name, t.score, t.rk::int as rk, t.updated_at
             from (select c.id, c.device, c.name, c.score, c.updated_at, rank() over (order by c.score desc) as rk from mc2_cards c) t
            where t.rk <= 3 order by t.rk, t.id loop
    ids := ids || r.id;
    ts := case when p_backfill then r.updated_at else now() end;
    select * into h from mc2_top_hist where card_id = r.id;
    if not found then
      insert into mc2_top_hist(card_id, device, name, first_top_at, first_score, best_rank, cur_rank, last_top_at, last_score)
      values (r.id, r.device, r.name, ts, r.score, r.rk, r.rk, ts, r.score);
      insert into mc2_top_log(card_id, device, name, kind, new_rank, score, at, note)
      values (r.id, r.device, r.name, 'enter', r.rk, r.score, ts, case when p_backfill then 'backfill' end);
      n := n + 1;
    elsif h.cur_rank is null then
      update mc2_top_hist set times_in_top = times_in_top + 1, cur_rank = r.rk, best_rank = least(coalesce(best_rank, r.rk), r.rk),
        last_top_at = ts, last_score = r.score, name = r.name, updated_at = now() where card_id = r.id;
      insert into mc2_top_log(card_id, device, name, kind, new_rank, score, at) values (r.id, r.device, r.name, 'enter', r.rk, r.score, ts);
      n := n + 1;
    elsif h.cur_rank <> r.rk then
      update mc2_top_hist set cur_rank = r.rk, best_rank = least(coalesce(best_rank, r.rk), r.rk), last_score = r.score, name = r.name, updated_at = now() where card_id = r.id;
      insert into mc2_top_log(card_id, device, name, kind, old_rank, new_rank, score, at) values (r.id, r.device, r.name, 'change', h.cur_rank, r.rk, r.score, ts);
      n := n + 1;
    elsif h.last_score is distinct from r.score then
      update mc2_top_hist set last_score = r.score, updated_at = now() where card_id = r.id;  -- Rank একই, শুধু স্কোর বেড়েছে: লগ নয়
    end if;
  end loop;
  for h in select * from mc2_top_hist where cur_rank is not null and card_id <> all (ids) loop
    update mc2_top_hist set cur_rank = null, updated_at = now() where card_id = h.card_id;
    insert into mc2_top_log(card_id, device, name, kind, old_rank, score, note)
    select h.card_id, h.device, h.name, 'leave', h.cur_rank, coalesce((select x.score from mc2_cards x where x.id = h.card_id), h.last_score),
           case when exists (select 1 from mc2_cards x where x.id = h.card_id) then null else 'card deleted' end;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function mc2_top_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform mc2_top_sync(false); exception when others then null; end;
  return null;
end $$;
revoke all on function mc2_top_sync(boolean), mc2_top_trg() from public, anon, authenticated;

drop trigger if exists mc2_cards_topsync on mc2_cards;
create trigger mc2_cards_topsync after insert or delete or update of score on mc2_cards for each statement execute function mc2_top_trg();

-- একবারের ভরাট (ইতিহাস খালি থাকলেই): এখনকার টপ ৩ + আগে pinned হওয়া কার্ড। আগের সঠিক সময়/Rank জানা নেই, তাই updated_at ও স্কোর ধরা হয় এবং লগে note = backfill।
do $$
begin
  if not exists (select 1 from mc2_top_hist) then
    perform mc2_top_sync(true);
    insert into mc2_top_hist(card_id, device, name, first_top_at, first_score, last_top_at, last_score)
    select c.id, c.device, c.name, c.updated_at, c.score, c.updated_at, c.score from mc2_cards c where c.pinned
    on conflict (card_id) do nothing;
    insert into mc2_top_log(card_id, device, name, kind, score, at, note)
    select h.card_id, h.device, h.name, 'enter', h.first_score, h.first_top_at, 'backfill: আগের Rank জানা নেই'
      from mc2_top_hist h where h.best_rank is null and not exists (select 1 from mc2_top_log l where l.card_id = h.card_id);
  end if;
end $$;

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select 'mc2_top_hist' as item, to_regclass('public.mc2_top_hist') is not null as ok
union all select 'mc2_top_log', to_regclass('public.mc2_top_log') is not null
union all select '৬টা ইনডেক্স', (select count(*) = 6 from pg_indexes where schemaname = 'public'
  and indexname in ('mc2_top_hist_dev', 'mc2_top_hist_first', 'mc2_top_hist_cur', 'mc2_top_log_card', 'mc2_top_log_dev', 'mc2_top_log_at'))
union all select 'mc2_top_sync', exists (select 1 from pg_proc where proname = 'mc2_top_sync')
union all select 'ট্রিগার mc2_cards_topsync', exists (select 1 from pg_trigger where tgname = 'mc2_cards_topsync' and not tgisinternal);

-- ============ supabase-new-20261117.sql — কার্ড প্রিভিউ (লিডারবোর্ড, সেরা ৩-এর নিচে) ============


-- লিডারবোর্ড: সেরা ৩-এর নিচের যেকোনো ইউজারের কার্ড প্রিভিউ (র‍্যাংক হিস্টরি জানালার "🪪 কার্ড দেখো" বাটন)
-- Supabase > SQL Editor-এ একবার চালান। আগের কিছু বদলায় না; শুধু একটা নতুন ফাংশন যোগ হয়। আবার চালালেও ক্ষতি নেই।
-- নিরাপত্তা (ফাংশনের ভেতরেই বাঁধা):
--   • একবারে একজনের কার্ড (নাম + বিভাগ + সেশন দিয়ে) — বাল্কে তালিকা টানা যায় না।
--   • ছবি কখনো ফেরত আসে না; ডিভাইস আইডি/আইপি/ফোন কিছুই না। শুধু কার্ডে যা ছাপা থাকে (ফিল্ড-তালিকা নিচে)।
--   • ডাটাবেসে কিছুই লেখে না (আইপি-সীমার সারিও না): ১ লাখ প্রিভিউতেও ডাটাবেস স্টোরেজ বাড়ে ০ বাইট। ঘনঘন চাপা ঠেকানো ফোনের ভেতরে (cards.js) হয়।
--   • অ্যাডমিনের সুইচ: mc2_settings key 'board_cfg' এর peek_on (না থাকলে = চালু)। লিডারবোর্ড বন্ধ থাকলেও বন্ধ।
create or replace function mc2_card_peek(p_name text, p_dept text, p_batch text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare nm text := left(trim(coalesce(p_name, '')), 200); bt text := coalesce(p_batch, ''); cfg jsonb; r jsonb;
begin
  select value into cfg from mc2_settings where key = 'board_cfg';
  if coalesce((cfg ->> 'board_on')::boolean, true) = false or coalesce((cfg ->> 'peek_on')::boolean, true) = false then
    return jsonb_build_object('on', false);
  end if;
  if nm = '' then return jsonb_build_object('on', true, 'rec', null); end if;
  select (select jsonb_object_agg(e.key, e.value) from jsonb_each(x.rec) e
          where e.key in ('name', 'dept', 'batch', 'club', 'pct', 'score', 'ok', 'total', 'title', 'bestPlace', 'ts', 'drank', 'rank', 'site', 'lg', 'lgo'))
    into r
  from mc2_cards x
  where (lower(x.name) = lower(nm) or lower(coalesce(x.rec ->> 'name', '')) = lower(nm))
    and (x.dept = p_dept or coalesce(x.rec ->> 'dept', '') = p_dept)
    and (coalesce(x.batch, '') = bt or coalesce(x.rec ->> 'batch', '') = bt)
  order by x.score desc, x.updated_at desc limit 1;
  return jsonb_build_object('on', true, 'rec', r);
end $$;
grant execute on function mc2_card_peek(text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';

-- চেক: ok = true এলে ঠিক আছে
select 'mc2_card_peek ফাংশন' as item, to_regprocedure('mc2_card_peek(text,text,text)') is not null as ok;


-- লোগো আপলোড ঠিক করা (২০২৬-১১-১৮): সেটিং-চেকার (mc2_settings_check) এতদিন 'logo_cfg' ও 'logo_img_<নম্বর>' চাবি ঢুকতে দিত না ("unknown setting"),
-- তাই অ্যাডমিন > 🖼️ লোগো থেকে আপলোড হচ্ছিল না। এই SQL ওই দুই চাবি খুলে দেয়; আর সব চাবি আগের মতোই (হুবহু আগের নিয়ম)।
-- Supabase > SQL Editor-এ একবার চালান। আবার চালালেও ক্ষতি নেই।
--   logo_cfg      = ছোট সেটিং অবজেক্ট (সর্বোচ্চ ৬০০০ বাইট)
--   logo_img_<n>  = {"d": "data:image/png|jpeg|webp;base64,..."} (সর্বোচ্চ ১,৬০,০০০ অক্ষর; অ্যাডমিন পাতা নিজে ~১,০০,০০০-এর নিচে রাখে)

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 500 then raise exception 'wrong_options must be 1..500'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  elsif new.key = 'home_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'home_cfg must be an object'; end if;
  elsif new.key = 'board_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 1000 then raise exception 'board_cfg must be an object'; end if;
  elsif new.key = 'logo_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 6000 then raise exception 'logo_cfg must be an object (<= 6000 bytes)'; end if;
  elsif new.key ~ '^logo_img_[0-9]{1,4}$' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'd') is distinct from 'string'
       or (new.value ->> 'd') !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'
       or length(new.value ->> 'd') > 160000 then
      raise exception 'logo_img must be {"d":"data:image/(png|jpeg|webp);base64,..."} up to 160000 chars';
    end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;

drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

notify pgrst, 'reload schema';

-- চেক: দুটোই ok = true এলে ঠিক আছে
select 'সেটিং-চেকারে লোগো চাবি' as item, pg_get_functiondef('mc2_settings_check()'::regprocedure) like '%logo_img_%' as ok;

-- ===== supabase-new-20261123.sql (বিজয়ী কার্ড; নতুন প্রজেক্টে সবশেষে চালান) =====
-- ২০২৬-১১-২৩ — বিজয়ী প্রতি কার্ড-বাছাই (শুধু ছোট কোড/নম্বর; কোনো ছবি সার্ভারে জমে না)
-- Supabase > SQL Editor-এ একবার Run করুন। আগে চালানো থাকতে হবে: supabase-new-20261017.sql (mc2_draws, mc2_draw_clean)।
-- নিরাপদ: আবার চালালেও কিছু ভাঙে না। নতুন টেবিল নেই, নতুন ছবি-জমা নেই।
--
-- প্রতি বিজয়ীর সাথে (mc2_draws.winners jsonb) দুটো নতুন ছোট ফিল্ড:
--   cv = কোন কার্ড দেখাবে: 'b' দুটোই | 'w' শুধু বিজয়ী কার্ড | 's1' নেভি মেডালিয়ন | 's2' সবুজ উইনার | 's3' গ্লাস রিং | (ফাঁকা = অটো = দুটোই)
--   pd = বিজয়ী কার্ডের ডিজাইন-নম্বর ০–১৯ (২০টি ডিজাইনের মধ্যে কোনটা)
-- কার্ড আঁকা হয় ইউজারের ফোনেই। বিজয়ীর স্কোর কার্ডে ছবি থাকলে সেটাই (আগে থেকে জমা ছবি, নতুন জমা নয়) বিজয়ী কার্ডে বসে — mc2_winner_photo। পুরোনো বিজয়ীদের (cv/pd নেই) আগের মতোই চলে।
-- পাবলিক RPC (mc2_draws_public / mc2_draws_home) আগের মতোই winners ফেরত দেয়; এই ফাংশন শুধু নিরাপদ ফিল্ডই রাখে,
-- তাই device / contact / wkeys / fbnames / প্রাইজ নোট কখনো পাবলিকে যায় না।

create or replace function mc2_draw_clean(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', left(trim(w ->> 'name'), 80),
      'dept', left(coalesce(w ->> 'dept', ''), 80),
      'batch', left(coalesce(w ->> 'batch', ''), 40),
      'rank', case when (w ->> 'rank') ~ '^\d{1,6}$' then (w ->> 'rank')::int end,
      'score', case when (w ->> 'score') ~ '^\d{1,6}$' then (w ->> 'score')::int end,
      'note', left(coalesce(w ->> 'note', ''), 200))
    || case when w ->> 'cv' in ('w', 'b', 's1', 's2', 's3') then jsonb_build_object('cv', w ->> 'cv') else '{}'::jsonb end
    || case when (w ->> 'pd') ~ '^\d{1,2}$' and (w ->> 'pd')::int between 0 and 19 then jsonb_build_object('pd', (w ->> 'pd')::int) else '{}'::jsonb end
  ), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) w
  where length(trim(coalesce(w ->> 'name', ''))) > 0
$$;

-- পরিষ্কার: আগের (বাতিল) সংস্করণে সার্ভারে কার্ডের ছবি জমানোর যে টেবিল/ফাংশন ছিল, চালানো থাকলে সরিয়ে দেয়। না থাকলে কিছু হয় না।
drop function if exists mc2_wcard_set(bigint, text, text);
drop function if exists mc2_wcard_del(bigint, text);
drop function if exists mc2_wcard_get(bigint, text);
drop table if exists mc2_wcards;
drop function if exists mc2_wkey(jsonb);

-- বিজয়ীদের তালিকার কার্ডের নিজস্ব সুইচ: mc2_settings key 'board_cfg'-এর win_on (না থাকলে = চালু)। লিডারবোর্ডের সুইচ (board_on / peek_on) থেকে আলাদা —
-- লিডারবোর্ড বন্ধ থাকলেও বিজয়ী তালিকার কার্ড চলবে, উল্টোটাও। অ্যাডমিন > লিডারবোর্ড ট্যাবে সুইচ আছে।
-- ১) mc2_card_peek-এ ঐচ্ছিক ৪র্থ আর্গুমেন্ট p_src: 'w' = বিজয়ী তালিকা থেকে (তখন শুধু win_on দেখে, এবং শুধু পাবলিক ঘোষণার বিজয়ীর কার্ডই দেয়)। বাকি সব আগের মতো।
drop function if exists mc2_card_peek(text, text, text);
create or replace function mc2_card_peek(p_name text, p_dept text, p_batch text, p_src text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare nm text := left(trim(coalesce(p_name, '')), 200); bt text := coalesce(p_batch, ''); cfg jsonb; r jsonb;
begin
  select value into cfg from mc2_settings where key = 'board_cfg';
  if p_src = 'w' then
    if coalesce((cfg ->> 'win_on')::boolean, true) = false or coalesce((select v from mc2_draw_cfg where k = 'show'), '1') <> '1' then return jsonb_build_object('on', false); end if;
    if not exists (select 1 from mc2_draws d, jsonb_array_elements(d.winners) e(v)
                   where d.show and lower(trim(e.v ->> 'name')) = lower(nm) and coalesce(e.v ->> 'dept', '') = coalesce(p_dept, '') and coalesce(e.v ->> 'batch', '') = bt) then
      return jsonb_build_object('on', true, 'rec', null);
    end if;
  elsif coalesce((cfg ->> 'board_on')::boolean, true) = false or coalesce((cfg ->> 'peek_on')::boolean, true) = false then
    return jsonb_build_object('on', false);
  end if;
  if nm = '' then return jsonb_build_object('on', true, 'rec', null); end if;
  select (select jsonb_object_agg(e.key, e.value) from jsonb_each(x.rec) e
          where e.key in ('name', 'dept', 'batch', 'club', 'pct', 'score', 'ok', 'total', 'title', 'bestPlace', 'ts', 'drank', 'rank', 'site', 'lg', 'lgo'))
    into r
  from mc2_cards x
  where (lower(x.name) = lower(nm) or lower(coalesce(x.rec ->> 'name', '')) = lower(nm))
    and (x.dept = p_dept or coalesce(x.rec ->> 'dept', '') = p_dept)
    and (coalesce(x.batch, '') = bt or coalesce(x.rec ->> 'batch', '') = bt)
  order by x.score desc, x.updated_at desc limit 1;
  return jsonb_build_object('on', true, 'rec', r);
end $$;
grant execute on function mc2_card_peek(text, text, text, text) to anon, authenticated;

-- ২) বিজয়ীর নিজের ছবি (যদি তার স্কোর কার্ডে ছবি দেওয়া থাকে)। নতুন কিছু জমা হয় না: আগে থেকে mc2_cards.photo-তে থাকা ছবিটাই ফেরত দেয়, কিছু লেখে না।
-- নিরাপত্তা: শুধু পাবলিক (show) ঘোষণার বিজয়ীর জন্য, একবারে একজন; বিজয়ী-পাতা বা win_on বন্ধ থাকলে কিছু দেয় না। কার্ডের "ছবি দেখানো" (show) বন্ধ করা থাকলে ছবি দেয় না (অ্যাডমিন যাঁর ছবি লুকিয়েছেন)।
-- মেলানো: নাম+বিভাগ+সেশন; না মিললে নাম+বিভাগ দিয়ে (সেশন বানান ভিন্ন থাকলেও যেন ছবি আসে)। জেপিইজি/পিএনজি/ওয়েবপি সবই চলে।
create or replace function mc2_winner_photo(p_draw bigint, p_name text, p_dept text, p_batch text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text; nm text := lower(trim(coalesce(p_name, ''))); bt text := coalesce(p_batch, ''); dp text := coalesce(p_dept, '');
begin
  if nm = '' then return null; end if;
  if coalesce((select (value ->> 'win_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return null; end if;
  if coalesce((select v from mc2_draw_cfg where k = 'show'), '1') <> '1' then return null; end if;
  if not exists (select 1 from mc2_draws d, jsonb_array_elements(d.winners) e(v)
                 where d.id = p_draw and d.show and lower(trim(e.v ->> 'name')) = nm
                   and coalesce(e.v ->> 'dept', '') = dp and coalesce(e.v ->> 'batch', '') = bt) then return null; end if;
  select x.photo into r from mc2_cards x
   where x.show and x.photo ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$'
     and (lower(x.name) = nm or lower(coalesce(x.rec ->> 'name', '')) = nm)
     and (x.dept = dp or coalesce(x.rec ->> 'dept', '') = dp)
   order by (coalesce(x.batch, '') = bt or coalesce(x.rec ->> 'batch', '') = bt) desc, x.score desc, x.updated_at desc limit 1;
  return r;
end $$;
revoke all on function mc2_winner_photo(bigint, text, text, text) from public;
grant execute on function mc2_winner_photo(bigint, text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';

-- চেক (দুটোই true এলে ঠিক আছে):
select to_regprocedure('mc2_winner_photo(bigint,text,text,text)') is not null as photo_fn_ok, to_regprocedure('mc2_card_peek(text,text,text,text)') is not null as peek_fn_ok;


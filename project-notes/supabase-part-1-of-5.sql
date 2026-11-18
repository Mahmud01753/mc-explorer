-- MC Explorer pending SQL, অংশ 1/5। সব অংশ ক্রমে একটার পর একটা চালান। আবার চালালেও ক্ষতি নেই।
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

alter table mc2_places add column if not exists category text references mc2_categories(name) on update cascade on delete set null;
alter table mc2_places add column if not exists updated_at timestamptz not null default now();
create index if not exists mc2_places_cat on mc2_places (category);

create or replace function mc2_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists t_mc2_places_touch on mc2_places;
create trigger t_mc2_places_touch before update on mc2_places for each row execute function mc2_touch();

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

select mc2_rebuild_questions();

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

insert into storage.buckets (id, name, public, file_size_limit) values ('mc2-chat', 'mc2-chat', true, 26214400)
  on conflict (id) do update set public = true, file_size_limit = 26214400;
drop policy if exists "ac up" on storage.objects;
create policy "ac up" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'mc2-chat' and mc2_ac_upload_on() and name ~ '^[0-9]+/[A-Za-z0-9._-]+$' and name !~* '\.(exe|bat|cmd|sh|apk|msi|js|mjs|html?|svg|php|jar|scr|com)$');

create table if not exists mc2_ac_reactions (message_id bigint not null references mc2_ac_messages(id) on delete cascade, voter text not null, emoji text not null check (char_length(emoji) between 1 and 16), primary key (message_id, voter));
create table if not exists mc2_ac_seen (session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, nick text, last_id bigint not null default 0, at timestamptz not null default now(), primary key (session_id, voter));
alter table mc2_ac_reactions enable row level security; alter table mc2_ac_seen enable row level security;
revoke all on mc2_ac_reactions, mc2_ac_seen from anon, authenticated;
grant select, delete on mc2_ac_reactions, mc2_ac_seen to authenticated;
drop policy if exists "ac r admin" on mc2_ac_reactions; drop policy if exists "ac se admin" on mc2_ac_seen;
create policy "ac r admin" on mc2_ac_reactions for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
create policy "ac se admin" on mc2_ac_seen for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

drop function if exists mc2_ac_send(int, text, text, text);

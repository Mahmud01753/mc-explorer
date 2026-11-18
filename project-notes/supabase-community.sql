-- MC Explorer: চ্যাট, সবার লিডারবোর্ড, ভিজিটর লগ, অ্যাডমিন প্যানেল, নতুন ছবি (Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run)
-- আগে supabase-contest.sql চালান (এই ফাইল সেটার টেবিলও ব্যবহার করে)। বারবার চালালেও সমস্যা নেই।
-- অ্যাডমিন বানাতে: Supabase > Authentication > Users > Add user (ইমেইল + পাসওয়ার্ড, "Auto Confirm User" টিক দিন)।
-- তারপর নিচের লাইনটি আপনার ইমেইল দিয়ে একবার চালান (ছোট হাতের অক্ষরে):
--   insert into mc2_admins(email) values ('আপনার-ইমেইল@example.com');
-- ভালো হবে: Authentication > Providers > Email-এ "Allow new users to sign up" বন্ধ করুন।

-- ---------- অ্যাডমিন ----------
create table if not exists mc2_admins (email text primary key check (email = lower(email)));
alter table mc2_admins enable row level security;
revoke all on mc2_admins from anon, authenticated;

create or replace function mc2_is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from mc2_admins where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;
grant execute on function mc2_is_admin() to anon, authenticated;

-- অনুরোধের আইপি ও ডিভাইস (হেডার থেকে)
create or replace function mc2_hdr(k text) returns text language sql stable as $$
  select nullif(trim(coalesce(nullif(current_setting('request.headers', true), '')::json ->> k, '')), '')
$$;
create or replace function mc2_ip() returns text language sql stable as $$
  select nullif(left(trim(split_part(coalesce(mc2_hdr('cf-connecting-ip'), mc2_hdr('x-forwarded-for'), mc2_hdr('x-real-ip'), ''), ',', 1)), 64), '')
$$;

-- ---------- সবার লিডারবোর্ড ----------
create table if not exists mc2_scores (
  id bigint generated always as identity primary key,
  name text not null, dept text not null, batch text, club text, title text,
  pct int not null, score int not null, ok int, total int,
  device text, ip text, ua text, info jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mc2_scores_t on mc2_scores (created_at desc);
alter table mc2_scores enable row level security;
revoke all on mc2_scores from anon, authenticated;
grant select, delete on mc2_scores to authenticated;
drop policy if exists "admin scores" on mc2_scores;
create policy "admin scores" on mc2_scores for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create or replace function mc2_submit_score(p_name text, p_dept text, p_batch text, p_club text, p_title text, p_pct int, p_score int, p_ok int, p_total int, p_device text, p_info jsonb)
returns text language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 30 or char_length(coalesce(p_dept, '')) not between 1 and 60
     or p_pct not between 0 and 100 or p_score not between 0 and 1000 or char_length(coalesce(p_device, '')) not between 8 and 40 then return 'invalid'; end if;
  if (select count(*) from mc2_scores where device = p_device and created_at > now() - interval '1 hour') >= 30 then return 'slow'; end if;
  insert into mc2_scores(name, dept, batch, club, title, pct, score, ok, total, device, ip, ua, info)
  values (trim(p_name), p_dept, left(p_batch, 40), left(p_club, 60), left(p_title, 60), p_pct, p_score, p_ok, p_total, p_device, mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
  return 'ok';
end $$;

create or replace function mc2_top_scores(p_limit int default 500)
returns table (name text, dept text, batch text, pct int, score int, ts bigint)
language sql security definer set search_path = public as $$
  select * from (
    select distinct on (lower(s.name), s.dept) s.name, s.dept, s.batch, s.pct, s.score, (extract(epoch from s.created_at) * 1000)::bigint as ts
    from mc2_scores s order by lower(s.name), s.dept, s.score desc, s.created_at
  ) t order by t.score desc, t.ts limit least(greatest(p_limit, 1), 1000)
$$;
grant execute on function mc2_submit_score(text, text, text, text, text, int, int, int, int, text, jsonb), mc2_top_scores(int) to anon, authenticated;

-- ---------- ভিজিটর লগ ----------
create table if not exists mc2_visits (
  id bigint generated always as identity primary key,
  device text not null, page text, ip text, ua text, info jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mc2_visits_t on mc2_visits (created_at desc);
alter table mc2_visits enable row level security;
revoke all on mc2_visits from anon, authenticated;
grant select, delete on mc2_visits to authenticated;
drop policy if exists "admin visits" on mc2_visits;
create policy "admin visits" on mc2_visits for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create or replace function mc2_log_visit(p_device text, p_page text, p_info jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 then return; end if;
  if (select count(*) from mc2_visits where device = p_device and created_at > now() - interval '1 hour') >= 40 then return; end if;
  insert into mc2_visits(device, page, ip, ua, info) values (p_device, left(p_page, 100), mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
end $$;
grant execute on function mc2_log_visit(text, text, jsonb) to anon, authenticated;

-- ---------- চ্যাট ----------
create table if not exists mc2_chat_rooms (name text primary key check (char_length(name) between 1 and 60), sort int not null default 100);
alter table mc2_chat_rooms enable row level security;
revoke all on mc2_chat_rooms from anon, authenticated;
grant select on mc2_chat_rooms to anon;
grant select, insert, update, delete on mc2_chat_rooms to authenticated;
drop policy if exists "rooms read" on mc2_chat_rooms; drop policy if exists "rooms admin" on mc2_chat_rooms;
create policy "rooms read" on mc2_chat_rooms for select to anon, authenticated using (true);
create policy "rooms admin" on mc2_chat_rooms for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
insert into mc2_chat_rooms(name, sort) values
  ('ক্যাম্পাস লাউঞ্জ', 0), ('বাংলা', 1), ('উদ্ভিদবিজ্ঞান', 2), ('রসায়ন', 3), ('ইংরেজি', 4), ('ইতিহাস', 5), ('ইসলামের ইতিহাস ও সংস্কৃতি', 6),
  ('ইসলামি শিক্ষা', 7), ('দর্শন', 8), ('পদার্থবিজ্ঞান', 9), ('রাষ্ট্রবিজ্ঞান', 10), ('সমাজবিজ্ঞান', 11), ('পরিসংখ্যান', 12), ('উর্দু', 13),
  ('গণিত', 14), ('অর্থনীতি', 15), ('প্রাণিবিদ্যা', 16), ('মনোবিজ্ঞান', 17), ('সংস্কৃত', 18), ('অন্যান্য', 19)
on conflict (name) do nothing;

create table if not exists mc2_chat_messages (
  id bigint generated always as identity primary key,
  room text not null,
  nick text not null check (char_length(nick) between 2 and 30),
  body text not null check (char_length(trim(body)) between 1 and 200),
  voter text not null,
  hidden boolean not null default false,
  ip text, ua text, info jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mc2_chat_r on mc2_chat_messages (room, created_at desc);
alter table mc2_chat_messages enable row level security;
revoke all on mc2_chat_messages from anon, authenticated;
grant select (id, room, nick, body, created_at) on mc2_chat_messages to anon;
grant select, update, delete on mc2_chat_messages to authenticated;
drop policy if exists "chat read" on mc2_chat_messages; drop policy if exists "chat admin" on mc2_chat_messages;
create policy "chat read" on mc2_chat_messages for select to anon using (not hidden and created_at > now() - interval '7 days');
create policy "chat admin" on mc2_chat_messages for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create table if not exists mc2_chat_reports (
  message_id bigint not null references mc2_chat_messages(id) on delete cascade,
  voter text not null check (char_length(voter) between 8 and 40),
  primary key (message_id, voter)
);
alter table mc2_chat_reports enable row level security;
revoke all on mc2_chat_reports from anon, authenticated;
grant insert on mc2_chat_reports to anon;
grant select, delete on mc2_chat_reports to authenticated;
drop policy if exists "report add" on mc2_chat_reports; drop policy if exists "report admin" on mc2_chat_reports;
create policy "report add" on mc2_chat_reports for insert to anon with check (true);
create policy "report admin" on mc2_chat_reports for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

create table if not exists mc2_chat_bans (voter text primary key, until timestamptz not null);
create table if not exists mc2_chat_warnings (
  message_id bigint primary key references mc2_chat_messages(id) on delete cascade,
  voter text not null, seen boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists mc2_bad_words (word text primary key check (word = lower(word) and word !~ '[^a-z0-9ঀ-৿]'));
alter table mc2_chat_bans enable row level security; alter table mc2_chat_warnings enable row level security; alter table mc2_bad_words enable row level security;
revoke all on mc2_chat_bans, mc2_chat_warnings, mc2_bad_words from anon, authenticated;
grant select, insert, update, delete on mc2_chat_bans, mc2_bad_words to authenticated;
drop policy if exists "bans admin" on mc2_chat_bans; drop policy if exists "words admin" on mc2_bad_words;
create policy "bans admin" on mc2_chat_bans for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
create policy "words admin" on mc2_bad_words for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
insert into mc2_bad_words(word) values ('fuck'),('shit'),('bitch'),('slut'),('asshole'),('bastard') on conflict do nothing;
-- বাংলা খারাপ শব্দ অ্যাডমিন পেজ থেকেও যোগ করা যায়।

-- ৩টি আলাদা রিপোর্টে বার্তা লুকায়, লেখক সতর্কবার্তা পায়
create or replace function mc2_after_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into mc2_chat_warnings(message_id, voter) select id, voter from mc2_chat_messages where id = new.message_id on conflict do nothing;
  update mc2_chat_messages set hidden = true
  where id = new.message_id and (select count(*) from mc2_chat_reports where message_id = new.message_id) >= 3;
  return new;
end $$;
drop trigger if exists t_mc2_report on mc2_chat_reports;
create trigger t_mc2_report after insert on mc2_chat_reports for each row execute function mc2_after_report();

create or replace function mc2_send_chat(p_room text, p_nick text, p_body text, p_voter text, p_info jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text; b mc2_chat_bans;
begin
  if not exists (select 1 from mc2_chat_rooms where name = p_room)
     or char_length(p_nick) not between 2 and 30 or char_length(trim(p_body)) not between 1 and 200
     or char_length(p_voter) not between 8 and 40 then return 'invalid'; end if;
  select * into b from mc2_chat_bans where voter = p_voter and until > now();
  if found then return 'banned:' || greatest(1, extract(epoch from (b.until - now()))::int); end if;
  if (select count(*) from mc2_chat_messages where voter = p_voter and created_at > now() - interval '1 minute') >= 5 then return 'slow'; end if;
  n := regexp_replace(translate(lower(p_body), '0134@$5', 'oieaass'), '[^a-z0-9ঀ-৿]', '', 'g');
  if exists (select 1 from mc2_bad_words w where position(w.word in n) > 0) then
    insert into mc2_chat_bans(voter, until) values (p_voter, now() + interval '10 minutes')
    on conflict (voter) do update set until = excluded.until;
    return 'banned:600';
  end if;
  insert into mc2_chat_messages(room, nick, body, voter, ip, ua, info)
  values (p_room, p_nick, trim(p_body), p_voter, mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
  return 'ok';
end $$;

create or replace function mc2_chat_status(p_voter text) returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'ban', coalesce((select greatest(0, extract(epoch from (until - now()))::int) from mc2_chat_bans where voter = p_voter and until > now()), 0),
    'warn', (select count(*) from mc2_chat_warnings where voter = p_voter and not seen))
$$;
create or replace function mc2_chat_ack(p_voter text) returns void language sql security definer set search_path = public as $$
  update mc2_chat_warnings set seen = true where voter = p_voter
$$;
grant execute on function mc2_send_chat(text, text, text, text, jsonb), mc2_chat_status(text), mc2_chat_ack(text) to anon, authenticated;

-- ---------- নতুন ছবি (খেলায় নতুন জায়গা) ----------
create table if not exists mc2_places (
  id bigint generated always as identity primary key,
  bn text not null check (char_length(bn) between 1 and 60), en text, img text not null,
  active boolean not null default true, created_at timestamptz not null default now()
);
alter table mc2_places enable row level security;
revoke all on mc2_places from anon, authenticated;
grant select on mc2_places to anon;
grant select, insert, update, delete on mc2_places to authenticated;
drop policy if exists "places read" on mc2_places; drop policy if exists "places admin" on mc2_places;
create policy "places read" on mc2_places for select to anon, authenticated using (active);
create policy "places admin" on mc2_places for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mc2-places', 'mc2-places', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "places upload" on storage.objects; drop policy if exists "places delete" on storage.objects;
create policy "places upload" on storage.objects for insert to authenticated with check (bucket_id = 'mc2-places' and mc2_is_admin());
create policy "places delete" on storage.objects for delete to authenticated using (bucket_id = 'mc2-places' and mc2_is_admin());

-- ---------- পুরস্কারের জমায় আইপি/ডিভাইস + অ্যাডমিন দেখা ----------
alter table contest_entries add column if not exists ip text;
alter table contest_entries add column if not exists ua text;
create or replace function mc2_contest_meta() returns trigger language plpgsql as $$
begin new.ip := mc2_ip(); new.ua := left(mc2_hdr('user-agent'), 400); return new; end $$;
drop trigger if exists t_mc2_contest_meta on contest_entries;
create trigger t_mc2_contest_meta before insert on contest_entries for each row execute function mc2_contest_meta();
alter table contest_entries enable row level security;
grant select, delete on contest_entries to authenticated;
drop policy if exists "admin contest" on contest_entries;
create policy "admin contest" on contest_entries for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
grant execute on function pick_winners(int, int) to authenticated;

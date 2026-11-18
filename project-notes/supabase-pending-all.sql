-- supabase-pending-all.sql — এখন কোনো SQL পেন্ডিং নেই। [১] ও [২] দুটোই ✅ চালানো (আবার চালালেও ক্ষতি নেই)। ভবিষ্যতে নতুন SQL এলে এই ফাইলে আবার জমা হবে।
-- [১] ✅ চালানো।

-- ✅ [১] supabase-new-20261206.sql চালানো হয়েছে (মালিক নিজে জানিয়েছেন)।
-- [১] supabase-new-20261206.sql — কুইজ ছবির সেটিং (qimg_cfg) সেভের অনুমতি (mc2_settings_check)। না চালালে অ্যাডমিন > 🖼 কুইজ ছবি সেভ ব্যর্থ হয়; সাইট আগের মতোই চলে।
-- ধাপ ৩ (⬇ এক্সেল ডিজাইন) আপডেটে নতুন কোনো SQL নেই। এটা Supabase > SQL Editor-এ পুরোটা একবার Run (বারবার চালালেও ক্ষতি নেই)।

-- ===== [১] supabase-new-20261206.sql =====
-- MC Explorer: কুইজ ছবির সেটিং (key 'qimg_cfg') সেভ করার অনুমতি। Supabase > SQL Editor-এ পুরোটা একবার Run; বারবার চালালেও ক্ষতি নেই।
-- আগের সব key (লোগো-ছবি সহ) অপরিবর্তিত, শুধু qimg_cfg যোগ। কোনো ডাটা বদলায় না।

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
  elsif new.key = 'qimg_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 1500 then raise exception 'qimg_cfg must be an object (<= 1500 bytes)'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- qimg_cfg সেভে কুইজের প্রশ্ন নতুন করে বানানোর দরকার নেই
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg', 'home_cfg', 'board_cfg', 'qimg_cfg')) execute function mc2_trg_rebuild();

notify pgrst, 'reload schema';
select 'qimg_cfg অনুমোদিত' as item, pg_get_functiondef('mc2_settings_check()'::regprocedure) like '%qimg_cfg%' as ok;

-- ===== [২] supabase-new-20261220.sql (✅ চালানো) =====
-- 2026-12-20: ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি (কুইজের পরের পপআপ + জমা-ফর্মের একই লাইন)
-- PENDING (মালিক "চালানো হয়েছে" বললে তবেই sql-status.md-এ ✅ লেখা হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই। আগের সব SQL (বিশেষ করে supabase-new-20261103.sql ও কার্ডের SQL) চালানো থাকতে হবে।
--
-- কীভাবে কাজ করে:
--   প্রতি ফোনের (device) জন্য একটাই সারি: হ্যাঁ/না + (হ্যাঁ হলে) ছবি সহ / ছবি ছাড়া।
--   একবার উত্তর দিলে ওই ফোনের আগের-পরের সব কার্ডে একই অনুমতি ধরা হয় — কার্ডে আলাদা করে কিছু লেখা হয় না, তাই ভুল/বাদ পড়ার সুযোগ নেই।
--   জমা-ফর্মে বদলালে এই একই সারি বদলায়।
-- জায়গা: প্রতি সারি ≈ ১০০ বাইট; ১০,০০০ ফোনে ১ MB-এর কম। কার্ড/ছবির টেবিলে কোনো কলাম যোগ হয় না, কিছু মোছেও না।

-- ১) টেবিল (সরাসরি শুধু অ্যাডমিন পড়তে পারে; ইউজার শুধু নিচের ফাংশন দিয়ে নিজের ডিভাইসের সারি পড়ে/লেখে)
create table if not exists mc2_fbok (
  device text primary key,
  ok boolean not null,
  mode text,
  updated_at timestamptz not null default now(),
  constraint mc2_fbok_mode_chk check ((ok and mode in ('photo', 'nophoto')) or (not ok and mode is null))
);
alter table mc2_fbok enable row level security;
revoke all on mc2_fbok from public, anon, authenticated;
grant select on mc2_fbok to authenticated;
drop policy if exists "admin fbok" on mc2_fbok;
create policy "admin fbok" on mc2_fbok for select to authenticated using (mc2_is_admin());

-- ২) ইউজারের নিজের ডিভাইসের উত্তর পড়া (নেই হলে null)
create or replace function mc2_fb_get(p_device text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 then return null; end if;
  select ok, mode into r from mc2_fbok where device = p_device;
  if not found then return null; end if;
  return jsonb_build_object('ok', r.ok, 'mode', r.mode);
end $$;
revoke all on function mc2_fb_get(text) from public;
grant execute on function mc2_fb_get(text) to anon, authenticated;

-- ৩) উত্তর সেভ/বদল (p_ok = true হলে p_mode 'photo' বা 'nophoto' লাগবে; false হলে mode ফাঁকা)
create or replace function mc2_fb_set(p_device text, p_ok boolean, p_mode text) returns text
language plpgsql security definer set search_path = public as $$
declare m text := nullif(trim(coalesce(p_mode, '')), '');
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or p_ok is null then return 'invalid'; end if;
  if p_ok then
    if m is null or m not in ('photo', 'nophoto') then return 'invalid'; end if;
  else
    m := null;
  end if;
  if mc2_ip() is not null and not mc2_ac_rl('fb:ip:' || mc2_ip(), mc2_lim('ip_card_hr'), 3600) then return 'slow'; end if;
  insert into mc2_fbok (device, ok, mode) values (p_device, p_ok, m)
  on conflict (device) do update set ok = excluded.ok, mode = excluded.mode, updated_at = now();
  return 'ok';
end $$;
revoke all on function mc2_fb_set(text, boolean, text) from public;
grant execute on function mc2_fb_set(text, boolean, text) to anon, authenticated;

-- ৪) অ্যাডমিনের জন্য ভিউ: প্রতিটি কার্ডের পাশে তার ফোনের অনুমতি
--    fb: yp = হ্যাঁ·ছবি সহ, yn = হ্যাঁ·ছবি ছাড়া, no = না, none = উত্তর দেয়নি
create or replace view mc2_cards_fbv as
select c.id, c.device, c.name, c.dept, c.batch, c.score, c.pct, c.show, c.updated_at, c.thumb,
  case when f.device is null then 'none' when not f.ok then 'no' when f.mode = 'photo' then 'yp' else 'yn' end as fb
from mc2_cards c
left join mc2_fbok f on f.device = c.device
where mc2_is_admin();
revoke all on mc2_cards_fbv from public, anon;
grant select on mc2_cards_fbv to authenticated;

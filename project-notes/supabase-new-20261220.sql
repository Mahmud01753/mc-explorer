-- 2026-12-20: ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি (কুইজের পরের পপআপ + জমা-ফর্মের একই লাইন)
-- ✅ চালানো হয়েছে (মালিক জানিয়েছেন)। আবার চালালেও ক্ষতি নেই।
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

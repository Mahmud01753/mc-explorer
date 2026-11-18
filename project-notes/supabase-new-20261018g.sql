-- NEW SQL (2026-10-18): ইউজার ফোল্ডার (অ্যাডমিনের 🎁 পুরস্কার > 📁 ফোল্ডার) — ফোল্ডার ও সদস্যের টেবিল, শুধু অ্যাডমিন অ্যাক্সেস
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-community.sql (mc2_is_admin())।
--
-- অটো ফোল্ডার "👥 সব ইউজার" ও "🎁 ফর্ম জমা" এখানে সেভ হয় না — ওই দুটো mc2_scores ও contest_entries থেকে নিজে তৈরি হয়, তাই মোছা বা নাম বদলানো যায় না।
-- এই টেবিলে শুধু কাস্টম ফোল্ডার ও তাদের সদস্য থাকে। ফোল্ডার মুছলে শুধু ফোল্ডার ও সদস্য-তালিকা যায়; ইউজারের স্কোর/ফর্ম/কার্ড কিছুই মোছে না।
-- "ইউজার" = ডিভাইস + নামের জুটি (ukey: u:<ডিভাইস>|<ছোট হাতের নাম>; ডিভাইস ছাড়া হাতে লেখা নামে n:<নাম>)।

create table if not exists mc2_ufolders (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 80 and btrim(name) not in ('👥 সব ইউজার', '🎁 ফর্ম জমা')),
  created_at timestamptz not null default now()
);
create unique index if not exists mc2_ufolders_name_u on mc2_ufolders (lower(btrim(name)));

create table if not exists mc2_ufolder_members (
  id bigint generated always as identity primary key,
  folder_id bigint not null references mc2_ufolders (id) on delete cascade,
  ukey text not null check (char_length(ukey) between 3 and 200),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  device text,
  dept text,
  batch text,
  score int,
  src text not null default 'all' check (src in ('all', 'form', 'manual')),   -- all = সব ইউজার থেকে, form = ফর্ম জমা থেকে, manual = হাতে লেখা নাম
  at timestamptz,                                                             -- কপির সময় ইউজারের শেষ সক্রিয়তা (খেলা/ফর্ম জমা)
  added_at timestamptz not null default now(),
  unique (folder_id, ukey)
);
create index if not exists mc2_ufolder_members_f on mc2_ufolder_members (folder_id);

-- শুধু অ্যাডমিন (লগইন করা + mc2_admins তালিকায়); অ্যানন/পাবলিক কিছুই পড়তে বা লিখতে পারে না
alter table mc2_ufolders enable row level security;
alter table mc2_ufolder_members enable row level security;
revoke all on mc2_ufolders, mc2_ufolder_members from anon, authenticated;
grant select, insert, update, delete on mc2_ufolders, mc2_ufolder_members to authenticated;
drop policy if exists "ufolders admin" on mc2_ufolders;
create policy "ufolders admin" on mc2_ufolders for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
drop policy if exists "ufolder members admin" on mc2_ufolder_members;
create policy "ufolder members admin" on mc2_ufolder_members for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; ২টা সারি এলে ঠিক):
-- select tablename, rowsecurity from pg_tables where tablename in ('mc2_ufolders', 'mc2_ufolder_members');

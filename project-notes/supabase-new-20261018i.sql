-- NEW SQL (2026-10-18, ধাপ ২-খ): স্মার্ট ফোল্ডার (সেভ করা ফিল্টার) ও লটারির রেকর্ড
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-new-20261018g.sql ও supabase-new-20261018h.sql।
--
-- filter : স্মার্ট ফোল্ডারের সেভ করা ফিল্টার (যেমন বিভাগ + এই সপ্তাহ); সদস্য তালিকা সেভ হয় না, প্রতিবার নতুন করে হিসাব হয় — তাই নতুন লোক এলে নিজে ঢোকে।
-- meta   : বিজয়ী ফোল্ডারের লটারি-রেকর্ড (কোন ফোল্ডারে "this" টিক ছিল, পুলে কতজন ছিল, বাতিল হওয়া বিজয়ী)।
-- আনডু (মুভ/মোছা ফেরানো) পাতা খোলা থাকা পর্যন্ত চলে, তাই এর জন্য টেবিল লাগে না।
-- নতুন টেবিল নেই, তাই আগের RLS (শুধু অ্যাডমিন অ্যাক্সেস) সেভাবেই কাজ করে; অ্যানন/পাবলিক কিছুই পড়তে বা লিখতে পারে না।

alter table mc2_ufolders add column if not exists filter jsonb;
alter table mc2_ufolders add column if not exists meta jsonb not null default '{}'::jsonb;

alter table mc2_ufolders drop constraint if exists mc2_ufolders_kind_ck;
alter table mc2_ufolders add constraint mc2_ufolders_kind_ck check (kind in ('custom', 'winners', 'smart'));

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; ২টা সারি এলে ঠিক):
-- select column_name from information_schema.columns where table_name = 'mc2_ufolders' and column_name in ('filter', 'meta');

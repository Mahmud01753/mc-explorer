-- NEW SQL (2026-10-18, ধাপ ২-ক): ফোল্ডারের ধরন — লটারির বিজয়ী ফোল্ডার চেনার জন্য
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। (পুরোনো কিছু বদলায় না, আবার চালালেও সমস্যা নেই)
-- আগে চালানো থাকতে হবে: supabase-new-20261018g.sql (mc2_ufolders ও mc2_ufolder_members)।
--
-- kind = 'custom'  : হাতে বানানো সাধারণ ফোল্ডার (আগের সবগুলো এটাই থাকবে)
-- kind = 'winners' : লটারির পর নিজে তৈরি হওয়া বিজয়ী ফোল্ডার
-- নতুন টেবিল নেই, তাই আগের RLS (শুধু অ্যাডমিন অ্যাক্সেস) সেভাবেই কাজ করে; অ্যানন/পাবলিক কিছুই পড়তে বা লিখতে পারে না।

alter table mc2_ufolders add column if not exists kind text not null default 'custom';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mc2_ufolders_kind_ck') then
    alter table mc2_ufolders add constraint mc2_ufolders_kind_ck check (kind in ('custom', 'winners'));
  end if;
end $$;

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; kind কলামসহ ১টা সারি এলে ঠিক):
-- select column_name from information_schema.columns where table_name = 'mc2_ufolders' and column_name = 'kind';

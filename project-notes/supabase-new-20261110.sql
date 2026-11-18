-- কার্ড-সুরক্ষা: কোনো ডিভাইসের কার্ড (mc2_cards) থাকলে ওই ডিভাইসের এই ডেটার DELETE বন্ধ থাকবে:
--   স্কোর (mc2_scores), ভিজিটর রেকর্ড (mc2_presence), কনটেস্ট এন্ট্রি (contest_entries), উত্তর (mc2_answers)
-- সুরক্ষার বাইরে (আগের মতোই মোছা যাবে): চ্যাট (mc2_ac_messages ইত্যাদি) ও মডারেশন (mc2_ac_mod, warns, modlog, reports)।
-- নতুন (সব একসাথে, নয়তো কিছুই নয়): কোনো ডিভাইসের শেষ কার্ডটি মুছে গেলে (যে পথেই হোক: ইউজার মোছা, কার্ড ট্যাবের ডিলিট, অটো-ক্লিনআপ)
--   ওই ডিভাইসের স্কোর, ভিজিটর রেকর্ড, কনটেস্ট এন্ট্রি, উত্তর ও টপ হিস্টরি একই ট্রানজ্যাকশনে নিজে থেকে মোছে। কোথাও এরর হলে কিছুই মোছে না।
--   ডিভাইসের আরও কার্ড থাকলে (একজনের একাধিক কার্ড থাকতে পারে) কিছুই মোছে না। চ্যাট ও মডারেশনে হাত দেয় না।
--
-- আচরণ: সুরক্ষিত সারিটি চুপচাপ বাদ পড়ে (মোছা হয় না), বাকি সারি যথারীতি মোছা হয়।
--   তাই "ইউজার মোছা", অটো-ক্লিনআপ বা অ্যাডমিনের স্কোর মোছা — কোনোটাই মাঝপথে ভেঙে পড়বে না;
--   শুধু কার্ডওয়ালা ডিভাইসের সারিগুলো থেকে যাবে এবং মোছার গণনায় ওগুলো ধরা হবে না।
-- একবার চালালেই হবে; আবার চালালেও ক্ষতি নেই।

create or replace function mc2_protect_card_del() returns trigger language plpgsql security definer set search_path = public as $$
declare d text;
begin
  -- TG_ARGV[0] = ওই টেবিলে ডিভাইস আইডির কলামের নাম (mc2_presence-এ voter, বাকিগুলোতে device)
  d := to_jsonb(old) ->> TG_ARGV[0];
  if d is not null and exists (select 1 from mc2_cards c where c.device = d) then
    return null;   -- কার্ড আছে: এই সারি মোছা হবে না
  end if;
  return old;
end $$;
revoke all on function mc2_protect_card_del() from public, anon, authenticated;

drop trigger if exists t_mc2_scores_cardlock on mc2_scores;
create trigger t_mc2_scores_cardlock before delete on mc2_scores for each row execute function mc2_protect_card_del('device');

drop trigger if exists t_mc2_presence_cardlock on mc2_presence;
create trigger t_mc2_presence_cardlock before delete on mc2_presence for each row execute function mc2_protect_card_del('voter');

drop trigger if exists t_contest_entries_cardlock on contest_entries;
create trigger t_contest_entries_cardlock before delete on contest_entries for each row execute function mc2_protect_card_del('device');

drop trigger if exists t_mc2_answers_cardlock on mc2_answers;
create trigger t_mc2_answers_cardlock before delete on mc2_answers for each row execute function mc2_protect_card_del('device');

create or replace function mc2_cards_cascade() returns trigger language plpgsql security definer set search_path = public as $$
declare ds text[];
begin
  -- যেসব ডিভাইসের এই স্টেটমেন্টে কার্ড মুছেছে এবং আর একটাও কার্ড বাকি নেই
  select coalesce(array_agg(distinct o.device), '{}') into ds from old_rows o where not exists (select 1 from mc2_cards c where c.device = o.device);
  if cardinality(ds) = 0 then return null; end if;
  delete from mc2_top_hist where device = any(ds);
  delete from mc2_entry_flags where k in (select 'e' || id::text from contest_entries where device = any(ds)) or k in (select id::text from contest_entries where device = any(ds));
  delete from contest_entries where device = any(ds);
  delete from mc2_answers where device = any(ds);
  delete from mc2_scores where device = any(ds);
  delete from mc2_presence where voter = any(ds);
  return null;
end $$;
revoke all on function mc2_cards_cascade() from public, anon, authenticated;
drop trigger if exists t_mc2_cards_cascade on mc2_cards;
create trigger t_mc2_cards_cascade after delete on mc2_cards referencing old table as old_rows for each statement execute function mc2_cards_cascade();

notify pgrst, 'reload schema';

-- যাচাই: পাঁচটিই true হলে ঠিক আছে
select tgrelid::regclass::text as table_name, tgname as trigger_name, tgenabled <> 'D' as ok
from pg_trigger
where tgname in ('t_mc2_scores_cardlock', 't_mc2_presence_cardlock', 't_contest_entries_cardlock', 't_mc2_answers_cardlock', 't_mc2_cards_cascade')
order by 1;

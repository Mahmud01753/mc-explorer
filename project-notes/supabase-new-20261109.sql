-- ইউজার তথ্য ট্যাব: বাছাই করা ইউজারদের ডেটা মোছা (সুরক্ষিত সংস্করণ, ২০২৬-১১-১১)। একবার চালালেই হবে; আবার চালালেও ক্ষতি নেই।
-- p_voters = ডিভাইস আইডির তালিকা (একবারে সর্বোচ্চ ৫০০); p_what = কোন কোন ডেটা মুছবে:
--   scores (লিডারবোর্ড স্কোর), cards (কার্ড + টপ হিস্টরি), entries (কনটেস্ট এন্ট্রি), answers (উত্তর),
--   chat (চ্যাট বার্তা, রিঅ্যাকশন, সিন, উপস্থিতি), mod (মডারেশন: ওয়ার্নিং/ব্যান/রিপোর্ট), visitor (Visitor List-এর রেকর্ড)
-- p_dry = true দিলে কিছু মোছে না, শুধু কতগুলো মুছবে তার সংখ্যা দেয় (সুরক্ষা হিসাব করে — প্রিভিউ আর আসল মোছার সংখ্যা মিলবে)।
--
-- এই সংস্করণে যা ঠিক/নতুন:
--   ১) সব একসাথে, নয়তো কিছুই নয়: কার্ড মুছলে ওই কার্ডওয়ালা ডিভাইসের স্কোর, ভিজিটর রেকর্ড, কনটেস্ট এন্ট্রি, উত্তর ও টপ হিস্টরি
--      একই ধাপে নিজে থেকে যায় (টিক দিলেও না দিলেও)। পুরোটা এক ট্রানজ্যাকশন — কোথাও এরর হলে কিছুই মোছে না।
--      কার্ড না মুছলে ওই চারটি ডেটা ১১১০-এর ট্রিগারে সুরক্ষিত থাকে। চ্যাট ও মডারেশন কার্ডের সাথে যায় না (শুধু টিক দিলে যায়)।
--   ২) প্রিভিউ (p_dry) সঠিক: কার্ড মোছা না হলে, কার্ডওয়ালা ডিভাইসের সারি গোনা হয় না (কারণ ওগুলো আসলেই মুছবে না)।
--   ৩) entry_flags শুধু তাদেরই মোছে যাদের এন্ট্রি সত্যিই মুছছে।
--   ৪) কার্ড-সুরক্ষা (সাইট খালি হওয়া ঠেকাতে) — নিচের সীমা পেরোলে এরর দিয়ে থামে, কিছুই মোছে না:
--        • p_unlock_cards = true না দিলে কার্ড মোছা যায় না (আগের মতোই)।
--        • সব কার্ড একসাথে মোছা যায় না — অন্তত ১টি কার্ড থেকে যেতেই হবে।
--        • একবারে (এক কলে) সর্বোচ্চ ৫০টি কার্ড; আর একদিনে (বাংলাদেশ সময়) মোট সর্বোচ্চ ১০০টি কার্ড।
--        • কার্ড মুছতে ঠিক হওয়া ডিভাইসের সংখ্যা মোট কার্ডের অর্ধেকের বেশি হলে থামে (অন্তত ২টি কার্ড থাকলে)।
--        • বাছা ইউজারেরা মিলে Visitor List-এর সব ইউজার হলে থামে (পুরো তালিকা খালি করা যায় না)।
--      সীমা বদলাতে চাইলে নিচের declare-এর c_call, c_day, c_pct পরিবর্তন করুন।
--   ৫) ডিলিট-লগ টেবিল mc2_del_log (দিনপ্রতি কতগুলো কার্ড মোছা হলো) — শুধু এই ফাংশন ব্যবহার করে, বাইরে থেকে পড়া/লেখা যায় না।
create table if not exists mc2_del_log (day date primary key, cards int not null default 0);
alter table mc2_del_log enable row level security;
revoke all on mc2_del_log from public, anon, authenticated;

drop function if exists mc2_admin_users_del(text[], text[], boolean);
create or replace function mc2_admin_users_del(p_voters text[], p_what text[], p_dry boolean default false, p_unlock_cards boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c_call constant int := 50;      -- এক কলে সর্বোচ্চ কার্ড
  c_day  constant int := 100;     -- একদিনে সর্বোচ্চ কার্ড
  c_pct  constant int := 50;      -- মোট কার্ডের সর্বোচ্চ শতাংশ (এক কলে)
  v text[]; w text[] := coalesce(p_what, '{}'); n int; m int; r jsonb := '{}'::jsonb;
  ex text[] := '{}';              -- প্রিভিউ-গণনা থেকে বাদ: কার্ড না মুছলে সুরক্ষিত ডিভাইস; কার্ড মুছলে কার্ডওয়ালা ডিভাইস (ওগুলো আলাদা গোনা)
  cd text[] := '{}';              -- যে কার্ডওয়ালা ডিভাইসের কার্ড মোছা হচ্ছে
  tc int; nc int; tp int; sp int; today date := (now() at time zone 'Asia/Dhaka')::date; spent int; kk int;
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  select coalesce(array_agg(distinct left(x, 80)), '{}') into v from unnest(coalesce(p_voters, '{}')) x where btrim(coalesce(x, '')) <> '';
  if cardinality(v) = 0 then return r; end if;
  if cardinality(v) > 500 then raise exception 'একবারে ৫০০ জনের বেশি নয়'; end if;

  -- সাইট খালি হওয়া ঠেকানো: বাছা ইউজারেরা মিলে পুরো Visitor List হলে থামে
  select count(*) into tp from mc2_presence;
  select count(*) into sp from mc2_presence where voter = any(v);
  if tp > 0 and sp >= tp then raise exception 'সব ইউজার একসাথে মোছা যাবে না — অন্তত একজন বাদ রাখুন (সুরক্ষা)'; end if;

  select count(*) into tc from mc2_cards;
  select count(*) into nc from mc2_cards where device = any(v);

  if 'cards' = any(w) then
    if not p_dry and not coalesce(p_unlock_cards, false) then raise exception 'কার্ড লক করা আছে — আনলক করে মুছুন'; end if;
    if nc > 0 then
      if nc >= tc then raise exception 'সব কার্ড মোছা যাবে না — অন্তত একটি কার্ড থাকতে হবে (সুরক্ষা)'; end if;
      if nc > c_call then raise exception 'একবারে % টির বেশি কার্ড মোছা যাবে না (বাছা: %)। কম জন বেছে আবার চেষ্টা করুন', c_call, nc; end if;
      if tc >= 2 and nc * 100 > tc * c_pct then raise exception 'মোট কার্ডের % শতাংশের বেশি একসাথে মোছা যাবে না (বাছা: % / %)', c_pct, nc, tc; end if;
      select coalesce((select cards from mc2_del_log where day = today), 0) into spent;
      if spent + nc > c_day then raise exception 'আজ আর % টির বেশি কার্ড মোছা যাবে না (আজ মোছা হয়েছে: %, এখন বাছা: %)। কাল আবার চেষ্টা করুন', c_day, spent, nc; end if;
    end if;
    select coalesce(array_agg(distinct device), '{}') into cd from mc2_cards where device = any(v);
    ex := cd;
  else
    -- কার্ড মোছা হচ্ছে না: কার্ডওয়ালা ডিভাইসগুলো ট্রিগারে সুরক্ষিত, তাই প্রিভিউ-সংখ্যা থেকে বাদ
    select coalesce(array_agg(distinct device), '{}') into ex from mc2_cards where device = any(v);
  end if;

  -- ১) কার্ড + কার্ডের সংশ্লিষ্ট সব একসাথে — সবার আগে (এই ফাংশন ১১১০ চালানো থাকলে পূর্ণ কাজ করে; ১১১০ আগে/একসাথে চালান)
  if 'cards' = any(w) then
    -- সংখ্যা আগে গুনি (কার্ড মুছলে ১১১০-এর ট্রিগার বাকিগুলো নিজেই মোছে — সব একই ট্রানজ্যাকশনে)
    select count(*) into kk from mc2_scores where device = any(cd); r := r || jsonb_build_object('scores', kk);
    select count(*) into kk from contest_entries where device = any(cd); r := r || jsonb_build_object('entries', kk);
    select count(*) into kk from mc2_answers where device = any(cd); r := r || jsonb_build_object('answers', kk);
    select count(*) into kk from mc2_presence where voter = any(cd); r := r || jsonb_build_object('visitor', kk);
    if p_dry then
      n := nc;
    else
      delete from mc2_cards where device = any(v); get diagnostics n = row_count;
      if n > 0 then
        insert into mc2_del_log(day, cards) values (today, n) on conflict (day) do update set cards = mc2_del_log.cards + excluded.cards;
      end if;
      -- ১১১০-এর t_mc2_cards_cascade ট্রিগার এখানেই স্কোর/এন্ট্রি/উত্তর/ভিজিটর/টপ হিস্টরি মুছে ফেলেছে
      -- (১১১০ না চালানো থাকলেও যেন কাজ করে — নিচেরগুলো তখন নিজেই মোছে; চালানো থাকলে ০টি সারি মোছে, ক্ষতি নেই)
      delete from mc2_top_hist where device = any(v);
      delete from mc2_entry_flags where k in (select 'e' || id::text from contest_entries where device = any(cd)) or k in (select id::text from contest_entries where device = any(cd));
      delete from contest_entries where device = any(cd);
      delete from mc2_answers where device = any(cd);
      delete from mc2_scores where device = any(cd);
      delete from mc2_presence where voter = any(cd);
    end if;
    r := r || jsonb_build_object('cards', n);
  end if;

  if 'scores' = any(w) then
    if p_dry then select count(*) into n from mc2_scores where device = any(v) and not (device = any(ex));
    else delete from mc2_scores where device = any(v); get diagnostics n = row_count; end if;
    r := r || jsonb_build_object('scores', coalesce((r ->> 'scores')::int, 0) + n);
  end if;

  if 'entries' = any(w) then
    if p_dry then select count(*) into n from contest_entries where device = any(v) and not (device = any(ex));
    else
      delete from mc2_entry_flags where k in (select 'e' || id::text from contest_entries where device = any(v) and not (device = any(ex)))
                                     or k in (select id::text from contest_entries where device = any(v) and not (device = any(ex)));
      delete from contest_entries where device = any(v); get diagnostics n = row_count;
    end if;
    r := r || jsonb_build_object('entries', coalesce((r ->> 'entries')::int, 0) + n);
  end if;

  if 'answers' = any(w) then
    if p_dry then select count(*) into n from mc2_answers where device = any(v) and not (device = any(ex));
    else delete from mc2_answers where device = any(v); get diagnostics n = row_count; end if;
    r := r || jsonb_build_object('answers', coalesce((r ->> 'answers')::int, 0) + n);
  end if;

  if 'chat' = any(w) then
    if p_dry then select count(*) into n from mc2_ac_messages where voter = any(v);
    else
      delete from mc2_ac_reactions where voter = any(v);
      delete from mc2_ac_seen where voter = any(v);
      delete from mc2_ac_here where voter = any(v);
      delete from mc2_ac_events where voter = any(v);
      delete from mc2_ac_messages where voter = any(v); get diagnostics n = row_count;
    end if;
    r := r || jsonb_build_object('chat', n);
  end if;

  if 'mod' = any(w) then
    if p_dry then select count(*) into n from mc2_ac_mod where voter = any(v); select count(*) into m from mc2_ac_warns where voter = any(v); n := n + m;
    else
      delete from mc2_ac_modlog where voter = any(v);
      delete from mc2_ac_reports where target = any(v) or reporter = any(v);
      delete from mc2_ac_warns where voter = any(v); get diagnostics m = row_count;
      delete from mc2_ac_mod where voter = any(v); get diagnostics n = row_count; n := n + m;
    end if;
    r := r || jsonb_build_object('mod', n);
  end if;

  -- সবশেষে (বাকি সব মোছার পর) ভিজিটর রেকর্ড। ইউজার আবার সাইটে ঢুকলে নতুন করে তালিকায় আসবে।
  if 'visitor' = any(w) then
    if p_dry then select count(*) into n from mc2_presence where voter = any(v) and not (voter = any(ex));
    else delete from mc2_presence where voter = any(v); get diagnostics n = row_count; end if;
    r := r || jsonb_build_object('visitor', coalesce((r ->> 'visitor')::int, 0) + n);
  end if;
  return r;
end $$;
revoke all on function mc2_admin_users_del(text[], text[], boolean, boolean) from public, anon;
grant execute on function mc2_admin_users_del(text[], text[], boolean, boolean) to authenticated;
notify pgrst, 'reload schema';

select 'ইউজার মোছার ফাংশন (সুরক্ষিত)' as item, to_regprocedure('mc2_admin_users_del(text[],text[],boolean,boolean)') is not null as ok
union all
select 'ডিলিট-লগ টেবিল', to_regclass('mc2_del_log') is not null;

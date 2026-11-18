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

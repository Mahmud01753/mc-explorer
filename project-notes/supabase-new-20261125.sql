-- supabase-new-20261125.sql  (✅ চালানো — মালিক নিজে নিশ্চিত করেছেন, ২০২৬-১০-৩০)
-- Supabase > SQL Editor-এ একবার Run করুন। আবার চালালেও কিছু ভাঙে না। আগে চালানো থাকতে হবে: 20261019b, 20261110, 20261113।
-- ১) কার্ড ডিলিট: ইউজারের শেষ কার্ড মুছলে তার উত্তর, ভিজিটর রেকর্ড, টপ-হিস্টরি, এন্ট্রির ফ্ল্যাগও বিনে জমা হবে
--    (আগে এগুলো বিনে না গিয়ে চিরতরে যেত)। স্কোর ও এন্ট্রি আগে থেকেই বিনে যায়।
-- ২) বিন থেকে কার্ড "ফেরান" দিলে ওই ইউজারের একই সময়ে মোছা সব ডেটা (স্কোর, উত্তর, এন্ট্রি, ভিজিটর রেকর্ড, টপ-হিস্টরি, ফ্ল্যাগ) একসাথে ফিরে আসবে।
--    ব্যতিক্রম: কনটেস্ট স্ক্রিনশটের ছবি-ফাইল ফেরে না (সেটা সাথে সাথেই মোছা, ফিরিয়ে আনা যায় না)।
-- ৩) কার্ডওয়ালা ইউজারের স্কোর/এন্ট্রি মোছা আটকালে আর বিনে ভুয়া কপি জমবে না, আর স্ক্রিনশট ফাইলও মুছবে না
--    (সুরক্ষা-ট্রিগার এখন বিন-ট্রিগারের আগে চলে: নাম a0_… দেওয়া হলো)।
-- ৪) চ্যাট বার্তা (বা বিভাগ/সেশন) মুছলে তার ফাইলও পাবলিক বাকেট mc2-chat থেকে মুছবে।
-- ৫) submit_entry: স্ক্রিনশট লিংক শুধু https:// হতে হবে (javascript: ইত্যাদি সার্ভারেই আটকাবে)।

-- ===== ১) কার্ড ক্যাসকেড: মোছার আগে বিনে কপি =====
create or replace function mc2_cards_cascade() returns trigger language plpgsql security definer set search_path = public as $$
declare ds text[]; nb boolean := coalesce(current_setting('mc2.nobin', true), '') = 'on';
begin
  -- যেসব ডিভাইসের এই স্টেটমেন্টে কার্ড মুছেছে এবং আর একটাও কার্ড বাকি নেই
  select coalesce(array_agg(distinct o.device), '{}') into ds from old_rows o where not exists (select 1 from mc2_cards c where c.device = o.device);
  if cardinality(ds) = 0 then return null; end if;
  if not nb then
    insert into mc2_bin(src, row, bytes) select 'mc2_answers', to_jsonb(a), pg_column_size(a) from mc2_answers a where a.device = any(ds);
    insert into mc2_bin(src, row, bytes) select 'mc2_presence', to_jsonb(p), pg_column_size(p) from mc2_presence p where p.voter = any(ds);
    insert into mc2_bin(src, row, bytes) select 'mc2_top_hist', to_jsonb(h), pg_column_size(h) from mc2_top_hist h where h.device = any(ds);
    insert into mc2_bin(src, row, bytes) select 'mc2_entry_flags', to_jsonb(f), pg_column_size(f) from mc2_entry_flags f
      where f.k in (select 'e' || id::text from contest_entries where device = any(ds)) or f.k in (select id::text from contest_entries where device = any(ds));
  end if;
  delete from mc2_top_hist where device = any(ds);
  delete from mc2_entry_flags where k in (select 'e' || id::text from contest_entries where device = any(ds)) or k in (select id::text from contest_entries where device = any(ds));
  delete from contest_entries where device = any(ds);   -- বিনে যায় (mc2_bin_t); স্ক্রিনশট ফাইল সাথে সাথে মোছে
  delete from mc2_answers where device = any(ds);
  delete from mc2_scores where device = any(ds);        -- বিনে যায় (mc2_bin_t)
  delete from mc2_presence where voter = any(ds);
  return null;
end $$;
revoke all on function mc2_cards_cascade() from public, anon, authenticated;

-- ===== ২) বিন থেকে ফেরানো: কার্ডের সাথে বাকি সব =====
create or replace function mc2_bin_put(p_src text, p_row jsonb) returns int language plpgsql security definer set search_path = public as $$
declare n int; ident boolean;
begin
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = p_src and is_identity = 'YES') into ident;
  execute format('insert into %I %s select * from jsonb_populate_record(null::%I, $1) on conflict do nothing', p_src, case when ident then 'overriding system value' else '' end, p_src) using p_row;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function mc2_bin_put(text, jsonb) from public, anon, authenticated;

create or replace function mc2_bin_restore(p_id bigint) returns text language plpgsql security definer set search_path = public as $$
declare b record; s record; dev text;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select * into b from mc2_bin where id = p_id;
  if not found then return 'missing'; end if;
  if b.src not in ('mc2_cards', 'contest_entries', 'mc2_scores', 'mc2_visits', 'mc2_answers', 'mc2_ufolder_members', 'mc2_presence', 'mc2_top_hist', 'mc2_entry_flags') then return 'unsupported'; end if;
  if mc2_bin_put(b.src, b.row) = 0 then return 'exists'; end if;
  perform set_config('mc2.keepfile', 'on', true);
  delete from mc2_bin where id = p_id;
  if b.src = 'mc2_cards' then
    dev := b.row ->> 'device';
    -- একই লেনদেনে (একই deleted_at) ওই ডিভাইসের মোছা বাকি ডেটা
    for s in select * from mc2_bin x
      where x.id <> p_id and x.deleted_at = b.deleted_at
        and x.src in ('mc2_scores', 'mc2_answers', 'contest_entries', 'mc2_presence', 'mc2_top_hist', 'mc2_entry_flags')
        and ( (x.src = 'mc2_presence' and x.row ->> 'voter' = dev)
           or (x.src in ('mc2_scores', 'mc2_answers', 'contest_entries', 'mc2_top_hist') and x.row ->> 'device' = dev)
           or (x.src = 'mc2_entry_flags' and exists (select 1 from mc2_bin e where e.src = 'contest_entries' and e.deleted_at = b.deleted_at and e.row ->> 'device' = dev
                 and (x.row ->> 'k' = 'e' || (e.row ->> 'id') or x.row ->> 'k' = e.row ->> 'id'))) )
      order by x.id
    loop
      perform mc2_bin_put(s.src, s.row);
      delete from mc2_bin where id = s.id;
    end loop;
  end if;
  perform set_config('mc2.keepfile', '', true);
  return 'ok';
end $$;
grant execute on function mc2_bin_restore(bigint) to authenticated;

-- ===== ৩) সুরক্ষা-ট্রিগার আগে চলুক (নামের বর্ণানুক্রমে), তাহলে আটকালে বিনে ভুয়া কপি/ফাইল-মোছা হয় না =====
drop trigger if exists t_mc2_scores_cardlock on mc2_scores;
drop trigger if exists a0_mc2_scores_cardlock on mc2_scores;
create trigger a0_mc2_scores_cardlock before delete on mc2_scores for each row execute function mc2_protect_card_del('device');
drop trigger if exists t_contest_entries_cardlock on contest_entries;
drop trigger if exists a0_contest_entries_cardlock on contest_entries;
create trigger a0_contest_entries_cardlock before delete on contest_entries for each row execute function mc2_protect_card_del('device');

-- ===== ৪) চ্যাট বার্তা মুছলে ফাইলও মোছা =====
create or replace function mc2_ac_msg_file_gc() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.file_path is not null and not exists (select 1 from mc2_ac_messages m where m.file_path = old.file_path) then
    begin
      perform set_config('storage.allow_delete_query', 'true', true);
      delete from storage.objects where bucket_id = 'mc2-chat' and name = old.file_path;
    exception when others then null;
    end;
  end if;
  return old;
end $$;
revoke all on function mc2_ac_msg_file_gc() from public, anon, authenticated;
drop trigger if exists t_mc2_ac_msg_file_gc on mc2_ac_messages;
create trigger t_mc2_ac_msg_file_gc after delete on mc2_ac_messages for each row execute function mc2_ac_msg_file_gc();

-- ===== ৫) স্ক্রিনশট লিংক যাচাই =====
create or replace function submit_entry(p_name text, p_link text, p_shot text, p_contact text, p_pct int, p_score int, p_device text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then raise exception 'bad name'; end if;
  if p_link is null or length(p_link) > 400 or p_link !~* '^https?://([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)/' then raise exception 'bad link'; end if;
  if p_shot is null or length(p_shot) > 500 or p_shot !~ '^https://[^[:space:]"''<>]+$' then raise exception 'bad shot'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('entry:ip:' || mc2_ip(), mc2_lim('ip_entry_hr'), 3600) then raise exception 'slow'; end if;
  insert into contest_entries (name, fb_link, shot_url, contact, pct, score, device)
  values (trim(p_name), trim(p_link), p_shot, nullif(left(trim(coalesce(p_contact, '')), 300), ''), p_pct, p_score, nullif(left(coalesce(p_device, ''), 80), ''))
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'duplicate';
end $$;

notify pgrst, 'reload schema';

-- যাচাই: সব সারিতে true এলে ঠিক
select 'cardlock আগে চলে (scores)' as item, exists (select 1 from pg_trigger where tgname = 'a0_mc2_scores_cardlock') as ok
union all select 'cardlock আগে চলে (entries)', exists (select 1 from pg_trigger where tgname = 'a0_contest_entries_cardlock')
union all select 'চ্যাট ফাইল-মোছা ট্রিগার', exists (select 1 from pg_trigger where tgname = 't_mc2_ac_msg_file_gc')
union all select 'mc2_bin_put', exists (select 1 from pg_proc where proname = 'mc2_bin_put')
union all select 'mc2_cards_cascade (বিনসহ)', exists (select 1 from pg_proc where proname = 'mc2_cards_cascade' and prosrc like '%mc2_presence%mc2_bin%' or proname = 'mc2_cards_cascade' and prosrc like '%insert into mc2_bin%')
union all select 'submit_entry https-যাচাই', exists (select 1 from pg_proc where proname = 'submit_entry' and prosrc like '%bad shot%' and prosrc like '%https://%');

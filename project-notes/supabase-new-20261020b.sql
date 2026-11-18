-- supabase-new-20261020b.sql — পার্ট ৫: স্ক্রিনশট ও বিন (একবার Run; আগে ব্যাকআপ; ...19c ও ...20 আগে চালানো থাকতে হবে)
-- ১) Storage চাপে স্ক্রিনশট মোছা বন্ধ (mc2_cleanup_stage থেকে 'sshot' ধাপ বাদ; mc2_shot_stage এখন কিছুই মোছে না)।
-- ২) শুধু Verified স্ক্রিনশট, যাচাইয়ের shot_ok_days (ডিফল্ট ৭) দিন পর মুছবে। shot_no_days এখন আর কাজ করে না।
--    অবস্থা (mc2_entry_flags.st): ok=Verified | no=Unverified | কোনো ফ্ল্যাগ নেই=Pending | ex/nr/অন্য=Unknown।
--    ফ্ল্যাগের চাবি অ্যাডমিন অ্যাপের মতোই: device থাকলে 'd:'||device, নইলে 'n:'||lower(trim(name)); একটাই চাবি দেখা হয়।
-- ৩) বিন: মেয়াদ bin_days (ডিফল্ট ৩০); bin_days = ০ বা অটো-ক্লিন বন্ধ থাকলে বিন কখনো নিজে খালি হয় না (চাপের ধাপেও না)।

create or replace function mc2_shot_status(p_dev text, p_name text) returns text language sql stable security definer set search_path = public as $$
  select case coalesce((select f.st from mc2_entry_flags f
                         where f.k = case when nullif(trim(coalesce(p_dev, '')), '') is not null then 'd:' || p_dev else 'n:' || lower(trim(coalesce(p_name, ''))) end), '')
    when 'ok' then 'verified' when 'no' then 'unverified' when '' then 'pending' else 'unknown' end $$;

create or replace function mc2_shot_ok_at(p_dev text, p_name text) returns timestamptz language sql stable security definer set search_path = public as $$
  select f.at from mc2_entry_flags f
   where f.st = 'ok' and f.k = case when nullif(trim(coalesce(p_dev, '')), '') is not null then 'd:' || p_dev else 'n:' || lower(trim(coalesce(p_name, ''))) end $$;
create or replace function mc2_shot_ok(p_dev text, p_name text) returns boolean language sql stable security definer set search_path = public as $$
  select mc2_shot_status(p_dev, p_name) = 'verified' $$;
revoke all on function mc2_shot_status(text, text), mc2_shot_ok_at(text, text), mc2_shot_ok(text, text) from public, anon, authenticated;

-- জায়গার চাপে কখনো স্ক্রিনশট মোছে না
create or replace function mc2_shot_stage(p_lim int, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
begin o_bytes := 0; o_n := 0; end $$;
revoke all on function mc2_shot_stage(int) from public, anon, authenticated;

create or replace function mc2_cleanup_stage(p_stage text, p_lim int, p_c jsonb, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
declare t record; bb bigint; nn int; paths text[]; ca int := coalesce((p_c ->> 'card_min_days')::int, 0);
begin
  o_bytes := 0; o_n := 0;
  perform set_config('mc2.nobin', 'on', true);
  if p_stage = 'bin' and coalesce((p_c ->> 'bin_days')::int, 0) <= 0 then null;  -- বিন OFF (০ দিন): চাপেও বিন খালি হবে না
  elsif p_stage = 'bin' then
    with d as (delete from mc2_bin where id in (select id from mc2_bin order by deleted_at limit p_lim) returning bytes) select coalesce(sum(bytes), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'chat' then
    with d as (delete from mc2_ac_messages where id in (select id from mc2_ac_messages order by id limit p_lim) returning file_path, pg_column_size(mc2_ac_messages.*) b)
      select coalesce(sum(b), 0), count(*), coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into o_bytes, o_n, paths from d;
    if array_length(paths, 1) > 0 then
      begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'mc2-chat' and name = any (paths); exception when others then null; end;
    end if;
  elsif p_stage = 'extra' then
    with d as (delete from mc2_cards where id in (select x.id from (select id, pinned, updated_at, row_number() over (partition by device order by updated_at desc) rn from mc2_cards) x where x.rn > 5 and not x.pinned order by x.updated_at limit p_lim) returning pg_column_size(mc2_cards.*) b)
      select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'low' then
    for t in select * from (values ('mc2_visits', 'created_at'), ('mc2_answers', 'created_at'), ('mc2_presence', 'last_seen')) v(tbl, col) loop
      execute format('with d as (delete from %I where ctid = any(array(select ctid from %I order by %I limit %s)) returning pg_column_size(%I.*) b) select coalesce(sum(b), 0), count(*) from d', t.tbl, t.tbl, t.col, p_lim, t.tbl) into bb, nn;
      o_bytes := o_bytes + bb; o_n := o_n + nn; exit when o_n > 0;
    end loop;
  elsif p_stage = 'cards' then
    with d as (delete from mc2_cards where id in (select x.id from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3 and x.updated_at < now() - make_interval(days => ca) order by x.updated_at limit p_lim) returning pg_column_size(mc2_cards.*) b)
      select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
  elsif p_stage = 'schat' then
    begin
      perform set_config('storage.allow_delete_query', 'true', true);
      with d as (delete from storage.objects where id in (select id from storage.objects where bucket_id = 'mc2-chat' order by created_at limit p_lim) returning coalesce((metadata ->> 'size')::bigint, 0) b) select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
    exception when others then o_bytes := 0; o_n := 0; end;
  end if;
  perform set_config('mc2.nobin', '', true);
end $$;

-- শুধু Verified: যাচাইয়ের shot_ok_days দিন পর ছবির ফাইল মোছে (লগ-সারি থাকে, shot_url = 'deleted')। Unverified/Unknown/Pending কখনো নয়।
create or replace function mc2_shot_purge() returns int language plpgsql security definer set search_path = public as $$
declare ok int := coalesce((mc2_cleanup_cfg_get() ->> 'shot_ok_days')::int, 7); ids bigint[]; n int := 0;
begin
  if ok > 0 then
    select coalesce(array_agg(x.id), '{}') into ids from (
      select e.id from contest_entries e
       where e.shot_url like '%/object/public/contest/%' and mc2_shot_status(e.device, e.name) = 'verified'
         and mc2_shot_ok_at(e.device, e.name) < now() - make_interval(days => ok) limit 200) x;
    if array_length(ids, 1) > 0 then perform mc2_shot_remove(ids); n := array_length(ids, 1); end if;
  end if;
  if n > 0 then insert into mc2_cleanup_log(what, n, note) values ('shots', n, 'verified+' || ok || 'd'); end if;
  return n;
end $$;
revoke all on function mc2_shot_purge() from public, anon, authenticated;

-- বিন: OFF (bin_days = 0) বা অটো-ক্লিন বন্ধ থাকলে কিছুই মোছে না
create or replace function mc2_bin_sweep() returns int language plpgsql security definer set search_path = public as $$
declare d int := mc2_lim('bin_days'); n int := 0;
begin
  if not coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true) then return 0; end if;
  if d > 0 then delete from mc2_bin where deleted_at < now() - make_interval(days => d); get diagnostics n = row_count; end if;
  return n;
end $$;
revoke all on function mc2_bin_sweep() from public, anon, authenticated;

-- সেভ করা পুরোনো shot_no_days সরানো (এটা এখন অব্যবহৃত)
update mc2_cleanup_cfg set cfg = cfg - 'shot_no_days' where id = 1;

select 'ok' as result, (select count(*) from contest_entries where shot_url like '%/object/public/contest/%') as shots_left;

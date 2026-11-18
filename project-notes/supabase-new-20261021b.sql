-- supabase-new-20261021b.sql — অটো-ক্লিন নিয়ম (একবার Run; আবার চালালেও ক্ষতি নেই; ...19c ও ...20b আগে চালানো থাকতে হবে)
-- ১) advisory lock: ক্লিনআপ একসাথে দুই জায়গা থেকে চলবে না (pg_try_advisory_xact_lock; না পেলে অপেক্ষা নয়, বাদ)। ড্রাই-রান লক নেয় না।
-- ২) কার্ড: অটো-ক্লিন ডিভাইসের সর্বশেষ ৫টি কার্ড ও টপ ৩ (pinned) কখনো মোছে না — শেষ 'cards' ধাপ বন্ধ; শুধু 'extra' ধাপ ৫টির বাইরেরগুলো (pinned বাদে) মোছে। নিজে মুছতে চাইলে অ্যাডমিন > বিন > ম্যানুয়াল মোছা (দিন-ফিল্টার + "টপসহ" অপশন) আগের মতোই আছে।
-- ৩) কাটার গতি আগের মতোই অপরিবর্তিত: ৯০% ছুঁলে শুরু, ছোট লক্ষ্য (stop ৮৭%, দ্রুত আবার ভরলে step ২% করে গভীরে), প্রতি রানে ১ ব্যাচ, ৮০% মেঝে। ৮০%-এ একটানে নামানোর চেষ্টা নেই।
-- ৪) অটো-ক্লিন OFF রাখা: অ্যাডমিন > অটো-ক্লিন > "অটো-ক্লিন চালু" টিক তুলে সেভ (আগে থেকেই আছে), অথবা SQL-এ জোর করে বন্ধ: select mc2_cleanup_stop_now();   আবার চালু: select mc2_cleanup_resume();   অবস্থা দেখা: select mc2_cleanup_status();
--    বন্ধ থাকলে tick-এর সব কাজ (ভিজিট/বিন/স্ক্রিনশট/ক্লিনআপ) থামে। ম্যানুয়াল মোছা ও চ্যাটের নিজস্ব মেয়াদ এই সুইচে বন্ধ হয় না।
-- ৫) mc2_bin_sweep: একবারে সর্বোচ্চ ২০০০ সারি। কোনো TRUNCATE নেই; সব ডিলিটে WHERE আছে।
-- ফাংশনগুলো ...19c / ...20b-র কপি, শুধু নির্দেশিত অংশ বদলানো।

create or replace function mc2_cleanup_lock() returns boolean language sql volatile security definer set search_path = public as $$
  select pg_try_advisory_xact_lock(hashtext('mc2_cleanup'))
$$;
revoke all on function mc2_cleanup_lock() from public, anon, authenticated;

-- mc2_cleanup_stage: ...20b-র কপি; শুধু 'cards' ধাপ বন্ধ
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
  elsif p_stage = 'cards' then null;   -- বন্ধ: কার্ড এখন শুধু 'extra' ধাপে (ডিভাইসে নতুন ৫টির বাইরেরগুলো, pinned বাদে) মোছে; টপ/pinned ও ডিভাইসের সর্বশেষ ৫টি কখনো নয়
  elsif p_stage = 'schat' then
    begin
      perform set_config('storage.allow_delete_query', 'true', true);
      with d as (delete from storage.objects where id in (select id from storage.objects where bucket_id = 'mc2-chat' order by created_at limit p_lim) returning coalesce((metadata ->> 'size')::bigint, 0) b) select coalesce(sum(b), 0), count(*) into o_bytes, o_n from d;
    exception when others then o_bytes := 0; o_n := 0; end;
  end if;
  perform set_config('mc2.nobin', '', true);
end $$;
revoke all on function mc2_cleanup_stage(text, int, jsonb) from public, anon, authenticated;

-- mc2_cleanup_run: ...19c-র কপি; শুধু লক-লাইন যোগ + 'cards' ধাপ বাদ (বাকি সব আগের মতো)
create or replace function mc2_cleanup_run(p_dry boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); m text; lim bigint; used bigint; pct numeric; stp numeric; fl numeric := (c ->> 'floor_pct')::numeric; sp numeric := (c ->> 'start_pct')::numeric; s0 numeric := (c ->> 'stop_pct')::numeric;
  st record; goal bigint; stg text; r record; freed bigint; rem bigint; res jsonb := jsonb_build_object('dry', p_dry); lot int := greatest((c ->> 'batch')::int, 1);
begin
  if not coalesce((c ->> 'on')::boolean, true) then return jsonb_build_object('on', false); end if;
  if not p_dry and not mc2_cleanup_lock() then return jsonb_build_object('busy', true); end if;   -- অন্য ক্লিনআপ চলছে: এটা কিছু মুছবে না
  foreach m in array array['db', 'st'] loop
    if m = 'db' then used := pg_database_size(current_database()); lim := (c ->> 'db_mb')::bigint * 1048576;
    else select coalesce(sum((metadata ->> 'size')::bigint), 0) into used from storage.objects; lim := (c ->> 'storage_mb')::bigint * 1048576; end if;
    pct := round(used * 100.0 / lim, 1);
    res := res || jsonb_build_object(m || '_pct', pct);
    if m = 'db' then res := res || jsonb_build_object('pct', pct, 'size_mb', round(used / 1048576.0, 1), 'cards', (select count(*) from mc2_cards)); end if;
    insert into mc2_cleanup_state(k, stop) values (m, s0) on conflict (k) do nothing;
    select * into st from mc2_cleanup_state where k = m;
    if not st.active then
      if pct < sp then
        if not p_dry and st.ended is not null and st.ended < now() - interval '3 days' and st.stop <> s0 then update mc2_cleanup_state set stop = s0 where k = m; end if;
        continue;
      end if;
      stp := st.stop;
      if st.ended is not null and st.ended > now() - interval '24 hours' then stp := stp - (c ->> 'step_pct')::numeric; end if;
      stp := greatest(fl, least(stp, sp - 1));
      goal := least(((pct - stp) / 100.0 * lim)::bigint, (lim * 0.15)::bigint);
      res := res || jsonb_build_object(m || '_stop', stp, m || '_goal_mb', round(goal / 1048576.0, 1));
      if goal <= 0 or p_dry then continue; end if;
      update mc2_cleanup_state set stop = stp, active = true, remain = goal where k = m;
    else
      if p_dry then res := res || jsonb_build_object(m || '_active', true, m || '_remain_mb', round(st.remain / 1048576.0, 1)); continue; end if;
      if pct <= fl or (m = 'st' and pct <= st.stop) then update mc2_cleanup_state set active = false, ended = now() where k = m; continue; end if;
    end if;
    freed := 0;
    foreach stg in array (case when m = 'db' then array['bin', 'chat', 'extra', 'low']   /* 'cards' ধাপ আর নেই */ else array['schat', 'sshot'] end) loop
      select * into r from mc2_cleanup_stage(stg, case when stg = 'cards' then greatest((c ->> 'card_batch')::int, 1) else lot end, c);
      if r.o_n > 0 then
        freed := r.o_bytes;
        insert into mc2_cleanup_log(what, n, note) values (stg, r.o_n, m || ' ' || pct || '%');
        res := res || jsonb_build_object('stage_' || m, stg, 'n_' || m, r.o_n);
        exit;
      end if;
    end loop;
    select remain - freed into rem from mc2_cleanup_state where k = m;
    if freed = 0 or rem <= 0 then update mc2_cleanup_state set active = false, ended = now(), remain = 0 where k = m;
    else update mc2_cleanup_state set remain = rem where k = m; end if;
  end loop;
  return res;
end $$;
revoke all on function mc2_cleanup_run(boolean) from public, anon, authenticated;

create or replace function mc2_cleanup_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true) then return; end if;   -- জোর করে বন্ধ করা থাকলে কিছুই চলবে না
  if mc2_cleanup_lock() then
    if mc2_ac_rl('cleanup', 1, 600) then
      perform mc2_cleanup_visits(); perform mc2_bin_sweep(); perform mc2_shot_purge(); perform mc2_cleanup_run(false);
    end if;
  end if;
exception when others then null;
end $$;
revoke all on function mc2_cleanup_tick() from public, anon, authenticated;

create or replace function mc2_bin_sweep() returns int language plpgsql security definer set search_path = public as $$
declare d int := mc2_lim('bin_days'); n int := 0;
begin
  if not coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true) then return 0; end if;
  if d > 0 then
    delete from mc2_bin where id in (select b.id from mc2_bin b where b.deleted_at < now() - make_interval(days => d) order by b.deleted_at limit 2000);
    get diagnostics n = row_count;
  end if;
  return n;
end $$;
revoke all on function mc2_bin_sweep() from public, anon, authenticated;

-- জোর করে বন্ধ (SQL Editor থেকে): অটো-ক্লিন OFF + চলমান অবস্থা বাতিল + চলতে থাকা ক্লিনআপ কোয়েরি থামানোর চেষ্টা
create or replace function mc2_cleanup_stop_now() returns text language plpgsql security definer set search_path = public as $$
declare k int := 0;
begin
  insert into mc2_cleanup_cfg(id, cfg) values (1, jsonb_build_object('on', false))
    on conflict (id) do update set cfg = mc2_cleanup_cfg.cfg || jsonb_build_object('on', false);
  update mc2_cleanup_state set active = false, remain = 0, ended = now();
  begin
    select count(pg_cancel_backend(pid)) into k from pg_stat_activity
     where pid <> pg_backend_pid() and datname = current_database() and state = 'active' and query ilike '%mc2_cleanup_%';
  exception when others then k := -1;   -- অনুমতি না থাকলে: সুইচ OFF-ই যথেষ্ট, চলমান ব্যাচ নিজে শেষ হবে
  end;
  insert into mc2_cleanup_log(what, n, note) values ('stop_now', 0, 'manual force stop; cancelled=' || k);
  return 'বন্ধ করা হয়েছে (auto-clean OFF). cancelled=' || k;
end $$;

create or replace function mc2_cleanup_resume() returns text language plpgsql security definer set search_path = public as $$
begin
  insert into mc2_cleanup_cfg(id, cfg) values (1, jsonb_build_object('on', true))
    on conflict (id) do update set cfg = mc2_cleanup_cfg.cfg || jsonb_build_object('on', true);
  insert into mc2_cleanup_log(what, n, note) values ('resume', 0, 'manual resume');
  return 'চালু করা হয়েছে (auto-clean ON)';
end $$;

-- অবস্থা দেখা: চালু/বন্ধ, ডাটাবেজ আসল মাপ ও %, চলমান অবস্থা, শেষ ১০ লগ। কিছু বদলায় না।
create or replace function mc2_cleanup_status() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'on', coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true),
    'db_mb', round(pg_database_size(current_database()) / 1048576.0, 1),
    'db_pct', round(pg_database_size(current_database()) * 100.0 / ((mc2_cleanup_cfg_get() ->> 'db_mb')::numeric * 1048576), 1),
    'start_pct', mc2_cleanup_cfg_get() ->> 'start_pct', 'floor_pct', mc2_cleanup_cfg_get() ->> 'floor_pct',
    'state', coalesce((select jsonb_agg(to_jsonb(s)) from mc2_cleanup_state s), '[]'::jsonb),
    'last', coalesce((select jsonb_agg(to_jsonb(l)) from (select ts, what, n, note from mc2_cleanup_log order by id desc limit 10) l), '[]'::jsonb))
$$;
revoke all on function mc2_cleanup_stop_now(), mc2_cleanup_resume(), mc2_cleanup_status() from public, anon, authenticated;

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select 'mc2_cleanup_lock' as item, exists (select 1 from pg_proc where proname = 'mc2_cleanup_lock') as ok
union all select 'mc2_cleanup_run-এ লক', (select prosrc like '%mc2_cleanup_lock%' from pg_proc where proname = 'mc2_cleanup_run' limit 1)
union all select 'mc2_cleanup_run-এ cards ধাপ নেই', (select prosrc not like '%''low'', ''cards''%' from pg_proc where proname = 'mc2_cleanup_run' limit 1)
union all select 'mc2_cleanup_stage-এ cards বন্ধ', (select prosrc like '%p_stage = ''cards'' then null%' from pg_proc where proname = 'mc2_cleanup_stage' limit 1)
union all select 'mc2_cleanup_tick-এ লক ও সুইচ', (select prosrc like '%mc2_cleanup_lock%' and prosrc like '%''on''%' from pg_proc where proname = 'mc2_cleanup_tick' limit 1)
union all select 'mc2_bin_sweep-এ সীমা ২০০০', (select prosrc like '%limit 2000%' from pg_proc where proname = 'mc2_bin_sweep' limit 1)
union all select 'বন্ধ/চালু/অবস্থা ফাংশন', (select count(*) = 3 from pg_proc where proname in ('mc2_cleanup_stop_now', 'mc2_cleanup_resume', 'mc2_cleanup_status'));

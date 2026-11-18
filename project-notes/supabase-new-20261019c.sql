-- supabase-new-20261019c.sql (ধাপ ২: ৯০% শুরু, সীমা শিখে থামা, ৮০ মেঝে, ক্রম মেনে কাটা)
-- আগে ...19.sql ও ...19b.sql চালান। ব্যাকআপ নিন। অ্যাডমিনে আগে সেভ করা start_pct/card_pct (যেমন ৭০/৮০) ডিফল্টের ওপরে থাকে, সেগুলো ৯০ করে দিন।
create table if not exists mc2_cleanup_state (k text primary key, stop numeric not null, active boolean not null default false, remain bigint not null default 0, ended timestamptz);
alter table mc2_cleanup_state enable row level security; revoke all on mc2_cleanup_state from anon, authenticated;

create or replace function mc2_cleanup_defaults() returns jsonb language sql immutable as $$
  select jsonb_build_object('on', true, 'others_on', true, 'db_mb', 500, 'start_pct', 90, 'card_pct', 90, 'card_max', 1000000, 'batch', 200, 'card_batch', 50,
    'min_age_days', 7, 'card_min_days', 0, 'visits_days', 0, 'visits_max', 3000, 'bin_days', 30, 'answers_days', 0, 'presence_days', 60, 'cards_days', 0,
    'stop_pct', 87, 'floor_pct', 80, 'step_pct', 2, 'storage_mb', 1024, 'shot_ok_days', 7, 'shot_no_days', 0, 'ip_view_min', 600, 'ip_card_hr', 1500, 'ip_score_hr', 1500, 'ip_entry_hr', 300, 'score_dev_hr', 30, 'visit_dev_hr', 40, 'card_per_dev', 20, 'card_gap_sec', 2)
$$;

create or replace function mc2_cleanup_cfg_get() returns jsonb language sql stable security definer set search_path = public as $$
  select mc2_cleanup_defaults() || coalesce((select cfg from mc2_cleanup_cfg where id = 1), '{}'::jsonb)
$$;

create or replace function mc2_lim(p_k text) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (cfg ->> p_k)::int from mc2_cleanup_cfg where id = 1), (mc2_cleanup_defaults() ->> p_k)::int)
$$;

create or replace function mc2_cleanup_cards(p_n int, p_days int, p_dry boolean, p_note text) returns int
language plpgsql security definer set search_path = public as $$
declare d int := 0;
begin
  if p_n <= 0 then return 0; end if;
  -- টপ ৩ (এখন বা কখনো) ও pinned কখনো নয়। শুধু কার্ড মোছে: mc2_scores (স্কোর) ও ইউজার ইনফো টেবিল অক্ষত থাকে।
  if p_dry then
    select count(*) into d from (select 1 from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3
      and x.updated_at < now() - make_interval(days => p_days) limit p_n) z;
  else
    delete from mc2_cards where id in (select x.id from mc2_cards x where not x.pinned and (select count(*) from mc2_cards y where y.score > x.score) >= 3
      and x.updated_at < now() - make_interval(days => p_days) order by x.updated_at limit p_n);
    get diagnostics d = row_count;
    if d > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_cards', d, p_note); end if;
  end if;
  return d;
end $$;

create or replace function mc2_cleanup_admin_set(p_cfg jsonb) returns void language plpgsql security definer set search_path = public as $$
declare k text; v numeric; lo numeric; hi numeric;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_cfg is null or jsonb_typeof(p_cfg) <> 'object' then raise exception 'bad cfg'; end if;
  for k in select jsonb_object_keys(p_cfg) loop
    if k in ('on', 'others_on') then
      if jsonb_typeof(p_cfg -> k) <> 'boolean' then raise exception '% must be true/false', k; end if;
    else
      if k not in ('db_mb', 'start_pct', 'card_pct', 'card_max', 'batch', 'card_batch', 'min_age_days', 'card_min_days', 'visits_days', 'answers_days', 'presence_days', 'cards_days',
                   'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'card_gap_sec', 'visits_max', 'bin_days', 'stop_pct', 'floor_pct', 'step_pct', 'storage_mb', 'shot_ok_days', 'shot_no_days') then raise exception 'unknown key %', k; end if;
      if jsonb_typeof(p_cfg -> k) <> 'number' then raise exception '% must be a number', k; end if;
      v := (p_cfg ->> k)::numeric;
      lo := case when k in ('db_mb', 'batch', 'card_batch', 'min_age_days', 'card_max', 'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'visits_max', 'step_pct', 'storage_mb') then 1 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 10 else 0 end;
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 99 when k = 'step_pct' then 20 when k = 'storage_mb' then 100000 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k = 'card_max' then 1000000
                 when k in ('ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr') then 1000000 when k in ('score_dev_hr', 'visit_dev_hr') then 100000 when k = 'card_per_dev' then 1000 when k = 'visits_max' then 1000000 when k = 'card_gap_sec' then 60 else 3650 end;
      if v < lo or v > hi or v <> trunc(v) then raise exception '% must be a whole number % to %', k, lo, hi; end if;
    end if;
  end loop;
  insert into mc2_cleanup_cfg(id, cfg) values (1, p_cfg) on conflict (id) do update set cfg = excluded.cfg;
end $$;

create or replace function mc2_cleanup_stage(p_stage text, p_lim int, p_c jsonb, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
declare t record; bb bigint; nn int; paths text[]; ca int := coalesce((p_c ->> 'card_min_days')::int, 0);
begin
  o_bytes := 0; o_n := 0;
  perform set_config('mc2.nobin', 'on', true);
  if p_stage = 'bin' then
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
  elsif p_stage = 'sshot' then
    select s.o_bytes, s.o_n into o_bytes, o_n from mc2_shot_stage(p_lim) s;
  end if;
  perform set_config('mc2.nobin', '', true);
end $$;
revoke all on function mc2_cleanup_stage(text, int, jsonb) from public, anon, authenticated;

create or replace function mc2_cleanup_run(p_dry boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); m text; lim bigint; used bigint; pct numeric; stp numeric; fl numeric := (c ->> 'floor_pct')::numeric; sp numeric := (c ->> 'start_pct')::numeric; s0 numeric := (c ->> 'stop_pct')::numeric;
  st record; goal bigint; stg text; r record; freed bigint; rem bigint; res jsonb := jsonb_build_object('dry', p_dry); lot int := greatest((c ->> 'batch')::int, 1);
begin
  if not coalesce((c ->> 'on')::boolean, true) then return jsonb_build_object('on', false); end if;
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
    foreach stg in array (case when m = 'db' then array['bin', 'chat', 'extra', 'low', 'cards'] else array['schat', 'sshot'] end) loop
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

-- ---------- পুরস্কারের স্ক্রিনশট (contest_entries.shot_url, বাকেট 'contest') ----------
-- ভেরিফাইড = mc2_entry_flags.st = 'ok' (অ্যাডমিন "পুরস্কার" পেজে বসানো), চাবি: 'd:'||device অথবা 'n:'||lower(trim(name))
-- শুধু ছবির ফাইল মোছে, লগ-সারি থাকে (shot_url = 'deleted')। বিনে যায় না।
create or replace function mc2_shot_ok_at(p_dev text, p_name text) returns timestamptz language sql stable security definer set search_path = public as $$
  select max(f.at) from mc2_entry_flags f where f.st = 'ok' and (f.k = 'n:' || lower(trim(coalesce(p_name, ''))) or (p_dev is not null and f.k = 'd:' || p_dev)) $$;
create or replace function mc2_shot_ok(p_dev text, p_name text) returns boolean language sql stable security definer set search_path = public as $$
  select mc2_shot_ok_at(p_dev, p_name) is not null $$;
revoke all on function mc2_shot_ok_at(text, text), mc2_shot_ok(text, text) from public, anon, authenticated;

create or replace function mc2_shot_remove(p_ids bigint[]) returns bigint language plpgsql security definer set search_path = public as $$
declare nm text[]; b bigint := 0;
begin
  select coalesce(array_agg(substring(shot_url from '/object/public/contest/(.+)$')), '{}') into nm from contest_entries where id = any (p_ids) and shot_url like '%/object/public/contest/%';
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    with d as (delete from storage.objects where bucket_id = 'contest' and name = any (nm) returning coalesce((metadata ->> 'size')::bigint, 0) s) select coalesce(sum(s), 0) into b from d;
    update contest_entries set shot_url = 'deleted' where id = any (p_ids) and shot_url like '%/object/public/contest/%';
  exception when others then b := 0; end;
  return b;
end $$;
revoke all on function mc2_shot_remove(bigint[]) from public, anon, authenticated;

create or replace function mc2_shot_delete(p_id bigint) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  perform mc2_shot_remove(array[p_id]);
  return true;
end $$;
grant execute on function mc2_shot_delete(bigint) to authenticated;

create or replace function mc2_shot_stage(p_lim int, out o_bytes bigint, out o_n int) language plpgsql security definer set search_path = public as $$
declare ids bigint[];
begin
  select coalesce(array_agg(x.id), '{}') into ids from (select e.id from contest_entries e where e.shot_url like '%/object/public/contest/%' and not mc2_shot_ok(e.device, e.name) order by e.created_at limit p_lim) x;
  o_n := coalesce(array_length(ids, 1), 0); o_bytes := case when o_n > 0 then mc2_shot_remove(ids) else 0 end;
end $$;
revoke all on function mc2_shot_stage(int) from public, anon, authenticated;

create or replace function mc2_shot_purge() returns int language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); ok int := (c ->> 'shot_ok_days')::int; nk int := (c ->> 'shot_no_days')::int; ids bigint[]; n int := 0;
begin
  if ok > 0 then
    select coalesce(array_agg(x.id), '{}') into ids from (select e.id from contest_entries e where e.shot_url like '%/object/public/contest/%' and mc2_shot_ok_at(e.device, e.name) < now() - make_interval(days => ok) limit 200) x;
    if array_length(ids, 1) > 0 then perform mc2_shot_remove(ids); n := n + array_length(ids, 1); end if;
  end if;
  if nk > 0 then
    select coalesce(array_agg(x.id), '{}') into ids from (select e.id from contest_entries e where e.shot_url like '%/object/public/contest/%' and not mc2_shot_ok(e.device, e.name) and e.created_at < now() - make_interval(days => nk) limit 200) x;
    if array_length(ids, 1) > 0 then perform mc2_shot_remove(ids); n := n + array_length(ids, 1); end if;
  end if;
  if n > 0 then insert into mc2_cleanup_log(what, n, note) values ('shots', n, 'age'); end if;
  return n;
end $$;
revoke all on function mc2_shot_purge() from public, anon, authenticated;

create or replace function mc2_cleanup_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  if mc2_ac_rl('cleanup', 1, 600) then
    perform mc2_cleanup_visits(); perform mc2_bin_sweep(); perform mc2_shot_purge(); perform mc2_cleanup_run(false);
  end if;
exception when others then null;
end $$;
revoke all on function mc2_cleanup_tick() from public, anon, authenticated;

-- supabase-new-20261019d.sql (ধাপ ৩: অ্যাডমিনের "বিন ও ডিলিট" পেজের জন্য ফাংশন)
-- আগে ...19, ...19b, ...19c চালান। শুধু অ্যাডমিন চালাতে পারে (mc2_is_admin)। বারবার চালালেও ভাঙে না।

create or replace function mc2_space_stats() returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); dbu bigint := pg_database_size(current_database()); stu bigint; dl bigint := (c ->> 'db_mb')::bigint * 1048576; sl bigint := (c ->> 'storage_mb')::bigint * 1048576;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select coalesce(sum((metadata ->> 'size')::bigint), 0) into stu from storage.objects;
  return jsonb_build_object(
    'db_mb', round(dbu / 1048576.0, 1), 'db_limit', (c ->> 'db_mb')::int, 'db_pct', round(dbu * 100.0 / dl, 1),
    'st_mb', round(stu / 1048576.0, 1), 'st_limit', (c ->> 'storage_mb')::int, 'st_pct', round(stu * 100.0 / sl, 1),
    'start_pct', (c ->> 'start_pct')::numeric, 'floor_pct', (c ->> 'floor_pct')::numeric,
    'buckets', coalesce((select jsonb_agg(jsonb_build_object('id', b.bucket_id, 'n', b.n, 'mb', b.mb) order by b.mb desc)
      from (select bucket_id, count(*) n, round(coalesce(sum((metadata ->> 'size')::bigint), 0) / 1048576.0, 2) mb from storage.objects group by bucket_id) b), '[]'::jsonb),
    'state', coalesce((select jsonb_object_agg(k, jsonb_build_object('stop', stop, 'active', active, 'ended', ended)) from mc2_cleanup_state), '{}'::jsonb));
end $$;

create or replace function mc2_manual_stats(p_days int default 0) returns jsonb language plpgsql security definer set search_path = public as $$
declare cut timestamptz := case when coalesce(p_days, 0) > 0 then now() - make_interval(days => p_days) else 'infinity'::timestamptz end;
  r jsonb := '{}'::jsonb; n bigint; b bigint; t record;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  for t in select * from (values ('visits', 'mc2_visits', 'created_at', 'true'), ('answers', 'mc2_answers', 'created_at', 'true'), ('presence', 'mc2_presence', 'last_seen', 'true'),
    ('chat_msgs', 'mc2_ac_messages', 'created_at', 'true'), ('cards', 'mc2_cards', 'updated_at', 'not x.pinned'), ('bin', 'mc2_bin', 'deleted_at', 'true')) v(k, tbl, col, extra) loop
    execute format('select count(*), coalesce(sum(pg_column_size(x.*)), 0) from %I x where x.%I < $1 and %s', t.tbl, t.col, t.extra) into n, b using cut;
    r := r || jsonb_build_object(t.k, jsonb_build_object('n', n, 'mb', round(b / 1048576.0, 2)));
  end loop;
  select count(*), coalesce(sum((metadata ->> 'size')::bigint), 0) into n, b from storage.objects where bucket_id = 'mc2-chat' and created_at < cut;
  r := r || jsonb_build_object('chat_files', jsonb_build_object('n', n, 'mb', round(b / 1048576.0, 2)));
  select count(*), coalesce(sum((o.metadata ->> 'size')::bigint), 0) into n, b from contest_entries e left join storage.objects o on o.bucket_id = 'contest' and o.name = substring(e.shot_url from '/object/public/contest/(.+)$') where e.shot_url like '%/object/public/contest/%' and e.created_at < cut;
  r := r || jsonb_build_object('shots', jsonb_build_object('n', n, 'mb', round(b / 1048576.0, 2)));
  select count(*) into n from contest_entries where created_at < cut;
  r := r || jsonb_build_object('shot_rows', jsonb_build_object('n', n, 'mb', 0));
  return r || jsonb_build_object('top', (select count(*) from mc2_cards where pinned));
end $$;

create or replace function mc2_manual_delete(p_what text[], p_days int default 0, p_top boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare cut timestamptz := case when coalesce(p_days, 0) > 0 then now() - make_interval(days => p_days) else 'infinity'::timestamptz end;
  r jsonb := '{}'::jsonb; n int; tot int := 0; paths text[]; ids bigint[];
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if 'visits' = any (p_what) then insert into mc2_bin(src, row, bytes) select 'mc2_visits', to_jsonb(t), pg_column_size(t) from mc2_visits t where t.created_at < cut; delete from mc2_visits where created_at < cut; get diagnostics n = row_count; r := r || jsonb_build_object('visits', n); tot := tot + n; end if;
  if 'answers' = any (p_what) then insert into mc2_bin(src, row, bytes) select 'mc2_answers', to_jsonb(t), pg_column_size(t) from mc2_answers t where t.created_at < cut; delete from mc2_answers where created_at < cut; get diagnostics n = row_count; r := r || jsonb_build_object('answers', n); tot := tot + n; end if;
  if 'presence' = any (p_what) then delete from mc2_presence where last_seen < cut; get diagnostics n = row_count; r := r || jsonb_build_object('presence', n); tot := tot + n; end if;
  if 'chat_msgs' = any (p_what) then
    with d as (delete from mc2_ac_messages where created_at < cut returning file_path) select count(*), coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into n, paths from d;
    if array_length(paths, 1) > 0 then begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'mc2-chat' and name = any (paths); exception when others then null; end; end if;
    r := r || jsonb_build_object('chat_msgs', n); tot := tot + n;
  end if;
  if 'chat_files' = any (p_what) then
    begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'mc2-chat' and created_at < cut; get diagnostics n = row_count; exception when others then n := 0; end;
    r := r || jsonb_build_object('chat_files', n); tot := tot + n;
  end if;
  if 'shots' = any (p_what) then
    select coalesce(array_agg(e.id), '{}') into ids from contest_entries e where e.shot_url like '%/object/public/contest/%' and e.created_at < cut;
    n := coalesce(array_length(ids, 1), 0); if n > 0 then perform mc2_shot_remove(ids); end if;
    if 'shots' = any (p_what) then r := r || jsonb_build_object('shots', n); tot := tot + n; end if;
  end if;
  if 'shot_rows' = any (p_what) then delete from contest_entries where created_at < cut; get diagnostics n = row_count; r := r || jsonb_build_object('shot_rows', n); tot := tot + n; end if;
  if 'cards' = any (p_what) then delete from mc2_cards where updated_at < cut and (p_top or not pinned); get diagnostics n = row_count; r := r || jsonb_build_object('cards', n); tot := tot + n; end if;
  if 'bin' = any (p_what) then delete from mc2_bin where deleted_at < cut; get diagnostics n = row_count; r := r || jsonb_build_object('bin', n); tot := tot + n; end if;
  insert into mc2_cleanup_log(what, n, note) values ('manual', tot, array_to_string(p_what, ','));
  return r;
end $$;

grant execute on function mc2_space_stats(), mc2_manual_stats(int), mc2_manual_delete(text[], int, boolean) to authenticated;

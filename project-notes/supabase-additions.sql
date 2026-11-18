-- MC Explorer — সংযোজন (2026-10-17): ছবির মূল ফাইলের নাম, চ্যাট-ফাইলের আলাদা মেয়াদ (ডিফল্ট ১ দিন, অ্যাডমিন বদলাতে পারে),
-- Seen তালিকায় একই নামের ইউজার আলাদা করা। আগে চালানো থাকতে হবে: gallery, anonchat, userinfo, moderation (মোছা অংশ), live-board। ফাইলটি idempotent।

-- ১) ছবির মূল ফাইলের নাম (Display Name = bn আলাদা থাকে)
alter table mc2_places add column if not exists orig_name text;

-- ২) চ্যাটের ফাইল/অ্যাটাচমেন্টের আলাদা মেয়াদ। মিনিটে; ০ = কখনো না। ডিফল্ট ১৪৪০ (১ দিন)।
alter table mc2_ac_messages add column if not exists file_expired boolean not null default false;
grant select (file_expired) on mc2_ac_messages to anon;
insert into mc2_ac_cfg(key, value) values ('file_keep_min', '1440') on conflict do nothing;

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440);
        fd int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440);
        n int; paths text[]; fp text[];
begin
  -- বার্তার মেয়াদ (সেশন অনুযায়ী বা ডিফল্ট)
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id
    where coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s
    where s.id = m.session_id and coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  get diagnostics n = row_count;
  -- শুধু ফাইলের মেয়াদ: বার্তা থাকে, ফাইল মুছে "ফাইলের মেয়াদ শেষ" দেখায়
  if fd > 0 then
    select coalesce(array_agg(file_path), '{}') into fp from mc2_ac_messages where file_path is not null and created_at < now() - make_interval(mins => fd);
    update mc2_ac_messages set file_path = null, file_expired = true where file_path is not null and created_at < now() - make_interval(mins => fd);
    paths := paths || fp;
  end if;
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'file_default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'file_keep_min'), 1440),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.name as dept, s.name, s.keep_min, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

create or replace function mc2_ac_admin_file_keep(p_min int) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  if p_min is null or p_min < 0 or p_min > 525600 then raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন'; end if;
  insert into mc2_ac_cfg(key, value) values ('file_keep_min', to_jsonb(p_min)) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_log(null, 'keep_set', 'ফাইল ডিফল্ট = ' || p_min || ' মিনিট', null, a);
end $$;

-- ৩) Seen তালিকা: একই নামের একাধিক ইউজার থাকলে নামের পাশে তাদের আলাদা ID দেখায়
create or replace function mc2_ac_seenlist(p_msg bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(z.n order by z.at), '[]'::jsonb) from (
    select case when count(*) over (partition by lower(s.nick)) > 1 then s.nick || ' (' || mc2_uid(s.voter) || ')' else s.nick end as n, s.at
    from mc2_ac_seen s join mc2_ac_messages m on m.session_id = s.session_id
    where m.id = p_msg and s.last_id >= m.id and s.voter <> m.voter) z $$;
grant execute on function mc2_ac_seenlist(bigint) to anon, authenticated;

-- অ্যাডমিন RPC-র অনুমতি আবার বসানো (নতুন ফাংশনসহ)
do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

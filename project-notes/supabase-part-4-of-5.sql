-- MC Explorer pending SQL, অংশ 4/5। সব অংশ ক্রমে একটার পর একটা চালান। আবার চালালেও ক্ষতি নেই।
create or replace function mc2_ac_meta(p_session int, p_min bigint, p_voter text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('up', mc2_ac_upload_on(), 'me', mc2_ac_me(p_voter),
    'on', (select count(*) from mc2_presence p where p.chat_session_id = p_session and p.page = '#anon' and mc2_online(p.last_seen, p.offline)),
    'rows', coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('id', m.id, 'n', m.nick, 'd', m.deleted, 'o', m.voter = p_voter, 'u', mc2_uid(m.voter),
      'a', exists (select 1 from mc2_presence p where p.voter = m.voter and mc2_online(p.last_seen, p.offline)),
      'r', (select coalesce(jsonb_object_agg(e, c), '{}'::jsonb) from (select emoji e, count(*) c from mc2_ac_reactions r where r.message_id = m.id group by emoji) z),
      'm', (select emoji from mc2_ac_reactions r where r.message_id = m.id and r.voter = p_voter),
      's', (select count(*) from mc2_ac_seen s where s.session_id = m.session_id and s.last_id >= m.id and s.voter <> m.voter)) x
    from mc2_ac_messages m where m.session_id = p_session and m.id >= p_min and not m.hidden order by m.id desc limit 500) t), '[]'::jsonb)) $$;
grant execute on function mc2_ac_meta(int, bigint, text) to anon, authenticated;

create or replace function mc2_ac_admin_reports(p_status text default 'open', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc), '[]'::jsonb) from (
    select r.id, r.message_id, r.target, mc2_uid(r.target) as tuid, r.target_nick, mc2_uid(r.reporter) as ruid, r.reason, r.note,
      r.snap_body, r.snap_kind, r.snap_file, r.snap_fname, r.status, r.admin_note, r.created_at, r.reviewed_at,
      (select count(distinct r2.reporter) from mc2_ac_reports r2 where r2.target = r.target and r2.status = 'valid') as valid_cnt,
      coalesce(mc2_ac_block(r.target), 'ok') as st,
      (select (m.deleted or m.hidden) from mc2_ac_messages m where m.id = r.message_id) as gone,
      (select d.name || ' · ' || s.name from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = r.session_id) as place
    from mc2_ac_reports r where (p_status = 'all' or r.status = p_status)
    order by r.id desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)) x);
end $$;

create or replace function mc2_ac_admin_review(p_id bigint, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); t text; cnt int; was boolean := false; rv boolean := false;
begin
  if p_status not in ('valid', 'rejected', 'open') then raise exception 'ভুল অবস্থা'; end if;
  update mc2_ac_reports set status = p_status, reviewed_by = case when p_status = 'open' then null else a end, reviewed_at = case when p_status = 'open' then null else now() end,
    admin_note = nullif(left(mc2_ac_clean(p_note, 300), 300), '') where id = p_id returning target into t;
  if t is null then raise exception 'রিপোর্ট পাওয়া যায়নি'; end if;
  perform mc2_ac_log(t, case p_status when 'valid' then 'report_valid' when 'rejected' then 'report_rejected' else 'report_reopen' end, mc2_ac_clean(p_note, 300), null, a, null, p_id);
  select count(distinct reporter) into cnt from mc2_ac_reports where target = t and status = 'valid';
  if p_status = 'valid' and cnt >= 3 then
    select coalesce((select review from mc2_ac_mod where voter = t), false) into was;
    if not was then
      insert into mc2_ac_mod(voter, review, review_at) values (t, true, now())
      on conflict (voter) do update set review = true, review_at = now(), updated_at = now();
      perform mc2_ac_log(t, 'review_flag', cnt || 'টি বৈধ রিপোর্ট — Review দরকার', null, 'system', null, p_id);
      rv := true;
    end if;
  end if;
  return jsonb_build_object('valid_cnt', cnt, 'review_flagged', rv);
end $$;

create or replace function mc2_ac_admin_remove(p_msg bigint, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); m record;
begin
  select id, voter, file_path into m from mc2_ac_messages where id = p_msg;
  if not found then raise exception 'বার্তা পাওয়া যায়নি'; end if;
  update mc2_ac_messages set deleted = true, mod_removed = true, body = '', kind = 'text', file_path = null, file_name = null, file_size = null, file_mime = null, reply_to = null, reply_nick = null, reply_text = null where id = p_msg;
  update mc2_ac_messages set reply_text = 'মুছে ফেলা বার্তা' where reply_to = p_msg;
  delete from mc2_ac_reactions where message_id = p_msg;
  perform mc2_ac_log(m.voter, 'msg_remove', mc2_ac_clean(p_reason, 300), null, a, p_msg);
  return jsonb_build_object('file', m.file_path);
end $$;

create or replace function mc2_ac_admin_warn(p_voter text, p_reason text, p_msg bigint default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); rs text := mc2_ac_clean(p_reason, 300);
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then raise exception 'ভুল ইউজার'; end if;
  if char_length(rs) < 3 then raise exception 'সতর্কতার কারণ লিখুন'; end if;
  insert into mc2_ac_warns(voter, reason, msg_id) values (p_voter, rs, p_msg);
  insert into mc2_ac_mod(voter, warns) values (p_voter, 1) on conflict (voter) do update set warns = mc2_ac_mod.warns + 1, updated_at = now();
  perform mc2_ac_log(p_voter, 'warn', rs, null, a, p_msg);
end $$;

create or replace function mc2_ac_admin_sanction(p_voter text, p_kind text, p_minutes int, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); rs text := mc2_ac_clean(p_reason, 300); u timestamptz; perm boolean := (p_minutes is null or p_minutes <= 0); ok boolean; cnt int;
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' then raise exception 'ভুল ইউজার'; end if;
  if p_kind not in ('restrict', 'ban') then raise exception 'ভুল ধরন'; end if;
  if char_length(rs) < 3 then raise exception 'কারণ লিখুন'; end if;
  if perm then
    if p_kind <> 'ban' then raise exception 'Restriction সাময়িকই হয় — সময় দিন'; end if;
    select count(distinct reporter) into cnt from mc2_ac_reports where target = p_voter and status = 'valid';
    select coalesce((select verified from mc2_ac_mod where voter = p_voter), false) into ok;
    if cnt < 3 or not ok then raise exception 'স্থায়ী ব্যানের আগে ৩টি বৈধ রিপোর্ট ও যাচাই (Verify) লাগবে — এখন সাময়িক ব্যান দিন'; end if;
    u := null;
  else
    if p_minutes < 5 or p_minutes > 43200 then raise exception 'সময় ৫ মিনিট থেকে ৩০ দিনের মধ্যে দিন'; end if;
    u := now() + make_interval(mins => p_minutes);
  end if;
  insert into mc2_ac_mod(voter, state, until, reason, review) values (p_voter, case p_kind when 'ban' then 'banned' else 'restricted' end, u, rs, false)
  on conflict (voter) do update set state = excluded.state, until = excluded.until, reason = excluded.reason, review = false, updated_at = now();
  perform mc2_ac_log(p_voter, case when p_kind = 'ban' and perm then 'ban_perm' else p_kind end, rs, u, a);
  return jsonb_build_object('state', case p_kind when 'ban' then 'banned' else 'restricted' end, 'until', u);
end $$;

create or replace function mc2_ac_admin_unban(p_voter text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  update mc2_ac_mod set state = 'ok', until = null, reason = null, updated_at = now() where voter = p_voter;
  perform mc2_ac_log(p_voter, 'unban', mc2_ac_clean(p_reason, 300), null, a);
end $$;

create or replace function mc2_ac_admin_verify(p_voter text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); nt text := mc2_ac_clean(p_note, 300); cnt int;
begin
  select count(distinct reporter) into cnt from mc2_ac_reports where target = p_voter and status = 'valid';
  if cnt < 3 then raise exception 'যাচাইয়ের জন্য কমপক্ষে ৩ জন আলাদা রিপোর্টারের বৈধ রিপোর্ট লাগবে (এখন %)', cnt; end if;
  if char_length(nt) < 10 then raise exception 'যাচাইয়ে কী দেখেছেন তা অন্তত ১০ অক্ষরে লিখুন'; end if;
  insert into mc2_ac_mod(voter, verified, verified_by, verified_at, verified_note, review) values (p_voter, true, a, now(), nt, false)
  on conflict (voter) do update set verified = true, verified_by = a, verified_at = now(), verified_note = nt, review = false, updated_at = now();
  perform mc2_ac_log(p_voter, 'verify', nt, null, a);
end $$;

create or replace function mc2_ac_admin_clear_review(p_voter text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  update mc2_ac_mod set review = false, updated_at = now() where voter = p_voter;
  perform mc2_ac_log(p_voter, 'review_clear', mc2_ac_clean(p_note, 300), null, a);
end $$;

create or replace function mc2_ac_admin_mods() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.review desc, x.upd desc), '[]'::jsonb) from (
    select m.voter, mc2_uid(m.voter) as uid,
      coalesce((select g.nick from mc2_ac_messages g where g.voter = m.voter order by g.id desc limit 1), 'বেনামি') as nick,
      coalesce(mc2_ac_block(m.voter), 'ok') as st, m.until, m.reason, m.review, m.verified, m.warns,
      (select count(distinct r.reporter) from mc2_ac_reports r where r.target = m.voter and r.status = 'valid') as valid_cnt,
      (select count(*) from mc2_ac_reports r where r.target = m.voter and r.status = 'open') as open_cnt,
      m.updated_at as upd
    from mc2_ac_mod m where m.review or m.warns > 0 or m.state <> 'ok' order by m.updated_at desc limit 200) x);
end $$;

create or replace function mc2_ac_admin_history(p_voter text) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object(
    'uid', mc2_uid(p_voter),
    'nick', coalesce((select g.nick from mc2_ac_messages g where g.voter = p_voter order by g.id desc limit 1), 'বেনামি'),
    'st', coalesce(mc2_ac_block(p_voter), 'ok'),
    'mod', (select to_jsonb(m) - 'voter' from mc2_ac_mod m where m.voter = p_voter),
    'valid_cnt', (select count(distinct reporter) from mc2_ac_reports where target = p_voter and status = 'valid'),
    'reports', coalesce((select jsonb_agg(to_jsonb(z) order by z.id desc) from (
        select r.id, r.reason, r.note, r.status, r.snap_body, r.snap_kind, r.snap_fname, r.created_at, mc2_uid(r.reporter) as ruid, r.admin_note
        from mc2_ac_reports r where r.target = p_voter order by r.id desc limit 100) z), '[]'::jsonb),
    'log', coalesce((select jsonb_agg(to_jsonb(l) order by l.id desc) from (
        select id, action, reason, until, admin, msg_id, report_id, created_at from mc2_ac_modlog where voter = p_voter order by id desc limit 100) l), '[]'::jsonb));
end $$;

create or replace function mc2_ac_admin_upload(p_on boolean) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  insert into mc2_ac_cfg(key, value) values ('upload', to_jsonb(coalesce(p_on, true))) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_log(null, case when coalesce(p_on, true) then 'upload_on' else 'upload_off' end, null, null, a);
end $$;

alter table mc2_ac_sessions add column if not exists keep_min int check (keep_min is null or keep_min between 0 and 525600);
insert into mc2_ac_cfg(key, value) values ('keep_min', '1440') on conflict do nothing;

create or replace function mc2_ac_purge() returns int language plpgsql security definer set search_path = public as $$
declare d int := coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440); n int; paths text[];
begin
  select coalesce(array_agg(m.file_path) filter (where m.file_path is not null), '{}') into paths
    from mc2_ac_messages m join mc2_ac_sessions s on s.id = m.session_id
    where coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  delete from mc2_ac_messages m using mc2_ac_sessions s
    where s.id = m.session_id and coalesce(s.keep_min, d) > 0 and m.created_at < now() - make_interval(mins => coalesce(s.keep_min, d));
  get diagnostics n = row_count;
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects where bucket_id = 'mc2-chat' and (name = any (paths)
      or (created_at < now() - interval '1 day' and name not in (select file_path from mc2_ac_messages where file_path is not null)));
  exception when others then null;
  end;
  return n;
end $$;
revoke all on function mc2_ac_purge() from public, anon, authenticated;

create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); end if; end $$;
grant execute on function mc2_ac_tick() to anon, authenticated;

create or replace function mc2_ac_admin_retention() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return jsonb_build_object('default', coalesce((select (value #>> '{}')::int from mc2_ac_cfg where key = 'keep_min'), 1440),
    'sessions', coalesce((select jsonb_agg(to_jsonb(x) order by x.dsort, x.ssort) from (
      select s.id, d.name as dept, s.name, s.keep_min, d.sort as dsort, s.sort as ssort,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id) as msgs,
        (select count(*) from mc2_ac_messages m where m.session_id = s.id and m.file_path is not null) as files
      from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id) x), '[]'::jsonb));
end $$;

create or replace function mc2_ac_admin_keep(p_session int, p_min int) returns void language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm();
begin
  if p_min is not null and (p_min < 0 or p_min > 525600) then raise exception 'সময় ০ থেকে ৫,২৫,৬০০ মিনিটের (১ বছর) মধ্যে দিন'; end if;
  if p_session is null then
    if p_min is null then raise exception 'ডিফল্ট সময় দিন'; end if;
    insert into mc2_ac_cfg(key, value) values ('keep_min', to_jsonb(p_min)) on conflict (key) do update set value = excluded.value;
  else
    update mc2_ac_sessions set keep_min = p_min where id = p_session;
    if not found then raise exception 'চ্যাট-বক্স পাওয়া যায়নি'; end if;
  end if;
  perform mc2_ac_log(null, 'keep_set', coalesce(p_session::text, 'ডিফল্ট') || ' = ' || coalesce(p_min::text, 'ডিফল্ট অনুযায়ী') || ' মিনিট', null, a);
end $$;

create or replace function mc2_ac_admin_purge_now(p_session int default null, p_older_min int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := mc2_ac_adm(); paths text[]; n int; t timestamptz := now() - make_interval(mins => greatest(coalesce(p_older_min, 0), 0));
begin
  select coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into paths from mc2_ac_messages where (p_session is null or session_id = p_session) and created_at < t;
  delete from mc2_ac_messages where (p_session is null or session_id = p_session) and created_at < t;
  get diagnostics n = row_count;
  perform mc2_ac_log(null, 'purge', coalesce(p_session::text, 'সব চ্যাট') || ' · ' || n || 'টি বার্তা · ' || coalesce(p_older_min, 0) || ' মিনিটের পুরোনো', null, a);
  return jsonb_build_object('deleted', n, 'files', to_jsonb(paths));
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.proname like 'mc2\_ac\_admin\_%' and p.pronamespace = 'public'::regnamespace loop
    execute 'revoke all on function ' || f.sig || ' from public, anon';
    execute 'grant execute on function ' || f.sig || ' to authenticated';
  end loop;
end $$;

create table if not exists mc2_ac_here (
  session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, nick text,
  at timestamptz not null default now(), typing_at timestamptz, primary key (session_id, voter));
create table if not exists mc2_ac_events (
  id bigserial primary key, session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text,
  kind text not null check (kind in ('join', 'leave')), nick text, created_at timestamptz not null default now());
create index if not exists mc2_ac_events_s on mc2_ac_events (session_id, id desc);
alter table mc2_ac_here enable row level security; alter table mc2_ac_events enable row level security;
revoke all on mc2_ac_here, mc2_ac_events from anon, authenticated;

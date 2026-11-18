-- supabase-new-20261019b.sql  (ধাপ ১: বিন, ২০-কার্ড পুরোনোটা কাটা, ভিজিট-লগ ৩০০০ সারি (সময়ে মোছা বন্ধ, কাস্টম), card_max বন্ধ)
-- আগে ব্যাকআপ নিন। supabase-new-20261019.sql চালানোর পরে এটা চালান। বারবার চালালেও ভাঙে না।
-- বিঃদ্রঃ আগে অ্যাডমিন থেকে সেভ করা মান (cfg) ডিফল্টের ওপরে থাকে, তাই সেগুলো অ্যাডমিনে একবার দেখে নিন।

create table if not exists mc2_bin (id bigint generated always as identity primary key, src text not null, row jsonb not null, bytes int not null default 0, deleted_at timestamptz not null default now());
create index if not exists mc2_bin_t on mc2_bin (deleted_at);
alter table mc2_bin enable row level security;
revoke all on mc2_bin from anon, authenticated;

create or replace function mc2_cards_to_bin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('mc2.nobin', true), '') = 'on' then return old; end if;
  insert into mc2_bin(src, row, bytes) values ('mc2_cards', to_jsonb(old), pg_column_size(old));
  return old;
end $$;
drop trigger if exists mc2_cards_bin on mc2_cards;
create trigger mc2_cards_bin before delete on mc2_cards for each row execute function mc2_cards_to_bin();

create or replace function mc2_cleanup_defaults() returns jsonb language sql immutable as $$
  select jsonb_build_object('on', true, 'others_on', true, 'db_mb', 500, 'start_pct', 70, 'card_pct', 80, 'card_max', 1000000, 'batch', 200, 'card_batch', 50,
    'min_age_days', 7, 'card_min_days', 0, 'visits_days', 0, 'visits_max', 3000, 'bin_days', 30, 'answers_days', 0, 'presence_days', 60, 'cards_days', 0,
    'ip_view_min', 600, 'ip_card_hr', 1500, 'ip_score_hr', 1500, 'ip_entry_hr', 300, 'score_dev_hr', 30, 'visit_dev_hr', 40, 'card_per_dev', 20, 'card_gap_sec', 2)
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
                   'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'card_gap_sec', 'visits_max', 'bin_days') then raise exception 'unknown key %', k; end if;
      if jsonb_typeof(p_cfg -> k) <> 'number' then raise exception '% must be a number', k; end if;
      v := (p_cfg ->> k)::numeric;
      lo := case when k in ('db_mb', 'batch', 'card_batch', 'min_age_days', 'card_max', 'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'visits_max') then 1 when k in ('start_pct', 'card_pct') then 10 else 0 end;
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct') then 99 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k = 'card_max' then 1000000
                 when k in ('ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr') then 1000000 when k in ('score_dev_hr', 'visit_dev_hr') then 100000 when k = 'card_per_dev' then 1000 when k = 'visits_max' then 1000000 when k = 'card_gap_sec' then 60 else 3650 end;
      if v < lo or v > hi or v <> trunc(v) then raise exception '% must be a whole number % to %', k, lo, hi; end if;
    end if;
  end loop;
  insert into mc2_cleanup_cfg(id, cfg) values (1, p_cfg) on conflict (id) do update set cfg = excluded.cfg;
end $$;

create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('card:ip:' || mc2_ip(), mc2_lim('ip_card_hr'), 3600) then return 'slow'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - make_interval(secs => mc2_lim('card_gap_sec')) then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= mc2_lim('card_per_dev') then
    delete from mc2_cards where id = (select x.id from mc2_cards x where x.device = p_device and not x.pinned order by x.updated_at limit 1);
    if (select count(*) from mc2_cards where device = p_device) >= mc2_lim('card_per_dev') then return 'slow'; end if;
  end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  if (select count(*) from mc2_cards x where x.score > v.score) < 3 then update mc2_cards set pinned = true where device = p_device and lower(name) = lower(v.name); end if;
  if random() < 0.1 then begin perform mc2_cleanup_tick(); exception when others then null; end; end if;
  return 'ok';
end $$;

create or replace function mc2_cleanup_visits() returns int language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); dd int := (c ->> 'visits_days')::int; mx int := (c ->> 'visits_max')::int; n int := 0; k int; tot int;
begin
  if dd > 0 then
    delete from mc2_visits where ctid = any(array(select ctid from mc2_visits where created_at < now() - make_interval(days => dd) order by created_at limit 2000));
    get diagnostics k = row_count; n := n + k;
  end if;
  if mx > 0 then
    select count(*) into tot from mc2_visits;
    if tot > mx then
      delete from mc2_visits where ctid = any(array(select ctid from mc2_visits order by created_at limit least(tot - mx, 2000)));
      get diagnostics k = row_count; n := n + k;
    end if;
  end if;
  if n > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_visits', n, 'age/count'); end if;
  return n;
end $$;
revoke all on function mc2_cleanup_visits() from public, anon, authenticated;

create or replace function mc2_bin_sweep() returns int language plpgsql security definer set search_path = public as $$
declare d int := mc2_lim('bin_days'); n int := 0;
begin
  if d > 0 then delete from mc2_bin where deleted_at < now() - make_interval(days => d); get diagnostics n = row_count; end if;
  return n;
end $$;
revoke all on function mc2_bin_sweep() from public, anon, authenticated;

create or replace function mc2_cleanup_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  if mc2_ac_rl('cleanup', 1, 600) then
    perform mc2_cleanup_visits(); perform mc2_bin_sweep(); perform mc2_cleanup_run(false);
  end if;
exception when others then null;
end $$;
revoke all on function mc2_cleanup_tick() from public, anon, authenticated;

create or replace function mc2_bin_list(p_limit int default 100, p_src text default null) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object('total', (select count(*) from mc2_bin where p_src is null or src = p_src), 'mb', (select round(coalesce(sum(bytes), 0) / 1048576.0, 2) from mc2_bin where p_src is null or src = p_src),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'src', x.src, 'at', x.deleted_at, 'name', coalesce(x.row ->> 'name', x.row ->> 'page', x.row ->> 'device', '—'), 'score', x.row ->> 'score', 'device', x.row ->> 'device') order by x.deleted_at desc)
      from (select * from mc2_bin where p_src is null or src = p_src order by deleted_at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) x), '[]'::jsonb));
end $$;

create or replace function mc2_bin_restore(p_id bigint) returns text language plpgsql security definer set search_path = public as $$
declare b record; n int; ident boolean;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select * into b from mc2_bin where id = p_id;
  if not found then return 'missing'; end if;
  if b.src not in ('mc2_cards', 'contest_entries', 'mc2_scores', 'mc2_visits', 'mc2_answers', 'mc2_ufolder_members') then return 'unsupported'; end if;
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = b.src and is_identity = 'YES') into ident;
  execute format('insert into %I %s select * from jsonb_populate_record(null::%I, $1) on conflict do nothing', b.src, case when ident then 'overriding system value' else '' end, b.src) using b.row;
  get diagnostics n = row_count;
  if n = 0 then return 'exists'; end if;
  perform set_config('mc2.keepfile', 'on', true); delete from mc2_bin where id = p_id; perform set_config('mc2.keepfile', '', true);
  return 'ok';
end $$;

create or replace function mc2_bin_delete(p_id bigint) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  delete from mc2_bin where id = p_id;
  return found;
end $$;

-- যেকোনো টেবিলের মোছা সারি বিনে (কার্ডের ট্রিগার আলাদা আছে)। জমা ইউজার (contest_entries) ও স্কোর (mc2_scores) বিনে যাবে। চ্যাট ও ফাইল বিনে যায় না।
create or replace function mc2_row_to_bin() returns trigger language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(old); nm text;
begin
  -- জমা ইউজার মুছলে স্ক্রিনশটের ছবি সাথে সাথে মুছে যায় (বিনে যায় না); বিনে শুধু লগ-তথ্য যায় (shot_url = 'deleted')
  if tg_table_name = 'contest_entries' then
    nm := substring(old.shot_url from '/object/public/contest/(.+)$');
    if nm is not null then
      begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'contest' and name = nm; exception when others then null; end;
    end if;
    j := jsonb_set(j, '{shot_url}', '"deleted"');
  end if;
  if coalesce(current_setting('mc2.nobin', true), '') = 'on' then return old; end if;
  insert into mc2_bin(src, row, bytes) values (tg_table_name, j, pg_column_size(old));
  return old;
end $$;
do $$ begin
  if to_regclass('public.contest_entries') is not null then drop trigger if exists mc2_bin_t on contest_entries; create trigger mc2_bin_t before delete on contest_entries for each row execute function mc2_row_to_bin(); end if;
  if to_regclass('public.mc2_ufolder_members') is not null then drop trigger if exists mc2_bin_t on mc2_ufolder_members; create trigger mc2_bin_t before delete on mc2_ufolder_members for each row execute function mc2_row_to_bin(); end if;
  if to_regclass('public.mc2_scores') is not null then drop trigger if exists mc2_bin_t on mc2_scores; create trigger mc2_bin_t before delete on mc2_scores for each row execute function mc2_row_to_bin(); end if;
end $$;

-- বিন থেকে জমা-ইউজার চিরতরে মুছলে তার স্ক্রিনশটের ফাইলও মুছবে (ফিরিয়ে আনার সময় নয়)।
create or replace function mc2_bin_gc() returns trigger language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if old.src = 'contest_entries' and coalesce(current_setting('mc2.keepfile', true), '') <> 'on' then
    nm := substring(old.row ->> 'shot_url' from '/object/public/contest/(.+)$');
    if nm is not null then begin perform set_config('storage.allow_delete_query', 'true', true); delete from storage.objects where bucket_id = 'contest' and name = nm; exception when others then null; end; end if;
  end if;
  return old;
end $$;
drop trigger if exists mc2_bin_gc on mc2_bin;
create trigger mc2_bin_gc before delete on mc2_bin for each row execute function mc2_bin_gc();

create or replace function mc2_bin_purge(p_days int default null) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  delete from mc2_bin where p_days is null or deleted_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on function mc2_bin_list(int, text), mc2_bin_restore(bigint), mc2_bin_delete(bigint), mc2_bin_purge(int) to authenticated;

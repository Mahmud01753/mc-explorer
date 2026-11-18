-- NEW SQL (2026-10-18 j): কাজ ৩ লিডারবোর্ড নিয়ন্ত্রণ + কাজ ৫ চ্যাটের কাস্টম ফাইল টাইপ/MB
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই। এই SQL চালানোর আগেও সাইট আগের মতো চলে।
-- আগে চালানো থাকতে হবে: সব আগের SQL (চালানোই আছে)।
-- ক) mc2_scores.hidden + board_cfg {board_on} + mc2_board/mc2_top_cards (hidden বাদ, বন্ধ থাকলে খালি) + অ্যাডমিন RPC।
-- খ) mc2_ac_cfg key 'ftypes' = {"ext":[ধরন, মাইম, সর্বোচ্চ MB, চালু?]}; mc2_ac_ftypes() এখান থেকে পড়ে, না থাকলে ডিফল্ট তালিকা।
-- device/IP পাবলিক ফাংশনে কখনো বেরোয় না।

alter table mc2_scores add column if not exists hidden boolean not null default false;
create index if not exists mc2_scores_hidden on mc2_scores (hidden) where hidden;

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 500 then raise exception 'wrong_options must be 1..500'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  elsif new.key = 'home_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'home_cfg must be an object'; end if;
  elsif new.key = 'board_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 1000 then raise exception 'board_cfg must be an object'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;

drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg', 'home_cfg', 'board_cfg')) execute function mc2_trg_rebuild();

create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('total', 0, 'rows', '[]'::jsonb, 'depts', '[]'::jsonb, 'batches', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where not coalesce(s.hidden, false) and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
      and (q is null or s.name ilike '%' || q || '%')
  ), pick as (select * from base where p_mode = 'all' or rn = 1),
  ranked as (select pick.*, rank() over (order by score desc) as rk, count(*) over () as total_n from pick),
  page as (select * from ranked order by rk, created_at, id offset ofs limit lim)
  select jsonb_build_object('total', coalesce((select max(total_n) from page), 0),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'rk', rk, 'name', name, 'dept', dept, 'batch', batch, 'score', score,
        'ok', coalesce(ok, 0), 'wrong', greatest(coalesce(total, 0) - coalesce(ok, 0), 0), 'total', coalesce(total, 0), 'pct', pct,
        'ts', (extract(epoch from created_at) * 1000)::bigint) order by rk, created_at, id) from page), '[]'::jsonb)) into res;
  return res || jsonb_build_object('depts', coalesce((select jsonb_agg(z.d order by z.d) from (select distinct dept as d from mc2_scores) z), '[]'::jsonb),
                                   'batches', coalesce((select jsonb_agg(z.b order by z.b) from (select distinct batch as b from mc2_scores where batch is not null and batch <> '') z), '[]'::jsonb));
end $$;

create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('rows', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where not coalesce(s.hidden, false) and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x where x.device = t.device and lower(x.name) = lower(t.name) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;

-- ===== অ্যাডমিন: লিডারবোর্ড এন্ট্রি তালিকা/এডিট/হাইড/ডিলিট/ছবি (সবগুলো mc2_is_admin() ছাড়া চলে না) =====
create or replace function mc2_board_admin_list(p_q text default null, p_dept text default null, p_batch text default null, p_state text default 'all', p_limit int default 50, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); lim int := least(greatest(coalesce(p_limit, 50), 1), 200); res jsonb; tot int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  select count(*) into tot from mc2_scores s where (q is null or s.name ilike '%' || q || '%') and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
    and (p_state = 'all' or (p_state = 'hidden' and s.hidden) or (p_state = 'shown' and not s.hidden));
  select coalesce(jsonb_agg(r order by r.sc desc, r.id), '[]'::jsonb) into res from (
    select s.id, s.name, s.dept, s.batch, s.score as sc, s.ok, s.total, s.hidden, (extract(epoch from s.created_at) * 1000)::bigint as ts,
      exists (select 1 from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)) as has_card,
      coalesce((select bool_or(c.photo is not null) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), false) as has_photo,
      coalesce((select bool_and(c.show) from mc2_cards c where c.device = s.device and lower(c.name) = lower(s.name)), true) as photo_show
    from mc2_scores s where (q is null or s.name ilike '%' || q || '%') and (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_state = 'all' or (p_state = 'hidden' and s.hidden) or (p_state = 'shown' and not s.hidden))
    order by s.score desc, s.id offset greatest(coalesce(p_offset, 0), 0) limit lim) r;
  return jsonb_build_object('total', tot, 'rows', res);
end $$;

create or replace function mc2_board_admin_edit(p_id bigint, p_name text, p_dept text, p_batch text, p_score int) returns text
language plpgsql security definer set search_path = public as $$
declare o mc2_scores%rowtype; nm text := trim(coalesce(p_name, ''));
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  select * into o from mc2_scores where id = p_id; if not found then return 'missing'; end if;
  if char_length(nm) not between 1 and 30 or char_length(coalesce(p_dept, '')) not between 1 and 60 or p_score not between 0 and 1000 or char_length(coalesce(p_batch, '')) > 40 then return 'invalid'; end if;
  update mc2_scores set name = nm, dept = p_dept, batch = nullif(trim(coalesce(p_batch, '')), ''), score = p_score, pct = round(p_score / 10.0)::int where id = p_id;
  if lower(o.name) <> lower(nm) or o.name <> nm then
    begin update mc2_cards set name = nm where device = o.device and lower(name) = lower(o.name);
    exception when unique_violation then null; end;
  end if;
  return 'ok';
end $$;

create or replace function mc2_board_admin_hide(p_ids bigint[], p_hide boolean) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  update mc2_scores set hidden = coalesce(p_hide, true) where id = any(coalesce(p_ids, '{}'));
  get diagnostics n = row_count; return n;
end $$;

create or replace function mc2_board_admin_delete(p_ids bigint[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  delete from mc2_scores where id = any(coalesce(p_ids, '{}'));
  get diagnostics n = row_count; return n;
end $$;

-- p_mode: 'hide' = সেরা ৩-এ ছবি লুকানো; 'show' = আবার দেখানো; 'remove' = ছবি মুছে ফেলা
create or replace function mc2_board_admin_photo(p_ids bigint[], p_mode text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if p_mode not in ('hide', 'show', 'remove') then return 0; end if;
  update mc2_cards c set show = case p_mode when 'hide' then false when 'show' then true else c.show end, photo = case when p_mode = 'remove' then null else c.photo end
    from mc2_scores s where s.id = any(coalesce(p_ids, '{}')) and c.device = s.device and lower(c.name) = lower(s.name);
  get diagnostics n = row_count; return n;
end $$;

-- ===== চ্যাটের ফাইল টাইপ: ডিফল্ট + ডাটাবেজ (mc2_ac_cfg key 'ftypes') =====
create or replace function mc2_ac_ftypes_default() returns jsonb language sql immutable as $$ select '{
 "jpg":["image","image/jpeg",10],"jpeg":["image","image/jpeg",10],"png":["image","image/png",10],"gif":["image","image/gif",10],"webp":["image","image/webp",10],
 "mp4":["video","video/mp4",25],"webm":["video","video/webm",25],"mov":["video","video/quicktime",25],
 "mp3":["audio","audio/mpeg",15],"m4a":["audio","audio/mp4",15],"wav":["audio","audio/wav",15],"ogg":["audio","audio/ogg",15],"aac":["audio","audio/aac",15],
 "pdf":["file","application/pdf",15],"txt":["file","text/plain",2],"csv":["file","text/csv",5],
 "doc":["file","application/msword",15],
 "docx":["file","application/vnd.openxmlformats-officedocument.wordprocessingml.document",15],
 "xls":["file","application/vnd.ms-excel",15],
 "xlsx":["file","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",15],
 "ppt":["file","application/vnd.ms-powerpoint",25],
 "pptx":["file","application/vnd.openxmlformats-officedocument.presentationml.presentation",25]}'::jsonb $$;
create or replace function mc2_ac_ftypes() returns jsonb language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from mc2_ac_cfg where key = 'ftypes' and jsonb_typeof(value) = 'object')
    then coalesce((select jsonb_object_agg(e.key, e.value) from mc2_ac_cfg c, jsonb_each(c.value) e where c.key = 'ftypes' and jsonb_typeof(c.value) = 'object' and coalesce(e.value ->> 3, 'true') <> 'false'), '{}'::jsonb)
    else mc2_ac_ftypes_default() end $$;
grant execute on function mc2_ac_ftypes() to anon, authenticated;
grant execute on function mc2_ac_ftypes_default() to anon, authenticated;

-- বাকেটের সীমা চালু টাইপগুলো থেকে (সর্বোচ্চ MB ও সব মাইম)
create or replace function mc2_ac_apply_bucket() returns void language plpgsql security definer set search_path = public as $$
declare ft jsonb := mc2_ac_ftypes(); mx bigint; mt text[];
begin
  select coalesce(max((v ->> 2)::numeric), 25)::bigint * 1048576 into mx from jsonb_each(ft) e(k, v);
  select array_agg(distinct v ->> 1) into mt from jsonb_each(ft) e(k, v);
  begin update storage.buckets set public = true, file_size_limit = mx, allowed_mime_types = mt where id = 'mc2-chat';
  exception when undefined_column then update storage.buckets set public = true, file_size_limit = mx where id = 'mc2-chat'; end;
end $$;

create or replace function mc2_ac_ftypes_admin() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  return coalesce((select value from mc2_ac_cfg where key = 'ftypes' and jsonb_typeof(value) = 'object'), mc2_ac_ftypes_default());
end $$;

create or replace function mc2_ac_ftypes_set(p_list jsonb) returns text language plpgsql security definer set search_path = public as $$
declare e record; n int := 0;
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  if p_list is null or jsonb_typeof(p_list) <> 'object' or pg_column_size(p_list) > 20000 then return 'invalid'; end if;
  for e in select key, value from jsonb_each(p_list) loop
    n := n + 1;
    if e.key !~ '^[a-z0-9]{1,5}$' or e.key in ('html', 'htm', 'svg', 'js', 'xhtml', 'xml', 'php', 'mjs') then return 'bad_ext:' || e.key; end if;
    if jsonb_typeof(e.value) <> 'array' or jsonb_array_length(e.value) < 3 then return 'bad_row:' || e.key; end if;
    if (e.value ->> 0) not in ('image', 'video', 'audio', 'file') then return 'bad_kind:' || e.key; end if;
    if (e.value ->> 1) !~ '^[a-z0-9.+-]+/[a-z0-9.+_-]+$' or char_length(e.value ->> 1) > 100 or (e.value ->> 1) in ('text/html', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/xhtml+xml') then return 'bad_mime:' || e.key; end if;
    if jsonb_typeof(e.value -> 2) <> 'number' or (e.value ->> 2)::numeric not between 1 and 5000 then return 'bad_mb:' || e.key; end if;
  end loop;
  if n > 200 then return 'too_many'; end if;
  insert into mc2_ac_cfg(key, value) values ('ftypes', p_list) on conflict (key) do update set value = excluded.value;
  perform mc2_ac_apply_bucket();
  return 'ok';
end $$;
grant execute on function mc2_board_admin_list(text, text, text, text, int, int), mc2_board_admin_edit(bigint, text, text, text, int), mc2_board_admin_hide(bigint[], boolean), mc2_board_admin_delete(bigint[]), mc2_board_admin_photo(bigint[], text),
  mc2_ac_ftypes_admin(), mc2_ac_ftypes_set(jsonb), mc2_ac_apply_bucket() to authenticated;
select mc2_ac_apply_bucket();

-- নাম-চেক: সবগুলো true এলে ঠিক
select 'hidden column' as name, exists (select 1 from information_schema.columns where table_name = 'mc2_scores' and column_name = 'hidden') as ok
union all select 'board fn has hidden', (select prosrc like '%hidden%' and prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_board' limit 1)
union all select 'top fn has hidden', (select prosrc like '%hidden%' and prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_top_cards' limit 1)
union all select 'check fn has board_cfg', (select prosrc like '%board_cfg%' from pg_proc where proname = 'mc2_settings_check' limit 1)
union all select 'admin rpcs', (select count(*) = 8 from pg_proc where proname in ('mc2_board_admin_list', 'mc2_board_admin_edit', 'mc2_board_admin_hide', 'mc2_board_admin_delete', 'mc2_board_admin_photo', 'mc2_ac_ftypes_admin', 'mc2_ac_ftypes_set', 'mc2_ac_apply_bucket'))
union all select 'ftypes reads cfg', (select prosrc like '%ftypes%' from pg_proc where proname = 'mc2_ac_ftypes' limit 1);

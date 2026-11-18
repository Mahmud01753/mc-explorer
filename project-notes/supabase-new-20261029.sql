-- 2026-10-29  নামের সীমা ৩০ → ২০০ (কার্ডে/লিডারবোর্ডে পুরো নাম)
-- NOT RUN (মালিক চালানোর কথা জানালে তবেই 'চালানো' ধরা হবে)
-- এক্ষেত্রে শুধু ৪টা ফাংশন নতুন করে বসে; টেবিল/ডেটা বদলায় না; আবার চালালেও সমস্যা নেই।
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে Run।

-- ---- mc2_submit_score ----
create or replace function mc2_submit_score(p_name text, p_dept text, p_batch text, p_club text, p_title text, p_pct int, p_score int, p_ok int, p_total int, p_device text, p_info jsonb)
returns text language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 200 or char_length(coalesce(p_dept, '')) not between 1 and 60
     or p_pct not between 0 and 100 or p_score not between 0 and 1000 or char_length(coalesce(p_device, '')) not between 8 and 40 then return 'invalid'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('score:ip:' || mc2_ip(), mc2_lim('ip_score_hr'), 3600) then return 'slow'; end if;
  if (select count(*) from mc2_scores where device = p_device and created_at > now() - interval '1 hour') >= mc2_lim('score_dev_hr') then return 'slow'; end if;
  insert into mc2_scores(name, dept, batch, club, title, pct, score, ok, total, device, ip, ua, info)
  values (trim(p_name), p_dept, left(p_batch, 40), left(p_club, 60), left(p_title, 60), p_pct, p_score, p_ok, p_total, p_device, mc2_ip(), left(mc2_hdr('user-agent'), 400), p_info);
  return 'ok';
end $$;

-- ---- mc2_card_save ----
create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 200 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
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
  if random() < 0.1 then begin perform mc2_cleanup_tick(); exception when others then null; end; end if;
  return 'ok';
end $$;

-- ---- mc2_submit_answers ----
create or replace function mc2_submit_answers(p_session text, p_device text, p_name text, p_answers jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare a jsonb; q mc2_questions; ch text; ms int; ok boolean; sk boolean; pts int; cnt int := 0;
begin
  if char_length(coalesce(p_session, '')) not between 8 and 40 or char_length(coalesce(p_device, '')) not between 8 and 40
     or p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) not between 1 and 50 then return 'invalid'; end if;
  if exists (select 1 from mc2_answers where session = p_session) then return 'dup'; end if;
  if (select count(distinct session) from mc2_answers where device = p_device and created_at > now() - interval '1 hour') >= 20 then return 'slow'; end if;
  for a in select value from jsonb_array_elements(p_answers) loop
    select * into q from mc2_questions where place_id = nullif(a ->> 'pid', '')::bigint;
    if not found then continue; end if;
    ch := left(a ->> 'c', 120);
    sk := coalesce((a ->> 's')::boolean, false) or ch is null;
    ms := least(greatest(coalesce(round((a ->> 'ms')::numeric)::int, 0), 0), 600000);
    ok := (not sk) and ch = q.correct;
    pts := case when ok then greatest(5, 100 - 5 * floor(ms / 1000.0)::int) else 0 end;
    insert into mc2_answers(session, device, name, place_id, place_bn, chosen, correct_ans, is_correct, skipped, ms, pts)
    values (p_session, p_device, left(trim(coalesce(p_name, '')), 200), q.place_id, q.correct, case when sk then null else ch end, q.correct, ok, sk, ms, pts);
    cnt := cnt + 1;
  end loop;
  return case when cnt > 0 then 'ok' else 'invalid' end;
exception when others then return 'invalid';
end $$;

-- ---- mc2_board_admin_edit ----
create or replace function mc2_board_admin_edit(p_id bigint, p_name text, p_dept text, p_batch text, p_score int) returns text
language plpgsql security definer set search_path = public as $$
declare o mc2_scores%rowtype; nm text := trim(coalesce(p_name, ''));
begin
  if not mc2_is_admin() then raise exception 'not admin'; end if;
  select * into o from mc2_scores where id = p_id; if not found then return 'missing'; end if;
  if char_length(nm) not between 1 and 200 or char_length(coalesce(p_dept, '')) not between 1 and 60 or p_score not between 0 and 1000 or char_length(coalesce(p_batch, '')) > 40 then return 'invalid'; end if;
  update mc2_scores set name = nm, dept = p_dept, batch = nullif(trim(coalesce(p_batch, '')), ''), score = p_score, pct = round(p_score / 10.0)::int where id = p_id;
  if lower(o.name) <> lower(nm) or o.name <> nm then
    begin update mc2_cards set name = nm where device = o.device and lower(name) = lower(o.name);
    exception when unique_violation then null; end;
  end if;
  return 'ok';
end $$;

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select p.proname as fn, pg_get_functiondef(p.oid) like '%between 1 and 200%' or pg_get_functiondef(p.oid) like '%, 200)%' as ok
from pg_proc p where p.proname in ('mc2_submit_score','mc2_card_save','mc2_submit_answers','mc2_board_admin_edit') order by 1;

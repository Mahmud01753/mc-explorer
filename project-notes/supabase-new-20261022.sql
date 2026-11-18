-- supabase-new-20261022.sql — অটো-ক্লিন: কাটার ক্রম ২% → ৩% → ৫% (আবার ২…) + ২৪ ঘণ্টায় ৩ বার ৯০% ছুঁলে অ্যাডমিনকে সতর্কবার্তা (একবার Run; আবার চালালেও ক্ষতি নেই)
-- আগে ব্যাকআপ। ...19c, ...20b, ...21b আগে চালানো থাকতে হবে।
-- নিয়ম: ডেটাবেস (বা Storage) ৯০% ছুঁলে — ১ম বার সীমার ২% পরিমাণ পুরোনো ডেটা কেটে জায়গা খালি করে (≈ ৯০ → ৮৮%), ২য় বার ৩% (≈ ৮৭%), ৩য় বার ৫% (≈ ৮৫%), তারপর আবার ২, ৩, ৫… যতবার "আবার ভরে" ততবার এই ক্রমে।
--   জরুরি: Postgres-এ DELETE করলে ডেটাবেস ফাইলের সাইজ (Supabase যা মাপে) কমে না; খালি জায়গা নতুন ডেটায় ভরে, ফাইল তখন বাড়েনি। তাই ডেটাবেসে "আবার ভরেছে" ধরা হয় শুধু তখন, যখন ফাইল-সাইজ শেষ চক্র শেষ হওয়ার সাইজের চেয়ে ≈০.২% (≈১ MB) বাড়ে — মানে খালি করা জায়গা নতুন ডেটায় ফুরিয়েছে। নইলে প্রতি ১০ মিনিটে নতুন চক্র শুরু হয়ে ২,৩,৫ ক্রম দ্রুত এগোত ও ভুয়া সতর্কতা যেত।
--   Storage-এ ফাইল মুছলে সাইজ সত্যিই কমে, তাই সেখানে সরাসরি % দেখে চলে। ৮০% মেঝে, প্রতি চক্রে সর্বোচ্চ ১৫%, advisory lock ও বন্ধ-সুইচ (on) আগের মতোই। ৩ দিন কাটা না লাগলে ক্রম আবার ২% থেকে।
--   cut1/cut2/cut3 (ডিফল্ট ২/৩/৫) অ্যাডমিন > 🧹 অটো-ক্লিনে বদলানো যাবে। পুরোনো stop_pct/step_pct এখন কাটার হিসাবে ব্যবহার হয় না।
-- সতর্কবার্তা: alert_hr (ডিফল্ট ২৪) ঘণ্টায় alert_n (ডিফল্ট ৩) বার চক্র শুরু হলে → (১) অ্যাডমিনে লাল ব্যানার ও তালিকা (সবসময়), (২) নিচের notify_url দিলে ফোনে/মেইলে বার্তা (pg_net দিয়ে; একটা বিনামূল্যের ntfy.sh লিংক বা Slack/Discord webhook)।
--   সতর্কবার্তা ২৪ ঘণ্টায় একবারের বেশি যায় না। ডেটাবেস থেকে সত্যিকারের স্ক্রিনশট পাঠানো যায় না; বার্তায় সব সংখ্যা (%, MB, কার্ড, সময়) থাকে, আর অ্যাডমিনে ব্যানারটা স্ক্রিনশট নেওয়ার মতো।
-- কোনো TRUNCATE নেই; সব ডিলিটে WHERE আছে।

do $$ begin create extension if not exists pg_net with schema extensions; exception when others then raise notice 'pg_net চালু করা যায়নি — অ্যাডমিনের ব্যানার কাজ করবে, বাইরে বার্তা যাবে না'; end $$;

alter table mc2_cleanup_state add column if not exists seq int not null default 0;
alter table mc2_cleanup_state add column if not exists last_start timestamptz;
alter table mc2_cleanup_state add column if not exists base bigint;   -- ডেটাবেস: শেষ চক্র শেষ হওয়ার সময়ের ফাইল-সাইজ (আবার "ভরেছে" ধরার ভিত্তি)

create table if not exists mc2_cleanup_starts (id bigserial primary key, k text not null, at timestamptz not null default now(), pct numeric, cut numeric);
create index if not exists mc2_cleanup_starts_k_at on mc2_cleanup_starts (k, at);
create table if not exists mc2_cleanup_alerts (id bigserial primary key, at timestamptz not null default now(), k text not null, msg text not null, sent text, seen boolean not null default false);
alter table mc2_cleanup_starts enable row level security;
alter table mc2_cleanup_alerts enable row level security;

create or replace function mc2_cleanup_defaults() returns jsonb language sql immutable as $$
  select jsonb_build_object('on', true, 'others_on', true, 'db_mb', 500, 'start_pct', 90, 'card_pct', 90, 'card_max', 1000000, 'batch', 200, 'card_batch', 50,
    'min_age_days', 7, 'card_min_days', 0, 'visits_days', 0, 'visits_max', 3000, 'bin_days', 30, 'answers_days', 0, 'presence_days', 60, 'cards_days', 0,
    'stop_pct', 87, 'floor_pct', 80, 'step_pct', 2, 'storage_mb', 1024, 'shot_ok_days', 7, 'shot_no_days', 0, 'ip_view_min', 600, 'ip_card_hr', 1500, 'ip_score_hr', 1500, 'ip_entry_hr', 300, 'score_dev_hr', 30, 'visit_dev_hr', 40, 'card_per_dev', 20, 'card_gap_sec', 2,
    'cut1', 2, 'cut2', 3, 'cut3', 5, 'alert_n', 3, 'alert_hr', 24, 'notify_url', '', 'notify_email', '')
$$;

create or replace function mc2_cleanup_admin_set(p_cfg jsonb) returns void language plpgsql security definer set search_path = public as $$
declare k text; v numeric; lo numeric; hi numeric;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_cfg is null or jsonb_typeof(p_cfg) <> 'object' then raise exception 'bad cfg'; end if;
  for k in select jsonb_object_keys(p_cfg) loop
    if k in ('notify_url', 'notify_email') then
      if jsonb_typeof(p_cfg -> k) <> 'string' then raise exception '% must be text', k; end if;
      if k = 'notify_url' and (p_cfg ->> k) <> '' and (p_cfg ->> k) !~ '^https://[^[:space:]]{4,380}$' then raise exception 'notify_url must be an https link'; end if;
      if k = 'notify_email' and (p_cfg ->> k) <> '' and ((p_cfg ->> k) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(p_cfg ->> k) > 120) then raise exception 'notify_email looks wrong'; end if;
    elsif k in ('on', 'others_on') then
      if jsonb_typeof(p_cfg -> k) <> 'boolean' then raise exception '% must be true/false', k; end if;
    else
      if k not in ('db_mb', 'start_pct', 'card_pct', 'card_max', 'batch', 'card_batch', 'min_age_days', 'card_min_days', 'visits_days', 'answers_days', 'presence_days', 'cards_days',
                   'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'card_gap_sec', 'visits_max', 'bin_days', 'stop_pct', 'floor_pct', 'step_pct', 'storage_mb', 'shot_ok_days', 'shot_no_days', 'cut1', 'cut2', 'cut3', 'alert_n', 'alert_hr') then raise exception 'unknown key %', k; end if;
      if jsonb_typeof(p_cfg -> k) <> 'number' then raise exception '% must be a number', k; end if;
      v := (p_cfg ->> k)::numeric;
      lo := case when k in ('db_mb', 'batch', 'card_batch', 'min_age_days', 'card_max', 'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'visits_max', 'step_pct', 'storage_mb', 'cut1', 'cut2', 'cut3', 'alert_n', 'alert_hr') then 1 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 10 else 0 end;
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 99 when k = 'step_pct' then 20 when k in ('cut1', 'cut2', 'cut3') then 20 when k = 'alert_n' then 50 when k = 'alert_hr' then 168 when k = 'storage_mb' then 100000 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k = 'card_max' then 1000000
                 when k in ('ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr') then 1000000 when k in ('score_dev_hr', 'visit_dev_hr') then 100000 when k = 'card_per_dev' then 1000 when k = 'visits_max' then 1000000 when k = 'card_gap_sec' then 60 else 3650 end;
      if v < lo or v > hi or v <> trunc(v) then raise exception '% must be a whole number % to %', k, lo, hi; end if;
    end if;
  end loop;
  insert into mc2_cleanup_cfg(id, cfg) values (1, p_cfg) on conflict (id) do update set cfg = excluded.cfg;
end $$;
revoke all on function mc2_cleanup_admin_set(jsonb) from public, anon;
grant execute on function mc2_cleanup_admin_set(jsonb) to authenticated;

create or replace function mc2_cleanup_run(p_dry boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); m text; lim bigint; used bigint; pct numeric; stp numeric; fl numeric := (c ->> 'floor_pct')::numeric; sp numeric := (c ->> 'start_pct')::numeric; s0 numeric := (c ->> 'stop_pct')::numeric;
  st record; goal bigint; stg text; r record; freed bigint; rem bigint; res jsonb := jsonb_build_object('dry', p_dry); lot int := greatest((c ->> 'batch')::int, 1);
  cutv numeric; n24 int;
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
        if not p_dry then
          if m = 'db' and st.base is not null then update mc2_cleanup_state set base = null where k = m; end if;   -- সাইজ ৯০%-এর নিচে নেমেছে (যেমন VACUUM FULL-এর পর): নতুন করে শুরু
          if st.seq <> 0 and st.ended is not null and st.ended < now() - interval '3 days' then update mc2_cleanup_state set seq = 0 where k = m; end if;   -- ৩ দিন শান্ত থাকলে ক্রম আবার ২% থেকে
        end if;
        continue;
      end if;
      -- ডেটাবেস: DELETE-এ ফাইলের সাইজ কমে না, খালি জায়গা নতুন ডেটায় ভরে। তাই শেষ চক্র শেষ হওয়ার সাইজের চেয়ে ≈০.২% (≈১ MB) না বাড়া পর্যন্ত আবার "ভরেছে" ধরা হয় না (নইলে প্রতি ১০ মিনিটে নতুন চক্র শুরু হতো)।
      if m = 'db' and st.base is not null and used < st.base + (lim * 0.002)::bigint then res := res || jsonb_build_object('db_wait', true); continue; end if;
      -- কাটার ক্রম: ১ম বার cut1 (২%), ২য় বার cut2 (৩%), ৩য় বার cut3 (৫%), তারপর আবার ২,৩,৫… ; প্রতিবার সীমার cut% পরিমাণ পুরোনো ডেটা কেটে জায়গা খালি করে (≈ ৯০ → ৮৮ / ৮৭ / ৮৫); ৮০% মেঝের নিচে নয়
      cutv := coalesce(nullif(c ->> ('cut' || ((st.seq % 3) + 1)), '')::numeric, 2);
      stp := greatest(fl, sp - cutv);
      goal := least((cutv / 100.0 * lim)::bigint, greatest(((pct - fl) / 100.0 * lim)::bigint, 0), (lim * 0.15)::bigint);   -- কাটার পরিমাণ = cut% × সীমা; ৮০% মেঝের নিচে নয়
      res := res || jsonb_build_object(m || '_cut', cutv, m || '_stop', stp, m || '_goal_mb', round(goal / 1048576.0, 1));
      if goal <= 0 or p_dry then continue; end if;
      update mc2_cleanup_state set stop = stp, active = true, remain = goal, seq = seq + 1, last_start = now(), base = null where k = m;
      insert into mc2_cleanup_starts(k, pct, cut) values (m, pct, cutv);
      delete from mc2_cleanup_starts where at < now() - interval '14 days';
      select count(*) into n24 from mc2_cleanup_starts where k = m and at > now() - make_interval(hours => greatest((c ->> 'alert_hr')::int, 1));
      if n24 >= greatest((c ->> 'alert_n')::int, 1) and not exists (select 1 from mc2_cleanup_alerts a where a.k = m and a.at > now() - make_interval(hours => greatest((c ->> 'alert_hr')::int, 1))) then
        begin perform mc2_cleanup_notify(m, pct, n24, cutv, stp, used, c); exception when others then null; end;   -- বার্তা না গেলেও ক্লিনআপ থামবে না
      end if;
    else
      if p_dry then res := res || jsonb_build_object(m || '_active', true, m || '_remain_mb', round(st.remain / 1048576.0, 1)); continue; end if;
      if pct <= fl or (m = 'st' and pct <= st.stop) then update mc2_cleanup_state set active = false, ended = now(), base = case when m = 'db' then used else null end where k = m; continue; end if;
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
    if freed = 0 or rem <= 0 then update mc2_cleanup_state set active = false, ended = now(), remain = 0, base = case when m = 'db' then used else null end where k = m;
    else update mc2_cleanup_state set remain = rem where k = m; end if;
  end loop;
  return res;
end $$;
revoke all on function mc2_cleanup_run(boolean) from public, anon, authenticated;


-- সতর্কবার্তা: অ্যাডমিন তালিকায় রেখে (সবসময়), notify_url থাকলে বাইরেও পাঠায়। ব্যর্থ হলেও ক্লিনআপ থামে না।
create or replace function mc2_cleanup_notify(p_k text, p_pct numeric, p_n int, p_cut numeric, p_target numeric, p_used bigint, c jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare msg text; url text := coalesce(c ->> 'notify_url', ''); em text := nullif(c ->> 'notify_email', ''); host text; topic text; snt text := 'শুধু অ্যাডমিনে (বাইরের লিংক দেওয়া নেই)'; aid bigint; nm text := case when p_k = 'st' then 'Storage' else 'ডেটাবেস' end;
begin
  if p_k = 'test' then
    msg := '✅ MC Explorer: পরীক্ষা বার্তা — অটো-ক্লিন সতর্কবার্তা ঠিকমতো পৌঁছাচ্ছে।' || E'\nসময়: ' || to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD HH24:MI');
  else
    msg := '⚠️ MC Explorer অটো-ক্লিন সতর্কতা' || E'\n' || nm || ' ' || p_n || ' বার ' || coalesce(c ->> 'alert_hr', '24') || ' ঘণ্টায় ' || coalesce(c ->> 'start_pct', '90') || '% ছুঁয়েছে।' ||
      E'\nএখন: ' || p_pct || '% (' || round(p_used / 1048576.0, 1) || ' MB)' ||
      E'\nএবারের কাটা: ' || p_cut || '% (লক্ষ্য ' || p_target || '%)' ||
      E'\nকার্ড: ' || (select count(*) from mc2_cards) ||
      E'\nসময়: ' || to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD HH24:MI') ||
      E'\nকরণীয়: অ্যাডমিন > 🧹 অটো-ক্লিন দেখুন। বারবার হলে Supabase প্ল্যান বাড়ান বা পুরোনো ডেটা হাতে মুছুন।';
  end if;
  insert into mc2_cleanup_alerts(k, msg, sent) values (p_k, msg, snt) returning id into aid;
  if url ~ '^https://' then
    begin
      if url ~* '^https://[^/]*ntfy[^/]*/[^/?#]+/?$' then
        host := substring(url from '^(https://[^/]+)'); topic := regexp_replace(substring(url from '^https://[^/]+/([^/?#]+)'), '/$', '');
        perform net.http_post(url := host, body := jsonb_build_object('topic', topic, 'title', 'MC Explorer auto-clean alert', 'message', msg, 'priority', 4, 'tags', jsonb_build_array('warning')) || case when em is not null then jsonb_build_object('email', em) else '{}'::jsonb end);
      else
        perform net.http_post(url := url, body := jsonb_build_object('text', msg, 'content', msg, 'message', msg));
      end if;
      snt := 'বাইরে পাঠানোর অনুরোধ দেওয়া হয়েছে';
    exception when others then snt := 'বাইরে পাঠানো যায়নি: ' || left(sqlerrm, 140);
    end;
    update mc2_cleanup_alerts set sent = snt where id = aid;
  end if;
end $$;
revoke all on function mc2_cleanup_notify(text, numeric, int, numeric, numeric, bigint, jsonb) from public, anon, authenticated;

create or replace function mc2_cleanup_alerts_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object('unseen', (select count(*) from mc2_cleanup_alerts where not seen and k <> 'test'),
    'rows', coalesce((select jsonb_agg(to_jsonb(x) order by x.id desc) from (select id, (extract(epoch from at) * 1000)::bigint ts, k, msg, sent, seen from mc2_cleanup_alerts order by id desc limit 10) x), '[]'::jsonb));
end $$;
revoke all on function mc2_cleanup_alerts_list() from public, anon;
grant execute on function mc2_cleanup_alerts_list() to authenticated;

create or replace function mc2_cleanup_alerts_seen() returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  update mc2_cleanup_alerts set seen = true where not seen;
end $$;
revoke all on function mc2_cleanup_alerts_seen() from public, anon;
grant execute on function mc2_cleanup_alerts_seen() to authenticated;

create or replace function mc2_cleanup_test_notify() returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  perform mc2_cleanup_notify('test', 0, 0, 0, 0, 0, mc2_cleanup_cfg_get());
end $$;
revoke all on function mc2_cleanup_test_notify() from public, anon;
grant execute on function mc2_cleanup_test_notify() to authenticated;

notify pgrst, 'reload schema';

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক (pg_net সারিটা false হলে শুধু বাইরের বার্তা যাবে না)
select 'কাটার ক্রম cut1..3' as item, (mc2_cleanup_defaults() ->> 'cut3') = '5' as ok
union all select 'সতর্কবার্তা ফাংশন', exists (select 1 from pg_proc where proname = 'mc2_cleanup_notify')
union all select 'সতর্কবার্তা তালিকা (অ্যাডমিন)', exists (select 1 from pg_proc where proname = 'mc2_cleanup_alerts_list')
union all select 'ক্রম/সতর্কতা টেবিল', to_regclass('public.mc2_cleanup_alerts') is not null and to_regclass('public.mc2_cleanup_starts') is not null
union all select 'pg_net (বাইরে বার্তা)', exists (select 1 from pg_extension where extname = 'pg_net');

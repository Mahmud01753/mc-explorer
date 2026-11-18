-- supabase-new-20261023.sql — অটো-ক্লিন: প্রতিবার (প্রতি চক্রে) সর্বোচ্চ ১০% কাটা। শুধু এই ফাইলটাই নতুন; একবার Run করুন।
-- আগে ...20261022.sql চালানো থাকতে হবে। কোনো টেবিল/ডেটা মোছে না।
-- ১) সেটিংয়ে cut1/cut2/cut3 এখন সর্বোচ্চ ১০ (আগে ২০)। ২) চক্রপ্রতি কাটার ওপরের সীমা ১৫% → ১০%। ৩) আগে সেভ করা ১০-এর বেশি মান ১০ করে দেয়।

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
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 99 when k = 'step_pct' then 20 when k in ('cut1', 'cut2', 'cut3') then 10 when k = 'alert_n' then 50 when k = 'alert_hr' then 168 when k = 'storage_mb' then 100000 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k = 'card_max' then 1000000
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
      goal := least((cutv / 100.0 * lim)::bigint, greatest(((pct - fl) / 100.0 * lim)::bigint, 0), (lim * 0.10)::bigint);   -- কাটার পরিমাণ = cut% × সীমা; ৮০% মেঝের নিচে নয়
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


update mc2_cleanup_cfg set cfg = cfg
  || case when (cfg ->> 'cut1') ~ '^[0-9]+$' and (cfg ->> 'cut1')::numeric > 10 then jsonb_build_object('cut1', 10) else '{}'::jsonb end
  || case when (cfg ->> 'cut2') ~ '^[0-9]+$' and (cfg ->> 'cut2')::numeric > 10 then jsonb_build_object('cut2', 10) else '{}'::jsonb end
  || case when (cfg ->> 'cut3') ~ '^[0-9]+$' and (cfg ->> 'cut3')::numeric > 10 then jsonb_build_object('cut3', 10) else '{}'::jsonb end
 where id = 1;

-- নাম-চেক: ok = true এলে ঠিক
select 'ক্লিনআপ সীমা ১০%' as item, position('0.10' in pg_get_functiondef('mc2_cleanup_run(boolean)'::regprocedure)) > 0 as ok;

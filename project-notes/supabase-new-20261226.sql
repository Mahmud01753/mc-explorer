-- supabase-new-20261226.sql — 👤 User Info ট্যাবে "🧹 অটো-ক্লিন": ইউজার ইনফো (ইউজার তালিকা) ও ইউজার লগ (ভিজিট-লগ) — দুটোর আলাদা অন/অফ ও আলাদা সংখ্যা, আর একটা ফুল সামারি।
-- ⏳ PENDING — মালিক নিজে "চালানো হয়েছে" বললে তবেই ✅ লেখা হবে। আগে ...20261023.sql ও ...20261110.sql (কার্ড-সুরক্ষা) চালানো থাকতে হবে (দুটোই ✅)।
-- কোনো নতুন টেবিল নেই, নতুন ডেটা জমে না (শুধু অটো-ক্লিন সেটিংয়ে ছোট কয়েকটা মান)। আবার চালালেও ক্ষতি নেই।
-- ডিফল্ট (মালিকের নির্দেশ): দুটোই চালু; ইউজার তালিকায় সর্বোচ্চ ২০০০ জন; একই আইপি-র সারি ১০০-এর বেশি হলে বাড়তি পুরোনোগুলো কাটে (তালিকা ও লগ আলাদা আলাদা গোনা; ০ = বন্ধ);
--   ১ ঘণ্টার (বদলানো যায়) মধ্যে আসা সারি কখনো কাটে না; ইউজার তালিকায় এখন অনলাইনে থাকা ও কার্ড আছে এমন ইউজারও কখনো কাটে না। দিন-নিয়ম: ইউজার তালিকা = presence_days, লগ = visits_days (০ = বন্ধ)।
-- প্রতি ১০ মিনিটের চক্রে প্রতিটি নিয়মে সর্বোচ্চ ২০০০ সারি। স্কোর/কার্ড/চ্যাট ছোঁয়া হয় না।

create or replace function mc2_cleanup_defaults() returns jsonb language sql immutable as $$
  select jsonb_build_object('on', true, 'others_on', true, 'db_mb', 500, 'start_pct', 90, 'card_pct', 90, 'card_max', 1000000, 'batch', 200, 'card_batch', 50,
    'min_age_days', 7, 'card_min_days', 0, 'visits_days', 0, 'visits_max', 3000, 'bin_days', 30, 'answers_days', 0, 'presence_days', 60, 'cards_days', 0,
    'stop_pct', 87, 'floor_pct', 80, 'step_pct', 2, 'storage_mb', 1024, 'shot_ok_days', 7, 'shot_no_days', 0, 'ip_view_min', 600, 'ip_card_hr', 1500, 'ip_score_hr', 1500, 'ip_entry_hr', 300, 'score_dev_hr', 30, 'visit_dev_hr', 40, 'card_per_dev', 20, 'card_gap_sec', 2,
    'cut1', 2, 'cut2', 3, 'cut3', 5, 'alert_n', 3, 'alert_hr', 24, 'notify_url', '', 'notify_email', '', 'presence_max', 2000, 'presence_auto', true, 'presence_ip_max', 100, 'presence_keep_hr', 1, 'visits_auto', true, 'visits_ip_max', 100, 'visits_keep_hr', 1)
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
    elsif k in ('on', 'others_on', 'presence_auto', 'visits_auto') then
      if jsonb_typeof(p_cfg -> k) <> 'boolean' then raise exception '% must be true/false', k; end if;
    else
      if k not in ('db_mb', 'start_pct', 'card_pct', 'card_max', 'batch', 'card_batch', 'min_age_days', 'card_min_days', 'visits_days', 'answers_days', 'presence_days', 'cards_days',
                   'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'card_gap_sec', 'visits_max', 'bin_days', 'stop_pct', 'floor_pct', 'step_pct', 'storage_mb', 'shot_ok_days', 'shot_no_days', 'cut1', 'cut2', 'cut3', 'alert_n', 'alert_hr', 'presence_max', 'presence_ip_max', 'presence_keep_hr', 'visits_ip_max', 'visits_keep_hr') then raise exception 'unknown key %', k; end if;
      if jsonb_typeof(p_cfg -> k) <> 'number' then raise exception '% must be a number', k; end if;
      v := (p_cfg ->> k)::numeric;
      lo := case when k in ('db_mb', 'batch', 'card_batch', 'min_age_days', 'card_max', 'ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr', 'score_dev_hr', 'visit_dev_hr', 'card_per_dev', 'visits_max', 'step_pct', 'storage_mb', 'cut1', 'cut2', 'cut3', 'alert_n', 'alert_hr') then 1 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 10 else 0 end;
      hi := case when k = 'db_mb' then 100000 when k in ('start_pct', 'card_pct', 'stop_pct', 'floor_pct') then 99 when k = 'step_pct' then 20 when k in ('cut1', 'cut2', 'cut3') then 10 when k = 'alert_n' then 50 when k = 'alert_hr' then 168 when k = 'storage_mb' then 100000 when k = 'batch' then 5000 when k = 'card_batch' then 1000 when k in ('card_max', 'presence_max', 'presence_ip_max', 'visits_ip_max') then 1000000
                 when k in ('ip_view_min', 'ip_card_hr', 'ip_score_hr', 'ip_entry_hr') then 1000000 when k in ('score_dev_hr', 'visit_dev_hr') then 100000 when k = 'card_per_dev' then 1000 when k = 'visits_max' then 1000000 when k = 'card_gap_sec' then 60 else 3650 end;
      if v < lo or v > hi or v <> trunc(v) then raise exception '% must be a whole number % to %', k, lo, hi; end if;
    end if;
  end loop;
  insert into mc2_cleanup_cfg(id, cfg) values (1, p_cfg) on conflict (id) do update set cfg = excluded.cfg;
end $$;
revoke all on function mc2_cleanup_admin_set(jsonb) from public, anon;
grant execute on function mc2_cleanup_admin_set(jsonb) to authenticated;






-- পুরোনো সংস্করণ (২-আর্গুমেন্ট) থাকলে সরানো, যাতে নাম গুলিয়ে না যায়
drop function if exists mc2_cleanup_presence_core(boolean, boolean);
drop function if exists mc2_presence_clean_set(boolean, int, int, int, int, int, int);
drop function if exists mc2_presence_clean_run(boolean);

-- ভিজিট-লগের পুরোনো নিয়ম (visits_days / visits_max) এখন visits_auto সুইচ মানে; ১ ঘণ্টার ভেতরের সারি সংখ্যা-নিয়মে কাটে না
create or replace function mc2_cleanup_visits() returns int language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); dd int := (c ->> 'visits_days')::int; mx int := (c ->> 'visits_max')::int; n int := 0; k int; tot int; kh int := greatest(coalesce((c ->> 'visits_keep_hr')::int, 1), 0);
begin
  if not coalesce((c ->> 'visits_auto')::boolean, true) then return 0; end if;
  if dd > 0 then
    delete from mc2_visits where ctid = any(array(select ctid from mc2_visits where created_at < now() - make_interval(days => dd) order by created_at limit 2000));
    get diagnostics k = row_count; n := n + k;
  end if;
  if mx > 0 then
    select count(*) into tot from mc2_visits;
    if tot > mx then
      delete from mc2_visits where ctid = any(array(select ctid from mc2_visits where created_at < now() - make_interval(hours => kh) order by created_at limit least(tot - mx, 2000)));
      get diagnostics k = row_count; n := n + k;
    end if;
  end if;
  if n > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_visits', n, 'age/count'); end if;
  return n;
end $$;
revoke all on function mc2_cleanup_visits() from public, anon, authenticated;

-- মূল কাজ: ইউজার ইনফো (mc2_presence) ও ইউজার লগ (mc2_visits)। p_part = 'presence' | 'visits' | 'both'। p_force = true হলে (অ্যাডমিনের বাটন) চালু-বন্ধ সুইচ না দেখেই চলে।
create or replace function mc2_cleanup_presence_core(p_dry boolean, p_force boolean, p_part text default 'both') returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get();
  pr boolean := p_part in ('both', 'presence') and (p_force or coalesce((c ->> 'presence_auto')::boolean, true));
  vr boolean := p_part in ('both', 'visits') and (p_force or coalesce((c ->> 'visits_auto')::boolean, true));
  dd int := coalesce((c ->> 'presence_days')::int, 0); mx int := coalesce((c ->> 'presence_max')::int, 0); ipm int := coalesce((c ->> 'presence_ip_max')::int, 0);
  keep timestamptz := now() - make_interval(hours => greatest(coalesce((c ->> 'presence_keep_hr')::int, 1), 0));
  vdd int := coalesce((c ->> 'visits_days')::int, 0); vmx int := coalesce((c ->> 'visits_max')::int, 0); vip int := coalesce((c ->> 'visits_ip_max')::int, 0);
  vkeep timestamptz := now() - make_interval(hours => greatest(coalesce((c ->> 'visits_keep_hr')::int, 1), 0));
  na int := 0; ni int := 0; nc int := 0; va int := 0; vi int := 0; vc int := 0; tot int; ex int; nocard int;
begin
  if pr then
    -- ১) দিন-নিয়ম
    if dd > 0 then
      if p_dry then
        select count(*) into na from mc2_presence p where p.last_seen < least(keep, now() - make_interval(days => greatest(dd, 1))) and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter);
      else
        with d as (delete from mc2_presence where ctid = any (array(select p.ctid from mc2_presence p where p.last_seen < least(keep, now() - make_interval(days => greatest(dd, 1))) and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter) order by p.last_seen limit 2000)) returning 1)
          select count(*) into na from d;
      end if;
    end if;
    -- ২) একই আইপি: এক আইপি-র সারি ipm-এর বেশি হলে সবচেয়ে পুরোনো বাড়তিগুলো
    if ipm > 0 then
      if p_dry then
        select count(*) into ni from (select q.voter, q.last_seen, q.offline, row_number() over (partition by q.ip order by q.last_seen desc) rn from mc2_presence q where q.ip is not null and q.ip <> '') p
          where p.rn > ipm and p.last_seen < keep and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter) and (dd = 0 or p.last_seen >= now() - make_interval(days => greatest(dd, 1)));
        ni := least(ni, 2000);
      else
        with d as (delete from mc2_presence where ctid = any (array(select p.ct from (select q.ctid ct, q.voter, q.last_seen, q.offline, row_number() over (partition by q.ip order by q.last_seen desc) rn from mc2_presence q where q.ip is not null and q.ip <> '') p
          where p.rn > ipm and p.last_seen < keep and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter) order by p.last_seen limit 2000)) returning 1)
          select count(*) into ni from d;
      end if;
    end if;
    -- ৩) সংখ্যা-নিয়ম
    if mx > 0 then
      select count(*) into tot from mc2_presence; tot := tot - case when p_dry then na + ni else 0 end;
      ex := greatest(tot - mx, 0);
      if ex > 0 then
        if p_dry then
          select count(*) into nocard from mc2_presence p where p.last_seen < keep and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter);
          nc := least(ex, 2000, greatest(nocard - na - ni, 0));
        else
          with d as (delete from mc2_presence where ctid = any (array(select p.ctid from mc2_presence p where p.last_seen < keep and not mc2_online(p.last_seen, p.offline) and not exists (select 1 from mc2_cards cd where cd.device = p.voter) order by p.last_seen limit least(ex, 2000))) returning 1)
            select count(*) into nc from d;
        end if;
      end if;
    end if;
    if not p_dry and na + ni + nc > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_presence', na + ni + nc, concat_ws('+', case when na > 0 then 'age' end, case when ni > 0 then 'same-ip' end, case when nc > 0 then 'count' end)); end if;
  end if;
  if vr then
    -- ১) দিন-নিয়ম
    if vdd > 0 then
      if p_dry then select count(*) into va from mc2_visits v where v.created_at < least(vkeep, now() - make_interval(days => greatest(vdd, 1)));
      else
        with d as (delete from mc2_visits where ctid = any (array(select v.ctid from mc2_visits v where v.created_at < least(vkeep, now() - make_interval(days => greatest(vdd, 1))) order by v.created_at limit 2000)) returning 1) select count(*) into va from d;
      end if;
    end if;
    -- ২) একই আইপি
    if vip > 0 then
      if p_dry then
        select count(*) into vi from (select v.created_at, row_number() over (partition by v.ip order by v.created_at desc) rn from mc2_visits v where v.ip is not null and v.ip <> '') p
          where p.rn > vip and p.created_at < vkeep and (vdd = 0 or p.created_at >= now() - make_interval(days => greatest(vdd, 1)));
        vi := least(vi, 2000);
      else
        with d as (delete from mc2_visits where ctid = any (array(select p.ct from (select v.ctid ct, v.created_at, row_number() over (partition by v.ip order by v.created_at desc) rn from mc2_visits v where v.ip is not null and v.ip <> '') p where p.rn > vip and p.created_at < vkeep order by p.created_at limit 2000)) returning 1)
          select count(*) into vi from d;
      end if;
    end if;
    -- ৩) সংখ্যা-নিয়ম
    if vmx > 0 then
      select count(*) into tot from mc2_visits; tot := tot - case when p_dry then va + vi else 0 end;
      ex := greatest(tot - vmx, 0);
      if ex > 0 then
        if p_dry then
          select count(*) into nocard from mc2_visits v where v.created_at < vkeep;
          vc := least(ex, 2000, greatest(nocard - va - vi, 0));
        else
          with d as (delete from mc2_visits where ctid = any (array(select v.ctid from mc2_visits v where v.created_at < vkeep order by v.created_at limit least(ex, 2000))) returning 1) select count(*) into vc from d;
        end if;
      end if;
    end if;
    if not p_dry and va + vi + vc > 0 then insert into mc2_cleanup_log(what, n, note) values ('mc2_visits', va + vi + vc, concat_ws('+', case when va > 0 then 'age' end, case when vi > 0 then 'same-ip' end, case when vc > 0 then 'count' end)); end if;
  end if;
  return jsonb_build_object('dry', p_dry, 'p', jsonb_build_object('on', pr, 'days', na, 'ip', ni, 'count', nc), 'v', jsonb_build_object('on', vr, 'days', va, 'ip', vi, 'count', vc), 'total', na + ni + nc + va + vi + vc);
end $$;
revoke all on function mc2_cleanup_presence_core(boolean, boolean, text) from public, anon, authenticated;

create or replace function mc2_cleanup_presence() returns int language plpgsql security definer set search_path = public as $$
begin return coalesce((mc2_cleanup_presence_core(false, false, 'both') ->> 'total')::int, 0); end $$;
revoke all on function mc2_cleanup_presence() from public, anon, authenticated;

create or replace function mc2_cleanup_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((mc2_cleanup_cfg_get() ->> 'on')::boolean, true) then return; end if;   -- জোর করে বন্ধ করা থাকলে কিছুই চলবে না
  if mc2_cleanup_lock() then
    if mc2_ac_rl('cleanup', 1, 600) then
      begin perform mc2_cleanup_presence(); exception when others then null; end;   -- ইউজার ইনফো অটো-ক্লিন (মালিকের সেটিং; বন্ধ থাকলে কিছুই করে না)
      perform mc2_cleanup_visits(); perform mc2_bin_sweep(); perform mc2_shot_purge(); perform mc2_cleanup_run(false);
    end if;
  end if;
exception when others then null;
end $$;
revoke all on function mc2_cleanup_tick() from public, anon, authenticated;

-- অ্যাডমিন: সেটিং + "এখনই কত যেত" হিসাব
create or replace function mc2_presence_clean_get() returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); d jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  d := mc2_cleanup_presence_core(true, true, 'both');
  return jsonb_build_object(
    'p', jsonb_build_object('auto', coalesce((c ->> 'presence_auto')::boolean, true), 'max', coalesce((c ->> 'presence_max')::int, 0), 'ip', coalesce((c ->> 'presence_ip_max')::int, 0), 'keep', coalesce((c ->> 'presence_keep_hr')::int, 1), 'days', coalesce((c ->> 'presence_days')::int, 0),
      'n_days', d -> 'p' -> 'days', 'n_ip', d -> 'p' -> 'ip', 'n_count', d -> 'p' -> 'count'),
    'v', jsonb_build_object('auto', coalesce((c ->> 'visits_auto')::boolean, true), 'max', coalesce((c ->> 'visits_max')::int, 0), 'ip', coalesce((c ->> 'visits_ip_max')::int, 0), 'keep', coalesce((c ->> 'visits_keep_hr')::int, 1), 'days', coalesce((c ->> 'visits_days')::int, 0),
      'n_days', d -> 'v' -> 'days', 'n_ip', d -> 'v' -> 'ip', 'n_count', d -> 'v' -> 'count'));
end $$;

create or replace function mc2_presence_clean_set(p_auto boolean, p_days int, p_max int, p_ip_max int, p_keep_hr int) returns void language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_days is null or p_days < 0 or p_days > 3650 then raise exception 'days must be 0 to 3650'; end if;
  if p_max is null or p_max < 0 or p_max > 1000000 then raise exception 'max must be 0 to 1000000'; end if;
  if p_ip_max is null or p_ip_max < 0 or p_ip_max > 1000000 then raise exception 'ip max must be 0 to 1000000'; end if;
  if p_keep_hr is null or p_keep_hr < 0 or p_keep_hr > 720 then raise exception 'keep hours must be 0 to 720'; end if;
  j := jsonb_build_object('presence_auto', coalesce(p_auto, true), 'presence_days', p_days, 'presence_max', p_max, 'presence_ip_max', p_ip_max, 'presence_keep_hr', p_keep_hr);
  insert into mc2_cleanup_cfg(id, cfg) values (1, j) on conflict (id) do update set cfg = mc2_cleanup_cfg.cfg || j;
end $$;

create or replace function mc2_visits_clean_set(p_auto boolean, p_days int, p_max int, p_ip_max int, p_keep_hr int) returns void language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_days is null or p_days < 0 or p_days > 3650 then raise exception 'days must be 0 to 3650'; end if;
  if p_max is null or p_max < 0 or p_max > 1000000 then raise exception 'max must be 0 to 1000000'; end if;
  if p_ip_max is null or p_ip_max < 0 or p_ip_max > 1000000 then raise exception 'ip max must be 0 to 1000000'; end if;
  if p_keep_hr is null or p_keep_hr < 0 or p_keep_hr > 720 then raise exception 'keep hours must be 0 to 720'; end if;
  j := jsonb_build_object('visits_auto', coalesce(p_auto, true), 'visits_days', p_days, 'visits_max', p_max, 'visits_ip_max', p_ip_max, 'visits_keep_hr', p_keep_hr);
  insert into mc2_cleanup_cfg(id, cfg) values (1, j) on conflict (id) do update set cfg = mc2_cleanup_cfg.cfg || j;
end $$;

create or replace function mc2_presence_clean_run(p_dry boolean default true, p_part text default 'both') returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_part is null or p_part not in ('presence', 'visits', 'both') then raise exception 'bad part'; end if;
  return mc2_cleanup_presence_core(coalesce(p_dry, true), true, p_part);
end $$;

-- অ্যাডমিন: ফুল সামারি (শুধু পড়া)
create or replace function mc2_presence_summary() returns jsonb language plpgsql security definer set search_path = public as $$
declare c jsonb := mc2_cleanup_cfg_get(); pip int := coalesce((c ->> 'presence_ip_max')::int, 0); vip int := coalesce((c ->> 'visits_ip_max')::int, 0);
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'p_total', (select count(*) from mc2_presence),
    'p_online', (select count(*) from mc2_presence where mc2_online(last_seen, offline)),
    'p_h1', (select count(*) from mc2_presence where last_seen > now() - interval '1 hour'),
    'p_h24', (select count(*) from mc2_presence where last_seen > now() - interval '24 hours'),
    'p_cards', (select count(*) from mc2_presence p where exists (select 1 from mc2_cards cd where cd.device = p.voter)),
    'p_ips', (select count(distinct ip) from mc2_presence where ip is not null and ip <> ''),
    'p_noip', (select count(*) from mc2_presence where ip is null or ip = ''),
    'p_old', (select min(last_seen) from mc2_presence),
    'p_mb', round(pg_total_relation_size('mc2_presence') / 1048576.0, 2),
    'p_bigip', case when pip > 0 then (select count(*) from (select ip from mc2_presence where ip is not null and ip <> '' group by ip having count(*) > pip) x) else 0 end,
    'v_total', (select count(*) from mc2_visits),
    'v_h24', (select count(*) from mc2_visits where created_at > now() - interval '24 hours'),
    'v_ips', (select count(distinct ip) from mc2_visits where ip is not null and ip <> ''),
    'v_devs', (select count(distinct device) from mc2_visits),
    'v_old', (select min(created_at) from mc2_visits),
    'v_mb', round(pg_total_relation_size('mc2_visits') / 1048576.0, 2),
    'v_bigip', case when vip > 0 then (select count(*) from (select ip from mc2_visits where ip is not null and ip <> '' group by ip having count(*) > vip) x) else 0 end,
    'v_over', case when vip > 0 then (select coalesce(sum(n - vip), 0) from (select count(*) n from mc2_visits where ip is not null and ip <> '' group by ip having count(*) > vip) x) else 0 end,
    'db_mb', round(pg_database_size(current_database()) / 1048576.0, 1),
    'db_lim', coalesce((mc2_cleanup_cfg_get() ->> 'db_mb')::int, 500),
    'c_mb', round(pg_total_relation_size('mc2_cards') / 1048576.0, 2),
    'top', coalesce((select jsonb_agg(z order by (z ->> 'v')::int desc, (z ->> 'p')::int desc) from (
        select jsonb_build_object('ip', coalesce(a.ip, b.ip), 'p', coalesce(a.n, 0), 'v', coalesce(b.n, 0)) z
        from (select ip, count(*) n from mc2_presence where ip is not null and ip <> '' group by ip) a
        full join (select ip, count(*) n from mc2_visits where ip is not null and ip <> '' group by ip) b on a.ip = b.ip
        order by coalesce(b.n, 0) + coalesce(a.n, 0) desc limit 8) y), '[]'::jsonb));
end $$;

revoke all on function mc2_presence_clean_get(), mc2_presence_clean_set(boolean, int, int, int, int), mc2_visits_clean_set(boolean, int, int, int, int), mc2_presence_clean_run(boolean, text), mc2_presence_summary() from public, anon;
grant execute on function mc2_presence_clean_get(), mc2_presence_clean_set(boolean, int, int, int, int), mc2_visits_clean_set(boolean, int, int, int, int), mc2_presence_clean_run(boolean, text), mc2_presence_summary() to authenticated;

-- নাম-চেক: সবগুলো ok = true এলে ঠিক
select 'ইউজার-ক্লিন ফাংশন' as item, to_regprocedure('mc2_presence_clean_run(boolean,text)') is not null as ok
union all select 'সামারি ফাংশন', to_regprocedure('mc2_presence_summary()') is not null
union all select 'নতুন সেটিং কী', position('visits_ip_max' in pg_get_functiondef('mc2_cleanup_admin_set(jsonb)'::regprocedure)) > 0
union all select 'টিক চালু', position('mc2_cleanup_presence' in pg_get_functiondef('mc2_cleanup_tick()'::regprocedure)) > 0;

-- NEW SQL (2026-10-18 f): হোমের বিজয়ী লাইনের অন/অফ ও লেখা (mc2_settings key 'home_cfg')
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই।
-- আগে চালানো থাকতে হবে: supabase-new-20261018b.sql (চালানোই আছে)।
-- home_cfg = {"l1":true|false, "l2":true|false, "t1":"লেখা", "t2":"লেখা"}; পাবলিক-রিড (mc2_settings আগেই পাবলিক-রিড)।

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
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- প্রশ্ন নতুন করে বানানোর ট্রিগার home_cfg-তে চলবে না
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg', 'home_cfg')) execute function mc2_trg_rebuild();

-- নাম-চেক: দুটো সারিতেই true এলে ঠিক
select 'check fn has home_cfg' as name, (select prosrc like '%home_cfg%' from pg_proc where proname = 'mc2_settings_check' limit 1) as ok
union all select 'trigger skips home_cfg', exists (select 1 from pg_trigger where tgname = 't_mc2_settings_q' and pg_get_triggerdef(oid) like '%home_cfg%');

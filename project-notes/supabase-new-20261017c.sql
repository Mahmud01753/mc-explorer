-- MC Explorer: কার্ড PNG-এর KB ইচ্ছামতো (১০–১০,০০,০০০ KB; ০ = আনলিমিটেড) + কাস্টম কার্ড সাইজ (চওড়া×উচ্চতা) সেটিংস (ছোট ফাইল — একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql ও supabase-ui-settings.sql চালানো থাকতে হবে (সেগুলো চালানোই আছে)।
-- কী করে: (১) 'png_max_kb'-এর সীমা ১০০–৫০০০ থেকে বাড়িয়ে ১০–১০,০০,০০০ করে (০ = আনলিমিটেড);
--          (২) mc2_settings-এ নতুন key 'card_cfg' ({"on":bool,"w":..,"h":..,"sw":..,"sh":..}) সেভ করার অনুমতি দেয় (১০০–৮০০০ px);
--          (৩) 'card_cfg' সেভ করলে কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 10 and 1000000) then raise exception 'png_max_kb must be 0 or 10..1000000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  elsif new.key = 'card_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 2000 then raise exception 'card_cfg must be an object'; end if;
    if exists (select 1 from jsonb_each(new.value) e where e.key in ('w', 'h', 'sw', 'sh') and (jsonb_typeof(e.value) <> 'number' or (e.value #>> '{}')::numeric not between 100 and 8000)) then raise exception 'card_cfg sizes must be 100..8000'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg')) execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('card_cfg', '{"on":false,"w":1080,"h":1400,"sw":1080,"sh":1920}') on conflict (key) do nothing;

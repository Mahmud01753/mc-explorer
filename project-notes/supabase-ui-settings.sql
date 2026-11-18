-- MC Explorer: হোম / নিয়ম-পপআপ / ফল-কার্ডের বাটন অন-অফ সেটিংস (ছোট ফাইল — এটা একবার চালাতে হবে)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। বারবার চালালেও ক্ষতি নেই।
-- আগে supabase-gallery.sql চালানো থাকতে হবে (mc2_settings টেবিল সেখানে; সাইট ওটা পাবলিকলি পড়তে পারে, শুধু অ্যাডমিন লিখতে পারে)।
-- কী করে: mc2_settings-এ নতুন key 'ui_cfg' (JSON: {"off":["চাবি",...]}) সেভ করার অনুমতি দেয়, আর এই key সেভ করলে
-- কুইজের প্রশ্ন নতুন করে বানানোর ট্রিগার যেন অকারণে না চলে তা ঠিক করে।

create or replace function mc2_settings_check() returns trigger language plpgsql as $$
begin
  if new.key = 'quiz_count' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not between 1 and 50 then raise exception 'quiz_count must be 1..50'; end if;
  elsif new.key = 'wrong_options' then
    if jsonb_typeof(new.value) <> 'number' or (new.value #>> '{}')::numeric not in (3, 4) then raise exception 'wrong_options must be 3 or 4'; end if;
  elsif new.key = 'png_max_kb' then
    if jsonb_typeof(new.value) <> 'number' or not ((new.value #>> '{}')::numeric = 0 or (new.value #>> '{}')::numeric between 100 and 5000) then raise exception 'png_max_kb must be 0 or 100..5000'; end if;
  elsif new.key = 'quiz_categories' then
    if jsonb_typeof(new.value) <> 'array' then raise exception 'quiz_categories must be an array'; end if;
  elsif new.key = 'ui_cfg' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'off') is distinct from 'array' or pg_column_size(new.value) > 8000 then raise exception 'ui_cfg must be {"off":[...]}'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- আগে: যেকোনো সেটিংস সেভে প্রশ্ন নতুন করে বানাত। এখন: 'ui_cfg' বাদে বাকি key-র জন্য আগের মতোই।
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key <> 'ui_cfg') execute function mc2_trg_rebuild();

insert into mc2_settings(key, value) values ('ui_cfg', '{"off":[]}') on conflict (key) do nothing;

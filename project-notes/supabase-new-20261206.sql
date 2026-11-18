-- MC Explorer: কুইজ ছবির সেটিং (key 'qimg_cfg') সেভ করার অনুমতি। Supabase > SQL Editor-এ পুরোটা একবার Run; বারবার চালালেও ক্ষতি নেই।
-- আগের সব key (লোগো-ছবি সহ) অপরিবর্তিত, শুধু qimg_cfg যোগ। কোনো ডাটা বদলায় না।

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
  elsif new.key = 'logo_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 6000 then raise exception 'logo_cfg must be an object (<= 6000 bytes)'; end if;
  elsif new.key ~ '^logo_img_[0-9]{1,4}$' then
    if jsonb_typeof(new.value) <> 'object' or jsonb_typeof(new.value -> 'd') is distinct from 'string'
       or (new.value ->> 'd') !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$'
       or length(new.value ->> 'd') > 160000 then
      raise exception 'logo_img must be {"d":"data:image/(png|jpeg|webp);base64,..."} up to 160000 chars';
    end if;
  elsif new.key = 'qimg_cfg' then
    if jsonb_typeof(new.value) <> 'object' or pg_column_size(new.value) > 1500 then raise exception 'qimg_cfg must be an object (<= 1500 bytes)'; end if;
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;
drop trigger if exists t_mc2_settings_check on mc2_settings;
create trigger t_mc2_settings_check before insert or update on mc2_settings for each row execute function mc2_settings_check();

-- qimg_cfg সেভে কুইজের প্রশ্ন নতুন করে বানানোর দরকার নেই
drop trigger if exists t_mc2_settings_q on mc2_settings;
create trigger t_mc2_settings_q after insert or update on mc2_settings for each row when (new.key not in ('ui_cfg', 'card_cfg', 'home_cfg', 'board_cfg', 'qimg_cfg')) execute function mc2_trg_rebuild();

notify pgrst, 'reload schema';
select 'qimg_cfg অনুমোদিত' as item, pg_get_functiondef('mc2_settings_check()'::regprocedure) like '%qimg_cfg%' as ok;

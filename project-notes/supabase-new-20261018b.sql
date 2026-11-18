-- NEW SQL (2026-10-18 b): কুইজে অপশন সংখ্যা কাস্টম (মোট = ১ সঠিক + যত ছবি তত ভুল; যেমন মোট ২, ৩, ৫, ৬, ৭, ৯)
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই।
-- আগে চালানো থাকতে হবে: supabase-new-20261017c.sql (সেগুলো চালানোই আছে)।

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
  else
    raise exception 'unknown setting';
  end if;
  return new;
end $$;

create or replace function mc2_rebuild_questions() returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select least(greatest(coalesce((select (value #>> '{}')::int from mc2_settings where key = 'wrong_options'), 3), 1), 500) into n;
  delete from mc2_questions q where not exists (select 1 from mc2_places p where p.id = q.place_id and p.active);
  insert into mc2_questions(place_id, question, correct, wrong, updated_at)
  select p.id, 'এটা কোন জায়গা?', p.bn,
    coalesce((
      select array_agg(o.bn) from (
        select d.bn from (
          select distinct on (x.bn) x.bn, (x.category is not distinct from p.category) as sm, random() as r
          from mc2_places x where x.active and x.bn <> p.bn order by x.bn
        ) d order by d.sm desc, d.r limit n
      ) o
    ), '{}'), now()
  from mc2_places p where p.active
  on conflict (place_id) do update set question = excluded.question, correct = excluded.correct, wrong = excluded.wrong, updated_at = now();
end $$;

select mc2_rebuild_questions();

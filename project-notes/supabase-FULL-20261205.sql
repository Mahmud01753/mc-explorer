-- ============================================================================
-- supabase-FULL-20261205.sql — একসাথে Run (বিজয়ী কার্ড: সেভ-করা/হোমে-দেখানো ভাগ + হুবহু স্টোরেজ মাপ)
-- Supabase > SQL Editor-এ পুরোটা কপি করে একবার Run। বারবার চালালেও ক্ষতি নেই; কোনো পুরোনো ডাটা/টেবিল বদলায় না।
-- এতে আছে: [১] mc2_draw_clean (20261203-এর সবকিছু + cs.x)  [২] mc2_draw_card_size (20261204)
-- এটা চালালে supabase-new-20261203 / 20261204 / 20261205 আলাদা চালানো লাগে না।
-- আগে চালানো থাকতে হবে: supabase-community.sql (mc2_is_admin()) ও supabase-new-20261017.sql (mc2_draws টেবিল) — এগুলো আগেই চালানো আছে।
-- ============================================================================

-- [১] সার্ভার-পরিষ্কার: বাছা কার্ড cs.l (সর্বোচ্চ ২৩) + সেভ-করা না-বাছা সম্পাদিত কার্ড cs.x (সর্বোচ্চ ২০)
create or replace function mc2_draw_clean(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', left(trim(w ->> 'name'), 80),
      'dept', left(coalesce(w ->> 'dept', ''), 80),
      'batch', left(coalesce(w ->> 'batch', ''), 40),
      'rank', case when (w ->> 'rank') ~ '^\d{1,6}$' then (w ->> 'rank')::int end,
      'score', case when (w ->> 'score') ~ '^\d{1,6}$' then (w ->> 'score')::int end,
      'note', left(coalesce(w ->> 'note', ''), 200))
    || case when w ->> 'cv' in ('w', 'b', 's1', 's2', 's3', 'c') then jsonb_build_object('cv', w ->> 'cv') else '{}'::jsonb end
    || case when (w ->> 'pd') ~ '^\d{1,2}$' and (w ->> 'pd')::int between 0 and 19 then jsonb_build_object('pd', (w ->> 'pd')::int) else '{}'::jsonb end
    || case when jsonb_typeof(w -> 'cs') = 'object' and jsonb_typeof(w -> 'cs' -> 'l') = 'array' then jsonb_build_object('cs',
         jsonb_build_object(
           'n', left(coalesce(w -> 'cs' ->> 'n', ''), 40),
           'l', coalesce((select jsonb_agg(e.x order by e.o) from (select t.x, t.o from jsonb_array_elements_text(w -> 'cs' -> 'l') with ordinality t(x, o) where t.x ~ '^(s[123]|w([0-9]|1[0-9])|e([0-9]|1[0-9])\.[A-Za-z0-9_-]+)$' and length(t.x) <= 1600 order by t.o limit 23) e), '[]'::jsonb))
         || case when jsonb_typeof(w -> 'cs' -> 'x') = 'array' then jsonb_build_object('x',
              coalesce((select jsonb_agg(e.x order by e.o) from (select t.x, t.o from jsonb_array_elements_text(w -> 'cs' -> 'x') with ordinality t(x, o) where t.x ~ '^e([0-9]|1[0-9])\.[A-Za-z0-9_-]+$' and length(t.x) <= 1600 order by t.o limit 20) e), '[]'::jsonb))
            else '{}'::jsonb end) else '{}'::jsonb end
  ), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) w
  where length(trim(coalesce(w ->> 'name', ''))) > 0
$$;

-- [২] 💽 বিজয়ী কার্ডের হুবহু স্টোরেজ মাপ (শুধু অ্যাডমিন পড়তে পারে, কিছু বদলায় না)
create or replace function mc2_draw_card_size() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cb bigint := 0; wb bigint := 0; cards int := 0; ed int := 0; ws int := 0; n int := 0; tb bigint := 0; db bigint := 0;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select count(*), coalesce(sum(pg_column_size(d.winners)), 0) into n, wb from mc2_draws d;
  select coalesce(sum(pg_column_size(jsonb_strip_nulls(jsonb_build_object('cs', w -> 'cs', 'cv', w -> 'cv', 'pd', w -> 'pd', 'wc', w -> 'wc')))), 0),
         coalesce(sum(coalesce(jsonb_array_length(w -> 'cs' -> 'l'), 0) + coalesce(jsonb_array_length(w -> 'cs' -> 'x'), 0)), 0),
         coalesce(sum((select count(*) from (select jsonb_array_elements_text(w -> 'cs' -> 'l') union all select jsonb_array_elements_text(coalesce(w -> 'cs' -> 'x', '[]'::jsonb))) q(x) where x ~ '^e')), 0),
         count(*)
    into cb, cards, ed, ws
    from mc2_draws d, jsonb_array_elements(d.winners) w
    where jsonb_typeof(w -> 'cs' -> 'l') = 'array' or (w ->> 'pd') is not null or (w ->> 'cv') is not null or (w -> 'wc') is not null;
  tb := pg_total_relation_size('public.mc2_draws'); db := pg_database_size(current_database());
  return jsonb_build_object('cards_bytes', cb, 'winners_bytes', wb, 'table_bytes', tb, 'db_bytes', db, 'cards', cards, 'edited', ed, 'winners_with_cards', ws, 'announcements', n);
end $$;
grant execute on function mc2_draw_card_size() to anon, authenticated;

-- চেক (চালানোর পর): কোনো ফল না এসে শুধু Success দেখালেই হবে। সাইটের অ্যাডমিন > বিজয়ী ঘোষণা-র 💽 রিংয়ে "✅ হুবহু মাপ" দেখালে [২] ঠিক আছে।

-- ২০২৬-১২-০৪: 💽 বিজয়ী কার্ডের হুবহু স্টোরেজ মাপ (ডাটাবেজের ভেতর থেকে, pg_column_size দিয়ে)। শুধু অ্যাডমিন পড়তে পারে; কোনো টেবিল/ডাটা বদলায় না।
-- Supabase > SQL Editor-এ একবার Run (বারবার চালালেও ক্ষতি নেই)।
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

-- চেক (চালানোর পর, অ্যাডমিন লগইনে সাইট থেকে দেখাবে): select mc2_draw_card_size();

-- NEW SQL (2026-10-18 e): বিজয়ীর পাশে 🚩 ফ্ল্যাগ (শুধু অ্যাডমিন)। পাবলিক সাইটে কিছু দেখায় না।
-- আগে চালানো থাকতে হবে: supabase-new-20261018d.sql (mc2_prize_notes)। আবার চালালেও সমস্যা নেই।
alter table mc2_prize_notes add column if not exists flag boolean not null default false;

create or replace function mc2_pn_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('draw_id', draw_id, 'wid', wid, 'given', given, 'note', note, 'flag', flag)) from mc2_prize_notes), '[]'::jsonb);
end $$;

create or replace function mc2_pn_flag(p_draw bigint, p_wid text, p_flag boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_wid, '')) < 1 or length(p_wid) > 400 then raise exception 'bad key'; end if;
  insert into mc2_prize_notes (draw_id, wid, flag, updated_at) values (p_draw, p_wid, coalesce(p_flag, false), now())
  on conflict (draw_id, wid) do update set flag = excluded.flag, updated_at = now();
end $$;

revoke all on function mc2_pn_list(), mc2_pn_flag(bigint, text, boolean) from public, anon;
grant execute on function mc2_pn_list(), mc2_pn_flag(bigint, text, boolean) to authenticated;

-- নাম-চেক: ২টা সারি (mc2_pn_flag, flag কলাম) এলে ঠিক
select 'mc2_pn_flag' as name, exists (select 1 from pg_proc where proname = 'mc2_pn_flag') as ok
union all select 'flag column', exists (select 1 from information_schema.columns where table_name = 'mc2_prize_notes' and column_name = 'flag');

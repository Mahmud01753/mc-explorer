-- NEW SQL (2026-10-18 k): ইউজারের অবস্থা ৪টা — নতুন 📵 "সাড়া পাওয়া যায়নি" (মান 'nr')
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন। পুরোনো ফ্ল্যাগের ডেটা (ok / no / ex) একটুও বদলায় না। আবার চালালেও সমস্যা নেই।
-- আগে চালানো থাকতে হবে: supabase-new-20261018.sql (mc2_entry_flags, mc2_flag_set) — আগেই চালানো আছে।
-- না চালানো পর্যন্ত সাইট আগের মতোই চলে; শুধু 📵 বাছলে "নতুন SQL চালান" বার্তা আসে।

do $$
declare c record;
begin
  -- আগের check (st in ok/no/ex) সরিয়ে ৪ মানের নতুন check; নামে 'ex' আছে এমন check-ই সরে (নিজের আগের চালানোও)
  for c in select conname from pg_constraint
           where conrelid = 'public.mc2_entry_flags'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%''ex''%'
  loop
    execute format('alter table public.mc2_entry_flags drop constraint %I', c.conname);
  end loop;
  alter table public.mc2_entry_flags add constraint mc2_entry_flags_st_chk check (st in ('ok', 'no', 'ex', 'nr'));
end $$;

create or replace function mc2_flag_set(p_k text, p_st text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_k, '')) < 3 or length(p_k) > 120 then raise exception 'bad key'; end if;
  if p_st is null or p_st = '' then delete from mc2_entry_flags where k = p_k; return; end if;
  if p_st not in ('ok', 'no', 'ex', 'nr') then raise exception 'bad status'; end if;   -- ok = ভেরিফাইড, no = নন-ভেরিফাইড, ex = বাদ, nr = সাড়া পাওয়া যায়নি
  insert into mc2_entry_flags (k, st) values (p_k, p_st) on conflict (k) do update set st = excluded.st, at = now();
end $$;
revoke all on function mc2_flag_set(text, text) from public, anon;
grant execute on function mc2_flag_set(text, text) to authenticated;

-- নাম-চেক: দুটো সারিতেই ok = true এলে ঠিক
select 'mc2_entry_flags check (nr)' as item, exists (select 1 from pg_constraint where conrelid = 'public.mc2_entry_flags'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%''nr''%') as ok
union all
select 'mc2_flag_set (nr)', exists (select 1 from pg_proc where proname = 'mc2_flag_set' and prosrc like '%''nr''%');

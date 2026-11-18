-- 2026-11-03: কার্ডের ম্যানুয়াল ডিলিট (অ্যাডমিন > 🪪 কার্ড > "কার্ড ডিলিট") — প্রতি কার্ডের KB + অনেক আইডেন্টিফায়ার ফিল্টার + এক ডিভাইসে সর্বোচ্চ ২০ কার্ড (কঠোর)
-- RUN (মালিক নিশ্চিত করেছেন, ২০২৬-১১-০৬)
-- কোনো অটো-ডিলিট নিয়ম বদলায় না; কোনো ডেটা মোছে না; টেবিলে কলাম যোগ হয় না। আবার চালালেও সমস্যা নেই।
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে Run। আগে ...20261020c (mc2_top_hist) ও ...20261024 (gender) চালানো থাকতে হবে (আছে)।

-- ১) অ্যাডমিন-ভিউ: প্রতি কার্ডের KB + ফিল্টারের আইডেন্টিফায়ার (শুধু অ্যাডমিন দেখে — নইলে ভিউ খালি আসে; anon/পাবলিক অনুমতি নেই)
create or replace view mc2_cards_adm as
select c.id, c.device, c.name, c.dept, c.batch, c.score, c.pct, c.ok, c.total, c.show, c.pinned, c.gender, c.created_at, c.updated_at, c.thumb,
  round((pg_column_size(c.thumb) + coalesce(pg_column_size(c.photo), 0) + pg_column_size(c.rec) + 100) / 1024.0, 1) as kb,
  round(pg_column_size(c.thumb) / 1024.0, 1) as thumb_kb,
  round(coalesce(pg_column_size(c.photo), 0) / 1024.0, 1) as photo_kb,
  (c.photo is not null) as has_photo,
  c.rec ->> 'kind' as kind,
  nullif(c.rec ->> 'club', '') as club,
  nullif(c.rec ->> 'title', '') as title,
  count(*) over (partition by c.device) as dev_cards,
  count(*) over (partition by lower(c.name), c.dept, coalesce(c.batch, '')) as same_cards,
  s.ip::text as ip,
  nullif(s.info ->> 'model', '') as model,
  coalesce(p.n, 0) as plays,
  coalesce(h.best_rank, 0)::int as top_best,
  coalesce(h.times_in_top, 0)::int as top_times,
  exists (select 1 from contest_entries e where e.device = c.device) as has_form
from mc2_cards c
left join lateral (select x.ip, x.info from mc2_scores x where x.device = c.device and lower(x.name) = lower(c.name) order by x.id desc limit 1) s on true
left join lateral (select count(*)::int as n from mc2_scores x where x.device = c.device and lower(x.name) = lower(c.name)) p on true
left join mc2_top_hist h on h.card_id = c.id
where mc2_is_admin();

revoke all on mc2_cards_adm from public, anon;
grant select on mc2_cards_adm to authenticated;

-- ২) জায়গার মিটার: সব কার্ড মিলিয়ে কত KB/MB, গড়, ছবিসহ/ছাড়া, ২০-এর বেশি কার্ডের ডিভাইস কয়টা
create or replace function mc2_cards_kb_stats() returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'n', count(*), 'mb', round(coalesce(sum(kb), 0) / 1024.0, 2), 'avg_kb', round(coalesce(avg(kb), 0), 1),
    'min_kb', coalesce(min(kb), 0), 'max_kb', coalesce(max(kb), 0),
    'photo_n', count(*) filter (where has_photo),
    'avg_photo_kb', round(coalesce(avg(kb) filter (where has_photo), 0), 1),
    'avg_nophoto_kb', round(coalesce(avg(kb) filter (where not has_photo), 0), 1),
    'devices', count(distinct device),
    'dev_over_20', (select count(*) from (select device from mc2_cards group by device having count(*) > 20) z))
  into r from mc2_cards_adm;
  return r;
end $$;
revoke all on function mc2_cards_kb_stats() from public, anon;
grant execute on function mc2_cards_kb_stats() to authenticated;

-- ৩) এক ডিভাইসে সর্বোচ্চ ২০ কার্ড — কোনো অবস্থাতেই নয় (একই সময়ে অনেকে সেভ করলেও)। একই ডিভাইসে যত জনই খেলুক, মোট ২০টির বেশি কার্ড ঢুকবে না।
-- আগের নিয়ম (mc2_card_save: ২০ হলে সবচেয়ে পুরোনো সুরক্ষিত-নয় কার্ড কেটে নতুনটা বসে) হুবহু আগের মতো থাকে; এটা শুধু শেষ পাহারা।
-- ২০ হয়ে গেছে + সব সুরক্ষিত (টপ ৩) থাকলে নতুন কার্ড বসে না। আগে থেকে জমা বাড়তি কার্ড এতে মোছা হয় না — অ্যাডমিন > 🪪 কার্ড > কার্ড ডিলিট থেকে "এক ডিভাইসে কার্ড ২১ থেকে" ফিল্টারে হাতে মুছুন।
create or replace function mc2_cards_cap_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('mc2_cards_dev:' || new.device));
  if exists (select 1 from mc2_cards where device = new.device and lower(name) = lower(new.name)) then return new; end if; -- একই (ডিভাইস+নাম) হলে আপডেট; নতুন কার্ড নয়
  if (select count(*) from mc2_cards where device = new.device) >= least(20, coalesce(mc2_lim('card_per_dev'), 20)) then
    raise exception 'card cap: one device can keep at most 20 cards';
  end if;
  return new;
end $$;
drop trigger if exists mc2_cards_cap on mc2_cards;
create trigger mc2_cards_cap before insert on mc2_cards for each row execute function mc2_cards_cap_guard();

notify pgrst, 'reload schema';

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select 'ভিউ mc2_cards_adm' as item, exists (select 1 from pg_views where viewname = 'mc2_cards_adm') as ok
union all select 'মিটার mc2_cards_kb_stats', exists (select 1 from pg_proc where proname = 'mc2_cards_kb_stats')
union all select 'কার্ড-সীমা ট্রিগার mc2_cards_cap', exists (select 1 from pg_trigger where tgname = 'mc2_cards_cap' and not tgisinternal);

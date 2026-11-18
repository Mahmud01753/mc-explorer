-- ⚠️ পুনর্গঠিত ফাইল (২০২৬-১১-২৩): আসল ফাইলটা একটি আগের আপডেটে ভুলে বদলে গিয়েছিল। অ্যাপের কোড (community.js / app.js) যা চায় সেই অনুযায়ী ফাংশনটা নতুন করে লেখা।
-- 🚫 আপনার চলমান (লাইভ) Supabase-এ এটা চালাবেন না — ওখানে আসল ফাংশন আগে থেকেই চালু আছে ও ঠিক আছে।
-- ✅ শুধু তখনই চালাবেন যদি নতুন Supabase প্রজেক্টে সাইট বসান এবং র‍্যাংক হিস্টরি কাজ না করে ("অ্যাডমিন supabase-new-20261030.sql চালাননি" লেখা আসে)।
-- র‍্যাংক হিস্টরি = কোনো ইউজারের প্রতিটা খেলায় (নতুন থেকে পুরোনো) সেই সময় পর্যন্ত সবার সেরা স্কোরের মধ্যে ওই খেলার স্কোর কততম ছিল।
-- ফেরত: { best, now_rk, rows: [ { ts(মিলিসেকেন্ড), score, rk, n } ] } — সর্বোচ্চ ১০০ খেলা। কিছু লেখে না।
create or replace function mc2_rank_history(p_name text, p_dept text, p_batch text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare nm text := lower(trim(coalesce(p_name, ''))); bt text := coalesce(p_batch, ''); res jsonb; ip text := mc2_ip();
begin
  if nm = '' then return jsonb_build_object('best', 0, 'now_rk', 0, 'rows', '[]'::jsonb); end if;
  if coalesce((select (value ->> 'board_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return jsonb_build_object('best', 0, 'now_rk', 0, 'rows', '[]'::jsonb); end if;
  if ip is not null and not mc2_ac_rl('rkh:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  with mine as (
    select s.created_at, s.score from mc2_scores s
    where not coalesce(s.hidden, false) and lower(s.name) = nm and s.dept = coalesce(p_dept, '') and coalesce(s.batch, '') = bt
    order by s.created_at desc limit 100
  ), rows_ as (
    select m.created_at, m.score,
      1 + (select count(*) from (select max(x.score) b from mc2_scores x where not coalesce(x.hidden, false) and x.created_at <= m.created_at
             and not (lower(x.name) = nm and x.dept = coalesce(p_dept, '') and coalesce(x.batch, '') = bt)
             group by lower(x.name), x.dept, coalesce(x.batch, '')) t where t.b > m.score) as rk,
      (select count(*) from (select 1 from mc2_scores x where not coalesce(x.hidden, false) and x.created_at <= m.created_at
             group by lower(x.name), x.dept, coalesce(x.batch, '')) t) as n
    from mine m
  )
  select jsonb_build_object(
    'best', coalesce((select max(score) from mine), 0),
    'now_rk', 1 + (select count(*) from (select max(x.score) b from mc2_scores x where not coalesce(x.hidden, false) group by lower(x.name), x.dept, coalesce(x.batch, '')) t
                   where t.b > coalesce((select max(score) from mine), 0)),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('ts', (extract(epoch from created_at) * 1000)::bigint, 'score', score, 'rk', rk, 'n', n) order by created_at desc) from rows_), '[]'::jsonb))
  into res;
  return res;
end $$;
grant execute on function mc2_rank_history(text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';
select to_regprocedure('mc2_rank_history(text,text,text)') is not null as rank_history_ok;

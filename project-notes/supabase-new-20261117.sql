-- লিডারবোর্ড: সেরা ৩-এর নিচের যেকোনো ইউজারের কার্ড প্রিভিউ (র‍্যাংক হিস্টরি জানালার "🪪 কার্ড দেখো" বাটন)
-- Supabase > SQL Editor-এ একবার চালান। আগের কিছু বদলায় না; শুধু একটা নতুন ফাংশন যোগ হয়। আবার চালালেও ক্ষতি নেই।
-- নিরাপত্তা (ফাংশনের ভেতরেই বাঁধা):
--   • একবারে একজনের কার্ড (নাম + বিভাগ + সেশন দিয়ে) — বাল্কে তালিকা টানা যায় না।
--   • ছবি কখনো ফেরত আসে না; ডিভাইস আইডি/আইপি/ফোন কিছুই না। শুধু কার্ডে যা ছাপা থাকে (ফিল্ড-তালিকা নিচে)।
--   • ডাটাবেসে কিছুই লেখে না (আইপি-সীমার সারিও না): ১ লাখ প্রিভিউতেও ডাটাবেস স্টোরেজ বাড়ে ০ বাইট। ঘনঘন চাপা ঠেকানো ফোনের ভেতরে (cards.js) হয়।
--   • অ্যাডমিনের সুইচ: mc2_settings key 'board_cfg' এর peek_on (না থাকলে = চালু)। লিডারবোর্ড বন্ধ থাকলেও বন্ধ।
create or replace function mc2_card_peek(p_name text, p_dept text, p_batch text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare nm text := left(trim(coalesce(p_name, '')), 200); bt text := coalesce(p_batch, ''); cfg jsonb; r jsonb;
begin
  select value into cfg from mc2_settings where key = 'board_cfg';
  if coalesce((cfg ->> 'board_on')::boolean, true) = false or coalesce((cfg ->> 'peek_on')::boolean, true) = false then
    return jsonb_build_object('on', false);
  end if;
  if nm = '' then return jsonb_build_object('on', true, 'rec', null); end if;
  select (select jsonb_object_agg(e.key, e.value) from jsonb_each(x.rec) e
          where e.key in ('name', 'dept', 'batch', 'club', 'pct', 'score', 'ok', 'total', 'title', 'bestPlace', 'ts', 'drank', 'rank', 'site', 'lg', 'lgo'))
    into r
  from mc2_cards x
  where (lower(x.name) = lower(nm) or lower(coalesce(x.rec ->> 'name', '')) = lower(nm))
    and (x.dept = p_dept or coalesce(x.rec ->> 'dept', '') = p_dept)
    and (coalesce(x.batch, '') = bt or coalesce(x.rec ->> 'batch', '') = bt)
  order by x.score desc, x.updated_at desc limit 1;
  return jsonb_build_object('on', true, 'rec', r);
end $$;
grant execute on function mc2_card_peek(text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';

-- চেক: ok = true এলে ঠিক আছে
select 'mc2_card_peek ফাংশন' as item, to_regprocedure('mc2_card_peek(text,text,text)') is not null as ok;

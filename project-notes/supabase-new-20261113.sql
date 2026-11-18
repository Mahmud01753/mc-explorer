-- ভাগ ৩ — অ্যাডমিন > 🗑 বিন: থাম্ব/প্রিভিউ + বিভাগ/সেশন/স্কোর ফিল্টার (২০২৬-১১-১৩)
-- নিরাপদ: একাধিকবার চালানো যায়। কোনো ডেটা বদলায় না; শুধু ফাংশন (অ্যাডমিন-ই চালাতে পারে)।
-- আগের mc2_bin_list-এ নতুন ফিল্ড যোগ (পুরোনো ফিল্ড অক্ষত) + সীমা ৫০০ → ২০০০ (শুধু হালকা ফিল্ড, ছবি নয়)।
create or replace function mc2_bin_list(p_limit int default 100, p_src text default null) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object('total', (select count(*) from mc2_bin where p_src is null or src = p_src), 'mb', (select round(coalesce(sum(bytes), 0) / 1048576.0, 2) from mc2_bin where p_src is null or src = p_src),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'src', x.src, 'at', x.deleted_at, 'name', coalesce(x.row ->> 'name', x.row ->> 'page', x.row ->> 'device', '—'), 'score', x.row ->> 'score', 'device', x.row ->> 'device',
        'dept', x.row ->> 'dept', 'batch', x.row ->> 'batch', 'pct', x.row ->> 'pct') order by x.deleted_at desc)
      from (select * from mc2_bin where p_src is null or src = p_src order by deleted_at desc limit least(greatest(coalesce(p_limit, 100), 1), 2000)) x), '[]'::jsonb));
end $$;

-- নতুন: বিনের কার্ডের থাম্ব (পেজের সারিগুলোর জন্য) বা একটার পুরো তথ্য (বড় প্রিভিউর জন্য: rec + ছবি)
create or replace function mc2_bin_get(p_ids bigint[], p_full boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(case when p_full
      then jsonb_build_object('id', b.id, 'name', b.row ->> 'name', 'score', b.row ->> 'score', 'rec', b.row -> 'rec', 'photo', b.row ->> 'photo', 'thumb', b.row ->> 'thumb')
      else jsonb_build_object('id', b.id, 'thumb', b.row ->> 'thumb') end)
    from mc2_bin b where b.id = any (p_ids[1:(case when p_full then 1 else 60 end)]) and b.src = 'mc2_cards'), '[]'::jsonb);
end $$;
revoke all on function mc2_bin_get(bigint[], boolean) from public, anon;
grant execute on function mc2_bin_list(int, text), mc2_bin_get(bigint[], boolean) to authenticated;
notify pgrst, 'reload schema';

-- চেক: ok = true এলে ঠিক
select 'বিনের থাম্ব/প্রিভিউ ফাংশন' as item, to_regprocedure('mc2_bin_get(bigint[],boolean)') is not null as ok;

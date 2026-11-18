-- ===== [২] supabase-new-20261124.sql (বিজয়ী তালিকা: বিজয়ী কার্ড / স্কোর কার্ড / ছবি অটো আনা — আলাদা সুইচ; সব ডিফল্ট চালু) ✅ চালানো (মালিক নিশ্চিত, ২০২৬-১০-৩০) =====
-- ২০২৬-১১-২৪ — Supabase > SQL Editor-এ একবার Run করুন। আগে [১] supabase-new-20261123.sql চালানো থাকতে হবে (mc2_draws, mc2_draw_cfg, mc2_winner_photo)।
-- নিরাপদ: আবার চালালেও কিছু ভাঙে না। নতুন টেবিল নেই, কোনো ছবি জমা নেই; শুধু দুটো ফাংশন বদলায় (সুইচ সার্ভারেও মানে)।
--
-- সুইচগুলো mc2_settings key 'board_cfg'-এর ভেতরে (না থাকলে = চালু):
--   win_card_on  = বিজয়ীদের তালিকায় বিজয়ী কার্ড
--   win_score_on = বিজয়ীদের তালিকায় স্কোর কার্ড (বিজয়ী কার্ডের পাশের ট্যাব)
--   win_photo_on = বিজয়ী কার্ডে বিজয়ীর ছবি অটো আনা
--   win_on       = আগের সুইচ; অ্যাডমিন সংরক্ষণ করলে এখন নিজে হিসাব হয় (বিজয়ী কার্ড বা স্কোর কার্ড — যেকোনো একটা চালু থাকলে চালু)
-- অ্যাডমিন > 🏆 লিডারবোর্ড সেটিংস (বা 🏅 বিজয়ী ঘোষণার নিচে) থেকে বদলানো যায়।

-- ১) mc2_card_peek: বিজয়ী তালিকা (p_src = 'w') থেকে চাইলে — দুটো কার্ডই বন্ধ হলে on:false; স্কোর কার্ড বন্ধ হলে rec ফাঁকা (বিজয়ী কার্ড আলাদা আঁকা হয়)।
create or replace function mc2_card_peek(p_name text, p_dept text, p_batch text, p_src text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare nm text := left(trim(coalesce(p_name, '')), 200); bt text := coalesce(p_batch, ''); cfg jsonb; r jsonb;
begin
  select value into cfg from mc2_settings where key = 'board_cfg';
  if p_src = 'w' then
    if coalesce((cfg ->> 'win_on')::boolean, true) = false
       or (coalesce((cfg ->> 'win_card_on')::boolean, true) = false and coalesce((cfg ->> 'win_score_on')::boolean, true) = false)
       or coalesce((select v from mc2_draw_cfg where k = 'show'), '1') <> '1' then
      return jsonb_build_object('on', false);
    end if;
    if not exists (select 1 from mc2_draws d, jsonb_array_elements(d.winners) e(v)
                   where d.show and lower(trim(e.v ->> 'name')) = lower(nm) and coalesce(e.v ->> 'dept', '') = coalesce(p_dept, '') and coalesce(e.v ->> 'batch', '') = bt) then
      return jsonb_build_object('on', true, 'rec', null);
    end if;
    if coalesce((cfg ->> 'win_score_on')::boolean, true) = false then
      return jsonb_build_object('on', true, 'rec', null);
    end if;
  elsif coalesce((cfg ->> 'board_on')::boolean, true) = false or coalesce((cfg ->> 'peek_on')::boolean, true) = false then
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
grant execute on function mc2_card_peek(text, text, text, text) to anon, authenticated;

-- ২) mc2_winner_photo: বিজয়ী কার্ড বা ছবি-সুইচ (win_photo_on) বন্ধ থাকলে ছবি দেয় না (তখন কার্ডে নামের প্রথম অক্ষর)। বাকি নিয়ম আগের মতোই।
create or replace function mc2_winner_photo(p_draw bigint, p_name text, p_dept text, p_batch text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text; nm text := lower(trim(coalesce(p_name, ''))); bt text := coalesce(p_batch, ''); dp text := coalesce(p_dept, '');
begin
  if nm = '' then return null; end if;
  if coalesce((select (value ->> 'win_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return null; end if;
  if coalesce((select (value ->> 'win_card_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return null; end if;
  if coalesce((select (value ->> 'win_photo_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return null; end if;
  if coalesce((select v from mc2_draw_cfg where k = 'show'), '1') <> '1' then return null; end if;
  if not exists (select 1 from mc2_draws d, jsonb_array_elements(d.winners) e(v)
                 where d.id = p_draw and d.show and lower(trim(e.v ->> 'name')) = nm
                   and coalesce(e.v ->> 'dept', '') = dp and coalesce(e.v ->> 'batch', '') = bt) then return null; end if;
  select x.photo into r from mc2_cards x
   where x.show and x.photo ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$'
     and (lower(x.name) = nm or lower(coalesce(x.rec ->> 'name', '')) = nm)
     and (x.dept = dp or coalesce(x.rec ->> 'dept', '') = dp)
   order by (coalesce(x.batch, '') = bt or coalesce(x.rec ->> 'batch', '') = bt) desc, x.score desc, x.updated_at desc limit 1;
  return r;
end $$;
revoke all on function mc2_winner_photo(bigint, text, text, text) from public;
grant execute on function mc2_winner_photo(bigint, text, text, text) to anon, authenticated;
notify pgrst, 'reload schema';

-- চেক (দুটোই true এলে ঠিক আছে):
select to_regprocedure('mc2_winner_photo(bigint,text,text,text)') is not null as photo_fn_ok, to_regprocedure('mc2_card_peek(text,text,text,text)') is not null as peek_fn_ok;

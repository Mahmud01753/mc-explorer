-- ২০২৬-১১-২৩ — বিজয়ী প্রতি কার্ড-বাছাই (শুধু ছোট কোড/নম্বর; কোনো ছবি সার্ভারে জমে না)
-- Supabase > SQL Editor-এ একবার Run করুন। আগে চালানো থাকতে হবে: supabase-new-20261017.sql (mc2_draws, mc2_draw_clean)।
-- নিরাপদ: আবার চালালেও কিছু ভাঙে না। নতুন টেবিল নেই, নতুন ছবি-জমা নেই।
--
-- প্রতি বিজয়ীর সাথে (mc2_draws.winners jsonb) দুটো নতুন ছোট ফিল্ড:
--   cv = কোন কার্ড দেখাবে: 'b' দুটোই | 'w' শুধু বিজয়ী কার্ড | 's1' নেভি মেডালিয়ন | 's2' সবুজ উইনার | 's3' গ্লাস রিং | (ফাঁকা = অটো = দুটোই)
--   pd = বিজয়ী কার্ডের ডিজাইন-নম্বর ০–১৯ (২০টি ডিজাইনের মধ্যে কোনটা)
-- কার্ড আঁকা হয় ইউজারের ফোনেই। বিজয়ীর স্কোর কার্ডে ছবি থাকলে সেটাই (আগে থেকে জমা ছবি, নতুন জমা নয়) বিজয়ী কার্ডে বসে — mc2_winner_photo। পুরোনো বিজয়ীদের (cv/pd নেই) আগের মতোই চলে।
-- পাবলিক RPC (mc2_draws_public / mc2_draws_home) আগের মতোই winners ফেরত দেয়; এই ফাংশন শুধু নিরাপদ ফিল্ডই রাখে,
-- তাই device / contact / wkeys / fbnames / প্রাইজ নোট কখনো পাবলিকে যায় না।

create or replace function mc2_draw_clean(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', left(trim(w ->> 'name'), 80),
      'dept', left(coalesce(w ->> 'dept', ''), 80),
      'batch', left(coalesce(w ->> 'batch', ''), 40),
      'rank', case when (w ->> 'rank') ~ '^\d{1,6}$' then (w ->> 'rank')::int end,
      'score', case when (w ->> 'score') ~ '^\d{1,6}$' then (w ->> 'score')::int end,
      'note', left(coalesce(w ->> 'note', ''), 200))
    || case when w ->> 'cv' in ('w', 'b', 's1', 's2', 's3') then jsonb_build_object('cv', w ->> 'cv') else '{}'::jsonb end
    || case when (w ->> 'pd') ~ '^\d{1,2}$' and (w ->> 'pd')::int between 0 and 19 then jsonb_build_object('pd', (w ->> 'pd')::int) else '{}'::jsonb end
  ), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) w
  where length(trim(coalesce(w ->> 'name', ''))) > 0
$$;

-- পরিষ্কার: আগের (বাতিল) সংস্করণে সার্ভারে কার্ডের ছবি জমানোর যে টেবিল/ফাংশন ছিল, চালানো থাকলে সরিয়ে দেয়। না থাকলে কিছু হয় না।
drop function if exists mc2_wcard_set(bigint, text, text);
drop function if exists mc2_wcard_del(bigint, text);
drop function if exists mc2_wcard_get(bigint, text);
drop table if exists mc2_wcards;
drop function if exists mc2_wkey(jsonb);

-- বিজয়ীদের তালিকার কার্ডের নিজস্ব সুইচ: mc2_settings key 'board_cfg'-এর win_on (না থাকলে = চালু)। লিডারবোর্ডের সুইচ (board_on / peek_on) থেকে আলাদা —
-- লিডারবোর্ড বন্ধ থাকলেও বিজয়ী তালিকার কার্ড চলবে, উল্টোটাও। অ্যাডমিন > লিডারবোর্ড ট্যাবে সুইচ আছে।
-- ১) mc2_card_peek-এ ঐচ্ছিক ৪র্থ আর্গুমেন্ট p_src: 'w' = বিজয়ী তালিকা থেকে (তখন শুধু win_on দেখে, এবং শুধু পাবলিক ঘোষণার বিজয়ীর কার্ডই দেয়)। বাকি সব আগের মতো।
drop function if exists mc2_card_peek(text, text, text);
create or replace function mc2_card_peek(p_name text, p_dept text, p_batch text, p_src text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare nm text := left(trim(coalesce(p_name, '')), 200); bt text := coalesce(p_batch, ''); cfg jsonb; r jsonb;
begin
  select value into cfg from mc2_settings where key = 'board_cfg';
  if p_src = 'w' then
    if coalesce((cfg ->> 'win_on')::boolean, true) = false or coalesce((select v from mc2_draw_cfg where k = 'show'), '1') <> '1' then return jsonb_build_object('on', false); end if;
    if not exists (select 1 from mc2_draws d, jsonb_array_elements(d.winners) e(v)
                   where d.show and lower(trim(e.v ->> 'name')) = lower(nm) and coalesce(e.v ->> 'dept', '') = coalesce(p_dept, '') and coalesce(e.v ->> 'batch', '') = bt) then
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

-- ২) বিজয়ীর নিজের ছবি (যদি তার স্কোর কার্ডে ছবি দেওয়া থাকে)। নতুন কিছু জমা হয় না: আগে থেকে mc2_cards.photo-তে থাকা ছবিটাই ফেরত দেয়, কিছু লেখে না।
-- নিরাপত্তা: শুধু পাবলিক (show) ঘোষণার বিজয়ীর জন্য, একবারে একজন; বিজয়ী-পাতা বা win_on বন্ধ থাকলে কিছু দেয় না। কার্ডের "ছবি দেখানো" (show) বন্ধ করা থাকলে ছবি দেয় না (অ্যাডমিন যাঁর ছবি লুকিয়েছেন)।
-- মেলানো: নাম+বিভাগ+সেশন; না মিললে নাম+বিভাগ দিয়ে (সেশন বানান ভিন্ন থাকলেও যেন ছবি আসে)। জেপিইজি/পিএনজি/ওয়েবপি সবই চলে।
create or replace function mc2_winner_photo(p_draw bigint, p_name text, p_dept text, p_batch text) returns text
language plpgsql stable security definer set search_path = public as $$
declare r text; nm text := lower(trim(coalesce(p_name, ''))); bt text := coalesce(p_batch, ''); dp text := coalesce(p_dept, '');
begin
  if nm = '' then return null; end if;
  if coalesce((select (value ->> 'win_on')::boolean from mc2_settings where key = 'board_cfg'), true) = false then return null; end if;
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

-- নাম-চেক (Run করার পর আলাদাভাবে চালান; ok = true এলে ঠিক আছে):
-- select mc2_draw_clean('[{"name":"টেস্ট","cv":"w","pd":7,"device":"x"}]'::jsonb) = '[{"cv":"w","pd":7,"name":"টেস্ট","dept":"","batch":"","rank":null,"score":null,"note":""}]'::jsonb as ok;

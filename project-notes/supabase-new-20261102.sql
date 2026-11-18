-- 2026-11-02: একই ব্যক্তির (একই নাম + বিভাগ + ব্যাচ + পরিচয় + ডিভাইস/আইপি-ব্রাউজার) কার্ড সর্বোচ্চ ৩টা — বেশি হলে সবচেয়ে কম স্কোরেরটা আগে কাটে (টপ ৩-এ ওঠা কার্ডও), যাতে একজনেই সাইট না ভরে।
-- RUN (মালিক নিশ্চিত করেছেন, ২০২৬-১১-০৬)
-- শুধু mc2_card_save ফাংশন নতুন করে বসে; টেবিল/ডেটা বদলায় না; আবার চালালেও সমস্যা নেই। নতুন কার্ড সেভের সময় থেকে নিয়ম চলবে।
-- Supabase > SQL Editor-এ পুরোটা পেস্ট করে Run।

create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 200 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  if mc2_ip() is not null and not mc2_ac_rl('card:ip:' || mc2_ip(), mc2_lim('ip_card_hr'), 3600) then return 'slow'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - make_interval(secs => mc2_lim('card_gap_sec')) then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= mc2_lim('card_per_dev') then
    delete from mc2_cards where id = (select x.id from mc2_cards x where x.device = p_device and not x.pinned order by x.updated_at limit 1);
    if (select count(*) from mc2_cards where device = p_device) >= mc2_lim('card_per_dev') then return 'slow'; end if;
  end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  -- একই ব্যক্তির কার্ড সর্বোচ্চ ৩টা। "একই ব্যক্তি" ধরতে সব কটা মিলতে হবে:
  --   (১) একই নাম  (২) একই বিভাগ  (৩) একই ব্যাচ/সেশন  (৪) একই পরিচয় (ছাত্র/ছাত্রী/স্যার/ম্যাম/ভিজিটর) — দুই কার্ডেই লেখা থাকতে হবে
  --   (৫) একই ডিভাইস, অথবা একই আইপি + একই ব্রাউজার/ফোন (user-agent)
  -- কোনো একটা তথ্য না থাকলে বা সন্দেহ থাকলে "আলাদা ব্যক্তি" ধরা হয়, তাই ভুল করে অন্যের কার্ড কাটার ঝুঁকি নেই।
  -- ৩টার বেশি হলে সবচেয়ে কম স্কোরেরটা (সমান হলে পুরোনোটা) কাটে — টপ ৩-এ ওঠা (pinned) কার্ড হলেও।
  delete from mc2_cards where id in (
    select c.id from mc2_cards c
    where lower(c.name) = lower(v.name) and c.dept = v.dept
      and coalesce(c.batch, '') = coalesce(v.batch, '')
      and coalesce(c.rec ->> 'kind', '') <> '' and (c.rec ->> 'kind') = coalesce(p_rec ->> 'kind', '')
      and (c.device = p_device
           or (v.ip is not null and v.ua is not null and exists (select 1 from mc2_scores s where s.device = c.device and s.ip is not null and s.ip::text = v.ip::text and s.ua is not null and s.ua = v.ua)))
    order by c.score desc, c.updated_at desc offset 3);
  if not exists (select 1 from mc2_cards where device = p_device and lower(name) = lower(v.name)) then return 'lower'; end if;
  if random() < 0.1 then begin perform mc2_cleanup_tick(); exception when others then null; end; end if;
  return 'ok';
end $$;

-- নাম-চেক: ok = true এলে ঠিক
select pg_get_functiondef(p.oid) like '%offset 3%' as ok from pg_proc p where p.proname = 'mc2_card_save';

-- আগে থেকে জমা বাড়তি কার্ড এতে মোছা হয় না; নিয়মটা নতুন কার্ড সেভের সময় থেকে চলে।

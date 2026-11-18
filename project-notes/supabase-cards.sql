-- MC Explorer — ইউজারের কার্ড সংরক্ষণ (অ্যাডমিনের জন্য ছোট নমুনা) + লিডারবোর্ডের টপ ৩ কার্ড/ছবি।
-- চালানোর ক্রম: supabase-live-board.sql-এর পরে (supabase-pending-all.sql-এর শেষে যোগ করা আছে)। আবার চালালেও ক্ষতি নেই।
--
-- কীভাবে কম জায়গা নেয়, অথচ ডাউনলোডে ফুল কোয়ালিটি:
--   থাকে: (১) ছোট প্রিভিউ JPEG (~৩০–৫০ KB), (২) ছোট বর্গাকার ছবি (~৩০–৫০ KB, ঐচ্ছিক), (৩) কার্ড আঁকার ছোট্ট তথ্য (rec, কয়েক শ বাইট)।
--   ডাউনলোডের সময় অ্যাডমিন পেজ ওই তথ্য আর ছবি থেকে ১০৮০×১৪০০ কার্ড ও ১০৮০×১৯২০ স্টোরি আবার আঁকে — ইউজার যে কার্ড ডাউনলোড করে হুবহু সেটাই।

create table if not exists mc2_cards (
  id bigint generated always as identity primary key,
  device text not null,
  name text not null, dept text not null, batch text,
  score int not null, pct int not null, ok int, total int,
  rec jsonb not null,
  thumb text not null,
  photo text,
  show boolean not null default true,   -- false = লিডারবোর্ডের টপ ৩-এ ছবি দেখানো হবে না (অ্যাডমিন লুকালে)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists mc2_cards_u on mc2_cards (device, lower(name));
create index if not exists mc2_cards_s on mc2_cards (score desc);
create index if not exists mc2_cards_t on mc2_cards (updated_at desc);
alter table mc2_cards enable row level security;
revoke all on mc2_cards from anon, authenticated;
grant select, update, delete on mc2_cards to authenticated;
drop policy if exists "admin cards" on mc2_cards;
create policy "admin cards" on mc2_cards for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- কার্ড সেভ: স্কোর সত্যিই mc2_scores-এ আছে কি না মিলিয়ে দেখে (ভুয়া স্কোরে কার্ড/টপ ৩ হবে না)।
-- প্রতি (ডিভাইস + নাম)-এ একটাই কার্ড; নতুন স্কোর আগের চেয়ে কম হলে পুরোনো সেরা কার্ড থাকে, সমান/বেশি হলে বদলায়।
create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
  if p_rec is null or jsonb_typeof(p_rec) <> 'object' or octet_length(p_rec::text) > 4000 then return 'invalid'; end if;
  if p_thumb is null or char_length(p_thumb) > 160000 or p_thumb !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' then return 'invalid'; end if;
  if p_photo is not null and p_photo <> '' and (char_length(p_photo) > 220000 or p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then return 'invalid'; end if;
  select * into v from mc2_scores where device = p_device and lower(name) = lower(nm) and score = p_score order by id desc limit 1;
  if not found then return 'noscore'; end if;
  select * into old from mc2_cards where device = p_device and lower(name) = lower(nm);
  if found then
    if old.updated_at > now() - interval '2 seconds' then return 'slow'; end if;
    if old.score > v.score then return 'lower'; end if;
  elsif (select count(*) from mc2_cards where device = p_device) >= 20 then return 'slow'; end if;
  rec := p_rec - 'device' || jsonb_build_object('name', v.name, 'dept', v.dept, 'batch', coalesce(v.batch, ''), 'score', v.score, 'pct', v.pct, 'ok', coalesce(v.ok, 0), 'total', coalesce(v.total, 0),
    'club', coalesce(v.club, ''), 'title', coalesce(v.title, ''));
  insert into mc2_cards(device, name, dept, batch, score, pct, ok, total, rec, thumb, photo)
  values (p_device, v.name, v.dept, v.batch, v.score, v.pct, v.ok, v.total, rec, p_thumb, nullif(p_photo, ''))
  on conflict (device, (lower(name))) do update set name = excluded.name, dept = excluded.dept, batch = excluded.batch, score = excluded.score, pct = excluded.pct, ok = excluded.ok, total = excluded.total,
    rec = excluded.rec, thumb = excluded.thumb, photo = excluded.photo, updated_at = now();
  return 'ok';
end $$;
grant execute on function mc2_card_save(text, text, text, text, int, jsonb, text, text) to anon, authenticated;

-- লিডারবোর্ডের টপ ৩ (ফিল্টার একই: বিভাগ, সেশন, তারিখ; প্রত্যেকের সেরা ফল)। কার্ড/ছবি থাকলে সাথে আসে।
-- পাবলিকে যায়: নাম, বিভাগ, সেশন, স্কোর, সঠিক/মোট, কার্ড আঁকার তথ্য, ছবি (শুধু অ্যাডমিন লুকিয়ে না রাখলে)। ডিভাইস/আইপি কখনো না।
create or replace function mc2_top_cards(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('topc:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at, s.device,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
  ), pick as (select base.*, rank() over (order by score desc) as rk from base where rn = 1),
  top as (select * from pick order by rk, created_at, id limit 3)
  select coalesce(jsonb_agg(jsonb_build_object('rk', t.rk, 'name', t.name, 'dept', t.dept, 'batch', t.batch, 'score', t.score, 'ok', coalesce(t.ok, 0), 'total', coalesce(t.total, 0), 'pct', t.pct,
    'ts', (extract(epoch from t.created_at) * 1000)::bigint, 'rec', c.rec, 'photo', case when c.show then c.photo end) order by t.rk, t.created_at, t.id), '[]'::jsonb) into res
  from top t left join lateral (select x.rec, x.photo, x.show from mc2_cards x where x.device = t.device and lower(x.name) = lower(t.name) order by x.score desc limit 1) c on true;
  return jsonb_build_object('rows', res);
end $$;
grant execute on function mc2_top_cards(text, text, timestamptz, timestamptz) to anon, authenticated;

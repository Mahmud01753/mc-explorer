-- MC Explorer — সার্ভে সার্ভারে (২০২৬-১১-২৭). Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run। আবার চালালেও ক্ষতি নেই।
-- আগে চালানো থাকতে হবে: মূল সেটআপ (mc2_is_admin, mc2_ip, mc2_ac_rl)।
-- কী হয়: ১) অ্যাডমিন যে অপশন যোগ/মোছা/নাম বদল/ক্রম/লুকানো করবে সেগুলো mc2_survey_opts-এ থাকে।
--         ২) ভোটারদের ভোট mc2_survey_votes-এ জমা হয় (এক ডিভাইসে একটাই ভোট)।
--         ৩) সাইট শুধু RPC দিয়ে পড়ে/লেখে; টেবিল সরাসরি শুধু অ্যাডমিন দেখতে/বদলাতে পারে।
-- q = 'fav' (কলেজের প্রিয় জায়গা, একটা) | 'chg' (কী বদলাতে চাও, একাধিক)

create table if not exists mc2_survey_opts (
  id bigint generated always as identity primary key,
  q text not null check (q in ('fav', 'chg')),
  label text not null check (char_length(label) between 1 and 40),
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (q, label)
);
create table if not exists mc2_survey_votes (
  id bigint generated always as identity primary key,
  device text not null unique check (char_length(device) between 8 and 40),
  fav bigint,
  chg bigint[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table mc2_survey_opts enable row level security;
alter table mc2_survey_votes enable row level security;
revoke all on mc2_survey_opts, mc2_survey_votes from anon;
drop policy if exists "sv opts admin" on mc2_survey_opts;
create policy "sv opts admin" on mc2_survey_opts for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());
drop policy if exists "sv votes admin" on mc2_survey_votes;
create policy "sv votes admin" on mc2_survey_votes for all to authenticated using (mc2_is_admin()) with check (mc2_is_admin());

-- আগের ডিফল্ট তালিকা (অ্যাডমিন পরে বদলাতে পারবে)
insert into mc2_survey_opts (q, label, sort) values
  ('fav', 'লাইব্রেরি', 1), ('fav', 'ক্যান্টিন', 2), ('fav', 'মাঠ', 3), ('fav', 'মূল ভবন', 4), ('fav', 'জারুল তলা', 5),
  ('chg', 'লাইব্রেরি', 1), ('chg', 'ওয়াইফাই', 2), ('chg', 'ক্যান্টিন', 3), ('chg', 'ক্লাসরুম', 4)
on conflict (q, label) do nothing;

-- অপশন + সবার ফল + (ডিভাইস দিলে) ওই ডিভাইসের নিজের ভোট
create or replace function mc2_survey_get(p_device text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); mine jsonb := null; res jsonb;
begin
  if ip is not null and not mc2_ac_rl('sv:ip:' || ip || ':r', 600, 60) then return jsonb_build_object('err', 'slow'); end if;
  if p_device is not null and char_length(p_device) between 8 and 40 then
    select jsonb_build_object('fav', v.fav, 'chg', to_jsonb(v.chg)) into mine from mc2_survey_votes v where v.device = p_device;
  end if;
  select jsonb_build_object(
    'opts', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'q', o.q, 'label', o.label) order by o.q, o.sort, o.id) from mc2_survey_opts o where o.active), '[]'::jsonb),
    'fav', coalesce((select jsonb_object_agg(x.k::text, x.n) from (select fav as k, count(*) as n from mc2_survey_votes where fav is not null group by fav) x), '{}'::jsonb),
    'chg', coalesce((select jsonb_object_agg(x.k::text, x.n) from (select c as k, count(*) as n from mc2_survey_votes, unnest(chg) c group by c) x), '{}'::jsonb),
    'nf', (select count(*) from mc2_survey_votes where fav is not null),
    'nc', (select count(*) from mc2_survey_votes where cardinality(chg) > 0),
    'total', (select count(*) from mc2_survey_votes),
    'mine', mine) into res;
  return res;
end $$;

-- ভোট জমা: অপশন সত্যিই আছে ও চালু কি না যাচাই; এক ডিভাইসে একবারই (দ্বিতীয়বার চুপচাপ আগেরটাই থাকে)
create or replace function mc2_survey_submit(p_device text, p_fav bigint, p_chg bigint[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ip text := mc2_ip(); f bigint := null; c bigint[];
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 then return jsonb_build_object('err', 'invalid'); end if;
  if ip is not null and not mc2_ac_rl('sv:ip:' || ip || ':w', 300, 3600) then return jsonb_build_object('err', 'slow'); end if;
  if p_fav is not null then select o.id into f from mc2_survey_opts o where o.id = p_fav and o.q = 'fav' and o.active; end if;
  select coalesce(array_agg(distinct o.id), '{}'::bigint[]) into c from mc2_survey_opts o where o.id = any(coalesce(p_chg, '{}'::bigint[])) and o.q = 'chg' and o.active;
  c := c[1:20];
  if f is null and coalesce(cardinality(c), 0) = 0 then return jsonb_build_object('err', 'empty'); end if;
  insert into mc2_survey_votes (device, fav, chg) values (p_device, f, coalesce(c, '{}'::bigint[])) on conflict (device) do nothing;
  return mc2_survey_get(p_device);
end $$;

grant execute on function mc2_survey_get(text) to anon, authenticated;
grant execute on function mc2_survey_submit(text, bigint, bigint[]) to anon, authenticated;

-- নাম-চেক (Run-এর পর আলাদাভাবে চালান; ৯টা সারি এলে ঠিক): select count(*) from mc2_survey_opts;

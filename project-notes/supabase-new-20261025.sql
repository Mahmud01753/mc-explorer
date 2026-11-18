-- ২০২৬-১০-২৫ — 🏅 বেইজ (ইউজারের বেইজ): ১৫টা রেডিমেড + নিজের বানানো, একজনকে একাধিক বেইজ।
-- Supabase SQL Editor-এ একবার Run (আগে ব্যাকআপ)। আগে supabase-new-20261018k.sql (ফ্ল্যাগ) চালানো থাকতে হবে।
-- ইউজারের চাবি = ফ্ল্যাগের চাবির একই নিয়ম ("d:ডিভাইস" বা "n:নাম"), তাই ফ্ল্যাগ আর বেইজ একই ইউজারে মেলে।
-- ✅/❔/🚫/📵 অবস্থা আগের ফ্ল্যাগেই থাকে — এখানে কিছু বদলায় না, তাই মুছে যাওয়ার ভয় নেই।

create table if not exists mc2_badge_defs (
  id text primary key check (id ~ '^[a-z][a-z0-9]{0,23}$'),
  name text not null check (char_length(name) between 1 and 30),
  emoji text not null default '🏅' check (char_length(emoji) between 1 and 8),
  color text not null default '#2e7d4f' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort int not null default 100
);
create table if not exists mc2_user_badges (
  k text not null check (char_length(k) between 3 and 120),
  b text not null references mc2_badge_defs(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (k, b)
);
alter table mc2_badge_defs enable row level security;
alter table mc2_user_badges enable row level security;
revoke all on mc2_badge_defs, mc2_user_badges from anon, authenticated;

-- ১৫টা ডিফল্ট (আগে থেকে থাকলে ছোঁয় না)
insert into mc2_badge_defs (id, emoji, name, color, sort) values
  ('b1','🏆','কুইজ বিজয়ী','#c9971c',1),
  ('b2','🥇','টপার','#d4a017',2),
  ('b3','📞','সাড়া দিয়েছে','#2e7d4f',3),
  ('b4','🎁','পুরস্কার পেয়েছে','#c2410c',4),
  ('b5','🌟','সেরা খেলোয়াড়','#b45309',5),
  ('b6','👑','চ্যাম্পিয়ন','#7c3aed',6),
  ('b7','🔥','নিয়মিত খেলোয়াড়','#dc2626',7),
  ('b8','🧠','ধীমান','#0e7490',8),
  ('b9','🗺️','ক্যাম্পাস গাইড','#15803d',9),
  ('b10','⚡','বিদ্যুৎগতি','#ca8a04',10),
  ('b11','🎯','নিখুঁত লক্ষ্য','#be123c',11),
  ('b12','💎','বিশেষ অতিথি','#0369a1',12),
  ('b13','🤝','সহযোগী','#4d7c0f',13),
  ('b14','📣','প্রচারক','#a21caf',14),
  ('b15','🌱','নতুন মুখ','#16a34a',15)
on conflict (id) do nothing;

create or replace function mc2_badge_all() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'defs', coalesce((select jsonb_agg(to_jsonb(d) order by d.sort, d.id) from mc2_badge_defs d), '[]'::jsonb),
    'map',  coalesce((select jsonb_object_agg(k, ids) from (select k, jsonb_agg(b) ids from mc2_user_badges group by k) x), '{}'::jsonb));
end $$;

-- বেইজ বানানো/বদলানো: p_id খালি হলে নতুন (c… আইডি); ডিফল্ট ফেরাতে নির্দিষ্ট আইডি (b1…) দিয়ে ডাকা হয়
create or replace function mc2_badge_def_save(p_id text, p_name text, p_emoji text, p_color text) returns text language plpgsql security definer set search_path = public as $$
declare v text := nullif(trim(coalesce(p_id, '')), '');
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 30 then raise exception 'name 1..30'; end if;
  if v is not null and exists (select 1 from mc2_badge_defs where id = v) then
    update mc2_badge_defs set name = trim(p_name), emoji = left(coalesce(nullif(trim(p_emoji), ''), '🏅'), 8), color = coalesce(p_color, color) where id = v;
    return v;
  end if;
  if (select count(*) from mc2_badge_defs) >= 60 then raise exception 'too many badges (max 60)'; end if;
  v := coalesce(v, 'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  insert into mc2_badge_defs (id, name, emoji, color, sort)
    values (v, trim(p_name), left(coalesce(nullif(trim(p_emoji), ''), '🏅'), 8), coalesce(p_color, '#2e7d4f'), coalesce((select max(sort) from mc2_badge_defs), 0) + 1);
  return v;
end $$;

create or replace function mc2_badge_def_del(p_id text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  delete from mc2_badge_defs where id = p_id;   -- সবার থেকে এই বেইজ সরে যায়; ফ্ল্যাগ/অবস্থায় হাত পড়ে না
end $$;

-- একজন বা অনেকজনকে একসাথে বেইজ দেওয়া (p_on = true) বা সরানো (false)
create or replace function mc2_badge_set(p_ks text[], p_id text, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if p_ks is null or coalesce(array_length(p_ks, 1), 0) = 0 then return; end if;
  if array_length(p_ks, 1) > 5000 then raise exception 'too many users at once (max 5000)'; end if;
  if not exists (select 1 from mc2_badge_defs where id = p_id) then raise exception 'badge not found'; end if;
  if p_on then
    insert into mc2_user_badges (k, b) select distinct k, p_id from unnest(p_ks) k where char_length(k) between 3 and 120 on conflict do nothing;
  else
    delete from mc2_user_badges where b = p_id and k = any (p_ks);
  end if;
end $$;

revoke all on function mc2_badge_all(), mc2_badge_def_save(text, text, text, text), mc2_badge_def_del(text), mc2_badge_set(text[], text, boolean) from public, anon;
grant execute on function mc2_badge_all(), mc2_badge_def_save(text, text, text, text), mc2_badge_def_del(text), mc2_badge_set(text[], text, boolean) to authenticated;

-- যাচাই: ৪টা ফাংশন + ১৫টা বেইজ দেখাবে
select (select count(*) from pg_proc where proname in ('mc2_badge_all','mc2_badge_def_save','mc2_badge_def_del','mc2_badge_set')) as functions_4,
       (select count(*) from mc2_badge_defs) as badges_15_or_more;

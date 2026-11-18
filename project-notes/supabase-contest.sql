-- MC Explorer: "শেয়ার করে পুরস্কার জেতো" ফর্মের জন্য (Supabase > SQL Editor-এ পুরোটা পেস্ট করে একবার Run চাপুন)
-- জমা পড়া তালিকা দেখতে: Table Editor > contest_entries (স্ক্রিনশটের লিংকে ক্লিক করলে ছবি খোলে)

create table if not exists contest_entries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  fb_link text not null,
  shot_url text not null,
  contact text,
  pct int,
  score int
);
create unique index if not exists contest_entries_link_uq on contest_entries (lower(fb_link));
alter table contest_entries enable row level security;   -- সরাসরি পড়া/লেখা বন্ধ; জমা শুধু নিচের ফাংশন দিয়ে

create or replace function submit_entry(p_name text, p_link text, p_shot text, p_contact text, p_pct int, p_score int)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 60 then raise exception 'bad name'; end if;
  if p_link is null or length(p_link) > 400 or p_link !~* '^https?://([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)/' then raise exception 'bad link'; end if;
  if p_shot is null or length(p_shot) > 500 then raise exception 'bad shot'; end if;
  insert into contest_entries (name, fb_link, shot_url, contact, pct, score)
  values (trim(p_name), trim(p_link), p_shot, nullif(left(trim(coalesce(p_contact, '')), 300), ''), p_pct, p_score)
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'duplicate';
end $$;
revoke all on function submit_entry(text, text, text, text, int, int) from public;
grant execute on function submit_entry(text, text, text, text, int, int) to anon;

-- স্ক্রিনশট রাখার বাকেট (শুধু JPEG, সর্বোচ্চ ৩ MB; জমা দেওয়া যাবে, তালিকা করা যাবে না)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contest', 'contest', true, 3145728, array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists "contest upload" on storage.objects;
create policy "contest upload" on storage.objects for insert to anon with check (bucket_id = 'contest');

-- সাপ্তাহিক লটারি: শুধু আপনি এখানে (SQL Editor-এ) চালাতে পারবেন। গত ৭ দিনের জমা থেকে র‍্যান্ডম ৫ জন:
--   select * from pick_winners();          -- ৭ দিন, ৫ জন
--   select * from pick_winners(14, 3);     -- ১৪ দিন, ৩ জন
create or replace function pick_winners(p_days int default 7, p_count int default 5)
returns table (id bigint, name text, fb_link text, shot_url text, contact text, pct int, created_at timestamptz)
language sql as $$
  select e.id, e.name, e.fb_link, e.shot_url, e.contact, e.pct, e.created_at
  from contest_entries e
  where e.created_at >= now() - make_interval(days => p_days)
  order by random() limit p_count
$$;
revoke all on function pick_winners(int, int) from public, anon;

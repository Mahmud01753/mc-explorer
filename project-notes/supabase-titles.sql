-- MC Explorer: উপাধি কাউন্টার (Supabase > SQL Editor-এ পুরোটা পেস্ট করে Run চাপুন)
create table if not exists title_counter (key text primary key, n bigint not null default 0);
alter table title_counter enable row level security;  -- সরাসরি টেবিল পড়া/লেখা বন্ধ, শুধু নিচের ফাংশন দিয়ে

create or replace function next_title(p_key text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  insert into title_counter(key, n) values (left(p_key, 80), 1)
  on conflict (key) do update set n = title_counter.n + 1
  returning n into v;
  return v;
end $$;

revoke all on function next_title(text) from public;
grant execute on function next_title(text) to anon;

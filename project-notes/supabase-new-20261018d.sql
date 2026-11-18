-- বিজয়ীর পুরস্কার স্ট্যাটাস (দেওয়া হয়েছে/হয়নি) + অ্যাডমিনের ব্যক্তিগত নোট (শুধু অ্যাডমিন দেখে; পাবলিক RPC-তে কখনো যায় না)
-- আগে চালানো থাকতে হবে: supabase-new-20261017.sql (mc2_draws, mc2_is_admin())
create table if not exists mc2_prize_notes (
  draw_id bigint not null,
  wid text not null,                       -- নাম|বিভাগ|সেশন|ক্রম (একই নামের দুজনকে আলাদা রাখে)
  given boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (draw_id, wid)
);
alter table mc2_prize_notes enable row level security;   -- সরাসরি পড়া/লেখা বন্ধ; শুধু নিচের ফাংশন

create or replace function mc2_pn_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('draw_id', draw_id, 'wid', wid, 'given', given, 'note', note)) from mc2_prize_notes), '[]'::jsonb);
end $$;

create or replace function mc2_pn_set(p_draw bigint, p_wid text, p_given boolean, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not mc2_is_admin() then raise exception 'forbidden'; end if;
  if length(coalesce(p_wid, '')) < 1 or length(p_wid) > 400 then raise exception 'bad key'; end if;
  insert into mc2_prize_notes (draw_id, wid, given, note, updated_at)
  values (p_draw, p_wid, coalesce(p_given, false), left(coalesce(p_note, ''), 3000), now())
  on conflict (draw_id, wid) do update set given = excluded.given, note = excluded.note, updated_at = now();
end $$;

revoke all on function mc2_pn_list(), mc2_pn_set(bigint, text, boolean, text) from public, anon;
grant execute on function mc2_pn_list(), mc2_pn_set(bigint, text, boolean, text) to authenticated;

-- নাম-চেক: ৩টা সারি (table + ২ ফাংশন) এলে ঠিক
select 'mc2_prize_notes' as name, (to_regclass('public.mc2_prize_notes') is not null) as ok
union all select proname, true from pg_proc where proname in ('mc2_pn_list', 'mc2_pn_set');

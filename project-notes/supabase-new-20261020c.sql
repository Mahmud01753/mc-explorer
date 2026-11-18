-- supabase-new-20261020c.sql — টপ ৩-এর স্থায়ী ইতিহাস (একবার Run; আবার চালালেও ক্ষতি নেই)
-- আগে ...19, ...19b, ...19c চালানো থাকতে হবে (mc2_cards.pinned লাগে)। কোনো পুরোনো ফাংশন/টেবিল বদলায় না; mc2_card_save-ও না।
-- টপ = mc2_cards-এ স্কোর অনুযায়ী ১–৩ নম্বর (সমান স্কোরে একই Rank; pinned-এর নিয়মের মতোই)।
-- ১) mc2_top_hist: প্রতি কার্ডে একটা সারি — কার্ড ID, মালিক ID (device), প্রথম টপে যাওয়ার সময়/স্কোর, মোট কতবার টপে এসেছে, সর্বোচ্চ ও বর্তমান Rank (বর্তমান NULL = এখন টপে নেই)।
-- ২) mc2_top_log: প্রতিটি ঘটনা — enter (টপে ঢোকা, তারিখ+স্কোরসহ) / change (Rank বদল: আগের→পরের) / leave (টপ থেকে নামা)।
-- ৩) কার্ড সেভ/স্কোর বদল/মোছায় ট্রিগার নিজে ইতিহাস হালনাগাদ করে; ইতিহাসে ভুল হলেও কার্ড সেভ আটকায় না।
-- ৪) কার্ড মুছে গেলেও ইতিহাস থাকে (কার্ডের সাথে সংযোগ-নিষেধ নেই)। অটো-ক্লিনআপ এই দুই টেবিল ছোঁয় না।

create table if not exists mc2_top_hist (
  card_id bigint primary key,
  device text not null,
  name text,
  first_top_at timestamptz not null default now(),
  first_score int,
  times_in_top int not null default 1 check (times_in_top >= 1),
  best_rank smallint check (best_rank between 1 and 3),
  cur_rank smallint check (cur_rank between 1 and 3),
  last_top_at timestamptz not null default now(),
  last_score int,
  updated_at timestamptz not null default now()
);
create index if not exists mc2_top_hist_dev on mc2_top_hist (device);
create index if not exists mc2_top_hist_first on mc2_top_hist (first_top_at desc);
create index if not exists mc2_top_hist_cur on mc2_top_hist (cur_rank) where cur_rank is not null;

create table if not exists mc2_top_log (
  id bigint generated always as identity primary key,
  card_id bigint not null,
  device text not null,
  name text,
  kind text not null check (kind in ('enter', 'change', 'leave')),
  old_rank smallint,
  new_rank smallint,
  score int,
  at timestamptz not null default now(),
  note text
);
create index if not exists mc2_top_log_card on mc2_top_log (card_id, at desc);
create index if not exists mc2_top_log_dev on mc2_top_log (device, at desc);
create index if not exists mc2_top_log_at on mc2_top_log (at desc);

alter table mc2_top_hist enable row level security;
alter table mc2_top_log enable row level security;
revoke all on mc2_top_hist, mc2_top_log from anon, authenticated;
grant select on mc2_top_hist, mc2_top_log to authenticated;
drop policy if exists "admin top hist" on mc2_top_hist;
create policy "admin top hist" on mc2_top_hist for select to authenticated using (mc2_is_admin());
drop policy if exists "admin top log" on mc2_top_log;
create policy "admin top log" on mc2_top_log for select to authenticated using (mc2_is_admin());

-- বর্তমান টপ ৩ মিলিয়ে ইতিহাস হালনাগাদ। ফেরত: কতটা ঘটনা লেখা হলো। p_backfill = true হলে সময় = কার্ডের updated_at (শুধু প্রথমবারের ভরাটে)।
create or replace function mc2_top_sync(p_backfill boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare r record; h record; n int := 0; ids bigint[] := '{}'; ts timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('mc2_top_sync'));
  for r in select t.id, t.device, t.name, t.score, t.rk::int as rk, t.updated_at
             from (select c.id, c.device, c.name, c.score, c.updated_at, rank() over (order by c.score desc) as rk from mc2_cards c) t
            where t.rk <= 3 order by t.rk, t.id loop
    ids := ids || r.id;
    ts := case when p_backfill then r.updated_at else now() end;
    select * into h from mc2_top_hist where card_id = r.id;
    if not found then
      insert into mc2_top_hist(card_id, device, name, first_top_at, first_score, best_rank, cur_rank, last_top_at, last_score)
      values (r.id, r.device, r.name, ts, r.score, r.rk, r.rk, ts, r.score);
      insert into mc2_top_log(card_id, device, name, kind, new_rank, score, at, note)
      values (r.id, r.device, r.name, 'enter', r.rk, r.score, ts, case when p_backfill then 'backfill' end);
      n := n + 1;
    elsif h.cur_rank is null then
      update mc2_top_hist set times_in_top = times_in_top + 1, cur_rank = r.rk, best_rank = least(coalesce(best_rank, r.rk), r.rk),
        last_top_at = ts, last_score = r.score, name = r.name, updated_at = now() where card_id = r.id;
      insert into mc2_top_log(card_id, device, name, kind, new_rank, score, at) values (r.id, r.device, r.name, 'enter', r.rk, r.score, ts);
      n := n + 1;
    elsif h.cur_rank <> r.rk then
      update mc2_top_hist set cur_rank = r.rk, best_rank = least(coalesce(best_rank, r.rk), r.rk), last_score = r.score, name = r.name, updated_at = now() where card_id = r.id;
      insert into mc2_top_log(card_id, device, name, kind, old_rank, new_rank, score, at) values (r.id, r.device, r.name, 'change', h.cur_rank, r.rk, r.score, ts);
      n := n + 1;
    elsif h.last_score is distinct from r.score then
      update mc2_top_hist set last_score = r.score, updated_at = now() where card_id = r.id;  -- Rank একই, শুধু স্কোর বেড়েছে: লগ নয়
    end if;
  end loop;
  for h in select * from mc2_top_hist where cur_rank is not null and card_id <> all (ids) loop
    update mc2_top_hist set cur_rank = null, updated_at = now() where card_id = h.card_id;
    insert into mc2_top_log(card_id, device, name, kind, old_rank, score, note)
    select h.card_id, h.device, h.name, 'leave', h.cur_rank, coalesce((select x.score from mc2_cards x where x.id = h.card_id), h.last_score),
           case when exists (select 1 from mc2_cards x where x.id = h.card_id) then null else 'card deleted' end;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function mc2_top_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin perform mc2_top_sync(false); exception when others then null; end;
  return null;
end $$;
revoke all on function mc2_top_sync(boolean), mc2_top_trg() from public, anon, authenticated;

drop trigger if exists mc2_cards_topsync on mc2_cards;
create trigger mc2_cards_topsync after insert or delete or update of score on mc2_cards for each statement execute function mc2_top_trg();

-- একবারের ভরাট (ইতিহাস খালি থাকলেই): এখনকার টপ ৩ + আগে pinned হওয়া কার্ড। আগের সঠিক সময়/Rank জানা নেই, তাই updated_at ও স্কোর ধরা হয় এবং লগে note = backfill।
do $$
begin
  if not exists (select 1 from mc2_top_hist) then
    perform mc2_top_sync(true);
    insert into mc2_top_hist(card_id, device, name, first_top_at, first_score, last_top_at, last_score)
    select c.id, c.device, c.name, c.updated_at, c.score, c.updated_at, c.score from mc2_cards c where c.pinned
    on conflict (card_id) do nothing;
    insert into mc2_top_log(card_id, device, name, kind, score, at, note)
    select h.card_id, h.device, h.name, 'enter', h.first_score, h.first_top_at, 'backfill: আগের Rank জানা নেই'
      from mc2_top_hist h where h.best_rank is null and not exists (select 1 from mc2_top_log l where l.card_id = h.card_id);
  end if;
end $$;

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select 'mc2_top_hist' as item, to_regclass('public.mc2_top_hist') is not null as ok
union all select 'mc2_top_log', to_regclass('public.mc2_top_log') is not null
union all select '৬টা ইনডেক্স', (select count(*) = 6 from pg_indexes where schemaname = 'public'
  and indexname in ('mc2_top_hist_dev', 'mc2_top_hist_first', 'mc2_top_hist_cur', 'mc2_top_log_card', 'mc2_top_log_dev', 'mc2_top_log_at'))
union all select 'mc2_top_sync', exists (select 1 from pg_proc where proname = 'mc2_top_sync')
union all select 'ট্রিগার mc2_cards_topsync', exists (select 1 from pg_trigger where tgname = 'mc2_cards_topsync' and not tgisinternal);

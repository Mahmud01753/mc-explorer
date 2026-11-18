-- supabase-new-20261021.sql — টপ ৩ সুরক্ষা ঠিক করা (একবার Run; আবার চালালেও ক্ষতি নেই)
-- সমস্যা: আগে "count(score >) < 3" ছিল, তাই সমান স্কোরে অনেক কার্ড একসাথে "টপ" ধরা পড়ত ও pinned (অটো-ক্লিন সুরক্ষিত) হয়ে যেত।
-- নতুন নিয়ম: টপ = ঠিক ৩টা আসন (লিডারবোর্ডের টপ ৩-এর মতোই)। ক্রম: স্কোর বেশি আগে; সমান স্কোরে যে আগে ওই স্কোর করেছে (mc2_scores.created_at), তারপর id।
-- Rank দেখানোর নিয়ম অপরিবর্তিত: সমান স্কোরে একই Rank (যেমন 1,1,2), কিন্তু আসন ৩টাই।
-- কার্ড একবার টপের আসনে ঢুকলেই pinned = true হয় এবং কখনো আর false হয় না: স্কোর কমলে, লিডারবোর্ড থেকে বাদ গেলে বা লুকালেও সুরক্ষা থাকে।
-- pinned দেওয়ার কাজ এখন mc2_top_sync() (কার্ড insert/delete/স্কোর বদলের ট্রিগার) করে; mc2_card_save থেকে পুরোনো "count(score >) < 3" লাইনটা বাদ।
-- ইতিহাস (mc2_top_hist / mc2_top_log) কার্ড আপডেট বা ডিলিটে হারায় না: কার্ডের সাথে কোনো সংযোগ-নিষেধ নেই, অটো-ক্লিন/বিন এগুলো ছোঁয় না।
-- নতুন: (ক) ইতিহাসে dept, batch, best_score জমা থাকে (কার্ড মুছে গেলেও কে ছিল জানা যায়); (খ) টপে থাকা কার্ড মুছে একই device+নামে আবার কার্ড হলে ইতিহাস নতুন কার্ডে জুড়ে যায় ও সেটা সরাসরি pinned হয়।
-- আগে ...19, ...19b, ...19c, ...20c চালানো থাকতে হবে। পুরোনো pinned কার্ড কাউকে আনপিন করা হয় না (কোনো ডেটা মোছা/বদলানো হয় না)।

-- ০) ইতিহাসে কার্ড মুছে গেলেও থেকে যাওয়ার মতো তথ্য
alter table mc2_top_hist add column if not exists dept text;
alter table mc2_top_hist add column if not exists batch text;
alter table mc2_top_hist add column if not exists best_score int;
update mc2_top_hist h set dept = c.dept, batch = c.batch from mc2_cards c where c.id = h.card_id and h.dept is null;
update mc2_top_hist set best_score = greatest(coalesce(first_score, 0), coalesce(last_score, 0)) where best_score is null;

-- ১) ঠিক ৩ আসন: (id, rank) ফেরত
create or replace function mc2_top_seats() returns table(id bigint, rk int)
language sql stable security definer set search_path = public as $$
  with lim as (select coalesce((select c.score from mc2_cards c order by c.score desc offset 2 limit 1), -1) as s3),
  cand as (
    select c.id, c.score, c.created_at,
      (select min(s.created_at) from mc2_scores s where s.device = c.device and lower(s.name) = lower(c.name) and s.score = c.score) as reached
    from mc2_cards c, lim where c.score >= lim.s3
  ), rk as (
    select c.id, c.score, c.reached, c.created_at, rank() over (order by c.score desc) as r from cand c
  )
  select rk.id, rk.r::int from rk order by rk.score desc, rk.reached nulls last, rk.created_at, rk.id limit 3
$$;
revoke all on function mc2_top_seats() from public, anon, authenticated;

-- ২) mc2_top_sync: এখন ৩ আসন ধরে ইতিহাস হালনাগাদ করে + আসনে ঢোকা কার্ড pinned করে
create or replace function mc2_top_sync(p_backfill boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare r record; h record; n int := 0; ids bigint[] := '{}'; ts timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('mc2_top_sync'));
  for r in select t.id, c.device, c.name, c.dept, c.batch, c.score, t.rk, c.updated_at
             from mc2_top_seats() t join mc2_cards c on c.id = t.id order by t.rk, t.id loop
    ids := ids || r.id;
    update mc2_cards set pinned = true where id = r.id and not pinned;
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
      update mc2_top_hist set last_score = r.score, updated_at = now() where card_id = r.id;
    end if;
    update mc2_top_hist set dept = r.dept, batch = r.batch, best_score = greatest(coalesce(best_score, r.score), r.score) where card_id = r.id;
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
revoke all on function mc2_top_sync(boolean) from public, anon, authenticated;

-- ২ক) কার্ড মুছে আবার একই device+নামে তৈরি হলে: ইতিহাস নতুন কার্ডে জুড়ে যায় (log-সহ) ও কার্ড pinned হয়। ভুল হলেও কার্ড সেভ আটকায় না।
create or replace function mc2_cards_hist_link() returns trigger language plpgsql security definer set search_path = public as $$
declare oid_ bigint;
begin
  begin
    if exists (select 1 from mc2_top_hist h where h.device = new.device and lower(h.name) = lower(new.name)) then new.pinned := true; end if;
    if not exists (select 1 from mc2_cards c where c.device = new.device and lower(c.name) = lower(new.name))
       and not exists (select 1 from mc2_top_hist where card_id = new.id) then
      select h.card_id into oid_ from mc2_top_hist h
       where h.device = new.device and lower(h.name) = lower(new.name) and not exists (select 1 from mc2_cards c where c.id = h.card_id)
       order by h.last_top_at desc limit 1;
      if oid_ is not null then
        update mc2_top_hist set card_id = new.id where card_id = oid_;
        update mc2_top_log set card_id = new.id where card_id = oid_;
      end if;
    end if;
  exception when others then null;
  end;
  return new;
end $$;
revoke all on function mc2_cards_hist_link() from public, anon, authenticated;
drop trigger if exists mc2_cards_histlink on mc2_cards;
create trigger mc2_cards_histlink before insert on mc2_cards for each row execute function mc2_cards_hist_link();

-- ৩) mc2_card_save: ...19b-র সংস্করণের কপি; শুধু পুরোনো "count(score >) < 3 → pinned" লাইনটা বাদ (pinned এখন ওপরের mc2_top_sync দেয়)
create or replace function mc2_card_save(p_device text, p_name text, p_dept text, p_batch text, p_score int, p_rec jsonb, p_thumb text, p_photo text)
returns text language plpgsql security definer set search_path = public as $$
declare v record; nm text := trim(coalesce(p_name, '')); rec jsonb; old record;
begin
  if char_length(coalesce(p_device, '')) not between 8 and 40 or char_length(nm) not between 1 and 30 or p_score is null or p_score not between 0 and 1000 then return 'invalid'; end if;
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
  if random() < 0.1 then begin perform mc2_cleanup_tick(); exception when others then null; end; end if;
  return 'ok';
end $$;

-- ৪) একবারের মিলানো: এখনকার ঠিক ৩ আসনের কার্ড pinned + ইতিহাসে (ট্রিগার না চালিয়েও এখনই)
select mc2_top_sync(false);

-- নাম-চেক: সব সারিতে ok = true এলে ঠিক
select 'mc2_top_seats' as item, exists (select 1 from pg_proc where proname = 'mc2_top_seats') as ok
union all select 'ঠিক ৩ আসন (কার্ড ৩টির কম হলে যত আছে)', (select count(*) from mc2_top_seats()) = least(3, (select count(*) from mc2_cards))
union all select 'আসনের সব কার্ড pinned', not exists (select 1 from mc2_top_seats() s join mc2_cards c on c.id = s.id where not c.pinned)
union all select 'ইতিহাসে dept/batch/best_score কলাম', (select count(*) = 3 from information_schema.columns where table_name = 'mc2_top_hist' and column_name in ('dept', 'batch', 'best_score'))
union all select 'ট্রিগার mc2_cards_histlink', exists (select 1 from pg_trigger where tgname = 'mc2_cards_histlink' and not tgisinternal)
union all select 'mc2_card_save-এ পুরোনো লাইন নেই', (select prosrc not like '%x.score > v.score%' from pg_proc where proname = 'mc2_card_save' limit 1);

-- (ঐচ্ছিক, শুধু দেখার জন্য — কিছু বদলায় না) আগের ভুল নিয়মে pinned হওয়া কিন্তু এখন ৩ আসনে নেই এমন কার্ড কতগুলো:
-- select count(*) from mc2_cards where pinned and id not in (select id from mc2_top_seats());

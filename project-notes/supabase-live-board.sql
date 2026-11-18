-- MC Explorer — (ক) চ্যাটে Live Typing Indicator + Join/Leave System Message, (খ) লিডারবোর্ডের ফিল্টার/র‍্যাংক।
-- চালানোর ক্রম: supabase-moderation.sql-এর পরে (supabase-pending-all.sql-এ সবই ক্রমে আছে)। আবার চালালেও ক্ষতি নেই।

-- ========== (ক) লাইভ উপস্থিতি, টাইপিং, Join/Leave ==========
create table if not exists mc2_ac_here (
  session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text not null, nick text,
  at timestamptz not null default now(), typing_at timestamptz, primary key (session_id, voter));
create table if not exists mc2_ac_events (
  id bigserial primary key, session_id int not null references mc2_ac_sessions(id) on delete cascade, voter text,
  kind text not null check (kind in ('join', 'leave')), nick text, created_at timestamptz not null default now());
create index if not exists mc2_ac_events_s on mc2_ac_events (session_id, id desc);
alter table mc2_ac_here enable row level security; alter table mc2_ac_events enable row level security;
revoke all on mc2_ac_here, mc2_ac_events from anon, authenticated;

-- একটাই কল: নিজের হাজিরা + টাইপিং পাঠায়; ফেরত দেয় কারা টাইপ করছে ও নতুন Join/Leave।
-- p_after < 0 (প্রথমবার) = শুধু বর্তমান শেষ id নেয়, পুরোনো ইভেন্ট ফেরত দেয় না।
-- ৭৫ সেকেন্ড সাড়া না দিলে (ট্যাব বন্ধ/নেট নেই) সবার পোলিংয়ের সময় নিজে থেকে "Leave" ধরা হয়।
create or replace function mc2_ac_live(p_session int, p_voter text, p_nick text, p_typing boolean default false, p_after bigint default -1) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v text := coalesce(p_voter, ''); nk text := coalesce(nullif(mc2_ac_clean(p_nick, 30), ''), 'বেনামি'); h record; last bigint; ty jsonb; ev jsonb;
begin
  if v !~ '^[A-Za-z0-9_-]{8,80}$' then return jsonb_build_object('err', 1); end if;
  if not exists (select 1 from mc2_ac_sessions s join mc2_ac_depts d on d.id = s.dept_id where s.id = p_session and s.active and d.active) then return jsonb_build_object('err', 2); end if;
  if not mc2_ac_rl('live:v:' || v || ':60', 90, 60) then return jsonb_build_object('err', 3); end if;
  if mc2_ac_block(v) is null then
    with gone as (delete from mc2_ac_here where session_id = p_session and voter <> v and at < now() - interval '75 seconds' returning voter, nick)
      insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
    select * into h from mc2_ac_here where session_id = p_session and voter = v;
    if not found or h.at < now() - interval '75 seconds' then insert into mc2_ac_events(session_id, voter, kind, nick) values (p_session, v, 'join', nk); end if;
    insert into mc2_ac_here(session_id, voter, nick, at, typing_at) values (p_session, v, nk, now(), case when p_typing then now() end)
    on conflict (session_id, voter) do update set nick = excluded.nick, at = now(), typing_at = case when p_typing then now() end;
  end if;
  if p_after is null or p_after < 0 then
    select coalesce(max(id), 0) into last from mc2_ac_events where session_id = p_session; ev := '[]'::jsonb;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'k', e.kind, 'n', e.nick, 't', (extract(epoch from e.created_at) * 1000)::bigint, 'o', e.voter = v) order by e.id), '[]'::jsonb), coalesce(max(e.id), p_after)
      into ev, last from (select * from mc2_ac_events where session_id = p_session and id > p_after order by id limit 30) e;
  end if;
  select coalesce(jsonb_agg(x.nick order by x.typing_at), '[]'::jsonb) into ty
    from (select nick, typing_at from mc2_ac_here where session_id = p_session and voter <> v and typing_at > now() - interval '5 seconds' order by typing_at limit 10) x;
  return jsonb_build_object('last', last, 'ev', ev, 'ty', ty);
end $$;
grant execute on function mc2_ac_live(int, text, text, boolean, bigint) to anon, authenticated;

-- ঘর ছাড়লে সাথে সাথে Leave
create or replace function mc2_ac_leave(p_session int, p_voter text) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_voter, '') !~ '^[A-Za-z0-9_-]{8,80}$' or not mc2_ac_rl('leave:v:' || p_voter || ':60', 30, 60) then return; end if;
  with gone as (delete from mc2_ac_here where session_id = p_session and voter = p_voter returning voter, nick)
    insert into mc2_ac_events(session_id, voter, kind, nick) select p_session, voter, 'leave', nick from gone;
end $$;
grant execute on function mc2_ac_leave(int, text) to anon, authenticated;

-- পুরোনো ইভেন্ট/হাজিরা পরিষ্কার (মোছার টিক-এর সাথে চলে)
create or replace function mc2_ac_purge_live() returns void language sql security definer set search_path = public as $$
  delete from mc2_ac_events where created_at < now() - interval '1 day';
  delete from mc2_ac_here where at < now() - interval '1 day' $$;
revoke all on function mc2_ac_purge_live() from public, anon, authenticated;
create or replace function mc2_ac_tick() returns void language plpgsql security definer set search_path = public as $$
begin if mc2_ac_rl('purge', 1, 300) then perform mc2_ac_purge(); perform mc2_ac_purge_live(); end if; end $$;
grant execute on function mc2_ac_tick() to anon, authenticated;

-- ========== (খ) লিডারবোর্ড: সব ফলাফল স্থায়ীভাবে mc2_scores-এ (প্রতিটি খেলা, স্বয়ংক্রিয় মোছার আওতার বাইরে); ফিল্টার + র‍্যাংক সার্ভারে ==========
create index if not exists mc2_scores_dept on mc2_scores (dept);
create index if not exists mc2_scores_batch on mc2_scores (batch);
create index if not exists mc2_scores_score on mc2_scores (score desc);

-- p_mode 'best' = প্রত্যেকের (নাম+বিভাগ+সেশন) সেরা ফল; 'all' = সব খেলা। র‍্যাংক = ফিল্টার করা তালিকার ভেতরে (সমান স্কোরে সমান র‍্যাংক)।
-- ফিল্টার: বিভাগ, সেশন, তারিখ (p_from <= সময় < p_to), নাম খোঁজা। ভুল = মোট প্রশ্ন − সঠিক। আইপি/ডিভাইস কখনো ফেরত যায় না।
create or replace function mc2_board(p_dept text default null, p_batch text default null, p_from timestamptz default null, p_to timestamptz default null, p_q text default null, p_mode text default 'best', p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lim int := least(greatest(coalesce(p_limit, 50), 1), 500); ofs int := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(left(trim(coalesce(p_q, '')), 40), ''); ip text := mc2_ip(); res jsonb;
begin
  if ip is not null and not mc2_ac_rl('board:ip:' || ip || ':60', 60, 60) then return jsonb_build_object('err', 'slow'); end if;
  if q is not null then q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_'); end if;
  with base as (
    select s.id, s.name, s.dept, s.batch, s.score, s.ok, s.total, s.pct, s.created_at,
      row_number() over (partition by lower(s.name), s.dept, coalesce(s.batch, '') order by s.score desc, s.created_at) as rn
    from mc2_scores s
    where (nullif(p_dept, '') is null or s.dept = p_dept) and (nullif(p_batch, '') is null or s.batch = p_batch)
      and (p_from is null or s.created_at >= p_from) and (p_to is null or s.created_at < p_to)
      and (q is null or s.name ilike '%' || q || '%')
  ), pick as (select * from base where p_mode = 'all' or rn = 1),
  ranked as (select pick.*, rank() over (order by score desc) as rk, count(*) over () as total_n from pick),
  page as (select * from ranked order by rk, created_at, id offset ofs limit lim)
  select jsonb_build_object('total', coalesce((select max(total_n) from page), 0),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'rk', rk, 'name', name, 'dept', dept, 'batch', batch, 'score', score,
        'ok', coalesce(ok, 0), 'wrong', greatest(coalesce(total, 0) - coalesce(ok, 0), 0), 'total', coalesce(total, 0), 'pct', pct,
        'ts', (extract(epoch from created_at) * 1000)::bigint) order by rk, created_at, id) from page), '[]'::jsonb)) into res;
  return res || jsonb_build_object('depts', coalesce((select jsonb_agg(z.d order by z.d) from (select distinct dept as d from mc2_scores) z), '[]'::jsonb),
                                   'batches', coalesce((select jsonb_agg(z.b order by z.b) from (select distinct batch as b from mc2_scores where batch is not null and batch <> '') z), '[]'::jsonb));
end $$;
grant execute on function mc2_board(text, text, timestamptz, timestamptz, text, text, int, int) to anon, authenticated;

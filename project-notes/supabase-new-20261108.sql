-- ইউজার তথ্য ট্যাব: আরও ফিল্টার। পুরোনো mc2_admin_users যেমন ছিল তেমনই থাকে; এটা আলাদা নতুন ফাংশন। একবার চালালেই হবে।
create or replace function mc2_admin_users2(
  p_q text default '', p_status text default 'all', p_gender text default '', p_dept text default '', p_sess text default '', p_country text default '',
  p_dev text default '', p_os text default '', p_br text default '', p_phone text default '', p_score text default '', p_active text default '', p_sort text default 'new', p_from text default '', p_to text default '',
  p_limit int default 50, p_offset int default 0) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare q text := '%' || lower(btrim(coalesce(p_q, ''))) || '%';
begin
  if not mc2_is_admin() then raise exception 'admin only'; end if;
  return (
    with b as (
      select p.*, mc2_uid(p.voter) uid_, mc2_online(p.last_seen, p.offline) onl, (extract(epoch from p.last_seen) * 1000)::bigint ls_,
        (select max(s.score) from mc2_scores s where s.device = p.voter) best_,
        (select substring(e.contact from '(?:\+?88)?01[3-9][0-9]{8}') from contest_entries e where e.device = p.voter and e.contact is not null order by e.id desc limit 1) phone_,
        case when coalesce(p.ua, '') = '' then '' when p.ua ~* 'iPad|Tablet' then 'tab' when p.ua ~* 'Mobi|Android|iPhone' then 'mob' else 'pc' end dk_,
        case when p.ua ~ 'Android' then 'and' when p.ua ~ 'iPhone|iPad' then 'ios' when p.ua ~ 'Windows NT' then 'win' when p.ua ~ 'Mac OS X' then 'mac' when p.ua ~ 'Linux' then 'lin' else '' end ok_,
        case when p.ua ~ 'FBAN|FBAV|FB_IAB' then 'fb' when p.ua ~ 'Messenger' then 'msg' when p.ua ~ 'Instagram' then 'ig' when p.ua ~ 'SamsungBrowser/' then 'sam' when p.ua ~ 'EdgA?/' then 'edg'
             when p.ua ~ 'OPR/' then 'opr' when p.ua ~ 'Firefox/' then 'ff' when p.ua ~ 'Chrome/' then 'chr' when p.ua ~ 'Version/[0-9.]+.*Safari' then 'saf' else 'oth' end bk_
      from mc2_presence p
    ), f as (
      select * from b where
        (q = '%%' or lower(concat_ws(' ', nick, game_name, game_dept, game_batch, chat_dept, chat_session, ip, city, region, uid_)) like q)
        and (p_status not in ('on', 'off') or (p_status = 'on') = onl)
        and (p_gender = '' or (p_gender in ('m', 'f') and gender = p_gender) or (p_gender = 'x' and coalesce(gender, '') not in ('m', 'f')))
        and (p_dept = '' or game_dept = p_dept or chat_dept = p_dept)
        and (p_sess = '' or game_batch = p_sess or chat_session = p_sess)
        and (p_country = '' or country = p_country)
        and (p_dev = '' or dk_ = p_dev) and (p_os = '' or ok_ = p_os) and (p_br = '' or bk_ = p_br)
        and (p_phone = '' or (p_phone = 'yes' and phone_ is not null) or (p_phone = 'no' and phone_ is null))
        and (p_score = '' or (p_score = 'yes' and best_ is not null) or (p_score = 'no' and best_ is null))
        and (p_active = '' or (p_active = 'today' and last_seen >= date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka')
             or (p_active = '7' and last_seen > now() - interval '7 days') or (p_active = '30' and last_seen > now() - interval '30 days')
             or (p_active = 'old' and last_seen <= now() - interval '30 days') or p_active = 'custom')
        and (p_from = '' or last_seen >= (p_from::date)::timestamp at time zone 'Asia/Dhaka')
        and (p_to = '' or last_seen < (p_to::date + 1)::timestamp at time zone 'Asia/Dhaka')
    )
    select jsonb_build_object(
      'total', (select count(*) from f),
      'rows', coalesce((select jsonb_agg(to_jsonb(x) - 'rn' order by x.rn) from (
          select row_number() over (order by case when p_sort = 'score' then best_ end desc nulls last, case when p_sort = 'visits' then visits end desc nulls last,
                   case when p_sort = 'old' then last_seen end asc, last_seen desc) rn,
            voter, uid_ uid, nick, game_name gname, game_dept gdept, game_batch gbatch, chat_dept cdept, chat_session csess, page, ip, country, region, city, left(ua, 200) ua, visits, gender, info,
            phone_ phone, ls_ ls, onl online, best_ best
          from f) x where x.rn > greatest(p_offset, 0) and x.rn <= greatest(p_offset, 0) + least(greatest(p_limit, 1), 100)), '[]'::jsonb),
      'depts', coalesce((select jsonb_agg(v order by v) from (select game_dept v from b union select chat_dept from b) z where v is not null and btrim(v) <> ''), '[]'::jsonb),
      'sessions', coalesce((select jsonb_agg(v order by v) from (select game_batch v from b union select chat_session from b) z where v is not null and btrim(v) <> ''), '[]'::jsonb),
      'countries', coalesce((select jsonb_agg(v order by v) from (select distinct country v from b) z where v ~ '^[A-Z]{2}$' and v not in ('XX', 'T1')), '[]'::jsonb)));
end $$;
revoke all on function mc2_admin_users2(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, int, int) from public, anon;
grant execute on function mc2_admin_users2(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, int, int) to authenticated;
notify pgrst, 'reload schema';

-- চেক: ok = true এলে ঠিক
select 'ইউজার তথ্য নতুন ফিল্টার ফাংশন' as item, to_regprocedure('mc2_admin_users2(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,int,int)') is not null as ok;

-- ============================================================
-- বেনামি চ্যাট: একসাথে পাসওয়ার্ড লক (২০২৬-১০-২০)
-- আগে থেকে থাকা: প্রতি সেশনে আলাদা পাসওয়ার্ড (supabase-new-20261017d.sql / supabase-moderation.sql) — সেটা বদলায়নি।
-- নতুন: (ক) একটি বিভাগের সব সেশনে একসাথে, (খ) সব বিভাগের সব সেশনে একসাথে — পাসওয়ার্ড বসানো/সরানো, চালু/বন্ধ।
-- পাসওয়ার্ড প্রতি সেশনের আইডি মিশিয়ে আলাদা আলাদা হ্যাশ হয়ে সেভ হয় (আগের নিয়মেই)। পড়া ও পাঠানো সার্ভারেই আটকায়।
-- বদলালে/সরালে/চালু-বন্ধ করলে ওই সেশনগুলোর আগের সবার অ্যাক্সেস মুছে যায়। Supabase SQL Editor-এ একবার Run করুন; আবার চালালেও ক্ষতি নেই।
-- ============================================================
create or replace function mc2_ac_admin_setpw_bulk(p_scope text, p_dept int, p_pw text) returns int language plpgsql security definer set search_path = public as $$
declare w text := btrim(coalesce(p_pw, '')); n int;
begin
  perform mc2_ac_adm();
  if p_scope not in ('all', 'dept') then raise exception 'অবৈধ পরিসর'; end if;
  if p_scope = 'dept' and p_dept is null then raise exception 'বিভাগ বাছুন'; end if;
  if w <> '' and char_length(w) not between 3 and 40 then raise exception 'পাসওয়ার্ড ৩ থেকে ৪০ অক্ষরের হতে হবে'; end if;
  if w = '' then
    update mc2_ac_sessions set pw_hash = null, pw_on = false where p_scope = 'all' or dept_id = p_dept;
  else
    update mc2_ac_sessions set pw_hash = mc2_ac_pwh(id, w), pw_on = true where p_scope = 'all' or dept_id = p_dept;
  end if;
  get diagnostics n = row_count;
  delete from mc2_ac_access where session_id in (select id from mc2_ac_sessions where p_scope = 'all' or dept_id = p_dept);
  return n;
end $$;
revoke all on function mc2_ac_admin_setpw_bulk(text, int, text) from public, anon;
grant execute on function mc2_ac_admin_setpw_bulk(text, int, text) to authenticated;

-- চালু/বন্ধ: চালু শুধু তাদের, যাদের পাসওয়ার্ড সেভ করা আছে; বন্ধ সবার (সেভ করা পাসওয়ার্ড থাকে)
create or replace function mc2_ac_admin_pwon_bulk(p_scope text, p_dept int, p_on boolean) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform mc2_ac_adm();
  if p_scope not in ('all', 'dept') then raise exception 'অবৈধ পরিসর'; end if;
  if p_scope = 'dept' and p_dept is null then raise exception 'বিভাগ বাছুন'; end if;
  update mc2_ac_sessions set pw_on = p_on
   where (p_scope = 'all' or dept_id = p_dept) and (not p_on or pw_hash is not null);
  get diagnostics n = row_count;
  delete from mc2_ac_access where session_id in (select id from mc2_ac_sessions where p_scope = 'all' or dept_id = p_dept);
  return n;
end $$;
revoke all on function mc2_ac_admin_pwon_bulk(text, int, boolean) from public, anon;
grant execute on function mc2_ac_admin_pwon_bulk(text, int, boolean) to authenticated;

-- ============================================================
-- পাসওয়ার্ড-লক চ্যাটে ইউজারকে দেখানোর "নির্দেশনা" (ঐচ্ছিক; ডিফল্টে খালি = কিছু দেখায় না)
-- অ্যাডমিন লিখলে তবেই ইউজার দেখে — পাসওয়ার্ডের ঘরের নিচে, ভুল পাসওয়ার্ড দিলেও। যেমন: শর্ত, পেইড কি না, কার কাছে পাসওয়ার্ড পাবে।
-- সর্বোচ্চ ৫০০ অক্ষর। এক সেশনে, একটা বিভাগের সব সেশনে, বা সব সেশনে একসাথে বসানো/সরানো যায়।
-- ============================================================
alter table mc2_ac_sessions add column if not exists pw_note text;
grant select (pw_note) on mc2_ac_sessions to anon;
create or replace function mc2_ac_admin_pwnote(p_session int, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare w text := btrim(coalesce(p_note, ''));
begin
  perform mc2_ac_adm();
  if char_length(w) > 500 then raise exception 'নির্দেশনা ৫০০ অক্ষরের বেশি হবে না'; end if;
  update mc2_ac_sessions set pw_note = nullif(w, '') where id = p_session;
end $$;
revoke all on function mc2_ac_admin_pwnote(int, text) from public, anon;
grant execute on function mc2_ac_admin_pwnote(int, text) to authenticated;
create or replace function mc2_ac_admin_pwnote_bulk(p_scope text, p_dept int, p_note text) returns int language plpgsql security definer set search_path = public as $$
declare w text := btrim(coalesce(p_note, '')); n int;
begin
  perform mc2_ac_adm();
  if p_scope not in ('all', 'dept') then raise exception 'অবৈধ পরিসর'; end if;
  if p_scope = 'dept' and p_dept is null then raise exception 'বিভাগ বাছুন'; end if;
  if char_length(w) > 500 then raise exception 'নির্দেশনা ৫০০ অক্ষরের বেশি হবে না'; end if;
  update mc2_ac_sessions set pw_note = nullif(w, '') where p_scope = 'all' or dept_id = p_dept;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function mc2_ac_admin_pwnote_bulk(text, int, text) from public, anon;
grant execute on function mc2_ac_admin_pwnote_bulk(text, int, text) to authenticated;

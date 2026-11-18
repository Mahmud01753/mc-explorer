-- 2026-11-01: মডারেশন > রিপোর্ট তালিকার মোট সংখ্যা (১ ২ ৩ পেজ-নম্বরের জন্য)। একবার চালান; আবার চালালেও ক্ষতি নেই।
create or replace function mc2_ac_admin_reports_count(p_status text default 'open') returns int
language plpgsql stable security definer set search_path = public as $$
begin
  perform mc2_ac_adm();
  return (select count(*)::int from mc2_ac_reports r where (p_status = 'all' or r.status = p_status));
end $$;
revoke all on function mc2_ac_admin_reports_count(text) from public, anon;
grant execute on function mc2_ac_admin_reports_count(text) to authenticated;

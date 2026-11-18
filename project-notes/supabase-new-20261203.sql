-- ২০২৬-১২-০৩: ✏️ সম্পাদিত বিজয়ী কার্ড (winners[].cs.l-এ নতুন কোড e<০-১৯>.<base64url>, সর্বোচ্চ ১৬০০ অক্ষর) সার্ভারে সেভ হতে দেয় — mc2_draw_clean বদলায় (একবার Run, নিরাপদে বারবার চালানো যায়)
-- আগের s1|s2|s3|w0..w19 আগের মতোই; ছবি/টেবিল নেই, শুধু ছোট লেখা।

create or replace function mc2_draw_clean(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', left(trim(w ->> 'name'), 80),
      'dept', left(coalesce(w ->> 'dept', ''), 80),
      'batch', left(coalesce(w ->> 'batch', ''), 40),
      'rank', case when (w ->> 'rank') ~ '^\d{1,6}$' then (w ->> 'rank')::int end,
      'score', case when (w ->> 'score') ~ '^\d{1,6}$' then (w ->> 'score')::int end,
      'note', left(coalesce(w ->> 'note', ''), 200))
    || case when w ->> 'cv' in ('w', 'b', 's1', 's2', 's3', 'c') then jsonb_build_object('cv', w ->> 'cv') else '{}'::jsonb end
    || case when (w ->> 'pd') ~ '^\d{1,2}$' and (w ->> 'pd')::int between 0 and 19 then jsonb_build_object('pd', (w ->> 'pd')::int) else '{}'::jsonb end
    || case when jsonb_typeof(w -> 'cs') = 'object' and jsonb_typeof(w -> 'cs' -> 'l') = 'array' then jsonb_build_object('cs', jsonb_build_object(
         'n', left(coalesce(w -> 'cs' ->> 'n', ''), 40),
         'l', coalesce((select jsonb_agg(e.x order by e.o) from (select t.x, t.o from jsonb_array_elements_text(w -> 'cs' -> 'l') with ordinality t(x, o) where t.x ~ '^(s[123]|w([0-9]|1[0-9])|e([0-9]|1[0-9])\.[A-Za-z0-9_-]+)$' and length(t.x) <= 1600 order by t.o limit 23) e), '[]'::jsonb))) else '{}'::jsonb end
  ), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end) w
  where length(trim(coalesce(w ->> 'name', ''))) > 0
$$;

-- চেক (চালানোর পর): কোনো ফল ফেরে না, শুধু Success দেখালেই হবে
-- select mc2_draw_clean('[{"name":"টেস্ট","cv":"c","cs":{"n":"x","l":["w3","e3.eyJzIjp7fX0"]}}]'::jsonb);

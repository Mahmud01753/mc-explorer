# ℹ️ পরের আপডেট: 🚦 ফেসবুক-অনুমতি গেট (নাম বাছার সময় অনুমতি-নেই যাদের নিয়ে একটাই পপআপ — admin-fbc.js, admin-dlhub.js, admin-sheet.js) — কোনো নতুন SQL নেই; কোনো নতুন টেবিল/কলাম নেই। কোনো SQL পেন্ডিং নেই।
# ✅ 2026-12-20: চালানো হয়েছে (মালিক জানিয়েছেন) — supabase-new-20261220.sql (ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি: টেবিল mc2_fbok — প্রতি ফোনে ১ সারি ≈ ১০০ বাইট; ফাংশন mc2_fb_get/mc2_fb_set; অ্যাডমিন-ভিউ mc2_cards_fbv)। এখন অ্যাডমিনে 📣 অনুমতির চিহ্ন/ফিল্টার কাজ করার কথা; কোনো SQL পেন্ডিং নেই।
# ℹ️ 2026-12-19: ফোল্ডার ডাউনলোড (Excel/JPG/ZIP), ⬇ ডাউনলোড ট্যাবে সরাসরি ডাউনলোড, লটারি ডিফল্ট ৩ জন ও ➕ আরও বিজয়ী (admin-export.js, admin-folders.js, admin-dlhub.js, admin-lottery.js, admin-prize.js) — কোনো নতুন SQL নেই; কোনো নতুন টেবিল/কলাম নেই। SQL-এর অবস্থা আগের মতোই (কোনো SQL পেন্ডিং নেই)।
# ✅ 2026-12-16: মালিক নিজে জানিয়েছেন "Run done" — supabase-new-20261206.sql ✅ চালানো (কুইজ ছবির সেটিং: mc2_settings_check-এ qimg_cfg)। এখন কোনো SQL পেন্ডিং নেই। supabase-pending-all.sql শুধু রেফারেন্স, আবার চালাতে হবে না।
# ℹ️ 2026-12-16: ভাগ ৩ (🪪 কার্ড › 📦 ZIP: JPG + এক্সেল + PDF — admin-export.js, admin-cards.js) — কোনো নতুন SQL নেই; শুধু বিদ্যমান mc2_cards ও mc2_draw_admin_list পড়া; সব ফাইল ব্রাউজারে তৈরি, সার্ভারে কিছু জমে না। শুধু /admin-এর CSP-তে cdnjs অনুমতি যোগ (_headers, netlify.toml)।
# ℹ️ 2026-12-15: ভাগ ২গ (কুইজ ছবির হিসাব, বিজয়ী প্রিভিউ, ফলাফলের তারিখ দ্রুত-বাছাই, বিন "সব ফেরান" — admin-qimg.js, admin-winners.js, admin-results.js, admin-bin.js) — কোনো নতুন SQL নেই; বিদ্যমান টেবিল/RPC পড়া, আর ফেরানো আগের একটা-একটা RPC (mc2_bin_restore) দিয়ে।
# ℹ️ 2026-12-14: ভাগ ২খ (বিজয়ী কপি, সার্ভে বার, বিন মেয়াদ — admin-winners.js, admin-survey.js, admin-bin.js) — কোনো নতুন SQL নেই; শুধু বিদ্যমান RPC (mc2_survey_get, mc2_cleanup_admin_get, mc2_bin_list) পড়া।
# ℹ️ 2026-12-13: ভাগ ২ক (🪪 কার্ড: সেশন ফিল্টার, মোট/MB হিসাব, ⭐ পছন্দের কার্ড — admin-cards.js) — কোনো নতুন SQL নেই; ⭐ শুধু ব্রাউজারের localStorage-এ।
# ℹ️ 2026-12-12: 🎯 কুইজ কঠিনতা (admin-diff.js) — কোনো নতুন SQL নেই, শুধু পড়া।
# ℹ️ 2026-12-12: ধাপ ৫-ঘ (কার্ড প্রিভিউ: থাম্বনেইল-সহ এক্সেল, নতুন SQL নেই), ধাপ ৫-গ (চ্যাট, বেনামি চ্যাট, মডারেশন, বিন; নতুন SQL নেই) ও ধাপ ৫-খ (⬇ এক্সেল: কার্ড, বিজয়ী ঘোষণা, বিজয়ী কার্ড সেটিংস, কুইজ ছবি, ছবির গ্যালারি, ফোল্ডার; admin-xtab.js) — কোনো নতুন SQL লাগে না; কোনো টেবিল/কলাম/ডাটা বাড়েনি, স্টোরেজে কিছু জমে না। SQL-এর অবস্থা আগের মতোই।
# ℹ️ 2026-12-11: ধাপ ৫-ক (⬇ এক্সেল: সার্ভে, লিডারবোর্ড, স্কোর, ভিজিটর, User Info, পুরস্কার ও নোট; admin-xtab.js) — কোনো নতুন SQL লাগে না; কোনো টেবিল/কলাম/ডাটা বাড়েনি। SQL-এর অবস্থা আগের মতোই (শুধু supabase-new-20261206.sql মালিক চালানোর কথা জানালে তবেই ✅)।
# ℹ️ 2026-12-10: ধাপ ৪ (⬇ এক্সেল ডাউনলোড-ফিল্টার জানালা, admin-xdlg.js) — কোনো নতুন SQL লাগে না; কোনো টেবিল/কলাম/ডাটা বাড়েনি, স্টোরেজে কিছু জমে না। SQL-এর অবস্থা আগের মতোই (শুধু supabase-new-20261206.sql মালিক চালানোর কথা জানালে তবেই ✅)।
# ℹ️ 2026-12-09: supabase-pending-all.sql এখন শুধু supabase-new-20261206.sql (PENDING) ধরে — আগে ছিল চালানো-হওয়া পুরোনো ফাইল। ধাপ ৩ (⬇ এক্সেল সাজানো ডিজাইন, admin-xlsx.js) — কোনো নতুন SQL লাগে না; SQL-এর অবস্থা আগের মতোই (শুধু supabase-new-20261206.sql মালিক চালানোর কথা জানালে তবেই ✅)।
# ⚠️ 2026-12-06: supabase-new-20261206.sql চালানো হয়নি (কুইজ ছবির সেটিং সেভের জন্য; না চালালে অ্যাডমিন > 🖼 কুইজ ছবি সেভ ব্যর্থ হবে, সাইট আগের মতোই চলবে)
# ✅ 2026-12-04: মালিক নিজে জানিয়েছেন supabase-new-20261203.sql চালানো (✏️ সম্পাদিত বিজয়ী কার্ড সেভ: mc2_draw_clean-এ e<০-১৯>.<base64url>)। এখন কোনো SQL পেন্ডিং নেই। ২০২৬-১২-০৪-এর আপডেটে (ভাঁজ করা অপশন, নতুন লাইন, এক ডিজাইনের এক কপি, ছোট সেভ-কোড, বের হলে ওয়ার্নিং, ঘোষণা সেভ বাটন) নতুন কোনো SQL লাগে না।
# ✅ 2026-10-30: মালিক নিজে জানিয়েছেন "Run done" — supabase-new-20261130.sql ✅ চালানো (কাস্টম একাধিক কার্ড বিজয়ী তালিকায়: mc2_draw_clean-এ cv='c' ও cs)। এখন কোনো SQL পেন্ডিং নেই। supabase-pending-all.sql শুধু রেফারেন্স, আবার চালাতে হবে না।
# ✅ 2026-10-30: মালিক নিজে জানিয়েছেন supabase-new-20261127.sql (সার্ভে সার্ভারে) চালানো হয়েছে। এখন কোনো SQL পেন্ডিং নেই। এই আপডেট (og ঠিকানা অটো) কোনো নতুন SQL লাগে না।
# ✅ 2026-10-30: মালিক নিজে জানিয়েছেন আগের পেন্ডিং SQL চালানো হয়ে গেছে — supabase-new-20261125.sql ✅ চালানো (কার্ড ডিলিটে সব ডেটা বিনে + ফেরানো; চ্যাট ফাইল মোছা; submit_entry-তে স্ক্রিনশট শুধু https)। এখন কোনো SQL পেন্ডিং নেই। supabase-pending-all.sql শুধু রেফারেন্স, আবার চালাতে হবে না। এই আপডেট (CSP মেলানো, CSV, ইউজার মোছা, লোগো ট্যাব) কোনো নতুন SQL লাগে না।
# (আগের লাইন, এখন চালানো ✅) 2026-10-30: supabase-new-20261125.sql (কার্ড ডিলিটে উত্তর/ভিজিটর/টপ-হিস্টরি/ফ্ল্যাগও বিনে + বিন থেকে কার্ড ফেরালে সব একসাথে ফেরে; সুরক্ষা-ট্রিগার বিন-ট্রিগারের আগে চলে (ভুয়া বিন-কপি ও ফাইল-মোছা বন্ধ); চ্যাট বার্তা মুছলে ফাইলও মোছে; submit_entry-তে স্ক্রিনশট শুধু https)। ✅ চালানো। supabase-pending-all.sql এখন শুধু এই একটা। আগে চালানো থাকতে হবে: 20261019b, 20261110, 20261113 (সব ✅)।
# ✅ 2026-10-30: মালিক নিজে জানিয়েছেন "SQL সাকসেস, রান হয়েছে" — supabase-pending-all.sql একবারে পুরো চালানো: [১] supabase-new-20261123.sql ✅ (বিজয়ী কার্ড-বাছাই cv/pd) · [২] supabase-new-20261124.sql ✅ (win_card_on / win_score_on / win_photo_on সার্ভারেও: mc2_card_peek + mc2_winner_photo)। এখন কোনো SQL পেন্ডিং নেই। supabase-pending-all.sql শুধু রেফারেন্স, আবার চালাতে হবে না।
# (আগের লাইন, এখন চালানো ✅) 2026-12-03: (মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে) — supabase-new-20261203.sql (✏️ সম্পাদিত বিজয়ী কার্ড সেভ: mc2_draw_clean-এ নতুন কোড e<০-১৯>.<base64url>; শুধু ছোট লেখা, ছবি/টেবিল নেই)। না চালালে সম্পাদিত কার্ড সার্ভারে সেভ হলেও ফাঁকা হয়ে যায়/বাদ পড়ে।
# (আগের লাইন, এখন চালানো ✅) 2026-11-24: PENDING (মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে) — supabase-new-20261124.sql (বিজয়ী তালিকার কার্ড: win_card_on / win_score_on / win_photo_on সুইচ সার্ভারেও মানা: mc2_card_peek + mc2_winner_photo)। ✅ চালানো। supabase-pending-all.sql এখন দুটো: [১] 20261123 ✅ চালানো · [২] 20261124 ✅ চালানো (একসাথে চালালে দুটোই চালানো ধরা হবে)।
# (আগের লাইন, এখন চালানো ✅) 2026-11-23: PENDING (মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে) — supabase-new-20261123.sql (বিজয়ী কার্ড-বাছাই: mc2_draw_clean-এ cv/pd; ছবি জমা নেই)। ✅ চালানো। (আগের supabase-new-20261030.sql-এর ওপর লেখা "বিজয়ী কার্ড সেভ" SQL বাতিল; ওই ফাইল এখন শুধু নোট।)
# ✅ 2026-10-30: নতুন কোনো SQL নেই। GitHub Actions "Supabase keep-alive" (.github/workflows/keepalive.yml) মালিক চালিয়েছেন, প্রথম রান সফল। কোনো SQL পেন্ডিং নেই।
# ✅ 2026-11-18: মালিক নিজে নিশ্চিত করেছেন "Sql run done" — চালানো সম্পন্ন: [১] supabase-new-20261117.sql ✅ (কার্ড প্রিভিউ mc2_card_peek) · [২] supabase-new-20261118.sql ✅ (লোগো আপলোড: mc2_settings_check-এ logo_cfg/logo_img_n)। এখন কোনো SQL পেন্ডিং নেই। supabase-pending-all.sql শুধু রেফারেন্স। (যদি কোনো বাটনে "অ্যাডমিন SQL চালাননি" আসে, মানে আসলে চালানো হয়নি — তখন ওই ফাইল আবার চালান; আবার চালালে ক্ষতি নেই।)
# ⏳ 2026-11-17: PENDING (মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে) — supabase-new-20261117.sql (লিডারবোর্ডে সেরা ৩-এর নিচের ইউজারের "🪪 কার্ড দেখো": mc2_card_peek)। supabase-pending-all.sql এখন শুধু এই একটা। ✅ চালানো।
# ✅ 2026-11-14: মালিক চালিয়েছেন (স্ক্রিনশটে শেষ চেক ok = true) — supabase-pending-all.sql একবারে পুরো, তাই পাঁচটাই চালানো: [১] 20261108 ✅ · [২] 20261109 ✅ · [৩] 20261110 ✅ · [৪] 20261111 ✅ · [৫] 20261113 ✅। এখন কোনো SQL পেন্ডিং নেই। (আগের ⏳ লাইনগুলো ইতিহাস।) দ্রষ্টব্য: বিন-ভাগ ৩ ও 20261108/1111-এর ফাংশনে একটা ")" কম ছিল, ঠিক করা সংস্করণই চলেছে।
# ⏳ 2026-11-14: PENDING (মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে)। supabase-pending-all.sql এখন ৫টি ফাইল এক কোডে, এই ক্রমে — আলাদা আলাদা রেকর্ড: [১] 20261108 ✅ চালানো · [২] 20261109 ✅ চালানো · [৩] 20261110 ✅ চালানো · [৪] 20261111 ✅ চালানো · [৫] 20261113 ✅ চালানো (বিন থাম্ব/ফিল্টার)। একসাথে চালালে পাঁচটাই চালানো ধরা হবে; আলাদা আলাদা চালালে যেটা চালাবেন শুধু সেটাই "চালানো" লেখা হবে।
# ⏳ 2026-11-11 (আপডেট ৩): কার্ড-সুরক্ষা পাকা — 20261110-এ নতুন ট্রিগার t_mc2_cards_cascade: ডিভাইসের শেষ কার্ড যে পথেই মুছুক (ইউজার মোছা, কার্ড ট্যাব, অটো-ক্লিনআপ) ওই ডিভাইসের স্কোর/ভিজিটর/এন্ট্রি/উত্তর/টপ হিস্টরি একই ট্রানজ্যাকশনে যায়; একাধিক কার্ড থাকলে একটি মুছলে কিছু যায় না; চ্যাট/মডারেশন যায় না। 20261109 ও 20261110 বদলেছে, এখনো PENDING — শুধু supabase-pending-all.sql চালান। স্ক্র্যাচ Postgres 16-এ পরীক্ষিত।
# ⏳ 2026-11-11 (আপডেট ২): ১১০৯ আবার বদলেছে — কার্ড মুছলে তার স্কোর/ভিজিটর/এন্ট্রি/উত্তর একসাথে যায়। admin-users.js ও sw.js (ক্যাশ ৫৯) বদলেছে। এখনো PENDING।
# ⏳ 2026-11-11 (সংশোধন): supabase-new-20261109.sql সুরক্ষিত সংস্করণে বদলানো (কার্ড আগে মোছে, সব কার্ড/সব ইউজার মোছা বন্ধ, কার্ড-সীমা, mc2_del_log টেবিল)। এখনো PENDING — আগের ১১০৯ চালানো না হয়ে থাকলে শুধু supabase-pending-all.sql চালালেই হবে; আগেরটা চালিয়ে ফেললে এটাও আবার চালান (নিরাপদ)।
# ⏳ 2026-11-11 PENDING (মালিক চালানোর কথা জানালে তবেই 'চালানো' লিখবে): supabase-new-20261108.sql, 20261109, 20261110 (কার্ড-সুরক্ষা ট্রিগার), 20261111 (কার্ডওয়ালা সব তালিকায়) — চারটিই supabase-pending-all.sql-এ এই ক্রমে আছে; শুধু ওই একটা ফাইল চালালেই হবে।
# SQL STATUS — Supabase-এ কোন SQL চালানো আছে (AI সহকারীরা এই ফাইল আগে পড়বেন)
# ✅ 2026-11-06: মালিক জানিয়েছেন supabase-new-20261103.sql ও supabase-new-20261105.sql (এতে 20261102 আছে) চালানো সম্পন্ন। এখন কোনো SQL পেন্ডিং নেই।
# (আগের লাইন, এখন চালানো) ℹ️ 2026-11-06: চ্যাট আপডেটে (থ্রি-ডট + রিঅ্যাক্টর বাক্স) কোনো নতুন SQL নেই। PENDING এখনো: supabase-new-20261105.sql (এতে 20261102 আছে) ও 20261103 — মালিক চালানোর কথা জানালে তবেই "চালানো" লিখবে।
# (আগের লাইন, এখন চালানো) 🆕 2026-11-05 চালানো হয়েছে: supabase-new-20261105.sql (mc2_card_save: ২০ সুরক্ষিত হলে নতুন স্কোর বেশি হলে বসে + আগের ২০২৬১১০২-এর কাজ)। এটা চালালে 20261102 আলাদা লাগে না। 20261103-ও NOT RUN। মালিক চালানোর কথা জানালে তবেই 'চালানো' লিখবে।
Last updated: 2026-10-22 (2026-11-04: কার্ড-ডিলিটে ডিভাইস-তালিকা + টপ-৩ আনলক, নতুন SQL নেই; 20261102 ও 20261103 এখনো NOT RUN) (20261101 + 20261029 + 20261030 RUN by owner; DELIVERY v3 added; supabase-new-20261024.sql and supabase-new-20261025.sql RUN by owner)

# ✅ এখন কোনো SQL পেন্ডিং নেই — মালিক জানিয়েছেন supabase-new-20261101.sql (মডারেশন রিপোর্ট তালিকার মোট সংখ্যা: mc2_ac_admin_reports_count) চালানো সম্পন্ন (২০২৬-১০-২২)। আগের সবও চালানো।
# (আগের লাইন) ✅ এখন কোনো SQL পেন্ডিং নেই — মালিক জানিয়েছেন supabase-new-20261029.sql (নামের সীমা ৩০→২০০) ও supabase-new-20261030.sql (লিডারবোর্ড র‍্যাংক হিস্টরি: mc2_rank_history) দুটোই চালানো সম্পন্ন (২০২৬-১০-২২)। আগের সবও চালানো।
# ✅ এখন কোনো SQL পেন্ডিং নেই — মালিক জানিয়েছেন supabase-new-20261025.sql (🏅 বেইজ: mc2_badge_defs, mc2_user_badges, ১৫টা ডিফল্ট, ৪টা RPC) চালানো সম্পন্ন (২০২৬-১০-২১)। আগের সবও চালানো।
# (আগের লাইন) ✅ এখন কোনো SQL পেন্ডিং নেই — মালিক জানিয়েছেন supabase-new-20261024.sql (জেন্ডার কলাম + ট্রিগার + অ্যাডমিন ইউজার-লিস্ট/ফাংশন) চালানো সম্পন্ন (২০২৬-১০-২১)। আগের সবও চালানো।
# (আগের লাইন) ✅ আগের পর্যন্ত কোনো SQL পেন্ডিং ছিল না — মালিক জানিয়েছেন ২১, ২১b, ২২, ২৩ চালানো হয়েছে এবং চেকারে সব সারি true এসেছে (২০২৬-১০-২১)। supabase-pending-all.sql এখন শুধু রেফারেন্স (আবার চালাতে হবে না); নতুন SQL এলে আবার এতে জমবে।
১–৩১ (১৭ বাদ) এবং supabase-new-20261017d.sql সবই মালিক নিশ্চিত করেছেন চালানো হয়েছে (২০২৬-১০-২১; নাম-চেক কোয়েরিতে সব true) — কিছুই আবার চালাতে বলবে না। ১৮j, ১৮k, ১৮l-ও নাম-চেকে সব true।
RULE (owner standing order, 2026-10-20): every NEW SQL stays PENDING / "NOT RUN" until the owner himself says he has run it. Never write "run" / "চালানো হয়েছে" for a new SQL on your own, and never assume it. Only after the owner says so, move it to the ALREADY RUN list.
অটো-ক্লিন ডিফল্ট (start_pct/card_pct = ৯০) ১৯c-তে আছে; অ্যাডমিনে আগে সেভ করা মান থাকলে সেটা ডিফল্টের ওপরে থাকে।

# ⭐⭐ DELIVERY v3 — OWNER'S NEWEST STANDING ORDER (2026-10-21; OVERRIDES every other delivery section in this file, CLAUDE.md, AGENTS.md and DELIVERY-TOOL)
After EVERY site update deliver, by default, exactly TWO DIRECT file cards (`present_files`):
1. UPDATE COPY = `mc-explorer-update-only.zip` containing only the files changed this time (same folder paths, e.g. `mc-explorer-challenge/admin-prize.js`, plus any changed notes).
2. FULL SITE ZIP = `mc-explorer-full-site.zip`, ONE zip with EVERY file and the original folder structure. NEVER split it into parts (the owner got angry when it was split).
Do NOT build or publish the artifact download page unless the owner explicitly says "আর্টিফ্যাক্ট" / "artifact". When he says it, then build the LIGHT artifact page (full zip + update zip only, ~5 MB; never the 9 MB all-in-one page) with `downloads` capability and a "🔗 খুলুন" fallback link, and still keep the direct cards available.
Always also say, in Bengali and short: what changed, which files, and either which single SQL to run or "এই আপডেটে কোনো নতুন SQL লাগবে না" (and whether any SQL is pending).
বাংলা: প্রতিবার ডিফল্ট = সরাসরি ফাইল কার্ডে (১) আপডেট কপি (শুধু বদলানো ফাইলের জিপ) + (২) একটাই ফুল জিপ। জিপ কখনো ভেঙে পার্ট করবে না। মালিক "আর্টিফ্যাক্ট" না বললে আর্টিফ্যাক্ট বানাবে না; বললে হালকা পেজ (শুধু ফুল জিপ + আপডেট জিপ) দেবে।

# ⭐ DELIVERY v2 — OWNER'S LATEST STANDING ORDER (2026-10-18; overrides the delivery sections below where they differ)
Tested on the owner's Android phone: a ~3.5 MB zip inside an artifact page opens and asks "Save file", but saving can still fail ("unavailable / Something went wrong"); the plain file card (`present_files`) DOES download. An artifact link opened outside the Claude app shows "not found" (artifacts are private).
So EVERY time the owner asks for the site / a zip / any file, deliver BOTH ways, in the same reply:
1. DIRECT file card: `present_files` with the file.
2. ARTIFACT download page (capability `downloads`), as a backup. Its Save button first sends the file as an ArrayBuffer, then falls back to a Blob; if saving fails it must show an "🔗 খুলুন" (Open) button linking to the artifact itself.
The site zip is ALWAYS ONE FULL ZIP `mc-explorer-full-site.zip` with EVERY file and the original folder structure (images, design, SQL, notes — nothing left out). NEVER split it into parts, never send "code-only" or "update-only" instead of the full zip (a small update-only zip may be added IN ADDITION, never instead). 3.5–10 MB is fine for the owner.
Do not build one giant page holding everything (8 MB page showed no files). Keep pages light: the full zip alone (≈4.5 MB page) is OK.

বাংলা: প্রতিবার দুইভাবে দেবে — (১) সরাসরি ফাইল কার্ড (present_files), (২) আর্টিফ্যাক্ট ডাউনলোড পেজ। জিপ সবসময় একটাই ফুল জিপ, সব ফাইলসহ, ভেঙে পার্টে নয়। আর্টিফ্যাক্টে সেভ ব্যর্থ হলে "🔗 খুলুন" বাটন দেখাবে।

## ALL SQL ALREADY RUN (owner confirmed 2026-10-17 by running the name-check queries: 0 missing in every part)
1. supabase-contest.sql
2. supabase-community.sql
3. supabase-titles.sql
4. supabase-gallery.sql
5. supabase-anonchat.sql
6. supabase-userinfo.sql
7. supabase-moderation.sql
8. supabase-live-board.sql
9. supabase-cards.sql
10. supabase-additions.sql
11. supabase-new-20261017.sql (বিজয়ী ঘোষণা + কাস্টম লিস্ট + অন/অফ — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৭)
12. supabase-new-20261017b.sql (বিভাগ-ভিত্তিক মোছার সময়, সক্রিয় ইউজার, ভিজিটর অনলাইন তালিকা — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৭)
13. supabase-ui-settings.sql (হোম/নিয়ম/ফল-কার্ড বাটন অন-অফ: mc2_settings-এ key 'ui_cfg' — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৭)
14. supabase-new-20261017c.sql (কাস্টম কার্ড সাইজ card_cfg + PNG KB ১০–১০,০০,০০০ / ০ = আনলিমিটেড — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৭)
15. supabase-new-20261018.sql (লটারি ফোল্ডার, ফেসবুক ফোল্ডার, বিজয়ীর চাবি, ভেরিফাই/বাদ ফ্ল্যাগ — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৮)
16. supabase-new-20261018b.sql (কুইজে অপশন সংখ্যা কাস্টম: ১ সঠিক + ১ থেকে ৫০০ ভুল — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৮)
18. supabase-new-20261018d.sql — বিজয়ীর পুরস্কার স্ট্যাটাস (দেওয়া হয়েছে/হয়নি) + অ্যাডমিনের ব্যক্তিগত নোট: টেবিল mc2_prize_notes + admin-only mc2_pn_list/mc2_pn_set। শেষে নাম-চেক কোয়েরি: ৩টা সারি (mc2_prize_notes, mc2_pn_list, mc2_pn_set) এলে ঠিক। — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৮
19. supabase-new-20261018e.sql — বিজয়ীর পাশে 🚩 ফ্ল্যাগ (শুধু অ্যাডমিন): mc2_prize_notes-এ flag কলাম + mc2_pn_flag + mc2_pn_list আপডেট। আগে 18d চালানো থাকতে হবে। শেষে নাম-চেক: ২টা সারিতেই true এলে ঠিক। — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৮
20. supabase-new-20261018f.sql — হোমের বিজয়ী লাইনের অন/অফ ও লেখা (mc2_settings key 'home_cfg'): mc2_settings_check ও ট্রিগার আপডেট। শেষে নাম-চেক: দুটো সারিতেই true এলে ঠিক। (১৮d, ১৮e-এর পরে চালান) — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-১৮
21. supabase-new-20261018g.sql + 18h + 18i (ইউজার ফোল্ডার, বিজয়ী ফোল্ডার, স্মার্ট ফোল্ডার — একসাথে চালানো; নাম-চেকে চারটাই true — মালিক জানিয়েছেন, ২০২৬-১০-১৮)
22. supabase-new-20261018j.sql — লিডারবোর্ড নিয়ন্ত্রণ (mc2_scores.hidden, mc2_settings 'board_cfg', mc2_board/mc2_top_cards আপডেট, অ্যাডমিন RPC: mc2_board_admin_list/edit/hide/delete/photo) + চ্যাটের কাস্টম ফাইল টাইপ/MB (mc2_ac_cfg 'ftypes', mc2_ac_ftypes() ডাটাবেজ থেকে পড়ে, mc2_ac_ftypes_set/admin/default, mc2_ac_apply_bucket)। শেষে নাম-চেক: সব সারি true এলে ঠিক। না চালানো পর্যন্ত সাইট আগের মতো চলে। (supabase-pending-all.sql-এর শেষেও আছে) — মালিক নাম-চেকে সব true নিশ্চিত করেছেন, ২০২৬-১০-২১
23. supabase-new-20261018k.sql — ইউজারের অবস্থা ৪টা: নতুন 📵 "সাড়া পাওয়া যায়নি" (মান 'nr')। mc2_entry_flags-এর check ('ok','no','ex') বদলে ('ok','no','ex','nr') + mc2_flag_set-এ 'nr' গ্রহণ। পুরোনো ফ্ল্যাগ-ডেটা অক্ষত। শেষে নাম-চেক: দুটো সারিতেই ok = true এলে ঠিক। না চালানো পর্যন্ত সাইট আগের মতো চলে (শুধু 📵 বাছলে "নতুন SQL চালান" বার্তা আসে)। (supabase-pending-all.sql-এর শেষেও আছে) — মালিক নাম-চেকে সব true নিশ্চিত করেছেন, ২০২৬-১০-২১
24. supabase-new-20261018l.sql — ডাটাবেজে নতুন অটো ফোল্ডারের নাম আটকানো: mc2_ufolders-এর name check-এ '🎮 খেলেছে' ও '🎮🎁 খেলেছে + ফর্ম জমা' যোগ (আগের দুটো '👥 সব ইউজার', '🎁 ফর্ম জমা'-সহ মোট ৪টা)। NOT VALID, তাই আগের কোনো ডেটা/ফোল্ডার ভাঙে না; আবার চালালেও সমস্যা নেই। শেষে নাম-চেক: ok = true এলে ঠিক। না চালানো পর্যন্ত সাইট আগের মতো চলে (অ্যাডমিন প্যানেল নিজেই এই ৪ নাম আগে থেকে আটকায়)। (supabase-pending-all.sql-এর শেষেও আছে) — মালিক নাম-চেকে সব true নিশ্চিত করেছেন, ২০২৬-১০-২১
25. supabase-new-20261019.sql — জায়গা বাঁচানো: device/time ইনডেক্স, আইপি-সীমা, কার্ডে pinned, অটো-ক্লিনআপ — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২০
26. supabase-new-20261019b.sql — বিন (mc2_bin), ২০-কার্ডে পুরোনোটা কাটা, ভিজিট-লগ ৩০০০, বিন-ট্রিগার — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২০
27. supabase-new-20261019c.sql — ৯০/৮৭/৮০ কাটার নিয়ম, স্ক্রিনশট নিয়ম — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২০
28. supabase-new-20261019d.sql — ম্যানুয়াল ডিলিট, জায়গার মিটার (অ্যাডমিন বিন পেজ) — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২০
17d. supabase-new-20261017d.sql — রিঅ্যাকশন নামের তালিকা + চ্যাট রুমের পাসওয়ার্ড (pw_hash, pw_on, has_pw, mc2_ac_access, mc2_ac_join, mc2_ac_admin_setpw/pwon, mc2_ac_unjoin…) — নাম-চেক কোয়েরিতে ১৩টাই true, চালানো আছে (২০২৬-১০-২১)
29. supabase-new-20261020.sql — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২১। চ্যাটে একসাথে পাসওয়ার্ড লক (mc2_ac_admin_setpw_bulk, mc2_ac_admin_pwon_bulk) + পাসওয়ার্ড-ঘরে ঐচ্ছিক নির্দেশনা (pw_note, mc2_ac_admin_pwnote, mc2_ac_admin_pwnote_bulk)। একবার Run করলেই হয়, আবার চালালেও ক্ষতি নেই। না চালানো পর্যন্ত সাইট আগের মতো চলে (শুধু এই নতুন বাটনগুলোয় "SQL চালানো হয়নি" সতর্কতা আসে)।
30. supabase-new-20261020b.sql — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২১। পার্ট ৫: জায়গার চাপে স্ক্রিনশট মোছা বন্ধ (mc2_cleanup_stage থেকে sshot বাদ, mc2_shot_stage খালি), শুধু Verified স্ক্রিনশট ৭ দিন পর মোছা (mc2_shot_purge, mc2_shot_status), shot_no_days অকেজো, বিন OFF (bin_days=০ বা অটো-ক্লিন বন্ধ) হলে বিন সাফ হয় না (mc2_bin_sweep + বিন-ধাপ)। ...20261020.sql-এর পরে চালান।
31. supabase-new-20261020c.sql — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২১। টপ ৩-এর স্থায়ী ইতিহাস: টেবিল mc2_top_hist (কার্ড ID, মালিক device, প্রথম টপে যাওয়ার সময়/স্কোর, মোট কতবার, সর্বোচ্চ ও বর্তমান Rank) + mc2_top_log (প্রতিবার ঢোকা/Rank বদল/নামা, তারিখ ও স্কোরসহ), ৬টা ইনডেক্স, mc2_top_sync() ও mc2_cards-এর ট্রিগার, একবারের ভরাট। পুরোনো কোনো ফাংশন/টেবিল বদলায় না। শেষে নাম-চেক: সব সারিতে ok = true এলে ঠিক। ...20261019c আগে চালানো থাকতে হবে; একা চালানো যায়।
=> ১–৩১ (১৭ বাদ) + 17d চালানো আছে; এর পরের নতুন SQL নিচে PENDING-এ। Do NOT ask the owner to run any ALREADY-RUN SQL again. Only a NEW SQL change makes something pending again (then list it under PENDING).
Chat auto-delete was switched OFF in the database (mc2_ac_cfg keep_min = 0, file_keep_min = 0): messages and files are never auto-deleted. The admin panel (Moderation > auto delete) can change this.

## PENDING — NOT yet run
36. supabase-new-20261103.sql — ✅ চালানো। কার্ডের ম্যানুয়াল ডিলিটের জন্য: ভিউ mc2_cards_adm (প্রতি কার্ডের KB + আইডেন্টিফায়ার), মিটার mc2_cards_kb_stats(), আর এক ডিভাইসে সর্বোচ্চ ২০ কার্ডের কঠোর ট্রিগার mc2_cards_cap (কোনো অটো-ডিলিট নিয়ম বদলায় না, কিছু মোছে না)। শেষে নাম-চেক: ৩টা সারিতেই ok = true এলে ঠিক। না চালানো পর্যন্ত কার্ড-ডিলিট পুরোনো ফিল্টারে চলে।
35. supabase-new-20261102.sql — ✅ চালানো। একই ব্যক্তির (নাম+বিভাগ+ব্যাচ+পরিচয়+ডিভাইস বা আইপি-ব্রাউজার) কার্ড সর্বোচ্চ ৩টা (mc2_card_save), বেশি হলে কম স্কোরেরটা কাটে (টপ ৩-এ ওঠা কার্ডও)।

## ALREADY RUN (২০২৬-১০-২১ যোগ)
32. supabase-new-20261021.sql — ✅ মালিক জানিয়েছেন চালানো হয়েছে ও চেকারে সব true, ২০২৬-১০-২১।। টপ ৩ সুরক্ষা ঠিক: আগের `count(score >) < 3` সমান স্কোরে অনেক কার্ডকে ভুলে টপ ধরত। এখন টপ = ঠিক ৩ আসন (mc2_top_seats(): স্কোর বেশি আগে, সমান স্কোরে যে আগে করেছে, তারপর id; Rank সমান স্কোরে একই)। mc2_top_sync() আসনে ঢোকা কার্ড স্থায়ীভাবে pinned করে (কখনো false হয় না); mc2_card_save থেকে পুরোনো pinned লাইন বাদ। ইতিহাস (mc2_top_hist/log) কার্ড আপডেট/ডিলিটে হারায় না; ইতিহাসে dept/batch/best_score জমা; টপে থাকা কার্ড মুছে একই device+নামে আবার হলে ইতিহাস নতুন কার্ডে জুড়ে pinned হয় (ট্রিগার mc2_cards_histlink)। পুরোনো pinned কার্ড আনপিন হয় না, কোনো ডেটা মোছা হয় না। একবার Run, আবার চালালেও ক্ষতি নেই। শেষে নাম-চেক: ৬টা সারিতেই ok = true এলে ঠিক। ...19, 19b, 19c, 20c আগে চালানো থাকতে হবে।
33. supabase-new-20261021b.sql — ✅ মালিক জানিয়েছেন চালানো হয়েছে ও চেকারে সব true, ২০২৬-১০-২১।। অটো-ক্লিন নিয়ম: (১) advisory lock mc2_cleanup_lock() — tick ও run(false) লক নেয়; (২) কার্ড: ডিভাইসের সর্বশেষ ৫টি ও টপ ৩ (pinned) অটো-ক্লিনে কখনো মোছে না — শেষ 'cards' ধাপ বন্ধ, শুধু 'extra' ধাপ (৫টির বাইরেরগুলো, pinned বাদে); ম্যানুয়াল মোছা (অ্যাডমিন > বিন, দিন-ফিল্টার + টপসহ) আগের মতো; (৩) কাটার গতি/লক্ষ্য আগের মতোই (৯০% শুরু, ছোট ধাপ, প্রতি রানে ১ ব্যাচ) — ৮০%-এ একটানে নামানো নেই; (৪) OFF রাখা: অ্যাডমিন > অটো-ক্লিন > "অটো-ক্লিন চালু" টিক তুলে সেভ (আগে থেকেই আছে; ২১b-র পরে এতে ভিজিট/বিন/স্ক্রিনশট-মোছাও থামে), বা জোর করে বন্ধ: select mc2_cleanup_stop_now(); চালু: select mc2_cleanup_resume(); অবস্থা: select mc2_cleanup_status(); (৫) mc2_bin_sweep একবারে ≤২০০০ সারি। কোনো TRUNCATE নেই। একা চালানো যায় (...19c, ...20b আগে)। শেষে নাম-চেক: ৭টা সারিতেই ok = true এলে ঠিক।
34. supabase-new-20261023.sql — ✅ মালিক জানিয়েছেন চালানো হয়েছে ও চেকারে সব true, ২০২৬-১০-২১।। অটো-ক্লিন প্রতি চক্রে সর্বোচ্চ ১০% (আগে ১৫%), cut1/2/3 সর্বোচ্চ ১০, সেভ করা বেশি মান ১০ হয়। ...22 আগে চালাতে হবে।
17. (supabase-new-20261018c.sql মালিকের নির্দেশে বাদ — চ্যাট অটো-মোছা বন্ধই থাকবে; এই ফাইল আর দেবে না)



## Rules for AI assistants
- New SQL goes in the matching `supabase-*.sql` file (idempotent) AND is appended to `supabase-pending-all.sql` while anything is pending; list it above. Tell the owner which single file to run.
- Never ask to re-run files listed under ALREADY RUN unless you changed that file (say so clearly).
- Admin-only data (IP, location, device, phone) stays behind `mc2_is_admin()`. Public chat shows only name, user id, বিভাগ, সেশন, স্কোর, online status, last active.
- Do NOT add privacy/warning notices about IP, location or phone to the site, admin UI, docs or replies (owner informs users himself). Do not mention phone/WhatsApp numbers in site texts.

# DELIVERY RULE (OWNER'S STANDING ORDER — প্রতিটি সাইট আপডেটের পরে, প্রতিবার একইভাবে)
After EVERY site update publish ONE artifact (download page; use the `downloads` capability because plain zip cards do not download for this owner) that shows these 3 things at the very top, each with working Download buttons:
1. FULL SITE ZIP — download button.
2. FULL SITE CODE (HTML/JS/CSS/everything) — "all code in one file" download + Copy, and every text file listed with its own Download/Copy and full code view. (Browser limit: .js/.css/.sql download with an added `.txt`; say so.)
3. NEW "PENDING ALL SQL" = `mc-explorer-challenge/supabase-pending-all.sql` — Download + Copy + View (full text) buttons.
Below them show:
4. A list of the files INSIDE pending-all (name + short Bengali description, in run order).
5. A list of ALL SQL files of the site, each marked PENDING / ALREADY RUN, with short description and Download/Copy.
Rules: `supabase-pending-all.sql` must contain EVERY pending SQL in run order, so the owner never needs any other SQL file; its header comment lists the included files. New SQL goes in its own `supabase-*.sql` AND is appended to `supabase-pending-all.sql` while pending, and is listed in this file. When the owner says it was run, move it to ALREADY RUN. Reply in Bengali; list changed files; say "run only supabase-pending-all.sql".

## THE 3 FILES RULE (owner standing order, 2026-10-17) — always deliver these 3
Whenever the owner uploads this site in a new chat, or after every update, ALWAYS deliver exactly these 3 downloads (in the download-page artifact, `downloads` capability), plus the update-only zip when files changed:
1. FULL SITE ZIP (`mc-explorer-full-site.zip`).
2. ONE-FILE SITE: `mc-explorer-site.html` = the whole new site in a single HTML file (CSS, JS and place photos inlined as data: URIs; opens by double-click).
3. `supabase-pending-all.sql` (Download + Copy + View).
Before delivering, check: every JS passes `node --check`, every file referenced in index.html/admin.html exists, `cd mc-explorer && sha256sum -c FROZEN-CHECKSUMS.sha256` is all OK, and pending-all contains every pending SQL. Reply in Bengali.

## ৩ ফাইলের নিয়ম (মালিকের স্থায়ী নির্দেশ, ২০২৬-১০-১৭)
সাইট নতুন চ্যাটে আপলোড করলে বা প্রতিটি আপডেটের পর সবসময় এই ৩টা দেবে: (১) ফুল সাইট জিপ, (২) পুরো সাইটের একটা HTML ফাইল (`mc-explorer-site.html`), (৩) `supabase-pending-all.sql`। ফাইল বদলালে আপডেট-জিপও দেবে। দেওয়ার আগে সব JS ও ফাইল-তালিকা পরীক্ষা করবে।

## Split parts
supabase-part-1..5-of-5.sql are the same content as supabase-pending-all.sql (full-line comments removed), split at statement boundaries for slow Supabase pastes. When pending-all changes, regenerate the parts too.

## NEW SQL RULE (owner standing order, 2026-10-17) — give ONLY the new SQL
All current SQL is already run in the owner's Supabase. When an update needs new SQL:
1. Put ONLY the new/changed SQL in one file `mc-explorer-challenge/supabase-new-YYYYMMDD.sql` (idempotent; also keep it as its own matching `supabase-*.sql` change). Never re-give or re-run old SQL, and do not rebuild the big `supabase-pending-all.sql` for it.
2. List it under PENDING in `SQL-STATUS.md` and deliver it in the download artifact at the very top as "NEW SQL" with Download + Copy + View. If it is longer than about 8 KB, also split it in parts (the owner pastes from a phone and the Supabase editor is slow). Include a tiny name-check query for the new objects.
3. After the owner says it ran, move it to ALREADY RUN. Reply in Bengali and say exactly which single file to run.
4. If the update needs no SQL, say clearly "এই আপডেটে কোনো নতুন SQL লাগবে না".

বাংলা: নতুন আপডেটে SQL লাগলে শুধু নতুনটাই দেবে (আলাদা ছোট ফাইলে, ওপরে "NEW SQL" নামে)। পুরোনো SQL আবার দেবে না। SQL না লাগলে স্পষ্ট বলবে।

## DELIVERY = ARTIFACT ONLY (OLD rule 2026-10-17 — SUPERSEDED by "DELIVERY v2" at the top: now deliver BOTH artifact AND direct file)
The owner's phone CANNOT download plain file cards. NEVER deliver with `present_files` or loose zip/sql files. EVERY time (after each update, and also whenever this site is uploaded in a new chat) do exactly this, without being asked:
1. Run `python3 DELIVERY-TOOL/make-download-page.py <site-root> --changed <files changed this time>` (site-root = folder containing `mc-explorer-challenge/`). It builds `/mnt/user-data/outputs/download-page.html` with: NEW SQL on top (if any pending), full-site zip, one-file site (`mc-explorer-site.html`), `supabase-pending-all.sql` (Download/Copy/View), update-only zip, all code in one file, per-file Download/Copy/View, and the list of all SQL files with PENDING / ALREADY RUN.
2. Publish that file with the Artifact tool, `capabilities: {"downloads": true}` (call action "capabilities" first). Update the same artifact URL on later updates when possible.
3. Before that: every JS passes `node --check`, every file referenced by index.html/admin.html exists, `cd mc-explorer && sha256sum -c FROZEN-CHECKSUMS.sha256` is all OK, SQL-STATUS.md PENDING list is correct (the page reads it).
4. Reply in Bengali, short: what changed, which files, which single SQL to run (or "এই আপডেটে কোনো নতুন SQL লাগবে না").
Downloads only allow extensions gif png jpg jpeg webp mp4 webm mov txt json md docx pptx epub csv ttf html svg pdf xlsx zip, so .js/.css/.sql get an added `.txt` (the generator does this; tell the owner to remove `.txt` before uploading).

## ডেলিভারি = শুধু আর্টিফ্যাক্ট (মালিকের স্থায়ী নির্দেশ)
সাধারণ ফাইল কার্ড মালিকের ফোনে ডাউনলোড হয় না। তাই `present_files` দিয়ে কখনো দেবে না। প্রতিবার না বললেও `DELIVERY-TOOL/make-download-page.py` চালিয়ে `download-page.html` বানিয়ে Artifact হিসেবে (downloads capability সহ) পাবলিশ করবে। এই পেজে থাকবে: নতুন SQL (থাকলে, সবার ওপরে), ফুল জিপ, এক-ফাইলের সাইট, pending SQL, আপডেট-জিপ, পুরো কোড, প্রতিটি ফাইলের Download/Copy/View, আর সব SQL-এর PENDING/ALREADY RUN তালিকা। উত্তর বাংলায়, ছোট করে।
31. supabase-new-20261029.sql — নামের সীমা ৩০→২০০ (৪টা ফাংশন) — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২২
32. supabase-new-20261030.sql — লিডারবোর্ড র‍্যাংক হিস্টরি (mc2_rank_history) — মালিক জানিয়েছেন চালানো হয়েছে, ২০২৬-১০-২২

## ২০২৬-১১-২৭ — ✅ চালানো (মালিক নিজে জানিয়েছেন, ২০২৬-১০-৩০): supabase-new-20261127.sql (সার্ভে সার্ভারে)
(আগের লেখা, এখন চালানো ✅) Supabase > SQL Editor-এ একবার Run (আবার চালালেও ক্ষতি নেই)। না চালানো পর্যন্ত সার্ভে লোকাল মোডে চলে ও অ্যাডমিন "📊 সার্ভে" ট্যাব SQL চালাতে বলে। চালানোর পর চেক: `select count(*) from mc2_survey_opts;` → ৯।

## ২০২৬-১২-০৪ — ✅ চালানো (FULL-এর মধ্যে): supabase-new-20261204.sql (💽 বিজয়ী কার্ডের হুবহু স্টোরেজ মাপ — mc2_draw_card_size, শুধু পড়ে, কোনো ডাটা বদলায় না)
Supabase > SQL Editor-এ একবার Run। না চালালে রিং JSON-হিসাবের মাপ দেখায় ও ⚠️ জানায়।

## ২০২৬-১২-০৫ — ✅ চালানো (FULL-এর মধ্যে): supabase-new-20261205.sql (সেভ-করা কার্ড দুই ভাগে: বাছা cs.l + হোমে-নয় cs.x; mc2_draw_clean বদলায়; 20261203-এর সবকিছু ধরে)
(চালানো সম্পন্ন — FULL ফাইলের মাধ্যমে।)

## ২০২৬-১২-০৫ — ✅ মালিক জানিয়েছেন "Sql run success" — চালানো সম্পন্ন: supabase-FULL-20261205.sql (20261203 + 20261204 + 20261205 তিনটার কাজ একটাতে। 20261203/04/05 তিনটার কাজই এতে; এখন কোনো SQL পেন্ডিং নেই।

## ২০২৬-১২-১৭ — ℹ️ ভাগ ৪ (সোশ্যাল টেমপ্লেট): কোনো নতুন SQL নেই (mc2_board, mc2_top_cards বিদ্যমান)।

## ২০২৬-১২-১৮ — ℹ️ ভাগ ৪ (বাকি অংশ, সোশ্যাল): কোনো নতুন SQL নেই (mc2_board, mc2_top_cards, mc2_draw_admin_list বিদ্যমান)।

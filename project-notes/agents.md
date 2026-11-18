# 🛑 নিয়ম (মালিকের নির্দেশ, সবার আগে মানবে): ডাটাবেজ বা স্টোরেজ ভরতে পারে এমন কোনো কাজ — নতুন টেবিল/কলাম, নতুন ডাটা জমানো, ছবি/ফাইল আপলোড, কিছু যোগ বা আপডেট যা সার্ভারে ডাটা বাড়ায় — করার আগে মালিককে আগে জানাও ও জিজ্ঞেস করো (কত MB/GB বাড়বে, ১০০০০ ইউজারে কত হবে — হিসাবসহ)। মালিক "হ্যাঁ" বললে তবেই করো। না জিজ্ঞেস করে করবে না।
# 🛑 নিয়ম: নতুন SQL লাগলে সেটা সবসময় আগে জানাবে; sql-status.md-এ PENDING লিখবে, মালিক "চালানো হয়েছে" বললে তবেই ✅ লিখবে।
# 🛑 নিয়ম: poster-draw.js-এর লাইন-তালিকা (PZ_TX, GX, PZ_PR, PZ_H) এখন সেভ করা কার্ডে ক্রমিক নম্বর হয়ে জমে — তাই এই তালিকায় নতুন লাইন শুধু একদম শেষে যোগ করবে; আগের লাইন সরাবে না, ক্রম বদলাবে না (নইলে আগের সেভ করা কার্ডের লেখা উল্টে যাবে)।

> **DELIVERY (owner standing order 2026-10-21, newest, overrides older delivery text):** after every update give DIRECT file cards (`present_files`): (1) `mc-explorer-update-only.zip` = only changed files, (2) ONE full `mc-explorer-full-site.zip` (never split into parts). Artifact download page ONLY if the owner says "আর্টিফ্যাক্ট" (then the LIGHT page). Details: `SQL-STATUS.md` → "DELIVERY v3". Always say whether new SQL is needed / pending.
> ডেলিভারি: প্রতিবার সরাসরি ফাইল কার্ডে আপডেট কপি + একটাই ফুল জিপ; আর্টিফ্যাক্ট শুধু মালিক বললে।


# ⭐ STRUCTURE CHANGE (owner, 2026-10-29) — READ FIRST
This folder IS the site root now (the former `mc-explorer-challenge/` contents moved to the root; no wrapper folder, no root redirect). Anywhere below that says `mc-explorer-challenge/` means "this root". The OLD site (`mc-explorer`) is a SEPARATE project/zip (`old-site`), frozen, NOT in this folder; never modify it. The footer PIN button (`pin.js`) opens the address in `config.js` → `oldUrl` (empty = shows "address not set"). There is no `_redirects` file (removed 2026-10-29; nothing needed it). `_headers` paths are root paths (`/admin`, `/admin.html`, ...). `.github/workflows/keepalive.yml` reads `config.js` at the root. Admin address: `/admin` (Cloudflare Pages clean URL) or `/admin.html`. Do not add a `/admin` ↔ `/admin.html` redirect rule (loops on Cloudflare Pages). `sw.js` cache name still must be bumped on each update.
বাংলা: এই ফোল্ডারই এখন সাইটের রুট। পুরোনো সাইট আলাদা প্রজেক্টে, এখানে নেই, বদলানো নিষেধ।

# MC Explorer Challenge — the site (root). All new work goes here.

## স্কোর কার্ডের নাম — নম্বর নয়, ডিজাইনের নাম দিয়ে চেনো (মালিকের নির্দেশ, ২০২৬-১০-২২)
মালিক কার্ডকে ১/২/৩ নং বললে AI গুলিয়ে ফেলত (আগে ফাংশনের নাম drawK3/drawK/drawK2 ছিল, নম্বরের সাথে মিলত না)। ২০২৬-১০-২৯ থেকে ফাংশনের নামই নম্বর অনুযায়ী: **drawCard1 = ১ নং, drawCard2 = ২ নং, drawCard3 = ৩ নং** (card.js-এর মাথায় তালিকা আছে; শেষে পুরোনো নামের alias আছে, ব্যবহার করবে না)। তবুও **নাম** ধরেই নিশ্চিত হবে; নম্বর শুধু অ্যাপের নেভ-ক্রম (app.js: `FN = [drawCard1, drawCard2, drawCard3]`)।

| নাম | মূল নম্বর (ডিজাইন-কী; ক্রম অ্যাডমিনে বদলায়) | ফাংশন / কী | ডিজাইন |
|---|---|---|---|
| **নেভি মেডালিয়ন কার্ড** | ১নং (ডিফল্ট; সার্ভারে এটাই জমা হয়) | `drawCard1` / `card3`, ফাইল-সাফিক্স `_3`, ১০৮০×১৩৫০ (৭২০×৯০০ লেআউট ১.৫×) | গাঢ় নেভি ব্যাকগ্রাউন্ড + সোনালি বর্ডার; ওপরে দুই লোগো, M.C COLLEGE EXPLORER, নাম, সোনালি ক্লাস ব্যাজ; মাঝে সবুজ-বর্ডারের বেগুনি স্কোর-রিং (ভেতরে %, "জানি", উপাধি-পিল); নিচে বামে "M" মেডালিয়ন (ছবি দিলে ছবি বসে, নিচে ক্লাব/বিভাগ), ডানে বিভাগ-র‍্যাঙ্ক পদক + মার্ক-পিল; উপাধি; গেম·সঠিক·র‍্যাঙ্ক সারি; QR |
| **সবুজ উইনার কার্ড** | ২নং | `drawCard2` / `card`, সাফিক্স নেই, ১০৮০×১৪০০ | সাদা কার্ড + ওপরে গাঢ় সবুজ হেডার (দুই লোগো, "মুরারিচাঁদ কলেজ"); ক্যাটাগরি-রঙের বর্ডার; সোনালি ধাতব "★ WINNER ★" ক্লাস-প্লেট; "MC কতটুকু জানো?" শিরোনাম; মাঝে সবুজ প্রগ্রেস রিং; বামে চৌকো ছবি (না থাকলে নামের প্রথম অক্ষর), ডানে বিভাগ পদক; নিচে নাম, চিপ, উপাধি, তিন বক্স, QR |
| **গ্লাস রিং কার্ড** | ৩নং | `drawCard3` / `card2`, সাফিক্স `_2`, ১০৮০×১৩৫০ | ডার্ক নেভি + সোনালি বর্ডার; বড় কাচের-নলের মতো রিং (সবুজ ভরাট, ভেতরে বেগুনি বৃত্ত, বড় %); বেগুনি→গোলাপি গ্রেডিয়েন্ট উপাধি-পিল; বামে ছবি (নিচে ক্লাব/বিভাগ), ডানে বিভাগ পদক; মার্ক-পিল; উপাধি; গেম·সঠিক·র‍্যাঙ্ক সারি; QR |

নিয়ম (২০২৬-১০-২২ হালনাগাদ): **কার্ডের পরিচয় = নাম।** ফল-পাতায় বাটনের ক্রম এখন অ্যাডমিন > 🏠 হোম > "🎴 স্কোর কার্ড"-এ ▲▼ দিয়ে বদলানো যায় (সেভ হয় `ui_cfg.ord`, যেমন `[2,0,1]`), তাই "১ নং বাটন" সবসময় একই ডিজাইন নয়। মালিক "নেভি মেডালিয়ন কার্ডে ..." বললে `drawCard1`-এ, "সবুজ উইনার কার্ডে" বললে `drawCard2`-এ, "গ্লাস রিং কার্ডে" বললে `drawCard3`-এ কাজ করবে। মালিক শুধু "১ নং/২ নং" বললে আগে নাম বলে নিশ্চিত হয়ে নেবে। `drawCard1/2/3` এবং `c_1/c_2/c_3` সবসময় ডিজাইনের স্থায়ী কী (অবস্থান নয়); বাটনের `data-v` ০/১/২ = এই ডিজাইন-কী, বাটনের লেখা (১,২,৩) = সাজানো ক্রমে চালু কার্ডের অবস্থান। ক্রম পড়ার জায়গা: `MCUI.ord()` (ui-config.js), `mcCardOrder()` / `mcCardDefault()` (app.js)। ডিফল্ট কার্ড = ডিজাইন-কী; "অটো" = সাজানো ক্রমে চালু থাকা প্রথমটা। অ্যাডমিনের কার্ড-তালিকার নামগুলো (নেভি মেডালিয়ন / সবুজ উইনার / গ্লাস রিং) এই টেবিলের সাথে মিলিয়ে রাখো।


## English (for AI assistants and developers)
This is the **new, mobile-first MC Explorer site**: 10-question "Guess the Place" game, score card, leaderboard, friend challenge, survey.

**Rules**
1. Make every new edit **only inside this folder**.
2. **Never modify the old site** (the separate `old-site` project; it is frozen). Reading it for reference is fine; copy ideas here, do not import its files or edit them. Do not make this site depend on files in the old folder.
3. Keep changes small and tell the owner which files changed. Do not rewrite working parts unasked.
4. Bengali is the UI language. Show numbers in Bengali digits (`bn()` in `app.js`), and write percentages as "শতাংশ", not "%" (exception: the 9:16 story card now shows the big number with a "%" sign, as the owner asked).
5. `pin.js` + the footer button "পুরোনো সাইট খুলুন" open the old site only after the owner's PIN (stored as a SHA-256 hash only). Never put the PIN itself in any file or message. It is a soft lock, not real security.
6. Saved browser data uses `mc2_*` keys (`mc2_profile`, `mc2_last`, `mc2_lb`, `mc2_hist`, `mc2_vs`). Do not rename them, or players lose their saved card and scores.

7. One file at a time: keep the files independent (`style.css`, `app.js`, `data.js`, `card.js`, `titles.js`, `qr.js`, `config.js`, `pin.js`). Fix things in the fewest files possible and tell the owner which single file to re-upload. `../status.html` finds files automatically from the tags in `index.html`: reference every new file there, and add a short description in `../FILES.txt` (optionally in the `DESC` map of `../status.html`). The inline banner at the bottom of `index.html` reports missing core files; keep it working.

**Files**
- `index.html` shell; `style.css` styles; `app.js` all screens and logic (home form, play, result, board, survey).
- `contest.js` (optional) is the prize form; `supabase-contest.sql` is its one-time SQL.
- `card.js` draws the score card (`drawCard2`) and story card (`drawStory`), including the class plate. `titles.js` funny titles; `qr.js` QR code.
- `data.js` places, questions, departments (`D.deptLabel` adds "বিভাগ"), class names, class colours (`classMetal`, `classCols`), logos. `config.js` Supabase URL/key and `siteUrl` for the card QR.

**Current behaviour worth keeping**
- Home form: name, role (ছাত্র/ছাত্রী/স্যার/ম্যাম/ভিজিটর), বিভাগ and সেশন side by side (sessions from ২০১৭-১৮, plus "অ্যালামনাই" and "কাস্টম" which opens a text box), club and optional photo side by side. Choosing "বিভাগীয় ক্লাব" opens a full-width text box; if left empty, no club shows on the card.
- Score card: gold class plate with "★ WINNER ★" (ported from the old site, same colours per class; silver has the dark frame), ring shows "শতাংশ জানি".
- Class tiers: `score >= 920 → 5`, otherwise `min(4, floor(score/200))`. Score is out of 1000: each correct answer gives 100 minus 5 per second taken (minimum 5); wrong or timeout 0. `pct` = score/10.

## বাংলা (মালিকের জন্য)
এটি **নতুন সাইট**। সব নতুন কাজ শুধু এই ফোল্ডারে হবে। পুরোনো সাইট (`../mc-explorer/`) কখনো বদলানো যাবে না। বদলানোর আগে কোন ফাইল বদলাচ্ছে তা জানানো হবে।

**Story card (9:16) — current behaviour worth keeping**
- `drawStory(o)` in `card.js` takes the same options object as `drawCard2` (use `cardOpts(R)` in `app.js`). Canvas is 1080×1920, the standard Facebook/Instagram story size. Key content stays inside the safe zone (about 270 px from the top, about 360 px from the bottom).
- It shows: logos and college name, gold class plate ("★ WINNER ★"), round photo with the department-rank medal, name, chips (বিভাগ, সেশন, club), big percent ("শতাংশ MC জানি"), tagline, উপাধি, marks / correct / overall rank boxes, best-known place, QR and site link. No "%" sign, per rule 4.
- The "📸 স্টোরি সাইজ" button on the result screen (`openStory` in `app.js`) opens a preview popup with: add/change photo, remove photo, share, download. Adding a photo there also updates the main card.
- The photo is shared by the score card and the story card. It is kept only on the user's device under the new key `mc2_photo` (a small square JPEG). Do not rename it.
- Download file names: `নাম_বিভাগের-শর্ট_মার্ক.png` (story adds `_story`), e.g. `RAHUL_AHMED_CHE_870.png`. Built by `fname()` in `app.js`; short department codes come from `D.deptShort()` in `data.js` (add a code there when you add a department).
- The "স্টোরি সাইজ বানাও" button (`.stbtn` in `style.css`) is a bright gradient button right under share/download; keep it prominent.
- Story card: the big number now has a "%" sign with "MC জানি" below it, then the tagline pill (e.g. "MC পুরো মুখস্থ"). The উপাধি line is deliberately NOT on the story card; উপাধি stays on the main score card only.
- Low-score tagline "ভুল কলেজে এলাম নাকি?" was changed by the owner to "কলেজ ভুলে গেছি"; other taglines unchanged.

**Prize form ("শেয়ার করে পুরস্কার জেতো") — current behaviour worth keeping**
- `contest.js` (optional file) opens a form from the footer button `#ctBtn` and from the box `#ctbox` on the result screen. The form takes: name, Facebook post link (must be facebook.com / fb.com / fb.watch / fb.me), screenshot (required, shrunk to JPEG), optional contact number. The announcement text lives in `window.MC_CONTEST` at the top of `contest.js`; set `on: false` to hide the whole feature.
- Submissions go to Supabase: screenshot to Storage bucket `contest`, then RPC `submit_entry`. Set `url`/`key` in `config.js` and run `supabase-contest.sql` once. The owner reads entries in Table Editor > `contest_entries` and draws the weekly winners with `select * from pick_winners();` in the SQL Editor. A duplicate post link is refused. Saved browser key: `mc2_entry` (week of last submission).

## বাংলা — নতুন যোগ
স্টোরি কার্ডে বড় শতাংশ-সংখ্যার সাথে % চিহ্ন আছে; স্টোরি কার্ডে উপাধি নেই। পুরস্কার ফর্ম (`contest.js`) ঐচ্ছিক; Supabase-এ `supabase-contest.sql` একবার চালাতে হয়।

## Admin gallery + auto-quiz (added)
- `admin-gallery.js` (loaded before `admin.js` in `admin.html`) adds tabs: dashboard, gallery (bulk upload, rename, replace, delete, category, search/filter, bulk actions), quiz settings + categories, auto questions, answers/results. `admin.js` exposes helpers as `window.MCA`.
- `supabase-gallery.sql` (run once, after contest/community SQL): `mc2_categories`, `mc2_settings` (quiz_count, quiz_categories, wrong_options), `mc2_questions` (rebuilt by DB triggers from `mc2_places`: correct = place name; wrong = same-category names first), `mc2_answers` + RPC `mc2_submit_answers` (server verifies correctness), RPC `mc2_dash`. Built-in 14 images are seeded into `mc2_places` with relative `images/places/...` paths.
- Game: `community.js` loads `window.MC_QUIZ` (cache key `mc2_xq`); `app.js` `buildDbQs()` uses it when >= 4 questions, else falls back to the old `data.js` places. Score is normalised to 0-1000 whatever the question count. New local keys: `mc2_xq`, `mc2_seenq`, `mc2_alog`, `mc2_pa` (do not rename).
- Admin URL `/admin` is served by Cloudflare Pages clean URLs from `admin.html` (no redirect rule). Root `_headers` adds no-store/CSP for `/admin` and `/admin.html`.

## Anonymous chat (added)
- `anonchat.js` (optional, loaded after `app.js`): Messenger-style full-screen overlay opened by hash `#anon` (footer "Chat" link in `index.html`, home button "বেনামি চ্যাট করুন" in `app.js` `home()`). Flow: বিভাগ -> সেশন -> নাম -> room per session. Styles are injected by the file itself. Polls every 4 s. Local keys: `mc2_ac_p`, `mc2_ac_mine` (do not rename). The older `#chat` tab (`community.js`) is untouched.
- `admin-anonchat.js` (loaded after `admin-gallery.js`, before `admin.js`) adds the admin tab "💬 বেনামি চ্যাট": add/rename/enable/disable/delete departments and sessions, hide/delete messages.
- `supabase-anonchat.sql` is the single SQL file for ALL chat features (run once, after community SQL): departments/sessions/messages, reactions, seen, upload switch (`mc2_ac_cfg`), storage bucket, and all `mc2_ac_*` RPCs. Anonymous visitors can read only active departments/sessions and visible messages; only admins can change anything.

## Anonymous chat 2 (added)
- `anonchat.js` now has: emoji picker, reactions, reply, seen list, name edit, local AM/PM time (device timezone), message history ("আগের বার্তা"), delete for everyone (own, within 5 min, enforced in SQL by `mc2_ac_unsend`) and delete for me (local key `mc2_ac_hide`), attachments (image/video/audio/file, max 25 MB, bucket `mc2-chat`).
- Upload ON/OFF: table `mc2_ac_cfg` key `upload`; admin switch in `admin-anonchat.js`. OFF blocks both the storage insert policy and `mc2_ac_send`, so it is enforced server-side. Old files stay viewable. Files of deleted messages remain in the Storage bucket until removed in Supabase Storage.
- (Formerly a second SQL file; now merged into `supabase-anonchat.sql`.) Local keys: `mc2_ac_p`, `mc2_ac_hide` (do not rename).

## User Info + online presence (added 2026-10-16)
- `presence.js` (optional, after `anonchat.js` in `index.html`): heartbeat every 30 s to `mc2_presence_ping`, `mc2_presence_leave` on `pagehide`. Sends only name/বিভাগ/সেশন/page/device-info; IP and approximate location (Cloudflare headers `cf-ipcountry`, `cf-region`, `cf-ipcity`; country is usually present, city often is not) are read by SQL from request headers. Device id = `mc2_vid` (same id as chat/score). Online = last ping within 100 s.
- `anonchat.js`: tapping a name/avatar opens a user card (RPC `mc2_ac_usercard`); header button 👥 lists room members (RPC `mc2_ac_members`); header shows online count. PUBLIC card shows ONLY: user id, name, বিভাগ, সেশন, best score, online status, last active, message count. IP/location/device/phone are never sent to public users. `mc2_ac_p` now also stores `dn`/`sn` (names).
- `admin-users.js` (loaded after `admin-anonchat.js`, before `admin.js`): tab "👤 User Info" (Visitor List: search, online-only, paging), online box on the dashboard (Online Count, today/total, online list, Join/Leave feed, toast notifications; polls `mc2_admin_online` every 8 s; a leave needs 2 missed polls), and a global click handler: any element with `data-uu="<device id>"` opens the full user detail (RPC `mc2_admin_user`: user id, বিভাগ, সেশন, score, IP, approx location, browser/device parsed from User-Agent, online/last active, phone, messages). Used in the admin anon-chat tab, old chat tab and score tab.
- Phone: only `contest_entries.contact`, matched by `contest_entries.device` (`contest.js` now sends `p_device`, with fallback to the old call if SQL is not updated).
- SQL: `supabase-userinfo.sql` (see `../SQL-STATUS.md` for what is already run and what is pending). Local keys unchanged; do not rename `mc2_vid`, `mc2_ac_p`.

## বাংলা — User Info ও অনলাইন স্ট্যাটাস (নতুন)
চ্যাটে নাম বা ছবির অক্ষরে ক্লিক করলে ইউজার কার্ড খোলে (শুধু আইডি, নাম, বিভাগ, সেশন, স্কোর, অনলাইন, Last Active)। আইপি, লোকেশন, ডিভাইস ও ফোন শুধু অ্যাডমিন প্যানেলে (👤 User Info ট্যাব, ড্যাশবোর্ডের অনলাইন বক্স, বা যেকোনো ট্যাবের নামে ক্লিক করে)। কোন SQL চালানো আছে তা `../SQL-STATUS.md`-তে।

## DELIVERY RULE (owner standing order, 2026-10-17)
After every site update publish ONE download artifact with, at the top: (1) full-site zip download, (2) full-site code (all code in one file + per-file code/Download/Copy), (3) `supabase-pending-all.sql` with Download + Copy + View. Below: list of what is inside pending-all (name + short description) and a list of ALL SQL files with PENDING / ALREADY RUN status. Pending-all must contain every pending SQL so no other SQL file is ever needed. Full rule: `SQL-STATUS.md`.

## DELIVERY = ARTIFACT ONLY (owner standing order, strongest rule, 2026-10-17)
The owner's phone CANNOT download plain file cards. NEVER deliver with `present_files` or loose zip/sql files. EVERY time (after each update, and also whenever this site is uploaded in a new chat) do exactly this, without being asked:
1. Run `python3 DELIVERY-TOOL/make-download-page.py <site-root> --changed <files changed this time>` (site-root = this root folder). It builds `/mnt/user-data/outputs/download-page.html` with: NEW SQL on top (if any pending), full-site zip, one-file site (`mc-explorer-site.html`), `supabase-pending-all.sql` (Download/Copy/View), update-only zip, all code in one file, per-file Download/Copy/View, and the list of all SQL files with PENDING / ALREADY RUN.
2. Publish that file with the Artifact tool, `capabilities: {"downloads": true}` (call action "capabilities" first). Update the same artifact URL on later updates when possible.
3. Before that: every JS passes `node --check`, every file referenced by index.html/admin.html exists, (old site is separate: check it in the old-site project with `sha256sum -c FROZEN-CHECKSUMS.sha256`) is all OK, SQL-STATUS.md PENDING list is correct (the page reads it).
4. Reply in Bengali, short: what changed, which files, which single SQL to run (or "এই আপডেটে কোনো নতুন SQL লাগবে না").
Downloads only allow extensions gif png jpg jpeg webp mp4 webm mov txt json md docx pptx epub csv ttf html svg pdf xlsx zip, so .js/.css/.sql get an added `.txt` (the generator does this; tell the owner to remove `.txt` before uploading).

## ডেলিভারি = শুধু আর্টিফ্যাক্ট (মালিকের স্থায়ী নির্দেশ)
সাধারণ ফাইল কার্ড মালিকের ফোনে ডাউনলোড হয় না। তাই `present_files` দিয়ে কখনো দেবে না। প্রতিবার না বললেও `DELIVERY-TOOL/make-download-page.py` চালিয়ে `download-page.html` বানিয়ে Artifact হিসেবে (downloads capability সহ) পাবলিশ করবে। এই পেজে থাকবে: নতুন SQL (থাকলে, সবার ওপরে), ফুল জিপ, এক-ফাইলের সাইট, pending SQL, আপডেট-জিপ, পুরো কোড, প্রতিটি ফাইলের Download/Copy/View, আর সব SQL-এর PENDING/ALREADY RUN তালিকা। উত্তর বাংলায়, ছোট করে।

## Admin: per-department auto-delete, active chat users, online visitors, Bengali bad words (added 2026-10-17, `supabase-new-20261017b.sql`)
- Per-department retention: columns `mc2_ac_depts.keep_min` / `file_keep_min` (null = default, 0 = never). `mc2_ac_purge()` uses chat time = session > department > default, attachment time = department > default. RPC `mc2_ac_admin_dept_keep(dept, chat_min, file_min)` (logged). UI helper `window.MCA_DK` lives in `admin-anonchat.js` (Change + Save, message "… জন্য হয়েছে"); it is shown on each department row of the "💬 বেনামি চ্যাট" tab and above each department in Moderation > "🕒 স্বয়ংক্রিয় মোছা". If the SQL is not run yet, Save shows a clear hint.
- Moderation > "🟢 সক্রিয় ইউজার" (`admin-moderation.js`, RPC `mc2_ac_admin_active`): everyone online in chat or who posted in the last 1h/24h/7d/30d, with country, phone model, IP, last active, ban state and buttons warn / Restriction / Ban (custom time via `dlg(... {custom:1})`, or permanent "ফুল ব্যান") / Unban / history. The server rules are unchanged: permanent ban still needs 3 valid reports + Verify.
- Admin "👥 ভিজিটর" tab (`admin.js` `visit()`): on top a live box (RPC `mc2_admin_online_full`, refresh 10 s) with the online count, per-country counts and the list of online people (country, phone model, browser, last active, page, IP). Helpers `window.MCA_FMT` (`ua`, `phone`, `loc`, `ago`, `dur`, `bd`, `country`) are exported from `admin-users.js`.
- Admin chat tab > bad words: button "২০টি বাংলা শব্দ যোগ করুন" (`BN20` in `admin.js`) inserts 20 Bengali words through the REST API (no SQL), skipping words already present. This list is used by the old `#chat` tab filter only; the anonymous chat has no bad-word filter.

## Update 2026-10-17 (later): Card Builder removed, PNG default size, Bengali digits
- The Card Builder (`openBuilder`, button `#cb`, admin switch `b_builder`) was REMOVED from `app.js` / `admin-home.js`. The `b_builder` selector line in `ui-config.js` is harmless and may stay.
- PNG size: `maxB()` in `app.js` again reads the admin limit (`png_max_kb`, 100..5000 KB). If the setting is 0/empty the STANDARD DEFAULT `PNG_DEF_KB = 1000` KB is used (change that constant to change the default). Files smaller than the limit stay full size. The admin label in `admin-gallery.js` says so. No SQL change (the existing check already allows 0 or 100..5000).
- Bengali digits: `card.js` has `eqDigits(x)` which wraps `fillText` so every Bengali digit run on the cards is drawn at equal height (cap 1.5x). The big percent blocks set `x.__raw=1` to skip it. `fonts()` in `app.js` and `cards.js` now load the Bengali subset with a digit sample text (without it Google Fonts' unicode-range split left the canvas on a fallback font, so digits looked mixed). Google Fonts URL now also loads Anek Bangla 600.

## Update 2026-10-17 (latest): PNG unlimited by default + custom card size (SUPERSEDES the PNG_DEF_KB note above)
- `maxB()` in `app.js`: setting `png_max_kb` 0/empty = UNLIMITED (default, full quality); any value >= 10 KB (up to 1,000,000) is honoured and the PNG is scaled down to fit. `PNG_DEF_KB` no longer exists.
- Custom card size: `mc2_settings` key `card_cfg` = `{on,w,h,sw,sh}` (score card w x h, story sw x sh; 100..8000 px). Edited in Admin > quiz settings (`admin-gallery.js`, ratio lock + reset). `community.js` puts it in `MC_QUIZ.card`; `window.mcCardDims()` (in `card.js`) returns `{cw,ch,sw,sh}` only when `on`; `cardOpts` (app.js) and `MCCards.render` (cards.js) merge it into the card options; `drawCard2`/`drawStory` size the canvas with `dimFit()` (area capped ~16 MP) and `ctx.scale()` the fixed 1080x1400 / 1080x1920 design, so text stays sharp at any size. Off = the standard sizes. Different aspect ratios stretch the design (admin note says so).
- SQL: `supabase-new-20261017c.sql` (PENDING; also appended to `supabase-pending-all.sql` and part 5) relaxes the `png_max_kb` check and allows `card_cfg`. Until it is run the admin save shows a hint and the site keeps the defaults.

## Facebook page floating button (2026-10-17)
- `#fbfab` shows on every screen EXCEPT the quiz: `play()`/`qrender()` add `body.quiz` (cleared in `route()`), and `style.css` hides `.fbfab` only under `body.quiz`. On the home screen (`body.dh`) it sits above the sticky start button. Only the admin switch `g_fb` can hide it; it now has its own group "📘 ফেসবুক পেইজ বাটন" in `admin-home.js`, so group "সব বন্ধ" links of other groups never turn it off. Full-screen chat (`#anon`) and popups still cover it. No SQL.
- (later same day) The rules popup's "📘 ফেসবুক পেইজে যান" button `#rfb` now lives in its own wrapper `#rlFb` OUTSIDE `#rlPrize`, so turning off `r_prize` (or CT.on === false) no longer removes it. Verified headless (playwright + /opt/pw-browsers chromium) with prize/rules/global switches off: popup FB button and floating `#fbfab` stay visible.

## Winner prize status + private notes (added 2026-10-18; `admin-pnote.js` + `supabase-new-20261018d.sql` PENDING)
- Admin-only data in table `mc2_prize_notes` (draw_id, wid, given, note), RLS on, only RPCs `mc2_pn_list` / `mc2_pn_set` (both `mc2_is_admin()`). It is NEVER part of `mc2_draws.winners`, so `mc2_draws_public` / `mc2_draws_home` cannot leak it. The old per-winner `note` in `winners` jsonb stays PUBLIC (admin form now labels it "পাবলিক নোট").
- `wid` = `name|dept|batch|n` (lower-case, n = occurrence among identical triples in that draw) so two people with the same name keep separate notes; the row key is draw id + wid.
- `admin-pnote.js` (after `admin-lottery.js` in `admin.html`): new tab "🎁 পুরস্কার ও নোট" (all folders, filters সব/দেওয়া হয়নি/দেওয়া হয়েছে/নোট আছে + search) and the same box under every winner in the admin "বিজয়ী ঘোষণা" edit form (needs the draw saved first). Autosave: 0.6 s after typing, on blur, on toggle, on pagehide. Small `ID U…` chip = `'U'+md5('mc2|'+device)[0:7]` (same as SQL `mc2_uid`), shown only when name(+dept/batch) matches exactly one site player.
- `admin-winners.js` only gained `window.MCW_DRAW` (read-only getter). Public leaderboard/home/winner sheets show no notes and no prize status.

## Script load order (added 2026-10-22; files: index.html, app.js, ui-config.js, sw.js)
- First-view speed: only `config.js`, `ui-config.js` (head), `data.js`, `titles.js`, `app.js` load before the home screen is drawn. Everything else (`qr.js, card.js, community.js, cards.js, anonchat.js, presence.js, pin.js, contest.js, winners.js, scroll-btn.js`) is injected by the loader in `index.html` (`window.__mcDef`) AFTER the home is drawn, in the same order, `async=false`.
- `app.js` calls `window.__mcDef.start()` after the first `route()`. Opening a non-home hash (e.g. `#board`, `#result`) or a `?d=` download link waits for `__mcDef.p` first; `hashchange` to a non-home page does the same until `__mcDef.done`.
- NEW SCRIPT RULE: do not add a `<script src>` after `app.js` in index.html — add the file name to the `L` list in the loader instead. Code in `app.js` must keep guarding deferred globals (`window.mcX ? ... : fallback`).
- ui-config first-visit hide wait is 1 s (was 4 s). `sw.js` K bumps on every update.

- Default score card (2026-10-22): `ui_cfg.def` (0/1/2, null = auto) set in admin Home tab; `window.mcCardDefault()` in app.js picks it (falls back to first enabled card). The default card is what the result page draws first, what `mcCardSync` uploads, and what cards.js draws for "আগের কার্ড দেখো". Never hard-code card 1 (`drawCard1`) as the default.

## লিডারবোর্ড কার্ড প্রিভিউ + সার্চ বাটন (2026-11-17)
সেরা ৩-এর নিচের ইউজারের র‍্যাংক হিস্টরি জানালায় "🪪 কার্ড দেখো" (`cards.js` `mcPeek`, SQL `mc2_card_peek`, সুইচ `board_cfg.peek_on` ডিফল্ট চালু, ছবি কখনো নয়)। সার্চ-খোলার বাটন (#lft2, `.lbt`) সার্চবারের মতো ডিজাইন + ▾ চিহ্ন। বিস্তারিত: `CHANGES-20261117-leaderboard-card-peek.md`। SQL এখনো PENDING।

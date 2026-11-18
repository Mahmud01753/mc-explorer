# MC Explorer — Deploy গাইড (GitHub + Cloudflare Pages বা Netlify)
> ২০২৬-১০-২৯: সাইট এখন সরাসরি রুটে। জিপ খুলে ভেতরের সব ফাইল (index.html, _headers, config.js, admin.html …) রিপোর রুটে দিন; কোনো ফোল্ডার-র‍্যাপার নেই। পুরোনো সাইট আলাদা জিপ/প্রজেক্ট।

## ১) GitHub
1. github.com → New repository (Private রাখুন) → নাম `mc-explorer`.
2. এই zip খুলে ভেতরের **সব ফাইল** (index.html, _headers, …) রিপোজিটরিতে Upload করুন (ওয়েবে "Add file → Upload files"), অথবা:
   `git init && git add . && git commit -m "mc explorer" && git branch -M main && git remote add origin <repo-url> && git push -u origin main`
3. `config.js`-এর `url`/`key` (Supabase anon key) রিপোতে থাকা ঠিক আছে (public key)। **service_role key কখনো রাখবেন না।**

## ২) Netlify
New site → Import from Git → repo বাছুন → Build command: ফাঁকা, Publish directory: `/` (root) → Deploy.
`_headers` কাজ করে: `/admin` (ও `/admin.html`) noindex, no-store, CSP সহ।

## ২খ) Cloudflare Pages (বিকল্প)
Workers & Pages → Create → Pages → Connect to Git → Build command ফাঁকা, Output directory `/` → Deploy। `_headers` Cloudflare Pages-ও মানে; `/admin` ক্লিন-URL হিসেবে নিজে থেকেই `admin.html` খোলে।
ডিপ্লয়ের পর `status.html` খুলে দেখুন সব ফাইল সবুজ কি না।

## ৩) Supabase (Backend + Database + Storage + Auth)
1. supabase.com → New project। Project Settings → API থেকে `Project URL` ও `anon public key` নিয়ে `config.js`-এ বসান; `siteUrl` = আপনার সাইটের ঠিকানা।
2. SQL Editor → New query → **`supabase-pending-all.sql`** পুরোটা পেস্ট করে Run (একবারই; আগেই চালানো: contest, community, titles; না চালালে `SQL-STATUS.md` দেখুন)। ফাইলটি পুনরায় চালালেও ক্ষতি নেই (idempotent)।
3. Storage বাকেট (mc2-places, mc2-chat, contest) SQL-ই বানায়।
4. অ্যাডমিন বানান: Authentication → Users → Add user (ইমেইল + শক্ত পাসওয়ার্ড, Auto Confirm)। তারপর SQL Editor-এ:
   `insert into mc2_admins(email) values ('আপনার-ইমেইল@example.com');`  (ছোট হাতের অক্ষর)
5. Authentication → Sign In / Providers → Email → "Allow new users to sign up" **বন্ধ**।

## ৪) Admin URL
`https://আপনার-সাইট/admin` (বা `/admin.html`)। লগইন: ঐ ইমেইল/পাসওয়ার্ড; ৩০ মিনিট নিষ্ক্রিয় থাকলে অটো লগআউট। নিরাপত্তা আসে Supabase Auth + RLS + `mc2_is_admin()` থেকে; অ্যাডমিন তালিকায় না থাকলে লগইন করেও কিছু করা যায় না।
ট্যাব: 📊 ড্যাশবোর্ড · 🖼️ গ্যালারি · ⚙️ কুইজ সেটিংস · ❓ প্রশ্ন · 📝 উত্তর ও ফল · 💬 বেনামি চ্যাট · 👤 User Info · 🛡️ মডারেশন (রিপোর্ট, ব্যান, 📎 ফাইল আপলোড ON/OFF, 🕒 অটো মোছা) · 📊 ফলাফল।

## ৫) চালু হয়েছে কিনা দেখার তালিকা
- [ ] /admin-এ লগইন হয় · [ ] গ্যালারিতে ছবি আপলোড (নাম+ক্যাটাগরি) · [ ] "প্রশ্ন" ট্যাবে MCQ এসেছে (কমপক্ষে ৪টি আলাদা নাম লাগে)
- [ ] সাইটে খেলা: ১০টি র‍্যান্ডম প্রশ্ন, কাছাকাছি নামের ভুল অপশন · [ ] ফলে "🎨 কার্ড বিল্ডার" ও ডাউনলোড (PNG ≤ ৯০০ KB)
- [ ] চ্যাটে মেসেজ → অন্য ডিভাইস থেকে 🚩 রিপোর্ট → অ্যাডমিন 🛡️ মডারেশনে দেখা যায় · [ ] ব্যান/Unban · [ ] 📎 সুইচ OFF করলে চ্যাটে 📎 ধূসর
- আপডেটের পর পুরোনো চেহারা দেখালে Ctrl+Shift+R।

## সীমা (সত্যি কথা)
- ব্যান ডিভাইস-আইডি ভিত্তিক; ব্রাউজার ডেটা মুছলে এড়ানো যায়। ব্যান হলেও চ্যাট পড়া যায়।
- অ্যাডমিন ও Supabase-এর কাজ (SQL চালানো, ইউজার বানানো) আপনার অ্যাকাউন্টে হাতে করতে হয়; আমি সেগুলো আপনার Supabase-এ চালিয়ে পরীক্ষা করতে পারিনি।

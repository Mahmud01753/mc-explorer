# 2026-10-30 — Supabase keep-alive চালু + _headers যোগ (নতুন SQL লাগে না)
- নতুন ফাইল যোগ: `.github/workflows/keepalive.yml` — রোজ ২ বার (০৩:১৭ ও ১৫:১৭ UTC) Supabase `mc2_settings` থেকে ১টা সারি পড়ে, ফ্রি প্রজেক্ট পজ ঠেকায়। URL/কী `config.js` থেকে নেয়। ব্যর্থ হলে ৩ বার চেষ্টা।
- ✅ মালিক GitHub রিপো `mc-explorer`-এ ফাইলটা বসিয়ে ও `config.js` রুটে দিয়ে "Run workflow" চালিয়েছেন — প্রথম রান #1 সফল (Success, ১৫ সেকেন্ড)।
- নতুন ফাইল যোগ: `_headers` — `/admin` ও `/admin.html`-এ no-store (ক্যাশ বন্ধ), noindex, CSP, X-Frame-Options; `/sw.js`-এ no-cache।
- আগের কোনো ফাইল বদলানো বা মোছা হয়নি (`images/og.png` পুরোনো অব্যবহৃত কপি, মালিকের নির্দেশে রাখা)।
- লিংক প্রিভিউয়ের ছবি: `images/og.jpg` (১২০০×৬৩০), `index.html`-এ og:image।
- আগের আপডেট (এই জিপে মিলানো): `admin-prize.js` + `sw.js` (mc-challenge-85) + `changes-20261121-poster-next.md` — বিজয়ী ট্যাবের ফেসবুক পোস্টারে লিংক পিলের রঙ ঠিক + "⏭ পরের ডিজাইন ›" ও "⏭ পরের রঙ ›" বাটন।
- হোস্টিং: Previewship (পরে Cloudflare ইত্যাদিতেও চলবে); GitHub রিপো শুধু keep-alive ও ব্যাকআপের জন্য।

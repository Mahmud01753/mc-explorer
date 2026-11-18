# 2026-10-22 নতুন ভিজিটরের ফার্স্ট ভিউ দ্রুত (index.html, app.js, ui-config.js, sw.js; নতুন SQL লাগবে না)
- আগে: ১২টা স্ক্রিপ্ট (~৩৪০ KB) ক্রমে নামার পর হোম আঁকা হতো। এখন হোমের আগে শুধু config, ui-config, data, titles, app (~১১৫ KB)।
- বাকি (qr, card, community, cards, anonchat, presence, pin, contest, winners, scroll-btn) হোম আঁকার পর পেছনে লোড হয় (আগের ক্রমেই)।
- সরাসরি #board/#result/?d= লিংকে ঢুকলে বাকিগুলো আসা পর্যন্ত অপেক্ষা করে আঁকে; হোম থেকে অন্য পাতায় দ্রুত গেলেও একই।
- ui-config: প্রথমবারের ভিজিটরের লুকানো অংশের সর্বোচ্চ অপেক্ষা ৪ সেকেন্ড → ১ সেকেন্ড।
- sw.js ক্যাশ mc-challenge-43। CLAUDE.md/AGENTS.md-এ নতুন স্ক্রিপ্টের নিয়ম লেখা।
- ফিরে যেতে: আগের জিপের এই ৪ ফাইল (index.html, app.js, ui-config.js, sw.js) ফেরত দিন।

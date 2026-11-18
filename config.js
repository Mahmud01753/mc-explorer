// Supabase সংযোগ। এখানে শুধু Project URL ও anon/publishable কী বসান।
// ⚠️ service_role বা secret কী কখনো এখানে দেবেন না।
// খালি থাকলে সাইট "লোকাল মোডে" চলে (স্কোর শুধু ওই ডিভাইসে থাকে)।
// siteUrl: খালি রাখুন — সাইট যেখানেই পাবলিশ করুন, মূল ডোমেইন (যেমন https://yoursite.com/) অটো বসে যাবে, QR ও ক্যাপশনে সেটাই যাবে। শুধু আলাদা ঠিকানা চাইলে এখানে লিখুন।
// oldUrl: পুরোনো সাইট আলাদা প্রজেক্টে ডিপ্লয় করলে তার পুরো ঠিকানা এখানে বসান (যেমন https://old-mc.pages.dev/)। খালি থাকলে পিন-বাটন বলবে ঠিকানা বসানো হয়নি।
// brandVer: হোম হেডারের ডিজাইন — "A" বা "B" (খালি = A)। দুটো পাশাপাশি দেখতে ঠিকানার শেষে ?hb=A বা ?hb=B দিন।
// brandSize: হোমের "MC Explorer" লেখার সর্বোচ্চ আকার px-এ (২২–৮০, ডিফল্ট ৪২; ছোট চাইলে ৩৬, বড় চাইলে ৫০)। ঠিকানার শেষে ?hs=৩৬ দিলে শুধু ওই ব্রাউজারে পরীক্ষা করা যায়।
// fbPage: আপনার ফেসবুক পেইজের লিংক (যেমন https://facebook.com/yourpage) — ভাসমান ফেসবুক বাটন ও পপ-আপের বাটনে যাবে।
window.MC_CFG = { url: "https://woduhayhvbdnmdmnsbjk.supabase.co", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHVoYXlodmJkbm1kbW5zYmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODY5MDksImV4cCI6MjEwNzY2MjkwOX0.rbu9d9TereRXOOrKPM-yCNiJGUf5urdjqAW3FzOwgNk", siteUrl: "", fbPage: "https://www.facebook.com/share/1FawdtMweH/", oldUrl: "", brandVer: "A", brandSize: 42 };

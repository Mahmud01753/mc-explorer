# project-notes — সাইটের অংশ নয়
এখানে শুধু নোট ও SQL ফাইল (changes-*.md, supabase-*.sql, deploy.md, files.txt, readme.txt, admin-setup.txt, agents.md)। সাইট চালাতে এগুলো লাগে না।
- Cloudflare Workers (wrangler): `.assetsignore`-এ থাকায় পাবলিশ হয় না। Pages/Netlify-তে ফোল্ডারটা রিপোতে রাখলে ফাইলগুলো পাবলিক ঠিকানায় খোলা যায়; চাইলে রিপোতে না তুলে নিজের কাছে রাখুন।
- রুটে রাখা হয়েছে: claude.md (AI-এর নিয়ম), sql-status.md (অ্যাডমিন হাব এটা পড়ে), _headers, netlify.toml, wrangler.jsonc, .assetsignore (ডিপ্লয় কনফিগ)।
- SQL চালাতে: `project-notes/supabase-pending-all.sql` (বা sql-status.md-এ যেটা PENDING)।

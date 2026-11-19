const K = "mc-challenge-231";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== K).map((k) => caches.delete(k)))).then(() => clients.claim())));
const put = (req, r) => { if (r && r.ok && !r.redirected) { const c = r.clone(); caches.open(K).then((x) => x.put(req, c)); } return r; };
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  const u = new URL(e.request.url), img = /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(u.pathname), adm = /admin/i.test(u.pathname);
  // ছবি: ক্যাশে থাকলে সঙ্গে সঙ্গে দেখায়, পেছনে নতুনটা এনে রাখে (ছবি বদলালে পরের বার নতুনটা)
  if (img && !adm) { e.respondWith(caches.match(e.request).then((c) => { const n = fetch(e.request).then((r) => put(e.request, r)).catch(() => c); return c || n; })); return; }
  // অ্যাডমিন: আগের মতোই — আগে নেটওয়ার্ক, না পেলে ক্যাশ
  if (adm) { e.respondWith(fetch(e.request).then((r) => put(e.request, r)).catch(() => caches.match(e.request))); return; }
  // বাকি (html/js/css): ক্যাশে থাকলে সঙ্গে সঙ্গে দেখায়, পেছনে নতুন কপি এনে রাখে (পরের বারে নতুন)। ক্যাশে না থাকলে নেটওয়ার্ক থেকে। (আগে: আগে নেটওয়ার্ক, ধীর হলে ৩ সেকেন্ড পরে ক্যাশ)
  // নিয়ম: প্রতিবার সাইট আপডেটে উপরের K-র নম্বর বাড়াতে হবে, নইলে ইউজার একবার পুরোনো ফাইল দেখতে পারে।
  e.respondWith(caches.match(e.request, { ignoreSearch: e.request.mode === "navigate" }).then((c) => {
    const n = fetch(e.request).then((r) => put(e.request, r));
    if (c) { e.waitUntil(n.catch(() => {})); return c; }
    return n.catch(() => Response.error());
  }));
});

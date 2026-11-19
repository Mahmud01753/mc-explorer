// Cloudflare Pages: শেয়ার-প্রিভিউ ছবির পূর্ণ ঠিকানা অটো বসায় (Netlify-তে এই ফাইল লাগে না, ক্ষতিও নেই)।
// ছবির ঠিকানার শেষে ছবির নিজস্ব কোড (?v=...) অটো বসে — ছবি বদলালে কোডও নিজে বদলায়।
// সমস্যা হলে সাইট আগের মতোই চলে।
let OGV = "";
async function ogVer(env, origin) {
  if (OGV) return OGV;
  try {
    const r = await env.ASSETS.fetch(new Request(origin + "/images/og.jpg"));
    if (!r.ok || !(r.headers.get("content-type") || "").includes("image")) return "1";
    const d = await crypto.subtle.digest("SHA-1", await r.arrayBuffer());
    OGV = Array.from(new Uint8Array(d)).slice(0, 6).map((x) => x.toString(16).padStart(2, "0")).join("");
    return OGV;
  } catch (e) { return "1"; }
}
export async function onRequest(context) {
  const res = await context.next();
  try {
    const url = new URL(context.request.url);
    if (url.pathname !== "/" && url.pathname !== "/index.html") return res;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return res;
    const origin = url.origin;
    const v = await ogVer(context.env, origin);
    return new HTMLRewriter()
      .on('meta[property="og:image"]', { element(e) { e.setAttribute("content", origin + "/images/og.jpg?v=" + v); } })
      .on("head", { element(e) { e.append('<meta property="og:url" content="' + origin + '/">', { html: true }); } })
      .transform(res);
  } catch (err) {
    return res;
  }
}

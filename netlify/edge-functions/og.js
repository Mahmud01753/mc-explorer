// ফেসবুক/মেসেঞ্জার ক্রলার স্ক্রিপ্ট চালায় না, তাই শেয়ার-প্রিভিউ ছবির পূর্ণ ঠিকানা সার্ভারেই বসানো হয়।
// যে ডোমেইনে সাইট আপলোড করবেন সেটাই অটো বসবে — কিছু লিখতে হবে না।
// ছবির ঠিকানার শেষে ছবির নিজস্ব কোড (?v=...) অটো বসে — ছবি বদলালে কোডও নিজে বদলায়।
// কোনো সমস্যা হলে সাইট আগের মতোই চলে (ফল্লব্যাক)।
let OGV = "";
async function ogVer(origin) {
  if (OGV) return OGV;
  try {
    const r = await fetch(origin + "/images/og.jpg");
    if (!r.ok || !(r.headers.get("content-type") || "").includes("image")) return "1";
    const d = await crypto.subtle.digest("SHA-1", await r.arrayBuffer());
    OGV = Array.from(new Uint8Array(d)).slice(0, 6).map((x) => x.toString(16).padStart(2, "0")).join("");
    return OGV;
  } catch (e) { return "1"; }
}
export default async (request, context) => {
  const res = await context.next();
  try {
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return res;
    const origin = new URL(request.url).origin;
    const v = await ogVer(origin);
    let html = await res.text();
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, '$1' + origin + '/images/og.jpg?v=' + v + '$2');
    if (html.indexOf('property="og:url"') >= 0) {
      html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + origin + '/$2');
    } else {
      html = html.replace('<meta property="og:image:type"', '<meta property="og:url" content="' + origin + '/">\n<meta property="og:image:type"');
    }
    const h = new Headers(res.headers);
    h.delete("content-length");
    return new Response(html, { status: res.status, headers: h });
  } catch (e) {
    return res;
  }
};
export const config = { path: ["/", "/index.html"] };

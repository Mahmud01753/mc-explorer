// Cloudflare Pages: শেয়ার-প্রিভিউ ছবির পূর্ণ ঠিকানা অটো বসায় (Netlify-তে এই ফাইল লাগে না, ক্ষতিও নেই)।
// সমস্যা হলে সাইট আগের মতোই চলে।
export async function onRequest(context) {
  const res = await context.next();
  try {
    const url = new URL(context.request.url);
    if (url.pathname !== "/" && url.pathname !== "/index.html") return res;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return res;
    const origin = url.origin;
    return new HTMLRewriter()
      .on('meta[property="og:image"]', { element(e) { e.setAttribute("content", origin + "/images/og.jpg"); } })
      .on("head", { element(e) { e.append('<meta property="og:url" content="' + origin + '/">', { html: true }); } })
      .transform(res);
  } catch (err) {
    return res;
  }
}

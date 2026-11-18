// Cloudflare Worker: functions/_middleware.js-এর হুবহু কাজ (শেয়ার-প্রিভিউ og:image ও og:url-এ পূর্ণ ঠিকানা অটো বসায়)।
// শুধু "/" ও "/index.html" এই Worker-এর ভেতর দিয়ে যায়; বাকি সব ফাইল সরাসরি স্ট্যাটিক। সমস্যা হলে সাইট আগের মতোই চলে।
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    try {
      const url = new URL(request.url);
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
};

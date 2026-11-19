// ✅ পোস্টার ("বিজয়ী কার্ড") আঁকার কোড — অ্যাডমিন (admin-prize.js) ও পাবলিক বিজয়ী-তালিকা (cards.js) দুই জায়গায় এই একই কোড চলে।
// কোনো সার্ভার-কল নেই, ডাটাবেসে কিছু লেখে/পড়ে না: ছবি সবসময় ফোনে/ব্রাউজারে ক্যানভাসে আঁকা হয়।
// পাবলিক পাতায় এটা শুধু তখনই লোড হয় যখন কেউ বিজয়ীর "বিজয়ী কার্ড" খোলে (cards.js lazy-load); এরপর ব্রাউজারে ক্যাশ থাকে।
// ডিজাইন ২০টি (TH)। বিজয়ী প্রতি সার্ভারে শুধু ডিজাইন-নম্বর (winners[].pd, ০–১৯) থাকে, ছবি নয়।
(function () {
  if (window.MCPoster) return;
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var D = function () { return window.MC || {}; };
  var deptL = function (d) { return D().deptLabel ? D().deptLabel(d || "") : (d || ""); };
  var siteUrl = function () { var C = window.MC_CFG || {}; return C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : /^https?:/.test(location.origin) ? location.origin + "/" : ""; };
  var CN = { "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n", "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n", "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t" },
    VI = { "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou" }, VS = { "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou" }, SG = { "ং": "ng", "ঃ": "h", "ঁ": "n" };
  function roman(t) {
    t = String(t || "").normalize("NFC"); var o = "", i, c, n;
    for (i = 0; i < t.length; i++) { c = t[i]; n = t[i + 1];
      if (CN[c]) { o += CN[c]; if (n && VS[n]) { o += VS[n]; i++; } else if (n === "্") i++; else if (n && CN[n]) o += "o"; }
      else if (VI[c]) o += VI[c]; else if (SG[c]) o += SG[c]; else if (VS[c]) o += VS[c]; else if (c !== "্") o += c; }
    return o;
  }
  var ascii = function (t) { return (roman(t).replace(/[^A-Za-z0-9 _-]+/g, " ").trim().replace(/\s+/g, "_") || "Winner").slice(0, 28); };
  var li = function (s) { return new Promise(function (r) { if (!s) return r(null); var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = s; }); };
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, t, maxW, size, wt, fam) { var s = size; do { c.font = wt + " " + s + "px " + fam; s -= 2; } while (c.measureText(t).width > maxW && s > 18); return t; }
  function seeded(n) { var s = n; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  // ---------- পোস্টারের ১০টি ডিজাইন (০ = আগের ডিফল্ট সবুজ-সোনালি) ----------
  var PZ_TH = [
    { n: "১. ডিফল্ট সবুজ-সোনালি", bg: ["#0b3320", "#1d6b43", "#08261a"], ink: "#fff", acc: "#ffd666", acc2: "#7ee0a8", bd: ["#ffe9a6", "#e0a21b"], bi: "#4a2f00", pat: "rays", av: "c", cf: 1 },
    { n: "২. রয়্যাল নেভি", bg: ["#0a1a3f", "#16336e", "#07122c"], ink: "#fff", acc: "#f5c84b", acc2: "#8fb4ff", bd: ["#ffe08a", "#d49a12"], bi: "#2b1c00", pat: "diamond", av: "r" },
    { n: "৩. সানসেট", bg: ["#ff5f6d", "#ff9966", "#c2185b"], ink: "#fff", acc: "#fff3b0", acc2: "#fff", bd: ["#fff", "#ffe0b2"], bi: "#a3123f", pat: "stripes", av: "c" },
    { n: "৪. ক্লিন হোয়াইট", bg: ["#ffffff", "#eef7f1", "#dff0e6"], ink: "#12301f", acc: "#1d9b5a", acc2: "#0b6b3a", bd: ["#2fb872", "#0f7a43"], bi: "#fff", pat: "none", av: "c", light: 1 },
    { n: "৫. নিয়ন ডার্ক", bg: ["#07070f", "#14102b", "#050509"], ink: "#fff", acc: "#2cf5e0", acc2: "#ff3df2", bd: ["#2cf5e0", "#8a5cff"], bi: "#06060f", pat: "grid", av: "r" },
    { n: "৬. কনফেটি পার্পল", bg: ["#4a1fa8", "#8e44ff", "#2b0f6b"], ink: "#fff", acc: "#ffe14d", acc2: "#ff8ad8", bd: ["#ffe14d", "#ffb300"], bi: "#3a0f80", pat: "dots", av: "c", cf: 1 },
    { n: "৭. উৎসব লাল-সোনালি", bg: ["#7a0c14", "#c4202c", "#4d060c"], ink: "#fff", acc: "#ffd666", acc2: "#ffe9a6", bd: ["#ffe9a6", "#e0a21b"], bi: "#5a0a10", pat: "stars", av: "h", cf: 1 },
    { n: "৮. ওশান টিল", bg: ["#03343b", "#0f8b8d", "#022a30"], ink: "#fff", acc: "#fff1a8", acc2: "#9ff0e8", bd: ["#fff1a8", "#f0b429"], bi: "#033a40", pat: "waves", av: "c" },
    { n: "৯. ভিন্টেজ পেপার", bg: ["#f7ecd3", "#efddb4", "#e6cf9c"], ink: "#3b2a14", acc: "#a4351f", acc2: "#7a5b2a", bd: ["#c0472c", "#8f2a16"], bi: "#fff6e0", pat: "paper", av: "r", light: 1 },
    { n: "১০. ব্ল্যাক গোল্ড লাক্স", bg: ["#0c0c0c", "#232018", "#050505"], ink: "#f6e7b8", acc: "#e8c25a", acc2: "#b8923a", bd: ["#f3d97a", "#b8862a"], bi: "#1a1204", pat: "rings", av: "c", dbl: 1 },
    { n: "১১. পিঙ্ক ব্লাশ", bg: ["#fff0f5", "#ffd6e7", "#ffc2da"], ink: "#4a1030", acc: "#d81b60", acc2: "#ff80ab", bd: ["#ff6fa5", "#c2185b"], bi: "#fff", pat: "bubbles", av: "c", light: 1 },
    { n: "১২. ফরেস্ট নাইট", bg: ["#06140d", "#0f3a24", "#04100a"], ink: "#eaffee", acc: "#a6ff7a", acc2: "#35c46b", bd: ["#c6ff9a", "#5fb83a"], bi: "#0b2412", pat: "sparkle", av: "h" },
    { n: "১৩. স্কাই ক্লাউড", bg: ["#d9f0ff", "#8fd0ff", "#5fb3f5"], ink: "#0b2a52", acc: "#0b4fa3", acc2: "#4aa3ff", bd: ["#1f7ae0", "#0b4fa3"], bi: "#fff", pat: "clouds", av: "c", light: 1 },
    { n: "১৪. ফায়ার অরেঞ্জ", bg: ["#ff3d00", "#ff8a00", "#b71c1c"], ink: "#fff", acc: "#fff1a8", acc2: "#ffd166", bd: ["#ffffff", "#ffd166"], bi: "#b71c1c", pat: "burst", av: "c" },
    { n: "১৫. মিন্ট ফ্রেশ", bg: ["#e9fff6", "#c4f5df", "#a2ead0"], ink: "#073b2c", acc: "#00875a", acc2: "#35c99a", bd: ["#19b383", "#00805a"], bi: "#fff", pat: "bubbles", av: "r", light: 1 },
    { n: "১৬. রোজ গোল্ড", bg: ["#2a1220", "#4b2238", "#1b0b15"], ink: "#ffe9e4", acc: "#f0b8a6", acc2: "#d98a7a", bd: ["#ffd7c9", "#c9806c"], bi: "#3a1626", pat: "lines", av: "c", dbl: 1 },
    { n: "১৭. কসমস", bg: ["#050818", "#1b1646", "#02030c"], ink: "#ffffff", acc: "#9fd0ff", acc2: "#c77dff", bd: ["#c9bcff", "#7a5cff"], bi: "#0a0820", pat: "cosmos", av: "c" },
    { n: "১৮. রেট্রো পপ", bg: ["#ffe14d", "#ffd21f", "#ffbe0b"], ink: "#111111", acc: "#e63946", acc2: "#3a86ff", bd: ["#222222", "#000000"], bi: "#ffe14d", pat: "checker", av: "r", light: 1, dbl: 1 },
    { n: "১৯. ব্লুপ্রিন্ট", bg: ["#0b3d91", "#1352c4", "#08306e"], ink: "#ffffff", acc: "#ffffff", acc2: "#8ec5ff", bd: ["#ffffff", "#cfe6ff"], bi: "#0b3d91", pat: "grid", av: "r" },
    { n: "২০. মনোক্রোম", bg: ["#ffffff", "#f1f1f1", "#e4e4e4"], ink: "#111111", acc: "#111111", acc2: "#666666", bd: ["#2a2a2a", "#000000"], bi: "#ffffff", pat: "none", av: "r", light: 1 }];
  // ---------- ড্রপডাউনের তৈরি লেখা (@url = সাইটের লিংক); নিজের লেখা যোগ করলে এই ব্রাউজারে জমা থাকে (চাবি: mc2_pz_txt) ----------
  var PZ_TX = {
    b: ["★ পুরস্কার বিজয়ী ★", "★ সপ্তাহের বিজয়ী ★", "★ মাসের সেরা ★", "🏆 চ্যাম্পিয়ন", "🥇 প্রথম স্থান", "🥈 দ্বিতীয় স্থান", "🥉 তৃতীয় স্থান", "🎉 লাকি ড্র বিজয়ী", "🔥 টপ প্লেয়ার", "⚡ লেভেল আপ", "🌟 ঈদ বিশেষ বিজয়ী", "🌊 এক্সপ্লোরার", "🧭 পথিকৃৎ", "✦ সম্মাননা পত্র ✦", "♛ গ্র্যান্ড বিজয়ী", "♛ গোল্ড মেম্বার", "😎 কলেজ-গুরু", "🧠 ক্যাম্পাস জিনিয়াস", "বিশেষ পুরস্কার", "✔ বিজয়ী", "সম্মাননা", "🎊 পুরস্কার জয়ী"],
    m: ["অভিনন্দন! তুমি MC Explorer-এর পুরস্কার জিতেছ", "দারুণ খেলেছ! কলেজ তোমার নখদর্পণে", "কলেজের আসল এক্সপ্লোরার তুমিই", "প্রতিটি কোণা তোমার চেনা!", "ভাগ্য আর জ্ঞান, দুটোই তোমার সাথে", "এবারের সেরাদের একজন তুমি", "সবুজ ক্যাম্পাসের সবুজ চ্যাম্পিয়ন", "ধন্যবাদ খেলার জন্য, অভিনন্দন!", "গেম ওভার? না, তুমি জিতে গেছ!", "স্কোর বলছে তুমি লিজেন্ড", "পার্টি টাইম! তুমি জিতেছ", "কনফেটি ছুড়ে দাও, তুমি সেরাদের মাঝে", "ঈদ মোবারক ও অভিনন্দন!", "শুভেচ্ছা রইল, জিতেছ তুমি", "ক্যাম্পাসের প্রতিটি পথ তোমার চেনা", "শান্ত মাথায় সেরা খেলা", "কলেজ-প্রেমের স্বীকৃতিস্বরূপ", "ঐতিহ্যের প্রতি ভালোবাসায় সেরা", "মহাপুরস্কার জয়ী — অভিনন্দন!", "সোনালি ফল, সোনালি মুহূর্ত", "কলেজ তোমাকে নিয়ে গর্বিত", "কলেজের গলিঘুঁজি সব মুখস্থ!", "তোমার মার্ক দেখে স্যারেরাও অবাক!", "ক্যান্টিনের চা আজ তোমার পাওনা!", "তোমার জন্য আজ পুরো MC হাততালি দিচ্ছে!", "জেতাটা কাকতালীয় নয়, পুরোটাই তোমার কৃতিত্ব", "সবার আগে তুমিই মনে রেখেছ ক্যাম্পাসের গল্প", "তোমার উদ্যমই আজ তোমাকে বিজয়ী বানিয়েছে", "বন্ধুরা শুনলে গর্বে বুক ফুলে যাবে!", "পরিশ্রম আর ভালোবাসার সুন্দর ফল", "ক্যাম্পাসের প্রতি টানই আজ তোমাকে জিতিয়েছে", "আজকের দিনটা পুরোপুরি তোমার!", "নতুনদের জন্য তুমি অনুপ্রেরণা", "কলেজের স্মৃতিকে এত ভালোবাসো, দারুণ!", "হাসিমুখে এই জয় উদযাপন করো", "তুমি প্রমাণ করলে, চেষ্টা কখনো বৃথা যায় না", "সবাই এখন তোমার নামই বলছে!", "এই সাফল্য তোমার সবচেয়ে সুন্দর স্মৃতি হয়ে থাক", "এগিয়ে চলো, আরও বড় জয় অপেক্ষা করছে", "তোমাকে নিয়ে আমরা সবাই খুব খুশি", "মন দিয়ে খেলেছ, মন জয় করেছ", "তোমার মতো খেলোয়াড় পেয়ে MC ধন্য", "আজ তুমি সত্যিই সবার সেরা!", "জয়ের আনন্দটা সবার সাথে ভাগ করে নাও"],
    t: ["তুমি কলেজ কতটুকু চেনো?", "কলেজকে কতটা জানো?", "চ্যালেঞ্জ নিয়ে দেখো", "প্রতিটি কোণা, প্রতিটি গল্প", "চলো কলেজটা আবার চিনি", "স্মৃতির ক্যাম্পাস, নতুন চ্যালেঞ্জ", "খেলো, জেতো, শেয়ার করো"],
    f: ["@url", "MC Explorer Challenge", "খেলো → @url", "তুমিও চেষ্টা করো", "লাকি ড্র প্রতি সপ্তাহে", "#MCExplorer", "লিডারবোর্ডে নাম তোলো", "শেয়ার করো, বন্ধুদের চ্যালেঞ্জ দাও", "পরের বিজয়ী তুমিও হতে পারো", "স্মৃতির MC, আবার খেলি", "চলো আবার খেলি"] };
  // ---------- ছেলে/মেয়ের আলাদা লেখা (ব্যাজ ও বার্তা)। আগের সব লেখা PZ_TX-এ যেমন ছিল তেমনই আছে ----------
  var GX = {
    b: { m: ["🦁 ক্যাম্পাসের সিংহ", "👑 কলেজের রাজা", "🚀 ক্যাম্পাস-জয়ী বীর", "💪 দুর্দান্ত খেলোয়াড়", "🔥 আগুন-ঝরানো স্কোর", "⚡ বিদ্যুৎগতির বিজয়ী", "🧠 মগজাস্ত্র ছেলে", "🏅 কলেজের গর্বের সন্তান", "🎯 অব্যর্থ নিশানা", "🌟 উদীয়মান তারকা", "🛡 MC-র যোদ্ধা", "😎 ক্যাম্পাসের হিরো", "🎖 সেরা এক্সপ্লোরার", "📚 জ্ঞানের সম্রাট", "🌿 সবুজ ক্যাম্পাসের বীর", "💥 উদ্যমী বিজয়ী", "🥇 অদম্য উদ্যমী", "🦅 উঁচু আকাশের শাহিন", "🧭 MC-র পথপ্রদর্শক", "🏆 চ্যালেঞ্জ-জয়ী ভাই"],
      f: ["👑 ক্যাম্পাসের রানি", "🌸 কলেজের গর্ব", "🦋 উড়ন্ত প্রতিভা", "💪 অদম্য বিজয়িনী", "🔥 আগুনঝরা স্কোর", "⚡ বিদ্যুৎগতির বিজয়িনী", "🧠 তীক্ষ্ণ মেধাবী", "🏅 কলেজের গর্বের কন্যা", "🎯 অব্যর্থ নিশানা", "🌟 উদীয়মান তারা", "🛡 MC-র যোদ্ধা", "💫 ক্যাম্পাসের তারকা", "🎖 সেরা এক্সপ্লোরার", "📚 জ্ঞানের রানি", "🌺 সবুজ ক্যাম্পাসের রত্ন", "💥 উদ্যমী বিজয়িনী", "🥇 অদম্য উদ্যমী", "🕊 সাহসী বিজয়িনী", "🐯 ক্যাম্পাসের বাঘিনী", "✨ চ্যালেঞ্জ-জয়ী কন্যা"] },
    m: { m: ["দারুণ খেলেছ ভাই! কলেজ তোমার নখদর্পণে", "ক্যাম্পাসের প্রতিটি কোণা তোমার চেনা, সাবাশ!", "তোমার মগজের কাছে গুগল ম্যাপও হার মানে!", "এভাবেই এগিয়ে যাও, পরের চ্যাম্পিয়ন তুমিই", "উদ্যম আর জ্ঞানের দারুণ মিল, অভিনন্দন!", "ক্যান্টিনের চা আজ তোমার পাওনা, চ্যাম্পিয়ন!", "তুমি জিতেছ, আর MC গর্বিত তোমার জন্য", "হাল ছাড়োনি, তাই আজ বিজয়ীর আসনে", "স্যারেরাও আজ তোমার স্কোরে মুগ্ধ!", "এমন উদ্যমী ছেলেই কলেজের অহংকার", "অভিনন্দন! ক্যাম্পাসের সিংহ আজ তুমিই"],
      f: ["দারুণ খেলেছ! কলেজ তোমার নখদর্পণে", "ক্যাম্পাসের প্রতিটি কোণা তোমার চেনা, সাবাশ!", "তোমার মেধার কাছে গুগল ম্যাপও হার মানে!", "এভাবেই এগিয়ে যাও, পরের চ্যাম্পিয়ন তুমিই", "উদ্যম আর মেধার দারুণ মিল, অভিনন্দন!", "ক্যান্টিনের চা আজ তোমার পাওনা, চ্যাম্পিয়ন!", "তুমি জিতেছ, আর MC গর্বিত তোমার জন্য", "সাহস আর মেধায় আজ তুমিই সেরা", "স্যার-ম্যামরাও আজ তোমার স্কোরে মুগ্ধ!", "এমন উদ্যমী মেয়েই কলেজের অহংকার", "অভিনন্দন! ক্যাম্পাসের রানি আজ তুমিই"] } };
  var GN = { m: "ছেলে", f: "মেয়ে", x: "নিরপেক্ষ" };
  // বার্তার নতুন ২৪টা প্রশংসা ও অভিনন্দনের বাক্য: শুধু ড্রপডাউনে আলাদা দলে আসে; অটো বাছাই আগের মতোই (PZ_TX/GX থেকে)
  var PZ_PR = ["অভিনন্দন! তোমার মেধার আলোয় আজ পুরো ক্যাম্পাস উজ্জ্বল", "দারুণ খেলেছ! তোমার জন্য সবাই গর্বিত", "তোমার জ্ঞান আর একাগ্রতাকে স্যালুট!", "কলেজের প্রতিটি কোণ তোমার চেনা, সাবাশ চ্যাম্পিয়ন!", "এই জয় তোমার পরিশ্রমের সুন্দর পুরস্কার", "তুমি প্রমাণ করলে, চেষ্টা করলে সবই সম্ভব", "শুভেচ্ছা ও ভালোবাসা রইল তোমার এই সাফল্যে", "তোমার সাফল্য সবার জন্য অনুপ্রেরণা", "সেরাদের সেরা হওয়ার এই যাত্রা চলতে থাকুক", "অসাধারণ স্কোর! আরও বড় জয়ের পথে এগিয়ে যাও", "তোমার মতো এক্সপ্লোরারই আমাদের গর্ব", "হাসিমুখে উদযাপন করো, আজ দিনটা তোমার!", "মেধা, সাহস আর ধৈর্যের দারুণ জয়!", "অভিনন্দন! তোমার নামটা এখন লিডারবোর্ডের আলোয়", "তুমি শুধু বিজয়ী নও, তুমি অনুপ্রেরণা", "কলেজের সোনালি স্মৃতির সেরা গল্পে তোমার নাম", "এমন সাফল্যই বড় স্বপ্নের প্রথম ধাপ", "তোমার জন্য রইল অনেক অনেক শুভকামনা", "গর্বিত আমরা, তুমি আমাদেরই একজন!", "আজকের এই জয় সারাজীবন মনে রাখার মতো", "চমৎকার খেলেছ, এভাবেই এগিয়ে যাও!", "তোমার প্রতিভা আরও অনেক দূর যাবে, এই দোয়া রইল", "সাবাশ! পরিশ্রম কখনো বৃথা যায় না", "অভিনন্দন চ্যাম্পিয়ন, তোমার জয় আমাদের আনন্দ"];
  // আরও ৫০+৫০+৫০ নতুন লাইন (উপাধি/স্লোগান/প্রশংসা): শুধু ড্রপডাউনে আলাদা দলে; অটো বাছাই আগের মতোই। শুধু শেষে যোগ করবে।
  var PZ_NEW = {"b": ["🏆 ক্যাম্পাস চ্যাম্পিয়ন", "🥇 সেরা এক্সপ্লোরার", "👑 কলেজের মুকুট", "🌟 তারকা বিজয়ী", "💎 অমূল্য প্রতিভা", "🚀 সফলতার রকেট", "🎯 নিখুঁত লক্ষ্যভেদী", "🔥 জ্বলন্ত প্রতিভা", "⚡ বিদ্যুৎ-গতির সেরা", "🧠 মেধার সম্রাট", "📚 জ্ঞানের আলো", "🦁 সাহসী বিজয়ী", "🦅 উঁচু আকাশের বিজয়ী", "🌈 রঙিন প্রতিভা", "🏅 গর্বের পদক", "🎖 সম্মানিত বিজয়ী", "🧭 সেরা পথিক", "🗺 ক্যাম্পাস-মানচিত্রের রাজা", "🌿 সবুজ ক্যাম্পাসের গর্ব", "💫 উজ্জ্বল নক্ষত্র", "✨ জাদুকরী স্কোর", "🎓 মেধাবী শিক্ষার্থী", "🥳 উৎসবের বিজয়ী", "🎊 আনন্দের চ্যাম্পিয়ন", "🏆 মহা-বিজয়ী", "🔰 অদম্য যোদ্ধা", "🛡 অজেয় এক্সপ্লোরার", "🧩 ধাঁধার সমাধানকারী", "🔎 তীক্ষ্ণ দৃষ্টির এক্সপ্লোরার", "📍 প্রতিটি কোণার চেনা মুখ", "🌊 ঢেউ-জাগানো বিজয়ী", "☀️ আলোকিত প্রতিভা", "🌙 রাতজাগা সেরা", "🍀 ভাগ্যবান বিজয়ী", "🎁 পুরস্কারজয়ী সেরা", "🏁 ফিনিশ লাইনের বিজয়ী", "🥂 উদযাপনের সেরা", "🎤 আজকের তারকা", "🕌 ঈদের আনন্দ-বিজয়ী", "🌙 ঈদ মোবারক বিজয়ী", "🤝 সবার প্রিয় চ্যাম্পিয়ন", "📣 সবার মুখে তোমার নাম", "💪 পরিশ্রমের জয়", "🔝 শীর্ষ স্কোরার", "📈 উন্নতির সিঁড়ি-জয়ী", "🎬 গল্পের নায়ক", "🌠 স্বপ্নপূরণের বিজয়ী", "🧗 শিখর-জয়ী", "🏰 কলেজ-দুর্গের রক্ষক", "🔱 অনন্য বিজয়ী"], "m": ["তোমার এই জয়ে পুরো কলেজ আনন্দিত", "অসাধারণ পারফরমেন্স, অনেক অভিনন্দন!", "তোমার মেধা আমাদের অনুপ্রেরণা", "দারুণ! এভাবেই জ্বলজ্বল করো", "এই সাফল্য তোমার প্রাপ্য ছিল", "শুভকামনা রইল আরও বড় জয়ের জন্য", "তুমি সত্যিই দুর্দান্ত!", "তোমার পরিশ্রম আজ ফল দিল", "মুগ্ধ হলাম তোমার স্কোর দেখে", "কলেজের মুখ উজ্জ্বল করেছ তুমি", "এগিয়ে যাও, আকাশ তোমার জন্য", "সত্যিকারের এক্সপ্লোরার তুমি", "জয়ের এই আনন্দ ভাগ করে নাও সবার সাথে", "অভিনন্দন, আজ তোমার দিন!", "চমৎকার! তোমাকে নিয়ে গর্ব হয়", "তোমার জ্ঞানের গভীরতা অসাধারণ", "বন্ধুরাও আজ তোমাকে নিয়ে গর্বিত", "এমন সাফল্য সবাই পায় না, তুমি পেয়েছ", "শ্রেষ্ঠত্বের পথে আরও এক ধাপ", "মনের আনন্দে উদযাপন করো", "তোমার নাম এখন সেরাদের তালিকায়", "দুর্দান্ত খেলেছ, সাবাশ বন্ধু!", "স্বপ্নগুলো এভাবেই সত্যি হয়", "তুমি প্রমাণ করেছ মেধাই আসল শক্তি", "দোয়া ও ভালোবাসা রইল তোমার জন্য", "তোমার এই জয় সবার জন্য উপহার", "অনেক অনেক অভিনন্দন ও শুভেচ্ছা", "কলেজ আজ উৎসবের মেজাজে, কারণ তুমি", "জয় তোমার, আনন্দ আমাদের", "দারুণ কৌশল আর দারুণ জ্ঞান!", "সেরা হওয়ার অভ্যাস ধরে রেখো", "তোমার হাসিতেই জয়ের উজ্জ্বলতা", "একদম নিখুঁত খেলা, অভিনন্দন!", "সাফল্য তোমার পায়ে লুটিয়ে পড়ুক", "তুমি আছ বলেই এই খেলা এত মজার", "আজ তুমি গর্বের নাম", "আরও উঁচুতে ওঠো, শুভকামনা", "মেধা ও মনোযোগের অপূর্ব জয়", "এই জয় তোমার সাহসের পুরস্কার", "চ্যাম্পিয়নের মতোই খেলেছ!", "সবাই করতালি দিচ্ছে তোমার জন্য", "তোমার উদ্যমকে সালাম", "আজ থেকে তুমিও MC-র গর্বিত সেরা", "এমন স্কোর দেখে মন ভরে গেল", "উদ্যম থাকলে জয় আসবেই, তুমিই প্রমাণ", "চলতে থাকো, থামা চলবে না", "পুরস্কারের চেয়েও দামি তোমার প্রচেষ্টা", "বিজয়ের মুহূর্তটা মন ভরে উপভোগ করো", "তোমার জন্য রইল হৃদয় ছোঁয়া অভিনন্দন", "আরও অনেক জয় অপেক্ষা করছে তোমার"], "t": ["স্বপ্ন দেখো, জয় করো", "প্রতিটি পথে নতুন গল্প", "জানার আনন্দই আসল জয়", "কলেজ আমার, গর্ব আমার", "চলো ক্যাম্পাসে হারিয়ে যাই", "যে খেলে, সেই জেতে", "একটু চেষ্টা, অনেক আনন্দ", "স্মৃতির পথে নতুন মোড়", "MC-র প্রতিটি কোণ আপন", "মেধার লড়াইয়ে সবাই বিজয়ী", "শিখি, খেলি, এগিয়ে চলি", "ক্যাম্পাসের গল্প বলো স্কোরে", "জেতার নেশা, শেখার মজা", "তুমি পারবে, আমরা আছি", "সবুজ ক্যাম্পাস, সোনালি স্মৃতি", "বন্ধুদের সাথে খেলো, বন্ধুদের হারাও", "পরের চ্যাম্পিয়ন হয়তো তুমিই", "কলেজের ইতিহাস, তোমার হাতের মুঠোয়", "চোখ খোলো, কলেজ চেনো", "খুঁজে দেখো প্রতিটি কোণ", "জানার সীমা ছাড়িয়ে যাও", "কৌতূহলই তোমার শক্তি", "ক্যাম্পাস এক্সপ্লোর করো, জয় ঘরে তোলো", "এই খেলায় সবাই জেতে", "মজা করো, শেখো, জেতো", "হাসি, খেলা আর জয়", "সেরা হওয়ার যাত্রা শুরু হোক", "নিজেকে চ্যালেঞ্জ করো", "তোমার স্কোর, তোমার গর্ব", "প্রতিদিন নতুন চ্যালেঞ্জ", "কলেজ-জীবনের সেরা খেলা", "দেখি কে কত জানে!", "জ্ঞানের খেলায় জমে উঠুক আড্ডা", "একসাথে খেলি, একসাথে জিতি", "লিডারবোর্ডে নাম লেখাও", "এক ক্লিকেই শুরু হোক", "চলো এক্সপ্লোর করি", "কলেজের গল্প, তোমার কণ্ঠে", "স্মৃতি জাগাও, পুরস্কার জেতো", "ভাগ্য আর মেধার মিলন", "আজকের সেরা তুমি", "প্রতিটি উত্তরে একটু গর্ব", "হার মানা নয়, শেখাই আসল", "বড় স্বপ্ন, ছোট পদক্ষেপ", "বন্ধুকে ট্যাগ করো, চ্যালেঞ্জ দাও", "শেয়ার করো আনন্দ", "খেলো MC Explorer", "MC-র সেরারা এখানে", "জয়ের গল্প শুরু এখান থেকেই", "তোমার পালা, খেলে ফেলো!"]};
  // জেন্ডার: পোস্টারের জন্য আলাদা তথ্য সার্ভারে নেই, তাই (১) p.kind থাকলে সেটা, (২) না থাকলে নামের স্পষ্ট চিহ্ন দেখে আন্দাজ, (৩) বোঝা না গেলে "নিরপেক্ষ" (আগের লেখা)। অ্যাডমিন চাইলে ড্রপডাউনে হাতে ছেলে/মেয়ে ঠিক করে দিতে পারেন।
  function pzGuess(p) {
    var k = String(p.kind || p.role || p.gender || "").toLowerCase(), n = String(p.name || "").trim();
    if (/^(female|f|ছাত্রী|mam|ম্যাম)$/.test(k)) return "f"; if (/^(male|m|ছাত্র|sir|স্যার)$/.test(k)) return "m";
    if (/(মোছাঃ|মোসাঃ|মোসাম্মত|মোছা\.|খাতুন|বেগম|বানু|সুলতানা|নাহার|পারভীন|রানী|ফারজানা|ফারহানা|সুমাইয়া|ফাতেমা|ফাতিমা|আয়েশা|জান্নাত|ইয়াসমিন|নাসরিন|সানজিদা|সাদিয়া|শারমিন|সালমা|তানজিলা|তাসনিম|নুসরাত|মাহমুদা|হালিমা|রুমানা|সাবিনা)/.test(n)) return "f";
    if (/(^|\s)(মো|মোঃ|মোহাম্মদ|মুহাম্মদ|আব্দুল|আবদুল)(\s|$)/.test(n)) return "m";
    return "x";
  }
  function pzGender(p, S) { return S.g === "m" || S.g === "f" || S.g === "x" ? S.g : pzGuess(p); }
  // "__a" (অটো) হলে জেন্ডার অনুযায়ী তালিকা থেকে একটা বাছে (একই ব্যক্তির জন্য সবসময় একই); জেন্ডার অজানা হলে আগের লেখার তালিকা থেকে
  function pzPick(id, v, p, g) {
    if (v !== "__a") return v;
    var pool = g === "x" || !GX[id] ? PZ_TX[id] : GX[id][g], sum = 0, i, nm = String(p.name || ""); for (i = 0; i < nm.length; i++) sum += nm.charCodeAt(i);
    return pool[Math.floor(seeded(sum * 31 + (p.score || 0) * 7 + (p.rank || 1))() * pool.length) % pool.length];
  }
  // বিজয়ীর তথ্য বদল (শুধু পোস্টারের জন্য, সার্ভারে যায় না): PVO[কী] = { name, dept, batch, rank, score, tot, nophoto }
  var PVO = {}, pk = function (p) { return p.device || p.name; };
  var dTxt = function (p) { return p._dt != null ? p._dt : deptL(p.dept); };
  var applyV = function (p, o) {
    if (!o) return p; var q = Object.assign({}, p), has = function (k) { return o[k] != null; }, num = function (v) { v = String(v).replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }).replace(/[^0-9.]/g, ""); return v === "" ? null : +v; };
    if (has("name") && String(o.name).trim()) q.name = String(o.name).trim();
    if (has("dept")) q._dt = String(o.dept).trim(); if (has("batch")) q.batch = String(o.batch).trim();
    if (has("rank")) q.rank = num(o.rank); if (has("score")) q.score = num(o.score); if (has("tot")) q.tot = num(o.tot);
    return q;
  };
  var eff = function (p) { return applyV(p, PVO[pk(p)]); };
  var PZ_DEF = { pc: "auto", g: "a", d: 0, b: "__a", m: "__a", t: PZ_TX.t[0], f: "@url", h: "MC Explorer", qr: false, u: "", bs: 1, ms: 1, ma: "c", ts: 1, fs: 1, fa: "c" };
  function pcolOf(sv, T) { var v = sv && sv.pc, hex = /^#[0-9a-f]{6}$/i; if (v && v !== "auto" && hex.test(v)) return v; return hex.test(T.acc || "") ? T.acc : "#ffb300"; }
  function pillInk(h) { var m = /^#([0-9a-f]{6})$/i.exec(h || ""); if (!m) return "#10261b"; var n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#10261b" : "#ffffff"; }
  var urlTxt = function () { var h = (siteUrl() || "").replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, ""); return h ? "www." + h : "MC Explorer Challenge"; };
  function star(c, x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } c.closePath(); c.fill(); }
  function pzPat(c, T, rn, W, cyy) {
    var i, x, y, k; cyy = cyy || 470; c.save();
    if (T.pat === "rays") { c.translate(W / 2, cyy); for (i = 0; i < 18; i++) { c.rotate(Math.PI / 9); c.beginPath(); c.moveTo(0, 0); c.lineTo(-60, -900); c.lineTo(60, -900); c.closePath(); c.fillStyle = "rgba(255,214,102,.055)"; c.fill(); } }
    if (T.pat === "diamond") { c.strokeStyle = T.acc; c.globalAlpha = .13; c.lineWidth = 2; for (x = -40; x < W + 80; x += 90) for (y = -40; y < W + 80; y += 90) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.strokeRect(-28, -28, 56, 56); c.restore(); } }
    if (T.pat === "stripes") { c.fillStyle = "rgba(255,255,255,.09)"; for (i = -4; i < 12; i++) { c.save(); c.translate(i * 190, 0); c.rotate(-.5); c.fillRect(0, -300, 80, 2000); c.restore(); } }
    if (T.pat === "grid") { c.strokeStyle = T.acc; c.globalAlpha = .16; c.lineWidth = 1.5; for (i = 0; i <= W; i += 60) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, W); c.moveTo(0, i); c.lineTo(W, i); c.stroke(); } c.globalAlpha = .5; c.shadowColor = T.acc2; c.shadowBlur = 30; c.strokeStyle = T.acc2; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 860); c.lineTo(W, 860); c.stroke(); }
    if (T.pat === "dots") { c.fillStyle = "#fff"; c.globalAlpha = .1; for (x = 0; x < W; x += 44) for (y = 0; y < W; y += 44) { c.beginPath(); c.arc(x + (y / 44 % 2) * 22, y, ((x * y) % 7) + 3, 0, 7); c.fill(); } }
    if (T.pat === "stars") { for (i = 0; i < 46; i++) { c.fillStyle = i % 3 ? T.acc : "#fff"; c.globalAlpha = .12 + rn() * .28; star(c, rn() * W, rn() * W, 12 + rn() * 26); } }
    if (T.pat === "waves") { c.lineWidth = 3; for (k = 0; k < 14; k++) { c.strokeStyle = "rgba(255,255,255," + (.05 + k % 3 * .03) + ")"; c.beginPath(); for (x = 0; x <= W; x += 12) { y = 300 + k * 55 + Math.sin(x / 90 + k) * 26; if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); } }
    if (T.pat === "paper") { for (i = 0; i < 500; i++) { c.fillStyle = "rgba(90,60,20," + rn() * .07 + ")"; c.fillRect(rn() * W, rn() * W, 2, 2); } c.fillStyle = T.acc; c.globalAlpha = .9; c.fillRect(0, 0, W, 22); c.fillRect(0, W - 22, W, 22); }
    if (T.pat === "rings") { c.strokeStyle = T.acc; c.lineWidth = 2; for (i = 260; i < 900; i += 70) { c.globalAlpha = Math.max(.05, .3 - i / 3600); c.beginPath(); c.arc(W / 2, cyy, i, 0, 7); c.stroke(); } }
    if (T.pat === "bubbles") { c.strokeStyle = T.acc; c.lineWidth = 3; for (i = 0; i < 40; i++) { c.globalAlpha = .08 + rn() * .14; c.beginPath(); c.arc(rn() * W, rn() * W, 14 + rn() * 60, 0, 7); c.stroke(); } }
    if (T.pat === "clouds") { c.fillStyle = "#fff"; for (k = 0; k < 7; k++) { x = rn() * W; y = 120 + rn() * 800; c.globalAlpha = .35; for (i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x + i * 46, y + (i % 2) * 14, 60 + rn() * 30, 34 + rn() * 16, 0, 0, 7); c.fill(); } } }
    if (T.pat === "burst") { c.translate(W / 2, cyy); for (i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -950); c.lineTo(40, -950); c.closePath(); c.fillStyle = i % 2 ? "rgba(255,255,255,.10)" : "rgba(255,230,120,.10)"; c.fill(); } }
    if (T.pat === "checker") { c.fillStyle = "#000"; c.globalAlpha = .07; for (x = 0; x < W; x += 60) for (y = 0; y < W; y += 60) if ((x / 60 + y / 60) % 2 === 0) c.fillRect(x, y, 60, 60); }
    if (T.pat === "sparkle" || T.pat === "cosmos") { for (i = 0; i < 70; i++) { c.fillStyle = i % 4 ? "#fff" : T.acc; c.globalAlpha = .2 + rn() * .6; x = rn() * W; y = rn() * W; k = 2 + rn() * 7; c.beginPath(); if (i % 6 === 0) { c.moveTo(x, y - k * 3); c.lineTo(x + k, y); c.lineTo(x, y + k * 3); c.lineTo(x - k, y); c.closePath(); } else c.arc(x, y, k / 2, 0, 7); c.fill(); }
      if (T.pat === "cosmos") { c.strokeStyle = T.acc2; c.lineWidth = 6; c.globalAlpha = .3; c.beginPath(); c.ellipse(110, 380, 95, 26, -.5, 0, 7); c.stroke(); } }
    if (T.pat === "lines") { c.strokeStyle = T.acc; c.globalAlpha = .1; c.lineWidth = 2; for (i = -W; i < W * 2; i += 36) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + W, W); c.stroke(); } }
    c.restore();
  }
  // লম্বা লেখা ঠিক করে বসায়: আগে একটু ছোট করে এক লাইনে; না হলে শব্দ বা / - . , দেখে ২ লাইনে ভেঙে; তারপরও না হলে ছোট করে শেষে … দিয়ে কাটে। ফেরত: { l: [লাইন...], s: ফন্ট-সাইজ }
  function pzLines(c, t, maxW, size, wt, fam, minOne, minTwo) {
    t = String(t == null ? "" : t).replace(/\s+/g, " ").trim();
    var m = function (x, z) { c.font = wt + " " + z + "px " + fam; return c.measureText(x).width; }, z, i, k, a, b, best, bw, cand = [];
    for (z = size; z >= minOne; z -= 2) if (m(t, z) <= maxW) return { l: [t], s: z };
    for (i = 1; i < t.length; i++) if (/[ \/\-.,]/.test(t.charAt(i - 1))) cand.push(i);
    for (z = Math.min(size, 36); z >= minTwo; z -= 2) {
      best = null; bw = 1e9;
      for (k = 0; k < cand.length; k++) { a = t.slice(0, cand[k]).trim(); b = t.slice(cand[k]).trim(); if (!a || !b) continue; var w = Math.max(m(a, z), m(b, z)); if (w < bw) { bw = w; best = [a, b]; } }
      if (best && bw <= maxW) return { l: best, s: z };
    }
    z = Math.min(minOne, 24); var o = t; while (t.length > 1 && m(t, z) > maxW) t = t.slice(0, -1);
    if (t !== o) { while (t.length > 1 && m(t + "…", z) > maxW) t = t.slice(0, -1); t += "…"; }
    return { l: [t], s: z };
  }
  // S = { d: ডিজাইন নম্বর, b: ব্যাজ, m: বার্তা, t: স্লোগান, f: নিচের লাইন, h: শিরোনাম, qr: QR চালু/বন্ধ }; sc = 1 (১০৮০) বা 2 (২১৬০, HD)
  function drawPoster(p, photo, S, logos, sc) {
    var W = 1080, cv = document.createElement("canvas"); sc = sc || 1; cv.width = W * sc; cv.height = W * sc; var c = cv.getContext("2d"), A = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN","Kalpurush","Siyam Rupali",sans-serif', H = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN","Kalpurush","Siyam Rupali",sans-serif', T = PZ_TH[S.d] || PZ_TH[0], qr = !!S.qr, cx = W / 2, cy = 470, R = 170, g, i, x, y;
    c.scale(sc, sc);
    // ---- লেআউট হিসাব: যে লেখা খালি, তার জায়গা বাদ; বাকি অংশ ফাঁকা সমানভাবে ভাগ হয়ে পুরো কার্ড সুন্দর ভরে ----
    var has = function (v) { return String(v == null ? "" : v).trim(); }, SZ = function (v) { v = +v; return v === 0 ? .8 : v === 2 ? 1.2 : 1; }, AL = function (v) { return v === "l" || v === "r" ? v : "c"; };
    var PG = pzGender(p, S), hd = S.h == null ? "MC Explorer" : has(S.h), st = has(S.t), bt = has(pzPick("b", S.b, p, PG)), mt = has(pzPick("m", S.m, p, PG)), ft = has(String(S.f == null ? "" : S.f).replace("@url", urlTxt())), ut = has(S.u),
      kb = SZ(S.bs), kt = SZ(S.ts), km = SZ(S.ms), kf = SZ(S.fs), ma = AL(S.ma), fa = AL(S.fa), RL = 70, RR = qr ? 830 : 1010, CW = qr ? 580 : 920, bh = Math.round(74 * kb),
      hasChips = [dTxt(p), p.batch].filter(Boolean).length > 0;
    var ml = mt ? pzLines(c, mt, ma === "c" ? CW : RR - RL, Math.round(40 * km), "700", H, Math.round(30 * km), Math.round(22 * km)) : null,
      fl = ft ? pzLines(c, ft, Math.min(880, (fa === "c" ? CW : RR - RL) - 60), Math.round(28 * kf), "600", H, 22, 16) : null,
      ul = ut ? pzLines(c, ut, fa === "c" ? CW : RR - RL, Math.round(26 * kf), "600", H, 16, 14) : null;
    var hM = ml ? ml.s * .8 + (ml.l.length - 1) * (ml.s + 4) + ml.s * .3 : 0, hK = p.score != null ? 38 : 0, f2 = !!(fl && fl.l.length > 1), fh = fl ? Math.round(f2 ? fl.s * 2 + 20 : fl.s * 2) : 0, hU = ul ? ul.l.length * (ul.s + 6) : 0,
      parts = [hM, hK, fh, hU].filter(function (v) { return v > 0; }), hbT = parts.reduce(function (a, b) { return a + b; }, 0) + 14 * Math.max(0, parts.length - 1), hb = qr ? Math.max(hbT, 186) : hbT,
      topEnd = bt ? 190 + bh + 6 : st ? 180 : 168, midH = hasChips ? 552 : 500, fr = 1080 - topEnd - midH - hb,
      gs = fr >= 72 ? [12, 8, 52].map(function (v) { return v + (fr - 72) / 3; }) : [12, 8, 52].map(function (v) { return Math.max(4, v * fr / 72); }), midTop = topEnd + gs[0], yB;
    cy = midTop + 188; yB = midTop + midH + gs[1];
    g = c.createLinearGradient(0, 0, W, W); g.addColorStop(0, T.bg[0]); g.addColorStop(.5, T.bg[1]); g.addColorStop(1, T.bg[2]); c.fillStyle = g; c.fillRect(0, 0, W, W);
    var rn = seeded((p.score || 0) * 7 + (p.rank || 3) + p.name.length * 13 + 11); pzPat(c, T, rn, W, cy);
    g = c.createRadialGradient(cx, cy, 40, cx, cy, 520); g.addColorStop(0, T.light ? "rgba(255,255,255,.6)" : T.pat === "rays" ? "rgba(255,214,102,.28)" : "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, W, W);
    if (T.cf) { var cs = [T.acc, "#ffffff", "#ff7aa8", "#7ee0a8", "#7cc4ff"]; for (i = 0; i < 90; i++) { x = rn() * W; y = rn() * W; if (x > 250 && x < 830 && y > cy - 170 && y < cy + 180) continue; c.save(); c.translate(x, y); c.rotate(rn() * 6); c.fillStyle = cs[Math.floor(rn() * cs.length)]; c.globalAlpha = .55 + rn() * .4; if (rn() > .5) c.fillRect(-7, -4, 14, 8); else { c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill(); } c.restore(); } }
    c.strokeStyle = T.acc; c.globalAlpha = .85; c.lineWidth = T.dbl ? 10 : 6; rr(c, 22, 22, W - 44, W - 44, T.pat === "paper" ? 8 : 34); c.stroke(); if (T.dbl) { c.lineWidth = 2; rr(c, 44, 44, W - 88, W - 88, 24); c.stroke(); } c.globalAlpha = 1;
    if (logos[0]) c.drawImage(logos[0], 60, 52, 110 * logos[0].width / logos[0].height, 110); if (logos[1]) { var lw = 110 * logos[1].width / logos[1].height; c.drawImage(logos[1], W - 60 - lw, 52, lw, 110); }
    c.textAlign = "center";
    if (hd) { c.fillStyle = T.acc; fit(c, hd, 600, 68, "800", A); c.fillText(hd, W / 2, 112); }
    if (st) { c.fillStyle = T.ink; c.globalAlpha = .9; fit(c, st, 860, Math.round(30 * kt), "500", H); c.fillText(st, W / 2, hd ? 158 : 138); c.globalAlpha = 1; }
    if (bt) {
      fit(c, bt, 640, Math.round(44 * kb), "800", A); var bw = Math.max(Math.round(420 * kb), Math.min(820, c.measureText(bt).width + 90));
      g = c.createLinearGradient(0, 190, 0, 190 + bh); g.addColorStop(0, T.bd[0]); g.addColorStop(1, T.bd[1]); c.fillStyle = g; rr(c, (W - bw) / 2, 190, bw, bh, bh / 2); c.fill(); c.fillStyle = T.bi; c.fillText(bt, W / 2, 190 + Math.round(bh * .7));
    }
    var shape = function (r) { c.beginPath(); if (T.av === "c") c.arc(cx, cy, r, 0, 7); else rr(c, cx - r, cy - r, 2 * r, 2 * r, T.av === "h" ? r * .85 : r * .34); };
    c.save(); c.shadowColor = T.acc; c.shadowBlur = 40; shape(R + 18); c.fillStyle = T.acc; c.fill(); c.restore();
    shape(R + 6); c.fillStyle = "#fff"; c.fill();
    c.save(); shape(R); c.clip();
    if (photo) { var s = Math.max(2 * R / photo.width, 2 * R / photo.height); c.drawImage(photo, cx - photo.width * s / 2, cy - photo.height * s / 2, photo.width * s, photo.height * s); }
    else { g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, T.acc2); g.addColorStop(1, T.bg[0]); c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.fillStyle = "#fff"; c.font = "800 190px " + A; c.fillText(Array.from(String(p.name).trim())[0] || "★", cx, cy + 66); }
    c.restore();
    if (p.rank) { c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 14; c.beginPath(); c.arc(cx + 140, cy + 140, 66, 0, 7); c.fillStyle = T.bd[1]; c.fill(); c.restore(); c.lineWidth = 6; c.strokeStyle = "#fff"; c.stroke(); c.fillStyle = "#fff"; c.font = "600 22px " + H; c.fillText(String(S.rl || "র‍্যাংক"), cx + 140, cy + 128); c.font = "800 44px " + A; c.fillText("#" + bd(p.rank), cx + 140, cy + 176); }
    c.fillStyle = T.ink; fit(c, p.name, 900, 90, "800", A); c.fillText(p.name, W / 2, cy + 278);
    var chips = [dTxt(p), p.batch].filter(Boolean); if (chips.length) { c.font = "600 32px " + H; var tw = chips.map(function (t) { return c.measureText(t).width + 44; }), tot = tw.reduce(function (a, b) { return a + b; }, 0) + 14 * (chips.length - 1), x0 = (W - tot) / 2; chips.forEach(function (t, k) { c.fillStyle = T.light ? "rgba(0,0,0,.09)" : "rgba(255,255,255,.16)"; rr(c, x0, cy + 308, tw[k], 56, 28); c.fill(); c.fillStyle = T.ink; c.textAlign = "left"; c.fillText(t, x0 + 22, cy + 347); x0 += tw[k] + 14; }); c.textAlign = "center"; }
    // নিচের অংশ: বার্তা (অভিনন্দন) · মার্ক · নিচের শেপ (MC Explorer Challenge) · ইউআরএল — যেটা খালি সেটা আসে না। বার্তা/শেপ সাইজ ও বাম-মাঝ-ডান আলাদা করে ঠিক হয়; ডিফল্ট মাঝ = কার্ডের ঠিক মাঝখানে (QR থাকলেও)
    var ay = function (v) { return v === "l" ? RL : v === "r" ? RR : W / 2; }, aa = function (v) { return v === "l" ? "left" : v === "r" ? "right" : "center"; }, yy = yB + (hb - hbT) / 2, ln;
    if (ml) {
      c.fillStyle = T.acc; c.font = "700 " + ml.s + "px " + H; c.textAlign = aa(ma);
      for (ln = 0; ln < ml.l.length; ln++) c.fillText(ml.l[ln], ay(ma), yy + ml.s * .8 + ln * (ml.s + 4));
      yy += hM + 14;
    }
    if (hK) { c.fillStyle = T.ink; c.globalAlpha = .92; c.font = "600 32px " + H; c.textAlign = aa(ma); c.fillText(String(S.ml || "মার্ক") + " " + bd(p.score) + " / " + bd(p.tot != null ? p.tot : 1000), ay(ma), yy + 26); c.globalAlpha = 1; yy += hK + 14; }
    if (fl) {
      c.font = "600 " + fl.s + "px " + H; var fw = Math.min(CW === 920 ? 960 : (fa === "c" ? CW : RR - RL), Math.max.apply(null, fl.l.map(function (z) { return c.measureText(z).width; })) + 60), fx = fa === "l" ? RL : fa === "r" ? RR - fw : (W - fw) / 2, lg = fl.s + 4, b1 = yy + fh / 2 - (f2 ? lg / 2 : 0) + fl.s * .35;
      var flc = S.pc && S.pc !== "auto" && /^#[0-9a-f]{6}$/i.test(S.pc) && (String(S.f == null ? "" : S.f).indexOf("@url") >= 0 || ft.indexOf(urlTxt()) >= 0) ? S.pc : null;   // লিংক-সহ নিচের শেপে বাছা রঙ বসে
      c.fillStyle = flc || (T.light ? "rgba(0,0,0,.1)" : "rgba(0,0,0,.35)"); rr(c, fx, yy, fw, fh, Math.min(28, fh / 2)); c.fill();
      c.fillStyle = flc ? pillInk(flc) : T.ink; c.textAlign = "center"; for (ln = 0; ln < fl.l.length; ln++) c.fillText(fl.l[ln], fx + fw / 2, b1 + ln * lg);
      yy += fh + 14;
    }
    if (ul) {
      c.fillStyle = T.ink; c.globalAlpha = .88; c.font = "600 " + ul.s + "px " + H; c.textAlign = aa(fa);
      if (ul.l.length >= 1) { var uw = Math.max.apply(null, ul.l.map(function (z) { return c.measureText(z).width; })), ux = ay(fa), ustart = aa(fa) === "center" ? ux - uw / 2 : aa(fa) === "right" ? ux - uw : ux, ubase = yy + ul.s * .8, ut = ubase - ul.s * .85, uh = ul.s * 1.1 + (ul.l.length - 1) * (ul.s + 6), upd = 4;
        c.globalAlpha = 1; c.fillStyle = pcolOf(S, T); c.beginPath(); if (c.roundRect) c.roundRect(ustart - upd, ut - upd, uw + upd * 2, uh + upd * 2, (uh + upd * 2) / 2); else c.rect(ustart - upd, ut - upd, uw + upd * 2, uh + upd * 2); c.fill();
        c.fillStyle = pillInk(pcolOf(S, T)); c.globalAlpha = .95; }
      for (ln = 0; ln < ul.l.length; ln++) c.fillText(ul.l[ln], ay(fa), yy + ul.s * .8 + ln * (ul.s + 6));
      c.globalAlpha = 1;
    }
    c.textAlign = "center";
    if (qr && window.makeQR) { var q = window.makeQR(S.qa || siteUrl() || (/^https?:/.test(location.origin) ? location.origin + "/" : "https://example.com/")); if (q) { var Q = 170, px = W - 60 - Q, py = yB + (hb - 186) / 2 + 8, u = Q / q.size; c.fillStyle = "#fff"; rr(c, px - 8, py - 8, Q + 16, Q + 16, 18); c.fill(); c.fillStyle = "#000"; for (y = 0; y < q.size; y++) for (x = 0; x < q.size; x++) if (q.dark(x, y)) c.fillRect(px + x * u, py + y * u, u + .6, u + .6); } }
    return cv;
  }

  // ✏️ সম্পাদিত বিজয়ী কার্ড: কোড "e<ডিজাইন>.<base64url(JSON)>" — JSON = { s: ডিজাইন-সেটিংয়ের বদল, v: বিজয়ীর তথ্যের বদল }। ছোট লেখা মাত্র, ছবি জমা হয় না; ফোনে আবার আঁকা হয়।
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  var VK = ["name", "dept", "batch", "rank", "score", "tot", "nophoto"];
  // ড্রপডাউনের তৈরি লাইন সেভে পুরো লেখা নয়, শুধু ক্রমিক নম্বর জমে (স্টোরেজ কম)। ⚠️ নিয়ম: এই লাইন-তালিকাগুলোতে নতুন লাইন শুধু শেষে যোগ হবে; আগের লাইন সরালে/ক্রম বদলালে সেভ করা পুরোনো কার্ডের লেখা উল্টে যাবে। নিজের টাইপ করা লেখা আগের মতো পুরো লেখাই জমে।
  var PZ_H = ["MC Explorer", "MC Explorer Challenge"], RF = ["h", "b", "m", "t", "f"];
  function refList(id) { return id === "h" ? PZ_H : PZ_TX[id].concat(GX[id] ? GX[id].m.concat(GX[id].f) : [], id === "m" ? PZ_PR : [], PZ_NEW[id] || []); }
  function encEdit(S, v) {
    var d = PZ_TH[S.d] ? +S.d : 0, s = {}, o, vv = {};
    Object.keys(S).forEach(function (k) { if (k === "d" || k === "lgo" || k.charAt(0) === "_") return; if (JSON.stringify(S[k]) !== JSON.stringify(PZ_DEF[k])) s[k] = S[k]; });
    RF.forEach(function (k) { if (typeof s[k] === "string" && s[k] !== "") { var ix = refList(k).indexOf(s[k]); if (ix >= 0) s[k] = ix; } });
    VK.forEach(function (k) { if (v && v[k] != null) vv[k] = v[k]; });
    o = { s: s }; if (Object.keys(vv).length) o.v = vv;
    var lo = window.mcLogo && window.mcLogo.ovNorm ? window.mcLogo.ovNorm(S.lgo) : null;   // বাম/ডান লোগো (শুধু ছোট নম্বর/অক্ষর) কোডে সেভ হয়
    if (lo) { var gg = {}; if (lo.l != null) gg.l = lo.l; if (lo.r != null) gg.r = lo.r; if (lo.tl) gg.tl = lo.tl; if (lo.tr) gg.tr = lo.tr; o.g = gg; }
    var code = "e" + d + "." + b64e(JSON.stringify(o)); return code.length <= 1600 ? code : null;
  }
  function decEdit(code) {
    var m = /^e(\d{1,2})\.([A-Za-z0-9_-]+)$/.exec(String(code || "")); if (!m || +m[1] > 19) return null;
    try { var o = JSON.parse(b64d(m[2])); if (o && o.s) RF.forEach(function (k) { if (typeof o.s[k] === "number") o.s[k] = refList(k)[o.s[k]] || ""; }); var sx = o && typeof o.s === "object" && o.s ? o.s : {}; if (o && o.g && typeof o.g === "object") sx = Object.assign({}, sx, { lgo: { l: o.g.l == null ? null : +o.g.l, r: o.g.r == null ? null : +o.g.r, tl: String(o.g.tl || "").slice(0, 3), tr: String(o.g.tr || "").slice(0, 3) } });
      return { d: +m[1], s: sx, v: o && typeof o.v === "object" && o.v ? o.v : {} }; } catch (e) { return null; }
  }
  function codeD(code) { var m = /^[we](\d{1,2})/.exec(String(code || "")); return m ? +m[1] : 0; }
  // সম্পাদিত কার্ডের নিজের বাম/ডান লোগো থাকলে সেগুলো বসানো লোগো-জোড়া (প্রমিস); না থাকলে base-ই ফেরে
  function ltrImg(t) {
    t = String(t || "").trim().slice(0, 3); if (!t) return null;
    var k = document.createElement("canvas"); k.width = k.height = 220; var g = k.getContext("2d");
    g.fillStyle = "#10261b"; g.beginPath(); g.arc(110, 110, 104, 0, 6.2832); g.fill(); g.lineWidth = 8; g.strokeStyle = "#e0b84a"; g.stroke();
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 " + (t.length > 2 ? 70 : t.length > 1 ? 88 : 112) + 'px "Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI",sans-serif'; g.fillText(t, 110, 116);
    return k;
  }
  function lgFor(code, base) {
    var e = decEdit(code), o = e && e.s && e.s.lgo, M = window.mcLogo; base = base || [];
    if (!o || !M || !M.img || (o.l == null && o.r == null)) return Promise.resolve(base);
    var side = function (v, tx, i) { if (v == null) return Promise.resolve(base[i]); if (v === 0) return Promise.resolve(ltrImg(tx)); return Promise.resolve(M.img(v, i)).then(function (x) { return x || base[i]; }, function () { return base[i]; }); };
    var go = function () { return Promise.all([side(o.l, o.tl, 0), side(o.r, o.tr, 1)]); };
    return M.load ? Promise.resolve(M.load()).then(go, go) : go();
  }
  function drawCode(p, photo, code, lg, sc) {   // কোড w<N> (ডিফল্ট ডিজাইন N) বা e... (সম্পাদিত)
    var m = /^w(\d{1,2})$/.exec(String(code || ""));
    if (m) return drawPoster(p, photo, Object.assign({}, PZ_DEF, { d: +m[1] }), lg, sc || 1);
    var e = decEdit(code); if (!e) throw new Error("code");
    return drawPoster(applyV(p, e.v), e.v.nophoto ? null : photo, Object.assign({}, PZ_DEF, e.s, { d: e.d }), lg, sc || 1);
  }
  window.MCPoster = { TH: PZ_TH, TX: PZ_TX, GX: GX, GN: GN, PR: PZ_PR, NEW: PZ_NEW, DEF: PZ_DEF, draw: drawPoster, guess: pzGuess, gender: pzGender, pick: pzPick, roman: roman, ascii: ascii, li: li, seeded: seeded,
    PVO: PVO, pk: pk, dTxt: dTxt, eff: eff, urlTxt: urlTxt, lines: pzLines, star: star, pcolOf: pcolOf, pillInk: pillInk, applyV: applyV, lgFor: lgFor, enc: encEdit, dec: decEdit, codeD: codeD, drawCode: drawCode };
})();

// অ্যাডমিন: "📣 সোশ্যাল" — ফেসবুক/ইনস্টাগ্রামের জন্য টেমপ্লেট (পোস্ট ১০৮০×১৩৫০, স্টোরি ১০৮০×১৯২০)।
// SQL লাগে না: ডেটা বিদ্যমান RPC mc2_board (তারিখ/বিভাগ/সেশন ফিল্টার সার্ভারেই আছে), mc2_top_cards (সেরা ৩-এর ছবি) ও mc2_draw_admin_list (লাকি ড্র) থেকে।
// ছবি ফোনের ক্যানভাসেই আঁকা (social-draw.js); সার্ভারে কিছু জমা/আপলোড হয় না। শুধু সুইচ ও সেটিং এই ব্রাউজারে (localStorage) মনে থাকে।
// আইপি/ফোন/ডিভাইস কখনো আসে না: নিচে rows বানানোর সময় শুধু নাম, বিভাগ, সেশন, স্কোর, র‍্যাংক (আর হিসাব-করা "বেড়েছে/জন" লেখা) রাখা হয়।
// ধরন (per): দৈনিক · সাপ্তাহিক · মাসিক · বিভাগ-ভিত্তিক · সেশন-ভিত্তিক · লাকি ড্র · উন্নতি · নতুন রেকর্ড · বিভাগ বনাম বিভাগ · অংশগ্রহণ · ধন্যবাদ · রিমাইন্ডার
// টেমপ্লেট (kind): ঘোষণা · স্কোর বোর্ড · র‍্যাংক · পোডিয়াম (অংশগ্রহণ = পরিসংখ্যান কার্ড, ধন্যবাদ/রিমাইন্ডার = বার্তা কার্ড; এ তিনটির নিজস্ব সাজানো)
// লোড-ক্রম: admin-survey.js-এর পরে, admin.js-এর আগে। (social-draw.js ও poster-draw.js আগে লোড হয়)
(function () {
  var M = null, SK = "mc2_soc_v1";
  // ভাগ ৫: ট্যাব না খুলেও (যেমন ডাউনলোড-ফোল্ডার থেকে এডিট জানালা) ডেটা-ডাকা চলে — আগে M শুধু ট্যাব খুললে বসত, তাই "আঁকা যায়নি" আসত
  (function () { var f = function () { M = M || window.MCA || null; }; if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f); else f(); })();
  window.MCA_TABS = (window.MCA_TABS || []).concat([["social", "📣 সোশ্যাল"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { social: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  var PER = { day: "দৈনিক", week: "সাপ্তাহিক", month: "মাসিক", dept: "বিভাগ-ভিত্তিক", sess: "সেশন-ভিত্তিক", lucky: "🎁 লাকি ড্র", imp: "📈 উন্নতি", rec: "🏆 নতুন রেকর্ড", dvd: "⚔️ বিভাগ বনাম বিভাগ", part: "👥 অংশগ্রহণ", thx: "🙏 ধন্যবাদ", rem: "⏰ রিমাইন্ডার", cert: "🎓 সার্টিফিকেট" };
  var PER_W = ["day", "week", "month", "dept", "sess", "lucky"], PER_O = ["imp", "rec", "dvd", "part", "thx", "rem", "cert"];
  var PRE_RANGE = { day: "today", week: "week0", month: "month0", dept: "week0", sess: "week0", lucky: "all", imp: "week0", rec: "week0", dvd: "week0", part: "week0", thx: "week0", rem: "week0", cert: "all" };
  var STD = ["announce", "board", "rank", "podium"];
  var ALLOW = { day: STD, week: STD, month: STD, dept: STD, sess: STD, lucky: STD, imp: STD, rec: ["announce", "rank"], dvd: ["board", "podium"], part: ["stats"], thx: ["msg"], rem: ["msg"], cert: ["cert"] };
  var CERT_PRE = [["অংশগ্রহণ সনদ", "MC Explorer Challenge-এ সক্রিয় অংশগ্রহণের জন্য এই সনদ প্রদান করা হলো।"], ["প্রশংসাপত্র", "চমৎকার পারফরম্যান্সের জন্য আন্তরিক প্রশংসা ও অভিনন্দন।"], ["সম্মাননা সনদ", "জ্ঞান ও মেধার প্রতি নিষ্ঠার স্বীকৃতিস্বরূপ এই সম্মাননা প্রদান করা হলো।"], ["কৃতিত্ব সনদ", "{score} স্কোর অর্জন করে কৃতিত্বের স্বাক্ষর রাখার জন্য এই সনদ প্রদান করা হলো।"], ["সাফল্যের সনদ", "উল্লেখযোগ্য সাফল্য অর্জনের জন্য অভিনন্দন ও শুভকামনা।"], ["শ্রেষ্ঠত্বের সনদ", "শ্রেষ্ঠত্বের পথে অনন্য অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["চ্যাম্পিয়ন সনদ", "অসাধারণ দক্ষতায় চ্যাম্পিয়ন হওয়ার জন্য অভিনন্দন।"], ["বিজয়ী সনদ", "{score} স্কোর করে {rank} নম্বর স্থান অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["রানার-আপ সনদ", "প্রতিযোগিতায় রানার-আপ হওয়ার গৌরব অর্জনের জন্য অভিনন্দন।"], ["তৃতীয় স্থানাধিকারী সনদ", "{score} স্কোর করে তৃতীয় স্থান অর্জনের জন্য অভিনন্দন।"], ["সেরা পারফরমার সনদ", "{score} স্কোর করে সেরা পারফরমারদের একজন হয়েছেন।"], ["প্রশংসনীয় অর্জন সনদ", "প্রশংসনীয় অর্জনের জন্য আন্তরিক অভিনন্দন ও সম্মান জানানো হলো।"], ["সম্মানিত অংশগ্রহণকারী সনদ", "প্রতিযোগিতায় সম্মানিত অংশগ্রহণকারী হিসেবে এই সনদ প্রদান করা হলো।"], ["মেধা সম্মাননা", "মেধা ও পরিশ্রমের স্বীকৃতিস্বরূপ এই সম্মাননা প্রদান করা হলো।"], ["জ্ঞান-অন্বেষণ সনদ", "জানার আগ্রহ ও অনুসন্ধিৎসার জন্য এই সনদ প্রদান করা হলো।"], ["সেরা জ্ঞানী সনদ", "কলেজের জায়গা সম্পর্কে অসাধারণ জ্ঞানের জন্য এই সনদ প্রদান করা হলো।"], ["শীর্ষ স্কোরার সনদ", "{score} স্কোর করে শীর্ষ স্কোরারের আসন অর্জনের জন্য অভিনন্দন।"], ["গৌরবের সনদ", "গৌরবময় অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["অনন্য কৃতিত্ব সনদ", "অনন্য কৃতিত্বের জন্য অকুণ্ঠ প্রশংসা ও শুভেচ্ছা।"], ["সম্মানসূচক সনদ", "ধারাবাহিক সাফল্যের সম্মানসূচক স্বীকৃতি হিসেবে এই সনদ প্রদান করা হলো।"], ["অর্জনের সনদ", "{score} স্কোর অর্জনের এই মাইলফলকের জন্য অভিনন্দন।"], ["উৎকর্ষের সনদ", "উৎকর্ষের প্রতি অঙ্গীকারের স্বীকৃতিস্বরূপ এই সনদ প্রদান করা হলো।"], ["মেধাবী সনদ", "মেধার স্বাক্ষর রাখার জন্য এই সনদ প্রদান করা হলো।"], ["দক্ষতার সনদ", "দক্ষতা ও একাগ্রতার জন্য এই সনদ প্রদান করা হলো।"], ["উজ্জ্বল নক্ষত্র সনদ", "উজ্জ্বল পারফরম্যান্সে সবার দৃষ্টি কাড়ার জন্য অভিনন্দন।"], ["গর্বিত অর্জন সনদ", "প্রতিযোগিতায় গর্বিত অর্জনের জন্য শুভেচ্ছা ও অভিনন্দন।"], ["সাপ্তাহিক বিজয়ী সনদ", "এই সপ্তাহের বিজয়ী হওয়ার জন্য অভিনন্দন।"], ["মাসিক বিজয়ী সনদ", "এই মাসের বিজয়ী হওয়ার জন্য অভিনন্দন।"], ["বিভাগ-সেরা সনদ", "নিজ বিভাগে সর্বোচ্চ স্কোর অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["সেশন-সেরা সনদ", "নিজ সেশনে সর্বোচ্চ স্কোর অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["উন্নতির সনদ", "ধারাবাহিক উন্নতির জন্য প্রশংসা ও অভিনন্দন।"], ["নতুন রেকর্ড সনদ", "নতুন রেকর্ড স্থাপনের গৌরবের জন্য এই সনদ প্রদান করা হলো।"], ["ধারাবাহিকতার সনদ", "নিয়মিত অংশগ্রহণ ও ধারাবাহিকতার জন্য এই সনদ প্রদান করা হলো।"], ["অনুপ্রেরণার সনদ", "অন্যদের অনুপ্রাণিত করার জন্য কৃতজ্ঞতাসহ এই সনদ প্রদান করা হলো।"], ["স্বর্ণ সম্মাননা", "স্বর্ণালী সাফল্যের স্বীকৃতিস্বরূপ এই সম্মাননা প্রদান করা হলো।"], ["রৌপ্য সম্মাননা", "রৌপ্যোজ্জ্বল অর্জনের স্বীকৃতিস্বরূপ এই সম্মাননা প্রদান করা হলো।"], ["ব্রোঞ্জ সম্মাননা", "ব্রোঞ্জ পদকের মতো গৌরবময় অর্জনের জন্য এই সম্মাননা প্রদান করা হলো।"], ["বিশেষ সম্মাননা", "বিশেষ অবদান ও অর্জনের জন্য এই সম্মাননা প্রদান করা হলো।"], ["শ্রেষ্ঠ প্রতিযোগী সনদ", "প্রতিযোগিতায় শ্রেষ্ঠ প্রতিযোগীর স্বীকৃতিস্বরূপ এই সনদ প্রদান করা হলো।"], ["কৃতী শিক্ষার্থী সনদ", "কৃতী শিক্ষার্থী হিসেবে অর্জনের জন্য অভিনন্দন।"], ["জয়ের সনদ", "জয়ের গৌরব অর্জনের জন্য আন্তরিক অভিনন্দন।"], ["স্বীকৃতির সনদ", "আপনার প্রচেষ্টার প্রতি আন্তরিক স্বীকৃতি জানিয়ে এই সনদ প্রদান করা হলো।"], ["সাধুবাদ সনদ", "অসাধারণ উদ্যমের জন্য সাধুবাদ ও শুভেচ্ছা।"], ["আদর্শ অংশগ্রহণকারী সনদ", "আদর্শ অংশগ্রহণকারী হিসেবে প্রতিযোগিতাকে সমৃদ্ধ করার জন্য ধন্যবাদ।"], ["প্রতিভার সনদ", "প্রতিভার উজ্জ্বল প্রকাশের জন্য এই সনদ প্রদান করা হলো।"], ["মননের সনদ", "মেধা ও মননের সমন্বয়ে সাফল্যের জন্য এই সনদ প্রদান করা হলো।"], ["গৌরবমুকুট সনদ", "গৌরবমুকুট অর্জনের জন্য আন্তরিক অভিনন্দন।"], ["সম্মানিত বিজয়ী সনদ", "সম্মানিত বিজয়ী হিসেবে {score} স্কোর অর্জনের জন্য এই সনদ প্রদান করা হলো।"], ["পুরস্কৃত সনদ", "প্রতিযোগিতায় পুরস্কৃত হওয়ার জন্য অভিনন্দন ও শুভকামনা।"], ["কৃতজ্ঞতা সনদ", "প্রতিযোগিতায় অংশগ্রহণ করে আয়োজনকে সফল করার জন্য কৃতজ্ঞতা।"]];   // ৫০টি সনদের নাম + ডিফল্ট লেখা
  var SOC_TITLES = ["সম্মানিত বিজয়ী", "গর্বিত অর্জন", "প্রশংসনীয় সাফল্য", "অনন্য কৃতিত্ব", "সেরাদের সেরা", "জ্ঞানের চ্যাম্পিয়ন", "গৌরবের মুকুট", "অভিনন্দন বিজয়ী", "আজকের তারকা", "সপ্তাহের সেরা", "মাসের সেরা", "শীর্ষ পারফরমার", "সম্মানের আসনে", "কৃতিত্বের স্বীকৃতি", "উজ্জ্বল নক্ষত্র", "সেরা জ্ঞানী", "গৌরবময় বিজয়", "অসাধারণ অর্জন", "শ্রেষ্ঠত্বের স্বীকৃতি", "মেধার সম্মান", "বিজয়ের উৎসব", "সোনালি সাফল্য", "গর্বের মুহূর্ত", "প্রতিভার জয়", "সেরা তালিকা", "র‍্যাংকিংয়ের শীর্ষে", "নতুন চ্যাম্পিয়ন", "শ্রেষ্ঠ স্কোরার", "জ্ঞানযোদ্ধা", "সম্মানিত তারকা", "কৃতী শিক্ষার্থী", "দুর্দান্ত পারফরম্যান্স", "আমাদের গর্ব", "অর্জনের শিখরে", "মেধাবী সেরারা", "অভিনন্দন ও শুভেচ্ছা", "বিজয়ীদের সম্মাননা", "সেরা দশের সম্মান", "প্রতিযোগিতার সেরা", "জয়ের গৌরব", "অনুপ্রেরণার নাম", "সাফল্যের সোপান", "মেধা ও মননের জয়", "সম্মানিত সেরা জন", "শ্রেষ্ঠ কৃতিত্ব", "বিশেষ সম্মাননা", "উজ্জ্বল অর্জন", "স্বর্ণালী বিজয়", "অদম্য সেরা", "জ্ঞানের আলোয় বিজয়ী"];   // সোশ্যাল কার্ডের ৫০টি শিরোনাম
  var KIND = { announce: "ঘোষণা", board: "স্কোর বোর্ড", rank: "র‍্যাংক", podium: "পোডিয়াম" };
  var RANGE = { today: "আজ", yday: "গতকাল", last3: "শেষ ৩ দিন", week0: "এই সপ্তাহ (শনি থেকে)", last7: "শেষ ৭ দিন", week1: "গত সপ্তাহ", month0: "এই মাস", month1: "গত মাস", last30: "শেষ ৩০ দিন", lastn: "✏️ শেষ … দিন (নিজের সংখ্যা)", custom: "📆 থেকে–পর্যন্ত তারিখ", all: "সব সময়" };
  var RSHORT = { today: "আজ", yday: "গতকাল", week0: "এই সপ্তাহে", week1: "গত সপ্তাহে", month0: "এই মাসে", month1: "গত মাসে", all: "এ পর্যন্ত" };
  var SW = [["logos", "🏷 লোগো"], ["photo", "🖼 ছবি"], ["title", "🔤 শিরোনাম"], ["period", "📅 সময়কাল"], ["name", "👤 নাম"], ["dept", "🏫 বিভাগ"], ["batch", "🎓 সেশন"], ["score", "🔢 স্কোর"], ["rank", "🏅 র‍্যাংক"], ["more", "👥 পরের বিজয়ী"], ["footer", "🔗 নিচের লাইন"]];
  // মনে রাখা অবস্থা (শুধু ব্রাউজারে)
  var ST = { per: "week", kind: "announce", fmt: "post", range: "week0", dept: "", batch: "", d: 0, pick: 0, title: "", footer: null, on: null, rows: [], rowsG: [], raw: [], depts: [], batches: [], pmap: {}, pk: "", msg: "", busy: 0, sc: 2, ptxt: "", slbl: "স্কোর", rlbl: "র‍্যাংক", ov: {}, lg: null,
    n: "", kg: 1, nd: 5, df: "", dt: "", impm: "score", drawId: "", draws: null, stat: null, empty: "", warn: "", cap: false, sl: ["", "", ""], sv: ["", "", ""], mh: "", mb: "", mc: "", cnt: 1, cs: 0, sty: 0, cb: "", s1: "আয়োজক", s2: "MC Explorer", u1: "এমসি এক্সপ্লোরার", sg: "Granted by MC Explorer", sno: "" };
  try { var sv = JSON.parse(localStorage.getItem(SK) || "null"); if (sv && typeof sv === "object") { ["per", "kind", "fmt", "range", "d", "sc", "n", "kg", "nd", "df", "dt", "impm", "cs", "sty", "sg", "u1"].forEach(function (k) { if (sv[k] != null && !(k === "sg" && !String(sv[k]).trim())) ST[k] = sv[k]; }); if (sv.on && typeof sv.on === "object") ST.on = sv.on; if (typeof sv.footer === "string" && !/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?\/?$/i.test(sv.footer.trim())) ST.footer = sv.footer; /* 🌐 ডোমেইন-ধরনের সেভ-করা লেখা = অটো (এখনকার ডোমেইন) */ } } catch (e) {}
  if (!PER[ST.per]) ST.per = "week"; if (!KIND[ST.kind] && ST.kind !== "stats" && ST.kind !== "msg" && ST.kind !== "cert") ST.kind = "announce"; if (ST.fmt !== "story" && ST.fmt !== "land") ST.fmt = "post"; if (ST.fmt === "land" && ST.per !== "cert") ST.fmt = "post"; ST.sc = +ST.sc === 1 ? 1 : 2; if (!RANGE[ST.range]) ST.range = "week0"; ST.d = +ST.d >= 0 && +ST.d < 20 ? +ST.d : 0;
  ST.sty = Math.min(((window.MCSocial && window.MCSocial.STY) || []).length, Math.max(0, Math.floor(+ST.sty) || 0)); ST.cs = Math.min(((window.MCSocial && window.MCSocial.CERTS) || [1]).length - 1, Math.max(0, Math.floor(+ST.cs) || 0)); ST.kg = Math.min(10, Math.max(1, Math.floor(+ST.kg) || 1)); ST.nd = Math.min(365, Math.max(1, Math.floor(+ST.nd) || 5)); ST.n = +ST.n > 0 ? String(Math.min(150, Math.floor(+ST.n))) : ""; if (ST.impm !== "rank") ST.impm = "score"; ST.df = /^\d{4}-\d\d-\d\d$/.test(ST.df) ? ST.df : ""; ST.dt = /^\d{4}-\d\d-\d\d$/.test(ST.dt) ? ST.dt : "";
  function save() { try { localStorage.setItem(SK, JSON.stringify({ per: ST.per, kind: ST.kind, fmt: ST.fmt, range: ST.range, d: ST.d, sc: ST.sc, on: ST.on, footer: ST.footer, n: ST.n, kg: ST.kg, nd: ST.nd, df: ST.df, dt: ST.dt, impm: ST.impm, cs: ST.cs, sty: ST.sty, sg: ST.sg, u1: ST.u1 })); } catch (e) {} }
  function onNow() { var o = Object.assign({}, window.MCSocial.ON, ST.on || {}); return o; }
  function effKind() { var a = ALLOW[ST.per] || STD; return a.indexOf(ST.kind) >= 0 ? ST.kind : a[0]; }
  function grouped() { return (ST.per === "dept" || ST.per === "sess") && effKind() === "board" && ST.kg > 1; }
  function base() { return grouped() ? ST.rowsG : ST.rows; }

  // ---------- সময়ের সীমা (ফোনের স্থানীয় সময়; সপ্তাহ শনিবার থেকে) ----------
  var addD = function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
  var pd = function (s) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  function lastDays(k) { return k === "lastn" ? ST.nd : +String(k).slice(4); }
  function bounds(k) {
    var n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()), a, b;
    if (k === "today") { a = t0; b = addD(t0, 1); }
    else if (k === "yday") { a = addD(t0, -1); b = t0; }
    else if (k === "week0" || k === "week1") { a = addD(t0, -((t0.getDay() + 1) % 7)); if (k === "week1") a = addD(a, -7); b = addD(a, 7); }
    else if (k === "month0") { a = new Date(n.getFullYear(), n.getMonth(), 1); b = new Date(n.getFullYear(), n.getMonth() + 1, 1); }
    else if (k === "month1") { a = new Date(n.getFullYear(), n.getMonth() - 1, 1); b = new Date(n.getFullYear(), n.getMonth(), 1); }
    else if (k === "last3" || k === "last7" || k === "last30" || k === "lastn") { a = addD(t0, -(lastDays(k) - 1)); b = addD(t0, 1); }
    else if (k === "custom") { var pa = pd(ST.df), pb = pd(ST.dt); if (!pa || !pb || pa > pb) return { a: null, b: null, bad: 1 }; a = pa; b = addD(pb, 1); }
    else return { a: null, b: null };
    return { a: a, b: b };
  }
  function prevOf(r) { if (!r.a) return null; var len = +r.b - +r.a; return { a: new Date(+r.a - len), b: r.a }; }   // একই দৈর্ঘ্যের ঠিক আগের সময়
  function periodLabel() {
    if (ST.per === "lucky") { var dd = curDraw(); return dd ? dFmtD(dd.draw_date) : ""; }
    if (ST.per === "cert") return window.MCSocial.dFmtY(new Date());   // সনদের তারিখ = আজ (নিচের "সময়কালের লেখা"-য় বদলানো যায়)
    var S = window.MCSocial, k = ST.range, r = bounds(k), s = "";
    if (r.bad) s = "তারিখ বাছুন";
    else if (!r.a) s = "সব সময়";
    else { var last = addD(r.b, -1); if (+r.a === +last) s = S.dFmtY(r.a); else if (r.a.getMonth() === last.getMonth() && r.a.getFullYear() === last.getFullYear()) s = bd(r.a.getDate()) + " – " + S.dFmtY(last); else if (r.a.getFullYear() === last.getFullYear()) s = S.dFmt(r.a) + " – " + S.dFmtY(last); else s = S.dFmtY(r.a) + " – " + S.dFmtY(last);
      if (/^last/.test(k)) s = "শেষ " + bd(lastDays(k)) + " দিন · " + s; }
    if (ST.dept && ST.per !== "dept" && ST.per !== "dvd") s += " · " + deptTxt(ST.dept);
    if (ST.batch && ST.per !== "sess") s += " · সেশন " + ST.batch;
    return s;
  }
  function dFmtD(s) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s || ""); return m ? window.MCSocial.dFmtY(new Date(+m[1], +m[2] - 1, +m[3])) : ""; }
  function deptTxt(d) { var D = window.MC || {}; return D.deptLabel ? D.deptLabel(d || "") : (d || ""); }
  function shortRange() { var k = ST.range; return RSHORT[k] || (/^last/.test(k) ? "শেষ " + bd(lastDays(k)) + " দিনে" : "এই সময়ে"); }
  function curDraw() { var L = ST.draws || []; for (var i = 0; i < L.length; i++) if (String(L[i].id) === String(ST.drawId)) return L[i]; return L[0] || null; }
  // ভাগ ২: 📄 শিট বাটনে ফোল্ডার বাছলে বদল ওই ফোল্ডারের সেভে যায় (⬇ ট্যাবের একই mc2_dl_edit); না বাছলে আগের মতো সাধারণ এডিট
  function fdSelH() { var F = window.MCF && window.MCF.folders ? window.MCF.folders() : []; return '<select id="scFd" aria-label="এডিট ফোল্ডার" style="max-width:200px"><option value="">📁 ফোল্ডার: না (সাধারণ এডিট)</option>' + F.map(function (f) { return '<option value="' + String(f.id) + '">' + E(f.name) + '</option>'; }).join("") + '</select>'; }
  function autoTitle() {
    var p = ST.per, k = effKind();
    if (p === "lucky") { var dd = curDraw(); return dd && dd.title ? dd.title : "লাকি ড্র বিজয়ী"; }
    if (p === "imp") return ST.impm === "rank" ? "সবচেয়ে বেশি র‍্যাংক-উন্নতি" : "সবচেয়ে বেশি স্কোর-উন্নতি";
    if (p === "rec") return "নতুন রেকর্ড!";
    if (p === "dvd") return "বিভাগ বনাম বিভাগ";
    if (p === "part") return "অংশগ্রহণ";
    if (p === "thx") return "ধন্যবাদ";
    if (p === "rem") return "খেলা চলছে";
    if (p === "cert") return CERT_PRE[0][0];
    var sfx = k === "board" ? "স্কোর বোর্ড" : k === "rank" ? "র‍্যাংক" : k === "podium" ? "পোডিয়াম" : "বিজয়ী ঘোষণা";
    if (p === "dept") return k === "board" ? "বিভাগ-সেরা স্কোর বোর্ড" : k === "rank" ? "বিভাগ-সেরা র‍্যাংক" : k === "podium" ? "বিভাগ-সেরা পোডিয়াম" : "বিভাগ-সেরা বিজয়ী";
    if (p === "sess") return k === "board" ? "সেশন-সেরা স্কোর বোর্ড" : k === "rank" ? "সেশন-সেরা র‍্যাংক" : k === "podium" ? "সেশন-সেরা পোডিয়াম" : "সেশন-সেরা বিজয়ী";
    var pre = /^last/.test(ST.range) ? "শেষ " + bd(lastDays(ST.range)) + " দিনের" : ST.range === "custom" ? "নির্বাচিত সময়ের" : PER[p];
    return pre + " " + sfx;
  }
  function siteTxt() { var C = window.MC_CFG || {}, u = C.siteUrl ? C.siteUrl : (/^https?:/.test(location.origin) ? location.origin : ""); return String(u).replace(/^https?:\/\//, "").replace(/\/$/, "") || "MC Explorer Challenge"; }
  function msgDef() {
    var sr = shortRange();
    if (ST.per === "thx") return { head: "ধন্যবাদ!", body: "যাঁরা " + sr + " খেলেছেন, সবাইকে অসংখ্য ধন্যবাদ। আপনাদের অংশগ্রহণেই এই আসর প্রাণবন্ত।", cta: "পরের চ্যালেঞ্জেও দেখা হবে" };
    return { head: "খেলা চলছে!", body: "চ্যালেঞ্জ চলছে। তুমিও খেলো, সেরাদের তালিকায় নাম তোলো।", cta: "এখনই খেলুন · " + siteTxt() };
  }

  // ---------- ডেটা ----------
  // শুধু অনুমোদিত ৫টি ক্ষেত্র রাখা হয়; আইপি/ফোন/ডিভাইস/আইডি/সময় কখনো এই তালিকায় ঢোকে না
  function clean(x, rk) { return { rk: rk != null ? rk : x.rk, name: String(x.name || ""), dept: String(x.dept || ""), batch: String(x.batch || ""), score: x.score == null ? null : +x.score }; }
  function dec(q) { q.deptRaw = q.dept; q.dept = deptTxt(q.dept); return q; }
  var tie = function (list, f) { return list.map(function (q, i) { var k = 0; while (k < i && f(list[k]) !== f(q)) k++; return k + 1; }); };   // সমান মানে সমান র‍্যাংক
  function callBoard(a, b, dept, batch, lim) {
    return M.rpc("mc2_board", { p_dept: dept || null, p_batch: batch || null, p_from: a ? a.toISOString() : null, p_to: b ? b.toISOString() : null, p_q: null, p_mode: "best", p_limit: lim || 500, p_offset: 0 }).then(function (x) { if (x && x.err) throw new Error("slow"); return x || {}; });
  }
  function loadDraws() {
    if (ST.draws) return Promise.resolve();
    return M.rpc("mc2_draw_admin_list").then(function (r) { ST.draws = ((r && r.rows) || []).filter(function (q) { return q.source !== "wcard-manual" && (q.winners || []).length; }); if (!ST.drawId && ST.draws[0]) ST.drawId = String(ST.draws[0].id); });
  }
  function reset(rows) { ST.rows = rows; ST.rowsG = []; ST.raw = []; ST.pmap = {}; ST.pk = ""; ST.ov = {}; ST.stat = null; ST.empty = ""; ST.warn = ""; ST.cap = false; if (ST.pick >= ST.rows.length) ST.pick = 0; }
  // বিভাগ/সেশন গ্রুপ: raw থেকে ST.rows (প্রতি গ্রুপের শীর্ষজন, তাদের মধ্যে র‍্যাংক) ও ST.rowsG (প্রতি গ্রুপে শীর্ষ kg জন, গ্রুপের ভেতরে র‍্যাংক)
  function build() {
    if (ST.per !== "dept" && ST.per !== "sess") return;
    var key = ST.per === "dept" ? "deptRaw" : "batch", order = [], map = {}, K = ST.kg;
    ST.raw.forEach(function (q) { var k = q[key]; if (ST.per === "sess" && !k) return; if (!map[k]) { map[k] = []; order.push(k); } map[k].push(q); });
    order.sort(function (a, b) { return (map[b][0].score || 0) - (map[a][0].score || 0); });
    var tops = order.map(function (k) { return map[k][0]; }), rk = tie(tops, function (q) { return q.score; });
    ST.rows = tops.map(function (q, i) { return Object.assign({}, q, { rk: rk[i] }); });
    ST.rowsG = []; order.forEach(function (k) { var g = map[k].slice(0, K), r2 = tie(g, function (q) { return q.score; }); g.forEach(function (q, i) { ST.rowsG.push(Object.assign({}, q, { rk: r2[i], g: ST.per === "dept" ? deptTxt(k) : "সেশন " + k })); }); });
    ST.ov = {}; if (ST.pick >= ST.rows.length) ST.pick = 0;
  }
  function fetchRows() {
    var r = bounds(ST.range), p = ST.per, pv;
    if (p === "lucky") return loadDraws().then(function () {
      var d = curDraw(); reset((d ? d.winners : []).map(function (w, i) { return dec(clean({ rk: w.rank != null && w.rank !== "" ? w.rank : i + 1, name: w.name, dept: w.dept, batch: w.batch, score: w.score })); }));
      if (!d) ST.empty = "কোনো লাকি ড্র/বিজয়ী ঘোষণা সেভ করা নেই";
    });
    if (r.bad) { reset([]); ST.warn = "⚠️ \"থেকে–পর্যন্ত\" তারিখ দুটো ঠিকভাবে বাছুন (শুরু ≤ শেষ)।"; ST.empty = "তারিখ বাছুন"; return Promise.resolve(); }
    var cur = callBoard(r.a, r.b, p === "dept" || p === "dvd" ? null : ST.dept, p === "sess" ? null : ST.batch);
    return cur.then(function (x) {
      var rows = x.rows || [], out; ST.depts = x.depts || ST.depts; ST.batches = x.batches || ST.batches;
      var all = rows.map(function (q) { return dec(clean(q)); }), capd = (+x.total || 0) > rows.length;
      if (p === "dept" || p === "sess") { reset([]); ST.raw = all; ST.cap = capd; build(); return; }
      if (p === "part" || p === "thx" || p === "rem") {
        var sum = 0, cnt = 0; all.forEach(function (q) { if (q.score != null) { sum += q.score; cnt++; } });
        reset([]); ST.stat = { total: +x.total || 0, best: all.length ? all[0].score : "", avg: cnt ? Math.round(sum / cnt * 10) / 10 : "", bestWho: all.length ? all[0].name : "", partial: capd };
        if (!(+x.total)) ST.warn = "ℹ️ এই সময়ে কেউ খেলেনি — সংখ্যা ফাঁকা/শূন্য আসবে।"; return;
      }
      if (p === "dvd") {
        var by = {}, ord = []; all.forEach(function (q) { if (q.score == null) return; var k = q.deptRaw; if (!by[k]) { by[k] = { s: 0, n: 0 }; ord.push(k); } by[k].s += q.score; by[k].n++; });
        var L = ord.map(function (k) { return { k: k, avg: Math.round(by[k].s / by[k].n * 10) / 10, n: by[k].n }; }).sort(function (a, b) { return b.avg - a.avg || b.n - a.n; }), rk2 = tie(L, function (q) { return q.avg; });
        reset(L.map(function (q, i) { return { rk: rk2[i], name: deptTxt(q.k), dept: "", batch: "", score: q.avg, extra: bd(q.n) + " জন", deptRaw: q.k }; })); ST.cap = capd; return;
      }
      if (p === "imp" || p === "rec") {
        pv = prevOf(r);
        if (!pv) { reset([]); ST.empty = "\"সব সময়\" বাছলে তুলনা হয় না — একটি সময় বাছুন"; ST.warn = "ℹ️ তুলনার জন্য আগের সময় দরকার; \"সব সময়\" ছাড়া অন্য সময় বাছুন।"; return; }
        if (p === "rec") {
          return callBoard(null, r.a, ST.dept, ST.batch, 1).then(function (y) {
            var pr = (y.rows || [])[0], c0 = all[0]; reset([]);
            if (!c0) { ST.empty = "এই সময়ে কেউ খেলেনি"; return; }
            if (!pr || c0.score > +pr.score) { c0.rk = 1; c0.extra = pr ? "আগের রেকর্ড " + bd(pr.score) : "প্রথম রেকর্ড"; ST.rows = [c0]; }
            else { ST.empty = "এই সময়ে নতুন রেকর্ড হয়নি (রেকর্ড: " + bd(pr.score) + ")"; ST.warn = "ℹ️ এই সময়ের সেরা স্কোর " + bd(c0.score) + ", আগের রেকর্ড " + bd(pr.score) + " — ভাঙেনি।"; }
          });
        }
        return callBoard(pv.a, pv.b, ST.dept, ST.batch).then(function (y) {
          var pm = {}; (y.rows || []).forEach(function (q) { pm[String(q.name).toLowerCase() + "|" + q.dept + "|" + (q.batch || "")] = q; });
          var L = []; rows.forEach(function (q, i) { var o = pm[String(q.name).toLowerCase() + "|" + q.dept + "|" + (q.batch || "")]; if (!o) return; var g = ST.impm === "rank" ? (+o.rk) - (+q.rk) : (+q.score) - (+o.score); if (g > 0) L.push({ g: g, a: all[i] }); });
          L.sort(function (a, b) { return b.g - a.g || (b.a.score || 0) - (a.a.score || 0); }); var rk3 = tie(L, function (q) { return q.g; });
          reset(L.map(function (q, i) { var o = Object.assign({}, q.a); o.rk = rk3[i]; o.extra = ST.impm === "rank" ? "▲ " + bd(q.g) + " ধাপ" : "▲ +" + bd(q.g); return o; })); ST.cap = capd;
          if (!ST.rows.length) ST.empty = "এই সময়ে কারও উন্নতি পাওয়া যায়নি";
        });
      }
      out = all; reset(out); ST.cap = capd;
    });
  }
  // সেরা ৩-এর ছবি (বিদ্যমান RPC; ছবি লুকানো থাকলে সার্ভার দেয় না)। নাম+বিভাগ+সেশন মিললে তবেই বসে (চাবি: নাম|বিভাগ|সেশন)
  var PHOTO_PER = { day: 1, week: 1, month: 1, dept: 1, sess: 1, imp: 1, rec: 1 };
  function fetchPhotos() {
    if (!PHOTO_PER[ST.per]) return Promise.resolve();
    var r = bounds(ST.range), p = ST.per, key = [ST.range, ST.nd, ST.df, ST.dt, ST.dept, ST.batch, p, ST.raw.length, ST.rows.length].join("|"); if (ST.pk === key || r.bad) return Promise.resolve();
    ST.pk = key; ST.pmap = {};
    return M.rpc("mc2_top_cards", { p_dept: p === "dept" ? null : (ST.dept || null), p_batch: p === "sess" ? null : (ST.batch || null), p_from: r.a ? r.a.toISOString() : null, p_to: r.b ? r.b.toISOString() : null }).then(function (x) {
      var rows = (x && x.rows) || [], JPG = /^data:image\/(jpeg|png|webp);base64,/, jobs = [];
      rows.forEach(function (t) { if (!t.photo || !JPG.test(t.photo)) return; jobs.push(window.MCSocial.li(t.photo).then(function (im) { if (im) ST.pmap[String(t.name) + "|" + (t.dept || "") + "|" + (t.batch || "")] = im; })); });
      return Promise.all(jobs);
    }).catch(function () {});
  }
  function photosFor(list) { var o = {}; list.forEach(function (q, i) { var im = ST.pmap[q.name + "|" + (q.deptRaw != null ? q.deptRaw : "") + "|" + q.batch]; if (im && !q.g0) o[i] = im; }); return o; }
  function fonts() { try { if (document.fonts && document.fonts.load) return Promise.all(["800 40px \"Anek Bangla\"", "600 30px \"Anek Bangla\"", "600 30px \"Hind Siliguri\"", "700 30px \"Hind Siliguri\""].map(function (f) { return document.fonts.load(f, "অআকখ১২৩"); }).concat([document.fonts.load('400 60px "Mr De Haviland"', "Abcxyz"), document.fonts.load('400 60px "Great Vibes"', "Abcxyz")])).catch(function () {}); } catch (e) {} return Promise.resolve(); }
  function ltr(t) {   // "অক্ষর লিখব": গোল লোগোর ভেতরে ১-৩ অক্ষর (poster-draw.js-এর মতোই)
    t = String(t || "").trim().slice(0, 3); if (!t) return null;
    var k = document.createElement("canvas"); k.width = k.height = 220; var g = k.getContext("2d");
    g.fillStyle = "#10261b"; g.beginPath(); g.arc(110, 110, 104, 0, 6.2832); g.fill(); g.lineWidth = 8; g.strokeStyle = "#e0b84a"; g.stroke();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 " + (t.length > 2 ? 70 : t.length > 1 ? 88 : 112) + 'px "Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI",sans-serif'; g.fillText(t, 110, 116); return k;
  }
  function logos(lgo) {   // ST.lg = { l, r, tl, tr } (mcLogo.picker-এর বাছাই): null = ডিফল্ট, 0 = অক্ষর, সংখ্যা = লোগো-নম্বর। সার্ভারে জমা হয় না
    var L = (window.MC || {}).logos || {}, S = window.MCSocial, o = lgo || ST.lg, ML = window.mcLogo;
    var FT = ML && ML.forType ? ML.forType(ST.per === "cert" ? "c" : "s").catch(function () { return null; }) : Promise.resolve(null); // লোগো-ট্যাবের "সোশ্যাল কার্ড"/"সার্টিফিকেট"-এর লোগো (না থাকলে সবার বাম/ডান)
    var side = function (v, tx, i, def) { if (v == null) return FT.then(function (p) { return p && p[i] ? p[i] : S.li(def); }); if (v === 0) return Promise.resolve(ltr(tx)); return ML && ML.img ? Promise.resolve(ML.img(v, i)).then(function (x) { return x || S.li(def); }, function () { return S.li(def); }) : S.li(def); };
    return Promise.all([side(o && o.l, o && o.tl, 0, L.mc), side(o && o.r, o && o.tr, 1, L.nu)]);
  }


  // ---------- আঁকা ----------
  var SEQ = 0, CV = null;
  function statsObj() {
    if (ST.per !== "part") return null; var s = ST.stat || {}, auto = [s.total, s.best, s.avg], dl = ["জন খেলেছে", "সেরা স্কোর", s.partial ? "গড় স্কোর (সেরা ৫০০ জনের)" : "গড় স্কোর"];
    return { vals: auto.map(function (v, i) { return ST.sv[i] !== "" ? ST.sv[i] : (v == null ? "" : v); }), lbls: dl.map(function (v, i) { return ST.sl[i] || v; }), bestWho: s.bestWho || "" };
  }
  function msgObj() {
    if (ST.per !== "thx" && ST.per !== "rem") return null; var D = msgDef(), t = ST.stat && ST.stat.total ? ST.stat.total : 0;
    return { head: ST.mh || D.head, body: ST.mb || D.body, cta: ST.mc || D.cta, count: ST.cnt && t ? bd(t) + " জন " + (ST.per === "thx" ? "খেলেছেন" : "এখন পর্যন্ত খেলেছেন") : "" };
  }
  function certBody() { if (ST.per !== "cert") return ""; if (ST.cb.trim()) return ST.cb; var t = ST.title.trim(), q = CERT_PRE.filter(function (x) { return x[0] === t; })[0]; return (q || CERT_PRE[0])[1]; }
  // 📄 শিটের জন্য: একজনের সনদ/সোশ্যাল কার্ড (📣 সোশ্যাল ট্যাবে এখন যে ডিজাইন-লেখা-সই বাছা সেটা দিয়ে); ফেরত = canvas
  window.MCSOC = {
    TITLES: SOC_TITLES, CERT_PRE: CERT_PRE, // শিট-জানালার "বাছুন" তালিকার জন্য (শুধু পড়া)
    // শিট-জানালার ফর্ম ভরতে: 📣 সোশ্যাল ট্যাবে এখন যা বাছা তার মান (কী = ড্র-অপশনের নাম)
    defaults: function (kind) {
      var o = dopt(onNow()), cp = CERT_PRE[0], isC = kind === "cert", on0 = Object.assign({}, onNow(), { photo: 1 });
      return { cs: ST.cs, d: ST.d, sty: ST.sty, title: isC ? (ST.per === "cert" ? o.title : (ST.title.trim() || cp[0])) : o.title, period: o.period, footer: o.footer, cbody: isC ? (ST.per === "cert" ? o.cbody : (ST.cb.trim() || cp[1])) : "", sup1: ST.u1, sig1: ST.s1, sigName: ST.sg, sig2: ST.s2, sno: ST.sno, scoreLbl: ST.slbl, rankLbl: ST.rlbl, on: on0, sc: 1 };
    },
    // গ্রুপ-কার্ড: বাছা সবাইকে নিয়ে একটাই কার্ড — gpod (পডিয়াম) | gboard (বোর্ড-তালিকা) | gann (ঘোষণা/লাকি ড্র তালিকা); photos = Image বা null-এর অ্যারে (persons-এর ক্রমে)
    makeGroup: function (kind, persons, ov, photos) {
      var S = window.MCSocial; if (!S) return Promise.reject(new Error("social-draw.js লোড হয়নি"));
      return Promise.all([fonts(), logos(ov && ov.lg)]).then(function (a) {
        var o = dopt(onNow()), rows = persons.map(function (p, i) { return { rk: p.rank != null && p.rank !== "" ? p.rank : i + 1, name: p.name, dept: p.dept || "", batch: p.batch || "", score: p.score }; }), pm = {};
        (photos || []).forEach(function (im, i) { if (im) pm[i] = im; });
        o.kind = kind === "gpod" ? "podium" : kind === "gboard" ? "board" : "announce"; o.fmt = ST.fmt === "land" ? "post" : ST.fmt; o.n = rows.length; o.groups = null; o.pick = 0; o.on = Object.assign({}, o.on || {}, { photo: Object.keys(pm).length > 0 });
        if (ov) ["d", "sty", "title", "period", "footer", "scoreLbl", "rankLbl"].forEach(function (k) { if (ov[k] != null) o[k] = ov[k]; });
        if (ov && ov.on) o.on = Object.assign({}, o.on, ov.on, { photo: !!ov.on.photo && Object.keys(pm).length > 0 });
        return S.draw(o, rows, pm, a[1], ov && +ov.sc === 2 ? 2 : 1);
      });
    },
    // ov = শিট-জানালায় বদলানো ডিজাইন/লেখা (শুধু ওই ছবির জন্য, সেভ হয় না)
    make: function (kind, person, ov, photo) { // kind: cert | social (একজনের তালিকা-কার্ড) | rank (র‍্যাংক-কার্ড); photo = ছবির Image বা null
      var S = window.MCSocial; if (!S) return Promise.reject(new Error("social-draw.js লোড হয়নি"));
      return Promise.all([fonts(), logos(ov && ov.lg)]).then(function (a) {
        var o = dopt(onNow()), row = { rk: person.rank != null && person.rank !== "" ? person.rank : "", name: person.name, dept: person.dept || "", batch: person.batch || "", score: person.score };
        if (kind === "cert") {
          o.kind = "cert"; o.fmt = "land"; o.pick = 0;
          if (ST.per !== "cert") { var cp = CERT_PRE[0]; o.title = ST.title.trim() || cp[0]; o.cbody = ST.cb.trim() || cp[1]; }
        } else { o.kind = kind === "rank" ? "rank" : "announce"; o.fmt = ST.fmt === "land" ? "post" : ST.fmt; o.n = 1; o.groups = null; o.pick = 0; o.on = Object.assign({}, o.on || {}, { photo: !!photo }); }
        if (ov) ["cs", "d", "sty", "title", "period", "footer", "cbody", "sup1", "sig1", "sigName", "sig2", "scoreLbl", "rankLbl", "sno", "lead", "top", "sesL", "dlbl", "nlbl"].forEach(function (k) { if (ov[k] != null) o[k] = ov[k]; });
        if (ov && ov.on && kind !== "cert") o.on = Object.assign({}, o.on, ov.on, { photo: !!ov.on.photo && !!photo });
        return S.draw(o, [row], photo ? { 0: photo } : {}, a[1], ov && +ov.sc === 2 ? 2 : 1);
      });
    }
  };
  function dopt(on) { return { fmt: ST.fmt, kind: effKind(), d: ST.d, on: on, pick: ST.pick, title: ST.title.trim() || autoTitle(), period: ST.ptxt.trim() || periodLabel(), footer: ST.footer == null ? siteTxt() : ST.footer, scoreLbl: ST.slbl, rankLbl: ST.rlbl, n: +ST.n > 0 ? Math.floor(+ST.n) : 0, groups: grouped(), stats: statsObj(), msg: msgObj(), empty: ST.empty, cs: ST.cs, sty: ST.sty, sno: ST.sno, cbody: certBody(), sig1: ST.s1, sig2: ST.s2, sup1: ST.u1, sigName: ST.sg }; }
  // হাতে বদলানো লেখা (শুধু এই ছবির জন্য, মেমরিতে; সার্ভারে যায় না) সারির ওপর বসে
  function rowsOv() { return base().map(function (q, i) { var o = ST.ov[i]; if (!o) return q; var r = Object.assign({}, q); ["name", "dept", "batch"].forEach(function (k) { if (o[k] != null) r[k] = o[k]; }); if (o.score != null) r.score = o.score === "" ? null : (isNaN(+o.score) ? o.score : +o.score); if (o.rk != null) r.rk = isNaN(+o.rk) || o.rk === "" ? o.rk : +o.rk; return r; }); }
  function needPhotos(on) { return on.photo && effKind() !== "stats" && effKind() !== "msg"; }
  function download(V) {
    var on = onNow(), n = V.querySelector("#scNote"), S = window.MCSocial, old = n.textContent; n.textContent = "⏳ হাই-রেজ ছবি আঁকা হচ্ছে…";
    return Promise.all([needPhotos(on) ? fetchPhotos() : Promise.resolve(), fonts(), logos()]).then(function (a) {
      var go = function (k) { var cv = S.draw(dopt(on), rowsOv(), needPhotos(on) ? photosFor(base()) : {}, a[2], k); return new Promise(function (res) { cv.toBlob(function (b) { res(b ? { b: b, w: cv.width, h: cv.height } : null); }, "image/png"); }); };
      return go(ST.sc).then(function (r) { return r || go(1); });   // ফোনের মেমরিতে না কুলালে ১× এ নামে
    }).then(function (r) {
      if (!r) { n.textContent = "❌ ছবি বানানো যায়নি।"; return; }
      var u = URL.createObjectURL(r.b), a = document.createElement("a"); a.href = u; a.download = "MC_social_" + effKind() + "_" + ST.per + "_" + ST.fmt + "_" + r.w + "x" + r.h + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      n.textContent = "✅ ডাউনলোড: " + r.w + "×" + r.h + " পিক্সেল PNG (সার্ভারে কিছু জমা হয়নি)"; setTimeout(function () { if (n.textContent.indexOf("✅") === 0) n.textContent = old; }, 5000);
    }).catch(function () { n.textContent = "❌ ডাউনলোড হয়নি — আবার চেষ্টা করুন।"; });
  }
  function editHtml() {
    var L = base(), n = Math.min(L.length, 15), h = "";
    for (var i = 0; i < n; i++) { var q = L[i], o = ST.ov[i] || {}, v = function (k, d) { return E(o[k] != null ? o[k] : d); };
      h += '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 6px;padding:6px 0;border-top:1px solid var(--bd)"><b style="grid-column:1/-1">' + bd(i + 1) + "." + (q.g ? " <span class=\"sm\">" + E(q.g) + "</span>" : "") + "</b>" +
        '<input data-ov="' + i + ':name" maxlength="60" placeholder="নাম" value="' + v("name", q.name) + '"><input data-ov="' + i + ':dept" maxlength="40" placeholder="বিভাগ" value="' + v("dept", q.dept) + '">' +
        '<input data-ov="' + i + ':batch" maxlength="20" placeholder="সেশন" value="' + v("batch", q.batch) + '"><input data-ov="' + i + ':score" maxlength="8" placeholder="স্কোর" value="' + v("score", q.score == null ? "" : q.score) + '">' +
        '<input data-ov="' + i + ':rk" maxlength="4" placeholder="র‍্যাংক" value="' + v("rk", q.rk) + '"></div>'; }
    return h || '<p class="sm">তালিকা খালি।</p>';
  }
  function txHtml() {
    var h = "", s = ST.stat || {}, I = function (a, b, c, d) { return '<input ' + a + ' maxlength="' + b + '" placeholder="' + E(c) + '" value="' + E(d) + '">'; };
    if (ST.per === "part") {
      var auto = [s.total, s.best, s.avg], dl = ["জন খেলেছে", "সেরা স্কোর", "গড় স্কোর"];
      h = '<p class="sm">তিনটি ঘরের লেখা ও সংখ্যা বদলানো যায় (খালি = নিজে নিজে)। শুধু এই ছবির জন্য, সার্ভারে যায় না।</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 6px">';
      for (var i = 0; i < 3; i++) h += I('data-sl="' + i + '"', 30, "লেখা: " + dl[i], ST.sl[i]) + I('data-sv="' + i + '"', 10, "সংখ্যা: " + (auto[i] == null || auto[i] === "" ? "—" : bd(auto[i])), ST.sv[i]);
      return h + "</div>";
    }
    var D = msgDef();
    return '<div style="display:grid;gap:4px"><input id="scMh" maxlength="30" placeholder="বড় শিরোনাম: ' + E(D.head) + '" value="' + E(ST.mh) + '"><textarea id="scMb" rows="3" maxlength="240" placeholder="বার্তা: ' + E(D.body) + '">' + E(ST.mb) + '</textarea><input id="scMc" maxlength="60" placeholder="নিচের বোতাম-লেখা: ' + E(D.cta) + '" value="' + E(ST.mc) + '">' +
      '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="scCnt"' + (ST.cnt ? " checked" : "") + '> "কত জন খেলেছেন" লাইন দেখাও (' + (s.total ? bd(s.total) + " জন" : "এই সময়ে কেউ নেই") + ')</label><p class="sm">খালি রাখলে নিজে নিজে বসানো লেখা থাকে।</p></div>';
  }
  function info(cv) {
    var k = effKind(), t;
    if (k === "cert") t = "প্রিভিউ ছোট; ডাউনলোড হবে " + cv.width * ST.sc + "×" + cv.height * ST.sc + " পিক্সেল · সনদ: " + (base()[ST.pick] ? base()[ST.pick].name : "কেউ নেই") + "\nℹ️ নাম বদলাতে/অন্য নামে দিতে নিচের \"হাতে বদলান\"-এ বদলান; তালিকা সেরা ৫০০ জন পর্যন্ত।";
    else if (k === "stats" || k === "msg") t = "প্রিভিউ ছোট; ডাউনলোড হবে " + cv.width * ST.sc + "×" + cv.height * ST.sc + " পিক্সেল";
    else t = "প্রিভিউ ছোট; ডাউনলোড হবে " + cv.width * ST.sc + "×" + cv.height * ST.sc + " পিক্সেল · " + bd(base().length) + " জনের তালিকা" + (base().length ? "" : " (" + (ST.empty || "এই সময়ে কোনো ফল নেই") + ")");
    if (cv._dropped > 0) t += "\n⚠️ জায়গা না কুলানোয় " + bd(cv._dropped) + " জন কার্ডে আসেনি — \"কতজন\" কমান বা স্টোরি মাপ বাছুন।";
    if (ST.warn) t += "\n" + ST.warn;
    if (ST.cap && (ST.per === "dept" || ST.per === "sess" || ST.per === "dvd" || ST.per === "imp" || ST.per === "rec")) t += "\nℹ️ হিসাব সার্ভারের দেওয়া সেরা ৫০০ জনের মধ্য থেকে।";
    if (ST.per === "imp" && ST.rows.length) t += "\nℹ️ শুধু তাদের, যারা আগের সমান দৈর্ঘ্যের সময়েও খেলেছিল।";
    if ((ST.per === "dept" || ST.per === "sess") && ST.kg > 1 && k !== "board") t += "\nℹ️ প্রতি " + (ST.per === "dept" ? "বিভাগে" : "সেশনে") + " একাধিক জন শুধু \"স্কোর বোর্ড\" টেমপ্লেটে আসে; এই টেমপ্লেটে শুধু শীর্ষজন।";
    if (ST.per === "sess" && ST.raw.length && ST.raw.some(function (q) { return !q.batch; })) t += "\nℹ️ সেশন ফাঁকা থাকা খেলোয়াড় এই তালিকায় আসে না।";
    return t;
  }
  function paint(V) {
    var my = ++SEQ, on = onNow(), note = V.querySelector("#scNote"), dl = V.querySelector("#scDl"); if (!note || !dl) return;
    note.textContent = "⏳ আঁকা হচ্ছে…"; dl.disabled = true;
    Promise.all([needPhotos(on) ? fetchPhotos() : Promise.resolve(), fonts(), logos()]).then(function (a) {
      if (my !== SEQ) return;
      var S = window.MCSocial, cv = S.draw(dopt(on), rowsOv(), needPhotos(on) ? photosFor(base()) : {}, a[2], 1);
      CV = a[2]; var im = V.querySelector("#scImg"); im.src = cv.toDataURL("image/jpeg", .9); im.hidden = false; im.style.aspectRatio = cv.width + " / " + cv.height;
      dl.disabled = false; note.style.whiteSpace = "pre-line"; note.textContent = info(cv);
    }).catch(function () { if (my === SEQ) note.textContent = "❌ আঁকা যায়নি — আবার চেষ্টা করুন।"; });
  }
  var T0 = 0; function soon(V) { clearTimeout(T0); T0 = setTimeout(function () { paint(V); }, 120); }
  function load(V) {
    var my = ++ST.busy, n = V.querySelector("#scNote"); n.textContent = "⏳ ডেটা আনা হচ্ছে…";
    return fetchRows().then(function () { if (my !== ST.busy) return; fillSel(V); sync(V); paint(V); }).catch(function (e) { if (my !== ST.busy) return; reset([]); n.textContent = /slow/.test((e && e.message) || "") ? "⏳ সার্ভার ধীর — কয়েক সেকেন্ড পরে \"🔄 ডেটা আবার আনুন\" চাপুন।" : "❌ ডেটা আসেনি: " + ((e && e.message) || ""); paint(V); });
  }
  function opts(list, cur, all) { return (all ? '<option value="">' + all + "</option>" : "") + list.map(function (x) { return '<option value="' + E(x[0]) + '"' + (String(x[0]) === String(cur) ? " selected" : "") + ">" + E(x[1]) + "</option>"; }).join(""); }
  function fillSel(V) {
    var d = V.querySelector("#scDept"), b = V.querySelector("#scBatch"), p = V.querySelector("#scPick"), dr = V.querySelector("#scDraw");
    d.innerHTML = opts(ST.depts.map(function (x) { return [x, x]; }), ST.dept, "সব বিভাগ");
    b.innerHTML = opts(ST.batches.map(function (x) { return [x, x]; }), ST.batch, "সব সেশন");
    p.innerHTML = opts(ST.rows.slice(0, 60).map(function (x, i) { return [i, bd(i + 1) + ". " + x.name + " (" + bd(x.score == null ? "—" : x.score) + ")"]; }), ST.pick);
    dr.innerHTML = (ST.draws || []).length ? opts((ST.draws || []).map(function (x) { return [x.id, (x.title || "লাকি ড্র") + " — " + dFmtD(x.draw_date) + " (" + bd((x.winners || []).length) + " জন)"]; }), ST.drawId || (ST.draws[0] && ST.draws[0].id)) : '<option value="">(সেভ করা ঘোষণা নেই)</option>';
    var eb = V.querySelector("#scEdB"); if (eb) eb.innerHTML = editHtml();
    var tb = V.querySelector("#scTxB"); if (tb) tb.innerHTML = txHtml();
    qLabels(V);
  }
  function sync(V) {
    var k = effKind(), per = ST.per, tw = ALLOW[per];
    [].forEach.call(V.querySelectorAll("[data-per]"), function (b) { b.className = per === b.dataset.per ? "" : "l"; });
    [].forEach.call(V.querySelectorAll("[data-kind]"), function (b) { b.className = k === b.dataset.kind ? "" : "l"; b.hidden = tw.indexOf(b.dataset.kind) < 0; });
    [].forEach.call(V.querySelectorAll("[data-fmt]"), function (b) { b.className = ST.fmt === b.dataset.fmt ? "" : "l"; });
    [].forEach.call(V.querySelectorAll("[data-for]"), function (el) { el.style.display = el.dataset.for.split(",").indexOf(per) >= 0 ? "" : "none"; });
    [].forEach.call(V.querySelectorAll("[data-rg]"), function (el) { el.style.display = el.dataset.rg === ST.range ? "" : "none"; });
    V.querySelector("#scTplRow").style.display = tw.length > 1 ? "" : "none";
    V.querySelector("#scRange").value = ST.range; V.querySelector("#scTitle").placeholder = autoTitle(); V.querySelector("#scDesign").value = ST.d; V.querySelector("#scSc").value = ST.sc;
    V.querySelector("#scNd").value = ST.nd; V.querySelector("#scDf").value = ST.df; V.querySelector("#scDt").value = ST.dt; V.querySelector("#scN").value = ST.n; V.querySelector("#scKg").value = ST.kg; V.querySelector("#scImpm").value = ST.impm;
    V.querySelector("#scPick").disabled = k !== "rank" && k !== "cert"; V.querySelector("#scDept").disabled = per === "dept" || per === "dvd" || per === "lucky"; V.querySelector("#scBatch").disabled = per === "sess" || per === "lucky"; V.querySelector("#scRange").disabled = per === "lucky";
    V.querySelector("#scEd").style.display = per === "part" || per === "thx" || per === "rem" ? "none" : "";
    V.querySelector("#scCs").value = ST.cs; V.querySelector("#scSty").value = ST.sty; V.querySelector("#scSn").value = ST.sno; V.querySelector("#scTp").value = ""; V.querySelector("#scCp").value = ""; V.querySelector("#scCb").placeholder = certBody(); V.querySelector("#scCb").value = ST.cb; V.querySelector("#scU1").value = ST.u1; V.querySelector("#scSg").value = ST.sg; V.querySelector("#scS1").value = ST.s1; V.querySelector("#scS2").value = ST.s2;
    V.querySelector("#scNLbl").textContent = per === "dept" || per === "sess" ? "কত " + (per === "dept" ? "বিভাগ" : "সেশন") + " দেখাবে (খালি = সব)" : "মোট কতজন দেখাবে (খালি = নিজে নিজে)";
    qLabels(V);
  }


  // ---------- দ্রুত বাছাই: ছবির ঠিক ওপরে ◀ আগের / পরের ▶ — সেটিংয়ের ভেতরে বারবার না গিয়ে একের পর এক ডিজাইন দেখা ----------
  var QROWS = [["scCs", "🎓 সনদের ডিজাইন", "cert"], ["scCp", "🏷 সনদের নাম", "cert"], ["scSty", "✨ আধুনিক স্টাইল", "day,week,month,dept,sess,lucky,imp,rec,dvd,part,thx,rem"], ["scDesign", "🎨 ডিজাইন/থিম", ""], ["scTp", "📝 শিরোনাম", "day,week,month,dept,sess,lucky,imp,rec,dvd,part,thx,rem"], ["scPick", "👤 কার্ডে কে", ""]];
  var QI = {}; // স্টেপ-গোনা (scTp/scCp বাছলে ফাঁকা হয়ে যায়, তাই নিজে গুনি)
  function QUICK() {
    return '<details id="scQuick" open style="margin:10px 0"><summary><b>🎨 দ্রুত বাছাই + প্রিভিউ</b> <span class="sm">(ভাঁজ করা যায়)</span></summary>' +
      '<div id="scQrows" style="display:grid;gap:6px;margin:8px 0">' + QROWS.map(function (r) {
        return '<div class="qs" data-qrow="' + r[0] + '"' + (r[2] ? ' data-for="' + r[2] + '"' : "") + ' style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="sm" style="flex:1 1 100%;font-weight:700">' + r[1] + '</span><button type="button" class="l" style="padding:8px 14px" data-qs="' + r[0] + '" data-d="-1">◀ আগের</button><b data-qn="' + r[0] + '" style="flex:1;min-width:0;text-align:center;font-size:13px"></b><button type="button" style="padding:8px 14px" data-qs="' + r[0] + '" data-d="1">পরের ▶</button></div>';
      }).join("") + '</div>' +
      '<div class="act" style="margin:8px 0"><button type="button" id="scDl" disabled>⬇ ডাউনলোড (PNG)</button><button type="button" class="l" id="scRf">🔄 ডেটা আবার আনুন</button>' + fdSelH() + '<button type="button" class="l" id="scSh">📄 একসাথে এক পেজে (সনদ/কার্ড)</button></div>' +
      '<p class="sm" id="scNote">⏳ ডেটা আনা হচ্ছে…</p><div style="max-width:420px;margin:8px auto"><img id="scImg" alt="সোশ্যাল কার্ডের প্রিভিউ" hidden style="width:100%;height:auto;border-radius:12px;border:1px solid var(--bd);display:block"></div></details>';
  }
  function qStep(H, id, d) {
    var s = H.querySelector("#" + id); if (!s || !s.options.length) return;
    var ph = s.options[0] && s.options[0].value === "" && (id === "scTp" || id === "scCp"), lo = ph ? 1 : 0, n = s.options.length - lo, i;
    if (ph) { i = ((QI[id] == null ? -1 : QI[id]) + d + n) % n; if (QI[id] == null && d < 0) i = n - 1; QI[id] = i; s.value = s.options[i + lo].value; }
    else { i = ((s.selectedIndex < 0 ? 0 : s.selectedIndex) + d + n) % n; s.selectedIndex = i; }
    s.dispatchEvent(new Event("change", { bubbles: true })); qLabels(H);
  }
  function qLabels(H) {
    QROWS.forEach(function (r) {
      var s = H.querySelector("#" + r[0]), b = H.querySelector('[data-qn="' + r[0] + '"]'), row = H.querySelector('[data-qrow="' + r[0] + '"]'); if (!s || !b) return;
      var ph = s.options[0] && s.options[0].value === "" && (r[0] === "scTp" || r[0] === "scCp"), lo = ph ? 1 : 0, n = s.options.length - lo, i = ph ? (QI[r[0]] == null ? -1 : QI[r[0]]) : s.selectedIndex - 0, txt = ph ? (i < 0 ? "— একটি বাছুন —" : s.options[i + lo].text) : (s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : "");
      b.textContent = (i >= 0 && n > 0 ? bd(i + 1) + "/" + bd(n) + " · " : "") + (txt.length > 34 ? txt.slice(0, 33) + "…" : txt);
      if (row) { var off = s.disabled || n < 2; row.querySelectorAll("button").forEach(function (x) { x.disabled = off; x.style.opacity = off ? ".4" : "1"; }); if (r[0] === "scPick") row.style.display = s.disabled ? "none" : (row.dataset.for ? row.style.display : ""); }
    });
  }

  function view() {
    M = window.MCA; var V = M.$("#view"), S = window.MCSocial; if (!S) { V.innerHTML = '<h2>📣 সোশ্যাল</h2><p class="warn">social-draw.js লোড হয়নি — ফাইলটি আপলোড আছে কি দেখুন।</p>'; return; }
    var on = onNow(), th = S.TH(), pb = function (k) { return '<button type="button" data-per="' + k + '">' + PER[k] + "</button>"; };
    V.innerHTML = '<div id="scHost"><h2>📣 সোশ্যাল মিডিয়া টেমপ্লেট</h2>' +
      '<p class="sm">ছবি এই ফোন/ব্রাউজারেই আঁকা হয়; সার্ভারে কিছু জমা হয় না। কার্ডে শুধু নাম, বিভাগ, সেশন, স্কোর, র‍্যাংক (আর ঐচ্ছিক ছবি) যায় — আইপি/ফোন/ডিভাইস কখনো নয়। ছবি শুধু সেরা ৩ জনের (বাকিদের নামের প্রথম অক্ষর)।</p>' +
      '<div class="act" style="margin:6px 0;flex-wrap:wrap"><span class="sm">বিজয়ী:</span>' + PER_W.map(pb).join("") + "</div>" +
      '<div class="act" style="margin:6px 0;flex-wrap:wrap"><span class="sm">অন্যান্য কার্ড:</span>' + PER_O.map(pb).join("") + "</div>" +
      '<div class="act" style="margin:6px 0;flex-wrap:wrap" id="scTplRow"><span class="sm">টেমপ্লেট:</span>' + STD.map(function (k) { return '<button type="button" data-kind="' + k + '">' + KIND[k] + "</button>"; }).join("") + "</div>" +
      '<div class="act" style="margin:6px 0"><span class="sm">মাপ:</span><button type="button" data-fmt="post">পোস্ট ১০৮০×১৩৫০</button><button type="button" data-fmt="story">স্টোরি ১০৮০×১৯২০</button><button type="button" data-fmt="land" data-for="cert">A4 আড়াআড়ি ১৭৫৪×১২৪০ (বড় ৩৫০৮×২৪৮০)</button></div>' +
      QUICK() + '<details id="scFold" open style="margin:10px 0"><summary><b>⚙️ সব সেটিং</b> <span class="sm">(ভাঁজ করতে/খুলতে চাপুন)</span></summary><div class="row" style="margin-top:8px"><label>সময়<select id="scRange">' + Object.keys(RANGE).map(function (k) { return '<option value="' + k + '">' + RANGE[k] + "</option>"; }).join("") + "</select></label>" +
      '<label data-rg="lastn">শেষ কত দিন (আজসহ)<input id="scNd" type="number" min="1" max="365" step="1" inputmode="numeric"></label>' +
      '<label data-rg="custom">থেকে<input id="scDf" type="date"></label><label data-rg="custom">পর্যন্ত<input id="scDt" type="date"></label>' +
      '<label data-for="lucky">লাকি ড্র/ঘোষণা<select id="scDraw"></select></label>' +
      '<label data-for="cert">সনদের ডিজাইন (২৪টি)<select id="scCs">' + window.MCSocial.CERTS.map(function (x, i) { return '<option value="' + i + '">' + (i + 1) + '. ' + E(x.n) + '</option>'; }).join("") + '</select></label><label data-for="cert">সনদ নং (ঐচ্ছিক)<input id="scSn" maxlength="30"></label>' +
      '<label data-for="day,week,month,dept,sess,lucky,imp,rec,dvd,part,thx,rem">শিরোনাম বাছুন (৫০টি)<select id="scTp"><option value="">— বাছুন —</option>' + SOC_TITLES.map(function (x) { return '<option>' + E(x) + '</option>'; }).join("") + '</select></label>' +
      '<label data-for="cert">সনদের নাম (৫০টি থেকে বাছুন)<select id="scCp"><option value="">— বাছুন —</option>' + CERT_PRE.map(function (x) { return '<option>' + E(x[0]) + '</option>'; }).join("") + '</select></label>' +
      '<label data-for="cert">সনদের লেখা ({score} {rank} বসানো যায়)<input id="scCb" maxlength="160"></label><label data-for="cert">বাম দাগের ওপরে (আয়োজকের নাম)<input id="scU1" maxlength="30"></label><label data-for="cert">বাম স্বাক্ষর (দাগের নিচে)<input id="scS1" maxlength="30"></label><label data-for="cert">✍️ ডান সই — ইংরেজি লেখা (হাতের সইয়ের মতো; "Granted by MC Explorer" লিখলে ছোট+বড় দু-লাইন)<input id="scSg" maxlength="30" autocapitalize="words" placeholder="Granted by MC Explorer"></label><label data-for="cert">ডান স্বাক্ষর (দাগের নিচে)<input id="scS2" maxlength="30"></label>' +
      '<label data-for="imp">উন্নতি কীসে<select id="scImpm"><option value="score">স্কোর কত বেড়েছে</option><option value="rank">র‍্যাংক কত ধাপ উঠেছে</option></select></label>' +
      '<label>বিভাগ<select id="scDept"><option value="">সব বিভাগ</option></select></label><label>সেশন<select id="scBatch"><option value="">সব সেশন</option></select></label>' +
      '<label data-for="day,week,month,dept,sess,lucky,imp"><span id="scNLbl">মোট কতজন দেখাবে</span><input id="scN" type="number" min="1" max="150" step="1" inputmode="numeric" placeholder="নিজে নিজে"></label>' +
      '<label data-for="dept,sess">প্রতি গ্রুপে শীর্ষ কতজন (স্কোর বোর্ডে)<input id="scKg" type="number" min="1" max="10" step="1" inputmode="numeric"></label>' +
      '<label data-for="day,week,month,dept,sess,lucky,imp,rec,dvd,part,thx,rem">আধুনিক স্টাইল (২০টি: গ্লাস, সিনেম্যাটিক, UI/UX, মোশন)<select id="scSty"><option value="0">ক্লাসিক (নিচের ডিজাইন)</option>' + window.MCSocial.STY.map(function (x, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + E(x.n) + '</option>'; }).join("") + '</select></label>' +
      '<label>ডিজাইন (ক্লাসিক/সনদের থিম)<select id="scDesign">' + th.map(function (t, i) { return '<option value="' + i + '">' + E(t.n) + "</option>"; }).join("") + "</select></label>" +
      '<label>র‍্যাংক-কার্ডে কে<select id="scPick"></select></label>' +
      '<label>শিরোনাম<input id="scTitle" maxlength="40" value="' + E(ST.title) + '"></label><label>নিচের লাইন<input id="scFoot" maxlength="60" value="' + E(ST.footer == null ? siteTxt() : ST.footer) + '"></label>' +
      '<label>সময়কালের লেখা<input id="scPt" maxlength="60" placeholder="খালি = নিজে নিজে"></label><label>"স্কোর" শব্দ<input id="scSl" maxlength="12" value="' + E(ST.slbl) + '"></label><label>"র‍্যাংক" শব্দ<input id="scRl" maxlength="12" value="' + E(ST.rlbl) + '"></label>' +
      '<label>ডাউনলোডের মান<select id="scSc"><option value="1">স্ট্যান্ডার্ড (১০৮০ চওড়া)</option><option value="2">হাই-রেজ (২১৬০ চওড়া) — প্রস্তাবিত</option></select></label></div></details>' +
      '<details id="scTx" data-for="part,thx,rem" open style="margin:8px 0"><summary><b>📝 এই কার্ডের লেখা বদলান</b> <span class="sm">(শুধু এই ছবির জন্য, সার্ভারে যায় না)</span></summary><div id="scTxB"></div></details>' +
      '<details id="scEd" style="margin:8px 0"><summary><b>✏️ নাম/বিভাগ/সেশন/স্কোর/র‍্যাংক হাতে বদলান</b> <span class="sm">(শুধু এই ছবির জন্য, সার্ভারে যায় না)</span></summary><div id="scEdB"></div><div class="act"><button type="button" class="l s" id="scEdR">↩ সব আগের মতো করুন</button></div></details>' +
      '<details id="scLgD" style="margin:8px 0"><summary><b>🖼️ লোগো বাছুন (বাম/ডান)</b></summary><div id="scLgB"><p class="sm">⏳ লোগোর তালিকা আসছে…</p></div></details>' +
      '<div class="act" style="margin:8px 0;flex-wrap:wrap" id="scSw">' + SW.map(function (s) { return '<label style="display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border:1px solid var(--bd);border-radius:999px;cursor:pointer"><input type="checkbox" data-sw="' + s[0] + '"' + (on[s[0]] ? " checked" : "") + ">" + s[1] + "</label>"; }).join("") + "</div>" +
      '</div>';
    var H = V.querySelector("#scHost");
    if (window.MCDL && window.MCDL.boxHtml) { var ub = document.createElement("div"); ub.innerHTML = window.MCDL.boxHtml("👥 সব ইউজার — বেছে কার্ড বানান (সোশ্যাল / সনদ / র‍্যাংক)", ["soc", "cert", "rk", "res", "sty"], "scUl"); V.appendChild(ub); ub.addEventListener("click", function (e) { var b = e.target.closest("[data-ul]"); if (b) window.MCDL.mount(document.getElementById(b.dataset.host), b.dataset.ul); }); }
    sync(H); H.querySelector("#scTxB").innerHTML = txHtml();
    H.onclick = function (e) {
      var t = e.target.closest("button"); if (!t || t.disabled) return;
      if (t.dataset.qs) return qStep(H, t.dataset.qs, +t.dataset.d);
      if (t.dataset.per) { ST.per = t.dataset.per; if (ST.fmt === "land" && ST.per !== "cert") ST.fmt = "post"; if (ST.per === "cert") { ST.kind = "cert"; ST.pick = 0; ST.fmt = "land"; } ST.range = PRE_RANGE[ST.per]; ST.n = ""; ST.title = ""; ST.ptxt = ""; var tt = H.querySelector("#scTitle"); if (tt) tt.value = ""; var pt = H.querySelector("#scPt"); if (pt) pt.value = ""; save(); sync(H); return load(H); }
      if (t.dataset.kind) { ST.kind = t.dataset.kind; save(); sync(H); return paint(H); }
      if (t.dataset.fmt) { ST.fmt = t.dataset.fmt; save(); sync(H); return paint(H); }
      if (t.id === "scRf") { ST.draws = null; ST.pk = ""; return load(H); }
      if (t.id === "scSh") { // 📄 তালিকার নামগুলো থেকে বেছে ২/৩/৫… জনের সনদ বা সোশ্যাল কার্ড একই পেজে (admin-sheet.js)
        if (!window.MCSheet) { alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
        var pl = base().map(function (q, i) { return { key: "s" + i, name: q.name, device: q.device || "", dept: q.deptRaw != null ? q.deptRaw : q.dept, batch: q.batch, score: q.score, rank: q.rk }; }).filter(function (p) { return p.name; });
        if (!pl.length) { alert("তালিকায় এখনো কোনো নাম নেই — ডেটা আসার পর চাপুন।"); return; }
        var fdv = (H.querySelector("#scFd") || {}).value, fo = fdv && window.MCF && window.MCF.folders ? (window.MCF.folders() || []).filter(function (f) { return String(f.id) === fdv; })[0] : null, sk = ST.per === "cert" ? "cert" : "social";
        return window.MCSheet.open(pl, { kind: sk, title: ST.title.trim() || autoTitle(), dl: fo ? { edit: true, folder: fdv, ct: sk === "cert" ? "cert" : "soc", kind: sk, fname: fo.name, cname: sk === "cert" ? "🎓 সার্টিফিকেট" : "📣 সোশ্যাল কার্ড" } : null });
      }
      if (t.id === "scDl") return download(H);
      if (t.id === "scEdR") { ST.ov = {}; fillSel(H); return paint(H); }
    };
    H.onchange = function (e) {
      var t = e.target;
      if (t.id === "scRange") { ST.range = t.value; save(); sync(H); return load(H); }
      if (t.id === "scNd") { ST.nd = Math.min(365, Math.max(1, Math.floor(+t.value) || 1)); t.value = ST.nd; save(); return load(H); }
      if (t.id === "scDf" || t.id === "scDt") { ST[t.id === "scDf" ? "df" : "dt"] = t.value; save(); return load(H); }
      if (t.id === "scDraw") { ST.drawId = t.value; ST.title = ""; var tt = H.querySelector("#scTitle"); if (tt) tt.value = ""; return load(H); }
      if (t.id === "scImpm") { ST.impm = t.value === "rank" ? "rank" : "score"; save(); return load(H); }
      if (t.id === "scDept") { ST.dept = t.value; return load(H); }
      if (t.id === "scBatch") { ST.batch = t.value; return load(H); }
      if (t.id === "scN") { ST.n = +t.value > 0 ? String(Math.min(150, Math.floor(+t.value))) : ""; t.value = ST.n; save(); return paint(H); }
      if (t.id === "scKg") { ST.kg = Math.min(10, Math.max(1, Math.floor(+t.value) || 1)); t.value = ST.kg; save(); build(); fillSel(H); return paint(H); }
      if (t.id === "scSc") { ST.sc = +t.value === 1 ? 1 : 2; save(); return paint(H); }
      if (t.id === "scDesign") { ST.d = +t.value || 0; save(); return paint(H); }
      if (t.id === "scPick") { ST.pick = +t.value || 0; return paint(H); }
      if (t.id === "scSty") { ST.sty = +t.value || 0; save(); return paint(H); }
      if (t.id === "scCs") { ST.cs = +t.value || 0; save(); return paint(H); }
      if (t.id === "scTp") { if (t.value) { ST.title = t.value; var tt3 = H.querySelector("#scTitle"); if (tt3) tt3.value = t.value; sync(H); paint(H); } return; }
      if (t.id === "scCp") { if (t.value) { ST.title = t.value; var tt2 = H.querySelector("#scTitle"); if (tt2) tt2.value = t.value; ST.cb = ""; sync(H); paint(H); } return; }
      if (t.id === "scCnt") { ST.cnt = t.checked ? 1 : 0; return paint(H); }
      if (t.dataset && t.dataset.sw) { ST.on = onNow(); ST.on[t.dataset.sw] = t.checked ? 1 : 0; save(); return paint(H); }
    };
    H.oninput = function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.ov) { var m = t.dataset.ov.split(":"); (ST.ov[m[0]] = ST.ov[m[0]] || {})[m[1]] = t.value; soon(H); }
      else if (t.dataset && t.dataset.sl != null && t.dataset.sl !== "") { ST.sl[+t.dataset.sl] = t.value; soon(H); }
      else if (t.dataset && t.dataset.sv != null && t.dataset.sv !== "") { ST.sv[+t.dataset.sv] = t.value; soon(H); }
      else if (t.id === "scSn") { ST.sno = t.value; soon(H); }
      else if (t.id === "scCb") { ST.cb = t.value; soon(H); } else if (t.id === "scU1") { ST.u1 = t.value; save(); soon(H); } else if (t.id === "scSg") { ST.sg = t.value; save(); soon(H); } else if (t.id === "scS1") { ST.s1 = t.value; soon(H); } else if (t.id === "scS2") { ST.s2 = t.value; soon(H); }
      else if (t.id === "scMh") { ST.mh = t.value; soon(H); } else if (t.id === "scMb") { ST.mb = t.value; soon(H); } else if (t.id === "scMc") { ST.mc = t.value; soon(H); }
      else if (t.id === "scPt") { ST.ptxt = t.value; soon(H); } else if (t.id === "scSl") { ST.slbl = t.value; soon(H); } else if (t.id === "scRl") { ST.rlbl = t.value; soon(H); }
      else if (t.id === "scTitle") { ST.title = t.value; soon(H); } else if (t.id === "scFoot") { ST.footer = (t.value.trim() === siteTxt() || /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?\/?$/i.test(t.value.trim())) ? null : t.value; save(); soon(H); }
    };
    var ML = window.mcLogo, lb = H.querySelector("#scLgB");   // অ্যাডমিনের লোগো-বাছাই (সব লোগো + "অক্ষর লিখব"); বাছাই শুধু এই ছবির, সার্ভারে জমা হয় না
    if (ML && ML.picker && ML.load) Promise.resolve(ML.load()).then(function () { lb.innerHTML = ""; lb.appendChild(ML.picker({ admin: true, init: ST.lg || {}, onChange: function (ov) { ST.lg = ov; paint(H); } })); }, function () { lb.innerHTML = '<p class="sm">লোগোর তালিকা আনা যায়নি — ডিফল্ট লোগো বসবে।</p>'; });
    else lb.innerHTML = '<p class="sm">লোগো-বাছাই ফাইল (logo-config.js) পাওয়া যায়নি — ডিফল্ট লোগো বসবে।</p>';
    return load(H);
  }
})();

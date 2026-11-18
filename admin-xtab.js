// অ্যাডমিনের বাকি ট্যাবে "⬇ এক্সেল (সাজানো)" বাটন (ধাপ ৫-ক) — একই ডিজাইন (admin-xlsx.js) ও একই ফিল্টার-জানালা/কলাম-নির্বাচক (admin-xdlg.js)।
// ধাপ ৫-খ-তে যোগ: 🪪 কার্ড | 🏅 বিজয়ী ঘোষণা | 🏆 বিজয়ী কার্ড সেটিংস | 🖼 কুইজ ছবি | 🖼️ ছবির গ্যালারি (📁 ফোল্ডার বাকি — আলাদা ট্যাব-বোতাম নেই)।
// ধাপ ৫-ক-তে আছে: 📊 সার্ভে | 🏆 লিডারবোর্ড সেটিংস | 🏆 স্কোর | 👥 ভিজিটর | 👤 User Info | 🎁 পুরস্কার ও নোট। (ধাপ ৫-খ/৫-গ-র ট্যাবগুলো পরে এই ফাইলের REG-এ যোগ হবে: MCXTAB.add(চাবি, cfg))
// নতুন ডাটা জমে না, SQL লাগে না: শুধু আগে থেকে থাকা ডাটা পড়ে (প্রতিবার বাটন চাপলে নতুন করে)। পুরোনো CSV/বাটন যেমন ছিল তেমনই।
// বাটন নিজে বসে: ট্যাবের লেখা আঁকা হলে (#view বদলালে) বর্তমান ট্যাব REG-এ থাকলে ওপরে বাটন বসায়। অন্য ট্যাবের ফাইল বদলাতে হয়নি।
// cfg: { sheet, sub, name, src, tbl, load():Promise<rows>, cols:[{k,t,w,a,ty,lock}], filters:[…], modes:[[v,t]], sorts:[[v,t]], cmp:{v:fn}, mode(f,row), box(rows,ctx), pod(rows), podTitle, podNeutral, top(rows), cards(rows), cap }
// সারি: { ts(ms, ঐচ্ছিক), name, dept, batch, score, pct, ok, _s(খোঁজার লেখা), … }। ডিফল্ট 'score' কলাম = ক্লাস-রঙের স্কোর-ঘর, 'rk' = র‍্যাংক।
(function () {
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var CAP = 20000, REG = {}, LOGOP = null;
  var M = function () { return window.MCA; };
  var lc = function (x) { return String(x || "").trim().toLowerCase(); };
  var uniq = function (rows, k) { var m = {}; rows.forEach(function (r) { if (r[k]) m[r[k]] = 1; }); return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, "bn"); }); };
  var lst = function (a) { return a.map(function (v) { return { v: v, t: v }; }); };

  function pageRest(path, step) { // REST-এ ১০০০টি করে পৃষ্ঠা, সর্বোচ্চ ২০,০০০
    var all = [];
    return (function nx(off) { return M().A(path + "&limit=" + step + "&offset=" + off).then(function (L) { L = L || []; all = all.concat(L); if (L.length === step && off + step < CAP) return nx(off + step); }); })(0).then(function () { return all; });
  }
  function pageRpc(name, args, step) { // RPC {rows,total} — পৃষ্ঠা ধরে ধরে
    var all = [];
    return (function nx(off) { return M().rpc(name, Object.assign({}, args, { p_limit: step, p_offset: off })).then(function (r) { var L = (r && r.rows) || []; all = all.concat(L); if (L.length === step && off + step < CAP && (!r.total || all.length < r.total)) return nx(off + step); }); })(0).then(function () { return all; });
  }
  function rankInto(L, gk) { // সমান স্কোরে একই র‍্যাংক (সাইটের নিয়ম)
    var g = {}; L.forEach(function (x) { var k = gk(x); (g[k] = g[k] || []).push(x); });
    Object.keys(g).forEach(function (k) { var prev = null, rk = 0; g[k].slice().sort(function (p, q) { return (+q.score || 0) - (+p.score || 0); }).forEach(function (x, i) { var s = +x.score || 0; if (prev === null || s !== prev) { rk = i + 1; prev = s; } x.rk = rk; }); });
  }
  function dayStr(ts) { var d = new Date(ts); return isNaN(d) ? "" : d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }

  // ---------- ট্যাবের ডাটা ও কলাম ----------
  var C_ID = { rk: { t: "র‍্যাংক", w: 13, a: "c" } };
  // 📊 সার্ভে
  REG.survey = {
    sheet: "সার্ভে", name: "Survey", sub: "সার্ভে-ফলাফল", tbl: "📋 সার্ভের অপশন ও ভোট", src: "অ্যাডমিন › 📊 সার্ভে ট্যাব · ডাটাবেজ: mc2_survey_opts (অপশন) ও mc2_survey_votes (ভোট; হিসাব mc2_survey_get)",
    title: "⬇ এক্সেল ডাউনলোড — সার্ভে", filters: ["q", "mode", "sort"],
    modes: [["all", "দুটো প্রশ্নই"], ["fav", "১) কলেজের প্রিয় জায়গা"], ["chg", "২) কলেজ নিয়ে কী বদলাতে চাও"]], sorts: [["def", "প্রশ্ন ও ক্রম অনুযায়ী"], ["votes", "বেশি ভোট আগে"], ["name", "অপশনের নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "rk", t: "র‍্যাংক (প্রশ্নের ভেতরে)", w: 14, a: "c" }, { k: "qn", t: "প্রশ্ন", w: 44, a: "l" }, { k: "label", t: "অপশন / জায়গা", w: 34, a: "l" }, { k: "cnt", t: "ভোট (জন)", w: 12, a: "c", ty: "n" }, { k: "pctv", t: "শতাংশ", w: 11, a: "c", ty: "n" }, { k: "state", t: "অবস্থা", w: 14, a: "c", ty: "c" }],
    load: function () {
      var QN = { fav: "১) কলেজের প্রিয় জায়গা?", chg: "২) কলেজ নিয়ে কী বদলাতে চাও?" };
      return Promise.all([M().A("mc2_survey_opts?select=id,q,label,sort,active&order=q.asc,sort.asc,id.asc"), M().rpc("mc2_survey_get", { p_device: null })]).then(function (a) {
        var opts = a[0] || [], r = a[1] || {}, rows = [], tot = { fav: +r.nf || 0, chg: +r.nc || 0 };
        opts.forEach(function (o, i) { var c = +((r[o.q] || {})[o.id]) || 0, n = tot[o.q] || 0; rows.push({ q: o.q, qn: QN[o.q] || o.q, label: o.label, cnt: c, score: c, pctv: n ? Math.round(c / n * 1000) / 10 : 0, state: o.active ? "দেখানো" : "লুকানো", _s: o.label, _i: i }); });
        ["fav", "chg"].forEach(function (q) { rankInto(rows.filter(function (x) { return x.q === q; }), function () { return "*"; }); });
        rows.ctx = { total: +r.total || 0, nf: tot.fav, nc: tot.chg }; return rows;
      });
    },
    mode: function (m, x) { return m === "all" || x.q === m; },
    cmp: { def: function (a, b) { var o = { fav: 0, chg: 1 }; return ((o[a.q] || 0) - (o[b.q] || 0)) || (a._i - b._i); }, votes: function (a, b) { return b.cnt - a.cnt; }, name: function (a, b) { return String(a.label).localeCompare(String(b.label), "bn"); } },
    box: function (rows, ctx) { return [["মোট ভোটার", ctx.total], ["প্রিয় জায়গা-উত্তরদাতা", ctx.nf], ["বদলানো-উত্তরদাতা", ctx.nc], ["মোট অপশন", rows.length]]; },
    pod: function (rows) { var top = function (q) { var L = rows.filter(function (x) { return x.q === q; }).sort(function (a, b) { return b.cnt - a.cnt; }); return L.length && L[0].cnt ? L[0] : null; }, f = top("fav"), c = top("chg"), h = rows.filter(function (x) { return x.state === "লুকানো"; }).length; return [f ? "প্রিয় জায়গায় সবার আগে: " + f.label + " — " + bd(f.cnt) + " জন (" + bd(f.pctv) + " শতাংশ)" : "প্রিয় জায়গার ভোট নেই", c ? "বদলাতে চান সবচেয়ে বেশি: " + c.label + " — " + bd(c.cnt) + " জন (" + bd(c.pctv) + " শতাংশ)" : "বদলানোর ভোট নেই", "লুকানো অপশন: " + bd(h) + "টি"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  };
  // 🏆 লিডারবোর্ড সেটিংস (এন্ট্রি-তালিকা)
  REG.board = {
    sheet: "লিডারবোর্ড", name: "Leaderboard", sub: "লিডারবোর্ড", tbl: "📋 লিডারবোর্ড-এন্ট্রি", src: "অ্যাডমিন › 🏆 লিডারবোর্ড সেটিংস ট্যাব · ডাটাবেজ: mc2_board_admin_list (mc2_scores + mc2_cards) · র‍্যাংক = এই তালিকার স্কোর অনুযায়ী (সমান স্কোরে একই)",
    title: "⬇ এক্সেল ডাউনলোড — লিডারবোর্ড", filters: ["q", "mode", "dept", "batch", "score", "ok", "sort"],
    modes: [["all", "সব এন্ট্রি"], ["shown", "শুধু দেখানো"], ["hid", "শুধু লুকানো"], ["card", "কার্ড আছে"], ["nocard", "কার্ড নেই"]], sorts: [["rank", "র‍্যাংক অনুযায়ী"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "rk", t: "র‍্যাংক", w: 13, a: "c" }, { k: "score", t: "স্কোর", w: 14, a: "c" }, { k: "name", t: "নাম", w: 34, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "ok", t: "সঠিক", w: 9, a: "c" }, { k: "total", t: "মোট প্রশ্ন", w: 12, a: "c" }, { k: "vis", t: "লিডারবোর্ডে", w: 16, a: "c", ty: "c" }, { k: "card", t: "কার্ড", w: 12, a: "c", ty: "c" }, { k: "photo", t: "কার্ডের ছবি", w: 16, a: "c", ty: "c" }],
    load: function () {
      return pageRpc("mc2_board_admin_list", { p_q: null, p_dept: null, p_batch: null, p_state: "all" }, 100).then(function (L) {
        var rows = L.map(function (r) { return { id: r.id, name: r.name, dept: r.dept, batch: r.batch, score: +r.sc || 0, ok: r.ok == null ? "" : +r.ok, total: r.total == null ? "" : +r.total, hidden: !!r.hidden, vis: r.hidden ? "🙈 লুকানো" : "দেখানো", hascard: !!r.has_card, card: r.has_card ? "আছে" : "নেই", photo: r.has_card ? (r.photo_show ? (r.has_photo ? "দেখানো" : "ছবি নেই") : (r.has_photo ? "লুকানো" : "ছবি নেই")) : "—", _s: [r.name, r.dept, r.batch].join(" ") }; });
        return rows;
      });
    },
    mode: function (m, x) { return m === "all" || (m === "shown" && !x.hidden) || (m === "hid" && x.hidden) || (m === "card" && x.hascard) || (m === "nocard" && !x.hascard); },
    rank: 1, cards: function (rows) { return rows.filter(function (x) { return x.hascard; }).length; }
  };
  // 🏆 স্কোর (সব স্কোর-লগ, mc2_scores)
  REG.score = {
    sheet: "স্কোর", name: "Scores", sub: "স্কোর", tbl: "📋 স্কোর-তালিকা", src: "অ্যাডমিন › 🏆 স্কোর ট্যাব · ডাটাবেজ টেবিল: mc2_scores · র‍্যাংক = বাছা তালিকার ভেতরে (সমান স্কোরে একই)",
    title: "⬇ এক্সেল ডাউনলোড — স্কোর", filters: ["per", "q", "mode", "dept", "batch", "score", "pct", "sort"],
    modes: [["all", "সব খেলা"], ["best", "প্রত্যেকের সেরা ফল"]], sorts: [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["rank", "র‍্যাংক অনুযায়ী"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "rk", t: "র‍্যাংক", w: 13, a: "c" }, { k: "score", t: "স্কোর", w: 14, a: "c" }, { k: "name", t: "নাম", w: 34, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "cls", t: "ক্লাস", w: 19, a: "c" }, { k: "ts", t: "তারিখ", w: 23, a: "c" }, { k: "pct", t: "শতাংশ", w: 11, a: "c" }, { k: "ok", t: "সঠিক", w: 9, a: "c" }, { k: "total", t: "মোট প্রশ্ন", w: 12, a: "c" }, { k: "title", t: "উপাধি", w: 26, a: "l" }],
    load: function () {
      return pageRest("mc2_scores?select=*&order=created_at.desc", 1000).then(function (L) {
        return L.map(function (s) { var sc = +s.score || 0; return { id: s.id, name: s.name, dept: s.dept, batch: s.batch, score: sc, pct: s.pct == null ? sc / 10 : +s.pct, ok: s.ok == null ? "" : +s.ok, total: s.total == null ? "" : +s.total, title: s.title || "", ts: new Date(s.created_at).getTime(), _s: [s.name, s.dept, s.batch].join(" ") }; });
      });
    },
    mode: function (m, x, all) { if (m !== "best") return true; var b = all.best[lc(x.name) + "|" + (x.dept || "") + "|" + (x.batch || "")]; return b === x; },
    prep: function (rows) { var best = {}; rows.forEach(function (x) { var k = lc(x.name) + "|" + (x.dept || "") + "|" + (x.batch || ""); if (!best[k] || x.score > best[k].score) best[k] = x; }); return { best: best }; },
    rank: 1, cards: function () { return null; }
  };
  // 👥 ভিজিটর (mc2_visits)
  REG.visit = {
    sheet: "ভিজিটর", name: "Visitors", sub: "ভিজিটর-লগ", tbl: "📋 ভিজিট-লগ", src: "অ্যাডমিন › 👥 ভিজিটর ট্যাব · ডাটাবেজ টেবিল: mc2_visits (পুরোনো CSV-তে যা ছিল তার বেশি কিছু নেই: সময়, ডিভাইস, আইপি, পেজ, ইউজার-এজেন্ট, তথ্য)",
    title: "⬇ এক্সেল ডাউনলোড — ভিজিটর", filters: ["per", "q", "mode", "sort"],
    modes: [["all", "সব ভিজিট"], ["uniq", "প্রতি ডিভাইসের একটা (সবচেয়ে নতুন)"], ["mob", "শুধু মোবাইল"], ["desk", "শুধু ডেস্কটপ"], ["app", "অ্যাপের ভেতরের ব্রাউজার"]], sorts: [["new", "নতুন আগে"], ["old", "পুরোনো আগে"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "ts", t: "সময়", w: 23, a: "c" }, { k: "page", t: "পেজ", w: 22, a: "l" }, { k: "ip", t: "আইপি", w: 18, a: "c", ty: "c" }, { k: "kind", t: "ধরন", w: 12, a: "c", ty: "c" }, { k: "dev", t: "ডিভাইস", w: 30, a: "l" }, { k: "inapp", t: "অ্যাপের ভেতরে", w: 14, a: "c", ty: "c" }, { k: "lang", t: "ভাষা", w: 10, a: "c", ty: "c" }, { k: "tz", t: "টাইম-জোন", w: 18, a: "c", ty: "c" }, { k: "plat", t: "প্ল্যাটফর্ম", w: 14, a: "c", ty: "c" }, { k: "net", t: "নেট", w: 10, a: "c", ty: "c" }, { k: "ua", t: "ইউজার-এজেন্ট", w: 60, a: "l" }],
    load: function () {
      return pageRest("mc2_visits?select=*&order=created_at.desc", 1000).then(function (L) {
        return L.map(function (v) { var i = v.info || {}, mob = /Mobi|Android|iPhone|iPad/i.test(v.ua || ""); return { id: v.id, ts: new Date(v.created_at).getTime(), page: v.page || "", ip: v.ip || "", kind: mob ? "মোবাইল" : "ডেস্কটপ", mob: mob, dev: v.device || "", inapp: i.inapp ? "হ্যাঁ" : "না", app: !!i.inapp, lang: i.lang || "", tz: i.tz || "", plat: i.plat || "", net: i.net || "", ua: v.ua || "", _s: [v.ip, v.device, v.page, v.ua, JSON.stringify(i)].join(" ") }; });
      });
    },
    mode: function (m, x, all) { return m === "all" || m === "uniq" && all.first[x.dev] === x || m === "mob" && x.mob || m === "desk" && !x.mob || m === "app" && x.app; },
    prep: function (rows) { var first = {}; rows.forEach(function (x) { if (x.dev && (!first[x.dev] || x.ts > first[x.dev].ts)) first[x.dev] = x; }); return { first: first }; },
    box: function (rows) { var d = {}, t0 = new Date(); t0.setHours(0, 0, 0, 0); var td = 0, mb = 0; rows.forEach(function (x) { d[x.dev] = 1; if (x.ts >= t0.getTime()) td++; if (x.mob) mb++; }); return [["মোট ভিজিট", rows.length], ["আলাদা ডিভাইস", Object.keys(d).length], ["আজকের ভিজিট", td], ["মোবাইল (শতাংশ)", rows.length ? Math.round(mb / rows.length * 100) : 0]]; },
    pod: function (rows) { var pg = {}, dy = {}, ia = 0; rows.forEach(function (x) { pg[x.page || "—"] = (pg[x.page || "—"] || 0) + 1; var d = dayStr(x.ts); if (d) dy[d] = (dy[d] || 0) + 1; if (x.app) ia++; }); var top = function (m) { var k = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; })[0]; return k ? [k, m[k]] : null; }, p = top(pg), d = top(dy); return [p ? "সবচেয়ে বেশি দেখা পেজ: " + p[0] + " — " + bd(p[1]) + " বার" : "—", d ? "সবচেয়ে ব্যস্ত দিন: " + bd(d[0]) + " — " + bd(d[1]) + "টি ভিজিট" : "—", "অ্যাপের ভেতরের ব্রাউজার থেকে: " + bd(ia) + "টি ভিজিট"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  };
  // 👤 User Info (mc2_admin_users2)
  REG.usr = {
    sheet: "User Info", name: "UserInfo", sub: "User Info (ভিজিটর-তালিকা)", tbl: "📋 User Info — ভিজিটর-তালিকা", src: "অ্যাডমিন › 👤 User Info ট্যাব · ডাটাবেজ: mc2_admin_users2 (ফোন নম্বর ফাইলে যায় না; জায়গা আনুমানিক)",
    title: "⬇ এক্সেল ডাউনলোড — User Info", filters: ["per", "q", "mode", "dept", "batch", "score", "sort"],
    modes: [["all", "সব ভিজিটর"], ["on", "শুধু অনলাইন"], ["off", "শুধু অফলাইন"], ["sc", "স্কোর আছে"], ["nosc", "স্কোর নেই"]], sorts: [["new", "সর্বশেষ সক্রিয় আগে"], ["old", "পুরোনো আগে"], ["score", "বেশি স্কোর আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "gender", t: "জেন্ডার", w: 16, a: "c", ty: "c" }, { k: "score", t: "সেরা স্কোর", w: 14, a: "c" }, { k: "status", t: "অবস্থা", w: 14, a: "c", ty: "c" }, { k: "ts", t: "শেষ সক্রিয়", w: 23, a: "c" }, { k: "uid", t: "ইউজার আইডি", w: 16, a: "c" }, { k: "loc", t: "জায়গা (আনুমানিক)", w: 30, a: "l" }, { k: "ip", t: "আইপি", w: 18, a: "c", ty: "c" }, { k: "br", t: "ব্রাউজার/ডিভাইস", w: 34, a: "l" }],
    load: function () {
      var base = { p_q: "", p_status: "all", p_gender: "", p_dept: "", p_sess: "", p_country: "", p_dev: "", p_os: "", p_br: "", p_phone: "", p_score: "", p_active: "", p_sort: "new", p_from: "", p_to: "" };
      var F = window.MCA_FMT || {}, G = { m: "👦 ছেলে", f: "👧 মেয়ে", x: "⚪ ভিজিটর/অজানা" };
      return pageRpc("mc2_admin_users2", base, 100).catch(function () { return pageRpc("mc2_admin_users", { p_q: "", p_online: false }, 50); }).then(function (L) {
        return L.map(function (x) {
          var nm = x.gname || x.nick || "অজানা", p = [x.city, x.region, x.country].filter(function (v) { return v && v !== "XX" && v !== "T1"; }), has = x.best != null;
          return { id: x.voter, name: nm, dept: x.gdept || x.cdept || "", batch: x.gbatch || x.csess || "", gender: G[x.gender] || G.x, score: has ? +x.best : "", has: has, online: !!x.online, status: x.online ? "🟢 অনলাইন" : "অফলাইন", ts: +x.ls || 0, uid: x.uid || "", loc: p.join(", "), ip: x.ip || "", br: F.ua ? F.ua(x.ua, x.info) : "", _s: [nm, x.gdept, x.cdept, x.gbatch, x.csess, x.ip, x.uid, p.join(" ")].join(" ") };
        });
      });
    },
    mode: function (m, x) { return m === "all" || m === "on" && x.online || m === "off" && !x.online || m === "sc" && x.has || m === "nosc" && !x.has; },
    cmp: { new: function (a, b) { return b.ts - a.ts; }, old: function (a, b) { return a.ts - b.ts; }, score: function (a, b) { return (+b.score || 0) - (+a.score || 0); }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var sc = rows.filter(function (x) { return x.has; }), s = 0; sc.forEach(function (x) { s += +x.score; }); return [["মোট ভিজিটর", rows.length], ["এখন অনলাইন", rows.filter(function (x) { return x.online; }).length], ["স্কোর আছে যাদের", sc.length], ["গড় সেরা স্কোর", sc.length ? Math.round(s / sc.length) : 0]]; },
    pod: function (rows) { var t = rows.filter(function (x) { return x.has; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? (["১ম", "২য়", "৩য়"][i]) + " — " + t[i].name + " (" + (t[i].dept || "—") + ") — সেরা স্কোর ➜ " + bd(t[i].score) : i ? "" : "এই তালিকায় স্কোরধারী কেউ নেই"; }); },
    podTitle: "🏆 সর্বোচ্চ স্কোরধারী তিনজন"
  };
  // 🎁 পুরস্কার ও নোট
  REG.pn = {
    sheet: "পুরস্কার ও নোট", name: "Prize-Notes", sub: "পুরস্কার ও নোট", tbl: "📋 বিজয়ী — পুরস্কার ও নোট", src: "অ্যাডমিন › 🎁 পুরস্কার ও নোট ট্যাব · ডাটাবেজ: mc2_draw_admin_list (বিজয়ী-ফোল্ডার) ও mc2_pn_list (দেওয়া হয়েছে কি না, নোট, ফ্ল্যাগ) — শুধু অ্যাডমিন দেখেন",
    title: "⬇ এক্সেল ডাউনলোড — পুরস্কার ও নোট", filters: ["q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব বিজয়ী"], ["off", "⏳ পুরস্কার দেওয়া হয়নি"], ["on", "✅ দেওয়া হয়েছে"], ["note", "📝 নোট আছে"], ["flag", "🚩 ফ্ল্যাগ করা"]], sorts: [["def", "ফোল্ডার ও ক্রম অনুযায়ী"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "folder", t: "ফোল্ডার (ঘোষণা)", w: 34, a: "l" }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "given", t: "পুরস্কার", w: 20, a: "c", ty: "c" }, { k: "flag", t: "ফ্ল্যাগ", w: 10, a: "c", ty: "c" }, { k: "note", t: "নোট", w: 50, a: "l" }],
    load: function () {
      return Promise.all([M().rpc("mc2_draw_admin_list"), M().rpc("mc2_pn_list").catch(function () { return []; })]).then(function (a) {
        var PN = {}; (a[1] || []).forEach(function (x) { PN[x.draw_id + "|" + x.wid] = { g: !!x.given, n: x.note || "", f: !!x.flag }; });
        var rows = [], ds = ((a[0] && a[0].rows) || []).filter(function (q) { return q.source !== "wcard-manual"; });
        ds.forEach(function (d) {
          var ws = d.winners || [], k = function (w) { return [lc(w.name), lc(w.dept), lc(w.batch)].join("|"); };
          ws.forEach(function (w, i) { var n = 0, j; for (j = 0; j < i; j++) if (k(ws[j]) === k(w)) n++; var o = PN[d.id + "|" + k(w) + "|" + n] || {}; rows.push({ folder: d.title || "", name: w.name, dept: w.dept || "", batch: w.batch || "", given: o.g ? "✅ দেওয়া হয়েছে" : "⏳ হয়নি", g: !!o.g, flag: o.f ? "🚩" : "", f: !!o.f, note: o.n || "", _s: [w.name, w.dept, w.batch, d.title, o.n].join(" ") }); });
        });
        rows.ctx = { folders: ds.length }; return rows;
      });
    },
    mode: function (m, x) { return m === "all" || m === "off" && !x.g || m === "on" && x.g || m === "note" && !!x.note.trim() || m === "flag" && x.f; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows, ctx) { return [["মোট বিজয়ী", rows.length], ["পুরস্কার দেওয়া হয়েছে", rows.filter(function (x) { return x.g; }).length], ["এখনো দেওয়া হয়নি", rows.filter(function (x) { return !x.g; }).length], ["ঘোষণা-ফোল্ডার", ctx.folders || 0]]; },
    pod: function (rows) { return ["🚩 ফ্ল্যাগ করা: " + bd(rows.filter(function (x) { return x.f; }).length) + " জন", "📝 নোট আছে: " + bd(rows.filter(function (x) { return x.note.trim(); }).length) + " জন", "⏳ পুরস্কার বাকি: " + bd(rows.filter(function (x) { return !x.g; }).length) + " জন"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  };

  // ---------- ফিল্টার-হিসাব ----------
  function norm(cfg, f) { // জানালার ডিফল্ট ("র‍্যাংক"/"সেরা") এই ট্যাবের তালিকায় না থাকলে প্রথম অপশন (জানালায় যেটা দেখায়)
    var g = Object.assign({}, f), ok = function (L, v) { return (L || []).some(function (x) { return x[0] === v; }); };
    if (cfg.sorts && !ok(cfg.sorts, g.sort)) g.sort = cfg.sorts[0][0];
    if (cfg.modes && !ok(cfg.modes, g.mode)) g.mode = cfg.modes[0][0];
    return g;
  }
  function compute(cfg, f, all) {
    f = norm(cfg, f); var X = window.MCXLSX, D = window.MCXDLG, r = D.range(f), t1 = r.from ? new Date(r.from + "T00:00:00").getTime() : 0, t2 = r.to ? new Date(r.to + "T00:00:00").getTime() + 864e5 : 0, q = lc(f.q), pre = cfg.prep ? cfg.prep(all) : {};
    var nv = function (v) { return v === "" || v == null ? null : +v; }, smin = nv(f.smin), smax = nv(f.smax), pmin = nv(f.pmin), pmax = nv(f.pmax), omin = nv(f.okmin), omax = nv(f.okmax);
    var rows = all.filter(function (x) {
      if (cfg.filters.indexOf("per") >= 0 && f.per !== "all" && x.ts) { if (t1 && x.ts < t1 || t2 && x.ts >= t2) return false; }
      if (q && String(x._s || "").toLowerCase().indexOf(q) < 0) return false;
      if (f.dept.length && f.dept.indexOf(x.dept) < 0 || f.batch.length && f.batch.indexOf(x.batch || "") < 0) return false;
      if (cfg.mode && !cfg.mode(f.mode, x, pre)) return false;
      return true;
    });
    if (cfg.rank) rankInto(rows, function () { return "*"; });
    rows = rows.filter(function (x) {
      var s = +x.score || 0, p = x.pct == null ? s / 10 : +x.pct, ok = +x.ok || 0;
      if (smin != null && s < smin || smax != null && s > smax) return false;
      if (pmin != null && p < pmin || pmax != null && p > pmax) return false;
      if ((omin != null || omax != null) && (x.ok === "" || omin != null && ok < omin || omax != null && ok > omax)) return false;
      return true;
    });
    var byRk = function (a, b) { return (a.rk - b.rk) || ((a.ts || 0) - (b.ts || 0)); }, top3 = cfg.rank ? rows.slice().sort(byRk).slice(0, 3) : null;
    var sort = f.sort, cmp = (cfg.cmp || {})[sort];
    if (cmp) rows.sort(cmp);
    else if (sort === "new") rows.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    else if (sort === "old") rows.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    else if (sort === "name") rows.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); });
    else if (sort === "rank" || cfg.rank) rows.sort(byRk);
    return { rows: rows, top3: top3 };
  }
  function logoC() { return LOGOP || (LOGOP = fetch("images/logo-mc.png").then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { return b ? new Uint8Array(b) : null; }).catch(function () { return null; })); }
  function who() { return window.MCEXBY ? window.MCEXBY.get() : "অ্যাডমিন"; }
  var lab = function (L, v) { for (var i = 0; i < (L || []).length; i++) if (L[i][0] === v) return L[i][1]; return v; };

  // ফাইল তৈরি (জানালা ছাড়া সরাসরি; পরীক্ষার জন্যও) — রিটার্ন: Promise<{bytes,name,n}>
  function make(key, f, cols, all, onProgress, thumbMap) {
    var cfg = REG[key], X = window.MCXLSX; f = norm(cfg, f); var o = compute(cfg, f, all), rows = o.rows, ctx = all.ctx || {}, defs = {}, order = [], d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
    cfg.cols.forEach(function (c) { order.push(c.k); defs[c.k] = { t: c.t, w: c.w || 12, a: c.a || "l", ty: c.ty }; });
    if (!thumbMap) { cols = cols.filter(function (k) { return k !== "thumb"; }); order = order.filter(function (k) { return k !== "thumb"; }); } else rows.forEach(function (x) { x.thumb = thumbMap[x.id] ? "" : "—"; });
    var mlab = lab(cfg.modes, f.mode), fl = [window.MCXDLG.describe(f), cfg.modes && f.mode !== cfg.modes[0][0] ? "ধরন: " + mlab : ""].filter(Boolean).join(" · ");
    var opt = { rows: rows, cols: cols, colDefs: defs, colOrder: order, sheet: cfg.sheet, sub: cfg.sub, srcTxt: cfg.src, tblTitle: cfg.tbl, tblSrc: "ডাটার উৎস: " + cfg.src.split(" · ")[0] + (defs.score ? " · স্কোরের ঘরের রঙ = ক্লাস" : ""), filters: fl || "কোনো ফিল্টার নেই (সব ডাটা)", mode: mlab || "", cards: cfg.cards ? cfg.cards(rows) : null, by: who(), site: (window.MC_CFG && window.MC_CFG.siteUrl) || (typeof location !== "undefined" && /^https?:/.test(location.origin) ? location.origin + "/" : ""), truncated: all.length >= CAP, onProgress: onProgress };
    opt.thumbs = thumbMap ? rows.map(function (x, i) { var b = thumbMap[x.id]; return b ? { row: i, d: b.d, w: b.w, h: b.h } : null; }).filter(Boolean) : [];
    if (cfg.box) opt.boxes = cfg.box(rows, ctx).map(function (b) { return [b[0], typeof b[1] === "number" ? X.bd(b[1]) : b[1]]; });
    if (cfg.pod) { opt.pod = cfg.pod(rows); opt.podTitle = cfg.podTitle; opt.podNeutral = !!cfg.podNeutral; }
    if (o.top3) opt.top3 = o.top3;
    return logoC().then(function (lg) { opt.logo = lg; return X.results(opt); }).then(function (bytes) { return { bytes: bytes, n: rows.length, name: "MC-Explorer-" + cfg.name + "-" + d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + ".xlsx" }; });
  }

  function run(key, btn) {
    var cfg = REG[key], D = window.MCXDLG, X = window.MCXLSX, M0 = M();
    if (!X) return alert("admin-xlsx.js ফাইলটি পাওয়া যায়নি — admin.html-এর সাথে আপলোড করুন।");
    if (!D) return alert("admin-xdlg.js ফাইলটি পাওয়া যায়নি — admin.html-এর সাথে আপলোড করুন।");
    var lb = btn.textContent; btn.disabled = true; btn.textContent = "⏳ ডাটা আনা হচ্ছে…";
    cfg.load().then(function (all) {
      btn.disabled = false; btn.textContent = lb;
      var fo = cfg.filters, init = {}; if (cfg.modes && cfg.modes.some(function (m) { return m[0] === "best"; })) init.mode = cfg.modes[0][0]; // জানালার ডিফল্ট "সেরা" নয়, এই ট্যাবের প্রথম অপশন (সব খেলা)
      return D.open({
        id: key, title: cfg.title, filters: fo, cols: cfg.cols.map(function (c) { return { k: c.k, t: c.t, lock: !!c.lock }; }),
        lists: { dept: lst(uniq(all, "dept")), batch: lst(uniq(all, "batch")) }, modes: cfg.modes, sorts: cfg.sorts || [["def", "ডিফল্ট ক্রম"]], scope: { page: 0, sel: 0 }, init: init,
        ensure: function () { return Promise.resolve(); },
        count: function (f, cols) { var n = compute(cfg, f, all).rows.length; return { n: n, bytes: 7000 + n * (20 + 6 * cols.length) + (f.thumb ? n * 11000 : 0), note: all.length >= CAP ? "⚠️ ডাটা বেশি — প্রথম ২০,০০০টি ধরা হয়েছে; ফিল্টার সরু করুন।" : n > 5000 ? "বড় ফাইল — তৈরি হতে কিছুক্ষণ লাগবে।" : "" }; }
      }).then(function (res) {
        if (!res) return;
        btn.disabled = true; btn.textContent = "⏳ ফাইল সাজানো হচ্ছে…";
        return (res.thumb && key === "cards" ? fetchThumbs(compute(cfg, res.f, all).rows, function (a, n) { btn.textContent = "⏳ কার্ড ছবি " + bd(a) + " / " + bd(n); }) : Promise.resolve(null)).then(function (tm) { return make(key, res.f, res.cols, all, function (a, n) { btn.textContent = "⏳ লেখা হচ্ছে " + bd(a) + " / " + bd(n); }, tm); }).then(function (o) { X.save(o.bytes, o.name); if (all.length >= CAP) alert("প্রথম ২০,০০০টি সারি এক্সেলে এসেছে; আরও দেখতে ফিল্টার সরু করুন।"); });
      });
    }).catch(function (e) { if (M0 && M0.fail) M0.fail(e); else alert(String(e && e.message || e)); }).then(function () { btn.disabled = false; btn.textContent = lb; });
  }

  // ---------- বাটন বসানো ----------
  function cur() { var b = document.querySelector("#tabs button.on"); return b ? b.dataset.t : ""; }
  function mount() {
    var v = document.querySelector("#view"), k = cur(), h = v; if (!v) return;
    if (k === "prize" && v.querySelector("#mfroot")) { h = v.querySelector("#mfroot"); k = "folders"; } // 📁 ফোল্ডার = 🎁 জমা পড়া-র ভেতরের ফোল্ডার-ভিউ (admin-folders.js)
    if (!REG[k] || h.querySelector("#mcXb")) return;
    var w = document.createElement("div"); w.className = "act"; w.style.cssText = "margin:0 0 8px;justify-content:flex-end";
    w.innerHTML = '<button type="button" class="l s" id="mcXb" data-xk="' + k + '" title="ডিজাইন করা এক্সেল (.xlsx) — ব্যানার, সারসংক্ষেপ, রঙিন টেবিল; আগে ফিল্টার ও কলাম বাছাই করা যায়">⬇ এক্সেল (সাজানো)</button><button type="button" class="l s mcXf" data-xk="' + k + '" data-xf="jpg">🖼 JPG</button><button type="button" class="l s mcXf" data-xk="' + k + '" data-xf="png">🖼 PNG</button><button type="button" class="l s mcXf" data-xk="' + k + '" data-xf="pdf">📄 PDF</button>';
    h.insertBefore(w, h.firstChild);
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("#mcXb"); if (b && REG[b.dataset.xk]) { window.MCXPRE = null; run(b.dataset.xk, b); return; } b = e.target.closest && e.target.closest(".mcXf"); if (b && REG[b.dataset.xk]) { window.MCXPRE = b.dataset.xf; run(b.dataset.xk, b); } });
  function init() {
    var v = document.querySelector("#view"); if (!v || !window.MutationObserver) return;
    new MutationObserver(function () { mount(); }).observe(v, { childList: true, subtree: true }); // subtree: 📁 ফোল্ডার-ভিউ #view-এর গভীরে আঁকা হয়
    var t = document.querySelector("#tabs"); if (t) new MutationObserver(function () { setTimeout(mount, 0); }).observe(t, { attributes: true, subtree: true, attributeFilter: ["class"] });
    mount();
  }
  if (typeof document !== "undefined" && document.readyState !== "loading") init(); else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
  window.MCXTAB = { add: function (k, c) { REG[k] = c; }, reg: REG, make: make, compute: compute };

  // ---------- 🖼 কার্ড প্রিভিউ (থাম্বনেইল আনা ও ছোট করা; নতুন ডাটা জমে না) ----------
  // থাম্বনেইল mc2_cards.thumb থেকে; ব্রাউজারে ১৬০ পিক্সেল JPEG-এ ছোট হয় (ফাইল ছোট রাখতে)। না থাকলে কিছু বসে না।
  function thumbBytes(url) {
    return new Promise(function (resolve) {
      if (!url || String(url).indexOf("data:image") !== 0) return resolve(null);
      var im = new Image();
      im.onload = function () {
        try {
          var W = 160, H = Math.max(1, Math.round(W * im.height / (im.width || 1))), c = document.createElement("canvas");
          c.width = W; c.height = H; c.getContext("2d").drawImage(im, 0, 0, W, H);
          var b = atob(c.toDataURL("image/jpeg", 0.8).split(",")[1]), a = new Uint8Array(b.length);
          for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
          resolve({ d: a, w: W, h: H });
        } catch (e) { resolve(null); }
      };
      im.onerror = function () { resolve(null); };
      im.src = url;
    });
  }
  // সারির ID ধরে ৫০টা করে আনে, তারপর একটা একটা করে ছোট করে; প্রগ্রেস দেখায়
  function fetchThumbs(rows, prog) {
    var ids = rows.map(function (x) { return x.id; }).filter(function (v) { return v != null; }), out = {}, n = ids.length, done = 0, chunks = [];
    for (var i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
    return chunks.reduce(function (p, c) {
      return p.then(function () {
        return M().A("mc2_cards?select=id,thumb&id=in.(" + c.map(function (v) { return encodeURIComponent(v); }).join(",") + ")").then(function (L) {
          return (L || []).reduce(function (q, x) {
            return q.then(function () { return thumbBytes(x.thumb).then(function (b) { if (b) out[x.id] = b; done++; if (prog && (done % 10 === 0 || done === n)) prog(done, n); }); });
          }, Promise.resolve());
        });
      });
    }, Promise.resolve()).then(function () { if (prog) prog(n, n); return out; });
  }

  // ---------- ধাপ ৫-গ (নতুন ট্যাব): 💬 চ্যাট | 💬 বেনামি চ্যাট | 🛡 মডারেশন | 🗑 বিন ----------
  // ব্যক্তিগত তথ্য যোগ নেই: আইপি, ডিভাইস/ভয়েস আইডি, দেশ/শহর, ব্রাউজার, ফাইলের লিংক/পথ এখানে আনা হয় না।
  // নতুন SQL/স্টোরেজ নেই; শুধু আগে থেকে থাকা সারি পড়ে।
  var nameOf = function (L) { var m = {}; (L || []).forEach(function (x) { m[x.id] = x.name || ""; }); return m; };

  // 💬 চ্যাট (পুরোনো চ্যাট ট্যাব: mc2_chat_messages) — আইপি ও ব্রাউজার আনা হয় না
  window.MCXTAB.add("chat", {
    sheet: "চ্যাট", name: "Chat", sub: "চ্যাট বার্তা (পুরোনো চ্যাট)", tbl: "📋 চ্যাট বার্তা", src: "অ্যাডমিন › 💬 চ্যাট ট্যাব · ডাটাবেজ: mc2_chat_messages (রুম, নাম, বার্তা, লুকানো কি না, সময়); আইপি, ডিভাইস ও ব্রাউজার এখানে নেই",
    title: "⬇ এক্সেল ডাউনলোড — চ্যাট", filters: ["per", "q", "mode", "dept", "sort"],
    modes: [["all", "সব বার্তা"], ["vis", "👁 দেখানো"], ["hid", "🙈 লুকানো"]],
    sorts: [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "ts", t: "সময়", w: 23, a: "c" }, { k: "dept", t: "রুম", w: 22, a: "l" }, { k: "name", t: "নাম", w: 24, a: "l" }, { k: "body", t: "বার্তা", w: 60, a: "l" }, { k: "shown", t: "দেখানো", w: 12, a: "c", ty: "c" }],
    load: function () {
      return pageRest("mc2_chat_messages?select=id,room,nick,body,hidden,created_at&order=created_at.desc", 1000).then(function (L) {
        return L.map(function (m) { var h = !!m.hidden; return { id: m.id, ts: new Date(m.created_at).getTime() || 0, dept: m.room || "—", name: m.nick || "", body: m.body || "", shown: h ? "না" : "হ্যাঁ", vis: !h, hid: h, _s: [m.nick, m.room, m.body].join(" ") }; });
      });
    },
    mode: function (m, x) { return m === "all" || m === "vis" && x.vis || m === "hid" && x.hid; },
    cmp: { name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var n = {}, h = 0, r = {}; rows.forEach(function (x) { n[x.name] = 1; r[x.dept] = 1; if (x.hid) h++; }); return [["মোট বার্তা", rows.length], ["লুকানো বার্তা", h], ["আলাদা নাম", Object.keys(n).length], ["রুম", Object.keys(r).length]]; },
    pod: function (rows) { var c = {}; rows.forEach(function (x) { c[x.dept] = (c[x.dept] || 0) + 1; }); var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + t[i] + " (" + bd(c[t[i]]) + " বার্তা)" : i ? "" : "এই তালিকায় বার্তা নেই"; }); },
    podTitle: "💬 সবচেয়ে সক্রিয় রুম", podNeutral: 1
  });

  // 💬 বেনামি চ্যাট (mc2_ac_messages) — শুধু সময়, নাম/ডাকনাম, বার্তার ধরন; বার্তার লেখা, ছবি/ফাইলের লিংক, আইপি, ডিভাইস আইডি আনা হয় না
  window.MCXTAB.add("ac", {
    sheet: "বেনামি চ্যাট", name: "AnonChat", sub: "বেনামি চ্যাট (সময় ও ধরন)", tbl: "📋 বেনামি চ্যাট — বার্তার সময় ও ধরন", src: "অ্যাডমিন › 💬 বেনামি চ্যাট ট্যাব · ডাটাবেজ: mc2_ac_messages (সময়, নাম/ডাকনাম, বার্তার ধরন, লুকানো/মোছা কি না) + বিভাগ ও সেশনের নাম; বার্তার লেখা, ফাইলের লিংক ও ব্যক্তিগত তথ্য নেই",
    title: "⬇ এক্সেল ডাউনলোড — বেনামি চ্যাট", filters: ["per", "q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব বার্তা"], ["txt", "✏️ লেখা"], ["file", "📎 ছবি/ফাইল"], ["hid", "🙈 লুকানো"], ["del", "🗑 মোছা"]],
    sorts: [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "ts", t: "সময়", w: 23, a: "c" }, { k: "dept", t: "বিভাগ", w: 22, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "name", t: "নাম / ডাকনাম", w: 26, a: "l" }, { k: "kind", t: "বার্তার ধরন", w: 16, a: "c", ty: "c" }, { k: "hidden", t: "লুকানো", w: 12, a: "c", ty: "c" }, { k: "deleted", t: "মোছা", w: 12, a: "c", ty: "c" }],
    load: function () {
      return Promise.all([M().A("mc2_ac_depts?select=id,name"), M().A("mc2_ac_sessions?select=id,name"), pageRest("mc2_ac_messages?select=id,dept_id,session_id,nick,kind,hidden,deleted,created_at&order=created_at.desc", 1000)]).then(function (a) {
        var D = nameOf(a[0]), S = nameOf(a[1]);
        return (a[2] || []).map(function (m) { var file = m.kind && m.kind !== "text"; return { id: m.id, ts: new Date(m.created_at).getTime() || 0, dept: D[m.dept_id] || "—", batch: S[m.session_id] || "—", name: m.nick || "", kind: file ? "📎 ছবি/ফাইল" : "✏️ লেখা", file: file, hidden: m.hidden ? "হ্যাঁ" : "না", hid: !!m.hidden, deleted: m.deleted ? "হ্যাঁ" : "না", del: !!m.deleted, _s: [m.nick, D[m.dept_id], S[m.session_id]].join(" ") }; });
      });
    },
    mode: function (m, x) { return m === "all" || m === "txt" && !x.file || m === "file" && x.file || m === "hid" && x.hid || m === "del" && x.del; },
    cmp: { name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var n = {}, f = 0, h = 0, d = 0; rows.forEach(function (x) { n[x.name] = 1; if (x.file) f++; if (x.hid) h++; if (x.del) d++; }); return [["মোট বার্তা", rows.length], ["আলাদা নাম/ডাকনাম", Object.keys(n).length], ["ছবি/ফাইলসহ বার্তা", f], ["লুকানো / মোছা", h + " / " + d]]; },
    pod: function (rows) { var c = {}; rows.forEach(function (x) { c[x.dept] = (c[x.dept] || 0) + 1; }); var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + t[i] + " (" + bd(c[t[i]]) + " বার্তা)" : i ? "" : "এই তালিকায় বার্তা নেই"; }); },
    podTitle: "💬 সবচেয়ে সক্রিয় বিভাগ", podNeutral: 1
  });

  // 🛡 মডারেশন (mc2_ac_admin_mods) — শুধু অবস্থা; রিপোর্টের লেখা, দেশ/শহর, আইপি, ডিভাইস আনা হয় না
  window.MCXTAB.add("mod", {
    sheet: "মডারেশন", name: "Moderation", sub: "চ্যাট মডারেশন (ব্যবহারকারীর অবস্থা)", tbl: "📋 মডারেশন — ব্যবহারকারীর অবস্থা", src: "অ্যাডমিন › 🛡 মডারেশন ট্যাব · ডাটাবেজ: mc2_ac_admin_mods (অবস্থা, সময়সীমা, ভেরিফাই/রিভিউ, সতর্কতা, বৈধ রিপোর্ট সংখ্যা) + mc2_ac_admin_reports_count; রিপোর্টের লেখা ও ব্যক্তিগত তথ্য নেই",
    title: "⬇ এক্সেল ডাউনলোড — মডারেশন", filters: ["q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব ব্যবহারকারী"], ["ok", "✅ স্বাভাবিক"], ["res", "⏳ Restriction"], ["ban", "⛔ ব্যান"], ["rev", "🔎 রিভিউয়ে"], ["ver", "✔ ভেরিফাইড"]],
    sorts: [["def", "অবস্থা অনুযায়ী"], ["name", "নাম (অ-আ)"], ["rep", "বেশি বৈধ রিপোর্ট আগে"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "name", t: "নাম / ডাকনাম", w: 26, a: "l" }, { k: "dept", t: "বিভাগ", w: 22, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "state", t: "অবস্থা", w: 18, a: "c", ty: "c" }, { k: "until", t: "কত সময় পর্যন্ত", w: 22, a: "c" }, { k: "rep", t: "বৈধ রিপোর্ট", w: 14, a: "c", ty: "n" }, { k: "warns", t: "সতর্কতা", w: 12, a: "c", ty: "n" }, { k: "review", t: "রিভিউ", w: 12, a: "c", ty: "c" }, { k: "verified", t: "ভেরিফাইড", w: 12, a: "c", ty: "c" }],
    load: function () {
      return Promise.all([M().rpc("mc2_ac_admin_mods").catch(function () { return []; }), M().rpc("mc2_ac_admin_reports_count", { p_status: "open" }).catch(function () { return null; })]).then(function (a) {
        var L = Array.isArray(a[0]) ? a[0] : ((a[0] && a[0].rows) || []), lbl = { ok: "✅ স্বাভাবিক", restricted: "⏳ Restriction", banned: "⛔ ব্যান" };
        var rows = L.map(function (u) { var st = u.st || "ok"; return { name: u.nick || u.name || "", dept: u.dept || u.dept_name || "", batch: u.sess || u.batch || "", st: st, state: lbl[st] || st, until: u.until ? String(u.until).slice(0, 16).replace("T", " ") : (st === "banned" ? "স্থায়ী" : ""), rep: +u.valid_cnt || 0, warns: +u.warns || 0, review: u.review ? "হ্যাঁ" : "না", verified: u.verified ? "হ্যাঁ" : "না", rv: !!u.review, vf: !!u.verified, _s: [u.nick, u.name, u.dept, u.sess].join(" ") }; });
        rows.ctx = { open: typeof a[1] === "number" ? a[1] : null }; return rows;
      });
    },
    mode: function (m, x) { return m === "all" || m === "ok" && x.st === "ok" || m === "res" && x.st === "restricted" || m === "ban" && x.st === "banned" || m === "rev" && x.rv || m === "ver" && x.vf; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); }, rep: function (a, b) { return b.rep - a.rep; } },
    box: function (rows, ctx) { var c = { res: 0, ban: 0, rev: 0, ver: 0 }; rows.forEach(function (x) { if (x.st === "restricted") c.res++; if (x.st === "banned") c.ban++; if (x.rv) c.rev++; if (x.vf) c.ver++; }); return [["মোট ব্যবহারকারী (তালিকায়)", rows.length], ["Restriction / ব্যান", c.res + " / " + c.ban], ["রিভিউয়ে", c.rev], ["খোলা রিপোর্ট (সার্ভার)", (ctx || {}).open == null ? "—" : (ctx || {}).open]]; },
    pod: function (rows) { var c = rows.filter(function (x) { return x.st !== "ok"; }).length; return ["⚠️ স্বাভাবিক নয় এমন: " + bd(c) + " জন", "🔎 রিভিউয়ে: " + bd(rows.filter(function (x) { return x.rv; }).length) + " জন", "✔ ভেরিফাইড: " + bd(rows.filter(function (x) { return x.vf; }).length) + " জন"]; },
    podTitle: "🛡 এক নজরে", podNeutral: 1
  });

  // 🗑 বিন (mc2_bin_list, p_limit 2000) — মোছা আইটেমের তালিকা; ডিভাইস আইডি আনা হয় না; ফিল্টার-হিসাব হালকা রাখতে সর্বোচ্চ ২০০০
  var BIN_SRC = { mc2_cards: "🪪 কার্ড", mc2_scores: "📊 স্কোর", mc2_visits: "👥 ভিজিট", mc2_answers: "📝 উত্তর", contest_entries: "🎁 জমা" };
  window.MCXTAB.add("bin", {
    sheet: "বিন", name: "Bin", sub: "বিনে থাকা মোছা আইটেম", tbl: "📋 বিন — মোছা আইটেম", src: "অ্যাডমিন › 🗑 বিন ও ডিলিট ট্যাব · ডাটাবেজ: mc2_bin_list (ধরন, নাম, বিভাগ, সেশন, স্কোর, মোছার সময়, আকার); ডিভাইস আইডি ও ছবি নেই; সর্বোচ্চ ২০০০ সারি",
    title: "⬇ এক্সেল ডাউনলোড — বিন", filters: ["per", "q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব আইটেম"], ["card", "🪪 কার্ড"], ["score", "📊 স্কোর"], ["other", "অন্য"]],
    sorts: [["new", "সর্বশেষ মোছা আগে"], ["old", "পুরোনো মোছা আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "ts", t: "মোছার সময়", w: 23, a: "c" }, { k: "kind", t: "ধরন", w: 16, a: "c", ty: "c" }, { k: "name", t: "নাম", w: 28, a: "l" }, { k: "dept", t: "বিভাগ", w: 22, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "score", t: "স্কোর", w: 12, a: "c" }, { k: "mb", t: "আকার (MB)", w: 12, a: "c", ty: "n" }],
    load: function () {
      return M().rpc("mc2_bin_list", { p_limit: 2000, p_src: null }).then(function (r) {
        var L = (r && r.items) || [];
        return L.map(function (x) { var k = x.src || ""; return { id: x.id, ts: new Date(x.at).getTime() || 0, src: k, kind: BIN_SRC[k] || (k || "অন্য"), grp: k === "mc2_cards" ? "card" : k === "mc2_scores" ? "score" : "other", name: x.name || "", dept: x.dept || "", batch: x.batch || "", score: x.score == null ? "" : +x.score, mb: x.mb == null ? "" : +x.mb, _s: [x.name, x.dept, x.batch].join(" ") }; });
      });
    },
    mode: function (m, x) { return m === "all" || m === "card" && x.grp === "card" || m === "score" && x.grp === "score" || m === "other" && x.grp === "other"; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var mb = 0, c = {}; rows.forEach(function (x) { mb += +x.mb || 0; c[x.kind] = (c[x.kind] || 0) + 1; }); return [["বিনে মোট আইটেম", rows.length], ["মোট আকার (MB, আনুমানিক)", Math.round(mb * 10) / 10], ["🪪 কার্ড", c["🪪 কার্ড"] || 0], ["📊 স্কোর", c["📊 স্কোর"] || 0]]; },
    pod: function (rows) { var c = {}; rows.forEach(function (x) { c[x.kind] = (c[x.kind] || 0) + 1; }); var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + t[i] + " (" + bd(c[t[i]]) + " টি)" : i ? "" : "বিন খালি"; }); },
    podTitle: "🗑 বিনে কী বেশি", podNeutral: 1
  });

  // 📁 ফোল্ডার (mc2_ufolders + mc2_ufolder_members) — 🎁 জমা পড়া ট্যাবের ভেতরের ফোল্ডার-ভিউয়ে বোতাম (mount-এ "prize" → "folders")
  // শুধু সাধারণ (ম্যানুয়াল/বিজয়ী) ফোল্ডারের সদস্য; ✨ স্মার্ট ও ✨ অটো ফোল্ডার ব্রাউজারে গণনা হয়, তাই এখানে নেই। ডিভাইস আইডি আনা হয় না।
  window.MCXTAB.add("folders", {
    sheet: "ফোল্ডার", name: "Folders", sub: "ফোল্ডার ও সদস্য", tbl: "📋 ফোল্ডারের সদস্য (সাধারণ ফোল্ডার)", src: "অ্যাডমিন › 🎁 পুরস্কার ও নোট › 📁 ফোল্ডার · ডাটাবেজ: mc2_ufolders (নাম, ধরন) ও mc2_ufolder_members (নাম, বিভাগ, সেশন, স্কোর, যোগের সময়); স্মার্ট/অটো ফোল্ডার এখানে নেই",
    title: "⬇ এক্সেল ডাউনলোড — ফোল্ডার", filters: ["per", "q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব সদস্য"], ["man", "📁 সাধারণ ফোল্ডার"], ["win", "🏆 বিজয়ী ফোল্ডার"]],
    sorts: [["def", "ফোল্ডার ও ক্রম অনুযায়ী"], ["new", "নতুন যোগ আগে"], ["old", "পুরোনো যোগ আগে"], ["score", "বেশি স্কোর আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "folder", t: "ফোল্ডার", w: 34, a: "l" }, { k: "kind", t: "ধরন", w: 14, a: "c" }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "score", t: "স্কোর", w: 14, a: "c" }, { k: "ts", t: "যোগের সময়", w: 23, a: "c" }],
    load: function () {
      return Promise.all([pageRest("mc2_ufolders?select=id,name,kind,created_at&order=created_at.asc,id.asc", 1000), pageRest("mc2_ufolder_members?select=folder_id,name,dept,batch,score,added_at&order=added_at.desc,id.desc", 1000)]).then(function (a) {
        var F = {}; (a[0] || []).forEach(function (f) { F[String(f.id)] = f; });
        var rows = [], fs = {};
        (a[1] || []).forEach(function (m) {
          var f = F[String(m.folder_id)]; if (!f || f.kind === "smart") return;
          var win = f.kind === "winners"; fs[String(f.id)] = 1;
          rows.push({ folder: f.name || "", kind: win ? "🏆 বিজয়ী" : "📁 সাধারণ", man: !win, win: win, name: m.name || "", dept: m.dept || "", batch: m.batch || "", score: m.score == null ? "" : +m.score, ts: new Date(m.added_at).getTime() || 0, _s: [m.name, m.dept, m.batch, f.name].join(" ") });
        });
        rows.ctx = { folders: Object.keys(fs).length }; return rows;
      });
    },
    mode: function (m, x) { return m === "all" || m === "man" && x.man || m === "win" && x.win; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); }, score: function (a, b) { return (+b.score || 0) - (+a.score || 0); }, new: function (a, b) { return (b.ts || 0) - (a.ts || 0); }, old: function (a, b) { return (a.ts || 0) - (b.ts || 0); } },
    box: function (rows, ctx) { var u = {}; rows.forEach(function (x) { u[x.name + "|" + x.dept + "|" + x.batch] = 1; }); return [["মোট সদস্য-সারি", rows.length], ["আলাদা ব্যক্তি", Object.keys(u).length], ["সাধারণ/বিজয়ী ফোল্ডার", (ctx || {}).folders || 0], ["বিজয়ী ফোল্ডারের সদস্য", rows.filter(function (x) { return x.win; }).length]]; },
    pod: function (rows) { var c = {}; rows.forEach(function (x) { c[x.folder] = (c[x.folder] || 0) + 1; }); var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + t[i] + " (" + bd(c[t[i]]) + " জন)" : i ? "" : "কোনো সাধারণ ফোল্ডারের সদস্য নেই"; }); },
    podTitle: "📁 সবচেয়ে বড় ফোল্ডার", podNeutral: 1
  });
  // ---------- ধাপ ৫-খ (নতুন ট্যাব): 🪪 কার্ড | 🏅 বিজয়ী ঘোষণা | 🏆 বিজয়ী কার্ড সেটিংস | 🖼 কুইজ ছবি | 🖼️ ছবির গ্যালারি ----------
  // ছবি/থাম্ব এই ধাপে নেই (৫-ঘ-তে)। নতুন SQL/স্টোরেজ নেই: শুধু আগে থেকে থাকা সারি পড়ে।
  // 📁 ফোল্ডার/স্মার্ট ফোল্ডার: আলাদা ট্যাব-বোতাম নেই (🎁 জমা পড়া-র ভেতরের অংশ), তাই এখানে নেই — বাকি তালিকায়।
  var CV_LBL = { "": "অটো (দুটোই)", b: "দুটোই (বিজয়ী + স্কোর কার্ড)", w: "শুধু বিজয়ী কার্ড", s1: "শুধু স্কোর কার্ড — নেভি মেডালিয়ন", s2: "শুধু স্কোর কার্ড — সবুজ উইনার", s3: "শুধু স্কোর কার্ড — গ্লাস রিং", c: "কাস্টম (বাছা কার্ড)" };
  function cvLbl(cv) { if (!cv) return CV_LBL[""]; if (cv.charAt(0) === "e") return "✏️ সম্পাদিত বিজয়ী কার্ড"; return CV_LBL[cv] || cv; }
  function pdLbl(pd) { return pd === "" || pd == null || pd === undefined ? "অটো (ডিফল্ট ডিজাইন)" : "ডিজাইন " + bd(+pd + 1); }
  var KIND_LBL = { week: "সাপ্তাহিক", month: "মাসিক" };
  function dayMs(s) { var t = new Date(String(s || "") + "T00:00:00").getTime(); return isNaN(t) ? 0 : t; }
  function drawRows() { // বিজয়ী-ফোল্ডার (ম্যানুয়াল বিজয়ী-কার্ডের লুকানো ঘোষণা বাদ)
    return M().rpc("mc2_draw_admin_list").then(function (r) { return ((r && r.rows) || []).filter(function (q) { return q.source !== "wcard-manual"; }); });
  }

  // 🪪 কার্ড (mc2_cards — ছবি/থাম্ব কলাম আনা হয় না)
  window.MCXTAB.add("cards", {
    sheet: "কার্ড", thumbs: true, name: "Cards", sub: "স্কোর কার্ড (ইউজার)", tbl: "📋 সেভ-করা কার্ড (ছবি ছাড়া)", src: "অ্যাডমিন › 🪪 কার্ড ট্যাব · ডাটাবেজ: mc2_cards (ছবি ও থাম্ব এই ফাইলে নেই; ছবি দেখানো কি না শুধু হ্যাঁ/না)",
    title: "⬇ এক্সেল ডাউনলোড — কার্ড", filters: ["q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব কার্ড"], ["shown", "👁 ছবি দেখানো আছে"], ["hidden", "🙈 ছবি লুকানো"]],
    sorts: [["new", "সর্বশেষ আপডেট আগে"], ["old", "পুরোনো আগে"], ["score", "বেশি স্কোর আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "score", t: "স্কোর", w: 14, a: "c" }, { k: "pct", t: "শতাংশ", w: 12, a: "c", ty: "n" }, { k: "shown", t: "ছবি দেখানো", w: 14, a: "c", ty: "c" }, { k: "ts", t: "শেষ আপডেট", w: 23, a: "c" }, { k: "thumb", t: "কার্ড প্রিভিউ", w: 14, a: "c" }],
    load: function () {
      return pageRest("mc2_cards?select=id,device,name,dept,batch,score,pct,show,updated_at&order=updated_at.desc,id.desc", 1000).then(function (L) {
        return L.map(function (c) { var s = +c.score || 0, sh = c.show !== false; return { id: c.id, dev: c.device || "", ts: new Date(c.updated_at).getTime() || 0, name: c.name || "", dept: c.dept || "", batch: c.batch || "", score: s, pct: c.pct == null ? s / 10 : +c.pct, shown: sh ? "হ্যাঁ" : "না", sh: sh, _s: [c.name, c.dept, c.batch].join(" ") }; });
      });
    },
    mode: function (m, x) { return m === "all" || m === "shown" && x.sh || m === "hidden" && !x.sh; },
    cmp: { score: function (a, b) { return (+b.score || 0) - (+a.score || 0); }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); }, old: function (a, b) { return (a.ts || 0) - (b.ts || 0); }, new: function (a, b) { return (b.ts || 0) - (a.ts || 0); } },
    box: function (rows) { var d = {}, sh = 0, s = 0; rows.forEach(function (x) { d[x.dev] = 1; if (x.sh) sh++; s += x.score; }); return [["মোট কার্ড", rows.length], ["আলাদা ডিভাইস", Object.keys(d).length], ["ছবি দেখানো আছে", sh], ["গড় স্কোর", rows.length ? Math.round(s / rows.length) : 0]]; },
    pod: function (rows) { var t = rows.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3); return [0, 1, 2].map(function (i) { return t[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + t[i].name + " (" + (t[i].dept || "—") + ") — স্কোর ➜ " + bd(t[i].score) : i ? "" : "এই তালিকায় কার্ড নেই"; }); },
    podTitle: "🏆 সর্বোচ্চ স্কোরের তিনটি কার্ড", podNeutral: 1
  });

  // 🏅 বিজয়ী ঘোষণা (mc2_draw_admin_list — ফোল্ডার অনুযায়ী প্রতিটি বিজয়ী)
  window.MCXTAB.add("win", {
    sheet: "বিজয়ী ঘোষণা", name: "Winners", sub: "বিজয়ী ঘোষণা (ফোল্ডার অনুযায়ী)", tbl: "📋 বিজয়ী ঘোষণা — সব ফোল্ডারের বিজয়ী", src: "অ্যাডমিন › 🏅 বিজয়ী ঘোষণা ট্যাব · ডাটাবেজ: mc2_draw_admin_list (ফোল্ডার, তারিখ, বিজয়ীর নাম/বিভাগ/সেশন, দেখানো/হোমে কি না)",
    title: "⬇ এক্সেল ডাউনলোড — বিজয়ী ঘোষণা", filters: ["per", "q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব ফোল্ডার"], ["show", "👁 পাবলিকে দেখানো"], ["hide", "🙈 লুকানো"], ["home", "🏠 হোমে দেখানো"]],
    sorts: [["def", "ফোল্ডার ও ক্রম অনুযায়ী"], ["new", "নতুন তারিখ আগে"], ["old", "পুরোনো তারিখ আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "folder", t: "ফোল্ডার (ঘোষণা)", w: 34, a: "l" }, { k: "kind", t: "ধরন", w: 12, a: "c" }, { k: "date", t: "তারিখ", w: 14, a: "c" }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "score", t: "স্কোর", w: 12, a: "c" }, { k: "shown", t: "পাবলিকে", w: 12, a: "c", ty: "c" }, { k: "home", t: "হোমে", w: 12, a: "c", ty: "c" }],
    load: function () {
      return drawRows().then(function (ds) {
        var rows = [], f = 0, sh = 0, hm = 0;
        ds.forEach(function (d) {
          var on = !!d.show, hn = !!d.home; f++; if (on) sh++; if (hn) hm++;
          (d.winners || []).forEach(function (w) {
            rows.push({ folder: d.title || "", kind: KIND_LBL[d.kind] || "কাস্টম", date: d.draw_date || "", ts: dayMs(d.draw_date), name: w.name || "", dept: w.dept || "", batch: w.batch || "", score: w.score == null ? "" : +w.score, shown: on ? "হ্যাঁ" : "না", home: hn ? "হ্যাঁ" : "না", sh: on, hm: hn, _s: [w.name, w.dept, w.batch, d.title].join(" ") });
          });
        });
        rows.ctx = { folders: f, shown: sh, home: hm }; return rows;
      });
    },
    mode: function (m, x) { return m === "all" || m === "show" && x.sh || m === "hide" && !x.sh || m === "home" && x.hm; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); }, new: function (a, b) { return (b.ts || 0) - (a.ts || 0); }, old: function (a, b) { return (a.ts || 0) - (b.ts || 0); } },
    box: function (rows, ctx) { var u = {}; rows.forEach(function (x) { u[x.name + "|" + x.dept + "|" + x.batch] = 1; }); return [["মোট বিজয়ী (ঘোষণায়)", rows.length], ["আলাদা ব্যক্তি", Object.keys(u).length], ["ঘোষণা-ফোল্ডার", (ctx || {}).folders || 0], ["পাবলিকে দেখানো ফোল্ডার", (ctx || {}).shown || 0]]; },
    pod: function (rows, ctx) { return ["👁 পাবলিকে দেখানো ফোল্ডার: " + bd((ctx || {}).shown || 0) + "টি", "🏠 হোমে দেখানো: " + bd((ctx || {}).home || 0) + "টি", "🙈 লুকানো ফোল্ডার: " + bd(((ctx || {}).folders || 0) - ((ctx || {}).shown || 0)) + "টি"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  });

  // 🏆 বিজয়ী কার্ড সেটিংস (একই ঘোষণা-ডাটা; প্রতি বিজয়ীর কার্ড-মোড ও ডিজাইন — ছবি নয়)
  window.MCXTAB.add("wcs", {
    sheet: "বিজয়ী কার্ড সেটিং", name: "WinnerCards", sub: "বিজয়ী কার্ড সেটিংস (প্রতি বিজয়ী)", tbl: "📋 প্রতি বিজয়ীর কার্ড-মোড ও ডিজাইন", src: "অ্যাডমিন › 🏆 বিজয়ী কার্ড সেটিংস ট্যাব · ডাটাবেজ: mc2_draw_admin_list → winners[].cv (মোড) ও winners[].pd (ডিজাইন ০–১৯); কার্ডের ছবি সার্ভারে নেই",
    title: "⬇ এক্সেল ডাউনলোড — বিজয়ী কার্ড সেটিংস", filters: ["q", "mode", "dept", "batch", "sort"],
    modes: [["all", "সব বিজয়ী"], ["auto", "অটো (ডিফল্ট)"], ["both", "দুটোই"], ["win", "শুধু বিজয়ী কার্ড"], ["score", "শুধু স্কোর কার্ড"], ["cust", "কাস্টম বাছা"], ["edit", "✏️ সম্পাদিত"]],
    sorts: [["def", "ফোল্ডার ও ক্রম অনুযায়ী"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "folder", t: "ফোল্ডার (ঘোষণা)", w: 34, a: "l" }, { k: "name", t: "নাম", w: 30, a: "l" }, { k: "dept", t: "বিভাগ", w: 24, a: "l" }, { k: "batch", t: "সেশন", w: 14, a: "c" }, { k: "mode", t: "কার্ড-মোড", w: 36, a: "l" }, { k: "design", t: "বিজয়ী কার্ডের ডিজাইন", w: 22, a: "l" }, { k: "cards", t: "কাস্টম কার্ড সংখ্যা", w: 14, a: "c", ty: "n" }],
    load: function () {
      return drawRows().then(function (ds) {
        var rows = [];
        ds.forEach(function (d) { (d.winners || []).forEach(function (w) { var cv = w.cv || "", cs = w.cs && w.cs.l ? w.cs.l.length : 0; rows.push({ folder: d.title || "", name: w.name || "", dept: w.dept || "", batch: w.batch || "", cv: cv, mode: cvLbl(cv), design: pdLbl(w.pd), cards: cs, _s: [w.name, w.dept, w.batch, d.title].join(" ") }); }); });
        return rows;
      });
    },
    mode: function (m, x) { return m === "all" || m === "auto" && !x.cv || m === "both" && x.cv === "b" || m === "win" && x.cv === "w" || m === "score" && /^s\d$/.test(x.cv) || m === "cust" && x.cv === "c" || m === "edit" && x.cv.charAt(0) === "e"; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var c = 0, e = 0, dz = 0, sc = 0; rows.forEach(function (x) { if (x.cv === "c") c++; if (x.cv.charAt(0) === "e") e++; if (/^s\d$/.test(x.cv)) sc++; if (x.design.indexOf("অটো") < 0) dz++; }); return [["মোট বিজয়ী", rows.length], ["কাস্টম বাছা", c], ["সম্পাদিত কার্ড", e], ["ডিজাইন নিজে বাছা", dz]]; },
    pod: function (rows) { var sc = rows.filter(function (x) { return /^s\d$/.test(x.cv); }).length; return ["⚠️ \"শুধু স্কোর কার্ড\" মোড: " + bd(sc) + " জন (পাবলিকে বিজয়ী কার্ড দেখাবে না)", "🎴 কাস্টম বাছা: " + bd(rows.filter(function (x) { return x.cv === "c"; }).length) + " জন", "✏️ সম্পাদিত: " + bd(rows.filter(function (x) { return x.cv.charAt(0) === "e"; }).length) + " জন"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  });

  // 🖼 কুইজ ছবি (mc2_settings → qimg_cfg; সেটিং-মান তালিকা, র‍্যাংক নেই)
  window.MCXTAB.add("qimg", {
    sheet: "কুইজ ছবি", name: "QuizImage", sub: "কুইজের ছবির সেটিং", tbl: "📋 কুইজের ছবির সেটিং (qimg_cfg)", src: "অ্যাডমিন › 🖼 কুইজ ছবি ট্যাব · ডাটাবেজ: mc2_settings (key = qimg_cfg); সেভ না হলে ডিফল্ট সেটিং চলে",
    title: "⬇ এক্সেল ডাউনলোড — কুইজ ছবি", filters: ["q"],
    modes: [["all", "সব সেটিং"]], sorts: [["def", "ডিফল্ট ক্রম"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "key", t: "সেটিং (কী)", w: 30, a: "l" }, { k: "val", t: "মান", w: 70, a: "l" }],
    load: function () {
      return M().A("mc2_settings?select=value&key=eq.qimg_cfg").then(function (L) {
        var v = (L && L[0] && L[0].value) || {};
        return Object.keys(v).map(function (k) { var x = v[k]; return { key: k, val: x !== null && typeof x === "object" ? JSON.stringify(x) : String(x), saved: true, _s: k + " " + JSON.stringify(x) }; });
      });
    },
    cmp: { def: function () { return 0; } },
    box: function (rows) { return [["সেটিং-কী সংখ্যা", rows.length], ["সেভ করা আছে", rows.length ? "হ্যাঁ" : "না (ডিফল্ট চলছে)"]]; },
    pod: function (rows) { return [rows.length ? "কুইজ ছবির সেটিং সার্ভারে সেভ করা আছে।" : "কোনো সেটিং সেভ নেই; পুরোনো (ডিফল্ট) নিয়মেই কুইজ চলছে।"]; },
    podTitle: "📌 এক নজরে", podNeutral: 1
  });

  // 🖼️ ছবির গ্যালারি (mc2_places — ছবির পথ/থাম্ব আনা হয় না, শুধু নাম, ক্যাটাগরি, চালু কি না)
  window.MCXTAB.add("gal", {
    sheet: "ছবির গ্যালারি", name: "Gallery", sub: "ছবির গ্যালারি (কুইজের ছবি)", tbl: "📋 কুইজের ছবি — নাম ও ক্যাটাগরি", src: "অ্যাডমিন › 🖼️ ছবির গ্যালারি ট্যাব · ডাটাবেজ: mc2_places (নাম, ইংরেজি নাম, ক্যাটাগরি, চালু কি না; ছবির পথ ও থাম্ব এই ফাইলে নেই)",
    title: "⬇ এক্সেল ডাউনলোড — ছবির গ্যালারি", filters: ["q", "mode", "dept", "sort"],
    modes: [["all", "সব ছবি"], ["on", "✅ চালু"], ["off", "⛔ বন্ধ"]],
    sorts: [["def", "নতুন আগে"], ["name", "নাম (অ-আ)"]],
    cols: [{ k: "sl", t: "ক্রমিক", lock: 1 }, { k: "name", t: "স্থানের নাম (বাংলা)", w: 34, a: "l" }, { k: "en", t: "ইংরেজি নাম", w: 30, a: "l" }, { k: "dept", t: "ক্যাটাগরি", w: 22, a: "l" }, { k: "active", t: "চালু", w: 12, a: "c", ty: "c" }],
    load: function () {
      return pageRest("mc2_places?select=id,bn,en,category,active&order=id.desc", 1000).then(function (L) {
        return L.map(function (p) { return { id: p.id, name: p.bn || "", en: p.en || "", dept: p.category || "—", active: p.active ? "✅ চালু" : "⛔ বন্ধ", on: !!p.active, _s: [p.bn, p.en, p.category].join(" ") }; });
      });
    },
    mode: function (m, x) { return m === "all" || m === "on" && x.on || m === "off" && !x.on; },
    cmp: { def: function () { return 0; }, name: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } },
    box: function (rows) { var on = rows.filter(function (x) { return x.on; }).length, cats = {}; rows.forEach(function (x) { cats[x.dept] = 1; }); return [["মোট ছবি", rows.length], ["চালু", on], ["বন্ধ", rows.length - on], ["ক্যাটাগরি", Object.keys(cats).length]]; }
  });
})();

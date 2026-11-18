// অ্যাডমিন: "🎁 পুরস্কার" ট্যাব (নতুন) — জমা পড়া এন্ট্রির ফিল্টার/সাজানো, "🎰 লটারি" (চাকা + শব্দ), বিজয়ীর কার্ড/ইনফো,
// একবার জিতলে পরের লটারিতে বাদ (ফিল্টার থেকে সরালে আবার যোগ্য) এবং প্রত্যেক বিজয়ীর জন্য ফেসবুক-পোস্টের মতো পোস্টার (ডাউনলোড + ক্যাপশন কপি)।
// admin-cards.js-এর পরে, admin.js-এর আগে লোড হয় (admin.html)। নতুন SQL লাগে না: contest_entries, mc2_scores, mc2_cards আগে থেকেই আছে।
// ফাইলটা না থাকলে admin.js-এর পুরোনো পুরস্কার ট্যাবই চলে। বিজয়ীদের তালিকা এই ব্রাউজারে থাকে (চাবি: mc2_prize_won)।
// উপরে দুটো অংশের বোতাম: "🎁 জমা পড়া" (আগের সবকিছু, অপরিবর্তিত) ও "📁 ফোল্ডার" (admin-folders.js; ফাইলটা না থাকলে বোতামটা আসে না)।
// পোস্টার (২০২৬-১০-২১): ২০টা ডিজাইন (PZ_TH), ড্রপডাউনে তৈরি লেখা + কাস্টম (PZ_TX; নিজের লেখা এই ব্রাউজারে mc2_pz_txt), QR অন/অফ, ডাউনলোড JPG ১০৮০ (৯২%) + PNG ১০৮০ (প্রায় ১ এমবি), তৈরি কার্ড সর্বোচ্চ ৫টা ও ১ ঘণ্টা পরে মোছে, পরের কার্ড ব্যাকগ্রাউন্ডে আগে থেকে আঁকা। নতুন SQL লাগে না। শেষ বাছাই: mc2_pz_cfg। লম্বা বার্তা/নিচের লাইন (URL) এখন অটো ছোট বা ২ লাইনে বসে (pzLines); QR থাকলেও লেখা ফ্রেমে লাগে না।
// ফোল্ডার অংশে "🎰 লটারি" বোতামও আছে (admin-lottery.js-এর নতুন লটারি স্ক্রিন খোলে)।
// ইউজারের অবস্থা ৪টা (✅ ভেরিফাইড | ❔ নন-ভেরিফাইড | 🚫 বাদ | 📵 সাড়া পাওয়া যায়নি): window.MCFL (admin-folders.js) — জমা পড়া তালিকা ও বিজয়ী প্যানেলে একই বাছার তালিকা; ফাইলটা না থাকলে আগের ৩-অবস্থার বোতামই চলে। 🚫 ও 📵 দুটোই লটারি থেকে বাদ। 📵-এর SQL: supabase-new-20261018k.sql।
(function () {
  var M = null, ALL = [], BOARD = [], FL = {}, WON = [], LIM = 30, SHOW = LIM, DD = {}, MODE = "list", FX = window.MCFL || null;
  if (FX) { FX.reg(function () { return FL; }); FX.on(function () { if (M && MODE === "list" && document.querySelector(".pdw")) paint(); }); }   // সেভের পর এই তালিকা নতুন করে আঁকে
  var F = { dept: "", batch: "", days: 0, sort: "new", min: "", max: "", rk: "", q: "", st: "", showWon: false };
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { prize: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var E = function (t) { return window.MCA ? window.MCA.esc(t) : String(t == null ? "" : t); };
  var SU = function (u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; }; // শুধু http/https লিংক; javascript: ইত্যাদি বাদ
  var D = function () { return window.MC || {}; };
  var deptL = function (d) { return D().deptLabel ? D().deptLabel(d || "") : (d || ""); };
  var JPG = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
  var siteUrl = function () { var C = window.MC_CFG || {}; return C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : /^https?:/.test(location.origin) ? location.origin + "/" : "";
  };

  // ---------- স্টাইল ----------
  var st = document.createElement("style");
  st.textContent = ".pdw{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:10px;align-items:start}@media(max-width:760px){.pdw{grid-template-columns:1fr}}" +
    ".pd{position:relative}.pdb{width:100%;text-align:left;background:var(--bg);color:var(--fg);border:1px solid var(--bd);font-weight:600;display:flex;justify-content:space-between;gap:6px}" +
    ".pdl{position:absolute;z-index:60;left:0;right:0;top:100%;margin-top:3px;background:var(--card);border:1px solid var(--bd);border-radius:10px;max-height:240px;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.25);min-width:150px}" +
    ".pdl button{display:block;width:100%;text-align:left;background:none;color:var(--fg);border-radius:0;font-weight:500;padding:8px 10px}.pdl button:hover,.pdl button.on{background:var(--g);color:#fff}" +
    ".pdn{background:none;color:var(--g);padding:0;border:0;font-weight:800;text-decoration:underline;text-underline-offset:2px;text-align:left}.pdr{background:var(--o);color:#fff;border-radius:999px;padding:1px 9px;font-size:12px;font-weight:700;border:0}" +
    ".pzm{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.74);display:grid;place-items:center;padding:10px;overflow:auto}.pzb{background:var(--card);color:var(--fg);border-radius:14px;padding:14px;width:min(96vw,560px);max-height:96vh;overflow:auto;display:grid;gap:9px}" +
    ".pzb img{max-width:100%;max-height:60vh;border-radius:10px;border:1px solid var(--bd);justify-self:center;background:#fff}.pzb canvas{max-width:100%;justify-self:center}" +
    "a.pzd{display:block;text-align:center;font-weight:700;border-radius:10px;padding:10px 12px;background:var(--g);color:#fff;text-decoration:none}a.pzd.off{opacity:.45;pointer-events:none}" +
    ".pzw{display:grid;gap:6px}.pzw .it{padding:7px 0}.pzbig{font-size:22px;font-weight:800;text-align:center;line-height:1.3}.pzx{display:flex;gap:6px;flex-wrap:wrap}.pzx>*{flex:1 1 auto}";
  document.head.appendChild(st);

  // ---------- নিজস্ব ড্রপডাউন মেনু (ব্রাউজারের সাধারণ select নয়) ----------
  function dd(id, opts, val, fn) {
    DD[id] = fn; var cur = opts.filter(function (o) { return String(o[0]) === String(val); })[0] || opts[0];
    return '<div class="pd" data-pd="' + id + '"><button type="button" class="pdb" data-pdt="1"><span>' + E(cur[1]) + '</span><span>▾</span></button><div class="pdl" hidden>' +
      opts.map(function (o) { return '<button type="button" data-pdv="' + E(o[0]) + '" class="' + (String(o[0]) === String(val) ? "on" : "") + '">' + E(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-pdt]"), v = e.target.closest && e.target.closest("[data-pdv]");
    Array.prototype.forEach.call(document.querySelectorAll(".pdl"), function (l) { if (!t || l.parentNode !== t.parentNode) l.hidden = true; });
    if (t) { var l = t.parentNode.querySelector(".pdl"); l.hidden = !l.hidden; return; }
    if (v) { var box = v.closest("[data-pd]"), f = DD[box.dataset.pd]; box.querySelector(".pdl").hidden = true; if (f) f(v.dataset.pdv); }
  });

  // ---------- তথ্য লোড ----------
  function pageAll(path, max) {
    var out = [];
    return (function loop(off) {
      return M.A(path + (path.indexOf("?") < 0 ? "?" : "&") + "limit=1000&offset=" + off).then(function (L) {
        out = out.concat(L || []); return L && L.length === 1000 && out.length < max ? loop(off + 1000) : out;
      });
    })(0);
  }
  var pkey = function (dev, name) { return dev ? "d:" + dev : "n:" + String(name || "").trim().toLowerCase(); };
  function load() {
    return Promise.all([pageAll("contest_entries?select=*&order=created_at.desc", 5000), pageAll("mc2_scores?select=device,name,dept,batch,score,pct,created_at&order=score.desc,created_at.asc", 20000).catch(function () { return []; }), M.rpc("mc2_flag_all").catch(function () { return {}; })]).then(function (r) {
      FL = r[2] || {};
      var best = {}, byName = {}, list = [];
      r[1].forEach(function (s) { var k = pkey(s.device, s.name); if (!best[k] || s.score > best[k].score) best[k] = s; var n = pkey("", s.name); if (!byName[n] || s.score > byName[n].score) byName[n] = s; });
      var ranked = Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.score - a.score; }), rk = {}, prev = null, pr = 0;
      ranked.forEach(function (s, i) { if (prev === null || s.score !== prev) { pr = i + 1; prev = s.score; } rk[pkey(s.device, s.name)] = pr; });
      BOARD = ranked.map(function (s) { var k = pkey(s.device, s.name); return { id: null, key: k, name: s.name, device: s.device || "", dept: s.dept || "", batch: s.batch || "", score: s.score, rank: rk[k] || null, at: s.created_at, e: null }; });
      r[0].forEach(function (e) {
        var k = pkey(e.device, e.name), b = best[k] || byName[pkey("", e.name)] || null, bk = b ? pkey(b.device, b.name) : "";
        var sc = b ? b.score : (e.score != null ? e.score : (e.pct != null ? e.pct * 10 : null));
        list.push({ id: e.id, key: e.device ? "d:" + e.device : (b && b.device ? "d:" + b.device : pkey("", e.name)), name: e.name, device: e.device || (b && b.device) || "", dept: b ? b.dept : "", batch: b ? (b.batch || "") : "",
          score: sc, rank: bk && rk[bk] ? rk[bk] : null, at: e.created_at, e: e });
      });
      ALL = list;
    });
  }
  function wonKeys() { var o = {}; WON.forEach(function (w) { o[w.key] = 1; }); return o; }

  // স্ক্রিনশটের যাচাই-অবস্থা (SQL-এর mc2_shot_status-এর সাথে এক নিয়ম): ok=Verified | no=Unverified | ফ্ল্যাগ নেই=Pending | ex/nr/অন্য=Unknown
  var SHOT_ST = [["verified", "✅ Verified"], ["unverified", "❔ Unverified"], ["unknown", "❓ Unknown"], ["pending", "⏳ Pending"]];
  function shotSt(k) { var f = FL[k] || ""; return f === "ok" ? "verified" : f === "no" ? "unverified" : f === "" ? "pending" : "unknown"; }
  // ---------- ফিল্টার ----------
  function filtered() {
    var won = wonKeys(), q = F.q.trim().toLowerCase(), now = Date.now(), mn = F.min === "" ? null : +F.min, mx = F.max === "" ? null : +F.max, rk = F.rk === "" ? null : +F.rk;
    var L = ALL.filter(function (p) {
      if (!F.showWon && won[p.key]) return false;
      if (F.dept && p.dept !== F.dept) return false;
      if (F.batch && p.batch !== F.batch) return false;
      if (F.days && now - new Date(p.at).getTime() > F.days * 864e5) return false;
      if (mn != null && (p.score == null || p.score < mn)) return false;
      if (mx != null && (p.score == null || p.score > mx)) return false;
      if (rk != null && (p.rank == null || p.rank > rk)) return false;
      if (F.st && shotSt(p.key) !== F.st) return false;
      if (q && (p.name + " " + (p.e.contact || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var by = { new: function (a, b) { return new Date(b.at) - new Date(a.at); }, old: function (a, b) { return new Date(a.at) - new Date(b.at); },
      sd: function (a, b) { return (b.score == null ? -1 : b.score) - (a.score == null ? -1 : a.score); }, sa: function (a, b) { return (a.score == null ? 1e9 : a.score) - (b.score == null ? 1e9 : b.score); },
      rk: function (a, b) { return (a.rank == null ? 1e9 : a.rank) - (b.rank == null ? 1e9 : b.rank); }, nm: function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); } };
    return L.sort(by[F.sort] || by.new);
  }
  var uniq = function (k) { var o = {}; ALL.forEach(function (p) { if (p[k]) o[p[k]] = 1; }); return Object.keys(o).sort(function (a, b) { return a.localeCompare(b, "bn"); }); };

  // ---------- মূল দৃশ্য ----------
  function view() {
    M = window.MCA; WON = LS.get("mc2_prize_won", []); SHOW = LIM;
    if (MODE === "fold" && window.MCF) return foldView();
    return load().then(paint);
  }
  // ---------- দুই অংশ: 🎁 জমা পড়া | 📁 ফোল্ডার ----------
  function modeBar() {
    if (!window.MCF) return "";
    return '<div class="act" style="margin-bottom:10px"><button type="button" class="' + (MODE === "list" ? "" : "l") + '" data-p="mode" data-m="list">🎁 জমা পড়া</button><button type="button" class="' + (MODE === "fold" ? "" : "l") + '" data-p="mode" data-m="fold">📁 ফোল্ডার</button>' + (MODE === "fold" && window.MCLOT ? '<button type="button" data-p="flot">🎰 লটারি</button>' : "") + "</div>";
  }
  function setMode(m) { if (m === MODE || (m === "fold" && !window.MCF)) return; MODE = m; view().catch(M.fail); }
  function foldView() {
    var V = M.$("#view"); V.innerHTML = modeBar() + '<div id="mfroot"></div>';
    V.onclick = function (e) { var b = e.target.closest("[data-p=mode]"); if (b) return setMode(b.dataset.m); if (e.target.closest("[data-p=flot]") && window.MCLOT) window.MCLOT(); };
    return window.MCF.open(M.$("#mfroot"));
  }
  var rankTag = function (p) { return p.rank ? '<span class="pdr">র‍্যাংক #' + bd(p.rank) + "</span>" : ""; };
  function paint() {
    var V = M.$("#view"), L = filtered(), won = wonKeys(), n = 0; ALL.forEach(function (p) { if (won[p.key]) n++; });
    var sorts = [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["sd", "মার্ক: বেশি → কম"], ["sa", "মার্ক: কম → বেশি"], ["rk", "র‍্যাংক: ১ থেকে"], ["nm", "নাম (অ-আ)"]];
    var depts = [["", "সব বিভাগ"]].concat(uniq("dept").map(function (x) { return [x, deptL(x)]; })), bats = [["", "সব সেশন"]].concat(uniq("batch").map(function (x) { return [x, x]; }));
    var days = [[0, "সব সময়"], [1, "১ দিন"], [3, "৩ দিন"], [7, "৭ দিন"], [14, "১৪ দিন"], [30, "৩০ দিন"]];
    var SC = {}; ALL.forEach(function (p) { var t = shotSt(p.key); SC[t] = (SC[t] || 0) + 1; });
    var stOpts = [["", "সব অবস্থা (" + bd(ALL.length) + ")"]].concat(SHOT_ST.map(function (o) { return [o[0], o[1] + " (" + bd(SC[o[0]] || 0) + ")"]; }));
    var h = modeBar() + '<h2>🎁 জমা পড়া (' + bd(L.length) + " / " + bd(ALL.length) + ')</h2><div class="pdw"><div>' +
      '<div class="row"><div><span class="sm">বিভাগ</span>' + dd("dept", depts, F.dept, function (v) { F.dept = v; SHOW = LIM; paint(); }) + "</div><div><span class=\"sm\">সেশন</span>" + dd("batch", bats, F.batch, function (v) { F.batch = v; SHOW = LIM; paint(); }) + "</div>" +
      "<div><span class=\"sm\">কত দিনের</span>" + dd("days", days, F.days, function (v) { F.days = +v; SHOW = LIM; paint(); }) + "</div><div><span class=\"sm\">সাজানো</span>" + dd("sort", sorts, F.sort, function (v) { F.sort = v; paint(); }) + "</div></div>" +
      '<div class="row" style="margin-top:8px"><label>মার্ক (সংখ্যা) থেকে<input id="pmn" type="number" min="0" max="1000" value="' + E(F.min) + '"></label><label>মার্ক পর্যন্ত<input id="pmx" type="number" min="0" max="1000" value="' + E(F.max) + '"></label>' +
      '<label>র‍্যাংক (সেরা কতজন)<input id="prk" type="number" min="1" value="' + E(F.rk) + '" placeholder="যেমন ১০"></label><label>নাম/ফোন খুঁজুন<input id="pq" value="' + E(F.q) + '"></label></div>' +
      '<div class="row" style="margin-top:8px"><div><span class="sm">স্ক্রিনশট / যাচাই অবস্থা</span>' + dd("st", stOpts, F.st, function (v) { F.st = v; SHOW = LIM; paint(); }) + '</div></div>' +
      '<div class="act" style="margin:8px 0"><button type="button" data-p="apply">🔎 প্রয়োগ</button><button type="button" class="l" data-p="reset">↺ ফিল্টার মুছুন</button><button type="button" class="l" data-p="sw">' + (F.showWon ? "☑" : "☐") + " বিজয়ীদেরও দেখান</button>" +
      '<button type="button" data-p="lot" style="background:var(--o)">🎰 লটারি</button></div>' +
      '<p class="sm">যোগ্য (বিজয়ী বাদে, এক ব্যক্তি একবার): <b>' + bd(eligible(L).length) + "</b> জন।</p>" +
      L.slice((SHOW = Math.min(SHOW, Math.max(1, Math.ceil(L.length / LIM)) * LIM)) - LIM, SHOW).map(function (p) { return entry(p, won[p.key]); }).join("") + (L.length ? "" : '<p class="sm">এই ফিল্টারে কোনো এন্ট্রি নেই।</p>') +
      (window.MCPG ? window.MCPG.html(SHOW / LIM - 1, L.length, LIM, 'data-p="pg" data-n') : "") + "</div>" +
      '<div class="c" style="position:sticky;top:8px"><h2>🏆 বিজয়ী (' + bd(WON.length) + ')</h2><p class="sm">এরা পরের লটারিতে আসবে না। "বাদ দিন" চাপলে আবার যোগ্য হবে।</p>' +
      (WON.slice().reverse().map(function (w) { return '<div class="it"><div><button type="button" class="pdn" data-w="' + E(w.key) + '">' + E(w.name) + "</button> " + (w.rank ? '<button type="button" class="pdr" data-w="' + E(w.key) + '">#' + bd(w.rank) + "</button>" : "") + '</div><div class="sm">' + E(deptL(w.dept)) + " · " + E(w.batch || "—") + " · মার্ক " + bd(w.score == null ? "—" : w.score) + '</div>' + (FX ? '<div class="act">' + FX.ctl(w.key, FL[w.key]) + "</div>" : "") + '<div class="act"><button class="s" type="button" data-p="poster" data-k="' + E(w.key) + '">🖼 পোস্টার</button><button class="l s" type="button" data-p="unwin" data-k="' + E(w.key) + '">বাদ দিন</button></div></div>'; }).join("") || '<p class="sm">এখনো কেউ নয়।</p>') +
      (WON.length ? '<div class="act" style="margin-top:8px"><button class="d s" type="button" data-p="clear">সব তালিকা সাফ</button></div>' : "") + "</div></div>";
    V.innerHTML = h; V.onclick = click;
  }
  function flagTag(k) { if (FX) return FX.tag(FL[k]); var f = FL[k]; return f === "ok" ? ' <span class="tag">✅ ভেরিফাইড</span>' : f === "ex" ? ' <span class="tag">⛔ লটারি থেকে বাদ</span>' : f === "no" ? ' <span class="tag">❔ নট ভেরিফাইড</span>' : ""; }
  function flagBtns(k) { if (FX) return '<div class="act" style="margin-top:4px">' + FX.ctl(k, FL[k]) + "</div>"; var f = FL[k], B = function (v, t, c) { return '<button type="button" class="s ' + (f === v ? "" : "l") + (c || "") + '" data-fl="' + v + '" data-k="' + E(k) + '">' + t + "</button>"; };
    return '<div class="act" style="margin-top:4px">' + B("ok", "✅ ভেরিফাই ওকে") + B("no", "❔ নট ভেরিফাইড") + B("ex", "⛔ বাদ", " d") + (f ? '<button type="button" class="s l" data-fl="" data-k="' + E(k) + '">↺ রিসেট</button>' : "") + "</div>"; }
  function entry(p, w) {
    var e = p.e;
    return '<div class="it' + (w ? " win" : "") + '"><div><button type="button" class="pdn" data-w="' + E(p.key) + '" data-e="' + p.id + '">' + E(p.name) + "</button> " + rankTag(p) + ' <span class="tag">' + E(deptL(p.dept) || "—") + '</span><span class="tag">' + E(p.batch || "—") + '</span><span class="tag">মার্ক ' + bd(p.score == null ? "—" : p.score) + "</span>" + (w ? '<span class="tag">✓ জিতেছে</span>' : "") + flagTag(p.key) + ' <span class="sm">' + M.tm(p.at) + "</span></div>" +
      "<div>📞 " + E(e.contact || "—") + '</div><div><a href="' + E(SU(e.fb_link)) + '" target="_blank" rel="noopener">ফেসবুক পোস্ট</a> · <a href="' + E(SU(e.shot_url)) + '" target="_blank" rel="noopener"><img class="th" src="' + E(SU(e.shot_url)) + '" alt="স্ক্রিনশট" loading="lazy"></a></div>' +
      '<div class="sm">আইপি: ' + E(e.ip || "—") + " · " + E((e.ua || "").slice(0, 90)) + '</div><div class="act"><button class="l s" type="button" data-w="' + E(p.key) + '">🪪 কার্ড ও ℹ️ ইনফো</button><button class="d s" type="button" data-shot="' + p.id + '">🖼 ছবি মুছুন (এখনই)</button><button class="d s" type="button" data-del="' + p.id + '">মুছুন</button></div>' + flagBtns(p.key) + "</div>";
  }
  function eligible(L) {
    var won = wonKeys(), seen = {}, out = [];
    L.forEach(function (p) { if (won[p.key] || FL[p.key] === "ex" || FL[p.key] === "nr" || seen[p.key]) return; seen[p.key] = 1; out.push(p); });
    return out;
  }
  window.MCP = { all: function () { return ALL; }, board: function () { return BOARD; }, flags: function () { return FL; }, old: function () { return WON; }, filtered: function () { return filtered(); },
    rnd: rnd, audio: audio, beep: beep, fanfare: fanfare, drawWheel: drawWheel, dd: dd, bd: bd, E: E, deptL: deptL, poster: poster, openWinner: openWinner, pkey: pkey,
    mute: function (v) { if (v !== undefined) MUTE = !!v; return MUTE; }, refresh: function () { return view(); },
    addWon: function (list) { WON = LS.get("mc2_prize_won", WON); var have = wonKeys(); (list || []).forEach(function (g) { if (g && g.key && !have[g.key]) { have[g.key] = 1; WON.push({ key: g.key, name: g.name, device: g.device || "", dept: g.dept || "", batch: g.batch || "", score: g.score == null ? null : g.score, rank: g.rank || null, at: Date.now() }); } }); saveWon(); } }; // লটারি (admin-lottery.js) ফোল্ডারে সেভের পর এখানেও যোগ করে, যাতে পাশের "বিজয়ী" তালিকা ও বাদ-তালিকা মেলে
  function find(key, id) { var r = null; ALL.forEach(function (p) { if (p.key === key && (!r || String(p.id) === String(id))) r = p; }); return r; }
  function saveWon() { LS.set("mc2_prize_won", WON); }

  function click(e) {
    var t = e.target, b = t.closest("[data-p]"), w = t.closest("[data-w]"), d = t.closest("[data-del]"), fl = t.closest("[data-fl]"); var sh = t.closest("[data-shot]"); if (sh) { if (!confirm("⚠ সতর্কতা: স্ক্রিনশটের ছবিটা এখনই মুছে যাবে, আর ফেরানো যাবে না (বিনে যায় না)। নিশ্চিত?")) return; return M.rpc("mc2_shot_delete", { p_id: +sh.dataset.shot }).then(function () { sh.disabled = true; sh.textContent = "✓ ছবি মোছা হয়েছে"; }).catch(M.fail); }
    if (fl) { var k = fl.dataset.k, v = fl.dataset.fl; return M.rpc("mc2_flag_set", { p_k: k, p_st: v }).then(function () { if (v) FL[k] = v; else delete FL[k]; paint(); }).catch(M.fail); }
    if (d) { if (!confirm("এই এন্ট্রি মুছে ফেলবেন?")) return; return M.A("contest_entries?id=eq." + d.dataset.del, { method: "DELETE" }).then(view).catch(M.fail); }
    if (w && !(b && b.dataset.p)) return openWinner(w.dataset.w);
    if (!b) return; var a = b.dataset.p;
    if (a === "apply") { F.min = M.$("#pmn").value; F.max = M.$("#pmx").value; F.rk = M.$("#prk").value; F.q = M.$("#pq").value; SHOW = LIM; paint(); }
    else if (a === "reset") { F = { dept: "", batch: "", days: 0, sort: "new", min: "", max: "", rk: "", q: "", st: "", showWon: F.showWon }; SHOW = LIM; paint(); }
    else if (a === "sw") { F.showWon = !F.showWon; paint(); }
    else if (a === "pg") { if (!b.disabled) { SHOW = (+b.dataset.n + 1) * LIM; paint(); } }
    else if (a === "lot") { F.min = M.$("#pmn").value; F.max = M.$("#pmx").value; F.rk = M.$("#prk").value; F.q = M.$("#pq").value; if (window.MCLOT) window.MCLOT(); else lottery(); }
    else if (a === "unwin") { WON = WON.filter(function (x) { return x.key !== b.dataset.k; }); saveWon(); paint(); }
    else if (a === "clear") { if (confirm("বিজয়ীর তালিকা সাফ করলে সবাই আবার লটারির যোগ্য হবে। করবেন?")) { WON = []; saveWon(); paint(); } }
    else if (a === "mode") setMode(b.dataset.m);
    else if (a === "poster") { var i = 0; WON.forEach(function (x, j) { if (x.key === b.dataset.k) i = j; }); poster(WON.slice(), i); }
  }
  // বিজয়ী/এন্ট্রির নামে ক্লিক: কার্ড প্রিভিউ ও ইউজার ইনফো দুটোই (কার্ড ওপরে, ইনফো নিচে)
  function openWinner(key) {
    var p = find(key) || WON.filter(function (x) { return x.key === key; })[0]; if (!p) return;
    if (p.device && window.MCA_USER) window.MCA_USER(p.device);
    if (window.MCA_CARD) window.MCA_CARD(p.device || "", p.name); else M.fail("admin-cards.js লোড হয়নি");
  }

  // ---------- 🎰 লটারি ----------
  function rnd(n) { try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); } }
  var AC = null;
  function audio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; } }
  function beep(f, d, type, vol, at) { if (!AC || !MUTE) return; try { var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (at || 0); o.type = type || "square"; o.frequency.value = f; g.gain.setValueAtTime(vol || .07, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02); } catch (e) {} }
  var MUTE = true;
  function fanfare() { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { beep(f, .22, "triangle", .12, i * .13); }); }
  var COLS = ["#1d6b43", "#d98200", "#7c3aed", "#0089b4", "#e11d48", "#34495e", "#2e9e5f", "#c2410c"];
  function drawWheel(cv, names, rot) {
    var c = cv.getContext("2d"), W = cv.width, R = W / 2 - 14, n = names.length, sg = Math.PI * 2 / n, i;
    c.clearRect(0, 0, W, W); c.save(); c.translate(W / 2, W / 2); c.rotate(rot);
    for (i = 0; i < n; i++) {
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, i * sg, (i + 1) * sg); c.closePath(); c.fillStyle = COLS[i % COLS.length]; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
      c.save(); c.rotate((i + .5) * sg); c.fillStyle = "#fff"; c.font = '700 ' + Math.max(12, Math.min(20, 300 / n)) + 'px "Hind Siliguri",sans-serif'; c.textAlign = "right"; c.textBaseline = "middle";
      var s = String(names[i]); if (s.length > 14) s = s.slice(0, 13) + "…"; c.fillText(s, R - 14, 0); c.restore();
    }
    c.restore(); c.beginPath(); c.arc(W / 2, W / 2, 26, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 5; c.strokeStyle = "#d98200"; c.stroke();
    c.beginPath(); c.moveTo(W / 2 - 16, 2); c.lineTo(W / 2 + 16, 2); c.lineTo(W / 2, 40); c.closePath(); c.fillStyle = "#b3261e"; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
  }
  function lottery() {
    var L = filtered(), pool = eligible(L), cnt = 3, custom = false, run = false, stop = false, got = [], el = document.createElement("div"); el.className = "pzm";
    function close() { stop = true; el.remove(); paint(); }
    function cfg() {
      var opts = [[1, "১ জন"], [2, "২ জন"], [3, "৩ জন"], [4, "৪ জন"], [5, "৫ জন"], ["c", "কাস্টম…"]];
      el.innerHTML = '<div class="pzb"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">🎰 লটারি</b><button class="l s" type="button" id="zx">✕ বন্ধ</button></div>' +
        '<p class="sm">বর্তমান ফিল্টারে যোগ্য: <b>' + bd(pool.length) + "</b> জন (আগের বিজয়ী: " + bd(WON.length) + " জন বাদ)।" + (pool.length ? "" : " ⚠️ কেউ নেই — ফিল্টার বদলান বা বিজয়ী তালিকা থেকে বাদ দিন।") + "</p>" +
        "<div><span class=\"sm\">কতজন বিজয়ী</span>" + dd("cnt", opts, custom ? "c" : cnt, function (v) { if (v === "c") { custom = true; } else { custom = false; cnt = +v; } cfg(); }) + "</div>" +
        (custom ? '<label>সংখ্যা লিখুন (১–৫০)<input id="zc" type="number" min="1" max="50" value="' + cnt + '"></label>' : "") +
        '<label style="display:flex;gap:8px;align-items:center"><input id="zs" type="checkbox" style="width:auto"' + (MUTE ? " checked" : "") + '> 🔊 শব্দ চালু</label>' +
        '<button type="button" id="zg" style="background:var(--o)"' + (pool.length ? "" : " disabled") + '>▶ চাকা ঘোরাও</button><div id="zr"></div></div>';
      el.querySelector("#zx").onclick = close;
      el.querySelector("#zs").onchange = function () { MUTE = this.checked; };
      el.querySelector("#zg").onclick = function () { var c = el.querySelector("#zc"); if (c) cnt = Math.max(1, Math.min(50, +c.value || 1)); audio(); go(); };
    }
    function go() {
      var n = Math.min(cnt, pool.length), left = pool.slice(), i = 0; got = []; run = true; stop = false;
      el.innerHTML = '<div class="pzb"><div style="display:flex;justify-content:space-between;align-items:center"><b id="zh">🎰 ঘুরছে…</b><button class="l s" type="button" id="zx">✕ বন্ধ</button></div><canvas id="zw" width="340" height="340"></canvas><div class="pzbig" id="zn">…</div><div id="zr" class="pzw"></div></div>';
      el.querySelector("#zx").onclick = close;
      var cv = el.querySelector("#zw");
      (function nextWin() {
        if (stop) return; if (i >= n) return done();
        var wi = rnd(left.length), W = left.splice(wi, 1)[0], names = [W.name], others = left.slice(), k;
        while (names.length < 16 && others.length) { k = rnd(others.length); names.push(others.splice(k, 1)[0].name); }
        if (names.length < 2) names.push("—");
        for (k = names.length - 1; k > 0; k--) { var j = rnd(k + 1), tmp = names[k]; names[k] = names[j]; names[j] = tmp; }
        var wIdx = names.indexOf(W.name), sg = Math.PI * 2 / names.length, rot0 = Math.random() * 6.28, base = -Math.PI / 2 - (wIdx + .5 + (Math.random() - .5) * .6) * sg;
        var target = base + Math.PI * 2 * Math.ceil((rot0 + 6 * Math.PI * 2 - base) / (Math.PI * 2)), dur = 4200, t0 = 0, last = -1;
        el.querySelector("#zh").textContent = "🎰 " + bd(i + 1) + " নম্বর বিজয়ী বাছাই হচ্ছে…"; el.querySelector("#zn").textContent = "…";
        function fr(ts) {
          if (stop) return; if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - p, 3.2), rot = rot0 + (target - rot0) * ease;
          drawWheel(cv, names, rot);
          var idx = Math.floor((((-Math.PI / 2 - rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / sg); if (idx !== last) { last = idx; beep(900 - p * 300, .05, "square", .05); }
          if (p < 1) return requestAnimationFrame(fr);
          fanfare(); el.querySelector("#zn").innerHTML = "🏆 " + E(W.name) + (W.rank ? " · র‍্যাংক #" + bd(W.rank) : "");
          WON.push({ key: W.key, name: W.name, device: W.device, dept: W.dept, batch: W.batch, score: W.score, rank: W.rank, at: Date.now() }); saveWon(); got.push(W); i++;
          el.querySelector("#zr").innerHTML = got.map(function (g, x) { return '<div class="it"><b>' + bd(x + 1) + ".</b> " + E(g.name) + (g.rank ? " · #" + bd(g.rank) : "") + "</div>"; }).join("");
          setTimeout(nextWin, 1600);
        }
        requestAnimationFrame(fr);
      })();
    }
    function done() {
      run = false;
      el.innerHTML = '<div class="pzb"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">🏆 বিজয়ী (' + bd(got.length) + ' জন)</b><button class="l s" type="button" id="zx">✕ বন্ধ</button></div>' +
        '<p class="sm">নাম বা র‍্যাংকে চাপলে কার্ড ও ইউজার ইনফো খুলবে।</p><div class="pzw">' +
        got.map(function (g, x) { return '<div class="it"><div>' + bd(x + 1) + '. <button type="button" class="pdn" data-w="' + E(g.key) + '">' + E(g.name) + "</button>" + (window.MCFB ? window.MCFB.span(g.device) : "") + " " + (g.rank ? '<button type="button" class="pdr" data-w="' + E(g.key) + '">র‍্যাংক #' + bd(g.rank) + "</button>" : "") + '</div><div class="sm">' + E(deptL(g.dept)) + " · " + E(g.batch || "—") + " · মার্ক " + bd(g.score == null ? "—" : g.score) + '</div><div class="act"><button class="s" type="button" data-pz="' + x + '">🖼 পোস্টার</button></div></div>'; }).join("") +
        '</div><div class="pzx"><button type="button" id="zp">🖼 সবার পোস্টার</button><button type="button" class="l" id="zsh">📄 এক পেজে (শিট)</button><button type="button" class="l" id="za">🎰 আবার লটারি</button></div></div>';
      el.querySelector("#zx").onclick = close;
      el.querySelector("#zp").onclick = function () { poster(got.slice(), 0); };
      el.querySelector("#zsh").onclick = function () { if (window.MCSheet) window.MCSheet.open(got.map(function (g) { return { key: g.key, name: g.name, device: g.device, dept: g.dept, batch: g.batch, score: g.score, rank: g.rank }; }), { title: "লটারি বিজয়ী" }); else alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন."); };
      el.querySelector("#za").onclick = function () { pool = eligible(filtered()); got = []; cfg(); };
    }
    el.onclick = function (e) {
      if (e.target === el && !run) return close();
      var w = e.target.closest("[data-w]"), z = e.target.closest("[data-pz]");
      if (w) openWinner(w.dataset.w); else if (z) poster(got.slice(), +z.dataset.pz);
    };
    document.body.appendChild(el); cfg();
  }

  // ---------- 🖼 পোস্টার (ফেসবুক-পোস্ট, ১০৮০×১০৮০) ----------
  // 🖼 পোস্টার আঁকার কোড এখন poster-draw.js-এ (পাবলিক বিজয়ী-তালিকাও একই কোড ব্যবহার করে)। admin.html-এ এটা admin-prize.js-এর আগে লোড হয়।
  var MP_ = window.MCPoster || {}, PZ_TH = MP_.TH, PZ_TX = MP_.TX, GX = MP_.GX, GN = MP_.GN, PZ_DEF = MP_.DEF, drawPoster = MP_.draw, pzGuess = MP_.guess, pzGender = MP_.gender, pzPick = MP_.pick, ascii = MP_.ascii, li = MP_.li, seeded = MP_.seeded, PVO = MP_.PVO, pk = MP_.pk, dTxt = MP_.dTxt, eff = MP_.eff, urlTxt = MP_.urlTxt, pzLines = MP_.lines, star = MP_.star, pcolOf = MP_.pcolOf, pillInk = MP_.pillInk, roman = MP_.roman;
  function getPhoto(p) {
    M = M || window.MCA;
    var q = p.device ? "device=eq." + encodeURIComponent(p.device) : "name=ilike." + encodeURIComponent("*" + String(p.name || "").replace(/[*,()%]/g, "") + "*");
    return M.A("mc2_cards?" + q + "&select=photo,rec,score&order=score.desc&limit=1").then(function (a) { if (a && a[0] && a[0].rec && a[0].rec.kind && !p.kind) p.kind = a[0].rec.kind; return a && a[0] && JPG.test(a[0].photo || "") ? a[0].photo : null; }).catch(function () { return null; });
  }
  function caption(p, msg) {
    var u = siteUrl();
    return "🎉 অভিনন্দন " + p.name + "!\n" + (msg ? msg + "\n" : "") + [dTxt(p), p.batch].filter(Boolean).join(" · ") + (p.rank ? " · র‍্যাংক #" + bd(p.rank) : "") + (p.score != null ? " · মার্ক " + bd(p.score) + "/" + bd(p.tot != null ? p.tot : 1000) : "") +
      "\n\nতুমিও খেলো, দেখো তুমি কলেজ কতটুকু চেনো 👉 " + u + "\n#MCExplorer #MCExplorerChallenge #পুরস্কার_বিজয়ী";
  }
  function poster(list, idx, hook) {   // hook = { pick(person, designIdx) -> string|void }: দিলে "✅ এই ডিজাইন বিজয়ীর জন্য বাছুন" বাটন আসে (admin-winners.js) — সার্ভারে কিছু যায় না, শুধু ডিজাইন-নম্বর ফর্মে বসে
    if (!list.length) return;
    var el = document.createElement("div"); el.className = "pzm"; if (hook && hook.fresh) el.style.zIndex = 10050; var pvKey, pvPrev;
    var cur = idx, urls = [], seq = 0, tm = 0, cache = {}, order = [], pngU = null, phc = {}, ex = LS.get("mc2_pz_txt", {}), S = hook && hook.base ? Object.assign({}, PZ_DEF, hook.base) : Object.assign({}, PZ_DEF, LS.get("mc2_pz_cfg", {})), FN = { b: "ব্যাজ / টাইটেল", m: "বিজয়ী বার্তা (অভিনন্দন)", t: "স্লোগান (শিরোনামের নিচে)", f: "নিচের শেপ (MC Explorer Challenge)", h: "শিরোনাম" }, SM = { h: "🔠 শিরোনাম", b: "🏷 ব্যাজ / টাইটেল", m: "💬 বিজয়ী বার্তা (অভিনন্দন)", t: "✨ স্লোগান", f: "🔻 নিচের শেপ ও ইউআরএল" }, PZ_H = ["MC Explorer", "MC Explorer Challenge"];
    if (!PZ_TH[S.d]) S.d = 0;
    if (hook && hook.designFor && !hook.base) { var dz0 = hook.designFor(list[cur]); if (dz0 != null && PZ_TH[dz0]) S.d = dz0; }   // বিজয়ীর আগে সেভ করা ডিজাইন দিয়ে খোলে
    var Dd = D(), AS = Promise.all([window.MCCards && window.MCCards.fonts ? window.MCCards.fonts() : null, li(Dd.logos && Dd.logos.mc), li(Dd.logos && Dd.logos.nu), window.mcLogo && window.mcLogo.forType ? window.mcLogo.forType("p").catch(function () { return null; }) : null]).then(function (r) { return r[3] ? [r[3][0] || r[1], r[3][1] || r[2]] : [r[1], r[2]]; }); // r[3] = লোগো-ট্যাবের "পোস্টার ও বিজয়ী কার্ড"-এর লোগো (না থাকলে সবার বাম/ডান)
    // বাম/ডান লোগো বাছাই (S.lgo = { l, r, tl, tr }): null = আগের মতো ডিফল্ট, নম্বর = লোগো, 0 = অক্ষর (১-৩টা)
    function ltrImg(t) {
      t = String(t || "").trim().slice(0, 3); if (!t) return null;
      var k = document.createElement("canvas"); k.width = k.height = 220; var g = k.getContext("2d");
      g.fillStyle = "#10261b"; g.beginPath(); g.arc(110, 110, 104, 0, 6.2832); g.fill(); g.lineWidth = 8; g.strokeStyle = "#e0b84a"; g.stroke();
      g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 " + (t.length > 2 ? 70 : t.length > 1 ? 88 : 112) + 'px "Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI",sans-serif'; g.fillText(t, 110, 116);
      return k;
    }
    function LG(s) {
      return AS.then(function (b) {
        var o = s && s.lgo; if (!o || !window.mcLogo || !window.mcLogo.img || (o.l == null && o.r == null)) return b;
        var side = function (v, tx, i) { if (v == null) return Promise.resolve(b[i]); if (v === 0) return Promise.resolve(ltrImg(tx)); return Promise.resolve(window.mcLogo.img(v, i)).then(function (x) { return x || b[i]; }, function () { return b[i]; }); };
        var go = function () { return Promise.all([side(o.l, o.tl, 0), side(o.r, o.tr, 1)]); };
        return window.mcLogo.load ? Promise.resolve(window.mcLogo.load()).then(go, go) : go();
      });
    }
    var idle = function (f) { if (window.requestIdleCallback) window.requestIdleCallback(f, { timeout: 1500 }); else setTimeout(f, 200); };
    var q = function (s) { return el.querySelector(s); };
    var lst = function (id) { return (PZ_TX[id] || PZ_H).concat(GX[id] ? GX[id].m.concat(GX[id].f) : [], id === "m" ? (MP_.PR || []) : [], (MP_.NEW && MP_.NEW[id]) || [], ex[id] || []); },
      oth = function (id) { var have = lst(id), out = []; ["h", "b", "m", "t", "f"].forEach(function (k) { if (k !== id) lst(k).forEach(function (x) { if (have.indexOf(x) < 0 && out.indexOf(x) < 0) out.push(x); }); }); return out; }, lab = function (t) { return String(t).replace("@url", urlTxt()); };
    function save() { if (hook && hook.fresh) return; var c0 = Object.assign({}, S); if (hook && hook.designFor) { var o0 = LS.get("mc2_pz_cfg", {}); if (o0.d != null) c0.d = o0.d; else delete c0.d; } LS.set("mc2_pz_cfg", c0); }
    function close() { if (hook && hook.fresh) { if (pvPrev) PVO[pvKey] = pvPrev; else delete PVO[pvKey]; } clearTimeout(tm); clearInterval(gc); seq++; urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); el.remove(); }
    function photo(p) { var k = p.device || p.name; return phc[k] || (phc[k] = getPhoto(p).then(li)); }   // ছবি একবারই আনে, আবার আনে না
    function drop(k) { var e = cache[k]; delete cache[k]; if (e) e.pr.then(function (r) { try { URL.revokeObjectURL(r.u); } catch (x) {} }, function () {}); }
    function build(i) {   // JPEG ১০৮০ (৯২%): ফেসবুকে একই দেখায়, ফাইল ছোট। তৈরি কার্ড সর্বোচ্চ ৫টা থাকে, ১ ঘণ্টা পরে মোছে
      var p0 = list[i], ov = PVO[pk(p0)] || {}, sig = JSON.stringify(S), k = i + "|" + sig + JSON.stringify(ov), p = eff(p0), pr;
      if (cache[k]) { order = order.filter(function (x) { return x !== k; }); order.push(k); return cache[k].pr; }
      var s0 = JSON.parse(sig);
      pr = Promise.all([LG(s0), ov.nophoto ? null : photo(p0)]).then(function (r) { var cv = drawPoster(p, r[1], s0, r[0], 1); return new Promise(function (res) { cv.toBlob(function (b) { var u = URL.createObjectURL(b); urls.push(u); res({ u: u, size: b.size }); }, "image/jpeg", .92); }); });
      cache[k] = { pr: pr, at: Date.now() }; order.push(k); while (order.length > 5) drop(order.shift()); return pr;
    }
    function prefetch(my) {   // ব্যাকগ্রাউন্ডে পরের/আগের কার্ড এঁকে রাখে (ফোন ফ্রি থাকলে), সব একসাথে নয়
      var n = list.length, ids = []; [1, -1, 2].forEach(function (d) { var i = (cur + d + n * 3) % n; if (i !== cur && ids.indexOf(i) < 0) ids.push(i); });
      ids.reduce(function (pr, i) { return pr.then(function () { if (my !== seq) return; return new Promise(function (r) { idle(r); }).then(function () { if (my === seq) return build(i); }); }); }, Promise.resolve()).catch(function () {});
    }
    function hdPng(my) {   // PNG (১০৮০, প্রায় ১ এমবি) আলাদা লিংকে, ফ্রি সময়ে, শুধু এই কার্ডের জন্য
      var a = q("#ph"), p0 = list[cur], p = eff(p0), nph =  (PVO[pk(p0)] || {}).nophoto; a.classList.add("off"); a.textContent = "⏳ PNG তৈরি হচ্ছে…";
      idle(function () { if (my !== seq) return; var s = JSON.parse(JSON.stringify(S)); Promise.all([LG(s), nph ? null : photo(p0)]).then(function (r) { if (my !== seq) return; var cv = drawPoster(p, r[1], s, r[0], 1); cv.toBlob(function (b) { if (!b || my !== seq) return; var u = URL.createObjectURL(b); urls.push(u); pngU = u; a.href = u; a.download = a.dataset.fn + ".png"; a.classList.remove("off"); a.textContent = "⬇ PNG ডাউনলোড (১০৮০, " + bd(Math.round(b.size / 1024)) + " KB)"; }, "image/png"); }).catch(function () {}); });
    }
    function syncHook() {   // বিজয়ী-ভিত্তিক বাটন/লেখা: নাম, সেভ করা ডিজাইন, ডিলেট বাটন
      if (!hook) return; var p0 = list[cur], nm = eff(p0).name;
      if (hook.pick) {
        var pb = q("#pws"), mm = q("#pwm"), u = q("#pwu"), st = hook.status ? (hook.status(p0) || {}) : {}, has = st.d != null && PZ_TH[st.d];
        if (pb) pb.textContent = "✅ " + nm + "-এর জন্য এই ডিজাইন সেভ করুন";
        if (mm && hook.status) mm.textContent = (st.cards != null ? "🎴 সেভ-করা কার্ড: " + bd(st.cards) + "টি (সম্পাদিত " + bd(st.edited || 0) + "টি; হোমে দেখায়: " + bd(st.shown || 0) + "টি) · " : "") + (has ? "✔ " + nm + "-এর সেভ করা ডিজাইন নং " + bd(+st.d + 1) + " — " + PZ_TH[st.d].n + (S.d === +st.d ? " (এটাই এখন দেখানো হচ্ছে)" : " — এখন অন্য ডিজাইন দেখাচ্ছে; বদলাতে ওপরের বাটন চাপুন") : "এখনো কোনো ডিজাইন নম্বর সেভ নেই (ডিফল্ট ১ম দেখাবে)") + (st.note ? " · " + st.note : "");
        if (u) u.hidden = !has;
      }
      if (hook.del) { var dl = q("#pwdl"); if (dl) dl.hidden = !(hook.has && hook.has(p0)); }
    }
    function go(n) {   // বিজয়ী বদল (ওপরের/নিচের বাটন): ওই বিজয়ীর সেভ করা ডিজাইনে চলে যায়
      cur = (n + list.length) % list.length; fillV();
      if (hook && hook.designFor) { var dz = hook.designFor(list[cur]); if (dz != null && PZ_TH[dz] && dz !== S.d) { S.d = dz; q("[data-d]").value = S.d; return rs(); } }
      refresh();
    }
    function refresh() {
      syncHook();
      if (pngU) { try { URL.revokeObjectURL(pngU); } catch (x) {} pngU = null; }
      sums();
      var p = eff(list[cur]), my = ++seq, fn = "MC_Winner_" + (p.rank ? "rank" + p.rank + "_" : "") + ascii(p.name), pa = q("#pa"), w = q("#pw"), im = q("#pi");
      q("#pt").textContent = "🖼 পোস্টার — " + p.name + " · " + GN[pzGender(p, S)] +  (list.length > 1 ? " (" + bd(cur + 1) + "/" + bd(list.length) + ")" : ""); { var fw = q("#pfbw"); if (fw) fw.innerHTML = window.MCFB ? "ফেসবুকে ছাড়ার অনুমতি:" + window.MCFB.span(list[cur] && list[cur].device) : ""; }
      q("#pc").value = caption(p, pzPick("m", S.m, p, pzGender(p, S))); q("#ph").dataset.fn = fn; q("#ph").classList.add("off"); pa.classList.add("off"); pa.textContent = "⏳ ডাউনলোড (JPG)"; if (!im.src) { w.hidden = false; w.textContent = "⏳ পোস্টার আঁকা হচ্ছে…"; }
      build(cur).then(function (r) {
        if (my !== seq) return; im.src = r.u; im.hidden = false; w.hidden = true; pa.href = r.u; pa.download = fn + ".jpg"; pa.classList.remove("off"); pa.textContent = "⬇ পোস্টার ডাউনলোড (JPG, " + bd(Math.round(r.size / 1024)) + " KB)";
        if (!S.g || S.g === "a") { q("#pc").value = caption(p, pzPick("m", S.m, p, pzGender(p, S))); q("#pt").textContent = q("#pt").textContent.replace(/ · (ছেলে|মেয়ে|নিরপেক্ষ)/, " · " + GN[pzGender(p, S)]); }
        hdPng(my); prefetch(my);
      }).catch(function (e) { w.hidden = false; w.textContent = "আঁকা যায়নি: " + (e && e.message ? e.message : e); });
    }
    function sums() { ["h", "b", "m", "t", "f"].forEach(function (id) { var s = q('[data-sv="' + id + '"]'); if (!s) return; var v = S[id]; s.textContent = v === "" ? "⬜ খালি" : v === "__a" ? "🎲 অটো" : (lab(v).length > 26 ? lab(v).slice(0, 26) + "…" : lab(v)); }); }
    function later() { clearTimeout(tm); tm = setTimeout(refresh, 260); }
    function ctl(id) {   // সাইজ (সব লেখায়) + অ্যালাইনমেন্ট (বার্তা ও নিচের শেপে)
      if (id === "h") return "";
      var sv = S[id + "s"] == null ? 1 : +S[id + "s"], av = S[id + "a"] || "c", h = '<div class="pzo"><span>সাইজ</span>';
      ["ছোট", "মাঝারি", "বড়"].forEach(function (t, i) { h += '<button type="button" data-sz="' + id + ":" + i + '"' + (i === sv ? ' class="on"' : "") + ">" + t + "</button>"; });
      if (id === "m" || id === "f") { h += "<span>অ্যালাইনমেন্ট</span>"; [["l", "⬅ বাম"], ["c", "মাঝ"], ["r", "ডান ➡"]].forEach(function (a) { h += '<button type="button" data-al="' + id + ":" + a[0] + '"' + (a[0] === av ? ' class="on"' : "") + ">" + a[1] + "</button>"; }); }
      return h + "</div>";
    }
    function fld(id) {
      var v = S[id], L = lst(id).concat(oth(id)), auto = v === "__a" && !!GX[id], blank = v === "", inl = !auto && !blank && L.indexOf(v) >= 0, mine = (ex[id] || []).indexOf(v) >= 0,
        opt = function (t, star) { return '<option value="' + E(t) + '"' + (t === v ? " selected" : "") + ">" + (star ? "⭐ " : "") + E(lab(t)) + "</option>"; },
        grp = function (n, arr, star) { return arr && arr.length ? '<optgroup label="' + n + '">' + arr.map(function (t) { return opt(t, star); }).join("") + "</optgroup>" : ""; };
      return '<label>' + FN[id] + '<select data-f="' + id + '"><option value="__e"' + (blank ? " selected" : "") + ">⬜ খালি রাখুন (কিছু আসবে না)</option>" + (GX[id] ? '<option value="__a"' + (auto ? " selected" : "") + ">" + "🎲 অটো (ছেলে/মেয়ে অনুযায়ী)" + "</option>" : "") +
        grp(GX[id] ? "সবার জন্য (আগের লেখা)" : "তৈরি লেখা", PZ_TX[id] || PZ_H) + (GX[id] ? grp("👦 ছেলে", GX[id].m) + grp("👧 মেয়ে", GX[id].f) : "") + (id === "m" ? grp("🎉 নতুন প্রশংসা ও অভিনন্দন (" + (MP_.PR || []).length + "টা)", MP_.PR || []) : "") + (MP_.NEW && MP_.NEW[id] ? grp("🆕 নতুন সুন্দর লাইন (" + MP_.NEW[id].length + "টা)", MP_.NEW[id]) : "") + grp("⭐ আমার জমানো", ex[id], 1) + grp("📚 অন্য ঘরের সব লাইন", oth(id)) +
        '<option value="__c"' + (inl || blank || auto ? "" : " selected") + ">✏️ কাস্টম লিখুন…</option></select></label>" +
        '<div class="pzc" data-c="' + id + '"' + (inl || blank || auto ? " hidden" : "") + '><input type="text" data-i="' + id + '" value="' + E(inl || blank || auto ? "" : v) + '" placeholder="নিজের লেখা লিখুন (ফাঁকা = কিছু আসবে না)"><button type="button" class="s" data-add="' + id + '">➕ তালিকায় রাখুন</button></div>' +
        (mine ? '<button type="button" class="l s" data-del="' + id + '">🗑 এই লেখাটা তালিকা থেকে মুছুন</button>' : "") + ctl(id) +
        (id === "f" ? '<label>ইউআরএল (শেপের নিচে, ঐচ্ছিক)<input type="text" data-i="u" value="' + E(S.u || "") + '" placeholder="যেমন mc-explorer.pages.dev — ফাঁকা = কিছু আসবে না"></label>' : "");
    }
    function paintF(id) { q('[data-w="' + id + '"]').innerHTML = fld(id); sums(); }
    el.innerHTML = '<div class="pzb"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b id="pt"></b><button class="l s" type="button" id="px">✕ বন্ধ</button></div><div id="pfbw" class="sm"></div>' +
      (list.length > 1 ? '<div class="pzx"><button class="l s" type="button" id="pp">‹ আগের</button><button class="l s" type="button" id="pn">পরের ›</button></div>' : "") +
      '<div class="pzs"><div class="sm" id="pw">⏳ পোস্টার আঁকা হচ্ছে…</div><img id="pi" alt="পোস্টার" hidden></div>' +
      '<a class="pzd off" id="pa" download>⏳ পোস্টার ডাউনলোড (JPG)</a><a class="pzd off" id="ph" style="background:var(--o)" download>⏳ PNG</a>' +
      (hook && hook.pick ? '<button type="button" class="pzd" id="pws" style="background:#1d6b43;border:0;cursor:pointer;width:100%">✅ এই ডিজাইনটি এই বিজয়ীর জন্য বাছুন</button><div class="sm" id="pwm"></div>' + (hook.unpick ? '<button type="button" class="l s" id="pwu" hidden>↩ সেভ করা ডিজাইন সরান (ডিফল্টে ফিরুন)</button>' : '') : '') +
      (hook && hook.save ? '<button type="button" class="pzd" id="pwsv" style="background:#7c3aed;border:0;cursor:pointer;width:100%">💾 এই সম্পাদিত কার্ড সেভ করুন (সরাসরি ডাটাবেজে)</button>' + (hook.saveShow ? '<button type="button" class="pzd" id="pwsh" style="background:#16a34a;border:0;cursor:pointer;width:100%">👁 সেভ + হোমে দেখান (এক ক্লিকে ডাটাবেজে)</button>' : '') + (hook.verify ? '<button type="button" class="pzd" id="pwvf" style="background:#0ea5e9;border:0;cursor:pointer;width:100%">🔎 ডাটাবেজে আছে কি না নিশ্চিত করুন (আলাদা চেক)</button>' : '') + '<div class="sm" id="pwsm"></div>' + (hook.del ? '<button type="button" class="pzd" id="pwdl" hidden style="background:#e11d48;border:0;cursor:pointer;width:100%">🗑 এই কার্ড ডিলেট করুন</button>' : '') : '') +
      '<details id="pzv" class="pzg"><summary><span>👤 বিজয়ীর তথ্য বদলান (শুধু এই পোস্টারে)</span></summary><div style="display:grid;gap:6px;margin-top:6px">' +
        '<label>নাম<input type="text" data-pv="name"></label><label>বিভাগ<input type="text" data-pv="dept"></label><label>সেশন / ব্যাচ<input type="text" data-pv="batch"></label>' +
        '<label>র‍্যাংক (ফাঁকা = ব্যাজ আসবে না)<input type="text" inputmode="numeric" data-pv="rank"></label><label>মার্ক (ফাঁকা = মার্কের লাইন আসবে না)<input type="text" inputmode="numeric" data-pv="score"></label><label>মোট মার্ক<input type="text" inputmode="numeric" data-pv="tot"></label>' +
        '<label class="pzq"><input type="checkbox" data-pv="ph" style="flex:none;width:20px;height:20px;min-width:20px;padding:0;margin:0"> ছবি দেখাও (বন্ধ করলে নামের প্রথম অক্ষর বসবে)</label><button type="button" class="l s" id="pvr">↺ আসল তথ্যে ফেরান</button></div></details>' +
      '<details class="pzg"><summary><span>🎨 ডিজাইন, রঙ, লোগো ও QR</span></summary><div style="display:grid;gap:6px;padding-top:2px">' +
      '<label>ডিজাইন<select data-d="1">' + PZ_TH.map(function (t, k) { return '<option value="' + k + '"' + (k === S.d ? " selected" : "") + ">" + t.n + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="l s" id="pdn">⏭ পরের ডিজাইন ›</button>' +
      '<label>লিংক পিলের রঙ<select id="ppc">' + [["auto", "🎨 ডিজাইনের রঙ (ডিফল্ট)"], ["#ffb300", "⭐ সোনালি"], ["#1d6b43", "🟢 সবুজ"], ["#e11d48", "🔴 লাল"], ["#ffffff", "⚪ সাদা"], ["#10261b", "⚫ গাঢ়"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (S.pc || "auto") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="l s" id="ppn">⏭ পরের রঙ ›</button>' +
      '<div id="pzlg"></div><label class="pzq"><input type="checkbox" id="pq"' + (S.qr ? " checked" : "") + '> QR কোড দেখাও (সাইটের লিংক)</label></div></details>' +
      '<details class="pzg"><summary><span>⚧ জেন্ডার (অটো লেখা বাছাইয়ের জন্য)</span></summary><div style="padding-top:2px"><label><select id="pg">' + [["a", "🤖 অটো (নাম দেখে আন্দাজ)"], ["m", "👦 ছেলে"], ["f", "👧 মেয়ে"], ["x", "⚪ নিরপেক্ষ (আগের লেখা)"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (S.g || "a") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div></details>" + ["h", "b", "m", "t", "f"].map(function (id) { return '<details class="pzg"><summary><span>' + SM[id] + '</span><small data-sv="' + id + '"></small></summary><div data-w="' + id + '" class="pzw">' + fld(id) + "</div></details>"; }).join("") +
      '<details class="pzg"><summary><span>📋 ক্যাপশন</span></summary><div style="display:grid;gap:6px;padding-top:2px"><label>ক্যাপশন<textarea id="pc" rows="6"></textarea></label><button type="button" id="pcp">📋 ক্যাপশন কপি</button><div class="sm">ডাউনলোড না হলে ছবিতে চেপে ধরে (লং-প্রেস) "ছবি সেভ করুন" দিন।</div></div></details>' +
      (list.length > 1 ? '<div class="pzx"><button class="l s" type="button" id="pp2">‹ আগের</button><button class="s" type="button" id="pn2" style="background:#2563eb;color:#fff">পরের ›</button></div>' : "") + '</div>';
    var rs = function () { Object.keys(cache).forEach(drop); order = []; save(); later(); };   // লেখা/ডিজাইন বদলালে আগের তৈরি কার্ড বাদ
    function fillV() {   // বর্তমান বিজয়ীর (বদলসহ) তথ্য ঘরে ভরে
      var p0 = list[cur], e = eff(p0), o = PVO[pk(p0)] || {}, set = function (k, v) { var i = q('[data-pv="' + k + '"]'); if (i) i.value = v == null ? "" : v; };
      set("name", e.name); set("dept", dTxt(e)); set("batch", e.batch); set("rank", e.rank); set("score", e.score); set("tot", e.tot != null ? e.tot : 1000); var c = q('[data-pv="ph"]'); if (c) c.checked = !o.nophoto;
    }
    el.addEventListener("input", function (e) {
      var t = e.target, k = t.dataset && t.dataset.pv; if (!k || k === "ph") return; var p0 = list[cur], o = PVO[pk(p0)] || (PVO[pk(p0)] = {}); o[k] = t.value; rs();
    });
    el.addEventListener("change", function (e) { var t = e.target; if (!t.dataset || t.dataset.pv !== "ph") return; var p0 = list[cur], o = PVO[pk(p0)] || (PVO[pk(p0)] = {}); o.nophoto = !t.checked; rs(); });
    q("#pvr").onclick = function () { delete PVO[pk(list[cur])]; fillV(); rs(); };
    pvKey = pk(list[0]); pvPrev = PVO[pvKey];   // সম্পাদনা-মোড (hook.fresh): বিজয়ীর তথ্য hook.pv থেকে শুরু; জানালা বন্ধে আগের অবস্থায় ফেরে
    if (hook && hook.fresh) { if (hook.pv && Object.keys(hook.pv).length) PVO[pvKey] = JSON.parse(JSON.stringify(hook.pv)); else delete PVO[pvKey]; }
    fillV();
    q("#px").onclick = close; if (q("#pp")) { q("#pp").onclick = function () { go(cur - 1); }; q("#pn").onclick = function () { go(cur + 1); }; if (q("#pp2")) { q("#pp2").onclick = function () { go(cur - 1); }; q("#pn2").onclick = function () { go(cur + 1); }; } }
    q("[data-d]").onchange = function () { S.d = +this.value; rs(); };
    q("#pg").onchange = function () { S.g = this.value; rs(); };
    q("#pq").onchange = function () { S.qr = this.checked; rs(); };
    q("#ppc").onchange = function () { S.pc = this.value; rs(); };
    q("#pdn").onclick = function () { S.d = (S.d + 1) % PZ_TH.length; q("[data-d]").value = S.d; rs(); };
    var note = function (id, t) { var m = q(id); if (m) m.textContent = t; }, fail = function (id, e) { note(id, "⚠️ " + (e && e.message ? e.message : e)); };
    if (hook && hook.pick && q("#pws")) q("#pws").onclick = function () {   // এই মুহূর্তে দেখানো ডিজাইনের নম্বর বিজয়ীর সাথে বসায় (শুধু একটা ছোট সংখ্যা; ছবি সেভ হয় না); hook.pick প্রতিশ্রুতি ফেরালে সেভ শেষ হলে বার্তা আসে
      var b = this, p0 = list[cur]; b.disabled = true; note("#pwm", "⏳ সেভ হচ্ছে…");
      Promise.resolve().then(function () { return hook.pick(p0, S.d); }).then(function (t) { b.disabled = false; syncHook(); note("#pwm", "✅ " + (t || "বাছা হয়েছে")); }, function (e) { b.disabled = false; fail("#pwm", e); });
    };
    if (hook && hook.unpick && q("#pwu")) q("#pwu").onclick = function () {
      var b = this, p0 = list[cur]; b.disabled = true;
      Promise.resolve().then(function () { return hook.unpick(p0); }).then(function (t) { b.disabled = false; syncHook(); note("#pwm", "↩ " + (t || "সরানো হয়েছে")); }, function (e) { b.disabled = false; fail("#pwm", e); });
    };
    if (hook && hook.save && q("#pwsv")) q("#pwsv").onclick = function () {   // সম্পাদিত কার্ডের সেটিং (ছোট কোড) বিজয়ীর তালিকায় বসায়; আবার চাপলে আগেরটার জায়গায় বসে (শেষটাই থাকে); ডাউনলোড বাটন আগের মতোই কাজ করে
      var b = this, p0 = list[cur]; b.disabled = true; note("#pwsm", "⏳ সেভ হচ্ছে…");
      Promise.resolve().then(function () { return hook.save(p0, JSON.parse(JSON.stringify(S)), JSON.parse(JSON.stringify(PVO[pk(p0)] || {}))); }).then(function (t) { b.disabled = false; syncHook(); note("#pwsm", t || "✅ সেভ হয়েছে"); }, function (e) { b.disabled = false; fail("#pwsm", e); });
    };
    if (hook && hook.saveShow && q("#pwsh")) q("#pwsh").onclick = function () {   // সেভ + একই সাথে হোমে দেখানোর তালিকায় (এক ক্লিক, সরাসরি ডাটাবেজে)
      var b = this, p0 = list[cur]; b.disabled = true; note("#pwsm", "⏳ সেভ হচ্ছে…");
      Promise.resolve().then(function () { return hook.saveShow(p0, JSON.parse(JSON.stringify(S)), JSON.parse(JSON.stringify(PVO[pk(p0)] || {}))); }).then(function (t) { b.disabled = false; syncHook(); note("#pwsm", t || "✅ সেভ হয়েছে"); }, function (e) { b.disabled = false; fail("#pwsm", e); });
    };
    if (hook && hook.verify && q("#pwvf")) q("#pwvf").onclick = function () {   // আলাদা চেক: সার্ভার থেকে নতুন করে পড়ে দেখে এই কার্ড সত্যিই ডাটাবেজে আছে কি না
      var b = this; b.disabled = true; note("#pwsm", "⏳ ডাটাবেজ থেকে পড়ে দেখা হচ্ছে…");
      Promise.resolve().then(function () { return hook.verify(list[cur], JSON.parse(JSON.stringify(S)), JSON.parse(JSON.stringify(PVO[pk(list[cur])] || {}))); }).then(function (t) { b.disabled = false; note("#pwsm", t); }, function (e) { b.disabled = false; fail("#pwsm", e); });
    };
    if (hook && hook.del && q("#pwdl")) q("#pwdl").onclick = function () {
      if (!confirm("এই কার্ডটা ডিলেট করবেন?")) return; var b = this; b.disabled = true;
      Promise.resolve().then(function () { return hook.del(list[cur]); }).then(function () { b.disabled = false; close(); }, function (e) { b.disabled = false; fail("#pwsm", e); });
    };
    if (window.mcLogo && window.mcLogo.picker) { var addLg = function () { var h = q("#pzlg"); if (h && !h.firstChild) h.appendChild(window.mcLogo.picker({ admin: true, init: S.lgo || null, onChange: function (ov) { S.lgo = ov; rs(); } })); }; Promise.resolve(window.mcLogo.load ? window.mcLogo.load() : null).then(addLg, addLg); }   // পোস্টারের বাম ও ডান লোগো: আলাদা ড্রপডাউন
    q("#ppn").onclick = function () { var s = q("#ppc"); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; S.pc = s.value; rs(); };   // পরের লিংক-পিল রঙ
    el.addEventListener("change", function (e) { var s = e.target, id = s.dataset && s.dataset.f; if (!id) return; if (s.value === "__e") { S[id] = ""; paintF(id); rs(); } else if (s.value === "__a") { S[id] = "__a"; paintF(id); rs(); } else if (s.value === "__c") { q('[data-c="' + id + '"]').hidden = false; q('[data-i="' + id + '"]').focus(); } else { S[id] = s.value; paintF(id); rs(); } });
    el.addEventListener("input", function (e) { var t = e.target, id = t.dataset && t.dataset.i; if (!id) return; S[id] = t.value.trim(); rs(); });
    el.addEventListener("click", function (e) { var t = e.target, a = t.dataset && t.dataset.add, d = t.dataset && t.dataset.del, z = t.dataset && t.dataset.sz, al = t.dataset && t.dataset.al, v;
      if (z) { z = z.split(":"); S[z[0] + "s"] = +z[1]; paintF(z[0]); rs(); }
      if (al) { al = al.split(":"); S[al[0] + "a"] = al[1]; paintF(al[0]); rs(); }
      if (a) { v = S[a]; if (v && lst(a).indexOf(v) < 0) { ex[a] = (ex[a] || []).concat([v]); LS.set("mc2_pz_txt", ex); } paintF(a); }
      if (d) { ex[d] = (ex[d] || []).filter(function (x) { return x !== S[d]; }); LS.set("mc2_pz_txt", ex); S[d] = PZ_DEF[d]; paintF(d); rs(); } });
    q("#pcp").onclick = function () { var ta = q("#pc"), b = this, ok = function () { b.textContent = "✅ কপি হয়েছে"; setTimeout(function () { b.textContent = "📋 ক্যাপশন কপি"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, function () { ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} }); else { ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} } };
    el.onclick = (function (f) { return function (e) { if (e.target === el) close(); }; })();
    var st2 = document.getElementById("pzst") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "pzst", textContent: ".pzb select,.pzb input[type=text]{width:100%;padding:9px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);font:inherit}.pzc{display:flex;gap:6px;align-items:center}.pzc[hidden]{display:none}.pzc input{flex:1;min-width:0}.pzb *{min-width:0}.pzb .pzs{position:sticky;top:-14px;z-index:3;background:var(--card);padding:6px 0 4px;display:grid;gap:4px}.pzb .pzs img{max-height:32vh}.pzg{border:1px solid var(--bd);border-radius:10px;padding:0 10px}.pzg>summary{cursor:pointer;font-weight:700;padding:11px 0;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:8px}.pzg>summary::-webkit-details-marker{display:none}.pzg>summary::after{content:'▾';opacity:.6}.pzg[open]>summary::after{content:'▴'}.pzg>summary small{flex:1;text-align:right;font-weight:500;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pzg[open]{padding-bottom:10px}.pzb textarea{width:100%}.pzb button.s{white-space:normal}.pzq{display:flex;gap:8px;align-items:center;font-weight:600}.pzo{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.pzo span{width:100%;font-size:12.5px;font-weight:700;opacity:.75}.pzo button{flex:1;min-width:64px;padding:8px 6px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);font:600 14px inherit;cursor:pointer}.pzo button.on{background:#1d6b43;border-color:#1d6b43;color:#fff}" }));
    var gc = setInterval(function () { var now = Date.now(); Object.keys(cache).forEach(function (k) { if (now - cache[k].at > 3600000) { drop(k); order = order.filter(function (x) { return x !== k; }); if (k.indexOf(cur + "|") === 0) refresh(); } }); }, 60000);   // ১ ঘণ্টা পরে তৈরি কার্ড মুছে যায়
    document.body.appendChild(el); refresh();
  }
})();

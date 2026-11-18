// অ্যাডমিন: "📁 ফোল্ডার" (🎁 পুরস্কার ট্যাবের ভেতরের দ্বিতীয় অংশ; admin-prize.js এটাকে window.MCF.open(...) দিয়ে খোলে)।
// অটো ফোল্ডার ৪টা (নিজে তৈরি, মোছা/নাম বদলানো যায় না): "👥 সব ইউজার" (mc2_scores থেকে — শুধু যারা খেলেছে; অর্থ বদলায়নি), "🎁 ফর্ম জমা" (contest_entries থেকে — আগের ফর্মের সব ডেটা এখানেই), "🎮 খেলেছে" (mc2_scores-এ অন্তত একটা খেলা) ও "🎮🎁 খেলেছে + ফর্ম জমা" (দুটোই করেছে; নাম/ডিভাইস মিলিয়ে)।
// ইউজারের অবস্থা ৪টা (✅ ভেরিফাইড | ❔ নন-ভেরিফাইড | 🚫 বাদ | 📵 সাড়া পাওয়া যায়নি) — একটাই কম্পোনেন্ট window.MCFL; admin-prize.js ও admin-lottery.js-ও এটাই ব্যবহার করে। 📵-এর জন্য SQL: supabase-new-20261018k.sql।
// কাস্টম ফোল্ডার: বানানো, নাম বদলানো, মোছা (মুছলে শুধু ফোল্ডার যায়, ইউজার নয়)। যেকোনো ফোল্ডার থেকে কপি; কাস্টম ফোল্ডার থেকে মুভও। হাতে নাম লিখে (কমা দিয়ে অনেক) যোগ করা যায়, বাছা ইউজারের সাথে একসাথে।
// প্রতিটা ফোল্ডারে একই ফিল্টার: বিভাগ, সেশন, তারিখ (আজ/গতকাল/এই সপ্তাহ/এই মাস/কাস্টম), স্কোর, নাম খোঁজা। ফিল্টারের পুরো ফল এক চাপে সিলেক্ট করা যায়।
// ২০২৬-১২-২১: বিভাগ/সেশন/অবস্থা ফিল্টারে একাধিক টিক (পুরোনো সেভ-করা স্মার্ট ফোল্ডারের একক মানও চলে)। নতুন "🔎 ইউজার খুঁজে যোগ করুন": সার্ভারে সার্চ (ভিউ mc2_cards_adm; না থাকলে mc2_cards), ৩০টা করে লোড, ধরন/বিভাগ/সেশন/ক্লাব একাধিক-বাছা + তারিখ + নাম, বাছা ইউজার ফোল্ডারে যোগ। নতুন SQL নেই।
// ধাপ ২-খ: ✨ স্মার্ট ফোল্ডার (সেভ করা ফিল্টার), 📊 গ্রুপ ভিউ (+ প্রতিটা আলাদা ফোল্ডার), ⬇ CSV, ↩ আনডু (মুভ/মোছা), 🏆 বিজয়ী ফোল্ডারে লটারির রেকর্ড ও "সাড়া দেয়নি" বোতাম। SQL: supabase-new-20261018i.sql।
// "ইউজার" = ডিভাইস + নামের জুটি। SQL: supabase-new-20261018g.sql (একবার চালাতে হয়)। এই ফাইল না থাকলে 🎁 পুরস্কার ট্যাব আগের মতোই চলে।
(function () {
  var M = null, ROOT = null, LAST = [], BUSY = false;
  var AUTO = [{ id: "all", name: "👥 সব ইউজার" }, { id: "form", name: "🎁 ফর্ম জমা" }, { id: "played", name: "🎮 খেলেছে" }, { id: "both", name: "🎮🎁 খেলেছে + ফর্ম জমা" }];
  var LIM = 30;
  var ST = { USERS: [], UMAP: {}, NU: {}, FORMS: [], FMAP: {}, FL: {}, FOLD: [], MEM: [], noSql: "", cur: "all", sel: {}, shown: LIM, msg: "", bad: false, ren: false, mk: false, names: "", tgt: "", nn: "", undo: [], op: {}, grp: false, gby: "day", sm: false, GR: [], tn: 3 };
  var F0 = function () { return { dept: [], batch: [], per: "all", from: "", to: "", min: "", max: "", q: "", st: [], bg: "", bgm: "all" }; };
  var F = F0();
  // 🔎 "ইউজার খুঁজে যোগ করুন" — সার্ভার-সার্চ (mc2_cards_adm ভিউ; না থাকলে mc2_cards), ৩০টা করে লোড, একাধিক-বাছা ফিল্টার
  var SR = { open: false, f: { kind: [], dept: [], batch: [], club: [], per: "all", from: "", to: "", q: "" }, rows: [], total: null, off: 0, sel: {}, busy: false, err: "", info: "", notice: "", src: "mc2_cards_adm", fell: false, clubs: null, seq: 0, t: 0, ran: false, PG: 30, CAP: 5000 };
  var KL = [["male", "ছাত্র"], ["female", "ছাত্রী"], ["sir", "স্যার"], ["mam", "ম্যাম"], ["visitor", "ভিজিটর"]], KLB = {}; KL.forEach(function (x) { KLB[x[0]] = x[1]; });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M ? M.esc(t) : String(t == null ? "" : t); };
  var $ = function (s) { return ROOT ? ROOT.querySelector(s) : null; };
  var norm = function (n) { return String(n == null ? "" : n).trim().replace(/\s+/g, " ").toLowerCase(); };
  var ukey = function (dev, name) { return dev ? "u:" + dev + "|" + norm(name) : "n:" + norm(name); };
  var fkey = function (dev, name) { return dev ? "d:" + dev : "n:" + String(name || "").trim().toLowerCase(); }; // 🎁 ট্যাবের ✅/⛔ ফ্ল্যাগের চাবির নিয়ম (mc2_flag_all)
  var deptL = function (d) { var D = window.MC || {}; return D.deptLabel ? D.deptLabel(d || "") : (d || ""); };
  var flagOf = function (u) { return ST.FL[fkey(u.device, u.name)] || ""; };           // "ok" | "no" | "ex" | "nr" | ""
  var FLN = { ok: "✅ ভেরিফাইড", no: "❔ নন-ভেরিফাইড", ex: "🚫 বাদ", nr: "📵 সাড়া পাওয়া যায়নি" };
  var FL4 = [["ok", FLN.ok], ["no", FLN.no], ["ex", FLN.ex], ["nr", FLN.nr]];
  // ---------- ইউজারের অবস্থা: একটাই কম্পোনেন্ট (window.MCFL) ----------
  // ctl(চাবি, বর্তমান) = বাছার তালিকা (বাছলেই সঙ্গে সঙ্গে সেভ, OK বাটন নেই); set(চাবিগুলো, মান) = একজন/অনেকজনের একসাথে; "বাদ" ও "সাড়া পাওয়া যায়নি" দুটোই লটারি-পুল থেকে বাদ (out)।
  var FLS = [], FLH = [], esc0 = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var MCFL = window.MCFL = {
    N: FLN, list: FL4,
    reg: function (fn) { FLS.push(fn); },   // প্রতিটা ফাইল নিজের অবস্থা-ম্যাপ জমা রাখে; সেভের পর সবগুলো একসাথে বদলায়
    on: function (fn) { FLH.push(fn); },    // সেভের পর নিজের তালিকা আবার আঁকার জন্য
    get: function (k) { for (var i = 0; i < FLS.length; i++) { var m = FLS[i](); if (m && m[k]) return m[k]; } return ""; },
    out: function (v) { return v === "ex" || v === "nr"; },
    tag: function (v) { return v && FLN[v] ? ' <span class="tag">' + FLN[v] + "</span>" : ""; },
    ctl: function (k, v) {
      return '<select class="mfs" data-fls="' + esc0(k) + '" aria-label="অবস্থা"><option value="">— অবস্থা: ফ্ল্যাগ নেই —</option>' + FL4.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
    },
    set: function (keys, v) {
      var M0 = window.MCA, seen = {}, L = keys.filter(function (k) { if (!k || seen[k]) return false; seen[k] = 1; return true; });
      return L.reduce(function (p, k) { return p.then(function () { return M0.rpc("mc2_flag_set", { p_k: k, p_st: v }).then(function () { FLS.forEach(function (fn) { var m = fn(); if (m) { if (v) m[k] = v; else delete m[k]; } }); }); }); }, Promise.resolve())
        .catch(function (e) { var t = String(e && e.message || e); throw new Error(v === "nr" && /status|check|constraint|violat/i.test(t) ? "📵 সাড়া পাওয়া যায়নি রাখতে নতুন SQL লাগবে: Supabase SQL Editor-এ supabase-new-20261018k.sql একবার চালান।" : t); })
        .then(function () { FLH.forEach(function (fn) { try { fn(L, v); } catch (er) {} }); return L.length; });
    }
  };
  document.addEventListener("change", function (e) { // যেকোনো জায়গার অবস্থা-তালিকা বাছলেই সঙ্গে সঙ্গে সেভ
    var sl = e.target && e.target.closest && e.target.closest("select[data-fls]"); if (!sl) return;
    var k = sl.dataset.fls, was = MCFL.get(k), v = sl.value; sl.disabled = true;
    MCFL.set([k], v).then(function () { sl.disabled = false; }).catch(function (er) { sl.disabled = false; sl.value = was; (window.MCA && window.MCA.fail ? window.MCA.fail : alert)(er); });
  });
  MCFL.reg(function () { return ST.FL; });
  MCFL.on(function () { if (ROOT && ROOT.isConnected && $("#mfl")) paintList(); });
  var safeUrl = function (u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; };
  var subsOf = function (u) { var f = ST.FMAP[u.key]; return (f && f.subs) || u.subs || []; };   // এই ইউজারের সব ফর্ম-জমা
  // ইউজার আইডি: SQL-এর mc2_uid()-এর হুবহু একই হিসাব ('U' + md5('mc2|' + ডিভাইস আইডি)-এর প্রথম ৭ অক্ষর, বড় হাতের) — তাই User Info ট্যাবের আইডির সাথে মেলে
  function md5(str) {
    var b = unescape(encodeURIComponent(str)), n = b.length, w = [], i, j;
    for (i = 0; i < n; i++) w[i >> 2] = (w[i >> 2] || 0) | (b.charCodeAt(i) << ((i % 4) * 8));
    w[n >> 2] = (w[n >> 2] || 0) | (0x80 << ((n % 4) * 8)); var L = (((n + 8) >> 6) + 1) * 16; for (i = 0; i < L; i++) w[i] = w[i] || 0; w[L - 2] = n * 8;
    var K = [], R = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    for (i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    var a0 = 1732584193, b0 = -271733879, c0 = -1732584194, d0 = 271733878, rl = function (x, c) { return (x << c) | (x >>> (32 - c)); };
    for (j = 0; j < L; j += 16) {
      var A = a0, B = b0, C = c0, D = d0, F, g, t;
      for (i = 0; i < 64; i++) {
        if (i < 16) { F = (B & C) | (~B & D); g = i; } else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; } else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; } else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        t = D; D = C; C = B; B = (B + rl((A + F + K[i] + w[j + g]) | 0, R[(i >> 4) * 4 + (i % 4)])) | 0; A = t;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return [a0, b0, c0, d0].map(function (x) { var h = ""; for (var k = 0; k < 4; k++) h += ("0" + ((x >>> (k * 8)) & 255).toString(16)).slice(-2); return h; }).join("");
  }
  var UIDC = {};
  var uidOf = function (u) { var d = u && u.device; if (!d) return ""; return UIDC[d] || (UIDC[d] = "U" + md5("mc2|" + d).slice(0, 7).toUpperCase()); };
  var isAuto = function (id) { return AUTO.some(function (a) { return a.id === id; }); };

  var st = document.createElement("style");
  st.textContent = ".mfc{display:inline-block;border:1px solid var(--bd);border-radius:999px;padding:6px 12px;margin:0 6px 6px 0;font-weight:600;cursor:pointer;background:var(--card);color:var(--fg)}" +
    ".mfc.on{background:var(--g);color:#fff;border-color:var(--g)}.mfc.add{border-style:dashed}" +
    ".mfr{display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--bd)}.mfr:first-child{border-top:0}.mfr input[type=checkbox]{width:auto;margin-top:5px;flex:none}.mfb{min-width:0;flex:1;display:grid;gap:3px;overflow-wrap:anywhere}" +
    ".mfa{background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:10px;display:grid;gap:8px;margin:10px 0}.mfm{font-size:14px;border-radius:10px;padding:8px 10px}.mfm.ok{background:#e6f1ea;color:#10261b}.mfm.bad{background:#fdecef;color:#b3261e}" +
    ".mfs{width:auto;max-width:100%;padding:5px 8px;border-radius:10px;font-weight:600}.row[hidden]{display:none}" + ".mfh{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.mfh b{font-size:17px}" +
    ".mfdw{min-width:0}.mfd{border:1px solid var(--bd);border-radius:10px;background:var(--card);color:var(--fg)}.mfd summary{padding:8px 10px;cursor:pointer;font-weight:600;overflow-wrap:anywhere}.mfd .mfdl{max-height:220px;overflow:auto;display:grid;gap:2px;padding:4px 10px 8px;border-top:1px solid var(--bd)}.mfd .mfdl label{display:flex;gap:8px;align-items:center;padding:4px 0;font-weight:400}.mfd .mfdl input[type=checkbox]{width:auto;flex:none;margin:0}";
  document.head.appendChild(st);

  // ---------- তথ্য লোড ----------
  function pageAll(path, max) {
    var out = [];
    return (function loop(off) {
      return M.A(path + (path.indexOf("?") < 0 ? "?" : "&") + "limit=1000&offset=" + off).then(function (L) {
        out = out.concat(L || []); return L && L.length === 1000 && out.length < max ? loop(off + 1000) : out;
      });
    })(0);
  }
  function build(scores, entries) {
    var U = {}, order = [], byDev = {}, byName = {};
    scores.forEach(function (s) { // নতুন আগে সাজানো: প্রথমবার যা দেখা যায় সেটাই শেষ খেলা (বিভাগ/সেশন/সময় ওখান থেকে), স্কোর সেরাটা
      var nm = String(s.name || "").trim(), k = ukey(s.device, nm), u = U[k];
      if (!u) { u = U[k] = { key: k, device: s.device || "", name: nm, dept: s.dept || "", batch: s.batch || "", score: s.score, at: s.created_at, plays: 0, src: "all", pl: [] }; order.push(u); }
      u.plays++; u.pl.push([s.score, s.created_at]); if (s.score > u.score) u.score = s.score;   // pl = প্রতিটা খেলার [স্কোর, সময়] — সেরা-N বাছায় তারিখ-ফিল্টারের ভেতরের সেরা স্কোর ধরার জন্য
    });
    var dc = {}, nc = {};
    order.forEach(function (u) { if (u.device) { dc[u.device] = (dc[u.device] || 0) + 1; byDev[u.device] = u; } var n = norm(u.name); nc[n] = (nc[n] || 0) + 1; byName[n] = u; });
    var FM = {}, forms = [];
    entries.forEach(function (e) { // নতুন আগে
      var nm = String(e.name || "").trim(), dev = e.device || "", m = null;
      if (dev) m = U[ukey(dev, nm)] || (dc[dev] === 1 ? byDev[dev] : null);   // ডিভাইসে একজনই থাকলে তবেই মেলাই
      else m = nc[norm(nm)] === 1 ? byName[norm(nm)] : null;                  // ডিভাইস নেই: নামে একজনই থাকলে তবেই মেলাই
      var device = dev || (m ? m.device : ""), k = m ? m.key : ukey(device, nm), f = FM[k];
      if (!f) {
        f = FM[k] = { key: k, device: device, name: m ? m.name : nm, dept: m ? m.dept : "", batch: m ? m.batch : "", score: m ? m.score : (e.score != null ? e.score : (e.pct != null ? e.pct * 10 : null)), at: e.created_at, entries: 0, contact: "", fb: e.fb_link || "", src: "form", subs: [] };
        forms.push(f);
      }
      f.entries++; f.subs.push(e); if (!f.contact && e.contact) f.contact = e.contact;
    });
    ST.NU = {}; order.forEach(function (u) { if (nc[norm(u.name)] === 1) ST.NU[norm(u.name)] = u; });
    ST.USERS = order; ST.UMAP = U; ST.FORMS = forms; ST.FMAP = FM;
  }
  function loadFolders() {
    return Promise.all([M.A("mc2_ufolders?select=*&order=created_at.asc,id.asc"), pageAll("mc2_ufolder_members?select=*&order=added_at.desc,id.desc", 200000)]).then(function (r) { ST.FOLD = r[0] || []; ST.MEM = r[1] || []; ST.noSql = ""; })
      .catch(function (e) { ST.FOLD = []; ST.MEM = []; ST.noSql = String(e && e.message || e).slice(0, 160); });
  }
  function load() {
    return Promise.all([
      pageAll("mc2_scores?select=device,name,dept,batch,score,created_at&order=created_at.desc", 30000),
      pageAll("contest_entries?select=*&order=created_at.desc", 10000).catch(function () { return []; }),
      M.rpc("mc2_flag_all").catch(function () { return {}; }), loadFolders(), window.MCBG ? MCBG.load() : Promise.resolve()
    ]).then(function (r) { ST.FL = r[2] || {}; build(r[0], r[1]); if (!isAuto(ST.cur) && !folder(ST.cur)) ST.cur = "all"; });
  }

  // ---------- ফোল্ডার ও ইউজার ----------
  function folder(id) { return ST.FOLD.filter(function (f) { return String(f.id) === String(id); })[0] || null; }
  function members(fid) { return ST.MEM.filter(function (m) { return String(m.folder_id) === String(fid); }); }
  function curName() { return isAuto(ST.cur) ? AUTO.filter(function (a) { return a.id === ST.cur; })[0].name : (folder(ST.cur) || {}).name || ""; }
  function usersOf(id) { // কোনো ফোল্ডারের ইউজার-তালিকা (সাইটের সর্বশেষ তথ্যের সাথে মিলিয়ে)
    if (id === "all" || id === "played") return ST.USERS;   // "সব ইউজার" = যারা খেলেছে (mc2_scores); "খেলেছে" আলাদা ফোল্ডার, এখন একই লোক
    if (id === "form") return ST.FORMS;
    if (id === "both") return ST.FORMS.filter(function (f) { return !!ST.UMAP[f.key]; });   // খেলেছে এবং ফর্মও দিয়েছে (MCF.info-র নিয়ম)
    var sf = folder(id); if (sf && sf.kind === "smart") { var fl = sf.filter || {}; return filt(String(fl.base) === String(id) ? [] : usersOf(String(fl.base == null ? "all" : fl.base)), Object.assign(F0(), fl.f || {})); } // ✨ স্মার্ট: প্রতিবার নতুন করে হিসাব
    return members(id).map(function (m) {
      var l = ST.UMAP[m.ukey] || ST.FMAP[m.ukey], fm = ST.FMAP[m.ukey];
      return { key: m.ukey, mid: m.id, device: (l && l.device) || m.device || "", name: l ? l.name : m.name, dept: l ? l.dept : (m.dept || ""), batch: l ? l.batch : (m.batch || ""), score: l ? l.score : (m.score == null ? null : m.score),
        at: l ? l.at : (m.at || m.added_at), src: m.src, manual: m.src === "manual", entries: fm ? fm.entries : 0, contact: fm ? fm.contact : "", fb: fm ? fm.fb : "" };
    });
  }
  function curUsers() { return usersOf(ST.cur); }
  var ico = function (f) { return f && f.kind === "winners" ? "🏆 " : f && f.kind === "smart" ? "✨ " : "📁 "; };
  var kindOf = function (id) { return (folder(id) || {}).kind || ""; };
  var isRO = function (id) { return isAuto(id) || kindOf(id) === "smart"; };   // শুধু কপি করা যায় (মুভ নয়)
  function count(id) { return isAuto(id) || kindOf(id) === "smart" ? usersOf(id).length : members(id).length; }
  var MON = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  var pad2 = function (n) { return ("0" + n).slice(-2); }, ymd = function (d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
  var strip = function (n) { return String(n || "").replace(/^[^\p{L}\p{N}]+/u, ""); };
  var rowBody = function (m) { return { folder_id: m.folder_id, ukey: m.ukey, name: m.name, device: m.device || null, dept: m.dept || null, batch: m.batch || null, score: m.score == null ? null : m.score, src: m.src || "all", at: m.at || null }; };
  function uniq(L, k) { var o = {}, none = false; L.forEach(function (u) { if (u[k]) o[u[k]] = 1; else none = true; }); return { list: Object.keys(o).sort(function (a, b) { return a.localeCompare(b, "bn"); }), none: none }; }

  // ---------- ফিল্টার ----------
  function inPer(ts, FF) {
    FF = FF || F; if (FF.per === "all") return true;
    var t = new Date(ts).getTime(); if (isNaN(t)) return false;
    var d = new Date(); d.setHours(0, 0, 0, 0); var t0 = d.getTime(), day = 864e5;
    if (FF.per === "today") return t >= t0;
    if (FF.per === "yest") return t >= t0 - day && t < t0;
    if (FF.per === "week") return t >= t0 - ((d.getDay() + 1) % 7) * day;   // সপ্তাহ শুরু শনিবার
    if (FF.per === "month") return t >= new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    if (FF.per === "range") { if (FF.from && t < new Date(FF.from + "T00:00:00").getTime()) return false; if (FF.to && t >= new Date(FF.to + "T00:00:00").getTime() + day) return false; }
    return true;
  }
  function filt(L, FF) {
    FF = FF || F; var q = norm(FF.q), mn = FF.min === "" ? null : +FF.min, mx = FF.max === "" ? null : +FF.max, dS = msArr(FF.dept), bS = msArr(FF.batch), sS = msArr(FF.st);
    return L.filter(function (u) {
      if (dS.length && !dS.some(function (v) { return v === "__none" ? !u.dept : u.dept === v; })) return false;
      if (bS.length && !bS.some(function (v) { return v === "__none" ? !u.batch : u.batch === v; })) return false;
      if (sS.length && !sS.some(function (v) { return flagOf(u) === (v === "none" ? "" : v); })) return false;
      if (window.MCBG && !MCBG.gmatch(fkey(u.device, u.name))) return false;   // 🏅 সব-জায়গার বেইজ ফিল্টার (ভাসমান বাটন)
      if (FF.bg && window.MCBG && !MCBG.match(fkey(u.device, u.name), FF.bg, FF.bgm)) return false;
      if (!inPer(u.at, FF)) return false;
      if (mn != null && (u.score == null || u.score < mn)) return false;
      if (mx != null && (u.score == null || u.score > mx)) return false;
      if (q && norm(u.name).indexOf(q) < 0 && uidOf(u).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }
  function opt(v, t, cur) { return '<option value="' + E(v) + '"' + (String(cur) === String(v) ? " selected" : "") + ">" + E(t) + "</option>"; }

  // ---------- আঁকা ----------
  function paint() {
    var L = curUsers(), auto = isAuto(ST.cur), f = auto ? null : folder(ST.cur), smart = !!(f && f.kind === "smart"), ro = auto || smart, D = uniq(L, "dept"), B = uniq(L, "batch");
    var chips = AUTO.map(function (a) { return '<button type="button" class="mfc' + (ST.cur === a.id ? " on" : "") + '" data-fo="' + a.id + '">' + E(a.name) + " (" + bd(count(a.id)) + ")</button>"; }).join("") +
      ST.FOLD.map(function (x) { return '<button type="button" class="mfc' + (String(ST.cur) === String(x.id) ? " on" : "") + '" data-fo="' + x.id + '">' + ico(x) + E(x.name) + " (" + bd(count(x.id)) + ")</button>"; }).join("") +
      '<button type="button" class="mfc add" data-a="mk">➕ নতুন ফোল্ডার</button>';
    var h = (ST.noSql ? '<div class="mfm bad">⚠️ ফোল্ডারের টেবিল পাওয়া যায়নি। Supabase SQL Editor-এ <b>supabase-new-20261018g.sql</b> একবার চালান। (অটো ফোল্ডার দেখা যাচ্ছে, কিন্তু কাস্টম ফোল্ডার বানানো/কপি/মুভ চলবে না।)<br><span class="sm">' + E(ST.noSql) + "</span></div>" : "") +
      "<div>" + chips + "</div>" + (window.MCBG ? MCBG.mgrBar() : "") +
      (ST.undo.length ? '<div class="mfm ok">↩ ' + E(ST.undo[ST.undo.length - 1].label) + ' <button type="button" class="s" data-a="undo">আনডু</button></div>' : "") +
      (ST.mk ? '<div class="mfa"><label>নতুন ফোল্ডারের নাম<input id="mkn" maxlength="80" placeholder="যেমন: পদার্থবিজ্ঞান · সপ্তাহ ৪২"></label><div class="act"><button type="button" data-a="mkgo">📁 বানান</button><button type="button" class="l" data-a="mkx">বাতিল</button></div></div>' : "");
    h += '<div class="c" style="margin-top:6px"><div class="mfh">' + (ST.ren ? '<label style="flex:1 1 220px">নতুন নাম<input id="rnn" maxlength="80" value="' + E(curName()) + '"></label><div class="act"><button type="button" class="s" data-a="rensave">💾 সেভ</button><button type="button" class="l s" data-a="renx">বাতিল</button></div>' :
      "<b>" + E(curName()) + "</b>" + (auto ? "" : '<div class="act"><button type="button" class="l s" data-a="ren">✏️ নাম বদলান</button><button type="button" class="d s" data-a="del">🗑 ফোল্ডার মুছুন</button></div>')) + "</div>" +
      '<p class="sm">' + (auto ? "অটো ফোল্ডার — নাম বদলানো বা মোছা যায় না। এখান থেকে শুধু কপি হবে; ইউজার মূল ফোল্ডারেই থাকবে।" : smart ? "✨ স্মার্ট ফোল্ডার — সেভ করা ফিল্টার (" + E(filterDesc((f.filter || {}).f || {})) + "); নতুন লোক এলে নিজে ঢোকে। এখান থেকে শুধু কপি হবে।" : f.kind === "winners" ? "🏆 বিজয়ী ফোল্ডার — কপি ও মুভ দুটোই চলে। ফোল্ডার মুছলে শুধু ফোল্ডার যাবে, ইউজার যাবে না।" : "কাস্টম ফোল্ডার — কপি ও মুভ দুটোই চলে। ফোল্ডার মুছলে শুধু ফোল্ডার যাবে, ইউজার যাবে না।") + " তারিখ মানে শেষ খেলা/ফর্ম জমার সময়।</p>" + recBlock(f);
    h += '<div class="row" id="mff">' +
      '<div class="mfdw">' + msUi("m:dept", "বিভাগ", D.list.map(function (x) { return [x, deptL(x)]; }).concat(D.none ? [["__none", "(বিভাগ নেই)"]] : []), F.dept) + "</div>" +
      '<div class="mfdw">' + msUi("m:batch", "সেশন", B.list.map(function (x) { return [x, x]; }).concat(B.none ? [["__none", "(সেশন নেই)"]] : []), F.batch) + "</div>" +
      '<label>তারিখ<select data-f="per">' + [["all", "সব সময়"], ["today", "আজ"], ["yest", "গতকাল"], ["week", "এই সপ্তাহ"], ["month", "এই মাস"], ["range", "কাস্টম তারিখ"]].map(function (o) { return opt(o[0], o[1], F.per); }).join("") + "</select></label>" +
      '<div class="mfdw">' + msUi("m:st", "অবস্থা", FL4.concat([["none", "— ফ্ল্যাগ নেই"]]), F.st) + "</div>" +
      (window.MCBG && MCBG.ok() ? MCBG.filterUi(F.bg, F.bgm) : "") +
      '<label>স্কোর থেকে<input data-f="min" type="number" min="0" max="1000" value="' + E(F.min) + '" placeholder="০"></label><label>স্কোর পর্যন্ত<input data-f="max" type="number" min="0" max="1000" value="' + E(F.max) + '" placeholder="১০০০"></label>' +
      '<label>নাম / আইডি খুঁজুন<input data-f="q" type="search" maxlength="60" value="' + E(F.q) + '" placeholder="🔎 নাম বা আইডি"></label></div>' +
      '<div class="row" id="mfg"' + (F.per === "range" ? "" : " hidden") + ' style="margin-top:6px"><label>থেকে<input data-f="from" type="date" value="' + E(F.from) + '"></label><label>পর্যন্ত<input data-f="to" type="date" value="' + E(F.to) + '"></label></div>' +
      '<div class="act" style="margin-top:8px"><button type="button" class="l s" data-a="freset">↺ ফিল্টার মুছুন</button><button type="button" class="s" data-a="selall" id="mfsa"></button><button type="button" class="l s" data-a="selclr">✖ বাছা মুছুন</button></div>' +
      '<div class="act" style="margin-top:6px"><span class="sm">বাছাদের অবস্থা:</span><button type="button" class="s" data-a="fbulk" data-v="ok">✅ ভেরিফাইড</button><button type="button" class="l s" data-a="fbulk" data-v="no">❔ নন-ভেরিফাইড</button><button type="button" class="d s" data-a="fbulk" data-v="ex">🚫 বাদ</button><button type="button" class="l s" data-a="fbulk" data-v="nr">📵 সাড়া পাওয়া যায়নি</button><button type="button" class="l s" data-a="fbulk" data-v="">↺ মুছুন</button></div>' + (window.MCBG ? MCBG.bulkBar() : "") +
      '<div class="act" style="margin-top:6px;align-items:center"><span class="sm">🏅 সেরা</span><input id="mftn" type="number" min="1" max="1000" value="' + E(ST.tn) + '" style="width:76px" aria-label="কতজন"><span class="sm">জন:</span><button type="button" class="s" data-a="topall">সব মিলিয়ে সেরা</button><button type="button" class="s" data-a="topdept">প্রতি বিভাগের সেরা</button></div>' +
      '<div class="act" style="margin-top:6px"><button type="button" class="s" data-a="fxl">📗 Excel</button><button type="button" class="s" data-a="fxjpg">🖼 তালিকা JPG</button><button type="button" class="s" data-a="fxpng">🖼 তালিকা PNG</button><button type="button" class="s" data-a="fxpdf">📄 তালিকা PDF</button><button type="button" class="s" data-a="fjpg">🪪 কার্ড JPG</button><button type="button" class="s" data-a="fzip">📦 ZIP</button><button type="button" class="l s" data-a="csv">⬇ CSV ডাউনলোড</button><button type="button" class="l s" data-a="grp">📊 গ্রুপ ভিউ' + (ST.grp ? " ✔" : "") + "</button>" +
      (smart ? '<button type="button" class="l s" data-a="smupd">💾 এখনকার ফিল্টার দিয়ে আপডেট</button>' : '<button type="button" class="l s" data-a="sm">✨ ফিল্টার সেভ করে স্মার্ট ফোল্ডার</button>') + "</div>" +
      (ST.sm ? '<div class="mfa"><label>স্মার্ট ফোল্ডারের নাম<input id="smn" maxlength="80" placeholder="যেমন: পদার্থবিজ্ঞান + এই সপ্তাহ"></label><div class="sm">এখনকার ফিল্টারটাই সেভ হবে (' + E(filterDesc(F)) + ") — নতুন লোক এলে নিজে ঢুকবে।</div><div class=\"act\"><button type=\"button\" data-a=\"smgo\">✨ সেভ</button><button type=\"button\" class=\"l\" data-a=\"smx\">বাতিল</button></div></div>" : "") +
      '<div id="mfgv"></div><p class="sm" id="mfc"></p>';
    // কপি / মুভ / হাতে নাম
    var tv0 = ST.tgt || (ro ? "" : String(ST.cur)), tgt = ST.FOLD.filter(function (x) { return x.kind !== "smart"; }).map(function (x) { return opt(x.id, ico(x) + x.name, tv0); }).join("");
    h += '<div class="mfa"><b id="mfk"></b><label>কোন ফোল্ডারে<select id="mft">' + opt("", "— ফোল্ডার বেছে নিন —", tv0) + tgt + opt("__new", "➕ নতুন ফোল্ডার…", tv0) + '</select></label>' +
      '<input id="mfn" maxlength="80" placeholder="নতুন ফোল্ডারের নাম" value="' + E(ST.nn) + '"' + (tv0 === "__new" ? "" : " hidden") + ">" +
      '<label>হাতে নাম লিখুন (কমা দিয়ে একসাথে অনেক নাম)<textarea id="mfx" rows="2" placeholder="রাহুল আহমেদ, করিম, সুমি">' + E(ST.names) + "</textarea></label>" +
      '<div class="act"><button type="button" class="l" data-a="sropen">' + (SR.open ? "🔎 ইউজার খুঁজে যোগ করুন ▲" : "🔎 ইউজার খুঁজে যোগ করুন ▼") + '</button></div><div id="mfs"></div><div class="act"><button type="button" data-a="cp">📋 কপি</button>' + (ro ? "" : '<button type="button" class="l" data-a="mv">✂️ মুভ</button>') + "</div>" +
      '<div class="sm">বাছা ইউজার আর লেখা নাম — দুটোই একসাথে যোগ হবে।' + (ro ? " এই ফোল্ডার থেকে শুধু কপি হয়।" : " মুভ করলে বাছা ইউজার এই ফোল্ডার থেকে সরে গিয়ে নতুন ফোল্ডারে যাবে; লেখা নাম শুধু যোগ হবে।") + '</div><div id="mfmsg">' + (ST.msg ? '<div class="mfm ' + (ST.bad ? "bad" : "ok") + '">' + E(ST.msg) + "</div>" : "") + "</div></div>";
    h += '<div id="mfl"></div></div>';
    ROOT.innerHTML = h; ST.msg = ""; paintList(); srPaint();
  }
  function detail(u) { // 📄 সব তথ্য: ফর্মের প্রতিটা জমা (ফেসবুক লিংক + স্ক্রিনশট লিংক সহ)
    var L = subsOf(u), fl = flagOf(u), th = "max-width:130px;max-height:130px;border-radius:8px;border:1px solid var(--bd);display:block;margin-top:4px";
    var head = '<div class="sm">' + E([uidOf(u) ? "🆔 " + uidOf(u) : "", deptL(u.dept) || "—", u.batch || "—", "স্কোর " + bd(u.score == null ? "—" : u.score), fl ? FLN[fl] : "ফ্ল্যাগ দেওয়া হয়নি", u.contact ? "📞 " + u.contact : ""].filter(Boolean).join(" · ")) + "</div>";
    var body = L.length ? L.map(function (e, i) {
      var fb = safeUrl(e.fb_link), sh = safeUrl(e.shot_url);
      return '<div class="mfr" style="padding:6px 0"><div class="mfb"><div><b>#' + bd(i + 1) + "</b> · " + E(e.created_at ? M.tm(e.created_at) : "—") + (e.pct != null ? " · " + bd(e.pct) + " শতাংশ" : "") + "</div>" +
        "<div>📞 " + E(e.contact || "—") + "</div>" +
        '<div>🔗 ' + (fb ? '<a href="' + E(fb) + '" target="_blank" rel="noopener">ফেসবুক পোস্ট খুলুন</a><div class="sm">' + E(fb) + "</div>" : "—") + "</div>" +
        '<div>🖼 ' + (sh ? '<a href="' + E(sh) + '" target="_blank" rel="noopener">স্ক্রিনশট খুলুন</a><div class="sm">' + E(sh) + '</div><a href="' + E(sh) + '" target="_blank" rel="noopener"><img src="' + E(sh) + '" alt="স্ক্রিনশট" loading="lazy" style="' + th + '"></a>' : "—") + "</div>" +
        (e.ip || e.ua ? '<div class="sm">আইপি: ' + E(e.ip || "—") + " · " + E(String(e.ua || "").slice(0, 90)) + "</div>" : "") + "</div></div>";
    }).join("") : '<p class="sm">এই ইউজারের কোনো ফর্ম জমা পাওয়া যায়নি।</p>';
    return '<div class="mfa"><b>📄 ' + E(u.name) + " — সব তথ্য (" + bd(L.length) + "টি জমা)</b>" + head + body + (u.device ? '<div class="act"><button class="l s" type="button" data-uu="' + E(u.device) + '">👤 ইউজারের পুরো ইনফো</button></div>' : "") + "</div>";
  }
  function row(u) {
    var fl = flagOf(u), ft = fl ? '<span class="tag">' + FLN[fl] + "</span> " : "", bk = fkey(u.device, u.name), bg = window.MCBG ? MCBG.chips(bk) : "";
    var nm = u.device ? '<button class="lk" type="button" data-uu="' + E(u.device) + '">' + E(u.name) + "</button>" : "<b>" + E(u.name) + "</b>";
    var info = [u.at ? M.tm(u.at) : ""], nsub = subsOf(u).length, open = !!ST.op[u.key];
    if (u.entries) info.push(bd(u.entries) + "টি ফর্ম জমা");
    if (u.contact) info.push("📞 " + u.contact);
    return '<div class="mfr"><input type="checkbox" data-k="' + E(u.key) + '"' + (ST.sel[u.key] ? " checked" : "") + ' aria-label="বাছুন"><div class="mfb"><div>' + nm + " " + ft + bg + ' <span class="tag">' + E(deptL(u.dept) || "—") + '</span><span class="tag">' + E(u.batch || "—") + '</span><span class="tag">স্কোর ' + bd(u.score == null ? "—" : u.score) + "</span>" + (uidOf(u) ? '<span class="tag">🆔 ' + uidOf(u) + "</span>" : "") +
      (u.manual ? '<span class="tag">✍️ হাতে লেখা</span>' : "") + '</div><div class="sm">' + E(info.filter(Boolean).join(" · ")) + (u.fb ? ' · <a href="' + E(safeUrl(u.fb)) + '" target="_blank" rel="noopener">ফেসবুক পোস্ট</a>' : "") + "</div>" +
      '<div class="act">' + (nsub ? '<button type="button" class="s' + (open ? "" : " l") + '" data-a="det" data-k="' + E(u.key) + '">📄 সব তথ্য' + (open ? " ▲" : " ▼") + "</button>" : "") + (window.MCBG ? '<button type="button" class="s' + (MCBG.isOpen(bk) ? "" : " l") + '" data-bgo="' + E(bk) + '">🏅 বেইজ' + (MCBG.isOpen(bk) ? " ▲" : " ▼") + "</button>" : "") + MCFL.ctl(bk, fl) + "</div>" +
      (window.MCBG && MCBG.isOpen(bk) ? MCBG.panel(bk, fl) : "") +
      (open ? detail(u) : "") +
      (kindOf(ST.cur) === "winners" && u.mid && window.MCLOT && window.MCLOT.redraw ? '<div class="act"><button type="button" class="l s" data-a="cx" data-k="' + E(u.key) + '" data-m="' + u.mid + '">🚫 সাড়া দেয়নি — বাতিল, আরেকজন তুলুন</button></div>' : "") + "</div></div>";
  }
  function nsel() { return Object.keys(ST.sel).length; }
  function paintList() {
    var L = curUsers(), R = filt(L), vis = {}, k, n;
    R.forEach(function (u) { vis[u.key] = 1; }); for (k in ST.sel) if (!vis[k]) delete ST.sel[k]; // ফিল্টার বদলালে যেগুলো আর দেখা যায় না সেগুলো সিলেক্ট থেকে বাদ
    LAST = R; n = nsel(); paintGroups(R);
    $("#mfc").innerHTML = "দেখাচ্ছে <b>" + bd(R.length) + "</b> / " + bd(L.length) + " জন · বাছা <b>" + bd(n) + "</b> জন";
    $("#mfk").textContent = "📤 বাছা " + bd(n) + " জন + হাতে লেখা নাম";
    $("#mfsa").textContent = (R.length && n === R.length ? "☑ সব সিলেক্ট আছে" : "☑ ফলাফলের সব সিলেক্ট (" + bd(R.length) + ")");
    $("#mfl").innerHTML = R.slice((ST.shown = Math.min(ST.shown, Math.max(1, Math.ceil(R.length / LIM)) * LIM)) - LIM, ST.shown).map(row).join("") + (window.MCPG ? window.MCPG.html(ST.shown / LIM - 1, R.length, LIM, 'data-a="pgf" data-p') : "") +
      (R.length ? "" : '<p class="sm">' + (L.length ? "এই ফিল্টারে কেউ নেই।" : isAuto(ST.cur) ? "এখানে এখনো কেউ নেই।" : "এই ফোল্ডারে এখনো কেউ নেই। \"সব ইউজার\" বা \"ফর্ম জমা\" থেকে কপি করুন, বা উপরে নাম লিখে যোগ করুন।") + "</p>");
  }
  function say(t, bad) { var m = $("#mfmsg"); if (m) m.innerHTML = t ? '<div class="mfm ' + (bad ? "bad" : "ok") + '">' + E(t) + "</div>" : ""; }

  function perText(FF) { // তারিখ-ফিল্টারের নাম (সেরা-N বার্তায় কোন সময়ের স্কোর ধরা হয়েছে তা লেখার জন্য)
    var P = { today: "আজ", yest: "গতকাল", week: "এই সপ্তাহ", month: "এই মাস" };
    return FF.per === "range" ? "কাস্টম তারিখ (" + (FF.from ? bd(FF.from) : "…") + " থেকে " + (FF.to ? bd(FF.to) : "…") + ")" : (P[FF.per] || "সব সময়");
  }
  function filterDesc(FF) {
    var o = [], P = { today: "আজ", yest: "গতকাল", week: "এই সপ্তাহ", month: "এই মাস", range: "কাস্টম তারিখ" };
    if (msArr(FF.dept).length) o.push(msArr(FF.dept).map(function (x) { return x === "__none" ? "বিভাগ নেই" : deptL(x); }).join(" / ")); if (msArr(FF.batch).length) o.push(msArr(FF.batch).map(function (x) { return x === "__none" ? "সেশন নেই" : x; }).join(" / "));
    if (FF.per && FF.per !== "all") o.push(P[FF.per] + (FF.per === "range" ? " " + (FF.from || "…") + "–" + (FF.to || "…") : ""));
    if (FF.min !== "" && FF.min != null) o.push("স্কোর ≥ " + bd(FF.min)); if (FF.max !== "" && FF.max != null) o.push("স্কোর ≤ " + bd(FF.max)); if (msArr(FF.st).length) o.push(msArr(FF.st).map(function (x) { return x === "none" ? "ফ্ল্যাগ নেই" : FLN[x]; }).join(" / ")); if (FF.bg && window.MCBG) o.push(MCBG.desc(FF.bg, FF.bgm)); if (FF.q) o.push("খোঁজ: " + FF.q);
    return o.length ? o.join(" + ") : "কোনো ফিল্টার নেই";
  }
  function recBlock(f) { // 🏆 বিজয়ী ফোল্ডারের লটারি-রেকর্ড
    var m = f && f.kind === "winners" ? f.meta : null; if (!m || !m.at) return "";
    var src = (m.sources || []).map(function (s) { return E(s.name) + (s.this ? " ✔this" : ""); }).join(", "), c = [];
    if (m.thisNames) c.push('"this" টিক দেওয়া নাম ' + bd(m.thisNames) + " জন"); if (m.cv) c.push("শুধু ভেরিফাইড"); if (m.cmin) c.push("ন্যূনতম স্কোর " + bd(m.cmin)); if (m.cb) c.push("খেলেছে ও ফর্মও দিয়েছে");
    if (m.mode) c.push(m.mode === "folder" ? "প্রতি ফোল্ডার থেকে ১ জন" : "প্রতি বিভাগ থেকে ১ জন");
    return '<div class="mfa"><b>📋 লটারির রেকর্ড</b><div class="sm">' + E(M.tm(m.at)) + " · পুলে যোগ্য <b>" + bd(m.pool || 0) + "</b> জন" + (m.total != null ? " (বাছা ফোল্ডার ও নাম মিলিয়ে মোট " + bd(m.total) + " জন)" : "") + '</div><div class="sm">ফোল্ডার: ' + (src || "—") + (c.length ? " · " + E(c.join(", ")) : "") + (m.thisF && m.thisF.length ? " · this টিক: " + E(m.thisF.join(", ")) : "") + ((m.cancelled || []).length ? " · সাড়া না দেওয়ায় বাতিল: " + bd(m.cancelled.length) + " জন" : "") + "</div></div>";
  }
  function gk(u, by) {
    if (by === "dept") return { k: u.dept || "~", label: u.dept ? deptL(u.dept) : "(বিভাগ নেই)" };
    var t = new Date(u.at); if (!u.at || isNaN(t)) return { k: "0", label: "(তারিখ নেই)" };
    var d = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    if (by === "month") return { k: d.getFullYear() + "-" + pad2(d.getMonth() + 1), label: MON[d.getMonth()] + " " + bd(d.getFullYear()) };
    if (by === "week") { d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); return { k: ymd(d), label: "সপ্তাহ · " + bd(d.getDate()) + " " + MON[d.getMonth()] + " " + bd(d.getFullYear()) + " থেকে" }; }
    return { k: ymd(d), label: bd(d.getDate()) + " " + MON[d.getMonth()] + " " + bd(d.getFullYear()) };
  }
  function paintGroups(R) {
    var box = $("#mfgv"); if (!box) return; if (!ST.grp) { box.innerHTML = ""; ST.GR = []; return; }
    var G = {}, order = [];
    R.forEach(function (u) { var g = gk(u, ST.gby); if (!G[g.k]) { G[g.k] = { k: g.k, label: g.label, list: [] }; order.push(G[g.k]); } G[g.k].list.push(u); });
    order.sort(function (a, b) { return ST.gby === "dept" ? b.list.length - a.list.length : (a.k < b.k ? 1 : -1); }); ST.GR = order;
    box.innerHTML = '<div class="mfa"><b>📊 গ্রুপ ভিউ</b><label>ধরে গোনা<select data-g="by">' + [["day", "দিন"], ["week", "সপ্তাহ"], ["month", "মাস"], ["dept", "বিভাগ"]].map(function (o) { return opt(o[0], o[1], ST.gby); }).join("") + "</select></label>" +
      (order.length ? order.map(function (g) { return '<div class="mfr" style="padding:4px 0"><div class="mfb"><span><b>' + E(g.label) + "</b> — " + bd(g.list.length) + " জন</span></div></div>"; }).join("") + '<button type="button" data-a="gmk">📁 প্রতিটা আলাদা ফোল্ডার বানাও (' + bd(order.length) + "টি)</button>" : '<p class="sm">এই ফিল্টারে কেউ নেই।</p>') + "</div>";
  }
  function fdl(kind) { // 📗 Excel / 🖼 JPG / 📦 ZIP — admin-export.js-এর MCEXP.folder; বাছা ইউজার থাকলে শুধু তারা, নইলে ফিল্টারের সবাই
    if (!window.MCEXP || !MCEXP.folder) { say("ডাউনলোড সিস্টেম (admin-export.js) লোড হয়নি — পেজ রিফ্রেশ করুন।", true); return; }
    var CN = { ok: "ভেরিফাইড", no: "নন-ভেরিফাইড", ex: "বাদ", nr: "সাড়া পাওয়া যায়নি" }, sel = LAST.filter(function (u) { return ST.sel[u.key]; }), us = sel.length ? sel : LAST;
    MCEXP.folder({ name: curName(), sel: !!sel.length, go: kind, users: us.map(function (u) { return { key: u.key, device: u.device || "", name: u.name, dept: deptL(u.dept), batch: u.batch || "", score: u.score, st: CN[flagOf(u)] || "—" }; }) });
  }
  function csvDown() {
    var q = function (v) { var s = String(v == null ? "" : v); if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }, CN = { ok: "ভেরিফাইড", no: "নন-ভেরিফাইড", ex: "বাদ", nr: "সাড়া পাওয়া যায়নি" };
    var rows = [["ইউজার আইডি", "নাম", "বিভাগ", "সেশন", "স্কোর", "শেষ সক্রিয়তা", "ফ্ল্যাগ", "বেইজ", "ফর্ম জমা", "যোগাযোগ", "ফেসবুক লিংক", "স্ক্রিনশট লিংক"]].concat(LAST.map(function (u) { var S = subsOf(u); return [uidOf(u), u.name, deptL(u.dept), u.batch, u.score == null ? "" : u.score, u.at ? new Date(u.at).toLocaleString("bn-BD") : "", CN[flagOf(u)] || "", window.MCBG ? MCBG.names(fkey(u.device, u.name)) : "", u.entries || "", u.contact || "", S.map(function (e) { return e.fb_link || ""; }).filter(Boolean).join(" | "), S.map(function (e) { return e.shot_url || ""; }).filter(Boolean).join(" | ")]; }));
    var blob = new Blob(["﻿" + rows.map(function (r) { return r.map(q).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "mc-folder-" + ymd(new Date()) + "-" + LAST.length + ".csv"; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    say("⬇ " + bd(LAST.length) + " জনের CSV নামানো হয়েছে।", false);
  }
  function uniqName(base) {
    var b = String(base || "ফোল্ডার").trim().slice(0, 74), n = b, i = 1;
    var taken = function (x) { return AUTO.some(function (a) { return norm(a.name) === norm(x); }) || ST.FOLD.some(function (f) { return norm(f.name) === norm(x); }); };
    while (taken(n)) { i++; n = b + " (" + bd(i) + ")"; } return n;
  }

  // ---------- কাজ: বানানো, নাম বদল, মোছা ----------
  function checkName(name, exceptId) {
    var n = String(name || "").trim();
    if (!n) throw new Error("ফোল্ডারের নাম লিখুন।");
    if (n.length > 80) throw new Error("নাম ৮০ অক্ষরের মধ্যে দিন।");
    if (AUTO.some(function (a) { return norm(a.name) === norm(n); })) throw new Error("এই নামটা অটো ফোল্ডারের জন্য নির্ধারিত — অন্য নাম দিন।");
    if (ST.FOLD.some(function (f) { return String(f.id) !== String(exceptId) && norm(f.name) === norm(n); })) throw new Error("এই নামে আগে থেকেই ফোল্ডার আছে।");
    return n;
  }
  function createFolder(name, kind, extra) { // kind = "winners" (লটারির বিজয়ী; SQL h) | "smart" (সেভ করা ফিল্টার; SQL i); extra = { meta } বা { filter }
    var n; try { n = checkName(name); } catch (e) { return Promise.reject(e); }
    var body = { name: n }; if (kind === "winners" || kind === "smart") body.kind = kind; Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
    return M.A("mc2_ufolders", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) }).then(function (r) { var f = r && r[0]; if (!f) throw new Error("ফোল্ডার বানানো যায়নি।"); ST.FOLD.push(f); return f; })
      .catch(function (e) { if ((kind === "winners" || kind === "smart") && /kind|meta|filter|constraint/i.test(String(e && e.message || e))) throw new Error("এর জন্য নতুন SQL (supabase-new-20261018h.sql ও supabase-new-20261018i.sql) একবার চালান।"); throw e; });
  }
  // fresh সারিগুলো ফোল্ডারে ঢোকায় (আগে থাকা ukey বাদ); কতজন নতুন ঢুকল ও কতজন আগেই ছিল ফেরত দেয়
  function insertRows(f, rows) {
    var have = {}; members(f.id).forEach(function (m) { have[m.ukey] = 1; });
    var fresh = rows.filter(function (r) { return !have[r.ukey]; });
    return chunks(fresh, 500).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?on_conflict=folder_id,ukey", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(c) }); }); }, Promise.resolve())
      .then(function () { return { added: fresh.length, skipped: rows.length - fresh.length }; });
  }
  function work(fn) { if (BUSY) return; BUSY = true; return Promise.resolve().then(fn).catch(function (e) { ST.msg = e && e.message ? e.message : String(e); ST.bad = true; paint(); }).then(function () { BUSY = false; }); }

  // ---------- কাজ: কপি / মুভ ----------
  function parseNames(t) {
    var seen = {}, out = [];
    String(t || "").split(/[,،\n]/).forEach(function (x) { var n = x.trim().replace(/\s+/g, " ").slice(0, 80); if (n && !seen[norm(n)]) { seen[norm(n)] = 1; out.push(n); } });
    return out;
  }
  function memRow(fid, u) { return { folder_id: fid, ukey: u.key, name: String(u.name).slice(0, 80), device: u.device || null, dept: u.dept || null, batch: u.batch || null, score: u.score == null ? null : u.score, src: u.manual ? "manual" : (u.src === "form" ? "form" : "all"), at: u.at || null }; }
  function chunks(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
  function op(move) {
    var tv = $("#mft").value, nn = $("#mfn").value, typed = parseNames($("#mfx").value);
    var all = curUsers(), picked = all.filter(function (u) { return ST.sel[u.key]; });
    if (!picked.length && !typed.length) { say("আগে ইউজার বাছুন বা নাম লিখুন।", true); return; }
    if (!tv) { say("কোন ফোল্ডারে যাবে তা বেছে নিন।", true); return; }
    if (tv === "__new") { try { checkName(nn); } catch (e) { say(e.message, true); return; } }
    if (move && isRO(ST.cur)) { say("এই ফোল্ডার থেকে শুধু কপি করা যায়।", true); return; }
    if (tv !== "__new" && kindOf(tv) === "smart") { say("স্মার্ট ফোল্ডারে ইউজার যোগ করা যায় না — অন্য ফোল্ডার বাছুন।", true); return; }
    if (move && picked.length && tv === String(ST.cur)) { say("একই ফোল্ডারে মুভ করা যায় না — অন্য ফোল্ডার বাছুন।", true); return; }
    ST.names = $("#mfx").value; ST.tgt = tv; ST.nn = nn;
    work(function () {
      return (tv === "__new" ? createFolder(nn) : Promise.resolve(folder(tv))).then(function (f) {
        if (!f) throw new Error("ফোল্ডারটা পাওয়া যায়নি — পাতা রিফ্রেশ করুন।");
        var rows = [], seen = {};
        picked.forEach(function (u) { if (!seen[u.key]) { seen[u.key] = 1; rows.push(memRow(f.id, u)); } });
        var linked = 0; // লেখা নামে সাইটে ঠিক একজন ইউজার থাকলে তার সাথে জুড়ে যায় (একই জনকে দুইবার না গোনার জন্য); নইলে হাতে-লেখা নাম
        typed.forEach(function (n) {
          var m = ST.NU[norm(n)], k = m ? m.key : "n:" + norm(n); if (seen[k]) return; seen[k] = 1;
          if (m) { linked++; rows.push(memRow(f.id, m)); } else rows.push({ folder_id: f.id, ukey: k, name: n, device: null, dept: null, batch: null, score: null, src: "manual", at: null });
        });
        var have = {}; members(f.id).forEach(function (m) { have[m.ukey] = 1; });
        var fresh = rows.filter(function (r) { return !have[r.ukey]; }), skipped = rows.length - fresh.length;
        var ins = chunks(fresh, 500).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?on_conflict=folder_id,ukey", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(c) }); }); }, Promise.resolve());
        var back = move ? picked.filter(function (u) { return u.mid; }).map(function (u) { return ST.MEM.filter(function (m) { return m.id === u.mid; })[0]; }).filter(Boolean).map(rowBody) : [], srcId = ST.cur;
        return ins.then(function () {
          var ids = move ? picked.map(function (u) { return u.mid; }).filter(Boolean) : [];
          return chunks(ids, 100).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?id=in.(" + c.join(",") + ")", { method: "DELETE" }); }); }, Promise.resolve()).then(function () { return ids.length; });
        }).then(function (moved) {
          if (move && moved) { var addedKeys = fresh.map(function (r) { return r.ukey; }), fid = f.id, fnm = f.name; ST.undo.push({ label: bd(moved) + " জন মুভ হয়েছিল → " + fnm, fn: function () { // আনডু: নতুন ফোল্ডার থেকে সরিয়ে আগের ফোল্ডারে ফেরানো
            var rm = ST.MEM.filter(function (m) { return String(m.folder_id) === String(fid) && addedKeys.indexOf(m.ukey) >= 0; }).map(function (m) { return m.id; });
            return chunks(rm, 100).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?id=in.(" + c.join(",") + ")", { method: "DELETE" }); }); }, Promise.resolve())
              .then(function () { return chunks(back, 500).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?on_conflict=folder_id,ukey", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(c) }); }); }, Promise.resolve()); })
              .then(function () { ST.cur = String(srcId); }); } }); }
          return loadFolders().then(function () {
            ST.sel = {}; ST.bad = false; ST.names = ""; ST.tgt = ""; ST.nn = "";
            ST.msg = "✅ " + (fresh.length ? bd(fresh.length) + " জন " + (move && moved ? "মুভ" : "যোগ") + " হয়েছে" : "নতুন কেউ যোগ হয়নি") + " → " + f.name + (skipped ? " (" + bd(skipped) + " জন আগেই ছিল)" : "") + (linked ? "; লেখা " + bd(linked) + "টি নাম সাইটের ইউজারের সাথে মিলেছে" : "") + "।";
            paint();
          });
        });
      });
    });
  }

  function setFlags(users, v) { // বাল্ক: একই MCFL.set (🎁 জমা পড়া ও লটারির সাথে একই সেভ/ক্যাশ)
    var ks = users.map(function (u) { return fkey(u.device, u.name); });
    return work(function () { return MCFL.set(ks, v).then(function (n) { ST.bad = false; paintList(); say("✅ " + bd(n) + " জনের অবস্থা " + (v ? FLN[v] : "ফ্ল্যাগ ছাড়া") + " করা হয়েছে।", false); }); });
  }

  // ---------- একাধিক-বাছা: ড্রপডাউনে টিক-বাক্স (মূল তালিকা "m:" ও সার্চ প্যানেল "s:" দুটোতেই একই) ----------
  function msArr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
  var msSum = function (label, n) { return label + (n ? " · " + bd(n) + "টি বাছা" : " · সব"); };
  function msUi(id, label, opts, sel) { // opts = [[মান, লেখা]]; sel = বাছা মানের তালিকা (পুরোনো একটা স্ট্রিংও চলে)
    var S = msArr(sel).map(String);
    return '<details class="mfd" data-msd="' + E(id) + '" data-lb="' + E(label) + '"><summary>' + E(msSum(label, S.length)) + '</summary><div class="mfdl">' +
      (opts.length ? opts.map(function (o) { return '<label><input type="checkbox" data-ms="' + E(id) + '" value="' + E(o[0]) + '"' + (S.indexOf(String(o[0])) >= 0 ? " checked" : "") + "><span>" + E(o[1]) + "</span></label>"; }).join("") : '<span class="sm">কিছু নেই</span>') +
      '<button type="button" class="l s" data-a="msclr" data-ms="' + E(id) + '">↺ সব বাদ (সব দেখান)</button></div></details>';
  }
  function msApply(d) { // টিক বদলালে: তালিকা পড়ে সংশ্লিষ্ট ফিল্টারে বসায়
    if (!d) return; var id = d.getAttribute("data-msd") || "", vals = [];
    Array.prototype.forEach.call(d.querySelectorAll("input[data-ms]"), function (x) { if (x.checked) vals.push(x.value); });
    var sm = d.querySelector("summary"); if (sm) sm.textContent = msSum(d.getAttribute("data-lb") || "", vals.length);
    var key = id.slice(2);
    if (id.slice(0, 2) === "m:") { F[key] = vals; ST.shown = LIM; paintList(); }
    else if (id.slice(0, 2) === "s:") { SR.f[key] = vals; srSoon(250); }
  }

  // ---------- 🔎 ইউজার খুঁজে যোগ করুন ----------
  function srRange() {
    var f = SR.f; if (f.per === "all") return null;
    var d = new Date(); d.setHours(0, 0, 0, 0); var t0 = d.getTime(), day = 864e5, a = null, b = null;
    if (f.per === "today") a = t0; else if (f.per === "yest") { a = t0 - day; b = t0; }
    else if (f.per === "week") a = t0 - ((d.getDay() + 1) % 7) * day;   // সপ্তাহ শুরু শনিবার (মূল তালিকার মতোই)
    else if (f.per === "month") a = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    else if (f.per === "range") { if (f.from) a = new Date(f.from + "T00:00:00").getTime(); if (f.to) b = new Date(f.to + "T00:00:00").getTime() + day; }
    return { a: a, b: b };
  }
  function srUrl(off, lim, slim) { // সার্ভারে ফিল্টারসহ কোয়েরি (শুধু পড়া)
    var f = SR.f, enc = encodeURIComponent, adm = SR.src === "mc2_cards_adm", p = "", and = [], v, r;
    var q1 = function (x) { return '"' + String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; };
    var multi = function (col, arr) {
      if (!arr.length) return; var none = arr.indexOf("__none") >= 0, vs = arr.filter(function (x) { return x !== "__none"; }).map(q1).join(",");
      if (!none) p += "&" + col + "=" + enc("in.(" + vs + ")");
      else and.push("or(" + [col + ".is.null"].concat(vs ? [col + ".in.(" + vs + ")"] : []).join(",") + ")");
    };
    multi("dept", f.dept); multi("batch", f.batch); if (adm) { multi("kind", f.kind); multi("club", f.club); }
    if (and.length) p += "&and=" + enc("(" + and.join(",") + ")");
    v = String(f.q || "").trim().replace(/[*,()%]/g, ""); if (v) p += "&name=ilike." + enc("*" + v + "*");
    if ((r = srRange())) { if (r.a != null && !isNaN(r.a)) p += "&updated_at=gte." + enc(new Date(r.a).toISOString()); if (r.b != null && !isNaN(r.b)) p += "&updated_at=lt." + enc(new Date(r.b).toISOString()); }
    return SR.src + "?select=device,name,dept,batch,score,updated_at" + (slim || !adm ? "" : ",club,kind,has_photo") + "&order=updated_at.desc,id.desc&limit=" + lim + "&offset=" + off + p;
  }
  function srUser(c) { return { key: ukey(c.device, c.name), name: String(c.name || ""), device: c.device || "", dept: c.dept || "", batch: c.batch || "", score: c.score == null ? null : c.score, at: c.updated_at || null, src: "all", club: c.club || "", kind: c.kind || "", hp: !!c.has_photo }; }
  function srGet(url, count) { // → { j, total }
    return M.raw(M.base + "/rest/v1/" + url, count ? { headers: { Prefer: "count=exact" } } : {}).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 140)); });
      var m = /\/(\d+)$/.exec(r.headers.get("content-range") || "");
      return r.json().then(function (j) { return { j: j || [], total: m ? +m[1] : null }; });
    });
  }
  function srFallback(e) { // ভিউ mc2_cards_adm নেই (SQL চালানো হয়নি) → মূল টেবিলে ফিরে; ধরন/ক্লাব ফিল্টার ছাড়া
    if (SR.src !== "mc2_cards_adm" || SR.fell) return false;
    SR.fell = true; SR.src = "mc2_cards"; SR.f.kind = []; SR.f.club = []; SR.notice = "ℹ️ ধরন/ক্লাব ফিল্টার চালু করতে supabase-new-20261103.sql চালাতে হবে — এখন বিভাগ, সেশন, তারিখ, নাম দিয়ে খোঁজা চলছে।";
    srPaint(true); return true;
  }
  function srRun(more) {
    if (!M || !ROOT || !$("#mfsr")) return;
    var my = ++SR.seq; if (!more) { SR.rows = []; SR.total = null; SR.off = 0; } SR.busy = true; SR.err = ""; SR.info = ""; srPaintRes();
    return srGet(srUrl(SR.off, SR.PG), true).then(function (o) {
      if (my !== SR.seq) return; var have = {}; SR.rows.forEach(function (u) { have[u.key] = 1; });
      SR.off += o.j.length; SR.total = o.total != null ? o.total : SR.off; // একই ব্যক্তির একাধিক কার্ড থাকলে একজনই দেখায়
      o.j.forEach(function (c) { var u = srUser(c); if (u.name && !have[u.key]) { have[u.key] = 1; SR.rows.push(u); } });
      SR.busy = false; srPaintRes();
    }).catch(function (e) {
      if (my !== SR.seq) return; if (srFallback(e)) return; // srFallback নিজেই নতুন করে খোঁজে
      SR.busy = false; SR.err = "আনা যায়নি: " + (e && e.message || e); srPaintRes();
    });
  }
  function srSoon(ms) { clearTimeout(SR.t); SR.t = setTimeout(function () { if (ROOT && ROOT.isConnected && $("#mfsr")) srRun(false); }, ms || 250); }
  function srAll() { // ফিল্টারের সবাইকে বাছা (সর্বোচ্চ SR.CAP জন; ১০০০ করে আনে)
    if (!SR.total) return; var out = [], my = SR.seq;
    SR.info = "⏳ সবাইকে বাছা হচ্ছে…"; srPaintRes();
    (function loop(off) { return srGet(srUrl(off, 1000, true), false).then(function (o) { out = out.concat(o.j); return o.j.length === 1000 && out.length < SR.CAP ? loop(off + 1000) : out; }); })(0).then(function (L) {
      if (my !== SR.seq) return; L.forEach(function (c) { var u = srUser(c); if (u.name) SR.sel[u.key] = u; });
      SR.info = "☑ ফিল্টারের " + bd(L.length) + "টি কার্ডের ইউজার বাছা হয়েছে" + (L.length >= SR.CAP ? " (সর্বোচ্চ " + bd(SR.CAP) + " পর্যন্ত বাছা হয় — ফিল্টার আরও ছোট করে বাকিটা বাছুন)" : "") + "।"; srPaintRes();
    }).catch(function (e) { SR.info = ""; SR.err = "বাছা যায়নি: " + (e && e.message || e); srPaintRes(); });
  }
  function srRow(u) {
    var meta = [KLB[u.kind], deptL(u.dept), u.batch, u.club].filter(Boolean).map(function (x) { return '<span class="tag">' + E(x) + "</span>"; }).join(" ");
    return '<label class="mfr"><input type="checkbox" data-sk="' + E(u.key) + '"' + (SR.sel[u.key] ? " checked" : "") + ' aria-label="বাছুন"><div class="mfb"><div><b>' + E(u.name) + "</b>" + (u.hp ? " 📷" : "") + " " + meta + '</div><div class="sm">' + E([u.score != null ? bd(u.score) + " মার্ক" : "", u.at ? M.tm(u.at) : ""].filter(Boolean).join(" · ")) + "</div></div></label>";
  }
  function srCount() { var n = Object.keys(SR.sel).length, a = $("#srn"), b = $("#srb"); if (a) a.innerHTML = "বাছা <b>" + bd(n) + "</b> জন"; if (b) b.textContent = "➕ বাছা " + bd(n) + " জনকে যোগ করুন"; }
  function srPaintRes() {
    var box = $("#mfsr"); if (!box) return; var n = Object.keys(SR.sel).length, more = SR.total != null && SR.off < SR.total;
    box.innerHTML = (SR.err ? '<div class="mfm bad">' + E(SR.err) + "</div>" : "") + (SR.info ? '<div class="mfm ok">' + E(SR.info) + "</div>" : "") +
      '<div class="sm">' + (SR.busy && !SR.rows.length ? "⏳ খোঁজা হচ্ছে…" : "দেখাচ্ছে <b>" + bd(SR.rows.length) + "</b> জন" + (SR.total != null ? " · ফিল্টারে মোট <b>" + bd(SR.total) + "</b>টি কার্ড" : "") + ' · <span id="srn">বাছা <b>' + bd(n) + "</b> জন</span>") + "</div>" +
      '<div class="act"><button type="button" class="l s" data-a="srpg">☑ দেখানো সবাই</button><button type="button" class="l s" data-a="srall"' + (SR.total ? "" : " disabled") + '>☑ ফিল্টারের সব' + (SR.total ? " (" + bd(SR.total) + ")" : "") + '</button><button type="button" class="l s" data-a="srclr">✕ বাছা মুছুন</button></div>' +
      '<div class="act"><button type="button" data-a="sradd" id="srb">➕ বাছা ' + bd(n) + " জনকে যোগ করুন</button></div>" +
      '<div id="srl">' + SR.rows.map(srRow).join("") + "</div>" +
      (SR.busy && SR.rows.length ? '<p class="sm">⏳ আনা হচ্ছে…</p>' : "") + (more && !SR.busy ? '<div class="act"><button type="button" class="l" data-a="srmore">⬇ আরও ' + bd(Math.min(SR.PG, SR.total - SR.off)) + "টি দেখান</button></div>" : "") +
      (!SR.busy && !SR.err && !SR.rows.length && SR.total === 0 ? '<p class="sm">এই ফিল্টারে কেউ নেই — ফিল্টার বদলে দেখুন।</p>' : "");
  }
  function srHtml() {
    var adm = SR.src === "mc2_cards_adm", f = SR.f, dl = uniq(ST.USERS, "dept").list.slice(), bl = uniq(ST.USERS, "batch");
    ((window.MC && window.MC.depts) || []).forEach(function (x) { if (dl.indexOf(x) < 0) dl.push(x); });
    var P = [["all", "সব সময়"], ["today", "আজ"], ["yest", "গতকাল"], ["week", "এই সপ্তাহ"], ["month", "এই মাস"], ["range", "কাস্টম তারিখ"]];
    return '<div class="mfa" id="mfsp"><b>🔎 ইউজার খুঁজুন — বাছুন — ফোল্ডারে যোগ করুন</b>' + (SR.notice ? '<div class="mfm bad">' + E(SR.notice) + "</div>" : "") +
      '<div class="sm">যে ফোল্ডারে যোগ হবে সেটা ওপরের <b>«কোন ফোল্ডারে»</b> ঘর থেকে নেওয়া হয়। ড্রপডাউনে একাধিক টিক দেওয়া যায়।</div>' +
      '<div class="row">' + (adm ? '<div class="mfdw">' + msUi("s:kind", "ধরন", KL, f.kind) + "</div>" : "") +
      '<div class="mfdw">' + msUi("s:dept", "বিভাগ", dl.map(function (x) { return [x, deptL(x)]; }), f.dept) + "</div>" +
      '<div class="mfdw">' + msUi("s:batch", "সেশন", bl.list.map(function (x) { return [x, x]; }).concat([["__none", "(সেশন নেই)"]]), f.batch) + "</div>" +
      (adm ? '<div class="mfdw" id="mfsclub">' + srClubUi() + "</div>" : "") +
      '<label>তারিখ (কার্ডের শেষ আপডেট)<select data-sf="per">' + P.map(function (o) { return opt(o[0], o[1], f.per); }).join("") + "</select></label>" +
      '<label>নাম খুঁজুন<input data-sf="q" type="search" maxlength="60" value="' + E(f.q) + '" placeholder="🔎 নামের যেকোনো অংশ"></label></div>' +
      '<div class="row" id="mfsg"' + (f.per === "range" ? "" : " hidden") + '><label>থেকে<input data-sf="from" type="date" value="' + E(f.from) + '"></label><label>পর্যন্ত<input data-sf="to" type="date" value="' + E(f.to) + '"></label></div>' +
      '<div class="act"><button type="button" class="s" data-a="srgo">🔎 খুঁজুন</button><button type="button" class="l s" data-a="srreset">↺ ফিল্টার মুছুন</button></div><div id="mfsr"></div></div>';
  }
  function srClubUi() { return msUi("s:club", "ক্লাব", [["__none", "(ক্লাব নেই)"]].concat((SR.clubs || []).map(function (x) { return [x, x]; })), SR.f.club); }
  function srClubs() { // ক্লাবের তালিকা একবার (শুধু পড়া)
    if (SR.src !== "mc2_cards_adm" || SR.clubs) return; SR.clubs = [];
    M.A("mc2_cards_adm?select=club&club=not.is.null&limit=20000").then(function (L) {
      var o = {}; (L || []).forEach(function (r) { if (r.club) o[r.club] = 1; }); SR.clubs = Object.keys(o).sort(function (a, b) { return a.localeCompare(b, "bn"); });
      var w = $("#mfsclub"); if (w) w.innerHTML = srClubUi();
    }).catch(function (e) { SR.clubs = null; srFallback(e); });
  }
  function srPaint(rebuild) { // প্যানেল আঁকা (খোলা থাকলে); rebuild = ফিল্টার আবার আঁকা + নতুন করে খোঁজা
    var box = $("#mfs"); if (!box) return;
    if (!SR.open) { box.innerHTML = ""; return; }
    box.innerHTML = srHtml(); srPaintRes(); srClubs();
    if (rebuild || !SR.ran) { SR.ran = true; srRun(false); }
  }
  function srAdd() {
    var tv = $("#mft").value, nn = $("#mfn").value, picked = Object.keys(SR.sel).map(function (k) { return SR.sel[k]; });
    if (!picked.length) { say("আগে সার্চের ফলাফল থেকে ইউজার বাছুন।", true); return; }
    if (!tv) { say("কোন ফোল্ডারে যাবে তা বেছে নিন (ওপরের «কোন ফোল্ডারে» ঘর)।", true); return; }
    if (tv === "__new") { try { checkName(nn); } catch (e) { say(e.message, true); return; } }
    if (tv !== "__new" && kindOf(tv) === "smart") { say("স্মার্ট ফোল্ডারে ইউজার যোগ করা যায় না — অন্য ফোল্ডার বাছুন।", true); return; }
    ST.names = $("#mfx").value; ST.tgt = tv; ST.nn = nn;
    work(function () {
      return (tv === "__new" ? createFolder(nn) : Promise.resolve(folder(tv))).then(function (f) {
        if (!f) throw new Error("ফোল্ডারটা পাওয়া যায়নি — পাতা রিফ্রেশ করুন।");
        return insertRows(f, picked.map(function (u) { return memRow(f.id, u); })).then(function (r) {
          return loadFolders().then(function () {
            SR.sel = {}; ST.tgt = ""; ST.nn = ""; ST.bad = false;
            ST.msg = "✅ " + (r.added ? bd(r.added) + " জন যোগ হয়েছে" : "নতুন কেউ যোগ হয়নি") + " → " + f.name + (r.skipped ? " (" + bd(r.skipped) + " জন আগেই ছিল)" : "");
            paint();
          });
        });
      });
    });
  }

  // ---------- ইভেন্ট ----------
  function onClick(e) {
    var t = e.target, fo = t.closest("[data-fo]"), a = t.closest("[data-a]");
    if (fo) { SR.sel = {}; SR.rows = []; SR.total = null; SR.ran = false; SR.open = false; ST.cur = fo.dataset.fo; F = F0(); ST.sel = {}; ST.op = {}; ST.shown = LIM; ST.ren = false; ST.mk = false; ST.msg = ""; ST.names = ""; ST.tgt = ""; ST.nn = ""; return paint(); }
    if (!a) return; var k = a.dataset.a;
    if (k === "msclr") { var md = a.closest("details"); if (md) { Array.prototype.forEach.call(md.querySelectorAll("input[data-ms]"), function (x) { x.checked = false; }); msApply(md); } return; }
    if (k === "sropen") { SR.open = !SR.open; a.textContent = SR.open ? "🔎 ইউজার খুঁজে যোগ করুন ▲" : "🔎 ইউজার খুঁজে যোগ করুন ▼"; srPaint(); return; }
    if (k === "srgo") { srRun(false); return; }
    if (k === "srmore") { srRun(true); return; }
    if (k === "srreset") { SR.f = { kind: [], dept: [], batch: [], club: [], per: "all", from: "", to: "", q: "" }; srPaint(true); return; }
    if (k === "srpg") { SR.rows.forEach(function (u) { SR.sel[u.key] = u; }); SR.info = ""; srPaintRes(); return; }
    if (k === "srall") { srAll(); return; }
    if (k === "srclr") { SR.sel = {}; SR.info = ""; srPaintRes(); return; }
    if (k === "sradd") { srAdd(); return; }
    if (k === "mk") { ST.mk = !ST.mk; ST.msg = ""; paint(); var i = $("#mkn"); if (i) i.focus(); }
    else if (k === "mkx") { ST.mk = false; paint(); }
    else if (k === "mkgo") { var nm = $("#mkn").value; work(function () { return createFolder(nm).then(function (f) { ST.cur = String(f.id); F = F0(); ST.sel = {}; ST.shown = LIM; ST.mk = false; ST.bad = false; ST.msg = "✅ ফোল্ডার বানানো হয়েছে: " + f.name; paint(); }); }); }
    else if (k === "ren") { ST.ren = true; paint(); var r = $("#rnn"); if (r) r.focus(); }
    else if (k === "renx") { ST.ren = false; paint(); }
    else if (k === "rensave") {
      var f = folder(ST.cur), nn; if (!f) return; try { nn = checkName($("#rnn").value, f.id); } catch (er) { ST.ren = false; ST.msg = er.message; ST.bad = true; paint(); return; }
      work(function () { return M.A("mc2_ufolders?id=eq." + f.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: nn }) }).then(function () { f.name = nn; ST.ren = false; ST.bad = false; ST.msg = "✅ নাম বদলানো হয়েছে।"; paint(); }); });
    }
    else if (k === "del") {
      var d = folder(ST.cur); if (!d) return; var c = members(d.id).length;
      if (!confirm("ফোল্ডার \"" + d.name + "\" মুছবেন?\nভেতরের " + bd(c) + " জন ইউজার মুছবে না — শুধু এই ফোল্ডার ও এর তালিকা যাবে।")) return;
      var dsnap = { name: d.name, kind: d.kind, filter: d.filter, meta: d.meta, rows: members(d.id).map(rowBody) };
      work(function () { return M.A("mc2_ufolders?id=eq." + d.id, { method: "DELETE" }).then(function () { ST.undo.push({ label: 'ফোল্ডার "' + dsnap.name + '" মোছা হয়েছিল (' + bd(dsnap.rows.length) + " জন)", fn: function () { // আনডু: ফোল্ডার ও সদস্য আবার বানানো
          var body = { name: dsnap.name }; if (dsnap.kind && dsnap.kind !== "custom") { body.kind = dsnap.kind; if (dsnap.filter) body.filter = dsnap.filter; if (dsnap.meta) body.meta = dsnap.meta; }
          return M.A("mc2_ufolders", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) }).then(function (r) { var nf = r && r[0]; if (!nf) throw new Error("ফোল্ডার ফেরানো যায়নি।"); ST.cur = String(nf.id);
            return chunks(dsnap.rows.map(function (x) { var y = Object.assign({}, x); y.folder_id = nf.id; return y; }), 500).reduce(function (p, c) { return p.then(function () { return M.A("mc2_ufolder_members?on_conflict=folder_id,ukey", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(c) }); }); }, Promise.resolve()); }); } }); ST.FOLD = ST.FOLD.filter(function (x) { return x.id !== d.id; }); ST.MEM = ST.MEM.filter(function (m) { return m.folder_id !== d.id; }); ST.cur = "all"; F = F0(); ST.sel = {}; ST.bad = false; ST.msg = "✅ ফোল্ডার \"" + d.name + "\" মুছে গেছে (ইউজার যায়নি)।"; paint(); }); });
    }
    else if (k === "bgf") { var bl = String(F.bg || "").split(",").filter(Boolean), bi = bl.indexOf(a.dataset.id), bn = a.dataset.id === "none"; if (a.dataset.id === "__clr") bl = []; else if (bn) bl = bi >= 0 ? [] : ["none"]; else { bl = bl.filter(function (x) { return x !== "none"; }); bi = bl.indexOf(a.dataset.id); if (bi >= 0) bl.splice(bi, 1); else bl.push(a.dataset.id); } F.bg = bl.join(","); ST.shown = LIM; paint(); }
    else if (k === "freset") { F = F0(); ST.shown = LIM; paint(); }
    else if (k === "selall") { if (LAST.length && nsel() === LAST.length) ST.sel = {}; else { ST.sel = {}; LAST.forEach(function (u) { ST.sel[u.key] = 1; }); } paintList(); }
    else if (k === "selclr") { ST.sel = {}; paintList(); }
    else if (k === "pgf") { if (!a.disabled) { ST.shown = (+a.dataset.p + 1) * LIM; paintList(); } }
    else if (k === "csv") csvDown();
    else if (k === "fxl" || k === "fxjpg" || k === "fxpng" || k === "fxpdf" || k === "fjpg" || k === "fzip") fdl(k.slice(1));
    else if (k === "grp") { ST.grp = !ST.grp; paint(); }
    else if (k === "gmk") {
      var GR = ST.GR.slice(); if (!GR.length) return; var bn = strip(curName());
      if (GR.length > 15 && !confirm(bd(GR.length) + "টি আলাদা ফোল্ডার বানানো হবে। চালিয়ে যাবেন?")) return;
      work(function () {
        var made = 0;
        return GR.reduce(function (p, g) { return p.then(function () { return createFolder(uniqName(bn + " · " + g.label)).then(function (nf) { return insertRows(nf, g.list.map(function (u) { return memRow(nf.id, u); })); }).then(function () { made++; }); }); }, Promise.resolve())
          .then(function () { return loadFolders(); }).then(function () { ST.bad = false; ST.msg = "✅ " + bd(made) + "টি ফোল্ডার বানানো হয়েছে (প্রতিটা গ্রুপের জন্য একটা)।"; paint(); });
      });
    }
    else if (k === "sm") { ST.sm = !ST.sm; ST.msg = ""; paint(); var sn = $("#smn"); if (sn) sn.focus(); }
    else if (k === "smx") { ST.sm = false; paint(); }
    else if (k === "smgo") {
      var smn = $("#smn").value, base = kindOf(ST.cur) === "smart" ? String(((folder(ST.cur) || {}).filter || {}).base || "all") : String(ST.cur), fs0 = Object.assign({}, F);
      work(function () { return createFolder(smn, "smart", { filter: { base: base, f: fs0 } }).then(function (nf) { ST.cur = String(nf.id); F = F0(); ST.sel = {}; ST.shown = LIM; ST.sm = false; ST.bad = false; ST.msg = "✅ স্মার্ট ফোল্ডার বানানো হয়েছে: " + nf.name; paint(); }); });
    }
    else if (k === "smupd") {
      var sf = folder(ST.cur); if (!sf) return; var nfl = { base: String((sf.filter || {}).base || "all"), f: Object.assign({}, F) };
      work(function () { return M.A("mc2_ufolders?id=eq." + sf.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ filter: nfl }) }).then(function () { sf.filter = nfl; F = F0(); ST.bad = false; ST.msg = "✅ স্মার্ট ফোল্ডারের ফিল্টার আপডেট হয়েছে।"; paint(); }); });
    }
    else if (k === "undo") {
      var ua = ST.undo.pop(); if (!ua) return;
      work(function () { return Promise.resolve(ua.fn()).then(function () { return loadFolders(); }).then(function () { ST.sel = {}; ST.bad = false; ST.msg = "↩ আনডু হয়েছে: " + ua.label; if (!isAuto(ST.cur) && !folder(ST.cur)) ST.cur = "all"; paint(); }); });
    }
    else if (k === "cx") { if (window.MCLOT && window.MCLOT.redraw) window.MCLOT.redraw(ST.cur, a.dataset.k, a.dataset.m); }
    else if (k === "det") { var dk = a.dataset.k; if (ST.op[dk]) delete ST.op[dk]; else ST.op[dk] = 1; paintList(); }
    else if (k === "topall" || k === "topdept") { // 🏅 সেরা N জন বাছা (স্কোর বেশি আগে; সমান হলে আগে যে পেয়েছে) — তারপর নিচ থেকে ফোল্ডারে কপি
      // তারিখ-ফিল্টার "সব সময়" হলে ইউজারের সবসময়ের সেরা স্কোর (আগের মতোই)। আজ/গতকাল/সপ্তাহ/মাস/কাস্টম দিলে শুধু ওই সময়ের ভেতরের খেলার সেরা স্কোর।
      var tn = Math.max(1, Math.min(1000, +($("#mftn").value) || 3)), by = function (x, y) { return y.score - x.score || new Date(x.at) - new Date(y.at); }, inP = F.per !== "all", noPl = 0, take = [], pool;
      ST.tn = tn;
      if (!inP) pool = LAST.filter(function (u) { return u.score != null; });
      else pool = LAST.map(function (u) {
        var b = null; ((ST.UMAP[u.key] || {}).pl || []).forEach(function (p) { if (inPer(p[1], F) && (!b || p[0] > b[0] || (p[0] === b[0] && new Date(p[1]) < new Date(b[1])))) b = p; });
        if (!b) { noPl++; return null; } return Object.assign({}, u, { score: b[0], at: b[1] });   // স্কোর/সময় = ওই সময়ের ভেতরের সেরা খেলার
      }).filter(Boolean);
      if (k === "topall") take = pool.slice().sort(by).slice(0, tn);
      else { var gm = {}; pool.forEach(function (u) { (gm[u.dept || "~"] = gm[u.dept || "~"] || []).push(u); }); Object.keys(gm).forEach(function (d) { take = take.concat(gm[d].sort(by).slice(0, tn)); }); }
      ST.sel = {}; take.forEach(function (u) { ST.sel[u.key] = 1; }); paintList();
      say("🏅 " + (k === "topall" ? "সব মিলিয়ে" : "প্রতি বিভাগের") + " সেরা " + bd(tn) + " জন করে বাছা হয়েছে — মোট " + bd(take.length) + " জন (বর্তমান ফিল্টারের ভেতর থেকে)। স্কোর ধরা হয়েছে: " + (inP ? "তারিখ-ফিল্টার «" + perText(F) + "» — শুধু ওই সময়ের ভেতরের খেলার সেরা স্কোর" : "সব সময়ের সেরা স্কোর") + "।" + (noPl ? " (ওই সময়ের কোনো খেলার তথ্য না থাকায় " + bd(noPl) + " জন গণনায় আসেনি।)" : "") + " এখন নিচের \"কোন ফোল্ডারে\" বেছে কপি করুন।", false);
    }
    else if (k === "fbulk") {
      var pk = LAST.filter(function (x) { return ST.sel[x.key]; }), fv = a.dataset.v;
      if (!pk.length) { say("আগে ইউজার বাছুন (বাম পাশের টিক)।", true); return; }
      if (!confirm(bd(pk.length) + " জনের অবস্থা " + (fv ? '"' + FLN[fv] + '"' : "মুছে (ফ্ল্যাগ ছাড়া)") + " করবেন?")) return;
      setFlags(pk, fv);
    }
    else if (k === "cp") op(false);
    else if (k === "mv") op(true);
  }
  function onField(e) {
    var t = e.target, fk = t.getAttribute && t.getAttribute("data-f"), sf = t.getAttribute && t.getAttribute("data-sf");
    if (t.getAttribute && t.getAttribute("data-ms") != null && t.type === "checkbox") { if (e.type === "change") msApply(t.closest("details")); return; }
    if (t.getAttribute && t.getAttribute("data-sk") != null) { if (e.type === "change") { var sk = t.getAttribute("data-sk"), su = SR.rows.filter(function (x) { return x.key === sk; })[0]; if (t.checked) { if (su) SR.sel[sk] = su; } else delete SR.sel[sk]; srCount(); } return; }
    if (sf) { SR.f[sf] = t.value; if (sf === "per") { var sg = $("#mfsg"); if (sg) sg.hidden = t.value !== "range"; if (t.value === "range" && !SR.f.from && !SR.f.to) return; } srSoon(sf === "q" ? 450 : 200); return; }
    if (t.getAttribute && t.getAttribute("data-g") === "by") { if (e.type === "change") { ST.gby = t.value; paintList(); } return; }
    if (fk) { F[fk] = t.value; ST.shown = LIM; if (fk === "per") $("#mfg").hidden = F.per !== "range"; return paintList(); }
    if (e.type !== "change") return;
    if (t.id === "mft") { $("#mfn").hidden = t.value !== "__new"; return; }
    if (t.matches && t.matches("input[data-k]")) { if (t.checked) ST.sel[t.dataset.k] = 1; else delete ST.sel[t.dataset.k]; paintList(); }
  }

  window.MCF = {
    open: function (root) {
      M = window.MCA; ROOT = root; ST.msg = ""; ST.ren = false; ST.mk = false;
      if (!M || !M.rpc) { root.innerHTML = '<p class="warn">অ্যাডমিন সংযোগ পাওয়া যায়নি।</p>'; return Promise.resolve(); }
      root.onclick = onClick; root.onchange = onField; root.oninput = onField;
      root.innerHTML = '<p class="sm">⏳ ফোল্ডার ও ইউজার লোড হচ্ছে…</p>';
      return load().then(function () { if (ROOT === root) paint(); }).catch(function (er) { root.innerHTML = '<p class="warn">লোড হয়নি: ' + E(er && er.message ? er.message : er) + "</p>"; });
    },
    // লটারি স্ক্রিন (admin-lottery.js) এই API ব্যবহার করে
    folders: function () { return ST.FOLD.slice(); }, members: function (id) { return members(id).slice(); }, key: ukey, fkey: fkey,
    ready: function () { M = window.MCA; if (!M || !M.rpc) return Promise.reject(new Error("অ্যাডমিন সংযোগ পাওয়া যায়নি।")); return load(); }, // সব তথ্য নতুন করে লোড
    auto: function () { return AUTO.map(function (a) { return { id: a.id, name: a.name, count: count(a.id) }; }); },
    users: function (id) { return usersOf(id).slice(); },               // "all" | "form" | কাস্টম/বিজয়ী ফোল্ডারের আইডি
    flag: function (u) { return ST.FL[fkey(u.device, u.name)] || ""; },  // "ok" | "no" | "ex" | "nr" | ""
    byName: function (n) { return ST.NU[norm(n)] || null; },            // নামে সাইটে ঠিক একজন ইউজার থাকলে সে
    uid: function (u) { return uidOf(u); },   // ইউজারের আইডি (ডিভাইস না থাকলে ফাঁকা)
    noSql: function () { return ST.noSql; },
    repaint: function (full) { if (ROOT && ROOT.isConnected && $("#mfl")) { if (full) paint(); else paintList(); } },   // 🏅 বেইজ (admin-badges.js) বদলালে আবার আঁকা
    selKeys: function () { var o = []; LAST.forEach(function (u) { if (ST.sel[u.key]) o.push(fkey(u.device, u.name)); }); return o; },   // বাছা ইউজারদের ফ্ল্যাগ/বেইজের চাবি
    count: function (id) { return count(id); },                            // অটো, কাস্টম, বিজয়ী ও স্মার্ট সব ফোল্ডারের সদস্য-সংখ্যা
    info: function (key) { return { played: !!ST.UMAP[key], form: !!ST.FMAP[key] }; }, // খেলেছে / ফর্ম দিয়েছে
    create: function (name, kind, extra) { return createFolder(name, kind, extra); },
    setMeta: function (id, meta) { return M.A("mc2_ufolders?id=eq." + id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ meta: meta }) }).then(function () { var f = folder(id); if (f) f.meta = meta; }); },
    remove: function (fid, mid) { return M.A("mc2_ufolder_members?id=eq." + mid, { method: "DELETE" }).then(function () { ST.MEM = ST.MEM.filter(function (m) { return String(m.id) !== String(mid); }); }); },
    rename: function (id, name) { var n = checkName(name, id); return M.A("mc2_ufolders?id=eq." + id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: n }) }).then(function () { var f = folder(id); if (f) f.name = n; return n; }); },
    add: function (fid, users) { // users: [{key,name,device,dept,batch,score,src,manual,at}] → ফোল্ডারে যোগ (ডুপ্লিকেট বাদ)
      var f = folder(fid); if (!f) return Promise.reject(new Error("ফোল্ডারটা পাওয়া যায়নি।"));
      var seen = {}, rows = []; users.forEach(function (u) { if (!seen[u.key]) { seen[u.key] = 1; rows.push(memRow(f.id, u)); } });
      return insertRows(f, rows).then(function (r) { return loadFolders().then(function () { return r; }); });
    },
    uniqueName: function (base) { // নাম ৮০ অক্ষরের মধ্যে, অটো ফোল্ডার ও আগের নামের সাথে না মিলিয়ে
      var b = String(base || "ফোল্ডার").trim().slice(0, 74), n = b, i = 1;
      var taken = function (x) { return AUTO.some(function (a) { return norm(a.name) === norm(x); }) || ST.FOLD.some(function (f) { return norm(f.name) === norm(x); }); };
      while (taken(n)) { i++; n = b + " (" + bd(i) + ")"; } return n;
    }
  };
})();

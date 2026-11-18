// MC Explorer — কার্ডের লোগো সেটিং (২০২৬-১১-১৫)। অ্যাডমিন > 🖼️ লোগো থেকে বাছাই করা লোগো/অন-অফ/অক্ষর কার্ডে বসায়।
// সেটিং mc2_settings-এর key 'logo_cfg' (ছোট, পাবলিক-রিড)। আপলোড করা লোগোর ছবি আলাদা সারিতে 'logo_img_<নম্বর>' — শুধু বাছাই করা দুটোই সাইটে নামে।
// কার্ডের সঙ্গে সার্ভারে শুধু ছোট সংখ্যা-তালিকা জমা থাকে: rec.lg = [বাম-লোগো-নম্বর, ডান-লোগো-নম্বর, মাস্ক, বাম-অক্ষর, ডান-অক্ষর] (ছবি কখনো জমা হয় না)।
// লোগো নম্বর: ১ = M.C EXPLORER (images/logo-card-explorer.png), ২ = MC (images/logo-mc.png), ৯০০০ = NU (images/logo-nu.png, কার্ডে বন্ধ, তালিকায় আছে) — এ তিনটে স্থায়ী ডিফল্ট; ৩+ = অ্যাডমিনের আপলোড।
// মাস্ক বিট: ১ = স্কোর কার্ড ১ (drawCard1), ২ = কার্ড ২ (drawCard2), ৪ = কার্ড ৩ (drawCard3), ৮ = স্টোরি। বিট চালু = লোগো দেখাবে; বন্ধ = অক্ষর।
// সেটিং না এলে/নেট সমস্যায় আগের মতোই ডিফল্ট দুই লোগো দেখায়।
(function () {
  var C = window.MC_CFG || {}, BASE = ["images/logo-card-explorer.png", "images/logo-mc.png", "images/logo-nu.png"], SK = "mc2_logocfg", ADM = /admin/i.test(location.pathname);
  var DEF = { m: 15, l: 1, r: 2, tl: "M", tr: "C", old: "sub", fl: 1, fr: 2, lib: [], nx: 3, ud: null, ul: null, ut: 1, pd: null };
  var cfg = null, loading = null, IMG = {};

  var PDK = ["1", "2", "4", "8", "p", "s", "c"];
  function id(v, d) { v = parseInt(v, 10); return v >= 1 && v <= 9999 ? v : d; }
  function lt(v, d) { return typeof v === "string" ? v.slice(0, 3) : d; }
  function merge(v) {
    var o = {}, k; for (k in DEF) o[k] = DEF[k]; o.on = 1; o.mOn = 0; o.lib = []; o.pd = {}; o.ud = { s: 0, h: 0, b: 0, w: 0, a: 0 }; o.ul = [1, 2]; // ud = ইউজারকে লোগো-ড্রপডাউন (s = ফল-পাতার স্কোর কার্ড, h = আগের কার্ড; ডিফল্ট বন্ধ), ul = ইউজার যে লোগোগুলো বাছতে পারবে, ut = ইউজার নিজে অক্ষর লিখতে পারবে
    if (v && typeof v === "object") {
      o.on = v.on === 0 ? 0 : 1; o.mOn = Math.max(0, Math.min(15, parseInt(v.mOn, 10) || 0));
      if (v.m != null) o.m = Math.max(0, Math.min(15, parseInt(v.m, 10) || 0));
      o.l = id(v.l, 1); o.r = id(v.r, 2); o.fl = id(v.fl, 1); o.fr = id(v.fr, 2);
      o.tl = lt(v.tl, "M"); o.tr = lt(v.tr, "C");
      o.old = v.old === "cur" || v.old === "fix" ? v.old : "sub";
      if (Array.isArray(v.lib)) o.lib = v.lib.filter(function (x) { return x && id(x.i, 0) >= 3; }).map(function (x) { return { i: +x.i, n: String(x.n || "").slice(0, 40) }; }).slice(0, 12);
      o.nx = Math.max(3, id(v.nx, 3));
      if (v.ud && typeof v.ud === "object") o.ud = { s: v.ud.s ? 1 : 0, h: v.ud.h ? 1 : 0, b: v.ud.b ? 1 : 0, w: v.ud.w ? 1 : 0, a: v.ud.a ? 1 : 0 };
      if (Array.isArray(v.ul)) o.ul = v.ul.map(function (x) { return id(x, 0); }).filter(function (x) { return x >= 1; }).slice(0, 12);
      if (v.ut != null) o.ut = v.ut ? 1 : 0;
      if (v.pd && typeof v.pd === "object") PDK.forEach(function (k) { var a = v.pd[k]; if (Array.isArray(a)) { var l0 = id(a[0], 0), r0 = id(a[1], 0); if (l0 || r0) o.pd[k] = [l0, r0]; } }); // pd = কার্ডের ধরন ধরে আলাদা লোগো: "1","2","4","8" = স্কোর কার্ড ১/২/৩ ও স্টোরি (মাস্ক-বিট), "p" = পোস্টার ও বিজয়ী কার্ড, "s" = সোশ্যাল, "c" = সার্টিফিকেট; [বাম, ডান], ০ = সবার সাথে একই
    }
    return o;
  }
  function get(path) {
    return fetch(String(C.url).replace(/\/$/, "") + "/rest/v1/" + path, { headers: { apikey: C.key, Authorization: "Bearer " + C.key } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  // পাতা খুলে নয়, প্রথম কার্ড আঁকার সময় একবারই পড়ে (সর্বোচ্চ ২.৫ সেকেন্ড অপেক্ষা; না এলে ডিফল্ট)। ইউজারের ফোনে ১ মিনিট sessionStorage-এ থাকে (অ্যাডমিন পাতায় নয়)
  function load(force) {
    if (cfg && !force) return Promise.resolve(cfg);
    if (loading && !force) return loading;
    if (!force && !ADM) { try { var s = JSON.parse(sessionStorage.getItem(SK) || "null"); if (s && Date.now() - s.t < 60000) { cfg = merge(s.v); return Promise.resolve(cfg); } } catch (e) {} }
    if (!C.url || !C.key) return Promise.resolve(merge(null));
    var p = new Promise(function (res) {
      var done = false, fin = function (c, keep) { if (done) return; done = true; clearTimeout(to); loading = null; if (keep) { cfg = c; try { sessionStorage.setItem(SK, JSON.stringify({ t: Date.now(), v: c })); } catch (e) {} } res(c); };
      var to = setTimeout(function () { fin(merge(null), false); }, 2500);
      get("mc2_settings?select=value&key=eq.logo_cfg").then(function (r) { fin(merge(r && r[0] && r[0].value), true); }).catch(function () { fin(merge(null), false); });
    });
    loading = p; return p;
  }
  function li(s) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = s; }); }
  function pic(k, src, fetcher) {
    if (IMG[k]) return IMG[k];
    var p = (src ? Promise.resolve(src) : fetcher()).then(function (s) { return s ? li(s) : null; }).then(function (i) { if (!i) delete IMG[k]; return i; }).catch(function () { delete IMG[k]; return null; });
    return (IMG[k] = p);
  }
  // নম্বর -> ছবি। ছবি না পেলে (মোছা/নেট সমস্যা) ওই পাশের ডিফল্ট লোগো
  function img(n, side) {
    n = id(n, side ? 2 : 1);
    var base = function () { return pic(side ? "b2" : "b1", BASE[side ? 1 : 0]); };
    if (n === 1) return pic("b1", BASE[0]);
    if (n === 2) return pic("b2", BASE[1]);
    if (n === 9000) return pic("b3", BASE[2]);
    return pic("u" + n, null, function () {
      return get("mc2_settings?select=value&key=eq.logo_img_" + n).then(function (r) { var d = r && r[0] && r[0].value && r[0].value.d; return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(d || "") ? d : null; });
    }).then(function (i) { return i || base(); });
  }
  // প্রতি স্কোর-ডিজাইনের (বিট ১/২/৪/৮) আলাদা লোগো: o.pm = { "1": { lm, ln }, ... } — card.js-এর mcLogoPair এটা দেখে; না থাকলে সবার একই (o.lm/o.ln)
  function withPm(o, c) {
    var bits = ["1", "2", "4", "8"].filter(function (b) { return c.pd && c.pd[b]; });
    if (!bits.length || !o) return Promise.resolve(o);
    return Promise.all(bits.map(function (b) { var p = c.pd[b]; return Promise.all([p[0] ? img(p[0], 0) : o.lm, p[1] ? img(p[1], 1) : o.ln]); })).then(function (r) { var pm = {}; bits.forEach(function (b, i) { pm[b] = { lm: r[i][0], ln: r[i][1] }; }); o.pm = pm; return o; });
  }
  // পোস্টার/বিজয়ী ("p"), সোশ্যাল ("s"), সার্টিফিকেট ("c")-এর লোগো: ওই ধরনের আলাদা বাছাই থাকলে সেটা, নইলে সবার সাধারণ বাম/ডান। ফল = [বাম ছবি, ডান ছবি]
  function forType(key) {
    return load().then(function (c) { var p = (c.pd && c.pd[key]) || [0, 0]; return Promise.all([img(p[0] || c.l, 0), img(p[1] || c.r, 1)]); });
  }
  function snap(c) { c = c || cfg || merge(null); return [c.l, c.r, c.m, c.tl, c.tr]; }
  function pack(l, r, m, tl, tr) {
    m = Math.max(0, Math.min(15, parseInt(m, 10) || 0)); tl = lt(tl, "M"); tr = lt(tr, "C");
    return Promise.all([img(l, 0), img(r, 1)]).then(function (a) { return { lm: a[0], ln: a[1], lgm: m, tl: tl, tr: tr }; });
  }
  // এইমাত্র আঁকা কার্ড (ইউজারের ফল-পাতা): এখনকার বাছাই। lg = কার্ডের সঙ্গে জমা হবে
  function now(ov) { return load().then(function (c) { return pack(c.l, c.r, c.m, c.tl, c.tr).then(function (o) { o.lg = snap(c); return withPm(o, c); }).then(function (o) { return ov ? applyOv(o, ov, c) : o; }); }); }
  // জমা কার্ড (rec.lg) আবার আঁকা: অ্যাডমিনের "পুরোনো কার্ড নামবে" বাছাই অনুযায়ী
  function forRec0(lg) {
    return load().then(function (c) {
      var s = Array.isArray(lg) && lg.length >= 3 ? lg : null;
      if (c.old === "sub") return s ? pack(s[0], s[1], s[2], s[3] == null ? c.tl : s[3], s[4] == null ? c.tr : s[4]) : pack(1, 2, 15, "M", "C"); // lg না থাকলে = আপডেটের আগের কার্ড: এখনকার ডিফল্ট (বামে M.C EXPLORER, ডানে MC)
      if (c.old === "fix") return pack(c.fl, c.fr, c.m, c.tl, c.tr).then(function (o) { return withPm(o, c); });
      return pack(c.l, c.r, c.m, c.tl, c.tr).then(function (o) { return withPm(o, c); });
    });
  }
  function forRec(lg, ov) { return forRec0(lg).then(function (g) { return ov ? applyOv(g, ov, cfg || merge(null)) : g; }); }

  // ---------- ইউজার/অ্যাডমিনের এক কার্ডের জন্য নিজের বাছাই (ড্রপডাউন) ----------
  // ov = { l, r, tl, tr }: l/r = null (ডিফল্ট — অ্যাডমিনের সেটিং যেমন) | 0 (লোগোর বদলে অক্ষর, tl/tr-এ লেখা) | লোগো-নম্বর। এটা সার্ভারে জমা হয় না, শুধু ওই একটা কার্ড আবার আঁকতে লাগে।
  function ltr(v) { return typeof v === "string" ? v.trim().slice(0, 3) : ""; }
  function ovNorm(ov) {
    if (!ov || typeof ov !== "object") return null;
    var n = function (x) { if (x == null || x === "d" || x === "") return null; x = parseInt(x, 10); return x >= 0 && x <= 9999 ? x : null; };
    var o = { l: n(ov.l), r: n(ov.r), tl: ltr(ov.tl), tr: ltr(ov.tr) };
    return o.l == null && o.r == null ? null : o;
  }
  function applyOv(base, ov, c) {
    ov = ovNorm(ov); if (!ov || !base) return Promise.resolve(base);
    return Promise.all([ov.l ? img(ov.l, 0) : null, ov.r ? img(ov.r, 1) : null]).then(function (im) {
      var o = {}, k; for (k in base) o[k] = base[k];
      o.lgs = [ov.l == null ? null : ov.l > 0, ov.r == null ? null : ov.r > 0]; // null = ডিজাইনের মাস্ক যেমন বলে
      if (ov.l > 0 && im[0]) o.lm = im[0]; if (ov.r > 0 && im[1]) o.ln = im[1];
      if (base.pm) { o.pm = {}; for (k in base.pm) o.pm[k] = { lm: ov.l > 0 && im[0] ? im[0] : base.pm[k].lm, ln: ov.r > 0 && im[1] ? im[1] : base.pm[k].ln }; } // এই একটা কার্ডের নিজের বাছাই সব ডিজাইনের আলাদা লোগোর ওপরে
      if (ov.l === 0) o.tl = ov.tl || c.tl; if (ov.r === 0) o.tr = ov.tr || c.tr;
      return o;
    });
  }
  var BNN = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  function nameOf(c, n) { if (n === 1) return "M.C EXPLORER লোগো"; if (n === 2) return "MC লোগো"; if (n === 9000) return "NU লোগো"; var x = c.lib.filter(function (y) { return y.i === n; })[0]; return x && x.n ? x.n : "লোগো " + BNN(n); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function pcss() {
    if (document.getElementById("lgpcss")) return; var s = document.createElement("style"); s.id = "lgpcss";
    s.textContent = ".lgp{margin:10px 0;padding:10px 12px;border:1px solid var(--bd,#d6ded8);border-radius:14px;background:var(--card,#fff);color:var(--fg,#10261b);display:grid;gap:8px;text-align:left}.lgp b{font-size:14px}" +
      ".lgp .lgp-s{display:grid;grid-template-columns:44px minmax(0,1fr);gap:6px 8px;align-items:center;font-size:14px}.lgp select,.lgp input{font:inherit;font-size:15px;color:var(--fg,#10261b);background:var(--card,#fff);border:1px solid var(--bd,#d6ded8);border-radius:10px;padding:8px 10px;min-width:0;max-width:100%;box-sizing:border-box;width:100%}" +
      ".lgp .lgp-t{grid-column:2;display:none}.lgp .lgp-t.on{display:block}.lgp .lgp-h{font-size:12px;opacity:.75}";
    document.head.appendChild(s);
  }
  // picker({ admin, init, onChange(ov) }) -> DOM। admin = সব লোগো + অক্ষর; নইলে অ্যাডমিন যা দেখাতে বলেছে (ul / ut)। বাম ও ডানের জন্য আলাদা ড্রপডাউন
  function picker(o) {
    o = o || {}; pcss(); var c = cfg || merge(null), adm = !!o.admin, i0 = o.init || {};
    var ids = adm ? [1, 2, 9000].concat(c.lib.map(function (x) { return x.i; })) : c.ul.filter(function (n) { return n === 1 || n === 2 || n === 9000 || c.lib.some(function (x) { return x.i === n; }); });
    var canT = adm || !!c.ut, st = { l: i0.l == null ? null : i0.l, r: i0.r == null ? null : i0.r, tl: i0.tl || "", tr: i0.tr || "" }, d = document.createElement("div"), tm = 0;
    d.className = "lgp";
    var side = function (k, tk, nm, dl) {
      var cur = st[k], h = "<label class='lgp-s'><span>" + nm + "</span><select data-k='" + k + "' aria-label='" + nm + "ের লোগো'><option value='d'" + (cur == null ? " selected" : "") + ">ডিফল্ট</option>";
      ids.forEach(function (n) { h += "<option value='" + n + "'" + (cur === n ? " selected" : "") + ">" + BNN(n) + " — " + esc(nameOf(c, n)) + "</option>"; });
      if (canT) h += "<option value='0'" + (cur === 0 ? " selected" : "") + ">✍️ অক্ষর লিখব</option>";
      h += "</select>";
      if (canT) h += "<input class='lgp-t" + (cur === 0 ? " on" : "") + "' data-t='" + tk + "' maxlength='3' placeholder='" + esc(dl) + "' value='" + esc(st[tk]) + "' aria-label='" + nm + "ের অক্ষর (সর্বোচ্চ ৩টি)'>";
      return h + "</label>";
    };
    d.innerHTML = "<b>🖼️ লোগো বাছুন</b>" + side("l", "tl", "বাম", c.tl) + side("r", "tr", "ডান", c.tr) + (canT ? "<div class='lgp-h'>“অক্ষর লিখব” বাছলে ১-৩টা অক্ষর লিখুন; কার্ডে ওটাই বসবে।</div>" : "");
    var fire = function (fk) { if (o.onChange) o.onChange(ovNorm(st), fk || ""); };
    d.addEventListener("change", function (e) {
      var t = e.target; if (!t || t.tagName !== "SELECT") return; st[t.getAttribute("data-k")] = t.value === "d" ? null : +t.value;
      var inp = t.parentNode.querySelector("input"); if (inp) { inp.classList.toggle("on", t.value === "0"); if (t.value === "0") { try { inp.focus(); } catch (x) {} } }
      fire();
    });
    d.addEventListener("input", function (e) {
      var t = e.target; if (!t || t.tagName !== "INPUT") return; st[t.getAttribute("data-t")] = ltr(t.value);
      clearTimeout(tm); tm = setTimeout(function () { fire(t.getAttribute("data-t")); }, 450);
    });
    if (o.focus) { var f = d.querySelector("[data-t='" + o.focus + "']"); if (f) setTimeout(function () { try { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } catch (x) {} }, 0); } // অ্যাডমিন প্রিভিউ পুরো আবার সাজালে লেখার ঘরে কার্সর ফিরে আসে
    return d;
  }
  window.mcLogo = {
    forType: forType, load: load, now: now, forRec: forRec, picker: picker, cfgNow: function () { return cfg; }, ovNorm: ovNorm, img: img, snap: snap, merge: merge, get: get, BASE: BASE,
    // অ্যাডমিন লগইন থাকলে (এই ব্রাউজারে, ১২ ঘণ্টা) পাবলিক পাতায়ও ড্রপডাউন দেখায়। শুধু সুবিধার সংকেত (সময়-চিহ্ন); কোনো পাসওয়ার্ড/টোকেন নয়, আর বাছাই সার্ভারে কিছু বদলায় না
    admHint: function () { try { var t = +localStorage.getItem("mc2_adm_hint"); return !!t && Date.now() - t < 43200000; } catch (e) { return false; } },
    sig: function () { return cfg ? JSON.stringify([cfg.m, cfg.l, cfg.r, cfg.tl, cfg.tr, cfg.old, cfg.fl, cfg.fr, cfg.pd]) : ""; },
    reload: function () { try { sessionStorage.removeItem(SK); } catch (e) {} cfg = null; return load(true); },
    bust: function (n) { delete IMG["u" + n]; }
  };
})();

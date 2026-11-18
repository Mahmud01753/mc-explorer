// অ্যাডমিনের "⬇ এক্সেল" চাপলে আগে এই জানালা খোলে (ধাপ ৪): ফিল্টার + কলাম নির্বাচক + ফোল্ডার ফিল্টার; "⬇ নামান" চাপলে তবেই ফাইল তৈরি।
// একটাই কমন কোড: প্রতিটা ট্যাব cfg দিয়ে বলে দেয় কোন ফিল্টার ও কোন কলাম তার ডাটায় আছে (যার কলাম ডাটায় নেই সেই ফিল্টার দেখায় না)। এখন শুধু 📊 ফলাফল ট্যাব ডাকে (admin-results.js); বাকি ট্যাব ধাপ ৫-এ।
// নতুন ডাটা জমে না, SQL লাগে না। শেষ বাছাই ব্রাউজারে মনে থাকে (localStorage "mc2_xdlg_<id>", try/catch-সহ)।
// API: MCXDLG.open(cfg) -> Promise<{f, cols}|null>; MCXDLG.range(f) -> {from,to} ("YYYY-MM-DD", ফাঁকা = সীমা নেই); MCXDLG.describe(f) -> হেডারের ফিল্টার-লেখা।
// cfg: { id, title, filters:[চাবি…], cols:[{k,t,lock?}], lists:{dept:[{v,t}], batch:[…], cls:[…]}, modes:[[v,t]], sorts:[[v,t]], scope:{page:n, sel:n}, init:{…}, folders():Promise<[{id,name,kind}]>,
//        ensure(f, cols, progress):Promise  (দরকারি ডাটা এনে রাখে), count(f, cols):{n, bytes, note?} (ensure-এর পরে) }
(function () {
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var PERS = [["all", "সব সময়"], ["today", "আজ"], ["yest", "গতকাল"], ["d7", "গত ৭ দিন"], ["d30", "গত ৩০ দিন"], ["month", "এই মাস"], ["day", "নির্দিষ্ট একদিন"], ["range", "থেকে–পর্যন্ত"]];
  var RANKS = [["", "সব"], ["10", "সেরা ১০"], ["50", "সেরা ৫০"], ["100", "সেরা ১০০"], ["x", "নিজে লিখব"]];
  var pad = function (n) { return ("0" + n).slice(-2); }, ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var LAST = null;

  function defaults() { return { per: "all", d1: "", from: "", to: "", q: "", dept: [], batch: [], uid: "", club: "", mode: "best", smin: "", smax: "", pmin: "", pmax: "", cls: [], rank: "", rankN: "", drank: "", drankN: "", okmin: "", okmax: "", fold: [], sort: "rank", scope: "all", firstN: "" }; }
  // সময়ের বাছাই → "YYYY-MM-DD" সীমা (দুই দিকেই ধরা)
  function range(f) {
    var n = new Date(), t = ymd(n), back = function (k) { return ymd(new Date(n.getFullYear(), n.getMonth(), n.getDate() - k)); };
    if (f.per === "today") return { from: t, to: t };
    if (f.per === "yest") return { from: back(1), to: back(1) };
    if (f.per === "d7") return { from: back(6), to: t };
    if (f.per === "d30") return { from: back(29), to: t };
    if (f.per === "month") return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: t };
    if (f.per === "day") return { from: f.d1 || "", to: f.d1 || "" };
    if (f.per === "range") return { from: f.from || "", to: f.to || "" };
    return { from: "", to: "" };
  }
  var lab = function (L, v) { for (var i = 0; i < (L || []).length; i++) if (String(L[i][0]) === String(v)) return L[i][1]; return v; };
  function describe(f) {
    var C = LAST || {}, o = [], r = range(f), nm = function (a) { return a.length ? a.join(", ") : ""; }, folds = (C.foldList || []);
    if (f.per !== "all") o.push("তারিখ: " + (f.per === "day" || f.per === "range" ? (r.from || "শুরু") + (r.from === r.to ? "" : " থেকে " + (r.to || "আজ")) : lab(PERS, f.per)));
    if (f.q.trim()) o.push("নাম: " + f.q.trim());
    if (f.dept.length) o.push("বিভাগ: " + nm(f.dept));
    if (f.batch.length) o.push("সেশন: " + nm(f.batch));
    if (f.uid.trim()) o.push("ইউজার আইডি: " + f.uid.trim());
    if (f.club.trim()) o.push("ক্লাব: " + f.club.trim());
    if (f.cls.length) o.push("ক্লাস: " + nm(f.cls));
    if (f.smin !== "" || f.smax !== "") o.push("স্কোর: " + (f.smin === "" ? "০" : f.smin) + "–" + (f.smax === "" ? "১০০০" : f.smax));
    if (f.pmin !== "" || f.pmax !== "") o.push("শতাংশ: " + (f.pmin === "" ? "০" : f.pmin) + "–" + (f.pmax === "" ? "১০০" : f.pmax));
    if (f.okmin !== "" || f.okmax !== "") o.push("সঠিক উত্তর: " + (f.okmin === "" ? "০" : f.okmin) + "–" + (f.okmax === "" ? "…" : f.okmax));
    var rn = f.rank === "x" ? f.rankN : f.rank; if (rn) o.push("র‍্যাংক: সেরা " + rn);
    var dn = f.drank === "x" ? f.drankN : f.drank; if (dn) o.push("বিভাগ-র‍্যাংক: সেরা " + dn);
    if (f.fold.length) o.push("ফোল্ডার: " + f.fold.map(function (id) { var x = folds.filter(function (y) { return String(y.id) === String(id); })[0]; return x ? x.name : id; }).join(", "));
    if (f.scope === "page") o.push("সারি: এই পেজের"); else if (f.scope === "sel") o.push("সারি: টিক-দেওয়া"); else if (f.scope === "first" && f.firstN) o.push("সারি: প্রথম " + f.firstN);
    if (f.sort !== "rank") o.push("সাজানো: " + lab(C.sorts, f.sort));
    return bd(o.join(" · "));
  }

  var CSS = ".xo{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:10px}" +
    ".xp{background:var(--card,#fff);color:var(--fg,#10261b);border:1px solid var(--bd,#d6e0d9);border-radius:16px;width:100%;max-width:620px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.35)}" +
    ".xh{padding:12px 14px;border-bottom:1px solid var(--bd,#d6e0d9);display:flex;justify-content:space-between;align-items:center;gap:8px}.xh b{font-size:17px}" +
    ".xb{padding:10px 14px;overflow:auto;flex:1 1 auto;-webkit-overflow-scrolling:touch}.xb h4{margin:14px 0 6px;font-size:14px;color:var(--g,#0b3d2e)}.xb h4:first-child{margin-top:0}" +
    ".xg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.xg label{display:grid;gap:3px;font-size:13px;min-width:0}.xg label.w{grid-column:1/-1}.xb input:not([type=checkbox]),.xb select{width:100%;box-sizing:border-box;min-width:0}" +
    ".xc{display:flex;flex-wrap:wrap;gap:6px}.xch{display:inline-flex!important;align-items:center;gap:5px;border:1px solid var(--bd,#d6e0d9);border-radius:999px;padding:5px 10px;font-size:13px;cursor:pointer;background:var(--bg,#f6faf7);max-width:100%}" +
    ".xch input{width:auto!important;margin:0}.xch:has(input:checked){background:var(--g,#0b3d2e);color:#fff;border-color:var(--g,#0b3d2e)}.xch.lk{opacity:.7;cursor:default}" +
    ".xcg{display:grid;grid-template-columns:1fr 1fr;gap:6px}.xcg .xch{border-radius:10px;width:100%;box-sizing:border-box}" +
    ".xf{padding:10px 14px;border-top:1px solid var(--bd,#d6e0d9);display:grid;gap:8px}.xl{font-size:14px;font-weight:700}.xl.bad{color:#b3261e}.xa{display:flex;flex-wrap:wrap;gap:8px}.xa button{flex:1 1 auto}" +
    ".xm{font-size:12px;color:var(--mut,#5b6b62)}.xb [hidden]{display:none!important}@media(max-width:420px){.xo{padding:0;align-items:flex-end}.xp{border-radius:16px 16px 0 0;max-height:96vh}}";

  function open(cfg) {
    return new Promise(function (resolve) {
      if (!document.getElementById("xdlg-css")) { var st = document.createElement("style"); st.id = "xdlg-css"; st.textContent = CSS; document.head.appendChild(st); }
      var FK = cfg.filters || [], has = function (k) { return FK.indexOf(k) >= 0; }, COLS = cfg.cols || [], LS = cfg.lists || {}, key = "mc2_xdlg_" + (cfg.id || "x");
      LAST = { sorts: cfg.sorts || [], foldList: [] }; window.MCXFMT = window.MCXPRE || "xlsx"; window.MCXPRE = null;
      var def = defaults(), f = defaults(), on = {}, mem = null, thumbOn = false, lastN = 0, lastMb = 0;
      COLS.forEach(function (c) { on[c.k] = true; });
      try { mem = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { mem = null; }
      if (mem && mem.f && typeof mem.f === "object") Object.keys(def).forEach(function (k) { var v = mem.f[k]; if (Array.isArray(def[k])) { if (Array.isArray(v)) f[k] = v.filter(function (x) { return typeof x === "string"; }); } else if (typeof v === "string") f[k] = v; });
      if (mem && Array.isArray(mem.cols)) { COLS.forEach(function (c) { on[c.k] = c.lock || mem.cols.indexOf(c.k) >= 0; }); }
      f.scope = "all"; f.fold = []; // এগুলো অবস্থার ওপর নির্ভর করে, তাই মনে রাখি না
      ["dept", "batch", "cls"].forEach(function (k) { var ok = (LS[k] || []).map(function (x) { return x.v; }); f[k] = f[k].filter(function (x) { return ok.indexOf(x) >= 0; }); });
      if (cfg.init) Object.keys(cfg.init).forEach(function (k) { if (def[k] !== undefined) f[k] = cfg.init[k]; }); // ট্যাবে এখন যে ফিল্টার চালু, সেটাই আগে
      if (f.mode && cfg.modes && !cfg.modes.some(function (m) { return m[0] === f.mode; })) f.mode = def.mode;

      var ov = document.createElement("div"); ov.className = "xo"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
      document.body.appendChild(ov);
      var tok = 0, tm = 0, closed = false;
      var sel = function (name, list, cur) { return '<select data-k="' + name + '">' + list.map(function (o) { return '<option value="' + E(o[0]) + '"' + (String(cur) === String(o[0]) ? " selected" : "") + ">" + E(o[1]) + "</option>"; }).join("") + "</select>"; };
      var num = function (name, ph) { return '<input type="number" inputmode="numeric" min="0" data-k="' + name + '" value="' + E(f[name]) + '" placeholder="' + E(ph || "") + '">'; };
      var chips = function (name, list, cur) { return '<div class="xc">' + list.map(function (v) { return '<label class="xch"><input type="checkbox" data-m="' + name + '" value="' + E(v.v) + '"' + (cur.indexOf(v.v) >= 0 ? " checked" : "") + "><span>" + E(v.t) + "</span></label>"; }).join("") + "</div>"; };
      function paint() {
        var h = '<div class="xh"><b>' + E(cfg.title || "⬇ এক্সেল ডাউনলোড") + '</b><button type="button" class="l s" data-x="cancel" aria-label="বন্ধ">✖</button></div><div class="xb">';
        var tm0 = has("per") || has("q"), us = has("dept") || has("batch") || has("uid") || has("club") || has("mode"), sc = has("score") || has("pct") || has("cls") || has("rank") || has("drank") || has("ok");
        if (tm0) {
          h += "<h4>🕒 সময় ও নাম</h4><div class=\"xg\">";
          if (has("per")) h += '<label class="w">সময়' + sel("per", PERS, f.per) + '</label><label id="xd1"' + (f.per === "day" ? "" : " hidden") + '>তারিখ<input type="date" data-k="d1" value="' + E(f.d1) + '"></label><label id="xd2"' + (f.per === "range" ? "" : " hidden") + '>থেকে<input type="date" data-k="from" value="' + E(f.from) + '"></label><label id="xd3"' + (f.per === "range" ? "" : " hidden") + '>পর্যন্ত<input type="date" data-k="to" value="' + E(f.to) + '"></label>';
          if (has("q")) h += '<label class="w">নাম খুঁজুন<input type="search" maxlength="40" data-k="q" value="' + E(f.q) + '" placeholder="🔎 নামের অংশ"></label>';
          h += "</div>";
        }
        if (us) {
          h += "<h4>👤 ইউজার</h4>";
          if (has("mode") && cfg.modes) h += '<div class="xg"><label class="w">তালিকার ধরন' + sel("mode", cfg.modes, f.mode) + "</label></div>";
          if (has("dept") && (LS.dept || []).length) h += '<p class="xm" style="margin:6px 0 4px">বিভাগ (একাধিক বাছা যায়; না বাছলে সব)</p>' + chips("dept", LS.dept, f.dept);
          if (has("batch") && (LS.batch || []).length) h += '<p class="xm" style="margin:8px 0 4px">সেশন (একাধিক বাছা যায়)</p>' + chips("batch", LS.batch, f.batch);
          h += '<div class="xg" style="margin-top:8px">' + (has("club") ? '<label>ক্লাব (লেখার অংশ)<input maxlength="40" data-k="club" value="' + E(f.club) + '" placeholder="সেভ-করা কার্ড থেকে"></label>' : "") + (has("uid") ? '<label>ইউজার আইডি<input maxlength="12" data-k="uid" value="' + E(f.uid) + '" placeholder="যেমন U1A2B3C4"></label>' : "") + "</div>";
        }
        if (sc) {
          h += "<h4>🎯 স্কোর ও র‍্যাংক</h4><div class=\"xg\">";
          if (has("score")) h += "<label>স্কোর থেকে" + num("smin", "০") + "</label><label>স্কোর পর্যন্ত" + num("smax", "১০০০") + "</label>";
          if (has("pct")) h += "<label>শতাংশ থেকে" + num("pmin", "০") + "</label><label>শতাংশ পর্যন্ত" + num("pmax", "১০০") + "</label>";
          if (has("ok")) h += "<label>সঠিক উত্তর (কম)" + num("okmin", "০") + "</label><label>সঠিক উত্তর (বেশি)" + num("okmax") + "</label>";
          if (has("rank")) h += "<label>র‍্যাংকের সীমা" + sel("rank", RANKS, f.rank) + '</label><label id="xrn"' + (f.rank === "x" ? "" : " hidden") + ">সেরা কতজন" + num("rankN", "যেমন ২৫") + "</label>";
          if (has("drank")) h += "<label>বিভাগ-র‍্যাংকের সীমা" + sel("drank", RANKS, f.drank) + '</label><label id="xdn"' + (f.drank === "x" ? "" : " hidden") + ">সেরা কতজন" + num("drankN", "যেমন ৩") + "</label>";
          h += "</div>";
          if (has("cls") && (LS.cls || []).length) h += '<p class="xm" style="margin:8px 0 4px">ক্লাস (একাধিক বাছা যায়)</p>' + chips("cls", LS.cls, f.cls);
        }
        if (has("fold")) h += '<h4>📁 ফোল্ডার</h4><div id="xfold" class="xm">⏳ ফোল্ডার-তালিকা আনা হচ্ছে…</div>';
        h += "<h4>↕ সাজানো ও সারি</h4><div class=\"xg\">";
        if (has("sort") && cfg.sorts) h += "<label>সাজানো" + sel("sort", cfg.sorts, f.sort) + "</label>";
        if (has("scope")) { var s = cfg.scope || {}; h += "<label>কোন সারি" + sel("scope", [["all", "সব"], ["page", "এই পেজের (" + bd(s.page || 0) + ")"], ["sel", "টিক-দেওয়া (" + bd(s.sel || 0) + ")"], ["first", "প্রথম N টি"]], f.scope) + '</label><label id="xfn"' + (f.scope === "first" ? "" : " hidden") + ">N = কতটি" + num("firstN", "যেমন ১০০") + "</label>"; }
        h += '</div><h4>🧱 কলাম (যেটা টিক, সেটাই ফাইলে আসবে)</h4><div class="xa" style="margin-bottom:8px"><button type="button" class="l s" data-x="all">☑ সব সিলেক্ট</button><button type="button" class="l s" data-x="none">☐ সব আনসিলেক্ট</button></div><div class="xcg">' +
          COLS.map(function (c) { return '<label class="xch' + (c.lock ? " lk" : "") + '"><input type="checkbox" data-c="' + E(c.k) + '"' + (on[c.k] ? " checked" : "") + (c.lock ? " disabled" : "") + "><span>" + E(c.t) + (c.lock ? " (সবসময়)" : "") + "</span></label>"; }).join("") + "</div>";
        h += '</div><div class="xf"><div class="xl" id="xl">⏳ হিসাব হচ্ছে…</div><div class="xm" id="xnote"></div><label id="xthumbW" style="display:none;align-items:center;gap:8px;margin:10px 0"><input type="checkbox" id="xthumb"> 🖼 কার্ড প্রিভিউ যোগ করুন <span class="sm">(ছোট কার্ডের ছবি, সারি বড় হবে; থাম্বনেইল না থাকলে —)</span></label><label class="w" style="display:block;margin:10px 0">📁 ফাইলের ধরন<select id="xfmt"><option value="xlsx">📗 Excel (.xlsx)</option><option value="png">🖼 ছবি — PNG (বাংলা ঠিকঠাক দেখায়)</option><option value="jpg">🖼 ছবি — JPG (ছোট ফাইল)</option><option value="pdf">📄 PDF (ছবি থেকে, বাংলা ঠিক থাকে)</option></select><span class="xm">মোবাইলের এক্সেলে বাংলা ভেঙে গেলে PNG/JPG বাছুন — একই তালিকা ছবি হয়ে নামবে (ছবিতে সর্বোচ্চ ৩০০ জন)।</span></label><label class="w" style="display:block;margin:10px 0">✍️ কে বের করেছে (ফাইলে যা লেখা থাকবে — বদলানো যায়)<input id="xby" type="text" maxlength="80" placeholder="নাম বা ইমেইল"></label><div class="xa"><button type="button" data-x="go" id="xgo" disabled>⬇ নামান</button><button type="button" class="l" data-x="reset">🔄 সব রিসেট</button><button type="button" class="l" data-x="cancel">বাতিল</button></div></div>';
        ov.innerHTML = '<div class="xp">' + h + "</div>"; var fm0 = ov.querySelector("#xfmt"); if (fm0) fm0.value = window.MCXFMT === "png" || window.MCXFMT === "jpg" || window.MCXFMT === "pdf" ? window.MCXFMT : "xlsx"; var by0 = ov.querySelector("#xby"); if (by0 && window.MCEXBY) by0.value = window.MCEXBY.get();
        var tw = ov.querySelector("#xthumbW"); if (tw) tw.style.display = cfg.thumbs ? "flex" : "none";
      }
      var colsArr = function () { return COLS.filter(function (c) { return c.lock || on[c.k]; }).map(function (c) { return c.k; }); };
      var line = function (t, bad) { var l = ov.querySelector("#xl"); if (l) { l.textContent = t; l.className = "xl" + (bad ? " bad" : ""); } };
      function refresh() {
        if (closed) return; var t = ++tok, go = ov.querySelector("#xgo"); clearTimeout(tm); if (go) go.disabled = true; line("⏳ হিসাব হচ্ছে…");
        tm = setTimeout(function () {
          Promise.resolve(cfg.ensure(f, colsArr(), function (a, n) { if (t === tok) line("⏳ ডাটা আনা হচ্ছে " + bd(a) + " / " + bd(n || a)); })).then(function () {
            if (t !== tok || closed) return; var c = cfg.count(Object.assign({}, f, { thumb: thumbOn }), colsArr()), mb = c.bytes / 1048576; lastN = c.n; lastMb = mb;
            line((thumbOn && c.n > 200 ? "⚠️ ফাইল প্রায় " + bd(mb.toFixed(1)) + " MB — তবুও? · " : "") + "মোট " + bd(c.n) + " সারি, আনুমানিক " + (mb >= 1 ? bd(mb.toFixed(1)) + " MB" : bd(Math.max(1, Math.round(c.bytes / 1024))) + " KB"), false);
            var nt = ov.querySelector("#xnote"); if (nt) nt.textContent = c.n > 0 ? (c.note || "") : "এই ফিল্টারে কোনো সারি নেই — ফিল্টার একটু ঢিলে করুন।"; if (go) go.disabled = !(c.n > 0);
          }).catch(function (e) { if (t === tok && !closed) line("⚠️ " + String(e && e.message || e).slice(0, 160), true); });
        }, 300);
      }
      function close(res) { closed = true; clearTimeout(tm); document.removeEventListener("keydown", onKey); ov.remove(); resolve(res); }
      function onKey(e) { if (e.key === "Escape") close(null); }
      document.addEventListener("keydown", onKey);
      ov.addEventListener("change", function (e) { if (e.target && e.target.id === "xfmt") window.MCXFMT = e.target.value; });
      ov.addEventListener("input", function (e) { if (e.target && e.target.id === "xby" && window.MCEXBY) window.MCEXBY.set(e.target.value); });
      ov.addEventListener("change", function (e) { if (e.target && e.target.id === "xthumb") { thumbOn = !!e.target.checked; refresh(); } });
      function loadFolders() {
        var host = ov.querySelector("#xfold"); if (!host || !cfg.folders) { if (host) host.textContent = ""; return; }
        Promise.resolve(cfg.folders()).then(function (L) {
          L = L || []; LAST.foldList = L; host = ov.querySelector("#xfold"); if (!host || closed) return;
          if (!L.length) { host.textContent = "কোনো সেভ-করা বা ✨ স্মার্ট ফোল্ডার নেই।"; return; }
          host.className = ""; host.innerHTML = '<p class="xm" style="margin:0 0 4px">একাধিক বাছা যায়; বাছা ফোল্ডারগুলোর সবার ডাটা একসাথে আসে। কোনোটা না বাছলে ফোল্ডার-ফিল্টার নেই।</p>' + chips("fold", L.map(function (x) { return { v: String(x.id), t: (x.kind === "smart" ? "✨ " : x.kind === "winners" ? "🏆 " : "📁 ") + x.name }; }), f.fold);
        }).catch(function () { host = ov.querySelector("#xfold"); if (host) host.textContent = "ফোল্ডার-তালিকা আনা যায়নি।"; });
      }
      function sync(t) { // দেখানো/লুকানো অংশ
        var q = function (s) { return ov.querySelector(s); }, hide = function (s, v) { var x = q(s); if (x) x.hidden = v; };
        hide("#xd1", f.per !== "day"); hide("#xd2", f.per !== "range"); hide("#xd3", f.per !== "range"); hide("#xrn", f.rank !== "x"); hide("#xdn", f.drank !== "x"); hide("#xfn", f.scope !== "first");
      }
      ov.addEventListener("input", function (e) { var t = e.target; if (t && t.dataset && t.dataset.k && t.tagName === "INPUT") { f[t.dataset.k] = t.value; refresh(); } });
      ov.addEventListener("change", function (e) {
        var t = e.target; if (!t || !t.dataset) return;
        if (t.dataset.k && t.tagName === "SELECT") { f[t.dataset.k] = t.value; sync(); return refresh(); }
        if (t.dataset.k && t.type === "date") { f[t.dataset.k] = t.value; return refresh(); }
        if (t.dataset.m) { var a = f[t.dataset.m], i = a.indexOf(t.value); if (t.checked && i < 0) a.push(t.value); else if (!t.checked && i >= 0) a.splice(i, 1); return refresh(); }
        if (t.dataset.c) { on[t.dataset.c] = t.checked; return refresh(); }
      });
      ov.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-x]"); if (!b) return; var x = b.dataset.x;
        if (x === "cancel") return close(null);
        if (x === "all" || x === "none") { COLS.forEach(function (c) { on[c.k] = c.lock || x === "all"; }); [].forEach.call(ov.querySelectorAll("input[data-c]"), function (i) { i.checked = x === "all" || i.disabled; }); return refresh(); }
        if (x === "reset") { f = defaults(); COLS.forEach(function (c) { on[c.k] = true; }); try { localStorage.removeItem(key); } catch (er) {} paint(); sync(); loadFolders(); refresh(); return; }
        if (x === "go") {
          var cs = colsArr().filter(function (k) { return !COLS.some(function (c) { return c.k === k && c.lock; }); });
          if (!cs.length) return alert("অন্তত একটা কলাম বাছুন।");
          if (f.scope === "first" && !(+f.firstN > 0)) return alert("\"প্রথম N টি\" বাছলে N-এর জায়গায় সংখ্যা লিখুন।");
          if (f.rank === "x" && !(+f.rankN > 0)) return alert("র‍্যাংকের সীমায় \"নিজে লিখব\" বাছলে সংখ্যা লিখুন।");
          if (f.drank === "x" && !(+f.drankN > 0)) return alert("বিভাগ-র‍্যাংকের সীমায় \"নিজে লিখব\" বাছলে সংখ্যা লিখুন।");
          try { localStorage.setItem(key, JSON.stringify({ f: f, cols: cs })); } catch (er) {}
          if (thumbOn && lastN > 200 && !confirm("ফাইল প্রায় " + bd(lastMb.toFixed(1)) + " MB — তবুও?")) return; return close({ f: JSON.parse(JSON.stringify(f)), cols: colsArr(), thumb: thumbOn });
        }
      });
      paint(); sync(); loadFolders(); refresh();
    });
  }
  window.MCXDLG = { open: open, range: range, describe: describe, defaults: defaults, bd: bd };
})();

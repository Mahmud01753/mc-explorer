// অ্যাডমিন: "🏅 বিজয়ী ঘোষণা" ট্যাব — সাপ্তাহিক/মাসিক/কাস্টম বিজয়ী তারিখ ও বর্ণনাসহ ডাটাবেজে সেভ, কাস্টম নামের লিস্ট থেকে লটারি,
// প্রতিটি ঘোষণা সাইটে দেখানো/লুকানো, আর পুরো বিজয়ী পেজ অন/অফ। admin-prize.js-এর পরে, admin.js-এর আগে লোড হয়। SQL: supabase-new-20261017.sql
(function () {
  // বিজয়ী-তালিকার ছোট ও গোছানো বাটন (নাম ছোট হলে পাশে, লম্বা হলে নিচের লাইনে) — শুধু স্টাইল
  try { if (!document.getElementById("wlcss")) { var wst = document.createElement("style"); wst.id = "wlcss"; wst.textContent = ".wr{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;padding:5px 8px;border:1px solid var(--bd);border-radius:10px;margin-top:4px}.wr .wn{flex:1 1 auto;max-width:100%;font-size:14px;overflow-wrap:anywhere}.wr .wb{display:flex;flex-wrap:wrap;gap:4px}.wr .wb button,.wfb{padding:4px 9px!important;font-size:12px!important;min-height:32px;border-radius:8px!important;margin:0!important;line-height:1.2}.wr .wb .wk{background:transparent!important;color:inherit!important;border:1.5px solid #0ea5e9!important}.wr .wb .wk b{background:#16a34a;color:#fff;border-radius:999px;padding:0 6px;margin-left:3px}.wr .wb .wk.z b{background:#94a3b8}.wr .ck{font-weight:800;margin-right:4px}"; document.head.appendChild(wst); } } catch (e) {}

  var M = null, ST = { sub: "list", on: true, rows: [], lists: [], busy: false, pc: {} }, DR = null, KN = { week: "সাপ্তাহিক", month: "মাসিক", custom: "বিশেষ" };
  window.MCA_TABS = (window.MCA_TABS || []).concat([["win", "🏅 বিজয়ী ঘোষণা"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { win: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  var dfmt = function (s) { try { return new Date(s + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return s; } };
  var rnd = function (n) { try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); } };
  var autoTitle = function (k, d) { return (k === "week" ? "সাপ্তাহিক বিজয়ী" : k === "month" ? "মাসিক বিজয়ী" : "বিজয়ী ঘোষণা") + " — " + dfmt(d); };
  function blank() { return { id: null, kind: "week", date: today(), title: "", descr: "", show: false, winners: [], source: "", listId: "", paste: "", cnt: 3, home: false, fb: false, fbnames: [], wkeys: [], srcs: [], sel: {}, pq: "", pn: 60 }; }
  function wonLS() { try { return JSON.parse(localStorage.getItem("mc2_prize_won") || "[]") || []; } catch (e) { return []; } }
  function exact() { return M.rpc("mc2_draw_card_size").then(function (x) { ST.ex = x; ST.exErr = ""; }, function (e) { ST.ex = null; ST.exErr = String((e && e.message) || e || ""); }); }   // হুবহু মাপ (ডাটাবেজের ভেতর থেকে); SQL না চালালে খালি থাকে
  function load() {
    ST.pc = {};
    var mf = ST.sub === "new" && window.MCF && window.MCF.ready ? window.MCF.ready().catch(function () {}) : Promise.resolve();   // সব ইউজার / ফোল্ডার (নতুন লটারি ট্যাবের বাছাইয়ের জন্য)
    return Promise.all([M.rpc("mc2_draw_admin_list"), M.rpc("mc2_dlist_all"), mf, exact()]).then(function (r) { ST.on = !!r[0].on; ST.rows = (r[0].rows || []).filter(function (q) { return q.source !== "wcard-manual"; }); ST.lists = r[1] || []; });   // অ্যাডমিনের ম্যানুয়াল কার্ড-ঘোষণা এই তালিকায় আসে না
  }
  function view() { M = window.MCA; DR = DR || blank(); return load().then(paint); }
  window.MCW_DRAW = function () { return DR; }; // admin-pnote.js পড়ার জন্য (শুধু পড়া)
  function grab() { // লেখা ঘর থেকে মান নিয়ে রাখে, যাতে রিফ্রেশে হারায় না
    var V = M.$("#view"), g = function (id) { var e = V.querySelector("#" + id); return e ? e.value : null; };
    if (!DR || ST.sub !== "new") return;
    var v;
    if ((v = g("wk")) !== null) DR.kind = v; if ((v = g("wd")) !== null) DR.date = v; if ((v = g("wt")) !== null) DR.title = v; if ((v = g("wx")) !== null) DR.descr = v;
    if ((v = g("wl")) !== null) DR.listId = v; if ((v = g("wp")) !== null) DR.paste = v; if ((v = g("wn")) !== null) DR.cnt = Math.max(1, Math.min(100, +v || 1));
    var sh = V.querySelector("#ws"); if (sh) DR.show = sh.checked; var hm = V.querySelector("#wh"); if (hm) DR.home = hm.checked; var fbx = V.querySelector("#wf"); if (fbx) DR.fb = fbx.checked;
    Array.prototype.forEach.call(V.querySelectorAll("[data-note]"), function (i) { var w = DR.winners[+i.dataset.note]; if (w) w.note = i.value; });
    Array.prototype.forEach.call(V.querySelectorAll("[data-cv]"), function (i) { var w = DR.winners[+i.dataset.cv]; if (w) { var ov = w.cv || ""; if (i.value) w.cv = i.value; else delete w.cv; if ((w.cv || "") !== ov) delete w.wc; } });
    // 🎴 কাস্টম একাধিক কার্ড: নাম + বাছা কোডের তালিকা (w.cs = {n, l:["s1","w5",...]}) — ছোট লেখা মাত্র, ছবি/টেবিল নেই
    Array.prototype.forEach.call(V.querySelectorAll("[data-ccn]"), function (i) {
      var k = +i.dataset.ccn, w = DR.winners[k]; if (!w) return;
      var l = Array.prototype.map.call(V.querySelectorAll('[data-cc="' + k + '"]:checked'), function (c) { return c.value; });
      l = l.concat(((w.cs && w.cs.l) || []).filter(function (c) { return /^e\d/.test(c); }));   // ✏️ সম্পাদিত কার্ড চেক-বক্সে নেই, তাই আলাদা করে রাখা হয়
      var n = String(i.value || "").trim().slice(0, 40);
      csSet(w, n, l, (w.cs && w.cs.x) || []);   // টিক দিলেই "কাস্টম" মোড নিজে চালু — আলাদা করে ড্রপডাউন বা "এই নামে সেভ" চাপতে হয় না
    });
    Array.prototype.forEach.call(V.querySelectorAll("[data-pd]"), function (i) { var w = DR.winners[+i.dataset.pd]; if (w) { if (i.value !== "") w.pd = +i.value; else delete w.pd; } });   // পোস্টার-ডিজাইনের নম্বর (০–১৯); ছবি সার্ভারে যায় না
  }
  // 💽 বিজয়ী কার্ড ডাটার সত্যিকারের মাপ: সার্ভার থেকে এইমাত্র পড়া ঘোষণাগুলোর কার্ড-অংশ (cs/cv/pd/wc) UTF-8 বাইটে গুনে; আন্দাজ নয়
  function stH() {
    var rows = ST.rows || [], enc = window.TextEncoder ? new TextEncoder() : null, by = function (x) { var t = JSON.stringify(x); return enc ? enc.encode(t).length : unescape(encodeURIComponent(t)).length; };
    var bytes = 0, cards = 0, edited = 0, ws = 0, dup = 0, P = window.MCPoster;
    rows.forEach(function (r) { (r.winners || []).forEach(function (w) {
      var part = {}; ["cs", "cv", "pd", "wc"].forEach(function (k) { if (w[k] != null) part[k] = w[k]; });
      if (!Object.keys(part).length) return; bytes += by(part);
      var l = csAll(w.cs); if (l.length) ws++; cards += l.length; l.forEach(function (c) { if (/^e\d/.test(c)) edited++; });
      dup += l.length - uniqCs(l).length;
    }); });
    var X = ST.ex, JB = bytes; if (X && X.cards_bytes != null) { bytes = +X.cards_bytes; cards = +X.cards; edited = +X.edited; ws = +X.winners_with_cards; }
    var CAP = 500 * 1024 * 1024, pct = bytes / CAP * 100, R = 26, C = 2 * Math.PI * R, fill = Math.max(pct > 0 ? 1.5 : 0, Math.min(100, pct)) / 100 * C;
    var fmt = function (n) { return n < 1024 ? bd(n) + " বাইট" : n < 1048576 ? bd((n / 1024).toFixed(2)) + " কেবি" : bd((n / 1048576).toFixed(2)) + " এমবি"; };
    var pt = pct === 0 ? "০%" : pct < 0.001 ? "০.০০১%-এরও কম" : bd(pct.toFixed(pct < 1 ? 4 : 2)) + "%";
    return '<div id="wst" style="display:flex;gap:12px;align-items:center;background:#0b1a13;color:#fff;border-radius:12px;padding:10px 12px;margin:8px 0"><svg width="64" height="64" viewBox="0 0 64 64" style="flex:none"><circle cx="32" cy="32" r="' + R + '" fill="none" stroke="#345" stroke-width="8"/><circle cx="32" cy="32" r="' + R + '" fill="none" stroke="' + (pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#22c55e") + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + fill.toFixed(2) + " " + C.toFixed(2) + '" transform="rotate(-90 32 32)"/></svg>' +
      '<div style="min-width:0;font-size:13px;line-height:1.5"><b style="font-size:15px">💽 বিজয়ী কার্ড ডাটা: ' + fmt(bytes) + '</b><br>' + bd(cards) + "টি বাছা কার্ড (সম্পাদিত " + bd(edited) + "টি) · " + bd(ws) + " জন বিজয়ীর · " + bd(rows.length) + 'টি ঘোষণায়<br><span style="opacity:.8">ডাটাবেজ সীমার (ফ্রি ৫০০ এমবি ধরে) ' + pt + " · ডুপ্লিকেট কার্ড: " + bd(dup) + (dup ? " (পরের সেভে নিজে সরে যাবে)" : "") + '</span><br><span style="opacity:.75;font-size:11px">' + (X && X.cards_bytes != null ? "✅ হুবহু মাপ (ডাটাবেজের ভেতর থেকে, pg_column_size)। ঘোষণার পুরো টেবিল (ইনডেক্স-সহ) " + fmt(+X.table_bytes) + " · পুরো ডাটাবেজ " + fmt(+X.db_bytes) + " · JSON-হিসাবে " + fmt(JB) : "⚠️ হুবহু মাপ আসেনি" + (ST.exErr ? " (" + E(ST.exErr).slice(0, 80) + ")" : "") + " — supabase-new-20261204.sql একবার Run করুন; এখন সার্ভার থেকে পড়া ডাটার JSON-মাপ দেখাচ্ছে।") + ' ছবি জমা হয় না।</span></div></div>';
  }
  function refSt(rows) { try { ST.rows = (rows || []).filter(function (q) { return q.source !== "wcard-manual"; }); var el = document.getElementById("wst"); if (el) el.outerHTML = stH(); exact().then(function () { var e2 = document.getElementById("wst"); if (e2) e2.outerHTML = stH(); }); } catch (e) {} }   // সেভের পর রিং/মাপ নতুন করে
  function paint() {
    var V = M.$("#view"), sub = ST.sub;
    var tb = function (k, t) { return '<button type="button" class="' + (sub === k ? "" : "l") + ' s" data-sub="' + k + '">' + t + "</button>"; };
    V.innerHTML = '<div class="act" style="justify-content:space-between;align-items:center"><div class="act">' + tb("list", "📋 ঘোষণা তালিকা") + tb("new", DR && DR.id ? "✏️ সম্পাদনা" : "➕ নতুন লটারি/ঘোষণা") + tb("lists", "📝 কাস্টম লিস্ট") + "</div>" +
      '<button type="button" class="s ' + (ST.on ? "" : "d") + '" id="wmain">' + (ST.on ? "🟢 সাইটে বিজয়ী পেজ: চালু" : "🔴 সাইটে বিজয়ী পেজ: বন্ধ") + "</button></div>" +
      '<p class="sm">' + (ST.on ? "চালু থাকলে সাইটের হোমে \"বিজয়ীদের তালিকা\" বাটন আসে (শুধু যেগুলো \"দেখাচ্ছে\" সেগুলো)।" : "বন্ধ — সাইটে বিজয়ীদের পেজ ও বাটন কিছুই দেখা যাচ্ছে না। ডাটা সেভ আছে।") + "</p>" + stH() + "<div id=\"wb\"></div>";
    var B = V.querySelector("#wb");
    B.innerHTML = sub === "list" ? listH() : sub === "new" ? newH() : listsH();
    V.onclick = click;
    V.onchange = function (e) {
      var t = e.target;
      if (t.id === "wl") { grab(); DR.sel = {}; DR.pq = ""; DR.pn = 60; paint(); return; }
      if (t.dataset && t.dataset.pi != null) { var p = (ST.pc[DR.listId] || [])[+t.dataset.pi]; if (p) { DR.sel[p.key] = t.checked; var c = M.$("#wpc"); if (c) c.textContent = pkHead(ST.pc[DR.listId] || [], DR.listId); } return; }
      if (t.dataset && t.dataset.cc != null) { var cvs = V.querySelector('[data-cv="' + t.dataset.cc + '"]'), any = V.querySelector('[data-cc="' + t.dataset.cc + '"]:checked'); if (cvs) { if (any) cvs.value = "c"; else if (cvs.value === "c") cvs.value = ""; } return; }
      if (t.id === "wh" && t.checked) { var sx = V.querySelector("#ws"); if (sx) sx.checked = true; }
    };
    V.oninput = function (e) { if (e.target.id === "wq") { DR.pq = e.target.value; DR.pn = 60; pkRefresh(); } };
    if (sub === "new") ensurePk();
  }
  function listH() {
    return fdWinH() + bfH() + listH0() + (window.MCDL && window.MCDL.boxHtml ? window.MCDL.boxHtml("👥 বিজয়ী-তালিকা থেকে বেছে কার্ড বানান", ["win", "pst", "til", "his"], "wnUl") : "");
  }
  // ভাগ ২: 📄 শিট বাটনে ফোল্ডার বাছলে বদল ওই ফোল্ডারের সেভে যায় (⬇ ট্যাবের mc2_dl_edit)
  function fdWinH() { var F = window.MCF && window.MCF.folders ? window.MCF.folders() : []; return '<label class="sm" style="display:flex;gap:6px;align-items:center;margin-bottom:6px">📁 শিট এডিটের ফোল্ডার <select id="wnFd" style="max-width:220px"><option value="">না (সাধারণ এডিট)</option>' + F.map(function (f) { return '<option value="' + String(f.id) + '">' + E(f.name) + '</option>'; }).join("") + '</select></label>'; }
  function bfH() { return window.MCF ? '<div class="act" style="margin-bottom:6px"><button type="button" class="s l" data-a="bf">🔄 লটারি ফোল্ডারগুলো এই তালিকায় আনুন</button></div><p class="sm">পুরস্কার ট্যাবের 🎰 লটারির বিজয়ী ফোল্ডার এখন নিজে থেকেই এখানে ও 🎁 পুরস্কার ও নোটে আসে। আগে যেগুলো আসেনি, ওই বাটনে চাপলে একসাথে এসে যাবে।</p>' : ""; }
  function listH0() {
    if (!ST.rows.length) return '<p class="sm">এখনো কোনো ঘোষণা সেভ হয়নি। "➕ নতুন লটারি/ঘোষণা" থেকে শুরু করুন।</p>';
    return ST.rows.map(function (r) {
      var W = r.winners || [];
      return '<div class="it' + (r.show ? "" : " hid") + '"><div><span class="tag">' + KN[r.kind] + '</span><span class="tag">' + E(dfmt(r.draw_date)) + "</span><span class=\"tag\">" + (r.show ? "👁 বিজয়ী পেজে দেখাচ্ছে" : "🙈 বিজয়ী পেজে লুকানো") + "</span><span class=\"tag\">" + (r.home ? "🏠 হোমে: অন" : "🏠 হোমে: অফ") + "</span>" + (r.fb ? "<span class=\"tag\">ফেসবুক ফোল্ডার</span>" : "") + "</div><b>" + E(r.title) + "</b>" +
        (r.descr ? '<div class="sm">' + E(r.descr) + "</div>" : "") +
        "<div>" + W.map(function (w, i) { var nk = w.cv === "c" && w.cs && w.cs.l ? w.cs.l.length : 0, ids = ' data-id="' + r.id + '" data-i="' + i + '"'; return '<div class="wr"><div class="wn"><span class="ck" style="color:' + (nk ? "#16a34a" : "#dc2626") + '" title="' + (nk ? "কার্ড বাছা আছে" : "কার্ড বাছা নেই") + '">' + (nk ? "✔" : "✖") + "</span><b>" + bd(i + 1) + ". " + E(w.name) + "</b>" + (window.MCG ? window.MCG.tag(w.device || null, w.name) : "") + (w.note ? ' <span class="sm">(' + E(w.note) + ")</span>" : "") + '</div><div class="wb"><button type="button" class="s l" data-a="pst"' + ids + ' title="পোস্টার">🖼 পোস্টার' + (w.pd != null && w.pd !== "" ? " ✔" + bd(+w.pd + 1) : "") + '</button><button type="button" class="s l" data-a="wcd"' + ids + '>🪪 কার্ড</button><button type="button" class="s wk' + (nk ? "" : " z") + '" data-a="ccp"' + ids + ' title="সেভ করা কার্ড দেখুন">🎴<b>' + bd(nk) + '</b></button><button type="button" class="s" data-a="ccl"' + ids + ' style="background:#7c3aed;color:#fff">✏️ বাছুন</button></div></div>'; }).join("") + "</div>" +
        '<div class="act"><button type="button" class="s l" data-a="tg" data-id="' + r.id + '">' + (r.show ? "🙈 ড্রপডাউনে লুকান" : "👁 ড্রপডাউনে দেখান") + '</button><button type="button" class="s ' + (r.home ? "" : "l") + '" data-a="hm" data-id="' + r.id + '">🏠 ' + (r.home ? "হোম থেকে লুকান" : "হোমে দেখান") + '</button><button type="button" class="s" data-a="pst" data-id="' + r.id + '" style="background:var(--o)">🖼 ফেসবুক পোস্টার (সবার)</button><button type="button" class="s l" data-a="sht" data-id="' + r.id + '">📄 এক পেজে (শিট)</button><button type="button" class="s l" data-a="ed" data-id="' + r.id + '">✏️ সম্পাদনা</button><button type="button" class="s d" data-a="dl" data-id="' + r.id + '">🗑 মুছুন</button></div></div>';
    }).join("");
  }
  function newH() {
    var d = DR, won = wonLS(), opts = ST.lists.map(function (l) { return '<option value="' + l.id + '"' + (String(d.listId) === String(l.id) ? " selected" : "") + ">" + E(l.name) + " (" + bd((l.items || []).length) + ")</option>"; }).join("");
    return '<div class="row"><label>ধরন<select id="wk">' + ["week", "month", "custom"].map(function (k) { return '<option value="' + k + '"' + (d.kind === k ? " selected" : "") + ">" + KN[k] + "</option>"; }).join("") + '</select></label><label>তারিখ<input type="date" id="wd" value="' + E(d.date) + '"></label></div>' +
      '<label>শিরোনাম <span class="sm">(ফাঁকা রাখলে নিজে বসবে)</span><input id="wt" maxlength="120" value="' + E(d.title) + '" placeholder="' + E(autoTitle(d.kind, d.date)) + '"></label>' +
      '<label>বর্ণনা (কেন/কীভাবে বিজয়ী, পুরস্কার ইত্যাদি)<textarea id="wx" rows="3" maxlength="2000">' + E(d.descr) + "</textarea></label>" +
      '<label><input type="checkbox" id="ws" style="width:auto"' + (d.show ? " checked" : "") + "> বিজয়ী পেজের ড্রপডাউনে দেখান (ডিফল্ট: বন্ধ; 🏠 হোমে টিক দিলে নিজে টিক পড়বে, নিজে থেকেও টিক দেওয়া যাবে)</label>" +
      '<label><input type="checkbox" id="wh" style="width:auto"' + (d.home ? " checked" : "") + "> 🏠 হোমের ফ্লোটিং বিজয়ী বক্সে দেখান (অফ থাকলে হোমে আসবে না)</label>" +
      '<label><input type="checkbox" id="wf" style="width:auto"' + (d.fb ? " checked" : "") + "> ফেসবুক ফোল্ডার (🎰 লটারিতে নাম-বাক্স আসবে)</label>" +
      '<div class="c" style="margin-top:8px"><h2>🎲 বিজয়ী বাছাই</h2>' +
      '<p class="sm"><b>১) লটারি</b> — সব ইউজার, বাছাই করা ইউজার, সেভ করা লিস্ট, আগের বিজয়ী/ফোল্ডার, বা নিচে নাম পেস্ট (প্রতি লাইনে একজন)</p><div class="row"><label>লটারির সোর্স<select id="wl">' + srcSel(d.listId) + '</select></label><label>কতজন<input type="number" id="wn" min="1" max="100" value="' + d.cnt + '"></label></div><div id="wpkw">' + pkH() + '</div>' +
      '<label>অথবা নাম পেস্ট করুন<textarea id="wp" rows="4" placeholder="রাহুল আহমেদ&#10;সুমি আক্তার">' + E(d.paste) + '</textarea></label><div class="act"><button type="button" data-a="spin"' + (ST.busy ? " disabled" : "") + '>🎰 লটারি চালান</button></div><div id="wspin" class="sm" style="font-size:20px;font-weight:700;margin:6px 0"></div>' +
      '<p class="sm"><b>২) পুরস্কার ট্যাবের লটারি বিজয়ী</b> — ওই ট্যাবে এই ব্রাউজারে যাঁরা জিতেছেন (' + bd(won.length) + ' জন)</p><div class="act"><button type="button" class="l s" data-a="imp"' + (won.length ? "" : " disabled") + '>⬇️ সবাইকে এই ঘোষণায় আনুন</button></div>' +
      '<p class="sm"><b>৩) হাতে যোগ</b></p><div class="row"><input id="wm" placeholder="নাম"><button type="button" class="l s" data-a="add">+ যোগ</button></div></div>' +
      "<h2 style=\"margin-top:10px\">🏆 বিজয়ী (" + bd(d.winners.length) + ")</h2>" +
      (d.winners.length ? d.winners.map(function (w, i) { return '<div class="it"><div><b>' + bd(i + 1) + ". " + E(w.name) + "</b>" + (window.MCG ? window.MCG.tag(w.device || null, w.name) : "") + " " + (w.dept ? '<span class="tag">' + E(w.dept) + "</span>" : "") + (w.batch ? '<span class="tag">' + E(w.batch) + "</span>" : "") + '</div><div class="row"><input data-note="' + i + '" maxlength="200" placeholder="নোট (ঐচ্ছিক)" value="' + E(w.note || "") + '"><button type="button" class="s d" data-a="rm" data-i="' + i + '">বাদ</button></div>' +
        '<div class="row" style="align-items:center"><label style="flex:1;min-width:140px">🎴 পাবলিক তালিকায় যে কার্ড দেখাবে<select data-cv="' + i + '">' + CVO.map(function (o) { return '<option value="' + o[0] + '"' + ((w.cv || "") === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label>' +
        '<label style="flex:1;min-width:140px">🏆 বিজয়ী কার্ডের ডিজাইন (২০টির মধ্যে)<select data-pd="' + i + '"><option value="">অটো (ডিফল্ট ডিজাইন)</option>' + PZN().map(function (n, k) { return '<option value="' + k + '"' + (w.pd === k ? " selected" : "") + ">" + E(n) + "</option>"; }).join("") + '</select></label>' +
        '<button type="button" class="s wfb" data-a="wcm" data-i="' + i + '">👁 দেখে ডিজাইন বাছুন</button><button type="button" class="s wfb" data-a="ccv" data-i="' + i + '" style="background:#7c3aed;color:#fff">🖼 সব কার্ড দেখে একসাথে বাছুন</button>' + (d.winners.length > 1 ? '<button type="button" class="s wfb" data-a="cpall" data-i="' + i + '" title="এই বিজয়ীর কার্ড-বাছাই ও ডিজাইন সব বিজয়ীতে বসাবে (শুধু ড্রাফটে)">📋 এই বাছাই সবাইকে কপি</button>' : "") + '</div><div class="sm">কার্ড সার্ভারে জমা হয় না — শুধু ডিজাইনের নম্বরটা (একটা ছোট সংখ্যা) থাকে; ইউজারের ফোনেই কার্ড আঁকা হয়।</div>' + ccH(w, i) + '</div>'; }).join("") : '<p class="sm">এখনো কেউ নেই।</p>') +
      '<div class="act" style="margin-top:10px;position:sticky;bottom:0;z-index:5;background:var(--card);padding:8px 0;display:grid;gap:6px"><div class="sm" style="font-weight:700">ℹ️ এই বাটন না চাপলে ঘোষণা, বিজয়ী আর কার্ড বাছাই কিছুই ডাটাবেজে রাখা হবে না।</div><button type="button" class="l" data-a="pubpv" style="font-weight:800">👁 পাবলিকে কেমন দেখাবে (প্রিভিউ)</button><button type="button" data-a="save" style="background:#16a34a;color:#fff;font-size:17px;font-weight:800;padding:14px;border-radius:12px;border:0;width:100%">💾 ঘোষণা সেভ করুন (ডাটাবেজে রাখুন)</button><button type="button" class="l" data-a="reset">নতুন করে শুরু</button></div>';
  }
  function listsH() {
    return '<div class="c"><h2>📝 নতুন কাস্টম লিস্ট</h2><label>লিস্টের নাম<input id="ln" maxlength="80" placeholder="যেমন: ফেসবুক কমেন্টকারী — ১ম সপ্তাহ"></label><label>নাম (প্রতি লাইনে একজন)<textarea id="li" rows="6"></textarea></label><div class="act"><button type="button" data-a="lsave">💾 লিস্ট সেভ</button></div></div>' +
      (ST.lists.length ? ST.lists.map(function (l) { return '<div class="it"><b>' + E(l.name) + '</b> <span class="sm">' + bd((l.items || []).length) + ' জন</span><div class="sm">' + E((l.items || []).slice(0, 8).join(", ")) + ((l.items || []).length > 8 ? "…" : "") + '</div><div class="act"><button type="button" class="s" data-a="luse" data-id="' + l.id + '">🎰 লটারিতে ব্যবহার</button><button type="button" class="s l" data-a="ledit" data-id="' + l.id + '">✏️ সম্পাদনা</button><button type="button" class="s d" data-a="ldel" data-id="' + l.id + '">🗑</button></div></div>'; }).join("") : '<p class="sm">কোনো লিস্ট নেই।</p>');
  }
  // ---------- লটারির সোর্স: সব ইউজার / বাছাই করা ইউজার / ফোল্ডার / আগের বিজয়ী ----------
  var lc = function (x) { return String(x == null ? "" : x).trim().toLowerCase(); };
  // 🎴 প্রতি বিজয়ীর কার্ড-বাছাই: winners[].cv ('' অটো | b দুটোই | w শুধু বিজয়ী কার্ড | s1/s2/s3 শুধু ওই স্কোর কার্ড) ও winners[].pd (বিজয়ী কার্ডের ডিজাইন-নম্বর ০–১৯)। দুটোই ছোট সংখ্যা/কোড — কোনো ছবি সার্ভারে জমে না
  var CVO = [["", "অটো (দুটোই: বিজয়ী কার্ড + স্কোর কার্ড)"], ["b", "দুটোই (বিজয়ী কার্ড + স্কোর কার্ড)"], ["w", "শুধু বিজয়ী কার্ড"], ["s1", "শুধু স্কোর কার্ড — নেভি মেডালিয়ন"], ["s2", "শুধু স্কোর কার্ড — সবুজ উইনার"], ["s3", "শুধু স্কোর কার্ড — গ্লাস রিং"], ["c", "কাস্টম — আমার বাছা কয়েকটা কার্ড (নিচে বাছুন)"]];
  // কাস্টম মাল্টিপল কার্ড বাছাই-প্যানেল (প্রতি বিজয়ীর নিচে): স্কোর কার্ড ৩টি + বিজয়ী কার্ডের ডিজাইনগুলো টিক দিয়ে বাছা, একটা নামে রাখা
  var CCS = [["s1", "নেভি মেডালিয়ন"], ["s2", "সবুজ উইনার"], ["s3", "গ্লাস রিং"]];
  function ccH(w, i) {
    var cur = (w.cs && w.cs.l) || [], on = function (c) { return cur.indexOf(c) >= 0 ? " checked" : ""; };
    var box = function (c, t) { return '<label style="display:inline-flex;gap:4px;align-items:center;margin:2px 8px 2px 0;font-weight:400"><input type="checkbox" data-cc="' + i + '" value="' + c + '"' + on(c) + ">" + E(t) + "</label>"; };
    return '<details class="sm" style="margin-top:6px"' + (cur.length ? " open" : "") + '><summary><b>🎴 কাস্টম: একাধিক কার্ড বাছুন' + (cur.length ? " (" + bd(cur.length) + "টি বাছা — " + E(w.cs.n) + ")" : "") + "</b></summary>" +
      '<div style="margin:6px 0"><button type="button" class="s" data-a="ccv" data-i="' + i + '" style="background:#7c3aed;color:#fff">🖼 সব কার্ডের প্রিভিউ দেখে বাছুন</button></div><div style="margin:6px 0"><b>স্কোর কার্ড</b><br>' + CCS.map(function (c) { return box(c[0], c[1]); }).join("") + "</div>" +
      '<div style="margin:6px 0"><b>বিজয়ী কার্ড (ডিজাইন)</b><br>' + PZN().map(function (n, k) { return box("w" + k, n); }).join("") + "</div>" +
      '<div class="row"><input data-ccn="' + i + '" maxlength="40" placeholder="এই সেটের নাম (যেমন: আমার পছন্দ)" value="' + E((w.cs && w.cs.n) || "") + '"><button type="button" class="s" data-a="ccs" data-i="' + i + '">💾 এই নামে সেভ</button></div>' +
      '<div class="sm">শুধু বাছাইয়ের নির্দেশনা থাকে (কয়েকটা ছোট কোড) — কার্ডের ছবি কোথাও জমা হয় না, ইউজারের ফোনে কার্ড নিজে থেকে আবার আঁকা হবে। ওপরে "কাস্টম" বাছলে এই সেট কাজ করবে।</div></details>';
  }
  var PZN = function () { return window.MCPoster && window.MCPoster.TH ? window.MCPoster.TH.map(function (t) { return t.n; }) : []; };
  // winners = বিজয়ীদের অ্যারে; onPick(index, designNo) দিলে পোস্টার-জানালায় "এই ডিজাইন বাছুন" বাটন আসে (শুধু ফর্মে নম্বর বসে, সার্ভারে কিছু যায় না)
  function posterFor(winners, idx, onPick) {
    if (!window.MCP || !window.MCP.poster) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    var pl = (winners || []).map(function (q) { return { key: "n:" + lc(q.name), name: q.name, device: q.device || "", dept: q.dept || "", batch: q.batch || "", score: q.score == null ? null : q.score, rank: q.rank || null }; });
    if (!pl.length) { alert("এই ঘোষণায় কোনো বিজয়ী নেই।"); return; }
    var pdOf = function (p) { var w0 = (winners || [])[pl.indexOf(p)]; return w0 && w0.pd != null && w0.pd !== "" && PZN()[+w0.pd] ? +w0.pd : null; };
    return window.MCP.poster(pl, idx || 0, onPick ? { designFor: pdOf, status: function (p) { return { d: pdOf(p) }; }, pick: function (p, d) { var k = pl.indexOf(p); if (k < 0) return "বাছা যায়নি"; onPick(k, d); return "ডিজাইন " + (PZN()[d] || d) + " বাছা হয়েছে — নিচে \"ডাটাবেজে সেভ করুন\" চাপুন"; } } : null);
  }
  var isPk = function (v) { v = String(v || ""); return v === "@all" || v === "@pick" || v.indexOf("F:") === 0 || v.indexOf("D:") === 0; };
  function mfFolders() { var MF = window.MCF; try { return MF && MF.folders ? MF.folders() : []; } catch (e) { return []; } }
  function srcLabel(v) {
    v = String(v || ""); if (v === "@all") return "সব ইউজার"; if (v === "@pick") return "বাছাই করা ইউজার";
    if (v.indexOf("F:") === 0) { var f = mfFolders().filter(function (x) { return "F:" + x.id === v; })[0]; return f ? f.name : "ফোল্ডার"; }
    if (v.indexOf("D:") === 0) { var r = ST.rows.filter(function (x) { return "D:" + x.id === v; })[0]; return r ? r.title : "আগের বিজয়ী"; }
    var l = ST.lists.filter(function (x) { return String(x.id) === v; })[0]; return l ? l.name : "";
  }
  function srcSel(cur) {
    var MF = window.MCF, fs = mfFolders(), o = function (v, t) { return '<option value="' + E(v) + '"' + (String(cur) === String(v) ? " selected" : "") + ">" + E(t) + "</option>"; }, grp = function (t, a) { return a.length ? '<optgroup label="' + E(t) + '">' + a.join("") + "</optgroup>" : ""; };
    var nAll = 0; try { nAll = MF && MF.users ? MF.users("all").length : 0; } catch (e) {}
    var haveF = {}; fs.forEach(function (f) { haveF["lottery#" + f.id] = 1; });
    var lists = ST.lists.map(function (l) { return o(String(l.id), l.name + " (" + bd((l.items || []).length) + ")"); });
    var wf = fs.filter(function (f) { return f.kind === "winners"; }).map(function (f) { return o("F:" + f.id, "🏆 " + f.name + " (" + bd(MF.count ? MF.count(f.id) : 0) + ")"); });
    var wd = ST.rows.filter(function (r) { return !haveF[r.source] && (r.winners || []).length; }).map(function (r) { return o("D:" + r.id, "🏅 " + r.title + " (" + bd((r.winners || []).length) + ")"); });
    var cf = fs.filter(function (f) { return f.kind !== "winners" && f.kind !== "smart"; }).map(function (f) { return o("F:" + f.id, "📁 " + f.name + " (" + bd(MF.count ? MF.count(f.id) : 0) + ")"); });
    return o("", "— নেই —") + (MF ? o("@all", "👥 সব ইউজার" + (nAll ? " (" + bd(nAll) + ")" : "")) + o("@pick", "✅ ইউজার বেছে নিন (আলাদা লিস্ট)") : "") + grp("📝 সেভ করা লিস্ট", lists) + grp("🏆 আগের লটারির বিজয়ী (আবার ঢোকাতে)", wf.concat(wd)) + grp("📁 কাস্টম ফোল্ডার", cf);
  }
  function getPeople(v) {
    if (ST.pc[v]) return Promise.resolve(ST.pc[v]);
    var MF = window.MCF, fin = function (arr, again) { var seen = {}, out = []; arr.forEach(function (p) { if (!p.name || seen[p.key]) return; seen[p.key] = 1; if (again) p.again = true; out.push(p); }); ST.pc[v] = out; return out; };
    if (v.indexOf("D:") === 0) {
      var r = ST.rows.filter(function (x) { return "D:" + x.id === v; })[0];
      return Promise.resolve(fin(((r && r.winners) || []).map(function (w) { return { key: "n:" + lc(w.name), name: w.name, device: "", dept: w.dept || "", batch: w.batch || "", score: w.score == null ? null : w.score, rank: null }; }), true));
    }
    if (!MF || !MF.ready) return Promise.resolve(fin([]));
    return MF.ready().then(function () {
      var id = v === "@all" || v === "@pick" ? "all" : v.slice(2), f = MF.folders().filter(function (x) { return String(x.id) === id; })[0];
      return fin(MF.users(id).map(function (u) { return { key: MF.fkey(u.device, u.name), name: u.name, device: u.device || "", dept: u.dept || "", batch: u.batch || "", score: u.score == null ? null : u.score, rank: null }; }), !!(f && f.kind === "winners"));
    });
  }
  function onP(p, v) { var x = DR.sel[p.key]; return x == null ? v !== "@pick" : x; }   // সব ইউজার/ফোল্ডারে ডিফল্ট সবাই বাছা; "বেছে নিন"-এ ডিফল্ট কেউ না
  function pickPool(d) { var v = d.listId, arr = ST.pc[v] || []; return arr.filter(function (p) { return onP(p, v); }); }
  function pkRows(arr, v) {
    var q = lc(DR.pq), lim = DR.pn || 60, idx = [];
    arr.forEach(function (p, i) { if (!q || lc(p.name + " " + p.dept + " " + p.batch).indexOf(q) >= 0) idx.push(i); });
    if (!idx.length) return { idx: idx, h: '<p class="sm">কেউ নেই।</p>' };
    var h = idx.slice(0, lim).map(function (i) {
      var p = arr[i];
      return '<label style="display:flex;gap:8px;align-items:center;padding:5px 0;border-top:1px dashed var(--bd)"><input type="checkbox" style="width:auto;flex:none" data-pi="' + i + '"' + (onP(p, v) ? " checked" : "") + "><span><b>" + E(p.name) + "</b>" + (window.MCFB ? window.MCFB.span(p.device) : "") + " " + (p.dept ? '<span class="tag">' + E(p.dept) + "</span>" : "") + (p.batch ? '<span class="tag">' + E(p.batch) + "</span>" : "") + (p.score != null ? ' <span class="sm">' + bd(p.score) + " মার্ক</span>" : "") + "</span></label>";
    }).join("");
    if (idx.length > lim) h += '<button type="button" class="l s" data-a="pmore">আরও দেখান (' + bd(idx.length - lim) + ")</button>";
    return { idx: idx, h: h };
  }
  function pkHead(arr, v) { var n = arr.filter(function (p) { return onP(p, v); }).length; return "(" + bd(n) + "/" + bd(arr.length) + " বাছা)"; }
  function pkH() {
    var v = DR.listId; if (!isPk(v)) return "";
    var arr = ST.pc[v]; if (!arr) return '<div class="c" style="margin-top:8px"><p class="sm">⏳ ইউজার লোড হচ্ছে…</p></div>';
    var hint = v === "@pick" ? "যাঁদের নিয়ে লটারি করবেন তাঁদের টিক দিন (শুরুতে কেউ বাছা নয়)। চাইলে নিচের বাটনে আলাদা লিস্ট হিসেবে সেভও করা যায়।" : v.indexOf("F:") === 0 || v.indexOf("D:") === 0 ? "ফোল্ডারের যাঁদের লটারিতে রাখতে চান তাঁদের টিক রাখুন, বাকিদের টিক তুলে দিন। আগের বিজয়ী ফোল্ডার/ঘোষণা থেকে বাছলে তাঁরা আবার লটারিতে ঢোকেন।" : "সবাই বাছা আছে; যাঁদের বাদ দিতে চান তাঁদের টিক তুলুন। যাঁরা আগে জিতেছেন তাঁরা বাদ থাকেন — আবার ঢোকাতে \"🏆 আগের লটারির বিজয়ী\" থেকে বাছুন।";
    return '<div class="c" style="margin-top:8px"><h2>👤 নাম বাছাই <span class="sm" id="wpc">' + pkHead(arr, v) + '</span></h2><p class="sm">' + hint + '</p><input id="wq" placeholder="🔎 নাম / বিভাগ / সেশন খুঁজুন" value="' + E(DR.pq || "") + '"><div class="act"><button type="button" class="l s" data-a="pall">✔ দেখা যাওয়া সবাইকে বাছুন</button><button type="button" class="l s" data-a="pnone">✖ কাউকে না</button><button type="button" class="s" data-a="psv">💾 বাছাইটা লিস্ট হিসেবে সেভ</button></div><div id="wpkl">' + pkRows(arr, v).h + "</div></div>";
  }
  function pkRefresh() { var v = DR.listId, arr = ST.pc[v] || [], l = M.$("#wpkl"), c = M.$("#wpc"); if (l) l.innerHTML = pkRows(arr, v).h; if (c) c.textContent = pkHead(arr, v); }
  function ensurePk() {
    var v = DR && DR.listId; if (!isPk(v) || ST.pc[v]) return;
    getPeople(v).then(function () { var w = M.$("#wpkw"); if (DR && DR.listId === v && w) w.innerHTML = pkH(); }).catch(function (e) { var w = M.$("#wpkw"); if (w) w.innerHTML = '<p class="warn">লোড হয়নি: ' + E(e && e.message || e) + "</p>"; });
  }
  function names(d) {
    var L = [];
    if (isPk(d.listId)) L = L.concat(pickPool(d));
    else if (d.listId) { var l = ST.lists.filter(function (x) { return String(x.id) === String(d.listId); })[0]; if (l) L = L.concat(l.items || []); }
    L = L.concat(String(d.paste || "").split(/\r?\n/));
    var seen = {}, out = [], have = {}; d.winners.forEach(function (w) { have[w.name.toLowerCase()] = 1; });
    L.forEach(function (n) { var nm = typeof n === "string" ? String(n).trim() : String(n.name || "").trim(), k = nm.toLowerCase(); if (nm && !seen[k] && !have[k]) { seen[k] = 1; out.push(typeof n === "string" ? nm : n); } });
    return out;
  }
  function spin() {
    grab(); var pool = names(DR), n = Math.min(DR.cnt, pool.length), el = M.$("#wspin");
    if (!pool.length) { alert("লিস্ট ফাঁকা (বা সবাই আগেই বিজয়ী)। লিস্ট বেছে নিন বা নাম পেস্ট করুন।"); return; }
    var src = DR.listId ? srcLabel(DR.listId) : "পেস্ট করা লিস্ট";
    if (window.MCLOT && window.MCLOT.wheel) { // পুরস্কার ট্যাবের লটারির সাথে একই চাকা ও নিয়ম; বিজয়ী ঘোষণায় যোগ হয়ে নিজেই ডাটাবেজে সেভ হয়
      if (window.MCLOT.wheel({ people: pool, count: DR.cnt, fid: DR.id, onDone: function (got) {
        DR.wkeys = DR.wkeys || []; var seen = {}; DR.wkeys.forEach(function (k) { seen[k] = 1; });
        got.forEach(function (g) { var nk = "n:" + String(g.name).trim().toLowerCase(); if (!seen[nk]) { seen[nk] = 1; DR.wkeys.push(nk); } if (g.key && !seen[g.key]) { seen[g.key] = 1; DR.wkeys.push(g.key); } DR.winners.push({ name: g.name, dept: g.dept || "", batch: g.batch || "", rank: g.rank || null, score: g.score == null ? null : g.score, note: "" }); });
        DR.source = "custom: " + (src || ""); paint();
        var say = function (t) { var s = M.$("#wspin"); if (s) s.textContent = t; };
        say("⏳ ফোল্ডারে সেভ হচ্ছে…");
        M.rpc("mc2_draw_save", { p: payload() }).then(function (id) { DR.id = DR.id || id; say("✅ বিজয়ী ফোল্ডারে সেভ হয়েছে"); }).catch(function () { say("⚠️ সেভ হয়নি — নিচের \"💾 ডাটাবেজে সেভ করুন\" চাপুন"); });
      } })) return;
    }
    ST.busy = true; var got = [], left = pool.map(function (x) { return typeof x === "string" ? x : x.name; });
    (function next() {
      if (got.length >= n) { ST.busy = false; got.forEach(function (g) { DR.winners.push({ name: g, dept: "", batch: "", rank: null, score: null, note: "" }); }); DR.source = "custom: " + (src || ""); paint(); return; }
      var t = 0, iv = setInterval(function () { if (el) el.textContent = "🎲 " + left[rnd(left.length)]; t += 70; if (t >= 1300) { clearInterval(iv); var i = rnd(left.length), w = left.splice(i, 1)[0]; got.push(w); if (el) el.textContent = "🏆 " + w; setTimeout(next, 700); } }, 70);
    })();
  }
  // একই বিজয়ীর সেভ-করা কার্ডে একই কোড দুবার, বা এক ডিজাইনের একাধিক সম্পাদিত কপি থাকলে শুধু শেষটা রাখে (ডাটাবেজে বাড়তি কার্ড জমে না)
  function uniqCs(l) { var P = window.MCPoster, out = [], lastE = {}; (l || []).forEach(function (c, i) { if (/^e\d/.test(c) && P && P.codeD) lastE[P.codeD(c)] = i; }); (l || []).forEach(function (c, i) { if (out.indexOf(c) >= 0) return; if (/^e\d/.test(c) && P && P.codeD && lastE[P.codeD(c)] !== i) return; out.push(c); }); return out; }
  function cleanW(ws) { return (ws || []).map(function (w) { if (!w || !w.cs || !w.cs.l) return w; var x = Object.assign({}, w), l = uniqCs(w.cs.l), hx = uniqCs(w.cs.x || []).filter(function (c) { return l.indexOf(c) < 0 && /^e/.test(c); }); x.cs = Object.assign({}, w.cs, { l: l }); if (hx.length) x.cs.x = hx; else delete x.cs.x; return x; }); }
  function payload(d0) { var d = d0 || DR; return { id: d.id, kind: d.kind, date: d.date, title: (d.title || "").trim() || autoTitle(d.kind, d.date), descr: d.descr, show: d.show, winners: cleanW(d.winners), source: d.source, home: d.home, fb: d.fb, fbnames: d.fbnames || [], wkeys: d.wkeys || [], srcs: d.srcs || [] }; }

  // 🖼 সব কার্ড (৩ স্কোর কার্ড + ২০ বিজয়ী ডিজাইন) প্রিভিউসহ এক জানালায়। প্রতি বিজয়ীর বাছাই আলাদা: ওপরের ড্রপডাউনে বিজয়ী বদলালে ওই বিজয়ীর নামে কার্ড আবার আঁকা হয় ও আগের জনের বাছাই মনে থাকে।
  // auto = true হলে (ঘোষণা তালিকা থেকে খুললে) "রাখুন" চাপলেই ডাটাবেজে সেভ হয়।
  // ভাগ ২গ: সেভের আগে "পাবলিকে কেমন দেখাবে" প্রিভিউ — ড্রাফট (DR) থেকে শুধু দেখায়, কিছু সেভ/পাঠায় না। তালিকার সাজ পাবলিক winners.js-এর মতো (শীর্ষ ৩ + বাকিরা),
  // কার্ড আঁকে বিদ্যমান কোড দিয়ে (বিজয়ী কার্ড = poster-draw.js drawCode, স্কোর কার্ড = cards.js render); শীর্ষ ৩ জনের কার্ড দেখায়।
  function pubPreview() {
    var ws = (DR.winners || []).slice(); if (!ws.length) { alert("এখনো কোনো বিজয়ী নেই।"); return; }
    var P = window.MCPoster, MCc = window.MCCards, Dd = window.MC || {}, dead = false, seq = 0;
    var dl = function (d) { try { return Dd.deptLabel ? Dd.deptLabel(d) : d; } catch (e) { return d; } };
    var pct = function (w) { var n = +w.score; return n > 0 ? Math.min(100, Math.round(n / 10)) : null; };
    var cvName = function (w) { var v = w.cv || "", o = CVO.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : "অটো"; };
    var pdName = function (w) { return w.pd != null && w.pd !== "" && PZN()[+w.pd] ? PZN()[+w.pd] : "ডিফল্ট (১ম)"; };
    var sub = function (w) { return [w.dept ? dl(w.dept) : "", w.batch].filter(Boolean).join(" · "); };
    var ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);overflow:auto;padding:10px";
    var top = ws.slice(0, 3), ord = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
    var pod = '<div style="display:flex;gap:6px;align-items:flex-end;justify-content:center">' + ord.map(function (ix) {
      var w = top[ix], c = ix === 0 ? "👑 WINNER" : ix === 1 ? "SILVER" : "BRONZE", pc = pct(w);
      return '<div style="flex:1;min-width:0;background:#fff;color:#10261b;border:1px solid #d5e0d8;border-radius:14px;padding:8px 6px;text-align:center;' + (ix === 0 ? "padding-bottom:12px;border-color:#d98200" : "") + '"><div style="font-size:11px;font-weight:800;color:#d98200">' + c + '</div><b style="display:block;overflow-wrap:anywhere">' + E(w.name) + '</b>' + (sub(w) ? '<small style="display:block;color:#5a6b61">' + E(sub(w)) + "</small>" : "") + (w.score ? '<div style="font-weight:800">' + bd(w.score) + "</div>" : "") + (pc != null ? '<div class="sm">' + bd(pc) + " শতাংশ জানি</div>" : "") +
        '<div class="sm" style="margin-top:4px">🎴 ' + E(cvName(w)) + "<br>🏆 " + E(pdName(w)) + '</div><div data-pvc="' + ix + '" style="margin-top:4px;display:grid;gap:4px"><span class="sm">⏳ কার্ড আঁকা হচ্ছে…</span></div></div>';
    }).join("") + "</div>";
    var rest = ws.slice(3), rows = rest.slice(0, 30).map(function (w, i) { return '<div style="display:flex;gap:8px;align-items:baseline;padding:6px 2px;border-top:1px dashed #c9d6cd;overflow-wrap:anywhere"><b style="min-width:26px;color:#d98200">' + bd(4 + i) + "</b><div style=\"flex:1;min-width:0\">" + E(w.name) + (sub(w) ? ' <span class="sm">' + E(sub(w)) + "</span>" : "") + (w.cv || w.pd != null ? '<div class="sm">🎴 ' + E(cvName(w)) + " · 🏆 " + E(pdName(w)) + "</div>" : "") + "</div>" + (w.score ? "<em>" + bd(w.score) + "</em>" : "") + "</div>"; }).join("");
    ov.innerHTML = '<div style="background:Canvas;color:CanvasText;max-width:560px;margin:0 auto;border-radius:14px;padding:12px;display:grid;gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>👁 পাবলিকে এমন দেখাবে</b><button type="button" class="l s" data-x="1">✕ বন্ধ</button></div><p class="sm" style="margin:0">⚠️ এটা ড্রাফটের প্রিভিউ — এখনো সেভ হয়নি। কিছু সেভ বা প্রকাশ হয় না। ' + (DR.show ? "" : "<b>(\"বিজয়ী পেজের ড্রপডাউনে দেখান\" টিক বন্ধ — সেভ করলেও ওই তালিকায় আসবে না; হোমের টিক আলাদা।)</b>") + '</p>' +
      '<div style="background:#fff;color:#10261b;border:1px solid #d5e0d8;border-radius:14px;padding:10px"><div class="sm">' + E(DR.date || "") + '</div><div style="font-weight:800">🏆 ' + E(DR.title || "(শিরোনাম নেই)") + " · " + bd(ws.length) + " জন</div>" + (DR.descr ? '<div class="sm" style="white-space:pre-wrap">' + E(DR.descr) + "</div>" : "") + "</div>" + pod +
      '<div style="background:#fff;color:#10261b;border:1px solid #d5e0d8;border-radius:14px;padding:6px 10px">' + (rows || '<div class="sm">৩ জনের বেশি বিজয়ী নেই।</div>') + (rest.length > 30 ? '<div class="sm">…আরও ' + bd(rest.length - 30) + " জন (প্রথম ৩০ জন দেখানো)</div>" : "") + "</div></div>";
    document.body.appendChild(ov);
    var close = function () { dead = true; ov.remove(); }; ov.onclick = function (e) { if (e.target === ov || (e.target.dataset && e.target.dataset.x)) close(); };
    // শীর্ষ ৩ জনের কার্ড: ডিফল্ট/অটো/"b"/"w" = বিজয়ী কার্ড (pd), s1..s3 = ওই স্কোর কার্ড, c = বাছা কার্ডের প্রথম ২টি; একটা একটা করে আঁকে
    var small = function (cv) { var c = document.createElement("canvas"); c.width = 220; c.height = Math.round(cv.height * 220 / cv.width); c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .8); };
    var L = null, chain = Promise.resolve();
    top.forEach(function (w, ix) {
      var box = ov.querySelector('[data-pvc="' + ix + '"]'); if (!box) return;
      var rec = { name: w.name, dept: w.dept || "", batch: w.batch || "", score: w.score == null ? 0 : w.score, pct: w.score == null ? 0 : Math.round(w.score / 10), ok: w.score == null ? 0 : Math.round(w.score / 100), total: 10, rank: w.rank || 1, drank: 1, ts: Date.now(), title: "", club: "" };
      var pp = { name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score };
      var cv = w.cv || "", codes = cv === "c" ? ((w.cs && w.cs.l) || []).slice(0, 2) : /^s\d$/.test(cv) ? [cv] : ["w" + (w.pd != null && w.pd !== "" && PZN()[+w.pd] ? +w.pd : 0)];
      if (cv === "c" && !codes.length) { box.innerHTML = '<span class="sm warn">⚠️ কাস্টম মোড কিন্তু কোনো কার্ড বাছা নেই — পাবলিকে কিছু দেখাবে না</span>'; return; }
      box.innerHTML = ""; var tiles = codes.map(function (c) { var d = document.createElement("div"); d.style.cssText = "aspect-ratio:4/5;display:grid;place-items:center;background:#0b1a13;color:#fff;border-radius:8px;overflow:hidden;font-size:12px"; d.textContent = "⏳"; box.appendChild(d); return { c: c, d: d }; });
      tiles.forEach(function (tl) {
        chain = chain.then(function () {
          if (dead) return; var put = function (cvs) { if (dead) return; var im = new Image(); im.src = small(cvs); im.style.cssText = "width:100%;display:block"; tl.d.textContent = ""; tl.d.style.display = "block"; tl.d.appendChild(im); };
          if (tl.c.charAt(0) === "s") return MCc ? MCc.render(rec, null, "card" + tl.c.charAt(1)).then(put) : Promise.reject();
          if (!P || !P.drawCode) return Promise.reject();
          return (L ? Promise.resolve(L) : Promise.all([P.li(Dd.logos && Dd.logos.mc), P.li(Dd.logos && Dd.logos.nu), window.mcLogo && window.mcLogo.forType ? window.mcLogo.forType("p").catch(function () { return null; }) : null]).then(function (x) { return (L = x[2] ? [x[2][0] || x[0], x[2][1] || x[1]] : [x[0], x[1]]); })).then(function (lg) { return P.lgFor(tl.c, lg).then(function (lg2) { put(P.drawCode(pp, null, tl.c, lg2, 1)); }); });
        }).catch(function () { tl.d.textContent = "আঁকা যায়নি"; }).then(function () { return new Promise(function (r2) { setTimeout(r2, 20); }); });
      });
    });
  }
  function ccView(i0, auto) {
    var P = window.MCPoster, MC = window.MCCards, Dd = window.MC || {}, cur = i0, dead = false, tiles = [], L = null, seq = 0, TB = "w";
    if (!DR.winners[cur]) return;
    if (!P) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    var pend = DR.winners.map(function (w) { var l0 = ((w.cs && w.cs.l) || []).slice(); return { l: l0, n: (w.cs && w.cs.n) || "", x: l0.filter(function (c) { return /^e\d/.test(c); }).concat(((w.cs && w.cs.x) || []).filter(function (c) { return /^e\d/.test(c) && l0.indexOf(c) < 0; })) }; });   // x = এই বিজয়ীর সম্পাদিত কার্ডের কোড
    var old = document.getElementById("ccvm"); if (old) old.remove();
    var list = []; if (MC) CCS.forEach(function (c) { list.push({ c: c[0], t: "স্কোর কার্ড — " + c[1] }); });
    PZN().forEach(function (n, k) { list.push({ c: "w" + k, t: "বিজয়ী কার্ড — " + n }); });
    var ov = document.createElement("div"); ov.id = "ccvm"; ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(8,16,12,.94);overflow:auto;padding:10px";
ov.innerHTML = '<div style="position:sticky;top:-10px;z-index:2;background:#0b1a13;padding:8px;margin:-10px -10px 8px;border-bottom:1px solid #345;display:grid;gap:8px;color:#fff">' +
      '<div style="display:flex;gap:6px;align-items:center"><b style="flex:1;font-size:15px">🎴 কার্ড বাছাই</b><button type="button" class="s d" id="ccvx">✕ বন্ধ</button></div>' +
      '<div style="display:flex;gap:6px;align-items:center"><button type="button" class="s l" id="ccvp">◀</button><select id="ccvw" style="flex:1;min-width:0">' + DR.winners.map(function (w, k) { return '<option value="' + k + '">' + bd(k + 1) + ". " + E(w.name) + "</option>"; }).join("") + '</select><button type="button" class="s l" id="ccvnx">▶</button></div>' +
      '<div style="display:flex;gap:6px"><button type="button" class="s" id="ccvtw" style="flex:1;padding:10px 6px;font-weight:800">🏆 বিজয়ী কার্ড</button><button type="button" class="s" id="ccvts" style="flex:1;padding:10px 6px;font-weight:800">🪪 স্কোর কার্ড</button></div>' +
      '<div id="ccvsum" style="background:#14261c;border:1px solid #2f5;border-radius:10px;padding:8px;text-align:center;font-weight:800;font-size:15px"></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button type="button" class="s" id="ccvall">☑ এই ট্যাবের সব টিক</button><button type="button" class="s l" id="ccvno">☐ সব বাদ</button><input id="ccvn" maxlength="40" placeholder="এই বিজয়ীর সেটের নাম" style="flex:1;min-width:130px"><b id="ccvc" style="display:none"></b></div>' +
      '<div style="border:2px solid #16a34a;border-radius:12px;padding:8px;display:grid;gap:6px"><div style="font-weight:800;font-size:13px">💾 সেভ <span style="font-weight:400;color:#9fd">— কার্ডে ট্যাপ করলেই সাথে সাথে ডাটাবেজে সেভ হয়</span></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="s" id="ccv1" style="flex:1;min-width:140px;background:#16a34a;color:#fff;padding:9px 6px">💾 এই বিজয়ীর সেভ</button><button type="button" class="s" id="ccvok" style="flex:1;min-width:140px;background:#15803d;color:#fff;padding:9px 6px">✅ সব বিজয়ীর সেভ</button><button type="button" class="s" id="ccvchk" style="flex:1;min-width:140px;background:#0ea5e9;color:#fff;padding:9px 6px">🔎 ডাটাবেজ পরীক্ষা</button></div>' +
      '<div id="ccvst" style="font-size:13px;font-weight:700;color:#cde;min-height:18px"></div></div></div><div id="ccvck" class="sm" style="color:#cde;padding:2px 4px;display:none"></div>' +
      '<div id="ccvg" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px"></div>' +
      '<div id="ccvbar" style="position:sticky;bottom:-10px;z-index:2;background:#0b1a13;margin:12px -10px -10px;padding:10px;border-top:1px solid #345;display:flex;gap:8px;align-items:center;color:#fff"><button type="button" class="s l" id="ccvp2">◀ আগের</button><span id="ccvi" style="flex:1;text-align:center;font-weight:700;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span><button type="button" class="s" id="ccvn2" style="background:#2563eb;color:#fff">পরের ▶</button></div>' +
      '<div id="ccvz" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.92);align-items:center;justify-content:center;padding:10px"><img style="max-width:100%;max-height:100%;border-radius:8px"></div>';
    document.body.appendChild(ov);
    var g = ov.querySelector("#ccvg"), cnt = ov.querySelector("#ccvc"), nm = ov.querySelector("#ccvn"), sw = ov.querySelector("#ccvw");
    var dirty = false, WARN = "⚠️ আপনার করা বাছাই/সম্পাদনা এখনো ডাটাবেজে রাখা হয়নি। এভাবে বন্ধ করলে সব হারিয়ে যাবে।\n\nতবুও সেভ না করে বন্ধ করবেন?\n(না চাপুন, তারপর লাল \"সেভ করুন\" বাটন চাপুন)", onUnload = function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; return ""; } };   // না-রাখা বদলে বের হতে গেলে সতর্কতা
    window.addEventListener("beforeunload", onUnload); nm.addEventListener("input", function () { dirty = true; mark(); });
    var isS = function (c) { return c.charAt(0) === "s"; }, stE = ov.querySelector("#ccvst"), setSt = function (m, bad) { if (stE) { stE.textContent = m; stE.style.color = bad ? "#fca5a5" : "#bbf7d0"; } }, inflight = 0, Q = Promise.resolve();
    function mark() { var sel = pend[cur].l, ns = sel.filter(isS).length, nw = sel.length - ns; cnt.textContent = "(" + (TB === "s" ? bd(ns) : bd(nw)) + "টি বাছা)"; var ok = ov.querySelector("#ccvok"); if (ok) { ok.textContent = dirty ? "🔴 সব বিজয়ীর সেভ — বদল সেভ হয়নি" : "✅ সব বিজয়ীর সেভ — সব সেভ আছে"; ok.style.background = dirty ? "#dc2626" : "#15803d"; ok.style.animation = ""; } var sm = ov.querySelector("#ccvsum"); if (sm) sm.innerHTML = "✅ এই বিজয়ীর বাছা: <span style=\"color:#4ade80;font-size:20px\">" + bd(sel.length) + "টি</span> <span style=\"font-weight:400;font-size:12px\">(🏆 " + bd(nw) + " · 🪪 " + bd(ns) + ")</span> · এই ট্যাবে <span style=\"color:#4ade80;font-size:20px\">" + (TB === "s" ? bd(ns) : bd(nw)) + "</span>/" + bd(tiles.length) + "টির মধ্যে"; var tw = ov.querySelector("#ccvtw"), ts = ov.querySelector("#ccvts"); if (tw && ts) { tw.textContent = "🏆 বিজয়ী কার্ড বাছুন (" + bd(nw) + ")"; ts.textContent = "🪪 স্কোর কার্ড বাছুন (" + bd(ns) + ")"; tw.className = "s" + (TB === "w" ? "" : " l"); ts.className = "s" + (TB === "s" ? "" : " l"); } tiles.forEach(function (t) { var k = sel.indexOf(t.c); var on = k >= 0, st = t.el.querySelector(".st"); if (!st) { st = document.createElement("div"); st.className = "st"; st.style.cssText = "margin-top:3px;border-radius:6px;padding:3px 2px;font-weight:800;font-size:10.5px"; t.el.insertBefore(st, t.el.querySelector(".zm")); }
        t.el.style.outline = on ? "4px solid #22c55e" : "2px dashed #567"; t.el.style.opacity = on ? "1" : ".5"; t.el.style.boxShadow = on ? "0 0 14px #22c55e99" : "none"; t.ph.style.filter = on ? "none" : "grayscale(1)";
        t.bd.textContent = on ? "✔" : ""; t.bd.style.display = "grid"; t.bd.style.background = on ? "#22c55e" : "#0008"; t.bd.style.border = on ? "2px solid #fff" : "2px dashed #fff9";
        st.textContent = on ? "✔ বাছা আছে (" + bd(k + 1) + " নং)" : "○ বাছা নেই"; st.style.background = on ? "#16a34a" : "#334155"; st.style.color = on ? "#fff" : "#cbd5e1"; if (t.hm && !t.hm.disabled) { t.hm.textContent = k >= 0 ? "➖ হোম থেকে সরান" : "➕ হোমে দিন"; t.hm.style.background = k >= 0 ? "#d97706" : "#16a34a"; } }); }
    function shrink(cv, wd, q) { var r = wd / cv.width, c = document.createElement("canvas"); c.width = wd; c.height = Math.round(cv.height * r); c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", q); }
    function put(t, cv) { t.big = shrink(cv, 720, .85); t.ph.innerHTML = ""; var im = new Image(); im.src = shrink(cv, 300, .8); im.style.cssText = "width:100%;display:block"; t.ph.style.display = "block"; t.ph.appendChild(im); }
    function show(k, top) {
      pend[cur].n = nm.value; cur = k; sw.value = String(k); nm.value = pend[k].n; tiles = []; g.innerHTML = ""; var my = ++seq, w = DR.winners[k];
      var rec = { name: w.name, dept: w.dept || "", batch: w.batch || "", score: w.score == null ? 0 : w.score, pct: w.score == null ? 0 : Math.round(w.score / 10), ok: w.score == null ? 0 : Math.round(w.score / 100), total: 10, rank: w.rank || 1, drank: 1, ts: Date.now(), title: "", club: "" };
      var p = { name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score };
      var lst = list.concat(pend[k].x.map(function (c) { return { c: c, t: "✏️ সম্পাদিত — " + (PZN()[P.codeD(c)] || "") }; }));
      lst = lst.filter(function (o) { return TB === "s" ? isS(o.c) : !isS(o.c); });
      lst.forEach(function (o) {
        var el = document.createElement("div"); el.style.cssText = "position:relative;background:#14261c;border-radius:8px;padding:3px;cursor:pointer;color:#fff;font-size:11px;text-align:center";
        el.innerHTML = '<div class="ph" style="aspect-ratio:4/5;display:grid;place-items:center;background:#0b1a13;border-radius:8px;overflow:hidden">⏳</div><div style="margin-top:3px">' + E(o.t) + '</div><span class="bd" style="display:none;position:absolute;top:8px;left:8px;width:26px;height:26px;border-radius:50%;background:#22c55e;color:#fff;font-weight:800;place-items:center"></span><button type="button" class="zm" style="position:absolute;top:8px;right:8px;border:0;border-radius:8px;padding:2px 7px;background:#000a;color:#fff">🔍</button>' + (o.c.charAt(0) === "s" ? "" : '<button type="button" class="ed" style="margin-top:3px;width:100%;border:0;border-radius:6px;padding:3px 2px;font-size:11px;background:#7c3aed;color:#fff;font-weight:700">✏️ সম্পাদনা</button>') + (o.c.charAt(0) === "e" ? '<button type="button" class="dl" style="margin-top:3px;width:100%;border:0;border-radius:6px;padding:3px 2px;font-size:11px;background:#e11d48;color:#fff;font-weight:700">🗑 ডিলেট</button>' : "") + '';
        var t = { c: o.c, el: el, bd: el.querySelector(".bd"), hm: el.querySelector(".hm"), ph: el.querySelector(".ph"), big: "" }; tiles.push(t); g.appendChild(el);
        el.onclick = function (e) { if (e.target.className === "hm") { e.stopPropagation(); homeToggle(t); return; } if (e.target.className === "ed") { e.stopPropagation(); edit(o); return; } if (e.target.className === "dl") { e.stopPropagation(); if (!confirm("এই সম্পাদিত কার্ডটা ডিলেট করবেন?")) return; var qq = pend[cur]; qq.x = qq.x.filter(function (c) { return c !== o.c; }); qq.l = qq.l.filter(function (c) { return c !== o.c; }); dirty = true; show(cur); return; } if (e.target.className === "zm") { if (t.big) { var z = ov.querySelector("#ccvz"); z.firstChild.src = t.big; z.style.display = "flex"; } return; } homeToggle(t); };
      });
      mark();
      var nn = DR.winners.length, bar = ov.querySelector("#ccvbar"), inf = ov.querySelector("#ccvi"), n2 = ov.querySelector("#ccvn2");
      if (bar) { bar.style.display = nn > 1 ? "flex" : "none"; inf.textContent = bd(k + 1) + "/" + bd(nn) + " · " + w.name; n2.textContent = k === nn - 1 ? "↻ প্রথমজনে" : "পরের: " + (DR.winners[k + 1].name || "").slice(0, 14) + " ▶"; }
      if (top) ov.scrollTop = 0;
      var chain = Promise.resolve();
      tiles.forEach(function (t) {
        chain = chain.then(function () {
          if (dead || my !== seq) return;
          if (t.c.charAt(0) === "s") return MC.render(rec, null, "card" + t.c.charAt(1)).then(function (cv) { if (!dead && my === seq) put(t, cv); }).catch(function () { t.ph.textContent = "আঁকা যায়নি"; });
          return (L ? Promise.resolve(L) : Promise.all([P.li(Dd.logos && Dd.logos.mc), P.li(Dd.logos && Dd.logos.nu), window.mcLogo && window.mcLogo.forType ? window.mcLogo.forType("p").catch(function () { return null; }) : null]).then(function (x) { return (L = x[2] ? [x[2][0] || x[0], x[2][1] || x[1]] : [x[0], x[1]]); })).then(function (lg) {
            if (dead || my !== seq) return; return P.lgFor(t.c, lg).then(function (lg2) { if (dead || my !== seq) return; put(t, P.drawCode(p, null, t.c, lg2, 1)); });
          }).catch(function () { t.ph.textContent = "আঁকা যায়নি"; });
        }).then(function () { return new Promise(function (r) { setTimeout(r, 20); }); });
      });
    }
    // ✏️ যেকোনো বিজয়ী কার্ড ইচ্ছামতো সম্পাদনা (লেখা, তথ্য, ডিজাইন, রঙ, QR…) → ডাউনলোড ও 💾 সেভ; সেভ = সরাসরি ডাটাবেজে (সার্ভার থেকে আবার পড়ে মিলিয়ে দেখে), শুধু ছোট কোড, ছবি জমা হয় না
    function edit(o) {
      if (!window.MCP || !window.MCP.poster || !P.enc) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
      var kk = cur, w = DR.winners[kk], isE = o.c.charAt(0) === "e", ed = isE ? P.dec(o.c) : null, oldC = isE ? o.c : null;
      if (isE && !ed) { alert("এই সম্পাদিত কার্ড খোলা যায়নি।"); return; }
      var person = { key: "n:" + lc(w.name), name: w.name, device: w.device || "", dept: w.dept || "", batch: w.batch || "", score: w.score == null ? null : w.score, rank: w.rank || null };
      window.MCP.poster([person], 0, { fresh: true, base: ed ? Object.assign({}, ed.s, { d: ed.d }) : { d: P.codeD(o.c) }, pv: ed ? ed.v : {}, has: function () { return !!oldC; }, del: function () { var qq = pend[kk]; if (oldC) { qq.x = qq.x.filter(function (c) { return c !== oldC; }); qq.l = qq.l.filter(function (c) { return c !== oldC; }); oldC = null; dirty = true; if (!dead && cur === kk) show(kk); } }, saveShow: function (p0, S, ov) { return this.save(p0, S, ov, true); }, save: function (p0, S, ov, toHome) {
        var code = P.enc(S, ov); if (!code) return "⚠️ লেখা বেশি লম্বা হওয়ায় সেভ করা গেল না — একটু ছোট করুন।";
        var q = pend[kk], dd = P.codeD(code), pos = -1, wasL = false;   // এক ডিজাইনের একটাই সম্পাদিত কপি; আগেরটা বাছা (টিক) ছিল তো নতুনটাও সেই জায়গায় বাছা থাকে, নইলে নতুনটা শুধু সেভ হয় (হোমে নয়)
        var olds = q.x.filter(function (c) { return c !== code && /^e/.test(c) && P.codeD(c) === dd; }); if (oldC && oldC !== code && olds.indexOf(oldC) < 0) olds.push(oldC);
        olds.forEach(function (c) { var at = q.l.indexOf(c); if (at >= 0) { if (pos < 0) pos = at; wasL = true; q.l.splice(at, 1); } q.x = q.x.filter(function (z) { return z !== c; }); });
        if (q.x.indexOf(code) < 0) q.x.push(code); if (wasL && q.l.indexOf(code) < 0) q.l.splice(pos, 0, code); if (toHome && q.l.indexOf(code) < 0) q.l.push(code);
        oldC = code; dirty = true; if (!dead && cur === kk) show(kk);
        if (!DR.id) return "⚠️ ডাটাবেজে সেভ হয়নি — এই ঘোষণাটাই এখনো ডাটাবেজে নেই। আগে ঘোষণা সেভ করুন, তারপর আবার এই কার্ড সেভ করুন (কার্ডটা আপাতত তালিকায় আছে)।";
        pend[kk].n = pend[kk].n || ""; apply();
        return M.rpc("mc2_draw_save", { p: payload() }).then(function (id) { DR.id = DR.id || id; window.MCW_FORGET(); return window.MCW_LIST(); }).then(function (rows) {   // সার্ভার থেকে আবার পড়ে মিলিয়ে দেখা: সত্যিই থাকলে তবেই "সেভ হয়েছে"
          refSt(rows); var r = (rows || []).filter(function (x) { return x.id === DR.id; })[0], sw2 = r && (r.winners || []).filter(function (x) { return lc(x.name) === lc(w.name); })[0];
          if (!sw2 || !sw2.cs || csAll(sw2.cs).indexOf(code) < 0 || (toHome && (sw2.cs.l || []).indexOf(code) < 0)) throw new Error("সার্ভার কার্ডটা রাখেনি। সম্ভবত supabase-new-20261203.sql এখনো চালানো হয়নি — ওটা Supabase > SQL Editor-এ একবার Run করে আবার সেভ করুন।");
          dirty = false; return (toHome ? "👁 হোমে দেখানোর তালিকাতেও যোগ হয়েছে। " : "") + "✅ ডাটাবেজে সত্যিই সেভ হয়েছে (সার্ভার থেকে আবার পড়ে মিলিয়ে দেখা হয়েছে) — " + w.name + "-এর সেভ-করা কার্ড হিসেবে আছে। হোমে দেখাতে কার্ডের ➕ হোমে দিন চাপুন বা 👁 সেভ + হোমে দেখান বাটন ব্যবহার করুন (আগে থেকে হোমে থাকলে হোমেই থাকে)। আবার বদলে সেভ করলে শুধু শেষটাই থাকবে; ভুল হলে নিচের 🗑 ডিলেট চাপুন।";
        });
      }, verify: function (p0, S, ov) {
        var code = P.enc(S, ov); if (!code) return "⚠️ লেখা বেশি লম্বা — কোড বানানো যায়নি।";
        if (!DR.id) return "⚠️ ঘোষণাটাই এখনো ডাটাবেজে নেই।";
        return window.MCW_LIST().then(function (rows) { refSt(rows);
          var r = (rows || []).filter(function (x) { return x.id === DR.id; })[0], sw2 = r && (r.winners || []).filter(function (x) { return lc(x.name) === lc(w.name); })[0], l = csAll(sw2 && sw2.cs);
          if (l.indexOf(code) >= 0) return "✅ নিশ্চিত: এই কার্ডের হুবহু বর্তমান সংস্করণ ডাটাবেজে আছে (সার্ভার থেকে এইমাত্র পড়া)।";
          var dd = P.codeD(code), other = l.filter(function (c) { return /^e/.test(c) && P.codeD(c) === dd; }).length;
          return other ? "⚠️ ডাটাবেজে এই ডিজাইনের একটা সম্পাদিত কার্ড আছে, কিন্তু এখনকার বদলগুলো সেভ হয়নি — 💾 সেভ চাপুন।" : "❌ এই কার্ড ডাটাবেজে নেই — 💾 সেভ চাপুন।";
        });
      } });
    }
    // ➕/➖ প্রতিটা কার্ডে এক ক্লিকে হোমে দেখানো/সরানো — সরাসরি ডাটাবেজে (সার্ভার থেকে আবার পড়ে মিলিয়ে); ব্যর্থ হলে আগের অবস্থায় ফেরে
    // কার্ডে ট্যাপ = বাছা/বাদ + সাথে সাথে ডাটাবেজে সেভ (ঘোষণা আগে থেকে ডাটাবেজে থাকলে); ক্রমানুসারে চলে, শেষ সেভ ঠিক অবস্থা রাখে
    function homeToggle(t) {
      var kk = cur, w = DR.winners[kk], sel = pend[kk].l, at = sel.indexOf(t.c), want = at < 0;
      if (want) sel.push(t.c); else sel.splice(at, 1);
      pend[kk].n = nm.value; dirty = true; mark();
      if (!DR.id) { setSt("⚠️ ঘোষণাটা এখনো ডাটাবেজে নেই — বাছাই শুধু এখানে আছে। শেষে \"💾 সেভ করুন\" চাপুন।", true); return; }
      inflight++; setSt("⏳ সেভ হচ্ছে…");
      Q = Q.then(function () {
        apply();
        return M.rpc("mc2_draw_save", { p: payload() }).then(function (id) { DR.id = DR.id || id; window.MCW_FORGET(); return window.MCW_LIST(); }).then(function (rows) { refSt(rows);
          if (inflight > 1) return;
          var r = (rows || []).filter(function (x) { return x.id === DR.id; })[0], sw2 = r && (r.winners || []).filter(function (x) { return lc(x.name) === lc(w.name); })[0], on = !!(sw2 && sw2.cs && (sw2.cs.l || []).indexOf(t.c) >= 0), now = pend[kk].l.indexOf(t.c) >= 0;
          if (on !== now) throw new Error("সার্ভারে অবস্থা বদলায়নি" + (now && /^e/.test(t.c) ? " — সম্ভবত supabase-new-20261205.sql এখনো চালানো হয়নি।" : "।"));
          dirty = false; setSt("✅ " + w.name + " — ডাটাবেজে সেভ হয়েছে (" + (now ? "বাছা হলো" : "বাদ গেল") + ")");
        });
      }).catch(function (e) { var i2 = pend[kk].l.indexOf(t.c); if (want && i2 >= 0) pend[kk].l.splice(i2, 1); else if (!want && i2 < 0) pend[kk].l.push(t.c); mark(); setSt("❌ সেভ হয়নি — আগের অবস্থায় ফেরানো হলো", true); M.fail(e); }).then(function () { inflight--; });
    }
    ov.querySelector("#ccv1").onclick = function () {   // 💾 শুধু এই বিজয়ীর বাছাই সেভ (অন্যদের না ছুঁয়ে)
      if (!DR.id) { alert("⚠️ ঘোষণাটাই এখনো ডাটাবেজে নেই — আগে \"💾 সেভ করুন\" চাপুন।"); return; }
      var b = this, w = DR.winners[cur]; pend[cur].n = nm.value; csSet(w, pend[cur].n, pend[cur].l, pend[cur].x); b.disabled = true; setSt("⏳ " + w.name + "-এর বাছাই সেভ হচ্ছে…");
      Q = Q.then(function () { return M.rpc("mc2_draw_save", { p: payload() }); }).then(function (id) { DR.id = DR.id || id; window.MCW_FORGET(); setSt("✅ " + w.name + " — শুধু এই বিজয়ীর বাছাই ডাটাবেজে সেভ হয়েছে"); }).catch(function (e) { setSt("❌ সেভ হয়নি", true); M.fail(e); }).then(function () { b.disabled = false; });
    };
  function apply() { var n = 0; DR.winners.forEach(function (w, k) { var q = pend[k]; if (q.l.length) n++; csSet(w, q.n, q.l, q.x); }); return n; }   // টিক-করা = হোমে দেখায়; টিক-ছাড়া সম্পাদিত কার্ড মোছে না, "সেভ-করা (হোমে নয়)" হয়ে থাকে
    function close() { dead = true; seq++; window.removeEventListener("beforeunload", onUnload); ov.remove(); }
    ov.querySelector("#ccvz").onclick = function () { this.style.display = "none"; };
    sw.onchange = function () { show(+sw.value, true); };
    var goP = function () { show((cur + DR.winners.length - 1) % DR.winners.length, true); }, goN = function () { show((cur + 1) % DR.winners.length, true); };
    ov.querySelector("#ccvp").onclick = goP; ov.querySelector("#ccvnx").onclick = goN; ov.querySelector("#ccvp2").onclick = goP; ov.querySelector("#ccvn2").onclick = goN;
    ov.querySelector("#ccvx").onclick = function () { if (dirty && !confirm(WARN)) return; if (savedOnce && auto) { close(); afterClose(); return; } ST.ext = null; var cx = ST.extX; ST.extX = null; close(); if (cx) { try { cx(); } catch (e) {} } };
    ov.querySelector("#ccvall").onclick = function () { var tc = tiles.map(function (t) { return t.c; }); pend[cur].l = pend[cur].l.filter(function (c) { return tc.indexOf(c) < 0; }).concat(tc); dirty = true; mark(); };
    ov.querySelector("#ccvno").onclick = function () { var tc = tiles.map(function (t) { return t.c; }); pend[cur].l = pend[cur].l.filter(function (c) { return tc.indexOf(c) < 0; }); dirty = true; mark(); };
    ov.querySelector("#ccvtw").onclick = function () { if (TB !== "w") { TB = "w"; show(cur, true); } };
    ov.querySelector("#ccvts").onclick = function () { if (TB !== "s") { TB = "s"; show(cur, true); } };
    ov.querySelector("#ccvchk").onclick = function () {   // 🔎 ডাটাবেজ পরীক্ষা: সার্ভার থেকে এইমাত্র পড়ে এই বিজয়ীর প্রতিটা কার্ডের সত্যিকারের অবস্থা দেখায়
      var b = this, box = ov.querySelector("#ccvck"), kk = cur, w = DR.winners[kk]; box.style.display = "block"; box.textContent = "⏳ ডাটাবেজ থেকে পড়ে দেখা হচ্ছে…"; b.disabled = true;
      if (!DR.id) { b.disabled = false; box.textContent = "⚠️ এই ঘোষণাটাই এখনো ডাটাবেজে নেই — আগে ঘোষণা সেভ করুন।"; return; }
      window.MCW_FORGET(); window.MCW_LIST().then(function (rows) { refSt(rows);
        var r = (rows || []).filter(function (x) { return x.id === DR.id; })[0], sw2 = r && (r.winners || []).filter(function (x) { return lc(x.name) === lc(w.name); })[0], sl = (sw2 && sw2.cs && sw2.cs.l) || [], sx = (sw2 && sw2.cs && sw2.cs.x) || [], bad = 0;
        tiles.forEach(function (t) { var tag = t.el.querySelector(".ck"); if (!tag) { tag = document.createElement("div"); tag.className = "ck"; tag.style.cssText = "margin-top:3px;font-size:11px;font-weight:700"; t.el.appendChild(tag); }
          var inL = sl.indexOf(t.c) >= 0, inX = sx.indexOf(t.c) >= 0, loc = pend[kk].l.indexOf(t.c) >= 0, e = /^e/.test(t.c), txt, col;
          if (inL) { txt = "✅ ডাটাবেজে আছে · 👁 হোমে দেখায়"; col = "#86efac"; if (!loc) { txt += " (এখানে টিক নেই — রাখুন চাপলে সরবে)"; col = "#fcd34d"; bad++; } }
          else if (inX) { txt = "✅ ডাটাবেজে সেভ-করা · 🙈 হোমে নয়"; col = "#93c5fd"; if (loc) { txt = "⚠️ টিক আছে, কিন্তু ডাটাবেজে হোমে নয় — ➕ বা রাখুন চাপুন"; col = "#fcd34d"; bad++; } }
          else if (e) { txt = "❌ ডাটাবেজে নেই"; col = "#fca5a5"; bad++; }
          else { txt = loc ? "⚠️ টিক আছে, ডাটাবেজে হোমে নয় — ➕ বা রাখুন চাপুন" : "— হোমে নয়"; col = loc ? "#fcd34d" : "#9ca3af"; if (loc) bad++; }
          tag.textContent = txt; tag.style.color = col; });
        box.textContent = "🔎 সার্ভার থেকে এইমাত্র পড়া — " + w.name + ": সেভ-করা সম্পাদিত " + bd(csAll(sw2 && sw2.cs).filter(function (c) { return /^e/.test(c); }).length) + "টি, হোমে দেখায় " + bd(sl.length) + "টি। " + (bad ? "⚠️ " + bd(bad) + "টি কার্ডে এখানকার অবস্থার সাথে ডাটাবেজ মেলেনি (রঙিন লেখা দেখুন)।" : "✅ সব মিলেছে।");
        b.disabled = false;
      }).catch(function (e2) { b.disabled = false; box.textContent = "❌ পড়া যায়নি: " + String((e2 && e2.message) || e2).slice(0, 120); });
    };
    var savedOnce = false;
    function afterClose() {   // বন্ধ করার সময় (সেভ হয়ে থাকলে) আগের কাজ চালানো: তালিকা নতুন করে আনা / কলব্যাক
      if (!(savedOnce && auto)) return false;
      if (ST.ext) { var cbx = ST.ext; ST.ext = null; ST.extX = null; window.MCW_FORGET(); DR = blank(); load().then(function () { try { cbx(true); } catch (e) {} }); return true; }
      DR = blank(); ST.sub = "list"; load().then(paint); return true;
    }
    ov.querySelector("#ccvok").onclick = function () {   // 💾 সব বিজয়ীর বাছাই সেভ — জানালা খোলা থাকে
      var b = this; pend[cur].n = nm.value; var n = apply();
      if (!DR.id && !auto) { close(); paint(); if (confirm(bd(n) + " জন বিজয়ীর কার্ড বাছা হয়েছে, কিন্তু এখনো ডাটাবেজে রাখা হয়নি।\n\nএখনই ঘোষণা সেভ করে ডাটাবেজে রাখবেন?\n(OK চাপলে সেভ হয়ে যাবে)")) { var sb = document.querySelector('[data-a="save"]'); if (sb) sb.click(); } return; }
      b.disabled = true; setSt("⏳ সবার বাছাই সেভ হচ্ছে…");
      Q = Q.then(function () { return M.rpc("mc2_draw_save", { p: payload() }); }).then(function (id) { DR.id = DR.id || id; window.MCW_FORGET(); dirty = false; savedOnce = true; mark(); setSt("✅ সব বিজয়ীর বাছাই ডাটাবেজে সেভ হয়েছে (" + bd(n) + " জন)"); }).catch(function (e) { setSt("❌ সেভ হয়নি", true); M.fail(e); }).then(function () { b.disabled = false; });
    };
    show(cur);
  }
  // 🎴 সেভ করা কার্ডের ভাসমান প্রিভিউ (ঘোষণা তালিকা থেকে): প্রতিটা সেভ-করা কার্ড ছোট ছবিতে, ✕ দিয়ে একটা বাদ, ✏️ সম্পাদনা (প্রিভিউ-বাছাই জানালা), 🗑 সব মুছুন
  function ccPop(id, k) {
    var r = ST.rows.filter(function (q) { return q.id === id; })[0]; if (!r) return;
    var w = (r.winners || [])[k]; if (!w) return;
    var P = window.MCPoster, MC = window.MCCards, Dd = window.MC || {}, codes = csAll(w.cs), nShow = ((w.cs && w.cs.l) || []).length, dead = false;
    var old = document.getElementById("ccpm"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "ccpm"; ov.style.cssText = "position:fixed;inset:0;z-index:9998;background:rgba(8,16,12,.9);overflow:auto;padding:12px;color:#fff";
    ov.innerHTML = '<div style="max-width:760px;margin:0 auto"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px"><b style="flex:1;min-width:160px">🎴 ' + E(w.name) + " — সেভ করা কার্ড: " + bd(codes.length) + " (হোমে দেখায়: " + bd(nShow) + ")" + (codes.length && w.cs.n ? " (" + E(w.cs.n) + ")" : "") + '</b>' +
      '<button type="button" class="s" id="ccpe" style="background:#7c3aed;color:#fff">✏️ সম্পাদনা</button>' + (codes.length ? '<button type="button" class="s d" id="ccpd">🗑 সব মুছুন</button>' : "") + '<button type="button" class="s" id="ccpk" style="background:#0ea5e9;color:#fff">🔎 ডাটাবেজ পরীক্ষা</button><button type="button" class="s l" id="ccpx">✕ বন্ধ</button></div><div id="ccpks" class="sm" style="color:#cde;display:none;margin-bottom:6px"></div>' +
      (codes.length ? "" : '<p class="sm" style="color:#cde">এই বিজয়ীর কাস্টম কার্ড সেভ নেই — "✏️ সম্পাদনা" চেপে বাছুন।</p>') + '<div id="ccpg" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px"></div></div>';
    document.body.appendChild(ov);
    var close = function () { dead = true; ov.remove(); };
    var openDR = function () { return { id: r.id, kind: r.kind, date: r.draw_date, title: r.title, descr: r.descr || "", show: r.show, winners: JSON.parse(JSON.stringify(r.winners || [])), source: r.source || "", listId: "", paste: "", cnt: 3, home: !!r.home, fb: !!r.fb, fbnames: r.fbnames || [], wkeys: r.wkeys || [], srcs: r.srcs || [], sel: {}, pq: "", pn: 60 }; };
    var saveW = function (nw) { var d = openDR(); if (nw && nw.length) { var ol = (w.cs && w.cs.l) || []; csSet(d.winners[k], w.cs && w.cs.n, nw.filter(function (c) { return ol.indexOf(c) >= 0; }), nw.filter(function (c) { return ol.indexOf(c) < 0; })); } else { csSet(d.winners[k], "", [], []); } DR = d; return M.rpc("mc2_draw_save", { p: payload() }).then(function () { DR = blank(); return load().then(paint); }); };
    ov.querySelector("#ccpx").onclick = close;
    ov.querySelector("#ccpk").onclick = function () {   // 🔎 সার্ভার থেকে এইমাত্র পড়ে এই বিজয়ীর সেভ-করা কার্ড মেলানো
      var b = this, box = ov.querySelector("#ccpks"); box.style.display = "block"; box.textContent = "⏳ ডাটাবেজ থেকে পড়ে দেখা হচ্ছে…"; b.disabled = true;
      window.MCW_FORGET(); window.MCW_LIST().then(function (rows) { refSt(rows);
        var r2 = rows.filter(function (q) { return q.id === id; })[0], x2 = r2 && (r2.winners || [])[k], sl = (x2 && x2.cs && x2.cs.l) || [], all = csAll(x2 && x2.cs), same = all.length === codes.length && all.every(function (c) { return codes.indexOf(c) >= 0; }) && sl.length === nShow;
        box.textContent = "🔎 সার্ভার থেকে এইমাত্র পড়া: সেভ-করা " + bd(all.length) + "টি, হোমে দেখায় " + bd(sl.length) + "টি। " + (same ? "✅ এই জানালার তালিকার সাথে মিলেছে।" : "⚠️ এই জানালার তালিকার (" + bd(codes.length) + "টি, হোমে " + bd(nShow) + "টি) সাথে মেলেনি — জানালা বন্ধ করে আবার খুলুন।"); b.disabled = false;
      }).catch(function (e2) { b.disabled = false; box.textContent = "❌ পড়া যায়নি: " + String((e2 && e2.message) || e2).slice(0, 120); });
    };
    ov.querySelector("#ccpe").onclick = function () { close(); DR = openDR(); ccView(k, true); };
    var dd = ov.querySelector("#ccpd"); if (dd) dd.onclick = function () { if (!confirm("এই বিজয়ীর সব সেভ-করা কার্ড মুছবেন?")) return; saveW([]).then(close).catch(M.fail); };
    var g = ov.querySelector("#ccpg"), rec = { name: w.name, dept: w.dept || "", batch: w.batch || "", score: w.score == null ? 0 : w.score, pct: w.score == null ? 0 : Math.round(w.score / 10), ok: w.score == null ? 0 : Math.round(w.score / 100), total: 10, rank: w.rank || 1, drank: 1, ts: Date.now(), title: "", club: "" };
    var p = { name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score }, names = PZN(), chain = Promise.resolve(), L = null;
    var small = function (cv) { var c = document.createElement("canvas"); c.width = 300; c.height = Math.round(cv.height * 300 / cv.width); c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .8); };
    codes.forEach(function (c, n) {
      var lab = c.charAt(0) === "s" ? "স্কোর কার্ড — " + ((CCS.filter(function (x) { return x[0] === c; })[0] || [0, c])[1]) : (c.charAt(0) === "e" ? "✏️ সম্পাদিত — " + (names[P.codeD(c)] || "") : "বিজয়ী কার্ড — " + (names[+c.slice(1)] || c)); lab += n < nShow ? " · 👁 হোমে দেখায়" : " · 🙈 হোমে নয়";
      var el = document.createElement("div"); el.style.cssText = "position:relative;background:#14261c;border-radius:10px;padding:4px;text-align:center;font-size:12px";
      el.innerHTML = '<div class="ph" style="aspect-ratio:4/5;display:grid;place-items:center;background:#0b1a13;border-radius:8px;overflow:hidden">⏳</div><div style="margin-top:3px">' + bd(n + 1) + ". " + E(lab) + '</div>' + (c.charAt(0) === "s" ? "" : '<button type="button" class="ed" style="margin-top:3px;width:100%;border:0;border-radius:6px;padding:3px 2px;font-size:11px;background:#7c3aed;color:#fff;font-weight:700">✏️ সম্পাদনা</button>') + '<button type="button" class="hm" style="margin-top:4px;width:100%;border:0;border-radius:8px;padding:7px 4px;color:#fff;font-weight:800;background:' + (n < nShow ? "#d97706" : "#16a34a") + '">' + (n < nShow ? "➖ হোম থেকে সরান" : "➕ হোমে দিন") + '</button><button type="button" class="rm" title="এটা বাদ দিন" style="position:absolute;top:8px;right:8px;border:0;border-radius:50%;width:26px;height:26px;background:#e11d48;color:#fff;font-weight:800">✕</button>';
      g.appendChild(el); var ph = el.querySelector(".ph");
      var edb = el.querySelector(".ed"); if (edb) edb.onclick = function (e) { e.stopPropagation(); window.MCW_CARDEDIT(id, k, c, function () { close(); load().then(function () { paint(); ccPop(id, k); }); }); };
      var hmb = el.querySelector(".hm"); if (hmb) hmb.onclick = function (e) {   // এক ক্লিকে হোমে দেখানো/সরানো — সরাসরি ডাটাবেজে
        e.stopPropagation(); var want = n >= nShow; hmb.disabled = true; hmb.textContent = "⏳ সেভ হচ্ছে…";
        window.MCW_EDIT(id, function (ws) { var x = ws[k]; if (!x || !x.cs) return; var l = (x.cs.l || []).filter(function (z) { return z !== c; }), xx = (x.cs.x || []).filter(function (z) { return z !== c; }); if (want) l.push(c); else if (/^e/.test(c)) xx.push(c); csSet(x, x.cs.n, l, xx); })
          .then(function () { window.MCW_FORGET(); return window.MCW_LIST(); }).then(function (rows) { var r2 = rows.filter(function (q) { return q.id === id; })[0], x2 = r2 && (r2.winners || [])[k], on = !!(x2 && x2.cs && (x2.cs.l || []).indexOf(c) >= 0); if (on !== want) throw new Error("সার্ভারে অবস্থা বদলায়নি" + (want && /^e/.test(c) ? " — সম্ভবত supabase-new-20261205.sql এখনো চালানো হয়নি।" : "।")); close(); load().then(function () { paint(); ccPop(id, k); }); })
          .catch(function (er) { hmb.disabled = false; hmb.textContent = want ? "➕ হোমে দিন" : "➖ হোম থেকে সরান"; M.fail(er); });
      };
      el.querySelector(".rm").onclick = function () { if (!confirm("\"" + lab + "\" এই বিজয়ীর সেট থেকে বাদ দেবেন?")) return; saveW(codes.filter(function (x, q) { return q !== n; })).then(close).catch(M.fail); };
      ph.onclick = function () { var im = ph.querySelector("img"); if (!im) return; var z = document.createElement("div"); z.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:10px"; z.innerHTML = '<img style="max-width:100%;max-height:100%;border-radius:8px">'; z.firstChild.src = im.dataset.big || im.src; z.onclick = function () { z.remove(); }; document.body.appendChild(z); };
      chain = chain.then(function () {
        if (dead) return;
        var done = function (cv) { if (dead) return; var im = new Image(); im.src = small(cv); im.dataset.big = cv.toDataURL("image/jpeg", .85); im.style.cssText = "width:100%;display:block;cursor:zoom-in"; ph.innerHTML = ""; ph.style.display = "block"; ph.appendChild(im); };
        if (c.charAt(0) === "s") return MC ? MC.render(rec, null, "card" + c.charAt(1)).then(done) : null;
        return (L ? Promise.resolve(L) : Promise.all([P.li(Dd.logos && Dd.logos.mc), P.li(Dd.logos && Dd.logos.nu), window.mcLogo && window.mcLogo.forType ? window.mcLogo.forType("p").catch(function () { return null; }) : null]).then(function (x) { return (L = x[2] ? [x[2][0] || x[0], x[2][1] || x[1]] : [x[0], x[1]]); })).then(function (lg) { return P.lgFor(c, lg).then(function (lg2) { done(P.drawCode(p, null, c, lg2, 1)); }); });
      }).catch(function () { ph.textContent = "আঁকা যায়নি"; }).then(function () { return new Promise(function (r2) { setTimeout(r2, 20); }); });
    });
  }
  // ---------- অন্য ফাইলের জন্য ছোট API (admin-wcard.js + admin-cards.js কার্ড পপআপ) ----------
  var rowDR = function (r) { return { id: r.id, kind: r.kind, date: r.draw_date, title: r.title, descr: r.descr || "", show: r.show, winners: JSON.parse(JSON.stringify(r.winners || [])), source: r.source || "", listId: "", paste: "", cnt: 3, home: !!r.home, fb: !!r.fb, fbnames: r.fbnames || [], wkeys: (r.wkeys || []).slice(), srcs: r.srcs || [], sel: {}, pq: "", pn: 60 }; };
  var wk0 = function (w) { return [lc(w.name), lc(w.dept), lc(w.batch)].join("|"); };
  // বিজয়ীর পরিচয়-চাবি: নাম|বিভাগ|সেশন|কত নম্বর একই-রকম (admin-pnote.js-এর wid-এর মতোই)
  var widOf = function (list, i) { var b = wk0(list[i]), n = 0, j; for (j = 0; j < i; j++) if (wk0(list[j]) === b) n++; return b + "|" + n; };
  window.MCW_WID = widOf;
  // ডিভাইস-যুক্ত বিজয়ী: ঘোষণার অ্যাডমিন-ওনলি wkeys-এ "wcd:ডিভাইস|wid" (পাবলিকে কখনো যায় না; লটারির বাদ-দেওয়া চাবির সাথে মেলে না)
  window.MCW_DEVMAP = function (r) { var m = {}; (r.wkeys || []).forEach(function (x) { if (String(x).indexOf("wcd:") === 0) { var q = x.slice(4), p = q.indexOf("|"); if (p > 0) m[q.slice(p + 1)] = q.slice(0, p); } }); return m; };
  var unlinkW = function (d, wid) { d.wkeys = (d.wkeys || []).filter(function (x) { return !(String(x).indexOf("wcd:") === 0 && x.slice(x.indexOf("|") + 1) === wid); }); };
  var linkW = function (d, k, dev) { var wid = widOf(d.winners, k); unlinkW(d, wid); if (dev) d.wkeys.push("wcd:" + dev + "|" + wid); };
  window.MCW_UNLINK = function (d, k) { unlinkW(d, widOf(d.winners, k)); };
  // সব ঘোষণা (তাজা, প্রতিবার সার্ভার থেকে; ম্যানুয়াল ঘোষণাসহ)। বিজয়ী ট্যাবের নিজের তালিকা (ST.rows) বদলায় না।
  var LCH = { t: 0, p: null };
  // cache = true হলে ৩০ সেকেন্ডের মধ্যে আগের তালিকাই দেয় (শুধু দেখার জন্য — কার্ড পপআপের সংখ্যা); সেভ/বাছাইয়ের আগে সবসময় তাজা আনা হয়
  window.MCW_LIST = function (cache) {
    M = window.MCA;
    if (cache && LCH.p && Date.now() - LCH.t < 30000) return LCH.p;
    var p = M.rpc("mc2_draw_admin_list").then(function (r) { return r.rows || []; }); LCH = { t: Date.now(), p: p }; p.catch(function () { if (LCH.p === p) LCH = { t: 0, p: null }; }); return p;
  };
  window.MCW_FORGET = function () { LCH = { t: 0, p: null }; };
  // একটা ঘোষণার বিজয়ী-অ্যারে বদলে সেভ: fn(winners, d) সরাসরি বদলায় (d.wkeys-ও বদলানো যায়)
  window.MCW_EDIT = function (id, fn) {
    M = window.MCA;
    return window.MCW_LIST().then(function (rows) { var r = rows.filter(function (q) { return q.id === id; })[0]; if (!r) throw new Error("ঘোষণা পাওয়া যায়নি"); var d = rowDR(r); fn(d.winners, d); return M.rpc("mc2_draw_save", { p: payload(d) }); }).then(function (x) { window.MCW_FORGET(); window.MCW_LIST().then(refSt, function () {}); return x; });
  };
  // ঘোষণা id-র k-নম্বর বিজয়ীকে ডিভাইসের সাথে যুক্ত (dev খালি = যুক্ত সরান)
  window.MCW_LINK = function (id, k, dev) { return window.MCW_EDIT(id, function (ws, d) { if (ws[k]) linkW(d, k, dev); }); };
  // ঘোষণা id-র k-নম্বর বিজয়ীর জন্য পুরো কার্ড-বাছাই জানালা (🖼 সব কার্ড); "রাখুন" চাপলে সেভ হয়ে cb(true) চলে; ✕ দিলে cancel() চলে। এই ট্যাব আঁকা হয় না।
  window.MCW_PICK = function (id, k, cb, cancel) {
    M = window.MCA;
    return window.MCW_LIST().then(function (rows) {
      var r = rows.filter(function (q) { return q.id === id; })[0]; if (!r || !(r.winners || [])[k]) { alert("এই বিজয়ী পাওয়া যায়নি।"); return; }
      DR = rowDR(r); ST.ext = cb || function () {}; ST.extX = cancel || null; ccView(k, true);
    }).catch(M.fail);
  };
  // 🗂 সেভ-করা কার্ড দুই ভাগে: cs.l = বাছা (হোমে/পাবলিকে দেখায়), cs.x = শুধু সেভ-করা সম্পাদিত কার্ড (হোমে দেখায় না)। ক্লিক করে সেভ করা প্রতিটা কার্ড আলাদা আলাদা ডাটাবেজে যায়।
  function csAll(cs) { return ((cs && cs.l) || []).concat((cs && cs.x) || []); }
  function csSet(w, n, l, x) {
    l = (l || []).slice(); x = (x || []).filter(function (c) { return l.indexOf(c) < 0; });
    if (l.length || x.length) { w.cs = { n: String(n || "").trim().slice(0, 40) || "আমার কার্ড", l: l }; if (x.length) w.cs.x = x; } else delete w.cs;
    if (l.length) w.cv = "c"; else if (w.cv === "c") delete w.cv;   // বাছা কার্ড না থাকলে কাস্টম মোড চালু হয় না (নইলে পাবলিকে কিছুই দেখাত না)
    delete w.wc;
  }
  // সম্পাদিত কার্ড সেভ: একই ডিজাইনের আগের সম্পাদিত কপির (বাছা বা না-বাছা) জায়গায় বসে; আগে না থাকলে নতুন কার্ড "সেভ-করা, হোমে নয়" হিসেবে যোগ হয়
  function putSaved(P, cs, oldC, code) {
    var l = ((cs && cs.l) || []).slice(), x = ((cs && cs.x) || []).slice(), dd = P.codeD(code), pos = -1, inL = false;
    var same = function (c) { return c === oldC || (c !== code && c.charAt(0) === "e" && P.codeD(c) === dd); };
    var nl = [], nx = [];
    l.forEach(function (c) { if (same(c)) { if (pos < 0) { pos = nl.length; inL = true; } } else if (c !== code) nl.push(c); else nl.push(c); });
    x.forEach(function (c) { if (same(c)) { } else if (c !== code) nx.push(c); });
    if (nl.indexOf(code) < 0 && nx.indexOf(code) < 0) { if (inL) nl.splice(pos, 0, code); else nx.push(code); }
    return { l: nl, x: nx };
  }
  // এক ডিজাইনের একটাই সম্পাদিত কপি: নতুন সেভ আগেরটার জায়গায় বসে (একই ক্রমে), বাকিগুলো যেমন ছিল
  function putEd(P, l, oldC, code) {
    var dd = P.codeD(code), out = [], pos = -1;
    l.forEach(function (c) { var same = c === oldC || (c !== code && c.charAt(0) === "e" && P.codeD(c) === dd); if (same) { if (pos < 0) pos = out.length; } else if (c !== code) out.push(c); });
    if (pos < 0) out.push(code); else out.splice(pos, 0, code);
    return out;
  }
  var delCode = function (rid, k, code) { return window.MCW_EDIT(rid, function (ws) { var x = ws[k]; if (!x || !x.cs) return; csSet(x, x.cs.n, (x.cs.l || []).filter(function (c) { return c !== code; }), (x.cs.x || []).filter(function (c) { return c !== code; })); }); };
  // 🗑 সেভ-করা একটা কার্ড ডিলেট (কনফার্মসহ); cb() চলে
  window.MCW_CARDDEL = function (rid, k, code, cb) {
    if (!confirm("এই কার্ডটা এই বিজয়ীর সেট থেকে ডিলেট করবেন?")) return;
    return delCode(rid, k, code).then(function () { if (cb) cb(); }).catch(function (e) { window.MCA.fail(e); });
  };
  // ✏️ সেভ-করা একটা কার্ড সরাসরি সম্পাদনা: পোস্টার-এডিটর খোলে; "💾 সেভ" আগেরটার জায়গায় ডাটাবেজে সেভ করে (বারবার সম্পাদনা চলে, শেষটাই থাকে); "🗑 ডিলেট" কার্ডটা সরায়
  window.MCW_CARDEDIT = function (rid, k, code, cb) {
    M = window.MCA; var P = window.MCPoster;
    if (!window.MCP || !window.MCP.poster || !P || !P.enc) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    return window.MCW_LIST().then(function (rows) {
      var r = rows.filter(function (q) { return q.id === rid; })[0], w = r && (r.winners || [])[k]; if (!w) { alert("এই বিজয়ী পাওয়া যায়নি।"); return; }
      var cur = code, isE = code.charAt(0) === "e", ed = isE ? P.dec(code) : null;
      if (isE && !ed) { alert("এই সম্পাদিত কার্ড খোলা যায়নি।"); return; }
      var person = { key: "n:" + lc(w.name), name: w.name, device: w.device || "", dept: w.dept || "", batch: w.batch || "", score: w.score == null ? null : w.score, rank: w.rank || null };
      window.MCP.poster([person], 0, { fresh: true, base: ed ? Object.assign({}, ed.s, { d: ed.d }) : { d: P.codeD(code) }, pv: ed ? ed.v : {},
        has: function () { return !!cur; },
        saveShow: function (p0, S, ov) { return this.save(p0, S, ov, true); },
        save: function (p0, S, ov, show) {
          var nc = P.enc(S, ov); if (!nc) return "⚠️ লেখা বেশি লম্বা হওয়ায় সেভ করা গেল না — একটু ছোট করুন।";
          return window.MCW_EDIT(rid, function (ws) { var x = ws[k]; if (!x) return; var r0 = putSaved(P, x.cs, cur, nc); if (show && r0.l.indexOf(nc) < 0) r0.l.push(nc); csSet(x, (x.cs && x.cs.n), r0.l, r0.x); })
            .then(function () { cur = nc; if (cb) cb(); return "✅ ডাটাবেজে সেভ হয়েছে — আগেরটার জায়গায় বসেছে (শুধু শেষ সংস্করণ থাকে)। আবার বদলে সেভ করতে পারেন; ভুল হলে নিচের 🗑 ডিলেট চাপুন।"; });
        },
        verify: function (p0, S, ov) {
          var nc = P.enc(S, ov); if (!nc) return "⚠️ লেখা বেশি লম্বা — কোড বানানো যায়নি।";
          window.MCW_FORGET(); return window.MCW_LIST().then(function (rows) { refSt(rows);
            var r2 = rows.filter(function (q) { return q.id === rid; })[0], x2 = r2 && (r2.winners || [])[k], l = csAll(x2 && x2.cs);
            if (l.indexOf(nc) >= 0) return "✅ নিশ্চিত: এই কার্ডের হুবহু বর্তমান সংস্করণ ডাটাবেজে আছে (সার্ভার থেকে এইমাত্র পড়া)।";
            var dd = P.codeD(nc), other = l.filter(function (c) { return /^e/.test(c) && P.codeD(c) === dd; }).length;
            return other ? "⚠️ ডাটাবেজে এই ডিজাইনের একটা সম্পাদিত কার্ড আছে, কিন্তু এখনকার বদলগুলো সেভ হয়নি — 💾 সেভ চাপুন।" : "❌ এই কার্ড ডাটাবেজে নেই — 💾 সেভ চাপুন।";
          });
        },
        del: function () { return delCode(rid, k, cur).then(function () { cur = null; if (cb) cb(); }); } });
    }).catch(function (e) { M.fail(e); });
  };
  // 🖼 বিজয়ীর বিজয়ী-কার্ডের ডিজাইন দেখে বাছা: ঘোষণা rid-র সব বিজয়ী পোস্টারে (◀ ▶ ও নিচে নেক্সট), idx-এর জন থেকে শুরু। খোলার সময় বিজয়ীর সেভ-করা ডিজাইন (pd) দেখায়;
  // "সেভ করুন" সরাসরি ডাটাবেজে (শুধু ছোট নম্বর pd); "সরান" pd মুছে ডিফল্টে ফেরায়। cb() প্রতিবার সেভের পর চলে।
  window.MCW_DESIGN = function (rid, idx, cb) {
    M = window.MCA;
    if (!window.MCP || !window.MCP.poster) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    var P = window.MCPoster; if (!P || !P.enc) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    return window.MCW_LIST().then(function (rows) {
      var r = rows.filter(function (q) { return q.id === rid; })[0], ws = r && r.winners || []; if (!ws.length) { alert("এই ঘোষণায় কোনো বিজয়ী নেই।"); return; }
      var pl = ws.map(function (q) { return { key: "n:" + lc(q.name), name: q.name, device: q.device || "", dept: q.dept || "", batch: q.batch || "", score: q.score == null ? null : q.score, rank: q.rank || null }; });
      var kOf = function (p) { return pl.indexOf(p); }, pdOf = function (p) { var w = ws[kOf(p)]; return w && w.pd != null && w.pd !== "" && PZN()[+w.pd] ? +w.pd : null; };
      window.MCP.poster(pl, idx || 0, {
        designFor: pdOf,
        status: function (p) { var w = ws[kOf(p)] || {}, cv = w.cv || "", note = "", l = (w.cs && w.cs.l) || []; if (/^s\d$/.test(cv)) note = "⚠️ মোড \"শুধু স্কোর কার্ড\" — পাবলিকে বিজয়ী কার্ড দেখাবে না"; else if (cv === "c") note = "ℹ️ মোড \"কাস্টম\" — পাবলিকে শুধু বাছা কার্ড দেখায়" + (pdOf(p) != null ? " (তাই সেভ-করা ডিজাইন নম্বর পাবলিকে কার্ড বদলায় না)" : ""); return { d: pdOf(p), note: note, cards: csAll(w.cs).length, shown: l.length, edited: csAll(w.cs).filter(function (c) { return /^e\d/.test(c); }).length }; },
        saveShow: function (p0, S, ov) { return this.save(p0, S, ov, true); },
        save: function (p0, S, ov, show) {   // 💾 এই সম্পাদিত কার্ড সরাসরি ডাটাবেজে (এক ডিজাইনের একটাই সম্পাদিত কপি, শেষটাই থাকে); সার্ভার থেকে আবার পড়ে মিলিয়ে তবেই "সেভ হয়েছে"
          var k = kOf(p0), nc = P.enc(S, ov); if (k < 0) return "⚠️ বিজয়ী পাওয়া যায়নি।"; if (!nc) return "⚠️ লেখা বেশি লম্বা হওয়ায় সেভ করা গেল না — একটু ছোট করুন।";
          return window.MCW_EDIT(rid, function (w2) { var x = w2[k]; if (!x) return; var r0 = putSaved(P, x.cs, null, nc); if (show && r0.l.indexOf(nc) < 0) r0.l.push(nc); csSet(x, (x.cs && x.cs.n), r0.l, r0.x); })
            .then(function () { window.MCW_FORGET(); return window.MCW_LIST(); }).then(function (rows) { refSt(rows);
              var r2 = rows.filter(function (q) { return q.id === rid; })[0], x2 = r2 && (r2.winners || [])[k], l2 = csAll(x2 && x2.cs);
              if (l2.indexOf(nc) < 0 || (show && !(x2 && x2.cs && (x2.cs.l || []).indexOf(nc) >= 0))) throw new Error("সার্ভার কার্ডটা রাখেনি। সম্ভবত supabase-new-20261203.sql এখনো চালানো হয়নি — ওটা Supabase > SQL Editor-এ একবার Run করে আবার সেভ করুন।");
              if (x2) { ws[k].cs = x2.cs; ws[k].cv = x2.cv; delete ws[k].wc; } if (cb) cb();
              return (show ? "👁 হোমে দেখানোর তালিকাতেও যোগ হয়েছে। " : "") + "✅ ডাটাবেজে সত্যিই সেভ হয়েছে (সার্ভার থেকে আবার পড়ে মিলিয়ে দেখা হয়েছে)। সেভ-করা কার্ড হিসেবে আছে; হোমে দেখাতে 👁 সেভ + হোমে দেখান বা 🖼 সব কার্ড জানালার ➕ হোমে দিন ব্যবহার করুন। এই ডিজাইনের একটাই সম্পাদিত কার্ড থাকে — আবার সেভ করলে শুধু শেষটাই থাকবে।";
            });
        },
        verify: function (p0, S, ov) {
          var k = kOf(p0), nc = P.enc(S, ov); if (!nc) return "⚠️ লেখা বেশি লম্বা — কোড বানানো যায়নি।";
          window.MCW_FORGET(); return window.MCW_LIST().then(function (rows) { refSt(rows);
            var r2 = rows.filter(function (q) { return q.id === rid; })[0], x2 = r2 && (r2.winners || [])[k], l2 = csAll(x2 && x2.cs);
            if (l2.indexOf(nc) >= 0) return "✅ নিশ্চিত: এই কার্ডের হুবহু বর্তমান সংস্করণ ডাটাবেজে আছে (সার্ভার থেকে এইমাত্র পড়া)।";
            var dd = P.codeD(nc), other = l2.filter(function (c) { return /^e/.test(c) && P.codeD(c) === dd; }).length;
            return other ? "⚠️ ডাটাবেজে এই ডিজাইনের একটা সম্পাদিত কার্ড আছে, কিন্তু এখনকার বদলগুলো সেভ হয়নি — 💾 সেভ চাপুন।" : "❌ এই কার্ড ডাটাবেজে নেই — 💾 সেভ চাপুন।";
          });
        },
        pick: function (p, d) { var k = kOf(p); if (k < 0) return "বাছা যায়নি"; return window.MCW_EDIT(rid, function (w2) { if (w2[k]) w2[k].pd = +d; }).then(function () { ws[k].pd = +d; if (cb) cb(); return (ws[k].name || "") + "-এর ডিজাইন সেভ হয়েছে: " + (PZN()[d] || bd(+d + 1)); }); },
        unpick: function (p) { var k = kOf(p); if (k < 0) return "সরানো যায়নি"; return window.MCW_EDIT(rid, function (w2) { if (w2[k]) delete w2[k].pd; }).then(function () { delete ws[k].pd; if (cb) cb(); return "সেভ করা ডিজাইন সরানো হয়েছে — ডিফল্ট (১ম) দেখাবে"; }); }
      });
    }).catch(function (e) { M.fail(e); });
  };
  // বিজয়ী নয় এমন ইউজারের জন্য অ্যাডমিনের জোর করে কার্ড বানানো: লুকানো "ম্যানুয়াল বিজয়ী কার্ড" ঘোষণায় তাকে যোগ করে {id,k,fresh} ফেরত দেয়।
  // এই ঘোষণা বিজয়ী ঘোষণা তালিকা, পুরস্কার ও নোট, লটারির বাদ-তালিকা কোথাও আসে না (source = wcard-manual, পাবলিকে show=false)।
  window.MCW_MANUAL = function (info) {
    M = window.MCA; var T = "🛠 ম্যানুয়াল বিজয়ী কার্ড", find = function (rows) { return rows.filter(function (q) { return q.source === "wcard-manual"; })[0]; }, dev = info.device || "";
    var nw = { name: String(info.name || "").trim().slice(0, 60), dept: info.dept || "", batch: info.batch || "", rank: null, score: info.score == null ? null : info.score, note: "" };
    return window.MCW_LIST().then(function (rows) {
      var r = find(rows);
      if (r) return r;
      return M.rpc("mc2_draw_save", { p: { id: null, kind: "custom", date: today(), title: T, descr: "অ্যাডমিন নিজে বানানো বিজয়ী কার্ড — পাবলিকে দেখায় না।", show: false, home: false, fb: false, fbnames: [], winners: [], source: "wcard-manual", wkeys: [], srcs: [] } }).then(function () { return window.MCW_LIST(); }).then(find);
    }).then(function (r) {
      if (!r) throw new Error("ম্যানুয়াল ঘোষণা বানানো যায়নি");
      var at = -1, dm = window.MCW_DEVMAP(r); (r.winners || []).forEach(function (w, i) { if (at < 0 && wk0(w) === wk0(nw) && (!dev || dm[widOf(r.winners, i)] === dev)) at = i; });
      if (at >= 0) return { id: r.id, k: at, fresh: false };
      return window.MCW_EDIT(r.id, function (ws, d) { ws.push(nw); if (dev) linkW(d, ws.length - 1, dev); }).then(function () { return window.MCW_LIST(); }).then(function (rows) { var r2 = find(rows); return { id: r2.id, k: r2.winners.length - 1, fresh: true }; });
    });
  };
  function click(e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.sub) { grab(); ST.sub = b.dataset.sub; return load().then(paint); }
    if (b.id === "wmain") { var on = !ST.on; if (!confirm(on ? "সাইটে বিজয়ী পেজ চালু করবেন?" : "সাইটে বিজয়ী পেজ বন্ধ করবেন? (ডাটা মুছবে না)")) return; return M.rpc("mc2_draw_cfg_set", { p_on: on }).then(function () { ST.on = on; paint(); }).catch(M.fail); }
    if (b.dataset.ul) { if (window.MCDL) window.MCDL.mount(document.getElementById(b.dataset.host), b.dataset.ul); return; }
    var a = b.dataset.a; if (!a) return; var id = b.dataset.id ? +b.dataset.id : null;
    var done = function () { return load().then(paint); };
    if (a === "tg") { var r = ST.rows.filter(function (x) { return x.id === id; })[0]; return M.rpc("mc2_draw_show", { p_id: id, p_show: !r.show }).then(done).catch(M.fail); }
    if (a === "hm") { var hr = ST.rows.filter(function (x) { return x.id === id; })[0], hon = !hr.home, hp = M.rpc("mc2_draw_home_set", { p_id: id, p_on: hon }); if (hon && !hr.show) hp = hp.then(function () { return M.rpc("mc2_draw_show", { p_id: id, p_show: true }); }); return hp.then(done).catch(M.fail); }
    if (a === "dl") { if (!confirm("এই ঘোষণা মুছে ফেলবেন?")) return; return M.rpc("mc2_draw_del", { p_id: id }).then(done).catch(M.fail); }
    if (a === "wcd") { // 🪪 কার্ড: এই ঘোষণার সব বিজয়ীর কার্ড একটাই প্রিভিউতে (নেক্সট/আগের বিজয়ী ও ডিজাইন; র‍্যাংক-লেখা ড্রপডাউন)
      var wr = ST.rows.filter(function (q) { return q.id === id; })[0]; if (!wr) return;
      if (!window.MCA_CARDS_WIN) { alert("কার্ড সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
      return window.MCA_CARDS_WIN((wr.winners || []).map(function (q) { return { name: q.name, device: q.device || "", dept: q.dept || "" }; }), +b.dataset.i || 0);
    }
    if (a === "sht") { // 📄 বেছে-নেওয়া বিজয়ীদের একসাথে এক পেজে (সাইটের নামসহ একটাই ছবি)
      var sr = ST.rows.filter(function (q) { return q.id === id; })[0]; if (!sr) return;
      if (!window.MCSheet) { alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
      var wfd = (document.getElementById("wnFd") || {}).value, wfo = wfd && window.MCF && window.MCF.folders ? (window.MCF.folders() || []).filter(function (f) { return String(f.id) === wfd; })[0] : null;
      return window.MCSheet.open((sr.winners || []).map(function (q) { return { key: "n:" + String(q.name || "").trim().toLowerCase(), name: q.name, device: q.device || "", dept: q.dept || "", batch: q.batch || "", score: q.score == null ? null : q.score, rank: q.rank || null }; }), { title: sr.title || "বিজয়ী তালিকা", dl: wfo ? { edit: true, folder: wfd, ct: "til", kind: "tiles", fname: wfo.name, cname: "📋 বিজয়ী-টাইল" } : null });
    }
    if (a === "pst") { // ফেসবুক পোস্টার: পুরস্কার ট্যাবের একই পোস্টার-সিস্টেম (১০৮০×১০৮০ PNG + ক্যাপশন)
      var pr = ST.rows.filter(function (q) { return q.id === id; })[0]; if (!pr) return;
      if (!window.MCP || !window.MCP.poster) { alert("পোস্টার সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
      var pl = (pr.winners || []).map(function (q) { return { key: "n:" + String(q.name || "").trim().toLowerCase(), name: q.name, device: q.device || "", dept: q.dept || "", batch: q.batch || "", score: q.score == null ? null : q.score, rank: q.rank || null }; });
      if (!pl.length) { alert("এই ঘোষণায় কোনো বিজয়ী নেই।"); return; }
      if (b.dataset.i != null) return window.MCW_DESIGN(id, +b.dataset.i, function () { load().then(paint); });   // প্রতি বিজয়ীর 🖼: ডিজাইন দেখে বাছা ও সরাসরি সেভ (আগের সেভ-করা ডিজাইন দিয়ে খোলে)
      return posterFor(pr.winners || [], 0);
    }
    if (a === "ccp") return ccPop(id, +b.dataset.i || 0);
    if (a === "ccl") { var xr = ST.rows.filter(function (q) { return q.id === id; })[0]; if (!xr) return; DR = { id: xr.id, kind: xr.kind, date: xr.draw_date, title: xr.title, descr: xr.descr || "", show: xr.show, winners: JSON.parse(JSON.stringify(xr.winners || [])), source: xr.source || "", listId: "", paste: "", cnt: 3, home: !!xr.home, fb: !!xr.fb, fbnames: xr.fbnames || [], wkeys: xr.wkeys || [], srcs: xr.srcs || [], sel: {}, pq: "", pn: 60 }; return ccView(+b.dataset.i || 0, true); }
    if (a === "ccv") { grab(); return ccView(+b.dataset.i); }
    if (a === "pubpv") { grab(); return pubPreview(); }
    if (a === "cpall") { // ভাগ ২ক-খ: একজনের cv (পাবলিকে কোন কার্ড) ও pd (ডিজাইন) সব বিজয়ীতে কপি — শুধু ড্রাফটে; "ঘোষণা সেভ" না চাপলে সার্ভারে যায় না। নোট, পুরস্কার-স্ট্যাটাস ও বাছা কার্ড-তালিকা (cs) কপি হয় না।
      grab(); var si = +b.dataset.i, sw = DR.winners[si]; if (!sw) return;
      var cvOf = sw.cv || "", custom = cvOf === "c", cvl = (CVO.filter(function (o) { return o[0] === cvOf; })[0] || [0, "অটো"])[1], pdl = sw.pd != null && PZN()[+sw.pd] ? PZN()[+sw.pd] : "অটো (ডিফল্ট)", others = DR.winners.length - 1;
      if (others < 1) return;
      if (!confirm(bd(others) + " জন বাকি বিজয়ীর কার্ড-বাছাই বদলে যাবে:\n\n🎴 পাবলিকে কার্ড: " + (custom ? "(কাস্টম — কপি হবে না, নিচে দেখুন)" : cvl) + "\n🏆 ডিজাইন: " + pdl + "\n\n(নোট ও পুরস্কার স্ট্যাটাস কপি হয় না। এখন শুধু ড্রাফটে বদলাবে; \"ঘোষণা সেভ\" চাপলে তবেই সার্ভারে যাবে।)" + (custom ? "\n\nℹ️ \"কাস্টম\" মোডের বাছা কার্ড-তালিকা প্রতি জনের আলাদা, তাই শুধু ডিজাইন কপি হবে।" : "") + "\n\nএগিয়ে যাবেন?")) return;
      DR.winners.forEach(function (w, k) {
        if (k === si) return;
        if (!custom) { var ov = w.cv || ""; if (cvOf) w.cv = cvOf; else delete w.cv; if ((w.cv || "") !== ov) delete w.wc; }
        if (sw.pd != null && sw.pd !== "") w.pd = sw.pd; else delete w.pd;
      });
      paint(); return alert("✅ " + bd(others) + " জনের ড্রাফটে বসেছে। সার্ভারে রাখতে নিচের \"ঘোষণা সেভ\" বাটন চাপুন।");
    }
    if (a === "ccs") { grab(); var ww = DR.winners[+b.dataset.i]; if (ww && ww.cs) ww.cv = "c"; else if (ww && ww.cv === "c") delete ww.cv; paint(); return alert(ww && ww.cs ? "\"" + ww.cs.n + "\" নামে " + bd(ww.cs.l.length) + "টি কার্ড বাছা হয়েছে — নিচে \"ডাটাবেজে সেভ করুন\" চাপুন।" : "কোনো কার্ড বাছা হয়নি।"); }
    if (a === "wcm") { grab(); return posterFor(DR.winners, +b.dataset.i || 0, function (k, d) { var w = DR.winners[k]; if (!w) return; w.pd = d; var sel = M.$("#view").querySelector('[data-pd="' + k + '"]'); if (sel) sel.value = String(d); }); }   // ডিজাইন দেখে বাছা
    if (a === "ed") { var x = ST.rows.filter(function (q) { return q.id === id; })[0]; DR = { id: x.id, kind: x.kind, date: x.draw_date, title: x.title, descr: x.descr || "", show: x.show, winners: x.winners || [], source: x.source || "", listId: "", paste: "", cnt: 3, home: !!x.home, fb: !!x.fb, fbnames: x.fbnames || [], wkeys: x.wkeys || [], srcs: x.srcs || [], sel: {}, pq: "", pn: 60 }; ST.sub = "new"; return paint(); }
    if (a === "pall" || a === "pnone") { var arr0 = ST.pc[DR.listId] || [], q0 = lc(DR.pq); arr0.forEach(function (p) { if (!q0 || lc(p.name + " " + p.dept + " " + p.batch).indexOf(q0) >= 0) DR.sel[p.key] = a === "pall"; }); return pkRefresh(); }
    if (a === "pmore") { DR.pn = (DR.pn || 60) + 60; return pkRefresh(); }
    if (a === "psv") {
      grab(); var pp = pickPool(DR); if (!pp.length) { alert("আগে কিছু নাম বাছুন।"); return; }
      var nm0 = prompt("এই বাছাই করা লিস্টের নাম দিন:", (srcLabel(DR.listId) || "বাছাই") + " — বাছাই"); if (!nm0 || !nm0.trim()) return;
      return M.rpc("mc2_dlist_save", { p_id: null, p_name: nm0.trim(), p_items: pp.map(function (p) { return p.name; }) }).then(function () { return load().then(paint); }).then(function () { alert("✅ লিস্ট সেভ হয়েছে — \"লটারির সোর্স\" ড্রপডাউনের \"📝 সেভ করা লিস্ট\"-এ পাবেন।"); }).catch(M.fail);
    }
    if (a === "bf") {
      var MFx = window.MCF; if (!MFx || !MFx.ready) { alert("admin-folders.js লোড হয়নি।"); return; }
      return MFx.ready().then(function () {
        var hv = {}; ST.rows.forEach(function (r) { if (r.source) hv[r.source] = 1; });
        var fs = MFx.folders().filter(function (f) { return f.kind === "winners" && !hv["lottery#" + f.id]; });
        if (!fs.length) { alert("সব লটারি ফোল্ডার আগেই এই তালিকায় আছে।"); return; }
        if (!confirm(bd(fs.length) + "টা লটারি ফোল্ডার (" + fs.map(function (f) { return f.name; }).slice(0, 5).join(", ") + (fs.length > 5 ? "…" : "") + ") ঘোষণা তালিকায় ও 🎁 পুরস্কার ও নোটে তোলা হবে। হোমে/বিজয়ী পেজে লুকানো থাকবে। চালাবেন?")) return;
        return fs.reduce(function (pr, f) {
          return pr.then(function () {
            var ms = MFx.members(f.id), wk = []; ms.forEach(function (m) { if (m.ukey) wk.push(m.ukey); wk.push("n:" + lc(m.name)); });
            return M.rpc("mc2_draw_save", { p: { id: null, kind: "custom", date: String(f.created_at || "").slice(0, 10) || today(), title: String(f.name || "").trim().length > 1 ? f.name : "লটারি", descr: "", show: false, home: false, fb: false, fbnames: [], winners: ms.map(function (m) { return { name: m.name, dept: m.dept || "", batch: m.batch || "", rank: null, score: m.score == null ? null : m.score, note: "" }; }), source: "lottery#" + f.id, wkeys: wk, srcs: [] } });
          });
        }, Promise.resolve()).then(function () { alert("✅ তোলা হয়েছে"); });
      }).then(done).catch(M.fail);
    }
    if (a === "spin") return spin();
    if (a === "imp") { grab(); var have = {}; DR.winners.forEach(function (w) { have[w.name.toLowerCase()] = 1; }); wonLS().forEach(function (w) { if (w.name && !have[w.name.toLowerCase()]) DR.winners.push({ name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score, note: "" }); }); DR.source = "contest"; return paint(); }
    if (a === "add") { grab(); var i = M.$("#wm"), n = (i.value || "").trim(); if (!n) return; DR.winners.push({ name: n, dept: "", batch: "", rank: null, score: null, note: "" }); return paint(); }
    if (a === "rm") { grab(); DR.winners.splice(+b.dataset.i, 1); return paint(); }
    if (a === "reset") { if (DR.winners.length && !confirm("বর্তমান খসড়া মুছে নতুন শুরু করবেন?")) return; DR = blank(); return paint(); }
    if (a === "save") { grab(); if (!DR.winners.length && !DR.fb) { alert("অন্তত একজন বিজয়ী লাগবে।"); return; } return M.rpc("mc2_draw_save", { p: payload() }).then(function () { DR = blank(); ST.sub = "list"; return done(); }).then(function () { alert("✅ সেভ হয়েছে"); }).catch(M.fail); }
    if (a === "lsave") { var nm = M.$("#ln").value, it = M.$("#li").value.split(/\r?\n/); return M.rpc("mc2_dlist_save", { p_id: ST.editL || null, p_name: nm, p_items: it }).then(function () { ST.editL = null; return done(); }).catch(M.fail); }
    if (a === "ledit") { var l = ST.lists.filter(function (q) { return q.id === id; })[0]; ST.editL = id; M.$("#ln").value = l.name; M.$("#li").value = (l.items || []).join("\n"); M.$("#ln").scrollIntoView(); return; }
    if (a === "ldel") { if (!confirm("এই লিস্ট মুছবেন?")) return; return M.rpc("mc2_dlist_del", { p_id: id }).then(done).catch(M.fail); }
    if (a === "luse") { DR = DR || blank(); DR.listId = String(id); ST.sub = "new"; return paint(); }
  }
})();

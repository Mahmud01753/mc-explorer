// (২০২৬-১২-০৯: "⬇ এক্সেল" বাটন যোগ — admin-xlsx.js; ২০২৬-১২-১০ ধাপ ৪: বাটন চাপলে আগে ফিল্টার-জানালা admin-xdlg.js; CSV আগের মতোই) অ্যাডমিন: "📊 ফলাফল" ট্যাব — সব ফলাফল (স্থায়ী, mc2_scores) ফিল্টার করে দেখা (বিভাগ, সেশন, তারিখ, নাম, সেরা/সব খেলা), র‍্যাংকসহ, আর CSV ডাউনলোড।
// admin-moderation.js-এর পরে, admin.js-এর আগে লোড হয়। SQL: supabase-live-board.sql (mc2_board)।
(function () {
  var F = { dept: "", batch: "", from: "", to: "", q: "", mode: "best" }, OFF = 0, LIM = 50, M = null, SEL = {}, ROWS = [];
  window.MCA_TABS = (window.MCA_TABS || []).concat([["res", "📊 ফলাফল"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { res: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  function args(o) {
    var f = F.from ? new Date(F.from + "T00:00:00") : null, t = F.to ? new Date(F.to + "T00:00:00") : null; if (t) t = new Date(t.getTime() + 864e5);
    return { p_dept: F.dept || null, p_batch: F.batch || null, p_from: f ? f.toISOString() : null, p_to: t ? t.toISOString() : null, p_q: F.q.trim() || null, p_mode: F.mode, p_limit: o.limit, p_offset: o.offset };
  }
  // ইউজারের অবস্থা বাছা (✅ ❔ 🚫 📵): একই window.MCFL (admin-folders.js); না থাকলে টেবিল আগের মতোই। চাবি = "d:"+ডিভাইস, না থাকলে "n:"+নাম (ছোট হাতের)। ডিভাইস mc2_scores থেকে আসে (বোর্ডের RPC ডিভাইস দেয় না)।
  var FLR = {}, DV = {}, FLREG = 0;
  function flagsFor(rows) {
    if (!window.MCFL) return Promise.resolve();
    if (!FLREG) { FLREG = 1; window.MCFL.reg(function () { return FLR; }); }
    var ids = (rows || []).map(function (x) { return +x.id; }).filter(Boolean);
    return Promise.all([M.rpc("mc2_flag_all").catch(function () { return {}; }), ids.length ? M.A("mc2_scores?select=id,device&id=in.(" + ids.join(",") + ")").catch(function () { return []; }) : []]).then(function (a) { FLR = a[0] || {}; DV = {}; (a[1] || []).forEach(function (s) { DV[s.id] = s.device || ""; }); });
  }
  function flagCell(x) { if (!window.MCFL) return ""; var k = DV[x.id] ? "d:" + DV[x.id] : "n:" + String(x.name || "").trim().toLowerCase(); return "<td>" + window.MCFL.ctl(k, FLR[k] || "") + "</td>"; }
  function view() {
    M = window.MCA; var V = M.$("#view"), E = M.esc;
    return M.rpc("mc2_board", args({ limit: LIM, offset: OFF })).then(function (r) { return flagsFor(r.rows).then(function () { return r; }); }).then(function (r) {
      var sel = function (id, label, list, cur) { return '<label>' + label + '<select id="' + id + '"><option value="">সব</option>' + list.map(function (x) { return '<option value="' + E(x) + '"' + (x === cur ? " selected" : "") + ">" + E(x) + "</option>"; }).join("") + "</select></label>"; };
      var h = '<div class="row">' + sel("rd", "বিভাগ", r.depts || [], F.dept) + sel("rb", "সেশন", r.batches || [], F.batch) + '<label>থেকে<input type="date" id="rf" value="' + E(F.from) + '"></label><label>পর্যন্ত<input type="date" id="rt" value="' + E(F.to) + '"></label>' +
        '<label>তালিকা<select id="rm"><option value="best"' + (F.mode === "best" ? " selected" : "") + '>প্রত্যেকের সেরা ফল</option><option value="all"' + (F.mode === "all" ? " selected" : "") + '>সব খেলা</option></select></label><label>নাম<input id="rq" maxlength="40" value="' + E(F.q) + '"></label></div>' +
        '<div class="act" style="margin:6px 0;align-items:center"><span class="sm">তারিখ দ্রুত:</span><button type="button" class="l s" data-a="rng" data-d="0">আজ</button><button type="button" class="l s" data-a="rng" data-d="7">শেষ ৭ দিন</button><button type="button" class="l s" data-a="rng" data-d="30">শেষ ৩০ দিন</button><button type="button" class="l s" data-a="rng" data-d="m">এই মাস</button><button type="button" class="l s" data-a="rng" data-d="x">তারিখ মুছুন</button></div>' +
        '<div class="act" style="margin:8px 0"><button type="button" data-a="go">🔎 ফিল্টার করুন</button><button class="l" type="button" data-a="clr">রিসেট</button><button class="l" type="button" data-a="csv">⬇ CSV ডাউনলোড (ফিল্টার অনুযায়ী সব)</button><button class="l" type="button" data-a="xlsx" title="ডিজাইন করা এক্সেল (.xlsx) — ব্যানার, সেরা তিনজন, রঙিন স্কোর">⬇ এক্সেল (সাজানো)</button><button class="l" type="button" data-a="xlsx" data-f="jpg">🖼 JPG</button><button class="l" type="button" data-a="xlsx" data-f="png">🖼 PNG</button><button class="l" type="button" data-a="xlsx" data-f="pdf">📄 PDF</button></div>' +
        '<p class="sm">মোট <b>' + bd(r.total) + "</b>টি ফল · র‍্যাংক এই ফিল্টারের ভেতরে · ফলাফল স্থায়ীভাবে জমা থাকে (স্বয়ংক্রিয় মোছা এতে হাত দেয় না)।</p>";
      h += '<div class="act" style="margin:4px 0"><span class="sm" id="rsn"></span><button class="l s" type="button" data-a="rsall">☑ এই পেজের সব বাছুন</button><button class="l s" type="button" data-a="rsnone">⬜ বাছা বাদ দিন</button><button class="l s" type="button" data-a="rscsv" disabled>⬇ বাছাইগুলোর CSV</button><button class="l s" type="button" data-a="rssh" disabled>📄 বাছাইগুলোর কার্ড (এক পেজে)</button><button class="d s" type="button" data-a="rshide" disabled>🙈 বাছাইগুলো বোর্ডে লুকান</button></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap"><tr style="text-align:left;color:var(--mut)"><th><input type="checkbox" id="rsa" aria-label="এই পেজের সবাইকে বাছুন"></th><th>ক্রম</th><th>র‍্যাংক</th><th>নাম</th><th>বিভাগ</th><th>সেশন</th><th>স্কোর</th><th>সঠিক</th><th>ভুল</th><th>তারিখ</th>' + (window.MCFL ? "<th>অবস্থা</th>" : "") + '</tr>' +
        (r.rows || []).map(function (x, i) { return '<tr style="border-top:1px solid var(--bd)"><td><input type="checkbox" data-rs="' + E(x.id) + '"' + (SEL[x.id] ? " checked" : "") + ' aria-label="বাছুন"></td><td>' + bd(OFF + i + 1) + "</td><td>" + bd(x.rk) + "</td><td><b data-sid=\"" + E(x.id) + "\">" + E(x.name) + "</b>" + (window.MCG ? window.MCG.tag(DV[x.id], x.name) : "") + "</td><td>" + E(x.dept) + "</td><td>" + E(x.batch || "—") + "</td><td>" + bd(x.score) + "</td><td>" + bd(x.ok) + "</td><td>" + bd(x.wrong) + "</td><td>" + E(new Date(x.ts).toLocaleString("bn-BD")) + "</td>" + flagCell(x) + "</tr>"; }).join("") + "</table></div>" +
        pager(r.total);
      ROWS = r.rows || []; LISTS = { d: r.depts || [], b: r.batches || [] }; V.innerHTML = h; V.onclick = click; V.onchange = chgSel; selSync();
    });
  }
  // ---------- পেজ-ক্রম (১ ২ ৩ …), আগের/নেক্সট ----------
  function pager(total) {
    var pages = Math.max(1, Math.ceil(total / LIM)), pg = Math.floor(OFF / LIM), st = Math.max(0, Math.min(pg - 2, pages - 5)), en = Math.min(pages, st + 5), h = "", i;
    if (pages < 2) return '<p class="sm" style="text-align:center">পেজ ১ / ১</p>';
    h += '<div class="act" style="justify-content:center;margin-top:10px;flex-wrap:wrap">';
    h += '<button class="l s" type="button" data-a="pg" data-p="' + (pg - 1) + '"' + (pg ? "" : " disabled") + '>‹ আগের</button>';
    if (st > 0) h += '<button class="l s" type="button" data-a="pg" data-p="0">' + bd(1) + "</button>" + (st > 1 ? '<span class="sm">…</span>' : "");
    for (i = st; i < en; i++) h += '<button class="' + (i === pg ? "" : "l ") + 's" type="button" data-a="pg" data-p="' + i + '"' + (i === pg ? ' aria-current="page"' : "") + ">" + bd(i + 1) + "</button>";
    if (en < pages) h += (en < pages - 1 ? '<span class="sm">…</span>' : "") + '<button class="l s" type="button" data-a="pg" data-p="' + (pages - 1) + '">' + bd(pages) + "</button>";
    h += '<button class="l s" type="button" data-a="pg" data-p="' + (pg + 1) + '"' + (pg < pages - 1 ? "" : " disabled") + ">নেক্সট ›</button></div>";
    return h + '<p class="sm" style="text-align:center">পেজ ' + bd(pg + 1) + " / " + bd(pages) + " · মোট " + bd(total) + "টি</p>";
  }
  // ---------- ইউজার/ফল বাছা (টিক) — পেজ বদলালেও বাছা থাকে ----------
  function selSync() {
    var n = Object.keys(SEL).length, V = M.$("#view"), a = V.querySelector("#rsa"), cs = [].slice.call(V.querySelectorAll("input[data-rs]")), on = cs.filter(function (c) { return c.checked; }).length;
    var t = V.querySelector("#rsn"); if (t) t.textContent = "বাছা: " + bd(n) + "টি";
    if (a) { a.checked = cs.length > 0 && on === cs.length; a.indeterminate = on > 0 && on < cs.length; }
    [].forEach.call(V.querySelectorAll('[data-a="rscsv"],[data-a="rshide"],[data-a="rssh"]'), function (b) { b.disabled = !n; });
  }
  function chgSel(e) {
    var t = e.target, V = M.$("#view"); if (!t || !t.hasAttribute) return;
    if (t.id === "rsa") { ROWS.forEach(function (x) { if (t.checked) SEL[x.id] = x; else delete SEL[x.id]; }); [].forEach.call(V.querySelectorAll("input[data-rs]"), function (c) { c.checked = t.checked; }); return selSync(); }
    if (t.hasAttribute("data-rs")) { var x = ROWS.filter(function (q) { return String(q.id) === t.dataset.rs; })[0]; if (t.checked && x) SEL[x.id] = x; else delete SEL[t.dataset.rs]; selSync(); }
  }
  function download(rowsOut, name) {
    var out = ["র‍্যাংক,নাম,বিভাগ,সেশন,স্কোর,সঠিক,ভুল,মোট প্রশ্ন,শতাংশ,তারিখ"].concat(rowsOut.map(function (x) { return [x.rk, x.name, x.dept, x.batch, x.score, x.ok, x.wrong, x.total, x.pct, new Date(x.ts).toLocaleString("bn-BD")].map(cell).join(","); })).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + out], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  function hideSel(b) {
    var ids = Object.keys(SEL).map(Number); if (!ids.length) return;
    if (!confirm(bd(ids.length) + "টি ফল লিডারবোর্ড থেকে লুকানো হবে (ডিলিট হবে না; ফেরাতে \"🏆 লিডারবোর্ড সেটিংস\" থেকে 👁 দেখাও)। লুকাবেন?")) return;
    b.disabled = true;
    M.rpc("mc2_board_admin_hide", { p_ids: ids, p_hide: true }).then(function () { SEL = {}; alert("✅ লুকানো হয়েছে"); go(); }).catch(function (e) { b.disabled = false; M.fail(e); });
  }
  function read() { var g = function (i) { return M.$("#" + i).value; }; F = { dept: g("rd"), batch: g("rb"), from: g("rf"), to: g("rt"), q: g("rq"), mode: g("rm") }; OFF = 0; if (F.from && F.to && F.from > F.to) { alert("❌ \"থেকে\" তারিখ \"পর্যন্ত\" তারিখের পরে হয়ে গেছে — তারিখ ঠিক করুন।"); return false; } return true; }
  function dstr(d) { var z = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); } // ভাগ ২গ: তারিখ দ্রুত-বাছাই (ব্রাউজারের স্থানীয় তারিখ; সার্ভার-হিসাব আগের মতোই)
  function quickRange(k) { var n = new Date(), a = new Date(n.getFullYear(), n.getMonth(), n.getDate()), f = "", to = dstr(a); if (k === "x") { f = ""; to = ""; } else if (k === "m") f = dstr(new Date(n.getFullYear(), n.getMonth(), 1)); else { a.setDate(a.getDate() - Math.max(0, (+k || 1) - 1)); f = dstr(a); } var rf = M.$("#rf"), rt = M.$("#rt"); if (rf) rf.value = f; if (rt) rt.value = to; }
  function go() { view().catch(function (e) { M.fail(e); }); }
  function cell(v) { v = String(v == null ? "" : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; } // এক্সেল ফর্মুলা-ইনজেকশন ঠেকাতে
  function csv() {
    var all = [], off = 0;
    (function next() {
      M.rpc("mc2_board", args({ limit: 500, offset: off })).then(function (r) {
        all = all.concat(r.rows || []); off += 500;
        if ((r.rows || []).length === 500 && off < 20000) return next();
        var out = ["র‍্যাংক,নাম,বিভাগ,সেশন,স্কোর,সঠিক,ভুল,মোট প্রশ্ন,শতাংশ,তারিখ"].concat(all.map(function (x) { return [x.rk, x.name, x.dept, x.batch, x.score, x.ok, x.wrong, x.total, x.pct, new Date(x.ts).toLocaleString("bn-BD")].map(cell).join(","); })).join("\r\n");
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + out], { type: "text/csv;charset=utf-8" })); a.download = "mc-explorer-results.csv"; document.body.appendChild(a); a.click(); a.remove();
        if (all.length >= 20000) alert("প্রথম ২০,০০০টি ফল ডাউনলোড হয়েছে; আরও দেখতে ফিল্টার সরু করুন।");
      }).catch(M.fail);
    })();
  }
  // ⬇ এক্সেল (ধাপ ৪): আগে ফিল্টার-জানালা (admin-xdlg.js — কমন), "⬇ নামান" চাপলে তবেই ফাইল (admin-xlsx.js)। ডাটা একবার এনে মেমরিতে রাখা হয়, তাই জানালায় ফিল্টার/কলাম বদলালে সারি-সংখ্যা ও আনুমানিক মাপ সঙ্গে সঙ্গে বদলায়। পুরোনো CSV বাটন আগের মতোই।
  // নতুন ডাটা জমে না: শুধু আগে থেকে থাকা mc2_board (র‍্যাংক), mc2_scores (ডিভাইস → ইউজার আইডি), mc2_cards (ক্লাব/উপাধি/সেরা জায়গা), mc2_ufolders/mc2_ufolder_members (ফোল্ডার) পড়ে। SQL লাগে না।
  // র‍্যাংক: সাইটের নিয়মই (সমান স্কোরে একই; ফিল্টারের ভেতরে)। একাধিক বিভাগ/সেশন বাছলে র‍্যাংক বাছা সেটের ভেতরে নতুন করে গোনা হয়; একটা বিভাগ বাছলে সার্ভারের হিসাবই (বিভাগের ভেতরে)।
  var CAP = 20000, DSC = { key: "", rows: [], cap: false }, DEVC = {}, CARDS = null, FKEYS = {}, FLIST = null, LISTS = { d: [], b: [] }, XQ = Promise.resolve();
  var normN = function (n) { return String(n == null ? "" : n).trim().replace(/\s+/g, " ").toLowerCase(); };
  var ukeyOf = function (dev, name) { return dev ? "u:" + dev + "|" + normN(name) : "n:" + normN(name); }; // admin-folders.js-এর ukey-র হুবহু নিয়ম
  function argsF(g, o) { var f = g.from ? new Date(g.from + "T00:00:00") : null, t = g.to ? new Date(g.to + "T00:00:00") : null; if (t) t = new Date(t.getTime() + 864e5); return { p_dept: g.dept || null, p_batch: g.batch || null, p_from: f ? f.toISOString() : null, p_to: t ? t.toISOString() : null, p_q: (g.q || "").trim() || null, p_mode: g.mode, p_limit: o.limit, p_offset: o.offset }; }
  function baseOf(f) { var r = window.MCXDLG.range(f); return { dept: f.dept.length === 1 ? f.dept[0] : "", batch: f.batch.length === 1 ? f.batch[0] : "", from: r.from, to: r.to, q: f.q, mode: f.mode }; }
  function loadBase(f, prog) { // সার্ভারে যা ফিল্টার হয় (সময়, নাম, ধরন, একটা বিভাগ/সেশন) সেটুকু দিয়ে ৫০০টি করে আনে; বাকি সব জানালা নিজে হিসাব করে
    var g = baseOf(f), k = JSON.stringify(g); if (DSC.key === k) return Promise.resolve();
    var all = [], off = 0, total = 0;
    return (function page() { return M.rpc("mc2_board", argsF(g, { limit: 500, offset: off })).then(function (r) { var rs = r.rows || []; all = all.concat(rs); off += 500; total = r.total || total; if (prog) prog(all.length, total); if (rs.length === 500 && off < CAP) return page(); }); })()
      .then(function () { DSC = { key: k, rows: all, cap: off >= CAP && all.length >= CAP }; });
  }
  function loadDev() { // ফলের আইডি → ডিভাইস (শুধু ইউজার আইডি/ফোল্ডারের জন্য লাগলে)
    var ids = DSC.rows.map(function (x) { return +x.id; }).filter(function (i) { return i && DEVC[i] === undefined; }), ch = [], i;
    for (i = 0; i < ids.length; i += 300) ch.push(ids.slice(i, i + 300));
    return ch.reduce(function (p, c) { return p.then(function () { return M.A("mc2_scores?select=id,device&id=in.(" + c.join(",") + ")").then(function (a) { c.forEach(function (id) { DEVC[id] = ""; }); (a || []).forEach(function (s) { DEVC[s.id] = s.device || ""; }); }); }); }, Promise.resolve());
  }
  var cardKey = function (d, n) { return d + "|" + String(n || "").toLowerCase(); }; // mc2_cards-এর unique (device, lower(name))
  function loadCards() { // সেভ-করা কার্ডের rec (ক্লাব, উপাধি, সেরা জায়গা) — ছবি/থাম্ব আনে না
    if (CARDS) return Promise.resolve(); var all = {};
    return (function loop(off) { return M.A("mc2_cards?select=device,name,rec&order=id.asc&limit=1000&offset=" + off).then(function (L) { (L || []).forEach(function (c) { all[cardKey(c.device, c.name)] = c.rec || {}; }); if (L && L.length === 1000 && off < 29000) return loop(off + 1000); }); })(0).then(function () { CARDS = all; }).catch(function () { CARDS = {}; });
  }
  function folderList() { // সেভ করা ও ✨ স্মার্ট ফোল্ডার (অটো ফোল্ডার নয়)
    if (FLIST) return Promise.resolve(FLIST);
    return M.A("mc2_ufolders?select=id,name,kind&order=created_at.asc,id.asc").then(function (L) { FLIST = L || []; return FLIST; }).catch(function () { FLIST = []; return FLIST; });
  }
  function loadFold(ids) { // ফোল্ডার → ইউজার-চাবির সেট
    return ids.reduce(function (p, id) {
      return p.then(function () {
        if (FKEYS[id]) return;
        var fo = (FLIST || []).filter(function (x) { return String(x.id) === String(id); })[0], set = {};
        if (fo && fo.kind === "smart") { // স্মার্ট = সেভ-করা ফিল্টার; প্রতিবার নতুন হিসাব admin-folders.js-এর
          if (!window.MCF) throw new Error("✨ স্মার্ট ফোল্ডারের জন্য admin-folders.js লাগে।");
          return window.MCF.ready().then(function () { window.MCF.users(id).forEach(function (u) { set[u.key] = 1; }); FKEYS[id] = set; });
        }
        return (function loop(off) { return M.A("mc2_ufolder_members?select=ukey&folder_id=eq." + encodeURIComponent(id) + "&limit=1000&offset=" + off).then(function (L) { (L || []).forEach(function (m) { set[m.ukey] = 1; }); if (L && L.length === 1000 && off < 199000) return loop(off + 1000); }); })(0).then(function () { FKEYS[id] = set; });
      });
    }, Promise.resolve());
  }
  var needDev = function (f, cols) { return f.fold.length || f.uid.trim() || cols.indexOf("uid") >= 0 || f.fold.length; };
  var needCards = function (f, cols) { return f.club.trim() || ["club", "title", "best"].some(function (k) { return cols.indexOf(k) >= 0; }); };
  function ensure(f, cols, prog) { // দরকারি ডাটা এনে রাখে (একটার পর একটা; আগের কাজ শেষ না হলে অপেক্ষা)
    XQ = XQ.catch(function () {}).then(function () {
      return loadBase(f, prog).then(function () { var p = [logoC().then(function (b) { LOGOB = b ? b.length : 0; })]; if (needDev(f, cols)) p.push(loadDev()); if (needCards(f, cols)) p.push(loadCards()); if (f.fold.length) p.push(loadFold(f.fold)); return Promise.all(p); });
    });
    return XQ;
  }
  function rankInto(L, field, gk) { // সমান স্কোরে একই র‍্যাংক (SQL-এর rank() যেমন), গ্রুপের ভেতরে
    var g = {}; L.forEach(function (x) { var k = gk(x); (g[k] = g[k] || []).push(x); });
    Object.keys(g).forEach(function (k) { var prev = null, rk = 0; g[k].slice().sort(function (p, q) { return (+q.score || 0) - (+p.score || 0); }).forEach(function (x, i) { var s = +x.score || 0; if (prev === null || s !== prev) { rk = i + 1; prev = s; } x[field] = rk; }); });
  }
  function compute(f, cols) { // জানালার ফিল্টার অনুযায়ী চূড়ান্ত সারি + সেরা তিনজন
    var X = window.MCXLSX, CL = X.classes(), ui = window.MCF && window.MCF.uid, ds = f.dept, bs = f.batch;
    var rows = DSC.rows.map(function (x) { var d = DEVC[x.id] || "", c = CARDS ? CARDS[cardKey(d, x.name)] : null; return Object.assign({}, x, { dev: d, uid: d && ui ? ui({ device: d }) : "", club: (c && c.club) || "", title: (c && c.title) || "", best: c && c.bestPlace && c.bestPlace !== "—" ? c.bestPlace : "" }); });
    if (ds.length || bs.length) { rows = rows.filter(function (x) { return (!ds.length || ds.indexOf(x.dept) >= 0) && (!bs.length || bs.indexOf(x.batch || "") >= 0); }); rankInto(rows, "rk", function () { return "*"; }); }
    rankInto(rows, "drk", function (x) { return x.dept || ""; });
    var nv = function (v) { return v === "" || v == null ? null : +v; }, smin = nv(f.smin), smax = nv(f.smax), pmin = nv(f.pmin), pmax = nv(f.pmax), omin = nv(f.okmin), omax = nv(f.okmax);
    var rn = +(f.rank === "x" ? f.rankN : f.rank) || 0, dn = +(f.drank === "x" ? f.drankN : f.drank) || 0, uq = f.uid.trim().toLowerCase(), cq = f.club.trim().toLowerCase();
    var fk = f.fold.map(function (id) { return FKEYS[id] || {}; }), page = null, selS = null;
    if (f.scope === "page") { page = {}; ROWS.forEach(function (x) { page[x.id] = 1; }); } else if (f.scope === "sel") selS = SEL;
    rows = rows.filter(function (x) {
      var s = +x.score || 0, p = x.pct == null ? s / 10 : +x.pct, ok = +x.ok || 0;
      if (smin != null && s < smin || smax != null && s > smax || pmin != null && p < pmin || pmax != null && p > pmax || omin != null && ok < omin || omax != null && ok > omax) return false;
      if (f.cls.length && f.cls.indexOf(CL[X.tier(s)]) < 0) return false;
      if (rn && x.rk > rn || dn && x.drk > dn) return false;
      if (uq && String(x.uid).toLowerCase().indexOf(uq) < 0) return false;
      if (cq && String(x.club).toLowerCase().indexOf(cq) < 0) return false;
      if (fk.length) { var k1 = ukeyOf(x.dev, x.name), k2 = "n:" + normN(x.name); if (!fk.some(function (s2) { return s2[k1] || s2[k2]; })) return false; }
      if (page && !page[x.id] || selS && !selS[x.id]) return false;
      return true;
    });
    var byRk = function (a, b) { return (a.rk - b.rk) || (new Date(a.ts) - new Date(b.ts)) || (a.id - b.id); };
    var top3 = rows.slice().sort(byRk).slice(0, 3);
    if (f.sort === "new") rows.sort(function (a, b) { return new Date(b.ts) - new Date(a.ts); }); else if (f.sort === "old") rows.sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
    else if (f.sort === "score") rows.sort(function (a, b) { return ((+b.score || 0) - (+a.score || 0)) || (new Date(a.ts) - new Date(b.ts)); }); else if (f.sort === "name") rows.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), "bn"); }); else rows.sort(byRk);
    if (f.scope === "first" && +f.firstN > 0) { rows = rows.slice(0, +f.firstN); top3 = top3.filter(function (x) { return rows.indexOf(x) >= 0; }); }
    return { rows: rows, top3: top3 };
  }
  function count(f, cols) { var o = compute(f, cols).rows, n = o.length; return { n: n, bytes: 7000 + LOGOB + n * (20 + 6 * cols.length), note: DSC.cap ? "⚠️ ডাটা বেশি — প্রথম ২০,০০০টি ফল ধরা হয়েছে; ফিল্টার সরু করুন।" : n > 5000 ? "বড় ফাইল — তৈরি হতে কিছুক্ষণ লাগবে।" : "" }; }
  var LOGOP = null, LOGOB = 0, logoC = function () { return LOGOP || (LOGOP = logo()); };
  function logo() { return fetch("images/logo-mc.png").then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { return b ? new Uint8Array(b) : null; }).catch(function () { return null; }); }
  function who() { return window.MCEXBY ? window.MCEXBY.get() : "অ্যাডমিন"; }
  function cardsN(depts) {
    var one = function (d) { return M.raw(M.base + "/rest/v1/mc2_cards?select=id&limit=1" + (d ? "&dept=eq." + encodeURIComponent(d) : ""), { headers: { Prefer: "count=exact" } }).then(function (r) { var m = /\/(\d+)/.exec(r.headers.get("content-range") || ""); return m ? +m[1] : null; }).catch(function () { return null; }); };
    if (!depts.length) return one(""); return Promise.all(depts.map(one)).then(function (a) { return a.some(function (v) { return v == null; }) ? null : a.reduce(function (s, v) { return s + v; }, 0); });
  }
  function runXlsx(btn, f, cols) {
    var lab = btn.textContent, st = function (s) { btn.textContent = s; }, o = compute(f, cols), rows = o.rows, X = window.MCXLSX;
    btn.disabled = true; st("⏳ ফাইল সাজানো হচ্ছে…");
    var extra = (cols.indexOf("club") >= 0 || cols.indexOf("title") >= 0 || cols.indexOf("best") >= 0 ? " · ক্লাব/উপাধি/সেরা জায়গা: mc2_cards (সেভ-করা কার্ড; কার্ড না থাকলে —)" : "") + (cols.indexOf("uid") >= 0 ? " · ইউজার আইডি: ডিভাইস-আইডি থেকে হিসাব" : "");
    Promise.all([cardsN(f.dept), logoC()]).then(function (x) {
      var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
      return X.results({ rows: rows, top3: o.top3, cols: cols, filters: window.MCXDLG.describe(f) || "কোনো ফিল্টার নেই (সব ফলাফল)", mode: f.mode === "all" ? "সব খেলা" : "প্রত্যেকের সেরা ফল", cards: x[0], by: who(), site: (window.MC_CFG && window.MC_CFG.siteUrl) || (/^https?:/.test(location.origin) ? location.origin + "/" : ""), logo: x[1], truncated: DSC.cap, srcExtra: extra, onProgress: function (a, n) { st("⏳ লেখা হচ্ছে " + bd(a) + " / " + bd(n)); } })
        .then(function (bytes) { X.save(bytes, "MC-Explorer-Results-" + d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + ".xlsx"); if (DSC.cap) alert("প্রথম ২০,০০০টি ফল এক্সেলে এসেছে; আরও দেখতে ফিল্টার সরু করুন।"); });
    }).catch(M.fail).then(function () { btn.disabled = false; btn.textContent = lab; });
  }
  function xlsx(btn) {
    if (!window.MCXLSX) return alert("admin-xlsx.js ফাইলটি পাওয়া যায়নি — admin.html-এর সাথে আপলোড করুন।");
    if (!window.MCXDLG) return alert("admin-xdlg.js ফাইলটি পাওয়া যায়নি — admin.html-এর সাথে আপলোড করুন।");
    DSC = { key: "", rows: [], cap: false }; CARDS = null; FKEYS = {}; FLIST = null; // প্রতিবার জানালা খুললে নতুন ডাটা (ফোল্ডার/কার্ড বদলে থাকতে পারে)
    var X = window.MCXLSX, init = {};
    if (F.dept) init.dept = [F.dept]; if (F.batch) init.batch = [F.batch]; if (F.from || F.to) { init.per = "range"; init.from = F.from; init.to = F.to; } if (F.q.trim()) init.q = F.q.trim(); if (F.mode !== "best") init.mode = F.mode; // ট্যাবে চালু ফিল্টারই আগে বসে
    var lst = function (a) { return (a || []).map(function (v) { return { v: v, t: v }; }); };
    window.MCXDLG.open({
      id: "res", title: "⬇ এক্সেল ডাউনলোড — ফলাফল",
      filters: ["per", "q", "mode", "dept", "batch", "uid", "club", "score", "pct", "ok", "cls", "rank", "drank", "fold", "sort", "scope"],
      cols: X.colOrder.map(function (k) { return { k: k, t: X.cols[k].t, lock: k === "sl" }; }),
      lists: { dept: lst(LISTS.d), batch: lst(LISTS.b), cls: lst(X.classes()) },
      modes: [["best", "প্রত্যেকের সেরা ফল"], ["all", "সব খেলা"]],
      sorts: [["rank", "র‍্যাংক অনুযায়ী (সাইটের ক্রম)"], ["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["score", "বেশি স্কোর আগে"], ["name", "নাম (অ-আ)"]],
      scope: { page: ROWS.length, sel: Object.keys(SEL).length }, init: init, folders: folderList, ensure: ensure, count: count
    }).then(function (res) { if (res) runXlsx(btn, res.f, res.cols); });
  }
  function click(e) {
    var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a;
    if (a === "rssh") { // 📄 বাছা ফলাফল-সারির লোকেদের কার্ড এক পেজে / একা (admin-sheet.js)
      if (!window.MCSheet) { alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
      var ps = ROWS.filter(function (x) { return SEL[x.id]; }).map(function (x) { return { key: "r" + x.id, name: x.name, device: DV[x.id] || "", dept: x.dept || "", batch: x.batch || "", score: x.score, rank: null }; });
      if (!ps.length) return; return window.MCSheet.open(ps, { kind: "card", pre: "all", title: "ফলাফল" });
    }
    if (a === "rng") { quickRange(b.dataset.d); if (read() === false) return; SEL = {}; return go(); }
    if (a === "go") { if (read() === false) return; SEL = {}; return go(); }
    if (a === "clr") { F = { dept: "", batch: "", from: "", to: "", q: "", mode: "best" }; OFF = 0; SEL = {}; return go(); }
    if (a === "csv") { if (read() === false) return; return csv(); }
    if (a === "xlsx") { if (read() === false) return; window.MCXPRE = b.dataset.f || null; return xlsx(b); }
    if (a === "prev" || a === "next") { OFF = Math.max(0, OFF + (a === "next" ? LIM : -LIM)); go(); }
    if (a === "pg") { OFF = Math.max(0, (+b.dataset.p || 0) * LIM); go(); }
    if (a === "rsall" || a === "rsnone") { ROWS.forEach(function (x) { if (a === "rsall") SEL[x.id] = x; else delete SEL[x.id]; }); [].forEach.call(M.$("#view").querySelectorAll("input[data-rs]"), function (c) { c.checked = a === "rsall"; }); selSync(); }
    if (a === "rscsv") download(Object.keys(SEL).map(function (k) { return SEL[k]; }), "mc-explorer-selected.csv");
    if (a === "rshide") hideSel(b);
  }
})();

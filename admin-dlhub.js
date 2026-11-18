// অ্যাডমিন: "⬇ ডাউনলোড" — ডাউনলোডের ধরন অনুযায়ী ৫টি আলাদা ট্যাব (এক্সেল · ZIP · JPG · PNG · PDF)।
// ওপরে "📁 ফোল্ডার থেকে ডাউনলোড": ফোল্ডার বেছে এখান থেকেই 📗 এক্সেল / 🖼 JPG / 📦 ZIP নামানো যায় (MCEXP.folder, admin-export.js)। নিচে পথ-দেখানো পাতা: কোন ডাউনলোড কোন ট্যাবে আছে দেখায় ও "খুলুন" চাপলে সেই ট্যাবে নিয়ে যায়। সার্ভারে কিছু জমে না, SQL লাগে না।
// লোড-ক্রম: admin-social.js-এর পরে, admin.js-এর আগে।
(function () {
  window.MCA_TABS = (window.MCA_TABS || []).concat([["dl", "⬇ ডাউনলোড"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { dl: view });
  var G = {
    xlsx: ["📗 এক্সেল", "ব্যানারে বড় লোগো ও সাইটের নামসহ সাজানো এক্সেল।", [["res", "📊 ফলাফল", "সব খেলার ফলাফল (ফিল্টার-জানালা দিয়ে কলাম/সময় বেছে)"], ["usr", "👤 User Info", "ব্যবহারকারীর তালিকা"], ["cards", "🪪 কার্ড", "কার্ডের তথ্যসহ এক্সেল"], ["qimg", "🖼 কুইজ ছবি", "কুইজ-ছবির তালিকা"], ["pn", "🎁 পুরস্কার ও নোট", "পুরস্কার/নোটের তালিকা"], ["chat", "💬 চ্যাট", "চ্যাটের লগ"]]],
    zip: ["📦 ZIP", "একসাথে অনেক ফাইল একটি ZIP-এ।", [["cards", "🪪 কার্ড", "বাছা কার্ডের JPG + এক্সেল + PDF একটি ZIP-এ"]]],
    jpg: ["🖼 JPG", "ছোট সাইজের ছবি (প্রতিটি কার্ড ১০০ KB-এর নিচে)।", [["cards", "🪪 কার্ড", "প্রতিটি কার্ডের JPG"], ["prize", "🎁 পুরস্কার", "পুরস্কারের পোস্টার"]]],
    png: ["🖼 PNG", "বড়, পরিষ্কার ছবি (হাই-রেজ ২×)।", [["social", "📣 সোশ্যাল", "সোশ্যাল কার্ড, সার্টিফিকেট (A4 ৩৫০৮×২৪৮০), ২০টি আধুনিক স্টাইল"], ["prize", "🎁 পুরস্কার", "পোস্টার (PNG)"]]],
    pdf: ["📄 PDF", "ছাপার জন্য A4।", [["cards", "🪪 কার্ড", "কার্ড-ZIP-এর ভেতরে A4 PDF (ক্রমিক নম্বরসহ)"]]]
  };
  var CUR = "xlsx";
  var FOPT = "", FREADY = false, FSEL = "";
  function fbox() { // ফোল্ডার থেকে সরাসরি ডাউনলোড
    var M = window.MCA;
    return '<div class="c" style="margin:8px 0"><b>📁 ফোল্ডার থেকে ডাউনলোড</b><p class="sm" style="margin:4px 0">৩ ধাপ: ① ফোল্ডার বাছুন ② 📗 এক্সেল / 🖼 JPG / 📦 ZIP চাপুন ③ সবুজ <b>"⬇ … নামান"</b> লিংক এলে সেটায় চাপুন।</p>' +
      '<select id="dlf" aria-label="ফোল্ডার">' + (FREADY ? FOPT : '<option value="">⏳ ফোল্ডার লোড হচ্ছে…</option>') + '</select>' +
      '<div class="act" style="flex-wrap:wrap;margin-top:6px"><button type="button" data-d="xl">📗 Excel</button><button type="button" data-d="jpg">🖼 JPG</button><button type="button" data-d="zip">📦 ZIP</button></div><p class="sm" id="dlm"></p></div>';
  }
  // ===== 🗂 কার্ডের ধরন (ফোল্ডার): ধরনে চাপলে সেই ধরনের সব নাম আসে → ৫/৭/১০… বাছুন → "📄 এক পেজে বানান" → জানালায় এক সারিতে ২–৫টা ঠিক করে ডাউনলোড (admin-sheet.js) =====
  var CT = [
    { id: "res", n: "🪪 ফলাফল কার্ড", kind: "card", src: "people", ttl: "এক্সপ্লোরার কার্ড", d: "সবার স্কোর-কার্ড (ডিজাইন ১/২/৩/স্টোরি জানালায় বাছবেন)" },
    { id: "win", n: "🏆 বিজয়ী কার্ড", kind: "card", src: "winners", ttl: "বিজয়ী তালিকা", d: "বিজয়ী-ঘোষণার বিজয়ীদের কার্ড" },
    { id: "pst", n: "🖼 বিজয়ী পোস্টার", kind: "poster", src: "winners", ttl: "বিজয়ী পোস্টার", d: "বিজয়ীদের ফেসবুক-পোস্টার" },
    { id: "cert", n: "🎓 সার্টিফিকেট", kind: "cert", src: "people", ttl: "অংশগ্রহণ সনদ", d: "যে কারও সনদ (সই-লেখা 📣 সোশ্যাল ট্যাবের সেটিং অনুযায়ী)" },
    { id: "soc", n: "📣 সোশ্যাল কার্ড", kind: "social", src: "people", ttl: "সোশ্যাল কার্ড", d: "প্রতিজনের সোশ্যাল কার্ড" },
    { id: "til", n: "📋 বিজয়ী-টাইল", kind: "tiles", src: "winners", ttl: "বিজয়ী তালিকা", d: "ছোট টাইল (ছবি, নাম, র‍্যাংক, মার্ক)" },
    { id: "rk", n: "🏅 র‍্যাংক কার্ড", kind: "rank", src: "people", ttl: "র‍্যাংক কার্ড", d: "প্রতিজনের র‍্যাংক-কার্ড (সোশ্যাল ট্যাবের ডিজাইন-লেখা অনুযায়ী)" },
    { id: "sty", n: "📱 স্টোরি কার্ড", kind: "card", design: "story", src: "people", ttl: "এক্সপ্লোরার কার্ড", d: "স্টোরি সাইজ (৯:১৬) কার্ড" },
    { id: "his", n: "📜 হিস্টরি কার্ড", kind: "card", src: "winners", all: true, ttl: "বিজয়ীদের ইতিহাস", d: "আগের সব ঘোষণার (সপ্তাহ/মাস) সব বিজয়ী" }
  ];
  var CF = null, FBO2 = [["", "সব"], ["yes", "✅ হ্যাঁ (সব)"], ["yp", "✅ ছবি সহ"], ["yn", "✅ ছবি ছাড়া"], ["no", "❌ না"], ["none", "— দেয়নি"]], FBV2 = true;
  var bdn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  function ctbox() {
    return '<div class="c" style="margin:8px 0"><b>🗂 কার্ডের ধরন (ফোল্ডার)</b><p class="sm" style="margin:4px 0">ড্রপডাউন থেকে ধরন বাছুন → সবার নাম আসবে → ৫/৭/১০… যতজন চান বাছুন → <b>📄 এক পেজে বানান</b> → জানালায় এক সারিতে ২–৫টা ঠিক করে ডাউনলোড।</p><div style="margin-top:6px">' +
      '<select id="ctSel" aria-label="কার্ডের ধরন" style="width:100%;font-weight:700"><option value="">— কার্ডের ধরন বাছুন —</option>' + CT.map(function (c) { return '<option value="' + c.id + '" title="' + window.MCA.esc(c.d) + '">' + c.n + "</option>"; }).join("") + "</select>" + '</div><p class="sm" style="margin:8px 0 0">গ্রুপ-কার্ড (🏆 পডিয়াম, 📊 বোর্ড, 📈 পরিসংখ্যান, ✉️ মেসেজ, 🎁 লাকি ড্র তালিকা) অনেকজনকে নিয়ে একটাই কার্ড, তাই সেগুলো 📣 সোশ্যাল ট্যাবে: <button type="button" class="l s" data-go="social">📣 সোশ্যাল ট্যাবে ↗</button></p></div>';
  }
  // ===== 📅 তারিখ দিয়ে সার্চ: আজ / গতকাল / পরশু / শেষ ৩-৫-১০ দিন / ১-২-৩-৫ সপ্তাহ / কাস্টম =====
  var DRP = [["", "📅 সব সময়"], ["t0", "আজ"], ["t1", "গতকাল"], ["t2", "পরশু"], ["d3", "শেষ ৩ দিন"], ["d5", "শেষ ৫ দিন"], ["d10", "শেষ ১০ দিন"], ["w1", "শেষ ১ সপ্তাহ"], ["w2", "শেষ ২ সপ্তাহ"], ["w3", "শেষ ৩ সপ্তাহ"], ["w5", "শেষ ৫ সপ্তাহ"], ["c", "কাস্টম তারিখ…"]];
  function dayStart(off) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - off); return d; }
  function drRange(k, f, t) { // → { a: Date, b: Date } বা null
    if (!k) return null; var end = new Date(), a, b;
    if (k === "t0") { a = dayStart(0); b = end; } else if (k === "t1") { a = dayStart(1); b = new Date(dayStart(0) - 1); } else if (k === "t2") { a = dayStart(2); b = new Date(dayStart(1) - 1); }
    else if (k.charAt(0) === "d") { a = dayStart(+k.slice(1) - 1); b = end; } else if (k.charAt(0) === "w") { a = dayStart(7 * +k.slice(1) - 1); b = end; }
    else if (k === "c") { if (!f && !t) return null; a = f ? new Date(f + "T00:00:00") : new Date(0); b = t ? new Date(t + "T23:59:59.999") : end; }
    return a && b ? { a: a, b: b } : null;
  }
  function inDay(ds, r) { if (!r) return true; var d = new Date(String(ds || "").slice(0, 10) + "T12:00:00"); return !isNaN(d) && d >= new Date(r.a.getFullYear(), r.a.getMonth(), r.a.getDate()) && d <= r.b; }
  function drHtml() { return '<select id="cfr" aria-label="তারিখ">' + DRP.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + '</select><div id="cfrc" hidden style="display:none;grid-template-columns:1fr 1fr;gap:6px"><input type="date" id="cfrf" aria-label="থেকে"><input type="date" id="cfrt" aria-label="পর্যন্ত"></div>'; }
  function ctOf(id) { return CT.filter(function (c) { return c.id === id; })[0]; }
  function openCT(V, id, embed) {
    var t = ctOf(id); if (!t) return;
    CF = { t: t, q: "", dept: "", sort: "score", fb: "", src: "", ann: "", dr: "", df: "", dt: "", embed: !!embed, rows: [], all: null, more: false, busy: false, err: "", sel: [], pk: {}, anns: [] };
    drawList(V); if (!FREADY) loadF(function () { var s = V.querySelector("#cfsrc"); if (s) { var v = s.value; s.innerHTML = srcOpts(); s.value = v; } });
    reload(V);
  }
  function srcOpts() { return '<option value="">সব কার্ড (ডাটাবেজ থেকে)</option>' + (FREADY ? FOPT.replace('<option value="">— ফোল্ডার বাছুন —</option>', "") : ""); }
  // ভাগ ১ (প্রম্পট ১/১): ফোল্ডার ঢোকার পর ছাঁকার অপশন ২টা ভাঁজ করা মেনুতে, ডিফল্টে বন্ধ। খোঁজ, ফোল্ডার ও ✏️ এডিট সবসময় দেখা যায়।
  function foldFilters(V) {
    if (!V.querySelector("#cfsecCss")) { var st = document.createElement("style"); st.id = "cfsecCss"; st.textContent = ".cfsec{border:1px solid var(--bd);border-radius:10px;padding:4px 10px;margin:4px 0}.cfsec>summary{cursor:pointer;font-weight:700;padding:6px 0}.cfsec>*:not(summary){margin:6px 0}"; document.head.appendChild(st); }
    var anchor = V.querySelector("#cfm"); if (!anchor) return;
    var g1 = document.createElement("details"); g1.className = "cfsec"; g1.innerHTML = "<summary>📅 তারিখ ও ঘোষণা</summary>";
    var g2 = document.createElement("details"); g2.className = "cfsec"; g2.innerHTML = "<summary>🔽 বিভাগ, সাজানো, অনুমতি</summary>";
    ["cfr", "cfrc", "cfa"].forEach(function (id) { var e = V.querySelector("#" + id); if (e) g1.appendChild(e); });
    ["cfd", "cfs", "cffb"].forEach(function (id) { var e = V.querySelector("#" + id); if (e) g2.appendChild(e); });
    if (g1.childNodes.length) anchor.before(g1);
    if (g2.childNodes.length) anchor.before(g2);
    // 👥 নামের তালিকা ভাঁজে (খোঁজ লিখলে নিজে খুলবে); কোনো নাম না থাকলেও ভাঁজ বন্ধ থাকবে
    var g3 = document.createElement("details"); g3.className = "cfsec cfnames"; g3.innerHTML = "<summary>👥 নামের তালিকা</summary>";
    anchor.before(g3);
    ["cfm", "cfl"].forEach(function (id) { var e = V.querySelector("#" + id); if (e) g3.appendChild(e); });
    var mb = V.querySelector("#cfmore"); if (mb && mb.parentNode && mb.parentNode !== V) g3.appendChild(mb.parentNode);
    if (!V.dataset.cfnamesBound) { V.dataset.cfnamesBound = "1"; V.addEventListener("input", function (e) { if (e.target && e.target.id === "cfq" && e.target.value) { var d = V.querySelector(".cfnames"); if (d) d.open = true; } }); }
  }
  function drawList(V) {
    var M = window.MCA, t = CF.t, depts = (window.MC || {}).depts || [], isP = t.src === "people";
    V.innerHTML = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="l s" data-cf="back">' + (CF.embed ? "✕ বন্ধ" : "← কার্ডের ধরন") + '</button><h2 style="margin:0">' + t.n + '</h2></div><p class="sm" style="margin:4px 0 8px">' + M.esc(t.d) + "</p>" +
      '<div class="c" style="display:grid;gap:6px"><input id="cfq" placeholder="🔎 নাম খুঁজুন" autocomplete="off">' + drHtml() +
      (isP ? '<div id="cfed"></div><select id="cfsrc" aria-label="কাদের">' + srcOpts() + '</select><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><select id="cfd" aria-label="বিভাগ"><option value="">সব বিভাগ</option>' + depts.map(function (d) { return '<option value="' + M.esc(d) + '">' + M.esc(d) + "</option>"; }).join("") + '</select><select id="cfs" aria-label="সাজানো"><option value="score">সর্বোচ্চ মার্ক আগে</option><option value="new">সর্বশেষ আগে</option></select></div>' +
        (window.MCFB ? '<select id="cffb" aria-label="ফেসবুক অনুমতি">' + FBO2.map(function (o) { return '<option value="' + o[0] + '">📣 অনুমতি: ' + o[1] + "</option>"; }).join("") + "</select>" : "")
        : '<div id="cfed" style="grid-column:1/-1"></div><select id="cfsrc" aria-label="কাদের">' + srcOpts() + '</select><select id="cfa" aria-label="কোন ঘোষণা"><option value="">⏳ ঘোষণা লোড হচ্ছে…</option></select>') + "</div>" +
      '<p class="sm" id="cfm" style="margin:8px 0 4px"></p><div id="cfl"></div><div class="act" style="margin:8px 0"><button type="button" class="l" data-cf="more" id="cfmore" hidden>⬇ আরও দেখুন</button></div>' +
      '<div id="cfb" style="position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--bd);padding:8px 0;display:flex;gap:6px;flex-wrap:wrap;align-items:center;z-index:5"><b id="cfn" class="sm"></b><button type="button" class="l s" data-cf="n5">৫</button><button type="button" class="l s" data-cf="n7">৭</button><button type="button" class="l s" data-cf="n10">১০</button><button type="button" class="l s" data-cf="n0">কেউ না</button><input id="cfcn" type="number" inputmode="numeric" min="1" max="24" placeholder="কাস্টম" style="width:74px"><button type="button" class="l s" data-cf="nc">প্রথম N</button><button type="button" data-cf="go" id="cfgo">📄 গ্রুপ পেজ বানান</button><button type="button" data-cf="gos" id="cfgs">🖼 একা কার্ড (আলাদা আলাদা)</button></div>';
    foldFilters(V);
    if (!isP) loadAnns(V);
    cfCount(V);
  }
  // ===== ✏️ এডিট (শুধু ⬇ ডাউনলোড ট্যাবে, ফোল্ডার বাছা থাকলে): ✅ টিক-করা নামগুলো নিয়ে এডিট-জানালা (admin-sheet.js, ডাটা mc2_dl_edit — admin-dledit.js) =====
  function edPeople() { // ফোল্ডারে আছে এমন টিক-করা নাম, টিক দেওয়ার ক্রমে
    var inF = {}; (CF.all || []).forEach(function (p) { inF[p.key] = 1; });
    return CF.sel.filter(function (k) { return inF[k] && CF.pk[k]; }).map(function (k) { return CF.pk[k]; });
  }
  function cfEdBtn(V) {
    var h = V.querySelector("#cfed"); if (!h) return;
    if (!CF || CF.embed) { h.innerHTML = ""; h.dataset.s = ""; return; }
    var n = edPeople().length, sg = n + "|" + (CF.src || "__all__"); if (h.dataset.s === sg) return; h.dataset.s = sg;
    h.innerHTML = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" data-cf="edit"' + (n ? "" : " disabled") + ' style="background:linear-gradient(180deg,#ef4444,#b91c1c);color:#fff;border:0;border-radius:12px;padding:10px 20px;font-weight:800;font-size:15px;box-shadow:0 3px 10px rgba(185,28,28,.35)' + (n ? "" : ";opacity:.45") + '">✏️ এডিট</button><span class="sm">' + (n ? "✅ " + bdn(n) + " জনের কার্ড এডিট করা যাবে" : "আগে নিচের তালিকায় নামের পাশে টিক (✅) দিন") + "</span></div>";
  }
  function cfCount(V) { cfEdBtn(V); var n = CF.sel.length, e = V.querySelector("#cfn"), g = V.querySelector("#cfgo"), g2 = V.querySelector("#cfgs"); if (g2) g2.disabled = !n; if (e) e.textContent = "বাছা: " + bdn(n) + " জন" + (n > 24 ? " (একবারে সর্বোচ্চ ২৪)" : ""); if (g) g.disabled = !n; }
  // ঘোষণা (বিজয়ী) সোর্স
  function loadAnns(V) {
    if (!window.MCW_LIST) { CF.err = "বিজয়ী সিস্টেম পাওয়া যায়নি"; return paintRows(V); }
    window.MCW_LIST().then(function (rows) {
      CF.anns = (rows || []).filter(function (q) { return q.source !== "wcard-manual" && (q.winners || []).length; }).sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
      var s = V.querySelector("#cfa"); if (!s) return;
      s.innerHTML = '<option value="">সব ঘোষণা (সবার ইতিহাস)</option>' + CF.anns.map(function (r) { return '<option value="' + window.MCA.esc(r.id) + '">' + window.MCA.esc((r.date || "") + " · " + (r.title || "বিজয়ী") + " (" + bdn((r.winners || []).length) + ")") + "</option>"; }).join("");
      if (!CF.t.all && CF.anns[0]) CF.ann = CF.anns[0].id; s.value = CF.ann; reload(V);
    }).catch(function (e) { CF.err = "ঘোষণা আনা যায়নি: " + (e && e.message || e); paintRows(V); });
  }
  function winPeople() {
    var out = []; CF.anns.forEach(function (r) { if (CF.ann && r.id !== CF.ann) return; (r.winners || []).forEach(function (w, i) { if (CF.dr && !inDay(r.date, drRange(CF.dr, CF.df, CF.dt))) return; out.push({ key: r.id + "#" + i, name: w.name, device: w.device || "", dept: w.dept || "", batch: w.batch || "", score: w.score == null ? null : w.score, rank: w.rank || (i + 1), ann: (r.date || "") + " · " + (r.title || "") }); }); });
    return out;
  }
  function pkey(u) { return (u.device || "") + "|" + u.name; }
  function reload(V) {
    var t = CF.t, M = window.MCA; CF.rows = []; CF.more = false; CF.err = "";
    if (t.src === "winners") { CF.all = winPeople(); return fill(V); }
    if (CF.src) { // ইউজার-ফোল্ডার থেকে (MCF) — সব একবারে, এখানেই ছাঁকা
      var MF = window.MCF; if (!MF || !MF.users) { CF.err = "ফোল্ডার সিস্টেম পাওয়া যায়নি"; return paintRows(V); }
      CF.all = MF.users(CF.src).map(function (u) { return { key: u.key || ((u.device || "") + "|" + u.name), device: u.device || "", name: u.name, dept: u.dept || "", batch: u.batch || "", score: u.score, rank: null }; }).filter(function (p) { return p.name; });
      return fill(V);
    }
    CF.all = null; page(V, true);
  }
  function fill(V) { // CF.all থেকে ক্লায়েন্ট-সাইড ছাঁকা
    var q = CF.q.trim().toLowerCase(), d = CF.dept, rows = (CF.all || []).filter(function (p) { return (!q || String(p.name).toLowerCase().indexOf(q) >= 0) && (!d || String(p.dept) === d || (window.MC && window.MC.deptLabel && window.MC.deptLabel(p.dept) === d)); });
    if (CF.t.src === "people") rows = rows.slice().sort(function (a, b) { return CF.sort === "new" ? 0 : (b.score || 0) - (a.score || 0); });
    CF.full = rows; CF.rows = rows.slice(0, 80); CF.more = rows.length > 80; paintRows(V);
  }
  function page(V, first) { // সার্ভার থেকে ৪০টা করে (মোট কার্ড অনেক হলেও দ্রুত)
    if (CF.busy) return; CF.busy = true; var M = window.MCA, off = first ? 0 : CF.rows.length, useV = CF.fb && FBV2, tb = useV ? "mc2_cards_fbv" : "mc2_cards";
    var qs = tb + "?select=device,name,dept,batch,score&order=" + (CF.sort === "new" ? "updated_at.desc" : "score.desc,updated_at.desc") + "&limit=40&offset=" + off;
    if (CF.q.trim()) qs += "&name=ilike." + encodeURIComponent("*" + CF.q.trim().replace(/[*,()%]/g, "") + "*");
    if (CF.dept) qs += "&dept=eq." + encodeURIComponent(CF.dept);
    var rg = drRange(CF.dr, CF.df, CF.dt); if (rg) qs += "&updated_at=gte." + encodeURIComponent(rg.a.toISOString()) + "&updated_at=lte." + encodeURIComponent(rg.b.toISOString());
    if (useV) qs += CF.fb === "yes" ? "&fb=in.(yp,yn)" : "&fb=eq." + CF.fb;
    M.A(qs).then(function (a) { a = a || []; CF.busy = false; a.forEach(function (r) { CF.rows.push({ key: pkey(r), device: r.device || "", name: r.name, dept: r.dept || "", batch: r.batch || "", score: r.score, rank: null }); }); CF.more = a.length >= 40; CF.err = ""; paintRows(V); })
      .catch(function (e) { CF.busy = false; if (useV) { FBV2 = false; CF.fb = ""; CF.err = "অনুমতির ফিল্টার চলেনি (SQL চালানো হয়নি?) — ফিল্টার ছাড়া দেখানো হচ্ছে"; return page(V, first); } CF.err = "আনা যায়নি: " + (e && e.message || e); paintRows(V); });
  }
  function paintRows(V) {
    var M = window.MCA, box = V.querySelector("#cfl"), m = V.querySelector("#cfm"), mb = V.querySelector("#cfmore"); if (!box || !CF) return;
    var pk = CF.pk, sel = CF.sel;
    CF.rows.forEach(function (p) { pk[p.key] = p; }); // ভাগ: নামের তালিকা ২০টা করে পাতায় (১, ২, ৩… দিয়ে যাওয়া যায়)
    var PG = 20, pgN = Math.max(1, Math.ceil(CF.rows.length / PG)); if (!(CF.pg > 0)) CF.pg = 0; if (CF.pg >= pgN) CF.pg = pgN - 1;
    var pgRows = CF.rows.slice(CF.pg * PG, CF.pg * PG + PG);
    box.innerHTML = pgRows.map(function (p) {
      pk[p.key] = p; return '<label class="it" style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" data-cr="' + M.esc(p.key) + '"' + (sel.indexOf(p.key) >= 0 ? " checked" : "") + ' style="width:20px;height:20px;flex:none"><span><b>' + M.esc(p.name) + "</b>" + (window.MCFB ? window.MCFB.span(p.device) : "") + '<br><span class="sm">' + M.esc([(window.MC && window.MC.deptLabel ? window.MC.deptLabel(p.dept) : p.dept), p.batch].filter(Boolean).join(" · ") || "—") + (p.score != null && p.score !== "" ? " · " + bdn(p.score) + " মার্ক" : "") + (p.ann ? " · " + M.esc(p.ann) : "") + "</span></span></label>";
    }).join("") || '<p class="sm">' + (CF.busy ? "⏳ আসছে…" : "কোনো নাম পাওয়া যায়নি।") + "</p>";
    var shown = CF.rows.length, tot = CF.full ? CF.full.length : null;
    if (m) m.innerHTML = (CF.err ? "⚠️ " + M.esc(CF.err) + "<br>" : "") + "দেখানো হচ্ছে " + bdn(shown) + (tot != null ? " / " + bdn(tot) : "") + " জন · নামের পাশে টিক দিন, বা নিচের ৫/৭/১০ বাটনে ওপর থেকে প্রথম N জন";
    if (mb) mb.hidden = !(CF.more && CF.pg >= pgN - 1);
    var nav = V.querySelector("#cfpg"); if (!nav) { nav = document.createElement("div"); nav.id = "cfpg"; nav.className = "act"; nav.style.cssText = "flex-wrap:wrap;margin:6px 0"; box.after(nav); }
    nav.hidden = CF.rows.length <= PG;
    var nb = ""; for (var pi = 0; pi < pgN; pi++) nb += '<button type="button" class="l s" data-cf="pg" data-v="' + pi + '"' + (pi === CF.pg ? ' style="font-weight:800;border:2px solid #1d6b43"' : "") + ">" + bdn(pi + 1) + "</button>";
    nav.innerHTML = '<button type="button" class="l s" data-cf="pgprev"' + (CF.pg <= 0 ? " disabled" : "") + ">◀ আগের</button>" + nb + '<button type="button" class="l s" data-cf="pgnext"' + (CF.pg >= pgN - 1 ? " disabled" : "") + ">পরের ▶</button>";
    cfCount(V);
  }
  function cfAct(V, b) {
    var pa = b.dataset.cf; // নামের তালিকার পাতা (১ ২ ৩… ◀ ▶)
    if (pa === "pg") { CF.pg = +b.dataset.v || 0; return paintRows(V); }
    if (pa === "pgprev") { CF.pg = Math.max(0, (CF.pg || 0) - 1); return paintRows(V); }
    if (pa === "pgnext") { CF.pg = (CF.pg || 0) + 1; return paintRows(V); }
    var a = b.dataset.cf; if (!CF) return;
    if (a === "back") { CF = null; return V.dispatchEvent(new CustomEvent("cfback")); }
    if (a === "more") { if (CF.full) { CF.rows = CF.full.slice(0, CF.rows.length + 80); CF.more = CF.full.length > CF.rows.length; return paintRows(V); } return page(V, false); }
    if (a === "edit") {
      var eps = edPeople(); if (!eps.length) return; if (!window.MCSheet) { alert("শিট সিস্টেম (admin-sheet.js) লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
      var fs = V.querySelector("#cfsrc"), fnm = !CF.src ? "সব কার্ড (ডাটাবেজ)" : fs && fs.selectedIndex >= 0 ? fs.options[fs.selectedIndex].text.replace(/\s*\([^()]*\)\s*$/, "") : "ফোল্ডার", st0 = eps[0].key;
      if (CF.last) eps.forEach(function (p) { if (p.key === CF.last) st0 = p.key; }); // যার নাম সবশেষে বাছা, জানালা তার কার্ড দিয়ে খোলে
      window.MCSheet.open(eps, { kind: CF.t.kind, design: CF.t.design, title: CF.t.ttl, pre: "all", mode: "single", dl: { edit: true, folder: CF.src || "__all__", ct: CF.t.id, kind: CF.t.kind, fname: fnm, cname: CF.t.n, start: st0 } });
      return;
    }
    if (a === "nc") { var cn = parseInt((V.querySelector("#cfcn") || {}).value, 10); if (!cn || cn < 1) { var ci = V.querySelector("#cfcn"); if (ci) ci.focus(); return; } a = "n" + Math.min(24, cn); }
    if (/^n\d+$/.test(a)) { var n = +a.slice(1), pick = CF.rows.slice(0, n); pick.forEach(function (p) { CF.pk[p.key] = p; });
      if (!n) { CF.sel = []; paintRows(V); return; }
      fbGate(pick).then(function (r) { if (!CF || !r) return; CF.sel = r.map(function (p) { return p.key; }); paintRows(V); }); return; } // 🚦 অনুমতি-নেই যারা: একটাই পপআপ
    if (a === "go" || a === "gos") {
      var ps = CF.sel.map(function (k) { return CF.pk[k]; }).filter(Boolean);
      if (!ps.length) return; if (!window.MCSheet) { alert("শিট সিস্টেম (admin-sheet.js) লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
      window.MCSheet.open(ps, { kind: CF.t.kind, design: CF.t.design, title: CF.t.ttl, pre: "all", mode: a === "gos" ? "single" : "page", dl: !CF.embed && CF.src ? { folder: CF.src, ct: CF.t.id, kind: CF.t.kind } : undefined });
    }
  }
  function fbGate(ps) { return window.MCFB && window.MCFB.gate ? window.MCFB.gate(ps) : Promise.resolve(ps); } // 🚦 admin-fbc.js; না থাকলে সবাই যায়
  var dbt = 0;
  function lstChange(V, e) {
      var t = e.target; if (!CF) return;
      if (t.dataset && t.dataset.cr != null) { var k = t.dataset.cr, at = CF.sel.indexOf(k);
        if (t.checked && at < 0) { // 🚦 অনুমতি না থাকলে আগে পপআপ; না বললে টিক উঠে যায়
          var gp = CF.pk[k]; t.checked = false;
          return fbGate(gp ? [gp] : []).then(function (r) { if (!CF || !r || !r.length) return; if (CF.sel.indexOf(k) < 0) CF.sel.push(k); CF.last = k; t.checked = true; cfCount(V); });
        }
        if (t.checked) CF.last = k; if (!t.checked && at >= 0) CF.sel.splice(at, 1); return cfCount(V); }
      if (t.id === "cfd") CF.dept = t.value; else if (t.id === "cfs") CF.sort = t.value; else if (t.id === "cffb") CF.fb = t.value; else if (t.id === "cfsrc") CF.src = t.value; else if (t.id === "cfa") CF.ann = t.value; else if (t.id === "cfr") { CF.dr = t.value; var cc = V.querySelector("#cfrc"); if (cc) cc.style.display = t.value === "c" ? "grid" : "none"; if (t.value === "c") return; } else if (t.id === "cfrf") CF.df = t.value; else if (t.id === "cfrt") CF.dt = t.value; else return;
      reload(V);
    }
  function lstInput(V, e) { var t = e.target; if (!CF || t.id !== "cfq") return; CF.q = t.value; clearTimeout(dbt); dbt = setTimeout(function () { reload(V); }, 320); }
  // ট্যাবের ভেতরে বসানো তালিকা (📣 সোশ্যাল / 🏆 বিজয়ী ট্যাবের নিচে): MCDL.mount(জায়গা, ধরন-আইডি) — ⬇ ডাউনলোডের একই তালিকা, একই তারিখ-সার্চ, একই বাটন
  function bindList(H) {
    if (H.__dlb) return; H.__dlb = 1;
    H.addEventListener("cfback", function () { H.innerHTML = ""; });
    H.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || b.disabled || !b.dataset.cf) return; cfAct(H, b); });
    H.addEventListener("change", function (e) { lstChange(H, e); });
    H.addEventListener("input", function (e) { lstInput(H, e); });
  }
  // অন্য ট্যাবের নিচে বসানোর বাক্স: ids = CT-আইডি, hostId = তালিকা যে খালি জায়গায় আসবে তার id (বাটনে data-ul + data-host)
  function boxHtml(title, ids, hostId) {
    return '<div class="c" style="margin:12px 0"><b>' + title + '</b><p class="sm" style="margin:4px 0">ধরনে চাপুন → 📅 তারিখ/🔎 নাম দিয়ে খুঁজুন → টিক বা ৫/৭/১০/কাস্টম → <b>📄 গ্রুপ পেজ</b> বা <b>🖼 একা কার্ড</b></p><div class="act" style="flex-wrap:wrap">' +
      ids.map(function (i) { var c = ctOf(i); return c ? '<button type="button" data-ul="' + i + '" data-host="' + hostId + '">' + c.n + "</button>" : ""; }).join("") + '</div><div id="' + hostId + '" style="margin-top:8px"></div></div>';
  }
  window.MCDL = { boxHtml: boxHtml, mount: function (host, id) { if (!host) return; bindList(host); openCT(host, id, true); if (!FREADY) loadF(function () { var sl = host.querySelector("#cfsrc"); if (sl) { var v = sl.value; sl.innerHTML = srcOpts(); sl.value = v; } }); } };
  function loadF(done) {
    var MF = window.MCF; if (!MF || !MF.ready) { FOPT = '<option value="">ফোল্ডার সিস্টেম পাওয়া যায়নি</option>'; FREADY = true; return done(); }
    MF.ready().then(function () {
      var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); }, esc = window.MCA.esc, o = function (id, n, c) { return '<option value="' + esc(String(id)) + '">' + esc(n) + " (" + bd(c) + ")</option>"; };
      var FF = MF.folders(), C = FF.filter(function (f) { return f.kind !== "winners" && f.kind !== "smart"; }), SM = FF.filter(function (f) { return f.kind === "smart"; }), W = FF.filter(function (f) { return f.kind === "winners"; });
      FOPT = '<option value="">— ফোল্ডার বাছুন —</option><optgroup label="অটো ফোল্ডার">' + MF.auto().map(function (a) { return o(a.id, a.name, a.count); }).join("") + "</optgroup>" +
        (C.length ? '<optgroup label="📁 কাস্টম">' + C.map(function (f) { return o(f.id, f.name, MF.count(f.id)); }).join("") + "</optgroup>" : "") +
        (SM.length ? '<optgroup label="✨ স্মার্ট">' + SM.map(function (f) { return o(f.id, f.name, MF.count(f.id)); }).join("") + "</optgroup>" : "") +
        (W.length ? '<optgroup label="🏆 বিজয়ী">' + W.map(function (f) { return o(f.id, f.name, MF.count(f.id)); }).join("") + "</optgroup>" : "");
      FREADY = true; done();
    }).catch(function (e) { FOPT = '<option value="">লোড হয়নি: ' + window.MCA.esc(e && e.message || e) + "</option>"; FREADY = true; done(); });
  }
  function startDl(V, kind) {
    var MF = window.MCF, sel = V.querySelector("#dlf"), msg = V.querySelector("#dlm"), id = sel && sel.value;
    if (!id) { if (msg) msg.textContent = "⚠️ আগে একটা ফোল্ডার বাছুন।"; return; }
    if (!window.MCEXP || !MCEXP.folder) { if (msg) msg.textContent = "⚠️ ডাউনলোড সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করুন।"; return; }
    if (msg) msg.textContent = "";
    var CN = { ok: "ভেরিফাইড", no: "নন-ভেরিফাইড", ex: "বাদ", nr: "সাড়া পাওয়া যায়নি" }, D = window.MC || {}, nm = sel.options[sel.selectedIndex].text.replace(/\s*\([^()]*\)\s*$/, "");
    MCEXP.folder({ id: id, name: nm, go: kind, users: MF.users(id).map(function (u) { return { key: u.key, device: u.device || "", name: u.name, dept: D.deptLabel ? D.deptLabel(u.dept || "") : (u.dept || ""), batch: u.batch || "", score: u.score, st: CN[MF.flag(u)] || "—" }; }) });
  }
  function view() {
    var M = window.MCA, V = M.$("#view");
    function draw() {
      if (CF) return drawList(V);
      var g = G[CUR];
      V.innerHTML = '<h2>⬇ ডাউনলোড</h2>' + ctbox() + fbox() + '<h3 style="margin:14px 0 4px">অন্য ট্যাবের ডাউনলোড</h3><div class="act" style="margin:8px 0;flex-wrap:wrap">' + Object.keys(G).map(function (k) { return '<button type="button" data-k="' + k + '" class="' + (k === CUR ? "" : "l") + '">' + G[k][0] + "</button>"; }).join("") + "</div>" +
        '<p class="sm">' + M.esc(g[1]) + "</p>" + g[2].map(function (r) { return '<div class="c" style="margin:8px 0;display:flex;gap:10px;align-items:center;justify-content:space-between"><div><b>' + M.esc(r[1]) + '</b><br><span class="sm">' + M.esc(r[2]) + '</span></div><button type="button" data-go="' + r[0] + '">খুলুন ↗</button></div>'; }).join("");
      var s1 = V.querySelector("#dlf"); if (s1 && FSEL) s1.value = FSEL;
    }
    draw(); if (!FREADY) loadF(function () { if (V.querySelector("#dlf")) { var s = V.querySelector("#dlf"), v = s.value; s.innerHTML = FOPT; s.value = v; } });
    V.addEventListener("cfback", function () { draw(); });
    V.addEventListener("change", function (e) { if (e.target && e.target.id === "ctSel" && e.target.value) openCT(V, e.target.value); }); // ড্রপডাউন থেকে কার্ডের ধরন
    V.onchange = function (e) { lstChange(V, e); };
    V.oninput = function (e) { lstInput(V, e); };
    V.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ct) return openCT(V, b.dataset.ct);
      if (b.dataset.cf) return cfAct(V, b);
      if (b.dataset.d) return startDl(V, b.dataset.d);
      if (b.dataset.k) { var s0 = V.querySelector("#dlf"); if (s0) FSEL = s0.value; CUR = b.dataset.k; return draw(); }
      if (b.dataset.go) { var t = document.querySelector('#tabs [data-t="' + b.dataset.go + '"]'); if (t) t.click(); }
    };
  }
})();

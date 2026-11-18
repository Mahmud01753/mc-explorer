// অ্যাডমিন: 🪪 কার্ড ট্যাবের "📦 ZIP" — ভাগ ৩ (২০২৬-১২-১৬)।
// নির্বাচন-জানালা (সংখ্যা ১০–১০০, বিভাগ, সেশন, বিজয়ী, সময়) → একটা ZIP: কার্ড JPG (প্রতিটি ১০০ KB-এর নিচে) + তথ্যসহ এক্সেল + PDF (A4, ক্রমিক)।
// সবকিছু অ্যাডমিনের ব্রাউজারে তৈরি হয়; সার্ভারে কিছু জমে না, নতুন SQL নেই। কার্ড আঁকা হয় admin-cards.js-এর বিদ্যমান কোডে (window.MCA_CARDX), এক্সেল admin-xlsx.js-এ।
// লাইব্রেরি (cdnjs, নির্দিষ্ট ভার্সন): JSZip 3.10.1, jsPDF 2.5.1 — শুধু "ZIP বানান" চাপলে প্রথমবার লোড হয়, সাধারণ পাতায় নয়।
// ব্যক্তিগত তথ্য (আইপি/ফোন/ডিভাইস) কোনো ফাইলে যায় না। PDF-এ শুধু ইংরেজি অক্ষরের ক্রমিক নম্বর (বাংলা ফন্ট লাগে না; বাংলা লেখা কার্ডের ছবির ভেতরেই)।
(function () {
  var JSZIP_URL = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  var MAXB = 99000; // ১০০ KB-এর নিচে (১০০×১০২৪ আর ১০০×১০০০ দুই হিসাবেই)
  var M = null, X = null, S = null, EL = null, RUN = 0, URLS = [], LP = {};
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var lc = function (s) { return String(s || "").trim().toLowerCase(); };
  var E = function (t) { return M.esc(t); };
  var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
  var z2 = function (n) { return (n < 10 ? "0" : "") + n; };
  function def() { return { n: 20, dept: "", batch: "", win: "", per: "", from: "", to: "", sort: "score", kind: "", xl: true, pdf: true, pp: 4, fb: "" }; }

  // ---------- লাইব্রেরি (দরকারের সময় একবার) ----------
  function lib(url, ok) {
    if (ok()) return Promise.resolve();
    if (LP[url]) return LP[url];
    LP[url] = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = url; s.async = true;
      s.onload = function () { if (ok()) res(); else { delete LP[url]; rej(new Error("লাইব্রেরি লোড হলেও পাওয়া গেল না")); } };
      s.onerror = function () { delete LP[url]; rej(new Error("লাইব্রেরি আনা যায়নি — নেট বা _headers/netlify.toml-এর CSP-তে cdnjs.cloudflare.com অনুমতি আছে কি দেখুন")); };
      document.head.appendChild(s);
    });
    return LP[url];
  }
  var needZip = function () { return lib(JSZIP_URL, function () { return !!window.JSZip; }); };
  var needPdf = function () { return lib(JSPDF_URL, function () { return !!(window.jspdf && window.jspdf.jsPDF); }); };

  // ---------- নির্বাচন ----------
  function range(s) {
    var now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), f = null, t = null, ok = function (d) { return d && !isNaN(d) ? d : null; };
    if (s.per === "today") f = d0; else if (s.per === "7") f = new Date(d0 - 6 * 864e5); else if (s.per === "30") f = new Date(d0 - 29 * 864e5); else if (s.per === "month") f = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (s.per === "c") { if (s.from) f = new Date(s.from + "T00:00:00"); if (s.to) t = new Date(s.to + "T23:59:59"); }
    return { from: ok(f), to: ok(t) };
  }
  function qs(s) {
    var p = "", enc = encodeURIComponent, r = range(s);
    if (s.dept) p += "&dept=eq." + enc(s.dept);
    if (s.batch === "__none") p += "&or=" + enc("(batch.is.null,batch.eq.)"); else if (s.batch) p += "&batch=eq." + enc(s.batch);
    if (r.from) p += "&updated_at=gte." + enc(r.from.toISOString());
    if (r.to) p += "&updated_at=lte." + enc(r.to.toISOString());
    if (s.fb) p += s.fb === "yes" ? "&fb=in.(yp,yn)" : "&fb=eq." + s.fb; // supabase-new-20261220.sql (ভিউ mc2_cards_fbv)
    return p;
  }
  var ord = function (s) { return s.sort === "new" ? "updated_at.desc,id.desc" : "score.desc,updated_at.desc,id.asc"; };
  var PER = [["", "সব সময়"], ["today", "আজ"], ["7", "শেষ ৭ দিন"], ["30", "শেষ ৩০ দিন"], ["month", "এই মাস"], ["c", "✏️ কাস্টম তারিখ"]];
  var perLbl = function (v) { var r = PER.filter(function (x) { return x[0] === v; })[0]; return r ? r[1] : ""; };
  // বিজয়ী: mc2_draws (mc2_draw_admin_list) — নাম মিললে (বিভাগ থাকলে বিভাগও) কার্ড "বিজয়ী"
  var DR = null;
  function draws() {
    if (DR) return DR;
    DR = M.rpc("mc2_draw_admin_list").then(function (r) { return ((r && r.rows) || []).filter(function (q) { return q.source !== "wcard-manual"; }); });
    DR.catch(function () { DR = null; });
    return DR;
  }
  function winMap(s) {
    if (!s.win) return Promise.resolve(null);
    return draws().then(function (rows) {
      var m = {}; if (s.win !== "any") rows = rows.filter(function (q) { return "D:" + q.id === s.win; });
      rows.forEach(function (d) { (d.winners || []).forEach(function (w) { var k = lc(w.name); if (k) (m[k] = m[k] || []).push({ dept: w.dept || "", t: d.title || "" }); }); });
      return m;
    });
  }
  function hit(wm, c) {
    var a = wm[lc(c.name)]; if (!a) return "";
    var t = [];
    a.forEach(function (e) { if ((!e.dept || e.dept === c.dept) && e.t && t.indexOf(e.t) < 0) t.push(e.t); else if (!e.dept || e.dept === c.dept) { if (!e.t && t.indexOf("বিজয়ী") < 0) t.push("বিজয়ী"); } });
    return t.join(", ");
  }
  function pick(s) {
    return winMap(s).then(function (wm) {
      var base = (s.fb ? "mc2_cards_fbv" : "mc2_cards") + "?select=id,device,name,dept,batch,score,pct,updated_at" + qs(s) + "&order=" + ord(s);
      if (!wm) return M.A(base + "&limit=" + s.n).then(function (L) { return { rows: L || [], wm: null }; });
      var out = [], off = 0, PG = 500;
      function step() {
        return M.A(base + "&limit=" + PG + "&offset=" + off).then(function (L) {
          L = L || [];
          L.forEach(function (c) { if (out.length >= s.n) return; var h = hit(wm, c); if (h) { c._win = h; out.push(c); } });
          off += PG;
          if (out.length >= s.n || L.length < PG || off >= 20000) return { rows: out, wm: wm, capped: off >= 20000 && out.length < s.n };
          return step();
        });
      }
      return step();
    });
  }
  function total(s) { // ফিল্টারে মোট কার্ড (বিজয়ী ছাড়া); না পেলে null
    var p = (s.fb ? "mc2_cards_fbv" : "mc2_cards") + "?select=id&limit=1" + qs(s);
    return M.raw(M.base + "/rest/v1/" + p, { headers: { Prefer: "count=exact" } }).then(function (r) { var m = /\/(\d+)/.exec(r.headers.get("content-range") || ""); return m ? +m[1] : null; }).catch(function () { return null; });
  }

  // ---------- JPG (১০০ KB-এর নিচে) ----------
  function mk(src, w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, w, h); return c; }
  function enc(c, q) { return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/jpeg", q); }); }
  function toJpg(src) { // আগে মান কমিয়ে (০.৮৮ → ০.৩), না হলে মাপ ছোট করে (৮৫% করে, কমপক্ষে ~৫৪০px চওড়া)
    var sc = 1;
    function tryS() {
      var w = Math.round(src.width * sc), h = Math.round(src.height * sc), c = mk(src, w, h);
      return enc(c, 0.88).then(function (b) {
        if (b && b.size <= MAXB) { c.width = c.height = 0; return { b: b, w: w, h: h, q: 0.88 }; }
        return enc(c, 0.3).then(function (low) {
          if (!low || low.size > MAXB) { c.width = c.height = 0; if (w * 0.85 < 540) return { b: low, w: w, h: h, q: 0.3, over: true }; sc *= 0.85; return tryS(); }
          var lo = 0.3, hi = 0.88, best = { b: low, w: w, h: h, q: 0.3 }, n = 0;
          function bs() { if (n++ >= 5) { c.width = c.height = 0; return best; } var m = (lo + hi) / 2; return enc(c, m).then(function (b2) { if (b2 && b2.size <= MAXB) { best = { b: b2, w: w, h: h, q: m }; lo = m; } else hi = m; return bs(); }); }
          return bs();
        });
      });
    }
    return tryS();
  }
  var ascii = function (t) { try { return X.asciiName(t); } catch (e) { return String(t || "").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 30) || "MC"; } };

  // ---------- PDF (A4, ক্রমিক) ----------
  function mkPdf(items, pp, tick2) {
    var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4", orientation: "portrait", compress: true }), W = 210, H = 297, MG = 10, per = pp === 1 ? 1 : 4, pages = Math.ceil(items.length / per);
    var cw = per === 1 ? W - 2 * MG : (W - 2 * MG - 6) / 2, ch = per === 1 ? H - 2 * MG - 14 : (H - 2 * MG - 14 - 6) / 2, LBL = 6;
    var i = 0, pg = 0;
    function page() {
      if (i >= items.length) return Promise.resolve();
      if (pg > 0) doc.addPage();
      pg++;
      var k;
      for (k = 0; k < per && i < items.length; k++, i++) {
        var it = items[i], col = per === 1 ? 0 : k % 2, row = per === 1 ? 0 : Math.floor(k / 2), x0 = MG + col * (cw + 6), y0 = MG + row * (ch + 6);
        var r = it.w / it.h, w = cw, h = w / r; if (h > ch - LBL) { h = ch - LBL; w = h * r; }
        doc.setFontSize(10); doc.setTextColor(60); doc.text("No. " + (i + 1) + " / " + items.length, x0, y0 + 4);
        doc.addImage(it.u8, "JPEG", x0 + (cw - w) / 2, y0 + LBL, w, h, "c" + i, "NONE");
      }
      doc.setFontSize(8); doc.setTextColor(120); doc.text("MC Explorer Challenge  -  page " + pg + " / " + pages, W / 2, H - 6, { align: "center" });
      return tick2().then(page);
    }
    return page().then(function () { return doc.output("arraybuffer"); });
  }

  // ---------- এক্সেল (admin-xlsx.js-এর কমন ডিজাইন) ----------
  function who() { return window.MCEXBY ? window.MCEXBY.get() : "অ্যাডমিন"; }
  function desc(s) {
    var a = [], dl = function (x) { try { return window.MC && window.MC.deptLabel ? window.MC.deptLabel(x) : x; } catch (e) { return x; } };
    if (s.dept) a.push("বিভাগ: " + dl(s.dept)); if (s.batch) a.push("সেশন: " + (s.batch === "__none" ? "নেই" : s.batch));
    if (s.win) a.push(s.win === "any" ? "শুধু বিজয়ী (যেকোনো ঘোষণা)" : "বিজয়ী: নির্বাচিত ঘোষণা");
    if (s.per) a.push("সময় (শেষ আপডেট): " + (s.per === "c" ? (s.from || "…") + " থেকে " + (s.to || "…") : perLbl(s.per)));
    if (s.fb) a.push("ফেসবুক অনুমতি: " + ({ yes: "হ্যাঁ (সব)", yp: "হ্যাঁ · ছবি সহ", yn: "হ্যাঁ · ছবি ছাড়া", no: "না", none: "উত্তর দেয়নি" }[s.fb] || s.fb));
    a.push("সাজানো: " + (s.sort === "new" ? "নতুন আগে" : "বেশি স্কোর আগে")); a.push("সর্বোচ্চ " + bd(s.n) + "টি");
    return a.join(" · ");
  }
  function mkXlsx(rows, s) {
    var XL = window.MCXLSX; if (!XL) return Promise.reject(new Error("এক্সেল সিস্টেম (admin-xlsx.js) লোড হয়নি"));
    var defs = { name: { t: "নাম", w: 30, a: "l" }, dept: { t: "বিভাগ", w: 24, a: "l" }, batch: { t: "সেশন", w: 14, a: "c" }, score: { t: "স্কোর", w: 14, a: "c" }, pct: { t: "শতাংশ", w: 12, a: "c", ty: "n" }, win: { t: "বিজয়ী ঘোষণা", w: 30, a: "l" }, fb: { t: "ফেসবুক অনুমতি", w: 22, a: "l" }, file: { t: "JPG ফাইল", w: 36, a: "l" }, kb: { t: "JPG সাইজ (KB)", w: 14, a: "c", ty: "n" }, ts: { t: "শেষ আপডেট", w: 23, a: "c" } };
    var order = ["sl", "name", "dept", "batch", "score", "pct", "win", "fb", "file", "kb", "ts"], n = rows.length, sum = 0, mx = 0, w = 0, dd = {};
    rows.forEach(function (r) { sum += +r.score || 0; if ((+r.score || 0) > mx) mx = +r.score || 0; if (r.win && r.win !== "—") w++; dd[r.dept] = 1; });
    var top = rows.slice().sort(function (a, b) { return (+b.score || 0) - (+a.score || 0); }).slice(0, 3);
    var opt = {
      rows: rows, cols: order, colDefs: defs, colOrder: order, sheet: "কার্ড ZIP", sub: "কার্ড ZIP (নির্বাচিত কার্ড)", srcTxt: "অ্যাডমিন › 🪪 কার্ড › 📦 ZIP · ডাটাবেজ: mc2_cards (JPG ফাইলের নাম ZIP-এর cards ফোল্ডারের সাথে মেলে; আইপি/ফোন/ডিভাইস নেই)",
      tblTitle: "📋 ZIP-এ থাকা কার্ড (JPG-র ক্রমে)", tblSrc: "ডাটার উৎস: 🪪 কার্ড ট্যাব · mc2_cards · স্কোরের ঘরের রঙ = ক্লাস", filters: desc(s), mode: "ZIP", cards: n, by: who(),
      site: (window.MC_CFG && window.MC_CFG.siteUrl) || (typeof location !== "undefined" && /^https?:/.test(location.origin) ? location.origin + "/" : ""),
      boxes: [["মোট কার্ড", XL.bd(n)], ["আলাদা বিভাগ", XL.bd(Object.keys(dd).length)], ["গড় স্কোর", XL.bd(n ? Math.round(sum / n) : 0)], ["বিজয়ী", XL.bd(w)]],
      pod: [0, 1, 2].map(function (i) { return top[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + top[i].name + " (" + (top[i].dept || "—") + ") — স্কোর ➜ " + XL.bd(top[i].score) : i ? "" : "এই তালিকায় কার্ড নেই"; }), podTitle: "🏆 এই ZIP-এর সর্বোচ্চ স্কোরের তিনটি কার্ড", podNeutral: true
    };
    return XL.results(opt);
  }

  // ---------- UI ----------
  function close() { RUN++; URLS.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); URLS = []; if (EL) { EL.remove(); EL = null; } }
  function opts(list, cur) { return list.map(function (x) { return '<option value="' + E(x[0]) + '"' + (String(cur) === String(x[0]) ? " selected" : "") + ">" + E(x[1]) + "</option>"; }).join(""); }
  function paint() {
    var depts = ((window.MC && window.MC.depts) || []).map(function (d) { var l = d; try { l = window.MC.deptLabel ? window.MC.deptLabel(d) : d; } catch (e) {} return [d, l]; });
    var sess = [["", "সব সেশন"], ["__none", "— (সেশন নেই)"]].concat((X.sessions ? X.sessions() : []).map(function (b) { return [b, b]; }));
    var wins = [["", "সব কার্ড"], ["any", "🏅 শুধু বিজয়ী (যেকোনো ঘোষণা)"]].concat((S._dr || []).map(function (d) { return ["D:" + d.id, "🏅 " + (d.title || "ঘোষণা") + (d.draw_date ? " — " + d.draw_date : "")]; }));
    var kinds = [["", "ডিফল্ট ডিজাইন"]].concat((X.PK || []).map(function (k) { return [k[0], k[1]]; }));
    EL.innerHTML = '<div class="cxb2" style="gap:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>📦 কার্ড ZIP (JPG + এক্সেল + PDF)</b><button class="l s" type="button" id="xzX">✕ বন্ধ</button></div>' +
      '<div class="sm">সব ফাইল এই ফোনের ব্রাউজারেই তৈরি হয়; সার্ভারে কিছু জমে না। প্রতিটি JPG ১০০ KB-এর নিচে। এক্সেল-PDF-এ আইপি/ফোন/ডিভাইস যায় না।</div>' +
      '<div class="row" id="xzF"><label>কতগুলো কার্ড (১০–১০০)<input id="xzN" type="number" min="10" max="100" step="1" value="' + S.n + '"></label>' +
      '<label>বিভাগ<select id="xzD"><option value="">সব বিভাগ</option>' + opts(depts, S.dept) + '</select></label>' +
      '<label>সেশন<select id="xzB">' + opts(sess, S.batch) + '</select></label>' +
      '<label>বিজয়ী<select id="xzW">' + opts(wins, S.win) + '</select></label>' +
      '<label>🖼 ছবি (কার্ডে)<select id="xzPm">' + opts((X.PML || [["with", "ছবি সহ"]]), X.pm ? X.pm() : "with") + '</select></label>' +
      '<label>📣 ফেসবুক অনুমতি<select id="xzFb">' + opts([["", "সব কার্ড"], ["yes", "✅ শুধু অনুমতি দেওয়া (সব)"], ["yp", "✅ হ্যাঁ · ছবি সহ"], ["yn", "✅ হ্যাঁ · ছবি ছাড়া"], ["no", "❌ না"], ["none", "— উত্তর দেয়নি"]], S.fb) + '</select></label>' +
      '<label>সময় (শেষ আপডেট)<select id="xzP">' + opts(PER, S.per) + '</select></label>' +
      '<label>সাজানো<select id="xzS">' + opts([["score", "বেশি স্কোর আগে"], ["new", "নতুন আগে"]], S.sort) + '</select></label>' +
      '<label>কার্ডের ডিজাইন<select id="xzK">' + opts(kinds, S.kind) + '</select></label></div>' +
      (S.per === "c" ? '<div class="row"><label>থেকে<input id="xzFr" type="date" value="' + E(S.from) + '"></label><label>পর্যন্ত<input id="xzTo" type="date" value="' + E(S.to) + '"></label></div>' : "") +
      '<div class="row"><label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" checked disabled style="width:20px;height:20px;min-width:20px;padding:0;margin:0"> কার্ড JPG (সবসময়)</label>' +
      '<label style="flex-direction:row;align-items:center;gap:6px"><input id="xzXl" type="checkbox"' + (S.xl ? " checked" : "") + ' style="width:20px;height:20px;min-width:20px;padding:0;margin:0"> তথ্যসহ এক্সেল</label>' +
      '<label style="flex-direction:row;align-items:center;gap:6px"><input id="xzPd" type="checkbox"' + (S.pdf ? " checked" : "") + ' style="width:20px;height:20px;min-width:20px;padding:0;margin:0"> PDF (A4)</label>' +
      '<label>PDF-এ প্রতি পাতায়<select id="xzPp">' + opts([["4", "৪টি কার্ড"], ["1", "১টি কার্ড"]], String(S.pp)) + '</select></label></div>' +
      '<div class="act"><button class="l s" type="button" id="xzC">🔎 কয়টি মিলল দেখুন</button><button type="button" id="xzGo">📦 ZIP বানান</button></div>' +
      '<div class="sm" id="xzI"></div><div id="xzPr" hidden><div style="height:10px;border-radius:6px;background:var(--bd,#ddd);overflow:hidden"><div id="xzBar" style="height:100%;width:0;background:var(--g,#0b3d2e)"></div></div><div class="sm" id="xzT" style="margin-top:4px"></div><div class="act"><button class="d s" type="button" id="xzSt">⏹ থামান</button></div></div><div id="xzO"></div></div>';
    EL.querySelector("#xzX").onclick = close;
    var f = function (id) { return EL.querySelector(id); };
    f("#xzF").onchange = function () { read(); };
    f("#xzP").onchange = function () { read(); paint(); };
    f("#xzC").onclick = check; f("#xzGo").onclick = go;
  }
  function read() {
    var f = function (id) { return EL.querySelector(id); }, n = parseInt(String(f("#xzN").value).replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }), 10);
    S.n = isNaN(n) ? 20 : Math.max(10, Math.min(100, n));
    S.dept = f("#xzD").value; S.batch = f("#xzB").value; S.win = f("#xzW").value; S.fb = f("#xzFb") ? f("#xzFb").value : ""; if (f("#xzPm") && X.pmSet) X.pmSet(f("#xzPm").value); S.per = f("#xzP").value; S.sort = f("#xzS").value; S.kind = f("#xzK").value;
    if (f("#xzFr")) S.from = f("#xzFr").value; if (f("#xzTo")) S.to = f("#xzTo").value;
    S.xl = f("#xzXl").checked; S.pdf = f("#xzPd").checked; S.pp = f("#xzPp").value === "1" ? 1 : 4;
  }
  function info(t) { var e = EL && EL.querySelector("#xzI"); if (e) e.innerHTML = t; }
  function check() {
    read(); var nEl = EL.querySelector("#xzN"); if (nEl) nEl.value = S.n; info("⏳ গুনছি…");
    var my = RUN; Promise.all([pick(S), S.win ? Promise.resolve(null) : total(S)]).then(function (r) {
      if (my !== RUN) return; var got = r[0].rows.length;
      info("ফিল্টারে মিলেছে " + (r[1] != null ? "<b>" + bd(r[1]) + "</b>টি, " : (S.win ? "" : "")) + "ZIP-এ যাবে <b>" + bd(got) + "</b>টি" + (r[0].capped ? " (বিজয়ীর খোঁজে প্রথম ২০,০০০ কার্ড দেখা হয়েছে)" : "") + (got < S.n ? " — চাওয়া " + bd(S.n) + "টির চেয়ে কম।" : "।"));
    }).catch(function (e) { info("⚠️ " + E(e && e.message ? e.message : e)); });
  }
  function prog(i, n, t) { var b = EL && EL.querySelector("#xzBar"), x = EL && EL.querySelector("#xzT"); if (b) b.style.width = Math.round(i / n * 100) + "%"; if (x) x.textContent = t; }

  function go() {
    read(); var nEl = EL.querySelector("#xzN"); if (nEl) nEl.value = S.n;
    var my = ++RUN, stop = false, items = [], rows = [], fails = [], over = 0, kind = S.kind || (X.dk ? X.dk() : "card1"), pr = EL.querySelector("#xzPr"), out = EL.querySelector("#xzO"), btn = EL.querySelector("#xzGo");
    out.innerHTML = ""; btn.disabled = true; pr.hidden = false; EL.querySelector("#xzSt").hidden = false; EL.querySelector("#xzSt").onclick = function () { stop = true; prog(0, 1, "⏹ থামানো হচ্ছে…"); };
    var live = function () { return my === RUN && !!EL; };
    prog(0, 1, "⏳ লাইব্রেরি ও তালিকা আনছি…");
    var libs = [needZip()]; if (S.pdf) libs.push(needPdf());
    return Promise.all([Promise.all(libs), pick(S)]).then(function (r) {
      var L = r[1].rows; if (!L.length) throw new Error("এই ফিল্টারে কোনো কার্ড মেলেনি।");
      var zip = new window.JSZip(), N = L.length, at = 0;
      function one(c0) {
        if (!live() || stop) return Promise.resolve();
        at++; prog(at - 1, N + 2, "🪪 কার্ড " + bd(at) + "/" + bd(N) + " — " + (c0.name || ""));
        return X.one(c0.id).then(function (c) {
          return X.rankInfo(c).then(function (inf) { return X.drawFull(c, kind, X.rkExtra(inf, { mode: "auto" }), null); }).then(function (cv) { c0._fbm = c.fbm || ""; return cv; });
        }).then(function (cv) {
          return toJpg(cv).then(function (j) { try { cv.width = cv.height = 0; } catch (e) {} return j; });
        }).then(function (j) {
          if (!j || !j.b) throw new Error("JPG হয়নি");
          return j.b.arrayBuffer().then(function (ab) {
            var u8 = new Uint8Array(ab), fn = ("000" + (rows.length + 1)).slice(-3) + "_" + ascii(c0.name) + "_" + (+c0.score || 0) + ".jpg";
            zip.file("cards/" + fn, u8, { binary: true }); if (j.over) over++;
            items.push({ u8: u8, w: j.w, h: j.h });
            rows.push({ id: c0.id, name: c0.name || "", dept: c0.dept || "", batch: c0.batch || "", score: +c0.score || 0, pct: c0.pct == null ? (+c0.score || 0) / 10 : +c0.pct, win: c0._win || "—", fb: { photo: "হ্যাঁ · ছবি সহ", nophoto: "হ্যাঁ · ছবি ছাড়া", no: "না" }[c0._fbm] || "উত্তর দেয়নি", file: fn, kb: Math.round(u8.length / 102.4) / 10, ts: new Date(c0.updated_at).getTime() || 0 });
          });
        }).catch(function (e) { fails.push((c0.name || c0.id) + ": " + (e && e.message ? e.message : e)); }).then(tick);
      }
      return L.reduce(function (p, c0) { return p.then(function () { return one(c0); }); }, Promise.resolve()).then(function () {
        if (!live()) return; if (!rows.length) throw new Error(stop ? "থামানো হয়েছে — কোনো কার্ড তৈরি হয়নি।" : "কোনো কার্ড আঁকা যায়নি: " + fails.slice(0, 2).join(" | "));
        var steps = Promise.resolve();
        if (S.xl) steps = steps.then(function () { prog(N, N + 2, "📊 এক্সেল বানাচ্ছি…"); return mkXlsx(rows, S).then(function (b) { zip.file("cards.xlsx", b, { binary: true }); }); });
        if (S.pdf) steps = steps.then(function () { prog(N + 1, N + 2, "📄 PDF বানাচ্ছি…"); return mkPdf(items, S.pp, tick).then(function (ab) { zip.file("cards.pdf", ab, { binary: true }); }); });
        return steps.then(function () {
          zip.file("README.txt", "MC Explorer Challenge - card ZIP\r\ncards/ = card JPG files (each under 100 KB)\r\ncards.xlsx = details (if selected)\r\ncards.pdf = A4 pages in the same order (if selected)\r\nNo IP / phone / device info is included.\r\n");
          prog(N + 1, N + 2, "🗜 ZIP বাঁধছি…");
          return zip.generateAsync({ type: "blob", compression: "STORE" }, function (m) { prog(N + 1 + m.percent / 100, N + 2, "🗜 ZIP বাঁধছি… " + bd(Math.round(m.percent)) + "%"); });
        }).then(function (blob) {
          if (!live()) return; var d = new Date(), nm = "MC_cards_" + d.getFullYear() + z2(d.getMonth() + 1) + z2(d.getDate()) + "_" + z2(d.getHours()) + z2(d.getMinutes()) + "_" + rows.length + ".zip", u = URL.createObjectURL(blob); URLS.push(u);
          prog(1, 1, "✅ তৈরি হয়েছে");
          // ডাউনলোড-লিংক তৈরি থাকে, অ্যাডমিন নিজে চাপে (ফোনের ব্রাউজার দেরিতে-চালানো ডাউনলোড আটকায়)
          out.innerHTML = '<a class="cxd" href="' + u + '" download="' + E(nm) + '">⬇ ZIP নামান (' + bd(Math.round(blob.size / 1024)) + " KB · " + bd(rows.length) + "টি কার্ড)</a>" +
            '<div class="sm">ভেতরে: <b>cards/</b> (JPG)' + (S.xl ? " · <b>cards.xlsx</b>" : "") + (S.pdf ? " · <b>cards.pdf</b>" : "") + " · README.txt।" + (stop ? " ⏹ থামানোর আগ পর্যন্ত " + bd(rows.length) + "টি।" : "") +
            (over ? " ⚠️ " + bd(over) + "টি JPG ১০০ KB-এর নিচে নামানো যায়নি।" : " সব JPG ১০০ KB-এর নিচে।") + (fails.length ? " ⚠️ " + bd(fails.length) + "টি কার্ড আঁকা যায়নি: " + E(fails.slice(0, 3).join(" | ")) : "") + " ডাউনলোড না হলে লিংকে চেপে ধরে সেভ করুন।</div>";
        });
      });
    }).catch(function (e) { if (live()) { prog(0, 1, "⚠️ " + (e && e.message ? e.message : e)); } }).then(function () { if (EL && my === RUN) { btn.disabled = false; var st = EL.querySelector("#xzSt"); if (st) st.hidden = true; } });
  }

  function open() {
    M = window.MCA; X = window.MCA_CARDX;
    if (!M || !X) { alert("কার্ড সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে 🪪 কার্ড ট্যাব খুলুন।"); return; }
    if (EL) close();
    S = def(); S._dr = []; var cur = S;
    EL = document.createElement("div"); EL.className = "cxm"; EL.onclick = function (e) { if (e.target === EL) close(); }; document.body.appendChild(EL); paint();
    draws().then(function (rows) { if (EL && S === cur) { S._dr = rows.slice(0, 80); read(); paint(); } }).catch(function () {});
  }

  // ================= ফোল্ডার ডাউনলোড (২০২৬-১২-১৯): 📗 এক্সেল · 🖼 JPG · 📦 ZIP — আলাদা আলাদা =================
  // MCEXP.folder({ name, users:[{key, device, name, dept, batch, score, st}] }) — প্রতিটা ফোল্ডার (admin-folders.js) ও ⬇ ডাউনলোড ট্যাব (admin-dlhub.js) এটাই খোলে।
  // সব ফাইল ব্রাউজারেই তৈরি; সার্ভারে কিছু জমে না, SQL লাগে না। এক্সেলে ফোল্ডারের সবাই; JPG/ZIP-এ শুধু যাদের কার্ড আছে (নাম মিলিয়ে), একবারে সর্বোচ্চ ১০০টি।
  var FMAX = 100, FS = null;
  var fk = function (u) { return lc(u.device) + "|" + lc(u.name); };
  function fcards(users) { // ডিভাইস ধরে কার্ড আনে; ডিভাইস + নাম মিললে তবেই ধরে (অন্যের কার্ড নয়)
    var seenD = {}, list = [], by = {}, i = 0;
    users.forEach(function (u) { if (u.device && !seenD[u.device]) { seenD[u.device] = 1; list.push(u.device); } });
    function nx() {
      if (i >= list.length) return Promise.resolve();
      var ch = list.slice(i, i + 40); i += 40;
      var q = "mc2_cards?select=id,device,name,dept,batch,score,pct,updated_at&device=in.(" + ch.map(function (d) { return '"' + String(d).replace(/["\\]/g, "") + '"'; }).join(",") + ")&limit=2000";
      return M.A(q).then(function (L) { (L || []).forEach(function (c) { (by[c.device] = by[c.device] || []).push(c); }); return nx(); });
    }
    return nx().then(function () {
      var out = [], seen = {};
      users.forEach(function (u) {
        var cs = by[u.device] || [], c = cs.filter(function (x) { return lc(x.name) === lc(u.name); }).sort(function (a, b) { return (+b.score || 0) - (+a.score || 0); })[0];
        if (!c || seen[c.id]) return; seen[c.id] = 1; c._u = u; out.push(c);
      });
      return out.sort(function (a, b) { return (+b.score || 0) - (+a.score || 0); });
    });
  }
  function mkUsersXlsx(users, fileOf, title) {
    var XL = window.MCXLSX; if (!XL) return Promise.reject(new Error("এক্সেল সিস্টেম (admin-xlsx.js) লোড হয়নি"));
    var defs = { name: { t: "নাম", w: 30, a: "l" }, dept: { t: "বিভাগ", w: 24, a: "l" }, batch: { t: "সেশন", w: 14, a: "c" }, score: { t: "স্কোর", w: 14, a: "c" }, st: { t: "অবস্থা", w: 20, a: "c" }, file: { t: "JPG ফাইল", w: 36, a: "l" } };
    var order = ["sl", "name", "dept", "batch", "score", "st"].concat(fileOf ? ["file"] : []);
    var rows = users.map(function (u) { return { name: u.name || "", dept: u.dept || "", batch: u.batch || "", score: +u.score || 0, st: u.st || "—", file: fileOf ? (fileOf[fk(u)] || "—") : "" }; });
    var n = rows.length, sum = 0, sc = 0, dd = {}, withF = 0;
    rows.forEach(function (r) { if (r.score) { sum += r.score; sc++; } dd[r.dept] = 1; if (r.file && r.file !== "—") withF++; });
    var top = rows.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    var boxes = [["মোট সদস্য", XL.bd(n)], ["আলাদা বিভাগ", XL.bd(Object.keys(dd).length)], ["গড় স্কোর", XL.bd(sc ? Math.round(sum / sc) : 0)]]; if (fileOf) boxes.push(["কার্ড (JPG) আছে", XL.bd(withF)]);
    return XL.results({
      rows: rows, cols: order, colDefs: defs, colOrder: order, sheet: "ফোল্ডার", sub: "ফোল্ডার: " + title, srcTxt: "অ্যাডমিন › 📁 ফোল্ডার · ডাটাবেজ: mc2_ufolders / mc2_scores (আইপি/ফোন/ডিভাইস নেই)",
      tblTitle: "📋 ফোল্ডারের সদস্য তালিকা", tblSrc: "ডাটার উৎস: 📁 ফোল্ডার · স্কোরের ঘরের রঙ = ক্লাস", filters: "ফোল্ডার: " + title, mode: "ফোল্ডার", cards: n, by: who(),
      site: (window.MC_CFG && window.MC_CFG.siteUrl) || (typeof location !== "undefined" && /^https?:/.test(location.origin) ? location.origin + "/" : ""),
      boxes: boxes, pod: [0, 1, 2].map(function (i) { return top[i] ? ["১ম", "২য়", "৩য়"][i] + " — " + top[i].name + " (" + (top[i].dept || "—") + ") — স্কোর ➜ " + XL.bd(top[i].score) : i ? "" : "এই ফোল্ডারে কেউ নেই"; }), podTitle: "🏆 এই ফোল্ডারের সর্বোচ্চ স্কোরের তিনজন", podNeutral: true
    });
  }
  function fprog(i, n, t) { var b = EL && EL.querySelector("#fzBar"), x = EL && EL.querySelector("#fzT"); if (b) b.style.width = Math.round(i / n * 100) + "%"; if (x) x.textContent = t; }
  // ভাগ ২ (📁 ফোল্ডার ট্যাব): ✏️ এডিট — ধরন বেছে ওই ফোল্ডারের সদস্যদের কার্ড এডিট; একই সেভ (mc2_dl_edit) যা ⬇ ট্যাবে আছে
  var EDK = [["card", "🪪 ফলাফল কার্ড"], ["tiles", "📋 বিজয়ী-টাইল"], ["poster", "🖼 বিজয়ী পোস্টার"], ["cert", "🎓 সার্টিফিকেট"], ["social", "📣 সোশ্যাল কার্ড"], ["rank", "🏅 র‍্যাংক কার্ড"]];
  var EDM = { card: "res", tiles: "til", poster: "pst", cert: "cert", social: "soc", rank: "rk" }; // ⬇ ট্যাবের ধরন-চাবি (admin-dlhub.js)
  function fedit() {
    var k = (EL.querySelector("#fzEk") || {}).value || "card", S = window.MCSheet;
    if (!S) { alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
    if (!FS.id) { alert("আগে একটা ফোল্ডার বাছুন।"); return; }
    var ps = (FS.users || []).map(function (u) { return { key: String(u.key != null ? u.key : (u.device || u.name)), name: u.name, device: u.device || "", dept: u.dept, batch: u.batch, score: u.score, rank: u.rank }; }).filter(function (p) { return p.name; });
    if (!ps.length) { alert("এই ফোল্ডারে কেউ নেই।"); return; }
    var lbl = (EDK.filter(function (x) { return x[0] === k; })[0] || [])[1] || "";
    S.open(ps, { kind: k, title: FS.name, pre: "all", mode: "single", dl: { edit: true, folder: FS.id, ct: EDM[k] || "res", kind: k, fname: FS.name, cname: lbl, start: ps[0].key } });
  }
  function fpaint() {
    var DEp = FS.id && window.MCDLE ? MCDLE.folder(FS.id) : null, nEd = DEp ? Object.keys(DEp.p).length + (DEp.t.res && DEp.t.res.design ? 1 : 0) : 0;
    var kinds = [["", nEd ? "ডিফল্ট / ✏️ এডিটে সেভ-করা ডিজাইন" : "ডিফল্ট ডিজাইন"]].concat((X && X.PK || []).map(function (k) { return [k[0], k[1]]; }));
    var n = FS.users.length, cap = n > 0 ? "" : " — ফোল্ডারে কেউ নেই";
    EL.innerHTML = '<div class="cxb2" style="gap:10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>⬇ ডাউনলোড — ' + E(FS.name) + '</b><button class="l s" type="button" id="fzX">✕ বন্ধ</button></div>' +
      '<div class="sm"><b>' + bd(n) + '</b> জন' + (FS.sel ? " (বাছা)" : "") + cap + '। তিনটার যেকোনো একটা চাপুন → কিছুক্ষণ অপেক্ষা → নিচে সবুজ <b>"⬇ … নামান"</b> লিংক আসবে → সেটায় চাপুন।</div>' +
      '<div class="row"><label>✏️ এডিটের কার্ড ধরন<select id="fzEk">' + opts(EDK, FS.ek || "card") + '</select></label><button type="button" data-k="edit" class="l s">✏️ এডিট</button></div>' +
      '<label style="display:grid;gap:3px;font-size:13px">✍️ কে বের করেছে (ফাইলে যা লেখা থাকবে — বদলানো যায়)<input id="fzBy" type="text" maxlength="80" placeholder="নাম বা ইমেইল" value="' + E(window.MCEXBY ? window.MCEXBY.get() : "") + '"></label>' +
      '<div class="sm"><b>সদস্য-তালিকা</b> (একই তালিকা, আলাদা ফাইলে — সরাসরি নামবে, ZIP নয়):</div><div class="act" style="flex-wrap:wrap"><button type="button" data-k="xl">📗 Excel</button><button type="button" data-k="xjpg">🖼 JPG</button><button type="button" data-k="xpng">🖼 PNG</button><button type="button" data-k="xpdf">📄 PDF</button></div>' +
      '<div class="sm"><b>কার্ড</b>:</div><div class="act" style="flex-wrap:wrap"><button type="button" data-k="jpg">🪪 কার্ড JPG</button><button type="button" data-k="zip">📦 ZIP (JPG + এক্সেল + PDF)</button></div>' +
      '<details class="cfsec" style="border:1px solid var(--bd);border-radius:10px;padding:4px 10px;margin:4px 0"><summary style="cursor:pointer;font-weight:700;padding:6px 0">ℹ️ কোন বাটনে কী যাবে</summary>' +
      '<div class="sm">📗 এক্সেল: ফোল্ডারের সবাই। 🖼 JPG ও 📦 ZIP: শুধু যাদের কার্ড আছে, একবারে সর্বোচ্চ ' + bd(FMAX) + 'টি (বেশি হলে ফোল্ডারে ফিল্টার/বাছাই করে ছোট করুন)। প্রতিটি JPG ১০০ KB-এর নিচে।</div>' + (nEd ? '<div class="sm">✏️ ⬇ ডাউনলোড ট্যাবের এডিটে সেভ-করা বদল JPG/ZIP-এর কার্ডে লাগবে (ডিজাইন বাছাই বদলাতে চাইলে নিচে নিজে বাছুন)।</div>' : '') +
      '</details>' +
      '<details class="cfsec" style="border:1px solid var(--bd);border-radius:10px;padding:4px 10px;margin:4px 0"><summary style="cursor:pointer;font-weight:700;padding:6px 0">⚙️ ফাইলের ধরন ও ডিজাইন</summary>' +
      '<input id="fzF" type="hidden" value="xlsx"><div class="row"><label>কার্ডের ডিজাইন<select id="fzK">' + opts(kinds, FS.kind) + '</select></label><label style="flex-direction:row;align-items:center;gap:6px"><input id="fzPd" type="checkbox"' + (FS.pdf ? " checked" : "") + ' style="width:20px;height:20px;min-width:20px;padding:0;margin:0"> ZIP-এ PDF (A4)</label><label>PDF-এ প্রতি পাতায়<select id="fzPp">' + opts([["4", "৪টি কার্ড"], ["1", "১টি কার্ড"]], String(FS.pp || 4)) + '</select></label></div>' +
      '</details>' +
      '<div id="fzPr" hidden><div style="height:10px;border-radius:6px;background:var(--bd,#ddd);overflow:hidden"><div id="fzBar" style="height:100%;width:0;background:var(--g,#0b3d2e)"></div></div><div class="sm" id="fzT" style="margin-top:4px"></div><div class="act"><button class="d s" type="button" id="fzSt">⏹ থামান</button></div></div><div id="fzO"></div></div>';
    EL.querySelector("#fzX").onclick = close;
    EL.onclick = function (e) { if (e.target === EL) return close(); var b = e.target.closest("[data-k]"); if (b && !b.disabled) { if (b.dataset.k === "edit") return fedit(); fgo(b.dataset.k); } };
  }
  function fgo(kind) {
    var my = ++RUN, stop = false, live = function () { return my === RUN && !!EL; };
    FS.fmt = kind === "xjpg" ? "jpg" : kind === "xpng" ? "png" : kind === "xpdf" ? "pdf" : "xlsx"; if (/^x(jpg|png|pdf)$/.test(kind)) kind = "xl";
    var byI = EL.querySelector("#fzBy"); if (byI && window.MCEXBY) window.MCEXBY.set(byI.value);
    FS.kind = EL.querySelector("#fzK").value; FS.pdf = EL.querySelector("#fzPd").checked; FS.pp = EL.querySelector("#fzPp").value === "1" ? 1 : 4;
    var pr = EL.querySelector("#fzPr"), out = EL.querySelector("#fzO"), btns = EL.querySelectorAll("[data-k]"), st = EL.querySelector("#fzSt"), base = ascii(FS.name) || "folder", d = new Date();
    var stamp = d.getFullYear() + z2(d.getMonth() + 1) + z2(d.getDate()) + "_" + z2(d.getHours()) + z2(d.getMinutes());
    var setB = function (v) { Array.prototype.forEach.call(btns, function (b) { b.disabled = v; }); };
    function link(blob, nm, label, note, prev) {
      var u = URL.createObjectURL(blob); URLS.push(u); fprog(1, 1, "✅ তৈরি হয়েছে");
      out.innerHTML = (prev ? '<div id="fzPv" class="sm"></div>' : "") + '<a class="cxd" href="' + u + '" download="' + E(nm) + '">⬇ ' + E(label) + " নামান (" + bd(Math.round(blob.size / 1024)) + ' KB)</a><div class="sm">' + note + " ডাউনলোড না হলে লিংকে চেপে ধরে সেভ করুন।</div>";
      if (prev && window.MCXLSX && MCXLSX.preview) { var pvh = out.querySelector("#fzPv"); MCXLSX.preview(pvh, prev, { h: "58vh" }); }
    }
    out.innerHTML = ""; setB(true); pr.hidden = false; st.onclick = function () { stop = true; fprog(0, 1, "⏹ থামানো হচ্ছে…"); };
    if (!FS.users.length) { fprog(0, 1, "⚠️ ফোল্ডারে কেউ নেই।"); setB(false); return Promise.resolve(); }
    var done = function () { if (live()) setB(false); };
    if (kind === "xl") {
      fprog(0, 1, "📊 এক্সেল বানাচ্ছি…");
      return mkUsersXlsx(FS.users, null, FS.name).then(function (b) {
        if (!live()) return;
        if (FS.fmt === "pdf") {
          fprog(0, 1, "📄 PDF বানানো হচ্ছে…");
          return window.MCXLSX.toPdf(b.mcOpt).then(function (pb) { if (live()) link(pb, "MC_" + base + "_" + stamp + ".pdf", "PDF", "একই তালিকা ছবি থেকে PDF — বাংলা ঠিকঠাক দেখায়।"); });
        }
        if (FS.fmt === "png" || FS.fmt === "jpg") {
          var XL2 = window.MCXLSX, pages = XL2.pages(b.mcOpt), pg = 0, nmB = "MC_" + base + "_" + stamp;
          var showP = function () {
            fprog(0, 1, "🖼 ছবি বানানো হচ্ছে…");
            return XL2.image(b.mcOpt, FS.fmt, pg).then(function (im) {
              if (!live()) return;
              link(im, nmB + (pages > 1 ? "_p" + (pg + 1) : "") + "." + FS.fmt, "ছবি (" + FS.fmt.toUpperCase() + (pages > 1 ? " · পাতা " + bd(pg + 1) : "") + ")", "👆 ওপরে প্রিভিউ — একই তালিকা ছবি হয়ে এসেছে, বাংলা ঠিকঠাক দেখায়।" + (pages > 1 ? " পাতা " + bd(pg + 1) + "/" + bd(pages) + " (প্রতি ছবিতে " + bd(XL2.cap) + " জন)।" : ""), im);
              if (pages > 1) {
                var nv = document.createElement("div"); nv.className = "act"; nv.style.flexWrap = "wrap";
                nv.innerHTML = '<button type="button" class="l"' + (pg ? "" : " disabled") + ' data-pp="-1">◀ আগের ' + bd(XL2.cap) + '</button><button type="button"' + (pg < pages - 1 ? "" : " disabled") + ' data-pp="1">পরের ' + bd(XL2.cap) + ' ▶</button>';
                out.insertBefore(nv, out.firstChild);
                nv.onclick = function (e) { var q = e.target.closest("[data-pp]"); if (!q || q.disabled) return; pg = Math.max(0, Math.min(pages - 1, pg + (+q.dataset.pp))); showP(); };
              }
            });
          };
          return showP();
        }
        var xb = new Blob([b], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        return window.MCXLSX.image(b.mcOpt, "png").catch(function () { return null; }).then(function (pv) { if (live()) link(xb, "MC_" + base + "_" + stamp + ".xlsx", "এক্সেল", (pv ? "👆 ওপরে প্রিভিউ (ফাইলের তালিকা) — " : "") + "ভেতরে ফোল্ডারের " + bd(FS.users.length) + " জন।", pv); });
      }).catch(function (e) { if (live()) fprog(0, 1, "⚠️ " + (e && e.message ? e.message : e)); }).then(done);
    }
    if (!X) { fprog(0, 1, "⚠️ কার্ড সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); setB(false); return Promise.resolve(); }
    var libs = [needZip()]; if (kind === "zip" && FS.pdf) libs.push(needPdf());
    fprog(0, 1, "⏳ লাইব্রেরি ও কার্ড খুঁজছি…");
    var items = [], rows = [], fails = [], over = 0, fileOf = {}, zip = null, N = 0, at = 0, noCard = 0, capped = false, DE = FS.id && window.MCDLE ? window.MCDLE.folder(FS.id) : null; // ⬇ ট্যাবের ✏️ এডিট (mc2_dl_edit)
    return Promise.all([Promise.all(libs), fcards(FS.users)]).then(function (r) {
      var L = r[1]; noCard = FS.users.length - L.length; if (!L.length) throw new Error("এই ফোল্ডারের কারও কার্ড পাওয়া যায়নি (কার্ড নাম-মিলিয়ে খোঁজা হয়)।");
      if (L.length > FMAX) { capped = true; L = L.slice(0, FMAX); }
      zip = new window.JSZip(); N = L.length;
      function rkOv(dl, u) { var t = dl && dl.t && dl.t.res, o = t && t.ov && (t.who || []).indexOf(window.MCDLE.pk(u)) >= 0 ? t.ov : null; return o && o.rkm ? { mode: o.rkm, cap: o.rkc || "", val: o.rkv || "" } : { mode: "auto" }; } // ✏️ এডিটে বসানো "র‍্যাংকের লেখা" ফোল্ডার-ZIP-এও লাগে (না থাকলে আগের মতো অটো)
      function one(c0) {
        if (!live() || stop) return Promise.resolve();
        at++; fprog(at - 1, N + 2, "🪪 কার্ড " + bd(at) + "/" + bd(N) + " — " + (c0.name || ""));
        return X.one(c0.id).then(function (c) { var po = DE && DE.p[window.MCDLE.pk(c0._u)], dz = FS.kind || (DE && window.MCDLE.designFor(DE, "res", c0._u)) || (X.dk ? X.dk() : "card1"); return X.rankInfo(c).then(function (inf) { return X.drawFull(po ? window.MCDLE.applyCard(c, po) : c, dz, window.MCDLE.rankEx(X.rkExtra(inf, rkOv(DE, c0._u)), po), null, po ? (po.img ? "with" : po.ph) : undefined); }); })
          .then(function (cv) { return toJpg(cv).then(function (j) { try { cv.width = cv.height = 0; } catch (e) {} return j; }); })
          .then(function (j) {
            if (!j || !j.b) throw new Error("JPG হয়নি");
            return j.b.arrayBuffer().then(function (ab) {
              var u8 = new Uint8Array(ab), fn = ("000" + (rows.length + 1)).slice(-3) + "_" + ascii(c0.name) + "_" + (+c0.score || 0) + ".jpg";
              zip.file("cards/" + fn, u8, { binary: true }); if (j.over) over++; items.push({ u8: u8, w: j.w, h: j.h }); rows.push(c0); fileOf[fk(c0._u)] = fn;
            });
          }).catch(function (e) { fails.push((c0.name || c0.id) + ": " + (e && e.message ? e.message : e)); }).then(tick);
      }
      return L.reduce(function (p, c0) { return p.then(function () { return one(c0); }); }, Promise.resolve());
    }).then(function () {
      if (!live()) return; if (!rows.length) throw new Error(stop ? "থামানো হয়েছে — কোনো কার্ড তৈরি হয়নি।" : "কোনো কার্ড আঁকা যায়নি: " + fails.slice(0, 2).join(" | "));
      var steps = Promise.resolve();
      if (kind === "zip") {
        steps = steps.then(function () { fprog(N, N + 2, "📊 এক্সেল বানাচ্ছি…"); return mkUsersXlsx(FS.users, fileOf, FS.name).then(function (b) { zip.file("folder.xlsx", b, { binary: true }); }); });
        if (FS.pdf) steps = steps.then(function () { fprog(N + 1, N + 2, "📄 PDF বানাচ্ছি…"); return mkPdf(items, FS.pp, tick).then(function (ab) { zip.file("cards.pdf", ab, { binary: true }); }); });
      }
      return steps.then(function () {
        zip.file("README.txt", "MC Explorer Challenge - folder download\r\ncards/ = card JPG files (each under 100 KB)\r\n" + (kind === "zip" ? "folder.xlsx = member list with JPG file names\r\n" + (FS.pdf ? "cards.pdf = A4 pages in the same order\r\n" : "") : "") + "No IP / phone / device info is included.\r\n");
        fprog(N + 1, N + 2, "🗜 ZIP বাঁধছি…");
        return zip.generateAsync({ type: "blob", compression: "STORE" }, function (m) { fprog(N + 1 + m.percent / 100, N + 2, "🗜 ZIP বাঁধছি… " + bd(Math.round(m.percent)) + "%"); });
      }).then(function (blob) {
        if (!live()) return;
        link(blob, "MC_" + base + "_" + (kind === "zip" ? "full_" : "jpg_") + stamp + ".zip", kind === "zip" ? "ZIP (JPG + এক্সেল" + (FS.pdf ? " + PDF" : "") + ")" : "JPG ZIP",
          "ভেতরে <b>cards/</b>-এ " + bd(rows.length) + "টি JPG" + (kind === "zip" ? " · <b>folder.xlsx</b>" + (FS.pdf ? " · <b>cards.pdf</b>" : "") : "") + "।" + (noCard > 0 ? " ℹ️ " + bd(noCard) + " জনের কার্ড নেই/মেলেনি।" : "") + (capped ? " ⚠️ প্রথম " + bd(FMAX) + "টি (বেশি স্কোর আগে)।" : "") + (stop ? " ⏹ থামানোর আগ পর্যন্ত।" : "") + (over ? " ⚠️ " + bd(over) + "টি JPG ১০০ KB-এর নিচে নামেনি।" : " সব JPG ১০০ KB-এর নিচে।") + (fails.length ? " ⚠️ " + bd(fails.length) + "টি আঁকা যায়নি।" : ""));
      });
    }).catch(function (e) { if (live()) fprog(0, 1, "⚠️ " + (e && e.message ? e.message : e)); }).then(function () { if (live()) { setB(false); if (st) st.hidden = true; } });
  }
  function folderOpen(o) {
    M = window.MCA; X = window.MCA_CARDX;
    if (!M || !M.A) { alert("অ্যাডমিন সংযোগ পাওয়া যায়নি — পেজ রিফ্রেশ করুন।"); return; }
    if (EL) close();
    FS = { id: o && o.id != null && o.id !== "" ? String(o.id) : "", name: String((o && o.name) || "ফোল্ডার"), users: ((o && o.users) || []).slice(), sel: !!(o && o.sel), pdf: true, pp: 4, kind: "" };
    EL = document.createElement("div"); EL.className = "cxm"; document.body.appendChild(EL); fpaint();
    if (o && /^(xl|xjpg|xpng|xpdf|jpg|zip)$/.test(o.go)) fgo(o.go);
  }
  window.MCEXP = { open: open, folder: folderOpen, _toJpg: toJpg, _mkPdf: mkPdf };
})();

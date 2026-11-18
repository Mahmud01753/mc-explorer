// অ্যাডমিনের "⬇ এক্সেল" — ফাইলের ভেতরের কমন ডিজাইন (ব্যানার, সারসংক্ষেপ বক্স, সেরা তিনজন, সাজানো টেবিল, ফুটার)। (ধাপ ৩: শুধু 📊 ফলাফল ট্যাব; বাকি ট্যাব পরের ধাপে এটাকেই ডাকবে)
// বাইরের লাইব্রেরি/CDN লাগে না, তাই CSP বদলাতে হয়নি: নিজেই .xlsx (zip + XML) লেখে। শুধু বাটন চাপলে লোড হয় না — ফাইলটা admin.html-এ আছে, সাধারণ ভিজিটরের পেজে নেই।
// (ধাপ ৫: results(opt) এখন opt.colDefs/colOrder/sheet/sub/boxes/pod/tblTitle/tblSrc/srcTxt দিলে যেকোনো ট্যাবের ডাটা লেখে — পুরোনো ডাকে কিছু বদলায়নি; ট্যাবগুলোকে ডাকে admin-xtab.js)
// API: MCXLSX.results(opt) -> Promise<Uint8Array>; MCXLSX.save(bytes, "নাম.xlsx"). লেখা সবসময় টেক্সট (shared string) — তাই "=" দিয়ে শুরু নামও ফর্মুলা হয়ে চলে না।
(function () {
  var G = "0B3D2E", GOLD = "D4AF37", CREAM = "FFF8E1", FONT = "Noto Sans Bengali", SHEET = "ফলাফল";
  var DEF_CLS = ["M.C BRONZE", "M.C SILVER", "M.C GOLD", "M.C PLATINUM", "M.C DIAMOND", "M.C LEGEND"];
  var DEF_MET = [{ g: ["#ffb066", "#e8701a", "#8f3d05", "#ff9a3d"], t: "#ffffff" }, { g: ["#ffffff", "#d3dce5", "#8a9eb1", "#eef3f7"], t: "#10222f" }, { g: ["#fff36b", "#ffc400", "#d98200", "#ffe14d"], t: "#3a1d00" }, { g: ["#dcc6ff", "#9b5cff", "#5b21b6", "#c6a4ff"], t: "#ffffff" }, { g: ["#b4fff7", "#00e0e8", "#0089b4", "#6df5ff"], t: "#00303f" }, { g: ["#fff07a", "#ff4d1a", "#c40a3a", "#ffb300"], t: "#ffffff" }];
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var num = function (n) { return bd(String(Math.round(n * 10) / 10).replace(/^(\d+)/, function (m) { return m.replace(/\B(?=(\d{3})+(?!\d))/g, ","); })); };
  var ORD = ["", "১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"], ord = function (n) { return ORD[n] || bd(n) + "তম"; };
  var tierOf = function (s) { return s >= 920 ? 5 : Math.min(4, Math.floor(s / 200)); }; // app.js-এর tierOf-এর হুবহু নিয়ম
  var esc = function (s) { return String(s == null ? "" : s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var col = function (c) { var s = ""; for (; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + (c - 1) % 26) + s; return s; };
  var hex = function (h) { return String(h || "").replace("#", "").toUpperCase(); };
  var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  // ---------- zip (deflate ব্রাউজারের CompressionStream দিয়ে; না থাকলে সংকোচন ছাড়া) ----------
  var CT = (function () { var t = [], n, k, c; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u) { var c = 0xFFFFFFFF, i; for (i = 0; i < u.length; i++) c = CT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function deflate(u) {
    if (typeof CompressionStream === "undefined" || u.length < 64) return Promise.resolve(null);
    try { var cs = new CompressionStream("deflate-raw"), w = cs.writable.getWriter(); w.write(u); w.close(); return new Response(cs.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); }); } catch (e) { return Promise.resolve(null); }
  }
  function zip(files) {
    var enc = new TextEncoder(), out = [], cen = [], off = 0, d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    function u16(v, x) { v.push(x & 255, (x >>> 8) & 255); } function u32(v, x) { v.push(x & 255, (x >>> 8) & 255, (x >>> 16) & 255, (x >>> 24) & 255); }
    return files.reduce(function (p, f) {
      return p.then(function () {
        var data = typeof f.d === "string" ? enc.encode(f.d) : f.d, nm = enc.encode(f.n), crc = crc32(data);
        return deflate(data).then(function (z) {
          var m = z ? 8 : 0, body = z || data, h = [];
          u32(h, 0x04034b50); u16(h, 20); u16(h, 0x0800); u16(h, m); u16(h, tm); u16(h, dt); u32(h, crc); u32(h, body.length); u32(h, data.length); u16(h, nm.length); u16(h, 0);
          out.push(new Uint8Array(h), nm, body);
          var c = []; u32(c, 0x02014b50); u16(c, 20); u16(c, 20); u16(c, 0x0800); u16(c, m); u16(c, tm); u16(c, dt); u32(c, crc); u32(c, body.length); u32(c, data.length); u16(c, nm.length); u16(c, 0); u16(c, 0); u16(c, 0); u16(c, 0); u32(c, 0); u32(c, off);
          cen.push(new Uint8Array(c), nm); off += h.length + nm.length + body.length;
        });
      });
    }, Promise.resolve()).then(function () {
      var cl = cen.reduce(function (a, b) { return a + b.length; }, 0), e = []; u32(e, 0x06054b50); u16(e, 0); u16(e, 0); u16(e, files.length); u16(e, files.length); u32(e, cl); u32(e, off); u16(e, 0);
      var all = out.concat(cen, [new Uint8Array(e)]), n = all.reduce(function (a, b) { return a + b.length; }, 0), r = new Uint8Array(n), p = 0; all.forEach(function (b) { r.set(b, p); p += b.length; }); return r;
    });
  }

  // ---------- স্টাইল-তালিকা ----------
  function Styles() {
    var fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = [], xfs = [], seen = {};
    function idx(arr, x) { var i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1; } return i; }
    function fontX(f) { f = f || {}; return "<font>" + (f.b ? "<b/>" : "") + (f.i ? "<i/>" : "") + (f.u ? "<u/>" : "") + '<sz val="' + (f.sz || 11) + '"/><color rgb="FF' + (f.c || "10261B") + '"/><name val="' + FONT + '"/><family val="2"/></font>'; }
    function bordX(b) { b = b || {}; return "<border>" + ["l", "r", "t", "b"].map(function (k, i) { var v = b[k], n = ["left", "right", "top", "bottom"][i]; return v ? "<" + n + ' style="' + v[0] + '"><color rgb="FF' + v[1] + '"/></' + n + ">" : "<" + n + "/>"; }).join("") + "<diagonal/></border>"; }
    idx(fonts, fontX({})); idx(borders, bordX({})); xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'); seen["{}"] = 0;
    return {
      get: function (o) { // o: {f:{b,i,u,sz,c}, fill:"RRGGBB", bd:{l,r,t,b:[style,color]}, al:{h,v,w,ind}, nf:id}
        var k = JSON.stringify(o || {}); if (seen[k] != null) return seen[k]; o = o || {};
        var fi = idx(fonts, fontX(o.f)), fl = o.fill ? idx(fills, '<fill><patternFill patternType="solid"><fgColor rgb="FF' + o.fill + '"/><bgColor indexed="64"/></patternFill></fill>') : 0, bo = idx(borders, bordX(o.bd)), a = o.al || {};
        xfs.push('<xf numFmtId="' + (o.nf || 0) + '" fontId="' + fi + '" fillId="' + fl + '" borderId="' + bo + '" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"' + (o.nf ? ' applyNumberFormat="1"' : "") + '><alignment horizontal="' + (a.h || "left") + '" vertical="' + (a.v || "center") + '"' + (a.w ? ' wrapText="1"' : "") + (a.ind ? ' indent="' + a.ind + '"' : "") + "/></xf>");
        return (seen[k] = xfs.length - 1);
      },
      xml: function () { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="' + fonts.length + '">' + fonts.join("") + '</fonts><fills count="' + fills.length + '">' + fills.join("") + '</fills><borders count="' + borders.length + '">' + borders.join("") + '</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' + xfs.length + '">' + xfs.join("") + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'; }
    };
  }

  // ---------- ফলাফল-ফাইল ----------
  // opt: rows[{rk,name,dept,batch,score,ts,…}] (যে ক্রমে টেবিলে বসবে), top3 (সেরা তিনজন; না দিলে rows-এর প্রথম তিনজন), cols (কলাম-চাবির তালিকা; না দিলে আগের ৮টা), filters, mode, cards (সংখ্যা বা null), by, site, logo (PNG bytes বা null), truncated, srcExtra, onProgress(done,total)
  // (ধাপ ৪: কলাম এখন বাছাই করা যায় — banner/বক্স/সেরা তিনজন TW = max(৮, কলাম-সংখ্যা) ঘর জুড়ে বসে; ক্রমিক সবসময় থাকে)
  var COLS = {
    sl: { t: "ক্রমিক", w: 9, a: "c" }, rk: { t: "র‍্যাংক", w: 13, a: "c" }, score: { t: "স্কোর", w: 14, a: "c" }, name: { t: "নাম", w: 34, a: "l" }, dept: { t: "বিভাগ", w: 24, a: "l" }, batch: { t: "সেশন", w: 14, a: "c" }, cls: { t: "ক্লাস", w: 19, a: "c" }, ts: { t: "তারিখ", w: 23, a: "c" },
    pct: { t: "শতাংশ", w: 11, a: "c" }, ok: { t: "সঠিক", w: 9, a: "c" }, wrong: { t: "ভুল", w: 9, a: "c" }, total: { t: "মোট প্রশ্ন", w: 12, a: "c" }, drk: { t: "বিভাগ-র‍্যাংক", w: 15, a: "c" }, uid: { t: "ইউজার আইডি", w: 16, a: "c" }, club: { t: "ক্লাব", w: 22, a: "l" }, title: { t: "উপাধি", w: 26, a: "l" }, best: { t: "সেরা জানা জায়গা", w: 26, a: "l" }
  };
  var EN = { "ক্রমিক": "No.", "র‍্যাংক": "Rank", "স্কোর": "Score", "নাম": "Name", "বিভাগ": "Department", "সেশন": "Session", "ক্লাস": "Class", "তারিখ": "Date", "শতাংশ": "Percent", "সঠিক": "Correct", "ভুল": "Wrong", "মোট প্রশ্ন": "Questions", "বিভাগ-র‍্যাংক": "Dept rank", "ইউজার আইডি": "User ID", "ক্লাব": "Club", "উপাধি": "Title", "সেরা জানা জায়গা": "Best known place" };
  var COL_ORDER = ["sl", "rk", "score", "name", "dept", "batch", "cls", "ts", "pct", "ok", "wrong", "total", "drk", "uid", "club", "title", "best"], COL_DEF = ["sl", "rk", "score", "name", "dept", "batch", "cls", "ts"];
  function resultsCore(opt, BN) {
    var rows = opt.rows || [], N = rows.length, ST = Styles(), SS = [], SSI = {}, M = window.MC || {}, CLS = M.classes || DEF_CLS, MET = M.classMetal || DEF_MET;
    var CD = opt.colDefs ? Object.assign({ sl: COLS.sl }, opt.colDefs) : COLS, ORD2 = opt.colOrder || COL_ORDER, SHT = opt.sheet || SHEET; // ধাপ ৫: opt.colDefs/colOrder/sheet দিলে যেকোনো ট্যাবের ডাটা (না দিলে আগের ফলাফল-কলাম)
    var want = opt.cols && opt.cols.length ? opt.cols : COL_DEF, CK = ORD2.filter(function (k) { return k === "sl" || want.indexOf(k) >= 0; }), NC = CK.length, TW = Math.max(8, NC), LC = col(TW), TC = col(NC);
    var HDR = 20, FIRST = HDR + 1, LAST = Math.max(HDR, HDR + N), FOOT = LAST + 2, BM = 8, W = CK.map(function (k) { return CD[k].w; }); while (W.length < TW) W.push(14);
    var site = /^https?:\/\//i.test(opt.site || "") ? opt.site : "", sx = [], mg = [], links = [], rowsXml = [];
    var str = function (s) { s = String(s == null ? "" : s).replace(/\u279C/g, ":").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/^ +/, "");   // ইমোজি এক্সেলে অনেক জায়গায় বর্ণ-বাক্স (□) দেখায়, তাই ঘরে বসানো হয় না
      var i = SSI[s]; if (i == null) { SS.push(s); i = SSI[s] = SS.length - 1; } return i; };
    function cellX(r, c, v, s) { var ref = col(c) + r; if (v == null || v === "") return '<c r="' + ref + '" s="' + s + '"/>'; return typeof v === "number" ? '<c r="' + ref + '" s="' + s + '"><v>' + v + "</v></c>" : '<c r="' + ref + '" s="' + s + '" t="s"><v>' + str(v) + "</v></c>"; }
    var R = {}; // শিরোনামের ঘর: R[r][c] = [v, s]
    function put(r, c, v, o) { (R[r] = R[r] || {})[c] = [v, ST.get(o)]; }
    function merged(r1, c1, r2, c2, v, o, edge) { // মার্জ-ঘর; edge = বাইরের বর্ডার (সব ঘরের ধারে বসে)
      for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) { var b = Object.assign({}, o.bd || {}); if (edge) { if (c === c1) b.l = edge; if (c === c2) b.r = edge; if (r === r1) b.t = edge; if (r === r2) b.b = edge; } put(r, c, r === r1 && c === c1 ? v : null, Object.assign({}, o, { bd: b })); }
      if (r1 !== r2 || c1 !== c2) mg.push(col(c1) + r1 + ":" + col(c2) + r2);
    }
    var gold = ["thick", GOLD], hair = ["thin", "C9D6CE"], ht = {};
    // ব্যানার (সারি ১–৮): গাঢ় সবুজ জমিন + সোনালি বাইরের বর্ডার
    var banner = []; // [r, c1, c2, v, font, align]
    var lab = { c: GOLD, b: 1, sz: 10 }, val = { c: CREAM, sz: 11 };
    banner.push([1, 1, TW, BN ? "" : "MC Explorer Challenge", { c: GOLD, b: 1, sz: 24 }, { h: "center" }], [2, 1, TW, BN ? "" : "মুরারিচাঁদ কলেজ — MC কতটুকু জানো? (কলেজের জায়গা চেনার কুইজ) · " + (opt.sub || "ফলাফল"), { c: CREAM, b: 1, sz: 13 }, { h: "center" }], [3, 1, TW, BN ? "" : (site ? "🌐 " + site : "🌐 সাইটের ঠিকানা বসানো নেই"), { c: "BFE8C8", sz: 11, u: site ? 1 : 0 }, { h: "center" }]);
    var now = new Date(), pairs = [[4, "Report date\nরিপোর্টের তারিখ-সময়", bd(now.toLocaleString("bn-BD")), "Exported by\nকে বের করেছে", opt.by || "অ্যাডমিন"], [5, "Total records\nমোট রেকর্ড", num(N) + "টি" + (opt.truncated ? " (প্রথম ২০,০০০টি)" : ""), "List type\nতালিকার ধরন", opt.mode || ""]];
    pairs.forEach(function (p) { banner.push([p[0], 1, 2, p[1], lab, { h: "left", ind: 1, w: 1 }], [p[0], 3, 4, p[2], val, { h: "left", w: 1 }], [p[0], 5, 6, p[3], lab, { h: "left", ind: 1, w: 1 }], [p[0], 7, TW, p[4], val, { h: "left", w: 1 }]); });
    var srcTxt = opt.srcTxt != null ? opt.srcTxt : "অ্যাডমিন › 📊 ফলাফল ট্যাব · ডাটাবেজ টেবিল: mc2_scores (র‍্যাংক সাইটের লিডারবোর্ডের মতোই; সমান স্কোরে একই র‍্যাংক)" + (opt.srcExtra || "");
    [[6, "Filters\nপ্রয়োগ-করা ফিল্টার", opt.filters || "কোনো ফিল্টার নেই"], [7, "Data source\nডাটার উৎস", srcTxt], [8, "Columns\nতথ্য-কলাম", CK.map(function (k) { return CD[k].t; }).join(" · ")]].forEach(function (p) { banner.push([p[0], 1, 2, p[1], lab, { h: "left", ind: 1, w: 1 }], [p[0], 3, TW, p[2], val, { h: "left", w: 1 }]); });
    banner.forEach(function (b) {
      var r = b[0], c1 = b[1], c2 = b[2], o = { f: b[4], fill: G, al: Object.assign({ v: "center" }, b[5]), bd: {} };
      for (var c = c1; c <= c2; c++) { var e = {}; if (c === 1) e.l = gold; if (c === TW) e.r = gold; if (r === 1) e.t = gold; if (r === BM) e.b = gold; put(r, c, c === c1 ? b[3] : null, Object.assign({}, o, { bd: e })); }
      if (c2 > c1) mg.push(col(c1) + r + ":" + col(c2) + r);
    });
    ht[1] = BN ? 78 : 44; ht[2] = BN ? 44 : 24; ht[3] = BN ? 34 : 20; ht[4] = 34; ht[5] = 34; ht[6] = 34; ht[7] = 34; ht[8] = 34; ht[9] = 8;
    if (opt.filters && opt.filters.length > 90) ht[6] = 48; if (srcTxt.length > 110) ht[7] = 48; if (CK.length > 9) ht[8] = 40;
    if (site) links.push({ ref: "A3", url: site });
    // সারসংক্ষেপ বক্স (সারি ১০–১১) — TW ঘর চার ভাগে
    var sum = 0, mx = 0, mxI = -1, who = {}; rows.forEach(function (x, i) { var s = +x.score || 0; sum += s; if (s > mx || mxI < 0) { mx = s; mxI = i; } who[String(x.name || "").toLowerCase() + "|" + (x.dept || "") + "|" + (x.batch || "")] = 1; });
    var boxes = opt.boxes || [["Total players\nমোট খেলোয়াড়", num(Object.keys(who).length)], ["Average score\nগড় স্কোর", N ? num(sum / N) : "—"], ["Highest score\nসর্বোচ্চ স্কোর", N ? num(mx) : "—"], ["Total cards\nমোট কার্ড", opt.cards == null ? "—" : num(opt.cards)]];
    var bw = Math.floor(TW / 4), bx = TW - bw * 4, bc = 1, bStart = [];
    boxes.forEach(function (b, i) {
      var c1 = bc, c2 = c1 + bw + (i < bx ? 1 : 0) - 1, edge = ["medium", GOLD]; bc = c2 + 1; bStart.push(c1);
      merged(10, c1, 10, c2, b[0], { f: { c: "7A5C00", b: 1, sz: 10 }, fill: CREAM, al: { h: "center", w: 1 } }, edge);
      merged(11, c1, 11, c2, b[1], { f: { c: G, b: 1, sz: 20 }, fill: CREAM, al: { h: "center" } }, edge);
    });
    ht[10] = 32; ht[11] = 38; ht[12] = 8;
    if (N && !opt.boxes) links.push({ ref: col(bStart[2]) + "11", loc: "A" + (FIRST + mxI) }); // "সর্বোচ্চ স্কোর" বক্সে ক্লিক → ওই সারি
    // সেরা তিনজন (সারি ১৩–১৬)
    merged(13, 1, 13, TW, opt.podTitle || "Top 3 · সেরা তিনজন", { f: { c: G, b: 1, sz: 14 }, fill: GOLD, al: { h: "left", ind: 1 } }, ["medium", GOLD]); ht[13] = 26;
    var pod = [{ f: "F6D36B", t: "3A1D00", b: "D98200" }, { f: "E3E8ED", t: "10222F", b: "8A9EB1" }, { f: "E8B27D", t: "3A1D00", b: "8F3D05" }], top = opt.top3 || rows.slice(0, 3);
    for (var i = 0; i < 3; i++) {
      var x = top[i], p = opt.podNeutral ? { f: CREAM, t: G, b: GOLD } : pod[i], r = 14 + i; ht[r] = 28;
      var txt = opt.pod ? (opt.pod[i] || "") : x ? ord(+x.rk) + " স্থান — " + x.name + " (" + (x.dept || "—") + ") — স্কোর পেয়েছেন ➜ " + bd(x.score) : i === 0 ? "এই ফিল্টারে কোনো ফল নেই" : "";
      merged(r, 1, r, TW, txt, { f: { c: p.t, b: 1, sz: 13 }, fill: p.f, al: { h: "left", ind: 1 } }, ["medium", p.b]);
      if (x && !opt.pod && rows.indexOf(x) >= 0) links.push({ ref: "A" + r, loc: "A" + (FIRST + rows.indexOf(x)) });
    }
    ht[17] = 8;
    // টেবিলের নাম-বার, উৎস-লাইন, হেডার (সারি ১৮–২০)
    merged(18, 1, 18, TW, opt.tblTitle || ("Results · ফলাফল তালিকা — " + (opt.mode || "")), { f: { c: GOLD, b: 1, sz: 14 }, fill: G, al: { h: "left", ind: 1 } }, ["thin", G]); ht[18] = 26;
    merged(19, 1, 19, TW, opt.tblSrc || ("ডাটার উৎস: 📊 ফলাফল ট্যাব · mc2_scores · স্কোরের ঘরের রঙ = ক্লাস (" + CLS.join(", ") + ")"), { f: { c: "6B7B72", i: 1, sz: 9 }, al: { h: "left", ind: 1 } }); ht[19] = 18;
    CK.forEach(function (k, i) { put(HDR, i + 1, EN[CD[k].t] ? EN[CD[k].t] + "\n" + CD[k].t : CD[k].t, { f: { c: "FFFFFF", b: 1, sz: 12 }, fill: G, al: { h: CD[k].a === "l" ? "left" : "center", w: 1 }, bd: { l: ["thin", GOLD], r: ["thin", GOLD], t: ["thin", GOLD], b: ["medium", GOLD] } }); }); ht[HDR] = 40;
    var THB = (opt.thumbs || []).filter(function (t) { return t && t.d && t.d.length; }), THC = CK.indexOf("thumb");
    if (THC < 0) THB = [];
    THB.forEach(function (t) { ht[FIRST + t.row] = 62; }); // ছবির সারি উঁচু (কার্ড প্রিভিউ)
    // ---------- শিটের XML ----------
    function rowX(r, cells, ex) { return '<row r="' + r + '"' + (ht[r] ? ' ht="' + ht[r] + '" customHeight="1"' : "") + (r >= 2 && r <= 19 ? ' outlineLevel="1"' : "") + (ex || "") + ">" + cells + "</row>"; }
    for (var r = 1; r <= HDR; r++) { var cs = R[r] || {}, ks = Object.keys(cs).map(Number).sort(function (a, b) { return a - b; }); rowsXml.push(rowX(r, ks.map(function (c) { return cellX(r, c, cs[c][0], cs[c][1]); }).join(""))); }
    var S = { sc: {}, num: [ST.get({ f: { sz: 11 }, al: { h: "center", w: 1 }, nf: 1, bd: { l: hair, r: hair, t: hair, b: hair } }), ST.get({ f: { sz: 11 }, fill: "F3F8F5", al: { h: "center", w: 1 }, nf: 1, bd: { l: hair, r: hair, t: hair, b: hair } })], zeb: [ST.get({ f: { sz: 11 }, al: { h: "center", w: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } }), ST.get({ f: { sz: 11 }, fill: "F3F8F5", al: { h: "center", w: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } })], zl: [ST.get({ f: { sz: 11 }, al: { h: "left", w: 1, ind: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } }), ST.get({ f: { sz: 11 }, fill: "F3F8F5", al: { h: "left", w: 1, ind: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } })], zb: [ST.get({ f: { sz: 11, b: 1 }, al: { h: "center", w: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } }), ST.get({ f: { sz: 11, b: 1 }, fill: "F3F8F5", al: { h: "center", w: 1 }, bd: { l: hair, r: hair, t: hair, b: hair } })] };
    function scoreSt(t) { // স্কোর "বাটনের মতো": ক্লাসের রঙে ভরাট + মোটা বর্ডার + মাঝে বোল্ড সংখ্যা
      if (S.sc[t] == null) { var m = MET[t] || MET[0], bc = ["medium", hex(m.g[2])]; S.sc[t] = ST.get({ f: { c: hex(m.t), b: 1, sz: 12 }, fill: hex(m.g[1]), al: { h: "center" }, nf: 1, bd: { l: bc, r: bc, t: bc, b: bc } }); } return S.sc[t];
    }
    var medal = function (rk) { return rk === 1 ? "🥇 " : rk === 2 ? "🥈 " : rk === 3 ? "🥉 " : ""; };
    function chunk(a, b) {
      var out = [];
      for (var i = a; i < b; i++) {
        var x = rows[i], r = FIRST + i, z = i % 2, rk = +x.rk || 0, t = tierOf(+x.score || 0), d = new Date(+x.ts), cells = "";
        CK.forEach(function (k, ci) {
          var c = ci + 1, v;
          if (k === "sl") v = cellX(r, c, bd(i + 1), S.zeb[z]);
          else if (k === "rk") v = cellX(r, c, medal(rk) + bd(rk), rk && rk <= 3 ? S.zb[z] : S.zeb[z]);
          else if (k === "score") v = cellX(r, c, +x.score || 0, scoreSt(t));
          else if (k === "name") v = cellX(r, c, x.name, S.zl[z]);
          else if (k === "dept") v = cellX(r, c, x.dept, S.zl[z]);
          else if (k === "batch") v = cellX(r, c, x.batch || "—", S.zeb[z]);
          else if (k === "cls") v = cellX(r, c, CLS[t] || "", S.zeb[z]);
          else if (k === "ts") v = cellX(r, c, isNaN(d) ? "" : bd(d.toLocaleString("bn-BD")), S.zeb[z]);
          else if (k === "pct" || k === "ok" || k === "wrong" || k === "total") v = cellX(r, c, x[k] == null || x[k] === "" || isNaN(+x[k]) ? "" : +x[k], S.num[z]); // আসল সংখ্যা (সর্ট/যোগ চলে)
          else if (k === "drk") v = cellX(r, c, x.drk ? bd(x.drk) : "—", S.zeb[z]);
          else if (k === "uid") v = cellX(r, c, x.uid || "—", S.zeb[z]);
          else if (CD[k].ty === "n") v = cellX(r, c, x[k] == null || x[k] === "" || isNaN(+x[k]) ? "" : +x[k], S.num[z]); // ধাপ ৫: সাধারণ সংখ্যা-কলাম (আসল সংখ্যা)
          else if (CD[k].ty === "c") v = cellX(r, c, x[k] == null || x[k] === "" ? "—" : x[k], S.zeb[z]);
          else v = cellX(r, c, x[k] || "—", S.zl[z]); // club / title / best ও সাধারণ লেখা-কলাম
          cells += v;
        });
        out.push('<row r="' + r + '"' + (ht[r] ? ' ht="' + ht[r] + '" customHeight="1"' : "") + ">" + cells + "</row>");
      }
      return out.join("");
    }
    var parts = [];
    function run(a) {
      if (a >= N) return Promise.resolve();
      var b = Math.min(N, a + 500); parts.push(chunk(a, b)); if (opt.onProgress) opt.onProgress(b, N);
      return tick().then(function () { return run(b); });
    }
    return run(0).then(function () {
      var fr = FOOT, fs = { f: { c: "6B7B72", sz: 9, i: 1 }, al: { h: "center" }, bd: { t: gold } }, ft = "";
      for (var c = 1; c <= TW; c++) ft += cellX(fr, c, c === 1 ? "Auto-generated · এই ফাইল স্বয়ংক্রিয়ভাবে তৈরি — MC Explorer Challenge" : null, ST.get(fs)); mg.push("A" + fr + ":" + LC + fr);
      var NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
      var nextRid = 1, rels = [], hl = links.map(function (l) { if (l.url) { rels.push('<Relationship Id="rId' + nextRid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="' + esc(l.url) + '" TargetMode="External"/>'); return '<hyperlink ref="' + l.ref + '" r:id="rId' + (nextRid++) + '"/>'; } return '<hyperlink ref="' + l.ref + '" location="\'' + SHT + '\'!' + l.loc + '" display="' + esc("সারিতে যান") + '"/>'; }).join("");
      var hasLogo = !!BN || !!(opt.logo && opt.logo.length > 24 && opt.logo[1] === 0x50);
      if (hasLogo || THB.length) rels.push('<Relationship Id="rId' + nextRid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>');
      var drawRid = nextRid;
      var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet ' + NS + '><sheetPr><tabColor rgb="FF' + GOLD + '"/><outlinePr summaryBelow="0"/><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:' + LC + FOOT + '"/>' +
        '<sheetViews><sheetView showGridLines="0" tabSelected="1" workbookViewId="0"><pane ySplit="' + HDR + '" topLeftCell="A' + FIRST + '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A' + FIRST + '" sqref="A' + FIRST + '"/></sheetView></sheetViews>' +
        '<sheetFormatPr defaultRowHeight="22" outlineLevelRow="1"/><cols>' + W.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols><sheetData>" + rowsXml.join("") + parts.join("") + '<row r="' + FOOT + '" ht="20" customHeight="1">' + ft + "</row></sheetData>" +
        '<autoFilter ref="A' + HDR + ":" + TC + LAST + '"/><mergeCells count="' + mg.length + '">' + mg.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join("") + "</mergeCells>" + (hl ? "<hyperlinks>" + hl + "</hyperlinks>" : "") +
        '<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;CMC Explorer Challenge  ·  &amp;P / &amp;N</oddFooter></headerFooter>' + ((hasLogo || THB.length) ? '<drawing r:id="rId' + drawRid + '"/>' : "") + "</worksheet>";
      var sst = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + SS.length + '" uniqueCount="' + SS.length + '">' + SS.map(function (s) { return '<si><t xml:space="preserve">' + esc(s) + "</t></si>"; }).join("") + "</sst>";
      var q = "'" + SHT + "'!", wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook ' + NS + '><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews><sheets><sheet name="' + SHT + '" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">' + q + "$A$" + HDR + ":$" + TC + "$" + LAST + '</definedName><definedName name="_xlnm.Print_Area" localSheetId="0">' + q + "$A$1:$" + LC + "$" + FOOT + '</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">' + q + "$" + HDR + ":$" + HDR + '</definedName></definedNames><calcPr calcId="191029"/></workbook>';
      var files = [
        { n: "[Content_Types].xml", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' + (hasLogo ? '<Default Extension="png" ContentType="image/png"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : "") + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' },
        { n: "_rels/.rels", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
        { n: "docProps/core.xml", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>MC Explorer Challenge — ' + esc(SHT) + '</dc:title><dc:creator>MC Explorer Challenge</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now.toISOString().replace(/\.\d+Z$/, "Z") + "</dcterms:created></cp:coreProperties>" },
        { n: "docProps/app.xml", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>MC Explorer Challenge</Application></Properties>' },
        { n: "xl/workbook.xml", d: wb },
        { n: "xl/_rels/workbook.xml.rels", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>' },
        { n: "xl/styles.xml", d: ST.xml() }, { n: "xl/sharedStrings.xml", d: sst }, { n: "xl/worksheets/sheet1.xml", d: sheet }
      ];
      if (THB.length) { var CTf = files[0]; if (CTf.d.indexOf('Extension="jpeg"') < 0) CTf.d = CTf.d.replace('<Default Extension="xml"', '<Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="xml"'); if (!hasLogo) CTf.d = CTf.d.replace("</Types>", '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'); }
      if (rels.length) files.push({ n: "xl/worksheets/_rels/sheet1.xml.rels", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels.join("") + "</Relationships>" });
      if (hasLogo) {
        var L = BN ? BN.d : opt.logo, w0 = ((L[16] << 24) | (L[17] << 16) | (L[18] << 8) | L[19]) >>> 0, h0 = ((L[20] << 24) | (L[21] << 16) | (L[22] << 8) | L[23]) >>> 0, cy = BN ? BN.h * 9525 : 62 * 9525, cx = BN ? BN.w * 9525 : Math.round(cy * (w0 && h0 ? w0 / h0 : 1)), e = '<xdr:ext cx="' + cx + '" cy="' + cy + '"/>';
        files.push({ n: "xl/drawings/drawing1.xml", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>' + (BN ? 0 : 76200) + '</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>' + (BN ? 0 : 57150) + '</xdr:rowOff></xdr:from>' + e + '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="MC লোগো" descr="MC লোগো"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>' });
        files.push({ n: "xl/drawings/_rels/drawing1.xml.rels", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo1.png"/></Relationships>' });
        files.push({ n: "xl/media/logo1.png", d: L });
      }
      if (THB.length) {
        var off = hasLogo ? 2 : 1, anc = "", drel = "";
        THB.forEach(function (t, i) {
          var rid = "rId" + (off + i), cy = 56 * 9525, cx = Math.round(cy * (t.w && t.h ? t.w / t.h : 0.75)), r0 = FIRST + t.row - 1;
          anc += '<xdr:oneCellAnchor><xdr:from><xdr:col>' + THC + '</xdr:col><xdr:colOff>38100</xdr:colOff><xdr:row>' + r0 + '</xdr:row><xdr:rowOff>19050</xdr:rowOff></xdr:from><xdr:ext cx="' + cx + '" cy="' + cy + '"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' + (10 + i) + '" name="কার্ড ' + (i + 1) + '" descr="কার্ড ' + (i + 1) + '"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>';
          drel += '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/card' + (i + 1) + '.jpg"/>';
          files.push({ n: "xl/media/card" + (i + 1) + ".jpg", d: t.d });
        });
        if (hasLogo) {
          var DF = files.filter(function (x) { return x.n === "xl/drawings/drawing1.xml"; })[0], DR = files.filter(function (x) { return x.n === "xl/drawings/_rels/drawing1.xml.rels"; })[0];
          DF.d = DF.d.replace("</xdr:wsDr>", anc + "</xdr:wsDr>"); DR.d = DR.d.replace("</Relationships>", drel + "</Relationships>");
        } else {
          files.push({ n: "xl/drawings/drawing1.xml", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + anc + "</xdr:wsDr>" });
          files.push({ n: "xl/drawings/_rels/drawing1.xml.rels", d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + drel + "</Relationships>" });
        }
      }
      return zip(files);
    });
  }


  // ---------- বড় ব্যানার-ছবি: সাইটের নাম + বড় লোগো (বাংলা লেখা ছবিতে আঁকা, তাই যেকোনো এক্সেলে ঠিক দেখায়; ফোন/ল্যাপটপের ফন্টের ওপর নির্ভর করে না) ----------
  function bannerPx(opt) {
    var CD = opt.colDefs ? Object.assign({ sl: COLS.sl }, opt.colDefs) : COLS, ORD2 = opt.colOrder || COL_ORDER, want = opt.cols && opt.cols.length ? opt.cols : COL_DEF, CK = ORD2.filter(function (k) { return k === "sl" || want.indexOf(k) >= 0; }), TW = Math.max(8, CK.length), px = 0, i;
    for (i = 0; i < TW; i++) px += Math.round((i < CK.length ? CD[CK[i]].w : 14) * 7 + 5);
    return px;
  }
  function loadImg(u8) { return new Promise(function (res) { try { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = URL.createObjectURL(new Blob([u8], { type: "image/png" })); } catch (e) { res(null); } }); }
  // ব্যানারের লোগো (২০২৬-১২-১৯): বামে MC Explorer লোগো, ডানে MC লোগো — images/ থেকে সরাসরি; না এলে পুরোনো opt.logo (শুধু বামে)
  var BL = null;
  function bannerLogos(opt) {
    if (BL) return BL;
    var get = function (u) { return typeof fetch === "function" ? fetch(u).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { return b ? loadImg(new Uint8Array(b)) : null; }).catch(function () { return null; }) : Promise.resolve(null); };
    return Promise.all([get("images/logo-card-explorer.png"), get("images/logo-mc.png")]).then(function (r) {
      if (r[0] || r[1]) { BL = Promise.resolve(r); return r; }
      return opt.logo && opt.logo.length > 24 ? loadImg(opt.logo).then(function (x) { return [x, null]; }) : [null, null];
    });
  }
  function makeBanner(opt) {
    var W = bannerPx(opt), H = Math.round((78 + 44 + 34) * 96 / 72), K = 2, FAMB = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN",sans-serif';
    if (typeof document === "undefined") return Promise.resolve(null);
    var fl = document.fonts && document.fonts.load ? Promise.all(['400','500','600','700'].map(function (w) { return document.fonts.load(w + ' 40px "Hind Siliguri"', (function(){var s="";for(var q=2432;q<2559;q++)s+=String.fromCharCode(q);return s+" MC 0123456789";})()); })).catch(function () {}) : Promise.resolve();
    return Promise.all([fl, bannerLogos(opt)]).then(function (a) {
      try {
        var lg = a[1][0], rg = a[1][1], cv = document.createElement("canvas"), g; cv.width = W * K; cv.height = H * K; var c = cv.getContext("2d"); if (!c) return null; c.scale(K, K);
        g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#082a1f"); g.addColorStop(.55, "#0B3D2E"); g.addColorStop(1, "#14664a"); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.globalAlpha = .07; c.fillStyle = "#D4AF37"; for (var i = -3; i < 14; i++) { c.save(); c.translate(W * .78 + i * 70, 0); c.rotate(-.5); c.fillRect(0, -80, 26, H * 2); c.restore(); } c.globalAlpha = 1;
        c.strokeStyle = "#D4AF37"; c.lineWidth = 4; c.strokeRect(2, 2, W - 4, H - 4); c.lineWidth = 1.5; c.globalAlpha = .6; c.strokeRect(9, 9, W - 18, H - 18); c.globalAlpha = 1;
        var lh = H - 36, lw = 0, rw = 0, x0 = 28;
        if (lg) { lw = lh * lg.width / lg.height; c.save(); c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = 14; c.drawImage(lg, x0, 18, lw, lh); c.restore(); }
        if (rg) { rw = lh * rg.width / rg.height; c.save(); c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = 14; c.drawImage(rg, W - x0 - rw, 18, rw, lh); c.restore(); } // ডানে MC লোগো
        var cx = (W + (lg ? lw + x0 : 0) - (rg ? rw + x0 : 0)) / 2, y = H * .40; c.textAlign = "center"; c.textBaseline = "alphabetic";
        c.fillStyle = "#D4AF37"; var fs = Math.min(64, (W - lw - rw - 120) / 11); c.font = "800 " + fs + "px " + FAMB; c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 6; c.fillText("MC Explorer Challenge", cx, y); c.shadowBlur = 0;
        c.fillStyle = "#FFF8E1"; c.font = "700 " + Math.max(15, fs * .42) + "px " + FAMB; c.fillText("মুরারিচাঁদ কলেজ — MC কতটুকু জানো?", cx, y + fs * .62);
        var sub = String(opt.sub || "ফলাফল"), site = /^https?:\/\//i.test(opt.site || "") ? String(opt.site).replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
        var pill = site ? sub + "  ·  " + site : sub; c.font = "700 " + Math.max(13, fs * .34) + "px " + FAMB; var pw = Math.min(W - lw - 100, c.measureText(pill).width + 44), ph = Math.max(28, fs * .55), py = H - ph - 22;
        c.fillStyle = "#D4AF37"; c.beginPath(); if (c.roundRect) c.roundRect(cx - pw / 2, py, pw, ph, ph / 2); else c.rect(cx - pw / 2, py, pw, ph); c.fill();
        c.fillStyle = "#0B3D2E"; c.textBaseline = "middle"; c.fillText(pill, cx, py + ph / 2 + 1);
        return new Promise(function (res) { cv.toBlob(function (b) { if (!b) return res(null); b.arrayBuffer().then(function (ab) { res({ d: new Uint8Array(ab), w: W, h: H }); }, function () { res(null); }); }, "image/png"); });
      } catch (e) { return null; }
    });
  }
  function results(opt) { return makeBanner(opt).then(function (bn) { return resultsCore(opt, bn); }).then(function (u8) { try { u8.mcOpt = opt; } catch (e) {} return u8; }); } // mcOpt: একই ডাটা থেকে ছবি (PNG/JPG) বানানোর জন্য

  // ---------- ছবি (PNG/JPG): একই তালিকা ব্রাউজারেই আঁকা — বাংলা বর্ণ-যুক্ত ঠিকঠাক থাকে (মোবাইল এক্সেলে আ-কার/ই-কার ভাঙার সমস্যা নেই) ----------
  var IMG_CAP = 300;
  function renderImage(opt, fmt, pg) { // pg = পাতা (০ থেকে); প্রতি পাতায় ৩০০ জন
    var rows = opt.rows || [], N = rows.length, pages = Math.max(1, Math.ceil(N / IMG_CAP)); pg = Math.max(0, Math.min(pages - 1, pg | 0)); var off = pg * IMG_CAP, shown = rows.slice(off, off + IMG_CAP), M = window.MC || {}, CLS = M.classes || DEF_CLS;
    var CD = opt.colDefs ? Object.assign({ sl: COLS.sl }, opt.colDefs) : COLS, ORD2 = opt.colOrder || COL_ORDER, want = opt.cols && opt.cols.length ? opt.cols : COL_DEF;
    var CK = ORD2.filter(function (k) { return CD[k] && (k === "sl" || want.indexOf(k) >= 0); });
    var FAM = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN",sans-serif';
    var CW = CK.map(function (k) { return Math.round(CD[k].w * 8.5 + 16); }), TWd = CW.reduce(function (a, b) { return a + b; }, 0), W = Math.max(760, TWd + 24), X0 = Math.round((W - TWd) / 2);
    var fl = document.fonts && document.fonts.load ? Promise.all(['400','500','600','700'].map(function (w) { return document.fonts.load(w + ' 20px "Hind Siliguri"', (function(){var s="";for(var q=2432;q<2559;q++)s+=String.fromCharCode(q);return s+" MC 0123456789";})()); })).catch(function () {}) : Promise.resolve();
    return Promise.all([fl, makeBanner(opt)]).then(function (a) {
      var bn = a[1];
      return (bn ? new Promise(function (res) { var u = URL.createObjectURL(new Blob([bn.d], { type: "image/png" })), im = new Image(); im.onload = function () { res(im); setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }; im.onerror = function () { res(null); }; im.src = u; }) : Promise.resolve(null)).then(function (bim) {
        var Hb = bim ? Math.round(W * bim.height / bim.width) : 70, RH = 36, HH = 44;
        var now = new Date(), MET = M.classMetal || DEF_MET, mcx = document.createElement("canvas").getContext("2d");
        var srcTxt = opt.srcTxt != null ? opt.srcTxt : "অ্যাডমিন › 📊 ফলাফল ট্যাব · ডাটাবেজ টেবিল: mc2_scores (র‍্যাংক সাইটের লিডারবোর্ডের মতোই; সমান স্কোরে একই র‍্যাংক)" + (opt.srcExtra || "");
        var P1 = [["Report date · রিপোর্টের তারিখ-সময়", bd(now.toLocaleString("bn-BD"))], ["Exported by · কে বের করেছে", opt.by || "অ্যাডমিন"], ["Total records · মোট রেকর্ড", num(N) + "টি" + (pages > 1 ? " (এই ছবিতে " + num(off + 1) + "–" + num(Math.min(N, off + IMG_CAP)) + " নম্বর · পাতা " + num(pg + 1) + "/" + num(pages) + ")" : "")], ["List type · তালিকার ধরন", opt.mode || "—"]];
        var P2 = [["Filters · ফিল্টার", opt.filters || "কোনো ফিল্টার নেই"], ["Data source · ডাটার উৎস", srcTxt], ["Columns · তথ্য-কলাম", CK.map(function (k) { return CD[k].t; }).join(" · ")]];
        var LW = 210, VW = W - 40 - LW - 24, wrap = function (s, w, max) { mcx.font = "600 13px " + FAM; var out = [], cur = "", ws = String(s).split(/(\s+)/); ws.forEach(function (x) { if (mcx.measureText(cur + x).width > w && cur) { out.push(cur.replace(/\s+$/, "")); cur = x.replace(/^\s+/, ""); } else cur += x; }); if (cur) out.push(cur.replace(/\s+$/, "")); if (out.length > max) { out = out.slice(0, max); out[max - 1] = out[max - 1].replace(/.{1,2}$/, "") + "…"; } return out; };
        var PW = (W - 40 - 24) / 2, PL = 150, P2L = P2.map(function (r) { return wrap(r[1], VW, 2); }), PH = 2 * 34 + P2L.reduce(function (a, l) { return a + (l.length > 1 ? 46 : 34); }, 0) + 16;
var sum = 0, mx = 0, who = {}; rows.forEach(function (x) { var s = +x.score || 0; sum += s; if (s > mx) mx = s; who[String(x.name || "").toLowerCase() + "|" + (x.dept || "") + "|" + (x.batch || "")] = 1; });
        var boxes = opt.boxes || [["মোট খেলোয়াড়", num(Object.keys(who).length)], ["গড় স্কোর", N ? num(sum / N) : "—"], ["সর্বোচ্চ স্কোর", N ? num(mx) : "—"], ["মোট কার্ড", opt.cards == null ? "—" : num(opt.cards)]];
        var top = opt.top3 || rows.slice(0, 3), pod = [0, 1, 2].map(function (i) { var x = top[i]; return opt.pod ? (opt.pod[i] || "") : x ? ord(+x.rk) + " স্থান — " + x.name + " (" + (x.dept || "—") + ") — স্কোর : " + bd(x.score) : i === 0 ? "এই ফিল্টারে কোনো ফল নেই" : ""; }).filter(Boolean);
        var H = Hb + PH + 16 + 62 + 14 + (pod.length * 34 + 40) + 14 + 40 + HH + shown.length * RH + 46;
        var K = Math.max(.5, Math.min(2, Math.sqrt(28e6 / (W * H)))), cv = document.createElement("canvas"); cv.width = Math.round(W * K); cv.height = Math.round(H * K);
        var c = cv.getContext("2d"); if (!c) throw new Error("ছবি আঁকার সুবিধা নেই"); c.scale(K, K);
        c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, W, H); c.textBaseline = "middle";
        var fit = function (s, w) { s = String(s == null ? "" : s); if (c.measureText(s).width <= w) return s; while (s.length > 1 && c.measureText(s + "…").width > w) s = s.slice(0, -1); return s + "…"; };
        var y = 0; if (bim) c.drawImage(bim, 0, 0, W, Hb); else { c.fillStyle = "#0B3D2E"; c.fillRect(0, 0, W, Hb); c.fillStyle = "#D4AF37"; c.textAlign = "center"; c.font = "800 28px " + FAM; c.fillText("MC Explorer Challenge", W / 2, Hb / 2); }
        y = Hb; var pg = c.createLinearGradient(0, y, 0, y + PH); pg.addColorStop(0, "#0B3D2E"); pg.addColorStop(1, "#082a1f"); c.fillStyle = pg; c.fillRect(0, y, W, PH);
        c.strokeStyle = "#D4AF37"; c.lineWidth = 4; c.beginPath(); c.moveTo(2, y); c.lineTo(2, y + PH - 2); c.lineTo(W - 2, y + PH - 2); c.lineTo(W - 2, y); c.stroke();
        var py = y + 8, ln = function (yy) { c.strokeStyle = "rgba(212,175,55,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(20, yy); c.lineTo(W - 20, yy); c.stroke(); };
        c.textAlign = "left"; [0, 1].forEach(function (rr) { [0, 1].forEach(function (cc) { var it = P1[rr * 2 + cc], bx = 20 + cc * (PW + 24); c.fillStyle = "#D4AF37"; c.font = "800 12px " + FAM; c.fillText(fit(it[0], PL + 40), bx + 10, py + 17); c.fillStyle = "#FFF8E1"; c.font = "600 13px " + FAM; c.fillText(fit(it[1], PW - PL - 50), bx + PL + 52, py + 17); }); py += 34; ln(py); });
        P2.forEach(function (it, i) { var lines = P2L[i], hh = lines.length > 1 ? 46 : 34; c.fillStyle = "#D4AF37"; c.font = "800 12px " + FAM; c.fillText(fit(it[0], LW - 14), 30, py + hh / 2); c.fillStyle = "#FFF8E1"; c.font = "600 13px " + FAM; lines.forEach(function (l, li) { c.fillText(l, 20 + LW + 24, py + (lines.length > 1 ? 14 + li * 18 : hh / 2)); }); py += hh; if (i < P2.length - 1) ln(py); });
        y += PH + 16;
        var bw = (W - 40 - 12 * (boxes.length - 1)) / boxes.length;
        boxes.forEach(function (b, i) { var bx = 20 + i * (bw + 12), lb = String(b[0]).split("\n").pop(); c.fillStyle = "#FFF8E1"; c.strokeStyle = "#D4AF37"; c.lineWidth = 2; c.beginPath(); if (c.roundRect) c.roundRect(bx, y, bw, 62, 8); else c.rect(bx, y, bw, 62); c.fill(); c.stroke(); c.textAlign = "center"; c.fillStyle = "#7A5C00"; c.font = "700 13px " + FAM; c.fillText(fit(lb, bw - 12), bx + bw / 2, y + 17); c.fillStyle = "#0B3D2E"; c.font = "800 24px " + FAM; c.fillText(fit(String(b[1]), bw - 12), bx + bw / 2, y + 42); });
        y += 62 + 14; c.textAlign = "left"; c.fillStyle = "#D4AF37"; c.fillRect(20, y, W - 40, 30); c.fillStyle = "#0B3D2E"; c.font = "800 15px " + FAM; c.fillText(opt.podTitle || "সেরা তিনজন", 30, y + 16); y += 34;
        var PC = [["#F6D36B", "#3A1D00"], ["#E3E8ED", "#10222F"], ["#E8B27D", "#3A1D00"]];
        pod.forEach(function (tx, i) { var pc = opt.podNeutral ? ["#FFF8E1", "#0B3D2E"] : PC[i]; c.fillStyle = pc[0]; c.fillRect(20, y, W - 40, 30); c.fillStyle = pc[1]; c.font = "700 14px " + FAM; c.fillText(fit(tx, W - 60), 30, y + 16); y += 34; });
        y += 14; c.fillStyle = "#0B3D2E"; c.fillRect(X0, y, TWd, 30); c.fillStyle = "#D4AF37"; c.font = "800 15px " + FAM; c.fillText(fit(opt.tblTitle || ("ফলাফল তালিকা — " + (opt.mode || "")), TWd - 20), X0 + 10, y + 16); y += 34;
        c.fillStyle = "#6B7B72"; c.font = "italic 11px " + FAM; c.fillText(fit(opt.tblSrc || "", TWd - 20), X0 + 10, y + 3); y += 14;
        // হেডার
        var x = X0; c.fillStyle = "#0B3D2E"; c.fillRect(X0, y, TWd, HH);
        CK.forEach(function (k, i) { c.fillStyle = "#FFFFFF"; c.font = "800 14px " + FAM; c.textAlign = CD[k].a === "l" ? "left" : "center"; c.fillText(fit(CD[k].t, CW[i] - 14), CD[k].a === "l" ? x + 8 : x + CW[i] / 2, y + HH / 2 + 1); x += CW[i]; });
        c.strokeStyle = "#D4AF37"; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, y + HH); c.lineTo(X0 + TWd, y + HH); c.stroke(); y += HH;
        shown.forEach(function (r, i) {
          var rk = +r.rk || 0, t = tierOf(+r.score || 0), d = new Date(+r.ts), xx = X0;
          c.fillStyle = i % 2 ? "#EEF6F0" : "#FFFFFF"; c.fillRect(X0, y, TWd, RH);
          CK.forEach(function (k, ci) {
            var v, bold = false, scM = null;
            if (k === "sl") v = bd(off + i + 1); else if (k === "rk") { v = (rk === 1 ? "🥇 " : rk === 2 ? "🥈 " : rk === 3 ? "🥉 " : "") + bd(rk); bold = rk > 0 && rk <= 3; }
            else if (k === "score") { v = bd(+r.score || 0); bold = true; scM = MET[t] || MET[0]; } else if (k === "name" || k === "dept") v = r[k] || "";
            else if (k === "batch") v = r.batch || "—"; else if (k === "cls") v = CLS[t] || ""; else if (k === "ts") v = isNaN(d) ? "" : bd(d.toLocaleString("bn-BD"));
            else if (k === "pct" || k === "ok" || k === "wrong" || k === "total") v = r[k] == null || r[k] === "" || isNaN(+r[k]) ? "" : bd(+r[k]);
            else if (k === "drk") v = r.drk ? bd(r.drk) : "—"; else if (k === "uid") v = r.uid || "—";
            else if (CD[k].ty === "n") v = r[k] == null || r[k] === "" || isNaN(+r[k]) ? "" : bd(+r[k]); else v = r[k] == null || r[k] === "" ? "—" : String(r[k]);
            if (scM) { var sw = Math.min(CW[ci] - 16, 86), sx = xx + (CW[ci] - sw) / 2; c.fillStyle = scM.g[1]; c.strokeStyle = scM.g[2]; c.lineWidth = 2; c.beginPath(); if (c.roundRect) c.roundRect(sx, y + 5, sw, RH - 10, 8); else c.rect(sx, y + 5, sw, RH - 10); c.fill(); c.stroke(); }
            c.fillStyle = scM ? scM.t : "#1B2B24"; c.font = (bold ? "800 " : "600 ") + "14px " + FAM; c.textAlign = CD[k].a === "l" ? "left" : "center";
            c.fillText(fit(v, CW[ci] - 14), CD[k].a === "l" ? xx + 8 : xx + CW[ci] / 2, y + RH / 2 + 1); xx += CW[ci];
          });
          c.strokeStyle = "#C9D6CE"; c.lineWidth = 1; c.beginPath(); c.moveTo(X0, y + RH); c.lineTo(X0 + TWd, y + RH); c.stroke(); y += RH;
        });
        c.textAlign = "center"; c.fillStyle = "#6B7B72"; c.font = "italic 12px " + FAM;
        c.fillText(pages > 1 ? "পাতা " + num(pg + 1) + "/" + num(pages) + " — নম্বর " + num(off + 1) + "–" + num(Math.min(N, off + IMG_CAP)) + " (মোট " + num(N) + " জন) · MC Explorer Challenge" : "স্বয়ংক্রিয়ভাবে তৈরি — MC Explorer Challenge", W / 2, y + 22);
        return new Promise(function (res, rej) { cv.toBlob(function (b) { try { cv.width = cv.height = 0; } catch (e) {} b ? res(b) : rej(new Error("ছবি তৈরি হয়নি (ফোনের মেমোরি কম হতে পারে)")); }, fmt === "jpg" ? "image/jpeg" : "image/png", .92); });
      });
    });
  }
  function dl(blob, name) {
    var a = document.createElement("a"), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 30000);
  }
  // ---------- প্রিভিউ (ডাউনলোডের আগে): বড় বক্স + জুম + স্ক্রল ----------
  function mountPreview(host, blob, o) {
    o = o || {}; var u = URL.createObjectURL(blob), Z = [50, 75, 100, 150, 200, 300, 400], zi = 2;
    host.innerHTML = '<div style="display:flex;gap:6px;align-items:center;margin:0 0 6px;flex-wrap:wrap"><button type="button" data-z="-" aria-label="ছোট করুন" style="padding:6px 12px">➖</button><b data-zl style="min-width:56px;text-align:center"></b><button type="button" data-z="+" aria-label="বড় করুন" style="padding:6px 12px">➕</button><button type="button" data-z="0" style="padding:6px 12px">↔ পুরো চওড়া</button><span style="font-size:12px;opacity:.85">আঙুল দিয়ে ওপর-নিচে/ডানে-বামে স্ক্রল করুন</span></div>' +
      '<div data-sc style="overflow:auto;border:2px solid #D4AF37;border-radius:10px;background:#fff;-webkit-overflow-scrolling:touch;' + (o.fill ? "flex:1;min-height:0;" : "max-height:" + (o.h || "60vh") + ";") + '"><img alt="প্রিভিউ" style="display:block;height:auto;max-width:none"></div>';
    var im = host.querySelector("img"), zl = host.querySelector("[data-zl]");
    function ap() { im.style.width = Z[zi] + "%"; zl.textContent = bd(Z[zi]) + "%"; }
    host.onclick = function (e) { var b = e.target.closest("[data-z]"); if (!b) return; var k = b.dataset.z; if (k === "+") zi = Math.min(Z.length - 1, zi + 1); else if (k === "-") zi = Math.max(0, zi - 1); else zi = 2; ap(); };
    im.src = u; ap();
    return function () { try { URL.revokeObjectURL(u); } catch (e) {} };
  }
  function previewDl(bytes, name, f) { // ডাউনলোডের আগে প্রিভিউ-জানালা (৩০০ জন করে পাতা: ◀ আগের / পরের ▶); "⬇ নামান" চাপলে তবেই ফাইল নামে
    var isImg = f === "png" || f === "jpg", ext = isImg ? f : "xlsx", base = String(name).replace(/\.(xlsx|png|jpg)$/i, ""), ov = document.createElement("div"), free = null, pg = 0, tok = 0;
    var N = ((bytes.mcOpt && bytes.mcOpt.rows) || []).length, pages = Math.max(1, Math.ceil(N / IMG_CAP));
    ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.74);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    var bs = "padding:10px 16px;border-radius:10px;border:0;font-weight:800;font-size:15px;cursor:pointer;";
    ov.innerHTML = '<div style="background:#10261d;color:#eaf5ee;border:2px solid #D4AF37;border-radius:14px;width:min(1100px,100%);height:min(94vh,100%);display:flex;flex-direction:column;padding:10px;gap:8px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:16px">👁 প্রিভিউ — নামানোর আগে দেখে নিন</b><button type="button" data-c="1" style="' + bs + 'background:#2a3f35;color:#fff;padding:6px 12px">✕ বন্ধ</button></div>' +
      '<div data-i style="font-size:13px;opacity:.9"></div>' +
      (pages > 1 ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" data-p="-1" style="' + bs + 'background:#2a3f35;color:#fff;padding:8px 12px">◀ আগের ' + num(IMG_CAP) + '</button><b data-pl style="flex:1;text-align:center;min-width:140px"></b><button type="button" data-p="1" style="' + bs + 'background:#D4AF37;color:#0B3D2E;padding:8px 12px">পরের ' + num(IMG_CAP) + ' ▶</button></div>' : "") +
      '<div data-pv style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:stretch"><div style="margin:auto;font-weight:700">⏳ প্রিভিউ বানানো হচ্ছে…</div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-ok="1" disabled style="' + bs + 'background:#1f9d62;color:#fff;flex:1;min-width:180px;opacity:.55">⬇ নামান</button><button type="button" data-c="1" style="' + bs + 'background:#2a3f35;color:#fff">বাতিল</button></div></div>';
    document.body.appendChild(ov);
    var ok = ov.querySelector("[data-ok]"), inf = ov.querySelector("[data-i]"), pv = ov.querySelector("[data-pv]"), pl = ov.querySelector("[data-pl]");
    var kb = function (n) { return bd(Math.max(1, Math.round(n / 1024))) + " KB"; };
    function close() { if (free) free(); ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("[data-c]")) return close();
      var b = e.target.closest("[data-p]"); if (b && !b.disabled) { var np = Math.max(0, Math.min(pages - 1, pg + (+b.dataset.p))); if (np !== pg) { pg = np; load(); } }
    });
    function enable(label, fn) { ok.disabled = false; ok.style.opacity = "1"; ok.textContent = label; ok.onclick = function () { fn(); close(); }; }
    function load() {
      var my = ++tok, off = pg * IMG_CAP, to = Math.min(N, off + IMG_CAP), sfx = pages > 1 ? "_p" + (pg + 1) : "";
      ok.disabled = true; ok.style.opacity = ".55"; ok.textContent = "⬇ নামান"; if (free) { free(); free = null; }
      pv.innerHTML = '<div style="margin:auto;font-weight:700">⏳ প্রিভিউ বানানো হচ্ছে…</div>';
      if (pl) pl.textContent = "পাতা " + num(pg + 1) + "/" + num(pages) + " · নম্বর " + num(off + 1) + "–" + num(to);
      Array.prototype.forEach.call(ov.querySelectorAll("[data-p]"), function (b) { var np = pg + (+b.dataset.p); b.disabled = np < 0 || np >= pages; b.style.opacity = b.disabled ? ".4" : "1"; });
      inf.textContent = isImg ? "ফাইল: " + ext.toUpperCase() + " ছবি — একই তালিকা, বাংলা ঠিকঠাক" + (pages > 1 ? " · এই ছবিতে " + num(off + 1) + "–" + num(to) + " নম্বর (মোট " + num(N) + " জন, ছবি " + num(pages) + "টি)" : "") : "ফাইল: Excel (.xlsx) — ফাইলে সবাই (" + num(N) + " জন) থাকবে" + (pages > 1 ? "; প্রিভিউতে " + num(off + 1) + "–" + num(to) + " নম্বর দেখা যাচ্ছে" : "") + " — নিচে একই তালিকার প্রিভিউ";
      renderImage(bytes.mcOpt, f === "jpg" ? "jpg" : "png", pg).then(function (b) {
        if (my !== tok || !ov.isConnected) return; free = mountPreview(pv, b, { fill: true });
        if (isImg) enable("⬇ " + ext.toUpperCase() + (pages > 1 ? " (পাতা " + num(pg + 1) + ")" : "") + " নামান (" + kb(b.size) + ")", function () { dl(b, base + sfx + "." + f); });
        else { var xb = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); enable("⬇ Excel (.xlsx) নামান (" + kb(xb.size) + ")", function () { dl(xb, base + ".xlsx"); }); }
      }).catch(function (e) {
        if (my !== tok || !ov.isConnected) return;
        pv.innerHTML = '<div style="margin:auto;text-align:center;padding:12px">⚠️ প্রিভিউ বানানো যায়নি: ' + String(e && e.message ? e.message : e).replace(/[<>&]/g, "") + "<br>তবুও Excel ফাইল নামাতে পারেন।</div>";
        var xb2 = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }); enable("⬇ Excel (.xlsx) নামান (" + kb(xb2.size) + ")", function () { dl(xb2, base + ".xlsx"); });
      });
    }
    load();
  }
  function save(bytes, name) { // window.MCXFMT ("png"/"jpg") থাকলে একই তালিকা ছবি হয়ে নামে (ডায়ালগের "ফাইলের ধরন"); না হলে .xlsx। দুই ক্ষেত্রেই আগে প্রিভিউ-জানালা
    var f = window.MCXFMT; window.MCXFMT = "xlsx"; f = f === "png" || f === "jpg" || f === "pdf" ? f : "xlsx";
    if (f === "pdf" && bytes && bytes.mcOpt) return toPdf(bytes.mcOpt).then(function (b) { dl(b, String(name).replace(/\.(xlsx|png|jpg|pdf)$/i, "") + ".pdf"); }).catch(function (e) { alert("⚠️ " + (e && e.message ? e.message : e)); });
    if (bytes && bytes.mcOpt && typeof document !== "undefined") return previewDl(bytes, name, f);
    dl(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
  }

  // ---------- "কে বের করেছে" (এডিটযোগ্য; ব্রাউজারে মনে থাকে: mc2_exby) ও PDF (ছবি থেকে, তাই বাংলা ভাঙে না) ----------
  window.MCEXBY = {
    get: function () { try { var v = (localStorage.getItem("mc2_exby") || "").trim(); if (v) return v; } catch (e) {} try { var s = JSON.parse(sessionStorage.getItem("mc2_adm") || "null"); return (s && s.user && s.user.email) || "অ্যাডমিন"; } catch (e) { return "অ্যাডমিন"; } },
    set: function (v) { try { v = String(v == null ? "" : v).trim().slice(0, 80); if (v) localStorage.setItem("mc2_exby", v); else localStorage.removeItem("mc2_exby"); } catch (e) {} }
  };
  function loadPdfLib() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = function () { res(); }; s.onerror = function () { rej(new Error("PDF লাইব্রেরি লোড হয়নি — ইন্টারনেট দেখুন")); }; document.head.appendChild(s); });
  }
  function blobImg(b) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { res({ data: fr.result, w: im.width, h: im.height }); }; im.onerror = function () { rej(new Error("ছবি পড়া যায়নি")); }; im.src = fr.result; }; fr.onerror = function () { rej(new Error("ছবি পড়া যায়নি")); }; fr.readAsDataURL(b); }); }
  function toPdf(opt) { // প্রতিটা ছবি-পাতা (৩০০ জন) = PDF-এর একটা পাতা (চওড়া A4); তালিকা ছবি হয়ে যায় বলে বাংলা ঠিক থাকে
    var pages = Math.max(1, Math.ceil((((opt && opt.rows) || []).length) / IMG_CAP)), doc = null, i = 0;
    return loadPdfLib().then(function () {
      function next() {
        if (i >= pages) return Promise.resolve(doc.output("blob"));
        return renderImage(opt, "jpg", i).then(blobImg).then(function (o) {
          var w = 210, h = Math.min(5000, w * o.h / o.w), or = h > w ? "portrait" : "landscape";
          if (!doc) doc = new window.jspdf.jsPDF({ unit: "mm", format: [w, h], orientation: or, compress: true }); else doc.addPage([w, h], or);
          doc.addImage(o.data, "JPEG", 0, 0, w, h); i++; return next();
        });
      }
      return next();
    });
  }
  window.MCXLSX = { toPdf: toPdf, results: results, image: renderImage, pages: function (o) { return Math.max(1, Math.ceil((((o && o.rows) || []).length) / IMG_CAP)); }, cap: IMG_CAP, preview: mountPreview, save: save, zip: zip, bd: bd, tier: tierOf, classes: function () { return (window.MC && window.MC.classes) || DEF_CLS; }, cols: COLS, colOrder: COL_ORDER };
})();

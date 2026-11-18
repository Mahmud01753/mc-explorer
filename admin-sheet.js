// ভাগ ২ বাদ-পড়া (২০২৬-১২-২৩): 🖼 পোস্টারে শিরোনাম/ব্যাজ/বার্তা/স্লোগান/নিচের শেপ+ইউআরএল/জেন্ডার/QR/বাম-ডান লোগো; 🏆 পাবলিক বিজয়ী কার্ডের ঘর (চালু, স্কোর কার্ড, ছবি আনা, 🔒 কড়া মোড, ডিভাইস, কার্ড-ধরন, বাছা কার্ড) — সবই শুধু এই ফোনে, আসল সেটিংয়ে কিছু লেখা হয় না।
// ভাগ ২ (২০২৬-১২-২২): 🪪 কার্ডে র‍্যাংক-লেখা, 🖼 পোস্টারে লিংক-পিলের রং + ক্যাপশন, 📋 টাইলে রং; ➕ নাম-যোগে "প্রতি গ্রুপে শীর্ষ কতজন" ফিল্টার (সবই শুধু এই ছবির জন্য, নতুন SQL নেই)।
// MC Explorer — 📄 "একসাথে এক পেজ" শিট (২০২৬-১২-২০; নতুন SQL নেই, সার্ভারে কিছু জমা হয় না)।
// যত জনকে বাছবেন তত জনের কার্ড একটাই ছবিতে আসে; উপরে সবসময় হেডার (বাম-ডানে লোগো, সাইটের নাম, স্লোগান, শিরোনাম, তারিখ), নিচে কার্ডগুলো, একদম নিচে সাইটের ঠিকানা।
// ধরন: 📋 বিজয়ী-টাইল · 🪪 কার্ড (ডিজাইন ১/২/৩/স্টোরি) · 🖼 বিজয়ী পোস্টার · 🎓 সার্টিফিকেট · 📣 সোশ্যাল কার্ড (একজনের)।
// এক সারিতে ১/২/৩/৪টা (সিঙ্গেল/ডাবল/ট্রিপল/ফোর) বা অটো; ছবি সহ/ছাড়া/অনুমতি অনুযায়ী = 🪪 কার্ডের একই বাছাই (MCA_CARDX.pm)।
// ডাকা হয়: window.MCSheet.open(people, { kind, title }) — people = [{ key, name, device, dept, batch, score, rank }]
(function () {
  var LSK = "mc2_sheet_cfg", FAM = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN",sans-serif', JPG = /^data:image\/(jpeg|png|webp);base64,/, MAXN = 48;
  var TH = [
    { n: "সবুজ (সাইটের রং)", bg: ["#0b3322", "#1d6b43"], ink: "#ffffff", acc: "#ffd35a", card: "#ffffff", cink: "#10261b", sub: "#4b5f54", chip: "#e7f3ec" },
    { n: "নেভি ও গোল্ড", bg: ["#0b1b3a", "#1b3a7a"], ink: "#ffffff", acc: "#e8c45a", card: "#ffffff", cink: "#0b1b3a", sub: "#4a5878", chip: "#eaf0fb" },
    { n: "কালো ও গোল্ড", bg: ["#0a0a0a", "#2a2410"], ink: "#ffffff", acc: "#e8c45a", card: "#1b1b1b", cink: "#ffffff", sub: "#cfc7a8", chip: "#2c2814" },
    { n: "গোলাপি", bg: ["#5a1440", "#d6336c"], ink: "#ffffff", acc: "#ffe08a", card: "#ffffff", cink: "#3a0f2a", sub: "#7a4a62", chip: "#fde8f0" },
    { n: "হালকা (সাদা)", bg: ["#f7f9ff", "#e3eafc"], ink: "#1c2340", acc: "#c46f00", card: "#ffffff", cink: "#1c2340", sub: "#5a6585", chip: "#eef2ff" },
    { n: "কমলা", bg: ["#a53f00", "#ff8a1f"], ink: "#ffffff", acc: "#fff3b0", card: "#ffffff", cink: "#3a1a00", sub: "#7a5230", chip: "#fff1e0" }
  ];
  var KINDS = [["tiles", "📋 বিজয়ী-তালিকা (ছোট টাইল)"], ["card", "🪪 ফলাফল কার্ড (ছবিসহ ডিজাইন)"], ["poster", "🖼 বিজয়ী পোস্টার"], ["cert", "🎓 সার্টিফিকেট"], ["social", "📣 সোশ্যাল কার্ড (একজনের)"], ["rank", "🏅 র‍্যাংক কার্ড"], ["gpod", "🏆 পডিয়াম (সেরা ৩, একটাই কার্ড)"], ["gboard", "📊 বোর্ড-তালিকা (একটাই কার্ড)"], ["gann", "🎁 ঘোষণা-তালিকা (লাকি ড্র/বিজয়ী, একটাই কার্ড)"]];
  var GRP = { gpod: 1, gboard: 1, gann: 1 }; // একজনের না — বাছা সবাই মিলে একটাই কার্ড (admin-social.js MCSOC.makeGroup)
  // ✏️ এডিট ফোনে (এই ব্রাউজারে) থাকে, ডাটাবেজে/সার্ভারে যায় না: প্রতিজনের বদল mc2_sheet_po, সনদ/সোশ্যালের লেখা-ডিজাইন বদল mc2_sheet_ov
  var PO_KEY = "mc2_sheet_po", OV_KEY = "mc2_sheet_ov";
  function jget(k) { try { var v = JSON.parse(localStorage.getItem(k) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function jset(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); return true; } catch (e) { return false; } }
  var pkOf = function (p) { return p.device ? "d:" + p.device : "n:" + String(p.name || "").trim().toLowerCase(); };
  function lget() { try { var v = JSON.parse(localStorage.getItem(LSK) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function lset(o) { try { localStorage.setItem(LSK, JSON.stringify(o)); } catch (e) {} }
  var esc = function (t) { var M = window.MCA; return M && M.esc ? M.esc(t) : String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var bdg = function (x) { var S = window.MCSocial; return S && S.bd ? S.bd(x) : String(x); };
  var deptL = function (d) { var D = window.MC || {}; return D.deptLabel ? D.deptLabel(d || "") : (d || ""); };
  function siteUrl() { var C = window.MC_CFG || {}, u = C.siteUrl ? C.siteUrl : (/^https?:/.test(location.origin) ? location.origin : ""); return String(u).replace(/^https?:\/\//, "").replace(/\/$/, ""); }
  function today() { try { return new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  var DOMLIKE = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?\/?$/i; // 🌐 ডোমেইন-ধরনের লেখা = অটো (সেভ-করা পুরোনো ডোমেইন নিজে থেকে বদলে এখনকার ডোমেইন হয়)
  function def(o, p) { var D = window.MC || {}; if (p && (p.fa || (typeof p.foot === "string" && DOMLIKE.test(p.foot.trim())))) { p = Object.assign({}, p); delete p.foot; delete p.fa; } return Object.assign({ kind: "tiles", theme: 0, cols: 0, head: true, design: "", pd: 0, pp: 0, mode: "page" }, { site: (D.siteName || "MC Explorer") + " Challenge", slogan: "তুমি এম.সি কতটুকু চেনো?" + (D.college ? "\n" + D.college : ""), title: (o && o.title) || "বিজয়ী তালিকা", sub: today(), foot: siteUrl() }, p, o && o.kind ? { kind: o.kind } : {}, o && o.design ? { design: o.design } : {}, o && o.mode ? { mode: o.mode } : {}); }
  var X = function () { return window.MCA_CARDX || {}; };
  function pm() { var x = X(); return x.pm ? x.pm() : "with"; }

  // ZIP (জমানো, কম্প্রেশন ছাড়া): files = [{name, blob}] → Promise<Blob>
  var CRCT = null;
  function crc32(u) { if (!CRCT) { CRCT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c >>> 0; } } var r = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) r = CRCT[(r ^ u[i]) & 255] ^ (r >>> 8); return (r ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], cd = [], off = 0;
    return Promise.all(files.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); })).then(function (ds) {
      files.forEach(function (f, i) {
        var d = ds[i], nm = enc.encode(f.name), crc = crc32(d), h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true);
        parts.push(h.buffer, nm, d);
        var c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
        cd.push(c.buffer, nm); off += 30 + nm.length + d.length;
      });
      var cds = cd.reduce(function (a, x) { return a + x.byteLength; }, 0), e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cds, true); e.setUint32(16, off, true);
      return new Blob(parts.concat(cd, [e.buffer]), { type: "application/zip" });
    });
  }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fitSz(c, t, maxW, size, wt, min) { var s = size; c.font = wt + " " + s + "px " + FAM; while (c.measureText(t).width > maxW && s > min) { s -= 2; c.font = wt + " " + s + "px " + FAM; } return s; }
  function clip(c, t, maxW) { t = String(t == null ? "" : t); if (c.measureText(t).width <= maxW) return t; while (t.length > 1 && c.measureText(t + "…").width > maxW) t = t.slice(0, -1); return t + "…"; }
  function circ(c, im, cx, cy, r) { c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.clip(); var s = Math.max(2 * r / im.width, 2 * r / im.height), w = im.width * s, h = im.height * s; c.drawImage(im, cx - w / 2, cy - h / 2, w, h); c.restore(); }
  function lines2(c, t, maxW) { var w = String(t).split(/\s+/); if (w.length < 2) return [t]; var best = null; for (var i = 1; i < w.length; i++) { var l1 = w.slice(0, i).join(" "), l2 = w.slice(i).join(" "), m = Math.max(c.measureText(l1).width, c.measureText(l2).width); if (!best || m < best.m) best = { m: m, a: [l1, l2] }; } return best.a; }

  // ---------- টাইল (📋 বিজয়ী-তালিকা) ----------
  function tileCell(r, i, im) {
    return {
      ar: function (cw) { return (cw > 700 ? 230 : 262) / cw; },
      paint: function (c, x, y, w, h, th) {
        var big = w > 700, pd = big ? 168 : 150, pr = pd / 2, ax = x + 30 + pr, ay = y + h / 2;
        c.save(); c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = 20; c.shadowOffsetY = 7; c.fillStyle = th.card; rr(c, x, y, w, h, 30); c.fill(); c.restore();
        c.strokeStyle = th.acc; c.globalAlpha = .55; c.lineWidth = 3; rr(c, x, y, w, h, 30); c.stroke(); c.globalAlpha = 1; c.textBaseline = "middle";
        c.fillStyle = th.acc; c.beginPath(); c.arc(ax, ay, pr + 6, 0, 7); c.fill();
        if (im) circ(c, im, ax, ay, pr); else { c.fillStyle = th.chip; c.beginPath(); c.arc(ax, ay, pr, 0, 7); c.fill(); c.fillStyle = th.cink; c.textAlign = "center"; c.font = "800 " + Math.round(pr * .9) + "px " + FAM; c.fillText(String(r.name || "?").trim().charAt(0), ax, ay + 4); }
        var bx = ax - pr * .72, by = ay - pr * .72; c.fillStyle = th.acc; c.beginPath(); c.arc(bx, by, 27, 0, 7); c.fill(); c.strokeStyle = th.card; c.lineWidth = 4; c.stroke(); c.fillStyle = "#1a1200"; c.textAlign = "center"; c.font = "800 30px " + FAM; c.fillText(bdg(i + 1), bx, by + 2);
        var x0 = x + 30 + pd + 24, mw = w - (x0 - x) - 24, nm = String(r.name || "").trim(), nl; c.textAlign = "left";
        var ns = big ? 46 : 36, fs = fitSz(c, nm, mw, ns, 800, ns - 8); c.font = "800 " + fs + "px " + FAM;
        if (c.measureText(nm).width > mw) { fs = Math.max(24, fs - 4); c.font = "800 " + fs + "px " + FAM; nl = lines2(c, nm, mw).map(function (l) { return clip(c, l, mw); }); } else nl = [nm];
        var dl = [deptL(r.dept), r.batch].filter(Boolean).join(" · "), sc = [r.rank ? "র‍্যাংক #" + bdg(r.rank) : "", r.score != null && r.score !== "" ? "মার্ক " + bdg(r.score) : ""].filter(Boolean).join(" · "), lh = fs + 8, h2 = big ? 34 : 30, tot = nl.length * lh + (dl ? h2 + 10 : 0) + (sc ? h2 + 10 : 0), yy = ay - tot / 2 + lh / 2;
        c.fillStyle = th.cink; c.font = "800 " + fs + "px " + FAM; nl.forEach(function (l) { c.fillText(l, x0, yy); yy += lh; }); yy += -lh / 2 + (dl ? h2 / 2 + 10 : 0);
        if (dl) { c.fillStyle = th.sub; c.font = "600 " + (big ? 28 : 24) + "px " + FAM; c.fillText(clip(c, dl, mw), x0, yy); yy += h2 / 2 + 8 + (sc ? h2 / 2 + 2 : 0); }
        if (sc) { c.font = "700 " + (big ? 28 : 24) + "px " + FAM; var sw = Math.min(mw, c.measureText(sc).width + 28); c.fillStyle = th.chip; rr(c, x0 - 4, yy - h2 / 2 - 2, sw, h2 + 6, 18); c.fill(); c.fillStyle = th.cink; c.fillText(clip(c, sc, mw - 24), x0 + 10, yy + 1); }
        c.textAlign = "center";
      }
    };
  }
  // ---------- তৈরি ছবি (কার্ড/পোস্টার/সনদ…) টাইল ----------
  function cvCell(cv) {
    return { cv: cv, ar: cv.height / cv.width, paint: function (c, x, y, w, h) { var r = Math.min(26, w * .03); c.save(); c.shadowColor = "rgba(0,0,0,.32)"; c.shadowBlur = 22; c.shadowOffsetY = 8; c.fillStyle = "#fff"; rr(c, x, y, w, h, r); c.fill(); c.restore(); c.save(); rr(c, x, y, w, h, r); c.clip(); c.drawImage(cv, x, y, w, h); c.restore(); } };
  }
  function missCell(name, why) {
    return { ar: 1.25, paint: function (c, x, y, w, h, th) { c.save(); c.fillStyle = th.card; c.globalAlpha = .9; rr(c, x, y, w, h, 26); c.fill(); c.restore(); c.fillStyle = th.cink; c.textAlign = "center"; c.textBaseline = "middle"; var s = fitSz(c, name, w - 40, 36, 800, 20); c.font = "800 " + s + "px " + FAM; c.fillText(clip(c, name, w - 40), x + w / 2, y + h / 2 - 22); c.fillStyle = th.sub; c.font = "600 24px " + FAM; c.fillText(why, x + w / 2, y + h / 2 + 22); } };
  }

  // ---------- পুরো পেজ: হেডার + কার্ড-গ্রিড + ফুটার ----------
  function autoCols(kind, n) {
    if (kind === "tiles") return n >= 4 ? 2 : 1;
    if (kind === "cert") return n <= 3 ? 1 : 2;
    return n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 2 : n <= 6 ? 3 : 4;
  }
  function sheet(cfg, cells, lg, K) {
    var n = cells.length, cols = Math.max(1, Math.min(+cfg.cols > 0 ? +cfg.cols : autoCols(cfg.kind, n), n, 5)), W = cols <= 2 ? 1080 : cols === 3 ? 1620 : cols === 4 ? 2160 : 2700, u = W / 1080, MG = 40 * u, gap = 24 * u, th = TH[cfg.theme] || TH[0];
    var cw = Math.floor((W - 2 * MG - gap * (cols - 1)) / cols), rows = [], i;
    for (i = 0; i < n; i += cols) rows.push(cells.slice(i, i + cols));
    var arOf = function (c) { return typeof c.ar === "function" ? c.ar(cw) : c.ar; }, rh = rows.map(function (r) { return Math.max.apply(null, r.map(function (c) { return cw * arOf(c); })); });
    var sl = String(cfg.slogan || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3), head = cfg.head !== false;
    var yS = 108 * u, yL0 = 196 * u, yT = yL0 + sl.length * 40 * u + (sl.length ? 22 : 8) * u, yU = yT + 58 * u, HH = head ? Math.round(yU + (cfg.sub ? 56 : 12) * u) : Math.round(40 * u), FH = 170 * u;
    var H = Math.round(HH + rh.reduce(function (a, b) { return a + b; }, 0) + gap * rows.length + FH), cv = document.createElement("canvas"); K = K || 1; cv.width = Math.round(W * K); cv.height = Math.round(H * K);
    var c = cv.getContext("2d"); c.scale(K, K); c.textAlign = "center"; c.textBaseline = "middle";
    var g = c.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = .08; c.fillStyle = th.ink; c.beginPath(); c.arc(W * .92, 40 * u, 260 * u, 0, 7); c.fill(); c.beginPath(); c.arc(W * .05, H * .55, 200 * u, 0, 7); c.fill(); c.globalAlpha = 1;
    if (head) {
      var lr = 62 * u, lx = [MG + lr + 6 * u, W - MG - lr - 6 * u], hasL = false;
      (lg || []).forEach(function (im, k) { if (!im) return; hasL = true; c.fillStyle = "#ffffff"; c.beginPath(); c.arc(lx[k], 112 * u, lr + 5 * u, 0, 7); c.fill(); circ(c, im, lx[k], 112 * u, lr); });
      var tmax = W - 2 * (MG + (hasL ? 160 * u : 20 * u)); c.fillStyle = th.ink; var s1 = fitSz(c, cfg.site, tmax, 66 * u, 800, 28 * u); c.font = "800 " + s1 + "px " + FAM; c.fillText(clip(c, cfg.site, tmax), W / 2, yS);
      c.fillStyle = th.acc; rr(c, W / 2 - 90 * u, yS + 46 * u, 180 * u, 7 * u, 4 * u); c.fill();
      c.fillStyle = th.ink; c.globalAlpha = .9; sl.forEach(function (t, k) { var sz = fitSz(c, t, W - 2 * MG, 30 * u, 600, 18 * u); c.font = "600 " + sz + "px " + FAM; c.fillText(clip(c, t, W - 2 * MG), W / 2, yL0 + k * 40 * u); }); c.globalAlpha = 1;
      c.fillStyle = th.acc; var s2 = fitSz(c, cfg.title, W - 2 * MG, 54 * u, 800, 26 * u); c.font = "800 " + s2 + "px " + FAM; c.fillText(clip(c, cfg.title, W - 2 * MG), W / 2, yT);
      if (cfg.sub) { c.fillStyle = th.ink; c.globalAlpha = .88; c.font = "600 " + 30 * u + "px " + FAM; c.fillText(clip(c, cfg.sub, W - 2 * MG), W / 2, yU); c.globalAlpha = 1; }
    }
    var y = HH;
    var rects = [];
    rows.forEach(function (r, ri) { var off = (cols - r.length) * (cw + gap) / 2; r.forEach(function (cell, k) { var h = cw * arOf(cell); rects.push({ x: MG + off + k * (cw + gap), y: y + (rh[ri] - h) / 2, w: cw, h: h }); c.save(); cell.paint(c, MG + off + k * (cw + gap), y + (rh[ri] - h) / 2, cw, h, th, u); c.restore(); c.textAlign = "center"; c.textBaseline = "middle"; }); y += rh[ri] + gap; });
    var fy = y + 14 * u; c.fillStyle = th.acc; rr(c, W / 2 - 90 * u, fy, 180 * u, 6 * u, 3 * u); c.fill();
    if (cfg.foot) { c.fillStyle = th.ink; c.font = "800 " + 38 * u + "px " + FAM; c.fillText(clip(c, "খেলুন: " + cfg.foot, W - 2 * MG), W / 2, fy + 56 * u); }
    var htT = cfg.ht == null || cfg.ht === "" ? "#MCExplorer #MCExplorerChallenge" : String(cfg.ht); // #️⃣ হ্যাশট্যাগ লাইন: এডিটে বদলানো যায় ("__none" = লুকানো)
    if (htT !== "__none") { c.fillStyle = th.ink; c.globalAlpha = .8; c.font = "600 " + 26 * u + "px " + FAM; c.fillText(clip(c, htT, W - 2 * MG), W / 2, fy + 106 * u); c.globalAlpha = 1; }
    cv.__r = rects.map(function (z) { return { x: z.x, y: z.y, w: z.w, h: z.h }; }); cv.__W = W; // ট্যাপ-টু-এডিটের জন্য (লজিক্যাল px)
    return cv;
  }

  // ---------- জানালা ----------
  var CSS = ".shm{position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:10070;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:10px}.shb{background:var(--card);color:var(--fg);border-radius:16px;max-width:620px;width:100%;padding:12px;display:grid;gap:8px}.shh{display:flex;justify-content:space-between;align-items:center;gap:8px}.shq{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.shl{max-height:230px;overflow:auto;border:1px solid var(--bd);border-radius:10px;padding:2px 10px}.shl label{display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px dashed var(--bd);font-weight:400}.shl label:first-child{border-top:0}.shl input{width:auto;flex:none}.shg{display:grid;grid-template-columns:1fr 1fr;gap:6px}.shg label{display:grid;gap:2px;font-size:13px}.shg .w{grid-column:1/-1}.shg textarea{min-height:60px}.shg [hidden]{display:none}.shp{width:100%;border-radius:10px;border:1px solid var(--bd);background:#fff}.shs{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.shs button{font-size:13px;padding:4px 10px;border-radius:999px;border:1px solid var(--bd);background:var(--card);color:var(--fg);cursor:pointer}.shs button.on{background:#e7f3ec;border:2px solid #1d6b43;padding:3px 9px;font-weight:700}.shm ~ .unmo{z-index:10080}.shg .shx{display:grid;grid-template-columns:1fr 1fr;gap:6px;grid-column:1/-1}.shg .shx .w{grid-column:1/-1}.shpin>.shb>#shI,.shdle.shpin>.shb>#shSg{position:sticky;top:var(--shtop,0px);z-index:3;background:var(--card);max-height:38vh;overflow:auto}.shpin>.shb>#shI{width:100%;max-width:100%;object-fit:contain;justify-self:stretch}.shpin:not(.shdle)>.shb>.shh{order:-5}.shpin:not(.shdle)>.shb>#shPinW{order:-4}.shpin:not(.shdle)>.shb>#shNote{order:-3}.shpin:not(.shdle)>.shb>#shI{order:-2}.shdle .dlx{display:none!important}.shdle .dlsticky{position:sticky;top:0;z-index:4;background:var(--card);padding:6px 0;border-bottom:1px solid var(--bd);display:grid;gap:6px}.shdle .dlsticky select{width:100%;font-weight:700}.shdle .shs{margin-top:0}.shdle .shs button.on{background:#e7f3ec}.shdle .shs button:disabled{opacity:.45}.shdle .dlbar{position:sticky;bottom:0;z-index:4;background:var(--card);padding:8px 0;border-top:1px solid var(--bd);display:flex;gap:8px;flex-wrap:wrap;align-items:center}.shdle #shSg .shq,.shdle #shSg>div:first-child a{display:none}.shm{overflow-x:hidden}.shb{grid-template-columns:minmax(0,1fr);box-sizing:border-box;max-width:min(620px,100%)}.shb>*{min-width:0}.shg{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.shg .shx{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.shb input,.shb select,.shb textarea{max-width:100%;min-width:0;box-sizing:border-box}.shp{max-width:100%;height:auto}.shqb{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px;padding:4px 0;background:var(--card);order:-3}.shpin>.shb>.shqb{position:sticky;top:var(--shtop,0px);z-index:4}.shpin>.shb>#shI,.shpin>.shb>#shSg{top:calc(var(--shtop,0px) + var(--shqb,0px))}.shqb .qc{display:flex;gap:3px;align-items:stretch;min-width:0}.shqb .qc button{font-size:13px;padding:6px 4px;border-radius:8px;border:1px solid var(--bd);background:var(--card);color:var(--fg);cursor:pointer;line-height:1.2}.shqb .qc .qa{flex:none;width:34px;font-size:16px;font-weight:800}.shqb .qc .qt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font-weight:600}.shqb .qc .qt small{display:block;font-size:10px;opacity:.7;font-weight:400}.dlsec{border:1px solid var(--bd);border-radius:10px;padding:4px 10px;margin:4px 0}.dlsec>summary{cursor:pointer;font-weight:700;padding:6px 0;list-style:revert}.dlsec>*:not(summary){margin:6px 0}";
  function open(people, o) {
    var S = window.MCSocial, M = window.MCA;
    if (!S || !M) { alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।"); return; }
    people = (people || []).filter(function (p) { return p && p.name; });
    if (!people.length) { alert("কোনো নাম নেই।"); return; }
    if (!document.getElementById("shCss")) { var st = document.createElement("style"); st.id = "shCss"; st.textContent = CSS; document.head.appendChild(st); }
    var DL = o && o.dl && window.MCDLE ? o.dl : null, DLM = !!(DL && DL.edit), DLE = window.MCDLE, tdr = {}, tchB = {}, dirtyP = {}, dirtyT = false, dlMsg = ""; // ⬇ ডাউনলোড-এডিট (o.dl): সেভ হয় mc2_dl_edit-এ, mc2_sheet_po/ov/cfg-তে নয়
    var cfg = def(o, lget()), ord = (o && o.pre === "all") || people.length <= 10 ? people.map(function (p, i) { return i; }).slice(0, MAXN) : [], seq = 0, urls = [], PC = {}, tm = 0, built = null, ov = {}, foc = -1, cache = {}, csig = "", po = {}, edK = "", lay = null, saved = DL ? DLE.folder(DL.folder).p : jget(PO_KEY), svOv = DL ? {} : jget(OV_KEY), el = document.createElement("div"); el.className = "shm";
    // ✏️ প্রতিজনের লেখা বদল (শুধু এই ছবির জন্য; আসল ডাটা/সার্ভার বদলায় না): po[ck(p)] = { name, dept, batch, score, rank }
    var osig = function (o) { return JSON.stringify(Object.assign({}, o, o && o.img ? { img: o.img.length + ":" + o.img.slice(-24) } : {})); }, posig = function () { return Object.keys(po).map(function (k) { return k + osig(po[k]); }).join("|"); };
    var ck = function (p) { return (p.key || "") + "|" + (p.device || "") + "|" + p.name; }, eff = function (p) { var o = po[ck(p)]; return o ? Object.assign({}, p, o) : p; };
    people.forEach(function (p) { var sv = saved[pkOf(p)]; if (sv && typeof sv === "object") po[ck(p)] = Object.assign({}, sv); }); // আগের সেভ-করা বদল ফিরিয়ে আনা
    // ===== ⬇ ডাউনলোড-এডিট: ধরন-চাবি (ডিজাইন/রং সব ✅-কার্ডে), প্রতিজনের বদল, সেভ-লজিক =====
    var bk = function (kind) { return DL && kind === DL.kind ? DL.ct : "k:" + kind; };
    function tget(kind) { var b = bk(kind); if (!tdr[b]) tdr[b] = DLE.folder(DL.folder).t[b] || {}; return tdr[b]; }
    function whoNow() { return people.map(pkOf); }
    function tcommit() { var ok = true; Object.keys(tchB).forEach(function (b) { if (!DLE.putT(DL.folder, b, tdr[b] || {}, whoNow())) ok = false; }); if (ok) { tchB = {}; dirtyT = false; } return ok; }
    function tchg(kind) { tchB[bk(kind)] = 1; dirtyT = true; dlMsg = ""; if (!DLM) tcommit(); else dlTopRefresh(); }
    function pcommit(pks) {
      var ok = DLE.putP(DL.folder, pks.map(function (x) { return [x, saved[x] || null]; }));
      if (!ok) { ok = DLE.putP(DL.folder, pks.map(function (x) { var v = saved[x] ? Object.assign({}, saved[x]) : null; if (v) delete v.img; return [x, v]; })); var nt = q("#shNote"); if (nt) nt.textContent = "⚠️ ফোনে জায়গা কম — নতুন ছবি রাখা গেল না" + (ok ? " (লেখার বদল সেভ হয়েছে)।" : ", সেভও হয়নি।"); }
      if (ok) pks.forEach(function (x) { delete dirtyP[x]; }); return ok;
    }
    var isDirty = function () { return dirtyT || Object.keys(dirtyP).length > 0; };
    function dlSave(all) { // 💾 সেভ = এখনকার জন + ডিজাইন; সেভ ও বন্ধ = সবাই + ডিজাইন
      var cur = people[ord[0]], pks = all ? people.map(pkOf) : (cur ? [pkOf(cur)] : []);
      var ok = pcommit(pks); if (!tcommit()) ok = false;
      dlMsg = ok ? "✅ সেভ হয়েছে" : "⚠️ সেভ হয়নি (ফোনে জায়গা নেই)"; dlTopRefresh(); return ok;
    }
    function tryClose() { if (isDirty() && !confirm("সেভ না করা বদল আছে।\nসেভ না করেই বন্ধ করবেন?\n\n[OK] = সেভ ছাড়াই বন্ধ   [Cancel] = থাকুন")) return; close(); }
    var DLPG = 0; // নম্বর-বাটনের পাতা (একবারে ৩০টা)
    function dlTopRefresh() {
      var s = q("#dlNm"), no = q("#dlNo"), st = q("#dlSt"), cur = ord[0]; if (!s || !no) return;
      s.innerHTML = people.map(function (p, i) { return '<option value="' + i + '"' + (i === cur ? " selected" : "") + ">" + bdg(i + 1) + ". " + esc(eff(p).name) + (po[ck(p)] ? " ✏️" : "") + "</option>"; }).join("");
      var P0 = DLPG * 30, P1 = Math.min(people.length, P0 + 30), pgb = "";
      for (var j = P0; j < P1; j++) pgb += '<button type="button" data-dl="go" data-v="' + j + '" title="' + esc(eff(people[j]).name) + '" class="' + (j === cur ? "on" : "") + '">' + bdg(j + 1) + "</button>";
      if (people.length > 30) pgb = (DLPG > 0 ? '<button type="button" data-dl="pgprev">◀ আগের ৩০</button>' : "") + pgb + (P1 < people.length ? '<button type="button" data-dl="pgnext">পরের ৩০ ▶</button>' : "");
      no.innerHTML = pgb + '<button type="button" data-dl="next"' + (cur >= people.length - 1 ? " disabled" : "") + ">পরের ▶</button>";
      if (st) st.textContent = dlMsg || (isDirty() ? "● সেভ হয়নি" : "");
    }
    function dlGo(i) { if (i < 0 || i >= people.length) return; DLPG = Math.floor(i / 30); ord = [i]; foc = 0; edK = ""; dlMsg = ""; sync(); soon(); }
    function dlAct(b) {
      var a = b.dataset.dl; if (b.disabled) return;
      if (a === "go") return dlGo(+b.dataset.v); if (a === "next") return dlGo(ord[0] + 1);
      if (a === "pgprev") { DLPG--; return dlTopRefresh(); } if (a === "pgnext") { DLPG++; return dlTopRefresh(); }
      if (a === "save") return void dlSave(false); if (a === "saveclose") { if (dlSave(true)) close(); }
    }
    function dlInit() { // জানালাকে এডিট-মোডে সাজানো: ওপরে নাম-ড্রপডাউন + ১২৩ + পরের; নিচে সেভ-বাটন; বাকি সেটিং লুকানো
      el.classList.add("shdle");
      var si = 0; people.forEach(function (p, i) { if (DL.start && p.key === DL.start) si = i; }); ord = [si]; foc = 0;
      var hx = function (n) { if (n) n.classList.add("dlx"); };
      ["#shKd", "#shMd", "#shPp", "#shK", "#shC", "#shH", "#shS", "#shG", "#shT", "#shU", "#shF", "#shP"].forEach(function (s) { var e = q(s); hx(e && e.closest("label")); });
      ["#shAdd", "#shAj", "#shAp"].forEach(function (s) { hx(q(s)); });
      var nmD = document.createElement("details"); nmD.className = "dlsec"; nmD.innerHTML = "<summary>👥 নামের তালিকা (টিক দিন — এডিটে আসবে)</summary>"; // এডিটে নামের বাক্স: বাছাই টিকসহ দেখায়
      [q("#shQ"), q("#shFb"), q("#shL")].forEach(function (x) { if (x) { x.classList.remove("dlx"); nmD.appendChild(x); } });
      var mvD = q("#shMv"); if (mvD) mvD.before(nmD);
      var qr = q('[data-q="1"]'), cl = q('[data-ed="clearall"]'); hx(qr && qr.parentNode); hx(cl && cl.parentNode); hx(cl && cl.parentNode && cl.parentNode.nextElementSibling);
      hx(el.querySelector(".shb > .sm")); hx(el.querySelector(".shb").lastElementChild);
      Array.prototype.forEach.call(q("#shMv").children, function (c) { if (c.id !== "shEd") hx(c); });
      el.querySelector(".shh b").textContent = "✏️ এডিট — " + (DL.fname || "ফোল্ডার") + (DL.cname ? " · " + DL.cname : ""); q("#shX").textContent = "✕";
      var top = document.createElement("div"); top.className = "dlsticky"; top.innerHTML = '<select id="dlKd" aria-label="কার্ডের ধরন">' + KINDS.filter(function (k) { return !GRP[k[0]]; }).map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === DL.kind ? " selected" : "") + ">" + esc(k[1]) + "</option>"; }).join("") + '</select><select id="dlNm" aria-label="কার্ডের নাম"></select><div class="shs" id="dlNo"></div>';
      el.querySelector(".shh").after(top); if (window.ResizeObserver) { try { new ResizeObserver(function () { el.style.setProperty("--shtop", top.offsetHeight + "px"); }).observe(top); } catch (e) {} } else el.style.setProperty("--shtop", "96px"); var kd = q("#dlKd"), CTM = { card: "res", tiles: "til", poster: "pst", cert: "cert", social: "soc", rank: "rk" }; // ধরন বদল = একই জানালা নতুন ধরনে (সেভ-চাবি ⬇ ট্যাবের সাথে মেলে)
      if (kd) kd.addEventListener("change", function () {
        var nk = kd.value; if (nk === DL.kind) return;
        if (isDirty() && !confirm("সেভ না করা বদল আছে। ধরন বদলালে সেগুলো বাদ যাবে। চালিয়ে যাবেন?")) { kd.value = DL.kind; return; }
        var nd = Object.assign({}, DL, { kind: nk, ct: CTM[nk] || ("k:" + nk), cname: (KINDS.filter(function (x) { return x[0] === nk; })[0] || [])[1] || DL.cname });
        close(); open(people, Object.assign({}, o, { kind: nk, dl: nd }));
      });
      var dst = document.createElement("details"); dst.className = "dlsec dlst"; dst.innerHTML = "<summary>🎨 থিম, রং, স্লোগান, শিরোনাম</summary>"; // কার্ডের সাথে লাগানো মেনু (ডিফল্টে বন্ধ)
      [q("#shC"), q("#shD"), q("#shG"), q("#shT")].forEach(function (x) { var l = x && x.closest("label"); if (l) { l.classList.remove("dlx"); dst.appendChild(l); } });
      if (q("#shTx")) dst.appendChild(q("#shTx")); // ধরন-ভেদে বাড়তি থিম/শিরোনাম/শব্দ (সনদ, সোশ্যাল, র‍্যাংক, গ্রুপ) — এও কার্ডের মেনুতে
      dst.appendChild(qb); dst.addEventListener("toggle", function () { if (dst.open) qbRefresh(); });
      top.after(q("#shNote"), dst, q("#shI"), q("#shSg"));
      var bar = document.createElement("div"); bar.className = "dlbar"; bar.innerHTML = '<button type="button" data-dl="save">💾 সেভ</button><button type="button" data-dl="saveclose" class="l">সেভ ও বন্ধ</button><span class="sm" id="dlSt"></span>';
      el.querySelector(".shb").appendChild(bar);
    }
    function persist(p) { // এই ফোনে রাখা (ছবি বেশি বড় হলে জায়গা ফুরাতে পারে)
      var k = ck(p), pk = pkOf(p); if (po[k] && Object.keys(po[k]).length) saved[pk] = po[k]; else delete saved[pk];
      if (DL) { dirtyP[pk] = 1; dlMsg = ""; if (!DLM) pcommit([pk]); else dlTopRefresh(); return; }
      if (!jset(PO_KEY, saved)) { var n0 = po[k] && po[k].img; if (n0) { var tmp = Object.assign({}, po[k]); delete tmp.img; saved[pk] = tmp; jset(PO_KEY, saved); } var nt = q("#shNote"); if (nt) nt.textContent = "⚠️ ফোনে জায়গা কম — নতুন ছবিটা এই ডাউনলোডে চলবে, কিন্তু পরেরবারের জন্য রাখা গেল না।"; }
    }
    function fbGate(ps) { return window.MCFB && window.MCFB.gate ? window.MCFB.gate(ps) : Promise.resolve(ps); } // 🚦 admin-fbc.js; না থাকলে সবাই যায়
    var FBLT = [["", "📣 অনুমতি: সব (কোনো ছাঁকা নেই)"], ["yes", "✅ অনুমতি আছে (ছবি সহ বা ছাড়া)"], ["yp", "✅ শুধু ছবি সহ অনুমতি"], ["yn", "✅ শুধু ছবি ছাড়া অনুমতি"], ["no", "❌ অনুমতি নেই (না বলেছেন)"], ["none", "❔ বাছা হয়নি (কিছুই দেননি)"]]; // ভাগ ৪: অনুমতি অনুযায়ী তালিকা ছাঁকা (শুধু দেখার জন্য; সেভ/ডাটাবেজে কিছু যায় না)
    function fbOk(dev, f) { if (!f || !window.MCFB || !window.MCFB.st) return true; var s0 = window.MCFB.st(dev); return !s0 || (f === "yes" ? s0 === "yp" || s0 === "yn" : s0 === f); }
    function fbSel(id) { return window.MCFB ? '<select id="' + id + '" aria-label="ফেসবুক অনুমতি">' + FBLT.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select>" : ""; }
    function rowHtml(p, i) { return '<label data-d="' + esc(p.device || "") + '" data-n="' + esc(String(p.name).toLowerCase()) + '"><input type="checkbox" data-i="' + i + '"><span><b>' + bdg(i + 1) + ". " + esc(p.name) + "</b>" + (p.rank ? ' <span class="sm">· র‍্যাংক #' + bdg(p.rank) + "</span>" : "") + (window.MCFB ? window.MCFB.span(p.device) : "") + '<br><span class="sm">' + esc([deptL(p.dept), p.batch].filter(Boolean).join(" · ") || "—") + "</span></span></label>"; }
    var q = function (s) { return el.querySelector(s); }, PML = (X().PML || [["with", "🖼 ছবি সহ"], ["none", "🙈 ছবি ছাড়া"], ["auto", "📣 অনুমতি অনুযায়ী"]]).map(function (o) { return o[0] === "with" ? ["with", "🖼 অনুমতিহীন ছবিও দেখাও (ছবি থাকলে ছবি; না থাকলে নামের প্রথম অক্ষর)"] : o; }); // "with" = ছবি থাকলেই দেখায়, অনুমতি না থাকলেও; এখানে শুধু নাম স্পষ্ট করা
    var opts = function (a, cur) { return a.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(cur) === String(x[0]) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join(""); };
    var CPK = X().PK || [["card1", "🪪 কার্ড ১"], ["card2", "🪪 কার্ড ২"], ["card3", "🪪 কার্ড ৩"], ["story", "📱 স্টোরি"]], PTH = window.MCPoster && window.MCPoster.TH ? window.MCPoster.TH.map(function (t, i) { return [i, (i + 1) + ". " + t.n]; }) : [[0, "ডিফল্ট"]];
    if (!cfg.design) cfg.design = X().dk ? X().dk() : "card1";
    if (DL) { var t0 = DLE.folder(DL.folder).t[DL.kind === cfg.kind ? DL.ct : "k:" + cfg.kind]; if (t0) { if (t0.design) cfg.design = t0.design; if (t0.pd != null) cfg.pd = t0.pd; } }
    try { if (localStorage.getItem("mc2_adm_pm") == null && X().pmSet) X().pmSet("auto"); } catch (e) {} // ছবির ডিফল্ট = 📣 অনুমতি অনুযায়ী (যার ছবি আছে + অনুমতি আছে তার ছবি; নইলে ছাড়া); আগে নিজে বাছা থাকলে সেটাই থাকে
    el.innerHTML = '<div class="shb"><div class="shh"><b style="font-size:17px">📄 একসাথে এক পেজে</b><button type="button" class="l s" id="shX">✕ বন্ধ</button></div>' +
      '<label class="w' + (DLM ? " dlx" : "") + '" id="shPinW"><span><input type="checkbox" id="shPin" style="width:auto"> 📌 প্রিভিউ ছবি ওপরে আটকে রাখুন (ডিজাইন/রং বদলালে ছবি চোখের সামনে থাকবে)</span></label>' +
      '<div class="sm">যাদের চান বাছুন — সবাই একটাই ছবিতে আসবে: উপরে লোগো-সাইটের নাম-স্লোগান, নিচে কার্ডগুলো (একবারে সর্বোচ্চ ' + bdg(MAXN) + ' জন; বেশি হলে নিচে "প্রতি পেজে কয়জন" দিয়ে কয়েক পেজে ভাগ)।</div>' +
      '<label>কী ধরনের কার্ড<select id="shKd">' + opts(KINDS, cfg.kind) + "</select></label>" +
      '<label>ডাউনলোড কেমন হবে<select id="shMd"><option value="page">📄 গ্রুপ পেজ — একটাই ছবি (হেডার-লোগোসহ, হেডার অন/অফ করা যায়)</option><option value="single">🖼 একা কার্ড — প্রতিজনের আলাদা ফুল-সাইজ ছবি</option></select></label>' +
      '<div class="shq"><button type="button" class="l s" data-q="1">১</button><button type="button" class="l s" data-q="2">২</button><button type="button" class="l s" data-q="3">৩</button><button type="button" class="l s" data-q="4">৪</button><button type="button" class="l s" data-q="5">৫</button><button type="button" class="l s" data-q="7">৭</button><button type="button" class="l s" data-q="10">১০</button><button type="button" class="l s" data-q="a">সব</button><button type="button" class="l s" data-q="0">কেউ না</button><input id="shCn" type="number" inputmode="numeric" min="1" max="24" placeholder="কাস্টম" style="width:78px"><button type="button" class="l s" data-q="c">প্রথম N</button><button type="button" class="l s" data-add="open">➕ নাম যোগ</button><b class="sm" id="shN"></b></div>' +
      '<div id="shAdd" hidden style="display:grid;gap:6px"><input id="shAq" placeholder="🔎 কার্ডওয়ালা কারও নাম লিখে খুঁজুন…" autocomplete="off"><div class="shg" id="shAf"><label>বিভাগ<select id="shAd"><option value="">সব বিভাগ</option></select></label><label>সেশন<select id="shAb"><option value="">সব সেশন</option><option value="__none">— (সেশন নেই)</option></select></label><label data-adm="1">ক্লাব<select id="shAc"><option value="">সব ক্লাব</option><option value="__none">— (ক্লাব নেই)</option></select></label><label data-adm="1">ধরন<select id="shAk"><option value="">সব ধরন</option><option value="male">ছাত্র</option><option value="female">ছাত্রী</option><option value="sir">স্যার</option><option value="mam">ম্যাম</option><option value="visitor">ভিজিটর</option></select></label><label>ছবি<select id="shAp2"><option value="">ছবি সহ ও ছাড়া (সব)</option><option value="1">📷 ছবি সহ</option><option value="0">ছবি ছাড়া</option></select></label><label class="w">অনুমতি (ফেসবুকে ছাড়ার)' + fbSel("shAfb").replace(/^<select/, "<select").replace(FBLT[0][1], "সব") + '</label><label>বাছাই<select id="shAs"><option value="hi">সর্বোচ্চ মার্ক আগে</option><option value="lo">সর্বনিম্ন মার্ক আগে</option><option value="new">সর্বশেষ আগে</option><option value="name">নাম (অ-আ-ক-খ)</option></select></label><label class="w">🏆 প্রতি গ্রুপে শীর্ষ কতজন (মার্ক বেশি যারা)<select id="shAt"><option value="">সব (সীমা নেই)</option><option value="3">শীর্ষ ৩ জন</option><option value="5">শীর্ষ ৫ জন</option><option value="7">শীর্ষ ৭ জন</option><option value="10">শীর্ষ ১০ জন</option><option value="c">কাস্টম (নিজে লিখব)</option></select></label><label id="shAtl" style="display:none">কাস্টম সংখ্যা<input id="shAtn" type="number" min="1" max="50" step="1" inputmode="numeric" placeholder="যেমন ৩"></label><label>গ্রুপ ধরন<select id="shAtg"><option value="dept">বিভাগ ধরে</option><option value="batch">সেশন ধরে</option></select></label><div class="w sm" id="shAm"></div></div><div class="shl" id="shAr"></div></div>' +
      '<input id="shQ" placeholder="🔎 নাম খুঁজুন (তালিকা ছোট করতে)" autocomplete="off">' + fbSel("shFb") + '<div class="shl" id="shL">' + people.map(function (p, i) { return rowHtml(p, i); }).join("") + "</div>" +
      '<div id="shMv"><b class="sm">পেজে এই ক্রমে আসবে</b> <span class="sm">— নাম ছুঁয়ে বাছুন, তারপর সরান</span><div class="shq" style="margin-top:6px"><button type="button" class="l s" data-mv="top">⏫ প্রথমে</button><button type="button" class="l s" data-mv="up">⬆ আগে</button><button type="button" class="l s" data-mv="down">⬇ পরে</button><button type="button" class="l s" data-mv="end">⏬ শেষে</button><button type="button" class="l s" data-mv="rm">✕ বাদ</button></div><div class="shs" id="shSel"></div><div class="shg" id="shEd" hidden style="margin-top:8px"></div></div>' +
      '<div class="shg"><label>প্রতি পেজে কয়জন (০ = সব এক পেজে)<input id="shPp" type="number" min="0" max="48" inputmode="numeric" placeholder="০"></label><label>এক সারিতে (সিঙ্গেল/ডাবল…)<select id="shK">' + opts([[0, "অটো"], [1, "১টা (সিঙ্গেল)"], [2, "২টা (ডাবল)"], [3, "৩টা (ট্রিপল)"], [4, "৪টা (ফোর)"], [5, "৫টা"]], cfg.cols) + '</select></label><label>পেজের রং<select id="shC">' + opts(TH.map(function (t, i) { return [i, t.n]; }), cfg.theme) + "</select></label>" +
      '<label id="shDw" class="w">ডিজাইন<select id="shD"></select></label><label id="shPw" class="w">ছবি (কার্ডে) — সবগুলোতে একই<select id="shP">' + opts(PML, pm()) + "</select></label>" +
      '<div class="sm w" id="shHint"></div><div class="shx" id="shTx" hidden></div>' +
      '<label class="w"><span><input type="checkbox" id="shH" style="width:auto"> হেডার দেখাও (লোগো, সাইটের নাম, স্লোগান, শিরোনাম)</span></label>' +
      '<label class="w">সাইটের নাম<input id="shS" maxlength="60"></label><label class="w">স্লোগান / সাইটের তথ্য (প্রতি লাইনে একটা, সর্বোচ্চ ৩)<textarea id="shG" maxlength="160"></textarea></label><label>শিরোনাম<input id="shT" maxlength="50"></label><label>তারিখ / উপ-লাইন<input id="shU" maxlength="60"></label><label class="w">নিচের লাইন (সাইটের ঠিকানা)<input id="shF" maxlength="60"></label></div>' +
      '<div class="sm" id="shNote">⏳ আঁকা হচ্ছে…</div><img class="shp" id="shI" alt="" hidden><div id="shSg" hidden></div><div class="shq"><button type="button" class="l s" data-ed="clearall">🗑 এই ফোনে সেভ-করা সব এডিট মুছুন</button></div><div class="sm">👆 কোনো কার্ডে ট্যাপ করলে সেটার ✏️ এডিট-প্যানেল খোলে। 🔍 ছবিতে দুই আঙুলে পিঞ্চ করে জুম করুন; ডাবল-ট্যাপে বড়/ছোট; জুম করা অবস্থায় এক আঙুলে টেনে ঘোরান।</div>' +
      '<a class="cxd off" id="shAj" download="winners.jpg">⏳ JPG ডাউনলোড</a><a class="cxd off" id="shAp" download="winners.png">⏳ PNG ডাউনলোড</a>' +
      '<div class="sm">ডাউনলোড না হলে ওপরের ছবিতে চেপে ধরে (লং-প্রেস) "ছবি সেভ করুন" দিন। সার্ভারে কিছু জমা হয় না।</div></div>';
    document.body.appendChild(el);
    var pinOn = function () { try { return localStorage.getItem("mc2_sheet_pin") !== "0"; } catch (e) { return true; } };
    el.classList.toggle("shpin", DLM || pinOn()); q("#shPin").checked = pinOn();
    // 🎨 দ্রুত-বদল বার (ভাগ ৫): ধরন/ডিজাইন/রং/শিরোনাম — আসল ড্রপডাউনগুলোই ‹ › দিয়ে ঘোরায় (নিজে কিছু সেভ করে না), প্রিভিউয়ের ঠিক ওপরে থাকে
    var QBS = [["shKd", "ধরন"], ["shD", "ডিজাইন"], ["xcs", "সনদের ডিজাইন"], ["xd", "রঙের ডিজাইন"], ["xst", "স্টাইল"], ["shC", "রং (পেজ-থিম)"], ["xcp", "সনদ-নাম"], ["xtp", "শিরোনাম"], ["shXzh", "পোস্টার শিরোনাম"], ["shXzb", "টাইটেল"]], qb = document.createElement("div");
    qb.className = "shqb"; qb.hidden = true; (q("#shI") || el.querySelector(".shb")).before(qb);
    if (window.ResizeObserver) { try { new ResizeObserver(function () { el.style.setProperty("--shqb", qb.hidden ? "0px" : qb.offsetHeight + "px"); }).observe(qb); } catch (e) {} }
    function qbRefresh() {
      var h = "", sg = "";
      QBS.forEach(function (d) { var se = q("#" + d[0]); if (d[0] === "shC" && q("#shMd") && q("#shMd").value === "single" && q("#shKd") && q("#shKd").value !== "tiles") return; /* পেজ-থিম শুধু গ্রুপ-পেজ ও টাইলে কাজ করে; কার্ড/স্টোরি/হিস্টরি/সোশ্যালে নয়, তাই বাটন দেখাই না */ if (!se || se.tagName !== "SELECT" || se.options.length < 2 || se.offsetParent === null || se.closest(".shqb")) return; var tx = se.options[se.selectedIndex] ? se.options[se.selectedIndex].text : ""; sg += d[0] + se.selectedIndex + "|"; h += '<div class="qc"><button type="button" class="qa" data-qb="' + d[0] + '|-1" aria-label="আগের">‹</button><button type="button" class="qt" data-qb="' + d[0] + '|0" title="' + esc(tx) + '"><small>' + esc(d[1]) + "</small>" + esc(tx.replace(/^\d+\.\s*/, "")) + '</button><button type="button" class="qa" data-qb="' + d[0] + '|1" aria-label="পরের">›</button><button type="button" class="qg" data-qb="' + d[0] + '|g" title="আসল বক্সে যান" aria-label="আসল বক্সে যান">📍</button></div>'; });
      if (qb.dataset.sg === sg) return; qb.dataset.sg = sg; if (h) h = '<div class="qv"><button type="button" data-qb="_up|0" aria-label="একদম উপরে">⬆ উপরে যান</button><button type="button" data-qb="_dn|0" aria-label="একদম নিচে">⬇ নিচে যান</button></div>' + h; qb.innerHTML = h; qb.hidden = !h; el.style.setProperty("--shqb", h ? qb.offsetHeight + "px" : "0px");
    }
    // ড্রপডাউন মেনু: বারের মাঝের বাটনে ট্যাপ করলে সব অপশনের তালিকা খোলে, সরাসরি বাছা যায় (আসল ড্রপডাউনই বদলায়)
    var qm = null, qmOut = null;
    function qbMenuClose() { if (qm) { qm.remove(); qm = null; } if (qmOut) { document.removeEventListener("pointerdown", qmOut, true); qmOut = null; } }
    function qbMenu(se, btn) {
      var had = qm && qm.dataset.f === se.id; qbMenuClose(); if (had) return;
      var m = document.createElement("div"); m.className = "qbm"; m.dataset.f = se.id; var h = "";
      Array.prototype.forEach.call(se.options, function (o, i) { if (o.disabled) return; h += '<button type="button" class="qbi' + (i === se.selectedIndex ? " on" : "") + '" data-oi="' + i + '">' + esc(o.text) + "</button>"; });
      m.innerHTML = h; el.appendChild(m); qm = m;
      var r = (btn.closest(".qc") || btn).getBoundingClientRect(), W = window.innerWidth || 360, H = window.innerHeight || 640, mw = Math.min(W - 8, Math.max(r.width, 200));
      m.style.width = mw + "px"; m.style.left = Math.max(4, Math.min(r.left, W - mw - 4)) + "px";
      var below = H - r.bottom - 8, above = r.top - 8;
      if (below < 180 && above > below) { m.style.maxHeight = Math.max(120, above) + "px"; m.style.bottom = (H - r.top + 2) + "px"; } else { m.style.maxHeight = Math.max(120, below) + "px"; m.style.top = (r.bottom + 2) + "px"; }
      var on = m.querySelector(".on"); if (on) m.scrollTop = Math.max(0, on.offsetTop - 40);
      m.addEventListener("click", function (e2) {
        var x = e2.target.closest("[data-oi]"); if (!x) return; var i = +x.dataset.oi;
        se.selectedIndex = i; se.dispatchEvent(new Event("input", { bubbles: true })); se.dispatchEvent(new Event("change", { bubbles: true })); qbMenuClose(); qbRefresh();
      });
      qmOut = function (e2) { if (!e2.target.closest || (!e2.target.closest(".qbm") && !e2.target.closest(".qt"))) qbMenuClose(); };
      setTimeout(function () { if (qm === m) document.addEventListener("pointerdown", qmOut, true); }, 0);
    }
    // 🪟 ভাসমান কার্ড: প্রিভিউয়ের কপি স্ক্রিনের ওপর ভাসে; এক আঙুলে ধরে যেখানে খুশি সরানো, দুই আঙুলে পিঞ্চ করে ছোট-বড়। শুধু এই ফোনের ব্রাউজারে মনে থাকে, সার্ভারে কিছু যায় না।
    (function () {
      if (!document.getElementById("shfl-css")) {
        var st0 = document.createElement("style"); st0.id = "shfl-css";
        st0.textContent = ".shqb .qv{grid-column:1/-1;display:flex;justify-content:space-between;gap:6px}.shqb .qv button{flex:1;font-size:12px;padding:5px 6px;border-radius:8px;border:1px solid var(--bd);background:var(--card);color:var(--fg);cursor:pointer;line-height:1.2}.shqb .qc .qa{width:26px}.shqb .qc .qg{flex:none;width:26px;padding:4px 0;border:1px solid #e11d48;color:#e11d48;font-size:14px;background:var(--card);border-radius:8px;cursor:pointer}" +
          ".qbm{position:fixed;z-index:10090;overflow:auto;background:var(--card);color:var(--fg);border:1px solid var(--bd);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.45);padding:4px}.qbm .qbi{display:block;width:100%;text-align:left;padding:9px 10px;border:0;border-radius:7px;background:transparent;color:var(--fg);font-size:14px;cursor:pointer}.qbm .qbi.on{background:#7c3aed;color:#fff;font-weight:700}" +
          ".shpin:not(.shdle)>.shb>#shFlW{order:-4}.shfl>.shb>#shI,.shfl>.shb>.zmw{order:99!important;position:static!important;max-height:none!important}.shfl>.shb>.shqb{position:sticky;top:var(--shtop,0px);z-index:4}" +
          ".shflb{position:fixed;z-index:10075;touch-action:none;background:var(--card);border:2px solid #7c3aed;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.5);overflow:hidden;user-select:none;-webkit-user-select:none;cursor:grab}.shflb[hidden]{display:none}.shflb img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}.shflh{display:flex;align-items:center;gap:4px;background:#7c3aed;color:#fff;font-size:12px;padding:3px 4px}.shflh span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shflh button{flex:none;border:0;border-radius:6px;background:rgba(255,255,255,.22);color:#fff;font-size:14px;min-width:28px;padding:2px 6px;cursor:pointer;line-height:1.3}";
        document.head.appendChild(st0);
      }
      var KEY = "mc2_sheet_fl", ON = "mc2_sheet_flon", lab = document.createElement("label");
      lab.className = "w"; lab.id = "shFlW"; lab.innerHTML = '<span><input type="checkbox" id="shFl" style="width:auto"> 🪟 কার্ড ভাসমান রাখুন (প্রিভিউ ধরে যেখানে খুশি সরান; দুই আঙুলে ছোট-বড়)</span>';
      var pw = q("#shPinW"); if (pw) pw.after(lab); else (el.querySelector(".shb") || el).prepend(lab);
      var box = document.createElement("div"); box.className = "shflb"; box.hidden = true;
      box.innerHTML = '<div class="shflh"><span>✥ ধরে সরান</span><button type="button" data-fl="-" aria-label="ছোট">−</button><button type="button" data-fl="+" aria-label="বড়">+</button><button type="button" data-fl="x" aria-label="বন্ধ">✕</button></div><img alt="" draggable="false">';
      el.appendChild(box);
      var im = box.querySelector("img"), cb = q("#shFl"), P = {}, g = null, tp = null, st = { x: 0, y: 0, w: 0 };
      try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); st.x = +o.x || 0; st.y = +o.y || 0; st.w = +o.w || 0; } catch (e) {}
      function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
      function place() {
        var W = window.innerWidth || 360, H = window.innerHeight || 640;
        if (!st.w) st.w = Math.round(Math.min(230, W * 0.55)); st.w = Math.max(90, Math.min(W - 8, st.w));
        if (!st.x && !st.y) { st.x = W - st.w - 8; st.y = 70; }
        st.x = Math.max(0, Math.min(W - st.w, st.x)); st.y = Math.max(0, Math.min(H - 44, st.y));
        box.style.width = st.w + "px"; box.style.left = st.x + "px"; box.style.top = st.y + "px";
      }
      function srcSync() { var a = q("#shI"), s = ""; if (a && !a.hidden && a.getAttribute("src")) s = a.src; else { var g2 = q("#shSg img"); if (g2) s = g2.src; } if (s && im.getAttribute("src") !== s) im.src = s; }
      function setOn(on, keep) {
        el.classList.toggle("shfl", on); box.hidden = !on; cb.checked = on; if (on) { place(); srcSync(); }
        if (!keep) { try { localStorage.setItem(ON, on ? "1" : "0"); } catch (e) {} }
      }
      cb.addEventListener("change", function () { setOn(cb.checked); });
      try { new MutationObserver(function () { if (!box.hidden) srcSync(); }).observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "hidden"] }); } catch (e) {}
      window.addEventListener("resize", function () { if (!box.hidden) place(); });
      box.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return; try { box.setPointerCapture(e.pointerId); } catch (x) {}
        P[e.pointerId] = { x: e.clientX, y: e.clientY }; var k = Object.keys(P); tp = k.length === 1 ? { x: e.clientX, y: e.clientY, mv: false } : null;
        if (k.length === 1) g = { m: "d", x: e.clientX, y: e.clientY, sx: st.x, sy: st.y };
        else if (k.length === 2) { var a = P[k[0]], b = P[k[1]]; g = { m: "p", d: Math.hypot(a.x - b.x, a.y - b.y) || 1, w: st.w }; }
        e.preventDefault();
      });
      box.addEventListener("pointermove", function (e) {
        if (!P[e.pointerId] || !g) return; P[e.pointerId] = { x: e.clientX, y: e.clientY }; var k = Object.keys(P); if (tp && Math.hypot(e.clientX - tp.x, e.clientY - tp.y) > 8) tp.mv = true; if (k.length > 1) tp = null;
        if (k.length >= 2 && g.m === "p") { var a = P[k[0]], b = P[k[1]]; st.w = g.w * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / g.d; place(); }
        else if (k.length === 1 && g.m === "d") { st.x = g.sx + e.clientX - g.x; st.y = g.sy + e.clientY - g.y; place(); }
        e.preventDefault();
      });
      function tapHit(e) { // ভাসমান কার্ডে ট্যাপ → আসল প্রিভিউয়ের মতোই সেই কার্ডের ✏️ এডিট-প্যানেল
        if (!lay || !lay.r) return; var rc = im.getBoundingClientRect(); if (!rc.width) return;
        var x = (e.clientX - rc.left) / rc.width * lay.w, y = (e.clientY - rc.top) / rc.height * lay.h, hit = -1;
        lay.r.forEach(function (c, i) { if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) hit = i; });
        if (hit >= 0) { foc = hit; edK = ""; sync(); var ed = q("#shEd"); if (ed && ed.scrollIntoView) ed.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      }
      function up(e) { if (e.type === "pointerup" && tp && !tp.mv && Object.keys(P).length === 1) tapHit(e); tp = null; delete P[e.pointerId]; var k = Object.keys(P); if (k.length === 1) g = { m: "d", x: P[k[0]].x, y: P[k[0]].y, sx: st.x, sy: st.y }; else if (!k.length) { g = null; save(); } }
      box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
      box.addEventListener("wheel", function (e) { e.preventDefault(); st.w *= e.deltaY < 0 ? 1.08 : 1 / 1.08; place(); save(); }, { passive: false });
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-fl]"); if (!b) return; var k = b.dataset.fl;
        if (k === "x") { setOn(false); return; } st.w *= k === "+" ? 1.2 : 1 / 1.2; place(); save();
      });
      var on0 = false; try { on0 = localStorage.getItem(ON) === "1"; } catch (e) {}
      if (on0) setOn(true, true);
    })();
    qb.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qb]"); if (!b) return; var a = b.dataset.qb.split("|");
      if (a[0] === "_up") { qbMenuClose(); el.scrollTo({ top: 0, behavior: "smooth" }); return; }
      if (a[0] === "_dn") { qbMenuClose(); el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); return; }
      var se = q("#" + a[0]), d = +a[1]; if (!se) return;
      if (a[1] === "g") { qbMenuClose(); se.scrollIntoView({ block: "center", behavior: "smooth" }); try { se.focus({ preventScroll: true }); } catch (z) {} se.style.outline = "3px solid #e11d48"; setTimeout(function () { se.style.outline = ""; }, 2200); return; }
      if (!d) { qbMenu(se, b); return; }
      var n = se.options.length, i = se.selectedIndex < 0 ? 0 : se.selectedIndex, k; for (k = 0; k < n; k++) { i = (i + d + n) % n; if (!se.options[i].disabled) break; }
      se.selectedIndex = i; se.dispatchEvent(new Event("input", { bubbles: true })); se.dispatchEvent(new Event("change", { bubbles: true })); qbRefresh();
    });
    setTimeout(qbRefresh, 0); setTimeout(qbRefresh, 400);
    function close() { seq++; clearTimeout(tm); urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); el.remove(); }
    // বাছাই = টিক দেওয়ার ক্রমে (১ম টিক = ১ নম্বর কার্ড); "প্রথম ৫" বাটনে তালিকার ক্রমে
    function rowsNow() { return ord.slice(0, MAXN).map(function (i) { return people[i]; }); }
    function addIdx(c) { var at = -1; people.forEach(function (x, i) { if (ck(x) === ck(c) || (x.device && x.device === c.device)) at = i; }); return at; }
    function addMarks() { Array.prototype.forEach.call(el.querySelectorAll("[data-addc]"), function (b) { var c = addRes[+b.dataset.addc], at = c ? addIdx(c) : -1; b.checked = at >= 0 && ord.indexOf(at) >= 0; }); } // ➕ নাম যোগ তালিকার ✓: বাছা থাকলে টিক, বাদ দিলে ওঠে
    function sync() {
      Array.prototype.forEach.call(el.querySelectorAll("[data-i]"), function (b) { b.checked = ord.indexOf(+b.dataset.i) >= 0; }); addMarks();
      var n = rowsNow().length; q("#shN").textContent = "বাছা: " + bdg(n) + " জন" + (ord.length > MAXN ? " (প্রথম " + bdg(MAXN) + "টা)" : "");
      if (foc >= n) foc = n - 1;
      q("#shSel").innerHTML = n ? rowsNow().map(function (p, k) { return '<button type="button" data-ri="' + k + '" class="' + (k === foc ? "on" : "") + '">' + bdg(k + 1) + ". " + esc(eff(p).name) + (po[ck(p)] ? " ✏️" : "") + ' <span data-rm="' + k + '" title="বাদ দিন" style="margin-left:4px;color:#b42318;font-weight:800">✕</span></button>'; }).join("") : '<span class="sm">কাউকে বাছা হয়নি — ওপরের তালিকায় নামের পাশে টিক দিন।</span>';
      Array.prototype.forEach.call(el.querySelectorAll("[data-mv]"), function (b) { b.disabled = foc < 0 || foc >= n; });
      edUI(); if (DLM) dlTopRefresh();
    }
    var dlOpen = {}; // ভাঁজ করা মেনু কোনটা খোলা (ডিফল্টে সব বন্ধ)
    function foldNormal() { // 📄 একসাথে এক পেজে (সাধারণ): নিচের বাছাই/সেটিং/লেখার অংশ ছোট ভাঁজে; ওপরের পিন, ধরন-বার, প্রিভিউ আগের মতো
      var shb = el.querySelector(".shb"); if (!shb) return;
      var top = function (n) { while (n && n.parentNode !== shb) n = n.parentNode; return n || null; };
      var pick = function (sel) { return top(el.querySelector(sel)); };
      var descN = Array.prototype.filter.call(shb.children, function (c) { return c.classList && c.classList.contains("sm") && /যাদের চান বাছুন/.test(c.textContent); })[0] || null;
      var groups = [
        { t: "🗂 কার্ডের ধরন ও ডাউনলোড", n: [pick("#shKd"), pick("#shMd")] },
        { t: "👥 কাদের নেবেন (বাছাই ও নাম)", n: [descN, pick('[data-q="1"]'), pick("#shAdd"), pick("#shQ"), pick("#shFb"), pick("#shL"), pick("#shMv")] },
        { t: "⚙️ পেজ সেটিং (সংখ্যা, রং, ডিজাইন, ছবি)", n: [pick("#shPp"), pick("#shHint"), pick("#shTx")] },
        { t: "🔤 হেডার, শিরোনাম, স্লোগান", n: [pick("#shH"), pick("#shS"), pick("#shG"), pick("#shT"), pick("#shU"), pick("#shF")] }
      ];
      groups.forEach(function (g) {
        var ns = g.n.filter(function (n, i, a) { return n && n.parentNode === shb && a.indexOf(n) === i; });
        if (!ns.length) return;
        ns.sort(function (a, b) { return (a.compareDocumentPosition(b) & 4) ? -1 : 1; });
        var d = document.createElement("details"); d.className = "dlsec"; d.innerHTML = "<summary>" + g.t + "</summary>";
        ns[0].before(d);
        ns.forEach(function (n) { d.appendChild(n); });
      });
    }
    function dlSecs(ed) { // ✏️ এডিট-প্যানেল: ৫টা ভাঁজ করা মেনুতে সাজায় (⬇ ডাউনলোড-এডিট ও 📄 একসাথে এক পেজে দুটোতেই)
      var defs = [["n", "✏️ নাম ও মার্ক", /shEn"|shEp"|shEb"|shEs"|shEr"/], ["p", "🖼 ছবি", /shEh|shEi|rmimg/], ["x", "🪪 কার্ডের বাড়তি লেখা ও ক্যাপশন", /shEx|shEt|shEl|shEc|shEg|shEo|shEcp|capcopy|capnew|shEdr/], ["t", "✍️ কার্ডের সব লেখা / ঘর (এই ডিজাইনের)", /data-txg/], ["w", "🏆 পাবলিক বিজয়ী কার্ড", /shEdv|shEwv|wcpick|পাবলিক বিজয়ী/], ["s", "🌐 সাইটের নাম ও ঠিকানা", /shEsn|shEsa|sitesync|সাইটের নাম ও ঠিকানা/], ["r", "↺ আসলে ফিরুন / মূল ডাটা", /data-ed="reset"|data-ed="user"/]];
      var secs = {}; defs.forEach(function (d) { var det = document.createElement("details"); det.className = "dlsec"; det.innerHTML = "<summary>" + d[1] + "</summary>"; det.open = !!dlOpen[d[0]]; det.addEventListener("toggle", function () { dlOpen[d[0]] = det.open; }); secs[d[0]] = det; });
      var kids = Array.prototype.slice.call(ed.children);
      kids.forEach(function (k) { var h = k.outerHTML || "", hit = null; for (var j = 0; j < defs.length && !hit; j++) if (defs[j][2].test(h)) hit = defs[j]; if (hit) secs[hit[0]].appendChild(k); });
      defs.forEach(function (d) { if (secs[d[0]].childNodes.length > 1) ed.appendChild(secs[d[0]]); }); // খালি ভাঁজ (শুধু শিরোনাম) দেখানো হয় না
    }
    var EF = { shEdv: ["dv", "text"], shEx: ["pct", "num"], shEt: ["total", "num"], shEl: ["title", "text"], shEc: ["club", "text"], shEg: ["bestPlace", "text"], shEo: ["tot", "num"], shEn: ["name", "text"], shEp: ["dept", "text"], shEb: ["batch", "text"], shEs: ["score", "num"], shEr: ["rank", "num"], shEsn: ["psn", "text"], shEsa: ["psa", "text"], shEok: ["ok", "num"], shEdr: ["drank", "num"] };
    function edUI() {
      var n = rowsNow(), ed = q("#shEd"), p = foc >= 0 && foc < n.length ? n[foc] : null; if (!p) { ed.hidden = true; edK = ""; return; }
      var k = ck(p), kd = q("#shKd").value, dsg = kd === "card" ? (cfg.design || "card1") : ""; if (edK === k + kd + dsg && !ed.hidden) return; edK = k + kd + dsg; var e = eff(p), hasPh = kd === "tiles" || kd === "card" || kd === "poster" || kd === "social" || kd === "rank" || !!GRP[kd], o = po[k] || {};
      ed.hidden = false; ed.innerHTML = '<b class="sm w">✏️ ' + esc(p.name) + ' — ' + (DLM ? 'শুধু এই একজনের কার্ডের লেখা <span style="font-weight:400">(💾 সেভ চাপলে এই ফোনে থাকবে; আসল ডাটা/সার্ভারে যায় না)</span></b>' : 'এই কার্ডের লেখা বদলান <span style="font-weight:400">(শুধু ডাউনলোডের ছবিতে; আসল ডাটা/সার্ভারে যায় না — তবে এই ফোনে সেভ থাকে, পরেরবার ঢুকলেও আসবে)</span></b>') +
        '<label class="w">নাম<input id="shEn" maxlength="60"></label><label>বিভাগ<input id="shEp" maxlength="40"></label><label>সেশন<input id="shEb" maxlength="20"></label><label>মার্ক<input id="shEs" inputmode="numeric" maxlength="6"></label><label>র‍্যাংক<input id="shEr" inputmode="numeric" maxlength="4"></label>' +
        (kd === "card" ? '<label>শতকরা %<input id="shEx" inputmode="numeric" maxlength="3"></label><label>মোট প্রশ্ন<input id="shEt" inputmode="numeric" maxlength="4"></label><label>খেতাব / টাইটেল<input id="shEl" maxlength="40"></label><label>ক্লাব<input id="shEc" maxlength="40"></label><label class="w">সেরা জায়গা<input id="shEg" maxlength="60"></label><label>সঠিক উত্তর (সংখ্যা)<input id="shEok" inputmode="numeric" maxlength="4"></label><label>বিভাগে র‍্যাংক (সংখ্যা)<input id="shEdr" inputmode="numeric" maxlength="4"></label>' : "") +
        ((kd === "card" || kd === "poster") ? txBox(kd === "card" ? dsg : "poster", e) : "") +
        (kd === "poster" ? '<label>মোট (পোস্টারে "মোট")<input id="shEo" inputmode="numeric" maxlength="5"></label>' : "") +
        (hasPh ? '<label class="w">ছবি (শুধু এই কার্ডে)<select id="shEh"><option value="">' + (DLM ? "ডিফল্ট (অনুমতি অনুযায়ী)" : "ডিফল্ট (ওপরের সেটিং)") + '</option><option value="with">🖼 অনুমতিহীন ছবিও দেখাও (ছবি থাকলে ছবি; না থাকলে নামের প্রথম অক্ষর)</option><option value="none">🙈 ছবি ছাড়া</option></select></label><div class="shq w"><label class="l s" style="display:inline-block;cursor:pointer;margin:0">📷 নতুন ছবি বসান<input id="shEi" type="file" accept="image/*" hidden></label>' + (o.img ? '<img alt="" src="' + o.img + '" style="height:44px;border-radius:8px"><button type="button" class="l s" data-ed="rmimg">✕ নতুন ছবি সরান</button>' : "") + "</div>" : "") +
        (kd === "poster" ? '<b class="sm w">🏆 পাবলিক বিজয়ী কার্ড <span style="font-weight:400">(শুধু এই ফোনে)</span></b><label class="w">📱 ডিভাইস আইডি (যুক্ত করা)<input id="shEdv" maxlength="60"></label><label class="w">পাবলিকে যে কার্ড<select id="shEwv">' + wcvOpts(o.wcv) + '</select></label><div class="shq w"><button type="button" class="l s" data-ed="wcpick">🎴 বাছা কার্ড দেখুন</button></div>' : "") +
        (kd === "poster" ? '<label class="w">📋 ক্যাপশন (ফেসবুকে দেওয়ার জন্য — ইচ্ছেমতো বদলানো যায়)<textarea id="shEcp" rows="5"></textarea></label><div class="shq w"><button type="button" class="l s" data-ed="capcopy">📋 ক্যাপশন কপি</button><button type="button" class="l s" data-ed="capnew">↺ অটো ক্যাপশনে ফিরুন</button></div>' : "") +
        '<b class="sm w">🌐 সাইটের নাম ও ঠিকানা <span style="font-weight:400">(শুধু এই কার্ডে, শুধু এই ফোনে — ডাটাবেজে যায় না)</span></b><label>সাইটের নাম<input id="shEsn" maxlength="40"></label><label>সাইটের ঠিকানা<input id="shEsa" maxlength="80"></label><div class="shq w"><button type="button" class="l s" data-ed="sitesync">+ সিংক</button><span class="sm" id="shEsm">বর্তমান সাইট থেকে নাম ও ঠিকানা বসাতে চাপুন</span></div><div class="shq w"><button type="button" class="l s" data-ed="reset">↺ আসলে ফিরুন</button>' + (p.device ? '<button type="button" class="l s" data-ed="user">👤 মূল ডাটা খুলুন</button>' : "") + "</div>";
      dlSecs(ed); ed.querySelector("#shEn").value = e.name || ""; ed.querySelector("#shEp").value = deptL(e.dept) || ""; ed.querySelector("#shEb").value = e.batch || ""; ed.querySelector("#shEs").value = e.score == null ? "" : e.score; ed.querySelector("#shEr").value = e.rank == null ? "" : e.rank;
      [["shEok", "ok"], ["shEdr", "drank"], ["shEx", "pct"], ["shEt", "total"], ["shEl", "title"], ["shEc", "club"], ["shEg", "bestPlace"], ["shEo", "tot"], ["shEdv", "dv"], ["shEsn", "psn"], ["shEsa", "psa"]].forEach(function (z) { var i = ed.querySelector("#" + z[0]); if (i) i.value = e[z[1]] == null ? "" : e[z[1]]; });
      var sn0 = ed.querySelector("#shEsn"), sa0 = ed.querySelector("#shEsa"); if (sn0) sn0.placeholder = curSiteName(); if (sa0) sa0.placeholder = siteUrl() || "—"; // ফাঁকা = সাধারণ (এখনকার সাইট)
      var hs = ed.querySelector("#shEh"); if (hs) hs.value = o.ph || ""; var wv = ed.querySelector("#shEwv"); if (wv) wv.value = o.wcv || ""; var cpt = ed.querySelector("#shEcp"); if (cpt) cpt.value = capText(p);
    }
    // ✍️ কার্ডের সব লেখা/ঘর: ডিজাইন ধরে প্রতিটি হার্ড-কোড লেখা (কলেজের নাম, WINNER, "জানি", লেবেল, ট্যাগলাইন, তারিখ…) বদলানো যায়। ফাঁকা = ডিফল্ট। শুধু এই একজনের কার্ডে, এই ফোনে সেভ (po[..].tx → rec.tx → card.js-এর o.tx)।
    var TXC = { br: ["🔤 ওপরের ব্র্যান্ড-লেখা", "M.C COLLEGE EXPLORER"], cl: ["🏫 কলেজের নাম (ছোট ইংরেজি)", "MURARI CHAND COLLEGE, SYLHET"], col: ["🏫 কলেজের নাম (বাংলা)", "মুরারিচাঁদ কলেজ"], colEn: ["🏫 কলেজের নাম (ইংরেজি)", "Murari Chand College, Sylhet"], win: ["🏅 WINNER-প্লেটের ওপরের লেখা", "★  WINNER  ★"], ttl: ["🔠 কার্ডের শিরোনাম", "MC কতটুকু জানো?"], cname: ["🎖 ক্লাস ব্যাজের লেখা", "অটো (স্কোর অনুযায়ী)"], kn: ["💬 রিংয়ের ভেতরের \"জানি\" লেখা", "জানি"], tag: ["🏷 ট্যাগলাইন (রিং/পিলের লেখা)", "অটো (শতকরা অনুযায়ী)"], mk: ["🟡 মার্ক-পিলের লেখা (সংখ্যার পরে)", "মার্ক পেয়ে"], bestL: ["📍 সেরা-জায়গার লেবেল", "সেরা চেনা:"], upL: ["🔖 উপাধি-ট্যাগের লেখা", "উপাধি"], sesL: ["🗓 সেশন-চিপের শুরুর শব্দ", "সেশন "], l1: ["১ম বক্সের লেবেল", ""], l2: ["২য় বক্সের লেবেল", ""], l3: ["৩য় বক্সের লেবেল", ""], rkn: ["র‍্যাংকের পরের শব্দ", "নম্বর"], game: ["🎮 গেমের ধরন", "Guess the Place"], date: ["📅 তারিখ", "অটো (তৈরির তারিখ)"], scan: ["📲 \"স্ক্যান করে খেলো\" লাইন", "তুমি কত? স্ক্যান করে খেলো"], rkcap: ["🏅 র‍্যাংক-পদকের ছোট লেখা", "বিভাগে"], rkval: ["🏅 র‍্যাংক-পদকের বড় লেখা", "অটো (যেমন ১ম)"], rl: ["🏅 র‍্যাংক-ব্যাজের ছোট লেখা", "র‍্যাংক"], ml: ["📊 মার্ক-লাইনের শব্দ", "মার্ক"], tl: ["🅼 বাম লোগোর অক্ষর (লোগো না থাকলে)", "M"], tr: ["🅲 ডান লোগোর অক্ষর (লোগো না থাকলে)", "C"] };
    var TXD = {
      card1: [["br"], ["cl"], ["cname"], ["kn"], ["tag"], ["mk"], ["rkcap"], ["rkval"], ["game"], ["l2", "সঠিক"], ["l3", "র‍্যাঙ্ক"], ["scan"], ["date"], ["tl"], ["tr"]],
      card2: [["col"], ["colEn"], ["win"], ["cname"], ["ttl"], ["kn"], ["tag"], ["mk"], ["rkcap"], ["rkval"], ["bestL"], ["upL"], ["game"], ["l1", "গেম টাইপ"], ["l2", "সঠিক"], ["l3", "র‍্যাঙ্ক"], ["scan"], ["date"], ["tl"], ["tr"]],
      card3: [["br"], ["cl"], ["cname"], ["kn"], ["tag"], ["mk"], ["rkcap"], ["rkval"], ["game"], ["l2", "সঠিক"], ["l3", "র‍্যাঙ্ক"], ["scan"], ["date"], ["tl"], ["tr"]],
      poster: [["rl"], ["ml"]],
      story: [["col"], ["colEn"], ["win"], ["cname"], ["sesL"], ["kn", "MC জানি"], ["tag"], ["rkcap"], ["rkval"], ["l1", "মার্ক"], ["l2", "সঠিক উত্তর"], ["l3", "সবার মধ্যে"], ["rkn"], ["bestL", "📍 সেরা চেনা জায়গা:"], ["scan"], ["tl"], ["tr"]]
    };
    function txBox(ds, e) {
      var L = TXD[ds] || TXD.card1, t = e.tx || {}, h = '<div class="w" data-txg="1" style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))"><span class="sm" style="grid-column:1/-1">ফাঁকা রাখলে ডিফল্ট লেখা থাকবে। শুধু এই একজনের কার্ডে বদলাবে (এই ফোনে সেভ; ডাটাবেজে যায় না)। বামের ধূসর লেখাই ডিফল্ট।</span>';
      L.forEach(function (z) { var c = TXC[z[0]] || [z[0], ""], ph = z[1] != null ? z[1] : c[1]; h += '<label>' + esc(c[0]) + '<input data-tx="' + z[0] + '" maxlength="80" placeholder="' + esc(ph) + '" value="' + esc(t[z[0]] == null ? "" : t[z[0]]) + '"></label>'; });
      return h + "</div>";
    }
    function txSet(key, v) {
      var n = rowsNow(), p = foc >= 0 && foc < n.length ? n[foc] : null; if (!p) return; var k = ck(p), o = po[k] || (po[k] = {}), t = o.tx || (o.tx = {});
      v = String(v); if (v.trim() === "") delete t[key]; else t[key] = v; if (!Object.keys(t).length) delete o.tx; if (!Object.keys(o).length) delete po[k];
      var b = q('#shSel [data-ri="' + foc + '"]'); if (b) b.textContent = bdg(foc + 1) + ". " + eff(p).name + (po[k] ? " ✏️" : ""); persist(p); soon();
    }
    function curSiteName() { var D = window.MC || {}; return D.siteName || "MC Explorer"; }
    function edSet(id, v) {
      var n = rowsNow(), p = foc >= 0 && foc < n.length ? n[foc] : null; if (!p || !EF[id]) return; var k = ck(p), f = EF[id][0], o = po[k] || (po[k] = {});
      if (EF[id][1] === "num") { v = String(v).replace(/[^\d]/g, ""); if (v === "") delete o[f]; else o[f] = +v; } else { v = String(v); if (v.trim() === "") delete o[f]; else o[f] = v; }
      if (!Object.keys(o).length) delete po[k];
      var b = q('#shSel [data-ri="' + foc + '"]'); if (b) b.textContent = bdg(foc + 1) + ". " + eff(p).name + (po[k] ? " ✏️" : ""); persist(p); var cp0 = q("#shEcp"); if (cp0 && !cp0.dataset.u) cp0.value = capText(p); soon();
    }
    // ➕ নাম যোগ: কার্ডওয়ালাদের মধ্যে নাম লিখে/ফিল্টার দিয়ে (বিভাগ, সেশন, ক্লাব, ধরন, ছবি সহ/ছাড়া, বাছাই) খুঁজে তালিকায় আনা (ডাটাবেজ শুধু পড়া হয়)
    var addRes = [], addT = 0, addTs = 0;
    var AF = { src: "mc2_cards_adm", opt: false, fell: false };
    function adv(id) { var e = q("#" + id); return e ? e.value : ""; }
    function addQs(t, grp) { // ফিল্টারসহ কোয়েরি (ভিউ mc2_cards_adm থাকলে ক্লাব/ধরন/ছবি; না থাকলে শুধু বিভাগ/সেশন/ছবি — পুরোনো টেবিলে)
      var enc = encodeURIComponent, adm = AF.src === "mc2_cards_adm", p = "", v;
      t = String(t || "").trim().replace(/[*,()%]/g, ""); if (t) p += "&name=ilike." + enc("*" + t + "*");
      if ((v = (grp && grp.k === "dept" ? grp.v : adv("shAd")))) p += "&dept=eq." + enc(v);
      if ((v = (grp && grp.k === "batch" ? grp.v : adv("shAb")))) p += v === "__none" ? "&batch=is.null" : "&batch=eq." + enc(v);
      if (adm) {
        if ((v = adv("shAc"))) p += v === "__none" ? "&club=is.null" : "&club=eq." + enc(v);
        if ((v = adv("shAk"))) p += "&kind=eq." + enc(v);
        if ((v = adv("shAp2"))) p += "&has_photo=eq." + (v === "1" ? "true" : "false");
      } else if ((v = adv("shAp2"))) p += "&photo=" + (v === "1" ? "not.is.null" : "is.null");
      var ord = { hi: "score.desc,updated_at.desc,id.asc", lo: "score.asc,updated_at.desc,id.asc", new: "updated_at.desc,id.desc", name: "name.asc,id.asc" }[adv("shAs")] || "score.desc,updated_at.desc,id.asc";
      return AF.src + "?select=device,name,dept,batch,score" + (adm ? ",club,kind,has_photo" : "") + "&order=" + (grp ? "score.desc,updated_at.desc,id.asc" : ord) + "&limit=" + (grp ? grp.n : 24) + p;
    }
    function addOpts() { // বিভাগ/সেশন/ক্লাবের তালিকা একবার ডাটাবেজ থেকে (শুধু পড়া)
      if (AF.opt) return; AF.opt = true;
      var adm = AF.src === "mc2_cards_adm";
      M.A(AF.src + "?select=dept,batch" + (adm ? ",club" : "") + "&limit=20000").then(function (L) {
        var d = {}, b = {}, c = {}; ((window.MC && window.MC.depts) || []).forEach(function (x) { d[x] = 1; });
        (L || []).forEach(function (r) { if (r.dept) d[r.dept] = 1; if (r.batch) b[r.batch] = 1; if (r.club) c[r.club] = 1; });
        var fill = function (id, o, lab) { var e = q("#" + id); if (!e) return; Object.keys(o).sort().forEach(function (k) { e.insertAdjacentHTML("beforeend", '<option value="' + esc(k) + '">' + esc(lab ? lab(k) : k) + "</option>"); }); };
        fill("shAd", d, deptL); fill("shAb", b); fill("shAc", c);
      }).catch(function () { if (adm && !AF.fell) { AF.fell = true; AF.src = "mc2_cards"; AF.opt = false; addNoAdm(); addOpts(); } });
    }
    function addNoAdm() { Array.prototype.forEach.call(el.querySelectorAll("#shAf [data-adm]"), function (l) { l.hidden = true; var s = l.querySelector("select"); if (s) s.value = ""; }); var m = q("#shAm"); if (m) m.textContent = "ℹ️ ক্লাব/ধরন ফিল্টার চালু করতে supabase-new-20261103.sql চালাতে হবে (এখন বিভাগ, সেশন, ছবি, বাছাই চলছে)।"; }
    var KLB = { male: "ছাত্র", female: "ছাত্রী", sir: "স্যার", mam: "ম্যাম", visitor: "ভিজিটর" };
    function addSearch(t) {
      var r = q("#shAr"); topUI(); if (topN()) return addTop(t, r); r.innerHTML = '<span class="sm">⏳ খোঁজা হচ্ছে…</span>'; addOpts();
      var afb = adv("shAfb"); // অনুমতি ছাঁকা থাকলে বেশি সারি এনে এখানেই ছেঁকে ২৪টা দেখানো
      (afb && window.MCFB ? M.A(addQs(t).replace("&limit=24", "&limit=400")).then(function (a) { return window.MCFB.load().then(function () { return (a || []).filter(function (c) { return fbOk(c.device, afb); }).slice(0, 24); }); }) : M.A(addQs(t))).then(function (a) { addRes = (a || []).map(function (c) { return { key: (c.device || "") + "|" + c.name, name: c.name, device: c.device || "", dept: c.dept || "", batch: c.batch || "", score: c.score, rank: null, club: c.club || "", kind: c.kind || "", hp: c.has_photo }; }); r.innerHTML = addRes.length ? (addRes.length > 1 ? '<button type="button" class="l s" data-addall="1" style="margin:4px 0">➕ সবাইকে যোগ (' + bdg(addRes.length) + ' জন)</button>' : "") + addRes.map(function (c, i) { return '<label style="display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px dashed var(--bd)"><input type="checkbox" data-addc="' + i + '" style="width:22px;height:22px;flex:none;margin:0"><span><b>' + esc(c.name) + '</b>' + (window.MCFB ? window.MCFB.span(c.device) : "") + (c.hp ? " 📷" : "") + '<br><span class="sm">' + esc([KLB[c.kind], deptL(c.dept), c.batch, c.club].filter(Boolean).join(" · ") || "—") + (c.score != null ? " · " + bdg(c.score) + " মার্ক" : "") + "</span></span></label>"; }).join("") : '<span class="sm">কেউ পাওয়া যায়নি — ফিল্টার বদলে দেখুন</span>'; addMarks(); })
        .catch(function (e) { if (AF.src === "mc2_cards_adm" && !AF.fell) { AF.fell = true; AF.src = "mc2_cards"; AF.opt = false; addNoAdm(); return addSearch(t); } r.innerHTML = '<span class="sm">আনা যায়নি: ' + esc(e && e.message || e) + "</span>"; });
    }
    // 🏆 প্রতি গ্রুপে (বিভাগ/সেশন) মার্কে শীর্ষ N জন: গ্রুপ ধরে আলাদা কোয়েরি (সার্ভারের সারি-সীমায় আটকায় না); ডাটাবেজ শুধু পড়া হয়, গ্রুপের ভেতরে র‍্যাংক বসে
    function topN() { var v = adv("shAt"); if (!v) return 0; if (v === "c") return Math.min(50, Math.max(0, parseInt(adv("shAtn"), 10) || 0)); return +v || 0; }
    function topUI() { var l = q("#shAtl"); if (l) l.style.display = adv("shAt") === "c" ? "" : "none"; }
    function topGroups(g) {
      var one = adv(g === "dept" ? "shAd" : "shAb"); if (one === "__none") return []; if (one) return [one];
      var s0 = {}, sel = q(g === "dept" ? "#shAd" : "#shAb");
      if (g === "dept") ((window.MC && window.MC.depts) || []).forEach(function (x) { s0[x] = 1; }); else (X().sessions ? X().sessions() : []).forEach(function (x) { s0[x] = 1; });
      if (sel) Array.prototype.forEach.call(sel.options, function (o) { if (o.value && o.value !== "__none") s0[o.value] = 1; });
      return Object.keys(s0);
    }
    function addTop(t, r) {
      var N = topN(), g = adv("shAtg") === "batch" ? "batch" : "dept", gs = topGroups(g), my = ++addTs, gl = function (v) { return g === "dept" ? deptL(v) : "সেশন " + v; };
      if (!N) { r.innerHTML = '<span class="sm">কাস্টম সংখ্যা লিখুন (যেমন ৩)</span>'; return; }
      if (!gs.length) { r.innerHTML = '<span class="sm">কোনো ' + (g === "dept" ? "বিভাগ" : "সেশন") + " পাওয়া যায়নি — ফিল্টার বদলে দেখুন</span>"; return; }
      r.innerHTML = '<span class="sm">⏳ ' + bdg(gs.length) + "টা গ্রুপ থেকে শীর্ষ " + bdg(N) + " জন খোঁজা হচ্ছে…</span>"; addOpts();
      var afb = adv("shAfb"); // অনুমতি ছাঁকা "সব" থাকলে আগের মতোই; বাছা থাকলে প্রতি গ্রুপে অনুমতি মিলিয়ে তবেই শীর্ষ N
      Promise.all(gs.map(function (v) { return M.A(addQs(t, { k: g, v: v, n: afb ? 400 : N + 8 })).then(function (a) { return { v: v, a: a || [] }; }); })).then(function (all) { return afb && window.MCFB ? window.MCFB.load().then(function () { return all; }) : all; }).then(function (all) {
        if (my !== addTs) return; addRes = [];
        all.forEach(function (G) {
          var seen = {}, rows = [], rk = 0, prev = null;
          G.a.forEach(function (c) { var id = (c.device || "") + "|" + c.name; if (seen[id] || !fbOk(c.device, afb)) return; seen[id] = 1; rows.push(c); });
          rows.slice(0, N).forEach(function (c, i) { if (c.score !== prev) { rk = i + 1; prev = c.score; } addRes.push({ key: (c.device || "") + "|" + c.name, name: c.name, device: c.device || "", dept: c.dept || "", batch: c.batch || "", score: c.score, rank: rk, club: c.club || "", kind: c.kind || "", hp: c.has_photo, g: gl(G.v) }); });
        });
        var h = "", last = null;
        addRes.forEach(function (c, i) {
          if (c.g !== last) { last = c.g; h += '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:10px"><b>' + esc(c.g) + '</b><button type="button" class="l s" data-addg="' + esc(c.g) + '">➕ এই গ্রুপের সবাই</button></div>'; }
          h += '<label style="display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px dashed var(--bd)"><input type="checkbox" data-addc="' + i + '" style="width:22px;height:22px;flex:none;margin:0"><span><b>' + bdg(c.rank) + ".</b> <b>" + esc(c.name) + "</b>" + (window.MCFB ? window.MCFB.span(c.device) : "") + (c.hp ? " 📷" : "") + '<br><span class="sm">' + esc([KLB[c.kind], deptL(c.dept), c.batch, c.club].filter(Boolean).join(" · ") || "—") + (c.score != null ? " · " + bdg(c.score) + " মার্ক" : "") + "</span></span></label>";
        });
        r.innerHTML = addRes.length ? '<div class="sm">🏆 ' + bdg(gs.length) + "টা গ্রুপ → মোট " + bdg(addRes.length) + " জন (প্রতি গ্রুপে মার্কে সবচেয়ে এগিয়ে " + bdg(N) + " জন; মার্ক সমান হলে সর্বশেষ সেভ-করা আগে)" + (addRes.length > MAXN ? " · ℹ️ এক পেজে সর্বোচ্চ " + bdg(MAXN) + " জন বাছা যায়, বাকিরা তালিকায় থাকবে" : "") + "</div>" + (addRes.length > 1 ? '<button type="button" class="l s" data-addall="1" style="margin:4px 0">➕ সবাইকে যোগ (' + bdg(addRes.length) + " জন)</button>" : "") + h : '<span class="sm">কেউ পাওয়া যায়নি — ফিল্টার বদলে দেখুন</span>'; addMarks();
      }).catch(function (e) { if (AF.src === "mc2_cards_adm" && !AF.fell) { AF.fell = true; AF.src = "mc2_cards"; AF.opt = false; addNoAdm(); return addTop(t, r); } if (my === addTs) r.innerHTML = '<span class="sm">আনা যায়নি: ' + esc(e && e.message || e) + "</span>"; });
    }
    function addPerson(p) {
      var at = -1; people.forEach(function (x, i) { if (ck(x) === ck(p) || (x.device && x.device === p.device)) at = i; });
      if (at < 0) { people.push(p); at = people.length - 1; var sv = saved[pkOf(p)]; if (sv && typeof sv === "object") po[ck(p)] = Object.assign({}, sv); q("#shL").insertAdjacentHTML("beforeend", rowHtml(p, at)); }
      if (ord.indexOf(at) < 0 && ord.length < MAXN) ord.push(at); foc = ord.indexOf(at); edK = ""; sync(); soon();
    }
    function filt() { var t = q("#shQ").value.trim().toLowerCase(), f = (q("#shFb") || {}).value || ""; Array.prototype.forEach.call(el.querySelectorAll("#shL label"), function (l) { l.style.display = (!t || l.getAttribute("data-n").indexOf(t) >= 0) && fbOk(l.getAttribute("data-d"), f) ? "" : "none"; }); }
    el.addEventListener("change", function (e) { if (e.target && e.target.id === "shFb") { if (e.target.value && window.MCFB) window.MCFB.load().then(filt); else filt(); } });
    function cfgNow() { return { kind: q("#shKd").value, theme: +q("#shC").value || 0, cols: +q("#shK").value || 0, mode: q("#shMd").value, pp: Math.max(0, parseInt(q("#shPp").value, 10) || 0), head: q("#shH").checked, site: q("#shS").value.trim(), slogan: q("#shG").value, title: q("#shT").value.trim(), sub: q("#shU").value.trim(), foot: q("#shF").value.trim(), design: cfg.design, pd: cfg.pd || 0 }; }
    function kindUI() {
      var k = q("#shKd").value, d = q("#shD"), dw = q("#shDw"), pw = q("#shPw"), h = q("#shHint");
      dw.hidden = !(k === "card" || k === "poster"); pw.hidden = !(k === "tiles" || k === "card" || k === "poster" || k === "social" || k === "rank" || GRP[k]);
      if (k === "card") { if (!CPK.some(function (x) { return x[0] === cfg.design; })) cfg.design = CPK[0][0]; d.innerHTML = opts(CPK, cfg.design); }
      if (k === "poster") { d.innerHTML = opts(PTH, cfg.pd || 0); }
      h.textContent = k === "cert" ? "নিচের ঘরগুলো 📣 সোশ্যাল ট্যাবের সেটিং থেকে ভরা; এখানে বদলালে শুধু এই ছবিতে লাগবে।" : (k === "social" || k === "rank" || GRP[k]) ? "নিচের ঘরগুলো 📣 সোশ্যাল ট্যাবের সেটিং থেকে ভরা; এখানে বদলালে শুধু এই ছবিতে লাগবে (" + (GRP[k] ? "বাছা সবাই মিলে একটাই কার্ড; নামের ক্রম ⬆⬇ বাটনে বদলান" : "প্রতিজনের আলাদা কার্ড") + ")।" : k === "card" ? "প্রতিজনের সেভ করা কার্ড (র‍্যাংকসহ); কার্ড না থাকলে ঘরে \"কার্ড নেই\" আসবে।" : "";
      if (DLM) { h.textContent = "🎨 ডিজাইন / টেমপ্লেট / রং বদলালে ফোল্ডারের এই ধরনের সব ✅-কার্ডে লাগবে। ✏️ নাম-মার্ক-ছবি বদলালে শুধু ওই একজনের কার্ডে।"; q("#shPw").hidden = true; }
      h.hidden = !h.textContent; txUI(k); edK = "";
    }
    // সনদ / সোশ্যাল কার্ডের ডিজাইন ও লেখা এই জানালা থেকেই বদলানো (শুধু এই ছবির জন্য; 📣 সোশ্যাল ট্যাবের সেটিং বদলায় না)
    var XF = { xcs: ["cs", 1], xd: ["d", 1], xst: ["sty", 1], xti: ["title"], xpe: ["period"], xft: ["footer"], xbd: ["cbody"], xu1: ["sup1"], xs1: ["sig1"], xsg: ["sigName"], xs2: ["sig2"], xsn: ["sno"], xsl: ["scoreLbl"], xrl: ["rankLbl"], xsc: ["sc", 1], xld: ["lead"], xtl: ["top"], xdl: ["dlbl"], xnl: ["nlbl"], xsx: ["sesL"] };
    function ovKeep(key, val) { var k = q("#shKd").value; if (DL) { var t = tget(k); (t.ov || (t.ov = {}))[key] = val; tchg(k); return; } (svOv[k] || (svOv[k] = {}))[key] = val; jset(OV_KEY, svOv); }
    // 🪪 কার্ডের র‍্যাংক-লেখা · 🖼 পোস্টারের লিংক-পিলের রং · 📋 টাইলের রং (শুধু এই ছবির জন্য; এই ফোনে সেভ — ফোল্ডার-মোডে এই ধরনের সব ✅-কার্ডে লাগবে)
    var RKO = [["auto", "অটো"], ["d1", "বিভাগে ১ম"], ["a1", "সব বিভাগে ১ম"], ["c", "কাস্টম"]], PCO = [["", "🎨 পোস্টার-ট্যাবের সেভ-করা রং (সাধারণ)"], ["auto", "🎨 ডিজাইনের রঙ"], ["#ffb300", "⭐ সোনালি"], ["#1d6b43", "🟢 সবুজ"], ["#e11d48", "🔴 লাল"], ["#ffffff", "⚪ সাদা"], ["#10261b", "⚫ গাঢ়"]]; // PCO = admin-prize.js-এর "লিংক পিলের রঙ" তালিকা
    function ovPut(key, val) { var k = q("#shKd").value, em = val === "" || val == null; if (em) delete ov[key]; else ov[key] = val; if (DL) { var t = tget(k); t.ov = t.ov || {}; if (em) delete t.ov[key]; else t.ov[key] = val; tchg(k); return; } var o = svOv[k] || (svOv[k] = {}); if (em) delete o[key]; else o[key] = val; jset(OV_KEY, svOv); }
    // ভাগ ২-এর বাদ-পড়া ঘর (২০২৬-১২-২৩): 🖼 প্রাইজ পোস্টারের ঘর (শিরোনাম, ব্যাজ, বার্তা, স্লোগান, নিচের শেপ/ইউআরএল, জেন্ডার, QR, বাম-ডান লোগো) আর 🏆 পাবলিক বিজয়ী কার্ডের ঘর।
    // সবই শুধু এই ফোনে সেভ; সাইটের আসল সেটিং, ডাটাবেজ বা আসল 🔒 কড়া মোড (mc2_wc_strict) এখান থেকে কখনো লেখা হয় না। লেখার তালিকা আসল MCPoster থেকে আসে (কপি করা নয়)।
    var PZ_IDS = [["h", "🔠 শিরোনাম"], ["b", "🏷 ব্যাজ / টাইটেল"], ["m", "💬 বিজয়ী বার্তা (অভিনন্দন)"], ["t", "✨ স্লোগান (শিরোনামের নিচে)"], ["f", "🔻 নিচের শেপ ও ইউআরএল"]];
    function pzLst(id) { var P = window.MCPoster || {}, ex = jget("mc2_pz_txt"), g = P.GX && P.GX[id], out = [], add = function (a) { (a || []).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); }; add((P.TX && P.TX[id]) || ["MC Explorer", "MC Explorer Challenge"]); if (g) { add(g.m); add(g.f); } if (id === "m") add(P.PR); add(P.NEW && P.NEW[id]); add(Array.isArray(ex[id]) ? ex[id] : []); return out; }
    function pzSel(id, lb, cur) {
      var P = window.MCPoster || {}, L = pzLst(id), lab = function (t) { return String(t).replace("@url", P.urlTxt ? P.urlTxt() : ""); }, has = !!(P.GX && P.GX[id]), cust = cur != null && cur !== "" && cur !== "__blank" && cur !== "__a" && L.indexOf(cur) < 0;
      var o = function (v, t) { return '<option value="' + esc(v) + '"' + (String(cur == null ? "" : cur) === String(v) ? " selected" : "") + ">" + esc(t) + "</option>"; };
      return '<label class="w">' + lb + '<select id="shXz' + id + '">' + o("", "— পোস্টার-ট্যাবের সেভ-করা লেখা (সাধারণ)") + o("__blank", "⬜ খালি রাখুন (কিছু আসবে না)") + (has ? o("__a", "🎲 অটো (ছেলে/মেয়ে অনুযায়ী)") : "") + '<optgroup label="📚 তৈরি লেখা (' + bdg(L.length) + 'টি)">' + L.map(function (t) { return o(t, lab(t)); }).join("") + "</optgroup>" + '<option value="__c"' + (cust ? " selected" : "") + ">✏️ কাস্টম লিখুন…</option></select></label>" + '<label class="w" id="shXzw' + id + '" style="display:' + (cust ? "grid" : "none") + '"><input id="shXzi' + id + '" maxlength="120" placeholder="নিজের লেখা (ফাঁকা = সাধারণ লেখা)"></label>';
    }
    function pzLtr(t) { t = String(t || "").trim().slice(0, 3); if (!t) return null; var k = document.createElement("canvas"); k.width = k.height = 220; var g = k.getContext("2d"); g.fillStyle = "#10261b"; g.beginPath(); g.arc(110, 110, 104, 0, 6.2832); g.fill(); g.lineWidth = 8; g.strokeStyle = "#e0b84a"; g.stroke(); g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 " + (t.length > 2 ? 70 : t.length > 1 ? 88 : 112) + "px " + FAM; g.fillText(t, 110, 116); return k; }
    function pzLg(lg0) { // বাম/ডান লোগো বাছাই (null = আগের মতো, নম্বর = লোগো, 0 = অক্ষর)
      var o = ov.pzlg, M1 = window.mcLogo; if (!o || !M1 || !M1.img || (o.l == null && o.r == null)) return Promise.resolve(lg0);
      var side = function (v, tx, i) { if (v == null) return Promise.resolve(lg0[i]); if (v === 0) return Promise.resolve(pzLtr(tx) || lg0[i]); return Promise.resolve(M1.img(v, i)).then(function (x) { return x || lg0[i]; }, function () { return lg0[i]; }); }, go = function () { return Promise.all([side(o.l, o.tl, 0), side(o.r, o.tr, 1)]); };
      return M1.load ? Promise.resolve(M1.load()).then(go, go) : go();
    }
    function wcReal() { // সাইটের আসল বিজয়ী-কার্ড সেটিং শুধু পড়া (লেখা হয় না)
      var r = {}; try { r.k = localStorage.getItem("mc2_wc_strict") === "1"; } catch (e) {} var M2 = window.MCA; if (!M2 || !M2.A) return Promise.resolve(r);
      return M2.A("mc2_settings?select=value&key=eq.board_cfg").then(function (a) { var v = (a && a[0] && a[0].value) || {}; if (v.win_card_on != null) r.c = !!v.win_card_on; if (v.win_score_on != null) r.s = !!v.win_score_on; if (v.win_photo_on != null) r.p = !!v.win_photo_on; return r; }).catch(function () { return r; });
    }
    function wcvOpts(cur) { var C = (window.MCWC && window.MCWC.CVO) || { "": "ডিফল্ট" }; return Object.keys(C).map(function (k) { return '<option value="' + esc(k) + '"' + (String(cur || "") === k ? " selected" : "") + ">" + esc(C[k]) + "</option>"; }).join(""); }
    function txUI2(k) {
      var tx = q("#shTx"), so = DL ? (tget(k).ov || {}) : (svOv[k] || {}), h = "", sel = function (id, lb, arr, cur) { return '<label class="w">' + lb + '<select id="' + id + '">' + arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(cur == null ? "" : cur) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>"; };
      ov = Object.assign({}, so); tx.hidden = false;
      h = '<b class="sm w">' + (k === "card" ? "🪪 কার্ডের বাড়তি লেখা" : k === "poster" ? "🖼 পোস্টারের লিংক পিল" : "📋 টাইলের রং") + "</b>";
      if (k === "card") h += sel("shXrk", "🏅 র‍্যাংকের লেখা (কার্ডে)", RKO, so.rkm || "auto") + '<div id="shXrw" class="w" style="display:' + (so.rkm === "c" ? "grid" : "none") + ';grid-template-columns:1fr 1fr;gap:6px"><label>ছোট লেখা (যেমন: সব বিভাগে)<input id="shXrc" maxlength="20"></label><label>বড় লেখা (যেমন: ১ম)<input id="shXrv" maxlength="8"></label></div>';
      if (k === "poster") h += sel("shXpc", "🔗 লিংক পিলের রং", PCO, so.pc || "");
      if (k === "poster") {
        var P0 = window.MCPoster || {}, GL = [["", "— পোস্টার-ট্যাবের সেটিং (সাধারণ)"], ["a", "🤖 অটো (নাম দেখে আন্দাজ)"]].concat(Object.keys(P0.GN || {}).map(function (g) { return [g, (g === "m" ? "👦 " : g === "f" ? "👧 " : "⚪ ") + P0.GN[g]]; })), tri = [["", "— সাইটের আসল সেটিং"], ["1", "✅ চালু"], ["0", "🚫 বন্ধ"]];
        h += '<b class="sm w">🖼 পোস্টারের লেখা, জেন্ডার, QR ও লোগো <span style="font-weight:400">(প্রাইজ-পোস্টারের ঘরগুলো; শুধু এই ছবিতে)</span></b>';
        PZ_IDS.forEach(function (z) { h += pzSel(z[0], z[1], so["pz_" + z[0]]); });
        h += '<label class="w">ইউআরএল (শেপের নিচে, ঐচ্ছিক)<input id="shXzu" maxlength="80" placeholder="যেমন mc-explorer.pages.dev — ফাঁকা = সাধারণ"></label>' + sel("shXzg", "⚧ জেন্ডার (অটো লেখা বাছাইয়ের জন্য)", GL, so.pz_g || "") + sel("shXzq", "QR কোড দেখাও (সাইটের লিংক)", [["", "— পোস্টার-ট্যাবের সেটিং (সাধারণ)"], ["1", "✅ দেখাও"], ["0", "🚫 দেখাবে না"]], so.pz_qr || "") + '<div class="w"><div class="sm">🖼 বাম ও ডান লোগো</div><div id="shXzlg"></div></div>';
        h += '<b class="sm w">🏆 পাবলিক বিজয়ী কার্ডের ঘর <span style="font-weight:400">(শুধু এই ফোনে থাকে — সাইটের আসল সেটিং, ডাটাবেজ বা আসল 🔒 কড়া মোড এখান থেকে বদলায় না)</span></b>' + sel("shXwc", "🏆 বিজয়ী কার্ড চালু", tri, so.wc_c || "") + sel("shXws", "🪪 স্কোর কার্ড চালু (বিজয়ী তালিকায়)", tri, so.wc_s || "") + sel("shXwp", "📷 বিজয়ীর ছবি নিজে আনা", tri, so.wc_p || "") + sel("shXwk", "🔒 কড়া মোড — ডিভাইস দিয়ে আলাদা করা", tri, so.wc_k || "");
      }
      if (k === "tiles") h += sel("shXth", "🎨 টাইলের রং", [["", "— ওপরের রং (সাধারণ)"]].concat(TH.map(function (t, i) { return [i, bdg(i + 1) + ". " + t.n]; })), so.th);
      h += htHtml(so.ht) + '<div class="shq w"><button type="button" class="l s" data-ed="ovreset">↺ এই ঘরগুলো আগের মতো করুন</button><span class="sm">' + (DLM ? "💾 সেভ চাপলে ফোনে থাকবে — এই ধরনের সব ✅-কার্ডে লাগবে" : "এখানকার বদল এই ফোনে সেভ থাকে") + "</span></div>";
      tx.innerHTML = h; htFill(tx, so.ht); var rc = tx.querySelector("#shXrc"), rv = tx.querySelector("#shXrv"); if (rc) rc.value = so.rkc || ""; if (rv) rv.value = so.rkv || "";
      if (k === "poster") {
        PZ_IDS.forEach(function (z) { var zi = tx.querySelector("#shXzi" + z[0]), v = so["pz_" + z[0]]; if (zi && v && v !== "__blank" && v !== "__a" && pzLst(z[0]).indexOf(v) < 0) zi.value = v; });
        var zu = tx.querySelector("#shXzu"); if (zu) zu.value = so.pz_u || "";
        var plg = tx.querySelector("#shXzlg"), ML1 = window.mcLogo; if (plg && ML1 && ML1.picker && ML1.load) ML1.load().then(function () { if (plg.isConnected) plg.appendChild(ML1.picker({ admin: true, init: so.pzlg || null, onChange: function (o) { ov.pzlg = o; ovKeep("pzlg", o); soon(); } })); }).catch(function () {});
        wcReal().then(function (r) { [["shXwc", "c"], ["shXws", "s"], ["shXwp", "p"], ["shXwk", "k"]].forEach(function (z) { var e = tx.querySelector("#" + z[0]); if (e && e.options[0]) e.options[0].textContent = "— সাইটের আসল সেটিং (এখন: " + (r[z[1]] == null ? "জানা যায়নি" : r[z[1]] ? "চালু" : "বন্ধ") + ")"; }); });
      }
    }
    function cfgOv(c) { if (c.kind === "tiles" && ov.th != null && ov.th !== "") c.theme = +ov.th || 0; if (ov.ht != null && ov.ht !== "") c.ht = String(ov.ht); return c; }
    // #️⃣ নিচের হ্যাশট্যাগ লাইন (সব ধরনে: কার্ড/সনদ/পোস্টার/সোশ্যাল/টাইল…) — সেভ হয় শুধু এই ফোনে (mc2_sheet_ov; ⬇ ডাউনলোড-এডিটে mc2_dl_edit); ডাটাবেজে যায় না
    function htHtml(cur) { return '<label class="w">#️⃣ নিচের হ্যাশট্যাগ লাইন <span style="font-weight:400">(পেজের নিচে; ফাঁকা = #MCExplorer #MCExplorerChallenge)</span><input id="shXht" maxlength="80" placeholder="#MCExplorer #MCExplorerChallenge"></label><label class="w" style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" id="shXhn" style="width:auto"' + (cur === "__none" ? " checked" : "") + '> 🙈 হ্যাশট্যাগ লাইন দেখাব না</label>'; }
    function htFill(tx, cur) { var i = tx.querySelector("#shXht"); if (i) i.value = cur && cur !== "__none" ? cur : ""; }
    function htSync() { var n = q("#shXhn"), i = q("#shXht"); if (!n || !i) return; ovPut("ht", n.checked ? "__none" : i.value.trim()); }
    function capText(p) { // 📋 পোস্টারের ক্যাপশন (admin-prize.js-এর ক্যাপশনের মতো)
      var P = window.MCPoster; if (!P) return ""; var sv = {}; try { sv = JSON.parse(localStorage.getItem("mc2_pz_cfg") || "{}") || {}; } catch (e) {}
      var PS = Object.assign({}, P.DEF, sv), e0 = eff(p), pp = P.eff ? P.eff(Object.assign({}, e0)) : e0, g = P.gender ? P.gender(pp, PS) : "x", msg = P.pick ? P.pick("m", PS.m, pp, g) : "";
      return "🎉 অভিনন্দন " + pp.name + "!\n" + (msg ? msg + "\n" : "") + [P.dTxt ? P.dTxt(pp) : deptL(pp.dept), pp.batch].filter(Boolean).join(" · ") + (pp.rank ? " · র‍্যাংক #" + bdg(pp.rank) : "") + (pp.score != null && pp.score !== "" ? " · মার্ক " + bdg(pp.score) + "/" + bdg(pp.tot != null ? pp.tot : 1000) : "") + "\n\nতুমিও খেলো, দেখো তুমি কলেজ কতটুকু চেনো 👉 " + siteUrl() + "\n#MCExplorer #MCExplorerChallenge #পুরস্কার_বিজয়ী";
    }
    function capCopy(b) { var ta = q("#shEcp"); if (!ta) return; var ok = function () { b.textContent = "✅ কপি হয়েছে"; setTimeout(function () { b.textContent = "📋 ক্যাপশন কপি"; }, 1800); }, old = function () { ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} }; try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(ok, old); return; } } catch (e) {} old(); }
    function txUI(k) {
      if (k === "card" || k === "poster" || k === "tiles") return txUI2(k);
      var tx = q("#shTx"), SO = window.MCSOC; if (!(k === "cert" || k === "social" || k === "rank" || GRP[k]) || !SO || !SO.defaults) { tx.hidden = true; ov = {}; return; }
      var d = SO.defaults(k), SS = window.MCSocial, th = typeof SS.TH === "function" ? SS.TH() : [], inp = function (id, lb, mx, w) { return '<label' + (w ? ' class="w"' : "") + ">" + lb + '<input id="' + id + '" maxlength="' + mx + '"></label>'; };
      var so = DL ? (tget(k).ov || {}) : (svOv[k] || {}); d = Object.assign({}, d, so); ov = Object.assign({}, d); tx.hidden = false; // d = সোশ্যাল ট্যাবের সেটিং + এই ফোনে সেভ-করা বদল
      tx.innerHTML = k === "cert"
        ? '<label class="w">সনদের ডিজাইন<select id="xcs">' + opts((SS.CERTS || []).map(function (x, i) { return [i, (i + 1) + ". " + x.n]; }), d.cs) + "</select></label>" + inp("xti", "সনদের শিরোনাম", 50) + inp("xpe", "তারিখ / উপ-লাইন", 60) + '<label class="w">সনদের বার্তা ({score} = মার্ক)<textarea id="xbd" maxlength="300"></textarea></label>' + inp("xu1", "বাম: দাগের ওপরে", 30) + inp("xs1", "বাম: দাগের নিচে", 30) + inp("xsg", "ডান সই (ইংরেজি, হাতের সই)", 30) + inp("xs2", "ডান: দাগের নিচে", 30) + inp("xld", "সনদের শুরুর লাইন", 60, true) + inp("xtl", "ওপরের ছোট লাইন", 40, true) + inp("xdl", "“তারিখ:” শব্দ", 12) + inp("xnl", "“সনদ নং:” শব্দ", 12) + inp("xsx", "“সেশন” শব্দ", 12)
        : '<label>রঙের ডিজাইন<select id="xd">' + opts(th.map(function (t, i) { return [i, (i + 1) + ". " + t.n]; }), d.d) + '</select></label><label>স্টাইল<select id="xst">' + opts([[0, "ক্লাসিক"]].concat((SS.STY || []).map(function (x, i) { return [i + 1, (i + 1) + ". " + x.n]; })), d.sty) + "</select></label>" + inp("xti", "শিরোনাম", 60) + inp("xpe", "তারিখ / উপ-লাইন", 60) + inp("xft", "নিচের লাইন", 80, true);
      // ➕ ভাগ ১: সোশ্যাল ট্যাবের বাকি ঘর (শিরোনাম/সনদ-নাম বাছাই, সনদ নং, স্কোর/র‍্যাংক শব্দ, ডাউনলোডের মান, কী কী দেখাবে, লোগো) — সবই শুধু এই ছবির জন্য, সেভ হয় এই ফোনে
      var SOt = SO.TITLES || [], CPt = SO.CERT_PRE || [], XON = [["logos", "🏷 লোগো"], ["photo", "🖼 ছবি"], ["title", "🔤 শিরোনাম"], ["period", "📅 সময়কাল"], ["name", "👤 নাম"], ["dept", "🏫 বিভাগ"], ["batch", "🎓 সেশন"], ["score", "🔢 স্কোর"], ["rank", "🏅 র‍্যাংক"], ["more", "👥 পরের বিজয়ী"], ["footer", "🔗 নিচের লাইন"]];
      var xpick = function (id, lb, arr) { return arr.length ? '<label class="w">' + lb + '<select id="' + id + '"><option value="">— বাছুন —</option>' + arr.map(function (x, i) { return '<option value="' + i + '">' + bdg(i + 1) + ". " + esc(x) + "</option>"; }).join("") + "</select></label>" : ""; }, ex = "";
      if (k === "cert") ex += xpick("xcp", "🏷 সনদের নাম বাছুন (" + bdg(CPt.length) + "টি)", CPt.map(function (x) { return x[0]; })) + inp("xsn", "সনদ নং (ঐচ্ছিক)", 20) + inp("xsl", "সিলের “স্কোর” শব্দ", 12) + inp("xrl", "সিলের “র‍্যাংক” শব্দ", 12);
      else ex += xpick("xtp", "📝 শিরোনাম বাছুন (" + bdg(SOt.length) + "টি)", SOt) + inp("xsl", "“স্কোর” শব্দ", 12) + inp("xrl", "“র‍্যাংক” শব্দ", 12);
      ex += '<label class="w">ডাউনলোডের মান<select id="xsc">' + opts([[1, "সাধারণ"], [2, "হাই-রেজ (বেশি মেমরি লাগে)"]], d.sc || 1) + "</select></label>";
      if (k !== "cert") ex += '<div class="w"><div class="sm">👁 কী কী দেখাবে</div><div class="shq">' + XON.map(function (s) { return '<label style="display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border:1px solid var(--bd);border-radius:999px;cursor:pointer;font-weight:400"><input type="checkbox" data-xsw="' + s[0] + '" style="width:auto"' + (d.on && d.on[s[0]] ? " checked" : "") + ">" + s[1] + "</label>"; }).join("") + "</div></div>";
      ex += '<div class="w" id="xlg"></div>';
      tx.insertAdjacentHTML("beforeend", ex);
      var lgh = tx.querySelector("#xlg"), ML0 = window.mcLogo; if (lgh && ML0 && ML0.picker && ML0.load) ML0.load().then(function () { if (lgh.isConnected) lgh.appendChild(ML0.picker({ admin: true, init: d.lg || null, onChange: function (o) { ov.lg = o; ovKeep("lg", o); soon(); } })); }).catch(function () {});
      Object.keys(XF).forEach(function (id) { var e = tx.querySelector("#" + id), key = XF[id][0]; if (e && e.tagName !== "SELECT") e.value = d[key] == null ? "" : d[key]; });
      [["xld", "এই মর্মে প্রত্যয়ন করা হচ্ছে যে"], ["xtl", "MC Explorer Challenge"], ["xdl", "তারিখ:"], ["xnl", "সনদ নং:"], ["xsx", "সেশন"], ["xsl", "স্কোর"], ["xrl", "র‍্যাংক"]].forEach(function (z) { var e = tx.querySelector("#" + z[0]); if (e) e.placeholder = z[1] + " (ফাঁকা = ডিফল্ট)"; });
      tx.insertAdjacentHTML("beforeend", htHtml(so.ht)); htFill(tx, so.ht);
      tx.insertAdjacentHTML("beforeend", '<div class="shq w"><button type="button" class="l s" data-ed="ovreset">↺ 📣 সোশ্যাল ট্যাবের সেটিংয়ে ফিরুন</button><span class="sm">' + (DLM ? "💾 সেভ চাপলে ফোনে থাকবে — এই ধরনের সব ✅-কার্ডে লাগবে" : "এখানকার বদল এই ফোনে সেভ থাকে") + '</span></div>');
    }
    function fonts() { var a = []; try { if (window.MCCards && window.MCCards.fonts) a.push(window.MCCards.fonts()); if (document.fonts && document.fonts.load) ["800 40px \"Anek Bangla\"", "600 30px \"Anek Bangla\"", "700 30px \"Hind Siliguri\"", "600 30px \"Hind Siliguri\""].forEach(function (f) { a.push(document.fonts.load(f, "অআকখ১২৩")); }); } catch (e) {} return Promise.all(a).catch(function () {}); }
    function logos(type) {
      var L = (window.MC || {}).logos || {}, ML = window.mcLogo, FT = ML && ML.forType ? Promise.resolve(ML.forType(type || "s")).catch(function () { return null; }) : Promise.resolve(null);
      return Promise.all([0, 1].map(function (i) { return FT.then(function (p) { return p && p[i] ? p[i] : S.li(i ? L.nu : L.mc); }); })).catch(function () { return [null, null]; });
    }
    function useP(p) { var x = X(); return x.pmUse ? x.pmUse({ device: p.device || "" }) : Promise.resolve(true); }
    function fetchPhoto(p) {
      var k = p.device || p.name; if (PC[k]) return PC[k];
      var qy = p.device ? "device=eq." + encodeURIComponent(p.device) : "name=ilike." + encodeURIComponent("*" + String(p.name || "").replace(/[*,()%]/g, "") + "*");
      return PC[k] = M.A("mc2_cards?" + qy + "&select=photo&order=score.desc&limit=1").then(function (a) { return a && a[0] && JPG.test(a[0].photo || "") ? S.li(a[0].photo) : null; }).catch(function () { return null; });
    }
    function photoOf(p) { // প্রতিজনের বাছাই আগে (নতুন ছবি / ছবি সহ / ছবি ছাড়া), নইলে ওপরের সাধারণ সেটিং
      var o = po[ck(p)] || {}; if (o.img) return S.li(o.img); if (o.ph === "none") return Promise.resolve(null); if (o.ph === "with") return fetchPhoto(p);
      return useP(p).then(function (ok) { return ok ? fetchPhoto(p) : null; });
    }
    function seqMap(rows, f, note) { var out = []; return rows.reduce(function (pr, p, i) { return pr.then(function () { if (note) note(i + 1, rows.length); return f(p, i).then(function (v) { out.push(v); }); }); }, Promise.resolve()).then(function () { return out; }); }
    function build(cf, rows, my) {
      var note = function (a, b) { if (my === seq) q("#shNote").textContent = "⏳ " + bdg(a) + "/" + bdg(b) + " আঁকা হচ্ছে…"; }, memo = function (p, mk) { var k = ck(p) + osig(po[ck(p)] || 0); if (rows.length > 24) return mk(); return cache[k] ? Promise.resolve(cache[k]) : mk().then(function (c) { cache[k] = c; return c; }); };
      if (GRP[cf.kind]) { // একটাই কার্ড, বাছা সবাইকে নিয়ে (বাছা ক্রমে)
        var SG = window.MCSOC; if (!SG || !SG.makeGroup) return Promise.reject(new Error("সোশ্যাল সিস্টেম (admin-social.js) লোড হয়নি"));
        return Promise.all(rows.map(function (p) { return photoOf(p); })).then(function (ims) { return SG.makeGroup(cf.kind, rows.map(function (p, i) { var o = po[ck(p)]; return Object.assign({}, eff(p), { rank: o && o.rank != null ? o.rank : i + 1 }); }), ov, ims); }).then(function (cv) { return [cvCell(cv)]; });
      }
      if (cf.kind === "tiles") return seqMap(rows, function (p, i) { return photoOf(p).then(function (im) { return tileCell(eff(p), i, im); }); }, null);
      if (cf.kind === "card") {
        var x = X(); if (!x.drawFull || !x.rankInfo) return Promise.reject(new Error("কার্ড-সিস্টেম (admin-cards.js) লোড হয়নি"));
        return seqMap(rows, function (p) { return memo(p, function () {
          var qy = p.device ? "device=eq." + encodeURIComponent(p.device) : "name=ilike." + encodeURIComponent("*" + String(p.name || "").replace(/[*,()%]/g, "") + "*");
          return M.A("mc2_cards?" + qy + "&select=id,device,name,score,rec,photo&order=score.desc&limit=1").then(function (a) {
            var c = a && a[0]; if (!c) return missCell(eff(p).name, "কার্ড নেই"); var c0 = c, o = po[ck(p)];
            if (o) { c = Object.assign({}, c0); c.rec = Object.assign({}, c0.rec || {}); ["name", "dept", "batch"].forEach(function (f) { if (o[f] != null) { c[f] = o[f]; c.rec[f] = o[f]; } }); ["pct", "total", "title", "club", "bestPlace", "ok", "tx"].forEach(function (f) { if (o[f] != null) c.rec[f] = o[f]; }); if (o.score != null) { c.score = o.score; c.rec.score = o.score; } if (o.psa) c.rec.siteX = o.psa; if (o.img) c.photo = o.img; }
            return x.rankInfo(c0).then(function (inf) { return x.drawFull(c, cf.design, Object.assign(x.rkExtra ? x.rkExtra(inf, { mode: ov.rkm || "auto", cap: ov.rkc || "", val: ov.rkv || "" }) : {}, o && o.rank != null ? { rank: o.rank } : {}, o && o.drank != null ? { drank: o.drank } : {}), null, o && (o.img ? "with" : o.ph)); })
              .catch(function (e1) { // ভাগ ৫: র‍্যাংক/অনুমতি/ছবি-যাচাইয়ে কিছু আটকালে সরল আঁকায় ফিরে যাওয়া (কার্ডের ডিজাইন একই; শুধু ওই বাড়তি তথ্য ছাড়া)
                try { console.warn("drawFull failed, fallback", e1); } catch (z) {} var MCC = window.MCCards; if (!MCC || !MCC.render) throw e1;
                return MCC.render(Object.assign({}, c.rec, { name: (c.rec && c.rec.name) || c.name, score: c.rec && c.rec.score != null ? c.rec.score : c.score }), JPG.test(c.photo || "") && pm() !== "none" ? c.photo : null, cf.design);
              }).then(cvCell);
          }).catch(function (e) { try { console.error("card draw", e); } catch (z) {} return missCell(p.name, "আঁকা যায়নি" + (e && e.message ? ": " + String(e.message).slice(0, 48) : "")); });
        }); }, note);
      }
      if (cf.kind === "poster") {
        var P = window.MCPoster; if (!P || !P.draw) return Promise.reject(new Error("পোস্টার-সিস্টেম লোড হয়নি"));
        var sv = {}; try { sv = JSON.parse(localStorage.getItem("mc2_pz_cfg") || "{}") || {}; } catch (e) {}
        var PS = Object.assign({}, P.DEF, sv, { d: cf.pd || 0 }); delete PS.lgo; if (ov.pc) PS.pc = ov.pc;
        PZ_IDS.forEach(function (z) { var v = ov["pz_" + z[0]]; if (v === "__blank") PS[z[0]] = ""; else if (v != null && v !== "") PS[z[0]] = v; });
        if (ov.pz_u) PS.u = ov.pz_u; if (ov.pz_g) PS.g = ov.pz_g; if (ov.pz_qr === "1") PS.qr = true; else if (ov.pz_qr === "0") PS.qr = false;
        return logos("p").then(pzLg).then(function (lg) { return seqMap(rows, function (p) { return memo(p, function () { return photoOf(p).then(function (im) { var ep = eff(p), pp = P.eff ? P.eff(Object.assign({}, ep)) : ep, PSp = ep.psa || ep.psn || (ep.tx && (ep.tx.rl || ep.tx.ml)) ? Object.assign({}, PS, ep.tx && ep.tx.rl ? { rl: ep.tx.rl } : {}, ep.tx && ep.tx.ml ? { ml: ep.tx.ml } : {}, ep.psa ? { u: String(ep.psa).replace(/^https?:\/\//, "").replace(/\/$/, ""), qa: /^https?:/i.test(ep.psa) ? ep.psa : "https://" + ep.psa } : {}, ep.psn ? { h: ep.psn } : {}) : PS; return cvCell(P.draw(pp, im, PSp, lg, 1)); }); }); }, note); });
      }
      var SO = window.MCSOC; if (!SO || !SO.make) return Promise.reject(new Error("সোশ্যাল সিস্টেম (admin-social.js) লোড হয়নি"));
      return seqMap(rows, function (p) { return memo(p, function () { return (cf.kind === "cert" ? Promise.resolve(null) : photoOf(p)).then(function (im) { var ep = eff(p); return SO.make(cf.kind, ep, ep.psa ? Object.assign({}, ov, { footer: String(ep.psa).replace(/^https?:\/\//, "").replace(/\/$/, "") }) : ov, im); }).then(cvCell); }); }, note);
    }
    var PGO = ["shPp", "shK", "shC", "shH", "shS", "shG", "shT", "shU", "shF"]; // শুধু গ্রুপ-পেজে লাগে
    function modeUI() {
      var single = q("#shMd").value === "single";
      PGO.forEach(function (id) { var l = q("#" + id), lb = l && l.closest("label"); if (lb) lb.style.display = single ? "none" : ""; });
    }
    function cellCanvas(cell, th) { // একা মোডে প্রতিটি ঘরকে নিজের ছবি বানানো (কার্ড/পোস্টার/সনদ যেমন আছে তেমন, টাইল ব্যতিক্রম)
      if (cell.cv) return cell.cv; var W = 1080, iw = W - 56, ar = typeof cell.ar === "function" ? cell.ar(iw) : cell.ar, ih = Math.round(iw * ar), cv = document.createElement("canvas"); cv.width = W; cv.height = ih + 56;
      var c = cv.getContext("2d"), g = c.createLinearGradient(0, 0, W, cv.height); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, cv.height); c.textAlign = "center"; c.textBaseline = "middle"; cell.paint(c, 28, 28, iw, ih, th, 1); return cv;
    }
    // একা মোড বা পেজ-ভাগ: প্রতিটি আইটেমের নিজের ছবি + JPG/PNG; একাধিক হলে সব JPG-র একটা ZIP
    function renderList(items, cf, my) {
      var box = q("#shSg"), day = new Date().toISOString().slice(0, 10), jobs = [], zf = [], multi = items.length > 1;
      q("#shI").hidden = true; q("#shAj").style.display = q("#shAp").style.display = "none"; box.hidden = false;
      box.innerHTML = (multi ? '<div style="margin:0 0 10px"><a class="cxd off" id="sgz">⏳ সব একসাথে ZIP (JPG)</a></div>' : "") + items.map(function (it, i) { return '<div style="margin:0 0 12px"><b class="sm">' + esc(it.label) + '</b><img class="shp" ' + (it.pi != null ? 'data-si="' + it.pi + '" ' : "") + 'data-zoom alt="" style="display:block"><div class="shq"><a class="cxd off" id="sgj' + i + '" style="flex:1">⏳ JPG</a><a class="cxd off" id="sgp' + i + '" style="flex:1">⏳ PNG</a></div></div>'; }).join("");
      var imgs = box.querySelectorAll("img.shp");
      items.forEach(function (it, i) {
        var cv = it.cv, im = imgs[i]; im.src = cv.toDataURL("image/jpeg", .9); im.style.aspectRatio = cv.width + " / " + cv.height;
        var nm = "MC-Explorer-" + cf.kind + "-" + (i + 1) + "-" + String(it.nm || "").trim().replace(/[^\p{L}\p{M}\p{N}]+/gu, "_").slice(0, 24) + "-" + day;
        jobs.push(function (done) { cv.toBlob(function (b) { if (b && my === seq) { setA(q("#sgj" + i), b, nm + ".jpg", "JPG"); zf.push({ name: nm + ".jpg", blob: b }); } done(); }, "image/jpeg", .93); });
      });
      items.forEach(function (it, i) { var nm = "MC-Explorer-" + cf.kind + "-" + (i + 1) + "-" + day; jobs.push(function (done) { it.cv.toBlob(function (b) { if (b && my === seq) setA(q("#sgp" + i), b, nm + ".png", "PNG"); done(); }, "image/png"); }); });
      var nJpg = items.length, step = 0;
      (function next() {
        if (my !== seq || !jobs.length) return;
        var j = jobs.shift(); step++;
        j(function () {
          if (multi && step === nJpg && zf.length === nJpg) makeZip(zf).then(function (zb) { if (my === seq) setA(q("#sgz"), zb, "MC-Explorer-" + cf.kind + "-" + day + ".zip", "সব একসাথে ZIP (JPG)"); });
          setTimeout(next, 20);
        });
      })();
    }
    function renderPages(cells, lg, cf, rows, my, pp) {
      var chunks = [], i; for (i = 0; i < cells.length; i += pp) chunks.push(cells.slice(i, i + pp));
      var items = chunks.map(function (ch, k) { var a = k * pp + 1, b = Math.min(cells.length, (k + 1) * pp); return { cv: sheet(cf, ch, lg, 1), label: "পেজ " + bdg(k + 1) + " / " + bdg(chunks.length) + " — " + bdg(a) + " থেকে " + bdg(b) + " নম্বর", nm: "page" + (k + 1) }; });
      renderList(items, cf, my); return items.length;
    }
    function render() {
      qbRefresh(); var my = ++seq, rows = rowsNow(), note = q("#shNote"), im = q("#shI"), aj = q("#shAj"), ap = q("#shAp");
      [aj, ap].forEach(function (a) { a.classList.add("off"); a.removeAttribute("href"); }); aj.textContent = "⏳ JPG ডাউনলোড"; ap.textContent = "⏳ PNG ডাউনলোড";
      if (!rows.length) { im.hidden = true; q("#shSg").innerHTML = ""; q("#shAj").style.display = q("#shAp").style.display = ""; note.textContent = "কমপক্ষে ১ জন বাছুন।"; return; }
      var cf = cfgOv(cfgNow()), bs = JSON.stringify([cf.kind, cf.design, cf.pd, pm(), ov]), sig = bs + JSON.stringify(rows.map(function (r) { return r.key || r.name; })) + posig();
      if (bs !== csig) { cache = {}; csig = bs; }
      note.textContent = "⏳ আঁকা হচ্ছে…";
      var got = built && built.sig === sig && cf.kind !== "tiles" ? Promise.resolve(built.cells) : fonts().then(function () { return build(cf, rows, my); }).then(function (cells) { built = { sig: sig, cells: cells }; return cells; });
      Promise.all([got, logos("s")]).then(function (r) {
        if (my !== seq) return;
        var th0 = TH[cf.theme] || TH[0];
        if (cf.mode === "single") {
          var its = r[0].map(function (cell, i) { var one = r[0].length === rows.length; return { cv: cellCanvas(cell, th0), label: one ? bdg(i + 1) + ". " + eff(rows[i]).name : "গ্রুপ-কার্ড (" + bdg(rows.length) + " জন)", pi: one ? i : null, nm: one ? eff(rows[i]).name : "group" }; });
          renderList(its, cf, my); note.textContent = bdg(its.length) + (its.length === 1 ? "টা কার্ড" : "টা আলাদা কার্ড") + " (ফুল-সাইজ) · প্রতিটার নিজের ডাউনলোড"; return;
        }
        if (cf.pp > 0 && r[0].length > cf.pp) { var np = renderPages(r[0], r[1], cf, rows, my, cf.pp); note.textContent = bdg(rows.length) + " জন → " + bdg(np) + "টা পেজ (প্রতি পেজে " + bdg(cf.pp) + " জন) · প্রতিটার নিজের ডাউনলোড + সব একসাথে ZIP"; return; }
        q("#shSg").hidden = true; q("#shSg").innerHTML = ""; q("#shAj").style.display = q("#shAp").style.display = "";
        var cv = sheet(cf, r[0], r[1], 1); lay = { r: cv.__r, w: cv.__W, h: cv.height }; im.src = cv.toDataURL("image/jpeg", .88); im.hidden = false; im.style.aspectRatio = cv.width + " / " + cv.height;
        note.textContent = bdg(rows.length) + " জনের পেজ · " + bdg(cv.width) + "×" + bdg(cv.height);
        var nm = "MC-Explorer-" + cf.kind + "-" + rows.length + "-" + new Date().toISOString().slice(0, 10);
        cv.toBlob(function (b) { if (b && my === seq) setA(aj, b, nm + ".jpg", "JPG ডাউনলোড"); }, "image/jpeg", .93);
        setTimeout(function () { if (my !== seq) return; var cv2 = sheet(cf, r[0], r[1], cf.kind === "tiles" ? 2 : 1); cv2.toBlob(function (b) { if (b && my === seq) setA(ap, b, nm + ".png", "PNG ডাউনলোড"); }, "image/png"); }, 60);
      }).catch(function (e) { if (my === seq) note.textContent = "আঁকা যায়নি: " + (e && e.message ? e.message : e); });
    }
    function setA(a, blob, name, label) { if (!a) return; var u = URL.createObjectURL(blob); urls.push(u); a.href = u; a.download = name; a.classList.remove("off"); a.textContent = "⬇ " + label + " (" + bdg(Math.round(blob.size / 1024)) + " KB)"; }
    function soon() { clearTimeout(tm); tm = setTimeout(render, 300); }
    function save() { var c = cfgNow(); if (DL) { if (DLM) return; var g = lget(); c.design = g.design; c.pd = g.pd; } lset({ kind: c.kind, mode: c.mode, pp: c.pp, theme: c.theme, cols: c.cols, head: c.head, site: c.site, slogan: c.slogan, foot: (c.foot === siteUrl() || DOMLIKE.test(String(c.foot || "").trim())) ? "" : c.foot, fa: (c.foot === siteUrl() || DOMLIKE.test(String(c.foot || "").trim())) ? 1 : 0, design: c.design, pd: c.pd }); }
    if (DLM) dlInit(); else foldNormal();
    q("#shS").value = cfg.site; q("#shG").value = cfg.slogan; q("#shT").value = cfg.title; q("#shU").value = cfg.sub; q("#shF").value = cfg.foot; q("#shH").checked = cfg.head !== false;
    q("#shMd").value = cfg.mode === "single" ? "single" : "page"; q("#shPp").value = cfg.pp ? cfg.pp : ""; kindUI(); modeUI(); sync(); render();
    q("#shX").onclick = DLM ? tryClose : close; el.onclick = function (e) { if (e.target === el && !DLM) close(); };
    el.addEventListener("click", function (e) {
      var dd = e.target.closest("[data-dl]"); if (dd && DLM) { dlAct(dd); return; }
      var ei = e.target.closest("[data-ed]");
      if (ei && ei.dataset.ed === "ovreset") { if (DL) { var kk = q("#shKd").value, tt = tget(kk); delete tt.ov; tchg(kk); } else { delete svOv[q("#shKd").value]; jset(OV_KEY, svOv); } txUI(q("#shKd").value); soon(); return; }
      if (ei && ei.dataset.ed === "clearall" && DL) { if (!confirm("এই ফোল্ডারের সব ডাউনলোড-এডিট (প্রতিজনের বদল, ডিজাইন, লেখা) মুছে ফেলবেন?")) return; DLE.clear(DL.folder); saved = {}; po = {}; tdr = {}; tchB = {}; dirtyP = {}; dirtyT = false; edK = ""; txUI(q("#shKd").value); sync(); soon(); return; }
      if (ei && ei.dataset.ed === "clearall") { if (!confirm("এই ফোনে সেভ-করা সব এডিট (প্রতিজনের বদল, সনদ/সোশ্যালের লেখা) মুছে ফেলবেন?")) return; saved = {}; svOv = {}; po = {}; try { localStorage.removeItem(PO_KEY); localStorage.removeItem(OV_KEY); } catch (x) {} edK = ""; txUI(q("#shKd").value); sync(); soon(); return; }
      if (ei) { var pp = rowsNow()[foc]; if (!pp) return; if (ei.dataset.ed === "reset") { delete po[ck(pp)]; persist(pp); edK = ""; sync(); soon(); } else if (ei.dataset.ed === "sitesync") { var ok0 = po[ck(pp)] || (po[ck(pp)] = {}); ok0.psn = curSiteName(); ok0.psa = siteUrl(); persist(pp); edK = ""; sync(); soon(); var sm = q("#shEsm"); if (sm) sm.textContent = "✅ সিংক হয়েছে: " + ok0.psn + " · " + (ok0.psa || "—"); } else if (ei.dataset.ed === "rmimg") { var o2 = po[ck(pp)]; if (o2) { delete o2.img; if (!Object.keys(o2).length) delete po[ck(pp)]; persist(pp); } edK = ""; sync(); soon(); } else if (ei.dataset.ed === "capnew") { var c1 = q("#shEcp"); if (c1) { c1.value = capText(pp); delete c1.dataset.u; } } else if (ei.dataset.ed === "capcopy") capCopy(ei); else if (ei.dataset.ed === "wcpick") { if (window.MCWC && window.MCWC.open) window.MCWC.open({ name: pp.name, device: pp.device || "", dept: pp.dept || "", batch: pp.batch || "" }, function () {}); else alert("পাবলিক বিজয়ী কার্ডের সিস্টেম (admin-wcard.js) লোড হয়নি।"); } else if (ei.dataset.ed === "user" && window.MCA_USER && pp.device) window.MCA_USER(pp.device); return; }
      var si = e.target.closest("[data-si]") || (e.target.closest(".zmw") && e.target.closest(".zmw").querySelector("[data-si]"));
      if (si && !e.target.closest(".zmr")) { foc = +si.dataset.si; edK = ""; sync(); var ed1 = q("#shEd"); if (ed1 && ed1.scrollIntoView) ed1.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
      var pv = e.target.closest("#shI, .zmw"); // কার্ডে ট্যাপ → সেই কার্ডের এডিট-প্যানেল
      if (pv && !e.target.closest(".zmr") && lay && lay.r) {
        var im0 = q("#shI"), rc = im0.getBoundingClientRect(); if (rc.width) { var x = (e.clientX - rc.left) / rc.width * lay.w, y = (e.clientY - rc.top) / rc.height * lay.h, hit = -1; lay.r.forEach(function (c, i) { if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) hit = i; });
          if (hit >= 0) { foc = hit; edK = ""; sync(); var ed = q("#shEd"); if (ed && ed.scrollIntoView) ed.scrollIntoView({ block: "nearest", behavior: "smooth" }); } }
        return;
      }
      var rmx = e.target.closest("[data-rm]"); if (rmx) { ord.splice(+rmx.dataset.rm, 1); foc = -1; edK = ""; sync(); soon(); return; }
      var ad = e.target.closest("[data-add]");
      if (ad) { var pn = q("#shAdd"); pn.hidden = !pn.hidden; if (!pn.hidden) { q("#shAq").focus(); addSearch(""); } return; }
      var aal = e.target.closest("[data-addall]"); if (aal) { var all0 = addRes.slice(); fbGate(all0).then(function (r) { if (r) r.forEach(function (c) { addPerson(c); }); }); return; } // 🚦 সবাইকে যোগ: অনুমতি-নেই যাদের নিয়ে একটাই পপআপ
      var agp = e.target.closest("[data-addg]"); if (agp) { var gl0 = agp.dataset.addg, gp0 = addRes.filter(function (c) { return c.g === gl0; }); fbGate(gp0).then(function (r) { if (r) r.forEach(function (c) { addPerson(c); }); }); return; }
      var ap2 = e.target.closest("[data-addp]"); if (ap2) { var cand = addRes[+ap2.dataset.addp]; if (cand) { fbGate([cand]).then(function (r) { if (r && r.length) addPerson(cand); }); } return; }
      var rb = e.target.closest("[data-ri]"); if (rb) { foc = +rb.dataset.ri; edK = ""; sync(); return; }
      var mb = e.target.closest("[data-mv]");
      if (mb && foc >= 0 && foc < ord.length) { // কার্ড মুভ: প্রথমে / আগে / পরে / শেষে / বাদ
        var m = mb.dataset.mv, it = ord[foc], to = foc;
        if (m === "rm") { ord.splice(foc, 1); foc = Math.min(foc, ord.length - 1); }
        else { to = m === "top" ? 0 : m === "end" ? ord.length - 1 : m === "up" ? Math.max(0, foc - 1) : Math.min(ord.length - 1, foc + 1); ord.splice(foc, 1); ord.splice(to, 0, it); foc = to; }
        sync(); soon(); return;
      }
      var b = e.target.closest("[data-q]"); if (!b) return; var v = b.dataset.q;
      var craw = v === "c" ? parseInt(q("#shCn").value, 10) : 0; if (v === "c" && !(craw > 0)) { q("#shCn").focus(); return; } var cnum = v === "c" ? Math.min(MAXN, craw) : 0;
      foc = -1; if (v === "0") { ord = []; sync(); soon(); return; }
      var fbf = (q("#shFb") || {}).value || "", ix0 = people.map(function (p, i) { return i; }).filter(function (i) { return fbOk(people[i].device, fbf); }).slice(0, v === "a" ? MAXN : v === "c" ? cnum : +v); // 🚦 অনুমতি-নেই যারা: একটাই পপআপ, টিক-করাগুলোই যোগ হয়
      fbGate(ix0.map(function (i) { return people[i]; })).then(function (r) { if (!r) return; ord = r.map(function (p) { return people.indexOf(p); }); foc = -1; sync(); soon(); });
    });
    el.addEventListener("change", function (e) {
      var t = e.target;
      if (DLM && t.id === "dlNm") { dlGo(+t.value); return; }
      if (t.dataset && t.dataset.i != null) { var ix = +t.dataset.i, at = ord.indexOf(ix);
        if (t.checked && at < 0) { t.checked = false; fbGate([people[ix]]).then(function (r) { if (!r || !r.length) return; if (ord.indexOf(ix) < 0) ord.push(ix); t.checked = true; sync(); soon(); }); return; } // 🚦 অনুমতি না থাকলে পপআপ
        if (!t.checked && at >= 0) ord.splice(at, 1); sync(); soon(); return; }
      if (t.id === "shPin") { try { localStorage.setItem("mc2_sheet_pin", t.checked ? "1" : "0"); } catch (e) {} el.classList.toggle("shpin", t.checked || DLM); return; }
      if (t.id === "shP") { if (X().pmSet) X().pmSet(t.value); soon(); return; }
      if (/^shXz[hbmtf]$/.test(t.id)) { var zid = t.id.slice(4), zw = q("#shXzw" + zid), zi2 = q("#shXzi" + zid); if (t.value === "__c") { if (zw) zw.style.display = "grid"; if (zi2) zi2.focus(); return; } if (zw) zw.style.display = "none"; ovPut("pz_" + zid, t.value); soon(); return; }
      if (t.id === "shXhn") { htSync(); soon(); return; }
      if (t.dataset && t.dataset.addc != null) { var ac = addRes[+t.dataset.addc]; if (!ac) return; var ai = addIdx(ac), ao = ai >= 0 ? ord.indexOf(ai) : -1;
        if (t.checked) { if (ao >= 0) return; t.checked = false; fbGate([ac]).then(function (r) { if (r && r.length) addPerson(ac); addMarks(); }); } // 🚦 অনুমতি না থাকলে পপআপ
        else if (ao >= 0) { ord.splice(ao, 1); if (foc >= ord.length) foc = ord.length - 1; sync(); soon(); }
        return; }
      if (t.id === "shXzg") { ovPut("pz_g", t.value); soon(); return; }
      if (t.id === "shXzq") { ovPut("pz_qr", t.value); soon(); return; }
      if (/^shXw[cspk]$/.test(t.id)) { ovPut("wc_" + t.id.slice(4), t.value); return; } // 🏆 শুধু এই ফোনে; আসল সেটিং ছোঁয় না
      if (t.id === "shEwv") { var pw0 = rowsNow()[foc]; if (pw0) { var o5 = po[ck(pw0)] || (po[ck(pw0)] = {}); if (t.value) o5.wcv = t.value; else delete o5.wcv; if (!Object.keys(o5).length) delete po[ck(pw0)]; persist(pw0); sync(); } return; }
      if (t.id === "shC" && q("#shMd") && q("#shMd").value === "single" && q("#shKd") && q("#shKd").value === "tiles") { ovPut("th", +t.value || 0); var xth = q("#shXth"); if (xth) xth.value = String(+t.value || 0); }
      if (/^shX(rk|pc|th)$/.test(t.id)) { var vv = t.value; if (t.id === "shXrk") { var rw = q("#shXrw"); if (rw) rw.style.display = vv === "c" ? "grid" : "none"; ovPut("rkm", vv === "auto" ? "" : vv); } else if (t.id === "shXpc") ovPut("pc", vv); else ovPut("th", vv === "" ? "" : +vv); soon(); return; }
      if (t.id === "xcp" || t.id === "xtp") { var SO1 = window.MCSOC || {}, ix1 = t.value === "" ? -1 : +t.value, pr = t.id === "xcp" ? (SO1.CERT_PRE || [])[ix1] : null, ttl = t.id === "xcp" ? (pr ? pr[0] : null) : (SO1.TITLES || [])[ix1]; if (ix1 >= 0 && ttl != null) { var te = q("#xti"); if (te) te.value = ttl; ov.title = ttl; ovKeep("title", ttl); if (pr && pr[1] != null) { var be = q("#xbd"); if (be) be.value = pr[1]; ov.cbody = pr[1]; ovKeep("cbody", pr[1]); } soon(); } return; }
      if (t.dataset && t.dataset.xsw) { var on2 = Object.assign({}, ov.on || {}); on2[t.dataset.xsw] = t.checked ? 1 : 0; ov.on = on2; ovKeep("on", on2); soon(); return; }
      if (XF[t.id] && t.tagName === "SELECT") { ov[XF[t.id][0]] = +t.value; ovKeep(XF[t.id][0], +t.value); soon(); return; }
      if (t.id === "shEh") { var pp = rowsNow()[foc]; if (pp) { var o = po[ck(pp)] || (po[ck(pp)] = {}); if (t.value) o.ph = t.value; else delete o.ph; if (!Object.keys(o).length) delete po[ck(pp)]; persist(pp); sync(); soon(); } return; }
      if (t.id === "shEi") { // 📷 নতুন ছবি: ছোট করে (৯০০px) শুধু এই ডাউনলোডের জন্য
        var f = t.files && t.files[0], pf = rowsNow()[foc]; if (!f || !pf) return; var fr = new FileReader();
        fr.onload = function () { var im = new Image(); im.onload = function () { var sc = Math.min(1, 900 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc); cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); var k = ck(pf), o = po[k] || (po[k] = {}); o.img = cv.toDataURL("image/jpeg", .88); persist(pf); edK = ""; sync(); soon(); }; im.src = fr.result; };
        fr.readAsDataURL(f); return;
      }
      if (t.id === "shKd") { cfg.kind = t.value; if (DL) { var t1 = tget(t.value); if (t1.design) cfg.design = t1.design; if (t1.pd != null) cfg.pd = t1.pd; } kindUI(); sync(); }
      if (t.id === "shD") { if (q("#shKd").value === "poster") cfg.pd = +t.value || 0; else cfg.design = t.value; if (DL) { var kd2 = q("#shKd").value, t2 = tget(kd2); if (kd2 === "poster") t2.pd = cfg.pd; else t2.design = cfg.design; tchg(kd2); } edK = ""; edUI(); }
      if (t.id === "shMd") { cfg.mode = t.value; modeUI(); }
      if (/^sh(Kd|Md|K|C|H|D)$/.test(t.id)) save();
      soon();
    });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.id === "shCn") { e.preventDefault(); var b = q('[data-q="c"]'); if (b) b.click(); } });
    el.addEventListener("input", function (e) { var t = e.target; if (t.closest && t.closest("#shAf")) { clearTimeout(addT); addSearch(q("#shAq").value); return; } if (/^shXzi[hbmtf]$/.test(t.id)) { ovPut("pz_" + t.id.slice(5), t.value.trim()); soon(); return; } if (t.id === "shXzu") { ovPut("pz_u", t.value.trim()); soon(); return; } if (t.id === "shXht") { htSync(); soon(); return; } if (t.id === "shXrc" || t.id === "shXrv") { ovPut(t.id === "shXrc" ? "rkc" : "rkv", t.value.trim()); soon(); return; } if (t.id === "shEcp") { t.dataset.u = 1; return; } if (t.id === "shAq") { clearTimeout(addT); addT = setTimeout(function () { addSearch(t.value); }, 320); return; } if (t.id === "shPp") { save(); soon(); return; } if (t.dataset && t.dataset.tx && t.closest("#shEd")) { txSet(t.dataset.tx, t.value); return; } if (EF[t.id] && t.closest("#shEd")) { edSet(t.id, t.value); return; } if (XF[t.id] && t.tagName !== "SELECT") { ov[XF[t.id][0]] = t.value; ovKeep(XF[t.id][0], t.value); soon(); return; } if (t.id === "shQ") { filt(); return; } if (/^sh[SGF]$/.test(t.id)) save(); if (/^sh[STUGF]$/.test(t.id)) soon(); });
  }
  window.MCSheet = { open: open, TH: TH };
})();

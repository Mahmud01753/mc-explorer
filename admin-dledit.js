// ⬇ ডাউনলোডের "✏️ এডিট" — শুধু ফোনে (ব্রাউজারের localStorage, চাবি mc2_dl_edit) সেভ থাকে। সার্ভার/ডাটাবেজে কিছু যায় না, SQL লাগে না।
// গঠন: { f: { <ফোল্ডার-আইডি>: { p: { <ব্যক্তির চাবি>: {name,dept,batch,score,rank,pct,total,title,club,bestPlace,tot,ph,img} },
//                              t: { <ধরন-আইডি>: { design, pd, ov:{…}, who:[ব্যক্তির চাবি…] } } } } }
//  • p  = প্রতিজনের আলাদা বদল (লেখা, মার্ক, ছবি) — শুধু ওই একজনের কার্ডে লাগে।
//  • t  = ডিজাইন / টেমপ্লেট / রং (কার্ড ১-২-৩, পোস্টার-থিম, সনদ/সোশ্যালের রং-লেখা) — ফোল্ডারের ওই ধরনের সব ✅-কার্ডে (who = সেভের সময়কার ✅ তালিকা)।
// এটা শুধু ⬇ ডাউনলোড ট্যাবের ফোল্ডার-ডাউনলোডে পড়া হয় (admin-dlhub.js → admin-sheet.js, admin-export.js)। অন্য ট্যাবের mc2_sheet_po / mc2_sheet_ov / mc2_sheet_cfg-কে ছোঁয় না।
(function () {
  var K = "mc2_dl_edit";
  function rd() { try { var v = JSON.parse(localStorage.getItem(K) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function wr(o) { try { localStorage.setItem(K, JSON.stringify(o)); return true; } catch (e) { return false; } }
  function fo(a, id, mk) { if (!a.f || typeof a.f !== "object") a.f = {}; var k = String(id); if (!a.f[k] && mk) a.f[k] = {}; return a.f[k]; }
  var clone = function (x) { return JSON.parse(JSON.stringify(x == null ? {} : x)); };
  var has = function (o) { return o && typeof o === "object" && Object.keys(o).length > 0; };
  // sheet.js-এর pkOf-এর হুবহু একই নিয়ম
  var pk = function (p) { return p.device ? "d:" + p.device : "n:" + String(p.name || "").trim().toLowerCase(); };
  window.MCDLE = {
    pk: pk,
    // ফোল্ডারের সব সেভ-করা বদল (কপি; বদলালে স্টোরে যায় না, put* দিয়ে লিখতে হয়)
    folder: function (id) { var f = fo(rd(), id) || {}; return { p: clone(f.p), t: clone(f.t) }; },
    // pairs = [[ব্যক্তির চাবি, বদল-অবজেক্ট বা null (মুছতে)]]; সফল হলে true (ফোনে জায়গা ফুরালে false)
    putP: function (id, pairs) {
      var a = rd(), f = fo(a, id, 1); f.p = f.p && typeof f.p === "object" ? f.p : {};
      pairs.forEach(function (x) { if (has(x[1])) f.p[x[0]] = x[1]; else delete f.p[x[0]]; });
      if (!has(f.p)) delete f.p; if (!has(f)) delete a.f[String(id)];
      return wr(a);
    },
    // ডিজাইন/রং/লেখা: b = ধরন-চাবি; t = { design, pd, ov } (খালি হলে মুছে যায়); who = এখন যারা ✅ (আগেরগুলোর সাথে যুক্ত হয়)
    putT: function (id, b, t, who) {
      var a = rd(), f = fo(a, id, 1); f.t = f.t && typeof f.t === "object" ? f.t : {};
      var old = f.t[b] || {}, w = {}; (old.who || []).concat(who || []).forEach(function (x) { w[x] = 1; });
      var n = {}; if (t && t.design != null && t.design !== "") n.design = t.design; if (t && t.pd != null) n.pd = t.pd; if (t && has(t.ov)) n.ov = t.ov;
      if (has(n)) { n.who = Object.keys(w); f.t[b] = n; } else delete f.t[b];
      if (!has(f.t)) delete f.t; if (!has(f)) delete a.f[String(id)];
      return wr(a);
    },
    clear: function (id) { var a = rd(); if (a.f) delete a.f[String(id)]; return wr(a); },
    // সেভ-করা বদল একটা কার্ড-রেকর্ডে বসানো (admin-sheet.js-এর কার্ড-আঁকার একই নিয়ম)
    applyCard: function (c0, o) {
      var c = Object.assign({}, c0); c.rec = Object.assign({}, c0.rec || {});
      ["name", "dept", "batch"].forEach(function (f) { if (o[f] != null) { c[f] = o[f]; c.rec[f] = o[f]; } });
      ["pct", "total", "title", "club", "bestPlace", "ok", "tx"].forEach(function (f) { if (o[f] != null) c.rec[f] = o[f]; }); if (o.psa) c.rec.siteX = o.psa;
      if (o.score != null) { c.score = o.score; c.rec.score = o.score; }
      if (o.img) c.photo = o.img;
      return c;
    },
    // ফোল্ডার-ডাউনলোডে এই ব্যক্তির কার্ডে কোন ডিজাইন লাগবে ("" = সেভ-করা নেই / এ ব্যক্তি ✅ ছিল না)
    // র‍্যাংক/বিভাগ-র‍্যাংক হাতে বসানো থাকলে অটো-র‍্যাংকের ওপর বসে (ZIP/JPG ডাউনলোডেও)
    rankEx: function (ex, o) { ex = ex || {}; if (o && o.rank != null) ex.rank = o.rank; if (o && o.drank != null) ex.drank = o.drank; return ex; },
    designFor: function (dl, ctId, p) { var t = dl && dl.t && dl.t[ctId]; return t && t.design && (t.who || []).indexOf(pk(p)) >= 0 ? t.design : ""; }
  };
})();

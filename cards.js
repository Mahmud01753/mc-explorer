// MC Explorer — কার্ড সংরক্ষণ + লিডারবোর্ডের "সেরা ৩" (ছবি ও কার্ড প্রিভিউ)। (Supabase লাগে; supabase-cards.sql একবার চালাতে হয়)
// এই ফাইল না থাকলে সাইট চলে (শুধু এই ফিচার আসে না)। অ্যাডমিন পেজও কার্ড আঁকার জন্য এটা ব্যবহার করে (window.MCCards)।
//  ১) ইউজার কার্ড দেখলে ছোট প্রিভিউ (~৪০ KB) + ছোট ছবি + কার্ডের তথ্য চুপচাপ সার্ভারে জমা হয় (mcCardSync)।
//  ২) লিডারবোর্ডে ওপরে সেরা ৩ জনের ছবি ও কার্ড প্রিভিউ; প্রিভিউতে ক্লিক করলে পুরো কার্ড (mcTop3)।
//  ৩) অ্যাডমিন সেই তথ্য থেকে ১০৮০×১৪০০ কার্ড ও ১০৮০×১৯২০ স্টোরি আবার আঁকে (optsFromRec) — তাই ডাউনলোড ফুল কোয়ালিটি।
(function () {
  var C = window.MC_CFG || {}, ON = !!(C.url && C.key), D = window.MC || {}, base = ON ? String(C.url).replace(/\/$/, "") : "";
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var bn = function (n) { return String(n).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var JPG = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
  function vid() { return window.mcVid ? window.mcVid() : (LS.get("mc2_vid", "") || ""); }
  function rpc(n, a) { return fetch(base + "/rest/v1/rpc/" + n, { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, body: JSON.stringify(a) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  var li0 = function (s) { return new Promise(function (r) { if (!s) return r(null); var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = s; }); };
  // ২০২৬-১০-২০ (কাজ ১৪): লোগোর মতো ফাইল-লিংক একবারই লোড হয়ে মেমোরিতে থাকে। ছবি (data:) আগের মতো প্রতিবার; লোড না হলে ক্যাশে থাকে না, পরেরবার আবার চেষ্টা হয়।
  var LIC = {};
  var li = function (s) { if (!s || /^data:/.test(s)) return li0(s); return LIC[s] || (LIC[s] = li0(s).then(function (i) { if (!i) delete LIC[s]; return i; })); };
  // মাপার জন্য (ডিফল্টে বন্ধ): ঠিকানায় ?perf যোগ করলে বা localStorage-এ mc2_perf=1 দিলে কনসোলে সময় দেখায়
  var PERF = false; try { PERF = /[?&]perf\b/.test(location.search) || localStorage.getItem("mc2_perf") === "1"; } catch (e) {}
  // ফন্ট-লোডের প্রমিস একবারই বানিয়ে রাখা হয়। সব ফন্ট সত্যিই পাওয়া গেলে তবেই ক্যাশে থাকে (ফন্ট CSS তখনো না এলে পরেরবার আবার চেষ্টা হয়)।
  var FP = null;
  function fonts() {
    if (FP) return FP;
    try {
      var T = "০১২৩৪৫৬৭৮৯ মুরারিচাঁদ কলেজ";
      FP = Promise.all([800, 700, 500].map(function (w) { return document.fonts.load(w + ' 40px "Anek Bangla"', T); }).concat([800, 700, 600, 500].map(function (w) { return document.fonts.load(w + ' 30px "Hind Siliguri"', T); })))
        .then(function (r) { if (!(r && r.length && r.every(function (a) { return a && a.length; }))) FP = null; }).catch(function () { FP = null; });
      return FP;
    } catch (e) { return Promise.resolve(); }
  }
  var tierOf = function (s) { return s >= 920 ? 5 : Math.min(4, Math.floor(s / 200)); };
  var siteUrl = function () { return C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : /^https?:/.test(location.origin) ? location.origin + "/" : location.href.split("#")[0].split("?")[0]; };

  var QRC = {}; function qrOf(u) { if (!window.makeQR) return null; return QRC[u] || (QRC[u] = window.makeQR(u)); }
  // পেজ খুলে অলস সময়ে ফন্ট ও দুটি লোগো আগে থেকে লোড (পরে কার্ড আঁকতে দেরি কম)
  (function () { var go = function () { try { fonts(); li(D.logos && D.logos.mc); li(D.logos && D.logos.nu); } catch (e) {} }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500); })();
  // ---------- সংরক্ষিত তথ্য থেকে কার্ডের অপশন (card.js-এর drawCard2/drawStory-র জন্য) ----------
  function optsFromRec(r, photo) {
    r = r || {}; var t = tierOf(r.score || 0), site = r.siteX ? (/^https?:/i.test(String(r.siteX)) ? String(r.siteX) : "https://" + r.siteX) : siteUrl(); /* 🌐 শুধু অ্যাডমিন-এডিটে "+ সিংক" দিলে (r.siteX, এই ফোনে); নইলে সবসময় এখনকার ডোমেইন — জমা-করা r.site (পুরোনো/ফাঁকা) জমা-করা r.site (পুরোনো/ফাঁকা/"null") বাদ — দেখানোর সময় সবসময় এখনকার ডোমেইন; ডাটাবেজে কিছু লেখা হয় না */
    var LP = window.mcLogo ? window.mcLogo.forRec(r.lg, r.lgo).then(function (g) { return g && g.lm && g.ln ? g : null; }, function () { return null; }) : Promise.resolve(null); // জমা কার্ডের লোগো: অ্যাডমিনের "পুরোনো কার্ড নামবে" বাছাই অনুযায়ী
    return LP.then(function (g) { return g ? [g.lm, g.ln, g] : Promise.all([li(D.logos && D.logos.mc), li(D.logos && D.logos.nu)]).then(function (L0) { return [L0[0], L0[1], null]; }); }).then(function (L) {
      return { tier: t, score: r.score, club: r.club || "", pct: r.pct, photo: photo || null, name: r.name, dept: r.dept, batch: r.batch, deptLabel: D.deptLabel ? D.deptLabel(r.dept) : r.dept, drank: r.drank || 1,
        best: r.bestPlace || "—", date: new Date(r.ts || Date.now()).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }), title: r.title || "", ok: r.ok, total: r.total, rank: r.rank || 1,
        game: "Guess the Place", lm: L[0], ln: L[1], lgm: L[2] ? L[2].lgm : undefined, lgs: L[2] ? L[2].lgs : undefined, tl: L[2] ? L[2].tl : undefined, tr: L[2] ? L[2].tr : undefined, col: D.classCols[t], metal: D.classMetal[t], cname: D.classes[t], qr: qrOf(site), site: site.replace(/^https?:\/\//, "").replace(/\/$/, "") };
    });
  }
  // ✍️ rec.tx = { কী: লেখা } → card.js-এর o.tx (হার্ড-কোড লেখা) + কয়েকটা সরাসরি ঘর (তারিখ, গেম, ক্লাস-ব্যাজ, লোগোর অক্ষর, র‍্যাংক-পদকের লেখা)
  function applyTx(o, r) {
    var t = r && r.tx; if (!t || typeof t !== "object") return o; o.tx = t;
    if (t.date) o.date = String(t.date); if (t.game) o.game = String(t.game); if (t.cname) o.cname = String(t.cname);
    if (t.tl) o.tl = String(t.tl); if (t.tr) o.tr = String(t.tr);
    if (t.rkcap || t.rkval) { var rl = o.rankLabel || {}; o.rankLabel = { cap: t.rkcap || rl.cap || "", val: t.rkval || rl.val || "" }; }
    return o;
  }
  // kind: "card" (ডিফল্ট ডিজাইন, ১০৮০×১৪০০), "card1"/"card2"/"card3" (নির্দিষ্ট ডিজাইন) বা "story" (১০৮০×১৯২০)
  // ছোট ক্যাশ (সর্বোচ্চ ৬টি আঁকা ক্যানভাস): একই rec + ছবি + মাপের কার্ড আবার চাইলে আর আঁকা হয় না। ক্যানভাস শুধু পড়ার জন্য (toDataURL/toBlob/drawImage)।
  var RC = [], RMAX = 6;
  function hsh(t) { t = String(t || ""); var h = t.length; for (var i = 0; i < t.length; i += 53) h = (h * 31 + t.charCodeAt(i)) | 0; return h; }
  function rkey(rec, photoSrc, kind, dims) { var d = {}; try { Object.assign(d, window.mcCardDims ? window.mcCardDims() : {}, dims || {}); } catch (e) {} return kind + "|" + (window.mcLogo && window.mcLogo.sig ? window.mcLogo.sig() : "") + "|" + (window.mcCardDefault ? window.mcCardDefault() : 0) + "|" + JSON.stringify(rec || {}) + "|" + hsh(photoSrc) + "|" + JSON.stringify(d); }
  function render(rec, photoSrc, kind, dims) {
    var key = rkey(rec, photoSrc, kind, dims); for (var i = 0; i < RC.length; i++) if (RC[i].k === key) { var hit = RC.splice(i, 1)[0]; RC.unshift(hit); if (PERF) console.log("[perf] card cache hit", kind); return Promise.resolve(hit.c); }
    var t0 = PERF ? performance.now() : 0;
    return Promise.all([fonts(), li(photoSrc && JPG.test(photoSrc) ? photoSrc : null)]).then(function (a) { return optsFromRec(rec, a[1]); }).then(function (o) {
      Object.assign(o, window.mcCardDims ? window.mcCardDims() : {}); if (dims) Object.assign(o, dims);
      applyTx(o, rec); // ✍️ অ্যাডমিন-এডিটে প্রতিজনের কার্ডের লেখা-বদল (rec.tx) — না থাকলে কিছুই বদলায় না
      var c = kind === "story" ? window.drawStory(o) : (window[["drawCard1", "drawCard2", "drawCard3"][/^card[123]$/.test(kind) ? +kind.charAt(4) - 1 : (window.mcCardDefault ? window.mcCardDefault() : 0)]] || window.drawCard1 || window.drawCard2)(o); RC.unshift({ k: key, c: c }); if (RC.length > RMAX) RC.length = RMAX;
      if (PERF) console.log("[perf] card render " + kind + " " + Math.round(performance.now() - t0) + "ms"); return c;
    });
  }
  var fname = function (r, story) { var nm = String(r.name || "MC").trim().replace(/[\\/:*?"<>|.]+/g, "").replace(/\s+/g, "_") || "MC", sh = (D.deptShort ? D.deptShort(r.dept) : "") || "MC"; return nm + "_" + sh + "_" + Math.round(r.score != null ? r.score : (r.pct || 0) * 10) + (story ? "_story" : "") + ".png"; };
  window.MCCards = { optsFromRec: optsFromRec, render: render, fname: fname, fonts: fonts, JPG: JPG };

  // ---------- ১) কার্ড জমা (ছোট প্রিভিউ + ছবি + তথ্য) ----------
  // ২০২৬-১০-১৯: থাম্ব ৪২০→২৪০ px, কোয়ালিটি ০.৭৪→০.৬২ (জায়গা বাঁচাতে)। থাম্ব শুধু অ্যাডমিন তালিকার ছোট ছবি; ডাউনলোড/বড় প্রিভিউ/টপ৩ rec+photo থেকে ফুল সাইজে আঁকে, তাই সেখানে মান কমে না। photoOf (৪৮০ px) অপরিবর্তিত।
  function thumbOf(c) {
    var w = 240, h = Math.round(c.height * w / c.width), cv = document.createElement("canvas"); cv.width = w; cv.height = h; var g = cv.getContext("2d");
    g.fillStyle = "#f4f7f2"; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, w, h);
    var q = 0.62, d = cv.toDataURL("image/jpeg", q); while (d.length > 60000 && q > 0.4) { q -= 0.08; d = cv.toDataURL("image/jpeg", q); } return d;
  }
  var POC = typeof WeakMap === "function" ? new WeakMap() : null;
  function photoOf(im) {
    if (!im) return ""; if (POC && POC.has(im)) return POC.get(im); var r = photoOf0(im); if (POC) POC.set(im, r); return r;
  }
  function photoOf0(im) {
    var n = Math.min(im.naturalWidth, im.naturalHeight), sz = Math.min(480, n), cv = document.createElement("canvas"); cv.width = cv.height = sz;
    cv.getContext("2d").drawImage(im, (im.naturalWidth - n) / 2, (im.naturalHeight - n) / 2, n, n, 0, 0, sz, sz);
    var q = 0.82, d = cv.toDataURL("image/jpeg", q); while (d.length > 200000 && q > 0.4) { q -= 0.1; d = cv.toDataURL("image/jpeg", q); } return d;
  }
  // আগের কার্ডের জন্য ছোট ছবি (৩২০ px; ~৪৫ KB-এর বেশি হলে রাখা হয় না — তখন প্রিভিউতে ছবি ছাড়া কার্ড আঁকা হয়)
  function photoSm(im) {
    if (!im) return ""; var n = Math.min(im.naturalWidth, im.naturalHeight); if (!n) return ""; var sz = Math.min(320, n), cv = document.createElement("canvas"); cv.width = cv.height = sz;
    cv.getContext("2d").drawImage(im, (im.naturalWidth - n) / 2, (im.naturalHeight - n) / 2, n, n, 0, 0, sz, sz);
    var q = 0.8, d = cv.toDataURL("image/jpeg", q); while (d.length > 45000 && q > 0.4) { q -= 0.1; d = cv.toDataURL("image/jpeg", q); } return d.length > 45000 ? "" : d;
  }
  // ---------- ইউজারের নিজের ফোনে আগের কার্ড (সার্ভারে কোনো অনুরোধ নেই) ----------
  // ---------- হাই-কোয়ালিটি কার্ড: শুধু ইউজারের নিজের ফোনের IndexedDB-তে (সার্ভারে কিছু যায় না)। না চললে (প্রাইভেট মোড/ইন-অ্যাপ ব্রাউজার) নিচের rec থেকে আবার আঁকার পুরোনো পথই চলে ----------
  function idb() { return new Promise(function (res, rej) { try { var q = indexedDB.open("mc2_cards", 1); q.onupgradeneeded = function () { q.result.createObjectStore("c"); }; q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; } catch (e) { rej(e); } }); }
  function idbDo(mode, fn) { return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction("c", mode), r = fn(tx.objectStore("c")); tx.oncomplete = function () { db.close(); res(r && r.result); }; tx.onerror = tx.onabort = function () { db.close(); rej(tx.error); }; }); }); }
  // IndexedDB না চললে (প্রাইভেট মোড, ইন-অ্যাপ ব্রাউজার, জায়গা ভরা) বিকল্প: localStorage-এ পুরো সাইজের JPG (সর্বোচ্চ ৩টি কার্ড, ~৭০০ KB-এর মধ্যে)
  var HQ = "mc2_minehq";
  function hqList() { var a = LS.get(HQ, []); return Array.isArray(a) ? a : []; }
  function hqPut(a) { for (;;) { try { localStorage.setItem(HQ, JSON.stringify(a)); return; } catch (e) { if (a.length <= 1) { try { localStorage.removeItem(HQ); } catch (e2) {} return; } a.pop(); } } }
  function hqSave(key, c, score, ts) {
    try { var q = 0.92, d = c.toDataURL("image/jpeg", q); while (d.length > 700000 && q > 0.62) { q -= 0.1; d = c.toDataURL("image/jpeg", q); } if (d.length > 900000) return;
      var a = hqList().filter(function (x) { return x.k !== key; }); a.unshift({ k: key, score: score, ts: ts, d: d }); hqPut(a.slice(0, 3)); } catch (e) {}
  }
  function hqDrop(key) { try { var a = hqList(), b = a.filter(function (x) { return x.k !== key; }); if (b.length !== a.length) hqPut(b); } catch (e) {} }
  function idbSave(key, c, score, ts) {
    var fb = function () { hqSave(key, c, score, ts); };
    try { c.toBlob(function (b) { if (!b) return fb(); idbDo("readwrite", function (st) { return st.put({ blob: b, score: score, ts: ts }, key); }).then(function () { hqDrop(key); }).catch(fb); }, "image/png"); } catch (e) { fb(); }
  }
  function idbClean(names) { idbDo("readonly", function (st) { return st.getAllKeys(); }).then(function (ks) { var del = (ks || []).filter(function (k) { return names.indexOf(k) < 0; }); if (del.length) return idbDo("readwrite", function (st) { del.forEach(function (k) { st.delete(k); }); }); }).catch(function () {}); }
  var MK = "mc2_mine", mp = 0, cur = "", curTs = 0;
  // নিয়ম: যেকোনো নামের কার্ড আলাদা আলাদা থাকে (চাবি নাম+সময়); ২০টা ছাড়ালে সবচেয়ে কম স্কোরেরটা (সমান হলে পুরোনোটা) কাটে; ইউজার তালিকা থেকে নিজে মুছতেও পারে
  var MAXC = 20;
  function ek(x) { return String(x.name).toLowerCase() + "|" + (x.ts || 0); }
  function mineList() { var a = LS.get(MK, []); return Array.isArray(a) ? a.filter(function (x) { return x && x.name && JPG.test(String(x.th || "")); }) : []; }
  // জায়গা কম পড়লে ২০টা কার্ড ধরে রাখতে মান কমানোর ক্রম (তালিকা কমে সবার শেষে): ১) সবচেয়ে পুরোনো বাড়তি HQ JPG কপি সরে → ২) পুরোনো কার্ড থেকে ফটো সরে (কার্ড ছবি ছাড়া আঁকা হবে) → ৩) একেবারে শেষে সবচেয়ে পুরোনো কার্ড বাদ
  function minePut(a) {
    for (;;) {
      try { localStorage.setItem(MK, JSON.stringify(a)); return; } catch (e) {
        var h = hqList(); if (h.length) { h.pop(); try { if (h.length) localStorage.setItem(HQ, JSON.stringify(h)); else localStorage.removeItem(HQ); } catch (e2) { try { localStorage.removeItem(HQ); } catch (e3) {} } continue; }
        var k = -1; for (var i = a.length - 1; i >= 0; i--) if (a[i].ph) { k = i; break; }
        if (k >= 0) { delete a[k].ph; continue; }
        if (a.length <= 1) return; a.pop();
      }
    }
  }
  function mineVis() { return mineList().filter(function (x) { return !(String(x.name).toLowerCase() === cur && (!curTs || +x.ts === curTs)); }); }
  function mineView() {
    var cim = document.getElementById("cimg"), box = document.getElementById("mcold");
    var a = mineVis();
    if (!cim || !a.length) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement("div"); box.id = "mcold"; (document.getElementById("lgpk") || document.getElementById("cnav") || cim).insertAdjacentElement("afterend", box); } // ক্রম (১২৩ নেক্সট) আগে, তার নিচে "আগের কার্ড"
    var np = Math.ceil(a.length / 3); if (mp >= np) mp = np - 1; if (mp < 0) mp = 0;
    // সব কার্ড (সর্বোচ্চ ২০) একটাই সারিতে; আঙুল টেনে ডানে-বামে প্রথম থেকে শেষ পর্যন্ত দেখা যায় (কার্ড বদলায় না, শুধু সারি সরে)। নিচের ১ ২ ৩ বাটনে চাপলেও সেই পাতায় সরে যায়
    var h = '<div style="margin:10px 0 4px;font-weight:700;font-size:14px">আগের কার্ড</div><div class="mcstrip" id="mcstrip">';
    a.forEach(function (x, j) { h += '<button type="button" data-mi="' + j + '" aria-label="' + esc(x.name) + ' — কার্ড দেখুন"><img src="' + x.th + '" alt="" draggable="false"><div class="mn">' + esc(x.name) + '</div><div class="ms">' + bn(x.score) + '</div></button>'; });
    h += '</div>';
    if (np > 1) {
      var bs = "min-width:34px;padding:6px 8px;border-radius:8px;border:1px solid #9aa;background:transparent;color:inherit;font:inherit";
      h += '<div id="mcpg" style="display:flex;gap:6px;justify-content:center;align-items:center;margin:8px 0 0;flex-wrap:wrap">';
      for (var p = 0; p < np; p++) h += '<button type="button" data-mp="' + p + '" data-bs="' + bs + '" style="' + bs + (p === mp ? ";background:#1d6b43;color:#fff;border-color:#1d6b43" : "") + '">' + bn(p + 1) + '</button>';
      h += '<button type="button" data-mpn="1" style="' + bs + '">নেক্সট ›</button>';
      h += '</div>';
    }
    box.innerHTML = h;
    var st = box.querySelector("#mcstrip");
    // নতুন করে আঁকার পরও আগের জায়গাতেই থাকে
    var pw = function () { return st.clientWidth + 6; };
    if (mp > 0) st.scrollLeft = mp * pw();
    var tick = 0;
    st.addEventListener("scroll", function () {
      if (tick) return; tick = requestAnimationFrame(function () {
        tick = 0; var w = pw(), q = Math.round(st.scrollLeft / w);
        if (st.scrollLeft >= st.scrollWidth - st.clientWidth - 2) q = np - 1;
        if (q < 0) q = 0; if (q > np - 1) q = np - 1;
        if (q === mp) return; mp = q;
        box.querySelectorAll("[data-mp]").forEach(function (bt) { var on = +bt.getAttribute("data-mp") === mp; bt.style.cssText = bt.getAttribute("data-bs") + (on ? ";background:#1d6b43;color:#fff;border-color:#1d6b43" : ""); });
      });
    }, { passive: true });
  }
  var MS = "";
  function mineSave(R, c, photo, o) {
    if (!R || !c || !R.name) return;
    // একই কার্ড (একই তথ্য ও ছবি) আবার আঁকা হলে থাম্ব/ছবি/PNG আবার এনকোড ও সংরক্ষণ করা হয় না
    var sig = [R.name, R.score, R.ts, R.club, R.title, R.pct, R.bestPlace, photo && photo.src ? photo.src.length : 0, o && o.drank, o && o.rank].join("|");
    if (sig === MS && mineList().length) { cur = String(R.name).toLowerCase(); curTs = +R.ts || 0; mineView(); if (PERF) console.log("[perf] mineSave skipped (same card)"); return; }
    MS = sig; var tm = PERF ? performance.now() : 0;
    var a = mineList(), nm = String(R.name).toLowerCase(), i = 0, tsN = R.ts || Date.now(); cur = nm; curTs = tsN;
    for (; i < a.length; i++) if (String(a[i].name).toLowerCase() === nm && +a[i].ts === +tsN) break;
    // ডিফল্ট ডিজাইন বদলালে (যেমন অ্যাডমিন একটা কার্ড অফ করলে) আগে সেভ হওয়া একই কার্ডের কপি নতুন ডিজাইনে বদলে যায় না — আগের ডিজাইনের কার্ডটা থেকেই যায়
    var dz = window.mcCardDefault ? window.mcCardDefault() : null;
    if (i < a.length && a[i].d != null && dz != null && a[i].d !== dz) { mineView(); return; }
    if (i < a.length) a.splice(i, 1);
    var e = { name: R.name, score: R.score, ts: tsN, d: dz, th: thumbOf(c), rec: { name: R.name, dept: R.dept, batch: R.batch || "", club: R.club || "", pct: R.pct, score: R.score, ok: R.ok, total: R.total, title: R.title || "", bestPlace: R.bestPlace || "—", kind: R.kind || "", ts: tsN, drank: (o && o.drank) || 1, rank: (o && o.rank) || 1, site: siteUrl(), lg: (o && Array.isArray(o.lg)) ? o.lg : undefined } };
    try { var ps = photoSm(photo); if (ps) e.ph = ps; } catch (er) {}
    a.unshift(e);
    // একই নামের (একই ব্যক্তির) কার্ড সর্বোচ্চ ৩টা রাখে: ৩টার বেশি হলে সবচেয়ে কম স্কোরেরটা (সমান হলে পুরোনোটা) আগে কাটে
    for (;;) { var gi = [], lw = -1; for (var z = 0; z < a.length; z++) if (String(a[z].name).toLowerCase() === nm) gi.push(z); if (gi.length <= 3) break;
      for (var y = 0; y < gi.length; y++) { var zq = gi[y]; if (lw < 0 || (+a[zq].score || 0) < (+a[lw].score || 0) || ((+a[zq].score || 0) === (+a[lw].score || 0) && (+a[zq].ts || 0) <= (+a[lw].ts || 0))) lw = zq; } a.splice(lw, 1); }
    while (a.length > MAXC) { var lo = 0; for (var q = 1; q < a.length; q++) { var sq = +a[q].score || 0, sl = +a[lo].score || 0; if (sq < sl || (sq === sl && (+a[q].ts || 0) <= (+a[lo].ts || 0))) lo = q; } a.splice(lo, 1); }
    minePut(a); mineView();
    var kept = a.some(function (x) { return ek(x) === ek(e); }); if (kept) idbSave(ek(e), c, R.score, e.ts); var nms = []; a.forEach(function (x) { nms.push(ek(x)); nms.push(String(x.name).toLowerCase()); }); idbClean(nms);
    try { var h0 = hqList(), h1 = h0.filter(function (x) { return nms.indexOf(x.k) >= 0; }); if (h1.length !== h0.length) hqPut(h1); } catch (er) {}
    if (PERF) console.log("[perf] mineSave " + Math.round(performance.now() - tm) + "ms");
  }
  // প্রিভিউয়ের "ডিলেট" বাটন: শুধু এই ফোন থেকে কার্ডটা মোছে (সাইট/সার্ভারে কিছু বদলায় না)
  function mineDel(k) {
    var a = mineList().filter(function (x) { return ek(x) !== k; }); minePut(a);
    try { idbDo("readwrite", function (st) { st.delete(k); }).catch(function () {}); hqDrop(k); } catch (er) {}
    mineView();
  }
  function addDel(el, k) {
    var d = el.querySelector("#t3d"); if (!d || !k) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "btn l s"; b.id = "t3del"; b.textContent = "🗑 ডিলেট";
    b.style.cssText = "margin-top:10px;width:100%;color:#c0392b;font-weight:700";
    d.insertAdjacentElement("afterend", b);
    // ডিলেটে চাপলে আগে সতর্কবার্তা; "হ্যাঁ, ডিলেট" চাপলে তবেই মোছে
    b.onclick = function () {
      var w = document.createElement("div"); w.className = "rmodal"; w.setAttribute("role", "alertdialog"); w.setAttribute("aria-modal", "true"); w.style.zIndex = "99999";
      w.innerHTML = '<div class="rbox" style="text-align:center"><div style="font-size:42px;line-height:1">⚠️</div><h2 style="margin:8px 0 6px">সতর্কতা!</h2>' +
        '<p style="margin:0 0 6px;line-height:1.55">এই কার্ডটি ডিলেট করলে <b>এই ফোন থেকে মুছে যাবে</b> এবং <b>আর ফিরে পাওয়া যাবে না</b>।</p>' +
        '<p style="margin:0 0 12px;opacity:.8;font-size:13px">সাইটের লিডারবোর্ডে আপনার স্কোর আগের মতোই থাকবে।</p>' +
        '<button class="btn o s" type="button" id="t3wn" style="width:100%">না, কার্ডটা রাখি</button>' +
        '<button class="btn l s" type="button" id="t3wy" style="margin-top:10px;width:100%;color:#c0392b;font-weight:700">🗑 হ্যাঁ, ডিলেট করো</button></div>';
      document.body.appendChild(w);
      var no = function () { w.remove(); };
      w.querySelector("#t3wn").onclick = no;
      w.onclick = function (e) { if (e.target === w) no(); };
      w.querySelector("#t3wy").onclick = function () { w.remove(); mineDel(k); var x = el.querySelector("#t3x"); if (x) x.click(); else el.remove(); };
    };
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#mcold [data-mp], #mcold [data-mpn]"); if (!b) return;
    var st = document.getElementById("mcstrip"); if (!st) return;
    var np = Math.ceil(mineVis().length / 3), q = b.hasAttribute("data-mpn") ? Math.min(np - 1, mp + 1) : (+b.getAttribute("data-mp") || 0);
    st.scrollTo({ left: q * (st.clientWidth + 6), behavior: "smooth" });
  });
  // আগের কার্ডে ক্লিক: rec থাকলে হাই-কোয়ালিটি আবার এঁকে প্রিভিউ + ডাউনলোড; পুরোনো এন্ট্রিতে (শুধু থাম্ব) ছোট ছবিই
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#mcold [data-mi]"); if (!b) return; var x = mineVis()[+b.getAttribute("data-mi")]; if (!x) return;
    var title = x.name + " — " + bn(x.score) + " মার্ক";
    if (!x.rec) { openThumb(x, title); return; }
    var lc = window.mcLogo && window.mcLogo.cfgNow ? window.mcLogo.cfgNow() : null; if (lc && lc.ud && lc.ud.h) { openFull(x.rec, x.ph && JPG.test(x.ph) ? x.ph : null, title, ek(x), "h"); return; }
    var ph = x.ph && JPG.test(x.ph) ? x.ph : null, lim = (+(window.MC_QUIZ && window.MC_QUIZ.png_kb) || 0) * 1024, fb = function () { openFull(x.rec, ph, title, ek(x)); };
    var nm = ek(x), nm0 = String(x.name).toLowerCase(), hq = function () { var h = hqList().filter(function (y) { return (y.k === nm || y.k === nm0) && +y.score === +x.score; })[0]; if (h && h.d && !(lim > 0 && h.d.length * 0.75 > lim)) openStored(h.d, x, title, true); else fb(); };
    var okB = function (v) { return v && v.blob && +v.score === +x.score && !(lim > 0 && v.blob.size > lim); };
    idbDo("readonly", function (st) { return st.get(nm); }).then(function (v) { if (okB(v)) openStored(v.blob, x, title); else if (nm !== nm0) return idbDo("readonly", function (st) { return st.get(nm0); }).then(function (v2) { if (okB(v2)) openStored(v2.blob, x, title); else hq(); }); else hq(); }).catch(hq);
  });
  function openStored(src, x, title, isUrl) {
    var el = document.createElement("div"); el.className = "rmodal"; el.setAttribute("role", "dialog"); var url = isUrl ? src : URL.createObjectURL(src);
    el.innerHTML = '<div class="rbox"><h2></h2><img class="t3full" alt="কার্ড"><button class="btn o s" type="button" id="t3d" style="margin-top:10px;width:100%">⬇ ডাউনলোড (হাই কোয়ালিটি ' + (isUrl ? "JPG" : "PNG") + ')</button><button class="btn l s" type="button" id="t3x" style="margin-top:10px;width:100%">বন্ধ করুন</button></div><button class="rx" type="button" id="t3rx" aria-label="বন্ধ করুন">✕</button>';
    el.querySelector("h2").textContent = title; el.querySelector("img").src = url; document.body.appendChild(el); addDel(el, ek(x));
    var close = function () { el.remove(); if (!isUrl) setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
    el.querySelector("#t3d").onclick = function () { var a = document.createElement("a"); a.download = isUrl ? fname(x.rec).replace(/\.png$/, ".jpg") : fname(x.rec); a.rel = "noopener"; a.style.display = "none"; a.href = url; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 3000); };
    el.querySelector("#t3x").onclick = close; el.querySelector("#t3rx").onclick = close; el.onclick = function (ev) { if (ev.target === el) close(); };
  }
  function openThumb(x, title) {
    var el = document.createElement("div"); el.className = "rmodal"; el.setAttribute("role", "dialog");
    el.innerHTML = '<div class="rbox"><h2></h2><img class="t3full" alt="কার্ড"><div class="sm" style="text-align:center;margin-top:8px">এটা পুরোনো কার্ড, তাই শুধু ছোট ছবি আছে; ডাউনলোডের রেজোলিউশন কম হবে।</div><button class="btn o s" type="button" id="t3d" style="margin-top:10px;width:100%">⬇ ডাউনলোড (ছোট ছবি)</button><button class="btn l s" type="button" id="t3x" style="margin-top:10px;width:100%">বন্ধ করুন</button></div><button class="rx" type="button" id="t3rx" aria-label="বন্ধ করুন">✕</button>';
    el.querySelector("h2").textContent = title; el.querySelector("img").src = x.th; document.body.appendChild(el); addDel(el, ek(x));
    var close = function () { el.remove(); };
    el.querySelector("#t3d").onclick = function () { var a = document.createElement("a"); a.download = fname({ name: x.name, score: x.score }).replace(/\.png$/, "_small.jpg"); a.rel = "noopener"; a.style.display = "none"; a.href = x.th; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 3000); };
    el.querySelector("#t3x").onclick = close; el.querySelector("#t3rx").onclick = close; el.onclick = function (ev) { if (ev.target === el) close(); };
  }
  var T = 0;
  // app.js কার্ড আঁকার পর ডাকে: mcCardSync(R, canvas, photoImage, opts)
  window.mcCardSync = function (R, canvas, photo, o) {
    try { mineSave(R, canvas, photo, o); } catch (e) {}
    T3C = { k: "", t: 0, r: null };
    if (!ON || !R || !canvas || !R.name) return; clearTimeout(T);
    T = setTimeout(function () {
      try {
        var ph = photoOf(photo), key = [R.name, R.score, R.ts, ph.length].join("|"); if (LS.get("mc2_cardk", "") === key) return;
        var rec = { name: R.name, dept: R.dept, batch: R.batch || "", club: R.club || "", pct: R.pct, score: R.score, ok: R.ok, total: R.total, title: R.title || "", bestPlace: R.bestPlace || "—", kind: R.kind || "", ts: R.ts, drank: (o && o.drank) || 1, rank: (o && o.rank) || 1, site: siteUrl(), lg: (o && Array.isArray(o.lg)) ? o.lg : undefined };
        var args = { p_device: vid(), p_name: String(R.name || "").slice(0, 200), p_dept: R.dept, p_batch: R.batch || "", p_score: R.score, p_rec: rec, p_thumb: thumbOf(canvas), p_photo: ph || null };
        var send = function (retry) { rpc("mc2_card_save", args).then(function (s) { if (s === "ok" || s === "lower") { LS.set("mc2_cardk", key); T3C = { k: "", t: 0, r: null }; } else if (s === "noscore" && retry) setTimeout(function () { send(false); }, 5000); }).catch(function () {}); };
        send(true);
      } catch (e) {}
    }, 1800);
  };

  // ---------- ২) লিডারবোর্ডের সেরা ৩ ----------
  (function css() {
    if (document.getElementById("t3css")) return; var s = document.createElement("style"); s.id = "t3css";
    s.textContent = ".t3{margin:54px 0 10px;padding:0 8px 12px;border-radius:16px;background:linear-gradient(160deg,#0f2d20,#1d6b43);color:#fff}.t3h{font-weight:800;font-size:16px;text-align:center;margin:0 0 8px;color:#ffd84a}" +
      ".t3g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;align-items:end}.t3c{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;background:#ffffff14;border:1px solid #ffffff2e;border-radius:14px;padding:8px 5px;color:#fff;font:inherit;text-align:center}" +
      ".t3c.r1{background:#ffd84a30;border-color:#ffd84a;transform:translateY(-4px)}.t3m{font-size:22px;line-height:1}.t3a{width:56px;height:56px;border-radius:50%;overflow:hidden;background:#e7eee8;color:#1d6b43;display:grid;place-items:center;font-weight:800;font-size:26px;border:3px solid #ffd84a}.r1 .t3a{width:66px;height:66px}" +
      ".t3a img{width:100%;height:100%;object-fit:cover;display:block}.t3n{font-size:13px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.t3d{font-size:11px;opacity:.85;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".t3s{font-weight:800;color:#ffd84a;font-size:15px}.t3p{display:block;width:100%;border:0;padding:0;background:#fff;border-radius:8px;overflow:hidden;line-height:0;cursor:zoom-in}.t3p img{width:100%;height:auto;display:block}.t3z{font-size:11px;opacity:.9}" +
      ".t3full{max-width:100%;max-height:78vh;width:auto;height:auto;display:block;margin:0 auto;border-radius:12px}";
    document.head.appendChild(s);
  })();
  (function podcss() {
    if (document.getElementById("podcss")) return; var s = document.createElement("style"); s.id = "podcss";
    s.textContent = ".pdm{display:flex;align-items:flex-end;justify-content:center;gap:4px}.pc{display:flex;flex-direction:column;align-items:center;min-width:0;flex:1 1 0;max-width:118px;background:none;border:0;padding:0;color:#fff;font:inherit;cursor:pointer;text-align:center}" +
      ".pc .pa{border-radius:50%;overflow:hidden;background:#e7eee8;color:#1d6b43;display:grid;place-items:center;font-weight:800;border:3px solid #ffd84a;margin-bottom:4px}.pc1 .pa{width:68px;height:68px;font-size:26px}.pc2 .pa,.pc3 .pa{width:52px;height:52px;font-size:20px}.pc2 .pa{border-color:#d3d8d5}.pc3 .pa{border-color:#e0a07a}" +
      ".pc .pa img{width:100%;height:100%;object-fit:cover;display:block}.pc .pn{font-size:13px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pc1 .pn{font-size:15px;line-height:40px;height:40px}.pc .ps{font-size:12px;opacity:.9;margin-bottom:6px}" +
      ".pc .pbar{width:100%;border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-size:22px;font-weight:800;color:#3a2a00}.pc1 .pbar{height:92px;background:#ffd84a}.pc2 .pbar{height:64px;background:#d3d8d5}.pc3 .pbar{height:46px;background:#e0a07a}" +
      ".t3t{font-weight:800;font-size:19px;text-align:center;margin:6px 0 2px}.pc1{margin-top:-48px;flex:1.45 1 0;max-width:176px}.pc2,.pc3{flex:1 1 0;max-width:106px}.pc .pbar{display:none}.pc.nc .pbar{display:flex}" +
      ".pc .pv{position:relative;display:block;width:100%;aspect-ratio:1080/1350;border-radius:8px;overflow:hidden;background:#ffffff1f;border:2px solid #ffd84a;box-sizing:border-box}.pc2 .pv{border-color:#d3d8d5}.pc3 .pv{border-color:#e0a07a}" +
      ".pc .pv img{width:100%;height:100%;object-fit:cover;display:block}.pc .pv i{position:absolute;left:4px;top:4px;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:#ffd84a;color:#3a2a00;font-weight:800;font-size:13px;line-height:22px;text-align:center;font-style:normal}";
    document.head.appendChild(s);
  })();
  // হাই কোয়ালিটি PNG ডাউনলোড (অ্যাডমিনের png_max_kb সীমা থাকলে তার মধ্যে; ডিফল্ট: সীমা নেই)
  function dlPng(c, name) {
    var k = +(window.MC_QUIZ && window.MC_QUIZ.png_kb) || 0, mx = k > 0 ? k * 1024 : 0, n = 0;
    var enc = function (cv) { return new Promise(function (r) { cv.toBlob(r, "image/png"); }); };
    var step = function (b, cv) {
      if (!b || !mx || b.size <= mx || n >= 6) return b; n++;
      var s = Math.max(0.3, Math.sqrt(mx / b.size) * 0.95), t = document.createElement("canvas"); t.width = Math.round(cv.width * s); t.height = Math.round(cv.height * s);
      var g = t.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(cv, 0, 0, t.width, t.height); return enc(t).then(function (nb) { return step(nb, t); });
    };
    return enc(c).then(function (b) { return step(b, c); }).then(function (b) {
      var a = document.createElement("a"); a.download = name; a.rel = "noopener"; a.style.display = "none"; a.href = b ? URL.createObjectURL(b) : c.toDataURL("image/png");
      document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); if (b) URL.revokeObjectURL(a.href); }, 30000);
    });
  }
  // opt (শুধু বিজয়ী তালিকা): { cv, pd, name, dept, batch, rank, score } — cv = অ্যাডমিনের বাছাই ('' অটো | b দুটোই | w শুধু বিজয়ী কার্ড | s1/s2/s3 শুধু ওই স্কোর কার্ড), wc = সার্ভারে বিজয়ী কার্ড সেভ আছে, did = ঘোষণার id, key = নাম|বিভাগ|সেশন
  function openFull(rec, photo, title, delKey, pick, z, opt) {
    var el = document.createElement("div"); el.className = "rmodal"; el.setAttribute("role", "dialog");
    el.innerHTML = '<div class="rbox"><h2></h2><div class="sm" id="t3w" style="text-align:center">⏳ কার্ড আঁকা হচ্ছে…</div><img class="t3full" id="t3i" alt="কার্ড" hidden><button class="btn o s" type="button" id="t3d" disabled style="margin-top:10px;width:100%">⬇ ডাউনলোড (হাই কোয়ালিটি PNG)</button><button class="btn l s" type="button" id="t3x" style="margin-top:10px;width:100%">বন্ধ করুন</button></div><button class="rx" type="button" id="t3rx" aria-label="বন্ধ করুন">✕</button>';
    el.querySelector("h2").textContent = title; if (z) el.style.zIndex = z; document.body.appendChild(el); addDel(el, delKey);
    var close = function () { el.remove(); }, CV = null; el.querySelector("#t3d").onclick = function () { if (CV) dlPng(CV, fname(rec)); }; el.querySelector("#t3x").onclick = close; el.querySelector("#t3rx").onclick = close; el.onclick = function (e) { if (e.target === el) close(); };
    var paint = function (ov) {
      var my = ++pseq, r2 = ov ? Object.assign({}, rec, { lgo: ov }) : rec, w = el.querySelector("#t3w"); if (w && CV) { w.hidden = false; w.textContent = "⏳ কার্ড আঁকা হচ্ছে…"; }
      return render(r2, photo, K).then(function (c) { var i = el.querySelector("#t3i"); if (!i || my !== pseq || view !== "s") return; CV = c; i.src = c.toDataURL("image/jpeg", 0.92); i.hidden = false; el.querySelector("#t3w").hidden = true; el.querySelector("#t3d").disabled = false; }).catch(function () { var w2 = el.querySelector("#t3w"); if (w2) { w2.hidden = false; w2.textContent = "কার্ড দেখানো যায়নি।"; } });
    }, pseq = 0;
    // ---- বিজয়ী কার্ড (পোস্টার, ফোনেই আঁকা — সার্ভার থেকে কোনো ছবি আসে না) ও স্কোর কার্ডের মধ্যে বাছাই (শুধু বিজয়ী তালিকায়, opt থাকলে)
    // opt = { cv, pd, did, name, dept, batch, rank, score }: cv = অ্যাডমিনের বাছাই, pd = বিজয়ী কার্ডের ডিজাইন-নম্বর (০–১৯)
    var cvv = (opt && opt.cv) || "", UI = window.MCUI || {}, wOff = !!(opt && UI.winCardOff && UI.winCardOff()), sOff = !!(opt && UI.winScoreOff && UI.winScoreOff()), hasW = !!(opt && opt.name) && !wOff, showW = hasW, showS = !!rec && !sOff, WV = null;
    var K = /^s[123]$/.test(cvv) ? "card" + cvv.charAt(1) : "card", view = showW ? "w" : "s", dlS = el.querySelector("#t3d").onclick, dlT = el.querySelector("#t3d").textContent;
    // 🎴 কাস্টম একাধিক কার্ড (cv="c", opt.cs = {n, l:["s1","w5",..]}): শুধু কোডের তালিকা; প্রতিটা কার্ড ফোনেই আবার আঁকা হয়, কিছু জমা হয় না
    var CS = [], WL = [], SL = [], WI = 0, SI = 0, CPD = null, CSEL = ""; // নতুন নিয়ম: বিজয়ী কার্ড (WL) ও স্কোর কার্ড (SL) আলাদা তালিকা; একটাতে হাত না দিলে সেটা ডিফল্টেই থাকে
    if (cvv === "c" && opt && opt.cs && Object.prototype.toString.call(opt.cs.l) === "[object Array]") {
      var seen = {}; CS = opt.cs.l.filter(function (x) { x = String(x); if (seen[x]) return false; var m = /^s([123])$|^w(\d{1,2})$|^e(\d{1,2})\.[A-Za-z0-9_-]{1,1600}$/.exec(x); var ok = m && (m[1] ? (!!rec && !sOff) : (hasW && +(m[2] || m[3]) < 20)); if (ok) seen[x] = 1; return ok; }).slice(0, 23);
      WL = CS.filter(function (x) { return /^[we]/.test(x); }); SL = CS.filter(function (x) { return x.charAt(0) === "s"; });
    } else if (/^s[123]$/.test(cvv)) SL = [cvv];
    if (WL.length) { CSEL = WL[0]; CPD = parseInt(CSEL.slice(1), 10); } if (SL.length) K = "card" + SL[0].charAt(1);
    function navUpd() { var L = view === "w" ? WL : SL, nv = el.querySelector("#t3nv"); if (!nv) return; nv.style.display = L.length > 1 ? "flex" : "none"; nv.querySelector("#t3nc").textContent = bn((view === "w" ? WI : SI) + 1) + "/" + bn(L.length); }
    // poster-draw.js শুধু এখন (কেউ বিজয়ী কার্ড খুললে) একবার লোড হয়; এরপর ব্রাউজারের ক্যাশে থাকে
    var loadPz = function () {
      if (window.MCPoster) return Promise.resolve(window.MCPoster);
      return new Promise(function (ok, no) { var sc = document.createElement("script"); sc.src = "poster-draw.js"; sc.onload = function () { window.MCPoster ? ok(window.MCPoster) : no(new Error("x")); }; sc.onerror = function () { no(new Error("x")); }; document.head.appendChild(sc); });
    };
    var drawW = function () {
      return Promise.all([loadPz(), fonts()]).then(function (r) {
        var P = r[0], Dd = window.MC || {}, lg = Dd.logos || {};
        return Promise.all([P.li(lg.mc), P.li(lg.nu)]).then(function (L) {
          var pdv = CPD != null ? CPD : opt.pd, pd = pdv != null && P.TH[pdv] ? +pdv : 0, S = Object.assign({}, P.DEF, { d: pd }), p = { name: opt.name, dept: opt.dept || "", batch: opt.batch || "", rank: opt.rank || null, score: opt.score == null ? null : opt.score };
          // বিজয়ীর স্কোর কার্ডে ছবি থাকলে সেটাই বসে (আগে থেকে জমা ছবি; নতুন কিছু জমা হয় না)। না থাকলে/আনা না গেলে নামের প্রথম অক্ষর
          // ফেরত: স্ট্রিং = ছবি আছে, "" = ছবি নেই (ঠিক আছে), ব্যর্থ হলে ৩ বার চেষ্টা (নেটওয়ার্ক/ধীর ইন্টারনেটে যেন ছবি মিস না হয়)
          var getPh = function (n) { return rpc("mc2_winner_photo", { p_draw: opt.did, p_name: opt.name, p_dept: opt.dept || "", p_batch: opt.batch || "" }).then(function (x) { return typeof x === "string" ? x : ""; }, function (e) { if (n < 3) return new Promise(function (r) { setTimeout(r, 700 * n); }).then(function () { return getPh(n + 1); }); throw e; }); };
          var perr = false, phOff = !!(window.MCUI && MCUI.winPhotoOff && MCUI.winPhotoOff()), ph = opt.did && !phOff ? getPh(1).then(function (x) { return /^data:image\/(jpeg|png|webp);base64,/.test(x) ? P.li(x) : null; }).catch(function () { perr = true; return null; }) : Promise.resolve(null);
          return ph.then(function (im) { return (/^e/.test(CSEL) && P.lgFor ? P.lgFor(CSEL, L) : Promise.resolve(L)).then(function (L2) { var cv = /^e/.test(CSEL) ? P.drawCode(p, im, CSEL, L2, 1) : P.draw(p, im, S, L, 1); cv._perr = perr; return cv; }); });
        });
      });
    };
    var wName = function () { return "MC_Winner_" + (opt && opt.rank ? "rank" + opt.rank + "_" : "") + (rec ? fname(rec).replace(/\.png$/i, "") : String((opt && opt.name) || "winner").replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 28)) + ".png"; };
    var setView = function (v) {
      view = v; navUpd(); var i = el.querySelector("#t3i"), w = el.querySelector("#t3w"), d = el.querySelector("#t3d"), pk = el.querySelector("#lgpk2");
      [].forEach.call(el.querySelectorAll("#t3tb [data-v]"), function (b) { b.className = "btn s " + (b.getAttribute("data-v") === v ? "o" : "l"); });
      if (pk) pk.style.display = v === "w" ? "none" : "";
      if (v === "w") {
        w.hidden = false; w.textContent = "⏳ বিজয়ী কার্ড আঁকা হচ্ছে…"; i.hidden = true; d.disabled = true; var pe0 = el.querySelector("#t3pe"); if (pe0) pe0.remove();
        (WV ? Promise.resolve(WV) : drawW().then(function (c) { return (WV = c); }))
          .then(function (c) { if (view !== "w") return; i.src = c.toDataURL("image/jpeg", 0.92); i.hidden = false; w.hidden = true; d.disabled = false; d.textContent = "⬇ ডাউনলোড (বিজয়ী কার্ড)"; d.onclick = function () { dlPng(c, wName()); }; var pe = el.querySelector("#t3pe"); if (pe) pe.remove(); if (c._perr) { pe = document.createElement("div"); pe.id = "t3pe"; pe.className = "sm"; pe.style.cssText = "text-align:center;margin:6px 0"; pe.innerHTML = "⚠️ ছবি আনা যায়নি (ইন্টারনেট)। <button type=\"button\" class=\"btn s l\">🔄 আবার আনুন</button>"; pe.querySelector("button").onclick = function () { WV = null; setView("w"); }; i.insertAdjacentElement("afterend", pe); } })
          .catch(function () { if (showS && view === "w") { showW = false; var tb = el.querySelector("#t3tb"); if (tb) tb.remove(); setView("s"); } else if (view === "w") { w.hidden = false; w.textContent = "বিজয়ী কার্ড আঁকা যায়নি — ইন্টারনেট দেখুন।"; } });
      } else {
        d.textContent = dlT; d.onclick = dlS; d.disabled = !CV;
        if (CV) { i.src = CV.toDataURL("image/jpeg", 0.92); i.hidden = false; w.hidden = true; } else { i.hidden = true; paint(); }
      }
    };
    if (showW && showS) {
      var tb = document.createElement("div"); tb.id = "t3tb"; tb.style.cssText = "display:flex;gap:8px;margin:2px 0 8px";
      tb.innerHTML = '<button type="button" class="btn s" data-v="w" style="flex:1">🏆 বিজয়ী কার্ড</button><button type="button" class="btn s" data-v="s" style="flex:1">🪪 স্কোর কার্ড</button>';
      tb.onclick = function (e) { var b = e.target.closest && e.target.closest("[data-v]"); if (b && b.getAttribute("data-v") !== view) setView(b.getAttribute("data-v")); };
      el.querySelector("h2").insertAdjacentElement("afterend", tb);
    }
    if (WL.length > 1 || SL.length > 1) { // একাধিক হলেই আগের/পরের বাটন; একটা হলে আসে না
      var nv = document.createElement("div"); nv.id = "t3nv"; nv.style.cssText = "display:none;gap:8px;align-items:center;margin:10px 0 0";
      nv.innerHTML = '<button type="button" class="btn s l" data-n="-1" style="flex:1">◀ আগের</button><span class="sm" id="t3nc" style="flex:0 0 auto"></span><button type="button" class="btn s l" data-n="1" style="flex:1">পরের ▶</button>';
      nv.onclick = function (e) { var b = e.target.closest && e.target.closest("[data-n]"); if (!b) return; var d = +b.getAttribute("data-n");
        if (view === "w") { WI = (WI + d + WL.length) % WL.length; CSEL = WL[WI]; CPD = parseInt(CSEL.slice(1), 10); WV = null; setView("w"); } else { SI = (SI + d + SL.length) % SL.length; K = "card" + SL[SI].charAt(1); CV = null; setView("s"); } };
      el.querySelector("#t3d").insertAdjacentElement("beforebegin", nv);
    }
    if (view === "w") setView("w"); else { paint(); navUpd(); }
    // "আগের কার্ড"-এ লোগো ড্রপডাউন: অ্যাডমিনে চালু থাকলেই (ডিফল্টে বন্ধ); বাছাই শুধু এই একটা কার্ডের, সার্ভারে কিছু জমা হয় না
    if (rec && showS && pick && window.mcLogo && window.mcLogo.picker) { // বিজয়ী/লিডারবোর্ডের কার্ড-প্রিভিউতে বাম ও ডানের আলাদা লোগো ড্রপডাউন (বাছাই শুধু এই প্রিভিউর, সার্ভারে কিছু জমা হয় না)
      var inPanel = /admin/i.test(location.pathname), addPk = function (c) { var u = c && c.ud, forAdm = inPanel || !!(u && u.a && window.mcLogo.admHint && window.mcLogo.admHint()); if (!forAdm && !(u && pick && u[pick])) return; if (el.querySelector("#lgpk2")) return; var pk = window.mcLogo.picker({ admin: forAdm, onChange: function (ov) { paint(ov); } }); pk.id = "lgpk2"; var im = el.querySelector("#t3i"); if (im) im.insertAdjacentElement("afterend", pk); if (view === "w") pk.style.display = "none"; };
      (window.mcLogo.load ? Promise.resolve(window.mcLogo.load()) : Promise.resolve()).then(addPk, function () {}); // অ্যাডমিনের "আগের কার্ড" সুইচ (ud.h) বন্ধ থাকলে বা সেটিং না এলে ড্রপডাউন আসে না
    }
  }
  var SEQ = 0, T3C = { k: "", t: 0, r: null }, PVC = {}, PVN = [];
  // সেরা ৩-এর প্রিভিউ ছবি (ছোট JPEG ডেটাইউআরএল) মনে রাখা: বোর্ডে ফিরলে আবার আঁকতে হয় না
  function pvUrl(x, photo) {
    var k = rkey(x.rec, photo, "card", { cw: 540, ch: 675 }); if (PVC[k]) return Promise.resolve(PVC[k]);
    return render(x.rec, photo, "card", { cw: 540, ch: 675 }).then(function (cv) { var u = cv.toDataURL("image/jpeg", 0.86); PVC[k] = u; PVN.push(k); if (PVN.length > 12) delete PVC[PVN.shift()]; return u; });
  }
  // host: খালি div; f: { dept, batch, from, to } (লিডারবোর্ডের ফিল্টার)
  window.mcTop3 = function (host, f) {
    if (!host) return; var seq = ++SEQ; f = f || {};
    if (!ON || (window.MCUI && MCUI.boardOff && MCUI.boardOff())) { host.innerHTML = ""; return; }
    var iso = function (t) { return t ? new Date(t).toISOString() : null; };
    // একই ফিল্টারে ১৫ সেকেন্ডের মধ্যে আবার ডাকলে নতুন নেটওয়ার্ক অনুরোধ নয়
    var args = { p_dept: f.dept || null, p_batch: f.batch || null, p_from: iso(f.from), p_to: iso(f.to) }, ak = JSON.stringify(args);
    (T3C.k === ak && T3C.r && Date.now() - T3C.t < 15000 ? Promise.resolve(T3C.r) : rpc("mc2_top_cards", args).then(function (r) { T3C = { k: ak, t: Date.now(), r: r }; return r; })).then(function (r) {
      if (seq !== SEQ || !host.isConnected) return; var rows = (r && r.rows) || [];
      if (!rows.length) { host.innerHTML = ""; return; }
      host.innerHTML = '<div class="t3t">🏆 সেরা ৩ জন</div><div class="t3"><div class="pdm"></div></div>'; var g = host.querySelector(".pdm");
      var top = rows.slice(0, 3), order = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
      order.forEach(function (ix) {
        var x = top[ix], photo = x.photo && JPG.test(x.photo) ? x.photo : null, rk = x.rk || ix + 1, d = document.createElement("button"); d.type = "button"; d.className = "pc pc" + (ix + 1) + (x.rec ? "" : " nc");
        d.innerHTML = '<span class="pa"></span><span class="pn">' + esc(x.name) + '</span><span class="ps">' + bn(x.score) + ' মার্ক</span>' + (x.rec ? '<span class="pv"><i>' + bn(rk) + "</i></span>" : '<span class="pbar">' + bn(rk) + "</span>");
        if (x.rec) pvUrl(x, photo).then(function (u) { if (seq !== SEQ) return; var pv = d.querySelector(".pv"); if (!pv) return; var im2 = new Image(); im2.alt = ""; im2.src = u; pv.insertBefore(im2, pv.firstChild); }).catch(function () {});
        var av = d.querySelector(".pa"); if (photo) { var im = new Image(); im.alt = ""; im.src = photo; av.appendChild(im); } else av.textContent = [...String(x.name || "M")][0] || "M";
        d.setAttribute("aria-label", x.name + " — " + bn(x.score) + " মার্ক" + (x.rec ? " (কার্ড দেখুন)" : ""));
        if (x.rec) d.onclick = function () { openFull(x.rec, photo, x.name + " — " + bn(x.score) + " মার্ক", null, "b"); }; else d.style.cursor = "default";
        g.appendChild(d);
      });
      // ১ নম্বরের কার্ড না থাকলেও সে সবচেয়ে বড় থাকবে: পাশের ২/৩ নম্বরের কার্ড থাকলে তাদের চেয়ে অন্তত ৪০px উঁচু করে দেয়
      var fit = function () {
        var one = g.querySelector(".pc1"), bar = one && one.querySelector(".pbar"); if (!one || !bar || one.querySelector(".pv") || !g.isConnected) return;
        bar.style.height = ""; var mx = 0; [].forEach.call(g.querySelectorAll(".pc2,.pc3"), function (e) { mx = Math.max(mx, e.offsetHeight); });
        var need = mx + 56 - (one.offsetHeight - bar.offsetHeight); if (need > bar.offsetHeight) bar.style.height = need + "px";
      };
      fit(); if (window.requestAnimationFrame) requestAnimationFrame(fit); setTimeout(fit, 400);
      try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); } catch (er) {}
      g.querySelectorAll("img").forEach(function (im) { if (!im.complete) im.addEventListener("load", fit); });
      if (!window.__mcFitR) { window.__mcFitR = 1; window.addEventListener("resize", function () { var gg = document.querySelector("#t3 .pdm"); if (gg && gg._fit) gg._fit(); }); }
      g._fit = fit;
    }).catch(function () { if (seq === SEQ) host.innerHTML = ""; });
  };
  // ===== লিডারবোর্ডের "🪪 কার্ড দেখো" (সেরা ৩-এর নিচের ইউজার; র‍্যাংক হিস্টরি জানালা থেকে) — supabase-new-20261117.sql =====
  // সার্ভার (mc2_card_peek) একবারে একজনের কার্ডের ছাপা তথ্য দেয়, ছবি/ডিভাইস/আইপি দেয় না। কার্ড ফোনেই আঁকা হয়, ডাউনলোডও ফোনেই।
  var PKC = {}, PLT = [];
  // ফোনের ভেতরে ঘনঘন চাপা ঠেকানো: মিনিটে সর্বোচ্চ ১০০টা নতুন আনা (প্রতি ফোনে আলাদা) (একই কার্ড ১ ঘণ্টা ফোনেই মনে থাকে, সার্ভারে যায় না)। ডাটাবেসে কিছুই লেখা হয় না।
  window.mcWinOK = function () { return ON && !(window.MCUI && MCUI.winOff && MCUI.winOff()); };   // winOff = win_on বন্ধ, অথবা বিজয়ী কার্ড ও স্কোর কার্ড দুটোই বন্ধ   // বিজয়ী তালিকার কার্ড: লিডারবোর্ডের সুইচ থেকে আলাদা (অ্যাডমিন > লিডারবোর্ড > 🏅)
  window.mcPeekOK = function () { return ON && !(window.MCUI && ((MCUI.boardOff && MCUI.boardOff()) || (MCUI.peekOff && MCUI.peekOff()))); };
  // ফেরত: null = কার্ড খুলেছে; নয়তো দেখানোর মতো ছোট বার্তা (লেখা)
  window.mcPeek = function (name, dept, batch, src, opt) { // src: "w" = বিজয়ী তালিকা, না দিলে = লিডারবোর্ড (লোগো-ড্রপডাউনের আলাদা সুইচ ud.w / ud.b)
    var k = (src === "w" ? "w|" : "") + [name, dept, batch || ""].join("|").toLowerCase(), hit = PKC[k], now = Date.now();
    PLT = PLT.filter(function (x) { return now - x < 60000; });
    if (!(hit && now - hit.t < 3600000) && PLT.length >= 100) return Promise.resolve("একটু থেমে আবার চেষ্টা করুন।");
    if (!(hit && now - hit.t < 3600000)) PLT.push(now);
    var get = hit && now - hit.t < 3600000 ? Promise.resolve(hit.r) : rpc("mc2_card_peek", src === "w" ? { p_name: name, p_dept: dept, p_batch: batch || "", p_src: "w" } : { p_name: name, p_dept: dept, p_batch: batch || "" }).then(function (r) { if (r && !r.err && r.on !== false) PKC[k] = { t: Date.now(), r: r }; return r; });
    return get.then(function (r) {
      if (!r || r.err) return "একটু পরে আবার চেষ্টা করুন।";
      if (r.on === false) return "কার্ড প্রিভিউ এখন বন্ধ আছে।";
      var rec = r.rec; if (src === "w") { var U = window.MCUI || {}, wo = !!(U.winCardOff && U.winCardOff()), so = !!(U.winScoreOff && U.winScoreOff()), cw = (opt && opt.cv) || "", sw = !wo && !/^s[123]$/.test(cw), ss = !!rec && !so && !(sw && cw === "w"); if ((wo && so) || (!sw && !ss && rec)) return "কার্ড দেখা এখন বন্ধ আছে।"; } if (!rec || typeof rec !== "object") { if (opt && opt.name && !(window.MCUI && MCUI.winCardOff && MCUI.winCardOff()) && !/^s[123]$/.test(opt.cv || "")) { openFull(null, null, name + " — বিজয়ী কার্ড", null, "w", 120, opt); return null; } return "এই ইউজারের কার্ড সার্ভারে জমা নেই।"; }
      openFull(rec, null, name + " — " + bn(rec.score != null ? rec.score : 0) + " মার্ক", null, src === "w" ? "w" : "b", 120, src === "w" ? opt : null);
      return null;
    }).catch(function () { return "কার্ড আনা যায়নি — ইন্টারনেট দেখুন, অথবা অ্যাডমিন supabase-new-20261117.sql চালাননি।"; });
  };
})();

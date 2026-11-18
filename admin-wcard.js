// অ্যাডমিন: "🏆 বিজয়ী কার্ড" — (১) যেকোনো ইউজারের "🪪 কার্ড" পপআপে কার্ড ১/২/৩/স্টোরির পাশে বিজয়ী কার্ড বাটন (পাশে সংখ্যা);
//   চাপলে ওই ইউজার যে যে বিজয়ী ঘোষণায় আছে সেখানকার বাছা কার্ড দেখায় (না থাকলে "নাই") + "🛠 বানান" বাটনে বিজয়ী কার্ডের ফুল বাছাই (৩ স্কোর কার্ড + ২০ বিজয়ী ডিজাইন)।
// (২) নতুন ট্যাব "🏆 বিজয়ী কার্ড সেটিংস" — বিজয়ী কার্ডের সব সেটিং এক পেজে।
// ডেটা আগের মতোই: mc2_draws.winners[] এর cv / pd / cs (শুধু কোড, ছবি নয়)। নতুন SQL নেই। admin-winners.js-এর পরে, admin.js-এর আগে লোড হয়।
(function () {
  var M = null;
  window.MCA_TABS = (window.MCA_TABS || []).concat([["wcs", "🏆 বিজয়ী কার্ড সেটিংস"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { wcs: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { M = window.MCA; return M.esc(t); };
  var lc = function (s) { return String(s || "").trim().toLowerCase(); };
  var CVO = { "": "অটো (দুটোই)", b: "দুটোই", w: "শুধু বিজয়ী কার্ড", s1: "শুধু স্কোর কার্ড — নেভি মেডালিয়ন", s2: "শুধু স্কোর কার্ড — সবুজ উইনার", s3: "শুধু স্কোর কার্ড — গ্লাস রিং", c: "কাস্টম (বাছা কার্ড)" };
  var CCS = { s1: "নেভি মেডালিয়ন", s2: "সবুজ উইনার", s3: "গ্লাস রিং" };
  var PZN = function () { return window.MCPoster && window.MCPoster.TH ? window.MCPoster.TH.map(function (t) { return t.n; }) : []; };
  var isMan = function (r) { return r && r.source === "wcard-manual"; };
  var nsel = function (w) { return w && w.cv === "c" && w.cs && w.cs.l ? w.cs.l.length : 0; };
  var cardLabel = function (c) { return c.charAt(0) === "s" ? "স্কোর কার্ড — " + (CCS[c] || c) : (c.charAt(0) === "e" ? "✏️ সম্পাদিত — " + (PZN()[window.MCPoster ? window.MCPoster.codeD(c) : 0] || "") : "বিজয়ী কার্ড — " + (PZN()[+c.slice(1)] || c)); };

  // ---------- ইউজার ↔ বিজয়ী মেলানো (ডিভাইস দিয়ে আলাদা করা) ----------
  // info = {name, device, dept, batch}। নিয়ম, প্রতিটা ঘোষণায়:
  //  ১) নাম (+ দুই পক্ষে বিভাগ/সেশন থাকলে সেগুলোও) না মিললে বিজয়ী নয়।
  //  ২) ইউজারের ডিভাইস জানা থাকলে: বিজয়ী "ডিভাইস-যুক্ত" (wcd) হলে ডিভাইস মিললেই — না মিললে আলাদা মানুষ।
  //  ৩) ডিভাইস-যুক্ত না হলে: লটারির "u:ডিভাইস|নাম" চাবি থাকলে তা দেখে (ডিভাইস নেই এবং সব একই-নামের জায়গা অন্যদের — তাহলে আলাদা মানুষ)।
  //  ৪) কোনো প্রমাণ না থাকলে শুধু নামে মেলে (soft = true, পপআপে "🔗 ডিভাইস যুক্ত করুন" বাটন)। 🔒 কড়া মোডে এই শেষ ধাপটা মেলে না।
  // ডিভাইস জানা না থাকলে (যেমন বিজয়ী-তালিকা থেকে খোলা) আগের মতো শুধু নাম।
  var normN = function (n) { return String(n == null ? "" : n).trim().replace(/\s+/g, " ").toLowerCase(); };
  var strictOn = function () { try { return localStorage.getItem("mc2_wc_strict") === "1"; } catch (e) { return false; } };
  function mine(rows, info) {
    var out = [], D = info.device || "", strict = strictOn();
    (rows || []).forEach(function (r) {
      var ws = r.winners || [], dm = window.MCW_DEVMAP ? window.MCW_DEVMAP(r) : {}, lot = {}, ci = [];
      (r.wkeys || []).forEach(function (x) { x = String(x); if (x.indexOf("u:") === 0) { var q = x.slice(2), p = q.indexOf("|"); if (p > 0) (lot[q.slice(p + 1)] = lot[q.slice(p + 1)] || []).push(q.slice(0, p)); } });
      ws.forEach(function (w, k) { if (lc(w.name) === lc(info.name) && (!info.dept || !w.dept || info.dept === w.dept) && (!info.batch || !w.batch || info.batch === w.batch)) ci.push(k); });
      if (!ci.length) return;
      if (!D) { ci.forEach(function (k) { out.push({ r: r, k: k, w: ws[k], lk: dm[window.MCW_WID(ws, k)] || "" }); }); return; }
      var unl = ci.filter(function (k) { return !dm[window.MCW_WID(ws, k)]; }), LD = lot[normN(info.name)] || [], got = false;
      ci.forEach(function (k) { if (dm[window.MCW_WID(ws, k)] === D) { out.push({ r: r, k: k, w: ws[k], lk: D }); got = true; } });
      if (got || !unl.length) return;                                   // ডিভাইস-যুক্ত বিজয়ী পাওয়া গেছে, বা সবাই অন্য ডিভাইসের → এই ইউজার নয়
      if (LD.length) {                                                  // লটারির প্রমাণ
        if (LD.indexOf(D) >= 0) { out.push({ r: r, k: unl[0], w: ws[unl[0]], lk: "" }); return; }
        if (LD.length >= unl.length) return;                            // সব একই-নামের জায়গা অন্য ডিভাইসের
      }
      if (strict) return;
      unl.forEach(function (k) { out.push({ r: r, k: k, w: ws[k], lk: "", soft: true }); });
    });
    return out;
  }
  function count(info) { return window.MCW_LIST(true).then(function (rows) { var L = mine(rows, info); return { n: L.reduce(function (a, x) { return a + nsel(x.w); }, 0), L: L }; }); }

  // ---------- ছোট প্রিভিউ আঁকা (শুধু অ্যাডমিনের ফোনে; সার্ভারে কিছু যায় না) ----------
  function thumbs(host, w, dead, ctx) {
    var P = window.MCPoster, MC = window.MCCards, Dd = window.MC || {}, codes = w.cv === "c" && w.cs && w.cs.l ? w.cs.l.slice() : [], L = null, chain = Promise.resolve();
    var rec = { name: w.name, dept: w.dept || "", batch: w.batch || "", score: w.score == null ? 0 : w.score, pct: w.score == null ? 0 : Math.round(w.score / 10), ok: w.score == null ? 0 : Math.round(w.score / 100), total: 10, rank: w.rank || 1, drank: 1, ts: Date.now(), title: "", club: "" };
    var p = { name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score };
    var small = function (cv) { var c = document.createElement("canvas"); c.width = 280; c.height = Math.round(cv.height * 280 / cv.width); c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", .8); };
    codes.forEach(function (c, n) {
      var el = document.createElement("div"); el.style.cssText = "background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:4px;text-align:center;font-size:12px";
      el.innerHTML = '<div class="ph" style="aspect-ratio:4/5;display:grid;place-items:center;background:#0b1a13;color:#fff;border-radius:8px;overflow:hidden">⏳</div><div style="margin-top:3px">' + bd(n + 1) + ". " + E(cardLabel(c)) + "</div>" + (ctx ? '<div style="display:flex;gap:4px;margin-top:4px">' + (c.charAt(0) === "s" ? "" : '<button type="button" class="s" data-ce style="flex:1;background:#7c3aed;color:#fff">✏️ সম্পাদনা</button>') + '<button type="button" class="s d" data-cd style="flex:1">🗑 ডিলেট</button></div>' : "");
      host.appendChild(el); var ph = el.querySelector(".ph");
      if (ctx) {
        var be = el.querySelector("[data-ce]"), bx = el.querySelector("[data-cd]");
        if (be) be.onclick = function (ev) { ev.stopPropagation(); window.MCW_CARDEDIT(ctx.rid, ctx.k, c, ctx.again); };
        if (bx) bx.onclick = function (ev) { ev.stopPropagation(); window.MCW_CARDDEL(ctx.rid, ctx.k, c, ctx.again); };
      }
      chain = chain.then(function () {
        if (dead()) return;
        var done = function (cv) {
          if (dead()) return; var im = new Image(); im.src = small(cv); im.dataset.big = cv.toDataURL("image/jpeg", .85); im.style.cssText = "width:100%;display:block;cursor:zoom-in"; ph.innerHTML = ""; ph.style.display = "block"; ph.appendChild(im);
          im.onclick = function () { var z = document.createElement("div"); z.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:10px"; z.innerHTML = '<img style="max-width:100%;max-height:100%;border-radius:8px">'; z.firstChild.src = im.dataset.big; z.onclick = function () { z.remove(); }; document.body.appendChild(z); };
        };
        if (c.charAt(0) === "s") return MC ? MC.render(rec, null, "card" + c.charAt(1)).then(done) : null;
        if (!P) throw new Error("poster");
        return (L ? Promise.resolve(L) : Promise.all([P.li(Dd.logos && Dd.logos.mc), P.li(Dd.logos && Dd.logos.nu), window.mcLogo && window.mcLogo.forType ? window.mcLogo.forType("p").catch(function () { return null; }) : null]).then(function (x) { return (L = x[2] ? [x[2][0] || x[0], x[2][1] || x[1]] : [x[0], x[1]]); })).then(function (lg) { return P.lgFor(c, lg).then(function (lg2) { done(P.drawCode(p, null, c, lg2, 1)); }); });
      }).catch(function () { ph.textContent = "আঁকা যায়নি"; }).then(function () { return new Promise(function (r2) { setTimeout(r2, 20); }); });
    });
  }

  // ---------- (১) কার্ড পপআপের "🏆 বিজয়ী কার্ড" প্যানেল ----------
  function open(info, onChange) {
    M = window.MCA; info = info || {};
    var old = document.getElementById("wcpm"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "wcpm"; ov.className = "cxm"; ov.style.zIndex = "120"; document.body.appendChild(ov);
    var gone = false, seq = 0; function close() { gone = true; seq++; ov.remove(); }
    ov.onclick = function (e) { if (e.target === ov) close(); };
    function paint() {
      var my = ++seq;
      ov.innerHTML = '<div class="cxb2" style="width:min(96vw,640px)"><div class="sm">⏳ খোঁজা হচ্ছে…</div></div>';
      return count(info).then(function (X) {
        if (gone || my !== seq) return;
        var h = '<div class="cxb2" style="width:min(96vw,640px)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>🏆 বিজয়ী কার্ড — ' + E(info.name || "") + ' <span class="sm">(বাছা কার্ড: ' + bd(X.n) + ')</span></b><button class="l s" type="button" id="wcX">✕ বন্ধ</button></div>';
        var allMan = X.L.length && X.L.every(function (x) { return isMan(x.r); }), anyReal = X.L.some(function (x) { return !isMan(x.r); });
        if (allMan) h += '<div class="sm" style="background:#fef3c7;color:#92400e;border-radius:8px;padding:6px 8px">⚠️ এই ইউজার কোনো আসল বিজয়ী ঘোষণায় বিজয়ী নন — নিচের কার্ড অ্যাডমিনের নিজে বানানো (ম্যানুয়াল), পাবলিকে দেখায় না।</div>';
        if (!X.L.length) {
          h += '<div style="text-align:center;font-size:30px;font-weight:800;padding:16px 0">নাই</div><div class="sm">এই ইউজার কোনো বিজয়ী ঘোষণায় নেই, তাই বিজয়ী কার্ডও নেই। তবু "🛠 বানান" চেপে অ্যাডমিন নিজে কার্ড বানাতে পারবেন (পাবলিকে দেখাবে না, লুকানো "ম্যানুয়াল বিজয়ী কার্ড" ঘোষণায় থাকবে)।</div><div class="act"><button class="s" type="button" id="wcNo">🛠 বানান</button></div>';
        } else {
          X.L.forEach(function (x, i) {
            var n = nsel(x.w);
            h += '<div class="it"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>' + E(x.r.title || "বিজয়ী ঘোষণা") + '</b>' + (isMan(x.r) ? ' <span class="tag" style="background:#fef3c7;color:#92400e">🛠 ম্যানুয়াল — বিজয়ী নন</span>' : "") + (x.lk ? ' <span class="tag">🔗 ডিভাইস মিলেছে</span>' : x.soft ? ' <span class="tag" style="background:#fee2e2;color:#991b1b">⚠️ শুধু নামে মেলানো</span>' : "") + ' <span class="sm">· ' + E(x.r.draw_date || "") + (x.w.rank ? " · " + bd(x.w.rank) + " নং" : "") + (x.r.show ? "" : " · 🙈 পাবলিকে লুকানো") + '</span></span><button class="s" type="button" data-bn="' + i + '" style="background:#7c3aed;color:#fff">🛠 বানান</button></div>' +
              (x.soft && info.device ? '<div class="act"><button class="l s" type="button" data-lk="' + i + '">🔗 এই ইউজারের ডিভাইসের সাথে যুক্ত করুন</button></div><div class="sm">একই নাম-বিভাগের আরেকজন হলে এটা চাপলে দুজন আলাদা থাকবে।</div>' : "") + '<div class="sm">মোড: ' + E(CVO[x.w.cv || ""] || x.w.cv) + (x.w.pd != null && x.w.pd !== "" ? " · বিজয়ী কার্ডের ডিজাইন: " + E(PZN()[x.w.pd] || bd(+x.w.pd + 1)) : "") + '</div>' +
              (n ? '<div class="sm">🎴 বাছা কার্ড: <b>' + bd(n) + "</b>" + (x.w.cs && x.w.cs.n ? " (" + E(x.w.cs.n) + ")" : "") + ' · প্রতিটার নিচে ✏️ সম্পাদনা ও 🗑 ডিলেট আছে — আবার সম্পাদনা করে সেভ করলে শুধু শেষটাই থাকে।</div><div data-g="' + i + '" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-top:6px"></div>' : '<div style="font-weight:800;font-size:20px;padding:6px 0">নাই</div><div class="sm">এই ঘোষণায় কাস্টম কার্ড বাছা নেই — "🛠 বানান" চেপে বাছুন।</div>') + "</div>";
          });
        }
        ov.innerHTML = h + "</div>";
        ov.querySelector("#wcX").onclick = close;
        var nb = ov.querySelector("#wcNo"); if (nb) nb.onclick = function () {
          nb.disabled = true;
          window.MCW_MANUAL(info).then(function (t) {
            window.MCW_PICK(t.id, t.k, function () { paint().then(function () { if (onChange) onChange(); }); }, function () {
              if (!t.fresh) { nb.disabled = false; return; }   // কিছু না বেছে বন্ধ করলে এইমাত্র যোগ করা নামটা আবার সরানো হয়
              window.MCW_EDIT(t.id, function (ws, d) { if (ws[t.k] && !(ws[t.k].cs && ws[t.k].cs.l)) { window.MCW_UNLINK(d, t.k); ws.splice(t.k, 1); } }).then(function () { nb.disabled = false; }).catch(function () { nb.disabled = false; });
            });
          }).catch(function (er) { nb.disabled = false; M.fail(er); });
        };
        Array.prototype.forEach.call(ov.querySelectorAll("[data-bn]"), function (b) {
          b.onclick = function () { var x = X.L[+b.dataset.bn]; window.MCW_PICK(x.r.id, x.k, function () { paint().then(function () { if (onChange) onChange(); }); }); };
        });
        Array.prototype.forEach.call(ov.querySelectorAll("[data-lk]"), function (b) {
          b.onclick = function () { var x = X.L[+b.dataset.lk]; b.disabled = true; window.MCW_LINK(x.r.id, x.k, info.device).then(function () { paint().then(function () { if (onChange) onChange(); }); }).catch(function (er) { b.disabled = false; M.fail(er); }); };
        });
        Array.prototype.forEach.call(ov.querySelectorAll("[data-g]"), function (g) { var x = X.L[+g.dataset.g]; thumbs(g, x.w, function () { return gone || my !== seq; }, { rid: x.r.id, k: x.k, again: function () { paint().then(function () { if (onChange) onChange(); }); } }); });
        if (onChange) onChange(X.n);
      }).catch(function (e) { if (!gone) { ov.innerHTML = '<div class="cxb2"><div class="warn">❌ ' + E(e && e.message ? e.message : e) + '</div><button type="button" id="wcX">বন্ধ</button></div>'; ov.querySelector("#wcX").onclick = close; } });
    }
    return paint();
  }

  // ---------- (২) "🏆 বিজয়ী কার্ড সেটিংস" পেজ ----------
  var ST = { on: { c: true, s: true, p: true }, ud: false, rows: [], q: "", did: "", n: 8, msg: "" };
  function cfg() {
    return Promise.all([M.A("mc2_settings?select=value&key=eq.board_cfg").catch(function () { return []; }), M.A("mc2_settings?select=value&key=eq.logo_cfg").catch(function () { return []; })]).then(function (a) {
      var v = (a[0][0] && a[0][0].value) || {}, wn = v.win_on !== false;
      ST.on = { c: v.win_card_on !== false && wn, s: v.win_score_on !== false && wn, p: v.win_photo_on !== false };
      var l = (a[1][0] && a[1][0].value) || {}; ST.ud = !!(l.ud && l.ud.w);
    });
  }
  function view() {
    M = window.MCA; var V = M.$("#view"); V.innerHTML = '<div id="wcsH"><p class="sm">⏳ লোড হচ্ছে…</p></div>'; bind(V);
    return Promise.all([cfg(), window.MCW_LIST()]).then(function (a) { ST.rows = a[1]; paint(); }).catch(function (e) { V.innerHTML = '<p class="warn">❌ ' + E(e && e.message ? e.message : e) + "</p>"; });
  }
  function paint() {
    var H = document.querySelector("#wcsH"); if (!H) return; var names = PZN(), q = lc(ST.q);
    var chk = function (id, on, t, d) { return '<label style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--bd)"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + ' style="width:22px;height:22px;flex:none"><span><b>' + t + '</b><div class="sm">' + d + "</div></span></label>"; };
    var rows = ST.rows.filter(function (r) { return !ST.did || String(r.id) === ST.did; });
    var dmap = {}; ST.rows.forEach(function (r) { dmap[r.id] = window.MCW_DEVMAP(r); });
    var shown = 0, tot = 0, body = rows.map(function (r) {
      var ws = (r.winners || []).map(function (w, k) { return { w: w, k: k }; }).filter(function (x) { return !q || lc(x.w.name).indexOf(q) >= 0; });
      if (!ws.length) return ""; tot++; if (tot > ST.n && !ST.did && !q) return "";
      shown++;
      return '<div class="it"><b>' + E(r.title || "বিজয়ী ঘোষণা") + '</b>' + (isMan(r) ? ' <span class="tag" style="background:#fef3c7;color:#92400e">🛠 ম্যানুয়াল — এরা আসল বিজয়ী নন</span>' : "") + ' <span class="sm">· ' + E(r.draw_date || "") + " · " + (r.show ? "👁 দেখানো" : "🙈 লুকানো") + " · বিজয়ী " + bd((r.winners || []).length) + "</span>" +
        ws.map(function (x) {
          var w = x.w, cv = w.cv || "";
          return '<div style="border-top:1px solid var(--bd);padding:6px 0;display:grid;gap:5px" data-r="' + r.id + '" data-k="' + x.k + '"><div><b>' + bd(x.k + 1) + ". " + E(w.name) + "</b>" + (window.MCG ? window.MCG.tag(w.device || null, w.name) : "") + (w.dept ? ' <span class="tag">' + E(w.dept) + "</span>" : "") + (w.batch ? ' <span class="tag">' + E(w.batch) + "</span>" : "") + "</div>" +
            '<div class="act"><label class="sm">পাবলিকে যে কার্ড<select data-f="cv">' + Object.keys(CVO).map(function (c) { return '<option value="' + c + '"' + (cv === c ? " selected" : "") + ">" + E(CVO[c]) + "</option>"; }).join("") + '</select></label>' +
            '<label class="sm">বিজয়ী কার্ডের ডিজাইন<select data-f="pd"><option value="">ডিফল্ট (১ম)</option>' + names.map(function (n, i) { return '<option value="' + i + '"' + (w.pd != null && w.pd !== "" && +w.pd === i ? " selected" : "") + ">" + bd(i + 1) + ". " + E(n) + "</option>"; }).join("") + "</select></label></div>" +
            '<div class="sm">📱 ডিভাইস: ' + (dmap[r.id] && dmap[r.id][window.MCW_WID(r.winners, x.k)] ? "<b>" + E(String(dmap[r.id][window.MCW_WID(r.winners, x.k)]).slice(0, 14)) + "…</b> (যুক্ত)" : "যুক্ত নেই") + ' <button class="l s" type="button" data-a="dv">🔗 ডিভাইস দিন/সরান</button></div>' + '<div class="act"><button class="s" type="button" data-a="sv">💾 সেভ</button><button class="s" type="button" data-a="bn" style="background:#7c3aed;color:#fff">🛠 বানান</button><button class="s" type="button" data-a="vw" style="background:#0ea5e9;color:#fff">🎴 বাছা কার্ড: ' + bd(nsel(w)) + '</button><button class="l s" type="button" data-a="ps">🖼 পোস্টার দেখে ডিজাইন</button></div></div>';
        }).join("") + "</div>";
    }).join("");
    H.innerHTML = '<h2>🏆 বিজয়ী কার্ড সেটিংস</h2><p class="sm">বিজয়ী কার্ডের সব সেটিং এক জায়গায়। সার্ভারে কার্ডের ছবি যায় না — শুধু ছোট কোড (মোড, ডিজাইন নম্বর, বাছা কার্ডের তালিকা); কার্ড ইউজারের ফোনে আঁকা হয়।</p>' +
      '<div class="it"><b>১) সাইটে বিজয়ী তালিকার কার্ড (সবার জন্য)</b>' +
      chk("wsC", ST.on.c, "🏆 বিজয়ী কার্ড চালু", "বিজয়ী তালিকায় বিজয়ী কার্ড (পোস্টার-ডিজাইন) দেখাবে।") +
      chk("wsS", ST.on.s, "🪪 স্কোর কার্ড চালু (বিজয়ী তালিকায়)", "বিজয়ী তালিকায় \"🪪 কার্ড দেখুন\"-এ স্কোর কার্ড দেখাবে। দুটোই বন্ধ হলে বিজয়ী তালিকার কার্ড পুরোটাই বন্ধ।") +
      chk("wsP", ST.on.p, "📷 বিজয়ীর ছবি নিজে আনা", "বিজয়ী কার্ডে বিজয়ীর স্কোর-কার্ডের ছবি বসবে (কার্ডের ছবি-দেখানো চালু থাকলে)।") +
      '<div class="act" style="margin-top:8px"><button type="button" id="wsSv">💾 সংরক্ষণ</button><span class="sm" id="wsM">' + E(ST.msg) + "</span></div>" +
      chk("wsK", strictOn(), "🔒 কড়া মোড — ডিভাইস দিয়ে আলাদা করা", "চালু থাকলে কার্ড পপআপে ইউজার তখনই বিজয়ী ধরা হবে যখন ডিভাইস মেলে (ডিভাইস-যুক্ত বিজয়ী বা লটারির প্রমাণ)। শুধু নাম-বিভাগ মিললে ধরা হবে না। বন্ধ থাকলে প্রমাণ না থাকলে নামে মিললেও ধরা হবে, তবে লাল \"শুধু নামে মেলানো\" চিহ্নসহ। (এই ব্রাউজারে সেভ হয়।)") + '<div class="sm" style="margin-top:6px">🖼️ বিজয়ী তালিকায় লোগো বাছাই: <b>' + (ST.ud ? "চালু" : "বন্ধ") + '</b> <button class="l s" type="button" id="wsLg">🖼️ লোগো ট্যাবে যান</button></div></div>' +
      '<div class="it"><b>২) প্রতি বিজয়ীর কার্ড (মোড · ডিজাইন · বাছা কার্ড)</b><div class="sm">"কাস্টম" মোডে \"🛠 বানান\" দিয়ে যত কার্ড বাছবেন সেগুলোই পাবলিকে দেখাবে; বাছাই সংখ্যা \"🎴 বাছা কার্ড\" বাটনে ও কার্ড পপআপের \"🏆 বিজয়ী কার্ড (N)\"-এ দেখায়।</div>' +
      '<div class="act" style="margin-top:6px"><input id="wsQ" placeholder="বিজয়ীর নাম খুঁজুন" value="' + E(ST.q) + '" style="flex:1;min-width:120px"><select id="wsD"><option value="">সব ঘোষণা</option>' + ST.rows.map(function (r) { return '<option value="' + r.id + '"' + (String(r.id) === ST.did ? " selected" : "") + ">" + E((r.title || "ঘোষণা") + " — " + (r.draw_date || "")) + "</option>"; }).join("") + "</select></div></div>" +
      (body || '<p class="sm">কোনো বিজয়ী পাওয়া যায়নি।</p>') + (!ST.did && !q && tot > ST.n ? '<div class="act" style="justify-content:center"><button class="l s" type="button" id="wsMore">আরও ঘোষণা দেখান (' + bd(tot - ST.n) + "টি বাকি)</button></div>" : "");
  }
  function refresh() { return window.MCW_LIST().then(function (r) { ST.rows = r; paint(); }); }
  function bind(V) {
    V.onclick = function (e) {
      var b = e.target.closest("button"); if (!b || !V.querySelector("#wcsH")) return;
      if (b.id === "wsSv") {
        try { localStorage.setItem("mc2_wc_strict", V.querySelector("#wsK").checked ? "1" : "0"); } catch (x) {} var c = V.querySelector("#wsC").checked, s = V.querySelector("#wsS").checked, p = V.querySelector("#wsP").checked, mm = V.querySelector("#wsM"); mm.textContent = "⏳…";
        return M.A("mc2_settings?select=value&key=eq.board_cfg").catch(function () { return []; }).then(function (a) {
          var v = Object.assign({}, (a[0] && a[0].value) || {}, { win_on: c || s, win_card_on: c, win_score_on: s, win_photo_on: p });
          return M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "board_cfg", value: v }]) });
        }).then(function () { ST.on = { c: c, s: s, p: p }; ST.msg = "✅ সংরক্ষিত — সাইটে সর্বোচ্চ কয়েক সেকেন্ডে বদলাবে"; var m2 = V.querySelector("#wsM"); if (m2) m2.textContent = ST.msg; }).catch(function (er) { mm.textContent = "❌ " + (er && er.message ? er.message : er); });
      }
      if (b.id === "wsLg") { var t = document.querySelector('#tabs [data-t="logo"]'); if (t) t.click(); else alert("লোগো ট্যাব পাওয়া যায়নি।"); return; }
      if (b.id === "wsMore") { ST.n += 8; return paint(); }
      var box = b.closest("[data-r]"); if (!box || !b.dataset.a) return;
      var rid = +box.dataset.r, k = +box.dataset.k, r = ST.rows.filter(function (q) { return q.id === rid; })[0], w = r && (r.winners || [])[k]; if (!w) return;
      if (b.dataset.a === "bn") return window.MCW_PICK(rid, k, function () { refresh(); });
      if (b.dataset.a === "vw") return open({ name: w.name, device: w.device || "", dept: w.dept || "", batch: w.batch || "" }, function () { });
      if (b.dataset.a === "sv") {
        var cv = box.querySelector('[data-f="cv"]').value, pd = box.querySelector('[data-f="pd"]').value;
        if (cv === "c" && !nsel(w)) return alert("কাস্টম মোডের জন্য আগে \"🛠 বানান\" দিয়ে অন্তত একটা কার্ড বাছুন।");
        b.disabled = true;
        return window.MCW_EDIT(rid, function (ws) { var x = ws[k]; if (!x) return; var ov = x.cv || ""; if (cv) x.cv = cv; else delete x.cv; if ((x.cv || "") !== ov) delete x.wc; if (pd !== "") x.pd = +pd; else delete x.pd; }).then(function () { return refresh(); }).then(function () { ST.msg = ""; }).catch(function (er) { b.disabled = false; M.fail(er); });
      }
      if (b.dataset.a === "dv") {
        var cur = (window.MCW_DEVMAP(r) || {})[window.MCW_WID(r.winners, k)] || "", nv = prompt("এই বিজয়ীর ইউজারের ডিভাইস আইডি দিন (ইউজার ইনফোতে পাবেন)। খালি রাখলে যুক্ত সরে যাবে।", cur);
        if (nv === null) return; return window.MCW_LINK(rid, k, nv.trim()).then(function () { return refresh(); }).catch(M.fail);
      }
      if (b.dataset.a === "ps") return window.MCW_DESIGN(rid, k, function () { refresh(); });   // বিজয়ীর সেভ করা ডিজাইন দিয়ে খোলে; "সেভ করুন" সরাসরি ডাটাবেজে (◀ ▶ ও নিচের নেক্সটে সব বিজয়ী)
    };
    V.oninput = function (e) { if (e.target.id === "wsQ") { ST.q = e.target.value; var pos = e.target.selectionStart; paint(); var i = V.querySelector("#wsQ"); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } } };
    V.onchange = function (e) { if (e.target.id === "wsD") { ST.did = e.target.value; paint(); } };
  }

  window.MCWC = { open: open, count: count, mine: mine, isMan: isMan, CVO: CVO };
})();

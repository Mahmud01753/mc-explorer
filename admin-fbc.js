// MC Explorer — অ্যাডমিনের সব জায়গায় "📣 ফেসবুকে ছাড়ার অনুমতি" চিহ্ন (২০২৬-১২-২০; সার্ভারে লাগে supabase-new-20261220.sql, না থাকলে চিহ্ন আসে না, বাকি সব চলে)।
// ব্যবহার: HTML-এ MCFB.span(ডিভাইস) বসালে একটা ফাঁকা <span class="fbc"> বসে; ডেটা আসামাত্র নিজে ভরে যায় (✅ ছবি সহ / ✅ ছবি ছাড়া / ❌ না / ❔ দেয়নি)।
// MCG.tag() (admin-users.js) এটা নিজে ডাকে — তাই নামের পাশে যেখানেই MCG.tag(ডিভাইস, নাম) আছে সেখানেই চিহ্ন দেখায়।
// ডেটা: mc2_fbok পুরোটা একবার আনে (প্রতি সারি ≈ ১০০ বাইট) ও ৫ মিনিট মনে রাখে।
(function () {
  var MAP = null, T = 0, LOADING = null, OFF = false, FBL = { yp: "✅ ছবি সহ", yn: "✅ ছবি ছাড়া", no: "❌ না", none: "❔ দেয়নি" };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function load() {
    var M = window.MCA; if (!M || !M.A || OFF) return Promise.resolve(null);
    if (MAP && Date.now() - T < 300000) return Promise.resolve(MAP);
    if (LOADING) return LOADING;
    var out = {};
    function page(off) { return M.A("mc2_fbok?select=device,ok,mode&order=device&limit=1000&offset=" + off).then(function (a) { a = a || []; a.forEach(function (r) { out[r.device] = r.ok ? (r.mode === "photo" ? "yp" : "yn") : "no"; }); return a.length >= 1000 && off < 49000 ? page(off + 1000) : out; }); }
    LOADING = page(0).then(function (m) { MAP = m; T = Date.now(); LOADING = null; return m; }).catch(function () { LOADING = null; if (!MAP) OFF = true; return null; });
    return LOADING;
  }
  // এক ডিভাইসের অবস্থা: "yp" | "yn" | "no" | "none" (প্রমিজ)
  function get(dev) { return load().then(function (m) { return m ? (m[dev] || "none") : ""; }); }
  function chip(st) { return st ? '<span class="tag fbt" title="ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি">📣 ' + FBL[st] + "</span>" : ""; }
  function span(dev) { return dev ? ' <span class="fbc" data-fbd="' + esc(dev) + '"></span>' : ""; }
  var raf = 0;
  function fill() {
    raf = 0; var els = document.querySelectorAll(".fbc:not([data-ok])"); if (!els.length) return;
    load().then(function (m) {
      Array.prototype.forEach.call(document.querySelectorAll(".fbc:not([data-ok])"), function (e) { e.setAttribute("data-ok", "1"); if (m) e.innerHTML = chip(m[e.getAttribute("data-fbd")] || "none"); });
    });
  }
  function sched() { if (!raf) raf = (window.requestAnimationFrame || setTimeout)(fill); }
  try { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes && ms[i].addedNodes.length) { sched(); return; } }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}

  // ===== 🚦 অনুমতি-গেট (২০২৬-১২-২১): নাম বাছার সময় যাদের ফেসবুক-অনুমতি নেই (❌ না / ❔ দেয়নি) তাদের নিয়ে একটাই পপআপ =====
  // ভাগ ৪ (২০২৬-১২-২৪): পপআপে ওপরে ৩ বাটন + 📋 বেছে দেখি ভাঁজ-বক্স; MCFB.st(ডিভাইস) = ডেটা আনা থাকলে সাথে সাথে অবস্থা (yp/yn/no/none), না থাকলে "".
  // MCFB.gate(মানুষের তালিকা [{name, device, dept?}]) → Promise: বাছা হবে এমন তালিকা (ক্রম একই), বাতিল করলে null।
  // অনুমতি আছে যারা তারা এমনিতেই যায়; নেই যারা তাদের তালিকা পপআপে (শুরুতে কারও টিক নেই) — যাদের টিক দেবেন শুধু তারা যোগ হবে।
  // অনুমতির ডাটা (mc2_fbok) আনা না গেলে (SQL চালানো হয়নি) পপআপ আসে না, সবাই যায়।
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  function lacks(st) { return st === "no" || st === "none"; }
  function popup(bad, okN) {
    return new Promise(function (res) {
      var one = bad.length === 1 && okN === 0, dl = (window.MC && window.MC.deptLabel) ? window.MC.deptLabel : function (x) { return x; };
      var w = document.createElement("div");
      w.setAttribute("style", "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px");
      var rows = bad.map(function (b, i) {
        return '<label style="display:flex;gap:8px;align-items:center;padding:10px 0;border-top:1px dashed var(--bd,#ccc);cursor:pointer"><input type="checkbox" data-g="' + i + '" style="width:22px;height:22px;flex:none"><span><b>' + esc(b.p.name) + "</b> " + chip(b.st) + (b.p.dept || b.p.batch ? '<br><span class="sm">' + esc([dl(b.p.dept || ""), b.p.batch].filter(Boolean).join(" · ")) + "</span>" : "") + "</span></label>";
      }).join("");
      // ভাগ ৪ (২০২৬-১২-২৪): ওপরে তিনটা বড় বাটন (সবাই / শুধু অনুমতিওয়ালারা / সব বাতিল) + "📋 বেছে দেখি" ভাঁজ-বক্স (শুরুতে বন্ধ; খুললে চেকবক্স-তালিকা + টিকের লাইভ গণনা + "ঠিক আছে")
      var BS = "width:100%;min-height:48px;padding:10px 12px;font-size:15px;line-height:1.35;text-align:center;white-space:normal;box-sizing:border-box";
      w.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--card,#fff);color:var(--tx,#111);border-radius:16px;max-width:460px;width:100%;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.4);overflow:hidden">' +
        '<div style="padding:14px 16px 6px;flex:none"><b style="font-size:17px">📣 ফেসবুক-অনুমতি নেই</b><p class="sm" style="margin:6px 0 0">' +
        (one ? "<b>" + esc(bad[0].p.name) + "</b> ফেসবুকে কার্ড ছাড়ার অনুমতি দেননি। তবুও যোগ করবেন?" :
          bn(bad.length) + " জনের ফেসবুকে ছাড়ার অনুমতি নেই।" + (okN ? " অনুমতি আছে এমন " + bn(okN) + " জন এমনিতেই যোগ হবে।" : "") + " নিচে বেছে নিন কী করবেন:") + "</p></div>" +
        '<div style="padding:6px 16px 10px;overflow:auto;flex:1 1 auto;min-height:0;-webkit-overflow-scrolling:touch">' +
        (one ? "" :
          '<div style="display:grid;gap:8px">' +
          '<button type="button" data-g="all" style="' + BS + '">✅ সবাইকে যোগ করুন (অনুমতি নেই এমন ' + bn(bad.length) + ' জনসহ)</button>' +
          '<button type="button" class="l" data-g="only" style="' + BS + '">🚫 শুধু অনুমতিওয়ালারা যোগ হোক (অনুমতি-নেইরা বাদ)</button>' +
          '<button type="button" class="l" data-g="cancel" style="' + BS + '">✖ সব বাতিল (কেউই যোগ হবে না)</button>' +
          '<button type="button" class="l" data-g="tog" id="fbgTog" aria-expanded="false" style="' + BS + '">📋 বেছে দেখি (অনুমতি-নেই ' + bn(bad.length) + ' জন) ▾</button></div>' +
          '<div id="fbgBox" hidden style="margin-top:8px;border:1px solid var(--bd,#ccc);border-radius:12px;padding:8px 12px">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button type="button" class="l s" data-g="tall" style="min-height:40px">☑ সবাইকে টিক</button><button type="button" class="l s" data-g="tnone" style="min-height:40px">☐ কাউকে না</button><b class="sm" id="fbgCnt" style="margin-left:auto"></b></div>' + rows + "</div>") +
        "</div>" +
        (one ? '<div style="padding:12px 16px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--bd,#ccc);flex:none"><button type="button" class="l" data-g="cancel" style="min-height:46px">✖ বাতিল</button><button type="button" data-g="ok" id="fbgOk" style="min-height:46px">✅ হ্যাঁ, যোগ করুন</button></div>' :
          '<div id="fbgFt" hidden style="padding:10px 16px;border-top:1px solid var(--bd,#ccc);flex:none"><button type="button" data-g="ok" id="fbgOk" style="' + BS + '">✅ ঠিক আছে</button></div>') + "</div>";
      document.body.appendChild(w);
      var boxes = function () { return Array.prototype.slice.call(w.querySelectorAll("input[data-g]")); };
      function upd() {
        if (one) return; var n = boxes().filter(function (x) { return x.checked; }).length, b = w.querySelector("#fbgOk"), c = w.querySelector("#fbgCnt");
        if (c) c.textContent = "টিক: " + bn(n) + "/" + bn(bad.length);
        if (b) b.textContent = "✅ ঠিক আছে" + (okN || n ? " (" + bn(okN + n) + " জন যোগ হবে)" : " (কেউ যোগ হবে না)");
      }
      function done(v) { document.removeEventListener("keydown", kd, true); if (w.parentNode) w.parentNode.removeChild(w); res(v); }
      function kd(e) { if (e.key === "Escape") { e.stopPropagation(); done(null); } }
      document.addEventListener("keydown", kd, true);
      w.addEventListener("change", upd);
      w.addEventListener("click", function (e) {
        if (e.target === w) return done(null);
        var b = e.target.closest("button[data-g]"); if (!b) return; var a = b.dataset.g;
        if (a === "cancel") return done(null);
        if (a === "all") return done(bad.map(function (x) { return x.p; }));
        if (a === "only") return done([]);
        if (a === "tog") { var bx = w.querySelector("#fbgBox"), ft = w.querySelector("#fbgFt"), op = bx.hidden; bx.hidden = !op; if (ft) ft.hidden = !op; b.setAttribute("aria-expanded", op ? "true" : "false"); b.textContent = "📋 বেছে দেখি (অনুমতি-নেই " + bn(bad.length) + " জন) " + (op ? "▴" : "▾"); if (op) bx.scrollIntoView({ block: "nearest" }); return; }
        if (a === "tall" || a === "tnone") { boxes().forEach(function (x) { x.checked = a === "tall"; }); return upd(); }
        if (a === "ok") done(one ? bad.map(function (x) { return x.p; }) : boxes().filter(function (x) { return x.checked; }).map(function (x) { return bad[+x.dataset.g].p; }));
      });
      upd();
    });
  }
  function gate(people) {
    people = (people || []).filter(Boolean); if (!people.length) return Promise.resolve(people);
    return load().then(function (m) {
      if (!m) return people;
      var bad = [], okN = 0;
      people.forEach(function (p) { var st = p.device ? (m[p.device] || "none") : "none"; if (lacks(st)) bad.push({ p: p, st: st }); else okN++; });
      if (!bad.length) return people;
      return popup(bad, okN).then(function (pick) { if (!pick) return null; return people.filter(function (p) { var isBad = bad.some(function (b) { return b.p === p; }); return !isBad || pick.indexOf(p) >= 0; }); });
    }).catch(function () { return people; });
  }
  window.MCFB = { gate: gate, st: function (dev) { return MAP ? (dev && MAP[dev]) || "none" : ""; }, load: load, get: get, chip: chip, span: span, L: FBL, reload: function () { MAP = null; OFF = false; return load(); } };
})();

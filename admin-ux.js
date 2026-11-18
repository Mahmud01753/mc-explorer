// অ্যাডমিন: ধাপ ০ ভাগ ২ (০.৫–০.১২) — বাংলা লেবেল, বাটনের রং, ফল-লাইন (✅/❌), দুই-ধাপ নিশ্চিতকরণ, বন্ধ বাটনের কারণ, পরের ধাপ।
// SQL লাগে না। অন্য ফাইল বদলায় না: সব কাজ পর্দায় দেখানো লেখা/ক্লাসে, আর fetch-এর ফল দেখে। এই ফাইল না থাকলে অ্যাডমিন আগের মতোই চলে।
// লোড-ক্রম: admin-hub.js-এর পরে, admin.js-এর আগে।
(function () {
  "use strict";
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };

  // ---------- ০.৫ বাংলা লেবেল (শুধু বাটন/শিরোনাম/ছোট লেখায়; নাম, ডেটা, ইনপুট ছোঁয় না) ----------
  var MAP = [
    ["যাচাই (Verify)", "যাচাই"], ["Visitor List / User Info", "ভিজিটর তালিকা / ইউজার তথ্য"], ["User Info", "ইউজার তথ্য"],
    ["Visitor List", "ভিজিটর তালিকা"], ["Join / Leave", "আসা / যাওয়া"], ["Online Count", "অনলাইন সংখ্যা"], ["Last Active", "শেষ সক্রিয়"],
    ["Restriction", "সাময়িক বন্ধ"], ["Unban", "ব্যান তুলুন"], ["Review", "পর্যালোচনা"], ["Verify", "যাচাই"], ["CSV", "এক্সেল-ফাইল"]
  ].map(function (p) { return [new RegExp("(?<![A-Za-z])" + p[0].replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") + "(?![A-Za-z])", "g"), p[1]]; });
  var SKIP = "b,a,input,textarea,select,pre,code,script,style,[data-uu],[data-dev],.lk";
  // ০.৬ নাম একরকম: ট্যাবের নাম (হুবহু মিললে)
  var TABN = { "💬 চ্যাট": "💬 পুরোনো চ্যাট" };
  function labels(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, L = [];
    while ((n = w.nextNode())) L.push(n);
    L.forEach(function (n) {
      var s = n.nodeValue; if (!s || !/[A-Za-z]/.test(s)) return;
      var p = n.parentElement; if (!p || p.closest(SKIP)) return;
      var o = s; MAP.forEach(function (m) { o = o.replace(m[0], m[1]); });
      if (o !== s) n.nodeValue = o;
    });
    [].forEach.call(document.querySelectorAll("#tabs button"), function (b) { var t = b.textContent.trim(); if (TABN[t]) b.textContent = TABN[t]; });
  }

  // ---------- ০.৭ বাটনের রং ----------
  function colours(root) {
    [].forEach.call(root.querySelectorAll("button"), function (b) {
      if (b.closest("#tabs")) return;
      var t = b.textContent;
      if (!b.classList.contains("d") && !b.classList.contains("ux-ok") && /ফেরত আনুন|ফেরত|রিস্টোর|পুনরুদ্ধার/.test(t)) b.classList.add("ux-ok");
    });
  }

  var css = document.createElement("style");
  css.textContent =
    "button:disabled{opacity:.5;cursor:not-allowed}button.ux-ok{background:var(--card);color:var(--g);border:2px solid var(--g)}button.d{box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}" +
    "#mcTs{position:fixed;top:8px;left:8px;right:8px;margin:auto;max-width:540px;z-index:70;display:flex;flex-direction:column;gap:6px;pointer-events:none}.mcT{pointer-events:auto;border-radius:12px;padding:10px 12px;color:#fff;font-weight:700;display:flex;gap:8px;align-items:center;justify-content:space-between;box-shadow:0 3px 12px #0006}" +
    ".mcT.ok{background:#1d6b43}.mcT.bad{background:#b3261e}.mcT.info{background:#8a5a00}.mcT button{background:#fff;color:#10261b;padding:6px 10px;min-height:36px;white-space:nowrap}.mcT .x{background:none;color:#fff;font-size:18px;padding:4px 8px}";
  document.head.appendChild(css);

  // ---------- ০.৮ ফল-লাইন + ০.১১ ✅/❌ + ০.১২ পরের ধাপ ----------
  var tBox = null, MAXT = 5;
  function toast(kind, txt) {
    if (!tBox || !tBox.isConnected) { tBox = document.createElement("div"); tBox.id = "mcTs"; tBox.setAttribute("role", "status"); tBox.setAttribute("aria-live", "polite"); document.body.appendChild(tBox); }
    var el = document.createElement("div"), tm = 0; el.className = "mcT " + kind;
    var gone = function () { clearTimeout(tm); if (el.parentNode) el.parentNode.removeChild(el); };
    var s = document.createElement("span"); s.textContent = txt; el.appendChild(s);
    var x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "✕"; x.setAttribute("aria-label", "বন্ধ"); el.appendChild(x);
    x.onclick = gone; // শুধু ✕ চাপলে বন্ধ (নইলে সময় শেষে নিজে সরে)
    tm = setTimeout(gone, kind === "ok" ? 2000 : 3000);
    tBox.appendChild(el); // একসঙ্গে একাধিক এলে উপর-নিচ হয়ে সাজায়
    while (tBox.children.length > MAXT) tBox.removeChild(tBox.firstChild);
  }
  window.MCA_UX = { toast: toast };

  var WRITE = /_(set|save|del|delete|hide|show|edit|restore|purge|run|sanction|verify|flag|warn|upload|keep|cfg|photo|apply|clear|reset|empty|rename|ack|unsend|react|bulk)(_|$)|admin_(upload|dept_keep|verify|sanction)|bin_(restore|purge|delete)/i;
  var POLL = /online|live|tick|ping|presence|leave|meta|space_stats|admin_reports/i;
  var okN = 0, okT = 0;
  function okMark() {
    okN++; clearTimeout(okT);
    okT = setTimeout(function () { toast("ok", "✅ হয়েছে" + (okN > 1 ? " (" + bn(okN) + "টি কাজ)" : "")); okN = 0; }, 700);
  }
  function bad(status, body, rpc) {
    var m = ""; try { var j = JSON.parse(body); m = j.message || j.msg || j.error_description || ""; } catch (e) { m = String(body || "").slice(0, 100); }
    var why = status === 404 && rpc ? "এই কাজের নতুন SQL মনে হয় এখনো চালানো হয়নি" : (status === 401 || status === 403) ? "অনুমতি নেই, আবার লগইন করে দেখুন" : (m ? String(m).slice(0, 110) : "কোড " + bn(status));
    toast("bad", "❌ হয়নি — " + why);
  }
  var oF = window.fetch;
  if (oF) window.fetch = function (u, o) {
    var url = typeof u === "string" ? u : (u && u.url) || "";
    if (url.indexOf("/rest/v1/") < 0 && url.indexOf("/storage/v1/") < 0) return oF.apply(this, arguments);
    var m = String((o && o.method) || (u && u.method) || "GET").toUpperCase();
    var rpc = (url.match(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/) || [])[1] || "";
    var p = oF.apply(this, arguments);
    if (rpc && POLL.test(rpc)) return p;
    if (!rpc && (m === "GET" || m === "HEAD")) return p;
    var isW = rpc ? WRITE.test(rpc) : true;
    p.then(function (r) {
      if (r.ok) { if (isW) okMark(); }
      else r.clone().text().then(function (t) { bad(r.status, t, rpc); }, function () { bad(r.status, "", rpc); });
    }, function () { if (isW) toast("bad", "❌ হয়নি — ইন্টারনেট নেই বা সংযোগ কেটে গেছে"); });
    return p;
  };

  // ---------- ০.৯ দুই-ধাপ নিশ্চিতকরণ ----------
  var DANGER = /মুছ|ডিলিট|চিরতরে|খালি|ব্যান/, bypass = false;
  var lab = function (b) { return b.textContent.replace(/^[^ঀ-৿A-Za-z]+/, "").trim(); };
  function ask(b, t) {
    var two = b.hasAttribute("data-ban"), step = 1;
    var d = document.createElement("div"); d.id = "mcDlg";
    var box = document.createElement("div"); box.className = "b"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    d.appendChild(box); document.body.appendChild(d);
    function paint() {
      box.innerHTML = "";
      var h = document.createElement("h3"); h.style.margin = "0"; h.textContent = "⚠️ " + (two ? (step === 1 ? "নিশ্চিত? (ধাপ ১/২)" : "শেষবার নিশ্চিত করুন (ধাপ ২/২)") : "নিশ্চিত?"); box.appendChild(h);
      var p = document.createElement("div"); p.textContent = step === 1 ? "আপনি “" + t + "” চাপছেন। এটা ফেরানো নাও যেতে পারে।" : "সত্যিই “" + t + "” করবেন?"; box.appendChild(p);
      var a = document.createElement("div"); a.className = "act";
      var no = document.createElement("button"); no.type = "button"; no.className = "l"; no.textContent = "না, থাক"; no.onclick = function () { d.remove(); };
      var yes = document.createElement("button"); yes.type = "button"; yes.className = "d"; yes.textContent = two && step === 1 ? "হ্যাঁ, এগোন ›" : "হ্যাঁ, করুন";
      yes.onclick = function () {
        if (two && step === 1) { step = 2; paint(); return; }
        d.remove();
        if (!b.isConnected) { toast("bad", "❌ পাতা বদলে গেছে, বাটনটা আবার চাপুন"); return; }
        bypass = true; try { b.click(); } finally { bypass = false; }
      };
      a.appendChild(no); a.appendChild(yes); box.appendChild(a); no.focus();
    }
    d.onclick = function (e) { if (e.target === d) d.remove(); };
    paint();
  }
  document.addEventListener("click", function (e) {
    if (bypass || !e.target.closest) return;
    var b = e.target.closest("#view button.d");
    if (!b || b.disabled || b.id === "bdDl" || b.dataset.a === "bn" || b.dataset.a === "cb") return;
    var t = lab(b); if (!DANGER.test(t)) return;
    e.preventDefault(); e.stopImmediatePropagation(); ask(b, t);
  }, true);

  // ---------- ০.১০ বন্ধ বাটনের কারণ ----------
  var WHY = { bdDl: "আগে টিক দিয়ে কিছু বাছুন, তারপর ডিলিট চালু হবে।" };
  document.addEventListener("pointerup", function (e) {
    var b = e.target.closest && e.target.closest("button:disabled");
    if (!b || b.closest("#tabs")) return;
    toast("info", "ℹ️ " + (b.dataset.why || b.title || WHY[b.id] || "এখন বন্ধ। আগে দরকারি ঘর পূরণ করুন বা কিছু বাছুন; কাজ চলার সময়ও বন্ধ থাকে।"));
  }, true);

  // ---------- পাতা বদলালে লেবেল/রং আবার ----------
  var tm = 0, app = document.querySelector("#app");
  function pass() { tm = 0; if (!app) return; labels(app); colours(app); }
  if (app && window.MutationObserver) new MutationObserver(function () { if (!tm) tm = setTimeout(pass, 120); }).observe(app, { childList: true, subtree: true });
})();

// অ্যাডমিন: ধাপ ০ ভাগ ৩ (০.১৩–০.১৮) — শেষ ট্যাব ও খোঁজার লেখা মনে রাখা, ফিল্টার-চিপ, না-সেভে সতর্কতা + "↩ খোলার সময়ের মানে ফিরুন",
// ট্যাবে লাল সংখ্যা/চিহ্ন (ব্যাজ), মোবাইলের জন্য বড় বাটন, প্রথমবারের গাইড-ট্যুর।
// SQL লাগে না (আগের RPC mc2_ac_admin_reports ও mc2_space_stats ৬০ সেকেন্ডে একবার পড়ে, ব্যর্থ হলে চুপ)। অন্য ফাইল বদলায় না।
// লোড-ক্রম: admin-ux.js-এর পরে, admin.js-এর আগে। সেটিং শুধু এই ব্রাউজারে: mc2_adm_tab, mc2_adm_q, mc2_adm_tour (নাম বদলাবেন না)।
(function () {
  "use strict";
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var app = document.querySelector("#app"), tabsEl = document.querySelector("#tabs"), view = document.querySelector("#view");
  if (!app || !tabsEl || !view) return;
  function cur() { var b = tabsEl.querySelector("button.on"); return b ? b.dataset.t : ""; }
  function go(k) { var b = tabsEl.querySelector('[data-t="' + k + '"]'); if (b) b.click(); }
  var SRCH = function (el) {
    if (!el || el.tagName !== "INPUT") return false;
    var t = (el.type || "text").toLowerCase(); if (t === "search") return true; if (t !== "text") return false;
    return /🔎|খুঁজ|খোঁজ|সার্চ|search/i.test((el.placeholder || "") + " " + (el.getAttribute("aria-label") || ""));
  };
  var skey = function (el, i) { return el.id || el.dataset.f || el.placeholder || ("i" + i); };
  var searchInputs = function () { return [].filter.call(view.querySelectorAll("input"), SRCH); };

  var css = document.createElement("style");
  css.textContent =
    ".mcbd{display:inline-block;min-width:18px;margin-left:5px;padding:0 5px;border-radius:999px;background:#b3261e;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center;vertical-align:middle}" +
    "#mcChips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:10px}#mcChips:empty{display:none}#mcChips .ck{background:var(--card);color:var(--fg);border:1px solid var(--bd);border-radius:999px;padding:4px 10px;min-height:32px;font-weight:600}" +
    "#mcChips .dn{color:var(--red);font-weight:700}" +
    "#mcTour{position:fixed;left:8px;right:8px;bottom:78px;margin:auto;max-width:520px;z-index:65;background:var(--card);color:var(--fg);border:2px solid var(--o);border-radius:14px;padding:12px;display:grid;gap:8px;box-shadow:0 4px 16px #0007}" +
    ".mcHi{outline:3px solid var(--o)!important;outline-offset:3px;border-radius:10px}" +
    "@media(max-width:700px){button{min-height:44px}.tabs button{min-height:40px}input,select,textarea{min-height:44px;font-size:16px}#view{overflow-x:auto}#view table{display:block;overflow-x:auto;max-width:100%}#view img{max-width:100%;height:auto}.act button,.act a{min-height:44px}}";
  document.head.appendChild(css);

  // ---------- ০.১৬–০.১৭ ব্যাজ ----------
  var BD = { mod: 0 }, SPC = 0;
  function paintBadges() {
    [].forEach.call(tabsEl.querySelectorAll("[data-t]"), function (b) {
      var k = b.dataset.t, old = b.querySelector(".mcbd"); if (old) old.remove();
      var txt = "", ti = "";
      if (k === "mod" && BD.mod > 0) { txt = BD.mod >= 50 ? "৫০+" : bn(BD.mod); ti = txt + "টি রিপোর্ট অপেক্ষায়"; }
      else if ((k === "clean" || k === "bin") && SPC >= 80) { txt = "!"; ti = "জায়গা " + bn(Math.round(SPC)) + " শতাংশ ভরা"; }
      if (txt) { var s = document.createElement("span"); s.className = "mcbd"; s.textContent = txt; s.title = ti; b.appendChild(s); }
    });
  }
  var lastT = 0;
  function tick(force) {
    if (app.hidden || document.hidden || !window.MCA || !window.MCA.rpc) return;
    var n = Date.now(); if (!force && n - lastT < 15000) return; lastT = n;
    try {
      window.MCA.rpc("mc2_ac_admin_reports", { p_status: "open", p_limit: 50, p_offset: 0 }).then(function (L) { BD.mod = Array.isArray(L) ? L.length : 0; paintBadges(); }, function () {});
      window.MCA.rpc("mc2_space_stats", {}).then(function (S) { SPC = Math.max(+(S && S.db_pct) || 0, +(S && S.st_pct) || 0); paintBadges(); }, function () {});
    } catch (e) {}
  }
  setInterval(function () { tick(false); }, 60000);

  // ---------- ০.১৩ মনে রাখা ----------
  var QS = LS.get("mc2_adm_q", {}); if (!QS || typeof QS !== "object") QS = {};
  var restoredTab = false, lastTab = "", pendingQ = false;
  function restoreQ() {
    if (!pendingQ) return;
    var L = searchInputs(); if (!L.length) return;
    pendingQ = false;
    var m = QS[cur()]; if (!m) return;
    L.forEach(function (el, i) {
      var v = m[skey(el, i)];
      if (v && !el.value) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
    });
  }
  view.addEventListener("input", function (e) {
    if (!e.isTrusted || !SRCH(e.target)) return;
    var t = cur(), L = searchInputs(), i = L.indexOf(e.target);
    (QS[t] = QS[t] || {})[skey(e.target, i)] = e.target.value; LS.set("mc2_adm_q", QS);
  }, true);

  // ---------- ০.১৫ না-সেভে সতর্কতা + ফেরা ----------
  var orig = new WeakMap(), dirty = new Set(), bypass = false;
  var isField = function (el) { return el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !SRCH(el) && el.type !== "file" && el.type !== "button" && el.type !== "submit" && el.type !== "password"; };
  var val = function (el) { return el.type === "checkbox" || el.type === "radio" ? el.checked : el.value; };
  var SAVE = /সেভ|সংরক্ষণ/;
  function formView() { return [].some.call(view.querySelectorAll("button"), function (b) { return SAVE.test(b.textContent) && !b.disabled; }); }
  function snap(e) { var el = e.target; if (isField(el) && !orig.has(el)) orig.set(el, val(el)); }
  view.addEventListener("focusin", snap, true); view.addEventListener("pointerdown", snap, true);
  function onEdit(e) {
    if (!e.isTrusted || !isField(e.target) || !formView()) return;
    var el = e.target; if (!orig.has(el)) return;
    if (val(el) !== orig.get(el)) dirty.add(el); else dirty.delete(el);
    chips();
  }
  view.addEventListener("input", onEdit, true); view.addEventListener("change", onEdit, true);
  view.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button");
    if (b && SAVE.test(b.textContent) && dirty.size) { dirty.clear(); orig = new WeakMap(); setTimeout(chips, 0); }
  }, true);
  window.addEventListener("beforeunload", function (e) { clean(); if (dirty.size) { e.preventDefault(); e.returnValue = ""; } });
  function clean() { dirty.forEach(function (el) { if (!el.isConnected) dirty.delete(el); }); }
  function undo() {
    dirty.forEach(function (el) {
      var o = orig.get(el);
      if (el.type === "checkbox" || el.type === "radio") el.checked = !!o; else el.value = o;
      el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    dirty.clear(); chips();
  }
  tabsEl.addEventListener("click", function (e) {
    clean(); if (bypass || !dirty.size) return;
    var b = e.target.closest && e.target.closest("[data-t]"); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    dlg("⚠️ সেভ-না-করা বদল আছে", "এই পাতায় আপনার বদল সেভ হয়নি। এখন অন্য পাতায় গেলে সেগুলো চলে যাবে।", "↩ বদল ফেলে যান", function () { dirty.clear(); orig = new WeakMap(); bypass = true; try { b.click(); } finally { bypass = false; } });
  }, true);
  function dlg(title, txt, yesLabel, yes) {
    var old = document.querySelector("#mcDlg"); if (old) old.remove();
    var d = document.createElement("div"); d.id = "mcDlg";
    var box = document.createElement("div"); box.className = "b"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); d.appendChild(box);
    var h = document.createElement("h3"); h.style.margin = "0"; h.textContent = title; box.appendChild(h);
    var p = document.createElement("div"); p.textContent = txt; box.appendChild(p);
    var a = document.createElement("div"); a.className = "act"; box.appendChild(a);
    var no = document.createElement("button"); no.type = "button"; no.textContent = "থাকুন"; no.onclick = function () { d.remove(); };
    var ys = document.createElement("button"); ys.type = "button"; ys.className = "l"; ys.textContent = yesLabel; ys.onclick = function () { d.remove(); yes(); };
    a.appendChild(no); a.appendChild(ys); d.onclick = function (e) { if (e.target === d) d.remove(); };
    document.body.appendChild(d); no.focus();
  }

  // ---------- ০.১৪ ফিল্টার-চিপ + সেভ-না-করা বদলের লাইন ----------
  var chipsEl = document.createElement("div"); chipsEl.id = "mcChips"; view.insertAdjacentElement("beforebegin", chipsEl);
  function chips() {
    clean();
    var h = "", L = searchInputs();
    L.forEach(function (el, i) {
      if (el.value) { var s = document.createElement("span"); s.textContent = el.value.length > 24 ? el.value.slice(0, 24) + "…" : el.value; h += '<button type="button" class="ck" data-ck="' + i + '">🔎 ' + s.innerHTML + " ✕</button>"; }
    });
    if (dirty.size) h += '<span class="dn">⚠️ সেভ-না-করা বদল আছে</span><button type="button" class="s l" data-undo="1">↩ খোলার সময়ের মানে ফিরুন</button>';
    if (chipsEl.innerHTML !== h) chipsEl.innerHTML = h;
  }
  chipsEl.addEventListener("click", function (e) {
    var c = e.target.closest("[data-ck]"), u = e.target.closest("[data-undo]");
    if (c) { var el = searchInputs()[+c.dataset.ck]; if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); var t = cur(); if (QS[t]) { delete QS[t][skey(el, +c.dataset.ck)]; LS.set("mc2_adm_q", QS); } chips(); } }
    else if (u) undo();
  });
  view.addEventListener("input", function () { setTimeout(chips, 0); }, false);

  // ---------- ০.১৮ গাইড-ট্যুর ----------
  var TS = [
    ["#tabs", "ওপরের ট্যাবে চাপলে পাতা বদলায়। বাঁ পাশের রং দেখে কাজের ধরন বোঝা যায়।"],
    ["#mcBar", "এখানে খোলা পাতার ব্যাখ্যা আর ধাপ-ফিতা আছে।"],
    ["#mcQ", "যেকোনো পাতায় এই ? চাপলে সেই পাতার সাহায্য খোলে।"],
    ["#view", "এখানে পাতার কাজ হয়। মোছার আগে অ্যাডমিন আপনার কাছে নিশ্চিত করতে চাইবে।"],
    ["#tabs", "ট্যাবে লাল সংখ্যা বা ! দেখলে সেখানে নজর দেওয়া দরকার, যেমন অপেক্ষমাণ রিপোর্ট বা জায়গা ভরে আসা।"]
  ], ti = -1, tourEl = null;
  function hi(sel) { [].forEach.call(document.querySelectorAll(".mcHi"), function (x) { x.classList.remove("mcHi"); }); var t = sel && document.querySelector(sel); if (t) { t.classList.add("mcHi"); try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} } }
  function tourStop() { ti = -1; hi(null); if (tourEl) { tourEl.remove(); tourEl = null; } }
  function tourShow() {
    if (!tourEl) { tourEl = document.createElement("div"); tourEl.id = "mcTour"; tourEl.setAttribute("role", "dialog"); document.body.appendChild(tourEl); }
    tourEl.innerHTML = "";
    var t = document.createElement("div"); t.innerHTML = "<b>🎬 ট্যুর " + bn(ti + 1) + "/" + bn(TS.length) + "</b>"; tourEl.appendChild(t);
    var p = document.createElement("div"); p.textContent = TS[ti][1]; tourEl.appendChild(p);
    var a = document.createElement("div"); a.className = "act"; tourEl.appendChild(a);
    var mk = function (txt, cls, fn) { var b = document.createElement("button"); b.type = "button"; if (cls) b.className = cls; b.textContent = txt; b.onclick = fn; a.appendChild(b); };
    if (ti > 0) mk("← আগে", "l", function () { ti--; tourShow(); });
    mk(ti < TS.length - 1 ? "পরে →" : "✔ শেষ", "", function () { if (ti < TS.length - 1) { ti++; tourShow(); } else tourStop(); });
    mk("বাদ দিন", "l", tourStop);
    hi(TS[ti][0]);
  }
  function tourStart() { ti = 0; tourShow(); }
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-tour]")) tourStart(); });

  // ---------- ট্যাব তৈরি/বদলালে ----------
  if (window.MutationObserver) {
    new MutationObserver(function () {
      var c = cur(), saved = LS.get("mc2_adm_tab", "");
      if (!restoredTab) {
        restoredTab = true;
        if (saved && saved !== c && tabsEl.querySelector('[data-t="' + saved + '"]')) { go(saved); return; }
      }
      if (c !== lastTab) { lastTab = c; pendingQ = true; LS.set("mc2_adm_tab", c); tick(false); }
      paintBadges();
      // ট্যুর আর নিজে থেকে চালু হয় না; শুধু "ট্যুর" বাটন (data-tour) চাপলে চলে।
    }).observe(tabsEl, { childList: true });
    new MutationObserver(function () { clearTimeout(view.__mk); view.__mk = setTimeout(function () { restoreQ(); chips(); }, 150); }).observe(view, { childList: true, subtree: true });
  }
})();

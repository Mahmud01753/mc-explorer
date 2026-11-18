// ভাসমান 🔎 সার্চ বাটন (ভাগ ৪): লম্বা ফিল্টার-পেজে ওপরের সার্চ বাটন পর্যন্ত স্ক্রল না করেই চাপা যায়।
// • সাইট: লিডারবোর্ড (#board) পেজে ফিল্টার খোলা থাকলে (বাটন #lfs দৃশ্যমান) — চাপলে #lfs.click()।
// • অ্যাডমিন: সব ট্যাবে একটাই জেনেরিক বাটন — বর্তমান ভিউর (#view) প্রথম দৃশ্যমান সার্চ বাটনে .click()। ট্যাব/ভিউ বদলালে নিজে আপডেট; সার্চ বাটন না থাকলে লুকায়।
// স্বাবলম্বী ফাইল (নিজের স্টাইল নিজে যোগ করে)। না থাকলে বাকি কিছু বদলায় না। মূল সার্চ বাটন যেমন ছিল তেমনই থাকে।
(function () {
  "use strict";
  if (window.__mcFloatSearch) return; window.__mcFloatSearch = 1;
  var isAdmin = !!document.getElementById("tabs");
  // scroll-btn.js-এর ⬆⬇ (right:12px; bottom:84px; দুই বাটনে ≈৯২px) -এর ঠিক ওপরে বসে, তাই ওভারল্যাপ হয় না
  var st = document.createElement("style");
  st.textContent = "#mcfs{position:fixed;right:12px;bottom:calc(188px + env(safe-area-inset-bottom,0px));z-index:45;min-width:56px;min-height:56px;padding:0 20px;border:0;border-radius:30px;" +
    "background:linear-gradient(135deg,#ffb300 0%,#ff6f00 55%,#e53935 100%);color:#fff;font:800 17px/1 system-ui,sans-serif;letter-spacing:.2px;cursor:pointer;display:flex;align-items:center;gap:6px;" +
    "box-shadow:0 6px 18px rgba(229,57,53,.45),0 2px 6px rgba(0,0,0,.35);text-shadow:0 1px 2px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent}" +
    "#mcfs[hidden]{display:none}#mcfs:active{transform:scale(.95)}#mcfs span{font-size:22px;line-height:1}@media print{#mcfs{display:none}}";
  document.head.appendChild(st);
  var btn = document.createElement("button");
  btn.id = "mcfs"; btn.type = "button"; btn.hidden = true; btn.title = "সার্চ"; btn.setAttribute("aria-label", "সার্চ করুন");
  btn.innerHTML = "<span>🔎</span>সার্চ";
  document.body.appendChild(btn);

  function shown(el) { return !!(el && el.getClientRects().length && !el.hidden && !el.disabled); }
  var SKIP = "#mcfs,#mcChips,.ck,.cxm,.cxbtns,#mcTour,#mcbinbtn";
  var IDS = { fgo: 1, unS: 1, bdGo: 1, lfs: 1 }, ACT = { go: 1, bfgo: 1, cd_go: 1, sqs: 1, qs: 1 };
  // সার্চ-বাটন চেনার যুক্তি: জানা data-a/id, অথবা লেখায় 🔎 / খুঁজুন / সার্চ / ফিল্টার করুন / প্রয়োগ (বন্ধ/ক্লিক/মুছুন-ধরনের বাটন বাদ)
  function isSearchBtn(b) {
    if (b.closest(SKIP)) return false;
    var t = (b.textContent || "").trim();
    if (/বন্ধ|ক্লিক|✕|✖|মুছ|রিসেট/.test(t)) return false;
    if (IDS[b.id] || ACT[b.dataset.a] || b.dataset.p === "apply") return true;
    return /🔎|খুঁজুন|সার্চ|ফিল্টার করু|প্রয়োগ/.test(t);
  }
  function target() {
    var l = document.getElementById("lfs");
    if (l && shown(l)) return l; // লিডারবোর্ড: ফিল্টার খোলা থাকলে
    if (!isAdmin) return null;
    var v = document.getElementById("view"); if (!v) return null;
    var bs = v.querySelectorAll("button"), i;
    for (i = 0; i < bs.length; i++) if (shown(bs[i]) && isSearchBtn(bs[i])) return bs[i];
    return null;
  }
  function upd() { var h = !target(); if (btn.hidden !== h) btn.hidden = h; }
  var tm = 0; function lazy() { if (tm) return; tm = setTimeout(function () { tm = 0; upd(); }, 120); }
  btn.onclick = function () { var t = target(); if (t) t.click(); else upd(); };
  if (window.MutationObserver) new MutationObserver(lazy).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "style", "class", "disabled"] });
  window.addEventListener("hashchange", lazy); document.addEventListener("click", lazy, true); window.addEventListener("resize", lazy);
  upd();
})();

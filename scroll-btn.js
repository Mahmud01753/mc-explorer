// ভাসমান ⬆ / ⬇ বাটন: পেজ লম্বা হলে এক ট্যাপে একদম ওপরে বা নিচে যাওয়া। অ্যাডমিন ও সাইট — দুই জায়গাতেই লোড হয়।
// স্বাবলম্বী ফাইল (নিজের স্টাইল নিজে যোগ করে); না থাকলে বাকি কিছু বদলায় না।
(function () {
  "use strict";
  if (window.__mcScrollBtn) return; window.__mcScrollBtn = 1;
  var st = document.createElement("style");
  st.textContent = ".mcsj{position:fixed;right:12px;bottom:84px;z-index:40;display:flex;flex-direction:column;gap:8px}" +
    ".mcsj button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:rgba(20,60,40,.88);color:#fff;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);padding:0;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}" +
    ".mcsj button[hidden]{display:none}.mcsj button:active{transform:scale(.94)}@media print{.mcsj{display:none}}";
  document.head.appendChild(st);
  var w = document.createElement("div"), up = document.createElement("button"), dn = document.createElement("button");
  w.className = "mcsj"; w.setAttribute("aria-label", "পেজে ওঠানামা");
  up.type = dn.type = "button"; up.textContent = "⬆"; dn.textContent = "⬇";
  up.setAttribute("aria-label", "একদম ওপরে যান"); dn.setAttribute("aria-label", "একদম নিচে যান"); up.title = "ওপরে"; dn.title = "নিচে";
  w.appendChild(up); w.appendChild(dn);
  function H() { var d = document.documentElement, b = document.body; return Math.max(d.scrollHeight, b ? b.scrollHeight : 0); }
  function upd() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0, vh = window.innerHeight || 600, h = H();
    // ইউজারদের সাইটে শুধু লিডারবোর্ড (#board) পেজে; অ্যাডমিনে (ট্যাব-সারি আছে) সব পেজে
    var ok = !!document.getElementById("tabs") || location.hash === "#board";
    if (!ok) { w.style.display = "none"; return; }
    up.hidden = y < 300; dn.hidden = h - (y + vh) < 300; w.style.display = (up.hidden && dn.hidden) ? "none" : "flex";
  }
  up.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  dn.onclick = function () { window.scrollTo({ top: H(), behavior: "smooth" }); };
  var t = 0; function lazy() { if (t) return; t = setTimeout(function () { t = 0; upd(); }, 120); }
  window.addEventListener("scroll", lazy, { passive: true }); window.addEventListener("resize", lazy); window.addEventListener("hashchange", lazy);
  if (window.MutationObserver) new MutationObserver(lazy).observe(document.documentElement, { childList: true, subtree: true });
  function init() { document.body.appendChild(w); upd(); }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();

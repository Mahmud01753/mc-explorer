// MC Explorer — অ্যাডমিনের প্রিভিউ-জানালায় ছবি জুম (২০২৬-১২-২০; নতুন SQL নেই)।
// দুই আঙুলে পিঞ্চ = জুম (১×–৬×), জুম করা অবস্থায় এক আঙুলে টেনে ঘোরানো, ডাবল-ট্যাপে বড়/ছোট, কম্পিউটারে Ctrl+স্ক্রল; জুমে ওপরে ডানে "⟲ ১×" বাটন।
// জুম না করা অবস্থায় এক আঙুলে ওপর-নিচ টানলে জানালা আগের মতোই স্ক্রল হয়।
// যেসব ছবিতে নিজে থেকে বসে: শিট (#shI), কার্ড-প্রিভিউ (#cxP), পোস্টার (#pi), সোশ্যাল কার্ড (#scImg) এবং data-zoom লেখা যেকোনো <img>।
(function () {
  var SEL = "#shI,#cxP,#pi,#scImg,img[data-zoom]", MAX = 6;
  if (!document.getElementById("zmCss")) {
    var st = document.createElement("style"); st.id = "zmCss";
    st.textContent = ".zmw{position:relative;display:block;width:fit-content;max-width:100%;margin-left:auto;margin-right:auto;justify-self:center;overflow:hidden;line-height:0;touch-action:pan-y;border-radius:inherit}.zmw img{display:block;transform-origin:0 0;-webkit-user-drag:none;user-select:none;-webkit-user-select:none}.zmw .zmr{position:absolute;top:6px;right:6px;z-index:2;line-height:1.2;font-size:12px;padding:3px 9px;border-radius:999px;border:0;background:rgba(0,0,0,.65);color:#fff;cursor:pointer}.zmw .zmr[hidden]{display:none}";
    document.head.appendChild(st);
  }
  function attach(img) {
    if (!img || img.__zm || !img.parentNode) return; img.__zm = 1;
    var w = document.createElement("div"); w.className = "zmw"; img.parentNode.insertBefore(w, img); w.appendChild(img);
    var rb = document.createElement("button"); rb.type = "button"; rb.className = "zmr"; rb.hidden = true; rb.textContent = "⟲ ১×"; w.appendChild(rb);
    img.draggable = false;
    var s = 1, tx = 0, ty = 0, P = {}, pin = null, pan = null, tap = { t: 0, x: 0, y: 0 };
    function dims() { return { W: img.clientWidth || w.clientWidth, H: img.clientHeight || w.clientHeight }; }
    function apply() {
      var d = dims(); s = Math.max(1, Math.min(MAX, s));
      if (s === 1) { tx = 0; ty = 0; } else { tx = Math.min(0, Math.max(d.W - d.W * s, tx)); ty = Math.min(0, Math.max(d.H - d.H * s, ty)); }
      img.style.transform = s === 1 ? "" : "translate(" + tx + "px," + ty + "px) scale(" + s + ")";
      w.style.touchAction = s > 1 ? "none" : "pan-y"; rb.hidden = s <= 1;
    }
    function rel(e) { var r = w.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function zoomAt(p, ns) { var ox = (p.x - tx) / s, oy = (p.y - ty) / s; s = Math.max(1, Math.min(MAX, ns)); tx = p.x - ox * s; ty = p.y - oy * s; apply(); }
    function ids() { return Object.keys(P); }
    w.addEventListener("pointerdown", function (e) {
      if (e.target === rb) return;
      P[e.pointerId] = rel(e); try { w.setPointerCapture(e.pointerId); } catch (x) {}
      var k = ids();
      if (k.length === 2) { var a = P[k[0]], b = P[k[1]], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; pin = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: s, ox: (m.x - tx) / s, oy: (m.y - ty) / s }; pan = null; e.preventDefault(); }
      else if (k.length === 1 && s > 1) { pan = { x: P[k[0]].x, y: P[k[0]].y, tx: tx, ty: ty }; }
    });
    w.addEventListener("pointermove", function (e) {
      if (!P[e.pointerId]) return; P[e.pointerId] = rel(e); var k = ids();
      if (k.length >= 2 && pin) {
        var a = P[k[0]], b = P[k[1]], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        s = Math.max(1, Math.min(MAX, pin.s * d / pin.d)); tx = m.x - pin.ox * s; ty = m.y - pin.oy * s; apply(); e.preventDefault();
      } else if (k.length === 1 && pan && s > 1) { var p = P[k[0]]; tx = pan.tx + (p.x - pan.x); ty = pan.ty + (p.y - pan.y); apply(); e.preventDefault(); }
    });
    function up(e) {
      var was = P[e.pointerId]; delete P[e.pointerId]; var k = ids(); pin = null;
      if (k.length === 1 && s > 1) pan = { x: P[k[0]].x, y: P[k[0]].y, tx: tx, ty: ty }; else pan = null;
      if (e.type === "pointerup" && was && !k.length && e.pointerType !== "mouse") { // ডাবল-ট্যাপ
        var now = Date.now(); if (now - tap.t < 320 && Math.hypot(was.x - tap.x, was.y - tap.y) < 28) { if (s > 1) { s = 1; apply(); } else zoomAt(was, 2.6); tap.t = 0; } else tap = { t: now, x: was.x, y: was.y };
      }
    }
    w.addEventListener("pointerup", up); w.addEventListener("pointercancel", up);
    w.addEventListener("dblclick", function (e) { if (e.target === rb) return; var p = rel(e); if (s > 1) { s = 1; apply(); } else zoomAt(p, 2.6); });
    w.addEventListener("wheel", function (e) { if (!e.ctrlKey && s === 1) return; e.preventDefault(); zoomAt(rel(e), s * (e.deltaY < 0 ? 1.18 : 1 / 1.18)); }, { passive: false });
    rb.addEventListener("click", function (e) { e.stopPropagation(); s = 1; apply(); });
    img.addEventListener("load", function () { s = 1; apply(); }); // নতুন ছবি এলে ১×-এ ফেরে
  }
  function scan() { Array.prototype.forEach.call(document.querySelectorAll(SEL), attach); }
  var raf = 0; function sched() { if (!raf) raf = (window.requestAnimationFrame || setTimeout)(function () { raf = 0; scan(); }); }
  try { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes && ms[i].addedNodes.length) { sched(); return; } }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  scan();
  window.MCZoom = { attach: attach };
})();

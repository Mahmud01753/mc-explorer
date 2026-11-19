// হোমের হেডার: বামে লোগো + ডানে হলুদ স্টিকারে ডোমেইন (ভাসমান, নড়ে) + নাম থেকে ঝরা ফুলঝুরির আলো।
// শুধু হোমে (#home বা ফাঁকা) চলে; অন্য পাতায় থামে। reduced-motion এ ফুলঝুরি ও নড়াচড়া বন্ধ।
(function () {
  var hh = document.getElementById("hh"), cv = document.getElementById("hsp"), dm = document.getElementById("hdm");
  if (!hh || !cv || !dm) return;
  var body = document.body, hd = hh.parentNode, ctx = cv.getContext("2d"), P = [], raf = 0, last = 0, W = 0, H = 0, dpr = 1, T0 = 0;
  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  function domain() {
    var C = window.MC_CFG || {}, s = C.siteUrl || "";
    if (!s && /^https?:/.test(location.protocol)) s = location.hostname;
    s = String(s).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[\/?#].*$/, ""); if (s) s = "www." + s;
    return s || "MC Explorer";
  }
  function ver() { // ডিজাইন A/B: ?hb=A|B (ওই ব্রাউজারে মনে থাকে) নইলে config.js brandVer, নইলে A
    var v = "", m = /[?&]hb=([abAB])/.exec(location.search || "");
    try { if (m) localStorage.setItem("mc2_hb", m[1].toUpperCase()); v = localStorage.getItem("mc2_hb") || ""; } catch (e) {}
    if (!m && !v) v = String((window.MC_CFG || {}).brandVer || "A").toUpperCase();
    v = v === "B" ? "B" : "A";
    body.classList.toggle("hbA", v === "A"); body.classList.toggle("hbB", v === "B");
  }
  function top() { // "MC Explorer" লেখার সর্বোচ্চ আকার (px): config.js brandSize (ডিফল্ট ৪২); ঠিকানায় ?hs=৩৬ দিলে ওই ব্রাউজারে মনে থাকে (?hs=0 = মুছে ডিফল্ট)
    var m = /[?&]hs=(\d+)/.exec(location.search || ""), v = 0;
    try { if (m) { if (+m[1] > 0) localStorage.setItem("mc2_hs", m[1]); else localStorage.removeItem("mc2_hs"); } v = +(localStorage.getItem("mc2_hs") || 0); } catch (e) {}
    if (!(v > 0)) v = +(window.MC_CFG || {}).brandSize || 42;
    return Math.max(22, Math.min(80, Math.round(v)));
  }
  function fit() { // "Explorer" ৬৮px (আগের ১৭px-এর ৪ গুণ) থেকে শুরু; জায়গা না হলে আগে স্টিকার (২৬→১৩px), তারপর ব্র্যান্ড (৬৮→৩৬px) ছোট হয়
    var b1 = hh.querySelector(".hb1"), b2 = hh.querySelector(".hb2"), box = dm.parentNode, lg = hh.querySelector(".hlogo"),
        av = hd.clientWidth - 36, lw = (lg ? lg.offsetWidth + 12 : 0), fs = 26, bs = top(), b1s = Math.round(bs * .76), b2s = Math.round(bs * .53);
    function set() { dm.style.fontSize = fs + "px"; hh.style.setProperty("--hb", bs + "px"); }
    function sw() { return box.offsetWidth - dm.offsetWidth + dm.scrollWidth; } // স্টিকারের আসল (না-কাটা) চওড়া
    function r1() { return lw + (b1 ? b1.offsetWidth : 0) + 12 + sw(); } // ওপরের সারি: লোগো + MC + স্টিকার
    function r2() { return lw + (b2 ? b2.offsetWidth : 0); } // নিচের সারি: লোগো + Explorer
    dm.style.maxWidth = ""; set();
    while (bs > b1s && r2() > av) { bs -= 2; set(); }
    while (fs > 16 && r1() > av) { fs -= 1; set(); }
    while (bs > b2s && (r2() > av || r1() > av)) { bs -= 2; set(); }
    while (fs > 12 && r1() > av) { fs -= 1; set(); }
    dm.style.maxWidth = Math.max(70, av - lw - (b1 ? b1.offsetWidth : 0) - 12 - (box.offsetWidth - dm.offsetWidth)) + "px";
  }
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = hd.clientWidth; H = hd.clientHeight + 70;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function emit(x, y, n, hot) {
    for (var i = 0; i < n && P.length < 140; i++) {
      var a = Math.PI / 2 + (Math.random() - .5) * 1.7, sp = (hot ? 14 + Math.random() * 46 : 8 + Math.random() * 26); // নিচের দিকে ছোট ফুলকি
      P.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .6 + 6, life: 0, max: .35 + Math.random() * .5, w: .5 + Math.random() * .7, st: Math.random() < .1 });
    }
  }
  function col(t, a) { // সাদা → হলুদ → কমলা
    var r = 255, g = t < .3 ? 255 : t < .65 ? Math.round(255 - (t - .3) * 150) : Math.round(202 - (t - .65) * 260), b = t < .3 ? Math.round(230 - t * 500) : 40;
    return "rgba(" + r + "," + Math.max(60, g) + "," + Math.max(20, b) + "," + a + ")";
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (!last) last = ts; var dt = Math.min(.05, (ts - last) / 1000); last = ts; if (!T0) T0 = ts;
    var hr = hd.getBoundingClientRect(), tr = dm.getBoundingClientRect(), x0 = tr.left - hr.left, w = tr.width, y0 = tr.top - hr.top, h = tr.height;
    if (w < 4) return;
    var t = (ts - T0) / 1000, sw = (Math.sin(t * 1.9) + 1) / 2, hx = x0 + 4 + sw * (w - 8), hy = y0 + h + 3; // স্টিকারের লেখার নিচের কিনারা থেকে ফুলকি ঝরে
    emit(hx, hy, 2, true); emit(x0 + Math.random() * w, hy, 1, false);
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; ctx.lineCap = "round";
    var g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7 + Math.random() * 2);
    g.addColorStop(0, "rgba(255,255,240,.95)"); g.addColorStop(.35, "rgba(255,214,90,.55)"); g.addColorStop(1, "rgba(255,170,30,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 6.283); ctx.fill();
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i]; p.life += dt; if (p.life >= p.max || p.y > H) { P.splice(i, 1); continue; }
      p.vy += 260 * dt; p.vx *= .985; var px = p.x, py = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
      var k = p.life / p.max, al = (1 - k) * (p.st ? .6 + .4 * Math.sin(p.life * 60) : 1);
      ctx.beginPath(); ctx.moveTo(px - p.vx * .02, py - p.vy * .02); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "rgba(255,120,0," + (al * .75) + ")"; ctx.lineWidth = p.w + .9; ctx.stroke(); ctx.strokeStyle = col(k * .6, al); ctx.lineWidth = p.w; ctx.stroke();
      if (p.st) { ctx.fillStyle = col(k, al); ctx.fillRect(p.x - .7, p.y - .7, 1.5, 1.5); }
    }
    }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; P.length = 0; ctx.clearRect(0, 0, W, H); }
  function sync() {
    var h = location.hash.replace(/^#/, ""), home = h === "" || h === "home";
    body.classList.toggle("hm", home);
    if (!home) { stop(); return; }
    dm.textContent = domain(); ver(); size(); fit();
    if (!RM && !raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function refit() { if (body.classList.contains("hm")) fit(); }
  document.addEventListener("mcfontcss", refit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener("hashchange", sync); window.addEventListener("resize", function () { if (body.classList.contains("hm")) { size(); fit(); } });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else sync(); });
  document.addEventListener("mcfontcss", function () { if (body.classList.contains("hm")) fit(); });
  sync();
})();

// (২০২৬-১২-১৮: পোডিয়াম, অংশগ্রহণ-পরিসংখ্যান, বার্তা কার্ড, বহু-কলাম/গ্রুপ তালিকা যোগ)
// ✅ সোশ্যাল মিডিয়া টেমপ্লেট (পোস্ট ১০৮০×১৩৫০ · স্টোরি ১০৮০×১৯২০) আঁকার কোড — poster-draw.js / cards.js-এর ধরনে।
// কোনো সার্ভার-কল নেই, ডাটাবেসে কিছু লেখে/পড়ে না, সার্ভারে ছবি জমে না: সব ছবি ফোনের ক্যানভাসেই আঁকা হয়।
// ডিজাইন (রং/প্যাটার্ন) MCPoster.TH-এর ২০টি থেকে; poster-draw.js আগে লোড হতে হয় (না থাকলে ছোট ডিফল্ট ডিজাইন)।
// ⚠️ গোপনীয়তা: draw() শুধু নাম, বিভাগ, সেশন, স্কোর, র‍্যাংক (আর ঐচ্ছিক ছবি) নেয়। আইপি/ফোন/ডিভাইস নেওয়ার কোনো জায়গাই নেই।
(function () {
  if (window.MCSocial) return;
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var FAM = '"Hind Siliguri","Anek Bangla","Noto Sans Bengali","Nirmala UI","Bangla Sangam MN",sans-serif';
  var SIZE = { post: [1080, 1350], story: [1080, 1920], land: [1754, 1240] };   // land = শুধু সার্টিফিকেট (A4 আড়াআড়ি; ২× = ৩৫০৮×২৪৮০ = A4, ৩০০ ডিপিআই)
  var DEF_TH = [{ n: "ডিফল্ট সবুজ", bg: ["#0b3320", "#1d6b43", "#08261a"], ink: "#fff", acc: "#ffd666", acc2: "#7ee0a8", bd: ["#ffe9a6", "#e0a21b"], bi: "#4a2f00", pat: "rays", av: "c" }];
  var TH = function () { return (window.MCPoster && window.MCPoster.TH) || DEF_TH; };
  // ঊর্ধ্বতন সুইচ: false = ওই উপাদান আঁকা হয় না
  var ON_DEF = { logos: 1, photo: 1, title: 1, period: 1, name: 1, dept: 1, batch: 1, score: 1, rank: 1, more: 1, footer: 1 };
  var MON = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  var dFmt = function (d) { return bd(d.getDate()) + " " + MON[d.getMonth()]; };
  var dFmtY = function (d) { return dFmt(d) + " " + bd(d.getFullYear()); };

  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, t, maxW, size, wt, minS) { var s = size; do { c.font = wt + " " + s + "px " + FAM; s -= 2; } while (c.measureText(t).width > maxW && s > (minS || 16)); return s + 2; }
  function clip(c, t, maxW) { t = String(t == null ? "" : t); if (c.measureText(t).width <= maxW) return t; while (t.length > 1 && c.measureText(t + "…").width > maxW) t = t.slice(0, -1); return t + "…"; }
  function seeded(n) { var s = Math.max(1, n | 0); return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function star(c, x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } c.closePath(); c.fill(); }
  var li = function (s) { return new Promise(function (r) { if (!s) return r(null); var i = new Image(); i.onload = function () { r(i); }; i.onerror = function () { r(null); }; i.src = s; }); };

  // ---------- ব্যাকগ্রাউন্ড প্যাটার্ন (পোস্টারের মতোই, তবে উচ্চতা H আলাদা) ----------
  function pattern(c, T, rn, W, H, cy) {
    var i, x, y, k, p = T.pat; c.save();
    if (p === "rays" || p === "burst") { c.translate(W / 2, cy); var n = p === "rays" ? 18 : 24; for (i = 0; i < n; i++) { c.rotate(Math.PI * 2 / n); c.beginPath(); c.moveTo(0, 0); c.lineTo(-60, -H); c.lineTo(60, -H); c.closePath(); c.fillStyle = p === "rays" ? "rgba(255,214,102,.07)" : (i % 2 ? "rgba(255,255,255,.1)" : "rgba(255,255,255,0)"); c.fill(); } }
    else if (p === "diamond") { c.strokeStyle = T.acc; c.globalAlpha = .13; c.lineWidth = 2; for (x = -40; x < W + 80; x += 90) for (y = -40; y < H + 80; y += 90) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.strokeRect(-28, -28, 56, 56); c.restore(); } }
    else if (p === "stripes") { c.fillStyle = "rgba(255,255,255,.09)"; for (i = -4; i < 12; i++) { c.save(); c.translate(i * 190, 0); c.rotate(-.5); c.fillRect(0, -300, 80, H * 1.6); c.restore(); } }
    else if (p === "grid") { c.strokeStyle = T.acc; c.globalAlpha = .14; c.lineWidth = 1.5; for (i = 0; i <= W; i += 60) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, H); c.stroke(); } for (i = 0; i <= H; i += 60) { c.beginPath(); c.moveTo(0, i); c.lineTo(W, i); c.stroke(); } }
    else if (p === "dots") { c.fillStyle = "#fff"; c.globalAlpha = .1; for (x = 0; x < W; x += 44) for (y = 0; y < H; y += 44) { c.beginPath(); c.arc(x + (y / 44 % 2) * 22, y, ((x * y) % 7) + 3, 0, 7); c.fill(); } }
    else if (p === "stars") { for (i = 0; i < 60; i++) { c.fillStyle = i % 3 ? T.acc : "#fff"; c.globalAlpha = .12 + rn() * .28; star(c, rn() * W, rn() * H, 12 + rn() * 26); } }
    else if (p === "waves") { c.lineWidth = 3; for (k = 0; k < H / 55; k++) { c.strokeStyle = "rgba(255,255,255," + (.05 + k % 3 * .03) + ")"; c.beginPath(); for (x = 0; x <= W; x += 12) { y = 120 + k * 55 + Math.sin(x / 90 + k) * 18; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } }
    else if (p === "paper") { for (i = 0; i < 700; i++) { c.fillStyle = "rgba(90,60,20," + rn() * .07 + ")"; c.fillRect(rn() * W, rn() * H, 2, 2); } c.fillStyle = T.acc; c.globalAlpha = .9; c.fillRect(0, 0, W, 22); c.fillRect(0, H - 22, W, 22); }
    else if (p === "rings") { c.strokeStyle = T.acc; c.lineWidth = 2; for (i = 260; i < H; i += 70) { c.globalAlpha = Math.max(.05, .3 - i / 3600); c.beginPath(); c.arc(W / 2, cy, i, 0, 7); c.stroke(); } }
    else if (p === "bubbles" || p === "clouds") { c.strokeStyle = T.acc; c.fillStyle = "#fff"; c.lineWidth = 3; for (i = 0; i < 46; i++) { c.globalAlpha = p === "clouds" ? .22 : .08 + rn() * .14; c.beginPath(); c.arc(rn() * W, rn() * H, 14 + rn() * 60, 0, 7); p === "clouds" ? c.fill() : c.stroke(); } }
    else if (p === "checker") { c.fillStyle = "#000"; c.globalAlpha = .07; for (x = 0; x < W; x += 60) for (y = 0; y < H; y += 60) if ((x / 60 + y / 60) % 2 === 0) c.fillRect(x, y, 60, 60); }
    else if (p === "sparkle" || p === "cosmos") { for (i = 0; i < 90; i++) { c.fillStyle = i % 4 ? "#fff" : T.acc; c.globalAlpha = .2 + rn() * .6; x = rn() * W; y = rn() * H; k = 2 + rn() * 6; c.beginPath(); c.arc(x, y, k, 0, 7); c.fill(); } }
    else if (p === "lines") { c.strokeStyle = T.acc; c.globalAlpha = .1; c.lineWidth = 2; for (i = -H; i < W + H; i += 36) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); } }
    c.restore();
  }

  // ---------- সাধারণ আঁকার সহায়ক ----------
  function avatar(c, T, cx, cy, R, photo, name, ringW) {
    var g, i = [...String(name || "M")][0] || "M";
    c.save(); c.shadowColor = T.acc; c.shadowBlur = Math.round(R * .25); c.beginPath(); c.arc(cx, cy, R + ringW * 2, 0, 7); c.fillStyle = T.acc; c.fill(); c.restore();
    c.beginPath(); c.arc(cx, cy, R + ringW, 0, 7); c.fillStyle = "#fff"; c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
    if (photo) { var s = Math.max(2 * R / photo.width, 2 * R / photo.height); c.drawImage(photo, cx - photo.width * s / 2, cy - photo.height * s / 2, photo.width * s, photo.height * s); }
    else { g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, T.acc2); g.addColorStop(1, T.bg[0]); c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.fillStyle = "#fff"; c.font = "800 " + Math.round(R * 1.05) + "px " + FAM; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(i, cx, cy + R * .06); c.textBaseline = "alphabetic"; }
    c.restore();
  }
  function badge(c, T, cx, cy, r, txt) {
    var g = c.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, T.bd[0]); g.addColorStop(1, T.bd[1]);
    c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 14; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = g; c.fill(); c.restore();
    c.lineWidth = Math.max(3, r * .09); c.strokeStyle = "#fff"; c.stroke();
    c.fillStyle = T.bi; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 " + Math.round(r * (txt.length > 2 ? .8 : 1.05)) + "px " + FAM; c.fillText(txt, cx, cy + r * .06); c.textBaseline = "alphabetic";
  }
  function pill(c, T, cx, y, h, txt, size, wt, fillA, ink, minW) {
    c.font = wt + " " + size + "px " + FAM; var w = Math.max(minW || 0, c.measureText(txt).width + h * 1.1);
    c.fillStyle = fillA; rr(c, cx - w / 2, y, w, h, h / 2); c.fill(); c.fillStyle = ink; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, cx, y + h / 2 + size * .04); c.textBaseline = "alphabetic"; return w;
  }
  var panelFill = function (T) { return T.light ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.11)"; };
  var MEDAL = [null, ["#fff3b0", "#e0a21b", "#4a2f00"], ["#f4f6f8", "#aab4be", "#2b3238"], ["#f6d2ac", "#b9743a", "#3b1f08"]];
  function rankDot(c, T, cx, cy, r, rk) {
    var m = MEDAL[rk], g = c.createLinearGradient(0, cy - r, 0, cy + r);
    if (m) { g.addColorStop(0, m[0]); g.addColorStop(1, m[1]); } else { g.addColorStop(0, T.bd[0]); g.addColorStop(1, T.bd[1]); }
    c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.85)"; c.stroke();
    c.fillStyle = m ? m[2] : T.bi; c.textAlign = "center"; c.textBaseline = "middle"; var t = bd(rk); c.font = "800 " + Math.round(r * (t.length > 2 ? .78 : t.length > 1 ? .95 : 1.1)) + "px " + FAM; c.fillText(t, cx, cy + r * .06); c.textBaseline = "alphabetic";
  }


  // ---------- নতুন সহায়ক: লেখা ভাঁজ, সারির বাক্স, বহু-কলামের তালিকা ----------
  function wrapTxt(c, t, maxW, maxLines) {
    var out = [], paras = String(t == null ? "" : t).split(/\r?\n/), k;
    paras.forEach(function (pp) { var words = pp.split(/\s+/).filter(Boolean), cur = ""; if (!words.length) { out.push(""); return; } words.forEach(function (w) { var tt = cur ? cur + " " + w : w; if (!cur || c.measureText(tt).width <= maxW) cur = tt; else { out.push(cur); cur = w; } }); if (cur) out.push(cur); });
    if (out.length > maxLines) { out = out.slice(0, maxLines); k = out[maxLines - 1]; out[maxLines - 1] = clip(c, k + "…", maxW); }
    return out;
  }

  // ---------- মূল আঁকা ----------
  // S: { fmt: post|story, kind: announce|board|rank, d: ডিজাইন নম্বর, on: {সুইচ}, title, period, footer, pick: র‍্যাংক-কার্ডে কোন সারি }

  // হাতের সইয়ের মতো ইংরেজি নাম (স্ক্রিপ্ট ফন্ট; না পেলে cursive) + নিচে হালকা টান। admin.html-এ Google Fonts "Mr De Haviland"/"Great Vibes" লোড হয়
  var SIGF = '"Mr De Haviland","Great Vibes","Segoe Script","Snell Roundhand","Brush Script MT",cursive';
  function sigScript(c, t, x, y, w, u, col) {
    var m = /^(.*?\bby)\s+(.+)$/i.exec(t), l1 = m ? m[1] : "", l2 = m ? m[2] : t; // "Granted by MC Explorer" = ছোট "Granted by" + বড় "MC Explorer"
    c.save(); c.fillStyle = col; c.strokeStyle = col; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.globalAlpha = .93;
    var fs = Math.round(92 * u); c.font = "400 " + fs + "px " + SIGF;
    while (fs > 34 * u && c.measureText(l2).width > w * 1.2) { fs -= 4 * u; c.font = "400 " + Math.round(fs) + "px " + SIGF; }
    var tw = c.measureText(l2).width;
    c.translate(x, y - 26 * u); c.rotate(-.045);
    if (l1) { c.font = "400 " + Math.round(fs * .5) + "px " + SIGF; c.fillText(l1, -tw * .2, -fs * .72); c.font = "400 " + Math.round(fs) + "px " + SIGF; }
    c.fillText(l2, 0, 0);
    c.lineWidth = 3 * u; c.lineCap = "round"; c.beginPath(); c.moveTo(-tw * .46, 10 * u); c.bezierCurveTo(-tw * .2, 24 * u, tw * .18, 0, tw * .52, 12 * u); c.stroke();
    c.restore();
  }
  // ---------- সার্টিফিকেট (সনদ): ২৪টি ডিজাইন (০–৩ আগের ৪টি স্টাইল যেমন ছিল; ৩ = থিম-রং, ২০ ডিজাইন-বাছাই কাজ করে) ----------
  // pal: bg0,bg1 (পটভূমি) · ink (লেখা) · acc (সোনালি/মূল রেখা) · name (নামের রং) · band (ব্যান্ড/কোণার রং) · ac2 (দ্বিতীয় রেখা)
  // frame: dbl|tri|thick|brk|thin|none · deco: none|left|right|side2|topbot|diag|wave|circ|dots|gui|rays · tb: band|ribbon|"" (শিরোনামের ব্যান্ড/ফিতা) · seal: gold|ring|ribbon · lay: A (সিল মাঝে) | B (সিল ডানে)
  var CERTS = [
    { n: "ক্লাসিক সোনালি", pal: ["#FFFBEF", "#FBEFD0", "#2B2110", "#B8860B", "#0B3D2E", "#B8860B", "#D4AF37"], frame: "dbl", deco: "none", tb: "", seal: "gold", lay: "A" },
    { n: "আধুনিক সবুজ-ব্যান্ড", pal: ["#FFFFFF", "#F1F8F4", "#1B2B24", "#0B7A4B", "#0B3D2E", "#0B3D2E", "#D4AF37"], frame: "none", deco: "left", tb: "", seal: "gold", lay: "A" },
    { n: "সরল সাদা", pal: ["#FFFFFF", "#FFFFFF", "#222222", "#0B7A4B", "#111111", "#888888", "#0B7A4B"], frame: "thin", deco: "none", tb: "", seal: "ring", lay: "A" },
    { n: "থিম-রং (ডিজাইন বাছাই)", theme: 1, frame: "dbl", deco: "rays", tb: "", seal: "gold", lay: "A" },
    { n: "রয়্যাল নেভি", pal: ["#F4F7FE", "#E6ECFB", "#14213D", "#1F3A93", "#1F3A93", "#1F3A93", "#D4AF37"], frame: "tri", deco: "topbot", tb: "", seal: "gold", lay: "A" },
    { n: "সোনালি ফিতা", pal: ["#FFFBEF", "#F8EBC8", "#2B2110", "#B8860B", "#0B3D2E", "#0B5D3B", "#D4AF37"], frame: "dbl", deco: "none", tb: "ribbon", seal: "ribbon", lay: "A" },
    { n: "সবুজ মোটা বর্ডার", pal: ["#FFFFFF", "#F4FAF6", "#1B2B24", "#0B5D3B", "#0B3D2E", "#0B5D3B", "#D4AF37"], frame: "thick", deco: "none", tb: "", seal: "gold", lay: "A" },
    { n: "মেরুন ডান-ব্যান্ড", pal: ["#FFF9F5", "#F9ECE4", "#3A1A1F", "#C9A227", "#7A1F2B", "#7A1F2B", "#C9A227"], frame: "thin", deco: "right", tb: "", seal: "ring", lay: "B" },
    { n: "মেরুন কোণা-ব্র্যাকেট", pal: ["#FFFDF8", "#F6EEDC", "#3A1A1F", "#B8860B", "#7A1F2B", "#7A1F2B", "#B8860B"], frame: "brk", deco: "none", tb: "", seal: "ribbon", lay: "A" },
    { n: "টিল কোণা-ত্রিভুজ", pal: ["#FFFFFF", "#F0FAFA", "#173238", "#0E7C86", "#0B4F57", "#0E7C86", "#D4AF37"], frame: "none", deco: "diag", tb: "", seal: "gold", lay: "A" },
    { n: "সবুজ তরঙ্গ", pal: ["#FFFFFF", "#F2FAF5", "#1B2B24", "#0B7A4B", "#0B3D2E", "#0B7A4B", "#D4AF37"], frame: "thin", deco: "wave", tb: "", seal: "gold", lay: "B" },
    { n: "বেগুনি বৃত্ত-জলছাপ", pal: ["#FBF9FF", "#EFEAFB", "#241E4A", "#4B3F9E", "#2D2A6E", "#4B3F9E", "#D4AF37"], frame: "dbl", deco: "circ", tb: "", seal: "ring", lay: "A" },
    { n: "গাঢ় নীল-সোনালি", pal: ["#0B1F4B", "#071433", "#F3E7C0", "#D4AF37", "#F6D77A", "#D4AF37", "#D4AF37"], frame: "dbl", deco: "rays", tb: "", seal: "gold", lay: "A" },
    { n: "কালো-সোনালি", pal: ["#1a1a1a", "#050505", "#EEEEEE", "#D4AF37", "#F0C75E", "#D4AF37", "#D4AF37"], frame: "thick", deco: "none", tb: "", seal: "gold", lay: "A" },
    { n: "গোলাপি ব্র্যাকেট", pal: ["#FFF7FA", "#FDE8F0", "#3B1730", "#B03060", "#8E1F4C", "#B03060", "#D4AF37"], frame: "brk", deco: "dots", tb: "", seal: "ribbon", lay: "A" },
    { n: "টিল ডট-প্যাটার্ন", pal: ["#F5FCFB", "#E4F5F3", "#173238", "#0E7C86", "#0B4F57", "#0E7C86", "#D4AF37"], frame: "thin", deco: "dots", tb: "", seal: "gold", lay: "B" },
    { n: "বেগুনি গিলোশ", pal: ["#FBF8FF", "#EEE7FA", "#241E4A", "#6B46C1", "#3B2A7A", "#6B46C1", "#D4AF37"], frame: "dbl", deco: "gui", tb: "", seal: "ring", lay: "A" },
    { n: "সবুজ শীর্ষ-ব্যান্ড", pal: ["#FFFFFF", "#F4FAF6", "#1B2B24", "#0B7A4B", "#0B3D2E", "#0B5D3B", "#D4AF37"], frame: "none", deco: "topbot", tb: "band", seal: "gold", lay: "A" },
    { n: "কমলা দুই-পাশ", pal: ["#FFFDF9", "#FFF1DC", "#3A2410", "#E07B00", "#7A3E00", "#E07B00", "#D4AF37"], frame: "thin", deco: "side2", tb: "", seal: "ring", lay: "A" },
    { n: "নীল শীর্ষ-ব্যান্ড", pal: ["#FFFFFF", "#F2F6FD", "#14213D", "#1F3A93", "#1F3A93", "#1F3A93", "#D4AF37"], frame: "thin", deco: "none", tb: "band", seal: "ribbon", lay: "B" },
    { n: "সবুজ-সোনালি রয়্যাল", pal: ["#0B3D2E", "#06241b", "#FFF3D1", "#D4AF37", "#FFE08A", "#D4AF37", "#D4AF37"], frame: "tri", deco: "rays", tb: "", seal: "gold", lay: "A" },
    { n: "ফর্মাল ধূসর (বিশ্ববিদ্যালয়-ধাঁচ)", pal: ["#FFFFFF", "#F6F6F6", "#222222", "#0B3D2E", "#111111", "#444444", "#B8860B"], frame: "tri", deco: "none", tb: "", seal: "ring", lay: "B" },
    { n: "লাল বাম-ব্যান্ড", pal: ["#FFFFFF", "#FFF4F4", "#2B1212", "#B71C1C", "#8E1B1B", "#B71C1C", "#D4AF37"], frame: "thin", deco: "left", tb: "", seal: "gold", lay: "B" },
    { n: "ভিন্টেজ বাদামি", pal: ["#F6EBD3", "#E8D4A8", "#3B2A14", "#8B5A2B", "#5A3A12", "#8B5A2B", "#B8860B"], frame: "dbl", deco: "gui", tb: "", seal: "ribbon", lay: "A" }
  ];
  function wrapC(c, t, maxW, maxLines) {
    var out = [], words = String(t || "").split(/\s+/).filter(Boolean), cur = "";
    words.forEach(function (w) { var tt = cur ? cur + " " + w : w; if (!cur || c.measureText(tt).width <= maxW) cur = tt; else { out.push(cur); cur = w; } }); if (cur) out.push(cur);
    if (out.length > maxLines) { out = out.slice(0, maxLines); out[maxLines - 1] = clip(c, out[maxLines - 1] + "…", maxW); } return out;
  }
  function drawCert(S, who, logos, c, cv, W, H, T, on) {
    var idx = Math.max(0, Math.min(CERTS.length - 1, Math.floor(+S.cs || 0))), D = CERTS[idx], pl = D.theme ? [T.bg[0], T.bg[2], T.ink, T.acc, T.acc, T.acc, T.acc] : D.pal;
    var P = { bg0: pl[0], bg1: pl[1], ink: pl[2], acc: pl[3], name: pl[4], band: pl[5], ac2: pl[6] }, land = W > H, Hc = Math.min(H, W * 1.25), y0 = (H - Hc) / 2, u = Hc / 1350 * (land ? 1.12 : 1), g, i, k;
    var L = D.deco === "left" ? W * .06 : D.deco === "side2" ? W * .035 : 0, R = D.deco === "right" ? W * .06 : D.deco === "side2" ? W * .035 : 0, cx = (L + W - R) / 2, cw = W - L - R, Y = function (f) { return y0 + Hc * f; };
    var dark = /^#(0|1)/.test(P.bg0) && !/^#(F|E)/i.test(P.bg0);
    g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, P.bg0); g.addColorStop(1, P.bg1); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // সাজ (deco)
    c.save();
    if (D.deco === "rays") { c.globalAlpha = .07; c.fillStyle = dark ? "#fff" : P.acc; for (i = 0; i < 12; i++) { c.save(); c.translate(W / 2, H / 2); c.rotate(i * Math.PI / 12); c.fillRect(-16 * u, -H, 32 * u, H * 2); c.restore(); } }
    else if (D.deco === "left" || D.deco === "right" || D.deco === "side2") { var bw = D.deco === "side2" ? W * .035 : W * .06, xs0 = D.deco === "left" ? [0] : D.deco === "right" ? [W - bw] : [0, W - bw]; xs0.forEach(function (x) { g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.band); g.addColorStop(1, P.band); c.fillStyle = P.band; c.fillRect(x, 0, bw, H); c.fillStyle = P.ac2; c.fillRect(D.deco === "right" || (D.deco === "side2" && x > 0) ? x - 8 * u : x + bw, 0, 8 * u, H); }); }
    else if (D.deco === "topbot") { c.fillStyle = P.band; c.fillRect(0, 0, W, 34 * u); c.fillRect(0, H - 34 * u, W, 34 * u); c.fillStyle = P.ac2; c.fillRect(0, 34 * u, W, 6 * u); c.fillRect(0, H - 40 * u, W, 6 * u); }
    else if (D.deco === "diag") { [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(function (q) { c.fillStyle = P.band; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + q[2] * 300 * u, q[1]); c.lineTo(q[0], q[1] + q[3] * 300 * u); c.closePath(); c.fill(); c.fillStyle = P.ac2; c.beginPath(); c.moveTo(q[0] + q[2] * 300 * u, q[1]); c.lineTo(q[0] + q[2] * 330 * u, q[1]); c.lineTo(q[0], q[1] + q[3] * 330 * u); c.lineTo(q[0], q[1] + q[3] * 300 * u); c.closePath(); c.fill(); }); }
    else if (D.deco === "wave") { c.fillStyle = P.band; c.beginPath(); c.moveTo(0, H); for (i = 0; i <= W; i += 10) c.lineTo(i, H - 44 * u - Math.sin(i / W * Math.PI * 4) * 12 * u); c.lineTo(W, H); c.closePath(); c.fill(); c.globalAlpha = .6; c.fillStyle = P.ac2; c.beginPath(); c.moveTo(0, H); for (i = 0; i <= W; i += 10) c.lineTo(i, H - 24 * u - Math.sin(i / W * Math.PI * 4 + 1) * 10 * u); c.lineTo(W, H); c.closePath(); c.fill(); }
    else if (D.deco === "circ") { c.globalAlpha = .07; c.fillStyle = P.band; [[W * .12, H * .15, 300], [W * .9, H * .82, 380], [W * .55, H * .55, 520]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2] * u, 0, 7); c.fill(); }); }
    else if (D.deco === "dots") { c.globalAlpha = .13; c.fillStyle = P.band; for (var xx = 30 * u; xx < W; xx += 44 * u) for (var yy = 30 * u; yy < H; yy += 44 * u) { c.beginPath(); c.arc(xx, yy, 3.2 * u, 0, 7); c.fill(); } }
    else if (D.deco === "gui") { c.globalAlpha = .28; c.strokeStyle = P.band; c.lineWidth = 2 * u; [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (q) { for (k = 60; k <= 300; k += 20) { c.beginPath(); c.arc(q[0], q[1], k * u, 0, 7); c.stroke(); } }); }
    c.restore();
    // ফ্রেম
    c.strokeStyle = P.acc; c.fillStyle = P.acc;
    if (D.frame === "dbl") { c.lineWidth = 9 * u; c.strokeRect(L + 34 * u, 34 * u, cw - 68 * u, H - 68 * u); c.lineWidth = 2.5 * u; c.strokeRect(L + 58 * u, 58 * u, cw - 116 * u, H - 116 * u); [[L + 58 * u, 58 * u], [W - R - 58 * u, 58 * u], [L + 58 * u, H - 58 * u], [W - R - 58 * u, H - 58 * u]].forEach(function (q) { star(c, q[0], q[1], 20 * u); c.fill(); }); }
    else if (D.frame === "tri") { c.strokeStyle = P.band === P.acc ? P.acc : P.band; [[44, 10], [66, 4], [80, 2]].forEach(function (q) { c.lineWidth = q[1] * u; c.strokeRect(L + q[0] * u, q[0] * u, cw - 2 * q[0] * u, H - 2 * q[0] * u); }); c.strokeStyle = P.ac2; c.lineWidth = 3 * u; c.strokeRect(L + 55 * u, 55 * u, cw - 110 * u, H - 110 * u); }
    else if (D.frame === "thick") { c.strokeStyle = P.band; c.lineWidth = 26 * u; c.strokeRect(L + 26 * u, 26 * u, cw - 52 * u, H - 52 * u); c.strokeStyle = P.ac2; c.lineWidth = 3.5 * u; c.strokeRect(L + 62 * u, 62 * u, cw - 124 * u, H - 124 * u); }
    else if (D.frame === "brk") { c.lineWidth = 9 * u; var bl2 = 170 * u, ix = 40 * u; [[L + ix, ix, 1, 1], [W - R - ix, ix, -1, 1], [L + ix, H - ix, 1, -1], [W - R - ix, H - ix, -1, -1]].forEach(function (q) { c.beginPath(); c.moveTo(q[0] + q[2] * bl2, q[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + q[3] * bl2); c.stroke(); }); c.lineWidth = 2 * u; c.globalAlpha = .5; c.strokeRect(L + 62 * u, 62 * u, cw - 124 * u, H - 124 * u); c.globalAlpha = 1; }
    else if (D.frame === "thin") { c.lineWidth = 3 * u; c.globalAlpha = .6; c.strokeRect(L + 40 * u, 40 * u, cw - 80 * u, H - 80 * u); c.globalAlpha = 1; }
    // শিরোনামের ব্যান্ড/ফিতা
    var tcol = P.name, ocol = P.acc;
    if (D.tb === "band") { c.fillStyle = P.band; c.fillRect(0, y0, W, Hc * .285); c.fillStyle = P.ac2; c.fillRect(0, y0 + Hc * .285, W, 7 * u); tcol = "#FFFFFF"; ocol = P.ac2; }
    else if (D.tb === "ribbon") { var rw = cw * .46, ry = Y(.145), rh = Hc * .1; c.fillStyle = P.band; c.beginPath(); c.moveTo(cx - rw, ry); c.lineTo(cx + rw, ry); c.lineTo(cx + rw - 40 * u, ry + rh / 2); c.lineTo(cx + rw, ry + rh); c.lineTo(cx - rw, ry + rh); c.lineTo(cx - rw + 40 * u, ry + rh / 2); c.closePath(); c.fill(); c.strokeStyle = P.ac2; c.lineWidth = 3 * u; c.stroke(); tcol = "#FFFFFF"; }
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    var lh = 100 * u, lx0 = L + 64 * u;
    if (on.logos) { if (logos[0]) c.drawImage(logos[0], lx0, Y(.045), lh * logos[0].width / logos[0].height, lh); if (logos[1]) { var lw = lh * logos[1].width / logos[1].height; c.drawImage(logos[1], W - R - 64 * u - lw, Y(.045), lw, lh); } }
    c.fillStyle = ocol; c.font = "700 " + Math.round(30 * u) + "px " + FAM; c.fillText(String(S.top == null || String(S.top).trim() === "" ? "MC Explorer Challenge" : S.top), cx, Y(.105));
    var ttl = String(S.title == null ? "" : S.title).trim() || "অংশগ্রহণ সনদ"; c.fillStyle = tcol; fit(c, ttl, (D.tb === "ribbon" ? cw * .4 : cw * .62), (D.tb === "ribbon" ? 70 : 108) * u, "800", 36); c.fillText(ttl, cx, D.tb === "ribbon" ? Y(.2) : Y(.215));
    if (D.tb !== "ribbon") { c.fillStyle = D.tb === "band" ? P.ac2 : P.acc; rr(c, cx - 90 * u, Y(.245), 180 * u, 6 * u, 3 * u); c.fill(); }
    c.fillStyle = P.ink; c.globalAlpha = .85; c.font = "600 " + Math.round(34 * u) + "px " + FAM; c.fillText(String(S.lead || "এই মর্মে প্রত্যয়ন করা হচ্ছে যে"), cx, Y(.33)); c.globalAlpha = 1;
    var nm = who && on.name ? who.name : (who ? "" : "(তালিকা থেকে একজন বাছুন)");
    if (nm) { c.fillStyle = P.name; fit(c, nm, cw * .76, 118 * u, "800", 44); c.fillText(nm, cx, Y(.435)); c.strokeStyle = P.acc; c.lineWidth = 3 * u; c.globalAlpha = .8; c.beginPath(); c.moveTo(cx - cw * .3, Y(.46)); c.lineTo(cx + cw * .3, Y(.46)); c.stroke(); c.globalAlpha = 1; }
    var chips = []; if (who && on.dept && who.dept) chips.push(who.dept); if (who && on.batch && who.batch) chips.push(String(S.sesL == null || String(S.sesL).trim() === "" ? "সেশন" : S.sesL).trim() + " " + who.batch);
    if (chips.length) { c.font = "700 " + Math.round(32 * u) + "px " + FAM; c.fillStyle = P.acc; c.fillText(clip(c, chips.join("  ·  "), cw * .84), cx, Y(.52)); }
    var body = String(S.cbody || "").replace(/\{score\}/g, who && who.score != null && who.score !== "" ? bd(who.score) : "—").replace(/\{rank\}/g, who && who.rk != null && who.rk !== "" ? bd(who.rk) : "—").replace(/\{period\}/g, String(S.period || "").trim());
    c.fillStyle = P.ink; c.font = "600 " + Math.round(38 * u) + "px " + FAM; var bl = wrapC(c, body, cw * .72, 4), lhh = 62 * u; bl.forEach(function (ln, q) { c.fillText(ln, cx, Y(.60) + q * lhh); });
    // সিল + স্বাক্ষর
    var seal = null; if (who && on.rank && who.rk !== "" && who.rk != null) seal = [String(S.rankLbl || "র‍্যাংক"), bd(who.rk)]; else if (who && on.score && who.score != null && who.score !== "") seal = [String(S.scoreLbl || "স্কোর"), bd(who.score)];
    var B = D.lay === "B", sy = Y(.79), sr = 78 * u, sx = B ? cx + cw * .3 : cx, sl = cw * (B ? .17 : .2), sxs = B ? [cx - cw * .3, cx - cw * .06] : [cx - cw * .27, cx + cw * .27];
    if (seal) {
      if (D.seal === "ribbon") { c.fillStyle = P.band; [[-1, -.35], [1, .35]].forEach(function (q) { c.save(); c.translate(sx + q[0] * 34 * u, sy + sr * .6); c.rotate(q[1]); c.fillRect(-22 * u, 0, 44 * u, 64 * u); c.restore(); }); }
      if (D.seal === "ring") { c.fillStyle = dark ? "rgba(255,255,255,.08)" : "#FFFFFF"; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill(); c.strokeStyle = P.acc; c.lineWidth = 6 * u; c.beginPath(); c.arc(sx, sy, sr - 4 * u, 0, 7); c.stroke(); c.lineWidth = 2 * u; c.beginPath(); c.arc(sx, sy, sr - 16 * u, 0, 7); c.stroke(); c.fillStyle = P.acc; c.font = "700 " + Math.round(22 * u) + "px " + FAM; c.fillText(seal[0], sx, sy - 20 * u); fit(c, seal[1], sr * 1.3, 54 * u, "800", 20); c.fillText(seal[1], sx, sy + 34 * u); }
      else { g = c.createRadialGradient(sx - 20 * u, sy - 20 * u, 6, sx, sy, sr); g.addColorStop(0, "#fff3b0"); g.addColorStop(1, "#d99a14"); c.fillStyle = g; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill(); c.strokeStyle = "#8a5a00"; c.lineWidth = 3 * u; c.beginPath(); c.arc(sx, sy, sr - 9 * u, 0, 7); c.stroke(); c.fillStyle = "#4a2f00"; c.font = "700 " + Math.round(22 * u) + "px " + FAM; c.fillText(seal[0], sx, sy - 20 * u); fit(c, seal[1], sr * 1.3, 54 * u, "800", 20); c.fillText(seal[1], sx, sy + 34 * u); }
    } else { c.fillStyle = P.acc; star(c, sx, sy, 44 * u); c.fill(); }
    // স্বাক্ষর (২০২৬-১২-২০): বাম = দাগের ওপরে "এমসি এক্সপ্লোরার" + নিচে "আয়োজক"; ডান = দাগের ওপরে ইংরেজি হাতের-সইয়ের মতো নাম (S.sigName) + নিচে "MC Explorer" (আগে এখানে "অধ্যক্ষ" ছিল)
    var sg = [String(S.sig1 == null ? "আয়োজক" : S.sig1).trim(), String(S.sig2 == null ? "MC Explorer" : S.sig2).trim()], up1 = String(S.sup1 == null ? "এমসি এক্সপ্লোরার" : S.sup1).trim(), sgn = String(S.sigName || "").trim();
    c.strokeStyle = P.ink; c.lineWidth = 2.5 * u; c.fillStyle = P.ink;
    sg.forEach(function (t, q) {
      c.globalAlpha = .7; c.beginPath(); c.moveTo(sxs[q] - sl / 2, Y(.835)); c.lineTo(sxs[q] + sl / 2, Y(.835)); c.stroke(); c.globalAlpha = 1;
      if (t) { c.font = "600 " + Math.round(28 * u) + "px " + FAM; c.fillText(clip(c, t, sl * 1.1), sxs[q], Y(.866)); }
      if (q === 0 && up1) { c.font = "700 " + Math.round(32 * u) + "px " + FAM; c.fillText(clip(c, up1, sl * 1.1), sxs[0], Y(.835) - 16 * u); }
      if (q === 1 && sgn) sigScript(c, sgn, sxs[1], Y(.835), sl, u, P.ink);
    });
    var pt = String(S.period || "").trim(); c.fillStyle = P.ink; if (on.period && pt) { c.globalAlpha = .8; c.font = "600 " + Math.round(27 * u) + "px " + FAM; c.fillText(String(S.dlbl == null || String(S.dlbl).trim() === "" ? "তারিখ:" : S.dlbl).trim() + " " + clip(c, pt, cw * .5), cx, Y(.9)); c.globalAlpha = 1; }
    var sn = String(S.sno || "").trim(); if (sn) { c.globalAlpha = .8; c.textAlign = "left"; c.font = "600 " + Math.round(26 * u) + "px " + FAM; c.fillText(String(S.nlbl == null || String(S.nlbl).trim() === "" ? "সনদ নং:" : S.nlbl).trim() + " " + clip(c, sn, cw * .3), L + 90 * u, Y(.9)); c.textAlign = "center"; c.globalAlpha = 1; }
    var ft = String(S.footer == null ? "" : S.footer).trim(); if (on.footer && ft) { c.fillStyle = D.deco === "wave" || D.deco === "topbot" ? P.ink : P.acc; c.font = "700 " + Math.round(26 * u) + "px " + FAM; c.fillText(clip(c, ft, cw * .7), cx, Y(.928)); }
    return cv;
  }


  // ---------- ২০টি আধুনিক/সিনেম্যাটিক/UI-UX/মোশন-গ্রাফিক্স স্টাইল (সব টেমপ্লেটে কাজ করে; রং+পটভূমি+সাজ বদলায়) ----------
  function prng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function lin(c, W, H, st, x0, y0, x1, y1) { var g = c.createLinearGradient(x0 || 0, y0 || 0, x1 == null ? W : x1, y1 == null ? H : y1); st.forEach(function (q, i) { g.addColorStop(Array.isArray(q) ? q[0] : i / (st.length - 1), Array.isArray(q) ? q[1] : q); }); return g; }
  function blob(c, x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); }
  function bars(c, W, H, t, b) { c.fillStyle = "#000"; c.fillRect(0, 0, W, t); c.fillRect(0, H - b, W, b); }
  function vig(c, W, H, a) { var g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0," + a + ")"); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  function grain(c, W, H, R, n, a) { c.save(); c.globalAlpha = a; for (var i = 0; i < n; i++) { c.fillStyle = R() > .5 ? "#fff" : "#000"; c.fillRect(R() * W, R() * H, 2, 2); } c.restore(); }
  var STY = [
    { n: "গ্লাস UI", T: { bg: ["#0f2027", "#203a43", "#2c5364"], ink: "#fff", acc: "#ffe27a", acc2: "#9be7ff", bd: ["#ffffff", "#cfd8ff"], bi: "#1a1f4a", light: false }, p: function (c, W, H) { c.fillStyle = lin(c, W, H, ["#0f2027", "#203a43", "#2c5364"]); c.fillRect(0, 0, W, H); blob(c, W * .2, H * .18, 460, "#ff6ec4", .6); blob(c, W * .88, H * .38, 420, "#7873f5", .6); blob(c, W * .3, H * .88, 520, "#4ade80", .42); c.fillStyle = "rgba(255,255,255,.07)"; rr(c, 44, 44, W - 88, H - 88, 56); c.fill(); c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = 3; c.stroke(); } },
    { n: "নিয়ন সাইবার", T: { bg: ["#07040f", "#12082a", "#07040f"], ink: "#fff", acc: "#ff2bd6", acc2: "#00f0ff", bd: ["#00f0ff", "#ff2bd6"], bi: "#06021a", light: false }, p: function (c, W, H) { c.fillStyle = "#07040f"; c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(255,43,214,.28)"; c.lineWidth = 2; for (var i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(W / 2 + i * 40, H * .62); c.lineTo(W / 2 + i * 190, H); c.stroke(); } for (i = 0; i < 9; i++) { var y = H * .62 + Math.pow(i / 8, 2) * H * .38; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } blob(c, W / 2, H * .62, 520, "#7a00ff", .4); c.save(); c.shadowColor = "#00f0ff"; c.shadowBlur = 34; c.strokeStyle = "#00f0ff"; c.lineWidth = 6; rr(c, 30, 30, W - 60, H - 60, 24); c.stroke(); c.restore(); } },
    { n: "সিনেম্যাটিক টিল-অরেঞ্জ", T: { bg: ["#0b2a33", "#4a4a3a", "#e0792b"], ink: "#fff3e0", acc: "#ffb066", acc2: "#7fd6d6", bd: ["#ffd2a1", "#e0792b"], bi: "#2a1200", light: false }, p: function (c, W, H) { var R = prng(3); c.fillStyle = lin(c, W, H, ["#0b2a33", "#2a4f56", "#e0792b"], 0, 0, W, H); c.fillRect(0, 0, W, H); blob(c, W * .85, H * .15, 600, "#ffb066", .35); vig(c, W, H, .65); grain(c, W, H, R, 5000, .07); bars(c, W, H, 44, 100); } },
    { n: "ফিল্ম নুয়া (সাদা-কালো)", T: { bg: ["#1a1a1a", "#0a0a0a", "#000"], ink: "#f2f2f2", acc: "#e8d9a8", acc2: "#bbbbbb", bd: ["#f5ecd0", "#b9a76a"], bi: "#1a1608", light: false }, p: function (c, W, H) { var R = prng(5); c.fillStyle = lin(c, W, H, ["#2a2a2a", "#0a0a0a", "#000"], 0, 0, W, H); c.fillRect(0, 0, W, H); blob(c, 0, H * .1, 700, "#ffcf7a", .3); blob(c, W, H * .9, 600, "#7ab8ff", .15); vig(c, W, H, .8); grain(c, W, H, R, 7000, .09); bars(c, W, H, 44, 100); } },
    { n: "মোশন স্পিড-লাইন", T: { bg: ["#0a1a4a", "#1b3fb3", "#0a1a4a"], ink: "#fff", acc: "#ffe600", acc2: "#8fe3ff", bd: ["#fff27a", "#ffb400"], bi: "#2a1d00", light: false }, p: function (c, W, H) { var R = prng(7), i; c.fillStyle = lin(c, W, H, ["#0a1a4a", "#1b3fb3", "#0a1a4a"]); c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2, H / 2); c.rotate(-.35); for (i = 0; i < 70; i++) { var y = (R() - .5) * H * 1.6, x = (R() - .5) * W * 1.6, l = 200 + R() * 700; c.fillStyle = ["#ffffff", "#8fe3ff", "#ff5fa2", "#ffe600"][i % 4]; c.globalAlpha = .06 + R() * .2; c.fillRect(x, y, l, 3 + R() * 10); } c.restore(); c.globalAlpha = 1; } },
    { n: "গ্রেডিয়েন্ট মেশ (হালকা)", T: { bg: ["#fdfbfb", "#fdfbfb", "#fdfbfb"], ink: "#1c1b33", acc: "#6d4aff", acc2: "#d6336c", bd: ["#8b6bff", "#5a3bd6"], bi: "#ffffff", light: true }, p: function (c, W, H) { c.fillStyle = "#fdfbfb"; c.fillRect(0, 0, W, H); blob(c, W * .1, H * .1, 620, "#ffc3e1", .95); blob(c, W * .95, H * .3, 600, "#b8d4ff", .95); blob(c, W * .2, H * .85, 640, "#fff1b0", .95); blob(c, W * .9, H * .92, 560, "#c3f7e4", .95); } },
    { n: "নিওমরফিজম (সফট UI)", T: { bg: ["#e6e9f0", "#e6e9f0", "#e6e9f0"], ink: "#33384a", acc: "#3b6fe0", acc2: "#5a6b8f", bd: ["#6f9bff", "#3b6fe0"], bi: "#ffffff", light: true }, p: function (c, W, H) { c.fillStyle = "#e6e9f0"; c.fillRect(0, 0, W, H); c.save(); c.shadowColor = "rgba(255,255,255,.95)"; c.shadowOffsetX = -14; c.shadowOffsetY = -14; c.shadowBlur = 28; c.fillStyle = "#e6e9f0"; rr(c, 50, 50, W - 100, H - 100, 70); c.fill(); c.shadowColor = "rgba(150,160,185,.7)"; c.shadowOffsetX = 14; c.shadowOffsetY = 14; rr(c, 50, 50, W - 100, H - 100, 70); c.fill(); c.restore(); } },
    { n: "ব্রুটালিস্ট পপ", T: { bg: ["#ffe94d", "#ffe94d", "#ffe94d"], ink: "#111", acc: "#e5174b", acc2: "#111", bd: ["#111", "#111"], bi: "#ffe94d", light: true }, p: function (c, W, H) { c.fillStyle = "#ffe94d"; c.fillRect(0, 0, W, H); c.fillStyle = "#ff7ab8"; c.beginPath(); c.arc(W * .88, H * .1, 190, 0, 7); c.fill(); c.strokeStyle = "#111"; c.lineWidth = 10; c.stroke(); c.fillStyle = "#6ee7ff"; c.fillRect(-20, H * .72, 300, 300); c.strokeRect(-20, H * .72, 300, 300); c.fillStyle = "#111"; c.fillRect(30, 30, W - 60, 12); c.strokeStyle = "#111"; c.lineWidth = 14; c.strokeRect(24, 24, W - 48, H - 48); } },
    { n: "জ্যামিতিক ব্লক", T: { bg: ["#12214f", "#12214f", "#12214f"], ink: "#fff", acc: "#ffd166", acc2: "#06d6a0", bd: ["#ffd166", "#f4a100"], bi: "#2a1c00", light: false }, p: function (c, W, H) { c.fillStyle = "#12214f"; c.fillRect(0, 0, W, H); c.fillStyle = "#ff5e5b"; c.globalAlpha = .9; c.beginPath(); c.arc(0, 0, 330, 0, 7); c.fill(); c.fillStyle = "#ffd166"; c.beginPath(); c.moveTo(W, H); c.lineTo(W - 420, H); c.lineTo(W, H - 420); c.fill(); c.fillStyle = "#06d6a0"; c.beginPath(); c.arc(W, 0, 220, Math.PI / 2, Math.PI * 1.5); c.fill(); c.globalAlpha = 1; c.strokeStyle = "#fff"; c.globalAlpha = .35; c.lineWidth = 8; c.beginPath(); c.arc(0, H, 210, 0, 7); c.stroke(); c.globalAlpha = 1; } },
    { n: "হলোগ্রাফিক", T: { bg: ["#a1c4fd", "#fbc2eb", "#fad0c4"], ink: "#26204d", acc: "#7a3cff", acc2: "#c2188f", bd: ["#8e5cff", "#5b2bd6"], bi: "#ffffff", light: true }, p: function (c, W, H) { var R = prng(11), i; c.fillStyle = lin(c, W, H, ["#a1c4fd", "#c2e9fb", "#fbc2eb", "#a6c1ee", "#fad0c4"], 0, 0, W, H); c.fillRect(0, 0, W, H); for (i = 0; i < 46; i++) { c.fillStyle = "#fff"; c.globalAlpha = .4 + R() * .5; c.save(); c.translate(R() * W, R() * H); star(c, 0, 0, 6 + R() * 16); c.fill(); c.restore(); } c.globalAlpha = 1; } },
    { n: "ডার্ক ড্যাশবোর্ড UI", T: { bg: ["#0d1117", "#0d1117", "#0d1117"], ink: "#e6edf3", acc: "#3fb950", acc2: "#58a6ff", bd: ["#3fb950", "#238636"], bi: "#ffffff", light: false }, p: function (c, W, H) { c.fillStyle = "#0d1117"; c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 2; for (var x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (var y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.fillStyle = "#3fb950"; c.fillRect(0, 0, W, 8); blob(c, W, 0, 520, "#58a6ff", .22); [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]].forEach(function (q) { c.fillStyle = "#3fb950"; c.beginPath(); c.arc(q[0], q[1], 8, 0, 7); c.fill(); }); } },
    { n: "রেট্রো-ওয়েভ সানসেট", T: { bg: ["#2b0a4d", "#8b1d8b", "#ff6a88"], ink: "#fff", acc: "#ffd35a", acc2: "#ff9ee6", bd: ["#ffe08a", "#ff7a59"], bi: "#3a0a3a", light: false }, p: function (c, W, H) { c.fillStyle = lin(c, W, H, ["#2b0a4d", "#8b1d8b", "#ff6a88"], 0, 0, 0, H * .72); c.fillRect(0, 0, W, H); var sy = H * .55, g = lin(c, W, H, ["#ffe66d", "#ff4f9a"], 0, sy - 260, 0, sy + 260); c.fillStyle = g; c.beginPath(); c.arc(W / 2, sy, 260, Math.PI, 0); c.fill(); c.fillStyle = "#12002b"; c.fillRect(0, sy, W, H - sy); c.strokeStyle = "rgba(255,106,213,.55)"; c.lineWidth = 3; for (var i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(W / 2 + i * 30, sy); c.lineTo(W / 2 + i * 150, H); c.stroke(); } for (i = 1; i < 9; i++) { var y = sy + Math.pow(i / 8, 2) * (H - sy); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } } },
    { n: "হালকা UI কার্ড", T: { bg: ["#f5f7ff", "#f5f7ff", "#f5f7ff"], ink: "#1f2340", acc: "#5b47e0", acc2: "#d66efd", bd: ["#7a68ff", "#5b47e0"], bi: "#ffffff", light: true }, p: function (c, W, H) { c.fillStyle = "#f5f7ff"; c.fillRect(0, 0, W, H); blob(c, W, 0, 520, "#d66efd", .5); blob(c, 0, H, 560, "#6a5af9", .45); c.fillStyle = "rgba(255,255,255,.75)"; c.save(); c.shadowColor = "rgba(91,71,224,.25)"; c.shadowBlur = 40; c.shadowOffsetY = 16; rr(c, 44, 44, W - 88, H - 88, 48); c.fill(); c.restore(); } },
    { n: "কনফেটি মোশন", T: { bg: ["#1a0b3a", "#3b1a7a", "#1a0b3a"], ink: "#fff", acc: "#ffd23f", acc2: "#7df9ff", bd: ["#ffd23f", "#ff9f1c"], bi: "#2a1a00", light: false }, p: function (c, W, H) { var R = prng(13), i; c.fillStyle = lin(c, W, H, ["#1a0b3a", "#3b1a7a", "#1a0b3a"]); c.fillRect(0, 0, W, H); for (i = 0; i < 160; i++) { c.save(); c.translate(R() * W, R() * H); c.rotate(R() * 6.3); c.fillStyle = ["#ffd23f", "#ff5fa2", "#7df9ff", "#7affc7", "#ffffff"][i % 5]; c.globalAlpha = .55 + R() * .4; c.fillRect(0, 0, 10 + R() * 22, 5 + R() * 9); c.restore(); } c.globalAlpha = 1; } },
    { n: "স্টেজ স্পটলাইট", T: { bg: ["#050505", "#0b0b0b", "#050505"], ink: "#fff", acc: "#ffd666", acc2: "#ffffff", bd: ["#ffe08a", "#d9a21b"], bi: "#3a2800", light: false }, p: function (c, W, H) { c.fillStyle = "#050505"; c.fillRect(0, 0, W, H); [[W * .2, -.18], [W * .5, 0], [W * .8, .18]].forEach(function (q) { c.save(); c.translate(q[0], -40); c.rotate(q[1]); var g = lin(c, W, H, ["rgba(255,255,255,.34)", "rgba(255,255,255,0)"], 0, 0, 0, H * .9); c.fillStyle = g; c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineTo(300, H * 1.0); c.lineTo(-300, H * 1.0); c.closePath(); c.fill(); c.restore(); }); blob(c, W / 2, H * .96, 700, "#ffd666", .28); } },
    { n: "লিকুইড ব্লব", T: { bg: ["#ff7a18", "#e8334a", "#af002d"], ink: "#fff", acc: "#fff3b0", acc2: "#ffd6e0", bd: ["#fff3b0", "#ffc233"], bi: "#5a0a1a", light: false }, p: function (c, W, H) { var R = prng(17), i; c.fillStyle = lin(c, W, H, ["#ff7a18", "#e8334a", "#af002d"], 0, 0, W, H); c.fillRect(0, 0, W, H); for (i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "rgba(255,255,255,.12)" : "rgba(80,0,30,.18)"; c.beginPath(); var x = R() * W, y = R() * H, r = 160 + R() * 260; for (var a = 0; a <= 6.3; a += .3) { var rr2 = r * (1 + .18 * Math.sin(a * 3 + i)); c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); } } },
    { n: "টেক সার্কিট", T: { bg: ["#04140f", "#062a1f", "#04140f"], ink: "#d6ffe9", acc: "#37ff9b", acc2: "#00d4ff", bd: ["#37ff9b", "#00b86b"], bi: "#02150d", light: false }, p: function (c, W, H) { var R = prng(19), i; c.fillStyle = lin(c, W, H, ["#04140f", "#062a1f", "#04140f"]); c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(55,255,155,.32)"; c.fillStyle = "#37ff9b"; c.lineWidth = 3; for (i = 0; i < 26; i++) { var x = Math.round(R() * W / 40) * 40, y = Math.round(R() * H / 40) * 40; c.beginPath(); c.moveTo(x, y); for (var k = 0; k < 4; k++) { if (k % 2) y += (R() > .5 ? 1 : -1) * 40 * (1 + Math.floor(R() * 4)); else x += (R() > .5 ? 1 : -1) * 40 * (1 + Math.floor(R() * 4)); c.lineTo(x, y); } c.stroke(); c.globalAlpha = .7; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); c.globalAlpha = 1; } blob(c, W / 2, H * .45, 640, "#00d4ff", .12); } },
    { n: "প্যারালাক্স লেয়ার", T: { bg: ["#ff9a8b", "#ff6a88", "#6a0572"], ink: "#fff", acc: "#ffe29a", acc2: "#ffc2d1", bd: ["#ffe29a", "#ffb347"], bi: "#4a1030", light: false }, p: function (c, W, H) { c.fillStyle = lin(c, W, H, ["#ff9a8b", "#ff6a88", "#6a0572"], 0, 0, 0, H); c.fillRect(0, 0, W, H); [["#c94b8a", .70, 90], ["#9b3a9b", .78, 70], ["#6a2a8a", .86, 60], ["#3e1a66", .94, 40]].forEach(function (L2, k) { c.fillStyle = L2[0]; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 12) c.lineTo(x, H * L2[1] - Math.abs(Math.sin(x / 140 + k * 2)) * L2[2] - Math.sin(x / 60 + k) * 14); c.lineTo(W, H); c.closePath(); c.fill(); }); } },
    { n: "অরোরা", T: { bg: ["#020b1a", "#041a2e", "#020b1a"], ink: "#fff", acc: "#7affc7", acc2: "#b79cff", bd: ["#7affc7", "#2fc98f"], bi: "#022a1c", light: false }, p: function (c, W, H) { var R = prng(23), i; c.fillStyle = lin(c, W, H, ["#020b1a", "#041a2e", "#020b1a"]); c.fillRect(0, 0, W, H); for (i = 0; i < 120; i++) { c.fillStyle = "#fff"; c.globalAlpha = .2 + R() * .6; c.fillRect(R() * W, R() * H * .7, 2, 2); } c.globalAlpha = 1; [["#7affc7", .32], ["#b79cff", .22], ["#4de3ff", .26]].forEach(function (q, k) { for (var w = 110; w > 0; w -= 22) { c.strokeStyle = q[0]; c.globalAlpha = q[1] * (1 - w / 140) * .8; c.lineWidth = w; c.beginPath(); c.moveTo(-50, H * (.25 + k * .12)); c.bezierCurveTo(W * .3, H * (.05 + k * .1), W * .6, H * (.5 + k * .08), W + 50, H * (.22 + k * .1)); c.stroke(); } }); c.globalAlpha = 1; } },
    { n: "মনোক্রোম বোল্ড টাইপ", T: { bg: ["#f2f2f2", "#f2f2f2", "#f2f2f2"], ink: "#111", acc: "#ff3b30", acc2: "#111", bd: ["#111", "#333"], bi: "#ffffff", light: true }, p: function (c, W, H) { c.fillStyle = "#f2f2f2"; c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2, H * .55); c.rotate(-.18); c.strokeStyle = "rgba(0,0,0,.14)"; c.lineWidth = 6; c.font = "900 760px Arial,sans-serif"; c.textAlign = "center"; c.strokeText("MC", 0, 200); c.restore(); c.fillStyle = "#111"; c.fillRect(0, 0, W, 26); c.fillRect(0, H - 26, W, 26); c.fillStyle = "#ff3b30"; c.fillRect(0, 26, 220, 12); } }
  ];

  // rows: [{ rk, name, dept (দেখানোর লেখা), batch, score }] — photos: { "<সারি-সূচক>": Image } — logos: [Image|null, Image|null]
  function draw(S, rows, photos, logos, sc0) {
    var sz = SIZE[S.fmt] || SIZE.post, W = sz[0], H = sz[1], on = Object.assign({}, ON_DEF, S.on || {}), ths = TH(), T = ths[ths[S.d] ? S.d : 0] || ths[0];
    var K = Math.min(3, Math.max(1, +sc0 || 1)), cv = document.createElement("canvas"); cv.width = Math.round(W * K); cv.height = Math.round(H * K); var c = cv.getContext("2d"), g, i; c.scale(K, K);   // K = ডাউনলোডের স্কেল (১ = ১০৮০ চওড়া, ২ = ২১৬০); আঁকার মাপ একই, শুধু পিক্সেল বেশি
    rows = (rows || []).slice(0, 150).map(function (r, ri) { return { rk: r.rk, name: String(r.name || ""), dept: String(r.dept || ""), batch: String(r.batch || ""), score: r.score, extra: String(r.extra || ""), g: String(r.g || ""), _i: ri }; }); photos = photos || {}; logos = logos || [];
    if (S.kind === "cert") return drawCert(S, rows[Math.min(rows.length - 1, Math.max(0, +S.pick || 0))] || null, logos, c, cv, W, H, T, on);
    var story = S.fmt === "story", kind = S.kind || "announce", SL = String(S.scoreLbl == null ? "স্কোর" : S.scoreLbl).trim(), RL2 = String(S.rankLbl == null ? "র‍্যাংক" : S.rankLbl).trim();
    // পটভূমি (নতুন স্টাইল বাছা থাকলে সেটার পটভূমি; না হলে আগের ডিজাইন)
    var SY = +S.sty > 0 ? STY[Math.min(STY.length, Math.floor(+S.sty)) - 1] : null;
    // স্টাইল = নকশা/আকার; রঙ আসে বাছা "রঙের ডিজাইন" (T) থেকে। আগে SY.T পুরো T ঢেকে দিত, তাই ডিজাইন বদলালেও ছবি একই থাকত।
    if (SY) {
      g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(.5, T.bg[1]); g.addColorStop(1, T.bg[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      var sc2 = document.createElement("canvas"); sc2.width = W; sc2.height = H; SY.p(sc2.getContext("2d"), W, H);
      c.save(); c.globalCompositeOperation = "luminosity"; c.drawImage(sc2, 0, 0); c.restore();
      if (!!T.light !== !!SY.T.light) { c.fillStyle = T.light ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)"; c.fillRect(0, 0, W, H); }
      c.save(); c.globalAlpha = .3; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    }
    else {
    g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(.5, T.bg[1]); g.addColorStop(1, T.bg[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    var rn = seeded((rows.length ? rows[0].score || 0 : 0) * 7 + (rows.length) + 11), cyG = story ? 760 : 640; pattern(c, T, rn, W, H, cyG);
    g = c.createRadialGradient(W / 2, cyG, 40, W / 2, cyG, 620); g.addColorStop(0, T.light ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.14)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = T.acc; c.globalAlpha = .85; c.lineWidth = T.dbl ? 10 : 6; rr(c, 22, 22, W - 44, H - 44, T.pat === "paper" ? 8 : 34); c.stroke(); if (T.dbl) { c.lineWidth = 2; rr(c, 44, 44, W - 88, H - 88, 24); c.stroke(); } c.globalAlpha = 1;
    }
    // মাথা: লোগো · শিরোনাম · সময়কাল
    var y = 0, tx = String(S.title == null ? "" : S.title).trim(), pt = String(S.period == null ? "" : S.period).trim();
    if (on.logos) { if (logos[0]) c.drawImage(logos[0], 62, 56, 104 * logos[0].width / logos[0].height, 104); if (logos[1]) { var lw = 104 * logos[1].width / logos[1].height; c.drawImage(logos[1], W - 62 - lw, 56, lw, 104); } }
    c.textAlign = "center"; y = 118;
    if (on.title && tx) { c.fillStyle = T.acc; var ts = fit(c, tx, on.logos ? 640 : 900, story ? 84 : 76, "800", 30); c.fillText(tx, W / 2, y); y += 30; }
    else if (on.logos) y = 190; else y = 90;
    if (on.period && pt) { var psz = 32; c.font = "600 " + psz + "px " + FAM; var ph = 56; pill(c, T, W / 2, y + 14, ph, clip(c, pt, 860), psz, "600", T.light ? "rgba(0,0,0,.1)" : "rgba(0,0,0,.35)", T.ink); y += 14 + ph; }
    var top = Math.max(y + 30, on.logos ? 214 : 150), bot = H - (on.footer ? 150 : 90);
    // নিচের লাইন
    var ft = String(S.footer == null ? "" : S.footer).trim();
    if (on.footer && ft) { c.fillStyle = T.ink; c.globalAlpha = .92; fit(c, ft, 900, 32, "600", 18); c.fillText(clip(c, ft, 900), W / 2, H - 78); c.globalAlpha = 1; c.fillStyle = T.acc; rr(c, W / 2 - 70, H - 118, 140, 6, 3); c.fill(); }

    var chipsOf = function (r) { var a = []; if (on.score && r.extra) a.push(r.extra); if (on.dept && r.dept) a.push(r.dept); if (on.batch && r.batch) a.push(r.batch); return a; };
    var chipsRow = function (cy0, list, size) {
      if (!list.length) return 0; c.font = "600 " + size + "px " + FAM; var h = Math.round(size * 1.65), tw = list.map(function (t) { t = clip(c, t, 430); return c.measureText(t).width + h * .9; }), tot = tw.reduce(function (a, b) { return a + b; }, 0) + 16 * (list.length - 1), x = (W - tot) / 2;
      list.forEach(function (t, k) { c.fillStyle = panelFill(T); rr(c, x, cy0, tw[k], h, h / 2); c.fill(); c.strokeStyle = T.acc; c.globalAlpha = .55; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; c.fillStyle = T.ink; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(clip(c, t, 430), x + tw[k] / 2, cy0 + h / 2 + size * .04); c.textBaseline = "alphabetic"; x += tw[k] + 16; });
      return h;
    };
  // একটি সারি (বোর্ডের মতো দেখতে) — x,y,w,h জায়গায়
  var rowBox = function(c, T, on, r, x, y, w, h, photo, useAv, SL) {
    var mid = y + h / 2, tx0 = x + Math.min(22, h * .25), ar = Math.round(h * .34), sw = 0, sub, hasN, avail;
    c.fillStyle = panelFill(T); rr(c, x, y, w, h, h / 2.4); c.fill();
    if (typeof r.rk === "number" && r.rk <= 3 && r.rk >= 1) { c.strokeStyle = MEDAL[r.rk][1]; c.lineWidth = 3; c.globalAlpha = .9; c.stroke(); c.globalAlpha = 1; }
    if (on.rank && r.rk !== "" && r.rk != null) { rankDot(c, T, x + h / 2, mid, h * .34, r.rk); tx0 = x + h + 6; }
    if (useAv && on.photo) { avatar(c, T, tx0 + ar, mid, ar, photo || null, r.name, 3); tx0 += ar * 2 + 20; }
    if (on.score && r.score != null && r.score !== "") {
      var fs = Math.round(h * (w < 520 ? .3 : .34)); c.font = "800 " + fs + "px " + FAM; sw = c.measureText(bd(r.score)).width + Math.round(fs * 1.2);
      var g2 = c.createLinearGradient(0, mid - h * .24, 0, mid + h * .24); g2.addColorStop(0, T.bd[0]); g2.addColorStop(1, T.bd[1]); c.fillStyle = g2; rr(c, x + w - 18 - sw, mid - h * .24, sw, h * .48, h * .24); c.fill();
      c.fillStyle = T.bi; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(bd(r.score), x + w - 18 - sw / 2, mid + 2); c.textBaseline = "alphabetic"; sw += 12;
    }
    avail = x + w - 18 - sw - tx0; sub = chipsOf(r).join(" · "); hasN = on.name && r.name; c.textAlign = "left";
    if (avail < 30) return;
    if (hasN) { c.fillStyle = T.ink; var ns = fit(c, r.name, avail, Math.round(h * (sub ? .36 : .42)), "800", 14); c.fillText(clip(c, r.name, avail), tx0, sub ? mid - h * .02 : mid + ns * .34); }
    if (sub) { c.fillStyle = T.acc2 === T.ink ? T.acc : T.acc2; fit(c, sub, avail, Math.round(h * .24), "600", 11); c.fillText(clip(c, sub, avail), tx0, hasN ? mid + h * .27 : mid + h * .08); }
  };

    // বহু-কলামের তালিকা: items গ্রুপের তালিকা ([{h: লেখা}|{r: সারি}, …]); কলাম ও সারির উচ্চতা নিজে বেছে নেয়; ফেরত: বাদ পড়া সারির সংখ্যা
    var flowList = function (groups, x0, x1, y0, y1, photoOf) {
      var Hh = y1 - y0, gap = 12, gg = 22, hh = 52, tries = [124, 110, 96, 84, 72, 64], best = null, cols, k, rh, dropped = 0;
      var gH = function (g, rh2) { var s2 = 0; g.forEach(function (it, q) { s2 += (it.h != null ? hh : rh2) + (q ? gap : 0); }); return s2; };
      var pack = function (nc, rh2, force) {
        var out = [], cur = [], used = 0, i2, g, h, ex;
        for (i2 = 0; i2 < groups.length; i2++) {
          g = groups[i2]; h = gH(g, rh2); ex = cur.length ? gg : 0;
          if (h > Hh) { if (!force) return null; }
          if (used + ex + h > Hh && cur.length) { out.push(cur); cur = []; used = 0; ex = 0; if (out.length >= nc) { if (!force) return null; dropped += groups.length - i2; cur = null; break; } }
          if (h > Hh && force) { dropped += 1; continue; }
          cur.push(g); used += ex + h;
        }
        if (cur && cur.length) out.push(cur);
        return out;
      };
      for (cols = 1; cols <= 3 && !best; cols++) for (k = 0; k < tries.length && !best; k++) { var o = pack(cols, tries[k], false); if (o && o.length <= cols) best = { cols: cols, rh: tries[k], list: o }; }
      if (!best) { dropped = 0; var o2 = pack(3, 56, true); best = { cols: 3, rh: 56, list: o2 || [] }; }
      var cg = 22, cw = (x1 - x0 - (best.cols - 1) * cg) / best.cols, hasGrp = groups.some(function (g) { return g.some(function (it) { return it.h != null; }); });
      var tall = 0; best.list.forEach(function (colg) { var u = 0; colg.forEach(function (g, q) { u += gH(g, best.rh) + (q ? gg : 0); }); tall = Math.max(tall, u); });
      var ys = y0 + Math.max(0, (Hh - tall) / 2);
      best.list.forEach(function (colg, ci) {
        var cx = x0 + ci * (cw + cg), yy = ys;
        colg.forEach(function (g, q) {
          if (q) yy += gg;
          g.forEach(function (it, w2) {
            if (w2) yy += gap;
            if (it.h != null) { c.font = "800 " + Math.round(hh * .52) + "px " + FAM; var tw = Math.min(cw, c.measureText(it.h).width + hh * 1.1); var g3 = c.createLinearGradient(0, yy, 0, yy + hh); g3.addColorStop(0, T.bd[0]); g3.addColorStop(1, T.bd[1]); c.fillStyle = g3; rr(c, cx, yy, tw, hh, hh / 2); c.fill(); c.fillStyle = T.bi; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(clip(c, it.h, cw - hh * .8), cx + hh * .5, yy + hh / 2 + 2); c.textBaseline = "alphabetic"; yy += hh; }
            else { rowBox(c, T, on, it.r, cx, yy, cw, best.rh, photoOf ? photoOf(it.r) : null, best.cols === 1, SL); yy += best.rh; }
          });
        });
      });
      return dropped;
    };
    var mkGroups = function (list, grouped) {
      var gs = [], cur = null;
      list.forEach(function (r) { if (grouped) { if (!cur || cur.k !== r.g) { cur = { k: r.g, a: [{ h: r.g }] }; gs.push(cur); } cur.a.push({ r: r }); } else gs.push({ a: [{ r: r }] }); });
      return gs.map(function (g) { return g.a; });
    };
    var scoreTxt = function (r) { return r.score == null || r.score === "" ? "" : (SL ? SL + " " : "") + bd(r.score); };

    if (kind === "stats") {
      var SX = S.stats || {}, vals = SX.vals || ["", "", ""], lbs = SX.lbls || ["জন খেলেছে", "সেরা স্কোর", "গড় স্কোর"], Rb = story ? 250 : 215, tileH = 230, tg = 30, hasT = (vals[1] !== "" && vals[1] != null) || (vals[2] !== "" && vals[2] != null);
      var totH = (Rb * 2 + 60) + 90 + (hasT ? tg + tileH : 0), ys0 = top + Math.max(0, (bot - top - totH) / 2), cyS = ys0 + Rb + 30, vtxt = function (v) { return v === "" || v == null ? "—" : bd(String(v)); };
      c.save(); c.shadowColor = T.acc; c.shadowBlur = 40; c.beginPath(); c.arc(W / 2, cyS, Rb, 0, 7); c.fillStyle = panelFill(T); c.fill(); c.restore();
      c.lineWidth = 10; c.strokeStyle = T.acc; c.globalAlpha = .9; c.beginPath(); c.arc(W / 2, cyS, Rb, 0, 7); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = T.acc; c.textAlign = "center"; fit(c, vtxt(vals[0]), Rb * 2 - 90, story ? 300 : 260, "800", 60); c.textBaseline = "middle"; c.fillText(vtxt(vals[0]), W / 2, cyS + 10); c.textBaseline = "alphabetic";
      c.fillStyle = T.ink; c.font = "700 56px " + FAM; c.fillText(clip(c, lbs[0] || "", 900), W / 2, cyS + Rb + 84);
      if (hasT) {
        var tw2 = (W - 140 - tg) / 2, ty = ys0 + Rb * 2 + 60 + 90 + tg;
        [1, 2].forEach(function (q) {
          var tx2 = 70 + (q - 1) * (tw2 + tg); c.fillStyle = panelFill(T); rr(c, tx2, ty, tw2, tileH, 40); c.fill(); c.strokeStyle = T.acc; c.globalAlpha = .55; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1;
          c.textAlign = "center"; c.fillStyle = T.acc2 === T.ink ? T.acc : T.acc2; c.font = "700 34px " + FAM; c.fillText(clip(c, lbs[q] || "", tw2 - 40), tx2 + tw2 / 2, ty + 62);
          c.fillStyle = T.ink; fit(c, vtxt(vals[q]), tw2 - 50, 120, "800", 40); c.fillText(vtxt(vals[q]), tx2 + tw2 / 2, ty + 160);
          if (q === 1 && on.name && SX.bestWho) { c.fillStyle = T.ink; c.globalAlpha = .85; c.font = "600 27px " + FAM; c.fillText(clip(c, SX.bestWho, tw2 - 40), tx2 + tw2 / 2, ty + 205); c.globalAlpha = 1; }
        });
      }
      return cv;
    }
    if (kind === "msg") {
      var MX = S.msg || {}, mhd = String(MX.head || "").trim(), mbd = String(MX.body || "").trim(), mct = String(MX.cta || "").trim(), mcn = String(MX.count || "").trim();
      var bsz = story ? 54 : 46, blh = Math.round(bsz * 1.55); c.font = "600 " + bsz + "px " + FAM; var bl = mbd ? wrapTxt(c, mbd, 880, story ? 10 : 7) : [];
      var hh0 = mhd ? 170 : 0, bh0 = bl.length * blh, ch0 = mcn ? 84 : 0, ah0 = mct ? 96 : 0, parts = [hh0, bh0, ch0, ah0].filter(function (v) { return v > 0; }), tot2 = 80 + parts.reduce(function (a, b) { return a + b; }, 0) + 38 * parts.length, y2 = top + Math.max(0, (bot - top - tot2) / 2);
      c.fillStyle = T.acc; star(c, W / 2, y2 + 38, 38); y2 += 80 + 20;
      if (mhd) { c.save(); c.shadowColor = T.acc; c.shadowBlur = 30; c.fillStyle = T.acc; c.textAlign = "center"; var hs = fit(c, mhd, 920, story ? 170 : 150, "800", 56); c.fillText(clip(c, mhd, 920), W / 2, y2 + hs * .85); c.restore(); y2 += hh0 + 38; }
      if (bl.length) { c.fillStyle = T.ink; c.textAlign = "center"; c.font = "600 " + bsz + "px " + FAM; bl.forEach(function (ln, q) { c.fillText(ln, W / 2, y2 + blh * (q + .75)); }); y2 += bh0 + 38; }
      if (mcn) { pill(c, T, W / 2, y2, 66, mcn, 36, "700", T.light ? "rgba(0,0,0,.1)" : "rgba(0,0,0,.35)", T.ink); y2 += ch0 + 38 - 18; }
      if (mct) pill(c, T, W / 2, y2, 76, mct, 40, "800", T.bd[1], T.bi, 380);
      return cv;
    }
    if (!rows.length) { c.fillStyle = T.ink; c.globalAlpha = .85; c.textAlign = "center"; c.font = "700 44px " + FAM; c.fillText(S.empty ? String(S.empty) : "এই সময়ে কোনো ফল নেই", W / 2, (top + bot) / 2); c.globalAlpha = 1; return cv; }

    if (kind === "board") {
      var cap0 = story ? 12 : 8, nWant = +S.n > 0 ? Math.min(rows.length, +S.n) : Math.min(rows.length, cap0), photoOfR = function (r) { return photos[r._i] || null; };
      if (S.groups || nWant > cap0) {   // বেশি জন বা গ্রুপ (বিভাগ/সেশন): বহু-কলামে সাজানো
        var lst, grp = !!S.groups;
        if (grp) { var gl = []; rows.forEach(function (r) { if (gl.indexOf(r.g) < 0) gl.push(r.g); }); if (+S.n > 0) gl = gl.slice(0, +S.n); lst = rows.filter(function (r) { return gl.indexOf(r.g) >= 0; }); } else lst = rows.slice(0, nWant);
        cv._dropped = flowList(mkGroups(lst, grp), 70, W - 70, top, bot, photoOfR); return cv;
      }
      var N = nWant, gap = 14, rh = Math.min(story ? 128 : 124, Math.floor((bot - top - gap * (N - 1)) / N)), y0 = top + Math.max(0, (bot - top - (rh * N + gap * (N - 1))) / 2), L = 70, Rr = W - 70, ar = Math.round(rh * .34);
      for (i = 0; i < N; i++) {
        var r = rows[i], yy = y0 + i * (rh + gap), mid = yy + rh / 2, tx0 = L + 24;
        c.fillStyle = panelFill(T); rr(c, L, yy, Rr - L, rh, rh / 2.4); c.fill(); if (r.rk <= 3) { c.strokeStyle = MEDAL[r.rk][1]; c.lineWidth = 3; c.globalAlpha = .9; c.stroke(); c.globalAlpha = 1; }
        if (on.rank && r.rk !== "") { rankDot(c, T, L + rh / 2, mid, rh * .34, r.rk); tx0 = L + rh + 8; }
        if (on.photo) { avatar(c, T, tx0 + ar, mid, ar, photos[i] || null, r.name, 3); tx0 += ar * 2 + 24; }
        var sw = 0; if (on.score && r.score != null && r.score !== "") { c.font = "800 " + Math.round(rh * .34) + "px " + FAM; sw = c.measureText(bd(r.score)).width + 44; c.fillStyle = T.bd[1]; var g2 = c.createLinearGradient(0, mid - rh * .24, 0, mid + rh * .24); g2.addColorStop(0, T.bd[0]); g2.addColorStop(1, T.bd[1]); c.fillStyle = g2; rr(c, Rr - 24 - sw, mid - rh * .24, sw, rh * .48, rh * .24); c.fill(); c.fillStyle = T.bi; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(bd(r.score), Rr - 24 - sw / 2, mid + 2); c.textBaseline = "alphabetic"; sw += 16; }
        var avail = Rr - 24 - sw - tx0, sub = chipsOf(r).join(" · "), hasN = on.name && r.name; c.textAlign = "left";
        if (hasN) { c.fillStyle = T.ink; var ns = fit(c, r.name, avail, Math.round(rh * (sub ? .36 : .42)), "800", 20); c.fillText(clip(c, r.name, avail), tx0, sub ? mid - rh * .02 : mid + ns * .34); }
        if (sub) { c.fillStyle = T.acc2 === T.ink ? T.acc : T.acc2; c.globalAlpha = T.light ? 1 : .95; fit(c, sub, avail, Math.round(rh * .24), "600", 14); c.fillText(clip(c, sub, avail), tx0, hasN ? mid + rh * .27 : mid + rh * .08); c.globalAlpha = 1; }
      }
      return cv;
    }

    if (kind === "rank") {
      var r0 = rows[Math.min(Math.max(+S.pick || 0, 0), rows.length - 1)], pi = Math.min(Math.max(+S.pick || 0, 0), rows.length - 1), R = story ? 200 : 170, cx = W / 2, cy;
      var blocks = []; if (on.photo) blocks.push(["a", R * 2 + 40]); if (on.rank && r0.rk !== "") blocks.push(["k", story ? 380 : 320]); if (on.name) blocks.push(["n", 100]); var cl = chipsOf(r0); if (cl.length) blocks.push(["c", 64]); if (on.score && r0.score != null && r0.score !== "") blocks.push(["s", 70]);
      var tot = blocks.reduce(function (a, b) { return a + b[1]; }, 0), gp = blocks.length > 1 ? Math.min(46, (bot - top - tot) / (blocks.length - 1)) : 0, yy2 = top + Math.max(0, (bot - top - tot - gp * Math.max(0, blocks.length - 1)) / 2);
      blocks.forEach(function (b) {
        if (b[0] === "a") { cy = yy2 + 20 + R; avatar(c, T, cx, cy, R, photos[pi] || null, r0.name, 7); }
        else if (b[0] === "k") { var big = story ? 330 : 280, tt = bd(r0.rk); c.save(); c.shadowColor = T.acc; c.shadowBlur = 40; c.fillStyle = T.acc; c.textAlign = "center"; var bs = fit(c, tt, 760, big, "800", 120); c.fillText(tt, cx, yy2 + b[1] * .72); c.restore(); c.fillStyle = T.ink; c.globalAlpha = .9; c.font = "700 " + (story ? 52 : 44) + "px " + FAM; c.fillText(RL2, cx, yy2 + b[1] * .72 + (story ? 66 : 58)); c.globalAlpha = 1; }
        else if (b[0] === "n") { c.fillStyle = T.ink; c.textAlign = "center"; fit(c, r0.name, 920, 90, "800", 28); c.fillText(clip(c, r0.name, 920), cx, yy2 + 72); }
        else if (b[0] === "c") chipsRow(yy2, cl, 32);
        else if (b[0] === "s") { pill(c, T, cx, yy2 + 4, 62, scoreTxt(r0), 36, "800", T.bd[1], T.bi, 280); }
        yy2 += b[1] + gp;
      });
      return cv;
    }

    if (kind === "podium") {
      var pn = +S.n > 0 ? Math.min(rows.length, +S.n) : Math.min(rows.length, 3), pr = rows.slice(0, Math.min(3, rows.length)), rest = rows.slice(3, pn), ha = bot - top, PH = 700;
      var ps = rest.length ? Math.max(.55, Math.min(1, ha * .62 / PH)) : Math.min(1, ha / PH), y0p = rest.length ? top : top + Math.max(0, (ha - PH * ps) / 2);
      var PX = [W / 2, W / 2 - 322, W / 2 + 322], PHT = [360, 310, 290], PR = [118, 92, 92], yb = PH;
      c.save(); c.translate(W * (1 - ps) / 2, y0p); c.scale(ps, ps);
      pr.forEach(function (r, q) {
        var cx = PX[q], ph = PHT[q], m = MEDAL[q + 1], yt = yb - ph, gp = c.createLinearGradient(0, yt, 0, yb); gp.addColorStop(0, m[0]); gp.addColorStop(1, m[1]);
        c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 24; c.fillStyle = gp; rr(c, cx - 150, yt, 300, ph, 26); c.fill(); c.restore();
        if (on.photo) { var Rv = PR[q], cyv = yt - Rv - 22; avatar(c, T, cx, cyv, Rv, photos[r._i] || null, r.name, 6); if (q === 0) { c.fillStyle = T.acc; star(c, cx, cyv - Rv - 52, 26); } }
        else if (q === 0) { c.fillStyle = T.acc; star(c, cx, yt - 36, 26); }
        var ty0 = yt, hasN = on.name && r.name; c.textAlign = "center";
        if (on.rank && r.rk !== "" && r.rk != null) { c.fillStyle = m[2]; c.font = "800 96px " + FAM; c.fillText(bd(r.rk), cx, ty0 + 92); ty0 += 140; } else ty0 += 56;
        if (hasN) { c.fillStyle = m[2]; fit(c, r.name, 270, 42, "800", 20); c.fillText(clip(c, r.name, 270), cx, ty0 + 16); ty0 += 46; }
        var sb = chipsOf(r).join(" · "); if (sb) { c.fillStyle = m[2]; c.globalAlpha = .85; fit(c, sb, 270, 26, "600", 14); c.fillText(clip(c, sb, 270), cx, ty0 + 16); c.globalAlpha = 1; }
        if (on.score && r.score != null && r.score !== "") { c.font = "800 38px " + FAM; var sw2 = Math.min(270, c.measureText(bd(r.score)).width + 56); c.fillStyle = m[2]; rr(c, cx - sw2 / 2, yb - 70, sw2, 52, 26); c.fill(); c.fillStyle = m[0]; c.textBaseline = "middle"; c.fillText(bd(r.score), cx, yb - 44 + 2); c.textBaseline = "alphabetic"; }
      });
      c.restore();
      if (rest.length) cv._dropped = flowList(mkGroups(rest, false), 70, W - 70, top + PH * ps + 18, bot, function (r) { return photos[r._i] || null; });
      return cv;
    }

    // ঘোষণা: সবার ওপরে প্রথম বিজয়ী (বড়), নিচে পরের কয়েকজন (ছোট)
    var w0 = rows[0], R2 = story ? 230 : 190, moreN = on.more ? (+S.n > 0 ? Math.min(+S.n - 1, story ? 9 : 7) : (story ? 3 : 2)) : 0, more = moreN > 0 ? rows.slice(1, 1 + moreN) : [], mh = story ? 112 : 100, mg = 12;
    var bigF = on.more && +S.n > 0 && (+S.n - 1) > (story ? 9 : 7), flowRows = [];   // অনেক জন চাইলে: ওপরে প্রথম বিজয়ী (ছোট), নিচে বাকিরা ২-৩ কলামের তালিকায়
    if (bigF) { R2 = story ? 118 : 96; more = []; flowRows = rows.slice(1, Math.min(rows.length, +S.n)); }
    var cl0 = chipsOf(w0), hasS0 = on.score && w0.score != null && w0.score !== "", hbH = function () { return (on.photo ? R2 * 2 + 50 : 0) + (on.name ? 110 : 0) + (cl0.length ? 68 : 0) + (hasS0 ? 74 : 0); };
    while (more.length && hbH() + more.length * mh + (more.length - 1) * mg + 12 * (more.length + 2) > bot - top && (R2 > 100 || mh > 58)) { if (R2 > 100) R2 -= 10; else mh -= 4; }
    var hb = []; if (on.photo) hb.push(["a", R2 * 2 + 50]); if (on.name) hb.push(["n", 110]); if (cl0.length) hb.push(["c", 68]); if (hasS0) hb.push(["s", 74]);
    var moreH = more.length ? more.length * mh + (more.length - 1) * mg : 0, hT = hb.reduce(function (a, b) { return a + b[1]; }, 0), nG = hb.length + (more.length ? 1 : 0) - 1, free = bot - top - hT - moreH, g3 = nG > 0 ? Math.max(8, Math.min(40, free / nG)) : 0;
    var yh = top + Math.max(0, (free - g3 * Math.max(0, nG)) / 2); if (bigF) { g3 = 14; yh = top; }
    hb.forEach(function (b) {
      if (b[0] === "a") { var cy2 = yh + 25 + R2; avatar(c, T, W / 2, cy2, R2, photos[0] || null, w0.name, 8); if (on.rank && w0.rk !== "") badge(c, T, W / 2 + R2 * .78, cy2 + R2 * .78, 70, bd(w0.rk)); }
      else if (b[0] === "n") { c.fillStyle = T.ink; c.textAlign = "center"; fit(c, w0.name, 920, story ? 100 : 92, "800", 28); c.fillText(clip(c, w0.name, 920), W / 2, yh + 84); }
      else if (b[0] === "c") chipsRow(yh, cl0, 32);
      else if (b[0] === "s") pill(c, T, W / 2, yh + 6, 62, scoreTxt(w0), 36, "800", T.bd[1], T.bi, 280);
      yh += b[1] + g3;
    });
    if (flowRows.length) { cv._dropped = flowList(mkGroups(flowRows, false), 70, W - 70, yh + 6, bot, function (r) { return photos[r._i] || null; }); return cv; }
    if (!on.photo && on.rank) { c.fillStyle = T.acc; c.textAlign = "center"; c.font = "800 64px " + FAM; }
    more.forEach(function (r, k) {
      var j = k + 1, yy3 = yh + k * (mh + mg), mid = yy3 + mh / 2, L = 90, Rr = W - 90, x = L + 22, ar = Math.round(mh * .34);
      c.fillStyle = panelFill(T); rr(c, L, yy3, Rr - L, mh, mh / 2.4); c.fill();
      if (on.rank && r.rk !== "") { rankDot(c, T, L + mh / 2, mid, mh * .33, r.rk); x = L + mh + 6; }
      if (on.photo) { avatar(c, T, x + ar, mid, ar, photos[j] || null, r.name, 3); x += ar * 2 + 22; }
      var swp = 0; if (on.score && r.score != null && r.score !== "") { c.font = "800 " + Math.round(mh * .34) + "px " + FAM; swp = c.measureText(bd(r.score)).width + 28; c.fillStyle = T.acc; c.textAlign = "right"; c.fillText(bd(r.score), Rr - 24, mid + mh * .12); swp += 20; }
      var av2 = Rr - 24 - swp - x, sub = chipsOf(r).join(" · "), hasN = on.name && r.name; c.textAlign = "left";
      if (hasN) { c.fillStyle = T.ink; var ns2 = fit(c, r.name, av2, Math.round(mh * (sub ? .36 : .42)), "800", 20); c.fillText(clip(c, r.name, av2), x, sub ? mid - mh * .02 : mid + ns2 * .34); }
      if (sub) { c.fillStyle = T.acc2 === T.ink ? T.acc : T.acc2; fit(c, sub, av2, Math.round(mh * .24), "600", 14); c.fillText(clip(c, sub, av2), x, hasN ? mid + mh * .27 : mid + mh * .08); }
    });
    return cv;
  }

  window.MCSocial = { STY: STY, CERTS: CERTS, SIZE: SIZE, ON: ON_DEF, draw: draw, li: li, bd: bd, dFmt: dFmt, dFmtY: dFmtY, MON: MON, TH: TH };
})();

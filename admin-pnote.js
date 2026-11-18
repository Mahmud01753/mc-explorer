// অ্যাডমিন-ওনলি: বিজয়ীর "পুরস্কার দেওয়া হয়েছে/হয়নি" + ব্যক্তিগত নোট। ডাটা শুধু mc2_prize_notes-এ (SQL: supabase-new-20261018d.sql), পাবলিক সাইটে কখনো যায় না।
// ১) নতুন ট্যাব "🎁 পুরস্কার ও নোট": ট্যাব ডিফল্টে বন্ধ, ক্লিকে খোলে/আবার ক্লিকে বন্ধ; ভেতরে প্রতিটি লটারির নাম আলাদা ফোল্ডার (ক্লিকে খোলে/বন্ধ হয়), ফিল্টার, সার্চ।
// ২) "বিজয়ী ঘোষণা" > সম্পাদনার প্রতিটি বিজয়ীর নিচে একই ঘর। অটো-সেভ (লেখার ০.৬ সেকেন্ড পরে, ঘর ছাড়লে, পেজ বন্ধের আগে)।
// চাবি = ঘোষণার আইডি + নাম|বিভাগ|সেশন|ক্রম, তাই একই নামের দুজনের নোট আলাদা। admin-winners.js-এর পরে লোড হয়।
(function () {
  var M = null, PN = {}, PNP = null, DRS = [], F = { f: "all", q: "" }, T = {}, DIRTY = {}, OPEN = {};
  window.MCA_TABS = (window.MCA_TABS || []).concat([["pn", "🎁 পুরস্কার ও নোট"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { pn: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M ? M.esc(t) : String(t == null ? "" : t); };
  var lc = function (x) { return String(x || "").trim().toLowerCase(); };
  function md5(s) {
    var K = [], R = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21], i, j;
    for (i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    var L = function (x, c) { return (x << c) | (x >>> (32 - c)); }, A = function (x, y) { var l = (x & 65535) + (y & 65535); return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 65535); };
    s = unescape(encodeURIComponent(s)); var n = s.length, w = [];
    for (i = 0; i < n; i++) w[i >> 2] = (w[i >> 2] || 0) | (s.charCodeAt(i) << ((i % 4) * 8));
    w[n >> 2] = (w[n >> 2] || 0) | (128 << ((n % 4) * 8)); w[(((n + 8) >> 6) + 1) * 16 - 2] = n * 8;
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (i = 0; i < w.length; i += 16) {
      var oa = a, ob = b, oc = c, od = d;
      for (j = 0; j < 64; j++) {
        var f, g;
        if (j < 16) { f = (b & c) | (~b & d); g = j; } else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; } else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; } else { f = c ^ (b | ~d); g = (7 * j) % 16; }
        var t = d; d = c; c = b; b = A(b, L(A(A(a, f), A(K[j], w[i + g] | 0)), R[(j >> 4) * 4 + (j % 4)])); a = t;
      }
      a = A(a, oa); b = A(b, ob); c = A(c, oc); d = A(d, od);
    }
    return [a, b, c, d].map(function (x) { var h = ""; for (var k = 0; k < 4; k++) h += ("0" + ((x >>> (k * 8)) & 255).toString(16)).slice(-2); return h; }).join("");
  }
  window.MCPN_md5 = md5;
  // ঘোষণার ভেতরে বিজয়ীর চাবি: একই নাম+বিভাগ+সেশন হলে ক্রম দিয়ে আলাদা
  function wid(list, i) { var k = function (w) { return [lc(w.name), lc(w.dept), lc(w.batch)].join("|"); }, b = k(list[i]), n = 0; for (var j = 0; j < i; j++) if (k(list[j]) === b) n++; return b + "|" + n; }
  // সাইটের খেলোয়াড়ের আইডি (U…): শুধু যখন নাম(+বিভাগ/সেশন) দিয়ে ঠিক একজনকে পাওয়া যায়; নইলে দেখায় না (ভুল আইডি দেখানোর চেয়ে ভালো)
  function uid(w) {
    try {
      var P = window.MCP; if (!P) return ""; var all = (P.board ? P.board() : []).concat(P.all ? P.all() : []), q = lc(w.name), hit = {}, n = 0;
      all.forEach(function (p) { if (lc(p.name) !== q || !p.device) return; if (w.dept && p.dept && lc(p.dept) !== lc(w.dept)) return; if (w.batch && p.batch && lc(p.batch) !== lc(w.batch)) return; if (!hit[p.device]) { hit[p.device] = 1; n++; } });
      if (n !== 1) return ""; return "U" + md5("mc2|" + Object.keys(hit)[0]).slice(0, 7).toUpperCase();
    } catch (e) { return ""; }
  }
  function css() {
    if (document.getElementById("pnst")) return; var s = document.createElement("style"); s.id = "pnst";
    s.textContent = ".pnb{margin-top:6px;padding:7px 9px;border:1px dashed #b9c8bd;border-radius:10px;background:#fbfdfb}.pnb .row{display:flex;gap:6px;align-items:center}.pnb input{flex:1;min-width:0}.pnl{font-size:11px;color:#5a6f62;margin-bottom:4px}" +
      ".pg{white-space:nowrap;border-radius:999px;border:1px solid #f0c775;background:#fff1d6;color:#9a5b00;font-weight:700;font-size:12px;padding:5px 10px}.pg.on{background:#1d6b43;border-color:#1d6b43;color:#fff}.pg.fg{padding:5px 8px;filter:grayscale(1);opacity:.55}.pg.fg.on{background:#ffe9e9;border-color:#c4194a;filter:none;opacity:1}.pnst{font-size:11px;color:#1d6b43;white-space:nowrap;min-width:48px}.pnst.e{color:#c4194a}" +
      ".pnfh{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;background:none;border:0;color:var(--fg);padding:2px 0;font:700 15px inherit;text-align:left;cursor:pointer}.pnfh .sm{white-space:nowrap}.pnbody{margin-top:6px}" +
      ".pnid{font-size:10px;color:#5a6f62;background:#eef3ee;border:1px solid #d6ded8;border-radius:6px;padding:0 5px;margin-left:5px;white-space:nowrap}.pnch.l{opacity:.75}";
    document.head.appendChild(s);
  }
  function loadPN(force) {
    if (PNP && !force) return PNP;
    PNP = M.rpc("mc2_pn_list").then(function (r) { PN = {}; (r || []).forEach(function (x) { PN[x.draw_id + "|" + x.wid] = { g: !!x.given, n: x.note || "", f: !!x.flag }; }); }).catch(function () { PNP = null; });
    return PNP;
  }
  function blk(d, w) {
    var k = d + "|" + w, o = PN[k] || { g: false, n: "" };
    return '<div class="pnb" data-k="' + E(k) + '"><div class="pnl">🔒 শুধু অ্যাডমিন — পাবলিক সাইটে দেখায় না</div><div class="row"><button type="button" class="pg fg' + (o.f ? " on" : "") + '" data-fl="1" title="ফ্ল্যাগ" aria-label="ফ্ল্যাগ">🚩</button><button type="button" class="pg' + (o.g ? " on" : "") + '" data-pg="1">' + (o.g ? "✅ দেওয়া হয়েছে" : "⏳ দেওয়া হয়নি") + '</button><input data-pnote="1" maxlength="3000" placeholder="📝 ব্যক্তিগত নোট লিখুন…" value="' + E(o.n) + '"><span class="pnst"></span></div></div>';
  }
  function say(b, txt, bad) { var s = b.querySelector(".pnst"); if (!s) return; s.textContent = txt; s.className = "pnst" + (bad ? " e" : ""); if (!bad) { clearTimeout(s.t); s.t = setTimeout(function () { s.textContent = ""; }, 2000); } }
  function flush(k, b) {
    clearTimeout(T[k]); delete T[k]; var o = PN[k]; if (!o) return Promise.resolve(); var p = k.indexOf("|"); if (b) say(b, "⏳ সেভ হচ্ছে…");
    return M.rpc("mc2_pn_set", { p_draw: +k.slice(0, p), p_wid: k.slice(p + 1), p_given: !!o.g, p_note: o.n || "" }).then(function () { delete DIRTY[k]; if (b) say(b, "✓ সেভ হয়েছে"); })
      .catch(function (e) { if (b) say(b, "⚠️ সেভ হয়নি (SQL চালানো হয়েছে?)", 1); console.warn(e); });
  }
  function later(k, b) { DIRTY[k] = b; clearTimeout(T[k]); T[k] = setTimeout(function () { flush(k, b); }, 600); }
  function counts() {
    var c = { all: 0, off: 0, on: 0, note: 0, flag: 0 }; Array.prototype.forEach.call(document.querySelectorAll(".pnr"), function (r) { var o = PN[r.dataset.k] || {}; c.all++; if (o.g) c.on++; else c.off++; if ((o.n || "").trim()) c.note++; if (o.f) c.flag++; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-pf]"), function (b) { var n = b.querySelector("i"); if (n) n.textContent = bd(c[b.dataset.pf]); });
  }
  function apply() {
    var q = lc(F.q); Array.prototype.forEach.call(document.querySelectorAll(".pnr"), function (r) {
      var o = PN[r.dataset.k] || {}, show = (F.f === "all" || (F.f === "on" && o.g) || (F.f === "off" && !o.g) || (F.f === "note" && (o.n || "").trim()) || (F.f === "flag" && o.f)) && (!q || lc(r.dataset.s).indexOf(q) >= 0); r.style.display = show ? "" : "none";
    });
    // ফোল্ডার: ডিফল্টে বন্ধ; ক্লিকে খোলে/বন্ধ হয়। ফিল্টার/সার্চ চালু থাকলে মিল থাকা ফোল্ডার নিজে খোলে (হাতে বন্ধ করলে বন্ধই থাকে)
    var act = F.f !== "all" || !!q;
    Array.prototype.forEach.call(document.querySelectorAll(".pnf"), function (fo) {
      var vis = 0; Array.prototype.forEach.call(fo.querySelectorAll(".pnr"), function (r) { if (r.style.display !== "none") vis++; });
      var id = fo.dataset.fid, body = fo.querySelector(".pnbody"), open = OPEN[id] === undefined ? (act && vis > 0) : !!OPEN[id], ic = fo.querySelector(".pnic"), ar = fo.querySelector(".pnar");
      fo.style.display = act && !vis ? "none" : ""; body.hidden = !open; if (ic) ic.textContent = open ? "📂" : "📁"; if (ar) ar.textContent = open ? "▾" : "▸";
    }); counts();
  }
  function view() {
    M = window.MCA; css();
    return Promise.all([M.rpc("mc2_draw_admin_list"), loadPN(true)]).then(function (r) { DRS = ((r[0] && r[0].rows) || []).filter(function (q) { return q.source !== "wcard-manual"; }); paint(); });
  }
  function paint() {
    var V = M.$("#view"), rows = "", chip = function (f, t) { return '<button type="button" class="pnch s' + (F.f === f ? "" : " l") + '" data-pf="' + f + '">' + t + " <i></i></button>"; };
    DRS.forEach(function (d) {
      var ws = d.winners || [];
      rows += '<div class="c pnf" data-fid="' + d.id + '"><button type="button" class="pnfh" data-fo="' + d.id + '" aria-label="ফোল্ডার খুলুন/বন্ধ করুন"><span><span class="pnic">📁</span> ' + E(d.title) + '</span><span class="sm">' + bd(ws.length) + ' জন <span class="pnar">▸</span></span></button><div class="pnbody" hidden>' + (ws.length ? "" : '<p class="sm">এই ফোল্ডারে কোনো বিজয়ী নেই।</p>');
      ws.forEach(function (w, i) {
        var id = uid(w), k = d.id + "|" + wid(ws, i);
        rows += '<div class="it pnr" data-k="' + E(k) + '" data-s="' + E((w.name || "") + " " + (w.dept || "") + " " + id) + '"><div><b>' + bd(i + 1) + ". " + E(w.name) + "</b> " + (w.dept ? '<span class="tag">' + E(w.dept) + "</span>" : "") + (w.batch ? '<span class="tag">' + E(w.batch) + "</span>" : "") + (id ? '<span class="pnid">ID ' + id + "</span>" : "") + "</div>" + blk(d.id, wid(ws, i)) + "</div>";
      });
      rows += "</div></div>";
    });
    V.innerHTML = "<h2>🎁 পুরস্কার ও নোট</h2><p class=\"sm\">প্রতিটি বিজয়ীর পুরস্কার দেওয়া হয়েছে কি না ও আপনার নিজের নোট। শুধু আপনি দেখেন; লিখলেই অটো সেভ।</p>" +
      '<div class="act" style="flex-wrap:wrap">' + chip("all", "সব") + chip("flag", "🚩 ফ্ল্যাগ করা") + chip("off", "⏳ দেওয়া হয়নি") + chip("on", "✅ দেওয়া হয়েছে") + chip("note", "📝 নোট আছে") + '</div><input id="pnq" placeholder="🔎 নাম / বিভাগ / আইডি খুঁজুন" value="' + E(F.q) + '" style="margin:6px 0">' + (rows || '<p class="sm">এখনো কোনো লটারি ফোল্ডার নেই।</p>');
    apply();
  }
  // সম্পাদনা-ফর্মে (বিজয়ী ঘোষণা) প্রতিটি বিজয়ীর নিচে একই ঘর বসায়
  var busy = false;
  function hook() {
    if (busy) return; var ins = document.querySelectorAll("input[data-note]:not([data-pn])"); if (!ins.length || !window.MCW_DRAW) return; busy = true; M = window.MCA; css();
    loadPN().then(function () {
      var d = window.MCW_DRAW();
      Array.prototype.forEach.call(document.querySelectorAll("input[data-note]:not([data-pn])"), function (inp) {
        inp.setAttribute("data-pn", "1"); var row = inp.parentNode, it = row && row.parentNode, i = +inp.dataset.note, ws = d && d.winners || [];
        if (!it || !ws[i]) return; inp.placeholder = "🌐 পাবলিক নোট (সাইটে সবাই দেখবে)";
        var h = document.createElement("div");
        if (d.id) { h.innerHTML = blk(d.id, wid(ws, i)); var u = uid(ws[i]), nm = it.querySelector("b"); if (u && nm && !it.querySelector(".pnid")) nm.insertAdjacentHTML("afterend", '<span class="pnid">ID ' + u + "</span>"); }
        else h.innerHTML = '<div class="pnb"><div class="pnl">🔒 পুরস্কার স্ট্যাটাস ও ব্যক্তিগত নোট: আগে "ডাটাবেজে সেভ করুন", তারপর এখানে লেখা যাবে।</div></div>';
        it.appendChild(h.firstChild);
      });
    }).then(function () { busy = false; }, function () { busy = false; });
  }
  document.addEventListener("click", function (e) {
    var fh = e.target.closest && e.target.closest(".pnfh");
    if (fh) { var fx = fh.closest(".pnf"), bx = fx.querySelector(".pnbody"); OPEN[fx.dataset.fid] = bx.hidden; return apply(); }
    var b = e.target.closest && e.target.closest("[data-pg]"), f = e.target.closest && e.target.closest("[data-pf]");
    if (f) { F.f = f.dataset.pf; Array.prototype.forEach.call(document.querySelectorAll("[data-pf]"), function (x) { x.classList.toggle("l", x !== f); }); return apply(); }
    var fb = e.target.closest && e.target.closest("[data-fl]");
    if (fb) { var bx = fb.closest(".pnb"), kk = bx.dataset.k, oo = PN[kk] = PN[kk] || { g: false, n: "" }, pp = kk.indexOf("|"); oo.f = !oo.f; fb.classList.toggle("on", !!oo.f);
      var rw = bx.closest(".pnr"), sp = rw && rw.querySelector(".pnfl"); if (sp) sp.textContent = oo.f ? "🚩 " : "";
      M.rpc("mc2_pn_flag", { p_draw: +kk.slice(0, pp), p_wid: kk.slice(pp + 1), p_flag: !!oo.f }).then(function () { say(bx, "✓ সেভ হয়েছে"); }).catch(function () { say(bx, "⚠️ ফ্ল্যাগ সেভ হয়নি (নতুন SQL চালানো হয়েছে?)", 1); }); return apply(); }
    if (!b) return; var box = b.closest(".pnb"), k = box.dataset.k, o = PN[k] = PN[k] || { g: false, n: "" };
    o.g = !o.g; b.className = "pg" + (o.g ? " on" : ""); b.textContent = o.g ? "✅ দেওয়া হয়েছে" : "⏳ দেওয়া হয়নি"; flush(k, box).then(apply);
  });
  document.addEventListener("input", function (e) {
    var t = e.target; if (t && t.id === "pnq") { F.q = t.value; return apply(); }
    if (!t || !t.matches || !t.matches("[data-pnote]")) return; var box = t.closest(".pnb"), k = box.dataset.k, o = PN[k] = PN[k] || { g: false, n: "" };
    o.n = t.value; say(box, "✎ লেখা হচ্ছে…"); later(k, box);
  });
  document.addEventListener("focusout", function (e) { var t = e.target; if (t && t.matches && t.matches("[data-pnote]")) { var box = t.closest(".pnb"); if (DIRTY[box.dataset.k]) flush(box.dataset.k, box); apply(); } });
  function flushAll() { Object.keys(DIRTY).forEach(function (k) { flush(k, DIRTY[k]); }); }
  window.addEventListener("pagehide", flushAll); document.addEventListener("visibilitychange", function () { if (document.hidden) flushAll(); });
  new MutationObserver(function () { if (document.querySelector("input[data-note]:not([data-pn])")) hook(); }).observe(document.documentElement, { childList: true, subtree: true });
  // ট্যাব বোতাম: ডিফল্টে বন্ধ (অন্য ট্যাব খোলা থাকে); চাপলে খোলে, খোলা অবস্থায় আবার চাপলে বন্ধ।
  // কারণ আগে কাজ করত না: admin.js-এর ট্যাব-ক্লিক (start()) প্রতিবার শুধু ট্যাব বদলে আবার আঁকে, খোলা ট্যাবে চাপলে বন্ধ করার কোনো নিয়ম ছিল না।
  // admin.js না ছুঁয়ে এখানে ক্যাপচার-ক্লিকে ধরা হয়েছে: "খোলা + আবার ক্লিক" = শুধু #view লুকায়; অন্য যেকোনো ট্যাব ক্লিকে #view আবার দেখায়।
  document.addEventListener("click", function (e) {
    var tb = e.target.closest && e.target.closest("#tabs [data-t]"), V = document.getElementById("view"); if (!tb || !V) return;
    if (tb.dataset.t === "pn" && tb.classList.contains("on") && V.style.display !== "none") { e.stopImmediatePropagation(); e.preventDefault(); V.style.display = "none"; tb.classList.remove("on"); tb.setAttribute("aria-expanded", "false"); return; }
    V.style.display = "";
  }, true);
})();

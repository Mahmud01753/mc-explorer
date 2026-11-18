// অ্যাডমিন: "🎯 কুইজ কঠিনতা" ট্যাব (ভাগ ১) — কোন ছবি কত শতাংশ ইউজার ভুল করে।
// শুধু বিদ্যমান mc2_answers পড়ে; নতুন ডাটা, SQL, স্টোরেজ নেই। ছবির নাম ও ক্যাটাগরি দেখায়, ব্যবহারকারীর নাম/ডিভাইস নয়।
(function () {
  var M = null, bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var CAP = 20000, PRESET = [["7", "শেষ ৭ দিন"], ["30", "শেষ ৩০ দিন"], ["all", "সব সময়"], ["custom", "কাস্টম (তারিখ বেছে নিন)"]];
  var S = { p: "7", from: "", to: "", rows: null, msg: "" };

  window.MCA_TABS = (window.MCA_TABS || []).concat([["diff", "🎯 কুইজ কঠিনতা"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { diff: view });

  function isoDay(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function range() { // [from ISO, to ISO) — সময় ডিভাইসের; সার্ভারে UTC
    var now = new Date();
    if (S.p === "all") return null;
    if (S.p === "custom") {
      if (!S.from) return null;
      var a = new Date(S.from + "T00:00:00"), b = S.to ? new Date(S.to + "T00:00:00") : new Date();
      b = new Date(b.getTime() + 864e5);
      return { f: a.toISOString(), t: b.toISOString() };
    }
    var days = +S.p, st = new Date(now.getTime() - days * 864e5);
    return { f: st.toISOString(), t: now.toISOString() };
  }
  function fetchAnswers() { // ১০০০টা করে, সর্বোচ্চ CAP
    var r = range(), out = [];
    var q = "mc2_answers?select=place_bn,is_correct,skipped,created_at&order=created_at.desc,id.asc";
    if (r) q += "&and=(created_at.gte." + encodeURIComponent(r.f) + ",created_at.lt." + encodeURIComponent(r.t) + ")";
    return (function nx(off) {
      return M.A(q + "&limit=1000&offset=" + off).then(function (L) {
        L = L || []; out = out.concat(L);
        if (L.length === 1000 && off + 1000 < CAP) return nx(off + 1000);
      });
    })(0).then(function () { return out; });
  }
  function summarize(L) {
    var g = {}, tot = 0, wr = 0;
    L.forEach(function (a) {
      var k = a.place_bn || "—", o = g[k] || (g[k] = { name: k, n: 0, w: 0 });
      o.n++; tot++; if (!a.is_correct) { o.w++; wr++; }
    });
    var rows = Object.keys(g).map(function (k) { var o = g[k]; o.pct = Math.round(100 * o.w / o.n); return o; });
    rows.sort(function (x, y) { return (y.pct - x.pct) || (y.n - x.n); });
    return { rows: rows, tot: tot, pct: tot ? Math.round(100 * wr / tot) : 0, capped: L.length >= CAP };
  }
  function paint() {
    var host = M.$("#view"); if (!host) return;
    var opts = PRESET.map(function (p) { return '<option value="' + p[0] + '"' + (S.p === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("");
    var h = '<h2>🎯 কুইজ কঠিনতা</h2><p class="sm">কোন ছবি কত শতাংশ ইউজার ভুল করে, বা সময় শেষ হয়ে যায়। শুধু আগের উত্তরের ডাটা থেকে হিসাব; কোনো নতুন ডাটা জমে না।</p>';
    h += '<div class="it"><div class="row"><label>সময়কাল<select id="df_p">' + opts + '</select></label>';
    h += '<label>থেকে<input id="df_f" type="date" value="' + esc(S.from) + '"' + (S.p === "custom" ? "" : " disabled") + '></label>';
    h += '<label>পর্যন্ত<input id="df_t" type="date" value="' + esc(S.to) + '"' + (S.p === "custom" ? "" : " disabled") + '></label></div>';
    h += '<div class="act"><button type="button" class="s" id="df_go">🔄 হিসাব করুন</button></div>';
    h += '<div class="sm" id="df_msg">' + esc(S.msg) + "</div></div>";
    if (S.rows) {
      var s = S.rows;
      h += '<div class="it"><b>সারসংক্ষেপ</b><div class="sm">মোট উত্তর: ' + bd(s.tot) + " · ভুলের গড় শতাংশ: " + bd(s.pct) + "% · ছবির সংখ্যা: " + bd(s.rows.length) + "</div>";
      if (s.capped) h += '<div class="sm warn">⚠️ ডাটা বেশি — প্রথম ' + bd(CAP) + "টি উত্তর ধরা হয়েছে; সময়কাল ছোট করুন।</div>";
      h += "</div>";
      if (!s.rows.length) h += '<div class="it sm">এই সময়ে কোনো উত্তর নেই।</div>';
      s.rows.forEach(function (r, i) {
        var few = r.n < 10 ? ' <span class="sm">(নমুনা কম)</span>' : "";
        h += '<div class="it"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + bd(i + 1) + ". " + esc(r.name) + '</b><span>' + bd(r.pct) + "% ভুল</span></div>";
        h += '<div style="background:#e5e7eb;border-radius:6px;height:8px;margin:6px 0"><div style="width:' + r.pct + '%;background:' + (r.pct >= 50 ? "#dc2626" : r.pct >= 25 ? "#f59e0b" : "#16a34a") + ';height:8px;border-radius:6px"></div></div>';
        h += '<div class="sm">উত্তর ' + bd(r.n) + " জন · ভুল " + bd(r.w) + " জন" + few + "</div></div>";
      });
    }
    host.innerHTML = h;
    var p = M.$("#df_p"), f = M.$("#df_f"), t = M.$("#df_t");
    if (p) p.onchange = function () { S.p = p.value; paint(); };
    if (f) f.onchange = function () { S.from = f.value; };
    if (t) t.onchange = function () { S.to = t.value; };
    var go = M.$("#df_go");
    if (go) go.onclick = function () { run(); };
  }
  function run() {
    if (S.p === "custom" && !S.from) { S.msg = "শুরুর তারিখ বাছুন।"; return paint(); }
    S.msg = "⏳ উত্তর আনা হচ্ছে…"; paint();
    fetchAnswers().then(function (L) { S.rows = summarize(L); S.msg = "✅ হিসাব হয়েছে।"; paint(); })
      .catch(function (e) { S.msg = "❌ আনা যায়নি: " + (e && e.message || e); paint(); });
  }
  function view(m) { M = window.MCA; S.rows = null; S.msg = ""; paint(); return Promise.resolve(); }
})();

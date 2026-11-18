// অ্যাডমিন: "🖼 কুইজ ছবি" — কুইজের ছবি কীভাবে/কত স্পিডে/কোন কোণ থেকে খোলে তার সব সেটিং।
// সেভ হয় mc2_settings-এর key 'qimg_cfg'; পাবলিক সাইটে qimg-config.js পড়ে। SQL: supabase-new-20261206.sql
// admin-hub.js-এর পরে, admin.js-এর আগে লোড হয়। ছোট-ছবি-আগে ও ধীরে-পরিষ্কার সুইচ আগের মতোই 🏠 হোম-এ।
(function () {
  var M = null, S = null, bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  window.MCA_TABS = (window.MCA_TABS || []).concat([["qimg", "🖼 কুইজ ছবি"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { qimg: view });
  var CN = ["↖ উপরে-বামে", "↘ নিচে-ডানে", "↗ উপরে-ডানে", "↙ নিচে-বামে", "⬆ উপরে-মাঝে", "⬇ নিচে-মাঝে", "⬅ বামে-মাঝে", "➡ ডানে-মাঝে"];
  function msg(t, bad) { var m = M.$("#qim"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  function opt(v, cur, t) { return '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + t + "</option>"; }
  function row(t, h, c) { return '<div class="it"><div><b>' + t + '</b><br><span class="sm">' + h + "</span></div><div>" + c + "</div></div>"; }
  function num(id, v, a, b, st) { return '<input id="' + id + '" type="number" min="' + a + '" max="' + b + '" step="' + (st || 1) + '" value="' + v + '" style="width:90px"> '; }
  function sw(id, on) { return '<label><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "> চালু</label>"; }
  function paint() {
    var Q = S, cors = CN.map(function (n, i) { return '<label style="display:inline-block;margin:3px 8px 3px 0"><input type="checkbox" data-c="' + i + '"' + (Q.cor.indexOf(i) >= 0 ? " checked" : "") + "> " + n + "</label>"; }).join("");
    M.$("#view").innerHTML = '<h2>🖼 কুইজের ছবির সেটিং</h2><p class="sm">কুইজে ছবি যেভাবে আসে তার সব নিয়ম এখানে। সেভ করলেই নতুন খেলায় চালু হয়। সেটিং না থাকলে আগের মতোই (৩.৬ গুণ বড় থেকে ২০ সেকেন্ডে, ৮ কোণ)। ছোট-ছবি-আগে ও ধীরে-পরিষ্কার সুইচও এখানে (🏠 হোম-এর সুইচে বন্ধ থাকলে সেটাই বন্ধ থাকে)।</p>' +
      row("খোলার ধরন", "ধীরে খোলা = বড় থেকে পুরো ছবিতে · স্থির = শুরুতেই পুরো ছবি · উল্টো = পুরো ছবি থেকে বড় হতে থাকে", '<select id="q_mode">' + opt("zoom", Q.mode, "ধীরে খোলা (এখনকার)") + opt("still", Q.mode, "স্থির পুরো ছবি") + opt("rev", Q.mode, "উল্টো (পুরো → বড়)") + "</select>") +
      row("কত সেকেন্ডে খুলবে", "১–১২০ সেকেন্ড। প্রশ্নের টাইমার আলাদা (২০ সেকেন্ডই থাকে)", num("q_dur", Q.dur, 1, 120, 0.5) + "সেকেন্ড") +
      row("কত গুণ বড় (শুরুতে/শেষে)", "১.১–১০ গুণ", num("q_sc", Q.sc, 1.1, 10, 0.1) + "গুণ") +
      row("গতির ধরন", "সমান গতি, বা শেষে ধীরে-থামা", '<select id="q_ease">' + opt("linear", Q.ease, "সমান গতি") + opt("ease-out", Q.ease, "শেষে ধীরে থামা") + opt("ease-in-out", Q.ease, "শুরু-শেষ ধীর") + "</select>") +
      row("শুরুর আগে অপেক্ষা", "০–২০ সেকেন্ড (এ সময় শুরুর ফ্রেম স্থির থাকে)", num("q_delay", Q.delay, 0, 20, 0.5) + "সেকেন্ড") +
      row("কতবার খুলবে", "একই ছবির খোলা ১–৫ বার পুনরাবৃত্তি", num("q_rep", Q.rep, 1, 5) + "বার") +
      '<h2 style="margin-top:14px">কোন কোণ থেকে শুরু</h2><div>' + cors + '</div><div class="act"><button type="button" class="l s" data-all="1">সব টিক</button><button type="button" class="l s" data-all="0">৪ কোণ (শুধু ৪টি মূল)</button></div>' +
      row("কোণের ক্রম", "৮টিই টিক + এলোমেলো = আগের নিয়ম (একই কোণ বারবার আসে না)", '<select id="q_ord">' + opt("rand", Q.ord, "এলোমেলো") + opt("seq", Q.ord, "ক্রমানুসারে") + opt("fix", Q.ord, "একটাই স্থির (প্রথম টিকটি)") + "</select>") +
      '<h2 style="margin-top:14px">ছবি লোডের সময়</h2>' +
      row("ধীর নেটে আগে ছোট ছবি", "ডিফল্ট: বন্ধ। চালু করলে আগে ছোট কপি দেখায়, পুরো ছবি এলে বদলায়", sw("q_thumb", Q.thumb)) +
      row("ধীরে-পরিষ্কার (ঝাপসা থেকে)", "ডিফল্ট: চালু। শুধু ছোট-ছবি চালু থাকলে কাজ করে", sw("q_fade", Q.fade)) +
      '<h2 style="margin-top:14px">উত্তরের পর</h2>' +
      row("ঠিক উত্তরে পুরো ছবি দেখানো", "চালু থাকলে ঠিক হলেই পুরো ছবিতে নামে; বন্ধ থাকলে যতটুকু খুলেছে সেখানেই থামে", sw("q_rok", Q.rok) + " " + num("q_rokT", Q.rokT, 0, 5, 0.1) + "সেকেন্ড") +
      row("ভুল/সময় শেষে ঝাপসা", "চালু থাকলে যতটুকু খুলেছে সেখানে থেমে ঝাপসা হয়", sw("q_wbl", Q.wbl) + " " + num("q_wblPx", Q.wblPx, 0, 60) + "px") +
      '<div class="act" style="margin-top:10px"><button type="button" id="q_sv">💾 সেভ</button><button type="button" class="l" id="q_rs">↩ সব ডিফল্টে ফেরান</button></div><p id="qim" class="sm"></p><div id="qov" style="margin-top:16px"><p class="sm">⏳ ছবির হিসাব আনা হচ্ছে…</p></div>';
    ovLoad();
  }
  // ভাগ ২গ: ছবির হিসাব এক নজরে — mc2_places ও mc2_questions শুধু পড়া (নতুন SQL/ডাটা নেই)। প্রশ্নে ট্যাপ করলে ছোট প্রিভিউ।
  var OV = null, OPQ = {};
  var esc = function (s) { return M.esc(s); }, imgSrc = function (u) { return String(u || ""); };
  function ovHtml() {
    if (!OV) return "";
    var P = OV.p, Q = OV.q, qm = {}; Q.forEach(function (x) { qm[x.place_id] = x; });
    var withImg = P.filter(function (p) { return p.img; }).length, act = P.filter(function (p) { return p.active; }).length;
    var noImg = Q.filter(function (x) { var p = OV.pm[x.place_id]; return !p || !p.img; });
    var noQ = P.filter(function (p) { return p.active && !qm[p.id]; });
    var h = '<h2>📋 ছবি ও প্রশ্নের হিসাব</h2><p class="sm">ছবি <b>' + bd(P.length) + "</b>টি (চালু " + bd(act) + "টি, ছবির ফাইলসহ " + bd(withImg) + "টি) · প্রশ্ন <b>" + bd(Q.length) + "</b>টি · <b>ছবি-ছাড়া প্রশ্ন " + bd(noImg.length) + "টি</b> · প্রশ্ন-ছাড়া চালু ছবি " + bd(noQ.length) + "টি</p>";
    if (P.length >= 2000 || Q.length >= 2000) h += '<p class="sm warn">⚠️ ২০০০-এর সীমায় পড়া হয়েছে; হিসাব অসম্পূর্ণ হতে পারে।</p>';
    h += "<h3>🚫 ছবি-ছাড়া প্রশ্ন (" + bd(noImg.length) + ")</h3>" + (noImg.length ? noImg.slice(0, 100).map(function (x) { return qRow(x, null); }).join("") + (noImg.length > 100 ? '<p class="sm">…আরও ' + bd(noImg.length - 100) + "টি (প্রথম ১০০টি দেখানো)</p>" : "") : '<p class="sm">সব প্রশ্নেরই ছবি আছে ✅</p>');
    h += "<h3>❓ প্রশ্ন-ছাড়া চালু ছবি (" + bd(noQ.length) + ")</h3>" + (noQ.length ? noQ.slice(0, 100).map(function (p) { return qRow(null, p); }).join("") : '<p class="sm">সব চালু ছবিরই প্রশ্ন আছে ✅</p>');
    return h;
  }
  function qRow(x, pl) {
    var id = x ? x.place_id : pl.id, p = OV.pm[id] || pl || {}, k = (x ? "q" : "p") + id, open = OPQ[k];
    var ttl = x ? x.question : (p.bn || "—") + " (প্রশ্ন নেই)";
    return '<div class="it"><button type="button" class="l s" data-qp="' + k + '" style="text-align:left;width:100%">' + (open ? "▾ " : "▸ ") + esc(ttl) + '</button>' + (open ? '<div style="padding:6px 0">' + (p.img ? '<img loading="lazy" src="' + esc(imgSrc(p.img)) + '" alt="" style="max-width:min(220px,100%);border-radius:10px;display:block;margin-bottom:6px">' : '<div class="sm">🚫 এই ছবির ফাইল নেই</div>') +
      '<div class="sm">নাম: <b>' + esc(p.bn || "—") + "</b>" + (p.active ? "" : " · 🙈 লুকানো") + "</div>" + (x ? '<div class="sm">✔ ' + esc(x.correct) + " · ✘ " + (x.wrong || []).map(esc).join(" · ") + "</div>" : "") + "</div>" : "") + "</div>";
  }
  function ovLoad() {
    Promise.all([M.A("mc2_places?select=id,bn,img,active&order=id.desc&limit=2000"), M.A("mc2_questions?select=place_id,question,correct,wrong&limit=2000")]).then(function (r) {
      var pm = {}; (r[0] || []).forEach(function (p) { pm[p.id] = p; }); OV = { p: r[0] || [], q: r[1] || [], pm: pm }; var e = M.$("#qov"); if (e) e.innerHTML = ovHtml();
    }).catch(function (e) { var x = M.$("#qov"); if (x) x.innerHTML = '<p class="sm warn">❌ হিসাব আনা যায়নি: ' + esc((e && e.message) || "") + "</p>"; });
  }
  function read() {
    var g = function (id) { return M.$("#" + id); }, c = [].slice.call(document.querySelectorAll("#view [data-c]")).filter(function (x) { return x.checked; }).map(function (x) { return +x.dataset.c; });
    return { mode: g("q_mode").value, dur: +g("q_dur").value, sc: +g("q_sc").value, ease: g("q_ease").value, delay: +g("q_delay").value, rep: +g("q_rep").value, cor: c, ord: g("q_ord").value, rok: g("q_rok").checked, rokT: +g("q_rokT").value, wbl: g("q_wbl").checked, wblPx: +g("q_wblPx").value, thumb: g("q_thumb").checked, fade: g("q_fade").checked };
  }
  function save(v) {
    var Q = window.MCQ.clean(v); if (!Q.cor.length) { msg("❌ অন্তত ১টি কোণ টিক দিন। সেভ হয়নি।", true); return; } msg("⏳ সেভ হচ্ছে…");
    M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "qimg_cfg", value: Q }]) })
      .then(function () { var C = M.C || window.MC_CFG || {}; return fetch(String(C.url).replace(/\/$/, "") + "/rest/v1/mc2_settings?select=value&key=eq.qimg_cfg", { headers: { apikey: C.key, Authorization: "Bearer " + C.key } }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); })
      .then(function (r) { if (!r.length || JSON.stringify(r[0].value) !== JSON.stringify(Q)) throw new Error("সার্ভারে মিলল না"); S = Q; msg("✅ সেভ হয়েছে (সার্ভার থেকে আবার পড়ে মিলিয়ে দেখা হয়েছে)। নতুন খেলা থেকে চালু।"); })
      .catch(function (e) { msg("❌ সেভ/পরীক্ষা হয়নি: " + e.message + " — supabase-new-20261206.sql চালানো হয়েছে কি না দেখুন।", true); });
  }
  function view() {
    M = window.MCA; var C = M.C || window.MC_CFG || {};
    return M.A("mc2_settings?select=value&key=eq.qimg_cfg").catch(function () { return []; }).then(function (r) {
      S = window.MCQ.clean(r[0] && r[0].value); paint();
      M.$("#view").onclick = function (e) {
        var t = e.target.closest("button"); if (!t) return;
        if (t.dataset.qp) { OPQ[t.dataset.qp] = !OPQ[t.dataset.qp]; var ov = M.$("#qov"); if (ov) ov.innerHTML = ovHtml(); return; }
        if (t.id === "q_sv") save(read());
        else if (t.id === "q_rs") { S = window.MCQ.clean(null); paint(); msg("ডিফল্ট বসানো হয়েছে — 💾 সেভ চাপলে কার্যকর হবে।"); }
        else if (t.dataset.all) { var all = t.dataset.all === "1"; [].forEach.call(document.querySelectorAll("#view [data-c]"), function (x) { x.checked = all ? true : +x.dataset.c < 4; }); }
      };
    });
  }
})();

// অ্যাডমিন: "🧹 অটো-ক্লিন" — Free প্ল্যানের ৫০০ MB সীমার আগে পুরোনো ডেটা ছোট ব্যাচে মোছার নিয়ম (২০২৬-১০-১৯)।
// ডেটা: mc2_cleanup_cfg / mc2_cleanup_log, RPC mc2_cleanup_admin_get / _set / _run। SQL: supabase-new-20261019.sql
// নিয়ম: টপ ৩-এ একবার এলে কার্ড কখনো মোছা হয় না (সুরক্ষিত; ডেটাবেসে pinned কলাম)। ০ = সেই ডেটা সময় ধরে কখনো মোছা হবে না। কার্ড মোছা একেবারে শেষ উপায়।
(function () {
  var M = null, D = null, MSG = "", BAD = false;
  window.MCA_TABS = (window.MCA_TABS || []).concat([["clean", "🧹 অটো-ক্লিন"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { clean: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  var NZ = { visits_days: 1, answers_days: 1, presence_days: 1, cards_days: 1, shot_ok_days: 1 };
  var NEWK = { cut1: 1, cut2: 1, cut3: 1, alert_n: 1, alert_hr: 1 }, OLDK = { stop_pct: 1, step_pct: 1 }, AL = null; // নতুন সেটিং শুধু supabase-new-20261022.sql চালানোর পর দেখায়
  var F = [
    ["card_max", "কার্ড এত হলে (সংখ্যা) বাড়তি পুরোনো কার্ড মুছবে", "ডিফল্ট ১০০০। দিনের কোনো সীমা নেই; প্রতিবারে নিচের ব্যাচ-সংখ্যা। শুধু কার্ড যায়; স্কোর ও ইউজার ইনফো থাকে। টপ ৩-এ আসা (সুরক্ষিত) কার্ড কখনো নয়।"],
    ["card_batch", "কার্ড: প্রতিবারে সর্বোচ্চ কত টি", "ডিফল্ট ৫০।"],
    ["card_min_days", "কার্ড কত দিনের কম পুরোনো হলে বাঁচবে", "ডিফল্ট ০ (সীমা নেই, শুধু সবচেয়ে পুরোনোগুলো যায়)।"],
    ["cards_days", "কার্ড: এত দিনের পুরোনো মুছবে (০ = কখনো না)", "ডিফল্ট ০। টপ ৩-এ একবার এলে কখনো নয়।"],
    ["card_pct", "কার্ড কাটার আরেক সীমা (DB কত % ভরলে)", "ডিফল্ট ৮০। শুধু অন্য ডেটা শেষ হলে।"],
    ["start_pct", "অন্য ডেটা কাটা শুরু (DB কত % ভরলে)", "ডিফল্ট ৭০। ভিজিট, উত্তর, অনলাইন-তালিকা।"],
    ["min_age_days", "অন্য ডেটা কত দিনের কম পুরোনো হলে বাঁচবে", "ডিফল্ট ৭। চাপ থাকলেও এর চেয়ে নতুন মোছে না।"],
    ["batch", "অন্য ডেটা: প্রতিবারে সর্বোচ্চ কত সারি", "ডিফল্ট ২০০। একসাথে সব মোছে না।"],
    ["visits_days", "ভিজিট: এত দিনের পুরোনো মুছবে (০ = কখনো না)", ""],
    ["answers_days", "কুইজ উত্তর: এত দিনের পুরোনো মুছবে (০ = কখনো না)", "মুছলে অ্যাডমিন ফলাফলের পুরোনো হিসাব কমবে।"],
    ["presence_days", "অনলাইন/ইউজার তালিকা: এত দিন না এলে মুছবে (০ = কখনো না)", "মুছলে ইউজার তালিকা থেকে ওই পুরোনো ইউজার চলে যাবে।"],
    ["db_mb", "ডেটাবেস সীমা (MB)", "Free = ৫০০।"],
    ["ip_view_min", "লিডারবোর্ড/টপ ৩: প্রতি আইপি, প্রতি মিনিটে", "ডিফল্ট ৬০০ (আগে ৬০)।"],
    ["ip_card_hr", "কার্ড সেভ: প্রতি আইপি, প্রতি ঘণ্টায়", "ডিফল্ট ১৫০০।"],
    ["ip_score_hr", "স্কোর জমা: প্রতি আইপি, প্রতি ঘণ্টায়", "ডিফল্ট ১৫০০।"],
    ["ip_entry_hr", "কনটেস্ট এন্ট্রি: প্রতি আইপি, প্রতি ঘণ্টায়", "ডিফল্ট ৩০০।"],
    ["score_dev_hr", "স্কোর জমা: প্রতি ডিভাইস, প্রতি ঘণ্টায়", "ডিফল্ট ৩০ (আগের সীমা)।"],
    ["visit_dev_hr", "ভিজিট লগ: প্রতি ডিভাইস, প্রতি ঘণ্টায়", "ডিফল্ট ৪০ (আগের সীমা)।"],
    ["card_per_dev", "কার্ড: প্রতি ডিভাইসে সর্বোচ্চ", "ডিফল্ট ২০ (আগের সীমা)।"],
    ["stop_pct", "থামার সীমা (%): প্রথমবার এখানে নেমে থামবে", "কম করলে বেশি কাটবে; floor-এর নিচে নামবে না"],
    ["floor_pct", "সবচেয়ে নিচের সীমা (%): এর নিচে কখনো কাটবে না", "ডিফল্ট ৮০"],
    ["step_pct", "২৪ ঘণ্টায় আবার ভরলে থামার সীমা কত % নামবে", "ডিফল্ট ২"],
    ["storage_mb", "Storage-এর সীমা (MB)", "Free = 1024"],
    ["visits_max", "ভিজিট-লগ সর্বোচ্চ সারি (পুরোনো মুছবে)", "ডিফল্ট ৩০০০"],
    ["bin_days", "বিনে কত দিন থাকবে (০ = বিন নিজে খালি হবে না)", "ডিফল্ট ৩০"],
    ["shot_ok_days", "স্ক্রিনশট: ভেরিফাইড হওয়ার কত দিন পর ছবি মুছবে", "ডিফল্ট ৭; লগ-তথ্য থাকবে। Unverified/Unknown/Pending স্ক্রিনশট কখনো নিজে মোছে না (জায়গা ভরলেও না)।"],
    ["card_gap_sec", "একই কার্ড আবার সেভের ন্যূনতম ব্যবধান (সেকেন্ড)", "ডিফল্ট ২ (আগের সীমা)।"],
    ["cut1", "১ম বার ৯০% ছুঁলে কত % কাটবে (সর্বোচ্চ ১০)", "ডিফল্ট ২ (≈ ৯০ → ৮৮)। এখন প্রতিবার এই ক্রমে: ১ম, ২য়, ৩য়, আবার ১ম…"],
    ["cut2", "২য় বার কত % কাটবে (সর্বোচ্চ ১০)", "ডিফল্ট ৩ (≈ ৮৭)"],
    ["cut3", "৩য় বার কত % কাটবে (সর্বোচ্চ ১০)", "ডিফল্ট ৫ (≈ ৮৫); এরপর আবার ১ম বারের মাপে"],
    ["alert_n", "সতর্কবার্তা: এত বার চক্র শুরু হলে", "ডিফল্ট ৩"],
    ["alert_hr", "…এত ঘণ্টার মধ্যে", "ডিফল্ট ২৪। ২৪ ঘণ্টায় একবারের বেশি সতর্কবার্তা যায় না।"]
  ];
  function say(t, bad) { MSG = t; BAD = !!bad; var m = document.querySelector("#clM"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  function load() { return M.rpc("mc2_cleanup_admin_get").then(function (r) { D = r; return M.rpc("mc2_cleanup_alerts_list").then(function (a) { AL = a; }).catch(function () { AL = null; }); }).catch(function (e) { D = null; say("❌ লোড হয়নি: " + e.message + " — supabase-new-20261019.sql চালানো হয়েছে কি না দেখুন।", true); }); }
  function alertBox() {
    if (!AL || !AL.rows || !AL.rows.length) return "";
    var un = AL.unseen || 0;
    return '<div style="border:2px solid ' + (un ? "#c0392b" : "#cfd8c8") + ';border-radius:10px;padding:10px;margin:8px 0;' + (un ? "background:rgba(192,57,43,.08)" : "") + '"><b>' + (un ? "⚠️ সতর্কতা — " + bd(un) + " টি নতুন" : "🔔 সাম্প্রতিক সতর্কবার্তা") + "</b>" +
      AL.rows.slice(0, 3).map(function (a) { return '<pre style="white-space:pre-wrap;margin:6px 0;font:inherit;font-size:13px">' + E(M.tm(a.ts)) + "\n" + E(a.msg) + "\n[" + E(a.sent || "") + "]</pre>"; }).join("") + (un ? '<button class="l s" type="button" data-a="aseen">✔ দেখেছি</button>' : "") + "</div>";
  }
  function notifyBox(c) {
    return '<div style="border:1px solid #cfd8c8;border-radius:10px;padding:10px;margin:10px 0"><b>🔔 সতর্কবার্তা (২৪ ঘণ্টায় ৩ বার ৯০% ছুঁলে)</b>' +
      '<p class="sm">অ্যাডমিনে লাল ব্যানার সবসময় আসে। ফোনে/মেইলে পেতে একটা লিংক দিন। সবচেয়ে সহজ: ফোনে <b>ntfy</b> অ্যাপ ইনস্টল করে একটা গোপন টপিক বানান (যেমন mc-alert-x7k2p9), তারপর লিংক বসান: https://ntfy.sh/আপনার-টপিক। Slack/Discord webhook লিংকও চলে। ফাঁকা = শুধু অ্যাডমিনে। আগে 💾 সেভ, তারপর 🔔 টেস্ট।</p>' +
      '<label class="sm" style="display:grid;gap:3px"><b>বার্তার লিংক (https://…)</b><input id="clNU" type="url" maxlength="400" value="' + E(c.notify_url || "") + '"></label>' +
      '<label class="sm" style="display:grid;gap:3px"><b>ইমেইল (ঐচ্ছিক, শুধু ntfy লিংকের সাথে)</b><input id="clNE" type="email" maxlength="120" value="' + E(c.notify_email || "") + '"></label>' +
      '<div class="act" style="margin-top:6px"><button class="s" type="button" data-a="ntest">🔔 টেস্ট বার্তা পাঠান</button></div></div>';
  }
  function paint() {
    var V = document.querySelector("#view"); if (!V) return;
    if (!D) { V.innerHTML = '<h2>🧹 অটো-ক্লিন</h2><p id="clM" class="sm warn">' + E(MSG) + "</p>"; return; }
    var c = D.cfg || {}, NEWF = (D.cfg || {}).cut1 != null, pct = D.pct || 0, col = pct >= (c.card_pct || 80) ? "#c0392b" : pct >= (c.start_pct || 70) ? "#d68910" : "#1e8449";
    var h = "<h2>🧹 অটো-ক্লিন</h2>" + alertBox() +
      '<p class="sm">ডেটাবেস এখন <b>' + bd(D.size_mb) + " MB</b> (সীমা " + bd(c.db_mb) + ' MB) — <b style="color:' + col + '">' + bd(pct) + "% ভরা</b>। কার্ড <b>" + bd(D.cards) + "</b> (এর মধ্যে <b>" + bd(D.pinned) + "</b> টি সুরক্ষিত — কখনো টপ ৩-এ এসেছিল, তাই কখনো মোছা হবে না; বাকি <b>" + bd(Math.max(0, (D.cards || 0) - (D.pinned || 0))) + "</b> টি মোছা যেতে পারে), ভিজিট " + bd(D.visits) + ", উত্তর " + bd(D.answers) + ", অনলাইন-তালিকা " + bd(D.presence) + "।</p>" +
      '<div style="height:10px;background:#e5e8e3;border-radius:6px;overflow:hidden;max-width:420px"><div style="height:100%;width:' + Math.min(100, pct) + "%;background:" + col + '"></div></div>' +
      '<p class="sm">নিয়ম: কার্ড নির্দিষ্ট সংখ্যা ছাড়ালে বাড়তি পুরোনো কার্ড ছোট ব্যাচে মোছে (দিনের সীমা নেই)। DB শুরু-% ছাড়ালে ভিজিট/উত্তর/অনলাইন-তালিকার পুরোনো সারি কাটে। টপ ৩-এ একবারও আসা (সুরক্ষিত) কার্ড কখনো নয়, আর স্কোর ও ইউজার ইনফো টেবিল ছোঁয়া হয় না। ফাইল সাইজ মোছার পর সাথে সাথে ছোট হয় না (জায়গা পরে নতুন ডেটা নেয়)। নিচের সব সংখ্যা বদলানো যায়; ডিফল্ট আগের সীমাগুলোই।</p>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="clOn"' + (c.on === false ? "" : " checked") + "> অটো-ক্লিন চালু</label>" +
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="clOth"' + (c.others_on === false ? "" : " checked") + "> জায়গার চাপে ভিজিট/উত্তর/অনলাইন-তালিকাও কাটুক (বন্ধ করলে শুধু সময়-নিয়ম চলবে)</label>" +
      '<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' +
      F.filter(function (f) { return NEWF ? !OLDK[f[0]] : !NEWK[f[0]]; }).map(function (f) { return '<label class="sm" style="display:grid;gap:3px"><b>' + f[1] + '</b><input type="number" min="0"' + (/^cut[123]$/.test(f[0]) ? ' max="10"' : "") + ' step="1" data-k="' + f[0] + '" value="' + E(c[f[0]]) + '">' + (f[2] || NZ[f[0]] ? "<span>" + (f[2] || "") + (NZ[f[0]] ? " ০ = কখনো না (শুধু জায়গা ভরলে)" : "") + "</span>" : "") + "</label>"; }).join("") + "</div>" +
      (NEWF ? notifyBox(c) : "") + '<div class="act" style="margin-top:10px"><button class="l" type="button" data-a="save">💾 সেভ</button><button class="s" type="button" data-a="dry">🔍 পরীক্ষা (কিছু মুছবে না)</button><button class="d s" type="button" data-a="run">🧹 এখনই চালান</button></div>' +
      '<p id="clM" class="sm' + (BAD ? " warn" : "") + '">' + E(MSG) + "</p>" +
      "<h3>সাম্প্রতিক মোছা (২০টি)</h3>" + ((D.log || []).length ? '<div class="sm">' + D.log.map(function (l) { return "• " + E(M.tm(l.ts)) + " — " + E(l.what) + ": " + bd(l.n) + " সারি (" + (l.note === "pressure" ? "জায়গার চাপে" : l.note === "count" ? "কার্ড সংখ্যা সীমা পেরোনোয়" : "সময় অনুযায়ী") + ")"; }).join("<br>") + "</div>" : '<p class="sm">এখনো কিছু মোছা হয়নি।</p>');
    V.innerHTML = h; V.onclick = click;
  }
  function read() {
    var o = { on: document.querySelector("#clOn").checked, others_on: document.querySelector("#clOth").checked };
    document.querySelectorAll("#view input[data-k]").forEach(function (i) { o[i.dataset.k] = Math.round(+i.value); if (/^cut[123]$/.test(i.dataset.k)) o[i.dataset.k] = Math.min(10, Math.max(1, o[i.dataset.k])); });
    var nu = document.querySelector("#clNU"); if (nu) { o.notify_url = nu.value.trim(); o.notify_email = (document.querySelector("#clNE") || { value: "" }).value.trim(); }
    return o;
  }
  function show(r) {
    return "মোট " + bd(r.size_mb) + " MB (" + bd(r.pct) + "%)। ভিজিট " + bd(r.mc2_visits || 0) + ", উত্তর " + bd(r.mc2_answers || 0) + ", অনলাইন-তালিকা " + bd(r.mc2_presence || 0) + ", কার্ড (সময়ে) " + bd(r.cards_age || 0) + ", কার্ড (চাপে) " + bd(r.cards_pressure || 0);
  }
  function click(e) {
    var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a;
    if (a === "aseen") { M.rpc("mc2_cleanup_alerts_seen").then(function () { return load().then(paint); }).catch(function (x) { say("❌ " + x.message, true); }); return; }
    if (a === "ntest") { M.rpc("mc2_cleanup_test_notify").then(function () { return load().then(function () { paint(); say("✅ টেস্ট বার্তা তৈরি হয়েছে — ওপরের তালিকায় দেখুন; ফোনে/মেইলে এলো কি না দেখুন (আগে 💾 সেভ করা লিংক ধরে পাঠায়)।"); }); }).catch(function (x) { say("❌ " + x.message, true); }); return; }
    if (a === "save") { M.rpc("mc2_cleanup_admin_set", { p_cfg: read() }).then(function () { say("✅ সেভ হয়েছে।"); return load().then(paint); }).catch(function (x) { say("❌ " + x.message, true); }); }
    if (a === "dry") { M.rpc("mc2_cleanup_admin_run", { p_dry: true }).then(function (r) { say("🔍 পরীক্ষা (সেভ করা সেটিং ধরে; কিছু মোছা হয়নি) — মুছত: " + show(r)); }).catch(function (x) { say("❌ " + x.message, true); }); }
    if (a === "run") { if (!confirm("এখনই সেভ করা নিয়মে একবার চালাবেন? (ছোট ব্যাচে মুছবে, ফেরত আসবে না)")) return; M.rpc("mc2_cleanup_admin_run", { p_dry: false }).then(function (r) { say("✅ চালানো হয়েছে — মুছেছে: " + show(r)); return load().then(paint); }).catch(function (x) { say("❌ " + x.message, true); }); }
  }
  function view() { M = window.MCA; MSG = ""; BAD = false; document.querySelector("#view").innerHTML = "⏳ লোড হচ্ছে…"; return load().then(paint); }
})();

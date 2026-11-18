// MC Explorer — "UI অন/অফ" হুক (ছোট ফাইল)। অ্যাডমিন > 🏠 হোম থেকে বন্ধ করা অংশ সাইটে লুকিয়ে দেয়।
// সেটিংস আসে mc2_settings-এর key 'ui_cfg' থেকে (পাবলিক-রিড)। না থাকলে/লোড না হলে সব আগের মতোই দেখায়।
// ফোনে কপি রাখে: mc2_ui (নাম বদলাবেন না)। app.js-এর showRules() window.MCUI.allOff() ব্যবহার করে।
(function () {
  var C = window.MC_CFG || {}, KEY = "mc2_ui", st = null;
  // চাবি -> যে অংশ লুকাবে (CSS selector)। অ্যাডমিন (admin-home.js) এই তালিকাই দেখায়।
  var MAP = {
    g_pzc: ".pzc", g_prize: "#pzb", g_ctbtn: "#ctBtn", g_fb: "#fbfab", g_chatlink: 'footer a[href="#anon"]', g_old: "#oldBtn",
    t_result: '#tabbar a[data-t="result"]', t_board: '#tabbar a[data-t="board"]', t_chat: '#tabbar a[data-t="chat"]', t_survey: '#tabbar a[data-t="survey"]',
    h_hero: ".hero", h_club: "#fc, #scc", h_photo: "#fp", h_info: "#rl", h_today: "#hbToday", h_top: "#hbTop", h_last: "#hbLast", h_chat: "#hbChat",
    r_prize: "#rlPrize", r_rules: "#rlRules", r_badge: "#rlBadges",
    b_photo: "#rbPhoto", b_share: "#sh", b_dl: "#sv", b_story: "#st", b_builder: "#cb", b_chal: "#ch", b_prize: ".ctbox", b_survey: "#rbSurvey", b_again: "#again", c_1: '#cnav button[data-v="0"]', c_2: '#cnav button[data-v="1"]', c_3: '#cnav button[data-v="2"]', q_thumb: "#mcui-none-qt", q_fade: "#mcui-none-qf"
  }; // q_thumb/q_fade: কুইজের ছোট-ছবি-আগে ও ধীরে-পরিষ্কার (অন/অফ; কোনো অংশ লুকায় না, app.js MCUI.off() দিয়ে পড়ে)
  var EXTRA = [ // একটা বন্ধ হলে পাশেরটা পুরো চওড়া, দুটোই বন্ধ হলে সারিটাই লুকানো
    ["b_share", "b_dl", ".two:has(#sh)", "#sh", "#sv"], ["b_survey", "b_again", ".two:has(#rbSurvey)", "#rbSurvey", "#again"], ["h_club", "h_photo", ".two2:has(#fc)", "#fc", "#fp"]
  ];
  function css() {
    var o = [], k, i, e;
    for (k in MAP) o.push("html.ui-x-" + k + " " + MAP[k].split(",").join(",html.ui-x-" + k + " ") + "{display:none!important}");
    for (i = 0; i < EXTRA.length; i++) {
      e = EXTRA[i];
      o.push("html.ui-x-" + e[0] + ".ui-x-" + e[1] + " " + e[2] + "{display:none!important}");
      o.push("html.ui-x-" + e[0] + " " + e[2] + " " + e[4] + "{grid-column:1/-1}");
      o.push("html.ui-x-" + e[1] + " " + e[2] + " " + e[3] + "{grid-column:1/-1}");
    }
    o.push("html.ui-x-board_off #tabbar a[data-t=\"board\"],html.ui-x-board_off #t3,html.ui-x-board_off #hbTop,html.ui-x-board_off #hbToday{display:none!important}"); // অ্যাডমিন > লিডারবোর্ড সেটিংস: পুরো লিডারবোর্ড বন্ধ
    o.push("html.ui-x-w_l1 #wnb,html.ui-x-w_l1 #wnh,html.ui-x-w_l2 #wnr{display:none!important}"); // হোমের বিজয়ী লাইন ১ (বাটন/স্ট্রিপ) ও লাইন ২ (শেষ ৫ জন তালিকা); লাইন ২ ডিফল্টে লুকানো
    for (k in MAP) o.push("html.ui-pending " + MAP[k].split(",").join(",html.ui-pending ") + "{visibility:hidden!important}"); // নতুন ভিজিটর: সেটিং আসা পর্যন্ত (সর্বোচ্চ ৪ সেকেন্ড) এই অংশগুলো লুকানো, যাতে আগে দেখা গিয়ে পরে হাইড না হয়
    o.push("html.ui-pending-pzc .pzc{visibility:hidden!important}");
  return o.join("\n");
  }
  var HM = {};
  // বিজয়ীর সংখ্যার লেখা ("প্রতি সপ্তাহে লটারির মাধ্যমে ৫ জন বিজয়ী"): অ্যাডমিন > 🏠 হোম > home_cfg.wc; ফাঁকা = "৫ জন"। জায়গাগুলো <span class="wcnt">।
  function wc() { var t = String((HM && HM.wc) || "").replace(/\s+/g, " ").trim().slice(0, 24); return t || "৫ জন"; }
  function applyWc() { try { var L = document.querySelectorAll(".wcnt"), t = wc(), i; for (i = 0; i < L.length; i++) if (L[i].textContent !== t) L[i].textContent = t; } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyWc); else applyWc();
  function applyHome(h) {
    HM = h && typeof h === "object" ? h : {}; var r = document.documentElement; applyWc();
    r.classList.toggle("ui-x-w_l1", HM.l1 === false); r.classList.toggle("ui-x-w_l2", HM.l2 !== true);
    try { document.dispatchEvent(new CustomEvent("mcui-home")); } catch (e) {}
  }
  function apply(off) {
    var h = document.documentElement, k;
    st = {}; (off || []).forEach(function (x) { if (MAP[x]) st[x] = 1; });
    for (k in MAP) h.classList.toggle("ui-x-" + k, !!st[k]);
  }
  var ORD = [0, 1, 2]; function setOrd(o) { var ok = Array.isArray(o) && o.length === 3 && [0, 1, 2].every(function (i) { return o.indexOf(i) >= 0; }); ORD = ok ? o.slice() : [0, 1, 2]; } // কার্ডের ক্রম: ডিজাইন-নম্বরের (০=নেভি মেডালিয়ন, ১=সবুজ উইনার, ২=গ্লাস রিং) তালিকা; ভুল/ফাঁকা হলে ০,১,২
  var DEF = null; function setDef(d) { DEF = (d === 0 || d === 1 || d === 2) ? d : null; } // অ্যাডমিন > হোম > ডিফল্ট কার্ড (০/১/২; ফাঁকা = অটো)
  var BO = false; function setBO(v) { BO = v === false; document.documentElement.classList.toggle("ui-x-board_off", BO); } var PK = false; function setPK(v) { PK = v === false; } var WN = false; function setWN(v) { WN = v === false; } var WCD = false; function setWCD(v) { WCD = v === false; } var WSC = false; function setWSC(v) { WSC = v === false; } var WPH = false; function setWPH(v) { WPH = v === false; }
  function allOff(a) { st = st || {}; return a.every(function (k) { return !!st[k]; }); }
  // পুরোনো সাইটের ঠিকানা (config.js > oldUrl) না বসানো থাকলে 🔒 পুরোনো সাইট বাটন ডিফল্টে লুকানো। ঠিকানা বসালে বাটন ফিরে আসে (অ্যাডমিন সুইচ আগের মতোই কাজ করে)।
  var HIDE_OLD = (C.oldUrl ? "" : "#oldBtn{display:none!important}\n");
  var s = document.createElement("style"); s.id = "mcui-css"; s.textContent = HIDE_OLD + css(); (document.head || document.documentElement).appendChild(s);
  var hadCache = false;
  try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); apply(c && c.off); applyHome(c && c.home); setBO(c && c.bo); setPK(c && c.pk); setWN(c && c.wn); setWCD(c && c.wcd); setWSC(c && c.wsc); setWPH(c && c.wph); setDef(c && c.def); setOrd(c && c.ord); hadCache = !!c; } catch (e) { apply([]); applyHome({}); }
  var pend = function () { var l = document.documentElement.classList; l.remove("ui-pending"); l.remove("ui-pending-pzc"); }; // সেটিং আসলে দুটোই সরে
  if (!hadCache && C.url && C.key) { document.documentElement.classList.add("ui-pending", "ui-pending-pzc"); setTimeout(function () { document.documentElement.classList.remove("ui-pending"); }, 1000); setTimeout(pend, 4000); } // নতুন ভিজিটর: লাল "এখানে ক্লিক" ট্যাগ সেটিং আসা পর্যন্ত (সর্বোচ্চ ৪ সেকেন্ড) লুকানো, বন্ধ থাকলে আর আসে না
  try { if (C.url) { var pc = document.createElement("link"); pc.rel = "preconnect"; pc.href = String(C.url).replace(/\/rest.*$/, "").replace(/\/$/, ""); pc.crossOrigin = ""; document.head.appendChild(pc); } } catch (e) {}
  window.MCUI = { def: function () { return DEF; }, ord: function () { return ORD.slice(); }, boardOff: function () { return BO; }, peekOff: function () { return PK; }, winOff: function () { return WN || (WCD && WSC); }, winCardOff: function () { return WCD; }, winScoreOff: function () { return WSC; }, winPhotoOff: function () { return WPH; }, home: function () { return HM; }, wc: wc, MAP: MAP, allOff: allOff, apply: apply, off: function (k) { return !!(st && st[k]); } };
  function load() {
    if (!(C.url && C.key)) return;
    fetch(String(C.url).replace(/\/$/, "") + "/rest/v1/mc2_settings?select=key,value&key=in.(ui_cfg,home_cfg,board_cfg)", { headers: { apikey: C.key, Authorization: "Bearer " + C.key } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (r) { if (!r) return; var u = r.filter(function (x) { return x.key === "ui_cfg"; })[0], hc = r.filter(function (x) { return x.key === "home_cfg"; })[0], v = u && u.value, home = hc && hc.value || {}, bc = r.filter(function (x) { return x.key === "board_cfg"; })[0], bo = bc && bc.value ? bc.value.board_on : true, pk = bc && bc.value ? bc.value.peek_on : true, wn = bc && bc.value ? bc.value.win_on : true, wcd = bc && bc.value ? bc.value.win_card_on : true, wsc = bc && bc.value ? bc.value.win_score_on : true, wph = bc && bc.value ? bc.value.win_photo_on : true; setBO(bo); setPK(pk); setWN(wn); setWCD(wcd); setWSC(wsc); setWPH(wph); var off = v && Array.isArray(v.off) ? v.off : [], def = v && typeof v.def === "number" ? v.def : null, ord = v && v.ord; apply(off); setOrd(ord); applyHome(home); setDef(def); try { localStorage.setItem(KEY, JSON.stringify({ off: off, home: home, bo: bo, pk: pk, wn: wn, wcd: wcd, wsc: wsc, wph: wph, def: def, ord: ORD })); } catch (e) {} })
      .catch(function () {}).then(pend);
  }
  load();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) load(); });
})();

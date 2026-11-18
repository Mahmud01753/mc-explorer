// অ্যাডমিন: "🏠 হোম" ট্যাব — সাইটের হোম/নিয়ম-পপআপ/ফল-কার্ডের প্রতিটি অংশ আলাদা অন/অফ। admin.js-এর আগে লোড হয় (সবার শেষের ট্যাব)।
// সেভ হয় mc2_settings-এর key 'ui_cfg' = {"off":[বন্ধ করা চাবির তালিকা]}; সাইটের ui-config.js এটা পাবলিকলি পড়ে। SQL: supabase-ui-settings.sql
(function () {
  var M = null, ST = null, HC = {};
  window.MCA_TABS = (window.MCA_TABS || []).concat([["home", "🏠 হোম"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { home: view });
  // [গ্রুপ, বর্ণনা, [[চাবি, লেবেল, ছোট ব্যাখ্যা], ...]]  — চাবিগুলো ui-config.js-এর সাথে মিলতে হবে
  var CN = ["🪪 নেভি মেডালিয়ন কার্ড", "🪪 সবুজ উইনার কার্ড", "🪪 গ্লাস রিং কার্ড"], CS = ["নেভি মেডালিয়ন কার্ড", "সবুজ উইনার কার্ড", "গ্লাস রিং কার্ড"]; // স্থায়ী নাম — CLAUDE.md-র তালিকার সাথে মিলতে হবে
  var G = [
    ["🎴 স্কোর কার্ড (৩টি ডিজাইন)", "প্রতিটি কার্ডের স্থায়ী নাম আছে (নাম কখনো বদলায় না); ▲▼ দিয়ে ক্রম সাজান — ফল-পাতার বাটন ১, ২, ৩ এই ক্রমেই দেখাবে। বন্ধ করা কার্ড ইউজার দেখবে না। অন্তত ১টি চালু রাখতে হবে", [
      ["c_1", CN[0], "ডিজাইন-কী: drawCard1 (ফাইলের নামে _3)"],
      ["c_2", CN[1], "ডিজাইন-কী: drawCard2 (ফাইলের নামে সাফিক্স নেই)"],
      ["c_3", CN[2], "ডিজাইন-কী: drawCard3 (ফাইলের নামে _2)"]]],
    ["🏠 হোম পেজ", "হোমের বক্স/তথ্য", [
      ["g_pzc", "👉 “পেইজে চোখ রাখুন — এখানে ক্লিক ›” বাটন", "লাল “এখানে ক্লিক” ট্যাগ (ফেসবুক পেইজ খোলে); বন্ধ করলে ব্যানার, ফুটার, নিয়ম পপ-আপ ও বিজয়ী পেজ — সব জায়গা থেকে লুকাবে"],
      ["h_hero", "ওপরের ব্যানার", "“তুমি এম.সি কতটুকু চেনো?” বড় লেখা ও ছবির স্ট্যাম্প"],
      ["h_club", "ক্লাব বাছাই", "ফর্মের ক্লাব ঘর (ঐচ্ছিক)"],
      ["h_photo", "নিজের ছবি দেওয়ার ঘর", "ফর্মের ছবি আপলোড ঘর (ঐচ্ছিক)"],
      ["h_info", "ℹ️ বিস্তারিত লিংক", "ফর্মের নিচের ছোট লিংক (নিয়ম পপ-আপ খোলে)"],
      ["h_today", "আজ কতজন খেলেছে বক্স", "“আজ ... জন খেলেছে / সেরা বিভাগ আজ”"],
      ["h_top", "আজকের শীর্ষ ৩ বক্স", "আজকের সেরা ৩ জন"],
      ["h_last", "“আগের কার্ড দেখো” বাটন", "আগে খেলে থাকলে আসে"],
      ["h_chat", "💬 বেনামি চ্যাট বাটন", "হোমের নিচের কমলা বাটন"]]],
    ["🧭 সব পেজে থাকা অংশ", "ওপর-নিচের ব্যানার ও লিংক", [
      ["g_prize", "🏆 ওপরের পুরস্কার ব্যানার", "“প্রতি সপ্তাহে ৫ জন বিজয়ী” বার"],
      ["g_ctbtn", "🎁 নিচের “শেয়ার করে পুরস্কার জিতুন” লিংক", "ফুটারের ফর্ম-খোলা লিংক"],
      ["g_chatlink", "ফুটারের 💬 Chat লিংক", ""],
      ["g_old", "ফুটারের 🔒 পুরোনো সাইট বাটন", ""]]],
    ["📘 ফেসবুক পেইজ বাটন", "চালু থাকলে কুইজ চলার সময় ছাড়া সব পেজে ভাসবে; অন্য কোনো সুইচ বন্ধ করলেও এটা লুকাবে না", [
      ["g_fb", "ভাসমান ফেসবুক পেইজ বাটন", "ডান-নিচের নীল বাটন (লিংক config.js-এর fbPage)"]]],
    ["🖼️ কুইজের ছবি", "ধীর নেটের জন্য; দুটোই ডিফল্টে চালু", [
      ["q_thumb", "ছোট ছবি আগে, পরে পূর্ণ কোয়ালিটি", "চালু: ধীর নেটে আগে ছোট কপি দেখায় ও টাইমার শুরু হয়, পূর্ণ ছবি নামলে বদলায়। বন্ধ: শুরু থেকেই পূর্ণ ছবি (নামা পর্যন্ত অপেক্ষা)"],
      ["q_fade", "ধীরে পরিষ্কার হওয়া (ফেড)", "চালু: পূর্ণ ছবি বসলে ০.৬ সেকেন্ডে ঝাপসা থেকে পরিষ্কার হয়। বন্ধ: হঠাৎ বদলায়। (ছোট ছবি আগে বন্ধ থাকলে এটার কাজ নেই)"]]],
    ["📑 নিচের মেনু ট্যাব", "হোম ট্যাব সবসময় থাকবে", [
      ["t_result", "🪪 আমার কার্ড ট্যাব", ""], ["t_board", "🏆 লিডারবোর্ড ট্যাব", ""], ["t_chat", "💬 চ্যাট ট্যাব", ""], ["t_survey", "📊 সার্ভে ট্যাব", ""]]],
    ["📜 খেলা শুরুর পর আসা লেখা (নিয়ম পপ-আপ)", "তিনটাই বন্ধ করলে পপ-আপ আসবে না, সরাসরি খেলা শুরু হবে", [
      ["r_prize", "🏆 পুরস্কার অংশ", "সাপ্তাহিক পুরস্কার, ফর্ম পূরণের ধাপ, ফেসবুক পেইজ ও জমা বাটন"],
      ["r_rules", "🎮 খেলার নিয়ম", "১০টি প্রশ্ন, সময়, নম্বর কাটার নিয়ম"],
      ["r_badge", "🏅 কত পেলে কোন ব্যাজ", "নিয়মের নিচের ব্যাজ তালিকা"]]],
    ["🪪 ফল-কার্ডের নিচের বাটন", "কার্ড দেখার পর যা আসে", [
      ["b_photo", "📷 কার্ডে নিজের ছবি দাও", ""],
      ["b_share", "📤 শেয়ার করো", ""],
      ["b_dl", "⬇️ ডাউনলোড", ""],
      ["b_story", "📸 স্টোরি সাইজ বানাও", "স্টোরি পপ-আপের ভেতরের শেয়ার/ডাউনলোড আলাদা চলবে"],
      ["b_chal", "⚔️ বন্ধুকে চ্যালেঞ্জ করো", ""],
      ["b_prize", "🎁 পুরস্কারের ফর্ম বক্স", "কার্ডের নিচের ও স্টোরি পপ-আপের ফর্ম-বক্স দুটোই"],
      ["b_survey", "📊 ২টা দ্রুত প্রশ্ন", ""],
      ["b_again", "🔁 আবার খেলো", ""]]]
  ];
  var css = "<style>.hm-sw{position:relative;display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--bd);cursor:pointer}.hm-sw:first-of-type{border-top:0}.hm-sw input{position:absolute;opacity:0;pointer-events:none}" +
    ".hm-sw i{flex:none;width:46px;height:26px;border-radius:99px;background:#9aa0a6;position:relative;transition:.15s}.hm-sw i:after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.15s}" +
    ".hm-sw input:checked+i{background:#1a73e8}.hm-sw input:checked+i:after{left:23px}.hm-sw input:focus-visible+i{outline:2px solid var(--o)}" +
    ".hm-sw span{flex:1;min-width:0}.hm-sw small{display:block;color:var(--mut);font-size:12px;line-height:1.3}.hm-sw b.st{flex:none;font-size:12px}.hm-g{margin-top:12px;padding-top:4px}.hm-g a[data-ga],.hm-g a[data-gz]{cursor:pointer}.hm-gm{color:#1a73e8;font-weight:700}@media(prefers-color-scheme:dark){.hm-sw input:checked+i{background:#5aa2ff}.hm-gm{color:#5aa2ff}}</style>";
  function load() {
    return M.A("mc2_settings?select=value&key=eq.ui_cfg").then(function (r) { var v = r[0] && r[0].value; ST.def = v && typeof v.def === "number" ? v.def : null; ST.ord = v && Array.isArray(v.ord) && v.ord.length === 3 && [0, 1, 2].every(function (i) { return v.ord.indexOf(i) >= 0; }) ? v.ord.slice() : [0, 1, 2]; return v && Array.isArray(v.off) ? v.off : []; });
  }
  function loadHome() { return M.A("mc2_settings?select=value&key=eq.home_cfg").then(function (r) { return (r[0] && r[0].value) || {}; }).catch(function () { return {}; }); }
  function homeBox() {
    var e = M.esc, on1 = HC.l1 !== false, on2 = HC.l2 === true, sw = function (id, on, t, s) { return "<label class='hm-sw'><input type='checkbox' id='" + id + "'" + (on ? " checked" : "") + "><i></i><span>" + t + "<small>" + s + "</small></span></label>"; };
    return "<div class='hm-g'><h2 style='margin-bottom:2px'>🏆 পুরস্কার ব্যানারের বিজয়ী-সংখ্যা</h2><p class='sm' style='margin:0 0 4px'>“প্রতি সপ্তাহে লটারির মাধ্যমে <b>৫ জন</b> বিজয়ী পুরস্কার পাবেন” লেখার বোল্ড অংশ। যা লিখবেন (যেমন: পাঁচজন, ৭ জন, তিনজন) ওপরের ব্যানার ও নিয়ম-পপআপে সেটাই বসবে। ফাঁকা রাখলে “৫ জন”। সংরক্ষণ চাপলে সাইটে বদলায়।</p>" +
      "<input id='hm_wc' maxlength='24' placeholder='যেমন: পাঁচজন (ফাঁকা = ৫ জন)' value='" + e(HC.wc || "") + "' style='width:100%;margin:2px 0'></div>" +
      "<div class='hm-g'><h2 style='margin-bottom:2px'>🎯 নিয়মের পপ-আপ — দিনে কতবার</h2><p class='sm' style='margin:0 0 4px'>খেলা শুরুর আগে নিয়মের পপ-আপ একজন ইউজারকে (একই ফোনে) দিনে সর্বোচ্চ যতবার দেখানো হবে। সীমা পূরণ হলে পপ-আপ ছাড়াই সরাসরি খেলা শুরু হয়; “ℹ️ বিস্তারিত” চাপলে সবসময় খোলে। সীমা বন্ধ করলে আগের মতো প্রতিবার দেখাবে। ডিফল্ট: চালু, ৩ বার। সংরক্ষণ চাপলে সাইটে বদলায়।</p>" +
      sw("hm_rl", !(HC.rl && HC.rl.on === false), "সীমা চালু", "ডিফল্ট: চালু") + "<input id='hm_rn' type='number' min='1' max='20' placeholder='দিনে সর্বোচ্চ কতবার (১–২০; ডিফল্ট ৩)' value='" + e((HC.rl && +HC.rl.max) || 3) + "' style='width:100%;margin:2px 0'></div>" +
      "<div class='hm-g'><h2 style='margin-bottom:2px'>🏅 হোমের বিজয়ী লাইন</h2><p class='sm' style='margin:0 0 4px'>পুরস্কার ব্যানারের নিচের দুই অংশ আলাদা অন/অফ ও লেখা বদল। লেখায় ইমোজি/যেকোনো নাম দিতে পারেন; ফাঁকা রাখলে আগের লেখা। সংরক্ষণ চাপলে সাইটে বদলায়।</p>" +
      sw("hm_l1", on1, "লাইন ১ — বিজয়ী বাটন/স্ট্রিপ", "ডিফল্ট: চালু") + "<input id='hm_t1' maxlength='60' placeholder='বাটনের নাম (ডিফল্ট: বিজয়ীদের তালিকা)' value='" + e(HC.t1 || "") + "' style='width:100%;margin:2px 0 8px'>" +
      sw("hm_l2", on2, "লাইন ২ — সিরিয়াল-নামের তালিকা (শেষ ৫ জন)", "ডিফল্ট: বন্ধ (লুকানো)") + "<input id='hm_t2' maxlength='60' placeholder='তালিকার শিরোনাম (ডিফল্ট: 🏅 শেষ ৫ জন বিজয়ী)' value='" + e(HC.t2 || "") + "' style='width:100%;margin:2px 0'></div>" +
      "<div class='hm-g'><h2 style='margin-bottom:2px'>🎞️ পুরস্কার ব্যানারের নিচের চলমান লেখা</h2><p class='sm' style='margin:0 0 4px'>ব্যানারের নিচের লাইনে কুইজের তারিখ ও বিজয়ীদের নাম ধীরে ধীরে চলে। ফাঁকা ঘর = সর্বশেষ বিজয়ী ঘোষণা থেকে অটো (লেখা = শিরোনাম, তারিখ = ড্র-এর তারিখ, নাম = বিজয়ীরা)। বন্ধ করলে আগের স্থির লেখা দেখাবে।</p>" +
      sw("hm_mq", HC.mq !== false, "চলমান লেখা", "ডিফল্ট: চালু") + "<input id='hm_mt' maxlength='40' placeholder='লেখা (যেমন: 🏆 সাপ্তাহিক কুইজ বিজয়ী)' value='" + e(HC.mt || "") + "' style='width:100%;margin:2px 0'>" +
      "<input id='hm_md' maxlength='30' placeholder='তারিখ (যেমন: ১৮ অক্টোবর ২০২৬)' value='" + e(HC.md || "") + "' style='width:100%;margin:2px 0'>" +
      "<input id='hm_mn' maxlength='200' placeholder='বিজয়ীদের নাম, কমা দিয়ে (যেমন: রাহুল, সুমি, করিম)' value='" + e(HC.mn || "") + "' style='width:100%;margin:2px 0'>" +
      "<input id='hm_ms' type='number' min='5' max='300' placeholder='গতি: একবার ঘুরতে কত সেকেন্ড (৫–৩০০; বেশি = ধীর; ফাঁকা = অটো ধীর)' value='" + (HC.ms ? e(HC.ms) : "") + "' style='width:100%;margin:2px 0'></div>";
  }
  function saveHome() {
    var ms = Math.round(+M.$("#hm_ms").value || 0); if (ms && (ms < 5 || ms > 300)) return Promise.reject(new Error("গতি ৫ থেকে ৩০০ সেকেন্ডের মধ্যে দিন (অথবা ফাঁকা রাখুন)"));
    var v = { l1: M.$("#hm_l1").checked, l2: M.$("#hm_l2").checked, t1: M.$("#hm_t1").value.trim(), t2: M.$("#hm_t2").value.trim(), mq: M.$("#hm_mq").checked, mt: M.$("#hm_mt").value.trim(), md: M.$("#hm_md").value.trim(), mn: M.$("#hm_mn").value.trim(), ms: ms || null, wc: M.$("#hm_wc").value.trim().slice(0, 24), rl: { on: M.$("#hm_rl").checked, max: Math.max(1, Math.min(20, Math.round(+M.$("#hm_rn").value || 3))) } };
    return M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "home_cfg", value: v }]) }).then(function () { HC = v; });
  }
  function collect() { var off = []; [].forEach.call(document.querySelectorAll("#hmv [data-k]"), function (c) { if (!c.checked) off.push(c.dataset.k); }); return off; }
  function paint() {
    var e = M.esc;
    var h = css + "<h2>🏠 হোম ও সাইটের অন/অফ সুইচ</h2><p class='sm'>সুইচ <b>চালু = সাইটে দেখাবে</b>, বন্ধ = লুকাবে। সেভ করলে সাইটে সর্বোচ্চ কয়েক সেকেন্ডের মধ্যে (পেজ খুললে/ফিরলে) বদলে যাবে। কিছু না ছুঁলে সব আগের মতোই থাকে।</p>" +
      "<div class='act'><button type='button' id='hmsv'>💾 সংরক্ষণ</button><button type='button' class='l' id='hmon'>সব চালু</button><button type='button' class='l' id='hmoff'>সব বন্ধ</button><button type='button' class='l' id='hmpub'>🌐 পাবলিক পড়া পরীক্ষা</button></div><p class='sm' id='hmm'></p>" + homeBox() + "<div id='hmv'>";
    G.forEach(function (g, gi) {
      h += "<div class='hm-g'><h2 style='margin-bottom:2px'>" + e(g[0]) + "</h2><p class='sm' style='margin:0 0 4px'>" + e(g[1]) + " · <a href='#' data-ga='" + gi + "'>সব চালু</a> · <a href='#' data-gz='" + gi + "'>সব বন্ধ</a> <span class='hm-gm' data-gm='" + gi + "'></span></p>";
      (gi === 0 ? (ST.def == null ? ST.ord : [defNow()].concat(ST.ord.filter(function (i) { return i !== defNow(); }))).map(function (i) { return g[2][i]; }) : g[2]).forEach(function (x) {
        h += "<label class='hm-sw'><input type='checkbox' data-k='" + x[0] + "'" + (ST.off.indexOf(x[0]) < 0 ? " checked" : "") + "><i></i><span>" + e(x[1]) + (x[2] ? "<small>" + e(x[2]) + "</small>" : "") + "</span>" + (gi === 0 ? "<b class='cpos' style='flex:none;font-size:12px'></b><button type='button' class='l' data-mv='-1' style='padding:2px 10px'>▲</button><button type='button' class='l' data-mv='1' style='padding:2px 10px'>▼</button>" : "") + "<b class='st'></b></label>";
      });
      if (gi === 0) h += "<div style='padding:8px 0 4px;border-top:1px solid var(--bd)'><b>⭐ অটো ডিফল্ট</b> <select id='hm_mode' style='margin-left:6px'><option value='auto'" + (ST.def == null ? " selected" : "") + ">অটো (১ নম্বরে যেটা থাকবে সেটাই ডিফল্ট)</option><option value='custom'" + (ST.def == null ? "" : " selected") + ">কাস্টম (নিজে বাছব)</option></select> <span id='hm_defw'" + (ST.def == null ? " hidden" : "") + "><b style='margin-left:6px'>ডিফল্ট:</b> <select id='hm_def' style='margin-left:4px'>" + [["0", CS[0]], ["1", CS[1]], ["2", CS[2]]].map(function (o) { return "<option value='" + o[0] + "'" + (String(defNow()) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></span> <button type='button' class='l' id='hmrestore' style='margin-left:6px'>↩️ পছন্দের ক্রমে ফিরুন</button><small style='display:block;color:var(--mut);font-size:12px;line-height:1.3;margin-top:4px'>১ নম্বর কার্ডই সবসময় ডিফল্ট: ফল-পাতায় আগে দেখায়, সার্ভারে জমা হয়, আর “আগের কার্ড দেখো”-তেও এটাই আঁকে। <b>অটো</b>: ▲▼ দিয়ে যে কার্ড ১ নম্বরে আনবেন সেটাই ডিফল্ট (বন্ধ থাকলে পরের চালু কার্ড)। <b>↩️ পছন্দের ক্রমে ফিরুন</b>: ক্রম আবার ১ নেভি মেডালিয়ন → ২ সবুজ উইনার → ৩ গ্লাস রিং হয়ে যায় ও মোড অটো হয় (কার্ড অন/অফ বদলায় না); তারপর সংরক্ষণ চাপুন। <b>কাস্টম</b>: ডিফল্ট কার্ড নিজে বাছবেন, সেটা ১ নম্বরে বসে যায় ও ▲▼ দিয়ে সরানো যায় না; বাকি দুটোর ক্রম ▲▼ দিয়ে বদলান। বন্ধ কার্ড কাস্টম ডিফল্ট করা যাবে না।</small></div>";
      h += "</div>";
    });
    h += "</div><div class='act' style='margin-top:12px'><button type='button' id='hmsv2'>💾 সংরক্ষণ</button></div>";
    M.$("#view").innerHTML = h; sync();
  }
  function defNow() { var on = ST.ord.filter(function (i) { return ST.off.indexOf("c_" + (i + 1)) < 0; }); return ST.def != null && on.indexOf(ST.def) >= 0 ? ST.def : (on.length ? on[0] : ST.ord[0]); } // ডিফল্ট = বাছা (চালু থাকলে), নইলে সাজানো ক্রমে চালু থাকা প্রথমটা
  function ordNow() { return [].map.call(document.querySelectorAll("#hmv [data-k^='c_']"), function (c) { return +c.dataset.k.slice(2) - 1; }); }
  function sync() { var p = 0; [].forEach.call(document.querySelectorAll("#hmv [data-k^='c_']"), function (c) { var b = c.closest("label").querySelector(".cpos"); if (b) { b.textContent = c.checked ? "ক্রম " + String(++p).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }) : "বন্ধ"; b.style.color = c.checked ? "#1a73e8" : "#9aa0a6"; } }); [].forEach.call(document.querySelectorAll("#hmv [data-k]"), function (c) { var b = c.closest("label").querySelector(".st"); b.textContent = c.checked ? "চালু" : "বন্ধ"; b.style.color = c.checked ? "#1a73e8" : "#9aa0a6"; }); }
  function msg(t, bad) { var m = M.$("#hmm"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  // সাইট যেভাবে পড়ে (শুধু anon কী, লগইন ছাড়া) ঠিক সেভাবে পড়ে দেখায় — পাবলিক-রিড সত্যিই চলছে কি না
  function pubCheck() {
    var C = window.MC_CFG || {};
    return fetch(String(C.url).replace(/\/$/, "") + "/rest/v1/mc2_settings?select=key,value&key=eq.ui_cfg", { headers: { apikey: C.key, Authorization: "Bearer " + C.key } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (r) { if (!r.length) throw new Error("ui_cfg সারি নেই"); return r[0].value.off || []; });
  }
  function save() {
    var off = collect();
    if (off.indexOf("c_1") >= 0 && off.indexOf("c_2") >= 0 && off.indexOf("c_3") >= 0) { msg("❌ ৩টি স্কোর কার্ডই বন্ধ করা যাবে না — অন্তত ১টি চালু রাখুন। সেভ হয়নি।", true); return; }
    var def = M.$("#hm_mode") && M.$("#hm_mode").value === "custom" ? +M.$("#hm_def").value : null;
    if (def !== null && off.indexOf("c_" + (def + 1)) >= 0) { msg("❌ " + CS[def] + " বন্ধ — বন্ধ কার্ড ডিফল্ট করা যাবে না। আগে চালু করুন বা ডিফল্ট “অটো” রাখুন। সেভ হয়নি।", true); return; }
    var ord = ordNow(); if (def !== null && ord[0] !== def) ord = [def].concat(ord.filter(function (i) { return i !== def; })); msg("⏳ সংরক্ষণ হচ্ছে…");
    M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "ui_cfg", value: { off: off, def: def, ord: ord } }]) })
      .then(function () { ST.off = off; ST.def = def; ST.ord = ord; return saveHome(); })
      .then(function () { return pubCheck(); })
      .then(function (p) { msg("✅ সংরক্ষিত (" + off.length + "টি অংশ বন্ধ)। পাবলিক পরীক্ষা: সাইট ঠিকঠাক পড়তে পারছে (" + p.length + "টি বন্ধ দেখছে)।"); })
      .catch(function (e) { msg("❌ সেভ/পরীক্ষা হয়নি: " + e.message + " — supabase-ui-settings.sql ও supabase-new-20261018f.sql চালানো হয়েছে কি না দেখুন।", true); });
  }
  function view() {
    M = window.MCA; ST = { off: [] };
    return Promise.all([load(), loadHome()]).then(function (a) { var off = a[0]; HC = a[1] || {}; ST.off = off; paint();
      var v = M.$("#view");
      v.onclick = function (e) {
        var t = e.target.closest("button,a"); if (!t) return;
        if (t.id === "hmrestore") { var rs = [].slice.call(document.querySelectorAll("#hmv label.hm-sw")).filter(function (x) { return x.querySelector("[data-k^='c_']"); }).sort(function (a, b) { return a.querySelector("[data-k]").dataset.k < b.querySelector("[data-k]").dataset.k ? -1 : 1; }), par = rs[0].parentNode, nx = rs[rs.length - 1].nextSibling; rs.forEach(function (x) { par.insertBefore(x, nx); }); M.$("#hm_mode").value = "auto"; M.$("#hm_defw").hidden = true; sync(); msg("↩️ ক্রম ফেরানো হয়েছে: ১ নেভি মেডালিয়ন, ২ সবুজ উইনার, ৩ গ্লাস রিং (অটো) — সংরক্ষণ চাপুন।"); return; }
        if (t.dataset.mv) { var lb = t.closest("label"), sib = +t.dataset.mv < 0 ? lb.previousElementSibling : lb.nextElementSibling; e.preventDefault(); var rows = [].slice.call(document.querySelectorAll("#hmv label.hm-sw")).filter(function (x) { return x.querySelector("[data-k^='c_']"); }); if ((lb === rows[0] || sib === rows[0]) && M.$("#hm_mode").value === "custom") { msg("⭐ ১ নম্বর ডিফল্ট কার্ডের জায়গা। অন্য কার্ডকে ১ নম্বরে আনতে “ডিফল্ট” বদলান, অথবা “অটো ডিফল্ট” বেছে নিন।", true); return; } if (sib && sib.querySelector("[data-k^='c_']")) { if (+t.dataset.mv < 0) lb.parentNode.insertBefore(lb, sib); else lb.parentNode.insertBefore(sib, lb); sync(); msg("ক্রম বদলানো হয়েছে — সংরক্ষণ চাপুন।"); } return; }
        if (t.id === "hmsv" || t.id === "hmsv2") save();
        else if (t.id === "hmon" || t.id === "hmoff") { var allOn = t.id === "hmon"; [].forEach.call(document.querySelectorAll("#hmv [data-k]"), function (c) { c.checked = allOn; }); sync(); msg(allOn ? "সব চালু করা হলো — সংরক্ষণ চাপুন।" : "সব বন্ধ করা হলো — সংরক্ষণ চাপুন।"); }
        else if (t.id === "hmpub") { msg("⏳ পরীক্ষা হচ্ছে…"); pubCheck().then(function (p) { msg("✅ সাইট (লগইন ছাড়া) সেটিংস পড়তে পারছে। এখন " + p.length + "টি অংশ বন্ধ।"); }).catch(function (er) { msg("❌ পাবলিক পড়া যায়নি: " + er.message + " — supabase-ui-settings.sql চালান।", true); }); }
        else if (t.dataset.ga != null || t.dataset.gz != null) { e.preventDefault(); var gi = t.dataset.ga != null ? t.dataset.ga : t.dataset.gz, on = t.dataset.ga != null; G[gi][2].forEach(function (x) { var c = document.querySelector("#hmv [data-k='" + x[0] + "']"); if (c) c.checked = on; }); sync(); var gm = document.querySelector("#hmv [data-gm='" + gi + "']"); if (gm) gm.textContent = on ? "✔ সব চালু করা হলো — সংরক্ষণ চাপুন" : "✔ সব বন্ধ করা হলো — সংরক্ষণ চাপুন"; msg(on ? "সব চালু করা হলো — সংরক্ষণ চাপুন।" : "সব বন্ধ করা হলো — সংরক্ষণ চাপুন।"); }
      };
      v.onchange = function (e) {
        if (e.target.id === "hm_mode") { var cu = e.target.value === "custom", w = M.$("#hm_defw"); if (w) w.hidden = !cu; if (cu) { var fr = document.querySelector("#hmv label.hm-sw input[data-k^='c_']"), cur = [].slice.call(document.querySelectorAll("#hmv [data-k^='c_']")).filter(function (c) { return c.checked; })[0] || fr; M.$("#hm_def").value = String(+cur.dataset.k.slice(2) - 1); M.$("#hm_def").dispatchEvent(new Event("change", { bubbles: true })); } else msg("অটো: ১ নম্বরে যে কার্ড থাকবে সেটাই ডিফল্ট — সংরক্ষণ চাপুন।"); return; }
        if (e.target.id === "hm_def") { var k = "c_" + (+e.target.value + 1), lb = document.querySelector("#hmv [data-k='" + k + "']").closest("label"), first = document.querySelector("#hmv label.hm-sw"); if (first !== lb) lb.parentNode.insertBefore(lb, first); sync(); msg("⭐ ডিফল্ট বদলানো হয়েছে, কার্ডটি ১ নম্বরে উঠেছে — সংরক্ষণ চাপুন।"); return; }
        if (e.target.matches("[data-k]")) sync();
      };
    });
  }
})();

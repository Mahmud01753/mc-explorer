// অ্যাডমিন: "🧭 শুরু করুন" — ধাপ-ফিতা, ? সাহায্য, ট্যাবের ব্যাখ্যা ও রং (ধাপ ০ ভাগ ১: ০.১–০.৪)
// SQL লাগে না। admin.js বদলানো হয়নি। এই ফাইল না থাকলে অ্যাডমিন আগের মতোই চলে।
// লোড-ক্রম: admin-home.js-এর পরে, admin.js-এর আগে। সব ট্যাব সবসময় দেখা যায়।
(function () {
  "use strict";
  var MK = "mc2_adm_mode";
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  function getMode() { return "full"; } // সহজ/বিস্তারিত বাটন সরানো হয়েছে; সবসময় সব ট্যাব

  // ট্যাব-কী -> [গ্রুপ, এক লাইনের ব্যাখ্যা, সাহায্যের লাইনগুলো]
  var G = { q: ["কুইজ ও ছবি", "#1d6b43"], r: ["ফলাফল ও ইউজার", "#2b6cb0"], p: ["পুরস্কার ও বিজয়ী", "#d98200"], c: ["চ্যাট", "#7b3fa0"], s: ["সাইট ও জায়গা", "#5a6b61"] };
  var I = {
    hub: ["q", "এখান থেকে ধাপে ধাপে কাজ শুরু করুন।", ["ওপরের ধাপগুলো ক্রমে করুন, বা যেকোনো ধাপের বাটনে চাপুন।"]],
    dash: ["q", "আজ কতজন খেলল, কতজন অনলাইন — এক নজরে।", ["এটা শুধু দেখার পাতা, এখানে কিছু বদলাতে হয় না।"]],
    gal: ["q", "কুইজের ছবি যোগ করুন, নাম বদলান, ছবি বদলান বা মুছুন।", ["একসাথে অনেক ছবি আপলোড করা যায়।", "প্রতিটি ছবির নামই কুইজের সঠিক উত্তর।", "মোছার আগে নিশ্চিত করতে বলবে।"]],
    set: ["q", "কুইজে কয়টা প্রশ্ন, কোন ধরনের ছবি, কার্ডের সাইজ — এসব ঠিক করুন।", ["বদলানোর পর নিচের সেভ বাটনে চাপুন।", "না বুঝলে যেমন আছে তেমন রেখে দিন।"]],
    qs: ["q", "ছবি থেকে নিজে নিজে বানানো প্রশ্নগুলো দেখুন।", ["প্রশ্ন ছবির নাম থেকে নিজে বানায়, তাই ছবি বদলালে প্রশ্নও বদলায়।"]],
    res: ["r", "কে কত নম্বর পেল, র‍্যাংক কত।", ["বিভাগ, সেশন, তারিখ বা নাম দিয়ে খুঁজুন।", "এক্সেল-ফাইল বাটনে তালিকা ডাউনলোড করা যায়।"]],
    ans: ["r", "প্রতিটি খেলায় কোন ছবিতে কী উত্তর দিল, সঠিক না ভুল।", ["এক খেলার সব উত্তর মোছার বাটনও এখানে।", "সঠিক/ভুল সার্ভার নিজে যাচাই করে রাখে।"]],
    board: ["r", "লিডারবোর্ডে কাকে দেখাবেন, কাকে লুকাবেন।", ["লুকালে সাইটের বোর্ড থেকে সরে, তবে ডেটা থাকে।"]],
    logo: ["s", "কার্ডের বাম-ডান লোগো বদলান, অন/অফ করুন, নতুন লোগো আপলোড করুন।", ["লোগো অফ করলে ওই জায়গায় আপনার দেওয়া অক্ষর (ডিফল্ট M ও C) বসে।", "আপলোড করা লোগো তালিকায় থাকে; যখন ইচ্ছা বামে/ডানে বদলানো যায়।"]],
    cards: ["r", "খেলোয়াড়দের জমা হওয়া কার্ড দেখুন ও ডাউনলোড করুন।", ["টপ ৩-এ ছবি না দেখাতে চাইলে এখান থেকে লুকান।"]],
    usr: ["r", "কে কে সাইটে এসেছে, কে এখন অনলাইন।", ["নামে চাপলে ওই ইউজারের পুরো তথ্য খোলে।"]],
    score: ["r", "সব খেলার স্কোরের তালিকা।", ["ফিল্টার দিয়ে খুঁজে নিন।"]],
    visit: ["r", "সাইটে কে ঢুকেছে, কোন দেশ থেকে, কোন ফোনে।", ["ওপরের বক্সে এই মুহূর্তে কারা অনলাইন তা দেখা যায়।"]],
    prize: ["p", "শেয়ার করে ফর্ম দিয়েছে যারা, তাদের তালিকা ও লটারি।", ["🎰 বাটনে লটারি চলে।", "আগে জেতা কেউ আবার জেতে না।"]],
    win: ["p", "বিজয়ী ঘোষণা সাইটে দেখান বা লুকান।", ["ঘোষণা সেভ করলে তবেই সাইটে যায়।", "প্রতিটি ঘোষণা আলাদা করে দেখানো বা লুকানো যায়।"]],
    pn: ["p", "বিজয়ীকে পুরস্কার দেওয়া হলো কি না, আর নিজের নোট।", ["এই নোট শুধু আপনি দেখেন, সাইটে যায় না।"]],
    ac: ["c", "চ্যাটের বিভাগ ও সেশন ঠিক করুন, বার্তা লুকান বা মুছুন।", ["বিভাগ বা সেশন বন্ধ করলে সেখানে নতুন বার্তা যায় না।"]],
    acs: ["c", "চ্যাটের বিভাগ ও সেশন যোগ, নাম বদল, চালু-বন্ধ, মোছা, আর পাসওয়ার্ড লক (এক সেশনে, এক বিভাগে বা সবখানে)।", ["একসাথে লক দিতে আগে নতুন SQL একবার চালাতে হয়।"]],
    acm: ["c", "চ্যাটের বার্তা লুকান বা মুছুন, আর মোছার সময় ঠিক করুন।", ["এখনই মুছুন ও স্বয়ংক্রিয় মোছা মডারেশন ট্যাবে; বাটন এখান থেকে সেখানে নিয়ে যায়।"]],
    mod: ["c", "রিপোর্ট দেখুন, সতর্ক করুন, সাময়িক বন্ধ বা ব্যান করুন।", ["স্থায়ী ব্যানের জন্য আগে যাচাই লাগে।", "ব্যান ডিভাইস ধরে হয়।"]],
    chat: ["c", "পুরোনো চ্যাট ট্যাব।", ["নতুন চ্যাটের কাজ \"বেনামি চ্যাট\" ও \"মডারেশন\" ট্যাবে।"]],
    home: ["s", "সাইটের হোম পেজে কোন অংশ দেখাবে, তা অন-অফ করুন।", ["বদলানোর পর সেভ বাটনে চাপুন।"]],
    clean: ["s", "জায়গা কত ভরা, আর পুরোনো ডেটা নিজে নিজে মোছার নিয়ম।", ["০ মানে \"কখনো মুছবে না\"।"]],
    bin: ["s", "জায়গার মিটার, টিক দিয়ে ডিলিট, আর বিন থেকে ফেরত আনা।", ["বিনে যাওয়া জিনিস ফেরত আনা যায়।"]],
    wcs: ["p", "বিজয়ী কার্ডে কী কী দেখাবে (কার্ড, স্কোর, ছবি) তার সুইচ ও কার্ডের পছন্দ ঠিক করুন।", ["বদলানোর পর সেভ বাটনে চাপুন।", "বিজয়ীদের কার্ড বাছাই 🏅 বিজয়ী ঘোষণা ট্যাবে হয়।"]],
    survey: ["r", "সার্ভের অপশন (জায়গা) যোগ করুন, নাম বদলান, ক্রম ঠিক করুন, লুকান বা মুছুন; আর কে কোনটায় ভোট দিল তার হিসাব দেখুন।", ["মোছার আগে নিশ্চিত করতে বলবে।"]],
    social: ["p", "ফেসবুক/ইনস্টাগ্রামের জন্য বিজয়ী পোস্ট (১০৮০×১৩৫০) ও স্টোরি (১০৮০×১৯২০) বানান: দৈনিক, সাপ্তাহিক, মাসিক, বিভাগ/সেশন-ভিত্তিক, লাকি ড্র, উন্নতি, নতুন রেকর্ড, বিভাগ বনাম বিভাগ, অংশগ্রহণ, ধন্যবাদ, রিমাইন্ডার; সময়: শেষ ৩/৭/৩০ বা নিজের দিন সংখ্যা, থেকে–পর্যন্ত তারিখ।", ["ধরন, টেমপ্লেট (ঘোষণা/স্কোর বোর্ড/র‍্যাংক), মাপ ও সময় বাছুন; প্রতিটি উপাদান আলাদা সুইচে চালু-বন্ধ।", "ছবি ফোনেই আঁকা হয়, সার্ভারে কিছু জমে না; আইপি/ফোন/ডিভাইস কার্ডে কখনো আসে না।"]],
    qimg: ["q", "কুইজের ছবি কীভাবে, কত সময়ে আর কোন কোণ থেকে খুলবে — এসব ঠিক করুন।", ["বদলানোর পর সেভ বাটনে চাপুন; নতুন খেলায় চালু হবে।", "না বুঝলে \"সব ডিফল্টে ফেরান\" চাপলে আগের মতো হয়।"]]
  };
  // মূল ট্যাব (শুধু চিহ্ন; কোনো ট্যাব লুকায় না)
  var CORE = { hub: 1, dash: 1, gal: 1, set: 1, res: 1, prize: 1, win: 1, mod: 1 };
  // ধাপ-ফিতা
  var STEPS = [
    ["gal", "ছবি দিন", "কুইজের ছবি আপলোড করুন।"],
    ["set", "কুইজ ঠিক করুন", "কয়টা প্রশ্ন হবে ঠিক করুন।"],
    ["res", "ফলাফল দেখুন", "কে কত পেল দেখুন।"],
    ["prize", "লটারি করুন", "ফর্ম-জমাদের মধ্য থেকে বিজয়ী বাছুন।"],
    ["win", "বিজয়ী ঘোষণা", "বিজয়ী সাইটে দেখান।"]
  ];

  var T = window.MCA_TABS = window.MCA_TABS || [];
  if (!T.some(function (t) { return t[0] === "hub"; })) T.unshift(["hub", "🧭 শুরু করুন"]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { hub: view });

  var css = document.createElement("style");
  css.textContent =
    ".tabs button.mcg-q{border-left:4px solid #1d6b43}.tabs button.mcg-r{border-left:4px solid #2b6cb0}.tabs button.mcg-p{border-left:4px solid #d98200}.tabs button.mcg-c{border-left:4px solid #7b3fa0}.tabs button.mcg-s{border-left:4px solid #5a6b61}" +
    "#mcBar{margin-top:10px;display:grid;gap:6px}#mcBar .mcx{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:8px 10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between}" +
    "#mcBar .mcg{font-size:12px;font-weight:700;color:#fff;border-radius:999px;padding:1px 9px}" +
    ".mcr{display:flex;gap:6px;overflow-x:auto;padding:2px 0;-webkit-overflow-scrolling:touch}.mcr button{flex:0 0 auto;background:var(--card);color:var(--fg);border:1px solid var(--bd);min-height:40px;white-space:nowrap}.mcr button.on{background:var(--g);color:#fff}" +
    ".mcs{display:grid;gap:8px}.mcs .it2{border:1px solid var(--bd);border-radius:12px;padding:10px;display:flex;gap:10px;align-items:center}.mcs .n{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center;font-weight:800}" +
    "#mcQ{position:fixed;right:14px;bottom:16px;z-index:50;width:48px;height:48px;border-radius:50%;padding:0;font-size:22px;box-shadow:0 2px 8px #0005}" +
    "#mcDlg{position:fixed;inset:0;z-index:60;background:#0008;display:grid;place-items:center;padding:14px}#mcDlg .b{background:var(--card);color:var(--fg);border-radius:14px;max-width:460px;width:100%;max-height:85vh;overflow:auto;padding:14px;display:grid;gap:8px}#mcDlg li{margin:4px 0}";
  document.head.appendChild(css);

  function nextOf(k) { for (var i = 0; i < STEPS.length - 1; i++) if (STEPS[i][0] === k) return [STEPS[i + 1][0], STEPS[i + 1][1]]; return null; }
  function go(key) {
    var b = document.querySelector('#tabs [data-t="' + key + '"]');
    if (b) b.click();
  }
  window.MCA_HUB = { next: function (k) { return nextOf(k); }, go: function (k) { go(k); }, cur: function () { return cur(); } };
  function cur() { var b = document.querySelector("#tabs button.on"); return b ? b.dataset.t : "hub"; }
  function ribbon(k) {
    return '<div class="mcr">' + STEPS.map(function (s, i) {
      return '<button type="button" class="s' + (s[0] === k ? " on" : "") + '" data-go="' + s[0] + '">' + bn(i + 1) + ". " + s[1] + "</button>";
    }).join("") + "</div>";
  }
  // ---------- ✅ সব ঠিক আছে? (ধাপ ২.৩) — শুধু পড়ে, কিছু লেখে না, SQL লাগে না ----------
  // sql-status.md ওপর থেকে নিচে পড়া: "# ⚠️"/"# ⏳" লাইন (✅ ছাড়া) = বাকি SQL; প্রথম "# ✅" লাইনে থামে (সেটা বলে নিচের সব চালানো)।
  // সেটিং: mc2_settings-এ key না থাকলে = "ফাঁকা" (সাইট ডিফল্টে চলছে)। কোনোটা পড়া না গেলে নিজে থেকে কিছু দাবি করে না।
  var CFGK = [["quiz_count", "⚙️ কুইজে প্রশ্নের সংখ্যা"], ["ui_cfg", "🏠 হোম বাটন অন-অফ"], ["home_cfg", "🏠 হোমের বিজয়ী লাইন"], ["board_cfg", "🏆 লিডারবোর্ড সেটিংস"], ["card_cfg", "🪪 কার্ডের সাইজ"], ["logo_cfg", "🖼️ লোগো"], ["qimg_cfg", "🖼 কুইজ ছবির সেটিং"]];
  var escH = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function sqlPending(txt) {
    var out = [], L = String(txt || "").split(/\r?\n/), i, s, f, u;
    for (i = 0; i < L.length && i < 80; i++) {
      s = L[i].trim(); if (!s) continue;
      if (s.charAt(0) !== "#" || /^#\s*✅/.test(s)) break;
      if (/^#\s*\(আগের লাইন/.test(s)) continue;
      if (/^#\s*(⚠|⏳)/.test(s) && s.indexOf("✅") < 0) {
        f = s.match(/supabase-[A-Za-z0-9._-]+\.sql/g) || []; u = f.filter(function (x, j) { return f.indexOf(x) === j; });
        out.push({ f: u, t: s.replace(/^#\s*(⚠️?|⏳)\s*/, "").slice(0, 260) });
      }
    }
    return out;
  }
  function okHtml(sq, keys) {
    var g = "color:var(--g);font-weight:700", r = "color:var(--red);font-weight:700", h = "";
    h += '<div style="margin:2px 0"><b>🗄 SQL</b></div>';
    if (sq === null) h += '<div class="sm">ℹ️ sql-status.md পড়া যায়নি, তাই SQL-এর হিসাব দেখানো গেল না।</div>';
    else if (!sq.length) h += '<div style="' + g + '">✔ sql-status.md অনুযায়ী কোনো SQL বাকি নেই</div>';
    else h += sq.map(function (x) { return '<div style="margin:4px 0"><span style="' + r + '">⚠️ SQL বাকি (চালানো হয়নি)</span>' + (x.f.length ? ": " + x.f.map(function (n) { return "<code>" + escH(n) + "</code>"; }).join(", ") : "") + '<div class="sm">' + escH(x.t) + "</div></div>"; }).join("");
    h += '<div style="margin:10px 0 2px"><b>⚙️ সেটিং</b></div>';
    if (keys === null) h += '<div class="sm">ℹ️ সেটিং পড়া যায়নি, তাই হিসাব দেখানো গেল না।</div>';
    else {
      var miss = CFGK.filter(function (k) { return keys.indexOf(k[0]) < 0; });
      if (!miss.length) h += '<div style="' + g + '">✔ সব সেটিং সেভ করা আছে</div>';
      else h += miss.map(function (k) { return '<div style="margin:3px 0"><span style="' + r + '">⚠️ ' + escH(k[1]) + "</span> — ফাঁকা (সাইট ডিফল্টে চলছে)</div>"; }).join("") + '<div class="sm">ফাঁকা মানে এখনো সেভ করা হয়নি। ক্ষতি নেই, সাইট আগের মতোই ডিফল্টে চলে; বদলাতে চাইলে ওই ট্যাবে গিয়ে সেভ করুন।</div>';
    }
    return h;
  }
  function okBox() {
    var M = window.MCA;
    Promise.all([
      fetch("sql-status.md", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("x"); return r.text(); }).then(sqlPending).catch(function () { return null; }),
      (M && M.A ? M.A("mc2_settings?select=key&key=in.(" + CFGK.map(function (k) { return k[0]; }).join(",") + ")").then(function (r) { return Array.isArray(r) ? r.map(function (x) { return x.key; }) : null; }).catch(function () { return null; }) : Promise.resolve(null))
    ]).then(function (a) { var B = document.getElementById("mcOkB"); if (B) B.innerHTML = okHtml(a[0], a[1]); }).catch(function () {});
  }
  function view() {
    var h = '<h2>🧭 শুরু করুন</h2><p class="sm">কোথা থেকে শুরু করবেন বুঝতে না পারলে এখান থেকে ক্রমে চলুন।</p>' +
      '<div style="margin:8px 0"><button type="button" class="l s" data-tour="1">🎬 ট্যুর দেখুন</button></div>' +
      '<div class="c" id="mcOk" style="margin:8px 0 12px"><h3 style="margin:0 0 6px">✅ সব ঠিক আছে?</h3><div id="mcOkB" class="sm">⏳ দেখা হচ্ছে…</div></div>' +
      '<div class="mcs">' + STEPS.map(function (s, i) {
        return '<div class="it2"><span class="n">' + bn(i + 1) + '</span><div style="flex:1;min-width:0"><b>' + s[1] + '</b><div class="sm">' + s[2] + '</div></div><button type="button" class="s" data-go="' + s[0] + '">খুলুন ›</button></div>';
      }).join("") + "</div>" +
      '<h3 style="margin:14px 0 6px">ট্যাবের রং</h3><div class="sm" style="display:flex;gap:6px;flex-wrap:wrap">' + Object.keys(G).map(function (k) {
        return '<span class="mcg" style="background:' + G[k][1] + '">' + G[k][0] + "</span>";
      }).join("") + '</div><p class="sm">ট্যাবের গায়ে বাঁ পাশের রং দেখে বুঝবেন কোনটা কোন কাজের। যেকোনো পাতায় নিচের ডান কোণের <b>?</b> চাপলে ওই পাতার সাহায্য খোলে।</p>';
    var V = document.querySelector("#view");
    V.innerHTML = h;
    okBox();
    return Promise.resolve();
  }
  function bar() {
    var app = document.querySelector("#app"), tabs = document.querySelector("#tabs"), B = document.querySelector("#mcBar");
    if (!app || !tabs) return;
    if (!B) { B = document.createElement("div"); B.id = "mcBar"; tabs.insertAdjacentElement("afterend", B); }
    var k = cur(), i = I[k], g = i ? G[i[0]] : null;
    B.innerHTML = '<div class="mcx"><span>' + (g ? '<span class="mcg" style="background:' + g[1] + '">' + g[0] + "</span> " : "") + '<span class="sm">' + (i ? i[1] : "") + "</span></span></div>" + (k === "hub" ? "" : ribbon(k) + (nextOf(k) ? '<div><button type="button" class="s" data-go="' + nextOf(k)[0] + '">পরের ধাপ › ' + nextOf(k)[1] + "</button></div>" : ""));
  }
  function decorate() {
    document.body.classList.remove("mcEasy"); try { localStorage.removeItem(MK); } catch (e) {} // আগে সেভ করা "সহজ" থাকলেও সব ট্যাব দেখাবে
    [].forEach.call(document.querySelectorAll("#tabs [data-t]"), function (b) {
      var k = b.dataset.t, i = I[k];
      ["q", "r", "p", "c", "s"].forEach(function (x) { b.classList.remove("mcg-" + x); });
      if (i) { b.classList.add("mcg-" + i[0]); b.title = i[1]; }
      b.classList.toggle("mcc", !!CORE[k]);
    });
    bar();
    if (!document.querySelector("#mcQ")) {
      var q = document.createElement("button"); q.id = "mcQ"; q.type = "button"; q.textContent = "?"; q.setAttribute("aria-label", "সাহায্য"); document.body.appendChild(q);
    }
  }
  function help() {
    var k = cur(), i = I[k] || ["s", "", []], t = ((window.MCA_TABS || []).filter(function (x) { return x[0] === k; })[0] || [k, k])[1];
    var d = document.createElement("div"); d.id = "mcDlg";
    d.innerHTML = '<div class="b" role="dialog" aria-modal="true"><h3 style="margin:0">❓ সাহায্য: ' + t + '</h3><div>' + i[1] + "</div><ul style=\"margin:0;padding-left:20px\">" + (i[2] || []).map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul><div class="act"><button type="button" data-x="1">ঠিক আছে</button><button type="button" class="l" data-hub="1">🧭 শুরু করুন-তে যান</button></div></div>';
    d.onclick = function (e) {
      if (e.target === d || e.target.closest("[data-x]")) d.remove();
      else if (e.target.closest("[data-hub]")) { d.remove(); go("hub"); }
    };
    document.body.appendChild(d);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var d = document.querySelector("#mcDlg"); if (d) d.remove(); } });
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t.closest) return;
    var g = t.closest("[data-go]");
    if (t.closest("#mcQ")) { help(); return; }
    if (g && (g.closest("#mcBar") || g.closest("#view") || g.closest("#mcT"))) { go(g.dataset.go); return; }
  });
  var tabs = document.querySelector("#tabs");
  if (tabs && window.MutationObserver) new MutationObserver(decorate).observe(tabs, { childList: true });
})();

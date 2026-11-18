// অ্যাডমিন: "🖼️ লোগো" ট্যাব (২০২৬-১১-১৫) — কার্ডের বাম-ডান লোগো: প্রতি ডিজাইনে অন/অফ, অফ হলে বসার অক্ষর (কাস্টম), লোগো আপলোড ও তালিকা, পুরোনো কার্ড কোন লোগোয় নামবে।
// সেভ হয় mc2_settings: 'logo_cfg' (ছোট সেটিং) + প্রতি আপলোডের জন্য 'logo_img_<নম্বর>' (ক্রপ করা ছোট WebP/PNG, ≈১০০ KB-এর নিচে)। ⚠️ ২০২৬-১১-১৮ থেকে supabase-new-20261118.sql লাগে (সেটিং-চেকার এই দুই চাবি আটকে রাখত — তাই আপলোড হত না)।
// কার্ডের সঙ্গে সার্ভারে শুধু ছোট সংখ্যা-তালিকা (rec.lg) জমা হয়, কোনো ছবি নয়। সাইটের পাশে: logo-config.js, card.js (mcLogoPair)।
(function () {
  var M = null, ST = null, IMGS = {}, MAXUP = 10, DIRTY = false, DMSG = "● না-সেভ বদল আছে — 💾 সংরক্ষণ চাপুন, নইলে অন্য ট্যাবে গেলে বদল হারাবে।";
  window.MCA_TABS = (window.MCA_TABS || []).concat([["logo", "🖼️ লোগো"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { logo: view });
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var DN = [["নেভি মেডালিয়ন কার্ড", 1], ["সবুজ উইনার কার্ড", 2], ["গ্লাস রিং কার্ড", 4], ["স্টোরি কার্ড", 8]]; // [নাম, মাস্ক-বিট]
  var BASE = ["images/logo-card-explorer.png", "images/logo-mc.png", "images/logo-nu.png"];
  var $ = function (s) { return M ? M.$(s) : null; };
  var e = function (t) { return M.esc(t); };
  function msg(t, bad) { var m = $("#lgm"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }

  function srcOf(n) { return n === 1 ? BASE[0] : n === 2 ? BASE[1] : n === 9000 ? BASE[2] : (IMGS[n] || ""); }
  function nameOf(n) { if (n === 1) return "M.C EXPLORER লোগো (ডিফল্ট)"; if (n === 2) return "MC লোগো (ডিফল্ট)"; if (n === 9000) return "NU লোগো (ডিফল্ট)"; var x = ST.lib.filter(function (y) { return y.i === n; })[0]; return x ? x.n : "লোগো"; }
  function ids() { return [1, 2, 9000].concat(ST.lib.map(function (x) { return x.i; })); }
  var PDT = [["1", "🪪 নেভি মেডালিয়ন কার্ড"], ["2", "🪪 সবুজ উইনার কার্ড"], ["4", "🪪 গ্লাস রিং কার্ড"], ["8", "📱 স্টোরি কার্ড"], ["p", "🏆 পোস্টার ও বিজয়ীদের কার্ড"], ["s", "📣 সোশ্যাল কার্ড"], ["c", "🎓 সার্টিফিকেট"]];
  function selPd(idv, cur) { return "<select id='" + idv + "' style='max-width:100%;width:100%'><option value='0'>— সবার সাথে একই —</option>" + ids().map(function (n) { return "<option value='" + n + "'" + (n === cur ? " selected" : "") + ">" + bn(n) + "</option>"; }).join("") + "</select>"; }

  // ---------- 🎯 কার্ডের ধরন ধরে লোগো: ট্যাব (🚀 সব একসাথে | প্রতিটা ধরন আলাদা), প্রতিটায় নিজের "শুধু এটা সেভ" ----------
  var PDTAB = "all", SNAP = null; // SNAP = শেষ-সংরক্ষিত সেটিং (শুধু-একটা-সেভে বাকি সব এটাই থাকে)
  // নিচে সবসময় দেখা যাওয়া সেভ-বার: বাঁয়ে "শুধু এই ট্যাবের" সেভ, ডানে "সব একসাথে" সেভ (পাতা ওঠানামা না করেই)
  function barUpd() {
    var b = $("#lgbar_one"); if (!b) return;
    var nm = (PDT.filter(function (x) { return x[0] === PDTAB; })[0] || [0, ""])[1];
    b.hidden = false;
    if (PDTAB === "all") b.hidden = true; else if (PDTAB === "sel") b.textContent = "✅ বাছাই করা কার্ডে লাগিয়ে সেভ"; else b.textContent = "💾 শুধু এটা সেভ — " + nm.replace(/^\S+\s/, "");
  }
  function snapNow() { SNAP = JSON.parse(JSON.stringify(cfgOut())); }
  function thumb(n) { return n ? circle(n, "", true) : "<span class='sm'>সাধারণ</span>"; }
  function pdSummary() {
    var pd = (SNAP && SNAP.pd) || {};
    return PDT.map(function (r) { var c = pd[r[0]]; return "<div style='display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed var(--bd)'><span style='flex:1'>" + r[1] + "</span>" + (c ? "<span>" + circle(c[0] || ST.l, "", true) + " " + circle(c[1] || ST.r, "", true) + "</span><span class='sm'>আলাদা</span>" : "<span>" + circle(ST.l, "", true) + " " + circle(ST.r, "", true) + "</span><span class='sm'>সবার সাথে একই</span>") + "</div>"; }).join("");
  }
  function tabsUI() {
    var pd = (SNAP && SNAP.pd) || (ST.pd || {}), chip = function (k, lb) { var on = PDTAB === k; return "<button type='button' data-pdt='" + k + "' style='flex:none;padding:8px 12px;border-radius:999px;border:2px solid #1d6b43;font-weight:800;" + (on ? "background:#1d6b43;color:#fff" : "background:transparent;color:inherit") + "'>" + lb + (k !== "all" && pd[k] ? " ●" : "") + "</button>"; };
    var h = "<div style='border:2px solid #D4AF37;border-radius:12px;padding:10px;margin:10px 0'><b>🎯 লোগো — সব একসাথে বা ধরন ধরে আলাদা</b><p class='sm' style='margin:4px 0 8px'>ওপরের ট্যাবে চাপুন: <b>🚀 সব একসাথে</b> = সব জায়গায় এক লোগো-জোড়া, আর প্রতিটা ধরনের নিজের ট্যাবে আলাদা লোগো ও আলাদা সেভ। ● = ওই ধরনে আলাদা লোগো দেওয়া আছে। ডিজাইন/রং বদলায় না, শুধু লোগো।</p>";
    h += "<div style='display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch'>" + chip("all", "🚀 সব একসাথে") + chip("sel", "☑️ বাছাই করা কার্ড") + PDT.map(function (r) { return chip(r[0], r[1]); }).join("") + "</div>";
    // ট্যাব ০: সব একসাথে
    h += "<div data-pdp='all'" + (PDTAB === "all" ? "" : " hidden") + " style='margin-top:8px'><p class='sm' style='margin:0 0 8px'>কার্ড (৩টি ডিজাইন), স্টোরি, বিজয়ীদের কার্ড/পোস্টার, সোশ্যাল, সার্টিফিকেট, এক্সেল/ছবির ব্যানার — সবখানে একসাথে। চাপলে চারটা কার্ডেই লোগো চালু হয়, আলাদা-আলাদা বাছাই মুছে যায়, পুরোনো কার্ডের লোগোও একই হয়, আর সাথে সাথে সংরক্ষিত হয়।</p><p class='sm' style='margin:0 0 6px'><b>সব কার্ডকে একই করতে</b> নিচের ⭐ বা ✅ বাটন; আর “💾 সব ধরনের বাছাই সেভ” শুধু প্রতিটা ধরনের এখনকার নিজের বাছাই (আলাদা হলে আলাদাই) সেভ করে — সবাইকে একই করে না।</p><div class='act'><button type='button' id='lgdef'>⭐ ডিফল্ট: বাম MC Explorer · ডান MC — সব জায়গায়</button></div><p class='sm' style='margin:10px 0 4px'>অথবা অন্য দুটো বেছে <b>সব কার্ডে একই করে</b> লাগান:</p><div style='display:flex;gap:10px;flex-wrap:wrap'><label style='flex:1;min-width:140px'>বাম<br>" + sel("lg_al", ST.l) + "</label><label style='flex:1;min-width:140px'>ডান<br>" + sel("lg_ar", ST.r) + "</label></div><div class='act' style='margin-top:8px'><button type='button' id='lgall'>✅ এই দুটো সব জায়গায় লাগান</button><button type='button' class='l' id='lgsv3'>💾 সব ধরনের বাছাই সেভ (প্রতিটা নিজের মতো)</button></div><p class='sm' style='margin:10px 0 2px'><b>📋 এখন সংরক্ষিত অবস্থা</b></p><div id='pdsum'>" + pdSummary() + "</div></div>";
    // ট্যাব: শুধু বাছাই করা কয়েকটা কার্ড
    h += "<div data-pdp='sel'" + (PDTAB === "sel" ? "" : " hidden") + " style='margin-top:8px'><b>☑️ শুধু বাছাই করা কার্ডে</b><p class='sm' style='margin:2px 0 8px'>যে কার্ডগুলোতে লাগাতে চান টিক দিন, নিচে বাম/ডান লোগো বাছুন, তারপর চাপুন। টিক-না-দেওয়া কার্ড যেমন আছে তেমনই থাকবে। \"সবার সাথে একই\" বাছলে টিক-দেওয়া কার্ডগুলো সাধারণ লোগোতে ফিরবে।</p><div class='act' style='margin-bottom:6px'><button type='button' class='l s' id='lgselall'>সব টিক</button><button type='button' class='l s' id='lgselnone'>টিক সরান</button></div>" +
      PDT.map(function (r) { return "<label style='display:flex;align-items:center;gap:10px;padding:7px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' data-pdk='" + r[0] + "' style='width:22px;height:22px;flex:none'><span>" + r[1] + "</span></label>"; }).join("") +
      "<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px'><label>বাম<br>" + selPd("pd_sel_l", 0) + "</label><label>ডান<br>" + selPd("pd_sel_r", 0) + "</label></div><div class='act' style='margin-top:8px'><button type='button' id='lgsel'>✅ বাছাই করা কার্ডে লাগিয়ে সেভ</button></div></div>";
    // প্রতিটা ধরনের ট্যাব
    PDT.forEach(function (r) {
      var cur = (ST.pd || {})[r[0]] || [0, 0];
      h += "<div data-pdp='" + r[0] + "'" + (PDTAB === r[0] ? "" : " hidden") + " style='margin-top:8px'><b>" + r[1] + "</b><p class='sm' style='margin:2px 0 8px'>শুধু এই ধরনের লোগো। \"সবার সাথে একই\" = সাধারণ বাম/ডান।</p><div style='display:grid;grid-template-columns:1fr 1fr;gap:8px'><label>বাম <span data-pdth='" + r[0] + "_l'>" + thumb(cur[0]) + "</span><br>" + selPd("pd_" + r[0] + "_l", cur[0]) + "</label><label>ডান <span data-pdth='" + r[0] + "_r'>" + thumb(cur[1]) + "</span><br>" + selPd("pd_" + r[0] + "_r", cur[1]) + "</label></div><div class='act' style='margin-top:8px'><button type='button' data-pds='" + r[0] + "'>💾 শুধু এটা সেভ</button><button type='button' class='l' data-pdr='" + r[0] + "'>↺ সবার সাথে একই করে সেভ</button></div></div>";
    });
    return h + "</div>";
  }
  function savePdKeys(keys, l, r, reset, label) { // কয়েকটা ধরন একসাথে (বা একটা): শুধু এই ধরনগুলো বদলে সেভ; বাকি সব শেষ-সংরক্ষিত অবস্থায়ই থাকে
    var base = JSON.parse(JSON.stringify(SNAP || cfgOut())); base.pd = base.pd || {};
    keys.forEach(function (k) { if (!reset && (l || r)) base.pd[k] = [l, r]; else delete base.pd[k]; });
    msg("⏳ সংরক্ষণ হচ্ছে…");
    return put("logo_cfg", base).then(function () { return window.mcLogo.reload(); }).then(function () {
      SNAP = base; ST.pd = JSON.parse(JSON.stringify(base.pd));
      keys.forEach(function (k) {
        var c = base.pd[k] || [0, 0], a = $("#pd_" + k + "_l"), b = $("#pd_" + k + "_r"); if (a) a.value = String(c[0]); if (b) b.value = String(c[1]); pdThumbs(k);
        var ch = document.querySelector("[data-pdt='" + k + "']"); if (ch) ch.textContent = ch.textContent.replace(/ ●$/, "") + (base.pd[k] ? " ●" : "");
      });
      var s = $("#pdsum"); if (s) s.innerHTML = pdSummary();
      msg("✅ সংরক্ষিত — " + label + (reset || (!l && !r) ? " (সবার সাথে একই)" : "") + "। বাকি কার্ড যেমন ছিল তেমনই।");
    }).catch(function (er) { msg("❌ সংরক্ষণ হয়নি: " + (er && er.message ? er.message : er), true); });
  }
  function savePd(key, reset) {
    var a = $("#pd_" + key + "_l"), b = $("#pd_" + key + "_r"); if (!a || !b) return Promise.resolve();
    var nm = (PDT.filter(function (x) { return x[0] === key; })[0] || [0, key])[1];
    return savePdKeys([key], reset ? 0 : +a.value || 0, reset ? 0 : +b.value || 0, reset, "শুধু " + nm);
  }
  function pdThumbs(key) { ["l", "r"].forEach(function (sd) { var s = $("#pd_" + key + "_" + sd), th = document.querySelector("[data-pdth='" + key + "_" + sd + "']"); if (s && th) th.innerHTML = thumb(+s.value || 0); }); }
  function sel(idv, cur) { return "<select id='" + idv + "' style='max-width:100%'>" + ids().map(function (n) { return "<option value='" + n + "'" + (n === cur ? " selected" : "") + ">" + bn(n) + " — " + e(nameOf(n)) + "</option>"; }).join("") + "</select>"; }

  function view() {
    M = window.MCA;
    return Promise.all([M.A("mc2_settings?select=value&key=eq.logo_cfg"), M.A("mc2_settings?select=key,value&key=like.logo_img_*")]).then(function (a) {
      ST = window.mcLogo.merge(a[0][0] && a[0][0].value); IMGS = {}; DIRTY = false; snapNow();
      (a[1] || []).forEach(function (r) { var n = +String(r.key).replace("logo_img_", ""); if (n >= 3 && r.value && r.value.d) IMGS[n] = r.value.d; });
      paint();
    }).catch(M.fail);
  }

  function circle(n, txt, on) {
    var st = "width:46px;height:46px;border-radius:50%;background:#fff;border:2px solid #cfd8d2;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;vertical-align:middle;color:#1d6b43;font-weight:800;";
    if (on) return "<span style='" + st + "'><img src='" + e(srcOf(n)) + "' alt='' style='max-width:80%;max-height:80%'></span>";
    var t = String(txt || ""), fs = t.length <= 1 ? 24 : t.length === 2 ? 18 : 13;
    return "<span style='" + st + "font-size:" + fs + "px'>" + e(t) + "</span>";
  }

  function paint() {
    var h = "<h2>🖼️ কার্ডের লোগো</h2><p class='sm'>স্কোর কার্ড (৩টি ডিজাইন), স্টোরি কার্ড ও বিজয়ীদের কার্ড — সবার বাম-ডান দুই লোগো এখান থেকে ঠিক হয়। বিজয়ীদের কার্ড স্কোর কার্ডের একই ডিজাইনে আঁকা হয়, তাই আলাদা সেটিং লাগে না। এখানে ঠিক করা বাম/ডান লোগো (৩ নম্বর) নতুন সব কার্ডে বসে; পুরোনো কার্ড কোনটা পাবে তা ৫ নম্বরে ঠিক হয়। ইউজারকে ড্রপডাউন দেওয়ার সুইচ ৬ নম্বরে।</p>";
    h += "<div class='act'><button type='button' id='lgsv'>💾 সংরক্ষণ</button></div><p class='sm' id='lgm'></p>";
    h += tabsUI();
    h += "<h2 style='margin-top:14px'>১) কোন কার্ডে লোগো দেখাবে</h2><p class='sm' style='margin:0 0 4px'>চালু = লোগো দেখাবে · বন্ধ = লোগোর জায়গায় নিচের অক্ষর বসবে।</p>";
    DN.forEach(function (d) { h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' data-b='" + d[1] + "'" + ((ST.m & d[1]) ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>" + e(d[0]) + "</span></label>"; });
    h += "<details style='margin-top:14px;border:1px solid var(--bd);border-radius:10px;padding:8px 10px'><summary style='cursor:pointer;font-weight:800'>✏️ কাস্টম লেখা (লোগো বন্ধ থাকলে)</summary><p class='sm' style='margin:0 0 6px'>১টা অক্ষর বড় দেখাবে; ২-৩টা লিখলে নিজে নিজে ছোট হয়ে বৃত্তে আঁটবে (সর্বোচ্চ ৩টি)।</p>";
    h += "<div style='display:flex;gap:14px;flex-wrap:wrap;align-items:center'><label>বাম <input id='lg_tl' maxlength='3' value='" + e(ST.tl) + "' style='width:70px;text-align:center'></label><label>ডান <input id='lg_tr' maxlength='3' value='" + e(ST.tr) + "' style='width:70px;text-align:center'></label><span id='lgpv'></span></div>";
    h += "<div class='act' style='margin-top:8px'><button type='button' id='lgcs'>💾 এই লেখা সেভ করুন</button></div></details>";h += "<label style='display:flex;align-items:center;gap:10px;margin:10px 0 6px'><input type='checkbox' id='lg_on'" + (ST.on === 0 ? "" : " checked") + " style='width:22px;height:22px'><b>লোগো চালু (অন/অফ)</b></label>";h += "<h2 style='margin-top:14px'>৩) কোন লোগো বসবে</h2><div style='display:flex;flex-direction:column;gap:8px'><label>বামের লোগো<br>" + sel("lg_l", ST.l) + "</label><label>ডানের লোগো<br>" + sel("lg_r", ST.r) + "</label></div>";
    h += "<h2 style='margin-top:14px'>৪) লোগোর তালিকা</h2><p class='sm' style='margin:0 0 6px'>ডিফল্ট দুটো (১ ও ২) মোছা যায় না। যেকোনো লোগোতে ক্লিক করলে বড় প্রিভিউ খোলে — সেখান থেকে নাম বদলানো, ক্রপ (সম্পাদনা) ও ডিলেট করা যায়। নতুন লোগো আপলোড করলে এখানে জমা হয়; যখন ইচ্ছা ওপরের ৩ নম্বর থেকে বামে/ডানে বদলাতে পারবেন। সর্বোচ্চ " + bn(MAXUP) + "টি আপলোড।</p>";
    h += "<div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px'>";
    ids().forEach(function (n) {
      h += "<div data-pv='" + n + "' role='button' tabindex='0' style='border:1px solid var(--bd);border-radius:10px;padding:6px;text-align:center;cursor:pointer'><div style='height:64px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:8px'>" + (srcOf(n) ? "<img src='" + e(srcOf(n)) + "' alt='' style='max-width:92%;max-height:60px'>" : "?") + "</div><div class='sm' style='margin-top:4px'><b>" + bn(n) + "</b> " + e(nameOf(n)) + "</div><div class='sm' style='color:var(--g);font-weight:700'>🔍 বড় করে দেখুন</div>" + (n >= 3 ? "<button type='button' class='l' data-del='" + n + "' style='margin-top:4px'>🗑️ মুছুন</button>" : "") + "</div>";
    });
    h += "</div>";
    h += "<div style='margin-top:10px;padding:10px;border:1px dashed var(--bd);border-radius:10px'><b>📤 নতুন লোগো আপলোড</b><div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;align-items:center'><input type='file' id='lg_file' accept='image/*'><input id='lg_name' maxlength='40' placeholder='নাম (ঐচ্ছিক)' style='min-width:140px'><button type='button' id='lgup'>আপলোড</button></div><p class='sm' style='margin:6px 0 0'>যত MB-এর ছবিই দিন চলবে (সাইজ-সীমা নেই)। ছবি বাছলে ক্রপ করার জানালা আসে; জমার সময় ফোনেই ছোট (সর্বোচ্চ ৩৮৪ px, ≈১০০ KB-এর নিচে) হয়ে সার্ভারে বসে। স্বচ্ছ (PNG) ব্যাকগ্রাউন্ড থাকলে স্বচ্ছই থাকে।</p></div>";
    h += "<h2 style='margin-top:14px'>৫) পুরোনো (আগে জমা) কার্ড কোন লোগোয় নামবে</h2><select id='lg_old' style='max-width:100%'>" +
      [["sub", "জমা দেওয়ার সময় যে লোগো ছিল সেটাই (সুপারিশ)"], ["cur", "এখনকার বাছাই করা লোগো (ওপরের ১-৩)"], ["fix", "নির্দিষ্ট একটা জোড়া (নিচে বাছুন)"]].map(function (o) { return "<option value='" + o[0] + "'" + (ST.old === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
    h += "<div id='lg_fixw' style='margin-top:6px;flex-direction:column;gap:8px;display:" + (ST.old === "fix" ? "flex" : "none") + "'><label>বামে<br>" + sel("lg_fl", ST.fl) + "</label><label>ডানে<br>" + sel("lg_fr", ST.fr) + "</label></div>";
    h += "<p class='sm' style='margin:6px 0 0'>এটা ইউজারের ডাউনলোড, অ্যাডমিনের ডাউনলোড ও বিজয়ীদের কার্ড — সবখানে একই রকম কাজ করে। এই আপডেটের আগে জমা হওয়া কার্ডে লোগোর তথ্য নেই, ওগুলো “জমা দেওয়ার সময়ের” বাছাইয়ে আগের দুই ডিফল্ট লোগোতেই নামবে।</p>";
    h += "<h2 style='margin-top:14px'>৬) ইউজারকে লোগো বাছতে দেওয়া (ড্রপডাউন)</h2><p class='sm' style='margin:0 0 4px'>চালু করলে ইউজারের কার্ডের নিচে বাম ও ডানের জন্য দুটো “লোগো বাছুন” ড্রপডাউন আসে। <b>ডিফল্টে সব বন্ধ।</b> ইউজারের বাছাই শুধু তার ওই একটা কার্ডের জন্য; সার্ভারে কিছু জমা হয় না, সাইটের সাধারণ সেটিংও বদলায় না। অ্যাডমিন কার্ড-প্রিভিউতে ড্রপডাউন সবসময় থাকে (সব লোগো + নিজের লেখা অক্ষর), এখানকার সুইচ শুধু ইউজারের জন্য।</p>";
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' id='ud_s'" + (ST.ud.s ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>ফল-পাতার স্কোর কার্ডে (স্টোরিতেও খাটে) — কার্ড আর ১ ২ ৩ ডিজাইন বাটনের ঠিক নিচে</span></label>";
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' id='ud_h'" + (ST.ud.h ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>“আগের কার্ড”-এর বড় প্রিভিউতে (ইউজারের নিজের আগের কার্ড) — কার্ডের ছবির নিচে</span></label>";
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' id='ud_b'" + (ST.ud.b ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>লিডারবোর্ডে (সেরা ৩ ও “🪪 কার্ড দেখো”) — কার্ডের ছবির নিচে</span></label>";
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' id='ud_w'" + (ST.ud.w ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>বিজয়ী/লটারি বিজয়ী তালিকায় (“🪪 কার্ড দেখুন”) — কার্ডের ছবির নিচে</span></label>";
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--bd)'><input type='checkbox' id='ud_a'" + (ST.ud.a ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span><b>🛡️ অ্যাডমিনের জন্য পাবলিক সাইটে:</b> অ্যাডমিন লগইন করা থাকলে পাবলিক সাইটের ফল-পাতা, লিডারবোর্ড ও বিজয়ী তালিকায় সব লোগো + অক্ষরসহ ড্রপডাউন দেখবে — ওপরের ইউজার-সুইচ বন্ধ থাকলেও। <b>বন্ধ থাকলে পাবলিক সাইটে অ্যাডমিনও দেখবে না।</b> (অ্যাডমিন প্যানেলের ভেতরের কার্ডে ড্রপডাউন সবসময় চালু, এই টিকের ওপর নির্ভর করে না।)</span></label>";
    h += "<p class='sm' style='margin:8px 0 2px'><b>ইউজার কোন লোগোগুলো বাছতে পারবে</b> (টিক দেওয়াগুলোই ড্রপডাউনে আসবে):</p>";
    ids().forEach(function (n) { h += "<label style='display:flex;align-items:center;gap:10px;padding:6px 2px'><input type='checkbox' data-ul='" + n + "'" + (ST.ul.indexOf(n) >= 0 ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span style='display:flex;align-items:center;gap:8px'><span style='width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #cfd8d2;display:inline-flex;align-items:center;justify-content:center;overflow:hidden'>" + (srcOf(n) ? "<img src='" + e(srcOf(n)) + "' alt='' style='max-width:80%;max-height:80%'>" : "?") + "</span>" + bn(n) + " — " + e(nameOf(n)) + "</span></label>"; });
    h += "<label style='display:flex;align-items:center;gap:10px;padding:8px 2px;border-top:1px solid var(--bd);margin-top:4px'><input type='checkbox' id='ud_t'" + (ST.ut ? " checked" : "") + " style='width:22px;height:22px;flex:none'><span>ইউজার নিজে অক্ষর লিখে বসাতে পারবে (বাম ও ডানে আলাদা, ১-৩টা অক্ষর)</span></label>";
    h += "<div class='act' style='margin-top:12px'><button type='button' id='lgsv2'>💾 সংরক্ষণ</button></div>";
    h += "<div id='lgbar' style='position:sticky;bottom:0;z-index:20;margin-top:12px;padding:8px;border-top:2px solid #D4AF37;background:var(--card,#fff);display:flex;gap:8px;flex-wrap:wrap;box-shadow:0 -4px 14px rgba(0,0,0,.18)'><button type='button' id='lgbar_one' style='flex:1;min-width:150px'></button><button type='button' class='l' id='lgbar_all' style='flex:1;min-width:150px'>💾 সব ধরনের বাছাই সেভ <small>(প্রতিটা নিজের মতো)</small></button></div>";
    $("#view").innerHTML = h; barUpd(); prev(); if (DIRTY) msg(DMSG, true);
    var lo = $("#lg_on"); if (lo) lo.onchange = function () { var mm = 0; [].forEach.call(document.querySelectorAll("#view [data-b]"), function (c) { if (c.checked) mm |= +c.dataset.b; });
      try { collect(); } catch (x) {} // টিক চাপলে পাতা নতুন করে আঁকা হয় — তার আগে না-সেভ বদলগুলো ধরে রাখি
      if (!this.checked) { ST.mOn = mm || ST.mOn || 0; ST.m = 0; ST.on = 0; } else { ST.m = ST.mOn || 0; ST.on = 1; } DIRTY = true; paint(); };
  }
  function prev() {
    var m = 0; [].forEach.call(document.querySelectorAll("#view [data-b]"), function (c) { if (c.checked) m |= +c.dataset.b; });
    var l = +($("#lg_l") || {}).value || 1, r = +($("#lg_r") || {}).value || 2, tl = ($("#lg_tl") || {}).value, tr = ($("#lg_tr") || {}).value, p = $("#lgpv");
    if (p) p.innerHTML = "<span class='sm'>নমুনা: চালু →</span> " + circle(l, "", true) + circle(r, "", true) + " <span class='sm'>বন্ধ →</span> " + circle(0, tl, false) + circle(0, tr, false);
  }
  function collect() {
    var m = 0; [].forEach.call(document.querySelectorAll("#view [data-b]"), function (c) { if (c.checked) m |= +c.dataset.b; });
    ST.m = m; ST.l = +$("#lg_l").value || 1; ST.r = +$("#lg_r").value || 2;
    ST.tl = String($("#lg_tl").value || "").trim().slice(0, 3); ST.tr = String($("#lg_tr").value || "").trim().slice(0, 3);
    if (!ST.tl) ST.tl = "M"; if (!ST.tr) ST.tr = "C";
    ST.pd = {}; PDT.forEach(function (r) { var a = $("#pd_" + r[0] + "_l"), b = $("#pd_" + r[0] + "_r"), l = a ? +a.value || 0 : 0, rr = b ? +b.value || 0 : 0; if (l || rr) ST.pd[r[0]] = [l, rr]; });
    ST.old = $("#lg_old").value; ST.fl = +$("#lg_fl").value || 1; ST.fr = +$("#lg_fr").value || 2;
    ST.ud = { s: $("#ud_s").checked ? 1 : 0, h: $("#ud_h").checked ? 1 : 0, b: $("#ud_b").checked ? 1 : 0, w: $("#ud_w").checked ? 1 : 0, a: $("#ud_a").checked ? 1 : 0 }; ST.ut = $("#ud_t").checked ? 1 : 0;
    ST.ul = [].map.call(document.querySelectorAll("#view [data-ul]"), function (c) { return c.checked ? +c.dataset.ul : 0; }).filter(Boolean);
  }
  function put(key, value) { return M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: key, value: value }]) }); }
  function cfgOut() { return { on: ST.on, mOn: ST.mOn || 0, m: ST.m, l: ST.l, r: ST.r, tl: ST.tl, tr: ST.tr, old: ST.old, fl: ST.fl, fr: ST.fr, lib: ST.lib, nx: ST.nx, ud: ST.ud, ul: ST.ul, ut: ST.ut, pd: ST.pd || {} }; }
  function save(quiet) {
    collect(); if (!quiet) msg("⏳ সংরক্ষণ হচ্ছে…");
    return put("logo_cfg", cfgOut())
      .then(function () { DIRTY = false; snapNow(); var s0 = $("#pdsum"); if (s0) s0.innerHTML = pdSummary(); return window.mcLogo.reload(); })
      .then(function () { return window.mcLogo.get("mc2_settings?select=value&key=eq.logo_cfg"); })
      .then(function (r) { if (!quiet) msg(r && r[0] ? "✅ সংরক্ষিত। সাইট (লগইন ছাড়া) নতুন সেটিং পড়তে পারছে; ইউজারের কার্ডে সর্বোচ্চ ৫ মিনিটের মধ্যে বসবে।" : "⚠️ সংরক্ষিত, কিন্তু সাইটের পাবলিক পড়া যাচাই হয়নি।", !(r && r[0])); })
      .catch(function (er) { msg("❌ সংরক্ষণ হয়নি: " + (er && er.message || er), true); throw er; });
  }
  // ---------- আপলোড: যত বড় ছবিই হোক নেবে (সাইজ-সীমা নেই) → ক্রপ → ফোনেই ছোট (≈১০০ KB-এর নিচে) করে জমা ----------
  // জমা হয় WebP (স্বচ্ছতা থাকে; ফোন না পারলে PNG), সর্বোচ্চ ৩৮৪ px; ১০০,০০০ অক্ষরের (≈৭৫ KB) নিচে না এলে ধাপে ধাপে আরও ছোট — কখনো ত্রুটি দেখিয়ে আটকায় না।
  var LIM = 100000;
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var W = im.naturalWidth, H = im.naturalHeight; if (!W || !H) { URL.revokeObjectURL(u); return rej(new Error("ছবির মাপ পাওয়া যায়নি")); }
        var k = Math.min(1, 1600 / Math.max(W, H)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(H * k)); // বিশাল ছবি ফোনের মেমোরিতে ১৬০০ px-এ নামিয়ে কাজ
        var x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c);
      };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error("এটা ছবি হিসেবে খোলা যায়নি (JPG/PNG/WebP দিন)")); };
      im.src = u;
    });
  }
  function shrink(src, sx, sy, sw, sh) {
    var sizes = [384, 320, 256, 192, 128, 96, 64], q = [0.9, 0.8, 0.65, 0.5], best = "", i, j;
    for (i = 0; i < sizes.length; i++) {
      var k = Math.min(1, sizes[i] / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k)), c = document.createElement("canvas");
      c.width = w; c.height = h; var x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      var wp = c.toDataURL("image/webp", 0.9); if (wp.indexOf("data:image/webp") !== 0) { wp = ""; }
      if (wp) { for (j = 0; j < q.length; j++) { var d = j ? c.toDataURL("image/webp", q[j]) : wp; if (!best || d.length < best.length) best = d; if (d.length <= LIM) return d; } }
      else { var p = c.toDataURL("image/png"); if (!best || p.length < best.length) best = p; if (p.length <= LIM) return p; }
    }
    return best;
  }
  // ক্রপ জানালা: টেনে সরানো, কোণা টেনে মাপ বদলানো; চৌকো / মুক্ত / পুরো ছবি। ফেরত: Promise<{sx,sy,sw,sh}> বা বাতিলে null
  function cropUI(src) {
    return new Promise(function (res) {
      var DW = Math.min(340, Math.max(220, (window.innerWidth || 360) - 40)), k = Math.min(DW / src.width, 300 / src.height), dw = Math.round(src.width * k), dh = Math.round(src.height * k);
      var ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto";
      ov.innerHTML = "<div style='background:var(--card,#fff);color:var(--fg,#10261b);border-radius:16px;padding:12px;max-width:100%;text-align:center'><b>✂️ লোগো ক্রপ করুন</b><p class='sm' style='margin:4px 0 8px'>বাক্সের ভেতরে টেনে সরান। চার কোণা ও চার পাশের সবুজ হাতল টেনে যেকোনো দিক থেকে কাটুন (আট দিক)।</p>" +
        "<div id='cpw' style='position:relative;margin:0 auto;touch-action:none;width:" + dw + "px;height:" + dh + "px;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px;user-select:none;overflow:hidden;border-radius:6px'><canvas id='cpc' width='" + dw + "' height='" + dh + "' style='display:block'></canvas><div id='cpb' style='position:absolute;border:2px solid #1d9b5e;box-shadow:0 0 0 999px rgba(0,0,0,.45);box-sizing:border-box;cursor:move'><div data-d='nw' style='position:absolute;left:0;top:0;width:26px;height:26px;border-radius:50%;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:nwse-resize'></div><div data-d='n' style='position:absolute;left:50%;top:0;margin-left:-16px;width:32px;height:14px;border-radius:7px;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:ns-resize'></div><div data-d='ne' style='position:absolute;right:0;top:0;width:26px;height:26px;border-radius:50%;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:nesw-resize'></div><div data-d='w' style='position:absolute;left:0;top:50%;margin-top:-16px;width:14px;height:32px;border-radius:7px;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:ew-resize'></div><div data-d='e' style='position:absolute;right:0;top:50%;margin-top:-16px;width:14px;height:32px;border-radius:7px;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:ew-resize'></div><div data-d='sw' style='position:absolute;left:0;bottom:0;width:26px;height:26px;border-radius:50%;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:nesw-resize'></div><div data-d='s' style='position:absolute;left:50%;bottom:0;margin-left:-16px;width:32px;height:14px;border-radius:7px;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:ns-resize'></div><div data-d='se' style='position:absolute;right:0;bottom:0;width:26px;height:26px;border-radius:50%;background:#1d9b5e;border:2px solid #fff;box-sizing:border-box;cursor:nwse-resize'></div></div></div>" +
        "<div style='display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0 6px'><button type='button' data-m='sq'>▢ চৌকো</button><button type='button' data-m='fr'>✂ মুক্ত</button><button type='button' data-m='all'>🖼 পুরো ছবি</button></div>" +
        "<div style='display:flex;gap:8px;justify-content:center;flex-wrap:wrap'><button type='button' id='cpok'>✅ ক্রপ করে জমা দিন</button><button type='button' id='cpno'>বাতিল</button></div></div>";
      document.body.appendChild(ov);
      var cv = ov.querySelector("#cpc"); cv.getContext("2d").drawImage(src, 0, 0, dw, dh);
      var bx = ov.querySelector("#cpb"), sq = true, R = { x: 0, y: 0, w: 0, h: 0 }, MIN = 24;
      function put() { bx.style.left = R.x + "px"; bx.style.top = R.y + "px"; bx.style.width = R.w + "px"; bx.style.height = R.h + "px"; }
      function init() { var s = Math.min(dw, dh); R = { x: Math.round((dw - s) / 2), y: Math.round((dh - s) / 2), w: s, h: s }; put(); }
      init();
      var drag = null;
      ov.querySelector("#cpw").addEventListener("pointerdown", function (e) {
        var d = e.target.getAttribute && e.target.getAttribute("data-d"), inb = e.target === bx || !!d; if (!inb) return; e.preventDefault();
        drag = { d: d || "", px: e.clientX, py: e.clientY, r: { x: R.x, y: R.y, w: R.w, h: R.h } };
        try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
      });
      ov.addEventListener("pointermove", function (e) {
        if (!drag) return; var dx = e.clientX - drag.px, dy = e.clientY - drag.py, r = drag.r, d = drag.d, cl = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
        if (!d) { R.x = cl(r.x + dx, 0, dw - r.w); R.y = cl(r.y + dy, 0, dh - r.h); put(); return; }
        var L = r.x, T = r.y, RT = r.x + r.w, B = r.y + r.h, hx = d.indexOf("e") >= 0 || d.indexOf("w") >= 0, hy = d.indexOf("n") >= 0 || d.indexOf("s") >= 0;
        if (d.indexOf("e") >= 0) RT = cl(RT + dx, L + MIN, dw); if (d.indexOf("w") >= 0) L = cl(L + dx, 0, RT - MIN);
        if (d.indexOf("s") >= 0) B = cl(B + dy, T + MIN, dh); if (d.indexOf("n") >= 0) T = cl(T + dy, 0, B - MIN);
        if (sq) { // চৌকো: দিকের উল্টো প্রান্ত স্থির; পাশের হাতলে অন্য মাপ মাঝখান থেকে বাড়ে
          var s = hx && hy ? Math.max(RT - L, B - T) : hx ? RT - L : B - T, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
          s = Math.max(MIN, Math.min(s, dw, dh));
          if (hx && hy) {
            var w0 = d.indexOf("w") >= 0, n0 = d.indexOf("n") >= 0, ax = w0 ? r.x + r.w : r.x, ay = n0 ? r.y + r.h : r.y;
            s = Math.max(MIN, Math.min(s, w0 ? ax : dw - ax, n0 ? ay : dh - ay));
            L = w0 ? ax - s : ax; RT = L + s; T = n0 ? ay - s : ay; B = T + s;
          }
          else if (hx) { if (d === "e") { L = r.x; RT = L + s; } else { RT = r.x + r.w; L = RT - s; } T = cx * 0 + cl(cy - s / 2, 0, dh - s); B = T + s; }
          else { if (d === "s") { T = r.y; B = T + s; } else { B = r.y + r.h; T = B - s; } L = cl(cx - s / 2, 0, dw - s); RT = L + s; }
        }
        R.x = L; R.y = T; R.w = Math.max(1, RT - L); R.h = Math.max(1, B - T); put();
      });
      var up = function () { drag = null; }; ov.addEventListener("pointerup", up); ov.addEventListener("pointercancel", up);
      ov.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("button"); if (!b) return;
        if (b.dataset.m === "sq") { sq = true; var s = Math.min(R.w, R.h); R.w = s; R.h = s; R.x = Math.min(R.x, dw - s); R.y = Math.min(R.y, dh - s); put(); }
        else if (b.dataset.m === "fr") { sq = false; }
        else if (b.dataset.m === "all") { sq = false; R = { x: 0, y: 0, w: dw, h: dh }; put(); }
        else if (b.id === "cpok") { document.body.removeChild(ov); res({ sx: Math.round(R.x / k), sy: Math.round(R.y / k), sw: Math.max(1, Math.round(R.w / k)), sh: Math.max(1, Math.round(R.h / k)) }); }
        else if (b.id === "cpno") { document.body.removeChild(ov); res(null); }
      });
    });
  }
  function why(er) {
    var m = String(er && er.message || er || "");
    if (/unknown setting|logo_img|logo_cfg|must be/i.test(m)) return "ডাটাবেস লোগো সেভ করতে দিচ্ছে না — অ্যাডমিন supabase-new-20261118.sql একবার চালাননি (" + m + ")";
    if (/401|403|JWT|permission|policy/i.test(m)) return "অ্যাডমিন লগইনের মেয়াদ শেষ বা অনুমতি নেই — আবার লগইন করুন (" + m + ")";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "ইন্টারনেট সমস্যা — আবার চেষ্টা করুন";
    return m || "অজানা সমস্যা";
  }
  function upload() {
    var f = $("#lg_file").files[0]; if (!f) { msg("আগে একটা ছবি বাছুন", true); return; }
    if (ST.lib.length >= MAXUP) { msg("❌ সর্বোচ্চ " + bn(MAXUP) + "টি আপলোড করা যায়; আগে একটা মুছুন", true); return; }
    collect(); msg("⏳ ছবি খোলা হচ্ছে…");
    var nm = String($("#lg_name").value || "").trim().slice(0, 40), n = ST.nx;
    loadImg(f).then(function (src) {
      msg(""); return cropUI(src).then(function (c) {
        if (!c) { msg("বাতিল করা হয়েছে"); return; }
        msg("⏳ ছোট করে জমা হচ্ছে…");
        var d = shrink(src, c.sx, c.sy, c.sw, c.sh), kb = Math.round(d.length * 0.75 / 1024);
        return put("logo_img_" + n, { d: d }).then(function () { IMGS[n] = d; ST.lib.push({ i: n, n: nm || ("লোগো " + bn(n)) }); ST.nx = n + 1; return save(true); }).then(function () { $("#lg_file").value = ""; paint(); msg("✅ আপলোড হয়েছে — তালিকায় " + bn(n) + " নম্বরে (সার্ভারে মাত্র ~" + bn(kb) + " KB)। এখন ৩ নম্বর থেকে বামে/ডানে বাছতে পারবেন।"); openPV(n); });
      });
    }).catch(function (er) { msg("❌ আপলোড হয়নি: " + why(er), true); });
  }
  function usedBy(n) {
    return M.raw(M.base + "/rest/v1/mc2_cards?select=id&limit=1&or=(rec->lg->>0.eq." + n + ",rec->lg->>1.eq." + n + ")", { headers: { Prefer: "count=exact" } })
      .then(function (r) { var m = /\/(\d+)/.exec(r.headers.get("content-range") || ""); return m ? +m[1] : null; }).catch(function () { return null; });
  }
  // ডিলেট: ডাটাবেসের mc2_settings সারি সত্যিই মুছে ফেলে (এই টেবিলে রিসাইকেল-বিন নেই), তারপর সার্ভার থেকে আবার পড়ে যাচাই করে।
  function del(n) {
    collect(); msg("⏳ ডিলেট হচ্ছে…");
    return M.A("mc2_settings?key=eq.logo_img_" + n, { method: "DELETE" }).then(function () {
      ST.lib = ST.lib.filter(function (x) { return x.i !== n; }); delete IMGS[n]; window.mcLogo.bust(n);
      ST.ul = ST.ul.filter(function (x) { return x !== n; }); if (ST.l === n) ST.l = 1; if (ST.r === n) ST.r = 2; if (ST.fl === n) ST.fl = 1; if (ST.fr === n) ST.fr = 2;
      return put("logo_cfg", cfgOut());
    }).then(function () { return window.mcLogo.reload(); })
      .then(function () { return window.mcLogo.get("mc2_settings?select=key&key=eq.logo_img_" + n).catch(function () { return null; }); })
      .then(function (chk) {
        closePV(); paint();
        if (chk && chk.length) msg("⚠️ ডিলেটের পরেও সার্ভারে লোগোটা দেখা যাচ্ছে — আবার চেষ্টা করুন।", true);
        else msg(chk ? "✅ স্থায়ীভাবে ডিলেট হয়েছে — সার্ভার থেকে যাচাই করা হয়েছে, কোথাও নেই।" : "✅ ডিলেট হয়েছে।");
      }).catch(function (er) { pvMsg("❌ ডিলেট হয়নি: " + why(er), true); msg("❌ ডিলেট হয়নি: " + why(er), true); });
  }
  // ---------- বড় প্রিভিউ: লোগোতে ক্লিক → বড় ছবি + নাম সংরক্ষণ / ✂️ সম্পাদনা (ক্রপ) / 🗑️ ডিলেট ----------
  function loadSrc(u) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () {
        var W = im.naturalWidth, H = im.naturalHeight; if (!W || !H) return rej(new Error("ছবির মাপ পাওয়া যায়নি"));
        var c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").drawImage(im, 0, 0); res(c);
      };
      im.onerror = function () { rej(new Error("ছবি খোলা যায়নি")); };
      im.src = u;
    });
  }
  function closePV() { var o = document.getElementById("lgpvm"); if (o) o.remove(); }
  function pvMsg(t, bad) { var m = document.getElementById("lgpvmsg"); if (m) { m.textContent = t || ""; m.style.color = bad ? "var(--red,#b3261e)" : ""; } }
  function renameLogo(n) {
    var v = String((document.getElementById("lgpvn") || {}).value || "").trim().slice(0, 40);
    if (!v) { pvMsg("নাম ফাঁকা রাখা যাবে না", true); return; }
    var x = ST.lib.filter(function (y) { return y.i === n; })[0]; if (!x) return;
    x.n = v; pvMsg("⏳ সংরক্ষণ হচ্ছে…");
    save(true).then(function () { paint(); var t = document.getElementById("lgpvt"); if (t) t.textContent = bn(n) + " — " + v; pvMsg("✅ নাম সংরক্ষিত হয়েছে"); }).catch(function (er) { pvMsg("❌ " + why(er), true); });
  }
  function editLogo(n) {
    var s0 = srcOf(n); if (!s0) { pvMsg("ছবি পাওয়া যায়নি", true); return; }
    pvMsg("⏳ ছবি খোলা হচ্ছে…");
    loadSrc(s0).then(function (src) {
      pvMsg(""); return cropUI(src).then(function (c) {
        if (!c) { pvMsg("বাতিল করা হয়েছে"); return; }
        pvMsg("⏳ ছোট করে সেভ হচ্ছে…");
        var d = shrink(src, c.sx, c.sy, c.sw, c.sh);
        return put("logo_img_" + n, { d: d }).then(function () { IMGS[n] = d; window.mcLogo.bust(n); return window.mcLogo.reload(); })
          .then(function () { try { collect(); } catch (x) {} paint(); var im = document.querySelector("#lgpvm img"); if (im) im.src = d; pvMsg("✅ ক্রপ করা ছবি সংরক্ষিত হয়েছে"); });
      });
    }).catch(function (er) { pvMsg("❌ " + why(er), true); });
  }
  function openPV(n, askDel) {
    closePV(); var def = n < 3 || n === 9000, ov = document.createElement("div"); ov.id = "lgpvm";
    ov.style.cssText = "position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto";
    var bt = "display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px";
    ov.innerHTML = "<div style='background:var(--card,#fff);color:var(--fg,#10261b);border-radius:16px;padding:14px;width:100%;max-width:380px;margin:auto'>" +
      "<div style='display:flex;justify-content:space-between;align-items:center;gap:8px'><b id='lgpvt'>" + bn(n) + " — " + e(nameOf(n)) + "</b><button type='button' class='l s' data-a='x' aria-label='বন্ধ'>✕</button></div>" +
      "<div style='margin-top:10px;padding:12px;border-radius:12px;display:flex;justify-content:center;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px'><img src='" + e(srcOf(n)) + "' alt='' style='max-width:100%;max-height:260px;object-fit:contain'></div>" +
      (def ? "<p class='sm' style='margin:10px 0 0'>এটা ডিফল্ট লোগো — নাম বদলানো, ক্রপ করা বা ডিলেট করা যায় না।</p>"
        : "<label class='sm' style='display:block;text-align:left;margin-top:10px'>লোগোর নাম<input id='lgpvn' maxlength='40' value='" + e(nameOf(n)) + "'></label>" +
          "<div style='" + bt + "'><button type='button' data-a='nm'>💾 নাম সেভ</button><button type='button' data-a='cr'>✂️ সম্পাদনা (ক্রপ)</button><button type='button' class='d' data-a='dl'>🗑️ ডিলেট</button></div>" +
          "<div id='lgpvw' style='display:none;margin-top:10px;padding:10px;border:2px solid var(--red,#b3261e);border-radius:12px;background:rgba(179,38,30,.1);text-align:left'><b style='color:var(--red,#b3261e)'>⚠️ সতর্কতা</b>" +
          "<p style='margin:4px 0'>‘" + e(nameOf(n)) + "’ লোগোটা <b>স্থায়ীভাবে ডিলেট</b> হবে। সার্ভারের ডাটাবেস থেকেও পুরো মুছে যাবে — কোথাও থাকবে না, আর ফেরানো যাবে না।</p><p id='lgpvu' class='sm' style='margin:4px 0'></p>" +
          "<div style='" + bt + "'><button type='button' class='d' data-a='dy'>হ্যাঁ, স্থায়ীভাবে ডিলেট করুন</button><button type='button' class='l' data-a='dn'>না, থাক</button></div></div>") +
      "<p class='sm' id='lgpvmsg' style='margin:8px 0 0;text-align:center'></p></div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", function (ev) {
      if (ev.target === ov) { closePV(); return; }
      var b = ev.target.closest && ev.target.closest("button"); if (!b) return; var a = b.dataset.a;
      if (a === "x") closePV();
      else if (a === "nm") renameLogo(n);
      else if (a === "cr") editLogo(n);
      else if (a === "dl") {
        var w = document.getElementById("lgpvw"); w.style.display = "block"; var u = document.getElementById("lgpvu"); u.textContent = "⏳ দেখা হচ্ছে…";
        usedBy(n).then(function (c) { u.textContent = c == null ? "ব্যবহার করা জমা কার্ড থাকলে ওগুলো ডিফল্ট লোগোতে ফিরবে।" : "জমা কার্ডের মধ্যে " + bn(c) + "টি এটা দিয়ে জমা হয়েছে — ওগুলো ডিফল্ট লোগোতে ফিরবে।"; });
      }
      else if (a === "dn") document.getElementById("lgpvw").style.display = "none";
      else if (a === "dy") { b.disabled = true; del(n); }
    });
    if (askDel && !def) { var dl = ov.querySelector("[data-a='dl']"); if (dl) dl.click(); }
  }
  document.addEventListener("click", function (ev) {
    if (!$("#lgm")) return; var d = ev.target.closest && ev.target.closest("#view [data-del]"); if (d) { openPV(+d.dataset.del, true); return; }
    var t = ev.target.closest && ev.target.closest("#view [data-pv]"); if (!t) return; openPV(+t.dataset.pv);
  });
  document.addEventListener("keydown", function (ev) {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target && ev.target.dataset && ev.target.dataset.pv && $("#lgm")) { ev.preventDefault(); openPV(+ev.target.dataset.pv); }
  });
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("#view button"); if (!t || !$("#lgm")) return;
    if (t.id === "lgbar_all") { save(false).catch(function () {}); return; }
    if (t.id === "lgbar_one") { if (PDTAB === "sel") { var sb = $("#lgsel"); if (sb) sb.click(); } else if (PDTAB !== "all") savePd(PDTAB, false); return; }
    if (t.dataset.pdt) { PDTAB = t.dataset.pdt; [].forEach.call(document.querySelectorAll("#view [data-pdp]"), function (d) { d.hidden = d.dataset.pdp !== PDTAB; }); [].forEach.call(document.querySelectorAll("#view [data-pdt]"), function (c) { var on = c.dataset.pdt === PDTAB; c.style.background = on ? "#1d6b43" : "transparent"; c.style.color = on ? "#fff" : "inherit"; }); barUpd(); return; }
    if (t.id === "lgselall" || t.id === "lgselnone") { [].forEach.call(document.querySelectorAll("#view [data-pdk]"), function (c) { c.checked = t.id === "lgselall"; }); return; }
    if (t.id === "lgsel") {
      var ks = [].filter.call(document.querySelectorAll("#view [data-pdk]"), function (c) { return c.checked; }).map(function (c) { return c.dataset.pdk; });
      if (!ks.length) { msg("⚠️ আগে অন্তত একটা কার্ডে টিক দিন।", true); return; }
      var sl = +($("#pd_sel_l") || {}).value || 0, sr = +($("#pd_sel_r") || {}).value || 0, nms = PDT.filter(function (x) { return ks.indexOf(x[0]) >= 0; }).map(function (x) { return x[1].replace(/^\S+\s/, ""); });
      savePdKeys(ks, sl, sr, false, nms.length > 3 ? nms.length + "টি বাছাই করা কার্ড" : nms.join(", ")); return;
    }
    if (t.dataset.pds) { savePd(t.dataset.pds, false); return; }
    if (t.dataset.pdr) { savePd(t.dataset.pdr, true); return; }
        if (t.id === "lgsv" || t.id === "lgsv2" || t.id === "lgsv3" || t.id === "lgcs") save(false).catch(function () {});
    else if (t.id === "lgdef" || t.id === "lgall") { var L1 = t.id === "lgdef" ? "1" : ($("#lg_al") || {}).value || "1", R1 = t.id === "lgdef" ? "2" : ($("#lg_ar") || {}).value || "2"; [["lg_l", L1], ["lg_r", R1], ["lg_fl", L1], ["lg_fr", R1], ["lg_al", L1], ["lg_ar", R1]].forEach(function (p) { var s = $("#" + p[0]); if (s) s.value = p[1]; }); [].forEach.call(document.querySelectorAll("#view [data-b]"), function (c) { c.checked = true; }); var on1 = $("#lg_on"); if (on1) on1.checked = true; PDT.forEach(function (r) { ["_l", "_r"].forEach(function (sx) { var s9 = $("#pd_" + r[0] + sx); if (s9) s9.value = "0"; }); }); save(false).catch(function () {}); }
    else if (t.id === "lgup") upload();
  });
  document.addEventListener("change", function (ev) { var i = ev.target && ev.target.id; if (i && /^pd_[1248psc]_[lr]$/.test(i) && $("#lgm")) pdThumbs(i.charAt(3)); });
  function markDirty(t) { if (!t || t.id === "lg_file" || t.id === "lg_name") return; if (!DIRTY) { DIRTY = true; msg(DMSG, true); } }
  document.addEventListener("input", function (ev) { if ($("#lgm") && ev.target.closest && ev.target.closest("#view")) { prev(); markDirty(ev.target); } });
  document.addEventListener("change", function (ev) {
    if (!$("#lgm") || !ev.target.closest || !ev.target.closest("#view")) return;
    if (ev.target.id === "lg_old") { var w = $("#lg_fixw"); if (w) w.style.display = ev.target.value === "fix" ? "flex" : "none"; }
    prev(); markDirty(ev.target);
  });
})();

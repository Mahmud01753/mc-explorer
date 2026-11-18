// MC Explorer অ্যাডমিন পেজ (admin.html): পুরস্কার জমা, চ্যাট, স্কোর, ভিজিটর, নতুন ছবি। লগইন লাগে (Supabase অ্যাডমিন ইউজার)।
(function () {
  var C = window.MC_CFG || {}, base = String(C.url || "").replace(/\/$/, ""), $ = function (s) { return document.querySelector(s); };
  var S = null, TAB = (window.MCA_TABS && window.MCA_TABS[0] ? window.MCA_TABS[0][0] : "prize"), ROOMS = [];
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var tm = function (t) { try { return new Date(t).toLocaleString("bn-BD"); } catch (e) { return t; } };
  var short = function (s) { s = String(s || ""); return s.length > 10 ? s.slice(0, 5) + "…" + s.slice(-4) : s; };
  try { S = JSON.parse(sessionStorage.getItem("mc2_adm") || "null"); } catch (e) {}
  function save(s) { S = s; try { sessionStorage.setItem("mc2_adm", JSON.stringify(s)); } catch (e) {} }
  function hdr(x) { return Object.assign({ apikey: C.key, Authorization: "Bearer " + (S ? S.access_token : C.key), "Content-Type": "application/json" }, x || {}); }
  function refresh() {
    if (!S || !S.refresh_token) return Promise.reject(new Error("auth"));
    return fetch(base + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: C.key, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: S.refresh_token }) })
      .then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); }).then(save);
  }
  function req(url, opt, retry) {
    return fetch(url, Object.assign({}, opt, { headers: hdr(opt && opt.headers) })).then(function (r) {
      if (r.status === 401 && !retry) return refresh().then(function () { return req(url, opt, true); });
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 120)); });
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }
  function rawf(url, opt, retry) { // স্টোরেজ আপলোড/মোছার জন্য (টোকেন মেয়াদ শেষ হলে নিজে নবায়ন করে)
    return fetch(url, Object.assign({}, opt, { headers: Object.assign({ apikey: C.key, Authorization: "Bearer " + (S ? S.access_token : C.key) }, opt && opt.headers) })).then(function (r) {
      if (r.status === 401 && !retry) return refresh().then(function () { return rawf(url, opt, true); });
      return r;
    });
  }
  var A = function (p, o) { return req(base + "/rest/v1/" + p, o); };
  var rpc = function (n, a) { return req(base + "/rest/v1/rpc/" + n, { method: "POST", body: JSON.stringify(a || {}) }); };
  var fail = function (e) { alert("হয়নি: " + (e && e.message ? e.message : e)); };
  window.MCA = { A: A, rpc: rpc, raw: rawf, esc: esc, tm: tm, base: base, C: C, $: $, fail: fail }; // admin-gallery.js এগুলো ব্যবহার করে

  // ---------- লগইন ----------
  function login() {
    if (!base || !C.key) { $("#lm").textContent = "config.js-এ Supabase url ও key বসানো নেই।"; return; }
    $("#lm").textContent = "⏳ যাচাই হচ্ছে…";
    fetch(base + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: C.key, "Content-Type": "application/json" }, body: JSON.stringify({ email: $("#em").value.trim(), password: $("#pw").value }) })
      .then(function (r) { if (!r.ok) throw new Error("ইমেইল বা পাসওয়ার্ড ঠিক নয়"); return r.json(); }).then(save)
      .then(function () { return rpc("mc2_is_admin"); })
      .then(function (ok) { if (ok !== true) { save(null); sessionStorage.removeItem("mc2_adm"); throw new Error("এই ইউজার অ্যাডমিন তালিকায় নেই (mc2_admins)"); } start(); })
      .catch(function (e) { $("#lm").textContent = "⚠️ " + e.message; });
  }
  $("#go").onclick = login; $("#pw").onkeydown = function (e) { if (e.key === "Enter") login(); };
  $("#out").onclick = function () { try { sessionStorage.removeItem("mc2_adm"); localStorage.removeItem("mc2_adm_hint"); } catch (e) {} S = null; location.reload(); };

  var TABS = (window.MCA_TABS || []).concat([["prize", "🎁 পুরস্কার"], ["chat", "💬 চ্যাট"], ["score", "🏆 স্কোর"], ["visit", "👥 ভিজিটর"]]);
  function start() {
    try { localStorage.setItem("mc2_adm_hint", String(Date.now())); } catch (e) {} // পাবলিক পাতায় অ্যাডমিনকে লোগো-ড্রপডাউন দেখানোর সংকেত (logo-config.js admHint)
    $("#login").hidden = true; $("#app").hidden = false;
    $("#tabs").innerHTML = TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '" class="' + (t[0] === TAB ? "on" : "") + '">' + t[1] + "</button>"; }).join("");
    $("#tabs").onclick = function (e) { var b = e.target.closest("[data-t]"); if (b) { TAB = b.dataset.t; start(); } };
    var vw0 = $("#view"); vw0.onclick = vw0.onchange = vw0.oninput = vw0.ondragover = vw0.ondrop = null; // আগের ট্যাবের ক্লিক-হ্যান্ডলার সরানো (নইলে লোগোর 🗑️ আগের ট্যাবের স্কোর/চ্যাট মুছতে পারে)
    $("#view").innerHTML = "⏳ লোড হচ্ছে…"; (Object.assign({ prize: prize, chat: chat, score: score, visit: visit }, window.MCA_VIEWS || {})[TAB] || prize)().catch(function (e) { $("#view").innerHTML = '<p class="warn">লোড হয়নি: ' + esc(e.message) + "</p>"; });
  }
  var SU = function (u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; }; // শুধু http/https লিংক; javascript: ইত্যাদি বাদ
  var del = function (p, id) {
    if (!confirm("মুছে ফেলবেন?")) return Promise.resolve();
    // Prefer: return=representation → সার্ভার কয়টা সারি আসলে মুছল তা ফেরত দেয় (কার্ডওয়ালা ইউজারের স্কোর/এন্ট্রি সুরক্ষিত, তখন ০টা মোছে)
    return A(p + "?id=eq." + id, { method: "DELETE", headers: { Prefer: "return=representation" } }).then(function (r) {
      if (Array.isArray(r) && r.length === 0) alert("❌ কিছুই মোছা হয়নি (০টা মুছেছে)।\nকারণ: এই ইউজারের কার্ড আছে, তাই এই ডেটা সরাসরি মোছা যায় না। আগে 🪪 কার্ড ট্যাব থেকে ওই ইউজারের কার্ড ডিলিট করুন (তখন তার সব ডেটা বিনে যাবে ও বিন থেকে ফেরানো যাবে)।");
      return start();
    }).catch(fail);
  };

  // ---------- পুরস্কার ----------
  function prize() {
    return A("contest_entries?select=*&order=created_at.desc&limit=300").then(function (L) {
      var card = function (e, w) { return '<div class="it' + (w ? " win" : "") + '"><div><b>' + esc(e.name) + '</b> <span class="tag">' + esc(e.pct == null ? "" : e.pct + "%") + '</span> <span class="sm">' + tm(e.created_at) + '</span></div>' +
        '<div>📞 ' + esc(e.contact || "—") + '</div><div><a href="' + esc(SU(e.fb_link)) + '" target="_blank" rel="noopener">ফেসবুক পোস্ট</a> · <a href="' + esc(SU(e.shot_url)) + '" target="_blank" rel="noopener"><img class="th" src="' + esc(SU(e.shot_url)) + '" alt="স্ক্রিনশট"></a></div>' +
        '<div class="sm">আইপি: ' + esc(e.ip || "—") + " · " + esc((e.ua || "").slice(0, 90)) + "</div>" + (w ? "" : '<div class="act"><button class="d s" data-del="' + e.id + '" type="button">মুছুন</button></div>') + "</div>"; };
      $("#view").innerHTML = '<h2>🎁 জমা পড়া (' + L.length + ')</h2><div class="row"><label>কত দিনের<input id="wd" type="number" value="7" min="1"></label><label>কতজন<input id="wc" type="number" value="5" min="1"></label><button id="wp" type="button">🎲 বিজয়ী বাছাই</button></div><div id="wr"></div>' + (L.map(function (e) { return card(e); }).join("") || '<p class="sm">এখনো কেউ জমা দেয়নি।</p>');
      $("#wp").onclick = function () { rpc("pick_winners", { p_days: +$("#wd").value || 7, p_count: +$("#wc").value || 5 }).then(function (W) { $("#wr").innerHTML = "<h2>🏆 বিজয়ী (র‍্যান্ডম)</h2>" + (W.map(function (e) { return card(e, 1); }).join("") || '<p class="sm">এই সময়ে কোনো জমা নেই।</p>'); }).catch(fail); };
      $("#view").onclick = function (e) { var b = e.target.closest("[data-del]"); if (b) del("contest_entries", b.dataset.del); };
    });
  }

  // ---------- চ্যাট ----------
  // "২০টি বাংলা শব্দ যোগ করুন" বোতামের তালিকা (ফাঁকা ছাড়া, শুধু বাংলা অক্ষর — mc2_bad_words-এর নিয়ম মেনে)। আগে থাকা শব্দ বাদ যায়।
  var BN20 = ["খানকি", "মাগি", "মাগী", "বেশ্যা", "হারামি", "হারামজাদা", "হারামজাদী", "চোদা", "চুদি", "চোদনা", "মাদারচোদ", "বোকাচোদা", "গান্ডু", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "ঢেমনা", "লুচ্চা", "রান্ডি", "বেজন্মা", "জারজ"];
  var EN20 = ["motherfucker", "bullshit", "shithead", "dickhead", "cunt", "dick", "pussy", "whore", "wanker", "prick", "twat", "douchebag", "jackass", "dumbass", "bollocks", "asshat", "cocksucker", "skank", "tosser", "arsehole"]; // ছোট হাতের ইংরেজি ২০টি (আগের ৬টি বাদে)
  var bnd = function (n) { return String(n).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  // সবার জন্য এক পেজ-নম্বর বাটন-সারি: ‹ আগের  ১ ২ ৩ …  নেক্সট ›  (attr = বাটনের data- নাম)। window.MCPG নামে অন্য ফাইলও ব্যবহার করে।
  function pgHtml(pg, total, per, attr) {
    var pages = Math.max(1, Math.ceil(total / per)), st = Math.max(0, Math.min(pg - 2, pages - 5)), en = Math.min(pages, st + 5), h = "", i, B = bnd;
    if (pages < 2) return "";
    h += '<div class="act" style="justify-content:center;flex-wrap:wrap;margin:10px 0"><button class="l s" type="button" ' + attr + '="' + (pg - 1) + '"' + (pg ? "" : " disabled") + '>‹ আগের</button>';
    if (st > 0) h += '<button class="l s" type="button" ' + attr + '="0">' + B(1) + "</button>" + (st > 1 ? '<span class="sm">…</span>' : "");
    for (i = st; i < en; i++) h += '<button class="' + (i === pg ? "" : "l ") + 's" type="button" ' + attr + '="' + i + '"' + (i === pg ? ' aria-current="page"' : "") + ">" + B(i + 1) + "</button>";
    if (en < pages) h += (en < pages - 1 ? '<span class="sm">…</span>' : "") + '<button class="l s" type="button" ' + attr + '="' + (pages - 1) + '">' + B(pages) + "</button>";
    return h + '<button class="l s" type="button" ' + attr + '="' + (pg + 1) + '"' + (pg < pages - 1 ? "" : " disabled") + ">নেক্সট ›</button></div>" + '<p class="sm" style="text-align:center">পেজ ' + B(pg + 1) + " / " + B(pages) + " · মোট " + B(total) + "টি</p>";
  }
  window.MCPG = { html: pgHtml };
  var chPg = function (pg, total, per) { return pgHtml(pg, total, per, "data-cp"); };
  function chat() {
    var room = TAB === "chat" && window.__cr ? window.__cr : "";
    // দ্রুত লোড: প্রথমে শুধু গ্রুপ + সর্বশেষ কয়েকটি বার্তা (রিপোর্ট-গণনার join ছাড়া); ⚑ রিপোর্ট, নিষিদ্ধ ডিভাইস ও খারাপ শব্দ পরে আলাদাভাবে আসে।
    var lim = 40, pg = window.__cp || 0, WORDS = [], rf = room ? "&room=eq." + encodeURIComponent(room) : "";
    return Promise.all([
      A("mc2_chat_rooms?select=name&order=sort,name"),
      A("mc2_chat_messages?select=id,room,nick,body,hidden,voter,ip,ua,created_at&order=created_at.desc&limit=" + lim + "&offset=" + (pg * lim) + rf),
      rawf(base + "/rest/v1/mc2_chat_messages?select=id&limit=1" + rf, { headers: { Prefer: "count=exact" } }).then(function (x) { var m = /\/(\d+)/.exec(x.headers.get("content-range") || ""); return m ? +m[1] : null; }).catch(function () { return null; })
    ]).then(function (r) {
      ROOMS = r[0].map(function (x) { return x.name; }); var M = r[1], total = r[2] == null ? M.length : r[2];
      $("#view").innerHTML = '<h2>💬 চ্যাট বার্তা (মোট ' + bnd(total) + 'টি)</h2><label>গ্রুপ<select id="rf"><option value="">সব গ্রুপ</option>' + ROOMS.map(function (n) { return '<option value="' + esc(n) + '"' + (n === room ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select></label>" +
        (M.map(function (m) { var rc = 0;
          return '<div class="it' + (m.hidden ? " hid" : "") + '"><div><span class="tag">' + esc(m.room) + "</span><button class=\"lk\" type=\"button\" data-uu=\"" + esc(m.voter) + "\"><b>" + esc(m.nick) + "</b></button>: " + esc(m.body) + ' <span class="warn" data-rc="' + m.id + '"></span>' + (m.hidden ? ' <span class="tag">লুকানো</span>' : "") + '</div><div class="sm">' + tm(m.created_at) + " · ডিভাইস " + esc(short(m.voter)) + " · আইপি " + esc(m.ip || "—") + " · " + esc((m.ua || "").slice(0, 70)) + '</div><div class="act"><button class="l s" data-hide="' + m.id + '" data-v="' + (m.hidden ? 0 : 1) + '" type="button">' + (m.hidden ? "দেখাও" : "লুকাও") + '</button><button class="d s" data-del="' + m.id + '" type="button">মুছুন</button><button class="d s" data-ban="' + esc(m.voter) + '" type="button">১ দিন ব্যান</button></div></div>'; }).join("") || '<p class="sm">কোনো বার্তা নেই।</p>') +
        chPg(pg, total, lim) + '<div id="chx"><p class="sm">⏳ নিষিদ্ধ ডিভাইস ও খারাপ শব্দ লোড হচ্ছে…</p></div>' +
        "<h2 style='margin-top:14px'>📂 গ্রুপের তালিকা</h2><div class='row'><input id='nr' placeholder='নতুন গ্রুপের নাম'><button id='ar' type='button'>যোগ করুন</button></div><p>" + ROOMS.map(function (n) { return '<span class="tag">' + esc(n) + ' <a href="#" data-dr="' + esc(n) + '">✕</a></span>'; }).join("") + "</p>";
      // পরে আলাদাভাবে: রিপোর্ট-সংখ্যা, নিষিদ্ধ ডিভাইস, খারাপ শব্দ (বার্তা আগেই দেখা যায়)
      var ids = M.map(function (m) { return m.id; });
      if (ids.length) A("mc2_chat_reports?select=message_id&message_id=in.(" + ids.join(",") + ")").then(function (rr) { var c = {}; rr.forEach(function (x) { c[x.message_id] = (c[x.message_id] || 0) + 1; }); [].forEach.call(document.querySelectorAll("[data-rc]"), function (el) { var n = c[el.getAttribute("data-rc")]; if (n) el.textContent = "⚑" + n; }); }).catch(function () {});
      Promise.all([A("mc2_chat_bans?select=voter,until&order=until.desc&limit=100"), A("mc2_bad_words?select=word&order=word")]).then(function (x) {
        var bx = $("#chx"); if (!bx) return; var now = Date.now(); WORDS = x[1];
        bx.innerHTML = "<h2 style='margin-top:14px'>⛔ নিষিদ্ধ ডিভাইস</h2>" + (x[0].map(function (b) { var on = new Date(b.until).getTime() > now; return '<div class="it"><div>' + esc(short(b.voter)) + " · " + (on ? '<span class="warn">চালু, শেষ ' + tm(b.until) + "</span>" : "শেষ") + '</div><div class="act"><button class="l s" data-unban="' + esc(b.voter) + '" type="button">ব্যান তুলুন</button></div></div>'; }).join("") || '<p class="sm">কেউ নেই।</p>') +
          "<h2 style='margin-top:14px'>🚫 খারাপ শব্দ</h2><div class='row'><input id='nw' placeholder='ছোট হাতের, ফাঁকা ছাড়া শব্দ'><button id='aw' type='button'>যোগ করুন</button></div><div class='act' style='margin:6px 0'><button id='bw20' class='l' type='button'>২০টি বাংলা শব্দ যোগ করুন</button><button id='bw20e' class='l' type='button'>২০টি ইংরেজি শব্দ যোগ করুন</button></div><p>" + (WORDS.map(function (w) { return '<span class="tag">' + esc(w.word) + ' <a href="#" data-dw="' + esc(w.word) + '">✕</a></span>'; }).join("") || "<span class='sm'>কোনো শব্দ নেই</span>") + "</p>";
      }).catch(function (er) { var bx = $("#chx"); if (bx) bx.innerHTML = '<p class="warn">লোড হয়নি: ' + esc(er.message) + "</p>"; });
      var v = $("#view"); v.onclick = function (e) {
        var pb = e.target.closest("[data-cp]"); if (pb && !pb.disabled) { window.__cp = +pb.dataset.cp; start(); return; }
        var t = e.target; if (t.tagName === "A") e.preventDefault();
        var h = t.closest("[data-hide]"), d = t.closest("[data-del]"), b = t.closest("[data-ban]"), u = t.closest("[data-unban]"), dw = t.closest("[data-dw]"), dr = t.closest("[data-dr]");
        if (h) A("mc2_chat_messages?id=eq." + h.dataset.hide, { method: "PATCH", body: JSON.stringify({ hidden: h.dataset.v === "1" }), headers: { Prefer: "return=minimal" } }).then(start).catch(fail);
        else if (d) del("mc2_chat_messages", d.dataset.del);
        else if (b) A("mc2_chat_bans?on_conflict=voter", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ voter: b.dataset.ban, until: new Date(Date.now() + 864e5).toISOString() }) }).then(start).catch(fail);
        else if (u) A("mc2_chat_bans?voter=eq." + encodeURIComponent(u.dataset.unban), { method: "DELETE" }).then(start).catch(fail);
        else if (dw) A("mc2_bad_words?word=eq." + encodeURIComponent(dw.dataset.dw), { method: "DELETE" }).then(start).catch(fail);
        else if (dr) { if (confirm("গ্রুপ মুছলে সেখানকার সব বার্তা ওখানে আর পাওয়া যাবে না। মুছবেন?")) A("mc2_chat_rooms?name=eq." + encodeURIComponent(dr.dataset.dr), { method: "DELETE" }).then(start).catch(fail); }
        else if (t.id === "aw") { var w = $("#nw").value.trim().toLowerCase().replace(/\s+/g, ""); if (w) A("mc2_bad_words", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ word: w }) }).then(start).catch(fail); }
        else if (t.id === "bw20" || t.id === "bw20e") {
          var have = {}; WORDS.forEach(function (x) { have[x.word] = 1; }); var LST = t.id === "bw20e" ? EN20 : BN20, add = LST.filter(function (w) { return !have[w]; });
          if (!add.length) { alert("২০টি শব্দই আগে থেকে তালিকায় আছে — নতুন কিছু যোগ হয়নি।"); return; }
          t.disabled = true;
          A("mc2_bad_words?on_conflict=word", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(add.map(function (w) { return { word: w }; })) })
            .then(function () { alert(bnd(add.length) + "টি নতুন " + (t.id === "bw20e" ? "ইংরেজি" : "বাংলা") + " শব্দ যোগ হয়েছে" + (add.length < LST.length ? "; " + bnd(LST.length - add.length) + "টি আগে থেকেই ছিল" : "") + "।"); start(); }).catch(function (er) { t.disabled = false; fail(er); });
        }
        else if (t.id === "ar") { var n = $("#nr").value.trim(); if (n) A("mc2_chat_rooms", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: n, sort: 100 }) }).then(start).catch(fail); }
      };
      $("#rf").onchange = function () { window.__cr = this.value; window.__cp = 0; start(); };
    });
  }

  // ---------- ফিল্টার (স্কোর ও ভিজিটর পেজের সাধারণ অংশ) ----------
  var PER = [["all", "সব সময়"], ["today", "আজ"], ["7", "শেষ ৭ দিন"], ["30", "শেষ ৩০ দিন"], ["range", "তারিখ বাছো"]];
  var SD = function () { return { q: "", dept: "", batch: "", per: "all", from: "", to: "", min: "", mode: "all", sort: "new", n: 100 }; };
  var VD = function () { return { q: "", per: "all", from: "", to: "", dev: "", app: "", mode: "all", sort: "new", n: 100 }; };
  var SF = SD(), VF = VD();
  function inPer(ts, f) {
    var d = new Date(); d.setHours(0, 0, 0, 0); var t0 = d.getTime(), day = 864e5, t = new Date(ts).getTime();
    if (f.per === "today") return t >= t0; if (f.per === "7") return t >= t0 - 6 * day; if (f.per === "30") return t >= t0 - 29 * day;
    if (f.per === "range") { if (f.from && t < new Date(f.from + "T00:00:00").getTime()) return false; if (f.to && t >= new Date(f.to + "T00:00:00").getTime() + day) return false; }
    return true;
  }
  function selH(k, v, opts, lb) { return '<select data-f="' + k + '" aria-label="' + esc(lb) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(v) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; }
  function inH(k, v, type, ph, extra) { return '<input data-f="' + k + '" type="' + type + '" value="' + esc(v) + '" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '"' + (extra || "") + ">"; }
  var FCSS = "<style>.fw{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:8px 0}.fw .wide{grid-column:1/-1}.fw[hidden],.fw .wide[hidden]{display:none}</style>";
  function bindF(f, repaint, manual) { // manual = true: ফিল্টার বেছে "🔎 খুঁজুন" চাপলে (বা Enter দিলে) তবেই তালিকা বদলায়
    var w = $("#fw"); if (!w) return;
    var P = Object.assign({}, f), apply = function () { Object.assign(f, P); f.n = 100; f.pg = 0; repaint(); };
    w.oninput = w.onchange = function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-f"); if (!k) return;
      if (manual) { P[k] = e.target.value; if (k === "per") $("#frg").hidden = P.per !== "range"; return; }
      f[k] = e.target.value; f.n = 100; f.pg = 0; if (k === "per") $("#frg").hidden = f.per !== "range"; repaint();
    };
    if (manual) { w.onkeydown = function (e) { if (e.key === "Enter" && e.target.getAttribute && e.target.getAttribute("data-f")) { e.preventDefault(); apply(); } }; var gb = $("#fgo"); if (gb) gb.onclick = apply; }
  }
  function pgBar(f, total) { return pgHtml(f.pg || 0, total, 100, "data-pg"); }
  function moreBtn(shown, total) { return shown < total ? '<p style="text-align:center"><button class="l" type="button" data-more="1">আরও দেখান (' + (total - shown) + ' বাকি)</button></p>' : ""; }

  // ---------- স্কোর ----------
  function score() {
    return A("mc2_scores?select=*&order=created_at.desc&limit=1000").then(function (L) {
      var uq = function (k) { var m = {}; L.forEach(function (s) { if (s[k]) m[s[k]] = 1; }); return Object.keys(m).sort().map(function (x) { return [x, x]; }); };
      var cur = [];
      function list() {
        var q = SF.q.trim().toLowerCase(), mn = +SF.min || 0;
        var R = L.filter(function (s) { return (!SF.dept || s.dept === SF.dept) && (!SF.batch || s.batch === SF.batch) && inPer(s.created_at, SF) && (!mn || s.score >= mn) && (!q || [s.name, s.device, s.ip, s.title, s.club].join(" ").toLowerCase().indexOf(q) >= 0); });
        if (SF.mode === "best") { var m = {}; R.forEach(function (s) { var k = String(s.name).toLowerCase() + "|" + s.dept + "|" + (s.batch || ""); if (!m[k] || s.score > m[k].score) m[k] = s; }); R = R.filter(function (s) { return m[String(s.name).toLowerCase() + "|" + s.dept + "|" + (s.batch || "")] === s; }); }
        if (SF.sort === "old") R = R.slice().reverse(); else if (SF.sort === "high") R = R.slice().sort(function (a, b) { return b.score - a.score || new Date(a.created_at) - new Date(b.created_at); }); else if (SF.sort === "low") R = R.slice().sort(function (a, b) { return a.score - b.score || new Date(b.created_at) - new Date(a.created_at); });
        cur = R;
        $("#fc").innerHTML = "দেখাচ্ছে <b>" + R.length + "</b> / " + L.length + "টি স্কোর";
        $("#fl").innerHTML = R.slice((SF.pg = Math.min(SF.pg || 0, Math.max(0, Math.ceil(R.length / 100) - 1))) * 100, SF.pg * 100 + 100).map(function (s) { return '<div class="it"><div><button class="lk" type="button" data-uu="' + esc(s.device) + '"><b>' + esc(s.name) + '</b></button> <span class="tag">' + esc(s.dept) + '</span>' + (s.batch ? '<span class="tag">' + esc(s.batch) + "</span>" : "") + '<span class="tag">' + s.pct + "%</span><span class='tag'>" + s.score + "</span>" + esc(s.title || "") + '</div><div class="sm">' + tm(s.created_at) + " · ডিভাইস " + esc(short(s.device)) + " · আইপি " + esc(s.ip || "—") + '</div><div class="act"><button class="d s" data-del="' + s.id + '" type="button">মুছুন</button></div></div>'; }).join("") + pgBar(SF, R.length) || '<p class="sm">এই ফিল্টারে কোনো স্কোর নেই।</p>';
      }
      function draw() {
        $("#view").innerHTML = FCSS + "<h2>🏆 স্কোর (সর্বশেষ " + L.length + ')</h2><div class="fw" id="fw">' + inH("q", SF.q, "search", "🔎 নাম / আইপি / ডিভাইস খুঁজুন", ' maxlength="60" class="wide"') +
          selH("dept", SF.dept, [["", "সব বিভাগ"]].concat(uq("dept")), "বিভাগ") + selH("batch", SF.batch, [["", "সব সেশন"]].concat(uq("batch")), "সেশন") +
          selH("per", SF.per, PER, "সময়") + selH("mode", SF.mode, [["all", "সব খেলা"], ["best", "প্রত্যেকের সেরা ফল"]], "তালিকা") +
          selH("sort", SF.sort, [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["high", "বেশি স্কোর আগে"], ["low", "কম স্কোর আগে"]], "সাজানো") + inH("min", SF.min, "number", "ন্যূনতম স্কোর (০–১০০০)", ' min="0" max="1000"') +
          '<div class="fw wide" id="frg"' + (SF.per === "range" ? "" : " hidden") + ">" + inH("from", SF.from, "date", "থেকে") + inH("to", SF.to, "date", "পর্যন্ত") + '</div></div><div class="act"><button type="button" id="fgo">🔎 খুঁজুন</button><button class="l s" type="button" id="frs">✖ ফিল্টার মুছুন</button></div><p class="sm" id="fc"></p><div id="fl"></div>';
        bindF(SF, list, true); list();
      }
      draw();
      $("#view").onclick = function (e) {
        var b = e.target.closest("[data-del]"); if (b) { del("mc2_scores", b.dataset.del); return; }
        var pgb = e.target.closest("[data-pg]"); if (pgb && !pgb.disabled) { SF.pg = +pgb.dataset.pg; list(); var fc0 = $("#fc"); if (fc0) fc0.scrollIntoView(); return; }
        if (e.target.closest("#frs")) { SF = SD(); draw(); }
      };
    });
  }

  // ---------- ভিজিটর ----------
  var VT = null; // অনলাইন বক্সের স্বয়ংক্রিয় রিফ্রেশ (১০ সেকেন্ড); ট্যাব বদলালে নিজে থেমে যায়
  function vonHtml(O) {
    var F = window.MCA_FMT || {}, bd = F.bd || bnd, cn = F.country || function (c) { return { flag: "🌐", name: c || "দেশ অজানা" }; };
    var ctr = (O.countries || []).map(function (x) { var c = cn(x.c); return '<span class="tag">' + c.flag + " " + esc(c.name) + " <b>" + bd(x.n) + "</b></span>"; }).join("");
    var rows = (O.rows || []).map(function (r) {
      var c = cn(r.country), pm = F.phone ? F.phone(r.ua, { model: r.model }) : (r.model || ""), place = [r.city, r.region].filter(function (x) { return x && x !== "XX"; }).join(", ");
      if (/^পাওয়া যায়নি/.test(pm)) pm = "মডেল অজানা";
      return '<div class="it"><div><span class="udot on"></span><button class="lk" type="button" data-uu="' + esc(r.v) + '"><b>' + esc(r.n) + '</b></button> <span class="tag">' + esc(r.u) + "</span>" + (r.d ? '<span class="tag">' + esc(r.d) + "</span>" : "") + (r.s ? '<span class="tag">' + esc(r.s) + "</span>" : "") + '<span class="tag">' + c.flag + " " + esc(c.name) + "</span></div>" +
        '<div class="sm">📱 ' + esc(pm || "মডেল অজানা") + " · 🌐 " + esc(F.ua ? F.ua(r.ua) : "") + '</div><div class="sm">🕒 শেষ সক্রিয়: ' + (F.ago ? F.ago(r.ls) : "এইমাত্র") + (r.jn && F.dur ? " · অনলাইন " + F.dur(new Date(r.jn).toISOString()) + " ধরে" : "") + " · পেজ " + esc(r.pg || "—") + " · আইপি " + esc(r.ip || "—") + (place ? " · " + esc(place) : "") + (r.visits ? " · ভিজিট " + bd(r.visits) + " বার" : "") + "</div></div>";
    }).join("");
    return "<h2>🟢 এখন অনলাইন: <b>" + bd(O.online) + '</b> <span style="font-weight:500;font-size:13px;color:var(--mut)">আজ ' + bd(O.today) + " জন · মোট " + bd(O.total) + " জন</span></h2>" + (ctr ? '<div class="act" style="margin-bottom:6px">' + ctr + "</div>" : "") + (rows || '<p class="sm">এই মুহূর্তে কেউ অনলাইনে নেই।</p>');
  }
  function vonPaint(O, err) {
    var b = document.getElementById("vonb"); if (!b) { clearInterval(VT); VT = null; return; }
    b.innerHTML = O ? vonHtml(O) : '<p class="warn">অনলাইন তালিকা লোড হয়নি: ' + esc(err || "") + '</p><p class="sm">নতুন SQL (supabase-new-20261017b.sql) একবার Supabase SQL Editor-এ চালালে এটা আসবে।</p>';
  }
  function vonPoll() { rpc("mc2_admin_online_full").then(function (O) { vonPaint(O); }).catch(function (e) { vonPaint(null, e && e.message); }); }
  function visit() {
    return A("mc2_visits?select=*&order=created_at.desc&limit=1000").then(function (L) {
      var more = L.length >= 1000 && L.length < 3000; var isMob = function (v) { return /Mobi|Android|iPhone|iPad/i.test(v.ua || ""); }, cur = [], VS = {}, pgRows = [], fullR = [];
      function list() {
        var q = VF.q.trim().toLowerCase(), d0 = new Date(); d0.setHours(0, 0, 0, 0);
        var R = L.filter(function (v) { var i = v.info || {}; return inPer(v.created_at, VF) && (!VF.dev || (VF.dev === "m") === isMob(v)) && (!VF.app || (VF.app === "y") === !!i.inapp) && (!q || [v.ip, v.device, v.page, v.ua, JSON.stringify(i)].join(" ").toLowerCase().indexOf(q) >= 0); });
        fullR = R; if (VF.mode === "uniq") { var seen = {}; R = R.filter(function (v) { if (seen[v.device]) return false; seen[v.device] = 1; return true; }); }
        if (VF.sort === "old") R = R.slice().reverse();
        cur = R; var dev = {}, today = 0; R.forEach(function (v) { dev[v.device] = 1; if (new Date(v.created_at) >= d0) today++; });
        $("#fc").innerHTML = "দেখাচ্ছে <b>" + R.length + "</b> / " + L.length + "টি ভিজিট · আজ: <b>" + today + "</b> · আলাদা ডিভাইস: <b>" + Object.keys(dev).length + "</b>" + (more ? ' <button class="l s" type="button" id="vnext">⏭ নেক্সট: পরের ১০০০ লোড</button>' : (L.length >= 3000 ? " (সর্বোচ্চ ৩০০০ লোড হয়েছে)" : ""));
        pgRows = R.slice((VF.pg = Math.min(VF.pg || 0, Math.max(0, Math.ceil(R.length / 100) - 1))) * 100, VF.pg * 100 + 100); $("#fl").innerHTML = pgRows.map(function (v) { var i = v.info || {}; return '<div class="it"><div><label class="chk" style="display:inline-flex;margin-right:6px"><input type="checkbox" data-vs="' + v.id + '"' + (VS[v.id] ? " checked" : "") + ' aria-label="বাছুন" style="width:18px;height:18px"></label><b>' + tm(v.created_at) + "</b> · আইপি " + esc(v.ip || "—") + ' · <span data-dev="' + esc(v.device || "") + '">ডিভাইস ' + esc(short(v.device)) + '</span></div><div class="sm">' + esc([i.sw, i.plat, i.lang, i.tz, i.net, i.inapp ? "অ্যাপের ব্রাউজার" : "", i.ref ? "রেফারার: " + i.ref : ""].filter(Boolean).join(" · ")) + '</div><div class="sm">' + esc((v.ua || "").slice(0, 160)) + "</div></div>"; }).join("") + pgBar(VF, R.length) || '<p class="sm">এই ফিল্টারে কোনো ভিজিট নেই।</p>'; vsPaint();
      }
      function dupIds() { // প্রতি ডিভাইসের সবচেয়ে নতুন লগ রেখে বাকিগুলোর id (ফিল্টার করা তালিকার ভেতরে)
        var best = {}; fullR.forEach(function (v) { if (!v.device) return; var b = best[v.device]; if (!b || new Date(v.created_at) > new Date(b.created_at)) best[v.device] = v; });
        return fullR.filter(function (v) { return v.device && best[v.device] !== v; }).map(function (v) { return v.id; });
      }
      function vsPaint() { // টিক-বক্স + মোছার বাটনের সারি
        var b = $("#vsb"); if (!b) return; var n = Object.keys(VS).length, allPg = pgRows.length > 0 && pgRows.every(function (v) { return VS[v.id]; });
        b.innerHTML = '<label class="chk"><input type="checkbox" id="vsa"' + (allPg ? " checked" : "") + '> এই পেজের সব বাছুন</label><b>' + n + 'টি বাছা</b>' +
          '<button class="d s" type="button" id="vdel"' + (n ? "" : " disabled") + '>🗑 বাছাগুলো মুছুন</button>' + (function () { var d = dupIds().length; return '<button class="d s" type="button" id="vdup"' + (d ? "" : " disabled") + '>🧹 প্রতি ডিভাইসের নতুনটা রেখে বাকি মুছুন (' + d + ")</button>"; })() +
          (VF.mode === "uniq" ? "" : '<button class="d s" type="button" id="vdall"' + (cur.length ? "" : " disabled") + '>🗑 ফিল্টার করা সব মুছুন (' + cur.length + ")</button>") +
          (n ? '<button class="l s" type="button" id="vclr">✖ বাছা বাদ</button>' : "") + '<span class="sm" id="vsm"></span>';
      }
      function vdelIds(ids, what) {
        ids = ids.map(Number).filter(function (x) { return x > 0; }); if (!ids.length) return;
        if (!confirm("⚠ " + what + ": " + ids.length + "টি ভিজিট-লগ চিরতরে মুছবেন?\nএগুলো বিনে যাবে না, ফেরানো যাবে না।")) return;
        if (ids.length >= 50 && !confirm("আবার নিশ্চিত করুন: " + ids.length + "টি ভিজিট-লগ মুছে যাবে।")) return;
        var chunks = [], i, done = 0, m = $("#vsm"); for (i = 0; i < ids.length; i += 150) chunks.push(ids.slice(i, i + 150));
        ["#vdel", "#vdall"].forEach(function (s) { var x = $(s); if (x) x.disabled = true; });
        (function nx() {
          if (!chunks.length) return Promise.resolve(); var c = chunks.shift();
          return A("mc2_visits?id=in.(" + c.join(",") + ")", { method: "DELETE", headers: { Prefer: "return=minimal" } }).then(function () { done += c.length; if (m) m.textContent = "⏳ মোছা হচ্ছে… " + done + "/" + ids.length; return nx(); });
        })().then(function () {
          var gone = {}; ids.forEach(function (x) { gone[x] = 1; }); L = L.filter(function (v) { return !gone[v.id]; }); VS = {}; list();
          var m2 = $("#vsm"); if (m2) m2.textContent = "✅ " + ids.length + "টি মোছা হয়েছে";
        }).catch(function (e) { list(); fail(e); });
      }
      function draw() {
        $("#view").innerHTML = FCSS + '<div class="c" id="vonb" style="margin-bottom:10px">⏳ অনলাইন তথ্য লোড হচ্ছে…</div><h2>👥 ভিজিটর (সর্বশেষ ' + L.length + ')</h2><div class="fw" id="fw">' + inH("q", VF.q, "search", "🔎 আইপি / ডিভাইস / ব্রাউজার খুঁজুন", ' maxlength="60" class="wide"') +
          selH("per", VF.per, PER, "সময়") + selH("dev", VF.dev, [["", "মোবাইল + ডেস্কটপ"], ["m", "শুধু মোবাইল"], ["d", "শুধু ডেস্কটপ"]], "ডিভাইসের ধরন") +
          selH("app", VF.app, [["", "সব ব্রাউজার"], ["y", "অ্যাপের ব্রাউজার (ফেসবুক ইত্যাদি)"], ["n", "সাধারণ ব্রাউজার"]], "ব্রাউজার") + selH("mode", VF.mode, [["all", "সব ভিজিট"], ["uniq", "আলাদা ডিভাইস (একবার করে)"]], "তালিকা") +
          selH("sort", VF.sort, [["new", "নতুন আগে"], ["old", "পুরোনো আগে"]], "সাজানো") +
          '<div class="fw wide" id="frg"' + (VF.per === "range" ? "" : " hidden") + ">" + inH("from", VF.from, "date", "থেকে") + inH("to", VF.to, "date", "পর্যন্ত") + '</div></div><div class="act"><button type="button" id="fgo">🔎 খুঁজুন</button><button class="l s" type="button" id="frs">✖ ফিল্টার মুছুন</button><button id="csv" type="button">⬇️ CSV ডাউনলোড (ফিল্টার করা)</button></div><div class="act" id="vsb" style="margin:6px 0;align-items:center"></div><p class="sm" id="fc"></p><div id="fl"></div>';
        bindF(VF, list, true); list(); vonPoll(); clearInterval(VT); VT = setInterval(vonPoll, 10000);
        $("#csv").onclick = function () {
          var q = function (x) { var s = String(x == null ? "" : x); if (typeof x !== "number" && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
          var csv = "\ufeffসময়,ডিভাইস,আইপি,পেজ,ইউজার-এজেন্ট,তথ্য\r\n" + cur.map(function (v) { return [v.created_at, v.device, v.ip, v.page, v.ua, JSON.stringify(v.info || {})].map(q).join(","); }).join("\r\n");
          var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "visitors.csv"; a.click();
        };
      }
      draw();
      $("#view").onchange = function (e) {
        var t = e.target; if (!t || !t.dataset) return;
        if (t.dataset.vs) { if (t.checked) VS[t.dataset.vs] = 1; else delete VS[t.dataset.vs]; vsPaint(); }
        else if (t.id === "vsa") { pgRows.forEach(function (v) { if (t.checked) VS[v.id] = 1; else delete VS[v.id]; }); list(); }
      };
      $("#view").onclick = function (e) { if (e.target.closest("#vdel")) { vdelIds(Object.keys(VS), "বাছা ভিজিট"); return; } if (e.target.closest("#vdup")) { vdelIds(dupIds(), "প্রতি ডিভাইসের সবচেয়ে নতুন লগ রেখে বাকি ভিজিট"); return; } if (e.target.closest("#vdall")) { vdelIds(cur.map(function (v) { return v.id; }), "ফিল্টার করা সব ভিজিট"); return; } if (e.target.closest("#vclr")) { VS = {}; list(); return; } var pgb = e.target.closest("[data-pg]"); if (pgb && !pgb.disabled) { VF.pg = +pgb.dataset.pg; list(); var fc0 = $("#fc"); if (fc0) fc0.scrollIntoView(); return; } var nx = e.target.closest("#vnext"); if (nx) { nx.disabled = true; A("mc2_visits?select=*&order=created_at.desc&limit=1000&offset=" + L.length).then(function (X) { X = X || []; L = L.concat(X); more = X.length >= 1000 && L.length < 3000; list(); }).catch(function () { nx.disabled = false; }); return; } if (e.target.closest("[data-more]")) { VF.n += 100; list(); } else if (e.target.closest("#frs")) { VF = VD(); draw(); } };
    });
  }

  var idleT; function bump() { clearTimeout(idleT); if (S) idleT = setTimeout(function () { try { sessionStorage.removeItem("mc2_adm"); localStorage.removeItem("mc2_adm_hint"); } catch (e) {} location.reload(); }, 30 * 60 * 1000); } // ৩০ মিনিট কিছু না করলে নিজে লগআউট
  ["click", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, bump, { passive: true }); }); bump();
  if (S && S.access_token) rpc("mc2_is_admin").then(function (ok) { if (ok === true) start(); else { try { sessionStorage.removeItem("mc2_adm"); } catch (e) {} } }).catch(function () {});
})();

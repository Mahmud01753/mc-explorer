// MC Explorer — চ্যাট, সবার লিডারবোর্ড, ভিজিটর লগ, অ্যাডমিনের যোগ করা নতুন ছবি (Supabase লাগে; supabase-community.sql একবার চালাতে হয়)
// এই ফাইল না থাকলেও সাইট চলে (শুধু এই ফিচারগুলো আসে না)।
(function () {
  var C = window.MC_CFG || {}, ON = !!(C.url && C.key), D = window.MC || {}, base = ON ? String(C.url).replace(/\/$/, "") : "";
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var noop = function () {};
  function vid() { var v = LS.get("mc2_vid", ""); if (!v) { v = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); LS.set("mc2_vid", v); } return v; }
  function H(x) { return Object.assign({ apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, x || {}); }
  function api(p, o) { return fetch(base + "/rest/v1/" + p, Object.assign({ headers: H() }, o || {})).then(function (r) { if (!r.ok) { var e = new Error(r.status); e.status = r.status; throw e; } return r.status === 204 ? null : r.json(); }); }
  function rpc(n, a) { return fetch(base + "/rest/v1/rpc/" + n, { method: "POST", headers: H(), body: JSON.stringify(a) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  // ডিভাইসের তথ্য (নিরাপত্তা ও অপব্যবহার ঠেকাতে; আইপি সার্ভার নিজে হেডার থেকে নেয়)
  // ফোন মডেল: নতুন Chrome UA-তে মডেল লুকায় ("K"), তাই ব্রাউজারের অনুমোদিত হিন্ট থেকে নেওয়া হয় (সব ব্রাউজারে নেই; না এলে খালি)
  var HM = "";
  var HE = null; // Chrome-এর অনুমোদিত হিন্ট: OS সংস্করণ, আর্কিটেকচার, ব্রাউজার ব্র্যান্ড (পারমিশন লাগে না; অন্য ব্রাউজারে খালি)
  try { if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) navigator.userAgentData.getHighEntropyValues(["model", "platform", "platformVersion", "architecture", "bitness", "fullVersionList"]).then(function (v) { v = v || {}; HM = String(v.model || "").slice(0, 40); HE = { pl: String(v.platform || "").slice(0, 20), plv: String(v.platformVersion || "").slice(0, 20), arch: String(v.architecture || "").slice(0, 10), bit: String(v.bitness || "").slice(0, 4), br: (v.fullVersionList || []).filter(function (b) { return !/Not.?A.?Brand/i.test(b.brand); }).slice(0, 3).map(function (b) { return String(b.brand).slice(0, 24) + " " + String(b.version).slice(0, 16); }).join(", ") }; }).catch(function () {}); } catch (e) {}
  // জেন্ডার: খেলোয়াড় "আমি কে?"-তে যা বেছেছে তা থেকে (ছেলে/স্যার = m, মেয়ে/ম্যাম = f, ভিজিটর = x)। কার্ড না বানালেও যায়।
  function gender() { try { var P = JSON.parse(localStorage.getItem("mc2_profile") || "{}"); return { male: "m", sir: "m", female: "f", mam: "f", visitor: "x" }[P.kind] || ""; } catch (e) { return ""; } }
  function mq(q) { try { return window.matchMedia(q).matches ? 1 : 0; } catch (e) { return 0; } }
  function info() {
    var n = navigator, c = n.connection || {};
    return { sw: screen.width + "x" + screen.height, vp: innerWidth + "x" + innerHeight, dpr: window.devicePixelRatio || 1, lang: n.language || "", langs: (n.languages || []).slice(0, 4).join(","),
      tz: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } })(), plat: n.platform || "", mem: n.deviceMemory || null, cores: n.hardwareConcurrency || null,
      net: c.effectiveType || "", touch: n.maxTouchPoints || 0, model: HM, g: gender(), he: HE, cd: screen.colorDepth || null, ori: (screen.orientation && screen.orientation.type) || "", dl: c.downlink || null, rtt: c.rtt || null, sd: c.saveData ? 1 : 0, ck: n.cookieEnabled ? 1 : 0, dnt: n.doNotTrack || "", tzo: new Date().getTimezoneOffset(), pwa: mq("(display-mode: standalone)"), dark: mq("(prefers-color-scheme: dark)"), q: String(location.search || "").slice(0, 120), inapp: /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|Snapchat|TikTok/i.test(n.userAgent || ""), ref: String(document.referrer || "").slice(0, 200), url: location.pathname + location.hash };
  }
  window.mcVid = vid; window.mcInfo = info;

  // ---------- ভিজিটর লগ (প্রতি সেশনে একবার) ----------
  if (ON) { try { if (!sessionStorage.getItem("mc2_vl")) { sessionStorage.setItem("mc2_vl", "1"); rpc("mc2_log_visit", { p_device: vid(), p_page: location.hash || "#home", p_info: info() }).catch(noop); } } catch (e) {} }

  // ---------- সবার লিডারবোর্ড ----------
  window.mcSubmitScore = function (r) {
    if (!ON || !r) return;
    rpc("mc2_submit_score", { p_name: String(r.name || "").slice(0, 200), p_dept: r.dept, p_batch: r.batch || "", p_club: r.club || "", p_title: r.title || "", p_pct: r.pct, p_score: r.score, p_ok: r.ok, p_total: r.total, p_device: vid(), p_info: info() }).catch(noop);
  };
  // লিডারবোর্ড ফিল্টার/র‍্যাংক সার্ভারে (supabase-live-board.sql: mc2_board)
  window.mcBoardQ = function (f) {
    if (!ON) return Promise.reject(new Error("off"));
    var iso = function (t) { return t ? new Date(t).toISOString() : null; };
    return rpc("mc2_board", { p_dept: f.dept || null, p_batch: f.batch || null, p_from: iso(f.from), p_to: iso(f.to), p_q: f.q || null, p_mode: f.mode || "best", p_limit: f.limit || 30, p_offset: f.offset || 0 }).then(function (r) { if (!r || r.err) throw new Error("slow"); return r; });
  };
  // হোমের "আজ কতজন খেলেছে / আজকের শীর্ষ ৩": আজকের (ফোনের সময়ের) তারিখের স্কোর সার্ভার থেকে (mc2_board; নতুন SQL লাগে না)। ৬০ সেকেন্ড ক্যাশ
  var tdC = null;
  window.mcToday = function () {
    if (!ON) return Promise.reject(new Error("off"));
    if (tdC && Date.now() - tdC.t < 60000) return tdC.p;
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var p = window.mcBoardQ({ from: d.getTime(), limit: 500, mode: "best" }).catch(function (e) { tdC = null; throw e; });
    tdC = { t: Date.now(), p: p }; return p;
  };
  // সার্ভে (supabase-new-20261127.sql): অপশন ও সবার ফল সার্ভার থেকে, ভোট সার্ভারে জমা
  window.mcSurvey = {
    get: function () { if (!ON) return Promise.reject(new Error("off")); return rpc("mc2_survey_get", { p_device: vid() }).then(function (r) { if (!r || r.err) throw new Error("slow"); return r; }); },
    send: function (fav, chg) { if (!ON) return Promise.reject(new Error("off")); return rpc("mc2_survey_submit", { p_device: vid(), p_fav: fav || null, p_chg: chg || [] }).then(function (r) { if (!r || r.err) throw new Error((r && r.err) || "slow"); return r; }); }
  };
  window.mcRankHist = function (name, dept, batch) { // র‍্যাংক হিস্টরি (supabase-new-20261030.sql)
    if (!ON) return Promise.reject(new Error("off"));
    return rpc("mc2_rank_history", { p_name: name || "", p_dept: dept || "", p_batch: batch || "" }).then(function (r) { if (!r || r.err) throw new Error("slow"); return r; });
  };
  var bt = 0;
  window.mcLoadBoard = function (cb) {
    if (!ON || Date.now() - bt < 20000) return; bt = Date.now();
    rpc("mc2_top_scores", { p_limit: 500 }).then(function (L) {
      window.MC_REMOTE_ROWS = (L || []).map(function (x) { return { name: x.name, dept: x.dept, batch: x.batch || "", pct: x.pct, score: x.score, ts: x.ts }; });
      if (cb) cb();
    }).catch(noop);
  };

  // ---------- অ্যাডমিনের যোগ করা নতুন ছবি (খেলায় নতুন জায়গা) ----------
  function applyPlaces(L) {
    if (!D.places || !L) return;
    for (var i = D.places.length - 1; i >= 0; i--) if (D.places[i].extra) D.places.splice(i, 1);
    L.forEach(function (p) { if (!p || !p.bn || !p.img) return; if (D.places.some(function (x) { return x.bn === p.bn; })) return; D.places.push({ name: p.en || p.bn, bn: p.bn, images: [p.img], hue: (p.bn.length * 53) % 360, x: 200, y: 120, w: 3, tree: "বাম", sign: "লাল", extra: 1 }); });
  }
  applyPlaces(LS.get("mc2_xp", []));
  if (ON) api("mc2_places?select=bn,en,img&order=id").then(function (L) { LS.set("mc2_xp", L); applyPlaces(L); }).catch(noop);

  // ---------- কুইজ: অ্যাডমিনের ছবি থেকে স্বয়ংক্রিয় MCQ + সেটিংস (supabase-gallery.sql) ----------
  // না থাকলে বা ফাঁকা থাকলে খেলা আগের মতোই data.js-এর ছবি দিয়ে চলে।
  window.MC_QUIZ = LS.get("mc2_xq", null);
  function applyQuiz(R, T) {
    var cfg = {}; (T || []).forEach(function (x) { cfg[x.key] = x.value; });
    var qs = (R || []).map(function (r) { var p = r.mc2_places || {}; return { id: r.place_id, q: r.question, a: r.correct, w: r.wrong || [], img: p.img, cat: p.category || "", bn: p.bn || r.correct }; })
      .filter(function (x) { return x.img && x.a && x.w.length >= 3; });
    var n = Math.round(+cfg.quiz_count); if (!(n >= 1 && n <= 50)) n = 10;
    window.MC_QUIZ = { qs: qs, count: n, cats: Array.isArray(cfg.quiz_categories) ? cfg.quiz_categories : [], png_kb: +cfg.png_max_kb || 0, card: (cfg.card_cfg && typeof cfg.card_cfg === "object") ? cfg.card_cfg : null };
    LS.set("mc2_xq", window.MC_QUIZ);
  }
  // ভারী ডাউনলোড (১০০০ প্রশ্ন): পেজ লোড ও হোম আঁকা শেষ হওয়ার পর (idle হলে), যাতে হোম আগে আসে। আগের সেভ করা কপি (mc2_xq) ওপরে আগেই বসে যায়।
  var quizOnce = 0, loadQuiz = function () { if (quizOnce) return; quizOnce = 1; Promise.all([api("mc2_questions?select=place_id,question,correct,wrong,mc2_places(bn,img,category)&limit=1000"), api("mc2_settings?select=key,value")]).then(function (r) { applyQuiz(r[0], r[1]); }).catch(function () { quizOnce = 0; }); };
  window.mcLoadQuiz = loadQuiz;
  if (ON) { var qgo = function () { if (window.requestIdleCallback) requestIdleCallback(loadQuiz, { timeout: 2500 }); else setTimeout(loadQuiz, 1200); }; if (document.readyState === "complete") qgo(); else window.addEventListener("load", qgo); }

  // প্রতিটি উত্তর সার্ভারে জমা (ব্যর্থ হলে ফোনে রেখে পরের বার আবার চেষ্টা)
  function sendAns(it) { return rpc("mc2_submit_answers", { p_session: it.sid, p_device: vid(), p_name: it.name, p_answers: it.log }); }
  window.mcSubmitAnswers = function (sid, name, log) {
    if (!ON || !sid || !log || !log.length) return;
    var it = { sid: sid, name: String(name || "").slice(0, 200), log: log };
    sendAns(it).catch(function () { var q = LS.get("mc2_pa", []); q.push(it); LS.set("mc2_pa", q.slice(-5)); });
  };
  if (ON) { var pa = LS.get("mc2_pa", []); if (pa.length) { LS.set("mc2_pa", []); pa.forEach(function (it) { sendAns(it).catch(function () { var q = LS.get("mc2_pa", []); q.push(it); LS.set("mc2_pa", q.slice(-5)); }); }); } }

  // ---------- বেনামি চ্যাট ----------
  var A = ["হাসিখুশি", "চুপচাপ", "দুষ্টু", "শান্ত", "ঝড়ো", "মিষ্টি", "সাহসী", "ভোলা", "চঞ্চল", "রোদেলা"], B = ["বাঘ", "পাখি", "মেঘ", "তারা", "ফুল", "নদী", "জোনাকি", "কাঠবিড়ালি", "প্রজাপতি", "ময়না"];
  function nick() { var n = LS.get("mc2_nick", ""); if (!n) { var p = function (x) { return x[Math.floor(Math.random() * x.length)]; }; n = p(A) + " " + p(B) + " #" + (10 + Math.floor(Math.random() * 90)); LS.set("mc2_nick", n); } return n; }
  var ROOM = "", BAN = 0, WARN = 0, lastSend = 0, iv = null, X = null;
  function chatBody() {
    var $ = function (s) { return document.querySelector(s); }, esc = X.esc;
    function paintStat() {
      var el = $("#cstat"); if (!el) return; var left = Math.max(0, Math.ceil((BAN - Date.now()) / 1000)), h = "";
      if (left > 0) h += '<div class="box cmp lose">⛔ খারাপ ভাষার জন্য নিষিদ্ধ। বাকি ' + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") + "</div>";
      if (WARN > 0) h += '<div class="box w">⚠️ তোমার একটি বার্তা রিপোর্ট হয়েছে। ভদ্রভাবে কথা বলো, নইলে নিষিদ্ধ হতে পারো। <button class="chip" id="cack" type="button">বুঝেছি</button></div>';
      if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; var a = $("#cack"); if (a) a.onclick = function () { WARN = 0; rpc("mc2_chat_ack", { p_voter: vid() }).catch(noop); paintStat(); }; }
      var i = $("#cin"), b = $("#csend"); if (i) { i.disabled = left > 0; b.disabled = left > 0; }
    }
    function status() { rpc("mc2_chat_status", { p_voter: vid() }).then(function (s) { BAN = Date.now() + s.ban * 1000; WARN = s.warn; paintStat(); }).catch(noop); }
    function load(force) {
      var el = $("#cmsgs"); if (!el) return;
      api("mc2_chat_messages?select=id,nick,body&room=eq." + encodeURIComponent(ROOM) + "&order=created_at.desc&limit=100").then(function (L) {
        L = L.reverse(); var rep = LS.get("mc2_rep", []), near = force || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        el.innerHTML = L.filter(function (m) { return rep.indexOf(m.id) < 0; }).map(function (m) { return '<p><b>' + esc(m.nick) + "</b> " + esc(m.body) + ' <button class="rep" type="button" data-rep="' + m.id + '" aria-label="রিপোর্ট করো">⚑</button></p>'; }).join("") || '<p class="sm">এখনো কেউ কিছু লেখেনি। প্রথম কথাটি তুমিই বলো।</p>';
        if (near) el.scrollTop = el.scrollHeight;
      }).catch(function () { el.innerHTML = '<p class="sm">বার্তা লোড হয়নি — নেটওয়ার্ক দেখো।</p>'; });
    }
    function send() {
      var i = $("#cin"), t = i.value.trim(), toast = X.toast;
      if (!t) return toast("কিছু লেখো।"); if (BAN > Date.now()) return toast("তুমি এখন নিষিদ্ধ।"); if (Date.now() - lastSend < 3000) return toast("একটু থামো, তারপর পাঠাও."); lastSend = Date.now();
      rpc("mc2_send_chat", { p_room: ROOM, p_nick: nick(), p_body: t, p_voter: vid(), p_info: info() }).then(function (r) {
        if (r === "ok") { i.value = ""; load(true); }
        else if (String(r).indexOf("banned:") === 0) { i.value = ""; BAN = Date.now() + (+String(r).slice(7)) * 1000; paintStat(); toast("খারাপ ভাষা! বার্তা মুছে গেছে, ১০ মিনিট নিষিদ্ধ।"); }
        else if (r === "slow") toast("খুব দ্রুত পাঠাচ্ছ — একটু থামো।"); else toast("বার্তা পাঠানো যায়নি।");
      }).catch(function () { toast("পাঠানো যায়নি — নেটওয়ার্ক দেখো।"); });
    }
    function report(id) {
      fetch(base + "/rest/v1/mc2_chat_reports", { method: "POST", headers: H({ Prefer: "return=minimal" }), body: JSON.stringify({ message_id: +id, voter: vid() }) }).then(function (r) {
        if (r.status !== 409 && !r.ok) throw 0; var k = LS.get("mc2_rep", []); k.push(+id); LS.set("mc2_rep", k); load(); X.toast(r.status === 409 ? "আগেই রিপোর্ট করেছ।" : "রিপোর্ট হয়েছে। ধন্যবাদ।");
      }).catch(function () { X.toast("রিপোর্ট যায়নি — নেটওয়ার্ক দেখো।"); });
    }
    function shell(rooms) {
      if (rooms.indexOf(ROOM) < 0) { var mine = X.P && X.P.dept; ROOM = rooms.indexOf(LS.get("mc2_room", "")) >= 0 ? LS.get("mc2_room", "") : rooms.indexOf(mine) >= 0 ? mine : rooms[0]; }
      X.V.innerHTML = '<div class="box"><label class="lbl" for="crm">গ্রুপ বাছো</label><select class="in" id="crm">' + rooms.map(function (r) { return '<option value="' + esc(r) + '"' + (r === ROOM ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("") + "</select></div>" +
        '<div id="cstat"></div><div id="cmsgs" class="cmsgs" aria-live="polite"></div><p class="sm">তুমি: <b>' + esc(nick()) + '</b> <button class="chip" type="button" id="cnew">নতুন নাম</button></p>' +
        '<div class="crow"><input class="in" id="cin" maxlength="200" placeholder="কিছু লেখো…" aria-label="বার্তা"><button class="btn o s" id="csend" type="button">পাঠাও</button></div>';
      $("#crm").onchange = function () { ROOM = this.value; LS.set("mc2_room", ROOM); load(true); };
      $("#cnew").onclick = function () { LS.set("mc2_nick", ""); X.V.querySelector("p.sm b").textContent = nick(); };
      $("#csend").onclick = send; $("#cin").onkeydown = function (e) { if (e.key === "Enter") send(); };
      $("#cmsgs").onclick = function (e) { var b = e.target.closest("[data-rep]"); if (b) report(b.dataset.rep); };
      load(true); status(); paintStat();
      clearInterval(iv); iv = setInterval(function () { if (!$("#cmsgs")) { clearInterval(iv); return; } if (document.hidden) return; load(); status(); paintStat(); }, 5000);
    }
    var fallback = ["ক্যাম্পাস লাউঞ্জ"].concat(D.depts || []);
    api("mc2_chat_rooms?select=name&order=sort,name").then(function (L) { shell(L.length ? L.map(function (r) { return r.name; }) : fallback); }).catch(function () { shell(fallback); });
  }
  window.mcChat = function (V, ctx) {
    X = { V: V, esc: ctx.esc, toast: ctx.toast, P: ctx.P };
    if (!ON) { V.innerHTML = '<div class="box"><b>চ্যাট এখনো চালু নয়</b><p class="sm">সবার সাথে আড্ডা দিতে অনলাইন সার্ভার (Supabase) লাগে। config.js-এ url ও key বসালে চালু হবে।</p></div>'; return; }
    if (!LS.get("mc2_chat_ok", false)) {
      V.innerHTML = '<div class="box"><h3 style="margin:0 0 6px">💬 চ্যাটের নিয়ম</h3><ul class="pzs"><li>কারও নাম নিয়ে অপমান, র‍্যাগিং বা হুমকি নয়।</li><li>ছবি, ফোন নম্বর বা ব্যক্তিগত তথ্য দেবেন না।</li><li>সবাই বেনামি, তবে খারাপ ভাষা লিখলে অটো নিষিদ্ধ।</li><li>খারাপ বার্তায় ⚑ চেপে রিপোর্ট করুন। ৩টি রিপোর্টে বার্তা লুকিয়ে যায়।</li></ul></div><button class="btn o xl" id="cok" type="button">বুঝেছি, চ্যাটে ঢুকি</button>';
      V.querySelector("#cok").onclick = function () { LS.set("mc2_chat_ok", true); chatBody(); }; return;
    }
    chatBody();
  };
})();

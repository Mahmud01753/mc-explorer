// অ্যাডমিন লটারি — একটাই স্ক্রিন: একাধিক ফোল্ডার (অটো / কাস্টম / আগের বিজয়ী) + কাস্টম নাম, "this" নিয়ম, শেষে বিজয়ীদের নিজে নতুন বিজয়ী ফোল্ডার।
// ফোল্ডার ও ইউজারের তথ্য window.MCF (admin-folders.js) থেকে আসে। রিয়েল লটারিতে বিজয়ী mc2_ufolders-এ (kind = winners) সেভ হয়; টেস্টে কিছুই সেভ হয় না।
// চাকা, সাউন্ড, বাছাই (P.rnd) আগের মতোই। window.MCLOT.wheel(...) (🏅 বিজয়ী ঘোষণা ট্যাবের লটারি) অপরিবর্তিত — সেটা আগের mc2_draws নিয়মে চলে।
// ধাপ ২-খ: শর্ত-টিক (ভেরিফাইড / ন্যূনতম স্কোর / খেলেছে+ফর্ম), প্রতি ফোল্ডার/বিভাগ থেকে ১ জন মোড, বিজয়ী ফোল্ডারে লটারির রেকর্ড, সাড়া না দিলে MCLOT.redraw (বাতিল + আরেকজন)।
// admin-folders.js ও admin-prize.js-এর পরে লোড হয়। SQL: supabase-new-20261018g.sql + h + i (একবার চালাতে হয়)।
// ধাপ ৬: "ধাপ ১" ড্রপডাউনে সব ফোল্ডার সবসময় থাকে (বাছাগুলো ✔, আবার চাপলে বাদ); ইউজারের অবস্থা ৪টা (window.MCFL, admin-folders.js) — 🚫 বাদ ও 📵 সাড়া পাওয়া যায়নি দুটোই পুল থেকে বাদ, নামের তালিকা ও বিজয়ীর লাইনেও অবস্থা বাছা যায়। 📵-এর SQL: supabase-new-20261018k.sql।
(function () {
  var P = null, M = null, FO = [], LISTS = [], REF = true;
  var el = null, run = false, stop = false;
  var css = document.createElement("style");
  css.textContent = ".lwr{position:relative;width:min(88vw,460px);margin:0 auto}.lwr canvas{width:100%;height:auto;display:block}" +
    ".lpop{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;background:#fff;color:#10261b;border:3px solid #d98200;border-radius:14px;padding:8px 16px;font-size:22px;font-weight:800;max-width:84%;text-align:center;transition:all .35s;pointer-events:none;z-index:2}" +
    ".lpop.on{opacity:1;transform:translate(-50%,-50%) scale(1)}.lchip{display:inline-block;border:1px solid var(--bd);border-radius:999px;padding:5px 11px;margin:0 5px 5px 0;font-weight:600;cursor:pointer;background:none;color:var(--fg)}" +
    ".lchip.on{background:var(--g);color:#fff;border-color:var(--g)}.lbadge{display:inline-block;background:#b3261e;color:#fff;border-radius:6px;padding:1px 8px;font-size:12px;font-weight:700}" +
    ".lmask{-webkit-text-security:disc;text-security:disc}.lw{display:flex;gap:6px;align-items:center;padding:5px 0;border-top:1px dashed var(--bd);flex-wrap:wrap}.lw b{font-size:14px}.lw .sm{flex:1 1 100%}" +
    ".lot{display:grid;gap:12px}.lst{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:12px;display:grid;gap:8px}.lsh{display:flex;align-items:center;gap:8px}.lsh i{font-style:normal;width:24px;height:24px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}.lsh b{font-size:15px}" +
    ".lnk{border:0;background:none;color:var(--g);font:700 13px inherit;padding:4px 0;text-align:left;cursor:pointer}.lnk.lcen{text-align:center;width:100%;padding:8px}.lel{text-align:center;font-size:17px;padding:8px;background:#e6f1ea;color:#10261b;border-radius:12px}" +
    ".lsw{display:flex;justify-content:space-between;align-items:center;gap:8px}.lgo{background:var(--o);color:#fff;border:0;border-radius:999px;padding:15px;font:800 17px inherit;cursor:pointer}.lok{background:#e6f1ea;color:#10261b;border-radius:10px;padding:8px 10px;font-size:14px}.lbad{background:#fdecef;color:#b3261e;border-radius:10px;padding:8px 10px;font-size:14px}";
  document.head.appendChild(css);
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return P.E(t); };
  var lc = function (x) { return String(x == null ? "" : x).trim().toLowerCase(); };
  function rpc(n, a) { return M.rpc(n, a || {}); }

  function wonSets(fid) { // own = এই ফোল্ডারের বিজয়ী (সবসময় বাদ); oth = অন্য ফোল্ডার ও পুরোনো তালিকার বিজয়ী
    var own = {}, oth = {};
    (P.old() || []).forEach(function (w) { if (w.key) oth[w.key] = 1; if (w.name) oth["n:" + lc(w.name)] = 1; });
    FO.forEach(function (x) { var t = fid != null && fid !== "" && String(x.id) === String(fid) ? own : oth; (x.wkeys || []).forEach(function (k) { t[k] = 1; }); (x.winners || []).forEach(function (w) { if (w.name) t["n:" + lc(w.name)] = 1; }); });
    return { own: own, oth: oth };
  }
  function nameP(n) { n = String(n).trim(); return { key: "n:" + lc(n), name: n, dept: "", batch: "", score: null, rank: null, device: "" }; }

  function filterPool(list, fid, ex, box) {
    var FL = P.flags(), W = wonSets(fid), seen = {}, out = [];
    list.forEach(function (p) {
      var nk = "n:" + lc(p.name);
      if (W.own[p.key] || W.own[nk] || (!box && ex && !p.again && (W.oth[p.key] || W.oth[nk])) || (!box && (FL[p.key] === "ex" || FL[p.key] === "nr")) || seen[p.key] || seen[nk]) return;
      seen[p.key] = 1; seen[nk] = 1; out.push(p);
    });
    return out;
  }

  // 🏅 বিজয়ী ঘোষণা ও 🎁 পুরস্কার ও নোট ট্যাব mc2_draws থেকে পড়ে। তাই প্রতিটি রিয়েল লটারির ফোল্ডারের জন্য একটা রেকর্ড (source = "lottery#<ফোল্ডার আইডি>") বানাই/হালনাগাদ করি।
  // রেকর্ড ডিফল্টে হোমে ও বিজয়ী পেজে লুকানো; 🏅 ট্যাব থেকে দেখান/লুকান করা যায়।
  function todayS() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function syncDraw(f, add, drop, title) {
    return rpc("mc2_draw_admin_list").then(function (r) {
      var rows = (r && r.rows) || [], src = "lottery#" + f.id, row = rows.filter(function (x) { return x.source === src; })[0];
      var ws = row ? (row.winners || []).slice() : [], wk = row ? (row.wkeys || []).slice() : [], dn = {}, seen = {};
      (drop || []).forEach(function (n) { dn[lc(n)] = 1; });
      ws = ws.filter(function (w) { return !dn[lc(w.name)]; });
      ws.forEach(function (w) { seen[lc(w.name)] = 1; });
      (add || []).forEach(function (g) {
        var n = lc(g.name);
        if (!seen[n]) { seen[n] = 1; ws.push({ name: g.name, dept: g.dept || "", batch: g.batch || "", rank: g.rank || null, score: g.score == null ? null : g.score, note: "" }); }
        ["n:" + n, g.key].forEach(function (k) { if (k && wk.indexOf(k) < 0) wk.push(k); });
      });
      return rpc("mc2_draw_save", { p: { id: row ? row.id : null, kind: row ? row.kind : "custom", date: row ? row.draw_date : todayS(), title: title || (row && row.title) || f.name, descr: row ? row.descr || "" : "", show: row ? !!row.show : false, home: row ? !!row.home : false, fb: row ? !!row.fb : false, fbnames: row ? row.fbnames || [] : [], winners: ws, source: src, wkeys: wk, srcs: row ? row.srcs || [] : [] } });
    });
  }

  function reload() { return Promise.all([rpc("mc2_draw_admin_list"), rpc("mc2_dlist_all")]).then(function (r) { FO = ((r[0] && r[0].rows) || []).filter(function (q) { return q.source !== "wcard-manual"; }); LISTS = r[1] || []; }); }
  function head(t) { return '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">' + t + '</b><button class="l s" type="button" id="zx">✕ বন্ধ</button></div>'; }
  function close() { stop = true; if (el) el.remove(); el = null; if (RESTORE) { RESTORE(); RESTORE = null; } if (REF && P && P.refresh) P.refresh(); }
  function openEl() { if (el) el.remove(); el = document.createElement("div"); el.className = "pzm"; document.body.appendChild(el); el.onclick = function (e) { if (e.target === el && !run) close(); }; }

  // ---------- ৩) চাকা (দুই ট্যাবের জন্য একই) ----------
  function go(f, W, real, fbNames, allPool, prev, fin) {
    run = true; stop = false; var got = (prev || []).slice(), base0 = got.length, TOT = base0 + W.length, i = 0;
    el.innerHTML = '<div class="pzb">' + head(real ? "🎰 ঘুরছে…" : '🧪 ঘুরছে… <span class="lbadge">ডেমো — সেভ হবে না</span>') + '<div style="display:flex;justify-content:flex-end"><button type="button" class="l s" id="lsb"></button></div><div class="lwr"><canvas id="lw" width="640" height="640"></canvas><div class="lpop" id="lp"></div></div><div id="lr" class="pzw"></div></div>';
    el.querySelector("#zx").onclick = close;
    var sb = el.querySelector("#lsb"), sbp = function () { sb.textContent = P.mute() ? "🔊 সাউন্ড অন" : "🔇 সাউন্ড অফ"; }; sb.onclick = function () { P.mute(!P.mute()); sbp(); }; sbp();
    var cv = el.querySelector("#lw"), pop = el.querySelector("#lp"), lr = el.querySelector("#lr");
    (function next() {
      if (stop) return; if (i >= W.length) { run = false; return fin ? fin(got) : close(); }
      var Wn = W[i], nm, others;
      if (fbNames) { var ps = Math.max(0, fbNames.indexOf(Wn.name)); nm = [Wn.name]; for (var q = 1; q < fbNames.length && nm.length < 16; q++) { var cd = fbNames[(ps + q) % fbNames.length]; if (nm.indexOf(cd) < 0) nm.push(cd); } if (nm.length < 2) nm.push("—"); }
      else { others = allPool.filter(function (p) { return p !== Wn && got.indexOf(p) < 0 && W.indexOf(p) < 0; }); nm = [Wn.name]; while (nm.length < 16 && others.length) nm.push(others.splice(P.rnd(others.length), 1)[0].name); if (nm.length < 2) nm.push("—"); }
      if (!fbNames) for (var k = nm.length - 1; k > 0; k--) { var j = P.rnd(k + 1), t = nm[k]; nm[k] = nm[j]; nm[j] = t; }
      pop.classList.remove("on"); el.querySelector("b").innerHTML = (real ? "🎰 " : "🧪 ") + "বিজয়ী " + bd(base0 + i + 1) + "/" + bd(TOT) + "…";
      var wIdx = nm.indexOf(Wn.name), sg = Math.PI * 2 / nm.length, rot0 = Math.random() * 6.28, base = -Math.PI / 2 - (wIdx + .5 + (Math.random() - .5) * .6) * sg;
      var target = base + Math.PI * 2 * Math.ceil((rot0 + 7 * Math.PI * 2 - base) / (Math.PI * 2)), dur = 5200, t0 = 0, last = -1;
      function fr(ts) {
        if (stop) return; if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - p, 3.4), rot = rot0 + (target - rot0) * ease;
        P.drawWheel(cv, nm, rot);
        var idx = Math.floor((((-Math.PI / 2 - rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / sg); if (idx !== last) { last = idx; P.beep(950 - p * 380, .05, "square", .05); }
        if (p < 1) return requestAnimationFrame(fr);
        P.fanfare(); pop.textContent = "🏆 " + Wn.name; pop.classList.add("on"); got.push(Wn); i++;
        lr.innerHTML = got.map(function (g, x) { return line(g, x, false); }).join("");
        setTimeout(next, 2200);
      }
      requestAnimationFrame(fr);
    })();
  }
  // বিজয়ীর ছোট এক লাইন: ১. নাম · #র‍্যাংক · বিভাগ · মার্ক
  function line(g, x, btn) {
    var s = [g.rank ? "#" + bd(g.rank) : "", g.dept ? P.deptL(g.dept) : "", g.batch || "", g.score != null ? bd(g.score) : ""].filter(Boolean).join(" · ");
    return '<div class="lw"><b>' + bd(x + 1) + ". " + E(g.name) + (window.MCG ? window.MCG.tag(g.device || null, g.name) : "") + "</b>" + (s ? '<span class="sm" style="flex:1">' + E(s) + "</span>" : "") + (btn ? '<button type="button" class="s l" data-card="' + x + '">🪪 কার্ড</button>' : "") + (btn && window.MCFL && g.key ? '<span style="flex:1 1 100%">' + window.MCFL.ctl(g.key, window.MCFL.get(g.key)) + "</span>" : "") + "</div>";
  }

  // ================= নতুন লটারি স্ক্রিন (একটাই পাতা) =================
  // পুল = বাছা ফোল্ডার (অটো/কাস্টম/বিজয়ী) + কাস্টম নাম বক্স। ফোল্ডার বাছলেই সিলেক্ট, আলাদা টিক লাগে না।
  // "this" নিয়ম (ফোল্ডার চিপ ও নামের তালিকা, সব জায়গায় একই): যেগুলোয় টিক আছে শুধু সেগুলোই ঘুরবে (মিলন); কোনোটায় টিক না থাকলে সব সিলেক্ট করা ফোল্ডার ও নাম মিলিয়ে।
  // বিজয়ী ফোল্ডার বাছলে তার নাম আবার পুলে আসে; না বাছলে (পুরোনো লটারির বিজয়ীসহ) আসে না। 🚫 বাদ ফ্ল্যাগের ইউজার কখনো আসে না।
  var MF = null, S = { sel: [], tf: {}, tn: {}, names: "", cnt: 3, custom: false, wname: "", q: "", shown: 40, mode: "", cv: false, cmin: "", cb: false, oo: false }, CB = null, RK = {}, RESTORE = null;
  var MON = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  var css2 = document.createElement("style");
  css2.textContent = ".lcp{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--bd);border-radius:12px;padding:5px 8px;margin:0 6px 6px 0;background:var(--bg)}.lcp b{font-size:14px}" +
    ".lx{border:0;background:none;padding:0 2px;font-size:14px;cursor:pointer;color:inherit}.lth{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:var(--g);cursor:pointer;white-space:nowrap}.lth input{width:auto;margin:0}" +
    ".lplb{max-height:300px;overflow:auto;border:1px solid var(--bd);border-radius:12px;padding:0 10px}.lpr{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:7px 0;border-top:1px solid var(--bd)}.lpr:first-child{border-top:0}.lpr>div{min-width:0;overflow-wrap:anywhere}";
  document.head.appendChild(css2);
  var norm = function (n) { return String(n == null ? "" : n).trim().replace(/\s+/g, " ").toLowerCase(); };
  var isN = function (k) { return String(k).indexOf("n:") === 0; };
  var gi = function (id) { return el && el.querySelector("#" + id); };
  function step(n, t, body) { return '<div class="lst"><div class="lsh"><i>' + n + "</i><b>" + t + "</b></div>" + body + "</div>"; }
  function err(t) { var e = gi("lerr"); if (e) e.textContent = t || ""; }

  function srcInfo(id) { // { name, count, win } বা null (ফোল্ডার মুছে গেলে)
    var a = MF.auto().filter(function (x) { return x.id === id; })[0]; if (a) return { name: a.name, count: a.count, win: false };
    var f = MF.folders().filter(function (x) { return String(x.id) === String(id); })[0]; if (!f) return null;
    return { name: (f.kind === "winners" ? "🏆 " : f.kind === "smart" ? "✨ " : "📁 ") + f.name, count: MF.count(id), win: f.kind === "winners" };
  }
  function typedList() {
    var seen = {}, out = [];
    String(S.names || "").split(/[,،\n]/).forEach(function (x) { var n = x.trim().replace(/\s+/g, " ").slice(0, 80); if (n && !seen[norm(n)]) { seen[norm(n)] = 1; out.push(n); } });
    return out;
  }
  // সব বাছা ফোল্ডার + লেখা নাম থেকে একজন = একবার; বাদ ফ্ল্যাগ ও বিজয়ী-ফোল্ডার (না বাছা) ও পুরোনো লটারির বিজয়ী বাদ
  function build() {
    if (CB) return CB;
    var items = [], by = {}, order = [], uName = {}, uCnt = {};
    S.sel = S.sel.filter(function (id) { return srcInfo(id); });
    S.sel.forEach(function (id) { MF.users(id).forEach(function (u) { items.push([u, id]); }); });
    typedList().forEach(function (n) { var m = MF.byName(n); items.push([m || { key: "n:" + norm(n), name: n, device: "", dept: "", batch: "", score: null, manual: true, src: "manual", at: null }, "__t"]); });
    var put = function (u, fid) {
      var t = by[u.key];
      if (!t && isN(u.key) && uCnt[norm(u.name)] === 1) t = uName[norm(u.name)]; // হাতে-লেখা নাম সাইটের ঠিক-একজন ইউজারের নামের সাথে মিললে একজনই
      if (!t) { t = by[u.key] = { key: u.key, u: u, fs: [] }; order.push(t); }
      if (t.fs.indexOf(fid) < 0) t.fs.push(fid);
    };
    var seenK = {};
    items.forEach(function (x) { var u = x[0]; if (isN(u.key) || seenK[u.key]) return; seenK[u.key] = 1; var nn = norm(u.name); uCnt[nn] = (uCnt[nn] || 0) + 1; });
    items.forEach(function (x) { if (!isN(x[0].key)) put(x[0], x[1]); });
    order.forEach(function (t) { if (!isN(t.key)) uName[norm(t.u.name)] = t; });
    items.forEach(function (x) { if (isN(x[0].key)) put(x[0], x[1]); });
    // বিজয়ী ফোল্ডারের হিসাব
    var selSet = {}, un = { k: {}, n: {} }, sl = { k: {}, n: {} };
    S.sel.forEach(function (id) { selSet[id] = 1; });
    MF.folders().forEach(function (f) { if (f.kind !== "winners") return; var t = selSet[String(f.id)] ? sl : un; MF.members(f.id).forEach(function (m) { t.k[m.ukey] = 1; t.n[norm(m.name)] = 1; }); });
    var old = wonSets("").oth, nFl = 0, nWin = 0, nOld = 0, people = [], outs = [];
    order.forEach(function (t) {
      var u = t.u, nk = norm(u.name), fk = MF.fkey(u.device, u.name);
      if (window.MCFL ? window.MCFL.out(MF.flag(u)) : MF.flag(u) === "ex") { nFl++; outs.push(t); return; }   // 🚫 বাদ বা 📵 সাড়া পাওয়া যায়নি
      if ((un.k[t.key] && !sl.k[t.key]) || (isN(t.key) && un.n[nk] && !sl.n[nk])) { nWin++; return; }
      if (!sl.k[t.key] && (old[fk] || old["n:" + nk])) { nOld++; return; }
      people.push(t);
    });
    CB = { people: people, nFl: nFl, nWin: nWin, nOld: nOld, outs: outs };
    return CB;
  }
  function anyThis(all) { return S.sel.some(function (id) { return S.tf[id]; }) || all.some(function (p) { return S.tn[p.key]; }); }
  function eligible(all) { // "this" নিয়ম, তারপর শর্ত-টিক (শুধু ভেরিফাইড / ন্যূনতম স্কোর / খেলেছে ও ফর্মও দিয়েছে)
    var th = anyThis(all) ? all.filter(function (p) { return S.tn[p.key] || p.fs.some(function (f) { return S.tf[f]; }); }) : all, mn = S.cmin === "" || S.cmin == null ? null : +S.cmin;
    return th.filter(function (p) {
      var u = p.u; if (S.cv && MF.flag(u) !== "ok") return false;
      if (mn != null && (u.score == null || u.score < mn)) return false;
      if (S.cb) { var i = MF.info(p.key); if (!(i.played && i.form)) return false; }
      return true;
    });
  }
  function pickGroups(pw, by) { // প্রতি ফোল্ডার / বিভাগ থেকে ১ জন; একজন একবারই; ছোট গ্রুপ আগে
    var groups = [], m = {};
    if (by === "folder") S.sel.forEach(function (id) { var g = pw.filter(function (w) { return w.ref.fs.indexOf(id) >= 0; }); if (g.length) groups.push(g); });
    else { pw.forEach(function (w) { var d = w.dept || "~"; (m[d] = m[d] || []).push(w); }); Object.keys(m).forEach(function (k) { groups.push(m[k]); }); }
    groups.sort(function (a, b) { return a.length - b.length; });
    var taken = {}, out = [];
    groups.forEach(function (g) { var c = g.filter(function (w) { return !taken[w.key]; }); if (!c.length) return; var w = c[P.rnd(c.length)]; taken[w.key] = 1; out.push(w); });
    return out;
  }
  function makeMeta(all, pl) { // 📋 লটারির রেকর্ড — বিজয়ী ফোল্ডারে সেভ হয়
    var tk = all.filter(function (p) { return S.tn[p.key]; }).map(function (p) { return p.key; }).slice(0, 300);
    return { at: new Date().toISOString(), pool: pl.length, total: all.length, sources: S.sel.map(function (id) { return { id: id, name: srcInfo(id).name, this: !!S.tf[id] }; }),
      thisF: S.sel.filter(function (id) { return S.tf[id]; }).map(function (id) { return srcInfo(id).name; }), thisNames: tk.length, thisKeys: tk, typed: String(S.names || "").slice(0, 2000),
      mode: S.mode || "", cv: !!S.cv, cmin: S.cmin === "" || S.cmin == null ? null : +S.cmin, cb: !!S.cb, cancelled: [] };
  }

  function autoName() {
    var all = build().people, ids = S.sel.filter(function (id) { return S.tf[id]; }), names;
    if (!ids.length && anyThis(all) ) names = ["নির্বাচিত নাম"];
    else { if (!ids.length) ids = S.sel.slice(); names = ids.map(function (id) { return (srcInfo(id) || { name: "" }).name.replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s*—\s*বিজয়ী\s*$/, ""); }).filter(Boolean); if (!names.length) names = ["হাতে লেখা নাম"]; }
    var base = names.length > 2 ? names[0] + " ও আরও " + bd(names.length - 1) + "টি" : names.join(" + "), d = new Date();
    return (base.slice(0, 44) + " · " + bd(d.getDate()) + " " + MON[d.getMonth()] + " " + bd(d.getFullYear()) + " — বিজয়ী").slice(0, 80);
  }

  // ---------- আঁকা ----------
  function cfg() {
    var h = '<div class="pzb lot">' + head("🎰 লটারি") +
      (MF.noSql() ? '<div class="lbad">⚠️ ফোল্ডারের টেবিল পাওয়া যায়নি — Supabase-এ supabase-new-20261018g.sql একবার চালান। এখন শুধু অটো ফোল্ডার আছে।</div>' : "") +
      step("১", "ফোল্ডার বেছে নিন", '<div id="lsel"></div><div id="lchips"></div>') +
      step("২", "নাম", '<label>কাস্টম নাম (কমা দিয়ে একসাথে অনেক)<textarea id="lnm" rows="2" placeholder="রাহুল আহমেদ, করিম, সুমি">' + E(S.names) + '</textarea></label>' +
        '<div id="lplw" hidden><input id="lsq" type="search" maxlength="60" placeholder="🔎 নাম খুঁজুন" value="' + E(S.q) + '"><p class="sm" id="lpi"></p><div id="lpl" class="lplb"></div><p id="lmo" style="text-align:center;margin:6px 0 0"></p><div id="lout"></div></div>') +
      step("৩", "শর্ত ও মোড (ঐচ্ছিক)", '<label class="lsw"><span>✅ শুধু ভেরিফাইড</span><input type="checkbox" id="lcv"' + (S.cv ? " checked" : "") + ' style="width:auto"></label>' +
        '<label class="lsw"><span>🎮 খেলেছে এবং ফর্মও দিয়েছে</span><input type="checkbox" id="lcb"' + (S.cb ? " checked" : "") + ' style="width:auto"></label>' +
        '<label>ন্যূনতম স্কোর<input id="lmn" type="number" min="0" max="1000" placeholder="০" value="' + E(S.cmin) + '"></label>' +
        "<div>" + P.dd("lmd", [["", "সাধারণ — এলোমেলো"], ["folder", "প্রতি ফোল্ডার থেকে ১ জন"], ["dept", "প্রতি বিভাগ থেকে ১ জন"]], S.mode, function (v) { readCfg(); S.mode = v; cfg(); }) + "</div>") +
      step("৪", "কতজন বিজয়ী", S.mode ? '<p class="sm">গ্রুপ অনুযায়ী ১ জন করে উঠবে — সংখ্যা নিজে ঠিক হবে (নিচে দেখুন)।</p>' : "<div>" + P.dd("lc", [[1, "১ জন"], [2, "২ জন"], [3, "৩ জন"], [4, "৪ জন"], [5, "৫ জন"], ["c", "কাস্টম…"]], S.custom ? "c" : S.cnt, function (v) { readCfg(); if (v === "c") { S.custom = true; if (!S.cnt) S.cnt = 1; } else { S.custom = false; S.cnt = +v; } cfg(); }) + "</div>" +
        (S.custom ? '<label>সংখ্যা (১–৫০০০)<input id="lcn" type="number" min="1" max="5000" value="' + S.cnt + '"></label>' : "")) +
      step("৫", "বিজয়ী ফোল্ডারের নাম", '<input id="lwn" maxlength="80" value="' + E(S.wname) + '"><p class="sm">ফাঁকা রাখলে ওপরের নামটাই বসবে। বিজয়ীরা লটারির পর নিজে এই ফোল্ডারে চলে যাবে; পরে নাম বদলানো যাবে।</p>') +
      '<div class="lel" id="lcnt"></div><button type="button" class="l lgo" id="lt" style="background:none;color:var(--fg);border:1px solid var(--bd)">🧪 টেস্ট (সেভ হবে না)</button><button type="button" class="lgo" id="lr">🎰 ঘোরান</button><div id="lerr" class="sm" style="color:#b3261e;text-align:center"></div></div>';
    el.innerHTML = h; bindCfg(); refreshAll();
  }
  function readCfg() {
    if (gi("lnm")) S.names = gi("lnm").value; if (gi("lwn")) S.wname = gi("lwn").value; if (gi("lsq")) S.q = gi("lsq").value;
    if (gi("lmn")) S.cmin = gi("lmn").value;
    if (gi("lcn")) S.cnt = Math.max(1, Math.min(5000, +gi("lcn").value || 1));
  }
  function refreshAll() { refreshSel(); refreshChips(); refreshList(); refreshCount(); }
  function refreshSel() { // সব অটো/কাস্টম/স্মার্ট/বিজয়ী ফোল্ডার সবসময় থাকে; বাছাগুলো ✔, আবার চাপলে বাদ
    var on = {}, o = function (id, t) { return '<option value="' + E(id) + '">' + (on[String(id)] ? "✔ " : "") + E(t) + "</option>"; }; S.sel.forEach(function (id) { on[String(id)] = 1; });
    var A = MF.auto(), FF = MF.folders(), C = FF.filter(function (f) { return f.kind !== "winners" && f.kind !== "smart"; }), SM = FF.filter(function (f) { return f.kind === "smart"; }), Wn = FF.filter(function (f) { return f.kind === "winners"; });
    gi("lsel").innerHTML = '<select id="lfs"><option value="">➕ ফোল্ডার বেছে নিন (✔ = বাছা, আবার চাপলে বাদ)…</option>' +
      '<optgroup label="অটো ফোল্ডার">' + A.map(function (a) { return o(a.id, a.name + " (" + bd(a.count) + ")"); }).join("") + "</optgroup>" +
      (C.length ? '<optgroup label="📁 কাস্টম ফোল্ডার">' + C.map(function (f) { return o(f.id, f.name + " (" + bd(MF.count(f.id)) + ")"); }).join("") + "</optgroup>" : "") +
      (SM.length ? '<optgroup label="✨ স্মার্ট ফোল্ডার (সেভ করা ফিল্টার)">' + SM.map(function (f) { return o(f.id, f.name + " (" + bd(MF.count(f.id)) + ")"); }).join("") + "</optgroup>" : "") +
      (Wn.length ? '<optgroup label="🏆 আগের বিজয়ী ফোল্ডার (বাছলে এদের নাম আবার ঘুরবে)">' + Wn.map(function (f) { return o(f.id, f.name + " (" + bd(MF.count(f.id)) + ")"); }).join("") + "</optgroup>" : "") + "</select>";
    var s = gi("lfs"); if (s) s.onchange = function () {
      if (!s.value) return; var id = String(s.value);
      if (S.sel.indexOf(id) >= 0) { S.sel = S.sel.filter(function (x) { return x !== id; }); delete S.tf[id]; } else S.sel.push(id);   // "this" টিক শুধু বাদ দেওয়ার সময় মোছে — আগের নিয়মই
      S.shown = 40; CB = null; refreshAll();
    };
  }
  function refreshChips() {
    S.sel = S.sel.filter(function (id) { return srcInfo(id); });
    gi("lchips").innerHTML = S.sel.length ? S.sel.map(function (id) {
      var i = srcInfo(id);
      return '<span class="lcp"><b>' + E(i.name) + '</b><span class="sm">(' + bd(i.count) + ')</span><button type="button" class="lx" data-rm="' + E(id) + '" aria-label="বাদ দিন">❌</button><label class="lth"><input type="checkbox" data-tf="' + E(id) + '"' + (S.tf[id] ? " checked" : "") + "> this</label></span>";
    }).join("") : '<p class="sm">ওপর থেকে এক বা একাধিক ফোল্ডার বাছুন (বা শুধু নিচে নাম লিখুন)।</p>';
  }
  function refreshList() {
    var w = gi("lplw"), b = build(), L = b.people, q = norm(S.q);
    if (!S.sel.length && !typedList().length) { w.hidden = true; return; } w.hidden = false;
    var R = q ? L.filter(function (p) { return norm(p.u.name).indexOf(q) >= 0; }) : L, miss = [];
    if (b.nFl) miss.push(bd(b.nFl) + " জন 🚫 বাদ / 📵 সাড়া পাওয়া যায়নি"); if (b.nWin) miss.push(bd(b.nWin) + " জন আগের বিজয়ী (বিজয়ী ফোল্ডার না বাছায়)"); if (b.nOld) miss.push(bd(b.nOld) + " জন পুরোনো লটারির বিজয়ী");
    gi("lpi").textContent = "সবার তালিকা: " + bd(L.length) + " জন (একজন একবারই)" + (miss.length ? " · বাদ: " + miss.join(", ") : "");
    gi("lpl").innerHTML = R.slice((S.shown = Math.min(S.shown, Math.max(1, Math.ceil(R.length / 40)) * 40)) - 40, S.shown).map(function (p) {
      var u = p.u, nf = p.fs.filter(function (f) { return f !== "__t"; }).length;
      return '<div class="lpr"><div><b>' + E(u.name) + '</b> <span class="tag">' + E((u.dept && P.deptL(u.dept)) || "—") + '</span><span class="tag">স্কোর ' + bd(u.score == null ? "—" : u.score) + "</span>" +
        (nf > 1 ? '<span class="tag">' + bd(nf) + " ফোল্ডারে</span>" : "") + (p.fs.indexOf("__t") >= 0 ? '<span class="tag">✍️ হাতে লেখা</span>' : "") + (window.MCFL ? '<div style="margin-top:4px">' + window.MCFL.ctl(MF.fkey(u.device, u.name), MF.flag(u)) + "</div>" : "") + '</div><label class="lth"><input type="checkbox" data-tn="' + E(p.key) + '"' + (S.tn[p.key] ? " checked" : "") + "> this</label></div>";
    }).join("") || '<p class="sm" style="margin:8px 0">কেউ নেই।</p>';
    gi("lmo").innerHTML = window.MCPG ? window.MCPG.html(S.shown / 40 - 1, R.length, 40, "data-lp") : "";
    gi("lmo").onclick = function (e) { var b = e.target.closest("[data-lp]"); if (b && !b.disabled) { S.shown = (+b.dataset.lp + 1) * 40; refreshList(); } };
    if (window.MCFL && gi("lout")) gi("lout").innerHTML = b.outs.length ? '<details' + (S.oo ? " open" : "") + ' style="margin-top:8px"><summary class="sm">🚫 বাদ ও 📵 সাড়া পাওয়া যায়নি — ' + bd(b.outs.length) + " জন (লটারিতে আসবে না; অবস্থা বদলালে আবার আসবে)</summary>" + b.outs.map(function (t) { var u = t.u; return '<div class="lpr"><div><b>' + E(u.name) + '</b> <span class="tag">' + E((u.dept && P.deptL(u.dept)) || "—") + '</span><div style="margin-top:4px">' + window.MCFL.ctl(MF.fkey(u.device, u.name), MF.flag(u)) + "</div></div></div>"; }).join("") + "</details>" : "";
  }
  function refreshCount() {
    var all = build().people, pl = eligible(all), th = anyThis(all), cn = [];
    if (S.cv) cn.push("শুধু ভেরিফাইড"); if (S.cb) cn.push("খেলেছে ও ফর্মও দিয়েছে"); if (S.cmin !== "" && S.cmin != null) cn.push("স্কোর ≥ " + bd(S.cmin));
    var gc = S.mode ? pickGroups(pl.map(function (p) { return { key: p.key, dept: p.u.dept, ref: p }; }), S.mode).length : 0;
    gi("lcnt").innerHTML = 'যোগ্য নাম: <b>' + bd(pl.length) + "</b> জন" + '<div class="sm">' + (th ? "শুধু \"this\" টিক দেওয়া অংশ থেকে ঘুরবে (সবমিলিয়ে " + bd(all.length) + " জন আছে)।" : "সব বাছা ফোল্ডার ও নাম মিলিয়ে ঘুরবে।") + (cn.length ? " শর্ত: " + cn.join(", ") + "।" : "") + (S.mode ? " " + (S.mode === "folder" ? "প্রতি ফোল্ডার" : "প্রতি বিভাগ") + " থেকে ১ জন করে → <b>" + bd(gc) + "</b> জন উঠবে।" : "") + "</div>";
    var wn = gi("lwn"); if (wn) wn.placeholder = autoName();
  }
  function bindCfg() {
    gi("zx").onclick = close;
    gi("lchips").onclick = function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; var id = b.dataset.rm; S.sel = S.sel.filter(function (x) { return x !== id; }); delete S.tf[id]; CB = null; refreshAll(); };
    gi("lchips").onchange = function (e) { var t = e.target; if (!t.dataset || t.dataset.tf == null) return; if (t.checked) S.tf[t.dataset.tf] = 1; else delete S.tf[t.dataset.tf]; refreshCount(); };
    gi("lpl").onchange = function (e) { var t = e.target; if (!t.dataset || t.dataset.tn == null) return; if (t.checked) S.tn[t.dataset.tn] = 1; else delete S.tn[t.dataset.tn]; refreshCount(); };
    gi("lout").addEventListener("toggle", function (e) { if (e.target && e.target.tagName === "DETAILS") S.oo = e.target.open; }, true);
    gi("lnm").oninput = function () { S.names = this.value; CB = null; S.shown = 40; refreshList(); refreshCount(); };
    gi("lsq").oninput = function () { S.q = this.value; S.shown = 40; refreshList(); };
    gi("lwn").oninput = function () { S.wname = this.value; };
    var cn = gi("lcn"); if (cn) cn.oninput = function () { readCfg(); };
    gi("lcv").onchange = function () { S.cv = this.checked; refreshCount(); };
    gi("lcb").onchange = function () { S.cb = this.checked; refreshCount(); };
    gi("lmn").oninput = function () { S.cmin = this.value; refreshCount(); };
    gi("lt").onclick = function () { readCfg(); start(false); };
    gi("lr").onclick = function () { readCfg(); start(true); };
  }

  // ---------- শুরু ----------
  function wobj(p) { var u = p.u, k = MF.fkey(u.device, u.name); return { key: k, name: u.name, device: u.device || "", dept: u.dept || "", batch: u.batch || "", score: u.score == null ? null : u.score, rank: RK[k] || null, ref: p }; }
  function start(real) {
    var all = build().people, pl = eligible(all);
    if (!pl.length) { err(S.sel.length || typedList().length ? "যোগ্য কেউ নেই — অন্য ফোল্ডার বাছুন বা \"this\" টিক বদলান।" : "আগে ফোল্ডার বাছুন বা নাম লিখুন।"); return; }
    var pw = pl.map(wobj), n = Math.min(S.cnt || 1, pw.length), left = pw.slice(), W = [], i;
    if (S.mode) { W = pickGroups(pw, S.mode); if (!W.length) { err("কোনো গ্রুপে যোগ্য কেউ নেই।"); return; } }
    else for (i = 0; i < n; i++) W.push(left.splice(P.rnd(left.length), 1)[0]);
    var ctx = { name: (String(S.wname).trim() || autoName()).slice(0, 80), f: null, meta: makeMeta(all, pl) };
    P.audio(); go(null, W, real, null, pw, null, function (got) { finish(got, real, ctx); });
  }

  // ---------- শেষ: রিয়েলে বিজয়ী নিজে নতুন বিজয়ী ফোল্ডারে চলে যায় ----------
  function finish(got, real, ctx) {
    run = false; var host = el, state = real ? "saving" : "test", msg = "", rn = "", dstate = "", dmsg = ""; var ALL = (ctx.prev || []).concat(got), addMsg = "", addN = ctx.addN || 3;
    function save() {
      var mk = ctx.f ? Promise.resolve(ctx.f) : MF.create(MF.uniqueName(ctx.name), "winners", { meta: ctx.meta });
      return mk.then(function (f) { ctx.f = f; return MF.add(f.id, got.map(function (g) { return g.ref.u; })); }).then(function () { if (P.addWon) P.addWon(got); return syncDraw(ctx.f, got).then(function () { dstate = "ok"; }, function (e) { dstate = "fail"; dmsg = String(e && e.message || e); }); });
    }
    function trySave() { state = "saving"; paint(); return save().then(function () { state = "ok"; paint(); }).catch(function (e) { state = "fail"; msg = String(e && e.message || e); paint(); }); }
    function paint() {
      if (!host || el !== host) return;
      var fname = ctx.f ? ctx.f.name : ctx.name;
      var st = state === "saving" ? '<p class="lok">⏳ বিজয়ী ফোল্ডারে সেভ হচ্ছে…</p>' : state === "ok" ? '<p class="lok">✅ বিজয়ী ফোল্ডার বানানো হয়েছে: <b>' + E(fname) + "</b></p><p class=\"sm\">📋 পুলে যোগ্য " + bd(ctx.meta.pool) + " জন ছিল; লটারির রেকর্ড ফোল্ডারে সেভ আছে।</p>" : state === "fail" ? '<p class="lbad">⚠️ সেভ হয়নি: ' + E(msg) + "</p>" : '<p><span class="lbadge">ডেমো — কিছুই সেভ হয়নি, কেউ বাদ যায়নি</span></p>';
      host.innerHTML = '<div class="pzb">' + head((real ? "🏆 বিজয়ী (" : "🧪 ডেমো (") + bd(ALL.length) + " জন)") + st +
        (state === "ok" ? '<div style="display:flex;gap:6px"><input id="lrn" maxlength="80" value="' + E(rn || fname) + '"><button type="button" class="s" id="lrs">💾 নাম সেভ</button></div>' : "") +
        '<div class="pzw" id="lw2">' + ALL.map(function (g, x) { return line(g, x, true); }).join("") + "</div>" +
        (real && state === "ok" ? '<div class="lel" style="margin:8px 0;text-align:left"><b>➕ আরও বিজয়ী</b><p class="sm" style="margin:4px 0">এই একই ফোল্ডারে আরও বিজয়ী যোগ হবে। আগের বিজয়ীদের নাম আর উঠবে না।</p><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><input id="lan" type="number" min="1" max="5000" value="' + E(addN) + '" style="width:90px" aria-label="কতজন"><span class="sm">জন</span><button type="button" class="lgo" id="lad" style="padding:10px 16px;font-size:15px">➕ আরও বিজয়ী তুলুন</button></div>' + (addMsg ? '<p class="lbad" style="margin:6px 0 0">' + E(addMsg) + "</p>" : "") + "</div>" : "") + '<div class="pzx"><button type="button" id="lpo">🖼 সবার পোস্টার</button><button type="button" class="l" id="lps">📄 এক পেজে (শিট)</button>' + (state === "fail" ? '<button type="button" id="lsv">🔁 আবার সেভ করুন</button>' : "") + '<button type="button" class="l" id="lag"' + (state === "saving" ? " disabled" : "") + ">🎰 আবার</button></div></div>";
      host.querySelector("#zx").onclick = close;
      host.querySelector("#lag").onclick = function () { el.innerHTML = '<div class="pzb">⏳ লোড হচ্ছে…</div>'; MF.ready().then(function () { CB = null; if (el === host) cfg(); }).catch(function (e) { el.innerHTML = '<div class="pzb">' + head("🎰 লটারি") + "<p>লোড হয়নি: " + E(e && e.message || e) + "</p></div>"; gi("zx").onclick = close; }); };
      host.querySelector("#lpo").onclick = function () { P.poster(ALL.map(function (g) { return { key: g.key, name: g.name, device: g.device, dept: g.dept, batch: g.batch, score: g.score, rank: g.rank }; }), 0); };
      host.querySelector("#lps").onclick = function () { if (window.MCSheet) window.MCSheet.open(ALL.map(function (g) { return { key: g.key, name: g.name, device: g.device, dept: g.dept, batch: g.batch, score: g.score, rank: g.rank }; }), { title: "লটারি বিজয়ী" }); else alert("শিট সিস্টেম লোড হয়নি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন."); };
      var sv = host.querySelector("#lsv"); if (sv) sv.onclick = trySave;
      var ad = host.querySelector("#lad"); if (ad) ad.onclick = function () {
        var nn = Math.max(1, Math.min(5000, +host.querySelector("#lan").value || 1)); ctx.addN = nn; CB = null;
        var done = {}, doneN = {}; ALL.forEach(function (g) { done[g.key] = 1; doneN[lc(g.name)] = 1; });
        var pw = eligible(build().people).map(wobj).filter(function (w) { return !done[w.key] && !doneN[lc(w.name)]; });
        if (!pw.length) { addMsg = "আর কোনো যোগ্য নাম বাকি নেই — আগের সবাই আগেই বিজয়ী হয়েছে।"; paint(); return; }
        var left = pw.slice(), W = [], k, cnt = Math.min(nn, pw.length);
        for (k = 0; k < cnt; k++) W.push(left.splice(P.rnd(left.length), 1)[0]);
        ctx.prev = ALL.slice(); P.audio();
        go(null, W, true, null, pw, null, function (got2) { finish(got2, true, ctx); });
      };
      var rs = host.querySelector("#lrs"); if (rs) rs.onclick = function () {
        var v = host.querySelector("#lrn").value; rn = v; rs.disabled = true;
        MF.rename(ctx.f.id, v).then(function (nn) { return syncDraw(ctx.f, [], [], nn || v).catch(function () {}); }).then(function () { rn = ""; paint(); var m = host.querySelector(".lok"); if (m) m.insertAdjacentHTML("afterend", '<p class="lok">✅ নাম বদলানো হয়েছে।</p>'); }).catch(function (e) { rs.disabled = false; var m = host.querySelector(".lok"); if (m) m.insertAdjacentHTML("afterend", '<p class="lbad">' + E(e && e.message || e) + "</p>"); });
      };
      host.querySelector("#lw2").onclick = function (e) { var b = e.target.closest("[data-card]"); if (!b) return; var g = ALL[+b.dataset.card]; if (g.device && window.MCA_USER) window.MCA_USER(g.device); if (window.MCA_CARD) window.MCA_CARD(g.device || "", g.name); };
      if (state === "ok") {
        var mm = host.querySelector(".lok");
        if (mm) mm.insertAdjacentHTML("afterend", dstate === "ok" ? '<p class="lok">✅ 🏅 বিজয়ী ঘোষণা তালিকা ও 🎁 পুরস্কার ও নোটেও যোগ হয়েছে (হোমে দেখান/লুকান ওই ট্যাব থেকে)।</p>' : '<p class="lbad">⚠️ বিজয়ী ঘোষণা তালিকায় ওঠেনি: ' + E(dmsg) + ' <button type="button" class="s" id="ldr">🔁 তালিকায় তুলুন</button></p>');
        var rb = host.querySelector("#ldr"); if (rb) rb.onclick = function () { rb.disabled = true; syncDraw(ctx.f, got).then(function () { dstate = "ok"; paint(); }).catch(function (e) { dstate = "fail"; dmsg = String(e && e.message || e); paint(); }); };
      }
    }
    if (real) trySave(); else paint();
  }

  if (window.MCFL) window.MCFL.on(function () { if (el && gi("lpl")) { CB = null; refreshAll(); } });   // অবস্থা বদলালে নামের তালিকা ও যোগ্য-সংখ্যা নতুন করে
  window.MCLOT = function () { // পুরস্কার ট্যাবের 🎰 বোতাম / 🎰 লটারি বোতাম
    P = window.MCP; M = window.MCA; MF = window.MCF; if (!P || !M || !M.rpc) return; REF = true; stop = false; openEl();
    if (!MF) { el.innerHTML = '<div class="pzb">' + head("🎰 লটারি") + "<p>admin-folders.js পাওয়া যায়নি।</p></div>"; el.querySelector("#zx").onclick = close; return; }
    el.innerHTML = '<div class="pzb">⏳ ফোল্ডার ও ইউজার লোড হচ্ছে…</div>'; CB = null;
    RK = {}; (P.board() || []).forEach(function (b) { if (b.key && b.rank && !RK[b.key]) RK[b.key] = b.rank; });
    Promise.all([MF.ready(), reload().catch(function () { FO = []; })]).then(function () { if (el) cfg(); })
      .catch(function (e) { if (!el) return; el.innerHTML = '<div class="pzb">' + head("🎰 লটারি") + '<p>লোড হয়নি।<br><span class="sm">' + String(e && e.message || e).replace(/[<>&]/g, "") + "</span></p></div>"; el.querySelector("#zx").onclick = close; });
  };

  // বিজয়ী সাড়া না দিলে: তাকে বাতিল করে (বিজয়ী ফোল্ডার থেকে সরিয়ে) একই পুল থেকে আরেকজন তোলা। বাতিল হওয়া জন রেকর্ডে থাকে, আবার ওঠে না।
  window.MCLOT.redraw = function (fid, ukey, mid) {
    P = window.MCP; M = window.MCA; MF = window.MCF; if (!P || !M || !M.rpc || !MF) return; REF = true; stop = false; openEl();
    el.innerHTML = '<div class="pzb">⏳ লোড হচ্ছে…</div>'; var saved = S; RESTORE = function () { S = saved; CB = null; };
    RK = {}; (P.board() || []).forEach(function (b) { if (b.key && b.rank && !RK[b.key]) RK[b.key] = b.rank; });
    var msgEnd = function (t) { if (!el) return; el.innerHTML = '<div class="pzb">' + head("🎰 আরেকজন তুলুন") + "<p>" + E(t) + "</p></div>"; gi("zx").onclick = close; };
    Promise.all([MF.ready(), reload().catch(function () { FO = []; })]).then(function () {
      var f = MF.folders().filter(function (x) { return String(x.id) === String(fid); })[0]; if (!f) throw new Error("ফোল্ডারটা পাওয়া যায়নি।");
      var m = f.meta || {}, canc = (m.cancelled || []).concat([ukey]), dropN = ((MF.members(fid).filter(function (x) { return String(x.id) === String(mid); })[0]) || {}).name;
      S = { sel: (m.sources || []).map(function (x) { return String(x.id); }), tf: {}, tn: {}, names: m.typed || "", cnt: 1, custom: false, wname: "", q: "", shown: 40, mode: "", cv: !!m.cv, cmin: m.cmin == null ? "" : m.cmin, cb: !!m.cb };
      (m.sources || []).forEach(function (x) { if (x.this) S.tf[String(x.id)] = 1; }); (m.thisKeys || []).forEach(function (k) { S.tn[k] = 1; }); CB = null;
      if (!S.sel.length && !typedList().length) return msgEnd("এই ফোল্ডারের লটারি-রেকর্ড নেই, তাই আগের পুল পাওয়া যায়নি।");
      var pl = eligible(build().people).filter(function (p) { return canc.indexOf(p.key) < 0; });
      if (!pl.length) return msgEnd("আগের পুলে আর কেউ বাকি নেই।");
      var pw = pl.map(wobj), w0 = pw[P.rnd(pw.length)];
      function save(g) {
        return MF.add(fid, [g.ref.u]).then(function () { return MF.remove(fid, mid); }).then(function () { return MF.setMeta(fid, Object.assign({}, m, { cancelled: canc })); }).then(function () { if (P.addWon) P.addWon([g]); return syncDraw(f, [g], dropN ? [dropN] : []).catch(function () {}); });
      }
      P.audio();
      go(null, [w0], true, null, pw, null, function (got) {
        var g = got[0], host = el, st = "saving", er = "";
        var paint = function () {
          if (!host || el !== host) return;
          host.innerHTML = '<div class="pzb">' + head("🏆 নতুন বিজয়ী") + (st === "saving" ? '<p class="lok">⏳ সেভ হচ্ছে…</p>' : st === "ok" ? '<p class="lok">✅ বাতিল হওয়া জনের জায়গায় নতুন বিজয়ী ফোল্ডারে যোগ হয়েছে।</p>' : '<p class="lbad">⚠️ সেভ হয়নি: ' + E(er) + "</p>") +
            '<div class="pzw" id="lw2">' + line(g, 0, true) + '</div><div class="pzx">' + (st === "fail" ? '<button type="button" id="lsv">🔁 আবার সেভ করুন</button>' : "") + '<button type="button" class="l" id="lcl">বন্ধ করুন</button></div></div>';
          host.querySelector("#zx").onclick = close; host.querySelector("#lcl").onclick = close;
          var sv = host.querySelector("#lsv"); if (sv) sv.onclick = run2;
          host.querySelector("#lw2").onclick = function (e) { var b = e.target.closest("[data-card]"); if (!b) return; if (g.device && window.MCA_USER) window.MCA_USER(g.device); if (window.MCA_CARD) window.MCA_CARD(g.device || "", g.name); };
        };
        var run2 = function () { st = "saving"; paint(); save(g).then(function () { st = "ok"; paint(); }).catch(function (e) { st = "fail"; er = String(e && e.message || e); paint(); }); };
        run2();
      });
    }).catch(function (e) { msgEnd("লোড হয়নি: " + String(e && e.message || e)); });
  };

  // বিজয়ী ঘোষণা ট্যাব একই চাকা/বাছাই নিয়ম ব্যবহার করে: o = { people: [নাম বা {name,…}], count, fid (ফোল্ডার আইডি/খালি), onDone(got) }
  window.MCLOT.wheel = function (o) {
    P = window.MCP; M = window.MCA; if (!P || !M || !M.rpc) return false; REF = false; stop = false; P.audio(); openEl();
    el.innerHTML = '<div class="pzb">⏳ লোড হচ্ছে…</div>';
    reload().then(function () {
      var pl = filterPool((o.people || []).map(function (x) { return typeof x === "string" ? nameP(x) : x; }), o.fid, true, false);
      if (!pl.length) { el.innerHTML = '<div class="pzb">' + head("🎰 লটারি") + "<p>যোগ্য কেউ নেই — সবাই আগেই জিতেছেন বা তালিকা ফাঁকা।</p></div>"; el.querySelector("#zx").onclick = close; return; }
      var n = Math.min(o.count || 1, pl.length), left = pl.slice(), W = []; for (var i = 0; i < n; i++) W.push(left.splice(P.rnd(left.length), 1)[0]);
      go(null, W, true, null, pl, null, function (got) { close(); if (o.onDone) o.onDone(got); });
    }).catch(function (e) { if (!el) return; el.innerHTML = '<div class="pzb">' + head("🎰 লটারি") + "<p>লোড হয়নি।<br><span class=\"sm\">" + String(e && e.message || e).replace(/[<>&]/g, "") + "</span></p></div>"; el.querySelector("#zx").onclick = close; });
    return true;
  };
})();

// অ্যাডমিন: "🗑 বিন ও ডিলিট" — জায়গার মিটার, টিক দিয়ে ম্যানুয়াল ডিলিট, বিন (ফিরিয়ে আনো)
// SQL: supabase-new-20261019b.sql, ...19c.sql, ...19d.sql
(function () {
  var M = null, SP = null, MS = null, BN = null, MSG = "", BAD = false, DAYS = 0, TOP = false, BDAYS = null;
  var L = [["visits", "ভিজিট-লগ (বিনে যাবে)"], ["answers", "উত্তর (বিনে যাবে)"], ["presence", "অনলাইন/প্রেজেন্স (সরাসরি মুছবে)"], ["chat_msgs", "চ্যাট মেসেজ (সরাসরি মুছবে)"], ["chat_files", "চ্যাট ফাইল (সরাসরি মুছবে)"], ["shots", "স্ক্রিনশটের ছবি (সরাসরি মুছবে)"], ["shot_rows", "জমা ইউজারের তথ্য: নাম, লিংক (বিনে যাবে; ছবি সাথে সাথে মুছবে)"], ["cards", "কার্ড (বিনে যাবে, টপ ৩ বাদ)"], ["bin", "বিন (চিরতরে মুছবে)"]];
  var SEL = {}, BF0 = { src: "", q: "", dept: "", batch: "", sr: "", tm: "", tf: "", tt: "", pg: 0 }, BF = Object.assign({}, BF0), BD = Object.assign({}, BF0), BS = {}, TH = {}, BUSY = false, PMSG = "", PBAD = false;
  var SR = [["", "সব স্কোর"], ["0-200", "স্কোর ০–২০০"], ["201-400", "স্কোর ২০১–৪০০"], ["401-600", "স্কোর ৪০১–৬০০"], ["601-800", "স্কোর ৬০১–৮০০"], ["801-1000", "স্কোর ৮০১–১০০০"]];
  var TM = [["", "মোছার সময়: যেকোনো"], ["1", "শেষ ১ ঘণ্টা"], ["6", "শেষ ৬ ঘণ্টা"], ["24", "শেষ ২৪ ঘণ্টা"], ["168", "শেষ ৭ দিন"], ["c", "কাস্টম (তারিখ+সময়)"]];
  var JPGR = /^data:image\/jpe?g;base64,/;
  window.MCA_TABS = (window.MCA_TABS || []).concat([["bin", "🗑 বিন ও ডিলিট"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { bin: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  function bar(label, pct, used, lim, mark) {
    var p = Math.max(0, Math.min(100, +pct || 0)), col = p >= 90 ? "#d33" : p >= 80 ? "#e8a200" : "#1d6b43";
    return '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>' + label + '</span><span>' + bd(pct) + '% · ' + bd(used) + ' / ' + bd(lim) + ' MB</span></div>' +
      '<div style="position:relative;height:12px;border-radius:8px;background:var(--chip,#e6ece7);overflow:hidden;margin-top:4px"><div style="height:100%;width:' + p + '%;background:' + col + '"></div>' +
      '<div style="position:absolute;top:0;bottom:0;left:' + mark + '%;width:2px;background:#0006"></div></div></div>';
  }
  function load() {
    return Promise.all([M.rpc("mc2_space_stats", {}), M.rpc("mc2_manual_stats", { p_days: DAYS }), M.rpc("mc2_bin_list", { p_limit: 2000, p_src: null }), M.rpc("mc2_cleanup_admin_get").then(function (g) { var d = g && g.cfg && g.cfg.bin_days; return d == null ? 30 : +d; }).catch(function () { return null; })]).then(function (r) { SP = r[0]; MS = r[1]; BN = r[2]; BDAYS = r[3]; });
  }
  // ভাগ ২খ: বিনের মেয়াদ — সেটিংয়ের bin_days + মোছার তারিখ থেকে "কতদিন পরে খালি হবে" (শুধু দেখা, কিছু বদলায় না)
  function restMb() { var a = (BN && BN.items) || []; if (!BN || !BN.total || BN.mb == null) return null; return Math.round(BN.mb * (Math.min(a.length, BN.total) / BN.total) * 100) / 100; } // আনুমানিক: বিনের মোট MB × লোড-হওয়া অংশের অনুপাত
  function binLeft(x) {
    if (BDAYS == null || !x || !x.at) return "";
    if (!(BDAYS > 0)) return "নিজে মুছবে না";
    var d = Math.ceil((new Date(x.at).getTime() + BDAYS * 864e5 - Date.now()) / 864e5);
    return d > 1 ? bd(d) + " দিন পরে মুছবে" : d === 1 ? "কাল মুছবে" : "মেয়াদ শেষ — পরের ক্লিনআপে মুছবে";
  }
  function binSum(items) {
    if (BDAYS == null) return "";
    if (!(BDAYS > 0)) return '<p class="sm">⏳ সেটিংয়ে বিনে থাকার দিন ০ — বিন নিজে খালি হবে না (জায়গা কম পড়লে আগেই কাটতে পারে)।</p>';
    var mn = null; (items || []).forEach(function (x) { if (x && x.at) { var a = new Date(x.at).getTime(); if (mn == null || a < mn) mn = a; } });
    if (mn == null) return '<p class="sm">⏳ বিনে থাকার মেয়াদ: ' + bd(BDAYS) + " দিন।</p>";
    return '<p class="sm">⏳ বিনে থাকার মেয়াদ: <b>' + bd(BDAYS) + "</b> দিন · সবচেয়ে পুরোনোটা: " + binLeft({ at: new Date(mn).toISOString() }) + "। (জায়গা কম পড়লে আগেই কাটতে পারে)</p>";
  }
  function say(t, bad) { MSG = t; BAD = !!bad; var m = document.querySelector("#binM"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  function paint() {
    var V = document.querySelector("#view"), h = "";
    h += '<h3>জায়গার অবস্থা</h3><div class="box">' + bar("ডেটাবেস", SP.db_pct, SP.db_mb, SP.db_limit, SP.start_pct) + bar("Storage (ফাইল)", SP.st_pct, SP.st_mb, SP.st_limit, SP.start_pct) +
      '<p class="sm">কালো দাগ = ' + bd(SP.start_pct) + '% (এখানে পৌঁছালে নিজে নিজে কাটা শুরু)। ' + (SP.buckets || []).map(function (b) { return E(b.id) + ' ' + bd(b.mb) + ' MB'; }).join(" · ") + '</p></div>';
    h += '<h3>নিজে বেছে ডিলিট</h3><div class="box"><label class="sm" style="display:grid;gap:3px"><b>এর চেয়ে পুরোনো কত দিন? (০ = সব)</b><input type="number" min="0" step="1" id="bdays" value="' + DAYS + '"></label><div style="display:grid;gap:6px;margin-top:10px">';
    L.forEach(function (x) {
      var s = (MS && MS[x[0]]) || { n: 0, mb: 0 };
      h += '<label style="display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;background:var(--chip,#eef3ef)"><input type="checkbox" data-k="' + x[0] + '"' + (SEL[x[0]] ? " checked" : "") + '><span style="flex:1"><b>' + x[1] + '</b></span><span class="sm">' + bd(s.n) + 'টি · ' + bd(s.mb) + ' MB</span></label>';
    });
    h += '</div><label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="btop"' + (TOP ? " checked" : "") + '><span class="sm">টপ ৩-এ আসা (সুরক্ষিত) কার্ডও কাটো (' + bd((MS && MS.top) || 0) + 'টি আছে)</span></label>' +
      '<div class="act" style="margin-top:10px"><button class="d s" type="button" data-a="del">🗑 এখনই ডিলিট</button></div><p id="binM" class="sm' + (BAD ? " warn" : "") + '">' + E(MSG) + '</p></div>';
    var all = (BN && BN.items) || [], it = binFilter(all), PER = 50, pages = Math.max(1, Math.ceil(it.length / PER)); if (BF.pg >= pages) BF.pg = pages - 1; var shown = it.slice(BF.pg * PER, BF.pg * PER + PER), ids = {};
    all.forEach(function (x) { ids[x.id] = 1; }); Object.keys(BS).forEach(function (k) { if (!ids[k]) delete BS[k]; });
    function uniq(k) { var o = {}; all.forEach(function (x) { if (x[k]) o[x[k]] = 1; }); return Object.keys(o).sort(function (p, q) { return p.localeCompare(q, "bn"); }); }
    function opts(list, cur) { return list.map(function (o) { return '<option value="' + E(o[0]) + '"' + (cur === o[0] ? " selected" : "") + ">" + E(o[1]) + "</option>"; }).join(""); }
    h += '<h3>বিন (' + bd((BN && BN.total) || 0) + 'টি · ' + bd((BN && BN.mb) || 0) + ' MB)</h3><div class="box">';
    h += '<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:8px">' +
      '<select data-bf="src" aria-label="ধরন"><option value="">সব ধরন</option>' + Object.keys(SRC).map(function (k) { return '<option value="' + k + '"' + (BD.src === k ? " selected" : "") + ">" + E(SRC[k]) + "</option>"; }).join("") + '</select>' +
      '<select data-bf="dept" aria-label="বিভাগ"><option value="">সব বিভাগ</option>' + opts(uniq("dept").map(function (v) { return [v, v]; }), BD.dept) + '</select>' +
      '<select data-bf="batch" aria-label="সেশন"><option value="">সব সেশন</option>' + opts(uniq("batch").map(function (v) { return [v, v]; }), BD.batch) + '</select>' +
      '<select data-bf="sr" aria-label="স্কোর-পরিসর">' + opts(SR, BD.sr) + '</select>' +
      '<select data-bf="tm" aria-label="মোছার সময়">' + opts(TM, BD.tm) + '</select>' +
      '<input data-bf="q" type="search" maxlength="60" placeholder="🔎 নাম / ডিভাইস খুঁজুন" aria-label="নাম খুঁজুন" value="' + E(BD.q) + '" enterkeyhint="search"></div>' +
      '<div id="bcust" style="display:' + (BD.tm === "c" ? "grid" : "none") + ';gap:8px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:8px">' +
      '<label class="sm" style="display:grid;gap:2px">মোছার সময় — থেকে<input data-bf="tf" type="datetime-local" value="' + E(BD.tf) + '"></label>' +
      '<label class="sm" style="display:grid;gap:2px">পর্যন্ত<input data-bf="tt" type="datetime-local" value="' + E(BD.tt) + '"></label></div>' +
      '<div class="act"><button type="button" data-a="bfgo" style="font-size:16px;font-weight:800;padding:12px 20px">🔎 সার্চ</button><button class="l s" type="button" data-a="bfclr">✖ ফিল্টার মুছুন</button></div>' +
      '<p class="sm">মোট <b>' + bd(it.length) + '</b>টি' + (it.length !== all.length ? " (মোট " + bd(all.length) + " থেকে ফিল্টার করা)" : "") + (BN && BN.total > all.length ? " · সর্বশেষ " + bd(all.length) + "টি লোড হয়েছে" : "") + '</p>';
    h += '<div class="act" style="margin:6px 0"><button class="l s" type="button" data-a="bsall">☑ এই পেজের সব বাছো</button><button class="l s" type="button" data-a="bsfil">☑ ফিল্টারের সব বাছো (' + bd(it.length) + ')</button><button class="l s" type="button" data-a="bsclr">✖ বাছা বাদ</button></div>' + (all.length ? '<div class="act" style="margin:6px 0;align-items:center"><button type="button" class="s" data-a="restall">↩ সব ফেরান (' + bd(all.length) + 'টি' + (restMb() != null ? " · ≈ " + bd(restMb()) + " MB" : "") + ')</button><span class="sm">ফিল্টার নির্বিশেষে বিনের সবকিছু একটা একটা করে ফেরে।' + (BN && BN.total > all.length ? " এখন লোড হওয়া " + bd(all.length) + "টি; বাকি " + bd(BN.total - all.length) + "টির জন্য শেষে আবার চাপুন।" : "") + '</span></div>' : "") +
      '<div class="act" style="margin:6px 0;align-items:center"><b id="bsn">বাছা ' + bd(nsel()) + ' টি</b><button type="button" class="s" data-a="brest"' + (nsel() ? "" : " disabled") + '>↩ বাছাগুলো রিস্টোর</button><button class="d s" type="button" data-a="bdel"' + (nsel() ? "" : " disabled") + '>🗑 বাছাগুলো চিরতরে ডিলিট</button></div>' +
      '<p id="binP" class="sm' + (PBAD ? " warn" : "") + '">' + E(PMSG) + '</p>';
    h += binSum(all);
    if (!all.length) h += '<p class="sm">বিন খালি।</p>'; else if (!it.length) h += '<p class="sm">এই ফিল্টারে কিছু মেলেনি।</p>';
    shown.forEach(function (x) {
      var card = x.src === "mc2_cards", th = TH[x.id] || "", meta = [x.dept, x.batch].filter(Boolean).map(E).join(" · ");
      h += '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #8884"><input type="checkbox" data-sel="' + x.id + '"' + (BS[x.id] ? " checked" : "") + ' aria-label="বাছো" style="width:20px;height:20px;flex:none">' +
        (card ? '<button type="button" data-a="bprev" data-id="' + x.id + '" title="বড় প্রিভিউ" style="padding:0;flex:none;width:56px;height:70px;background:#fff;border:1px solid #8886;border-radius:8px;overflow:hidden;line-height:0;display:grid;place-items:center;font-size:20px">' + (th ? '<img data-th="' + x.id + '" src="' + th + '" alt="" style="width:100%;height:100%;object-fit:cover">' : '<span data-th="' + x.id + '">🖼</span>') + '</button>' : "") +
        '<span style="flex:1;min-width:0"><span class="tag">' + E(SRC[x.src] || x.src) + '</span> <b' + (card ? ' data-a="bprev" data-id="' + x.id + '" style="cursor:pointer"' : "") + '>' + E(x.name || "?") + '</b><br><span class="sm">' + (meta ? meta + " · " : "") + (x.score != null && x.score !== "" ? "স্কোর " + bd(x.score) + " · " : "") + E(tmf(x.at)) + (binLeft(x) ? " · ⏳ " + binLeft(x) : "") + '</span></span></div>';
    });
    h += bpager(BF.pg, pages) + (pages > 1 ? '<p class="sm" style="text-align:center">পেজ ' + bd(BF.pg + 1) + " / " + bd(pages) + " · মোট " + bd(it.length) + "টি</p>" : "");
    if (all.length) h += '<div class="act" style="margin-top:10px">' + (it.length ? '<button class="d s" type="button" data-a="fpurge">🗑 ফিল্টারের ' + bd(it.length) + 'টি চিরতরে মুছুন</button>' : "") + '<button class="d s" type="button" data-a="purge">বিন খালি করো</button></div>';
    h += '<p class="sm">বিনের জিনিস ' + 'নির্ধারিত দিন (সেটিংয়ের "বিনে কত দিন") পরে নিজে মুছে যায়, জায়গা কম পড়লে আগেই।</p></div>';
    var sy = window.scrollY; V.innerHTML = h; window.scrollTo(0, sy);
    V.onclick = click; V.onchange = change; thumbs(shown);
    V.onkeydown = function (e) { var t = e.target; if (e.key === "Enter" && t.dataset && t.dataset.bf) { e.preventDefault(); BD[t.dataset.bf] = t.value; applyF(); paint(); } };
  }
  function bpager(pg, pages) {
    var st = Math.max(0, Math.min(pg - 2, pages - 5)), en = Math.min(pages, st + 5), h = "", i;
    if (pages < 2) return "";
    h += '<div class="act" style="justify-content:center;flex-wrap:wrap;margin:10px 0"><button class="l s" type="button" data-a="bpg" data-p="' + (pg - 1) + '"' + (pg ? "" : " disabled") + '>‹ আগের</button>';
    if (st > 0) h += '<button class="l s" type="button" data-a="bpg" data-p="0">' + bd(1) + "</button>" + (st > 1 ? '<span class="sm">…</span>' : "");
    for (i = st; i < en; i++) h += '<button class="' + (i === pg ? "" : "l ") + 's" type="button" data-a="bpg" data-p="' + i + '"' + (i === pg ? ' aria-current="page"' : "") + ">" + bd(i + 1) + "</button>";
    if (en < pages) h += (en < pages - 1 ? '<span class="sm">…</span>' : "") + '<button class="l s" type="button" data-a="bpg" data-p="' + (pages - 1) + '">' + bd(pages) + "</button>";
    return h + '<button class="l s" type="button" data-a="bpg" data-p="' + (pg + 1) + '"' + (pg < pages - 1 ? "" : " disabled") + ">নেক্সট ›</button></div>";
  }
  function applyF() { BF = Object.assign({}, BD, { pg: 0 }); }
  function nsel() { return Object.keys(BS).filter(function (k) { return BS[k]; }).length; }
  function tmf(v) { if (!v) return ""; try { return new Date(v).toLocaleString("bn-BD", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return String(v).slice(0, 16); } }
  function binFilter(L) {
    var q = BF.q.trim().toLowerCase(), f = 0, t = 0, rg = BF.sr ? BF.sr.split("-").map(Number) : null;
    if (BF.tm === "c") { f = BF.tf ? new Date(BF.tf).getTime() || 0 : 0; t = BF.tt ? new Date(BF.tt).getTime() || 0 : 0; if (t) t += 59999; } else if (BF.tm) f = Date.now() - (+BF.tm) * 36e5;
    return L.filter(function (x) {
      var a = x.at ? new Date(x.at).getTime() : 0, sc = x.score == null || x.score === "" ? NaN : +x.score;
      return (!BF.src || x.src === BF.src) && (!BF.dept || x.dept === BF.dept) && (!BF.batch || x.batch === BF.batch) && (!rg || (sc >= rg[0] && sc <= rg[1])) && (!q || (String(x.name || "") + " " + String(x.device || "")).toLowerCase().indexOf(q) >= 0) && (!f || a >= f) && (!t || a <= t);
    });
  }
  // কার্ডের থাম্ব: শুধু এই পেজের সারিগুলোর, পরে এনে বসায় (তালিকা ধীর হয় না)
  function thumbs(shown) {
    var ids = shown.filter(function (x) { return x.src === "mc2_cards" && TH[x.id] == null; }).map(function (x) { return +x.id; }); if (!ids.length) return;
    M.rpc("mc2_bin_get", { p_ids: ids, p_full: false }).then(function (r) {
      ids.forEach(function (i) { TH[i] = ""; }); (r || []).forEach(function (t) { TH[t.id] = JPGR.test(t.thumb || "") ? t.thumb : ""; });
      ids.forEach(function (i) { var el = document.querySelector('[data-th="' + i + '"]'); if (el && TH[i]) { var im = document.createElement("img"); im.dataset.th = i; im.alt = ""; im.src = TH[i]; im.style.cssText = "width:100%;height:100%;object-fit:cover"; el.replaceWith(im); } });
    }).catch(function () {});
  }
  function pmsg(t, bad) { PMSG = t; PBAD = !!bad; var m = document.querySelector("#binP"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  // একসাথে রিস্টোর/ডিলিট: বিদ্যমান RPC একটা একটা করে, প্রগ্রেস দেখিয়ে
  function bulk(kind, idl, ask) {
    var del = kind === "del", n = idl.length, i = 0, ok = 0, ex = 0, bad = 0, why = "";
    if (BUSY) return pmsg("আগের কাজ চলছে, একটু অপেক্ষা করুন", true); if (!n) return;
    if (del) {
      if (n > 20) { var v = prompt("⚠ " + bd(n) + "টি চিরতরে মুছে যাবে, ফেরানো যাবে না।\nনিশ্চিত হলে সংখ্যাটি লিখুন: " + bd(n)); if (v == null) return; if (String(v).trim().replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }) !== String(n)) return pmsg("বাতিল: সংখ্যা মেলেনি", true); }
      else if (!confirm("⚠ সতর্কতা: বাছা " + bd(n) + "টি চিরতরে মুছে যাবে, ফেরানো যাবে না।\nনিশ্চিত?")) return;
    } else if (!confirm(ask || "বাছা " + bd(n) + "টি ফিরিয়ে আনবেন?")) return;
    BUSY = true;
    function fin() {
      BUSY = false;
      pmsg(del ? "✓ চিরতরে মোছা হয়েছে: " + bd(ok) + "টি" + (bad ? " · ✗ হয়নি: " + bd(bad) + "টি (" + why + ")" : "")
        : "✓ ফিরে এসেছে: " + bd(ok) + "টি" + (ex ? " · ⚠ আগে থেকেই আছে, ফেরেনি: " + bd(ex) + "টি" : "") + (bad ? " · ✗ হয়নি: " + bd(bad) + "টি (" + why + ")" : ""), bad > 0);
      var m = PMSG, b = PBAD; return load().then(function () { paint(); pmsg(m, b); }).catch(function () {});
    }
    function step() {
      if (i >= n) return fin();
      pmsg((del ? "🗑 মোছা হচ্ছে " : "↩ ফেরানো হচ্ছে ") + bd(i) + "/" + bd(n) + " …");
      var id = +idl[i++];
      M.rpc(del ? "mc2_bin_delete" : "mc2_bin_restore", { p_id: id }).then(function (r) {
        if (del) { ok++; delete BS[id]; } else if (r === "ok") { ok++; delete BS[id]; } else if (r === "exists") { ex++; delete BS[id]; } else { bad++; why = why || String(r); }
      }).catch(function (x) { bad++; why = why || (x && x.message) || "?"; }).then(step);
    }
    step();
  }
  function bprev(id) {
    var x = ((BN && BN.items) || []).filter(function (i) { return String(i.id) === String(id); })[0] || {}, ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:grid;place-items:center;padding:10px;overflow:auto";
    ov.innerHTML = '<div style="background:Canvas;color:CanvasText;width:min(96vw,540px);max-height:96vh;overflow:auto;border-radius:14px;padding:12px;display:grid;gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' + E(x.name || "?") + '</b><button type="button" class="l s" data-x="1">✕ বন্ধ</button></div>' +
      '<div id="bpv" style="text-align:center;min-height:120px">⏳ কার্ড আঁকা হচ্ছে...</div><p class="sm">' + [x.dept, x.batch].filter(Boolean).map(E).join(" · ") + (x.score != null && x.score !== "" ? " · স্কোর " + bd(x.score) : "") + " · মোছা: " + E(tmf(x.at)) + '</p>' +
      '<div class="act"><button type="button" class="s" data-pa="rest">↩ ফিরিয়ে আনো</button><button class="d s" type="button" data-pa="pdel">🗑 চিরতরে মুছুন</button></div><p class="sm" id="bpm"></p></div>';
    document.body.appendChild(ov);
    function close(reload) { ov.remove(); if (reload) { delete BS[id]; return load().then(paint).catch(function () {}); } }
    function msg(t, bad) { var m = ov.querySelector("#bpm"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
    ov.onclick = function (e) {
      if (e.target === ov || e.target.closest("[data-x]")) return close();
      var b = e.target.closest("[data-pa]"); if (!b) return;
      if (b.dataset.pa === "rest") M.rpc("mc2_bin_restore", { p_id: +id }).then(function (r) { if (r === "ok") close(true); else msg(r === "exists" ? "এই নামে কার্ড এখন আছে, তাই ফেরানো হয়নি" : "ফেরানো যায়নি (" + r + ")", true); }).catch(function (z) { msg("✗ " + z.message, true); });
      if (b.dataset.pa === "pdel") { if (!confirm("⚠ সতর্কতা: এটি চিরতরে মুছে যাবে, আর ফেরানো যাবে না।\nনিশ্চিত?")) return; M.rpc("mc2_bin_delete", { p_id: +id }).then(function () { close(true); }).catch(function (z) { msg("✗ " + z.message, true); }); }
    };
    M.rpc("mc2_bin_get", { p_ids: [+id], p_full: true }).then(function (r) {
      var c = r && r[0], box = ov.querySelector("#bpv"); if (!c || !box) throw new Error("কার্ডের তথ্য পাওয়া যায়নি");
      var rec = c.rec || {}, show = function (u) { box.innerHTML = '<img src="' + u + '" alt="" style="max-width:100%;max-height:62vh;border-radius:10px;border:1px solid #8886;background:#fff">'; };
      if (!window.MCCards || !c.rec) { if (JPGR.test(c.thumb || "")) { show(c.thumb); msg("ছোট প্রিভিউ দেখানো হচ্ছে", false); return; } throw new Error("কার্ড আঁকা যায়নি"); }
      return window.MCCards.render(Object.assign({}, rec, { name: rec.name || c.name, score: rec.score != null ? rec.score : +c.score }), c.photo, "card").then(function (cv) { show(cv.toDataURL("image/jpeg", 0.9)); });
    }).catch(function (z) { var box = ov.querySelector("#bpv"); if (box) box.innerHTML = '<span class="sm warn">✗ ' + E(z.message || "প্রিভিউ আসেনি") + ' (নতুন SQL চালানো হয়েছে?)</span>'; });
  }
  function change(e) {
    var t = e.target;
    if (t.dataset && t.dataset.sel) { if (t.checked) BS[t.dataset.sel] = true; else delete BS[t.dataset.sel]; var n = nsel(), sn = document.querySelector("#bsn"); if (sn) sn.textContent = "বাছা " + bd(n) + " টি"; ["brest", "bdel"].forEach(function (a) { var bt = document.querySelector('[data-a="' + a + '"]'); if (bt) bt.disabled = !n; }); return; }
    if (t.dataset && t.dataset.bf) { BD[t.dataset.bf] = t.value; if (t.dataset.bf === "tm") { var cu = document.querySelector("#bcust"); if (cu) cu.style.display = t.value === "c" ? "grid" : "none"; } return; } // ম্যানুয়াল: "🔎 সার্চ" চাপলে (বা Enter) তবেই প্রয়োগ
    if (t.id === "bdays") { DAYS = Math.max(0, parseInt(t.value, 10) || 0); say(""); return M.rpc("mc2_manual_stats", { p_days: DAYS }).then(function (r) { MS = r; paint(); }).catch(function (x) { say("✗ " + x.message, true); }); }
    if (t.id === "btop") { TOP = t.checked; return; }
    if (t.dataset && t.dataset.k) SEL[t.dataset.k] = t.checked;
  }
  function click(e) {
    var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a;
    if (a === "bfgo") { applyF(); return paint(); }
    if (a === "bfclr") { BF = Object.assign({}, BF0); BD = Object.assign({}, BF0); return paint(); }
    if (a === "bprev") return bprev(b.dataset.id);
    if (a === "fpurge") return bulk("del", binFilter((BN && BN.items) || []).map(function (x) { return x.id; }));
    if (a === "bsall") { var pg0 = binFilter((BN && BN.items) || []).slice(BF.pg * 50, BF.pg * 50 + 50); pg0.forEach(function (x) { BS[x.id] = true; }); return paint(); }
    if (a === "bsfil") { binFilter((BN && BN.items) || []).forEach(function (x) { BS[x.id] = true; }); return paint(); }
    if (a === "bsclr") { BS = {}; return paint(); }
    if (a === "restall") { var all2 = (BN && BN.items) || [], mb2 = restMb(); if (!all2.length) return; return bulk("rest", all2.map(function (x) { return x.id; }), "↩ বিনের সব " + bd(all2.length) + "টি ফিরিয়ে আনবেন?" + (mb2 != null ? "\nআনুমানিক ≈ " + bd(mb2) + " MB মূল টেবিল/ছবিতে ফিরবে (জায়গার হিসাব বাড়তে পারে)।" : "") + "\n\nএকটা একটা করে ফেরানো হবে; যেটার নামে এখন একই তথ্য আছে সেটা ফিরবে না (বিনেই থাকবে)।\nঅটো-ক্লিন আবার চালালে এগুলো আবার বিনে যেতে পারে।"); }
    if (a === "brest") return bulk("rest", Object.keys(BS).filter(function (k) { return BS[k]; }));
    if (a === "bdel") return bulk("del", Object.keys(BS).filter(function (k) { return BS[k]; }));
    if (a === "bpg") { BF.pg = +b.dataset.p; return paint(); }
    if (a === "del") {
      var ks = L.filter(function (x) { return SEL[x[0]]; });
      if (!ks.length) return say("আগে কোনো বিভাগে টিক দিন", true);
      var txt = ks.map(function (x) { var s = MS[x[0]] || { n: 0, mb: 0 }; return x[1] + ": " + bd(s.n) + "টি (" + bd(s.mb) + " MB)"; }).join("\n");
      if (!confirm((DAYS > 0 ? bd(DAYS) + " দিনের চেয়ে পুরোনো " : "সব ") + "এগুলো মুছবে:\n\n" + txt + (TOP ? "\n(টপ ৩ সহ)" : "") + "\n\nনিশ্চিত?")) return;
      M.rpc("mc2_manual_delete", { p_what: ks.map(function (x) { return x[0]; }), p_days: DAYS, p_top: TOP }).then(function (r) { MSG = "✓ মোছা হয়েছে: " + Object.keys(r).map(function (k) { return k + " " + bd(r[k]); }).join(" · "); BAD = false; return load().then(paint); }).catch(function (x) { say("✗ " + x.message, true); });
    }
    if (a === "rest") { M.rpc("mc2_bin_restore", { p_id: +b.dataset.id }).then(function (r) { MSG = r === "ok" ? "✓ ফিরিয়ে আনা হয়েছে" : r === "exists" ? "এই নামে কার্ড এখন আছে, তাই ফেরানো হয়নি" : "ফেরানো যায়নি (" + r + ")"; BAD = r !== "ok"; return load().then(paint); }).catch(function (x) { say("✗ " + x.message, true); }); }
    if (a === "pdel") { if (!confirm("⚠ সতর্কতা: এটি চিরতরে মুছে যাবে, আর ফেরানো যাবে না।\nনিশ্চিত?")) return; M.rpc("mc2_bin_delete", { p_id: +b.dataset.id }).then(function () { MSG = "✓ চিরতরে মোছা হয়েছে"; BAD = false; return load().then(paint); }).catch(function (x) { say("✗ " + x.message, true); }); }
    if (a === "purge") { if (!confirm("বিনের সব চিরতরে মুছবে। নিশ্চিত?")) return; M.rpc("mc2_bin_purge", { p_days: null }).then(function (n) { MSG = "✓ বিন খালি (" + bd(n) + "টি)"; BAD = false; return load().then(paint); }).catch(function (x) { say("✗ " + x.message, true); }); }
  }
  function view() { M = window.MCA; MSG = ""; BAD = false; document.querySelector("#view").innerHTML = "⏳ লোড হচ্ছে..."; return load().then(paint).catch(function (x) { document.querySelector("#view").innerHTML = '<p class="sm warn">✗ ' + E(x.message) + ' (SQL ...19b, c, d আর 20261113 চালানো হয়েছে?)</p>'; }); }

  // ---------- অন্য পেজে "♻ রিস্টোর" বোতাম + মুছে ফেলা তালিকা (ফিরিয়ে আনো / চিরতরে) ----------
  var SRC = { mc2_cards: "কার্ড", contest_entries: "জমা ইউজার", mc2_scores: "স্কোর", mc2_visits: "ভিজিট", mc2_answers: "উত্তর", mc2_ufolder_members: "ফোল্ডারের সদস্য", mc2_presence: "ভিজিটর রেকর্ড", mc2_top_hist: "টপ-হিস্টরি", mc2_entry_flags: "এন্ট্রির ফ্ল্যাগ" };
  var MAP = { cards: "mc2_cards", score: "mc2_scores", visit: "mc2_visits", prize: "contest_entries", usr: "contest_entries" };
  function mopen(src) {
    var A = window.MCA; if (!A) return;
    var ov = document.createElement("div"), changed = false;
    ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:#0008;display:flex;align-items:flex-end;justify-content:center";
    ov.innerHTML = '<div style="background:Canvas;color:CanvasText;width:100%;max-width:560px;max-height:85vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px"><div style="display:flex;justify-content:space-between;align-items:center"><b>♻ মুছে ফেলা তালিকা (' + A.esc(SRC[src] || src) + ')</b><button type="button" class="s" data-x="1">✕ বন্ধ</button></div><p class="sm">⚠ "চিরতরে" চাপলে আর ফেরানো যাবে না। "ফিরিয়ে আনো" চাপলে আগের জায়গায় ফিরবে।</p><div id="mcbinl">⏳ লোড হচ্ছে...</div></div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); if (changed) { var cur = document.querySelector("#tabs .on"); if (cur) cur.click(); } }
    function load() {
      A.rpc("mc2_bin_list", { p_limit: 100, p_src: src }).then(function (r) {
        var it = (r && r.items) || [], l = ov.querySelector("#mcbinl");
        l.innerHTML = it.length ? it.map(function (x) { return '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #8884"><span style="flex:1;min-width:0"><b>' + A.esc(x.name || "?") + '</b> <span class="sm">' + (x.score != null ? "স্কোর " + bd(x.score) + " · " : "") + A.esc(String(x.at || "").slice(0, 10)) + '</span></span><button class="l s" type="button" data-a="rest" data-id="' + x.id + '">↩ ফিরিয়ে আনো</button> <button class="d s" type="button" data-a="pdel" data-id="' + x.id + '">🗑 চিরতরে</button></div>'; }).join("") : '<p class="sm">মুছে ফেলা কিছু নেই।</p>';
      }).catch(function (x) { ov.querySelector("#mcbinl").innerHTML = '<p class="sm warn">✗ ' + A.esc(x.message) + '</p>'; });
    }
    ov.onclick = function (e) {
      if (e.target === ov || e.target.closest("[data-x]")) return close();
      var b = e.target.closest("[data-a]"); if (!b) return; var id = +b.dataset.id;
      if (b.dataset.a === "rest") A.rpc("mc2_bin_restore", { p_id: id }).then(function (r) { if (r === "ok") changed = true; else alert(r === "exists" ? "এই তথ্য এখন আছে, তাই ফেরানো হয়নি" : "ফেরানো যায়নি (" + r + ")"); load(); }).catch(A.fail);
      if (b.dataset.a === "pdel") { if (!confirm("⚠ সতর্কতা: এটি চিরতরে মুছে যাবে, আর ফেরানো যাবে না।\nনিশ্চিত?")) return; A.rpc("mc2_bin_delete", { p_id: id }).then(function () { load(); }).catch(A.fail); }
    };
    load();
  }
  window.MCBIN = { open: mopen };
  function check() {
    var v = document.querySelector("#view"); if (!v) return;
    var tb = document.querySelector("#tabs .on"), key = tb && tb.dataset.t, src = v.querySelector("#mfl") ? "mc2_ufolder_members" : MAP[key], bar = document.getElementById("mcbinbtn");
    if (!src || key === "bin") { if (bar) bar.remove(); return; }
    if (bar && bar.dataset.src === src && bar.parentNode === v) return;
    if (bar) bar.remove();
    bar = document.createElement("button"); bar.id = "mcbinbtn"; bar.type = "button"; bar.className = "l s"; bar.dataset.src = src; bar.style.cssText = "margin:0 0 8px"; bar.textContent = "♻ রিস্টোর (মুছে ফেলা: " + (SRC[src] || src) + ")";
    bar.onclick = function () { mopen(src); }; v.insertBefore(bar, v.firstChild);
  }
  function arm() { var v = document.querySelector("#view"), t = document.querySelector("#tabs"); if (!v || !t) return setTimeout(arm, 500); var o = new MutationObserver(check); o.observe(v, { childList: true }); o.observe(t, { subtree: true, attributes: true, attributeFilter: ["class"] }); check(); }
  arm();
})();

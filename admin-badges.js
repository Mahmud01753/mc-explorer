// অ্যাডমিন: 🏅 বেইজ (ইউজারের বেইজ) — অ্যাডমিনের যেকোনো ইউজার-তালিকায় নামের পাশে নিজে থেকে "🏅" বাটন বসে (data-uu / data-dev / অবস্থার তালিকা দেখে); চাপলে ড্রপডাউন-শিট খোলে: অবস্থা + একাধিক বেইজ বাছা + সম্পাদনা/মোছা/নতুন। admin-folders.js এটাকে window.MCBG দিয়ে ব্যবহার করে।
// ১৫টা রেডিমেড সুন্দর নাম; একজনকে একাধিক বেইজ; নিজে বানানো/নাম-আইকন-রঙ বদলানো/মোছা। বাছা অনেকজনকে একসাথেও দেওয়া যায়।
// ✅/❔/🚫/📵 অবস্থা আগের ফ্ল্যাগেই থাকে (window.MCFL) — বেইজ প্যানেলে সবার আগে দেখায়, দুই দিক থেকেই বদলানো যায়; ফ্ল্যাগ কখনো মোছা হয় না, বেইজ মুছলেও ফ্ল্যাগে হাত পড়ে না।
// SQL: supabase-new-20261025.sql (একবার Run)। এই ফাইল না থাকলে ফোল্ডারের কাজ আগের মতোই চলে।
(function () {
  var M = null, DEFS = [], MAP = {}, FLM = {}, noSql = "", mgr = false, OPEN = {}, BUSY = false, POP = null, LOADED = null, FLREG = false, GF = { ids: [], mode: "all" };
  var DEF15 = [["b1", "🏆", "কুইজ বিজয়ী", "#c9971c"], ["b2", "🥇", "টপার", "#d4a017"], ["b3", "📞", "সাড়া দিয়েছে", "#2e7d4f"], ["b4", "🎁", "পুরস্কার পেয়েছে", "#c2410c"], ["b5", "🌟", "সেরা খেলোয়াড়", "#b45309"],
    ["b6", "👑", "চ্যাম্পিয়ন", "#7c3aed"], ["b7", "🔥", "নিয়মিত খেলোয়াড়", "#dc2626"], ["b8", "🧠", "ধীমান", "#0e7490"], ["b9", "🗺️", "ক্যাম্পাস গাইড", "#15803d"], ["b10", "⚡", "বিদ্যুৎগতি", "#ca8a04"],
    ["b11", "🎯", "নিখুঁত লক্ষ্য", "#be123c"], ["b12", "💎", "বিশেষ অতিথি", "#0369a1"], ["b13", "🤝", "সহযোগী", "#4d7c0f"], ["b14", "📣", "প্রচারক", "#a21caf"], ["b15", "🌱", "নতুন মুখ", "#16a34a"]];
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var def = function (id) { for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) return DEFS[i]; return null; };
  var idsOf = function (k) { return (MAP[k] || []).filter(function (b) { return !!def(b); }); };
  var hex = function (c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : "#2e7d4f"; };
  var fail = function (e) { (window.MCA && window.MCA.fail ? window.MCA.fail : alert)(e); };

  var st = document.createElement("style");
  st.textContent = ".bgc{display:inline-block;border:1px solid var(--bd);border-radius:999px;padding:2px 9px;margin:0 4px 4px 0;font-size:13px;font-weight:600;line-height:1.6}" +
    "button.bgt{display:inline-block;border:1.5px solid var(--bd);border-radius:999px;padding:6px 11px;margin:0 6px 6px 0;font-weight:600;cursor:pointer;background:var(--card);color:var(--fg)}" +
    "button.bgt.on{color:#fff;border-color:transparent}.bgr{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:7px 0;border-top:1px solid var(--bd)}.bgr:first-child{border-top:0}.bgr input[type=text]{width:auto;flex:1 1 130px;min-width:0}.bgr input.bge{flex:0 0 58px;text-align:center}.bgr input[type=color]{width:42px;height:36px;padding:2px;flex:none}" +
    ".bgbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0;padding:6px 8px;border:1px solid var(--bd);border-radius:10px;background:var(--bg)}" +
    "button.bgm{display:inline-block;width:auto;border:1px dashed var(--bd);background:var(--card);color:var(--fg);border-radius:999px;padding:1px 8px;margin:0 4px;font-size:13px;font-weight:600;cursor:pointer;line-height:1.6;vertical-align:middle}button.bgm.has{border-style:solid;border-color:var(--g)}" +
    "button#bgfab{position:fixed;left:10px;bottom:76px;z-index:9998;width:auto;border-radius:999px;padding:8px 14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.3);background:var(--card);color:var(--fg);border:1.5px solid var(--g)}button#bgfab.on{background:var(--g);color:#fff}#bgov{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}#bgov .bgsh{background:var(--card);color:var(--fg);width:100%;max-width:560px;max-height:88vh;overflow:auto;border-radius:16px 16px 0 0;padding:14px;display:grid;gap:10px}#bgov .bgh{display:flex;justify-content:space-between;gap:8px;align-items:center}";
  document.head.appendChild(st);

  function load() {
    M = window.MCA; if (!M || !M.rpc) { noSql = "অ্যাডমিন সংযোগ নেই"; return Promise.resolve(); }
    return Promise.all([M.rpc("mc2_badge_all"), M.rpc("mc2_flag_all").catch(function () { return {}; })]).then(function (r) { DEFS = (r[0] && r[0].defs) || []; MAP = (r[0] && r[0].map) || {}; FLM = r[1] || {}; noSql = ""; if (!FLREG && window.MCFL) { FLREG = true; window.MCFL.reg(function () { return FLM; }); } })
      .catch(function (e) { DEFS = []; MAP = {}; noSql = String(e && e.message || e).slice(0, 160); }).then(function () { refreshMarks(); });
  }
  function ensure() { if (!LOADED) LOADED = load(); return LOADED; }
  function chip(d, on) { var c = hex(d.color); return '<span class="bgc" style="border-color:' + c + ";background:" + c + '22">' + esc(d.emoji) + " " + esc(d.name) + "</span>"; }
  function chips(k) { return idsOf(k).map(function (b) { return chip(def(b)); }).join(""); }
  function has(k, id) { return id === "none" ? !idsOf(k).length : (MAP[k] || []).indexOf(id) >= 0; }
  function names(k) { return idsOf(k).map(function (b) { return def(b).name; }).join(" | "); }
  function opts(sel, extra) { return (extra || "") + DEFS.map(function (d) { return '<option value="' + esc(d.id) + '"' + (sel === d.id ? " selected" : "") + ">" + esc(d.emoji + " " + d.name) + "</option>"; }).join(""); }

  // একজনের বেইজ প্যানেল: সবার আগে অবস্থা (ফ্ল্যাগ), তারপর সব বেইজ — যতগুলো খুশি চেপে চালু/বন্ধ
  function panel(k, fl) {
    if (noSql) return '<div class="mfa"><div class="mfm bad">⚠️ বেইজের টেবিল নেই। SQL Editor-এ <b>supabase-new-20261025.sql</b> একবার চালান।</div></div>';
    var cur = MAP[k] || [], MCFL = window.MCFL;
    return '<div class="mfa"><b>🏅 বেইজ — যতগুলো খুশি বাছুন</b>' +
      '<div><span class="sm">অবস্থা (সবার আগে; ফোল্ডারেও একই বদলায়):</span><br>' + (MCFL ? MCFL.ctl(k, fl) : "") + "</div>" +
      "<div>" + (DEFS.length ? DEFS.map(function (d) { var on = cur.indexOf(d.id) >= 0, c = hex(d.color); return '<button type="button" class="bgt' + (on ? " on" : "") + '" data-bgt="' + esc(d.id) + '" data-k="' + esc(k) + '"' + (on ? ' style="background:' + c + '"' : ' style="border-color:' + c + '"') + ">" + (on ? "✓ " : "") + esc(d.emoji + " " + d.name) + "</button>"; }).join("") : '<span class="sm">কোনো বেইজ নেই — উপরের "🏅 বেইজ সম্পাদনা" থেকে বানান।</span>') + "</div></div>";
  }
  // উপরের সম্পাদনা-বক্স
  function mgrBar() {
    if (noSql) return '<div class="mfm bad">⚠️ বেইজের টেবিল পাওয়া যায়নি। Supabase SQL Editor-এ <b>supabase-new-20261025.sql</b> একবার চালান। <span class="sm">' + esc(noSql) + "</span></div>";
    var h = '<div class="act" style="margin:4px 0 8px"><button type="button" class="' + (mgr ? "" : "l ") + 's" data-bga="mgr">🏅 বেইজ সম্পাদনা (' + bd(DEFS.length) + "টি)" + (mgr ? " ▲" : " ▼") + "</button></div>";
    if (!mgr) return h;
    var miss = DEF15.filter(function (x) { return !def(x[0]); });
    return h + '<div class="mfa"><b>🏅 বেইজ সম্পাদনা</b><div class="sm">আইকন, নাম ও রঙ বদলে 💾 চাপুন। 🗑 চাপলে বেইজটা সবার থেকে সরে যাবে (ইউজার ও তার অবস্থা/ফ্ল্যাগ যাবে না)।</div>' +
      DEFS.map(function (d) { return '<div class="bgr" data-bgrow="' + esc(d.id) + '"><input type="text" class="bge" maxlength="8" value="' + esc(d.emoji) + '" aria-label="আইকন"><input type="text" class="bgn" maxlength="30" value="' + esc(d.name) + '" aria-label="নাম"><input type="color" class="bgk" value="' + hex(d.color) + '" aria-label="রঙ"><button type="button" class="s" data-bga="save" data-id="' + esc(d.id) + '">💾</button><button type="button" class="d s" data-bga="del" data-id="' + esc(d.id) + '">🗑</button></div>'; }).join("") +
      '<div class="bgr" data-bgrow="__new"><input type="text" class="bge" maxlength="8" value="🏅" aria-label="আইকন"><input type="text" class="bgn" maxlength="30" placeholder="নতুন বেইজের নাম" aria-label="নাম"><input type="color" class="bgk" value="#2e7d4f" aria-label="রঙ"><button type="button" class="s" data-bga="save" data-id="">➕ যোগ</button></div>' +
      (miss.length ? '<div class="act"><button type="button" class="l s" data-bga="restore">↺ মুছে ফেলা ' + bd(miss.length) + "টি ডিফল্ট ফিরিয়ে আনুন</button></div>" : "") + "</div>";
  }
  // বাছা অনেকজনের জন্য একসাথে
  function bulkBar() {
    if (noSql || !DEFS.length) return "";
    return '<div class="act" style="margin-top:6px"><span class="sm">🏅 বাছাদের বেইজ:</span><select id="bgbs" style="width:auto;max-width:100%" aria-label="বেইজ">' + opts("") + '</select><button type="button" class="s" data-bga="bulk" data-on="1">➕ দিন</button><button type="button" class="l s" data-bga="bulk" data-on="0">➖ সরান</button></div>';
  }
  function apply(keys, id, on) {
    if (BUSY) return Promise.resolve(); BUSY = true;
    var seen = {}, L = keys.filter(function (k) { if (!k || seen[k]) return false; seen[k] = 1; return true; });
    var chunks = []; for (var i = 0; i < L.length; i += 2000) chunks.push(L.slice(i, i + 2000));
    return chunks.reduce(function (p, c) { return p.then(function () { return M.rpc("mc2_badge_set", { p_ks: c, p_id: id, p_on: on }); }); }, Promise.resolve())
      .then(function () { L.forEach(function (k) { var a = (MAP[k] || []).filter(function (b) { return b !== id; }); if (on) a.push(id); if (a.length) MAP[k] = a; else delete MAP[k]; }); BUSY = false; return L.length; })
      .catch(function (e) { BUSY = false; throw e; });
  }
  function repaint(full) { if (window.MCF && MCF.repaint) MCF.repaint(full); }

  // ---------- নামের পাশে ছোট বাটন (সব ইউজার-তালিকায় নিজে থেকে) ----------
  var STN = function () { return (window.MCFL && window.MCFL.N) || {}; };
  function markHtml(k) {
    var st = FLM[k] || "", ids = idsOf(k), n = ids.length + (st ? 1 : 0), em = (st ? (STN()[st] || "").split(" ")[0] : "") + ids.slice(0, 3).map(function (b) { return def(b).emoji; }).join("");
    return n ? em + " " + bd(n) + (n > 3 + (st ? 1 : 0) ? "" : "") : "🏅＋";
  }
  function refreshMarks() { var L = document.querySelectorAll("button.bgm"); for (var i = 0; i < L.length; i++) { var k = L[i].dataset.bgk, n = idsOf(k).length + (FLM[k] ? 1 : 0); L[i].innerHTML = markHtml(k); L[i].classList.toggle("has", n > 0); L[i].title = n ? bd(n) + "টি বেইজ — চাপলে দেখুন/বদলান" : "বেইজ দিন"; } applyG(); }
  function gmatch(k) { return !GF.ids.length || match(k, GF.ids.join(","), GF.mode); }
  function fab() { var f = document.getElementById("bgfab"); if (f) f.remove(); }   // (আগের ভাসমান বাটন আর নেই — ফিল্টার এখন প্রতিটা ইউজার-তালিকার ঠিক ওপরে)
  // প্রতিটা ইউজার-তালিকার (যেখানে নামের পাশে 🏅 আছে) ঠিক ওপরে নিজের ফিল্টার-বার; ফিল্টার সবখানে একই থাকে
  function gdesc() { return GF.ids.length ? desc(GF.ids.join(","), GF.mode) : ""; }
  function applyG() {
    var L = document.querySelectorAll("button.bgm"), seen = [], G = [], i, g;
    for (i = 0; i < L.length; i++) {
      var c = L[i].closest(".it,tr,.lw,li"); if (!c || seen.indexOf(c) >= 0) continue; seen.push(c);
      var an = c.tagName === "TR" ? c.closest("table") : c.parentElement; if (!an) continue;
      var okk = gmatch(L[i].dataset.bgk); c.style.display = okk ? "" : "none"; if (okk) c.removeAttribute("data-bgh"); else c.setAttribute("data-bgh", "1");
      for (g = 0; g < G.length && G[g].an !== an; g++); if (g === G.length) G.push({ an: an, t: 0, s: 0 }); G[g].t++; if (okk) G[g].s++;
    }
    var bars = document.querySelectorAll(".bgbar");
    for (i = 0; i < bars.length; i++) { var nx = bars[i].nextElementSibling, keep = false; for (g = 0; g < G.length; g++) if (G[g].an === nx) keep = true; if (!keep || noSql) bars[i].remove(); }
    if (noSql || !DEFS.length) return;
    for (g = 0; g < G.length; g++) {
      var a = G[g].an, bar = a.previousElementSibling; if (!bar || !bar.classList || !bar.classList.contains("bgbar")) { bar = document.createElement("div"); bar.className = "bgbar"; bar.dataset.nobg = "1"; a.parentNode.insertBefore(bar, a); }
      var h = '<button type="button" class="' + (GF.ids.length ? "" : "l ") + 's" data-bgg="open">🏅 বেইজ ফিল্টার' + (GF.ids.length ? " ✔" : " ▾") + "</button>" + (GF.ids.length ? '<span class="sm"><b>' + esc(gdesc()) + '</b></span><button type="button" class="l s" data-bgg="__clr">✖ মুছুন</button><span class="sm">দেখাচ্ছে ' + bd(G[g].s) + " / " + bd(G[g].t) + " জন</span>" : '<span class="sm">বেইজ দিয়ে এই তালিকা ছাঁটুন</span>');
      if (bar._h !== h) { bar._h = h; bar.innerHTML = h; }
    }
  }
  function mk(k, nm) { var b = document.createElement("button"); b.type = "button"; b.className = "bgm"; b.dataset.bgk = k; b.dataset.bgnm = nm || ""; b.dataset.bgd = "1"; return b; }
  function skip(el) { return !!(el.closest && el.closest(".mfr,#bgov,[data-nobg]")); }   // ভিজিটর ট্যাবসহ বাকি সব ট্যাবে বেইজ থাকে
  function decorate() {
    var A = document.querySelectorAll("[data-uu]:not([data-bgd]),b[data-dev]:not([data-bgd]),select[data-fls]:not([data-bgd])");
    if (!A.length) return; if (LOADED === null) { ensure().then(decorate); return; } if (noSql || !DEFS.length && noSql) return;
    for (var i = 0; i < A.length; i++) {
      var el = A[i]; el.setAttribute("data-bgd", "1"); if (skip(el)) continue;
      var sel = el.tagName === "SELECT", k = sel ? el.dataset.fls : (el.dataset.uu || el.dataset.dev ? "d:" + (el.dataset.uu || el.dataset.dev) : ""), nm = sel ? "" : String(el.textContent || "").trim();
      if (!k || (!sel && /^👤/.test(nm))) continue;
      var box = el.closest(".it,tr,.lw,.c,.row") || el.parentNode, dup = false, ex = box.querySelectorAll("button.bgm");
      for (var j = 0; j < ex.length; j++) if (ex[j].dataset.bgk === k) dup = true;
      if (dup) continue;
      var b = mk(k, nm); if (sel) el.parentNode.insertBefore(b, el); else el.insertAdjacentElement("afterend", b);
    }
    refreshMarks();
  }
  var tmr = 0, ob = new MutationObserver(function () { clearTimeout(tmr); tmr = setTimeout(decorate, 150); });
  var go = function () { ob.observe(document.body, { childList: true, subtree: true }); decorate(); };
  if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);

  // ---------- ড্রপডাউন-শিট ----------
  function sheet() {
    if (!POP) return;
    if (POP.g) {
      var oo = document.getElementById("bgov"); if (!oo) { oo = document.createElement("div"); oo.id = "bgov"; document.body.appendChild(oo); }
      var L0 = GF.ids, nn = L0.indexOf("none") >= 0;
      oo.innerHTML = '<div class="bgsh"><div class="bgh"><b>🏅 বেইজ দিয়ে ফিল্টার — সব তালিকায়</b><button type="button" class="l s" data-bgx="1">✖ বন্ধ</button></div><div class="sm">একটা তালিকায় বাছলে ইউজার-তালিকা আছে এমন সব ট্যাবে একই ফিল্টার চলে। পেজে যতটুকু আঁকা আছে তার ভেতর থেকে লুকায়/দেখায়; ফোল্ডার পেজে পুরো তালিকায় চলে।</div><div>' +
        DEFS.map(function (d) { var on = L0.indexOf(d.id) >= 0, c = hex(d.color); return '<button type="button" class="bgt' + (on ? " on" : "") + '" style="' + (on ? "background:" + c : "border-color:" + c) + '" data-bgg="' + esc(d.id) + '">' + (on ? "✓ " : "") + esc(d.emoji + " " + d.name) + "</button>"; }).join("") +
        '<button type="button" class="bgt' + (nn ? " on" : "") + '" style="' + (nn ? "background:#6b7280" : "") + '" data-bgg="none">' + (nn ? "✓ " : "") + "— কোনো বেইজ নেই</button></div>" +
        (L0.length > 1 && !nn ? '<label>মিল:<select data-bgm="1" style="width:auto"><option value="all"' + (GF.mode !== "any" ? " selected" : "") + '>সবগুলো আছে (এবং)</option><option value="any"' + (GF.mode === "any" ? " selected" : "") + ">যেকোনো একটা আছে (অথবা)</option></select></label>" : "") +
        '<div class="act"><button type="button" class="l s" data-bgg="__clr">✖ ফিল্টার মুছুন</button><button type="button" class="s" data-bgx="1">✔ ঠিক আছে</button></div></div>';
      return;
    }
    var k = POP.k, cur = MAP[k] || [], st = FLM[k] || "", MCFL = window.MCFL, N = STN(), miss = DEF15.filter(function (x) { return !def(x[0]); });
    var given = (st ? ['<span class="tag">' + esc(N[st] || st) + "</span>"] : []).concat(idsOf(k).map(function (b) { return chip(def(b)); })), tot = given.length;
    var edRow = function (id, d) { return '<div class="bgr" data-bgrow="' + esc(id) + '"><input type="text" class="bge" maxlength="8" value="' + esc(d.emoji) + '" aria-label="আইকন"><input type="text" class="bgn" maxlength="30" value="' + esc(d.name) + '" placeholder="নতুন বেইজের নাম" aria-label="নাম"><input type="color" class="bgk" value="' + hex(d.color) + '" aria-label="রঙ"><button type="button" class="s" data-bga="save" data-id="' + (id === "__new" ? "" : esc(id)) + '">' + (id === "__new" ? "➕ যোগ" : "💾") + '</button><button type="button" class="l s" data-bga="ecancel">✖</button></div>'; };
    var h = '<div class="bgsh"><div class="bgh"><b>🏅 বেইজ' + (POP.nm ? " — " + esc(POP.nm) : "") + '</b><button type="button" class="l s" data-bgx="1">✖ বন্ধ</button></div>' +
      '<div><b>' + bd(tot) + "টি বেইজ দেওয়া আছে</b><div>" + (tot ? given.join(" ") : '<span class="sm">এখনো কোনো বেইজ দেওয়া হয়নি।</span>') + "</div></div>" +
      (MCFL ? '<div><span class="sm">অবস্থা (একটাই; সবার আগে দেখায়, সব জায়গায় একই বদলায়):</span><div style="margin-top:4px">' + MCFL.list.map(function (o) { return '<button type="button" class="bgt' + (st === o[0] ? " on" : "") + '" data-bgs="' + o[0] + '" data-k="' + esc(k) + '"' + (st === o[0] ? ' style="background:var(--g)"' : "") + ">" + (st === o[0] ? "✓ " : "") + esc(o[1]) + "</button>"; }).join("") + "</div></div>" : "") +
      '<div><span class="sm">বেইজ বাছুন — যতগুলো খুশি; চাপলেই সেভ:</span><div style="margin-top:4px">' +
      (DEFS.length ? DEFS.map(function (d) {
        if (POP.ed === d.id) return edRow(d.id, d); var on = cur.indexOf(d.id) >= 0, c = hex(d.color);
        return '<div class="bgr"><button type="button" class="bgt' + (on ? " on" : "") + '" style="margin:0;flex:1 1 auto;text-align:left;' + (on ? "background:" + c : "border-color:" + c) + '" data-bgt="' + esc(d.id) + '" data-k="' + esc(k) + '">' + (on ? "✓ " : "☐ ") + esc(d.emoji + " " + d.name) + '</button><button type="button" class="l s" data-bga="edit" data-id="' + esc(d.id) + '" aria-label="বদলান">✏️</button><button type="button" class="d s" data-bga="del" data-id="' + esc(d.id) + '" aria-label="মুছুন">🗑</button></div>';
      }).join("") : '<span class="sm">কোনো বেইজ নেই — নিচ থেকে বানান।</span>') +
      (POP.ed === "__new" ? edRow("__new", { emoji: "🏅", name: "", color: "#2e7d4f" }) : '<div class="act" style="margin-top:6px"><button type="button" class="l s" data-bga="new">➕ নতুন বেইজ বানান</button>' + (miss.length ? '<button type="button" class="l s" data-bga="restore">↺ মুছে ফেলা ' + bd(miss.length) + "টি ডিফল্ট ফেরান</button>" : "") + "</div>") + "</div></div></div>";
    var o = document.getElementById("bgov"); if (!o) { o = document.createElement("div"); o.id = "bgov"; document.body.appendChild(o); } o.innerHTML = h;
  }
  function openPop(k, nm) { POP = { k: k, nm: nm || "", ed: null }; ensure().then(function () { if (noSql) { alert("বেইজের টেবিল নেই। Supabase SQL Editor-এ supabase-new-20261025.sql একবার চালান।"); POP = null; return; } sheet(); }); }
  function closePop() { POP = null; var o = document.getElementById("bgov"); if (o) o.remove(); refreshMarks(); repaint(); }
  function after() { return load().then(function () { sheet(); repaint(true); }); }
  function nameFor(el) { var m = el.closest(".mfb"); var n = m && m.querySelector(".lk,b"); return n ? String(n.textContent).trim() : (el.dataset.bgnm || ""); }

  document.addEventListener("click", function (e) {
    var t = e.target, m = t.closest && t.closest("button.bgm"), o = t.closest && t.closest("[data-bgo]"), x = t.closest && t.closest("[data-bgx]"), g = t.closest && t.closest("[data-bgg]"), s = t.closest && t.closest("[data-bgs]"), b = t.closest && t.closest("[data-bgt]"), a = t.closest && t.closest("[data-bga]");
    if (!(m || o || x || g || s || b || a) && t.id !== "bgov") return;
    e.stopPropagation(); e.preventDefault();
    if (t.id === "bgov" || x) return closePop();
    if (g) {
      var gi = g.dataset.bgg;
      if (gi === "open") { POP = { g: true }; return ensure().then(sheet); }
      if (gi === "__clr") GF.ids = []; else if (gi === "none") GF.ids = GF.ids.indexOf("none") >= 0 ? [] : ["none"]; else { GF.ids = GF.ids.filter(function (x) { return x !== "none"; }); var gx = GF.ids.indexOf(gi); if (gx >= 0) GF.ids.splice(gx, 1); else GF.ids.push(gi); }
      sheet(); applyG(); return repaint();
    }
    if (m) return openPop(m.dataset.bgk, m.dataset.bgnm);
    if (o) return openPop(o.dataset.bgo, nameFor(o));
    if (s) { var sk = s.dataset.k, sv = FLM[sk] === s.dataset.bgs ? "" : s.dataset.bgs; s.disabled = true; return window.MCFL.set([sk], sv).then(function () { if (sv) FLM[sk] = sv; else delete FLM[sk]; sheet(); refreshMarks(); }).catch(function (er) { s.disabled = false; fail(er); }); }
    if (b) { var k = b.dataset.k, id = b.dataset.bgt, on = (MAP[k] || []).indexOf(id) < 0; b.disabled = true; return apply([k], id, on).then(function () { if (POP) sheet(); refreshMarks(); repaint(); }).catch(function (er) { b.disabled = false; fail(er); }); }
    var act = a.dataset.bga;
    if (act === "mgr") { mgr = !mgr; return repaint(true); }
    if (act === "edit") { POP.ed = a.dataset.id; return sheet(); }
    if (act === "new") { POP.ed = "__new"; return sheet(); }
    if (act === "ecancel") { POP.ed = null; return sheet(); }
    if (act === "save") {
      var row = a.closest("[data-bgrow]"), nm = row.querySelector(".bgn").value.trim(), em = row.querySelector(".bge").value.trim() || "🏅", co = row.querySelector(".bgk").value;
      if (!nm) return alert("বেইজের নাম লিখুন।");
      a.disabled = true; if (POP) POP.ed = null;
      return M.rpc("mc2_badge_def_save", { p_id: a.dataset.id || null, p_name: nm, p_emoji: em, p_color: co }).then(after).catch(function (er) { a.disabled = false; fail(er); });
    }
    if (act === "del") {
      var d = def(a.dataset.id); if (!d) return; var n = Object.keys(MAP).filter(function (k2) { return MAP[k2].indexOf(d.id) >= 0; }).length;
      if (!confirm('বেইজ "' + d.emoji + " " + d.name + '" মুছবেন?\n' + bd(n) + " জনের থেকে এটা সরে যাবে। ইউজার বা তাদের অবস্থা (ভেরিফাইড ইত্যাদি) মুছবে না।")) return;
      a.disabled = true;
      return M.rpc("mc2_badge_def_del", { p_id: d.id }).then(after).catch(function (er) { a.disabled = false; fail(er); });
    }
    if (act === "restore") {
      var ms = DEF15.filter(function (x) { return !def(x[0]); }); a.disabled = true;
      return ms.reduce(function (p, x) { return p.then(function () { return M.rpc("mc2_badge_def_save", { p_id: x[0], p_name: x[2], p_emoji: x[1], p_color: x[3] }); }); }, Promise.resolve()).then(after).catch(function (er) { a.disabled = false; fail(er); });
    }
    if (act === "bulk") {
      var keys = window.MCF && MCF.selKeys ? MCF.selKeys() : [], sl = document.getElementById("bgbs"), bid = sl && sl.value, on2 = a.dataset.on === "1";
      if (!keys.length) return alert("আগে নিচের তালিকা থেকে ইউজার বাছুন।"); if (!bid) return;
      a.disabled = true;
      return apply(keys, bid, on2).then(function (c) { a.disabled = false; refreshMarks(); repaint(); alert("✅ " + bd(c) + " জনের " + (on2 ? "বেইজ দেওয়া" : "বেইজ সরানো") + " হয়েছে।"); }).catch(function (er) { a.disabled = false; fail(er); });
    }
  }, true);

  // ফোল্ডার-ফিল্টার: একাধিক বেইজ বাছা; "সবগুলো আছে" (all) বা "যেকোনো একটা আছে" (any); "none" = কোনো বেইজ নেই
  function ids2(str) { return String(str || "").split(",").filter(Boolean); }
  function match(k, str, mode) {
    var L = ids2(str); if (!L.length) return true; if (L.indexOf("none") >= 0) return !idsOf(k).length;
    var mine = MAP[k] || []; return mode === "any" ? L.some(function (x) { return mine.indexOf(x) >= 0; }) : L.every(function (x) { return mine.indexOf(x) >= 0; });
  }
  function filterUi(str, mode) {
    var L = ids2(str), none = L.indexOf("none") >= 0;
    return '<div style="grid-column:1/-1;width:100%"><span class="sm">🏅 বেইজ দিয়ে ফিল্টার (একাধিক বাছুন):</span><div style="margin-top:4px">' +
      DEFS.map(function (d) { var on = L.indexOf(d.id) >= 0, c = hex(d.color); return '<button type="button" class="bgt' + (on ? " on" : "") + '" style="' + (on ? "background:" + c : "border-color:" + c) + '" data-a="bgf" data-id="' + esc(d.id) + '">' + (on ? "✓ " : "") + esc(d.emoji + " " + d.name) + "</button>"; }).join("") +
      '<button type="button" class="bgt' + (none ? " on" : "") + '" style="' + (none ? "background:#6b7280" : "") + '" data-a="bgf" data-id="none">' + (none ? "✓ " : "") + "— কোনো বেইজ নেই</button></div>" +
      (L.length > 1 && !none ? '<label>মিল:<select data-f="bgm" style="width:auto"><option value="all"' + (mode !== "any" ? " selected" : "") + '>সবগুলো আছে (এবং)</option><option value="any"' + (mode === "any" ? " selected" : "") + ">যেকোনো একটা আছে (অথবা)</option></select></label>" : "") +
      (L.length ? '<button type="button" class="l s" data-a="bgf" data-id="__clr" style="margin-left:6px">✖ বেইজ ফিল্টার মুছুন</button>' : "") + "</div>";
  }
  function desc(str, mode) {
    var L = ids2(str); if (L.indexOf("none") >= 0) return "বেইজ নেই";
    var n = L.map(function (x) { var d = def(x); return d ? d.name : ""; }).filter(Boolean); return "বেইজ: " + n.join(mode === "any" ? " অথবা " : " + ");
  }
  document.addEventListener("change", function (e) { var t = e.target; if (t && t.matches && t.matches("select[data-bgm]")) { GF.mode = t.value; applyG(); repaint(); } });
  window.MCBG = { gmatch: gmatch, match: match, filterUi: filterUi, desc: desc, load: load, chips: chips, panel: function () { return ""; }, mgrBar: mgrBar, bulkBar: bulkBar, has: has, names: names, opts: opts, isOpen: function () { return false; }, count: function () { return DEFS.length; }, ok: function () { return !noSql; }, open: openPop };
})();

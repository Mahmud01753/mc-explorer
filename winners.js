// পাবলিক সাইট: "🏅 বিজয়ীদের তালিকা" — সাপ্তাহিক/মাসিক বিজয়ী ঘোষণা (ঠিকানা #winners)। অ্যাডমিন থেকে অফ করলে বাটন ও পেজ কিছুই আসে না।
// ঐচ্ছিক ফাইল (না থাকলে সাইট চলে)। SQL: supabase-new-20261017.sql (mc2_draws_public)। index.html-এ app.js-এর পরে লোড হয়।
(function () {
  var C = window.MC_CFG || {}, base = String(C.url || "").replace(/\/$/, "");
  if (!base || !C.key) return;
  var KN = { week: "সাপ্তাহিক", month: "মাসিক", custom: "বিশেষ" }, ROWS = [], ON = false, MORE = true, OFF = 0, LIM = 100, ready = false;
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var dfmt = function (s) { try { return new Date(s + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return s; } };
  var deptL = function (d) { try { return window.MC && window.MC.deptLabel ? window.MC.deptLabel(d) : d; } catch (e) { return d; } };
  function get(off) {
    return fetch(base + "/rest/v1/rpc/mc2_draws_public", { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, body: JSON.stringify({ p_limit: LIM, p_offset: off }) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); });
  }
  var css = ".wnb{display:flex;align-items:center;gap:12px;width:calc(100% - 24px);margin:4px 12px;padding:11px 14px;border:0;border-radius:20px;text-align:left;cursor:pointer;font-family:inherit;color:#fff;background:linear-gradient(115deg,#1d6b43,#2f9b63)}.wnb b{display:block;font-size:15px}.wnb small{opacity:.9;font-size:12.5px}.wnb i{font-style:normal;font-size:24px}" +
    "#wnx{position:fixed;inset:0;z-index:60;background:var(--bg,#f4f7f2);color:var(--fg,#10261b);overflow:auto;font-family:'MCDigits','Hind Siliguri','Noto Sans Bengali','Nirmala UI','Bangla Sangam MN','Kalpurush','Siyam Rupali',system-ui,sans-serif;padding:0 0 40px}@media(prefers-color-scheme:dark){#wnx{background:#0f1a14;color:#e8f1ea}}" +
    "#wnx .h{position:sticky;top:0;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#1d6b43;color:#fff;font-weight:700;font-size:17px;z-index:2}#wnx .h button{border:0;background:#ffffff33;color:#fff;border-radius:10px;font-size:16px;padding:4px 11px;cursor:pointer}" +
    "#wnx .w{max-width:640px;margin:0 auto;padding:12px}#wnx .k{background:#fff;color:#10261b;border:1px solid #d5e0d8;border-radius:16px;padding:14px;margin-bottom:12px}@media(prefers-color-scheme:dark){#wnx .k{background:#17261d;color:#e8f1ea;border-color:#2a3f32}}" +
    "#wnx .t{font-weight:800;font-size:17px;margin:4px 0}#wnx .m{font-size:12.5px;color:#5a6b61}#wnx .g{display:inline-block;font-size:12px;background:#ffe9a8;color:#5a3a00;border-radius:999px;padding:1px 9px;margin-right:4px;font-weight:700}" +
    "#wnx .p{margin:6px 0 8px;white-space:pre-wrap;overflow-wrap:anywhere}#wnx .r{display:flex;gap:8px;align-items:baseline;padding:6px 0;border-top:1px dashed #c9d6cd;overflow-wrap:anywhere}#wnx .r b{min-width:26px;color:#d98200}#wnx .r span{font-size:12px;color:#5a6b61}#wnx .mb{display:block;margin:6px auto;border:1px solid #1d6b43;background:none;color:#1d6b43;border-radius:12px;padding:9px 18px;font:700 15px inherit;cursor:pointer}" +
    "#wnx .un{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;text-align:center;font-weight:700;font-size:13.5px;color:#a85a00;background:#fff3d1;border:1px solid #ffd98a;border-radius:12px;padding:8px 10px;margin:0 0 10px}@media(prefers-color-scheme:dark){#wnx .un{background:#3a2c0a;color:#ffd98a;border-color:#6b5217}}" +
    ".pz .pzk{display:block;overflow:hidden;align-self:stretch;min-width:0}.pz .pzk .wni>span{font-size:12.5px;font-weight:600;padding-right:2.5em}";
  var CSS2 = ".wns{display:flex;align-items:center;gap:10px;width:calc(100% - 24px);margin:4px 12px;padding:9px 12px;border:1px solid #cfe0d4;border-radius:16px;background:#e7f4ec;color:#10261b;text-align:left;font-family:inherit;cursor:pointer}.wns i{font-style:normal;font-size:20px}.wns span{min-width:0;flex:1}.wns b{display:block;font-size:14px}.wns small{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#3d5a49}.wns.mo{justify-content:center;background:none;font-weight:700;color:#1d6b43}@media(prefers-color-scheme:dark){.wns{background:#17261d;border-color:#2a3f32;color:#e8f1ea}.wns small{color:#b6cdbd}.wns.mo{background:none;color:#7fd3a2}}";
  CSS2 += ".wns.wnt{display:block;padding:2px;margin:2px 12px;border-radius:8px;line-height:1.25}.wnk{display:block;overflow:hidden;white-space:nowrap}.wni{display:inline-flex;white-space:nowrap;animation:wnmq 20s linear infinite;will-change:transform}.wni>span{flex:none;padding-right:3em;font-size:13px;font-weight:700;line-height:1.25}@keyframes wnmq{to{transform:translateX(-50%)}}.wns.wnt{display:flex;align-items:center;gap:8px;padding:4px 4px 4px 8px;margin:4px 12px;border-radius:12px;border:1px solid #9fd0b3;box-shadow:0 1px 0 #b9d9c6}.wns.wnt .wnk{flex:1;min-width:0}.wnq{flex:none;display:inline-flex;align-items:center;gap:3px;background:linear-gradient(#ee4636,#c5221f);color:#fff;font-size:11.5px;font-weight:800;line-height:1.2;padding:5px 11px 6px;border-radius:999px;box-shadow:0 1px 0 #8f1d15;white-space:nowrap;animation:wnqp 1.8s ease-in-out infinite}.wns.wnt:active{transform:translateY(1px)}@keyframes wnqp{0%,100%{box-shadow:0 1px 0 #8f1d15,0 0 0 0 #ee463666}50%{box-shadow:0 1px 0 #8f1d15,0 0 0 5px #ee463600}}@media(prefers-color-scheme:dark){.wns.wnt{border-color:#2f5a42;box-shadow:none}}@media(prefers-reduced-motion:reduce){.wnq{animation:none}}@media(prefers-reduced-motion:reduce){.wni{animation:none}.wnk{overflow:auto}}";
  function style() { if (document.getElementById("wnst")) return; var s = document.createElement("style"); s.id = "wnst"; s.textContent = css + CSS2; document.head.appendChild(s); }
  function card(r) {
    return '<div class="k"><span class="g">' + (KN[r.kind] || "") + '</span><span class="m">' + E(dfmt(r.draw_date)) + '</span><div class="t">🏆 ' + E(r.title) + "</div>" + (r.descr ? '<div class="p">' + E(r.descr) + "</div>" : "") +
      (r.winners || []).map(function (w, i) { var s = [w.dept ? deptL(w.dept) : "", w.batch].filter(Boolean).join(" · "); return '<div class="r"><b>' + bd(i + 1) + ".</b><div>" + E(w.name) + (s ? "<br><span>" + E(s) + "</span>" : "") + "</div></div>"; }).join("") + "</div>";
  }
  // ---- বিজয়ী শিট: ড্রপডাউন + ১-২-৩ কার্ড + ৪ থেকে পেজ ----
  var SELID = null, PG = 0, MENU = false, PER = 10;
  var CSS3 = "#wnx .dd{position:relative;margin:4px 0 12px}#wnx .dd>button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:2px solid #1d6b43;border-radius:14px;background:#fff;color:#10261b;padding:10px 12px;font:700 15px inherit;cursor:pointer;text-align:left}" +
    "#wnx .dm{position:absolute;z-index:5;left:0;right:0;top:100%;margin-top:4px;background:#fff;color:#10261b;border:2px solid #1d6b43;border-radius:14px;max-height:360px;overflow:auto;box-shadow:0 10px 28px #0004}#wnx .dm .gh{background:#e6f1ea;color:#1d6b43;font-size:12px;font-weight:700;padding:6px 12px}" +
    "#wnx .dm button{display:flex;width:100%;justify-content:space-between;gap:8px;border:0;border-bottom:1px solid #e3eae5;background:none;color:inherit;padding:10px 12px;font:600 14px inherit;cursor:pointer;text-align:left}#wnx .dm button.on{color:#1d6b43}#wnx .dm small{color:#5a6b61;white-space:nowrap}" +
    "#wnx .pod{display:flex;align-items:flex-end;gap:6px;margin:6px 0 12px}#wnx .pc{flex:1 1 0;min-width:0;background:#fff;color:#10261b;border:2px solid #cfd8d3;border-radius:14px;padding:8px 5px 6px;text-align:center}#wnx .pc.p1{border-color:#ffd84a;padding-top:12px}#wnx .pc.p3{border-color:#d98a4a}" +
    "#wnx .pc{cursor:pointer;-webkit-tap-highlight-color:transparent}#wnx .pc:active{transform:scale(.97)}#wnx .pc .cd{display:block;margin-top:4px;font-size:11px;font-weight:700;color:#1d6b43}#wnx .rw{cursor:pointer;align-items:center}#wnx .rw .cd{flex:none;display:inline-block;margin:0;font-size:12px;font-weight:700;color:#1d6b43;border:1px solid #1d6b43;border-radius:999px;padding:3px 9px;white-space:nowrap;background:none;font-family:inherit}#wnx .rw .cd:active{background:#e6f1ea}#wnx .dm .mpg{position:sticky;bottom:0;background:inherit;border-top:1px solid #cfe0d4;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:8px}#wnx .dm .mpg button{width:auto;display:inline-block;border:1px solid #cfd8d3;border-radius:10px;padding:5px 10px;font:700 13px inherit}#wnx .dm .mpg button.on{background:#1d6b43;border-color:#1d6b43;color:#fff}.wnr .it .cd{display:block;font-size:12px;font-weight:700;color:#1d6b43;cursor:pointer;margin-top:1px}#wnx .pgi{text-align:center;font-size:12.5px;color:#5a6b61;margin-top:10px}#wnx .pc .av{width:44px;height:44px;border-radius:50%;margin:0 auto 3px;display:grid;place-items:center;font-weight:800;font-size:19px;color:#1d6b43;background:#f4f7f2;border:3px solid #cfd8d3}#wnx .p1 .av{width:56px;height:56px;font-size:23px;border-color:#ffd84a}#wnx .p3 .av{border-color:#d98a4a}" +
    "#wnx .pc b{display:block;font-size:13.5px;overflow-wrap:anywhere}#wnx .pc small{display:block;font-size:11px;color:#5a6b61}#wnx .pc .sc{color:#d98200;font-weight:800;font-size:14px}" +
    "#wnx .pl{margin:6px auto 0;border-radius:8px;padding:7px 2px 6px;color:#3a3a3a;font-size:10px;font-weight:700;background:linear-gradient(#f2f4f6,#aab1b8)}#wnx .p1 .pl{background:linear-gradient(#ffe27a,#d9a800)}#wnx .p3 .pl{background:linear-gradient(#f0b98a,#b8743c)}#wnx .pl i{display:block;font-style:normal;letter-spacing:.3px}#wnx .pl .ri{width:38px;height:38px;border-radius:50%;margin:5px auto 2px;border:3px solid #ffffffa0;display:grid;place-items:center;font-size:15px;font-weight:800}#wnx .pl u{text-decoration:none;font-size:9px}" +
    "#wnx .rw{display:flex;gap:10px;align-items:baseline;padding:9px 2px;border-bottom:1px dashed #c9d6cd}#wnx .rw>b{min-width:26px;color:#d98200}#wnx .rw>div{flex:1;min-width:0;overflow-wrap:anywhere}#wnx .rw span{font-size:12px;color:#5a6b61}#wnx .rw em{font-style:normal;font-size:12px;font-weight:700;background:#ffe9a8;color:#5a3a00;border-radius:999px;padding:1px 9px}" +
    "#wnx .pg{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-top:12px}#wnx .pg button{font:700 14px inherit;min-width:38px;padding:6px 12px;border:1px solid #cfd8d3;border-radius:10px;background:#fff;color:#10261b;cursor:pointer}#wnx .pg button.on{background:#1d6b43;border-color:#1d6b43;color:#fff}" +
    ".wnr{margin:8px 12px;padding:12px 14px;border:1px solid #cfe0d4;border-radius:18px;background:#fff;color:#10261b}.wnr .hd{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}.wnr .hd b{font-size:16px}.wnr .hd button{border:0;background:none;color:#1d6b43;font:700 13px inherit;cursor:pointer}" +
    ".wnr .it{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px dashed #c9d6cd}.wnr .it>b{min-width:20px;color:#d98200}.wnr .it>div{flex:1;min-width:0}.wnr .it span{display:block;font-size:12px;color:#5a6b61}.wnr .it em{font-style:normal;font-size:11.5px;font-weight:700;background:#ffe9a8;color:#5a3a00;border-radius:999px;padding:1px 9px;white-space:nowrap}" +
    "@media(prefers-color-scheme:dark){#wnx .dd>button,#wnx .dm,#wnx .pc,#wnx .pg button,.wnr{background:#17261d;color:#e8f1ea;border-color:#2a3f32}#wnx .dm .gh{background:#1f3a2b;color:#7fd3a2}#wnx .dm button{border-color:#2a3f32}#wnx .pc .cd,#wnx .rw .cd,.wnr .it .cd{color:#7fd3a2}#wnx .pgi{color:#b6cdbd}#wnx .pc small,#wnx .rw span,.wnr .it span,#wnx .dm small{color:#b6cdbd}#wnx .pc .av{background:#0f1a14;color:#7fd3a2}}";
  function sty3() { if (document.getElementById("wnst3")) return; var s = document.createElement("style"); s.id = "wnst3"; s.textContent = CSS3; document.head.appendChild(s); }
  var sdate = function (s) { try { return bd(new Date(s + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "short" })); } catch (e) { return s; } };
  var pctOf = function (w) { var n = +w.score; return n > 0 ? Math.min(100, Math.round(n / 10)) : null; };
  function groups() {
    var wk = ROWS.filter(function (r) { return r.kind === "week"; }), mo = ROWS.filter(function (r) { return r.kind !== "week"; });
    var g = [["সাপ্তাহিক", wk.slice(0, 6)], ["মাসিক / বিশেষ", mo], ["পুরোনো", wk.slice(6)]]; return g.filter(function (x) { return x[1].length; });
  }
  var MP = 0, MPER = 10;
  function flat() { var o = []; groups().forEach(function (g) { g[1].forEach(function (x) { o.push({ g: g[0], x: x }); }); }); return o; }
  function selRow() { var r = ROWS.filter(function (x) { return String(x.id) === String(SELID); })[0]; return r || ROWS[0]; }
  function pod(ws) {
    var cls = ["p2", "p1", "p3"], tl = ["SILVER", "WINNER", "BRONZE"], ord = ws.length >= 3 ? [1, 0, 2] : ws.length === 2 ? [1, 0] : [0];
    return '<div class="pod">' + ord.map(function (ix) {
      var w = ws[ix], c = ix === 0 ? "p1" : ix === 1 ? "p2" : "p3", t = ix === 0 ? "WINNER" : ix === 1 ? "SILVER" : "BRONZE", pc = pctOf(w), s = [w.dept ? deptL(w.dept) : "", w.batch].filter(Boolean).join(" · ");
      return '<div class="pc ' + c + '" data-pi="' + ix + '" role="button" tabindex="0">' + (ix === 0 ? '<div style="font-size:18px;line-height:1">👑</div>' : "") + '<div class="av">' + E([].concat(Array.from(String(w.name || "M")))[0]) + "</div><b>" + E(w.name) + "</b>" + (s ? "<small>" + E(s) + "</small>" : "") + (w.score ? '<div class="sc">' + bd(w.score) + "</div>" : "") +
        (pc != null ? '<div class="pl"><i>★ ' + t + ' ★</i><div class="ri">' + bd(pc) + "</div><u>শতাংশ জানি</u></div>" : "") + '<span class="cd">🪪 কার্ড দেখুন</span></div>';
    }).join("") + "</div>";
  }
  // শীর্ষ ৩ জনের কার্ড: ক্লিকে কার্ড থাকলে বড় করে খোলে (cards.js-এর mcPeek), না থাকলে "কার্ড নাই"
  var PKB = 0;
  function toast(t) {
    var x = document.getElementById("wntt");
    if (!x) { x = document.createElement("div"); x.id = "wntt"; x.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:130;max-width:86%;background:#10261b;color:#fff;border-radius:14px;padding:10px 18px;font:700 14.5px/1.4 inherit;text-align:center;box-shadow:0 8px 24px #0006"; document.body.appendChild(x); }
    x.textContent = t; x.style.display = "block"; clearTimeout(x._t); x._t = setTimeout(function () { x.style.display = "none"; }, 2600);
  }
  // বিজয়ীর cv (অ্যাডমিনের কার্ড-বাছাই) ও pd (বিজয়ী কার্ডের ডিজাইন-নম্বর) cards.js-এ যায়; বিজয়ী কার্ড ফোনেই আঁকা হয়, সার্ভার থেকে কোনো ছবি আসে না
  function peek(w, b, did) {
    if (PKB || !w) return;
    if (!window.mcPeek) { toast("কার্ড নাই"); return; }
    if ((window.mcWinOK || window.mcPeekOK) && !(window.mcWinOK || window.mcPeekOK)()) { toast("কার্ড দেখা এখন বন্ধ আছে"); return; }
    var s = b.classList && b.classList.contains("cd") ? b : b.querySelector(".cd"); PKB = 1; if (s) s.textContent = "⏳ আনছি…";
    window.mcPeek(w.name, w.dept || "", w.batch || "", "w", { cv: w.cv || "", cs: w.cs || null, pd: w.pd == null ? null : w.pd, did: did, name: w.name, dept: w.dept || "", batch: w.batch || "", rank: w.rank || null, score: w.score == null ? null : w.score }).then(function (m) { PKB = 0; if (s) s.textContent = "🪪 কার্ড দেখুন"; if (m) toast(/জমা নেই/.test(m) ? "কার্ড নাই" : m); })
      .catch(function () { PKB = 0; if (s) s.textContent = "🪪 কার্ড দেখুন"; toast("কার্ড আনা যায়নি"); });
  }
  function open() {
    if (!ON) return; style(); sty3(); var el = document.getElementById("wnx"); if (!el) { el = document.createElement("div"); el.id = "wnx"; document.body.appendChild(el); }
    var r = selRow(); if (!r) return; SELID = r.id; var ws = r.winners || [], rest = ws.slice(3), pages = Math.max(1, Math.ceil(rest.length / PER)); if (PG > pages - 1) PG = pages - 1;
    var fl = flat(), mpn = Math.max(1, Math.ceil(fl.length / MPER)); if (MP > mpn - 1) MP = mpn - 1; var lastG = "";
    var mpg = mpn > 1 ? '<div class="mpg">' + (MP > 0 ? '<button type="button" data-mp="' + (MP - 1) + '">‹</button>' : "") + Array.apply(null, Array(mpn)).map(function (_, k) { return '<button type="button" data-mp="' + k + '"' + (k === MP ? ' class="on"' : "") + ">" + bd(k * MPER + 1) + "–" + bd(Math.min((k + 1) * MPER, fl.length)) + "</button>"; }).join("") + (MP < mpn - 1 ? '<button type="button" data-mp="' + (MP + 1) + '">›</button>' : "") + "</div>" : "";
    var menu = MENU ? '<div class="dm">' + fl.slice(MP * MPER, MP * MPER + MPER).map(function (it) { var x = it.x, h = it.g !== lastG ? '<div class="gh">' + it.g + "</div>" : ""; lastG = it.g; return h + '<button type="button" data-id="' + x.id + '"' + (String(x.id) === String(SELID) ? ' class="on"' : "") + "><span>" + E(x.title) + (String(x.id) === String(SELID) ? " ✓" : "") + "</span><small>" + bd((x.winners || []).length) + " জন</small></button>"; }).join("") + mpg + "</div>" : "";
    var nums = []; for (var i = Math.max(0, Math.min(PG - 1, pages - 4)); i < Math.min(pages, Math.max(0, Math.min(PG - 1, pages - 4)) + 4); i++) nums.push(i);
    var pg = pages > 1 ? '<div class="pg">' + (PG > 0 ? '<button type="button" data-pg="' + (PG - 1) + '">‹</button>' : "") + nums.map(function (i) { return '<button type="button" data-pg="' + i + '"' + (i === PG ? ' class="on"' : "") + ">" + bd(i + 1) + "</button>"; }).join("") + (PG < pages - 1 ? '<button type="button" data-pg="' + (PG + 1) + '">নেক্সট ›</button>' : "") + "</div>" : "";
    el.innerHTML = '<div class="h"><button type="button" id="wnc" aria-label="বন্ধ">←</button>🏅 বিজয়ীদের তালিকা</div><div class="w"><div class="pzu">পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন<b class="pzc" role="link" tabindex="0">এখানে ক্লিক ›</b></div><div class="dd"><button type="button" id="wnd">📅 ' + E(r.title) + " · " + E(sdate(r.draw_date)) + " · " + bd(ws.length) + ' জন<span>▾</span></button>' + menu + "</div>" +
      pod(ws.slice(0, 3)) + rest.slice(PG * PER, PG * PER + PER).map(function (w, i) { var s = [w.dept ? deptL(w.dept) : "", w.batch].filter(Boolean).join(" · "); return '<div class="rw" data-ri="' + (3 + PG * PER + i) + '"><b>' + bd(4 + PG * PER + i) + "</b><div>" + E(w.name) + (s ? " <span>" + E(s) + "</span>" : "") + '</div><button type="button" class="cd" data-cd="' + (3 + PG * PER + i) + '">🪪 কার্ড দেখুন</button>' + (w.score ? "<em>" + bd(w.score) + "</em>" : "") + "</div>"; }).join("") + (pages > 1 ? '<div class="pgi">' + bd(4 + PG * PER) + "–" + bd(Math.min(3 + PG * PER + PER, ws.length)) + " নং · মোট " + bd(ws.length) + " জন · পেজ " + bd(PG + 1) + "/" + bd(pages) + "</div>" : "") + pg + "</div>";
    el.querySelectorAll("[data-ri]").forEach(function (b) { b.onclick = function (ev) { var x = ws[+b.dataset.ri]; if (!x) return; if (ev.target.closest && ev.target.closest(".cd")) { ev.stopPropagation(); peek(x, ev.target.closest(".cd"), r.id); return; } if (window.mcOpenRankHist) window.mcOpenRankHist(x.name, x.dept || "", x.batch || ""); else peek(x, b.querySelector(".cd"), r.id); }; });
    el.querySelectorAll("[data-pi]").forEach(function (b) { b.onclick = function () { peek(ws[+b.dataset.pi], b, r.id); }; b.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); peek(ws[+b.dataset.pi], b, r.id); } }; });
    el.querySelector("#wnc").onclick = function () { if (location.hash === "#winners") location.hash = "home"; else close(); };
    el.querySelector("#wnd").onclick = function () { MENU = !MENU; if (MENU) { var ix = flat().map(function (o) { return String(o.x.id); }).indexOf(String(SELID)); MP = ix > 0 ? Math.floor(ix / MPER) : 0; } open(); };
    el.querySelectorAll("[data-mp]").forEach(function (b) { b.onclick = function (ev) { ev.stopPropagation(); MP = +b.dataset.mp; open(); }; });
    el.querySelectorAll("[data-id]").forEach(function (b) { b.onclick = function () { SELID = b.dataset.id; PG = 0; MENU = false; open(); }; });
    el.querySelectorAll("[data-pg]").forEach(function (b) { b.onclick = function () { PG = +b.dataset.pg; open(); el.scrollTop = 0; }; });
  }
  // হোমে "শেষ ৫ জন বিজয়ী" বক্স
  // হোমের দুই বিজয়ী লাইনের লেখা অ্যাডমিন > 🏠 হোম থেকে (ui-config.js পড়ে)। ফাঁকা = আগের লেখা।
  function hmc() { return window.MCUI && window.MCUI.home ? window.MCUI.home() : {}; }
  function T1() { var t = String(hmc().t1 || "").trim(); return t ? E(t) : "বিজয়ীদের তালিকা"; }
  function T2() { var t = String(hmc().t2 || "").trim(); return t ? E(t) : "🏅 শেষ ৫ জন বিজয়ী"; }
  document.addEventListener("mcui-home", function () { var b = document.querySelector("#wnb span > b"), h = document.querySelector("#wnr .hd > b"); if (b) b.innerHTML = T1(); if (h) h.innerHTML = T2(); });
  // হোমের পুরস্কার ব্যানারের (#pzb) নিচের লাইনে কুইজের তারিখ ও বিজয়ীদের নাম ধীরে ধীরে চলে। লেখা/তারিখ/নাম/গতি/অন-অফ অ্যাডমিন > 🏠 হোম থেকে (home_cfg: mq, mt, md, mn, ms); ফাঁকা = সর্বশেষ ড্র থেকে অটো।
  function pzm() { // তারিখ ও বিজয়ীদের নামের চলমান লেখা এখন ব্যানারের ভেতরে নয়, ব্যানারের ঠিক নিচে আলাদা পট্টিতে (#pzmq)
    var pz = document.getElementById("pzb"), old = document.getElementById("pzmq"); if (!pz) return; style();
    var h = hmc(), a = ON && ROWS.length ? ROWS[0] : null, g = function (k) { return String(h[k] == null ? "" : h[k]).trim(); };
    var lab = g("mt") || (a ? "🏆 " + a.title : ""), dt = g("md") || (a ? dfmt(a.draw_date) : ""), nm = g("mn") || (a ? (a.winners || []).map(function (w) { return w.name; }).slice(0, 10).join(", ") : "");
    if (h.mq === false || !(lab || dt || nm)) { if (old) old.remove(); return; }
    var t = [lab, dt].filter(Boolean).map(E).join(" · ") + (nm ? ((lab || dt) ? " — " : "") + E(nm) : ""), sp = Math.round(+h.ms);
    if (!old) { old = document.createElement("div"); old.id = "pzmq"; old.setAttribute("aria-label", "সর্বশেষ বিজয়ী"); old.setAttribute("role", "link"); old.tabIndex = 0; old.onclick = function () { if (ON) { SELID = null; PG = 0; MENU = false; location.hash = "winners"; } }; pz.parentNode.insertBefore(old, pz.nextSibling); }
    old.innerHTML = '<span class="wnk"><span class="wni"><span>' + t + '</span><span aria-hidden="true">' + t + "</span></span></span>" + '<b class="pzd" aria-hidden="true">বিস্তারিত ›</b>';
    old.querySelector(".wni").style.animationDuration = (sp >= 5 && sp <= 300 ? sp : Math.max(16, Math.round(t.length * 0.35))) + "s";
  }
  document.addEventListener("mcui-home", pzm); pzm();
  function homeCard() {
    if (!ON || !ROWS.length || document.getElementById("wnr")) return; style(); sty3();
    var old = document.getElementById("wnb"); if (old) old.remove();
    var L = []; ROWS.forEach(function (r) { (r.winners || []).forEach(function (w) { if (L.length < 5) L.push({ w: w, t: r.title, id: r.id }); }); }); if (!L.length) return;
    var c = document.createElement("div"); c.id = "wnr"; c.className = "wnr";
    c.innerHTML = '<div class="hd"><b>' + T2() + '</b><button type="button">বিস্তারিত ›</button></div>' + L.map(function (x, i) { var s = [x.w.dept ? deptL(x.w.dept) : "", x.w.batch].filter(Boolean).join(" · "); return '<div class="it"><b>' + bd(i + 1) + "</b><div>" + E(x.w.name) + (s ? "<span>" + E(s) + "</span>" : "") + '<span class="cd" data-hw="' + i + '">🪪 কার্ড দেখুন</span></div><em>' + E(x.t) + "</em></div>"; }).join("");
    c.querySelectorAll("[data-hw]").forEach(function (b) { b.onclick = function (ev) { ev.stopPropagation(); peek(L[+b.dataset.hw].w, b, L[+b.dataset.hw].id); }; });
    c.onclick = function () { SELID = null; PG = 0; MENU = false; location.hash = "winners"; };
    var a = document.getElementById("wnh") || document.getElementById("pzmq") || document.getElementById("pzb"); if (a && a.parentNode) a.parentNode.insertBefore(c, a.nextSibling); else { var v = document.getElementById("view"); if (v && v.parentNode) v.parentNode.insertBefore(c, v); }
    homeVis();
  }
  // নিচের ট্যাব-বারে "🏅 বিজয়ী" (index.html #tbWin): বিজয়ী থাকলে দেখায়; ক্লিকে href="#winners" দিয়ে একই বিজয়ী-তালিকা খোলে
  function tabOn() { var t = document.getElementById("tbWin"); if (!t || !t.parentNode) return; t.hidden = false; t.parentNode.classList.add("t6"); }
  function close() { var el = document.getElementById("wnx"); if (el) el.remove(); }
  function sync() { if (location.hash === "#winners") { if (ready) { if (ON) open(); else location.hash = "home"; } } else close(); }
  function btn() {
    if (!ON || document.getElementById("wnb") || document.getElementById("wnh")) return; style();
    var b = document.createElement("button"); b.type = "button"; b.id = "wnb"; b.className = "wnb";
    b.innerHTML = '<i>🏅</i><span><b>' + T1() + '</b><small>সর্বশেষ: ' + E(ROWS[0].title) + "</small></span>";
    b.onclick = function () { location.hash = "winners"; };
    var a = document.getElementById("pzmq") || document.getElementById("pzb"); if (a && a.parentNode) a.parentNode.insertBefore(b, a.nextSibling); else { var v = document.getElementById("view"); if (v && v.parentNode) v.parentNode.insertBefore(b, v); }
  }
  // হোমে দেখানো ফোল্ডার (অ্যাডমিনে প্রতিটির 🏠 সুইচ অন থাকলে)। কোনো লেবেল/চিহ্ন নেই; শুধু শিরোনাম ও নাম।
  var HOME = [];
  function openRows(rows) {
    style(); var el = document.getElementById("wnx"); if (!el) { el = document.createElement("div"); el.id = "wnx"; document.body.appendChild(el); }
    el.innerHTML = '<div class="h"><button type="button" id="wnc" aria-label="বন্ধ">←</button>🏅 বিজয়ী ঘোষণা</div><div class="w"><div class="pzu">পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন<b class="pzc" role="link" tabindex="0">এখানে ক্লিক ›</b></div>' + rows.map(card).join("") + "</div>";
    el.querySelector("#wnc").onclick = close;
  }
  function homeVis() { ["wnh", "wnr"].forEach(function (id) { var c = document.getElementById(id); if (c) c.style.display = /^#?(home)?$/.test(location.hash) ? "" : "none"; }); }
  function strips() {
    if (!HOME.length || document.getElementById("wnh")) return; style();
    var old = document.getElementById("wnb"); if (old) old.remove();
    var c = document.createElement("div"); c.id = "wnh";
    var one = HOME.map(function (r) { var n = (r.winners || []).map(function (w) { return w.name; }).slice(0, 6).join(", "); return "🏆 " + E(r.title) + (n ? " — " + E(n) : ""); }).join("  •  ");
    c.innerHTML = '<button type="button" class="wns wnt" aria-label="বিজয়ী ঘোষণা দেখুন"><span class="wnk"><span class="wni"><span>' + one + '</span><span aria-hidden="true">' + one + '</span></span></span><b class="wnq" aria-hidden="true">👆 দেখুন ›</b></button>';
    c.firstChild.querySelector(".wni").style.animationDuration = Math.max(12, Math.round(one.length * 0.28)) + "s";
    c.onclick = function () { if (ON) location.hash = "winners"; else openRows(HOME); };
    var a = document.getElementById("pzmq") || document.getElementById("pzb"); if (a && a.parentNode) a.parentNode.insertBefore(c, a.nextSibling); else { var v = document.getElementById("view"); if (v && v.parentNode) v.parentNode.insertBefore(c, v); }
    homeVis();
  }
  fetch(base + "/rest/v1/rpc/mc2_draws_home", { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, body: "{}" })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (r) { if (r && r.on && (r.rows || []).length) { HOME = r.rows; strips(); } }).catch(function () {});
  window.addEventListener("hashchange", homeVis);
  get(0).then(function (r) {
    ON = !!r.on && (r.rows || []).length > 0; ROWS = r.rows || []; MORE = ROWS.length >= LIM; ready = true;
    if (ON) { homeCard(); btn(); tabOn(); } pzm(); sync();
  }).catch(function () { ready = true; });
  window.addEventListener("hashchange", sync);
})();

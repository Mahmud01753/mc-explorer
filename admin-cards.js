// অ্যাডমিন: "🪪 কার্ড" ট্যাব — প্রত্যেক ইউজারের ছোট নমুনা কার্ড (কম সাইজ), ক্লিকে বড় প্রিভিউ, ডাউনলোডে ফুল কোয়ালিটি (১০৮০×১৪০০ কার্ড / ১০৮০×১৯২০ স্টোরি) — ফেসবুকে পোস্ট করার জন্য।
// ডাউনলোডের সময় সংরক্ষিত তথ্য + ছবি থেকে কার্ড আবার আঁকা হয়, তাই ছবির মান কমে না। admin-results.js-এর পরে, admin.js-এর আগে লোড হয়।
// লাগে: data.js, qr.js, card.js, cards.js (admin.html-এ আছে) + supabase-cards.sql।
// ২০২৬-১১-০৩: "কার্ড ডিলিট" প্যানেলে প্রতি কার্ডের KB, অনেক আইডেন্টিফায়ার ফিল্টার (ভিউ mc2_cards_adm), প্রিভিউতে কার্ড ১/২/৩/স্টোরি ডাউনলোড। SQL: supabase-new-20261103.sql (না চালালে পুরোনো ফিল্টারে চলে)।
(function () {
  var F = { q: "", dept: "", batch: "", fav: false, fb: "", sort: "new" }, FAV = {}, BO = [], ST = null, LIM = 24, M = null, ROWS = [], MORE = false, PG = 0, TOT = 0, VW = "t", SELC = {}, OPENR = {};
  // ভাগ ৫: ট্যাব না খুলেও (যেমন ডাউনলোড-ফোল্ডার থেকে এডিট জানালা) ডেটা-ডাকা চলে — আগে M শুধু ট্যাব খুললে বসত, তাই "আঁকা যায়নি" আসত
  (function () { var f = function () { M = M || window.MCA || null; }; if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f); else f(); })();
  try { VW = localStorage.getItem("mca_cardvw") === "i" ? "i" : "t"; } catch (e) {}
  // ভাগ ২ক: ⭐ পছন্দের কার্ড — শুধু এই ব্রাউজারে (localStorage), সার্ভারে কিছু যায় না
  try { FAV = JSON.parse(localStorage.getItem("mca_cardfav") || "{}") || {}; } catch (e) { FAV = {}; }
  function favSave() { try { localStorage.setItem("mca_cardfav", JSON.stringify(FAV)); } catch (e) {} }
  var BDEF = ["২০১৭-১৮", "২০১৮-১৯", "২০১৯-২০", "২০২০-২১", "২০২১-২২", "২০২২-২৩", "২০২৩-২৪", "২০২৪-২৫", "২০২৫-২৬", "অ্যালামনাই"];
  // সব ফিল্টারের শর্ত এক জায়গায় (query ও cnt দুটোতেই একই)
  function filt() {
    var p = "";
    if (F.dept) p += "&dept=eq." + encodeURIComponent(F.dept);
    if (F.batch === "__none") p += "&or=" + encodeURIComponent("(batch.is.null,batch.eq.)"); else if (F.batch) p += "&batch=eq." + encodeURIComponent(F.batch);
    if (F.fav) p += "&id=in." + encodeURIComponent("(" + Object.keys(FAV).map(function (k) { return String(k).replace(/[^A-Za-z0-9_-]/g, ""); }).join(",") + ")");
    if (FBV && F.fb) p += F.fb === "yes" ? "&fb=in.(yp,yn)" : "&fb=eq." + F.fb;
    if (F.q.trim()) p += "&name=ilike." + encodeURIComponent("*" + F.q.trim().replace(/[*,()%]/g, "") + "*");
    return p;
  }
  window.MCA_TABS = (window.MCA_TABS || []).concat([["cards", "🪪 কার্ড"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { cards: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var noop = function () {};
  // ২০২৬-১২-২০: ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি (supabase-new-20261220.sql: টেবিল mc2_fbok + ভিউ mc2_cards_fbv)। SQL না চালালে ফিল্টার/চিহ্ন বাদ, বাকি আগের মতো চলে।
  var FBV = true, FBC = {}, FBO = [["", "সব"], ["yes", "✅ হ্যাঁ (সব)"], ["yp", "✅ হ্যাঁ · ছবি সহ"], ["yn", "✅ হ্যাঁ · ছবি ছাড়া"], ["no", "❌ না"], ["none", "— উত্তর দেয়নি"]];
  var FBL = { yp: "✅ ছবি সহ", yn: "✅ ছবি ছাড়া", no: "❌ না", photo: "✅ ছবি সহ", nophoto: "✅ ছবি ছাড়া" };
  function fbChip(f) { return FBL[f] ? ' <span class="sm" style="white-space:nowrap;border:1px solid var(--bd);border-radius:999px;padding:0 7px" title="ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি">📣 ' + FBL[f] + "</span>" : ""; }
  // কার্ডের ফোনের অনুমতি (প্রতি ফোনে একটা; ১০ মিনিট মনে রাখে): "photo" | "nophoto" | "no" | "" (উত্তর নেই/জানা যায়নি)
  function fbm(c) {
    var d = c && c.device; if (!d) return Promise.resolve("");
    var h = FBC[d]; if (h && Date.now() - h.t < 600000) return h.p;
    var p = M.A("mc2_fbok?device=eq." + encodeURIComponent(d) + "&select=ok,mode").then(function (f) { return f && f[0] ? (f[0].ok ? f[0].mode || "" : "no") : ""; }).catch(function () { return ""; });
    FBC[d] = { t: Date.now(), p: p }; return p;
  }
  // ছবি সহ / ছবি ছাড়া / অনুমতি অনুযায়ী — অ্যাডমিনের নিজের বাছাই (ডিফল্ট: ছবি সহ), প্রিভিউ-ডাউনলোড-ZIP-শিট সব জায়গায় একই; সার্ভারে ছবি সবসময় সেভ থাকে, এটা শুধু আঁকার সময়
  var PMK = "mc2_adm_pm", PML = [["with", "🖼 ছবি সহ"], ["none", "🙈 ছবি ছাড়া"], ["auto", "📣 অনুমতি অনুযায়ী"]];
  function pm() { try { var v = localStorage.getItem(PMK); return v === "none" || v === "auto" ? v : "with"; } catch (e) { return "with"; } }
  function pmSet(v) { try { localStorage.setItem(PMK, v); } catch (e) {} }
  function pmUse(c) { var m = pm(); if (m === "none") return Promise.resolve(false); if (m === "with") return Promise.resolve(true); return fbm(c).then(function (x) { return x === "photo"; }); } // অটো: ফেসবুকে "ছবি সহ" অনুমতি থাকলেই ছবি; নইলে ছবি ছাড়া
  // 🛠 কার্ড-প্রিভিউ পপআপ থেকে যেকোনো ধরনের কার্ড বানানো: চাপলে এই একজনের জন্য বানানো-জানালা (admin-sheet.js) খোলে — এডিট, ছবি সহ/ছাড়া, ডাউনলোড সেখানেই
  var MK = [["card", "🪪 কার্ড", ""], ["card", "📱 স্টোরি", "story"], ["poster", "🖼 বিজয়ী পোস্টার", ""], ["cert", "🎓 সার্টিফিকেট", ""], ["social", "📣 সোশ্যাল কার্ড", ""], ["rank", "🏅 র‍্যাংক কার্ড", ""], ["tiles", "📋 টাইল", ""]];
  function mkBar() { return '<div class="cxt" style="align-items:center;flex-wrap:wrap"><span class="sm"><b>🛠 বানান ও ডাউনলোড:</b></span>' + MK.map(function (m, i) { return '<button class="l s" type="button" data-mk="' + i + '">' + m[1] + "</button>"; }).join("") + "</div>"; }
  function mkOpen(c, i) {
    var m = MK[i]; if (!m) return; if (!window.MCSheet) { alert("শিট সিস্টেম (admin-sheet.js) লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
    var r = c.rec || {}; window.MCSheet.open([{ key: String(c.id != null ? c.id : c.name), name: c.name, device: c.device || "", dept: c.dept || r.dept || "", batch: c.batch || r.batch || "", score: c.score != null ? c.score : r.score, rank: null }], { kind: m[0], design: m[2] || undefined, pre: "all", mode: "single", title: m[1].replace(/^\S+\s*/, "") });
  }
  function pmBar() { var cur = pm(); return '<div class="cxt" style="align-items:center"><span class="sm"><b>ছবি:</b></span>' + PML.map(function (o) { return '<button class="l s' + (cur === o[0] ? " on" : "") + '" type="button" data-pm="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>"; }
  var JPG = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;

  function query(off) {
    if (F.fav && !Object.keys(FAV).length) return Promise.resolve([]);
    var p = (FBV ? "mc2_cards_fbv" : "mc2_cards") + "?select=id,device,name,dept,batch,score,pct,show,updated_at,thumb" + (FBV ? ",fb" : "") + "&order=" + (F.sort === "score" ? "score.desc,updated_at.desc" : "updated_at.desc") + "&limit=" + LIM + "&offset=" + off;
    return M.A(p + filt()).catch(function (e) { if (!FBV) throw e; FBV = false; F.fb = ""; return query(off); });
  }
  function cnt() { // মোট কার্ড (ফিল্টার অনুযায়ী) — পেজ-নম্বরের জন্য
    if (F.fav && !Object.keys(FAV).length) return Promise.resolve(0);
    var p = (FBV ? "mc2_cards_fbv" : "mc2_cards") + "?select=id&limit=1" + filt();
    return M.raw(M.base + "/rest/v1/" + p, { headers: { Prefer: "count=exact" } }).then(function (r) { var m = /\/(\d+)/.exec(r.headers.get("content-range") || ""); return m ? +m[1] : null; }).catch(function () { return null; });
  }
  function loadPg(pg) { var was = FBV; return Promise.all([query(pg * LIM), cnt()]).then(function (r) { return was && !FBV && r[1] == null ? cnt().then(function (t) { r[1] = t; return r; }) : r; }).then(function (r) { PG = pg; SELC = {}; OPENR = {}; ROWS = r[0]; TOT = r[1] == null ? pg * LIM + r[0].length + (r[0].length === LIM ? 1 : 0) : r[1]; MORE = false; }); }
  // সেশনের তালিকা (আসল ডাটা + ডিফল্ট) ও সাইজের গড় — না পেলে চুপচাপ বাদ
  function loadExtra() {
    if (!BO.length) M.A("mc2_cards?select=batch&limit=20000").then(function (L) { var s = {}; BDEF.forEach(function (x) { s[x] = 1; }); (L || []).forEach(function (r) { if (r.batch) s[r.batch] = 1; }); BO = Object.keys(s).sort(); var e = M.$("#cb"); if (e) e.innerHTML = batchOpts(); }).catch(noop);
    if (!ST) M.rpc("mc2_cards_kb_stats", {}).then(function (m) { ST = m; var e = M.$("#csum"); if (e) e.innerHTML = sumHtml(); }).catch(noop);
  }
  function batchOpts() {
    var E = M.esc, L = BO.length ? BO : BDEF;
    return '<option value="">সব</option><option value="__none"' + (F.batch === "__none" ? " selected" : "") + '>— (সেশন নেই)</option>' + L.map(function (x) { return '<option value="' + E(x) + '"' + (x === F.batch ? " selected" : "") + ">" + E(x) + "</option>"; }).join("");
  }
  function sumHtml() {
    var h = "ফিল্টার অনুযায়ী কার্ড <b>" + bd(TOT) + "</b>টি";
    if (ST && ST.avg_kb != null) {
      var any = F.q.trim() || F.dept || F.batch || F.fav || F.fb, mb = any ? Math.round(TOT * ST.avg_kb / 1024 * 100) / 100 : ST.mb;
      h += " · " + (any ? "আনুমানিক ≈ " : "মোট ≈ ") + "<b>" + bd(mb) + " MB</b>" + (any ? ' <span class="sm">(সব কার্ডের গড় সাইজ ধরে হিসাব)</span>' : "");
    }
    return h;
  }
  function favN() { return Object.keys(FAV).length; }
  function view() {
    M = window.MCA; ROWS = []; PG = 0; sweep(); loadExtra(); return loadPg(0).then(function () { paint(); prefetch(); });
  }
  function more(pg) { loadPg(Math.max(0, pg || 0)).then(function () { paint(); prefetch(); var h = M.$("#view"); if (h) h.scrollIntoView(); }).catch(M.fail); }
  function paint() {
    var V = M.$("#view"), E = M.esc, depts = (window.MC && window.MC.depts) || [];
    var h = '<h2>🪪 ইউজার কার্ড (মোট ' + bd(TOT) + 'টি)</h2><p class="sm">প্রত্যেক ইউজারের সেরা স্কোরের কার্ড। সারিতে ক্লিক করলে সব তথ্য ও পাশে ছোট কার্ড প্রিভিউ ভেসে ওঠে; টিক দিয়ে একসাথে ডিলিট করা যায়।</p>' +
      '<p class="sm" id="csum" style="margin:4px 0">' + sumHtml() + '</p><p class="sm" style="margin:2px 0">⭐ পছন্দের কার্ড শুধু এই ফোনের ব্রাউজারে থাকে — ব্রাউজারের ডাটা মুছলে বা অন্য ফোন/কম্পিউটারে গেলে থাকবে না।</p>' +
      '<div class="row"><label>নাম খুঁজুন<input id="cq" maxlength="40" value="' + E(F.q) + '"></label><label>বিভাগ<select id="cd"><option value="">সব</option>' + depts.map(function (d) { return '<option value="' + E(d) + '"' + (d === F.dept ? " selected" : "") + ">" + E(d) + "</option>"; }).join("") + '</select></label><label>সেশন<select id="cb">' + batchOpts() + '</select></label>' + (FBV ? '<label>📣 ফেসবুক অনুমতি<select id="cfb">' + FBO.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === F.fb ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select></label>' : '') +
      '<label>সাজানো<select id="cs"><option value="new"' + (F.sort === "new" ? " selected" : "") + '>নতুন আগে</option><option value="score"' + (F.sort === "score" ? " selected" : "") + '>বেশি মার্ক আগে</option></select></label><label style="flex-direction:row;align-items:center;gap:6px"><input id="cf" type="checkbox" style="width:20px;height:20px;min-width:20px;padding:0;margin:0"' + (F.fav ? " checked" : "") + '> ⭐ শুধু পছন্দের (' + bd(favN()) + ')</label><button type="button" data-a="go">🔎 খুঁজুন</button><button type="button" class="l" data-a="cc" title="মেমোরি ও ব্রাউজার স্টোরেজ থেকে মনে-রাখা কার্ড মুছে ফেলে">🧹 ক্যাশ মুছুন</button><button type="button" class="d" data-a="cd_x">🗑 কার্ড ডিলিট (ফিল্টার দিয়ে)</button><button type="button" data-a="zipx" title="বাছা কার্ডের JPG + এক্সেল + PDF একটা ZIP-এ">📦 ZIP (JPG + এক্সেল + PDF)</button><button type="button" data-a="shx" title="যাদের চান বেছে ২/৩/৫/৭… জনের কার্ড একটাই ছবিতে (উপরে লোগো-সাইটের নাম)">📄 একসাথে এক পেজে</button></div><div id="cdp"></div>';
    h += viewBar() + (VW === "i" ? gridHtml() : listHtml()) + (FBV ? "" : '<p class="sm">ℹ️ ফেসবুক অনুমতির ফিল্টার/চিহ্ন আসেনি — supabase-new-20261220.sql এখনো চালানো হয়নি মনে হচ্ছে।</p>') + (ROWS.length ? "" : '<p class="sm">এখনো কোনো কার্ড জমা পড়েনি। ইউজার কার্ড দেখলে এখানে আসবে (আগে supabase-cards.sql চালাতে হবে)।</p>') +
      (window.MCPG ? window.MCPG.html(PG, TOT, LIM, 'data-a="pgx" data-p') : "") + selBarHtml();
    V.innerHTML = h; V.onclick = click; if (DEL.open) { DEL.open = false; cdOpen(); } var q = M.$("#cq"); if (q) q.onkeydown = function (e) { if (e.key === "Enter") go(); };
  }
  // ---------- কার্ড তালিকা: লেখা ভিউ (ডিফল্ট) / ছবি ভিউ, টিক দিয়ে একসাথে ডিলিট ----------
  function gridHtml() {
    var E = M.esc;
    return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:10px">' + ROWS.map(function (r) {
      var th = JPG.test(r.thumb || "") ? r.thumb : "";
      return '<div class="c' + (r.show ? "" : " hid") + '" style="padding:8px;display:grid;gap:6px;align-content:start"><label class="sm" style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="flex:none;width:20px;height:20px;min-width:20px;padding:0;margin:0" data-sel="' + r.id + '"' + (SELC[r.id] ? " checked" : "") + '> বাছুন</label><button type="button" data-a="big" data-id="' + r.id + '" style="padding:0;background:#fff;border:1px solid var(--bd);line-height:0;border-radius:10px;overflow:hidden">' +
        (th ? '<img src="' + th + '" alt="" style="width:100%;height:auto;display:block">' : "—") + '</button><div><b data-dev="' + E(r.device || "") + '">' + E(r.name) + '</b>' + (window.MCG ? window.MCG.tag(r.device, r.name) : "") + fbChip(r.fb) + '<div class="sm">' + E(r.dept) + " · " + E(r.batch || "—") + "</div><div class=\"sm\">মার্ক <b>" + bd(r.score) + "</b> · " + E(new Date(r.updated_at).toLocaleDateString("bn-BD")) + "</div></div>" +
        '<div class="act"><button class="s" type="button" data-a="dl" data-id="' + r.id + '" data-k="card">🪪 কার্ড দেখুন/ডাউনলোড</button><button class="s" type="button" data-a="dl" data-id="' + r.id + '" data-k="story">📱 স্টোরি দেখুন/ডাউনলোড</button></div>' +
        '<div class="act"><button class="l s" type="button" data-a="show" data-id="' + r.id + '" data-v="' + (r.show ? 0 : 1) + '">' + (r.show ? "🙈 টপ ৩-এ ছবি লুকান" : "👁 ছবি দেখান") + '</button><button class="l s" type="button" data-a="fav" data-id="' + r.id + '" aria-label="পছন্দের">' + (FAV[r.id] ? "⭐" : "☆") + '</button><button class="d s" type="button" data-a="del" data-id="' + r.id + '">🗑</button></div></div>';
    }).join("") + "</div>";
  }
  function viewBar() {
    return '<div class="act" style="margin-top:8px;align-items:center"><span class="sm">ভিউ:</span><button type="button" class="s' + (VW === "t" ? "" : " l") + '" data-a="vw" data-v="t">📋 লেখা ভিউ</button><button type="button" class="s' + (VW === "i" ? "" : " l") + '" data-a="vw" data-v="i">🖼 ছবি ভিউ</button></div>';
  }
  function panelHtml(r) {
    var E = M.esc, th = JPG.test(r.thumb || "") ? r.thumb : "";
    return '<div data-pn style="padding:6px 8px 8px;border-top:1px solid var(--bd);display:grid;gap:6px"><div style="display:flex;gap:10px;align-items:flex-start"><button type="button" data-a="big" data-id="' + r.id + '" style="padding:0;flex:none;width:min(46%,170px);background:#fff;border:1px solid var(--bd);line-height:0;border-radius:10px;overflow:hidden">' +
      (th ? '<img src="' + th + '" alt="" style="width:100%;height:auto;display:block">' : "—") + '</button><div style="min-width:0"><b data-dev="' + E(r.device || "") + '">' + E(r.name) + '</b>' + (window.MCG ? window.MCG.tag(r.device, r.name) : "") + fbChip(r.fb) + '<div class="sm">' + E(r.dept) + " · " + E(r.batch || "—") + '</div><div class="sm">মার্ক <b>' + bd(r.score) + "</b> · " + E(new Date(r.updated_at).toLocaleDateString("bn-BD")) + '</div></div></div>' +
      '<div class="act"><button class="s" type="button" data-a="dl" data-id="' + r.id + '" data-k="card">🪪 কার্ড দেখুন/ডাউনলোড</button><button class="s" type="button" data-a="dl" data-id="' + r.id + '" data-k="story">📱 স্টোরি দেখুন/ডাউনলোড</button><button class="l s" type="button" data-a="show" data-id="' + r.id + '" data-v="' + (r.show ? 0 : 1) + '">' + (r.show ? "🙈 টপ ৩-এ ছবি লুকান" : "👁 ছবি দেখান") + '</button></div></div>';
  }
  function listHtml() {
    var E = M.esc;
    return "<div>" + ROWS.map(function (r, i) {
      return '<div class="c' + (r.show ? "" : " hid") + '" data-row="' + r.id + '" style="margin-top:4px;padding:0"><div style="display:flex;gap:8px;align-items:center;padding:6px 8px"><input type="checkbox" style="flex:none;width:20px;height:20px;min-width:20px;padding:0;margin:0" data-sel="' + r.id + '"' + (SELC[r.id] ? " checked" : "") + ' aria-label="বাছুন">' +
        '<button type="button" data-a="tgl" data-id="' + r.id + '" title="সব তথ্য ও কার্ড প্রিভিউ দেখুন" style="flex:1;min-width:0;text-align:left;background:none;border:0;padding:4px 0;color:inherit;font:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span class="sm">' + bd(PG * LIM + i + 1) + '.</span> <b>' + E(r.name) + '</b>' + fbChip(r.fb) + ' <span class="sm">· ' + E(r.dept) + " · " + E(r.batch || "—") + " · মার্ক " + bd(r.score) + " · " + E(new Date(r.updated_at).toLocaleDateString("bn-BD")) + '</span></button>' +
        '<button class="l s" type="button" data-a="fav" data-id="' + r.id + '" aria-label="পছন্দের">' + (FAV[r.id] ? "⭐" : "☆") + '</button><button class="d s" type="button" data-a="del" data-id="' + r.id + '">🗑</button></div>' + (OPENR[r.id] ? panelHtml(r) : "") + "</div>";
    }).join("") + "</div>";
  }
  function selCount() { return Object.keys(SELC).length; }
  function selBarHtml() {
    var n = selCount();
    return '<div id="csb" style="position:fixed;left:8px;right:64px;bottom:12px;max-width:560px;z-index:60;background:var(--card);color:var(--fg);border:2px solid var(--bad,#c0392b);border-radius:12px;padding:8px 10px;box-shadow:0 6px 24px rgba(0,0,0,.35);display:' + (n ? "flex" : "none") + ';gap:6px;flex-wrap:wrap;align-items:center"><b id="csn">বাছা ' + bd(n) + 'টি</b><button class="l s" type="button" data-a="sall">☑ এই পেজের সব</button><button class="l s" type="button" data-a="snone">✖ বাছা বাদ</button><button class="d s" type="button" data-a="sdel">🗑 বাছাগুলো ডিলিট</button></div>';
  }
  function selUpd() { var b = M.$("#csb"); if (!b) return; var n = selCount(); b.style.display = n ? "flex" : "none"; var t = M.$("#csn"); if (t) t.textContent = "বাছা " + bd(n) + "টি"; }
  function selTick(t) { if (t.checked) SELC[t.dataset.sel] = 1; else delete SELC[t.dataset.sel]; selUpd(); }
  function selAll(on) { ROWS.forEach(function (r) { if (on) SELC[r.id] = 1; else delete SELC[r.id]; }); Array.prototype.forEach.call(document.querySelectorAll("[data-sel]"), function (c) { c.checked = on; }); selUpd(); }
  // এক বা একাধিক কার্ড ডিলিট (তালিকা, টিক-বার ও প্রিভিউ পপআপ — সবখানে একই)। কার্ড বিনে যায়, বিন ট্যাব থেকে ফেরানো যায়।
  function delIds(ids) {
    ids = ids.map(String); if (!ids.length) return Promise.resolve();
    var q = ids.map(encodeURIComponent).join(",");
    return M.A("mc2_cards?select=id,pinned&id=in.(" + q + ")").catch(function () { return []; }).then(function (L) {
      var pn = (L || []).filter(function (x) { return x.pinned; }).length;
      if (!confirm(bd(ids.length) + "টি কার্ড (ও ছবি) ডিলিট হবে।" + (pn ? "\n⚠️ এর মধ্যে " + bd(pn) + "টি টপ-৩ সুরক্ষিত কার্ড।" : "") + "\n\nইউজারের শেষ কার্ড মুছলে তার স্কোর, উত্তর, কনটেস্ট এন্ট্রি, ভিজিটর রেকর্ড ও টপ-হিস্টরিও যায়। সবকিছু 🗑 বিনে জমা হয়; বিন থেকে ‘ফেরান’ দিলে কার্ডসহ সব একসাথে ফিরে আসে। শুধু কনটেস্ট স্ক্রিনশটের ছবি-ফাইল ফেরে না। এগিয়ে যাবেন?")) return;
      if (pn) { var t = prompt('টপ-৩ সুরক্ষিত কার্ড মুছতে যাচ্ছেন। নিশ্চিত করতে "ডিলিট" লিখুন'); if (t === null || String(t).trim() !== "ডিলিট") { alert("লেখা মেলেনি — কিছু মোছা হয়নি।"); return; } }
      if (ids.length > 20) { var c = prompt("নিশ্চিত করতে মুছতে-যাওয়া কার্ডের সংখ্যা লিখুন: " + bd(ids.length)); if (c === null || String(c).replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }).trim() !== String(ids.length)) { alert("সংখ্যা মেলেনি — কিছু মোছা হয়নি।"); return; } }
      var gone = 0, ch = [], i; for (i = 0; i < ids.length; i += 50) ch.push(ids.slice(i, i + 50));
      return ch.reduce(function (p, c) { return p.then(function () { return cdRm(M.base + "/rest/v1/mc2_cards?id=in.(" + c.map(encodeURIComponent).join(",") + ")").then(function (n) { gone += n; }); }); }, Promise.resolve()).then(function () {
        ids.forEach(function (x) { cdrop(x); delete SELC[x]; delete OPENR[x]; });
        var done = function () { if (gone < ids.length) alert("⚠️ " + bd(ids.length) + "টির মধ্যে " + bd(gone) + "টি মুছেছে (বাকিগুলো সুরক্ষিত বা আগেই মোছা)।"); };
        if (!M.$("#cq")) { done(); return; }
        return loadPg(PG).then(function () { if (!ROWS.length && PG > 0) return loadPg(PG - 1); }).then(function () { paint(); done(); });
      });
    }).catch(M.fail);
  }
  function go() { F = { q: M.$("#cq").value, dept: M.$("#cd").value, batch: M.$("#cb") ? M.$("#cb").value : "", fav: !!(M.$("#cf") && M.$("#cf").checked), fb: M.$("#cfb") ? M.$("#cfb").value : "", sort: M.$("#cs").value }; view().catch(M.fail); }
  // ---------- কাজ ১৪ (অ্যাডমিন): কার্ডের তথ্য ১ ঘণ্টা মনে রাখা ও আগে থেকে আনা ----------
  // একই কার্ড আবার খুললে সার্ভার থেকে rec+ছবি আবার আনা হয় না। মনে রাখা হয় ১ ঘণ্টা; সর্বোচ্চ ৩০টি (পুরোনোটা আগে বাদ)।
  // দুই স্তর: (১) মেমোরি (RAM), (২) ব্রাউজারের IndexedDB (পেজ রিফ্রেশেও থাকে; না চললে শুধু মেমোরি)।
  // ১ ঘণ্টা পার হলে দুই জায়গা থেকেই মোছা হয়: পেজ/ট্যাব খোলার সময়, তারপর প্রতি ৫ মিনিটে, ট্যাবে ফিরলে। ৩০টির বেশি হলেও পুরোনো মোছা হয়।
  // ব্রাউজার বন্ধ থাকলে কোড চলে না, তাই পরের বার অ্যাডমিন খুললেই মেয়াদ-শেষ কার্ড মুছে যায়। "🧹 ক্যাশ মুছুন" বাটনে হাতেও সব মোছা যায়।
  // অলস সময়ে আগে আনা: তালিকা খুললে প্রথম ৫টি; কোনো কার্ডে ক্লিক করলে তার আশেপাশের ৫টি। ডাটা-সেভার/ধীর নেট হলে আনা হয় না।
  var CC = {}, CK = [], TTL = 3600000, MAXC = 30, PFN = 5, PF = 0, DBN = "mc_admin_cards", DBS = "c", DBP = null;
  function fresh(t) { return Date.now() - t < TTL; }
  function dbo() {
    if (DBP) return DBP;
    DBP = new Promise(function (res, rej) {
      try {
        if (!window.indexedDB) return rej(new Error("idb নেই"));
        var r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(DBS, { keyPath: "id" }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = r.onblocked = function () { rej(r.error || new Error("idb")); };
      } catch (e) { rej(e); }
    });
    return DBP;
  }
  function dbx(mode, f) {
    return dbo().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(DBS, mode), o = f(t.objectStore(DBS));
        t.oncomplete = function () { res(o && o.result); };
        t.onerror = t.onabort = function () { rej(t.error || new Error("idb")); };
      });
    });
  }
  function noop() {}
  function dbGet(k) { return dbx("readonly", function (s) { return s.get(k); }).then(function (r) { return r && fresh(r.t) ? r : null; }).catch(function () { return null; }); }
  function dbPut(k, c, t) { return dbx("readwrite", function (s) { return s.put({ id: k, t: t || Date.now(), c: c }); }).catch(noop); } // জায়গা শেষ হলে চুপচাপ বাদ
  function dbDel(k) { return dbx("readwrite", function (s) { return s.delete(k); }).catch(noop); }
  function dbClear() { return dbx("readwrite", function (s) { return s.clear(); }).catch(noop); }
  // মেয়াদ-শেষ (১ ঘণ্টার পুরোনো) ও ৩০-এর বেশি কার্ড দুই জায়গা থেকেই মোছে
  function sweep() {
    var i, k, keep = [];
    for (i = 0; i < CK.length; i++) { k = CK[i]; if (CC[k] && fresh(CC[k].t)) keep.push(k); else delete CC[k]; }
    CK = keep;
    dbo().then(function (db) {
      return new Promise(function (res) {
        var t = db.transaction(DBS, "readwrite"), s = t.objectStore(DBS), all = [], q = s.openCursor();
        q.onsuccess = function () {
          var c = q.result;
          if (c) { var v = c.value; if (!v || !fresh(v.t)) c.delete(); else all.push({ id: v.id, t: v.t }); c.continue(); }
          else { all.sort(function (x, y) { return y.t - x.t; }); all.slice(MAXC).forEach(function (x) { s.delete(x.id); }); }
        };
        t.oncomplete = t.onerror = t.onabort = function () { res(); };
      });
    }).catch(noop);
  }
  function cput(id, p) {
    id = String(id); CK = CK.filter(function (k) { return k !== id; }); CK.push(id); CC[id] = { p: p, t: Date.now() };
    while (CK.length > MAXC) { var o = CK.shift(); delete CC[o]; dbDel(o); }
  }
  function cdrop(id) { id = String(id); delete CC[id]; CK = CK.filter(function (k) { return k !== id; }); dbDel(id); }
  function cclear() { CC = {}; CK = []; return dbClear(); }
  function one(id) {
    var k = String(id), h = CC[k];
    if (h && fresh(h.t)) return h.p;
    var p = dbGet(k).then(function (r) {
      if (r) { if (CC[k] && CC[k].p === p) CC[k].t = r.t; return r.c; } // ব্রাউজারে আছে: নেটে যাওয়া লাগে না
      return M.A("mc2_cards?id=eq." + encodeURIComponent(id) + "&select=id,device,name,score,rec,photo").then(function (a) { if (!a || !a[0]) throw new Error("কার্ড পাওয়া যায়নি"); dbPut(k, a[0]); return a[0]; });
    });
    cput(k, p); p.catch(function () { if (CC[k] && CC[k].p === p) cdrop(k); }); // ব্যর্থ হলে মনে রাখা হয় না
    return p;
  }
  // center: ROWS-এর যে নম্বরের কার্ডে ক্লিক হয়েছে; না দিলে তালিকার শুরু থেকে প্রথম ৫টি।
  // center দিলে তার সবচেয়ে কাছের (আগে সামনে, তারপর পেছনে) মনে-না-রাখা ৫টি অলস সময়ে একে একে আনে।
  function prefetch(center) {
    var my = ++PF; if (!window.MCCards) return;
    var order = [], ids = [], n = ROWS.length, c = center == null ? -1 : center, i, d, r, h;
    if (c < 0) { for (i = 0; i < n; i++) order.push(i); }
    else { for (d = 1; d < n; d++) { if (c + d < n) order.push(c + d); if (c - d >= 0) order.push(c - d); } }
    for (i = 0; i < order.length && ids.length < PFN; i++) { r = ROWS[order[i]]; h = CC[String(r.id)]; if (!(h && fresh(h.t))) ids.push(r.id); }
    function step() {
      if (my !== PF || !ids.length || !M.$("#cq")) return; // অন্য ট্যাবে গেলে বা নতুন তালিকা এলে থামে
      one(ids.shift()).catch(function () {}).then(function () { idle(step); });
    }
    idle(step);
  }
  function idle(f) { if (window.requestIdleCallback) requestIdleCallback(f, { timeout: 2000 }); else setTimeout(f, 600); }
  sweep(); setInterval(sweep, 300000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) sweep(); });
  function drawFull(c, kind, ex, lov, ph) { return Promise.all([fbm(c), pmUse(c)]).then(function (r) { var m = r[0]; c.fbm = m; if (ph === "with") r[1] = true; else if (ph === "none") r[1] = false; return window.MCCards.render(Object.assign({}, c.rec, { name: c.rec.name || c.name, score: c.rec.score != null ? c.rec.score : c.score }, lov ? { lgo: lov } : {}), r[1] ? c.photo : null, kind, ex && Object.keys(ex).length ? ex : undefined); }); } // ছবি আছে কি না pm() (ছবি সহ/ছাড়া/অনুমতি অনুযায়ী) ঠিক করে — প্রিভিউ/ডাউনলোড/ZIP সব জায়গায়
  // ---------- নতুন: প্রিভিউ + নিচে ডাউনলোড (কার্ড ও স্টোরি) ----------
  // কেন বদল: আগে বোতাম চাপার পর কার্ড আঁকা শেষ হলে স্ক্রিপ্ট ডাউনলোড চালাত; ফোনের ব্রাউজার ৫ সেকেন্ড পরে এটা আটকে দেয়।
  // এখন কার্ড আগে আঁকা হয়, ডাউনলোড লিংক তৈরি থাকে, ইউজার নিজে লিংকে চাপে — তাই ঠিকমতো নামে।
  var st = document.createElement("style");
  st.textContent = ".cxm{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:10px;overflow:auto}.cxb2{background:var(--card);color:var(--fg);border-radius:14px;padding:12px;width:min(96vw,540px);max-height:96vh;overflow:auto;display:grid;gap:8px}" +
    ".cxb2 img{max-width:100%;max-height:58vh;border-radius:10px;border:1px solid var(--bd);justify-self:center;background:#fff}.cxt{display:flex;gap:6px;flex-wrap:wrap}.cxt button.on{background:var(--g);color:#fff}" +
    "a.cxd{display:block;text-align:center;font-weight:700;border-radius:10px;padding:10px 12px;background:var(--g);color:#fff;text-decoration:none}a.cxd.off{opacity:.45;pointer-events:none}.cxbtns{display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle}.cxbtns button{padding:2px 8px;font-size:12px}";
  document.head.appendChild(st);
  // ফাইলের নাম শুধু ইংরেজি অক্ষরে (বাংলা নামে কিছু ব্রাউজার ফাইলের নাম/.png হারায়)। বাংলা নাম হলে মোটামুটি রোমান করা হয়।
  var CN = { "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n", "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n", "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t" },
    VI = { "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou" },
    VS = { "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou" }, SG = { "ং": "ng", "ঃ": "h", "ঁ": "n" };
  function roman(t) {
    t = String(t || "").normalize("NFC").replace(/ড়/g, "ড়").replace(/ঢ়/g, "ঢ়").replace(/য়/g, "য়"); var o = "", i, c, n;
    for (i = 0; i < t.length; i++) {
      c = t[i]; n = t[i + 1];
      if (CN[c]) { o += CN[c]; if (n && VS[n]) { o += VS[n]; i++; } else if (n === "্") { i++; } else if (n && CN[n]) o += "o"; }
      else if (VI[c]) o += VI[c]; else if (SG[c]) o += SG[c]; else if (VS[c]) o += VS[c]; else if (c !== "্") o += c;
    }
    return o;
  }
  function asciiName(t) { var r = roman(t).replace(/[^A-Za-z0-9 _-]+/g, " ").trim().replace(/\s+/g, "_"); return r.slice(0, 30) || "MC"; }
  function fnm(c, kind) { try { var b = window.MCCards.fname(Object.assign({}, c.rec, { name: asciiName(c.rec.name || c.name), score: c.rec.score != null ? c.rec.score : c.score }), kind === "story").replace(/[^A-Za-z0-9._-]/g, "_"); return /^card[123]$/.test(kind) ? b.replace(/\.png$/, "_c" + kind.charAt(4) + ".png") : b; } catch (e) { return "mc_card" + (kind === "story" ? "_story" : /^card[123]$/.test(kind) ? "_c" + kind.charAt(4) : "") + ".png"; } }
  function blobOf(cv) { return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, "image/png"); }); }
  // cards: এক ডিভাইসের এক বা একাধিক কার্ড (one() থেকে পাওয়া); kind: "card" (ডিফল্ট ডিজাইন) / "card1" / "card2" / "card3" / "story"
  // ২০২৬-১১-০৩: ৪টা ট্যাব (কার্ড ১, ২, ৩, স্টোরি)। বাছা ট্যাব আগে আঁকা হয়, বাকি ৩টা পরপর চুপচাপ। সবগুলোর ডাউনলোড লিংক আছে।
  // অন্য ডিজাইনের জন্য সার্ভারে বাড়তি জায়গা লাগে না: সব ডিজাইন একই সংরক্ষিত তথ্য + ছবি থেকে অ্যাডমিনের ফোনে আঁকা হয়।
  var PK = [["card1", "🪪 কার্ড ১"], ["card2", "🪪 কার্ড ২"], ["card3", "🪪 কার্ড ৩"], ["story", "📱 স্টোরি (৯:১৬)"]];
  function dk() { return "card" + (1 + (window.mcCardDefault ? +window.mcCardDefault() || 0 : 0)); }
  // ভাগ ৩: admin-export.js (📦 ZIP) এই ফাংশনগুলো ব্যবহার করে — কার্ড আঁকার কোড একটাই থাকে, নকল হয় না
  window.MCA_CARDX = { one: one, drawFull: drawFull, fbm: fbm, fbChip: fbChip, pm: pm, pmSet: pmSet, pmUse: pmUse, pmBar: pmBar, PML: PML, rankInfo: rankInfo, rkExtra: rkExtra, asciiName: asciiName, dk: dk, PK: PK, sessions: function () { return (BO.length ? BO : BDEF).slice(); } };

  // ---------- র‍্যাংক লেখা (ভাগ ৫): অটো হিসাব + নিচে "‹ আগের | নেক্সট ›" ----------
  // অটো = mc2_scores (সবার সেরা ফল) থেকে এখনই গণনা: বিভাগ-র‍্যাংক ও সব-বিভাগ-র‍্যাংক আলাদা। সাইটের best() এর মতোই: স্কোর বেশি আগে, সমান হলে আগে-খেলা আগে।
  // নতুন SQL লাগে না।
  var SCC = null;
  function loadScores() {
    if (SCC && Date.now() - SCC.t < 300000) return SCC.p;
    var base = "mc2_scores?select=name,dept,score,created_at&order=score.desc,created_at.asc", out = [];
    function page(q, off) { return M.A(q + "&limit=1000&offset=" + off).then(function (a) { a = a || []; out = out.concat(a); return a.length >= 1000 && off < 29000 ? page(q, off + 1000) : out; }); }
    var p = page(base + "&hidden=eq.false", 0).catch(function () { out = []; return page(base, 0); }).then(function (rows) {
      var m = {}; rows.forEach(function (r) { var k = String(r.name || "").toLowerCase() + "|" + (r.dept || ""); if (!m[k] || r.score > m[k].score) m[k] = r; });
      var L = Object.keys(m).map(function (k) { return { k: k, d: m[k].dept || "", s: m[k].score || 0, t: +new Date(m[k].created_at) || 0 }; }).sort(function (a, b) { return b.s - a.s || a.t - b.t; });
      var all = {}, dep = {}, dn = {}; L.forEach(function (r, i) { all[r.k] = i + 1; dn[r.d] = (dn[r.d] || 0) + 1; dep[r.k] = dn[r.d]; });
      return { all: all, dep: dep, dn: dn, n: L.length };
    });
    SCC = { t: Date.now(), p: p }; p.catch(function () { if (SCC && SCC.p === p) SCC = null; }); return p;
  }
  function rankInfo(c) {
    var dept = (c.rec && c.rec.dept) || c.dept || "", nm = String((c.rec && c.rec.name) || c.name || "").toLowerCase(), k = nm + "|" + dept;
    return loadScores().then(function (S) { return S.all[k] ? { or: S.all[k], dr: S.dep[k], n: S.n, dn: S.dn[dept] || 0 } : null; }).catch(function () { return null; });
  }
  function rkExtra(info, st) {
    var ex = {}; if (info) { ex.drank = info.dr; ex.rank = info.or; }
    if (st.mode === "d1") ex.rankLabel = { cap: "বিভাগে", val: "১ম" };
    else if (st.mode === "a1") ex.rankLabel = { cap: "সব বিভাগে", val: "১ম" };
    else if (st.mode === "c") { if (st.cap || st.val) ex.rankLabel = { cap: st.cap, val: st.val }; }
    else if (info && info.or === 1) ex.rankLabel = { cap: "সব বিভাগে", val: "১ম" }; // অটো: সবার মধ্যে ১ম হলে পরিষ্কার "সব বিভাগে ১ম", নইলে "বিভাগে N"
    return ex;
  }
  function designSeq() {
    var ks = PK.map(function (k) { return k[0]; }), r = [];
    try { var o = window.mcCardOrder && window.mcCardOrder().all; if (o) o.forEach(function (i) { var k = "card" + (i + 1); if (ks.indexOf(k) >= 0 && r.indexOf(k) < 0) r.push(k); }); } catch (e) {}
    ks.forEach(function (k) { if (r.indexOf(k) < 0 && k !== "story") r.push(k); }); r.push("story"); return r;
  }
  function popup(cards, kind, device, at) {
    var el = document.createElement("div"); el.className = "cxm"; var E = M.esc, cur = at > 0 && at < cards.length ? at : 0, K = !kind || kind === "card" ? dk() : kind, urls = [], seq = 0, RSM = {}, lov = null, lfk = "", DSQ = designSeq(), RO = [["auto", "অটো"], ["d1", "বিভাগে ১ম"], ["a1", "সব বিভাগে ১ম"], ["c", "কাস্টম"]];
    function rst(c) { var k = String(c.id != null ? c.id : cards.indexOf(c)); return RSM[k] || (RSM[k] = { mode: "auto", cap: "", val: "" }); }
    function close() { seq++; urls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); el.remove(); }
    function paintB() {
      var c = cards[cur];
      el.innerHTML = '<div class="cxb2"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' + E(c.name) + (window.MCG ? window.MCG.tag(c.device, c.name) : "") + ' <span class="sm">· মার্ক ' + bd(c.score) + '</span></b><button class="l s" type="button" id="cxX">✕ বন্ধ</button></div>' +
        (cards.length > 1 ? '<select id="cxS">' + cards.map(function (x, i) { return '<option value="' + i + '"' + (i === cur ? " selected" : "") + ">" + E(x.name) + " — " + bd(x.score) + "</option>"; }).join("") + "</select>" : "") +
        '<div class="cxt">' + PK.map(function (k) { return '<button class="l s' + (K === k[0] ? " on" : "") + '" type="button" data-k="' + k[0] + '">' + k[1] + "</button>"; }).join("") + (window.MCWC ? '<button class="l s" type="button" id="cxWc" style="background:#7c3aed;color:#fff">🏆 বিজয়ী কার্ড <span id="cxWn"></span></button>' : "") + (device && window.MCA_USER ? '<button class="l s" type="button" id="cxI">ℹ️ ইনফো</button>' : "") + "</div>" +
        pmBar() + mkBar() + '<div class="sm" id="cxFb"></div>' + (c.id != null ? '<div class="act"><button class="d s" type="button" id="cxDel">🗑 এই কার্ড ডিলিট</button></div>' : "") + '<div id="cxL"></div><div class="sm" id="cxW">⏳ কার্ড আঁকা হচ্ছে…</div><img id="cxP" alt="" hidden>' +
        '<div class="cxt cxn" style="justify-content:center;align-items:center"><button class="l s" type="button" id="cxPv">‹ আগের</button><span class="sm" id="cxPos" style="font-weight:700">ডিজাইন ' + bd(Math.max(0, DSQ.indexOf(K)) + 1) + "/" + bd(DSQ.length) + (cards.length > 1 ? " · কার্ড " + bd(cur + 1) + "/" + bd(cards.length) : "") + '</span><button class="l s" type="button" id="cxNx">নেক্সট ›</button></div>' +
        (function () { var st = rst(c); return '<div class="sm" style="display:grid;gap:6px"><label>🏅 র‍্যাংক লেখা <select id="cxR">' + RO.map(function (o) { return '<option value="' + o[0] + '"' + (st.mode === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
          (st.mode === "c" ? '<div style="display:flex;gap:6px;flex-wrap:wrap"><input id="cxRc" placeholder="ছোট লেখা (যেমন: সব বিভাগে)" maxlength="20" value="' + E(st.cap) + '" style="flex:1;min-width:120px"><input id="cxRv" placeholder="বড় লেখা (যেমন: ১ম)" maxlength="8" value="' + E(st.val) + '" style="flex:1;min-width:90px"><button class="s" type="button" id="cxRok">✔ বসাও</button></div>' : "") + '<div id="cxRh">⏳ র‍্যাংক হিসাব হচ্ছে…</div></div>'; })() +
        PK.map(function (k) { return '<a class="cxd off" id="cxA_' + k[0] + '" download="' + E(fnm(c, k[0])) + '">⏳ ' + k[1] + " ডাউনলোড (PNG)</a>"; }).join("") +
        (c.kb != null ? '<div class="sm">💾 সার্ভারে এই কার্ড নিচ্ছে ≈ <b>' + bd(c.kb) + " KB</b>" + (c.thumb_kb != null ? " (ছোট প্রিভিউ " + bd(c.thumb_kb) + " KB + ছবি " + bd(c.photo_kb) + " KB)" : "") + "। ৩টা ডিজাইন ও স্টোরি ডাউনলোডে সার্ভারে বাড়তি <b>০ KB</b> লাগে — সব ফোনেই আঁকা হয়; PNG-র KB ওপরের বোতামে (আঁকা হলে) দেখা যাবে।</div>" : "") +
        '<div class="sm">ডাউনলোড না হলে ওপরের ছবিতে চেপে ধরে (লং-প্রেস) "ছবি সেভ করুন" দিন।</div></div>';
      el.querySelector("#cxX").onclick = close;
      Array.prototype.forEach.call(el.querySelectorAll("[data-mk]"), function (b) { b.onclick = function () { mkOpen(c, +b.dataset.mk); }; });
      Array.prototype.forEach.call(el.querySelectorAll("[data-pm]"), function (b) { b.onclick = function () { pmSet(b.dataset.pm); paintB(); }; });
      fbm(c).then(function (m) { var n = el.querySelector("#cxFb"); if (n && cards[cur] === c) n.innerHTML = "📣 ফেসবুক পেইজে ছাড়ার অনুমতি: " + (m ? "<b>" + FBL[m] + "</b>" : "<b>উত্তর দেয়নি</b>") + (m === "photo" ? " — ছবি সহ চলবে" : m === "nophoto" ? " — শুধু <b>ছবি ছাড়া</b> ছাড়ুন (ওপরে 🙈 বাছুন)" : " — অনুমতি নেই, ডাউনলোডে <b>ছবি ছাড়া</b> বাছুন") + (pm() === "auto" ? " (📣 অটো: এই কার্ডে " + (m === "photo" ? "ছবি আছে)" : "ছবি নেই)") : ""); });
      // অ্যাডমিন সবসময় লোগো বাছতে পারে (সব লোগো + নিজের লেখা অক্ষর); বাছাই শুধু এই প্রিভিউ/ডাউনলোডের জন্য, সার্ভারের কার্ডে কিছু বদলায় না
      if (window.mcLogo && window.mcLogo.picker) window.mcLogo.load().then(function () { var h = el.querySelector("#cxL"); if (h && !h.firstChild) h.appendChild(window.mcLogo.picker({ admin: true, init: lov, focus: lfk, onChange: function (ov, fk) { lov = ov; lfk = fk; paintB(); } })); lfk = ""; }).catch(function () {});
      var dbn = el.querySelector("#cxDel"); if (dbn) dbn.onclick = function () { delIds([c.id]).then(function () { return M.A("mc2_cards?select=id&id=eq." + encodeURIComponent(c.id)); }).then(function (L) { if (!L || !L.length) close(); }).catch(noop); };
      var si = el.querySelector("#cxS"); if (si) si.onchange = function () { cur = +si.value; paintB(); };
      var ib = el.querySelector("#cxI"); if (ib) ib.onclick = function () { window.MCA_USER(device); };
      // 🏆 বিজয়ী কার্ড: পাশে বাছা কার্ডের সংখ্যা; চাপলে এই ইউজারের বিজয়ী কার্ড (না থাকলে "নাই") + "🛠 বানান"
      var wb = el.querySelector("#cxWc");
      if (wb) {
        var winfo = { name: c.name, device: device || c.device || "", dept: (c.rec && c.rec.dept) || c.dept || "", batch: (c.rec && c.rec.batch) || c.batch || "", score: c.score };
        var wset = function () { window.MCWC.count(winfo).then(function (X) { var sp = el.querySelector("#cxWn"); if (sp) sp.textContent = "(" + (X.L.length ? bd(X.n) + (X.L.every(function (x) { return window.MCWC.isMan(x.r); }) ? " · বিজয়ী নন" : "") : "নাই") + ")"; }).catch(noop); };
        wset(); wb.onclick = function () { window.MCWC.open(winfo, wset); };
      }
      var tgo = function (d) { var D = DSQ.length, n = cards.length, p = cur * D + Math.max(0, DSQ.indexOf(K)) + d; p = ((p % (n * D)) + n * D) % (n * D); var nc = Math.floor(p / D), nk = DSQ[p % D]; if (nc === cur) { var tb = el.querySelector('.cxt [data-k="' + nk + '"]'); if (tb) tb.click(); else { K = nk; paintB(); } var ps = el.querySelector("#cxPos"); if (ps) ps.textContent = "ডিজাইন " + bd(DSQ.indexOf(nk) + 1) + "/" + bd(D) + (n > 1 ? " · কার্ড " + bd(cur + 1) + "/" + bd(n) : ""); } else { cur = nc; K = nk; paintB(); } };
      el.querySelector("#cxPv").onclick = function () { tgo(-1); }; el.querySelector("#cxNx").onclick = function () { tgo(1); };
      var rs = el.querySelector("#cxR"); if (rs) rs.onchange = function () { rst(c).mode = rs.value; paintB(); };
      var rok = el.querySelector("#cxRok"); if (rok) rok.onclick = function () { var s0 = rst(c); s0.cap = (el.querySelector("#cxRc").value || "").trim(); s0.val = (el.querySelector("#cxRv").value || "").trim(); paintB(); };
      var my = ++seq, RX = rankInfo(c).then(function (inf) { var h = el.querySelector("#cxRh"); if (my === seq && h) { var o = window.mcOrd || String; h.textContent = inf ? "অটো হিসাব: বিভাগে " + o(inf.dr) + " (বিভাগে মোট " + bd(inf.dn) + " জন) · সব বিভাগে " + o(inf.or) + " (মোট " + bd(inf.n) + " জন) → অটোতে কার্ডে লেখা: " + (inf.or === 1 ? "সব বিভাগে ১ম" : "বিভাগে " + o(inf.dr)) : "অটো হিসাব পাওয়া যায়নি (স্কোর তালিকায় এই নাম+বিভাগ মেলেনি) — কার্ডে জমা থাকা র‍্যাংকই বসছে।"; } return rkExtra(inf, rst(c)); }), order = [K].concat(PK.map(function (k) { return k[0]; }).filter(function (k) { return k !== K; })), shown = {};
      Array.prototype.forEach.call(el.querySelectorAll(".cxt [data-k]"), function (b) { b.onclick = function () { K = b.dataset.k; var u = shown[K]; if (u) { var i = el.querySelector("#cxP"), w = el.querySelector("#cxW"); if (i) { i.src = u; i.hidden = false; } if (w) w.hidden = true; Array.prototype.forEach.call(el.querySelectorAll(".cxt [data-k]"), function (x) { x.classList.toggle("on", x.dataset.k === K); }); } else { paintB(); } }; });
      order.reduce(function (pr, k) {
        return pr.then(function () {
          if (my !== seq) return;
          return RX.then(function (X) { return drawFull(c, k, X, lov); }).then(function (cv) { return blobOf(cv).then(function (b) {
            if (my !== seq || !b) return; var u = URL.createObjectURL(b); urls.push(u); shown[k] = u;
            var a = el.querySelector("#cxA_" + k), nmk = (PK.filter(function (x) { return x[0] === k; })[0] || [0, k])[1]; if (a) { a.href = u; a.classList.remove("off"); a.textContent = "⬇ " + nmk + " ডাউনলোড (PNG, " + bd(Math.round(b.size / 1024)) + " KB)"; }
            if (k === K) { var i = el.querySelector("#cxP"), w = el.querySelector("#cxW"); if (i) { i.src = u; i.hidden = false; } if (w) w.hidden = true; }
          }); });
        });
      }, Promise.resolve()).catch(function (e) { var w = el.querySelector("#cxW"); if (w) { w.hidden = false; w.textContent = "দেখানো যায়নি: " + (e && e.message ? e.message : e); } });
    }
    document.body.appendChild(el); el.onclick = function (e) { if (e.target === el) close(); }; paintB();
  }
  function loadCards(q) { return M.A("mc2_cards?" + q + "&select=id,device,name,score,rec,photo&order=score.desc,updated_at.desc&limit=10").then(function (L) { (L || []).slice(0, 4).forEach(function (c) { if (c && c.id != null && !(CC[String(c.id)] && fresh(CC[String(c.id)].t))) { cput(c.id, Promise.resolve(c)); dbPut(String(c.id), c); } }); return L; }); }
  function big(id, kind, kb) {
    var ix = -1; ROWS.forEach(function (r, n) { if (String(r.id) === String(id)) ix = n; });
    one(id).then(function (c) { if (kb && kb.kb != null) c = Object.assign({}, c, kb); popup([c], kind, c.device); if (ix >= 0) prefetch(ix); }).catch(M.fail);
  }

  // ---------- কার্ড ডিলিট: অনেক ফিল্টার দিয়ে খুঁজে একসাথে (বা বেছে) ডিলিট ----------
  // নতুন SQL লাগে না: বিদ্যমান mc2_cards টেবিলে অ্যাডমিনের DELETE অনুমতি দিয়েই চলে। ১০,০০০+ কার্ডেও ফিল্টার সার্ভারেই হয়।
  var DEL = { open: false, opt: null, cur: null, rows: [], sel: {}, all: false, pg: 0, total: 0, busy: false, err: "", legacy: false, kbAll: null, meter: null, unlock: false }, CPP = 50;
  // নতুন (২০২৬-১১-০৩): ভিউ mc2_cards_adm (KB + আইডেন্টিফায়ার)। ভিউ না থাকলে (SQL চালানো হয়নি) পুরোনো টেবিল mc2_cards ও পুরোনো ফিল্টারে চলে (legacy)।
  var SRC = function () { return DEL.legacy ? "mc2_cards" : "mc2_cards_adm"; };
  var KL = [["male", "ছাত্র"], ["female", "ছাত্রী"], ["sir", "স্যার"], ["mam", "ম্যাম"], ["visitor", "ভিজিটর"]], GL = [["m", "পুরুষ (ছাত্র/স্যার)"], ["f", "মহিলা (ছাত্রী/ম্যাম)"], ["x", "ভিজিটর"], ["__none", "অজানা"]];
  var klab = function (k) { var r = KL.filter(function (x) { return x[0] === k; })[0]; return r ? r[1] : (k || "—"); };
  var DF0 = { q: "", dev: "", dept: "", batch: "", smin: "", smax: "", omin: "", omax: "", oldp: "", oldc: "", newp: "", newc: "", dt: "updated_at", from: "", to: "", show: "", photo: "", rmin: "", rmax: "", sort: "new",
    kind: "", club: "", title: "", gender: "", pin: "no", ever: "", form: "", kbmin: "", kbmax: "", pmin: "", pmax: "", dcmin: "", dcmax: "", scmin: "", plmin: "", plmax: "", ip: "", model: "", nx: "" }, DF = Object.assign({}, DF0);
  var DPRE = [["", "যেকোনো"], ["1", "১ দিন"], ["3", "৩ দিন"], ["7", "৭ দিন"], ["14", "১৪ দিন"], ["30", "৩০ দিন"], ["60", "৬০ দিন"], ["90", "৯০ দিন"], ["180", "১৮০ দিন"], ["365", "১ বছর"], ["c", "✏️ কাস্টম দিন…"]];
  function en(v) { return String(v == null ? "" : v).replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }).trim(); }
  function nm(v) { v = en(v); return v === "" || isNaN(+v) ? null : +v; }
  function days(p, c) { var v = p === "c" ? nm(c) : nm(p); return v && v > 0 ? v : null; }
  function opt(v, l, cur) { return '<option value="' + M.esc(v) + '"' + (String(cur) === String(v) ? " selected" : "") + ">" + M.esc(l) + "</option>"; }
  function dl(x) { try { return window.MC && window.MC.deptLabel ? window.MC.deptLabel(x) : x; } catch (e) { return x; } }
  function cdQS(f) { // ফিল্টার → PostgREST প্যারামিটার (শুরুতে &)। L = পুরোনো টেবিল (ভিউ-এর কলাম নেই)
    var p = "", enc = encodeURIComponent, now = Date.now(), v, d, L = DEL.legacy, col = f.dt === "created_at" ? "created_at" : "updated_at", iso = function (t) { return new Date(t).toISOString(); };
    var cl = function (s) { return String(s).trim().replace(/[*,()%]/g, ""); }, rng = function (c, lo, hi) { var x; if ((x = nm(lo)) != null) p += "&" + c + "=gte." + x; if ((x = nm(hi)) != null) p += "&" + c + "=lte." + x; };
    v = cl(f.q); if (v) p += "&name=ilike." + enc("*" + v + "*");
    v = cl(f.nx); if (v) p += "&name=ilike." + enc(v.replace(/_/g, "\\_")); // হুবহু নাম (বড়-ছোট হাত নির্বিশেষে) — একই ব্যক্তির কার্ড খুলতে
    v = cl(f.dev); if (v) p += "&device=eq." + enc(v);
    if (f.dept) p += "&dept=eq." + enc(f.dept);
    if (f.batch === "__none") p += "&batch=is.null"; else if (f.batch) p += "&batch=eq." + enc(f.batch);
    rng("score", f.smin, f.smax); rng("ok", f.omin, f.omax);
    if ((d = days(f.oldp, f.oldc))) p += "&" + col + "=lt." + enc(iso(now - d * 864e5));
    if ((d = days(f.newp, f.newc))) p += "&" + col + "=gte." + enc(iso(now - d * 864e5));
    if (f.from && !isNaN(new Date(f.from))) p += "&" + col + "=gte." + enc(iso(new Date(f.from)));
    if (f.to && !isNaN(new Date(f.to))) p += "&" + col + "=lte." + enc(iso(new Date(f.to)));
    if (f.show === "1") p += "&show=eq.true"; else if (f.show === "0") p += "&show=eq.false";
    if (f.pin === "no") p += "&pinned=eq.false"; else if (f.pin === "only") p += "&pinned=eq.true";
    if (f.gender === "__none") p += "&gender=is.null"; else if (f.gender) p += "&gender=eq." + enc(f.gender);
    if (L) { if (f.photo === "1") p += "&photo=not.is.null"; else if (f.photo === "0") p += "&photo=is.null"; }
    else {
      if (f.photo === "1") p += "&has_photo=eq.true"; else if (f.photo === "0") p += "&has_photo=eq.false";
      if (f.kind === "__none") p += "&kind=is.null"; else if (f.kind) p += "&kind=eq." + enc(f.kind);
      if (f.club === "__none") p += "&club=is.null"; else if (f.club) p += "&club=eq." + enc(f.club);
      if (f.title === "__none") p += "&title=is.null"; else if (f.title) p += "&title=eq." + enc(f.title);
      rng("kb", f.kbmin, f.kbmax); rng("pct", f.pmin, f.pmax); rng("dev_cards", f.dcmin, ""); rng("dev_cards", "", f.dcmax); rng("same_cards", f.scmin, ""); rng("plays", f.plmin, f.plmax);
      v = cl(f.ip); if (v) p += "&ip=eq." + enc(v);
      v = cl(f.model); if (v) p += "&model=ilike." + enc("*" + v + "*");
      if (f.form === "1") p += "&has_form=eq.true"; else if (f.form === "0") p += "&has_form=eq.false";
      if (f.ever === "1") p += "&top_times=gte.1"; else if (f.ever === "0") p += "&top_times=eq.0";
    }
    var rmin = nm(f.rmin), rmax = nm(f.rmax), ranked = (rmin != null && rmin > 0) || (rmax != null && rmax > 0), ofs0 = ranked && rmin > 0 ? rmin - 1 : 0, cap = ranked && rmax > 0 ? Math.max(0, rmax - ofs0) : 0;
    var ord = ranked ? "score.desc,updated_at.desc,id.asc" : { new: "updated_at.desc,id.desc", old: "updated_at.asc,id.asc", hi: "score.desc,updated_at.desc,id.asc", lo: "score.asc,updated_at.desc,id.asc", name: "name.asc,id.asc", kbhi: L ? "updated_at.desc,id.desc" : "kb.desc,id.asc", kblo: L ? "updated_at.desc,id.desc" : "kb.asc,id.asc", dev: L ? "updated_at.desc,id.desc" : "dev_cards.desc,device.asc,updated_at.asc,id.asc" }[f.sort] || "updated_at.desc,id.desc";
    return { p: p, ranked: ranked, ofs0: ofs0, cap: cap, ord: ord };
  }
  function cdDesc(f) { // কনফার্মে দেখানোর জন্য ফিল্টারের সারকথা
    var a = [], v;
    if (f.q.trim()) a.push("নাম: " + f.q.trim()); if (f.dev.trim()) a.push("ডিভাইস: " + f.dev.trim()); if (f.nx && f.nx.trim()) a.push("ব্যক্তি (হুবহু নাম): " + f.nx.trim()); if (f.dept) a.push("বিভাগ: " + dl(f.dept)); if (f.batch) a.push("সেশন: " + (f.batch === "__none" ? "নেই" : f.batch));
    if (f.smin !== "" || f.smax !== "") a.push("স্কোর " + (f.smin !== "" ? bd(en(f.smin)) : "০") + "–" + (f.smax !== "" ? bd(en(f.smax)) : "১০০০"));
    if (f.omin !== "" || f.omax !== "") a.push("সঠিক উত্তর " + (f.omin !== "" ? bd(en(f.omin)) : "০") + "–" + (f.omax !== "" ? bd(en(f.omax)) : "∞"));
    if ((v = days(f.oldp, f.oldc))) a.push(bd(v) + " দিনের চেয়ে পুরোনো"); if ((v = days(f.newp, f.newc))) a.push("শেষ " + bd(v) + " দিনের মধ্যের");
    if (f.from) a.push("থেকে " + f.from.replace("T", " ")); if (f.to) a.push("পর্যন্ত " + f.to.replace("T", " "));
    if (f.show) a.push(f.show === "1" ? "টপ-৩ ছবি দেখানো" : "টপ-৩ ছবি লুকানো"); if (f.photo) a.push(f.photo === "1" ? "ছবি আছে" : "ছবি নেই");
    if (f.rmin !== "" || f.rmax !== "") a.push("র‍্যাংক " + (f.rmin !== "" ? bd(en(f.rmin)) : "১") + "–" + (f.rmax !== "" ? bd(en(f.rmax)) : "শেষ"));
    if (f.kind) a.push("পরিচয়: " + klab(f.kind)); if (f.club) a.push("ক্লাব: " + (f.club === "__none" ? "নেই" : f.club)); if (f.title) a.push("টাইটেল: " + (f.title === "__none" ? "নেই" : f.title));
    if (f.gender) a.push("জেন্ডার: " + ((GL.filter(function (x) { return x[0] === f.gender; })[0] || [0, f.gender])[1]));
    if (f.pin === "no") a.push("টপ-৩ সুরক্ষিত বাদ"); else if (f.pin === "only") a.push("শুধু টপ-৩ সুরক্ষিত"); if (f.ever) a.push(f.ever === "1" ? "টপ-৩-এ কখনো উঠেছে" : "টপ-৩-এ কখনো ওঠেনি"); if (f.form) a.push(f.form === "1" ? "ফর্ম জমা দিয়েছে" : "ফর্ম জমা দেয়নি");
    if (f.kbmin !== "" || f.kbmax !== "") a.push("কার্ডের সাইজ " + (f.kbmin !== "" ? bd(en(f.kbmin)) : "০") + "–" + (f.kbmax !== "" ? bd(en(f.kbmax)) : "∞") + " KB");
    if (f.pmin !== "" || f.pmax !== "") a.push("শতকরা " + (f.pmin !== "" ? bd(en(f.pmin)) : "০") + "–" + (f.pmax !== "" ? bd(en(f.pmax)) : "১০০"));
    if (f.dcmin !== "" || f.dcmax !== "") a.push("এক ডিভাইসে কার্ড " + (f.dcmin !== "" ? bd(en(f.dcmin)) : "১") + "–" + (f.dcmax !== "" ? bd(en(f.dcmax)) : "∞")); if (f.scmin !== "") a.push("একই ব্যক্তির কার্ড " + bd(en(f.scmin)) + "+");
    if (f.plmin !== "" || f.plmax !== "") a.push("খেলা " + (f.plmin !== "" ? bd(en(f.plmin)) : "০") + "–" + (f.plmax !== "" ? bd(en(f.plmax)) : "∞") + " বার"); if (f.ip.trim()) a.push("আইপি: " + f.ip.trim()); if (f.model.trim()) a.push("ফোন মডেল: " + f.model.trim());
    return a.length ? a.join(" · ") : "কোনো ফিল্টার নেই (সব কার্ড)";
  }
  function cdFilterHtml() {
    var E = M.esc, o = DEL.opt || { d: [], b: [], c: [], t: [] }, depts = [].concat((window.MC && window.MC.depts) || []); o.d.forEach(function (x) { if (depts.indexOf(x) < 0) depts.push(x); });
    var sel = function (id, list, cur) { return '<select id="' + id + '">' + list.map(function (x) { return opt(x[0], x[1], cur); }).join("") + "</select>"; };
    var dctl = function (k, t) { return '<label>' + t + '<div class="act" style="gap:4px;flex-wrap:nowrap">' + sel("cd-" + k + "p", DPRE, DF[k + "p"]) + '<input id="cd-' + k + 'c" type="number" min="1" placeholder="দিন" style="width:80px' + (DF[k + "p"] === "c" ? "" : ";display:none") + '" value="' + E(DF[k + "c"]) + '"></div></label>'; };
    var num = function (id, t, ph, step) { return '<label>' + t + '<input id="cd-' + id + '" type="number" min="0"' + (step ? ' step="' + step + '"' : "") + (ph ? ' placeholder="' + ph + '"' : "") + ' value="' + E(DF[id]) + '"></label>'; };
    var txt = function (id, t, ph) { return '<label>' + t + '<input id="cd-' + id + '" maxlength="60"' + (ph ? ' placeholder="' + ph + '"' : "") + ' value="' + E(DF[id]) + '"></label>'; };
    var hd = function (t) { return '<div class="sm" style="grid-column:1/-1;font-weight:700;border-top:1px solid var(--bd);padding-top:6px">' + t + "</div>"; };
    var nv = function (h) { return DEL.legacy ? "" : h; };
    return '<div class="row">' +
      hd("🪪 কে (পরিচয়)") +
      txt("q", "নাম (যেকোনো অংশ)") +
      '<label>বিভাগ' + sel("cd-dept", [["", "সব বিভাগ"]].concat(depts.map(function (x) { return [x, dl(x)]; })), DF.dept) + "</label>" +
      '<label>সেশন' + sel("cd-batch", [["", "সব সেশন"], ["__none", "— (সেশন নেই)"]].concat(o.b.map(function (x) { return [x, x]; })), DF.batch) + "</label>" +
      nv('<label>পরিচয় (ছাত্র/ছাত্রী/স্যার/ম্যাম/ভিজিটর)' + sel("cd-kind", [["", "সব"]].concat(KL), DF.kind) + "</label>") +
      '<label>জেন্ডার' + sel("cd-gender", [["", "সব"]].concat(GL), DF.gender) + "</label>" +
      nv('<label>ক্লাব' + sel("cd-club", [["", "সব"], ["__none", "— (ক্লাব নেই)"]].concat((o.c || []).map(function (x) { return [x, x]; })), DF.club) + "</label>") +
      nv('<label>টাইটেল' + sel("cd-title", [["", "সব"], ["__none", "— (টাইটেল নেই)"]].concat((o.t || []).map(function (x) { return [x, x]; })), DF.title) + "</label>") +
      hd("📱 কোন ডিভাইস / নেটওয়ার্ক") +
      txt("dev", "ডিভাইস আইডি (হুবহু)") + nv(txt("ip", "আইপি (হুবহু)")) + nv(txt("model", "ফোন মডেল (যেকোনো অংশ)", "যেমন SM-A")) +
      nv(num("dcmin", "এক ডিভাইসে কার্ড — থেকে", "যেমন ২১") + num("dcmax", "এক ডিভাইসে কার্ড — পর্যন্ত", "")) + nv(num("scmin", "একই ব্যক্তির কার্ড — কমপক্ষে", "যেমন ৩")) +
      hd("🎯 স্কোর ও খেলা") +
      '<label>স্কোর থেকে (০–১০০০)<input id="cd-smin" type="number" min="0" max="1000" value="' + E(DF.smin) + '"></label><label>স্কোর পর্যন্ত<input id="cd-smax" type="number" min="0" max="1000" value="' + E(DF.smax) + '"></label>' +
      nv(num("pmin", "শতকরা থেকে (০–১০০)") + num("pmax", "শতকরা পর্যন্ত")) +
      '<label>সঠিক উত্তর থেকে<input id="cd-omin" type="number" min="0" value="' + E(DF.omin) + '"></label><label>সঠিক উত্তর পর্যন্ত<input id="cd-omax" type="number" min="0" value="' + E(DF.omax) + '"></label>' +
      '<label>র‍্যাংক থেকে (স্কোর অনুযায়ী)<input id="cd-rmin" type="number" min="1" placeholder="যেমন ১" value="' + E(DF.rmin) + '"></label><label>র‍্যাংক পর্যন্ত<input id="cd-rmax" type="number" min="1" placeholder="যেমন ১০০" value="' + E(DF.rmax) + '"></label>' +
      nv(num("plmin", "মোট খেলা — থেকে (বার)", "যেমন ১") + num("plmax", "মোট খেলা — পর্যন্ত (বার)")) +
      hd("💾 সাইজ ও সুরক্ষা") +
      nv(num("kbmin", "কার্ডের সাইজ থেকে (KB)", "যেমন ৫০", "0.1") + num("kbmax", "কার্ডের সাইজ পর্যন্ত (KB)", "", "0.1")) +
      '<label>টপ-৩ সুরক্ষিত কার্ড' + sel("cd-pin", (DEL.unlock ? [["no", "বাদ দিয়ে (নিরাপদ)"], ["", "সব সহ"], ["only", "শুধু টপ-৩ সুরক্ষিত"]] : [["no", "🔒 বাদ (লকড — নিচের 🔓 বাটনে আনলক)"]]), DF.pin) + "</label>" +
      nv('<label>টপ-৩-এ কখনো উঠেছে?' + sel("cd-ever", [["", "সব"], ["1", "হ্যাঁ"], ["0", "না"]], DF.ever) + "</label>") +
      nv('<label>ফর্ম জমা দিয়েছে?' + sel("cd-form", [["", "সব"], ["1", "হ্যাঁ"], ["0", "না"]], DF.form) + "</label>") +
      '<label>টপ-৩-এ ছবি' + sel("cd-show", [["", "সব"], ["1", "দেখানো"], ["0", "লুকানো"]], DF.show) + "</label>" +
      '<label>কার্ডে নিজের ছবি' + sel("cd-photo", [["", "সব"], ["1", "আছে"], ["0", "নেই"]], DF.photo) + "</label>" +
      hd("🕒 সময়") +
      '<label>কোন সময় ধরব' + sel("cd-dt", [["updated_at", "শেষ আপডেট/খেলার সময়"], ["created_at", "প্রথম তৈরির সময়"]], DF.dt) + "</label>" +
      dctl("old", "কত দিনের পুরোনো কার্ড") + dctl("new", "শেষ কত দিনের মধ্যের কার্ড") +
      '<label>কাস্টম সময়: থেকে<input id="cd-from" type="datetime-local" value="' + E(DF.from) + '"></label><label>কাস্টম সময়: পর্যন্ত<input id="cd-to" type="datetime-local" value="' + E(DF.to) + '"></label>' +
      '<label>সাজানো' + sel("cd-sort", [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["hi", "স্কোর বেশি আগে"], ["lo", "স্কোর কম আগে"], ["name", "নাম (ক-অ)"]].concat(DEL.legacy ? [] : [["kbhi", "সাইজ (KB) বেশি আগে"], ["kblo", "সাইজ (KB) কম আগে"], ["dev", "এক ডিভাইসে কার্ড বেশি আগে"]]), DF.sort) + "</label></div>" +
      '<div class="act" style="margin:8px 0"><button type="button" data-a="cd_go">🔎 ফিল্টার করে দেখুন</button><button type="button" class="l" data-a="cd_reset">♻️ রিসেট</button>' + (DEL.unlock ? '<button type="button" class="l" data-a="cd_lock">🔒 টপ-৩ আবার লক</button>' : '<button type="button" class="l" data-a="cd_unlock">🔓 টপ-৩ আনলক</button>') + '</div>' +
      '<div class="sm">সব ফিল্টার একসাথে মিলিয়ে (AND) কাজ করে। র‍্যাংক দিলে অন্য ফিল্টারের ভেতরে স্কোর অনুযায়ী (বেশি → কম) র‍্যাংক ধরা হয় এবং সাজানো ঘরটি কাজ করে না। "টপ-৩ সুরক্ষিত" ঘরে শুরুতেই "বাদ দিয়ে" বাছা — টপ-৩-এ ওঠা কার্ড ভুলে মুছে যাবে না; মুছতে চাইলে আগে নিচের "🔓 টপ-৩ আনলক" বাটন চাপুন।' + (DEL.legacy ? '<br><b>⚠️ নতুন SQL (supabase-pending-all.sql) চালানো হয়নি — তাই KB ও আইডেন্টিফায়ার ফিল্টারগুলো এখন বন্ধ, শুধু পুরোনো ফিল্টার চলছে।</b>' : "") + "</div>";
  }
  function cdSelN() { return DEL.all ? DEL.total : Object.keys(DEL.sel).length; }
  function cdSelKb() { if (DEL.legacy) return null; if (DEL.all) return DEL.kbAll; var s = 0; Object.keys(DEL.sel).forEach(function (k) { s += +DEL.sel[k] || 0; }); return s; }
  function kbTxt(k) { return k == null ? "…" : k >= 1024 ? bd((k / 1024).toFixed(2)) + " MB" : bd(Math.round(k * 10) / 10) + " KB"; }
  function cdResHtml() {
    var E = M.esc, c = DEL.cur; if (DEL.busy) return '<p class="sm">⏳ কাজ চলছে… পেজ বন্ধ করবেন না।</p>';
    if (DEL.err) return '<p class="sm warn">❌ ' + E(DEL.err) + "</p>";
    if (!c) return '<p class="sm">ফিল্টার বেছে "🔎 ফিল্টার করে দেখুন" চাপুন।</p>';
    var pages = Math.max(1, Math.ceil(DEL.total / CPP)), n = cdSelN(), base = c.ofs0 + DEL.pg * CPP, L = DEL.legacy, sk = cdSelKb();
    var h = '<div class="it"><b>মিলেছে: ' + bd(DEL.total) + "টি কার্ড" + (L ? "" : " · মোট ≈ " + kbTxt(DEL.kbAll)) + "</b><div class=\"sm\">" + E(cdDesc(c.f)) + "</div></div>" +
      '<div class="act" style="margin:6px 0"><span class="sm"><b>বাছা: ' + bd(n) + "টি" + (L ? "" : " · ≈ " + kbTxt(sk)) + (DEL.all ? " (ফিল্টারের সব)" : "") + '</b></span><button type="button" class="l s" data-a="cd_pg_all">☑ এই পেজের সব</button><button type="button" class="l s" data-a="cd_all"' + (DEL.total ? "" : " disabled") + '>☑ ফিল্টারের সব ' + bd(DEL.total) + 'টি</button><button type="button" class="l s" data-a="cd_none">⬜ বাছা বাদ</button><button type="button" class="d" data-a="cd_del"' + (n ? "" : " disabled") + '>🗑 বাছা ' + bd(n) + "টি ডিলিট</button></div>";
    h += DEL.rows.map(function (r, i) {
      var on = DEL.all || DEL.sel[r.id], th = JPG.test(r.thumb || "") ? r.thumb : "", ex = [];
      if (!L) {
        ex.push("পরিচয় " + klab(r.kind)); if (r.club) ex.push("ক্লাব " + r.club); if (r.title) ex.push("টাইটেল " + r.title); if (r.model) ex.push("📱 " + r.model); if (r.ip) ex.push("আইপি " + r.ip);
        ex.push("খেলা " + bd(r.plays || 0) + " বার"); ex.push("ডিভাইসে কার্ড " + bd(r.dev_cards || 0)); if ((r.same_cards || 0) > 1) ex.push("একই ব্যক্তির কার্ড " + bd(r.same_cards)); ex.push(r.has_form ? "📝 ফর্ম জমা দিয়েছে" : "ফর্ম জমা নেই");
        if (r.top_times > 0) ex.push("🏆 টপ-৩-এ উঠেছে (সেরা র‍্যাংক " + bd(r.top_best || "—") + ")");
      }
      return '<label class="it" style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" style="flex:none;width:20px;height:20px;min-width:20px;padding:0;margin:0" data-cdi="' + r.id + '" data-kb="' + (r.kb == null ? "" : r.kb) + '"' + (on ? " checked" : "") + (DEL.all ? " disabled" : "") + '>' +
        '<button type="button" data-a="big" data-id="' + r.id + '"' + (r.kb == null ? "" : ' data-kb="' + r.kb + '" data-tk="' + (r.thumb_kb == null ? "" : r.thumb_kb) + '" data-pk="' + (r.photo_kb == null ? "" : r.photo_kb) + '"') + ' title="কার্ড প্রিভিউ ও ডাউনলোড" style="padding:0;flex:none;width:64px;background:#fff;border:1px solid var(--bd);border-radius:8px;overflow:hidden;line-height:0">' + (th ? '<img src="' + th + '" alt="" style="width:100%;height:auto;display:block">' : "<span class=\"sm\">কার্ড</span>") + '</button>' +
        '<span style="min-width:0"><b>' + bd(base + i + 1) + ". </b><b data-dev=\"" + E(r.device || "") + "\">" + E(r.name) + "</b>" + (r.pinned ? " 📌" : "") + (L || r.kb == null ? "" : ' <span class="tag">💾 ' + kbTxt(r.kb) + "</span>") + '<div class="sm">' + E(dl(r.dept)) + " · " + E(r.batch || "—") + " · স্কোর <b>" + bd(r.score) + "</b> · ✔ " + bd(r.ok == null ? 0 : r.ok) + "/" + bd(r.total == null ? 0 : r.total) + (r.show ? "" : " · 🙈 টপ-৩-এ ছবি লুকানো") + (ex.length ? "<br>" + E(ex.join(" · ")) : "") + (!L && r.kb != null ? "<br>সাইজ: প্রিভিউ " + kbTxt(r.thumb_kb) + " + ছবি " + kbTxt(r.photo_kb) : "") + "<br>আপডেট: " + E(new Date(r.updated_at).toLocaleString("bn-BD")) + " · তৈরি: " + E(new Date(r.created_at).toLocaleDateString("bn-BD")) + "</div></span></label>";
    }).join("") || '<p class="sm">এই ফিল্টারে কোনো কার্ড নেই।</p>';
    if (pages > 1) h += '<div class="act" style="justify-content:center;margin-top:8px"><button class="l s" type="button" data-a="cd_pv"' + (DEL.pg ? "" : " disabled") + '>‹ আগের</button><span class="sm">পেজ ' + bd(DEL.pg + 1) + " / " + bd(pages) + '</span><button class="l s" type="button" data-a="cd_nx"' + (DEL.pg < pages - 1 ? "" : " disabled") + '>নেক্সট ›</button></div>';
    return h;
  }
  function cdPaintRes() { var r = M.$("#cdr"); if (r) r.innerHTML = cdResHtml(); }
  function cdMeterHtml() {
    var m = DEL.meter; if (!m) return DEL.legacy ? "" : '<p class="sm">💾 জায়গার হিসাব আনা হচ্ছে…</p>';
    return '<div class="it"><b>💾 সব কার্ড মিলিয়ে ≈ ' + bd(m.mb) + " MB</b><div class=\"sm\">কার্ড " + bd(m.n) + "টি (" + bd(m.devices) + "টি ডিভাইসে) · গড়ে প্রতি কার্ড ≈ " + bd(m.avg_kb) + " KB (সবচেয়ে ছোট " + bd(m.min_kb) + " · সবচেয়ে বড় " + bd(m.max_kb) + " KB)<br>ছবিসহ " + bd(m.photo_n) + "টি, গড় ≈ " + bd(m.avg_photo_kb) + " KB · ছবি ছাড়া গড় ≈ " + bd(m.avg_nophoto_kb) + " KB" + (m.dev_over_20 > 0 ? "<br>⚠️ " + bd(m.dev_over_20) + "টি ডিভাইসে ২০-এর বেশি কার্ড আছে (আগে জমা) — \"এক ডিভাইসে কার্ড\" ঘরে ২১ লিখে খুঁজে হাতে মুছুন।" : "") + "</div></div>";
  }
  function cdPaintAll() { var p = M.$("#cdp"); if (!p) return; p.innerHTML = '<div class="it" style="border:2px solid var(--bad,#c0392b)"><div><b>🗑 কার্ড ডিলিট — ফিল্টার দিয়ে খুঁজে একসাথে</b></div><div class="sm">ডিলিট করলে কার্ড ও ছবি বিনে যায়। ইউজারের শেষ কার্ড মুছলে তার স্কোর, উত্তর, এন্ট্রি, ভিজিটর রেকর্ড ও টপ-হিস্টরিও বিনে যায় (বিন থেকে সব একসাথে ফেরানো যায়; শুধু স্ক্রিনশটের ছবি-ফাইল ফেরে না)। অটো-ডিলিটের কোনো নিয়ম এতে বদলায় না — এটা শুধু আপনার হাতে মোছার জন্য।</div><div id="cdm">' + cdMeterHtml() + '</div><div id="cdv">' + dvHtml() + '</div><div id="cdf">' + cdFilterHtml() + '</div><div id="cdr">' + cdResHtml() + "</div></div>"; }
  function cdRead() {
    ["q", "dev", "dept", "batch", "smin", "smax", "omin", "omax", "oldp", "oldc", "newp", "newc", "dt", "from", "to", "show", "photo", "rmin", "rmax", "sort", "kind", "club", "title", "gender", "pin", "ever", "form", "kbmin", "kbmax", "pmin", "pmax", "dcmin", "dcmax", "scmin", "plmin", "plmax", "ip", "model"].forEach(function (k) { var e = M.$("#cd-" + k); if (e) DF[k] = e.value; }); if (!DEL.unlock) DF.pin = "no";
    ["old", "new"].forEach(function (k) { var c = M.$("#cd-" + k + "c"); if (c) c.style.display = DF[k + "p"] === "c" ? "" : "none"; });
  }

  // ---------- ডিভাইস অনুযায়ী তালিকা (২০২৬-১১-০৪): এক ডিভাইসে কয়টা কার্ড → "📂 খুলুন" চাপলে ওই ডিভাইসের কার্ড ফিল্টার-প্যানেলে আসে ----------
  // নতুন SQL লাগে না (supabase-new-20261103.sql-এর ভিউ mc2_cards_adm-এর dev_cards কলাম ব্যবহার করে)। শুধু দেখা/খোলা; মোছা আগের ফিল্টার-ডিলিট দিয়েই।
  var DV = { open: false, min: "2", sort: "n", rows: [], busy: false, err: "", show: 30, trunc: false, sel: {}, kd: {} };
  var DKN = { card: "🪪 ডিফল্ট কার্ড", card1: "🪪 কার্ড ১", card2: "🪪 কার্ড ২", card3: "🪪 কার্ড ৩", story: "📱 স্টোরি (৯:১৬)" };
  function dvKn(k) { return k ? (DKN[k] || k) : "🪪 ধরন লেখা নেই"; }
  function dvGroup(L) { // ডিভাইস → ভিন্ন ব্যক্তি (নাম+বিভাগ+সেশন) → কার্ডের ধরন
    var m = {}, o = [];
    L.forEach(function (x) {
      var g = m[x.device]; if (!g) { g = m[x.device] = { device: x.device, n: +x.dev_cards || 0, kb: 0, pin: 0, names: [], pers: [], pm: {} }; o.push(g); }
      g.kb += +x.kb || 0; if (x.pinned) g.pin++; if (g.names.indexOf(x.name) < 0) g.names.push(x.name);
      var pk = String(x.name || "").toLowerCase() + "|" + (x.dept || "") + "|" + (x.batch || ""), q = g.pm[pk];
      if (!q) { q = g.pm[pk] = { name: x.name, dept: x.dept || "", batch: x.batch || "", n: 0, kb: 0, kinds: {} }; g.pers.push(q); }
      q.n++; q.kb += +x.kb || 0; var kk = x.kind || "__none", kd = q.kinds[kk]; if (!kd) kd = q.kinds[kk] = { n: 0, best: 0 }; kd.n++; if ((+x.score || 0) > kd.best) kd.best = +x.score || 0;
    });
    o.forEach(function (g) { g.pers.sort(function (a, b) { return b.n - a.n || b.kb - a.kb; }); });
    return o;
  }
  function dvHtml() {
    if (DEL.legacy) return "";
    var E = M.esc, h = '<div class="it"><div class="act"><button type="button" class="l" data-a="cd_devs">📱 ' + (DV.open ? "ডিভাইস তালিকা বন্ধ করুন" : "এক ডিভাইসে কয়টা কার্ড — তালিকা দেখুন") + "</button></div>";
    if (!DV.open) return h + "</div>";
    var MN = [["1", "১ বা বেশি (সব ডিভাইস)"], ["2", "২ বা বেশি"], ["5", "৫ বা বেশি"], ["10", "১০ বা বেশি"], ["20", "২০ বা বেশি"], ["21", "২১ বা বেশি (সীমার বেশি)"]], SO = [["n", "কার্ড বেশি আগে"], ["kb", "সাইজ (KB) বেশি আগে"]];
    h += '<div class="row"><label>কমপক্ষে কত কার্ড<select id="dv-min">' + MN.map(function (x) { return opt(x[0], x[1], DV.min); }).join("") + '</select></label><label>সাজানো<select id="dv-sort">' + SO.map(function (x) { return opt(x[0], x[1], DV.sort); }).join("") + "</select></label></div>";
    if (DV.busy) return h + '<p class="sm">⏳ ডিভাইসের তালিকা আনা হচ্ছে…</p></div>';
    if (DV.err) return h + '<p class="sm warn">❌ ' + E(DV.err) + "</p></div>";
    var R = DV.rows.slice().sort(function (a, b) { return DV.sort === "kb" ? b.kb - a.kb : b.n - a.n || b.kb - a.kb; }), tot = 0; R.forEach(function (g) { tot += g.n; });
    h += '<div class="sm"><b>' + bd(R.length) + "টি ডিভাইস · মোট " + bd(tot) + "টি কার্ড</b>" + (DV.trunc ? " (প্রথম ৫০০০ কার্ড পর্যন্ত গোনা হয়েছে)" : "") + "। যেটা খুশি \"📂 খুলুন\" চাপুন — তখন ওই ডিভাইসের কার্ড নিচে ফিল্টারসহ আসবে; দিন, স্কোর, KB ইত্যাদি ড্রপডাউন বদলে \"🔎 ফিল্টার করে দেখুন\" দিয়ে ছেঁকে টিক দিয়ে ডিলিট করুন।</div>";
    h += R.slice(0, DV.show).map(function (g) {
      var si = DV.sel[g.device], pr = si !== undefined && si !== "" ? g.pers[+si] : null, ps = "";
      ps = '<div class="row"><label>👥 এই ডিভাইসে ' + bd(g.pers.length) + " জন ভিন্ন ব্যক্তি<select id=\"dv-p~" + E(g.device) + '">' + opt("", "— ব্যক্তি বেছে নিন —", pr ? si : "") + g.pers.map(function (q, i) { return opt(String(i), q.name + " · " + dl(q.dept) + (q.batch ? " · " + q.batch : "") + " — " + bd(q.n) + " কার্ড", pr ? si : ""); }).join("") + "</select></label>";
      if (pr) {
        var ks = Object.keys(pr.kinds), kv = DV.kd[g.device] || "";
        ps += '<label>🪪 এই ব্যক্তির কোন কার্ড<select id="dv-k~' + E(g.device) + '">' + opt("", "সব কার্ড (" + bd(pr.n) + "টি)", kv) + ks.map(function (k) { return opt(k, dvKn(k === "__none" ? "" : k) + " — " + bd(pr.kinds[k].n) + "টি, সর্বোচ্চ স্কোর " + bd(pr.kinds[k].best), kv); }).join("") + "</select></label>";
      }
      ps += "</div>";
      return '<div class="it"><div style="display:flex;gap:8px;justify-content:space-between;align-items:center"><span style="min-width:0"><b>📱 ' + E(String(g.device).slice(0, 8)) + "…</b> <span class=\"tag\">" + bd(g.n) + " কার্ড</span>" + (g.n > 20 ? ' <span class="tag">⚠️ ২০-র বেশি</span>' : "") + ' <span class="tag">💾 ' + kbTxt(g.kb) + "</span>" + (g.pin ? ' <span class="tag">📌 ' + bd(g.pin) + "</span>" : "") + '</span><button type="button" class="l s" data-a="cd_dopen" data-dev="' + E(g.device) + '">📂 পুরো ডিভাইস খুলুন</button></div>' + ps + (pr ? '<div class="act"><button type="button" class="s" data-a="cd_popen" data-dev="' + E(g.device) + '">📂 শুধু এই ব্যক্তির ' + (DV.kd[g.device] ? "ওই ধরনের " : "") + "কার্ড খুলুন</button></div>" : "") + "</div>";
    }).join("") || '<p class="sm">এই শর্তে কোনো ডিভাইস নেই।</p>';
    if (R.length > DV.show) h += '<div class="act" style="justify-content:center"><button type="button" class="l s" data-a="cd_dmore">আরও ' + bd(Math.min(30, R.length - DV.show)) + "টি ডিভাইস দেখান</button></div>";
    return h + "</div>";
  }
  function dvPaint() { var x = M.$("#cdv"); if (x) x.innerHTML = dvHtml(); }
  function dvLoad() {
    DV.busy = true; DV.err = ""; dvPaint();
    return M.A("mc2_cards_adm?select=device,dev_cards,kb,name,dept,batch,pinned,score,kind&dev_cards=gte." + (+DV.min || 1) + "&order=dev_cards.desc,device.asc&limit=5000").then(function (L) { L = L || []; DV.trunc = L.length >= 5000; DV.rows = dvGroup(L); DV.show = 30; DV.busy = false; dvPaint(); })
      .catch(function (e) { DV.busy = false; DV.err = e && e.message ? e.message : String(e); dvPaint(); });
  }
  function dvChg(t) { if (t.id.indexOf("dv-p~") === 0) { var d1 = t.id.slice(5); DV.sel[d1] = t.value; DV.kd[d1] = ""; return dvPaint(); } if (t.id.indexOf("dv-k~") === 0) { DV.kd[t.id.slice(5)] = t.value; return dvPaint(); } if (t.id === "dv-min") { DV.min = t.value; return dvLoad(); } if (t.id === "dv-sort") { DV.sort = t.value; DV.show = 30; return dvPaint(); } }
  function cdOpen() {
    DEL.open = !DEL.open; var p = M.$("#cdp"); if (!p) return;
    if (!DEL.open) { DEL.unlock = false; p.innerHTML = ""; return; }
    cdPaintAll(); p.oninput = p.onchange = function (e) { if (e.target && e.target.id && e.target.id.indexOf("dv-") === 0) return dvChg(e.target); if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-cdi")) return cdTick(e.target); cdRead(); };
    if (!DEL.legacy && !DEL.meter) M.rpc("mc2_cards_kb_stats", {}).then(function (m) { DEL.meter = m; var x = M.$("#cdm"); if (x) x.innerHTML = cdMeterHtml(); }).catch(function () { DEL.legacy = DEL.legacy || false; var x = M.$("#cdm"); if (x) x.innerHTML = ""; });
    if (DEL.opt) return;
    M.A(SRC() + "?select=dept,batch" + (DEL.legacy ? "" : ",club,title") + "&limit=20000").then(function (L) { // আসল ডেটা থেকে বিভাগ/সেশন/ক্লাব/টাইটেলের তালিকা
      var d = {}, b = {}, cl = {}, tt = {}; (L || []).forEach(function (x) { if (x.dept) d[x.dept] = 1; if (x.batch) b[x.batch] = 1; if (x.club) cl[x.club] = 1; if (x.title) tt[x.title] = 1; });
      DEL.opt = { d: Object.keys(d).sort(), b: Object.keys(b).sort(), c: Object.keys(cl).sort(), t: Object.keys(tt).sort() }; var f = M.$("#cdf"); if (f) { cdRead(); f.innerHTML = cdFilterHtml(); }
    }).catch(function (e) { if (cdNoView(e) && !DEL.legacy) { DEL.legacy = true; DEL.opt = null; cdPaintAll(); cdOpenOpt(); } });
  }
  function cdOpenOpt() { DEL.open = !DEL.open; cdOpen(); }
  function cdNoView(e) { return /PGRST20[0-9]|42P01|42703|404|does not exist|Could not find|not find the/i.test(String(e && e.message ? e.message : e)); }
  function cdTick(t) { var id = t.dataset.cdi; if (t.checked) DEL.sel[id] = t.dataset.kb === "" || t.dataset.kb == null ? 0 : +t.dataset.kb; else delete DEL.sel[id]; cdPaintRes(); }
  function cdCount(p) {
    return M.raw(M.base + "/rest/v1/" + SRC() + "?select=id" + p + "&limit=1", { headers: { Prefer: "count=exact" } }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 120)); });
      var m = /\/(\d+)$/.exec(r.headers.get("Content-Range") || ""); return m ? +m[1] : 0;
    });
  }
  function cdLoad(pg) {
    var c = DEL.cur, left = DEL.total - pg * CPP, lim = Math.min(CPP, left); DEL.pg = pg;
    if (lim <= 0) { DEL.rows = []; return Promise.resolve(cdPaintRes()); }
    var cols = "id,device,name,dept,batch,score,ok,total,show,pinned,updated_at,created_at" + (DEL.legacy ? "" : ",thumb,kb,thumb_kb,photo_kb,kind,club,title,model,ip,plays,dev_cards,same_cards,has_form,top_times,top_best");
    return M.A(SRC() + "?select=" + cols + "&order=" + c.ord + "&limit=" + lim + "&offset=" + (c.ofs0 + pg * CPP) + c.p).then(function (L) { DEL.rows = L || []; DEL.err = ""; cdPaintRes(); });
  }
  function cdKbSum(q) { // ফিল্টারের সব কার্ডের মোট KB (শুধু kb কলাম, ১০০০ করে)
    var c = DEL.cur, tot = 0, got = 0;
    return (function next(off) {
      var want = Math.min(1000, DEL.total - got); if (want <= 0) return Promise.resolve(tot);
      return M.A(SRC() + "?select=kb&order=" + c.ord + "&limit=" + want + "&offset=" + (c.ofs0 + off) + c.p).then(function (L) { L = L || []; L.forEach(function (x) { tot += +x.kb || 0; }); got += L.length; if (!L.length) return tot; return next(off + L.length); });
    })(0);
  }
  function cdGo() {
    cdRead(); var q = cdQS(DF); DEL.cur = { p: q.p, ranked: q.ranked, ofs0: q.ofs0, cap: q.cap, ord: q.ord, f: Object.assign({}, DF) }; DEL.sel = {}; DEL.all = false; DEL.err = ""; DEL.rows = []; DEL.total = 0; DEL.kbAll = null; DEL.busy = true; cdPaintRes(); var mine = DEL.cur;
    return cdCount(q.p).then(function (n) { var t = Math.max(0, n - q.ofs0); if (q.cap) t = Math.min(t, q.cap); DEL.total = t; DEL.busy = false; return cdLoad(0); }).then(function () {
      if (DEL.legacy || DEL.cur !== mine) return; return cdKbSum().then(function (s) { if (DEL.cur !== mine) return; DEL.kbAll = s; cdPaintRes(); }).catch(function () {});
    }).catch(function (e) {
      if (cdNoView(e) && !DEL.legacy) { DEL.legacy = true; DEL.opt = null; DEL.meter = null; DF = Object.assign({}, DF0, { q: DF.q, dev: DF.dev, dept: DF.dept, batch: DF.batch, smin: DF.smin, smax: DF.smax, omin: DF.omin, omax: DF.omax, rmin: DF.rmin, rmax: DF.rmax, pin: DF.pin, show: DF.show, photo: DF.photo, dt: DF.dt, from: DF.from, to: DF.to, sort: "new" }); DEL.busy = false; cdPaintAll(); cdOpenOpt(); return cdGo(); }
      DEL.busy = false; DEL.err = "ফিল্টার চলেনি: " + (e && e.message ? e.message : e); cdPaintRes();
    });
  }
  function cdIds() { // ফিল্টারের সব কার্ডের আইডি (র‍্যাংক-সীমা মানতে এক এক হাজার করে)
    var c = DEL.cur, out = [];
    return (function next(off) {
      var want = Math.min(1000, DEL.total - out.length); if (want <= 0) return Promise.resolve(out);
      return M.A(SRC() + "?select=id&order=" + c.ord + "&limit=" + want + "&offset=" + (c.ofs0 + off) + c.p).then(function (L) { L = L || []; L.forEach(function (x) { out.push(x.id); }); if (!L.length) return out; return next(off + L.length); });
    })(0);
  }
  function cdRm(url) { // DELETE; মুছে যাওয়া সংখ্যা ফেরত
    return M.raw(url, { method: "DELETE", headers: { Prefer: "return=minimal,count=exact" } }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + " " + t.slice(0, 120)); });
      var m = /\/(\d+)$/.exec(r.headers.get("Content-Range") || ""); return m ? +m[1] : 0;
    });
  }
  function cdDelete(b) {
    var n = cdSelN(), c = DEL.cur; if (!n || !c) return;
    var sk = cdSelKb(); if (c.f.pin !== "no") { var pt = prompt('⚠️ টপ-৩ সুরক্ষিত কার্ড মুছতে যাচ্ছেন। নিশ্চিত করতে "মুছব" লিখুন'); if (pt === null) return; if (String(pt).trim() !== "মুছব") { alert("লেখা মেলেনি — কিছুই মোছা হয়নি।"); return; } } if (!confirm("⚠️ " + bd(n) + "টি কার্ড (ও ছবি) মুছে বিনে যাবে (ইউজারের শেষ কার্ড হলে তার স্কোর, উত্তর, এন্ট্রি, ভিজিটর রেকর্ডও)" + (sk == null ? "" : " (≈ " + kbTxt(sk) + " জায়গা খালি হবে)") + "।\nফিল্টার: " + cdDesc(c.f) + (DEL.all ? "\n(ফিল্টারের সব কার্ড)" : "\n(হাতে বাছা কার্ড)") + (c.f.pin === "only" || c.f.pin === "" ? "\n⚠️ টপ-৩ সুরক্ষিত কার্ডও এই তালিকায় থাকতে পারে।" : "") + "\n\n🗑 বিন থেকে সব একসাথে ফেরানো যাবে (শুধু স্ক্রিনশটের ছবি-ফাইল ফেরে না)। এগোবেন?")) return;
    if (n > 20) { var t = prompt("নিশ্চিত করতে মুছতে-যাওয়া কার্ডের সংখ্যা ঠিক ঠিক লিখুন: " + bd(n)); if (t === null) return; if (nm(t) !== n) { alert("সংখ্যা মেলেনি — কিছুই মোছা হয়নি।"); return; } }
    DEL.busy = true; cdPaintRes(); var gone = 0, base = M.base + "/rest/v1/mc2_cards?";
    var job = (DEL.all ? cdIds() : Promise.resolve(Object.keys(DEL.sel).map(Number))).then(function (ids) {
        var ch = [], i; for (i = 0; i < ids.length; i += 150) ch.push(ids.slice(i, i + 150));
        return ch.reduce(function (pr, g) { return pr.then(function () { return cdRm(base + "id=in.(" + g.join(",") + ")"); }).then(function (k) { gone += k || g.length; }); }, Promise.resolve());
      });
    job.then(function () { DEL.opt = null; DEL.meter = null; return cclear().catch(noop); }).then(function () { alert("✅ " + bd(gone) + "টি কার্ড মুছেছে।"); DEL.busy = false; DEL.sel = {}; DEL.all = false; return Promise.all([cdGo(), loadPg(Math.min(PG, Math.max(0, Math.ceil((TOT - gone) / LIM) - 1))).then(function () { paintKeep(); })]); })
      .catch(function (e) { DEL.busy = false; DEL.err = "থেমে গেছে (" + bd(gone) + "টি মুছেছে): " + (e && e.message ? e.message : e); cdPaintRes(); });
  }
  function paintKeep() { paint(); } // paint() নিজেই খোলা ডিলিট-প্যানেল আবার আঁকে
  function cdClick(b, a) {
    if (a === "cd_x") return cdOpen();
    if (a === "cd_go") return cdGo();
    if (a === "cd_unlock") { var ut = prompt('টপ-৩ সুরক্ষিত কার্ড আনলক করতে "আনলক" লিখুন'); if (ut === null) return; if (String(ut).trim() !== "আনলক") { alert("লেখা মেলেনি — লকড আছে।"); return; } cdRead(); DEL.unlock = true; var fu = M.$("#cdf"); if (fu) fu.innerHTML = cdFilterHtml(); return cdPaintRes(); }
    if (a === "cd_lock") { cdRead(); DEL.unlock = false; DF.pin = "no"; var fl = M.$("#cdf"); if (fl) fl.innerHTML = cdFilterHtml(); return cdPaintRes(); }
    if (a === "cd_devs") { DV.open = !DV.open; dvPaint(); return DV.open ? dvLoad() : undefined; }
    if (a === "cd_dmore") { DV.show += 30; return dvPaint(); }
    if (a === "cd_popen") { var pd = b.dataset.dev, pg = null; DV.rows.forEach(function (g) { if (g.device === pd) pg = g; }); var pp = pg && DV.sel[pd] !== undefined && DV.sel[pd] !== "" ? pg.pers[+DV.sel[pd]] : null; if (!pp) return; DF = Object.assign({}, DF0, { dev: pd, nx: pp.name, dept: pp.dept, batch: pp.batch || "__none", kind: DV.kd[pd] || "", pin: DEL.unlock ? "" : "no" }); var fp = M.$("#cdf"); if (fp) { fp.innerHTML = cdFilterHtml(); if (fp.scrollIntoView) fp.scrollIntoView({ block: "start" }); } return cdGo(); }
    if (a === "cd_dopen") { DF = Object.assign({}, DF0, { dev: b.dataset.dev, pin: DEL.unlock ? "" : "no" }); var fd = M.$("#cdf"); if (fd) { fd.innerHTML = cdFilterHtml(); if (fd.scrollIntoView) fd.scrollIntoView({ block: "start" }); } return cdGo(); }
    if (a === "cd_reset") { DEL.unlock = false; DF = Object.assign({}, DF0); DEL.cur = null; DEL.rows = []; DEL.sel = {}; DEL.all = false; DEL.err = ""; var f = M.$("#cdf"); if (f) f.innerHTML = cdFilterHtml(); return cdPaintRes(); }
    if (a === "cd_pg_all") { DEL.rows.forEach(function (r) { DEL.sel[r.id] = +r.kb || 0; }); return cdPaintRes(); }
    if (a === "cd_all") { DEL.all = true; return cdPaintRes(); }
    if (a === "cd_none") { DEL.all = false; DEL.sel = {}; return cdPaintRes(); }
    if (a === "cd_pv") return cdLoad(Math.max(0, DEL.pg - 1)).catch(M.fail);
    if (a === "cd_nx") return cdLoad(DEL.pg + 1).catch(M.fail);
    if (a === "cd_del") return cdDelete(b);
  }

  function click(e) {
    if (e.target.dataset && e.target.dataset.sel != null) return selTick(e.target);
    var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a, id = b.dataset.id;
    if (a === "vw") { VW = b.dataset.v === "i" ? "i" : "t"; try { localStorage.setItem("mca_cardvw", VW); } catch (x) {} return paint(); }
    if (a === "tgl") return rowInfo(id); // নতুন: ভেসে ওঠা তথ্য-পপআপ (আগের ইনলাইন প্যানেলের কোড panelHtml() ফাইলে আছে)
    if (a === "sall") return selAll(true);
    if (a === "snone") return selAll(false);
    if (a === "sdel") return delIds(Object.keys(SELC));
    if (a.slice(0, 3) === "cd_") return cdClick(b, a);
    if (a === "go") return go();
    if (a === "shx") { // 📄 এই পাতার (ফিল্টার-করা) কার্ড থেকে বেছে একই পেজে ২/৩/৫/৭…
      if (!window.MCSheet) { alert("শিট সিস্টেম (admin-sheet.js) লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
      if (!ROWS.length) { alert("তালিকায় কোনো কার্ড নেই।"); return; }
      return window.MCSheet.open(ROWS.map(function (r) { return { key: r.id, name: r.name, device: r.device, dept: r.dept, batch: r.batch, score: r.score }; }), { kind: "card", title: "বিজয়ী কার্ড" });
    }
    if (a === "zipx") { if (window.MCEXP) return window.MCEXP.open(); alert("ZIP সিস্টেম (admin-export.js) লোড হয়নি — পেজ রিফ্রেশ করুন।"); return; }
    if (a === "fav") { if (FAV[id]) delete FAV[id]; else FAV[id] = 1; favSave(); var fo = F.fav; if (fo && !FAV[id]) { ROWS = ROWS.filter(function (r) { return String(r.id) !== String(id); }); TOT = Math.max(0, TOT - 1); } return paint(); }
    if (a === "pgx") { if (!b.disabled) more(+b.dataset.p); return; }
    if (a === "cc") { cclear().then(function () { note("মনে-রাখা কার্ড মুছে গেছে (মেমোরি ও ব্রাউজার স্টোরেজ থেকে)।"); }); return; }
    if (a === "big") return big(id, "card", b.dataset.kb ? { kb: +b.dataset.kb, thumb_kb: b.dataset.tk ? +b.dataset.tk : null, photo_kb: b.dataset.pk ? +b.dataset.pk : null } : null);
    if (a === "dl") return big(id, b.dataset.k);
    if (a === "show") return M.A("mc2_cards?id=eq." + encodeURIComponent(id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ show: b.dataset.v === "1" }) }).then(function () { ROWS.forEach(function (r) { if (String(r.id) === id) r.show = b.dataset.v === "1"; }); paint(); }).catch(M.fail);
    if (a === "del") return delIds([id]);
  }


  // ---------- নতুন: লেখা ভিউতে সারিতে ক্লিক → ভেসে ওঠা পপআপ: সব তথ্য + পাশে ছোট কার্ড প্রিভিউ ----------
  var RLAB = { club: "ক্লাব", pct: "শতকরা", bestPlace: "সেরা জায়গা", title: "পদবী", ok: "সঠিক উত্তর", total: "মোট প্রশ্ন", rank: "র‍্যাংক", drank: "বিভাগে র‍্যাংক", kind: "ধরন", gender: "জেন্ডার", site: "সাইট", game: "খেলা" };
  function rowInfo(id) {
    var E = M.esc, r = null; ROWS.forEach(function (x) { if (String(x.id) === String(id)) r = x; }); if (!r) return;
    var old = document.querySelector(".cxm[data-ri]"); if (old) old.remove();
    var el = document.createElement("div"); el.className = "cxm"; el.dataset.ri = "1";
    var th = JPG.test(r.thumb || "") ? r.thumb : "";
    function row(k, v) { return v == null || v === "" ? "" : '<div style="display:flex;gap:8px;padding:3px 0;border-bottom:1px dashed var(--bd)"><span class="sm" style="flex:none;min-width:84px">' + E(k) + '</span><b style="min-width:0;overflow-wrap:anywhere">' + E(String(v)) + "</b></div>"; }
    function infoHtml(rec) {
      rec = rec || {}; var u = {};
      var h = row("নাম", r.name) + row("বিভাগ", dl(r.dept)) + row("সেশন", r.batch || "—") + row("মার্ক", bd(r.score)) + row("শতকরা", r.pct != null ? bd(r.pct) + "%" : (rec.pct != null ? bd(rec.pct) + "%" : "")) +
        row("সঠিক / মোট", rec.ok != null ? bd(rec.ok) + " / " + bd(rec.total != null ? rec.total : "—") : "") + row("ক্লাব", rec.club) + row("সেরা জায়গা", rec.bestPlace) + row("পদবী", rec.title) + row("র‍্যাংক", rec.rank != null ? bd(rec.rank) : "") +
        row("বিভাগে র‍্যাংক", rec.drank != null ? bd(rec.drank) : "") + row("ধরন", rec.kind ? klab(rec.kind) : "") + row("জেন্ডার", rec.gender) +
        row("শেষ আপডেট", r.updated_at ? new Date(r.updated_at).toLocaleString("bn-BD") : "") + row("টপ ৩-এ ছবি", r.show ? "দেখানো হচ্ছে" : "লুকানো") + row("ডিভাইস আইডি", r.device ? String(r.device).slice(0, 14) + (String(r.device).length > 14 ? "…" : "") : "") + row("কার্ড আইডি", r.id);
      ["name", "dept", "batch", "score", "pct", "ok", "total", "club", "bestPlace", "title", "rank", "drank", "kind", "gender", "device"].forEach(function (k) { u[k] = 1; });
      var extra = Object.keys(rec).filter(function (k) { var v = rec[k]; return !u[k] && v != null && typeof v !== "object" && String(v).length <= 80 && !/^(lg|lgo|photo|thumb|qr)$/.test(k); }).map(function (k) { return row(RLAB[k] || k, k === "ts" ? new Date(+v(k)).toLocaleString("bn-BD") : rec[k]); function v(x) { return rec[x]; } }).join("");
      return h + (extra ? '<details style="margin-top:6px"><summary class="sm" style="cursor:pointer">আরও তথ্য</summary>' + extra + "</details>" : "");
    }
    function paintR() {
      el.innerHTML = '<div class="cxb2" style="width:min(96vw,620px)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' + E(r.name) + (window.MCG ? window.MCG.tag(r.device, r.name) : "") + '</b><button class="l s" type="button" id="riX">✕ বন্ধ</button></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start"><div id="riI" style="flex:1 1 220px;min-width:0">' + infoHtml(el._rec) + '</div><button type="button" id="riP" title="বড় করে দেখুন" style="flex:0 0 auto;width:min(38%,170px);min-width:120px;padding:0;background:#fff;border:1px solid var(--bd);line-height:0;border-radius:10px;overflow:hidden;cursor:pointer">' + (th ? '<img src="' + th + '" alt="" style="width:100%;height:auto;display:block">' : '<span class="sm" style="line-height:1.4;display:block;padding:12px">প্রিভিউ নেই</span>') + "</button></div>" +
        '<div class="act" style="display:flex;gap:6px;flex-wrap:wrap"><button class="s" type="button" id="riB">🪪 বড় প্রিভিউ / ডাউনলোড</button><button class="s" type="button" id="riS">📱 স্টোরি</button><button class="l s" type="button" id="riV">' + (r.show ? "🙈 টপ ৩-এ ছবি লুকান" : "👁 ছবি দেখান") + '</button><button class="d s" type="button" id="riD">🗑 ডিলিট</button></div></div>';
      el.querySelector("#riX").onclick = function () { el.remove(); };
      el.querySelector("#riP").onclick = el.querySelector("#riB").onclick = function () { big(id, "card"); };
      el.querySelector("#riS").onclick = function () { big(id, "story"); };
      el.querySelector("#riV").onclick = function () { M.A("mc2_cards?id=eq." + encodeURIComponent(id), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ show: !r.show }) }).then(function () { r.show = !r.show; paintR(); paint(); }).catch(M.fail); };
      el.querySelector("#riD").onclick = function () { delIds([id]).then(function () { if (!ROWS.some(function (x) { return String(x.id) === String(id); })) el.remove(); }); };
    }
    el.onclick = function (e) { if (e.target === el) el.remove(); };
    document.body.appendChild(el); paintR();
    one(id).then(function (c) { if (!el.isConnected) return; el._rec = c && c.rec && typeof c.rec === "object" ? c.rec : null; var h = el.querySelector("#riI"); if (h) h.innerHTML = infoHtml(el._rec); }).catch(function () {});
  }
  // ---------- নতুন: যেখানেই ইউজারের নাম, পাশে "🪪 কার্ড" ও "ℹ️ ইনফো" ----------
  // নামের চিহ্ন: data-uu="ডিভাইস আইডি" (আগে থেকেই আছে), data-dev="ডিভাইস আইডি", data-sid="স্কোরের আইডি" (ডিভাইস সার্ভার থেকে বের করা হয়)।
  var SEL = "[data-uu],[data-dev],[data-sid]";
  function enhance(root) {
    if (!root || !root.querySelectorAll) return;
    var L = root.matches && root.matches(SEL) ? [root] : []; L = L.concat([].slice.call(root.querySelectorAll(SEL)));
    L.forEach(function (el) {
      if (el.dataset.cx || (el.closest && el.closest(".cxm,.cxbtns"))) return; el.dataset.cx = "1";
      var d = el.dataset.uu || el.dataset.dev || "", sid = el.dataset.sid || "", nm = String(el.textContent || "").trim().slice(0, 60);
      var w = document.createElement("span"); w.className = "cxbtns";
      [["c", "🪪 কার্ড"], ["i", "ℹ️ ইনফো"]].forEach(function (x) {
        var b = document.createElement("button"); b.type = "button"; b.className = "l s"; b.dataset.cx = x[0]; b.dataset.xdev = d; b.dataset.xsid = sid; b.dataset.xname = nm; b.textContent = x[1]; w.appendChild(b);
      });
      el.insertAdjacentElement("afterend", w);
    });
  }
  function resolveDev(dev, sid) {
    if (dev) return Promise.resolve(dev);
    if (!sid) return Promise.resolve("");
    return window.MCA.A("mc2_scores?id=eq." + encodeURIComponent(sid) + "&select=device&limit=1").then(function (a) { return a && a[0] ? a[0].device : ""; });
  }
  function note(t) { var el = document.createElement("div"); el.className = "cxm"; el.innerHTML = '<div class="cxb2"><div>' + window.MCA.esc(t) + '</div><button type="button" id="cxN">ঠিক আছে</button></div>'; document.body.appendChild(el); el.onclick = function (e) { if (e.target === el || e.target.id === "cxN") el.remove(); }; }
  function openFor(dev, name) {
    M = window.MCA; var nm = String(name || "").toLowerCase();
    var q = dev ? "device=eq." + encodeURIComponent(dev) : "name=ilike." + encodeURIComponent("*" + String(name || "").replace(/[*,()%]/g, "") + "*");
    return loadCards(q).then(function (L) {
      if (!L.length) return note("এই ইউজারের কোনো কার্ড জমা নেই। ইউজার নিজের ফল-কার্ড দেখলে এখানে আসে।");
      L.sort(function (a, b) { var x = nm.indexOf(String(a.name).toLowerCase()) >= 0 ? 1 : 0, y = nm.indexOf(String(b.name).toLowerCase()) >= 0 ? 1 : 0; return y - x || b.score - a.score; });
      popup(L, "card", dev);
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[data-cx],button[data-cuu]"); if (!b) return;
    e.preventDefault(); e.stopPropagation(); M = window.MCA;
    var dev = b.dataset.xdev || b.dataset.cuu || "", sid = b.dataset.xsid || "", nm = b.dataset.xname || b.dataset.cname || "";
    resolveDev(dev, sid).then(function (d) {
      if (b.dataset.cx === "i") { if (!d) return note("এই লাইনের ইউজারের ডিভাইস আইডি পাওয়া যায়নি।"); return window.MCA_USER && window.MCA_USER(d); }
      if (!d && !nm) return note("এই লাইনের ইউজার শনাক্ত করা যায়নি।");
      return openFor(d, nm);
    }).catch(function (er) { (window.MCA || M).fail(er); });
  }, true);
  var T0 = 0;
  new MutationObserver(function (ms) { if (T0) return; T0 = requestAnimationFrame(function () { T0 = 0; enhance(document.body); }); }).observe(document.documentElement, { childList: true, subtree: true });
  window.MCA_CARD = openFor;
  // বিজয়ী-তালিকা থেকে: প্রতি বিজয়ীর সেরা কার্ড এনে একটাই প্রিভিউতে — "নেক্সট/আগের" বিজয়ী ও ডিজাইনের মধ্যে ঘোরে; নাম ও র‍্যাংক-লেখা প্রতি কার্ডে বদলে বসে।
  // list: [{name, device, dept}]; start: কোন নম্বরের বিজয়ী দিয়ে শুরু (0-ভিত্তিক)
  function openWin(list, start) {
    M = window.MCA; list = list || [];
    return Promise.all(list.map(function (w) {
      var nm = String(w.name || "").trim(), q = w.device ? "device=eq." + encodeURIComponent(w.device) : "name=ilike." + encodeURIComponent("*" + nm.replace(/[*,()%]/g, "") + "*");
      return loadCards(q).then(function (L) { L = L || []; var ex = L.filter(function (x) { return String(x.name).trim().toLowerCase() === nm.toLowerCase(); }); return (ex[0] || L[0]) || null; }).catch(function () { return null; });
    })).then(function (got) {
      var cards = [], miss = 0, at = 0;
      got.forEach(function (c, i) { if (c) { if (i === start) at = cards.length; cards.push(c); } else miss++; });
      if (!cards.length) return note("এই বিজয়ীদের কোনো কার্ড জমা নেই। ইউজার নিজের ফল-কার্ড দেখলে এখানে আসে।");
      popup(cards, "card", null, at); if (miss) setTimeout(function () { var h = document.querySelector(".cxm .cxb2"); if (h) h.insertAdjacentHTML("afterbegin", '<div class="sm">⚠️ ' + bd(miss) + " জন বিজয়ীর কার্ড পাওয়া যায়নি।</div>"); }, 50);
    });
  }
  window.MCA_CARDS_WIN = openWin;
})();

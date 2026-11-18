// অ্যাডমিন: "🏆 লিডারবোর্ড সেটিংস" — পুরো লিডারবোর্ড অন/অফ, প্রতিটি এন্ট্রি এডিট/লুকানো/ডিলিট/ছবি, বাল্ক, সার্চ ও ফিল্টার।
// ডেটা: লিডারবোর্ড = mc2_scores (mc2_board RPC); সেরা ৩ = mc2_cards (mc2_top_cards RPC)। SQL: supabase-new-20261018j.sql
// admin-results.js-এর পরে, admin.js-এর আগে লোড হয়। একই প্যানেল "🏅 বিজয়ী ঘোষণা" ট্যাবের নিচেও আসে।
(function () {
  var M = null, ST = { on: true, pk: true, wn: true, wc: true, ws: true, wp: true, q: "", dept: "", batch: "", state: "all", off: 0, rows: [], total: 0, sel: {}, msg: "", err: false }, LIM = 30;
  window.MCA_TABS = (window.MCA_TABS || []).concat([["board", "🏆 লিডারবোর্ড সেটিংস"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { board: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  function say(t, bad) { ST.msg = t; ST.err = !!bad; var m = document.querySelector("#bdHost #bdm"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  function cfg() { return M.A("mc2_settings?select=value&key=eq.board_cfg").then(function (r) { var v = (r[0] && r[0].value) || {}; ST.on = v.board_on !== false; ST.pk = v.peek_on !== false; ST.wn = v.win_on !== false; ST.wc = v.win_card_on !== false && ST.wn; ST.ws = v.win_score_on !== false && ST.wn; ST.wp = v.win_photo_on !== false; }).catch(function () { ST.on = true; ST.pk = true; ST.wn = true; ST.wc = true; ST.ws = true; ST.wp = true; }); }
  // ইউজারের অবস্থা বাছা (✅ ❔ 🚫 📵): একই window.MCFL (admin-folders.js); না থাকলে তালিকা আগের মতোই। চাবি = "d:"+ডিভাইস, না থাকলে "n:"+নাম (ছোট হাতের)। ডিভাইস mc2_scores থেকে আসে (এই RPC ডিভাইস দেয় না)।
  var FLB = {}, DVB = {}, FLREG = 0;
  function flagsFor() {
    if (!window.MCFL) return Promise.resolve();
    if (!FLREG) { FLREG = 1; window.MCFL.reg(function () { return FLB; }); }
    var ids = ST.rows.map(function (x) { return +x.id; }).filter(Boolean);
    return Promise.all([M.rpc("mc2_flag_all").catch(function () { return {}; }), ids.length ? M.A("mc2_scores?select=id,device&id=in.(" + ids.join(",") + ")").catch(function () { return []; }) : []]).then(function (a) { FLB = a[0] || {}; DVB = {}; (a[1] || []).forEach(function (s) { DVB[s.id] = s.device || ""; }); });
  }
  function flagSel(r) { if (!window.MCFL) return ""; var k = DVB[r.id] ? "d:" + DVB[r.id] : "n:" + String(r.name || "").trim().toLowerCase(); return window.MCFL.ctl(k, FLB[k] || ""); }
  function list() {
    return M.rpc("mc2_board_admin_list", { p_q: ST.q || null, p_dept: ST.dept || null, p_batch: ST.batch || null, p_state: ST.state, p_limit: LIM, p_offset: ST.off })
      .then(function (r) { ST.rows = r.rows || []; ST.total = r.total || 0; return flagsFor(); }).catch(function (e) { ST.rows = []; ST.total = 0; say("❌ তালিকা আসেনি: " + e.message + " — supabase-new-20261018j.sql চালানো হয়েছে কি না দেখুন।", true); });
  }
  function paint(host) {
    var V = host || document.querySelector("#bdHost"); if (!V) return;
    var depts = (window.MC && MC.depts) || [];
    var dl = function (x) { try { return window.MC && MC.deptLabel ? MC.deptLabel(x) : x; } catch (e) { return x; } };
    var pages = Math.max(1, Math.ceil(ST.total / LIM)), pg = Math.floor(ST.off / LIM), n = Object.keys(ST.sel).length;
    var rows = ST.rows.map(function (r) {
      return '<div class="it" style="' + (r.hidden ? "opacity:.6" : "") + '"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-sel="' + r.id + '"' + (ST.sel[r.id] ? " checked" : "") + '><span><b>' + E(r.name) + '</b>' + (window.MCG ? window.MCG.tag(null, r.name) : "") + ' ' + (r.hidden ? '<span class="tag">🙈 লুকানো</span>' : "") + (r.has_card && !r.photo_show ? '<span class="tag">ছবি লুকানো</span>' : "") +
        '<div class="sm">' + E(dl(r.dept)) + " · " + E(r.batch || "—") + " · স্কোর " + bd(r.sc) + " · ✔ " + bd(r.ok || 0) + "/" + bd(r.total || 0) + '</div></span></label><div class="act">' + flagSel(r) +
        '<button class="l s" data-ed="' + r.id + '">✏️ এডিট</button><button class="l s" data-hd="' + r.id + '" data-v="' + (r.hidden ? 0 : 1) + '">' + (r.hidden ? "👁 দেখাও" : "🙈 লুকাও") + '</button>' +
        (r.has_card ? '<button class="l s" data-ph="' + r.id + '" data-m="' + (r.photo_show ? "hide" : "show") + '">' + (r.photo_show ? "🖼 ছবি লুকাও" : "🖼 ছবি দেখাও") + '</button>' + (r.has_photo ? '<button class="l s" data-ph="' + r.id + '" data-m="remove">🗑 ছবি সরাও</button>' : "") : "") +
        '<button class="d s" data-dl="' + r.id + '">🗑 ডিলিট</button></div></div>';
    }).join("") || '<p class="sm">কোনো এন্ট্রি নেই।</p>';
    V.innerHTML = '<div class="it"><label style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="checkbox" id="bdOn"' + (ST.on ? " checked" : "") + '><span><b>🏆 লিডারবোর্ড চালু</b><div class="sm">বন্ধ করলে সাইট থেকে লিডারবোর্ড ট্যাব ও সেরা ৩ — দুটোই চলে যায়। (লিডারবোর্ড = mc2_scores, সেরা ৩ = mc2_cards; স্কোর/কার্ড ডিলিট হয় না।)</div></span></label><label style="display:flex;gap:10px;align-items:center;cursor:pointer;margin-top:10px"><input type="checkbox" id="bdPk"' + (ST.pk ? " checked" : "") + '><span><b>🪪 কার্ড প্রিভিউ চালু</b><div class="sm">লিডারবোর্ডে সেরা ৩-এর নিচের ইউজারের র‍্যাংক হিস্টরি জানালায় "🪪 কার্ড দেখো" বাটন থাকবে; চাপলে ওই ইউজারের কার্ড আঁকা হবে, ডাউনলোডও করা যাবে। বন্ধ করলে বাটন চলে যায় ও সার্ভারও কার্ড দেয় না। (ছবি কখনো দেখানো হয় না। ডিফল্ট: চালু। এর জন্য supabase-new-20261117.sql একবার চালাতে হয়।)</div></span></label><div class="sm" style="margin-top:12px"><b>🏅 বিজয়ীদের তালিকার কার্ড</b> — তিনটাই ডিফল্টে চালু। লিডারবোর্ডের সুইচ থেকে আলাদা (লিডারবোর্ড বন্ধ থাকলেও এগুলো চলবে)। SQL: supabase-new-20261124.sql</div><label style="display:flex;gap:10px;align-items:center;cursor:pointer;margin-top:10px"><input type="checkbox" id="bdWc"' + (ST.wc ? " checked" : "") + '><span><b>🏆 বিজয়ী কার্ড চালু</b><div class="sm">বিজয়ীদের তালিকায় "🪪 কার্ড দেখুন" চাপলে পোস্টারের মতো বিজয়ী কার্ড দেখাবে (ফোনেই আঁকা হয়)। বন্ধ করলে বিজয়ী কার্ড আর আসবে না।</div></span></label><label style="display:flex;gap:10px;align-items:center;cursor:pointer;margin-top:10px"><input type="checkbox" id="bdWs"' + (ST.ws ? " checked" : "") + '><span><b>🪪 বিজয়ী তালিকার স্কোর কার্ড চালু</b><div class="sm">বিজয়ী কার্ডের সাথে "🏆 বিজয়ী কার্ড | 🪪 স্কোর কার্ড" ট্যাবে বিজয়ীর স্কোর কার্ডও দেখাবে। বন্ধ করলে শুধু বিজয়ী কার্ড দেখাবে। দুটোই বন্ধ হলে "🪪 কার্ড দেখুন" কাজ করবে না।</div></span></label><label style="display:flex;gap:10px;align-items:center;cursor:pointer;margin-top:10px"><input type="checkbox" id="bdWp"' + (ST.wp ? " checked" : "") + '><span><b>🖼 বিজয়ী কার্ডে ছবি অটো আনা চালু</b><div class="sm">বিজয়ীর স্কোর কার্ডে ছবি দেওয়া থাকলে সেই ছবিই বিজয়ী কার্ডে নিজে থেকে বসবে। ভুল ছবি আসতে থাকলে এটা বন্ধ করুন — তখন ছবির জায়গায় নামের প্রথম অক্ষর দেখাবে। (সার্ভারও তখন ছবি দেয় না।)</div></span></label><div class="act"><button id="bdSv">💾 সংরক্ষণ</button></div></div>' +
      '<div class="it"><div class="act"><input id="bdQ" placeholder="নাম খুঁজুন" value="' + E(ST.q) + '" style="flex:1;min-width:120px"><select id="bdD"><option value="">সব বিভাগ</option>' + depts.map(function (x) { return '<option value="' + E(x) + '"' + (x === ST.dept ? " selected" : "") + ">" + E(dl(x)) + "</option>"; }).join("") + '</select><input id="bdB" placeholder="সেশন" value="' + E(ST.batch) + '" style="width:90px"><select id="bdS"><option value="all">সব এন্ট্রি</option><option value="shown"' + (ST.state === "shown" ? " selected" : "") + '>শুধু দেখানো</option><option value="hidden"' + (ST.state === "hidden" ? " selected" : "") + '>🙈 শুধু লুকানো</option></select><button id="bdGo" class="l s">🔎</button></div>' +
      '<div class="act" style="margin-top:6px"><span class="sm">মোট ' + bd(ST.total) + ' · টিক ' + bd(n) + '</span><button class="l s" id="bdAll">সব টিক</button><button class="l s" id="bdHs"' + (n ? "" : " disabled") + '>🙈 লুকাও</button><button class="l s" id="bdSh"' + (n ? "" : " disabled") + '>👁 দেখাও</button><button class="d s" id="bdDl"' + (n ? "" : " disabled") + '>🗑 ডিলিট</button></div></div><p id="bdm" class="sm' + (ST.err ? " warn" : "") + '">' + E(ST.msg) + "</p>" + rows +
      '<div class="act" style="justify-content:center"><button class="l s" id="bdPv"' + (pg ? "" : " disabled") + '>‹ আগের</button><span class="sm">' + bd(pg + 1) + " / " + bd(pages) + '</span><button class="l s" id="bdNx"' + (pg < pages - 1 ? "" : " disabled") + '>নেক্সট ›</button></div>';
  }
  function reload() { return list().then(function () { paint(); }); }
  function ids() { return Object.keys(ST.sel).map(Number); }
  // স্কোর ডিলিট: সার্ভার কয়টা সারি আসলে মুছেছে (n) ফেরত দেয়। কার্ডওয়ালা ইউজারের স্কোর সুরক্ষিত, সেগুলো মোছা হয় না। তাই সত্যি সংখ্যা দেখাই, মিথ্যা "✅" নয়।
  function runDel(p, asked) {
    return p.then(function (n) {
      n = Number(n) || 0; var left = asked - n; ST.sel = {};
      if (n === 0) say("❌ কিছুই মোছা হয়নি (" + bd(asked) + "টির মধ্যে ০টা)। এরা কার্ডওয়ালা ইউজার, তাই স্কোর মোছা যায় না। আগে 🪪 কার্ড ট্যাব থেকে কার্ড ডিলিট করুন (সব ডেটা বিনে যাবে, ফেরানো যাবে)।", true);
      else if (left > 0) say("✅ " + bd(n) + "টি মুছেছে। ⚠️ " + bd(left) + "টি মোছা হয়নি (কার্ডওয়ালা ইউজার, সুরক্ষিত)। ওদের মুছতে আগে 🪪 কার্ড ট্যাব থেকে কার্ড ডিলিট করুন।", true);
      else say("✅ " + bd(n) + "টি মুছেছে");
      return reload();
    }).catch(function (e) { say("❌ " + e.message, true); });
  }
  function run(p, ok) { return p.then(function () { ST.sel = {}; say(ok || "✅ হয়েছে"); return reload(); }).catch(function (e) { say("❌ " + e.message, true); }); }
  function edit(id) {
    var r = ST.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var D = (window.MC && MC.depts) || [], dl = function (x) { try { return MC.deptLabel(x); } catch (e) { return x; } };
    var o = document.createElement("div"); o.style.cssText = "position:fixed;inset:0;background:#0008;z-index:99;display:grid;place-items:center;padding:12px";
    o.innerHTML = '<div style="background:var(--card,#fff);color:var(--fg,#111);padding:14px;border-radius:14px;width:min(100%,380px);display:grid;gap:8px"><b>✏️ এন্ট্রি এডিট</b><label>নাম (১–৩০ অক্ষর)<input id="eN" maxlength="30" value="' + E(r.name) + '"></label><label>বিভাগ<select id="eD">' + D.map(function (x) { return '<option value="' + E(x) + '"' + (x === r.dept ? " selected" : "") + ">" + E(dl(x)) + "</option>"; }).join("") + (D.indexOf(r.dept) < 0 ? '<option selected value="' + E(r.dept) + '">' + E(r.dept) + "</option>" : "") + '</select></label><label>সেশন<input id="eB" maxlength="40" value="' + E(r.batch || "") + '"></label><label>স্কোর (০–১০০০)<input id="eS" type="number" min="0" max="1000" value="' + r.sc + '"></label><div class="sm">নাম বদলালে ওই ব্যক্তির কার্ডের নামও মিলে যায়।</div><div class="act"><button id="eOk">💾 সেভ</button><button id="eNo" class="l">বাতিল</button></div></div>';
    document.body.appendChild(o); o.querySelector("#eNo").onclick = function () { o.remove(); };
    var go = function () {
      var v = { p_id: id, p_name: o.querySelector("#eN").value, p_dept: o.querySelector("#eD").value, p_batch: o.querySelector("#eB").value, p_score: Math.round(+o.querySelector("#eS").value) };
      M.rpc("mc2_board_admin_edit", v).then(function (x) { if (x === "ok") { o.remove(); say("✅ সেভ হয়েছে"); reload(); } else say("❌ মান ঠিক নয় (" + x + ")", true); }).catch(function (e) { say("❌ " + e.message, true); });
    };
    // নাম/বিভাগ/সেশন বদলাতে গেলে আগে সতর্কতার পপআপ: বিজয়ী তালিকা ও কার্ড এই তিনটা হুবহু মিলিয়ে খোঁজে
    o.querySelector("#eOk").onclick = function () {
      var q = function (id) { return o.querySelector(id).value.trim(); }, L = [["নাম", r.name || "", q("#eN")], ["বিভাগ", dl(r.dept || ""), (function () { var x = q("#eD"); return dl(x); })()], ["সেশন/ব্যাচ", r.batch || "", q("#eB")]].filter(function (x) { return String(x[1]).trim() !== x[2]; });
      if (!L.length) { go(); return; }
      var w = document.createElement("div"); w.style.cssText = "position:fixed;inset:0;background:#000b;z-index:100;display:grid;place-items:center;padding:12px";
      w.innerHTML = '<div style="background:var(--card,#fff);color:var(--fg,#111);padding:16px;border-radius:14px;width:min(100%,380px);display:grid;gap:8px"><b>⚠️ পরিচয়ের তথ্য বদলাচ্ছেন</b>' + L.map(function (x) { return '<div class="sm"><b>' + x[0] + ':</b> ' + E(x[1] || "(ফাঁকা)") + " → " + E(x[2] || "(ফাঁকা)") + "</div>"; }).join("") +
        '<div class="sm">নাম, বিভাগ ও সেশন — এই তিনটা হুবহু মিলিয়ে বিজয়ী তালিকা আর কার্ড একজনকে চেনে। এখানে বদলালে কার্ডের নাম মিলে যায়, কিন্তু বিজয়ী তালিকায় লেখা তথ্য আলাদা থাকে। না মিললে ওই বিজয়ীর স্কোর কার্ড পপআপে আসবে না। বিজয়ী তালিকাতেও একই বদল দরকার কি না দেখে নিন।</div><div class="act"><button id="eY">হ্যাঁ, বদলান</button><button id="eN2" class="l">না, ফিরে যাই</button></div></div>';
      document.body.appendChild(w); w.querySelector("#eN2").onclick = function () { w.remove(); }; w.querySelector("#eY").onclick = function () { w.remove(); go(); };
    };
  }
  // কোনো অংশ নতুন করে হাইড/বন্ধ করতে গেলে আগে সতর্কতার পপআপ (হ্যাঁ/না)। আগে থেকেই বন্ধ থাকলে আবার জিজ্ঞেস করে না।
  function bdAsk(V, go) {
    var on = function (id) { return V.querySelector(id).checked; }, L = [];
    if (ST.wc && !on("#bdWc")) L.push("🏆 বিজয়ী কার্ড বন্ধ: বিজয়ী তালিকায় কারো বিজয়ী কার্ড কখনো দেখা যাবে না।");
    if (ST.ws && !on("#bdWs")) L.push("🎴 স্কোর কার্ড বন্ধ: বিজয়ী তালিকায় কারো স্কোর কার্ড কখনো দেখা যাবে না।");
    if (ST.wp && !on("#bdWp")) L.push("🖼 বিজয়ীর ছবি বন্ধ: বিজয়ী কার্ডে ছবির বদলে নামের প্রথম অক্ষর বসবে।");
    if (ST.pk && !on("#bdPk")) L.push("👁 লিডারবোর্ডের কার্ড দেখা বন্ধ: লিডারবোর্ড থেকে কারো কার্ড খোলা যাবে না।");
    if (ST.on && !on("#bdOn")) L.push("📊 পুরো লিডারবোর্ড বন্ধ: ট্যাব, হোমের অংশ সব লুকাবে।");
    if (!L.length) { go(); return; }
    var w = document.createElement("div"); w.style.cssText = "position:fixed;inset:0;background:#000b;z-index:100;display:grid;place-items:center;padding:12px";
    w.innerHTML = '<div style="background:var(--card,#fff);color:var(--fg,#111);padding:16px;border-radius:14px;width:min(100%,380px);display:grid;gap:8px"><b>⚠️ এটা বন্ধ করলে সাইটে আর দেখা যাবে না</b>' + L.map(function (x) { return '<div class="sm">' + E(x) + "</div>"; }).join("") + '<div class="sm">আবার চালু করলে ফিরে আসবে। এখনই সেভ করবেন?</div><div class="act"><button id="wY">হ্যাঁ, বন্ধ করুন</button><button id="wN" class="l">না, ফিরে যাই</button></div></div>';
    document.body.appendChild(w); w.querySelector("#wN").onclick = function () { w.remove(); }; w.querySelector("#wY").onclick = function () { w.remove(); go(); };
  }
  function bind(V) {
    V.onclick = function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.id === "bdSv") bdAsk(V, function () { run(M.A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "board_cfg", value: { board_on: V.querySelector("#bdOn").checked, peek_on: V.querySelector("#bdPk").checked, win_on: V.querySelector("#bdWc").checked || V.querySelector("#bdWs").checked, win_card_on: V.querySelector("#bdWc").checked, win_score_on: V.querySelector("#bdWs").checked, win_photo_on: V.querySelector("#bdWp").checked } }]) }).then(function () { ST.on = V.querySelector("#bdOn").checked; ST.pk = V.querySelector("#bdPk").checked; ST.wc = V.querySelector("#bdWc").checked; ST.ws = V.querySelector("#bdWs").checked; ST.wn = ST.wc || ST.ws; ST.wp = V.querySelector("#bdWp").checked; }), "✅ সংরক্ষিত — সাইটে বদলাবে (সর্বোচ্চ কয়েক সেকেন্ড/পরের খোলায়)"); });
      else if (t.id === "bdGo") { ST.q = V.querySelector("#bdQ").value.trim(); ST.dept = V.querySelector("#bdD").value; ST.batch = V.querySelector("#bdB").value.trim(); ST.state = V.querySelector("#bdS").value; ST.off = 0; ST.sel = {}; reload(); }
      else if (t.id === "bdPv") { ST.off = Math.max(0, ST.off - LIM); reload(); } else if (t.id === "bdNx") { ST.off += LIM; reload(); }
      else if (t.id === "bdAll") { ST.rows.forEach(function (r) { ST.sel[r.id] = 1; }); paint(); }
      else if (t.id === "bdHs" || t.id === "bdSh") run(M.rpc("mc2_board_admin_hide", { p_ids: ids(), p_hide: t.id === "bdHs" }));
      else if (t.id === "bdDl") { if (confirm(bd(ids().length) + "টি এন্ট্রি স্থায়ীভাবে ডিলিট হবে (কার্ডওয়ালা ইউজারেরগুলো বাদে, সেগুলো সুরক্ষিত)। নিশ্চিত?")) runDel(M.rpc("mc2_board_admin_delete", { p_ids: ids() }), ids().length); }
      else if (t.dataset.ed) edit(+t.dataset.ed);
      else if (t.dataset.hd) run(M.rpc("mc2_board_admin_hide", { p_ids: [+t.dataset.hd], p_hide: t.dataset.v === "1" }));
      else if (t.dataset.ph) run(M.rpc("mc2_board_admin_photo", { p_ids: [+t.dataset.ph], p_mode: t.dataset.m }));
      else if (t.dataset.dl) { if (confirm("এই এন্ট্রি স্থায়ীভাবে ডিলিট হবে (ইউজারের কার্ড থাকলে মোছা যাবে না)। নিশ্চিত?")) runDel(M.rpc("mc2_board_admin_delete", { p_ids: [+t.dataset.dl] }), 1); }
    };
    V.onchange = function (e) { var c = e.target.closest("[data-sel]"); if (c) { if (c.checked) ST.sel[c.dataset.sel] = 1; else delete ST.sel[c.dataset.sel]; paint(); } };
    V.onkeydown = function (e) { if (e.key === "Enter" && e.target.id === "bdQ") V.querySelector("#bdGo").click(); };
  }
  function mount(V) { M = window.MCA; V.id = "bdHost"; bind(V); return Promise.all([cfg(), list()]).then(function () { paint(V); }); }
  function view() { var V = document.querySelector("#view"); V.innerHTML = '<div id="bdHost"></div>'; return mount(V.firstChild); }
  // "🏅 বিজয়ী ঘোষণা" ট্যাবে একই প্যানেল নিচে যোগ (ওই ট্যাব নিজে বারবার আঁকে, তাই দেখে দেখে বসানো)
  function onWin() { var b = document.querySelector("#tabs button.on"), V = document.querySelector("#view"); if (!b || !V || b.dataset.t !== "win" || V.querySelector("#bdHost")) return; var h = document.createElement("div"); h.innerHTML = "<h2 style='margin-top:14px'>🏆 লিডারবোর্ড সেটিংস</h2><div id='bdW'></div>"; V.appendChild(h); mount(h.querySelector("#bdW")); }
  var obs = null; document.addEventListener("click", function () { setTimeout(function () { var V = document.querySelector("#view"); if (V && !obs && window.MutationObserver) { obs = new MutationObserver(function () { onWin(); }); obs.observe(V, { childList: true }); } onWin(); }, 400); });
})();

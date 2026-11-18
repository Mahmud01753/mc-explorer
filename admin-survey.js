// অ্যাডমিন: "📊 সার্ভে" — সার্ভের অপশন (জায়গা) যোগ/নাম বদল/ক্রম/লুকানো/ডিলিট, আর সার্ভারে জমা ভোটের হিসাব।
// ডেটা: mc2_survey_opts (অপশন), mc2_survey_votes (ভোট), হিসাব mc2_survey_get RPC। SQL: supabase-new-20261127.sql
// admin-hub.js-এর পরে, admin.js-এর আগে লোড হয়।
(function () {
  var M = null, ST = { opts: [], res: {}, msg: "", err: false };
  window.MCA_TABS = (window.MCA_TABS || []).concat([["survey", "📊 সার্ভে"]]);
  window.MCA_VIEWS = Object.assign(window.MCA_VIEWS || {}, { survey: view });
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var E = function (t) { return M.esc(t); };
  var QN = { fav: "১) কলেজের প্রিয় জায়গা? (ইউজার একটা বাছবে)", chg: "২) কলেজ নিয়ে কী বদলাতে চাও? (ইউজার একাধিক বাছতে পারবে)" };
  function say(t, bad) { ST.msg = t; ST.err = !!bad; var m = document.querySelector("#svHost #svm"); if (m) { m.textContent = t; m.className = "sm" + (bad ? " warn" : ""); } }
  function load() {
    return Promise.all([M.A("mc2_survey_opts?select=id,q,label,sort,active&order=q.asc,sort.asc,id.asc"), M.rpc("mc2_survey_get", { p_device: null })])
      .then(function (a) { ST.opts = a[0] || []; ST.res = a[1] || {}; });
  }
  function grp(q) { return ST.opts.filter(function (o) { return o.q === q; }); }
  function paint(V) {
    V = V || document.querySelector("#svHost"); if (!V) return;
    var r = ST.res || {};
    var blocks = ["fav", "chg"].map(function (q) {
      var L = grp(q), n = q === "fav" ? (r.nf || 0) : (r.nc || 0), m = r[q] || {};
      var rows = L.map(function (o, i) {
        var c = +m[o.id] || 0, p = n ? Math.round(c / n * 100) : 0;
        return '<div class="it' + (o.active ? "" : " hid") + '"><div><b>' + E(o.label) + "</b> " + (o.active ? "" : '<span class="tag">🙈 লুকানো</span>') + '<span class="sm"> · ' + bd(c) + " জন (" + bd(p) + "%)</span></div>" +
          '<div class="svbar" role="img" aria-label="' + bd(p) + ' শতাংশ" style="height:10px;border-radius:6px;background:rgba(127,127,127,.22);overflow:hidden;margin:6px 0"><div style="height:100%;width:' + p + '%;min-width:' + (c ? 3 : 0) + 'px;background:' + (o.active ? "var(--ok,#2a9a62)" : "#999") + ';border-radius:6px"></div></div>' +
          '<div class="act"><button class="l s" data-mv="' + o.id + ':-1"' + (i === 0 ? " disabled" : "") + '>▲</button><button class="l s" data-mv="' + o.id + ':1"' + (i === L.length - 1 ? " disabled" : "") + '>▼</button>' +
          '<button class="l s" data-ed="' + o.id + '">✏️ নাম বদল</button><button class="l s" data-tg="' + o.id + '">' + (o.active ? "🙈 লুকাও" : "👁 দেখাও") + '</button><button class="d s" data-dl="' + o.id + '">🗑 ডিলিট</button></div></div>';
      }).join("") || '<p class="sm">কোনো অপশন নেই — নিচে যোগ করুন।</p>';
      return '<h2 style="margin-top:14px">' + QN[q] + '</h2><p class="sm">উত্তরদাতা: ' + bd(n) + ' জন</p>' + rows +
        '<div class="row" style="margin-top:8px"><input id="svn_' + q + '" maxlength="40" placeholder="নতুন জায়গা/অপশনের নাম"><button type="button" data-add="' + q + '">➕ যোগ করুন</button></div>';
    }).join("");
    V.innerHTML = '<h2>📊 সার্ভে (সার্ভারে জমা)</h2><p class="sm">মোট ভোটার: <b>' + bd(r.total || 0) + '</b> জন · এক ফোনে একটাই ভোট। ইউজারের সাইটে সবার ভোটের হিসাব এখান থেকেই যায়। সাইটের ট্যাব লুকাতে চাইলে 🏠 হোম-এর সার্ভে সুইচ ব্যবহার করুন। ডিলিট করলে ওই অপশনের ভোটও হিসাব থেকে চলে যাবে; শুধু সাময়িক সরাতে চাইলে “🙈 লুকাও” ব্যবহার করুন।</p>' +
      '<div class="act"><button type="button" class="l s" data-rf="1">🔄 রিফ্রেশ</button></div><p id="svm" class="sm' + (ST.err ? " warn" : "") + '">' + E(ST.msg) + "</p>" + blocks;
  }
  function run(p, ok) {
    say("⏳ হচ্ছে…");
    return p.then(function () { return load(); }).then(function () { paint(); say(ok || "✅ হয়েছে"); })
      .catch(function (e) { say("❌ হয়নি: " + ((e && e.message) || "") + (/duplicate|unique|409/i.test((e && e.message) || "") ? " (এই নামে আগেই একটা আছে)" : ""), true); });
  }
  function patch(id, body) { return M.A("mc2_survey_opts?id=eq." + id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) }); }
  function bind(V) {
    V.onclick = function (e) {
      var t = e.target.closest("button"); if (!t || t.disabled) return;
      var o, L, q, i, j, ps = [];
      if (t.dataset.rf) return run(Promise.resolve(), "🔄 নতুন হিসাব এসেছে");
      if (t.dataset.add) {
        q = t.dataset.add; var inp = V.querySelector("#svn_" + q), name = inp.value.trim().replace(/\s+/g, " ").slice(0, 40);
        if (!name) { inp.focus(); return say("আগে নাম লিখুন", true); }
        L = grp(q); var mx = L.reduce(function (a, x) { return Math.max(a, x.sort || 0); }, 0);
        return run(M.A("mc2_survey_opts", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ q: q, label: name, sort: mx + 1 }) }), "✅ যোগ হয়েছে");
      }
      if (t.dataset.ed) {
        o = ST.opts.filter(function (x) { return String(x.id) === t.dataset.ed; })[0]; if (!o) return;
        var nn = prompt("নতুন নাম (সর্বোচ্চ ৪০ অক্ষর)", o.label); if (nn == null) return; nn = nn.trim().replace(/\s+/g, " ").slice(0, 40); if (!nn || nn === o.label) return;
        return run(patch(o.id, { label: nn }), "✅ নাম বদলেছে");
      }
      if (t.dataset.tg) { o = ST.opts.filter(function (x) { return String(x.id) === t.dataset.tg; })[0]; if (!o) return; return run(patch(o.id, { active: !o.active }), o.active ? "✅ লুকানো হয়েছে" : "✅ আবার দেখাবে"); }
      if (t.dataset.dl) {
        o = ST.opts.filter(function (x) { return String(x.id) === t.dataset.dl; })[0]; if (!o) return;
        if (!confirm("“" + o.label + "” ডিলিট করবেন? এই অপশনের ভোটও হিসাব থেকে চলে যাবে। (শুধু সাময়িক সরাতে চাইলে “লুকাও” ব্যবহার করুন)")) return;
        return run(M.A("mc2_survey_opts?id=eq." + o.id, { method: "DELETE" }), "✅ ডিলিট হয়েছে");
      }
      if (t.dataset.mv) {
        var pr = t.dataset.mv.split(":"), id = pr[0], d = +pr[1];
        o = ST.opts.filter(function (x) { return String(x.id) === id; })[0]; if (!o) return;
        L = grp(o.q).slice(); i = L.indexOf(o); j = i + d; if (j < 0 || j >= L.length) return;
        L.splice(i, 1); L.splice(j, 0, o);
        L.forEach(function (x, k) { if (x.sort !== k + 1) ps.push(patch(x.id, { sort: k + 1 })); });
        return run(Promise.all(ps), "✅ ক্রম বদলেছে");
      }
    };
    V.onkeydown = function (e) { if (e.key === "Enter" && /^svn_/.test(e.target.id)) { var b = V.querySelector('[data-add="' + e.target.id.slice(4) + '"]'); if (b) b.click(); } };
  }
  function view() {
    M = window.MCA; var V = document.querySelector("#view"); V.innerHTML = '<div id="svHost"><p class="sm">⏳ লোড হচ্ছে…</p></div>';
    var H = V.firstChild; bind(H);
    return load().then(function () { paint(H); }).catch(function (e) { H.innerHTML = '<h2>📊 সার্ভে</h2><p class="warn">❌ তালিকা আসেনি: ' + E((e && e.message) || "") + " — supabase-new-20261127.sql চালানো হয়েছে কি না দেখুন।</p>"; });
  }
})();

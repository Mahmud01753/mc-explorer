// MC Explorer — "ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি" (কুইজের পরের ফল-পাতায় পপআপ + জমা-ফর্মের একই লাইন)।
// এই ফাইল না থাকলেও সাইট চলে (শুধু অনুমতির পপআপ আসে না)। সার্ভারে লাগে: supabase-new-20261220.sql (একবার চালাতে হয়)।
// নিয়ম:
//  ১) ফল-পাতায় কার্ডের ছবি আসার ২ সেকেন্ড পর পপআপ আসে (উত্তর আগে দেওয়া না থাকলে)।
//  ২) তার আগে বা পরে ফল-পাতার যেকোনো বাটনে (ডাউনলোড/শেয়ার/স্টোরি/…) চাপলে আগে পপআপ আসে; উত্তর দিলে চাপা বাটনের কাজ নিজে থেকে চলে।
//  ৩) উত্তর ফোনে (mc2_fb) ও সার্ভারে (mc2_fbok, প্রতি ফোনে একটা) থাকে — একবার দিলে পরের সব কার্ডে আবার জিজ্ঞেস করে না।
//  ৪) সার্ভারে সেভ না গেলে (নেট নেই) ফোনে রেখে কাজ চলতে দেয়, পরের বার ফল-পাতা খুললে আবার পাঠানোর চেষ্টা করে।
(function () {
  var C = window.MC_CFG || {}, ON = !!(C.url && C.key), base = ON ? String(C.url).replace(/\/$/, "") : "", KEY = "mc2_fb";
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var cur = LS.get(KEY, null), ST = "unknown", CKP = null, pend = null, T = 0, SV = null; // ST: unknown | ask | ok | off
  var answered = function () { return !!cur && typeof cur.ok === "boolean" && (!cur.ok || cur.mode === "photo" || cur.mode === "nophoto"); };
  function vid() { return window.mcVid ? window.mcVid() : (LS.get("mc2_vid", "") || ""); }
  function rpc(n, a) { return fetch(base + "/rest/v1/rpc/" + n, { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, body: JSON.stringify(a) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function toast(m) { var t = document.getElementById("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 2200); }

  // সার্ভারে পাঠানো (সফল হলে sv=1)। একসাথে একটাই চলে; মাঝে উত্তর বদলালে শেষটাই যায়।
  function push() {
    if (!ON || !answered() || cur.sv === 1 || SV) return SV || Promise.resolve();
    var snap = { ok: cur.ok, mode: cur.mode }, d = vid(); if (!d) return Promise.resolve();
    SV = rpc("mc2_fb_set", { p_device: d, p_ok: snap.ok, p_mode: snap.mode || null }).then(function (s) {
      if (s === "ok" && cur && cur.ok === snap.ok && cur.mode === snap.mode) { cur.sv = 1; LS.set(KEY, cur); }
    }).catch(function () {}).then(function () { SV = null; if (answered() && cur.sv !== 1 && (cur.ok !== snap.ok || cur.mode !== snap.mode)) return push(); });
    return SV;
  }
  function save(ok, mode) { cur = { ok: !!ok, mode: ok ? mode : null, sv: 0 }; LS.set(KEY, cur); ST = "ok"; return push(); }

  // উত্তর আগে দেওয়া আছে কি? ফোনে না থাকলে সার্ভারকে জিজ্ঞেস (নতুন ব্রাউজার/ক্যাশ মোছার পরেও আগের উত্তর ফেরে)
  function begin() {
    if (CKP) return CKP;
    CKP = (function () {
      if (!ON || !vid()) { ST = "off"; return Promise.resolve("off"); }
      if (answered()) { ST = "ok"; push(); return Promise.resolve("ok"); }
      return rpc("mc2_fb_get", { p_device: vid() }).then(function (r) {
        if (r && typeof r.ok === "boolean" && (!r.ok || r.mode === "photo" || r.mode === "nophoto")) { cur = { ok: r.ok, mode: r.ok ? r.mode : null, sv: 1 }; LS.set(KEY, cur); ST = "ok"; return "ok"; }
        ST = "ask"; return "ask";
      }).catch(function () { ST = "ask"; return "ask"; });
    })();
    return CKP;
  }

  // হ্যাঁ/না + (হ্যাঁ হলে) ছবি সহ/ছবি ছাড়া — পপআপ ও জমা-ফর্ম দুই জায়গায় একই
  var uid = 0;
  function ui(root, init, onChange) {
    var n = "fb" + (++uid), q = function (s) { return root.querySelector(s); };
    root.innerHTML = '<p class="fbq-q">আপনার কার্ড ছবি ছাড়া ফেইসবুক পেইজে ছাড়া হতে পারে, আপনি কি রাজি আছেন?</p>' +
      '<label class="fbop"><input type="radio" name="' + n + 'r" value="y"><span><b>হ্যাঁ, রাজি</b></span></label>' +
      '<div class="fbsub" hidden><div class="fbsl">কীভাবে ছাড়া যাবে?</div>' +
      '<label class="fbop"><input type="radio" name="' + n + 'm" value="photo"><span><b>ছবি সহ</b><small>কার্ডে আমার দেওয়া ছবি থাকবে</small></span></label>' +
      '<label class="fbop"><input type="radio" name="' + n + 'm" value="nophoto"><span><b>ছবি ছাড়া</b><small>কার্ডে আমার ছবি থাকবে না</small></span></label></div>' +
      '<label class="fbop"><input type="radio" name="' + n + 'r" value="n"><span><b>না, রাজি নই</b></span></label>';
    function get() {
      var r = q('input[name="' + n + 'r"]:checked'), m = q('input[name="' + n + 'm"]:checked');
      return { ok: r ? r.value === "y" : null, mode: m ? m.value : null };
    }
    function sync() {
      root.querySelectorAll(".fbop").forEach(function (o) { o.classList.toggle("on", o.querySelector("input").checked); });
      q(".fbsub").hidden = !(get().ok === true);
    }
    if (init && typeof init.ok === "boolean") {
      var a = q('input[name="' + n + 'r"][value="' + (init.ok ? "y" : "n") + '"]'); if (a) a.checked = true;
      if (init.ok && init.mode) { var b = q('input[name="' + n + 'm"][value="' + init.mode + '"]'); if (b) b.checked = true; }
    }
    sync();
    root.addEventListener("change", function () { sync(); if (onChange) onChange(get()); });
    return { get: get };
  }

  function replay() { var el = pend; pend = null; if (el && document.body.contains(el)) { try { el.click(); } catch (e) {} } }

  function openPop() {
    if (document.getElementById("fbq") || ST === "ok") return;
    var w = document.createElement("div"); w.className = "rmodal fbq"; w.id = "fbq"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-labelledby", "fbqh");
    w.innerHTML = '<div class="rbox"><h2 id="fbqh">একটা অনুমতি দিন</h2><div id="fbqb"></div><div class="fbqe" id="fbqe" role="alert" hidden></div>' +
      '<p class="fbq-n">না বললেও কার্ড ও খেলা আগের মতোই চলবে। এই উত্তর আপনার পরের সব কার্ডেও প্রযোজ্য; বদলাতে চাইলে জমা-ফর্মে বদলান।</p>' +
      '<button class="btn o xl" id="fbqg" type="button">সাবমিট</button></div>';
    document.body.appendChild(w);
    var u = ui(w.querySelector("#fbqb"), null, function () { w.querySelector("#fbqe").hidden = true; });
    w.querySelector("#fbqg").onclick = function () {
      var v = u.get(), e = w.querySelector("#fbqe");
      if (v.ok === null) { e.textContent = "হ্যাঁ বা না বাছুন।"; e.hidden = false; return; }
      if (v.ok && !v.mode) { e.textContent = "ছবি সহ না ছবি ছাড়া, একটা বাছুন।"; e.hidden = false; return; }
      save(v.ok, v.mode); w.remove(); toast("সংরক্ষিত — ধন্যবাদ");
      replay(); // সাবমিট চাপার ভেতরেই, যাতে শেয়ার/ডাউনলোডের ব্রাউজার-অনুমতি বহাল থাকে
    };
  }

  // যেকোনো বাটন/লিংকে চাপ: উত্তর না থাকলে আটকে পপআপ, উত্তরের পর চাপা কাজটি চালায় (শুধু ফল-পাতায়, কার্ড দেখানো থাকলে)
  document.addEventListener("click", function (e) {
    if (ST === "ok" || ST === "off" || !ON) return;
    if (location.hash.replace(/^#/, "") !== "result") return;
    var v = document.getElementById("view"), t = e.target && e.target.closest ? e.target.closest("button, a, label, input, select, [role=button]") : null;
    if (!v || !t || !v.contains(t) || !document.getElementById("cimg")) return;
    e.preventDefault(); e.stopPropagation(); pend = t;
    begin().then(function (r) { if (r === "ask") openPop(); else if (pend) replay(); });
  }, true);

  // app.js: কার্ডের ছবি পর্দায় বসলে ডাকে — ছবি আসার ঠিক ২ সেকেন্ড পর পপআপ (সার্ভারের উত্তর ততক্ষণে এসে যায়)
  window.mcFbShown = function (img) {
    if (!img || img.__fb || !ON) return; img.__fb = 1; clearTimeout(T);
    var p = begin();
    var go = function () { clearTimeout(T); T = setTimeout(function () { p.then(function (r) { if (r === "ask" && ST === "ask" && document.body.contains(img) && location.hash.replace(/^#/, "") === "result") openPop(); }); }, 2000); };
    if (img.complete && img.naturalWidth) go(); else { img.addEventListener("load", go, { once: true }); img.addEventListener("error", go, { once: true }); }
  };

  // জমা-ফর্মে একই লাইন (contest.js ডাকে): আগের উত্তর বাছা থাকে; বদলালেই সংরক্ষিত
  window.mcFbMount = function (el) {
    if (!el || !ON) return;
    el.innerHTML = '<div class="fbfm"><div class="lbl" style="margin-bottom:6px">ফেসবুক পেইজে কার্ড ছাড়ার অনুমতি</div><div class="fbmb"></div><small class="bkh fbmn" aria-live="polite">বদলালেই আপনার উত্তর সংরক্ষিত হয়।</small></div>';
    var nt = el.querySelector(".fbmn");
    ui(el.querySelector(".fbmb"), answered() ? cur : null, function (v) {
      if (v.ok === null || (v.ok && !v.mode)) { nt.textContent = v.ok ? "ছবি সহ না ছবি ছাড়া, একটা বাছুন।" : "বদলালেই আপনার উত্তর সংরক্ষিত হয়।"; return; }
      save(v.ok, v.mode); nt.textContent = "✅ সংরক্ষিত";
    });
  };
  window.mcFb = { get: function () { return answered() ? { ok: cur.ok, mode: cur.mode } : null; } };
})();

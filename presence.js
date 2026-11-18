// MC Explorer — অনলাইন স্ট্যাটাস / ভিজিটর (ঐচ্ছিক ফাইল; না থাকলেও সাইট চলে)
// প্রতি ৩০ সেকেন্ডে সাইট খোলা থাকার সংকেত পাঠায়; পেজ বন্ধ করলে "অফলাইন" জানায়। SQL: supabase-userinfo.sql
// আইপি/লোকেশন/ডিভাইস সার্ভার নিজে হেডার থেকে নেয়; এখান থেকে ফোন নম্বর বা অন্য কোনো ব্যক্তিগত তথ্য পাঠানো হয় না।
(function () {
  var C = window.MC_CFG || {}; if (!(C.url && C.key)) return;
  var base = String(C.url).replace(/\/$/, ""), T = null, last = 0;
  function ls(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function vid() {
    if (window.mcVid) return window.mcVid();
    var v = ls("mc2_vid"); if (!v) { v = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); try { localStorage.setItem("mc2_vid", JSON.stringify(v)); } catch (e) {} }
    return v;
  }
  function body() {
    var P = ls("mc2_profile") || {}, A = ls("mc2_ac_p") || {};
    return { p_device: vid(), p_nick: A.n || "", p_gname: P.name || "", p_gdept: P.dept || "", p_gbatch: P.batch || "", p_cdept: A.dn || "", p_csess: A.sn || "",
      p_cdept_id: parseInt(A.d, 10) || null, p_csess_id: parseInt(A.s, 10) || null, p_page: (location.hash || "#home").slice(0, 60), p_info: window.mcInfo ? window.mcInfo() : null };
  }
  function post(fn, b, keep) {
    return fetch(base + "/rest/v1/rpc/" + fn, { method: "POST", keepalive: !!keep, headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json" }, body: JSON.stringify(b) }).catch(function () {});
  }
  function ping() { var n = Date.now(); if (n - last < 2500) return; last = n; post("mc2_presence_ping", body()); }
  function leave() { post("mc2_presence_leave", { p_device: vid() }, true); }
  function tick() { clearTimeout(T); if (!document.hidden) ping(); T = setTimeout(tick, 30000); }
  window.mcPresencePing = ping;
  window.addEventListener("hashchange", ping);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) ping(); });
  window.addEventListener("pagehide", leave);
  window.addEventListener("pageshow", function (e) { if (e.persisted) ping(); });
  tick();
})();

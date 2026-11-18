// অ্যাডমিনের যেকোনো ড্রপডাউনে (৩টি বা বেশি অপশন) পাশে ◀ ▶ "আগের/পরের" বাটন: ড্রপডাউন খুলে বারবার বাছতে হয় না, চেপে চেপে এগোনো যায়।
// নিজে কোনো ডাটা/সার্ভার ছোঁয় না, SQL লাগে না। শুধু বাছাই বদলে সাধারণ "input"+"change" ইভেন্ট ছোড়ে — তাই ওই ড্রপডাউনের আগের কোড হুবহু আগের মতোই চলে।
// বাদ: একাধিক-বাছাই (multiple/size>1), টেবিলের ভেতরের, data-nostep দেওয়া, আর 📣 সোশ্যাল ট্যাবের ছয়টি (ওগুলোর নিজস্ব "🎨 দ্রুত বাছাই" প্যানেল ছবির ওপরেই আছে)।
(function () {
  var SKIP = { scCs: 1, scCp: 1, scSty: 1, scDesign: 1, scTp: 1, scPick: 1 };
  var bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  if (!document.getElementById("stp-css")) {
    var st = document.createElement("style"); st.id = "stp-css";
    st.textContent = ".mcstp{display:flex;gap:4px;align-items:center;width:100%;min-width:0}.mcstp>select{flex:1;min-width:0;width:auto}.mcstp>button{flex:none;padding:7px 10px;font-size:14px;line-height:1;min-width:36px}.mcstp>.stc{flex:none;font-size:11px;opacity:.75;min-width:34px;text-align:center}";
    document.head.appendChild(st);
  }
  function ok(s) {
    if (s.dataset.stp || s.multiple || s.size > 1 || s.options.length < 3 || SKIP[s.id] || s.closest("table,[data-nostep],.mcstp")) return false;
    return true;
  }
  function cnt(s, c) { if (c) c.textContent = s.selectedIndex >= 0 ? bd(s.selectedIndex + 1) + "/" + bd(s.options.length) : ""; }
  function wrap(s) {
    s.dataset.stp = "1";
    var w = document.createElement("span"), c = document.createElement("span"), a = document.createElement("button"), b = document.createElement("button");
    w.className = "mcstp"; c.className = "stc"; a.type = b.type = "button"; a.className = b.className = "l s";
    a.textContent = "◀"; b.textContent = "▶"; a.title = "আগের অপশন"; b.title = "পরের অপশন"; a.setAttribute("aria-label", "আগের অপশন"); b.setAttribute("aria-label", "পরের অপশন");
    s.parentNode.insertBefore(w, s); w.appendChild(a); w.appendChild(s); if (s.options.length >= 6) w.appendChild(c); w.appendChild(b);
    function step(d) {
      if (s.disabled) return; var n = s.options.length, i = s.selectedIndex < 0 ? (d > 0 ? -1 : 0) : s.selectedIndex, k;
      for (k = 0; k < n; k++) { i = (i + d + n) % n; if (!s.options[i].disabled) break; }
      s.selectedIndex = i; cnt(s, c);
      s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true }));
    }
    a.onclick = function (e) { e.preventDefault(); e.stopPropagation(); step(-1); };
    b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); step(1); };
    s.addEventListener("change", function () { cnt(s, c); }); cnt(s, c);
  }
  var tm = 0;
  function scan() { tm = 0; try { [].forEach.call(document.querySelectorAll("select"), function (s) { if (ok(s)) wrap(s); }); } catch (e) {} }
  function later() { if (!tm) tm = setTimeout(scan, 200); }
  try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  scan();
})();

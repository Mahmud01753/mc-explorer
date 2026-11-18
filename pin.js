// পুরোনো সাইট খোলার পিন-বাটন। পিন এখানে সরাসরি লেখা নেই, শুধু তার হ্যাশ আছে।
// ⚠️ এটা সহজ তালা (ভদ্রতার তালা)। কেউ পুরোনো সাইটের সরাসরি ঠিকানা জানলে খুলে যাবে।
// পিন বদলাতে: নতুন পিনের SHA-256 ("mcx:" + পিন) নিচের HASH-এ বসান এবং HINT বদলান।
(function () {
  "use strict";
  var HASH = "906d4dae524f28d5b71d8b41ee7bbf87b3bfb34eabe241e208f3da79dec8e79d", HINT = "53******91", TARGET = ((window.MC_CFG || {}).oldUrl || "");
  var btn = document.getElementById("oldBtn"); if (!btn) return; if (!TARGET) { btn.style.display = "none"; return; }
  function sha(t) { var b = new TextEncoder().encode(t); return crypto.subtle.digest("SHA-256", b).then(function (d) { return Array.from(new Uint8Array(d)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }); }
  function open() {
    var o = document.createElement("div"); o.className = "pinov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "পুরোনো সাইট খুলতে পিন");
    o.innerHTML = '<div class="pinbox"><b>পুরোনো সাইট খুলতে পিন দাও</b><div class="pinhint">হিন্টস: <span>' + HINT + '</span></div>' +
      '<input id="pinin" class="in" type="password" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="৮ সংখ্যার পিন" aria-label="পিন">' +
      '<div class="pinmsg" id="pinmsg" role="alert"></div>' +
      '<div class="two2"><button type="button" class="btn l s" id="pinx">বন্ধ করো</button><button type="button" class="btn o" id="pinok">খোলো</button></div></div>';
    document.body.appendChild(o);
    var i = o.querySelector("#pinin"), m = o.querySelector("#pinmsg"); i.focus();
    function close() { o.remove(); btn.focus(); }
    function go() {
      var v = i.value.replace(/[০-৯]/g, function (c) { return "০১২৩৪৫৬৭৮৯".indexOf(c); }).trim();
      if (!window.crypto || !crypto.subtle) { m.textContent = "নিরাপদ (https) ঠিকানায় খুললে পিন কাজ করবে।"; return; }
      sha("mcx:" + v).then(function (h) { if (h === HASH) { if (!TARGET) { m.textContent = "পুরোনো সাইটের ঠিকানা এখনো বসানো হয়নি (config.js-এর oldUrl)।"; return; } location.href = TARGET; } else { m.textContent = "পিন ঠিক নয়। আবার চেষ্টা করো।"; i.select(); } });
    }
    o.querySelector("#pinok").onclick = go; o.querySelector("#pinx").onclick = close;
    i.onkeydown = function (e) { if (e.key === "Enter") go(); if (e.key === "Escape") close(); };
    o.onclick = function (e) { if (e.target === o) close(); };
  }
  btn.onclick = open;
})();

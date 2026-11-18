// MC Explorer — "শেয়ার করে পুরস্কার জেতো" ফর্ম। এই ফাইল না থাকলেও সাইট চলে (শুধু ফর্ম আসে না)।
// ঘোষণার লেখা বদলাতে নিচের MC_CONTEST বদলান। জমা পড়ে Supabase-এ (supabase-contest.sql একবার চালাতে হয়; config.js-এ url/key লাগে)।
window.MC_CONTEST = {
  on: true,
  title: "শেয়ার করো, পুরস্কার জেতো!",
  headline: "প্রতি সপ্তাহে লটারির মাধ্যমে ৫ জন বিজয়ী পুরস্কার পাবেন 🎉",
  steps: [
    "আপনার MC কার্ড বা স্টোরি ফেসবুকে পোস্ট/শেয়ার করুন",
    "পোস্টের লিংক আর স্ক্রিনশট নিচের ফর্মে জমা দিন",
    "সপ্তাহ শেষে লটারিতে ৫ জন বিজয়ী বাছাই করা হবে"
  ],
  prize: "", // পুরস্কারের বিবরণ এখানে লিখুন (যেমন: ১ম পুরস্কার …)। খালি থাকলে দেখায় না।
  note: "পোস্টটি পাবলিক রাখুন, না হলে যাচাই করা যাবে না।"
};
(function () {
  var CT = window.MC_CONTEST, C = window.MC_CFG || {};
  var bn = function (n) { return String(n).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var LSget = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  var LSset = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var FB = /^(https?:\/\/)?([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)\//i;
  function weekKey() { var d = new Date(), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); var y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + "-W" + Math.ceil(((t - y) / 864e5 + 1) / 7); }
  function shrink(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error("read")); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { rej(new Error("img")); };
        im.onload = function () {
          var k = Math.min(1, 1280 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
          c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
          var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (b) { b ? res({ blob: b, url: c.toDataURL("image/jpeg", 0.5) }) : rej(new Error("blob")); }, "image/jpeg", 0.8);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function openContest(info, host) {
    info = info || {};
    if (!host) {
      // ফর্ম সরাসরি নয়: আগে খেলে কার্ড বানাতে হবে, ফর্ম কার্ডের পাতায় (ফল) খোলে
      document.querySelectorAll(".rmodal").forEach(function (m) { m.remove(); });
      if (LSget("mc2_last")) { location.hash = "result"; var t = document.getElementById("toast"); if (t) { t.textContent = "কার্ড ডাউনলোড করে নিচের “পুরস্কারের জন্য জমা দিন” বাটনে চাপুন"; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 3200); } return; }
      var w = document.createElement("div"); w.className = "rmodal cmodal"; w.setAttribute("role", "dialog");
      w.innerHTML = '<div class="rbox cbox"><h2>🎁 আগে খেলুন</h2><div class="cann"><b>⚠️ আগে খেলা শেষ করুন</b><ol><li>১০টি প্রশ্নের খেলা শেষ করে <b>MC কার্ড</b> বানান।</li><li>কার্ড ডাউনলোড করে ফেসবুকে পোস্ট করুন।</li><li>তারপর কার্ডের পাতার নিচে ফর্ম জমা দিন।</li></ol></div><a class="btn o xl" href="#home" id="wgo">🎯 খেলা শুরু করুন</a></div><button class="rx" id="wrx" type="button" aria-label="বন্ধ করুন">✕</button>';
      document.body.appendChild(w); var cl = function () { w.remove(); };
      w.querySelector("#wrx").onclick = cl; w.querySelector("#wgo").onclick = cl; w.onclick = function (e) { if (e.target === w) cl(); };
      return;
    }
    var last = LSget("mc2_last") || {}, prof = LSget("mc2_profile") || {}, done = LSget("mc2_entry"), wk = weekKey();
    var el = host || document.createElement("div"); if (!host) { el.className = "rmodal cmodal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", CT.title); }
    var cap = info.caption || "";
    var guide = '<p class="pzu">পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন<b class="pzc" role="link" tabindex="0">এখানে ক্লিক ›</b></p><div class="cann"><b>📝 জমা দেওয়ার সহজ নিয়ম</b><ol>' +
      '<li>নিচের বাটনে চেপে <b>কার্ড ডাউনলোড</b> করুন।</li>' +
      '<li>কার্ডটি আপনার <b>ফেসবুকে পোস্ট</b> করুন (পাবলিক রাখুন)। সাথে নিচের লেখাটি <b>কপি</b> করে দিন — সাইটের লিংক লেখার মধ্যে থাকতে হবে। লেখা নিজের মতো বদলাতে পারেন।</li>' +
      '<li>নিচের ফর্মে <b>নাম</b>, <b>পোস্টের লিংক</b> আর <b>স্ক্রিনশট</b> দিয়ে জমা দিন।</li></ol></div>' +
      (info.download ? '<button type="button" class="btn l s" id="cdl">⬇️ কার্ড ডাউনলোড করুন</button>' : '') +
      (cap ? '<div class="fld"><label class="lbl" for="ccap">কার্ডের সাথে এই লেখা পোস্টে শেয়ার করুন</label><textarea class="in" id="ccap" rows="3" readonly style="resize:none"></textarea><button type="button" class="btn o s" id="ccp">📋 লেখা কপি করুন</button></div>' : '');
    el.innerHTML = (host ? '' : '<div class="rbox cbox"><h2>🎁 ' + esc(CT.title) + '</h2>') + guide +
      (done && done.wk === wk ? '<div class="cdone">✅ এই সপ্তাহে আপনি আগেই জমা দিয়েছেন। চাইলে আরেকটি পোস্টও জমা দিতে পারেন।</div>' : '') +
      '<div id="cform"><div class="fld"><label class="lbl" for="cn">আপনার নাম</label><input class="in" id="cn" maxlength="60" autocomplete="name" placeholder="যেমন: রাহুল আহমেদ"></div>' +
      '<div class="fld"><label class="lbl" for="cl">ফেসবুক পোস্টের লিংক</label><div class="cpair"><input class="in" id="cl" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="https://facebook.com/..."><button type="button" class="chip" id="cp">📋 পেস্ট</button></div></div>' +
      '<div class="fld"><label class="lbl" for="cs">পোস্টের স্ক্রিনশট</label><label class="cshot" id="csl"><input id="cs" type="file" accept="image/*" hidden><span id="cst">📷 স্ক্রিনশট বাছুন</span><img id="csi" alt="স্ক্রিনশটের প্রিভিউ" hidden></label></div>' +
      '<div class="fld"><label class="lbl" for="cc">WhatsApp নম্বর <small>(ঐচ্ছিক, বিজয়ী হলে যোগাযোগের জন্য)</small></label><div class="cbk"><input class="in" id="cc" type="tel" inputmode="numeric" maxlength="16" autocomplete="tel" placeholder="01XXXXXXXXX"><span class="bkok" id="bko" hidden aria-label="নম্বর ঠিক আছে">✅</span></div><small class="bkh" id="bkh">চাইলে আপনার WhatsApp নম্বর দিন (যেমন ০১৭XXXXXXXX)। নম্বর ঠিক হলে ✅ আসবে।</small></div>' +
      '<div class="fld"><label class="lbl" for="cf">ফেসবুক আইডির লিংক <small>(ঐচ্ছিক)</small></label><input class="in" id="cf" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="https://facebook.com/আপনার-আইডি"></div>' +
      '<div class="fld" id="cfbw"></div>' +
      '<div class="cprev" id="cprev" hidden><img id="cpimg" alt="আপনার কার্ডের নমুনা"><span class="cpcap">নমুনা। আপনার ফল-পাতার কার্ডটাই এখানে দেখাচ্ছে।</span></div>' +
      '<div class="cerr" id="ce" role="alert" hidden></div>' +
      '<button class="btn o xl" id="cgo" type="button">🎁 জমা দিন</button></div>' +
      '<div id="cok" hidden><div class="cbig">🎉</div><div class="cbt">জমা হয়েছে, ধন্যবাদ!</div><p>এই সপ্তাহের লটারিতে আপনি আছেন। বিজয়ী হলে আপনাকে জানানো হবে।</p><button class="btn xl" id="cx2" type="button">ঠিক আছে</button></div>' +
      (host ? '' : '</div><button class="rx" id="crx" aria-label="বন্ধ করুন" type="button">✕</button>');
    if (!host) document.body.appendChild(el);
    var q = function (s) { return el.querySelector(s); }, shot = null;
    if (window.mcFbMount && q("#cfbw")) window.mcFbMount(q("#cfbw"));
    // কার্ডের প্রিভিউ: সম্মতি "হ্যাঁ" + ছবি সহ/ছাড়া বাছলে ফল-পাতার কার্ডটাই ছোট করে দেখায় (ছবি সহ/ছাড়া বদলালে কার্ডও বদলায়)
    var pvC = {}, pvTry = 0, pvUpd = function (force) {
      var bx = q("#cprev"), fw = q("#cfbw"); if (!bx || !fw || typeof info.preview !== "function") return;
      var r = fw.querySelector('input[name$="r"]:checked'), m = fw.querySelector('input[name$="m"]:checked');
      if (!r || r.value !== "y" || !m) { bx.hidden = true; return; }
      var k = m.value === "photo" ? "p" : "n"; if (force === true) delete pvC[k];
      var u = pvC[k] || (pvC[k] = info.preview(k === "p"));
      if (!u) { delete pvC[k]; bx.hidden = true; if (pvTry++ < 6) setTimeout(function () { pvUpd(); }, 600); return; } // কার্ড তখনও আঁকা না হলে একটু পরে আবার চেষ্টা
      pvTry = 0; q("#cpimg").src = u; bx.hidden = false;
    };
    // প্রিভিউ: "ছবি সহ"/"ছবি ছাড়া" বাছা বা চাপা মাত্র (আগেই বাছা থাকলেও, আবার চাপলেও) প্রতিবার দেখায়; ফর্ম খুললে আগের বাছাই অনুযায়ী আগেই দেখায়
    if (q("#cfbw")) { q("#cfbw").addEventListener("change", function () { pvUpd(true); }); q("#cfbw").addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".fbop")) setTimeout(function () { pvUpd(true); }, 0); }); pvUpd(); }
    var bad = function (el) { if (!el) return; el.classList.add("bad"); var off = function () { el.classList.remove("bad"); el.removeEventListener("input", off); el.removeEventListener("change", off); el.removeEventListener("click", off); }; el.addEventListener("input", off); el.addEventListener("change", off); el.addEventListener("click", off); };
    q("#cn").value = (info.name || last.name || prof.name || "").replace(/\s+/g, " ").trim();
    var close = function () { if (host) host.hidden = true; else el.remove(); };
    if (q("#crx")) q("#crx").onclick = close; q("#cx2").onclick = close; if (!host) el.onclick = function (e) { if (e.target === el) close(); };
    if (q("#ccap")) { q("#ccap").value = cap; q("#ccp").onclick = function () { var t = q("#ccap"); t.select(); var ok = function () { q("#ccp").textContent = "✅ কপি হয়েছে"; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cap).then(ok, function () { try { document.execCommand("copy"); ok(); } catch (e) {} }); else { try { document.execCommand("copy"); ok(); } catch (e) {} } }; }
    if (q("#cdl")) q("#cdl").onclick = info.download;
    var bkNorm = function (v) { v = String(v).replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }).replace(/[\s-]/g, ""); if (/^\+?8801/.test(v)) v = v.replace(/^\+?88/, ""); return v; };
    var bkOk = function (v) { v = bkNorm(v); return /^01[3-9]\d{8}$/.test(v) || /^\+[1-9]\d{7,14}$/.test(v); };
    q("#cc").oninput = function () { var ok = bkOk(this.value); q("#bko").hidden = !ok; q("#cc").classList.toggle("okin", ok); };
    var fbb = q("#cfb"); if (fbb) fbb.onclick = function () { if (C.fbPage) window.open(C.fbPage, "_blank", "noopener"); else err("ফেসবুক পেইজের লিংক শীঘ্রই আসছে।"); };
    var err = function (m) { var e = q("#ce"); e.textContent = m; e.hidden = !m; if (m) e.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
    if (!navigator.clipboard || !navigator.clipboard.readText) q("#cp").hidden = true;
    q("#cp").onclick = function () { navigator.clipboard.readText().then(function (t) { t = (t || "").trim(); if (t) { q("#cl").value = t; err(""); } else err("ক্লিপবোর্ডে কিছু নেই। আগে পোস্টের লিংক কপি করুন।"); }).catch(function () { err("পেস্ট করা গেল না, লিংকটি নিজে বসিয়ে দিন।"); }); };
    q("#cs").onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; q("#cst").textContent = "⏳ ছবি তৈরি হচ্ছে…";
      shrink(f).then(function (s) { shot = s; q("#csi").src = s.url; q("#csi").hidden = false; q("#cst").textContent = "✅ বদলাতে আবার ছুঁয়ে দিন"; err(""); })
        .catch(function () { shot = null; q("#csi").hidden = true; q("#cst").textContent = "📷 স্ক্রিনশট বাছুন"; err("ছবিটি পড়া গেল না, অন্য ছবি বাছুন।"); });
    };
    q("#cgo").onclick = function () {
      var name = q("#cn").value.replace(/\s+/g, " ").trim(), link = q("#cl").value.trim(), contact = q("#cc").value.trim(), btn = q("#cgo");
      [q("#cn"), q("#cl"), q("#csl")].forEach(function (x) { x.classList.remove("bad"); }); // জরুরি ঘর খালি থাকলে সোনালি দাগ (লেখা বার্তা আগের মতোই)
      if (name.length < 2) bad(q("#cn")); if (!link || !FB.test(link)) bad(q("#cl")); if (!shot) bad(q("#csl"));
      if (name.length < 2) { q("#cn").focus(); return err("আপনার নাম লিখুন।"); }
      if (!link) { q("#cl").focus(); return err("ফেসবুক পোস্টের লিংক দিন।"); }
      if (!FB.test(link)) { q("#cl").focus(); return err("লিংকটি ফেসবুকের মনে হচ্ছে না (facebook.com / fb.watch / fb.me)।"); }
      if (!/^https?:\/\//i.test(link)) link = "https://" + link;
      if (!shot) return err("পোস্টের স্ক্রিনশট বাছুন।");
      if (contact && !bkOk(contact)) { bad(q("#cc")); q("#cc").focus(); return err("সঠিক WhatsApp নম্বর দিন (১১ সংখ্যা, যেমন ০১৭XXXXXXXX)।"); }
      var prof2 = q("#cf").value.trim(); if (prof2 && !FB.test(/^https?:\/\//i.test(prof2) ? prof2 : "https://" + prof2)) { bad(q("#cf")); q("#cf").focus(); return err("ফেসবুক আইডির লিংকটি ঠিক মনে হচ্ছে না (facebook.com/…)।"); }
      if (prof2 && !/^https?:\/\//i.test(prof2)) prof2 = "https://" + prof2;
      contact = [contact ? "WA: " + bkNorm(contact) : "", prof2 ? "FB: " + prof2 : ""].filter(Boolean).join(" | ");
      if (!C.url || !C.key) return err("ফর্মটি এখনো চালু হয়নি। একটু পরে চেষ্টা করুন।");
      err(""); btn.disabled = true; btn.textContent = "⏳ পাঠানো হচ্ছে…";
      var base = C.url.replace(/\/$/, ""), H = { apikey: C.key, Authorization: "Bearer " + C.key }, path = wk + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ".jpg";
      fetch(base + "/storage/v1/object/contest/" + path, { method: "POST", headers: Object.assign({ "Content-Type": "image/jpeg" }, H), body: shot.blob })
        .then(function (r) { if (!r.ok) throw new Error("upload"); var bodyO = { p_name: name, p_link: link, p_shot: base + "/storage/v1/object/public/contest/" + path, p_contact: contact, p_pct: info.pct != null ? info.pct : last.pct != null ? last.pct : null, p_score: info.score != null ? info.score : last.score != null ? last.score : null }, send = function (b) { return fetch(base + "/rest/v1/rpc/submit_entry", { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, H), body: JSON.stringify(b) }); };
          if (!window.mcVid) return send(bodyO);
          return send(Object.assign({ p_device: window.mcVid() }, bodyO)).then(function (r2) { return r2.status === 404 ? send(bodyO) : r2; }); }) // p_device: অ্যাডমিন যেন ফোন নম্বর ঠিক ইউজারের সাথে মেলাতে পারে (supabase-userinfo.sql চালানো না থাকলে আগের নিয়মেই জমা হয়)
        .then(function (r) { if (r.ok) return; return r.text().then(function (t) { throw new Error(/duplicate/i.test(t) ? "duplicate" : "submit"); }); })
        .then(function () { LSset("mc2_entry", { wk: wk, ts: Date.now() }); q("#cform").hidden = true; var d = q(".cdone"); if (d) d.hidden = true; q("#cok").hidden = false; })
        .catch(function (e) {
          btn.disabled = false; btn.textContent = "🎁 জমা দিন";
          err(e.message === "duplicate" ? "এই পোস্টের লিংক আগেই জমা হয়ে গেছে। অন্য পোস্টের লিংক দিন।" : "জমা হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।");
        });
    };
  }
  window.openContest = openContest;
  function fbWire() { var f = document.getElementById("fbfab"), u = C.fbPage || ""; if (f) { if (u) f.href = u; else f.onclick = function (e) { e.preventDefault(); var t = document.getElementById("toast"); if (t) { t.textContent = "ফেসবুক পেইজের লিংক শীঘ্রই আসছে"; t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 2200); } }; } var z = document.getElementById("pzb"); if (z) z.onclick = function () { openContest(); }; }
  function wire() { fbWire(); var b = document.getElementById("ctBtn"); if (!b) return; if (CT.on === false) return; b.hidden = false; b.onclick = function () { openContest(); }; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();

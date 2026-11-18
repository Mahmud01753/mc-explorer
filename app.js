// MC Explorer Challenge — নতুন ইন্টারফেস (হোম → খেলা → ফল/কার্ড → লিডারবোর্ড → চ্যালেঞ্জ → সার্ভে)
(function () {
  "use strict";
  const D = window.MC, C = window.MC_CFG || {}, $ = (s) => document.querySelector(s), V = $("#view");
  const bn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
  const ORD = ["", "১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"], ord = (n) => ORD[n] || bn(n) + "তম";
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  let TO; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(TO); TO = setTimeout(() => t.classList.remove("show"), 2400); }

  // ---------- ডেটা ----------
  const KINDS = [["ছাত্র", "male"], ["ছাত্রী", "female"], ["স্যার", "sir"], ["ম্যাম", "mam"], ["ভিজিটর", "visitor"]];
  const BATCHES = ["২০১৭-১৮", "২০১৮-১৯", "২০১৯-২০", "২০২০-২১", "২০২১-২২", "২০২২-২৩", "২০২৩-২৪", "২০২৪-২৫", "২০২৫-২৬", "অ্যালামনাই"], CUSTOM = "__custom", TEACHER = "শিক্ষক", VISITOR = "ভিজিটর";
  const CLUBS = [["", "কোনোটি নয়"], ["mukop", "মুকপ"], ["mohona", "মোহনা"], ["theatre", "থিয়েটার"], ["dept", "বিভাগীয় ক্লাব"]];
  const COL = { "লাল": "#d94b4b", "নীল": "#3b82d9", "হলুদ": "#e8c32e", "সাদা": "#f2f2f2" };
  const TIME = 20;
  let P = Object.assign({ name: "", dept: D.depts[0], batch: "২০২৫-২৬", kind: "", club: "", clubName: "" }, LS.get("mc2_profile", {})); P.kind = P.kind || "";
  if (!KINDS.some((k) => k[1] === P.kind)) P.kind = ""; if (!D.depts.includes(P.dept)) P.dept = D.depts[0]; if (!P.batch || P.batch === TEACHER || P.batch === VISITOR) P.batch = "২০২৩-২৪";
  const isT = () => P.kind === "sir" || P.kind === "mam", isV = () => P.kind === "visitor", isN = () => !P.kind, kcls = () => (isN() ? "r-n" : isV() ? "r-v" : isT() ? "r-t" : "r-s");
  const myDept = () => (isV() ? VISITOR : P.dept), myBatch = () => (isT() ? TEACHER : isV() ? VISITOR : P.batch);
  const rows = () => LS.get("mc2_lb", []).concat(window.MC_REMOTE_ROWS || []);
  const site = () => C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : /^https?:/.test(location.origin) ? location.origin + "/" : location.href.split("#")[0].split("?")[0];
  const siteShort = () => site().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const clubLabel = () => (isT() || isV() ? (P.post || "").trim() : P.club === "dept" ? (P.clubName || "").trim() : (CLUBS.find((c) => c[0] === P.club) || [0, ""])[1] === "কোনোটি নয়" ? "" : (CLUBS.find((c) => c[0] === P.club) || [0, ""])[1]);
  const tierOf = (score) => (score >= 920 ? 5 : Math.min(4, Math.floor(score / 200)));

  // ছোট ছবি: কোড দিয়ে আঁকা জায়গা
  // ছবির ছোট কপির ঠিকানা: সাইটের স্থির ছবি (images/places/X.jpg -> images/places/thumb/X.jpg) আর অ্যাডমিনের আপলোড করা ছবি (mc2-places/X.jpg -> mc2-places/t/X.jpg)। না থাকলে (বা না মিললে) null = সরাসরি ফুল ছবি
  const THB_BAD = {};
  function thumbOf(u) {
    u = String(u || ""); if (!u || /^(data:|blob:)/.test(u) || u.charAt(0) === "<") return null;
    const m = /^(.*\/images\/places\/|images\/places\/)([^\/?#]+)$/.exec(u) ? ["thumb/"] : /^(.*\/storage\/v1\/object\/public\/mc2-places\/)([^\/?#]+)$/.test(u) ? ["t/"] : null;
    if (!m) return null; const t = u.replace(/([^\/?#]+)$/, m[0] + "$1"); return THB_BAD[t] ? null : t;
  }
  function scene(p) {
    if (p.images && p.images.length) return p.images[(p.k || 0) % p.images.length];
    if (p.image) return p.image;
    const h = p.hue, n = p.w, ww = 260 / n; let win = "";
    for (let i = 0; i < n; i++) win += `<rect x="${270 + i * ww}" y="170" width="${ww - 10}" height="50" fill="#ffe9a8"/>`;
    const tx = p.tree === "বাম" ? 120 : 680;
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="hsl(${h},35%,75%)"/><rect y="340" width="800" height="160" fill="hsl(${h},30%,30%)"/><rect x="250" y="140" width="300" height="200" fill="hsl(${h},40%,38%)"/><path d="M235 140L400 80 565 140z" fill="hsl(${h},40%,25%)"/>${win}<rect x="355" y="228" width="90" height="26" fill="${COL[p.sign]}"/><rect x="375" y="262" width="50" height="78" fill="#1b1b1b"/><rect x="${tx - 8}" y="270" width="16" height="90" fill="#6b4a2b"/><circle cx="${tx}" cy="250" r="55" fill="#2f8f4e"/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }

  // ---------- লিডারবোর্ড হিসাব ----------
  function best() { // প্রতি জনের সেরা ফল
    const m = {};
    rows().forEach((r) => { const k = r.name.toLowerCase() + "|" + r.dept; if (!m[k] || r.score > m[k].score) m[k] = r; });
    return Object.values(m).sort((a, b) => b.score - a.score || a.ts - b.ts);
  }
  const deptRank = (name, dept) => { const l = best().filter((r) => r.dept === dept), i = l.findIndex((r) => r.name.toLowerCase() === name.toLowerCase()); return i < 0 ? 0 : i + 1; };
  const overallRank = (name, dept) => { const i = best().findIndex((r) => r.name.toLowerCase() === name.toLowerCase() && r.dept === dept); return i < 0 ? 0 : i + 1; };
  const avgBy = (key) => { const m = {}; best().forEach((r) => { (m[r[key]] = m[r[key]] || []).push(r.pct); }); return Object.entries(m).map(([k, a]) => [k, Math.round(a.reduce((x, y) => x + y, 0) / a.length), a.length]).sort((a, b) => b[1] - a[1]); };

  // ---------- রাউটার ----------
  let G = null, LAST = LS.get("mc2_last", null), PHOTO = null, BT = "dept";
  // ডিফল্ট কার্ড (০/১/২): অ্যাডমিন > হোম > ডিফল্ট কার্ড; বন্ধ বা ফাঁকা হলে চালু থাকা প্রথম কার্ড। cards.js-ও এটা ব্যবহার করে
  window.mcCardOrder = () => { const U = window.MCUI, o = U && U.ord ? U.ord() : [0, 1, 2], AL = o.filter((i) => !(U && U.off("c_" + (i + 1)))), base = AL.length ? AL : o, d = U && U.def ? U.def() : null, df = d != null && base.indexOf(d) >= 0 ? d : base[0]; return { all: [df].concat(o.filter((i) => i !== df)), on: [df].concat(base.filter((i) => i !== df)) }; }; // ডিফল্ট কার্ড সবসময় ১ম; বাকিরা সাজানো ক্রমে
  window.mcCardDefault = () => window.mcCardOrder().on[0];
  const setHd = (t, nw) => { $("#hdt").textContent = t; $("#hdtag").hidden = !nw; };
  function route() {
    if (G && G.iv) clearInterval(G.iv);
    let h = location.hash.replace(/^#/, "") || "home";
    if (h === "chat") { location.replace("#anon"); return; } // পুরোনো #chat বন্ধ: সব চ্যাট এন্ট্রি একই বেনামি চ্যাটে
    document.body.classList.remove("focus", "quiz", "dh", "inn");
    const inn = ["result", "board", "survey", "chat"].includes(h); document.body.classList.toggle("inn", inn); $("#xb").hidden = !inn;
    document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.t === (h === "anon" ? "chat" : h.split("=")[0])));
    if (h.startsWith("c=")) return challenge(h.slice(2));
    ({ home, play, result, board, survey, chat, anon: () => setHd("বেনামি চ্যাট") }[h] || home)();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", () => { const D = window.__mcDef; if (D && !D.done && (location.hash.replace(/^#/, "") || "home") !== "home") { D.start(); D.p.then(route); } else route(); }); // বাকি স্ক্রিপ্ট আসার আগে হোম ছাড়া অন্য পাতায় গেলে আসা পর্যন্ত অপেক্ষা

  // ---------- ১. হোম (প্রোফাইল ফর্ম) ----------
  function form(ctaLabel) {
    const opt = (list, cur) => list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`; }).join("");
    return `<input class="in" id="fn" placeholder="আপনার নাম" autocomplete="nickname" value="${esc(P.name)}" aria-label="আপনার নাম">
<div class="four ${kcls()}" id="four">
      <div class="fld" id="fk"><label class="lbl" for="sk">আপনি কে<b class="tk" id="kt"${P.kind ? "" : " hidden"}>✓</b></label><select class="in" id="sk" aria-label="আপনি কে"><option value=""${P.kind ? "" : " selected"}>বাছাই</option>${KINDS.map((k) => `<option value="${k[1]}"${k[1] === P.kind ? " selected" : ""}>${k[0]}</option>`).join("")}</select></div>
      <div class="fld" id="fp"><label class="lbl" for="fph">ছবি<b class="tk" id="pht" hidden>✓</b></label><label class="file" id="fl" title="নিজের ছবি (ঐচ্ছিক)"><input id="fph" type="file" accept="image/*" aria-label="নিজের ছবি (ঐচ্ছিক)"${isN() ? " disabled" : ""}><span>ছবি</span></label></div>
      <div class="fld" id="fd"${isV() ? " hidden" : ""}><label class="lbl" for="sd">বিভাগ</label><select class="in" id="sd" data-g="dept"${isN() ? " disabled" : ""}>${opt(D.depts.map((x) => [x, D.deptLabel(x)]), P.dept)}</select></div>
      <div class="fld" id="fb"${isT() || isV() ? " hidden" : ""}><label class="lbl" for="sb">সেশন</label><select class="in" id="sb" title="ব্যাচ (সেশন)"${isN() ? " disabled" : ""}>${opt(BATCHES.concat([[CUSTOM, "কাস্টম (নিজে লিখব)"]]), BATCHES.includes(P.batch) ? P.batch : CUSTOM)}</select></div>
      <div class="fld" id="fc"${isT() || isV() ? " hidden" : ""}><label class="lbl" for="sc">ক্লাব<b class="tk" id="clt"${P.club ? "" : " hidden"}>✓</b></label><select class="in" id="sc" data-g="club" title="ক্লাব (ঐচ্ছিক)"${isN() ? " disabled" : ""}>${opt(CLUBS, P.club)}</select></div>
      </div>
      <input class="in" id="sbc" maxlength="20" placeholder="নিজের ব্যাচ/সেশন লেখো, যেমন ২০১৯-২০" value="${BATCHES.includes(P.batch) ? "" : esc(P.batch)}"${BATCHES.includes(P.batch) || isN() || isT() || isV() ? " hidden" : ""} aria-label="কাস্টম ব্যাচ">
      <div class="fld" id="fo"${isT() || isV() ? "" : " hidden"}><label class="lbl" for="spo">পদবী (ঐচ্ছিক)</label><input class="in" id="spo" maxlength="30" placeholder="যেমন: সহকারী অধ্যাপক" value="${esc(P.post || "")}" aria-label="পদবী"></div>
      <input class="in" id="scc" maxlength="30" placeholder="ক্লাবের নাম লেখো, যেমন: রাষ্ট্রবিজ্ঞান ফোরাম" value="${esc(P.clubName || "")}"${P.club === "dept" && !isN() && !isT() && !isV() ? "" : " hidden"} aria-label="বিভাগীয় ক্লাবের নাম">
      <button class="btn o xl" id="go">${ctaLabel}</button><p class="msg" id="hmsg" role="status"></p><button type="button" class="rlink" id="rl">ℹ️ বিস্তারিত</button>`;
  }
  // ---------- খেলার নিয়ম (পপ-আপ) ----------
  // নিয়মের পপ-আপ দিনে কতবার (একই ফোনে): অ্যাডমিন > 🏠 হোম > home_cfg.rl = {on, max}; ডিফল্ট চালু, ৩ বার। শুধু খেলা শুরুর আগে গোনা হয়; "ℹ️ বিস্তারিত" সবসময় খোলে
  const rulesShow = () => {
    const H = (window.MCUI && MCUI.home && MCUI.home()) || {}, R = H.rl || {};
    if (R.on === false) return true;
    const max = Math.max(1, Math.min(20, Math.round(+R.max) || 3)), day = new Date().toDateString(), S = LS.get("mc2_rl", null) || {}, n = S.d === day ? (+S.n || 0) : 0;
    if (n >= max) return false;
    LS.set("mc2_rl", { d: day, n: n + 1 }); return true;
  };
  function showRules(cb, label, onX) {
    if (window.MCUI && MCUI.allOff(["r_prize", "r_rules", "r_badge"])) { if (cb) cb(); return; } // অ্যাডমিন সব অংশ বন্ধ করলে পপ-আপ না দেখিয়ে সরাসরি খেলা
    const rg = ["০ – ১৯৯", "২০০ – ৩৯৯", "৪০০ – ৫৯৯", "৬০০ – ৭৯৯", "৮০০ – ৯১৯", "৯২০ – ১০০০"];
    const bd = D.classes.map((n, i) => { const m = D.classMetal[i]; return `<div class="rb" style="background:linear-gradient(135deg,${m.g[0]},${m.g[1]} 50%,${m.g[2]});color:${m.t}"><b>${esc(n)}</b><span>${rg[i]}</span></div>`; }).join("");
    const el = document.createElement("div"); el.className = "rmodal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "খেলার নিয়ম");
    const CT = window.MC_CONTEST || {}, fb = (window.MC_CFG || {}).fbPage || "";
    const prize = CT.on === false ? "" : `<div class="pzbox" id="rlPrize"><h3>🏆 সাপ্তাহিক পুরস্কার</h3><p class="pzh">প্রতি সপ্তাহে <b>লটারির মাধ্যমে <span class="wcnt">${esc(window.MCUI && MCUI.wc ? MCUI.wc() : "৫ জন")}</span> বিজয়ী</b> পুরস্কার পাবেন 🎉</p><p class="pzu">পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন<b class="pzc" role="link" tabindex="0">এখানে ক্লিক ›</b></p>${CT.prize ? `<p>${esc(CT.prize)}</p>` : ""}
      <h3>📝 কীভাবে ফর্ম পূরণ করে জমা দেবেন</h3><ol class="pzs"><li>খেলা শেষে আপনার <b>MC কার্ড বা স্টোরি</b> ফেসবুকে পোস্ট/শেয়ার করুন (পোস্ট অবশ্যই <b>পাবলিক</b> রাখুন)।</li><li>“🎁 শেয়ার করে পুরস্কার জিতুন” বাটনে চাপ দিয়ে ফর্ম খুলুন।</li><li>ফর্মে <b>নাম</b>, <b>ফেসবুক পোস্টের লিংক</b> আর <b>পোস্টের স্ক্রিনশট</b> দিন।</li><li>চাইলে <b>WhatsApp নম্বর</b> আর <b>ফেসবুক আইডির লিংক</b> দিন (ঐচ্ছিক), বিজয়ী হলে যোগাযোগের জন্য। নম্বর ঠিক হলে ✅ টিক চিহ্ন আসবে।</li><li>“জমা দিন” চাপুন। জমা হলে এই সপ্তাহের লটারিতে আপনি থাকবেন।</li></ol>
      <p class="pzn">💡 চাইলে <b>ফেসবুক পেইজে</b> গিয়েও তথ্য জমা দিতে পারবেন, আবার ফর্মের ভেতর থেকেও। ফর্মের ভেতরেও ফেসবুক পেইজ বাটন আছে, সেখানেও তথ্য দেওয়া যাবে।</p>
      ${window.openContest ? `<button type="button" class="btn l s" id="rct">🎁 পুরস্কারের জন্য জমা দিন</button><p class="pzw">⚠️ আগে খেলা শেষ করে কার্ড বানান, তারপর ফর্ম জমা দিন।</p>` : ""}</div>`;
    el.innerHTML = `<div class="rbox"><h2>🎯 খেলার নিয়ম ও পুরস্কার</h2>${prize}<div id="rlFb"><button type="button" class="fbbtn" id="rfb" style="margin:0 0 10px">📘 ফেসবুক পেইজে যান</button></div><div id="rlRules"><h3>🎮 খেলার নিয়ম</h3><ul>
      <li>মোট <b>১০টি প্রশ্ন</b>, প্রতি প্রশ্নে <b>${bn(TIME)} সেকেন্ড</b>।</li>
      <li>ছবি কোনা থেকে ধীরে ধীরে খুলবে। <b>যত তাড়াতাড়ি চিনবেন, তত বেশি নম্বর।</b></li>
      <li>প্রতি প্রশ্নে সর্বোচ্চ <b>১০০ নম্বর</b>। প্রতি সেকেন্ডে <b>৫ নম্বর কাটা যাবে</b>, সবচেয়ে কম ৫।</li>
      <li>ভুল হলে <b>০</b>। সঠিক উত্তর বলা হবে না, ছবিও ঝাপসা হয়ে যাবে। স্কিপ করলেও ০।</li>
      <li>মোট <b>১০০০ নম্বর</b>। খেলা শেষে নম্বর অনুযায়ী ব্যাজসহ কার্ড পাবেন, বন্ধুকে চ্যালেঞ্জও দিতে পারবেন।</li></ul></div>
      <div id="rlBadges"><h3>🏅 কত পেলে কোন ব্যাজ</h3><div class="rbs">${bd}</div></div>
      <button class="btn o xl" id="rok">${label || "বুঝেছি"}</button></div>${onX ? `<button class="rx" id="rxx" aria-label="বন্ধ করুন">✕</button>` : ""}`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.querySelector("#rok").onclick = () => { close(); if (cb) cb(); };
    const rfb = el.querySelector("#rfb"); if (rfb) rfb.onclick = () => { if (fb) window.open(fb, "_blank", "noopener"); else toast("ফেসবুক পেইজের লিংক শীঘ্রই আসছে"); };
    const rct = el.querySelector("#rct"); if (rct) rct.onclick = () => { window.openContest({ name: P.name }); };
    if (onX) el.querySelector("#rxx").onclick = () => { close(); onX(); };
    else el.onclick = (e) => { if (e.target === el) close(); };
  }
  function bindForm(onGo) {
    const sync = () => { const n = isN(); $("#fd").hidden = isV(); $("#fb").hidden = isT() || isV(); $("#fc").hidden = isT() || isV(); $("#fo").hidden = !(isT() || isV()); $("#scc").hidden = n || isT() || isV() || $("#sc").value !== "dept"; $("#sbc").hidden = n || isT() || isV() || $("#sb").value !== CUSTOM; $("#four").className = "four " + kcls(); ["#fph", "#sd", "#sb", "#sc"].forEach((q) => { $(q).disabled = n; }); $("#four").querySelectorAll(".fld").forEach((f) => { if (f.id !== "fk") f.classList.toggle("off", n); }); $("#kt").hidden = n; };
    const nudge = (anchor) => { // "আপনি কে" না বাছলে: বক্সের ঠিক নিচে ছোট পপ-আপ
      const old = document.getElementById("kpop"); if (old) old.remove();
      const a = (anchor || $("#sk")).getBoundingClientRect(), el = document.createElement("div"); el.id = "kpop"; el.setAttribute("role", "alert");
      el.innerHTML = "<b>⚠️ বাছাই করুন</b><span>আগে “আপনি কে” বাছাই করুন</span>"; document.body.appendChild(el);
      const w = el.offsetWidth, l = Math.max(8, Math.min(innerWidth - w - 8, a.left + a.width / 2 - w / 2));
      el.style.left = l + "px"; el.style.top = (a.bottom + 10) + "px"; el.style.setProperty("--ax", Math.max(14, Math.min(w - 14, a.left + a.width / 2 - l)) + "px");
      mk($("#sk"), true); setTimeout(() => { el.remove(); }, 2600);
    };
    $("#four").addEventListener("click", (e) => { const f = e.target.closest(".fld.off"); if (f) { e.preventDefault(); nudge(f); } });
    V.querySelectorAll("select[data-g]").forEach((s) => s.onchange = () => { P[s.dataset.g] = s.value; });
    $("#rl").onclick = () => showRules();
    $("#fn").addEventListener("input", (e) => { const el = e.target, p = el.selectionStart, v = el.value.toUpperCase(); if (v !== el.value) { el.value = v; try { el.setSelectionRange(p, p); } catch (_) {} } });
    $("#fph").onchange = (e) => { const f = e.target.files[0]; if (!f) { PHOTO = null; return; } const fr = new FileReader(); fr.onload = async () => { try { const l = $("#fl"), sp = l.querySelector("span"); let im = l.querySelector("img"); if (!im) { im = document.createElement("img"); im.alt = ""; l.insertBefore(im, sp); } im.src = fr.result; sp.textContent = "ছবি"; $("#pht").hidden = false; } catch (_) {} PHOTO = await li(fr.result); savePhoto(PHOTO); }; fr.readAsDataURL(f); };
    $("#sc").onchange = () => { $("#clt").hidden = $("#sc").value === ""; $("#scc").hidden = $("#sc").value !== "dept"; if (!$("#scc").hidden) $("#scc").focus(); };
    $("#sb").onchange = () => { $("#sbc").hidden = $("#sb").value !== CUSTOM; if ($("#sb").value !== CUSTOM) { P.batch = $("#sb").value; mk($("#sbc"), false); clr(); } else $("#sbc").focus(); };
    $("#sk").onchange = (e) => { P.kind = e.target.value; const kp = document.getElementById("kpop"); if (kp) kp.remove(); mk($("#sk"), false); clr(); sync(); };
    sync();
    const mk = (el, b) => { if (el) el.classList.toggle("bad", !!b); }, hm = $("#hmsg");
    const clr = () => { if (!V.querySelector(".bad") && hm) { hm.textContent = ""; hm.className = "msg"; } };
    ["#fn", "#sbc"].forEach((q) => $(q).addEventListener("input", (e) => { mk(e.target, !e.target.value.trim()); clr(); }));
    $("#go").onclick = () => {
      if (isN()) { mk($("#sk"), true); mk($("#fn"), !$("#fn").value.trim()); hm.className = "msg warn"; hm.textContent = "সোনালি দাগ দেওয়া ঘরগুলো পূরণ করুন।"; return nudge(); }
      { const n0 = $("#fn").value.trim(), needB = !isT() && !isV(), b0 = $("#sb").value === CUSTOM ? $("#sbc").value.trim() : $("#sb").value; // জরুরি ঘর খালি থাকলে সোনালি দাগ (আগের টোস্ট/ফোকাসও নিচে আগের মতোই চলে)
        mk($("#fn"), !n0); mk($("#sbc"), needB && !b0 && $("#sb").value === CUSTOM);
        if (!n0 || (needB && !b0)) { hm.className = "msg warn"; hm.textContent = "সোনালি দাগ দেওয়া ঘরগুলো পূরণ করুন।"; } else { hm.textContent = ""; hm.className = "msg"; } }
      const n = $("#fn").value.trim().replace(/\s+/g, " ").toUpperCase();
      if (!n) { $("#fn").focus(); return toast("আগে আপনার নাম লিখুন"); }
      P.name = n;
      const sel = $("#sb").value, bt = sel === CUSTOM ? $("#sbc").value.trim().replace(/\s+/g, " ") : sel;
      if (!isT() && !isV() && !bt) { $("#sbc").focus(); return toast("আপনার ব্যাচ/সেশন লিখুন"); }
      if (!isT() && !isV()) P.batch = bt;
      P.post = (isT() || isV()) ? $("#spo").value.trim().replace(/\s+/g, " ") : (P.post || ""); P.clubName = P.club === "dept" ? $("#scc").value.trim().replace(/\s+/g, " ") : ""; LS.set("mc2_profile", P); onGo();
    };
  }
  // হোমে জমা দিলে ছোট অভিনন্দন প্যানেল ২ সেকেন্ড দেখিয়ে তারপর খেলা শুরু
  function welcome(cb) {
    const go = $("#go"); if (!go || $("#wel")) return;
    const parts = [(KINDS.find((k) => k[1] === P.kind) || [0, ""])[0], isV() ? "" : D.deptLabel(P.dept), !isT() && !isV() ? P.batch : "", clubLabel()].filter(Boolean);
    const w = document.createElement("div"); w.className = "wel"; w.id = "wel"; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite");
    w.innerHTML = `<div class="wl1"><span aria-hidden="true">🎉</span><span class="wl1t">অভিনন্দন,</span><b>${esc(P.name)}</b></div><div class="wl2">${parts.map((t) => `<span>${esc(t)}</span>`).join("")}</div><div class="wbar" aria-hidden="true"><i></i><em>কুইজ শুরু হচ্ছে…</em></div>`;
    go.style.display = "none"; go.insertAdjacentElement("afterend", w);
    try { w.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    setTimeout(() => { if (document.body.contains(w)) cb(); }, 2000);
  }
  function home() {
    setHd("MC Explorer");
    const all = rows(), today = all.filter((r) => new Date(r.ts).toDateString() === new Date().toDateString()), b = best();
    const dAvg = avgBy("dept"), top = b.filter((r) => new Date(r.ts).toDateString() === new Date().toDateString()).slice(0, 3);
    document.body.classList.add("dh");
    const srv = !!(C.url && C.key) && !(window.MCUI && MCUI.boardOff && MCUI.boardOff());
    const todayHtml = (n, da) => n ? `<div class="row">🔥 আজ <b style="margin:0">${bn(n)}</b> জন খেলেছে</div>${da.length ? `<div class="row">🏆 সেরা বিভাগ আজ: <b>${esc(D.deptLabel(da[0][0]))} ${bn(da[0][1])}%</b></div>` : ""}` : `<div class="row">🔥 আজ এখনো কেউ খেলেনি — প্রথম স্কোরটা আপনার হোক</div>`;
    const topHtml = (L) => `<div class="sm" style="margin-bottom:4px">আজকের শীর্ষ ${bn(L.length)}</div>${L.map((r, i) => `<div class="row">${["🥇", "🥈", "🥉"][i]} ${esc(r.name)}<b>${bn(r.pct)}%</b></div>`).join("")}`;
    const avgOf = (L) => { const m = {}; L.forEach((r) => { (m[r.dept] = m[r.dept] || []).push(r.pct); }); return Object.entries(m).map(([k, a]) => [k, Math.round(a.reduce((x, y) => x + y, 0) / a.length)]).sort((x, y) => y[1] - x[1]); };
    const locL = b.filter((r) => new Date(r.ts).toDateString() === new Date().toDateString());
    V.innerHTML = `<section class="hero"><span class="hchip">⭐ কুইজ চ্যালেঞ্জ</span><h1 class="htt"><span>তুমি</span> <em>এম.সি</em><br><b>কতটুকু চেনো?</b></h1></section><div class="fcard">${form("MC কতটুকু চেনো? →")}</div>
      <div class="box" id="hbToday">${srv ? '<div class="row">⏳ আজকের হিসাব আসছে…</div>' : todayHtml(locL.length, avgOf(locL))}</div>
      <div class="box" id="hbTop"${srv || !locL.length ? ' style="display:none"' : ""}>${srv || !locL.length ? "" : topHtml(locL.slice(0, 3))}</div>
      ${LAST ? `<a class="btn l s" id="hbLast" href="#result">🪪 আগের কার্ড দেখো (${bn(LAST.pct)}%)</a>` : ""}
      <a class="btn o xl" id="hbChat" href="#anon">💬 বেনামি চ্যাট করুন</a>`;
    bindForm(() => { LS.set("mc2_vs", null); G = null; welcome(() => { location.hash = "play"; }); });
    if (srv) { // সবার আজকের স্কোর সার্ভার থেকে; না এলে এই ফোনের হিসাব
      const fill = (L, n) => { const bt = $("#hbToday"), tp = $("#hbTop"); if (!bt) return; bt.innerHTML = todayHtml(n, avgOf(L)); if (tp) { const t3 = L.slice(0, 3); tp.style.display = t3.length ? "" : "none"; tp.innerHTML = t3.length ? topHtml(t3) : ""; } };
      let tries = 0;
      const go = () => {
        if (!$("#hbToday")) return;
        if (!window.mcToday) { if (tries++ < 24) setTimeout(go, 500); else fill(locL, locL.length); return; }
        window.mcToday().then((r) => fill((r.rows || []).map((x) => ({ name: x.name, dept: x.dept, pct: x.pct })), r.total || 0)).catch(() => fill(locL, locL.length));
      };
      go();
    }
    if (window.__mcNeedName) { window.__mcNeedName = 0; const pu = document.createElement("div"); pu.textContent = "কার্ড পেতে আগে নাম দিয়ে খেলুন"; pu.style.cssText = "position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);background:#16301f;color:#fff;padding:14px 22px;border-radius:16px;font-weight:700;font-size:17px;text-align:center;max-width:86vw;z-index:99999;box-shadow:0 8px 28px rgba(0,0,0,.45);pointer-events:none;transition:opacity .3s"; document.body.appendChild(pu); setTimeout(() => { pu.style.opacity = "0"; setTimeout(() => pu.remove(), 350); }, 2800); setTimeout(() => { const f = $("#fn"); if (f) { try { f.focus(); f.click(); } catch (_) {} } }, 80); } // নামের বক্সে ফোকাস পড়ুক বা না পড়ুক, পপ-আপ লেখা আগে নিজে ভাসে (কীবোর্ডের নিচে ঢাকা পড়ে না)
  }

  // ---------- খেলা ----------
  // কম দেখা জায়গা আগে: এই ফোনে যে জায়গা কম এসেছে সেগুলো আগে ধরে ১০টা বাছা (দ্বিতীয়বার খেললে বেশিরভাগ নতুন প্রশ্ন); একই জায়গার ছবি ঘুরিয়ে ঘুরিয়ে দেখায়।
  function pickPlaces(pl) {
    const seen = LS.get("mc2_seen", {}), pick = shuffle(pl).sort((x, y) => (seen[x.bn] || 0) - (seen[y.bn] || 0)).slice(0, 10);
    pick.forEach((p) => { p.k = seen[p.bn] || 0; seen[p.bn] = p.k + 1; }); LS.set("mc2_seen", seen);
    return shuffle(pick);
  }
  // অ্যাডমিনের ছবি থেকে স্বয়ংক্রিয় MCQ: সেটিংসের প্রশ্নসংখ্যা ও ক্যাটাগরি মেনে র‍্যান্ডম প্রশ্ন (community.js লোড করে)
  function buildDbQs() {
    const Q = window.MC_QUIZ; if (!Q || !Q.qs || Q.qs.length < 4) return null;
    let pool = Q.qs.filter((x) => !Q.cats || !Q.cats.length || Q.cats.includes(x.cat || "__none"));
    if (pool.length < 4) pool = Q.qs;
    const seen = LS.get("mc2_seenq", {}), n = Math.max(1, Math.min(Q.count || 10, pool.length));
    const pick = shuffle(pool).sort((x, y) => (seen[x.id] || 0) - (seen[y.id] || 0)).slice(0, n); // কম দেখা ছবি আগে, সমান হলে র‍্যান্ডম
    pick.forEach((x) => { seen[x.id] = (seen[x.id] || 0) + 1; }); LS.set("mc2_seenq", seen);
    // ভুল অপশন: সব ছবির নামের মধ্যে সঠিক নামের সবচেয়ে কাছাকাছি (একই শব্দ/অক্ষরজোড়া + একই ক্যাটাগরি) নামগুলো; একটু র‍্যান্ডম মিশিয়ে প্রতিবার আলাদা
    const catOf = {}; Q.qs.forEach((z) => { if (z.a && !(z.a in catOf)) catOf[z.a] = z.cat || ""; });
    const names = Object.keys(catOf), bg = (t) => { t = String(t || "").replace(/\s+/g, ""); const r = new Set(); for (let i = 0; i < t.length - 1; i++) r.add(t.slice(i, i + 2)); return r; }, wd = (t) => new Set(String(t || "").split(/\s+/).filter(Boolean));
    const sim = (a, b) => { const A = bg(a), B = bg(b); let i = 0; A.forEach((t) => B.has(t) && i++); let w = 0; const WB = wd(b); wd(a).forEach((t) => WB.has(t) && w++); return i / Math.max(1, A.size + B.size - i) + w * 0.5; };
    const wrongFor = (x) => { const n = (x.w || []).length || 3; if (names.length - 1 < n) return (x.w || []).slice(); return names.filter((t) => t !== x.a).map((t) => ({ t, s: sim(x.a, t) + (catOf[t] === (x.cat || "") ? 0.3 : 0) + Math.random() * 0.15 })).sort((u, v) => v.s - u.s).slice(0, n).map((u) => u.t); };
    return shuffle(pick).map((x) => ({ id: x.id, p: { bn: x.bn, name: x.bn, images: [x.img], k: 0, zs: Math.floor(Math.random() * 8) }, a: x.a, q: x.q || "এটা কোন জায়গা?", z: 1, o: shuffle([x.a].concat(wrongFor(x))) }));
  }
  function buildQs() {
    const dq = buildDbQs(); if (dq) return dq;
    const pl = D.places, qs = pickPlaces(pl).map((p) => ({ p, a: p.bn, q: "এটা কোন জায়গা?", z: 1, o: shuffle([p.bn].concat(shuffle(pl.filter((x) => x !== p)).slice(0, 3).map((x) => x.bn))) }));
    shuffle(pl).slice(0, Math.max(0, 10 - pl.length)).forEach((p, i) => {
      const k = i % 3;
      if (k === 0) { const s = new Set([bn(p.w)]); [2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).forEach((n) => s.size < 4 && s.add(bn(n))); qs.push({ p, a: bn(p.w), q: `${p.bn}-এর ছবিতে কয়টি জানালা দেখা যাচ্ছে?`, o: shuffle([...s]) }); }
      else if (k === 1) qs.push({ p, a: p.tree, q: `${p.bn}-এর ছবিতে গাছটি ভবনের কোন দিকে?`, o: ["বাম", "ডান"] });
      else qs.push({ p, a: p.sign, q: `${p.bn}-এর দরজার ওপরের সাইনবোর্ডের রং কী?`, o: shuffle(Object.keys(COL)) });
    });
    return shuffle(qs).slice(0, 10);
  }
  function play() {
    if (!P.name) { location.hash = "home"; return; }
    document.body.classList.add("focus", "quiz");
    if (!G) { const qn = +LS.get("mc2_qn", 0) || 0; LS.set("mc2_qn", qn + 1); G = { qn, qs: buildQs(), i: 0, ok: 0, score: 0, vs: LS.get("mc2_vs", null), first: "", sid: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9), log: [] }; }
    if (!G.shown) { const go = () => { G.shown = 1; LS.set("mc2_rules", 1); qrender(); }; if (!rulesShow()) { go(); return; } showRules(go, "বুঝেছি, শুরু করি", () => { G = null; location.hash = "home"; }); return; }
    qrender();
  }
  // শুরুর জায়গা: গ্রুপ ঠিক হয় এই ডিভাইসের n-তম খেলা (mc2_qn, ০ থেকে) দিয়ে: ১ম-৪র্থ খেলায় ৪ কোনা (ZP 0-3), ৫ম-৮ম খেলায় ৪ মাঝ (ZP 4-7), ৯ম থেকে আবার চক্র।
  // গ্রুপের ভেতরে: এই ছবির জন্য আগে ব্যবহার না হওয়া জায়গা আগে (mc2_zd: ছবি -> ব্যবহৃত জায়গার তালিকা); গ্রুপের সবগুলো আগে ব্যবহার হয়ে থাকলে গ্রুপ থেকেই র‍্যান্ডম (খেলার নিয়ম আগে, তাই একই জায়গা আবার আসতে পারে)। ছবির ৮টা জায়গা শেষ হলে তার তালিকা মুছে আবার প্রথম থেকে।
  const qc = () => (window.MCQ ? MCQ.get() : { mode: "zoom", dur: TIME, sc: 3.6, ease: "linear", delay: 0, cor: [0, 1, 2, 3, 4, 5, 6, 7], ord: "rand", rep: 1, rok: true, rokT: 0.5, wbl: true, wblPx: 24, thumb: false, fade: true });
  function qfreeze(zi) { const t = getComputedStyle(zi).transform; if (G.za) { G.za.cancel(); G.za = null; } zi.style.transition = "none"; zi.style.transform = t; void zi.offsetWidth; } // এখন যতটুকু খুলেছে সেখানেই থামায়
  function qcor(c) { // কোণ বাছাই: ৮টিই টিক থাকলে আগের নিয়ম; নইলে অ্যাডমিনের টিক-করা কোণ থেকে (এলোমেলো/ক্রমানুসারে/একটাই)
    const Q = qc(); if (Q.cor.length >= 8 && Q.ord === "rand") return zpick(c);
    if (c.zr == null) c.zr = Q.ord === "fix" ? Q.cor[0] : Q.ord === "seq" ? Q.cor[((G && G.qn) || 0) % Q.cor.length] : Q.cor[Math.floor(Math.random() * Q.cor.length)];
    return c.zr;
  }
  function zpick(c) {
    if (c.zr == null) {
      const grp = ((G && G.qn) || 0) % 8 < 4 ? [0, 1, 2, 3] : [4, 5, 6, 7], key = String(c.id != null ? c.id : (c.p && c.p.bn) || "?"), Z = LS.get("mc2_zd", {}) || {}, used = Array.isArray(Z[key]) ? Z[key] : [];
      const fresh = grp.filter((x) => !used.includes(x)), pool = fresh.length ? fresh : grp;
      c.zr = pool[Math.floor(Math.random() * pool.length)];
      const nu = used.includes(c.zr) ? used : used.concat(c.zr); Z[key] = nu.length >= 8 ? [] : nu; LS.set("mc2_zd", Z);
    }
    return c.zr;
  }
  function qrender() {
    document.body.classList.add("focus", "quiz"); const c = G.qs[G.i]; G.left = TIME; G.locked = false; G.t0 = Date.now();
    setHd(`প্রশ্ন ${bn(G.i + 1)}/${bn(G.qs.length)}`);
    V.innerHTML = `<div class="meta"><span>✔ ${bn(G.ok)}</span><span class="tm" id="tm">⏱ ${bn(G.left)} · +${bn(100)}</span><span>স্কোর ${bn(G.score)}</span></div><div class="prog"><i style="width:${G.i / G.qs.length * 100}%"></i></div>
      <div class="zbox" id="zb"><img id="zi" alt="ক্যাম্পাসের ছবি"></div><div class="cr" id="cr" hidden></div><p class="q">${esc(c.q)}</p>
      <div class="opts" id="opts">${c.o.map((o) => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div><div class="skips"><button type="button" class="skip" id="sk1">⏭ স্কিপ</button><button type="button" class="skip all" id="skA">⏭⏭ সব স্কিপ</button></div><a class="sm" href="#home" style="text-align:center;margin-top:6px">✕ খেলা ছাড়ো</a>`;
    { const u = scene(c.p), zi = $("#zi"), zb = $("#zb"); if (c.z) { const ZP = [["0%", "0%"], ["100%", "100%"], ["100%", "0%"], ["0%", "100%"], ["50%", "0%"], ["50%", "100%"], ["0%", "50%"], ["100%", "50%"]], [ox, oy] = ZP[qcor(c)]; zb.classList.add("zoom"); zi.style.transformOrigin = ox + " " + oy; zi.style.transform = "scale(" + (qc().mode === "zoom" ? qc().sc : 1) + ")"; G.zi = zi; G.za = null; } let f1 = 1; zi.onload = () => { if (!f1) return; f1 = 0; G.t0 = Date.now(); G.left = TIME; if (c.z) { const r = zi.naturalWidth / zi.naturalHeight; zb.style.aspectRatio = r; zb.style.width = `min(100%, ${(60 * r).toFixed(1)}vh)`; zb.style.margin = "0 auto"; void zi.offsetWidth; const Q = qc(); if (Q.mode !== "still" && zi.animate) try { G.za = zi.animate([{ transform: "scale(" + (Q.mode === "zoom" ? Q.sc : 1) + ")" }, { transform: "scale(" + (Q.mode === "zoom" ? 1 : Q.sc) + ")" }], { duration: Q.dur * 1000, delay: Q.delay * 1000, easing: Q.ease, iterations: Q.rep, fill: "both" }); } catch (e) {} } }; const t = !qc().thumb || (window.MCUI && MCUI.off("q_thumb")) ? null : thumbOf(u), bg = (x) => zb.style.setProperty("--bg", `url("${x}")`);
      if (t) { // ধীর নেটে: আগে ছোট (অল্প কোয়ালিটির) কপি দেখায় ও টাইমার শুরু হয়; ফুল ছবি পুরোপুরি নামলে তবেই বদলায় (আধা-নামা ছবি কখনো দেখায় না)। ছোট কপি না থাকলে সরাসরি ফুল ছবি
        zi.onerror = () => { zi.onerror = null; THB_BAD[t] = 1; zi.src = u; bg(u); }; zi.src = t; bg(t);
        const fi = new Image(); fi.onload = () => { if (G && G.qs && G.qs[G.i] === c && zi.isConnected) { zi.onerror = null; zi.src = u; bg(u); if (qc().fade && !(window.MCUI && MCUI.off("q_fade")) && zi.animate) try { zi.animate([{ filter: "blur(6px)" }, { filter: "blur(0px)" }], { duration: 600, easing: "ease-out" }); } catch (e) {} } }; fi.src = u;
      } else { zi.src = u; bg(u); } const cr = (D.credits || {})[u], el = $("#cr"); el.hidden = !cr; el.textContent = cr ? "ছবি: " + cr : ""; }
    V.querySelectorAll(".opt").forEach((b) => b.onclick = () => answer(b.dataset.o));
    $("#sk1").onclick = skip;
    $("#skA").onclick = () => { const b = $("#skA"); if (b.dataset.arm) { clearTimeout(G.armT); skipAll(); return; } b.dataset.arm = "1"; b.textContent = "আবার চাপলে খেলা শেষ"; b.classList.add("arm"); G.armT = setTimeout(() => { b.dataset.arm = ""; b.textContent = "⏭⏭ সব স্কিপ"; b.classList.remove("arm"); }, 3000); };
    clearInterval(G.iv);
    G.iv = setInterval(() => { G.left--; const t = $("#tm"); if (t) { t.textContent = "⏱ " + bn(Math.max(G.left, 0)) + " · +" + bn(Math.max(5, 100 - 5 * Math.floor((Date.now() - G.t0) / 1000))); t.classList.toggle("low", G.left <= 5); } if (G.left <= 0) answer(null); }, 1000);
  }
  function logA(c, o, sk) { if (c && c.id != null) G.log.push({ pid: c.id, c: o, ms: Math.max(0, Date.now() - G.t0), s: sk ? 1 : 0 }); }
  function skip() { if (G.locked) return; logA(G.qs[G.i], null, 1); G.locked = true; clearInterval(G.iv); clearTimeout(G.armT); if (++G.i >= G.qs.length) finish(); else qrender(); }
  function skipAll() { if (G.locked) return; G.qs.slice(G.i).forEach((c, k) => logA(c, null, 1)); G.locked = true; clearInterval(G.iv); clearTimeout(G.armT); finish(); }
  function answer(o) {
    if (G.locked) return; G.locked = true; clearInterval(G.iv);
    const c = G.qs[G.i], ok = o === c.a; logA(c, o, o == null);
    if (!ok) { const zi = $("#zi"); if (zi) { if (c.z) qfreeze(zi); void zi.offsetWidth; if (qc().wbl) { zi.style.transition = "filter .25s"; zi.style.filter = "blur(" + qc().wblPx + "px)"; } } } // ভুল/সময় শেষ: যতটুকু খুলেছে সেখানেই থামে আর সঙ্গে সঙ্গে ঝাপসা
    if (ok && c.z && G.zi) { qfreeze(G.zi); if (qc().rok) { G.zi.style.transition = "transform " + qc().rokT + "s ease-out"; G.zi.style.transform = "scale(1)"; } }
    if (ok) { G.ok++; const pts = Math.max(5, 100 - 5 * Math.floor((Date.now() - G.t0) / 1000)); G.score += pts; if (pts > (G.bl || 0)) { G.bl = pts; G.first = c.p.bn; } }
    $("#opts").classList.add("lock");
    V.querySelectorAll(".opt").forEach((b) => { if (ok && b.dataset.o === c.a) b.classList.add("ok"); else if (!ok && b.dataset.o === o) b.classList.add("no"); }); // ভুল হলে সঠিক উত্তর বা পুরো ছবি দেখানো হয় না
    setTimeout(() => { if (++G.i >= G.qs.length) finish(); else qrender(); }, 900);
  }
  async function finish() {
    const pct = Math.round(G.score / (100 * G.qs.length) * 100), hist = LS.get("mc2_hist", []), pk = await window.pickTitleOnline(P.kind, hist, isT() || isV() || P.club === "dept" ? "" : P.club);
    hist.push(pk.title); LS.set("mc2_hist", hist.slice(-60));
    const sc = G.qs.length === 10 ? G.score : Math.round(G.score * 10 / G.qs.length); // স্কোর সবসময় ১০০০-এর মধ্যে (প্রশ্নসংখ্যা বদলালেও কার্ড/র‍্যাংক ঠিক থাকে)
    const r = { name: P.name, dept: myDept(), batch: myBatch(), kind: P.kind, club: clubLabel(), pct, score: sc, ok: G.ok, total: G.qs.length, title: pk.title, bestPlace: G.first || "—", ts: Date.now() };
    const l = LS.get("mc2_lb", []); l.push(r); LS.set("mc2_lb", l.slice(-500)); if (window.mcSubmitScore) window.mcSubmitScore(r);
    if (G.log && G.log.length) { // সঠিক-ভুল উত্তর: ফোনে সর্বশেষ ২০ খেলা + সার্ভারে
      const al = LS.get("mc2_alog", []); al.push({ sid: G.sid, ts: r.ts, name: r.name, pct, score: sc, ok: G.ok, total: G.qs.length, items: G.log.map((l) => { const q = G.qs.find((x) => x.id === l.pid) || {}; return { bn: q.a, c: l.c, ok: l.c != null && l.c === q.a }; }) }); LS.set("mc2_alog", al.slice(-20));
      if (window.mcSubmitAnswers) window.mcSubmitAnswers(G.sid, r.name, G.log);
    }
    LAST = Object.assign({}, r, { vs: G.vs }); LS.set("mc2_last", LAST); G = null;
    location.hash = "result";
  }

  // ---------- ২. ফল + কার্ড ----------
  const li = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
  // ২০২৬-১০-২০ (কাজ ১৪): লোগো একবারই লোড হয়ে মেমোরিতে থাকে (লোড না হলে ক্যাশে থাকে না, পরেরবার আবার চেষ্টা)। ছবির জন্য আগের li-ই চলে।
  const LIC = {}, liC = (s) => LIC[s] || (LIC[s] = li(s).then((i) => { if (!i) delete LIC[s]; return i; })), QRM = {}, qrOf = (u) => QRM[u] || (QRM[u] = window.makeQR(u));
  // মাপার জন্য (ডিফল্টে বন্ধ): ঠিকানায় ?perf যোগ করলে বা localStorage-এ mc2_perf=1 দিলে কনসোলে সময় দেখায়
  let PERF = false; try { PERF = /[?&]perf\b/.test(location.search) || localStorage.getItem("mc2_perf") === "1"; } catch (e) {}
  // ছবি ফোনে ছোট করে রাখা হয় (শুধু এই ডিভাইসে), যাতে রিফ্রেশ করলেও কার্ড ও স্টোরিতে ছবি থাকে
  function savePhoto(im) {
    try {
      if (!im) { LS.set("mc2_photo", null); return; }
      const n = Math.min(im.naturalWidth, im.naturalHeight), k = Math.min(1, 640 / n), sz = Math.round(n * k), cv = document.createElement("canvas"); cv.width = cv.height = sz;
      cv.getContext("2d").drawImage(im, (im.naturalWidth - n) / 2, (im.naturalHeight - n) / 2, n, n, 0, 0, sz, sz); LS.set("mc2_photo", cv.toDataURL("image/jpeg", 0.85));
    } catch (e) {}
  }
  async function loadPhoto() { if (PHOTO) return; const sp = LS.get("mc2_photo", null); if (sp) PHOTO = await li(sp); }
  // ফন্টের প্রমিস একবারই চলে; সব ফন্ট সত্যিই পাওয়া গেলে তবেই মনে রাখা হয় (ফন্ট CSS না এলে পরেরবার আবার চেষ্টা)
  let FP = null;
  function fonts() {
    if (FP) return FP;
    const p = (async () => {
      try { if (!window.__fcss) await Promise.race([new Promise((r) => document.addEventListener("mcfontcss", r, { once: true })), new Promise((r) => setTimeout(r, 4000))]); } catch (e) {}
      try { const r = await Promise.all([800, 700, 500].map((w) => document.fonts.load(w + ' 40px "Anek Bangla"', "০১২৩৪৫৬৭৮৯")).concat([800, 700, 600, 500].map((w) => document.fonts.load(w + ' 30px "Hind Siliguri"', "০১২৩৪৫৬৭৮৯")))); if (!(r && r.length && r.every((x) => x && x.length))) FP = null; } catch (e) { FP = null; }
      try { await document.fonts.load('700 40px "Barlow Condensed"', "MAHMUDUL"); } catch (e) {} // ২নং কার্ডের নামের ফন্ট (না এলে Hind Siliguri)
    })();
    FP = p; return p;
  }
  let LOV = null; // ইউজারের নিজের বাছা লোগো (ড্রপডাউন, শুধু এই ফল-পাতার কার্ড/স্টোরির জন্য; সার্ভারে জমা হয় না)
  async function cardOpts(R) {
    const LG0 = window.mcLogo ? await window.mcLogo.now(LOV).catch(() => null) : null, LG = LG0 && LG0.lm && LG0.ln ? LG0 : null; // অ্যাডমিনের বাছাই করা লোগো/অন-অফ/অক্ষর (না এলে আগের ডিফল্ট দুই লোগো)
    const t = tierOf(R.score), [lm, ln] = LG ? [LG.lm, LG.ln] : await Promise.all([liC(D.logos.mc), liC(D.logos.nu)]), dr = deptRank(R.name, R.dept) || (best().filter((r) => r.dept === R.dept).length + 1), s = site();
    return Object.assign({ tier: t, score: R.score, club: R.club, pct: R.pct, photo: PHOTO, name: R.name, dept: R.dept, batch: R.batch, deptLabel: D.deptLabel(R.dept), drank: dr, best: R.bestPlace, date: new Date(R.ts).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }), title: R.title, ok: R.ok, total: R.total, rank: overallRank(R.name, R.dept) || 1, game: "Guess the Place", lm, ln, lgm: LG ? LG.lgm : undefined, lgs: LG ? LG.lgs : undefined, tl: LG ? LG.tl : undefined, tr: LG ? LG.tr : undefined, lg: LG ? LG.lg : undefined, col: D.classCols[t], metal: D.classMetal[t], cname: D.classes[t], qr: window.makeQR ? (qrOf(s) || qrOf(site())) : null, site: siteShort() }, window.mcCardDims ? window.mcCardDims() : {});
  }
  // পেজ খুলে অলস সময়ে ফন্ট ও দুটি লোগো আগে থেকে লোড
  { const go = () => { try { fonts(); liC(D.logos.mc); liC(D.logos.nu); } catch (e) {} }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500); }
  const caption = (R) => `আমি MC ${bn(R.pct)}% জানি — তুমি কত? 👉 ${qrLink(R)}`;
  // ডাউনলোড ফাইলের নাম: নাম_বিভাগের-শর্ট_মার্ক (স্টোরিতে শেষে _story)
  const fname = (R, story) => { const nm = String(R.name || "MC").trim().replace(/[\\/:*?"<>|.]+/g, "").replace(/\s+/g, "_") || "MC", sh = (D.deptShort ? D.deptShort(R.dept) : "") || "MC"; return `${nm}_${sh}_${Math.round(R.score != null ? R.score : R.pct * 10)}${story ? "_story" : ""}.png`; };
  // PNG ফাইলের সাইজ: ডিফল্টে সীমা নেই (হাই কোয়ালিটি, প্রিভিউয়ের হুবহু); অ্যাডমিন সীমা দিলে ও তার বেশি হলে একই ছবি অনুপাত ঠিক রেখে ধাপে ধাপে ছোট হয়
  // সীমা অ্যাডমিন প্যানেলের কুইজ সেটিংস থেকে (png_max_kb, KB, ১০–১০০০০০০); ০/ফাঁকা = আনলিমিটেড (ডিফল্ট), পূর্ণ হাই কোয়ালিটি
  const maxB = () => { const k = +(window.MC_QUIZ && window.MC_QUIZ.png_kb) || 0; return k > 0 ? k * 1024 : 0; }; // ০/ফাঁকা = আনলিমিটেড; অ্যাডমিন যত KB দেবে তত
  async function fitPng(c) {
    const enc = (k) => { const t = document.createElement("canvas"); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k); const g = t.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, t.width, t.height); return new Promise((r) => t.toBlob(r, "image/png")); };
    const MAXB = maxB(); let b = await new Promise((r) => c.toBlob(r, "image/png")); if (!b || !MAXB || b.size <= MAXB) return b;
    let lo = 0.03, hi = 1, best = null; // সীমার নিচে যায় এমন সবচেয়ে বড় মাপ খোঁজা (বাইনারি সার্চ)
    for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2, nb = await enc(m); if (nb && nb.size <= MAXB) { best = nb; lo = m; } else hi = m; }
    return best || (await enc(0.03)) || b;
  }
  // ডাউনলোড: PNG আগেই বানিয়ে রাখা হয় (warm), তাই ক্লিকে সঙ্গে সঙ্গে blob + a[download] দিয়ে সরাসরি নামে। (ব্রাউজারের ইনকগনিটো/প্রাইভেট মোডের "anyone using this device" ওয়ার্নিং ব্রাউজারের নিজের, সাইট থেকে বন্ধ করা যায় না)
  const BL = new WeakMap(), warm = (c) => { try { fitPng(c).then((b) => { if (b) BL.set(c, b); }).catch(() => {}); } catch (e) {} };
  const rawDl = async (c, n) => { const b = BL.get(c) || (await fitPng(c)), a = document.createElement("a"); a.download = n; a.rel = "noopener"; a.style.display = "none"; a.href = b ? URL.createObjectURL(b) : c.toDataURL("image/png"); document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); if (b) URL.revokeObjectURL(a.href); }, 30000); };
  // ---------- ফেসবুক/মেসেঞ্জার ইত্যাদি অ্যাপের ভেতরের ব্রাউজারে ডাউনলোড ব্লক হয় ----------
  const inApp = () => /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram|MicroMessenger|Line\/|Snapchat|TikTok|BytedanceWebview|Twitter|LinkedInApp|Pinterest|\bGSA\b/i.test(navigator.userAgent || "");
  const isAndroid = () => /Android/i.test(navigator.userAgent || "");
  const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  function dlLink(kind, R) { const o = Object.assign({}, R); delete o.vs; return site() + "?d=" + kind + "." + b64(JSON.stringify(o)); }
  function chromeIntent(url) { try { const u = new URL(url); return "intent://" + u.host + u.pathname + u.search + "#Intent;scheme=" + u.protocol.replace(":", "") + ";package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(url) + ";end"; } catch (e) { return url; } }
  function dlBlocked(c, n, kind, R) {
    const link = dlLink(kind, R), el = document.createElement("div"); el.className = "rmodal dbmodal"; el.setAttribute("role", "dialog");
    el.innerHTML = `<div class="rbox"><h2>⚠️ এই অ্যাপে ডাউনলোড আটকে যায়</h2>
      <div class="cann"><b>ফেসবুক/মেসেঞ্জারের ভেতরের ব্রাউজার ডাউনলোড ব্লক করে।</b><ol><li>নিচের <b>“ব্রাউজারে খুলুন”</b> চাপুন, কার্ড নিজে ডাউনলোড হবে।</li><li>না খুললে <b>“লিংক কপি”</b> করে Chrome বা Safari-তে পেস্ট করুন।</li><li>অথবা নিচের ছবিটি <b>চেপে ধরে রাখুন</b> → “ছবি সেভ করুন”।</li></ol></div>
      <img class="simg" id="dbimg" alt="কার্ড" style="max-height:38vh;width:auto;margin:0 auto;display:block">
      <div class="two"><button class="btn o xl" id="dbo" type="button">🌐 ব্রাউজারে খুলুন</button><button class="btn l xl" id="dbc" type="button">🔗 লিংক কপি</button></div>
      <div class="note" id="dbn" hidden></div>
      <button class="btn l s" id="dbx" type="button">বন্ধ করুন</button></div><button class="rx" id="dbrx" type="button" aria-label="বন্ধ করুন">✕</button>`;
    document.body.appendChild(el); const q = (s) => el.querySelector(s); q("#dbimg").src = c.toDataURL("image/png");
    const close = () => el.remove(); q("#dbx").onclick = close; q("#dbrx").onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
    const note = (m) => { const x = q("#dbn"); x.textContent = m; x.hidden = false; };
    const copy = async () => { try { await navigator.clipboard.writeText(link); return true; } catch (e) { try { const t = document.createElement("textarea"); t.value = link; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch (e2) { return false; } } };
    q("#dbc").onclick = async () => { note((await copy()) ? "✅ লিংক কপি হয়েছে। Chrome বা Safari খুলে অ্যাড্রেস বারে পেস্ট করুন।" : "কপি হয়নি। ডান পাশের ⋯ চেপে “ব্রাউজারে খুলুন” বাছুন।"); };
    const open = () => { if (isAndroid()) { location.href = chromeIntent(link); setTimeout(() => note("খোলেনি? ওপরে ডান পাশের ⋯ চেপে “ব্রাউজারে খুলুন” বাছুন, অথবা “লিংক কপি” করুন।"), 1500); } else { copy(); note("iPhone-এ ডান পাশের ⋯ (বা নিচের শেয়ার চিহ্ন) চেপে “Safari-তে খুলুন” বাছুন। লিংক কপিও হয়ে গেছে, চাইলে Safari-তে পেস্ট করুন।"); } };
    q("#dbo").onclick = open; if (isAndroid()) setTimeout(open, 200);
  }
  const dl = (c, n, kind, R) => { if (inApp() && R) return dlBlocked(c, n, kind || "card", R); rawDl(c, n); };
  // অ্যাপ থেকে ব্রাউজারে আসা লিংক (?d=card.… / ?d=story.…): কার্ড নিজে ডাউনলোড হবে, না হলে বাটন
  async function landDl() {
    const m = /[?&]d=(card3|card2|card|story)\.([A-Za-z0-9_-]+)/.exec(location.search); if (!m) return false;
    let R = null; try { R = JSON.parse(unb64(m[2])); } catch (e) {} history.replaceState(null, "", location.pathname + "#result");
    if (!R || typeof R.name !== "string") return false;
    LAST = R; LS.set("mc2_last", R); const story = m[1] === "story";
    if (window.__mcDef) { window.__mcDef.start(); await window.__mcDef.p; }
    await fonts(); await loadPhoto(); const c = story ? window.drawStory(await cardOpts(R)) : (m[1] === "card3" && window.drawCard1 ? window.drawCard1(await cardOpts(R)) : m[1] === "card2" && window.drawCard3 ? window.drawCard3(await cardOpts(R)) : window.drawCard2(await cardOpts(R))), nm = m[1] === "card3" ? fname(R).replace(/\.png$/, "_3.png") : m[1] === "card2" ? fname(R).replace(/\.png$/, "_2.png") : fname(R, story);
    dl(c, nm, m[1], R);
    if (!inApp()) { const el = document.createElement("div"); el.className = "rmodal dbmodal"; el.setAttribute("role", "dialog");
      el.innerHTML = `<div class="rbox"><h2>⬇️ ${story ? "স্টোরি" : "কার্ড"} ডাউনলোড</h2><p style="text-align:center;margin:6px 0">ডাউনলোড শুরু না হলে নিচের <b>“ডাউনলোড”</b> বাটনে ক্লিক করুন।</p><img class="simg" alt="কার্ড" style="max-height:45vh;width:auto;margin:0 auto;display:block"><div class="two"><button class="btn o xl" id="ldd" type="button">⬇️ ডাউনলোড</button><button class="btn l xl" id="ldx" type="button">বন্ধ করুন</button></div></div>`;
      document.body.appendChild(el); el.querySelector("img").src = c.toDataURL("image/png"); el.querySelector("#ldd").onclick = () => rawDl(c, nm); el.querySelector("#ldx").onclick = () => el.remove(); }
    return true;
  }
  const toBlob = (c) => new Promise((r) => c.toBlob(r, "image/png"));
  // পুরস্কার বক্স: বাটনে চাপলে নিচে ফর্ম খোলে (contest.js না থাকলে লুকানো)
  const prizeHtml = (id) => `<div class="ctbox" id="${id}" hidden><b>🎁 শেয়ার করো, পুরস্কার জেতো!</b><span class="pzu">পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন<b class="pzc" role="link" tabindex="0">এখানে ক্লিক ›</b></span><button class="btn o pzt" type="button" data-pz aria-expanded="false"><span>🎁 পুরস্কারের জন্য জমা দিন</span><i class="pza" aria-hidden="true">▾</i></button><div data-pzh hidden></div></div>`;
  function prizeWire(root, id, R, getDl, getPrev) {
    const sync = () => { const bx = root.querySelector("#" + id); if (!bx) return; const ok = window.openContest && !(window.MC_CONTEST && window.MC_CONTEST.on === false); bx.hidden = !ok; if (!ok) return; if (window.MC_CONTEST && window.MC_CONTEST.headline) bx.querySelector("b").textContent = "🎁 " + window.MC_CONTEST.headline;
      const h = bx.querySelector("[data-pzh]"), b = bx.querySelector("[data-pz]");
      const mark = (o) => { b.setAttribute("aria-expanded", o); bx.classList.toggle("open", o); b.querySelector(".pza").textContent = o ? "▴" : "▾"; b.querySelector("span").textContent = o ? "✔ ফর্ম খোলা আছে (চাপলে লুকাবে)" : "🎁 পুরস্কারের জন্য জমা দিন"; };
      b.onclick = () => { if (!h.hidden) { h.hidden = true; mark(false); return; } h.hidden = false; mark(true); window.openContest({ name: R.name, pct: R.pct, score: R.score, caption: pzCap(R), download: getDl, preview: getPrev }, h); h.scrollIntoView({ block: "nearest", behavior: "smooth" }); }; };
    sync(); window.addEventListener("load", sync, { once: true });
  }
  const pzCap = (R) => `আমি MC ${bn(R.pct)}% জানি${R.title ? ` — আমার উপাধি “${R.title}”` : ""}! তুমি কত পারো? 👉 ${qrLink(R)}`;
  function chLink(R) { const j = btoa(unescape(encodeURIComponent(JSON.stringify({ n: R.name, p: R.pct, t: R.title, d: R.dept, s: R.score })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); return site() + "#c=" + j; }
  function qrLink(R) { const j = btoa(unescape(encodeURIComponent([R.name, R.pct, R.score].join("|")))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); return site() + "#c=" + j; }
  // ---------- স্টোরি সাইজ (৯:১৬) প্রিভিউ + ছবি দেওয়ার অপশন ----------
  async function openStory(R) {
    await fonts(); await loadPhoto();
    const el = document.createElement("div"); el.className = "rmodal smodal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "স্টোরি কার্ড");
    el.innerHTML = `<div class="rbox sbox"><h2>📸 স্টোরি কার্ড <small>১০৮০×১৯২০ · ৯:১৬</small></h2>
      <img class="simg" id="simg" alt="স্টোরি কার্ডের প্রিভিউ" width="1080" height="1920">
      <div class="two"><label class="btn l s" style="cursor:pointer"><span id="sphx"></span><input id="sph" type="file" accept="image/*" hidden></label><button class="btn l s" id="srm" type="button">🗑️ ছবি সরাও</button></div>
      <div class="two"><button class="btn xl" id="ssh" type="button">📤 শেয়ার করো</button><button class="btn xl" id="ssv" type="button">⬇️ ডাউনলোড</button></div>
      ${prizeHtml("sctbox")}<div class="note">ফেসবুক/ইনস্টাগ্রাম স্টোরির মাপ। ওপরে-নিচের কিছু অংশ স্টোরির বারে ঢাকা পড়ে, তাই জরুরি লেখা মাঝের নিরাপদ জায়গায় রাখা হয়েছে।</div></div>
      <button class="rx" id="srx" aria-label="বন্ধ করুন" type="button">✕</button>`;
    document.body.appendChild(el);
    const q = (s) => el.querySelector(s); let sc = null;
    const sync = () => { q("#sphx").textContent = PHOTO ? "📷 ছবি বদলাও" : "📷 নিজের ছবি দাও"; q("#srm").hidden = !PHOTO; };
    const paint = async () => { sc = window.drawStory(await cardOpts(R)); warm(sc); q("#simg").src = sc.toDataURL("image/png"); sync(); };
    paint();
    q("#sph").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = async () => { PHOTO = await li(fr.result); savePhoto(PHOTO); paint(); if ($("#cimg") && window.__mcRepaint) window.__mcRepaint(); }; fr.readAsDataURL(f); };
    q("#srm").onclick = async () => { PHOTO = null; savePhoto(null); paint(); if ($("#cimg") && window.__mcRepaint) window.__mcRepaint(); };
    q("#ssv").onclick = () => { if (sc) { dl(sc, fname(R, true), "story", R); toast("স্টোরি কার্ড সেভ হচ্ছে"); } };
    q("#ssh").onclick = async () => {
      try {
        if (sc && navigator.canShare) { const f = new File([await fitPng(sc)], fname(R, true), { type: "image/png" }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: caption(R) }); return; } }
        if (navigator.share) { await navigator.share({ text: caption(R) }); return; }
      } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(caption(R)); toast("ক্যাপশন কপি হয়েছে — স্টোরি সেভ করে পোস্ট করো"); } catch (e) { toast("‘ডাউনলোড’ চেপে ছবিটি স্টোরিতে দাও"); }
      if (sc) dl(sc, fname(R, true), "story", R);
    };
    prizeWire(el, "sctbox", R, () => { if (sc) { dl(sc, fname(R, true), "story", R); toast("স্টোরি কার্ড সেভ হচ্ছে"); } });
    const close = () => el.remove(); q("#srx").onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
  }
  async function result() {
    setHd("আপনার ফল", true);
    if (!LAST) { V.innerHTML = `<div class="big" id="ncgo" style="cursor:pointer">এখনো কার্ড নেই</div><div class="sm" id="ncgo2" style="cursor:pointer">১০টি প্রশ্নের খেলা শেষ করলেই আপনার MC কার্ড তৈরি হবে।</div><a class="btn o xl" href="#home" id="ncgo3">🎯 খেলা শুরু করো</a>`; ["#ncgo", "#ncgo2", "#ncgo3"].forEach((q) => { const e = $(q); if (e) e.onclick = (ev) => { ev.preventDefault(); window.__mcNeedName = 1; location.hash = "home"; }; }); return; }
    await loadPhoto();
    const R = LAST, dr = deptRank(R.name, R.dept), vs = R.vs;
    LOV = null; // নতুন ফল-পাতা: লোগো বাছাই ডিফল্টে ফেরে
    const cmp = vs ? (R.pct > vs.p ? ["win", `🎉 তুমি ${esc(vs.n)}-কে হারিয়েছ! (${bn(R.pct)}% বনাম ${bn(vs.p)}%)`] : R.pct === vs.p ? ["", `🤝 ${esc(vs.n)}-এর সঙ্গে সমান-সমান (${bn(R.pct)}%)`] : ["lose", `😅 ${esc(vs.n)} এগিয়ে (${bn(vs.p)}% বনাম আপনার ${bn(R.pct)}%) — আবার খেলে দেখো`]) : null;
    V.innerHTML = `${cmp ? `<div class="box cmp ${cmp[0]}">${cmp[1]}</div>` : ""}<img class="cardimg" id="cimg" alt="" width="1080" height="1350" style="touch-action:pan-y;background:var(--chip);aspect-ratio:1080/1350">
      <div class="cnav" id="cnav"><span class="sm" style="font-weight:700">🎴 ডিজাইন</span><button type="button" class="on" data-v="0" aria-label="১">১</button><button type="button" data-v="1" aria-label="২">২</button><button type="button" data-v="2" aria-label="৩">৩</button><button type="button" id="cnx">নেক্সট ›</button></div>
      <label class="btn l s" id="rbPhoto" style="cursor:pointer">📷 কার্ডে নিজের ছবি দাও (ঐচ্ছিক${window.MCUI && MCUI.boardOff && MCUI.boardOff() ? "" : " · লিডারবোর্ডে সেরা ৩-এ এলে ছবি সবাই দেখবে"})<input id="ph" type="file" accept="image/*" hidden></label>
      <div class="two"><button class="btn xl" id="sh">📤 শেয়ার করো</button><button class="btn xl" id="sv">⬇️ ডাউনলোড</button></div>
      <button class="stbtn" id="st" type="button"><span class="si">📸</span><span class="stx"><b>স্টোরি সাইজ বানাও</b><small>ফেসবুক/ইনস্টা স্টোরির জন্য · ছবি দিয়ে সাজাও</small></span><span class="sar">›</span></button>
      <button class="btn o" id="ch">⚔️ বন্ধুকে চ্যালেঞ্জ করো</button>
      ${prizeHtml("ctbox")}
      <div class="two"><a class="btn l s" id="rbSurvey" href="#survey">📊 ২টা দ্রুত প্রশ্ন</a><a class="btn l s" href="#home" id="again">🔁 আবার খেলো</a></div>`;
    // ক্রম (২০২৬-১০-২১): ১ম = আগের ৩ নং কার্ড (drawCard1, ডিফল্ট), ২য় = আগের ১ নং (drawCard2), ৩য় = আগের ২ নং (drawCard3)
    const FN = ["drawCard1", "drawCard2", "drawCard3"], KD = ["card3", "card", "card2"], SF = ["_3", "", "_2"], CS = [null, null, null];
    // অ্যাডমিন > 🏠 হোম থেকে বন্ধ করা কার্ড (c_1/c_2/c_3) বাদ; সব বন্ধ থাকলে তিনটাই দেখায়
    const CO = window.mcCardOrder(), AV = CO.on; // CO.all = অ্যাডমিনে সাজানো পুরো ক্রম, AV = তার মধ্যে চালু কার্ড
    const DF = window.mcCardDefault();
    let canvas = null, lastO = null, cur = DF;
    let curUrl = "";
    const nav = $("#cnav");
    { const nb = {}, cx = $("#cnx"); nav.querySelectorAll("button[data-v]").forEach((b) => { nb[+b.dataset.v] = b; }); CO.all.forEach((i) => nav.insertBefore(nb[i], cx)); AV.forEach((i, p) => { nb[i].textContent = bn(p + 1); nb[i].setAttribute("aria-label", bn(p + 1)); }); } // বাটন সাজানো ক্রমে; লেখা = চালু কার্ডের মধ্যে অবস্থান (১,২,৩), ডিজাইন চেনা যায় data-v দিয়ে
    const markNav = () => { nav.querySelectorAll("button[data-v]").forEach((b) => b.classList.toggle("on", +b.dataset.v === cur)); };
    // কার্ড ছবির জায়গায় দেখায় (সীমা না থাকলে PNG একবারই এনকোড; একই blob প্রিভিউ ও ডাউনলোডে)
    // seq: একসঙ্গে একাধিক আঁকা/বদল চললে শুধু সবশেষ অনুরোধের ছবিই বসে, তাই প্রিভিউ আর ডাউনলোডের canvas সবসময় এক থাকে
    let seq = 0;
    const showC = async (cv) => {
      const my = ++seq, img = $("#cimg"); if (img) img.style.aspectRatio = cv.width + "/" + cv.height;
      if (!maxB() && cv.toBlob) {
        const b = BL.get(cv) || (await new Promise((r) => cv.toBlob(r, "image/png")));
        if (my !== seq) { if (b) BL.set(cv, b); return; }
        if (b) { BL.set(cv, b); if (curUrl) URL.revokeObjectURL(curUrl); curUrl = URL.createObjectURL(b); if (img) { img.src = curUrl; if (window.mcFbShown) window.mcFbShown(img); } return; }
      }
      warm(cv); if (img) { img.src = cv.toDataURL("image/png"); if (window.mcFbShown) window.mcFbShown(img); }
    };
    const setV = async (v) => {
      if (!lastO) return; cur = v;
      if (!CS[v] && window[FN[v]]) CS[v] = window[FN[v]](lastO);
      if (!CS[v]) { cur = DF; if (!CS[DF] && window[FN[DF]]) CS[DF] = window[FN[DF]](lastO); }
      canvas = CS[cur] || CS[DF];
      markNav(); await showC(canvas);
    };
    nav.querySelectorAll("button[data-v]").forEach((b) => { b.onclick = () => setV(+b.dataset.v); });
    $("#cnx").onclick = () => setV(AV[(AV.indexOf(cur) + 1) % AV.length]);
    if (!window.drawCard3 || !window.drawCard1 || AV.length < 2) { nav.hidden = true; }
    // কার্ডের ছবিতে ডান/বামে সোয়াইপ করলে পরের/আগের কার্ড স্লাইড হয়ে আসে
    { const im = $("#cimg"); let sx = 0, sy = 0, st = false;
      im.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = e.touches.length === 1; }, { passive: true });
      im.addEventListener("touchend", async (e) => {
        if (!st || AV.length < 2) return; st = false; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        const d = dx < 0 ? 1 : -1, i = AV.indexOf(cur), nx = AV[(i < 0 ? 0 : i + d + AV.length) % AV.length];
        await setV(nx); const m = $("#cimg"); if (m && m.animate) m.animate([{ transform: `translateX(${d * 40}%)`, opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 240, easing: "ease-out" });
      }, { passive: true }); }
    const paint = async () => {
      // আঁকতে ০.৩ সেকেন্ডের বেশি লাগলেই ছোট "আঁকা হচ্ছে" লেখা দেখায়
      const wt = setTimeout(() => { const m = $("#cimg"); if (m && !$("#cwait")) m.insertAdjacentHTML("beforebegin", '<div class="sm" id="cwait" style="text-align:center;padding:6px 0">⏳ কার্ড আঁকা হচ্ছে…</div>'); }, 300), t0 = PERF ? performance.now() : 0;
      try {
        await fonts(); const o = await cardOpts(R); if (PERF) console.log("[perf] fonts+opts " + Math.round(performance.now() - t0) + "ms"); CS[0] = CS[1] = CS[2] = null; lastO = o; if (!window[FN[DF]]) FN[DF] = "drawCard2"; CS[DF] = window[FN[DF]](o); if (PERF) console.log("[perf] drawCard2 " + Math.round(performance.now() - t0) + "ms (total so far)");
        if (cur !== DF && window[FN[cur]]) CS[cur] = window[FN[cur]](o); canvas = CS[cur] || CS[DF]; markNav();
        await showC(canvas);
        if (PERF) console.log("[perf] card visible " + Math.round(performance.now() - t0) + "ms");
        if (window.mcCardSync) window.mcCardSync(R, CS[DF], PHOTO, o); // সার্ভারে শুধু ডিফল্ট (১নং = আগের ৩ নং) কার্ড জমা হয়
      } finally { clearTimeout(wt); const w = $("#cwait"); if (w) w.remove(); }
    };
    window.__mcRepaint = paint;
    paint();
    // অ্যাডমিন > 🖼️ লোগো-তে "ফল-পাতার স্কোর কার্ডে ইউজার লোগো বাছতে পারবে" চালু থাকলেই কার্ডের নিচে (ডিজাইন বাটনের ঠিক পরে) বাম/ডান লোগোর ড্রপডাউন আসে; ডিফল্টে বন্ধ
    if (window.mcLogo) window.mcLogo.load().then((c) => { const isA = !!(c && c.ud && c.ud.a && window.mcLogo.admHint && window.mcLogo.admHint()); if (!c || !c.ud || (!c.ud.s && !isA) || !$("#cnav") || $("#lgpk")) return; const pk = window.mcLogo.picker({ admin: !!isA, onChange: (ov) => { LOV = ov; paint(); } }); pk.id = "lgpk"; $("#cnav").insertAdjacentElement("afterend", pk); }).catch(() => {});
    $("#ph").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = async () => { PHOTO = await li(fr.result); savePhoto(PHOTO); paint(); }; fr.readAsDataURL(f); };
    const cn = () => SF[cur] ? fname(R).replace(/\.png$/, SF[cur] + ".png") : fname(R), ck = () => KD[cur];
    $("#sv").onclick = () => { if (canvas) { dl(canvas, cn(), ck(), R); toast("কার্ড সেভ হচ্ছে"); } };
    $("#st").onclick = () => openStory(R);
    prizeWire(V, "ctbox", R, () => { if (canvas) { dl(canvas, cn(), ck(), R); toast("কার্ড সেভ হচ্ছে"); } }, (wp) => { // জমা-ফর্মের প্রিভিউ: ফল-পাতার ডিফল্ট কার্ড, ছবি সহ বা ছবি ছাড়া
      try { const f = window[FN[DF]]; if (!lastO || !f) return null; return f(Object.assign({}, lastO, { photo: wp ? PHOTO : null })).toDataURL("image/jpeg", 0.82); } catch (e) { return null; } });
    $("#sh").onclick = async () => {
      try {
        if (canvas && navigator.canShare) { const f = new File([await fitPng(canvas)], cn(), { type: "image/png" }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: caption(R) }); return; } }
        if (navigator.share) { await navigator.share({ text: caption(R) }); return; }
      } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(caption(R)); toast("ক্যাপশন কপি হয়েছে — কার্ড সেভ করে পোস্ট করো"); } catch (e) { toast("‘ছবি সেভ’ চেপে কার্ডটি পোস্ট করো"); }
      if (canvas) dl(canvas, cn(), ck(), R);
    };
    $("#ch").onclick = async () => {
      const t = `${R.name} MC ${bn(R.pct)}% জানে। তুমি কত? 👉 `, u = chLink(R);
      try { if (navigator.share) { await navigator.share({ text: t + u }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(t + u); toast("চ্যালেঞ্জ লিংক কপি হয়েছে — বন্ধুকে পাঠাও"); } catch (e) { prompt("এই লিংক বন্ধুকে পাঠাও:", t + u); }
    };
    $("#again").onclick = () => { LS.set("mc2_vs", null); };
  }

  // ---------- ৪. চ্যালেঞ্জ ----------
  function challenge(j) {
    let c = null; try { const raw = decodeURIComponent(escape(atob(j.replace(/-/g, "+").replace(/_/g, "/")))); if (raw.charAt(0) === "{") c = JSON.parse(raw); else { const a = raw.split("|"); c = { n: a[0], p: Number(a[1]), s: Number(a[2]) }; } } catch (e) {}
    if (!c || typeof c.n !== "string" || typeof c.p !== "number") { toast("চ্যালেঞ্জ লিংকটি ঠিক নেই"); location.hash = "home"; return; }
    c.n = c.n.slice(0, 30); c.p = Math.max(0, Math.min(100, Math.round(c.p))); c.t = String(c.t || "").slice(0, 40);
    const t = tierOf(c.s != null ? Number(c.s) || c.p * 10 : c.p * 10), m = D.classMetal[t];
    setHd("চ্যালেঞ্জ এসেছে!", true);
    document.body.classList.add("dh");
    const sc = bn(Number(c.s) > 0 ? Math.round(Number(c.s)) : c.p * 10);
    V.innerHTML = `<section class="hero"><span class="hchip">⚔️ বন্ধুর চ্যালেঞ্জ এসেছে</span><h1 class="htt sm"><span>${esc(c.n)}</span><br><em>${sc} স্কোর</em> <b>করেছে!</b></h1><div class="chsub">${bn(c.p)} শতাংশ জানে · তুমি হারাতে পারবে?</div></section>
      <div class="mc" style="border-color:${D.classCols[t]}"><div class="t">${esc(D.classes[t])}</div><div class="ut">${esc(c.t)}</div><div class="st"><small>MC কতটুকু জানো?</small><b>${bn(c.p)}% জানি</b></div></div>
      <div class="fcard">${form("⚔️ হ্যাঁ, হারাবো!")}<div class="sm" style="text-align:center">১০টি প্রশ্ন · ${bn(TIME)} সেকেন্ড করে</div></div>`;
    bindForm(() => { LS.set("mc2_vs", { n: c.n, p: c.p }); G = null; location.hash = "play"; });
    window.scrollTo(0, 0);
  }

  // ---------- ৩. লিডারবোর্ড ----------
  function chat() {
    setHd("চ্যাট", true);
    if (window.mcChat) window.mcChat(V, { esc, toast, P });
    else V.innerHTML = '<div class="box"><b>চ্যাট এখনো চালু নয়</b><p class="sm">community.js ফাইল পাওয়া যায়নি।</p></div>';
  }
  let BF = { dept: "", batch: "", per: "all", from: "", to: "", q: "", mode: "best" }, BR = { rows: [], total: 0, local: false, depts: [], batches: [] }, BTM = 0, BSEQ = 0, BPG = 0;
  const periodTs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); const t0 = d.getTime(), day = 864e5;
    if (BF.per === "today") return [t0, null]; if (BF.per === "7") return [t0 - 6 * day, null]; if (BF.per === "30") return [t0 - 29 * day, null];
    if (BF.per === "range") return [BF.from ? new Date(BF.from + "T00:00:00").getTime() : null, BF.to ? new Date(BF.to + "T00:00:00").getTime() + day : null]; return [null, null]; };
  const fmtD = (ts) => { const d = new Date(ts); return bn(d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()); };
  function localBoard(f, offset, limit) { // অনলাইন সার্ভার না থাকলে এই ফোনের স্কোর দিয়ে একই ফিল্টার
    const q = (f.q || "").toLowerCase(); let L = LS.get("mc2_lb", []).filter((r) => (!f.dept || r.dept === f.dept) && (!f.batch || r.batch === f.batch) && (!f.from || r.ts >= f.from) && (!f.to || r.ts < f.to) && (!q || r.name.toLowerCase().includes(q)));
    if (f.mode !== "all") { const m = {}; L.forEach((r) => { const k = r.name.toLowerCase() + "|" + r.dept + "|" + (r.batch || ""); if (!m[k] || r.score > m[k].score) m[k] = r; }); L = Object.values(m); }
    L.sort((a, b) => b.score - a.score || a.ts - b.ts); let rk = 0, prev = null;
    const all = L.map((r, i) => { if (r.score !== prev) { rk = i + 1; prev = r.score; } return { rk, name: r.name, dept: r.dept, batch: r.batch || "", score: r.score, ok: r.ok || 0, wrong: Math.max((r.total || 0) - (r.ok || 0), 0), total: r.total || 0, pct: r.pct, ts: r.ts }; });
    return { rows: all.slice(offset, offset + limit), total: all.length, local: true, depts: [], batches: [] };
  }
  function lbLoad(more) {
    if (!more) BPG = 0; const [from, to] = periodTs(), f = { dept: BF.dept, batch: BF.batch, from, to, q: BF.q.trim(), mode: BF.mode }, off = more ? BR.rows.length : 0, seq = ++BSEQ, box = $("#lbr");
    if (!more && box) box.innerHTML = '<div class="box"><div class="row">⏳ লোড হচ্ছে…</div></div>';
    if (!more && window.mcTop3) window.mcTop3($("#t3"), { dept: f.dept, batch: f.batch, from: f.from, to: f.to });
    (window.mcBoardQ ? window.mcBoardQ(Object.assign({ limit: 30, offset: off }, f)) : Promise.reject(new Error("off"))).catch(() => localBoard(f, off, 30)).then((r) => {
      if (seq !== BSEQ || location.hash !== "#board") return;
      BR = { rows: more ? BR.rows.concat(r.rows) : r.rows, total: r.total, local: !!r.local, depts: r.depts && r.depts.length ? r.depts : BR.depts, batches: r.batches && r.batches.length ? r.batches : BR.batches, done: more && !(r.rows && r.rows.length) }; { const ns = $("#lbNs"); if (ns) ns.textContent = BR.local ? "⚠️ সার্ভার পাওয়া যায়নি — এখন শুধু এই ফোনের ফল দেখাচ্ছে।" : "সব ফলাফল সার্ভারে স্থায়ীভাবে জমা থাকে (প্রতিটি খেলা)।"; }
      if (!more) { fillFilters(); if (window.mcTop3) { const t3 = $("#t3"); if (t3 && !t3._o && window.MutationObserver) { t3._o = new MutationObserver(() => { if (location.hash === "#board") lbPaint(); }); t3._o.observe(t3, { childList: true, subtree: true }); } } } lbPaint();
    });
  }
  function fillFilters() {
    const ds = [...new Set(D.depts.concat(BR.depts))], bs = [...new Set(BATCHES.concat(BR.batches))], o = (v, l, cur) => `<option value="${esc(v)}"${cur === v ? " selected" : ""}>${esc(l)}</option>`;
    $("#lfd").innerHTML = o("", "সব বিভাগ", BF.dept) + ds.map((d) => o(d, D.deptLabel(d), BF.dept)).join("");
    $("#lfb").innerHTML = o("", "সব সেশন", BF.batch) + bs.map((x) => o(x, x, BF.batch)).join("");
  }
  function rankHist(name, dept, batch) { // স্কোরের পাশের র‍্যাংকে ক্লিক → কোন তারিখে কত স্কোরে কত র‍্যাংকে ছিল
    const o = document.createElement("div"); o.className = "rhm"; o.setAttribute("role", "dialog");
    const close = () => o.remove(); o.onclick = (e) => { if (e.target === o) close(); };
    const pk = !!(window.mcPeekOK && window.mcPeekOK()); // অ্যাডমিনে "কার্ড প্রিভিউ" চালু থাকলে (ডিফল্ট চালু) "🪪 কার্ড দেখো" বাটন
    const set = (h) => { o.innerHTML = `<div class="rhb"><div class="rhh"><b>📈 ${esc(name)} — র‍্যাংক হিস্টরি</b><button type="button" class="rhx" aria-label="বন্ধ">✕</button></div><div class="sm" style="margin-bottom:8px">${esc(D.deptLabel(dept))} · ${esc(batch || "—")}</div>${pk ? '<button type="button" class="rhcd" id="rhcd"><span>🪪 কার্ড দেখো</span><i aria-hidden="true">›</i></button><div class="rhcm sm" id="rhcm" role="status"></div>' : ""}${h}</div>`; o.querySelector(".rhx").onclick = close;
      const cb = o.querySelector("#rhcd"); if (cb) cb.onclick = () => { if (cb._b) return; cb._b = 1; const sp = cb.querySelector("span"), m = o.querySelector("#rhcm"); sp.textContent = "⏳ কার্ড আনছি…"; m.textContent = ""; window.mcPeek(name, dept, batch).then((msg) => { cb._b = 0; sp.textContent = "🪪 কার্ড দেখো"; if (msg) m.textContent = msg; }); }; };
    set('<div class="row">⏳ লোড হচ্ছে…</div>'); document.body.appendChild(o);
    const tm = (ts) => { const d = new Date(ts), h = d.getHours(), m = d.getMinutes(); return fmtD(ts) + " · " + bn((h % 12 || 12) + ":" + String(m).padStart(2, "0")) + (h < 12 ? " সকাল" : h < 16 ? " দুপুর" : h < 18 ? " বিকাল" : " রাত"); };
    (window.mcRankHist ? window.mcRankHist(name, dept, batch) : Promise.reject(new Error("off"))).then((r) => {
      const L = r.rows || []; if (!L.length) return set('<div class="row">কোনো খেলার হিসাব পাওয়া যায়নি।</div>');
      const rows = L.map((x, i) => { const p = L[i + 1], d = p ? p.rk - x.rk : 0, ar = !p ? "" : d > 0 ? `<span class="rhu">▲ ${bn(d)}</span>` : d < 0 ? `<span class="rhd">▼ ${bn(-d)}</span>` : '<span class="sm">＝</span>';
        return `<div class="rhr"><div class="rht">${tm(x.ts)}</div><div class="rhs"><b>${bn(x.score)}</b><span class="sm"> স্কোর</span></div><div class="rhk">#${bn(x.rk)}<span class="sm"> / ${bn(x.n)} জন</span> ${ar}</div></div>`; }).join("");
      set(`<div class="rhn">এখন সেরা স্কোর <b>${bn(r.best)}</b> · বর্তমান র‍্যাংক <b>#${bn(r.now_rk)}</b> · মোট <b>${bn(L.length)}</b> বার খেলেছে</div><div class="rhl">${rows}</div><div class="note" style="margin-top:8px">র‍্যাংক = ওই সময় পর্যন্ত সবার সেরা স্কোরের মধ্যে ওই খেলার স্কোর কততম ছিল। ▲▼ = আগের খেলার তুলনায়।</div>`);
    }).catch(() => set('<div class="row">র‍্যাংক হিস্টরি আনা যায়নি — ইন্টারনেট দেখুন, অথবা অ্যাডমিন supabase-new-20261030.sql চালাননি।</div>'));
  }
  window.mcOpenRankHist = rankHist; // বিজয়ী তালিকা (winners.js) থেকেও র‍্যাংক হিস্টরি + কার্ড দেখো খোলে
  function lbPaint() {
    const me = P.name.toLowerCase(), box = $("#lbr"); if (!box) return;
    const medal = (k) => (k === 1 ? "🥇" : k === 2 ? "🥈" : k === 3 ? "🥉" : "#" + bn(k));
    const row = (r) => { const you = me && r.name.toLowerCase() === me && r.dept === myDept(); return `<div class="lbrow${you ? " me" : ""}"><div class="lbk">${medal(r.rk)}</div><div class="lbm"><b>${esc(r.name)}${you ? " (তুমি)" : ""}</b><div class="sm">${esc(D.deptLabel(r.dept))} · ${esc(r.batch || "—")} · ${fmtD(r.ts)}</div></div><div class="lbs"><b>${bn(r.score)}</b><button type="button" class="lbrk" data-rh="${esc(JSON.stringify([r.name, r.dept, r.batch || ""]))}" aria-label="র‍্যাংক হিস্টরি দেখুন">র‍্যাংক #${bn(r.rk)} ›</button><div class="sm">✔ ${bn(r.ok)} · ✘ ${bn(r.wrong)}</div></div></div>`; };
    const skip = $("#t3 .pc") ? 3 : 0, PER = 10, tot = Math.max(BR.total - skip, 0), pages = Math.max(1, Math.ceil(tot / PER));
    if (BPG > pages - 1) BPG = pages - 1;
    const need = skip + (BPG + 1) * PER;
    if (BR.rows.length < need && BR.rows.length < BR.total && !BR.done) { box.innerHTML = '<div class="box"><div class="row">⏳ লোড হচ্ছে…</div></div>'; lbLoad(true); return; }
    const list = BR.rows.slice(skip + BPG * PER, skip + (BPG + 1) * PER);
    const nums = []; for (let i = Math.max(0, Math.min(BPG - 1, pages - 4)); i < Math.min(pages, Math.max(0, Math.min(BPG - 1, pages - 4)) + 4); i++) nums.push(i);
    const pg = pages > 1 ? `<div class="lbpg">${BPG > 0 ? '<button type="button" data-pg="' + (BPG - 1) + '" aria-label="আগের">‹</button>' : ""}${nums.map((i) => `<button type="button" data-pg="${i}"${i === BPG ? ' class="on" aria-current="page"' : ""}>${bn(i + 1)}</button>`).join("")}${BPG < pages - 1 ? '<button type="button" data-pg="' + (BPG + 1) + '">নেক্সট ›</button>' : ""}</div>` : "";
    box.innerHTML = list.length ? `<div class="box">${list.map(row).join("")}</div>${pg}` : BR.rows.length && skip ? "" : `<div class="box"><div class="row">এই ফিল্টারে কোনো ফল নেই।</div></div>`;
    box.querySelectorAll("[data-rh]").forEach((b) => { b.onclick = () => { let a = []; try { a = JSON.parse(b.dataset.rh); } catch (e) {} rankHist(a[0], a[1], a[2]); }; });
    box.querySelectorAll("[data-pg]").forEach((b) => { b.onclick = () => { BPG = +b.dataset.pg; lbPaint(); window.scrollTo({ top: Math.max(0, box.offsetTop - 60), behavior: "smooth" }); }; });
  }
  function board() {
    if (window.MCUI && MCUI.boardOff && MCUI.boardOff()) { location.hash = "#home"; return; } // অ্যাডমিন লিডারবোর্ড বন্ধ করলে
    setHd("লিডারবোর্ড", true);
    const bars = (list, isD) => list.length ? `<div class="box">${list.map((x) => `<div class="row"><span class="nm">${esc(isD ? D.deptLabel(x[0]) : x[0])}</span><span class="bar"><i style="width:${x[1]}%"></i></span><b>${bn(x[1])}%</b></div>`).join("")}</div>` : "";
    const paintBars = () => { const e = $("#lbb"); if (e) e.innerHTML = BF.dept ? "" : '<div class="sm" style="margin:0 2px 4px">বিভাগ অনুযায়ী গড় শতাংশ</div>' + bars(avgBy("dept"), true); };
    if (window.mcLoadBoard) window.mcLoadBoard(() => { if (location.hash === "#board") paintBars(); });
    const ms = new Date(); ms.setHours(24, 0, 0, 0); const left = ms - Date.now(), hh = Math.floor(left / 36e5), mm = Math.floor(left % 36e5 / 6e4), dp = D.places[Math.floor(Date.now() / 864e5) % D.places.length];
    const per = [["all", "সব সময়"], ["today", "আজ"], ["7", "শেষ ৭ দিন"], ["30", "শেষ ৩০ দিন"], ["range", "তারিখ বাছো"]];
    BF.open = !!(BF.dept || BF.batch || BF.q || BF.from || BF.to);
    const lbt = (o) => `<span class="lbti" aria-hidden="true">🔎</span><span class="lbtt"><b>${o ? "ফিল্টার বন্ধ করুন" : "নাম, বিভাগ বা সেশন দিয়ে খুঁজুন"}</b><small>${o ? "ট্যাপ করলে সার্চ-ফিল্টার লুকাবে" : "এখানে ট্যাপ করলে সার্চ ও ফিল্টার খুলবে"}</small></span><span class="lbtc" aria-hidden="true">▾</span>`;
    V.innerHTML = `<button class="lbt${BF.open ? " on" : ""}" id="lft2" type="button" aria-expanded="${BF.open ? "true" : "false"}" aria-controls="lfw">${lbt(BF.open)}</button><div id="lfw" style="${BF.open ? "" : "display:none"}"><div class="box lbf"><div class="two2"><select class="in" id="lfd" aria-label="বিভাগ"></select><select class="in" id="lfb" aria-label="সেশন"></select></div>
      <div class="two2"><select class="in" id="lfp" aria-label="সময়">${per.map((p) => `<option value="${p[0]}"${BF.per === p[0] ? " selected" : ""}>${p[1]}</option>`).join("")}</select><select class="in" id="lfm" aria-label="তালিকা"><option value="best"${BF.mode === "best" ? " selected" : ""}>প্রত্যেকের সেরা ফল</option><option value="all"${BF.mode === "all" ? " selected" : ""}>সব খেলা</option></select></div>
      <div class="two2" id="lfr"${BF.per === "range" ? "" : " hidden"}><input class="in" type="date" id="lff" value="${esc(BF.from)}" aria-label="থেকে"><input class="in" type="date" id="lft" value="${esc(BF.to)}" aria-label="পর্যন্ত"></div>
      <div style="display:flex;gap:6px"><input class="in" id="lfq" maxlength="40" placeholder="নাম খুঁজুন" value="${esc(BF.q)}" aria-label="নাম খুঁজুন" enterkeyhint="search" style="flex:1;min-width:0"><button class="btn o s" id="lfs" type="button" style="flex:none">🔎 সার্চ</button></div></div></div>
      <div id="t3"></div><div id="lbb"></div><div id="lbr"></div>
      <div class="box w">🔥 <b>আজকের চ্যালেঞ্জ:</b> ${esc(dp.bn)} চেনো? <span class="sm">আর ${bn(hh)} ঘণ্টা ${bn(mm)} মিনিট</span><button class="btn o s" id="dc" style="margin-top:8px">খেলো</button></div>
      <div class="note"><span id="lbNs">সব ফলাফল সার্ভারে স্থায়ীভাবে জমা থাকে (প্রতিটি খেলা)।</span> ✔ = সঠিক, ✘ = ভুল/সময় শেষ।</div>`;
    fillFilters(); paintBars();
    $("#lft2").onclick = () => { BF.open = !BF.open; $("#lfw").style.display = BF.open ? "" : "none"; const b = $("#lft2"); b.classList.toggle("on", BF.open); b.setAttribute("aria-expanded", BF.open ? "true" : "false"); b.innerHTML = lbt(BF.open); };
    const chg = () => { paintBars(); lbLoad(false); };
    // ম্যানুয়াল সার্চ: ফিল্টার বাছলে সঙ্গে সঙ্গে তালিকা বদলায় না; "🔎 সার্চ" বাটন বা Enter চাপলে তবেই (খসড়া মান P-তে থাকে)
    const P2 = { dept: BF.dept, batch: BF.batch, per: BF.per, from: BF.from, to: BF.to, mode: BF.mode };
    $("#lfd").onchange = (e) => { P2.dept = e.target.value; }; $("#lfb").onchange = (e) => { P2.batch = e.target.value; }; $("#lfm").onchange = (e) => { P2.mode = e.target.value; };
    $("#lfp").onchange = (e) => { P2.per = e.target.value; $("#lfr").hidden = P2.per !== "range"; };
    $("#lff").onchange = (e) => { P2.from = e.target.value; }; $("#lft").onchange = (e) => { P2.to = e.target.value; };
    const go = () => { Object.assign(BF, P2); BF.q = $("#lfq").value; clearTimeout(BTM); chg(); };
    $("#lfs").onclick = go; $("#lfq").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } };
    $("#dc").onclick = () => { location.hash = P.name ? "play" : "home"; if (!P.name) toast("আগে নাম দিয়ে হোমে শুরু করো"); else { G = null; LS.set("mc2_vs", null); } };
    lbLoad(false);
  }

  // ---------- ৬. সার্ভে ----------
  const Q1 = ["লাইব্রেরি", "ক্যান্টিন", "মাঠ", "মূল ভবন", "জারুল তলা"], Q2 = ["লাইব্রেরি", "ওয়াইফাই", "ক্যান্টিন", "ক্লাসরুম"]; // সার্ভার না পেলে শুধু এই ডিফল্ট তালিকা, ফোনেই জমে
  function survey() {
    setHd("২টা দ্রুত প্রশ্ন (ঐচ্ছিক)", true);
    const S = LS.get("mc2_survey", { fav: {}, chg: {}, voted: false });
    const here = () => location.hash === "#survey";
    const nav = () => (window.MCUI && MCUI.boardOff && MCUI.boardOff() ? '<a class="btn" href="#home">🏠 হোমে ফিরো</a>' : '<a class="btn" href="#board">🏆 লিডারবোর্ডে যাও</a>');
    const bar = (nm, c, n) => { const p = n ? Math.round(c / n * 100) : 0; return `<div class="row"><span class="nm">${esc(nm)}</span><span class="bar"><i style="width:${p}%"></i></span><b>${bn(p)}%</b></div>`; };
    const QT = { fav: "কলেজের প্রিয় জায়গা?", chg: "কী বদলাতে চাও?" };
    const showSrv = (r) => { // সবার ভোটের হিসাব (সার্ভার)
      const rs = (q, m, n) => (r.opts || []).filter((x) => x.q === q).map((x) => bar(x.label, +((m || {})[x.id]) || 0, n)).join("");
      V.innerHTML = `<div class="box"><div style="font-weight:700;margin-bottom:6px">${QT.fav}</div>${rs("fav", r.fav, r.nf) || '<div class="sm">এখন কোনো অপশন নেই</div>'}</div><div class="box"><div style="font-weight:700;margin-bottom:6px">${QT.chg}</div>${rs("chg", r.chg, r.nc) || '<div class="sm">এখন কোনো অপশন নেই</div>'}</div><div class="note">ধন্যবাদ! এটা সবার ভোটের হিসাব (মোট ${bn(r.total || 0)} জন ভোট দিয়েছেন)। শতকরা = ওই প্রশ্নের উত্তরদাতাদের মধ্যে কত জন বেছেছেন।</div>${nav()}`;
    };
    const showLocal = () => { // সার্ভার পাওয়া না গেলে শুধু এই ফোনের ভোট
      const pct = (m, k) => { const t = Object.values(m).reduce((a, b2) => a + b2, 0); return t ? Math.round((m[k] || 0) / t * 100) : 0; };
      const res = (m, list) => list.map((k) => `<div class="row"><span class="nm">${esc(k)}</span><span class="bar"><i style="width:${pct(m, k)}%"></i></span><b>${bn(pct(m, k))}%</b></div>`).join("");
      V.innerHTML = `<div class="box"><div style="font-weight:700;margin-bottom:6px">${QT.fav}</div>${res(S.fav, Q1)}</div><div class="box"><div style="font-weight:700;margin-bottom:6px">${QT.chg}</div>${res(S.chg, Q2)}</div><div class="note">⚠️ সার্ভার পাওয়া যায়নি, তাই এটা শুধু এই ফোনের ভোটের হিসাব।</div>${nav()}`;
    };
    const form = (opts, srvOn) => {
      let fav = "", chg = [];
      const list = (q) => opts.filter((x) => x.q === q), chips = (q, id) => `<div class="chips" id="${id}">${list(q).map((x) => `<button class="chip" data-v="${esc(String(x.id))}">${esc(x.label)}</button>`).join("")}</div>`;
      if (!list("fav").length && !list("chg").length) { V.innerHTML = '<div class="box"><div class="row">এখন কোনো প্রশ্ন নেই।</div></div>' + nav(); return; }
      V.innerHTML = (list("fav").length ? `<div class="box"><div style="font-weight:700;margin-bottom:8px">কলেজের প্রিয় জায়গা?</div>${chips("fav", "q1")}</div>` : "") +
        (list("chg").length ? `<div class="box"><div style="font-weight:700;margin-bottom:8px">কলেজ নিয়ে কী বদলাতে চাও? <span class="sm">(একাধিক)</span></div>${chips("chg", "q2")}</div>` : "") +
        `<div class="note">জমা দিলে সঙ্গে সঙ্গে ফল দেখাবে।</div><button class="btn" id="sb">জমা দিয়ে ফল দেখো</button>`;
      const q1 = $("#q1"), q2 = $("#q2");
      if (q1) q1.querySelectorAll(".chip").forEach((b) => b.onclick = () => { fav = b.dataset.v; q1.querySelectorAll(".chip").forEach((x) => x.classList.toggle("s", x === b)); });
      if (q2) q2.querySelectorAll(".chip").forEach((b) => b.onclick = () => { const v = b.dataset.v, i = chg.indexOf(v); i < 0 ? chg.push(v) : chg.splice(i, 1); b.classList.toggle("s", i < 0); });
      $("#sb").onclick = () => {
        if (!fav && !chg.length) return toast("অন্তত একটি বেছে নাও");
        if (!srvOn) { if (fav) S.fav[fav] = (S.fav[fav] || 0) + 1; chg.forEach((k) => S.chg[k] = (S.chg[k] || 0) + 1); S.voted = true; LS.set("mc2_survey", S); showLocal(); return; }
        const sb = $("#sb"); sb.disabled = true;
        window.mcSurvey.send(fav ? +fav : null, chg.map(Number)).then((r) => { if (here()) showSrv(r); }).catch(() => { sb.disabled = false; toast("ভোট জমা হয়নি, একটু পরে আবার চেষ্টা করো"); });
      };
    };
    const local = () => { if (!here()) return; if (S.voted) showLocal(); else form(Q1.map((l) => ({ id: l, q: "fav", label: l })).concat(Q2.map((l) => ({ id: l, q: "chg", label: l }))), false); };
    V.innerHTML = '<div class="box"><div class="row">⏳ লোড হচ্ছে…</div></div>';
    let tries = 0;
    const go = () => {
      if (!here()) return;
      if (!window.mcSurvey) { if (tries++ < 12) setTimeout(go, 500); else local(); return; }
      window.mcSurvey.get().then((r) => { if (!here()) return; if (r.mine) showSrv(r); else form(r.opts || [], true); }).catch(local);
    };
    go();
  }

  // "পুরস্কার আপডেট পেতে পেইজে চোখ রাখুন" লাইনের পাশের লাল "এখানে ক্লিক" ট্যাগে চাপলে ফেসবুক পেইজ (config.js fbPage) নতুন ট্যাবে খোলে; ভেতরের বাটন/ফর্ম খোলে না
  const pzGo = (e) => { const z = e.target.closest && e.target.closest(".pzc"); if (!z || (e.type === "keydown" && e.key !== "Enter" && e.key !== " ")) return; e.preventDefault(); e.stopPropagation(); const u = (window.MC_CFG || {}).fbPage; if (u) window.open(u, "_blank", "noopener"); else toast("ফেসবুক পেইজের লিংক শীঘ্রই আসছে"); };
  document.addEventListener("click", pzGo, true); document.addEventListener("keydown", pzGo, true);
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  {
    const first = () => { route(); landDl().then((ok) => { if (ok) route(); }).catch(() => {}); }, D = window.__mcDef, h0 = location.hash.replace(/^#/, "") || "home";
    if (D && h0 !== "home") { D.start(); D.p.then(first); } // সরাসরি অন্য পাতার লিংকে ঢুকলে বাকি স্ক্রিপ্ট আসার পর আঁকে
    else { first(); if (D) (window.requestAnimationFrame || setTimeout)(() => setTimeout(D.start, 0)); } // হোম আগে আঁকা, তারপর পেছনে বাকিগুলো
  }
})();

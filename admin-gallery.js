// MC Explorer অ্যাডমিন: ড্যাশবোর্ড, ছবির গ্যালারি (আপলোড/নাম/ক্যাটাগরি/বদল/মোছা/বাল্ক), কুইজ সেটিংস, স্বয়ংক্রিয় প্রশ্ন, উত্তর ও ফল।
// admin.html এই ফাইল admin.js-এর আগে লোড করে। supabase-gallery.sql একবার চালাতে হয়।
(function () {
  "use strict";
  var M = function () { return window.MCA; };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var V = function () { var v = M().$("#view"); v.onclick = v.onchange = v.oninput = v.ondragover = v.ondrop = null; return v; };
  var NONE = "__none";
  var SQLHINT = "supabase-gallery.sql চালানো হয়েছে কিনা দেখুন (Supabase > SQL Editor)।";

  var st = document.createElement("style");
  st.textContent = ".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:8px 0}.stat{background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:10px}.stat b{display:block;font-size:22px}.stat span{font-size:12px;color:var(--mut)}" +
    ".bars{display:flex;align-items:flex-end;gap:4px;height:110px;margin:8px 0 2px}.bars div{flex:1;background:var(--g);border-radius:4px 4px 0 0;min-height:2px;position:relative}.bars div i{position:absolute;top:-16px;left:0;right:0;text-align:center;font-style:normal;font-size:11px}.bl{display:flex;gap:4px}.bl span{flex:1;text-align:center;font-size:10px;color:var(--mut)}" +
    ".pb{height:10px;background:var(--bd);border-radius:6px;overflow:hidden}.pb i{display:block;height:100%;background:var(--g)}.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}" +
    ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px}.gc{position:relative;border:1px solid var(--bd);border-radius:12px;overflow:hidden;background:var(--bg);display:grid;grid-template-rows:auto 1fr auto}.gc.off{opacity:.55}.gc.sel{outline:3px solid var(--g)}.gc img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:var(--bd)}.gc .gb{padding:6px 8px;display:grid;gap:3px;overflow-wrap:anywhere}.gc .act{padding:0 6px 8px}.gk{position:absolute;top:6px;left:6px;background:rgba(255,255,255,.9);border-radius:6px;padding:2px 5px;line-height:1}.gk input{width:18px;height:18px;margin:0}" +
    ".bar{position:sticky;top:0;z-index:5;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:8px;margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.bar input,.bar select{width:auto;flex:1 1 130px}" +
    ".up{border:2px dashed var(--bd);border-radius:12px;padding:12px;text-align:center}.up.on{border-color:var(--g);background:rgba(29,107,67,.08)}.pr{display:grid;grid-template-columns:64px 1fr;gap:8px;align-items:center;border-top:1px solid var(--bd);padding:6px 0}.pr img{width:64px;height:48px;object-fit:cover;border-radius:8px}.pr .f{display:grid;grid-template-columns:1fr 1fr auto;gap:6px}.pr input.bad{border-color:var(--red)}@media(max-width:560px){.pr .f{grid-template-columns:1fr}}" +
    ".mo{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50;padding:12px}.mb{background:var(--card);color:var(--fg);border-radius:14px;padding:14px;width:min(440px,100%);display:grid;gap:8px;max-height:90vh;overflow:auto}" +
    ".ok{color:var(--g);font-weight:700}.no{color:var(--red);font-weight:700}.qr{display:grid;grid-template-columns:72px 1fr;gap:10px;border-top:1px solid var(--bd);padding:8px 0}.qr img{width:72px;height:54px;object-fit:cover;border-radius:8px}.chk{display:flex;gap:6px;align-items:center}.chk input{width:auto}.ses{border-top:1px solid var(--bd);padding:8px 0}.ses summary{cursor:pointer}" +
    ".gst{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.gst span{background:var(--bg);border:1px solid var(--bd);border-radius:999px;padding:3px 11px;font-size:13px}.gst b{color:var(--g)}" +
    ".up{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;text-align:left}.up .sm{display:block}.up>div:first-child{flex:1 1 220px}.pk{position:relative;overflow:hidden;flex:1 1 200px;min-width:160px;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px 12px;border:2px dashed var(--g);border-radius:12px;background:var(--bg);cursor:pointer;font-weight:700}.pk:hover{background:rgba(29,107,67,.08)}.pk input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}" +
    ".bar.tb{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.bar.tb input{grid-column:1/-1;width:100%}.bar.tb select{width:100%;min-width:0}" +
    ".bar.bk{background:var(--bg)}.bar.bk select{flex:1 1 150px}.qa{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center}.qa select{width:auto;flex:1 1 130px}" +
    ".mcat{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--g);color:#fff;padding:9px 18px;border-radius:999px;font-weight:700;z-index:99;box-shadow:0 4px 14px rgba(0,0,0,.3)}";
  var toast = function (m) { var d = document.createElement("div"); d.className = "mcat"; d.textContent = m; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200); };
  var NEWC = "__new", ncOpt = '<option value="' + NEWC + '">➕ নতুন ক্যাটাগরি…</option>';
  // নতুন কাস্টম ক্যাটাগরি যোগ (নাম জিজ্ঞেস করে); নাম বা null ফেরত দেয়
  function addCat(nm) {
    var n = nm != null ? nm : prompt("নতুন ক্যাটাগরির নাম:"); n = n ? String(n).trim().slice(0, 40) : ""; if (!n) return Promise.resolve(null);
    var ex = G.C.filter(function (c) { return c.toLowerCase() === n.toLowerCase(); })[0]; if (ex) return Promise.resolve(ex);
    return M().A("mc2_categories", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: n, sort: G.C.length + 1 }) }).then(function () { G.C.push(n); toast("✅ ক্যাটাগরি যোগ হয়েছে"); return n; }).catch(function (e) { M().fail(e); return null; });
  }
  document.head.appendChild(st);

  window.MCA_TABS = [["dash", "📊 ড্যাশবোর্ড"], ["gal", "🖼️ ছবির গ্যালারি"], ["set", "⚙️ কুইজ সেটিংস"], ["qs", "❓ প্রশ্ন"], ["ans", "📝 প্রশ্নভিত্তিক উত্তর"]];
  window.MCA_VIEWS = { dash: dash, gal: gal, set: setv, qs: qs, res: res, ans: res };

  var imgSrc = function (u) { return /^(https?:|data:|blob:)/.test(u) ? u : String(u || ""); };
  var catLabel = function (c) { return c || "ক্যাটাগরিহীন"; };
  var catOpts = function (cats, sel, withNone) { return (withNone ? '<option value="">— ক্যাটাগরিহীন —</option>' : "") + cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === sel ? " selected" : "") + ">" + esc(c) + "</option>"; }).join(""); };
  var inList = function (ids) { return "(" + ids.map(function (i) { return +i; }).join(",") + ")"; };
  var objName = function (u) { var m = /\/mc2-places\/([^/?]+)$/.exec(u || ""); return m ? m[1] : null; };

  // ---------- ছবি ছোট করা + আপলোড ----------
  function shrink(f) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = function () { rej(new Error("ফাইল পড়া যায়নি")); };
      fr.onload = function () {
        var im = new Image(); im.onerror = function () { rej(new Error("ছবি নয়: " + f.name)); };
        im.onload = function () {
          var k = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
          c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); c.toBlob(function (b) { b ? res(b) : rej(new Error("ছবি ছোট করা যায়নি")); }, "image/jpeg", 0.85);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(f);
    });
  }
  function putObj(blob) {
    var name = Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ".jpg", base = M().base;
    return M().raw(base + "/storage/v1/object/mc2-places/" + name, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob }).then(function (r) {
      if (!r.ok) throw new Error("আপলোড হয়নি (" + r.status + ")");
      return putThumb(name, blob).then(function () { return base + "/storage/v1/object/public/mc2-places/" + name; });
    });
  }
  // ছোট কপি (২৪০px, কম কোয়ালিটি ~৬KB): সাইটে ধীর নেটে ইউজার আগে এটা দেখে, ফুল ছবি নামলে বদলে যায়। mc2-places/t/<নাম> এ থাকে; না হলে ক্ষতি নেই (সাইট ফুল ছবিই দেখায়)
  function thumbBlob(blob) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onerror = function () { URL.revokeObjectURL(u); res(null); };
      im.onload = function () {
        var k = Math.min(1, 240 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { res(b); }, "image/jpeg", 0.4);
      };
      im.src = u;
    });
  }
  function putThumb(name, blob) {
    return thumbBlob(blob).then(function (t) { if (!t) return false; return M().raw(M().base + "/storage/v1/object/mc2-places/t/" + name, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: t }).then(function (r) { return r.ok; }); }).catch(function () { return false; });
  }
  function delObj(u) {
    var n = objName(u); if (!n) return Promise.resolve();
    return M().raw(M().base + "/storage/v1/object/mc2-places/t/" + n, { method: "DELETE" }).catch(function () {}).then(function () { return M().raw(M().base + "/storage/v1/object/mc2-places/" + n, { method: "DELETE" }).catch(function () {}); });
  }
  // পুরোনো (আগে আপলোড করা) ছবির ছোট কপি বানানো: যেটার নেই শুধু সেটারই বানায়, বারবার চাপলে সমস্যা নেই
  function backfillThumbs() {
    var pre = M().base + "/storage/v1/object/public/mc2-places/", L = G.P.filter(function (p) { return p.img && p.img.indexOf(pre) === 0 && objName(p.img); }), made = 0, had = 0, fail = 0, i = 0, st = V().querySelector("#thbs");
    var say = function (m) { var e = V().querySelector("#thbs"); if (e) e.textContent = m; };
    if (!L.length) { toast("আপলোড করা ছবি নেই (সাইটের স্থির ছবির ছোট কপি আগেই আছে)"); return; }
    (function next() {
      if (i >= L.length) { say("✅ শেষ: " + made + "টি নতুন ছোট কপি, " + had + "টি আগেই ছিল" + (fail ? ", " + fail + "টি হয়নি" : "")); return; }
      var p = L[i++], name = objName(p.img); say("⏳ " + i + "/" + L.length + " …");
      fetch(pre + "t/" + name, { method: "HEAD" }).then(function (r) {
        if (r.ok) { had++; return; }
        return fetch(p.img).then(function (r2) { if (!r2.ok) throw 0; return r2.blob(); }).then(function (b) { return putThumb(name, b); }).then(function (ok) { ok ? made++ : fail++; });
      }).catch(function () { fail++; }).then(next);
    })();
  }
  var guess = function (fn) { return String(fn || "").replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60); };

  // ---------- ড্যাশবোর্ড ----------
  function dash() {
    return M().rpc("mc2_dash").then(function (d) {
      var acc = d.answers ? Math.round(100 * d.correct / d.answers) : 0, mx = Math.max.apply(null, d.days.map(function (x) { return x.n; }).concat([1]));
      var bar = function (x) { return '<div class="it"><div>' + esc(x.bn || x.cat) + ' <span class="tag">' + x.pct + "% সঠিক</span><span class='sm'>" + x.n + ' উত্তর</span></div><div class="pb"><i style="width:' + x.pct + '%"></i></div></div>'; };
      var warn = d.active < 4 ? '<p class="warn"><b>⚠️ কুইজ চালাতে অন্তত ৪টি চালু ছবি লাগে।</b> এখন চালু আছে ' + d.active + "টি; গ্যালারিতে ছবি যোগ করুন।</p>" : (d.questions < d.active ? '<p class="warn">প্রশ্ন (' + d.questions + ") চালু ছবির (" + d.active + ") চেয়ে কম। ‘প্রশ্ন’ ট্যাবে নতুন করে বানান।</p>" : "");
      V().innerHTML = "<h2>📊 ড্যাশবোর্ড</h2>" + warn +
        '<div class="stats">' + [["মোট খেলা", d.plays], ["আজ খেলা", d.plays_today], ["গড় স্কোর", d.avg_pct + "%"], ["আলাদা ভিজিটর", d.visitors], ["মোট ছবি", d.places], ["চালু ছবি", d.active], ["প্রশ্ন (অটো)", d.questions], ["উত্তর জমা", d.answers], ["সঠিক হার", acc + "%"], ["পুরস্কার জমা", d.prize]].map(function (s) { return '<div class="stat"><b>' + s[1] + "</b><span>" + s[0] + "</span></div>"; }).join("") + "</div>" +
        "<h2>গত ১৪ দিনে খেলা</h2>" + (d.days.length ? '<div class="bars">' + d.days.map(function (x) { return '<div style="height:' + Math.max(3, Math.round(x.n / mx * 100)) + '%"><i>' + x.n + "</i></div>"; }).join("") + '</div><div class="bl">' + d.days.map(function (x) { return "<span>" + esc(String(x.d).slice(5)) + "</span>"; }).join("") + "</div>" : '<p class="sm">এখনো কেউ খেলেনি।</p>') +
        '<div class="two" style="margin-top:12px"><div><h2>😰 সবচেয়ে কঠিন ছবি</h2>' + (d.hard.map(bar).join("") || '<p class="sm">কমপক্ষে ৩টি উত্তর জমা হলে দেখাবে।</p>') + "</div><div><h2>😎 সবচেয়ে সহজ ছবি</h2>" + (d.easy.map(bar).join("") || '<p class="sm">এখনো তথ্য নেই।</p>') + "</div></div>" +
        "<h2 style='margin-top:12px'>ক্যাটাগরি অনুযায়ী সঠিক হার</h2>" + (d.cats.map(bar).join("") || '<p class="sm">এখনো তথ্য নেই।</p>');
    }).catch(function (e) { V().innerHTML = '<p class="warn">ড্যাশবোর্ড লোড হয়নি: ' + esc(e.message) + "</p><p class='sm'>" + SQLHINT + "</p>"; });
  }

  // ---------- গ্যালারি ----------
  var G = { q: "", cat: "", on: "", srt: "new", sel: {}, pend: [], P: [], C: [], busy: false, bcat: "" };
  function gal() {
    return Promise.all([M().A("mc2_places?select=*&order=id.desc&limit=1000"), M().A("mc2_categories?select=name&order=sort,name")]).then(function (r) {
      G.P = r[0]; G.C = r[1].map(function (x) { return x.name; }); G.sel = {}; paintGal();
    }).catch(function (e) { V().innerHTML = '<p class="warn">গ্যালারি লোড হয়নি: ' + esc(e.message) + "</p><p class='sm'>" + SQLHINT + "</p>"; });
  }
  function shown() {
    var q = G.q.trim().toLowerCase();
    return G.P.filter(function (p) {
      if (q && (p.bn + " " + (p.en || "")).toLowerCase().indexOf(q) < 0) return false;
      if (G.cat === NONE ? p.category : (G.cat && p.category !== G.cat)) return false;
      if (G.on === "1" && !p.active) return false; if (G.on === "0" && p.active) return false;
      return true;
    }).sort(function (a, b) { return G.srt === "az" ? String(a.bn).localeCompare(String(b.bn), "bn") : G.srt === "za" ? String(b.bn).localeCompare(String(a.bn), "bn") : G.srt === "cat" ? String(a.category || "~").localeCompare(String(b.category || "~"), "bn") || String(a.bn).localeCompare(String(b.bn), "bn") : G.srt === "old" ? a.id - b.id : b.id - a.id; });
  }
  function paintGal() {
    var v = V(), act = G.P.filter(function (p) { return p.active; }).length;
    v.innerHTML = "<h2>🖼️ ছবির গ্যালারি</h2><div class='gst'><span><b>" + G.P.length + "</b> মোট</span><span><b>" + act + "</b> চালু</span><span><b>" + (G.P.length - act) + "</b> বন্ধ</span></div>" +
      '<div class="bar" style="position:static"><button type="button" data-thb="1">🖼️ পুরোনো ছবির ছোট কপি বানান</button><span class="sm" id="thbs">ধীর নেটে ইউজার আগে ছোট কপি দেখে, পরে ফুল ছবি আসে। নতুন ছবিতে নিজে থেকেই হয়; পুরোনোগুলোর জন্য এই বোতাম একবার চাপুন।</span></div>' +
      '<div class="up" id="up"><div><b>📤 ছবি যোগ করুন</b><span class="sm">বক্সে ক্লিক করে (বা টেনে এনে) ছবি বাছুন, নাম/ক্যাটাগরি ঠিক করুন, তারপর ‘আপলোড’ চাপুন। একসাথে অনেকগুলো চলবে।</span></div><label class="pk" id="pkb"><span id="pkt">🖼️ বক্সে ক্লিক করে ছবি বাছুন</span><input id="pf" type="file" accept="image/*" multiple></label><button type="button" data-pu="1" id="upb">⬆️ আপলোড</button></div><div id="pend"></div>' +
      '<div class="bar" id="gcb" style="position:static"><input id="gnc" maxlength="40" placeholder="➕ নতুন কাস্টম ক্যাটাগরির নাম (যেমন: খেলার মাঠ)" aria-label="নতুন ক্যাটাগরি"><button id="gnca" data-gnca="1" type="button">➕ ক্যাটাগরি তৈরি করুন</button></div>' +
      '<div class="bar tb"><input id="sq" placeholder="🔎 নাম দিয়ে খুঁজুন" value="' + esc(G.q) + '"><select id="sc" aria-label="ক্যাটাগরি"><option value="">সব ক্যাটাগরি</option>' + catOpts(G.C, G.cat) + '<option value="' + NONE + '"' + (G.cat === NONE ? " selected" : "") + ">ক্যাটাগরিহীন</option></select><select id=\"so\" aria-label=\"অবস্থা\"><option value=\"\">চালু + বন্ধ</option><option value=\"1\"" + (G.on === "1" ? " selected" : "") + ">শুধু চালু</option><option value=\"0\"" + (G.on === "0" ? " selected" : "") + ">শুধু বন্ধ</option></select><select id=\"sr\" aria-label=\"সাজান\">" + [["new", "নতুন আগে"], ["old", "পুরোনো আগে"], ["az", "নাম অ-ঔ"], ["za", "নাম উল্টো"], ["cat", "ক্যাটাগরি অনুযায়ী"]].map(function (o) { return '<option value="' + o[0] + '"' + (G.srt === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>" +
      '<div class="bar bk" id="bulk"></div><div class="grid" id="gr"></div><div id="gpg"></div>';
    paintPend(); paintGrid();
    v.onclick = galClick; v.onchange = galChange; v.oninput = function (e) { if (e.target.id === "sq") { G.q = e.target.value; paintGrid(); } else if (e.target.dataset.pn != null) { G.pend[+e.target.dataset.pn].name = e.target.value; e.target.classList.toggle("bad", !e.target.value.trim()); } else if (e.target.dataset.po != null) { G.pend[+e.target.dataset.po].orig = e.target.value; } };
    var up = v.querySelector("#up");
    v.ondragover = function (e) { if (e.dataTransfer && e.dataTransfer.types.indexOf("Files") >= 0) { e.preventDefault(); up.classList.add("on"); } };
    v.ondrop = function (e) { up.classList.remove("on"); if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); addFiles(e.dataTransfer.files); } };
  }
  function paintGrid() {
    var L = shown(), n = Object.keys(G.sel).length, GP = 48, sig = [G.q, G.cat, G.on, G.srt].join("|");
    if (G.psig !== sig) { G.psig = sig; G.pg = 0; } G.pg = Math.min(G.pg || 0, Math.max(0, Math.ceil(L.length / GP) - 1));
    M().$("#gr").innerHTML = L.slice(G.pg * GP, G.pg * GP + GP).map(function (p) {
      return '<div class="gc' + (p.active ? "" : " off") + (G.sel[p.id] ? " sel" : "") + '" data-id="' + p.id + '"><label class="gk"><input type="checkbox" data-sel="' + p.id + '"' + (G.sel[p.id] ? " checked" : "") + ' aria-label="বাছুন"></label><img loading="lazy" src="' + esc(imgSrc(p.img)) + '" alt="' + esc(p.bn) + '"><div class="gb"><div class="sm">🎮 খেলার নাম</div><b>' + esc(p.bn) + "</b>" + (p.en ? '<span class="sm">' + esc(p.en) + "</span>" : "") + '<div class="sm">📁 ফাইলের নাম: ' + esc(p.orig_name || "—") + '</div><span class="tag">🗂 ক্যাটাগরি: ' + esc(catLabel(p.category)) + "</span>" + (p.active ? "" : '<span class="tag">বন্ধ</span>') + '</div><div class="act"><button class="l s" data-edit="' + p.id + '" type="button">✏️ রিনেম / ক্যাটাগরি</button><button class="l s" data-rep="' + p.id + '" type="button">🔁 ছবি বদল</button><button class="l s" data-tog="' + p.id + '" type="button">' + (p.active ? "⏸ বন্ধ" : "▶ চালু") + '</button><button class="d s" data-del="' + p.id + '" type="button">🗑</button></div></div>';
    }).join("") || '<p class="sm">কোনো ছবি মেলেনি।</p>';
    var gp = M().$("#gpg"); if (gp) { gp.innerHTML = (L.length ? '<p class="sm" style="text-align:center">মোট ' + L.length + 'টি ছবি</p>' : "") + (window.MCPG ? window.MCPG.html(G.pg, L.length, GP, "data-gp") : ""); gp.onclick = function (e) { var b = e.target.closest("[data-gp]"); if (b && !b.disabled) { G.pg = +b.dataset.gp; paintGrid(); var gr = M().$("#gr"); if (gr) gr.scrollIntoView(); } }; }
    M().$("#bulk").innerHTML = '<label class="chk"><input type="checkbox" id="sa"> সব দেখানো ছবি বাছুন</label><b>' + n + 'টি বাছা</b><div style="flex-basis:100%;height:0"></div><b>📂 ক্যাটাগরি বদলান</b><select id="bc" aria-label="নতুন ক্যাটাগরি বাছুন"><option value="">নতুন ক্যাটাগরি বাছুন…</option>' + catOpts(G.C, G.bcat, false) + '<option value="' + NONE + '"' + (G.bcat === NONE ? " selected" : "") + '>— ক্যাটাগরিহীন —</option>' + ncOpt + '</select><button data-bsave="1" type="button">➡️ Move</button><div style="flex-basis:100%;height:0"></div><button class="l s" data-b="on" type="button">▶ চালু</button><button class="l s" data-b="off" type="button">⏸ বন্ধ</button><button class="d s" data-b="del" type="button">🗑 মুছুন</button>';
    var sa = M().$("#sa"); if (sa) sa.checked = L.length > 0 && L.every(function (p) { return G.sel[p.id]; });
  }
  function selIds() { return Object.keys(G.sel).filter(function (k) { return G.sel[k]; }); }
  function patch(ids, body) { return M().A("mc2_places?id=in." + inList(ids), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) }); }
  function reload() { return gal(); }
  function galChange(e) {
    var t = e.target;
    if (t.id === "pf") { addFiles(t.files); t.value = ""; }
    else if (t.id === "sc") { G.cat = t.value; paintGrid(); } else if (t.id === "so") { G.on = t.value; paintGrid(); } else if (t.id === "sr") { G.srt = t.value; paintGrid(); }
    else if (t.dataset.sel) { G.sel[t.dataset.sel] = t.checked; paintGrid(); }
    else if (t.id === "sa") { shown().forEach(function (p) { G.sel[p.id] = t.checked; }); paintGrid(); }
    else if (t.id === "bc") { if (t.value === NEWC) addCat().then(function (n) { if (n) G.bcat = n; paintGrid(); }); else { G.bcat = t.value; paintGrid(); } } // নিজে নিজে বদলায় না; সেভ চাপলে তবেই
    else if (t.dataset.pc != null) { var pi = +t.dataset.pc; if (t.value === NEWC) addCat().then(function (n) { if (n) G.pend[pi].cat = n; paintPend(); }); else G.pend[pi].cat = t.value; }
    else if (t.id === "pall") { if (t.value === NEWC) addCat().then(function (n) { if (n) G.pend.forEach(function (x) { x.cat = n; }); paintPend(); }); else G.pend.forEach(function (x) { x.cat = t.value; }); if (t.value !== NEWC) paintPend(); }
  }
  function galClick(e) {
    var t = e.target.closest("button"); if (!t) return;
    if (t.dataset.pick) { M().$("#pf").click(); return; }
    if (t.dataset.gnca) {
      var gn = M().$("#gnc").value.trim(); if (!gn) { alert("ক্যাটাগরির নাম লিখুন।"); return; }
      var had = G.C.some(function (c) { return c.toLowerCase() === gn.toLowerCase(); });
      addCat(gn).then(function (n) { if (!n) return; if (had) toast("এই ক্যাটাগরি আগেই আছে"); paintGal(); }); return;
    }
    if (t.dataset.bsave) {
      var bi = selIds(); if (!bi.length) { alert("আগে ছবি বাছুন।"); return; } if (G.bcat === "") { alert("আগে ‘নতুন ক্যাটাগরি বাছুন’ থেকে ক্যাটাগরি বাছুন।"); return; }
      var bnm = G.bcat === NONE ? "ক্যাটাগরিহীন" : G.bcat;
      patch(bi, { category: G.bcat === NONE ? null : G.bcat }).then(function () { G.bcat = ""; toast("✅ " + bi.length + "টি ছবি ‘" + bnm + "’-তে গেছে"); return reload(); }).catch(M().fail); return;
    }
    if (t.dataset.ps != null) { G.pend[+t.dataset.ps].cat = t.dataset.pv; paintPend(); return; }
    var id = t.dataset.edit || t.dataset.rep || t.dataset.tog || t.dataset.del, p = id && G.P.filter(function (x) { return String(x.id) === String(id); })[0];
    if (t.dataset.edit && p) editModal(p);
    else if (t.dataset.rep && p) replaceImg(p);
    else if (t.dataset.tog && p) patch([p.id], { active: !p.active }).then(reload).catch(M().fail);
    else if (t.dataset.del && p) { if (confirm("‘" + p.bn + "’ ছবিটি মুছবেন? ফেরানো যাবে না।")) M().A("mc2_places?id=eq." + p.id, { method: "DELETE" }).then(function () { return delObj(p.img); }).then(reload).catch(M().fail); }
    else if (t.dataset.b) {
      var ids = selIds(); if (!ids.length) { alert("আগে ছবি বাছুন।"); return; }
      if (t.dataset.b === "on") patch(ids, { active: true }).then(reload).catch(M().fail);
      else if (t.dataset.b === "off") patch(ids, { active: false }).then(reload).catch(M().fail);
      else if (confirm(ids.length + "টি ছবি মুছবেন? ফেরানো যাবে না।")) {
        var del = G.P.filter(function (x) { return G.sel[x.id]; });
        M().A("mc2_places?id=in." + inList(ids), { method: "DELETE" }).then(function () { return Promise.all(del.map(function (x) { return delObj(x.img); })); }).then(reload).catch(M().fail);
      }
    } else if (t.dataset.thb) { backfillThumbs();
    } else if (t.dataset.pu) { uploadPend(); }
    else if (t.dataset.px != null) { G.pend.splice(+t.dataset.px, 1); paintPend(); }
    else if (t.dataset.pclear) { G.pend = []; paintPend(); }
  }
  function editModal(p) {
    var o = document.createElement("div"); o.className = "mo";
    o.innerHTML = '<div class="mb" role="dialog" aria-modal="true"><h2>✏️ ছবির তথ্য</h2><img src="' + esc(imgSrc(p.img)) + '" alt="" style="max-height:140px;object-fit:contain;border-radius:8px"><label>🎮 খেলার নাম (খেলার উত্তরে এটাই দেখাবে)<input id="en1" maxlength="60" value="' + esc(p.bn) + '"></label><label>📁 ফাইলের নাম<input id="en5" maxlength="120" value="' + esc(p.orig_name || "") + '"></label><label>ইংরেজি নাম (ঐচ্ছিক)<input id="en2" maxlength="80" value="' + esc(p.en || "") + '"></label><label>ক্যাটাগরি<select id="en3">' + catOpts(G.C, p.category, true) + '</select></label><label class="chk"><input id="en4" type="checkbox"' + (p.active ? " checked" : "") + '> কুইজে চালু</label><div class="act"><button id="ens" type="button">💾 সেভ</button><button class="l" id="enx" type="button">বাতিল</button></div></div>';
    document.body.appendChild(o); var q = function (s) { return o.querySelector(s); }; q("#en1").focus();
    q("#enx").onclick = function () { o.remove(); }; o.onclick = function (e) { if (e.target === o) o.remove(); };
    q("#ens").onclick = function () {
      var bn = q("#en1").value.trim(); if (!bn) { alert("নাম লিখুন।"); return; }
      patch([p.id], { bn: bn, orig_name: q("#en5").value.trim().slice(0, 120) || null, en: q("#en2").value.trim() || null, category: q("#en3").value || null, active: q("#en4").checked }).then(function () { o.remove(); toast("✅ সেভ হয়েছে"); return reload(); }).catch(M().fail);
    };
  }
  function replaceImg(p) {
    var f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
    f.onchange = function () {
      if (!f.files[0]) return; var old = p.img;
      shrink(f.files[0]).then(putObj).then(function (u) { return patch([p.id], { img: u }); }).then(function () { return delObj(old); }).then(reload).catch(M().fail);
    };
    f.click();
  }
  function addFiles(fl) {
    var ok = 0, skip = 0;
    Array.prototype.forEach.call(fl, function (f) {
      if (!/^image\//.test(f.type) || f.size > 25 * 1024 * 1024) { skip++; return; }
      G.pend.push({ file: f, orig: f.name, name: guess(f.name), cat: G.cat && G.cat !== NONE ? G.cat : "", url: URL.createObjectURL(f) }); ok++;
    });
    if (skip) alert(skip + "টি ফাইল বাদ গেছে (ছবি নয়, অথবা ২৫ MB-র বেশি)।");
    paintPend();
  }
  // একই নামের ছবি আগেই আছে কিনা (গ্যালারিতে বা এই আপলোড-তালিকায় দুবার)
  var nrm = function (t) { return String(t || "").trim().toLowerCase().replace(/\s+/g, " "); };
  function isDup(i) { var n = nrm(G.pend[i].name); if (!n) return false; return G.P.some(function (p) { return nrm(p.bn) === n; }) || G.pend.some(function (x, j) { return j !== i && nrm(x.name) === n; }); }
  // কাছাকাছি নামের ছবির ক্যাটাগরি থেকে সর্বোচ্চ ৫টি সাজেশন; না মিললে সবচেয়ে বেশি ব্যবহৃত ক্যাটাগরি
  function sugg(name) {
    var w = nrm(name).split(" ").filter(function (t) { return t.length > 1; }), sc = {}, all = {};
    G.P.forEach(function (p) { if (!p.category) return; all[p.category] = (all[p.category] || 0) + 1; var b = nrm(p.bn), n = 0; w.forEach(function (t) { if (b.indexOf(t) >= 0) n += 2; else if (t.length > 2 && b.indexOf(t.slice(0, 3)) >= 0) n += 1; }); if (n) sc[p.category] = (sc[p.category] || 0) + n; });
    var pick = function (m) { return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }); }, r = pick(sc);
    pick(all).forEach(function (c) { if (r.length < 5 && r.indexOf(c) < 0) r.push(c); });
    return r.slice(0, 5);
  }
  function paintPend() {
    var pk = M().$("#pkt"); if (pk) pk.textContent = G.pend.length ? "✅ " + G.pend.length + "টি ছবি বাছা — আরও যোগ করতে ক্লিক করুন" : "🖼️ বক্সে ক্লিক করে ছবি বাছুন";
    var el = M().$("#pend"); if (!el) return;
    if (!G.pend.length) { el.innerHTML = ""; return; }
    el.innerHTML = '<div class="c" style="margin:8px 0"><div class="row"><b>' + G.pend.length + 'টি ছবি আপলোডের অপেক্ষায়</b><label>সবার ক্যাটাগরি<select id="pall"><option value="">— বাছুন —</option>' + catOpts(G.C, "", true).replace('<option value="">— ক্যাটাগরিহীন —</option>', "") + ncOpt + '</select></label></div>' +
      G.pend.map(function (x, i) { return '<div class="pr"><img src="' + x.url + '" alt=""><div class="f"><input data-pn="' + i + '" maxlength="60" placeholder="🎮 খেলার নাম (বাংলা, জরুরি)" value="' + esc(x.name) + '" class="' + (x.name.trim() ? "" : "bad") + '"><input data-po="' + i + '" maxlength="120" placeholder="📁 ফাইলের নাম" aria-label="ফাইলের নাম" value="' + esc(x.orig) + '"><select data-pc="' + i + '">' + catOpts(G.C, x.cat, true) + ncOpt + '</select><button class="l s" data-px="' + i + '" type="button" aria-label="বাদ দিন">✕</button></div>' + (isDup(i) ? '<div class="sm warn">⚠️ এই নামে ছবি আগেই আছে (ডুপ্লিকেট)। নাম বদলান, অথবা চাইলে আপলোডের সময় নিশ্চিত করুন।</div>' : "") + (x.name.trim() ? '<div class="sm">ক্যাটাগরি সাজেশন: ' + sugg(x.name).map(function (c) { return '<button class="l s" type="button" data-ps="' + i + '" data-pv="' + esc(c) + '">' + esc(c) + "</button> "; }).join("") + "</div>" : "") + "</div>"; }).join("") +
      '<div class="act" style="margin-top:8px"><button id="pgo" data-pu="1" type="button">⬆️ সবগুলো আপলোড করুন</button><button class="l" data-pclear="1" type="button">সব বাদ দিন</button></div><p class="sm" id="pm"></p></div>';
  }
  function uploadPend() {
    if (G.busy) return; var L = G.pend;
    if (!L.length) { alert("আগে বক্সে ক্লিক করে ছবি বাছুন, তারপর ‘আপলোড’ চাপুন।"); return; }
    var bad = L.filter(function (x) { return !x.name.trim(); });
    if (bad.length) { alert("সব ছবির নাম লিখুন (লাল ঘর)।"); return; }
    var dn = L.filter(function (x, i) { return isDup(i); }).map(function (x) { return x.name; }); if (dn.length && !confirm("⚠️ এই নামগুলো আগে থেকেই আছে (বা দুবার দেওয়া):\n" + dn.slice(0, 8).join(", ") + "\nতবুও আপলোড করবেন?")) return;
    G.busy = true; var pm = M().$("#pm"), done = 0, fails = [], rows = [], i = 0, btn = M().$("#pgo"), ub = M().$("#upb"); btn.disabled = true; if (ub) ub.disabled = true;
    function worker() {
      if (i >= L.length) return Promise.resolve(); var x = L[i++];
      return shrink(x.file).then(putObj).then(function (u) { rows.push({ bn: x.name.trim().slice(0, 60), img: u, category: x.cat || null, orig_name: String(x.orig || "").slice(0, 120) || null }); }).catch(function (e) { fails.push(x.name + ": " + e.message); })
        .then(function () { done++; pm.textContent = "⏳ আপলোড হচ্ছে… " + done + "/" + L.length; return worker(); });
    }
    pm.textContent = "⏳ আপলোড হচ্ছে… ০/" + L.length;
    Promise.all([worker(), worker(), worker()]).then(function () {
      if (!rows.length) throw new Error(fails.join("; ") || "কিছু আপলোড হয়নি");
      return M().A("mc2_places", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) }); // এক অনুরোধে সব → প্রশ্ন একবারই তৈরি হয়
    }).then(function () {
      G.pend.forEach(function (x) { try { URL.revokeObjectURL(x.url); } catch (e) {} }); G.pend = [];
      if (fails.length) alert(rows.length + "টি যোগ হয়েছে। ব্যর্থ " + fails.length + "টি:\n" + fails.join("\n"));
      G.busy = false; return reload();
    }).catch(function (e) { G.busy = false; if (btn) btn.disabled = false; if (ub) ub.disabled = false; if (pm) pm.textContent = "⚠️ " + e.message; });
  }

  // ---------- কুইজ সেটিংস + ক্যাটাগরি ----------
  function setv() {
    return Promise.all([M().A("mc2_settings?select=*"), M().A("mc2_categories?select=name,sort&order=sort,name"), M().A("mc2_places?select=bn,category,active&limit=1000")]).then(function (r) {
      var S = {}; r[0].forEach(function (x) { S[x.key] = x.value; });
      var cats = r[1].map(function (x) { return x.name; }), cnt = {}, none = 0, tot = 0;
      var nm = {}; r[2].forEach(function (p) { if (!p.active) return; nm[p.bn] = 1; tot++; if (p.category) cnt[p.category] = (cnt[p.category] || 0) + 1; else none++; });
      var pk = +S.png_max_kb || 0, cc = (S.card_cfg && typeof S.card_cfg === "object") ? S.card_cfg : {}, cn = function (v, d) { v = Math.round(+v); return v >= 100 && v <= 8000 ? v : d; }, ccw = cn(cc.w, 1080), cch = cn(cc.h, 1400), ccsw = cn(cc.sw, 1080), ccsh = cn(cc.sh, 1920), ccq = [1, 2, 3].indexOf(+cc.q) >= 0 ? +cc.q : 2, ccqo = [[1, "১× সাধারণ (১০৮০ px চওড়া)"], [2, "২× হাই কোয়ালিটি — ডিফল্ট (২১৬০ px)"], [3, "৩× আল্ট্রা (সবচেয়ে বড় ফাইল)"]].map(function (o) { return "<option value=\"" + o[0] + "\"" + (o[0] === ccq ? " selected" : "") + ">" + o[1] + "</option>"; }).join(""), qc = +S.quiz_count || 10, wo = Math.max(1, Math.round(+S.wrong_options) || 3), qcats = Array.isArray(S.quiz_categories) ? S.quiz_categories : [];
      var mxT = Math.max(2, Object.keys(nm).length), all = !qcats.length, chk = function (val, label, n) { return '<label class="chk"><input type="checkbox" data-qc="' + esc(val) + '"' + (all || qcats.indexOf(val) >= 0 ? " checked" : "") + "> " + esc(label) + ' <span class="tag">' + n + " ছবি</span></label>"; };
      var v = V(); v.innerHTML = "<h2>⚙️ কুইজ সেটিংস</h2><p class='sm'>চালু ছবির সংখ্যা: <b>" + tot + "</b>। প্রতিবার খেলায় এখান থেকে র‍্যান্ডম ছবি বেছে প্রশ্ন বানানো হয়।</p>" +
        '<div class="row"><label>প্রতি খেলায় প্রশ্নসংখ্যা (১–৫০)<input id="s1" type="number" min="1" max="50" value="' + qc + '"></label></div>' +
        "<h2 style='margin-top:10px'>🔢 প্রতি প্রশ্নে অপশন সংখ্যা</h2><div class=\"row\"><label>মোট অপশন<input id=\"o_t\" type=\"number\" min=\"2\" max=\"" + mxT + "\" value=\"" + (wo + 1) + "\"></label><label>সঠিক<input id=\"o_c\" type=\"number\" min=\"1\" max=\"1\" value=\"1\"></label><label>ভুল<input id=\"o_w\" type=\"number\" min=\"1\" max=\"" + (mxT - 1) + "\" value=\"" + wo + "\"></label></div><p class=\"sm warn\" id=\"o_e\" hidden></p><p class=\"sm\">যেমন মোট ৭ = সঠিক ১ + ভুল ৬। এখন চালু ছবির আলাদা নাম " + mxT + "টি, তাই মোট সর্বোচ্চ " + mxT + "। ছবি বাড়ালে সীমা নিজে বাড়বে। যোগফল না মিললে সেভ হবে না। সঠিক সবসময় ১টি; বাকি অপশন অটো কাছাকাছি ভুল নাম থেকে বসবে (একই ক্যাটাগরি আগে)।</p>" +
        '<h2 style="margin-top:10px">🪪 কার্ডের সাইজ (পিক্সেল)</h2><div class="row"><label>কার্ড কোয়ালিটি (সব ডাউনলোড ও প্রিভিউয়ে)<select id="cc_q">' + ccqo + '</select></label></div><label class="chk" style="margin-top:6px"><input type="checkbox" id="cc_on"' + (cc.on ? " checked" : "") + '> কাস্টম সাইজ চালু (বন্ধ থাকলে নকশা ১০৮০×১৪০০ / ১০৮০×১৯২০, পিক্সেল ওপরের কোয়ালিটি গুণক অনুযায়ী বাড়ে)</label>' +
        '<div class="row" style="margin-top:6px"><label>স্কোর কার্ড — চওড়া (px)<input id="cc_w" type="number" min="100" max="8000" value="' + ccw + '"></label><label>স্কোর কার্ড — উচ্চতা (px)<input id="cc_h" type="number" min="100" max="8000" value="' + cch + '"></label></div>' +
        '<div class="row" style="margin-top:6px"><label>স্টোরি — চওড়া (px)<input id="cc_sw" type="number" min="100" max="8000" value="' + ccsw + '"></label><label>স্টোরি — উচ্চতা (px)<input id="cc_sh" type="number" min="100" max="8000" value="' + ccsh + '"></label></div>' +
        '<label class="chk" style="margin-top:6px"><input type="checkbox" id="cc_lk" checked> অনুপাত ঠিক রাখো (চওড়া বদলালে উচ্চতা নিজে বদলাবে)</label><div class="act" style="margin-top:6px"><button class="l s" id="cc_rs" type="button">↩️ ডিফল্ট সাইজ</button></div>' +
        '<div class="row" style="margin-top:6px"><label>📦 কাস্টম KB — ইউজারের কার্ড PNG-এর সর্বোচ্চ সাইজ (১০ বা বেশি, ০ = আনলিমিটেড)<input id="s3" type="number" min="0" step="1" value="' + (pk || "") + '" placeholder="০ = আনলিমিটেড"></label></div><p class="sm">ফাঁকা বা ০ = আনলিমিটেড (ডিফল্ট, পূর্ণ হাই কোয়ালিটি)। যত KB দেবেন (১০ বা তার বেশি, ইচ্ছামতো কমান-বাড়ান) ডাউনলোড তার বেশি হলে অটো ছোট হয়ে নামবে, কম হলে আসল মাপেই থাকবে।</p>' +
        '<p class="sm">১০০–৮০০০ px। বড় সাইজ দিলে ফাইলও বড় হয় (ফোনের সীমা প্রায় ১৬ মেগাপিক্সেল; তার বেশি হলে অনুপাত ঠিক রেখে নিজে কমে যায়)। অনুপাত আলাদা দিলে কার্ড টানা/চাপা দেখাবে। KB সীমা দিলে সেটাও মানা হয়। নতুন সাইজ নতুন খেলা/ডাউনলোড থেকে কাজ করবে।</p>' +
        "<h2 style='margin-top:10px'>কোন ক্যাটাগরির ছবি কুইজে আসবে</h2>" + cats.map(function (c) { return chk(c, c, cnt[c] || 0); }).join("") + chk(NONE, "ক্যাটাগরিহীন", none) + '<div class="act" style="margin-top:8px"><button id="ssv" type="button">💾 সংরক্ষণ</button></div><p class="sm" id="sm"></p>' +
        "<hr style='border:0;border-top:1px solid var(--bd);margin:14px 0'><h2>🗂️ ক্যাটাগরি (৪–৫টি রাখা ভালো)</h2>" + (cats.map(function (c) { return '<div class="it"><div><b>' + esc(c) + '</b> <span class="tag">' + (cnt[c] || 0) + ' চালু ছবি</span></div><div class="act"><button class="l s" data-cr="' + esc(c) + '" type="button">✏️ নাম বদল</button><button class="d s" data-cd="' + esc(c) + '" type="button">🗑 মুছুন</button></div></div>'; }).join("") || '<p class="sm">কোনো ক্যাটাগরি নেই।</p>') +
        '<div class="row" style="margin-top:8px"><label>নতুন ক্যাটাগরি<input id="nc" maxlength="40" placeholder="যেমন: খেলার মাঠ"></label><button id="nca" type="button">➕ যোগ করুন</button></div>';
      var lk = function (a, b, r) { var A = M().$(a), B = M().$(b); A.oninput = function () { if (M().$("#cc_lk").checked && +A.value > 0) B.value = Math.round(+A.value * r[1] / r[0]); }; B.oninput = function () { if (M().$("#cc_lk").checked && +B.value > 0) A.value = Math.round(+B.value * r[0] / r[1]); }; };
      var chkOpt = function () {
        var T = +M().$("#o_t").value, C = +M().$("#o_c").value, W = +M().$("#o_w").value, e = M().$("#o_e"), m = "";
        if (![T, C, W].every(function (x) { return x === Math.floor(x) && x > 0; })) m = "মোট, সঠিক ও ভুল — তিনটিতেই ১ বা তার বেশি পূর্ণ সংখ্যা দিন।";
        else if (C !== 1) m = "সঠিক উত্তর ১টিই হতে পারে।";
        else if (T !== C + W) m = "যোগফল মেলেনি: মোট " + T + " ≠ সঠিক " + C + " + ভুল " + W + " (= " + (C + W) + ")।";
        else if (T < 2 || T > mxT) m = "মোট অপশন ২ থেকে " + mxT + "-র মধ্যে দিন (চালু ছবির আলাদা নাম " + mxT + "টি; আরও ছবি যোগ করলে সীমা বাড়বে)।";
        e.hidden = !m; e.textContent = "⚠️ " + m; return m ? 0 : W;
      };
      v.oninput = function (e) { if (/^o_/.test(e.target.id)) chkOpt(); };
      lk("#cc_w", "#cc_h", [1080, 1400]); lk("#cc_sw", "#cc_sh", [1080, 1920]);
      M().$("#cc_rs").onclick = function () { M().$("#cc_on").checked = false; M().$("#cc_q").value = 2; M().$("#cc_w").value = 1080; M().$("#cc_h").value = 1400; M().$("#cc_sw").value = 1080; M().$("#cc_sh").value = 1920; };
      v.onclick = function (e) {
        var t = e.target.closest("button"); if (!t) return;
        if (t.id === "ssv") {
          var n = Math.round(+M().$("#s1").value), picked = [].slice.call(document.querySelectorAll("[data-qc]")).filter(function (x) { return x.checked; }).map(function (x) { return x.dataset.qc; }), every = picked.length === cats.length + 1;
          if (!(n >= 1 && n <= 50)) { alert("প্রশ্নসংখ্যা ১ থেকে ৫০-এর মধ্যে দিন।"); return; } if (!picked.length) { alert("কমপক্ষে একটি ক্যাটাগরি বাছুন।"); return; }
          var wv = chkOpt(); if (!wv) { M().$("#o_e").scrollIntoView({ block: "center" }); return; }
          var rows = [{ key: "quiz_count", value: n }, { key: "wrong_options", value: wv }, { key: "quiz_categories", value: every ? [] : picked }];
          var pkv = Math.round(+M().$("#s3").value || 0); if (pkv !== 0 && pkv < 10) { alert("PNG সাইজ ০ (আনলিমিটেড) অথবা কমপক্ষে ১০ KB দিন।"); return; }
          var gv = function (id) { return Math.round(+M().$(id).value); }, ccv = { q: +M().$("#cc_q").value || 2, on: M().$("#cc_on").checked, w: gv("#cc_w"), h: gv("#cc_h"), sw: gv("#cc_sw"), sh: gv("#cc_sh") };
          if ([ccv.w, ccv.h, ccv.sw, ccv.sh].some(function (n) { return !(n >= 100 && n <= 8000); })) { alert("কার্ডের চওড়া ও উচ্চতা ১০০ থেকে ৮০০০ px-এর মধ্যে দিন।"); return; }
          var put = function (r) { return M().A("mc2_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(r) }); };
          put(rows).then(function () { M().$("#sm").textContent = "✅ সংরক্ষিত। নতুন খেলা থেকে কাজ করবে।"; toast("✅ সেভ হয়েছে"); return put([{ key: "png_max_kb", value: pkv }, { key: "card_cfg", value: ccv }]).catch(function () { M().$("#sm").textContent += " (PNG সাইজ/কার্ড সাইজ সংরক্ষণ হয়নি: supabase-new-20261017c.sql একবার চালান)"; }); }).catch(M().fail);
        } else if (t.id === "nca") { var nm = M().$("#nc").value.trim(); if (nm) M().A("mc2_categories", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: nm, sort: cats.length + 1 }) }).then(function () { toast("✅ সেভ হয়েছে"); return setv(); }).catch(M().fail); }
        else if (t.dataset.cr) { var nn = prompt("নতুন নাম:", t.dataset.cr); if (nn && nn.trim() && nn.trim() !== t.dataset.cr) M().A("mc2_categories?name=eq." + encodeURIComponent(t.dataset.cr), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: nn.trim().slice(0, 40) }) }).then(setv).catch(M().fail); }
        else if (t.dataset.cd) { if (confirm("‘" + t.dataset.cd + "’ মুছবেন? এই ক্যাটাগরির ছবিগুলো মুছবে না, শুধু ‘ক্যাটাগরিহীন’ হবে।")) M().A("mc2_categories?name=eq." + encodeURIComponent(t.dataset.cd), { method: "DELETE" }).then(setv).catch(M().fail); }
      };
    }).catch(function (e) { V().innerHTML = '<p class="warn">লোড হয়নি: ' + esc(e.message) + "</p><p class='sm'>" + SQLHINT + "</p>"; });
  }

  // ---------- স্বয়ংক্রিয় প্রশ্ন ----------
  var QF = { q: "", c: "" }; // ফিল্টার মনে রাখে (রিনেম/সেভের পর তালিকা আবার লোড হলেও ফিল্টার থাকে)
  function qs() {
    return Promise.all([M().A("mc2_questions?select=place_id,question,correct,wrong,updated_at,mc2_places(img,category)&order=updated_at.desc&limit=1000"), M().A("mc2_categories?select=name&order=sort,name")]).then(function (rr) {
      var L = rr[0], CL = rr[1].map(function (x) { return x.name; }), pc = {};
      if (QF.c && QF.c !== NONE && CL.indexOf(QF.c) < 0) QF.c = "";
      function paint() {
        var q = QF.q.trim().toLowerCase(), R = L.filter(function (x) { var p = x.mc2_places || {}; if (QF.c === NONE ? p.category : (QF.c && p.category !== QF.c)) return false; return !q || (x.correct + " " + x.wrong.join(" ")).toLowerCase().indexOf(q) >= 0; });
        var nn = M().$("#qn"); if (nn) nn.textContent = R.length === L.length ? "মোট " + L.length + "টি প্রশ্ন" : "দেখাচ্ছে " + R.length + "টি (মোট " + L.length + "টির মধ্যে)";
        var xx = M().$("#qx"); if (xx) xx.hidden = !(QF.q || QF.c);
        M().$("#ql").innerHTML = R.map(function (x) { var p = x.mc2_places || {}; return '<div class="qr"><img loading="lazy" src="' + esc(imgSrc(p.img)) + '" alt=""><div><b>' + esc(x.question) + '</b> <span class="tag">' + esc(catLabel(p.category)) + '</span><div class="ok">✔ ' + esc(x.correct) + '</div><div class="no">✘ ' + x.wrong.map(esc).join(" · ") + '</div><div class="qa"><button class="l s" data-qr="' + x.place_id + '" type="button">✏️ রিনেম</button><select data-qcat="' + x.place_id + '" aria-label="ক্যাটাগরি">' + catOpts(CL, pc[x.place_id] !== undefined ? pc[x.place_id] : p.category, true) + '</select>' + (pc[x.place_id] !== undefined && pc[x.place_id] !== (p.category || "") ? '<button data-qsv="' + x.place_id + '" type="button">💾 সেভ</button>' : "") + "</div></div></div>"; }).join("") || '<p class="sm">কোনো প্রশ্ন নেই।</p>';
      }
      var v = V(); v.innerHTML = "<h2>❓ স্বয়ংক্রিয় প্রশ্ন (" + L.length + ")</h2><p class='sm'>প্রতিটি চালু ছবির নাম থেকে নিজে তৈরি হয়। সঠিক উত্তর = ছবির নাম; ভুল অপশন = একই ক্যাটাগরির অন্য ছবির নাম (কম পড়লে অন্য ক্যাটাগরি থেকে)।</p>" +
        '<div class="bar"><input id="qf" placeholder="🔎 নাম বা অপশন খুঁজুন" value="' + esc(QF.q) + '"><select id="qfc" aria-label="ক্যাটাগরি ফিল্টার"><option value="">সব ক্যাটাগরি</option><option value="' + NONE + '"' + (QF.c === NONE ? " selected" : "") + '>— ক্যাটাগরিহীন —</option>' + catOpts(CL, QF.c, false) + '</select><button id="qx" class="l s" type="button" hidden>✖ ফিল্টার মুছুন</button><button id="qb" type="button">🔄 অপশন নতুন করে সাজান</button></div><p class="sm" id="qn"></p><div id="ql"></div>';
      paint();
      v.oninput = function (e) { if (e.target.id === "qf") { QF.q = e.target.value; paint(); } };
      var byId = function (id) { return L.filter(function (x) { return String(x.place_id) === String(id); })[0]; };
      v.onchange = function (e) { var t = e.target; if (t.id === "qfc") { QF.c = t.value; paint(); } else if (t.dataset.qcat) { pc[t.dataset.qcat] = t.value; paint(); } }; // শুধু সেভ বাটন আসে; নিজে বদলায় না
      v.onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.id === "qx") { QF.q = ""; QF.c = ""; var i1 = M().$("#qf"), s1 = M().$("#qfc"); if (i1) i1.value = ""; if (s1) s1.value = ""; paint(); }
        else if (b.id === "qb") M().rpc("mc2_admin_rebuild").then(function (n) { alert("✅ " + n + "টি প্রশ্ন নতুন করে সাজানো হয়েছে।"); return qs(); }).catch(M().fail);
        else if (b.dataset.qr) {
          var x = byId(b.dataset.qr), nn = x && prompt("ছবির নতুন নাম:", x.correct);
          if (nn && nn.trim() && nn.trim() !== x.correct) M().A("mc2_places?id=eq." + encodeURIComponent(b.dataset.qr), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ bn: nn.trim().slice(0, 60) }) }).then(function () { toast("✅ সেভ হয়েছে"); return qs(); }).catch(M().fail);
        } else if (b.dataset.qsv) {
          M().A("mc2_places?id=eq." + encodeURIComponent(b.dataset.qsv), { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ category: pc[b.dataset.qsv] || null }) }).then(function () { toast("✅ সেভ হয়েছে"); return qs(); }).catch(M().fail);
        }
      };
    }).catch(function (e) { V().innerHTML = '<p class="warn">লোড হয়নি: ' + esc(e.message) + "</p><p class='sm'>" + SQLHINT + "</p>"; });
  }

  // ---------- উত্তর ও ফল ----------
  var RF = { q: "", p: "", r: "", per: "all", from: "", to: "" }; // ফিল্টার মনে রাখে (খেলা মোছার পর আবার লোড হলেও থাকে)
  function inPer(ts0) { // তারিখ ফিল্টার (সপ্তাহ শুরু শনিবার — ফোল্ডারের ফিল্টারের মতোই)
    var per = RF.per; if (per === "all") return true;
    var ts = new Date(ts0).getTime(), n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), day = 864e5;
    if (isNaN(ts)) return false;
    if (per === "today") return ts >= t0;
    if (per === "yest") return ts >= t0 - day && ts < t0;
    if (per === "week") return ts >= t0 - ((new Date(t0).getDay() + 1) % 7) * day;
    if (per === "month") return ts >= new Date(n.getFullYear(), n.getMonth(), 1).getTime();
    if (per === "range") { var a = RF.from ? new Date(RF.from + "T00:00:00").getTime() : -Infinity, b = RF.to ? new Date(RF.to + "T23:59:59.999").getTime() : Infinity; return ts >= a && ts <= b; }
    return true;
  }
  function res() {
    return M().A("mc2_answers?select=*&order=created_at.desc,id.asc&limit=1000").then(function (L) {
      var S = {}, ord = [];
      L.forEach(function (a) { if (!S[a.session]) { S[a.session] = { id: a.session, name: a.name, dev: a.device, t: a.created_at, A: [] }; ord.push(a.session); } S[a.session].A.push(a); });
      var ap = 0, AP = 50;
      function paint() {
        var q = RF.q.trim().toLowerCase(), pq = RF.p.trim().toLowerCase(), AL = ord.map(function (k) { return S[k]; }).filter(function (s) {
          if (q && String(s.name || "").toLowerCase().indexOf(q) < 0) return false;
          if (pq && !s.A.some(function (a) { return String(a.place_bn || "").toLowerCase().indexOf(pq) >= 0; })) return false;
          if (RF.r === "wrong" && !s.A.some(function (a) { return !a.is_correct; })) return false;
          if (RF.r === "allok" && s.A.some(function (a) { return !a.is_correct; })) return false;
          if (RF.r === "skip" && !s.A.some(function (a) { return a.skipped; })) return false;
          return inPer(s.t);
        });
        var xx = M().$("#rx"); if (xx) xx.hidden = !(RF.q || RF.p || RF.r || RF.per !== "all");
        ap = Math.min(ap, Math.max(0, Math.ceil(AL.length / AP) - 1));
        var pgw = M().$("#rlp"); if (pgw) { pgw.innerHTML = (AL.length ? '<p class="sm" style="text-align:center">মোট ' + AL.length + 'টি খেলা' + (AL.length !== ord.length ? ' (ফিল্টারে; লোড হওয়া ' + ord.length + 'টির মধ্যে)' : "") + '</p>' : "") + (window.MCPG ? window.MCPG.html(ap, AL.length, AP, "data-ap") : ""); pgw.onclick = function (e) { var b = e.target.closest("[data-ap]"); if (b && !b.disabled) { ap = +b.dataset.ap; paint(); } }; }
        M().$("#rl").innerHTML = AL.slice(ap * AP, ap * AP + AP).map(function (s) {
          var ok = s.A.filter(function (a) { return a.is_correct; }).length, pts = s.A.reduce(function (n, a) { return n + a.pts; }, 0);
          return '<details class="ses"><summary><b data-dev="' + esc(s.dev || "") + '">' + esc(s.name || "নামহীন") + '</b> <span class="tag">' + ok + "/" + s.A.length + ' সঠিক</span><span class="tag">' + pts + ' পয়েন্ট</span><span class="sm">' + M().tm(s.t) + "</span></summary>" +
            s.A.map(function (a) { return '<div class="sm">' + (a.is_correct ? '<span class="ok">✔</span>' : '<span class="no">✘</span>') + " " + esc(a.place_bn || "—") + " — " + (a.skipped ? "স্কিপ/সময় শেষ" : "দিয়েছে: " + esc(a.chosen)) + (a.is_correct ? "" : " (সঠিক: " + esc(a.correct_ans) + ")") + " · " + Math.round((a.ms || 0) / 100) / 10 + " সেকেন্ড · +" + a.pts + "</div>"; }).join("") + '<div class="act" style="margin-top:6px"><button class="d s" data-ds="' + esc(s.id) + '" type="button">এই খেলার রেকর্ড মুছুন</button></div></details>';
        }).join("") || '<p class="sm">' + (ord.length ? "এই ফিল্টারে কোনো খেলা মেলেনি।" : "এখনো কোনো উত্তর জমা পড়েনি।") + "</p>";
      }
      var v = V(); v.innerHTML = "<h2>📝 উত্তর ও ফল (সর্বশেষ " + ord.length + "টি খেলা)</h2><p class='sm'>সঠিক/ভুল সার্ভার নিজে যাচাই করে রাখে। খেলার সারাংশ (স্কোর/র‍্যাংক) ‘🏆 স্কোর’ ট্যাবে।</p><div class='bar'><input id='rf' placeholder='🔎 নাম দিয়ে খুঁজুন' value='" + esc(RF.q) + "'><input id='rp' placeholder='🖼️ ছবির নাম দিয়ে খুঁজুন' value='" + esc(RF.p) + "'>" +
        "<select id='rr' aria-label='ফলাফল'>" + [["", "সব খেলা"], ["wrong", "ভুল উত্তর আছে"], ["allok", "সব উত্তর সঠিক"], ["skip", "স্কিপ/সময় শেষ আছে"]].map(function (o) { return "<option value='" + o[0] + "'" + (RF.r === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
        "<select id='rt' aria-label='তারিখ'>" + [["all", "সব সময়"], ["today", "আজ"], ["yest", "গতকাল"], ["week", "এই সপ্তাহ"], ["month", "এই মাস"], ["range", "কাস্টম তারিখ"]].map(function (o) { return "<option value='" + o[0] + "'" + (RF.per === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
        "<input id='rda' type='date' title='শুরুর তারিখ' aria-label='শুরুর তারিখ' value='" + esc(RF.from) + "'><input id='rdb' type='date' title='শেষ তারিখ' aria-label='শেষ তারিখ' value='" + esc(RF.to) + "'>" +
        "<button id='rx' class='l s' type='button' hidden>✖ ফিল্টার মুছুন</button><button id='rcsv' type='button'>⬇️ CSV</button></div><div id='rl'></div><div id='rlp'></div>";
      function showR() { var on = RF.per === "range"; ["#rda", "#rdb"].forEach(function (k) { var el = M().$(k); if (el) el.hidden = !on; }); }
      showR();
      paint();
      v.oninput = function (e) { var id = e.target.id; if (id === "rf") RF.q = e.target.value; else if (id === "rp") RF.p = e.target.value; else return; ap = 0; paint(); };
      v.onchange = function (e) { var t = e.target, id = t.id; if (id === "rr") RF.r = t.value; else if (id === "rt") { RF.per = t.value; showR(); } else if (id === "rda") RF.from = t.value; else if (id === "rdb") RF.to = t.value; else return; ap = 0; paint(); };
      v.onclick = function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.dataset.ds) { if (confirm("এই খেলার সব উত্তর মুছবেন?")) M().A("mc2_answers?session=eq." + encodeURIComponent(b.dataset.ds), { method: "DELETE" }).then(res).catch(M().fail); }
        else if (b.id === "rx") {
          RF = { q: "", p: "", r: "", per: "all", from: "", to: "" }; ap = 0;
          [["#rf", ""], ["#rp", ""], ["#rr", ""], ["#rt", "all"], ["#rda", ""], ["#rdb", ""]].forEach(function (k) { var el = M().$(k[0]); if (el) el.value = k[1]; });
          showR(); paint();
        }
        else if (b.id === "rcsv") {
          var q = function (x) { var s = String(x == null ? "" : x); if (typeof x !== "number" && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
          var csv = "\ufeffসময়,নাম,ছবি,দেওয়া উত্তর,সঠিক উত্তর,সঠিক?,সেকেন্ড,পয়েন্ট\r\n" + L.map(function (a) { return [a.created_at, a.name, a.place_bn, a.skipped ? "স্কিপ" : a.chosen, a.correct_ans, a.is_correct ? "হ্যাঁ" : "না", (a.ms || 0) / 1000, a.pts].map(q).join(","); }).join("\r\n");
          var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "answers.csv"; a.click();
        }
      };
    }).catch(function (e) { V().innerHTML = '<p class="warn">লোড হয়নি: ' + esc(e.message) + "</p><p class='sm'>" + SQLHINT + "</p>"; });
  }
})();

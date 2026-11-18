// কুইজের ছবি কীভাবে খোলে — সেটিং পড়ে। অ্যাডমিন > 🖼 কুইজ ছবি (admin-qimg.js) থেকে বদলায়।
// সেভ হয় mc2_settings-এর key 'qimg_cfg'; ফোনে কপি: mc2_qimg। সেটিং না পেলে আগের মতোই (৩.৬ গুণ → ২০ সেকেন্ড, ৮ কোণ)।
(function () {
  var C = window.MC_CFG || {}, KEY = "mc2_qimg";
  var DEF = { mode: "zoom", dur: 20, sc: 3.6, ease: "linear", delay: 0, cor: [0, 1, 2, 3, 4, 5, 6, 7], ord: "rand", rep: 1, rok: true, rokT: 0.5, wbl: true, wblPx: 24, thumb: false, fade: true };
  var num = function (v, a, b, d) { v = +v; return isFinite(v) && v >= a && v <= b ? v : d; };
  function clean(o) {
    o = o && typeof o === "object" ? o : {}; var r = {}, k, cor = Array.isArray(o.cor) ? o.cor.filter(function (x, i, a) { return x >= 0 && x <= 7 && a.indexOf(x) === i; }) : [];
    for (k in DEF) r[k] = DEF[k];
    r.mode = ["zoom", "still", "rev"].indexOf(o.mode) >= 0 ? o.mode : DEF.mode; r.ease = ["linear", "ease-out", "ease-in-out"].indexOf(o.ease) >= 0 ? o.ease : DEF.ease;
    r.ord = ["rand", "seq", "fix"].indexOf(o.ord) >= 0 ? o.ord : DEF.ord; r.cor = cor.length ? cor : DEF.cor.slice();
    r.dur = num(o.dur, 1, 120, DEF.dur); r.sc = num(o.sc, 1.1, 10, DEF.sc); r.delay = num(o.delay, 0, 20, 0); r.rep = Math.round(num(o.rep, 1, 5, 1));
    r.rokT = num(o.rokT, 0, 5, DEF.rokT); r.wblPx = num(o.wblPx, 0, 60, DEF.wblPx); r.rok = o.rok !== false; r.wbl = o.wbl !== false; r.thumb = o.thumb === true; r.fade = o.fade !== false;
    return r;
  }
  var cur; try { cur = clean(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { cur = clean(null); }
  function load() {
    if (!(C.url && C.key)) return;
    fetch(String(C.url).replace(/\/$/, "") + "/rest/v1/mc2_settings?select=value&key=eq.qimg_cfg", { headers: { apikey: C.key, Authorization: "Bearer " + C.key } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (r) { if (!r || !r.length) return; cur = clean(r[0].value); try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {} })
      .catch(function () {});
  }
  load();
  window.MCQ = { get: function () { return cur; }, clean: clean, DEF: DEF };
})();

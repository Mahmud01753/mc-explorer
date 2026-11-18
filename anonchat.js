// MC Explorer — বেনামি চ্যাট (Messenger-স্টাইল): বিভাগ → সেশন → নাম → চ্যাট। ঠিকানা: #anon
// ইমোজি, রিঅ্যাকশন, রিপ্লাই, Seen, নাম Edit, AM/PM সময়, আগের বার্তা, মোছা, ছবি/ভিডিও/অডিও/ফাইল।
// বিভাগ/সেশন/আপলোড ON-OFF অ্যাডমিন প্যানেলের "💬 বেনামি চ্যাট" ট্যাবে। SQL: supabase-anonchat.sql।
// মডারেশন (রিপোর্ট, সতর্কতা, ব্যান, রেট লিমিট, ফাইল যাচাই): SQL supabase-moderation.sql; অ্যাডমিন: "🛡️ মডারেশন" ট্যাব (admin-moderation.js)।
(function () {
  var C = window.MC_CFG || {}, ON = !!(C.url && C.key), base = ON ? String(C.url).replace(/\/$/, "") : "", iv = null, CUR = null;
  var SEL = 0, SENT = {}, ONL = 0, MSGS = [], MET = {}, UP = true, REPLY = null, SIG = "", MORE = true, LASTSEEN = 0, BUSY = false;
  var LS = { get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s) { return document.querySelector(s); }, bd = function (s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); };
  var MON = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
  var EMC = [["😀", "স্মাইলি", ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😗", "😋", "😜", "🤪", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😢", "😭", "😤", "😠", "😡", "🤬", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "😐", "😶", "🙄", "😬", "😴", "🤤", "😷", "🤒", "🤕", "🤢", "🥵", "🥶", "😇", "🥺", "😳", "🙈", "🙉", "🙊", "💀", "👻", "🤡"]], ["👍", "মানুষ", ["👍", "👎", "👏", "🙌", "🙏", "💪", "👌", "✌️", "🤞", "👋", "🤝", "☝️", "👆", "👇", "👈", "👉", "✋", "🖐️", "🤟", "🤘", "✍️", "👀", "👅", "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "🧓", "👮", "👷", "🎓", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕", "💖", "💗", "💘"]], ["🐶", "প্রাণী", ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦅", "🦆", "🦉", "🐺", "🐴", "🦄", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍", "🐟", "🐬", "🐳", "🦈", "🐘", "🐅", "🐆", "🐒", "🌳", "🌴", "🌸", "🌹", "🌻", "🌼", "🍀", "🍁"]], ["🍕", "খাবার", ["🍎", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥕", "🌽", "🥔", "🍞", "🧀", "🍳", "🥞", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🌮", "🍜", "🍝", "🍣", "🍤", "🍚", "🍛", "🍦", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍭", "☕", "🍵", "🥤", "🍺", "🥛", "🧃"]], ["⚽", "কার্যক্রম", ["⚽", "🏏", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🥊", "🎯", "🎮", "🎲", "🎨", "🎬", "🎤", "🎧", "🎸", "🎹", "🥁", "🎻", "📚", "✏️", "🏆", "🥇", "🥈", "🥉", "🏅", "🎉", "🎊", "🎁", "🎈"]], ["🚗", "ভ্রমণ", ["🚗", "🚕", "🚌", "🚎", "🚑", "🚒", "🚓", "🚲", "🛵", "🏍️", "🚆", "🚂", "✈️", "🚀", "🛳️", "⛵", "🚤", "🏫", "🏠", "🏢", "🏥", "🕌", "⛪", "🏖️", "🏝️", "⛰️", "🌄", "🌅", "🌃", "🌉", "🌧️", "☀️", "⛅", "☁️", "⛈️", "🌈", "❄️", "🌙", "⭐"]], ["💡", "বস্তু", ["📱", "💻", "🖥️", "⌚", "📷", "🎥", "📞", "💡", "🔦", "🔋", "💰", "💵", "💳", "🎒", "👜", "👓", "🕶️", "👕", "👖", "👗", "👟", "👑", "💍", "🔑", "🔒", "📖", "📝", "📌", "📎", "✂️", "🗓️", "🔔", "🧳", "🛏️", "🚪"]], ["💯", "চিহ্ন", ["💯", "✅", "❌", "❎", "⭕", "❗", "❓", "‼️", "⚠️", "🚫", "🔥", "✨", "💥", "💫", "💢", "💤", "➕", "➖", "✔️", "➡️", "⬅️", "⬆️", "⬇️", "🔄", "♻️", "⚡", "☮️", "♥️", "🔴", "🟢", "🔵", "🟡", "⚫", "⚪"]], ["🇧🇩", "পতাকা", ["🇧🇩", "🇮🇳", "🇵🇰", "🇳🇵", "🇱🇰", "🇧🇹", "🇲🇻", "🇦🇫", "🇸🇦", "🇦🇪", "🇶🇦", "🇰🇼", "🇴🇲", "🇲🇾", "🇸🇬", "🇮🇩", "🇹🇭", "🇯🇵", "🇰🇷", "🇨🇳", "🇹🇷", "🇮🇷", "🇮🇶", "🇪🇬", "🇬🇧", "🇺🇸", "🇨🇦", "🇦🇺", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇷🇺", "🇧🇷", "🇦🇷", "🇵🇸", "🇺🇳", "🏁", "🚩", "🏳️", "🏴"]]], EMI = 0;
  function emoHtml() { var c = EMC[EMI]; return '<div style="flex:0 0 100%;width:100%;grid-column:1/-1;display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid rgba(128,128,128,.3);padding-bottom:4px">' + EMC.map(function (k, i) { return '<button type="button" data-ec="' + i + '" title="' + k[1] + '" style="flex:none;border:0;background:' + (i === EMI ? "rgba(128,128,128,.28)" : "transparent") + ';border-radius:8px;padding:4px 7px;font-size:19px;cursor:pointer">' + k[0] + "</button>"; }).join("") + '</div><div style="flex:0 0 100%;font-size:12px;opacity:.65;padding:2px 4px">' + c[1] + "</div>" + c[2].map(function (e) { return '<button type="button" data-em="' + e + '">' + e + "</button>"; }).join(""); }
  var RX = ["👍", "❤️", "😂", "😆", "😮", "😢", "🙏"],
    // অনুমোদিত ফাইল: এক্সটেনশন -> [ধরন, মাইম, সর্বোচ্চ MB]। সার্ভারের mc2_ac_ftypes()-এর সাথে একই রাখুন (SVG/HTML/JS/EXE/ZIP নেই)।
    FT = { jpg: ["image", "image/jpeg", 10], jpeg: ["image", "image/jpeg", 10], png: ["image", "image/png", 10], gif: ["image", "image/gif", 10], webp: ["image", "image/webp", 10],
      mp4: ["video", "video/mp4", 25], webm: ["video", "video/webm", 25], mov: ["video", "video/quicktime", 25],
      mp3: ["audio", "audio/mpeg", 15], m4a: ["audio", "audio/mp4", 15], wav: ["audio", "audio/wav", 15], ogg: ["audio", "audio/ogg", 15], aac: ["audio", "audio/aac", 15],
      pdf: ["file", "application/pdf", 15], txt: ["file", "text/plain", 2], csv: ["file", "text/csv", 5], doc: ["file", "application/msword", 15],
      docx: ["file", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 15], xls: ["file", "application/vnd.ms-excel", 15],
      xlsx: ["file", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 15], ppt: ["file", "application/vnd.ms-powerpoint", 25],
      pptx: ["file", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 25] };
  var EVS = [], EVLAST = -1, TYP = 0, LT = 0, LB = false, LV = null, ACCEPT = Object.keys(FT).map(function (e) { return "." + e; }).join(","), NOMR = false, ME = { s: "ok", w: [] }, WSHOW = {}, MINZ = false, MINL = 0, PH = "home", TCH = 0;
  var RR = [["abuse", "🤬 গালিগালাজ / অশ্লীল ভাষা"], ["harass", "😡 হয়রানি / বুলিং"], ["threat", "⚠️ হুমকি / সহিংসতা"], ["adult", "🔞 অশালীন ছবি/ভিডিও/কনটেন্ট"], ["spam", "📢 স্প্যাম / বিজ্ঞাপন / লিংক"], ["privacy", "🔒 ব্যক্তিগত তথ্য ফাঁস"], ["illegal", "🚫 বেআইনি/ক্ষতিকর ফাইল"], ["other", "✍️ অন্য কারণ"]];
  function vid() { if (window.mcVid) return window.mcVid(); var v = LS.get("mc2_vid", ""); if (!v) { v = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); LS.set("mc2_vid", v); } return v; }
  function H() { return { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": "application/json", "x-voter": vid() }; }
  function api(p) { return fetch(base + "/rest/v1/" + p, { headers: H() }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function rpc(n, a) { return fetch(base + "/rest/v1/rpc/" + n, { method: "POST", headers: H(), body: JSON.stringify(a) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function toast(t) { var e = $("#acT"); if (!e) return; e.textContent = t; e.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.opacity = 0; }, 2400); }
  function tm(t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(), n = new Date(), s = bd((h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m) + " " + (h < 12 ? "AM" : "PM"); if (d.toDateString() !== n.toDateString()) s = bd(d.getDate()) + " " + MON[d.getMonth()] + ", " + s; return s; }
  function sz(n) { return n > 1048576 ? bd((n / 1048576).toFixed(1)) + " MB" : bd(Math.max(1, Math.round(n / 1024))) + " KB"; }
  function ago(t) { if (!t) return "জানা নেই"; var s = Math.max(0, Math.round((Date.now() - t) / 1000)); if (s < 60) return "এইমাত্র"; var m = Math.round(s / 60); if (m < 60) return bd(m) + " মিনিট আগে"; var h = Math.round(m / 60); if (h < 24) return bd(h) + " ঘণ্টা আগে"; return bd(Math.round(h / 24)) + " দিন আগে"; }
  var furl = function (p) { return base + "/storage/v1/object/public/mc2-chat/" + String(p).split("/").map(encodeURIComponent).join("/"); };

  var st = document.createElement("style");
  st.textContent = "#acx{--bg:#fff;--fg:#10261b;position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--fg);display:flex;flex-direction:column;font-family:'MCDigits','Hind Siliguri','Noto Sans Bengali','Nirmala UI','Bangla Sangam MN','Kalpurush','Siyam Rupali',system-ui,sans-serif}@media(prefers-color-scheme:dark){#acx{--bg:#0f1a14;--fg:#e8f1ea}}#acx [hidden]{display:none!important}" +
    "#acx .ah{display:flex;align-items:center;gap:10px;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid rgba(128,128,128,.25)}#acx .ah b{flex:1;font-size:16px;line-height:1.2;min-width:0}#acx .ah small{display:block;font-weight:500;opacity:.65;font-size:12px}" +
    "#acx .ab{border:0;background:rgba(128,128,128,.15);color:inherit;width:36px;height:36px;border-radius:50%;font-size:17px;cursor:pointer;flex:none}" +
    "#acx .ag{padding:16px;display:grid;gap:12px;max-width:460px;width:100%;margin:0 auto;overflow:auto}#acx label{font-weight:700;font-size:14px;display:grid;gap:4px}" +
    "#acx select,#acx input[type=text],#acx input:not([type]){font:inherit;padding:11px 12px;border-radius:12px;border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;width:100%}#acx option{color:#000}" +
    "#acx .go{border:0;border-radius:999px;padding:13px;font:800 16px inherit;font-family:inherit;color:#fff;background:linear-gradient(135deg,#0084ff,#7b4dff);cursor:pointer}#acx .go:disabled{opacity:.5}" +
    "#acx .am{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:3px;overscroll-behavior:contain}#acx .r{display:flex;align-items:flex-end;gap:6px;max-width:88%}#acx .r.mine{align-self:flex-end;flex-direction:row-reverse}" +
    "#acx .av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ffb300,#ff7a18);color:#fff;font-weight:800;display:grid;place-items:center;font-size:13px;flex:none}#acx .nm{font-size:11px;opacity:.65;margin:6px 0 1px 36px}" +
    "#acx .col{display:flex;flex-direction:column;min-width:0}#acx .mine .col{align-items:flex-end}#acx .bb{padding:8px 12px;border-radius:18px;background:#e9ecef;color:#10261b;overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.35;max-width:100%}#acx .mine .bb{background:#0084ff;color:#fff}#acx .bb.dl{background:none;border:1px dashed rgba(128,128,128,.5);color:inherit;opacity:.65;font-size:13px}" +
    "#acx .tm{display:block;text-align:right;font-size:10px;opacity:.7;margin-top:2px;white-space:nowrap}#acx .mo{border:0;background:none;color:inherit;opacity:.7;font-size:20px;cursor:pointer;padding:2px 6px;flex:none;display:none;border-radius:999px}#acx .r.sel .mo{display:block;animation:acPop .15s ease-out}@keyframes acPop{from{opacity:0;transform:scale(.6)}to{opacity:.7;transform:scale(1)}}#acRx{position:absolute;z-index:5;background:var(--bg);color:inherit;border:1px solid rgba(128,128,128,.35);border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.32);padding:6px;min-width:170px;max-width:250px;max-height:260px;overflow:auto;font-size:14px;animation:acPop .15s ease-out}#acRx .rh{font-size:12px;opacity:.65;padding:2px 8px 4px}#acRx .ri{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:6px 8px;border-radius:10px;cursor:default}#acRx .ri.me{cursor:pointer}#acRx .ri.me:active{background:rgba(128,128,128,.18)}#acRx .ri em{font-style:normal;font-size:20px;line-height:1;flex:none}#acRx .ri span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}#acRx .ri small{display:block;font-size:11px;opacity:.6;white-space:normal}" +
    "#acx .rq{border-left:3px solid #0084ff;background:rgba(128,128,128,.2);border-radius:6px;padding:2px 8px;margin-bottom:5px;font-size:12px;opacity:.9}#acx .rq b{display:block}#acx .mine .rq{border-color:#fff;background:rgba(255,255,255,.2)}" +
    "#acx .bb img,#acx .bb video{max-width:100%;max-height:300px;border-radius:12px;display:block}#acx .bb audio{max-width:100%;width:230px}#acx .fc{display:flex;gap:8px;align-items:center;color:inherit;text-decoration:none}#acx .fc small{display:block;opacity:.75}" +
    "#acx .ah b.rh{font-size:16px}#acx .ah b.rh small{opacity:1;font-size:inherit;font-weight:inherit}#acx .gn{color:#0b7a4b}#acx .nl{color:#7b3fe4}@media(prefers-color-scheme:dark){#acx .gn{color:#5ee0a0}#acx .nl{color:#c4a6ff}}#acx .gn{display:block;white-space:nowrap;overflow:hidden;font-size:24px;font-weight:800;line-height:1.25}#acx .nl{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:20px;font-weight:700;line-height:1.25;margin-top:1px;opacity:.9}#acx .ol{border:0;background:none;color:inherit;font:inherit;font-size:13px;font-weight:600;padding:2px 0;margin-top:1px;cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;opacity:.85}" +
    "#acx .bb.e1,#acx .mine .bb.e1,#acx .bb.e2,#acx .mine .bb.e2{background:none;color:inherit;padding:0 2px}#acx .bb.e1>div{font-size:52px;line-height:1.2}#acx .bb.e2>div{font-size:28px;line-height:1.3}#acx .bb.e1 .tm,#acx .bb.e2 .tm,#acx .mine .bb.e1 .tm,#acx .mine .bb.e2 .tm{color:inherit;opacity:.6}" +
    "#acx .bb{padding:11px 16px;border-radius:22px;font-size:17px;line-height:1.32;background:#e9ecef;color:#10261b}#acx .mine .bb{background:#0a66ff;color:#fff}#acx .bb.mm{padding:3px}#acx .bb.dl,#acx .mine .bb.dl{background:none;color:inherit;padding:8px 12px}#acx .bb.e1,#acx .mine .bb.e1,#acx .bb.e2,#acx .mine .bb.e2{background:none;color:inherit;padding:0 2px}" +
    "#acx .r:not(.mine)+.r:not(.mine) .bb:not(.e1):not(.e2){border-top-left-radius:6px}#acx .r:not(.mine):has(+.r:not(.mine)) .bb:not(.e1):not(.e2){border-bottom-left-radius:6px}#acx .r.mine+.r.mine .bb:not(.e1):not(.e2){border-top-right-radius:6px}#acx .r.mine:has(+.r.mine) .bb:not(.e1):not(.e2){border-bottom-right-radius:6px}" +
    "#acx .rl2{font-size:12.5px;opacity:.65;margin:6px 4px 3px;display:flex;align-items:center;gap:4px}#acx .mine .rl2{justify-content:flex-end}#acx .rqb{background:#d9dde1;color:#10261b;opacity:.9;border-radius:22px;padding:10px 16px 22px;font-size:16px;line-height:1.3;overflow-wrap:anywhere;white-space:pre-wrap;max-width:100%}#acx .rqb+.bb{margin-top:-14px;position:relative;z-index:1}#acx .rqb .rqf{display:flex;align-items:center;gap:6px}" +
    "@media(prefers-color-scheme:dark){#acx .bb{background:#303030;color:#fff}#acx .mine .bb{background:#0a66ff}#acx .bb.dl,#acx .mine .bb.dl{background:none}#acx .bb.e1,#acx .mine .bb.e1,#acx .bb.e2,#acx .mine .bb.e2{background:none}#acx .rqb{background:#262626;color:#c9cdd1}}" +
    "#acx .sn{border:0;background:none;color:inherit;opacity:.6;font-size:10px;padding:0 2px;cursor:pointer}#acx .old{align-self:center;border:0;background:rgba(128,128,128,.18);color:inherit;border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer;margin-bottom:6px}" +
    "#acx .ac{display:flex;align-items:center;gap:6px;padding:8px 10px;padding-bottom:max(8px,env(safe-area-inset-bottom));border-top:1px solid rgba(128,128,128,.25)}#acx .ac input{border-radius:999px;background:rgba(128,128,128,.12);border:0;flex:1;min-width:0}#acx .ib{border:0;background:none;color:#0084ff;font-size:22px;cursor:pointer;padding:0 4px;flex:none}" +
    "#acx .rp{display:flex;align-items:center;gap:8px;padding:6px 12px;border-top:1px solid rgba(128,128,128,.25);font-size:13px}#acx .rp>span{flex:1;min-width:0;display:flex;align-items:center;gap:8px;border-left:3px solid #0084ff;padding-left:8px}" +
    "#acx .em{margin:auto;text-align:center;opacity:.6;font-size:14px;padding:20px}#acx .ep{display:grid;grid-template-columns:repeat(8,1fr);max-height:168px;overflow:auto;border-top:1px solid rgba(128,128,128,.25);padding:4px}#acx .ep button{border:0;background:none;font-size:23px;cursor:pointer;padding:4px 0}" +
    "#acx .sh0{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;z-index:3}#acx .sh{background:var(--bg);width:100%;max-width:520px;margin:0 auto;border-radius:18px 18px 0 0;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));display:grid;gap:4px;max-height:80vh;overflow:auto}" +
    "#acx .sh button{border:0;background:rgba(128,128,128,.12);color:inherit;border-radius:12px;padding:11px;font:inherit;text-align:left;cursor:pointer}#acx .sh .rb{display:flex;justify-content:space-around;background:none;padding:0 0 6px}#acx .sh .rb button{font-size:26px;background:none;padding:2px 6px;text-align:center}#acx .sh .dg{color:#d93025}" +
    "#acT{position:absolute;left:50%;bottom:80px;transform:translateX(-50%);background:#222;color:#fff;padding:8px 14px;border-radius:999px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:4;text-align:center;max-width:90%}" +
    "#acx .uc{cursor:pointer}#acx .ui{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px;padding:4px 2px}#acx .ui b{opacity:.65;font-weight:600}#acx .ml{display:flex;align-items:center;gap:8px;width:100%}#acx .ml small{margin-left:auto;opacity:.65}#acx .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#9aa3a0;flex:none}#acx .dot.on{background:#22c55e}" +
    "#acx .bn{background:rgba(217,48,37,.14);border-top:1px solid rgba(217,48,37,.45);padding:8px 12px;font-size:13px;text-align:center;line-height:1.5}#acx .sm2{font-size:12px;opacity:.7}#acx .rr{display:flex;gap:8px;align-items:center;padding:9px 10px;border-radius:12px;background:rgba(128,128,128,.12);cursor:pointer}#acx .rr input{width:auto;margin:0}" +
    "#acx #acRn{border:1px solid rgba(128,128,128,.4);border-radius:12px;padding:10px;font:inherit;background:var(--bg);color:inherit;width:100%;box-sizing:border-box}#acx .ib:disabled,#acx #acI:disabled{cursor:not-allowed}#acx .sy{text-align:center;font-size:12px;opacity:.75;margin:8px 0}#acx .ty{padding:3px 14px;font-size:12.5px;opacity:.85;font-style:italic}" +
    "#acx .r{background:none;padding:0;border:0;border-radius:0;box-shadow:none;position:relative;transition:transform .18s}#acx .tm{color:inherit;font-weight:400}#acx .mine .tm{color:rgba(255,255,255,.8)}#acx .rxs{display:flex;position:relative;z-index:1;margin:-9px 8px 0;align-self:flex-end}#acx .mine .rxs{align-self:flex-start}#acx .rxs button{display:flex;align-items:center;gap:1px;background:var(--bg);color:inherit;border:1px solid rgba(128,128,128,.28);border-radius:999px;padding:1px 6px;font-size:13px;line-height:1.35;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.25)}#acx .rxs button.on{border-color:#0084ff}#acx .rxs i{font-style:normal;font-size:11.5px;opacity:.8;margin-left:3px}#acx .bb .th{display:block;width:190px;max-width:100%;max-height:230px;object-fit:cover;border-radius:12px;cursor:pointer}#acx .bb .vt{position:relative;width:190px;max-width:100%;border-radius:12px;overflow:hidden;cursor:pointer;background:#000}#acx .bb .vt video{display:block;width:100%;max-height:230px;object-fit:cover;pointer-events:none;border-radius:0}#acx .vt span{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:30px;background:rgba(0,0,0,.22)}#acx .bb.mm{padding:3px}#acx .bb.mm .tm{padding:0 6px 2px}#acx .fc{cursor:pointer}#acx .pt{position:relative;width:38px;height:38px;border-radius:8px;object-fit:cover;flex:none;display:grid;place-items:center;background:rgba(128,128,128,.28);font-size:20px;overflow:hidden;line-height:1}#acx .pt video{width:100%;height:100%;object-fit:cover;pointer-events:none;border-radius:0;max-height:none}#acx .pt u{position:absolute;inset:0;display:grid;place-items:center;text-decoration:none;color:#fff;font-size:14px;background:rgba(0,0,0,.28)}#acx .rp>span>i{font-style:normal;display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#acx .rq .rqf{display:flex;align-items:center;gap:6px;margin-top:2px}#acx .rq .pt{width:34px;height:34px;font-size:17px}#acx .sh .ep button{background:none;padding:4px 0;text-align:center;border-radius:0}#acx .sh .ep{border-top:0}#acx .sh .rb .mr{font-size:20px;background:rgba(128,128,128,.2);border-radius:50%;width:34px;height:34px;padding:0;align-self:center}#acx .rt{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}#acx .sh .rt button{flex:none;padding:6px 12px;border-radius:999px}#acx .sh .rt button.on{background:#0084ff;color:#fff}#acx .sh .rl{display:flex;align-items:center;gap:10px}#acx .rl>span:nth-child(2){flex:1;display:grid}#acx .rl small{opacity:.65;font-size:11px}#acx .rl em{font-style:normal;font-size:22px}#acFv{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.97);color:#fff;display:flex;flex-direction:column;align-items:center;font-family:inherit}#acFv .fx{position:absolute;top:max(10px,env(safe-area-inset-top));right:12px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.2);color:#fff;font-size:22px;cursor:pointer;z-index:2}#acFv .fm{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:64px 12px 8px;box-sizing:border-box;text-align:center;overflow:auto}#acFv .fm img,#acFv .fm video{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px}#acFv .fm small{opacity:.7}#acFv .fd{margin:8px 0;margin-bottom:max(18px,env(safe-area-inset-bottom));border:0;border-radius:999px;padding:12px 30px;font:800 16px inherit;font-family:inherit;color:#fff;background:linear-gradient(135deg,#0084ff,#7b4dff);cursor:pointer}#acMin{position:fixed;z-index:59;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:11px 18px;font:800 14px inherit;font-family:'MCDigits','Hind Siliguri','Noto Sans Bengali','Nirmala UI','Bangla Sangam MN','Kalpurush','Siyam Rupali',system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#0084ff,#7b4dff);box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;max-width:92vw;white-space:nowrap}#acMin{touch-action:none;user-select:none;-webkit-user-select:none}#acMin .mx{position:absolute;top:-9px;right:-7px;width:24px;height:24px;border-radius:50%;background:#fff;color:#10261b;font-size:13px;font-weight:800;line-height:24px;text-align:center;box-shadow:0 1px 5px rgba(0,0,0,.4)}#acMin em{font-style:normal;background:#e23b57;border-radius:999px;padding:0 7px;min-width:20px;text-align:center;line-height:20px}/* রিপ্লাই বার্তায় রিঅ্যাকশন: বাবল + চিপ একসঙ্গে মোড়ানো, তাই চিপ সবসময় বাবলের গায়েই বসে (রিপ্লাই-বক্স চওড়া হলেও দূরে যায় না) */#acx .bw{display:flex;flex-direction:column;min-width:0;max-width:100%}#acx .mine .bw{align-self:flex-end}#acx .rqb+.bw{margin-top:-14px;position:relative;z-index:1}#acx .rxs{margin:-9px 8px 0}";
  document.head.appendChild(st);


  // ---------- ফাইল প্রিভিউ / ফুল ভিউ / রিঅ্যাকশন / ইমোজি / মিনিমাইজ (সহায়ক) ----------
  function isF(m) { return !!(m && m.kind && m.kind !== "text" && m.file_path); }
  function lab(m) { return m.kind === "image" ? "ছবি" : m.kind === "video" ? "ভিডিও" : m.kind === "audio" ? "অডিও" : "ফাইল"; }
  function thumb(m) { var u = furl(m.file_path); if (m.kind === "image") return '<img class="pt" src="' + u + '" alt="" loading="lazy">'; if (m.kind === "video") return '<span class="pt"><video src="' + u + '#t=0.1" preload="metadata" muted playsinline></video><u>▶</u></span>'; return '<span class="pt">' + (m.kind === "audio" ? "🎵" : "📄") + "</span>"; }
  function find(id) { return MSGS.filter(function (z) { return z.id === id; })[0]; }
  function setReply(id) { var m = find(id); if (!m) return; var x = MET[id] || {}; if (x.d || m.deleted) return; REPLY = { id: id, nick: x.n || m.nick, text: m.body || (isF(m) ? lab(m) : "ফাইল"), f: isF(m) ? m : null }; showReply(); var i = $("#acI"); if (i && !i.disabled) i.focus(); }
  function react(id, e) {
    if (lockOn()) return; var x = MET[id] = MET[id] || {}, r = x.r = x.r || {};
    if (x.m) { r[x.m] = (r[x.m] || 1) - 1; if (r[x.m] <= 0) delete r[x.m]; }
    if (x.m === e) x.m = null; else { x.m = e; r[e] = (r[e] || 0) + 1; }
    render(true);
    rpc("mc2_ac_react", { p_msg: id, p_voter: vid(), p_emoji: e }).catch(function () {}).then(function () { rtNudge(); return load("new"); });
  }
  function rxlist(id) {
    var Z = document.createElement("div"), L = null, cur = ""; Z.className = "sh0";
    function draw() {
      var r = (MET[id] || {}).r || {}, ks = Object.keys(r).filter(function (e) { return r[e] > 0; }).sort(function (a, b) { return r[b] - r[a]; }), tot = ks.reduce(function (n, e) { return n + r[e]; }, 0);
      var h = '<div class="sh"><b>রিঅ্যাকশন · ' + bd(tot) + '</b><div class="rt"><button type="button" data-t="" class="' + (cur ? "" : "on") + '">সব ' + bd(tot) + "</button>" + ks.map(function (e) { return '<button type="button" data-t="' + esc(e) + '" class="' + (cur === e ? "on" : "") + '">' + esc(e) + " " + bd(r[e]) + "</button>"; }).join("") + "</div>";
      if (L) h += L.filter(function (i) { return !cur || i.e === cur; }).map(function (i) { return '<button type="button" class="rl"' + (i.o ? ' data-own="' + esc(i.e) + '"' : "") + '><span class="av">' + esc(Array.from(i.n || "?")[0] || "?") + "</span><span>" + esc(i.n || "বেনামি") + (i.o ? " (আপনি)<small>ট্যাপ করলে রিঅ্যাকশন সরবে</small>" : "") + "</span><em>" + esc(i.e) + "</em></button>"; }).join("") || '<div class="sm2">কেউ নেই।</div>'; else h += '<div class="sm2">⏳ লোড হচ্ছে…</div>';
      Z.innerHTML = h + '<button type="button" data-x>বন্ধ করুন</button></div>';
    }
    Z.onclick = function (e) {
      var t = e.target.closest("[data-t]"); if (t) { cur = t.dataset.t; return draw(); }
      var o = e.target.closest("[data-own]"); if (o) { var em = o.dataset.own; Z.remove(); return react(id, em); }
      if (e.target === Z || e.target.closest("[data-x]")) Z.remove();
    };
    draw(); $("#acx").appendChild(Z);
    rpc("mc2_ac_reactors", { p_msg: id, p_voter: vid() }).then(function (R) { L = Array.isArray(R) ? R : []; draw(); }).catch(function () {
      var x = MET[id] || {}, r = x.r || {}; L = []; Object.keys(r).forEach(function (e) { for (var k = 0; k < r[e]; k++) L.push({ n: x.m === e && k === 0 ? "আপনি" : "একজন", e: e, o: x.m === e && k === 0 }); }); draw();
    });
  }
  // রিঅ্যাকশনে চাপলে চিপের পাশে ভাসমান বাক্স: কে কোন ইমোজি দিয়েছে
  var RXID = 0, RXOFF = null;
  function rxclose() { var P = $("#acRx"); if (P) P.remove(); RXID = 0; if (RXOFF) { RXOFF(); RXOFF = null; } }
  function rxpop(id, chip) {
    if (RXID === id) return rxclose(); rxclose(); if (!chip) return;
    var A = $("#acx"), P = document.createElement("div"), L = null, mine = !!(MET[id] || {}).o; P.id = "acRx"; RXID = id; P.style.visibility = "hidden";
    function place() {
      var ar = A.getBoundingClientRect(), cr = chip.getBoundingClientRect(), w = P.offsetWidth, h = P.offsetHeight;
      var l = mine ? cr.left - ar.left - w - 6 : cr.right - ar.left + 6; l = Math.max(8, Math.min(l, ar.width - w - 8));
      var t = cr.bottom - ar.top - h; t = Math.max(8, Math.min(t, ar.height - h - 8));
      P.style.left = l + "px"; P.style.top = t + "px"; P.style.visibility = "";
    }
    function draw() {
      var h = L ? (L.length ? L.map(function (i) { return '<button type="button" class="ri' + (i.o ? " me" : "") + '"' + (i.o ? ' data-own="' + esc(i.e) + '"' : "") + "><em>" + esc(i.e) + "</em><span>" + esc(i.n || "বেনামি") + (i.o ? " (আপনি)<small>ট্যাপ করলে রিঅ্যাকশন সরবে</small>" : "") + "</span></button>"; }).join("") : '<div class="rh">কেউ নেই।</div>') : '<div class="rh">⏳ লোড হচ্ছে…</div>';
      P.innerHTML = '<div class="rh">রিঅ্যাকশন · ' + bd(L ? L.length : ((MET[id] || {}).r ? Object.keys(MET[id].r).reduce(function (n, e) { return n + MET[id].r[e]; }, 0) : 0)) + "</div>" + h; place();
    }
    P.onclick = function (e) { var o = e.target.closest("[data-own]"); if (o) { var em = o.dataset.own; rxclose(); react(id, em); } };
    var out = function (e) { if (P.contains(e.target) || (e.target.closest && e.target.closest("[data-rxs]"))) return; rxclose(); };
    var M = $("#acM"), sc = function () { rxclose(); };
    document.addEventListener("click", out, true); if (M) M.addEventListener("scroll", sc, { passive: true });
    RXOFF = function () { document.removeEventListener("click", out, true); if (M) M.removeEventListener("scroll", sc); };
    A.appendChild(P); draw();
    rpc("mc2_ac_reactors", { p_msg: id, p_voter: vid() }).then(function (R) { if (RXID !== id) return; L = Array.isArray(R) ? R : []; draw(); }).catch(function () {
      if (RXID !== id) return; var x = MET[id] || {}, r = x.r || {}; L = []; Object.keys(r).forEach(function (e) { for (var k = 0; k < r[e]; k++) L.push({ n: x.m === e && k === 0 ? "আপনি" : "একজন", e: e, o: x.m === e && k === 0 }); }); draw();
    });
  }
  function emoPick(cb) {
    var Z = document.createElement("div"); Z.className = "sh0";
    function draw() { Z.innerHTML = '<div class="sh"><b>ইমোজি বাছুন</b><div class="ep">' + emoHtml() + '</div><div style="display:flex;gap:6px"><input id="acCe" type="text" maxlength="12" placeholder="নিজের ইমোজি লিখুন বা পেস্ট করুন" style="flex:1"><button type="button" data-ce style="flex:none">যোগ</button></div><button type="button" data-x>বন্ধ করুন</button></div>'; }
    Z.onclick = function (e) {
      var c = e.target.closest("[data-ec]"); if (c) { EMI = +c.dataset.ec; return draw(); }
      var b = e.target.closest("[data-em]"); if (b) { Z.remove(); return cb(b.dataset.em); }
      if (e.target.closest("[data-ce]")) {
        var v = ($("#acCe").value || "").trim(), g = v ? (window.Intl && Intl.Segmenter ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(v))[0].segment : Array.from(v)[0]) : "";
        if (!g || !/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u.test(g) || Array.from(g).length > 16) return toast("একটি ইমোজি লিখুন।"); Z.remove(); return cb(g);
      }
      if (e.target === Z || e.target.closest("[data-x]")) Z.remove();
    };
    draw(); $("#acx").appendChild(Z);
  }
  function dl(m, btn) {
    var u = furl(m.file_path), n = m.file_name || "file", t = btn ? btn.textContent : ""; if (btn) { btn.textContent = "⏳ ডাউনলোড হচ্ছে…"; btn.disabled = true; }
    var end = function () { if (btn) { btn.textContent = t; btn.disabled = false; } };
    fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (b) { var a = document.createElement("a"), o = URL.createObjectURL(b); a.href = o; a.download = n; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(o); }, 4000); end(); }).catch(function () { end(); window.open(u, "_blank"); });
  }
  function viewer(id) {
    var m = find(id); if (!m || !isF(m)) return; var u = furl(m.file_path), h;
    if (m.kind === "image") h = '<img src="' + u + '" alt="' + esc(m.file_name) + '">'; else if (m.kind === "video") h = '<video src="' + u + '" controls autoplay playsinline></video>';
    else if (m.kind === "audio") h = '<div style="font-size:64px">🎵</div><audio src="' + u + '" controls autoplay style="width:min(92vw,360px)"></audio><div>' + esc(m.file_name || "অডিও") + "</div>";
    else h = '<div style="font-size:64px">📄</div><div style="overflow-wrap:anywhere">' + esc(m.file_name || "ফাইল") + "</div><small>" + (m.file_size ? sz(m.file_size) : "") + "</small>";
    var Z = document.createElement("div"); Z.id = "acFv"; Z.setAttribute("role", "dialog");
    Z.innerHTML = '<button class="fx" type="button" aria-label="বন্ধ করুন" data-fx>✕</button><div class="fm">' + h + '</div><button class="fd" type="button" data-fd>⬇ ডাউনলোড</button>';
    var kh = function (e) { if (e.key === "Escape") cl(); }, cl = function () { document.removeEventListener("keydown", kh); Z.remove(); }; document.addEventListener("keydown", kh);
    Z.onclick = function (e) { if (e.target.closest("[data-fd]")) return dl(m, e.target.closest("[data-fd]")); if (e.target.closest("[data-fx]") || e.target === Z || e.target.classList.contains("fm")) cl(); };
    $("#acx").appendChild(Z);
  }
  function pill() {
    var b = $("#acMin"); if (!MINZ || !CUR) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("button"); b.id = "acMin"; b.type = "button"; b.onclick = function (e) { if (e.target.closest && e.target.closest(".mx")) { e.stopPropagation(); return close(); } if (Date.now() - PDT < 400) return; restore(); }; pdrag(b); document.body.appendChild(b); }
    var n = MSGS.filter(function (m) { return m.id > MINL && !(MET[m.id] || {}).o; }).length;
    b.innerHTML = "💬 " + esc(CUR.sn || "চ্যাট") + " — চ্যাট খুলুন" + (n ? "<em>" + bd(n > 99 ? "99+" : n) + "</em>" : "") + '<span class="mx" role="button" aria-label="চ্যাট বন্ধ করুন">✕</span>';
    pclamp(b);
  }
  // মিনিমাইজ বাটন হাত/মাউস দিয়ে টেনে সরানো; টানলে চ্যাট খোলে না, শুধু ট্যাপে খোলে
  var PDT = 0, PPOS = null;
  function pclamp(b) { if (!PPOS) return; var r = b.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight; PPOS.l = Math.max(0, Math.min(PPOS.l, w - r.width)); PPOS.t = Math.max(0, Math.min(PPOS.t, h - r.height)); b.style.transform = "none"; b.style.bottom = "auto"; b.style.left = PPOS.l + "px"; b.style.top = PPOS.t + "px"; }
  function pdrag(b) {
    var sx = 0, sy = 0, ox = 0, oy = 0, on = false, mv = false, id = null;
    b.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button !== 0) return; var r = b.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = e.clientX - r.left; oy = e.clientY - r.top; on = true; mv = false; id = e.pointerId; });
    b.addEventListener("pointermove", function (e) {
      if (!on || e.pointerId !== id) return;
      if (!mv) { if (Math.abs(e.clientX - sx) < 7 && Math.abs(e.clientY - sy) < 7) return; mv = true; try { b.setPointerCapture(id); } catch (x) {} }
      e.preventDefault(); PPOS = { l: e.clientX - ox, t: e.clientY - oy }; pclamp(b);
    });
    var up = function (e) { if (!on || (e && e.pointerId !== id)) return; on = false; if (mv) { PDT = Date.now(); try { b.releasePointerCapture(id); } catch (x) {} } mv = false; };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
  }
  function minimize() { var R = $("#acx"); if (!R || !CUR) return; MINZ = true; MINL = MSGS.length ? MSGS[MSGS.length - 1].id : 0; R.style.display = "none"; pill(); location.hash = PH && PH !== "anon" ? PH : "home"; }
  function restore() { var R = $("#acx"); MINZ = false; pill(); if (R) { R.style.display = ""; if (location.hash !== "#anon") location.hash = "anon"; if ($("#acM")) { render(true, "x"); load("new"); } } else if (location.hash === "#anon") gate(); else location.hash = "anon"; }

  function root() { var e = $("#acx"); if (!e) { e = document.createElement("div"); e.id = "acx"; e.setAttribute("role", "dialog"); e.setAttribute("aria-label", "বেনামি চ্যাট"); document.body.appendChild(e); } return e; }
  function unjoin() { if (!CUR || !$("#acM")) return; try { fetch(base + "/rest/v1/rpc/mc2_ac_unjoin", { method: "POST", keepalive: true, headers: H(), body: JSON.stringify({ p_session: +CUR.s, p_voter: vid() }) }).catch(function () {}); } catch (e) {} } // ছাড়লে পাসওয়ার্ড-অ্যাক্সেস মোছে
  function close() { unjoin(); leaveRoom(); rtStop(); clearInterval(iv); iv = null; clearInterval(LV); MINZ = false; pill(); var e = $("#acx"); if (e) e.remove(); }
  function head(t, sub, back, right, cls) { return '<div class="ah"><button class="ab" id="acB" type="button" aria-label="পেছনে">' + (back ? "←" : "✕") + '</button><b' + (cls ? ' class="' + cls + '"' : "") + ">" + t + (sub ? "<small>" + sub + "</small>" : "") + "</b>" + (right || "") + "</div>"; }

  function gate() {
    clearInterval(iv); var R = root(), P = LS.get("mc2_ac_p", {});
    R.innerHTML = head("💬 বেনামি চ্যাট", "নিজের বিভাগ ও সেশনের সবার সাথে আড্ডা") + '<div class="ag"><label>বিভাগ<select id="acD"><option value="">⏳ লোড হচ্ছে…</option></select></label><label>সেশন<select id="acS" disabled><option value="">আগে বিভাগ বাছুন</option></select></label><label id="acPwL" hidden>🔒 এই চ্যাটের পাসওয়ার্ড<input id="acPw" type="password" maxlength="40" autocomplete="off" placeholder="অ্যাডমিনের দেওয়া পাসওয়ার্ড"></label><div id="acNote" hidden style="font-size:13px;line-height:1.55;padding:10px 12px;border-radius:12px;background:rgba(29,107,67,.12);border:1px solid rgba(29,107,67,.45);white-space:pre-wrap"></div>' + (P.n ? '<div class="sm2" style="padding:2px 4px">আপনার নাম: <b>' + esc(P.n) + '</b> (সেভ আছে — চ্যাটের ভিতরে ✎ চাপলে বদলাতে পারবেন)</div>' : '<label>আপনার নাম<input id="acN" maxlength="20" placeholder="নাম বা ছদ্মনাম (খালি থাকলে ‘বেনামি’)"></label>') + '<div id="acRule" style="font-size:13px;line-height:1.55;padding:10px 12px;border-radius:12px;background:rgba(255,179,0,.14);border:1px solid rgba(255,179,0,.55)">📌 ভদ্রভাবে চ্যাট করুন। অশালীন, হয়রানিমূলক বা আপত্তিকর মেসেজ দিলে ব্যবস্থা নেওয়া হতে পারে। ৩টি বৈধ রিপোর্ট পেলে অ্যাকাউন্ট সাময়িকভাবে ব্যান বা রিভিউয়ের জন্য পাঠানো হবে।</div><button class="go" id="acG" type="button" disabled>চ্যাটে ঢুকুন</button><p style="font-size:12px;opacity:.65;margin:0">ব্যক্তিগত তথ্য দেবেন না। অপমান বা খারাপ ভাষা লিখলে অ্যাডমিন বার্তা মুছে দেবে।</p></div><div id="acT"></div>';
    $("#acB").onclick = function () { location.hash = "home"; };
    var D = $("#acD"), S = $("#acS"), G = $("#acG");
    if (!ON) { D.innerHTML = '<option value="">চ্যাট এখনো চালু নয় (Supabase লাগবে)</option>'; return; }
    var HP = {}, NT = {}; function pwv() { var o = S.options[S.selectedIndex], on = !!(o && HP[o.value]); $("#acPwL").hidden = !on; var nb = $("#acNote"); if (nb) { var tx = o ? NT[o.value] || "" : ""; /* নির্দেশনা পাসওয়ার্ড ছাড়া সেশনেও দেখায় */ nb.textContent = tx ? "ℹ️ " + tx : ""; nb.hidden = !tx; } }
    function ck() { G.disabled = !(D.value && S.value); pwv(); }
    function sess(keep) { S.disabled = true; G.disabled = true; if (!D.value) { S.innerHTML = '<option value="">আগে বিভাগ বাছুন</option>'; return; } S.innerHTML = '<option value="">⏳…</option>';
      var sq = "mc2_ac_sessions?select=id,name&dept_id=eq." + D.value + "&order=sort,name"; api(sq.replace("id,name", "id,name,has_pw,pw_note")).catch(function () { return api(sq.replace("id,name", "id,name,has_pw")); }).catch(function () { return api(sq); }).then(function (L) { HP = {}; NT = {}; L.forEach(function (s) { HP[s.id] = !!s.has_pw; NT[s.id] = s.pw_note || ""; }); S.innerHTML = '<option value="">সেশন বাছুন</option>' + L.map(function (s) { return '<option value="' + s.id + '"' + (String(s.id) === String(keep) ? " selected" : "") + ">" + (s.has_pw ? "🔒 " : "") + esc(s.name) + "</option>"; }).join(""); S.disabled = false; if (!L.length) S.innerHTML = '<option value="">এই বিভাগে এখনো সেশন নেই</option>'; ck(); }).catch(function () { S.innerHTML = '<option value="">লোড হয়নি</option>'; }); }
    api("mc2_ac_depts?select=id,name&order=sort,name").then(function (L) {
      D.innerHTML = '<option value="">বিভাগ বাছুন</option>' + L.map(function (d) { return '<option value="' + d.id + '"' + (String(d.id) === String(P.d) ? " selected" : "") + ">" + esc(d.name) + "</option>"; }).join("");
      if (!L.length) D.innerHTML = '<option value="">এখনো কোনো বিভাগ চালু নেই</option>'; else if (D.value) sess(P.s);
    }).catch(function () { D.innerHTML = '<option value="">লোড হয়নি — নেটওয়ার্ক বা SQL দেখুন</option>'; });
    D.onchange = function () { sess(); }; S.onchange = ck;
    G.onclick = function () {
      if (!HP[S.value]) return enter();
      G.disabled = true; var pw = $("#acPw").value;
      rpc("mc2_ac_join", { p_session: +S.value, p_voter: vid(), p_pw: pw }).then(function (r) {
        G.disabled = false;
        if (r === 1) return enter();
        $("#acPwL").hidden = false; $("#acPw").focus();
        toast0(r === 2 ? "এই চ্যাটে ঢুকতে পাসওয়ার্ড লাগবে।" : r === -2 ? "পাসওয়ার্ড ভুল হয়েছে।" : r === -4 ? "অনেকবার চেষ্টা করেছেন — কিছুক্ষণ পরে আবার চেষ্টা করুন।" : r === 0 ? "এই সেশনের চ্যাট এখন বন্ধ।" : "ঢোকা যায়নি।");
      }).catch(function () { G.disabled = false; toast0("যাচাই করা যায়নি — নেটওয়ার্ক বা SQL (supabase-moderation.sql) দেখুন।"); });
    };
    function toast0(t) { var e = $("#acGm"); if (!e) { e = document.createElement("div"); e.id = "acGm"; e.style.cssText = "font-size:13px;color:#d93025;font-weight:700;text-align:center"; G.parentNode.insertBefore(e, G); } e.textContent = t; }
    function enter() { var n = P.n || ($("#acN") ? $("#acN").value.trim().slice(0, 20) : "") || "বেনামি"; CUR = { d: D.value, s: S.value, n: n, dn: D.options[D.selectedIndex].text, sn: S.options[S.selectedIndex].text.replace(/^🔒 /, "") }; LS.set("mc2_ac_p", { d: CUR.d, s: CUR.s, n: n, dn: CUR.dn, sn: CUR.sn }); if (window.mcPresencePing) window.mcPresencePing(); room(); };
  }

  // ---------- বার্তা আঁকা ----------
  // রিপ্লাই: বাবলের ওপরে "↩ আপনি X-কে রিপ্লাই দিয়েছেন" লেখা + ধূসর কোটেশন বাবল (Messenger ধাঁচ)
  function rqx(m, own, nick) {
    if (!m.reply_to) return "";
    var o = find(m.reply_to), ox = o ? MET[o.id] || {} : {}, of = o && isF(o) && !o.deleted && !ox.d, gen = !o && /^📎/.test(m.reply_text || ""), rn = esc(m.reply_nick || "একজন");
    return '<div class="rl2">↩ ' + (own ? "আপনি " + rn + "-কে রিপ্লাই দিয়েছেন" : esc(nick) + " " + rn + "-কে রিপ্লাই দিয়েছেন") + '</div><div class="rqb" data-bb>' + (of ? '<span class="rqf">' + thumb(o) + "<span>" + esc(o.body || lab(o)) + "</span></span>" : gen ? '<span class="rqf"><span class="pt">📎</span><span>ফাইল</span></span>' : esc(m.reply_text || "")) + "</div>";
  }
  function body(m) {
    var h = "", u = m.file_path ? furl(m.file_path) : "";


    if (m.kind === "image" && u) h += '<img class="th" data-fv src="' + u + '" alt="' + esc(m.file_name) + '" loading="lazy">';
    else if (m.kind === "video" && u) h += '<div class="vt" data-fv><video src="' + u + '#t=0.1" preload="metadata" muted playsinline></video><span>▶</span></div>';
    else if (m.kind === "audio" && u) h += '<div class="fc" data-fv><span style="font-size:26px">🎵</span><span>অডিও<small>' + (m.file_size ? sz(m.file_size) : "") + "</small></span></div>";
    else if (m.kind === "file" && u) h += '<div class="fc" data-fv><span style="font-size:26px">📄</span><span>' + esc(m.file_name || "ফাইল") + "<small>" + (m.file_size ? sz(m.file_size) : "") + "</small></span></div>";
    if (m.file_expired && !u) h += '<div style="opacity:.65;font-size:13px">⌛ ফাইলের মেয়াদ শেষ (' + esc(m.file_name || "ফাইল") + ")</div>";
    return h + (m.body ? (h ? '<div style="margin-top:4px">' : "<div>") + esc(m.body) + "</div>" : "");
  }
  function bub(m, prev) {
    var x = MET[m.id] || {}, own = !!x.o, nick = x.n || m.nick, nm = "";
    if (!own && (!prev || prev.own || prev.nick !== nick)) nm = '<div class="nm uc" data-uc="' + esc(x.u || "") + '">' + (x.a ? '<span class="dot on"></span> ' : "") + esc(nick) + "</div>";
    var rx = "", r = x.r || {}, ks = Object.keys(r).filter(function (e) { return r[e] > 0; }).sort(function (a, b) { return r[b] - r[a]; }), tot = ks.reduce(function (n, e) { return n + r[e]; }, 0);
    if (tot) rx = '<button type="button" data-rxs aria-label="কে কী রিঅ্যাকশন দিয়েছে দেখুন"' + (x.m ? ' class="on"' : "") + ">" + ks.slice(0, 3).map(esc).join("") + (tot > 1 ? "<i>" + bd(tot) + "</i>" : "") + "</button>";
    return nm + '<div class="r' + (own ? " mine" : "") + (SEL === m.id ? " sel" : "") + '" data-id="' + m.id + '">' + (own ? "" : '<span class="av uc" data-uc="' + esc(x.u || "") + '">' + esc(Array.from(nick)[0] || "?") + "</span>") +
      '<div class="col">' + (x.d || m.deleted ? "" : rqx(m, own, nick)) + '<div class="bw">' + (x.d || m.deleted ? '<div class="bb dl">' + (m.mod_removed ? "🛡️ অ্যাডমিন এই বার্তাটি সরিয়েছেন" : "🚫 বার্তা মুছে ফেলা হয়েছে") + "</div>" : '<div class="bb' + (!m.body && !m.reply_to && m.file_path && (m.kind === "image" || m.kind === "video") ? " mm" : "") + emc(m) + '" data-bb>' + body(m) + '<span class="tm">' + tm(m.created_at) + "</span></div>") +
      (rx ? '<div class="rxs">' + rx + "</div>" : "") + "</div>" + (own && !(x.d || m.deleted) ? '<button class="sn" type="button" data-seen>' + (x.s > 0 ? "👁 দেখেছে " + bd(x.s) : "✓ পাঠানো হয়েছে") + "</button>" : "") + '</div><button class="mo" type="button" data-menu aria-label="আরও">⋯</button></div>';
  }
  function render(force, mode, keep) {
    var M = $("#acM"); if (!M) return; var hide = LS.get("mc2_ac_hide", []);
    var sig = MSGS.length + ":" + (MSGS.length ? MSGS[MSGS.length - 1].id : 0) + ":" + MORE + ":" + UP + ":" + hide.length + ":" + EVS.length + ":" + (EVS.length ? EVS[EVS.length - 1].id : 0) + ":" + JSON.stringify(MET);
    if (!force && sig === SIG) return;
    if (!force && TCH && Date.now() - TCH < 8000) return; // আঙুল ঠেকানো অবস্থায় আঁকা বন্ধ (সোয়াইপ-রিপ্লাই ভাঙত)
    if ([].some.call(M.querySelectorAll("video,audio"), function (e) { return !e.paused; })) return; // চলার সময় আঁকা বন্ধ
    SIG = sig; var near = M.scrollHeight - M.scrollTop - M.clientHeight < 90, ph = M.scrollHeight, pt = M.scrollTop, prev = null, h = MORE && MSGS.length ? '<button class="old" id="acHi" type="button">⬆ আগের বার্তা দেখুন</button>' : "";
    var items = MSGS.map(function (m) { return { t: Date.parse(m.created_at), m: m }; }).concat(EVS.map(function (e) { return { t: e.t, e: e }; })).sort(function (a, b) { return a.t - b.t; });
    items.forEach(function (it) {
      if (it.e) { h += '<div class="sy">' + (it.e.k === "join" ? "➕ " : "➖ ") + "<b>" + esc(it.e.n) + "</b> " + (it.e.k === "join" ? "চ্যাটে যোগ দিয়েছে" : "চ্যাট ছেড়েছে") + " · " + tm(it.e.t) + "</div>"; prev = null; return; }
      var m = it.m; if (hide.indexOf(m.id) >= 0) return; h += bub(m, prev); var o = (MET[m.id] || {}); prev = { own: !!o.o, nick: o.n || m.nick };
    });
    M.innerHTML = h || '<div class="em">এখনো কেউ কিছু লেখেনি।<br>প্রথম বার্তাটা আপনিই পাঠান 👋</div>';
    if (mode === "old") M.scrollTop = M.scrollHeight - ph + pt; else if (near || force === "bottom") M.scrollTop = M.scrollHeight;
    applyLock();
  }
  // ---------- মেসেঞ্জারের মতো: ⬇ ভাসমান বাটন + ওপরে স্ক্রল করলে আগের বার্তা নিজে আসা (দেরি হলে ক্লিক করে আনা) ----------
  var OLDBUSY = 0;
  function oldBtn(t, dis) { var b = $("#acHi"); if (b) { b.textContent = t; b.disabled = dis; } }
  function loadOld(force) {
    if (!MORE || !MSGS.length || !CUR) return Promise.resolve();
    if (OLDBUSY && !force) return Promise.resolve();
    OLDBUSY = Date.now(); oldBtn("⏳ আগের বার্তা আসছে…", true);
    var tt = setTimeout(function () { oldBtn("⬆ আসতে দেরি হচ্ছে — এখানে ট্যাপ করে আনুন", false); }, 2500);
    return load("old").then(function () { clearTimeout(tt); OLDBUSY = 0; }, function () { clearTimeout(tt); OLDBUSY = 0; });
  }
  function bindScroll() {
    var M = $("#acM"), X = $("#acx"); if (!M || !X) return;
    if (!document.getElementById("acJdS")) { var sx = document.createElement("style"); sx.id = "acJdS"; sx.textContent = "#acx .jd{position:absolute;right:14px;z-index:5;width:38px;height:38px;border-radius:50%;border:1px solid rgba(128,128,128,.4);background:var(--bg);color:inherit;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);padding:0;display:grid;place-items:center;opacity:.95}#acx .jd:active{transform:scale(.94)}"; document.head.appendChild(sx); }
    var jb = $("#acJd"); if (jb) jb.remove();
    jb = document.createElement("button"); jb.id = "acJd"; jb.className = "jd"; jb.type = "button"; jb.hidden = true; jb.textContent = "⬇"; jb.setAttribute("aria-label", "সর্বশেষ বার্তায় যান"); X.appendChild(jb);
    var upd = function () {
      if (!jb.isConnected) return; var gap = M.scrollHeight - M.scrollTop - M.clientHeight;
      jb.hidden = gap < Math.max(300, M.clientHeight); // এক পেজ ওপরে গেলে দেখা যায়, নিচে এলে চলে যায়
      if (!jb.hidden) { var r = M.getBoundingClientRect(), xr = X.getBoundingClientRect(); jb.style.bottom = Math.max(8, xr.bottom - r.bottom + 10) + "px"; }
      if (M.scrollTop < 120 && MORE && MSGS.length && !OLDBUSY && M.scrollHeight > M.clientHeight) loadOld(false); // ওপরে পৌঁছালে আগের বার্তা নিজে আসে
    };
    M.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd);
    jb.onclick = function () { M.scrollTo({ top: M.scrollHeight, behavior: "smooth" }); };
  }
  function load(mode) {
    var q = "mc2_ac_messages?select=id,nick,body,created_at,reply_to,reply_nick,reply_text,kind,file_path,file_name,file_size,file_mime,deleted" + (NOMR ? "" : ",mod_removed,file_expired") + "&session_id=eq." + CUR.s, first = MSGS.length ? MSGS[0].id : 0, last = MSGS.length ? MSGS[MSGS.length - 1].id : 0;
    q += mode === "new" ? "&id=gt." + last + "&order=id.asc&limit=100" : mode === "old" ? "&id=lt." + first + "&order=id.desc&limit=40" : "&order=id.desc&limit=40";
    return api(q).then(function (L) {
      if (mode !== "new") { L.reverse(); MORE = L.length >= (mode === "old" ? 40 : 40); }
      if (mode === "old") { var hv = {}; MSGS.forEach(function (m) { hv[m.id] = 1; }); MSGS = L.filter(function (m) { return !hv[m.id]; }).concat(MSGS); } else if (mode === "new") { var have = {}; MSGS.forEach(function (m) { have[m.id] = 1; }); MSGS = MSGS.concat(L.filter(function (m) { return !have[m.id]; })); } else MSGS = L;
      // নতুন মেসেজ আগে সঙ্গে সঙ্গে আঁকে (রিঅ্যাকশন/মেটা পরে বসে); নিজের পাঠানো মেসেজ SENT দিয়ে আগেই "আমার" চেনা যায়
      if (mode === "new" && L.length) { L.forEach(function (m) { if (!MET[m.id]) MET[m.id] = SENT[m.id] ? { o: 1 } : {}; }); render(false, mode); pill(); }
      return rpc("mc2_ac_meta", { p_session: +CUR.s, p_min: MSGS.length ? MSGS[0].id : 0, p_voter: vid() }).then(function (r) { UP = r.up !== false; ONL = r.on || 0; ME = r.me || { s: "ok", w: [] }; applyMe(); subt(); MET = {}; (r.rows || []).forEach(function (x) { MET[x.id] = x; }); if (r.rows) { var cap = r.rows.length >= 500, lo = r.rows.length ? Math.min.apply(null, r.rows.map(function (x) { return x.id; })) : 0; MSGS = MSGS.filter(function (m) { return (cap && m.id < lo) || !!MET[m.id]; }); } }).catch(function () {});
    }).then(function () {
      render(mode === "first" ? "bottom" : mode === "old", mode); pill();
      var l = MSGS.length ? MSGS[MSGS.length - 1].id : 0; if (l > LASTSEEN && !document.hidden && !MINZ) { LASTSEEN = l; rpc("mc2_ac_seen", { p_session: +CUR.s, p_voter: vid(), p_nick: CUR.n, p_last: l }).catch(function () {}); }
    }).catch(function () { if (!NOMR) { NOMR = true; return load(mode); } if (mode === "first") { var M = $("#acM"); if (M) M.innerHTML = '<div class="em">বার্তা লোড হয়নি — নেটওয়ার্ক বা SQL দেখুন।</div>'; } });
  }

  // ---------- মেনু / অ্যাকশন ----------
  function sheet(id, own) {
    var m = MSGS.filter(function (x) { return x.id === id; })[0]; if (!m) return; var x = MET[id] || {}, dead = x.d || m.deleted, mine = !!x.o || own, fresh = Date.now() - new Date(m.created_at).getTime() < 300000;
    var S = document.createElement("div"); S.className = "sh0"; S.id = "acSh";
    S.innerHTML = '<div class="sh">' + (dead ? "" : '<div class="rb">' + RX.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + "</button>"; }).join("") + '<button type="button" class="mr" data-more aria-label="আরও ইমোজি">➕</button></div>' + '<button type="button" data-do="reply">↩️ উত্তর দিন (Reply)</button>' + (m.body ? '<button type="button" data-do="copy">📋 কপি করুন</button>' : "") + (mine ? '<button type="button" data-do="seen">👁 কারা দেখেছে (Seen)</button>' : "") + (!mine ? '<button class="dg" type="button" data-do="report">🚩 রিপোর্ট করুন</button>' : "")) +
      (mine && !dead && fresh ? '<button class="dg" type="button" data-do="unsend">🗑 সবার জন্য মুছুন (৫ মিনিটের মধ্যে)</button>' : "") + '<button class="dg" type="button" data-do="me">🗑 আমার জন্য মুছুন</button><button type="button" data-do="x">বন্ধ করুন</button></div>';
    $("#acx").appendChild(S);
    S.onclick = function (e) {
      var b = e.target.closest("button"), cl = function () { S.remove(); };
      if (!b) return cl();
      if (b.dataset.e) { cl(); return react(id, b.dataset.e); }
      if ("more" in b.dataset) { cl(); return emoPick(function (em) { react(id, em); }); }
      var d = b.dataset.do; cl();
      if (d === "reply") setReply(id);
      else if (d === "report") report(id, m, x);
      else if (d === "copy") { try { navigator.clipboard.writeText(m.body); toast("কপি হয়েছে।"); } catch (er) { toast("কপি হয়নি।"); } }
      else if (d === "seen") rpc("mc2_ac_seenlist", { p_msg: id }).then(function (L) { var Z = document.createElement("div"); Z.className = "sh0"; Z.innerHTML = '<div class="sh"><b>👁 যারা দেখেছে (' + bd(L.length) + ")</b>" + (L.length ? L.map(function (n) { return "<div>• " + esc(n) + "</div>"; }).join("") : "<div>এখনো কেউ দেখেনি।</div>") + '<button type="button">বন্ধ করুন</button></div>'; Z.onclick = function () { Z.remove(); }; $("#acx").appendChild(Z); }).catch(function () { toast("লোড হয়নি।"); });
      else if (d === "unsend") { if (confirm("সবার জন্য মুছে ফেলবেন?")) rpc("mc2_ac_unsend", { p_msg: id, p_voter: vid() }).then(function (ok) { toast(ok ? "সবার জন্য মুছে গেছে।" : "৫ মিনিট পেরিয়ে গেছে — এখন শুধু নিজের জন্য মোছা যাবে।"); if (ok) rtNudge(); load("new"); }).catch(function () { toast("মোছা যায়নি।"); }); }
      else if (d === "me") { var k = LS.get("mc2_ac_hide", []); k.push(id); LS.set("mc2_ac_hide", k.slice(-1000)); render(true); }
    };
  }
  function selClear() { SEL = 0; var M = $("#acM"); if (M) [].forEach.call(M.querySelectorAll(".r.sel"), function (r) { r.classList.remove("sel"); }); }
  function showReply() { var p = $("#acRp"); if (!p) return; p.hidden = !REPLY; if (REPLY) p.querySelector("span").innerHTML = (REPLY.f ? thumb(REPLY.f) : "") + "<i><b>↩️ " + esc(REPLY.nick) + "</b><br>" + esc(REPLY.text) + "</i>"; }

  // হেডার: ১ম লাইনে গ্রুপের নাম (যতটা বড় হয়, এক লাইনে ধরে), ২য় লাইনে শুধু চ্যাটকারীর নাম, ৩য় লাইনে ক্লিকযোগ্য "🟢 N জন অনলাইন"
  function subt() { if (!CUR) return; var n = $("#acNm"), o = $("#acOl"); if (n) n.textContent = CUR.n; if (o) { o.hidden = !ONL; o.textContent = ONL ? "🟢 " + bd(ONL) + " জন অনলাইন" : ""; } }
  function fit() { var e = $("#acGn"); if (!e) return; var z = 24; e.style.fontSize = z + "px"; while (e.scrollWidth > e.clientWidth && z > 10) { z--; e.style.fontSize = z + "px"; } }
  window.addEventListener("resize", fit);
  // শুধু ইমোজির বার্তা: ১টা = বড় (e1), ২+ = ছোট (e2), বাবল ছাড়া। স্কিন-টোন/ZWJ জোড়া ১টা ইমোজি। (Extended_Pictographic)
  var EMO = null; try { var ep = "\\p{Extended_Pictographic}(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])*"; EMO = new RegExp(ep + "(?:\\u200D" + ep + ")*", "gu"); } catch (e) {}
  function emc(m) {
    if (!EMO || !m.body || m.reply_to || m.file_path) return ""; var t = String(m.body).replace(/\s+/g, ""); if (!t) return "";
    var k = t.match(EMO); if (!k || k.join("") !== t) return ""; return k.length === 1 ? " e1" : " e2";
  }
  function pop(h) { var Z = document.createElement("div"); Z.className = "sh0"; Z.innerHTML = '<div class="sh">' + h + '<button type="button" data-x>বন্ধ করুন</button></div>'; Z.onclick = function (e) { if (e.target.closest("[data-uc]")) { var u = e.target.closest("[data-uc]").dataset.uc; Z.remove(); return card(u); } if (e.target === Z || e.target.closest("[data-x]")) Z.remove(); }; $("#acx").appendChild(Z); }
  // নাম ক্লিক: ইউজার কার্ড (শুধু নাম, আইডি, বিভাগ, সেশন, স্কোর, অনলাইন, Last Active; আইপি/ডিভাইস/ফোন অ্যাডমিন ছাড়া কেউ দেখে না)
  function card(u) {
    if (!u) return toast("এই ইউজারের তথ্য নেই।");
    rpc("mc2_ac_usercard", { p_session: +CUR.s, p_uid: u }).then(function (c) {
      if (!c) return toast("তথ্য পাওয়া যায়নি।");
      pop('<div style="text-align:center;padding:6px"><span class="av" style="width:56px;height:56px;font-size:24px;margin:0 auto 6px">' + esc(Array.from(c.n)[0] || "?") + '</span><b style="font-size:17px">' + esc(c.n) + '</b></div><div class="ui"><b>ইউজার আইডি</b><span>' + esc(c.u) + '</span><b>বিভাগ</b><span>' + esc(c.dept || "—") + '</span><b>সেশন</b><span>' + esc(c.sess || "—") + '</span><b>স্কোর</b><span>' + (c.best != null ? bd(c.best) + " / ১০০০ (" + bd(c.plays) + " বার খেলেছে)" : "এখনো খেলেনি") + '</span><b>স্ট্যাটাস</b><span>' + (c.onl ? '<span class="dot on"></span> অনলাইন' : '<span class="dot"></span> অফলাইন') + '</span><b>Last Active</b><span>' + (c.onl ? "এখন" : ago(c.ls)) + '</span><b>বার্তা</b><span>' + bd(c.msgs || 0) + 'টি</span></div>');
    }).catch(function () { toast("লোড হয়নি — SQL (supabase-userinfo.sql) চালানো আছে কি?"); });
  }
  function members() {
    rpc("mc2_ac_members", { p_session: +CUR.s }).then(function (L) {
      var me = ""; Object.keys(MET).forEach(function (k) { if (MET[k].o && MET[k].u) me = MET[k].u; });
      pop('<b>👥 User Info — ' + esc(CUR.sn) + ' (' + bd(L.length) + ' জন)</b>' + (L.length ? L.map(function (m) { return '<button type="button" class="ml" data-uc="' + esc(m.u) + '"><span class="dot' + (m.onl ? " on" : "") + '"></span><span>' + esc(m.n) + (m.u === me ? " (আপনি)" : "") + '</span><small>' + (m.onl ? "অনলাইন" : ago(m.ls)) + "</small></button>"; }).join("") : "<div>এখনো কেউ নেই।</div>") + '<div style="font-size:12px;opacity:.65">নামে ক্লিক করলে বিস্তারিত দেখাবে।</div>');
    }).catch(function () { toast("লোড হয়নি — SQL (supabase-userinfo.sql) চালানো আছে কি?"); });
  }
  function room() {
    var R = root(); MSGS = []; MET = {}; REPLY = null; SIG = ""; SEL = 0; RXID = 0; if (RXOFF) { RXOFF(); RXOFF = null; } EVS = []; EVLAST = -1; TYP = 0; LB = false; clearInterval(LV); MORE = true; LASTSEEN = 0;
    R.innerHTML = head('<span class="gn" id="acGn">' + esc(CUR.dn) + (CUR.sn ? " (" + esc(CUR.sn) + ")" : "") + '</span>', '<span class="nl" id="acNm"></span><button class="ol" id="acOl" type="button" hidden aria-label="সদস্যদের তালিকা"></button>', true, '<button class="ab" id="acIn" type="button" aria-label="User Info">👥</button><button class="ab" id="acEd" type="button" aria-label="নাম বদলান">✎</button><button class="ab" id="acMn" type="button" aria-label="মিনিমাইজ" style="font-weight:800">—</button><button class="ab" id="acCl" type="button" aria-label="চ্যাট বন্ধ করুন">✕</button>', "rh") + '<div class="am" id="acM"><div class="em">⏳ লোড হচ্ছে…</div></div><div class="ty" id="acTy" hidden></div><div class="rp" id="acRp" hidden><span></span><button class="ab" id="acRx" type="button" aria-label="রিপ্লাই বাতিল">✕</button></div><div class="ep" id="acEm" hidden>' + emoHtml() + '</div><div class="bn" id="acBn" hidden></div><div class="ac"><button class="ib" id="acAt" type="button" aria-label="ফাইল পাঠান">📎</button><button class="ib" id="acEb" type="button" aria-label="ইমোজি">😊</button><input id="acI" maxlength="400" placeholder="বার্তা লিখুন…" aria-label="বার্তা" autocomplete="off"><button class="ib" id="acSd" type="button" aria-label="পাঠান" style="font-size:24px">➤</button><input type="file" id="acFl" hidden accept="' + ACCEPT + '"></div><div id="acT"></div>';
    var sub = subt; sub(); $("#acIn").onclick = members; $("#acOl").onclick = members; fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    $("#acB").onclick = function () { if (!confirm("আপনি কি চ্যাট থেকে বের হতে চান?")) return; unjoin(); leaveRoom(); gate(); };
    $("#acMn").onclick = minimize;
    $("#acCl").onclick = function () { if (!confirm("চ্যাট বন্ধ করতে চান?")) return; location.hash = PH && PH !== "anon" ? PH : "home"; };
    $("#acI").oninput = function () { if (this.value.trim()) { TYP = Date.now(); if (Date.now() - LT > 1500) live(); } };
    $("#acEd").onclick = function () {
      var Z = document.createElement("div"); Z.className = "sh0";
      Z.innerHTML = '<div class="sh"><b>✎ আপনার নাম বদলান</b><div class="sm2">শুধু নিজের নামই বদলানো যায়। আপনার আগের বার্তাতেও নতুন নাম দেখাবে।</div><input id="acNn" type="text" maxlength="20" value="' + esc(CUR.n) + '" aria-label="নতুন নাম"><button type="button" data-ok>✅ সেভ করুন</button><button type="button" data-x>বাতিল</button></div>';
      var go = function () { var n = ($("#acNn").value || "").trim().slice(0, 20); if (!n) return toast("নাম খালি রাখা যাবে না।"); Z.remove(); if (n === CUR.n) return; CUR.n = n; var P = LS.get("mc2_ac_p", {}); P.n = n; LS.set("mc2_ac_p", P); sub(); rpc("mc2_ac_rename", { p_voter: vid(), p_nick: n }).then(function () { load("new"); toast("নাম বদলেছে।"); }).catch(function () { toast("নাম বদলানো যায়নি।"); }); };
      Z.onclick = function (e) { if (e.target.closest("[data-ok]")) go(); else if (e.target === Z || e.target.closest("[data-x]")) Z.remove(); };
      Z.onkeydown = function (e) { if (e.key === "Enter") go(); }; $("#acx").appendChild(Z); $("#acNn").focus(); $("#acNn").select();
    };
    $("#acRx").onclick = function () { REPLY = null; showReply(); };
    $("#acEb").onclick = function () { var e = $("#acEm"); e.hidden = !e.hidden; };
    $("#acEm").onclick = function (e) { var t = e.target.closest("[data-ec]"); if (t) { EMI = +t.dataset.ec; this.innerHTML = emoHtml(); return; } var b = e.target.closest("[data-em]"); if (b) { var i = $("#acI"); i.value += b.dataset.em; i.focus(); this.hidden = true; } };
    $("#acx").onclick = function (e) { var em = $("#acEm"); if (!em || em.hidden) return; var pth = e.composedPath ? e.composedPath() : []; if (pth.indexOf(em) < 0 && pth.indexOf($("#acEb")) < 0) em.hidden = true; };
    $("#acAt").onclick = function () { if (lockOn()) return toast("আপনি এখন ফাইল পাঠাতে পারবেন না।"); if (!UP) return toast("ফাইল আপলোড এখন বন্ধ আছে।"); $("#acFl").click(); };
    applyLock();
    $("#acFl").onchange = function () { var f = this.files[0]; this.value = ""; if (f) preview(f); };
    $("#acSd").onclick = send; $("#acI").onkeydown = function (e) { if (e.key === "Enter") send(); };
    bindScroll();
    $("#acM").onclick = function (e) {
      if (e.target.id === "acHi") return loadOld(true);
      var uc = e.target.closest("[data-uc]"); if (uc) return card(uc.dataset.uc);
      var row = e.target.closest("[data-id]"); if (!row) { selClear(); return; } var id = +row.dataset.id;
      if (e.target.closest("[data-seen]")) return rpc("mc2_ac_seenlist", { p_msg: id }).then(function (L) { var Z = document.createElement("div"); Z.className = "sh0"; Z.innerHTML = '<div class="sh"><b>👁 যারা দেখেছে (' + bd(L.length) + ")</b>" + (L.length ? L.map(function (n) { return "<div>• " + esc(n) + "</div>"; }).join("") : "<div>এখনো কেউ দেখেনি।</div>") + '<button type="button">বন্ধ করুন</button></div>'; Z.onclick = function () { Z.remove(); }; $("#acx").appendChild(Z); });
      if (e.target.closest("[data-rxs]")) return rxpop(id, e.target.closest("[data-rxs]"));
      if (e.target.closest("[data-fv]")) return viewer(id);
      if (e.target.closest("[data-menu]")) { selClear(); return sheet(id); }
      if (e.target.closest("[data-bb]") && !e.target.closest("a,video,audio")) { rxclose(); var was = SEL === id; selClear(); if (!was) { SEL = id; row.classList.add("sel"); } }
    };
    (function () { // বাঁ↔ডান swipe = রিপ্লাই (আঙুলের সাথে বাবল সরে; বারবার কাজ করে)
      var sx = 0, sy = 0, sr = null, tg = null, mv = false, MM = $("#acM");
      function clean() { if (tg) { tg.removeEventListener("touchend", done); tg.removeEventListener("touchcancel", done); tg.removeEventListener("touchmove", move); } tg = null; }
      function move(e) { if (!sr || !e.touches[0]) return; var dx = e.touches[0].clientX - sx, dy = Math.abs(e.touches[0].clientY - sy); if (!mv && Math.abs(dx) > 10 && Math.abs(dx) > dy * 1.5) mv = true; if (mv) sr.style.transform = "translateX(" + Math.max(-70, Math.min(70, dx * 0.6)) + "px)"; }
      function done(e) { var r = sr; clean(); sr = null; TCH = 0; if (!r) return; r.style.transform = ""; var t = (e.changedTouches || [])[0]; if (e.type !== "touchend" || !t) return; var dx = t.clientX - sx, dy = Math.abs(t.clientY - sy); if (Math.abs(dx) > 60 && dy < 40) setReply(+r.dataset.id); }
      MM.addEventListener("touchstart", function (e) { clean(); if (sr) { sr.style.transform = ""; } var r = e.target.closest("[data-id]"); if (!r || e.touches.length !== 1) { sr = null; TCH = 0; return; } sr = r; mv = false; TCH = Date.now(); sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        // আঁকার সময় এলিমেন্ট DOM থেকে সরলেও যেন touchend ধরা পড়ে, তাই টার্গেটে সরাসরি বসানো
        tg = e.target; tg.addEventListener("touchend", done); tg.addEventListener("touchcancel", done); tg.addEventListener("touchmove", move, { passive: true }); }, { passive: true }); })();
    var tk = 0; rpc("mc2_ac_tick", {}).catch(function () {}); live(); rtStart(+CUR.s); LV = setInterval(function () { if (!$("#acM")) return clearInterval(LV); if (!document.hidden) { if (RT.ok && ++RT.lt % 3) return; live(); } }, 2000);
    load("first"); clearInterval(iv); iv = setInterval(function () { if (!$("#acM")) return clearInterval(iv); if (!document.hidden) { if (++tk % 15 === 0) rpc("mc2_ac_tick", {}).catch(function () {}); if (RT.ok && ++RT.mt % 4) return; load("new"); } }, 4000);
  }

  function sent(r) {
    if (r > 0) { SENT[r] = 1; rtNudge(); var i = $("#acI"); if (i) i.value = ""; REPLY = null; showReply(); return load("new").then(function () { var M = $("#acM"); if (M) M.scrollTop = M.scrollHeight; }); }
    if (r === -3) load("new");
    toast(r === 0 ? "এই সেশনের চ্যাট এখন বন্ধ।" : r === -6 ? "এই চ্যাটের পাসওয়ার্ড বদলেছে — বের হয়ে আবার পাসওয়ার্ড দিয়ে ঢুকুন।" : r === -1 ? "বার্তাটি পাঠানো যায়নি — লেখা ঠিক আছে কিনা দেখুন (লিংক সর্বোচ্চ ৩টি)।" : r === -2 ? "ফাইল আপলোড এখন বন্ধ আছে।" : r === -3 ? "আপনি এখন বার্তা পাঠাতে পারবেন না।" : r === -5 ? "এই ফাইল পাঠানো যায় না (ধরন বা সাইজ অনুমোদিত নয়)।" : "খুব দ্রুত বা বারবার পাঠাচ্ছেন — একটু থামুন।");
  }
  function send() {
    var i = $("#acI"), t = i.value.trim(); if (!t || BUSY) return; BUSY = true; TYP = 0;
    rpc("mc2_ac_send", { p_session: +CUR.s, p_nick: CUR.n, p_body: t, p_voter: vid(), p_reply: REPLY ? REPLY.id : null }).then(sent).catch(function () { toast("পাঠানো যায়নি — নেটওয়ার্ক দেখুন।"); }).then(function () { BUSY = false; });
  }
  function ftype(f) { var e = (String(f.name).split(".").pop() || "").toLowerCase(), t = Object.prototype.hasOwnProperty.call(FT, e) ? FT[e] : null; return t ? { ext: e, kind: t[0], mime: t[1], max: t[2] * 1048576, mb: t[2] } : null; }
  // ফাইলের প্রথম বাইট দেখে নামের সাথে ভেতরের ধরন মেলে কিনা (ভুল/নকল এক্সটেনশন ধরার জন্য; আসল সুরক্ষা সার্ভারে)
  function sniff(f, e) {
    var rd = f.slice(0, 16), p = rd.arrayBuffer ? rd.arrayBuffer() : new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsArrayBuffer(rd); });
    return p.then(function (ab) {
      var b = new Uint8Array(ab), s = function (o, t) { for (var i = 0; i < t.length; i++) if (b[o + i] !== t.charCodeAt(i)) return false; return true; };
      if (e === "jpg" || e === "jpeg") return b[0] === 255 && b[1] === 216 && b[2] === 255;
      if (e === "png") return b[0] === 137 && s(1, "PNG");
      if (e === "gif") return s(0, "GIF8");
      if (e === "webp") return s(0, "RIFF") && s(8, "WEBP");
      if (e === "wav") return s(0, "RIFF") && s(8, "WAVE");
      if (e === "pdf") return s(0, "%PDF");
      if (e === "mp4" || e === "mov" || e === "m4a") return s(4, "ftyp") || s(4, "moov") || s(4, "mdat") || s(4, "wide") || s(4, "free");
      if (e === "webm") return b[0] === 26 && b[1] === 69 && b[2] === 223 && b[3] === 163;
      if (e === "mp3") return s(0, "ID3") || (b[0] === 255 && (b[1] & 224) === 224);
      if (e === "aac") return b[0] === 255 && (b[1] & 240) === 240;
      if (e === "ogg") return s(0, "OggS");
      if (e === "docx" || e === "xlsx" || e === "pptx") return b[0] === 80 && b[1] === 75;
      if (e === "doc" || e === "xls" || e === "ppt") return b[0] === 208 && b[1] === 207 && b[2] === 17 && b[3] === 224;
      if (e === "txt" || e === "csv") return [].indexOf.call(b, 0) < 0;
      return true;
    }).catch(function () { return true; });
  }
  // পাঠানোর আগে ফাইলের Preview
  function preview(f) {
    var t = ftype(f); if (!t) return sendFile(f); var u = URL.createObjectURL(f), h = '<div class="sh"><b>📎 পাঠানোর আগে দেখুন</b>';
    if (t.kind === "image") h += '<img src="' + u + '" alt="" style="max-width:100%;max-height:240px;border-radius:12px">'; else if (t.kind === "video") h += '<video src="' + u + '" controls playsinline style="max-width:100%;max-height:240px;border-radius:12px"></video>'; else if (t.kind === "audio") h += '<audio src="' + u + '" controls style="width:100%"></audio>'; else h += "<div>📄 " + esc(f.name) + "</div>";
    h += '<div class="sm2">' + esc(f.name) + " · " + bd((f.size / 1048576).toFixed(2)) + ' MB</div><button type="button" data-go>➤ পাঠান</button><button type="button" data-x>বাতিল</button></div>';
    var Z = document.createElement("div"); Z.className = "sh0"; Z.innerHTML = h; var cl = function () { try { URL.revokeObjectURL(u); } catch (er) {} Z.remove(); };
    Z.onclick = function (e) { if (e.target.closest("[data-go]")) { cl(); sendFile(f); } else if (e.target.closest("[data-x]") || e.target === Z) cl(); }; $("#acx").appendChild(Z);
  }
  function sendFile(f) {
    if (BUSY) return; if (!UP) return toast("ফাইল আপলোড এখন বন্ধ আছে।"); if (lockOn()) return toast("আপনি এখন ফাইল পাঠাতে পারবেন না।");
    var t = ftype(f); if (!t) return toast("এই ধরনের ফাইল পাঠানো যায় না। ছবি, ভিডিও, অডিও, PDF, Word/Excel/PowerPoint, TXT/CSV চলবে।");
    if (f.size < 1) return toast("ফাইলটি খালি।"); if (f.size > t.max) return toast("এই ধরনের ফাইল সর্বোচ্চ " + bd(t.mb) + " MB হতে পারে।");
    BUSY = true; toast("⏳ ফাইল যাচাই হচ্ছে…");
    sniff(f, t.ext).then(function (ok) {
      if (!ok) throw new Error("bad");
      var path = CUR.s + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + "." + t.ext; toast("⏳ আপলোড হচ্ছে…");
      return fetch(base + "/storage/v1/object/mc2-chat/" + path, { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + C.key, "Content-Type": t.mime }, body: f }).then(function (r) { if (!r.ok) throw new Error("up"); })
        .then(function () { return rpc("mc2_ac_send", { p_session: +CUR.s, p_nick: CUR.n, p_body: $("#acI").value.trim(), p_voter: vid(), p_reply: REPLY ? REPLY.id : null, p_kind: t.kind, p_path: path, p_fname: f.name, p_size: f.size, p_mime: t.mime }); }).then(sent);
    }).catch(function (e) { toast(e && e.message === "bad" ? "ফাইলের ভেতরের ধরন নামের সাথে মেলে না — পাঠানো যায়নি।" : e && e.message === "up" ? "আপলোড হয়নি (বন্ধ আছে বা ফাইল অনুমোদিত নয়)।" : "পাঠানো যায়নি — নেটওয়ার্ক দেখুন।"); }).then(function () { BUSY = false; });
  }

  // ---------- মডারেশন: নিজের স্ট্যাটাস (সতর্কতা / Restriction / Ban) ও রিপোর্ট ----------
  function lockOn() { return !!ME && ME.s !== "ok"; }
  function left(ms) { var s = Math.max(0, Math.round((ms - Date.now()) / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.ceil(s % 3600 / 60); return d ? bd(d) + " দিন " + bd(h) + " ঘণ্টা" : h ? bd(h) + " ঘণ্টা " + bd(m % 60) + " মিনিট" : bd(Math.max(1, m)) + " মিনিট"; }
  function applyLock() {
    var a = $("#acAt"), i = $("#acI"), sd = $("#acSd"), e = $("#acEb"), b = $("#acBn"), L = lockOn();
    if (a) { a.disabled = !UP || L; a.style.opacity = a.disabled ? ".35" : ""; a.title = L ? "" : !UP ? "ফাইল আপলোড এখন বন্ধ আছে" : "ফাইল পাঠান"; }
    if (i) { i.disabled = L; i.placeholder = L ? "বার্তা পাঠানো বন্ধ" : "বার্তা লিখুন…"; }
    if (sd) sd.disabled = L; if (e) e.disabled = L;
    if (b) { b.hidden = !L; if (L) b.innerHTML = (ME.s === "banned" ? (ME.u ? "⛔ আপনাকে সাময়িক ব্যান করা হয়েছে। বাকি: " + left(ME.u) : "⛔ আপনাকে স্থায়ীভাবে ব্যান করা হয়েছে।") : "⏳ আপনার বার্তা পাঠানো সাময়িক বন্ধ। বাকি: " + (ME.u ? left(ME.u) : "")) + (ME.r ? "<br>কারণ: " + esc(ME.r) : ""); }
  }
  function applyMe() {
    applyLock();
    var w = (ME.w || []).filter(function (x) { return !WSHOW[x.id]; })[0];
    if (!w || $("#acWn") || !$("#acx")) return; WSHOW[w.id] = 1;
    var Z = document.createElement("div"); Z.className = "sh0"; Z.id = "acWn";
    Z.innerHTML = '<div class="sh"><b>⚠️ অ্যাডমিনের সতর্কবার্তা</b><div>' + esc(w.r) + '</div><div class="sm2">নিয়ম ভাঙলে আপনার বার্তা পাঠানো সাময়িক বা স্থায়ীভাবে বন্ধ হতে পারে।</div><button type="button" data-ok>✅ বুঝেছি</button></div>';
    Z.onclick = function (e) { if (e.target.closest("[data-ok]")) { Z.remove(); rpc("mc2_ac_ack_warn", { p_voter: vid(), p_id: w.id }).catch(function () {}); } };
    $("#acx").appendChild(Z);
  }
  function report(id, m, x) {
    var Z = document.createElement("div"); Z.className = "sh0"; Z.id = "acRep";
    Z.innerHTML = '<div class="sh"><b>🚩 রিপোর্ট করুন — ' + esc(x.n || m.nick) + '</b><div class="sm2">কারণ বাছুন। মিথ্যা বা বারবার রিপোর্ট করলে আপনার ওপরও ব্যবস্থা হতে পারে।</div>' +
      RR.map(function (r) { return '<label class="rr"><input type="radio" name="acRr" value="' + r[0] + '"> ' + r[1] + "</label>"; }).join("") +
      '<input id="acRn" maxlength="200" placeholder="সংক্ষেপে লিখুন (ঐচ্ছিক)"><button type="button" data-go>রিপোর্ট পাঠান</button><button type="button" data-x>বাতিল</button></div>';
    Z.onclick = function (e) {
      if (e.target === Z || e.target.closest("[data-x]")) return Z.remove();
      var go = e.target.closest("[data-go]"); if (!go) return; var c = Z.querySelector("input[name=acRr]:checked"); if (!c) return toast("একটা কারণ বাছুন।"); go.disabled = true;
      rpc("mc2_ac_report", { p_msg: id, p_voter: vid(), p_reason: c.value, p_note: $("#acRn").value.trim() || null }).then(function (r) {
        Z.remove(); toast(r === 1 ? "রিপোর্ট পাঠানো হয়েছে। ধন্যবাদ।" : r === -6 ? "আপনি এই বার্তা আগেই রিপোর্ট করেছেন।" : r === -2 ? "নিজের বার্তা রিপোর্ট করা যায় না।" : r === -4 ? "অনেক রিপোর্ট করেছেন — পরে চেষ্টা করুন।" : r === -3 ? "এখন রিপোর্ট করা সম্ভব নয়।" : r === 0 ? "বার্তাটি আর নেই।" : "রিপোর্ট পাঠানো যায়নি।");
      }).catch(function () { go.disabled = false; toast("রিপোর্ট যায়নি — SQL (supabase-moderation.sql) চালানো আছে কি?"); });
    };
    $("#acx").appendChild(Z);
  }

  // ---------- লাইভ: টাইপিং, Join/Leave (supabase-live-board.sql) ----------
  function typing() { var i = $("#acI"); return !!i && !i.disabled && Date.now() - TYP < 3500 && i.value.trim() !== ""; }
  // ===== Realtime "নাড়া" (২০২৬-১০-২২) — মেসেজ সঙ্গে সঙ্গে দেখাতে =====
  // কেউ মেসেজ পাঠালে/রিঅ্যাক্ট/মুছলে ঘরের সবাইকে খুব ছোট একটা সংকেত (বিষয়বস্তু ছাড়া) যায়; সবাই সঙ্গে সঙ্গে আগের নিয়মে (load) নতুন মেসেজ আনে।
  // তাই পাসওয়ার্ড/ব্যান/লুকানো মেসেজের নিয়ম আগের মতোই সার্ভারে থাকে। ওয়েবসকেট না চললে (RT.ok=false) আগের ২/৪ সেকেন্ডের পোলিংই চলে।
  var RT = { ws: null, ok: false, topic: "", sid: 0, hb: null, rc: null, ref: 0, tries: 0, last: 0, pend: null, busy: false, send: null, mt: 0, lt: 0 };
  function rtStop() { clearInterval(RT.hb); clearTimeout(RT.rc); clearTimeout(RT.pend); RT.ok = false; RT.sid = 0; RT.send = null; var w = RT.ws; RT.ws = null; if (w) { try { w.onclose = null; w.close(); } catch (e) {} } }
  function rtPull() {
    if (!$("#acM")) return; clearTimeout(RT.pend);
    RT.pend = setTimeout(function () { // একসঙ্গে অনেক নাড়া এলেও প্রতি ০.৭ সেকেন্ডে সর্বোচ্চ ১বার আনে; আর সবাই একই মুহূর্তে না ছুটে ০–০.৩ সেকেন্ড এলোমেলো দেরি
      if (!$("#acM")) return; if (RT.busy) return rtPull();
      RT.busy = true; RT.last = Date.now(); Promise.resolve(load("new")).catch(function () {}).then(function () { RT.busy = false; });
    }, Math.max(0, RT.last + 700 - Date.now()) + Math.random() * 300);
  }
  function rtNudge() { try { if (RT.ok && RT.send) RT.send({ topic: RT.topic, event: "broadcast", payload: { type: "broadcast", event: "n", payload: { t: Date.now() } }, ref: String(++RT.ref) }); } catch (e) {} }
  function rtStart(sid) {
    rtStop(); if (!ON || !window.WebSocket) return; RT.sid = sid; RT.topic = "realtime:mcac-" + sid;
    var w; try { w = new WebSocket(base.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(C.key) + "&vsn=1.0.0"); } catch (e) { return; }
    RT.ws = w; var tp = RT.topic;
    var send = function (o) { try { if (w.readyState === 1) w.send(JSON.stringify(o)); } catch (e) {} };
    RT.send = send;
    w.onopen = function () {
      send({ topic: tp, event: "phx_join", payload: { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, private: false }, access_token: C.key }, ref: String(++RT.ref), join_ref: "1" });
      clearInterval(RT.hb); RT.hb = setInterval(function () { if (!$("#acM") || RT.sid !== sid) return rtStop(); send({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(++RT.ref) }); }, 25000);
    };
    w.onmessage = function (m) {
      var d; try { d = JSON.parse(m.data); } catch (e) { return; } if (!d || d.topic !== tp) return;
      if (d.event === "phx_reply") { if (d.payload && d.payload.status === "ok") { if (!RT.ok) { RT.ok = true; RT.tries = 0; rtPull(); } } else RT.ok = false; }
      else if (d.event === "phx_error" || d.event === "phx_close") RT.ok = false;
      else if (d.event === "broadcast" && d.payload && d.payload.event === "n") rtPull();
    };
    w.onclose = function () {
      RT.ok = false; if (RT.ws !== w) return; RT.ws = null; RT.send = null; if (!$("#acM") || RT.sid !== sid) return;
      RT.rc = setTimeout(function () { if ($("#acM") && RT.sid === sid) rtStart(sid); }, Math.min(30000, 2000 * Math.pow(2, Math.min(RT.tries++, 4))));
    };
  }
  function live() {
    if (!CUR || LB || !$("#acM")) return; LB = true; LT = Date.now();
    rpc("mc2_ac_live", { p_session: +CUR.s, p_voter: vid(), p_nick: CUR.n, p_typing: typing(), p_after: EVLAST }).then(function (r) {
      var t = $("#acTy"); if (!r || r.err) { if (t) t.hidden = true; return; }
      var add = (r.ev || []).filter(function (e) { return !e.o && !EVS.some(function (x) { return x.id === e.id; }); });
      EVLAST = Math.max(EVLAST, r.last || 0); if (add.length) { EVS = EVS.concat(add).slice(-50); render(false); }
      if (t) { var n = r.ty || []; t.hidden = !n.length; if (n.length) t.textContent = "✍️ " + n.join(", ") + " টাইপ করছে…"; }
    }).catch(function () {}).then(function () { LB = false; });
  }
  function leaveRoom() {
    if (!CUR || !$("#acM")) return; clearInterval(LV); rtStop();
    try { fetch(base + "/rest/v1/rpc/mc2_ac_leave", { method: "POST", keepalive: true, headers: H(), body: JSON.stringify({ p_session: +CUR.s, p_voter: vid() }) }).catch(function () {}); } catch (e) {}
  }
  // ফাইল টাইপ ও MB অ্যাডমিন থেকে বদলায় (mc2_ac_ftypes); না এলে কোডের ডিফল্ট FT-ই চলে
  function loadFT() { rpc("mc2_ac_ftypes", {}).then(function (r) { if (!r || typeof r !== "object" || Array.isArray(r)) return; Object.keys(FT).forEach(function (k) { delete FT[k]; }); Object.keys(r).forEach(function (k) { if (Array.isArray(r[k])) FT[k] = r[k]; }); ACCEPT = Object.keys(FT).map(function (e) { return "." + e; }).join(","); var f = $("#acFl"); if (f) f.setAttribute("accept", ACCEPT); }).catch(function () {}); }
  loadFT(); document.addEventListener("visibilitychange", function () { if (!document.hidden) loadFT(); });
  window.addEventListener("pagehide", leaveRoom);

  function sync() { if (location.hash === "#anon") { if (MINZ) return restore(); if (!$("#acx")) gate(); } else if (!MINZ) close(); }
  window.addEventListener("hashchange", function (e) { var h = String(e.oldURL || "").split("#")[1]; if (h && h !== "anon") PH = h; sync(); }); sync();
})();

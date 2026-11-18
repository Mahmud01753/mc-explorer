#!/usr/bin/env python3
"""MC Explorer — ডাউনলোড-পেজ জেনারেটর (AI সহকারী: প্রতিটি আপডেটের পরে এটা চালাবে; নিয়ম CLAUDE.md-তে)।
ব্যবহার:  python3 DELIVERY-TOOL/make-download-page.py <সাইট-রুট> [--changed file1 file2 ...]
  <সাইট-রুট> = যে ফোল্ডারে নতুন সাইটের index.html আছে (২০২৬-১০-২৯ থেকে সাইট সরাসরি রুটে)। আউটপুট: /mnt/user-data/outputs/download-page.html
  (২০২৬-১০-২১ নতুন নিয়ম: ডিফল্ট ডেলিভারি সরাসরি ফাইল কার্ড; এই পেজ শুধু মালিক "আর্টিফ্যাক্ট" বললে, আর ৯ এমবির বড় পেজ নয় — হালকা পেজ। এটা তৈরি হলে Artifact টুলে publish করবে, capabilities={"downloads": true}। present_files দিয়ে ডেলিভারি দেবে না — মালিকের ফোনে ডাউনলোড হয় না।)
"""
import sys, os, re, io, json, base64, zipfile, html
root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
changed = sys.argv[sys.argv.index('--changed') + 1:] if '--changed' in sys.argv else []
OUT = '/mnt/user-data/outputs'; os.makedirs(OUT, exist_ok=True)
CH = root
rd = lambda p: open(p, encoding='utf8').read()
SKIP = ('node_modules', '.git')

# 1) full zip
def zipdir(files, name):
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w', zipfile.ZIP_DEFLATED) as z:
        for rel in files: z.write(os.path.join(root, rel), rel)
    return b.getvalue()
allf = []
for d, ds, fs in os.walk(root):
    ds[:] = [x for x in ds if x not in SKIP]
    for f in fs:
        rel = os.path.relpath(os.path.join(d, f), root).replace('\\', '/')
        if rel.startswith('DELIVERY-TOOL/__'): continue
        allf.append(rel)
full = zipdir(allf, 'full')
upd = zipdir([f for f in (changed or []) if os.path.exists(os.path.join(root, f))], 'upd') if changed else b''

# 2) one-file site
t = rd(os.path.join(CH, 'index.html'))
t = re.sub(r'<link rel="stylesheet" href="style.css">', lambda m: '<style>' + rd(os.path.join(CH, 'style.css')) + '</style>', t)
t = re.sub(r'<link rel="manifest"[^>]*>\n?', '', t)
imgs = {}
for d, _, fs in os.walk(os.path.join(CH, 'images')):
    for f in fs:
        p = os.path.relpath(os.path.join(d, f), CH).replace('\\', '/'); ext = f.rsplit('.', 1)[1].lower()
        imgs[p] = 'data:image/%s;base64,%s' % ('jpeg' if ext == 'jpg' else ext, base64.b64encode(open(os.path.join(CH, p), 'rb').read()).decode())
def inl(m):
    f = os.path.join(CH, m.group(1))
    return '<script>' + rd(f).replace('</script', '<\\/script') + '</script>' if os.path.exists(f) else m.group(0)
t = re.sub(r'<script src="([^"]+\.js)"></script>', inl, t)
for p, d in sorted(imgs.items(), key=lambda x: -len(x[0])): t = t.replace(p, d)
site = t

# 3) text files (code view) + SQL status
TXT = ('.js', '.css', '.html', '.sql', '.md', '.txt', '.json', '.webmanifest', '.sha256')
files = {}
for rel in sorted(allf):
    if rel.lower().endswith(TXT) and not rel.startswith(('images/', 'DELIVERY-TOOL/', '.github/')):
        files[rel] = rd(os.path.join(root, rel))
for rel in ('index.html', '_redirects', '_headers', 'status.html', 'FILES.txt', 'CLAUDE.md', 'SQL-STATUS.md', 'DEPLOY.md'):
    if os.path.exists(os.path.join(root, rel)): files['(root)/' + rel] = rd(os.path.join(root, rel))
st = rd(os.path.join(root, 'SQL-STATUS.md')) if os.path.exists(os.path.join(root, 'SQL-STATUS.md')) else ''
m = re.search(r'## PENDING[^\n]*\n(.*?)(?=\n## )', st, re.S)
pending = re.findall(r'(supabase-[\w\-]+\.sql)', m.group(1)) if m else []
sqls = []
for n in sorted(k for k in files if re.fullmatch(r'supabase-[\w\-]+\.sql', k)):
    first = next((l.lstrip('- ').strip() for l in files[n].splitlines() if l.startswith('--') and len(l) > 6), '')
    sqls.append({'n': n, 'p': n in pending, 'd': first})
newsql = [s['n'] for s in sqls if s['p']]
b64 = lambda b: base64.b64encode(b).decode()
DATA = {'files': files, 'sqls': sqls, 'newsql': newsql, 'full': b64(full), 'upd': b64(upd), 'site': site, 'changed': changed}
js = json.dumps(DATA, ensure_ascii=False).replace('</', '<\\/')
PAGE = r'''<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>MC Explorer — ডাউনলোড</title>
<style>:root{--bg:#f4f7f2;--fg:#10261b;--c:#fff;--g:#1d6b43;--m:#5a6b61;--b:#d5e0d8;--o:#d98200;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
:root:not([data-theme=light]){}@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f1a14;--fg:#e8f1ea;--c:#17261d;--g:#4cc183;--m:#98ad9f;--b:#2a3f32}}:root[data-theme=dark]{--bg:#0f1a14;--fg:#e8f1ea;--c:#17261d;--g:#4cc183;--m:#98ad9f;--b:#2a3f32}
html{scroll-padding-top:env(safe-area-inset-top,0px)}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "Hind Siliguri",system-ui,sans-serif;padding:12px}main{max-width:760px;margin:0 auto;display:grid;gap:12px}
h1{font-size:20px;margin:4px 0}h2{font-size:17px;margin:0 0 6px}.c{background:var(--c);border:1px solid var(--b);border-radius:14px;padding:12px}button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:10px 14px;background:var(--g);color:#fff;cursor:pointer;margin:2px 4px 2px 0}button.l{background:none;color:var(--fg);border:1px solid var(--b)}button.s{padding:6px 10px;font-size:13px}
.big{display:block;width:100%;text-align:left;margin:6px 0;padding:12px 14px;font-size:16px}.sm{font-size:13px;color:var(--m)}.it{border-top:1px solid var(--b);padding:8px 0;overflow-wrap:anywhere}.it:first-child{border-top:0}
.tag{font-size:12px;border-radius:999px;padding:1px 9px;font-weight:700;margin-right:4px}.pen{background:#ffe3a3;color:#6b3f00}.run{background:var(--b);color:var(--m)}
pre{max-height:55vh;overflow:auto;white-space:pre-wrap;word-break:break-all;background:var(--bg);border:1px solid var(--b);border-radius:10px;padding:8px;font:12px/1.4 ui-monospace,monospace}#msg{position:sticky;top:0;z-index:5}#msg div{background:var(--g);color:#fff;border-radius:10px;padding:8px 12px;margin-bottom:6px}</style></head><body><main>
<h1>📦 MC Explorer — ডাউনলোড পেজ</h1><div id="msg"></div><div id="top"></div><div id="sq"></div><div id="fl"></div></main>
<script id="d" type="application/json">__DATA__</script>
<script>
var D=JSON.parse(document.getElementById("d").textContent),DL=null,$=function(s){return document.querySelector(s)};
var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var bd=function(s){return String(s).replace(/\d/g,function(d){return"০১২৩৪৫৬৭৮৯"[d]})};
function say(t){var m=$("#msg");m.innerHTML="<div>"+esc(t)+"</div>";setTimeout(function(){m.innerHTML=""},4000)}
function b2u(b){var s=atob(b),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
var OK=/\.(txt|md|html|zip|json|csv|pdf|png|jpg|svg)$/i;
function nm(n){n=n.replace(/^\(root\)\//,"").replace(/\//g,"_");return OK.test(n)?n:n+".txt"}
function save(name,data){if(!DL){say("ডাউনলোড এখানে চালু নেই — Copy ব্যবহার করুন");return}DL.save({filename:name,data:data}).then(function(){say("✅ "+name)},function(e){say(e&&e.code==="declined"?"বাতিল করা হয়েছে":"হয়নি: "+(e&&e.message||e))})}
function copy(t,btn){var ok=function(){var o=btn.textContent;btn.textContent="✅ কপি";setTimeout(function(){btn.textContent=o},1500)};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();function fb(){var a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy");ok()}catch(e){say("কপি হয়নি")}a.remove()}}
function allCode(){return Object.keys(D.files).map(function(k){return "\n\n===== FILE: "+k+" =====\n"+D.files[k]}).join("")}
var A={full:function(){save("mc-explorer-full-site.zip",new Blob([b2u(D.full)]))},upd:function(){save("mc-explorer-update-only.zip",new Blob([b2u(D.upd)]))},site:function(){save("mc-explorer-site.html",D.site)},
 all:function(){save("mc-explorer-all-code.txt",allCode())},allc:function(b){copy(allCode(),b)},
 pend:function(){save("supabase-pending-all.sql.txt",D.files["supabase-pending-all.sql"]||"")},pendc:function(b){copy(D.files["supabase-pending-all.sql"]||"",b)}};
function paint(){
 var nw=D.newsql,btn=function(a,t,x){return '<button class="'+(x||"")+'" data-a="'+a+'">'+t+"</button>"};
 var h='';
 if(nw.length)h+='<div class="c" style="border:2px solid var(--o)"><h2>🆕 NEW SQL — শুধু এটা চালান</h2>'+nw.map(function(n){return '<div class="it"><b>'+esc(n)+'</b> <span class="sm">'+bd(Math.ceil(D.files[n].length/1024))+' KB</span><br>'+btn("f:dl:"+n,"⬇️ Download")+btn("f:cp:"+n,"📋 Copy","l")+btn("f:vw:"+n,"👁 View","l")+'<div id="v_'+esc(n)+'"></div></div>'}).join("")+'<p class="sm">Supabase > SQL Editor-এ পেস্ট করে Run। বাকি পুরোনো SQL আবার চালাতে হবে না।</p></div>';
 else h+='<div class="c"><b>এই আপডেটে কোনো নতুন SQL লাগবে না</b></div>';
 h+='<div class="c"><h2>⬇️ ৩টা মূল ডাউনলোড</h2>'+
  '<button class="big" data-a="full">1️⃣ ফুল সাইট জিপ <span class="sm" style="color:#fff">mc-explorer-full-site.zip · '+bd((D.full.length*.75/1048576).toFixed(1))+' MB</span></button>'+
  '<button class="big" data-a="site">2️⃣ এক-ফাইলের পুরো সাইট <span class="sm" style="color:#fff">mc-explorer-site.html · ডাবল-ক্লিকে খোলে</span></button>'+
  '<button class="big" data-a="pend">3️⃣ supabase-pending-all.sql</button><div>'+btn("pendc","📋 Copy","l")+btn("pendv","👁 View","l")+'</div><div id="pv"></div>'+
  (D.upd.length?'<button class="big l" data-a="upd">🔄 শুধু বদলানো ফাইলের জিপ ('+bd(D.changed.length)+'টি)</button><p class="sm">'+esc(D.changed.join(", "))+'</p>':'')+
  '<h2 style="margin-top:10px">💻 পুরো কোড একটা ফাইলে</h2>'+btn("all","⬇️ Download (.txt)")+btn("allc","📋 Copy","l")+'<p class="sm">ব্রাউজার .js/.css/.sql সরাসরি ডাউনলোড দেয় না, তাই নামের শেষে .txt যোগ হয়; আপলোডের আগে .txt মুছে ফেলবেন।</p></div>';
 $("#top").innerHTML=h;
 $("#sq").innerHTML='<div class="c"><h2>🗄 সব SQL ফাইল</h2>'+D.sqls.map(function(s){return '<div class="it"><span class="tag '+(s.p?"pen":"run")+'">'+(s.p?"PENDING":"ALREADY RUN")+'</span><b>'+esc(s.n)+'</b><div class="sm">'+esc(s.d)+'</div>'+btn("f:dl:"+s.n,"⬇️","s")+btn("f:cp:"+s.n,"📋","s l")+"</div>"}).join("")+"</div>";
 $("#fl").innerHTML='<div class="c"><h2>📄 প্রতিটি ফাইলের কোড</h2>'+Object.keys(D.files).map(function(k){return '<div class="it"><b>'+esc(k)+'</b> <span class="sm">'+bd(Math.ceil(D.files[k].length/1024)||1)+' KB</span><br>'+btn("f:dl:"+k,"⬇️","s")+btn("f:cp:"+k,"📋 Copy","s l")+btn("f:vw:"+k,"👁 কোড","s l")+'<div id="v_'+esc(k)+'"></div></div>'}).join("")+"</div>";
}
document.addEventListener("click",function(e){var b=e.target.closest("button");if(!b||!b.dataset.a)return;var a=b.dataset.a;
 if(a.indexOf("f:")===0){var p=a.split(":"),k=a.slice(5);if(p[1]==="dl")save(nm(k),D.files[k]);else if(p[1]==="cp")copy(D.files[k],b);else{var v=document.getElementById("v_"+k);v.innerHTML=v.innerHTML?"":"<pre>"+esc(D.files[k])+"</pre>"}return}
 if(a==="pendv"){var pv=$("#pv");pv.innerHTML=pv.innerHTML?"":"<pre>"+esc(D.files["supabase-pending-all.sql"]||"")+"</pre>";return}
 if(A[a])A[a](b)});
paint();
(window.claude&&claude.use?claude.use("downloads"):Promise.resolve(null)).then(function(d){DL=d;if(!d)say("এই ভিউতে ডাউনলোড বন্ধ — Copy বাটন কাজ করবে")}).catch(function(){});
</script></body></html>'''
open(OUT + '/download-page.html', 'w', encoding='utf8').write(PAGE.replace('__DATA__', js))
print('ok', os.path.getsize(OUT + '/download-page.html') // 1024, 'KB; new sql:', newsql)

// MC Explorer — স্কোর কার্ড আঁকার কোড। নাম = নম্বর (সাইটে যে ক্রমে আসে):
//   drawCard1 = ১ নং নেভি মেডালিয়ন কার্ড (সাইটে ঢুকে প্রথমে যেটা আসে; সার্ভারে এটাই জমা হয়)
//   drawCard2 = ২ নং সবুজ উইনার কার্ড
//   drawCard3 = ৩ নং গ্লাস রিং কার্ড
//   drawStory = ৯:১৬ স্টোরি কার্ড
// (আগের নাম drawK3/drawK/drawK2 ছিল; নিচে শেষে পুরোনো নামের alias আছে, নতুন কোডে ব্যবহার করবে না)
// ✏️ লেখা-বদল: o.tx = { কী: "নতুন লেখা" } — ফাঁকা/না থাকলে ডিফল্ট। অ্যাডমিন ডাউনলোড-এডিটে প্রতিজনের কার্ডের প্রতিটি ঘর বদলাতে এটা ব্যবহার হয় (কার্ড আঁকার ধরন বদলায় না)।
const TXG=(o,k,d)=>{const v=o&&o.tx?o.tx[k]:null;return v!=null&&String(v).trim()!==""?String(v):d};
const bn=n=>String(n).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
const ORD=["","১ম","২য়","৩য়","৪র্থ","৫ম","৬ষ্ঠ","৭ম","৮ম","৯ম","১০ম"];
// বাংলা ক্রমবাচক: ১-১০ বিশেষ রূপ, ১১ থেকে "তম" (১২তম, ১০০তম)
const ordB=n=>ORD[n]||bn(n)+"তম";
// র‍্যাংক-লেবেল (ঐচ্ছিক): o.rankLabel={cap:"সব বিভাগে",val:"১ম"}। না দিলে আগের মতোই "বিভাগে" + বিভাগ-র‍্যাংক।
window.mcOrd=ordB; // অ্যাডমিনের প্রিভিউ ক্রমবাচক লেখা দেখাতে ব্যবহার করে
const rkL=o=>{const l=o&&o.rankLabel;return l&&(l.cap||l.val)?{cap:String(l.cap||"বিভাগে"),val:String(l.val||ordB(o.drank))}:{cap:"বিভাগে",val:ordB(o.drank)}};
// সাইট লিংক: o.cx দিলে কার্ডের ঠিক সেন্টারে (না দিলে [L,R]-এর মাঝে), উজ্জ্বল গ্লো সহ। লম্বা হলে QR-এর দিকে না গিয়ে বামে সরে; তাও না ধরলে ফন্ট ছোট (min পর্যন্ত), তারপর ২ লাইন। R = QR থেকে দূরত্ব রেখে ডান সীমা (লিংক কখনো R পেরোয় না)।
window.mcLinkGlow=function(x,t,L,R,y,o){o=o||{};t=String(t||"");if(!t)return;const w=Math.max(40,R-L),f=s=>(o.wt||700)+" "+s+'px "Hind Siliguri",Arial,sans-serif';let s=o.size||30,mn=o.min||16,l1=t,l2="",cx=(L+R)/2;
 x.save();x.__raw=1;x.font=f(s);while(x.measureText(t).width>w&&s>mn){s-=1;x.font=f(s)}
 if(x.measureText(t).width>w){let k=t.length;while(k>1&&x.measureText(t.slice(0,k)).width>w)k--;l1=t.slice(0,k);l2=t.slice(k);while(l2.length>2&&x.measureText(l2).width>w)l2=l2.slice(0,-1)}
 if(o.cx!=null){const tw=Math.max(x.measureText(l1).width,l2?x.measureText(l2).width:0)+(o.bg?2*(o.pd!=null?o.pd:4):0);cx=Math.max(L+tw/2,Math.min(o.cx,R-tw/2))}
 x.textAlign="center";x.textBaseline="alphabetic";x.fillStyle=o.col||"#ffe066";x.shadowColor=o.glow||"rgba(255,216,74,.95)";x.shadowBlur=o.blur||18;
 if(o.bg){const pd=o.pd!=null?o.pd:4,wl=x.measureText(l1).width,ph=s*1.2,ptop=y-s*0.9;x.shadowBlur=0;x.shadowColor="transparent";x.fillStyle=o.bg;x.beginPath();if(x.roundRect){x.roundRect(cx-wl/2-pd,ptop-pd+(o.shr||0),wl+pd*2,ph+pd*2-2*(o.shr||0),(ph+pd*2-2*(o.shr||0))/2);}else{const sh=o.shr||0,rx=cx-wl/2-pd,ry=ptop-pd+sh,rw=wl+pd*2,rh=ph+pd*2-2*sh,rr2=rh/2;x.moveTo(rx+rr2,ry);x.arcTo(rx+rw,ry,rx+rw,ry+rh,rr2);x.arcTo(rx+rw,ry+rh,rx,ry+rh,rr2);x.arcTo(rx,ry+rh,rx,ry,rr2);x.arcTo(rx,ry,rx+rw,ry,rr2);}x.fill();x.fillStyle=o.fg||"#ffffff";}
[l1,l2].forEach((ln,j)=>{if(!ln)return;const yy=y+j*s*1.15;x.fillText(ln,cx,yy);if(!o.bg)x.fillText(ln,cx,yy)});
 x.restore()};
// বাংলা অঙ্ক (০-৯) কার্ডের যেকোনো লেখায় সমান উচ্চতায় আঁকার জন্য fillText মোড়ানো; x.__raw=1 দিলে বন্ধ (বড় % সংখ্যার নিজস্ব মাপে)
function eqDigits(x){const raw=x.fillText.bind(x),DG=/[\u09E6-\u09EF]/;
 x.fillText=function(t,X,Y,mw){t=String(t);if(x.__raw||!DG.test(t))return raw(t,X,Y,mw);
  const hs=c=>{const m=x.measureText(c);return m.actualBoundingBoxAscent+m.actualBoundingBoxDescent};
  const H=Math.max(0,...[...t].filter(c=>DG.test(c)).map(hs));if(!(H>0))return raw(t,X,Y,mw);
  const al=x.textAlign,items=(t.match(/[\u09E6-\u09EF]|[^\u09E6-\u09EF]+/g)||[]).map(p=>{const m=x.measureText(p);let k=1;if(DG.test(p)){const h=hs(p);if(h>0)k=Math.min(1.5,H/h)}return{p,k,w:m.width*k,a:m.actualBoundingBoxAscent}});
  const tot=items.reduce((s,i)=>s+i.w,0);let dx=al==="center"?X-tot/2:al==="right"?X-tot:X;
  x.textAlign="left";
  for(const i of items){if(DG.test(i.p)&&i.k!==1){x.save();x.translate(dx,Y-H+i.a*i.k);x.scale(i.k,i.k);raw(i.p,0,0);x.restore()}else raw(i.p,dx,Y);dx+=i.w}
  x.textAlign=al}}
// অ্যাডমিনের কাস্টম কার্ড সাইজ (Admin > কুইজ সেটিংস, key card_cfg); বন্ধ থাকলে {} = ডিফল্ট ১০৮০×১৪০০ / ১০৮০×১৯২০
window.mcCardScale=function(){const q=window.MC_QUIZ&&window.MC_QUIZ.card,v=q?+q.q:0;return v>=1&&v<=3?v:2}; // কার্ডের কোয়ালিটি গুণক: ডিফল্ট ২× (হাই); অ্যাডমিন কুইজ সেটিংস > কার্ড কোয়ালিটি থেকে ১×/২×/৩×
window.mcCardDims=function(){const q=window.MC_QUIZ&&window.MC_QUIZ.card;if(!q||!q.on)return{};const n=v=>{v=Math.round(+v);return v>=100&&v<=8000?v:0};return{cw:n(q.w),ch:n(q.h),sw:n(q.sw),sh:n(q.sh)}};
// ফোনের ক্যানভাস সীমা (~১৬ মেগাপিক্সেল) পেরোলে অনুপাত ঠিক রেখে ছোট করে
function dimFit(w,h,dw,dh){const K=window.mcCardScale?window.mcCardScale():2;w=w>0?w:Math.round(dw*K);h=h>0?h:Math.round(dh*K);const A=16000000;if(w*h>A){const k=Math.sqrt(A/(w*h));w=Math.floor(w*k);h=Math.floor(h*k)}return[w,h]}
// ====== ২ নং কার্ড: সবুজ উইনার (সাদা কার্ড + সবুজ হেডার, ১০৮০×১৪০০)
// ২০২৬-১১-১৫: কার্ডের বাম-ডান লোগো। o.lgm (মাস্ক) না থাকলে আগের মতো সবসময় লোগো। মাস্কের বিট বন্ধ হলে লোগোর জায়গায় অক্ষর (o.tl / o.tr, ডিফল্ট M / C) — বেশি অক্ষর হলে ছোট হয়ে বৃত্তে আঁটে।
// bit: ১ = কার্ড১(drawCard1), ২ = কার্ড২(drawCard2), ৪ = কার্ড৩(drawCard3), ৮ = স্টোরি। a/b = [cx, cy, r]; logo = ওই ডিজাইনের নিজের লোগো-আঁকার ফাংশন
window.mcLogoPair = function (x, o, bit, logo, F, a, b) {
  var on0 = o.lgm == null || (o.lgm & bit), T = [o.tl == null ? "M" : String(o.tl), o.tr == null ? "C" : String(o.tr)], P = [a, b], PM = o.pm && o.pm[String(bit)], IM = PM ? [PM.lm, PM.ln] : [o.lm, o.ln]; // PM = অ্যাডমিনের "কার্ডের ধরন ধরে আলাদা লোগো" (থাকলে)
  for (var i = 0; i < 2; i++) {
    var on = o.lgs && o.lgs[i] != null ? !!o.lgs[i] : on0; // o.lgs: একটা কার্ডের জন্য নিজের বাছাই (ড্রপডাউন) — বাম/ডান আলাদা; null = ডিজাইনের মাস্ক যেমন
    var p = P[i]; logo(on ? IM[i] : null, p[0], p[1], p[2]);
    if (on || !T[i]) continue;
    x.save(); x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = "#1d6b43";
    x.font = F(800, 100); var w = x.measureText(T[i]).width || 1, sz = Math.min(p[2] * 1.2, 100 * p[2] * 1.5 / w);
    x.font = F(800, sz); x.fillText(T[i], p[0], p[1] + sz * 0.34); x.restore();
  }
};
function drawCard2(o){
 const W=1080,H=1400,D=o.cw>0?dimFit(o.cw,Math.round(o.cw*H/W),W,H):dimFit(0,0,W,H),c=document.createElement("canvas");c.width=D[0];c.height=D[1];const x=c.getContext("2d");x.scale(D[0]/W,D[1]/H);eqDigits(x);
 const F=(w,s,f)=>`${w} ${s}px "MCDigits","${f||"Anek Bangla"}","Hind Siliguri",sans-serif`;
 const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
 const fit=(t,w,s,wt,f)=>{x.font=F(wt,s,f);while(x.measureText(t).width>w&&s>18){s-=2;x.font=F(wt,s,f)}return s};
 const logo=(im,cx,cy,r)=>{x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle="#fff";x.fill();x.clip();if(im){const k=r*1.7/Math.max(im.naturalWidth,im.naturalHeight);x.drawImage(im,cx-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k)}x.restore()};
 const fs=(t,w,s,wt,f)=>{x.font=F(wt,s,f);while(x.measureText(t).width>w&&s>10){s-=1;x.font=F(wt,s,f)}return s}; // fit-এর মতো, কিন্তু ১০ পর্যন্ত ছোট হতে পারে
 const G="#1d6b43",OR="#d98200",FG="#10261b",MU="#5a6f62";
 x.save();rr(20,20,W-40,H-40,56);x.clip();x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#0f2d20";x.fillRect(0,0,W,250);x.restore();
 window.mcLogoPair(x,o,2,logo,F,[112,125,62],[968,125,62]);x.textAlign="center";x.fillStyle="#fff";fit(TXG(o,"col","মুরারিচাঁদ কলেজ"),760,92,800);x.fillText(TXG(o,"col","মুরারিচাঁদ কলেজ"),540,134);x.fillStyle="#b9d3c2";x.font=F(600,34,"Hind Siliguri");x.fillText(TXG(o,"colEn","Murari Chand College, Sylhet"),540,184);
 x.lineWidth=14;x.strokeStyle=o.col;rr(20,20,W-40,H-40,56);x.stroke();
 {const m=o.metal,GOLD=[m.g[0],m.g[1],m.g[3],m.g[2]],OUT=m.g[2],TX=m.t,bx=230,by=218,bw=620,bh=84,col=o.col;
  x.fillStyle="#ffd84a";[[160,262],[920,262]].forEach(([sx,sy])=>{x.beginPath();x.moveTo(sx,sy-17);x.quadraticCurveTo(sx,sy,sx+17,sy);x.quadraticCurveTo(sx,sy,sx,sy+17);x.quadraticCurveTo(sx,sy,sx-17,sy);x.quadraticCurveTo(sx,sy,sx,sy-17);x.closePath();x.fill()});
  if(o.tier===1){x.save();x.shadowColor=col;x.shadowBlur=40;rr(bx-6,by-6,bw+12,bh+25,31);x.fillStyle="#0c2218";x.fill();x.shadowColor="transparent";x.strokeStyle="#f0b400";x.lineWidth=4;x.stroke();x.restore()}
  x.save();x.shadowColor="rgba(0,0,0,.28)";x.shadowBlur=24;x.shadowOffsetY=12;rr(bx,by+14,bw,bh,26);x.fillStyle=GOLD[3];x.fill();x.shadowColor="transparent";
  rr(bx,by,bw,bh,26);const pg=x.createLinearGradient(0,by,0,by+bh);pg.addColorStop(0,GOLD[0]);pg.addColorStop(.35,GOLD[1]);pg.addColorStop(1,GOLD[2]);x.fillStyle=pg;x.fill();
  rr(bx+8,by+8,bw-16,bh*.34,14);x.fillStyle="rgba(255,255,255,.4)";x.fill();
  rr(bx,by,bw,bh,26);x.strokeStyle=OUT;x.lineWidth=6;x.stroke();x.strokeStyle="#fff";x.lineWidth=3;x.stroke();x.restore();
  x.textAlign="center";x.fillStyle=TX;x.font=F(700,20,"Hind Siliguri");x.fillText(TXG(o,"win","★  WINNER  ★"),bx+bw/2,by+27);fit(o.cname,bw-70,46,800);x.fillText(o.cname,bx+bw/2,by+bh-15)}
 {const tt=TXG(o,"ttl","MC কতটুকু জানো?");x.textAlign="center";const ts=fit(tt,780,84,800),ttw2=x.measureText(tt).width,tyy=408,hf=ttw2/2;
  x.save();x.shadowColor="rgba(15,45,32,.28)";x.shadowBlur=16;x.shadowOffsetY=9;const tgx=x.createLinearGradient(0,tyy-ts*.8,0,tyy);tgx.addColorStop(0,"#2a9a62");tgx.addColorStop(1,"#0f5a38");x.fillStyle=tgx;x.fillText(tt,540,tyy);x.restore();
  [-1,1].forEach(sd=>{const x0=540+sd*(hf+26),x1=540+sd*(hf+26+Math.min(150,500-hf)),lg=x.createLinearGradient(x0,0,x1,0);lg.addColorStop(0,"#ffc928");lg.addColorStop(1,"rgba(255,201,40,0)");x.strokeStyle=lg;x.lineWidth=4;x.lineCap="round";x.beginPath();x.moveTo(x0,tyy-26);x.lineTo(x1,tyy-26);x.stroke();x.lineCap="butt";x.fillStyle="#ffc928";x.beginPath();x.moveTo(x0-sd*8,tyy-26);x.lineTo(x0-sd*1,tyy-34);x.lineTo(x0+sd*6,tyy-26);x.lineTo(x0-sd*1,tyy-18);x.closePath();x.fill()})};
 // মাঝে রিং
 const spark=(sx,sy,r)=>{x.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr2=i%2?r*.28:r;x.lineTo(sx+Math.cos(a)*rr2,sy+Math.sin(a)*rr2)}x.closePath();x.fill()};
 if(o.pct>=70){const gl=x.createRadialGradient(540,603,120,540,603,330);gl.addColorStop(0,o.col+"44");gl.addColorStop(1,o.col+"00");x.fillStyle=gl;x.fillRect(250,333,580,540)}
 const P=o.pct,cy=600,ry=603,R=145;x.lineWidth=36;x.lineCap="round";x.strokeStyle="#dfe9e2";x.beginPath();x.arc(540,ry,R,0,7);x.stroke();const rg=x.createLinearGradient(380,443,700,763);rg.addColorStop(0,"#34b873");rg.addColorStop(1,"#0f5a38");x.strokeStyle=rg;if(P>0){x.beginPath();x.arc(540,ry,R,-Math.PI/2,-Math.PI/2+Math.PI*2*P/100);x.stroke()}x.lineCap="butt";
 if(P>=70){x.fillStyle="#ffc928";[[385,463,15],[695,459,12],[350,748,11],[735,755,15],[540,439,10]].forEach(a=>spark(...a))}
 x.fillStyle=G;x.__raw=1;{const nm=bn(P),CX=540,CY=603,MY=582,LIM=124,GP=3,TH=122;
  // অঙ্কের উচ্চতা সমান দেখাতে ফন্ট-সাইজ মাপ ধরে ঠিক হয় (০ খাটো, তাই বড় সাইজ পায়); তারপর চার কোণ সার্কেলের ভেতরে না হলে ছোট হয়
  x.font=F(800,100);const a100=x.measureText(nm).actualBoundingBoxAscent||75;let ns=Math.min(300,Math.round(100*TH/a100)),ps,w1,w2,asc,BY;
  const ms=()=>{ps=Math.min(ns*0.28,38);x.font=F(800,ns);const m=x.measureText(nm);w1=m.width;asc=m.actualBoundingBoxAscent||ns*.75;x.font=F(800,ps);w2=x.measureText("%").width;BY=MY+asc/2;const T=w1+w2+GP,x0=CX-T/2,x1=CX+T/2,top=BY-asc;
   return [[x0,top],[x1,top],[x0,BY],[x1,BY]].every(([px,py])=>Math.hypot(px-CX,py-CY)<=LIM)};
  while(ns>36&&!ms())ns-=3;ms();const x0=CX-(w1+w2+GP)/2;x.textAlign="left";x.font=F(800,ns);x.fillText(nm,x0,BY);x.font=F(800,ps);x.fillText("%",x0+w1+GP,BY);x.textAlign="center"}x.__raw=0;x.fillStyle=OR;x.font=F(800,52);x.fillText(TXG(o,"kn","জানি"),540,687);
 // বামে ছবি
 const px=200;x.save();x.beginPath();x.arc(px,cy,102,0,7);x.fillStyle=o.col;x.fill();x.beginPath();x.arc(px,cy,94,0,7);x.fillStyle="#fff";x.fill();x.clip();
 if(o.photo){const im=o.photo,k=188/Math.min(im.naturalWidth,im.naturalHeight);x.drawImage(im,px-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k)}
 else{x.fillStyle="#e7eee8";x.fillRect(px-100,cy-100,200,200);x.fillStyle=G;x.font=F(800,110);x.textAlign="center";x.fillText([...o.name][0]||"M",px,cy+38)}
 x.restore();x.textAlign="center";
 {const ct=o.club||o.deptLabel||o.dept;if(ct){x.font=F(800,28,"Hind Siliguri");const L0=44,R0=392,cw=Math.min(R0-L0,x.measureText(ct).width+48);let cl=px-cw/2;if(cl<L0)cl=L0;if(cl+cw>R0)cl=R0-cw; // ছবির নিচের ফাঁকা জায়গা (রিংয়ের বাঁ পাশ পর্যন্ত) পুরো নিতে পারে; তাতেও না ধরলে লেখা ছোট হয়
 const cg=x.createLinearGradient(cl,0,cl+cw,0);cg.addColorStop(0,"#ffe066");cg.addColorStop(1,"#ffb300");x.save();x.shadowColor="rgba(0,0,0,.25)";x.shadowBlur=8;x.shadowOffsetY=3;rr(cl,cy+90,cw,50,25);x.fillStyle=cg;x.fill();x.restore();rr(cl,cy+90,cw,50,25);x.strokeStyle="#fff";x.lineWidth=3;x.stroke();x.fillStyle="#3a1d00";x.textAlign="center";fs(ct,cw-30,28,800,"Hind Siliguri");x.fillText(ct,cl+cw/2,cy+124)}}
 // ডানে বিভাগ র‍্যাঙ্ক পদক
 const rx=880;x.beginPath();x.arc(rx,cy,102,0,7);x.fillStyle=G;x.fill();x.strokeStyle="#ffd84a";x.lineWidth=7;x.beginPath();x.arc(rx,cy,90,0,7);x.stroke();
 {const dn=String(o.dept||""),RL=rkL(o),rk=RL.val,LR=o.rankLabel&&o.rankLabel.val?[...rk].length>3:!(o.drank>=1&&o.drank<=10),HF="Hind Siliguri"; // LR = ক্রম লম্বা (১১তম, ১০০তম…)
 // বিভাগের নাম: এক লাইনে ২৮ আকারে না ধরলে (ফাঁকা থাকলে) ২ লাইনে ভাঙে; একটাই শব্দ হলে ছোট হয়
 let DL=[dn],ds=fs(dn,132,28,700,HF);
 if(ds<26&&/\s/.test(dn)){const ws=dn.trim().split(/\s+/);let best=null;x.font=F(700,28,HF);for(let k=1;k<ws.length;k++){const a=ws.slice(0,k).join(" "),b=ws.slice(k).join(" "),m=Math.max(x.measureText(a).width,x.measureText(b).width);if(!best||m<best[0])best=[m,a,b]}
  if(best){const s=Math.min(fs(best[1],128,28,700,HF),fs(best[2],128,28,700,HF));if(s>ds){DL=[best[1],best[2]];ds=s}}}
 x.fillStyle="#fff";x.font=F(700,ds,HF);
 if(LR){ // ক্রম বড় ও গাড় হয়ে পদকের মাথায় আলাদা ভেসে থাকে; ভেতরে শুধু বিভাগের নাম + "বিভাগে"
  const y0=DL.length>1?cy-14:cy+2;DL.forEach((t,i)=>x.fillText(t,rx,y0+i*(ds+3)));
  x.fillStyle="#cfe8d8";fit(RL.cap,150,DL.length>1?22:24,600,HF);x.fillText(RL.cap,rx,DL.length>1?cy+50:cy+38);
  x.font=F(800,50);const bw=Math.min(236,Math.max(110,x.measureText(rk).width+48)),by=cy-134,bh=62;
  x.save();x.shadowColor="rgba(0,0,0,.35)";x.shadowBlur=10;x.shadowOffsetY=4;const bg=x.createLinearGradient(rx-bw/2,0,rx+bw/2,0);bg.addColorStop(0,"#ffe066");bg.addColorStop(1,"#ffb300");rr(rx-bw/2,by,bw,bh,31);x.fillStyle=bg;x.fill();x.restore();
  rr(rx-bw/2,by,bw,bh,31);x.strokeStyle="#fff";x.lineWidth=4;x.stroke();x.fillStyle="#3a1d00";fs(rk,bw-36,50,800);x.fillText(rk,rx,by+bh-14)}
 else{const y0=DL.length>1?cy-54:cy-34;DL.forEach((t,i)=>x.fillText(t,rx,y0+i*(ds+2)));
  x.fillStyle="#cfe8d8";fit(RL.cap,150,DL.length>1?22:24,600,HF);x.fillText(RL.cap,rx,DL.length>1?cy+2:cy-2);
  x.fillStyle="#ffd84a";fit(rk,DL.length>1?112:128,DL.length>1?72:84,800);x.fillText(rk,rx,DL.length>1?cy+68:cy+66)}}
 if(o.score!=null){const mt=bn(o.score)+" "+TXG(o,"mk","মার্ক পেয়ে");x.font=F(800,28,"Hind Siliguri");const mw=Math.min(250,x.measureText(mt).width+48),mg=x.createLinearGradient(rx-mw/2,0,rx+mw/2,0);mg.addColorStop(0,"#ffe066");mg.addColorStop(1,"#ffb300");x.save();x.shadowColor="rgba(0,0,0,.25)";x.shadowBlur=8;x.shadowOffsetY=3;rr(rx-mw/2,cy+90,mw,50,25);x.fillStyle=mg;x.fill();x.restore();rr(rx-mw/2,cy+90,mw,50,25);x.strokeStyle="#fff";x.lineWidth=3;x.stroke();x.fillStyle="#3a1d00";x.textAlign="center";fit(mt,mw-30,28,800,"Hind Siliguri");x.fillText(mt,rx,cy+124);x.textAlign="center"}
 const tg=TXG(o,"tag",P>=100?"MC-র জীবন্ত গুগল ম্যাপ":P>=90?"MC পুরো মুখস্থ":P>=70?"ক্যাম্পাসের বস":P>=60?"ক্যাম্পাস চেনার ওস্তাদ":P>=56?"ক্যাম্পাসের পরিচিত মুখ":P>=48?"প্রায় পুরো এমসি চেনা":P>=40?"শহীদ মিনার পর্যন্ত চিনি":P>=30?"পুকুর পাড় পর্যন্ত চিনি":P>=20?"জারুল তলা পর্যন্ত চিনি":P>=10?"ক্যাম্পাসের নতুন অভিযাত্রী":"নতুন পথিক, এগিয়ে চলো");x.font=F(500,50,"Hind Siliguri");const tw=Math.min(900,x.measureText(tg).width+120),ty=788,th=82;rr(540-tw/2,ty,tw,th,41);x.fillStyle="#0b2232";x.fill();x.lineWidth=3;x.strokeStyle="#e5bd54";x.stroke();x.fillStyle="#e5bd54";x.textAlign="center";fit(tg,tw-80,50,500,"Hind Siliguri");x.fillText(tg,540,ty+57);
 // নাম, চিপ
 x.fillStyle=FG;fs(o.name,920,84,800);x.fillText(o.name,540,950);
 x.font=F(600,26,"Hind Siliguri");const t1=o.deptLabel||o.dept,t2=TXG(o,"bestL","সেরা চেনা:")+" "+o.best,gp=14,LB=70,RB=1010,AV=RB-LB-gp;let w1=x.measureText(t1).width+48,w2=x.measureText(t2).width+48,sx=540-(w1+w2+gp)/2;
 // ছোট হলে আগের মতো মাঝখানে; বিভাগ বড় হলে "সেরা চেনা" চিপ ডানে থাকে আর বিভাগ চিপ বাম দিকে লম্বা হয় (তাতেও না ধরলে লেখা ছোট হয়)
 if(w1+w2+gp>RB-LB){w2=Math.min(w2,Math.max(AV*.5,AV-w1));w1=AV-w2;sx=LB}
 const cf=(t,w,xc)=>{fs(t,w-48,26,600,"Hind Siliguri");x.fillText(t,xc,997)};
 rr(sx,966,w1,44,22);x.fillStyle="#e7eee8";x.fill();x.fillStyle="#0f6b46";cf(t1,w1,sx+w1/2);rr(sx+w1+gp,966,w2,44,22);x.fillStyle="#fff1d6";x.fill();x.fillStyle="#9a5b00";cf(t2,w2,sx+w1+gp+w2/2);
 {const sw=112;fit(o.title,620,76,800);const ttw=x.measureText(o.title).width,scx=570-ttw/2-9-68;
 x.save();x.translate(scx,1060);x.rotate(-12*Math.PI/180);x.shadowColor="rgba(0,0,0,.3)";x.shadowBlur=8;x.shadowOffsetY=3;
  const tag=(ins)=>{const a=-sw/2+ins,b=sw/2-8+ins*-1,h=26-ins;x.beginPath();x.moveTo(a+12,-h);x.lineTo(b,-h);x.lineTo(sw/2+14-ins*1.2,0);x.lineTo(b,h);x.lineTo(a+12,h);x.arcTo(a,h,a,h-12,12);x.lineTo(a,-h+12);x.arcTo(a,-h,a+12,-h,12);x.closePath()};
  tag(0);x.fillStyle="#0f2d20";x.fill();x.shadowColor="transparent";x.strokeStyle="#ffd84a";x.lineWidth=3;x.stroke();tag(6);x.lineWidth=1.5;x.stroke();
  x.fillStyle="#ffd84a";x.textAlign="center";fit(TXG(o,"upL","উপাধি"),sw-44,28,800,"Hind Siliguri");x.fillText(TXG(o,"upL","উপাধি"),-6,9);x.restore();
 x.textAlign="center";x.fillStyle=OR;fit(o.title,620,76,800);x.fillText(o.title,570,1074)}
 [[TXG(o,"l1","গেম টাইপ"),o.game],[TXG(o,"l2","সঠিক"),bn(o.ok)+"/"+bn(o.total)],[TXG(o,"l3","র‍্যাঙ্ক"),o.rank?"#"+bn(o.rank):"—"]].forEach(([l,v],i)=>{const X=90+i*310;rr(X,1108,280,88,26);x.fillStyle="#f4f7f2";x.fill();x.strokeStyle="#d6ded8";x.lineWidth=2;x.stroke();x.fillStyle=MU;x.font=F(500,24,"Hind Siliguri");x.fillText(l,X+140,1138);x.fillStyle=FG;fit(v,240,36,800);x.fillText(v,X+140,1179)});
 x.save();x.setLineDash([12,10]);x.strokeStyle="#bccbc0";x.lineWidth=3;x.beginPath();x.moveTo(84,1216);x.lineTo(996,1216);x.stroke();x.restore();
 const qq=o.qr,qs=qq?Math.max(3,Math.floor(140/(qq.size+4))):0,qLeft=qq?990-(qq.size+4)*qs-30:900;
 x.textAlign="left";x.textBaseline="alphabetic";const LHS="Hind Siliguri";
 const L2=84,R2=qLeft,lty=1270;
 x.fillStyle=FG;x.textAlign="left";fit(TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো"),R2-90,40,800);x.fillText(TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো"),90,lty);
 window.mcLinkGlow(x,o.site,L2,R2,1324,{cx:540,bg:"#1d6b43",fg:"#ffffff",size:30,min:18,col:"#0f9a62",glow:"rgba(52,214,130,.9)",blur:14,wt:800});
 x.fillStyle=MU;x.font=F(600,22,LHS);x.textAlign="left";x.fillText(o.date,90,1366);
 const q=o.qr;if(q){const sc=qs,m=2,bx=(q.size+2*m)*sc,qx=990-bx,qy=1226;rr(qx,qy,bx,bx,12);x.fillStyle="#fff";x.fill();x.strokeStyle="#bccbc0";x.lineWidth=2;x.stroke();x.fillStyle=FG;for(let yy=0;yy<q.size;yy++)for(let xx=0;xx<q.size;xx++)if(q.dark(xx,yy))x.fillRect(qx+(xx+m)*sc,qy+(yy+m)*sc,sc,sc)}
 return c}

window.drawCard2=drawCard2;window.bnD=bn;

// ====== ৩ নং কার্ড: গ্লাস রিং (ডার্ক নেভি + সোনালি ডিজাইন, ১০৮০×১৩৫০)। শুধু সাইটের নিজের তথ্য/লেখা ব্যবহার হয়; drawCard2-র সঙ্গে একই opts।
function drawCard3(o){
 const W=1080,H=1350,D=o.cw>0?dimFit(o.cw,Math.round(o.cw*H/W),W,H):dimFit(0,0,W,H),c=document.createElement("canvas");c.width=D[0];c.height=D[1];const x=c.getContext("2d");x.imageSmoothingQuality="high";x.scale(D[0]/W,D[1]/H);eqDigits(x);
 const HS="Hind Siliguri",F=(w,s,f)=>`${w} ${s}px "MCDigits",${f?f+",":""}"${HS}",sans-serif`;
 const BG="#0b2031",PANEL="#12304a",GOLD="#d4b45f",GREEN="#269c68",LAV="#d9c9fa",INK="#125b3d",AMB="#c87900";
 const rr=(X,Y,w,h,r)=>{r=Math.min(r,h/2,w/2);x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
 const fit=(t,w,s,wt,f)=>{x.font=F(wt,s,f);while(x.measureText(t).width>w&&s>14){s-=2;x.font=F(wt,s,f)}return s};
 // লেখাকে (cx, cy)-তে দৃশ্যমান মাঝখানে বসায় (বাংলা মাত্রা/অঙ্কেও ঠিক থাকে)
 const ctr=(t,cx,cy,al)=>{const m=x.measureText(t),a=m.actualBoundingBoxAscent||0,d=m.actualBoundingBoxDescent||0;x.textAlign=al||"center";x.textBaseline="alphabetic";x.fillText(t,cx,cy+(a-d)/2)};
 const logo=(im,cx,cy,r)=>{x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle="#fff";x.fill();x.clip();if(im){const k=r*1.7/Math.max(im.naturalWidth,im.naturalHeight);x.drawImage(im,cx-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k)}x.restore()};
 // eqDigits-এর মতো অঙ্ক-বড় করা মাপ ধরে লেখার প্রস্থ
 const eqW=t=>{t=String(t);const DG=/[\u09E6-\u09EF]/,hs=c=>{const m=x.measureText(c);return m.actualBoundingBoxAscent+m.actualBoundingBoxDescent},H=Math.max(0,...[...t].filter(c=>DG.test(c)).map(hs));if(!(H>0))return x.measureText(t).width;return(t.match(/[\u09E6-\u09EF]|[^\u09E6-\u09EF]+/g)||[]).reduce((s,p)=>{const m=x.measureText(p);let k=1;if(DG.test(p)){const h=hs(p);if(h>0)k=Math.min(1.5,H/h)}return s+m.width*k},0)};
 const P=Math.max(0,Math.min(100,+o.pct||0));
 // কার্ড ও সোনালি বর্ডার
 rr(1.5,1.5,W-3,H-3,48);x.fillStyle=BG;x.fill();x.lineWidth=3;x.strokeStyle=GOLD;x.stroke();
 x.save();rr(1.5,1.5,W-3,H-3,48);x.clip();
 // লোগো দুই পাশে
 window.mcLogoPair(x,o,4,logo,F,[112,86,52],[968,86,52]);
 // ওপরের লেখা: ব্র্যান্ড (অক্ষরের ফাঁকসহ), তার নিচে কলেজের নাম বড় করে, তারপর নাম
 {const br=TXG(o,"br","M.C COLLEGE EXPLORER"),gp=13;x.font=F(700,26,"Arial");const ws=[...br].map(ch=>x.measureText(ch).width),tot=ws.reduce((q,w)=>q+w+gp,0)-gp;let px=540-tot/2;x.fillStyle=GOLD;x.textAlign="left";x.textBaseline="alphabetic";[...br].forEach((ch,i)=>{x.fillText(ch,px,65);px+=ws[i]+gp})}
 // কলেজের নাম (ছোট, ইংরেজি) নামের ওপরে, তারপর নাম
 {const cl=TXG(o,"cl","MURARI CHAND COLLEGE, SYLHET"),g2=5;x.font=F(600,19,"Arial");const w2=[...cl].map(ch=>x.measureText(ch).width),T2=w2.reduce((q,w)=>q+w+g2,0)-g2;let qx=540-T2/2;x.fillStyle="#e6f1fb";x.textAlign="left";x.textBaseline="alphabetic";[...cl].forEach((ch,i)=>{x.fillText(ch,qx,99);qx+=w2[i]+g2})}
 x.fillStyle="#fff";const nm=String(o.name||"").toUpperCase();fit(nm,700,91,700,'"Barlow Condensed"');ctr(nm,540,160);
 // ক্লাস ব্যাজ (সাইটের ক্লাসের নাম)
 {const t=o.cname||"";x.font=F(700,44,"Arial");const w=Math.min(900,x.measureText(t).width+84);rr(540-w/2,214,w,84,60);x.fillStyle=GOLD;x.fill();x.fillStyle=BG;fit(t,w-84,44,700,"Arial");ctr(t,540,256)}
 // রিং
 {const cx=540,cy=588;
  // ভেতরের বেগুনি বৃত্ত (রিংয়ের ভেতরে)
  x.beginPath();x.arc(cx,cy,235,0,7);x.fillStyle=LAV;x.fill();
  // ফাঁকা অংশ: ক্রিস্টাল-ক্লিয়ার কাচের নল (দুই ধার চকচকে সাদা, ভেতর প্রায় স্বচ্ছ)
  {const gl=x.createRadialGradient(cx,cy,234,cx,cy,270);gl.addColorStop(0,"rgba(255,255,255,.95)");gl.addColorStop(.07,"rgba(255,255,255,.40)");gl.addColorStop(.25,"rgba(255,255,255,.12)");gl.addColorStop(.5,"rgba(255,255,255,.07)");gl.addColorStop(.75,"rgba(255,255,255,.12)");gl.addColorStop(.93,"rgba(255,255,255,.40)");gl.addColorStop(1,"rgba(255,255,255,.95)");
   x.save();x.shadowColor="rgba(255,255,255,.55)";x.shadowBlur=10;x.lineWidth=36;x.strokeStyle=gl;x.beginPath();x.arc(cx,cy,252,0,7);x.stroke();x.restore()}
  // ভরাট অংশ (সবুজ)
  if(P>0){x.lineWidth=36;x.strokeStyle=GREEN;x.lineCap="round";x.beginPath();x.arc(cx,cy,252,-Math.PI/2,-Math.PI/2+Math.PI*2*P/100);x.stroke();x.lineCap="butt"}
  // ভেতরে: শতাংশ, "জানি", উপাধি-পিল
  x.__raw=1;x.fillStyle=INK;const num=bn(P);let ns=240,ps,w1,w2,a1,T;const mz=()=>{x.font=F(700,ns);const m=x.measureText(num);w1=m.width;a1=m.actualBoundingBoxAscent||ns*.75;ps=Math.round(ns*.32);x.font=F(700,ps);w2=x.measureText("%").width;T=w1+w2+4};mz();while(ns>90&&Math.hypot(T/2,502-a1/2-cy)>222){ns-=6;mz()}
  const x0=cx-T/2;x.font=F(700,ns);x.textAlign="left";x.fillText(num,x0,502+a1/2);x.font=F(700,ps);x.fillText("%",x0+w1+4,502+a1/2);x.textAlign="center";x.__raw=0;
  x.fillStyle=AMB;x.font=F(700,76);ctr(TXG(o,"kn","জানি"),cx,628);
  const sub=TXG(o,"tag",window.mcCardTag?window.mcCardTag(P):"");
  // উপাধি-পিল (ডিজাইন ১৭: বেগুনি→গোলাপি গ্রেডিয়েন্ট, সাদা লেখা, ছায়া)। সবসময় রিংয়ের ভেতরের বৃত্তের (ব্যাসার্ধ ২৩৫) ভেতরে থাকে।
  // লেখা এক লাইনে ঠিকমতো (ফন্ট ৩০+) ধরলে এক লাইন; লম্বা হলে ফাঁকা জায়গায় ভেঙে ২ লাইন; তারপরেও না ধরলে ফন্ট নিজে ছোট হয়। বোল্ড নয়।
   {const R0=225,pad=24,geo=(h,y,r)=>{const dy=y+h-r-cy,l=Math.sqrt(Math.max(0,Math.pow(R0-r,2)-dy*dy));return 2*(l+r)},sz=(t,w,s)=>{x.font=F(500,s);while(x.measureText(t).width>w&&s>14){s-=2;x.font=F(500,s)}return s};
    let ph=64,py=690,r=32,TL=[sub],cap=geo(ph,py,r);const s1=sz(sub,cap-pad*2,38);
    if(s1<30&&/\s/.test(sub)){const ws=sub.trim().split(/\s+/);let best=null;for(let k=1;k<ws.length;k++){const a=ws.slice(0,k).join(" "),b=ws.slice(k).join(" ");x.font=F(500,32);const m=Math.max(x.measureText(a).width,x.measureText(b).width);if(!best||m<best[0])best=[m,a,b]}
     ph=92;py=682;r=34;TL=[best[1],best[2]];cap=geo(ph,py,r)}
    const fs=TL.length>1?Math.min(sz(TL[0],cap-pad*2,34),sz(TL[1],cap-pad*2,34)):s1;x.font=F(500,fs);
    const tw=Math.max(...TL.map(t=>x.measureText(t).width)),sw=Math.max(ph,Math.min(cap,tw+pad*2));
    x.save();x.shadowColor="rgba(8,24,38,.55)";x.shadowBlur=18;x.shadowOffsetY=7;const gp=x.createLinearGradient(cx-sw/2,0,cx+sw/2,0);gp.addColorStop(0,"#6a3fc0");gp.addColorStop(1,"#e0488a");
    rr(cx-sw/2,py,sw,ph,r);x.fillStyle=gp;x.fill();x.restore();
    x.fillStyle="#fff";x.font=F(500,fs);const mid=py+ph/2;if(TL.length>1){ctr(TL[0],cx,mid-fs*.56);ctr(TL[1],cx,mid+fs*.56)}else ctr(TL[0],cx,mid+1)}}
 // বামে ছবি
 {const cx=185,cy=870;x.beginPath();x.arc(cx,cy,135,0,7);x.fillStyle=GOLD;x.fill();x.save();x.beginPath();x.arc(cx,cy,125,0,7);x.clip();
  if(o.photo){const im=o.photo,k=250/Math.min(im.naturalWidth,im.naturalHeight);x.drawImage(im,cx-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k)}
  else{const g=x.createRadialGradient(cx,cy-40,10,cx,cy,125);g.addColorStop(0,"#1d4a6e");g.addColorStop(1,"#0f2a40");x.fillStyle=g;x.fillRect(cx-125,cy-125,250,250);
   x.beginPath();x.arc(cx,cy,104,0,7);x.lineWidth=2;x.strokeStyle="rgba(212,178,92,.45)";x.stroke();
   x.fillStyle=GOLD;x.font=F(700,130);ctr([...String(o.name||"M").trim()][0]||"M",cx,cy)}
  x.restore()}
 // ছবির নিচে ক্লাবের নাম (ক্লাব না থাকলে বিভাগের নাম)
 if(o.club||o.deptLabel||o.dept){const t=String(o.club||o.deptLabel||o.dept);x.font=F(700,28);const w=Math.min(300,x.measureText(t).width+48);rr(185-w/2,1018,w,46,23);x.fillStyle=PANEL;x.fill();x.lineWidth=3;x.strokeStyle=GOLD;x.stroke();x.fillStyle="#fff";fit(t,w-30,28,700);ctr(t,185,1041)}
 // ডানে বিভাগ পদক
 {const cx=891,cy=870,RL=rkL(o);x.beginPath();x.arc(cx,cy,135,0,7);x.fillStyle=PANEL;x.fill();x.lineWidth=8;x.strokeStyle=GOLD;x.beginPath();x.arc(cx,cy,131,0,7);x.stroke();
  x.fillStyle="#fff";fit(o.dept,190,38,700);ctr(o.dept,cx,808);fit(RL.cap,200,28,500);ctr(RL.cap,cx,845);
  const rk=RL.val;x.fillStyle=GOLD;fit(rk,190,84,700);ctr(rk,cx,906)}
 // উপাধি (আন্ডারলাইনসহ)
 {const t=String(o.title||"");x.fillStyle=GOLD;const s=fit(t,416,28,700);ctr(t,540,946);const w=x.measureText(t).width;x.fillRect(540-w/2,946+s*0.5+4,w,2)}
 // মার্ক-পিল
 if(o.score!=null){const t=bn(o.score)+" "+TXG(o,"mk","মার্ক পেয়ে");x.font=F(700,30);rr(776,1012,230,50,30);x.fillStyle=GOLD;x.fill();x.fillStyle=BG;fit(t,200,30,700);ctr(t,891,1037)}
 // গেম · সঠিক · র‍্যাঙ্ক সারি (flex space-between)
 {const g=String(o.game||"").toUpperCase(),okS=bn(o.ok)+"/"+bn(o.total),rkS=o.rank?bn(o.rank):"—",SP=" ",Y=1153;
  x.font=F(400,31);const gw=x.measureText(g).width,okw=eqW(okS),ok1=x.measureText(TXG(o,"l2","সঠিক")).width,sp=x.measureText(SP).width+8,rk1=x.measureText(TXG(o,"l3","র‍্যাঙ্ক")+" #").width,rkw=eqW(rkS);
  const t2=okw+sp+ok1,t3=rk1+rkw,gap=Math.max(10,(940-gw-t2-t3)/2),X1=70,X2=X1+gw+gap,X3=X2+t2+gap;
  x.fillStyle="#fff";ctr(g,X1,Y,"left");
  x.fillStyle=GOLD;ctr(okS,X2,Y,"left");x.fillStyle="#fff";ctr(TXG(o,"l2","সঠিক"),X2+okw+sp,Y,"left");
  x.fillStyle="#fff";ctr(TXG(o,"l3","র‍্যাঙ্ক")+" #",X3,Y,"left");x.fillStyle=GOLD;ctr(rkS,X3+rk1,Y,"left")}
 // ড্যাশ লাইন
 x.save();x.setLineDash([12,10]);x.strokeStyle="#2a4a66";x.lineWidth=3;x.beginPath();x.moveTo(70,1183);x.lineTo(1010,1183);x.stroke();x.restore();
 // নিচে: স্ক্যান করে খেলো, লিংক, তারিখ
 {const q=o.qr,qs=q?Math.max(2,Math.floor(132/(q.size+4))):0,bx=q?(q.size+4)*qs:0,qLeft=q?1025-bx:1010,mw=Math.max(300,qLeft-70-30);
  const L3=70,R3=qLeft-30,M3=(L3+R3)/2;x.fillStyle=GOLD;const CT=TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো");fit(CT,R3-L3,44,700);ctr(CT,70,1226,"left");
  window.mcLinkGlow(x,o.site,L3,R3,1284,{cx:540,shr:1,bg:"#269c68",fg:"#ffffff",wt:800,size:28,min:16,col:"#ece4ff",glow:"rgba(190,160,255,.95)",blur:16});
  x.fillStyle="#c5d3e0";x.font=F(500,26);ctr(o.date,70,1318,"left");
  if(q){const qx=1025-bx,qy=1198;rr(qx,qy,bx,bx,8);x.fillStyle="#fff";x.fill();const ox=Math.floor((bx-q.size*qs)/2),oy=ox;x.fillStyle="#10261b";for(let yy=0;yy<q.size;yy++)for(let xx=0;xx<q.size;xx++)if(q.dark(xx,yy))x.fillRect(qx+ox+xx*qs,qy+oy+yy*qs,qs,qs)}}
 x.restore();
 return c}
window.drawCard3=drawCard3;

// ====== ১ নং কার্ড: নেভি মেডালিয়ন — MC_Explorer_Editable_Card.html-এর ডিজাইন (৭২০×৯০০ লেআউট ১.৫× বড় করে ১০৮০×১৩৫০)। drawCard2-র সঙ্গে একই opts। ছবি দিলে ওপরে নামের বাঁয়ে গোল ছবি, না দিলে লুকানো থাকে।
function drawCard1(o){
 const W=1080,H=1350,D=o.cw>0?dimFit(o.cw,Math.round(o.cw*H/W),W,H):dimFit(0,0,W,H),c=document.createElement("canvas");c.width=D[0];c.height=D[1];const x=c.getContext("2d");x.imageSmoothingQuality="high";x.scale(D[0]/W,D[1]/H);eqDigits(x);
 x.save();x.scale(1.5,1.5); // এখন থেকে ৭২০×৯০০ মাপে আঁকা
 const HS="Hind Siliguri",F=(w,s,f)=>`${w} ${s}px "MCDigits",${f?f+",":""}"${HS}",sans-serif`;
 const NAVY="#0b2232",GOLD="#e5bd54",LAV="#d9c6fa",GREEN="#00a86b",WHITE="#f7f8fc",DG="#00633f",OR="#d88400";
 const rr=(X,Y,w,h,r)=>{r=Math.min(r,h/2,w/2);x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
 const fit=(t,w,s,wt,f)=>{x.font=F(wt,s,f);while(x.measureText(t).width>w&&s>12){s-=1;x.font=F(wt,s,f)}return s};
 const ctr=(t,cx,cy,al)=>{const m=x.measureText(t),a=m.actualBoundingBoxAscent||0,d=m.actualBoundingBoxDescent||0;x.textAlign=al||"center";x.textBaseline="alphabetic";x.fillText(t,cx,cy+(a-d)/2)};
 const eqW=t=>{t=String(t);const DGT=/[\u09E6-\u09EF]/,hs=c=>{const m=x.measureText(c);return m.actualBoundingBoxAscent+m.actualBoundingBoxDescent},HH=Math.max(0,...[...t].filter(c=>DGT.test(c)).map(hs));if(!(HH>0))return x.measureText(t).width;return(t.match(/[\u09E6-\u09EF]|[^\u09E6-\u09EF]+/g)||[]).reduce((s,p)=>{const m=x.measureText(p);let k=1;if(DGT.test(p)){const h=hs(p);if(h>0)k=Math.min(1.5,HH/h)}return s+m.width*k},0)};
 // অক্ষরের মাঝে ফাঁক দিয়ে মাঝখানে লেখা (CSS letter-spacing)
 const spaced=(t,cy,s,wt,gp,col,f)=>{x.font=F(wt,s,f);const ws=[...t].map(ch=>x.measureText(ch).width),tot=ws.reduce((q,w)=>q+w+gp,0)-gp;let px=360-tot/2;x.fillStyle=col;x.textAlign="left";x.textBaseline="alphabetic";[...t].forEach((ch,i)=>{x.fillText(ch,px,cy);px+=ws[i]+gp})};
 const logo=(im,cx,cy)=>{x.beginPath();x.arc(cx,cy,35,0,7);x.fillStyle=GOLD;x.fill();x.save();x.beginPath();x.arc(cx,cy,32,0,7);x.fillStyle="#fff";x.fill();x.clip();if(im){const k=54/Math.max(im.naturalWidth,im.naturalHeight);x.drawImage(im,cx-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k)}x.restore()};
 const P=Math.max(0,Math.min(100,+o.pct||0));
 // কার্ড ও সোনালি বর্ডার
 rr(1.5,1.5,717,897,35);x.fillStyle=NAVY;x.fill();x.lineWidth=3;x.strokeStyle=GOLD;x.stroke();
 x.save();rr(1.5,1.5,717,897,35);x.clip();
 // ওপরে দুই লোগো + ব্র্যান্ড + কলেজের নাম
 window.mcLogoPair(x,o,1,logo,F,[65,57,32],[655,57,32]);
 spaced(TXG(o,"br","M.C COLLEGE EXPLORER"),43,19,700,5,GOLD,"Arial");
 spaced(TXG(o,"cl","MURARI CHAND COLLEGE, SYLHET"),66,13,700,3,WHITE,"Arial");
 // নাম থেকে "তুমি কত?" লাইন পর্যন্ত সব একসাথে ১৫px (১০৮০ মাপে; ৭২০ লেআউটে ১০) ওপরে; লিংক, তারিখ, QR আগের জায়গায়
 x.save();x.translate(0,-10);
 // নাম (ছবি এখন বামের মেডালিয়নে বসে, নামের পাশে নয়)
 {x.fillStyle=WHITE;const nm=String(o.name||"").toUpperCase();fit(nm,696,47,700,"Arial");ctr(nm,360,135)}
 // ক্লাস ব্যাজ
 {const t=String(o.cname||"");x.font=F(700,28,"Arial");const w=Math.min(648,x.measureText(t).width+56);rr(360-w/2,183,w,58,40);x.fillStyle=GOLD;x.fill();x.fillStyle=NAVY;fit(t,w-56,28,700,"Arial");ctr(t,360,212)}
 // স্কোর রিং (সবুজ বর্ডার + বেগুনি ভেতর), ভেতরে: শতাংশ, "জানি", উপাধি-পিল
 {const cx=360,cy=435;x.beginPath();x.arc(cx,cy,180,0,7);x.fillStyle=GREEN;x.fill();x.beginPath();x.arc(cx,cy,158,0,7);x.fillStyle=LAV;x.fill();
  x.__raw=1;x.fillStyle=DG;{let ns=116,nu=bn(P),w1,w2,ps;const mz=()=>{x.font=F(700,ns);w1=x.measureText(nu).width;ps=Math.round(ns*.3);x.font=F(700,ps);w2=x.measureText("%").width};mz();while(w1+w2+4>215&&ns>50){ns-=4;mz()}
  x.font=F(700,ns);const m=x.measureText(nu),a=m.actualBoundingBoxAscent||ns*.72,d=m.actualBoundingBoxDescent||0,x0=cx-(w1+w2+4)/2,by=378+(a-d)/2;x.textAlign="left";x.fillText(nu,x0,by);x.font=F(700,ps);x.fillText("%",x0+w1+4,by);x.textAlign="center"}x.__raw=0;
  x.fillStyle=OR;x.font=F(700,40);ctr(TXG(o,"kn","জানি"),cx,445.5);
  const tg=TXG(o,"tag",window.mcCardTag?window.mcCardTag(P):"");
  if(tg){x.save();x.translate(cx,cy);x.scale(1/1.5,1/1.5);x.translate(-540,-588);
  {const cx=540,cy=588,sub=tg,F=(w,s,f)=>`${w} ${s}px "MCDigits","${f||"Anek Bangla"}","Hind Siliguri",sans-serif`;
   {const R0=225,pad=24,geo=(h,y,r)=>{const dy=y+h-r-cy,l=Math.sqrt(Math.max(0,Math.pow(R0-r,2)-dy*dy));return 2*(l+r)},sz=(t,w,s)=>{x.font=F(500,s);while(x.measureText(t).width>w&&s>14){s-=2;x.font=F(500,s)}return s};
    let ph=64,py=690,r=32,TL=[sub],cap=geo(ph,py,r);const s1=sz(sub,cap-pad*2,38);
    if(s1<30&&/\s/.test(sub)){const ws=sub.trim().split(/\s+/);let best=null;for(let k=1;k<ws.length;k++){const a=ws.slice(0,k).join(" "),b=ws.slice(k).join(" ");x.font=F(500,32);const m=Math.max(x.measureText(a).width,x.measureText(b).width);if(!best||m<best[0])best=[m,a,b]}
     ph=92;py=682;r=34;TL=[best[1],best[2]];cap=geo(ph,py,r)}
    const fs=TL.length>1?Math.min(sz(TL[0],cap-pad*2,34),sz(TL[1],cap-pad*2,34)):s1;x.font=F(500,fs);
    const tw=Math.max(...TL.map(t=>x.measureText(t).width)),sw=Math.max(ph,Math.min(cap,tw+pad*2));
    x.save();x.shadowColor="rgba(8,24,38,.55)";x.shadowBlur=18;x.shadowOffsetY=7;const gp=x.createLinearGradient(cx-sw/2,0,cx+sw/2,0);gp.addColorStop(0,"#6a3fc0");gp.addColorStop(1,"#e0488a");
    rr(cx-sw/2,py,sw,ph,r);x.fillStyle=gp;x.fill();x.restore();
    x.fillStyle="#fff";x.font=F(500,fs);const mid=py+ph/2;if(TL.length>1){ctr(TL[0],cx,mid-fs*.56);ctr(TL[1],cx,mid+fs*.56)}else ctr(TL[0],cx,mid+1)}}
  x.restore()}}
 // বামে "M" প্রতীক
 {const cx=121,cy=638,g=x.createRadialGradient(cx,cy,0,cx,cy,83);g.addColorStop(0,"#17415a");g.addColorStop(1,"#0c293c");
  x.beginPath();x.arc(cx,cy,90,0,7);x.fillStyle=g;x.fill();
  if(o.photo){x.save();x.beginPath();x.arc(cx,cy,84,0,7);x.clip();const im=o.photo,k=168/Math.min(im.naturalWidth,im.naturalHeight);x.drawImage(im,cx-im.naturalWidth*k/2,cy-im.naturalHeight*k/2,im.naturalWidth*k,im.naturalHeight*k);x.restore()}
  else{x.beginPath();x.arc(cx,cy,83,0,7);x.lineWidth=2;x.strokeStyle="#29485a";x.stroke()}
  x.beginPath();x.arc(cx,cy,87,0,7);x.lineWidth=6;x.strokeStyle=GOLD;x.stroke();
  if(!o.photo){x.fillStyle=GOLD;x.font=F(700,84,"Arial");ctr(([...String(o.name||"").trim()][0]||"M").toUpperCase(),cx,cy)}}
 // মেডালিয়নের নিচে ক্লাবের নাম (ক্লাব না থাকলে বিভাগের নাম), কার্ড ২/৩-এর মতো
 {const ct=String(o.club||o.deptLabel||o.dept||"");if(ct){x.font=F(700,18);const L0=22,R0=340,w=Math.min(R0-L0,Math.max(100,x.measureText(ct).width+24));let cl=121-w/2;if(cl<L0)cl=L0;if(cl+w>R0)cl=R0-w; // ডানের "মার্ক পেয়ে" পিলের একই রং ও ডিজাইন; ফাঁকা জায়গা পর্যন্ত লম্বা হয়, না ধরলে লেখা ছোট
 rr(cl,733,w,38,28);x.fillStyle=GOLD;x.fill();x.fillStyle=NAVY;fit(ct,w-24,18,700);ctr(ct,cl+w/2,752)}}
 // ডানে বিভাগ পদক: বিভাগের নাম / "বিভাগ" / র‍্যাঙ্ক
 {const cx=592,cy=638,dp=String(o.dept||""),RL=rkL(o);x.beginPath();x.arc(cx,cy,87,0,7);x.lineWidth=6;x.strokeStyle=GOLD;x.stroke();
  x.fillStyle=WHITE;fit(dp,150,23,500);ctr(dp,cx,596.5);fit(RL.cap,150,23,500);ctr(RL.cap,cx,629.5);
  const rk=RL.val;x.fillStyle=GOLD;fit(rk,130,48,700);ctr(rk,cx,671)}
 // মার্ক-পিল (পদকের নিচে)
 if(o.score!=null){const t=bn(o.score)+" "+TXG(o,"mk","মার্ক পেয়ে");x.font=F(700,18);const w=Math.max(160,x.measureText(t).width+24);rr(672-w,733,w,38,28);x.fillStyle=GOLD;x.fill();x.fillStyle=NAVY;fit(t,w-24,18,700);ctr(t,672-w/2,752)}
 // উপাধি (আন্ডারলাইনসহ)
 {const t=String(o.title||"");if(t){x.fillStyle=GOLD;fit(t,270,27,500);ctr(t,360,681);x.fillRect(287.5,701,145,2)}}
 // গেম · সঠিক · র‍্যাঙ্ক সারি (চারটা আইটেম সমান ফাঁকে)
 {const g=String(o.game||"").toUpperCase(),okS=bn(o.ok)+"/"+bn(o.total),rkS=o.rank?bn(o.rank):"—",RK=TXG(o,"l3","\u09B0\u200D\u09CD\u09AF\u09BE\u0999\u09CD\u0995")+" #",Y=803;
  x.font=F(400,20,"Arial");const gw=x.measureText(g).width;x.font=F(400,20);const okw=eqW(okS),ok1=x.measureText(TXG(o,"l2","সঠিক")).width,rk1=x.measureText(RK).width,rw=rk1+eqW(rkS);
  const sp1=x.measureText(" ").width+8,gap=Math.max(8,(636-gw-okw-sp1-ok1-rw)/2),X1=42,X2=X1+gw+gap,X3=X2+okw+sp1,X4=X3+ok1+gap;
  x.fillStyle=WHITE;x.font=F(400,20,"Arial");ctr(g,X1,Y,"left");
  x.font=F(400,20);x.fillStyle=GOLD;ctr(okS,X2,Y,"left");x.fillStyle=WHITE;ctr(TXG(o,"l2","সঠিক"),X3,Y,"left");ctr(RK,X4,Y,"left");ctr(rkS,X4+rk1,Y,"left")}
 // ড্যাশ লাইন
 x.save();x.setLineDash([6,5]);x.strokeStyle="#28506a";x.lineWidth=2;x.beginPath();x.moveTo(42,822);x.lineTo(678,822);x.stroke();x.restore();
 // নিচে: স্ক্যান করে খেলো, লিংক, তারিখ
 // QR মাপ (১০৮০ মাপে): ড্যাশ লাইনের ঠিক নিচ (১২২৬) থেকে কার্ডের নিচের কিনারা (১৩৩২) পর্যন্ত, ডান কিনারা ১০৫০
 const QB=106;
 {const q1=o.qr,L1=42,R1=q1?(1050-QB)/1.5-12:678,M1=(L1+R1)/2;
  x.fillStyle=GOLD;fit(TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো"),R1-L1,25,700);ctr(TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো"),42,846,"left");x.restore();
  window.mcLinkGlow(x,String(o.site||""),L1,R1,874,{cx:360,pd:2,shr:1,wt:800,bg:"#6b4fbb",fg:"#ffffff",size:19,min:11,col:"#e8e0ff",glow:"rgba(190,160,255,.95)",blur:10});
  x.fillStyle="#c5d2df";x.font=F(400,14);ctr(String(o.date||""),42,888,"left")}
 // QR (সাইটের নিজস্ব; ১০৮০ মাপে আঁকা যাতে দাগ স্পষ্ট থাকে)
 if(o.qr){const q=o.qr;x.scale(1/1.5,1/1.5);const bx=QB,qs=bx/(q.size+2),qx=1050-bx,qy=1226;rr(qx,qy,bx,bx,6);x.fillStyle="#fff";x.fill();x.fillStyle="#10261b";for(let yy=0;yy<q.size;yy++)for(let xx=0;xx<q.size;xx++)if(q.dark(xx,yy))x.fillRect(qx+(xx+1)*qs,qy+(yy+1)*qs,qs+0.6,qs+0.6);x.scale(1.5,1.5)}
 x.restore();x.restore();
 return c}
window.drawCard1=drawCard1;
window.drawK3=drawCard1;window.drawK=drawCard2;window.drawK2=drawCard3; // পুরোনো নামের alias (পুরোনো app.js/cards.js যেন ভাঙে না); নতুন কোডে drawCard1/2/3 ব্যবহার করো
// ক্যাম্পাসের উপাধি-লেখা (drawCard2-র ট্যাগলাইনের একই নিয়ম)
window.mcCardTag=P=>P>=100?"MC-র জীবন্ত গুগল ম্যাপ":P>=90?"MC পুরো মুখস্থ":P>=70?"ক্যাম্পাসের বস":P>=60?"ক্যাম্পাস চেনার ওস্তাদ":P>=56?"ক্যাম্পাসের পরিচিত মুখ":P>=48?"প্রায় পুরো এমসি চেনা":P>=40?"শহীদ মিনার পর্যন্ত চিনি":P>=30?"পুকুর পাড় পর্যন্ত চিনি":P>=20?"জারুল তলা পর্যন্ত চিনি":P>=10?"ক্যাম্পাসের নতুন অভিযাত্রী":"নতুন পথিক, এগিয়ে চলো";

// ৯:১৬ স্টোরি কার্ড (১০৮০×১৯২০ — ফেসবুক/ইনস্টাগ্রাম স্টোরির মাপ)
// জরুরি লেখা ও ছবি রাখা হয়েছে ওপরে ২৭০ আর নিচে ~৩৬০ পিক্সেলের নিরাপদ জায়গার ভেতরে, যাতে স্টোরির প্রোফাইল-বার ও রিপ্লাই-বার ঢেকে না দেয়।
window.drawStory = function (o) {
  const W = 1080, H = 1920, D = dimFit(o.sw, o.sh, W, H), c = document.createElement("canvas"); c.width = D[0]; c.height = D[1]; const x = c.getContext("2d"); x.scale(D[0] / W, D[1] / H); eqDigits(x);
  const F = (w, s, f) => `${w} ${s}px "MCDigits","${f || "Anek Bangla"}","Hind Siliguri",sans-serif`;
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
  const fit = (t, w, s, wt, f) => { x.font = F(wt, s, f); while (x.measureText(t).width > w && s > 18) { s -= 2; x.font = F(wt, s, f); } return s; };
  const bn = window.bnD, HS = "Hind Siliguri", Y = "#ffd84a", P = o.pct, col = o.col || "#d98200";
  const m = o.metal || { g: ["#fff36b", "#ffc400", "#d98200", "#ffe14d"], t: "#3a1d00" };
  const spark = (sx, sy, r) => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, q2 = i % 2 ? r * .28 : r; x.lineTo(sx + Math.cos(a) * q2, sy + Math.sin(a) * q2); } x.closePath(); x.fill(); };
  const logo = (im, cx, cy, r) => { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = "#fff"; x.fill(); x.clip(); if (im) { const k = r * 1.7 / Math.max(im.naturalWidth, im.naturalHeight); x.drawImage(im, cx - im.naturalWidth * k / 2, cy - im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); } x.restore(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.strokeStyle = Y; x.lineWidth = 4; x.stroke(); };

  // ---- পটভূমি ----
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0a2217"); bg.addColorStop(.45, "#12482f"); bg.addColorStop(1, "#08190f"); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const PY = 700; // ছবির কেন্দ্র
  const gl = x.createRadialGradient(540, PY, 40, 540, PY, 620); gl.addColorStop(0, col + "66"); gl.addColorStop(1, col + "00"); x.fillStyle = gl; x.fillRect(0, 0, W, 1500);
  x.save(); x.translate(540, PY); for (let i = 0; i < 20; i++) { x.rotate(Math.PI / 10); x.beginPath(); x.moveTo(0, 0); x.lineTo(-34, -1300); x.lineTo(34, -1300); x.closePath(); x.fillStyle = "rgba(255,255,255,.035)"; x.fill(); } x.restore();
  { let s = 11; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647; for (let i = 0; i < 80; i++) { const dx = rnd() * W, dy = rnd() * H, dr = 2 + rnd() * 5; x.beginPath(); x.arc(dx, dy, dr, 0, 7); x.fillStyle = `rgba(255,216,74,${(.05 + rnd() * .16).toFixed(2)})`; x.fill(); } }
  x.lineWidth = 12; x.strokeStyle = Y; rr(28, 28, W - 56, H - 56, 64); x.stroke();
  x.lineWidth = 2; x.strokeStyle = "rgba(255,216,74,.4)"; rr(50, 50, W - 100, H - 100, 48); x.stroke();

  // ---- শিরোনাম ----
  window.mcLogoPair(x, o, 8, logo, F, [150, 318, 58], [930, 318, 58]);
  x.textAlign = "center"; x.fillStyle = "#fff"; fit(TXG(o,"col","মুরারিচাঁদ কলেজ"), 610, 70, 800); x.fillText(TXG(o,"col","মুরারিচাঁদ কলেজ"), 540, 322);
  x.fillStyle = "#b9d3c2"; x.font = F(600, 28, HS); x.fillText(TXG(o,"colEn","Murari Chand College, Sylhet"), 540, 366);

  // ---- ক্লাস প্লেট (WINNER) ----
  { const GOLD = [m.g[0], m.g[1], m.g[3], m.g[2]], OUT = m.g[2], bx = 230, by = 396, bw = 620, bh = 84;
    x.fillStyle = Y; [[160, 440], [920, 440]].forEach(([sx, sy]) => spark(sx, sy, 20));
    if (o.tier === 1) { x.save(); x.shadowColor = col; x.shadowBlur = 40; rr(bx - 6, by - 6, bw + 12, bh + 25, 31); x.fillStyle = "#0c2218"; x.fill(); x.shadowColor = "transparent"; x.strokeStyle = "#f0b400"; x.lineWidth = 4; x.stroke(); x.restore(); }
    x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 24; x.shadowOffsetY = 12; rr(bx, by + 14, bw, bh, 26); x.fillStyle = GOLD[3]; x.fill(); x.shadowColor = "transparent";
    rr(bx, by, bw, bh, 26); const pg = x.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, GOLD[0]); pg.addColorStop(.35, GOLD[1]); pg.addColorStop(1, GOLD[2]); x.fillStyle = pg; x.fill();
    rr(bx + 8, by + 8, bw - 16, bh * .34, 14); x.fillStyle = "rgba(255,255,255,.4)"; x.fill();
    rr(bx, by, bw, bh, 26); x.strokeStyle = OUT; x.lineWidth = 6; x.stroke(); x.strokeStyle = "#fff"; x.lineWidth = 3; x.stroke(); x.restore();
    x.textAlign = "center"; x.fillStyle = m.t; x.font = F(700, 20, HS); x.fillText(TXG(o,"win","★  WINNER  ★"), bx + bw / 2, by + 27); fit(o.cname, bw - 70, 46, 800); x.fillText(o.cname, bx + bw / 2, by + bh - 15); }

  // ---- মাঝে ছবি ----
  { const R = 165, cx = 540, cy = PY;
    x.save(); x.shadowColor = col; x.shadowBlur = 50; x.beginPath(); x.arc(cx, cy, R + 22, 0, 7); x.fillStyle = col; x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R + 10, 0, 7); x.fillStyle = "#fff"; x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
    if (o.photo) { const im = o.photo, k = (R * 2) / Math.min(im.naturalWidth, im.naturalHeight); x.drawImage(im, cx - im.naturalWidth * k / 2, cy - im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); }
    else { const pg2 = x.createLinearGradient(0, cy - R, 0, cy + R); pg2.addColorStop(0, "#e9f2ec"); pg2.addColorStop(1, "#bfd8c7"); x.fillStyle = pg2; x.fillRect(cx - R, cy - R, R * 2, R * 2); x.fillStyle = "#1d6b43"; x.font = F(800, 190); x.textAlign = "center"; x.fillText([...o.name][0] || "M", cx, cy + 66); }
    x.restore();
    x.beginPath(); x.arc(cx, cy, R + 34, 0, 7); x.strokeStyle = "rgba(255,216,74,.65)"; x.lineWidth = 3; x.setLineDash([3, 14]); x.lineCap = "round"; x.stroke(); x.setLineDash([]); x.lineCap = "butt";
    if (P >= 70) { x.fillStyle = Y; [[cx - 215, cy - 120, 20], [cx + 215, cy - 130, 16], [cx - 235, cy + 80, 13], [cx + 232, cy + 40, 18], [cx, cy - R - 52, 14]].forEach(a => spark(...a)); }
    // বিভাগ র‍্যাঙ্ক পদক
    const mx = cx + 145, my = cy + 145, RL = rkL(o), rk = RL.val;
    x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 16; x.shadowOffsetY = 6; x.beginPath(); x.arc(mx, my, 66, 0, 7); x.fillStyle = "#1d6b43"; x.fill(); x.restore();
    x.beginPath(); x.arc(mx, my, 66, 0, 7); x.strokeStyle = Y; x.lineWidth = 7; x.stroke();
    x.textAlign = "center"; x.fillStyle = "#cfe8d8"; fit(RL.cap, 100, 20, 600, HS); x.fillText(RL.cap, mx, my - 18); x.fillStyle = Y; fit(rk, 90, 46, 800); x.fillText(rk, mx, my + 32); }

  // ---- নাম ও চিপ ----
  x.textAlign = "center"; x.fillStyle = "#fff"; fit(o.name, 920, 80, 800); x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 10; x.shadowOffsetY = 4; x.fillText(o.name, 540, 992); x.restore();
  { const chips = []; if (o.deptLabel || o.dept) chips.push([o.deptLabel || o.dept, "#e7eee8", "#0f6b46"]);
    if (o.batch && o.batch !== o.dept) chips.push([/\d/.test(o.batch) ? TXG(o,"sesL","সেশন ") + o.batch : o.batch, "#fff1d6", "#9a5b00"]);
    if (o.club) chips.push([o.club, "#6a3fd1", "#ffffff"]);
    let fs = 28, gap = 14; const meas = () => { x.font = F(700, fs, HS); return chips.map(ch => x.measureText(ch[0]).width + 46); };
    let ws = meas(); while (ws.reduce((a, b) => a + b, 0) + gap * (chips.length - 1) > 940 && fs > 16) { fs -= 2; ws = meas(); }
    let cx0 = 540 - (ws.reduce((a, b) => a + b, 0) + gap * (chips.length - 1)) / 2; x.textAlign = "center";
    chips.forEach((ch, i) => { rr(cx0, 1018, ws[i], 48, 24); x.fillStyle = ch[1]; x.fill(); x.fillStyle = ch[2]; x.font = F(700, fs, HS); x.fillText(ch[0], cx0 + ws[i] / 2, 1018 + 33); cx0 += ws[i] + gap; }); }

  // ---- বড় শতাংশ (সংখ্যা + %) — কার্ডের সবচেয়ে বড় লেখা ----
  x.__raw = 1; { const num = bn(P), NB = 800; let ns = 340, ps = 110; const meas = () => { x.font = F(NB, ns); const w1 = x.measureText(num).width; x.font = F(NB, ps); return [w1, x.measureText("%").width]; };
    let [w1, w2] = meas(); const gap = 6; while (w1 + w2 + gap > 880 && ns > 120) { ns -= 10; ps -= 3.2; [w1, w2] = meas(); }
    const x0 = 540 - (w1 + w2 + gap) / 2, by2 = 1322; x.textAlign = "left";
    x.save(); x.shadowColor = col; x.shadowBlur = 55; const ng = x.createLinearGradient(0, by2 - ns * .75, 0, by2); ng.addColorStop(0, "#fff3a0"); ng.addColorStop(1, "#ffb300"); x.fillStyle = ng;
    x.font = F(NB, ns); x.fillText(num, x0, by2); x.font = F(NB, ps); x.fillText("%", x0 + w1 + gap, by2); x.restore(); x.textAlign = "center"; } x.__raw = 0;
  x.fillStyle = "#fff"; x.font = F(800, 72, HS); x.textAlign = "center"; x.fillText(TXG(o,"kn","MC জানি"), 540, 1405);

  // ---- ট্যাগলাইন পিল (যেমন "MC পুরো মুখস্থ") ----
  { const tg = TXG(o,"tag", P >= 100 ? "MC-র জীবন্ত গুগল ম্যাপ" : P >= 90 ? "MC পুরো মুখস্থ" : P >= 70 ? "ক্যাম্পাসের বস" : P >= 60 ? "ক্যাম্পাস চেনার ওস্তাদ" : P >= 56 ? "ক্যাম্পাসের পরিচিত মুখ" : P >= 48 ? "প্রায় পুরো এমসি চেনা" : P >= 40 ? "শহীদ মিনার পর্যন্ত চিনি" : P >= 30 ? "পুকুর পাড় পর্যন্ত চিনি" : P >= 20 ? "জারুল তলা পর্যন্ত চিনি" : P >= 10 ? "ক্যাম্পাসের নতুন অভিযাত্রী" : "নতুন পথিক, এগিয়ে চলো");
    x.font = F(800, 48, HS); const tw = Math.min(940, x.measureText(tg).width + 110), ty = 1434, th = 74;
    x.save(); x.shadowColor = "rgba(0,0,0,.4)"; x.shadowBlur = 18; x.shadowOffsetY = 8; rr(540 - tw / 2, ty, tw, th, 37); const tgr = x.createLinearGradient(0, ty, 0, ty + th); tgr.addColorStop(0, "#17432f"); tgr.addColorStop(1, "#0b2018"); x.fillStyle = tgr; x.fill(); x.restore();
    rr(540 - tw / 2, ty, tw, th, 37); x.strokeStyle = Y; x.lineWidth = 5; x.stroke(); rr(540 - tw / 2 + 9, ty + 9, tw - 18, th - 18, 28); x.strokeStyle = "rgba(255,216,74,.45)"; x.lineWidth = 2; x.stroke();
    x.fillStyle = Y; x.textAlign = "center"; fit(tg, tw - 70, 48, 800, HS); x.fillText(tg, 540, ty + 52); }

  // ---- তথ্য বক্স: মার্ক · সঠিক · র‍্যাঙ্ক ----
  [[TXG(o,"l1","মার্ক"), bn(o.score != null ? o.score : P * 10) + "/১০০০"], [TXG(o,"l2","সঠিক উত্তর"), bn(o.ok) + "/" + bn(o.total)], [TXG(o,"l3","সবার মধ্যে"), o.rank ? bn(o.rank) + " " + TXG(o,"rkn","নম্বর") : "—"]].forEach(([l, v], i) => {
    const X = 90 + i * 305, Yb = 1540, w = 290, h = 86; rr(X, Yb, w, h, 26); x.fillStyle = "rgba(255,255,255,.09)"; x.fill(); x.strokeStyle = "rgba(255,216,74,.7)"; x.lineWidth = 2.5; x.stroke();
    x.textAlign = "center"; x.fillStyle = "#b9d3c2"; x.font = F(600, 24, HS); x.fillText(l, X + w / 2, Yb + 32); x.fillStyle = "#fff"; fit(v, w - 30, 38, 800); x.fillText(v, X + w / 2, Yb + 74); });

  // ---- সেরা চেনা জায়গা ----
  if (o.best && o.best !== "—") { const t = TXG(o,"bestL","📍 সেরা চেনা জায়গা:") + " " + o.best; x.fillStyle = Y; x.textAlign = "center"; fit(t, 900, 32, 700, HS); x.fillText(t, 540, 1672); }

  // ---- নিচে: স্ক্যান করে খেলো ----
  x.save(); x.setLineDash([12, 10]); x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 3; x.beginPath(); x.moveTo(110, 1706); x.lineTo(970, 1706); x.stroke(); x.restore();
  { const K1 = TXG(o,"scan","তুমি কত? স্ক্যান করে খেলো"), q0 = o.qr, bx0 = q0 ? (q0.size + 6) * Math.max(2, Math.floor(130 / (q0.size + 6))) : 0, L = 70, R = q0 ? 970 - bx0 - 28 : 1010;
    x.fillStyle = "#fff"; x.textAlign = "left"; fit(K1, R - 110, 42, 800); x.fillText(K1, 110, 1766);
    window.mcLinkGlow(x, o.site, L, R, 1826, { cx: 540, wt: 800, bg: "#e11d48", fg: "#ffffff", size: 34, min: 20, col: "#ffe066", glow: "rgba(255,216,74,.95)", blur: 20 }); }
  const q = o.qr; if (q) { const sc = Math.max(2, Math.floor(130 / (q.size + 6))), bx = (q.size + 6) * sc, qx = 970 - bx, qy = 1720; rr(qx, qy, bx, bx, 14); x.fillStyle = "#fff"; x.fill(); x.fillStyle = "#10261b"; for (let yy = 0; yy < q.size; yy++) for (let xx = 0; xx < q.size; xx++) if (q.dark(xx, yy)) x.fillRect(qx + (xx + 3) * sc, qy + (yy + 3) * sc, sc, sc); }
  return c;
};

var calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reflets de vernis sur le bois, sur ordinateur
(function(){
if(!matchMedia('(min-width:901px) and (pointer:fine)').matches)return;
const c=document.getElementById('liquid');
const gl=c.getContext('webgl',{antialias:false,premultipliedAlpha:false});
if(!gl){return;}
const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fs=`precision highp float;
uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;
float h(vec2 p){
float t=T*.16;
vec2 d1=normalize(vec2(.8,.6)),d2=normalize(vec2(-.5,.87));
float u=dot(p,d1),w=dot(p,d2);
float warp=.9*sin(w*.55+t*.8+S*.5)+.45*sin(w*1.3-t*1.1)+.25*sin(u*.7+t*.6);
float v=0.;
v+=sin(u*1.25+warp+t)*.7;
v+=sin(u*2.1+warp*1.4-t*.7+S)*.28;
v+=sin(w*.8+u*.3-t*.5)*.22;
return v;
}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*R)/R.y*2.4;
float e=.004;
float hx=(h(uv+vec2(e,0.))-h(uv-vec2(e,0.)))/(2.*e);
float hy=(h(uv+vec2(0.,e))-h(uv-vec2(0.,e)))/(2.*e);
vec3 n=normalize(vec3(-hx*.9,-hy*.9,1.));
vec3 V=vec3(0.,0.,1.);
vec3 L1=normalize(vec3(.5+M.x*.5,.38+M.y*.4,.75));
vec3 L2=normalize(vec3(-.6,-.45,.7));
vec3 H1=normalize(L1+V),H2=normalize(L2+V);
float d1=max(dot(n,L1),0.);
float s1=pow(max(dot(n,H1),0.),90.);
float s1b=pow(max(dot(n,H1),0.),9.);
float s2=pow(max(dot(n,H2),0.),40.);
float fold=smoothstep(.0,1.,1.-n.z);
vec3 col=vec3(.012,.009,.006);
col+=vec3(.05,.032,.018)*pow(d1,3.);
col+=vec3(1.,.84,.56)*s1*.1;
col+=vec3(.6,.4,.22)*s1b*.04;
col+=vec3(.95,.66,.3)*s2*.045;
col*=1.-fold*.35;
vec2 q=gl_FragCoord.xy/R;
col*=.55+.45*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),.25);
col=pow(col,vec3(.92));
gl_FragColor=vec4(col,1.);
}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o;}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const uR=gl.getUniformLocation(pr,'R'),uT=gl.getUniformLocation(pr,'T'),uM=gl.getUniformLocation(pr,'M'),uS=gl.getUniformLocation(pr,'S');
let mx=0,my=0,tx=0,ty=0,sc=0;
addEventListener('pointermove',e=>{tx=e.clientX/innerWidth*2-1;ty=-(e.clientY/innerHeight*2-1);});
function size(){const dpr=Math.min(devicePixelRatio||1,1.5)*.75;c.width=innerWidth*dpr;c.height=innerHeight*dpr;gl.viewport(0,0,c.width,c.height);}
size();addEventListener('resize',size);
const t0=performance.now();
let prev=0;
(function loop(now){
requestAnimationFrame(loop);
if(now-prev<33)return;prev=now;
mx+=(tx-mx)*.08;my+=(ty-my)*.08;sc+=(scrollY/innerHeight*.9-sc)*.12;
gl.uniform2f(uR,c.width,c.height);gl.uniform1f(uT,calme?0:(performance.now()-t0)/1000);
gl.uniform2f(uM,mx,my);gl.uniform1f(uS,sc);
gl.drawArrays(gl.TRIANGLES,0,3);
})(0);
})();
// Le bois glisse doucement au défilement
(function(){
if(calme||matchMedia('(max-width:900px)').matches)return;
const b=document.getElementById('bois');let c=0,last=-1;
(function tick(){
const max=document.documentElement.scrollHeight-innerHeight;
c+=((max>0?scrollY/max:0)-c)*.1;
if(Math.abs(c-last)>.0006){last=c;b.style.transform='translate3d(0,'+(-c*11).toFixed(2)+'vh,0)';}
requestAnimationFrame(tick);
})();
})();
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40),{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*.08+'s';io.observe(el);});
const simg=document.getElementById('studio-img');
if(!calme)addEventListener('scroll',()=>{const r=simg.parentElement.getBoundingClientRect();const p=(r.top+r.height/2-innerHeight/2)/innerHeight;simg.style.transform='translateY('+(-8+p*-8)+'%)';},{passive:true});
// Verre liquide : les bords des grands cadres dévient le bois qui passe derrière (Chrome et Edge sur ordinateur)
(function(){
const ua=navigator.userAgent;
if(calme||!/Chrome\/\d/.test(ua)||/Mobile|Android/.test(ua)||!matchMedia('(min-width:901px)').matches)return;
const NS='http://www.w3.org/2000/svg';
const svg=document.createElementNS(NS,'svg');
svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
document.body.appendChild(svg);
function carte(w,h,r,bord){
const k=.5,W=Math.max(2,Math.round(w*k)),H=Math.max(2,Math.round(h*k));
const cv=document.createElement('canvas');cv.width=W;cv.height=H;
const ctx=cv.getContext('2d'),im=ctx.createImageData(W,H),d=im.data;
for(let j=0;j<H;j++)for(let i=0;i<W;i++){
const x=(i+.5)/k,y=(j+.5)/k;
const qx=Math.abs(x-w/2)-(w/2-r),qy=Math.abs(y-h/2)-(h/2-r);
const ax=Math.max(qx,0),ay=Math.max(qy,0),ext=Math.hypot(ax,ay);
const dist=ext+Math.min(Math.max(qx,qy),0)-r;
const t=Math.min(1,Math.max(0,-dist/bord)),force=t>=1?0:Math.pow(1-t,2.4);
let nx,ny;
if(ext>0){nx=ax/ext;ny=ay/ext;}else if(qx>qy){nx=1;ny=0;}else{nx=0;ny=1;}
nx*=x<w/2?-1:1;ny*=y<h/2?-1:1;
const p=(j*W+i)*4;
d[p]=128-127*nx*force;d[p+1]=128-127*ny*force;d[p+2]=128;d[p+3]=255;
}
ctx.putImageData(im,0,0);
return cv.toDataURL();
}
function poser(el,i){
const w=el.offsetWidth,h=el.offsetHeight;
if(!w||!h)return;
const r=parseFloat(getComputedStyle(el).borderTopLeftRadius)||26;
const id='lentille'+i;
let f=document.getElementById(id);if(f)f.remove();
f=document.createElementNS(NS,'filter');
f.id=id;
[['filterUnits','userSpaceOnUse'],['x',0],['y',0],['width',w],['height',h],['color-interpolation-filters','sRGB']].forEach(a=>f.setAttribute(a[0],a[1]));
const img=document.createElementNS(NS,'feImage');
[['href',carte(w,h,r,Math.min(46,Math.min(w,h)*.24))],['x',0],['y',0],['width',w],['height',h],['preserveAspectRatio','none'],['result','carte']].forEach(a=>img.setAttribute(a[0],a[1]));
const dep=document.createElementNS(NS,'feDisplacementMap');
[['in','SourceGraphic'],['in2','carte'],['scale',84],['xChannelSelector','R'],['yChannelSelector','G']].forEach(a=>dep.setAttribute(a[0],a[1]));
f.appendChild(img);f.appendChild(dep);svg.appendChild(f);
el.style.backdropFilter='url(#'+id+') blur(3px) saturate(120%)';
}
const els=[].slice.call(document.querySelectorAll('.lentille'));
const tailles=new Map();
const ro=new ResizeObserver(es=>es.forEach(e=>{
const el=e.target,w=el.offsetWidth,h=el.offsetHeight,cle=w+'x'+h;
if(tailles.get(el)===cle)return;tailles.set(el,cle);
clearTimeout(el._lentille);el._lentille=setTimeout(()=>poser(el,els.indexOf(el)),120);
}));
els.forEach(el=>ro.observe(el));
})();
// Note Google : de 0 à 5,0, très vite, dès l'ouverture de la page
(function(){
if(calme)return;
const NOTE=5,AVIS=38,DUREE=900;
const c=document.getElementById('note-chiffre'),e=document.getElementById('note-etoiles'),n=document.getElementById('note-avis');
c.textContent='0,0';e.style.width='0%';n.textContent='0';
let t0=null;
function pas(t){
if(t0===null)t0=t;
const p=Math.min(1,(t-t0)/DUREE),k=1-Math.pow(1-p,3);
c.textContent=(NOTE*k).toFixed(1).replace('.',',');
e.style.width=(k*100)+'%';
n.textContent=Math.round(AVIS*k);
if(p<1)requestAnimationFrame(pas);
}
setTimeout(()=>requestAnimationFrame(pas),220);
})();
// Le jour d'aujourd'hui dans les horaires, et l'année en bas de page
(function(){
const now=new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Paris'}));
const li=document.querySelector('#hours li[data-d="'+now.getDay()+'"]');if(li)li.classList.add('today');
document.getElementById('yr').textContent=now.getFullYear();
})();

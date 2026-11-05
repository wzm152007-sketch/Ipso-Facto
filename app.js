// Aucune boucle permanente : quand le visiteur ne fait rien, le site ne calcule plus rien.
var calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Apparition des blocs, une seule fois
const vus=new IntersectionObserver(es=>es.forEach(e=>{
if(!e.isIntersecting)return;
const t=e.target;t.classList.add('in');vus.unobserve(t);
setTimeout(()=>{t.classList.add('fini');t.style.transitionDelay='';},1000);
}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*.06+'s';vus.observe(el);});
if(!calme){
// Un reflet traverse le bois à l'arrivée sur chaque partie de la page
const bande=document.querySelector('#reflets i');let dernier=-9999;
function balayer(){
const t=performance.now();
if(document.hidden||t-dernier<5000)return;
dernier=t;bande.style.visibility='visible';
bande.animate([{transform:'translate3d(-60vmax,0,0) rotate(16deg)'},{transform:'translate3d(calc(100vw + 20vmax),0,0) rotate(16deg)'}],{duration:2400,easing:'cubic-bezier(.45,.05,.55,.95)'}).onfinish=()=>{bande.style.visibility='hidden';};
}
const parties=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))balayer();},{threshold:.2});
document.querySelectorAll('section.block').forEach(s=>parties.observe(s));
// Un reflet doux suit la souris, seulement quand elle bouge
if(matchMedia('(pointer:fine)').matches){
const lampe=document.querySelector('#reflets b');let repos=0;
addEventListener('pointermove',e=>{
lampe.style.transform='translate3d('+e.clientX+'px,'+e.clientY+'px,0)';lampe.style.opacity=1;
clearTimeout(repos);repos=setTimeout(()=>{lampe.style.opacity=0;},1400);
},{passive:true});
}
// Note Google : de 0 à 5,0, très vite, dès l'ouverture, puis un éclat sur le nom doré
const c=document.getElementById('note-chiffre'),e=document.getElementById('note-etoiles'),n=document.getElementById('note-avis');
const NOTE=5,AVIS=38,DUREE=900;let t0=null;
c.textContent='0,0';e.style.width='0%';n.textContent='0';
function pas(t){
if(t0===null)t0=t;
const p=Math.min(1,(t-t0)/DUREE),k=1-Math.pow(1-p,3);
c.textContent=(NOTE*k).toFixed(1).replace('.',',');
e.style.width=(k*100)+'%';
n.textContent=Math.round(AVIS*k);
if(p<1){requestAnimationFrame(pas);return;}
document.body.classList.add('charge');
setTimeout(()=>document.body.classList.remove('charge'),1600);
}
setTimeout(()=>requestAnimationFrame(pas),220);
}
// La carte Google n'est chargée que si le visiteur la demande
document.getElementById('voir-carte').addEventListener('click',function(){
const f=document.createElement('iframe');
f.title='Carte : 28 avenue de la Fontenelle, Golbey';
f.referrerPolicy='no-referrer-when-downgrade';
f.src='https://maps.google.com/maps?q=28%20avenue%20de%20la%20Fontenelle%2C%2088190%20Golbey&z=16&output=embed';
this.replaceWith(f);
});
// Le jour d'aujourd'hui dans les horaires, et l'année en bas de page
(function(){
const now=new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Paris'}));
const li=document.querySelector('#hours li[data-d="'+now.getDay()+'"]');if(li)li.classList.add('today');
document.getElementById('yr').textContent=now.getFullYear();
})();

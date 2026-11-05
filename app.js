var calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reflets or et bois sur fond noir
(function(){
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
col+=vec3(.08,.05,.028)*pow(d1,3.);
col+=vec3(1.,.82,.5)*s1*.34;
col+=vec3(.6,.4,.22)*s1b*.13;
col+=vec3(.95,.66,.3)*s2*.16;
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
(function loop(){
mx+=(tx-mx)*.04;my+=(ty-my)*.04;sc+=(scrollY/innerHeight*.9-sc)*.06;
gl.uniform2f(uR,c.width,c.height);gl.uniform1f(uT,calme?0:(performance.now()-t0)/1000);
gl.uniform2f(uM,mx,my);gl.uniform1f(uS,sc);
gl.drawArrays(gl.TRIANGLES,0,3);requestAnimationFrame(loop);
})();
})();
// Fond au défilement : une visite du magasin, de photo en photo
(function(){
const canvas=document.getElementById('bgvideo'),ctx=canvas.getContext('2d');
const scenes=[
{src:'img/fond-bleu.jpg',z:[1.02,1.16],x:[.5,.5],y:[.42,.34]},
{src:'img/fond-etageres.jpg',z:[1.16,1.02],x:[.34,.56],y:[.5,.5]},
{src:'img/fond-miroir.jpg',z:[1.02,1.14],x:[.5,.5],y:[.36,.6]},
{src:'img/fond-enfant.jpg',z:[1.14,1.02],x:[.62,.4],y:[.5,.5]},
{src:'img/fond-sapin.jpg',z:[1.02,1.12],x:[.5,.5],y:[.3,.62]}
];
scenes.forEach((s,i)=>{const im=new Image();im.decoding='async';im.src=s.src;im.onload=()=>{last=-1;};s.im=im;});
let cur=0,last=-1;
const lerp=(a,t)=>a[0]+(a[1]-a[0])*t;
const borne=(v,a,b)=>Math.max(a,Math.min(b,v));
function peindre(s,t,alpha){
const im=s.im;if(!im.complete||!im.naturalWidth)return;
const cw=canvas.width,ch=canvas.height,ir=im.naturalWidth/im.naturalHeight,z=lerp(s.z,t);
let w,h;
if(cw/ch>ir){w=cw*z;h=w/ir;}else{h=ch*z;w=h*ir;}
const x=borne(cw/2-w*lerp(s.x,t),cw-w,0),y=borne(ch/2-h*lerp(s.y,t),ch-h,0);
ctx.globalAlpha=alpha;ctx.drawImage(im,x,y,w,h);ctx.globalAlpha=1;
}
function draw(){
const n=scenes.length,f=cur*(n-1),i=Math.min(Math.floor(f),n-2),t=f-i;
const m=borne((t-.3)/.4,0,1),a=m*m*(3-2*m);
peindre(scenes[i],.5+t/2,1);
if(a>0)peindre(scenes[i+1],t/2,a);
}
function size(){const d=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*d;canvas.height=innerHeight*d;last=-1;}
function tick(){
const max=document.documentElement.scrollHeight-innerHeight;
const p=max>0?borne(scrollY/max,0,1):0;
cur+=(p-cur)*(calme?1:.12);
if(Math.abs(cur-last)>.0004){last=cur;draw();}
requestAnimationFrame(tick);
}
addEventListener('resize',size);size();tick();
})();
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40),{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*.08+'s';io.observe(el);});
const simg=document.getElementById('studio-img');
if(!calme)addEventListener('scroll',()=>{const r=simg.parentElement.getBoundingClientRect();const p=(r.top+r.height/2-innerHeight/2)/innerHeight;simg.style.transform='translateY('+(-8+p*-8)+'%)';},{passive:true});
// Horaires : ouvert ou fermé, à l'heure de Golbey
(function(){
const SEMAINE=[[540,720],[840,1140]],SAMEDI=[[540,720],[840,1080]];
const H={0:[],1:[[840,1080]],2:SEMAINE,3:SEMAINE,4:SEMAINE,5:SEMAINE,6:SAMEDI};
const now=new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Paris'}));
const d=now.getDay(),m=now.getHours()*60+now.getMinutes();
const open=H[d].some(p=>m>=p[0]&&m<p[1]);
document.getElementById('open-dot').classList.toggle('on',open);
document.getElementById('open-txt').textContent=open?'Ouvert maintenant':'Fermé actuellement';
const li=document.querySelector('#hours li[data-d="'+d+'"]');if(li)li.classList.add('today');
document.getElementById('yr').textContent=now.getFullYear();
})();
// Estimation de reprise
(function(){
    var form = document.getElementById('f-estimer');
    var champMarque = document.getElementById('e-marque'), champModele = document.getElementById('e-modele');
    var depot = document.getElementById('depot'), champPhoto = document.getElementById('e-photo'), apercu = document.getElementById('e-apercu');
    var envoi = document.getElementById('e-envoi'), msg = document.getElementById('e-msg'), resultat = document.getElementById('e-resultat');
    var LIBELLE = envoi.textContent;
    var MESSAGES = {
      indisponible: 'L’estimation en ligne n’est pas disponible pour le moment. Appelez-nous au 03 72 73 95 43, ou passez en magasin.',
      non_branche: 'L’analyse par photo n’est pas disponible pour le moment. Choisissez votre marque dans la liste, ou appelez-nous au 03 72 73 95 43.',
      cle_refusee: 'L’analyse par photo n’est pas disponible pour le moment. Choisissez votre marque dans la liste, ou appelez-nous au 03 72 73 95 43.',
      quota: 'L’analyse par photo est saturée pour le moment. Réessayez un peu plus tard, ou choisissez votre marque dans la liste.',
      trop_de_demandes: 'Vous avez envoyé beaucoup de photos d’affilée. Réessayez dans quelques minutes, ou choisissez votre marque dans la liste.',
      ajouter_photo: 'Cette marque n’est pas dans la liste. Ajoutez une photo pour une première estimation, ou montrez la paire à nos opticiens.',
      pas_de_lunettes: 'Nous ne voyons pas de lunettes sur cette photo. Essayez avec la paire posée à plat, de face.',
      plusieurs_paires: 'Nous voyons plusieurs paires. Photographiez-en une seule à la fois.',
      photo_floue: 'La photo est trop floue ou trop sombre. Essayez à la lumière du jour, la paire posée à plat.',
      image: 'Cette image ne peut pas être lue. Essayez avec une photo au format JPEG ou PNG.',
      format: 'Ce format d’image ne s’ouvre pas ici. Essayez avec une photo au format JPEG ou PNG.',
      vide: 'Choisissez d’abord la marque de vos lunettes.',
      vide_photo: 'Choisissez une marque, ou ajoutez une photo.',
      reseau: 'La connexion a échoué. Vérifiez votre réseau et réessayez.'
    };
    var MOTIFS = {
      hors_liste: 'Cette marque n’est pas encore dans notre liste. Montrez la paire à nos opticiens, ils l’estimeront sur place.',
      connectees: 'Nous ne pouvons pas estimer une paire connectée à distance, car il faut aussi contrôler son électronique. Montrez-la à nos opticiens.'
    };
    var ERREUR = 'L’estimation n’a pas abouti. Réessayez dans un instant, ou appelez-nous au 03 72 73 95 43.';
    var TYPES = {vue:'Lunettes de vue', solaire:'Lunettes de soleil', sport:'Lunettes de sport', lecture:'Lunettes de lecture', enfant:'Lunettes pour enfant', connectees:'Lunettes connectées', autre:'Lunettes', inconnu:'Lunettes'};
    var MATIERES = {acetate:'acétate', plastique:'plastique', metal:'métal', titane:'titane', bois:'bois', corne:'corne', mixte:'matières mixtes', sans_monture:'sans monture'};
    var ETATS = {comme_neuf:'Comme neuves', tres_bon:'Très bon état', bon:'Bon état', use:'Usées', abime:'Abîmées', casse:'Cassées'};
    var FIABILITE = {sure:'Monture reconnue', probable:'Monture probablement reconnue', a_confirmer:'À confirmer en magasin'};
    var photo = null, urlApercu = null, enCours = false, photoDisponible = false;
    var modelesDeLaMarque = Object.create(null);

    function dire(texte){
      msg.textContent = texte || '';
      msg.hidden = !texte;
    }
    function option(parent, valeur, texte){
      var o = document.createElement('option');
      o.value = valeur;
      o.textContent = texte;
      parent.appendChild(o);
    }
    function remplirMarques(liste){
      function groupe(libelle, marques){
        var g = document.createElement('optgroup');
        g.label = libelle;
        marques.forEach(function(m){ option(g, m.nom, m.nom); });
        champMarque.appendChild(g);
      }
      champMarque.textContent = '';
      option(champMarque, '', 'Choisir une marque');
      option(champMarque, 'sans_marque', 'Sans marque ou marque d’opticien');
      groupe('Marques courantes', liste.filter(function(m){ return m.courante; }));
      groupe('Toutes les marques', liste);
      option(champMarque, 'autre_marque', 'Autre marque (pas dans la liste)');
      liste.forEach(function(m){ modelesDeLaMarque[m.nom] = m.modeles; });
      champMarque.disabled = false;
    }
    function remplirModeles(){
      var modeles = modelesDeLaMarque[champMarque.value];
      champModele.textContent = '';
      if(!modeles){
        option(champModele, '', champMarque.value ? 'Sans objet pour ce choix' : 'Choisissez d’abord la marque');
        champModele.disabled = true;
        return;
      }
      option(champModele, '', modeles.length ? 'Je ne sais pas, ou autre modèle' : 'Tous les modèles de cette marque');
      modeles.forEach(function(m){ option(champModele, m, m); });
      champModele.disabled = !modeles.length;
    }
    champMarque.addEventListener('change', function(){ dire(''); remplirModeles(); });
    // La photo est réduite et réencodée : envoi léger, et les données de localisation du fichier disparaissent
    function preparer(fichier){
      return new Promise(function(ok, ko){
        var url = URL.createObjectURL(fichier), m = new Image();
        m.onload = function(){
          var k = Math.min(1, 1400/Math.max(m.naturalWidth, m.naturalHeight));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(m.naturalWidth*k));
          c.height = Math.max(1, Math.round(m.naturalHeight*k));
          c.getContext('2d').drawImage(m, 0, 0, c.width, c.height);
          ok({url: url, donnees: c.toDataURL('image/jpeg', .86).split(',')[1]});
        };
        m.onerror = function(){ URL.revokeObjectURL(url); ko(); };
        m.src = url;
      });
    }
    function retirerPhoto(){
      photo = null;
      if(urlApercu){ URL.revokeObjectURL(urlApercu); urlApercu = null; }
      apercu.removeAttribute('src');
      depot.classList.remove('rempli');
      champPhoto.value = '';
    }
    champPhoto.addEventListener('change', function(){
      var f = champPhoto.files && champPhoto.files[0];
      dire('');
      if(!f) return;
      preparer(f).then(function(p){
        if(urlApercu) URL.revokeObjectURL(urlApercu);
        urlApercu = p.url;
        photo = {mime: 'image/jpeg', data: p.donnees};
        apercu.src = p.url;
        depot.classList.add('rempli');
      }, function(){
        retirerPhoto();
        dire(MESSAGES.format);
      });
    });

    function ecrire(id, texte){ document.getElementById(id).textContent = texte; }
    function afficher(r){
      var q = r.reprise, p = r.paire, euros = function(v){ return v + '\u00a0€'; };
      if(q.a_voir_en_magasin){
        ecrire('r-montant', 'À voir en magasin');
        ecrire('r-suite', MOTIFS[q.motif] || 'Nous ne pouvons pas estimer cette paire à distance. Montrez-la à nos opticiens.');
      } else if(q.plafond_atteint){
        ecrire('r-montant', 'À partir de ' + euros(q.min));
        ecrire('r-suite', 'Nous estimons les paires de cette valeur en magasin, et nous déduisons le montant de votre facture.');
      } else {
        ecrire('r-montant', 'Entre ' + euros(q.min) + ' et ' + euros(q.max));
        ecrire('r-suite', 'déduits de votre facture, après vérification de la monture en magasin.');
      }
      // « Ray-Ban Meta » plutôt que « Ray-Ban Ray-Ban Meta »
      var nom = q.motif === 'hors_liste' ? 'd’une autre marque'
        : p.marque && p.modele && p.modele.indexOf(p.marque) === 0 ? p.modele
        : [p.marque, p.modele].filter(Boolean).join(' ');
      var matiere = MATIERES[p.matiere] ? ', ' + MATIERES[p.matiere] : '';
      ecrire('r-paire', (TYPES[p.type] || 'Lunettes') + (nom ? ' ' + nom : '') + matiere);
      ecrire('r-etat', (ETATS[q.etat] || 'Bon état') + (q.etat_a_confirmer ? ', à confirmer' : ''));
      document.getElementById('r-etat-bloc').hidden = !!q.motif;
      ecrire('r-fiab', FIABILITE[q.reconnaissance] || '');
      document.getElementById('r-fiab-bloc').hidden = !FIABILITE[q.reconnaissance];
      var def = (p.defauts || []).join(', ');
      document.getElementById('r-def-bloc').hidden = !def;
      ecrire('r-defauts', def);
      form.hidden = true;
      resultat.hidden = false;
      resultat.scrollIntoView({block: 'center', behavior: calme ? 'auto' : 'smooth'});
      resultat.focus({preventScroll: true});
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(enCours) return;
      var marque = champMarque.value, modele = champModele.value;
      var coche = form.querySelector('input[name="etat"]:checked');
      if(!photo && !marque){ dire(photoDisponible ? MESSAGES.vide_photo : MESSAGES.vide); return; }
      if(!photo && marque === 'autre_marque' && photoDisponible){ dire(MESSAGES.ajouter_photo); return; }
      dire('');
      enCours = true;
      envoi.disabled = true;
      envoi.classList.add('charge');
      envoi.textContent = photo ? 'Analyse en cours…' : 'Calcul en cours…';
      var arret = window.AbortController ? new AbortController() : null;
      var minuteur = arret ? setTimeout(function(){ arret.abort(); }, 40000) : 0;
      fetch('/api/estimer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({photo: photo, marque: marque, modele: modele, etat: coche ? coche.value : ''}),
        signal: arret ? arret.signal : undefined
      }).then(function(r){
        return r.json().catch(function(){ return {ok: false}; });
      }).then(function(r){
        if(r && r.ok && r.reprise && r.paire) afficher(r);
        else dire(r && MESSAGES[r.code] || ERREUR);
      }, function(){
        dire(MESSAGES.reseau);
      }).then(function(){
        clearTimeout(minuteur);
        enCours = false;
        envoi.disabled = false;
        envoi.classList.remove('charge');
        envoi.textContent = LIBELLE;
      });
    });

    document.getElementById('e-refaire').addEventListener('click', function(){
      retirerPhoto();
      form.reset();
      remplirModeles();
      resultat.hidden = true;
      form.hidden = false;
      dire('');
      form.scrollIntoView({block: 'center', behavior: calme ? 'auto' : 'smooth'});
    });

    // La liste vient du service du site. La photo n'apparaît que si la clé Gemini y est présente.
    function indisponible(){
      champMarque.options[0].textContent = 'Liste indisponible';
      dire(MESSAGES.indisponible);
    }
    fetch('/api/estimer').then(function(r){ return r.ok ? r.json() : null; }).then(function(r){
      if(!r || !Array.isArray(r.marques) || !r.marques.length){ indisponible(); return; }
      remplirMarques(r.marques);
      remplirModeles();
      envoi.disabled = false;
      photoDisponible = r.branche === true;
      depot.hidden = !photoDisponible;
      document.getElementById('e-google').hidden = !photoDisponible;
      document.getElementById('e-intro-photo').hidden = !photoDisponible;
      form.classList.toggle('avec-photo', photoDisponible);
    }, indisponible);
  })();

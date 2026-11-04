// Fond en verre liquide : une surface de chrome (ou de malachite verte, en thème écologique) calculée en direct.
// Le nom du magasin est gravé dans la surface : il ne ressort que là où on touche le liquide
// et quand une vague lente passe dessus.
(function(){
  var toile = document.getElementById('liquide');
  if(!toile) return;
  var racine = document.documentElement;
  // Avec le réglage « moins d'animations » du système, le liquide coule plus lentement et le scroll ne l'agite plus.
  // Il réagit toujours au doigt et à la souris, et un bouton en bas de page permet de l'arrêter.
  var reduit = matchMedia('(prefers-reduced-motion: reduce)').matches, fige = false;
  var tactile = navigator.maxTouchPoints > 0;
  var gl = toile.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false});
  function sansLiquide(){
    toile.style.display = 'none';
    racine.classList.add('sans-liquide');
    var f = document.getElementById('fenetre');
    if(f) f.style.display = 'none';
  }
  if(!gl){ sansLiquide(); return; }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var derivees = !!gl.getExtension('OES_standard_derivatives');
  var FS = [
  derivees ? '#extension GL_OES_standard_derivatives : enable\n#define PIXEL(r) (fwidth(r.x)+fwidth(r.y))' : '#define PIXEL(r) .012',
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uClair,uEco,uDefil,uBase,uTouche;',
  'uniform vec3 uP[6];uniform sampler2D uNom;uniform vec2 uNomTaille;',
  'uniform vec4 uV[4];uniform float uVR;',
  'float gNom,gLac,gL=0.,gDans=0.;',
  'float pic(float x){float v=.5+.5*sin(x);v*=v;return v*v;}',
  'float fen(float x,float a,float b,float c,float d){return smoothstep(a-gL,b+gL,x)*(1.-smoothstep(c-gL,d+gL,x));}',
  // Un filet de lumière : plus il devient fin à l'écran, plus il s'atténue, au lieu de se hacher
  'float filet(float x,float l){return (1.-smoothstep(0.,l+gL,abs(x)))*l/(l+gL);}',
  // Hauteur de la surface. Le courant part en diagonale et se replie en S ;
  // sur cette houle, des plis de plus en plus fins, qui apparaissent par endroits, donnent les filets de lumière.
  'float champ(vec2 uv){',
  '  float t=uT,fin=1.-uClair;',
  '  vec2 u=uv+vec2(0.,uDefil);',
  '  vec2 a=vec2(u.x*.64-u.y*.77,u.x*.77+u.y*.64);',
  '  vec2 p=vec2(a.x*1.3,a.y*2.15)*(.62+.38*fin)+vec2(.3,.1);',
  '  float touche=0.,revele=0.;',
  '  if(uTouche>.002){',
  '    for(int i=0;i<6;i++){',
  '      vec2 v=uv-uP[i].xy;float d=dot(v,v);float z=uP[i].z;',
  '      float f=z*z*exp(-d/.03);',
  '      p+=v*f*3.2;touche+=f;',
  '      revele+=z*exp(-d/.075);',
  '    }',
  '  }',
  '  vec2 q=p;',
  '  q+=.74*sin(q.yx*vec2(1.3,.85)+vec2(t*.19,-t*.15));',
  '  q+=.41*sin(q.yx*vec2(2.5,1.8)+vec2(-t*.14,t*.12)+1.7);',
  '  q+=.21*sin(q.yx*vec2(4.9,3.6)+vec2(t*.11,t*.16)+4.1);',
  // Le nom ondule avec le liquide ; une vague lente le fait ressortir de temps en temps,
  // et le liquide se calme autour des lettres quand il remonte, pour qu'on puisse le lire
  '  float vague=sin(uv.x*1.1+uv.y*.7-t*.42);vague=smoothstep(.8,1.,vague);',
  '  float m=clamp(uBase+vague*.26+revele*1.5,0.,1.);',
  '  gLac=1.;gNom=0.;',
  '  if(m>.002){',
  '    vec2 n=(uv+(q-p)*.012)/uNomTaille;n.y=-n.y;n+=.5;',
  '    vec4 tx=texture2D(uNom,n);',
  '    gLac=1.-.9*tx.a*smoothstep(.1,.75,m);',
  '    gNom=tx.r*m;',
  '  }',
  '  float b1=smoothstep(-.5,.6,sin(q.x*1.1+q.y*.5+1.3));',
  '  float b2=smoothstep(-.2,.8,sin(q.x*.8-q.y*.7+4.2+t*.03));',
  '  float h=.52*sin(q.y*1.9+1.2*sin(q.x*1.1+t*.05));',
  '  h+=(.4+.6*fin)*b1*.27*pic(q.y*5.6+1.5*sin(q.x*1.3)+.7);',
  '  float zone=smoothstep(-.15,.75,sin(q.x*.47-q.y*.33+.7+t*.02))*(1.-.78*gDans);',
  '  h+=(.24+.76*fin)*(.3+.7*zone)*b2*.135*pic(q.y*12.+2.1*sin(q.x*.9+1.));',
  '  h+=fin*zone*b1*b2*.07*pic(q.y*23.+2.6*sin(q.x*.7+3.));',
  '  h+=fin*zone*smoothstep(.05,.8,sin(q.x*.6+q.y*.9+2.3))*.036*pic(q.y*41.+3.1*sin(q.x*.6+.5)+1.3*sin(q.x*1.7));',
  '  h+=touche*.16;',
  '  return h;',
  '}',
  // Le décor qui se reflète : des boîtes à lumière, nettes d'un côté, qui s'éteignent doucement de l'autre
  'float studio(vec2 r){',
  '  vec2 e=vec2(r.x*.8+r.y*.6,-r.x*.6+r.y*.8);',
  '  float s=fen(e.x,.2,.225,.3,.9)*(1.-smoothstep(.35,.95,abs(e.y)));',
  '  s+=.95*fen(e.x,-.6,-.575,-.52,-.3)*(1.-smoothstep(.35,.85,abs(e.y+.12)));',
  '  s+=.85*filet(e.y-.5,.03)*fen(e.x,-.7,-.2,.3,.8);',
  '  s+=.7*filet(e.y+.55,.024)*fen(e.x,-.6,-.1,.2,.7);',
  '  s+=.5*filet(e.x+.13,.012)*fen(e.y,-.5,-.2,.25,.55);',
  '  s+=.42*filet(e.x-.09,.006)*(1.-smoothstep(.25,.6,abs(e.y)));',
  '  s+=.26*filet(e.x+.06,.004)*(1.-smoothstep(.15,.5,abs(e.y+.1)));',
  '  s+=.42*fen(e.x,-.26,-.04,.14,.2)*fen(e.y,.05,.24,.42,.7);',
  '  return min(s,1.);',
  '}',
  // La version claire : presque tout est blanc, avec des nappes sombres au bord net d'un côté et doux de l'autre
  'float nappes(vec2 r){',
  '  vec2 e=vec2(r.x*.6-r.y*.8,r.x*.8+r.y*.6);',
  '  float s=smoothstep(.1,.36,e.x)*.28+smoothstep(.36-gL,.385+gL,e.x)*.72;',
  '  s*=1.-smoothstep(.72,.98,e.x);',
  '  s+=smoothstep(.2,.56,-e.x)*(1.-smoothstep(.8,.84,-e.x))*(1.-smoothstep(.3,.8,abs(e.y)));',
  '  s+=filet(e.y-.55,.028)*.85*fen(e.x,-.6,-.3,.3,.6);',
  '  s+=filet(e.y+.42,.014)*.6*fen(e.x,-.5,-.2,.2,.5);',
  '  return min(s,1.);',
  '}',
  'void main(){',
  '  float cote=min(uRes.x,uRes.y);',
  '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/cote;',
  // Sous un panneau : près du bord, le verre courbe la vue vers l'intérieur, comme une épaisseur de verre
  '  vec2 w=uv;',
  '  for(int i=0;i<4;i++){',
  '    vec4 b=uV[i];',
  '    vec2 c=.5*(b.xy+b.zw),q=abs(uv-c)-.5*(b.zw-b.xy)+uVR;',
  '    float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-uVR;',
  '    if(sd<0.){',
  '      vec2 s=vec2(uv.x<c.x?-1.:1.,uv.y<c.y?-1.:1.),dir;',
  '      if(q.x>0.&&q.y>0.)dir=normalize(q)*s;',
  '      else if(q.x>q.y)dir=vec2(s.x,0.);',
  '      else dir=vec2(0.,s.y);',
  '      float t=clamp(1.+sd/.075,0.,1.);',
  '      w=uv-dir*t*t*.085;',
  '      gDans=1.-smoothstep(-.05,0.,sd);',
  '    }',
  '  }',
  '  float e=max(1.25/cote,.0011),h0=champ(w),nom=gNom,lac=gLac;',
  '  float hx=champ(w+vec2(e,0.)),nx=gNom;',
  '  float hy=champ(w+vec2(0.,e)),ny=gNom;',
  // La pente du liquide s'aplatit autour des lettres, celle des lettres s'y ajoute
  '  vec2 g=(vec2(hx,hy)-h0)/e*lac+(vec2(nx,ny)-nom)/e*.036;',
  '  vec3 n=normalize(vec3(-g*.3,1.));',
  '  vec2 r=2.*n.z*n.xy+uv*.22;',
  '  gL=min(PIXEL(r)*.7,.12);',
  '  vec2 dd=normalize(n.xy+vec2(1e-4))*.007;',
  // Noir : reflets francs, à peine irisés sur les arêtes, avec un halo doux autour des lumières et un peu de matière dans les ombres
  '  vec3 noir=vec3(0.),blanc=vec3(0.);',
  '  if(uClair<.999){',
  '    float s0=studio(r),s1=studio(r+dd);',
  '    vec3 c=vec3(s1,min(s0,s1),s1);',
  '    vec2 l1=r-vec2(.44,.3),l2=r+vec2(.42,.26);',
  '    float pente=1.-n.z;',
  '    float halo=.15*exp(-dot(l1,l1)/.1)+.07*exp(-dot(l2,l2)/.06)+.05*pente*pente+.018*smoothstep(-.6,.8,h0);',
  '    noir=.004+c*.96+halo+nom*.15;',
  // Thème écologique : malachite veinée, reflets vert tendre, liserés dorés
  '    if(uEco>.001){',
  '      float l=dot(noir,vec3(.3,.59,.11));',
  '      float v=.5+.5*sin(h0*15.+2.*sin(h0*4.+uT*.02));',
  '      v=smoothstep(.12,.88,v);',
  '      vec3 m=mix(vec3(.004,.032,.02),vec3(.012,.125,.076),v);',
  '      m=mix(m,vec3(.075,.47,.28),smoothstep(.025,.5,l));',
  '      m=mix(m,vec3(.91,.99,.86),smoothstep(.45,1.,l));',
  '      m+=max(noir.r-noir.g,0.)*vec3(.6,.46,.06)+max(noir.b-noir.g,0.)*vec3(.22,.2,0.);',
  '      noir=mix(noir,m,uEco);',
  '    }',
  '  }',
  // Blanc : grandes zones claires, nappes noires, liserés discrets ; en thème écologique, papier et mousse
  '  if(uClair>.001){',
  '    float k0=nappes(r),k1=nappes(r+dd*.8);',
  '    vec3 k=vec3(k1,k0,k1);',
  '    float gris=smoothstep(.1,.95,length(r));',
  '    blanc=mix(vec3(.985-.08*gris-nom*.1),vec3(.012),k);',
  '    if(uEco>.001){',
  '      vec3 p=vec3(.95,.96,.885)-gris*vec3(.1,.07,.09)-nom*.1;',
  '      p=mix(p,vec3(.018,.125,.08),k);',
  '      blanc=mix(blanc,p,uEco);',
  '    }',
  '  }',
  '  vec3 f=mix(noir,blanc,uClair);',
  // Un grain imperceptible évite les bandes dans les dégradés
  '  f+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5)/170.;',
  '  gl_FragColor=vec4(f,1.);',
  '}'
  ].join('\n');

  var U = {}, texNom = null;
  var nomPret = false, nomAutorise = false, formatNom = '';

  function compiler(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function preparer(){
    var prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compiler(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    ['uRes','uT','uClair','uEco','uDefil','uBase','uTouche','uP','uNom','uNomTaille','uV','uVR'].forEach(function(n){ U[n] = gl.getUniformLocation(prog, n); });
    // Texture vide le temps que la police arrive : le nom est de toute façon caché au départ
    texNom = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texNom);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, 1, 1, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, new Uint8Array(2));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(U.uNom, 0);
    gl.uniform2f(U.uNomTaille, 1, 1);
  }
  try { preparer(); } catch(err){ sansLiquide(); return; }

  // Distance de chaque point d'une lettre à son bord : donne un relief arrondi, comme du métal gonflé
  function distances(cout, W, H){
    var INF = 1e20, g = new Float64Array(W*H), i, x, y;
    for(i = 0; i < W*H; i++){ var a = cout[i]; g[i] = a >= 1 ? INF : a*a; }
    var M = Math.max(W,H), f = new Float64Array(M), d = new Float64Array(M), v = new Int32Array(M), z = new Float64Array(M+1);
    function passe(n){
      var k = 0, q, r, s;
      v[0] = 0; z[0] = -INF; z[1] = INF;
      for(q = 1; q < n; q++){
        do { r = v[k]; s = (f[q]+q*q-f[r]-r*r)/(2*q-2*r); } while(s <= z[k] && --k > -1);
        k++; v[k] = q; z[k] = s; z[k+1] = INF;
      }
      k = 0;
      for(q = 0; q < n; q++){ while(z[k+1] < q) k++; r = v[k]; d[q] = f[r]+(q-r)*(q-r); }
    }
    for(x = 0; x < W; x++){
      for(y = 0; y < H; y++) f[y] = g[x+y*W];
      passe(H);
      for(y = 0; y < H; y++) g[x+y*W] = d[y];
    }
    for(y = 0; y < H; y++){
      for(x = 0; x < W; x++) f[x] = g[x+y*W];
      passe(W);
      for(x = 0; x < W; x++) g[x+y*W] = d[x];
    }
    return g;
  }

  function lisser(v, W, H){
    var t = new Float32Array(W*H), x, y, i;
    for(y = 0; y < H; y++) for(x = 1; x < W-1; x++){ i = x+y*W; t[i] = (v[i-1]+v[i]+v[i+1])/3; }
    for(y = 1; y < H-1; y++) for(x = 0; x < W; x++){ i = x+y*W; v[i] = (t[i-W]+t[i]+t[i+W])/3; }
  }

  // Le nom, gravé dans une texture : une ligne à l'horizontale, deux lignes en vertical
  function dessinerNom(){
    if(!nomAutorise) return;
    var vertical = innerWidth < innerHeight;
    var f = vertical ? 'v' : 'h';
    if(f === formatNom && nomPret) return;
    formatNom = f;
    var lignes = vertical ? ['L’ÉCO','PTICIEN'] : ['L’ÉCOPTICIEN'];
    // Plus de définition sur les écrans fins, pour que le relief reste net
    var W = (window.devicePixelRatio || 1) > 1.4 ? 1024 : 768, H = Math.round(W*(vertical ? .677 : .273)), ech = W/768;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d', {willReadFrequently:true});
    // Écrit petit puis agrandi : à petit corps, les déliés du Bodoni restent épais
    var CORPS = 22;
    g.font = '800 ' + CORPS + 'px "Bodoni Moda","Didot",Georgia,serif';
    var plusLarge = Math.max.apply(null, lignes.map(function(l){ return g.measureText(l).width; }));
    var k = Math.min(W*.82/plusLarge, H*.72/lignes.length/CORPS);
    g.setTransform(k,0,0,k,W/2,H/2);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round';
    g.lineWidth = CORPS*.022;
    lignes.forEach(function(l,i){
      var y = (i-(lignes.length-1)/2)*CORPS*1.04 + CORPS*.08;
      g.strokeText(l, 0, y); g.fillText(l, 0, y);
    });
    var img = g.getImageData(0,0,W,H).data, cout = new Float32Array(W*H), i;
    for(i = 0; i < W*H; i++) cout[i] = img[4*i+3]/255;
    var dist = distances(cout, W, H), large = CORPS*k*.075, relief = new Float32Array(W*H), octets = new Uint8Array(2*W*H);
    for(i = 0; i < W*H; i++){
      var x = Math.min(1, Math.sqrt(dist[i])/large);
      relief[i] = Math.sqrt(1-(1-x)*(1-x));
    }
    lisser(relief, W, H); lisser(relief, W, H);
    if(W > 768) lisser(relief, W, H);
    // Autour des lettres : une zone qui s'estompe, nulle sur les bords de la texture
    var dehors = new Float32Array(W*H);
    for(i = 0; i < W*H; i++) dehors[i] = 1-cout[i];
    var loin = distances(dehors, W, H), rayon = CORPS*k*.46;
    for(var yy = 1; yy < H-1; yy++) for(var xx = 1; xx < W-1; xx++){
      i = xx+yy*W;
      var e = Math.max(0, 1-Math.sqrt(loin[i])/rayon);
      e = e*e*(3-2*e)*Math.min(1, Math.min(xx, W-1-xx, yy, H-1-yy)/(22*ech));
      octets[2*i] = Math.round(255*relief[i]);
      octets[2*i+1] = Math.round(255*e);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texNom);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, W, H, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, octets);
    gl.uniform1i(U.uNom, 0);
    // Taille du nom dans les unités du liquide (le petit côté de l'écran vaut 1)
    var largeur = (vertical ? .84 : Math.min(1.36, .8*innerWidth/innerHeight))/.82;
    gl.uniform2f(U.uNomTaille, largeur, largeur*H/W);
    nomPret = true;
    if(fige) dessiner();
  }
  function autoriserNom(){
    if(nomAutorise) return;
    nomAutorise = true;
    dessinerNom();
  }

  // Résolution de calcul : deux fois plus de points que de pixels logiques sur tous les écrans. Sur un écran standard,
  // l'image est ensuite réduite à l'affichage, ce qui lisse les filets. Le budget dépend de la carte graphique ;
  // si l'appareil peine quand même, on descend par paliers.
  var infoCarte = gl.getExtension('WEBGL_debug_renderer_info');
  var nomCarte = infoCarte ? String(gl.getParameter(infoCarte.UNMASKED_RENDERER_WEBGL)) : '';
  var cartePuissante = /RTX|GTX|Radeon RX|Radeon Pro|Arc\s|Apple M\d/i.test(nomCarte);
  var BUDGET = cartePuissante ? 9e6 : (tactile ? 2.2e6 : 3.2e6), MINI = .6;
  var qualite = 2, echelle = 1, RW = 0, RH = 0;
  function dimensionner(){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight;
    echelle = Math.min(qualite, Math.sqrt(BUDGET/(w*h)));
    var nw = Math.max(2, Math.round(w*echelle)), nh = Math.max(2, Math.round(h*echelle));
    if(nw === RW && nh === RH) return;
    RW = nw; RH = nh; toile.width = nw; toile.height = nh;
    gl.viewport(0,0,nw,nh);
    gl.uniform2f(U.uRes, nw, nh);
  }
  dimensionner();

  // Le doigt ou la souris laissent une traînée de six points qui s'efface doucement
  var points = new Float32Array(18), dernier = [9,9], appui = false, geste = -1e9;
  function toucher(x,y,force){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight, m = Math.min(w,h);
    var px = (x-w/2)/m, py = (h/2-y)/m;
    force = force || 1;
    if(force === 1) geste = performance.now();
    if(Math.hypot(px-dernier[0], py-dernier[1]) < .022){ points[2] = Math.max(points[2], force); return; }
    dernier = [px,py];
    for(var i = 15; i >= 3; i -= 3){ points[i] = points[i-3]; points[i+1] = points[i-2]; points[i+2] = points[i-1]; }
    points[0] = px; points[1] = py; points[2] = force;
  }
  addEventListener('pointermove', function(e){ if(e.pointerType === 'mouse') toucher(e.clientX, e.clientY); }, {passive:true});
  addEventListener('touchstart', function(e){ var t = e.touches[0]; if(t){ appui = true; toucher(t.clientX, t.clientY); } }, {passive:true});
  addEventListener('touchmove', function(e){ var t = e.touches[0]; if(t) toucher(t.clientX, t.clientY); }, {passive:true});
  addEventListener('touchend', function(e){ if(!e.touches.length) appui = false; }, {passive:true});
  addEventListener('touchcancel', function(){ appui = false; }, {passive:true});

  // Le scroll fait couler le liquide. Les sections claires le font passer au blanc.
  var clairCible = 0, clair = 0, base = 0, baseCible = 0, defil = 0, defilCible = 0, temps = 7, agite = 0;
  var ecoCible = racine.getAttribute('data-theme') === 'eco' ? 1 : 0, eco = ecoCible;
  var dernierY = scrollY, balayage = -1, balayageFait = false;
  var sectionsClaires = [].slice.call(document.querySelectorAll('.t-clair'));
  var fenetre = document.getElementById('fenetre');
  function lireScroll(){
    var y = scrollY, milieu = innerHeight/2;
    if(y !== dernierY) geste = performance.now();
    if(!reduit) agite = Math.min(1, agite + Math.abs(y-dernierY)*.0012);
    defilCible -= (y-dernierY)*.00042;
    dernierY = y;
    clairCible = 0;
    sectionsClaires.forEach(function(s){ var r = s.getBoundingClientRect(); if(r.top < milieu && r.bottom > milieu) clairCible = 1; });
    // Dans la fenêtre dédiée, le nom se devine davantage, et un passage le montre une première fois
    var f = fenetre && fenetre.getBoundingClientRect();
    var dansFenetre = f && f.top < innerHeight*.6 && f.bottom > innerHeight*.4;
    baseCible = dansFenetre ? .14 : 0;
    if(dansFenetre && !balayageFait){ balayageFait = true; balayage = 0; }
  }
  addEventListener('scroll', lireScroll, {passive:true});
  addEventListener('resize', function(){ dimensionner(); dessinerNom(); lireScroll(); });
  lireScroll();

  // Les panneaux de verre : leur place sur la page est mesurée à part, le scroll suffit ensuite
  var verres = [].slice.call(document.querySelectorAll('.hero-texte,.panneau,.diapo'));
  var rail = document.getElementById('defile');
  var places = [], vues = new Float32Array(16);
  function mesurer(){
    var x = rail ? rail.scrollLeft : 0, y = scrollY;
    places = verres.map(function(v){
      var r = v.getBoundingClientRect(), dansRail = rail && rail.contains(v);
      return {g: r.left + (dansRail ? x : 0), h: r.top + y, d: r.right + (dansRail ? x : 0), b: r.bottom + y, rail: dansRail};
    });
    var st = verres[0] ? getComputedStyle(verres[0]) : null;
    rayonVerre = st ? parseFloat(st.borderTopLeftRadius) || 24 : 24;
  }
  var rayonVerre = 24;
  function poserVerres(){
    var W = toile.clientWidth || innerWidth, H = toile.clientHeight || innerHeight, m = Math.min(W,H);
    var y = scrollY, x = rail ? rail.scrollLeft : 0, n = 0, i;
    for(i = 0; i < places.length && n < 4; i++){
      var p = places[i], dx = p.rail ? x : 0, g = p.g-dx, d = p.d-dx, h = p.h-y, b = p.b-y;
      if(b < 0 || h > H || d < 0 || g > W) continue;
      vues[n*4] = (g-W/2)/m; vues[n*4+1] = (H/2-b)/m; vues[n*4+2] = (d-W/2)/m; vues[n*4+3] = (H/2-h)/m;
      n++;
    }
    // Les places restantes sont loin de l'écran
    for(i = n; i < 4; i++){ vues[i*4] = 9; vues[i*4+1] = 9; vues[i*4+2] = 9.1; vues[i*4+3] = 9.1; }
    gl.uniform4fv(U.uV, vues);
    gl.uniform1f(U.uVR, rayonVerre/m);
  }
  mesurer();
  addEventListener('load', mesurer);
  addEventListener('resize', mesurer);
  if(window.ResizeObserver){
    var veille = new ResizeObserver(mesurer);
    verres.forEach(function(v){ veille.observe(v); });
  }
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);

  // Sur téléphone : 60 images par seconde quand on touche ou qu'on scrolle, 30 au repos pour ménager la batterie
  var adapte = true, debut = 0, avant = 0, prec = 0, lents = 0, rapides = 0;
  function dessiner(){
    var plusFort = 0;
    for(var i = 2; i < 18; i += 3) if(points[i] > plusFort) plusFort = points[i];
    gl.uniform1f(U.uT, temps); gl.uniform1f(U.uClair, clair); gl.uniform1f(U.uEco, eco);
    gl.uniform1f(U.uDefil, defil); gl.uniform1f(U.uBase, base); gl.uniform1f(U.uTouche, plusFort);
    gl.uniform3fv(U.uP, points);
    poserVerres();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function boucle(n){
    requestAnimationFrame(boucle);
    if(document.hidden || fige) return;
    var pas = (tactile && !appui && n-geste > 1500) ? 1000/31 : 1000/61;
    if(n-avant < pas) return;
    if(!debut) debut = n;
    var dt = Math.min(.08, (n-avant)/1000);
    var coutMs = n-prec; prec = n;
    avant = n;
    temps += dt*(reduit ? .45 : 1+agite*2.2);
    agite *= Math.pow(.2, dt);
    clair += (clairCible-clair)*(1-Math.pow(.04, dt));
    eco += (ecoCible-eco)*(1-Math.pow(.03, dt));
    base += (baseCible-base)*(1-Math.pow(.1, dt));
    defil += (defilCible-defil)*(1-Math.pow(.02, dt));
    var fondu = Math.pow(.32, dt);
    for(var i = 2; i < 18; i += 3) points[i] *= fondu;
    if(appui) points[2] = 1;
    if(balayage >= 0){
      balayage += dt/2.8;
      var w = toile.clientWidth, h = toile.clientHeight;
      if(balayage >= 1) balayage = -1;
      else toucher(w*(.06+.88*balayage), h*.5 + Math.min(w,h)*.06*Math.sin(balayage*9), .62);
    }
    dessiner();
    // Qualité automatique : sous 22 images par seconde durables, on calcule moins de points
    if(n-debut < 1500) return;
    if(coutMs > 45){ lents++; rapides = 0; } else { rapides++; if(rapides > 30) lents = 0; }
    if(adapte && lents > 24 && echelle > MINI){
      qualite = Math.max(MINI, echelle*.8);
      lents = 0; dimensionner(); dessiner();
    }
  }
  requestAnimationFrame(boucle);
  addEventListener('resize', function(){ if(fige) dessiner(); });

  // La police d'abord, pour graver le nom avec les bonnes lettres
  if(document.fonts && document.fonts.load){
    document.fonts.load('800 22px "Bodoni Moda"').then(autoriserNom, autoriserNom);
    setTimeout(autoriserNom, 3000);
  } else { autoriserNom(); }

  // Si le téléphone reprend la main sur la carte graphique, on repart de zéro au retour
  toile.addEventListener('webglcontextlost', function(e){ e.preventDefault(); });
  toile.addEventListener('webglcontextrestored', function(){
    preparer(); nomPret = false; RW = RH = 0; dimensionner(); dessinerNom(); if(fige) dessiner();
  });

  // Changement de thème par le bouton du site, et accès pour les tests
  window.__liquide = {
    theme: function(v){ ecoCible = v; mesurer(); if(fige){ eco = v; dessiner(); } },
    figer: function(v){ fige = v; if(!v){ avant = prec = performance.now(); lents = 0; } },
    toucher: toucher,
    regler: function(o){
      if('t' in o) temps = o.t;
      if('clair' in o){ clair = clairCible = o.clair; }
      if('base' in o){ base = baseCible = o.base; }
      if('eco' in o){ eco = ecoCible = o.eco; }
      if('qualite' in o){ qualite = o.qualite; adapte = false; dimensionner(); }
      dessiner();
    }
  };
})();

// Fond en verre liquide : une surface de chrome noir (ou blanc) calculée en direct.
// Le nom du magasin est gravé dans la surface : il ne ressort que là où on touche le liquide
// et quand une vague lente passe dessus.
(function(){
  var toile = document.getElementById('liquide');
  if(!toile) return;
  var calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactile = navigator.maxTouchPoints > 0;
  var gl = toile.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power'});
  function sansLiquide(){
    toile.style.display = 'none';
    document.documentElement.classList.add('sans-liquide');
    var f = document.getElementById('fenetre');
    if(f) f.style.display = 'none';
  }
  if(!gl){ sansLiquide(); return; }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var derivees = !!gl.getExtension('OES_standard_derivatives');
  var FS = [
  derivees ? '#extension GL_OES_standard_derivatives : enable\n#define PIXEL(r) (fwidth(r.x)+fwidth(r.y))' : '#define PIXEL(r) .012',
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uClair,uDefil,uBase;',
  'uniform vec3 uP[6];uniform sampler2D uNom;uniform vec2 uNomTaille;',
  'float gNom,gLac,gL=0.;',
  'float pic(float x){float v=.5+.5*sin(x);v*=v;return v*v;}',
  'float fen(float x,float a,float b,float c,float d){return smoothstep(a-gL,b+gL,x)*(1.-smoothstep(c-gL,d+gL,x));}',
  // Un filet de lumière : plus il devient fin à l'écran, plus il s'atténue, au lieu de se hacher
  'float filet(float x,float l){return (1.-smoothstep(0.,l+gL,abs(x)))*l/(l+gL);}',
  // Hauteur de la surface. Le courant part en diagonale et se replie en S ;
  // sur cette houle, des plis fins qui apparaissent par endroits donnent les filets de lumière.
  'float champ(vec2 uv){',
  '  float t=uT,fin=1.-uClair;',
  '  vec2 u=uv+vec2(0.,uDefil);',
  '  vec2 a=vec2(u.x*.64-u.y*.77,u.x*.77+u.y*.64);',
  '  vec2 p=vec2(a.x*1.3,a.y*2.15)*(.62+.38*fin)+vec2(.3,.1);',
  '  float touche=0.,revele=0.;',
  '  for(int i=0;i<6;i++){',
  '    vec2 v=uv-uP[i].xy;float d=dot(v,v);float z=uP[i].z;',
  '    float f=z*z*exp(-d/.03);',
  '    p+=v*f*3.2;touche+=f;',
  '    revele+=z*exp(-d/.075);',
  '  }',
  '  vec2 q=p;',
  '  q+=.74*sin(q.yx*vec2(1.3,.85)+vec2(t*.19,-t*.15));',
  '  q+=.41*sin(q.yx*vec2(2.5,1.8)+vec2(-t*.14,t*.12)+1.7);',
  '  q+=.21*sin(q.yx*vec2(4.9,3.6)+vec2(t*.11,t*.16)+4.1);',
  // Le nom ondule avec le liquide ; une vague lente le fait ressortir de temps en temps,
  // et le liquide se calme autour des lettres quand il remonte, pour qu'on puisse le lire
  '  vec2 n=(uv+(q-p)*.012)/uNomTaille;n.y=-n.y;n+=.5;',
  '  vec4 tx=texture2D(uNom,n);',
  '  float vague=sin(uv.x*1.1+uv.y*.7-t*.42);vague=smoothstep(.8,1.,vague);',
  '  float m=clamp(uBase+vague*.26+revele*1.5,0.,1.);',
  '  gLac=1.-.9*tx.a*smoothstep(.1,.75,m);',
  '  float b1=smoothstep(-.5,.6,sin(q.x*1.1+q.y*.5+1.3));',
  '  float b2=smoothstep(-.2,.8,sin(q.x*.8-q.y*.7+4.2+t*.03));',
  '  float h=.52*sin(q.y*1.9+1.2*sin(q.x*1.1+t*.05));',
  '  h+=(.4+.6*fin)*b1*.27*pic(q.y*5.6+1.5*sin(q.x*1.3)+.7);',
  '  h+=(.12+.88*fin)*b2*.135*pic(q.y*12.+2.1*sin(q.x*.9+1.));',
  '  h+=fin*b1*b2*.07*pic(q.y*23.+2.6*sin(q.x*.7+3.));',
  '  h+=touche*.16;',
  '  gNom=tx.r*m;',
  '  return h;',
  '}',
  // Le décor qui se reflète : des boîtes à lumière, nettes d'un côté, qui s'éteignent doucement de l'autre
  'float studio(vec2 r){',
  '  vec2 e=vec2(r.x*.8+r.y*.6,-r.x*.6+r.y*.8);',
  '  float s=fen(e.x,.2,.225,.3,.9)*(1.-smoothstep(.35,.95,abs(e.y)));',
  '  s+=.95*fen(e.x,-.6,-.575,-.52,-.3)*(1.-smoothstep(.35,.85,abs(e.y+.12)));',
  '  s+=.85*filet(e.y-.5,.03)*fen(e.x,-.7,-.2,.3,.8);',
  '  s+=.7*filet(e.y+.55,.024)*fen(e.x,-.6,-.1,.2,.7);',
  '  s+=.42*fen(e.x,-.26,-.04,.14,.2)*fen(e.y,.05,.24,.42,.7);',
  '  return min(s,1.);',
  '}',
  // La version blanche : presque tout est clair, avec des nappes noires au bord net d'un côté et doux de l'autre
  'float nappes(vec2 r){',
  '  vec2 e=vec2(r.x*.6-r.y*.8,r.x*.8+r.y*.6);',
  '  float s=smoothstep(.1,.36,e.x)*.28+smoothstep(.36-gL,.385+gL,e.x)*.72;',
  '  s*=1.-smoothstep(.72,.98,e.x);',
  '  s+=smoothstep(.2,.56,-e.x)*(1.-smoothstep(.8,.84,-e.x))*(1.-smoothstep(.3,.8,abs(e.y)));',
  '  s+=filet(e.y-.55,.028)*.85*fen(e.x,-.6,-.3,.3,.6);',
  '  return min(s,1.);',
  '}',
  'void main(){',
  '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);',
  '  float e=.0032,h0=champ(uv),nom=gNom,lac=gLac;',
  '  float hx=champ(uv+vec2(e,0.)),nx=gNom;',
  '  float hy=champ(uv+vec2(0.,e)),ny=gNom;',
  // La pente du liquide s'aplatit autour des lettres, celle des lettres s'y ajoute
  '  vec2 g=(vec2(hx,hy)-h0)/e*lac+(vec2(nx,ny)-nom)/e*.036;',
  '  vec3 n=normalize(vec3(-g*.3,1.));',
  '  vec2 r=2.*n.z*n.xy+uv*.22;',
  '  gL=min(PIXEL(r)*.7,.12);',
  '  vec2 dd=normalize(n.xy+vec2(1e-4))*.007;',
  // Noir : reflets francs, à peine irisés de violet sur les arêtes
  '  vec3 c=vec3(studio(r+dd),studio(r),studio(r+dd*1.5));',
  '  c.g=min(c.g,max(c.r,c.b));',
  '  vec3 noir=.006+c*.97+nom*.15;',
  // Blanc : grandes zones claires, nappes noires, liserés discrets
  '  vec3 k=vec3(nappes(r+dd*.6),nappes(r),nappes(r+dd));',
  '  float gris=smoothstep(.1,.95,length(r));',
  '  vec3 blanc=mix(vec3(.985-.08*gris-nom*.1),vec3(.012),k);',
  '  gl_FragColor=vec4(mix(noir,blanc,uClair),1.);',
  '}'
  ].join('\n');

  var U = {}, texNom = null;
  var nomPret = false, formatNom = '';

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
    ['uRes','uT','uClair','uDefil','uBase','uP','uNom','uNomTaille'].forEach(function(n){ U[n] = gl.getUniformLocation(prog, n); });
    texNom = gl.createTexture();
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
    var vertical = innerWidth < innerHeight;
    var f = vertical ? 'v' : 'h';
    if(f === formatNom && nomPret) return;
    formatNom = f;
    var lignes = vertical ? ['L’ÉCO','PTICIEN'] : ['L’ÉCOPTICIEN'];
    var W = 768, H = vertical ? 520 : 210;
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
    // Autour des lettres : une zone qui s'estompe, nulle sur les bords de la texture
    var dehors = new Float32Array(W*H);
    for(i = 0; i < W*H; i++) dehors[i] = 1-cout[i];
    var loin = distances(dehors, W, H), rayon = CORPS*k*.46;
    for(var yy = 1; yy < H-1; yy++) for(var xx = 1; xx < W-1; xx++){
      i = xx+yy*W;
      var e = Math.max(0, 1-Math.sqrt(loin[i])/rayon);
      e = e*e*(3-2*e)*Math.min(1, Math.min(xx, W-1-xx, yy, H-1-yy)/22);
      octets[2*i] = Math.round(255*relief[i]);
      octets[2*i+1] = Math.round(255*e);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texNom);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, W, H, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, octets);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(U.uNom, 0);
    // Taille du nom dans les unités du liquide (le petit côté de l'écran vaut 1)
    var largeur = (vertical ? .84 : Math.min(1.36, .8*innerWidth/innerHeight))/.82;
    gl.uniform2f(U.uNomTaille, largeur, largeur*H/W);
    nomPret = true;
  }
  if(document.fonts && document.fonts.load){
    document.fonts.load('800 22px "Bodoni Moda"').then(function(){ nomPret = false; dessinerNom(); }, dessinerNom);
  }
  dessinerNom();

  // Résolution de calcul : le liquide est doux, on peut calculer moins de points que l'écran n'en a
  var qualite = tactile ? 1.25 : 1, RW = 0, RH = 0;
  function dimensionner(){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight;
    var k = Math.min(qualite, 1100/Math.max(w,h));
    var nw = Math.max(2, Math.round(w*k)), nh = Math.max(2, Math.round(h*k));
    if(nw === RW && nh === RH) return;
    RW = nw; RH = nh; toile.width = nw; toile.height = nh;
    gl.viewport(0,0,nw,nh);
    gl.uniform2f(U.uRes, nw, nh);
  }
  dimensionner();

  // Le doigt ou la souris laissent une traînée de six points qui s'efface doucement
  var points = new Float32Array(18), dernier = [9,9], appui = false;
  function toucher(x,y,force){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight, m = Math.min(w,h);
    var px = (x-w/2)/m, py = (h/2-y)/m;
    force = force || 1;
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
  var dernierY = scrollY, balayage = -1, balayageFait = false;
  var sectionsClaires = [].slice.call(document.querySelectorAll('.t-clair'));
  var fenetre = document.getElementById('fenetre');
  function lireScroll(){
    var y = scrollY, milieu = innerHeight/2;
    agite = Math.min(1, agite + Math.abs(y-dernierY)*.0012);
    defilCible -= (y-dernierY)*.00042;
    dernierY = y;
    clairCible = 0;
    sectionsClaires.forEach(function(s){ var r = s.getBoundingClientRect(); if(r.top < milieu && r.bottom > milieu) clairCible = 1; });
    // Dans la fenêtre dédiée, le nom se devine davantage, et un passage le montre une première fois
    var f = fenetre && fenetre.getBoundingClientRect();
    var dansFenetre = f && f.top < innerHeight*.6 && f.bottom > innerHeight*.4;
    baseCible = dansFenetre ? .14 : 0;
    if(dansFenetre && !balayageFait && !calme){ balayageFait = true; balayage = 0; }
  }
  addEventListener('scroll', lireScroll, {passive:true});
  addEventListener('resize', function(){ dimensionner(); dessinerNom(); lireScroll(); });
  lireScroll();

  // Boucle : 30 images par seconde sur téléphone, moins de points si l'appareil peine
  var adapte = true, avant = 0, prec = 0, lents = 0, rapides = 0, pas = tactile ? 1000/31 : 1000/61;
  function dessiner(){
    gl.uniform1f(U.uT, temps); gl.uniform1f(U.uClair, clair);
    gl.uniform1f(U.uDefil, defil); gl.uniform1f(U.uBase, base);
    gl.uniform3fv(U.uP, points);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function boucle(n){
    requestAnimationFrame(boucle);
    if(document.hidden || n-avant < pas) return;
    var dt = Math.min(.08, (n-avant)/1000);
    var coutMs = n-prec; prec = n;
    avant = n;
    temps += dt*(1+agite*2.2);
    agite *= Math.pow(.2, dt);
    clair += (clairCible-clair)*(1-Math.pow(.04, dt));
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
    // Qualité automatique : si les images tardent, on calcule moins de points
    if(coutMs > pas*1.4){ lents++; rapides = 0; } else { rapides++; if(rapides > 30) lents = 0; }
    if(adapte && lents > 24 && qualite > .5){ qualite *= .8; lents = 0; dimensionner(); dessiner(); }
  }
  // Mouvement réduit : une seule image, pas d'animation
  function tout(){ dimensionner(); dessinerNom(); dessiner(); }
  if(calme){ tout(); addEventListener('resize', tout); if(document.fonts && document.fonts.ready) document.fonts.ready.then(tout); }
  else requestAnimationFrame(boucle);

  // Si le téléphone reprend la main sur la carte graphique, on repart de zéro au retour
  toile.addEventListener('webglcontextlost', function(e){ e.preventDefault(); });
  toile.addEventListener('webglcontextrestored', function(){
    preparer(); nomPret = false; RW = RH = 0; dimensionner(); dessinerNom(); if(calme) dessiner();
  });

  // Accès pour les tests
  window.__liquide = {toucher:toucher, regler:function(o){ if('t' in o) temps = o.t; if('clair' in o){ clair = clairCible = o.clair; } if('base' in o){ base = baseCible = o.base; } if('qualite' in o){ qualite = o.qualite; adapte = false; dimensionner(); } dessiner(); }};
})();

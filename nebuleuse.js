// Fond en nébuleuse : du gaz calculé une fois pour toutes (img/nebuleuse.webp), des étoiles calculées en direct.
// Le gaz dérive lentement, le doigt ou la souris l'écartent et l'éclairent, le nom du magasin est caché dedans :
// il ne ressort que là où on touche la nébuleuse et quand une lueur lente passe dessus.
(function(){
  var toile = document.getElementById('fond');
  if(!toile) return;
  var racine = document.documentElement;
  // Avec le réglage « moins d'animations » du système, le gaz dérive plus lentement et le scroll ne l'agite plus.
  // Il réagit toujours au doigt et à la souris, et un bouton en bas de page permet de l'arrêter.
  var reduit = matchMedia('(prefers-reduced-motion: reduce)').matches, fige = false;
  var tactile = navigator.maxTouchPoints > 0;
  var gl = toile.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false});
  function sansFond(){
    toile.style.display = 'none';
    racine.classList.add('sans-fond');
    var f = document.getElementById('fenetre');
    if(f) f.style.display = 'none';
  }
  if(!gl){ sansFond(); return; }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
  'precision highp float;',
  'uniform vec2 uRes,uVue,uNomTaille;uniform float uT,uClair,uEco,uDefil,uBase,uTouche,uPret,uPx,uVR;',
  'uniform vec3 uP[6];uniform vec4 uV[4];uniform sampler2D uNom,uGaz,uVoile;',
  'const float TUILE=2.6;', // Une image de gaz couvre 2,6 fois le petit côté de l'écran
  'float gCote;',
  'vec2 h22(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.103,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}',
  // Les petites étoiles : au plus une par case, toujours nette, jamais coupée par le bord de la case
  'vec3 fines(vec2 p,float cases,float part,float graine){',
  '  vec2 g=p*cases,id=floor(g),f=fract(g)-.5,a=h22(id+graine);',
  '  if(a.x>part)return vec3(0.);',
  '  vec2 b=h22(id+graine+17.);',
  '  float d=length(f-(b-.5)*.7)*gCote/cases,e=a.y*a.y;e*=e;',
  '  float r=uPx*(.46+.8*e);',
  '  vec3 c=mix(vec3(.74,.84,1.),vec3(1.,.87,.7),b.x);',
  '  return c*exp(-d*d/(r*r))*(.16+1.05*e);',
  '}',
  // Les étoiles vives : un cœur, un halo et une croix de diffraction, comme sur les photos de télescope
  'vec3 vives(vec2 p,float t){',
  '  const float C=3.1;',
  '  vec2 g=p*C,id=floor(g),f=fract(g)-.5,a=h22(id+41.);',
  '  if(a.x>.62)return vec3(0.);',
  '  vec2 b=h22(id+59.),v=f-(b-.5)*.4;',
  '  float d=length(v),e=.3+.7*a.y*a.y,enPx=gCote/C,px=d*enPx;',
  '  float r=uPx*(.9+1.25*e),tient=1.-smoothstep(.1,.29,d);',
  '  float scint=.88+.12*sin(t*(.6+1.4*a.x)+a.y*40.);',
  '  float coeur=exp(-px*px/(r*r));',
  '  float halo=exp(-d*d/(.0011+.0034*e))*.2*e;',
  '  float w=uPx*.7/enPx,l=.035+.075*e;',
  '  float croix=exp(-abs(v.y)/w-abs(v.x)/l)+exp(-abs(v.x)/w-abs(v.y)/l);',
  '  vec3 c=mix(vec3(.7,.82,1.),vec3(1.,.82,.62),b.y);',
  '  return mix(c,vec3(1.),coeur)*(coeur*1.25+halo+croix*.55*e)*tient*scint;',
  '}',
  'void main(){',
  '  gCote=min(uRes.x,uRes.y);',
  '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/gCote;',
  // Sous un panneau : près du bord, le verre courbe la vue vers l'intérieur, comme une épaisseur de verre
  '  vec2 w=uv;float dans=0.;',
  '  for(int i=0;i<4;i++){',
  '    vec4 b=uV[i];',
  '    vec2 c=.5*(b.xy+b.zw),q=abs(uv-c)-.5*(b.zw-b.xy)+uVR;',
  '    float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-uVR;',
  '    if(sd<0.){',
  '      vec2 s=vec2(uv.x<c.x?-1.:1.,uv.y<c.y?-1.:1.),dir;',
  '      if(q.x>0.&&q.y>0.)dir=normalize(q)*s;',
  '      else if(q.x>q.y)dir=vec2(s.x,0.);',
  '      else dir=vec2(0.,s.y);',
  '      float k=clamp(1.+sd/.06,0.,1.);',
  '      w=uv-dir*k*k*.05;',
  '      dans=1.-smoothstep(-.05,0.,sd);',
  '    }',
  '  }',
  // Le doigt ou la souris écartent le gaz en tourbillon, l'éclairent et dissipent le voile
  '  vec2 pousse=vec2(0.);float revele=0.,lueur=0.;',
  '  if(uTouche>.002){',
  '    for(int i=0;i<6;i++){',
  '      vec2 v=w-uP[i].xy;float d=dot(v,v),z=uP[i].z,f=z*z*exp(-d/.04);',
  '      pousse+=(v*.36+vec2(-v.y,v.x)*.4)*f;',
  '      revele+=z*exp(-d/.075);',
  '      lueur+=z*exp(-d/.022);',
  '    }',
  '  }',
  '  float t=uT;',
  // Le gaz dérive, et de lentes ondes le déforment. Elles ont un nombre entier de périodes, l'image reste sans raccord.
  '  vec2 q=(w-pousse)/TUILE+vec2(.37+t*.0011,.12-t*.0007)+vec2(uVue.x,uVue.y+uDefil*2.2)*.046;',
  '  vec2 s=q*6.2831853;',
  '  vec2 fl=.0125*vec2(sin(s.y*2.+t*.07)+.6*sin(s.x*3.+s.y+t*.053),sin(s.x*2.-t*.061)+.6*sin(s.y*3.-s.x*2.+t*.047));',
  '  vec3 g=texture2D(uGaz,q+fl).rgb*uPret;',
  '  g*=.9+.24*texture2D(uVoile,q*3.+fl*2.).r;',
  // Le voile de poussière passe devant, à sa propre vitesse
  '  vec2 qv=(w-pousse*1.4)/1.9+vec2(.71-t*.0016,.33+t*.0009)+vec2(uVue.x,uVue.y+uDefil*2.)*.11-fl*.6;',
  '  float voile=texture2D(uVoile,qv).r*uPret*(1.-clamp(revele*1.1,0.,1.));',
  '  g*=1.-.62*voile;',
  '  g=max(g,mix(vec3(.009,.011,.024),vec3(.005,.018,.014),uEco));',
  // Le nom ondule avec le gaz ; une lueur lente le fait ressortir de temps en temps, et le gaz s'assombrit autour des lettres
  '  float vague=smoothstep(.8,1.,sin(uv.x*1.1+uv.y*.7-t*.42));',
  '  float m=clamp(uBase+vague*.26+revele*1.5,0.,1.),nom=0.,calme=0.;',
  '  if(m>.002){',
  '    vec2 n=(uv+fl*1.1)/uNomTaille;n.y=-n.y;n+=.5;',
  '    vec4 tx=texture2D(uNom,n);',
  '    nom=tx.r*m;calme=tx.a*smoothstep(.1,.75,m);',
  '    g*=1.-.8*calme;',
  '  }',
  // Thème écologique : le même gaz, en vert, avec des cœurs dorés
  '  if(uEco>.001){',
  '    vec3 e=vec3(dot(g,vec3(.22,.1,.03)),dot(g,vec3(.5,.32,.1)),dot(g,vec3(.2,.16,.34)));',
  '    float l=dot(g,vec3(.3,.59,.11)),k=clamp((l-.55)/.4,0.,1.);',
  '    e=mix(e,vec3(.97,.9,.66)*sqrt(l),k*sqrt(k)*.72);',
  '    g=mix(g,e,uEco);',
  '  }',
  // Dans les sections claires, on entre dans le gaz lumineux
  '  if(uClair>.001){',
  '    vec3 b=1.-(1.-g)*(1.-g)*(1.-g);',
  '    g=mix(g,b*.84+mix(vec3(.21,.2,.23),vec3(.19,.23,.19),uEco),uClair);',
  '  }',
  '  vec3 teinte=mix(vec3(1.,.74,.48),vec3(.62,1.,.76),uEco);',
  '  g*=1.+1.15*lueur;',
  '  g+=teinte*lueur*.05;',
  // Les étoiles : trois profondeurs, moins visibles derrière le voile, sous le verre et dans les sections claires
  '  vec2 ve=uVue*.012;',
  '  vec3 et=fines(w+vec2(.13,uDefil*.06)+ve*.5,38.,.3,1.)',
  '    +fines(w+vec2(.41,uDefil*.1)+ve,74.,.2,7.)*.8',
  '    +fines(w+vec2(.77,uDefil*.14)+ve*1.4,122.,.12+nom*.8,13.)*(.6+nom*2.8);',
  '  et+=vives(w+vec2(.05,uDefil*.18)+ve*2.,t);',
  '  et*=(1.-.5*voile)*(1.-.6*dans)*(1.-.62*uClair);',
  '  g+=et;',
  // Le nom : du gaz chaud en forme de lettres, plus vif là où la nébuleuse est dense
  '  if(m>.002){',
  '    float l=dot(g,vec3(.3,.59,.11));',
  '    vec3 c=mix(vec3(1.,.83,.6),vec3(.9,.98,.78),uEco);',
  '    g+=c*nom*(.62+.5*l)+c*calme*m*.05;',
  '    g=mix(g,vec3(1.,.97,.92),nom*nom*.35);',
  '  }',
  // Un grain imperceptible évite les bandes dans les dégradés sombres
  '  g+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5)/150.;',
  '  gl_FragColor=vec4(g,1.);',
  '}'
  ].join('\n');

  var U = {}, texNom = null, texGaz = null, texVoile = null, imgGaz = null, imgVoile = null;
  var nomPret = false, nomAutorise = false, formatNom = '';

  function compiler(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function textureVide(unite, format){
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    var octets = format === gl.RGB ? 3 : format === gl.LUMINANCE_ALPHA ? 2 : 1;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, 1, 1, 0, format, gl.UNSIGNED_BYTE, new Uint8Array(octets));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }
  // Le gaz et le voile se répètent sans raccord, avec des versions réduites pour les petits écrans
  function poserImage(t, unite, format, img){
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.activeTexture(gl.TEXTURE0);
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
    ['uRes','uT','uClair','uEco','uDefil','uBase','uTouche','uPret','uPx','uVue','uP','uNom','uGaz','uVoile','uNomTaille','uV','uVR'].forEach(function(n){ U[n] = gl.getUniformLocation(prog, n); });
    // Textures vides en attendant la police et les images : le fond montre déjà les étoiles
    texGaz = textureVide(1, gl.RGB);
    texVoile = textureVide(2, gl.LUMINANCE);
    texNom = textureVide(0, gl.LUMINANCE_ALPHA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uNom, 0); gl.uniform1i(U.uGaz, 1); gl.uniform1i(U.uVoile, 2);
    gl.uniform2f(U.uNomTaille, 1, 1);
    if(imgGaz) poserImage(texGaz, 1, gl.RGB, imgGaz);
    if(imgVoile) poserImage(texVoile, 2, gl.LUMINANCE, imgVoile);
  }
  try { preparer(); } catch(err){ sansFond(); return; }

  // Le gaz apparaît en fondu dès que l'image est là. Sans elle, le site garde un ciel étoilé.
  var pret = 0, pretCible = 0;
  function charger(src, unite, format, fini){
    var img = new Image();
    img.decoding = 'async';
    img.onload = function(){
      try {
        poserImage(unite === 1 ? texGaz : texVoile, unite, format, img);
        fini(img);
        if(fige) dessiner();
      } catch(err){}
    };
    img.src = src;
  }
  charger('img/nebuleuse.webp', 1, gl.RGB, function(i){ imgGaz = i; pretCible = 1; if(fige) pret = 1; });
  charger('img/voile.webp', 2, gl.LUMINANCE, function(i){ imgVoile = i; });

  // Distance de chaque point d'une lettre à son bord : les lettres sont plus vives au centre, comme une masse de gaz
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

  // Le nom, écrit dans une texture : une ligne à l'horizontale, deux lignes en vertical
  function dessinerNom(){
    if(!nomAutorise) return;
    var vertical = innerWidth < innerHeight;
    var f = vertical ? 'v' : 'h';
    if(f === formatNom && nomPret) return;
    formatNom = f;
    var lignes = vertical ? ['L’ÉCO','PTICIEN'] : ['L’ÉCOPTICIEN'];
    // Plus de définition sur les écrans fins, pour que les lettres restent nettes
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
    // Taille du nom dans les unités du fond (le petit côté de l'écran vaut 1)
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

  // Résolution de calcul : celle de l'écran, jusqu'à deux fois les pixels logiques. Le gaz est doux et les étoiles
  // sont dessinées à la bonne taille, il n'y a pas besoin de plus. Si l'appareil peine, on descend par paliers.
  var infoCarte = gl.getExtension('WEBGL_debug_renderer_info');
  var nomCarte = infoCarte ? String(gl.getParameter(infoCarte.UNMASKED_RENDERER_WEBGL)) : '';
  var cartePuissante = /RTX|GTX|Radeon RX|Radeon Pro|Arc\s|Apple M\d/i.test(nomCarte);
  var BUDGET = cartePuissante ? 9e6 : (tactile ? 2.2e6 : 4e6), MINI = .75;
  var qualite = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)), echelle = 1, RW = 0, RH = 0;
  function dimensionner(){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight;
    echelle = Math.min(qualite, Math.sqrt(BUDGET/(w*h)));
    var nw = Math.max(2, Math.round(w*echelle)), nh = Math.max(2, Math.round(h*echelle));
    if(nw === RW && nh === RH) return;
    RW = nw; RH = nh; toile.width = nw; toile.height = nh;
    gl.viewport(0,0,nw,nh);
    gl.uniform2f(U.uRes, nw, nh);
    gl.uniform1f(U.uPx, echelle);
  }
  dimensionner();

  // Le doigt ou la souris laissent une traînée de six points qui s'efface doucement
  var points = new Float32Array(18), dernier = [9,9], appui = false, geste = -1e9;
  var vue = [0,0], vueCible = [0,0];
  function toucher(x,y,force){
    var w = toile.clientWidth || innerWidth, h = toile.clientHeight || innerHeight, m = Math.min(w,h);
    var px = (x-w/2)/m, py = (h/2-y)/m;
    force = force || 1;
    if(force === 1){ geste = performance.now(); vueCible = [px,py]; }
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

  // Le scroll fait avancer dans la nébuleuse. Dans les sections claires, on entre dans le gaz lumineux.
  var clairCible = 0, clair = 0, base = 0, baseCible = 0, defil = 0, defilCible = 0, temps = 7, agite = 0;
  var ecoCible = racine.getAttribute('data-theme') === 'eco' ? 1 : 0, eco = ecoCible;
  var dernierY = scrollY, balayage = -1, balayageFait = false;
  var sectionsClaires = [].slice.call(document.querySelectorAll('.t-clair'));
  var fenetre = document.getElementById('fenetre');
  function lireScroll(){
    var y = scrollY, milieu = innerHeight/2;
    if(y !== dernierY) geste = performance.now();
    if(!reduit) agite = Math.min(1, agite + Math.abs(y-dernierY)*.0012);
    defilCible -= (y-dernierY)/Math.min(toile.clientWidth || innerWidth, toile.clientHeight || innerHeight);
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
    gl.uniform1f(U.uPret, pret); gl.uniform2f(U.uVue, vue[0], vue[1]);
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
    temps += dt*(reduit ? .45 : 1+agite*3.5);
    pret += (pretCible-pret)*(1-Math.pow(.02, dt));
    vue[0] += (vueCible[0]-vue[0])*(1-Math.pow(.12, dt));
    vue[1] += (vueCible[1]-vue[1])*(1-Math.pow(.12, dt));
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
    // Qualité automatique : si la cadence tombe durablement (sous 36 images par seconde sur ordinateur,
    // sous 22 sur téléphone), on calcule moins de points
    if(n-debut < 1500) return;
    if(coutMs > (tactile ? 45 : 28)){ lents++; rapides = 0; } else { rapides++; if(rapides > 30) lents = 0; }
    if(adapte && lents > 24 && echelle > MINI){
      qualite = Math.max(MINI, echelle*.8);
      lents = 0; dimensionner(); dessiner();
    }
  }
  requestAnimationFrame(boucle);
  addEventListener('resize', function(){ if(fige) dessiner(); });

  // La police d'abord, pour écrire le nom avec les bonnes lettres
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
  window.__fond = {
    theme: function(v){ ecoCible = v; mesurer(); if(fige){ eco = v; dessiner(); } },
    figer: function(v){ fige = v; if(!v){ avant = prec = performance.now(); lents = 0; } },
    toucher: toucher,
    regler: function(o){
      if('t' in o) temps = o.t;
      if('clair' in o){ clair = clairCible = o.clair; }
      if('base' in o){ base = baseCible = o.base; }
      if('eco' in o){ eco = ecoCible = o.eco; }
      if('pret' in o){ pret = pretCible = o.pret; }
      if('defil' in o){ defil = defilCible = o.defil; }
      if('vue' in o){ vue = vueCible = o.vue; }
      if('qualite' in o){ qualite = o.qualite; adapte = false; dimensionner(); }
      dessiner();
    }
  };
})();

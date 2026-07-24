/* =========================================================
   Ipso Facto — interactions
   ========================================================= */
(function () {
  "use strict";

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = $("#siteHeader");
  var nav = $("#mainNav");
  var toggle = $("#navToggle");

  /* ---------- header solid on scroll ---------- */
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir le menu");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeNav();
  });

  /* ---------- active section highlight ---------- */
  var navLinks = $$('a[href^="#"]', nav);
  var sections = navLinks.map(function (a) {
    var el = $(a.getAttribute("href"));
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("active"); });
          var m = sections.filter(function (s) { return s.el === entry.target; })[0];
          if (m) m.link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s.el); });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); obs.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- footer year ---------- */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- hero parallax ---------- */
  var heroMedia = $("#heroMedia");
  if (heroMedia && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var yv = window.scrollY;
        if (yv < window.innerHeight) heroMedia.style.transform = "scale(1.08) translateY(" + (yv * 0.14) + "px)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* =========================================================
     MODALS (generic)
     ========================================================= */
  var lastFocus = null;
  function openModal(modal) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    var f = modal.querySelector(".modal-close");
    if (f) setTimeout(function () { f.focus(); }, 40);
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!$(".modal.open")) document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // close via [data-close] / backdrop
  $$(".modal").forEach(function (modal) {
    $$("[data-close]", modal).forEach(function (b) {
      b.addEventListener("click", function () { closeModal(modal); });
    });
    // focus trap
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var foc = $$('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])', modal)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!foc.length) return;
      var first = foc[0], last = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var open = $(".modal.open");
      if (open) closeModal(open);
      else closeNav();
    }
  });

  /* =========================================================
     RESERVATION modal
     ========================================================= */
  var resaModal = $("#resaModal");
  var resaForm = $("#resaForm");
  var resaInfo = $("#resaInfo");
  var resaNote = $("#resaNote");
  var resaService = $("#resaService");
  var selectedService = "Déjeuner (12h–14h)";

  function openReservation() {
    var dish = $("#dishModal");
    if (dish && dish.classList.contains("open")) closeModal(dish);
    var dt = $("#r-date");
    if (dt && !dt.value) { var t = new Date(); dt.value = t.toISOString().slice(0, 10); }
    if (resaNote) { resaNote.textContent = ""; resaNote.className = "form-note"; }
    updateResaInfo();
    openModal(resaModal);
  }
  $$("[data-reserve]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); closeNav(); openReservation(); });
  });

  if (resaService) {
    $$(".seg-btn", resaService).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".seg-btn", resaService).forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        selectedService = b.getAttribute("data-service");
        updateResaInfo();
      });
    });
  }
  // stepper
  $$(".step-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var input = $("#r-nb");
      var v = parseInt(input.value, 10) || 1;
      v += parseInt(b.getAttribute("data-step"), 10);
      v = Math.max(1, Math.min(30, v));
      input.value = v;
      updateResaInfo();
    });
  });
  var rDate = $("#r-date"), rNb = $("#r-nb");
  if (rDate) rDate.addEventListener("change", updateResaInfo);
  if (rNb) rNb.addEventListener("input", updateResaInfo);

  function updateResaInfo() {
    if (!resaInfo) return;
    var nb = parseInt($("#r-nb").value, 10) || 0;
    var dv = $("#r-date").value;
    var day = dv ? new Date(dv + "T12:00:00").getDay() : -1;
    var isDinner = /Dîner/.test(selectedService);
    var msg = "";
    if (nb >= 15) {
      msg = "À partir de 15 personnes, nous ouvrons aussi le dimanche et le lundi soir — idéal pour un groupe.";
    } else if (day === 0) {
      msg = "Le dimanche, le restaurant est fermé (sauf groupe de 15 personnes et plus).";
    } else if (day === 1 && isDinner) {
      msg = "Le lundi soir, ouvert uniquement sur réservation de groupe (15 personnes et plus).";
    }
    resaInfo.textContent = msg;
  }

  if (resaForm) {
    resaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = resaForm.nom.value.trim();
      var tel = resaForm.tel.value.trim();
      var date = resaForm.date.value;
      var nb = resaForm.couverts.value;
      if (!nom || !tel || !date) {
        resaNote.textContent = "Merci d'indiquer votre nom, téléphone et la date.";
        resaNote.className = "form-note err";
        return;
      }
      var body = [
        "Demande de réservation",
        "",
        "Nom : " + nom,
        "Téléphone : " + tel,
        "Service : " + selectedService,
        "Date : " + date,
        "Couverts : " + nb
      ].join("\n");
      window.location.href = "mailto:ipsofacto.resto@gmail.com?subject=" +
        encodeURIComponent("Réservation — " + nom) + "&body=" + encodeURIComponent(body);
      resaNote.textContent = "Merci ! Votre messagerie s'ouvre pour confirmer. Vous pouvez aussi nous appeler.";
      resaNote.className = "form-note ok";
    });
  }

  /* =========================================================
     CARTE — tabs, filters, dish modal
     ========================================================= */
  var tabs = $$(".tab");
  var panels = $$(".dish-panel");
  var filtersBar = $("#filters");
  var emptyNote = $("#emptyNote");
  var currentTab = "entree";
  var currentFilter = "all";

  function showPanel(name) {
    currentTab = name;
    panels.forEach(function (p) { p.hidden = (p.getAttribute("data-panel") !== name); });
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (filtersBar) filtersBar.classList.toggle("is-hidden", name === "menus");
    applyFilter();
  }
  function applyFilter() {
    if (currentTab === "menus") { if (emptyNote) emptyNote.hidden = true; return; }
    var panel = $('[data-panel="' + currentTab + '"]');
    if (!panel) return;
    var visible = 0;
    $$(".dish", panel).forEach(function (d) {
      var tags = (d.getAttribute("data-tags") || "").split(" ");
      var ok = currentFilter === "all" || tags.indexOf(currentFilter) !== -1;
      d.classList.toggle("hidden", !ok);
      if (ok) visible++;
    });
    if (emptyNote) emptyNote.hidden = visible !== 0;
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showPanel(t.getAttribute("data-tab")); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var ni = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
        tabs[ni].focus(); tabs[ni].click();
      }
    });
  });
  if (filtersBar) {
    $$(".chip", filtersBar).forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip", filtersBar).forEach(function (x) { x.classList.remove("is-active"); });
        c.classList.add("is-active");
        currentFilter = c.getAttribute("data-filter");
        applyFilter();
      });
    });
  }

  // dish detail modal
  var dishModal = $("#dishModal");
  var dmMedia = $("#dmMedia"), dmTags = $("#dmTags"), dmName = $("#dishModalName"),
      dmDesc = $("#dmDesc"), dmPrice = $("#dmPrice");
  var catLabel = { entree: "Entrée", plat: "Plat", dessert: "Dessert" };

  $$(".dish").forEach(function (d) {
    d.addEventListener("click", function () {
      var img = d.getAttribute("data-img");
      if (img) {
        dmMedia.className = "dm-media";
        dmMedia.style.backgroundImage = 'url("' + img + '")';
        dmMedia.innerHTML = "";
      } else {
        dmMedia.className = "dm-media dm-media--empty";
        dmMedia.style.backgroundImage = "";
        dmMedia.innerHTML = '<span class="dm-emptymark">Ipso Facto</span>';
      }
      var tags = (d.getAttribute("data-tags") || "").split(" ").filter(Boolean);
      var html = '<span class="dm-tag cat">' + (catLabel[d.getAttribute("data-cat")] || "") + "</span>";
      if (tags.indexOf("signature") !== -1) html += '<span class="dm-tag sig">Signature</span>';
      if (tags.indexOf("vegetarien") !== -1) html += '<span class="dm-tag veg">Végétarien</span>';
      dmTags.innerHTML = html;
      dmName.innerHTML = d.getAttribute("data-name");
      dmDesc.textContent = d.getAttribute("data-desc");
      dmPrice.innerHTML = d.getAttribute("data-price");
      openModal(dishModal);
    });
  });

  /* =========================================================
     GALLERY — filters + lightbox
     ========================================================= */
  var gallery = $("#gallery");
  var gFilters = $("#galleryFilters");
  if (gFilters && gallery) {
    $$(".chip", gFilters).forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip", gFilters).forEach(function (x) { x.classList.remove("is-active"); });
        c.classList.add("is-active");
        var f = c.getAttribute("data-gfilter");
        $$(".g-item", gallery).forEach(function (it) {
          it.classList.toggle("hidden", f !== "all" && it.getAttribute("data-cat") !== f);
        });
      });
    });
  }

  var lb = $("#lightbox"), lbImg = $("#lbImg"),
      lbClose = $("#lbClose"), lbPrev = $("#lbPrev"), lbNext = $("#lbNext");
  if (gallery && lb) {
    var current = 0, list = [];
    function visibleItems() { return $$(".g-item", gallery).filter(function (i) { return !i.classList.contains("hidden"); }); }
    function show(i) {
      current = (i + list.length) % list.length;
      var btn = list[current];
      lbImg.src = btn.getAttribute("data-full");
      lbImg.alt = (btn.querySelector("img") || {}).alt || "";
    }
    function open(btn) {
      list = visibleItems();
      current = list.indexOf(btn);
      show(current);
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open"); lbClose.focus();
    }
    function close() {
      lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
      if (!$(".modal.open")) document.body.classList.remove("modal-open");
      lbImg.src = "";
    }
    $$(".g-item", gallery).forEach(function (btn) {
      btn.addEventListener("click", function () { open(btn); });
    });
    lbClose.addEventListener("click", close);
    lbPrev.addEventListener("click", function () { show(current - 1); });
    lbNext.addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* =========================================================
     LIVE open / closed status
     ========================================================= */
  var HOURS = {
    0: [],                       // dimanche
    1: [[12, 14]],               // lundi (midi)
    2: [[12, 14], [19, 23]],
    3: [[12, 14], [19, 23]],
    4: [[12, 14], [19, 23]],
    5: [[12, 14], [19, 23]],
    6: [[12, 14], [19, 23]]
  };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function computeStatus(now) {
    var day = now.getDay();
    var h = now.getHours() + now.getMinutes() / 60;
    var today = HOURS[day];
    for (var i = 0; i < today.length; i++) {
      if (h >= today[i][0] && h < today[i][1]) return { open: true, until: today[i][1] };
    }
    // next opening today
    for (var j = 0; j < today.length; j++) {
      if (h < today[j][0]) return { open: false, today: true, at: today[j][0], day: day };
    }
    // next day with service
    for (var k = 1; k <= 7; k++) {
      var nd = (day + k) % 7;
      if (HOURS[nd].length) return { open: false, today: false, at: HOURS[nd][0][0], day: nd, offset: k };
    }
    return { open: false };
  }
  function fmtHour(x) { return x % 1 === 0 ? x + "h" : Math.floor(x) + "h" + ("0" + Math.round((x % 1) * 60)).slice(-2); }

  function renderStatus() {
    var s = computeStatus(new Date());
    var cls, txt;
    if (s.open) {
      cls = "is-open"; txt = "Ouvert · ferme à " + fmtHour(s.until);
    } else if (s.today) {
      cls = "is-closed"; txt = "Fermé · ouvre à " + fmtHour(s.at);
    } else if (s.day != null) {
      cls = "is-closed";
      var when = s.offset === 1 ? "demain" : DAYS[s.day];
      txt = "Fermé · ouvre " + when + " à " + fmtHour(s.at);
    } else {
      cls = "is-closed"; txt = "Fermé";
    }
    // header pill
    var pill = $("#statusPillHeader");
    if (pill) {
      pill.hidden = false;
      $(".status-dot", pill).className = "status-dot " + cls;
      $(".status-text", pill).textContent = txt;
    }
    // hero inline
    var hero = $("#statusHero");
    if (hero) { hero.className = "status-inline " + cls; hero.textContent = " · " + txt; }
    // infos block
    var block = $("#statusBlock");
    if (block) { $(".status-dot", block).className = "status-dot " + cls; $(".status-text", block).textContent = txt; }
    // highlight current row (only when open)
    $$(".hours tr").forEach(function (tr) { tr.classList.remove("now"); });
    if (s.open) {
      var row = $('.hours tr[data-day="' + new Date().getDay() + '"]');
      if (row) row.classList.add("now");
    }
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* =========================================================
     STATS counters
     ========================================================= */
  var statsBand = $("#stats");
  if (statsBand && "IntersectionObserver" in window) {
    var seen = false;
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen) { seen = true; runCounters(); }
      });
    }, { threshold: 0.4 });
    so.observe(statsBand);
  }
  function runCounters() {
    $$(".stat-num", statsBand).forEach(function (el) {
      if (el.hasAttribute("data-static")) return;
      var target = parseFloat(el.getAttribute("data-target"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suf = el.getAttribute("data-suffix") || "";
      if (reduce) { el.textContent = fmtNum(target, dec) + suf; return; }
      var dur = 1400, t0 = null;
      function frame(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmtNum(target * eased, dec) + suf;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = fmtNum(target, dec) + suf;
      }
      requestAnimationFrame(frame);
    });
  }
  function fmtNum(v, dec) { return v.toFixed(dec).replace(".", ","); }

  /* =========================================================
     REVIEWS carousel
     ========================================================= */
  var track = $("#reviewsTrack");
  if (track) {
    var slides = $$(".review", track);
    var dotsWrap = $("#reviewsDots");
    var idx = 0, timer = null;
    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.className = "rdot" + (i === 0 ? " is-active" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Avis " + (i + 1));
      b.addEventListener("click", function () { go(i); reset(); });
      dotsWrap.appendChild(b);
    });
    var dots = $$(".rdot", dotsWrap);
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      dots.forEach(function (d, di) { d.classList.toggle("is-active", di === idx); });
    }
    function next() { go(idx + 1); }
    function reset() { if (timer) { clearInterval(timer); start(); } }
    function start() { if (!reduce) timer = setInterval(next, 5500); }
    $("#revNext").addEventListener("click", function () { go(idx + 1); reset(); });
    $("#revPrev").addEventListener("click", function () { go(idx - 1); reset(); });
    var rc = $("#reviews");
    rc.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    rc.addEventListener("mouseleave", start);
    start();
  }

})();

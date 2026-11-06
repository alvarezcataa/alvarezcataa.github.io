// ============================================================
// 0. CELULARES / TÁCTILES: scroll nativo
//    En pantallas táctiles no se usa la interpolación por JS (se sentía
//    pesada) ni el snap por JS: el wrapper pasa a ser un contenedor fijo
//    con scroll nativo y snap por CSS (ver html.nativo en styles.css).
//    El documento no scrollea, así que las barras del navegador del
//    celular no aparecen ni desaparecen y el alto de pantalla es estable.
// ============================================================
var CAVLA_NATIVO = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
if (CAVLA_NATIVO) document.documentElement.classList.add("nativo");
// Safari de iPhone con iOS 26+ (no Google, Instagram, Chrome…): se desplaza la página entera ("cubre"); el resto, contenedor fijo ("fijo").
var CAVLA_SAF26 = CAVLA_NATIVO && (function () {
  var ua = navigator.userAgent, v = /Version\/(\d+)/.exec(ua);
  return /iPhone/.test(ua) && /Safari\//.test(ua) && !!v && +v[1] >= 26 &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|Instagram|FBAN|FBAV|Line\/|Snapchat|TikTok|Twitter|LinkedIn|Pinterest/.test(ua);
})();
var CAVLA_FIJO = CAVLA_NATIVO && !CAVLA_SAF26;
if (CAVLA_NATIVO) document.documentElement.classList.add(CAVLA_SAF26 ? "cubre" : "fijo");
// Safari de iPhone (iOS 26+): el contenido se ve por detrás de la hora y de la barra inferior, pero la ventana de la página es más corta que
// la pantalla. Se miden esas franjas y cada pantalla pasa a medir el alto físico completo (ver html.cubre en styles.css). Sin efecto en Google, Chrome, etc.
var CAVLA_T = 0, CAVLA_CUBRE = false, CAVLA_SVH = 0;
(function () {
  if (!CAVLA_SAF26) return;
  var root = document.documentElement;
  function topeHora(S) {   // alto de la barra de estado según el tamaño de pantalla del iPhone
    var t = { 956: 62, 932: 59, 926: 47, 896: 48, 874: 62, 852: 59, 844: 47, 812: 50 }[S];
    if (t) return t;
    return S >= 850 ? 59 : (S >= 800 ? 47 : 20);
  }
  function franjas() {
    var wrapper = document.querySelector(".smooth-scroll-wrapper");
    if (!wrapper) return;
    Array.prototype.forEach.call(wrapper.children, function (sec) {
      if (!sec.classList.contains("mainContent")) return;
      var llena = sec.classList.contains("pantalla-s") || Math.abs(sec.offsetHeight - CAVLA_SVH) < 3;
      sec.classList.toggle("pantalla-s", llena);
      var tiene = sec.querySelector(":scope > .franja");
      if (llena && !tiene) {
        if (getComputedStyle(sec).position === "static") sec.style.position = "relative";
        ["sup", "inf"].forEach(function (k) {
          var d = document.createElement("i"); d.className = "franja franja--" + k; d.setAttribute("aria-hidden", "true"); sec.appendChild(d);
        });
        var v = document.createElement("i"); v.className = "velo"; v.setAttribute("aria-hidden", "true"); sec.appendChild(v);
      }
    });
  }
  function mide() {
    var S = Math.max(screen.width, screen.height);
    var vertical = window.innerHeight > window.innerWidth;
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;left:0;width:1px;height:100svh";
    document.body.appendChild(probe);
    var svh = probe.offsetHeight;
    document.body.removeChild(probe);
    var T = topeHora(S), Bx = S - T - svh;
    if (!vertical || S - svh < 60 || Bx < 10) { root.classList.remove("medido"); CAVLA_CUBRE = false; CAVLA_T = 0; return; }
    CAVLA_T = T; CAVLA_CUBRE = true; CAVLA_SVH = svh;
    root.style.setProperty("--S", S + "px");
    root.style.setProperty("--T", T + "px");
    root.style.setProperty("--Bx", Bx + "px");
    root.classList.add("medido");
    franjas();
  }
  window.cavlaMideCubre = mide;
  window.addEventListener("load", function () {
    mide();
    // al arrancar, la primera pantalla queda pegada al borde físico de arriba (posición de imán = T)
    if (CAVLA_CUBRE && (window.pageYOffset || 0) < CAVLA_T) window.scrollTo(0, CAVLA_T);
    setTimeout(mide, 400); setTimeout(mide, 1500);   // por si otras partes de la página arman el contenedor más tarde
  }, { once: true });
  window.addEventListener("orientationchange", function () { setTimeout(mide, 300); });
})();
// Desplaza la página: en táctiles el que se desplaza es el wrapper (contenedor fijo), en PC la ventana.
function cavlaScrollTo(top, behavior) {
  var w = CAVLA_FIJO && document.querySelector(".smooth-scroll-wrapper");
  if (w) w.scrollTo({ top: top, behavior: behavior || "auto" });
  else window.scrollTo({ top: top + (CAVLA_CUBRE ? CAVLA_T : 0), behavior: behavior || "auto" });
}
// Sin el wrapper fijo, los espacios en blanco sueltos del <body> se dibujan como una línea de 18px arriba del todo: se quitan.
if (CAVLA_NATIVO) document.addEventListener("DOMContentLoaded", function () {
  Array.prototype.slice.call(document.body.childNodes).forEach(function (n) { if (n.nodeType === 3 && !n.textContent.trim()) n.parentNode.removeChild(n); });
}, { once: true });

// ============================================================
// 1. SMOOTH SCROLL + SNAP IMANTADO + MENÚ LATERAL
//    Construye el wrapper de scroll suave, calcula posiciones
//    de sección, aplica lerp en cada frame y snappea al soltar.
// ============================================================

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* --- Menú: marcar la página actual --- */
    (function () {
      const norm = (p) => (p.replace(/\/index(\.html)?$/, "/").replace(/\.html$/, "").replace(/\/+$/, "")) || "/";
      const actual = norm(location.pathname);
      document.querySelectorAll(".cavla-nav__center a, .side-menu a").forEach((a) => {
        const h = norm(a.getAttribute("href") || "");
        if (h === actual || (h !== "/" && actual.indexOf(h + "/") === 0)) a.setAttribute("aria-current", "page");
      });
    })();

    /* --- Selectores principales --- */
    const sideMenu = document.getElementById("sideMenu");
    const toggleBtn = document.querySelector(".menu-toggle");
    const logo = document.querySelector(".logo");

    // Preferimos secciones marcadas con .mainContent
    let sections = Array.from(document.querySelectorAll(".mainContent")).filter(s => getComputedStyle(s).display !== "none");
    // Fallback: <section> visibles excluyendo nav y sideMenu
    if (!sections.length) {
      sections = Array.from(document.querySelectorAll("section")).filter(s => {
        return !s.closest("#sideMenu") && !s.classList.contains("navbar") && s !== document.querySelector("nav");
      });
    }

    /* --- Construir el wrapper de scroll --- */
    const firstSection = sections[0];
    const wrapper = document.createElement("div");
    wrapper.className = "smooth-scroll-wrapper";

    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(wrapper, firstSection);
    } else {
      document.body.insertBefore(wrapper, document.body.firstChild);
    }

    sections.forEach(s => wrapper.appendChild(s));

    if (!CAVLA_NATIVO) Object.assign(wrapper.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      willChange: "transform",
      overflow: "hidden",
      zIndex: "0"
    });

    /* --- Altura del body = altura real del contenido --- */
    const setBodyHeight = () => {
      if (CAVLA_NATIVO) return;
      const h = wrapper.getBoundingClientRect().height;
      document.body.style.height = `${Math.ceil(h)}px`;
    };
    setBodyHeight();

    window.addEventListener("resize", () => {
      setBodyHeight();
      computeSectionPositions();
    });
    window.addEventListener("load", () => {
      setBodyHeight();
      computeSectionPositions();
    });

    /* --- Calcular posición acumulada de cada sección --- */
    let sectionPositions = [];
    function computeSectionPositions() {
      sectionPositions = [];
      let acc = 0;
      sections.forEach((s) => {
        const h = s.getBoundingClientRect().height;
        sectionPositions.push(acc);
        acc += h;
      });
      setBodyHeight();
    }
    computeSectionPositions();

    /* --- Contenedor fijo (Google, Instagram, Chrome…): el alto de pantalla es el del contenedor, no cambia con las barras del navegador --- */
    if (CAVLA_FIJO) {
      const fijaVh = () => {
        const a = document.activeElement;
        if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;   // teclado abierto: no se recalcula
        const h = wrapper.clientHeight;
        if (h > 0) document.documentElement.style.setProperty("--vh", (h / 100) + "px");
        computeSectionPositions();
      };
      fijaVh();
      window.addEventListener("resize", fijaVh);
      window.addEventListener("orientationchange", () => setTimeout(fijaVh, 300));
      window.addEventListener("load", fijaVh);
    }

    /* --- Loop de interpolación (lerp) --- */
    let current = 0;
    let target = 0;
    const ease = 0.085; // 0.04 = muy suave · 0.12 = más rápido
    const portada = wrapper.querySelector(".page_fondo-proyecto");
    const maxScale = 1.12;

    function actualizaPortada() {
      if (!portada) return;
      const rect = portada.getBoundingClientRect();
      const vh = window.innerHeight;
      let visibleRatio = (vh - rect.top) / (vh + rect.height);
      visibleRatio = Math.min(Math.max(visibleRatio, 0), 1);
      portada.style.transform = `scale(${1 + visibleRatio * (maxScale - 1)})`;
    }

    function rafLoop() {
      target = window.scrollY || window.pageYOffset;
      current += (target - current) * ease;
      wrapper.style.transform = `translate3d(0, ${-current}px, 0)`;

      // Parallax / zoom de portada (solo si existe .page_fondo-proyecto)
      if (portada) {
        const rect = portada.getBoundingClientRect();
        const vh = window.innerHeight;
        let visibleRatio = (vh - rect.top) / (vh + rect.height);
        visibleRatio = Math.min(Math.max(visibleRatio, 0), 1);
        const scale = 1 + visibleRatio * (maxScale - 1);
        portada.style.transform = `scale(${scale})`;
      }

      requestAnimationFrame(rafLoop);
    }
    if (CAVLA_NATIVO) {
      let ticking = false;
      (CAVLA_FIJO ? wrapper : window).addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { actualizaPortada(); ticking = false; });
      }, { passive: true });
      actualizaPortada();
    } else {
      requestAnimationFrame(rafLoop);
    }

    /* --- Snap: se activa tras soltar el scroll --- */
    let scrollTimer = null;
    const snapDelay = 150;    // ms de espera tras el último evento de scroll
    const snapThreshold = 0;  // px de tolerancia (0 = siempre snappea)

    function scheduleSnap() {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { doSnap(); }, snapDelay);
    }

    function doSnap() {
      // No snappear si está inhibido (inputs activos, redirección en curso, menú abierto)
      if (window.__snapInhibited) return;
      if (sideMenu && sideMenu.classList.contains("open")) return;

      const y = window.scrollY || window.pageYOffset;
      let closestIndex = 0;
      let minDiff = Infinity;
      sectionPositions.forEach((pos, i) => {
        const diff = Math.abs(pos - y);
        if (diff < minDiff) { minDiff = diff; closestIndex = i; }
      });

      if (minDiff <= snapThreshold) return;

      window.scrollTo({ top: sectionPositions[closestIndex], behavior: "smooth" });
    }

    if (!CAVLA_NATIVO) {   // en táctiles el snap lo hace el navegador (CSS)
      window.addEventListener("wheel",       scheduleSnap, { passive: true });
      window.addEventListener("touchend",    scheduleSnap, { passive: true });
      window.addEventListener("touchcancel", scheduleSnap, { passive: true });
      window.addEventListener("keydown",     () => { scheduleSnap(); });
    }

    /* --- Menú lateral: abrir / cerrar --- */
    // Se llama con onclick="toggleMenu()" en el HTML
    window.toggleMenu = function () {
      if (!sideMenu) return;
      sideMenu.classList.toggle("open");
      const opened = sideMenu.classList.contains("open");
      wrapper.classList.toggle("blur", opened);
      sections.forEach(s => s.classList.toggle("blur", opened));
    };

    // Cerrar al hacer click fuera del menú
    document.addEventListener("click", (e) => {
      if (!sideMenu || !sideMenu.classList.contains("open")) return;
      if (sideMenu.contains(e.target) || (toggleBtn && toggleBtn.contains(e.target))) return;
      sideMenu.classList.remove("open");
      wrapper.classList.remove("blur");
      sections.forEach(s => s.classList.remove("blur"));
    });

    // Cerrar tocando cualquier parte del menú que no sea un enlace, o deslizando de izquierda a derecha
    if (sideMenu) {
      const cerrarMenu = () => {
        sideMenu.classList.remove("open");
        wrapper.classList.remove("blur");
        sections.forEach(s => s.classList.remove("blur"));
      };
      sideMenu.addEventListener("click", (e) => {
        if (!e.target.closest("a")) cerrarMenu();
      });
      let tx = null, ty = null;
      sideMenu.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      sideMenu.addEventListener("touchend", (e) => {
        if (tx === null) return;
        const dx = e.changedTouches[0].clientX - tx, dy = Math.abs(e.changedTouches[0].clientY - ty);
        tx = null;
        if (dx > 50 && dx > dy) cerrarMenu();
      }, { passive: true });
    }

    // Marca en <html> si el menú está abierto (las franjas de Safari y otros estilos lo usan)
    if (sideMenu) {
      new MutationObserver(() => document.documentElement.classList.toggle("menu-abierto", sideMenu.classList.contains("open")))
        .observe(sideMenu, { attributes: true, attributeFilter: ["class"] });
    }

    // Abrir deslizando de derecha a izquierda desde cualquier pantalla (solo táctiles)
    if (CAVLA_NATIVO && sideMenu) {
      let ox = null, oy = null, bloquea = false;
      document.addEventListener("touchstart", (e) => {
        if (sideMenu.classList.contains("open") || e.touches.length !== 1) { ox = null; return; }
        ox = e.touches[0].clientX; oy = e.touches[0].clientY;
        bloquea = !!(e.target.closest && e.target.closest(".grilla-servicios, .carril, .carril-wrap, .filtros, input, textarea, select, [data-no-menu]"));
      }, { passive: true });
      document.addEventListener("touchend", (e) => {
        if (ox === null || bloquea) { ox = null; return; }
        const dx = e.changedTouches[0].clientX - ox, dy = Math.abs(e.changedTouches[0].clientY - oy);
        ox = null;
        if (dx < -60 && -dx > dy * 1.5) window.toggleMenu();
      }, { passive: true });
    }

    // Cerrar con ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sideMenu && sideMenu.classList.contains("open")) {
        sideMenu.classList.remove("open");
        wrapper.classList.remove("blur");
        sections.forEach(s => s.classList.remove("blur"));
      }
    });

    /* --- Exponer utilidades globales para uso externo --- */
    window.__CAVLA_SMOOTH = {
      wrapper,
      sections,
      computeSectionPositions,
      setBodyHeight,
      sectionPositions
    };

  }); // fin DOMContentLoaded
})();


// ============================================================
// 2. ANIMACIÓN DE ENTRADA — GRILLA VIRTUAL
//    Mueve la grilla hacia arriba mientras la sección entra
//    al viewport al hacer scroll (efecto parallax de entrada).
// ============================================================

document.addEventListener('scroll', () => {
  const scroller = CAVLA_FIJO && document.querySelector('.smooth-scroll-wrapper');
  const virtualSection = document.querySelector('.page.mainContent:nth-of-type(2)');
  const grillaVirtual  = document.querySelector('.marquesina');

  if (!virtualSection || !grillaVirtual) return;

  const viewportHeight = scroller ? scroller.clientHeight : window.innerHeight;
  const scrollY        = scroller ? scroller.scrollTop : window.scrollY;
  const virtualTop     = virtualSection.offsetTop;

  const start = virtualTop - viewportHeight;
  const end   = virtualTop;

  let progress = (scrollY - start) / (end - start);
  progress = Math.max(0, Math.min(progress, 1));

  const translateY = 200 - (progress * 200);
  grillaVirtual.style.transform = `translateY(${translateY}px)`;
}, true);   // captura: en táctiles el scroll ocurre dentro del wrapper y esos eventos no suben


// ============================================================
// 3. INFO BOXES — TOOLTIPS DE PREGUNTAS
//    Abre/cierra cajitas de información al clickear íconos
//    de pregunta. Se posicionan dinámicamente en viewport
//    para no salirse de pantalla.
// ============================================================

(function () {
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  document.addEventListener('click', function (e) {
    const icon = e.target.closest('.icono-pregunta');
    if (icon) {
      e.stopPropagation();
      const targetId = icon.dataset.info;
      if (!targetId) return;
      const box = document.getElementById(targetId);
      if (!box) { console.warn('No se encontró box para', targetId); return; }

      const already = box.classList.contains('active');
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
      if (already) return;

      // Medir la caja antes de posicionarla
      box.style.left = '-9999px';
      box.style.top  = '-9999px';
      box.classList.remove('active');
      const bw = box.offsetWidth  || Math.min(360, Math.max(220, window.innerWidth * 0.18));
      const bh = box.offsetHeight || (window.innerHeight * 0.3);

      const rect = icon.getBoundingClientRect();
      let left = rect.right + 40;
      let top  = rect.top;

      // Si no cabe a la derecha, ir a la izquierda
      if (left + bw + 12 > window.innerWidth) { left = rect.left - bw - 40; }
      top = clamp(top, 8, window.innerHeight - bh - 12);

      box.style.left = `${Math.round(left)}px`;
      box.style.top  = `${Math.round(top)}px`;
      box.classList.add('active');
      return;
    }

    // Click dentro de una caja: no cerrar
    if (e.target.closest('.box-pregunta')) return;

    // Click fuera: cerrar todo
    document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
    }
  });

  document.addEventListener('touchstart', function (e) {
    if (e.target.closest('.icono-pregunta')) return;
    if (!e.target.closest('.box-pregunta')) {
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
    }
  }, { passive: true });
})();


// ============================================================
// 4. FIX DE ALTURA EN MOBILE — BLOQUEO DE --vh
//    En mobile las barras del browser cambian de tamaño
//    constantemente. Este bloque mide la altura real al cargar,
//    la "lockea" en la variable CSS --vh y solo la actualiza
//    ante cambios grandes (rotación de pantalla, teclado).
// ============================================================

(function () {
  const IS_MOBILE = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  if (!IS_MOBILE) return;
  // Con scroll nativo y unidades lvh el alto no depende de la barra del navegador: no hace falta medir
  const USA_LVH = CAVLA_NATIVO;

  function getViewportHeight() {
    return Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight);
  }

  function applyVh(h) {
    document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
  }

  // Toma varias muestras durante initialMs y elige el valor más estable
  function measureAndLock(initialMs = 700, sampleInterval = 80) {
    const samples = [];
    const start   = Date.now();
    return new Promise((resolve) => {
      const t = setInterval(() => {
        samples.push(getViewportHeight());
        if (Date.now() - start >= initialMs) {
          clearInterval(t);
          const counts = {};
          samples.forEach(v => counts[v] = (counts[v] || 0) + 1);
          let mode = samples[0], maxCount = 0;
          Object.keys(counts).forEach(k => {
            if (counts[k] > maxCount) { maxCount = counts[k]; mode = Number(k); }
          });
          const stable = (maxCount >= 2) ? mode : Math.max(...samples);
          applyVh(stable);
          resolve(stable);
        }
      }, sampleInterval);
    });
  }

  let lastLocked = 0;

  // Solo actualiza --vh si el cambio supera 140px (ignora la barra animada del browser)
  function maybeUpdateOnHugeChange() {
    const newH = getViewportHeight();
    if (Math.abs(newH - lastLocked) > 140) {
      lastLocked = newH;
      applyVh(newH);
      if (window.__CAVLA_SMOOTH) {
        window.__CAVLA_SMOOTH.setBodyHeight();
        window.__CAVLA_SMOOTH.computeSectionPositions && window.__CAVLA_SMOOTH.computeSectionPositions();
      }
    }
  }

  window.addEventListener('load', async () => {
    lastLocked = USA_LVH ? 0 : await measureAndLock(700, 80);

    // --------------------------------------------------------
    // FIX: Redirección a sección #servicios desde contacto.html
    // Lee el flag guardado por irAServicios() en contacto.html,
    // inhibe el snap e ir directo a la posición correcta usando
    // sectionPositions (funciona en desktop y mobile).
    // --------------------------------------------------------
    const snapSkip = sessionStorage.getItem('snapSkip');
    if (snapSkip === 'servicios') {
      sessionStorage.removeItem('snapSkip');
      const targetEl = document.getElementById('servicios');
      if (targetEl) {
        window.__snapInhibited = true;
        setTimeout(() => {
          if (window.__CAVLA_SMOOTH) {
            window.__CAVLA_SMOOTH.setBodyHeight();
            window.__CAVLA_SMOOTH.computeSectionPositions();
            // Usar sectionPositions para obtener la posición exacta (fix desktop)
            const idx = window.__CAVLA_SMOOTH.sections.indexOf(targetEl);
            const pos = window.__CAVLA_SMOOTH.sectionPositions[idx];
            if (pos !== undefined) {
              cavlaScrollTo(pos, 'instant');
            } else {
              cavlaScrollTo(targetEl.offsetTop, 'instant');
            }
          }
          setTimeout(() => { window.__snapInhibited = false; }, 800);
        }, 400);
      }
    }

    window.addEventListener('orientationchange', () => {
      if (USA_LVH) return;
      setTimeout(async () => {
        lastLocked = await measureAndLock(500, 80);
        if (window.__CAVLA_SMOOTH) {
          window.__CAVLA_SMOOTH.setBodyHeight();
          window.__CAVLA_SMOOTH.computeSectionPositions && window.__CAVLA_SMOOTH.computeSectionPositions();
        }
      }, 300);
    });

    if (!USA_LVH) {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', maybeUpdateOnHugeChange);
      }
      window.addEventListener('resize', maybeUpdateOnHugeChange);
    }
  });
})();


// ============================================================
// 5. FIX DESKTOP — Redirección a #servicios desde contacto.html
//    En desktop el bloque de mobile (sección 4) no corre porque
//    IS_MOBILE es false. Este bloque hace lo mismo pero para
//    todos los dispositivos no-mobile.
// ============================================================

(function () {
  const IS_MOBILE = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  if (IS_MOBILE) return; // mobile ya lo maneja la sección 4

  window.addEventListener('load', () => {
    const snapSkip = sessionStorage.getItem('snapSkip');
    if (snapSkip !== 'servicios') return;

    sessionStorage.removeItem('snapSkip');
    const targetEl = document.getElementById('servicios');
    if (!targetEl) return;

    window.__snapInhibited = true;

    setTimeout(() => {
      if (window.__CAVLA_SMOOTH) {
        window.__CAVLA_SMOOTH.setBodyHeight();
        window.__CAVLA_SMOOTH.computeSectionPositions();
        const idx = window.__CAVLA_SMOOTH.sections.indexOf(targetEl);
        const pos = window.__CAVLA_SMOOTH.sectionPositions[idx];
        if (pos !== undefined) {
          cavlaScrollTo(pos, 'instant');
        } else {
          cavlaScrollTo(targetEl.offsetTop, 'instant');
        }
      }
      setTimeout(() => { window.__snapInhibited = false; }, 800);
    }, 400);
  });
})();


// ============================================================
// FRASE DE PRESENTACIÓN — línea que une los bloques del texto
//    Mide dónde cae cada bloque (en cualquier pantalla) y dibuja
//    la línea curva entre ellos. Al entrar la sección en pantalla
//    la línea se traza de punta a punta y el texto va apareciendo
//    a medida que la línea avanza.
// ============================================================
(function () {
  const wrap = document.querySelector('.frase-wrap');
  if (!wrap) return;
  const svg   = wrap.querySelector('.frase-lineas');
  const frags = [...wrap.querySelectorAll('.frag')];
  if (!svg || frags.length !== 3) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const crear = (tag, cls) => { const e = document.createElementNS(NS, tag); e.setAttribute('class', cls); svg.appendChild(e); return e; };
  const path = [crear('path', 'l1'), crear('path', 'l2')];
  const dot  = [crear('circle', 'd1'), crear('circle', 'd2'), crear('circle', 'd2b'), crear('circle', 'd3')];
  const largo = [0, 0];

  const clamp = (x) => Math.max(0, Math.min(1, x));
  const sua = (x) => x * x * (3 - 2 * x);                       // suave
  const tramo = (t, a, b) => clamp((t - a) / (b - a));

  function extremos(f, base, k) {
    const rg = document.createRange();
    rg.selectNodeContents(f);
    const rs = [...rg.getClientRects()].filter(r => r.width > 1);
    const a = rs[0], z = rs[rs.length - 1];
    return {
      ini: { x: (a.left - base.left) / k, y: (a.top + a.height / 2 - base.top) / k },
      fin: { x: (z.right - base.left) / k, y: (z.top + z.height / 2 - base.top) / k }
    };
  }

  // Une A con B. Si B queda a la derecha de A: una S suave. Si queda a la izquierda: una serpiente de dos medias vueltas.
  // xlFijo: x donde la serpiente da la vuelta hacia C (la punta izquierda de la curva), si se conoce.
  function unir(A, B, fs, limiteIzq, limiteDer, xlFijo) {
    const dx = B.x - A.x, dy = B.y - A.y;
    const r4 = dy / 4;
    let xr = Math.min(A.x + fs * 0.35, limiteDer - r4);
    let xl = xlFijo != null ? xlFijo + r4 : B.x - fs * 0.55;
    xl = Math.max(xl, limiteIzq + r4);
    if (dx > dy * 1.5 && xl > xr - 10) {
      // una sola curva suave que ocupa todo el ancho entre A y B (sin tramos rectos largos)
      const h = dx * 0.5;
      return `M${A.x},${A.y} C${A.x + h},${A.y} ${B.x - h},${B.y} ${B.x},${B.y}`;
    }
    xl = Math.min(xl, xr - 10);
    return `M${A.x},${A.y} L${xr},${A.y} A${r4},${r4} 0 0 1 ${xr},${A.y + 2 * r4} L${xl},${A.y + 2 * r4} A${r4},${r4} 0 0 0 ${xl},${A.y + 4 * r4} L${B.x},${B.y}`;
  }

  let radioPunto = 3;
  let izqC = 0;
  function trazar() {
    // El bloque es ancho: A queda alineado con la punta izquierda de la curva que entra a C, B pegado a la derecha y C centrado.
    const fs0 = parseFloat(getComputedStyle(wrap).fontSize);
    wrap.style.width = 'auto';
    const anchoC = frags[2].offsetWidth;
    const anchoMin = Math.max(frags[0].offsetWidth, frags[1].offsetWidth);
    izqC = Math.min(fs0 * 3.5, Math.max(fs0 * 1.45, (window.innerWidth * 0.94 - anchoC) / 2));   // de la punta de la curva a la C
    wrap.style.width = Math.max(anchoC + 2 * izqC, anchoMin) + 'px';
    frags[0].style.marginLeft = '0px';
    const base = wrap.getBoundingClientRect();
    const k = base.width / wrap.offsetWidth || 1;
    const m = frags.map(f => extremos(f, base, k));
    const fs = parseFloat(getComputedStyle(wrap).fontSize);
    const sep = fs * 0.3, margen = 12;
    const limIzq = (margen - base.left) / k, limDer = (window.innerWidth - margen - base.left) / k;
    svg.setAttribute('viewBox', `0 0 ${wrap.offsetWidth} ${wrap.offsetHeight}`);
    const p = [
      { x: m[0].fin.x + sep, y: m[0].fin.y }, { x: m[1].ini.x - sep, y: m[1].ini.y },
      { x: m[1].fin.x + sep, y: m[1].fin.y }, { x: m[2].ini.x - sep, y: m[2].ini.y }
    ];
    radioPunto = Math.max(2.5, fs * 0.075);
    dot.forEach((d, i) => { d.setAttribute('cx', p[i].x); d.setAttribute('cy', p[i].y); d.setAttribute('r', radioPunto); });
    path[0].setAttribute('d', unir(p[0], p[1], fs, limIzq, limDer));
    path[1].setAttribute('d', unir(p[2], p[3], fs, limIzq, limDer, p[3].x + sep - izqC));
    path.forEach((e, i) => { largo[i] = e.getTotalLength(); e.style.strokeDasharray = largo[i]; });
  }

  // Línea de tiempo (segundos): el texto aparece a medida que la línea llega
  const DURACION = 5.4;
  function dibujar(t) {
    const txt = (el, a, b) => {
      const p = sua(tramo(t, a, b));
      el.style.opacity = Math.min(1, p * 2.5);
      el.style.clipPath = p >= 1 ? 'none' : `inset(-15% ${(1 - p) * 100}% -15% -4%)`;
    };
    txt(frags[0], 0.0, 1.0);
    txt(frags[1], 2.3, 3.2);
    txt(frags[2], 4.6, 5.4);
    const punto = (el, a, b) => { el.style.opacity = sua(tramo(t, a, b)); };
    punto(dot[0], 0.8, 1.1);
    punto(dot[1], 2.2, 2.4);
    punto(dot[2], 3.1, 3.4);
    punto(dot[3], 4.5, 4.7);
    const linea = (i, a, b) => {
      const p = sua(tramo(t, a, b));
      path[i].style.strokeDashoffset = largo[i] * (1 - p);
      path[i].style.opacity = p > 0 ? 0.9 : 0;
    };
    linea(0, 1.1, 2.3);
    linea(1, 3.4, 4.6);
  }

  let tActual = 0, raf = null, inicio = 0;
  function reproducir() {
    cancelAnimationFrame(raf);
    inicio = performance.now();
    const paso = (ahora) => {
      tActual = Math.min(DURACION, (ahora - inicio) / 1000);
      dibujar(tActual);
      if (tActual < DURACION) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
  }
  function reiniciar() { cancelAnimationFrame(raf); tActual = 0; dibujar(0); }

  const medir = () => { trazar(); dibujar(tActual); };
  trazar();
  if (reducido || !('IntersectionObserver' in window)) { tActual = DURACION; dibujar(DURACION); }
  else {
    dibujar(0);
    const sec = wrap.closest('section');
    let reproduciendo = false;
    new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.intersectionRatio >= 0.55 && !reproduciendo) { reproduciendo = true; trazar(); reproducir(); }
        else if (e.intersectionRatio <= 0.02 && reproduciendo) { reproduciendo = false; reiniciar(); }
      });
    }, { threshold: [0, 0.02, 0.55, 1] }).observe(sec);
  }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(medir, 150); });
  window.addEventListener('load', medir);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
})();

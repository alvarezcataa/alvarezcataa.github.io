// ============================================================
// 1. SMOOTH SCROLL + SNAP IMANTADO + MENÚ LATERAL
//    Construye el wrapper de scroll suave, calcula posiciones
//    de sección, aplica lerp en cada frame y snappea al soltar.
// ============================================================

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

    /* --- Selectores principales --- */
    const sideMenu = document.getElementById("sideMenu");
    const toggleBtn = document.querySelector(".menu-toggle");
    const logo = document.querySelector(".logo");

    // Preferimos secciones marcadas con .mainContent
    let sections = Array.from(document.querySelectorAll(".mainContent"));
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

    Object.assign(wrapper.style, {
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

    /* --- Loop de interpolación (lerp) --- */
    let current = 0;
    let target = 0;
    const ease = 0.085; // 0.04 = muy suave · 0.12 = más rápido
    const portada = wrapper.querySelector(".page_fondo-proyecto");
    const maxScale = 1.12;

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
    requestAnimationFrame(rafLoop);

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

    window.addEventListener("wheel",       scheduleSnap, { passive: true });
    window.addEventListener("touchend",    scheduleSnap, { passive: true });
    window.addEventListener("touchcancel", scheduleSnap, { passive: true });
    window.addEventListener("keydown",     () => { scheduleSnap(); });

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
  const virtualSection = document.querySelector('.page.mainContent:nth-of-type(2)');
  const grillaVirtual  = document.querySelector('.contenedor-grillavirtual');

  if (!virtualSection || !grillaVirtual) return;

  const viewportHeight = window.innerHeight;
  const scrollY        = window.scrollY;
  const virtualTop     = virtualSection.offsetTop;

  const start = virtualTop - viewportHeight;
  const end   = virtualTop;

  let progress = (scrollY - start) / (end - start);
  progress = Math.max(0, Math.min(progress, 1));

  const translateY = 200 - (progress * 200);
  grillaVirtual.style.transform = `translateY(${translateY}px)`;
});


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
    lastLocked = await measureAndLock(700, 80);

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
              window.scrollTo({ top: pos, behavior: 'instant' });
            } else {
              window.scrollTo({ top: targetEl.offsetTop, behavior: 'instant' });
            }
          }
          setTimeout(() => { window.__snapInhibited = false; }, 800);
        }, 400);
      }
    }

    window.addEventListener('orientationchange', () => {
      setTimeout(async () => {
        lastLocked = await measureAndLock(500, 80);
        if (window.__CAVLA_SMOOTH) {
          window.__CAVLA_SMOOTH.setBodyHeight();
          window.__CAVLA_SMOOTH.computeSectionPositions && window.__CAVLA_SMOOTH.computeSectionPositions();
        }
      }, 300);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', maybeUpdateOnHugeChange);
    }
    window.addEventListener('resize', maybeUpdateOnHugeChange);
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
          window.scrollTo({ top: pos, behavior: 'instant' });
        } else {
          window.scrollTo({ top: targetEl.offsetTop, behavior: 'instant' });
        }
      }
      setTimeout(() => { window.__snapInhibited = false; }, 800);
    }, 400);
  });
})();
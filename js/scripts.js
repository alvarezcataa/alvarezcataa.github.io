// scripts.js — Smooth + Parallax + Snap amable + Menú estable
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    /* ------------------------
       SELECTORES principales
       ------------------------ */
    const sideMenu = document.getElementById("sideMenu");
    const toggleBtn = document.querySelector(".menu-toggle");
    const logo = document.querySelector(".logo");

    // Preferimos secciones marcadas explícitamente con .mainContent
    let sections = Array.from(document.querySelectorAll(".mainContent"));
    // fallback: si no hay .mainContent tomamos las <section> visibles (excluimos nav/sideMenu)
    if (!sections.length) {
      sections = Array.from(document.querySelectorAll("section")).filter(s => {
        return !s.closest("#sideMenu") && !s.classList.contains("navbar") && s !== document.querySelector("nav");
      });
    }

    /* ------------------------
       1) Construir el wrapper
       ------------------------ */
    const firstSection = sections[0];
    const wrapper = document.createElement("div");
    wrapper.className = "smooth-scroll-wrapper";

    // insertamos el wrapper justo antes de la primera sección para mantener el orden visual
    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(wrapper, firstSection);
    } else {
      document.body.insertBefore(wrapper, document.body.firstChild);
    }

    // mover SOLO las secciones al wrapper (dejamos el nav, logo, sideMenu fuera)
    sections.forEach(s => wrapper.appendChild(s));

    // estilos inline básicos para wrapper (puedes moverlos a CSS si querés)
    Object.assign(wrapper.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      willChange: "transform",
      overflow: "hidden",
      zIndex: "0"
    });

    // función para igualar la altura del body al contenido real
    const setBodyHeight = () => {
      const h = wrapper.getBoundingClientRect().height;
      document.body.style.height = `${Math.ceil(h)}px`;
    };
    setBodyHeight();

    // recalcular al resize y cuando se carguen imágenes (para evitar errores en posiciones)
    window.addEventListener("resize", () => {
      setBodyHeight();
      computeSectionPositions();
    });
    window.addEventListener("load", () => {
      setBodyHeight();
      computeSectionPositions();
    });

    /* ------------------------
       2) Posiciones (para snap)
       ------------------------ */
    let sectionPositions = [];
    function computeSectionPositions() {
      sectionPositions = [];
      let acc = 0;
      sections.forEach((s, i) => {
        // usamos la altura real de la sección dentro del wrapper
        const h = s.getBoundingClientRect().height;
        sectionPositions.push(acc);
        acc += h;
      });
      // actualizamos altura del body por si cambió
      setBodyHeight();
    }
    computeSectionPositions();

    /* ------------------------
       3) Smooth loop (lerp)
       ------------------------ */
    let current = 0;
    let target = 0;
    const ease = 0.085; // ajustá 0.04..0.12 según sensación (menor = más suave)
    const portada = wrapper.querySelector(".page_fondo-proyecto");
    const maxScale = 1.12;

    function rafLoop() {
      target = window.scrollY || window.pageYOffset;
      // interpolación
      current += (target - current) * ease;
      // aplicar traducción visual al wrapper
      wrapper.style.transform = `translate3d(0, ${-current}px, 0)`;

      // parallax / zoom portada (si existe)
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

    /* ------------------------
       4) Snap "amable" después de terminar de scrollear
       ------------------------ */
    let scrollTimer = null;
    const snapDelay = 150; // ms desde el último evento scroll hasta el "snap"
    const snapThreshold = 0; // px (si estás muy cerca no forceamos snap)

    function scheduleSnap() {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        doSnap();
      }, snapDelay);
    }

    function doSnap() {
      // No hacer snap si el menú está abierto
      if (sideMenu && sideMenu.classList.contains("open")) return;

      const y = window.scrollY || window.pageYOffset;
      // encontrar índice más cercano
      let closestIndex = 0;
      let minDiff = Infinity;
      sectionPositions.forEach((pos, i) => {
        const diff = Math.abs(pos - y);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      });

      // si ya estás muy cerca no hacemos nada
      if (minDiff <= snapThreshold) return;

      const targetPos = sectionPositions[closestIndex];
      // lanzar scroll nativo suave hacia la posición (nuestro raf lerp lo hará visualmente fluido)
      window.scrollTo({ top: targetPos, behavior: "smooth" });
    }

    // escuchamos eventos de usuario para programar el snap:
    window.addEventListener("wheel", scheduleSnap, { passive: true });
    window.addEventListener("touchend", scheduleSnap, { passive: true });
    window.addEventListener("touchcancel", scheduleSnap, { passive: true });
    window.addEventListener("keydown", (e) => { // flechas / pageUp/PageDown
      // schedule snap después de un pequeño delay para que scroll termine
      scheduleSnap();
    });

    /* ------------------------
       5) MENÚ (basado en Script 01: estable y simple)
       ------------------------ */
    // Abre/cierrre por toggleMenu() global (mantener onclick="toggleMenu()" si lo usás en HTML)
    window.toggleMenu = function () {
      if (!sideMenu) return;
      sideMenu.classList.toggle("open");
      const opened = sideMenu.classList.contains("open");
      // aplicar blur al wrapper (o a cada sección)
      wrapper.classList.toggle("blur", opened);
      sections.forEach(s => s.classList.toggle("blur", opened));
    };

    // cerrar al click fuera
    document.addEventListener("click", (e) => {
      if (!sideMenu) return;
      if (!sideMenu.classList.contains("open")) return;
      // si clickeaste dentro del menú o en el botón toggle, no cierres
      if (sideMenu.contains(e.target) || (toggleBtn && toggleBtn.contains(e.target))) return;
      // sino: cerrar
      sideMenu.classList.remove("open");
      wrapper.classList.remove("blur");
      sections.forEach(s => s.classList.remove("blur"));
    });

    // cerrar con ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sideMenu && sideMenu.classList.contains("open")) {
        sideMenu.classList.remove("open");
        wrapper.classList.remove("blur");
        sections.forEach(s => s.classList.remove("blur"));
      }
    });

    /* ------------------------
       6) Exponer utilidades para debug
       ------------------------ */
    window.__CAVLA_SMOOTH = {
      wrapper,
      sections,
      computeSectionPositions,
      setBodyHeight,
      sectionPositions
    };

  }); // DOMContentLoaded end
})();



document.addEventListener('scroll', () => {
  const virtualSection = document.querySelector('.page.mainContent:nth-of-type(2)'); // Sección VIRTUAL
  const grillaVirtual = document.querySelector('.contenedor-grillavirtual');

  if (!virtualSection || !grillaVirtual) return;

  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  // Posición donde comienza la animación (cuando empieza a aparecer la sección VIRTUAL)
  const virtualTop = virtualSection.offsetTop;

  const start = virtualTop - viewportHeight; // comienza cuando la sección entra al viewport
  const end = virtualTop; 

  // Progreso normalizado entre 0 y 1
  let progress = (scrollY - start) / (end - start);
  progress = Math.max(0, Math.min(progress, 1)); // clamp para no salir del rango

  // Movimiento vertical: de 200px (abajo) a 0px (posición final)
  const translateY = 200 - (progress * 200);

  grillaVirtual.style.transform = `translateY(${translateY}px)`;
});






// Toggle info boxes — robusto frente a wrappers/transform
(function() {
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  document.addEventListener('click', function(e) {
    const icon = e.target.closest('.icono-pregunta');
    if (icon) {
      e.stopPropagation();
      const targetId = icon.dataset.info;
      if (!targetId) return;
      const box = document.getElementById(targetId);
      if (!box) {
        console.warn('No se encontró box para', targetId);
        return;
      }

      // Si ya está activa la cierro (toggle)
      const already = box.classList.contains('active');

      // cerrar todas las demás
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));

      if (already) {
        // ya estaba => ya fue cerrada arriba, así que salimos
        return;
      }

      // calcular posición del icono en viewport
      const rect = icon.getBoundingClientRect();

      // colocamos la caja a la derecha por defecto, si no hay espacio la colocamos a la izquierda
      // calculamos tamaño de box (necesario para evitar overflow) — si no tiene offsetWidth aún, hacemos una medición rápida.
      box.style.left = '-9999px'; // forzar render para medir
      box.style.top = '-9999px';
      box.classList.remove('active'); // asegurar estado oculto para medir sin transición
      // forzamos lectura
      const bw = box.offsetWidth || Math.min(360, Math.max(220, window.innerWidth * 0.18));
      const bh = box.offsetHeight || (window.innerHeight * 0.3);

      // Default: a la derecha del icono
      let left = rect.right + 40;
      let top = rect.top;

      // si no cabe a la derecha, poner a la izquierda
      if (left + bw + 12 > window.innerWidth) {
        left = rect.left - bw - 40;
      }

      // asegurar que no se salga verticalmente
      top = clamp(top, 8, window.innerHeight - bh - 12);

      // aplicar posición (fixed)
      box.style.left = `${Math.round(left)}px`;
      box.style.top = `${Math.round(top)}px`;

      // mostrar
      box.classList.add('active');

      return;
    }

    // Si clickeaste dentro de una caja, no cerrar (evitar burbujeo)
    const inBox = e.target.closest('.box-pregunta');
    if (inBox) {
      // dejamos que el click dentro de la caja haga lo suyo
      return;
    }

    // clic fuera: cerrar todo
    document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
  });

  // Cerrar con ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
    }
  });

  // También soportar touchstart (mobile): cerrar al tocar fuera o abrir al tocar icono
  document.addEventListener('touchstart', function(e) {
    const icon = e.target.closest('.icono-pregunta');
    if (icon) {
      // dejar que el 'click' lo maneje (se disparará), no duplicar
      return;
    }
    const inBox = e.target.closest('.box-pregunta');
    if (!inBox) {
      document.querySelectorAll('.box-pregunta.active').forEach(b => b.classList.remove('active'));
    }
  }, { passive: true });

})();



//evitar recálculo de vh en celular
window.addEventListener('load', () => {
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    function setViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
  }
});



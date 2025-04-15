document.addEventListener('DOMContentLoaded', function() {

  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const offscreenMenu = document.querySelector('.offscreen-menu');
  const closeMenuBtn = document.querySelector('.close-menu-btn');
  const menuLinks = document.querySelectorAll('.menu-link');
  const pageBody = document.body; // Usamos el body para la clase de blur
  
  // Función para abrir el menú
  function openMenu() {
  offscreenMenu.classList.add('active');
  offscreenMenu.setAttribute('aria-hidden', 'false');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  pageBody.classList.add('menu-open'); // Añade clase para blur y evitar scroll
  // Opcional: Enfocar el primer elemento del menú o el botón de cerrar
  // closeMenuBtn.focus();
  }
  
  // Función para cerrar el menú
  function closeMenu() {
  offscreenMenu.classList.remove('active');
  offscreenMenu.setAttribute('aria-hidden', 'true');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  pageBody.classList.remove('menu-open'); // Quita clase de blur
  // Opcional: Devolver el foco al botón que abrió el menú
  // hamburgerBtn.focus();
  }
  
  // Abrir menú con botón hamburguesa
  if (hamburgerBtn && offscreenMenu) {
  hamburgerBtn.addEventListener('click', (event) => {
  event.stopPropagation(); // Evita que el clic se propague al body/window
  if (offscreenMenu.classList.contains('active')) {
  closeMenu();
  } else {
  openMenu();
  }
  });
  }
  
  // Cerrar menú con botón X
  if (closeMenuBtn) {
  closeMenuBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  closeMenu();
  });
  }
  
  // Cerrar menú al hacer clic en un enlace del menú (para navegación en la misma página)
  menuLinks.forEach(link => {
  link.addEventListener('click', () => {
  // Solo cerrar si el menú está activo (visible)
  if (offscreenMenu.classList.contains('active')) {
  closeMenu();
  }
  // El scroll suave a la sección #id lo maneja el CSS 'scroll-behavior: smooth;'
  });
  });
  
  // Cerrar menú si se hace clic fuera de él
  document.addEventListener('click', function(event) {
  // Si el menú está activo y el clic NO fue dentro del menú NI en el botón hamburguesa
  if (offscreenMenu.classList.contains('active') &&
  !offscreenMenu.contains(event.target) &&
  !hamburgerBtn.contains(event.target)) {
  closeMenu();
  }
  });
  
  // Cerrar menú con la tecla Escape
  document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && offscreenMenu.classList.contains('active')) {
  closeMenu();
  }
  });
  
  // Pequeño ajuste para la animación de entrada (puede eliminarse si la animación CSS funciona directamente)
  // Asegura que los elementos sean visibles después de un pequeño retraso para que la animación CSS se aplique
  // window.addEventListener('load', () => {
  //     document.querySelectorAll('.animate-on-load').forEach(el => {
  //        // La animación CSS con 'forwards' debería manejar esto, pero es un fallback
  //        // Podríamos añadir una clase aquí en lugar de depender solo del CSS si hay problemas
  //     });
  // });
  
  }); // Fin de DOMContentLoaded
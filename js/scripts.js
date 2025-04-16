function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const main = document.getElementById('mainContent');

  menu.classList.toggle('open');

  if (menu.classList.contains('open')) {
    main.classList.add('blur');
  } else {
    main.classList.remove('blur');
  }
}

// Cerrar menú al hacer clic afuera
document.addEventListener('click', function (event) {
  const menu = document.getElementById('sideMenu');
  const toggle = document.querySelector('.menu-toggle');
  const main = document.getElementById('mainContent');

  // Si el menú está abierto y el clic fue fuera del menú y del botón toggle
  if (
    menu.classList.contains('open') &&
    !menu.contains(event.target) &&
    !toggle.contains(event.target)
  ) {
    menu.classList.remove('open');
    main.classList.remove('blur');
  }
});

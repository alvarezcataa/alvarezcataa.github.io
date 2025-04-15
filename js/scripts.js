
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


function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const main = document.getElementById('mainContent');
  menu.classList.toggle('open');
  main.classList.toggle('blur');
}

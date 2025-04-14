function toggleMenu() {
    const menu = document.getElementById('menu');
    const blurBg = document.getElementById('blur-bg');
    menu.classList.toggle('active');
    blurBg.classList.toggle('active');
}

function closeMenu() {
    document.getElementById('menu').classList.remove('active');
    document.getElementById('blur-bg').classList.remove('active');
}

function growLogo() {
    const logo = document.querySelector('.logo');
    logo.style.transform = 'scale(1.17)';
    setTimeout(() => {
        logo.style.transform = 'scale(1)';
    }, 1000);
}

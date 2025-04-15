
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const isOpen = menu.style.right === "0%";
    menu.style.right = isOpen ? "-100%" : "0%";
    document.body.style.filter = isOpen ? "none" : "blur(5px)";
}

// Cerrar el menú al hacer clic en un ítem
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#sideMenu a').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('sideMenu').style.right = "-100%";
            document.body.style.filter = "none";
        });
    });
});

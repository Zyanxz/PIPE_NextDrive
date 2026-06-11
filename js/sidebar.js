const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const btnMenu = document.getElementById("btnMenu");
const btnFechar = document.getElementById("btnFecharSidebar");

if (sidebar && overlay && btnMenu) {
  btnMenu.addEventListener("click", openSidebar);
  btnFechar?.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  window.addEventListener("scroll", () => {
    btnMenu.classList.toggle("fixed", window.scrollY > 80);
  });
}

function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

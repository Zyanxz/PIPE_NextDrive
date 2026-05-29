const sidebar =
  document.getElementById("sidebar");

const overlay =
  document.getElementById("sidebarOverlay");

const btnMenu =
  document.getElementById("btnMenu");

const btnFechar =
  document.getElementById(
    "btnFecharSidebar"
  );

// =========================
// VERIFICA ELEMENTOS
// =========================
if (
  sidebar &&
  overlay &&
  btnMenu
) {

  // =========================
  // ABRIR SIDEBAR
  // =========================
  btnMenu.addEventListener(
    "click",
    () => {

      sidebar.classList.add(
        "open"
      );

      overlay.classList.add(
        "show"
      );

      // trava scroll
      document.body.style.overflow =
        "hidden";
    }
  );

  // =========================
  // FECHAR SIDEBAR
  // =========================
  function closeSidebar() {

    sidebar.classList.remove(
      "open"
    );

    overlay.classList.remove(
      "show"
    );

    // libera scroll
    document.body.style.overflow =
      "";
  }

  // botão fechar
  if (btnFechar) {

    btnFechar.addEventListener(
      "click",
      closeSidebar
    );
  }

  // fechar clicando no overlay
  overlay.addEventListener(
    "click",
    closeSidebar
  );

  // =========================
  // FECHAR COM ESC
  // =========================
  document.addEventListener(
    "keydown",
    (e) => {

      if (
        e.key === "Escape" &&
        sidebar.classList.contains(
          "open"
        )
      ) {

        closeSidebar();
      }
    }
  );

  // =========================
  // BOTÃO FIXO AO ROLAR
  // =========================
  window.addEventListener(
    "scroll",
    () => {

      if (
        window.scrollY > 80
      ) {

        btnMenu.classList.add(
          "fixed"
        );

      } else {

        btnMenu.classList.remove(
          "fixed"
        );
      }
    }
  );
}
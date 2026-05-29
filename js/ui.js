// ======================================
// SISTEMA GLOBAL DE TOASTS + ANIMAÇÕES
// ======================================

(function () {

  // ======================================
  // CRIAR CONTAINER
  // ======================================
  function createContainer() {

    const container =
      document.createElement("div");

    container.id =
      "toast-container";

    container.style.position =
      "fixed";

    container.style.right =
      "1rem";

    container.style.bottom =
      "1rem";

    container.style.zIndex =
      "9999";

    container.style.display =
      "flex";

    container.style.flexDirection =
      "column";

    container.style.gap =
      "0.75rem";

    document.body.appendChild(
      container
    );

    return container;
  }

  // ======================================
  // CONTAINER PRINCIPAL
  // ======================================
  const container =
    document.getElementById(
      "toast-container"
    ) || createContainer();

  // ======================================
  // FUNÇÃO GLOBAL DE TOAST
  // ======================================
  window.showToast = function (
    text,
    type = "info",
    timeout = 3500
  ) {

    const toast =
      document.createElement("div");

    toast.className =
      `toast toast-${type}`;

    toast.setAttribute(
      "role",
      "status"
    );

    toast.textContent =
      text;

    // ======================================
    // ESTILOS BASE
    // ======================================
    toast.style.padding =
      "14px 18px";

    toast.style.borderRadius =
      "12px";

    toast.style.fontWeight =
      "600";

    toast.style.fontSize =
      "14px";

    toast.style.color =
      "#fff";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,0.2)";

    toast.style.opacity =
      "0";

    toast.style.transform =
      "translateY(20px)";

    toast.style.transition =
      "all 0.25s ease";

    toast.style.maxWidth =
      "320px";

    toast.style.wordBreak =
      "break-word";

    // ======================================
    // CORES
    // ======================================
    switch (type) {

      case "success":

        toast.style.background =
          "#16a34a";

        break;

      case "error":

        toast.style.background =
          "#dc2626";

        break;

      case "warning":

        toast.style.background =
          "#f59e0b";

        break;

      default:

        toast.style.background =
          "#2563eb";
    }

    // adiciona ao container
    container.appendChild(
      toast
    );

    // anima entrada
    requestAnimationFrame(() => {

      toast.style.opacity =
        "1";

      toast.style.transform =
        "translateY(0)";
    });

    // ======================================
    // REMOVER AUTOMATICAMENTE
    // ======================================
    const id = setTimeout(() => {

      toast.style.opacity =
        "0";

      toast.style.transform =
        "translateY(20px)";

      toast.addEventListener(
        "transitionend",
        () => {
          toast.remove();
        }
      );

      clearTimeout(id);

    }, timeout);
  };

  // ======================================
  // MICROINTERAÇÕES BOTÕES
  // ======================================
  function enhanceButtons() {

    const buttons =
      document.querySelectorAll(
        "button"
      );

    buttons.forEach(btn => {

      if (btn.dataset.enhanced) {
        return;
      }

      btn.dataset.enhanced =
        "1";

      btn.style.transition =
        "transform 0.15s ease";

      btn.addEventListener(
        "pointerdown",
        () => {

          btn.classList.add(
            "pressed"
          );

          btn.style.transform =
            "scale(0.96)";
        }
      );

      function resetButton() {

        btn.classList.remove(
          "pressed"
        );

        btn.style.transform =
          "scale(1)";
      }

      btn.addEventListener(
        "pointerup",
        resetButton
      );

      btn.addEventListener(
        "pointerleave",
        resetButton
      );
    });
  }

  // ======================================
  // EXECUÇÃO INICIAL
  // ======================================
  document.addEventListener(
    "DOMContentLoaded",
    () => {

      enhanceButtons();
    }
  );

  // ======================================
  // OBSERVA NOVOS BOTÕES
  // ======================================
  const observer =
    new MutationObserver(
      enhanceButtons
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

})();
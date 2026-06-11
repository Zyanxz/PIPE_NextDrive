(function () {
  const API_URL = "http://localhost:3000";
  const STORAGE_KEY = "usuarioLogado";

  function getToastContainer() {
    let container = document.getElementById("toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function showToast(text, type = "info", timeout = 3500) {
    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = text;

    getToastContainer().appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });

    setTimeout(() => {
      toast.classList.remove("toast--visible");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true
      });
    }, timeout);
  }

  function showMessage(element, text, type = "info") {
    if (element) {
      element.textContent = text;
      element.className = `mensagem ${type}`;
    }

    const toastType = type === "sucesso" ? "success" : type === "erro" ? "error" : type;
    showToast(text, toastType);
  }

  function getStoredUser() {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return user?.token ? user : null;
    } catch {
      return null;
    }
  }

  function getToken() {
    return getStoredUser()?.token || null;
  }

  function setStoredUser(user, token) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...user,
        token
      })
    );
  }

  function clearStoredUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function request(path, options = {}) {
    const token = options.auth === false ? null : getToken();
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.mensagem || `Erro HTTP ${response.status}`);
    }

    return data;
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function createCarCard(carro, options = {}) {
    const card = document.createElement("div");
    const dailyPrice = carro.preco_diaria ?? carro.preco ?? 0;

    card.className = "carro-card";
    card.innerHTML = `
      ${
        carro.imagem
          ? `<img src="${carro.imagem}" alt="${carro.modelo}" class="carro-thumb">`
          : ""
      }
      <h3>${carro.modelo}</h3>
      <p>${carro.marca}</p>
      ${carro.ano ? `<p>${carro.ano}</p>` : ""}
      <p class="preco">${formatCurrency(dailyPrice)}/dia</p>
      ${options.status ? `<p class="status-text">${options.status}</p>` : ""}
    `;

    if (options.buttonText) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = options.buttonText;
      button.disabled = Boolean(options.buttonDisabled);

      if (options.onClick && !button.disabled) {
        button.addEventListener("click", options.onClick);
      }

      card.appendChild(button);
    }

    return card;
  }

  function enhanceButtons() {
    document.querySelectorAll("button").forEach((button) => {
      if (button.dataset.enhanced) {
        return;
      }

      button.dataset.enhanced = "1";
      button.addEventListener("pointerdown", () => button.classList.add("pressed"));

      const reset = () => button.classList.remove("pressed");
      button.addEventListener("pointerup", reset);
      button.addEventListener("pointerleave", reset);
    });
  }

  document.addEventListener("DOMContentLoaded", enhanceButtons);

  new MutationObserver(enhanceButtons).observe(document.body, {
    childList: true,
    subtree: true
  });

  window.showToast = showToast;
  window.NextDrive = {
    API_URL,
    clearStoredUser,
    createCarCard,
    getStoredUser,
    getToken,
    request,
    setStoredUser,
    showMessage
  };
})();

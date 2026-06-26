(function () {
  const API_URL = "http://localhost:3000";
  const STORAGE_KEY = "usuarioLogado";
  const THEME_KEY = "nextdriveTheme";

  function setTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem(THEME_KEY, theme);
    const toggle = document.getElementById("btnToggleTheme");
    if (toggle) {
      toggle.textContent = dark ? "☀️ Claro" : "🌙 Escuro";
    }
  }

  function loadTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    setTheme(stored === "dark" ? "dark" : "light");
  }

  function toggleTheme() {
    setTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
  }

  function initThemeToggle() {
    const toggle = document.getElementById("btnToggleTheme");
    if (toggle) {
      toggle.addEventListener("click", toggleTheme);
    }
  }

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

    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (err) {
      throw new Error(`Falha ao conectar ao servidor (${err.message}). Verifique se o backend está rodando em ${API_URL}`);
    }

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

    const imagemUrl = carro.imagem ? `${API_URL}${carro.imagem}` : "";

    card.className = "carro-card";

    const statusLabel = options.status
      ? options.status
      : carro.status
      ? `${carro.status.charAt(0).toUpperCase() + carro.status.slice(1).toLowerCase()}`
      : "indisponível";

    // derive a small status class for styling
    const s = (statusLabel || "").toLowerCase();
    let statusClass = "";
    if (s.includes("ativo") || s.includes("dispon")) statusClass = "active";
    else if (s.includes("finaliz") || s.includes("final")) statusClass = "finalized";
    else if (s.includes("indispon") || s.includes("alug")) statusClass = "busy";

    card.innerHTML = `
      ${
        carro.imagem
          ? `<div class="carro-image"><img src="${imagemUrl}" alt="${carro.modelo}" class="carro-thumb"></div>`
          : ""
      }

      <div class="carro-info">
        <div class="carro-header">
          <h3>${carro.modelo}</h3>
          ${statusLabel ? `<span class="status-pill ${statusClass}">${statusLabel}</span>` : ""}
        </div>
        <div class="carro-details">
          <p class="carro-meta">${carro.marca}${carro.ano ? ` • ${carro.ano}` : ""}</p>
          ${carro.km ? `<p><strong>KM:</strong> ${Number(carro.km).toLocaleString("pt-BR")} km</p>` : ""}
        </div>
        <div class="carro-footer">
          <p class="preco">${formatCurrency(dailyPrice)}/dia</p>
        </div>
      </div>
    `;

    if (statusClass) card.classList.add(statusClass);

    if (options.buttonText) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = options.buttonDisabled ? "btn-outline btn-disabled" : "btn-primary";
      button.textContent = options.buttonText;
      button.disabled = Boolean(options.buttonDisabled);

      if (typeof options.onClick === "function") {
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

  // Confirmation modal helper — returns a Promise<boolean>
  function showConfirm(message, title = "Confirmação") {
    return new Promise((resolve) => {
      // build overlay
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";

      const modal = document.createElement("div");
      modal.className = "confirm-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      modal.innerHTML = `
        <div class="modal-body">
          <div style="flex:1">
            <h3>${title}</h3>
            <p>${message}</p>
          </div>
        </div>
        <div class="confirm-actions">
          <button class="btn-cancel">Cancelar</button>
          <button class="btn-confirm">Confirmar</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // small show animation
      requestAnimationFrame(() => overlay.classList.add("show"));

      const btnCancel = modal.querySelector(".btn-cancel");
      const btnConfirm = modal.querySelector(".btn-confirm");

      const cleanup = (result) => {
        overlay.classList.remove("show");
        overlay.addEventListener(
          "transitionend",
          () => overlay.remove(),
          { once: true }
        );
        document.removeEventListener("keydown", onKey);
        resolve(result);
      };

      function onKey(e) {
        if (e.key === "Escape") cleanup(false);
        if (e.key === "Enter") cleanup(true);
      }

      btnCancel.addEventListener("click", () => cleanup(false));
      btnConfirm.addEventListener("click", () => cleanup(true));
      document.addEventListener("keydown", onKey);

      // focus
      btnConfirm.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    initThemeToggle();
    enhanceButtons();
  });

  new MutationObserver(enhanceButtons).observe(document.body, {
    childList: true,
    subtree: true
  });

  window.showToast = showToast;
  window.NextDrive = {
    API_URL,
    clearStoredUser,
    createCarCard,
    showConfirm,
    getStoredUser,
    getToken,
    request,
    setStoredUser,
    showMessage
  };
})();

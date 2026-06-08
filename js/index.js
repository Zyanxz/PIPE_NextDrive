console.log("NextDrive carregado com sucesso!");

// =====================================
// ELEMENTOS
// =====================================
const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const btnSair = document.getElementById("btnSair");
const listaCarros = document.getElementById("listaCarros");

// =====================================
// EVENTOS DE NAVEGAÇÃO
// =====================================
btnLogin?.addEventListener("click", () => {
  window.location.href = "login.html";
});

btnRegistro?.addEventListener("click", () => {
  window.location.href = "registro.html";
});

btnSair?.addEventListener("click", () => {

  localStorage.removeItem("usuarioLogado");

  if (window.showToast) {
    window.showToast(
      "Sessão encerrada com sucesso.",
      "info"
    );
  }

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
});

// =====================================
// INICIALIZAÇÃO
// =====================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    atualizarHeader();

    await carregarCarros();

    await carregarAlugados();

    configurarPainelDev();
  }
);

// =====================================
// USUÁRIO LOGADO
// =====================================
function obterUsuarioLogado() {

  try {

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

    if (!usuario || !usuario.token) {
      return null;
    }

    return usuario;

  } catch {

    return null;
  }
}

// =====================================
// HEADER
// =====================================
function atualizarHeader() {

  const usuario =
    obterUsuarioLogado();

  const usuarioNome =
    document.getElementById(
      "usuarioNome"
    );

  if (usuario) {

    btnLogin &&
      (btnLogin.style.display = "none");

    btnRegistro &&
      (btnRegistro.style.display = "none");

    btnSair &&
      (btnSair.style.display = "inline-block");

    if (usuarioNome) {

      usuarioNome.textContent =
        `Olá, ${usuario.nome}`;
    }

  } else {

    btnLogin &&
      (btnLogin.style.display = "inline-block");

    btnRegistro &&
      (btnRegistro.style.display = "inline-block");

    btnSair &&
      (btnSair.style.display = "none");

    if (usuarioNome) {
      usuarioNome.textContent = "";
    }
  }
}

// =====================================
// CARREGAR VEÍCULOS DISPONÍVEIS
// =====================================
async function carregarCarros() {

  try {

    const resposta = await fetch(
      "http://localhost:3000/carros?available=true"
    );

    const dados =
      await resposta.json();

    if (!listaCarros) return;

    listaCarros.innerHTML = "";

    const usuario =
      obterUsuarioLogado();

    dados.carros.forEach((carro) => {

      const preco =
        carro.preco_diaria ??
        carro.preco ??
        0;

      const card =
        document.createElement("div");

      card.className =
        "carro-card";

      card.innerHTML = `
        ${
          carro.imagem
            ? `
            <img
              src="${carro.imagem}"
              alt="${carro.modelo}"
              class="carro-thumb">
            `
            : ""
        }

        <h3>${carro.modelo}</h3>

        <p>
          Marca: ${carro.marca}
        </p>

        <p>
          Ano: ${carro.ano || "2025"}
        </p>

        <p class="preco">
          R$ ${preco}/dia
        </p>

        <button class="btn-primary">
          Reservar Veículo
        </button>
      `;

      const botao =
        card.querySelector("button");

      if (!usuario) {

        botao.disabled = true;

        botao.textContent =
          "Faça login para reservar";

      } else {

        botao.addEventListener(
          "click",
          () => alugarCarro(carro.id)
        );
      }

      listaCarros.appendChild(card);
    });

  } catch (erro) {

    console.error(erro);

    listaCarros.innerHTML = `
      <p>
        Não foi possível carregar os veículos disponíveis.
      </p>
    `;
  }
}

// =====================================
// CARREGAR VEÍCULOS RESERVADOS
// =====================================
async function carregarAlugados() {

  const lista =
    document.getElementById(
      "listaAlugados"
    );

  if (!lista) return;

  try {

    const resposta = await fetch(
      "http://localhost:3000/carros?available=false"
    );

    const dados =
      await resposta.json();

    lista.innerHTML = "";

    dados.carros.forEach((carro) => {

      const preco =
        carro.preco_diaria ??
        carro.preco ??
        0;

      const card =
        document.createElement("div");

      card.className =
        "carro-card";

      card.innerHTML = `
        ${
          carro.imagem
            ? `
            <img
              src="${carro.imagem}"
              alt="${carro.modelo}"
              class="carro-thumb">
            `
            : ""
        }

        <h3>${carro.modelo}</h3>

        <p>
          Marca: ${carro.marca}
        </p>

        <p>
          Ano: ${carro.ano || "2025"}
        </p>

        <p class="preco">
          R$ ${preco}/dia
        </p>

        <p style="
          font-weight:700;
          color:#00C853;
          margin-top:10px;
        ">
          Reservado por Cliente
        </p>
      `;

      lista.appendChild(card);
    });

  } catch (erro) {

    console.error(erro);

    lista.innerHTML = `
      <p>
        Não foi possível carregar os veículos reservados.
      </p>
    `;
  }
}

// =====================================
// RESERVAR VEÍCULO
// =====================================
async function alugarCarro(idCarro) {

  const usuario =
    obterUsuarioLogado();

  if (!usuario) {

    window.showToast?.(
      "Faça login para reservar um veículo.",
      "info"
    );

    return;
  }

  try {

    const resposta =
      await fetch(
        "http://localhost:3000/alugar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${usuario.token}`
          },

          body: JSON.stringify({
            idCarro
          })
        }
      );

    const dados =
      await resposta.json();

    if (dados.sucesso) {

      window.showToast?.(
        "Reserva realizada com sucesso!",
        "success"
      );

      await carregarCarros();
      await carregarAlugados();

    } else {

      window.showToast?.(
        dados.mensagem ||
        "Não foi possível concluir a reserva.",
        "error"
      );
    }

  } catch (erro) {

    console.error(erro);

    window.showToast?.(
      "Erro ao conectar com o servidor.",
      "error"
    );
  }
}

// =====================================
// PAINEL ADMINISTRATIVO
// =====================================
function configurarPainelDev() {

  const btnPainelDev =
    document.getElementById(
      "btnPainelDev"
    );

  const usuario =
    obterUsuarioLogado();

  if (
    btnPainelDev &&
    usuario &&
    (
      usuario.role === "admin" ||
      usuario.role === "dev"
    )
  ) {

    btnPainelDev.style.display =
      "inline-block";

    btnPainelDev.addEventListener(
      "click",
      () => {
        window.location.href =
          "dev.html";
      }
    );
  }
}
    window.location.href = "login.html";
  });
}

// =====================================
// INICIALIZAÇÃO
// =====================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    atualizarHeader();

    await carregarCarros();

    await carregarAlugados();

    configurarPainelDev();
  }
);

// =====================================
// HEADER
// =====================================
function atualizarHeader() {

  const usuario = obterUsuarioLogado();

  const usuarioNome =
    document.getElementById("usuarioNome");

  if (usuario) {

    if (btnLogin) {
      btnLogin.style.display = "none";
    }

    if (btnRegistro) {
      btnRegistro.style.display = "none";
    }

    if (btnSair) {
      btnSair.style.display = "inline-block";
    }

    if (usuarioNome) {
      usuarioNome.textContent =
        `Olá, ${usuario.nome} 👋`;
    }

  } else {

    if (btnLogin) {
      btnLogin.style.display = "inline-block";
    }

    if (btnRegistro) {
      btnRegistro.style.display = "inline-block";
    }

    if (btnSair) {
      btnSair.style.display = "none";
    }

    if (usuarioNome) {
      usuarioNome.textContent = "";
    }
  }
}

// =====================================
// USUÁRIO LOGADO
// =====================================
function obterUsuarioLogado() {

  try {

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

    if (!usuario || !usuario.token) {
      return null;
    }

    return usuario;

  } catch {

    return null;
  }
}

// =====================================
// CARREGAR CARROS DISPONÍVEIS
// =====================================
async function carregarCarros() {

  try {

    const resposta = await fetch(
      "http://localhost:3000/carros?available=true"
    );

    const dados = await resposta.json();

    if (!listaCarros) return;

    listaCarros.innerHTML = "";

    const usuarioLogado =
      obterUsuarioLogado();

    dados.carros.forEach((carro) => {

      const card =
        document.createElement("div");

      card.classList.add("carro-card");

      const preco =
        carro.preco_diaria ??
        carro.preco ??
        0;

      card.innerHTML = `
        ${carro.imagem
          ? `<img src="${carro.imagem}" alt="${carro.modelo}" class="carro-thumb">`
          : ""
        }

        <h3>${carro.modelo}</h3>

        <p>${carro.marca}</p>

        <p class="preco">
          R$ ${preco}/dia
        </p>

        <button>
          Alugar
        </button>
      `;

      const botao =
        card.querySelector("button");

      if (!usuarioLogado) {

        botao.disabled = true;

        botao.textContent =
          "Faça login para alugar";

      } else {

        botao.addEventListener(
          "click",
          () => alugarCarro(carro.id)
        );
      }

      listaCarros.appendChild(card);
    });

  } catch (erro) {

    console.error(
      "Erro ao carregar carros:",
      erro
    );

    if (listaCarros) {
      listaCarros.innerHTML =
        "<p>Erro ao carregar os carros.</p>";
    }
  }
}

// =====================================
// CARREGAR CARROS ALUGADOS
// =====================================
async function carregarAlugados() {

  const lista =
    document.getElementById("listaAlugados");

  if (!lista) return;

  try {

    const resposta = await fetch(
      "http://localhost:3000/carros?available=false"
    );

    const dados = await resposta.json();

    lista.innerHTML = "";

    dados.carros.forEach((carro) => {

      const card =
        document.createElement("div");

      card.className = "carro-card";

      const preco =
        carro.preco_diaria ??
        carro.preco ??
        0;

      card.innerHTML = `
        ${carro.imagem
          ? `<img src="${carro.imagem}" alt="${carro.modelo}" class="carro-thumb">`
          : ""
        }

        <h3>${carro.modelo}</h3>

        <p>${carro.marca}</p>

        <p class="preco">
          R$ ${preco}/dia
        </p>

        <p style="font-weight:700;color:var(--accent-2)">
          Status: Alugado
        </p>
      `;

      lista.appendChild(card);
    });

  } catch (erro) {

    console.error(
      "Erro ao carregar alugados:",
      erro
    );
  }
}

// =====================================
// ALUGAR CARRO
// =====================================
async function alugarCarro(idCarro) {

  const usuario =
    obterUsuarioLogado();

  if (!usuario) {

    if (window.showToast) {

      window.showToast(
        "Você precisa estar logado para alugar um carro!",
        "info"
      );
    }

    return;
  }

  try {

    const resposta = await fetch(
      "http://localhost:3000/alugar",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${usuario.token}`
        },

        body: JSON.stringify({
          idCarro
        })
      }
    );

    const dados =
      await resposta.json();

    if (dados.sucesso) {

      if (window.showToast) {

        window.showToast(
          "Carro alugado com sucesso!",
          "success"
        );
      }

      await carregarCarros();

      await carregarAlugados();

    } else {

      if (window.showToast) {

        window.showToast(
          dados.mensagem ||
          "Erro ao alugar o carro.",
          "error"
        );
      }
    }

  } catch (erro) {

    console.error(erro);

    if (window.showToast) {

      window.showToast(
        "Erro ao conectar com o servidor.",
        "error"
      );
    }
  }
}

// =====================================
// PAINEL DEV
// =====================================
function configurarPainelDev() {

  const btnPainelDev =
    document.getElementById("btnPainelDev");

  const usuarioAtual =
    obterUsuarioLogado();

  if (
    btnPainelDev &&
    usuarioAtual &&
    (
      usuarioAtual.role === "dev" ||
      usuarioAtual.role === "admin"
    )
  ) {

    btnPainelDev.style.display =
      "inline-block";

    btnPainelDev.addEventListener(
      "click",
      () => {
        window.location.href =
          "dev.html";
      }
    );
  }
}

console.log("Index carregado com exito!");

// ======= ELEMENTOS =======
const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const btnSair = document.getElementById("btnSair");
const listaCarros = document.getElementById("listaCarros");

// ======= VERIFICAR LOGIN =======
const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

if (usuarioLogado) {
  btnLogin.style.display = "none";
  btnRegistro.style.display = "none";
  btnSair.style.display = "inline-block";
} else {
  btnSair.style.display = "none";
}

// ======= EVENTOS =======
btnLogin.addEventListener("click", () => {
  window.location.href = "login.html";
});

btnRegistro.addEventListener("click", () => {
  window.location.href = "registro.html";
});

btnSair.addEventListener("click", () => {
  localStorage.removeItem("usuarioLogado");
  alert("Você saiu da conta.");
  window.location.href = "login.html";
});

// função para verificar usuario logado
document.addEventListener("DOMContentLoaded", () => {
  atualizarHeader();
  carregarCarros();
});

// === Atualiza o header de acordo com o login ===
function atualizarHeader() {
  const usuario = obterUsuarioLogado();
  const btnLogin = document.getElementById("btnLogin");
  const btnRegistro = document.getElementById("btnRegistro");
  const btnSair = document.getElementById("btnSair");
  const usuarioNome = document.getElementById("usuarioNome");

  if (usuario) {
    // Usuário logado
    btnLogin.style.display = "none";
    btnRegistro.style.display = "none";
    btnSair.style.display = "inline-block";

    usuarioNome.textContent = `Olá, ${usuario.nome} 👋`;
  } else {
    // Nenhum usuário logado
    btnLogin.style.display = "inline-block";
    btnRegistro.style.display = "inline-block";
    btnSair.style.display = "none";
    usuarioNome.textContent = "";
  }

  // Evento do botão sair
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    atualizarHeader();
  });
}

// === Função para ler usuário do localStorage ===
function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado"));
  } catch {
    return null;
  }
}

// ======= CARREGAR CARROS =======
async function carregarCarros() {
  try {
    const resposta = await fetch("http://localhost:3000/carros");
    const dados = await resposta.json();

    listaCarros.innerHTML = "";

    dados.carros.forEach((carro) => {
      const card = document.createElement("div");
      card.classList.add("carro-card");

      card.innerHTML = `
        <h3>${carro.modelo}</h3>
        <p>${carro.marca}</p>
        <p class="preco">R$ ${carro.preco}/dia</p>
        <button>Alugar</button>
      `;

      const botao = card.querySelector("button");

      if (!usuarioLogado) {
        botao.disabled = true;
        botao.textContent = "Faça login para alugar";
      } else {
        botao.addEventListener("click", () => alugarCarro(carro.id));
      }

      listaCarros.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar carros:", erro);
    listaCarros.innerHTML = "<p>Erro ao carregar os carros.</p>";
  }
}

// ======= FUNÇÃO DE ALUGUEL =======
async function alugarCarro(idCarro) {
  if (!usuarioLogado) {
    alert("Você precisa estar logado para alugar um carro!");
    return;
  }

  try {
    const resposta = await fetch("http://localhost:3000/alugar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: usuarioLogado.id,
        idCarro
      })
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
      alert("Carro alugado com sucesso!");
    } else {
      alert(dados.mensagem || "Erro ao alugar o carro.");
    }
  } catch (erro) {
    console.error(erro);
    alert("Erro ao conectar com o servidor.");
  }
}

// ======= EXECUÇÃO INICIAL =======
carregarCarros();

const btnPainelDev = document.getElementById("btnPainelDev");

if (usuarioLogado && (usuarioLogado.role === "dev" || usuarioLogado.role === "admin")) {
  btnPainelDev.style.display = "inline-block";
  btnPainelDev.addEventListener("click", () => {
    window.location.href = "dev.html";
  });
}
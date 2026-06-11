const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const btnSair = document.getElementById("btnSair");
const btnPainelDev = document.getElementById("btnPainelDev");
const listaCarros = document.getElementById("listaCarros");
const listaAlugados = document.getElementById("listaAlugados");

btnLogin?.addEventListener("click", () => {
  window.location.href = "login.html";
});

btnRegistro?.addEventListener("click", () => {
  window.location.href = "registro.html";
});

btnSair?.addEventListener("click", () => {
  NextDrive.clearStoredUser();
  NextDrive.showMessage(null, "Você saiu da conta.", "info");
  window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", async () => {
  atualizarHeader();
  configurarPainelDev();

  await Promise.all([
    carregarCarrosDisponiveis(),
    carregarCarrosAlugados()
  ]);
});

function atualizarHeader() {
  const usuario = NextDrive.getStoredUser();
  const usuarioNome = document.getElementById("usuarioNome");

  if (btnLogin) btnLogin.hidden = Boolean(usuario);
  if (btnRegistro) btnRegistro.hidden = Boolean(usuario);
  if (btnSair) btnSair.style.display = usuario ? "inline-block" : "none";

  if (usuarioNome) {
    usuarioNome.textContent = usuario ? `Olá, ${usuario.nome}` : "";
  }
}

function configurarPainelDev() {
  const usuario = NextDrive.getStoredUser();
  const canAccessPanel = usuario && ["admin", "dev"].includes(usuario.role);

  if (!btnPainelDev || !canAccessPanel) {
    return;
  }

  btnPainelDev.style.display = "inline-block";
  btnPainelDev.addEventListener("click", () => {
    window.location.href = "dev.html";
  });
}

async function carregarCarrosDisponiveis() {
  if (!listaCarros) return;

  try {
    const data = await NextDrive.request("/carros?available=true", {
      auth: false
    });
    const usuario = NextDrive.getStoredUser();

    listaCarros.innerHTML = "";

    if (!data.carros?.length) {
      listaCarros.innerHTML = "<p>Nenhum carro disponível no momento.</p>";
      return;
    }

    data.carros.forEach((carro) => {
      listaCarros.appendChild(
        NextDrive.createCarCard(carro, {
          buttonText: usuario ? "Alugar" : "Faça login para alugar",
          buttonDisabled: !usuario,
          onClick: () => alugarCarro(carro.id)
        })
      );
    });
  } catch (error) {
    console.error(error);
    listaCarros.innerHTML = "<p>Erro ao carregar os carros.</p>";
  }
}

async function carregarCarrosAlugados() {
  if (!listaAlugados) return;

  try {
    const data = await NextDrive.request("/carros?available=false", {
      auth: false
    });

    listaAlugados.innerHTML = "";

    if (!data.carros?.length) {
      listaAlugados.innerHTML = "<p>Nenhum carro alugado no momento.</p>";
      return;
    }

    data.carros.forEach((carro) => {
      listaAlugados.appendChild(
        NextDrive.createCarCard(carro, {
          status: "Status: Alugado"
        })
      );
    });
  } catch (error) {
    console.error(error);
    listaAlugados.innerHTML = "<p>Erro ao carregar os carros alugados.</p>";
  }
}

async function alugarCarro(idCarro) {
  try {
    const data = await NextDrive.request("/alugar", {
      method: "POST",
      body: {
        idCarro
      }
    });

    NextDrive.showMessage(null, data.mensagem || "Carro alugado com sucesso!", "sucesso");

    await Promise.all([
      carregarCarrosDisponiveis(),
      carregarCarrosAlugados()
    ]);
  } catch (error) {
    NextDrive.showMessage(null, error.message || "Erro ao alugar o carro.", "erro");
  }
}

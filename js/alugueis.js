const listaAlugueis = document.getElementById("listaAlugueis");
const usuarioLogado = NextDrive.getStoredUser();

document.addEventListener("DOMContentLoaded", () => {
  if (!listaAlugueis) {
    return;
  }

  if (!usuarioLogado) {
    listaAlugueis.innerHTML = "<p>Você precisa estar logado para ver seus aluguéis.</p>";
    return;
  }

  carregarLocacoes();
});

async function carregarLocacoes() {
  try {
    const data = await NextDrive.request("/me/locacoes");

    listaAlugueis.innerHTML = "";

    if (!data.locacoes?.length) {
      listaAlugueis.innerHTML = "<p>Nenhum aluguel encontrado.</p>";
      return;
    }

    data.locacoes.forEach((locacao) => {
      listaAlugueis.appendChild(criarCardLocacao(locacao));
    });
  } catch (error) {
    console.error(error);
    listaAlugueis.innerHTML = "<p>Erro ao conectar com o servidor.</p>";
  }
}

function criarCardLocacao(locacao) {
  const card = document.createElement("div");
  const dataInicio = new Date(locacao.data_inicio).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const dataFim = locacao.data_fim
    ? new Date(locacao.data_fim).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const imagemUrl = locacao.imagem ? `${NextDrive.API_URL}${locacao.imagem}` : "";
  const statusLabel = locacao.data_fim ? "Finalizado" : "Ativo";

  // set status class for visual distinction
  const statusClass = locacao.data_fim ? "finalized" : "active";

  card.className = `carro-card ${statusClass}`;
  card.innerHTML = `
    ${imagemUrl ? `<div class="carro-image"><img src="${imagemUrl}" alt="${locacao.modelo}" class="carro-thumb"></div>` : ""}
    <div class="carro-info">
      <div class="carro-header">
        <h3>${locacao.modelo}</h3>
        <span class="status-pill ${statusClass}">${statusLabel}</span>
      </div>
      <div class="carro-details">
        <p class="carro-meta">${locacao.marca}${locacao.ano ? ` • ${locacao.ano}` : ""}</p>
        ${locacao.placa ? `<p><strong>Placa:</strong> ${locacao.placa}</p>` : ""}
        <p><strong>Início:</strong> ${dataInicio}</p>
        ${dataFim ? `<p><strong>Fim:</strong> ${dataFim}</p>` : "<p><strong>Fim:</strong> Em andamento</p>"}
      </div>
      <div class="carro-footer">
        <p class="preco">${locacao.preco_diaria ? Number(locacao.preco_diaria).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}/dia</p>
      </div>
    </div>
  `;

  if (!locacao.data_fim) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-devolver";
    button.textContent = "Devolver Carro";
    button.addEventListener("click", () => devolverCarro(locacao.id));
    card.appendChild(button);
  }

  return card;
}

async function devolverCarro(idLocacao) {
  const ok = await NextDrive.showConfirm("Deseja realmente devolver este veículo?", "Devolver veículo");
  if (!ok) return;

  try {
    const data = await NextDrive.request("/devolver", {
      method: "POST",
      body: {
        idLocacao
      }
    });

    NextDrive.showMessage(null, data.mensagem || "Veículo devolvido com sucesso!", "sucesso");
    await carregarLocacoes();
  } catch (error) {
    NextDrive.showMessage(null, error.message || "Erro ao devolver veículo.", "erro");
  }
}

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
  const dataInicio = new Date(locacao.data_inicio).toLocaleString("pt-BR");
  const dataFim = locacao.data_fim
    ? new Date(locacao.data_fim).toLocaleString("pt-BR")
    : null;

  card.className = "carro-card";
  card.innerHTML = `
    <h3>${locacao.modelo}</h3>
    <p><strong>Marca:</strong> ${locacao.marca}</p>
    <p><strong>Início:</strong> ${dataInicio}</p>
    ${dataFim ? `<p><strong>Fim:</strong> ${dataFim}</p>` : ""}
    <p><strong>Status:</strong> ${locacao.data_fim ? "Finalizado" : "Ativo"}</p>
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
  if (!confirm("Deseja realmente devolver este veículo?")) {
    return;
  }

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

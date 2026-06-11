const usuario = NextDrive.getStoredUser();
const form = document.getElementById("formCarro");
const lista = document.getElementById("listaCarros");
const mensagem = document.getElementById("mensagem");
const btnVoltar = document.getElementById("btnVoltar");
const btnSair = document.getElementById("btnSair");

btnVoltar?.addEventListener("click", () => {
  window.location.href = "index.html";
});

btnSair?.addEventListener("click", () => {
  NextDrive.clearStoredUser();
  window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  if (!usuario || !["admin", "dev"].includes(usuario.role)) {
    document.body.innerHTML = `
      <main class="erro-acesso">
        <h2>Acesso negado</h2>
        <p>Você não possui permissão para acessar esta página.</p>
        <a href="index.html">Voltar</a>
      </main>
    `;
    return;
  }

  carregarCarros();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (
    !form.modelo.value.trim() ||
    !form.marca.value.trim() ||
    !form.ano.value ||
    !form.preco.value
  ) {
    NextDrive.showMessage(
      mensagem,
      "Preencha todos os campos obrigatórios.",
      "erro"
    );
    return;
  }

  try {

    const formData = new FormData();

    formData.append(
      "modelo",
      form.modelo.value.trim()
    );

    formData.append(
      "marca",
      form.marca.value.trim()
    );

    formData.append(
      "ano",
      form.ano.value
    );

    formData.append(
      "preco_diaria",
      form.preco.value
    );

    if (
      form.imagem.files &&
      form.imagem.files.length > 0
    ) {
      formData.append(
        "imagem",
        form.imagem.files[0]
      );
    }

    const resposta = await fetch(
      `${NextDrive.API_URL}/carros`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${NextDrive.getToken()}`
        },

        body: formData
      }
    );

    const data = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        data.mensagem ||
        "Erro ao cadastrar carro."
      );
    }

    NextDrive.showMessage(
      mensagem,
      data.mensagem ||
      "Carro adicionado com sucesso.",
      "sucesso"
    );

    form.reset();

    await carregarCarros();

  } catch (error) {

    console.error(error);

    NextDrive.showMessage(
      mensagem,
      error.message ||
      "Erro ao cadastrar carro.",
      "erro"
    );
  }
});
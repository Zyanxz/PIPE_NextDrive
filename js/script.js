const form = document.getElementById("formRegistro");
const mensagem = document.getElementById("mensagem");

// =========================
// REGISTRO
// =========================
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  // =========================
  // CAMPOS
  // =========================
  const nome =
    form.nome.value.trim();

  const email =
    form.email.value.trim();

  const cpf =
    form.cpf.value.trim();

  const cnh =
    form.cnh.value.trim();

  const tel =
    form.tel.value.trim();

  const senha =
    form.senha.value.trim();

  // =========================
  // VALIDAÇÕES
  // =========================
  if (
    !nome ||
    !email ||
    !cpf ||
    !cnh ||
    !senha
  ) {

    return mostrarMensagem(
      "Preencha todos os campos obrigatórios.",
      "erro"
    );
  }

  // validar email
  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailValido.test(email)) {

    return mostrarMensagem(
      "Digite um e-mail válido.",
      "erro"
    );
  }

  // validar senha
  if (senha.length < 6) {

    return mostrarMensagem(
      "A senha deve possuir no mínimo 6 caracteres.",
      "erro"
    );
  }

  try {

    // =========================
    // REQUISIÇÃO
    // =========================
    const resposta = await fetch(
      "http://localhost:3000/registro",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          nome,
          email,
          senha,
          cpf,
          cnh,
          tel
        })
      }
    );

    const dados =
      await resposta.json();

    // =========================
    // SUCESSO
    // =========================
    if (dados.sucesso) {

      mostrarMensagem(
        "Registro realizado com sucesso!",
        "sucesso"
      );

      // salvar usuário
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify({
          ...dados.usuario,
          token: dados.token || null
        })
      );

      // limpar formulário
      form.reset();

      // redirecionar
      setTimeout(() => {

        window.location.href =
          "index.html";

      }, 1500);

    } else {

      mostrarMensagem(
        dados.mensagem ||
        "Erro ao registrar usuário.",
        "erro"
      );
    }

  } catch (erro) {

    console.error(erro);

    mostrarMensagem(
      "Erro de conexão com o servidor.",
      "erro"
    );
  }
});

// =========================
// MENSAGENS
// =========================
function mostrarMensagem(
  texto,
  tipo
) {

  mensagem.textContent =
    texto;

  mensagem.className =
    "mensagem " + tipo;

  // toast global
  if (window.showToast) {

    const toastTipo =
      tipo === "sucesso"
        ? "success"
        : tipo === "erro"
        ? "error"
        : "info";

    window.showToast(
      texto,
      toastTipo
    );
  }
}
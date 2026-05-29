// Captura o formulário e o campo de mensagem
const form = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

// Quando o usuário clicar em "Entrar"
form.addEventListener("submit", async (evento) => {

  evento.preventDefault();

  // Pega os valores digitados
  const email = form.email.value.trim();
  const senha = form.senha.value.trim();

  // === Validações simples antes do envio ===
  if (!email || !senha) {

    mostrarMensagem(
      "Preencha todos os campos.",
      "erro"
    );

    return;
  }

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailValido.test(email)) {

    mostrarMensagem(
      "Digite um e-mail válido.",
      "erro"
    );

    return;
  }

  try {

    // === Envia os dados para o backend ===
    const resposta = await fetch(
      "http://localhost:3000/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          senha
        })
      }
    );

    const dados = await resposta.json();

    // === Analisa a resposta ===
    if (dados.sucesso) {

      // salva usuário + token
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify({
          ...dados.usuario,
          token: dados.token
        })
      );

      mostrarMensagem(
        "Login realizado com sucesso!",
        "sucesso"
      );

      // Redirecionamento
      setTimeout(() => {

        if (
          dados.usuario.role === "dev" ||
          dados.usuario.role === "admin"
        ) {

          window.location.href =
            "dev.html";

        } else {

          window.location.href =
            "index.html";
        }

      }, 1500);

    } else {

      mostrarMensagem(
        dados.mensagem ||
        "Erro ao fazer login.",
        "erro"
      );
    }

  } catch (erro) {

    console.error("Erro:", erro);

    mostrarMensagem(
      "Não foi possível conectar ao servidor.",
      "erro"
    );
  }
});

// Função para exibir mensagens ao usuário
function mostrarMensagem(texto, tipo) {

  mensagem.textContent = texto;

  mensagem.className =
    "mensagem " + tipo;

  if (window.showToast) {

    const t =
      tipo === "sucesso"
      ? "success"
      : (
          tipo === "erro"
          ? "error"
          : "info"
        );

    window.showToast(texto, t);
  }
}
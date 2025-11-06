const form = document.getElementById("formRegistro");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const senha = form.senha.value.trim();

  if (!nome || !email || !senha) {
    return mostrarMensagem("Preencha todos os campos!", "erro");
  }

  try {
    const resposta = await fetch("http://localhost:3000/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
      mostrarMensagem("Registro realizado com sucesso! Redirecionando...", "sucesso");

      // Salva o usuário no localStorage
      localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      mostrarMensagem(dados.mensagem || "Erro ao registrar usuário.", "erro");
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem("Erro de conexão com o servidor.", "erro");
  }
});

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}
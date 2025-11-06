document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const formCarro = document.getElementById("formCarro");
  const listaCarros = document.getElementById("listaCarros");
  const mensagem = document.getElementById("mensagem");
  const btnSair = document.getElementById("btnSair");
  const btnVoltar = document.getElementById("btnVoltar");

  // Verifica se é dev
  if (!usuario || usuario.role !== "dev") {
    alert("Acesso negado! Somente desenvolvedores podem entrar aqui.");
    window.location.href = "index.html";
    return;
  }

  // Adicionar carro
  formCarro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const modelo = formCarro.modelo.value.trim();
    const marca = formCarro.marca.value.trim();
    const preco = formCarro.preco.value.trim();

    if (!modelo || !marca || !preco) {
      mostrarMensagem("Preencha todos os campos.", "erro");
      return;
    }

    try {
      const resposta = await fetch("http://localhost:3000/carros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo, marca, preco })
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarMensagem("Carro adicionado com sucesso!", "sucesso");
        formCarro.reset();
        carregarCarros();
      } else {
        mostrarMensagem(dados.mensagem || "Erro ao adicionar carro.", "erro");
      }

    } catch (erro) {
      console.error("Erro:", erro);
      mostrarMensagem("Falha ao conectar ao servidor.", "erro");
    }
  });

  // Sair
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  });

  btnVoltar.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Exibir lista de carros
  async function carregarCarros() {
    const resposta = await fetch("http://localhost:3000/carros");
    const dados = await resposta.json();

    listaCarros.innerHTML = "";

    dados.carros.forEach((carro) => {
      const item = document.createElement("div");
      item.classList.add("carro-item");
      item.innerHTML = `
        <p><strong>${carro.modelo}</strong> (${carro.marca}) - R$ ${carro.preco}/dia</p>
      `;
      listaCarros.appendChild(item);
    });
  }

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
  }

  carregarCarros();
});
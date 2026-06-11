const form = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = form.email.value.trim();
  const senha = form.senha.value.trim();

  if (!email || !senha) {
    NextDrive.showMessage(mensagem, "Preencha todos os campos.", "erro");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    NextDrive.showMessage(mensagem, "Digite um e-mail válido.", "erro");
    return;
  }

  try {
    const data = await NextDrive.request("/login", {
      method: "POST",
      auth: false,
      body: {
        email,
        senha
      }
    });

    NextDrive.setStoredUser(data.usuario, data.token);
    NextDrive.showMessage(mensagem, "Login realizado com sucesso!", "sucesso");

    setTimeout(() => {
      const isAdmin = ["admin", "dev"].includes(data.usuario.role);
      window.location.href = isAdmin ? "dev.html" : "index.html";
    }, 1000);
  } catch (error) {
    NextDrive.showMessage(
      mensagem,
      error.message || "Não foi possível conectar ao servidor.",
      "erro"
    );
  }
});

const form = document.getElementById("formRegistro");
const mensagem = document.getElementById("mensagem");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const body = {
    nome: form.nome.value.trim(),
    cpf: form.cpf.value.trim(),
    cnh: form.cnh.value.trim(),
    tel: form.tel.value.trim(),
    email: form.email.value.trim(),
    senha: form.senha.value.trim()
  };

  if (!body.nome || !body.email || !body.cpf || !body.cnh || !body.senha) {
    NextDrive.showMessage(mensagem, "Preencha todos os campos obrigatórios.", "erro");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    NextDrive.showMessage(mensagem, "Digite um e-mail válido.", "erro");
    return;
  }

  if (body.senha.length < 6) {
    NextDrive.showMessage(mensagem, "A senha deve possuir no mínimo 6 caracteres.", "erro");
    return;
  }

  try {
    const data = await NextDrive.request("/registro", {
      method: "POST",
      auth: false,
      body
    });

    NextDrive.setStoredUser(data.usuario, data.token);
    NextDrive.showMessage(mensagem, "Registro realizado com sucesso!", "sucesso");
    form.reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    NextDrive.showMessage(
      mensagem,
      error.message || "Erro de conexão com o servidor.",
      "erro"
    );
  }
});

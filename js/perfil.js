const usuarioLogado = NextDrive.getStoredUser();

document.addEventListener("DOMContentLoaded", async () => {
  const mensagem = document.getElementById("mensagem");
  const pvNome = document.getElementById("pv-nome");
  const pvRole = document.getElementById("pv-role");
  const pvBio = document.getElementById("pv-bio");
  const avatar = document.getElementById("avatar");
  const statAlugueis = document.getElementById("stat-alugueis");
  const statCarros = document.getElementById("stat-carros");
  const perfilFormSection = document.getElementById("perfilForm");
  const editarBtn = document.getElementById("editarPerfil");
  const cancelEdit = document.getElementById("cancelEdit");
  const form = document.getElementById("formPerfil");

  if (!usuarioLogado) {
    NextDrive.showMessage(mensagem, "Você precisa estar logado.", "erro");
    return;
  }

  const setAvatar = (name) => {
    const initials = (name || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    if (avatar) {
      avatar.textContent = initials || "U";
    }
  };

  const preencherPerfil = (user) => {
    if (pvNome) pvNome.textContent = user.nome || "";
    if (pvRole) pvRole.textContent = user.role || "Usuário";
    if (pvBio) pvBio.textContent = `CPF: ${user.cpf || "-"} - CNH: ${user.cnh || "-"}`;
    setAvatar(user.nome);

    if (form) {
      form.nome.value = user.nome || "";
      form.cpf.value = user.cpf || "";
      form.cnh.value = user.cnh || "";
      form.tel.value = user.tel || "";
      form.email.value = user.email || "";
      form.senha.value = "";
    }
  };

  try {
    const [perfil, locacoes] = await Promise.all([
      NextDrive.request("/usuarios/me"),
      NextDrive.request("/me/locacoes")
    ]);

    if (perfil.usuario) {
      preencherPerfil(perfil.usuario);
    }

    if (Array.isArray(locacoes.locacoes)) {
      const carrosUnicos = new Set(locacoes.locacoes.map((locacao) => locacao.carro_id));

      if (statAlugueis) statAlugueis.textContent = locacoes.locacoes.length;
      if (statCarros) statCarros.textContent = carrosUnicos.size;
    }
  } catch (error) {
    console.error(error);
    NextDrive.showMessage(mensagem, "Erro ao carregar perfil.", "erro");
  }

  editarBtn?.addEventListener("click", () => {
    if (!perfilFormSection) return;
    perfilFormSection.style.display = "block";
    perfilFormSection.scrollIntoView({ behavior: "smooth" });
  });

  cancelEdit?.addEventListener("click", () => {
    if (perfilFormSection) {
      perfilFormSection.style.display = "none";
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = {
      nome: form.nome.value.trim(),
      cpf: form.cpf.value.trim(),
      cnh: form.cnh.value.trim(),
      tel: form.tel.value.trim(),
      email: form.email.value.trim()
    };
    const senha = form.senha.value.trim();

    if (senha) {
      body.senha = senha;
    }

    try {
      const data = await NextDrive.request(`/usuarios/${usuarioLogado.id}`, {
        method: "PUT",
        body
      });

      NextDrive.setStoredUser(data.usuario, usuarioLogado.token);
      preencherPerfil(data.usuario);
      NextDrive.showMessage(mensagem, "Perfil atualizado com sucesso.", "sucesso");

      if (perfilFormSection) {
        perfilFormSection.style.display = "none";
      }
    } catch (error) {
      NextDrive.showMessage(mensagem, error.message || "Erro ao atualizar perfil.", "erro");
    }
  });
});

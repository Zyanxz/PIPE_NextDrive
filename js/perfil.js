// Perfil: visualizador + edição inline

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // =========================
    // USUÁRIO LOGADO
    // =========================
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

    const token = usuario?.token;

    // =========================
    // ELEMENTOS
    // =========================
    const mensagem =
      document.getElementById("mensagem");

    const pvNome =
      document.getElementById("pv-nome");

    const pvRole =
      document.getElementById("pv-role");

    const pvBio =
      document.getElementById("pv-bio");

    const avatar =
      document.getElementById("avatar");

    const statAlugueis =
      document.getElementById("stat-alugueis");

    const statCarros =
      document.getElementById("stat-carros");

    const perfilFormSection =
      document.getElementById("perfilForm");

    const editarBtn =
      document.getElementById("editarPerfil");

    const cancelEdit =
      document.getElementById("cancelEdit");

    const form =
      document.getElementById("formPerfil");

    // =========================
    // VALIDA LOGIN
    // =========================
    if (!usuario || !token) {

      if (mensagem) {
        mensagem.textContent =
          "Você precisa estar logado.";
      }

      return;
    }

    // =========================
    // AVATAR
    // =========================
    function setAvatar(name) {

      const initials =
        (name || "")
          .split(" ")
          .map(s => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

      avatar.textContent =
        initials || "U";
    }

    // =========================
    // CARREGAR PERFIL
    // =========================
    try {

      const [uRes, lRes] =
        await Promise.all([

          // PERFIL
          fetch(
            "http://localhost:3000/usuarios/me",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          ),

          // LOCAÇÕES
          fetch(
            "http://localhost:3000/me/locacoes",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )
        ]);

      const ud = await uRes.json();
      const ld = await lRes.json();

      // =========================
      // DADOS DO PERFIL
      // =========================
      if (ud.sucesso && ud.usuario) {

        const u = ud.usuario;

        pvNome.textContent =
          u.nome || "";

        pvRole.textContent =
          u.role || "Usuário";

        pvBio.textContent =
          `CPF: ${u.cpf || "-"} • CNH: ${u.cnh || "-"}`;

        setAvatar(u.nome);

        // Preencher formulário
        if (form) {

          form.nome.value =
            u.nome || "";

          form.cpf.value =
            u.cpf || "";

          form.cnh.value =
            u.cnh || "";

          form.tel.value =
            u.tel || "";

          form.email.value =
            u.email || "";
        }
      }

      // =========================
      // ESTATÍSTICAS
      // =========================
      if (
        ld.sucesso &&
        Array.isArray(ld.locacoes)
      ) {

        statAlugueis.textContent =
          ld.locacoes.length;

        // quantidade de carros únicos
        const carrosUnicos =
          new Set(
            ld.locacoes.map(
              loc => loc.carro_id
            )
          );

        statCarros.textContent =
          carrosUnicos.size;
      }

    } catch (err) {

      console.error(err);

      mensagem.textContent =
        "Erro ao carregar perfil.";
    }

    // =========================
    // ABRIR E FECHAR EDIÇÃO
    // =========================
    function openEdit() {

      perfilFormSection.style.display =
        "block";

      perfilFormSection.scrollIntoView({
        behavior: "smooth"
      });
    }

    function closeEdit() {

      perfilFormSection.style.display =
        "none";
    }

    editarBtn?.addEventListener(
      "click",
      openEdit
    );

    cancelEdit?.addEventListener(
      "click",
      closeEdit
    );

    // =========================
    // SALVAR PERFIL
    // =========================
    form?.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        const body = {

          nome:
            form.nome.value.trim(),

          cpf:
            form.cpf.value.trim(),

          cnh:
            form.cnh.value.trim(),

          tel:
            form.tel.value.trim(),

          email:
            form.email.value.trim()
        };

        // senha opcional
        const senha =
          form.senha.value.trim();

        if (senha) {
          body.senha = senha;
        }

        try {

          const res = await fetch(
            "http://localhost:3000/usuarios/me",
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`
              },

              body: JSON.stringify(body)
            }
          );

          const data =
            await res.json();

          // =========================
          // SUCESSO
          // =========================
          if (data.sucesso) {

            // mantém token salvo
            localStorage.setItem(
              "usuarioLogado",
              JSON.stringify({
                ...data.usuario,
                token
              })
            );

            // atualiza tela
            pvNome.textContent =
              data.usuario.nome;

            pvBio.textContent =
              `CPF: ${data.usuario.cpf} • CNH: ${data.usuario.cnh}`;

            pvRole.textContent =
              data.usuario.role;

            setAvatar(
              data.usuario.nome
            );

            mensagem.textContent =
              "Perfil atualizado com sucesso.";

            if (window.showToast) {
              window.showToast(
                "Perfil atualizado!",
                "success"
              );
            }

            closeEdit();

          } else {

            mensagem.textContent =
              data.mensagem ||
              "Erro ao atualizar.";

            if (window.showToast) {
              window.showToast(
                data.mensagem ||
                "Erro ao atualizar.",
                "error"
              );
            }
          }

        } catch (err) {

          console.error(err);

          mensagem.textContent =
            "Erro de conexão.";

          if (window.showToast) {
            window.showToast(
              "Erro de conexão.",
              "error"
            );
          }
        }
      }
    );
  }
);
console.log("Perfil carregado com sucesso!");

// =====================================
// ELEMENTOS
// =====================================
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
const token = usuario?.token;

const avatar = document.getElementById("avatar");
const pvNome = document.getElementById("pv-nome");
const pvRole = document.getElementById("pv-role");
const pvBio = document.getElementById("pv-bio");

const statAlugueis = document.getElementById("stat-alugueis");
const statCarros = document.getElementById("stat-carros");

const formSection = document.getElementById("perfilForm");
const form = document.getElementById("formPerfil");
const editarBtn = document.getElementById("editarPerfil");
const cancelBtn = document.getElementById("cancelEdit");

const mensagem = document.getElementById("mensagem");

// =====================================
// LOGIN CHECK
// =====================================
if (!usuario || !token) {
    alert("Você precisa estar logado.");
    window.location.href = "login.html";
}

// =====================================
// AVATAR
// =====================================
function gerarAvatar(nome) {

    const letras = (nome || "")
        .split(" ")
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    avatar.textContent = letras || "U";
}

// =====================================
// CARREGAR PERFIL
// =====================================
async function carregarPerfil() {

    try {

        const res = await fetch(
            "http://localhost:3000/usuarios/me",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!data.sucesso) return;

        const u = data.usuario;

        pvNome.textContent = u.nome;
        pvRole.textContent = u.role || "Usuário";
        pvBio.textContent = `CPF: ${u.cpf} | CNH: ${u.cnh}`;

        gerarAvatar(u.nome);

        form.nome.value = u.nome || "";
        form.cpf.value = u.cpf || "";
        form.cnh.value = u.cnh || "";
        form.tel.value = u.tel || "";
        form.email.value = u.email || "";

    } catch (err) {
        console.error(err);
    }
}

// =====================================
// CARREGAR RESERVAS
// =====================================
async function carregarReservas() {

    try {

        const res = await fetch(
            "http://localhost:3000/me/locacoes",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        if (!data.sucesso) return;

        statAlugueis.textContent = data.locacoes.length;

        const carros = new Set(
            data.locacoes.map(l => l.carro_id)
        );

        statCarros.textContent = carros.size;

        const historico = document.getElementById("historicoAlugueis");

        historico.innerHTML = data.locacoes.length
            ? data.locacoes.map(l => `
                <div class="item-locacao">
                    Veículo ID: ${l.carro_id}
                </div>
            `).join("")
            : "Nenhuma reserva encontrada.";

    } catch (err) {
        console.error(err);
    }
}

// =====================================
// EDITAR PERFIL
// =====================================
editarBtn?.addEventListener("click", () => {
    formSection.style.display = "block";
});

cancelBtn?.addEventListener("click", () => {
    formSection.style.display = "none";
});

// =====================================
// SALVAR PERFIL
// =====================================
form?.addEventListener("submit", async (e) => {

    e.preventDefault();

    const body = {
        nome: form.nome.value,
        cpf: form.cpf.value,
        cnh: form.cnh.value,
        tel: form.tel.value,
        email: form.email.value
    };

    if (form.senha.value) {
        body.senha = form.senha.value;
    }

    try {

        const res = await fetch(
            "http://localhost:3000/usuarios/me",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        );

        const data = await res.json();

        if (data.sucesso) {

            localStorage.setItem(
                "usuarioLogado",
                JSON.stringify({
                    ...data.usuario,
                    token
                })
            );

            mensagem.textContent = "Perfil atualizado com sucesso!";
            carregarPerfil();

            formSection.style.display = "none";

        } else {
            mensagem.textContent = "Erro ao atualizar perfil.";
        }

    } catch (err) {
        console.error(err);
        mensagem.textContent = "Erro de conexão.";
    }
});

// =====================================
// INIT
// =====================================
document.addEventListener("DOMContentLoaded", () => {
    carregarPerfil();
    carregarReservas();
});

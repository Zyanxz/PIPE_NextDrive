const API = "http://localhost:3000";

function obterToken() {

    try {

        const usuario = JSON.parse(
            localStorage.getItem("usuarioLogado")
        );

        return usuario?.token || null;

    } catch {

        return null;
    }
}

function obterUsuario() {
    try {
        return JSON.parse(
            localStorage.getItem("usuarioLogado")
        );
    } catch {
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const usuario = obterUsuario();

    const form = document.getElementById("formCarro");
    const lista = document.getElementById("listaCarros");
    const msg = document.getElementById("mensagem");

    if (
        !usuario ||
        (
            usuario.role !== "admin" &&
            usuario.role !== "dev"
        )
    ) {

        document.body.innerHTML = `
            <main class="erro-acesso">
                <h2>Acesso negado</h2>
                <p>
                    Você não possui permissão.
                </p>

                <a href="index.html">
                    Voltar
                </a>
            </main>
        `;

        return;
    }

    carregarCarros();

    async function carregarCarros() {

        try {

            const res = await fetch(`${API}/carros`);

            const dados = await res.json();

            lista.innerHTML = "";

            dados.carros.forEach(carro => {

                const div = document.createElement("div");

                div.className = "carro-card";

                div.innerHTML = `
                    ${
                        carro.imagem
                        ? `
                            <img
                                src="${carro.imagem}"
                            class="carro-thumb"
                            >
                        `
                        : ""
                    }

                    <h3>${carro.modelo}</h3>

                    <p>${carro.marca}</p>

                    <p>${carro.ano}</p>

                    <p>
                        R$ ${carro.preco_diaria}/dia
                    </p>

                    <p>
                        ${
                            carro.disponivel
                            ? "Disponível"
                            : "Alugado"
                        }
                    </p>
                `;

                lista.appendChild(div);
            });

        } catch (erro) {

            console.error(erro);

            msg.innerHTML = `
                Erro ao carregar carros
            `;
        }
    }

    if (form) {

    form.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const body = {
                modelo: form.modelo.value,
                marca: form.marca.value,
                ano: Number(form.ano.value),
                preco_diaria: Number(form.preco.value),
                imagem: form.imagem.value
            };

            try {

                const res = await fetch(
                    `${API}/carros`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${obterToken()}`
                        },

                        body: JSON.stringify(body)
                    }
                );

                const dados = await res.json();

                if (!dados.sucesso) {

                    msg.innerHTML = dados.mensagem;

                    return;
                }

                msg.innerHTML =
                    "Carro adicionado com sucesso";

                form.reset();

                carregarCarros();

            } catch (erro) {

                console.error(erro);

                msg.innerHTML =
                    "Erro no servidor";
            }
        }
    );
}
});

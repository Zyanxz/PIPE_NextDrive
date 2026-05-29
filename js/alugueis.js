document.addEventListener('DOMContentLoaded', async () => {

    const lista = document.getElementById('listaAlugueis');

    // Token salvo no login
    const token = localStorage.getItem('token');

    if (!token) {
        lista.innerHTML = `
            <p>Você precisa estar logado para ver seus aluguéis.</p>
        `;
        return;
    }

    try {

        const resposta = await fetch(
            'http://localhost:3000/me/locacoes',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        if (!dados.sucesso) {
            lista.innerHTML = `
                <p>${dados.mensagem}</p>
            `;
            return;
        }

        if (dados.locacoes.length === 0) {
            lista.innerHTML = `
                <p>Nenhum aluguel encontrado.</p>
            `;
            return;
        }

        lista.innerHTML = '';

        dados.locacoes.forEach(locacao => {

            const card = document.createElement('div');

            card.className = 'carro-card';

            card.innerHTML = `
                <h3>${locacao.modelo}</h3>

                <p>
                    <strong>Marca:</strong>
                    ${locacao.marca}
                </p>

                <p>
                    <strong>Início:</strong>
                    ${new Date(locacao.data_inicio).toLocaleString()}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${locacao.data_fim ? 'Finalizado' : 'Ativo'}
                </p>
            `;

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error(erro);

        lista.innerHTML = `
            <p>Erro ao conectar com o servidor.</p>
        `;
    }
});
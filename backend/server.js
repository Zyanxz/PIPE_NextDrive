import express from "express"; // permite criar servidores web
import cors from "cors"; //permite conectar o node.js com o postgre
import pool from "./db/connection.js";

const app = express();
app.use(cors());
app.use(express.json());

//rota de teste
app.get("/", (req, res) => {
    res.send("Servidor funcionando :]");
});

// testar a conexão com o banco
app.get("/teste-banco", async(req, res) => {
    try {
        const result = await pool.query("SELECT NOW()")
        res.json({ sucesso: true, horaServidor: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});


//rota registro de novos usuarios

app.post("/registro", async (req, res) => {
    const { nome, email, senha } = req.body

    try {
        const resultado = await pool.query(
         "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *",
         [nome, email, senha]
        );
        res.json({ sucesso: true, usuario: resultado.rows[0] });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao tentar resgistrar usuário"});
    }
});

// Rota de login de usuário
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Busca o usuário pelo e-mail
    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );

    // Verifica se o usuário existe
    if (resultado.rows.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: "Usuário não encontrado" });
    }

    const usuario = resultado.rows[0];

    // Verifica se a senha está correta
    if (usuario.senha !== senha) {
      return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta" });
    }

    // Se tudo certo:
    res.json({ sucesso: true, mensagem: "Login realizado com sucesso!", usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor" });
  }
});

// Rota para listar todos os usuários
app.get("/usuarios", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json({ sucesso: true, usuarios: resultado.rows });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar usuários" });
  }
});

// Rota dos veiculos
app.get("/carros", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT * FROM carros WHERE disponivel = true ORDER BY id ASC");
        res.json({ sucesso: true, carros: resultado.rows });
    } catch (erro) {
     console.error(erro);
     res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar carros" });   
    }
});

// Rota para alugar carros
app.post("/alugar", async(req, res) => {
    const { idUsuario, idCarro } = req.body;

    try {
        await pool.query(
            "INSERT INTO alugueis (id_usuario, id_carro, data_inicio) VALUES ($1, $2, now())",
            [idUsuario, idCarro]
        );
        res.json({ sucesso: true, mensagem: "Carro alugado com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao alugar carro." });
    }
});

// Rota para cadastrar novo carro (somente devs/admins)
app.post("/carros", async (req, res) => {
  const { modelo, marca, ano, preco_diaria, disponivel, role } = req.body;

  // Validação de acesso
  if (role !== "dev" && role !== "admin") {
    return res.status(403).json({ sucesso: false, mensagem: "Acesso negado." });
  }

  try {
    const resultado = await pool.query(
      "INSERT INTO carros (modelo, marca, ano, preco_diaria, disponivel) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [modelo, marca, ano, preco_diaria, disponivel ?? true]
    );

    res.json({ sucesso: true, carro: resultado.rows[0] });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar carro." });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
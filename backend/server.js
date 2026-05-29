import express from "express";
import cors from "cors";
import pool from "./db/connection.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_super_secreta";

// Middlewares
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Proteção contra spam/bruteforce
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        sucesso: false,
        mensagem: "Muitas requisições. Tente novamente mais tarde."
    }
});

app.use(limiter);

// =========================
// MIDDLEWARE JWT
// =========================
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token não informado"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        req.userId = decoded.id;
        req.userRole = decoded.role;

        next();
    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Token inválido ou expirado"
        });
    }
};
const verificarAdmin = (req, res, next) => {

    if (
        req.userRole !== "admin" &&
        req.userRole !== "dev"
    ) {

        return res.status(403).json({
            sucesso: false,
            mensagem: "Acesso negado"
        });
    }

    next();
};

// =========================
// REGISTRO
// =========================
app.post("/registro", async (req, res) => {

    try {

        const {
            nome,
            email,
            senha,
            cpf,
            cnh,
            tel
        } = req.body;

        // =========================
        // VALIDAÇÃO
        // =========================
        if (
            !nome ||
            !email ||
            !senha ||
            !cpf ||
            !cnh
        ) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Preencha todos os campos obrigatórios"
            });
        }

        // =========================
        // VERIFICAR EMAIL
        // =========================
        const usuarioExiste =
            await pool.query(
                `
                SELECT id
                FROM usuarios
                WHERE email = $1
                `,
                [email]
            );

        if (
            usuarioExiste.rows.length > 0
        ) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Email já cadastrado"
            });
        }

        // =========================
        // CRIPTOGRAFIA
        // =========================
        const salt =
            await bcrypt.genSalt(10);

        const senhaHash =
            await bcrypt.hash(
                senha,
                salt
            );

        // =========================
        // INSERIR USUÁRIO
        // =========================
        const resultado =
            await pool.query(
                `
                INSERT INTO usuarios
                (
                    nome,
                    email,
                    senha,
                    cpf,
                    cnh,
                    tel
                )
                VALUES
                ($1,$2,$3,$4,$5,$6)

                RETURNING
                    id,
                    nome,
                    email,
                    role
                `,
                [
                    nome,
                    email,
                    senhaHash,
                    cpf,
                    cnh,
                    tel
                ]
            );

        const usuario =
            resultado.rows[0];

        // =========================
        // TOKEN JWT
        // =========================
        const token =
            jwt.sign(
                {
                    id: usuario.id,
                    role: usuario.role
                },
                SECRET_KEY,
                {
                    expiresIn: "24h"
                }
            );

        // =========================
        // RESPOSTA
        // =========================
        res.status(201).json({
            sucesso: true,
            mensagem:
                "Usuário registrado com sucesso",

            token,

            usuario
        });

    } catch (erro) {

        console.error(
            "ERRO REGISTRO:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro ao registrar usuário"
        });
    }
});
// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não encontrado"
            });
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Senha incorreta"
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                role: usuario.role
            },
            SECRET_KEY,
            {
                expiresIn: "24h"
            }
        );

        res.json({
            sucesso: true,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            }
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno"
        });
    }
});

// =========================
// LISTAR CARROS
// =========================
app.get("/carros", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM carros ORDER BY id ASC"
        );

        res.json({
            sucesso: true,
            carros: resultado.rows
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar carros"
        });
    }
});

// =========================
// ALUGAR CARRO
// =========================
app.post("/alugar", verificarToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { idCarro } = req.body;
        const idUsuario = req.userId;

        await client.query("BEGIN");

        // Bloqueia registro
        const carro = await client.query(
            `
            SELECT *
            FROM carros
            WHERE id = $1
            FOR UPDATE
            `,
            [idCarro]
        );

        if (carro.rows.length === 0) {
            throw new Error("Carro não encontrado");
        }

        if (!carro.rows[0].disponivel) {
            throw new Error("Carro indisponível");
        }

        // Inserir locação
        await client.query(
            `
            INSERT INTO locacoes
            (usuario_id, carro_id, data_inicio)
            VALUES ($1, $2, NOW())
            `,
            [idUsuario, idCarro]
        );

        // Atualizar carro
        await client.query(
            `
            UPDATE carros
            SET disponivel = false
            WHERE id = $1
            `,
            [idCarro]
        );

        await client.query("COMMIT");

        res.json({
            sucesso: true,
            mensagem: "Carro alugado com sucesso"
        });

    } catch (erro) {

        await client.query("ROLLBACK");

        res.status(400).json({
            sucesso: false,
            mensagem: erro.message
        });

    } finally {
        client.release();
    }
});


// =========================
// DEVOLVER CARRO
// =========================
app.post("/devolver", verificarToken, async (req, res) => {

    const client = await pool.connect();

    try {

        const { idLocacao } = req.body;

        await client.query("BEGIN");

        const locacao = await client.query(
            `
            SELECT *
            FROM locacoes
            WHERE id = $1
            AND usuario_id = $2
            FOR UPDATE
            `,
            [idLocacao, req.userId]
        );

        if (locacao.rows.length === 0) {
            throw new Error("Locação não encontrada");
        }

        if (locacao.rows[0].data_fim) {
            throw new Error("Locação já finalizada");
        }

        await client.query(
            `
            UPDATE locacoes
            SET data_fim = NOW()
            WHERE id = $1
            `,
            [idLocacao]
        );

        await client.query(
            `
            UPDATE carros
            SET disponivel = true
            WHERE id = $1
            `,
            [locacao.rows[0].carro_id]
        );

        await client.query("COMMIT");

        res.json({
            sucesso: true,
            mensagem: "Carro devolvido com sucesso"
        });

    } catch (erro) {

        await client.query("ROLLBACK");

        res.status(400).json({
            sucesso: false,
            mensagem: erro.message
        });

    } finally {
        client.release();
    }
});

// =========================
// ADICIONAR CARRO
// =========================
app.post(
    "/carros",
    verificarToken,
    verificarAdmin,
    async (req, res) => {

        try {

            const {
                modelo,
                marca,
                ano,
                preco_diaria,
                imagem
            } = req.body;

            // Validação
            if (
                !modelo ||
                !marca ||
                !ano ||
                !preco_diaria
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Preencha todos os campos obrigatórios"
                });
            }

            // Inserir carro
            const resultado = await pool.query(
                `
                INSERT INTO carros
                (
                    modelo,
                    marca,
                    ano,
                    preco_diaria,
                    imagem,
                    disponivel
                )
                VALUES
                ($1,$2,$3,$4,$5,true)
                RETURNING *
                `,
                [
                    modelo,
                    marca,
                    ano,
                    preco_diaria,
                    imagem || null
                ]
            );

            res.status(201).json({
                sucesso: true,
                mensagem: "Carro cadastrado com sucesso",
                carro: resultado.rows[0]
            });

        } catch (erro) {

            console.error("ERRO AO CADASTRAR CARRO:", erro);

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao adicionar carro"
            });
        }
    }
);

// =========================
// MINHAS LOCAÇÕES
// =========================
app.get("/me/locacoes", verificarToken, async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT
                l.id,
                l.data_inicio,
                l.data_fim,
                c.modelo,
                c.marca
            FROM locacoes l
            INNER JOIN carros c
                ON c.id = l.carro_id
            WHERE l.usuario_id = $1
            ORDER BY l.data_inicio DESC
            `,
            [req.userId]
        );

        res.json({
            sucesso: true,
            locacoes: resultado.rows
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar locações"
        });
    }
});

// =========================
// PERFIL
// =========================
app.get("/usuarios/me", verificarToken, async (req, res) => {
    try {

        const resultado = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                cpf,
                cnh,
                tel,
                role
            FROM usuarios
            WHERE id = $1
            `,
            [req.userId]
        );

        res.json({
            sucesso: true,
            usuario: resultado.rows[0]
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar perfil"
        });
    }
});
// =========================
// ATUALIZAR PERFIL
// =========================
app.put(
    "/usuarios/:id",
    verificarToken,
    async (req, res) => {

        try {

            const { id } = req.params;

            // Segurança
            if (
                req.userId != id &&
                req.userRole !== "admin" &&
                req.userRole !== "dev"
            ) {

                return res.status(403).json({
                    sucesso: false,
                    mensagem: "Acesso negado"
                });
            }

            const {
                nome,
                email,
                cpf,
                cnh,
                tel,
                senha
            } = req.body;

            let senhaHash = null;

            // Atualiza senha se enviada
            if (senha && senha.trim() !== "") {

                const salt = await bcrypt.genSalt(10);

                senhaHash = await bcrypt.hash(
                    senha,
                    salt
                );
            }

            let query = `
                UPDATE usuarios
                SET
                    nome = $1,
                    email = $2,
                    cpf = $3,
                    cnh = $4,
                    tel = $5
            `;

            const valores = [
                nome,
                email,
                cpf,
                cnh,
                tel
            ];

            // adiciona senha no update
            if (senhaHash) {

                query += `,
                    senha = $6
                `;

                valores.push(senhaHash);

                query += `
                    WHERE id = $7
                RETURNING
                    id,
                    nome,
                    email,
                    cpf,
                    cnh,
                    tel,
                    role
                `;

                valores.push(id);

            } else {

                query += `
                    WHERE id = $6
                RETURNING
                    id,
                    nome,
                    email,
                    cpf,
                    cnh,
                    tel,
                    role
                `;

                valores.push(id);
            }

            const resultado = await pool.query(
                query,
                valores
            );

            res.json({
                sucesso: true,
                usuario: resultado.rows[0]
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao atualizar perfil"
            });
        }
    }
);
// =========================
// BUSCAR USUÁRIO POR ID
// =========================
app.get(
    "/usuarios/:id",
    verificarToken,
    async (req, res) => {

        try {

            const { id } = req.params;

            // Segurança:
            // usuário comum só pode acessar o próprio perfil
            if (
                req.userId != id &&
                req.userRole !== "admin" &&
                req.userRole !== "dev"
            ) {

                return res.status(403).json({
                    sucesso: false,
                    mensagem: "Acesso negado"
                });
            }

            const resultado = await pool.query(
                `
                SELECT
                    id,
                    nome,
                    email,
                    cpf,
                    cnh,
                    tel,
                    role
                FROM usuarios
                WHERE id = $1
                `,
                [id]
            );

            if (resultado.rows.length === 0) {

                return res.status(404).json({
                    sucesso: false,
                    mensagem: "Usuário não encontrado"
                });
            }

            res.json({
                sucesso: true,
                usuario: resultado.rows[0]
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar usuário"
            });
        }
    }
);
// =========================
// TESTE SERVIDOR
// =========================
app.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API Locadora funcionando"
    });
});

// =========================
// START
// =========================
app.listen(PORT, () => {
    console.log(`🚗 Servidor rodando em http://localhost:${PORT}`);
});
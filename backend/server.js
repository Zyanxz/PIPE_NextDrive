import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import fs from "fs";
import upload from "./config/upload.js";

import pool from "./db/connection.js";

dotenv.config();
dotenv.config({ path: "arv.env" });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "nextdrive_dev_secret";
const ADMIN_ROLES = new Set(["admin", "dev"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..");

const usuarioSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  senha: z.string().min(6),
  cpf: z.string().trim().min(1),
  cnh: z.string().trim().min(1),
  tel: z.string().trim().optional().nullable()
});

const uploadsDir = path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const atualizarUsuarioSchema = usuarioSchema
  .omit({ senha: true })
  .extend({
    senha: z.string().min(6).optional().or(z.literal(""))
  });

const carroSchema = z.object({
  modelo: z.string().trim().min(1),
  marca: z.string().trim().min(1),
  ano: z.coerce.number().int().min(1900),
  preco_diaria: z.coerce.number().positive()
});

const idSchema = z.coerce.number().int().positive();

app.use("/uploads", express.static(uploadsDir));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.static(publicDir, { index: false }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    sucesso: false,
    mensagem: "Muitas requisições. Tente novamente mais tarde."
  }
}));

function ok(res, data = {}, status = 200) {
  return res.status(status).json({
    sucesso: true,
    ...data
  });
}

function fail(res, status, mensagem) {
  return res.status(status).json({
    sucesso: false,
    mensagem
  });
}

function parse(schema, data) {
  if (data === undefined || data === null) {
    const error = new Error("Dados inválidos: corpo da requisição ausente ou malformado.");
    error.status = 400;
    throw error;
  }

  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Dados inválidos.";
    const error = new Error(message);
    error.status = 400;
    throw error;
  }

  return result.data;
}

function signToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      role: usuario.role
    },
    JWT_SECRET,
    {
      expiresIn: "24h"
    }
  );
}

function publicUser(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cpf: usuario.cpf,
    cnh: usuario.cnh,
    tel: usuario.tel,
    role: usuario.role
  };
}

function verificarToken(req, res, next) {
  const [, token] = (req.headers.authorization || "").split(" ");

  if (!token) {
    return fail(res, 401, "Token não informado.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    return next();
  } catch {
    return fail(res, 401, "Token inválido ou expirado.");
  }
}

function verificarAdmin(req, res, next) {
  if (!ADMIN_ROLES.has(req.userRole)) {
    return fail(res, 403, "Acesso negado.");
  }

  return next();
}

app.post("/registro", async (req, res) => {
  console.log("POST /registro recebido");
  console.log(req.body);

  try {
    const dados = parse(usuarioSchema, req.body);

    const usuarioExiste = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [dados.email]
    );

    if (usuarioExiste.rows.length > 0) {
      return fail(res, 400, "E-mail já cadastrado.");
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const resultado = await pool.query(
      `
      INSERT INTO usuarios
      (nome, email, senha, cpf, cnh, tel)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        dados.nome,
        dados.email,
        senhaHash,
        dados.cpf,
        dados.cnh,
        dados.tel || null
      ]
    );

    console.log("USUÁRIO CRIADO");

    return res.status(201).json({
      sucesso: true,
      usuario: resultado.rows[0]
    });

  } catch (error) {

    console.error("ERRO REGISTRO:");
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: error.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = parse(z.object({
      email: z.string().trim().email(),
      senha: z.string().min(1)
    }), req.body);

    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    const usuario = resultado.rows[0];

    if (!usuario) {
      return fail(res, 401, "Usuário não encontrado.");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return fail(res, 401, "Senha incorreta.");
    }

    return ok(res, {
      token: signToken(usuario),
      usuario: publicUser(usuario)
    });
  } catch (error) {
    console.error("ERRO LOGIN:", error);
    return fail(res, error.status || 500, error.status ? error.message : "Erro interno.");
  }
});

app.get("/carros", async (req, res) => {
  try {
    const { available } = req.query;
    const values = [];
    let query = "SELECT * FROM carros";

    if (available !== undefined) {
      query += " WHERE disponivel = $1";
      values.push(available === "true");
    }

    query += " ORDER BY id ASC";

    const resultado = await pool.query(query, values);

    return ok(res, {
      carros: resultado.rows
    });
  } catch (error) {
    console.error("ERRO LISTAR CARROS:", error);
    return fail(res, 500, "Erro ao buscar carros.");
  }
});


app.post(
  "/carros",
  verificarToken,
  verificarAdmin,
  upload.single("imagem"),
  async (req, res) => {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {

      const bodyData = req.body || {};

      const carro = parse(
        carroSchema,
        {
          ...bodyData,
          ano: Number(bodyData.ano),
          preco_diaria: Number(bodyData.preco_diaria)
        }
      );

      const imagem =
        req.file
          ? `/uploads/${req.file.filename}`
          : null;

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
        (
          $1,$2,$3,$4,$5,true
        )
        RETURNING *
        `,
        [
          carro.modelo,
          carro.marca,
          carro.ano,
          carro.preco_diaria,
          imagem
        ]
      );

      return ok(
        res,
        {
          mensagem: "Carro cadastrado com sucesso.",
          carro: resultado.rows[0]
        },
        201
      );

    } catch (error) {

      console.error(
        "ERRO AO CADASTRAR CARRO:",
        error
      );

      return fail(
        res,
        error.status || 500,
        error.status
          ? error.message
          : "Erro ao adicionar carro."
      );
    }
  }
);

app.post("/alugar", verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const idCarro = parse(idSchema, req.body.idCarro);

    await client.query("BEGIN");

    const carro = await client.query(
      "SELECT * FROM carros WHERE id = $1 FOR UPDATE",
      [idCarro]
    );

    if (carro.rows.length === 0) {
      throw new Error("Carro não encontrado.");
    }

    if (!carro.rows[0].disponivel) {
      throw new Error("Carro indisponível.");
    }

    await client.query(
      "INSERT INTO locacoes (usuario_id, carro_id, data_inicio) VALUES ($1, $2, NOW())",
      [req.userId, idCarro]
    );
    await client.query(
      "UPDATE carros SET disponivel = false WHERE id = $1",
      [idCarro]
    );
    await client.query("COMMIT");

    return ok(res, {
      mensagem: "Carro alugado com sucesso."
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error.status || 400, error.message);
  } finally {
    client.release();
  }
});

app.post("/devolver", verificarToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const idLocacao = parse(idSchema, req.body.idLocacao);

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
      throw new Error("Locação não encontrada.");
    }

    if (locacao.rows[0].data_fim) {
      throw new Error("Locação já finalizada.");
    }

    await client.query(
      "UPDATE locacoes SET data_fim = NOW() WHERE id = $1",
      [idLocacao]
    );
    await client.query(
      "UPDATE carros SET disponivel = true WHERE id = $1",
      [locacao.rows[0].carro_id]
    );
    await client.query("COMMIT");

    return ok(res, {
      mensagem: "Carro devolvido com sucesso."
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error.status || 400, error.message);
  } finally {
    client.release();
  }
});

app.get("/me/locacoes", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      `
        SELECT
          l.id,
          l.carro_id,
          l.data_inicio,
          l.data_fim,
          c.modelo,
          c.marca
        FROM locacoes l
        INNER JOIN carros c ON c.id = l.carro_id
        WHERE l.usuario_id = $1
        ORDER BY l.data_inicio DESC
      `,
      [req.userId]
    );

    return ok(res, {
      locacoes: resultado.rows
    });
  } catch (error) {
    console.error("ERRO LOCACOES:", error);
    return fail(res, 500, "Erro ao buscar locações.");
  }
});

app.get("/usuarios/me", verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      `
        SELECT id, nome, email, cpf, cnh, tel, role
        FROM usuarios
        WHERE id = $1
      `,
      [req.userId]
    );

    if (resultado.rows.length === 0) {
      return fail(res, 404, "Usuário não encontrado.");
    }

    return ok(res, {
      usuario: publicUser(resultado.rows[0])
    });
  } catch (error) {
    console.error("ERRO PERFIL:", error);
    return fail(res, 500, "Erro ao buscar perfil.");
  }
});

app.get("/usuarios/:id", verificarToken, async (req, res) => {
  try {
    const id = parse(idSchema, req.params.id);

    if (Number(req.userId) !== id && !ADMIN_ROLES.has(req.userRole)) {
      return fail(res, 403, "Acesso negado.");
    }

    const resultado = await pool.query(
      `
        SELECT id, nome, email, cpf, cnh, tel, role
        FROM usuarios
        WHERE id = $1
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return fail(res, 404, "Usuário não encontrado.");
    }

    return ok(res, {
      usuario: publicUser(resultado.rows[0])
    });
  } catch (error) {
    console.error("ERRO BUSCAR USUARIO:", error);
    return fail(res, error.status || 500, error.status ? error.message : "Erro ao buscar usuário.");
  }
});

app.put("/usuarios/:id", verificarToken, async (req, res) => {
  try {
    const id = parse(idSchema, req.params.id);

    if (Number(req.userId) !== id && !ADMIN_ROLES.has(req.userRole)) {
      return fail(res, 403, "Acesso negado.");
    }

    const dados = parse(atualizarUsuarioSchema, req.body);
    const values = [dados.nome, dados.email, dados.cpf, dados.cnh, dados.tel || null];
    let query = `
      UPDATE usuarios
      SET nome = $1,
          email = $2,
          cpf = $3,
          cnh = $4,
          tel = $5
    `;

    if (dados.senha) {
      const senhaHash = await bcrypt.hash(dados.senha, 10);
      values.push(senhaHash, id);
      query += `,
          senha = $6
        WHERE id = $7
      `;
    } else {
      values.push(id);
      query += " WHERE id = $6";
    }

    query += " RETURNING id, nome, email, cpf, cnh, tel, role";

    const resultado = await pool.query(query, values);

    if (resultado.rows.length === 0) {
      return fail(res, 404, "Usuário não encontrado.");
    }

    return ok(res, {
      usuario: publicUser(resultado.rows[0])
    });
  } catch (error) {
    console.error("ERRO ATUALIZAR PERFIL:", error);
    return fail(res, error.status || 500, error.status ? error.message : "Erro ao atualizar perfil.");
  }
});

app.get("/", (req, res) => {
  return ok(res, {
    mensagem: "API NextDrive funcionando."
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

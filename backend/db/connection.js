import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "Locadora_carros",
    password: "2528",
    port: 5432,
});

export default pool;

pool.on("connect", () => {
    console.log("Banco de dados conectado com sucesso");
});

pool.on("error", (err) => {
    console.error("Erro inesperado no PostgreSQL:", err);
});

app.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT NOW()"
        );

        res.status(200).json({
            status: "online",
            mensagem: "Servidor funcionando corretamente",
            banco: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "erro",
            mensagem: "Erro ao conectar com o banco de dados"
        });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
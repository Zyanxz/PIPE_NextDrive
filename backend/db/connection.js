import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
dotenv.config({ path: "arv.env" });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "Locadora_carros",
  password: process.env.DB_PASSWORD || "2528",
  port: Number(process.env.DB_PORT) || 5432
});

pool.on("connect", () => {
  console.log("Banco conectado.");
});

pool.on("error", (error) => {
  console.error("Erro inesperado no banco:", error);
});

export default pool;

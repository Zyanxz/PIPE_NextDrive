import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "Locadora_carros",
    password: "2528",
    port: 5432,
});

export default pool;

// comando ultilizado para linkar banco de dados com sistema
import { config } from 'dotenv';
import sql from 'mssql';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT as string, 10),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function check() {
  try {
    const pool = await sql.connect(dbConfig);
    const res = await pool.request().query('SELECT TOP 1 * FROM user_credential');
    console.log("user_credential columns:", Object.keys(res.recordset[0] || {}));
    
    const res2 = await pool.request().query('SELECT TOP 1 * FROM users');
    console.log("users columns:", Object.keys(res2.recordset[0] || {}));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();

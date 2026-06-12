import sql from 'mssql';
export { sql };

export const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT as string, 10),
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const globalAny: any = global;

export const getConnection = async () => {
  try {
    if (!globalAny.dbPool || !globalAny.dbPool.connected) {
      globalAny.dbPool = new sql.ConnectionPool(config);
      await globalAny.dbPool.connect();
    }
    return globalAny.dbPool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    globalAny.dbPool = null;
    throw error;
  }
};

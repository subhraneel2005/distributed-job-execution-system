import "dotenv/config"
import pg from 'pg';
import { logger } from '../utils/index.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export async function query<T extends pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug({ text, duration, rows: result.rowCount }, 'executed query');
  return result;
}

export default pool;

import { query } from './index.js';
import { logger } from '../utils/index.js';

export async function runMigrations(): Promise<void> {
  logger.info('Running database migrations...');

  await query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY,
      task_name TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
      status TEXT NOT NULL CHECK (status IN ('QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'FAILED_QUEUE')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      payload JSONB DEFAULT '{}'::jsonb,
      assigned_worker UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS workers (
      id UUID PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('ONLINE', 'BUSY', 'OFFLINE', 'DEAD')),
      last_heartbeat TIMESTAMPTZ,
      max_capacity INTEGER NOT NULL DEFAULT 5,
      current_jobs_processing INTEGER NOT NULL DEFAULT 0,
      assigned_jobs TEXT[] DEFAULT '{}',
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS execution_history (
      id UUID PRIMARY KEY,
      job_id UUID NOT NULL REFERENCES jobs(id),
      worker_id UUID REFERENCES workers(id),
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_jobs_priority_created ON jobs(priority, created_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_execution_history_job ON execution_history(job_id)`);

  logger.info('Database migrations completed');
}

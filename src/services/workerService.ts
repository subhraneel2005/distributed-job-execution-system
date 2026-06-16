import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import type { Worker, WorkerStatus } from '../types/index.js';

export async function registerWorker(
  maxCapacity: number,
  metadata: Record<string, unknown>
): Promise<Worker> {
  const id = uuidv4();
  const result = await query<Worker>(
    `INSERT INTO workers (id, status, last_heartbeat, max_capacity, current_jobs_processing, assigned_jobs, metadata)
     VALUES ($1, 'ONLINE', NOW(), $2, 0, '{}', $3)
     RETURNING *`,
    [id, maxCapacity, JSON.stringify(metadata)]
  );
  return result.rows[0]!;
}

export async function getWorkerById(workerId: string): Promise<Worker | null> {
  const result = await query<Worker>('SELECT * FROM workers WHERE id = $1', [workerId]);
  return result.rows[0] ?? null;
}

export async function getWorkers(status?: WorkerStatus): Promise<Worker[]> {
  if (status) {
    const result = await query<Worker>(
      'SELECT * FROM workers WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  }
  const result = await query<Worker>('SELECT * FROM workers ORDER BY created_at DESC');
  return result.rows;
}

export async function updateHeartbeat(workerId: string): Promise<Worker | null> {
  const result = await query<Worker>(
    `UPDATE workers SET last_heartbeat = NOW(), status = 'ONLINE', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [workerId]
  );
  return result.rows[0] ?? null;
}

export async function updateWorkerStatus(
  workerId: string,
  status: WorkerStatus
): Promise<Worker | null> {
  const result = await query<Worker>(
    `UPDATE workers SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [workerId, status]
  );
  return result.rows[0] ?? null;
}

export async function getAvailableWorkers(): Promise<Worker[]> {
  const result = await query<Worker>(
    `SELECT * FROM workers
     WHERE status IN ('ONLINE', 'BUSY')
       AND current_jobs_processing < max_capacity
     ORDER BY current_jobs_processing ASC`
  );
  return result.rows;
}

export async function assignJobToWorker(jobId: string, workerId: string): Promise<void> {
  await query(
    `UPDATE workers
     SET current_jobs_processing = current_jobs_processing + 1,
         assigned_jobs = array_append(assigned_jobs, $2),
         updated_at = NOW()
     WHERE id = $1`,
    [workerId, jobId]
  );
}

export async function releaseJobFromWorker(jobId: string, workerId: string): Promise<void> {
  await query(
    `UPDATE workers
     SET current_jobs_processing = current_jobs_processing - 1,
         assigned_jobs = array_remove(assigned_jobs, $2),
         updated_at = NOW()
     WHERE id = $1`,
    [workerId, jobId]
  );
}

export async function releaseAllWorkerJobs(workerId: string): Promise<void> {
  await query(
    `UPDATE workers
     SET current_jobs_processing = 0,
         assigned_jobs = '{}',
         updated_at = NOW()
     WHERE id = $1`,
    [workerId]
  );
}

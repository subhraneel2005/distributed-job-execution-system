import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import type { ExecutionHistory } from '../types/index.js';

export async function recordHistory(
  jobId: string,
  workerId: string | null,
  fromStatus: string | null,
  toStatus: string,
  reason: string | null
): Promise<ExecutionHistory> {
  const id = uuidv4();
  const result = await query<ExecutionHistory>(
    `INSERT INTO execution_history (id, job_id, worker_id, from_status, to_status, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, jobId, workerId, fromStatus, toStatus, reason]
  );
  return result.rows[0]!;
}

export async function getJobHistory(jobId: string): Promise<ExecutionHistory[]> {
  const result = await query<ExecutionHistory>(
    'SELECT * FROM execution_history WHERE job_id = $1 ORDER BY created_at ASC',
    [jobId]
  );
  return result.rows;
}

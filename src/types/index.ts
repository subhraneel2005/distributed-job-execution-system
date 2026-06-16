export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type Priority = typeof PRIORITIES[number];

export const JOB_STATUSES = ['QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'FAILED_QUEUE'] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const WORKER_STATUSES = ['ONLINE', 'BUSY', 'OFFLINE', 'DEAD'] as const;
export type WorkerStatus = typeof WORKER_STATUSES[number];

export interface Job {
  id: string;
  task_name: string;
  priority: Priority;
  status: JobStatus;
  retry_count: number;
  max_retries: number;
  payload: Record<string, unknown>;
  assigned_worker: string | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  status: WorkerStatus;
  last_heartbeat: string | null;
  max_capacity: number;
  current_jobs_processing: number;
  assigned_jobs: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutionHistory {
  id: string;
  job_id: string;
  worker_id: string | null;
  from_status: string;
  to_status: string;
  reason: string | null;
  created_at: string;
}

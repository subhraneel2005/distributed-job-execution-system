const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface ApiError {
  error: string
  details?: unknown
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export interface Job {
  id: string
  task_name: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'QUEUED' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'FAILED_QUEUE'
  retry_count: number
  max_retries: number
  payload: unknown
  assigned_worker: string | null
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'DEAD'
  last_heartbeat: string | null
  max_capacity: number
  current_jobs_processing: number
  assigned_jobs: string[]
  metadata: unknown
  created_at: string
  updated_at: string
}

export interface ExecutionHistory {
  id: string
  job_id: string
  worker_id: string | null
  from_status: string | null
  to_status: string
  reason: string | null
  created_at: string
}

export interface CreateJobInput {
  taskName: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  maxRetries: number
  payload: Record<string, unknown>
}

export interface RegisterWorkerInput {
  maxCapacity: number
  metadata: Record<string, unknown>
}

export function fetchJobs(status?: string): Promise<Job[]> {
  const qs = status ? `?status=${status}` : ''
  return request<Job[]>(`/api/jobs${qs}`)
}

export function fetchJob(id: string): Promise<Job> {
  return request<Job>(`/api/jobs/${id}`)
}

export function createJob(data: CreateJobInput): Promise<Job> {
  return request<Job>('/api/jobs', { method: 'POST', body: JSON.stringify(data) })
}

export function fetchJobHistory(id: string): Promise<ExecutionHistory[]> {
  return request<ExecutionHistory[]>(`/api/jobs/history/${id}`)
}

export function fetchWorkers(): Promise<Worker[]> {
  return request<Worker[]>('/api/workers')
}

export function registerWorker(data: RegisterWorkerInput): Promise<Worker> {
  return request<Worker>('/api/workers/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function sendHeartbeat(id: string): Promise<Worker> {
  return request<Worker>(`/api/workers/${id}/heartbeat`, { method: 'POST' })
}

export function fetchHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

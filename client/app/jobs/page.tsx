'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { fetchJobs, createJob, type Job, type CreateJobInput } from "@/lib/api"

const statusColors: Record<string, string> = {
  QUEUED: "bg-blue-500",
  ASSIGNED: "bg-yellow-500",
  RUNNING: "bg-purple-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  FAILED_QUEUE: "bg-orange-500",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? "bg-gray-500"}>{status}</Badge>
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("ALL")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateJobInput>({
    taskName: "",
    priority: "MEDIUM",
    maxRetries: 3,
    payload: {},
  })
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setLoading(true)
    fetchJobs(filter === 'ALL' ? undefined : filter)
      .then(setJobs)
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.taskName.trim()) {
      toast.error("Task name is required")
      return
    }
    setSubmitting(true)
    try {
      await createJob(form)
      toast.success("Job created")
      setOpen(false)
      setForm({ taskName: "", priority: "MEDIUM", maxRetries: 3, payload: {} })
      load()
    } catch {
      toast.error("Failed to create job")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Jobs</h1>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v ?? 'ALL')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="QUEUED">QUEUED</SelectItem>
              <SelectItem value="ASSIGNED">ASSIGNED</SelectItem>
              <SelectItem value="RUNNING">RUNNING</SelectItem>
              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
              <SelectItem value="FAILED_QUEUE">FAILED_QUEUE</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button>Create Job</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={form.taskName}
                    onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                    placeholder="my-task"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => v && setForm({ ...form, priority: v as 'HIGH' | 'MEDIUM' | 'LOW' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="LOW">LOW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    min={0}
                    value={form.maxRetries}
                    onChange={(e) => setForm({ ...form, maxRetries: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Assigned Worker</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="hover:underline">
                        {job.task_name}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={job.priority} /></TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="text-xs">{job.retry_count}/{job.max_retries}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.assigned_worker ? job.assigned_worker.slice(0, 8) + '...' : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No jobs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type WorkerProcessResponse = {
  job_id: string
  status: string
  message: string
  word_count: number
  pipeline_method: string
  has_suspicious_content: boolean
}

export async function invokeWorkerProcessJob(input: {
  jobId: string
  storagePath: string
  mimeType?: string
}): Promise<WorkerProcessResponse | null> {
  const workerUrl = process.env.WORKER_URL?.trim()

  if (!workerUrl) {
    return null
  }

  const endpoint = `${workerUrl.replace(/\/$/, '')}/jobs/process`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: input.jobId,
      storage_path: input.storagePath,
      mime_type: input.mimeType ?? 'application/pdf',
    }),
  })

  if (!response.ok) {
    throw new Error(`Worker responded with ${response.status}`)
  }

  return response.json() as Promise<WorkerProcessResponse>
}

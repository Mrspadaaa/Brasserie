type FakeJob = {
  status: 'queued' | 'running' | 'done' | 'error';
  readAt?: number;
  sendError?: boolean;
};

let jobs: FakeJob[] = [];

export function setFakeJobs(next: FakeJob[]) {
  jobs = next;
}

export function resetFakeJobs() {
  jobs = [];
}

export function useBrewerJobs() {
  return { jobs };
}

export function isBrewerWorking(job: FakeJob) {
  return job.status === 'queued' || job.status === 'running';
}

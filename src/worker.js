import { execa } from 'execa';
import { fetchAndLockNextJob, completeJob, failAndMaybeRetry, getConfig } from './jobStore.js';
import { nowIso, db } from './db.js';

export async function runWorkerLoop(workerId, { stopSignal } = {}){
  process.on('SIGTERM', ()=> stopSignal.terminate = true);
  process.on('SIGINT', ()=> stopSignal.terminate = true);
  while(!stopSignal.terminate){
    const job = fetchAndLockNextJob(workerId);
    if(!job){
      await sleep(500); // idle wait
      continue;
    }
    try{
      const proc = await execa('bash', ['-lc', job.command], { all: true });
      completeJob(job.id, proc.all ?? '');
    }catch(err){
      const base = getConfig('backoff_base') ?? 2;
      failAndMaybeRetry(job, base, err.all || err.shortMessage || String(err));
    }
  }
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

export function registerWorker(workerId, pid){
  db.prepare('INSERT OR REPLACE INTO workers(id,pid,started_at,status) VALUES(?,?,?,?)')
    .run(workerId, pid, nowIso(), 'running');
}
export function deregisterWorker(workerId){
  db.prepare('DELETE FROM workers WHERE id=?').run(workerId);
}
export function listWorkers(){
  return db.prepare('SELECT * FROM workers').all();
}

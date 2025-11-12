import { db, nowIso } from './db.js';
import { addSeconds } from 'date-fns';

export function insertJob(job){
  const stmt = db.prepare(`INSERT INTO jobs(id,command,state,attempts,max_retries,created_at,updated_at,run_at,priority)
    VALUES(@id,@command,@state,@attempts,@max_retries,@created_at,@updated_at,@run_at,@priority)`);
  stmt.run({
    id: job.id,
    command: job.command,
    state: job.state ?? 'pending',
    attempts: job.attempts ?? 0,
    max_retries: job.max_retries ?? 3,
    created_at: job.created_at ?? nowIso(),
    updated_at: job.updated_at ?? nowIso(),
    run_at: job.run_at ?? nowIso(),
    priority: job.priority ?? 0
  });
}

export function getConfig(key){
  const row = db.prepare('SELECT value FROM config WHERE key=?').get(key);
  return row ? row.value : undefined;
}

export function setConfig(key,value){
  db.prepare('INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,String(value));
}

export function fetchAndLockNextJob(workerId){
  const tx = db.transaction(()=>{
    const row = db.prepare(`SELECT * FROM jobs
      WHERE state='pending' AND run_at <= ?
      ORDER BY priority DESC, created_at ASC
      LIMIT 1`).get(nowIso());
    if(!row) return null;
    const upd = db.prepare(`UPDATE jobs SET state='processing', locked_by=?, locked_at=?, updated_at=? WHERE id=? AND state='pending'`);
    const res = upd.run(workerId, nowIso(), nowIso(), row.id);
    if(res.changes === 0) return null; // race lost
    return row;
  });
  return tx();
}

export function completeJob(id, output){
  db.prepare(`UPDATE jobs SET state='completed', output=?, updated_at=? WHERE id=?`).run(output ?? null, nowIso(), id);
}

export function failAndMaybeRetry(job, backoffBase, errorMessage){
  const attempts = job.attempts + 1;
  const canRetry = attempts <= job.max_retries;
  if(canRetry){
    const delay = Math.pow(Number(backoffBase), attempts); // seconds
    const nextRun = addSeconds(new Date(), delay).toISOString();
    db.prepare(`UPDATE jobs SET state='pending', attempts=?, run_at=?, last_error=?, updated_at=?, locked_by=NULL, locked_at=NULL WHERE id=?`)
      .run(attempts, nextRun, errorMessage?.slice(0, 2000) ?? null, nowIso(), job.id);
    return { retried: true, delay };
  } else {
    const tx = db.transaction(()=>{
      db.prepare(`UPDATE jobs SET state='dead', attempts=?, last_error=?, updated_at=?, locked_by=NULL, locked_at=NULL WHERE id=?`)
        .run(attempts, errorMessage?.slice(0,2000) ?? null, nowIso(), job.id);
      db.prepare(`INSERT INTO dlq(id,command,attempts,max_retries,failed_at,last_error) VALUES(?,?,?,?,?,?)`)
        .run(job.id, job.command, attempts, job.max_retries, nowIso(), errorMessage?.slice(0,2000) ?? null);
    });
    tx();
    return { retried: false };
  }
}

export function listJobsByState(state){
  if(state){
    return db.prepare('SELECT * FROM jobs WHERE state=? ORDER BY created_at ASC').all(state);
  }
  return db.prepare('SELECT * FROM jobs ORDER BY created_at ASC').all();
}

export function stats(){
  const row = db.prepare(`SELECT 
    SUM(CASE WHEN state='pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN state='processing' THEN 1 ELSE 0 END) AS processing,
    SUM(CASE WHEN state='completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN state='dead' THEN 1 ELSE 0 END) AS dead
  FROM jobs`).get();
  return {
    pending: row.pending ?? 0,
    processing: row.processing ?? 0,
    completed: row.completed ?? 0,
    dead: row.dead ?? 0,
  };
}

export function dlqList(){
  return db.prepare('SELECT * FROM dlq ORDER BY failed_at DESC').all();
}

export function dlqRetry(id){
  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
  if(!job) throw new Error('Job not found');
  const tx = db.transaction(()=>{
    db.prepare('DELETE FROM dlq WHERE id=?').run(id);
    db.prepare(`UPDATE jobs SET state='pending', attempts=0, run_at=?, updated_at=?, last_error=NULL WHERE id=?`).run(nowIso(), nowIso(), id);
  });
  tx();
}

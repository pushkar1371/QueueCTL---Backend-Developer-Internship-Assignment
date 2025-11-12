import { fork } from 'node:child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ensureDb } from '../db.js';

const RUNTIME_DIR = path.join(process.cwd(), '.queuectl');
const PIDFILE = path.join(RUNTIME_DIR,'workers.json');

export async function start(opts){
  ensureDb();
  await fs.ensureDir(RUNTIME_DIR);
  const count = Number(opts.count || 1);
  const workers = []; 
  for(let i=0;i<count;i++){
    const child = fork(path.join(process.cwd(),'src/workerEntry.js'), [], {
      stdio: opts.foreground ? 'inherit' : 'ignore'
    });
    workers.push({ pid: child.pid });
  }
  await fs.writeJSON(PIDFILE, { workers, started_at: Date.now() }, { spaces: 2 });
  console.log(chalk.green(`Started ${count} worker(s).`));
}

export async function stop(){
  try{
    const state = await fs.readJSON(PIDFILE);
    for(const w of state.workers){
      try{ process.kill(w.pid, 'SIGTERM'); }catch{}
    }
    await fs.remove(PIDFILE);
    console.log(chalk.yellow('Sent SIGTERM to all workers. They will finish current jobs and exit.'));
  }catch(e){
    console.log(chalk.red('No running workers found.'));
  }
}

import fs from 'fs-extra';
import chalk from 'chalk';
import { insertJob } from '../jobStore.js';
import { nowIso } from '../db.js';

export async function run(jsonArg, opts){
  try{
    const src = opts.file ? await fs.readFile(opts.file,'utf8') : jsonArg;
    if(!src) throw new Error('Provide job JSON string or --file');
    const payload = JSON.parse(src);
    if(!payload.id || !payload.command) throw new Error('Job must include id and command');
    const job = {
      id: payload.id,
      command: payload.command,
      state: payload.state || 'pending',
      attempts: payload.attempts || 0,
      max_retries: payload.max_retries ||  Number(process.env.QUEUECTL_MAX_RETRIES) || 3,
      created_at: payload.created_at || nowIso(),
      updated_at: payload.updated_at || nowIso(),
      run_at: payload.run_at || nowIso(),
      priority: payload.priority || 0
    };
    insertJob(job);
    console.log(chalk.green(`Enqueued ${job.id}`));
  }catch(e){
    console.error(chalk.red('Failed to enqueue:'), e.message);
    process.exitCode = 1;
  }
}

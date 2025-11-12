import { dlqList, dlqRetry } from '../jobStore.js';
import chalk from 'chalk';
import { table } from 'table';

export function list(){
  const rows = dlqList();
  const data = [['id','attempts','max_retries','failed_at','last_error']]
    .concat(rows.map(r=>[r.id, r.attempts, r.max_retries, r.failed_at, (r.last_error||'').slice(0,80)]));
  console.log(table(data));
}

export function retry(id){
  try{ dlqRetry(id); console.log(chalk.green(`Re-queued ${id}`)); }
  catch(e){ console.error(chalk.red(e.message)); process.exitCode=1; }
}

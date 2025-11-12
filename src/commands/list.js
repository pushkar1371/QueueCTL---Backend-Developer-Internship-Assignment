import { listJobsByState } from '../jobStore.js';
import { table } from 'table';

export function run(opts){
  const rows = listJobsByState(opts.state);
  const data = [['id','state','attempts','max_retries','run_at','command']].concat(
    rows.map(r=>[r.id, r.state, r.attempts, r.max_retries, r.run_at, r.command])
  );
  console.log(table(data));
}

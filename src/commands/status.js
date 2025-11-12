import { stats } from '../jobStore.js';
import { listWorkers } from '../worker.js';
import { table } from 'table';

export function run(){
  const s = stats();
  console.log('Jobs:');
  console.log(table([
    ['pending','processing','completed','dead'],
    [s.pending, s.processing, s.completed, s.dead]
  ]));
  const workers = listWorkers();
  console.log('Workers:');
  if(workers.length===0){
    console.log('(none)');
  } else {
    console.table(workers.map(w=>({id:w.id, pid:w.pid, started_at:w.started_at, status:w.status})));
  }
}

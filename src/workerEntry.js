import { randomUUID } from 'node:crypto';
import { ensureDb } from './db.js';
import { registerWorker, deregisterWorker, runWorkerLoop } from './worker.js';

ensureDb();
const id = randomUUID();
registerWorker(id, process.pid);
const stopSignal = { terminate:false };
runWorkerLoop(id, { stopSignal }).then(()=> deregisterWorker(id));

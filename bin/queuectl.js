#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

import { ensureDb } from '../src/db.js';
import * as enqueueCmd from '../src/commands/enqueue.js';
import * as workerCmd from '../src/commands/worker.js';
import * as statusCmd from '../src/commands/status.js';
import * as listCmd from '../src/commands/list.js';
import * as dlqCmd from '../src/commands/dlq.js';
import * as configCmd from '../src/commands/config.js';

const program = new Command();
program
  .name('queuectl')
  .description('CLI background job queue with retries and DLQ (SQLite-backed)')
  .version(pkg.version);

program.hook('preAction', ensureDb);

program
  .command('enqueue')
  .description('Enqueue a new job (pass JSON string or --file)')
  .argument('[json]', 'Job JSON')
  .option('-f, --file <path>', 'Path to job JSON file')
  .action(enqueueCmd.run);

const worker = program.command('worker').description('Worker management');
worker.command('start')
  .description('Start N workers')
  .option('-c, --count <n>', 'Number of workers', '1')
  .option('--foreground', 'Run in foreground (do not daemonize)')
  .action(workerCmd.start);
worker.command('stop')
  .description('Stop workers gracefully')
  .action(workerCmd.stop);

program.command('status').description('Show queue & worker status').action(statusCmd.run);
program.command('list').description('List jobs').option('--state <state>','Filter by state').action(listCmd.run);

const dlq = program.command('dlq').description('Dead Letter Queue ops');
dlq.command('list').description('List DLQ jobs').action(dlqCmd.list);
dlq.command('retry').description('Retry DLQ job by id').argument('<id>').action(dlqCmd.retry);

const cfg = program.command('config').description('Configuration');
cfg.command('get').argument('[key]','Key (optional)').action(configCmd.get);
cfg.command('set').argument('<key>').argument('<value>').action(configCmd.set);

program.parse();

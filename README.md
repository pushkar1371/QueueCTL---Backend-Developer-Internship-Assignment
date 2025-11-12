# queuectl (Node.js)

CLI background job queue with retries, exponential backoff, DLQ and SQLite persistence.

## Quick start
```bash
npm i
# enqueue two jobs
queuectl enqueue '{"id":"job1","command":"echo \"Hello World\""}'
queuectl enqueue '{"id":"job2","command":"bash -lc \"sleep 2 && echo done\""}'
# start 3 workers
queuectl worker start --count 3
# check status
queuectl status
# list jobs by state
queuectl list --state completed
# stop workers
queuectl worker stop
```

## Failure, retry & DLQ
```bash
queuectl enqueue '{"id":"bad","command":"not-a-real-command","max_retries":2}'
# worker will retry with delays base^attempts (default base=2): 2s, 4s, then DLQ
queuectl dlq list
queuectl dlq retry bad
```

## Config
```bash
queuectl config get
queuectl config set backoff_base 3
queuectl config set max_retries_default 5
```

## Notes
- Persistence: `.queuectl/queue.db` (SQLite WAL) in project root.
- Locking: fetch+lock within a transaction prevents duplicate processing.
- Graceful stop: `worker stop` sends SIGTERM; workers finish current job.
- Bonus dashboard: `npm run dashboard` then open http://localhost:3030

## Test script
```bash
node scripts/smoke.js
```

import { execSync } from 'node:child_process';
function run(cmd){ console.log('$',cmd); console.log(execSync(cmd,{encoding:'utf8'})); }
run(`queuectl enqueue '{"id":"t1","command":"echo ok"}'`);
run(`queuectl enqueue '{"id":"t2","command":"bash -lc \"exit 1\"", "max_retries":1}'`);
run(`queuectl worker start --count 2 --foreground & sleep 1; queuectl status; sleep 5; queuectl status; queuectl worker stop`);

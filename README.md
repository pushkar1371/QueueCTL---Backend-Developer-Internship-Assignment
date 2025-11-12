# 🚀 QueueCTL – Background Job Queue (Node.js + SQLite)

> A CLI-based background job queue system supporting retries with exponential backoff, persistent storage, multiple workers, and a Dead Letter Queue (DLQ).

---

## 📦 1. Setup Instructions

### **Prerequisites**

- Node.js ≥ 18
- npm ≥ 8
- SQLite (bundled via `better-sqlite3`, no external DB setup required)
- macOS / Linux terminal

### **Steps**

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/queuectl.git
cd queuectl

# 2. Install dependencies
npm install

# 3. (Optional) Link globally for easy CLI usage
sudo npm link

# 4. Verify installation
queuectl --help
```

> 💡 If `npm link` fails (permission issue), run locally via  
> `node bin/queuectl.js <command> ...`

---

## 💻 2. Usage Examples

### **Enqueue a job**

```bash
queuectl enqueue '{"id":"job1","command":"echo Hello World"}'
```

✅ Output:

```
Enqueued job1
```

---

### **Start workers**

```bash
queuectl worker start --count 2
```

✅ Output:

```
Started 2 worker(s).
```

> Workers run in the background, continuously polling and processing pending jobs.

---

### **Stop workers**

```bash
queuectl worker stop
```

✅ Output:

```
Sent SIGTERM to all workers. They will finish current jobs and exit.
```

---

### **Check queue & worker status**

```bash
queuectl status
```

---

### **List jobs**

```bash
queuectl list --state completed
```

---

### **DLQ operations**

```bash
queuectl dlq list
queuectl dlq retry job1
```

---

### **Configuration**

```bash
queuectl config get
queuectl config set backoff_base 3
queuectl config set max_retries_default 5
```

---

## 🏗️ 3. Architecture Overview

### **Job Lifecycle**

| State        | Description                       |
| ------------ | --------------------------------- |
| `pending`    | Job is waiting to be picked up    |
| `processing` | Job is being executed by a worker |
| `completed`  | Successfully executed             |
| `failed`     | Temporary failure, will retry     |
| `dead`       | Permanently failed (moved to DLQ) |

---

### **Core Components**

- CLI built with `commander`
- SQLite persistence using `better-sqlite3`
- Multi-process worker execution using `child_process`
- Retry logic with exponential backoff
- DLQ management and configuration system

---

### **Directory Structure**

```
queuectl/
├── bin/queuectl.js
├── src/
│   ├── db.js
│   ├── jobStore.js
│   ├── worker.js
│   ├── workerEntry.js
│   ├── dashboard.js
│   └── commands/
│       ├── enqueue.js
│       ├── worker.js
│       ├── status.js
│       ├── list.js
│       ├── dlq.js
│       └── config.js
├── scripts/smoke.js
└── README.md
```

---

## ⚖️ 4. Assumptions & Trade-offs

| Area              | Design Decision            | Rationale                          |
| ----------------- | -------------------------- | ---------------------------------- |
| **Database**      | SQLite                     | Lightweight and persistent         |
| **Concurrency**   | Multi-process workers      | True parallel job execution        |
| **Job Execution** | Shell commands via `execa` | Realistic background workload      |
| **Retry Policy**  | Exponential backoff        | Prevents flooding                  |
| **DLQ**           | Separate table             | Allows manual inspection & requeue |
| **Simplified UI** | CLI + optional dashboard   | Focus on core functionality        |

---

## 🧪 5. Testing Instructions

### **Basic Workflow Test**

```bash
queuectl enqueue '{"id":"ok1","command":"echo success"}'
queuectl enqueue '{"id":"fail1","command":"false","max_retries":2}'
queuectl worker start --count 1 --foreground
```

### **Observe**

- `ok1` completes immediately
- `fail1` retries with delays (2s, 4s), then moves to DLQ

---

### **Verify Results**

```bash
queuectl status
queuectl list --state completed
queuectl dlq list
```

### **Retry from DLQ**

```bash
queuectl dlq retry fail1
```

---

## 📈 Bonus: Dashboard

```bash
npm run dashboard
```

Open [http://localhost:3030](http://localhost:3030) to view live job stats.

---

### 📜 License

MIT © 2025 Pushkar Bopanwar

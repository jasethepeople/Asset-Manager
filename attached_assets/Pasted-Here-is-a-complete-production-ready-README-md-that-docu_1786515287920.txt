Here is a complete, production‑ready **README.md** that documents the entire system—architecture, components, setup, and operation. Copy this into your repository root.

---

```markdown
# Agent Swarm – Autonomous Evolutionary Agent Engine

A self‑replicating, swarm‑based framework that dynamically spawns, provisions, and coordinates specialized agents to solve complex, ambiguous problems. The system combines **deterministic pruning** (Prolog), **high‑performance sandboxing** (Rust), **durable messaging** (NATS JetStream), **LLM synthesis** (Python), and **lineage‑aware orchestration** (Common Lisp) into a resilient, horizontally scalable whole.

---

## Architecture at a Glance

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         User / API Input                           │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 Lisp Orchestrator (SBCL)                           │
│  • DAG Journal (append‑only NDJSON)                               │
│  • Lineage Recovery on Crash                                      │
│  • Embedded Prolog (SWI‑Prolog via CFFI)                         │
│  • Prompt Genotype Manager (mutation threshold)                   │
│  • HTTP Server for Telemetry Facts (port 4000)                   │
└──────────────┬───────────────┬────────────────┬────────────────────┘
               │               │                │
               ▼               ▼                ▼
     ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
     │    Go Router     │ │  Python   │ │   Rust Workers  │
     │ • NATS Streams   │ │  Workers  │ │ • Namespace Jail│
     │ • KV Buckets     │ │ • LLM API │ │ • OverlayFS     │
     │ • HTTP Proxy     │ │ • Prompt  │ │ • Seccomp/Cgroups│
     │   (port 8080)    │ │   Render  │ │ • Telemetry Push│
     └─────────────────┘ └───────────┘ └─────────────────┘
               │               │                │
               └───────────────┴────────────────┘
                               │
                         ┌─────┴─────┐
                         │  NATS     │
                         │ JetStream │
                         │ FileStore │
                         └───────────┘
                               │
                         ┌─────┴─────┐
                         │PostgreSQL │
                         │ Fertility │
                         │  Metrics  │
                         └───────────┘
```

---

## Key Concepts

- **Agent DNA** – a combination of:
  - **Code Strategy** (pruned by Prolog)
  - **Cognitive Frame** (one of 5 foundational prompt genotypes)
  - **Prompt Genotype** (the actual system prompt template, versioned in KV)
- **Fertility Score** – weighted success rate of all agents spawned with a given genotype.  
  `fertility = (cumulative_fitness / total_spawns) * (1 + success_rate)`
- **Mutation Threshold** – when a genotype’s adjusted score falls below 65.0, or its lineage suffers 3 consecutive failures, Lisp spawns a mutated child prompt.
- **ε‑Greedy Frame Selection** – Prolog picks a cognitive frame with 15% random exploration, 85% exploitation of the highest adjusted score.

---

## Components & Responsibilities

| Component | Language | Role |
|-----------|----------|------|
| **Orchestrator** | Common Lisp (SBCL) | DAG lineage, crash recovery, Prolog FFI, prompt genotype management, task scheduling |
| **Prolog Engine** | SWI‑Prolog (embedded C) | Deterministic pruning of failure signatures; returns strategy + frame + frame spawn count |
| **Go Router** | Go | NATS stream/KV administration; HTTP proxy for Lisp to read KV states |
| **Python Workers** | Python 3 | Consume `prompt.generate`; render prompt templates; call LLM; publish manifests to `dag.prompt_ready` |
| **Rust Workers** | Rust | Isolated sandbox execution via `clone()`, OverlayFS, seccomp‑bpf, cgroups; push results to `AGENT_STATES` KV |
| **Telemetry Worker** | Go | Consume `agent.result.*`; update PostgreSQL metrics; sync top frames to Lisp HTTP endpoint every 60s |
| **PostgreSQL** | – | Stores `prompt_genotype_metrics` with computed fertility scores |
| **NATS JetStream** | – | Durable message queues and KV buckets (`AGENT_STATES`, `PROMPT_GENOTYPES`) |

---

## Directory Structure

```
agent-swarm/
├── docker-compose.yml
├── .env.example
├── Makefile
├── orchestrator/
│   ├── Dockerfile
│   ├── orchestrator.asd
│   ├── src/
│   │   ├── dag.lisp
│   │   ├── prolog-bridge.lisp
│   │   ├── nats-client.lisp
│   │   ├── http-server.lisp
│   │   └── main.lisp
│   └── prolog-bridge/
│       ├── prolog_bridge.c
│       ├── rules.pl
│       └── Makefile
├── sandbox/
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── src/
│       ├── main.rs
│       ├── overlay.rs
│       ├── jail.rs
│       └── telemetry.rs
├── prompt-worker/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── worker.py
├── router/
│   ├── Dockerfile
│   ├── go.mod
│   └── main.go
├── telemetry/
│   ├── Dockerfile
│   ├── go.mod
│   └── consumer.go
└── scripts/
    ├── init_nats.sh
    └── seed_prompts.sql
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Rust (1.70+) – for local development
- SBCL (2.2+) – for Lisp development
- SWI‑Prolog (9.0+) – for the C bridge

### 1. Clone & Environment

```bash
git clone https://github.com/your-org/agent-swarm.git
cd agent-swarm
cp .env.example .env
# Edit .env to set OPENAI_API_KEY and other secrets
```

### 2. Build the Base Rootfs (for Rust Sandbox)

```bash
mkdir -p /jail/base
docker run --rm alpine:latest tar -cC / --exclude=proc --exclude=sys --exclude=dev . | tar -xC /jail/base
# Copy /bin/bash, /usr/bin/timeout, and required libs
```

### 3. Start the Infrastructure

```bash
docker-compose up -d
```

This starts:
- NATS JetStream (port 4222, monitor 8222)
- PostgreSQL (port 5432)
- Go Router (port 8080)
- Python Workers (3 replicas)
- Telemetry Worker

### 4. Initialize NATS Streams & KV Buckets

```bash
docker-compose exec router /app/router -init   # or run scripts/init_nats.sh
```

### 5. Build & Run the Rust Workers

```bash
cd sandbox
cargo build --release
export NATS_URL=nats://localhost:4222
./target/release/sandbox
```

### 6. Build & Start the Lisp Orchestrator

```bash
cd orchestrator
make prolog-bridge   # builds prolog_bridge.so
sbcl --load src/main.lisp --eval '(swarm-orchestrator:start-orchestrator)'
```

Or use the provided Dockerfile:

```bash
docker-compose up orchestrator
```

### 7. Submit an Initial Objective

The orchestrator expects a root DAG node. You can either:
- Hardcode a goal in `src/main.lisp` (e.g., `(spawn-agent nil "functional" "initial" "START")`)
- Expose an HTTP endpoint (future extension) to accept a JSON goal.

---

## Configuration

### Environment Variables (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NATS_URL` | NATS server address | `nats://nats:4222` |
| `OPENAI_API_KEY` | API key for LLM service | – |
| `LLM_MODEL` | Model to use | `gpt-4o-mini` |
| `DB_DSN` | PostgreSQL connection string | `postgres://swarm:swarm@postgres/fertility` |
| `PROLOG_FACT_ENDPOINT` | Lisp HTTP endpoint for fact sync | `http://orchestrator:4000/update_facts` |

### Tuning Parameters (in Lisp)

- `*mutation-threshold*` – default 65.0
- `*consecutive-failure-limit*` – default 3
- `*ε-greedy-exploration-rate*` – default 0.15 (set in Prolog rules)

---

## Operations & Maintenance

### Monitoring

- NATS monitoring: `http://localhost:8222`
- Lisp HTTP endpoint: `http://localhost:4000/update_facts` (POST only)
- Router proxy: `http://localhost:8080/state/{agent_id}`

### Logs

- All services log to stdout; collect with `docker-compose logs -f`
- Lisp DAG journal is persisted at `/var/lib/orchestrator/dag_journal.ndjson`
- PostgreSQL stores fertility metrics; query with `SELECT * FROM prompt_genotype_metrics ORDER BY fertility_score DESC;`

### Backup & Recovery

- The Lisp DAG journal is append‑only; a checkpoint mechanism (snapshot + rotation) is recommended for long runs (see design docs).
- NATS JetStream stores data in `nats-data` volume; backup this directory.
- PostgreSQL dump: `pg_dump -U swarm fertility > backup.sql`

---

## Development & Testing

### Running Tests

- **Rust**: `cd sandbox && cargo test`
- **Lisp**: load `test.lisp` in SBCL
- **Python**: `pytest test_worker.py`
- **Go**: `go test ./...`

### Adding a New Cognitive Frame

1. Insert a new genotype into `PROMPT_GENOTYPES` KV (use `nats kv put`).
2. Insert a corresponding row into `prompt_genotype_metrics` with `fertility_score=50, total_spawns=10, successful_spawns=5, cumulative_fitness=500`.
3. Update Prolog rules to include the new frame in `fertility_distribution/3` (the telemetry sync will handle it after 60s).

---

## Design Principles

- **Crash‑only design** – all state is either replayable (journal) or fetchable from durable storage (KV, DB).
- **Decoupled components** – each service can be scaled independently.
- **Evolution, not brute force** – genetic pressure acts on both code *and* cognitive framing.
- **Security‑first** – Rust sandboxes use namespaces, seccomp, and cgroups; no container runtime overhead.
- **Observability** – all telemetry flows through NATS; fertility metrics are relational.

---

## Troubleshooting

### Orphaned OverlayFS mounts

If `umount2` fails, manual cleanup:
```bash
sudo umount -l /jail/scratch/agent_*/merged
sudo rm -rf /jail/scratch/agent_*
```

### Lisp cannot load `prolog_bridge.so`

Ensure `LD_LIBRARY_PATH` includes the directory with `libswipl.so` and the bridge library. On Docker, they are installed in `/usr/lib`.

### NATS JetStream storage full

Adjust `max_msgs_per_subject` or increase `TTL`; run the janitor routine in Go router.

---

## Future Extensions

- **Multi‑objective fitness** – track resource usage, readability, or latency.
- **Prompt crossover** – recombine high‑fertility prompt templates.
- **Online learning** – adapt ε‑greedy rate based on swarm performance.
- **DAG checkpointing** – snapshot and rotate journal to prevent unbounded growth.

---

## License

MIT – see [LICENSE](LICENSE) file.

---

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Add tests for new functionality.
4. Submit a pull request.

---

## Acknowledgements

Built on the shoulders of giants: SBCL, SWI‑Prolog, NATS, Rust, and the open‑source community.
```

---

This README provides everything a new developer or operator needs to understand, deploy, and extend the system. It ties together all the architectural details, setup steps, and operational know‑how from our prior discussion. Place it at the root of your repository.
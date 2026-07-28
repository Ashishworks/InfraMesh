# InfraMesh

> **An interactive distributed systems and observability playground built with React, TanStack Start, and a custom event-driven simulation engine.**

InfraMesh is a browser-based infrastructure simulator that visualizes how modern distributed systems behave internally. Rather than relying on a backend or mocked API responses, the entire infrastructure is simulated in memory using a custom event-driven engine.

The project combines concepts inspired by Redis, Kafka, RabbitMQ, Grafana, Jaeger, and OpenTelemetry into a single interactive platform for learning distributed systems through experimentation.

---

## ✨ Features

### 🗄️ Distributed Cache Simulation

A Redis-inspired distributed cache implementing core caching concepts.

Features include:

- Consistent hashing
- Primary / Replica topology
- Automatic key routing
- Replica synchronization
- LRU eviction policy
- TTL expiration
- Cache hit / miss tracking
- Memory accounting
- Pub/Sub messaging
- Live key visualization
- Node failure simulation

Supported commands:

```bash
PING

SET user:1 Alice
SET session:abc token EX 30

GET user:1
DEL user:1
EXISTS user:1
KEYS *

PUBLISH events "Hello"
SUBSCRIBE events
```

Every command generates:

- Metrics
- Structured logs
- Request traces
- Cache statistics
- Live UI updates

---

### ⚙️ Queue & Worker Simulation

Kafka/RabbitMQ-inspired asynchronous processing system.

Supports:

- Multiple queues
- Worker pools
- Job priorities
- Delayed jobs
- Retry mechanism
- Dead Letter Queue (DLQ)
- Worker failures
- Worker recovery
- Processing visualization

Pipeline:

```text
Producer
   │
   ▼
 Queue
   │
   ▼
 Worker
   │
 ┌─┴──────────────┐
 │                │
 ▼                ▼
Success         Retry
                   │
                   ▼
             Dead Letter Queue
```

---

### 📈 Realtime Metrics

Live telemetry generated directly from the simulation engine.

Includes:

- Requests / sec
- P95 latency
- Cache hit ratio
- Queue depth
- CPU utilization
- Memory usage
- Node statistics

Metrics are sampled continuously and visualized using interactive charts.

---

### 📜 Structured Logging

Centralized infrastructure log viewer.

Features:

- Live streaming
- Severity filtering
- Source filtering
- Full-text search
- Gateway logs
- Cache logs
- Worker logs
- Queue logs
- Pub/Sub logs

---

### 🔍 Distributed Tracing

Jaeger-inspired request tracing.

Each cache command generates a complete request trace.

Visualization includes:

- Waterfall timeline
- Service spans
- Request IDs
- Processing duration
- Per-span latency
- Success / failure states

---

### 🌐 Cluster Topology

Interactive visualization of the distributed cache.

Features:

- Consistent hash ring
- Primary nodes
- Replica nodes
- Replication links
- Node ownership
- Dynamic key placement
- Zoom & pan
- Node failure simulation

Users can enter arbitrary keys and instantly see which shard owns them.

---

### ❤️ Node Health Monitoring

Infrastructure monitoring dashboard.

Displays:

- Heartbeats
- CPU usage
- Memory pressure
- Cache statistics
- Evictions
- Node state
- Replica information

Interactive controls allow nodes to be stopped and restarted in real time.

---

## 🏗️ Architecture

InfraMesh is intentionally **not** built like a traditional CRUD application.

Instead of:

```text
Frontend
      │
      ▼
 REST API
      │
      ▼
 Database
```

InfraMesh behaves like:

```text
              React UI
                  │
                  ▼
          useSyncExternalStore
                  │
                  ▼
         InfraMesh Simulation Engine
                  │
 ┌──────────────┬───────────────┬──────────────┐
 │              │               │              │
 ▼              ▼               ▼              ▼
Cache        Queue          Metrics        Tracing
 │              │               │              │
 ▼              ▼               ▼              ▼
Replicas     Workers         Logs         Observability
```

The engine owns the complete infrastructure state.

React simply subscribes to state changes and renders different visualizations.

---

# ⚡ Simulation Engine

The heart of InfraMesh is:

```text
src/lib/inframesh/engine.ts
```

The engine models an entire distributed infrastructure inside browser memory.

It manages:

- Cache clusters
- Queue orchestration
- Worker scheduling
- Metrics generation
- Request tracing
- Structured logging
- Rate limiting
- Node health
- Replica synchronization
- TTL expiration
- LRU eviction
- Pub/Sub messaging

Every interaction flows through the engine before updating the UI.

---

## 🔄 Event-Driven Architecture

State updates follow a unidirectional event-driven model.

```text
User Action
      │
      ▼
 InfraMeshEngine
      │
      ▼
   mutate state
      │
      ▼
      emit()
      │
      ▼
useSyncExternalStore
      │
      ▼
 React Re-render
      │
      ▼
 Updated Dashboard
```

This keeps the UI completely decoupled from the infrastructure simulation.

---

# 📂 Project Structure

```text
src
│
├── components
│   ├── inframesh
│   └── ui
│
├── hooks
│
├── lib
│   ├── inframesh
│   │   ├── engine.ts
│   │   └── useEngine.ts
│   ├── utils.ts
│   └── error-page.ts
│
├── routes
│   ├── index.tsx
│   ├── cache.tsx
│   ├── queue.tsx
│   ├── cluster.tsx
│   ├── metrics.tsx
│   ├── logs.tsx
│   ├── tracing.tsx
│   └── health.tsx
│
├── router.tsx
├── start.ts
└── styles.css
```

---

# 🖥️ Application Routes

| Route | Description |
|--------|-------------|
| `/` | Live infrastructure overview |
| `/cache` | Redis-inspired cache playground |
| `/queue` | Queue & worker simulation |
| `/cluster` | Cluster topology & consistent hashing |
| `/metrics` | Live telemetry dashboard |
| `/logs` | Structured log viewer |
| `/tracing` | Distributed request tracing |
| `/health` | Node health monitoring |

---

# 🧠 Distributed Systems Concepts

## Caching

- Consistent Hashing
- LRU Eviction
- TTL Expiration
- Replication
- Primary / Replica Topology
- Cache Hits & Misses

---

## Queueing

- Producer / Consumer
- Worker Pools
- Priorities
- Delayed Jobs
- Retries
- Dead Letter Queue
- Worker Recovery

---

## Observability

- Metrics
- Structured Logs
- Distributed Traces
- Correlation IDs
- Waterfall Analysis

---

## Reliability

- Heartbeats
- Node Failure
- Recovery
- Rate Limiting
- Resource Monitoring

---

# 🎨 UI Design

The interface is inspired by modern infrastructure dashboards.

Design influences include:

- Grafana
- Datadog
- Jaeger
- RedisInsight
- Kubernetes Dashboard

Visual characteristics:

- Glassmorphism
- Dark theme
- Neon accent colors
- Live telemetry
- Animated infrastructure visuals
- Monospace terminal aesthetics
- Interactive topology diagrams

---

# 🛠️ Tech Stack

## Frontend

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- TanStack Query
- Tailwind CSS v4
- Recharts
- Radix UI
- Lucide React

---

## State Management

- Custom Event Bus
- useSyncExternalStore
- Singleton Simulation Engine

---

## Tooling

- Vite
- Bun
- ESLint
- Prettier

---

## Deployment

Compatible with:

- Cloudflare Workers

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/<your-username>/InfraMesh.git

cd InfraMesh
```

---

## Install dependencies

Using Bun

```bash
bun install
```

or npm

```bash
npm install
```

---

## Start development server

```bash
bun run dev
```

or

```bash
npm run dev
```

---

## Production build

```bash
bun run build
```

or

```bash
npm run build
```

---

# 💡 Why InfraMesh?

Most portfolio projects demonstrate CRUD operations.

InfraMesh explores an entirely different problem space.

It focuses on:

- Distributed systems
- Infrastructure visualization
- Event-driven architecture
- State synchronization
- Observability
- Interactive learning

Instead of consuming backend APIs, InfraMesh embeds an infrastructure simulation engine directly into the frontend, allowing users to experiment with distributed systems concepts in real time.

---

# 🚧 Future Improvements

Potential enhancements include:

- Kubernetes cluster simulation
- Service discovery
- API Gateway
- Circuit breakers
- Distributed locks
- Gossip protocol
- Leader election
- Network partition simulation
- Multi-user collaborative clusters
- OpenTelemetry export
- Persistent telemetry storage
- Alert manager
- WebSocket synchronization

---

# 📚 Inspiration

InfraMesh is inspired by the architecture and tooling used in modern distributed systems, including:

- Redis
- Kafka
- RabbitMQ
- Grafana
- Datadog
- Jaeger
- OpenTelemetry
- Kubernetes

The project does **not** reimplement these systems. Instead, it provides an educational simulation of many of the concepts they employ.

---

# 👨‍💻 Author

**Ashish**

GitHub: **Ashishworks**

---

# 📄 License

This project is licensed under the **MIT License**.

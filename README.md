# InfraMesh

> Interactive distributed systems and observability playground built with React, TanStack Start, and a custom event-driven in-browser simulation engine.

---

## Overview

InfraMesh is a realtime infrastructure simulation platform that visualizes how distributed systems behave internally.

The project simulates:

* Redis-style distributed cache clusters
* Kafka/RabbitMQ-style queue systems
* Worker orchestration
* Pub/Sub systems
* Distributed tracing
* Metrics pipelines
* Structured logging
* Node health monitoring
* Replication and failover
* Chaos engineering concepts

All infrastructure behavior is simulated entirely inside the browser using a custom event-driven engine.

InfraMesh is designed as:

* A distributed systems playground
* An observability learning platform
* A realtime infrastructure visualization tool
* A portfolio-grade systems engineering project

---

# Features

## Distributed Cache Cluster

Redis-inspired distributed cache simulation featuring:

* Consistent hashing
* Primary/replica topology
* Key distribution
* LRU eviction
* TTL expiration
* Cache hit/miss tracking
* Memory monitoring
* Pub/Sub channels
* Replica failover simulation

Supported commands:

```bash
SET user:1 alice
GET user:1
DEL user:1
EXISTS user:1
TTL user:1
KEYS *
PING
PUBLISH events hello
```

---

## Queue & Worker System

Kafka/RabbitMQ-inspired asynchronous queue system.

Features:

* Job enqueueing
* Worker pools
* Retry logic
* Delayed jobs
* Priority queues
* Dead Letter Queue (DLQ)
* Worker crash/recovery simulation

Queue flow:

```text
Producer → Queue → Worker → Retry → DLQ
```

---

## Realtime Observability Dashboards

InfraMesh includes the 3 pillars of observability.

### Metrics

Live telemetry charts including:

* Requests/sec
* P95 latency
* Cache hit ratio
* Queue depth
* CPU usage
* Memory usage

### Logs

Structured centralized logging system with:

* Severity filtering
* Search
* Service-based logs
* Live log streaming

### Traces

Jaeger-style distributed tracing with:

* Waterfall timelines
* Span visualization
* Request IDs
* Service latency analysis

---

## Cluster Visualization

Interactive distributed topology visualizer.

Features:

* Consistent hash ring
* Node ownership
* Replica relationships
* Live node status
* Failover simulation
* Key placement visualization

---

## Node Health Monitoring

Infrastructure health dashboard featuring:

* Heartbeats
* CPU usage
* Memory pressure
* Eviction tracking
* Node lifecycle simulation
* Chaos engineering controls

---

# Tech Stack

## Frontend

* React 19
* TypeScript
* TanStack Start
* TanStack Router
* TanStack Query
* TailwindCSS
* Recharts
* Radix UI
* Lucide React

## Tooling

* Vite
* Bun
* ESLint
* Prettier

## Deployment

* Cloudflare Workers compatible

---

# Architecture

```text
                React Dashboard
                        │
                  TanStack Router
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    Metrics          Queue           Tracing
       │                │                │
       └────────────────┼────────────────┘
                        │
                   useEngine()
                        │
                InfraMeshEngine
                        │
 ┌──────────────┬───────┼────────┬──────────────┐
 │              │                │              │
Cache         Queue            Logs          Traces
 │              │                │              │
Replicas      Workers         Metrics       Spans
 │              │                │              │
Pub/Sub       DLQ           Telemetry     Waterfalls
```

---

# Project Structure

```text
src
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
│   ├── error-page.ts
│   └── utils.ts
│
├── routes
│   ├── index.tsx
│   ├── cache.tsx
│   ├── queue.tsx
│   ├── metrics.tsx
│   ├── logs.tsx
│   ├── tracing.tsx
│   ├── cluster.tsx
│   └── health.tsx
│
├── router.tsx
├── start.ts
└── styles.css
```

---

# Core Engine

The heart of InfraMesh is:

```text
src/lib/inframesh/engine.ts
```

This custom simulation engine maintains centralized in-memory distributed systems state.

The engine simulates:

* Distributed cache nodes
* Queue orchestration
* Worker processing
* Metrics generation
* Structured logs
* Distributed tracing
* Replication systems
* Node heartbeats
* Failover behavior

The engine follows an event-driven reactive architecture.

---

# State Management

InfraMesh uses a custom event-driven state system.

Flow:

```text
Engine State
     ↓
emit()
     ↓
useSyncExternalStore
     ↓
React Re-render
     ↓
Realtime Dashboard Updates
```

---

# Routes

| Route      | Purpose                            |
| ---------- | ---------------------------------- |
| `/`        | System overview dashboard          |
| `/cache`   | Redis-style cache simulator        |
| `/queue`   | Queue & worker orchestration       |
| `/cluster` | Distributed topology visualization |
| `/metrics` | Live telemetry charts              |
| `/logs`    | Structured centralized logs        |
| `/tracing` | Distributed request tracing        |
| `/health`  | Node health & failover controls    |

---

# Design Philosophy

InfraMesh is not a traditional CRUD application.

Instead of:

```text
Frontend → Backend API → Database
```

InfraMesh behaves like:

```text
Frontend UI
      +
Embedded Infrastructure Simulation Engine
```

The application acts like a realtime distributed systems sandbox running entirely in browser memory.

---

# Distributed Systems Concepts Demonstrated

## Caching

* Consistent hashing
* Replication
* LRU eviction
* TTL expiration
* Key ownership

## Queueing

* Worker orchestration
* Retries
* Delayed jobs
* Priorities
* Dead Letter Queues

## Observability

* Metrics
* Structured logs
* Distributed tracing
* Correlation IDs
* Waterfall analysis

## Reliability

* Node health
* Heartbeats
* Failover
* Chaos engineering
* Recovery systems

---

# Running Locally

## Install Dependencies

Using Bun:

```bash
bun install
```

Or npm:

```bash
npm install
```

---

## Start Development Server

```bash
bun run dev
```

Or:

```bash
npm run dev
```

---

## Build for Production

```bash
bun run build
```

Or:

```bash
npm run build
```

---

# UI & Design

InfraMesh uses a futuristic observability aesthetic inspired by:

* Grafana
* Datadog
* RedisInsight
* Jaeger
* Kubernetes dashboards

Visual style includes:

* Dark glassmorphism UI
* Neon cyan/violet accents
* Animated telemetry
* Cyberpunk observability design
* Monospace infrastructure visuals

---

# Why This Project Exists

InfraMesh was built to:

* Explore distributed systems visually
* Learn observability concepts interactively
* Simulate infrastructure behavior in realtime
* Demonstrate advanced frontend architecture
* Create a portfolio-grade systems engineering project

---

# Future Improvements

Potential future enhancements:

* WebSocket-based realtime sync
* Multi-user collaborative clusters
* Kubernetes simulation
* API gateway rate limiting
* Persistent telemetry storage
* OpenTelemetry integration
* Alerting system
* Dockerized backend mode

---

# Inspiration

InfraMesh draws inspiration from:

* Redis
* Kafka
* Grafana
* Datadog
* Jaeger
* OpenTelemetry
* Kubernetes dashboards

---

# Author

Built by Ashish.

---

# License

MIT License

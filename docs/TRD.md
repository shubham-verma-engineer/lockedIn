# 2. Technical Requirement Document & System Architecture

## 2.1 Non-Functional Requirements (NFRs)

* **Throughput Capacity:** The background dispatch worker pool must confidently execute and route up to **5,000 unique push notifications per second** during critical local time zones.
* **Latency Boundary Constraints:** API endpoints handling core check-in operations must return status responses inside a bound of **P99 < 150ms**.
* **Concurrency Isolation:** The system must guarantee complete protection against multi-device race conditions when users execute simultaneous logging calls.

## 2.2 Core Architectural Ingestion Topology

```text
[ Mobile Clients (iOS / Android) ] 
 │ ▲
 (REST/HTTPS) (Push Notifications via APNs / FCM)
 ▼ │
[ API Gateway Layer (Routing, Rate-Limiting, JWT Auth) ]
 │
 ├──> [ Main App Service (User Signups, Profile Configs, Habit CRUD) ]
 │ │
 │ (Writes to)
 │ ▼
 │ [(SQL DB) AWS RDS PostgreSQL Instance (State Repository)]
 │ ▲
 │ (Polled by)
 │ │
 └──> [ High-Speed Cron Engine Scheduler Service (Runs Every 60s) ]
 │
 (Enqueues Payload)
 ▼
 [ High-Speed Message Queue Broker: Redis / AWS SQS ]
 │
 (Dequeues Task / Multi-Threaded Workers)
 ▼
 [ Automated Worker Fleets (Notification Consumers) ]
 │
 ├──> [ Local Template Compiler Engine (Phase 1 Base) ]
 └──> [ Deep Gen-AI LLM Prompt Service (Phase 2 Premium Upgrade) ]
```

## 2.3 Mathematical Timezone Logic Parsing Formula

To eliminate temporal offset drift or midnight boundary penalties for users logging late-night activities, the system enforces an unyielding **Night-Owl Grace Period Window** (\(W_g = 3\text{ hours}\)). 

When an action event occurs, the engine reads system UTC time (\(T_{\text{utc}}\)), maps it to the designated user's IANA location timezone profile context (\(T_{\text{local}}\)), and calculates the true operational calendar day using the following relational boundary formula:

\[T_{\text{logical}} = T_{\text{local}} - W_g\]

This guarantees that an entry completed at 01:30 AM local time on Tuesday is logically credited to Monday's streak requirement ledger, mitigating frustration and app abandonment.

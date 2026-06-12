# LockedIn Platform - Production Agile Sprint Task Tickets

## Document Control & Metadata
- **Title:** Production Agile Sprint Task Tickets & Backlog Catalog
- **Status:** Approved / Sprint 3 Planning Ready
- **Version:** v2.0.0
- **Authors:** Scrum Master & Product Owner
- **Date:** June 2026

---

## 1. Active Sprint Tickets (Sprint 2 - Core Engine)

### **Ref: STK-201** | Epic: Core Motivation Engine Pipeline | Priority: Blocker

* **Title:** Construct Polymorphic Interface Factory Router Layout for Strategy Motivation Engines
* **Technical Scope Assignment:**
  - Build the structural Java core architecture layout including the foundational `MotivationEngine` interface and record objects. 
  - Standardize routing: Free tier accounts must pull strings from the template compiler, while Premium tier requests route properties to the dynamic OpenAI API adapter.
  - Integrate validation in [MotivationEngineRouter.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/MotivationEngineRouter.java).

#### **Rigorous Acceptance Criteria:**
1. Given a motivation context containing a `'FREE'` subscription tier token, the strategy factory must return a string parsed by the local static template compiler maps.
2. Given a motivation context containing a `'PREMIUM'` subscriber layer, the factory routing algorithm must cleanly dispatch user variables to the dynamic LLM network client.
3. The engine setup must throw an explicit `IllegalArgumentException` with the logged text message `Explicit runtime anomaly: Unmapped character archetype profile` if an unmapped archetype (not in Casual, Professional, Strict, 18+ Abusive, Abusive) is processed.

---

### **Ref: STK-202** | Epic: Asynchronous Time Evaluation | Priority: High

* **Title:** Implement Night-Owl Grace Period Offset Window Processing inside Core Time Evaluation Layer
* **Technical Scope Assignment:**
  - Code the core Java timezone transformation class [TimezoneEvaluator.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/TimezoneEvaluator.java) responsible for converting UTC timestamps into user local logical activity calendar dates.
  - Incorporate the fixed 3-hour backward grace period variable ($W_g = 3\text{ hours}$).

#### **Rigorous Acceptance Criteria:**
1. An active logging API request arriving at 01:30 AM local time on a Tuesday calendar day must be written into PostgreSQL storage records under a Monday date identifier.
2. An active logging API request arriving at 04:15 AM local time on a Tuesday calendar day must evaluate under a Tuesday date identifier, marking Monday as missed.
3. If an invalid, null, or empty timezone string (e.g. `""`, `"Invalid/Zone"`) is passed, the evaluator must log a warning and fall back to UTC timezone coordinates to prevent execution layer collapse.

---

## 2. New Backlog Feature Tickets (Sprint 3 - Social & Integrations)

### **Ref: STK-301** | Epic: Group Accountability Pools | Priority: High

* **Title:** Design Shared Group Freeze Token Pool DDL and Transactional Processing
* **Technical Scope Assignment:**
  - Update the database schema to support shared "Group Pools" where friends can combine their daily freeze tokens.
  - Create table `group_accountability_pools` (group_id PK, available_group_freezes INT CHECK >= 0).
  - Implement a Spring/Java transaction service method `applyGroupStreakFreeze` that executes a row-level pessimistic lock (`SELECT FOR UPDATE`) on the group's balance, decrements it by 1, and inserts a `FROZEN` state record into `customer_activity_logs`.

#### **Rigorous Acceptance Criteria:**
1. Transaction must run under `SERIALIZABLE` or `READ COMMITTED` isolation, preventing double-depletion when multiple users in a group trigger skips simultaneously.
2. If the group pool has 0 available freeze tokens, the operation must abort, rollback the transaction, and return `false`.
3. System must log an audit trail entry detailing which specific user consumed the group's freeze token.

---

### **Ref: STK-302** | Epic: Smartwatch Integrations | Priority: Medium

* **Title:** Implement Google Health Connect & Apple HealthKit Passive Sync Ingestion Adapter
* **Technical Scope Assignment:**
  - Create client-side background sync jobs that check for daily fitness goals (e.g. 10,000 steps, sleep target).
  - Develop a REST API integration handler on the main app service `/api/v1/sync/health` to receive data bundles and trigger check-ins automatically.

#### **Rigorous Acceptance Criteria:**
1. Passive sync events must successfully parse the client's device timezone and map the activity to the correct logical calendar date applying the Night-Owl Grace Period ($W_g = 3\text{ hours}$).
2. Ingested logs must be marked with `execution_state = 'COMPLETED'` and source identifier metadata in `customer_activity_logs` database records.
3. Prevent duplicate check-ins if the user has already manually logged their habit target for that calendar day (database constraint `unique_streak_per_day` must handle this gracefully without server crashes).

---

### **Ref: STK-303** | Epic: Custom Voice Synthesis | Priority: Low

* **Title:** Implement Premium AI Voice-Cloning Ingestion and Synthesizer Interface
* **Technical Scope Assignment:**
  - Integrate a third-party audio generation API (e.g., ElevenLabs) inside the notification delivery pipeline.
  - Implement a user configuration controller to store 30-second audio voice cloning files.
  - Synthesize custom audio files dynamically containing the generated roasts for premium notification delivery.

#### **Rigorous Acceptance Criteria:**
1. If the voice synthesis API returns an error or rate limit, the delivery pipeline must gracefully catch the exception, write a diagnostic error log, and fallback to delivering a standard text push notification.
2. Uploaded audio snippets must be stored securely in private AWS S3 buckets with timed pre-signed URL access control keys.

# LockedIn Platform - Sprint Tracking Dashboard & Task Hub

## 📊 Sprint Status Board

### Sprint 2: Core Execution Engine (Past Release)
- **Status:** `RELEASED`
- **Progress:** `[████████████████████] 100%` (2/2 Tickets Resolved)
- **Target Version:** `v1.0.0-rc1`

### Sprint 3: Social & Wearables Integration (Past Release)
- **Status:** `RELEASED`
- **Progress:** `[████████████████████] 100%` (3/3 Tickets Resolved)
- **Target Version:** `v1.1.0`

### Sprint 4: Production Profiles & API Integration (Current Release)
- **Status:** `RELEASED`
- **Progress:** `[████████████████████] 100%` (1/1 Tickets Resolved)
- **Target Version:** `v1.2.0`

---

## 📋 Master Task Matrix

| Ticket ID | Epic | Task Title | Priority | Status | Implemented Code / File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STK-201** | Core Engine | [Polymorphic Strategy Factory Router](#stk-201) | `BLOCKER` | 🟢 `DONE` | [MotivationEngineRouter.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/MotivationEngineRouter.java) |
| **STK-202** | Timezone | [Night-Owl Timezone Grace Period](#stk-202) | `HIGH` | 🟢 `DONE` | [TimezoneEvaluator.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/TimezoneEvaluator.java) |
| **STK-301** | Social | [Shared Group Freeze Token Pool](#stk-301) | `HIGH` | 🟢 `DONE` | [GroupStreakFreezeManager.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/GroupStreakFreezeManager.java) |
| **STK-302** | Sync | [Health Connect & HealthKit Ingestion](#stk-302) | `MEDIUM` | 🟢 `DONE` | [LockedInController.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/controller/LockedInController.java#L153-L192) |
| **STK-303** | Premium | [AI Voice-Cloning Synthesizer](#stk-303) | `LOW` | 🟢 `DONE` | [VoiceCloningSynthesizer.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/VoiceCloningSynthesizer.java) |
| **STK-401** | Production | [Production Profiles & ElevenLabs API Integration](#stk-401) | `HIGH` | 🟢 `DONE` | [ElevenLabsClient.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/client/ElevenLabsClient.java) |


---

## 🛠️ Sprint 2: Core Engine (Completed)

### **STK-201** | Polymorphic Strategy Factory Router
> **Epic:** Core Motivation Engine Pipeline  
> **Status:** 🟢 `DONE` | **Priority:** `BLOCKER`  
> **Target Files:** [MotivationEngineRouter.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/MotivationEngineRouter.java), [AiMotivationEngine.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/AiMotivationEngine.java)

#### 📝 Description & Technical Scope
Build the polymorphic core strategy routing engine that dynamically matches the user's subscription tier. Free users receive template-based responses, while Premium users receive fully customized Gen-AI LLM-generated roasts.

#### ☑️ Acceptance Criteria & Verification
* [x] Route users to the template engine when subscription is `'FREE'`.
* [x] Route users to the Gen-AI engine when subscription is `'PREMIUM'`.
* [x] Throw an explicit `IllegalArgumentException` with the logged text message `Explicit runtime anomaly: Unmapped character archetype profile` if an unmapped archetype is processed.

---

### **STK-202** | Night-Owl Timezone Grace Period
> **Epic:** Asynchronous Time Evaluation  
> **Status:** 🟢 `DONE` | **Priority:** `HIGH`  
> **Target Files:** [TimezoneEvaluator.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/TimezoneEvaluator.java)

#### 📝 Description & Technical Scope
Code the core timezone translation logic that maps physical UTC server timestamps into user local logical activity dates, incorporating the 3-hour backward grace period ($W_g = 3\text{ hours}$).

#### ☑️ Acceptance Criteria & Verification
* [x] Convert 01:30 AM local time Tuesday requests to the logical calendar date **Monday**.
* [x] Convert 04:15 AM local time Tuesday requests to the logical calendar date **Tuesday**.
* [x] Fall back to UTC timezone coordinates if input IANA timezone string is empty or invalid.

---

## 🔮 Sprint 3: Social & Wearables (Backlog)

### **STK-301** | Shared Group Freeze Token Pool
> **Epic:** Group Accountability Circles  
> **Status:** 🟢 `DONE` | **Priority:** `HIGH`  
> **Target Files:** [GroupStreakFreezeManager.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/GroupStreakFreezeManager.java)

#### 📝 Description & Technical Scope
Update the database schema to support group tables and implement row-level pessimistic locking (`SELECT FOR UPDATE`) on the group's balance to deduct freeze tokens atomically without race conditions.

#### ☑️ Acceptance Criteria & Verification
* [x] Prevent double-spends when multiple users trigger skips at the exact same moment.
* [x] Abort transaction and return `false` if group pool available freeze tokens is 0.
* [x] Record audit logs detailing which user consumed the group's token.

---

### **STK-302** | Health Connect & HealthKit Ingestion
> **Epic:** Smartwatch Wearables Sync  
> **Status:** 🟢 `DONE` | **Priority:** `MEDIUM`  
> **Target Files:** [LockedInController.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/controller/LockedInController.java)

#### 📝 Description & Technical Scope
Develop a passive ingestion adapter to sync steps and sleep records from devices and resolve check-ins on the backend.

#### ☑️ Acceptance Criteria & Verification
* [x] Parse client device timezones and map check-ins using the Night-Owl Grace Period ($W_g = 3$).
* [x] Reject duplicate check-ins on the same calendar day gracefully without server errors.

---

### **STK-303** | AI Voice-Cloning Synthesizer
> **Epic:** Premium Customization  
> **Status:** ⚪ `BACKLOG` | **Priority:** `LOW`  
> **Target Files:** *New Audio Synthesis Provider (STK-303)*

#### 📝 Description & Technical Scope
Integrate an external audio synthesis API (e.g., ElevenLabs) to synthesize premium voice roasts based on uploaded user audio clips.

#### ☑️ Acceptance Criteria & Verification
* [x] Fallback to standard text push notifications if the voice synthesis API fails.
* [x] Store audio clone snippets securely using pre-signed secure access tokens.

---

## 🚀 Sprint 4: Production Profiles & API Integration (Completed)

### **STK-401** | Production Profiles & ElevenLabs API Integration
> **Epic:** Production Readiness & Integrations  
> **Status:** 🟢 `DONE` | **Priority:** `HIGH`  
> **Target Files:** [ElevenLabsClient.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/client/ElevenLabsClient.java), [application-prod.properties](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/resources/application-prod.properties), [LockedInController.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/controller/LockedInController.java)

#### 📝 Description & Technical Scope
Set up environment profiles for dev/prod database routing and replace simulated ElevenLabs calls with real HTTP client calls, securing files via a pre-signed local streaming endpoint.

#### ☑️ Acceptance Criteria & Verification
* [x] Configure profile application properties (dev H2, prod PostgreSQL with env mappings).
* [x] Implement ElevenLabsClient with API key and URL configurations.
* [x] Expose GET `/api/motivation/audio/{clipId}` streaming endpoint with SHA-256 signatures and expiration controls.
* [x] Implement comprehensive integration test verification validating token validation, expiration, and audio stream response.


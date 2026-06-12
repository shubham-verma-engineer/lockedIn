# Implementation Plan: Health Connect & HealthKit Ingestion

| Field | Value |
|---|---|
| **Plan #** | 0008 |
| **Status** | Done |
| **Branch** | `feature/health-sync-ingestion` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

## 1. Understanding

The goal is to develop a passive health ingestion adapter (STK-302) that syncs steps and sleep data from client smartwatch integrations (Google Health Connect / Apple HealthKit) to automatically resolve check-ins.

### Requirements & Constraints:
* Parse client device timezones and map check-ins using the **Night-Owl Grace Period** ($W_g = 3\text{ hours}$). Late check-ins up to 03:00 AM local time are logically credited to the previous calendar day.
* Reject duplicate check-ins on the same calendar day gracefully without server errors.
* Threshold validation: A check-in is resolved if steps are $\ge 5000$ or sleep minutes are $\ge 360$ (6 hours).
* Standard SQL queries compatible with both H2 (local/test) and PostgreSQL (production).

---

## 2. Approach

1. **New Request Record (`HealthSyncRequest.java`)**:
   - Holds account ID, streak ID, steps (optional Integer), sleep minutes (optional Integer), timestamp UTC, and IANA timezone ID.
2. **REST Sync Endpoint (`HealthSyncController.java` or `LockedInController.java`)**:
   - Expose `POST /api/sync/health` accepting `HealthSyncRequest`.
   - Resolve the local logical calendar date using the existing `TimezoneEvaluator` (incorporating $W_g = 3\text{ hours}$).
   - Evaluate steps/sleep targets. If targets are met:
     - Check if a check-in log already exists in `customer_activity_logs` for that logical calendar date and streak ID.
     - If it does, return `200 OK` or a graceful body response (e.g. `"Already checked in for logical date: ..."`).
     - If it doesn't, insert the completed activity log and increment the user's streak.
     - If targets are not met, return `200 OK` with a message indicating targets were not met.

---

## 3. Phases

### Phase A — Request Payload & Endpoint Infrastructure · Status: Done
- **Does:** Create the `HealthSyncRequest` record and set up controller routing.
- **Verify:** Endpoint compiles and responds with mock responses.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/controller/HealthSyncRequest.java` | Ingestion request record (new) |
  | `src/main/java/com/lockedin/controller/LockedInController.java` | Added /api/sync/health endpoint handler (modified) |

### Phase B — Health Metric Validation & Grace Period Integration · Status: Done
- **Does:** Integrate metric checks (steps $\ge 5000$, sleep minutes $\ge 360$) and timezone translation via `TimezoneEvaluator`.
- **Verify:** Check-ins are correctly mapped to logical dates and database check-ins run cleanly.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/controller/LockedInController.java` | Core logic to validate metrics and log database check-ins (modified) |

### Phase C — Integration Verification · Status: Done
- **Does:** Write full integration tests covering threshold rules, grace period bounds, and duplicate check-in validation.
- **Verify:** Run `mvn clean test` successfully.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/LockedInApplicationTests.java` | Add test cases for health connect ingestion flows (modified) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Duplicate key exceptions on duplicate sync | Perform a count check first and handle the already checked-in state gracefully. |

---

## 5. Out of scope / deferred

- Complete client authentication/JWT mapping (uses the same simple request payload structures as other existing test controller endpoints).

---

## 6. Verification

- Run Maven integration tests checking standard check-in mapping, thresholds, and grace period dates.

---

## 7. Rollback

- Revert commits on branch `feature/health-sync-ingestion`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial draft for health Connect/HealthKit ingestion sync. |

---

## 9. Commits / PR

- Commit/PR: n/a

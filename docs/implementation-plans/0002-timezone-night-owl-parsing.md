# Implementation Plan: Timezone Night-Owl Processing

| Field | Value |
|---|---|
| **Plan #** | 0002 |
| **Status** | Done |
| **Branch** | `feature/night-owl-timezone` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to implement **STK-202**: "Implement Night-Owl Grace Period Offset Window Processing inside Core Time Evaluation Layer". This is the logic responsible for converting event times from physical server UTC into the user's local timezone operational date, taking into account a fixed 3-hour backward grace period.

### Requirements:
- Translate UTC instants to user local ZonedDateTimes using IANA timezone names (e.g. `America/Los_Angeles`, `Asia/Kolkata`).
- Apply a fixed backward grace period \(W_g = 3\text{ hours}\) to find the logical calendar date.
- **Criteria 1**: An active logging API request incoming at 01:30 AM local time on a Tuesday calendar day must be written into PostgreSQL storage records under a Monday date identifier.
- **Criteria 2**: An active logging API request incoming at 04:15 AM local time on a Tuesday calendar day must evaluate under a Tuesday date identifier, marking Monday as missed.
- **Criteria 3**: Clean evaluation of historical IANA string identifiers using native Java `ZoneId` features without execution layer collapse (if timezone is invalid, fallback to UTC and log a warning).

---

## 2. Approach

1. **Create `TimezoneEvaluator` class**: Place under `com.lockedin.engine`.
2. **Grace Period Calculation**: Convert UTC instant to user's local timezone. Subtract 3 hours. Return the resulting date as the logical local date.
3. **Safe Timezone Resolution**: Catch `DateTimeException` and other runtime errors during `ZoneId.of(timezoneId)` compilation, logging a warning and falling back to a default timezone (UTC) to prevent execution collapse.
4. **Unit Tests**: Test the specific boundary cases (01:30 AM and 04:15 AM on Tuesday) and the invalid/historical timezone safety fallback.

---

## 3. Phases

### Phase 1 — Core Timezone Evaluator Implementation · Status: Done
- **Does:** Implement `TimezoneEvaluator` under package `com.lockedin.engine`.
- **Verify:** Successful compilation of the new Java class.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/TimezoneEvaluator.java` | Core logic for night-owl timezone processing (new) |

### Phase 2 — Unit Testing & Verification · Status: Done
- **Does:** Write unit tests to check both edge cases (01:30 AM -> Monday, 04:15 AM -> Tuesday) and safe fallback handling.
- **Verify:** Run Maven test suite and ensure all tests pass cleanly.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/engine/TimezoneEvaluatorTest.java` | JUnit tests validating timezone offsets and boundary cases (new) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Null timezone or null timestamp input | Throw explicit `IllegalArgumentException` on null timestamp. Handle null/empty timezone strings via safe fallback to UTC. |
| Timezone ID database corruption or outdated historical zone name | Wrap `ZoneId.of(...)` inside a try-catch block to gracefully fall back to UTC instead of throwing system-crashing runtime exceptions. |

---

## 5. Out of scope / deferred

- Integration with database persistence or JPA/JDBC layers (this is pure timezone evaluation middleware, database mapping will be handled by the database repository layer).

---

## 6. Verification

1. **JUnit Unit Tests**:
   - `testGetLogicalDateWithinGracePeriod` (01:30 AM local time Tuesday -> Monday)
   - `testGetLogicalDateOutsideGracePeriod` (04:15 AM local time Tuesday -> Tuesday)
   - `testInvalidTimezoneFallback` (outdated or corrupt zone name -> fallback to UTC, logs warning)
   - `testNullOrEmptyTimezoneFallback` (null or empty string -> fallback to UTC)
2. **Local Compilation Check**:
   - Run `mvn test` to confirm compilation and clean execution of all tests.

---

## 7. Rollback

- Revert commits on the `feature/night-owl-timezone` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial implementation plan for STK-202. |

---

## 9. Commits / PR

- Commit/PR: n/a

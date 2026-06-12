# Implementation Plan: Shared Group Freeze Token Pool

| Field | Value |
|---|---|
| **Plan #** | 0007 |
| **Status** | Draft |
| **Branch** | `feature/group-freeze-pool` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

## 1. Understanding

The goal is to implement a **Shared Group Freeze Token Pool** (STK-301) to support group habit-tracking protection. 
When a group member misses their check-in window, a freeze token is consumed atomically from the group's pooled balance instead of their personal vault, protecting their individual streak.

### Requirements & Constraints:
* Update the database schema to support group vaults, memberships, and token consumption audit logs.
* Implement row-level pessimistic locking (`SELECT FOR UPDATE`) on the group's pooled balance to ensure thread-safety and prevent double-spends under high concurrency.
* The transaction must abort and return `false` if the group pool balance is depleted (0 available tokens).
* Detailed audit logs must record which user consumed the group's token, the specific date, and the streak.
* The backend must expose a REST endpoint to apply this group freeze.
* Standard SQL queries compatible with both H2 (local/test) and PostgreSQL (production) must be used.

---

## 2. Approach

1. **Database Schema updates (`schema.sql`)**:
   - `group_inventory_vault`: Holds group ID and available token balance with a floor limit `>= 0`.
   - `group_memberships`: Maps user/account IDs to group IDs.
   - `group_freeze_audit_logs`: Audit trail mapping which user and streak consumed a group token for a specific logical date.
2. **Transaction Management (`GroupStreakFreezeManager.java`)**:
   - Resolve `group_id` using user `account_id` from memberships.
   - Begin transaction, pessimistically lock the group vault row using `SELECT FOR UPDATE`, and verify token availability.
   - Decrement group pool balance, write to `group_freeze_audit_logs`, insert `FROZEN` execution state into `customer_activity_logs`, and commit.
3. **REST Endpoints (`LockedInController.java`)**:
   - Expose `POST /api/streak/freeze/group` accepting a JSON payload with `accountId`, `streakId`, and `missedDate`.
   - Provide fallback seeding for local test cases.
4. **Integration Testing**:
   - Write concurrent test cases to assert double-spends are prevented and database updates are accurate.

---

## 3. Phases

### Phase A — Database Schema Extensions · Status: Pending
- **Does:** Extend `schema.sql` to include `group_inventory_vault`, `group_memberships`, and `group_freeze_audit_logs`.
- **Verify:** Run database initialization check.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/resources/schema.sql` | Added group vault, membership, and audit log tables (modified) |

### Phase B — Service Layer & Concurrency Control · Status: Pending
- **Does:** Build `GroupStreakFreezeManager` using pessimistic row locks.
- **Verify:** Compile cleanly and run transaction boundary unit checks.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/GroupStreakFreezeManager.java` | Atomic group-level freeze manager with SELECT FOR UPDATE (new) |

### Phase C — REST Endpoints & Configurations · Status: Pending
- **Does:** Configure DI beans and expose endpoint `/api/streak/freeze/group` in controller.
- **Verify:** Verify the endpoint compiles and routes correctly.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/config/AppConfig.java` | Configured GroupStreakFreezeManager bean (modified) |
  | `src/main/java/com/lockedin/controller/LockedInController.java` | Added /api/streak/freeze/group endpoint (modified) |

### Phase D — Integration Verification · Status: Pending
- **Does:** Write full integration tests covering group setups, freeze token consumption, and double-spend race conditions.
- **Verify:** Run `mvn clean test` successfully.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/LockedInApplicationTests.java` | Add group integration flow tests (modified) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Concurrency double-spend race condition | Use standard SQL row-level pessimistic locking (`FOR UPDATE`) on the group's balance record inside a serializable/transactional block. |
| Incompatible SQL syntax on H2 | Use standard ANSI SQL that is fully supported by both H2 and PostgreSQL. |

---

## 5. Out of scope / deferred

- Group creation/management REST endpoints (creating groups, joining/leaving groups) are out of scope. Seed data is assumed.

---

## 6. Verification

- Run Spring Boot integration test covering single and concurrent group freeze requests and asserting database balances and audit log entries.

---

## 7. Rollback

- Revert the git commits and drop the new tables from database.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial plan for group freeze pool implementation. |

---

## 9. Commits / PR

- Commit/PR: n/a

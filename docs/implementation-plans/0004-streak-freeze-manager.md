# Implementation Plan: Streak Freeze Manager (Pessimistic Locking)

| Field | Value |
|---|---|
| **Plan #** | 0004 |
| **Status** | Done |
| **Branch** | `feature/streak-freeze-manager` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to implement **`StreakFreezeManager`** as described in low-level blueprint section 4.3. This manager handles the transaction critical path when a user skips a habit deadline, consuming an available freeze token from their vault to protect their current active streak.

### Requirements:
- Create `StreakFreezeManager` in package `com.lockedin.engine`.
- Inject `javax.sql.DataSource`.
- Method `applyAtomicStreakFreeze(String userId, String streakId, java.sql.Date targetMissedDate)`:
  - Start transaction (`conn.setAutoCommit(false)`).
  - Use pessimistic locking (`SELECT ... FOR UPDATE`) on table `account_inventory_vault` for the `userId`.
  - Validate that the vault has `available_freeze_tokens > 0`. If not, rollback and return `false`.
  - Decrement `available_freeze_tokens` by 1.
  - Insert a `FROZEN` execution state activity record into table `customer_activity_logs`.
  - Commit transaction and return `true`.
  - Gracefully handle `SQLException` (rollback, return `false`, close connection safely).

---

## 2. Approach

1. **StreakFreezeManager Class**: Place in `com.lockedin.engine` package and inject `DataSource`.
2. **Transaction Management**: Acquire connection from `DataSource`. Run `conn.setAutoCommit(false)` to start transaction explicitly.
3. **Pessimistic Locking Query**:
   ```sql
   SELECT available_freeze_tokens FROM account_inventory_vault WHERE account_id = ? FOR UPDATE;
   ```
4. **Token Deduct Query**:
   ```sql
   UPDATE account_inventory_vault SET available_freeze_tokens = available_freeze_tokens - 1 WHERE account_id = ?;
   ```
5. **Activity Logging Insert**:
   ```sql
   INSERT INTO customer_activity_logs (log_id, streak_id, resolved_calendar_date, execution_state, server_utc_timestamp) 
   VALUES (?, ?, ?, 'FROZEN', CURRENT_TIMESTAMP);
   ```
6. **Error Handling**: Use Nested `try-catch-finally` to ensure rollback is executed on exception and the database connection is closed.
7. **Testing**: Write unit tests mocking JDBC calls. Stub query responses to verify successful token reduction, failure on zero tokens, and rollback behavior on SQL database exception.

---

## 3. Phases

### Phase 1 — Streak Freeze Manager Core Logic · Status: Done
- **Does:** Implement `StreakFreezeManager` under package `com.lockedin.engine`.
- **Verify:** Compile class and check structure.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/StreakFreezeManager.java` | Main transaction worker applying atomic freezes (new) |

### Phase 2 — Mock Transaction Verification Testing · Status: Done
- **Does:** Write unit tests using JUnit & Mockito mocking JDBC interfaces (`DataSource`, `Connection`, `PreparedStatement`, `ResultSet`) to assert transactions commit or rollback correctly.
- **Verify:** Run Maven test suite and check all tests pass.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/engine/StreakFreezeManagerTest.java` | Unit tests asserting transaction commits, rollbacks, and boundary checks (new) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Deadlock during pessimistic lock (`FOR UPDATE`) | Limit scope of locked rows by locking solely on the specific user ID. Ensure transaction execution is fast to avoid long lock hold times. |
| Connection resource leaks | Always close the database connection in a `finally` block to prevent socket pool depletion. |

---

## 5. Out of scope / deferred

- Connection pool configurations (assumes connection properties are managed externally by container `DataSource`).

---

## 6. Verification

1. **JUnit Unit Tests**:
   - `testApplyFreezeSucceeds` (happy path: tokens exist, deducted, logs inserted, transaction committed).
   - `testApplyFreezeFailsIfNoTokens` (boundary check: token count is 0, transaction rolled back, returns false).
   - `testApplyFreezeFailsIfNoRecord` (boundary check: user does not exist in vault, transaction rolled back, returns false).
   - `testApplyFreezeRollsBackOnSqlException` (verifies rollback triggers when intermediate updates fail).
2. **Local Compilation Check**:
   - Run `mvn test` to confirm compilation and execution success.

---

## 7. Rollback

- Revert commits on the `feature/streak-freeze-manager` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial implementation plan for StreakFreezeManager. |

---

## 9. Commits / PR

- Commit/PR: n/a

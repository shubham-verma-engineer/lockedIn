# Implementation Plan: Notification Scheduler Task Producer

| Field | Value |
|---|---|
| **Plan #** | 0003 |
| **Status** | Done |
| **Branch** | `feature/notification-scheduler` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to implement the asynchronous scheduler task producer (**`NotificationScheduler`**) described in low-level blueprint section 4.2. This service is polled regularly (every 60 seconds) to find active streaks that have a deadline due at the current time and haven't logged any activity today, enqueuing them to a message broker.

### Requirements:
- Create `NotificationScheduler` in package `com.lockedin.scheduler`.
- Create `NotificationTaskPayload` (record) in package `com.lockedin.scheduler` to wrap `userId`, `streakId`, and `archetype`.
- Create `MessageQueueBroker` interface in package `com.lockedin.scheduler` to define the queue integration boundary:
  ```java
  public interface MessageQueueBroker {
      void push(String queueName, Object payload);
  }
  ```
- Implement `runMinutePoll()` using JDBC:
  - Formats current UTC time to `HH:mm:00` format (representing the schedule minute).
  - Queries active user streaks lacking check-ins for the current calendar date.
  - Pushes payloads to the `lockedin_notification_dispatch_queue` queue.

### Query Logic:
```sql
SELECT us.user_id, us.streak_id, us.selected_archetype 
FROM app_user_streaks us 
LEFT JOIN customer_activity_logs sl ON us.streak_id = sl.streak_id 
AND sl.resolved_calendar_date = CURRENT_DATE 
WHERE us.local_scheduled_time = ? AND sl.log_id IS NULL;
```

---

## 2. Approach

1. **Interfaces & Records**: Define `MessageQueueBroker` and `NotificationTaskPayload` in package `com.lockedin.scheduler`.
2. **NotificationScheduler Class**: Set up class with `DataSource` and `MessageQueueBroker` injection, and implement `runMinutePoll()`.
3. **UTC Formatting**: Get current time in UTC using `ZonedDateTime.now(ZoneOffset.UTC)` and format using `DateTimeFormatter.ofPattern("HH:mm:00")`.
4. **PreparedStatement bindings**: Open connection from `DataSource`, prepare the statement, bind the time using `Time.valueOf(currentMinute)`, iterate through `ResultSet`, instantiate `NotificationTaskPayload` for each row, and push to the broker.
5. **Testing**: Write unit tests using an in-memory database (like H2) or mock dependencies (`DataSource`, `Connection`, `PreparedStatement`, `ResultSet`, `MessageQueueBroker`) using Mockito to verify the SQL parameter binding and enqueuing behavior.

---

## 3. Phases

### Phase 1 — Scheduler Interfaces & Classes · Status: Done
- **Does:** Create the `MessageQueueBroker` interface, `NotificationTaskPayload` record, and `NotificationScheduler` core class.
- **Verify:** Successful Java compilation.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/scheduler/MessageQueueBroker.java` | Broker queue contract interface (new) |
  | `src/main/java/com/lockedin/scheduler/NotificationTaskPayload.java` | Task payload JVM data record (new) |
  | `src/main/java/com/lockedin/scheduler/NotificationScheduler.java` | Main scheduler poll & enqueue worker (new) |

### Phase 2 — Unit Testing & Verification · Status: Done
- **Does:** Write unit tests mock-asserting proper parameter binding, database connectivity, and push execution on the message broker.
- **Verify:** Run Maven test suite and ensure all tests pass.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/scheduler/NotificationSchedulerTest.java` | Mockito unit tests validating JDBC flow and queue pushes (new) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Connection leaks on SQLException | Ensure SQL resources (`Connection`, `PreparedStatement`, `ResultSet`) are allocated within Java try-with-resources blocks to automate closing. |
| Timezone conversion discrepancy | Force system-independent UTC formatting: `ZonedDateTime.now(ZoneOffset.UTC)`. |

---

## 5. Out of scope / deferred

- Setting up actual Redis or SQS messaging client connections (handled in infrastructure integration phase).
- Dynamic cron execution triggering (handled by application runtime runners).

---

## 6. Verification

1. **JUnit Unit Tests**:
   - `testSchedulerPollsAndEnqueuesTasks` (verifies standard happy path where streaks match and are enqueued).
   - `testSchedulerHandlesEmptyResultSet` (verifies no messages are pushed when query results are empty).
   - `testSchedulerHandlesSqlExceptionsGracefully` (verifies errors are caught and logged without crashing).
2. **Local Compilation Check**:
   - Run `mvn test` to confirm compilation and execution success.

---

## 7. Rollback

- Revert commits on the `feature/notification-scheduler` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial implementation plan for NotificationScheduler. |

---

## 9. Commits / PR

- Commit/PR: n/a

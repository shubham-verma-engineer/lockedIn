# Implementation Plan: Spring Boot Application Assembly & HTTP Endpoints

| Field | Value |
|---|---|
| **Plan #** | 0006 |
| **Status** | Completed |
| **Branch** | `feature/spring-boot-bootstrap` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to assemble the individual Java components (`MotivationEngineRouter`, `TimezoneEvaluator`, `NotificationScheduler`, `StreakFreezeManager`) into a runnable **Spring Boot** application. This glue layer will boot a web server, expose REST endpoints to clients, manage a database connection pool, initialize table structures, and run scheduling tasks in the background.

### Requirements:
- Upgrade build descriptors (`pom.xml` / `build.gradle`) to configure Spring Boot 3.2.x parent and starter dependencies (Web and JDBC).
- Implement database schema initialization by defining the PostgreSQL DDL in `schema.sql`.
- Create a main entrypoint: `LockedInApplication.java` inside package `com.lockedin`.
- Register the components as Spring `@Bean` definitions or `@Component` stereotypes.
- Implement **`LockedInController`** exposing REST APIs for:
  - `POST /api/check-in` — Logs a habit check-in, converting server timestamps to timezone-correct dates.
  - `POST /api/streak/freeze` — Deducts a freeze token atomically and inserts a `FROZEN` log record.
  - `POST /api/motivation` — Generates user-specific motivation roasts/messages.
- Implement background cron scheduler executing `NotificationScheduler.runMinutePoll()` every 60 seconds using Spring `@Scheduled`.

---

## 2. Approach

1. **Dependency Injection**: Add Spring Boot starter parent to `pom.xml` / `build.gradle` along with:
   - `spring-boot-starter-web`
   - `spring-boot-starter-jdbc`
   - `com.h2database:h2` (for test and local default profile runtime)
   - `org.postgresql:postgresql` (for production runtime)
2. **Database Initialization**: Place DDL scripts in `src/main/resources/schema.sql`. Spring Boot's DataSource initializer will run this automatically on application startup.
3. **Application Configuration**:
   - Create `@Configuration` class `AppConfig.java` to construct `MotivationEngineRouter` and `TimezoneEvaluator`.
   - Setup `application.properties` with default datasource settings pointing to an in-memory H2 database for zero-config local verification.
4. **REST APIs**: Build `LockedInController.java` to handle requests and return JSON responses.
5. **Spring Scheduling**: Annotate `runMinutePoll()` in the scheduler class (or a wrapper class) with `@Scheduled(cron = "0 * * * * *")` to run every minute on the minute.
6. **Testing**: Write integration tests using Spring Boot's `@SpringBootTest` to verify application startup, controller API responses, and database structure queries.

---

## 3. Phases

### Phase 1 — Build Configuration & Database Schema · Status: Done
- **Does:** Upgrade `pom.xml` and `build.gradle` with Spring Boot starters. Create `schema.sql`.
- **Verify:** Build the project without compile errors.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `pom.xml` | Added Spring Boot parent, starter, and database dependencies (modified) |
  | `build.gradle` | Added Spring Boot plugins and dependencies (modified) |
  | `src/main/resources/schema.sql` | PostgreSQL initialization DDL schema script (new) |

### Phase 2 — Core Bootstrapping & DI Configuration · Status: Done
- **Does:** Create the main application starter class and DI configuration.
- **Verify:** Run compile and verify no compilation errors.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/LockedInApplication.java` | Main Spring Boot application class (new) |
  | `src/main/java/com/lockedin/config/AppConfig.java` | DI bean declarations for motivation engine, router, and timezone evaluators (new) |
  | `src/main/resources/application.properties` | Local dev configuration property file (new) |

### Phase 3 — HTTP Controllers & Cron Scheduling · Status: Done
- **Does:** Implement the REST controller (`LockedInController`) and the background scheduler trigger.
- **Verify:** REST controller endpoints compile correctly.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/controller/LockedInController.java` | HTTP endpoints for check-ins, freezes, and motivation (new) |
  | `src/main/java/com/lockedin/scheduler/SpringSchedulerWrapper.java` | Scans and executes MinutePoll background tasks using @Scheduled (new) |

### Phase 4 — Integration Testing · Status: Done
- **Does:** Create a Spring Boot integration test suite to verify endpoints and database logic.
- **Verify:** Run Maven test suite successfully.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/LockedInApplicationTests.java` | SpringBootTest verifying HTTP API endpoints and DB updates [NEW] |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| In-memory H2 SQL compatibility with PostgreSQL DDL | Write DDL query statements in `schema.sql` that are ANSI-SQL standard and fully supported by both H2 (PostgreSQL compatibility mode) and standard PostgreSQL servers. |
| Multi-threaded scheduler conflicts | Encapsulate scheduler execution within distinct task threads to protect API execution thread capacity. |

---

## 5. Out of scope / deferred

- Complete Spring Security authentication / JWT filter setup (stubs/mock users are assumed, real user session verification deferred to a security-specific sprint).

---

## 6. Verification

1. **Spring Boot Integration Test**:
   - Run API test requests (`/api/check-in`, `/api/streak/freeze`, `/api/motivation`) and assert HTTP status codes (200 OK) and database mutations.
2. **Local Compilation Check**:
   - Run `mvn clean test` to confirm compilation and execution success.

---

## 7. Rollback

- Revert commits on the `feature/spring-boot-bootstrap` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial plan for Spring Boot application assembly. |

---

## 9. Commits / PR

- Commit/PR: n/a

# Implementation Plan: Motivation Engine Factory & Router

| Field | Value |
|---|---|
| **Plan #** | 0001 |
| **Status** | In Progress |
| **Branch** | `feature/motivation-engine` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to implement **STK-201**: "Construct Polymorphic Interface Factory Router Layout for Strategy Motivation Engines". This is the core execution pipeline for generating habit accountability messages (roasts or motivation texts) for users.

### Requirements:
- Foundational Java models: `MotivationContext` (record) and `MotivationEngine` (interface).
- Free tier processor: `TemplateMotivationEngine` which resolves templates locally.
- Premium tier processor: `AiMotivationEngine` which calls an external LLM using `LlmClient`.
- Factory/Router: Selects the correct processing engine dynamically at runtime using polymorphism and `MotivationEngine.supports(userTier)`.
- Input validation: The router must validate the incoming message archetype and throw a logged runtime anomaly (exception) if the requested archetype is invalid or unmapped.

### Constraints & Assumptions:
- Code must target Java 17/21 features (like records, pattern matching, stream operations).
- Package structure: `com.lockedin.engine`.
- Since `LlmClient` is not defined in the specification detail but required by `AiMotivationEngine`, we must define the `LlmClient` interface.
- Valid Archetypes defined in PRD: `CASUAL`, `PROFESSIONAL`, `STRICT`, `18+ ABUSIVE` (or `ABUSIVE`).

---

## 2. Approach

1. **Core Models and Strategy Contracts**: Define `MotivationContext` record and `MotivationEngine` interface under the package `com.lockedin.engine`. Define `LlmClient` interface as a dependency.
2. **Template engine**: Implement `TemplateMotivationEngine` with local hardcoded message patterns for Free/Fallback users.
3. **AI engine**: Implement `AiMotivationEngine` taking `LlmClient` to request roasts using structured system and user prompts.
4. **Router Engine**: Implement a router (`MotivationEngineRouter`) that takes a list of `MotivationEngine` implementations. It validates the request's archetype and matches the appropriate engine for the user's subscription tier.
5. **Testing**: Write unit tests to verify both engines, validation failures, and successful routing.

---

## 3. Phases

### Phase 1 — Core Strategy & Engine Implementations · Status: Pending
- **Does:** Create the core classes, record, interfaces, and concrete strategy engine implementations (`TemplateMotivationEngine` and `AiMotivationEngine`).
- **Verify:** Compile the classes. Verify structural correctness.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/MotivationContext.java` | Immutable unified context record [NEW] |
  | `src/main/java/com/lockedin/engine/MotivationEngine.java` | Shared strategy contract interface [NEW] |
  | `src/main/java/com/lockedin/engine/LlmClient.java` | Dependency interface for LLM calls [NEW] |
  | `src/main/java/com/lockedin/engine/TemplateMotivationEngine.java` | Local compiler implementation for FREE users [NEW] |
  | `src/main/java/com/lockedin/engine/AiMotivationEngine.java` | AI compiler implementation for PREMIUM users [NEW] |

### Phase 2 — Factory Routing Logic & Validation · Status: Pending
- **Does:** Implement the `MotivationEngineRouter` incorporating polymorphism and strict archetype validation.
- **Verify:** Run a main or unit test asserting routing and exception throwing on invalid archetypes.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/MotivationEngineRouter.java` | Core polymorphic router & validation processor [NEW] |

### Phase 3 — Unit Testing & Verification · Status: Pending
- **Does:** Create automated tests using JUnit/Mockito to verify success and failure paths for the routing factory.
- **Verify:** Execute Maven/Gradle test suite and ensure 100% pass rate.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/engine/MotivationEngineRouterTest.java` | JUnit tests verifying routing and validations [NEW] |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Null/empty archetype in context | Validation checks for null and throws immediate `IllegalArgumentException` with logged warning. |
| Missing engine for user tier | Default fallback handling or throwing `IllegalStateException` to prevent silent delivery failures. |
| External LLM call failure in `AiMotivationEngine` | Ensure exception propagation or fallback to TemplateMotivationEngine if the LLM client fails (can be handled in a later phase or in `AiMotivationEngine` itself). |

---

## 5. Out of scope / deferred

- Actual HTTP network implementation of `LlmClient` (mocked in tests, real adapter will be built in an integration phase).
- Spring/Framework DI integration (code is decoupled-ready; dependency injection config is deferred to application service assembly).

---

## 6. Verification

1. **JUnit Unit Tests**:
   - `testRouterSelectsTemplateEngineForFreeTier`
   - `testRouterSelectsAiEngineForPremiumTier`
   - `testRouterThrowsAnomalyForInvalidArchetype`
   - `testTemplateEngineGeneratesRandomTemplate`
   - `testAiEngineGeneratesPromptCorrectly`
2. **Local Compilation Check**:
   - Run build command (`./gradlew test` or standard maven compile) to confirm clean builds.

---

## 7. Rollback

- Revert commits on the `feature/motivation-engine` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial implementation plan for STK-201. |

---

## 9. Commits / PR

- Commit/PR: n/a

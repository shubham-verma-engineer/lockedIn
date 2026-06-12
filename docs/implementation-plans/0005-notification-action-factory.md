# Implementation Plan: Notification Action Factory (Android SDK Integration)

| Field | Value |
|---|---|
| **Plan #** | 0005 |
| **Status** | Done |
| **Branch** | `feature/notification-action-factory` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

---

## 1. Understanding

The goal is to implement **`NotificationActionFactory`** as specified in frontend layout spec section 5.2. This factory builds interactive actions that run when a user receives a push notification on their Android device, letting them directly log or skip a habit check-in from their lock screen / notification drawer.

### Requirements:
- Create `NotificationActionFactory` in package `com.lockedin.client.notification`.
- Methods:
  - `createCompleteAction(Context context, String streakId)`: Constructs action for completing check-in (`ACTION_STREAK_LOG_COMPLETE`).
  - `createFreezeAction(Context context, String streakId)`: Constructs action for skipping/freezing check-in (`ACTION_STREAK_LOG_SKIP`).
- Uses Android SDK APIs:
  - `android.app.PendingIntent`
  - `android.content.Context`
  - `android.content.Intent`
  - `androidx.core.app.NotificationCompat`
- To compile this inside our Java environment without requiring a full Android Studio setup, we will define basic **compile-time stubs** for the required Android classes under `android.*` and `androidx.*` packages.

---

## 2. Approach

1. **Android Compile-Time Stubs**: Define minimal structural stubs for Android dependencies in the main source tree to support compilation:
   - `android.content.Context`
   - `android.content.Intent`
   - `android.app.PendingIntent`
   - `androidx.core.app.NotificationCompat`
   - `android.R.drawable` (containing menu drawables `ic_menu_add` and `ic_menu_close_clear_cancel`)
   - `com.lockedin.client.notification.StreakActionReceiver` (represented as a stub receiver class)
2. **NotificationActionFactory Class**: Implement the action builder logic using `NotificationCompat.Action.Builder`, specifying pending intent broadcast targets and flags (`PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE`).
3. **Unit Tests**: Verify the factory correctly sets the actions (`ACTION_STREAK_LOG_COMPLETE` / `ACTION_STREAK_LOG_SKIP`), appends the `STREAK_ID` extra, and returns non-null `NotificationCompat.Action` instances.

---

## 3. Phases

### Phase 1 — Android SDK Compile-Time Stubs · Status: Done
- **Does:** Create the necessary Android mock/stub classes under `android` and `androidx` packages.
- **Verify:** Compile stubs successfully.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/android/content/Context.java` | Context stub (new) |
  | `src/main/java/android/content/Intent.java` | Intent stub (new) |
  | `src/main/java/android/app/PendingIntent.java` | PendingIntent stub (new) |
  | `src/main/java/android/R.java` | Android resource system stub (new) |
  | `src/main/java/androidx/core/app/NotificationCompat.java` | NotificationCompat stub (new) |
  | `src/main/java/com/lockedin/client/notification/StreakActionReceiver.java` | Broadcast receiver stub (new) |

### Phase 2 — NotificationActionFactory Core Implementation · Status: Done
- **Does:** Build the `NotificationActionFactory` using the created stubs.
- **Verify:** Successful Java compilation of the factory.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/client/notification/NotificationActionFactory.java` | Main Android notification action builder (new) |

### Phase 3 — Unit Testing & Verification · Status: Done
- **Does:** Write unit tests asserting proper intent action and extra configurations on the generated actions.
- **Verify:** Run Maven test suite and ensure all tests pass.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/client/notification/NotificationActionFactoryTest.java` | JUnit tests verifying constructed action actions, titles, and extras (new) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Stub classes conflict with real Android SDK in downstream Android builds | These stubs are for local backend validation. If this code is merged into a multi-module monorepo, the stubs are moved to a `compileOnly` module or compile scope so they don't leak into the actual Android build artifact. |

---

## 5. Out of scope / deferred

- Actual Android UI layout construction (defined as XML/Jetpack Compose, deferred to client app repository).

---

## 6. Verification

1. **JUnit Unit Tests**:
   - `testCreateCompleteAction` (verifies complete action title "Log Habit Now ✅", correct intent action, and streakId extra).
   - `testCreateFreezeAction` (verifies freeze action title "Skip Day (Burn Freeze) 🛡️", correct intent action, and streakId extra).
2. **Local Compilation Check**:
   - Run `mvn test` to confirm compilation and execution success.

---

## 7. Rollback

- Revert commits on the `feature/notification-action-factory` branch or checkout `main`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial plan for Android NotificationActionFactory. |

---

## 9. Commits / PR

- Commit/PR: n/a

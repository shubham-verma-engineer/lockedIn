# LockedIn Platform - Frontend Integration & Mobile Layout Specification

## Document Control & Metadata
- **Title:** LockedIn Platform Frontend Layout & Notification Specs
- **Status:** Approved / Production Blueprint
- **Version:** v2.0.0
- **Authors:** Lead UI/UX Designer & Client Lead
- **Date:** June 2026

---

## 1. Design System Tokens (Obsidian Theme)

The app utilizes a futuristic, dark-mode-first color palette with high-contrast accent colors to emphasize goal urgency and state progress.

| Token String Identifier | Hex Value | Semantic Application Rule |
| :--- | :--- | :--- |
| `COLOR_BG_PRIMARY` | `#090d16` | Main Obsidian Matte background canvas. |
| `COLOR_BG_SECONDARY` | `#111827` | Card/panel surface background. |
| `COLOR_TEXT_PRIMARY` | `#f3f4f6` | High-contrast body and header text. |
| `COLOR_TEXT_MUTED` | `#9ca3af` | Secondary labels, placeholders, and descriptions. |
| `COLOR_STATE_ACTIVE` | `#00ffcc` | Vibrant Electric Cyan: Streak is healthy, task completed today. |
| `COLOR_STATE_WARNING` | `#ffcc00` | Amber alert: Habit cutoff limit approaching (< 2 hours remaining). |
| `COLOR_STATE_CRITICAL` | `#ff3366` | Neon Crimson: Streak is broken, roasts are actively running. |
| `COLOR_STATE_FROZEN` | `#77b5fe` | Ice Blue: Active freeze shield protecting current progress. |

---

## 2. Core Mobile Screen Layouts

### 2.1 Obsidian Dashboard View
```text
+---------------------------------------------------------+
| [Profile Icon]                 LockedIn    [Freeze: 3] |
+---------------------------------------------------------+
|                                                         |
|  DAILY PROGRESS                                         |
|  [============ 75% ============]                         |
|  3/4 Habits Completed                                   |
|                                                         |
|  ACTIVE STREAKS:                                        |
|  +---------------------------------------------------+  |
|  |  [ ] Coding Daily (22:00)           (Streak: 12d) |  |
|  |      Emotional Anchor: "No excuses. Stay sharp."  |  |
|  +---------------------------------------------------+  |
|  |  [x] Workout (08:30)                (Streak:  5d) |  |
|  |      State: [ COMPLETED ]                         |  |
|  +---------------------------------------------------+  |
|  |  [x] Read 10 Pages (07:00)          (Streak: 15d) |  |
|  |      State: [ FROZEN ]                            |  |
|  +---------------------------------------------------+  |
|                                                         |
|  [ + ADD NEW HABIT ]                                    |
+---------------------------------------------------------+
```

### 2.2 Motivation Archetype Customize Panel
Allows users to configure their accountability motivation voice persona:
```text
+---------------------------------------------------------+
| < BACK               MOTIVATION ARCHETYPE               |
+---------------------------------------------------------+
|                                                         |
|  Select Archetype Persona:                              |
|  ( ) CASUAL       - Gen-Z slang, slight peer pressure.  |
|  (*) PROFESSIONAL - Polite, milestone-focused tracker.  |
|  ( ) STRICT       - Assertive, calls out excuses.       |
|  ( ) 18+ ABUSIVE  - Extreme tough love, raw roasts.     |
|                                                         |
|  +---------------------------------------------------+  |
|  |  [!] Age Lock Consent Gate                        |  |
|  |  You must confirm you are 17+ to unlock the       |  |
|  |  abusive archetype persona.                       |  |
|  |  [x] I consent and am over 17 years of age.       |  |
|  +---------------------------------------------------+  |
|                                                         |
|  [ SAVE MOTIVATION CONFIG ]                             |
+---------------------------------------------------------+
```

---

## 3. Interactive UI States & Micro-animations

1. **Streak Increment Flare:** When a user checks in, the circular streak counter flashes `COLOR_STATE_ACTIVE` (#00ffcc) with a subtle neon radial glow animation.
2. **Cutoff Countdown Pulse:** If the deadline is within 2 hours, the counter changes to `COLOR_STATE_WARNING` (#ffcc00) and pulses slowly (1.5s interval) to draw visual attention.
3. **Streak Freeze Freeze-In:** When a freeze token is consumed, the habit card is overlaid with a translucent ice-blue mesh (`COLOR_STATE_FROZEN`) and a glassmorphism backdrop-filter blur.

---

## 4. Native Android Notification Component Code

The client package leverages Android `NotificationCompat` actions to enable one-tap responses directly from notification banners.

### 4.1 Action Factory Layout Configuration
The class [NotificationActionFactory.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/client/notification/NotificationActionFactory.java) constructs interactive actions with custom PendingIntents:

- **Log Habit Action:** Emits broadcast code `ACTION_STREAK_LOG_COMPLETE`.
- **Freeze Skip Action:** Emits broadcast code `ACTION_STREAK_LOG_SKIP`.

### 4.2 Broadcast Receiver Processing
The client [StreakActionReceiver.java](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/client/notification/StreakActionReceiver.java) intercepts these actions asynchronously:

- **Upon receiving `ACTION_STREAK_LOG_COMPLETE`:**
  - Fires an HTTP POST request to the check-in API `/api/v1/streaks/{streakId}/checkin`.
  - On success, dismisses the notification and updates local SQLite UI cache.
- **Upon receiving `ACTION_STREAK_LOG_SKIP`:**
  - Invokes the freeze endpoint `/api/v1/streaks/{streakId}/freeze`.
  - Burns one token and triggers the visual freeze state in the launcher.

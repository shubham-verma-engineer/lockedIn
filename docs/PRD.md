# LockedIn Platform - Product Requirement Document (PRD)

## Document Control & Metadata
- **Title:** LockedIn Platform Product Requirement Document (PRD)
- **Status:** Approved / Production Blueprint
- **Version:** v2.0.0
- **Authors:** System Architecture Council & Product Management
- **Date:** June 2026

---

## 1. Executive Summary & Core Value Proposition

Traditional habit-tracking applications fail because they rely on passive, gentle notifications that users quickly learn to ignore or dismiss. **LockedIn** turns habit tracking into an active, high-engagement accountability experience by leveraging psychological urgency and emotional resonance. 

The platform achieves this through:
- **Emotional Anchors:** Forcing users to define and document the precise emotional reason why they cannot afford to fail.
- **Motivation Archetypes:** Allowing users to configure the "voice" of their reminders, ranging from polite professional prompts to strict, Gen-Z slang, and even boundary-pushing 18+ tough-love roasts.
- **Night-Owl Grace Period:** A user-centric timezone handling mechanism that recognizes late-night check-ins without breaking streaks.
- **Loss-Aversion Game Mechanics:** Active streak freeze vaults that prevent accidental breaks but require intentional resource management.

---

## 2. Target User Personas

### Persona A: "The Procrastinator" (Primary)
- **Demographics:** Gen-Z / Millennial, 18–34 years old, tech-savvy.
- **Pain Point:** Frequently starts habits (e.g., coding daily, working out) but loses motivation after 3-4 days when reminders become repetitive and friendly.
- **Value Recieved:** Needs aggressive, humorous, and sometimes abrasive call-outs (archetypes like `18+ ABUSIVE` or `STRICT`) that cut through daily noise and force immediate action.

### Persona B: "The High-Achiever" (Secondary)
- **Demographics:** Professionals, 25–45 years old, highly structured.
- **Pain Point:** Struggles with maintaining long streaks due to timezone travel or late-night work shifts, leading to demotivating streak losses.
- **Value Recieved:** Leverages the `Night-Owl Grace Period` to credit late check-ins and utilizes the `PROFESSIONAL` archetype to keep tracking clean, focused, and integrated with system APIs.

---

## 3. Functional Requirements Specification

The system functionalities are organized in the following priority-based matrix:

| Ref ID | Module | User Story / Description | Priority |
| :--- | :--- | :--- | :--- |
| **PRD-F01** | Profile & Anchor Capture | As a user, I can create an account, define a specific daily habit target, choose a target deadline time, and write a custom "Emotional Anchor" text detailing why this habit is critical. | P0 (Blocker) |
| **PRD-F02** | Archetype Configuration | As a user, I can toggle the motivational voice of the system between `CASUAL`, `PROFESSIONAL`, `STRICT`, and `18+ ABUSIVE`. The default is `PROFESSIONAL`. | P0 (Blocker) |
| **PRD-F03** | Timezone Grace Ingestion | As a user, I want my late-night check-ins (up to 3:00 AM) to be logically credited to the previous calendar day so that my streak doesn't break due to a timezone or late-work shift. | P0 (Blocker) |
| **PRD-F04** | Strategy Factory Router | As a system, I want to route messages dynamically. Free tier accounts receive templates containing local string interpolation, while Premium tier accounts get customized Gen-AI LLM-generated roasts. | P1 (High) |
| **PRD-F05** | Streak Freeze Protection | As a user, I want the system to automatically consume an inventory "Freeze Token" if I miss a daily check-in window to prevent my streak from resetting to zero. | P1 (High) |
| **PRD-F06** | Group Accountability Pools | As a group of users, we want to combine our streak freeze tokens into a shared pool. If a member misses a day, a freeze token is consumed from the shared pool, keeping the group streak alive. | P2 (Medium) |
| **PRD-F07** | Smartwatch Health Sync | As a user, I want the system to passively verify my habit logs using Google Health Connect / Apple HealthKit sync (e.g., verifying step counts or sleep times). | P2 (Medium) |
| **PRD-F08** | Custom Voice Clones | As a Premium user, I want to upload a 30-second voice snippet of a friend or mentor so the Gen-AI system can output voice-morphed audio reminders. | P3 (Low) |

---

## 4. Core Product KPIs & Analytics

To evaluate platform success and user engagement, the system tracks the following key metrics:

1. **Daily Habit Check-in Rate (DHCR):** 
   $$\text{DHCR} = \frac{\text{Successful Daily Check-ins}}{\text{Total Scheduled Habits}} \times 100$$
2. **Streak Retention Curve (SRC):** Percentage of users maintaining a streak past Day 7, Day 14, and Day 30.
3. **Freeze Token Velocity (FTV):** Rate at which freeze tokens are consumed, indicating habit difficulty and user reliance on protective mechanics.
4. **Notification Interaction Rate (NIR):** Click-through rate (CTR) on push notifications, mapped across the different motivation archetypes to evaluate which archetype drives the highest response rate.

---

## 5. Future Product Roadmap

The next phase of LockedIn will focus on scaling social engagement and automation:
- **Phase 2.1: Group Accountability Circles:** Launch shared spaces where friends can view each other's habits, pool streak freezes, and send real-time reaction prompts.
- **Phase 2.2: Wearable Integration:** Integration with Apple Watch, Garmin, and Fitbit to automate the ingestion of fitness, health, and sleep-related habits without manual text entry.
- **Phase 2.3: Voice Synthesis Engine:** Upgrade the notifications from standard text pushes to short, customized audio clips using synthesized voices tailored to the selected motivation archetype.

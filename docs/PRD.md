# 1. Product Requirement Document (PRD)

## 1.1 Objective & Vision

The **LockedIn** platform converts traditional, passive habit tracking into active high-engagement accountability loops. By replacing gentle alerts with dynamic **Motivation Archetypes** (ranging from casual Gen-Z slang to strict and explicit 18+ tough-love roasts) centered around user-defined emotional anchors, the platform leverages psychological urgency to drive high user retention and organic viral growth loops.

## 1.2 Functional Feature Matrix

| Ref ID | Feature Module | Description | Priority |
| :--- | :--- | :--- | :--- |
| **PRD-F01** | Profile & Anchor Capture | User authenticates, selects a habit target, configures a precise deadline time, and documents an explicit text anchor outlining why they cannot fail. | P0 (Blocker) |
| **PRD-F02** | Archetype Configuration | Configuration panel enabling the toggling of motivation voice modes: Casual, Professional, Strict, and 18+ Abusive profiles. Default is Professional. | P0 (Blocker) |
| **PRD-F03** | Timezone-Aware Ingest | Manual dashboard interaction or automated passive background sync via system health hooks (Apple HealthKit / Google Connect APIs) to log progress. | P0 (Blocker) |
| **PRD-F04** | Strategy Factory Router | System dynamically selects engine processing strategies at runtime, executing local string interpolation for Free tiers and OpenAI API calls for Premium tiers. | P1 (High) |
| **PRD-F05** | Automated Streak Freezes | Automated background ledger operations that evaluate missed windows and consume inventory safety tokens to preserve the current streak. | P1 (High) |

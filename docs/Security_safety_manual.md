# LockedIn Platform - Security, Access Control & Safety Manual

## Document Control & Metadata
- **Title:** LockedIn Platform Security & App Store Safety Manual
- **Status:** Approved / Production Blueprint
- **Version:** v2.0.0
- **Authors:** Security Architect & Legal Compliance Counsel
- **Date:** June 2026

---

## 1. App Store Safety & Content Moderation

Because LockedIn utilizes dynamic Motivation Archetypes (which include critical or aggressive text responses), the platform must strictly enforce safety guardrails to comply with **Apple App Store Review Guideline 1.2 (User-Generated Content Safety)** and **Google Play Developer Harassment Policies**.

### 1.1 Programmatic LLM Prompt Sandboxing
All generative AI models inside the [AiMotivationEngine](file:///Users/shubhamverma/Documents/JavaProjects/startup/lockedIn/src/main/java/com/lockedin/engine/AiMotivationEngine.java) are locked behind systemic prompt boundaries. Prompts must explicitly instruct the LLM:

- **Identity Targeting Ban:** The generator is strictly forbidden from referencing a user's physical appearance, weight, gender identity, sexual orientation, race, ethnicity, religion, or cognitive capability.
- **Mutable Behavior Focus:** Roasts and motivational callouts must exclusively target **mutable behavioral choices**—specifically procrastination, missing check-in deadlines, making text excuses, or high screen-time logs.
- **Example Compliant Roast:** *"Hey Alex, your workout schedule is crying right now. You spent 4 hours on TikTok instead of 30 minutes on the treadmill. Get up."*
- **Example Prohibited Roast:** Any text containing derogatory comments regarding body metrics or identity labels.

### 1.2 Onboarding Age Restrictions & Consent Gates
- **Age Rating:** The application must be submitted under a **17+ Age Tier** classification on the iOS App Store and Google Play Store.
- **Consent Dialogs:** The `18+ ABUSIVE` archetype is locked by default on registration. To enable it:
  1. The user must navigate to the Motivation Customizer settings.
  2. The system must render an explicit, clear dialog warning the user about explicit language.
  3. The user must tick an age declaration checkbox and click "Confirm/Unlock".
  4. The system logs this consent flag in the user profile state before routing any payloads to the `18+ ABUSIVE` strategy thread.

---

## 2. Technical API Security & Authorization

To protect user details and prevent abuse, the backend endpoints enforce the following security layers:

### 2.1 JSON Web Token (JWT) Verification
- All requests to `/api/v*` require an `Authorization: Bearer <JWT>` header.
- Tokens are signed using HMAC-SHA256 with a 256-bit rotating secret key managed via AWS Secret Manager.
- The JWT payload must contain the `user_id` and the `tier` (e.g. `FREE`, `PREMIUM`).

### 2.2 Rate Limiting & Denial of Service Protection
- **API Gateway Rate Limiting:** Enforces a maximum of **100 requests per minute per IP address** for standard API endpoints.
- **Check-in Endpoint Rate Limiting:** Enforces a maximum of **5 check-in attempts per 5 minutes per user** to prevent brute-force streak manipulation.
- Gateway blocks offending IPs with a `429 Too Many Requests` response.

---

## 3. Sensitive Data Handling & GDPR Compliance

- **Encryption in Transit:** All traffic between mobile clients and the API Gateway must utilize **TLS 1.3** (with fallback to TLS 1.2).
- **Encryption at Rest:** PostgreSQL database files and RDS instances are encrypted using AES-256 keys via AWS Key Management Service (KMS).
- **GDPR PII Protection:**
  - **Custom Anchor Paragraphs:** Users write custom text anchors outlining sensitive personal reasons for success. These are classified as Sensitive PII.
  - **Anonymization on Deletion:** When a user deletes their account, the custom anchor text, user profile columns, and activity logs are deleted (`ON DELETE CASCADE` enforced at database schema layer) or scrubbed within 14 business days.

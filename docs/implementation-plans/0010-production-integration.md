# Implementation Plan: Production Database Profiles & ElevenLabs API Integration

| Field | Value |
|---|---|
| **Plan #** | 0010 |
| **Status** | Done |
| **Branch** | `feature/production-integration` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

## 1. Understanding

The goal is to transition the LockedIn backend from a purely mock-based local setup to a production-ready application. This includes:
1. **Spring Boot Environment Profiles**:
   - Configure a dynamic profile setup supporting both local in-memory H2 database testing (`dev` profile) and production PostgreSQL database deployments (`prod` profile).
   - Read production credentials and target connections dynamically via system environment variables.
2. **Real ElevenLabs API Client**:
   - Swap the simulated voice synthesis logic in `VoiceCloningSynthesizer` for a real ElevenLabs REST API integration.
   - Support parameterized configuration properties for endpoint URL, API keys, and simulation overrides.
3. **Secure Audio Storage & Streaming**:
   - Store the generated audio bytes locally in a persistent `media/` directory.
   - Expose a secure streaming endpoint `/api/motivation/audio/{clipId}` protected by a pre-signed, time-expiring signature to serve the audio files.
   - Verify fallback mechanics to standard text push notifications upon ElevenLabs connectivity/API errors.

---

## 2. Approach

1. **Profiles and Property Configuration**:
   - Split configurations into:
     - `application.properties` (core app config, default profile active = `dev`).
     - `application-dev.properties` (local H2 database settings, in-memory mode, auto-running `schema.sql`, ElevenLabs simulated mode).
     - `application-prod.properties` (production PostgreSQL settings reading environment variables, ElevenLabs simulated = `false`, auto-schema run = `never`).
2. **ElevenLabs client (`ElevenLabsClient.java`)**:
   - Create a service client using Spring's `RestTemplate` to request audio generation from:
     `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
   - Headers: `xi-api-key: <key>`, `Content-Type: application/json`.
   - Toggle simulated behavior based on the active profile setting.
3. **Audio File Streaming (`LockedInController.java`)**:
   - Save synthesized MP3 clips into a `media/` sub-directory inside the workspace root.
   - Secure the URL generation by computing a secure signature check `HMAC` or simple token map with expiration.
   - Implement `GET /api/motivation/audio/{clipId}` streaming the raw audio bytes with correct `audio/mpeg` header if valid, and returning `403 Forbidden` if invalid/expired.

---

## 3. Phases

### Phase A — Profiles Config & ElevenLabs Client · Status: Done
- **Does:** Split configurations into dev/prod profiles and build the `ElevenLabsClient` service class.
- **Verify:** Compile classes and run unit tests validating that the profile properties load correctly.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/resources/application.properties` | Configure common properties and default active profile (modified) |
  | `src/main/resources/application-dev.properties` | Dev environment properties with H2 & ElevenLabs simulation (new) |
  | `src/main/resources/application-prod.properties` | Production environment properties with PostgreSQL configuration (new) |
  | `src/main/java/com/lockedin/client/ElevenLabsClient.java` | External Rest Client calling ElevenLabs text-to-speech API (new) |

### Phase B — Voice Synthesis & Secure Media Endpoint · Status: Done
- **Does:** Update `VoiceCloningSynthesizer` to save actual output bytes and add the streaming endpoint in `LockedInController`.
- **Verify:** Invoke synthesis, generate link, verify token checks, and stream bytes locally.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/engine/VoiceCloningSynthesizer.java` | Integrate `ElevenLabsClient` and write audio bytes to local media directory (modified) |
  | `src/main/java/com/lockedin/controller/LockedInController.java` | Expose streaming GET endpoint with signature checks (modified) |
  | `src/main/java/com/lockedin/config/AppConfig.java` | Inject `ElevenLabsClient` and setup configuration beans (modified) |

### Phase C — E2E Verification & Integration Tests · Status: Done
- **Does:** Write integration tests validating the endpoint configurations, mock ElevenLabs API calls, token verification, and profile behavior.
- **Verify:** Run all tests via Maven `mvn clean test` resulting in green build.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/LockedInApplicationTests.java` | Extend integration tests to cover streaming endpoints and validation parameters (modified) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Exposing ElevenLabs API Key in logs or code repositories | Inject production keys via environment variable placeholders (`${ELEVENLABS_API_KEY}`) to keep them fully out of code files. |
| Making real external network requests during unit tests | Fallback to mock simulation automatically in `dev`/test profiles using the `elevenlabs.simulated=true` configuration property. |
| Unauthorized access to audio files containing user voice clones | Pre-sign all streaming URLs with a cryptographic SHA-256 HMAC token that expires after 1 hour, verified server-side. |

---

## 5. Out of scope / deferred

- Setting up real AWS S3 bucket adapters: Deferring to keep deployment footprint simple, using local file storage mapping in this sprint.
- Automatic PostgreSQL database provisioning: SRE configuration is handled outside the Spring Boot codebase context.

---

## 6. Verification

- **Automated Tests**:
  - Run the Maven command: `mvn clean test`
- **Manual Verification**:
  - Start app via `mvn spring-boot:run` in `dev` profile.
  - POST to `/api/motivation/voice` to trigger a voice synthesis request.
  - Copy the returned secure audio URL and request it in the browser or terminal to confirm successful streaming.

---

## 7. Rollback

- Revert the Git commits using `git revert` and return to the mock-based release.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | — |

---

## 9. Commits / PR

- Commit/PR: `787eb66` — Initial implementation plan draft
- Commit/PR: `d535bed` — Implementation of production database profiles and real ElevenLabs API client integration


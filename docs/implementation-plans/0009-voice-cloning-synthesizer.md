# Implementation Plan: AI Voice-Cloning Synthesizer

| Field | Value |
|---|---|
| **Plan #** | 0009 |
| **Status** | Done |
| **Branch** | `feature/voice-cloning-synthesizer` |
| **Author** | Antigravity + Shubham |
| **Created** | 2026-06-13 |
| **Last updated** | 2026-06-13 |
| **Related design doc** | n/a |

## 1. Understanding

The goal is to develop an **AI Voice-Cloning Synthesizer** (STK-303) that integrates an external audio synthesis API (e.g. ElevenLabs) to synthesize premium voice roasts based on user audio clips.

### Requirements & Constraints:
* Fallback to standard text push notifications if the voice synthesis API fails.
* Store audio clone snippets securely using pre-signed secure access tokens.
* Standard backend implementation compatible with Java DI design.

---

## 2. Approach

1. **New Request Record (`VoiceSynthesisRequest.java`)**:
   - Holds the motivation request details (`MotivationRequest`), the `voiceCloneId` (String), and a simulation flag `simulateFailure` (boolean).
2. **New Service Layer (`VoiceCloningSynthesizer.java`)**:
   - Implement audio synthesis simulation calling an external API client (e.g., ElevenLabs).
   - If the simulation flag `simulateFailure` is `true`, it throws a synthesis exception to simulate API failures.
   - If successful, it generates a mock pre-signed secure access token URL: `https://audio.lockedin.com/clips/<voiceCloneId>?token=secure-presigned-token-abc&expires=1782291194`.
3. **REST Endpoint (`LockedInController.java`)**:
   - Expose `POST /api/motivation/voice` accepting `VoiceSynthesisRequest`.
   - Call the motivation engine router to generate the custom roast text.
   - Attempt to synthesize the voice roast.
   - If synthesis succeeds, return `200 OK` with a JSON payload containing the original text and the synthesized audio URL.
   - If synthesis fails (throws an exception), catch it, log the failure, and fall back gracefully to a standard text response containing a fallback message (e.g. `"Voice synthesis failed, falling back to text notification: ..."`).
4. **Integration Testing**:
   - Write test cases in `LockedInApplicationTests.java` covering successful audio synthesis and graceful text notification fallback on failure.

---

## 3. Phases

### Phase A — Voice Synthesis Service & Request Payload · Status: Done
- **Does:** Create request model `VoiceSynthesisRequest.java` and synthesis service `VoiceCloningSynthesizer.java` with secure pre-signed token generation and failure simulation.
- **Verify:** The service compiles and resolves tokens accurately.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/controller/VoiceSynthesisRequest.java` | Ingestion request record with voice ID (new) |
  | `src/main/java/com/lockedin/engine/VoiceCloningSynthesizer.java` | Audio synthesis provider with pre-signed token security (new) |

### Phase B — Controller Mapping & Configurations · Status: Done
- **Does:** Configure bean DI in `AppConfig.java` and expose `/api/motivation/voice` in `LockedInController.java`.
- **Verify:** Endpoint compiles and resolves requests.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/main/java/com/lockedin/config/AppConfig.java` | Configured VoiceCloningSynthesizer bean (modified) |
  | `src/main/java/com/lockedin/controller/LockedInController.java` | Added /api/motivation/voice endpoint with fallback logic (modified) |

### Phase C — Integration Verification · Status: Done
- **Does:** Write full integration tests covering successful synthesis and graceful text fallback.
- **Verify:** Run `mvn clean test` successfully.
- **Changed files:**

  | File | Brief |
  |---|---|
  | `src/test/java/com/lockedin/LockedInApplicationTests.java` | Add tests for voice cloning and fallback flows (modified) |

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Synthesis API outage | Wrap the API invocation in try-catch block and return a standard text notification payload. |

---

## 5. Out of scope / deferred

- Actual integration with ElevenLabs REST production servers (uses simulated client stubs appropriate for local verification).

---

## 6. Verification

- Run integration tests asserting mock ElevenLabs audio link generation, pre-signed tokens, and standard text notification fallbacks.

---

## 7. Rollback

- Revert commits on branch `feature/voice-cloning-synthesizer`.

---

## 8. Decision Log

| Date | Change | Why |
|---|---|---|
| 2026-06-13 | Initial draft | Initial draft for AI voice-cloning synthesizer. |

---

## 9. Commits / PR

- Commit/PR: n/a

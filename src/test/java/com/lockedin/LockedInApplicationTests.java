package com.lockedin;

import com.lockedin.controller.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class LockedInApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testFullIntegrationFlow() {
        String baseUrl = "http://localhost:" + port + "/api";

        // 1. Configure a streak for user Shubham
        StreakConfigRequest streakReq = new StreakConfigRequest(
                "streak-111",
                "account-111",
                "Daily Coding",
                "08:00:00",
                "America/Los_Angeles",
                "Want to be a better dev",
                "STRICT"
        );
        HttpEntity<StreakConfigRequest> streakEntity = new HttpEntity<>(streakReq);
        ResponseEntity<String> streakRes = restTemplate.postForEntity(baseUrl + "/streak", streakEntity, String.class);
        assertEquals(HttpStatus.OK, streakRes.getStatusCode());
        assertEquals("Streak configuration saved.", streakRes.getBody());

        // Verify configuration wrote to database
        Map<String, Object> streakMap = jdbcTemplate.queryForMap("SELECT * FROM app_user_streaks WHERE streak_id = ?", "streak-111");
        assertEquals("account-111", streakMap.get("ACCOUNT_ID"));
        assertEquals("STRICT", streakMap.get("SELECTED_ARCHETYPE"));
        assertEquals(0, streakMap.get("TALLY_CURRENT_STREAK")); // Default tally is 0

        // 2. Perform a check-in at 01:30 AM local time (within 3h Grace Period for previous day)
        // Tuesday, June 16, 2026, 01:30:00 AM PDT = Tuesday 08:30:00 AM UTC
        CheckInRequest checkInReq = new CheckInRequest(
                "streak-111",
                "America/Los_Angeles",
                "2026-06-16T08:30:00Z"
        );
        HttpEntity<CheckInRequest> checkInEntity = new HttpEntity<>(checkInReq);
        ResponseEntity<String> checkInRes = restTemplate.postForEntity(baseUrl + "/check-in", checkInEntity, String.class);
        assertEquals(HttpStatus.OK, checkInRes.getStatusCode());
        assertTrue(checkInRes.getBody().contains("logical date: 2026-06-15")); // Credited to Monday

        // Verify activity log matches logical date and execution state
        Map<String, Object> logMap = jdbcTemplate.queryForMap("SELECT * FROM customer_activity_logs WHERE streak_id = ?", "streak-111");
        assertEquals("COMPLETED", logMap.get("EXECUTION_STATE"));
        assertEquals(java.sql.Date.valueOf("2026-06-15"), logMap.get("RESOLVED_CALENDAR_DATE"));

        // Verify streak count incremented
        Integer currentStreak = jdbcTemplate.queryForObject("SELECT tally_current_streak FROM app_user_streaks WHERE streak_id = ?", Integer.class, "streak-111");
        assertEquals(1, currentStreak);

        // 3. Burn a freeze token (missed day: Sunday, June 14)
        FreezeRequest freezeReq = new FreezeRequest(
                "account-111",
                "streak-111",
                "2026-06-14"
        );
        HttpEntity<FreezeRequest> freezeEntity = new HttpEntity<>(freezeReq);
        ResponseEntity<String> freezeRes = restTemplate.postForEntity(baseUrl + "/streak/freeze", freezeEntity, String.class);
        assertEquals(HttpStatus.OK, freezeRes.getStatusCode());
        assertTrue(freezeRes.getBody().contains("Streak freeze applied successfully"));

        // Verify tokens count in inventory is now 0 (started with 1 seeded default)
        Integer availableTokens = jdbcTemplate.queryForObject("SELECT available_freeze_tokens FROM account_inventory_vault WHERE account_id = ?", Integer.class, "account-111");
        assertEquals(0, availableTokens);

        // Verify FROZEN log was created in DB
        Map<String, Object> frozenLogMap = jdbcTemplate.queryForMap("SELECT * FROM customer_activity_logs WHERE streak_id = ? AND resolved_calendar_date = ?", "streak-111", java.sql.Date.valueOf("2026-06-14"));
        assertEquals("FROZEN", frozenLogMap.get("EXECUTION_STATE"));

        // 4. Generate AI Motivation message for the user
        MotivationRequest motivationReq = new MotivationRequest(
                "user-111",
                "Shubham",
                "Daily Coding",
                "08:00 AM",
                "Want to be a better dev",
                "STRICT"
        );
        HttpEntity<MotivationRequest> motivationEntity = new HttpEntity<>(motivationReq);
        ResponseEntity<String> motivationRes = restTemplate.postForEntity(baseUrl + "/motivation?userTier=PREMIUM", motivationEntity, String.class);
        assertEquals(HttpStatus.OK, motivationRes.getStatusCode());
        assertTrue(motivationRes.getBody().contains("Generative AI Roast"));
        assertTrue(motivationRes.getBody().contains("Daily Coding"));
    }

    @Test
    public void testGroupFreezeIntegrationFlow() {
        String baseUrl = "http://localhost:" + port + "/api";

        // Create user streak first so foreign keys resolve cleanly
        StreakConfigRequest streakReq = new StreakConfigRequest(
                "streak-group-999",
                "account-group-999",
                "Group Activity",
                "09:00:00",
                "America/New_York",
                "Do it for the team",
                "PROFESSIONAL"
        );
        HttpEntity<StreakConfigRequest> streakEntity = new HttpEntity<>(streakReq);
        ResponseEntity<String> streakRes = restTemplate.postForEntity(baseUrl + "/streak", streakEntity, String.class);
        assertEquals(HttpStatus.OK, streakRes.getStatusCode());

        // Setup a group and membership in DB directly
        String groupId = "group-999";
        jdbcTemplate.update("INSERT INTO group_inventory_vault (group_id, available_freeze_tokens) VALUES (?, 2);", groupId);
        jdbcTemplate.update("INSERT INTO group_memberships (account_id, group_id) VALUES (?, ?);", "account-group-999", groupId);

        // Burn a group freeze token (missed day: 2026-06-11)
        FreezeRequest freezeReq = new FreezeRequest(
                "account-group-999",
                "streak-group-999",
                "2026-06-11"
        );
        HttpEntity<FreezeRequest> freezeEntity = new HttpEntity<>(freezeReq);
        ResponseEntity<String> freezeRes = restTemplate.postForEntity(baseUrl + "/streak/freeze/group", freezeEntity, String.class);
        assertEquals(HttpStatus.OK, freezeRes.getStatusCode());
        assertTrue(freezeRes.getBody().contains("Group streak freeze applied successfully"));

        // Verify tokens count in group vault is now 1 (started with 2)
        Integer groupTokens = jdbcTemplate.queryForObject("SELECT available_freeze_tokens FROM group_inventory_vault WHERE group_id = ?", Integer.class, groupId);
        assertEquals(1, groupTokens);

        // Verify audit log is present
        Map<String, Object> auditMap = jdbcTemplate.queryForMap("SELECT * FROM group_freeze_audit_logs WHERE group_id = ? AND streak_id = ?", groupId, "streak-group-999");
        assertEquals("account-group-999", auditMap.get("ACCOUNT_ID"));
        assertEquals(java.sql.Date.valueOf("2026-06-11"), auditMap.get("RESOLVED_CALENDAR_DATE"));

        // Verify activity log matches logical date and execution state
        Map<String, Object> activityMap = jdbcTemplate.queryForMap("SELECT * FROM customer_activity_logs WHERE streak_id = ? AND resolved_calendar_date = ?", "streak-group-999", java.sql.Date.valueOf("2026-06-11"));
        assertEquals("FROZEN", activityMap.get("EXECUTION_STATE"));

        // Burn the second group token
        FreezeRequest freezeReq2 = new FreezeRequest(
                "account-group-999",
                "streak-group-999",
                "2026-06-12"
        );
        HttpEntity<FreezeRequest> freezeEntity2 = new HttpEntity<>(freezeReq2);
        ResponseEntity<String> freezeRes2 = restTemplate.postForEntity(baseUrl + "/streak/freeze/group", freezeEntity2, String.class);
        assertEquals(HttpStatus.OK, freezeRes2.getStatusCode());

        // Now tokens count is 0
        Integer groupTokensZero = jdbcTemplate.queryForObject("SELECT available_freeze_tokens FROM group_inventory_vault WHERE group_id = ?", Integer.class, groupId);
        assertEquals(0, groupTokensZero);

        // Try to burn a third token (should fail since balance is 0)
        FreezeRequest freezeReq3 = new FreezeRequest(
                "account-group-999",
                "streak-group-999",
                "2026-06-13"
        );
        HttpEntity<FreezeRequest> freezeEntity3 = new HttpEntity<>(freezeReq3);
        ResponseEntity<String> freezeRes3 = restTemplate.postForEntity(baseUrl + "/streak/freeze/group", freezeEntity3, String.class);
        assertEquals(HttpStatus.BAD_REQUEST, freezeRes3.getStatusCode());
        assertTrue(freezeRes3.getBody().contains("Failed to apply group freeze"));
    }

    @Test
    public void testHealthSyncIntegrationFlow() {
        String baseUrl = "http://localhost:" + port + "/api";

        // Setup streak record
        StreakConfigRequest streakReq = new StreakConfigRequest(
                "streak-sync-888",
                "account-sync-888",
                "Steps and Sleep",
                "09:00:00",
                "America/Los_Angeles",
                "Keep healthy",
                "CASUAL"
        );
        HttpEntity<StreakConfigRequest> streakEntity = new HttpEntity<>(streakReq);
        ResponseEntity<String> streakRes = restTemplate.postForEntity(baseUrl + "/streak", streakEntity, String.class);
        assertEquals(HttpStatus.OK, streakRes.getStatusCode());

        // 1. Sync fail: steps = 4000, sleepMinutes = 300 (neither met)
        HealthSyncRequest failReq = new HealthSyncRequest(
                "account-sync-888",
                "streak-sync-888",
                4000,
                300,
                "2026-06-16T08:30:00Z", // Tue 01:30 AM PDT -> logical calendar date Monday June 15
                "America/Los_Angeles"
        );
        HttpEntity<HealthSyncRequest> failEntity = new HttpEntity<>(failReq);
        ResponseEntity<String> failRes = restTemplate.postForEntity(baseUrl + "/sync/health", failEntity, String.class);
        assertEquals(HttpStatus.OK, failRes.getStatusCode());
        assertTrue(failRes.getBody().contains("did not meet the required thresholds"));

        // Verify no check-in logged
        Integer countBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM customer_activity_logs WHERE streak_id = ?", Integer.class, "streak-sync-888");
        assertEquals(0, countBefore);

        // 2. Sync success: steps = 6000 (steps threshold met)
        // Tuesday June 16, 01:30 AM local time = 08:30 AM UTC
        // Should resolve to logical calendar date Monday June 15 (due to 3h Night-Owl grace period)
        HealthSyncRequest stepsReq = new HealthSyncRequest(
                "account-sync-888",
                "streak-sync-888",
                6000,
                0,
                "2026-06-16T08:30:00Z",
                "America/Los_Angeles"
        );
        HttpEntity<HealthSyncRequest> stepsEntity = new HttpEntity<>(stepsReq);
        ResponseEntity<String> stepsRes = restTemplate.postForEntity(baseUrl + "/sync/health", stepsEntity, String.class);
        assertEquals(HttpStatus.OK, stepsRes.getStatusCode());
        assertTrue(stepsRes.getBody().contains("Health sync successful"));
        assertTrue(stepsRes.getBody().contains("logical date: 2026-06-15"));

        // Verify check-in log resolved calendar date is 2026-06-15
        Map<String, Object> logMap = jdbcTemplate.queryForMap("SELECT * FROM customer_activity_logs WHERE streak_id = ?", "streak-sync-888");
        assertEquals("COMPLETED", logMap.get("EXECUTION_STATE"));
        assertEquals(java.sql.Date.valueOf("2026-06-15"), logMap.get("RESOLVED_CALENDAR_DATE"));

        // Verify streak count incremented
        Integer currentStreak = jdbcTemplate.queryForObject("SELECT tally_current_streak FROM app_user_streaks WHERE streak_id = ?", Integer.class, "streak-sync-888");
        assertEquals(1, currentStreak);

        // 3. Duplicate sync: steps = 8000 (threshold met) on the same logical date (2026-06-15)
        // Should reject gracefully (returns 200 OK with duplicate message, does not crash)
        HealthSyncRequest duplicateReq = new HealthSyncRequest(
                "account-sync-888",
                "streak-sync-888",
                8000,
                400,
                "2026-06-16T09:15:00Z", // Tue 02:15 AM PDT -> logical calendar date Monday June 15
                "America/Los_Angeles"
        );
        HttpEntity<HealthSyncRequest> duplicateEntity = new HttpEntity<>(duplicateReq);
        ResponseEntity<String> duplicateRes = restTemplate.postForEntity(baseUrl + "/sync/health", duplicateEntity, String.class);
        assertEquals(HttpStatus.OK, duplicateRes.getStatusCode());
        assertTrue(duplicateRes.getBody().contains("Already checked in for logical date: 2026-06-15"));

        // Verify streak count remains 1
        Integer currentStreakDup = jdbcTemplate.queryForObject("SELECT tally_current_streak FROM app_user_streaks WHERE streak_id = ?", Integer.class, "streak-sync-888");
        assertEquals(1, currentStreakDup);

        // 4. Sync success: sleepMinutes = 400 (sleep threshold met) on a new logical date
        // Tuesday June 16, 04:15 AM local time = Tuesday 11:15 AM UTC
        // Should resolve to logical calendar date Tuesday June 16 (since it is outside the 3h grace period)
        HealthSyncRequest sleepReq = new HealthSyncRequest(
                "account-sync-888",
                "streak-sync-888",
                0,
                400,
                "2026-06-16T11:15:00Z",
                "America/Los_Angeles"
        );
        HttpEntity<HealthSyncRequest> sleepEntity = new HttpEntity<>(sleepReq);
        ResponseEntity<String> sleepRes = restTemplate.postForEntity(baseUrl + "/sync/health", sleepEntity, String.class);
        assertEquals(HttpStatus.OK, sleepRes.getStatusCode());
        assertTrue(sleepRes.getBody().contains("Health sync successful"));
        assertTrue(sleepRes.getBody().contains("logical date: 2026-06-16"));

        // Verify streak count incremented to 2
        Integer currentStreakFinal = jdbcTemplate.queryForObject("SELECT tally_current_streak FROM app_user_streaks WHERE streak_id = ?", Integer.class, "streak-sync-888");
        assertEquals(2, currentStreakFinal);
    }

    @Test
    public void testVoiceCloningIntegrationFlow() {
        String baseUrl = "http://localhost:" + port + "/api";

        MotivationRequest motivationReq = new MotivationRequest(
                "user-222",
                "Shubham",
                "Workout Routine",
                "07:00 AM",
                "Don't lose your gains",
                "STRICT"
        );

        // 1. Success case: Voice synthesis succeeds, returns pre-signed audio clip URL and original text roast
        VoiceSynthesisRequest successReq = new VoiceSynthesisRequest(
                motivationReq,
                "voice-clone-workout-999",
                false
        );
        HttpEntity<VoiceSynthesisRequest> successEntity = new HttpEntity<>(successReq);
        ResponseEntity<String> successRes = restTemplate.postForEntity(baseUrl + "/motivation/voice?userTier=PREMIUM", successEntity, String.class);
        assertEquals(HttpStatus.OK, successRes.getStatusCode());
        assertTrue(successRes.getBody().contains("Voice synthesis successful"));
        assertTrue(successRes.getBody().contains("https://audio.lockedin.com/clips/voice-clone-workout-999"));
        assertTrue(successRes.getBody().contains("token="));
        assertTrue(successRes.getBody().contains("expires="));

        // 2. Fallback case: Voice synthesis fails (simulateFailure = true), falls back gracefully to standard text push notification
        VoiceSynthesisRequest failureReq = new VoiceSynthesisRequest(
                motivationReq,
                "voice-clone-workout-999",
                true
        );
        HttpEntity<VoiceSynthesisRequest> failureEntity = new HttpEntity<>(failureReq);
        ResponseEntity<String> failureRes = restTemplate.postForEntity(baseUrl + "/motivation/voice?userTier=PREMIUM", failureEntity, String.class);
        assertEquals(HttpStatus.OK, failureRes.getStatusCode());
        assertTrue(failureRes.getBody().contains("Voice synthesis failed, falling back to text notification"));
        assertTrue(failureRes.getBody().contains("Generative AI Roast"));
        assertTrue(failureRes.getBody().contains("Workout Routine"));
    }
}

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
}

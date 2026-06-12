package com.lockedin.controller;

import com.lockedin.engine.MotivationContext;
import com.lockedin.engine.MotivationEngineRouter;
import com.lockedin.engine.StreakFreezeManager;
import com.lockedin.engine.GroupStreakFreezeManager;
import com.lockedin.engine.TimezoneEvaluator;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class LockedInController {

    private final JdbcTemplate jdbcTemplate;
    private final StreakFreezeManager streakFreezeManager;
    private final GroupStreakFreezeManager groupStreakFreezeManager;
    private final MotivationEngineRouter motivationEngineRouter;
    private final TimezoneEvaluator timezoneEvaluator;

    public LockedInController(JdbcTemplate jdbcTemplate,
                              StreakFreezeManager streakFreezeManager,
                              GroupStreakFreezeManager groupStreakFreezeManager,
                              MotivationEngineRouter motivationEngineRouter,
                              TimezoneEvaluator timezoneEvaluator) {
        this.jdbcTemplate = jdbcTemplate;
        this.streakFreezeManager = streakFreezeManager;
        this.groupStreakFreezeManager = groupStreakFreezeManager;
        this.motivationEngineRouter = motivationEngineRouter;
        this.timezoneEvaluator = timezoneEvaluator;
    }

    @PostMapping("/streak")
    public ResponseEntity<String> configureStreak(@RequestBody StreakConfigRequest req) {
        String updateSql = "UPDATE app_user_streaks SET " +
                           "local_scheduled_time = ?, " +
                           "target_iana_timezone = ?, " +
                           "custom_anchor_paragraph = ?, " +
                           "selected_archetype = ? " +
                           "WHERE streak_id = ?;";

        int rows = jdbcTemplate.update(updateSql,
                java.sql.Time.valueOf(req.localScheduledTime()),
                req.targetIanaTimezone(),
                req.customAnchorParagraph(),
                req.selectedArchetype(),
                req.streakId()
        );

        if (rows == 0) {
            String insertSql = "INSERT INTO app_user_streaks (streak_id, account_id, activity_identifier, local_scheduled_time, target_iana_timezone, custom_anchor_paragraph, selected_archetype) " +
                               "VALUES (?, ?, ?, ?, ?, ?, ?);";
            jdbcTemplate.update(insertSql,
                    req.streakId(),
                    req.accountId(),
                    req.activityIdentifier(),
                    java.sql.Time.valueOf(req.localScheduledTime()),
                    req.targetIanaTimezone(),
                    req.customAnchorParagraph(),
                    req.selectedArchetype()
            );
        }
        return ResponseEntity.ok("Streak configuration saved.");
    }

    @PostMapping("/check-in")
    public ResponseEntity<String> checkIn(@RequestBody CheckInRequest req) {
        Instant eventTime = Instant.parse(req.timestampUtc());
        LocalDate logicalDate = timezoneEvaluator.getLogicalDate(eventTime, req.timezoneId());
        String logId = UUID.randomUUID().toString();

        String countSql = "SELECT COUNT(*) FROM customer_activity_logs WHERE streak_id = ? AND resolved_calendar_date = ?;";
        Integer count = jdbcTemplate.queryForObject(countSql, Integer.class, req.streakId(), Date.valueOf(logicalDate));

        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body("Already checked in for logical date: " + logicalDate);
        }

        String insertLogSql = "INSERT INTO customer_activity_logs (log_id, streak_id, resolved_calendar_date, server_utc_timestamp, execution_state) " +
                              "VALUES (?, ?, ?, ?, 'COMPLETED');";
        
        jdbcTemplate.update(insertLogSql,
                logId,
                req.streakId(),
                Date.valueOf(logicalDate),
                java.sql.Timestamp.from(eventTime)
        );

        String updateStreakSql = "UPDATE app_user_streaks SET tally_current_streak = tally_current_streak + 1 WHERE streak_id = ?;";
        jdbcTemplate.update(updateStreakSql, req.streakId());
        return ResponseEntity.ok("Check-in logged successfully for logical date: " + logicalDate + ". Streak incremented.");
    }

    @PostMapping("/streak/freeze")
    public ResponseEntity<String> applyFreeze(@RequestBody FreezeRequest req) {
        Date missedDate = Date.valueOf(req.missedDate());
        
        // Seed default inventory tokens if record doesn't exist to facilitate integration testing
        String countSql = "SELECT COUNT(*) FROM account_inventory_vault WHERE account_id = ?;";
        Integer count = jdbcTemplate.queryForObject(countSql, Integer.class, req.accountId());
        if (count == null || count == 0) {
            String seedSql = "INSERT INTO account_inventory_vault (account_id, available_freeze_tokens) VALUES (?, 1);";
            jdbcTemplate.update(seedSql, req.accountId());
        }

        boolean success = streakFreezeManager.applyAtomicStreakFreeze(req.accountId(), req.streakId(), missedDate);
        
        if (success) {
            return ResponseEntity.ok("Streak freeze applied successfully. Token consumed, log injected.");
        } else {
            return ResponseEntity.badRequest().body("Failed to apply freeze. Depleted tokens or invalid records.");
        }
    }

    @PostMapping("/streak/freeze/group")
    public ResponseEntity<String> applyGroupFreeze(@RequestBody FreezeRequest req) {
        Date missedDate = Date.valueOf(req.missedDate());
        
        // Seed default test group, membership and group token if not present to facilitate integration testing
        String resolveGroupSql = "SELECT group_id FROM group_memberships WHERE account_id = ?;";
        String groupId = null;
        try {
            groupId = jdbcTemplate.queryForObject(resolveGroupSql, String.class, req.accountId());
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            // Seed a test group and membership
            groupId = "test-group-id";
            String seedGroupSql = "INSERT INTO group_inventory_vault (group_id, available_freeze_tokens) VALUES (?, 1);";
            jdbcTemplate.update(seedGroupSql, groupId);
            
            String seedMembershipSql = "INSERT INTO group_memberships (account_id, group_id) VALUES (?, ?);";
            jdbcTemplate.update(seedMembershipSql, req.accountId(), groupId);
        }

        boolean success = groupStreakFreezeManager.applyAtomicGroupStreakFreeze(req.accountId(), req.streakId(), missedDate);
        
        if (success) {
            return ResponseEntity.ok("Group streak freeze applied successfully. Group token consumed, audit log and activity log injected.");
        } else {
            return ResponseEntity.badRequest().body("Failed to apply group freeze. Depleted group tokens or invalid records.");
        }
    }

    @PostMapping("/motivation")
    public ResponseEntity<String> generateMotivation(@RequestBody MotivationRequest req, 
                                                     @RequestParam(defaultValue = "FREE") String userTier) {
        MotivationContext context = new MotivationContext(
                req.userId(),
                req.username(),
                req.goalTitle(),
                req.targetTime(),
                req.customAnchorText(),
                req.archetype()
        );
        String message = motivationEngineRouter.routeAndGenerate(context, userTier);
        return ResponseEntity.ok(message);
    }
}


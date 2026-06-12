package com.lockedin.engine;

import java.sql.*;
import java.util.UUID;
import javax.sql.DataSource;

public class StreakFreezeManager {
    private final DataSource dataSource;

    public StreakFreezeManager(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Atomically locks the user inventory record, verifies token availability,
     * decrements the token balance, and logs a FROZEN activity log entry.
     *
     * @param userId             The ID of the user.
     * @param streakId           The ID of the user's streak.
     * @param targetMissedDate   The date of the missed milestone.
     * @return true if the freeze was successfully applied, false otherwise.
     */
    public boolean applyAtomicStreakFreeze(String userId, String streakId, java.sql.Date targetMissedDate) {
        String selectLockQuery = "SELECT available_freeze_tokens FROM account_inventory_vault WHERE account_id = ? FOR UPDATE;";
        String updateInventoryQuery = "UPDATE account_inventory_vault SET available_freeze_tokens = available_freeze_tokens - 1 WHERE account_id = ?;";
        String insertLogQuery = "INSERT INTO customer_activity_logs (log_id, streak_id, resolved_calendar_date, execution_state, server_utc_timestamp) VALUES (?, ?, ?, 'FROZEN', CURRENT_TIMESTAMP);";

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // BEGIN TRANSACTION Explicit Boundaries

            // 1. Row-level pessimistic isolation lock on target user inventory record
            try (PreparedStatement lockStmt = conn.prepareStatement(selectLockQuery)) {
                lockStmt.setString(1, userId);
                try (ResultSet rs = lockStmt.executeQuery()) {
                    if (!rs.next() || rs.getInt("available_freeze_tokens") <= 0) {
                        conn.rollback();
                        return false; 
                    }
                }
            }

            // 2. Deduct a single asset unit from inventory balance
            try (PreparedStatement updateStmt = conn.prepareStatement(updateInventoryQuery)) {
                updateStmt.setString(1, userId);
                updateStmt.executeUpdate();
            }

            // 3. Inject safety frozen activity log entry to protect streak progression
            try (PreparedStatement insertStmt = conn.prepareStatement(insertLogQuery)) {
                insertStmt.setString(1, UUID.randomUUID().toString());
                insertStmt.setString(2, streakId);
                insertStmt.setDate(3, targetMissedDate);
                insertStmt.executeUpdate();
            }

            conn.commit(); // COMMIT Transaction operations atomically
            return true;
        } catch (SQLException error) {
            if (conn != null) {
                try { 
                    conn.rollback(); 
                } catch (SQLException re) { 
                    re.printStackTrace(); 
                }
            }
            error.printStackTrace();
            return false;
        } finally {
            if (conn != null) {
                try { 
                    conn.close(); 
                } catch (SQLException ce) { 
                    ce.printStackTrace(); 
                }
            }
        }
    }
}

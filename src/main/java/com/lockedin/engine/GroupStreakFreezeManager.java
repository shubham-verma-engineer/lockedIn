package com.lockedin.engine;

import java.sql.*;
import java.util.UUID;
import javax.sql.DataSource;

public class GroupStreakFreezeManager {
    private final DataSource dataSource;

    public GroupStreakFreezeManager(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Atomically resolves user's group, locks the group row, verifies available tokens,
     * decrements the token, and writes group audit and individual activity logs.
     *
     * @param accountId          The ID of the user.
     * @param streakId           The ID of the user's streak.
     * @param targetMissedDate   The date of the missed milestone.
     * @return true if the group freeze was successfully applied, false otherwise.
     */
    public boolean applyAtomicGroupStreakFreeze(String accountId, String streakId, java.sql.Date targetMissedDate) {
        String resolveGroupQuery = "SELECT group_id FROM group_memberships WHERE account_id = ?;";
        String selectLockQuery = "SELECT available_freeze_tokens FROM group_inventory_vault WHERE group_id = ? FOR UPDATE;";
        String updateInventoryQuery = "UPDATE group_inventory_vault SET available_freeze_tokens = available_freeze_tokens - 1 WHERE group_id = ?;";
        String insertAuditQuery = "INSERT INTO group_freeze_audit_logs (audit_id, group_id, account_id, streak_id, resolved_calendar_date) VALUES (?, ?, ?, ?, ?);";
        String insertLogQuery = "INSERT INTO customer_activity_logs (log_id, streak_id, resolved_calendar_date, execution_state, server_utc_timestamp) VALUES (?, ?, ?, 'FROZEN', CURRENT_TIMESTAMP);";

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // Begin transaction

            // 1. Resolve Group ID from membership
            String groupId = null;
            try (PreparedStatement resolveStmt = conn.prepareStatement(resolveGroupQuery)) {
                resolveStmt.setString(1, accountId);
                try (ResultSet rs = resolveStmt.executeQuery()) {
                    if (rs.next()) {
                        groupId = rs.getString("group_id");
                    }
                }
            }

            if (groupId == null) {
                conn.rollback();
                return false;
            }

            // 2. Row-level pessimistic isolation lock on target group inventory record
            try (PreparedStatement lockStmt = conn.prepareStatement(selectLockQuery)) {
                lockStmt.setString(1, groupId);
                try (ResultSet rs = lockStmt.executeQuery()) {
                    if (!rs.next() || rs.getInt("available_freeze_tokens") <= 0) {
                        conn.rollback();
                        return false;
                    }
                }
            }

            // 3. Deduct a single asset unit from group inventory balance
            try (PreparedStatement updateStmt = conn.prepareStatement(updateInventoryQuery)) {
                updateStmt.setString(1, groupId);
                updateStmt.executeUpdate();
            }

            // 4. Inject audit log entry detailing group token consumption
            try (PreparedStatement auditStmt = conn.prepareStatement(insertAuditQuery)) {
                auditStmt.setString(1, UUID.randomUUID().toString());
                auditStmt.setString(2, groupId);
                auditStmt.setString(3, accountId);
                auditStmt.setString(4, streakId);
                auditStmt.setDate(5, targetMissedDate);
                auditStmt.executeUpdate();
            }

            // 5. Inject safety frozen activity log entry to protect individual streak progression
            try (PreparedStatement insertStmt = conn.prepareStatement(insertLogQuery)) {
                insertStmt.setString(1, UUID.randomUUID().toString());
                insertStmt.setString(2, streakId);
                insertStmt.setDate(3, targetMissedDate);
                insertStmt.executeUpdate();
            }

            conn.commit(); // Commit Transaction operations atomically
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

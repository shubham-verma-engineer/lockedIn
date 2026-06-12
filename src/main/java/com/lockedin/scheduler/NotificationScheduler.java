package com.lockedin.scheduler;

import java.sql.*;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import javax.sql.DataSource;

public class NotificationScheduler {
    private final DataSource dataSource;
    private final MessageQueueBroker queueBroker;

    public NotificationScheduler(DataSource dataSource, MessageQueueBroker queueBroker) {
        this.dataSource = dataSource;
        this.queueBroker = queueBroker;
    }

    /**
     * Polls the active user streaks requiring a notification at the current minute,
     * and publishes them as tasks to the message queue.
     */
    public void runMinutePoll() {
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        String currentMinute = nowUtc.format(DateTimeFormatter.ofPattern("HH:mm:00"));
        
        String query = "SELECT us.account_id, us.streak_id, us.selected_archetype " +
                       "FROM app_user_streaks us " +
                       "LEFT JOIN customer_activity_logs sl ON us.streak_id = sl.streak_id " +
                       "AND sl.resolved_calendar_date = CURRENT_DATE " +
                       "WHERE us.local_scheduled_time = ? AND sl.log_id IS NULL;";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setTime(1, Time.valueOf(currentMinute));
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    NotificationTaskPayload payload = new NotificationTaskPayload(
                        rs.getString("account_id"),
                        rs.getString("streak_id"),
                        rs.getString("selected_archetype")
                    );
                    queueBroker.push("lockedin_notification_dispatch_queue", payload);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}

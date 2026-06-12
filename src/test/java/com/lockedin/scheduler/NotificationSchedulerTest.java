package com.lockedin.scheduler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.*;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationSchedulerTest {

    @Mock
    private DataSource mockDataSource;

    @Mock
    private Connection mockConnection;

    @Mock
    private PreparedStatement mockStatement;

    @Mock
    private ResultSet mockResultSet;

    @Mock
    private MessageQueueBroker mockQueueBroker;

    private NotificationScheduler scheduler;

    @BeforeEach
    public void setUp() throws SQLException {
        scheduler = new NotificationScheduler(mockDataSource, mockQueueBroker);
    }

    @Test
    public void testSchedulerPollsAndEnqueuesTasks() throws SQLException {
        // Stub DB Connection details
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);

        // Simulate 2 rows in result set
        when(mockResultSet.next()).thenReturn(true, true, false);
        
        when(mockResultSet.getString("user_id")).thenReturn("user-A", "user-B");
        when(mockResultSet.getString("streak_id")).thenReturn("streak-A", "streak-B");
        when(mockResultSet.getString("selected_archetype")).thenReturn("CASUAL", "STRICT");

        scheduler.runMinutePoll();

        // Verify time argument was set
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        String expectedMinute = nowUtc.format(DateTimeFormatter.ofPattern("HH:mm:00"));
        verify(mockStatement).setTime(eq(1), eq(Time.valueOf(expectedMinute)));

        // Verify task payloads pushed to broker
        verify(mockQueueBroker).push(
            eq("lockedin_notification_dispatch_queue"), 
            eq(new NotificationTaskPayload("user-A", "streak-A", "CASUAL"))
        );
        verify(mockQueueBroker).push(
            eq("lockedin_notification_dispatch_queue"), 
            eq(new NotificationTaskPayload("user-B", "streak-B", "STRICT"))
        );
        verifyNoMoreInteractions(mockQueueBroker);

        // Verify resources closed
        verify(mockResultSet).close();
        verify(mockStatement).close();
        verify(mockConnection).close();
    }

    @Test
    public void testSchedulerHandlesEmptyResultSet() throws SQLException {
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(anyString())).thenReturn(mockStatement);
        when(mockStatement.executeQuery()).thenReturn(mockResultSet);

        // Simulate empty database query results
        when(mockResultSet.next()).thenReturn(false);

        scheduler.runMinutePoll();

        // Verify no items pushed
        verifyNoInteractions(mockQueueBroker);

        // Verify resources closed
        verify(mockResultSet).close();
        verify(mockStatement).close();
        verify(mockConnection).close();
    }

    @Test
    public void testSchedulerHandlesSqlExceptionsGracefully() throws SQLException {
        // Simulate connection failure throwing SQLException
        when(mockDataSource.getConnection()).thenThrow(new SQLException("DB connection failed"));

        // Must catch exception internally and not crash calling runtime
        assertDoesNotThrow(() -> scheduler.runMinutePoll());

        verifyNoInteractions(mockQueueBroker);
    }
}

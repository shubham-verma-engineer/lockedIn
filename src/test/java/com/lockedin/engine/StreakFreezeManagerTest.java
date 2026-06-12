package com.lockedin.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StreakFreezeManagerTest {

    @Mock
    private DataSource mockDataSource;

    @Mock
    private Connection mockConnection;

    @Mock
    private PreparedStatement mockSelectStmt;

    @Mock
    private PreparedStatement mockUpdateStmt;

    @Mock
    private PreparedStatement mockInsertStmt;

    @Mock
    private ResultSet mockResultSet;

    private StreakFreezeManager manager;

    @BeforeEach
    public void setUp() {
        manager = new StreakFreezeManager(mockDataSource);
    }

    @Test
    public void testApplyFreezeSucceeds() throws SQLException {
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(startsWith("SELECT"))).thenReturn(mockSelectStmt);
        when(mockConnection.prepareStatement(startsWith("UPDATE"))).thenReturn(mockUpdateStmt);
        when(mockConnection.prepareStatement(startsWith("INSERT"))).thenReturn(mockInsertStmt);

        // Stub SELECT output (user has 2 freeze tokens)
        when(mockSelectStmt.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getInt("available_freeze_tokens")).thenReturn(2);

        java.sql.Date missedDate = java.sql.Date.valueOf("2026-06-15");
        
        boolean result = manager.applyAtomicStreakFreeze("user-123", "streak-456", missedDate);

        // Verify successful execution path
        assertTrue(result);

        // Verify transaction configurations and boundary operations
        verify(mockConnection).setAutoCommit(false);
        verify(mockSelectStmt).setString(1, "user-123");
        verify(mockUpdateStmt).setString(1, "user-123");
        verify(mockInsertStmt).setString(eq(2), eq("streak-456"));
        verify(mockInsertStmt).setDate(eq(3), eq(missedDate));
        
        verify(mockConnection).commit();
        verify(mockConnection, never()).rollback();
        verify(mockConnection).close();
    }

    @Test
    public void testApplyFreezeFailsIfNoTokens() throws SQLException {
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(startsWith("SELECT"))).thenReturn(mockSelectStmt);

        // Stub SELECT output (user has 0 freeze tokens)
        when(mockSelectStmt.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getInt("available_freeze_tokens")).thenReturn(0);

        boolean result = manager.applyAtomicStreakFreeze("user-123", "streak-456", java.sql.Date.valueOf("2026-06-15"));

        // Verify failure returned
        assertFalse(result);

        // Verify transactional rollback executed
        verify(mockConnection).setAutoCommit(false);
        verify(mockConnection).rollback();
        verify(mockConnection, never()).commit();
        verify(mockConnection).close();
    }

    @Test
    public void testApplyFreezeFailsIfNoRecord() throws SQLException {
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(startsWith("SELECT"))).thenReturn(mockSelectStmt);

        // Stub SELECT output (user record not found in vault)
        when(mockSelectStmt.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(false);

        boolean result = manager.applyAtomicStreakFreeze("user-123", "streak-456", java.sql.Date.valueOf("2026-06-15"));

        // Verify failure returned
        assertFalse(result);

        // Verify rollback
        verify(mockConnection).rollback();
        verify(mockConnection, never()).commit();
    }

    @Test
    public void testApplyFreezeRollsBackOnSqlException() throws SQLException {
        when(mockDataSource.getConnection()).thenReturn(mockConnection);
        when(mockConnection.prepareStatement(startsWith("SELECT"))).thenReturn(mockSelectStmt);
        when(mockConnection.prepareStatement(startsWith("UPDATE"))).thenReturn(mockUpdateStmt);

        // Stub SELECT output (tokens exist)
        when(mockSelectStmt.executeQuery()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getInt("available_freeze_tokens")).thenReturn(1);

        // Stub UPDATE to throw Exception
        when(mockUpdateStmt.executeUpdate()).thenThrow(new SQLException("Update error"));

        boolean result = manager.applyAtomicStreakFreeze("user-123", "streak-456", java.sql.Date.valueOf("2026-06-15"));

        // Verify failure returned
        assertFalse(result);

        // Verify rollback triggered
        verify(mockConnection).rollback();
        verify(mockConnection, never()).commit();
    }
}

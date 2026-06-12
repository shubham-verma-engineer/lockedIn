package com.lockedin.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

public class TimezoneEvaluatorTest {

    private TimezoneEvaluator evaluator;

    @BeforeEach
    public void setUp() {
        evaluator = new TimezoneEvaluator();
    }

    /**
     * STK-202 Acceptance Criteria 1:
     * An active logging API request incoming at 01:30 AM local time on a Tuesday calendar day
     * must be written into PostgreSQL storage records under a Monday date identifier.
     */
    @Test
    public void testLogicalDateWithinGracePeriod() {
        // Tuesday, June 16, 2026 at 01:30:00 AM local time in America/Los_Angeles (PDT, UTC-7)
        // Tuesday 01:30:00 AM PDT = Tuesday 08:30:00 AM UTC
        Instant eventTime = Instant.parse("2026-06-16T08:30:00Z");
        String timezone = "America/Los_Angeles";

        LocalDate logicalDate = evaluator.getLogicalDate(eventTime, timezone);

        // Monday calendar date is expected (June 15, 2026)
        assertEquals(LocalDate.of(2026, 6, 15), logicalDate);
    }

    /**
     * STK-202 Acceptance Criteria 2:
     * An active logging API request incoming at 04:15 AM local time on a Tuesday calendar day
     * must evaluate under a Tuesday date identifier, marking Monday as missed.
     */
    @Test
    public void testLogicalDateOutsideGracePeriod() {
        // Tuesday, June 16, 2026 at 04:15:00 AM local time in America/Los_Angeles (PDT, UTC-7)
        // Tuesday 04:15:00 AM PDT = Tuesday 11:15:00 AM UTC
        Instant eventTime = Instant.parse("2026-06-16T11:15:00Z");
        String timezone = "America/Los_Angeles";

        LocalDate logicalDate = evaluator.getLogicalDate(eventTime, timezone);

        // Tuesday calendar date is expected (June 16, 2026)
        assertEquals(LocalDate.of(2026, 6, 16), logicalDate);
    }

    /**
     * STK-202 Acceptance Criteria 3:
     * Clean evaluation of historical IANA string identifiers using native Java ZoneId features
     * without execution layer collapse (should fallback to UTC instead of throwing exception).
     */
    @Test
    public void testInvalidTimezoneGracefulFallback() {
        // Thursday, June 18, 2026 at 12:00:00 PM UTC
        Instant eventTime = Instant.parse("2026-06-18T12:00:00Z");
        
        // Pass an invalid timezone name
        String invalidTimezone = "Invalid/Timezone_Name";

        // Must NOT collapse/throw exception, but fall back to UTC
        LocalDate logicalDate = assertDoesNotThrow(() -> 
            evaluator.getLogicalDate(eventTime, invalidTimezone)
        );

        // UTC: June 18, 2026 at 12:00:00 PM
        // Minus 3 hours grace: June 18, 2026 at 09:00:00 AM
        // Expected date: June 18, 2026
        assertEquals(LocalDate.of(2026, 6, 18), logicalDate);
    }

    @Test
    public void testNullOrEmptyTimezoneGracefulFallback() {
        Instant eventTime = Instant.parse("2026-06-18T12:00:00Z");

        LocalDate dateFromNull = assertDoesNotThrow(() -> 
            evaluator.getLogicalDate(eventTime, null)
        );
        LocalDate dateFromEmpty = assertDoesNotThrow(() -> 
            evaluator.getLogicalDate(eventTime, "   ")
        );

        assertEquals(LocalDate.of(2026, 6, 18), dateFromNull);
        assertEquals(LocalDate.of(2026, 6, 18), dateFromEmpty);
    }

    @Test
    public void testValidHistoricalIanaTimezones() {
        // Thursday, June 18, 2026 at 02:00:00 AM local time in Asia/Kolkata (IST, UTC+5:30)
        // Thursday 02:00:00 AM IST = Wednesday June 17, 2026, 08:30:00 PM UTC
        Instant eventTime = Instant.parse("2026-06-17T20:30:00Z");
        String timezone = "Asia/Kolkata";

        LocalDate logicalDate = evaluator.getLogicalDate(eventTime, timezone);

        // Thursday 02:00:00 AM IST minus 3 hours grace -> Wednesday 11:00:00 PM IST
        // Expected date: Wednesday June 17, 2026
        assertEquals(LocalDate.of(2026, 6, 17), logicalDate);
    }

    @Test
    public void testNullTimestampThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> 
            evaluator.getLogicalDate(null, "America/Los_Angeles")
        );
    }
}

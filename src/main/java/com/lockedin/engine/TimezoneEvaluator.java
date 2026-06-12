package com.lockedin.engine;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.logging.Logger;

public class TimezoneEvaluator {
    private static final Logger LOGGER = Logger.getLogger(TimezoneEvaluator.class.getName());
    
    // 3-hour backward grace period window (W_g = 3 hours)
    private static final int GRACE_PERIOD_HOURS = 3;
    private static final ZoneId DEFAULT_FALLBACK_ZONE = ZoneOffset.UTC;

    /**
     * Resolves the logical operational date for a given event timestamp and user timezone.
     * Incorporates the 3-hour Night-Owl grace period.
     *
     * @param eventUtcTime The Instant the event occurred (in UTC).
     * @param timezoneId   The user's IANA timezone identifier.
     * @return The logical LocalDate credited for the activity.
     */
    public LocalDate getLogicalDate(Instant eventUtcTime, String timezoneId) {
        if (eventUtcTime == null) {
            throw new IllegalArgumentException("Event timestamp cannot be null");
        }
        
        ZoneId zoneId = resolveZoneId(timezoneId);
        
        // Convert the UTC Instant to the user's local ZonedDateTime
        ZonedDateTime localTime = eventUtcTime.atZone(zoneId);
        
        // Apply the 3-hour backward grace period adjustment: T_logical = T_local - W_g
        ZonedDateTime logicalTime = localTime.minusHours(GRACE_PERIOD_HOURS);
        
        // Extract the calendar date of the logical time
        return logicalTime.toLocalDate();
    }

    /**
     * Resolves an IANA timezone identifier into a Java ZoneId.
     * Gracefully falls back to UTC if the identifier is invalid or empty to prevent collapse.
     *
     * @param timezoneId The user's designated timezone ID.
     * @return The resolved ZoneId, or UTC fallback.
     */
    public ZoneId resolveZoneId(String timezoneId) {
        if (timezoneId == null || timezoneId.trim().isEmpty()) {
            LOGGER.warning("Timezone ID is null or empty. Falling back to UTC.");
            return DEFAULT_FALLBACK_ZONE;
        }
        
        try {
            return ZoneId.of(timezoneId.trim());
        } catch (Exception e) {
            LOGGER.warning("Invalid IANA timezone identifier: '" + timezoneId + "'. Falling back to UTC. Error: " + e.getMessage());
            return DEFAULT_FALLBACK_ZONE;
        }
    }
}

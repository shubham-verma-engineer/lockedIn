package com.lockedin.controller;

public record StreakConfigRequest(
    String streakId,
    String accountId,
    String activityIdentifier,
    String localScheduledTime, // "HH:mm:ss" or "HH:mm:00"
    String targetIanaTimezone,
    String customAnchorParagraph,
    String selectedArchetype
) {}

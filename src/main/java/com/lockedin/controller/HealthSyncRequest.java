package com.lockedin.controller;

public record HealthSyncRequest(
    String accountId,
    String streakId,
    Integer steps,
    Integer sleepMinutes,
    String timestampUtc,
    String timezoneId
) {}

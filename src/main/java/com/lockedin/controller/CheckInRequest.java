package com.lockedin.controller;

public record CheckInRequest(
    String streakId,
    String timezoneId,
    String timestampUtc // e.g. "2026-06-16T08:30:00Z"
) {}

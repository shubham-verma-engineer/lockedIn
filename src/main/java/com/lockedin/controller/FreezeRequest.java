package com.lockedin.controller;

public record FreezeRequest(
    String accountId,
    String streakId,
    String missedDate // "YYYY-MM-DD"
) {}

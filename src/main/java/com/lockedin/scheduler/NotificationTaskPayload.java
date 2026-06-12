package com.lockedin.scheduler;

/**
 * JVM record holding payload for asynchronous notifications.
 */
public record NotificationTaskPayload(
    String userId, 
    String streakId, 
    String archetype
) {}

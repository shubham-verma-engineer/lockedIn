package com.lockedin.engine;

// Immutable unified context package passed to execution strategies
public record MotivationContext(
    String userId,
    String username,
    String goalTitle,
    String targetTime,
    String customAnchorText,
    String archetype
) {}

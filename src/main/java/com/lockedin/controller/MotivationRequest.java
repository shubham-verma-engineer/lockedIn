package com.lockedin.controller;

public record MotivationRequest(
    String userId,
    String username,
    String goalTitle,
    String targetTime,
    String customAnchorText,
    String archetype
) {}

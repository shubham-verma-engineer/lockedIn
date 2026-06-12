package com.lockedin.engine;

// Shared Strategy Contract Interface
public interface MotivationEngine {
    String generateMessage(MotivationContext context);
    boolean supports(String userTier);
}

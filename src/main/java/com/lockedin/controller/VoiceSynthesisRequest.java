package com.lockedin.controller;

public record VoiceSynthesisRequest(
    MotivationRequest motivationRequest,
    String voiceCloneId,
    boolean simulateFailure
) {}

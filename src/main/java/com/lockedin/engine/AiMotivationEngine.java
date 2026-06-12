package com.lockedin.engine;

public class AiMotivationEngine implements MotivationEngine {
    private final LlmClient llmClient; // Internal HTTP abstraction for OpenAI/Anthropic SDK

    public AiMotivationEngine(LlmClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public String generateMessage(MotivationContext context) {
        String systemPrompt = String.format(
            "You are an aggressive accountability coach using a strict %s persona. " +
            "CRITICAL: Do NOT insult physical weight, appearance, race, or gender. " +
            "Focus entirely on attacking excuses and laziness.",
            context.archetype()
        );
        String userPrompt = String.format(
            "User: %s. Habit: %s at %s. Core Emotional Anchor: '%s'. " +
            "Generate a crisp 2-sentence roast reminder.",
            context.username(), 
            context.goalTitle(), 
            context.targetTime(), 
            context.customAnchorText()
        );
        return llmClient.call(systemPrompt, userPrompt);
    }

    @Override
    public boolean supports(String userTier) {
        return "PREMIUM".equalsIgnoreCase(userTier);
    }
}

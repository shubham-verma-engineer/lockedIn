package com.lockedin.engine;

import java.util.Map;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class TemplateMotivationEngine implements MotivationEngine {
    private final Map<String, List<String>> templates = Map.of(
        "CASUAL", List.of(
            "Yo %s, time for %s at %s. Don't ghost your goals bro.",
            "Hey! %s is happening at %s. Let's secure the dub today."
        ),
        "STRICT", List.of(
            "%s: Remember why you started: '%s'. It is %s. Go now.",
            "No excuses %s. Your schedule says %s at %s. Execution over emotion."
        )
    );

    @Override
    public String generateMessage(MotivationContext context) {
        List<String> options = templates.getOrDefault(
            context.archetype().toUpperCase(), 
            templates.get("CASUAL")
        );
        String randomTemplate = options.get(ThreadLocalRandom.current().nextInt(options.size()));
        return String.format(
            randomTemplate, 
            context.username(), 
            context.goalTitle(), 
            context.targetTime()
        );
    }

    @Override
    public boolean supports(String userTier) {
        return "FREE".equalsIgnoreCase(userTier) || "FALLBACK".equalsIgnoreCase(userTier);
    }
}

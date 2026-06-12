package com.lockedin.engine;

import java.util.List;
import java.util.logging.Logger;

public class MotivationEngineRouter {
    private static final Logger LOGGER = Logger.getLogger(MotivationEngineRouter.class.getName());
    
    private final List<MotivationEngine> engines;
    
    // Mapped character archetype profiles based on PRD-F02: Casual, Professional, Strict, 18+ Abusive
    private static final List<String> VALID_ARCHETYPES = List.of(
        "CASUAL", 
        "PROFESSIONAL", 
        "STRICT", 
        "18+ ABUSIVE", 
        "ABUSIVE"
    );

    public MotivationEngineRouter(List<MotivationEngine> engines) {
        this.engines = engines;
    }

    /**
     * Routes the motivational context to the appropriate engine based on the subscription tier
     * and generates the roast/motivational message.
     *
     * @param context  The motivation context containing user details and goals.
     * @param userTier The subscription tier of the user (e.g., "FREE", "PREMIUM").
     * @return The generated motivational message.
     * @throws IllegalArgumentException If the archetype in context is unmapped or invalid.
     * @throws IllegalStateException    If no matching engine is found for the specified user tier.
     */
    public String routeAndGenerate(MotivationContext context, String userTier) {
        // 1. Strict validation of character archetype profiles
        String archetype = context.archetype();
        if (archetype == null || !isValidArchetype(archetype)) {
            String errorMsg = "Explicit runtime anomaly: Unmapped character archetype profile: " + archetype;
            LOGGER.severe(errorMsg);
            throw new IllegalArgumentException(errorMsg);
        }

        // 2. Dynamic polymorphic routing based on supports(userTier)
        MotivationEngine selectedEngine = engines.stream()
            .filter(engine -> engine.supports(userTier))
            .findFirst()
            .orElseThrow(() -> {
                String errorMsg = "No supported engine strategy found for subscription tier: " + userTier;
                LOGGER.severe(errorMsg);
                return new IllegalStateException(errorMsg);
            });

        return selectedEngine.generateMessage(context);
    }

    private boolean isValidArchetype(String archetype) {
        String normalized = archetype.trim().toUpperCase();
        return VALID_ARCHETYPES.contains(normalized);
    }
}

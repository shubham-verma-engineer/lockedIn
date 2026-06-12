package com.lockedin.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MotivationEngineRouterTest {

    @Mock
    private LlmClient mockLlmClient;

    private TemplateMotivationEngine templateEngine;
    private AiMotivationEngine aiEngine;
    private MotivationEngineRouter router;

    @BeforeEach
    public void setUp() {
        templateEngine = new TemplateMotivationEngine();
        aiEngine = new AiMotivationEngine(mockLlmClient);
        // Register polymorphic engines in the router
        router = new MotivationEngineRouter(List.of(templateEngine, aiEngine));
    }

    @Test
    public void testRouterSelectsTemplateEngineForFreeTier() {
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            "CASUAL"
        );

        String result = router.routeAndGenerate(context, "FREE");
        
        assertNotNull(result);
        assertTrue(result.contains("Shubham") || result.contains("Gym check-in"));
        LOGGER_ASSERT("FREE", "CASUAL");
    }

    @Test
    public void testRouterSelectsTemplateEngineForFallbackTier() {
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            "STRICT"
        );

        String result = router.routeAndGenerate(context, "FALLBACK");
        
        assertNotNull(result);
        assertTrue(result.contains("Shubham"));
    }

    @Test
    public void testRouterSelectsAiEngineForPremiumTier() {
        MotivationContext context = new MotivationContext(
            "user-999",
            "Jane",
            "Code 2 hours",
            "10:00 PM",
            "Consistency is key",
            "STRICT"
        );

        String expectedMessage = "Jane, stop procrastinating on your Code 2 hours. Go now!";
        when(mockLlmClient.call(anyString(), anyString())).thenReturn(expectedMessage);

        String result = router.routeAndGenerate(context, "PREMIUM");

        assertEquals(expectedMessage, result);
        
        // Verify correct system and user prompts are passed
        verify(mockLlmClient).call(
            contains("aggressive accountability coach"),
            contains("Jane")
        );
        verify(mockLlmClient).call(
            contains("STRICT"),
            contains("Consistency is key")
        );
    }

    @Test
    public void testRouterThrowsAnomalyForInvalidArchetype() {
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            "INVALID_ARCHETYPE_NAME"
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            router.routeAndGenerate(context, "FREE");
        });

        assertTrue(exception.getMessage().contains("Explicit runtime anomaly"));
        assertTrue(exception.getMessage().contains("INVALID_ARCHETYPE_NAME"));
    }

    @Test
    public void testRouterThrowsAnomalyForNullArchetype() {
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            null
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            router.routeAndGenerate(context, "FREE");
        });

        assertTrue(exception.getMessage().contains("Explicit runtime anomaly"));
    }

    @Test
    public void testRouterThrowsStateExceptionForUnmatchedUserTier() {
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            "CASUAL"
        );

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            router.routeAndGenerate(context, "UNKNOWN_TIER");
        });

        assertTrue(exception.getMessage().contains("No supported engine strategy found"));
    }

    @Test
    public void testValidArchetypesCaseInsensitive() {
        // "strict" should pass validation as "STRICT"
        MotivationContext context = new MotivationContext(
            "user-123",
            "Shubham",
            "Gym check-in",
            "07:30 AM",
            "Don't lose gains",
            "strict"
        );

        String result = router.routeAndGenerate(context, "FREE");
        assertNotNull(result);
    }

    @Test
    public void testTemplateEngineGeneratesProperTemplates() {
        MotivationContext contextCasual = new MotivationContext(
            "u1", "Alice", "Run", "8:00 AM", "Health", "CASUAL"
        );
        String msgCasual = templateEngine.generateMessage(contextCasual);
        assertTrue(msgCasual.contains("Alice") && msgCasual.contains("Run"));

        MotivationContext contextStrict = new MotivationContext(
            "u1", "Bob", "Study", "9:00 PM", "Career", "STRICT"
        );
        String msgStrict = templateEngine.generateMessage(contextStrict);
        assertTrue(msgStrict.contains("Bob") && msgStrict.contains("Study") && msgStrict.contains("9:00 PM"));
    }

    private void LOGGER_ASSERT(String tier, String archetype) {
        // Utility for dry assertions if needed
    }
}

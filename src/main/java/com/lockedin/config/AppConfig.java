package com.lockedin.config;

import com.lockedin.engine.*;
import com.lockedin.scheduler.MessageQueueBroker;
import com.lockedin.scheduler.NotificationScheduler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.List;

@Configuration
public class AppConfig {

    @Bean
    public TimezoneEvaluator timezoneEvaluator() {
        return new TimezoneEvaluator();
    }

    @Bean
    public LlmClient llmClient() {
        // Simple default LLM client implementation for DI resolution
        return (systemPrompt, userPrompt) -> 
            "Generative AI Roast: (Excuses ignored. Attack laziness.) Context: " + userPrompt;
    }

    @Bean
    public TemplateMotivationEngine templateMotivationEngine() {
        return new TemplateMotivationEngine();
    }

    @Bean
    public AiMotivationEngine aiMotivationEngine(LlmClient llmClient) {
        return new AiMotivationEngine(llmClient);
    }

    @Bean
    public MotivationEngineRouter motivationEngineRouter(List<MotivationEngine> engines) {
        return new MotivationEngineRouter(engines);
    }

    @Bean
    public MessageQueueBroker messageQueueBroker() {
        // Default console-logging message queue broker
        return (queueName, payload) -> 
            System.out.println("[BROKER] Published task to queue '" + queueName + "': " + payload);
    }

    @Bean
    public StreakFreezeManager streakFreezeManager(DataSource dataSource) {
        return new StreakFreezeManager(dataSource);
    }

    @Bean
    public GroupStreakFreezeManager groupStreakFreezeManager(DataSource dataSource) {
        return new GroupStreakFreezeManager(dataSource);
    }

    @Bean
    public NotificationScheduler notificationScheduler(DataSource dataSource, MessageQueueBroker messageQueueBroker) {
        return new NotificationScheduler(dataSource, messageQueueBroker);
    }
}

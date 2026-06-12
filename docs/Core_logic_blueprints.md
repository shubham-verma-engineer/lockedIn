# 4. Low-Level Core Logic & Code Blueprints (100% Java)

## 4.1 Runtime Motivation Engine Strategy Architecture

Below is the decouple-ready structure using Java records and interfaces to support hot-swapping baseline template compilers and advanced LLM orchestrators cleanly at run time.

### `MotivationContext.java` & `MotivationEngine.java`

```java
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
```

```java
package com.lockedin.engine;

// Shared Strategy Contract Interface
public interface MotivationEngine {
    String generateMessage(MotivationContext context);
    boolean supports(String userTier);
}
```

---

## 4.1.1 Local Static Template Implementation (Phase 1 Baseline)

### `TemplateMotivationEngine.java`

```java
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
```

---

## 4.1.2 Dynamic Generative AI Implementation (Phase 2 Premium Upgrade)

### `AiMotivationEngine.java`

```java
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
```

---

## 4.2 High-Throughput High-Scale Async Scheduler Task Producer

### `NotificationScheduler.java`

```java
package com.lockedin.scheduler;

import java.sql.*;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import javax.sql.DataSource;

public class NotificationScheduler {
    private final DataSource dataSource;
    private final MessageQueueBroker queueBroker;

    public NotificationScheduler(DataSource dataSource, MessageQueueBroker queueBroker) {
        this.dataSource = dataSource;
        this.queueBroker = queueBroker;
    }

    public void runMinutePoll() {
        ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
        String currentMinute = nowUtc.format(DateTimeFormatter.ofPattern("HH:mm:00"));
        String query = "SELECT us.user_id, us.streak_id, us.selected_archetype " +
                       "FROM app_user_streaks us " +
                       "LEFT JOIN customer_activity_logs sl ON us.streak_id = sl.streak_id " +
                       "AND sl.resolved_calendar_date = CURRENT_DATE " +
                       "WHERE us.local_scheduled_time = ? AND sl.log_id IS NULL;";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setTime(1, Time.valueOf(currentMinute));
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    NotificationTaskPayload payload = new NotificationTaskPayload(
                        rs.getString("user_id"),
                        rs.getString("streak_id"),
                        rs.getString("selected_archetype")
                    );
                    queueBroker.push("lockedin_notification_dispatch_queue", payload);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

```java
package com.lockedin.scheduler;

public record NotificationTaskPayload(String userId, String streakId, String archetype) {}
```

---

## 4.3 Pessimistic Transaction Boundary Isolation (Streak Freeze Manager)

### `StreakFreezeManager.java`

```java
package com.lockedin.engine;

import java.sql.*;
import java.util.UUID;
import javax.sql.DataSource;

public class StreakFreezeManager {
    private final DataSource dataSource;

    public StreakFreezeManager(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean applyAtomicStreakFreeze(String userId, String streakId, java.sql.Date targetMissedDate) {
        String selectLockQuery = "SELECT available_freeze_tokens FROM account_inventory_vault WHERE account_id = ? FOR UPDATE;";
        String updateInventoryQuery = "UPDATE account_inventory_vault SET available_freeze_tokens = available_freeze_tokens - 1 WHERE account_id = ?;";
        String insertLogQuery = "INSERT INTO customer_activity_logs (log_id, streak_id, resolved_calendar_date, execution_state, server_utc_timestamp) VALUES (?, ?, ?, 'FROZEN', CURRENT_TIMESTAMP);";

        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // BEGIN TRANSACTION Explicit Boundaries

            // 1. Row-level pessimistic isolation lock on target user inventory record
            try (PreparedStatement lockStmt = conn.prepareStatement(selectLockQuery)) {
                lockStmt.setString(1, userId);
                try (ResultSet rs = lockStmt.executeQuery()) {
                    if (!rs.next() || rs.getInt("available_freeze_tokens") <= 0) {
                        conn.rollback();
                        return false; 
                    }
                }
            }

            // 2. Deduct a single asset unit from inventory balance
            try (PreparedStatement updateStmt = conn.prepareStatement(updateInventoryQuery)) {
                updateStmt.setString(1, userId);
                updateStmt.executeUpdate();
            }

            // 3. Inject safety frozen activity log entry to protect streak progression
            try (PreparedStatement insertStmt = conn.prepareStatement(insertLogQuery)) {
                insertStmt.setString(1, UUID.randomUUID().toString());
                insertStmt.setString(2, streakId);
                insertStmt.setDate(3, targetMissedDate);
                insertStmt.executeUpdate();
            }

            conn.commit(); // COMMIT Transaction operations atomically
            return true;
        } catch (SQLException error) {
            if (conn != null) {
                try { 
                    conn.rollback(); 
                } catch (SQLException re) { 
                    re.printStackTrace(); 
                }
            }
            error.printStackTrace();
            return false;
        } finally {
            if (conn != null) {
                try { 
                    conn.close(); 
                } catch (SQLException ce) { 
                    ce.printStackTrace(); 
                }
            }
        }
    }
}
```

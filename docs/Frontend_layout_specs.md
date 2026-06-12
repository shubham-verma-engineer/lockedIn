# 5. Frontend Integration Tokens & Mobile Layout Specs

## 5.1 Design System Color Token Constants

| Design Token Code String | Hex System Value | Functional UI Application Rules |
| :--- | :--- | :--- |
| `COLOR_BG_PRIMARY` | `#090d16` | Deep Dark Matte Obsidian canvas frame base background. |
| `COLOR_STATE_ACTIVE` | `#00ffcc` | High-vibrancy electric Cyan line; system loops are logged and intact. |
| `COLOR_STATE_WARNING` | `#ffcc00` | Amber alert flare; deadline cutoff limit approaching rapidly. |
| `COLOR_STATE_CRITICAL` | `#ff3366` | Crimson alert overlay; streak is broken and active roasts are enabled. |
| `COLOR_STATE_FROZEN` | `#77b5fe` | Translucent ice-blue mesh; active freeze shield protect mechanism. |

---

## 5.2 Native Android Java Interactive Notification Layout Construction

### `NotificationActionFactory.java`

```java
package com.lockedin.client.notification;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;

public class NotificationActionFactory {
    
    public static NotificationCompat.Action createCompleteAction(Context context, String streakId) {
        Intent intent = new Intent(context, StreakActionReceiver.class);
        intent.setAction("ACTION_STREAK_LOG_COMPLETE");
        intent.putExtra("STREAK_ID", streakId);
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 
            streakId.hashCode(), 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_add, 
            "Log Habit Now ✅", 
            pendingIntent
        ).build();
    }

    public static NotificationCompat.Action createFreezeAction(Context context, String streakId) {
        Intent intent = new Intent(context, StreakActionReceiver.class);
        intent.setAction("ACTION_STREAK_LOG_SKIP");
        intent.putExtra("STREAK_ID", streakId);
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 
            streakId.hashCode(), 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_close_clear_cancel, 
            "Skip Day (Burn Freeze) 🛡️", 
            pendingIntent
        ).build();
    }
}
```

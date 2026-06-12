package com.lockedin.client.notification;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;

public class NotificationActionFactory {
    
    /**
     * Creates an Action to complete a habit check-in directly from the notification.
     */
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

    /**
     * Creates an Action to freeze/skip a habit deadline directly from the notification.
     */
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

package com.lockedin.client.notification;

import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.R;
import androidx.core.app.NotificationCompat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class NotificationActionFactoryTest {

    private Context context;

    @BeforeEach
    public void setUp() {
        context = new Context();
    }

    @Test
    public void testCreateCompleteAction() {
        String streakId = "test-streak-123";
        
        NotificationCompat.Action action = NotificationActionFactory.createCompleteAction(context, streakId);

        assertNotNull(action);
        assertEquals(R.drawable.ic_menu_add, action.getIcon());
        assertEquals("Log Habit Now ✅", action.getTitle());

        PendingIntent pendingIntent = action.getActionIntent();
        assertNotNull(pendingIntent);

        Intent intent = pendingIntent.getIntent();
        assertNotNull(intent);
        assertEquals("ACTION_STREAK_LOG_COMPLETE", intent.getAction());
        assertEquals(streakId, intent.getStringExtra("STREAK_ID"));
    }

    @Test
    public void testCreateFreezeAction() {
        String streakId = "test-streak-999";

        NotificationCompat.Action action = NotificationActionFactory.createFreezeAction(context, streakId);

        assertNotNull(action);
        assertEquals(R.drawable.ic_menu_close_clear_cancel, action.getIcon());
        assertEquals("Skip Day (Burn Freeze) 🛡️", action.getTitle());

        PendingIntent pendingIntent = action.getActionIntent();
        assertNotNull(pendingIntent);

        Intent intent = pendingIntent.getIntent();
        assertNotNull(intent);
        assertEquals("ACTION_STREAK_LOG_SKIP", intent.getAction());
        assertEquals(streakId, intent.getStringExtra("STREAK_ID"));
    }
}

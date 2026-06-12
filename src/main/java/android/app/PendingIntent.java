package android.app;

import android.content.Context;
import android.content.Intent;

/**
 * Compile-time stub for android.app.PendingIntent.
 */
public class PendingIntent {
    public static final int FLAG_UPDATE_CURRENT = 1 << 27;
    public static final int FLAG_IMMUTABLE = 1 << 26;

    private final Intent intent;

    private PendingIntent(Intent intent) {
        this.intent = intent;
    }

    public static PendingIntent getBroadcast(Context context, int requestCode, Intent intent, int flags) {
        return new PendingIntent(intent);
    }

    public Intent getIntent() {
        return this.intent;
    }
}

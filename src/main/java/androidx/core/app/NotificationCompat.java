package androidx.core.app;

import android.app.PendingIntent;

/**
 * Compile-time stub for androidx.core.app.NotificationCompat.
 */
public class NotificationCompat {
    
    public static class Action {
        private final int icon;
        private final CharSequence title;
        private final PendingIntent actionIntent;

        public Action(int icon, CharSequence title, PendingIntent intent) {
            this.icon = icon;
            this.title = title;
            this.actionIntent = intent;
        }

        public int getIcon() {
            return icon;
        }

        public CharSequence getTitle() {
            return title;
        }

        public PendingIntent getActionIntent() {
            return actionIntent;
        }

        public static class Builder {
            private final int icon;
            private final CharSequence title;
            private final PendingIntent intent;

            public Builder(int icon, CharSequence title, PendingIntent intent) {
                this.icon = icon;
                this.title = title;
                this.intent = intent;
            }

            public Action build() {
                return new Action(icon, title, intent);
            }
        }
    }
}

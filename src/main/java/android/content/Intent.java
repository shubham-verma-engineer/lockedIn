package android.content;

import java.util.HashMap;
import java.util.Map;

/**
 * Compile-time stub for android.content.Intent.
 */
public class Intent {
    private String action;
    private final Map<String, Object> extras = new HashMap<>();

    public Intent(Context context, Class<?> cls) {}

    public Intent setAction(String action) {
        this.action = action;
        return this;
    }

    public String getAction() {
        return this.action;
    }

    public Intent putExtra(String name, String value) {
        extras.put(name, value);
        return this;
    }

    public String getStringExtra(String name) {
        return (String) extras.get(name);
    }
}

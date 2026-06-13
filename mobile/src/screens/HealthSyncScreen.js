import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';

export default function HealthSyncScreen({ serverUrl, accountId, refreshTrigger, setRefreshTrigger }) {
  const [streaks, setStreaks] = useState([]);
  const [selectedStreak, setSelectedStreak] = useState(null);
  const [steps, setSteps] = useState('6000');
  const [sleepMinutes, setSleepMinutes] = useState('400');
  const [timestamp, setTimestamp] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  const fetchStreaks = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/streaks?accountId=${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setStreaks(data);
        if (data.length > 0 && !selectedStreak) {
          setSelectedStreak(data[0]);
        }
      }
    } catch (error) {
      console.log('Error fetching streaks for health sync:', error);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, [serverUrl, accountId, refreshTrigger]);

  const handleSync = async () => {
    if (!selectedStreak) {
      Alert.alert('Selection Required', 'Please configure and select a habit first!');
      return;
    }

    setLoading(true);
    const streakId = selectedStreak.STREAK_ID || selectedStreak.streak_id;

    try {
      const response = await fetch(`${serverUrl}/api/sync/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          streakId,
          steps: steps ? parseInt(steps, 10) : null,
          sleepMinutes: sleepMinutes ? parseInt(sleepMinutes, 10) : null,
          timestampUtc: timestamp || new Date().toISOString(),
          timezoneId: timezone,
        }),
      });

      const text = await response.text();
      if (response.ok) {
        Alert.alert('Sync Successful', text);
        setRefreshTrigger(prev => prev + 1);
      } else {
        Alert.alert('Sync Processed', text);
      }
    } catch (error) {
      Alert.alert('Error', 'Telemetry sync failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTimestampToNow = () => {
    setTimestamp(new Date().toISOString());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>SMARTWATCH TELEMETRY SYNC</Text>
      
      {/* Ingestion Validation info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔥 Ingestion Validation Rules</Text>
        <Text style={styles.infoText}>• Step count threshold must be ≥ 5,000 steps OR</Text>
        <Text style={styles.infoText}>• Sleep duration threshold must be ≥ 360 minutes (6 hours)</Text>
      </View>

      {/* Select Streak */}
      <Text style={styles.label}>TARGET HABIT</Text>
      {streaks.length === 0 ? (
        <Text style={styles.noStreakLabel}>⚠️ No active habits configured yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPillsScroll}>
          {streaks.map((item) => {
            const streakId = item.STREAK_ID || item.streak_id;
            const activity = item.ACTIVITY_IDENTIFIER || item.activity_identifier;
            const isSelected = selectedStreak && (selectedStreak.STREAK_ID === streakId || selectedStreak.streak_id === streakId);
            return (
              <TouchableOpacity
                key={streakId}
                style={[styles.pillItem, isSelected && styles.pillItemActive]}
                onPress={() => setSelectedStreak(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  🎯 {activity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Steps Count Input */}
      <Text style={styles.label}>STEP COUNT (SIMULATED)</Text>
      <TextInput
        style={styles.input}
        value={steps}
        onChangeText={setSteps}
        keyboardType="numeric"
        placeholder="e.g. 6000"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Sleep duration Input */}
      <Text style={styles.label}>SLEEP DURATION (MINUTES)</Text>
      <TextInput
        style={styles.input}
        value={sleepMinutes}
        onChangeText={setSleepMinutes}
        keyboardType="numeric"
        placeholder="e.g. 400"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Custom UTC Timestamp */}
      <View style={styles.timestampHeaderRow}>
        <Text style={styles.label}>TELEMETRY UTC TIMESTAMP</Text>
        <TouchableOpacity style={styles.nowBtn} onPress={updateTimestampToNow} activeOpacity={0.7}>
          <Text style={styles.nowBtnText}>Use Current Time</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, styles.monospaceText]}
        value={timestamp}
        onChangeText={setTimestamp}
        placeholder="e.g. 2026-06-16T08:30:00Z"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Timezone */}
      <Text style={styles.label}>DEVICE TIMEZONE</Text>
      <TextInput
        style={styles.input}
        value={timezone}
        onChangeText={setTimezone}
        placeholder="America/Los_Angeles"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Sync Button */}
      <TouchableOpacity 
        style={styles.syncBtn} 
        onPress={handleSync} 
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.COLOR_BG_PRIMARY} />
        ) : (
          <Text style={styles.syncBtnText}>🔄 SYNC TELEMETRY DATA</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
  },
  content: {
    padding: 20,
    paddingBottom: 110, // Avoid bottom floating capsule overlay
  },
  title: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.COLOR_BORDER_LIGHT,
    paddingBottom: 10,
  },
  infoCard: {
    backgroundColor: COLORS.COLOR_PASTEL_FROZEN, // Soft Glacial blue
    borderLeftWidth: 4,
    borderLeftColor: COLORS.COLOR_STATE_FROZEN, // Glacial Blue
    borderRadius: 4, // Hard-edged
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(119, 181, 254, 0.25)',
  },
  infoTitle: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '850',
    marginBottom: 6,
  },
  infoText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  label: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 6,
  },
  noStreakLabel: {
    color: COLORS.COLOR_STATE_CRITICAL,
    fontSize: 13,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  horizontalPillsScroll: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  pillItem: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    borderRadius: 4, // Hard-edged
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  pillItemActive: {
    backgroundColor: COLORS.COLOR_PASTEL_BRAND,
    borderColor: COLORS.COLOR_BRAND, // Electric Cyan
  },
  pillText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: COLORS.COLOR_BRAND,
  },
  input: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    color: COLORS.COLOR_TEXT_PRIMARY,
    borderRadius: 4, // Hard-edged
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  monospaceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
  },
  timestampHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  nowBtn: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_MEDIUM,
  },
  nowBtnText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  syncBtn: {
    backgroundColor: COLORS.COLOR_BRAND, // Electric Cyan
    borderRadius: 4, // Hard-edged
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.COLOR_BRAND,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  syncBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian text
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});

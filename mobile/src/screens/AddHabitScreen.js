import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';

const ARCHETYPES = [
  { value: 'CASUAL', label: 'Casual', desc: 'Gen-Z slang, slight peer pressure.' },
  { value: 'PROFESSIONAL', label: 'Professional', desc: 'Polite, milestone-focused.' },
  { value: 'STRICT', label: 'Strict', desc: 'Assertive, calls out excuses.' },
  { value: '18+ ABUSIVE', label: '18+ Abusive', desc: 'Raw roasts & tough-love.' },
];

export default function AddHabitScreen({ serverUrl, accountId, navigation, setRefreshTrigger }) {
  const [activityName, setActivityName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('22:00:00');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [anchorText, setAnchorText] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('PROFESSIONAL');
  const [consentOver17, setConsentOver17] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!activityName.trim()) {
      Alert.alert('Field Required', 'Please enter a habit name.');
      return;
    }
    if (selectedArchetype === '18+ ABUSIVE' && !consentOver17) {
      Alert.alert('Age consent Required', 'You must verify that you are 17+ to use the 18+ Abusive persona.');
      return;
    }

    setLoading(true);
    const newStreakId = 'streak-' + Math.floor(Math.random() * 900000 + 100000);
    
    try {
      const response = await fetch(`${serverUrl}/api/streak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streakId: newStreakId,
          accountId,
          activityIdentifier: activityName,
          localScheduledTime: scheduledTime,
          targetIanaTimezone: timezone,
          customAnchorParagraph: anchorText,
          selectedArchetype,
        }),
      });

      const text = await response.text();
      if (response.ok) {
        Alert.alert('Habit Configured', text);
        setActivityName('');
        setAnchorText('');
        setRefreshTrigger(prev => prev + 1);
        if (navigation) {
          navigation.navigate('Dashboard');
        }
      } else {
        Alert.alert('Setup Failed', text);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to configure streak: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CONFIGURE HABIT</Text>

      {/* Habit Name */}
      <Text style={styles.label}>HABIT NAME / ACTIVITY</Text>
      <TextInput
        style={styles.input}
        value={activityName}
        onChangeText={setActivityName}
        placeholder="e.g. Coding Daily, Workout, Read 10 Pages"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Grid Inputs for Scheduled time and Timezone */}
      <View style={styles.gridRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>CUTOFF TIME (HH:MM:SS)</Text>
          <TextInput
            style={styles.input}
            value={scheduledTime}
            onChangeText={setScheduledTime}
            placeholder="22:00:00"
            placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>TIMEZONE (IANA)</Text>
          <TextInput
            style={styles.input}
            value={timezone}
            onChangeText={setTimezone}
            placeholder="America/Los_Angeles"
            placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
          />
        </View>
      </View>

      {/* Custom Anchor */}
      <Text style={styles.label}>EMOTIONAL ANCHOR TEXT (WHY DO THIS?)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={anchorText}
        onChangeText={setAnchorText}
        placeholder="Write what drives you. e.g. No excuses. Stay sharp."
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
        multiline
        numberOfLines={3}
      />

      {/* Archetypes Selector */}
      <Text style={styles.label}>MOTIVATION ARCHETYPE PERSONA</Text>
      <View style={styles.archetypeGrid}>
        {ARCHETYPES.map((arch) => {
          const isSelected = selectedArchetype === arch.value;
          return (
            <TouchableOpacity
              key={arch.value}
              style={[styles.archetypeCard, isSelected && styles.archetypeCardActive]}
              onPress={() => setSelectedArchetype(arch.value)}
              activeOpacity={0.8}
            >
              <View style={styles.archetypeHeader}>
                <Text style={[styles.archetypeTitle, isSelected && styles.archetypeTitleActive]}>
                  {arch.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkIndicator}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.archetypeDesc}>{arch.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Age Lock Consent Gate */}
      {selectedArchetype === '18+ ABUSIVE' && (
        <View style={styles.consentGate}>
          <Text style={styles.consentTitle}>⚠️ Content Safety Consent Gate</Text>
          <Text style={styles.consentText}>
            The 18+ Abusive persona contains explicit roasts and raw tough-love profiling. You must confirm you are over 17 years old to save.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>I consent and am over 17 years old</Text>
            <Switch
              value={consentOver17}
              onValueChange={setConsentOver17}
              trackColor={{ false: COLORS.COLOR_BORDER_MEDIUM, true: COLORS.COLOR_STATE_CRITICAL }}
              thumbColor={consentOver17 ? '#ffffff' : '#4f5e75'}
            />
          </View>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleSave} 
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.submitBtnText}>SAVE MOTIVATION CONFIG</Text>
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 6,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  archetypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  archetypeCard: {
    width: '48%',
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 4, // Hard-edged unyielding
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    padding: 14,
    marginBottom: 14,
  },
  archetypeCardActive: {
    borderColor: COLORS.COLOR_BRAND, // Electric Cyan outline
    backgroundColor: COLORS.COLOR_PASTEL_BRAND,
  },
  archetypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  archetypeTitle: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  archetypeTitleActive: {
    color: COLORS.COLOR_BRAND,
  },
  checkIndicator: {
    width: 16,
    height: 16,
    borderRadius: 2, // Sharp check mark box
    backgroundColor: COLORS.COLOR_BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian text
    fontSize: 10,
    fontWeight: '950',
  },
  archetypeDesc: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 11,
    lineHeight: 15,
  },
  consentGate: {
    backgroundColor: COLORS.COLOR_PASTEL_CRITICAL, // Soft red
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  consentTitle: {
    color: COLORS.COLOR_STATE_CRITICAL,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  consentText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.COLOR_BRAND, // Electric Cyan
    borderRadius: 4, // Hard-edged unyielding
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
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
  submitBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});

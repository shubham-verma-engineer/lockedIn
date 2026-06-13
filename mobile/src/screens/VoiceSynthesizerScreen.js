import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { COLORS } from '../theme/colors';

export default function VoiceSynthesizerScreen({ serverUrl, accountId, refreshTrigger }) {
  const [streaks, setStreaks] = useState([]);
  const [selectedStreak, setSelectedStreak] = useState(null);
  const [voiceCloneId, setVoiceCloneId] = useState('voice-clone-workout-999');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roastText, setRoastText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

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
      console.log('Error fetching streaks for voice synthesizer:', error);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, [serverUrl, accountId, refreshTrigger]);

  const triggerVoiceRoast = async () => {
    if (!selectedStreak) {
      Alert.alert('Error', 'Please configure a habit first on the Add Habit tab!');
      return;
    }

    setLoading(true);
    setRoastText('');
    setAudioUrl('');

    const activity = selectedStreak.ACTIVITY_IDENTIFIER || selectedStreak.activity_identifier;
    const time = selectedStreak.LOCAL_SCHEDULED_TIME || selectedStreak.local_scheduled_time;
    const anchor = selectedStreak.CUSTOM_ANCHOR_PARAGRAPH || selectedStreak.custom_anchor_paragraph;
    const archetype = selectedStreak.SELECTED_ARCHETYPE || selectedStreak.selected_archetype;

    try {
      const response = await fetch(`${serverUrl}/api/motivation/voice?userTier=PREMIUM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivationRequest: {
            userId: accountId,
            username: 'Shubham',
            goalTitle: activity,
            targetTime: time,
            customAnchorText: anchor || 'Stay sharp.',
            archetype: archetype,
          },
          voiceCloneId: voiceCloneId,
          simulateFailure: simulateFailure,
        }),
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(body || 'Server returned error');
      }

      if (body.includes('Voice synthesis successful')) {
        const urlMarker = 'Audio URL: ';
        const textMarker = ' | Text Roast: ';
        
        const urlStart = body.indexOf(urlMarker) + urlMarker.length;
        const urlEnd = body.indexOf(textMarker);
        const relativeUrl = body.substring(urlStart, urlEnd);
        
        const textStart = body.indexOf(textMarker) + textMarker.length;
        const roast = body.substring(textStart);

        setRoastText(roast);
        setAudioUrl(serverUrl + relativeUrl);
      } else {
        setRoastText(body);
        setAudioUrl('');
      }
    } catch (error) {
      Alert.alert('Error', 'Synthesis request failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Playback control is handled dynamically inside the AudioPlayerControl subcomponent

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI VOICE ROAST SYNTHESIZER</Text>

      {/* Select Streak */}
      <Text style={styles.label}>TARGET HABIT FOR ROAST</Text>
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

      {/* Voice Clone Config */}
      <Text style={styles.label}>ELEVENLABS VOICE CLONE ID</Text>
      <TextInput
        style={styles.input}
        value={voiceCloneId}
        onChangeText={setVoiceCloneId}
        placeholder="Enter voice clone ID"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
      />

      {/* Simulate Failure Switch */}
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <Text style={styles.switchLabel}>Simulate Synthesis Failure</Text>
          <Text style={styles.switchHelper}>Test fallback route with text notifications</Text>
        </View>
        <Switch
          value={simulateFailure}
          onValueChange={setSimulateFailure}
          trackColor={{ false: COLORS.COLOR_BORDER_MEDIUM, true: COLORS.COLOR_STATE_CRITICAL }}
          thumbColor={simulateFailure ? '#ffffff' : '#4f5e75'}
        />
      </View>

      {/* Synthesis Button */}
      <TouchableOpacity 
        style={styles.synthesizeBtn} 
        onPress={triggerVoiceRoast} 
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.COLOR_BG_PRIMARY} />
        ) : (
          <Text style={styles.synthesizeBtnText}>📢 GENERATE AI VOICE ROAST</Text>
        )}
      </TouchableOpacity>

      {/* Roast Result Display */}
      {roastText ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultHeader}>GENERATED ROAST MESSAGE</Text>
          <View style={styles.roastBubble}>
            <Text style={styles.roastText}>“{roastText}”</Text>
          </View>

          {audioUrl ? (
            <AudioPlayerControl audioUrl={audioUrl} />
          ) : (
            <View style={styles.fallbackAlert}>
              <Text style={styles.fallbackAlertText}>
                ⚠️ Synthesis failed simulation. Fallback text notification emitted successfully.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function AudioPlayerControl({ audioUrl }) {
  const player = useAudioPlayer({ uri: audioUrl });
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.isPlaying || status?.playing || false;

  const [barHeights, setBarHeights] = useState([16, 28, 20, 36, 24, 42, 30, 18, 12]);

  useEffect(() => {
    if (!isPlaying) {
      setBarHeights([16, 28, 20, 36, 24, 42, 30, 18, 12]);
      return;
    }

    const interval = setInterval(() => {
      setBarHeights([
        Math.floor(Math.random() * 30) + 10,
        Math.floor(Math.random() * 40) + 10,
        Math.floor(Math.random() * 35) + 10,
        Math.floor(Math.random() * 45) + 10,
        Math.floor(Math.random() * 30) + 10,
        Math.floor(Math.random() * 50) + 10,
        Math.floor(Math.random() * 35) + 10,
        Math.floor(Math.random() * 25) + 10,
        Math.floor(Math.random() * 20) + 10,
      ]);
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlaySound = async () => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      Alert.alert('Playback Error', 'Failed to control playback: ' + error.message);
    }
  };

  return (
    <View style={styles.audioPlayerCard}>
      <View style={styles.audioWaveformPlaceholder}>
        {barHeights.map((height, index) => {
          const isCoreAccent = index === 3 || index === 4 || index === 5;
          return (
            <View 
              key={index} 
              style={[
                styles.waveBar, 
                { height: height }, 
                isCoreAccent && { backgroundColor: COLORS.COLOR_STATE_FROZEN }
              ]} 
            />
          );
        })}
      </View>
      <TouchableOpacity 
        style={styles.playBtn} 
        onPress={handlePlaySound}
        activeOpacity={0.8}
      >
        <Text style={styles.playBtnText}>
          {isPlaying ? '⏸️ PAUSE VOICE STREAM' : '▶️ PLAY SECURE AUDIO'}
        </Text>
      </TouchableOpacity>
    </View>
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
    fontSize: 13,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 4, // Hard-edged
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '850',
    marginBottom: 2,
  },
  switchHelper: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 11,
  },
  synthesizeBtn: {
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
  synthesizeBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian text
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 4, // Hard-edged
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    padding: 20,
    marginTop: 28,
  },
  resultHeader: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  roastBubble: {
    backgroundColor: COLORS.COLOR_PASTEL_CRITICAL, // Soft red
    borderLeftWidth: 4,
    borderLeftColor: COLORS.COLOR_STATE_CRITICAL, // Crimson Flare
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 20,
  },
  roastText: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  audioPlayerCard: {
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  audioWaveformPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 16,
    width: '100%',
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.COLOR_BORDER_MEDIUM, // Dark slate bar
    marginHorizontal: 3,
  },
  playBtn: {
    backgroundColor: COLORS.COLOR_STATE_FROZEN, // Glacial Blue
    borderRadius: 4, // Hard-edged
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  playBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  fallbackAlert: {
    backgroundColor: COLORS.COLOR_PASTEL_CRITICAL,
    borderRadius: 4,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.25)',
  },
  fallbackAlertText: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

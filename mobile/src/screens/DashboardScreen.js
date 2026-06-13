import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../theme/colors';

export default function DashboardScreen({ serverUrl, accountId, navigation, refreshTrigger, setRefreshTrigger }) {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for warning states
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchStreaks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/streaks?accountId=${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch streaks');
      }
      const data = await response.json();
      setStreaks(data);
    } catch (error) {
      console.log('Error fetching streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, [serverUrl, accountId, refreshTrigger]);

  const handleCheckIn = async (streakId, tzId) => {
    try {
      const response = await fetch(`${serverUrl}/api/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streakId,
          timezoneId: tzId,
          timestampUtc: new Date().toISOString(),
        }),
      });

      const text = await response.text();
      if (response.ok) {
        Alert.alert('Check-In Successful', text);
        setRefreshTrigger(prev => prev + 1);
      } else {
        Alert.alert('Check-In Failed', text);
      }
    } catch (error) {
      Alert.alert('Error', 'Request failed: ' + error.message);
    }
  };

  const handleFreeze = async (streakId, isGroup = false) => {
    const endpoint = isGroup ? '/api/streak/freeze/group' : '/api/streak/freeze';
    try {
      const response = await fetch(`${serverUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          streakId,
          missedDate: new Date().toISOString().split('T')[0],
        }),
      });

      const text = await response.text();
      if (response.ok) {
        Alert.alert('Freeze Shield Active', text);
        setRefreshTrigger(prev => prev + 1);
      } else {
        Alert.alert('Failed to apply freeze', text);
      }
    } catch (error) {
      Alert.alert('Error', 'Request failed: ' + error.message);
    }
  };

  const isApproachingCutoff = (scheduledTimeStr) => {
    if (!scheduledTimeStr) return false;
    const parts = scheduledTimeStr.split(':');
    if (parts.length < 2) return false;
    const schedHour = parseInt(parts[0], 10);
    const schedMin = parseInt(parts[1], 10);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const schedMins = schedHour * 60 + schedMin;
    const currentMins = currentHour * 60 + currentMin;

    const diff = schedMins - currentMins;
    return diff > 0 && diff <= 120; // 2 hours
  };

  const isOverdue = (scheduledTimeStr) => {
    if (!scheduledTimeStr) return false;
    const parts = scheduledTimeStr.split(':');
    if (parts.length < 2) return false;
    const schedHour = parseInt(parts[0], 10);
    const schedMin = parseInt(parts[1], 10);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const schedMins = schedHour * 60 + schedMin;
    const currentMins = currentHour * 60 + currentMin;

    return currentMins > schedMins;
  };

  const totalHabits = streaks.length;
  const completedHabits = streaks.filter(s => {
    const todayState = s.TODAY_STATE || s.today_state;
    return todayState === 'COMPLETED' || todayState === 'FROZEN';
  }).length;
  const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Compute status for the Interactive Lock Widget
  const getLockState = () => {
    if (streaks.length === 0) {
      return { state: 'SECURE', color: COLORS.COLOR_BRAND, label: 'SYSTEM IDLE' };
    }

    const hasCritical = streaks.some(s => {
      const todayState = s.TODAY_STATE || s.today_state;
      return todayState === 'PENDING' && isOverdue(s.LOCAL_SCHEDULED_TIME || s.local_scheduled_time);
    });

    const hasWarning = streaks.some(s => {
      const todayState = s.TODAY_STATE || s.today_state;
      return todayState === 'PENDING' && isApproachingCutoff(s.LOCAL_SCHEDULED_TIME || s.local_scheduled_time);
    });

    const allChecked = streaks.every(s => {
      const todayState = s.TODAY_STATE || s.today_state;
      return todayState === 'COMPLETED' || todayState === 'FROZEN';
    });

    if (hasCritical) {
      return { state: 'CRITICAL', color: COLORS.COLOR_STATE_CRITICAL, label: 'THREAT ACTIVE / ROASTING' };
    } else if (hasWarning) {
      return { state: 'WARNING', color: COLORS.COLOR_STATE_WARNING, label: 'DANGER / CLOSE CUTOFF' };
    } else if (allChecked) {
      return { state: 'SECURE', color: COLORS.COLOR_BRAND, label: 'LOOP SECURE' };
    }
    return { state: 'PENDING', color: COLORS.COLOR_TEXT_MUTED, label: 'LOOP OPEN / TARGETS PENDING' };
  };

  const lock = getLockState();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Interactive Lock Widget */}
      <View style={[styles.lockWidget, { borderColor: lock.color, shadowColor: lock.color }]}>
        <View style={styles.lockIconOuter}>
          {/* Shackle */}
          <View style={[
            styles.lockShackle, 
            { borderColor: lock.color, shadowColor: lock.color },
            lock.state === 'CRITICAL' && { transform: [{ translateY: -4 }, { rotate: '15deg' }] }
          ]} />
          {/* Body */}
          <View style={[styles.lockBody, { backgroundColor: lock.color, shadowColor: lock.color }]}>
            <View style={styles.keyholeCircle} />
            <View style={styles.keyholeLine} />
          </View>
        </View>
        <View style={styles.lockInfo}>
          <Text style={styles.lockTitle}>SYSTEM LOCK STATUS</Text>
          <Text style={[styles.lockStatusText, { color: lock.color }]}>{lock.label}</Text>
        </View>
      </View>

      {/* Daily Performance (Chain Stability Index) */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressCardTitle}>CHAIN STABILITY INDEX</Text>
          <Text style={styles.progressRatio}>{completedHabits}/{totalHabits} LOCKED</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: COLORS.COLOR_BRAND }]} />
        </View>
        {/* Tactical Calibration Scale Ticks */}
        <View style={styles.calibrationContainer}>
          {[...Array(10)].map((_, i) => {
            const isActive = (i + 1) * 10 <= progressPercent;
            return (
              <View 
                key={i} 
                style={[
                  styles.calibrationTick,
                  { backgroundColor: isActive ? COLORS.COLOR_BRAND : COLORS.COLOR_BORDER_MEDIUM }
                ]} 
              />
            );
          })}
        </View>
        <Text style={styles.progressSubtext}>
          {progressPercent === 100 ? '⚡ LOOP IS SECURE. NO EXCUSES.' : `${progressPercent}% ACCURACY MET METRICS`}
        </Text>
      </View>

      {/* Section Header Row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>TACTICAL TARGETS</Text>
        <TouchableOpacity style={styles.refreshBadge} onPress={fetchStreaks} activeOpacity={0.7}>
          <Text style={styles.refreshBadgeText}>Sync status</Text>
        </TouchableOpacity>
      </View>

      {loading && streaks.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.COLOR_BRAND} style={{ marginTop: 40 }} />
      ) : streaks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No habits tracked yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first habit target to begin tracking streaks.
          </Text>
          <TouchableOpacity 
            style={styles.configureBtn} 
            onPress={() => navigation.navigate('AddHabit')}
            activeOpacity={0.8}
          >
            <Text style={styles.configureBtnText}>➕ Add Habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        streaks.map(item => {
          const streakId = item.STREAK_ID || item.streak_id;
          const activity = item.ACTIVITY_IDENTIFIER || item.activity_identifier;
          const tally = item.TALLY_CURRENT_STREAK ?? item.tally_current_streak ?? 0;
          const archetype = item.SELECTED_ARCHETYPE || item.selected_archetype;
          const scheduledTime = item.LOCAL_SCHEDULED_TIME || item.local_scheduled_time;
          const tz = item.TARGET_IANA_TIMEZONE || item.target_iana_timezone;
          const anchor = item.CUSTOM_ANCHOR_PARAGRAPH || item.custom_anchor_paragraph;
          const todayState = item.TODAY_STATE || item.today_state;

          // Compute visual tokens and status flags
          let stateColor = COLORS.COLOR_TEXT_MUTED;
          let statusText = 'Pending';
          let isWarning = false;
          let checkStyle = styles.checkboxPending;
          let checkText = '';
          let badgeBg = 'rgba(100, 116, 139, 0.1)';

          if (todayState === 'COMPLETED') {
            stateColor = COLORS.COLOR_BRAND;
            statusText = 'Completed';
            checkStyle = styles.checkboxCompleted;
            checkText = '✓';
            badgeBg = COLORS.COLOR_PASTEL_ACTIVE;
          } else if (todayState === 'FROZEN') {
            stateColor = COLORS.COLOR_STATE_FROZEN;
            statusText = 'Frozen';
            checkStyle = styles.checkboxFrozen;
            checkText = '❄';
            badgeBg = COLORS.COLOR_PASTEL_FROZEN;
          } else {
            if (isApproachingCutoff(scheduledTime)) {
              stateColor = COLORS.COLOR_STATE_WARNING;
              statusText = 'Cutoff Close';
              isWarning = true;
              checkStyle = styles.checkboxWarning;
              badgeBg = COLORS.COLOR_PASTEL_WARNING;
            } else if (isOverdue(scheduledTime)) {
              stateColor = COLORS.COLOR_STATE_CRITICAL;
              statusText = 'Overdue (Roasting)';
              checkStyle = styles.checkboxCritical;
              badgeBg = COLORS.COLOR_PASTEL_CRITICAL;
            }
          }

          const renderHabitCard = () => (
            <View style={styles.habitCard}>
              {/* Slanted 15-degree kinetic slice accent ornament */}
              <View style={[styles.cardStateIndicator, { backgroundColor: stateColor }]} />
              
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  {/* Left side: Custom Checkbox and details */}
                  <View style={styles.leftRow}>
                    <TouchableOpacity
                      style={[styles.checkboxBase, checkStyle]}
                      onPress={() => todayState === 'PENDING' && handleCheckIn(streakId, tz)}
                      disabled={todayState !== 'PENDING'}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.checkboxIconText, { color: todayState === 'PENDING' ? stateColor : COLORS.COLOR_BG_PRIMARY }]}>
                        {checkText}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.habitMeta}>
                      <Text style={styles.habitTitle}>{activity}</Text>
                      <View style={styles.metaBadgeRow}>
                        <View style={styles.metaTimeBadge}>
                          <Text style={styles.metaTimeText}>⏰ {scheduledTime.substring(0, 5)}</Text>
                        </View>
                        <View style={[styles.metaStatusBadge, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.metaStatusText, { color: stateColor }]}>{statusText.toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right side: Streak count */}
                  <View style={styles.rightColumn}>
                    <View style={styles.streakPill}>
                      <Text style={styles.streakPillText}>🔥 {tally}d</Text>
                    </View>
                  </View>
                </View>

                {/* Emotional Anchor Quote block */}
                <View style={styles.anchorContainer}>
                  <Text style={styles.anchorBody}>“{anchor || 'Stay consistent. No excuses.'}”</Text>
                </View>

                {/* Bottom Row Details and Actions */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.archetypeLabel}>PROFILE: {archetype}</Text>

                  {todayState === 'PENDING' && (
                    <View style={styles.freezeActionRow}>
                      <TouchableOpacity
                        style={[styles.freezeBadge, styles.personalFreeze]}
                        onPress={() => handleFreeze(streakId, false)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.freezeBadgeText, { color: COLORS.COLOR_STATE_FROZEN }]}>🧊 Freeze</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.freezeBadge, styles.groupFreeze]}
                        onPress={() => handleFreeze(streakId, true)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.freezeBadgeText, { color: COLORS.COLOR_BRAND }]}>👥 Group</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );

          if (isWarning) {
            return (
              <Animated.View key={streakId} style={{ opacity: pulseAnim }}>
                {renderHabitCard()}
              </Animated.View>
            );
          }

          return <View key={streakId}>{renderHabitCard()}</View>;
        })
      )}
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
  lockWidget: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 4, // Sharp unyielding corners
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lockIconOuter: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 16,
    position: 'relative',
  },
  lockShackle: {
    width: 16,
    height: 18,
    borderRadius: 8,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  lockBody: {
    width: 22,
    height: 16,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  keyholeCircle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#090D16', // Matte Obsidian keyhole
  },
  keyholeLine: {
    width: 2,
    height: 5,
    backgroundColor: '#090D16',
    marginTop: -1,
  },
  lockInfo: {
    flex: 1,
  },
  lockTitle: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  lockStatusText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  progressCard: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  progressRatio: {
    color: COLORS.COLOR_BRAND, // Electric Cyan
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 0, // Unyielding shape
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 0,
  },
  calibrationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  calibrationTick: {
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  progressSubtext: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  refreshBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.COLOR_BG_SECONDARY,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  refreshBadgeText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    padding: 36,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDescription: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  configureBtn: {
    backgroundColor: COLORS.COLOR_BRAND, // Electric Cyan
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  configureBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Dark text
    fontWeight: '900',
    fontSize: 13,
  },
  habitCard: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel
    borderRadius: 4, // Sharp unyielding borders
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardStateIndicator: {
    width: 6,
    height: '120%',
    position: 'absolute',
    left: 0,
    top: '-10%',
    transform: [{ skewX: '-15deg' }], // Slanted ornament design
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 22, // Extra padding to clear skewed strip
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxBase: {
    width: 32,
    height: 32,
    borderRadius: 4, // Sharp unyielding checkbox
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxIconText: {
    fontSize: 15,
    fontWeight: '950',
  },
  checkboxPending: {
    borderColor: COLORS.COLOR_BORDER_MEDIUM,
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    borderColor: COLORS.COLOR_BRAND,
    backgroundColor: COLORS.COLOR_BRAND,
  },
  checkboxFrozen: {
    borderColor: COLORS.COLOR_STATE_FROZEN,
    backgroundColor: COLORS.COLOR_STATE_FROZEN,
  },
  checkboxWarning: {
    borderColor: COLORS.COLOR_STATE_WARNING,
    backgroundColor: 'transparent',
  },
  checkboxCritical: {
    borderColor: COLORS.COLOR_STATE_CRITICAL,
    backgroundColor: 'transparent',
  },
  habitMeta: {
    flex: 1,
  },
  habitTitle: {
    color: COLORS.COLOR_TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTimeBadge: {
    backgroundColor: COLORS.COLOR_BG_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  metaTimeText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  metaStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaStatusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  streakPill: {
    backgroundColor: COLORS.COLOR_PASTEL_BRAND,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.25)',
  },
  streakPillText: {
    color: COLORS.COLOR_BRAND,
    fontSize: 11,
    fontWeight: '900',
  },
  anchorContainer: {
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.COLOR_BRAND,
  },
  anchorBody: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.COLOR_BORDER_LIGHT,
    paddingTop: 10,
  },
  archetypeLabel: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  freezeActionRow: {
    flexDirection: 'row',
  },
  freezeBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 6,
    borderWidth: 1,
  },
  personalFreeze: {
    backgroundColor: COLORS.COLOR_PASTEL_FROZEN,
    borderColor: 'rgba(119, 181, 254, 0.25)',
  },
  groupFreeze: {
    backgroundColor: COLORS.COLOR_PASTEL_ACTIVE,
    borderColor: 'rgba(0, 255, 204, 0.25)',
  },
  freezeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
});

import React from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

export default function Header({ vaultData, onAvatarDoubleTap }) {
  const personalTokens = vaultData?.personalFreezeTokens ?? 0;
  const groupTokens = vaultData?.groupFreezeTokens ?? 0;

  let lastTap = 0;
  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (onAvatarDoubleTap) {
        onAvatarDoubleTap();
      }
    }
    lastTap = now;
  };

  return (
    <View style={styles.header}>
      {/* Profile Avatar Badge */}
      <TouchableOpacity style={styles.avatar} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.avatarText}>SV</Text>
      </TouchableOpacity>

      {/* App Branding Logo */}
      <View style={styles.titleContainer}>
        <Text style={styles.brandText}>LOCKEDIN<Text style={{ color: COLORS.COLOR_BRAND }}>.</Text></Text>
      </View>

      {/* Inventory Telemetry Pills */}
      <View style={styles.freezeContainer}>
        <View style={[styles.tokenBadge, styles.personalBadge]}>
          <Text style={[styles.tokenBadgeText, { color: COLORS.COLOR_STATE_FROZEN }]}>
            🧊 <Text style={styles.tokenCount}>{personalTokens}</Text>
          </Text>
        </View>
        <View style={[styles.tokenBadge, styles.groupBadge]}>
          <Text style={[styles.tokenBadgeText, { color: COLORS.COLOR_BRAND }]}>
            👥 <Text style={styles.tokenCount}>{groupTokens}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 68,
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel Surface
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.COLOR_BORDER_LIGHT, // Dark slate border
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BRAND, // Electric Cyan outline
    ...Platform.select({
      ios: {
        shadowColor: COLORS.COLOR_BRAND,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  brandText: {
    color: COLORS.COLOR_TEXT_PRIMARY, // Stark White
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  freezeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderWidth: 1,
  },
  personalBadge: {
    backgroundColor: COLORS.COLOR_PASTEL_FROZEN,
    borderColor: 'rgba(119, 181, 254, 0.25)',
  },
  groupBadge: {
    backgroundColor: COLORS.COLOR_PASTEL_ACTIVE,
    borderColor: 'rgba(0, 255, 204, 0.25)',
  },
  tokenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenCount: {
    fontWeight: '900',
    fontSize: 12,
  },
});

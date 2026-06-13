import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../theme/colors';

export default function ServerConfigPanel({ serverUrl, setServerUrl, accountId, setAccountId, onRefresh, onClose }) {
  const [localUrl, setLocalUrl] = useState(serverUrl);
  const [localAccountId, setLocalAccountId] = useState(accountId);

  const handleSave = () => {
    setServerUrl(localUrl);
    setAccountId(localAccountId);
    if (onRefresh) {
      setTimeout(() => onRefresh(localUrl, localAccountId), 100);
    }
  };

  const resetToDefault = () => {
    const defaultUrl = 'http://localhost:8082';
    setLocalUrl(defaultUrl);
    setLocalAccountId('account-111');
  };

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>DEVELOPER ENGINE CONFIG</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.label}>SERVER ENDPOINT</Text>
      <TextInput
        style={styles.input}
        value={localUrl}
        onChangeText={setLocalUrl}
        placeholder="e.g. http://192.168.1.5:8082"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.helperText}>
        * Emulator/Simulator: localhost (Android requires running 'adb reverse tcp:8082 tcp:8082').
      </Text>

      <Text style={styles.label}>ACCOUNT ID</Text>
      <TextInput
        style={styles.input}
        value={localAccountId}
        onChangeText={setLocalAccountId}
        placeholder="e.g. account-111"
        placeholderTextColor={COLORS.COLOR_TEXT_MUTED}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.resetBtn]} 
          onPress={resetToDefault}
          activeOpacity={0.7}
        >
          <Text style={styles.resetBtnText}>Reset Defaults</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveBtn]} 
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveBtnText}>Save Connection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 24,
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel Surface
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 6,
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
  },
  closeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.COLOR_TEXT_MUTED,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.COLOR_BRAND, // Electric Cyan
    letterSpacing: 1.5,
  },
  label: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian
    color: COLORS.COLOR_TEXT_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.COLOR_BORDER_MEDIUM,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helperText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    marginTop: 3,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  resetBtn: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY,
    borderWidth: 1,
    borderColor: COLORS.COLOR_BORDER_MEDIUM,
  },
  saveBtn: {
    backgroundColor: COLORS.COLOR_BRAND, // Electric Cyan
  },
  resetBtnText: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontWeight: '700',
    fontSize: 12,
  },
  saveBtnText: {
    color: COLORS.COLOR_BG_PRIMARY, // Matte Obsidian text
    fontWeight: '900',
    fontSize: 12,
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar, Text, TouchableOpacity, Modal } from 'react-native';
import { COLORS } from './src/theme/colors';
import Header from './src/components/Header';
import ServerConfigPanel from './src/components/ServerConfigPanel';
import DashboardScreen from './src/screens/DashboardScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import VoiceSynthesizerScreen from './src/screens/VoiceSynthesizerScreen';
import HealthSyncScreen from './src/screens/HealthSyncScreen';

export default function App() {
  const defaultUrl = 'http://localhost:8082';
  
  const [serverUrl, setServerUrl] = useState(defaultUrl);
  const [accountId, setAccountId] = useState('account-111');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [vaultData, setVaultData] = useState({
    accountId: 'account-111',
    personalFreezeTokens: 1,
    groupId: null,
    groupFreezeTokens: 0,
  });

  const fetchVaultData = async (url = serverUrl, accId = accountId) => {
    try {
      const response = await fetch(`${url}/api/vault/${accId}`);
      if (response.ok) {
        const data = await response.json();
        setVaultData(data);
      }
    } catch (error) {
      console.log('Error fetching vault data:', error);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [serverUrl, accountId, refreshTrigger]);

  const handleConfigChanged = (newUrl, newAccId) => {
    fetchVaultData(newUrl, newAccId);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <DashboardScreen
            serverUrl={serverUrl}
            accountId={accountId}
            refreshTrigger={refreshTrigger}
            setRefreshTrigger={setRefreshTrigger}
            navigation={{ navigate: (screenName) => setActiveTab(screenName) }}
          />
        );
      case 'AddHabit':
        return (
          <AddHabitScreen
            serverUrl={serverUrl}
            accountId={accountId}
            setRefreshTrigger={setRefreshTrigger}
            navigation={{ navigate: (screenName) => setActiveTab(screenName) }}
          />
        );
      case 'Voice':
        return (
          <VoiceSynthesizerScreen
            serverUrl={serverUrl}
            accountId={accountId}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'Health':
        return (
          <HealthSyncScreen
            serverUrl={serverUrl}
            accountId={accountId}
            refreshTrigger={refreshTrigger}
            setRefreshTrigger={setRefreshTrigger}
          />
        );
      default:
        return <View style={styles.errorView}><Text style={{color:'#fff'}}>Screen Not Found</Text></View>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.COLOR_BG_PRIMARY} />
      
      {/* App Header */}
      <Header 
        vaultData={vaultData} 
        onAvatarDoubleTap={() => setShowDevPanel(true)} 
      />

      {/* Hidden Dev Overlay Console */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDevPanel}
        onRequestClose={() => setShowDevPanel(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDevPanel(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <ServerConfigPanel
              serverUrl={serverUrl}
              setServerUrl={setServerUrl}
              accountId={accountId}
              setAccountId={setAccountId}
              onRefresh={(url, acc) => {
                handleConfigChanged(url, acc);
                setShowDevPanel(false);
              }}
              onClose={() => setShowDevPanel(false)}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Floating Classy Navigation Dock */}
      <View style={styles.floatingTabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'Dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('Dashboard')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Dashboard' && styles.tabTextActive]}>🔥</Text>
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && styles.tabTextActive]}>Streaks</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'AddHabit' && styles.tabItemActive]}
          onPress={() => setActiveTab('AddHabit')}
        >
          <Text style={[styles.tabIcon, activeTab === 'AddHabit' && styles.tabTextActive]}>➕</Text>
          <Text style={[styles.tabLabel, activeTab === 'AddHabit' && styles.tabTextActive]}>Configure</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'Voice' && styles.tabItemActive]}
          onPress={() => setActiveTab('Voice')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Voice' && styles.tabTextActive]}>📢</Text>
          <Text style={[styles.tabLabel, activeTab === 'Voice' && styles.tabTextActive]}>Roasts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'Health' && styles.tabItemActive]}
          onPress={() => setActiveTab('Health')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Health' && styles.tabTextActive]}>🏃</Text>
          <Text style={[styles.tabLabel, activeTab === 'Health' && styles.tabTextActive]}>Sync</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.COLOR_BG_PRIMARY,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.COLOR_BG_PRIMARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.6)', // Matte Obsidian backdrop
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.COLOR_BG_SECONDARY, // Dark Steel Surface
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.COLOR_BORDER_LIGHT,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.COLOR_BRAND,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingTabBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: 'rgba(18, 24, 38, 0.95)', // Frosted Dark Steel
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 204, 0.15)', // Glowing Cyan outline
    ...Platform.select({
      ios: {
        shadowColor: COLORS.COLOR_BRAND,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 8,
  },
  tabItemActive: {
    // Elegant indicator at the top/center of active item
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.8,
  },
  tabLabel: {
    color: COLORS.COLOR_TEXT_MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: COLORS.COLOR_BRAND, // Highlight in Electric Cyan
    fontWeight: '900',
    opacity: 1,
  },
});

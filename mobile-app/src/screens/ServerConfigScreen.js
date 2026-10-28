import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  testApiHealth,
} from '../config/api';

export default function ServerConfigScreen({ navigation }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentUrl(url);
      setInputUrl(url);
    });
  }, []);

  const handleTestConnection = async (target = inputUrl) => {
    if (!target.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid backend URL.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testApiHealth(target.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        latency: 0,
        status: 'ERROR',
        error: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!inputUrl.trim()) {
      Alert.alert('Empty URL', 'Please enter a valid URL.');
      return;
    }
    try {
      const saved = await setApiBaseUrl(inputUrl.trim());
      setCurrentUrl(saved);
      Alert.alert(
        'Server Config Saved',
        `Active backend URL set to:\n${saved}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    }
  };

  const handleReset = async () => {
    const def = await resetApiBaseUrl();
    setCurrentUrl(def);
    setInputUrl(def);
    setTestResult(null);
    Alert.alert('Reset Complete', `Restored default URL: ${def}`);
  };

  const applyPreset = (preset) => {
    setInputUrl(preset);
    handleTestConnection(preset);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Server & Network Config</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
          <Text style={styles.infoBannerText}>
            Configure the REST API endpoint used for physical devices and distributed APK builds.
            Ensure devices on other networks use a publicly accessible HTTPS domain or tunnel.
          </Text>
        </View>

        {/* Current Active URL Card */}
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>Current Active Backend</Text>
          <Text style={styles.activeValue}>{currentUrl || 'Loading...'}</Text>
        </View>

        {/* Edit URL Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configure Backend Endpoint</Text>
          <Text style={styles.inputSubtitle}>
            Include the protocol (`http://` or `https://`) and `/api` path suffix.
          </Text>

          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="https://your-api.domain.com/api"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => handleTestConnection(inputUrl)}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color={Colors.textWhite} />
              ) : (
                <>
                  <Ionicons name="pulse" size={16} color={Colors.textWhite} />
                  <Text style={styles.testBtnText}>Ping / Health Check</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
              <Ionicons name="save-outline" size={16} color={Colors.textWhite} />
              <Text style={styles.saveBtnText}>Save URL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Test Result Card */}
        {testResult && (
          <View
            style={[
              styles.resultCard,
              {
                borderColor: testResult.success ? Colors.success : Colors.danger,
                backgroundColor: testResult.success
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={testResult.success ? Colors.success : Colors.danger}
              />
              <Text
                style={[
                  styles.resultStatus,
                  { color: testResult.success ? Colors.success : Colors.danger },
                ]}
              >
                {testResult.success ? 'Backend Online & Healthy' : 'Connection Failed'}
              </Text>
            </View>

            <View style={styles.resultDetails}>
              <Text style={styles.resultItem}>
                <Text style={styles.resultBold}>Status: </Text>
                {testResult.status}
              </Text>
              <Text style={styles.resultItem}>
                <Text style={styles.resultBold}>Latency: </Text>
                {testResult.latency} ms
              </Text>
              {testResult.service && (
                <Text style={styles.resultItem}>
                  <Text style={styles.resultBold}>Service: </Text>
                  {testResult.service}
                </Text>
              )}
              {testResult.error && (
                <Text style={[styles.resultItem, { color: Colors.danger }]}>
                  <Text style={styles.resultBold}>Details: </Text>
                  {testResult.error}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Presets */}
        <View style={styles.presetsCard}>
          <Text style={styles.presetsTitle}>Quick Endpoint Presets</Text>

          <TouchableOpacity
            style={styles.presetItem}
            onPress={() => applyPreset('http://10.0.2.2:5000/api')}
          >
            <View>
              <Text style={styles.presetName}>Android Studio Emulator</Text>
              <Text style={styles.presetSub}>http://10.0.2.2:5000/api</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.secondary} />
          </TouchableOpacity>

          <View style={styles.presetDivider} />

          <TouchableOpacity
            style={styles.presetItem}
            onPress={() => applyPreset('http://192.168.137.193:5000/api')}
          >
            <View>
              <Text style={styles.presetName}>Local Physical Device (Wi-Fi)</Text>
              <Text style={styles.presetSub}>http://192.168.137.193:5000/api</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.secondary} />
          </TouchableOpacity>

          <View style={styles.presetDivider} />

          <TouchableOpacity
            style={styles.presetItem}
            onPress={() => applyPreset('https://api.intellicart.ai/api')}
          >
            <View>
              <Text style={styles.presetName}>Distributed APK / Public Cloud (HTTPS)</Text>
              <Text style={styles.presetSub}>https://api.intellicart.ai/api</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh" size={16} color={Colors.textMuted} />
          <Text style={styles.resetBtnText}>Reset to Environment Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  activeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  activeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.secondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  testBtnText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultDetails: {
    gap: 3,
  },
  resultItem: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  presetDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  resetBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});

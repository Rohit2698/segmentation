import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { useModelStore } from '../../store/modelStore';

async function requestDownloadPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const api =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10);
  const perm =
    api >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

  try {
    const result = await request(perm);
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      return true;
    }
    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Storage permission required',
        'Please enable storage permission in settings to download models.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ]
      );
    }
    return false;
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const {
    packages,
    activeModelId,
    setActiveModel,
    markInstalled,
    ensureDownloadDir,
    syncFromDisk,
  } = useModelStore();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    syncFromDisk().catch(() => {
      // ignore
    });
  }, [syncFromDisk]);

  const handleDownload = async (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg || !pkg.downloadUrl) {
      Alert.alert('Not downloadable', 'This model is not available for download.');
      return;
    }

    const hasPerm = await requestDownloadPermission();
    if (!hasPerm) return;

    try {
      setDownloadingId(id);
      await ensureDownloadDir();

      const destPath = pkg.storagePath;
      const result = await RNFS.downloadFile({
        fromUrl: pkg.downloadUrl,
        toFile: destPath,
      }).promise;

      if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
        markInstalled(id, true);
        Alert.alert(
          'Model downloaded',
          'The model has been downloaded. You can now activate it for scanning.'
        );
      } else {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
    } catch (e: any) {
      console.warn('Model download failed', e);
      Alert.alert('Download failed', 'Unable to download model. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    if (pkg.origin === 'bundled') {
      Alert.alert('Cannot delete bundled model', 'Bundled models are part of the app package.');
      return;
    }

    Alert.alert('Delete Model', 'Are you sure you want to delete this model?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(id);
            const exists = await RNFS.exists(pkg.storagePath);
            if (exists) {
              await RNFS.unlink(pkg.storagePath);
            }
            markInstalled(id, false);
          } catch (e) {
            console.warn('Failed to delete model', e);
            Alert.alert('Delete failed', 'Could not delete model file from storage.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleActivate = (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg || !pkg.installed) {
      Alert.alert('Not installed', 'Please download/install this model first.');
      return;
    }
    setActiveModel(id);
    Alert.alert('Active model updated', `${pkg.name} will be used for scanning.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Manage TensorFlow Lite model packages</Text>
        <View style={styles.spacing} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installed Models</Text>
          {packages
            .filter((p) => p.installed)
            .map((pkg) => {
              const isActive = pkg.id === activeModelId;
              const isDeleting = deletingId === pkg.id;
              return (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageInfo}>
                    <View style={styles.packageHeader}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      {isActive && <Text style={styles.activeBadge}>Active</Text>}
                    </View>
                    <Text style={styles.packageMeta}>
                      {pkg.fileName} • {pkg.size} •{' '}
                      {pkg.origin === 'bundled' ? 'Bundled' : 'Downloaded'}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    {!isActive && (
                      <TouchableOpacity
                        style={[styles.button, styles.activateButton]}
                        onPress={() => handleActivate(pkg.id)}
                      >
                        <Text style={styles.activateButtonText}>Use</Text>
                      </TouchableOpacity>
                    )}
                    {pkg.origin === 'download' && (
                      <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={() => handleDelete(pkg.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          {packages.filter((p) => p.installed).length === 0 && (
            <Text style={styles.emptyText}>No installed models</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available for Download</Text>
          {packages
            .filter((p) => !p.installed)
            .map((pkg) => {
              const isDownloading = downloadingId === pkg.id;
              return (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageMeta}>
                      {pkg.fileName} • {pkg.size}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.downloadButton,
                      isDownloading && styles.buttonDisabled,
                    ]}
                    onPress={() => handleDownload(pkg.id)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.downloadButtonText}>Download</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          {packages.filter((p) => !p.installed).length === 0 && (
            <Text style={styles.emptyText}>All models installed</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6c757d' },
  spacing: { height: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#495057', marginBottom: 12 },
  packageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  packageInfo: { flex: 1, marginRight: 12 },
  packageName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  packageMeta: { fontSize: 12, color: '#6c757d', fontFamily: 'monospace' },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#19875415',
    color: '#198754',
    fontSize: 11,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  downloadButton: { backgroundColor: '#007bff' },
  downloadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deleteButton: { backgroundColor: '#dc3545' },
  deleteButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  activateButton: { backgroundColor: '#198754', marginRight: 8 },
  activateButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});



import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ModelPackage = {
  id: string;
  name: string;
  file: string;
  size: string;
  installed: boolean;
};

const MODEL_PACKAGES: ModelPackage[] = [
  { id: '1', name: 'Macro Scan Model', file: 'yolo.tflite', size: '12.4 MB', installed: true },
  { id: '2', name: 'Brachial Plexus Model', file: 'brachial_plexus.tflite', size: '18.7 MB', installed: false },
  { id: '3', name: 'Human Part Segmentation', file: 'humanpart_seg_float16.tflite', size: '24.1 MB', installed: false },
];

export default function SettingsScreen() {
  const [packages, setPackages] = useState<ModelPackage[]>(MODEL_PACKAGES);

  const handleDownload = (_id: string) => {
    Alert.alert('Download Model', 'Model download functionality will be implemented here.');
    // TODO: Implement actual download using react-native-fs
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPackages((prev) =>
              prev.map((p) => (p.id === id ? { ...p, installed: false } : p))
            );
          },
        },
      ]
    );
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
            .map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageMeta}>
                    {pkg.file} • {pkg.size}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => handleDelete(pkg.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          {packages.filter((p) => p.installed).length === 0 && (
            <Text style={styles.emptyText}>No installed models</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available for Download</Text>
          {packages
            .filter((p) => !p.installed)
            .map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageMeta}>
                    {pkg.file} • {pkg.size}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.downloadButton]}
                  onPress={() => handleDownload(pkg.id)}
                >
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  emptyText: { fontSize: 14, color: '#adb5bd', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});

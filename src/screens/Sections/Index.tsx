import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ModelInfo = {
  id: string;
  name: string;
  file: string;
  description: string;
};

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'macro_scan',
    name: 'Macro Scan',
    file: 'models/yolo.tflite',
    description: 'General instance segmentation model for macro-level anatomical structures.',
  },
  {
    id: 'brachial_plexus',
    name: 'Brachial Plexus',
    file: 'models/brachial_plexus.tflite',
    description: 'Specialized model for detecting nerves and vessels in the brachial plexus region.',
  },
];

export default function SectionsScreen() {
  const [selectedModel, setSelectedModel] = useState<string>('macro_scan');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📂 Available Sections</Text>
        <Text style={styles.subtitle}>Select a detection model to use for scanning</Text>
        <View style={styles.spacing} />
        
        {AVAILABLE_MODELS.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelCard,
              selectedModel === model.id && styles.modelCardSelected,
            ]}
            onPress={() => setSelectedModel(model.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioContainer}>
              <View style={[styles.radio, selectedModel === model.id && styles.radioSelected]}>
                {selectedModel === model.id && <View style={styles.radioDot} />}
              </View>
              <View style={styles.modelInfo}>
                <Text style={styles.modelName}>{model.name}</Text>
                <Text style={styles.modelFile}>{model.file}</Text>
                <Text style={styles.modelDesc}>{model.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6c757d', marginBottom: 4 },
  spacing: { height: 16 },
  modelCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  modelCardSelected: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  radioContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#adb5bd',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#007bff' },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
  },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  modelFile: { fontSize: 12, color: '#6c757d', fontFamily: 'monospace', marginBottom: 6 },
  modelDesc: { fontSize: 14, color: '#495057', lineHeight: 20 },
});

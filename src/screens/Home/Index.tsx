import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 AI Object Detection</Text>
          <Text style={styles.subtitle}>Real-time detection using TensorFlow Lite</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>📸</Text>
          <Text style={styles.cardTitle}>Macro Scan</Text>
          <Text style={styles.cardDesc}>
            Capture or select an image to perform real-time instance segmentation with bounding boxes and masks.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>📂</Text>
          <Text style={styles.cardTitle}>Available Sections</Text>
          <Text style={styles.cardDesc}>
            Browse and select from available detection models (e.g., Brachial Plexus, Macro Scan).
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>⚙️</Text>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardDesc}>
            Manage .tflite model packages: add, update, or remove detection models.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6c757d' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#6c757d', lineHeight: 20 },
});

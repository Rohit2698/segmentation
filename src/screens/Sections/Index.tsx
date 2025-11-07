import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AnatomicalSection = {
  id: string;
  name: string;
  description: string;
  available: boolean;
};

const SECTIONS: AnatomicalSection[] = [
  {
    id: '1',
    name: 'Brachial Plexus',
    description: 'Network of nerves that sends signals from spinal cord to shoulder, arm and hand',
    available: true,
  },
  {
    id: '2',
    name: 'Carotid Artery',
    description: 'Major blood vessels in the neck that supply blood to the brain',
    available: false,
  },
  {
    id: '3',
    name: 'Thyroid Gland',
    description: 'Butterfly-shaped gland in the neck that produces hormones',
    available: false,
  },
  {
    id: '4',
    name: 'Abdominal Aorta',
    description: 'Largest artery in the abdomen',
    available: false,
  },
];

export default function SectionsScreen() {
  const handleSectionPress = (section: AnatomicalSection) => {
    if (section.available) {
      // TODO: Navigate to specific section scanning screen
      console.log('Navigate to section:', section.name);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Available Sections</Text>
          <Text style={styles.subtitle}>
            Select a specific anatomical section to scan
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionCard,
                !section.available && styles.sectionCardDisabled,
              ]}
              onPress={() => handleSectionPress(section)}
              activeOpacity={section.available ? 0.7 : 1}
              disabled={!section.available}
            >
              <View style={styles.sectionHeader}>
                <Text style={[
                  styles.sectionName,
                  !section.available && styles.sectionNameDisabled,
                ]}>
                  {section.name}
                </Text>
                {section.available ? (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>✓ Available</Text>
                  </View>
                ) : (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.sectionDescription,
                !section.available && styles.sectionDescriptionDisabled,
              ]}>
                {section.description}
              </Text>
              {section.available && (
                <Text style={styles.sectionArrow}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            More anatomical sections will be added as additional models become available.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  sectionCardDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  sectionNameDisabled: {
    color: '#6c757d',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  sectionDescriptionDisabled: {
    color: '#adb5bd',
  },
  availableBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#155724',
  },
  comingSoonBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#856404',
  },
  sectionArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    fontSize: 32,
    color: '#adb5bd',
    fontWeight: '300',
    marginTop: -16,
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#004085',
    lineHeight: 18,
  },
});

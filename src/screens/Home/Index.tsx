import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../navigation/AppNavigator';

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🩺 Ultrasound Segmentation</Text>
          <Text style={styles.subtitle}>Choose a scanning mode to begin</Text>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          {/* Macro Scan Option */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => navigation.navigate('MacroScan')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🔍</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Macro Scan</Text>
              <Text style={styles.menuDescription}>
                Real-time object detection using AI model with bounding box segmentation
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Available Sections Option */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => navigation.navigate('Sections')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📋</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Available Sections</Text>
              <Text style={styles.menuDescription}>
                Browse specific anatomical sections like brachial plexus
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Settings Option */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>⚙️</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuDescription}>
                Manage .tflite model packages and app configuration
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Select an option above to get started with ultrasound scanning
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
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  menuArrow: {
    fontSize: 32,
    color: '#adb5bd',
    fontWeight: '300',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 18,
  },
});

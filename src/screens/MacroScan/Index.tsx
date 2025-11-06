import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { initialize, detect } from '../../native/yolo';
import { useDetectionStore } from '../../store/detectionStore';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { PERMISSIONS, RESULTS, check, request, openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';

// Place your model at android/app/src/main/assets/models/yolo.tflite
const MODEL_ASSET = 'models/yolo.tflite';
// Optional: only set if you actually add labels.txt under assets
const LABEL_ASSET: string | undefined = undefined;

export default function MacroScanScreen() {
  const { width } = Dimensions.get('window');
  const previewWidth = width - 32;
  const previewHeight = Math.round((previewWidth * 4) / 3);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [initReady, setInitReady] = useState<boolean>(false);
  const { loading, results, setLoading, setResponse, clear } = useDetectionStore();

  useEffect(() => {
    (async () => {
      try {
        const ok = await initialize(MODEL_ASSET, LABEL_ASSET);
        setInitReady(!!ok);
        if (!ok) {
          Alert.alert(
            'Model not initialized',
            'Could not initialize the model. Ensure the file exists at android/app/src/main/assets/models/yolo.tflite.'
          );
        }
      } catch (e: any) {
        console.warn('Failed to init TFLite module', e);
        setInitReady(false);
        Alert.alert(
          'Initialization error',
          'Failed to initialize the model. Make sure your .tflite is placed under android/app/src/main/assets/models and rebuild the app.'
        );
      }
    })();
  }, []);

  const ensureGalleryPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const api = Platform.Version as number;
    if (api >= 33) {
      const status = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (status === RESULTS.GRANTED) return true;
      const res = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      return res === RESULTS.GRANTED;
    } else {
      const status = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      if (status === RESULTS.GRANTED) return true;
      const res = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return res === RESULTS.GRANTED;
    }
  }, []);

  const resolveLocalPath = useCallback(async (uri?: string, fileName?: string | null) => {
    if (!uri) return null;
    // If it's already a file path
    if (uri.startsWith('file://')) {
      return uri.replace('file://', '');
    }
    // Content URI on Android -> copy to cache and return file path
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      try {
        const safeName = (fileName || `image_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
        const destPath = `${RNFS.CachesDirectoryPath}/${safeName}`;
        await RNFS.copyFile(uri, destPath);
        return destPath;
      } catch (e) {
        console.warn('Failed to copy content URI to cache:', e);
        return null;
      }
    }
    // iOS or other schemes: RN Image supports them, but native detect needs a file path.
    // Try stripping scheme if it starts with 'assets-library://' or 'ph://'
    if (Platform.OS === 'ios') {
      // For simplicity, let’s pass through; you may add a conversion using a library if needed
      return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
    }
    return uri;
  }, []);

  const performDetection = useCallback(async (path: string) => {
    if (!initReady) return;
    setLoading(true);
    console.log('Starting detection for imagePath:', path);
    try {
      const r = await detect(path);
      console.log('Detection result:', r);
      setResponse(r);
    } catch (e) {
      console.warn('detect error', e);
      Alert.alert('Detection Error', 'Failed to perform detection. Please try again.');
      setLoading(false);
    }
  }, [initReady, setLoading, setResponse]);

  const onPick = useCallback(async () => {
    clear();
    if (Platform.OS === 'android') {
      const ok = await ensureGalleryPermission();
      if (!ok) {
        Alert.alert('Permission needed', 'Please allow Photos/Media access to pick an image.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ]);
        return;
      }
    }
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    const path = await resolveLocalPath(asset.uri, asset.fileName);
    if (!path) {
      Alert.alert('Couldn\'t read image', 'Unable to access the selected image file.');
      return;
    }
    setImagePath(path);
    // Auto-detect after picking
    performDetection(path);
  }, [clear, ensureGalleryPermission, resolveLocalPath, performDetection]);

  const onCapture = useCallback(async () => {
    clear();
    // Ensure camera permission on Android
    if (Platform.OS === 'android') {
      const camPerm = await check(PERMISSIONS.ANDROID.CAMERA);
      if (camPerm !== RESULTS.GRANTED) {
        const req = await request(PERMISSIONS.ANDROID.CAMERA);
        if (req !== RESULTS.GRANTED) {
          Alert.alert(
            'Camera permission needed',
            'Please allow camera access to take photos.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openSettings() },
            ],
          );
          return;
        }
      }
    }

  const res = await launchCamera({ mediaType: 'photo', cameraType: 'back', saveToPhotos: true });
  console.log('launchCamera result:', res);
    if (res.didCancel) {
      return;
    }
    if (res.errorCode) {
      Alert.alert('Camera error', `${res.errorCode}: ${res.errorMessage ?? ''}`);
      return;
    }
    const asset = res.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('No image returned', 'The camera did not return an image. If you are using an emulator, ensure it has a back camera.');
      return;
    }
    const path = await resolveLocalPath(asset.uri, asset.fileName);
    if (!path) {
      Alert.alert('Couldn\'t read photo', 'Unable to access the captured photo.');
      return;
    }
    setImagePath(path);
    // Auto-detect after capture
    performDetection(path);
  }, [clear, resolveLocalPath, performDetection]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📸 Macro Scan</Text>
        <Text style={styles.subtitle}>Capture or select an image to detect objects</Text>
        <View style={styles.sp12} />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={onCapture} activeOpacity={0.8}>
            <Text style={styles.buttonText}>📷 Capture</Text>
          </TouchableOpacity>
          <View style={styles.sp12w} />
          <TouchableOpacity style={styles.primaryButton} onPress={onPick} activeOpacity={0.8}>
            <Text style={styles.buttonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sp16} />
        
        {imagePath && (
          <View style={[styles.preview, { width: previewWidth, height: previewHeight }]}>
            <Image 
              source={{ uri: imagePath.startsWith('/') ? 'file://' + imagePath : imagePath }} 
              style={styles.previewImage} 
              resizeMode="cover" 
            />
            <Svg width={previewWidth} height={previewHeight} style={StyleSheet.absoluteFill}>
              {results.map((r, idx) => {
                const { x1, y1, x2, y2, clsName, cnf } = r.box;
                // coords are normalized [0..1]
                const rx = x1 * previewWidth;
                const ry = y1 * previewHeight;
                const rw = (x2 - x1) * previewWidth;
                const rh = (y2 - y1) * previewHeight;
                const centerX = (x1 + x2) / 2 * previewWidth;
                const centerY = (y1 + y2) / 2 * previewHeight;
                
                // Radial label positioning (avoid overlap with box)
                const angle = (idx * 47) % 360; // distribute radially
                const labelRadius = Math.max(rw, rh) * 0.6;
                const labelX = centerX + Math.cos((angle * Math.PI) / 180) * labelRadius;
                const labelY = centerY + Math.sin((angle * Math.PI) / 180) * labelRadius;

                const hue = (r.box.cls * 47) % 360;
                const color = `hsl(${hue}, 85%, 55%)`;
                
                return (
                  <React.Fragment key={idx}>
                    {/* Bounding box */}
                    <Rect 
                      x={rx} 
                      y={ry} 
                      width={rw} 
                      height={rh} 
                      stroke={color} 
                      strokeWidth={3} 
                      fill="transparent" 
                    />
                    {/* Connection line from box center to label */}
                    <Line
                      x1={centerX}
                      y1={centerY}
                      x2={labelX}
                      y2={labelY}
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={0.7}
                    />
                    {/* Label background circle */}
                    <Circle
                      cx={labelX}
                      cy={labelY}
                      r={4}
                      fill={color}
                    />
                    {/* Label text */}
                    <SvgText 
                      x={labelX + 8} 
                      y={labelY + 4} 
                      fill={color} 
                      fontSize={13}
                      fontWeight="600"
                    >
                      {`${clsName} ${(cnf*100).toFixed(0)}%`}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Detecting objects...</Text>
          </View>
        )}

        {!imagePath && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>Capture or select an image to begin</Text>
          </View>
        )}

        {results.length > 0 && !loading && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>🎯 Detected Objects ({results.length})</Text>
            {results.map((r, idx) => (
              <View key={idx} style={styles.resultItem}>
                <Text style={styles.resultLabel}>{r.box.clsName}</Text>
                <Text style={styles.resultConf}>{(r.box.cnf * 100).toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6c757d' },
  sp8: { height: 8 },
  sp12: { height: 12 },
  sp12w: { width: 12 },
  sp16: { height: 16 },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  preview: { 
    position: 'relative', 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: { width: '100%', height: '100%' },
  loadingContainer: { 
    alignItems: 'center', 
    marginTop: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6c757d' },
  emptyState: { 
    alignItems: 'center', 
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#adb5bd', textAlign: 'center' },
  resultsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultsTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultLabel: { fontSize: 15, color: '#495057', flex: 1 },
  resultConf: { fontSize: 15, fontWeight: '600', color: '#007bff' },
});

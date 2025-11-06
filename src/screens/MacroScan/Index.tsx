import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Dimensions, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { initialize, detect } from '../../native/yolo';
import { useDetectionStore } from '../../store/detectionStore';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { PERMISSIONS, RESULTS, check, request, openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';

// Place your model at android/app/src/main/assets/models/yolo.tflite
const MODEL_ASSET = 'models/yolo.tflite';
// Optional: only set if you actually add labels.txt under assets
const LABEL_ASSET: string | undefined = undefined;

export default function MacroScanScreen() {
  const { width } = Dimensions.get('window');
  const previewWidth = width;
  const previewHeight = Math.round((width * 4) / 3);
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
  }, [clear, ensureGalleryPermission, resolveLocalPath]);

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
    // Basic diagnostics if nothing happens
  // Debug: output camera result
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
  }, [clear, resolveLocalPath]);

  const onDetect = useCallback(async () => {
    if (!imagePath) return;
    if (!initReady) {
      Alert.alert(
        'Model not ready',
        'Please add your model to android/app/src/main/assets/models/yolo.tflite and restart the app.'
      );
      return;
    }
    setLoading(true);
    console.log('Starting detection for imagePath:', imagePath);
    try {
      const r = await detect(imagePath);
      console.log('Detection result:', r);
      setResponse(r);
    } catch (e) {
      console.warn('detect error', e);
      setLoading(false);
    }
  }, [imagePath, initReady, setLoading, setResponse]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>YOLO Instance Segmentation (RN)</Text>
  <View style={styles.sp8} />
        <View style={styles.row}>
          <Button title="Capture" onPress={onCapture} />
          <View style={styles.sp12w} />
          <Button title="Gallery" onPress={onPick} />
          <View style={styles.sp12w} />
          <Button title="Detect" onPress={onDetect} disabled={!imagePath || loading || !initReady} />
        </View>
  <View style={styles.sp16} />
        {imagePath && (
          <View style={[styles.preview, { width: previewWidth, height: previewHeight }] }>
            <Image source={{ uri: imagePath.startsWith('/') ? 'file://' + imagePath : imagePath }} style={styles.previewImage} resizeMode="cover" />
            <Svg width={previewWidth} height={previewHeight} style={StyleSheet.absoluteFill}>
              {results.map((r, idx) => {
                const { x1, y1, x2, y2, clsName, cnf } = r.box;
                // coords are normalized [0..1]
                const rx = x1 * previewWidth;
                const ry = y1 * previewHeight;
                const rw = (x2 - x1) * previewWidth;
                const rh = (y2 - y1) * previewHeight;
                return (
                  <React.Fragment key={idx}>
                    <Rect x={rx} y={ry} width={rw} height={rh} stroke="#00FF88" strokeWidth={2} fill="transparent" />
                    <SvgText x={rx + 4} y={ry + 16} fill="#00FF88" fontSize={12}>{`${clsName} ${(cnf*100).toFixed(1)}%`}</SvgText>
                  </React.Fragment>
                );
              })}
              {/* Mask overlays (downsampled heatmap) */}
              {results.map((r, idx) => {
                const mask = r.mask; // [height][width]
                if (!mask || mask.length === 0 || mask[0].length === 0) return null;
                const mh = mask.length;
                const mw = mask[0].length;
                // target blocks to keep under ~1500 rects per mask
                const targetBlocksX = 45;
                const blockX = Math.max(1, Math.floor(mw / targetBlocksX));
                const blockY = Math.max(1, Math.floor(mh / (targetBlocksX * (mh / mw))));
                const blocks: { x: number; y: number; w: number; h: number; v: number }[] = [];
                for (let by = 0; by < mh; by += blockY) {
                  for (let bx = 0; bx < mw; bx += blockX) {
                    let sum = 0;
                    let count = 0;
                    for (let y = by; y < Math.min(by + blockY, mh); y++) {
                      const row = mask[y];
                      for (let x = bx; x < Math.min(bx + blockX, mw); x++) {
                        sum += row[x];
                        count++;
                      }
                    }
                    const avg = count ? sum / count : 0;
                    if (avg <= 0.05) continue; // skip near-zero
                    const px = (bx / mw) * previewWidth;
                    const py = (by / mh) * previewHeight;
                    const pw = (Math.min(blockX, mw - bx) / mw) * previewWidth;
                    const ph = (Math.min(blockY, mh - by) / mh) * previewHeight;
                    blocks.push({ x: px, y: py, w: pw, h: ph, v: Math.max(0, Math.min(1, avg)) });
                  }
                }
                // color per class hash
                const hue = (r.box.cls * 47) % 360;
                const fillBase = `hsl(${hue} 85% 55%)`;
                return (
                  <React.Fragment key={`m-${idx}`}>
                    {blocks.map((b, i) => (
                      <Rect
                        key={`mr-${i}`}
                        x={b.x}
                        y={b.y}
                        width={b.w}
                        height={b.h}
                        fill={fillBase}
                        opacity={Math.min(0.5, 0.15 + b.v * 0.5)}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        )}
  {loading && <ActivityIndicator style={styles.loading} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  sp8: { height: 8 },
  sp12w: { width: 12 },
  sp16: { height: 16 },
  preview: { position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  loading: { marginTop: 12 },
});

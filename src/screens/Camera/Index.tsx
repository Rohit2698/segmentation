import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { initialize, detect } from '../../native/yolo';
import { useDetectionStore } from '../../store/detectionStore';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import RNFS from 'react-native-fs';
import { IS_TEST, LABEL_ASSET, MOCK_RESULTS, MODEL_ASSET } from './util';
import { useModelStore } from '../../store/modelStore';


export default function CameraScreen() {
  const { height } = Dimensions.get('window');
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { activeModelId, packages } = useModelStore();
  
  const [isActive, setIsActive] = useState(true);
  const [initReady, setInitReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true); // Toggle between boxes and lines/arrows
  
  const { loading, results, setLoading, setResponse, clear } = useDetectionStore();

  // Calculate preview dimensions (3:4 aspect ratio like Kotlin app)
  const previewHeight = height * 0.7;
  const previewWidth = (previewHeight * 3) / 4;

  const activeModel = packages.find((p) => p.id === activeModelId) ?? null;

  useEffect(() => {
    (async () => {
      try {
        const modelPath = activeModel?.storagePath ?? MODEL_ASSET;
        setInitReady(false);
        const ok = await initialize(modelPath, LABEL_ASSET);
        setInitReady(!!ok);
        if (!ok) {
          Alert.alert(
            'Model not initialized',
            'Could not initialize the model. Ensure the selected model file exists.'
          );
        }
      } catch (e: any) {
        console.warn('Failed to init TFLite module', e);
        setInitReady(false);
        Alert.alert(
          'Initialization error',
          'Failed to initialize the model. Please check that the model file is present and try again.'
        );
      }
    })();
  }, [activeModelId, activeModel?.storagePath]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const performDetection = useCallback(async (imagePath: string) => {
    if (!initReady && !IS_TEST) {
      Alert.alert('Model not ready', 'Please wait for model initialization.');
      return;
    }
    setLoading(true);
    setIsProcessing(true);
    console.log('Starting detection for:', imagePath);
    
    try {
      if (IS_TEST) {
        // Use mock data in test mode
        console.log('Test mode: Using mock results');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1500)); // Simulate processing time
        setResponse({
          preProcessTime: 45,
          interfaceTime: 120,
          postProcessTime: 35,
          results: MOCK_RESULTS,
        });
      } else {
        // Real detection
        const r = await detect(imagePath);
        console.log('Detection result:', r);
        setResponse(r);
      }
    } catch (e) {
      console.warn('detect error', e);
      Alert.alert('Detection Error', 'Failed to perform detection. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [initReady, setLoading, setResponse]);

  const handleCapture = useCallback(async () => {
    if (!camera.current || (!initReady && !IS_TEST)) return;
    
    try {
      setIsProcessing(true);
      clear();
      
      // Capture photo with timestamp naming (like Kotlin app)
      const timestamp = new Date().getTime();
      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      
      // Deactivate camera after successful capture
      setIsActive(false);
      
      const sourcePath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const destPath = `${RNFS.CachesDirectoryPath}/capture_${timestamp}.jpg`;
      
      // Copy to cache with timestamp
      await RNFS.copyFile(sourcePath, destPath);
      
      setCapturedImage(destPath);
      
      // Perform detection
      await performDetection(destPath);
    } catch (e) {
      console.error('Capture failed:', e);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
      setIsProcessing(false);
      setIsActive(true); // Re-activate camera on error
    }
  }, [camera, initReady, clear, performDetection]);

  const handleRetake = useCallback(() => {
    clear();
    setCapturedImage(null);
    setIsActive(true);
  }, [clear]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDesc}>Please allow camera access to capture images</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>📱</Text>
          <Text style={styles.permissionTitle}>No Camera Device</Text>
          <Text style={styles.permissionDesc}>No camera device found on this device</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera Preview or Captured Image */}
      <View style={styles.cameraContainer}>
        {!capturedImage ? (
          <Camera
            ref={camera}
            style={[styles.camera, { width: previewWidth, height: previewHeight }]}
            device={device}
            isActive={isActive}
            photo={true}
          />
        ) : (
          <View style={[styles.preview, { width: previewWidth, height: previewHeight }]}>
            <Image
              source={{ uri: `file://${capturedImage}` }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <Svg width={previewWidth} height={previewHeight} style={StyleSheet.absoluteFill}>
              {results.map((r, idx) => {
                const { x1, y1, x2, y2, clsName, cnf } = r.box;
                const rx = x1 * previewWidth;
                const ry = y1 * previewHeight;
                const rw = (x2 - x1) * previewWidth;
                const rh = (y2 - y1) * previewHeight;
                const centerX = (x1 + x2) / 2 * previewWidth;
                const centerY = (x1 + y2) / 2 * previewHeight;
                
                // Improved radial positioning algorithm
                // Distribute labels evenly around the perimeter
                const totalObjects = results.length;
                const angleStep = 360 / totalObjects;
                const baseAngle = idx * angleStep;
                
                // Determine best quadrant based on object position
                const isLeft = centerX < previewWidth / 2;
                const isTop = centerY < previewHeight / 2;
                
                // Adjust angle to push labels toward edges
                let adjustedAngle = baseAngle;
                if (isLeft && isTop) {
                  adjustedAngle = baseAngle - 45; // Top-left, prefer left/top edge
                } else if (!isLeft && isTop) {
                  adjustedAngle = baseAngle + 45; // Top-right, prefer right/top edge
                } else if (isLeft && !isTop) {
                  adjustedAngle = baseAngle + 135; // Bottom-left, prefer left/bottom edge
                } else {
                  adjustedAngle = baseAngle + 45; // Bottom-right, prefer right/bottom edge
                }
                
                // Calculate distance: push labels further out from the object
                const minDistance = Math.max(rw, rh) * 0.8;
                const labelRadius = minDistance + 20; // Extra padding to avoid overlap
                
                // Calculate label position
                const angleRad = (adjustedAngle * Math.PI) / 180;
                const labelX = centerX + Math.cos(angleRad) * labelRadius;
                const labelY = centerY + Math.sin(angleRad) * labelRadius;
                
                // Clamp to stay within bounds with padding
                const padding = 60; // Space for text
                const clampedLabelX = Math.max(padding, Math.min(previewWidth - padding, labelX));
                const clampedLabelY = Math.max(20, Math.min(previewHeight - 20, labelY));

                const hue = (r.box.cls * 47) % 360;
                const color = `hsl(${hue}, 85%, 55%)`;
                
                return (
                  <React.Fragment key={idx}>
                    {showBoxes ? (
                      /* Box visualization mode */
                      <>
                        <Rect 
                          x={rx} 
                          y={ry} 
                          width={rw} 
                          height={rh} 
                          stroke={color} 
                          strokeWidth={3} 
                          fill="transparent" 
                        />
                        <SvgText 
                          x={rx + 4} 
                          y={ry + 18} 
                          fill={color} 
                          fontSize={13}
                          fontWeight="600"
                        >
                          {`${clsName} ${(cnf*100).toFixed(0)}%`}
                        </SvgText>
                      </>
                    ) : (
                      /* Line/Arrow visualization mode with improved positioning */
                      <>
                        <Line
                          x1={centerX}
                          y1={centerY}
                          x2={clampedLabelX}
                          y2={clampedLabelY}
                          stroke={color}
                          strokeWidth={2}
                          opacity={0.8}
                        />
                        <Circle cx={clampedLabelX} cy={clampedLabelY} r={5} fill={color} />
                        <SvgText 
                          x={clampedLabelX + 10} 
                          y={clampedLabelY + 5} 
                          fill={color} 
                          fontSize={13}
                          fontWeight="600"
                        >
                          {`${clsName} ${(cnf*100).toFixed(0)}%`}
                        </SvgText>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!capturedImage ? (
          <>
            <View style={styles.controlsTop}>
              <Text style={styles.hint}>Tap capture to take photo</Text>
            </View>
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isProcessing || (!initReady && !IS_TEST)}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultControls}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Detecting objects...</Text>
              </View>
            ) : (
              <>
                {results.length > 0 ? (
                  <>
                    {/* Toggle between Boxes and Lines */}
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, showBoxes && styles.toggleButtonActive]}
                        onPress={() => setShowBoxes(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.toggleButtonText, showBoxes && styles.toggleButtonTextActive]}>
                          📦 Boxes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, !showBoxes && styles.toggleButtonActive]}
                        onPress={() => setShowBoxes(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.toggleButtonText, !showBoxes && styles.toggleButtonTextActive]}>
                          ➡️ Lines
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.resultsCard}>
                      <Text style={styles.resultsTitle}>🎯 Detected: {results.length} object{results.length > 1 ? 's' : ''}</Text>
                      {results.slice(0, 3).map((r, idx) => (
                        <View key={idx} style={styles.resultItem}>
                          <Text style={styles.resultLabel}>{r.box.clsName}</Text>
                          <Text style={styles.resultConf}>{(r.box.cnf * 100).toFixed(1)}%</Text>
                        </View>
                      ))}
                      {results.length > 3 && (
                        <Text style={styles.moreResults}>+{results.length - 3} more</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.noResultsCard}>
                    <Text style={styles.noResultsIcon}>🔍</Text>
                    <Text style={styles.noResultsTitle}>No Objects Detected</Text>
                    <Text style={styles.noResultsDesc}>
                      No anatomical structures were found in this image. Try capturing a different angle or ensure proper lighting.
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                  <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camera: { borderRadius: 12, overflow: 'hidden' },
  preview: { 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: { width: '100%', height: '100%' },
  controls: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 20 },
  controlsTop: { alignItems: 'center', marginBottom: 20 },
  hint: { color: '#fff', fontSize: 14, opacity: 0.8 },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  resultControls: { gap: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#fff' },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  toggleButtonTextActive: {
    color: '#007bff',
  },
  resultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
  },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultLabel: { fontSize: 14, color: '#495057', flex: 1 },
  resultConf: { fontSize: 14, fontWeight: '600', color: '#007bff' },
  moreResults: { fontSize: 12, color: '#6c757d', marginTop: 8, fontStyle: 'italic' },
  noResultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noResultsIcon: { fontSize: 48, marginBottom: 12 },
  noResultsTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  noResultsDesc: { fontSize: 14, color: '#6c757d', textAlign: 'center', lineHeight: 20 },
  retakeButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  retakeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permissionContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionText: { fontSize: 64, marginBottom: 16 },
  permissionTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  permissionDesc: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 24 },
  permissionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

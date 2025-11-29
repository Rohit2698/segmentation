# Camera Setup Instructions

## ✅ Completed Setup

The app now features a live camera preview using `react-native-vision-camera` matching the Kotlin app's MainActivity functionality.

### What's Installed
- ✅ `react-native-vision-camera@4.7.2`
- ✅ `react-native-worklets-core@1.6.2` (required dependency)
- ✅ Babel plugin configured in `babel.config.js`
- ✅ Camera permissions already in `AndroidManifest.xml`

### New Camera Screen Features
- **Live Camera Preview**: Real-time camera feed (3:4 aspect ratio like Kotlin app)
- **Direct Capture**: Tap to capture with timestamp-based naming (`capture_<timestamp>.jpg`)
- **Auto-Detection**: Automatically runs segmentation after capture
- **Permission Handling**: Prompts for camera permission on first use
- **Visual Overlays**: Shows bounding boxes and radial labels on captured images
- **Retake Function**: Easy retake button to capture new images

### Tab Navigation
1. **Scan** (Camera) - Live camera preview with capture
2. **Home** - App overview
3. **Gallery** - Pick from gallery and detect
4. **Models** - Browse available models
5. **Settings** - Manage model packages

## 🚀 Build & Run

Before running, you MUST add your model file:

```bash
# 1. Add your model (REQUIRED)
# Place your .tflite model at:
# segmentation/android/app/src/main/assets/models/yolo.tflite

# 2. Clean and rebuild
cd segmentation
yarn run android
```

## 📝 Important Notes

### Model File
- Path: `android/app/src/main/assets/models/yolo.tflite`
- Without this file, the app will show "Model not initialized" error
- Supported: YOLOv11 instance segmentation models

### Permissions
- Camera permission is requested on first app launch
- Already configured in AndroidManifest.xml

### Camera Behavior
- Opens live camera preview as first tab
- 3:4 aspect ratio (matches Kotlin MainActivity)
- Captures with timestamp naming
- Saves to cache directory
- Auto-runs detection after capture

### Troubleshooting

If camera doesn't work:
1. Ensure you granted camera permission
2. Check if running on physical device (emulator camera support varies)
3. Rebuild the app after adding vision-camera: `yarn run android`

If Metro bundler errors:
```bash
# Clear Metro cache
yarn start --reset-cache
```

If build errors:
```bash
# Clean build
cd android
./gradlew clean
cd ..
yarn run android
```

## 🎯 Usage Flow

1. **Launch App** → Opens to Camera (Scan) tab
2. **Capture** → Tap the circular capture button
3. **Auto-Detect** → Segmentation runs automatically
4. **View Results** → See boxes, labels, and detected objects list
5. **Retake** → Tap "Retake Photo" to capture again

This matches the Kotlin app's MainActivity workflow: Camera → Capture → Process → Display Results.

# 🧠 AI Object Detection App (React Native + TensorFlow Lite)

## 🚀 Overview

This app performs **real-time object detection** using the **device camera** and a **TensorFlow Lite (.tflite)** model.  
It supports multiple models (e.g., Macro Scan, Brachial Plexus) and includes model management via the **Settings** screen.

The app has three main sections:
1. **Macro Scan** → Real-time AI detection using `.tflite` model  
2. **Available Sections** → View and choose available detection models  
3. **Settings** → Manage `.tflite` model packages (add/remove/update)

---

## ⚙️ Tech Stack

| Feature | Library |
|----------|----------|
| Camera Feed | [`react-native-vision-camera`](https://github.com/mrousavy/react-native-vision-camera) |
| TensorFlow Lite Inference | [`react-native-tflite`](https://github.com/shaqian/react-native-tflite) |
| File Handling | [`react-native-fs`](https://github.com/itinance/react-native-fs) |
| Overlays (Arrows, Boxes) | [`react-native-svg`](https://github.com/react-native-svg/react-native-svg) |
| State Management | [`zustand`](https://github.com/pmndrs/zustand) |
| Animations | [`react-native-reanimated`](https://github.com/software-mansion/react-native-reanimated) |
| Navigation | [`@react-navigation/native`](https://reactnavigation.org/) |
| Permissions | [`react-native-permissions`](https://github.com/zoontek/react-native-permissions) |

---

## 🏗️ Project Setup

### 1. Create React Native CLI Project
```bash
npx react-native init AIDetectorApp
cd AIDetectorApp

🧠 App Flow
1. Home Screen

Shows three main options:

Macro Scan → Opens camera for real-time detection.

Available Sections → Lists all detection models (e.g., Brachial Plexus).

Settings → Allows managing .tflite model packages.

2. Macro Scan Screen

Uses react-native-vision-camera for real-time video feed.

Streams frames to TensorFlow Lite via react-native-tflite.

Displays detection results using react-native-svg overlays.

Arrows/labels are positioned radially around bounding boxes to avoid overlap.

3. Available Sections Screen

Lists all .tflite models stored locally.

Allows users to select which model to activate for scanning.

Example:

macro_scan_model.tflite

brachial_plexus_model.tflite

4. Settings Screen

Add, delete, or download new .tflite models.

Uses react-native-fs for file operations.

You can integrate API endpoints to fetch models from the server.
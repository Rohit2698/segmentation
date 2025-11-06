import { NativeModules } from 'react-native';

const { YoloSegmentationModule } = NativeModules as any;

let _initialized = false;
let _modelPath: string | null = null;
let _labelPath: string | null = null;

export type YoloBox = {
  x1: number; y1: number; x2: number; y2: number;
  cx: number; cy: number; w: number; h: number;
  cnf: number; cls: number; clsName: string;
};

export type YoloResult = {
  box: YoloBox;
  mask: number[][]; // 2D mask values (scaled)
};

export type DetectResponse = {
  preProcessTime: number;
  interfaceTime: number;
  postProcessTime: number;
  results: YoloResult[];
};

function ensure() {
  if (!YoloSegmentationModule) {
    throw new Error('YoloSegmentationModule not linked. Did you rebuild the app?');
  }
}

export async function initialize(modelAssetPath: string, labelAssetPath?: string): Promise<boolean> {
  ensure();
  const ok = await YoloSegmentationModule.initialize(modelAssetPath, labelAssetPath ?? null);
  _initialized = !!ok;
  _modelPath = modelAssetPath;
  _labelPath = labelAssetPath ?? null;
  return ok;
}

export async function detect(imagePath: string): Promise<DetectResponse> {
  ensure();
  if (!_initialized) {
    if (_modelPath) {
      // Attempt lazy initialization once
      await initialize(_modelPath, _labelPath ?? undefined);
    } else {
      throw new Error('Model not initialized and no modelPath known. Call initialize(modelPath) first.');
    }
  }
  const res = await YoloSegmentationModule.detect(imagePath);
  return res as DetectResponse;
}

export function close() {
  if (YoloSegmentationModule?.close) YoloSegmentationModule.close();
  _initialized = false;
  _modelPath = null;
  _labelPath = null;
}

export function isInitialized() { return _initialized; }

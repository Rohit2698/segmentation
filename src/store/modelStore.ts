import { create } from 'zustand';
import RNFS from 'react-native-fs';
import { MODEL_ASSET } from '../screens/Camera/util';

export type ModelOrigin = 'bundled' | 'download';

export type ModelPackage = {
  id: string;
  name: string;
  fileName: string;
  size: string;
  storagePath: string;
  origin: ModelOrigin;
  installed: boolean;
  downloadUrl?: string;
};

// Dedicated subfolder for downloaded models inside app sandbox (private app storage).
// This avoids Android 10+ scoped storage issues when reading from public Downloads.
export const MODEL_DOWNLOAD_DIR = `${RNFS.DocumentDirectoryPath}/models`;

type ModelState = {
  packages: ModelPackage[];
  activeModelId: string;
  setActiveModel: (id: string) => void;
  markInstalled: (id: string, installed: boolean) => void;
  ensureDownloadDir: () => Promise<void>;
  syncFromDisk: () => Promise<void>;
};

export const INITIAL_PACKAGES: ModelPackage[] = [
  {
    id: 'bundled-humanpart',
    name: 'Human Part Segmentation (Bundled)',
    fileName: 'humanpart_seg_float16.tflite',
    size: '24.1 MB',
    storagePath: MODEL_ASSET,
    origin: 'bundled',
    installed: true,
  },
  {
    id: 'humanpart-det',
    name: 'Human Part Detection',
    fileName: 'humanpart_det_float32.tflite',
    size: '~30 MB',
    storagePath: `${MODEL_DOWNLOAD_DIR}/humanpart_det_float32.tflite`,
    origin: 'download',
    downloadUrl:
      'https://github.com/Rohit2698/segmentation/releases/download/humanpart_det_float16/humanpart_det_float32.tflite',
    installed: false,
  },
];

export const useModelStore = create<ModelState>((set, get) => ({
  packages: INITIAL_PACKAGES,
  activeModelId: INITIAL_PACKAGES[0]?.id ?? 'bundled-humanpart',

  setActiveModel: (id) =>
    set((state) => {
      const pkg = state.packages.find((p) => p.id === id);
      if (!pkg || !pkg.installed) {
        return state;
      }
      return { ...state, activeModelId: id };
    }),

  markInstalled: (id, installed) =>
    set((state) => ({
      ...state,
      packages: state.packages.map((p) =>
        p.id === id ? { ...p, installed } : p
      ),
      // If a model is uninstalled and it was active, fall back to bundled.
      activeModelId:
        !installed && state.activeModelId === id
          ? INITIAL_PACKAGES[0]?.id ?? state.activeModelId
          : state.activeModelId,
    })),

  ensureDownloadDir: async () => {
    const exists = await RNFS.exists(MODEL_DOWNLOAD_DIR);
    if (!exists) {
      await RNFS.mkdir(MODEL_DOWNLOAD_DIR);
    }
  },

  // Check disk for any downloaded models and update installed flags.
  syncFromDisk: async () => {
    const { packages } = get();
    const updated = await Promise.all(
      packages.map(async (p) => {
        if (p.origin !== 'download') return p;
        try {
          const exists = await RNFS.exists(p.storagePath);
          return { ...p, installed: exists };
        } catch {
          return p;
        }
      })
    );
    set((state) => ({
      ...state,
      packages: updated,
    }));
  },
}));



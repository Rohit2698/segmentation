import { create } from 'zustand';
import type { DetectResponse, YoloResult } from '../native/yolo';

interface DetectionState {
  loading: boolean;
  last: DetectResponse | null;
  results: YoloResult[];
  setLoading: (b: boolean) => void;
  setResponse: (r: DetectResponse) => void;
  clear: () => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  loading: false,
  last: null,
  results: [],
  setLoading: (b) => set({ loading: b }),
  setResponse: (r) => set({ last: r, results: r.results, loading: false }),
  clear: () => set({ last: null, results: [], loading: false }),
}));

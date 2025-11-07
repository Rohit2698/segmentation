export const MODEL_ASSET = 'models/humanpart_seg_float16.tflite';
export const LABEL_ASSET: string | undefined = undefined;

export const IS_TEST = true;

// Mock data for testing UI
export const MOCK_RESULTS = [
  {
    box: {
      x1: 0.2, y1: 0.15, x2: 0.5, y2: 0.4,
      cx: 0.35, cy: 0.275, w: 0.3, h: 0.25,
      cnf: 0.92, cls: 0, clsName: 'Lateral Cord',
    },
    mask: [],
  },
  {
    box: {
      x1: 0.5, y1: 0.3, x2: 0.75, y2: 0.6,
      cx: 0.625, cy: 0.45, w: 0.25, h: 0.3,
      cnf: 0.87, cls: 1, clsName: 'Axillary Nerve',
    },
    mask: [],
  },
  {
    box: {
      x1: 0.15, y1: 0.5, x2: 0.4, y2: 0.8,
      cx: 0.275, cy: 0.65, w: 0.25, h: 0.3,
      cnf: 0.81, cls: 2, clsName: 'Median Nerve',
    },
    mask: [],
  },
];

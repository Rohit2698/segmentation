### Context

We have a React Native app that uses a custom Android TFLite integration for **instance segmentation**.  
The existing native pipeline (`InstanceSegmentation.kt` + `YoloSegmentationModule.kt`) is wired for a **specific YOLO-style segmentation model** that ships bundled with the app:

- Bundled model: `humanpart_seg_float16.tflite`
- Stored as an **asset** and loaded with `FileUtil.loadMappedFile(context, "models/humanpart_seg_float16.tflite")`
- Works end‑to‑end today: the app can initialize the model and display boxes/masks as expected.

We are adding a second model that should be:

- Downloaded at runtime into app storage.
- Selectable in the app’s Settings screen.
- Usable by the same camera screen for inference.

This second model is:

- Downloaded model: `humanpart_det_float32.tflite`
- Stored under app private storage (Android):  
  `/data/user/0/com.segmentatioa/files/models/humanpart_det_float32.tflite`
- The Java/Kotlin side successfully opens the file (no `FileNotFoundException` anymore).
- **Current failure**: when the interpreter is created and we try to read outputs, we get:
  - `java.lang.IllegalArgumentException: Invalid output Tensor index: 1`

This means: the **output tensor structure** of `humanpart_det_float32.tflite` does not match what our existing `InstanceSegmentation` code expects.

---

### What the current native code expects (segmentation model)

The current `InstanceSegmentation` implementation assumes a YOLO‑style **segmentation** model with:

- **Input**
  - Single input tensor, float32, shape similar to `[1, H, W, 3]` or `[1, 3, H, W]`
  - The code reads `inputShape = interpreter.getInputTensor(0).shape()`
  - It then determines `tensorWidth`, `tensorHeight` from that shape.

- **Outputs**
  - It expects **two output tensors**:
    1. Output 0: coordinates & class scores (boxes)
       - Shape `[1, numChannel, numElements]`
       - It interprets this as:
         - For each of `numElements` positions:
           - 4 values for `cx, cy, w, h`
           - followed by `numClasses` class confidences
           - followed by `masksNum` mask weights
    2. Output 1: mask prototype tensor
       - Shape `[1, xPoints, yPoints, masksNum]` (or a transposed equivalent; code handles both layouts)
       - Used to build the final per‑object mask from the mask weights.

- **Post‑processing**
  - Computes best boxes from output 0 with a confidence threshold and NMS.
  - Uses output 1 + mask weights to derive per‑object masks.
  - Returns `SegmentationResult { box: Output0, mask: Array<FloatArray> }` per detection.

This exactly matches the bundled `humanpart_seg_float16.tflite`, which is why that model works.

---

### What is happening with the downloaded model

For the downloaded model `humanpart_det_float32.tflite`:

- File location and loading are now correct: the interpreter is created from the TFLite file.
- When we inspect `interpreter.outputTensorCount` and call `getOutputTensor(1)`, TFLite throws:
  - `Invalid output Tensor index: 1`

This indicates:

- The downloaded model **does not have a second output tensor**, or
- The outputs are arranged differently than `[0: boxes, 1: mask prototype]`.

We tried to make the native code more flexible (handling 1‑output vs 2‑output models), but the model’s output structure is still incompatible with the current **segmentation‑specific decoding logic**.

In other words: we can **load** the model file, but we **don’t know how to correctly interpret its outputs** with the existing code.

---

### What we need from you (engineering / ML team)

We need you to tell us **exactly what the downloaded model’s interface is**, and then decide between two integration strategies.

#### 1. Exact model interface for `humanpart_det_float32.tflite`

Please provide **for the TFLite model you want us to use** (`humanpart_det_float32.tflite`):

- **Input tensor(s)**
  - Number of inputs.
  - For each input:
    - `name`
    - `dtype` (e.g. `float32`, `uint8`)
    - `shape` (e.g. `[1, 640, 640, 3]`)
    - Any required normalization / scaling (e.g. input in `[0,1]`, `[0,255]`, mean/std, etc.).

- **Output tensor(s)**
  - `interpreter.get_output_details()` or equivalent, including:
    - Number of output tensors.
    - For each output:
      - `index` (0, 1, …)
      - `name`
      - `dtype`
      - `shape` (e.g. `[1, 84, 8400]` etc.)
  - A clear explanation of what each output represents:
    - Which dimensions correspond to:
      - Center x/y, width, height.
      - Per‑class scores.
      - Any objectness score.
      - Any mask prototype / features (if the model supports masks).

- **Decoding logic**
  - Precise description of how to go from raw output tensors to final boxes (and masks if applicable):
    - How to compute `cx, cy, w, h` from raw outputs (and whether they are normalized [0–1] or pixel units).
    - Any anchor/grid decoding (e.g. if it’s YOLOv5/v8‑style with grids/strides).
    - How to combine class scores + objectness (if separate).
    - How to generate mask logits if there is a mask head.
  - Confidence thresholds and NMS parameters you expect us to use by default (or confirm the ones in our existing `InstanceSegmentation` are fine).

#### 2. Tell us which integration strategy you prefer

We see two clean options to make this work.

##### Option A – Make the detection model “drop‑in compatible” with existing segmentation code

You export a **new TFLite model** for detection whose interface matches the **same output layout** as our current `InstanceSegmentation` expects:

- 1 input tensor (same shape/order as bundled model).
- 2 output tensors:
  - Output 0: `[1, numChannel, numElements]` with the same layout for:
    - `cx, cy, w, h`
    - class scores
    - mask weights (or dummy mask weights if you don’t need masks).
  - Output 1: `[1, xPoints, yPoints, masksNum]` (mask prototype).

If you can make `humanpart_det_float32.tflite` follow that same signature (even if masks are trivial), we can reuse `InstanceSegmentation` unchanged and everything “just works” with minimal code changes.

Please tell us:

- Whether you can export such a model (same interface as `humanpart_seg_float16.tflite`).
- If not exactly the same, what the minimal differences would be (we can adjust field mapping if needed, as long as tensor counts/shapes are close).

##### Option B – Define a dedicated detection integration path

If the detection model is fundamentally different (e.g. **no masks**, only boxes; or a different output tensor layout), then we should:

- Implement a **new native class** (e.g. `InstanceDetection.kt`) with:
  - Correct input preprocessing (sizes, normalization) for the detection model.
  - Correct decoding logic for its outputs.
  - A way to return either:
    - The same `SegmentationResult` type but with `mask` empty; or
    - A new `DetectionResult` type that our JS/frontend can handle.
- Extend the bridge (`YoloSegmentationModule`) or create a new one to:
  - Initialize with the detection model path.
  - Run detection and convert outputs into our JS‑friendly format.

To implement this correctly we need from you:

- Complete model interface (see section 1).
- Reference pseudocode (Python/NumPy) that:
  - Takes the raw outputs.
  - Produces a list of final detections (with `cx, cy, w, h, classId, className, confidence` and optionally mask).

We can then port that logic to Kotlin.

---

### Summary of the current blocker

- We **can**:
  - Download `humanpart_det_float32.tflite` into app storage.
  - Open it from Kotlin and create a TFLite `Interpreter`.
  - Initialize the camera screen with that model path.

- We **cannot yet**:
  - Correctly interpret the model outputs because:
    - The existing native code assumes a 2‑output segmentation model.
    - The detection model has a different output tensor configuration, causing `Invalid output Tensor index: 1` and/or mismatched shapes.

**We need your help** to either:

1. Provide a detection model whose interface matches the existing segmentation pipeline, or  
2. Provide the exact output specification and decoding logic so we can implement a dedicated detection pipeline in Kotlin.

Once we have that information, we can finish wiring up the downloaded model so that users can:

- Download `humanpart_det_float32.tflite` from the provided URL.
- Activate it in the Settings screen.
- Use it in the Camera screen for live detection, switching between bundled segmentation and downloaded detection as needed.



package com.segmentatioa.yolo

import android.graphics.BitmapFactory
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = YoloSegmentationModule.NAME)
class YoloSegmentationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val NAME = "YoloSegmentationModule"
  }

  private var detector: InstanceSegmentation? = null
  private var modelPath: String? = null
  private var labelsPath: String? = null

  override fun getName(): String = NAME

  @ReactMethod
  fun initialize(modelAssetPath: String, labelAssetPath: String?, promise: Promise) {
    try {
      modelPath = modelAssetPath
      labelsPath = labelAssetPath
      detector?.close()
      detector = InstanceSegmentation(
        reactApplicationContext,
        modelAssetPath,
        labelAssetPath,
        object : InstanceSegmentation.InstanceSegmentationListener {
          override fun onError(error: String) { /* no-op for init */ }
          override fun onEmpty() { /* no-op for init */ }
          override fun onDetect(interfaceTime: Long, results: List<SegmentationResult>, preProcessTime: Long, postProcessTime: Long) { /* no-op */ }
        }
      ) { /* message */ }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("init_error", e)
    }
  }

  @ReactMethod
  fun detect(imagePath: String, promise: Promise) {
    val det = detector
    if (det == null) {
      promise.reject("not_initialized", "Call initialize(modelPath) first")
      return
    }
    try {
      val bmp = BitmapFactory.decodeFile(imagePath)
      det.invoke(bmp)
      // create listener to capture
      val listenerDet = InstanceSegmentation(
        reactApplicationContext,
        modelPath!!,
        labelsPath,
        object : InstanceSegmentation.InstanceSegmentationListener {
          override fun onError(error: String) {
            promise.reject("detect_error", error)
          }
          override fun onEmpty() {
            val map = Arguments.createMap()
            map.putArray("results", Arguments.createArray())
            map.putDouble("preProcessTime", 0.0)
            map.putDouble("interfaceTime", 0.0)
            map.putDouble("postProcessTime", 0.0)
            promise.resolve(map)
          }
          override fun onDetect(interfaceTime: Long, results: List<SegmentationResult>, preProcessTime: Long, postProcessTime: Long) {
            val map = Arguments.createMap()
            map.putDouble("preProcessTime", preProcessTime.toDouble())
            map.putDouble("interfaceTime", interfaceTime.toDouble())
            map.putDouble("postProcessTime", postProcessTime.toDouble())
            val arr = Arguments.createArray()
            results.forEach { r ->
              val rMap = Arguments.createMap()
              val b = r.box
              rMap.putMap("box", Arguments.createMap().apply {
                putDouble("x1", b.x1.toDouble())
                putDouble("y1", b.y1.toDouble())
                putDouble("x2", b.x2.toDouble())
                putDouble("y2", b.y2.toDouble())
                putDouble("cx", b.cx.toDouble())
                putDouble("cy", b.cy.toDouble())
                putDouble("w", b.w.toDouble())
                putDouble("h", b.h.toDouble())
                putDouble("cnf", b.cnf.toDouble())
                putInt("cls", b.cls)
                putString("clsName", b.clsName)
              })
              // Convert mask (FloatArray[][]) to nested arrays (row-major)
              val maskRows = Arguments.createArray()
              r.mask.forEach { row ->
                val rowArr = Arguments.createArray()
                row.forEach { v -> rowArr.pushDouble(v.toDouble()) }
                maskRows.pushArray(rowArr)
              }
              rMap.putArray("mask", maskRows)
              arr.pushMap(rMap)
            }
            map.putArray("results", arr)
            promise.resolve(map)
          }
        }
      ) { /* message */ }
      listenerDet.invoke(bmp)
    } catch (e: Exception) {
      promise.reject("detect_exception", e)
    }
  }

  @ReactMethod
  fun close() {
    detector?.close()
    detector = null
  }
}

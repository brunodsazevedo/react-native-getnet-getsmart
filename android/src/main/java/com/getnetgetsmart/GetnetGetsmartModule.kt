package com.getnetgetsmart

import com.facebook.react.bridge.ReactApplicationContext

class GetnetGetsmartModule(reactContext: ReactApplicationContext) :
  NativeGetnetGetsmartSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeGetnetGetsmartSpec.NAME
  }
}

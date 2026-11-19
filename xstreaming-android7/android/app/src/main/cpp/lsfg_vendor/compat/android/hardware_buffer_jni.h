#pragma once

#if defined(__ANDROID_API__) && __ANDROID_API__ >= 26
#include_next <android/hardware_buffer_jni.h>
#else

#include <android/hardware_buffer.h>
#include <jni.h>

#ifdef __cplusplus
extern "C" {
#endif

AHardwareBuffer* AHardwareBuffer_fromHardwareBuffer(JNIEnv* env, jobject hardwareBufferObj);
jobject AHardwareBuffer_toHardwareBuffer(JNIEnv* env, AHardwareBuffer* hardwareBuffer);

#ifdef __cplusplus
}
#endif

#endif

#pragma once

#if defined(__ANDROID_API__) && __ANDROID_API__ >= 26
#include_next <android/hardware_buffer.h>
#else

#include <android/rect.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct AHardwareBuffer AHardwareBuffer;

typedef struct AHardwareBuffer_Desc {
    uint32_t width;
    uint32_t height;
    uint32_t layers;
    uint32_t format;
    uint64_t usage;
    uint32_t stride;
    uint32_t rfu0;
    uint64_t rfu1;
} AHardwareBuffer_Desc;

enum {
    AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM = 1,
    AHARDWAREBUFFER_FORMAT_R8G8B8X8_UNORM = 2,
    AHARDWAREBUFFER_FORMAT_R8G8B8_UNORM = 3,
    AHARDWAREBUFFER_FORMAT_R5G6B5_UNORM = 4,
    AHARDWAREBUFFER_FORMAT_R16G16B16A16_FLOAT = 0x16,
    AHARDWAREBUFFER_FORMAT_R10G10B10A2_UNORM = 0x2b,
    AHARDWAREBUFFER_FORMAT_BLOB = 0x21,
    AHARDWAREBUFFER_FORMAT_D16_UNORM = 0x30,
    AHARDWAREBUFFER_FORMAT_D24_UNORM = 0x31,
    AHARDWAREBUFFER_FORMAT_D24_UNORM_S8_UINT = 0x32,
    AHARDWAREBUFFER_FORMAT_D32_FLOAT = 0x33,
    AHARDWAREBUFFER_FORMAT_D32_FLOAT_S8_UINT = 0x34,
    AHARDWAREBUFFER_FORMAT_S8_UINT = 0x35,
    AHARDWAREBUFFER_FORMAT_Y8Cb8Cr8_420 = 0x23,
};

enum {
    AHARDWAREBUFFER_USAGE_CPU_READ_NEVER = 0ULL,
    AHARDWAREBUFFER_USAGE_CPU_READ_RARELY = 2ULL,
    AHARDWAREBUFFER_USAGE_CPU_READ_OFTEN = 3ULL,
    AHARDWAREBUFFER_USAGE_CPU_READ_MASK = 0xFULL,
    AHARDWAREBUFFER_USAGE_CPU_WRITE_NEVER = 0ULL << 4,
    AHARDWAREBUFFER_USAGE_CPU_WRITE_RARELY = 2ULL << 4,
    AHARDWAREBUFFER_USAGE_CPU_WRITE_OFTEN = 3ULL << 4,
    AHARDWAREBUFFER_USAGE_CPU_WRITE_MASK = 0xFULL << 4,
    AHARDWAREBUFFER_USAGE_GPU_SAMPLED_IMAGE = 1ULL << 8,
    AHARDWAREBUFFER_USAGE_GPU_COLOR_OUTPUT = 1ULL << 9,
    AHARDWAREBUFFER_USAGE_GPU_FRAMEBUFFER = 1ULL << 9,
    AHARDWAREBUFFER_USAGE_PROTECTED_CONTENT = 1ULL << 14,
    AHARDWAREBUFFER_USAGE_VIDEO_ENCODE = 1ULL << 16,
    AHARDWAREBUFFER_USAGE_SENSOR_DIRECT_DATA = 1ULL << 23,
    AHARDWAREBUFFER_USAGE_GPU_DATA_BUFFER = 1ULL << 24,
    AHARDWAREBUFFER_USAGE_GPU_CUBE_MAP = 1ULL << 25,
    AHARDWAREBUFFER_USAGE_GPU_MIPMAP_COMPLETE = 1ULL << 26,
};

int AHardwareBuffer_allocate(const AHardwareBuffer_Desc* desc, AHardwareBuffer** outBuffer);
void AHardwareBuffer_release(AHardwareBuffer* buffer);
void AHardwareBuffer_acquire(AHardwareBuffer* buffer);
void AHardwareBuffer_describe(const AHardwareBuffer* buffer, AHardwareBuffer_Desc* outDesc);
int AHardwareBuffer_lock(AHardwareBuffer* buffer, uint64_t usage, int32_t fence,
                         const ARect* rect, void** outVirtualAddress);
int AHardwareBuffer_unlock(AHardwareBuffer* buffer, int32_t* fence);

#ifdef __cplusplus
}
#endif

#endif

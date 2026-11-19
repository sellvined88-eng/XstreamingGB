#include <android/hardware_buffer.h>
#include <android/hardware_buffer_jni.h>

#if !defined(__ANDROID_API__) || __ANDROID_API__ < 26

#include <dlfcn.h>
#include <mutex>

namespace {

using PFN_AHB_allocate = int (*)(const AHardwareBuffer_Desc*, AHardwareBuffer**);
using PFN_AHB_release = void (*)(AHardwareBuffer*);
using PFN_AHB_acquire = void (*)(AHardwareBuffer*);
using PFN_AHB_describe = void (*)(const AHardwareBuffer*, AHardwareBuffer_Desc*);
using PFN_AHB_lock = int (*)(AHardwareBuffer*, uint64_t, int32_t, const ARect*, void**);
using PFN_AHB_unlock = int (*)(AHardwareBuffer*, int32_t*);
using PFN_AHB_fromHardwareBuffer = AHardwareBuffer* (*)(JNIEnv*, jobject);
using PFN_AHB_toHardwareBuffer = jobject (*)(JNIEnv*, AHardwareBuffer*);

struct AhbSymbols {
    PFN_AHB_allocate allocate = nullptr;
    PFN_AHB_release release = nullptr;
    PFN_AHB_acquire acquire = nullptr;
    PFN_AHB_describe describe = nullptr;
    PFN_AHB_lock lock = nullptr;
    PFN_AHB_unlock unlock = nullptr;
    PFN_AHB_fromHardwareBuffer fromHardwareBuffer = nullptr;
    PFN_AHB_toHardwareBuffer toHardwareBuffer = nullptr;
};

const AhbSymbols& getAhbSymbols() {
    static AhbSymbols syms{};
    static std::once_flag once;
    std::call_once(once, []() {
        void* handle = dlopen("libandroid.so", RTLD_NOW | RTLD_LOCAL);
        if (!handle) {
            handle = dlopen("libnativewindow.so", RTLD_NOW | RTLD_LOCAL);
        }
        if (handle) {
            syms.allocate = reinterpret_cast<PFN_AHB_allocate>(dlsym(handle, "AHardwareBuffer_allocate"));
            syms.release = reinterpret_cast<PFN_AHB_release>(dlsym(handle, "AHardwareBuffer_release"));
            syms.acquire = reinterpret_cast<PFN_AHB_acquire>(dlsym(handle, "AHardwareBuffer_acquire"));
            syms.describe = reinterpret_cast<PFN_AHB_describe>(dlsym(handle, "AHardwareBuffer_describe"));
            syms.lock = reinterpret_cast<PFN_AHB_lock>(dlsym(handle, "AHardwareBuffer_lock"));
            syms.unlock = reinterpret_cast<PFN_AHB_unlock>(dlsym(handle, "AHardwareBuffer_unlock"));
            syms.fromHardwareBuffer = reinterpret_cast<PFN_AHB_fromHardwareBuffer>(dlsym(handle, "AHardwareBuffer_fromHardwareBuffer"));
            syms.toHardwareBuffer = reinterpret_cast<PFN_AHB_toHardwareBuffer>(dlsym(handle, "AHardwareBuffer_toHardwareBuffer"));
        }
    });
    return syms;
}

} // namespace

extern "C" {

int AHardwareBuffer_allocate(const AHardwareBuffer_Desc* desc, AHardwareBuffer** outBuffer) {
    if (outBuffer) {
        *outBuffer = nullptr;
    }
    const auto& s = getAhbSymbols();
    return s.allocate ? s.allocate(desc, outBuffer) : -1;
}

void AHardwareBuffer_release(AHardwareBuffer* buffer) {
    if (!buffer) return;
    const auto& s = getAhbSymbols();
    if (s.release) {
        s.release(buffer);
    }
}

void AHardwareBuffer_acquire(AHardwareBuffer* buffer) {
    if (!buffer) return;
    const auto& s = getAhbSymbols();
    if (s.acquire) {
        s.acquire(buffer);
    }
}

void AHardwareBuffer_describe(const AHardwareBuffer* buffer, AHardwareBuffer_Desc* outDesc) {
    if (outDesc) {
        *outDesc = AHardwareBuffer_Desc{};
    }
    if (!buffer || !outDesc) return;
    const auto& s = getAhbSymbols();
    if (s.describe) {
        s.describe(buffer, outDesc);
    }
}

int AHardwareBuffer_lock(AHardwareBuffer* buffer, uint64_t usage, int32_t fence,
                         const ARect* rect, void** outVirtualAddress) {
    if (outVirtualAddress) {
        *outVirtualAddress = nullptr;
    }
    if (!buffer) return -1;
    const auto& s = getAhbSymbols();
    return s.lock ? s.lock(buffer, usage, fence, rect, outVirtualAddress) : -1;
}

int AHardwareBuffer_unlock(AHardwareBuffer* buffer, int32_t* fence) {
    if (!buffer) return -1;
    const auto& s = getAhbSymbols();
    return s.unlock ? s.unlock(buffer, fence) : -1;
}

AHardwareBuffer* AHardwareBuffer_fromHardwareBuffer(JNIEnv* env, jobject hardwareBufferObj) {
    if (!hardwareBufferObj) return nullptr;
    const auto& s = getAhbSymbols();
    return s.fromHardwareBuffer ? s.fromHardwareBuffer(env, hardwareBufferObj) : nullptr;
}

jobject AHardwareBuffer_toHardwareBuffer(JNIEnv* env, AHardwareBuffer* hardwareBuffer) {
    if (!hardwareBuffer) return nullptr;
    const auto& s = getAhbSymbols();
    return s.toHardwareBuffer ? s.toHardwareBuffer(env, hardwareBuffer) : nullptr;
}

} // extern "C"

#endif

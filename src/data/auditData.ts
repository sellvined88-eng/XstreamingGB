export interface AuditItem {
  id: string;
  file: string;
  category: 'gradle-cpp' | 'java-api24' | 'rn-js' | 'ci-patches';
  categoryLabel: string;
  blocker: string;
  adaptation: string;
}

export const ZIP_METADATA = {
  filename: 'xstreaming-2.12.0-android7-api24.zip',
  downloadPath: '/xstreaming-2.12.0-android7-api24.zip',
  sizeBytes: 92849861,
  sizeHuman: '88.55 MB',
  fileCount: 665,
  sha256: 'f323c2b4941d9e8902a1e272a5e1b0b09831fcd165cfa7d05127e64d09caa902',
  upstreamRepo: 'https://github.com/Geocld/XStreaming',
  upstreamVersion: '2.12.0',
  license: 'AGPL-3.0',
};

export const DEVICE_PROFILE = [
  { label: 'Dispositivo objetivo', value: 'ASUS P008 (VZW_P008)' },
  { label: 'Sistema / API', value: 'Android 7.0 Nougat · API Level 24' },
  { label: 'SoC / Arquitectura', value: 'Qualcomm Snapdragon 650 · ARM64 (arm64-v8a)' },
  { label: 'GPU / API Gráfica', value: 'Adreno 510 · OpenGL ES 3.2' },
  { label: 'Memoria RAM física', value: '~2 GB (largeHeap="true" activado)' },
  { label: 'Pantalla', value: '1536 × 2048 px (4:3)' },
  { label: 'Proveedor WebView', value: 'Google Chrome fallback (System WebView deshabilitado)' },
  { label: 'Mando probado', value: 'GameSir Nova Lite (Bluetooth / USB-OTG opcional)' },
];

export const RECOMMENDED_PRESETS = [
  {
    setting: 'Motor de renderizado',
    value: 'Native (WebRTC + MediaCodec)',
    reason: 'Decodificación por hardware en Snapdragon 650 con menor consumo de RAM que WebView.',
  },
  {
    setting: 'Resolución / Bitrate',
    value: '720P (o 1080P a 10–14 Mbps)',
    reason: 'Equilibrio térmico y de memoria estable para 2 GB de RAM física en Adreno 510.',
  },
  {
    setting: 'Códec preferido',
    value: 'Auto / H264-High',
    reason: 'Soporte nativo completo en el decodificador hardware Qualcomm de Android 7.0.',
  },
  {
    setting: 'Smart FrameGen / PiP',
    value: 'Desactivado automáticamente (< API 29 / 26)',
    reason: 'Evita carga innecesaria de liblsfg-android.so, ImageReader.Builder y PiP en Nougat.',
  },
];

export const AUDIT_ITEMS: AuditItem[] = [
  {
    id: '01',
    file: 'android/build.gradle',
    category: 'gradle-cpp',
    categoryLabel: 'Gradle & C++',
    blocker: 'minSdkVersion fijado en 26 y repositorios Maven globales comentados.',
    adaptation:
      'Reduce minSdkVersion a 24 manteniendo compileSdkVersion/targetSdkVersion en 34, NDK 23.1.7779620 y reactiva google()/mavenCentral().',
  },
  {
    id: '02',
    file: 'android/app/build.gradle',
    category: 'gradle-cpp',
    categoryLabel: 'Gradle & C++',
    blocker:
      'nanoRustHostTag solo detectaba macOS (darwin) y release exigía keystore privado ausente del repo público.',
    adaptation:
      'Detección multiplataforma NDK (linux-x86_64, linux-aarch64, windows, darwin) para compilar nano-rs en API 24 y fallback seguro a signingConfigs.debug si no hay keystore.',
  },
  {
    id: '03',
    file: 'android/app/src/main/AndroidManifest.xml',
    category: 'gradle-cpp',
    categoryLabel: 'Gradle & C++',
    blocker:
      'El filtrado estricto de USB Host podía bloquear instalación y 2 GB RAM requerían margen de heap.',
    adaptation:
      'Añade uses-feature android.hardware.usb.host con required="false" y habilita android:largeHeap="true" en <application>.',
  },
  {
    id: '04',
    file: 'android/app/CMakeLists.txt',
    category: 'gradle-cpp',
    categoryLabel: 'Gradle & C++',
    blocker:
      'Al bajar el sysroot NDK a API 24 faltaban cabeceras y símbolos de enlace para AHardwareBuffer (API 26).',
    adaptation:
      'Prioriza la carpeta lsfg_vendor/compat con include_directories(BEFORE), compila ahb_compat.cpp y enlaza libdl.',
  },
  {
    id: '05',
    file: 'android/app/src/main/cpp/lsfg_vendor/compat/*',
    category: 'gradle-cpp',
    categoryLabel: 'Gradle & C++',
    blocker: 'Errores de enlace C++/JNI al compilar lsfg-android contra API 24.',
    adaptation:
      'Capa compat (hardware_buffer.h, hardware_buffer_jni.h, ahb_compat.cpp) que resuelve AHardwareBuffer_* en tiempo de ejecución vía dlopen/dlsym cuando el dispositivo es API 26+.',
  },
  {
    id: '06',
    file: 'android/app/src/main/java/com/xstreaming/FullScreenManager.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'WebView.getCurrentWebViewPackage() (API 26) rompía verificación ART o devolvía vacío en tablets con Chrome como WebView.',
    adaptation:
      'Aísla la llamada en Api26WebViewHelper y añade detección por PackageManager (com.android.chrome, beta, dev, webview) verificando applicationInfo.enabled, más guardas null de actividad y vibrador.',
  },
  {
    id: '07',
    file: 'android/app/src/main/java/com/xstreaming/XalManager.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'java.time.Instant y java.util.Base64 requieren API 26 (Android 8.0) en autenticación XAL.',
    adaptation:
      'Reemplaza Instant por System.currentTimeMillis() / 1000L y java.util.Base64 por android.util.Base64 manteniendo la firma ECDSA P-256 idéntica.',
  },
  {
    id: '08',
    file: 'android/app/src/main/java/com/xstreaming/MainActivity.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'PictureInPictureParams (API 26) expuesto en clase externa y riesgo de NullPointerException en InputDevice.',
    adaptation:
      'Mueve PictureInPictureParams a Api26PipHelper aislado, valida SDK_INT >= O en PiP y añade guardas inputDevice != null en remapeo y MotionEvent.',
  },
  {
    id: '09',
    file: 'android/app/src/main/java/com/xstreaming/PipManager.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'Import directo de PictureInPictureParams y uso en el módulo nativo.',
    adaptation:
      'Aísla PictureInPictureParams en Api26Helper con @TargetApi(26) y devuelve false limpio en Android 7.0.',
  },
  {
    id: '10',
    file: 'android/app/src/main/java/com/xstreaming/GamepadManager.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'VibrationEffect (API 26), VibratorManager/CombinedVibration (API 31) y VibrationAttributes (API 33) en clase principal.',
    adaptation:
      'Sustituye el campo por Object y encapsula toda la API >= 26/31/33 dentro de Api26VibratorHelper, Api31VibratorHelper y Api33VibratorHelper, conservando vibrate(duration) en API 24.',
  },
  {
    id: '11',
    file: 'android/app/src/main/java/com/xstreaming/input/ControllerHandler.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'Referencias directas a LightsManager (API 31), VibrationEffect (API 26) y reflexión isExternal innecesaria en API < 28.',
    adaptation:
      'Aísla LightsManager en Api31LightsHelper, usa Object para lightsSession, añade guardas de cancelación en vibrador y omite reflexión Android P en API 24.',
  },
  {
    id: '12',
    file: 'android/app/src/main/java/com/xstreaming/TitleShortcutManagerModule.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'ShortcutManager, ShortcutInfo y Icon.createWithAdaptiveBitmap (API 26) en el verificador de clases de ART.',
    adaptation:
      'Mueve la creación de accesos directos e iconos adaptativos a Api26ShortcutHelper y rechaza limpiamente con UNSUPPORTED_ANDROID_VERSION en API 24.',
  },
  {
    id: '13',
    file: 'android/app/src/main/java/com/xstreaming/touchcontrols/ButtonHaptics.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'Import directo de android.os.VibrationEffect (API 26).',
    adaptation:
      'Encapsula VibrationEffect en Api26HapticsHelper; usa vibrator.vibrate(10) en Nougat.',
  },
  {
    id: '14',
    file: 'android/app/src/main/java/org/libsdl/app/SDLControllerManager.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'Import directo de VibrationEffect (API 26) en puente SDL2.',
    adaptation:
      'Aísla VibrationEffect en Api26HapticHelper con fallback directo a haptic.vibrator.vibrate(length).',
  },
  {
    id: '15',
    file: 'android/app/src/main/java/com/lsfg/android/session/NativeBridge.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'La firma pushFrame(HardwareBuffer, long) exponía HardwareBuffer (API 26) al linker de ART.',
    adaptation:
      'Cambia la firma Java a pushFrame(Object, long), manteniendo la resolución JNI exacta en Java_com_lsfg_android_session_NativeBridge_pushFrame.',
  },
  {
    id: '16',
    file: 'android/app/src/main/java/com/xstreaming/framegen/FrameGenStatsModule.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'Consultar estadísticas disparaba System.loadLibrary("lsfg-android") en API < 29.',
    adaptation:
      'Retorna métricas en cero inmediatamente cuando Build.VERSION.SDK_INT < Build.VERSION_CODES.Q sin cargar NativeBridge.',
  },
  {
    id: '17',
    file: 'android/app/src/main/java/com/xstreaming/framegen/LsfgRuntime.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker: 'Llamaba a NativeBridge.nativeVersion() antes de verificar Android 10+.',
    adaptation:
      'Mueve el corte SDK_INT < Build.VERSION_CODES.Q antes de cualquier llamada JNI o inicialización de log nativo.',
  },
  {
    id: '18',
    file: 'android/app/src/main/java/com/oney/WebRTCModule/RTCFrameGenVideoView.java',
    category: 'java-api24',
    categoryLabel: 'Java API 24',
    blocker:
      'HardwareBuffer (API 26), ImageReader.Builder (API 29), image.getHardwareBuffer() (API 28) y Surface.setFrameRate (API 30) en clase principal.',
    adaptation:
      'Aísla todas las API >= 29/30 en Api29InputReaderHelper y Api30SurfaceHelper, y bloquea la inicialización de FrameGen/NativeBridge en API < 29.',
  },
  {
    id: '19',
    file: 'src/pages/Login.tsx',
    category: 'rn-js',
    categoryLabel: 'React Native / JS',
    blocker:
      'Si el WebView de Chrome en Android 7.0 sufre un corte de red o cierre del proceso renderer, la pantalla quedaba en blanco.',
    adaptation:
      'Añade manejadores onError, onHttpError (>= 500) y onRenderProcessGone con pantalla de reintento inmediato.',
  },
  {
    id: '20',
    file: 'src/pages/Settings.tsx',
    category: 'rn-js',
    categoryLabel: 'React Native / JS',
    blocker:
      'Mostraba ajustes exclusivos de Android 8+ (PiP) y Android 10+ (Lossless FrameGen / DLL) en dispositivos API 24.',
    adaptation:
      'Oculta picture_in_picture en API < 26 y smart_frame_generation / DLL en API < 29 usando Platform.Version.',
  },
  {
    id: '21',
    file: 'src/pages/SettingDetail.tsx',
    category: 'rn-js',
    categoryLabel: 'React Native / JS',
    blocker: 'Permitía navegar o activar FrameGen/PiP si se invocaba directamente.',
    adaptation:
      'Añade bloqueo por nivel de API Android al abrir el detalle y al validar el guardado.',
  },
  {
    id: '22',
    file: 'patches/react-native-paper+5.12.5.patch',
    category: 'ci-patches',
    categoryLabel: 'CI & Parches',
    blocker:
      'Parche original tenía cabecera de hunk corrupta (@@ -270,7 +262,7 @@) y abortaba patch-package antes de parchear webrtc y webview.',
    adaptation:
      'Corrige desplazamiento a @@ -261,7 +261,7 @@ y salto de línea final; los 5 parches de patch-package aplican al 100%.',
  },
  {
    id: '23',
    file: 'yarn.lock & .github/workflows/android-build.yml',
    category: 'ci-patches',
    categoryLabel: 'CI & Parches',
    blocker:
      'yarn.lock original tenía restos huérfanos (@ui-kitten/*, moment) incompatibles con yarn install --immutable, y no existía flujo CI para APK.',
    adaptation:
      'Sincroniza yarn.lock y crea android-build.yml en GitHub Actions (Node 20, Java 17, NDK 23.1.7779620, CMake 3.22.1, Rust armv7/aarch64) con subida automática de APK.',
  },
];

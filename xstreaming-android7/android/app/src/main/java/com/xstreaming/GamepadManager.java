package com.xstreaming;

import android.annotation.TargetApi;
import android.hardware.input.InputManager;
import android.os.Build;
import android.util.Log;
import android.view.InputDevice;
import android.content.Context;
import android.os.Vibrator;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.media.AudioAttributes;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GamepadManager extends ReactContextBaseJavaModule {

    private static final int STOP_PULSE_DURATION_MS = 20;
    private static final int STOP_PULSE_CANCEL_DELAY_MS = 40;

    private boolean hasGameController;

    private final ExecutorService executorService;

    private final Handler vibrationHandler = new Handler(Looper.getMainLooper());

    private static String currentScreen = "";

    private static class CachedVibratorTarget {
        Object vibratorManager = null;
        Vibrator vibrator = null;
        boolean quadVibrators = false;
        int[] vibratorIds = null;
        long lastCheckTime = 0;
    }
    private final CachedVibratorTarget cachedTarget = new CachedVibratorTarget();
    private boolean isCurrentlyVibrating = false;

    private void refreshVibratorCache() {
        cachedTarget.lastCheckTime = SystemClock.uptimeMillis();
        cachedTarget.vibratorManager = null;
        cachedTarget.vibrator = null;
        cachedTarget.quadVibrators = false;
        cachedTarget.vibratorIds = null;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Api31VibratorHelper.populateVibratorCache(cachedTarget);
        }
    }

    private final ReactApplicationContext reactContext;
    public GamepadManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.executorService = Executors.newSingleThreadExecutor();
    }

    @Override
    public void initialize() {}

    @Override
    public String getName() {
        return "GamepadManager";
    }

    private void rumbleSingleVibrator(Vibrator vibrator, int duration, short lowFreqMotor, short highFreqMotor, int intensity) {
        int simulatedAmplitude = Math.min(255, (int)((lowFreqMotor) + (highFreqMotor)));

        if (intensity == 1) { // very weak
            simulatedAmplitude = Math.min(255, (int)((lowFreqMotor * 0.5) + (highFreqMotor * 0.4)));
        }
        if (intensity == 2) { // weak
            simulatedAmplitude = Math.min(255, (int)((lowFreqMotor * 0.9) + (highFreqMotor * 0.8)));
        }
        if (intensity == 4) { // strong
            simulatedAmplitude = Math.min(255, (int)((lowFreqMotor * 1.5) + (highFreqMotor * 2)));
        }
        if (intensity == 5) { // very strong
            simulatedAmplitude = Math.min(255, (int)((lowFreqMotor * 2) + (highFreqMotor * 2.5)));
        }

        if (simulatedAmplitude == 0) {
            try {
                if (vibrator != null) {
                    vibrator.cancel();
                }
            } catch (Exception e) {}
            return;
        }

        // Attempt to use amplitude-based control if we're on Oreo and the device
        // supports amplitude-based vibration control.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (Api26VibratorHelper.vibrateSingle(vibrator, duration, simulatedAmplitude)) {
                return;
            }
        }

        // No amplitude control available (and Android 7.0 Nougat API 24-25 path):
        // use duration-based one-shot vibration.
        int safeDuration = Math.max(1, duration);
        if (vibrator.hasVibrator()) {
            vibrator.vibrate(safeDuration);
        }
    }

    private void vibrateStopPulse(Vibrator vibrator) {
        if (vibrator == null || !vibrator.hasVibrator()) {
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Api26VibratorHelper.vibrateOneShot(vibrator, STOP_PULSE_DURATION_MS);
            } else {
                vibrator.vibrate(STOP_PULSE_DURATION_MS);
            }
        } catch (Exception e) {
            Log.e("GamepadManager", "Error during stop pulse", e);
        }
    }

    private void cancelVibratorDelayed(Vibrator vibrator) {
        if (vibrator == null) {
            return;
        }

        vibrationHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                try {
                    vibrator.cancel();
                } catch (Exception e) {
                    Log.e("GamepadManager", "Error cancelling vibrator after delayed stop pulse", e);
                }
            }
        }, STOP_PULSE_CANCEL_DELAY_MS);
    }

    private void forceStopVibrator(Vibrator vibrator) {
        Log.d("GamepadManager", "forceStopVibrator");

        try {
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            Log.e("GamepadManager", "Error cancelling vibrator", e);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Api31VibratorHelper.cancelSystemVibratorManager(reactContext);
        }

        // Some devices keep a long DEFAULT_AMPLITUDE media vibration alive even
        // after cancel(). Replacing it with a short vibration mirrors the
        // double-tap workaround: the new request overwrites the stuck one, then
        // we cancel after the system has had time to commit it.
        vibrateStopPulse(vibrator);
        cancelVibratorDelayed(vibrator);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Vibrator defaultVibrator = Api31VibratorHelper.getDefaultVibrator(reactContext);
            if (defaultVibrator != null) {
                vibrateStopPulse(defaultVibrator);
                cancelVibratorDelayed(defaultVibrator);
            }
        }
    }

    private static InputDevice.MotionRange getMotionRangeForJoystickAxis(InputDevice dev, int axis) {
        InputDevice.MotionRange range;

        // First get the axis for SOURCE_JOYSTICK
        range = dev.getMotionRange(axis, InputDevice.SOURCE_JOYSTICK);
        if (range == null) {
            // Now try the axis for SOURCE_GAMEPAD
            range = dev.getMotionRange(axis, InputDevice.SOURCE_GAMEPAD);
        }

        return range;
    }

    private static boolean hasJoystickAxes(InputDevice device) {
        if (device == null) return false;
        return (device.getSources() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK &&
                getMotionRangeForJoystickAxis(device, MotionEvent.AXIS_X) != null &&
                getMotionRangeForJoystickAxis(device, MotionEvent.AXIS_Y) != null;
    }

    private static boolean hasGamepadButtons(InputDevice device) {
        if (device == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            boolean[] keys = device.hasKeys(
                KeyEvent.KEYCODE_BUTTON_A,
                KeyEvent.KEYCODE_BUTTON_B,
                KeyEvent.KEYCODE_BUTTON_X,
                KeyEvent.KEYCODE_BUTTON_Y
            );
            return (keys[0] || keys[1]) && (keys[2] || keys[3]);
        }
        return false;
    }

    private static boolean isGameControllerDevice(InputDevice device) {
        if (device == null || device.isVirtual()) {
            return false;
        }
        int sources = device.getSources();
        boolean hasGamepadSource =
            ((sources & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD) ||
            ((sources & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK);

        if (!hasGamepadSource) {
            return false;
        }

        return hasJoystickAxes(device) || hasGamepadButtons(device);
    }

    @ReactMethod
    public void setCurrentScreen(String value) {
        currentScreen = value;
    }

    public static String getCurrentScreen() {
        return currentScreen;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getCurrentScreenSync() {
        return currentScreen;
    }

    @ReactMethod
    public void hasGameController(Promise promise) {
        try {
            int[] ids = InputDevice.getDeviceIds();
            for (int id : ids) {
                InputDevice dev = InputDevice.getDevice(id);
                if (dev != null && isGameControllerDevice(dev)) {
                    promise.resolve(true);
                    return;
                }
            }
        } catch (Exception ignored) {}
        promise.resolve(false);
    }

    private int clampVibration(int value) {
        return Math.max(1, Math.min(255, value));
    }

    @ReactMethod
    public void vibrate(int duration, int lowFreqMotor, int highFreqMotor, int leftTrigger, int rightTrigger, int intensity) {
        short _lowFreqMotor = (short) lowFreqMotor;
        short _highFreqMotor = (short) highFreqMotor;
        short _leftTrigger = (short) leftTrigger;
        short _rightTrigger = (short) rightTrigger;

        boolean isZero = (_lowFreqMotor == 0 && _highFreqMotor == 0 && _leftTrigger == 0 && _rightTrigger == 0);
        if (isZero) {
            if (!isCurrentlyVibrating) {
                return;
            }
            isCurrentlyVibrating = false;

            if (cachedTarget.vibratorManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Api31VibratorHelper.cancelManager(cachedTarget.vibratorManager);
                return;
            }
            if (cachedTarget.vibrator != null) {
                try {
                    cachedTarget.vibrator.cancel();
                } catch (Exception e) {}
                return;
            }
            Vibrator deviceVibrator = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (deviceVibrator != null) {
                try {
                    deviceVibrator.cancel();
                } catch (Exception e) {}
            }
            return;
        }

        isCurrentlyVibrating = true;

        long now = SystemClock.uptimeMillis();
        if (now - cachedTarget.lastCheckTime > 3000) {
            refreshVibratorCache();
        }

        float intensityFactor = 1f;
        switch (intensity) {
            case 1: intensityFactor = 0.2f; break;
            case 2: intensityFactor = 0.5f; break;
            case 4: intensityFactor = 2f; break;
            case 5: intensityFactor = 3f; break;
            default: break;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && cachedTarget.vibratorManager != null) {
            if (Api31VibratorHelper.vibrateCombined(
                    cachedTarget,
                    duration,
                    clampVibration((int)(_highFreqMotor * intensityFactor)),
                    clampVibration((int)(_lowFreqMotor * intensityFactor)),
                    clampVibration((int)(_leftTrigger * intensityFactor)),
                    clampVibration((int)(_rightTrigger * intensityFactor))
            )) {
                return;
            }
        }

        Vibrator targetVibrator = cachedTarget.vibrator;
        if (targetVibrator == null) {
            targetVibrator = (Vibrator) reactContext.getSystemService(Context.VIBRATOR_SERVICE);
        }

        if (targetVibrator != null) {
            rumbleSingleVibrator(targetVibrator, duration > 0 ? duration : 30, _lowFreqMotor, _highFreqMotor, intensity);
        }
    }

    @TargetApi(Build.VERSION_CODES.O)
    private static final class Api26VibratorHelper {
        static boolean vibrateSingle(Vibrator vibrator, int duration, int simulatedAmplitude) {
            int safeDuration = Math.max(1, duration);
            if (vibrator.hasAmplitudeControl()) {
                android.os.VibrationEffect effect =
                        android.os.VibrationEffect.createOneShot(safeDuration, simulatedAmplitude);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    Api33VibratorHelper.vibrateWithMediaAttributes(vibrator, effect);
                } else {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .build();
                    vibrator.vibrate(effect, audioAttributes);
                }
                return true;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(
                        safeDuration,
                        android.os.VibrationEffect.DEFAULT_AMPLITUDE
                ));
            } else {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .build();
                vibrator.vibrate(
                        android.os.VibrationEffect.createOneShot(
                                safeDuration,
                                android.os.VibrationEffect.DEFAULT_AMPLITUDE
                        ),
                        audioAttributes
                );
            }
            return true;
        }

        static void vibrateOneShot(Vibrator vibrator, int durationMs) {
            vibrator.vibrate(android.os.VibrationEffect.createOneShot(
                    durationMs,
                    android.os.VibrationEffect.DEFAULT_AMPLITUDE
            ));
        }
    }

    @TargetApi(Build.VERSION_CODES.S)
    private static final class Api31VibratorHelper {
        static void populateVibratorCache(CachedVibratorTarget target) {
            int[] ids = InputDevice.getDeviceIds();
            for (int id : ids) {
                InputDevice dev = InputDevice.getDevice(id);
                if (dev == null) continue;

                boolean isGamepad = (dev.getSources() & InputDevice.SOURCE_JOYSTICK) != 0 ||
                        (dev.getSources() & InputDevice.SOURCE_GAMEPAD) != 0;
                if (!isGamepad || !isGameControllerDevice(dev)) continue;

                android.os.VibratorManager vm = dev.getVibratorManager();
                if (vm == null) continue;

                int[] vibratorIds = vm.getVibratorIds();
                boolean hasQuad = (vibratorIds.length == 4);
                boolean hasDual = (vibratorIds.length == 2);

                if (hasQuad || hasDual) {
                    boolean allAmplitude = true;
                    for (int vid : vibratorIds) {
                        if (!vm.getVibrator(vid).hasAmplitudeControl()) {
                            allAmplitude = false;
                            break;
                        }
                    }
                    if (allAmplitude) {
                        target.vibratorManager = vm;
                        target.vibratorIds = vibratorIds;
                        target.quadVibrators = hasQuad;
                        return;
                    }
                }

                if (dev.getVibrator() != null && dev.getVibrator().hasVibrator()) {
                    target.vibrator = dev.getVibrator();
                    return;
                }
            }
        }

        static void cancelManager(Object managerObj) {
            if (managerObj instanceof android.os.VibratorManager) {
                try {
                    ((android.os.VibratorManager) managerObj).cancel();
                } catch (Exception ignored) {}
            }
        }

        static void cancelSystemVibratorManager(Context context) {
            try {
                android.os.VibratorManager vibratorManager =
                        (android.os.VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vibratorManager != null) {
                    vibratorManager.cancel();
                    Vibrator defaultVibrator = vibratorManager.getDefaultVibrator();
                    if (defaultVibrator != null) {
                        defaultVibrator.cancel();
                    }
                }
            } catch (Exception e) {
                Log.e("GamepadManager", "Error cancelling vibrator manager", e);
            }
        }

        static Vibrator getDefaultVibrator(Context context) {
            try {
                android.os.VibratorManager vibratorManager =
                        (android.os.VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                return vibratorManager != null ? vibratorManager.getDefaultVibrator() : null;
            } catch (Exception e) {
                return null;
            }
        }

        static boolean vibrateCombined(CachedVibratorTarget target, int duration,
                                       int highAmp, int lowAmp, int leftTrigAmp, int rightTrigAmp) {
            if (!(target.vibratorManager instanceof android.os.VibratorManager)) {
                return false;
            }
            android.os.VibratorManager vm = (android.os.VibratorManager) target.vibratorManager;
            int[] vIds = target.vibratorIds;
            if (vIds == null || vIds.length == 0) {
                return false;
            }
            int[] amplitudes;
            if (target.quadVibrators && vIds.length == 4) {
                amplitudes = new int[] { highAmp, lowAmp, leftTrigAmp, rightTrigAmp };
            } else if (vIds.length >= 2) {
                amplitudes = new int[] { highAmp, lowAmp };
            } else {
                amplitudes = new int[0];
            }

            boolean hasNonZero = false;
            for (int amp : amplitudes) {
                if (amp != 0) { hasNonZero = true; break; }
            }
            if (!hasNonZero) {
                return false;
            }

            android.os.CombinedVibration.ParallelCombination combo =
                    android.os.CombinedVibration.startParallel();
            for (int i = 0; i < amplitudes.length && i < vIds.length; i++) {
                if (amplitudes[i] != 0) {
                    combo.addVibrator(
                            vIds[i],
                            android.os.VibrationEffect.createOneShot(duration > 0 ? duration : 30, amplitudes[i])
                    );
                }
            }
            android.os.VibrationAttributes.Builder vibrationAttributes =
                    new android.os.VibrationAttributes.Builder();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                Api33VibratorHelper.setMediaUsage(vibrationAttributes);
            }
            try {
                vm.vibrate(combo.combine(), vibrationAttributes.build());
            } catch (Exception ignored) {}
            return true;
        }
    }

    @TargetApi(Build.VERSION_CODES.TIRAMISU)
    private static final class Api33VibratorHelper {
        static void vibrateWithMediaAttributes(Vibrator vibrator, android.os.VibrationEffect effect) {
            android.os.VibrationAttributes vibrationAttributes = new android.os.VibrationAttributes.Builder()
                    .setUsage(android.os.VibrationAttributes.USAGE_MEDIA)
                    .build();
            vibrator.vibrate(effect, vibrationAttributes);
        }

        static void setMediaUsage(android.os.VibrationAttributes.Builder builder) {
            builder.setUsage(android.os.VibrationAttributes.USAGE_MEDIA);
        }
    }
}

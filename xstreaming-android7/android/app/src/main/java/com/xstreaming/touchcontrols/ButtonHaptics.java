package com.xstreaming.touchcontrols;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.os.Vibrator;
import androidx.appcompat.app.AppCompatActivity;

public class ButtonHaptics {
    private final boolean enabled;
    private final Context context;

    public ButtonHaptics(Context context) {
        this.context = context;
        this.enabled = false;
    }

    public void trigger() {
        trigger(false);
    }

    public void trigger(boolean harder) {
        if (!enabled) {
            return;
        }

        Vibrator vibrator = (Vibrator) context.getSystemService(AppCompatActivity.VIBRATOR_SERVICE);
        if (vibrator == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Api26HapticsHelper.vibrate(vibrator, harder);
        } else {
            vibrator.vibrate(10);
        }
    }

    @TargetApi(Build.VERSION_CODES.O)
    private static final class Api26HapticsHelper {
        private Api26HapticsHelper() {
        }

        static void vibrate(Vibrator vibrator, boolean harder) {
            android.os.VibrationEffect effect;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int effectType = harder
                        ? android.os.VibrationEffect.EFFECT_CLICK
                        : android.os.VibrationEffect.EFFECT_TICK;
                effect = android.os.VibrationEffect.createPredefined(effectType);
            } else {
                effect = android.os.VibrationEffect.createOneShot(10, harder ? 200 : 100);
            }
            vibrator.vibrate(effect);
        }
    }
}

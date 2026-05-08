package com.izidelivery.entregador;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.graphics.PixelFormat;
import android.widget.Button;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OverlayPermission")
public class OverlayPlugin extends Plugin {

    private View overlayView;
    private WindowManager windowManager;

    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            result.put("granted", Settings.canDrawOverlays(getContext()));
        } else {
            result.put("granted", true);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void showMission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            call.reject("Missing overlay permission");
            return;
        }

        String title = call.getString("title", "Nova Missão");
        String earnings = call.getString("earnings", "R$ 0,00");
        String distance = call.getString("distance", "---");

        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                if (overlayView != null) {
                    hideMissionOverlay();
                }

                windowManager = (WindowManager) getContext().getSystemService(getContext().WINDOW_SERVICE);
                overlayView = LayoutInflater.from(getContext()).inflate(R.layout.mission_overlay, null);

                TextView tvTitle = overlayView.findViewById(R.id.tvTitle);
                TextView tvEarnings = overlayView.findViewById(R.id.tvEarnings);
                TextView tvDistance = overlayView.findViewById(R.id.tvDistance);
                Button btnAccept = overlayView.findViewById(R.id.btnAccept);
                Button btnReject = overlayView.findViewById(R.id.btnReject);
                Button btnDetails = overlayView.findViewById(R.id.btnDetails);

                tvTitle.setText(title);
                tvEarnings.setText(earnings);
                tvDistance.setText(distance);

                btnAccept.setOnClickListener(v -> {
                    hideMissionOverlay();
                    JSObject ret = new JSObject();
                    ret.put("action", "accept");
                    notifyListeners("onMissionAction", ret);
                });

                btnReject.setOnClickListener(v -> {
                    hideMissionOverlay();
                    JSObject ret = new JSObject();
                    ret.put("action", "reject");
                    notifyListeners("onMissionAction", ret);
                });

                btnDetails.setOnClickListener(v -> {
                    hideMissionOverlay();
                    JSObject ret = new JSObject();
                    ret.put("action", "details");
                    notifyListeners("onMissionAction", ret);
                });

                int layoutFlag;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
                } else {
                    layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
                }

                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.WRAP_CONTENT,
                        layoutFlag,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                                | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                        PixelFormat.TRANSLUCENT);

                windowManager.addView(overlayView, params);
                call.resolve();
            } catch (Exception e) {
                call.reject("Error showing overlay", e);
            }
        });
    }

    @PluginMethod
    public void hideMission(PluginCall call) {
        new Handler(Looper.getMainLooper()).post(() -> {
            hideMissionOverlay();
            call.resolve();
        });
    }

    @PluginMethod
    public void bringAppToFront(PluginCall call) {
        Intent intent = new Intent(getContext(), getActivity().getClass());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        getContext().startActivity(intent);
        call.resolve();
    }

    private void hideMissionOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception e) {
                // ignore
            }
            overlayView = null;
        }
    }
}

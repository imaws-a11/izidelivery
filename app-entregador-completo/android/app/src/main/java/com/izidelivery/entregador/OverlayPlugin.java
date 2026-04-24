package com.izidelivery.entregador;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OverlayPermission")
public class OverlayPlugin extends Plugin {

    /**
     * Verifica se a permissão de sobreposição está concedida.
     * Retorna { granted: true/false }
     */
    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            result.put("granted", Settings.canDrawOverlays(getContext()));
        } else {
            // Versões anteriores ao Android 6 sempre têm permissão
            result.put("granted", true);
        }
        call.resolve(result);
    }

    /**
     * Abre a tela de configurações de sobreposição para o app.
     */
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
            call.resolve(); // Sem necessidade em versões antigas
        }
    }
}

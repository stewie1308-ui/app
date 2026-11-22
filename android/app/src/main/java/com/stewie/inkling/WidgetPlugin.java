package com.stewie.inkling;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Receives the widget's fact list from the web app, saves it, and refreshes any widgets on the home screen. */
@CapacitorPlugin(name = "InklingWidget")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("Missing json");
            return;
        }
        Context ctx = getContext();
        ctx.getSharedPreferences(FactWidget.PREFS, Context.MODE_PRIVATE).edit().putString(FactWidget.KEY, json).apply();
        FactWidget.refreshAll(ctx);
        call.resolve();
    }
}

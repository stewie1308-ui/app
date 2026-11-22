package com.stewie.inkling;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: shows one fact you've already learned, a different one each day.
 * The web app saves up to 30 learned facts through WidgetPlugin; the widget picks by date.
 */
public class FactWidget extends AppWidgetProvider {

    static final String PREFS = "inkling_widget";
    static final String KEY = "facts";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) manager.updateAppWidget(id, build(ctx));
    }

    static void refreshAll(Context ctx) {
        AppWidgetManager manager = AppWidgetManager.getInstance(ctx);
        int[] ids = manager.getAppWidgetIds(new ComponentName(ctx, FactWidget.class));
        for (int id : ids) manager.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_fact);

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, tap);

        JSONObject fact = pick(ctx);
        if (fact == null) {
            int faded = ctx.getColor(R.color.widget_faded);
            views.setTextViewText(R.id.widget_topic, "Inkling");
            views.setTextColor(R.id.widget_topic, faded);
            views.setInt(R.id.widget_bar, "setBackgroundColor", faded);
            views.setTextViewText(R.id.widget_title, ctx.getString(R.string.widget_empty_title));
            views.setTextViewText(R.id.widget_body, ctx.getString(R.string.widget_empty_body));
        } else {
            int colour = ctx.getColor(topicColour(fact.optString("topic")));
            views.setTextViewText(R.id.widget_topic, fact.optString("topicName", "Inkling"));
            views.setTextColor(R.id.widget_topic, colour);
            views.setInt(R.id.widget_bar, "setBackgroundColor", colour);
            views.setTextViewText(R.id.widget_title, fact.optString("title"));
            views.setTextViewText(R.id.widget_body, fact.optString("body"));
        }
        return views;
    }

    static JSONObject pick(Context ctx) {
        try {
            String json = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
            if (json == null) return null;
            JSONArray facts = new JSONObject(json).getJSONArray("facts");
            if (facts.length() == 0) return null;
            Calendar now = Calendar.getInstance();
            int day = now.get(Calendar.YEAR) * 366 + now.get(Calendar.DAY_OF_YEAR);
            return facts.getJSONObject(day % facts.length());
        } catch (Exception e) {
            return null;
        }
    }

    static int topicColour(String topic) {
        switch (topic) {
            case "science": return R.color.widget_science;
            case "history": return R.color.widget_history;
            case "how": return R.color.widget_how;
            case "words": return R.color.widget_words;
            default: return R.color.widget_faded;
        }
    }
}

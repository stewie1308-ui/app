package com.stewie.inkling;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Our own small plugin that hands learned facts to the home-screen widget.
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

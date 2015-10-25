package com.rejh.icerrr.itson;

import android.app.Activity;
import android.content.Context;
import android.webkit.JavascriptInterface;

public class JavaScriptInterface {

    private Icerrr app;

    public JavaScriptInterface(Icerrr app) {
        this.app = app;
    }

    @JavascriptInterface
    public void moveTaskToBack(){
        app.moveTaskToBack(true);
    }

    @JavascriptInterface
    public void requestIcerrrPermissions(){
        app.requestIcerrrPermissions();
    }

    @JavascriptInterface
    public boolean hasIcerrrPermissions(){
        return app.hasIcerrrPermissions();
    }
    
}

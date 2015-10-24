package com.rejh.icerrr.itson;

import android.app.Activity;
import android.webkit.JavascriptInterface;

public class JavaScriptInterface {
	
	private Activity activity;

    public JavaScriptInterface(Activity activiy) {
        this.activity = activiy;
    }

    @JavascriptInterface
    public void moveTaskToBack(){
        activity.moveTaskToBack(true);
    }
    
}

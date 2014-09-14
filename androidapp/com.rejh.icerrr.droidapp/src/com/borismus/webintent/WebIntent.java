package com.borismus.webintent;

import java.util.HashMap;
import java.util.Map;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.net.Uri;
import android.text.Html;
import android.util.Log;

//import org.apache.cordova.api.Plugin;
//import org.apache.cordova.api.PluginResult;

/**
 * WebIntent is a PhoneGap plugin that bridges Android intents and web
 * applications:
 * 
 * 1. web apps can spawn intents that call native Android applications. 2.
 * (after setting up correct intent filters for PhoneGap applications), Android
 * intents can be handled by PhoneGap web applications.
 * 
 * @author boris@borismus.com
 * 
 */
public class WebIntent extends CordovaPlugin {

    private String onNewIntentCallback = null;
    
    private String LOGTAG = "WebIntent";

    /**
     * Executes the request and returns PluginResult.
     * 
     * @param action
     *            The action to execute.
     * @param args
     *            JSONArray of arguments for the plugin.
     * @param callbackId
     *            The callback id used when calling back into JavaScript.
     * @return A PluginResult object with a status and message.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try {
        	
        	Log.d(LOGTAG,"WebIntent.execute: "+action);
        	
            if (action.equals("startActivity")) {
                if (args.length() != 1) {
                    callbackContext.error("Invalid action");
                    return false;
                }

                // Parse the arguments
                JSONObject obj = args.getJSONObject(0);
                String type = obj.has("type") ? obj.getString("type") : null;
                Uri uri = obj.has("url") ? Uri.parse(obj.getString("url")) : null;
                JSONObject extras = obj.has("extras") ? obj.getJSONObject("extras") : null;
                Map<String, String> extrasMap = new HashMap<String, String>();

                // Populate the extras if any exist
                if (extras != null) {
                    JSONArray extraNames = extras.names();
                    for (int i = 0; i < extraNames.length(); i++) {
                        String key = extraNames.getString(i);
                        String value = extras.getString(key);
                        extrasMap.put(key, value);
                    }
                }

                startActivity(obj.getString("action"), uri, type, extrasMap);
                callbackContext.success("OK");
                return true;

            } else if (action.equals("hasExtra")) {
                if (args.length() != 1) {
                	callbackContext.error("Invalid action");
                    return false;
                }
                Intent i = (this.cordova.getActivity()).getIntent();
                String extraName = args.getString(0);
                // return new PluginResult(PluginResult.Status.OK, i.hasExtra(extraName));
                String res = "undefined";
                if (i.hasExtra(extraName)) { res = "true"; } else { res = "false"; }
                callbackContext.success(res);
                return true;

            } else if (action.equals("getExtra")) {
                if (args.length() != 1) {
                	Log.w(LOGTAG," > getExtra() args.lengtj != 1");
                	callbackContext.error("Invalid action");
                    return false;
                }
                Intent i = (this.cordova.getActivity()).getIntent();
                String extraName = args.getString(0);
                Log.d(LOGTAG," > getExtra: "+extraName);
                if (i.hasExtra(extraName)) {
                    //return new PluginResult(PluginResult.Status.OK, i.getStringExtra(extraName));
                	// Handle URI
                	if (extraName.equals(Intent.EXTRA_STREAM)) {
                		//Log.d(LOGTAG," > getExtra: "+extraName+": "+i.getExtras().get(extraName).getEncodedPath());
                		Uri uri = (Uri) i.getExtras().get(extraName);
                		callbackContext.success(uri.getEncodedPath());
                	} else {
                		callbackContext.success(i.getStringExtra(extraName));
                	}
                	return true;
                } else {
                	callbackContext.error("Error");
                    return false;
                }
            } else if (action.equals("getUri")) {
                if (args.length() != 0) {
                	callbackContext.error("Invalid action");
                    return false;
                }

                Intent i = (this.cordova.getActivity()).getIntent();
                String uri = i.getDataString();
                //return new PluginResult(PluginResult.Status.OK, uri);
                callbackContext.success(uri);
                return true;
            } else if (action.equals("onNewIntent")) {
                if (args.length() != 0) {
                	callbackContext.error("Invalid action");
                    return false;
                }

                /*
                this.onNewIntentCallback = ""; // callbackContext;
                PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
                result.setKeepCallback(true);
                callbackContext.success(result);
                return true;
                /**/
                // FIXME: I hope this doesnt break stuff?
                return false;
            } else if (action.equals("sendBroadcast")) 
            {
                if (args.length() != 1) {
                	callbackContext.error("Invalid action");
                    return false;
                }

                // Parse the arguments
                JSONObject obj = args.getJSONObject(0);

                JSONObject extras = obj.has("extras") ? obj.getJSONObject("extras") : null;
                Map<String, String> extrasMap = new HashMap<String, String>();

                // Populate the extras if any exist
                if (extras != null) {
                    JSONArray extraNames = extras.names();
                    for (int i = 0; i < extraNames.length(); i++) {
                        String key = extraNames.getString(i);
                        String value = extras.getString(key);
                        extrasMap.put(key, value);
                    }
                }

                sendBroadcast(obj.getString("action"), extrasMap);
                callbackContext.success("OK");
                return true;
            }
            callbackContext.error("Invalid action");
            return false;
        } catch (JSONException e) {
            e.printStackTrace();
            callbackContext.error("JSON exception");
            return false;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    	Log.w(LOGTAG,"WebIntent.onNewIntent");
        if (this.onNewIntentCallback != null) {
            //PluginResult result = new PluginResult(PluginResult.Status.OK, intent.getDataString());
            //result.setKeepCallback(true);
            //this.success(result, this.onNewIntentCallback);
        	// FIXME breaks stuff or no?
        }
    }

    void startActivity(String action, Uri uri, String type, Map<String, String> extras) {
        Intent i = (uri != null ? new Intent(action, uri) : new Intent(action));
        
        if (type != null && uri != null) {
            i.setDataAndType(uri, type); //Fix the crash problem with android 2.3.6
        } else {
            if (type != null) {
                i.setType(type);
            }
        }
        
        for (String key : extras.keySet()) {
            String value = extras.get(key);
            // If type is text html, the extra text must sent as HTML
            if (key.equals(Intent.EXTRA_TEXT) && type.equals("text/html")) {
                i.putExtra(key, Html.fromHtml(value));
            } else if (key.equals(Intent.EXTRA_STREAM)) {
                // allowes sharing of images as attachments.
                // value in this case should be a URI of a file
                i.putExtra(key, Uri.parse(value));
            } else if (key.equals(Intent.EXTRA_EMAIL)) {
                // allows to add the email address of the receiver
                i.putExtra(Intent.EXTRA_EMAIL, new String[] { value });
            } else {
                i.putExtra(key, value);
            }
        }
        (this.cordova.getActivity()).startActivity(i);
    }

    void sendBroadcast(String action, Map<String, String> extras) {
        Intent intent = new Intent();
        intent.setAction(action);
        for (String key : extras.keySet()) {
            String value = extras.get(key);
            intent.putExtra(key, value);
        }

        (this.cordova.getActivity()).sendBroadcast(intent);
    }
}
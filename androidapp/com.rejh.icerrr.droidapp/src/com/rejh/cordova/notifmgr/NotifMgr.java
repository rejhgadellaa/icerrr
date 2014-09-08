package com.rejh.cordova.notifmgr;

/**
* A phonegap plugin that playes icecast/shoutcast streams
*
* @author REJH Gadellaa
* @lincese MIT.
* 
*/

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.R;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

public class NotifMgr extends CordovaPlugin {
	
	// --- Variables
	
	final static String APPTAG = "NotifMgr";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	// --- Execute
	
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG, APPTAG+" > execute");
        
        // > Setup
        
        // Context
        context = this.cordova.getActivity();
        
        // Preferences
        sett = context.getSharedPreferences(APPTAG,2);
        settEditor = sett.edit();

        // > Check action
        
        if (action==null) {
        	callbackContext.error("Action is null");
            return false;
        }
        
        // > A GOGO
        
        try {
            
            // Make
            if (action.equals("make")) {
                make(args,callbackContext);
            }
            
            // Cancel
            else if (action.equals("cancel")) {
                cancel(args,callbackContext);
            }
            
            // Cancel all
            else if (action.equals("cancelAll")) {
                cancelAll(args,callbackContext);
            }
            
            // Whut??
            else {
                callbackContext.error("Action contains invalid value: "+ action);
                return false;
            }
            
        	
        } catch (JSONException e) {
        	e.printStackTrace();
        	return false;
        } catch (Exception e) {
	    	Log.e(APPTAG, "Exception!");
	        e.printStackTrace();
	        return false;
	    } catch (Error e) {
	    	Log.e(APPTAG, "Error!");
	        e.printStackTrace();
	        return false;
	    }
		
		return false;
        
    }
    
    // --- Methods
    
    // Make
    public void make(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > Make");
        
        // Check arguments
        JSONObject obj = args.getJSONObject(0);
        if (obj==null) { 
        	callbackContext.error("argobj is null");
        	return; 
        }
        
        // Get args
        // Example: Uri uri = obj.has("url") ? Uri.parse(obj.getString("url")) : null;
        try {
        	
        	// Required
        	int id = obj.has("id") ? obj.getInt("id") : -1;
        	String title = obj.has("title") ? obj.getString("title") : null;
        	String message = obj.has("message") ? obj.getString("message") : null;
        	String smallicon = obj.has("smallicon") ? obj.getString("smallicon") : null;
        	String largeicon = obj.has("largeicon") ? obj.getString("largeicon") : null;
        	String intentClassName = obj.has("intentClassName") ? obj.getString("intentClassName") : null; // TODO: should be able to use 'com.rejh.icerr.doirdapp.MAIN_ACTIVITY'
        	
        	// Optional
        	boolean autoCancel = obj.has("autoCancel") ? obj.getBoolean("autoCancel") : true;
        	boolean ongoing = obj.has("ongoing") ? obj.getBoolean("ongoing") : false;
        	String ticker = obj.has("ticker") ? obj.getString("ticker") : title;
        	
        	// Actions
        	JSONArray actions = obj.has("actions") ? obj.getJSONArray("actions") : null;
        	for (int i=0; i<actions.length(); i++) {
        		// TODO: Handle actions
        	}
        	
	        // Check required args
	        if (id==-1 || message==null || title==null || smallicon==null && largeicon==null || intentClassName==null) {
	        	Log.e(APPTAG," -> Missing argsobj param: id, msg, title?");
	        	callbackContext.error("Missing argsobj param: id, msg, title?");
	        	return;
	        }
        
	        // Start building...
	        NotificationCompat.Builder builder = new NotificationCompat.Builder(context);
	        
	        // Title, message
	        builder.setContentTitle(title);
	        builder.setContentText(message);
	        
	        // Intent // TODO: a lot.
	        Intent notifIntent = new Intent();
	        notifIntent.setClassName(context, intentClassName);
	        PendingIntent notifPendingIntent = PendingIntent.getActivity(context, 0, notifIntent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
	        builder.setContentIntent(notifPendingIntent);
	        
	        // Icon // TODO: parse string to resInt
	        if (smallicon!=null) { builder.setSmallIcon(R.drawable.ic_media_play); }
	        // if (largeicon!=null) { builder.setLargeIcon(R.drawable.ic_media_play); } // TODO: create bitmap
	        
	        // Kablooie
	        NotificationManager notifMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
	        notifMgr.notify(id, builder.build());
	        
	        
		
		} catch (Exception e) {
		Log.e(APPTAG," -> Error parsing argsobj");
		callbackContext.error("Error parsing argsobj");
		return;
		}
        
    }
    
    // Cancel
    public void cancel(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > Cancel");
        
    }
    
    // CancelAll
    public void cancelAll(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > CancelAll");
        
    }
    
    // ...
    
    
    
}
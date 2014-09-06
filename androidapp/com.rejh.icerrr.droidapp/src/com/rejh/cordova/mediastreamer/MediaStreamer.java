package com.rejh.cordova.mediastreamer;

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

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class MediaStreamer extends CordovaPlugin {
	
	// --- Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent serviceIntent;
	
	// --- Execute
	
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG, APPTAG+" > execute");
        
        // > Setup
        
        // Context
        context = this.cordova.getActivity();
        
        // Service
        serviceIntent = new Intent(context, MediaStreamerService.class);
        
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
            		
            // Call the function
        	if (action.equals("play")) {
        		// Play
        		this.play(args, callbackContext);
        	} else if (action.equals("stop")) {
        		// Stop
        		this.stop(callbackContext);
        	} else if (action.equals("setVolume")) {
        		// setVolume
        		// this.setVolume(args,callbackContext);
        		callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	} else if (action.equals("getStatus")) {
        		// getStatus
        		this.getStatus(callbackContext);
        	} else if (action.equals("isServiceRunning")) {
        		// isServiceRunning
        		if (sett.getBoolean("mediastreamer_serviceRunning", false)) {
        			callbackContext.success(1);
        		} else {
        			callbackContext.success(0);
        		}
        	} else {
        		// Nothin?
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
		
		return true;
		
	}
    
    // --- Play
    
    private void play(JSONArray args, CallbackContext callbackContext) throws JSONException {
    	
    	Log.d(APPTAG, APPTAG+" > play");
        
        // Check arguments
        
        String stream_url = args.getString(0);
        
        if (stream_url==null) { 
        	callbackContext.error("stream_url is null");
        	return; 
        }
        
        // Is playing?
        if (sett.getBoolean("mediastreamer_serviceRunning", false)) {
        	Log.d(APPTAG, APPTAG+" > play > mediastreamer_serviceRunning==true, stopService()");
        	context.stopService(serviceIntent);
        }
        
        // Start
        settEditor.putString("mediastreamer_streamUrl", stream_url);
        settEditor.commit();
        context.startService(serviceIntent);
    	
    	callbackContext.success("OK");
    	
    }
    
    // --- Stop
    
    private void stop(CallbackContext callbackContext) throws JSONException {
    	
    	Log.d(APPTAG, APPTAG+" > stop");
    	
    	context.stopService(serviceIntent);
    	
    	callbackContext.success("OK");
    	
    }
    
    // --- GetState
    // Returns state of Service.MediaPlayer
    
    private void getStatus(CallbackContext callbackContext) {
    	
    	Log.d(APPTAG, APPTAG+" > getStatus");
    	
    	String state = ""+ sett.getInt("mediastreamer_state", 0);
    	
    	callbackContext.success(state); // TODO: todos
    	
    }
    
    /*
	
	// --- Methods
    
    private void share(String image_uri, CallbackContext callbackContext) throws JSONException {
        
    	Log.d(APPTAG, APPTAG+" > share");
    	
    	Intent shareIntent = new Intent();
    	shareIntent.setAction(Intent.ACTION_SEND);
    	shareIntent.putExtra(Intent.EXTRA_TEXT, image_uri);
    	shareIntent.setType("text/plain");
    	cordova.getActivity().startActivity(Intent.createChooser(shareIntent, "Share with..."));
        
    	callbackContext.success("OK");
    	
    }
    
    /**/

}




































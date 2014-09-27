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

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
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
        
        Log.d(APPTAG," > "+ action);
        
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
        		this.setVolume(args,callbackContext);
        		callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	} else if (action.equals("incrVolume")) {
        		// incrVolume
        		this.incrVolume(callbackContext);
        		callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	} else if (action.equals("decrVolume")) {
        		// decrVolume
        		this.decrVolume(callbackContext);
        		callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	} else if (action.equals("getStatus")) {
        		// getStatus
        		this.getStatus(callbackContext);
        	} else if (action.equals("isServiceRunning")) {
        		isServiceRunning(callbackContext);
        	} else {
        		// Nothin?
        		callbackContext.error("MediaStreamer: Action contains invalid value: "+ action);
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
        
        boolean isAlarm = false;
        try {
        	isAlarm = args.getBoolean(1);
        } catch(Exception e) {}
        
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
        serviceIntent.putExtra("stream_url", stream_url);
        serviceIntent.putExtra("isAlarm", isAlarm);
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
        
        // Check service first
        boolean serviceRunning = false;
        Class<?> serviceClass = MediaStreamerService.class;
	    ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            serviceRunning = true;
	        }
	    }
        
        String state = null;
        if (!serviceRunning) { state = "0"; }
    	else { state = ""+ sett.getInt("mediastreamer_state", 0); }
    	
    	callbackContext.success(state); // TODO: todos
    	
    }
    
    // --- SetVolume
	private void setVolume(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		// SCALE :: 0 - 10
		
		boolean allowdown = true;
        
        // Check arguments
        
        int setvol = args.getInt(0);
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		
		float maxvol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
		float curvol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
		float targvol = Math.round((setvol*maxvol)/10);
		int difvol = Math.round(targvol-curvol);
		
		if (allowdown) {
			if (curvol>targvol) { Log.d(APPTAG,"ChangedVolume: --"); for (int ivol=0; ivol>difvol; ivol--) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, 1); } }
			if (curvol<targvol) { Log.d(APPTAG,"ChangedVolume: ++"); for (int ivol=0; ivol<difvol; ivol++) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 1); } }
			}
		else {
			Log.d(APPTAG,"ChangedVolume: ++ (upOnly)");
			for (int ivol=0; ivol<difvol; ivol++) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 1); }
			}
		
		Log.d(APPTAG,"ChangedVolume: set:"+setvol+" --> max:"+maxvol+", cur:"+curvol+", dif:"+difvol);
		
		callbackContext.success("OK");
		
	}
	
	private void incrVolume(CallbackContext callbackContext) {
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 1);
		
		callbackContext.success("OK");
		
	}
	
	private void decrVolume(CallbackContext callbackContext) {
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, 1);
		
		callbackContext.success("OK");
		
	}
	
	// --- isServiceRunning
	private void isServiceRunning(CallbackContext callbackContext) {
		Class<?> serviceClass = MediaStreamerService.class;
	    ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            callbackContext.success(1);
	        }
	    }
	    callbackContext.success(0);
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




































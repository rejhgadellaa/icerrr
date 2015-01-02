package com.rejh.cordova.mediastreamer;

/**
* A phonegap plugin that playes icecast/shoutcast streams
*
* @author REJH Gadellaa
* @lincese MIT.
* 
*/

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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
        
        Log.d(APPTAG, APPTAG+" > execute: "+action);
        
        // > Setup
        
        // Context
        context = this.cordova.getActivity();
        
        // Service
        serviceIntent = new Intent(context, MediaStreamerService.class);
        
        // Preferences
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
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
        	
        	} else if (action.equals("setting")) {
        		
        		setting(args, callbackContext);
        	
        	} else if (action.equals("getSetting")) {
        		getSetting(args, callbackContext);

            	
        	} else if (action.equals("getlog")) {
        		
        		StringBuilder log=new StringBuilder();
        		try {
                    Process process = Runtime.getRuntime().exec("logcat -d ^(?!chromium)");
                    BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));

                    String line;
                    while ((line = bufferedReader.readLine()) != null) {
                    	log.append(line+"\n");
                    }
                } catch (IOException e) {
                	callbackContext.error("MediaStreamer: getlog.IOException: "+e.toString());
                }
        		callbackContext.success(log.toString());
        	}
        	else {
        		// Nothin?
        		callbackContext.error("MediaStreamer: Action contains invalid value: "+ action);
                return false;
        	}
        	
        } catch (JSONException e) {
	    	Log.e(APPTAG, "JSONException!",e);
        	e.printStackTrace();
        	return false;
        } catch (Exception e) {
	    	Log.e(APPTAG, "Exception!",e);
	        e.printStackTrace();
	        return false;
	    } catch (Error e) {
	    	Log.e(APPTAG, "Error!",e);
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
        
        boolean isAlarm = false;
        try {
        	isAlarm = args.getBoolean(1);
        } catch(Exception e) {
        	Log.e(APPTAG," > Exception on args.getBoolean(1) - isAlarm!!");
        }
        
        int volume = -1;
        try {
        	volume = args.getInt(2);
        } catch(Exception e) {
        	Log.e(APPTAG," > Exception on args.getBoolean(2) - volume!!");
        }
        
        // More args
        
        String station_id = args.getString(3);
        String station_name = args.getString(4);
        String station_host = args.getString(5);
        String station_port = args.getString(6);
        String station_path = args.getString(7);
        
        Log.d(APPTAG," > "+ station_host +", "+ station_port +", "+ station_path);
        
        // Start
        settEditor.putString("mediastreamer_streamUrl", stream_url);
        settEditor.commit();
        serviceIntent.putExtra("stream_url", stream_url);
        serviceIntent.putExtra("isAlarm", isAlarm);
        serviceIntent.putExtra("volume", volume);
        serviceIntent.putExtra("station_id",station_id);
        serviceIntent.putExtra("station_name",station_name);
        serviceIntent.putExtra("station_host",station_host);
        serviceIntent.putExtra("station_port",station_port);
        serviceIntent.putExtra("station_path",station_path);
        context.startService(serviceIntent);
        
        Log.d(APPTAG," > isAlarm: "+ isAlarm);
    	
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
    	
    	// Log.d(APPTAG, APPTAG+" > getStatus");
        
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
    
	private void setting(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		JSONObject argsobj = args.getJSONObject(0);
		
		String type = argsobj.getString("type");
		String key = argsobj.getString("key");

		
		int swtype = -1;
		if (type.equals("boolean") || type.equals("bool")) { swtype = 1; }
		if (type.equals("int")) { swtype = 2; }
		if (type.equals("float") || type.equals("double")) { swtype = 3; }
		if (type.equals("string")) { swtype = 4; }
		
		switch(swtype) {
			
		case 1:
			boolean valueBool = argsobj.getBoolean("value");
			settEditor.putBoolean(key,valueBool);
			Log.d(APPTAG," > "+ key +", "+ valueBool);
			break;
			
		case 2:
			int valueInt = argsobj.getInt("value");
			settEditor.putInt(key, valueInt);
			Log.d(APPTAG," > "+ key +", "+ valueInt);
			break;
			
		case 3:
			double valueFloat = argsobj.getDouble("value");
			settEditor.putFloat(key, (float)valueFloat);
			Log.d(APPTAG," > "+ key +", "+ valueFloat);
			break;
			
		case 4:
			String valueString = argsobj.getString("value");
			settEditor.putString(key, valueString);
			Log.d(APPTAG," > "+ key +", "+ valueString);
			break;
			
		default:
			Log.w(APPTAG," > Cannot handle type '"+ type +"'");
			callbackContext.error("Cannot handle type '"+ type +"'");
			return;
			
		}
	
		settEditor.commit();
		callbackContext.success(1);
		
	}
	
	private void getSetting(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		JSONObject argsobj = args.getJSONObject(0);
		String type = argsobj.getString("type");
		String key = argsobj.getString("key");
		
		Log.d(APPTAG," > "+ type +", "+ key);
		
		int swtype = -1;
		if (type.equals("boolean") || type.equals("bool")) { swtype = 1; }
		if (type.equals("int")) { swtype = 2; }
		if (type.equals("string")) { swtype = 4; }
		
		switch(swtype) {
		
		case 1:
			boolean bool = sett.getBoolean(key, false);
			if (bool) { callbackContext.success(1); }
			else { callbackContext.success(0); }
			break;
			
		case 2:
			int integer = sett.getInt(key, -1);
			callbackContext.success(integer);
			break;
			
		case 4:
			String str = sett.getString(key, null);
			callbackContext.success(str);
			break;
			
		default:
			Log.w(APPTAG," > Cannot handle type '"+ type +"'");
			callbackContext.error("Cannot handle type '"+ type +"'");
			return;
		
		}
		
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




































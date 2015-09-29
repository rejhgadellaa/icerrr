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
import java.util.List;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.AudioManager;
import android.net.Uri;
import android.provider.SyncStateContract.Constants;
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
        
		if (action!=null) {
			if (!action.equals("getStatus")) {
				Log.d(APPTAG, APPTAG+" > execute: "+action);
			}
		}
        
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
        		//callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	
        	} else if (action.equals("decrVolume")) {
        		
        		// decrVolume
        		this.decrVolume(callbackContext);
        		//callbackContext.error("MediaStreamer.setVolume() - Not implemented yet");
        	
        	} else if (action.equals("getStatus")) {
        		
        		// getStatus
        		this.getStatus(callbackContext);
        	
        	} else if (action.equals("isServiceRunning")) {
        		
        		isServiceRunning(callbackContext);
        		
        	} else if (action.equals("storeStarredStations")) {
        		
        		storeStarredStations(args, callbackContext);
        	
        	} else if (action.equals("setting")) {
        		
        		setting(args, callbackContext);
        	
        	} else if (action.equals("getSetting")) {
        		
        		getSetting(args, callbackContext);
            	
        	} else if (action.equals("getlog")) {
        		
        		StringBuilder log=new StringBuilder();
        		try {
                    Process process = Runtime.getRuntime().exec("logcat -v time -d ^(?!chromium)");
                    BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));

                    String line;
                    while ((line = bufferedReader.readLine()) != null) {
                    	log.append(line+"\n");
                    }
                } catch (IOException e) {
                	callbackContext.error("MediaStreamer: getlog.IOException: "+e.toString());
                }
        		callbackContext.success(log.toString());
        		
        	} else if (action.equals("install-update-app")) {
        		
        		Log.d(APPTAG," > "+ args.getString(0));
        		
        		// New intent
        		Intent installIntent = new Intent();
        		installIntent.setAction(Intent.ACTION_VIEW);
        		installIntent.setDataAndType(Uri.parse(args.getString(0)),"application/vnd.android.package-archive");
        		
        		cordova.getActivity().startActivity(installIntent);
        		
        		callbackContext.success("OK");
        		
        	} else if (action.equals("updateMetaData")) {
        		
        		serviceIntent.putExtra("update_metadata",true);
        		context.startService(serviceIntent);
        		
        	} else if (action.equals("setAppIcon")) {
        		
        		int arg = args.getInt(0);
        		setAppIcon(arg);
        		
        	} else {
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
        	Log.e(APPTAG," > Exception on args.getBoolean(1) - isAlarm!!",e);
        }
        
        if (!isAlarm) {
        	try {
        		String isAlarmStr = args.getString(1);
        		Log.e(APPTAG," > isAlarm: "+ isAlarmStr);
        	} catch(Exception e) {
            	Log.e(APPTAG," > Exception on args.getString(1) - isAlarm!!",e);
            }
        }
        
        int volume = -1;
        try {
        	volume = args.getInt(2);
        } catch(Exception e) {
        	Log.e(APPTAG," > Exception on args.getInt(2) - volume!!");
        }
        
        // More args
        
        String station_id = args.getString(3);
        String station_name = args.getString(4);
        String station_host = args.getString(5);
        String station_port = args.getString(6);
        String station_path = args.getString(7);
        
        Log.d(APPTAG," > "+ station_host +", "+ station_port +", "+ station_path);
        
        // Start
        // Prep some stuff..
        settEditor.putString("mediastreamer_streamUrl", stream_url);
        settEditor.commit();
        
        // Set up intent
        serviceIntent.putExtra("stream_url", stream_url);
        serviceIntent.putExtra("isAlarm", isAlarm);
        serviceIntent.putExtra("volume", volume);
        serviceIntent.putExtra("station_id",station_id);
        serviceIntent.putExtra("station_name",station_name);
        serviceIntent.putExtra("station_host",station_host);
        serviceIntent.putExtra("station_port",station_port);
        serviceIntent.putExtra("station_path",station_path);
        
        // Resume?
        if (sett.getBoolean("is_paused", false)) {
        	serviceIntent.putExtra("pause_resume",true);
        }
        
        // Start service..
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
        boolean serviceRunning = isServiceRunning();
        
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
		
		// MediaStreamer: Active
		if (isServiceRunning()) {
			Log.d(APPTAG," -> AdjustStreamVolume");
			boolean isAlarm = sett.getBoolean("isAlarm", false);
			int mediaType = (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) ? AudioManager.STREAM_ALARM : AudioManager.STREAM_MUSIC;
			audioManager.adjustStreamVolume(mediaType, AudioManager.ADJUST_RAISE, 1);
		} 
		// MediaStreamer: Inactive
		else {
			Log.d(APPTAG," -> AdjustVolume");
			audioManager.adjustVolume(AudioManager.ADJUST_RAISE,1);
		}
		
		callbackContext.success("OK");
		
	}
	
	private void decrVolume(CallbackContext callbackContext) {
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		
		// MediaStreamer: Active
		if (isServiceRunning()) {
			Log.d(APPTAG," -> AdjustStreamVolume");
			boolean isAlarm = sett.getBoolean("isAlarm", false);
			int mediaType = (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) ? AudioManager.STREAM_ALARM : AudioManager.STREAM_MUSIC;
			audioManager.adjustStreamVolume(mediaType, AudioManager.ADJUST_LOWER, 1);
		} 
		// MediaStreamer: Inactive
		else {
			Log.d(APPTAG," -> AdjustVolume");
			audioManager.adjustVolume(AudioManager.ADJUST_LOWER,1);
		}
		
		callbackContext.success("OK");
		
	}
	
	// --- isServiceRunning
	private void isServiceRunning(CallbackContext callbackContext) {
		if (isServiceRunning()) { callbackContext.success(1); }
		else { callbackContext.success(0); }
	}
	private boolean isServiceRunning() {
		Class<?> serviceClass = MediaStreamerService.class;
	    ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            return true;
	        }
	    }
	    return false;
	}
	
	private void storeStarredStations(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		JSONArray starredStations = args.getJSONArray(0);
		String starredStationsString = starredStations.toString();
		int starredStationsIndex = args.getInt(1);
		
		Log.d(APPTAG," > Current station index: "+ starredStationsIndex +", nr of stations: "+ starredStations.length());
		Log.d(APPTAG," > "+ starredStationsString);
		
		settEditor.putString("starredStations", starredStationsString);
		settEditor.putInt("starredStationsIndex",starredStationsIndex); // reset some values..
		settEditor.commit();
		callbackContext.success("OK");
		
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
	
	private void broadcast(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		JSONObject argsobj = args.getJSONObject(0);
		
		// TODO..
		
	}
	
	private void setAppIcon(int icon) {
	    Context ctx = context;
	    PackageManager pm = (PackageManager) context.getPackageManager();
	    ActivityManager am = (ActivityManager) context.getSystemService(Activity.ACTIVITY_SERVICE);
	    
	    // Enable/disable activity-aliases
	    
	    pm.setComponentEnabledSetting(
	            new ComponentName(ctx, "com.rejh.icerrr.itson.Icerrr-Default"), 
	            icon == 0 ? // 0 = default
	                        PackageManager.COMPONENT_ENABLED_STATE_ENABLED : 
	                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED, 
	            PackageManager.DONT_KILL_APP
	    );
	 
	    pm.setComponentEnabledSetting(
	            new ComponentName(ctx, "com.rejh.icerrr.itson.Icerrr-Flat"), 
	            icon == 1 ? // 1 = flat
	                        PackageManager.COMPONENT_ENABLED_STATE_ENABLED : 
	                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED, 
	            PackageManager.DONT_KILL_APP
	    );
	 
	    // Find launcher and kill it
	    
	    Intent i = new Intent(Intent.ACTION_MAIN);
	    i.addCategory(Intent.CATEGORY_HOME);
	    i.addCategory(Intent.CATEGORY_DEFAULT);
	    List<ResolveInfo> resolves = pm.queryIntentActivities(i, 0);
	    for (ResolveInfo res : resolves) {
	        if (res.activityInfo != null) {
	            am.killBackgroundProcesses(res.activityInfo.packageName);
	        }
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




































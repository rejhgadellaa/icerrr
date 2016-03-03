package com.rejh.cordova.mediastreamer;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class MediaStreamerExtIntentReceiver extends BroadcastReceiver {
	
	// --------------------------------------------------
	// Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent intent;
	private Intent serviceIntent;

	
	// --------------------------------------------------
	// Receive

	@Override
	public void onReceive(Context _context, Intent _intent) {
		
		Log.i(APPTAG,"MediaStreamerExtIntentReceiver.onReceive()");
		
		// Context & intent
		context = _context;
		intent = _intent;

        // Preferences
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
        
        // Get action
        String action = intent.getAction();
        if (action==null) {
        	Log.e(APPTAG," > Intent action == null");
        	return;
        }
        Log.d(APPTAG," > Intent action: "+ action);
		
		// --> Handle actions

		// EXT_INTENT_RECEIVER

		// Start radio
		if (intent.hasExtra("start_radio")) {
			startRadio(false);
		}
		// Start alarm
		if (intent.hasExtra("start_alarm")) {
			startRadio(true);
		}
		// Pause radio
		if (intent.hasExtra("pause_radio")) {
			pauseRadio();
		}
		// Stop radio
		if (intent.hasExtra("stop_radio")) {
			stopRadio();
		}

		// Headphone unplugged
		if (action.equals(android.media.AudioManager.ACTION_AUDIO_BECOMING_NOISY)) {

			if (isServiceRunning(MediaStreamerService.class)) {
				Intent recvIntent = new Intent(context, MediaStreamerReceiver.class);
				recvIntent.putExtra("cmd", "pause");
				context.sendBroadcast(recvIntent);
			}

		}
        
        // Others (Sleep As Android..?)
		if (sett.getBoolean("useSAA", false)) {

			Log.d(APPTAG, " > UseSAA: true");

			// SAA: start alarm
			if (action.equals("com.urbandroid.sleep.alarmclock.ALARM_ALERT_START")) {
				startRadio(true);
			}

			// SAA: stop alarm
			if (action.equals("com.urbandroid.sleep.alarmclock.ALARM_ALERT_DISMISS")) {
				stopRadio();
			}

			// SAA: snooze
			if (action.equals("com.urbandroid.sleep.alarmclock.ALARM_SNOOZE_CLICKED_ACTION")) {
				stopRadio();
			}
		}

	}
	
	// --------------------------------------------------
	// SAA Handlers
	
	public void startRadio(boolean isAlarm) {
		
		Log.d(APPTAG," > StartAlarm()");
		
		try {
		
			// Get default_station
			String default_station_jsons = sett.getString("default_station", null);
			if (default_station_jsons==null) {
				Log.e(APPTAG," > default_station_jsons == null");
				return;
			}
			
			// Parse
			JSONObject station = new JSONObject(default_station_jsons);
			String station_id = station.getString("station_id");
			String station_name = station.getString("station_name");
			String station_host = station.getString("station_host");
			String station_port = station.getString("station_port");
			String station_path = station.getString("station_path");
			String station_url = station.getString("station_url");
			
			// Create intent
			Intent si = new Intent(context, MediaStreamerService.class);
			si.putExtra("station_id", station_id);
			si.putExtra("station_name", station_name);
			si.putExtra("station_host", station_host);
			si.putExtra("station_port", station_port);
			si.putExtra("station_path", station_path);
			si.putExtra("isAlarm", isAlarm);
			si.putExtra("stream_url",station_url);
			
			// Start it..
			context.startService(si);
		
		} catch(JSONException e) {
			Log.e(APPTAG," > JSONException! "+e);
		}
		
		
	}

	public void pauseRadio() {
		Intent si = new Intent(context, MediaStreamerService.class);
		si.putExtra("pause", true);
	}
	
	public void stopRadio() {
		
		Log.d(APPTAG," > StopRadio()");
		
		// Create intent
		Intent si = new Intent(context, MediaStreamerService.class);
		
		// Stop it..
		context.stopService(si);
		
	}
	
	public void snoozeAlarm() {
		
		Log.d(APPTAG," > SnoozeAlarm()");
		
	}
	
	// --------------------------------------------------
	// Helpers
	
	// --- Service running
	private boolean isServiceRunning(Class<?> serviceClass) {
	    ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            return true;
	        }
	    }
	    return false;
	}

}







































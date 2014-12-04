package com.rejh.cordova.mediastreamer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class MediaStreamerReceiver extends BroadcastReceiver {
	
	// --- Variables
	
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
		
		Log.i(APPTAG,"MediaStreamerReceiver.onReceive()");
		
		// Context & intent
		context = _context;
		intent = _intent;

        // Preferences
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
        
        // ServiceIntent
        serviceIntent = new Intent(context, MediaStreamerService.class);
        
        // Figure what to do...
        
        if (intent.hasExtra("cmd")) {
        	
        	String cmd = intent.getStringExtra("cmd");
        	
        	Log.d(APPTAG," -> Cmd: "+ cmd);
        	
        	// Create
        	if (cmd.equals("create")) {
        		context.startService(serviceIntent);
        	}
        	
        	// Destroy
        	else if (cmd.equals("destroy")) {
        		context.stopService(serviceIntent);
        	}
        	
        	// Pause/resume
        	else if (cmd.equals("pause_resume")) {
        		serviceIntent.putExtra("pause_resume", true);
        		context.startService(serviceIntent);
        	}
        	
        	// Alarm
        	else if (cmd.equals("alarm")) {
        		serviceIntent.putExtra("isAlarm", true);
        		context.startService(serviceIntent);
        	}
        	
        	// Huh?
        	else {
        		Log.w(APPTAG," -> Cmd not recognized");
        	}
	        
        }
		
	}

}

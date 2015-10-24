package com.rejh.cordova.mediastreamer;

import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;
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
		
		// Wakelock
		Log.d(APPTAG," -> Wakelock 60s");
		PowerManager powerMgr = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
		PowerManager.WakeLock wakelock = powerMgr.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, APPTAG);
		wakelock.acquire(60000);

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
        	
        	else if (cmd.equals("pause")) {
        		serviceIntent.putExtra("pause",true);
        		context.startService(serviceIntent);
        	}
        	
        	else if (cmd.equals("next")) {
        		serviceIntent.putExtra("next", true);
        		context.startService(serviceIntent);
        	}
        	
        	else if (cmd.equals("prev")) {
        		serviceIntent.putExtra("prev", true);
        		context.startService(serviceIntent);
        	}
        	
        	// Alarm
        	else if (cmd.equals("alarm")) {
        		
        		// Has station_data extra?
        		if (!intent.hasExtra("station_data")) {
        			Log.e(APPTAG," -> Could not start alarm: !intent.hasExtra('station_data')");
        			return; // <- important
        		}
        		
        		// Get station_data + handle it
        		String station_datas = intent.getStringExtra("station_data");
        		Log.d(APPTAG," > Read and iterate station_data...");
        		try {
        			
        			
        			// Iterate through station_data and include it as extras
        			JSONObject station_data = new JSONObject(station_datas);
        			Iterator<?> keys = station_data.keys();
        			while(keys.hasNext()) {
        			    String key = (String)keys.next();
        			    if (station_data.get(key) instanceof JSONObject) {
        			    	Log.w(APPTAG," -> '"+ key +"' = JSONObject, skip");
        			    	//Log.w(APPTAG," --> "+ station_data.get(key).toString());
        			    }
        			    else if (station_data.get(key) instanceof JSONArray) {
        			    	Log.w(APPTAG," -> '"+ key +"' = JSONArray, skip");
        			    	//Log.w(APPTAG," --> "+ station_data.get(key).toString());
        			    }
        			    else {
        			    	Log.d(APPTAG," -> '"+ key +"' = "+ station_data.get(key).toString() +", Type: "+ station_data.get(key).getClass());
        			    	serviceIntent.putExtra(key, (String)""+station_data.get(key).toString());
        			    }
        			}
        			
        			// Some required 'extra' stuff
        			serviceIntent.putExtra("stream_url",station_data.getString("station_url"));
        			serviceIntent.putExtra("volume", intent.getIntExtra("volume", -1));
        			serviceIntent.putExtra("isAlarm", true);
        			serviceIntent.putExtra("alarm", true); // <- cmd_alarm
        			
        			// Some weird setting?
        			settEditor.putString("mediastreamer_streamUrl", station_data.getString("station_url"));
        	        settEditor.commit();
        			
        			// Do stuff for starredStations
        	        Log.d(APPTAG," > Lookup station in starredStations..");
        			String starredStationsJsons = sett.getString("starredStations", "[]");
        			JSONArray starredStationsJson = new JSONArray(starredStationsJsons);
        			
        			// -> loookup station_id in starred..
        			String station_id = station_data.getString("station_id");
        			int station_index = -1;
        			for (int i=0; i<starredStationsJson.length(); i++) {
        				JSONObject station = starredStationsJson.getJSONObject(i);
        				if (station_id.equals(station.getString("station_id"))) {
        					station_index = i;
        					break;
        				}
        			}
        			Log.d(APPTAG," -> Station_index: "+ station_id);
        			
        			// found station in starred!
        			if (station_index>=0) {
        				settEditor.putInt("starredStationsIndex", station_index);
        				settEditor.commit();
        			} 
        			// NOT foudn in starred! add it :D
        			else {
        				Log.d(APPTAG," -> Add to starred: "+ station_id);
        				
        				JSONArray newStarred = new JSONArray();
        				newStarred.put(station_data);
        				for (int i=0; i<starredStationsJson.length(); i++) {
        					newStarred.put(starredStationsJson.get(i));
        				}
        				
        				settEditor.putString("starredStations", newStarred.toString());
        				settEditor.putInt("starredStationsIndex", 0);
        				settEditor.commit();
        				
        			}
        			
        		} catch(JSONException e) {
        			Log.e(APPTAG," -> MediaStreamerReceiver.onReceive(): Cmd ALARM JSON Exception: "+ e,e);
        		}
        		
        		Log.d(APPTAG," > Start service...");
        		context.startService(serviceIntent);
        		
        		Log.d(APPTAG," > Start activity...");
        		Intent activityIntent = new Intent(context, com.rejh.icerrr.itson.Icerrr.class);
        		activityIntent.putExtra("cmd", "alarm");
        		activityIntent.putExtra("station_id", intent.getStringExtra("station_id"));
        		activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        		context.startActivity(activityIntent);
        		
        	}
        	
        	// Huh?
        	else {
        		Log.w(APPTAG," -> Cmd not recognized");
        	}
	        
        }
		
	}

}

package com.rejh.cordova.alarmmgr;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class AlarmMgrOnBoot extends BroadcastReceiver {
	
	// --- Variables
	
	final static String APPTAG = "AlarmMgr";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent intent;
	
	private AlarmManager alarmMgr;
	
	// --------------------------------------------------
	// Receive

	@Override
	public void onReceive(Context _context, Intent _intent) {
		
		Log.i(APPTAG,"AlarmMgrOnBoot.onReceive()");
		
		// Check if it's an update message
		boolean isUpdate = false;
		boolean isUpdateAndRun = false;
		try {
			String dataString = _intent.getDataString();
			if (dataString!=null) {
				isUpdate = true;
				if (dataString.contains("com.rejh.icerrr.droidapp")){
					isUpdate = true;
					isUpdateAndRun = true;
				}
			}
		} catch(Exception e) {
			Log.w(APPTAG," > Exception when trying to check if update");
			Log.w(APPTAG,e);
		}
		
		if (isUpdate && !isUpdateAndRun) {
			Log.d(APPTAG," > Update detected but not Icerrr, return");
			return;
		} else {
			Log.d(APPTAG," > isUpdate: "+ isUpdate);
		}
		
		try {
		
			// Context & intent
			context = _context;
			intent = _intent;
	        
	        // Preferences
	        sett = context.getSharedPreferences(APPTAG,2);
	        settEditor = sett.edit();
	        
	        // AlarmMgr
	        alarmMgr = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
			
			Map<String, ?> allEntries = sett.getAll();
			for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
				
				// Key + value
				String key = entry.getKey();
				String value = (entry.getValue()!=null) ? entry.getValue().toString() : null;
				
				if (key.indexOf("alarm_")>=0 && value!=null) {
					
					try {
					
						Log.d(APPTAG," > "+key);
						
						boolean doRepeat = false;
						
						// Opts
						JSONObject opts = new JSONObject(value);
						
						// Get args
						int id = opts.has("id") ? opts.getInt("id") : -1;
						long timeMillis = opts.has("timeMillis") ? opts.getLong("timeMillis") : -1;
						int hour = opts.has("hour") ? opts.getInt("hour") : -1;
						int minute = opts.has("minute") ? opts.getInt("minute") : -1;
						String repeat = opts.has("repeat") ? opts.getString("repeat") : "no";
						long repeatMillis = opts.has("repeatMillis") ? opts.getLong("repeatMillis") : -1;
						JSONObject intentOpts = opts.has("intent") ? opts.getJSONObject("intent") : null;
						
						// Check
						if (id<0) {
							Log.e(APPTAG,"Missing opts: id??");
							return;
						}
						if (hour<0 || minute <0) {
							Log.e(APPTAG,"Missing opts: hour/minute??");
							return;
						}
						if (intentOpts==null) {
							Log.e(APPTAG,"Missing opts: intentOpts??");
							return;
						}
						
						// Handle date
						Calendar cal = Calendar.getInstance();
						cal.setTimeInMillis(System.currentTimeMillis());
						//int hour = cal.get(Calendar.HOUR_OF_DAY);
						//int min = cal.get(Calendar.MINUTE);
						cal.set(Calendar.HOUR_OF_DAY, hour);
						cal.set(Calendar.MINUTE, minute);
						cal.set(Calendar.SECOND, 0);
						int day = cal.get(Calendar.DAY_OF_MONTH);
						
						// Check if date is in the future
						Calendar calnow = Calendar.getInstance();
						calnow.setTimeInMillis(System.currentTimeMillis());
						int daynow = calnow.get(Calendar.DAY_OF_MONTH);
						int hournow = calnow.get(Calendar.HOUR_OF_DAY);
						int minnow = calnow.get(Calendar.MINUTE);
						
						if (day == daynow && hour < hournow || day == daynow && hour <= hournow && minute <= minnow) {
							Log.d(APPTAG," > Set alarm one day in future");
							cal.set(Calendar.DAY_OF_MONTH, cal.get(Calendar.DAY_OF_MONTH)+1);
						}
						timeMillis = cal.getTimeInMillis();
						
						Log.d(APPTAG," > "+calToString(cal));
						
						// Handle repeat
						if (repeat.equals("minutely")) {
							doRepeat = true;
							repeatMillis = 1000*60;
						} else if (repeat.equals("hourly")) {
							doRepeat = true;
							repeatMillis = 1000*60*60;
						} else if (repeat.equals("daily")) {
							doRepeat = true;
							repeatMillis = 1000*60*60*24;
						} else if (repeat.equals("custom")) {
							doRepeat = true;
							if (repeatMillis<0) { Log.e(APPTAG," > repeatMillis<0"); return; }
							// repeatMillis already set...
						}
						
						// Handle intent
						Intent intent = new Intent(context, AlarmMgrReceiver.class);
						intent.putExtra("alarm_id", id);
						PendingIntent pintent = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
						
						// Cancel first
						alarmMgr.cancel(pintent);
						
						// Create alarm...
						if (doRepeat) {
							Log.d(APPTAG," > Repeat "+ repeatMillis);
							alarmMgr.setRepeating(AlarmManager.RTC_WAKEUP, timeMillis, repeatMillis, pintent);
						} else {
							Log.d(APPTAG," > Once");
							alarmMgr.set(AlarmManager.RTC_WAKEUP, timeMillis, pintent);
						}
			        
			        } catch(Exception e) {
			        	e.printStackTrace();
			        	Log.e(APPTAG," > Exception in for-loop, probably JSON related",e);
			        }
					
				}
				
			} 
        
        } catch(Exception e) {
        	e.printStackTrace();
        	Log.e(APPTAG," > Exception, probably JSON related",e);
        }

	}
    
	// --------------------------------------------------
    // --- HELPERS
	
	private String calToString (Calendar cal) {
		
		Date date = cal.getTime();
		SimpleDateFormat format = new SimpleDateFormat("MM-dd HH:mm a");
		String dateFormat = format.format(date);
		
		return dateFormat;
		
	}

}

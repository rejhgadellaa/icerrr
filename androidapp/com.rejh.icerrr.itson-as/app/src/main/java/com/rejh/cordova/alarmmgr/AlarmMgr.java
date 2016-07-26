package com.rejh.cordova.alarmmgr;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class AlarmMgr extends CordovaPlugin {
	
	// --------------------------------------------------
	// --- Variables
	
	final static String APPTAG = "AlarmMgr";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private String packageName;
	
	private AlarmManager alarmMgr;
	
	// --------------------------------------------------
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
        
        // PackageName
        packageName = context.getPackageName();
        
        // AlarmMgr
        alarmMgr = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        // > Check action
        
        if (action==null) {
        	callbackContext.error("Action is null");
            return false;
        }
        
        Log.d(APPTAG," -> "+ action);
        
        // > A GOGO
        
        try {
            
            // Set
            if (action.equals("set")) {
                set(args,callbackContext);
                return true;
            }
            
            // Set all
            if (action.equals("setAll")) {
            	Intent setAllIntent = new Intent(context, AlarmMgrOnBoot.class);
            	context.sendBroadcast(setAllIntent);
            	callbackContext.success("OK");
            	return true;
            }
            
            // Cancel
            else if (action.equals("cancel")) {
                cancel(args,callbackContext);
            	return true;
            }
            
            // Cancel all
            else if (action.equals("cancelAll")) {
                cancelAll(callbackContext);
            	return true;
            }
            
            // Whut??
            else {
                callbackContext.error("AlarmMgr: Action contains invalid value: "+ action);
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
		
	}
    
	// --------------------------------------------------
    // --- Methods
	
	private void set(JSONArray args, CallbackContext callbackContext) throws JSONException {

		// Prep
		boolean doRepeat = false;
		
		// Args
		JSONObject opts = args.getJSONObject(0);
		
		// Get args
		int id = opts.has("id") ? opts.getInt("id") : -1;
		long timeMillis = opts.has("timeMillis") ? opts.getLong("timeMillis") : -1;
		int hour = opts.has("hour") ? opts.getInt("hour") : -1;
		int minute = opts.has("minute") ? opts.getInt("minute") : -1;
		String repeat = opts.has("repeat") ? opts.getString("repeat") : "no";
		long repeatMillis = opts.has("repeatMillis") ? opts.getLong("repeatMillis") : -1;
		JSONArray repeatDaily = opts.has("repeatDaily") ? opts.getJSONArray("repeatDaily") : new JSONArray();
		JSONObject intentOpts = opts.has("intent") ? opts.getJSONObject("intent") : null;
		boolean isExact = opts.has("isExact") ? opts.getBoolean("isExact") : true;
		
		// Check
		if (id<0) {
			callbackContext.error("Missing opts: id??");
			return;
		}
		if (hour<0 || minute <0) {
			Log.e(APPTAG,"Missing opts: hour/minute??");
			return;
		}
		if (intentOpts==null) {
			callbackContext.error("Missing intentOpts: id??");
			return;
		}
		
		Log.d(APPTAG," > Set alarm with ID: 'alarm_"+ id +"'");
		
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
			Log.d(APPTAG," -> Set alarm one day in future");
			cal.set(Calendar.DAY_OF_MONTH, cal.get(Calendar.DAY_OF_MONTH)+1);
		}
		timeMillis = cal.getTimeInMillis();
		
		Log.d(APPTAG," -> "+calToString(cal));
		
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
			if (repeatMillis<0) { callbackContext.error("repeatMillis<0"); return; }
			// repeatMillis already set...
		}
		
		// Handle no repeat
		if (Build.VERSION.SDK_INT >= 19) {
			Log.w(APPTAG," -> No repeat and SDK >= 19, use isExact");
			isExact = true;
		}
		if(isExact && Build.VERSION.SDK_INT < 19) {
			Log.w(APPTAG," -> Exact alarm only needed when SDK < 19");
			isExact = false;
		}
		
		// Store some stuff
		String alarm_key = "alarm_"+ id;
		String alarm_jsons = opts.toString();
		//Log.d(APPTAG," -> "+alarm_jsons); // DEBUG
		settEditor.putString(alarm_key,alarm_jsons);
		settEditor.commit();
		
		// Handle intent
		Intent intent = new Intent(context, com.rejh.cordova.alarmmgr.AlarmMgrReceiver.class);
		intent.putExtra("alarm_id", id);
		PendingIntent pintent = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
		
		// Cancel first
		alarmMgr.cancel(pintent);
		
		// Create alarm...
		if (doRepeat && !isExact) {
			Log.d(APPTAG," -> Repeat "+ repeatMillis);
			alarmMgr.setRepeating(AlarmManager.RTC_WAKEUP, timeMillis, repeatMillis, pintent);
		} else if (isExact && Build.VERSION.SDK_INT >= 23) {
			Log.d(APPTAG," -> Once, exact and while idle: "+ calToString(cal));
			alarmMgr.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeMillis, pintent);
		} else if (isExact && Build.VERSION.SDK_INT >= 19) {
			Log.d(APPTAG," -> Once, exact: "+ calToString(cal));
			alarmMgr.setExact(AlarmManager.RTC_WAKEUP, timeMillis, pintent);
		} else {
			Log.d(APPTAG," -> Once");
			alarmMgr.set(AlarmManager.RTC_WAKEUP, timeMillis, pintent);
		}
		
		// Default callback
		callbackContext.success("OK "+calToString(cal));
		return;
		
	}
	
	public void cancel(JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		// Args
		JSONObject opts = args.getJSONObject(0);
		
		// Get id
		int id = opts.has("id") ? opts.getInt("id") : -1;
		if (id<0) { Log.e(APPTAG," --> id<0, error!"); callbackContext.error("id<0"); return; }
		
		Log.d(APPTAG," --> id: "+ id);
		
		// Cancel intent
		Intent intent = new Intent(context, AlarmMgrReceiver.class);
		intent.putExtra("alarm_id", id);
		PendingIntent pintent = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT);
		alarmMgr.cancel(pintent);
		
		// Store some stuff
		String alarm_key = "alarm_"+ id;
		String alarm_jsons = null;
		settEditor.putString(alarm_key,alarm_jsons);
		settEditor.commit();
		
		callbackContext.success("OK");
		return;
		
	}
	
	public void cancelAll(CallbackContext callbackContext) throws JSONException {
		
		// TODO
		callbackContext.error("Not implemented yet...");
		
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






































package com.rejh.cordova.alarmmgr;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

public class AlarmMgrReceiver extends BroadcastReceiver {
	
	// --- Variables
	
	final static String APPTAG = "AlarmMgr";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent intent;
	
	// --------------------------------------------------
	// Receive

	@Override
	public void onReceive(Context _context, Intent _intent) {
		
		Log.i(APPTAG,"AlarmMgrReceiver.onReceive()");
		
        try {
		
			// Context & intent
			context = _context;
			intent = _intent;
			
			Log.d(APPTAG," -> Wakelock 60s");
			PowerManager powerMgr = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
			PowerManager.WakeLock wakelock = powerMgr.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, APPTAG);
			wakelock.acquire(60000);
	        
	        // Preferences
	        sett = context.getSharedPreferences(APPTAG,2);
	        settEditor = sett.edit();
	        
	        // Get alarm_id
	        if (!intent.hasExtra("alarm_id")) {
	        	Log.e(APPTAG," > Error: !alarm_id in intent");
	        	return;
	        }
	        int id = intent.getIntExtra("alarm_id", 0);
	        
	        Log.d(APPTAG," > Alarm received with ID: 'alarm_"+ id +"'");
	        
	        // Opts
	        String optsStr = sett.getString("alarm_"+id, "{}");
	        // Log.d(APPTAG, " > "+ optsStr); // DEBUG
        	JSONObject opts = new JSONObject(optsStr);
    		
        	// Get args
    		//int id = opts.has("id") ? opts.getInt("id") : -1;
    		long timeMillis = opts.has("timeMillis") ? opts.getLong("timeMillis") : -1;
    		int hour = opts.has("hour") ? opts.getInt("hour") : -1;
    		int minute = opts.has("minute") ? opts.getInt("minute") : -1;
    		String repeat = opts.has("repeat") ? opts.getString("repeat") : "no";
    		long repeatMillis = opts.has("repeatMillis") ? opts.getLong("repeatMillis") : -1;
    		JSONArray repeatDaily = opts.has("repeatDaily") ? opts.getJSONArray("repeatDaily") : new JSONArray();
    		JSONObject intentOpts = opts.has("intent") ? opts.getJSONObject("intent") : null;
    		boolean isExact = opts.has("isExact") ? opts.getBoolean("isExact") : true;
    		
    		// Handle repeat: off
    		// -> Remove alarm from settings to prevent it from firing again..
    		if (repeat.equals("off") || !repeat.equals("daily")) {
    			Log.d(APPTAG, " -> !repeat, fire alarm and forget..");
	    		settEditor.putString("alarm_"+id, null);
	    		settEditor.commit();
    		}
    		
    		// Handle repeat: on
    		boolean doRepeat = false;
    		if (repeat.equals("minutely")) {
    			doRepeat = true;
    		} else if (repeat.equals("hourly")) {
    			doRepeat = true;
    		} else if (repeat.equals("daily")) {
    			doRepeat = true;
    		} else if (repeat.equals("custom")) {
    			// TODO: This is gonna cause 99 probz
    			// repeatMillis already set...
    		}
    		
    		// Handle exact + repeat (re-set alarm..)
    		if (isExact && doRepeat && Build.VERSION.SDK_INT >= 19) {
    			
    			Log.d(APPTAG," -> Alarm isExact && doRepeat, re-set for next day..");
    			
    			// Create alarmMgr
    			AlarmManager alarmMgr = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    			
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
    				Log.d(APPTAG," --> Set alarm one day in future");
    				cal.set(Calendar.DAY_OF_MONTH, cal.get(Calendar.DAY_OF_MONTH)+1);
    			}
    			timeMillis = cal.getTimeInMillis();
    			
    			// Handle intent
    			Intent intent = new Intent(context, com.rejh.cordova.alarmmgr.AlarmMgrReceiver.class);
    			intent.putExtra("alarm_id", id);
    			PendingIntent pintent = PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
    			
    			// Cancel first
    			alarmMgr.cancel(pintent);
    			
    			// Create alarm...
    			if (Build.VERSION.SDK_INT >= 23) {
					Log.d(APPTAG," -> Once, exact and while idle: "+ calToString(cal));
					alarmMgr.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,  timeMillis, pintent);
    			} else {
    				Log.d(APPTAG," --> Once, exact: "+ calToString(cal));
    				alarmMgr.setExact(AlarmManager.RTC_WAKEUP,  timeMillis, pintent);
    			}
				
    			
    			
    		}
    		
    		// Handle repeat: daily --> Do we need to fire today?
			boolean fireToday = true;
    		if (repeat.equals("daily")) {
    			Log.d(APPTAG," -> Daily repeat..");
    			Calendar caltoday = Calendar.getInstance();
    			caltoday.setTimeInMillis(System.currentTimeMillis());
				int dayOfWeek = caltoday.get(Calendar.DAY_OF_WEEK)-1;
				if (repeatDaily.length()<dayOfWeek) { fireToday = false; }
				else if (repeatDaily.getInt(dayOfWeek)>0) { fireToday = true; }
				else { fireToday = false; }
				Log.d(APPTAG," -> Day: "+ dayOfWeek +", "+ repeatDaily.getInt(dayOfWeek));
    		}
    		if (!fireToday) { 
    			Log.d(APPTAG," -> Do not need to fire today");
    			return; // <-- important stuff
    		}
    		
    		// Handle intent
    		String intentType = intentOpts.has("type") ? intentOpts.getString("type") : "activity";
    		JSONArray intentExtras = intentOpts.has("extras") ? intentOpts.getJSONArray("extras") : null;
    		Intent runIntent = createIntent(intentOpts, intentExtras);
    		runIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    		
    		if (intentType.equals("activity")) {
    			Log.d(APPTAG," -> StartActivity()");
    			context.startActivity(runIntent);
    		} else if (intentType.equals("service")) {
    			Log.d(APPTAG," -> StartService()");
    			context.startService(runIntent);
    		} else if (intentType.equals("receiver")) {
    			Log.d(APPTAG," -> SendBroadcast()");
    			context.sendBroadcast(runIntent);
    		}
        
        } catch(Exception e) {
        	e.printStackTrace();
        	Log.e(APPTAG," > Exception, probably JSON related",e);
        }

	}
    
    // --------------------------------------------------
    // --- PRIVATE METHODS, HELPERS
    
    // > Intents
    
    // Create Intent (with extras!)
    private Intent createIntent(JSONObject intentCfg, JSONArray intentExtras) throws JSONException {

    	// New intent
	    Intent notifIntent = new Intent();
	    
	    // > Figure what type of intent
	    
	    // By classname
	    if (intentCfg.has("package") && intentCfg.has("classname")) {
	    	String intentPackage = intentCfg.getString("package");
	    	String intentClassName = intentCfg.getString("classname");
	    	Log.d(APPTAG," -> Intent by classname: "+intentClassName);
	    	notifIntent.setClassName(intentPackage, intentClassName);
	    }
	    
	    // By action
	    if (intentCfg.has("package") && intentCfg.has("action")) {
	    	String intentPackage = intentCfg.getString("package");
	    	String action = intentCfg.getString("action");
	    	Log.d(APPTAG," -> Intent by action: "+action);
	    	notifIntent.setPackage(intentPackage);
	    	notifIntent.setAction(action);
	    	Log.d(APPTAG," ---> "+notifIntent.getAction());
	    }
	    
	    
	    // Extras
	    if (intentExtras!=null) {
			for (int i=0; i<intentExtras.length(); i++) {
				JSONObject intentExtra = intentExtras.getJSONObject(i);
				String type = intentExtra.getString("type").toLowerCase();
				String name = intentExtra.getString("name");
				Log.d(APPTAG," >> "+ type +", "+ name);
				if (type.equals("string")) {
					notifIntent.putExtra(name, intentExtra.getString("value"));
					//Log.e(APPTAG," -->> "+ intentExtra.getString("value"));
				} else if (type.equals("int")) {
					notifIntent.putExtra(name, intentExtra.getInt("value"));
				} else if (type.equals("float") || type.equals("double")) {
					notifIntent.putExtra(name, intentExtra.getDouble("value"));
				} else if (type.equals("boolean") || type.equals("bool")) {
					notifIntent.putExtra(name, intentExtra.getBoolean("value"));
				} else {
					Log.w(APPTAG," > type not handled, extra not put");
				}
			}
		}
	    
	    return notifIntent;
	    		
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































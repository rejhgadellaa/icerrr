package com.rejh.cordova.alarmmgr;

import java.util.Calendar;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
	        
	        // Opts
	        String optsStr = sett.getString("alarm_"+id, "{}");
	        Log.d(APPTAG, " > "+ optsStr);
        	JSONObject opts = new JSONObject(optsStr);
    		
    		// Get args
    		// long timeMillis = opts.has("timeMillis") ? opts.getLong("timeMillis") : 0;
    		String repeat = opts.has("repeat") ? opts.getString("repeat") : "off";
    		JSONArray repeatDaily = opts.has("repeatDaily") ? opts.getJSONArray("repeatDaily") : new JSONArray();
    		JSONObject intentOpts = opts.has("intent") ? opts.getJSONObject("intent") : null;
    		
    		// Handle date
    		Calendar cal = Calendar.getInstance();
    		cal.setTimeInMillis(System.currentTimeMillis());
    		
    		// Handle repeat: daily
			boolean fireToday = true;
    		if (repeat.equals("daily")) {
    			Log.d(APPTAG," > Daily repeat..");
				int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)-1;
				if (repeatDaily.length()<dayOfWeek) { fireToday = false; }
				else if (repeatDaily.getInt(dayOfWeek)>0) { fireToday = true; }
				else { fireToday = false; }
				Log.d(APPTAG," > Day: "+ dayOfWeek +", "+ repeatDaily.getInt(dayOfWeek));
    		}
    		if (!fireToday) { 
    			Log.d(APPTAG," > Do not need to fire today");
    			return; // <-- important stuff
    		}
    		
    		// Handle repeat: off
    		// -> Remove alarm from settings to prevent it from firing again..
    		if (repeat.equals("off") || !repeat.equals("daily")) {
    			Log.d(APPTAG, " > !repeat, fire alarm and forget..");
	    		settEditor.putString("alarm_"+id, null);
	    		settEditor.commit();
    		}
    		
    		// Handle intent
    		String intentType = intentOpts.has("type") ? intentOpts.getString("type") : "activity";
    		JSONArray intentExtras = intentOpts.has("extras") ? intentOpts.getJSONArray("extras") : null;
    		Intent runIntent = createIntent(intentOpts, intentExtras);
    		
    		if (intentType.equals("activity")) {
    			runIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    			context.startActivity(runIntent);
    		} else if (intentType.equals("activity")) {
    			context.startService(runIntent);
    		} else if (intentType.equals("activity")) {
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

}































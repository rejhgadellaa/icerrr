package com.rejh.cordova.mediastreamer;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.api.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.rejh.cordova.notifmgr.NotifMgr;

public class MediaStreamerNotifMgr {
	
	// --------------------------------------------------
	// Members
	
	private final String LOGTAG = "MediaStreamer";
	private final String SETTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private NotifMgr notifMgr;
	
	private CordovaInterface cordova;
	private CordovaWebView webview;
	
	public static int NOTIFICATION_ID = 1;
	
	// Variables
	
	public Notification notifObj;
	
	// --------------------------------------------------
	// Constructor
	
	public MediaStreamerNotifMgr(Context _context, CordovaInterface _cordova, CordovaWebView _webview) {
		
		Log.i(LOGTAG,"MediaStreamerNotifMgr()");
		
		// Store values
		context = _context;
		cordova = _cordova;
		webview = _webview;
		
		// Create NotifMgr Cordova plugin instance
		notifMgr = new NotifMgr();
		notifMgr.initialize(_cordova, _webview);
		
	}
	
	public MediaStreamerNotifMgr(Context _context) {
		
		Log.i(LOGTAG,"MediaStreamerNotifMgr()");
		
		// Store values
		context = _context;
		
		// Create NotifMgr Cordova plugin instance
		notifMgr = new NotifMgr();
		
	}
	
	// --------------------------------------------------
	// Methods
	
	// Notify
	public int notif(String stationName, String nowPlaying, int notif_id) {
		
		Log.d(LOGTAG,"MediaStreamerNotifMgr.notify()");
		
		try {
			
			// Create args
			JSONArray args = new JSONArray();
		
			// Create opts
			JSONObject opts = new JSONObject();
			opts.put("onlybuild",true);
			opts.put("id", (notif_id>0)?notif_id:NOTIFICATION_ID);
			opts.put("title","Icerrr: "+ stationName);
			opts.put("message", (nowPlaying!=null) ? nowPlaying : "Now playing: Unknown");
			opts.put("smallicon","ic_stat_hardware_headphones");
			opts.put("priority", "HIGH");
			opts.put("ongoing",true);
			opts.put("alertOnce",true);
			
			// Create optsIntent
			JSONObject optsIntent = new JSONObject();
			optsIntent.put("type","activity");
			optsIntent.put("package","com.rejh.icerrr.droidapp");
			optsIntent.put("classname","com.rejh.icerrr.droidapp.Icerrr");
			opts.put("intent", optsIntent);
			
			// Create actions
			JSONArray optsActions = new JSONArray();
			
			// -> Action 1
			JSONObject optsAction1 = new JSONObject();
			JSONObject optsAction1Intent = new JSONObject();
			JSONArray optsAction1IntentExtras = new JSONArray();
			JSONObject optsAction1IntentExtra1 = new JSONObject();
			optsAction1.put("icon","ic_stat_av_stop");
			optsAction1.put("title","Stop playback");
			optsAction1Intent.put("type","receiver");
			optsAction1Intent.put("package","com.rejh.icerrr.droidapp");
			optsAction1Intent.put("classname","com.rejh.cordova.mediastreamer.MediaStreamerReceiver");
			optsAction1IntentExtra1.put("type","string");
			optsAction1IntentExtra1.put("name","cmd");
			optsAction1IntentExtra1.put("value","destroy");
			optsAction1IntentExtras.put(optsAction1IntentExtra1);
			optsAction1Intent.put("extras", optsAction1IntentExtras);
			optsAction1.put("intent", optsAction1Intent);
			
			// -> Action 2
			JSONObject optsAction2 = new JSONObject();
			JSONObject optsAction2Intent = new JSONObject();
			JSONArray optsAction2IntentExtras = new JSONArray();
			JSONObject optsAction2IntentExtra1 = new JSONObject();
			optsAction2.put("icon","ic_stat_av_pause");
			optsAction2.put("title","Pause/Resume");
			optsAction2Intent.put("type","receiver");
			optsAction2Intent.put("package","com.rejh.icerrr.droidapp");
			optsAction2Intent.put("classname","com.rejh.cordova.mediastreamer.MediaStreamerReceiver");
			optsAction2IntentExtra1.put("type","string");
			optsAction2IntentExtra1.put("name","cmd");
			optsAction2IntentExtra1.put("value","pause_resume");
			optsAction2IntentExtras.put(optsAction2IntentExtra1);
			optsAction2Intent.put("extras", optsAction2IntentExtras);
			optsAction2.put("intent", optsAction2Intent);
			
			// Store actions
			optsActions.put(optsAction1);
			optsActions.put(optsAction2);
			opts.put("actions",optsActions);
			
			// Put opts in args
			args.put(opts);
			
			// Call NotifMgr plugin
			notifMgr.execute("make",args, null, context);
			notifObj = notifMgr.notifObj;
			
			return (notif_id>0)?notif_id:NOTIFICATION_ID;
        	
        } catch (JSONException e) {
        	Log.e(LOGTAG, "JSONException!");
        	e.printStackTrace();
        } catch (Exception e) {
	    	Log.e(LOGTAG, "Exception!");
	        e.printStackTrace();
	    } catch (Error e) {
	    	Log.e(LOGTAG, "Error!");
	        e.printStackTrace();
	    }
		
		return -1;
		
	}
	
	// Cancel
	public int cancel(int notif_id) {
		
		Log.d(LOGTAG,"MediaStreamerNotifMgr.cancel()");
		
		try {
		
			if (notif_id<=0) { notif_id = NOTIFICATION_ID; }
			
			// Create args + opts
			JSONArray args = new JSONArray();
			JSONObject opts = new JSONObject();
			opts.put("id",notif_id);
			args.put(opts);
			
			// Call NotifMgr plugin
			notifMgr.execute("cancel", args, null, context);
    	
	    } catch (JSONException e) {
	    	Log.e(LOGTAG, "JSONException!");
	    	e.printStackTrace();
	    } catch (Exception e) {
	    	Log.e(LOGTAG, "Exception!");
	        e.printStackTrace();
	    } catch (Error e) {
	    	Log.e(LOGTAG, "Error!");
	        e.printStackTrace();
	    }
		
		return -1;
		
	}
	
	
	// CancelAll
	
	
	
	
}

































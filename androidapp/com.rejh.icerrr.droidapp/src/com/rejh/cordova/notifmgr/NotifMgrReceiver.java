package com.rejh.cordova.notifmgr;

import com.rejh.cordova.mediastreamer.MediaStreamerService;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class NotifMgrReceiver extends BroadcastReceiver {
	
	// --- Variables
	
	final static String APPTAG = "NotifMgr";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent intent;
	private Intent serviceIntent;
	
	// --------------------------------------------------
	// Receive

	@Override
	public void onReceive(Context _context, Intent _intent) {
		
		Log.i(APPTAG,"NotifMgr.onReceive()");
		
		// Context & intent
		context = _context;
		intent = _intent;
        
        // Figure what to do...
        
        if (intent.hasExtra("cmd")) {
        	
        	String cmd = intent.getStringExtra("cmd");
        	
        	Log.d(APPTAG," -> Cmd: "+ cmd);
        	
        	// Cancel
        	if (cmd.equals("cancel") && intent.hasExtra("notif_id")) {
        		int notif_id = intent.getIntExtra("notif_id", -1);
        		NotificationManager notifMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                notifMgr.cancel(notif_id);
        	}
        	
        	// CancelAll
        	if (cmd.equals("cancelAll")) {
        		NotificationManager notifMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                notifMgr.cancelAll();
        	}
        	
        	// Huh?
        	else {
        		Log.w(APPTAG," -> Cmd not recognized");
        	}
	        
        }
		
	}

}

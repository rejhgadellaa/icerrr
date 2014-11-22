package com.rejh.cordova.mediastreamer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.RemoteControlClient;
import android.util.Log;
import android.view.KeyEvent;

public class RemoteControlReceiver extends BroadcastReceiver {
	
	// --- Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	private Intent intent;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	// --- Receive
	
    @Override
    public void onReceive(Context _context, Intent _intent) {
    	
    	Log.d(APPTAG,"RemoteControlReceiver");
    	
    	// Context, intent
    	context = _context;
    	intent = _intent;

        // Preferences
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
    	
    	// Stop if needed 
    	if (intent.getAction()==null) { return; }
        if (!intent.getAction().equals(Intent.ACTION_MEDIA_BUTTON)) { return; }
        
        // Create sIntent
        Intent sIntent = new Intent(context, MediaStreamerService.class);
		
        // Get key event
		KeyEvent event = (KeyEvent)intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
        
		// Event empty > return
		if (event == null) {
			Log.d(APPTAG,"event==null");
		    return;
		}
		
		int action = event.getAction();
		if (action == KeyEvent.ACTION_UP) {
			
		    if (event.getKeyCode()==126 || event.getKeyCode()==127 || event.getKeyCode()==85) { // Play/pause (85==android wear?)
		    	Log.d(APPTAG," > Play/pause");
		    	sIntent.putExtra("pause_resume", true);
		    	context.startService(sIntent);
		    }
		    
		    else if (event.getKeyCode()==88) { // Previous 
		    		
		    }
		    
		    else if (event.getKeyCode()==87) { // Next 
		    		
		    }
		    
		    else {
		    	Log.d(APPTAG," > "+ event.getKeyCode());
		    }
			
		}
        
        
    }
}

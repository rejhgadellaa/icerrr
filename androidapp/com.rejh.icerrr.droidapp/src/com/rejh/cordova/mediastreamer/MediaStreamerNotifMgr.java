package com.rejh.cordova.mediastreamer;

import org.apache.cordova.api.LOG;

import android.content.Context;
import android.content.SharedPreferences;

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
	
	// Variables
	
	
	
	// --------------------------------------------------
	// Constructor
	
	public MediaStreamerNotifMgr(Context _context) {
		
		LOG.i(LOGTAG,"MediaStreamerNotifMgr()");
		
		// Store context
		context = _context;
		
		// Create NotifMgr Cordova plugin instance
		notifMgr = new NotifMgr();
		
	}
	
}

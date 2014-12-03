package com.rejh.cordova.mediastreamer;

import java.util.Timer;
import java.util.TimerTask;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.MediaMetadataRetriever;
import android.util.Log;

public class ObjMediaMetadataRetrieverMgr {
	
	// --------------------------------------------------
	// Members
	
	private final String LOGTAG = "MediaStreamer";
	private final String SETTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	/*
	
	private MediaMetadataRetriever retriever;
	private Timer timer;
	
	// Variables
	
	private String streamUrl;
	
	// --------------------------------------------------
	// Constructor
	
	public ObjMediaMetadataRetrieverMgr(Context _context, String _streamUrl) {
		
		Log.i(LOGTAG,"MediaMetadataRetrieverMgr.Constructor()");
		
		context = _context;
		streamUrl = _streamUrl;
		
		sett = context.getSharedPreferences(SETTAG,2);
        settEditor = sett.edit();
		
	}
	
	// --------------------------------------------------
	// Methods Public
	
	public void init() {
		
		Log.d(LOGTAG,"MediaMetadataRetrieverMgr.init()");
		
		// Retriever
		if (retriever!=null) { retriever.release(); }
		retriever = new MediaMetadataRetriever();
		retriever.setDataSource(streamUrl);
		
		// Timer
		if (timer!=null) { timer.cancel(); }
		timer = new Timer();
		timer.scheduleAtFixedRate( new TimerTask() {
			public void run() {
				
				String title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE);
				
			}
		}, 0, 5*1000);
		
	}
	
	/**/
	
	
	
	
	
	
	
	
	
	
	
	
	
	

}

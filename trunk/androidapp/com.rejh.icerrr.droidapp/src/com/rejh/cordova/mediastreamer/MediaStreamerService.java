package com.rejh.cordova.mediastreamer;

import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class MediaStreamerService extends Service {

	@Override
	public IBinder onBind(Intent arg0) { return null; }
	
	// --- Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent serviceIntent;
	
	private WifiManager wifiMgr;
	private WifiManager.WifiLock wifiLock;
	
	private PowerManager powerMgr;
	private PowerManager.WakeLock wakelock;
	
	// --------------------------------------------------
	// Lifecycle
	
	// OnCreate
	@Override
	public void onCreate() {
		
		super.onCreate();
		Log.i(APPTAG,"MediaStreamerService.OnCreate");
		
		// > Setup
		
		// Context
		context = getApplicationContext();

        // Preferences
        sett = context.getSharedPreferences(APPTAG,2);
        settEditor = sett.edit();
		
        // Others
		powerMgr = (PowerManager) getSystemService(Context.POWER_SERVICE);
		
		// Make sticky
		try {
			PackageManager packMgr = context.getPackageManager();
			ComponentName thisComponent = new ComponentName(context, MediaStreamerService.class);
			packMgr.setComponentEnabledSetting(thisComponent, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
		}
		catch(Exception e) { Log.e(APPTAG," -> MakeSticky Exception: "+e); }
		
		// Service running..
		settEditor.putBoolean("mediastreamer_serviceRunning", true);
		settEditor.commit();
		
		// Setup
		setup();
		
	}
	
	// OnDestroy
	@Override
	public void onDestroy() {
		
		super.onDestroy();
		Log.i(APPTAG,"MediaStreamerService.OnDestroy");
		
		settEditor.putBoolean("mediastreamer_serviceRunning", false);
		settEditor.commit();
		
		shutdown();
		
		
	}
	
	// --------------------------------------------------
	// Setup
	
	private void setup() {
		
		// Wakelock
		wakelock = powerMgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, APPTAG);
		if (wakelock.isHeld()) { wakelock.release(); }
		wakelock.acquire();
		
		// WifiLock
		wifiMgr = (WifiManager) context.getSystemService(WIFI_SERVICE);
		wifiLock = wifiMgr.createWifiLock(WifiManager.WIFI_MODE_FULL,"Lock");
		wifiLock.acquire();
		
	}
	
	// Shutdown
	
	private void shutdown() {

		// WifiLock OFF
		if (wifiLock!=null) { wifiLock.release(); }
        
        // WakeLock OFF
        if (wakelock.isHeld()) { wakelock.release(); }
        
	}
	
	

}
































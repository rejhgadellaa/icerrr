package com.rejh.cordova.mediastreamer;

import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
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
	
	private ConnectivityManager connMgr;
	
	private PowerManager powerMgr;
	private PowerManager.WakeLock wakelock;
	
	private TelephonyManager telephonyMgr;
	private PhoneStateListener phoneListener;
	
	private ObjMediaPlayerMgr mpMgr;
    
    private String stream_url_active = null;
	
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
		wifiMgr = (WifiManager) context.getSystemService(WIFI_SERVICE);
        connMgr = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
		powerMgr = (PowerManager) getSystemService(Context.POWER_SERVICE);
        telephonyMgr = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
		
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
		
		// Cancel notifmgr notif if available
		Intent notifIntent = new Intent();
		notifIntent.setPackage(context.getPackageName());
		notifIntent.setAction("com.rejh.cordova.notifmgr.actions.RECEIVER");
		notifIntent.putExtra("cmd", "cancel");
		notifIntent.putExtra("notif_id",1); // TODO: what ID should we use?
		context.sendBroadcast(notifIntent);
		
		// Store some values
		settEditor.putBoolean("mediastreamer_serviceRunning", false);
		settEditor.commit();
		
		shutdown();
		
		
	}
	
	// --------------------------------------------------
	// Setup
	
	private void setup() {
        
        Log.d(APPTAG," > setup()");
		
		// Wakelock
		wakelock = powerMgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, APPTAG);
		if (wakelock.isHeld()) { wakelock.release(); }
		wakelock.acquire();
		
		// WifiLock
		wifiLock = wifiMgr.createWifiLock(WifiManager.WIFI_MODE_FULL,"Lock");
		if (wifiLock.isHeld()) { wifiLock.release(); }
		wifiLock.acquire();
        
        // Listener: Telephony
		phoneListener = new RecvEventPhonecalls();  
	    telephonyMgr.listen(phoneListener, PhoneStateListener.LISTEN_CALL_STATE);
        
        // Stream url
        String stream_url = sett.getString("mediastreamer_streamUrl",null);
        
        // Check
        if (stream_url==null) { shutdown(); }
        if (stream_url==stream_url_active) { 
            Log.d(APPTAG," -> stream already running: "+ stream_url_active);
            return; 
        }
		
		// MediaPlayer
		if (mpMgr!=null) { mpMgr.destroy(); }
		mpMgr = new ObjMediaPlayerMgr(context, connMgr);
		mpMgr.init(stream_url);
        
        stream_url_active = stream_url;
		
	}
	
	// Shutdown
	
	private void shutdown() {
        
        Log.d(APPTAG," > shutdown()");

		// WifiLock OFF
		if (wifiLock!=null) { 
			if (wifiLock.isHeld()) {
				wifiLock.release();
			}
		}
        
        // WakeLock OFF
        if (wakelock.isHeld()) { wakelock.release(); }
		
		// Listeners
		try {
			Log.d(APPTAG,"  -> Stop listeners (telephony...)");
			telephonyMgr.listen(phoneListener, PhoneStateListener.LISTEN_NONE);
			} 
		catch (Exception e) { Log.w(APPTAG," -> NULLPOINTER EXCEPTION"); }
        
        // MediaPlayer
        if (mpMgr!=null) { 
			mpMgr.destroy(); 
			mpMgr = null;
        }
        
	}
	
	// --------------------------------------------------
	// Listeners
	
	// SetPhoneListener
	private class RecvEventPhonecalls extends PhoneStateListener {
		@Override
	    public void onCallStateChanged(int state, String incomingNumber) {
			
			// Hoi
			Log.i(APPTAG,"RecvEventPhonecalls (@MainService)");
			
			// Switch!
		    switch (state) {
			    case TelephonyManager.CALL_STATE_OFFHOOK:
			    case TelephonyManager.CALL_STATE_RINGING:
				    // Phone going offhook or ringing
			    	settEditor.putBoolean("wasPlayingWhenCalled",true);
			    	settEditor.commit();
			    	shutdown();
				    break;
			    case TelephonyManager.CALL_STATE_IDLE:
				    // Phone idle
			    	if (!sett.getBoolean("wasPlayingWhenCalled",false)) { return; }
			    	settEditor.putBoolean("wasPlayingWhenCalled",false);
			    	settEditor.commit();
			    	setup();
				    break;
		    }
		}
	}
	
	

}
































package com.rejh.cordova.mediastreamer;

import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.AudioManager.OnAudioFocusChangeListener;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.KeyEvent;

public class MediaStreamerService extends Service {

	@Override
	public IBinder onBind(Intent arg0) { return null; }
	
	// --- Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent serviceIntent;
	
	private AudioManager audioMgr;
	private RemoteControlReceiver remoteControlReceiver;
	private ComponentName remoteControlReceiverComponent;
	
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
        audioMgr = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        remoteControlReceiver = new RemoteControlReceiver();
        remoteControlReceiverComponent = new ComponentName(this, remoteControlReceiver.getClass());
		
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
	    
	    // Audio Focus
	    int result = audioMgr.requestAudioFocus(afChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
		
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
        
        // Audio Focus OFF
        audioMgr.abandonAudioFocus(afChangeListener);
		
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
	
	// On Audio Focus Change Listener
	OnAudioFocusChangeListener afChangeListener = new OnAudioFocusChangeListener() {
		
	    public void onAudioFocusChange(int focusChange) {
	    	Log.i(APPTAG,"MediaStreamerService.onAudioFocusChange()");
	        if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
	            // Pause playback
	        	Log.d(APPTAG," > LOSS_TRANSIENT, Pause playback");
	        	settEditor.putBoolean("wasPlayingWhenCalled",true);
		    	settEditor.commit();
		    	shutdown();
	        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
	            // Resume playback 
	        	Log.d(APPTAG," > AUDIOFOCUS_GAIN, Resume if possible");
	        	if (!sett.getBoolean("wasPlayingWhenCalled",false)) { return; }
	        	Log.d(APPTAG," >> Yes, resume");
		    	settEditor.putBoolean("wasPlayingWhenCalled",false);
		    	settEditor.commit();
		    	setup();
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
	            audioMgr.unregisterMediaButtonEventReceiver(remoteControlReceiverComponent);
	            audioMgr.abandonAudioFocus(afChangeListener);
	            // Stop playback
	            Log.d(APPTAG," > AUDIOFOCUS_LOSS, Stop playback");
	            settEditor.putBoolean("wasPlayingWhenCalled",false);
		    	settEditor.commit();
		    	shutdown();
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                // Lower the volume
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK");
	        	setVolumeDucked();	        	
            } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                // Raise it back to normal
            	Log.d(APPTAG," > AUDIOFOCUS_GAIN");
            	setVolumeFocusGained();
            }
	    }
	    
	    private void setVolumeDucked() {
	    	audioMgr.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, 5);
	    }
	    
	    private void setVolumeFocusGained() {
	    	audioMgr.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 5);
	    }
	    
	};
	
	// ------------------
	// INCLUDED BROADCAST RECEIVERS
	
	public class RemoteControlReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
        	
        	Log.d(APPTAG,"RemoteControlReceiver");
        	
        	// Stop if needed 
        	if (intent.getAction()==null) { return; }
            if (!intent.getAction().equals(Intent.ACTION_MEDIA_BUTTON)) { return; }
    		
            // Get key event
    		KeyEvent event = (KeyEvent)intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
            
    		// Event empty > return
    		if (event == null) {
    			Log.d(APPTAG,"event==null");
    		    return;
    		}
    		
    		int action = event.getAction();
    		if (action == KeyEvent.ACTION_UP) {
    			
    		    if (event.getKeyCode()==126 || event.getKeyCode()==127) { // Play/pause
    		    		
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
	
	

}
































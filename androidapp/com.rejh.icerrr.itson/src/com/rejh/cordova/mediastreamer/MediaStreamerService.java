package com.rejh.cordova.mediastreamer;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Timer;
import java.util.TimerTask;

import moz.http.HttpRequest;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.AudioManager.OnAudioFocusChangeListener;
import android.media.MediaMetadataRetriever;
import android.media.RemoteControlClient;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.StrictMode;
import android.os.StrictMode.ThreadPolicy;
import android.provider.Settings;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.example.android.musicplayer.RemoteControlClientCompat;
import com.example.android.musicplayer.RemoteControlHelper;

public class MediaStreamerService extends Service {

	@Override
	public IBinder onBind(Intent arg0) { return null; }
	
	// --- Variables
	
	final static String APPTAG = "MediaStreamer";
	
	private Context context;
	
	private String packageName;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private Intent serviceIntent;
	private Intent incomingIntent;
	
	private AudioManager audioMgr;
	
	public RemoteControlReceiver remoteControlReceiver;
	private ComponentName remoteControlReceiverComponent;
	
	public RemoteControlClientCompat remoteControlClient;
	
	private RemoteControlClientCompat.MetadataEditorCompat metadataEditor;
	
	private WifiManager wifiMgr;
	private WifiManager.WifiLock wifiLock;
	
	private ConnectivityManager connMgr;
	
	//private PowerManager powerMgr;
	//private PowerManager.WakeLock wakelock;
	
	private TelephonyManager telephonyMgr;
	private PhoneStateListener phoneListener;
	
	private ObjMediaPlayerMgr mpMgr;
	private MediaStreamerNotifMgr msNotifMgr;
    
    private String stream_url_active = null;
    
    private String station_id = "-1";
    private String station_name = "Unknown station";
    private String station_host = null;
    private String station_port = null;
    private String station_path = null;
    private String nowplaying = "Now playing: Unknown";
    
    private Thread nowPlayingPollThread;
    private Timer nowPlayingPollTimer;
    
    private boolean serviceIsRunning = false;
    
    int volumeBeforeDuck = -1;
	
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
		packageName = context.getPackageName();

        // Preferences
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
		
        // Others
		wifiMgr = (WifiManager) context.getSystemService(WIFI_SERVICE);
        connMgr = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
		// powerMgr = (PowerManager) getSystemService(Context.POWER_SERVICE);
        telephonyMgr = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
        audioMgr = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        
        remoteControlReceiver = new RemoteControlReceiver();
        remoteControlReceiverComponent = new ComponentName(this, remoteControlReceiver.getClass());
        audioMgr.registerMediaButtonEventReceiver(remoteControlReceiverComponent);
        
        Intent mediaButtonIntent = new Intent(Intent.ACTION_MEDIA_BUTTON);
        mediaButtonIntent.setComponent(remoteControlReceiverComponent);
        PendingIntent mediaPendingIntent = PendingIntent.getBroadcast(getApplicationContext(), 0, mediaButtonIntent, 0);
        remoteControlClient = new RemoteControlClientCompat(mediaPendingIntent);
        remoteControlClient.setTransportControlFlags(RemoteControlClient.FLAG_KEY_MEDIA_PLAY_PAUSE | RemoteControlClient.FLAG_KEY_MEDIA_STOP);
        RemoteControlHelper.registerRemoteControlClient(audioMgr,remoteControlClient);
		
		// Make sticky
		try {
			PackageManager packMgr = context.getPackageManager();
			ComponentName thisComponent = new ComponentName(context, MediaStreamerService.class);
			packMgr.setComponentEnabledSetting(thisComponent, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
		}
		catch(Exception e) { Log.e(APPTAG," -> MakeSticky Exception: "+e); }
		
		// Service running..
		settEditor.putBoolean("mediastreamer_serviceRunning", true);
		settEditor.putBoolean("is_paused", false);
		settEditor.commit();
	    
	    // Audio Focus
		int result = audioMgr.requestAudioFocus(afChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        
        // Listener: Telephony
		phoneListener = new RecvEventPhonecalls();  
	    telephonyMgr.listen(phoneListener, PhoneStateListener.LISTEN_CALL_STATE);
		
	}
	
	@Override
	public int onStartCommand (Intent intent, int flags, int startId) {
		
		if(intent!=null) { incomingIntent = intent; }
		
		// Cmds..
		boolean cmd_pause_resume = false;
		boolean cmd_pause = false;
		if(intent!=null) {
			
			if (intent.hasExtra("pause_resume")) { 
				cmd_pause_resume = intent.getBooleanExtra("pause_resume", false); 
			}
			if (intent.hasExtra("pause")) {
				cmd_pause = intent.getBooleanExtra("pause", false);
			}
			
			if (intent.hasExtra("station_id")) {
				
				// Get
				station_id = intent.getStringExtra("station_id");
				station_name = intent.getStringExtra("station_name");
				station_host = intent.getStringExtra("station_host");
				station_port = intent.getStringExtra("station_port");
				station_path = intent.getStringExtra("station_path");
				
				// Store
				try {
					JSONObject station = new JSONObject();
					station.put("station_id", station_id);
					station.put("station_name", station_name);
					station.put("station_host", station_host);
					station.put("station_port", station_port);
					station.put("station_path", station_path);
					String stations = station.toString();
					settEditor.putString("station_datas",stations);
					settEditor.commit();
				} catch(JSONException e) {
					Log.e(APPTAG," > Could not create station jsonobject: "+e);
				}
				
			}
			
		}
		
		// Check
		if (station_id.equals("-1")) {
			Log.e(APPTAG," > station_id == -1");
			// Restore
			String stations = sett.getString("station_datas", "{}");
			try {
				JSONObject station = new JSONObject(stations);
				station_id = station.getString("station_id");
				station_name = station.getString("station_name");
				station_host = station.getString("station_host");
				station_port = station.getString("station_port");
				station_path = station.getString("station_path");
			} catch(JSONException e) {
				Log.e(APPTAG," > Could not get station jsonobject: "+e);
				stopSelf();
				return 0;
			}
			// Check again..
			if (station_id==null) {
				Log.e(APPTAG," > station_id == null");
				stopSelf();
				return 0;
			}
			if (station_id.equals("-1")) {
				Log.e(APPTAG," > station_id == -1");
				stopSelf();
				return 0;
			}
			
		}
		
		// Override opts for notif
		JSONObject overrideOpts = new JSONObject();
		
		// Go
		boolean shouldEnableWifi = true;
		if (mpMgr!=null) {
			if (cmd_pause_resume && !sett.getBoolean("is_paused", false) || cmd_pause) { // pause
				Log.d(APPTAG," > cmd_pause_resume PAUSE!");
				settEditor.putBoolean("is_paused", true);
				settEditor.commit();
				mpMgr.pause();
				try {
					overrideOpts.put("actionPlayPauseIcon","ic_stat_av_play");
					overrideOpts.put("actionPlayPauseTitle","Play");
				} catch(Exception e) {}
				shouldEnableWifi = false;
				// audioMgr.abandonAudioFocus(afChangeListener);
			} else if (sett.getBoolean("is_paused", false)) { // resume
				Log.d(APPTAG," > cmd_pause_resume RESUME!");
				settEditor.putBoolean("is_paused", false);
				settEditor.commit();
				mpMgr.resume();
				int result = audioMgr.requestAudioFocus(afChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
			} else {
				Log.d(APPTAG," > cmd_pause_resume unhandled!");
			}
		} else {
			setup();
		}
		
		// Now playing + notification
		String nowplaying_tmp = (nowplaying!=null)?nowplaying:"Now playing: ...";
		if (msNotifMgr==null) { msNotifMgr = new MediaStreamerNotifMgr(context); }
		msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", nowplaying_tmp, msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
		startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
		
		// Now playing poll
		startNowPlayingPoll();
        
        // Metadata
        metadataEditor = remoteControlClient.editMetadata(true);
        metadataEditor.clear();
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, nowplaying_tmp);
        metadataEditor.putBitmap(100, getIcon("wear_album_art"));
        metadataEditor.apply();
        
        // Handle Wifi
        if (shouldEnableWifi) {
        	enableWifi();
        }
        
        // Store state 
        serviceIsRunning = true;
		
        // Return
		return START_STICKY;
		
	}
	
	// OnDestroy
	@Override
	public void onDestroy() {
		
		super.onDestroy();
		Log.i(APPTAG,"MediaStreamerService.OnDestroy");
		
		serviceIsRunning = false;
		
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
        
        // Bla
        settEditor.putBoolean("wasPlayingWhenCalled",false);
    	settEditor.commit();
		
		// Telephone Listener
		try {
			Log.d(APPTAG,"  -> Stop listeners (telephony...)");
			telephonyMgr.listen(phoneListener, PhoneStateListener.LISTEN_NONE);
			} 
		catch (Exception e) { Log.w(APPTAG," -> NULLPOINTER EXCEPTION"); }
		
		shutdown();
		
		stopNowPlayingPoll();
		
		if (msNotifMgr!=null) { msNotifMgr.cancel(-1); }
        
        // Stopped!
        if (remoteControlClient!=null) {
        	remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_STOPPED);
        }
        
        // Unreg remotecontrolclients and -receivers
        RemoteControlHelper.unregisterRemoteControlClient(audioMgr,remoteControlClient);
        audioMgr.unregisterMediaButtonEventReceiver(remoteControlReceiverComponent);
        
        // Handle Wifi
        disableWifi();
		
	}
	
	// --------------------------------------------------
	// Setup
	
	private void setup() {
		setup(false);
	}
	
	private void setup(boolean force) {
        
        Log.d(APPTAG," > setup()");
		
		// Wakelock
		//wakelock = powerMgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, APPTAG);
		//if (wakelock.isHeld()) { wakelock.release(); }
		//wakelock.acquire();
        
        // Stream url
	    String stream_url = null;
	    
	    // Is Alarm, stream_url and volume
	    boolean incomingIntentWasNull = false;
	    boolean isAlarm = false;
	    int volume = -1;
        if (incomingIntent!=null) {
        	// incomingIntent = this.getIntent(); // sett.getString("mediastreamer_streamUrl",null);
        	stream_url = incomingIntent.getStringExtra("stream_url");
        	isAlarm = incomingIntent.getBooleanExtra("isAlarm",false);
        	volume = incomingIntent.getIntExtra("volume", -1);
        	Log.d(APPTAG," > IsAlarmStr: "+ isAlarm);
        	settEditor.putString("mediastreamer_streamUrl",stream_url);
        	settEditor.putBoolean("isAlarm", isAlarm);
        	settEditor.commit();
        } else {
        	Log.d(APPTAG," > !incomingIntent");
        	stream_url = sett.getString("mediastreamer_streamUrl",null); // fallback
        	isAlarm = sett.getBoolean("isAlarm", false);
        	incomingIntentWasNull = true;
        }
        if (stream_url==null) {
        	Log.d(APPTAG," > !stream_url");
        	stream_url = sett.getString("mediastreamer_streamUrl",null); // fallback
        	isAlarm = sett.getBoolean("isAlarm", false);
        	incomingIntentWasNull = true;
        }
        
        // Check
        if (stream_url==null) { shutdown(); return; }
        if (stream_url==stream_url_active && !force && !incomingIntentWasNull) { 
            Log.d(APPTAG," -> stream already running: "+ stream_url_active);
            return; 
        }
        
        // Volume
        if (volume>-1) {
        	Log.d(APPTAG," > Volume: "+volume);
        	setVolume(volume);
        } else if (isAlarm && volume<0) {
        	setVolume(5);
        }
		settEditor.putBoolean("is_paused", false);
		settEditor.commit();
		
		// MediaPlayer
		if (mpMgr!=null) { mpMgr.destroy(); }
		mpMgr = new ObjMediaPlayerMgr(context, connMgr, wifiMgr, this);
		mpMgr.init(stream_url,isAlarm);
        
        stream_url_active = stream_url;
		
	}
	
	// Shutdown
	
	private void shutdown() {
        
        Log.d(APPTAG," > shutdown()");
        
        Log.d(APPTAG," >> In foreground: "+ isServiceRunningInForeground(MediaStreamerService.class));
        
        // WakeLock OFF
        // if (wakelock.isHeld()) { wakelock.release(); }
        
        // Wifi
        disableWifi();
        
        // MediaPlayer
        if (mpMgr!=null) { 
			mpMgr.destroy(); 
			mpMgr = null;
        }
        
        // Settings
        settEditor.putString("mediastreamer_streamUrl",null);
        settEditor.putBoolean("isAlarm", false);
        settEditor.putBoolean("is_paused", false);
    	settEditor.commit();
        
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
			    	settEditor.putBoolean("wasPlayingWhenCalled",false);
			    	settEditor.commit();
			    	if (!isServiceRunning(MediaStreamerService.class)) { return; }
			    	if (!sett.getBoolean("wasPlayingWhenCalled",false)) { return; }
			    	setup();
				    break;
		    }
		}
	}
	
	// On Audio Focus Change Listener
	OnAudioFocusChangeListener afChangeListener = new OnAudioFocusChangeListener() {
		
	    public void onAudioFocusChange(int focusChange) {
	    	Log.i(APPTAG,"MediaStreamerService.onAudioFocusChange(): "+ focusChange);
	        if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
	            
	        	// Pause playback
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS_TRANSIENT()");
	        	
	        	settEditor.putBoolean("wasPlayingWhenCalled",true);
		    	settEditor.commit();
		    	shutdown();
		    	
	        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
	        	
	            // Resume playback 
	        	Log.d(APPTAG," > AUDIOFOCUS_GAIN()");
	        	
	        	if (sett.getBoolean("wasPlayingWhenCalled",false) && isServiceRunning(MediaStreamerService.class)) {
	        		Log.d(APPTAG," >> Resume playback");
	        		settEditor.putBoolean("wasPlayingWhenCalled",false);
	        		settEditor.commit();
	        		setup(true);
	        	} else if (sett.getBoolean("volumeHasDucked", false) && isServiceRunning(MediaStreamerService.class)) {
	        		Log.d(APPTAG," >> Volume++");
	        		settEditor.putBoolean("volumeHasDucked",false);
	        		settEditor.commit();
	        		setVolumeFocusGained();
	        	} else if (sett.getBoolean("is_paused", false)) {
	        		Log.d(APPTAG," >> Resume playback (from paused)");
	        		settEditor.putBoolean("is_paused", false);
					settEditor.commit();
					mpMgr.resume();
	        	}
	        	
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
	            
	            // Stop playback
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS()");
	        	
	        	/*
	            settEditor.putBoolean("wasPlayingWhenCalled",false);
		    	settEditor.commit();
		    	
		    	Log.d(APPTAG," > Destroy self");
		    	stopSelf();
		    	/**/
	        	
	        	Log.d(APPTAG," > Pause the stream!");
	        	settEditor.putBoolean("is_paused", true);
				settEditor.commit();
				mpMgr.pause();
		    	
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
	        	
                // Lower the volume
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK()");
	        	Log.d(APPTAG," >> Volume--");
	        	settEditor.putBoolean("volumeHasDucked",true);
        		settEditor.commit();
	        	setVolumeDucked();
	        	
            }
	    }
	    
	    private void setVolumeDucked() {
	    	volumeBeforeDuck = audioMgr.getStreamVolume(AudioManager.STREAM_MUSIC);
	    	int levelsDown = 5;
	    	if (volumeBeforeDuck<=5) { levelsDown = volumeBeforeDuck-1; }
	    	Log.d(APPTAG," > setVolumeDucked, from "+ volumeBeforeDuck +" go to "+ (volumeBeforeDuck-levelsDown));
	    	for (int i=0; i<levelsDown; i++) {
	    		audioMgr.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE);
	    	}
	    }
	    
	    private void setVolumeFocusGained() {
	    	int levelsUp = 5;
	    	int volumeNow = audioMgr.getStreamVolume(AudioManager.STREAM_MUSIC);
	    	if (volumeBeforeDuck<=levelsUp+volumeNow) { levelsUp = (volumeBeforeDuck-volumeNow); }
	    	Log.d(APPTAG," > setVolumeFocusGained, from "+ volumeNow +" go to "+ (volumeNow+levelsUp));
	    	for (int i=0; i<levelsUp; i++) {
	    		audioMgr.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE);
	    	}
	    }
	    
	};
	
	// ------------------
	// THREAD: Get now playing info...
	
	private void startNowPlayingPoll() {
		if (nowPlayingPollTimer!=null) { stopNowPlayingPoll(); }
		nowPlayingPollTimer = new Timer();
		nowPlayingPollTimer.scheduleAtFixedRate( new TimerTask() {
			public void run() {
				
				runNowPlayingPoll();
				
			}
		}, 5*1000, 1*60*1000); // every ~minute
	}
	
	private void stopNowPlayingPoll() {
		if (nowPlayingPollTimer!=null) { nowPlayingPollTimer.cancel(); }
		nowPlayingPollTimer = null;
	}
	
	private void runNowPlayingPoll() {
		nowPlayingPollThread = new Thread(new Runnable(){
			@Override
			public void run(){
				
				String url = "http://rejh.nl/icerrr/api/?a=get&q={"
						+"\"get\":\"station_info\","
						+"\"station_id\":\""+station_id+"\","
						+"\"station_host\":\""+station_host+"\","
						+"\"station_port\":\""+station_port+"\","
						+"\"station_path\":\""+station_path+"\""
						+"}";
				
				Log.d(APPTAG," > NowPlayingPoll: "+ url);
				String jsons = "{}";
				try {
					jsons = HttpRequest.get(url).content;
				} catch(Exception e) {
					Log.e(APPTAG," > Error running httprequest: "+e,e);
					e.printStackTrace();
					return;
				}
				
				if (jsons==null) { 
					Log.e(APPTAG," > jsons==null, quit thread");
					return; 
				}
				
				try {
					
					JSONObject json = new JSONObject(jsons);
					
					String nowplaying_new = nowplaying;
					if (json.has("error")) {
						Log.e(APPTAG," > Error running nowPlayingPoll:"+ json.getString("errormsg"));
						nowplaying_new = "Now playing: Unknown";
					} else {
						nowplaying_new = json.getJSONObject("data").getString("nowplaying");
						if (nowplaying_new==null || nowplaying_new=="null") { 
							Log.w(APPTAG," > Nowplaying == null");
							nowplaying_new = "Now playing: Unknown"; 
						}
					}
					
					if (!nowplaying_new.equals(nowplaying) && serviceIsRunning) {
						
						nowplaying = nowplaying_new;
						Log.d(APPTAG," > NowPlaying: "+ station_name +", "+ nowplaying);
						msNotifMgr.notif(station_name,nowplaying,msNotifMgr.NOTIFICATION_ID,false);
				        
				        // Metadata
						metadataEditor = remoteControlClient.editMetadata(true);
				        metadataEditor.clear();
				        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
				        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, nowplaying_new);
				        metadataEditor.putBitmap(100, getIcon("wear_album_art"));
				        metadataEditor.apply();
						
					}
					
					
				} catch(JSONException e) {
					Log.e(APPTAG," > runNowPlayingPoll.JSONException!",e);
					e.printStackTrace();
				} catch(Exception e) {
					Log.e(APPTAG," > runNowPlayingPoll.Exception!",e);
					e.printStackTrace();
				}
			}
		});
		nowPlayingPollThread.start();
	}
	
	// --------------------------------------------------
	// METHODS
	
	// --- Turn on wifi
	private void enableWifi() {
		
		Log.d(APPTAG,"enableWifi()");
		
		// Check airplane mode
		if (isAirplaneModeOn(context)) {
			Log.w(APPTAG," > Airplane mode is detected. DO NOT TOUCH WIFI");
			return;
		}
        
		// Is Alarm?
		boolean isAlarm = false;
		if (incomingIntent!=null) {
        	isAlarm = incomingIntent.getBooleanExtra("isAlarm",false);
		}
		
		// WifiLock
		wifiLock = wifiMgr.createWifiLock(WifiManager.WIFI_MODE_FULL,"Lock");
		if (wifiLock.isHeld()) { wifiLock.release(); }
		wifiLock.acquire();
		
        // Wifi
        Log.d(APPTAG," > WifiState: "+ wifiMgr.isWifiEnabled());
		settEditor.putBoolean("wifiStateOnSetup",wifiMgr.isWifiEnabled());
        if (isAlarm || sett.getBoolean("useWifi", true) && !serviceIsRunning) {
        	Log.d(APPTAG," >> Turn on...");
        	settEditor.putBoolean("wifiIsToggled", true);
        	settEditor.commit();
			wifiMgr.setWifiEnabled(true);
        } else {
        	Log.d(APPTAG," >> Do nothing...");
        	settEditor.putBoolean("wifiIsToggled", false);
        	settEditor.commit();
        }
		
	}
	
	private void disableWifi() {
		
		Log.d(APPTAG,"disableWifi()");

		// WifiLock OFF
		if (wifiLock!=null) { 
			if (wifiLock.isHeld()) {
				wifiLock.release();
			}
		}
        
        // WakeLock OFF
        // if (wakelock.isHeld()) { wakelock.release(); }
    	
        // Wifi
        Log.d(APPTAG," > WifiIsToggled: "+ sett.getBoolean("wifiIsToggled", false));
    	Log.d(APPTAG," > WifiState stored: "+ sett.getBoolean("wifiStateOnSetup",false));
    	if (sett.getBoolean("wifiIsToggled", false) && !sett.getBoolean("wifiStateOnSetup",false)) {
    		Log.w(APPTAG," > Turn wifi off...");
    		wifiMgr.setWifiEnabled(false);
    	}
		
	}
    
    // --- SetVolume
	private void setVolume(int volume) {
		
		// SCALE :: 0 - 10
		
		boolean allowdown = true;
        
        // Check arguments
        
        int setvol = volume;
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		
		float maxvol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
		float curvol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
		float targvol = Math.round((setvol*maxvol)/10);
		int difvol = Math.round(targvol-curvol);
		
		if (allowdown) {
			if (curvol>targvol) { Log.d(APPTAG,"ChangedVolume: --"); for (int ivol=0; ivol>difvol; ivol--) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, 1); } }
			if (curvol<targvol) { Log.d(APPTAG,"ChangedVolume: ++"); for (int ivol=0; ivol<difvol; ivol++) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 1); } }
			}
		else {
			Log.d(APPTAG,"ChangedVolume: ++ (upOnly)");
			for (int ivol=0; ivol<difvol; ivol++) { audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, 1); }
			}
		
		Log.d(APPTAG,"ChangedVolume: set:"+setvol+" --> max:"+maxvol+", cur:"+curvol+", dif:"+difvol);
		
	}
	
	// --- Service running
	private boolean isServiceRunning(Class<?> serviceClass) {
	    ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            return true;
	        }
	    }
	    return false;
	}
	
	// --- Service running
	private boolean isServiceRunningInForeground(Class<?> serviceClass) {
	    ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
	    for (RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
	        if (serviceClass.getName().equals(service.service.getClassName())) {
	            return service.foreground;
	        }
	    }
	    return false;
	}
	

    
    // > Icons
    // Ripped from LocalNotification plugin: https://github.com/katzer/cordova-plugin-local-notifications/blob/master/src/android/Options.java
    
    private Bitmap getIcon (String icon) {
        Bitmap bmp = null;

        if (icon.startsWith("http")) {
            bmp = getIconFromURL(icon);
        } else if (icon.startsWith("file://")) {
            bmp = getIconFromURI(icon);
        }

        if (bmp == null) {
            bmp = getIconFromRes(icon);
        }

        return bmp;
    }
    
    private int getSmallIcon (String iconName) {
        int resId       = 0;

        resId = getIconValue(packageName, iconName);

        if (resId == 0) {
            resId = getIconValue("android", iconName);
        }

        if (resId == 0) {
            resId = getIconValue(packageName, "icon");
        }

        return resId;
    }
    
    private int getIconValue (String className, String iconName) {
        int icon = 0;

        try {
            Class<?> klass  = Class.forName(className + ".R$drawable");

            icon = (Integer) klass.getDeclaredField(iconName).get(Integer.class);
        } catch (Exception e) {}

        return icon;
    }
    
    private Bitmap getIconFromURL (String src) {
        Bitmap bmp = null;
        ThreadPolicy origMode = StrictMode.getThreadPolicy();

        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            StrictMode.ThreadPolicy policy =
                    new StrictMode.ThreadPolicy.Builder().permitAll().build();

            StrictMode.setThreadPolicy(policy);

            connection.setDoInput(true);
            connection.connect();

            InputStream input = connection.getInputStream();

            bmp = BitmapFactory.decodeStream(input);
        } catch (Exception e) {
        	Log.e(APPTAG," > getIconURL error",e);
            e.printStackTrace();
        }

        StrictMode.setThreadPolicy(origMode);

        return bmp;
    }
    
    private Bitmap getIconFromRes (String icon) {
        Resources res = context.getResources();
        int iconId = 0;

        iconId = getIconValue(packageName, icon);

        if (iconId == 0) {
            iconId = getIconValue("android", icon);
        }

        if (iconId == 0) {
            iconId = android.R.drawable.ic_menu_info_details;
        }

        Bitmap bmp = BitmapFactory.decodeResource(res, iconId);

        return bmp;
    }
    
    private Bitmap getIconFromURI (String src) {
        AssetManager assets = context.getAssets();
        Bitmap bmp = null;

        try {
            String path = src.replace("file:/", "www");
            InputStream input = assets.open(path);

            bmp = BitmapFactory.decodeStream(input);
        } catch (IOException e) {
        	Log.e(APPTAG," > IOException",e);
            e.printStackTrace();
        }

        return bmp;
    }
    
    // > Airplane mode
    
    private static boolean isAirplaneModeOn(Context context) {
	    return Settings.System.getInt(context.getContentResolver(),
	            Settings.System.AIRPLANE_MODE_ON, 0) != 0;
    }
	
	

}
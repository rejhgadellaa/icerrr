package com.rejh.cordova.mediastreamer;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Timer;
import java.util.TimerTask;

import moz.http.HttpRequest;

import org.json.JSONArray;
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
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.AudioManager.OnAudioFocusChangeListener;
import android.media.MediaMetadataRetriever;
import android.media.RemoteControlClient;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.Environment;
import android.os.IBinder;
import android.os.StrictMode;
import android.os.StrictMode.ThreadPolicy;
import android.provider.Settings;
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
	public WifiManager.WifiLock wifiLock;
	
	private ConnectivityManager connMgr;

	// TODO: DEPRECATED
	//private PowerManager powerMgr;
	//private PowerManager.WakeLock wakelock;
	
	// TODO: DEPRECATED
	//private TelephonyManager telephonyMgr;
	//private PhoneStateListener phoneListener;
	
	private ObjMediaPlayerMgr mpMgr;
	private MediaStreamerNotifMgr msNotifMgr;
    
    private String stream_url_active = null;
    
    private boolean isAlarm;
    
    public String station_id = "-1";
    private String station_name = "Unknown station";
    private String station_host = null;
    private String station_port = null;
    private String station_path = null;
    private String nowplaying = "...";
    
    private Thread nowPlayingPollThread;
    private Timer nowPlayingPollTimer;
    
    private boolean serviceIsRunning = false;
    
    private int lastFocusState = -1;
    private int volumeBeforeDuck = -1;
    
    private int mediaType = -1;
    
    private String[] illchars = {"!","@","#","$","%","^","&","*","+","=","[","]","{","}","'","\"","<",">",",","?","|"}; 
	
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
        audioMgr = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        
        // Wifilock (because mediaplayer only does wakelock)
        wifiLock = wifiMgr.createWifiLock(WifiManager.WIFI_MODE_FULL , "IcerrrWifiLock");
        if(!wifiLock.isHeld()){
            wifiLock.acquire();
        }
        
        // Remote Control Receiver
        remoteControlReceiver = new RemoteControlReceiver();
        remoteControlReceiverComponent = new ComponentName(this, remoteControlReceiver.getClass());
        
        // Deprecated in api level 21..
        audioMgr.registerMediaButtonEventReceiver(remoteControlReceiverComponent);
        
        // More
        Intent mediaButtonIntent = new Intent(Intent.ACTION_MEDIA_BUTTON);
        mediaButtonIntent.setComponent(remoteControlReceiverComponent);
        PendingIntent mediaPendingIntent = PendingIntent.getBroadcast(getApplicationContext(), 0, mediaButtonIntent, 0);
        remoteControlClient = new RemoteControlClientCompat(mediaPendingIntent);
        remoteControlClient.setTransportControlFlags(RemoteControlClient.FLAG_KEY_MEDIA_PLAY_PAUSE | RemoteControlClient.FLAG_KEY_MEDIA_STOP | RemoteControlClient.FLAG_KEY_MEDIA_NEXT | RemoteControlClient.FLAG_KEY_MEDIA_PREVIOUS);
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
		
	}
	
	@Override
	public int onStartCommand (Intent intent, int flags, int startId) {
		
		Log.i(APPTAG,"MediaStreamerService.onStartCommand");

        // Preferences, reload it because we're running in another process..
        sett = context.getSharedPreferences(APPTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
		
		if(intent!=null) { incomingIntent = intent; }
		
		// Cmds..
		boolean cmd_alarm = false;
		boolean cmd_pause_resume = false;
		boolean cmd_pause = false;
		boolean cmd_next = false;
		boolean cmd_prev = false;
		boolean cmd_next_restart_intent = false;
		boolean cmd_update_metadata = false;
		if(intent!=null) {
			
			if (intent.hasExtra("alarm")) {
				cmd_alarm = intent.getBooleanExtra("alarm", false); 
			}
			if (intent.hasExtra("pause_resume")) { 
				cmd_pause_resume = intent.getBooleanExtra("pause_resume", false); 
			}
			if (intent.hasExtra("pause")) {
				cmd_pause = intent.getBooleanExtra("pause", false);
			}
			if (intent.hasExtra("next")) {
				cmd_next = intent.getBooleanExtra("next", false);
			}
			if (intent.hasExtra("prev")) {
				cmd_prev = intent.getBooleanExtra("prev", false);
			}
			if (intent.hasExtra("next_restart_intent")) {
				cmd_next_restart_intent = true;
			}
			if (intent.hasExtra("update_metadata")) {
				cmd_update_metadata = true;
				nowplaying = "...";
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
					settEditor.putString("currentstation_id", station_id);
					settEditor.commit();
				} catch(JSONException e) {
					Log.e(APPTAG," > Could not create station jsonobject: "+e);
					settEditor.putString("currentstation_id", null);
					settEditor.commit();
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
			settEditor.putString("currentstation_id", station_id);
			settEditor.commit();
			
		}
		
		// Override opts for notif
		JSONObject overrideOpts = new JSONObject();
		
		// Go
		boolean shouldEnableWifi = true;
		if (mpMgr!=null && !cmd_next_restart_intent) {
			if (cmd_alarm) { // handle alarm when other stream is already active..
				try {
					Log.d(APPTAG," > cmd_alarm && mpMgr!=null!");
					String starredStationsJsons = sett.getString("starredStations", "[]");
					JSONArray starredStations = new JSONArray(starredStationsJsons);
					JSONObject starredStation = starredStations.getJSONObject(sett.getInt("starredStationsIndex", 0));
					isAlarm = true;
					restartServiceWithStation(starredStation);
				} catch(JSONException e) {
					Log.e(APPTAG,"MediaStreamerService.onStartCommand().JSONException handling cmd_alarm: "+e,e);
				}
			}
			if (cmd_pause_resume && !sett.getBoolean("is_paused", false) || cmd_pause) { // pause
				Log.d(APPTAG," > cmd_pause_resume PAUSE!");
				settEditor.putBoolean("is_paused", true);
				settEditor.commit();
				sendBroadcastSLS(nowplaying,3);
				mpMgr.pause();
				nowplaying = "...";
				try {
					overrideOpts.put("actionPlayPauseIcon","ic_stat_av_play");
					overrideOpts.put("actionPlayPauseTitle","Play");
				} catch(Exception e) {}
				shouldEnableWifi = false;
				// audioMgr.abandonAudioFocus(afChangeListener);
			} else if (cmd_pause_resume && sett.getBoolean("is_paused", false)) { // resume
				Log.d(APPTAG," > cmd_pause_resume RESUME!");
				settEditor.putBoolean("is_paused", false);
				settEditor.commit();
				sendBroadcastSLS(nowplaying,0);
				mpMgr.resume();
				nowplaying = "...";
				// int result = audioMgr.requestAudioFocus(afChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
				int mediaType = (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) ? AudioManager.STREAM_ALARM : AudioManager.STREAM_MUSIC;
				int result = audioMgr.requestAudioFocus(afChangeListener, mediaType, AudioManager.AUDIOFOCUS_GAIN);
				if (mediaType==AudioManager.STREAM_ALARM) {
					Log.e(APPTAG," > Mediatype: ALARM");
				} else {
					Log.e(APPTAG," > Mediatype: MEDIA");
				}
			} else if (cmd_next) {
				
				try {
					
					// Get stations
					String starredStationsJsons = sett.getString("starredStations", "[]");
					JSONArray starredStations = new JSONArray(starredStationsJsons);
					
					// Get index
					int index = sett.getInt("starredStationsIndex", -1);
					index += 1;
					if (index>=starredStations.length()) { index = 0; }
					settEditor.putInt("starredStationsIndex",index);
					settEditor.commit();
					
					// Get station
					JSONObject station = starredStations.getJSONObject(index);
					
					// Log
					Log.d(APPTAG," > Cmd_next: "+ index +", "+ station.getString("station_name"));
					
					// Stop!
					// stopSelf();
					restartServiceWithStation(station);
			        
			        return START_STICKY;
					
				} catch (JSONException e) {
					Log.e(APPTAG," > Error handling 'cmd_next', JSONException",e);
				}
				
			} else if (cmd_prev) {
				
				try {
					
					// Get stations
					String starredStationsJsons = sett.getString("starredStations", "[]");
					JSONArray starredStations = new JSONArray(starredStationsJsons);
					
					// Get index
					int index = sett.getInt("starredStationsIndex", -1);
					index -= 1;
					if (index<0) { index = starredStations.length()-1; }
					settEditor.putInt("starredStationsIndex",index);
					settEditor.commit();
					
					// Get station
					JSONObject station = starredStations.getJSONObject(index);
					
					// Log
					Log.d(APPTAG," > Cmd_prev: "+ index +", "+ station.getString("station_name"));
					
					// Stop!
					// stopSelf();
					restartServiceWithStation(station);
			        
			        return START_STICKY;
					
				} catch (JSONException e) {
					Log.e(APPTAG," > Error handling 'cmd_prev', JSONException",e);
				}
				
			} else {
				Log.d(APPTAG," > cmd(_pause_resume) unhandled?!");
				//settEditor.putInt("starredStationsIndex",-1); // reset some values..
				//settEditor.commit();
			}
		} else {
			boolean setupOkay = setup();
			if (!setupOkay) {
				Log.w(APPTAG," > !setupOkay, shutdown..");
				stopSelf();
				return 0;
			}
		}
		
		// Now playing + notification
		//String nowplaying_tmp = (nowplaying!=null)?nowplaying:"Now playing: ...";

		if (!cmd_update_metadata) { //-> Actually does more than update metadata, it updates notif too ;)
			
			if (isAlarm) {
				try {
				overrideOpts.put("actionPlayPauseIsSnooze",true);
				} catch(JSONException e) {
					Log.e(APPTAG,"JSONException: "+e, e);
				}
			}
			if (msNotifMgr==null) { msNotifMgr = new MediaStreamerNotifMgr(context); }
			msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", "Now playing: ...", msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
			startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
        
        // Metadata
	        metadataEditor = remoteControlClient.editMetadata(true);
	        metadataEditor.clear();
	        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
	        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, "Now playing: ...");
	        Bitmap bmp = getStationImage(getStationData()); // -> Bitmap
	        if (bmp!=null) {
	        	metadataEditor.putBitmap(100, bmp);
	        } else {
	        	metadataEditor.putBitmap(100, getIcon("bg_home_default"));
			}
	        metadataEditor.apply();
	        
		}
		
		// Now playing poll
		startNowPlayingPoll();
        
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
		
		// Scrob?
		sendBroadcastSLS(nowplaying,3);
		
		// Store some values
		settEditor.putString("currentstation_id", null);
		settEditor.putBoolean("mediastreamer_serviceRunning", false);
		settEditor.commit();
        
        // Audio Focus OFF
        audioMgr.abandonAudioFocus(afChangeListener);
        
        // Bla
        settEditor.putBoolean("wasPlayingWhenCalled",false);
    	settEditor.commit();
		
		shutdown();
		
		stopNowPlayingPoll();
		
		if (msNotifMgr!=null) { msNotifMgr.cancel(-1); }
        
        // Stopped!
        if (remoteControlClient!=null) {
        	remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_STOPPED);
        }
        
        // Unreg remotecontrolclients and -receivers
        RemoteControlHelper.unregisterRemoteControlClient(audioMgr,remoteControlClient);
        
        // Deprecated:
        audioMgr.unregisterMediaButtonEventReceiver(remoteControlReceiverComponent);
        
        // Release wifi lock
        if(wifiLock.isHeld()){
            wifiLock.release();
        }
        
        // Handle Wifi
        disableWifi();
		
	}
	
	// --------------------------------------------------
	// Setup
	
	private boolean setup() {
		return setup(false);
	}
	
	private boolean setup(boolean force) {
        
        Log.d(APPTAG," > setup()");
        
        // Stream url
	    String stream_url = null;
	    
	    // Is Alarm, stream_url and volume
	    boolean incomingIntentWasNull = false;
	    isAlarm = false;
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
		
		// Setting: alarm
		settEditor.putBoolean("isAlarm", isAlarm);
		settEditor.commit();
        
        // Check
        if (stream_url==null) { shutdown(); return false; }
        if (stream_url==stream_url_active && !force && !incomingIntentWasNull) { 
            Log.d(APPTAG," -> stream already running: "+ stream_url_active);
            return true; 
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
	    
	    // Audio Focus
		int mediaType = (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) ? AudioManager.STREAM_ALARM : AudioManager.STREAM_MUSIC;
		int result = audioMgr.requestAudioFocus(afChangeListener, mediaType, AudioManager.AUDIOFOCUS_GAIN);
		if (mediaType==AudioManager.STREAM_ALARM) {
			Log.e(APPTAG," > Mediatype: ALARM");
		} else {
			Log.e(APPTAG," > Mediatype: MEDIA");
		}
		
		// MediaPlayer
		if (mpMgr!=null) { mpMgr.destroy(); }
		mpMgr = new ObjMediaPlayerMgr(context, connMgr, wifiMgr, this);
		mpMgr.init(stream_url,isAlarm);
        
        stream_url_active = stream_url;
        
        return true;
		
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
	
	// On Audio Focus Change Listener
	OnAudioFocusChangeListener afChangeListener = new OnAudioFocusChangeListener() {
		
	    public void onAudioFocusChange(int focusChange) {
	    	Log.i(APPTAG,"MediaStreamerService.onAudioFocusChange(): "+ focusChange);
	    	
	    	// GAIN
	        if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
	        	
	        	Log.d(APPTAG," > AUDIOFOCUS_GAIN");
	        	
	        	// Was ducked
	        	if (sett.getBoolean("volumeHasDucked", false)) {
	        		
	        		Log.d(APPTAG," >> Volume++ (was ducked)");
	        		settEditor.putBoolean("volumeHasDucked",false);
	        		settEditor.commit();
	        		setVolumeFocusGained();
	        	
	        	// Was paused
	        	} else if (sett.getBoolean("is_paused", false)) {
	        		
	        		// LastFocusState was LOSS_TRANSIENT so resume playback :D
	        		if (lastFocusState==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
		        		Log.d(APPTAG," >> Resume playback (from paused)");
		        		sendBroadcastSLS(nowplaying,lastnpverified,1);
						mpMgr.resume();
	        		} else {
	        			Log.d(APPTAG," >> Do not resume playback, keep notification");
	        		}
	        		
	        		// Reset flags
	        		settEditor.putBoolean("is_paused", false);
					settEditor.commit();
					
	        	}
				
				// Update notifif (isAlarm) {
	        	JSONObject overrideOpts = new JSONObject();
	        	if (isAlarm) {
	        		try {
					overrideOpts.put("actionPlayPauseIsSnooze",true);
					} catch(JSONException e) {
						Log.e(APPTAG,"JSONException: "+e, e);
					}
				}
				msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", nowplaying, msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
				startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
	        	
	        // LOSS_TRANSIENT && LOSS (in case of loss we still want to hold on to the notification)
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT || focusChange == AudioManager.AUDIOFOCUS_LOSS) {
	            
	            // Stop playback
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS");
	        	
	        	Log.d(APPTAG," > Pause the stream!");
	        	settEditor.putBoolean("is_paused", true);
				settEditor.commit();
				sendBroadcastSLS(nowplaying,lastnpverified,2);
				mpMgr.pause();
				
				// Update notif
				JSONObject overrideOpts = new JSONObject();
				try {
					overrideOpts.put("actionPlayPauseIcon","ic_stat_av_play");
					overrideOpts.put("actionPlayPauseTitle","Play");
				} catch(Exception e) {}
				msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", nowplaying, msNotifMgr.NOTIFICATION_ID,false,overrideOpts);
		    	
			// DUCK
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
	        	
                // Lower the volume
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK()");
	        	Log.d(APPTAG," >> Volume--");
	        	settEditor.putBoolean("volumeHasDucked",true);
        		settEditor.commit();
	        	setVolumeDucked();
	        	
            }
	        
	        // Remember focusState
	        lastFocusState = focusChange;
	        
	    }
	    
	    private void setVolumeDucked() {
	    	if (isAlarm) { return; } // dont duck alarms
	    	if (volumeBeforeDuck>0) { return; } // already ducked
	    	volumeBeforeDuck = audioMgr.getStreamVolume(AudioManager.STREAM_MUSIC);
	    	// TODO: DEPRECATED ?
	    	int levelsDown = 7;
	    	float newVolume = 0.25f; // (volumeBeforeDuck-levelsDown)>=0 ? volumeBeforeDuck-levelsDown : 0;
	    	Log.d(APPTAG," > setVolumeDucked, from "+ volumeBeforeDuck +" go to "+ newVolume +", calced: "+ (volumeBeforeDuck-levelsDown));
	    	// -> Set volume for realz
	    	Log.d(APPTAG," >> "+ mpMgr.setVolume(newVolume) );
	    	// audioMgr.setStreamVolume(AudioManager.STREAM_MUSIC, volumeBeforeDuck-levelsDown, AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE);
	    }
	    
	    private void setVolumeFocusGained() {
	    	if (isAlarm) { return; } // dont duck alarms
	    	if (volumeBeforeDuck<0) { return; } // not ducked
	    	// TODO: DEPRECATED ?
	    	int levelsUp = 7;
	    	int volumeNow = audioMgr.getStreamVolume(AudioManager.STREAM_MUSIC);
	    	//if (volumeBeforeDuck<=levelsUp+volumeNow) { levelsUp = (volumeBeforeDuck-volumeNow); } // WHAT WAS I THINKING?
	    	Log.d(APPTAG," > setVolumeFocusGained, from "+ volumeNow +" go to "+ (volumeBeforeDuck) +", calced: "+ (volumeNow+levelsUp));
	    	// -> Set volume for realz
	    	Log.d(APPTAG," >> "+ mpMgr.setVolume(1.0f) );
	    	// audioMgr.setStreamVolume(AudioManager.STREAM_MUSIC, volumeBeforeDuck, AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE);
	    	volumeBeforeDuck = -1; // reset duck
	    }
	    
	};
	
	// ------------------
	// THREAD: Get now playing info...
	
	public void startNowPlayingPoll() {
		int interval = !(sett.getBoolean("is_paused",false)) ? (int)1*60*1000 : (int)3*60*1000; // interval depends on play state..
		Log.e(APPTAG,"startNowPlayingPoll: "+ interval);
		if (nowPlayingPollTimer!=null) { stopNowPlayingPoll(); }
		nowPlayingPollTimer = new Timer();
		nowPlayingPollTimer.scheduleAtFixedRate( new TimerTask() {
			public void run() {
				
				runNowPlayingPoll();
				
			}
		}, 1*1000, (int)interval); // every ~minute
	}
	
	public void stopNowPlayingPoll() {
		if (nowPlayingPollTimer!=null) { nowPlayingPollTimer.cancel(); }
		nowPlayingPollTimer = null;
	}
	
	private void runNowPlayingPoll() {
		Log.d(APPTAG," > runNowPlayingPoll()");
		nowPlayingPollThread = new Thread(new Runnable(){
			@Override
			public void run(){
				
				// Url, query
				String url = "http://rejh.nl/icerrr/api/?a=get&q=";
				String query = "{"
						+"\"get\":\"station_info\","
						+"\"station_id\":\""+station_id+"\","
						+"\"station_host\":\""+station_host+"\","
						+"\"station_port\":\""+station_port+"\","
						+"\"station_path\":\""+station_path+"\""
						+"}";
				
				// Encode query
				try {
					query = URLEncoder.encode(query, "UTF-8");
				} catch(UnsupportedEncodingException e) {
					Log.e(APPTAG," -> URLEncoder failed: "+e,e);
				}
				
				// Combine
				url = url + query;
				Log.d(APPTAG," > NowPlayingPoll: "+ url);
				
				// Go
				String jsons = "{}";
				try {
					jsons = HttpRequest.get(url).content;
				} catch(Exception e) {
					Log.e(APPTAG," > Error running httprequest: "+e,e);
					//e.printStackTrace();
					return;
				}
				
				if (jsons==null) { 
					Log.e(APPTAG," > jsons==null, quit thread");
					return; 
				}
				
				// Received json, let's check it out
				try {
					
					JSONObject json = new JSONObject(jsons);
					
					// Get now playing, check if new
					String nowplaying_new = nowplaying;
					if (json.has("error")) {
						Log.e(APPTAG," > Error running nowPlayingPoll:"+ json.getString("errormsg"));
						nowplaying_new = "Now playing: Unknown";
					} else {
						nowplaying_new = json.getJSONObject("data").getString("nowplaying");
						if (nowplaying_new==null) { 
							Log.w(APPTAG," > Nowplaying == null");
							nowplaying_new = "Now playing: Unknown"; 
						} else if (nowplaying_new.equals("null") || nowplaying_new.equals("")) {
							Log.w(APPTAG," > Nowplaying == 'null' or ''");
							nowplaying_new = "Now playing: Unknown"; 
						}
					}
					nowplaying_new = nowplaying_new.replace("&", " & ");
					nowplaying_new = nowplaying_new.replace("  ", " ");
					nowplaying_new = nowplaying_new.trim();
					
					// Get echonest np
					boolean npEchoNestVerified = false;
					if (json.getJSONObject("data").has("npechores") && json.getJSONObject("data").getBoolean("npechores")) {
						npEchoNestVerified = true;
					}
					
					// Do some for "Now playing: ..."
					if (nowplaying.equals("Now playing: ...")) {
						nowplaying = "Now playing: ?";
					}
					
					// Update notif only when nowplaying changed
					if (!nowplaying_new.equals(nowplaying) && serviceIsRunning) {
						
						// Scrob?
						sendBroadcastSLS(nowplaying_new,npEchoNestVerified,0);
						
						// Update MetaData
						nowplaying = nowplaying_new; // do it here so getStationImage can find recent artwork!
						updateMetaData(station_name, nowplaying);
						
						// Override opts for notif
						JSONObject overrideOpts = new JSONObject();
						
						// Change notif icons/action?
						// -> paused
						if (sett.getBoolean("is_paused", false)) { // paused
							try {
								overrideOpts.put("actionPlayPauseIcon","ic_stat_av_play");
								overrideOpts.put("actionPlayPauseTitle","Play");
							} catch(Exception e) {}
							
						}
						// -> alarm
						if (isAlarm) {
							overrideOpts.put("actionPlayPauseIsSnooze",true);
						}
						
						// Update notif
						// Should I re-use startForeground?
						//msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", "Now playing: ...", msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
						//startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
						
						Log.d(APPTAG," > NowPlaying: "+ station_name +", "+ nowplaying);
						//msNotifMgr.notif(station_name,nowplaying_new,msNotifMgr.NOTIFICATION_ID,false,overrideOpts);
						
						msNotifMgr.notif(station_name,nowplaying_new,msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
						startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
						
					}
					
					// Save nowplaying_new
					nowplaying = nowplaying_new;
					
					
				} catch(JSONException e) {
					Log.e(APPTAG," > runNowPlayingPoll.JSONException!",e);
					//e.printStackTrace();
				} catch(Exception e) {
					Log.e(APPTAG," > runNowPlayingPoll.Exception!",e);
					//e.printStackTrace();
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
		
		// Get mediaType
		if (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) {
			mediaType = AudioManager.STREAM_ALARM;
		} else {
			mediaType = AudioManager.STREAM_MUSIC;
		}
		
		boolean allowdown = true;
        
        // Check arguments
        
        int setvol = volume;
		
		AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
		
		float maxvol = audioManager.getStreamMaxVolume(mediaType);
		float curvol = audioManager.getStreamVolume(mediaType);
		float targvol = Math.round((setvol*maxvol)/10);
		int difvol = Math.round(targvol-curvol);
		
		//if (curvol>targvol) { Log.d(APPTAG,"ChangedVolume: --"); for (int ivol=0; ivol>difvol; ivol--) { audioManager.adjustStreamVolume(mediaType, AudioManager.ADJUST_LOWER, 1); } }
		//if (curvol<targvol) { Log.d(APPTAG,"ChangedVolume: ++"); for (int ivol=0; ivol<difvol; ivol++) { audioManager.adjustStreamVolume(mediaType, AudioManager.ADJUST_RAISE, 1); } }
		audioMgr.setStreamVolume(mediaType, Math.round(targvol), 1);
		
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
	
	// Download station_image
	private Bitmap getStationImage(JSONObject station) {
		
		Log.d(APPTAG,"MediaStreamerService.getStationImage()");
		
		// ---> PREP PREP PREP
		
		// Check station_art_uri // DEPRECATED // TODO: do
		String station_art_uri = null;
		boolean isArtInsteadOfIcon = false;
		
		// Prep: Stuff
		Bitmap bmp = null;
		ThreadPolicy origMode = StrictMode.getThreadPolicy();
		
		// Prep: Get json variables
		String src = null;
		boolean isImageInsteadOfIcon = false;
		try {
			src = station.getString("station_icon");
			if (station.has("station_image")) {
				String newsrc = station.getString("station_image");
				Log.d(APPTAG," > Replace _icon with _image: '"+ newsrc +"' ?");
				if (newsrc!=null && !newsrc.equals("0")) {
					isImageInsteadOfIcon = true;
					src = station.getString("station_image");
				}
			}
		} catch(JSONException e) {
			Log.e(APPTAG,"MediaStreamerService.getStationImage().JSONException: "+e,e);
			//e.printStackTrace();
			return null;
		} catch(Exception e) {
			Log.e(APPTAG,"MediaStreamerService.getStationImage().Exception: "+e,e);
			//e.printStackTrace();
			return null;
		}
        
        // Prep: Write bitmap to storage..
        // -> Path..
        String root = Environment.getExternalStorageDirectory().toString();
        File path = new File(root + "/Icerrr/images");
        path.mkdirs(); // should not be needed but lets do it anyway
        // -> Filename
        String filename = "";
        if (isImageInsteadOfIcon) {
        	filename = "tmp_lockscreen_station_image_"+ station_id +".png";
        } else {
        	filename = "tmp_lockscreen_station_icon_"+ station_id +".png";
        }
		
		// Lookup nowplaying-station-name on storage..
		String nowplaying_filename = stripIllChars(""
				+ "station_art_"
				+ nowplaying.replaceAll(" ", "-")
				+ "_"
				+ station_name.replaceAll(" ", "-").toLowerCase()
				+ "_"
				);
		nowplaying_filename = nowplaying_filename.toLowerCase();
		String nowplaying_filename_png = nowplaying_filename+".png";
		String nowplaying_filename_jpg = nowplaying_filename+".jpg";
		String nowplaying_filename_jpeg = nowplaying_filename+".jpeg";
		Log.d(APPTAG," > Try and find nowplaying artwork: "+ nowplaying_filename);
		File[] files = path.listFiles();
		for (int i=0; i<files.length; i++){
			//Log.d(APPTAG,files[i].getName());
			String fileLower = files[i].getName().toLowerCase();
			if (nowplaying_filename_png.equals(fileLower)
				|| nowplaying_filename_jpg.equals(fileLower)
				|| nowplaying_filename_jpeg.equals(fileLower)
				) {
				isArtInsteadOfIcon = true;
				filename = files[i].getName();
				Log.d(APPTAG," > Found: "+ files[i].getName());
				break;
			}
		}
        
        // ---> GO GO GO
        
        Log.d(APPTAG," -> Path: "+ path);
        Log.d(APPTAG," -> File: "+ filename);
		
		// Already downloaded?
		JSONObject tmpStationImageData = null;
        try {
        	
        	String tmpStationImageDataStr = sett.getString("temp_station_image_data","{}");
        	tmpStationImageData = new JSONObject(tmpStationImageDataStr);
        	
        	if (tmpStationImageData.has(station_id) || isArtInsteadOfIcon && filename!=null && !filename.equals("")) {
        		Log.d(APPTAG," -> Load station_image from storage :D");
        		String filepath = path.getAbsolutePath() +"/"+ filename;
        		Log.d(APPTAG," -> Filepath: "+ filepath);
        		Bitmap couldThisBeTheBitmapWeReLookingFor = getIconFromURI(filepath);
        		if (couldThisBeTheBitmapWeReLookingFor!=null) { return couldThisBeTheBitmapWeReLookingFor; }
        		else { Log.w(APPTAG," -> Failed loading from storage :("); }
        	}
        	
        } catch(JSONException e) {
        	Log.e(APPTAG,"MediaStreamerService.getStationImage().JSONException: "+e,e);
			//e.printStackTrace();
        }
		
		// Download image into Bitmap
        try {
        	Log.d(APPTAG," -> Download: "+ src);
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);

            connection.setDoInput(true);
            connection.connect();

            InputStream input = connection.getInputStream();

            bmp = BitmapFactory.decodeStream(input);
            
        } catch (Exception e) {
        	Log.e(APPTAG,"MediaStreamerService.getStationImage().Exception: ",e);
            //e.printStackTrace();
            return null;
        }
        
        // Check bmp
        if (bmp==null) { return null; }
        
        // Write file..
        try {
            File file = new File(path, filename);
            FileOutputStream fileOutputStream = new FileOutputStream(file);
            bmp.compress(Bitmap.CompressFormat.PNG, 100, fileOutputStream);
            fileOutputStream.close();
        } catch (FileNotFoundException e) {
            Log.d(APPTAG, "MediaStreamerService.getStationImage().FileNotFoundException: " + e.getMessage());
        } catch (IOException e) {
            Log.d(APPTAG, "MediaStreamerService.getStationImage().IOException: " + e.getMessage());
        } 
        
        // Store that this file exists..
        try {
        	Log.d(APPTAG," -> Store: "+ station_id);
        	tmpStationImageData.put(station_id, filename);
        	settEditor.putString("temp_station_image_data",tmpStationImageData.toString());
        	settEditor.commit();
        } catch(JSONException e) {
        	Log.e(APPTAG,"MediaStreamerService.getStationImage().JSONException: "+e,e);
			//e.printStackTrace();
        }
        
        // ---> DONE DONE DONE :D
        
        // Re-set thread policy
        StrictMode.setThreadPolicy(origMode);
        
        // Done, return
        return bmp;
		
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
            // e.printStackTrace();
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

        if (iconId == 0) { // fallback
            iconId = getIconValue(packageName,"web_hi_res_512_002");
        }

        if (iconId == 0) { // ultimate fallback :(
            iconId = android.R.drawable.ic_menu_info_details;
        }

        Bitmap bmp = BitmapFactory.decodeResource(res, iconId);

        return bmp;
    }
    
    private Bitmap getIconFromURI (String src) {
    	//Log.d(APPTAG,"getIconFromURI");
        Bitmap bmp = null;

        try {
            String path = src.replace("file://", "");
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
        	bmp = BitmapFactory.decodeFile(path,options);
        } catch (Exception e) {
        	Log.e(APPTAG," -> Exception: "+ src +", "+ e,e);
            //e.printStackTrace();
        }

        return bmp;
    }
    
    // > Airplane mode
    private static boolean isAirplaneModeOn(Context context) {
	    return Settings.System.getInt(context.getContentResolver(),
	            Settings.System.AIRPLANE_MODE_ON, 0) != 0;
    }
    
    // Restart service with station
    private void restartServiceWithStation(JSONObject station) throws JSONException {
        
        nowplaying = "...";

    	// Restart time!
		Intent restartIntent = new Intent(context, MediaStreamerService.class);
		restartIntent.putExtra("next_restart_intent",true);
		restartIntent.putExtra("stream_url", station.getString("station_url"));
		restartIntent.putExtra("isAlarm", isAlarm);
		restartIntent.putExtra("volume", -1);
		restartIntent.putExtra("station_id",station.getString("station_id"));
		restartIntent.putExtra("station_name",station.getString("station_name"));
		restartIntent.putExtra("station_host",station.getString("station_host"));
		restartIntent.putExtra("station_port",station.getString("station_port"));
		restartIntent.putExtra("station_path",station.getString("station_path"));
        context.startService(restartIntent);
        
    }
    
    // Update Metadata
    private void updateMetaData(String station_name, String station_nowplaying) {
		
		// Update metadata always
		metadataEditor = remoteControlClient.editMetadata(true);
        metadataEditor.clear();
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, station_nowplaying);

		// Metadata > Get station icon
        if (sett.getBoolean("showStationIcon", true)) {
			try {
				Log.d(APPTAG," > MetadataEditor -> Lockscreen artwork..?");
				String starredStationsJsons = sett.getString("starredStations", "[]");
				JSONArray starredStations = new JSONArray(starredStationsJsons);
				int index = sett.getInt("starredStationsIndex", 0);
				if (index<0) { index = 0; }
				JSONObject station = starredStations.getJSONObject(index);
				Log.d(APPTAG," -> Get artwork for: "+ station.getString("station_name"));
				Bitmap bmp = getStationImage(station);
				if (bmp!=null) {
					Log.d(APPTAG," --> getStationImage() ok, putBitmap()");
					metadataEditor.putBitmap(100, bmp);
		        } else {
		        	Log.w(APPTAG," --> getStationImage() failed??? Using default..");
		        	metadataEditor.putBitmap(100, getIcon("bg_home_default"));
		        }
			} catch(JSONException e) {
				Log.w(APPTAG," > JSONException!",e);
				Log.w(APPTAG," > Okay okay, use default icon");
				metadataEditor.putBitmap(100, getIcon("bg_home_default"));
			}
        } else {
        	metadataEditor.putBitmap(100, getIcon("bg_home_default"));
        }
		
		// Apply metadata
        metadataEditor.apply();
    }
	
    // Get Station data
    private JSONObject getStationData() {
    	String starredStationsJsons = "[]";
    	try {
			
			// Get stations
    		starredStationsJsons = sett.getString("starredStations", "[]");
			JSONArray starredStations = new JSONArray(starredStationsJsons);
			
			// Get index
			int index = sett.getInt("starredStationsIndex", -1);
			
			// Index -1?
			if (index<0) {
				Log.w(APPTAG,"MediaStreamerService.getStationData(): index -1, lookup: "+station_id);
				for (int i=0; i<starredStations.length(); i++){
					JSONObject station = starredStations.getJSONObject(i);
					Log.d(APPTAG," --> "+ station.getString("station_id"));
					if (station_id.equals(station.getString("station_id"))) {
						index = i;
						settEditor.putInt("starredStationsIndex",index);
						settEditor.commit();
						break;
					}
				}
				Log.d(APPTAG," -> Index found: "+ index);
			}
			
			// Get station
			JSONObject station = starredStations.getJSONObject(index);
	    	
			// Return
	    	return station;
			
		} catch (JSONException e) {
			Log.e(APPTAG," > Error handling 'getStationData()', JSONException",e);
			//Log.w(APPTAG," > "+ starredStationsJsons);
		}
    	
    	return null;
    	
    }
    
    private String lastnpartist = null;
    private String lastnptitle = null;
    private boolean lastnpverified = false;
    
    // SLS Integration
    private void sendBroadcastSLS(String nowplaying_str, int state) {
    	sendBroadcastSLS(nowplaying_str,false,state);
    }
    private void sendBroadcastSLS(String nowplaying_str, boolean verified) {
    	sendBroadcastSLS(nowplaying_str,verified,0);
    }
    private void sendBroadcastSLS(String nowplaying_str, boolean verified, int state) {
		
    	try {
		
			Log.d(APPTAG," > Send SLS intent..");
			// -> Docs: https://github.com/tgwizard/sls/blob/master/Developer's%20API.md
	    	
	    	if (!sett.getBoolean("useSLS", false)) {
	    		Log.d(APPTAG," -> SLS disabled, return");
				lastnpartist = null;
				lastnptitle = null;
				lastnpverified = false;
	    		return;
	    	}
			
			// Check
			if (nowplaying_str.equals("Now playing: Unknown") || nowplaying_str.equals("Now playing: ...") || nowplaying_str.equals("...")) {
				Log.d(APPTAG," -> Now playing: Unknown or ..., skip");
				lastnpartist = null;
				lastnptitle = null;
				lastnpverified = false;
				return;
			}
			
			// Parse nowplaying for artist + trackname
			String[] npparts = nowplaying_str.split("-", 2);
			if (npparts.length<2) { 
				Log.d(APPTAG," -> Now playing: split() resulted in less than 2 values, skip");
			}
			String npartist = npparts[0].trim();
			String nptrack = npparts[1].trim();
			
			if (state==1 && !npartist.equals(lastnpartist) && !nptrack.equals(lastnptitle)) {
				state = 0; // don't resume, start new
			}
			if (state==2 && !npartist.equals(lastnpartist) && !nptrack.equals(lastnptitle)) {
				state = 3; // don't pause, stop
			}
			
			// Check | -> intergalactic :(((
			if (nptrack.indexOf("|")>0) {
				nptrack = nptrack.substring(0, nptrack.indexOf("|")-1).trim();
			}
	
			Log.d(APPTAG," -> "+ npartist +", "+ nptrack +", "+ state);
			
			// Verify?
			if (sett.getBoolean("useSLSVerify", false)) {
				if (!verified && state==0 || !lastnpverified && state!=0) {
					Log.d(APPTAG," -> Not verified, don't scrobble...");
					return;
				}
			}
			
			// Store npartist - title - verified
			lastnpartist = npartist;
			lastnptitle = nptrack;
			lastnpverified = verified;
			
			// Go!
			
			Intent slsIntent = new Intent();
			slsIntent.setAction("com.adam.aslfms.notify.playstatechanged");
			slsIntent.putExtra("state", state); // State
			slsIntent.putExtra("app-name","Icerrr");
			slsIntent.putExtra("app-package", "com.rejh.icerrr.itson");
			slsIntent.putExtra("artist", npartist);
			slsIntent.putExtra("track", nptrack);
			slsIntent.putExtra("duration", 60);
			slsIntent.putExtra("source", "R");
			
			context.sendBroadcast(slsIntent);
			
		} catch(Exception e) {
			Log.e(APPTAG," > Error SLS integration: "+ e,e);
		}
		
    }
    
    // Strip Ill Chars
    private String stripIllChars(String str) {
    	
    	for (int i=0; i<illchars.length; i++) {
    		String illchar = illchars[i];
    		if (str.indexOf(illchar)>=0) {
    			str = str.replace(illchar, "");
    		}
    	}
    	
    	return str;
    	
    }

}
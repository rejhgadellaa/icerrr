package com.rejh.cordova.mediastreamer;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
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
	private WifiManager.WifiLock wifiLock;
	
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
		boolean cmd_pause_resume = false;
		boolean cmd_pause = false;
		boolean cmd_next = false;
		boolean cmd_prev = false;
		boolean cmd_next_restart_intent = false;
		if(intent!=null) {
			
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
		if (mpMgr!=null && !cmd_next_restart_intent) {
			if (cmd_pause_resume && !sett.getBoolean("is_paused", false) || cmd_pause) { // pause
				Log.d(APPTAG," > cmd_pause_resume PAUSE!");
				settEditor.putBoolean("is_paused", true);
				settEditor.commit();
				mpMgr.pause();
				nowplaying = "...";
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
				settEditor.putInt("starredStationsIndex",-1); // reset some values..
				settEditor.commit();
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
		if (msNotifMgr==null) { msNotifMgr = new MediaStreamerNotifMgr(context); }
		msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", "Now playing: ...", msNotifMgr.NOTIFICATION_ID,true,overrideOpts);
		startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
		
		// Now playing poll
		startNowPlayingPoll();
        
        // Metadata
        metadataEditor = remoteControlClient.editMetadata(true);
        metadataEditor.clear();
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, "Now playing: ...");
        metadataEditor.putBitmap(100, getIcon("web_hi_res_512_002"));
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
	        	
	            // Resume playback 
	        	Log.d(APPTAG," > AUDIOFOCUS_GAIN");
	        	
	        	if (sett.getBoolean("volumeHasDucked", false)) {
	        		Log.d(APPTAG," >> Volume++ (was ducked)");
	        		settEditor.putBoolean("volumeHasDucked",false);
	        		settEditor.commit();
	        		setVolumeFocusGained();
	        	} else if (sett.getBoolean("is_paused", false)) {
	        		Log.d(APPTAG," >> Resume playback (from paused)");
	        		settEditor.putBoolean("is_paused", false);
					settEditor.commit();
					mpMgr.resume();
	        	}
				
				// Update notif
				msNotifMgr.notif((station_name!=null)?station_name:"Unknown station", nowplaying, msNotifMgr.NOTIFICATION_ID,true);
				startForeground(msNotifMgr.NOTIFICATION_ID,msNotifMgr.notifObj);
	        	
	        // LOSS_TRANSIENT && LOSS (in case of loss we still want to hold on to the notification)
	        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT || focusChange == AudioManager.AUDIOFOCUS_LOSS) {
	            
	            // Stop playback
	        	Log.d(APPTAG," > AUDIOFOCUS_LOSS");
	        	
	        	Log.d(APPTAG," > Pause the stream!");
	        	settEditor.putBoolean("is_paused", true);
				settEditor.commit();
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
	
	private void startNowPlayingPoll() {
		if (nowPlayingPollTimer!=null) { stopNowPlayingPoll(); }
		nowPlayingPollTimer = new Timer();
		nowPlayingPollTimer.scheduleAtFixedRate( new TimerTask() {
			public void run() {
				
				runNowPlayingPoll();
				
			}
		}, 1*1000, 1*60*1000); // every ~minute
	}
	
	private void stopNowPlayingPoll() {
		if (nowPlayingPollTimer!=null) { nowPlayingPollTimer.cancel(); }
		nowPlayingPollTimer = null;
	}
	
	private void runNowPlayingPoll() {
		Log.d(APPTAG," > runNowPlayingPoll()");
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
					
					// Do some for "Now playing: ..."
					if (nowplaying.equals("Now playing: ...")) {
						nowplaying = "Now playing: ?";
					}
					
					// Update notif only when nowplaying changed
					if (!nowplaying_new.equals(nowplaying) && serviceIsRunning) {
						
						// Override opts for notif
						JSONObject overrideOpts = new JSONObject();
						
						// Change notif icons/action?
						if (sett.getBoolean("is_paused", false)) { // paused
							try {
								overrideOpts.put("actionPlayPauseIcon","ic_stat_av_play");
								overrideOpts.put("actionPlayPauseTitle","Play");
							} catch(Exception e) {}
							
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
					
					// Update metadata only when nowplaying changed
					if (!nowplaying_new.equals(nowplaying) && serviceIsRunning) {
					
						// Update metadata always
						metadataEditor = remoteControlClient.editMetadata(true);
				        metadataEditor.clear();
				        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_ARTIST, station_name);
				        metadataEditor.putString(MediaMetadataRetriever.METADATA_KEY_TITLE, nowplaying_new);
	
						// Metadata > Get station icon
				        if (sett.getBoolean("showStationIcon", true)) {
							try {
								Log.d(APPTAG," > Station icon?");
								String starredStationsJsons = sett.getString("starredStations", "[]");
								JSONArray starredStations = new JSONArray(starredStationsJsons);
								int index = sett.getInt("starredStationsIndex", 0);
								if (index<0) { index = 0; }
								JSONObject station = starredStations.getJSONObject(index);
								Log.d(APPTAG," >> "+ station.getString("station_name"));
						        if (station.getString("station_icon")!=null && !station.getString("station_icon").equals("null")) { 
						        	metadataEditor.putBitmap(100, getIconFromURL(station.getString("station_icon")));
						        } else {
						        	metadataEditor.putBitmap(100, getIcon("web_hi_res_512_002"));
						        }
							} catch(JSONException e) {
								Log.w(APPTAG," > JSONException!",e);
								Log.w(APPTAG," > Okay okay, use default icon");
								metadataEditor.putBitmap(100, getIcon("web_hi_res_512_002"));
							}
				        } else {
				        	metadataEditor.putBitmap(100, getIcon("web_hi_res_512_002"));
				        }
						
						// Apply metadata
				        metadataEditor.apply();
				        
					}
					
					// Save nowplaying_new
					nowplaying = nowplaying_new;
					
					
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
    
    // Restart service with station
    private void restartServiceWithStation(JSONObject station) throws JSONException {
        
        nowplaying = "...";

    	// Restart time!
		Intent restartIntent = new Intent(context, MediaStreamerService.class);
		restartIntent.putExtra("next_restart_intent",true);
		restartIntent.putExtra("stream_url", station.getString("station_url"));
		restartIntent.putExtra("isAlarm", false);
		restartIntent.putExtra("volume", -1);
		restartIntent.putExtra("station_id",station.getString("station_id"));
		restartIntent.putExtra("station_name",station.getString("station_name"));
		restartIntent.putExtra("station_host",station.getString("station_host"));
		restartIntent.putExtra("station_port",station.getString("station_port"));
		restartIntent.putExtra("station_path",station.getString("station_path"));
        context.startService(restartIntent);
        
    }
	
	

}
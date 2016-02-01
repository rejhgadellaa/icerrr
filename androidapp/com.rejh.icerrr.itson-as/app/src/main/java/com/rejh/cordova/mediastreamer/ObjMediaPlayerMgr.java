package com.rejh.cordova.mediastreamer;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnBufferingUpdateListener;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnErrorListener;
import android.media.MediaPlayer.OnInfoListener;
import android.media.MediaPlayer.OnPreparedListener;
import android.media.RemoteControlClient;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiManager.WifiLock;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

public class ObjMediaPlayerMgr {
	
	// --------------------------------------------------
	// Members
	
	private final static String LOGTAG = "MediaStreamer";
	private final String SETTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private MediaStreamerService service;
	
	private MediaPlayer mp;
	
	private Timer timer;
	
	private ConnectivityManager connMgr;
	
	private WifiManager wifiMgr;

    private Runnable onErrorRunnable;
    private Handler onErrorHandler;

    private Runnable onDestroyRestartRunnable;
    private Handler onDestroyRestartHandler;

	private Timer playPollTimer;

	private boolean isDestroyed = false;
	
	// Variables
	
	private WifiLock wifiLock;
	
	private final String streamUrlDefault = "http://icecast.omroep.nl/3fm-sb-mp3";
	private String streamUrl;
	private String streamedUrl;
	
	private boolean isAlarm;
	
	private int sdkVersion;
	
	private int nrOfErrors;
	
	private final static int MEDIA_NONE = 0;
	private final static int MEDIA_STARTING = 1;
	private final static int MEDIA_RUNNING = 2;
	private final static int MEDIA_PAUSED = 3;
	private final static int MEDIA_STOPPED = 4;
	
	private int mediaPlayerInfoLastCode = -1;
	private int mediaPlayerInfoLastExtra = -1;
	
	// --------------------------------------------------
	// Constructor
	
	public ObjMediaPlayerMgr(Context bindToContext, ConnectivityManager bindToConnMgr, WifiManager bindToWifiMgr, MediaStreamerService bindToService) {
		
		Log.i(LOGTAG,"MediaPlayerMgr.Constructor()");
		
		context = bindToContext;
		sett = context.getSharedPreferences(SETTAG,Context.MODE_MULTI_PROCESS | 2);
        settEditor = sett.edit();
        connMgr = bindToConnMgr;
        wifiMgr = bindToWifiMgr;
        service = bindToService;
		
        // Get SDK Version (determines use of StreamProxy for 2.1 en lower)
        sdkVersion = 0;
        try { sdkVersion = Build.VERSION.SDK_INT; } 
		catch (NumberFormatException e) {}
        
        nrOfErrors = 0;
        
		}
	
	// --------------------------------------------------
	// Methods Public
	
	private void initbackup() {
		Log.w(LOGTAG," -> nrOfErrors > 10, using backup-plan!");
		if (isAlarm) {
			Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
		     if(alert == null){
		         // alert is null, using backup
		         alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
		         if(alert == null){  // I can't see this ever being null (as always have a default notification) but just incase
		             // alert backup is null, using 2nd backup
		             alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);               
		         }
		     }
			destroy(false);
			try {
			mp = new MediaPlayer();
			mp.setDataSource(context, alert);
			mp.setLooping(true);
			mp.prepare();
			mp.start();
			} catch(Exception e) { Log.e(LOGTAG,e.toString()); }
			settEditor.putInt("mediaplayerState",MEDIA_RUNNING);
			settEditor.putInt("mediastreamer_state",MEDIA_RUNNING);
			settEditor.commit();
			if (service.remoteControlClient!=null) { service.remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_PLAYING); }
		} else {
			// Kill self...
			Intent serviceIntent = new Intent(context, MediaStreamerService.class);
			context.stopService(serviceIntent);
		}
	}
	
	// INIT
	public boolean init(String url, boolean _isAlarm) {
		
		if (mp!=null) {
			Log.d(LOGTAG, " -> MPMGR.Init() -> Destroy()");
            streamUrl = url;
			destroy(true);
            return false;
		}
		
		Log.d(LOGTAG," -> MPMGR.Init()");
		
		boolean initHasFailed = false;
		
		// Handle url (=null)
		if (url==null) { url = sett.getString("streamUrlDefault", streamUrlDefault); }
		streamUrl = url;
		streamedUrl = url;
		
		// Store streamUrl as default
		settEditor.putString("streamUrlDefault", streamUrl);
		settEditor.commit();
		
		// Is alarm?
		isAlarm = _isAlarm;

        // reset mediaPlayerInfoLastCode
        mediaPlayerInfoLastCode = -1;

		Log.d(LOGTAG, " -> STREAM " + streamUrl);
		
		// Prepare MP
		// Catch exceptions
		try {
			
			// AudioAttributes
			/* TODO: only available in API >= 21
			AudioAttributes audioAttr = new AudioAttributes.Builder()
				.setUsage(AudioAttributes.USAGE_ALARM)
	            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
	            .build();
			/**/
			
			// Init & setup
			if (mp!=null) { mp.release(); mp = null;}
			mp = new MediaPlayer();
			
			if (isAlarm && sett.getBoolean("useSpeakerForAlarms", false)) {
				mp.setAudioStreamType(AudioManager.STREAM_ALARM);
			} else {
				mp.setAudioStreamType(AudioManager.STREAM_MUSIC);
			}
			
			mp.setDataSource(streamUrl);
			
			mp.setOnPreparedListener(onPreparedListener);
			mp.setOnErrorListener(onErrorListener);
			mp.setOnInfoListener(onInfoListener);
			mp.setOnBufferingUpdateListener(onBufferingUpdateListener);
			mp.setOnCompletionListener(onCompletionListener);
			
			mp.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
			
			mp.prepareAsync();
			
			startConnTypeChecker();
			
			settEditor.putInt("mediaplayerState",MEDIA_STARTING);
			settEditor.putInt("mediastreamer_state",MEDIA_STARTING);
			settEditor.commit();
			
			// Playing!
	        if (service.remoteControlClient!=null) {
	        	service.remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_BUFFERING);
	        }
			
			}
		catch (IllegalArgumentException e) { 
			Toast.makeText(context, "MP IllArgumentException:\n"+e,Toast.LENGTH_LONG).show();
			Log.w(LOGTAG," -> MP Init IllegalArgumentException!", e);
			initHasFailed = true;
        	}
		catch (IllegalStateException e) { 
			Toast.makeText(context, "MP IllStateException:\n"+e,Toast.LENGTH_LONG).show();
			Log.w(LOGTAG," -> MP Init IllegalStateException", e);
			initHasFailed = true;
			} 
		catch (IOException e) { 
			Toast.makeText(context, "MP IOException:\n"+e,Toast.LENGTH_LONG).show();
			Log.w(LOGTAG," -> MP Init IOException", e);
			initHasFailed = true;
			}
		
		// Catch fail
		
		if (initHasFailed) {
			Log.w(LOGTAG," -> MP Init has failed!");
			/* TODO: Notification
			Intent ni = new Intent(context, RecvNotifier.class);
				ni.putExtra("cancel",true);
			context.sendBroadcast(ni);
			/**/
			return false;
			}
		
		return true;
		
		}
	
	// DESTROY
	public void destroy(boolean restartStreamDelayed) {

        Log.d(LOGTAG, " -> MPMGR.Destroy()");

        // Stop & store
        stopConnTypeChecker();

        if (onErrorHandler != null && onErrorRunnable != null) {
            onErrorHandler.removeCallbacks(onErrorRunnable);
        }
        if (onDestroyRestartHandler != null && onDestroyRestartRunnable != null) {
            onDestroyRestartHandler.removeCallbacks(onDestroyRestartRunnable);
        }

        if (mp != null) {
            mp.release();
            mp = null;
        }

        settEditor.putInt("mediaplayerState", MEDIA_NONE);
        settEditor.putInt("mediastreamer_state", MEDIA_NONE);
        settEditor.commit();

        // Notify
		/* TODO: Notification
		Intent ni = new Intent(context, RecvNotifier.class);
			ni.putExtra("cancel",true);
		context.sendBroadcast(ni);
		/**/

        // Restart delayed..
        if (restartStreamDelayed) {

            onDestroyRestartRunnable = new Runnable() {
                public void run() {
                    Log.d(LOGTAG, " -> Restarting stream...");
					if (isDestroyed) { Log.d(LOGTAG," -> Just kidding. isDestroyed==true"); return; }
                    init(getStreamUrl(), isAlarm);
                }
            };
            onDestroyRestartHandler = new Handler(Looper.getMainLooper());
            onDestroyRestartHandler.postDelayed(onDestroyRestartRunnable, 1000);

        } else {
			isDestroyed = true;
		}

    }
	
	// PAUSE
	public void pause() {
		stopConnTypeChecker();
		if (mp==null) { return; }
		settEditor.putInt("mediastreamer_state",MEDIA_PAUSED);
		settEditor.commit();
		if (service.remoteControlClient!=null) { service.remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_PAUSED); }
		if (mp!=null) { mp.release(); mp = null; }
		if (service.wifiLock.isHeld()) {
			service.wifiLock.release();
		}
	}
	
	// RESUME
	public void resume() {
		if (!service.wifiLock.isHeld()) {
			service.wifiLock.acquire();
		}
		settEditor.putInt("mediastreamer_state",MEDIA_STARTING);
		settEditor.commit();
		if (service.remoteControlClient!=null) { service.remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_BUFFERING); }
		init(getStreamUrl(),isAlarm);
	}
	
	// ISPLAYING
	public boolean isPlaying() {
		if (mp==null) { return false; }
		return mp.isPlaying();
	}
	
	public boolean setVolume(float vol) {
		if (mp==null) { return false; }
		if (!isPlaying()) { return false; }
		mp.setVolume(vol,vol);
		return true;
	}
	
	// --------------------------------------------------
	// Listeners
	
	// MEDIA OnPreparedListener
	private OnPreparedListener onPreparedListener = new OnPreparedListener() {
		
		// @Override
		public void onPrepared(MediaPlayer mp) {
			
			Log.d(LOGTAG," -> MP.OnPrepared");
			
			// Start & store
			
			mp.setVolume(0, 0);
			mp.start();
			if (isAlarm) {
				fadeIn(mp,7500);
			} else {
				fadeIn(mp,1000);
			}
			
			settEditor.putInt("mediaplayerState",MEDIA_RUNNING);
			settEditor.putInt("mediastreamer_state",MEDIA_RUNNING);
			settEditor.commit();
			
			// Playing!
	        if (service.remoteControlClient!=null) {
	        	service.remoteControlClient.setPlaybackState(RemoteControlClient.PLAYSTATE_PLAYING);
	        }
			
			nrOfErrors = 0;
			
			}
		
		};
	
	// MEDIA OnCompletionListener
	private OnCompletionListener onCompletionListener = new OnCompletionListener() {
		
		// @Override
		public void onCompletion(MediaPlayer mp) {
			Log.d(LOGTAG," -> MP.OnCompletion");
			Log.w(LOGTAG,"  -> This should not happen.");
			if (sett.getInt("mediaplayerState",2)>0) {
				if (nrOfErrors > 8) { initbackup(); return; }
				nrOfErrors++;
				Log.w(LOGTAG,"  -> Restarting stream...");
				init(getStreamUrl(),isAlarm);
			}
			}
		
	};
		
	// MEDIA OnBufferingUpdate
	private OnBufferingUpdateListener onBufferingUpdateListener = new OnBufferingUpdateListener() {
		
		// @Override
		public void onBufferingUpdate(MediaPlayer mediaplayer, int progress) {
			// Log.d(LOGTAG," -> MP.OnBufferUpdate "+progress);
			// Unimportant ?
			}
		
		};
	
	// MEDIA OnInfoListener
	private OnInfoListener onInfoListener = new OnInfoListener() {
		
		// @Override
		public boolean onInfo(MediaPlayer mediaplayer, int code, int extra) {
			Log.d(LOGTAG," -> MP.OnInfo(" + code + ", " + extra + ")");
			
			// Check code/extra for 703/192
			if (code==701 && mediaPlayerInfoLastCode==703) { // code==701 && mediaPlayerInfoLastCode==703 && mediaPlayerInfoLastExtra==192) {
				Log.w(LOGTAG, " --> Code 701 after 703, restart stream, errors: "+nrOfErrors);
				if (nrOfErrors > 8) { initbackup(); return false; }
				nrOfErrors++;
                checkPlayingDelayed();
			}
			// Store code && extra..
			mediaPlayerInfoLastCode = code;
			mediaPlayerInfoLastExtra = extra;
			
			return false;
			}
		
		};
		
	// MEDIA OnErrorListener
	private OnErrorListener onErrorListener = new OnErrorListener() {
		
		// @Override
		public boolean onError(MediaPlayer mediaplayer, int what, int extra) {
			
			Log.e(LOGTAG," -> MP.OnERROR: Code: "+what+", "+extra);
			Log.e(LOGTAG," -> nrOfErrors: "+nrOfErrors);
			
			// Check Errorcode
			//  ? -1002 File not found
			//  ? -1004 Bad file format
			//    -110  When no networks (3g,wifi)
			
			// nrOfErrors > 10 :: play ringtone && destroy self
			if (nrOfErrors > 8) {
				initbackup();
				return false;
				}
			nrOfErrors++;
			
			settEditor.putInt("mediaplayerState",MEDIA_NONE);
			settEditor.putInt("mediastreamer_state", MEDIA_NONE);
			settEditor.commit();

            if (onErrorHandler!=null && onErrorRunnable!=null) { onErrorHandler.removeCallbacks(onErrorRunnable); }
			onErrorRunnable = new Runnable() {
				public void run () {
                    Log.d(LOGTAG, " -> Restarting stream...");
					if (isDestroyed) { Log.d(LOGTAG," -> Just kidding. isDestroyed==true"); return; }
                    init(getStreamUrl(),isAlarm);
				}
			};
			onErrorHandler = new Handler(Looper.getMainLooper());
            onErrorHandler.postDelayed(onErrorRunnable, 1000);
			
			return false;
			}
		
		};
		
		// --------------------------------------------------
		// CONN TYPE CHECKER
		
		// MediaPlayerChecker
		// Handle data-connection / wifi
		
		private int connType = -1;
		private int connTypeOld = -1;
		private boolean connWasLost = false;

		// Stop Conn Type Checker
		private void stopConnTypeChecker() {
			Log.d(LOGTAG," -> stopConnTypeChecker()");
			if (timer!=null) { timer.cancel(); }
			timer = null;
		}

		// Start Conn Type Checker
		private void startConnTypeChecker() {
			
			if (timer!=null) { stopConnTypeChecker(); }
			
			Log.d(LOGTAG," -> startConnTypeChecker()");
			
			timer = new Timer();
			timer.scheduleAtFixedRate( new TimerTask() {
				public void run() {
					
					runConnTypeChecker();
					
				}
			}, 0, 5*1000);
			
		}
		
		// Run Conn Type Checker
		private void runConnTypeChecker() {
			
			//Log.i(LOGTAG,"ConnTypeChecker");
			
			connType = -1;
			
			// NetworkInfo
			NetworkInfo netwInfo = connMgr.getActiveNetworkInfo();
			NetworkInfo netwInfoCell = connMgr.getNetworkInfo(0);
			
			// Check airplane mode first..
			if (isAirplaneModeOn(context) && isAlarm || netwInfo==null && isAlarm) {
				initbackup();
				return;
			}
			
			try {
				
				// 3G=1, Wifi=2
				connType = netwInfo.getType()+1;
				
				// Wifi: Check IP
				if (connType==2) {
					if (netwInfoCell==null || netwInfoCell!=null && netwInfoCell.getState()!=NetworkInfo.State.DISCONNECTED) {
						connType=1;
					}
				}
				
				// Handle Roaming
				boolean useWifiWhenRoaming = sett.getBoolean("useWifiWhenRoaming",true);
				boolean isRoaming = false; // netwInfoCell.isRoaming();
				if (netwInfoCell==null) { isRoaming = false; }
				else { isRoaming = false; netwInfoCell.isRoaming(); }
				
				if (isRoaming && useWifiWhenRoaming && connType==1) {
					Log.d(LOGTAG," -> isRoaming on Celldata... waiting...");
					if(mp!=null) { mp.release(); mp=null; }
					connWasLost=true;
					return;
				}
				
			} catch (Exception e) {
				Log.w(LOGTAG," -> !NetwInfo",e);
				connType = 0;
			}
			
			// Additional..
			if (connTypeOld==-1) { 
				connTypeOld = connType; 
			}
			
			// Handle ConnType CHANGES
			if (connType>0 && connType!=connTypeOld && !connWasLost) {
				
				Log.d(LOGTAG," -> ConnType CHANGE "+connTypeOld+"="+connType);
				connTypeOld = connType;
				init(getStreamUrl(),isAlarm);
				
			}
			
			// Handle Connection losses
			if (netwInfo != null && netwInfo.getState() == NetworkInfo.State.CONNECTED) {
				if (connWasLost) {
					Log.d(LOGTAG," -> Stream resumed");
					connWasLost = false;
					connTypeOld = connType;
					service.startNowPlayingPoll();
					init(getStreamUrl(),isAlarm);
				}
			} else {
				Log.d(LOGTAG," -> Connection lost. Stream paused");
				if(mp!=null) { mp.release(); mp=null; }
				service.stopNowPlayingPoll();
				connWasLost = true;
			}
			
		}

		// > Airplane mode
		
		private boolean isAirplaneModeOn(Context context) {
			if (Build.VERSION.SDK_INT<17) {
				Log.d(LOGTAG," -> MPMGR.isAirplaneModeOn() > SDK: "+ Build.VERSION.SDK_INT);
				return Settings.System.getInt(context.getContentResolver(),
			            Settings.System.AIRPLANE_MODE_ON, 0) != 0;
			} else {
			    return Settings.Global.getInt(context.getContentResolver(),
			            Settings.Global.AIRPLANE_MODE_ON, 0) != 0;
			}
		}
		
		// > Get Stream Url
		
		private String getStreamUrl() {
			
			Log.i(LOGTAG," -> MPMGR.getStreamUrl()");
			
			// Default..
			String theStreamUrl = (streamedUrl!=null) ? streamedUrl : streamUrl;
			
			try {
				
				// Get stations
				String starredStationsJsons = sett.getString("starredStations", "[]");
				JSONArray starredStations = new JSONArray(starredStationsJsons);
				
				// Find current station
				int index = -1;
				for (int i=0; i<starredStations.length(); i++) {
					JSONObject starredStation = starredStations.getJSONObject(i);
					String id = starredStation.getString("station_id");
					if (service.station_id.equals(id)) {
						index = i;
						break;
					}
				}
				
				if (index<0) {
					Log.w(LOGTAG," --> Could not find station, return default");
					return theStreamUrl;
				}
				
				JSONObject station = starredStations.getJSONObject(index);
				if (connType!=2) {
					// Not wifi, assume mobile data
					Log.d(LOGTAG," --> No wifi, assume mobile data");
					theStreamUrl = station.getString("station_url");
					Log.d(LOGTAG," --> "+ theStreamUrl);
				} else {
					// Wifi
					Log.d(LOGTAG," --> Wifi, try high quality stream");
					theStreamUrl = station.has("station_url_highquality") ? station.getString("station_url_highquality") : station.getString("station_url"); 
					Log.d(LOGTAG," --> "+ theStreamUrl);
				}
				
			} catch (JSONException e) {
				Log.e(LOGTAG," > JSONException",e);
			}
			
			// Return
			return theStreamUrl;
			
		}
	    
	    // > Fade In
	    
	    public static void fadeIn(final MediaPlayer _player, final int duration) {
	        final float deviceVolume = 0.95f; // getDeviceVolume();
	        final Handler h = new Handler();
	        h.postDelayed(new Runnable() {
	            private float time = 0.0f;
	            private float volume = 0.0f;

	            @Override
	            public void run() {
	            	try {
		            	if (_player==null) { return; }
		                // if (_player != null && !_player.isPlaying()) { _player.start(); } // Causes IllegalStateException :(
		                // can call h again after work!
		                time += 100;
		                volume = (deviceVolume * time) / duration;
		                _player.setVolume(volume, volume);
		                if (time < duration) {
		                    h.postDelayed(this, 100);
		                }
	            	} catch(IllegalStateException e) {
	            		Log.w(LOGTAG," > IllegalStateException: "+e,e);
	            	}
	            }
	        }, 100); // 1 second delay (takes millis)

	    }

	// > Check playing

    public void checkPlayingDelayed() {
        Log.d(LOGTAG,"checkPlaying()");
        final Handler h = new Handler();
        h.postDelayed(new Runnable() {
            @Override
            public void run() {
                Log.d(LOGTAG,"checkPlaying() -> Delayed..");
                if (mediaPlayerInfoLastCode==701 && !isDestroyed) {
                    Log.w(LOGTAG,"checkPlaying() -> Delayed -> mediaPlayerInfoLastCode==701");
                    init(getStreamUrl(), isAlarm);
                }
            }
        }, 5000); // 2.5 second delay (takes millis)
    }
		
		
		
		// --- END ---
	
	}










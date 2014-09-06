package com.rejh.cordova.mediastreamer;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;

import org.npr.android.news.StreamProxy;

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
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;
import android.widget.Toast;

public class ObjMediaPlayerMgr {
	
	// --------------------------------------------------
	// Members
	
	private final String LOGTAG = "MediaStreamer";
	private final String SETTAG = "MediaStreamer";
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private MediaPlayer mp;
	private StreamProxy proxy;
	
	private Timer timer;
	
	private ConnectivityManager connMgr;
	
	// Variables
	
	private final String streamUrlDefault = "http://icecast.omroep.nl/3fm-sb-mp3";
	private String streamUrl;
	private String streamedUrl;
	
	private int sdkVersion;
	
	private int nrOfErrors;
	
	private final static int MEDIA_NONE = 0;
	private final static int MEDIA_STARTING = 1;
	private final static int MEDIA_RUNNING = 2;
	private final static int MEDIA_PAUSED = 3;
	private final static int MEDIA_STOPPED = 4;
	
	
	// --------------------------------------------------
	// Constructor
	
	public ObjMediaPlayerMgr(Context bindToContext, ConnectivityManager bindToConnMgr) {
		
		Log.i(LOGTAG,"MediaPlayerMgr.Constructor()");
		
		context = bindToContext;
		sett = context.getSharedPreferences(SETTAG,2);
        settEditor = sett.edit();
        connMgr = bindToConnMgr;
		
        // Get SDK Version (determines use of StreamProxy for 2.1 en lower)
        sdkVersion = 0;
        try { sdkVersion = Integer.parseInt(Build.VERSION.SDK); } 
		catch (NumberFormatException e) {}
        
        nrOfErrors = 0;
        
		}
	
	// --------------------------------------------------
	// Variables Public
	
	// --------------------------------------------------
	// Methods Public
	
	private void initbackup() {
		Log.w("MediaStreamer"," -> nrOfErrors > 10, using backup-plan!");
		Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
	     if(alert == null){
	         // alert is null, using backup
	         alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
	         if(alert == null){  // I can't see this ever being null (as always have a default notification) but just incase
	             // alert backup is null, using 2nd backup
	             alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);               
	         }
	     }
		destroy();
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
		}
	
	// INIT
	public boolean init(String url) {
		
		if (mp!=null || proxy!=null) { destroy(); SystemClock.sleep(1000);  }
		
		Log.d(LOGTAG," -> MPMGR.Init()");
		
		boolean initHasFailed = false;
		
		// Handle url (=null)
		if (url==null) { url = streamUrlDefault; }
		streamUrl = url;
		streamedUrl = url;
		
		// Prepare Proxy (if needed)
		// For Android 2.1 en lower (sdk<8)
		if (sdkVersion<8) {
			if (proxy==null) {
				try {
					proxy = new StreamProxy();
					proxy.init();
					proxy.start();
					streamUrl = String.format("http://127.0.0.1:%d/%s", proxy.getPort(), url);
				} catch(IllegalStateException e) { Log.e(LOGTAG," -> IllStateException: "+e, e); }
				}
			}
		
		Log.d(LOGTAG," -> STREAM "+streamUrl);
		
		// Prepare MP
		// Cstch exceptions
		try {
			
			// Init & setup
			if (mp!=null) { mp.release(); mp = null;}
			mp = new MediaPlayer();
			
			mp.setDataSource(streamUrl);
			mp.setAudioStreamType(AudioManager.STREAM_MUSIC);
			
			mp.setOnPreparedListener(onPreparedListener);
			mp.setOnErrorListener(onErrorListener);
			mp.setOnInfoListener(onInfoListener);
			mp.setOnBufferingUpdateListener(onBufferingUpdateListener);
			mp.setOnCompletionListener(onCompletionListener);
			
			mp.prepareAsync();
			
			startConnTypeChecker();
			
			settEditor.putInt("mediaplayerState",MEDIA_STARTING);
			settEditor.putInt("mediastreamer_state",MEDIA_STARTING);
			settEditor.commit();
			
			// Notify
			/* TODO: Notification
			Intent ni = new Intent(context, RecvNotifier.class);
				ni.putExtra("icon",R.drawable.icon_fmalarm_buff);
				ni.putExtra("ticker","FMAlarm Active ("+sett.getString("selectedShoutcastName","Radio 3FM")+")");
				ni.putExtra("title","FMAlarm is active...");
				ni.putExtra("text","Loading: "+sett.getString("selectedShoutcastName","Radio 3FM"));
				ni.putExtra("ongoing",true);
			context.sendBroadcast(ni);
			/**/
			
			// Toast.makeText(context, "FMAlarm Buffering: "+sett.getString("selectedShoutcastName","Radio 3FM"),Toast.LENGTH_LONG).show();
			
			}
		catch (IllegalArgumentException e) { 
			Toast.makeText(context, "FMAlarm2 MP IllArgumentException:\n"+e,Toast.LENGTH_LONG).show();
			Log.w(LOGTAG," -> MP Init IllegalArgumentException!", e);
			initHasFailed = true;
        	}
		catch (IllegalStateException e) { 
			Toast.makeText(context, "FMAlarm2 MP IllStateException:\n"+e,Toast.LENGTH_LONG).show();
			Log.w(LOGTAG," -> MP Init IllegalStateException", e);
			initHasFailed = true;
			} 
		catch (IOException e) { 
			Toast.makeText(context, "FMAlarm2 MP IOException:\n"+e,Toast.LENGTH_LONG).show();
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
	public void destroy() {
		
		Log.d(LOGTAG," -> MPMGR.Destroy()");
		
		// Stop & store
		stopConnTypeChecker();
		
		if (mp!=null) { mp.release(); mp = null; }
		if (proxy!=null) { proxy.stop(); proxy = null; }
		
		settEditor.putInt("mediaplayerState",MEDIA_NONE);
		settEditor.putInt("mediastreamer_state",MEDIA_NONE);
		settEditor.commit();

		// Notify
		/* TODO: Notification
		Intent ni = new Intent(context, RecvNotifier.class);
			ni.putExtra("cancel",true);
		context.sendBroadcast(ni);
		/**/
		
		}
	
	// PAUSE
	public void pause() {
		stopConnTypeChecker();
		if (mp==null) { return; }
		mp.stop();
		}
	
	// RESUME
	public void resume() {
		if (mp==null) { return; }
		mp.prepareAsync();
		}
	
	// ISPLAYING
	public boolean isPlaying() {
		return mp.isPlaying();
		}
	
	// --------------------------------------------------
	// Listeners
	
	// MEDIA OnPreparedListener
	private OnPreparedListener onPreparedListener = new OnPreparedListener() {
		
		// @Override
		public void onPrepared(MediaPlayer mp) {
			
			Log.d(LOGTAG," -> MP.OnPrepared");
			
			// Start & store
			
			mp.start();
			
			settEditor.putInt("mediaplayerState",MEDIA_RUNNING);
			settEditor.putInt("mediastreamer_state",MEDIA_RUNNING);
			settEditor.commit();
			
			// Notify
			/* TODO: Notification
			Intent ni = new Intent(context, RecvNotifier.class);
				ni.putExtra("ticker","FMAlarm Active ("+sett.getString("selectedShoutcastName","Radio 3FM")+")");
				ni.putExtra("title","FMAlarm is active...");
				ni.putExtra("text","Playing: "+sett.getString("selectedShoutcastName","Radio 3FM"));
				ni.putExtra("ongoing",true);
			context.sendBroadcast(ni);
			/**/
			
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
				init(streamedUrl);
				
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
		public boolean onInfo(MediaPlayer mediaplayer, int arg1, int arg2) {
			Log.d(LOGTAG," -> MP.OnInfo(" + arg1 + ", " + arg2 + ")");
			// Unimportant ?
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
			settEditor.putInt("mediastreamer_state",MEDIA_NONE);
			settEditor.commit();
			
			Log.d(LOGTAG," -> Restarting stream...");
			init(streamedUrl);
			
			return false;
			}
		
		};
		
		// --------------------------------------------------
		// CONN TYPE CHECKER
		
		// MediaPlayerChecker
		// Handle data-connection / wifi
		
		private int connTypeOld = -1;
		private boolean connWasLost = false;

		// Stop Conn Type Checker
		private void stopConnTypeChecker() {
			Log.d(LOGTAG," -> stopConnTypeChecker()");
			if (timer!=null) { timer.cancel(); }
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
			
			Log.i(LOGTAG,"ConnTypeChecker");
			
			int connType;
			
			// NetworkInfo
			NetworkInfo netwInfo = connMgr.getActiveNetworkInfo();
			NetworkInfo netwInfoCell = connMgr.getNetworkInfo(0);
			
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
					if(proxy!=null) { proxy.stop(); proxy=null; }
					connWasLost=true;
					return;
					}
				
				}
			catch (Exception e) {
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
				init(streamedUrl);
				
				}
			
			// Handle Connection losses
			if (netwInfo != null && netwInfo.getState() == NetworkInfo.State.CONNECTED) {
				if (connWasLost) {
					Log.d(LOGTAG," -> Stream resumed");
					connWasLost=false;
					init(streamedUrl);
					}
				}
			else {
				Log.d(LOGTAG," -> Connection lost. Stream paused");
				if(mp!=null) { mp.release(); mp=null; }
				if(proxy!=null) { proxy.stop(); proxy=null; }
				connWasLost=true;
				}
			
			}
		
		
		
		// --- END ---
	
	}










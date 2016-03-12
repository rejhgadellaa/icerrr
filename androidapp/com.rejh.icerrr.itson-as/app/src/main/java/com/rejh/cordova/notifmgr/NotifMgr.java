package com.rejh.cordova.notifmgr;

/**
* A phonegap plugin that playes icecast/shoutcast streams
*
* @author REJH Gadellaa
* @lincese MIT.
* 
*/

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;
import android.os.StrictMode;
import android.os.StrictMode.ThreadPolicy;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;
import android.util.Log;

public class NotifMgr extends CordovaPlugin {
	
	// --- Variables
	
	final static String APPTAG = "NotifMgr";
	
	public Notification notifObj;
	
	private Context context;
	
	private SharedPreferences sett;
	private SharedPreferences.Editor settEditor;
	
	private String packageName;
	
	// --- Execute@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext, Context _context) {
		context = _context;
		try {
			return execute(action, args, callbackContext);
		} catch (JSONException e) {
			Log.e(APPTAG," > JSONException",e);
        	e.printStackTrace();
        	return false;
        }
	}
	
	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG, APPTAG+" > execute");
        
        // > Setup
        
        // Context
        if (context==null) { context = this.cordova.getActivity(); }
        
        // Preferences
        sett = context.getSharedPreferences(APPTAG,2);
        settEditor = sett.edit();
        
        // PackageName
        packageName = context.getPackageName();

        // > Check action
        
        if (action==null) {
        	if (callbackContext!=null) { callbackContext.error("Action is null"); }
            return false;
        }
        
        //Log.d(APPTAG," -> "+ action);
        
        // > A GOGO
        
        try {
            
            // Make
            if (action.equals("make")) {
                make(args,callbackContext);
            }
            
            // Cancel
            else if (action.equals("cancel")) {
                cancel(args,callbackContext);
            }
            
            // Cancel all
            else if (action.equals("cancelAll")) {
                cancelAll(args,callbackContext);
            }
            
            // Whut??
            else {
            	if (callbackContext!=null) { callbackContext.error("NotifMgr: Action contains invalid value: "+ action); }
                return false;
            }
            
        	
        } catch (JSONException e) {
	    	Log.e(APPTAG, "JSONException!",e);
        	e.printStackTrace();
        	return false;
        } catch (Exception e) {
	    	Log.e(APPTAG, "Exception!",e);
	        e.printStackTrace();
	        return false;
	    } catch (Error e) {
	    	Log.e(APPTAG, "Error!",e);
	        e.printStackTrace();
	        return false;
	    }
		
		return false;
        
    }
    
    // Make
    public void make(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > Make");
        
        // Check arguments
        JSONObject obj = args.getJSONObject(0);
        if (obj==null) { 
        	if (callbackContext!=null) { callbackContext.error("argobj is null"); }
        	return; 
        }
        
        // Get args
        // Example: Uri uri = obj.has("url") ? Uri.parse(obj.getString("url")) : null;
        try {
        	
        	// Required
        	int id = obj.has("id") ? obj.getInt("id") : -1;
        	String title = obj.has("title") ? obj.getString("title") : null;
        	String message = obj.has("message") ? obj.getString("message") : null;
        	String smallicon = obj.has("smallicon") ? obj.getString("smallicon") : null;
        	
        	//String intentClassName = obj.has("intentClassName") ? obj.getString("intentClassName") : null; // TODO: should be able to use 'com.rejh.icerr.doirdapp.MAIN_ACTIVITY'
        	
        	// Optional
			boolean isMedia = obj.has("isMedia") ? obj.getBoolean("isMedia") : false;
        	String color = obj.has("color") ? obj.getString("color") : "#999999";
        	String largeicon = obj.has("largeicon") ? obj.getString("largeicon") : null;
        	String ticker = obj.has("ticker") ? obj.getString("ticker") : title;
        	int priority = obj.has("priority") ? getPriority(obj.getString("priority")) : NotificationCompat.PRIORITY_DEFAULT;
        	boolean autoCancel = obj.has("autoCancel") ? obj.getBoolean("autoCancel") : false;
        	boolean ongoing = obj.has("ongoing") ? obj.getBoolean("ongoing") : false;
        	boolean alertOnce = obj.has("alertOnce") ? obj.getBoolean("alertOnce") : false;
        	
        	// Intent
        	JSONObject intentopts = obj.has("intent") ? obj.getJSONObject("intent") : null;
        	if (intentopts==null) {
        		// Defaults...?
        		if (callbackContext!=null) { callbackContext.error("Missing arg: intent{}"); }
        		return;
        	}
    		JSONArray intentExtras = intentopts.has("extras") ? intentopts.getJSONArray("extras") : null;
        	
        	// Actions
        	JSONArray actions = obj.has("actions") ? obj.getJSONArray("actions") : null;
        	
	        // Check required args
	        if (id==-1 || message==null || title==null || smallicon==null) {
	        	Log.e(APPTAG," -> Missing argsobj param: id, msg, title, smallicon?");
	        	if (callbackContext!=null) { callbackContext.error("Missing argsobj param: id, msg, title?"); }
	        	return;
	        }
	        
	        // > Required
        
	        // Start building...
	        NotificationCompat.Builder builder = new NotificationCompat.Builder(context);
	        
	        // Title, message
	        builder.setContentTitle(title);
	        builder.setContentText(message);
	        
	        // Icon // TODO: parse string to resInt
	        if (smallicon!=null) { builder.setSmallIcon(getSmallIcon(smallicon)); }
	        
	        // Intent // TODO: a lot.
	        PendingIntent notifPendingIntent = createPendingIntent(intentopts, intentExtras, id);
	        builder.setContentIntent(notifPendingIntent);
	        
	        // > Optionals

			// Media
			if (isMedia && Build.VERSION.SDK_INT>=21) {
				// TODO: builder.setStyle(new Notification.MediaStyle());
                // http://developer.android.com/guide/topics/ui/notifiers/notifications.html#controllingMedia
			}
	        
	        // Color (5.0)
	        builder.setColor(Color.parseColor(color));
	        
	        // Large icon
	        if (largeicon!=null) { 
	        	Bitmap largeIconBmp = getIcon(largeicon);
	        	if (largeIconBmp!=null) {
	        		int scaleToSize = (int) context.getResources().getDimension(android.R.dimen.notification_large_icon_height);
	        		Bitmap scaledLargeIconBmp = Bitmap.createScaledBitmap(largeIconBmp, scaleToSize, scaleToSize, true);
	        		builder.setLargeIcon(getCircleBitmap(scaledLargeIconBmp));
	        		largeIconBmp.recycle();
	        	}
	        } // TODO: create bitmap
	        
	        // Ticker
	        builder.setTicker(ticker);
	        
	        // Prio
	        builder.setPriority(priority);
	        if (priority>=NotificationCompat.PRIORITY_HIGH) {
	        	//builder.setDefaults(NotificationCompat.DEFAULT_VIBRATE);
	        }
	        
	        // Autocancel, ongoing, alertOnce
	        builder.setAutoCancel(autoCancel);
	        builder.setOngoing(ongoing);
	        builder.setOnlyAlertOnce(alertOnce);
	        
	        // Actions
	        if (actions!=null) {
	        	for (int i=0; i<actions.length(); i++) {
	        		// Prep
	        		JSONObject action = actions.getJSONObject(i);
	        		int actionIcon = getSmallIcon(action.getString("icon"));
	        		CharSequence actionTitle = (CharSequence) action.getString("title");
	        		Log.d(APPTAG," >> "+ actionTitle);
	        		JSONObject actionIntent = action.getJSONObject("intent");
	        		JSONArray actionIntentExtras = actionIntent.has("extras") ? actionIntent.getJSONArray("extras") : null;
	        		PendingIntent actionPendingIntent = createPendingIntent(actionIntent,actionIntentExtras,i+1+(100*id));
	        		// Build..
	        		NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(actionIcon, actionTitle, actionPendingIntent);
	        		NotificationCompat.Action builtAction = actionBuilder.build();
	        		// Add
	        		builder.addAction(builtAction);
	        	}
	        }
	        
	        // Kablooie
	        NotificationManagerCompat notifMgr = NotificationManagerCompat.from(context);
	        notifObj = builder.build();
	        if (obj.has("onlybuild")) {
	        	Log.d(APPTAG," > Only build notification...");
	        } else {
	        	notifMgr.notify(id, notifObj);
	        }
	        
	        if (callbackContext!=null) { callbackContext.success("OK"); }
		
        } catch (Exception e) {
		Log.e(APPTAG," -> Error parsing argsobj",e);
		Log.e(APPTAG,e.toString());
		e.printStackTrace();
		if (callbackContext!=null) { callbackContext.error("Error parsing argsobj"); }
		return;
		}
        
    }
    
    // Cancel
    public void cancel(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > Cancel");
        
        // Args
        JSONObject argObj = args.getJSONObject(0);
        int id = argObj.has("id") ? argObj.getInt("id") : -1;
        
        if (id<0) { Log.e(APPTAG," > Cannot cancel notification without an id: "+ id); return; }
        
        // Cancel
        NotificationManager notifMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notifMgr.cancel(id);
        
        if (callbackContext!=null) { callbackContext.success("OK"); }
        
    }
    
    // CancelAll
    public void cancelAll(JSONArray args, CallbackContext callbackContext) throws JSONException {
        
        Log.d(APPTAG," > CancelAll");
        
        NotificationManager notifMgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notifMgr.cancelAll();
        
        if (callbackContext!=null) { callbackContext.success("OK"); }
        
    }
    
    // ...
    
    // --------------------------------------------------
    // --- PRIVATE METHODS, HELPERS
    
    // > Intents
    
    // Create Pending Intent (with extras!)
    private PendingIntent createPendingIntent(JSONObject intentCfg, JSONArray intentExtras, int requestCode) throws JSONException {

    	// New intent
	    Intent notifIntent = new Intent();
	    
	    // > Figure what type of intent
	    
	    // By classname
	    if (intentCfg.has("package") && intentCfg.has("classname")) {
	    	String intentPackage = intentCfg.getString("package");
	    	String intentClassName = intentCfg.getString("classname");
	    	Log.d(APPTAG," -> Intent by classname: "+intentClassName);
	    	notifIntent.setClassName(intentPackage, intentClassName);
	    }
	    
	    // By action
	    if (intentCfg.has("package") && intentCfg.has("action")) {
	    	String intentPackage = intentCfg.getString("package");
	    	String action = intentCfg.getString("action");
	    	Log.d(APPTAG," -> Intent by action: "+action);
	    	notifIntent.setPackage(intentPackage);
	    	notifIntent.setAction(action);
	    	Log.d(APPTAG," ---> "+notifIntent.getAction());
	    }
	    
	    
	    // Extras
	    if (intentExtras!=null) {
			for (int i=0; i<intentExtras.length(); i++) {
				JSONObject intentExtra = intentExtras.getJSONObject(i);
				String type = intentExtra.getString("type").toLowerCase();
				String name = intentExtra.getString("name");
				if (type.equals("string")) {
					Log.d(APPTAG," >> Extra: "+ type +", "+ name +", "+ intentExtra.getString("value"));
					notifIntent.putExtra(name, intentExtra.getString("value"));
				} else if (type.equals("int")) {
					notifIntent.putExtra(name, intentExtra.getInt("value"));
				} else if (type.equals("float") || type.equals("double")) {
					notifIntent.putExtra(name, intentExtra.getDouble("value"));
				} else if (type.equals("boolean") || type.equals("bool")) {
					notifIntent.putExtra(name, intentExtra.getBoolean("value"));
				}
			}
		}
	    
	    // Figure type
	    String intentType = intentCfg.has("type") ? intentCfg.getString("type") : "activity";
	    
	    PendingIntent notifPendingIntent = null;
	    if (intentType.equals("activity")) {
	    	notifPendingIntent = PendingIntent.getActivity(context, requestCode, notifIntent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
	    } else if (intentType.equals("receiver")) {
	    	notifPendingIntent = PendingIntent.getBroadcast(context, requestCode, notifIntent, PendingIntent.FLAG_UPDATE_CURRENT); // TODO: options!
	    } else if (intentType.equals("service")) {
	    	notifPendingIntent = PendingIntent.getService(context, requestCode, notifIntent, PendingIntent.FLAG_UPDATE_CURRENT);
	    }
	    
	    return notifPendingIntent;
	    		
    }
    
    // > Priority
    
    private int getPriority(String priority) {
    	
    	int res = NotificationCompat.PRIORITY_DEFAULT; // DEFAULT
    	
    	if (priority.equals("MAX")) {
    		res = NotificationCompat.PRIORITY_MAX;
    	} else if (priority.equals("HIGH")) {
    		res = NotificationCompat.PRIORITY_HIGH;
    	} else if (priority.equals("DEFAULT")) {
    		res = NotificationCompat.PRIORITY_DEFAULT;
    	} else if (priority.equals("LOW")) {
    		res = NotificationCompat.PRIORITY_LOW;
    	} else if (priority.equals("MIN")) {
    		res = NotificationCompat.PRIORITY_MIN;
    	}
    	
    	return res;
    	
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
    	//Log.d(APPTAG,"getIconFromURL");
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
            e.printStackTrace();
        }

        StrictMode.setThreadPolicy(origMode);

        return bmp;
    }
    
    private Bitmap getIconFromRes (String icon) {
    	//Log.d(APPTAG,"getIconFromRes");
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
        	Log.e(APPTAG," -> Exception: "+ src +", "+ e);
            e.printStackTrace();
        }

        return bmp;
    }
    
    private Bitmap getCircleBitmap(Bitmap bitmap) {
    	Log.d(APPTAG," -> Create CircleBitmap "+ bitmap.getWidth() +", "+ bitmap.getHeight());
    	final Bitmap output = Bitmap.createBitmap(bitmap.getWidth(),
    	bitmap.getHeight(), Bitmap.Config.ARGB_8888);
    	final Canvas canvas = new Canvas(output);

    	final int color = Color.RED;
    	final Paint paint = new Paint();
    	final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
    	final RectF rectF = new RectF(rect);
    	
    	paint.setAntiAlias(true);
    	canvas.drawARGB(0, 0, 0, 0);
    	paint.setColor(color);
    	canvas.drawOval(rectF, paint);

    	paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
    	canvas.drawBitmap(bitmap, rect, rect, paint);

    	bitmap.recycle();

    	return output;
    }
    
    
    
}
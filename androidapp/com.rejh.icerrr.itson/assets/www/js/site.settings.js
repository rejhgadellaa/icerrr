
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.settings = {};

// ---> Init

site.settings.init = function(initApp) {
	
	loggr.debug("site.settings.init()");
	
	// goto section
	site.ui.gotosection("#settings");
	
	// Init + Close callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.settings.onpause);
	site.lifecycle.addOnResumeCb(site.settings.onresume);
	
	// Reg listeners
	site.settings.registerListeners();
	
}

// ---> OnPause, OnResume

site.settings.onresume = function() {
	loggr.log("site.settings.onresume()");
}

site.settings.onpause = function() {
	loggr.log("site.settings.onpause()");
}

// ---> Listeners

site.settings.registerListeners = function() {
	
	loggr.debug("site.settings.registerListeners()");
	
	// ---> Update
	
	// Show Station Icon
	window.mediaStreamer.getSetting("bool","showStationIcon",
		function(res) {
			if (res) { $("#settings input[name='showStationIcon']").attr("checked",true); }
			else { $("#settings input[name='showStationIcon']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
	// Show Album Art
	var showAlbumArt = site.cookies.get("setting_showAlbumArt");
	loggr.log(" > showAlbumArt: "+ showAlbumArt);
	if (showAlbumArt==1) { $("#settings input[name='showAlbumArt']").attr("checked",true); }
	else { $("#settings input[name='showAlbumArt']").attr("checked",false); }
	
	// Colorize Album Art
	var colorizeAlbumArt = site.cookies.get("setting_colorizeAlbumArt");
	loggr.log(" > colorizeAlbumArt: "+ colorizeAlbumArt);
	if (colorizeAlbumArt==1) { $("#settings input[name='colorizeAlbumArt']").attr("checked",true); }
	else { $("#settings input[name='colorizeAlbumArt']").attr("checked",false); }
	
	// Use Speaker Phone For Alarms
	window.mediaStreamer.getSetting("bool","useSpeakerForAlarms",
		function(res) {
			if (res) { $("#settings input[name='useSpeakerForAlarms']").attr("checked",true); }
			else { $("#settings input[name='useSpeakerForAlarms']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
	// Use Wifi
	window.mediaStreamer.getSetting("bool","useWifi",
		function(res) {
			if (res) { $("#settings input[name='useWifi']").attr("checked",true); }
			else { $("#settings input[name='useWifi']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
	// Use SAA
	window.mediaStreamer.getSetting("bool","useSAA",
		function(res) {
			if (res) { $("#settings input[name='useSAA']").attr("checked",true); }
			else { $("#settings input[name='useSAA']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
	// Enable LogCat Debugging
	var enableLogCatDebugging = site.cookies.get("setting_enableLogCatDebugging")
	if (enableLogCatDebugging==1) { $("#settings input[name='enableLogCatDebugging']").attr("checked",true); }
	else { $("#settings input[name='enableLogCatDebugging']").attr("checked",false); }
	
	// Send Logs
	var sendLogs = site.cookies.get("setting_sendLogs");
	loggr.log(" > sendLogs: "+ sendLogs);
	if (sendLogs==1) { $("#settings input[name='sendLogs']").attr("checked",true); }
	else { $("#settings input[name='sendLogs']").attr("checked",false); }
	
	// ---> Listener
	
	// Shot Station Icon
	$("#settings input[name='showStationIcon']").off("change");
	$("#settings input[name='showStationIcon']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: showStationIcon: "+ (targ.checked)?1:0);
		site.cookies.put("setting_showStationIcon",(targ.checked)?1:0);
		window.mediaStreamer.setting("bool","showStationIcon",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	});
	
	// Shot Album Art
	$("#settings input[name='showAlbumArt']").off("change");
	$("#settings input[name='showAlbumArt']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: showAlbumArt: "+ (targ.checked)?1:0);
		site.cookies.put("setting_showAlbumArt",(targ.checked)?1:0);
	});
	
	// Colorize Album Art
	$("#settings input[name='colorizeAlbumArt']").off("change");
	$("#settings input[name='colorizeAlbumArt']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: colorizeAlbumArt: "+ (targ.checked)?1:0);
		site.cookies.put("setting_colorizeAlbumArt",(targ.checked)?1:0);
		$("#home .station_image_color").css("background","none");
		$("#home .main .station_image").css("background-image","url('img/bg_home_default.jpg')");
		$("#home .main .station_image img").css("opacity",1.0);
		site.vars.currentAlbumArtPath = null;
	});
	
	// Use Speaker Phone For Alarms
	$("#settings input[name='useSpeakerForAlarms']").off("change");
	$("#settings input[name='useSpeakerForAlarms']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: useSpeakerForAlarms: "+ (targ.checked));
		window.mediaStreamer.setting("bool","useSpeakerForAlarms",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	});
	
	// Use Wifi
	$("#settings input[name='useWifi']").off("change");
	$("#settings input[name='useWifi']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: useWifi: "+ (targ.checked));
		window.mediaStreamer.setting("bool","useWifi",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	});
	
	// Use SAA
	$("#settings input[name='useSAA']").off("change");
	$("#settings input[name='useSAA']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: useSAA: "+ (targ.checked));
		window.mediaStreamer.setting("bool","useSAA",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
		if ((targ.checked)) {
			alert("Don't forget to set SAA's ringtone to 'silent'!");
		}
	});
	
	// Enable LogCat Debugging
	$("#settings input[name='enableLogCatDebugging']").off("change");
	$("#settings input[name='enableLogCatDebugging']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: enableLogCatDebugging: "+ (targ.checked)?1:0,{toconsole:true});
		site.cookies.put("setting_enableLogCatDebugging",(targ.checked)?1:0);
	});
	
	// Send Logs
	$("#settings input[name='sendLogs']").off("change");
	$("#settings input[name='sendLogs']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: sendLogs: "+ (targ.checked)?1:0);
		site.cookies.put("setting_sendLogs",(targ.checked)?1:0);
		loggr.log(" > "+ site.cookies.get("setting_sendLogs"));
	});
	
}

// ---> Store

site.settings.store = function() {
	
	loggr.log("site.settings.store()");
	site.cookies.put("data_settings",JSON.stringify(site.data.settings));
	
}

// ---> Export, import

site.settings.exportStationsData = function() {
	
	loggr.debug("site.settings.exportStationsData()");
	
	var filename = "icerrr.stations.exp."+ new Date().format("Y-m-d.H-i-s") +".json";
	
	// Write file to storage..
	site.storage.writefile(site.cfg.paths.json,filename,JSON.stringify(site.data.stations),
		function(evt) {
			
			// Get fileEntry
			site.storage.getFileEntry(site.cfg.paths.json,filename,
				function(fileEntry) {
					
					// Prep intent extras
					var extras = {};
					extras[window.plugins.webintent.EXTRA_STREAM] = fileEntry.fullPath;
					
					// Prep params
					var params = {
						action: window.plugins.webintent.ACTION_SEND,
						type: 'text/text',
						extras: extras
					}
					
					// A-go-go
					window.plugins.webintent.startActivity(params,function(){},function(){ alert("An error occured");});
					
				},
				function(fileError) {
					alert("Could not read stations file: "+ site.storage.getErrorType(fileError));
				}
			);
		},
		function(fileError) {
			alert("Could not write stations file: "+ site.storage.getErrorType(fileError));
		}
	);
	
}

site.settings.importStationsData = function() {
	
	loggr.debug("site.settings.importStationsData()");
	
	window.fileChooser.filePicker(
		function(uri) {
			
			// site.ui.showloading(null,"Reading file...");
			
			// Filename..
			var filename = uri.substr(uri.lastIndexOf("/")+1);
			
			// Filepath..
			// -> Relative :S
			var filepath = uri.substr(0,uri.lastIndexOf("/"));
			if (filepath.indexOf("file://")==0) {
				filepath = filepath.substr(7);
			}
			
			// Log
			loggr.log(" > "+ filepath);
			loggr.log(" > "+ filename);
			
			// Get file entry..
			site.storage.getFileEntry(filepath,filename,
				function(fileEntry) {
							
					// Read file entry okay!
					loggr.log("site.settings.importStationsData().gotFileEntry :D");
					
					site.storage.readfile(filepath,filename,
						function(jsons) {
							
							// Read file okay!
							loggr.log("site.settings.importStationsData().gotFile :D");
							
							// Parse json
							var json = JSON.parse(jsons);
							
							// Check file == json
							if (!json || !json[0]) {
								alert("File contents cannot be parsed to json data :(");
								site.ui.hideloading();
								return;
							}
							if (!json[0]) {
								alert("File contents cannot be parsed to json data of type array :(");
								site.ui.hideloading();
								return;
							}
							if (!json[0].station_id) {
								alert("File contents cannot be parsed to valid station data :(");
								loggr.log(jsons);
								site.ui.hideloading();
								return;
							}
							
							// Copy current stations.jsoon so we can restore it.. (yea.. I know)
							site.vars.stationsBackupFilename = "stations.bck."+ new Date().format("Y-m-d.H-i-s") +".json";
							site.storage.writefile(site.cfg.paths.json,site.vars.stationsBackupFilename,JSON.stringify(site.data.stations),
								function(evt) { 
								
								// Backup okay!
								loggr.log("site.settings.importStationsData().gotBackup :D");
									
									// Overwrite stations data...?!
									var conf = confirm("Are you sure you want to continue restoring "+ json.length +" stations?");
									
									var newstations = site.helpers.mergeStations(site.data.stations,json);
									
									// Okay
									if (conf) {
										
										site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(newstations),
											function(evt) { 
												alert("Your stations have been restored! Tap OK to restart.");
												window.location.reload();
												return;
											},
											function(fileError) {
												alert("Could not write backup of stations data: "+ site.storage.getErrorType(fileError));
												site.ui.hideloading();
												return;
											}
										);
										
									}
									// Nope
									else {
										site.ui.hideloading();
										return;
									}
									
								},
								function(err) {
									alert("Could not write backup of stations data: "+ site.storage.getErrorType(fileError));
									site.ui.hideloading();
									return;
								}
							);
							
						},
						function(fileError) {
							alert("Could not read file: "+ fileError.code +", "+ site.storage.getErrorType(fileError) +"\n"+ uri);
							site.ui.hideloading();
							return;
						},
						{readOutsideRoot:true,file:{readAsBinaryString:false}} // TODO: Remove readAsBinary
					);
					
				},
				function(fileError) {
					alert("Could not read file entry: "+ fileError.code +", "+ site.storage.getErrorType(fileError) +"\n"+ uri);
					site.ui.hideloading();
					return;
				},
				{readOutsideRoot:true,path:{create:false},file:{create:false}}
				
			);
			
		},
		function(err) {
			alert("An error occured: "+err);
			site.ui.hideloading();
			console.error(err);
		}
	);
	
}

// ---> Help

site.settings.helpSimple = function() {
	loggr.error("site.settings.helpSimple() > Empty stub");
}

site.settings.helpUseWifi = function() {
	loggr.log("site.settings.helpUseWifi()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Always turn on WiFi\n\n"
		+"When enabled, Icerrr will always turn on WiFi when a stream is started to limit data usage as much as possible.\n\n"
		+"WiFi will always be turned on when alarms fire, ignoring this setting.\n\n"
		+"Note: It is recommended to leave this option enabled."
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpUseSpeakerForAlarms = function() {
	loggr.log("site.settings.helpUseSpeakerForAlarms()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Force alarms through speaker\n\n"
		+"When enabled, Icerrr will always use the built-in speaker when alarms fire.\n\n"
		+"This prevents the alarm to play through any connected accessoires like headphones, BT headsets, etc.\n\n"
		+"Note: It is recommended to leave this option enabled."
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpShowAlbumArt = function() {
	loggr.log("site.settings.helpShowAlbumArt()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Show album art\n\n"
		+"Icerrr can search and show album art based on the 'now playing' information (if any) of a stream.\n\n"
		+"However, since (most) album art is copyrighted this feature is disabled by default because Icerrr could be held responsible for showing artwork it is not licensed to show. If you enable this option, you agree that Icerrr searches and shows this album art on your behalf and not to the benefit of the developer.\n\n"
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpShowStationIcon = function() {
	loggr.log("site.settings.helpShowStationIcon()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Show station icon\n\n"
		+"When disabled Icerrr will no longer show station icons in the app and lockscreen"
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpSaa = function() {
	loggr.log("site.settings.helpSaa()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Sleep As Android integration\n\n"
		+"If this option is enabled, Icerrr will respond to the following events generated by Sleep As Android (SAA): alarm start, stop and snooze.\n\n"
		+"Usage: enable this option and set up one or more alarms in Sleep As Android. Now, when SAA has detected that it's a good time to wake you up Icerrr will start the last station you listened to. You can then use SAA's snooze and dismiss buttons to (temporary) stop the stream."
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpSendLogs = function() {
	loggr.log("site.settings.helpSendLogs()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Send error logs\n\n"
		+"Help improve Icerrr by automatically sending logs to the developer whenever an error occurs.\n\n"
		+"Regarding your privacy: Logs include information to identify your device so the developer can find other logs from your device (if any). However, to protect your privacy, this information is encrypted and can only be compared between (Icerrr's) logs and can not (easily) be used to trace them back to you."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}











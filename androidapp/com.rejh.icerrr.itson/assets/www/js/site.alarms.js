
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL LIST

site.alarms = {};

// ---> Init

site.alarms.init = function() {
	
	loggr.info("------------------------------------");
	loggr.info("site.alarms.init()");
	
	// Check stations
	if (!site.data.stations) {
		site.alarms.readstations();
		return;
	}
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#channellist");
	
	// Show UI
	site.ui.gotosection("#alarms");
	
	// Get alarm data..
	if (!site.session.alarms) { site.session.alarms = []; }
	
	// Draw
	site.alarms.drawResults();
	
}

// ---> Draw

site.alarms.drawResults = function() {
	
	loggr.info("site.alarms.drawResults()");
	
	var alarms = site.session.alarms;
	
	// TMP, test alarm
	/*
	site.session.alarms = alarms = [{
		id:"tralala",
		alarm_id:0,
		hour: 10,
		minute: 5,
		repeat: true,
		repeatCfg: [0,1,1,1,1,1,1],
		station: site.session.currentstation
	}]
	/**/
	
	if (alarms.length<1) {
		loggr.log(" > No alarms set..");
		$("#alarms .main").html('<div class="center_table"><div class="center_td"><div style="width:280px; margin:auto; color:rgba(0,0,0,0.54);">You have no alarms set</div></div></div>');
		return;
	}
	
	$("#alarms .main").html("");
	
	// Foreach
	for (var i=0; i<alarms.length; i++) {
		
		var alarm = alarms[i];
		if (!alarm) { continue; } // TODO: Huh?
		
		loggr.log(" >> "+ alarm.station.station_name);
		
		// Build item
		var resultitem = document.createElement("div");
		resultitem.className = "resultitem activatablel";
		resultitem.id = "alarm_resultitem_"+ alarm.station.station_id;
		resultitem.edit_id = alarm.id;
		resultitem.alarm_id = alarm.alarm_id;
		resultitem.station_id = alarm.station.station_id;
		
		var resulticon = document.createElement("img");
		resulticon.className = "resulticon";
		if (alarm.station.station_icon_local && alarm.station.station_icon_local.indexOf(".base64")<0) { 
			resulticon.src = alarm.station.station_icon_local; // : site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ alarm.station.station_icon;
		} else {
			// try upgrade image from site.data.stations
			var stationIndex = site.helpers.session.getStationIndexById(alarm.station.station_id);
			if (stationIndex<0) { resulticon.src = site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ alarm.station.station_icon; return; }
			if (site.data.stations[stationIndex].station_icon_local && site.data.stations[stationIndex].station_icon_local.indexOf(".base64")<0) { 
				alarm.station = site.data.stations[stationIndex];
				site.session.alarms[i] = alarm;
				resulticon.src = alarm.station.station_icon_local;
				site.helpers.storeSession();
			} else {
				loggr.warn(" > No local icon for station: "+ alarm.station.station_name +", "+ site.data.stations[stationIndex].station_icon_local);
				resulticon.src = site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ alarm.station.station_icon;
			}
		}
		
		
		var resultname = document.createElement("div");
		resultname.className = "resultname";
		resultname.innerHTML = ""
			+ site.helpers.formatNum(alarm.hour) +":"+ site.helpers.formatNum(alarm.minute) +", "
			+ alarm.station.station_name;
		
		var resultsub = document.createElement("div");
		resultsub.className = "resultsub";
		resultsub.innerHTML = ""
			+ site.alarms.genRepeatString(alarm.repeat,alarm.repeatCfg);// TODO: events.. anyone?
			
		// Events
		resultitem.onclick = function(){
			site.alarms.edit(this); // well, here's one..
		};
		
		// Append
		resultitem.appendChild(resulticon);
		resultitem.appendChild(resultname);
		resultitem.appendChild(resultsub);
		
		$("#alarms .main").append(resultitem);
		
	}
	
	// Build item spacer for fab
	var resultitem = document.createElement("div");
	resultitem.className = "resultitem resultitem_spacer";
	$("#alarms .main").append(resultitem);
	
}

// ---> Add

site.alarms.add = function() {
	
	loggr.info("------------------------------------");
	loggr.info("site.alarms.add()");
	
	site.lifecycle.add_section_history("#alarms_add");
	site.ui.gotosection("#alarms_add");
	
	$("#alarms_add .action.trash").css("display","none");
	
	// Update form
	site.alarms.updateForm();
	
}

// ---> Edit

site.alarms.edit = function(obj) {
	
	loggr.info("------------------------------------");
	loggr.info("site.alarms.edit()");
	
	var id = obj.edit_id;
	var alarm_id = obj.alarm_id;
	
	site.lifecycle.add_section_history("#alarms_add");
	site.ui.gotosection("#alarms_add");
	
	$("#alarms_add .action.trash").css("display","block");
	
	// Find alarm
	var alarmCfg = null;
	for (var i in site.session.alarms) {
		if (site.session.alarms[i]["id"]==id) {
			alarmCfg = site.session.alarms[i];
			break;
		}
	}
	
	// Update form
	site.alarms.updateForm(alarmCfg);
	
}

// ---> Save

site.alarms.save = function(silenced) {
	
	loggr.info("site.alarms.save()");
	
	var alarmCfg = site.alarms.newAlarmCfg;
	
	loggr.log(" > "+JSON.stringify(alarmCfg));
	
	// Check if new or overwrite
	var alarmIndex = -1;
	for (var i in site.session.alarms) {
		var analarm = site.session.alarms[i];
		if (!analarm) { continue; }
		if (analarm.id == alarmCfg.id) {
			alarmIndex = i;
			break;
		}
	}
	
	// Store
	if (alarmIndex>=0) {
		loggr.log(" > Overwrite: "+ alarmIndex);
		site.session.alarms[alarmIndex] = alarmCfg;
	} else {
		loggr.log(" > New");
		site.session.alarms.push(alarmCfg);
	}
	
	// Set alarm...
	site.alarms.setAlarm(null,alarmCfg);
	
	// Toast!
	if (!silenced) { site.ui.showtoast("Alarm saved"); }
	else {
		site.ui.showtoast("Saved it!",0.5);
	}
	
	$("#alarms_add .action.trash").css("display","block");
	
}

// ---> Remove

site.alarms.remove = function(dontask) {
	
	loggr.info("site.alarms.remove()");
	
	if (!dontask) {
		if (!confirm("Are you sure you want to remove this alarm?")) {
			return;
		}
	}
	
	var alarmCfg = site.alarms.newAlarmCfg;
	
	// Check if new or overwrite
	var alarmIndex = -1;
	for (var i in site.session.alarms) {
		var analarm = site.session.alarms[i];
		if (!analarm) { continue; }
		if (analarm.id == alarmCfg.id) {
			alarmIndex = i;
			break;
		}
	}
	
	if (alarmIndex<0 && !dontask) {
		loggr.error(" > Could not find alarm by id: "+ alarmCfg.id);
		return;
	}
	
	// Build new alarm list
	newAlarms = [];
	if (!site.session.alarms) { site.session.alarms = []; }
	for (var i=0; i<site.session.alarms.length; i++) {
		if (i!=alarmIndex) { newAlarms.push(site.session.alarms[i]); }
	}
	
	// Store
	site.session.alarms = newAlarms;
	
	// Cancel alarm
	window.alarmMgr.cancel(
		function(msg) {
			if (!dontask) { site.ui.showtoast("Alarm removed"); }
			if (!dontask) { site.lifecycle.onBackButton(); }
			site.alarms.writesession();
			site.alarms.setAlarms();
		},
		function(err) {
			loggr.error(err);
			alert(err);
		},
		{id:alarmCfg.alarm_id}
	);
	
}

// ---> Set Alarms

// An Alarm

site.alarms.setAlarm = function(alarm_id,alarm) {
	
	alarm_id = (alarm!=null) ? alarm.alarm_id : alarm_id;
	
	loggr.info("site.alarms.setAlarm(): "+alarm_id);
	
	if (!alarm_id && !alarm) {
		loggr.warn(" > !alarm_id && !alarm");
		return;
	}
	
	// Find alarm
	if (!alarm) {
		loggr.log(" > Find alarm for id '"+ alarm_id +"'");
		for (var i in site.session.alarms) {
			if (alarm_id==site.sessions.alarms[i].alarm_id) { 
				alarm = site.sessions.alarms[i];
				break; 
			}
		}
	}
	
	if (!alarm || !alarm.id) { 
		loggr.warn(" > !alarm || !alarm.id");
		return;
	}
	
	// Check site.vars.thealarm
	if (site.vars.thealarm) {
		if (alarm_id == site.vars.thealarm.alarm_id) {
			site.vars.thealarm = null;
		}
	}
	
	// If no repeat: check if timemillis is today
	if (!alarm.repeat) {
		
		var timeMillis = (alarm.timeMillis) ? alarm.timeMillis : -1;
		var timeMillisNow = new Date().getTime();
		
		if (timeMillis < timeMillisNow) {
			loggr.warn(" > !repeat and timeMillis < timeMillisNow, alarm should not fire anymore");
			return;
		}
		
		if (timeMillis<0) { 
			loggr.warn(" > !repeat and timeMillis<0, return");
			return; 
		}
		
	}
	
	// Create date
	var date = new Date();
	offset = 0; // Math.round(date.getTimezoneOffset()/60);
	date.setHours(alarm.hour-offset);
	date.setMinutes(alarm.minute);
	date.setSeconds(0);
	date.setMilliseconds(0);
	
	// Volume
	var volume = (alarm.volume) ? alarm.volume : 7;
	
	loggr.log(" > Repeat: "+ alarm.repeat);
	
	var opts = {};
	opts.id = alarm.alarm_id;
	opts.timeMillis = date.getTime();
	opts.hour = date.getHours();
	opts.minute = date.getMinutes();
	opts.repeat = (alarm.repeat) ? 'daily' : 'off';
	opts.repeatDaily = alarm.repeatCfg;
	
	opts.intent = {
		type: "activity",
		package: "com.rejh.icerrr.itson",
		classname: "com.rejh.icerrr.itson.Icerrr",
		extras: [
			{ type:"string", name:"isAlarm", value:"true" },
			{ type:"string", name:"station_id", value:alarm.station.station_id },
			{ type:"int", name:"volume", value:volume }
		]
	}
	
	// loggr.log(" > "+ JSON.stringify(opts));
	
	window.alarmMgr.set(
		function(msg) {
			loggr.log(" > AlarmMgr: "+msg);
			site.alarms.writesession();
		},
		function(err) {
			loggr.error(" > AlarmMgr: ERROR!");
			loggr.error(err);
			alert(err);
		},
		opts
	);
	
}

// All Alarms

site.alarms.setAlarms = function() {
	
	loggr.info("site.alarms.setAlarms()");
	
	for (var i in site.session.alarms) {
		
		site.alarms.setAlarm(null,site.session.alarms[i]);
		
	}
	
}

site.alarms.writesession = function() {
	loggr.info("site.alarms.writesession()");
	site.helpers.storeSession();
}

// ---> Fill

site.alarms.updateForm = function(alarmCfg) {
	
	// Create dummy
	if (!alarmCfg) {
		loggr.log(" > Create alarmCfg");
		var id = site.helpers.getUniqueID();
		var alarm_id = site.alarms.getUniqueAlarmID();
		var hour = new Date().getHours();
		var minute = new Date().getMinutes();
		var alarmCfg = {
			id: id,
			alarm_id: alarm_id,
			timeMillis: site.alarms.getAlarmDate(hour,minute).getTime(),
			hour: hour,
			minute: minute,
			volume: 7,
			repeat: true,
			repeatCfg: [0,1,1,1,1,1,1],
			station: site.session.currentstation
		}
	}
	
	site.alarms.newAlarmCfg = alarmCfg;
	
	// Build alarm_station_name <select>
	var stations = site.sorts.station_by_name(site.data.stations)
	for (var i in stations) {
		
		var station = stations[i];
		if (!station.station_id) { continue; }
		
		var option = document.createElement("option");
		option.innerHTML = station.station_name;
		option.value = station.station_id;
		
		if (station.station_id == alarmCfg.station.station_id) {
			option.selected = "selected";
		}
		
		$("#alarms_add select[name='alarm_station_name']").append(option);
		
	}
	$("#alarms_add select[name='alarm_station_name']").off("change");
	$("#alarms_add select[name='alarm_station_name']").on("change",function(evt) {
		var value = evt.originalEvent.target.value;
		site.alarms.newAlarmCfg.station = site.data.stations[site.helpers.session.getStationIndexById(value)];
		loggr.log(" > Change: station "+site.alarms.newAlarmCfg.station.station_name);
		site.alarms.save(true);
	});
	
	// Alarm time
	var date = new Date();
	var offset = Math.round(date.getTimezoneOffset()/60); // TODO || FIXME: this is gonna cause problems. input[type=time] expects GMT when you set it...
	date.setHours(alarmCfg.hour-offset); // -offset because offset is negative reversed shzzle :(
	date.setMinutes(alarmCfg.minute);
	date.setSeconds(0);
	date.setMilliseconds(0);
	$("#alarms_add input[name='alarm_time']")[0].valueAsDate = date;
	$("#alarms_add input[name='alarm_time']")[0].onclick = function(){
		loggr.log(" > Timepicker!");
		var offset = Math.round(new Date().getTimezoneOffset()/60);
		var values = this.value.split(":");
		var hour = parseInt(values[0]);
		var minute = parseInt(values[1]);
		var date = new Date();
		date.setHours(hour);
		date.setMinutes(minute);
		date.setSeconds(0);
		date.setMilliseconds(0);
		datepicker.show({date:date,mode:'time'},function(date) {
			// alert(typeof(date));
			var offset = Math.round(new Date().getTimezoneOffset()/60);
			var hour = date.getHours();
			var minute = date.getMinutes();
			site.alarms.newAlarmCfg.timeMillis = site.alarms.getAlarmDate(hour,minute).getTime();
			site.alarms.newAlarmCfg.hour = hour;
			site.alarms.newAlarmCfg.minute = minute;
			loggr.log(" > Change: time "+hour+":"+minute);
			date.setHours(date.getHours()-offset); // ugly...
			date.setSeconds(0);
			$("#alarms_add input[name='alarm_time']")[0].valueAsDate = date;
			site.alarms.save(true);
		});
		return false;
	}
	
	/*
	$("#alarms_add input[name='alarm_time']").off("change");
	$("#alarms_add input[name='alarm_time']").on("change",function(evt) {
		var values = evt.originalEvent.target.value.split(":");
		var hour = parseInt(values[0]);
		var minute = parseInt(values[1]);
		site.alarms.newAlarmCfg.timeMillis = site.alarms.getAlarmDate(hour,minute).getTime();
		site.alarms.newAlarmCfg.hour = hour;
		site.alarms.newAlarmCfg.minute = minute;
		loggr.log(" > Change: time "+hour+":"+minute);
		site.alarms.save();
	});
	/**/
	
	// Volume
	if (alarmCfg.volume) { $("#alarms_add input[name='alarm_volume']").attr("value",alarmCfg.volume); }
	else { $("#alarms_add input[name='alarm_volume']").attr("value",7); }
	$("#alarms_add input[name='alarm_volume']").off("change");
	$("#alarms_add input[name='alarm_volume']").on("change",function(evt) {
		var obj = evt.originalEvent.target;
		var value = obj.value ? obj.value : 7;
		loggr.log(" > Change: volume: "+value);
		alarmCfg.volume = value;
		site.alarms.save(true);
		$("#alarms_add input[name='alarm_volume']").blur();
	});
	
	// Repeat
	/*
	if (alarmCfg.repeat) { $("#alarms_add input[name='repeat']").attr("checked","checked"); $("#alarms_add_repeatCfg").css("display","block"); }
	else { $("#alarms_add input[name='repeat']").removeAttr("checked"); $("#alarms_add_repeatCfg").css("display","none"); }
	$("#alarms_add input[name='repeat']").off("change");
	$("#alarms_add input[name='repeat']").on("change",function(evt) {
		var obj = evt.originalEvent.target;
		var value = obj.checked ? true : false;
		site.alarms.newAlarmCfg.repeat = value; 
		loggr.log(" > Change: repeat: "+value);
		if (value) { $("#alarms_add_repeatCfg").css("display","block"); } 
		else { $("#alarms_add_repeatCfg").css("display","none"); }
		site.alarms.save();
	});
	/**/
	
	// Repeat days
	var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
	var repeatOn = false;
	for (var i=0; i<days.length; i++) {
		var daylc = days[i].toLowerCase();
		var selector = "#alarms_add .weekschedule ."+daylc;
		if (alarmCfg.repeatCfg[i]>0) {
			repeatOn = true;
			if (!$(selector).hasClass("active")) { $(selector).addClass("active"); }
		} else {
			$(selector).removeClass("active");
		}
	}
	site.alarms.newAlarmCfg.repeat = repeatOn;
	$("#alarms_add .weekschedule .weekboxWrap").off("click");
	$("#alarms_add .weekschedule .weekboxWrap").on("click",function(evt) {
		loggr.log("weekboxWrap.on(click)");
		var targ = evt.currentTarget;
		// find daynum
		var daynum = -1;
		var weekboxes = $("#alarms_add .weekschedule .weekboxWrap");
		for (var i=0; i<weekboxes.length; i++) {
			if (weekboxes[i]==targ) { daynum = i; break; }
		}
		if (daynum<0) { loggr.error(" > weekboxWrap.on(click) > could not find daynum: "+ daynum); return; }
		var daylc = days[daynum].toLowerCase();
		if (!$(targ).hasClass("active")) { 
			// on
			$(targ).addClass("active"); 
			site.alarms.newAlarmCfg.repeatCfg[daynum] = 1;
			loggr.log(" > "+ JSON.stringify(site.alarms.newAlarmCfg.repeatCfg));
			repeatOn = true;
		} else {
			// off
			$(targ).removeClass("active");
			site.alarms.newAlarmCfg.repeatCfg[daynum] = 0;
			loggr.log(" > "+ JSON.stringify(site.alarms.newAlarmCfg.repeatCfg));
			var repeatOn = false;
			for (var i=0; i<days.length; i++) {
				if (alarmCfg.repeatCfg[i]>0) { repeatOn = true; }
			}
		}
		loggr.log(" > Repeat: "+ repeatOn);
		site.alarms.newAlarmCfg.repeat = repeatOn;
		site.alarms.save(true);
	});
	/*
	for (var i=0; i<days.length; i++) {
		var daylc = days[i].toLowerCase();
		var selector = "#repeat_"+daylc;
		if (alarmCfg.repeatCfg[i]>0) { 
			$(selector).attr("checked","checked");
		} else {
			$(selector).removeAttr("checked");
		}
	}
	$("#alarms_add input.repeat_day").on("change",function(evt) {
		var obj = evt.originalEvent.target;
		var value = obj.checked ? 1 : 0;
		var num = obj.name.split("_")[1];
		site.alarms.newAlarmCfg.repeatCfg[num] = value;
		loggr.log(" > Change: repeat_day "+num+": "+value);
		site.alarms.save();
	});
	/**/
	
}

// ---> Get stations

site.alarms.readstations = function(customCB) {
	loggr.info("site.alarms.readstations()");
	if (!customCB) { customCB = site.alarms.readstations_cb; }
	site.storage.readfile(site.cfg.paths.json,"stations.json",customCB,site.alarms.readstations_errcb)
}

site.alarms.readstations_cb = function(resultstr) {
	loggr.info("site.alarms.loadstations_cb()");
	loggr.log(" > "+resultstr.substr(0,64)+"...");
	resultjson = JSON.parse(resultstr);
	if (!resultjson) { alert("site.chlist.readstations_cb().Error: !resultjson"); }
	site.data.stations = resultjson;
	site.alarms.init();
}

site.alarms.readstations_errcb = function(error) {
	loggr.info("site.alarms.loadstations_errcb()");
	alert("site.alarms.readstations_errcb().Error: "+site.storage.getErrorType(error));
	site.installer.init();
	// TODO: YES.. What now..
}

// ---> Helpers

site.alarms.getUniqueAlarmID = function() {
	var id = 0;
	try {
		id = site.session.alarms[site.session.alarms.length-1]["alarm_id"]+1;
	} catch(e) { }
	return id;
}

site.alarms.genRepeatString = function(repeat,repeatCfg) {
	
	var list = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
	var days = [];
	for (var i in repeatCfg) {
		if (repeatCfg[i]>0) { days.push(list[i]); }
	}
	
	loggr.log(" > Repeat str: "+ days.length +", "+ repeat);
	
	if (days.length<1 || repeat=="off" || !repeat) { return "Repeat off"; }
	return "Repeat: "+ days.join(", ");
	
}

site.alarms.getAlarmDate = function(hour,minute) {
	
	loggr.log("site.alarms.getAlarmDate(): "+hour+":"+minute);
	
	var date = new Date();
	date.setHours(hour); // -offset because offset is negative reversed shzzle :(
	date.setMinutes(minute);
	date.setSeconds(0);
	date.setMilliseconds(0)
	
	var day = date.getDate();
	
	var tmpdate = new Date();
	var tmpday = tmpdate.getDate();
	var tmphour = tmpdate.getHours();
	var tmpminute = tmpdate.getMinutes();
	
	// (day == daynow && hour < hournow || day == daynow && hour <= hournow && minute <= minnow)
	if (day == tmpday && hour < tmphour || day == tmpday && hour <= tmphour && minute <= tmpminute) {
		loggr.log(" > One day in the future...");
		date.setDate(day+1);
	}
	
	return date;
	
}


















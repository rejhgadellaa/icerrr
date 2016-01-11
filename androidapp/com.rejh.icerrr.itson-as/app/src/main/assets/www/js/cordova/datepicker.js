(function(){console.log("Load plugin: DatePicker");cordovaRef=window.cordova;function DatePicker(){}
DatePicker.prototype.show=function(options,cb){if(options.date){options.date=(options.date.getMonth()+1)+"/"+
(options.date.getDate())+"/"+
(options.date.getFullYear())+"/"+
(options.date.getHours())+"/"+
(options.date.getMinutes());}
var defaults={mode:'date',date:'',minDate:0,maxDate:0};for(var key in defaults){if(typeof options[key]!=="undefined"){defaults[key]=options[key];}}
var callback=function(message){var timestamp=Date.parse(message);if(isNaN(timestamp)==false){cb(new Date(message));}}
cordova.exec(callback,null,"DatePickerPlugin",defaults.mode,[defaults]);};try{window.datepicker=new DatePicker();}catch(e){console.error("DatePicker could not be loaded");console.error(e);}})();
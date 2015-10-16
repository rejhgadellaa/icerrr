
var ch = {};

ch.init = function() {

    console.debug("ch.init()");

    var canvas;
    var ctx;

    // convert all data
    data.byversion = JSON.parse(data.byversions);
    data.bymodel = JSON.parse(data.bymodels);
    data.byplatform = JSON.parse(data.byplatforms);

    // set global config for chart_byversion
    Chart.defaults.global.multiTooltipTemplate = "<%if (datasetLabel ){%><%=datasetLabel %>: <%}%><%= value %>";

    // chart_byversion
    console.log(" -> by_version");
    ch.drawChart(data.byversion,"chart_byversion","bar");

    // chart_bymodel
    console.log(" -> by_bymodel");
    //ch.drawChart(data.bymodel,"chart_bymodel","pie");
    ch.drawChartTotals(data.bymodel,"chart_bymodel");

    // chart_byplatform
    console.log(" -> by_byplatform");
    ch.drawChartTotals(data.byplatform,"chart_byplatform");


}

ch.drawChart = function(thedata,canvasid,type) {

    console.debug("ch.drawChart(): "+ canvasid);

    // -> Canvas, ctx
    canvas = document.getElementById(canvasid);
    ctx = canvas.getContext("2d");

    // - First entry..
    var entry1 = null;
    var entry2 = {time:0};
    for (var key in thedata) {
        for (var i in thedata[key]["datas"]) {
            if (!entry1) { entry1 = thedata[key]["datas"][i]; }
            if (entry2.time < thedata[key]["datas"][i].time) {
                entry2 = thedata[key]["datas"][i];
            }
        }
    }
    entry1.timems = (entry1.time*1000)-86400000; // -1 day
    var date1 = new Date();
    date1.setTime(entry1.timems);
    entry2.timems = entry2.time*1000;
    var date2 = new Date();
    //date2.setTime(entry2.timems);

    // -> Data..
    var chdata = {};
    chdata.labels = [];
    chdata.datasets = [];

    // Gather..
    console.log(" -> Daterange..");
    console.log(" --> "+ date1.format("Y-m-d") +", "+ date2.format("Y-m-d"));

    // Gogo
    for (var key in thedata) {

        console.log(" -> "+ key);

        var randcolor = Math.round(Math.random()*255)+","+ Math.round(Math.random()*255)+","+ Math.round(Math.random()*255);
        var dataset = {};
        dataset.label = key;
        dataset.fillColor = "rgba("+ randcolor +",0.08)";
        dataset.strokeColor = "rgba("+ randcolor +",0.75)";

        var tempdataset = {};
        var tempdataids = [];

        for (var t=entry1.timems; t<=entry2.timems; t+=86400000) {

            var datet = new Date();
            datet.setTime(t);
            var datetstr = datet.format("Y-m-d");

            if (chdata.labels.indexOf(datetstr)<0) {
                chdata.labels.push(datetstr);
            }

            var founddataforday = false;

            for (var i=0; i<thedata[key]["datas"].length; i++) {

                var entry =  thedata[key]["datas"][i];
                var timems = entry.time*1000;
                var date = new Date();
                date.setTime(timems);
                var datestr = date.format("Y-m-d");
                if (datetstr==datestr) {

                    founddataforday = true;

                    if (!tempdataset[datetstr]) {
                        tempdataids.push(entry.id);
                        tempdataset[datetstr] = 1;
                    } else if (tempdataids.indexOf(entry.id)<0) {
                        tempdataids.push(entry.id);
                        tempdataset[datetstr] ++;
                    }

                }

            }

            if (!founddataforday) {
                tempdataset[datetstr] = 0;
            } else {}

        }

        var total = 0;
        dataset.data = [];
        for (var t=entry1.timems; t<=entry2.timems; t+=86400000) {
            var date = new Date();
            date.setTime(t);
            var d = date.format("Y-m-d");
            total = total+tempdataset[d];
            dataset.data.push(total);
        }
        chdata.datasets.push(dataset);

    }

    // Chart!
    if (!type) {
        var thechart = new Chart(ctx).Line(chdata, {});
    } else if (type=="bar") {
        var thechart = new Chart(ctx).Bar(chdata, {});
    } else if (type="pie") {
        ch.drawChartTotals(thedata,canvasid,type);
    }

    // Legend..
    ch.drawChartLegend(canvasid,chdata);

}

ch.drawChartTotals = function(thedata,canvasid,type) {

    console.debug("ch.drawChartTotals(): "+ canvasid);

    // -> Canvas, ctx
    canvas = document.getElementById(canvasid);
    ctx = canvas.getContext("2d");

    // Build data
    var chdata = [];
    for (var key in thedata) {

        console.log(" -> "+ key +", "+ thedata[key].entries);

        var randcolor = Math.round(Math.random()*255)+","+ Math.round(Math.random()*255)+","+ Math.round(Math.random()*255);

        var newentry = {};
        newentry.value = thedata[key].entries;
        newentry.color = "rgba("+ randcolor +",0.25)";
        newentry.highlight = "rgba("+ randcolor +",0.75)";
        newentry.label = key;

        chdata.push(newentry);

    }

    // The chart
    var thechart = new Chart(ctx).Pie(chdata, {});


}

ch.drawChartLegend = function(canvasid,chdata) {

    console.debug("ch.drawChartLegend(): "+ canvasid);

    var elem = document.createElement("div");
    elem.className = "legendWrap";

    for (var i in chdata.datasets) {

        var dataset = chdata.datasets[i];
        var color = dataset.strokeColor;
        var label = dataset.label;

        elem.innerHTML += "<div style='display:inline-block; width:144px; margin-bottom:8px;'>"
                    +"<div style='display:inline-block; width:12px; height:12px; margin:4px; background-color:"+ color +"'></div>"
                    +"<div style='display:inline-block; margin-left:8px;'>"+ label +"</div>"
                    +"</div>";

    }

    $("#"+canvasid).after(elem);

}



























/* EOF */

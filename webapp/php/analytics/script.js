
var ch = {};

ch.init = function() {

    console.debug("ch.init()");

    var canvas;
    var ctx;

    // convert all data
    data.byversion = JSON.parse(data.byversions);
    data.bymodel = JSON.parse(data.bymodels);
    data.byplatform = JSON.parse(data.byplatforms);

    // chart_byversion
    console.log(" -> by_version");
    ch.drawChart(data.byversion,"chart_byversion");

    // chart_bymodel
    console.log(" -> by_bymodel");
    ch.drawChart(data.bymodel,"chart_bymodel");

    // chart_byplatform
    console.log(" -> by_byplatform");
    ch.drawChart(data.byplatform,"chart_byplatform");


}

ch.drawChart = function(thedata,canvasid) {

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
    entry1.timems = entry1.time*1000;
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
        dataset.fillColor = "rgba("+ randcolor +",0.25)";
        dataset.strokeColor = "rgba("+ randcolor +",0.5)";

        var tempdataset = {};
        var tempdataids = [];

        for (var t=entry1.timems; t<=entry2.timems; t+=86400000) {

            var datet = new Date();
            datet.setTime(t);
            var datetstr = datet.format("Y-m-d");

            if (chdata.labels.indexOf(datetstr)<0) {
                chdata.labels.push(datetstr);
            }

            for (var i=0; i<thedata[key]["datas"].length; i++) {

                var entry =  thedata[key]["datas"][i];
                var timems = entry.time*1000;
                var date = new Date();
                date.setTime(timems);
                var datestr = date.format("Y-m-d");
                if (datetstr==datestr) {

                    if (!tempdataset[datestr]) {
                        tempdataids.push(entry.id);
                        tempdataset[datestr] = 1;
                    } else if (tempdataids.indexOf(entry.id)<0) {
                        tempdataids.push(entry.id);
                        tempdataset[datestr] ++;
                    }

                }

            }

        }

        var total = 0;
        dataset.data = [];
        for (var d in tempdataset) {
            total = total+tempdataset[d];
            dataset.data.push(total);
        }
        chdata.datasets.push(dataset);

    }

    // Chart!
    var thechart = new Chart(ctx).Line(chdata, {});

}

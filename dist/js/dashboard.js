/*
This file is responsible for actually drawing the widgets onto the dashboard.
These are the "drawing machines" that render visualizations.
*/

function displayFacts(data, numOfParticipants) { 
    /*
    This function shows simple statistics at the top of the dashboard.
    */

    // Display total events.
    $("#numOfEvents").text(data.length.toString() + " events");
    var avgPPerson = data.length / numOfParticipants;

    // Display an average number of stress events per participant found.
    $("#avgStress").text(avgPPerson.roundTo(1).toString() + " events");

    /*
    var recentStressEvents = [0,0,0,0,0,0,0]
    for(var i = 0; i < data.length; i++){
        var stressEvent = data[i];
        var date = new Date(stressEvent['date']*1000);
        var today_date = new Date();
        var diffDays = Math.round(Math.abs((today_date.getTime() - date.getTime())/(24*60*60*1000)));
        if(diffDays <= 7){
          recentStressEvents[diffDays-1] = recentStressEvents[diffDays-1] +1;
        }
    }
    $(".sparkline").sparkline(recentStressEvents, {
      type: 'line', height:50, width: 170});
    */

    // Demo purposes. Comment below and uncomment above for real application.
    $(".sparkline").sparkline([5, 6, 7, 9, 9, 5, 3, 2, 2, 4, 6, 7], {
        type: 'line',
        height: 50,
        width: 170
    });

    // Show the temperature at which most number of stress events occur.
    temperatures = []
    for (var i = 0; i < data.length; i++) {
        temperatures.push(data[i]['temperature']);
    }
    var mostCommonTemp = mode(temperatures);
    $("#tempRange").html(mostCommonTemp.toString() + "&deg;C");
}


function drawLineChart(labels, datasetOne, datasetTwo, datasetThree, dataOneName, dataTwoName, dataThreeName) {
    /*
    This function draws the first line chart (at the top of the dashboard).
    It takes in 3 different datasets to draw the graph up.
    */

    var stressChartCanvas = $("#stressChart").get(0).getContext("2d");
    var stressChart = new Chart(stressChartCanvas);

    var stressChartData = {
        labels: labels,
        datasets: [{
                label: dataThreeName,
                fillColor: "rgba(219, 6, 70, 0.0)",
                strokeColor: "rgba(219, 6, 70, 0.5)",
                pointColor: "rgba(219, 6, 70, 0.6)",
                pointStrokeColor: "rrgba(219, 6, 70, 1)",
                pointHighlightFill: "rgba(219, 6, 70, 1)",
                pointHighlightStroke: "rgba(219, 6, 70, 1)",
                data: datasetThree
            }, {
                label: dataOneName,
                fillColor: "rgba(255, 213, 61, 0.5)",
                strokeColor: "rgba(255, 213, 61, 1))",
                pointColor: "rgba(255, 213, 61, 1)",
                pointStrokeColor: "rgba(255, 213, 61, 1)",
                pointHighlightFill: "rgba(255, 213, 61, 1)",
                pointHighlightStroke: "rgba(255, 213, 61, 1)",
                data: datasetOne
            }, {
                label: dataTwoName,
                fillColor: "rgba(60,141,188,0.5)",
                strokeColor: "rgba(60,141,188,0.8)",
                pointColor: "#3b8bba",
                pointStrokeColor: "rgba(60,141,188,1)",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(60,141,188,1)",
                data: datasetTwo
            },
        ]
    };

    var stressChartOptions = {
        //Boolean - If we should show the scale at all
        showScale: true,
        //Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: false,
        //String - Colour of the grid lines
        scaleGridLineColor: "rgba(0,0,0,.05)",
        //Number - Width of the grid lines
        scaleGridLineWidth: 1,
        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,
        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,
        //Boolean - Whether the line is curved between points
        bezierCurve: true,
        //Number - Tension of the bezier curve between points
        bezierCurveTension: 0.3,
        //Boolean - Whether to show a dot for each point
        pointDot: true,
        //Number - Radius of each point dot in pixels
        pointDotRadius: 4,
        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth: 1,
        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius: 20,
        //Boolean - Whether to show a stroke for datasets
        datasetStroke: true,
        //Number - Pixel width of dataset stroke
        datasetStrokeWidth: 2,
        //Boolean - Whether to fill the dataset with a color
        datasetFill: true,
        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%=datasets[i].label%></li><%}%></ul>",
        //Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
        maintainAspectRatio: true,
        //Boolean - whether to make the chart responsive to window resizing
        responsive: true
    };

    stressChart.Line(stressChartData, stressChartOptions);
}


function drawDemographicChart(pieData) {
    /*
    This function draws a pie chart that allows the user to see the different subsets of the population.
    pieData is an array of object where each object looks like:
    {
    value: size of slice in int,
    color: colour,
    highlight: colour,
    label: the name of the slice
    }
    */

    var pieChartCanvas = $("#pieChart").get(0).getContext("2d");
    var pieChart = new Chart(pieChartCanvas);

    var pieOptions = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke: true,
        //String - The colour of each segment stroke
        segmentStrokeColor: "#fff",
        //Number - The width of each segment stroke
        segmentStrokeWidth: 1,
        //Number - The percentage of the chart that we cut out of the middle
        percentageInnerCutout: 0, // This is 0 for Pie charts
        //Number - Amount of animation steps
        animationSteps: 100,
        //String - Animation easing effect
        animationEasing: "easeOutBounce",
        //Boolean - Whether we animate the rotation of the Doughnut
        animateRotate: true,
        //Boolean - Whether we animate scaling the Doughnut from the centre
        animateScale: false,
        //Boolean - whether to make the chart responsive to window resizing
        responsive: true,
        // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
        maintainAspectRatio: false,
        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>",
        //String - A tooltip template
        tooltipTemplate: "<%=value %> <%=label%> users"
    };
    
    pieChart.Doughnut(pieData, pieOptions);
    
}


function drawScatterChart(traceDetails, xTitle, yTitle, zTitle) {
    /*
    This function displays the 3D Chart where it plots the x,y,z values.
    */

    var traces = [];
    var hoverInfo="all";
    for(var i = 0; i < traceDetails.length; i++){
        var trace;
        if(zTitle){
            if(zTitle=="Date"){
        hoverInfo="x+y+name";
    }else if(yTitle=="Date"){
        hoverInfo="x+z+name";
    }else if(xTitle=="Date"){
        hoverInfo="y+z+name";
    }
            trace = {
        x: traceDetails[i].xValues,
        y: traceDetails[i].yValues,
        z: traceDetails[i].zValues,
        hoverinfo: hoverInfo,
        mode: 'markers',
        name: traceDetails[i].name,
        marker: {
            size: 4,
            line: {
                color: traceDetails[i].colour,
                width: 0.5
            },
            opacity: 0.8
        },
        type: traceDetails[i].type
        };
    }else{
        trace = {
        x: traceDetails[i].xValues,
        y: traceDetails[i].yValues,
        z: traceDetails[i].zValues,
        hoverinfo: "all",
        mode: 'markers',
        name: traceDetails[i].name,
        marker: {
            size: 4,
            line: {
                color: traceDetails[i].colour,
                width: 0.5
            },
            opacity: 0.8
        },
        type: traceDetails[i].type
        };
    }
        
        traces.push(trace);
    } 
    if(zTitle){
        var layout = {
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0
            },
            scene: {
                xaxis: { title: xTitle },
                yaxis: { title: yTitle },
                zaxis: { title: zTitle }
            }
        };
    }else{
        var layout = {
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0
            },
            xaxis: { 
                title: xTitle,
            },
            yaxis: { title: yTitle }
        };
    }
    Plotly.newPlot('scatterChart', traces, layout);
}

function drawAreaChart(interval, xTitle, plotData){
    /*
    Renders the area/histogram chart with the given x-axis and plotData.
    plotData is a series of objects where each one looks like this:
    {
    color: "someColour",
    legendMarkerType: "square",
    markerSize: 0,
    name: "some subset of population (eg. If colouring by age, it could be 18-24.".
    showInLegend: True,
    type: stackedColumn OR area,
    dataPoints: [
            {
            x: someNumber,
            y: someNumber
            }, ...
        ]
    }
    */

    var xAxis;
    if(xTitle=="Date"){
        xAxis = {     
            intervalType:"day",
            valueFormatString: "DD/MM/YYYY",
            interval: interval,
            title: xTitle
        }
    }else{
        xAxis = {     
            interval: interval,
            title: xTitle
        }
    }
    var chart = new CanvasJS.Chart("areaChart",
    {
        
        animationEnabled: true,
        axisX:xAxis,
        axisY: {
            title: "Stress"
        },
        legend: {
            verticalAlign: "bottom",
            horizontalAlign: "center"
        },
        data: plotData
    });
    chart.render();
  }

/*
Helper functions are below.
*/

function mode(arr) {
    /*
    Gets the most common value out of an array.
    */
    return arr.reduce(function(current, item) {
        var val = current.numMapping[item] = (current.numMapping[item] || 0) + 1;
        if (val > current.greatestFreq) {
            current.greatestFreq = val;
            current.mode = item;
        }
        return current;
    }, {mode: null, greatestFreq: -Infinity, numMapping: {}}, arr).mode;
};


function resizeiFrameFullScreen() {
    // Used to make the heatmap go full screen.
    var iFrame = $("#heatmap");
    iFrame.attr("style", "position:fixed; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;");
}

$(document).keyup(function(e) {
    // Used to allow users to escape out of the iFrame and show the dashboard once again.
    if (e.keyCode == 27) { // escape key maps to keycode `27`
        var iFrame = $("#heatmap");
        iFrame.attr("style", "");
    }
});

$(document.getElementById('frame_heatmap').contentWindow.document).keydown(function(e) {
    // Used to allow users to escape out of the iFrame and show the dashboard once again.
    if (e.keyCode == 27) { // escape key maps to keycode `27`
        var iFrame = $("#heatmap");
        iFrame.attr("style", "");
    }
});









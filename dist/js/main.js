/*
This script is responsible for:
 -Loading Firebase stress data.
 -Restoring/save dashboard state.
 -Processing Firebase stress data to retrieve options and attributes (eg. get available
  age groups).
 -Reset dashboard (removing options/attributes) upon logout.
 -Login/Logout.
*/

var stressLogs = []; // Holds all stress events.
var participants = []; 
var userFirebaseDatasetName; // The user's accessible stress dataset.
var stressDiscreteFields = {}; // Holds all the discrete field options (eg. age groups, gender, platform)
var stressContinuousFields = []; // Holds all options of continuous values (eg. temperature, accelerometer data)
var colours = ["#e60507",
    "#909bef",
    "#ff00ff",
    "#8bff8f",
    "#F69D78",
    "#d4b9ff",
    "#4a4750"
];

// Importing random colours if more subsets of the population are found.
for (var i = 0; i < 100; i++) {
    if (i % 2 == 0) {
        colours.push('#' + Math.floor(Math.random() * 16777215 / 2).toString(16));
    } else {
        colours.push('#' + Math.floor(Math.random() * 16777215).toString(16));
    }
}


$(document).ready(function() {
    firebase.initializeApp({
        apiKey: "AIzaSyCDDj2gYfQJHb4SMctSfaPtdMO-F3eK0Rw",
        authDomain: "stress-pendant.firebaseapp.com",
        databaseURL: "https://stress-pendant.firebaseio.com",
        storageBucket: "stress-pendant.appspot.com"
    });

    $('form').submit(function() {
        return false;
    });
    $('#form-login-username').focus();
    $('#form-login-password').keypress(function(e) {
        if (e.which === 13) { // enter key pressed.
            login();
        }
    });
    $('#login-button').click(login);

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) { // Successful login.
            showLoginLoading();
            loadRespectiveData(user.uid);
        }
    });
});

function resetDashboard() {
    /*
    Removes all options and attributes from the dashboard.
    */

    stressLogs = [];
    participants = [];
    userFirebaseDatasetName;
    stressDiscreteFields = {};
    stressContinuousFields = [];

    $(".selectpicker.ds1").empty();
    $(".selectpicker.ds2").empty();
    $(".selectpicker.filter_scatter").empty();
    $(".selectpicker.filter_area").empty();

    $(".selectpicker.colour_scatter").children().empty();
    $(".selectpicker.colour_area").children().empty();

    $(".selectpicker.x_axis_scatter").children().empty();
    $(".selectpicker.y_axis_scatter").children().empty();
    $(".selectpicker.z_axis_scatter").children().empty();
    $(".selectpicker.x_axis_area").children().empty();
    $(".selectpicker.ds1").selectpicker('refresh');
    $(".selectpicker.ds2").selectpicker('refresh');
    $(".selectpicker.filter_scatter").selectpicker('refresh');
    $(".selectpicker.filter_area").selectpicker('refresh');

    $(".selectpicker.colour_scatter").selectpicker('refresh');
    $(".selectpicker.colour_area").selectpicker('refresh');

    $(".selectpicker.x_axis_scatter").selectpicker('refresh');
    $(".selectpicker.y_axis_scatter").selectpicker('refresh');
    $(".selectpicker.z_axis_scatter").selectpicker('refresh');
    $(".selectpicker.x_axis_area").selectpicker('refresh');
}

function importStressFieldsToDashboard() {
    /*
    Analyses Firebase stress data to pick up available options/attributes.
    */
    var colourOptions = "";
    for (var discreteKey in stressDiscreteFields) {
        var optgroup = '<optgroup label="' + capitalizeFirstLetter(discreteKey) + '" data-max-options="1">';
        for (var i = 0; i < stressDiscreteFields[discreteKey].length; i++) {
            optgroup += '<option>' + stressDiscreteFields[discreteKey][i] + '</option>';
        }
        optgroup += "</optgroup>";
        colourOptions += "<option value='" + discreteKey + "'>" + capitalizeFirstLetter(discreteKey) + "</option>";
        $(".selectpicker.ds1").append(optgroup);
        $(".selectpicker.ds2").append(optgroup);
        $(".selectpicker.filter_scatter").append(optgroup);
        $(".selectpicker.filter_area").append(optgroup);
    }
    $(".selectpicker.colour_scatter").children().append(colourOptions);
    $(".selectpicker.colour_scatter").selectpicker('refresh');
    $(".selectpicker.filter_scatter").selectpicker('refresh');
    $(".selectpicker.colour_area").children().append(colourOptions);
    $(".selectpicker.colour_area").selectpicker('refresh');
    $(".selectpicker.filter_area").selectpicker('refresh');
    $('.selectpicker.ds1').selectpicker('refresh');
    $('.selectpicker.ds2').selectpicker('refresh');

    var options = "";
    for (var i = 0; i < stressContinuousFields.length; i++) {
        options += "<option value='" + stressContinuousFields[i] + "''>" + capitalizeFirstLetter(stressContinuousFields[i]) + "</option>";
    }
    $(".selectpicker.x_axis_scatter").children().append(options);
    $(".selectpicker.x_axis_scatter").selectpicker('refresh');
    $(".selectpicker.y_axis_scatter").children().append(options);
    $(".selectpicker.y_axis_scatter").selectpicker('refresh');
    $(".selectpicker.z_axis_scatter").children().append(options);
    $(".selectpicker.z_axis_scatter").selectpicker('refresh');
    $(".selectpicker.x_axis_area").children().append(options);
    $(".selectpicker.x_axis_area").selectpicker('refresh');
}

function processFirebaseData(newData) {
    /*
    Formats the stress data for convenience. Each stress event is stored in 
    array of stress event and now includes the participant-id, age and gender.
    */
    for (var key in newData['participants']) {
        participants.push(newData['participants'][key]);
    }

    var firebaseStressLogs = newData['stresslogs']
    for (var key in firebaseStressLogs) {
        var stressLog = firebaseStressLogs[key];
        var participant = participants.filter(function(a) {
            return a["participant-id"] == stressLog['participant-id'];
        });
        try {
            stressLog['age'] = participant[0]['age'];
            stressLog['gender'] = participant[0]['gender'];
            stressLogs.push(stressLog);
        } catch (err) {
            // Stress event had no mapping participant so just skip.
        }
    }

    var stressLog = stressLogs[0];
    for (var key in stressLog) {
        switch (key) {
            case "age":
                var ageGroups = unique(stressLogs.map(function(a) {
                    return a["age"];
                }));
                stressDiscreteFields[key] = ageGroups;
                break;
            case "gender":
                var genderGroups = unique(stressLogs.map(function(a) {
                    return a["gender"];
                }));
                stressDiscreteFields[key] = genderGroups;
                break;
            case "platform":
                var platformGroups = unique(stressLogs.map(function(a) {
                    return a["platform"];
                }));
                stressDiscreteFields[key] = platformGroups;
                break;
            case "date-AEST":
            case "participant-id":
                break;
            default:
                stressContinuousFields.push(key);
        }
    }
}

function clearLoginError() {
    $("#login-error").html("");
    $("#login-error").attr("style", "display: none");
}

function showLoginError(message) {
    $("#login-error").html(message);
    $("#login-error").attr("style", "color:red");
}

function showLoginLoading() {
    // Clear any previous login errors.
    clearLoginError();
    // Hide login screen.
    $("#login-container").attr("style", "display:none");
    $("body").removeClass("login-page");
    // Show loading bar as we are loading the Firebase stress data.
    $('.loading').attr("style", "");
}

function showLoadedDashboard() {
    $(".loading").attr("style", "display:none");
    $("#login-container").attr("style", "display:none");
    $("body").removeClass("login-page");
    $("#content").attr("style", "");
}

function login() {
    showLoginLoading();
    var username = $('#form-login-username').val();
    var password = $('#form-login-password').val();
    firebase.auth().signInWithEmailAndPassword(username, password).catch((function(e) {
        // show login error message.
        showLoginError(e.message);
        // hide loading screen.
        // remove login screen.
        $("#login-container").attr("style", "");
        $("body").addClass("login-page");
        // show loading bar.
        $('.loading').attr("style", "display:none");
    }));
}

function logout() {
    /*
    Upon logout we must save current selections into Firebase to maintain persistent dashboard
    state.
    */

    $('#form-login-username').val("");
    $('#form-login-password').val("");
    $(".loading").attr("style", "")
    $("#content").attr("style", "display:none");
    $("#login-container").attr("style", "");
    $("body").addClass("login-page");
    firebase.database().ref('user-power/' + firebase.auth().currentUser.uid).set({
        data: userFirebaseDatasetName,
        state: gatherDashboardState()
    });
    firebase.auth().signOut().catch(function(error) {
        console.log("error.")
    }).then(function() {
            clearLoginError();
            $("#login-container").show();
            $("body").addClass("login-page");
            // Show loading bar.
            $(".loading").attr("style", "display:none")
        }

    );
}

function gatherDashboardState() {
    /*
    Produce a state json object that consists of details of each graph and return it.
    */

    state = {
        "3DChart": {
            "colourBy": $(".selectpicker.colour_scatter").val(),
            "xAxis": $(".selectpicker.x_axis_scatter").val(),
            "yAxis": $(".selectpicker.y_axis_scatter").val(),
            "zAxis": $(".selectpicker.z_axis_scatter").val(),
            "filters": $(".selectpicker.filter_scatter").val(),
            "startTemp": $("#tempMin").val(),
            "endTemp": $("#tempMax").val(),
            "startDate": $("#from").val(),
            "endDate": $("#to").val()
        },
        "pieChart": {
            "filters": $(".selectpicker.variables").val()
        },
        "lineChart": {
            "time": $(".selectpicker.time").val(),
            "isLastTimeBlock": $("#yesLastBlock").is(":checked"),
            "isCumulative": $("#yesCumulative").is(":checked"),
            "datasetOne": $(".selectpicker.ds1").val(),
            "datasetTwo": $(".selectpicker.ds2").val(),
        },
        "areaChart": {
            "xAxis": $(".selectpicker.x_axis_area").val(),
            "graphType": $(".selectpicker.graph_type_area").val(),
            "interval": $("#interval_area").slider("value"),
            "bin": $("#bin_area").slider("value"),
            "colourBy": $(".selectpicker.colour_area").val(),
            "filters": $(".selectpicker.filter_area").val(),
            "startDate": $("#from_area").val(),
            "endDate": $("#to_area").val()
        }

    };
    return state;
}

function loadDashboardState(state) {
    /*
    Once state has been retrieved from Firebase, we must apply the state to the dashboard here.
    */

    // Configure line graph.
    $("#yesCumulative").attr("checked", state["lineChart"]["isCumulative"]);
    $("#yesLastBlock").attr("checked", state["lineChart"]["isLastTimeBlock"]);
    var ds1Values = state["lineChart"]["datasetOne"];
    $(".selectpicker.ds1").selectpicker('val', ds1Values);
    var ds2Values = state["lineChart"]["datasetTwo"];
    $(".selectpicker.ds2").selectpicker('val', ds2Values);
    $('.selectpicker.time').selectpicker('val', state["lineChart"]["time"]);

    // Configure demographics graph.
    var values = state["pieChart"]["filters"];
    $(".selectpicker.variables").selectpicker('val', values);

    // Configure scatter graph.
    var values = state["3DChart"]["filters"];
    $(".selectpicker.filter_scatter").selectpicker('val', values);
    var values = state["3DChart"]["xAxis"];
    $(".selectpicker.x_axis_scatter").selectpicker('val', values);
    var values = state["3DChart"]["yAxis"];
    $(".selectpicker.y_axis_scatter").selectpicker('val', values);
    var values = state["3DChart"]["zAxis"];
    $(".selectpicker.z_axis_scatter").selectpicker('val', values);
    var values = state["3DChart"]["colourBy"];
    $(".selectpicker.colour_scatter").selectpicker('val', values);
    $("#temp-slider-range").slider({
        range: true,
        min: 1,
        max: 60,
        values: [state["3DChart"]["startTemp"], state["3DChart"]["endTemp"]],
        slide: function(event, ui) {
            $("#amount").val(ui.values[0] + "°C - " + ui.values[1] + "°C");
            $("#tempMin").val(ui.values[0]);
            $("#tempMax").val(ui.values[1]);
            refreshScatterChart();
        }
    });
    $("#amount").val($("#temp-slider-range").slider("values", 0) + "°C" +
        " - " + $("#temp-slider-range").slider("values", 1) + "°C");
    $("#tempMin").val(state["3DChart"]["startTemp"]);
    $("#tempMax").val(state["3DChart"]["endTemp"]);
    $("#from").val(state["3DChart"]["startDate"]);
    $("#to").val(state["3DChart"]["endDate"]);

    // Configure area graph.
    var values = state["areaChart"]["filters"];
    $(".selectpicker.filter_area").selectpicker('val', values);
    var values = state["areaChart"]["xAxis"];
    $(".selectpicker.x_axis_area").selectpicker('val', values);
    var values = state["areaChart"]["colourBy"];
    $(".selectpicker.colour_area").selectpicker('val', values);
    var values = state["areaChart"]["graphType"];
    $(".selectpicker.graph_type_area").selectpicker('val', values);
    $("#from_area").val(state["areaChart"]["startDate"]);
    $("#to_area").val(state["areaChart"]["endDate"]);
    $("#bin_area").slider({
        range: false,
        min: 1,
        max: 200,
        value: state["areaChart"]["bin"],
        slide: function(event, ui) {
            $("#bin_area").slider("value", ui.value);
            refreshAreaChart();
        }
    });
    $("#interval_area").slider({
        range: false,
        min: 1,
        max: 200,
        value: state["areaChart"]["interval"],
        slide: function(event, ui) {
            $("#interval_area").slider("value", ui.value);
            refreshAreaChart();
        }
    });
    if ($(".selectpicker.x_axis_area").val() == "temperature") {
        $("#bin_area").slider("option", "max", 60);
        $("#bin_area").slider("option", "disabled", false);
    } else if ($(".selectpicker.x_axis_area").val() == "accelx" || $(".selectpicker.x_axis_area").val() == "accely" || $(".selectpicker.x_axis_area").val() == "accelz") {
        $("#bin_area").slider("option", "max", 200);
        $("#bin_area").slider("option", "disabled", false);
    } else if ($(".selectpicker.x_axis_area").val() == "date") {
        $("#bin_area").slider("option", "max", 10);
        $("#bin_area").slider("option", "disabled", true);
    } else {
        $("#bin_area").slider("option", "disabled", false);
    }
    if ($(".selectpicker.x_axis_area").val() == "temperature") {
        $("#interval_area").slider("option", "max", 60);
    } else if ($(".selectpicker.x_axis_area").val() == "accelx" || $(".selectpicker.x_axis_area").val() == "accely" || $(".selectpicker.x_axis_area").val() == "accelz") {
        $("#interval_area").slider("option", "max", 200);
    } else if ($(".selectpicker.x_axis_area").val() == "date") {
        $("#interval_area").slider("option", "max", 10);
    }
}

function loadRespectiveData(uid) {
    /*
    Once successful login occurs, this function handles the production and loading of the dashboard.
    */

    userPowerFirebaseRef = firebase.database().ref('user-power/' + uid);
    userPowerFirebaseRef.once('value').then(function(snapshot) {
        userFirebaseDatasetName = snapshot.val().data; // We get stress data from the user's accessible dataset.
        firebase.database().ref(userFirebaseDatasetName).on('value', function(data) {
            // Load stress data.
            resetDashboard();
            processFirebaseData(data.val()); // Reformatting stress data for convenience.
            importStressFieldsToDashboard(); // Analyses stress data and imports the available options/attributes.
            if (snapshot.val().state) {
                // User had a previous dashboard state so we need to restore it.
                loadDashboardState(snapshot.val().state);
                // Data loaded so now show the actual dashboard.
                showLoadedDashboard();
                // Show the visualizations.
                refreshLineChart();
                displayFacts(stressLogs, _.keys(participants).length);
                refreshDemographicChart();
                setUpScatterDateRange();
                setUpAreaDateRange();
                refreshScatterChart();
                refreshAreaChart();

            }else {
                // User did not have a previous dashboard state so get the default state.
                defaultPowerFirebaseRef = firebase.database().ref('user-power/dashboard-default/state/');
                defaultPowerFirebaseRef.once('value').then(function(s) {
                    loadDashboardState(s.val());
                    // Data loaded so now show the actual dashboard.
                    showLoadedDashboard();
                    // Show the visualizations.
                    refreshLineChart();
                    displayFacts(stressLogs, _.keys(participants).length);
                    refreshDemographicChart();
                    setUpScatterDateRange();
                    setUpAreaDateRange();
                    refreshScatterChart();
                    refreshAreaChart();
                });
            }
        });
    });
}

/*
The following functions gather selections made through the design controls and then parses
Firebase stress data accordingly. From here, it calls the rendering visualization subroutines
found in dashboard.js
*/

function refreshScatterChart() {
    // Filter to selected subset of population.
    var filterAttributes = $(".selectpicker.filter_scatter").val();
    var filteredSet;
    if (!filterAttributes) {
        filteredSet = stressLogs;
    } else {
        var filterKeys = [];
        for (var i = 0; i < filterAttributes.length; i++) {
            for (var key in stressDiscreteFields) {
                if ($.inArray(filterAttributes[i], stressDiscreteFields[key]) != -1) {
                    filterKeys.push(key);
                    break;
                }
            }
        }
        filteredSet = stressLogs.filter(function(a) {
            for (var i = 0; i < filterKeys.length; i++) {
                if (a[filterKeys[i]] != filterAttributes[i]) {
                    return false;
                }
            }
            return true;
        });

    }
    // Filter between a selected temperature and date range.
    var tempMin = parseInt($("#tempMin").val());
    var tempMax = parseInt($("#tempMax").val());
    var minDate = new Date($("#from").val());
    var maxDate = new Date($("#to").val());
    filteredSet = filteredSet.filter(function(a) {
        var temp = parseInt(a["temperature"]);
        return temp >= tempMin && temp <= tempMax;
    });
    filteredSet = filteredSet.filter(function(a) {
        var stressDate = new Date(a["date"] * 1000);
        return stressDate >= minDate && stressDate <= maxDate;
    });

    var type = "scatter3d";
    var xTitle = $(".selectpicker.x_axis_scatter").val();
    var yTitle = $(".selectpicker.y_axis_scatter").val();
    var zTitle = $(".selectpicker.z_axis_scatter").val();
    if (!zTitle) {
        zTitle = undefined;
        type = "scatter2d";
    } else {
        zTitle = zTitle[0];
    }

    // The filtered dataset needs to be divided by a selected variable (eg. by age groups) through
    // the use of different colours.
    var colourBy = $(".selectpicker.colour_scatter").val();
    var colourSet = stressDiscreteFields[colourBy];
    var traceDetails = [];
    for (var i = 0; i < colourSet.length; i++) {
        var colourFilteredSet = filteredSet.filter(function(a) {
            return a[colourBy] == colourSet[i];
        });
        var traceDetail = {
            "xValues": colourFilteredSet.map(function(a) {
                if (xTitle == "date") {
                    return new Date(parseInt(a[xTitle]) * 1000)
                } else {
                    return parseFloat(a[xTitle]);
                }
            }),
            "yValues": colourFilteredSet.map(function(a) {
                if (yTitle == "date") {
                    return new Date(parseInt(a[yTitle]) * 1000)
                } else {
                    return parseFloat(a[yTitle]);
                }
            }),
            "zValues": colourFilteredSet.map(function(a) {
                if (zTitle == "date") {
                    return new Date(parseInt(a[zTitle]) * 1000)
                } else {
                    return parseFloat(a[zTitle]);
                }
            }),
            "type": type,
            "colour": colours[i],
            "name": colourSet[i]
        }
        traceDetails.push(traceDetail);
    }
    if (zTitle) {
        zTitle = capitalizeFirstLetter(zTitle);
    }
    // Parsed data sent off to be rendered as a visualization.
    drawScatterChart(traceDetails, capitalizeFirstLetter(xTitle), capitalizeFirstLetter(yTitle), zTitle);
}

function refreshAreaChart() {
    // Filter to selected subset of population.
    $("#areaChart").empty();
    var filterAttributes = $(".selectpicker.filter_area").val();
    var workableData = JSON.parse(JSON.stringify(stressLogs));
    var filteredSet;
    if (!filterAttributes) {
        filteredSet = workableData;
    } else {
        var filterKeys = [];
        for (var i = 0; i < filterAttributes.length; i++) {
            for (var key in stressDiscreteFields) {
                if ($.inArray(filterAttributes[i], stressDiscreteFields[key]) != -1) {
                    filterKeys.push(key);
                    break;
                }
            }
        }
        filteredSet = workableData.filter(function(a) {
            for (var i = 0; i < filterKeys.length; i++) {
                if (a[filterKeys[i]] != filterAttributes[i]) {
                    return false;
                }
            }
            return true;
        });
    }
    // Filter between a selected date range.
    var minDate = new Date($("#from_area").val());
    var maxDate = new Date($("#to_area").val());
    filteredSet = filteredSet.filter(function(a) {
        var stressDate = new Date(a["date"] * 1000);
        return stressDate >= minDate && stressDate <= maxDate;
    });
    var xTitle = $(".selectpicker.x_axis_area").val();
    var interval = parseFloat($("#interval_area").slider("value"));
    var bin = parseFloat($("#bin_area").slider("value"));

    // The filtered dataset needs to be divided by a selected variable (eg. by age groups) through
    // the use of different colours.
    var colourBy = $(".selectpicker.colour_area").val();
    var type = $(".selectpicker.graph_type_area").val();
    var colourSet = stressDiscreteFields[colourBy];
    var plotData = [];
    for (var i = 0; i < colourSet.length; i++) {
        var colourFilteredSet = filteredSet.filter(function(a) {
            return a[colourBy] == colourSet[i];
        });
        var dataPoints = [];
        var xValuesVisited = [];
        colourFilteredSet.sort(function(a, b) {
            return parseFloat(a[xTitle]) - parseFloat(b[xTitle]);
        });
        for (var k = 0; k < colourFilteredSet.length; k++) {
            if (xTitle != "date") {
                colourFilteredSet[k][xTitle] = parseFloat(colourFilteredSet[k][xTitle]).roundTo(bin);
            } else {
                var timeStamp = parseInt(colourFilteredSet[k][xTitle]);
                var date = new Date(timeStamp * 1000);
                date = moment(date).startOf('day');
                colourFilteredSet[k][xTitle] = Date.parse(date) / 1000;
            }
        }
        for (var j = 0; j < colourFilteredSet.length; j++) {
            var xValue = colourFilteredSet[j][xTitle]
            if ($.inArray(xValue, xValuesVisited) == -1) {
                if (xTitle != "date") {
                    dataPoint = {
                        x: xValue,
                        y: colourFilteredSet.filter(function(a) {
                            return colourFilteredSet[j][xTitle] == a[xTitle];
                        }).length,
                    }
                } else {
                    dataPoint = {
                        x: new Date(xValue * 1000),
                        y: colourFilteredSet.filter(function(a) {
                            return colourFilteredSet[j][xTitle] == a[xTitle];
                        }).length,
                    }
                }
                xValuesVisited.push(xValue);
                dataPoints.push(dataPoint);
            }
        }
        var plot = {
            dataPoints: dataPoints,
            type: type,
            color: colours[i],
            name: colourSet[i],
            showInLegend: true,
            legendMarkerType: "square",
            markerSize: 0,
        }
        plotData.push(plot);
    }
    // Parsed data sent off to be rendered as a visualization.
    drawAreaChart(interval, capitalizeFirstLetter(xTitle), plotData);
}

function refreshDemographicChart() {
    $("#pieLegend").empty();
    var variables = $(".selectpicker.variables").val();
    if (!variables) {
        $("#pieLegend").empty();
        $(".pie").empty();
        $(".pie").append('<canvas id="pieChart"></canvas>');
        return 0;
    }
    
    var genders = stressDiscreteFields["gender"];
    var ages = stressDiscreteFields["age"] 
    var variablesToUse = [];
    var pieData = [];
    if ($.inArray("Gender", variables) != -1) {
        variablesToUse.push(genders);
    }
    if ($.inArray("Age", variables) != -1) {
        variablesToUse.push(ages);
    }
    var slices = cartesian(variablesToUse);
    
    // Calculate size of each slice of the pie chart.
    for (var i = 0; i < slices.length; i++) {
        var colour = colours[i];
        filtered_participants = participants.filter(function(obj) {
            var result = false;
            var first_item;
            if ($.inArray("Gender", variables) != -1) {
                if (obj['gender'] == slices[i][0]) {
                    result = true;
                    first_item = slices[i].shift();
                } else {
                    result = false;
                }
            }
            if ($.inArray("Age", variables) != -1) {
                if (obj['age'] == slices[i][0]) {
                    result = true;
                } else {
                    result = false;
                }
            }
            if (first_item != undefined) {
                slices[i].splice(0, 0, first_item);
            }
            return result;
        });
        pieData.push({
            value: filtered_participants.length,
            color: colour,
            highlight: colour,
            label: slices[i].join(",")
        });
        // Draw legend.
        $("#pieLegend").append('<li><i class="fa fa-circle-o" style="color:' + colour + '"></i>' + slices[i].join(",") + '</li>')
    }
    $(".pie").empty();
    $(".pie").append('<canvas id="pieChart"></canvas>');
    // Parsed data sent off to be rendered as a visualization.
    drawDemographicChart(pieData);
}

function refreshLineChart() {
    /*
    This function will function organise all the selections made for the line chart and then
    parse the data through produceLineChart function call.
    */
    var ds1Values = $(".selectpicker.ds1").val();
    var ds2Values = $(".selectpicker.ds2").val();
    if (typeof ds1Values === 'string') {
        ds1Values = [ds1Values];
    }
    if (typeof ds2Values === 'string') {
        ds2Values = [ds2Values];
    }
    var ds1Name = ds1Values.join();
    var ds2Name = ds2Values.join();
    var ds1ages = ds1Values.filter(function(e) {
        return e.indexOf('-') > -1;
    });
    var ds2ages = ds2Values.filter(function(e) {
        return e.indexOf('-') > -1;
    });
    var ds1Values = ds1Values.filter(function(e) {
        return e.indexOf('-') == -1;
    });
    var ds2Values = ds2Values.filter(function(e) {
        return e.indexOf('-') == -1;
    });
    if (!ds1Values) {
        ds1Values = [undefined, undefined];
    }
    if (!ds2Values) {
        ds2Values = [undefined, undefined];
    }
    if (ds1Values.length == 1) {
        ds1Values.push(ds1Values[0]);
    }
    if (ds2Values.length == 1) {
        ds2Values.push(ds2Values[0]);
    }
    var ds1keys = [];
    var ds2keys = [];
    for (var i = 0; i < ds1Values.length; i++) {
        if (ds1Values[i] == "Android" || ds1Values[i] == "iOS") {
            ds1keys.push("platform");
        } else {
            ds1keys.push("gender");
        }
    }
    for (var i = 0; i < ds2Values.length; i++) {
        if (ds2Values[i] == "Android" || ds2Values[i] == "iOS") {
            ds2keys.push("platform");
        } else {
            ds2keys.push("gender");
        }
    }
    var time = $('#sel1 option:selected').text();
    var isLastBlock = $("#yesLastBlock").is(":checked");
    var isCumulative = $("#yesCumulative").is(":checked");
    $(".chart").empty();
    $(".chart").append('<canvas id="stressChart" style="height: 400px; width: 480px;" height="105" width="480"></canvas>');
    produceLineChart(isCumulative, isLastBlock, time, ds1keys[0], ds1Values[0], ds1keys[1], ds1Values[1], ds2keys[0], ds2Values[0], ds2keys[1], ds2Values[1], ds1Name, ds2Name, ds1ages, ds2ages);
}

function produceLineChart(isCumulative, isLastBlock, timeLine, d1KeyOne, d1ValueOne, d1KeyTwo, d1ValueTwo,
    d2KeyOne, d2ValueOne, d2KeyTwo, d2ValueTwo, ds1Name, ds2Name, ds1ages, ds2ages) {
    /*
    Now that the selections are organised carefully, this function will parse the Firebase stress data
    and send it off to the rendering visualization code.
    */
    var workableData = []
    workableData = $.extend(true, [], stressLogs)
    if (isLastBlock) { // Over the last "hour", "day", or "month"
        var today = new Date();
        switch (timeLine) {
            case "Hour":
                workableData = workableData.filter(function(e1) {
                    stressTime = new Date(e1['date'])
                    var hours = Math.abs(today - stressTime) / 36e5;
                    return hours <= 24;
                });
                break;
            case "Day":
                workableData = workableData.filter(function(e1) {
                    stressTime = new Date(parseInt(e1['date']) * 1000);
                    var days = (Math.abs(today - stressTime) / 36e5) / 24;
                    return days <= 31;
                });
                break;
            case "Month":
                workableData = workableData.filter(function(e1) {
                    stressTime = new Date(parseInt(e1['date']) * 1000);
                    var days = (Math.abs(today - stressTime) / 36e5) / 24;
                    return days <= 365;
                });
        }
    }
    var labels = [];
    var datasetOne = []; // User selected dataset.
    var datasetTwo = []; // User selected dataset.
    var datasetThree = [] // Whole dataset.
    switch (timeLine) { // Defining the x-axis intervals.
        case "Hour":
            labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
            datasetOne = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetTwo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetThree = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            break;
        case "Day":
            labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
            datasetOne = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetTwo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetThree = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            break;
        case "Month":
            labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            datasetOne = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetTwo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            datasetThree = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    for (var i = 0; i < labels.length; i++) {
        var filteredSet
        if (d1KeyOne && d1ValueOne && d1KeyTwo && d1ValueTwo) {
            filteredSet = workableData.filter(function(e1) {
                return e1[d1KeyOne] == d1ValueOne;
            }).filter(function(e2) {
                return e2[d1KeyTwo] == d1ValueTwo
            });
        } else {
            filteredSet = workableData;
        }
        datasetOne[i] = filteredSet.filter(function(e) {
            stressTime = new Date(parseInt(e['date']) * 1000);
            switch (timeLine) {
                case "Hour":
                    stressTimeValue = stressTime.getHours();
                    break;
                case "Day":
                    stressTimeValue = stressTime.getDate();
                    break;
                case "Month":
                    stressTimeValue = stressTime.getMonth();

            }
            if (ds1ages.length > 0) {
                return i == stressTimeValue && $.inArray(e['age'], ds1ages) != -1;
            } else {
                return i == stressTimeValue;
            }
        }).length;
        if (d2KeyOne && d2ValueOne && d2KeyTwo && d2ValueTwo) {
            filteredSet = workableData.filter(function(e1) {
                return e1[d2KeyOne] == d2ValueOne
            }).filter(function(e2) {
                return e2[d2KeyTwo] == d2ValueTwo
            });
        } else {
            filteredSet = workableData;
        }
        datasetTwo[i] = filteredSet.filter(function(e) {
            stressTime = new Date(parseInt(e['date']) * 1000);
            switch (timeLine) {
                case "Hour":
                    stressTimeValue = stressTime.getHours();
                    break;
                case "Day":
                    stressTimeValue = stressTime.getDate();
                    break;
                case "Month":
                    stressTimeValue = stressTime.getMonth();

            }
            if (ds2ages.length > 0) {
                return i == stressTimeValue && $.inArray(e['age'], ds2ages) != -1;
            } else {
                return i == stressTimeValue;
            }
        }).length;
        datasetThree[i] = workableData.filter(function(e) {
            stressTime = new Date(parseInt(e['date']) * 1000);
            switch (timeLine) {
                case "Hour":
                    stressTimeValue = stressTime.getHours();
                    break;
                case "Day":
                    stressTimeValue = stressTime.getDate();
                    break;
                case "Month":
                    stressTimeValue = stressTime.getMonth();
            }
            return i == stressTimeValue;
        }).length;
    }
    if (isCumulative) {
        datasetOne = makeCumulativeDataSet(datasetOne);
        datasetTwo = makeCumulativeDataSet(datasetTwo);
        datasetThree = makeCumulativeDataSet(datasetThree);
    }
    // Parsed data sent off to the rendering visualization code in dashboard.js
    drawLineChart(labels, datasetOne, datasetTwo, datasetThree, ds1Name, ds2Name, "Total");
}

function makeCumulativeDataSet(dataset) {
    /*
    Used for the line chart where the user might want to convert the line chart into cumulative version.
    */
    var cumulativeSet = [];
    for (var i = 0; i < dataset.length; i++) {
        if (i == 0) {
            cumulativeSet[i] = dataset[i];
        } else {
            cumulativeSet[i] = cumulativeSet[i - 1] + dataset[i];
        }

    }
    return cumulativeSet;
}

/*
Helper functions
*/

function calculateOldestDateTime(data) {
    var times = data.map(function(a) {
        return parseInt(a["date"])
    });
    return new Date(Math.min.apply(Math, times) * 1000);
}

function calculateLatestDateTime(data) {
    var times = data.map(function(a) {
        return parseInt(a["date"])
    });
    return new Date(Math.max.apply(Math, times) * 1000);
}

function setMaxDateRange(to, from) {
    var oldestTime = calculateOldestDateTime(stressLogs);
    var latestTime = calculateLatestDateTime(stressLogs);
    var oldestTime = (oldestTime.getMonth() + 1).toString() + '/' + oldestTime.getDate() + '/' + oldestTime.getFullYear().toString()
    var latestTime = (latestTime.getMonth() + 1).toString() + '/' + latestTime.getDate() + '/' + latestTime.getFullYear().toString()

    $(from).val(oldestTime);
    $(to).val(latestTime);

    if (to == "#to_area") {
        setUpAreaDateRange();
        refreshAreaChart();
    } else {
        setUpScatterDateRange();
        refreshScatterChart();
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function cartesian(arg) {
    var r = [],
        max = arg.length - 1;

    function helper(arr, i) {
        for (var j = 0, l = arg[i].length; j < l; j++) {
            var a = arr.slice(0); // clone arr
            a.push(arg[i][j]);
            if (i == max)
                r.push(a);
            else
                helper(a, i + 1);
        }
    }
    helper([], 0);
    return r;
}

function unique(arr) {
    var hash = {},
        result = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (!hash.hasOwnProperty(arr[i])) { //it works with objects! in FF, at least
            hash[arr[i]] = true;
            result.push(arr[i]);
        }
    }
    return result;
}

Number.prototype.roundTo = function(num) {
    var resto = this % num;
    if (resto <= (num / 2)) {
        return this - resto;
    } else {
        return this + num - resto;
    }
}

function setUpScatterDateRange() {
    $("#ui-datepicker-div").remove();
    var dateFormat = "mm/dd/yy";
    from = $("#from")
        .datepicker({
            defaultDate: new Date(),
        })
        .on("change", function() {
            to.datepicker("option", "minDate", getScatterDate(this));
        }),
        to = $("#to").datepicker({
            defaultDate: new Date()
        })
        .on("change", function() {
            from.datepicker("option", "maxDate", getScatterDate(this));
        });

    function getScatterDate(element) {
        var date;
        try {
            date = $.datepicker.parseDate(dateFormat, element.value);
        } catch (error) {
            date = null;
        }
        refreshScatterChart();
        return date;
    }
}

function setUpAreaDateRange() {
    $("#ui-datepicker-div").remove();
    var dateFormat = "mm/dd/yy";
    from = $("#from_area")
        .datepicker({
            defaultDate: new Date(),

        })
        .on("change", function() {
            to.datepicker("option", "minDate", getAreaDate(this));
        }),
        to = $("#to_area").datepicker({
            defaultDate: new Date()
        })
        .on("change", function() {
            from.datepicker("option", "maxDate", getAreaDate(this));
        });

    function getAreaDate(element) {
        var date;
        try {
            date = $.datepicker.parseDate(dateFormat, element.value);
        } catch (error) {
            date = null;
        }
        refreshAreaChart();
        return date;
    }
}

/*
Event listeners. These listeners are linked to different design controls and once a 
user changes a design controls, one of these listeners will fire and essentially refresh a 
visualization.
*/

$('.selectpicker.time').on('changed.bs.select', function(e) {
    refreshLineChart();
});
$('.selectpicker.ds1').on('changed.bs.select', function(e) {
    refreshLineChart();
});
$('.selectpicker.ds2').on('changed.bs.select', function(e) {
    refreshLineChart();
});
$("#yesLastBlock").change(function() {
    refreshLineChart();
});
$("#noLastBlock").change(function() {
    refreshLineChart();
});
$("#yesCumulative").change(function() {
    refreshLineChart();
});
$("#noCumulative").change(function() {
    refreshLineChart();
});
$(".selectpicker.variables").on('changed.bs.select', function(e) {
    refreshDemographicChart();
});
$(".selectpicker.filter_scatter").on('changed.bs.select', function(e) {
    refreshScatterChart();
});
$(".selectpicker.x_axis_scatter").on('changed.bs.select', function(e) {
    refreshScatterChart();
});
$(".selectpicker.y_axis_scatter").on('changed.bs.select', function(e) {
    refreshScatterChart();
});
$(".selectpicker.z_axis_scatter").on('changed.bs.select', function(e) {
    refreshScatterChart();
});
$(".selectpicker.colour_scatter").on('changed.bs.select', function(e) {
    refreshScatterChart();
});
$(".selectpicker.x_axis_area").on('changed.bs.select', function(e) {
    if ($(".selectpicker.x_axis_area").val() == "temperature") {
        $("#bin_area").slider("option", "max", 60);
        $("#bin_area").slider("option", "disabled", false);
    } else if ($(".selectpicker.x_axis_area").val() == "accelx" || $(".selectpicker.x_axis_area").val() == "accely" || $(".selectpicker.x_axis_area").val() == "accelz") {
        $("#bin_area").slider("option", "max", 200);
        $("#bin_area").slider("option", "disabled", false);
    } else if ($(".selectpicker.x_axis_area").val() == "date") {
        $("#bin_area").slider("option", "max", 10);
        $("#bin_area").slider("option", "disabled", true);
    } else {
        $("#bin_area").slider("option", "disabled", false);
    }
    if ($(".selectpicker.x_axis_area").val() == "temperature") {
        $("#interval_area").slider("option", "max", 60);
    } else if ($(".selectpicker.x_axis_area").val() == "accelx" || $(".selectpicker.x_axis_area").val() == "accely" || $(".selectpicker.x_axis_area").val() == "accelz") {
        $("#interval_area").slider("option", "max", 200);
    } else if ($(".selectpicker.x_axis_area").val() == "date") {
        $("#interval_area").slider("option", "max", 10);
    }
    refreshAreaChart();
});
$(".selectpicker.graph_type_area").on('changed.bs.select', function(e) {
    refreshAreaChart();
});
$(".selectpicker.colour_area").on('changed.bs.select', function(e) {
    refreshAreaChart();
});
$(".selectpicker.filter_area").on('changed.bs.select', function(e) {
    refreshAreaChart();
});
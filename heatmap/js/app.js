var users = {};

// Setup timeline slider
var hours = ["12AM", "1AM", "2AM", "3AM", "4AM", "5AM", "6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM",
  "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"];

var config = {
  "animationFPS": 30,
  "liveFeed": true,
  "timeline": false,
  "circleRadius": 15,
  "maxCircleRadius": 50
};

var livePopup;
var animationTimer;
var animationFrameId;

// Store stress map points
var dataSet = [];
var liveFeedPoint = [];
var dataSetGeoJSON;
var liveFeedPointGeoJSON;

// Animation settings 
var initialOpacity = 1;
var opacity = initialOpacity;
var radius = config.circleRadius;


var mobileFirebaseRef = null;
var mobileSetup = false;
var userFirebaseRef = null;
var userPowerFirebaseRef = null;

// status
var mapLoaded = false;


// Initialize the map
mapboxgl.accessToken = 'pk.eyJ1IjoibWthaXJ5cyIsImEiOiJjNGNlYTA0OWU0ZDljMGVjMzI5Yjg2MzdiMTI1OThiNyJ9.SodIF_efUKnM4apPXFBbpw';

var startingPoint = [144.9633, -37.8141];  // Melbourne starting position
var bounds = [  // set map boundary roughly to Australia
  [105, -45],
  [160, -9]
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mkairys/cink890vs003nb2nmex9x3xh9',
  center: startingPoint, 
  zoom: 12,
  maxBounds: bounds,
  attributionControl: false // TODO: Add attribution to Mapbox, OpenStreetMap at bottom right
});

var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

// Map events
map.on('load', function() {
  mapLoaded = true;
});

map.on('mousemove', function(e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['stressMapPointPrimary'] });
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

  if (!features.length) {
    popup.remove();
    return;
  }

  var feature = features[0];

  // Populate the popup and set its coordinates
  // based on the feature found.
  popup.setLngLat(feature.geometry.coordinates)
    .setHTML(buildFeatureDescription(feature.properties))
    .addTo(map);
});

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCDDj2gYfQJHb4SMctSfaPtdMO-F3eK0Rw",
  authDomain: "stress-pendant.firebaseapp.com",
  databaseURL: "https://stress-pendant.firebaseio.com",
  storageBucket: "stress-pendant.appspot.com",
});

// Listen to auth state
firebase.auth().onAuthStateChanged(function(user) {
  if (user) { // Loged in

    listenToUserPower(user.uid);
    
  }
});

function clearTheMap() {
  dataSet = [];
  updateMapSource(dataSet, false);

  if (livePopup !== null) {
    livePopup.remove();
  }

  liveFeedPoint = [];
  updateMapSource(liveFeedPoint, true);

  map.flyTo({
    center: startingPoint
  });
}

function listenToUserPower(uid) {
  userPowerFirebaseRef = firebase.database().ref('/user-power/' + uid);

  userPowerFirebaseRef.on('value', function(snapshot) {
    livePopup = null;
    clearTheMap();
    listenToParticipants(snapshot.val().data);
  });
}

function listenToStress(data) {
  mobileFirebaseRef = firebase.database().ref('/' + data + '/stresslogs');

  mobileFirebaseRef.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      showMapPoints(childSnapshot);
    });
    mobileSetup = true;
    updateMapSource(data, false);
    listenForLiveFeed();

    $('#user-info').show();
    $('#loading').hide();
  });
}

function listenToParticipants(data) {
  var userFirebaseRef = firebase.database().ref('/' + data + '/participants');

  userFirebaseRef.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var user = childSnapshot.val();
      users[user['participant-id']] = {
        age: user.age,
        gender: user.gender
      };
    });

    if (mapLoaded) {
      listenToStress(data);
    } else {
      map.on('load', function() {
        listenToStress(data);
      });
    }

  });
}

// Document ready
$(function() {
  
  // Listen for live feed toggle
  $('#live-toggle').change(function() {
    if ($(this).is(":checked")) {
      config.liveFeed = true;
      map.setLayoutProperty('stressMapPointLiveAnimated', 'visibility', 'visible');
      map.setLayoutProperty('stressMapPointLive', 'visibility', 'visible');
      if (livePopup) {
        livePopup.addTo(map);
        // Fade out after 5 seconds
        setTimeout(function() {
          if (livePopup) {
            $(livePopup._container).fadeOut();
          }
        }, 5000);

        map.flyTo({
          center: liveFeedPoint[0].geometry.coordinates
        });
      }
    } else {
      config.liveFeed = false;
      map.setLayoutProperty('stressMapPointLiveAnimated', 'visibility', 'none');
      map.setLayoutProperty('stressMapPointLive', 'visibility', 'none');
      if (livePopup) {
        livePopup.remove();
      }
    }
  });

  // Listen for timeline toggle
  $('#timeline-toggle').change(function() {
    if ($(this).is(":checked")) {
      config.timeline = true;
      $('#timeline').show();
    } else {
      config.timeline = false;
      $('#timeline').fadeOut();
      clearFilters();
    }
  });

  $('.slider')
    // activate the slider with options
    .slider({ 
      min: 0, 
      max: hours.length - 1,
      value: 11 
    })
    .slider("pips", {
      rest: "label",
      labels: hours
    })
    // and whenever the slider changes, lets echo out the month
    .on("slide", function(e, ui) {
      filterBy(ui.value);
    });
});



function filterBy(hour) {
  // Remove all popups
  popup.remove();
  livePopup.remove();

  map.setFilter('stressMapPointPrimary', ['==', 'hour', hour]);
  map.setFilter('stressMapPointSecondaryInside', ['==', 'hour', hour]);
  map.setFilter('stressMapPointSecondaryOutside', ['==', 'hour', hour]);
}

function clearFilters() {
  // Better way? Too tired :-)
  map.setFilter('stressMapPointPrimary', ["all"]);
  map.setFilter('stressMapPointSecondaryInside', ["all"]);
  map.setFilter('stressMapPointSecondaryOutside', ["all"]);
}

function createGeoJSONPointFeature(data) {
  var pointFeature = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [data.longitude, data.latitude]
    },
    "properties": {
      "date": data.date,
      "timestamp": data.timestamp,
      "temperature": data.temperature,
      "gender": data.gender,
      "ageGroup": data.ageGroup,
      "hour": data.hour,
      "day": data.day,
      "month": data.month
    }
  };

  return pointFeature;
}

function setupMapSource() {
  map.addSource("stressMapPoints", dataSetGeoJSON);
}

function setupLiveMapSource() {
  map.addSource("stressMapLivePoint", liveFeedPointGeoJSON);
}

function setupLiveMapLayers() {
  // Animated circle for latest live feed value
  map.addLayer({
    "id": "stressMapPointLiveAnimated",
    "source": "stressMapLivePoint",
    "type": "circle",
    "paint": {
      "circle-radius": config.circleRadius,
      "circle-radius-transition": { duration: 0 },
            "circle-opacity-transition": { duration: 0 },
      "circle-color": "orange"
    }
  });

  map.addLayer({
    "id": "stressMapPointLive",
    "source": "stressMapLivePoint",
    "type": "circle",
    "paint": {
      "circle-radius": config.circleRadius,
      "circle-color": "orange"
    }
  },'stressMapPointPrimary');
}

function setupMapLayers() {
  map.addLayer({
    "id": "stressMapPointSecondaryOutside",
    "source": "stressMapPoints",
    "type": "circle",
    "paint": {
      "circle-radius": config.circleRadius * 1.5,
      "circle-color": "#5f1969",
      "circle-opacity": 0.15,
      "circle-blur": 1
    }
  });

  map.addLayer({
    "id": "stressMapPointSecondaryInside",
    "source": "stressMapPoints",
    "type": "circle",
    "paint": {
      "circle-radius": config.circleRadius * 1.25,
      "circle-color": "#fb4d6d",
      "circle-opacity": 0.25,
      "circle-blur": 1
    }
  });

  map.addLayer({
    "id": "stressMapPointPrimary",
    "source": "stressMapPoints",
    "type": "circle",
    "paint": {
      "circle-radius": config.circleRadius * 1,
      "circle-color": "rgba(255,255,255,0.02)",
      "circle-blur": 1
    }
  });
}

function buildFeatureDescription(data) {
  var gender = (data.gender == "Male") ? "\u2642" : "\u2640";

  return (
    '<div class="tooltip">' +
      '<div class="tooltip-gender ' + data.gender + '">' + data.gender + '</div>' +
      '<div class="tooltip-timestamp">' + data.date + '</div>' +
      '<div class="tooltip-age">' +
      '<div class="tooltip-label">AGE</div>' +   
      '<div class="tooltip-value">' + data.ageGroup + '</div>' +  
    '</div>' +      
      '<div class="tooltip-temp">' +
      '<div class="tooltip-label">TEMP</div>' +   
      '<div class="tooltip-value">' + data.temperature + '&deg;C</div>' +  
      '</div>' +            
    '</div>'
  );
}

function updateMapSource(data, isLivePoint) {
  // Setup GeoJSON dataset
  var geoJSON = {
    "type": "FeatureCollection",
    "features": data
  };

  if (!isLivePoint) {
    // Create or update GeoJSON data source
    if (dataSetGeoJSON == null) {
      dataSetGeoJSON = new mapboxgl.GeoJSONSource({ 
        data: geoJSON
      });
    } else {
      dataSetGeoJSON.setData(geoJSON);
      // Create layers if not already present in map
      if (map.getSource("stressMapPoints") == null) {
        setupMapSource();
        setupMapLayers(); 
      }
    }
  } else {
    if (liveFeedPointGeoJSON == null) {
      liveFeedPointGeoJSON = new mapboxgl.GeoJSONSource({ 
        data: geoJSON
      });
    } else {
      liveFeedPointGeoJSON.setData(geoJSON);
      // Create layers if not already present in map
      if (map.getSource("stressMapLivePoint") == null) {
        setupLiveMapSource();
        setupLiveMapLayers(); 
      }
    }
  }
}

function listenForLiveFeed() {
  if (mobileSetup && mobileFirebaseRef) {
    // Live feed
    mobileFirebaseRef.orderByChild('date').limitToLast(1).on("child_added", function(snapshot) {
      if (config.liveFeed) {
        showLivePoint(snapshot);
      }
      showMapPoints(snapshot, mobileSetup);
    });
  }
}

function showLivePoint(snapshot) {
  var date = new Date(snapshot.val()["date"] * 1000);

  var data = {
    "date": snapshot.val()["date-AEST"], 
    "timestamp": snapshot.val()["date"],
    "day": date.getDay() + 1, 
    "month": date.getMonth() + 1,
    "hour": date.getHours(),
    "latitude": snapshot.val()["latitude"], 
    "longitude": snapshot.val()["longitude"],
    "temperature": snapshot.val()["temperature"],
    "gender": users[snapshot.val()["participant-id"]].gender,
    "ageGroup": users[snapshot.val()["participant-id"]].age
  };

  // Only showing latest value, no need for multiple values in array
  if (dataSet.length == 0) {
    liveFeedPoint.push(createGeoJSONPointFeature(data));
  } else {
    liveFeedPoint[0] = createGeoJSONPointFeature(data);
  }
  
  updateMapSource(liveFeedPoint, true);

  // Fly to stressed location
  map.flyTo({
    center: [
      data.longitude,
      data.latitude
    ]
  });

  // Remove existing livePopup if present
  if (livePopup != null) {
    livePopup.remove();
  }

  // Add livePopup
  livePopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true
  });

  livePopup.setLngLat([data.longitude, data.latitude])
    .setHTML(buildFeatureDescription(data))
    .addTo(map);

  // Fade out after 5 seconds
  setTimeout(function() {
    $(livePopup._container).fadeOut();
  }, 5500); 

        // Start the animation and remove previous timer if present
  if (animationTimer != null) {
    clearTimeout(animationTimer);
  }
  animationTimer = animateMarker();
}

function showMapPoints(snapshot, isReady) {
  // Check if user exists, some phantom users listed in the database for some reason
  if (users[snapshot.val()["participant-id"]] != null) {
    var date = new Date(snapshot.val()["date"] * 1000);

    var data = { 
      "date": snapshot.val()["date-AEST"], 
      "timestamp": snapshot.val()["date"],
      "day": date.getDay() + 1, 
      "month": date.getMonth() + 1,
      "hour": date.getHours(),
      "latitude": snapshot.val()["latitude"], 
      "longitude": snapshot.val()["longitude"],
      "temperature": snapshot.val()["temperature"],
      "gender": users[snapshot.val()["participant-id"]].gender,
      "ageGroup": users[snapshot.val()["participant-id"]].age
    };

    // Only showing latest value, no need for multiple values in array
    dataSet.push(createGeoJSONPointFeature(data));  
    if (isReady) {
      updateMapSource(dataSet, false);
    }
  }
}

function animateMarker() {
  // Start the animation and remove previous timer if present
  if (animationTimer != null) {
    clearTimeout(animationTimer);
    cancelAnimationFrame(animationFrameId);
  }
  animationTimer = setTimeout(function() {
    animationFrameId = requestAnimationFrame(animateMarker);

    radius += (config.maxCircleRadius - radius) / config.animationFPS;
    opacity -= 0.9 / config.animationFPS;

    if (opacity <= 0) {
      radius = config.circleRadius;
      opacity = initialOpacity;
    } 

    map.setPaintProperty('stressMapPointLiveAnimated', 'circle-radius', radius);
    map.setPaintProperty('stressMapPointLiveAnimated', 'circle-opacity', opacity);
  }, 1000 / config.animationFPS);
}

function showLoginError(message) {
  $('.form-control.error p').html('<span class="icon icon-warning"></span>' + message);
}

function clearLoginError() {
  $('.form-control.error p').html('');
}
let x = 0;
let y = 0;

require([
    "esri/Map",
    "esri/layers/GeoJSONLayer",
    "esri/views/MapView",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/widgets/Locate",
    "esri/widgets/Track"
], function(
    Map,
    GeoJSONLayer,
    MapView,
    Expand,
    LayerList,
    Locate,
    Track
) {
    $('#add-review-text').hide();

    class ParkLayer {
        constructor(name, sql, renderer, popupTemplate) {
            this.name = name;
            this.sql = sql;
            this.popupTemplate = popupTemplate;
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=" + sql);
            this.layer = GeoJSONLayer({
                title: this.name,
                url: this.url,
                popupTemplate: this.popupTemplate,
                renderer: renderer
            });
        }
    };

    class ActivityLayer extends ParkLayer {
        constructor(name, sql, symbol, popupTemplate) {
            super(name, sql);
            this.symbol = symbol;
            this.popupTemplate = popupTemplate;
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * from wmnf_activity_location_view WHERE marker_activity_group = '" + sql + "'");
            this.layer = GeoJSONLayer({
                title: this.name,
                url: this.url,
                popupTemplate: this.popupTemplate,
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "web-style",
                        styleName: "Esri2DPointSymbolsStyle",
                        name: this.symbol
                    },
                    visualVariables: [{
                        type: "size",
                        valueExpression: "$view.scale",
                        stops: [
                            { value: 36112, size: 20 },
                            { value: 36112 * 2, size: 16 },
                            { value: 36112 * 8, size: 12 },
                            { value: 36112 * 32, size: 8 }
                        ]
                    }]
                }
            });
        }
    };

    const trailRenderer = {
        type: "simple",
        symbol: {
            type: "simple-line",
            color: "#42855A"
        },
        visualVariables: [{
            type: "size",
            valueExpression: "$view.scale",
            stops: [
                { value: 36112, size: "2px" },
                { value: 36112 * 2, size: "1px" },
                { value: 36112 * 32, size: "0.5px" }
            ]
        }]
    };

    const reviewRenderer = {
        type: "simple",
        symbol: {
            type: "web-style",
            styleName: "Esri2DPointSymbolsStyle",
            name: "star"
        },
        visualVariables: [{
            type: "size",
            valueExpression: "$view.scale",
            stops: [
                { value: 36112, size: 16 },
                { value: 36112 * 2, size: 12 },
                { value: 36112 * 8, size: 10 },
                { value: 36112 * 32, size: 8 }
            ]
        }]
    };

    const activityPopupTemplate = {
        title: "<b>{rec_area_name}</b>",
        content: "<b>{activity_types}</b> <br> {rec_area_description}... <a href={rec_area_url} target='_blank'> More info</a> <br> <b>Latitude:</b> {latitude} <br> <b>Longitude:</b> {longitude}"
    };

    const trailsPopupTemplate = {
        title: "<b>{trail_name}</b>",
        content: "<b>Segment length:</b> {segment_length} miles<br><b>Surface:</b> {trail_surface}<br><b>Typical grade:</b> {typical_trail_grade}<br><b>Hiker access:</b> {hiker_pede}"
    };

    const reviewsPopupTemplate = {
        title: "<b>Rating: {rating} stars</b>",
        content: "{review} <br> Reviewed by {username} on {date_text}."
    };

    const campingLayer = new ActivityLayer('Camping', 'Camping and Cabins', 'campground', activityPopupTemplate);
    const hikingLayer = new ActivityLayer('Trail heads', 'Hiking', 'trail', activityPopupTemplate);
    const overlookLayer = new ActivityLayer('Scenic overlook', 'Nature Viewing', 'landmark', activityPopupTemplate);
    const picnicLayer = new ActivityLayer('Picnic area', 'Picnicking', 'restaurant', activityPopupTemplate);

    const trailSql = 'SELECT cartodb_id, trail_name, segment_length, trail_surface, typical_trail_grade, hiker_pede, the_geom from wmnf_trail_lines';
    const trailLayer = new ParkLayer('Trails', trailSql, trailRenderer, trailsPopupTemplate);

    const reviewSql = "SELECT cartodb_id, username, rating, review, date_part('month', date) || '/' || date_part('day', date) || '/' || date_part('year', date) as date_text, the_geom from wmnf_user_reviews"
    const reviewLayer = new ParkLayer('Reviews',  reviewSql, reviewRenderer, reviewsPopupTemplate);

    const map = new Map({
        basemap: "topo-vector",
        layers: [
            trailLayer.layer,
            campingLayer.layer,
            hikingLayer.layer,
            overlookLayer.layer,
            picnicLayer.layer,
            reviewLayer.layer
        ]
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 9,
        center: [-71.5, 44.1]
    });

    // Toggle layers on and off
    const layerList = new LayerList({
        view: view,
        listItemCreatedFunction: function(event) {
            const item = event.item;
            if (item.layer.type != "group") {
                // dont show legend twice
                item.panel = {
                    content: "legend",
                    open: true
                };
            }
        }
    });

    // Minimize and expand layer toggle
    const layerListExpand = new Expand({
        view: view,
        content: layerList,
        expandTooltip: "Choose which layers are displayed"
    });

    view.ui.add(layerListExpand, "top-left");

    // LOCATE
    const locateBtn = new Locate({
        view: view
    });
    view.ui.add(locateBtn, "top-left");

    // TRACK
    const trackBtn = new Track({
        view:view
    });
    view.ui.add(trackBtn, "top-left");

    view.when(function(){
        track.start();
    });

    // SEARCH
    view.ui.add("search-button", "top-left");
    // 1. User clicks 'Search' button
    $('#search-button').on('click', function(){
        // message window appears telling user to click location on the map
        // document.getElementById('footer').innerHTML = '<p>Click on map where you want to search near.</p>';
        alert("Click on map where you want to search.");

        // 2. User clicks on the map and the coords are returned
        view.on(['pointer-down'], function(evt){
            function getCoords(evt, callback) {
                // Return the coordinates of the clicked location
                let pt = view.toMap({x: evt.x, y: evt.y});
                y = pt.latitude.toFixed(7);
                x = pt.longitude.toFixed(7);
                setTimeout(() => { callback(); }, 500);
                ;
            }

            getCoords(evt, function() {
                // show user review form
                // $('#footer').hide();
            });

            // 3. Query is sent to DB to search for nearby locations
            const url = "https://tomtl.carto.com/api/v2/sql";
            const searchSql = "SELECT *, " +
                "ST_Distance(loc.the_geom::geography, ST_SetSRID(ST_MakePoint(" + x + ", " + y + "), 4326)::geography) /1609.34 as distance_miles " +
                "FROM wmnf_activity_location_view as loc " +
                "WHERE ST_Intersects( ST_Buffer(ST_SetSRID(ST_MakePoint(" + x + ", " + y + "), 4326)::geography, 10000)::geometry, loc.the_geom )" +
                "ORDER BY 9 LIMIT 20 ";

            // 4. Load Results to a layer and add to map
            const resultsRenderer = {
                type: "simple",
                symbol: {
                    type: "simple-marker",
                    style: "circle",
                    color: [0, 0, 0, 0],
                    outline: { color: "#e6e6e6"}
                },
                visualVariables: [{
                    type: "size",
                    valueExpression: "$view.scale",
                    stops: [
                        { value: 36112, size: 22 },
                        { value: 36112 * 2, size: 18 },
                        { value: 36112 * 8, size: 14 },
                        { value: 36112 * 32, size: 10 }
                    ]
                }]
            };

            const resultsPopupTemplate = {
                title: "<b>{rec_area_name}</b>",
                content: "<b>{activity_types}</b> <br> {rec_area_description}... <a href={rec_area_url} target='_blank'> More info</a> <br> <b>Latitude:</b> {latitude} <br> <b>Longitude:</b> {longitude} <br> <b>Distance from search origin: </b> {distance_miles} miles",
                overwriteActions: true
            };

            const resultsLayer = new ParkLayer('Results',  searchSql, resultsRenderer, resultsPopupTemplate).layer;
            map.add(resultsLayer);

            view.popup.autoOpenEnabled = false;
            view.popup.collapsed = true;
            view.popup.dockEnabled = true;
            view.popup.dockOptions = {
                buttonEnabled: "true",
                position: "bottom-left"
            };

            // 5. Show results in a popup that can be clicked through
            const resultsFeatures = resultsLayer.queryFeatures().then(function(results){
                view.goTo(results.features).then(function() {
                    view.popup.open({
                        features: results.features,
                        featureMenuOpen: true,
                        updateLocationEnabled: true
                    });
                });
            });

            view.on(['pointer-down'], function(evt){
                // If user clicks the map, don't search again
                evt.stopPropagation();
            });
        });
    });

    // RATING FEATURE
    // 1. user clicks 'add review' button
    $('#add-review-button').on('click', function(){
        // message window appears telling user to click the map
        // document.getElementById('footer').innerHTML = '<p>Click map where you want to review.</p>';
        alert("Click on the map where you want to review.");

        // 2. User clicks the map and coords are returned
        view.on(['pointer-down'], function(evt){
            function getCoords(evt, callback) {
                // Return the coordinates of the clicked location
                let pt = view.toMap({x: evt.x, y: evt.y});
                y = pt.latitude.toFixed(7);
                x = pt.longitude.toFixed(7);
                setTimeout(() => { callback(); }, 500);
                ;
            }

            getCoords(evt, function() {
                // show user review form
                $('#footer').hide();
                $('#viewDiv').css("height", "50%");
                $('#add-review-text').show();
            });

            // 3. User enters review information

            // 4. User clicks submit button
            $('.submit-button').unbind('click').on('click', function(){
                var form = document.getElementsByClassName('review-form');
                if (form[0].checkValidity() === true) {
                    // if user entry is valid then submit review
                    submitReview();
                } else {
                    // if not valid then wait for user to fix it
                    console.warn('User entry not valid');
                    $('.review-form').removeAttr('.was-validated');
                }
            });
        });
    });
});

function submitReview(){
    // Get the fields needed for adding a review
    var username = document.getElementById("inputName").value;
    var rating = document.getElementById("inputRating").value;
    var review = document.getElementById("inputReview").value;
    console.log("Submit review: ", username, rating, review, x, y);
    createReview(username, rating, review, y, x);
};

function createReview(name, rating, review, latitude, longitude) {
    // Format the review SQL insert statement
    const m = new Date();
    const dateString =
        m.getUTCFullYear() + "-" +
        ("0" + (m.getUTCMonth()+1)).slice(-2) + "-" +
        ("0" + m.getUTCDate()).slice(-2) + "T" +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2)
    ;

    const geom = "ST_SetSRID(ST_MakePoint(" + longitude + ", " + latitude + "), 4326)";
    const validated = "TRUE";

    const valuesString = "('" + name + "', '" + dateString  + "', " + rating + ", '" + review + "', " + validated + ", " + geom + ")";

    const url = "https://tomtl.carto.com/api/v2/sql";
    const sql = "INSERT INTO wmnf_user_reviews (username, date, rating, review, validated, the_geom) VALUES " + valuesString;

    postInsert(url, sql);
};

function postInsert(url, sql) {
    // POST the record insert to the database
    $.post( url, {
        q: sql,
        api_key: 'LHES7OUmRgnT6zZVkJFV1w'
        })
        .done(function(data){
            // If successful then refresh the page
            console.log("data loaded");
            location.reload();
        })
        .fail(function(data){
            console.error("load failed");
            console.log("URL: " + url);
            console.log("SQL: " + sql);
            console.log(data.responseText);
            console.log(data);
        })
        .always(function(data){
            console.log("Finished load");
        })
};

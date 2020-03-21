let x = 0;
let y = 0;

require([
    "esri/Map",
    "esri/layers/GeoJSONLayer",
    "esri/views/MapView"
], function(
    Map,
    GeoJSONLayer,
    MapView
) {
    $('#add-review-text').hide();

    class ParkLayer {
        constructor(name, sql, renderer) {
            this.name = name;
            this.sql = sql;
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=" + sql);
            this.layer = GeoJSONLayer({
                url: this.url,
                renderer: renderer
            });
        }
    };

    class ActivityLayer extends ParkLayer {
        constructor(name, sql, symbol) {
            super(name, sql);
            this.symbol = symbol;
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT fid, the_geom from wmnf_activity_points WHERE marker_activity_group = '" + sql + "'");
            this.layer = GeoJSONLayer({
                title: this.name,
                url: this.url,
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
                            { value: 36112 * 32, size: 6 }
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
                { value: 36112 * 32, size: 4 }
            ]
        }]
    };

    const campingLayer = new ActivityLayer('camping', 'Camping and Cabins', 'campground');
    const hikingLayer = new ActivityLayer('hiking', 'Hiking', 'trail');
    const overlookLayer = new ActivityLayer('overlook', 'Nature Viewing', 'landmark');
    const picnicLayer = new ActivityLayer('picnic', 'Picnicking', 'restaurant');
    const trailLayer = new ParkLayer('trails', 'SELECT fid, the_geom from wmnf_trail_lines', trailRenderer);
    const reviewLayer = new ParkLayer('reviews',  'SELECT fid, the_geom from wmnf_user_reviews', reviewRenderer);

    const map = new Map({
        basemap: "topo-vector",
        layers: [
            // trailLayer.layer,
            // campingLayer.layer,
            // hikingLayer.layer,
            // overlookLayer.layer,
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


    // RATING FEATURE
    // 1- user clicks 'add review' button
    $('#add-review-button').on('click', function(){
        // message window appears telling user to click the map
        document.getElementById('footer').innerHTML = '<p>Click map where you want to review.</p>';

        // validate the form and disable the submit button if not valid
        (function() {
          'use strict';
          window.addEventListener('load', function() {
            // Fetch all the forms we want to apply custom Bootstrap validation styles to
            var forms = document.getElementsByClassName('review-form');
            // Loop over them and prevent submission
            var validation = Array.prototype.filter.call(forms, function(form) {
              form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                  event.preventDefault();
                  event.stopPropagation();
                }
                form.classList.add('was-validated');
              }, false);
            });
          }, false);
        })();

        // user clicks the map and coords are returned
        view.on(['pointer-down'], function(evt){
            console.log(evt);
            let pt = view.toMap({x: evt.x, y: evt.y});
            y = pt.latitude.toFixed(7);
            x = pt.longitude.toFixed(7);
            console.log("Clicked location: ", x, y);

            // user enters review information
            $('#footer').hide();
            $('#viewDiv').css("height", "50%");
            $('#add-review-text').show();

            var form = document.getElementsByClassName('review-form');
            // form.addEventListener('submit', function(event) {

        });
    });

    // 5-
    // 6- review gets added to map or map refreshes to show review

});

function submitReview(){
    console.log("Someone clicked it!");
    var username = document.getElementById("inputName").value;
    var rating = document.getElementById("inputRating").value;
    var review = document.getElementById("inputReview").value;
    console.log("NAME: ", username);
    console.log("RATING: ", rating);
    console.log("REVIEW: ", review);
    console.log("COORDS: ", x, y);
    addReview(username, rating, review, y, x);
};

function addReview(name, rating, review, latitude, longitude) {
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

    const url = "https://tomtl.carto.com/api/v2/sql"
    const sql = "INSERT INTO wmnf_user_reviews (username, date, rating, review, validated, the_geom) VALUES " + valuesString;

    postUpdate(url, sql);
};

function postUpdate(url, sql) {
    $.post( url, {
        q: sql,
        api_key: 'LHES7OUmRgnT6zZVkJFV1w'
        })
        .done(function(data){
            console.log("data loaded");
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

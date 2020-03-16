require([
    "esri/Map",
    "esri/layers/GeoJSONLayer",
    "esri/views/MapView"
], function(
    Map,
    GeoJSONLayer,
    MapView
) {
    class ParkLayer {
        constructor(name, sql) {
            this.name = name;
            this.sql = sql;
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=" + sql);
            this.layer = GeoJSONLayer({url: this.url});
        }
    };

    class ActivityLayer extends ParkLayer {
        constructor(name, sql) {
            super(name, sql);
            this.url = ("https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT fid, the_geom from wmnf_activity_points WHERE marker_activity_group = '" + sql + "'");
            this.layer = GeoJSONLayer({url: this.url});
        }
    };

    const campingLayer = new ActivityLayer('camping', 'Camping and Cabins');
    const hikingLayer = new ActivityLayer('hiking', 'Hiking');
    const overlookLayer = new ActivityLayer('overlook', 'Nature Viewing');
    const picnicLayer = new ActivityLayer('picnic', 'Picnicking');
    const trailLayer = new ParkLayer('trails', 'SELECT fid, the_geom from wmnf_trail_lines');
    const reviewLayer = new ParkLayer('reviews',  'SELECT fid, the_geom from wmnf_user_reviews');

    const map = new Map({
        basemap: "topo-vector",
        layers: [
            campingLayer.layer,
            hikingLayer.layer,
            overlookLayer.layer,
            picnicLayer.layer,
            trailLayer.layer,
            reviewLayer.layer
        ]
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 9,
        center: [-71.5, 44.1]
    });
});

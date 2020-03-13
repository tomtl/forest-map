require([
    "esri/Map",
    "esri/layers/GeoJSONLayer",
    "esri/views/MapView"
], function(
    Map,
    GeoJSONLayer,
    MapView
) {
    const pointsLayer = GeoJSONLayer({
        url: "https://tomtl.carto.com/api/v2/sql?format=GeoJSON&q=SELECT fid as id, the_geom from wmnf_activity_points limit 9"
    });

    const map = new Map({
        basemap: "topo-vector",
        layers: [pointsLayer]
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 9,
        center: [-71.5, 44.1]
    });
});

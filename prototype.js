let map = L.map("map").setView([-25.334097, -49.3396], 7);

// add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

// FeatureGroup is to store editable layers
var drawnItems = new L.geoJSON();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polyline: false,
        marker: false,
        circlemarker: false,
        circle: false
    }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function(e) {
    var type = e.layerType;
    layer = e.layer;

    if (type === 'marker') {
        layer.bindPopup('A popup!');
    }
    getPopn(layer);
    layer.on('click', function() {
        console.log(e)
        getPopn(e.layer)
    });
    $("#resultsTbl").append($("<tr>").append($("<td>City</td><td>Population</td>")));
    drawnItems.addLayer(layer);
});

function getPopn(layer) {
    var polygonStr = layer.getLatLngs()[0].map(p => '(' + p.lat + ',' + p.lng + ')').toString();
    $.get(`https://public.opendatasoft.com/api/records/1.0/search/?dataset=worldcitiespop&q=&sort=population&facet=country&geofilter.polygon=${polygonStr}`, function(data) {
        console.log(data);
        total_popn = 0;
        $("#resultsTbl")[0].innerHTML = "";
        $("#resultsTbl").append($("<tr>").append($("<td>City</td><td>Population</td>")));
        data.records.forEach(r => {
            console.log(r.fields.city)
            if (r.fields.population != null) {
                $("#resultsTbl").append("<tr><td>" + r.fields.city + "</td><td>" + r.fields.population + "</td></tr>");
                // marker = L.marker(L.GeoJSON.coordsToLatLng(r.geometry.coordinates));
                // marker.bindPopup(r.fields.city + "<br>" + r.fields.population);
                // drawnItems.addLayer(marker);
                total_popn += r.fields.population;
            }
        });
        layer.bindTooltip("Population:" + total_popn, { permanent: true, direction: "center", opacity: 0.5 })
    })
}

function saveFile() {
    var blob = new Blob([JSON.stringify(drawnItems.toGeoJSON())], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "test.geojson");
}

function dispFile(contents) {
    document.getElementById('contents').innerHTML = contents
}

function clickElem(elem) {
    // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
    var eventMouse = document.createEvent("MouseEvents")
    eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    elem.dispatchEvent(eventMouse)
}

function openFile(func) {
    readFile = function(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            // fileInput.func(contents);
            document.body.removeChild(fileInput);
            geoobj = L.geoJSON(JSON.parse(contents), {
                onEachFeature: onEachFeature
            });
            geoobj.eachLayer(l => {
                    console.log(l);
                    drawnItems.addLayer(l);
                })
                // drawnItems = L.geoJSON(JSON.parse(contents), {
                // onEachFeature: onEachFeature
                // }).addTo(map);
            $("#resultsTbl").append($("<tr>").append($("<td>City</td><td>Population</td>")));
            drawnItems.getLayers().forEach(layer => getPopn(layer));
        }
        reader.readAsText(file)
    }
    fileInput = document.createElement("input")
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    fileInput.func = func
    document.body.appendChild(fileInput)
    clickElem(fileInput)
}

function onEachFeature(feature, layer) {
    //bind click
    layer.on('click', function(e) {
        // e = event
        console.log(e);
        console.log('Clicked feature layer ID: ' + feature);
        getPopn(e.target)
    });

}
L.easyButton('<img src="leaflet-routing-machine-3.2.12/dist/routing-icon.png"></img><span class="target">&target;</span>', function() {
    if (routing._map) {
        map.removeControl(routing);
        map.off('click', mapClickHandler);
    } else {
        // alert('Route Activated');
        map.addControl(routing);
        map.on('click', mapClickHandler);
    }
}, 'Activate Routing').addTo(map);

let routing = L.Routing.control({
    // waypoints: [
    //     L.latLng(57.74, 11.94),
    //     L.latLng(57.6792, 11.949)
    // ],
    geocoder: L.Control.Geocoder.nominatim(),
    // routeWhileDragging: true
})

function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

function mapClickHandler(e) {
    var container = L.DomUtil.create('div'),
        startBtn = createButton('Start from this location', container),
        destBtn = createButton('Go to this location', container);

    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map);

    L.DomEvent.on(startBtn, 'click', function() {
        routing.spliceWaypoints(0, 1, e.latlng);
        map.closePopup();
    });

    L.DomEvent.on(destBtn, 'click', function() {
        routing.spliceWaypoints(routing.getWaypoints().length - 1, 1, e.latlng);
        map.closePopup();
    });
}
//satellite controler class
class Satellites{
    constructor(url){
        this.url = url;
        this.getTLE().then(
            data => {
                let data_ = data.split('\n');
                let newData = []
                let i =0;
                for(i = 0; i < data_.length-2 ; i+=3){
                    if(data_[i].includes("DEB") || data_[i].includes("R/B")){
                        newData.push([data_[i], data_[i+1], data_[i+2], true]);
                    }
                }
                this.tle_data = newData;
            }
        );
        this.layer = null;
    }

    //remove url error
    getFreeUrl(url){
        return 'https://api.allorigins.win/raw?url=' + url;
    }

    //get TLE from site
    async getTLE(){
        let res = await fetch(this.getFreeUrl(this.url));
        return res.text();
    }
    getSatts(){
        return this.tle_data;
    }
    //update openlayers map
    async updateMap(){
        if(this.tle_data != undefined){
            if (this.layer != null){
                let i=0;
                let newC = [];
                for(i = 0; i < this.tle_data.length ; i++){
                    let sat = satellite.twoline2satrec(this.tle_data[i][1].replace('\r', ''), this.tle_data[i][2].replace('\r', ''));
                    
                    let posAndVel = satellite.propagate(sat, new Date());
                    if(posAndVel[0]!=false){
                        let gmst = satellite.gstime(new Date());
                    
                        let position = satellite.eciToGeodetic(posAndVel.position, gmst);
                    
                        let lat = position.latitude;
                        let lon = position.longitude;

                        const rad2deg = 180 / Math.PI;
                        while (lon < -Math.PI) {
                            lon += 2 * Math.PI;
                        }
                        while (lon > Math.PI) {
                            lon -= 2 * Math.PI;
                        }
                        lat=rad2deg*lat;
                        lon=rad2deg*lon;
                        newC.push([lon, lat]);
                    }
                }
                let modify = this.layer.getSource().getFeatures();
                for(i = 0; i < newC.length ; i++){
                    modify[i].getGeometry().setCoordinates(ol.proj.fromLonLat(newC[i]));
                    if(this.tle_data[i][3] && modify[i].getStyle()==null){
                        modify[i].setStyle(getStyle('blue'));
                    }else if(!this.tle_data[i][3] && modify[i].getStyle()!=null){
                        console.log('a');
                        modify[i].setStyle(null);
                    }
                }
            }else{
                let features = []
                let i = 0;
                for(i = 0; i < this.tle_data.length; i++){
                    let sat = satellite.twoline2satrec(this.tle_data[i][1].replace('\r', ''), this.tle_data[i][2].replace('\r', ''));
                    
                    let posAndVel = satellite.propagate(sat, new Date());
                    if(posAndVel[0]!=false){
                    
                        //tle.push(this.tle_data[i].replace('\r', ''));
                        //tle.push(this.tle_data[i+1].replace('\r', ''));

                        let gmst = satellite.gstime(new Date());
                        
                        let position = satellite.eciToGeodetic(posAndVel.position, gmst);
                        
                        let lat = position.latitude;
                        let lon = position.longitude;

                        const rad2deg = 180 / Math.PI;
                        while (lon < -Math.PI) {
                            lon += 2 * Math.PI;
                        }
                        while (lon > Math.PI) {
                            lon -= 2 * Math.PI;
                        }
                        lat=rad2deg*lat;
                        lon=rad2deg*lon;
                        
                        let fet = new ol.Feature({
                            geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
                        });
                        fet.setProperties({'SatName':this.tle_data[i][0]});

                        features.push(
                            fet 
                        );
                    }
                }
              
                this.layer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: features
                    }),
                    style: getStyle('blue')
                });
                map.addLayer(this.layer);
            }
        }
    }
}

function getStyle(color){
    return new ol.style.Style({
        image: new ol.style.Circle({
            radius:3,
            fill: new ol.style.Fill({color: color}),
            stroke: false
        })
    })
}

//openlayers map
let map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM({
            imageSmoothing: false,
            transition: 0,
            wrapX: false,
            maxZoom: 3
        })
      })
    ],
    view: new ol.View({
      center: [0,0],
      zoom: 0,
      maxZoom: 5,
      constrainResolution: true,
      extent: new ol.View().getProjection().getExtent()
    })
  });

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
 
var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});
map.addOverlay(overlay);
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};
map.on('singleclick', function (evt) {
    if (map.hasFeatureAtPixel(evt.pixel) === true) {
        fet = map.getFeaturesAtPixel(evt.pixel)[0];
        //fet.setStyle(getStyle('red'));

        const coordinate = evt.coordinate;
        
        content.innerHTML = `<p><b>Satellite name</b>: ${
            map.getFeaturesAtPixel(evt.pixel)[0].get('SatName')
        }`;
        overlay.setPosition(coordinate);
    }
});
//space debris tle fonts
celestrak_catalog = "https://celestrak.com/pub/TLE/catalog.txt";

let sateliteCreator = new Satellites(celestrak_catalog);

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
  
sleep(50).then(() => {
    setInterval(() => {
        sateliteCreator.updateMap();
    }, 1000);
});
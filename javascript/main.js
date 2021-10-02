//satellite controler class
class Satellites{
    constructor(url){
        this.url = url;
        this.getTLE().then(
            data => {
                this.tle_data = data.split('\n');
                console.log(this.tle_data);
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

    //update openlayers map
    async updateMap(){
        if(this.tle_data != undefined){
            if (this.layer != null){
                let i=0;
                let newC = [];
                for(i = 0; i < this.tle_data.length-1 ; i+=2){
                    let sat = satellite.twoline2satrec(this.tle_data[i].replace('\r', ''), this.tle_data[i+1].replace('\r', ''));
                    
                    let posAndVel = satellite.propagate(sat, new Date());
                    
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
                let modify = this.layer.getSource().getFeatures();
                for(i = 0; i < newC.length ; i++){
                    modify[i].getGeometry().setCoordinates(ol.proj.fromLonLat(newC[i]));
                }
            }else{
                let features = []
                let tle = [];
                let i = 0;
                for(i = 1; i < this.tle_data.length-2 ; i+=3){
                    let sat = satellite.twoline2satrec(this.tle_data[i].replace('\r', ''), this.tle_data[i+1].replace('\r', ''));
                    
                    let posAndVel = satellite.propagate(sat, new Date());
                    if(posAndVel[0]!=false){
                    
                        tle.push(this.tle_data[i].replace('\r', ''));
                        tle.push(this.tle_data[i+1].replace('\r', ''));

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
                        
                        features.push(
                            new ol.Feature({
                                geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
                            })
                        )
                    }
                }
              
                this.layer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: features
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({color: 'red'}),
                            stroke: false
                        })
                    })
                });
                map.addLayer(this.layer);
                this.tle_data = tle;
            }
        }
    }
}

//openlayers map
let map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: [0,0],
      zoom: 0,
      maxZoom: 3
    })
  });

//space debris tle fonts
indianASAT_url = "https://celestrak.com/NORAD/elements/2019-006.txt";
fengyun1C_url = "https://celestrak.com/NORAD/elements/1999-025.txt";
iridium33_url = "https://celestrak.com/NORAD/elements/iridium-33-debris.txt";
cosmos2251_url = "https://celestrak.com/NORAD/elements/cosmos-2251-debris.txt";

let sateliteCreatorIndian = new Satellites(cosmos2251_url);
let sateliteCreatorFengyun = new Satellites(fengyun1C_url);
//let sateliteCreatorIridium = Satellites();
//let sateliteCreatorCosmos = Satellites();

/*var ret = sateliteCreatorIndian.getTLE().then(
    data => { console.log(data.split('\n'));}
);*/

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
  
sleep(100).then(() => {
    setInterval(() => {
       sateliteCreatorIndian.updateMap(); 
    }, 10);
});
sleep(100).then(() => {
    setInterval(() => {
       sateliteCreatorFengyun.updateMap(); 
    }, 10);
});
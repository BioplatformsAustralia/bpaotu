export const ArcGIS = {
  url: '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    '&copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
}

const esriUrl =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'

export const tileLayer = {
  url: esriUrl,
  attribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — ' +
    'Source: Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community',
  maxZoom: 17,
  minZoom: 10.75,
}

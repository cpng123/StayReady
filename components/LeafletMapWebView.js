// components/LeafletMapWebView.js
import React, {
  useMemo,
  useRef,
  useImperativeHandle,
  useEffect,
  forwardRef,
} from "react";
import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Props:
 *  - lat, lon, height, zoom, showMarker, pins, interactive
 *  - rainfallPoints : [{lat, lon, name?, value?}]  // mm
 *  - windPoints     : [{lat, lon, name?, value?}]  // knots
 *  - tempPoints     : [{lat, lon, name?, value?}]  // °C
 *  - humPoints      : [{lat, lon, name?, value?}]  // %
 *  - pmPoints       : [{lat, lon, name?, value?}]  // µg/m³ (region centroids)
 *  - dengueGeoJSON  : GeoJSON FeatureCollection      // polygons
 *  - overlay        : "rain" | "wind" | "temp" | "hum" | "pm" | "dengue"
 *  - legendBottom   : number (px from bottom)
 *  - showLegend     : boolean (default true)
 */
const LeafletMapWebView = (
  {
    lat = 1.3521,
    lon = 103.8198,
    height = 200,
    zoom = 13,
    showMarker = true,
    pins = [],
    interactive = true,
    rainfallPoints = [],
    windPoints = [],
    tempPoints = [],
    humPoints = [],
    pmPoints = [],
    dengueGeoJSON = null,
    overlay = "rain",
    legendBottom = 172,
    showLegend = true,
  },
  ref
) => {
  const webRef = useRef(null);
  const webReadyRef = useRef(false);

  // keep latest datasets for post-load injection
  const latestRainRef = useRef("[]");
  const latestWindRef = useRef("[]");
  const latestTempRef = useRef("[]");
  const latestHumRef = useRef("[]");
  const latestPMRef = useRef("[]");
  const latestDengueRef = useRef("null");

  latestRainRef.current = JSON.stringify(rainfallPoints || []);
  latestWindRef.current = JSON.stringify(windPoints || []);
  latestTempRef.current = JSON.stringify(tempPoints || []);
  latestHumRef.current = JSON.stringify(humPoints || []);
  latestPMRef.current = JSON.stringify(pmPoints || []);
  latestDengueRef.current = JSON.stringify(dengueGeoJSON || null);

  const html = useMemo(() => {
    const extraPins = (pins || [])
      .map(
        (p) =>
          `L.marker([${p.lat}, ${p.lon}]).addTo(window.map)${
            p.label ? `.bindPopup(${JSON.stringify(p.label)})` : ""
          };`
      )
      .join("\n");

    const dragging = interactive ? "true" : "false";
    const tap = interactive ? "true" : "false";
    const scrollWheelZoom = interactive ? "true" : "false";
    const doubleClickZoom = interactive ? "true" : "false";
    const touchZoom = interactive ? "true" : "false";
    const boxZoom = interactive ? "true" : "false";
    const keyboard = interactive ? "true" : "false";

    // initial payloads + overlay
    const rainJSON = JSON.stringify(rainfallPoints ?? []);
    const windJSON = JSON.stringify(windPoints ?? []);
    const tempJSON = JSON.stringify(tempPoints ?? []);
    const humJSON = JSON.stringify(humPoints ?? []);
    const pmJSON = JSON.stringify(pmPoints ?? []);
    const dengueJSON = JSON.stringify(dengueGeoJSON ?? null);
    const overlayJSON = JSON.stringify(overlay || "rain");

    return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width"/>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .leaflet-container { background: #e6eef9; }

  .legend {
    position: absolute; left: 10px;
    bottom: ${Number.isFinite(legendBottom) ? legendBottom : 150}px;
    background: rgba(255,255,255,0.95); padding: 8px 10px; border-radius: 8px;
    font: 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    z-index: 9999;
  }
  .legend-title { font-weight: 700; margin-bottom: 4px; }
  .legend-row { display: flex; align-items: center; margin: 2px 0; }
  .legend-swatch { width: 12px; height: 12px; margin-right: 6px; border-radius: 2px; }
</style>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // Init map
  window.map = L.map('map', {
    center: [${lat}, ${lon}],
    zoom: ${zoom},
    zoomControl: false,
    dragging: ${dragging},
    tap: ${tap},
    scrollWheelZoom: ${scrollWheelZoom},
    doubleClickZoom: ${doubleClickZoom},
    touchZoom: ${touchZoom},
    boxZoom: ${boxZoom},
    keyboard: ${keyboard}
  });
  window.map.setView([${lat}, ${lon}], ${zoom});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(window.map);

  ${
    showMarker
      ? `
    var locationIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34]
    });
    L.marker([${lat}, ${lon}], { icon: locationIcon })
      .addTo(window.map).bindPopup('You are here');
  `
      : ""
  }

  ${extraPins}

  // ------- Rainfall layer (mm) -------
  function colorForRain(mm) {
    if (mm == null) return '#9CA3AF';
    if (mm === 0) return '#A3A3A3';
    if (mm <= 1) return '#93C5FD';
    if (mm <= 5) return '#60A5FA';
    if (mm <= 10) return '#3B82F6';
    if (mm <= 20) return '#2563EB';
    return '#1D4ED8';
  }
  function rForRain(mm) { return mm == null ? 5 : Math.min(12, 5 + Math.sqrt(mm) * 2); }
  window.rainLayer = L.layerGroup();
  function renderRainfall(points) {
    if (!Array.isArray(points)) return;
    window.rainLayer.clearLayers();
    points.forEach(p => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
      const mm = (p.value == null || isNaN(p.value)) ? null : Number(p.value);
      const c = colorForRain(mm);
      const r = rForRain(mm);
      L.circleMarker([p.lat, p.lon], { radius: r, color: c, fillColor: c, fillOpacity: 0.85, weight: 1 })
       .addTo(window.rainLayer)
       .bindPopup('<b>' + (p.name || p.id || 'Station') + '</b><br/>Rainfall: ' + (mm == null ? '—' : (mm + ' mm')));
    });
  }

  // ------- Wind layer (knots) -------
  function colorForWind(kt) {
    if (kt == null) return '#9CA3AF';
    if (kt < 5)    return '#BBF7D0';
    if (kt < 10)   return '#86EFAC';
    if (kt < 15)   return '#4ADE80';
    if (kt < 25)   return '#22C55E';
    return '#16A34A';
  }
  function rForWind(kt) { return kt == null ? 6 : Math.min(14, 6 + Math.sqrt(kt) * 2); }
  window.windLayer = L.layerGroup();
  function renderWind(points) {
    if (!Array.isArray(points)) return;
    window.windLayer.clearLayers();
    points.forEach(p => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
      const kt = (p.value == null || isNaN(p.value)) ? null : Number(p.value);
      const c = colorForWind(kt);
      const r = rForWind(kt);
      L.circleMarker([p.lat, p.lon], { radius: r, color: c, fillColor: c, fillOpacity: 0.9, weight: 1 })
       .addTo(window.windLayer)
       .bindPopup('<b>' + (p.name || p.id || 'Station') + '</b><br/>Wind: ' + (kt == null ? '—' : (kt.toFixed(1) + ' kt')));
    });
  }

  // ------- Temperature layer (°C) -------
  function colorForTemp(c) {
    if (c == null) return '#9CA3AF';
    if (c < 24) return '#60A5FA';
    if (c < 27) return '#3B82F6';
    if (c < 30) return '#F59E0B';
    if (c < 33) return '#F97316';
    return '#EF4444';
  }
  function rForTemp(c) { return c == null ? 6 : Math.min(14, 6 + (c - 20) * 0.6); }
  window.tempLayer = L.layerGroup();
  function renderTemp(points) {
    if (!Array.isArray(points)) return;
    window.tempLayer.clearLayers();
    points.forEach(p => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
      const v = (p.value == null || isNaN(p.value)) ? null : Number(p.value);
      const c = colorForTemp(v);
      const r = rForTemp(v);
      L.circleMarker([p.lat, p.lon], { radius: r, color: c, fillColor: c, fillOpacity: 0.9, weight: 1 })
       .addTo(window.tempLayer)
       .bindPopup('<b>' + (p.name || p.id || 'Station') + '</b><br/>Temp: ' + (v == null ? '—' : (v.toFixed(1) + ' °C')));
    });
  }

  // ------- Humidity layer (%) -------
  function colorForHum(pct) {
    if (pct == null) return '#9CA3AF';
    if (pct < 60) return '#FDE68A';
    if (pct < 70) return '#A7F3D0';
    if (pct < 80) return '#34D399';
    if (pct < 90) return '#10B981';
    return '#059669';
  }
  function rForHum(pct) { return pct == null ? 6 : Math.min(14, 6 + (pct - 50) * 0.12); }
  window.humLayer = L.layerGroup();
  function renderHum(points) {
    if (!Array.isArray(points)) return;
    window.humLayer.clearLayers();
    points.forEach(p => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
      const v = (p.value == null || isNaN(p.value)) ? null : Number(p.value);
      const c = colorForHum(v);
      const r = rForHum(v);
      L.circleMarker([p.lat, p.lon], { radius: r, color: c, fillColor: c, fillOpacity: 0.9, weight: 1 })
       .addTo(window.humLayer)
       .bindPopup('<b>' + (p.name || p.id || 'Station') + '</b><br/>RH: ' + (v == null ? '—' : (v.toFixed(0) + ' %')));
    });
  }

  // ------- PM2.5 layer (µg/m³) -------
  function colorForPM(u) {
    if (u == null) return '#9CA3AF';
    if (u <= 12)  return '#10B981';
    if (u <= 35)  return '#84CC16';
    if (u <= 55)  return '#F59E0B';
    if (u <= 150) return '#EF4444';
    return '#7F1D1D';
  }
  function rForPM(u) { return u == null ? 8 : Math.min(18, 8 + Math.sqrt(u)); }
  window.pmLayer = L.layerGroup();
  function renderPM(points) {
    if (!Array.isArray(points)) return;
    window.pmLayer.clearLayers();
    points.forEach(p => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return;
      const v = (p.value == null || isNaN(p.value)) ? null : Number(p.value);
      const c = colorForPM(v);
      const r = rForPM(v);
      L.circleMarker([p.lat, p.lon], { radius: r, color: c, fillColor: c, fillOpacity: 0.9, weight: 1 })
       .addTo(window.pmLayer)
       .bindPopup('<b>' + (p.name || p.id || 'Region') + '</b><br/>PM2.5: ' + (v == null ? '—' : (v.toFixed(0) + ' µg/m³')));
    });
  }

  // ------- Dengue clusters (GeoJSON polygons) -------
  function dengueCaseSize(props) {
    var k = ['CASE_SIZE','case_size','CASE COUNT','CASECOUNT','caseCount'];
    for (var i=0;i<k.length;i++) {
      var v = props && props[k[i]];
      if (v != null && !isNaN(Number(v))) return Number(v);
    }
    return null;
  }
  function dengueLocality(props) {
    return (props && (props.LOCALITY || props.locality || props.NAME || props.name)) || 'Dengue Cluster';
  }
  function dengueLink(props) {
    return (props && (props.HYPERLINK || props.hyperlink)) || null;
  }
  function colorForDengue(size) {
    if (size == null) return '#9CA3AF';
    if (size < 10) return '#F59E0B';    // small
    if (size < 40) return '#EF4444';    // medium
    return '#7F1D1D';                   // large
  }
  window.dengueLayer = L.geoJSON(null, {
    style: function(feature) {
      var size = dengueCaseSize(feature.properties || {});
      var color = colorForDengue(size);
      return {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25
      };
    },
    onEachFeature: function (feature, layer) {
      try {
        var props = feature.properties || {};
        var size = dengueCaseSize(props);
        var loc = dengueLocality(props);
        var link = dengueLink(props);
        var html = '<b>' + loc + '</b><br/>Cases: ' + (size == null ? '—' : size);
        if (link) html += '<br/><a href="'+ link +'" target="_blank" rel="noopener noreferrer">More</a>';
        layer.bindPopup(html);
      } catch (e) {}
    }
  });
  function renderDengue(geojson) {
    try {
      window.dengueLayer.clearLayers();
      if (geojson && (geojson.type === 'FeatureCollection' || geojson.type === 'Feature')) {
        window.dengueLayer.addData(geojson);
      }
    } catch(e) {}
  }

  // Legend DOM (optional)
  var legendEnabled = ${showLegend ? "true" : "false"};
  var legendDiv = null;
  function ensureLegend() {
    if (!legendEnabled) return null;
    if (legendDiv) return legendDiv;
    legendDiv = document.createElement('div');
    legendDiv.className = 'legend';
    document.body.appendChild(legendDiv);
    return legendDiv;
  }
  function renderLegend(kind) {
    if (!legendEnabled) return;
    var el = ensureLegend(); if (!el) return;
    if (kind === 'wind') {
      el.innerHTML = [
        '<div class="legend-title">Wind (kt)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#BBF7D0"></span>0–5</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#86EFAC"></span>5–10</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#4ADE80"></span>10–15</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#22C55E"></span>15–25</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#16A34A"></span>25+</div>',
      ].join('');
    } else if (kind === 'temp') {
      el.innerHTML = [
        '<div class="legend-title">Temp (°C)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#60A5FA"></span>< 24</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#3B82F6"></span>24–27</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#F59E0B"></span>27–30</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#F97316"></span>30–33</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#EF4444"></span>≥ 33</div>',
      ].join('');
    } else if (kind === 'hum') {
      el.innerHTML = [
        '<div class="legend-title">Humidity (%)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#FDE68A"></span>< 60</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#A7F3D0"></span>60–70</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#34D399"></span>70–80</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#10B981"></span>80–90</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#059669"></span>≥ 90</div>',
      ].join('');
    } else if (kind === 'pm') {
      el.innerHTML = [
        '<div class="legend-title">PM2.5 (µg/m³)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#10B981"></span>0–12</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#84CC16"></span>12–35</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#F59E0B"></span>35–55</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#EF4444"></span>55–150</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#7F1D1D"></span>150+</div>',
      ].join('');
    } else if (kind === 'dengue') {
      el.innerHTML = [
        '<div class="legend-title">Dengue Clusters (cases)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#F59E0B"></span>< 10</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#EF4444"></span>10–39</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#7F1D1D"></span>≥ 40</div>',
      ].join('');
    } else {
      el.innerHTML = [
        '<div class="legend-title">Rain (mm)</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#A3A3A3"></span>0</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#93C5FD"></span>0–1</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#60A5FA"></span>1–5</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#3B82F6"></span>5–10</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#2563EB"></span>10–20</div>',
        '<div class="legend-row"><span class="legend-swatch" style="background:#1D4ED8"></span>20+</div>',
      ].join('');
    }
  }

  // Initial renders
  try { renderRainfall(${rainJSON}); } catch(e){}
  try { renderWind(${windJSON}); } catch(e){}
  try { renderTemp(${tempJSON}); } catch(e){}
  try { renderHum(${humJSON}); } catch(e){}
  try { renderPM(${pmJSON}); } catch(e){}
  try { renderDengue(${dengueJSON}); } catch(e){} // 👈 NEW

  // Overlay control
  window.showOverlay = function(kind) {
    try {
      [window.rainLayer, window.windLayer, window.tempLayer, window.humLayer, window.pmLayer, window.dengueLayer].forEach(Lyr => {
        if (Lyr && window.map.hasLayer(Lyr)) window.map.removeLayer(Lyr);
      });
      if (kind === 'wind') window.map.addLayer(window.windLayer);
      else if (kind === 'temp') window.map.addLayer(window.tempLayer);
      else if (kind === 'hum')  window.map.addLayer(window.humLayer);
      else if (kind === 'pm')   window.map.addLayer(window.pmLayer);
      else if (kind === 'dengue') window.map.addLayer(window.dengueLayer);
      else window.map.addLayer(window.rainLayer);
      renderLegend(kind);
      window.__overlay__ = kind;
    } catch(e){}
  };

  // Runtime bridges
  window.updateRainfall = function(pointsJson){ try { renderRainfall(JSON.parse(pointsJson)); } catch(e){} };
  window.updateWind     = function(pointsJson){ try { renderWind(JSON.parse(pointsJson)); }     catch(e){} };
  window.updateTemp     = function(pointsJson){ try { renderTemp(JSON.parse(pointsJson)); }     catch(e){} };
  window.updateHum      = function(pointsJson){ try { renderHum(JSON.parse(pointsJson)); }      catch(e){} };
  window.updatePM       = function(pointsJson){ try { renderPM(JSON.parse(pointsJson)); }       catch(e){} };
  window.updateDengue   = function(geojsonJson){ try { renderDengue(JSON.parse(geojsonJson)); } catch(e){} }; // 👈 NEW

  // Apply initial overlay
  try { window.showOverlay(${overlayJSON}); } catch(e){}
</script>
</body>
</html>`;
  }, [
    lat,
    lon,
    zoom,
    showMarker,
    pins,
    interactive,
    rainfallPoints,
    windPoints,
    tempPoints,
    humPoints,
    pmPoints,
    dengueGeoJSON,
    overlay,
    legendBottom,
    showLegend,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      recenter: (newLat, newLon, newZoom) => {
        if (!webRef.current) return;
        const z = Number.isFinite(newZoom) ? newZoom : zoom;
        webRef.current.injectJavaScript(`
          try { if (window.map) { window.map.setView([${newLat}, ${newLon}], ${z}); } } catch (e) {}
          true;
        `);
      },
      setRainfall: (pointsArray) => {
        if (!webRef.current) return;
        const payload = JSON.stringify(pointsArray || []);
        webRef.current.injectJavaScript(`
          try { if (window.updateRainfall) { window.updateRainfall(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setWind: (pointsArray) => {
        if (!webRef.current) return;
        const payload = JSON.stringify(pointsArray || []);
        webRef.current.injectJavaScript(`
          try { if (window.updateWind) { window.updateWind(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setTemp: (pointsArray) => {
        if (!webRef.current) return;
        const payload = JSON.stringify(pointsArray || []);
        webRef.current.injectJavaScript(`
          try { if (window.updateTemp) { window.updateTemp(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setHum: (pointsArray) => {
        if (!webRef.current) return;
        const payload = JSON.stringify(pointsArray || []);
        webRef.current.injectJavaScript(`
          try { if (window.updateHum) { window.updateHum(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setPM: (pointsArray) => {
        if (!webRef.current) return;
        const payload = JSON.stringify(pointsArray || []);
        webRef.current.injectJavaScript(`
          try { if (window.updatePM) { window.updatePM(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setDengue: (geojson) => {
        // 👈 NEW
        if (!webRef.current) return;
        const payload = JSON.stringify(geojson || null);
        webRef.current.injectJavaScript(`
          try { if (window.updateDengue) { window.updateDengue(${JSON.stringify(
            payload
          )}); } } catch (e) {}
          true;
        `);
      },
      setOverlay: (kind) => {
        if (!webRef.current) return;
        webRef.current.injectJavaScript(`
          try { if (window.showOverlay) { window.showOverlay(${JSON.stringify(
            kind || "rain"
          )}); } } catch (e) {}
          true;
        `);
      },
    }),
    [zoom]
  );

  // Prop-sync after load
  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updateRainfall) { window.updateRainfall(${latestRainRef.current}); } } catch (e) {}
      true;
    `);
  }, [rainfallPoints]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updateWind) { window.updateWind(${latestWindRef.current}); } } catch (e) {}
      true;
    `);
  }, [windPoints]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updateTemp) { window.updateTemp(${latestTempRef.current}); } } catch (e) {}
      true;
    `);
  }, [tempPoints]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updateHum) { window.updateHum(${latestHumRef.current}); } } catch (e) {}
      true;
    `);
  }, [humPoints]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updatePM) { window.updatePM(${latestPMRef.current}); } } catch (e) {}
      true;
    `);
  }, [pmPoints]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.updateDengue) { window.updateDengue(${latestDengueRef.current}); } } catch (e) {}
      true;
    `);
  }, [dengueGeoJSON]);

  useEffect(() => {
    if (!webRef.current || !webReadyRef.current) return;
    webRef.current.injectJavaScript(`
      try { if (window.showOverlay) { window.showOverlay(${JSON.stringify(
        overlay || "rain"
      )}); } } catch (e) {}
      true;
    `);
  }, [overlay]);

  return (
    <View style={{ height, overflow: "hidden", borderRadius: 16 }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={{
          flex: 1,
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "transparent",
          }),
        }}
        androidLayerType="hardware"
        onLoadEnd={() => {
          webReadyRef.current = true;
          webRef.current?.injectJavaScript(`
            try { if (window.updateRainfall) { window.updateRainfall(${
              latestRainRef.current
            }); } } catch(e){}
            try { if (window.updateWind)     { window.updateWind(${
              latestWindRef.current
            }); } } catch(e){}
            try { if (window.updateTemp)     { window.updateTemp(${
              latestTempRef.current
            }); } } catch(e){}
            try { if (window.updateHum)      { window.updateHum(${
              latestHumRef.current
            }); } } catch(e){}
            try { if (window.updatePM)       { window.updatePM(${
              latestPMRef.current
            }); } } catch(e){}
            try { if (window.updateDengue)   { window.updateDengue(${
              latestDengueRef.current
            }); } } catch(e){}
            try { if (window.showOverlay)    { window.showOverlay(${JSON.stringify(
              overlay || "rain"
            )}); } } catch(e){}
            true;
          `);
        }}
      />
    </View>
  );
};

export default forwardRef(LeafletMapWebView);

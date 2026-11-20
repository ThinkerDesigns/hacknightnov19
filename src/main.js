import Globe from 'globe.gl';
import * as THREE from 'three';
import { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const PROJECTILES = [
  { id: 'missile', name: 'Classic Missile', emoji: '🚀', hotkey: '1', speed: 1.9, arc: 0.9, color: '#ff713b', blurb: 'Fast. Fiery. Pointlessly dramatic.', impact: 'BOOM' },
  { id: 'bomb', name: 'Cartoon Bomb', emoji: '💣', hotkey: '2', speed: 1.1, arc: 1.25, color: '#ffb42e', blurb: 'Falls from orbit with a tiny fuse.', impact: 'KABOOM' },
  { id: 'meteor', name: 'Meteor', emoji: '☄️', hotkey: '3', speed: 0.72, arc: 1.05, color: '#ff4d31', blurb: 'A very large rock with a very small plan.', impact: 'CRUNCH' },
  { id: 'chicken', name: 'Rubber Chicken', emoji: '🐔', hotkey: '4', speed: 1.22, arc: 1.18, color: '#ffe06a', blurb: 'The international language of squeak.', impact: 'SQUEAK' },
  { id: 'confetti', name: 'Confetti Cluster', emoji: '🎉', hotkey: '5', speed: 1.4, arc: 1.0, color: '#52d9ff', blurb: 'Party protocol activated.', impact: 'PARTY' },
  { id: 'piano', name: 'Falling Piano', emoji: '🎹', hotkey: '6', speed: 0.78, arc: 1.3, color: '#b892ff', blurb: 'Some assembly required.', impact: 'CLANG' },
  { id: 'cow', name: 'Cow Launcher', emoji: '🐄', hotkey: '7', speed: 1.0, arc: 1.08, color: '#ff8fb0', blurb: 'Moo-ving at terminal velocity.', impact: 'MOO' },
  { id: 'rainbow', name: 'Friendship Rainbow', emoji: '🌈', hotkey: '8', speed: 1.08, arc: 0.88, color: '#6bffe2', blurb: 'Weaponized good vibes only.', impact: 'YAY' }
];

const cities = [
  ['London', 51.5072, -0.1276], ['New York', 40.7128, -74.006], ['Tokyo', 35.6762, 139.6503], ['Sydney', -33.8688, 151.2093],
  ['Nairobi', -1.2921, 36.8219], ['Reykjavik', 64.1466, -21.9426], ['São Paulo', -23.5505, -46.6333], ['Mumbai', 19.076, 72.8777],
  ['Mexico City', 19.4326, -99.1332], ['Singapore', 1.3521, 103.8198], ['Paris', 48.8566, 2.3522], ['Honolulu', 21.3069, -157.8583]
];

const LOCAL_PLACES = [
  { keywords: ['walker hall', 'uc davis'], display_name: 'Walker Hall, UC Davis, 300 Peter J. Shields Avenue, Davis, CA', lat: 38.539629, lon: -121.750795, type: 'building' }
];

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="app-shell">
    <div id="globe-stage" aria-label="Interactive Earth globe"></div>
    <div id="city-map" aria-label="Close-up 3D city map"></div>
    <div class="scanlines"></div>
    <header class="topbar">
      <div class="brand-lockup"><div class="brand-mark">✦</div><div><div class="brand">ORBITAL MISCHIEF</div><div class="subtitle">GLOBAL MISCHIEF CONTROL SYSTEM</div></div></div>
      <div class="live-pill"><span></span> LIVE // ORBITAL LINK STABLE</div>
      <div class="telemetry"><div><small>IMPACTS</small><strong id="impact-count">0</strong></div><div><small>LAUNCHED</small><strong id="launch-count">0</strong></div><div class="chaos-readout"><small>CHAOS MODE</small><strong id="chaos-status">STANDBY</strong></div></div>
    </header>
    <section class="target-card glass-panel"><div class="eyebrow">TARGETING SOLUTION</div><div class="coordinates" id="coords">Awaiting a target<span>click the globe to begin</span></div><div class="target-name" id="target-name">NO COORDINATES LOCKED</div><div class="target-bar"><i id="target-bar-fill"></i></div></section>
    <aside class="intel-panel glass-panel"><div class="panel-heading"><span>FIELD NOTES</span><span class="tiny-status">RECENT ACTIVITY</span></div><div id="activity-feed" class="activity-feed"><div class="empty-feed">No mischief logged yet.<br><span>Be the first to do something silly.</span></div></div><div class="leaderboard"><div class="panel-heading"><span>TOP TARGETS</span><span class="tiny-status">SESSION</span></div><div id="leaderboard-list"><div class="empty-feed">Leaderboard is waiting for chaos.</div></div></div></aside>
    <div class="search-wrap glass-panel"><input id="search-input" placeholder="Search an address or place…" aria-label="Search an address or place" autocomplete="off" aria-autocomplete="list"><button id="search-btn">LOCATE</button><div id="search-suggestions" class="search-suggestions" role="listbox"></div><div id="search-result"></div></div>
    <div class="city-mode glass-panel" id="city-mode"><span class="city-mode-kicker">CLOSE-UP MODE</span><b id="city-mode-name">EXACT LOCATION</b><small>45° BUILDING VIEW · CLICK MAP TO LAUNCH</small><button id="return-orbit">↺ RETURN TO ORBIT</button></div>
    <div class="controls"><button class="control-btn" id="mute-btn">◒ MUTE</button><button class="control-btn" id="follow-btn">⌁ FOLLOW CAM</button><button class="control-btn" id="reset-btn">◎ RESET</button><button class="control-btn" id="origin-btn">↟ ORIGIN: <b>ORBITAL</b></button><button class="control-btn danger" id="clear-btn">× CLEAR ALL</button></div>
    <div class="projectile-dock"><div class="dock-label">SELECT PAYLOAD <span>PRESS 1—8</span></div><div class="projectile-grid" id="projectile-grid"></div><button class="chaos-btn" id="chaos-btn"><span>⚡</span><b>CHAOS MODE</b><small>10 SEC RAPID FIRE</small></button></div>
    <div class="reticle" id="reticle"><div class="reticle-ring"></div><span id="reticle-label">LOCK</span></div>
    <div class="toast" id="toast"></div>
  </div>`;

const $ = (id) => document.getElementById(id);
const stage = $('globe-stage');
const cityMapStage = $('city-map');
const selected = { projectile: PROJECTILES[0], target: null, follow: false, muted: false, origin: 'orbital' };
const stats = { launched: 0, impacts: 0, activity: [], targets: new Map(), craters: [] };
const active = [];
let audioCtx;
let chaosTimer;
let searchTimer;
let searchRequest = 0;
let cityMap;
const cityAttacks = [];
let cityAttackRenderer;
let cityAttackScene;
let cityAttackCamera;

PROJECTILES.forEach((p, index) => {
  const button = document.createElement('button');
  button.className = `payload ${index === 0 ? 'selected' : ''}`;
  button.dataset.id = p.id;
  button.innerHTML = `<span class="payload-emoji">${p.emoji}</span><span class="payload-copy"><b>${p.name}</b><small>${p.hotkey} · ${p.impact}</small></span>`;
  button.title = p.blurb;
  button.onclick = () => selectProjectile(p.id);
  $('projectile-grid').append(button);
});

const globe = Globe()(stage)
  .globeImageUrl('/earth-night.jpg')
  .bumpImageUrl('/earth-topology.png')
  .backgroundImageUrl('/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#3bdcff')
  .atmosphereAltitude(0.16)
  .showGraticules(true)
  .ringColor(() => '#ff713b')
  .ringMaxRadius(4)
  .ringPropagationSpeed(2.5)
  .ringRepeatPeriod(0)
  .pointsData([])
  .pointLat('lat').pointLng('lng').pointColor((point) => point.selected ? '#6be8ff' : '#ff713b').pointAltitude((point) => point.selected ? 0.028 : 0.012).pointRadius((point) => point.selected ? 0.34 : 0.22)
  .onGlobeClick(({ lat, lng }) => setTarget(lat, lng, true));
const vectorCoords = (lat, lng, altitude) => {
  const point = globe.getCoords(lat, lng, altitude);
  return new THREE.Vector3(point.x, point.y, point.z);
};

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.22;
globe.controls().enableDamping = true;
globe.controls().dampingFactor = 0.07;
globe.controls().minDistance = 180;
globe.controls().maxDistance = 500;

function selectProjectile(id) {
  selected.projectile = PROJECTILES.find((p) => p.id === id) || PROJECTILES[0];
  document.querySelectorAll('.payload').forEach((el) => el.classList.toggle('selected', el.dataset.id === id));
  showToast(`${selected.projectile.emoji} ${selected.projectile.name.toUpperCase()} ARMED`);
}

function setTarget(lat, lng, launch = false, placeName = '') {
  selected.target = { lat, lng, placeName };
  const city = nearestCity(lat, lng);
  $('coords').innerHTML = `${lat.toFixed(3)}° ${lat >= 0 ? 'N' : 'S'} &nbsp; ${Math.abs(lng).toFixed(3)}° ${lng >= 0 ? 'E' : 'W'}<span>targeting lock acquired</span>`;
  const resolvedName = placeName || city.name || 'UNKNOWN SECTOR // RAW COORDINATES';
  $('target-name').textContent = `${resolvedName.toUpperCase()} // ${selected.projectile.name.toUpperCase()}`;
  $('target-bar-fill').style.width = '100%';
  refreshMarkers();
  if (placeName) {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat, lng, altitude: 0.52 }, 1100);
  }
  if (cityMapStage.classList.contains('active')) $('reticle').classList.remove('visible');
  else positionReticle(lat, lng);
  if (placeName && !cityMapStage.classList.contains('active')) setTimeout(() => positionReticle(lat, lng), 1150);
  if (launch) launchProjectile(selected.projectile, { lat, lng, placeName });
}

function openCityMap(lat, lng, placeName) {
  clearCityAttacks();
  $('city-mode-name').textContent = placeName.toUpperCase();
  $('city-mode').classList.add('active');
  cityMapStage.classList.add('active');
  $('reticle').classList.remove('visible');
  if (!cityMap) {
    cityMap = new MapLibreMap({ container: cityMapStage, style: 'https://tiles.openfreemap.org/styles/dark', center: [lng, lat], zoom: 18.8, pitch: 45, bearing: -18, attributionControl: true });
    cityMap.on('load', () => { addSatelliteImagery(cityMap); add3DBuildings(cityMap); ensureCityAttackRenderer(); });
    cityMap.on('click', (event) => {
      const target = event.lngLat;
      const label = `MAP LOCK // ${target.lat.toFixed(5)}°, ${target.lng.toFixed(5)}°`;
      const lockedTarget = { lat: target.lat, lng: target.lng, placeName: label };
      setTarget(lockedTarget.lat, lockedTarget.lng, false, lockedTarget.placeName);
      launchCityProjectile(selected.projectile, lockedTarget, event.point);
    });
  } else {
    cityMap.resize();
    cityMap.flyTo({ center: [lng, lat], zoom: 18.8, pitch: 45, bearing: -18, essential: true, duration: 1400 });
  }
}

function addSatelliteImagery(map) {
  if (map.getSource('orbital-satellite')) return;
  map.addSource('orbital-satellite', { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Tiles © Esri' });
  map.addLayer({ id: 'orbital-satellite', type: 'raster', source: 'orbital-satellite', paint: { 'raster-opacity': 0.92 } });
}

function add3DBuildings(map) {
  if (map.getLayer('orbital-3d-buildings') || !map.getSource('openmaptiles')) return;
  map.addLayer({ id: 'orbital-3d-buildings', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#60798c', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0], 'fill-extrusion-opacity': 0.43, 'fill-extrusion-vertical-gradient': true } });
}

function returnToOrbit() {
  cityMapStage.classList.remove('active');
  $('city-mode').classList.remove('active');
  if (selected.target) positionReticle(selected.target.lat, selected.target.lng);
  if (cityMap) cityMap.resize();
}

function ensureCityAttackRenderer() {
  if (!cityMapStage.clientWidth) return;
  if (!cityAttackRenderer) {
    cityAttackRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    cityAttackRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    cityAttackRenderer.setClearColor(0x000000, 0);
    cityAttackRenderer.domElement.className = 'city-attack-canvas';
    cityMapStage.appendChild(cityAttackRenderer.domElement);
    cityAttackScene = new THREE.Scene();
    cityAttackScene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4); keyLight.position.set(120, -120, 240); cityAttackScene.add(keyLight);
    cityAttackCamera = new THREE.OrthographicCamera(0, cityMapStage.clientWidth, 0, cityMapStage.clientHeight, -1000, 1000);
  }
  const width = cityMapStage.clientWidth; const height = cityMapStage.clientHeight;
  cityAttackRenderer.setSize(width, height, false); cityAttackCamera.right = width; cityAttackCamera.bottom = height; cityAttackCamera.updateProjectionMatrix();
}

function launchCityProjectile(projectile, target, clickedPoint = null) {
  ensureAudio(); ensureCityAttackRenderer();
  stats.launched += 1; $('launch-count').textContent = stats.launched;
  const endPoint = clickedPoint ? projectMapPoint(clickedPoint.x, clickedPoint.y, true) : projectMapPoint(target.lng, target.lat);
  const end = new THREE.Vector3(endPoint.x, endPoint.y, 0);
  const start = new THREE.Vector3(end.x + (Math.random() - .5) * 120, -150, 0);
  const mid = new THREE.Vector3((start.x + end.x) / 2 + (Math.random() - .5) * 160, end.y - 230, 0);
  const model = createPayloadModel(projectile); model.scale.multiplyScalar(2.25); cityAttackScene.add(model);
  const trailMaterial = new THREE.LineBasicMaterial({ color: projectile.color, transparent: true, opacity: .75 });
  const trailGeometry = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]); const trail = new THREE.Line(trailGeometry, trailMaterial); cityAttackScene.add(trail);
  cityAttacks.push({ model, trail, trailGeometry, trailMaterial, start, mid, end, target, projectile, t: 0, duration: Math.max(.8, 1.55 / projectile.speed) });
  playSound(projectile.id === 'chicken' ? 'squeak' : 'launch');
  addActivity(`${projectile.emoji} ${projectile.name} launched toward ${target.placeName}`);
}

function projectMapPoint(lng, lat, alreadyProjected = false) {
  const point = alreadyProjected ? { x: lng, y: lat } : cityMap.project([lng, lat]);
  const container = cityMap.getContainer().getBoundingClientRect();
  const scaleX = cityMapStage.clientWidth / container.width;
  const scaleY = cityMapStage.clientHeight / container.height;
  return new THREE.Vector3(point.x * scaleX, point.y * scaleY, 0);
}

function tickCityAttack(delta) {
  cityAttacks.slice().forEach((item) => {
    item.t += delta / item.duration; const t = Math.min(item.t, 1); const eased = t * t * (3 - 2 * t);
    const a = item.start.clone().multiplyScalar((1 - eased) ** 2); const b = item.mid.clone().multiplyScalar(2 * (1 - eased) * eased); const c = item.end.clone().multiplyScalar(eased ** 2); const pos = a.add(b).add(c);
    item.model.position.copy(pos); item.model.rotation.x += delta * 3.2; item.model.rotation.y += delta * 4.1; item.trailGeometry.setFromPoints([item.start.clone().lerp(pos, .86), pos]);
    if (t >= 1) finishCityAttack(item);
  });
  cityAttackRenderer.render(cityAttackScene, cityAttackCamera);
}

function finishCityAttack(item) {
  cityAttackScene.remove(item.model, item.trail); disposeObject3D(item.model); item.trailGeometry.dispose(); item.trailMaterial.dispose(); cityAttacks.splice(cityAttacks.indexOf(item), 1);
  spawnCityImpact(item.end.x, item.end.y, item.projectile.color, item.projectile.impact); recordImpact(item.target, item.projectile, true);
}

function clearCityAttacks() {
  cityAttacks.splice(0).forEach((item) => { if (cityAttackScene) cityAttackScene.remove(item.model, item.trail); disposeObject3D(item.model); item.trailGeometry.dispose(); item.trailMaterial.dispose(); });
  cityMapStage.querySelectorAll('.city-impact').forEach((impact) => impact.remove());
}

function spawnCityImpact(x, y, color, label) {
  const impact = document.createElement('div'); impact.className = 'city-impact'; impact.style.left = `${x}px`; impact.style.top = `${y}px`; impact.style.setProperty('--impact-color', color);
  const sparks = Array.from({ length: 16 }, (_, index) => `<i class="explosion-spark" style="--angle:${index * 22.5}deg;--distance:${72 + (index % 4) * 18}px;--delay:${(index % 5) * 0.025}s"></i>`).join('');
  impact.innerHTML = `<div class="explosion-smoke"></div><div class="explosion-ring ring-a"></div><div class="explosion-ring ring-b"></div><div class="explosion-ring ring-c"></div><div class="explosion-core"></div>${sparks}<b>${label}</b>`;
  cityMapStage.appendChild(impact); setTimeout(() => impact.remove(), 1600);
}

function positionReticle(lat, lng) {
  const pos = vectorCoords(lat, lng, 0.045);
  const projected = pos.clone().project(globe.camera());
  const rect = stage.getBoundingClientRect();
  const x = (projected.x * 0.5 + 0.5) * rect.width;
  const y = (-projected.y * 0.5 + 0.5) * rect.height;
  $('reticle').style.left = `${x}px`; $('reticle').style.top = `${y}px`; $('reticle-label').textContent = `${lat.toFixed(1)}°, ${lng.toFixed(1)}°`;
  $('reticle').classList.add('visible', 'locking');
  setTimeout(() => $('reticle').classList.remove('locking'), 360);
}

function launchProjectile(projectile, target) {
  ensureAudio();
  stats.launched += 1; $('launch-count').textContent = stats.launched;
  const group = new THREE.Group();
  const model = createPayloadModel(projectile);
  group.add(model); globe.scene().add(group);
  const start = getOrigin(projectile);
  const end = vectorCoords(target.lat, target.lng, 0.065);
  const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(100 + projectile.arc * 80);
  const trailMaterial = new THREE.LineBasicMaterial({ color: projectile.color, transparent: true, opacity: 0.7 });
  const trailGeometry = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
  const trail = new THREE.Line(trailGeometry, trailMaterial); globe.scene().add(trail);
  active.push({ group, model, trail, trailGeometry, trailMaterial, start, mid, end, target, projectile, t: 0, duration: Math.max(0.9, 1.75 / projectile.speed) });
  playSound(projectile.id === 'chicken' ? 'squeak' : 'launch');
  addActivity(`${projectile.emoji} ${projectile.name} launched toward ${target.placeName || nearestCity(target.lat, target.lng).name || 'a mysterious ocean'}`);
}

function getOrigin(projectile) {
  if (selected.origin === 'previous' && stats.activity.length) {
    const recent = selected.target || { lat: 0, lng: 0 }; return vectorCoords(recent.lat, recent.lng, 2.6);
  }
  if (selected.origin === 'random') return new THREE.Vector3((Math.random() - .5) * 260, 80 + Math.random() * 100, (Math.random() - .5) * 260);
  return new THREE.Vector3(0, 270, 0);
}

function createPayloadModel(projectile) {
  const model = new THREE.Group();
  const material = (color, roughness = 0.48, metalness = 0.1) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const add = (geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) => { const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); mesh.rotation.set(...rotation); model.add(mesh); return mesh; };
  const orange = material(0xff713b, 0.35, 0.2); const dark = material(0x18232b, 0.38, 0.55); const bright = material(0xffd166, 0.32, 0.1); const white = material(0xf2f0e8, 0.7, 0.05);
  if (projectile.id === 'missile') {
    add(new THREE.CylinderGeometry(3.6, 3.6, 15, 12), orange, [0, 0, 0], [0, 0, Math.PI / 2]);
    add(new THREE.ConeGeometry(3.6, 7, 12), bright, [10.5, 0, 0], [0, 0, -Math.PI / 2]);
    add(new THREE.BoxGeometry(4, 1, 10), dark, [-2, 0, 5]); add(new THREE.BoxGeometry(4, 1, 10), dark, [-2, 0, -5]);
    add(new THREE.ConeGeometry(2.5, 8, 8), orange, [-10, 0, 0], [0, 0, Math.PI / 2]);
  } else if (projectile.id === 'bomb') {
    add(new THREE.SphereGeometry(7.5, 18, 14), dark); add(new THREE.TorusGeometry(2.3, .6, 8, 12), bright, [0, 7.5, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.CylinderGeometry(.55, .55, 5, 8), bright, [0, 10, 0]); add(new THREE.SphereGeometry(1.3, 10, 8), orange, [1.3, 12.4, 0]);
  } else if (projectile.id === 'meteor') {
    const rock = add(new THREE.IcosahedronGeometry(8.5, 1), material(0x925c43, 0.9, 0)); rock.scale.set(1.2, .85, 1.05); rock.geometry.attributes.position.array.forEach((_, index, array) => { if (index % 3 === 0) array[index] *= 0.82 + Math.random() * .38; }); rock.geometry.attributes.position.needsUpdate = true;
    add(new THREE.ConeGeometry(4, 20, 8), orange, [-8, 0, 0], [0, 0, Math.PI / 2]);
  } else if (projectile.id === 'chicken') {
    add(new THREE.SphereGeometry(6, 16, 12), bright); add(new THREE.SphereGeometry(4, 14, 10), bright, [5, 3, 0]);
    add(new THREE.ConeGeometry(1.6, 4, 8), orange, [9, 3, 0], [0, 0, -Math.PI / 2]); add(new THREE.SphereGeometry(1.2, 8, 8), dark, [6, 4.4, 2.7]); add(new THREE.SphereGeometry(1.2, 8, 8), dark, [6, 4.4, -2.7]);
    add(new THREE.ConeGeometry(1.5, 5, 6), orange, [-2, -6, 2], [Math.PI / 2, 0, 0]); add(new THREE.ConeGeometry(1.5, 5, 6), orange, [-2, -6, -2], [Math.PI / 2, 0, 0]);
  } else if (projectile.id === 'piano') {
    add(new THREE.BoxGeometry(14, 6, 9), dark); for (let i = -5; i <= 5; i += 2) add(new THREE.BoxGeometry(1.4, .25, 7), white, [i, 3.1, 0]);
  } else if (projectile.id === 'cow') {
    add(new THREE.SphereGeometry(7, 16, 12), white); add(new THREE.SphereGeometry(4.5, 14, 10), white, [7, 2, 0]); add(new THREE.ConeGeometry(1.2, 4, 8), bright, [9, 6, 2.3], [0, 0, -.4]); add(new THREE.ConeGeometry(1.2, 4, 8), bright, [9, 6, -2.3], [0, 0, .4]);
  } else if (projectile.id === 'rainbow') {
    [0xff4d6d, 0xffc857, 0x6bffe2].forEach((color, index) => add(new THREE.TorusGeometry(7 + index * 1.7, .7, 8, 24, Math.PI), material(color, .4, .1), [0, 0, (index - 1) * 1.2], [0, Math.PI / 2, 0]));
  } else {
    add(new THREE.SphereGeometry(5, 12, 10), material(projectile.color)); for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(1.5, 8, 1.5), material(projectile.color), [Math.cos(i) * 5, Math.sin(i) * 5, 0], [0, 0, i]);
  }
  model.scale.setScalar(0.72); return model;
}

function disposeObject3D(object) {
  object.traverse((child) => { if (!child.isMesh) return; child.geometry.dispose(); if (child.material.map) child.material.map.dispose(); child.material.dispose(); });
}

function tick(delta) {
  active.slice().forEach((item) => {
    item.t += delta / item.duration; const t = Math.min(item.t, 1); const eased = t * t * (3 - 2 * t);
    const a = item.start.clone().multiplyScalar((1 - eased) ** 2); const b = item.mid.clone().multiplyScalar(2 * (1 - eased) * eased); const c = item.end.clone().multiplyScalar(eased ** 2); const pos = a.add(b).add(c);
    item.group.position.copy(pos); item.model.rotation.x += delta * 2.4; item.model.rotation.y += delta * 3.6;
    const trailEnd = item.start.clone().lerp(pos, 0.9); item.trailGeometry.setFromPoints([trailEnd, pos]);
    if (selected.follow) globe.camera().lookAt(pos);
    if (t >= 1) { impact(item); active.splice(active.indexOf(item), 1); }
  });
  if (cityAttackRenderer) tickCityAttack(delta);
}

function impact(item) {
  const { target, projectile } = item;
  globe.scene().remove(item.group, item.trail); disposeObject3D(item.group); item.trailGeometry.dispose(); item.trailMaterial.dispose();
  recordImpact(target, projectile, false);
}

function recordImpact(target, projectile, cityImpact) {
  stats.impacts += 1; $('impact-count').textContent = stats.impacts;
  stats.craters.push({ lat: target.lat, lng: target.lng, id: `${Date.now()}-${Math.random()}` }); stats.craters = stats.craters.slice(-40); refreshMarkers();
  if (!cityImpact) { globe.ringsData([{ lat: target.lat, lng: target.lng, id: Date.now() }, ...globe.ringsData()].slice(0, 20)); spawnParticles(target, projectile.color); }
  playSound(projectile.impact === 'SQUEAK' ? 'squeak' : 'boom');
  const city = nearestCity(target.lat, target.lng); const destination = target.placeName || city.name || 'the open sea'; const line = `${projectile.emoji} ${projectile.name} destroyed absolutely nothing in ${destination}`; addActivity(line); trackTarget(destination); showToast(`${projectile.impact} // ${destination}`);
}

function spawnParticles(target, color) {
  const origin = vectorCoords(target.lat, target.lng, 0.12); const points = [];
  for (let i = 0; i < 14; i++) { const p = origin.clone().add(new THREE.Vector3((Math.random() - .5) * 10, Math.random() * 10, (Math.random() - .5) * 10)); points.push(p); }
  const geometry = new THREE.BufferGeometry().setFromPoints(points); const material = new THREE.PointsMaterial({ color, size: 3.8, transparent: true, opacity: 1, depthWrite: false }); const particles = new THREE.Points(geometry, material); globe.scene().add(particles);
  setTimeout(() => { globe.scene().remove(particles); geometry.dispose(); material.dispose(); }, 680);
}

function nearestCity(lat, lng) { let closest = { name: null, distance: Infinity }; cities.forEach(([name, a, b]) => { const distance = Math.hypot(lat - a, lng - b); if (distance < closest.distance) closest = { name, distance }; }); return closest.distance < 12 ? closest : { name: null, distance: closest.distance }; }
function refreshMarkers() { const targetMarker = selected.target ? [{ lat: selected.target.lat, lng: selected.target.lng, selected: true }] : []; globe.pointsData([...targetMarker, ...stats.craters]); }
function addActivity(text) { stats.activity.unshift({ text, time: new Date() }); stats.activity = stats.activity.slice(0, 8); $('activity-feed').innerHTML = stats.activity.map((a) => `<div class="activity-item"><span>${a.text}</span><time>${a.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>`).join(''); }
function trackTarget(name) { stats.targets.set(name, (stats.targets.get(name) || 0) + 1); const rows = [...stats.targets].sort((a, b) => b[1] - a[1]).slice(0, 4); $('leaderboard-list').innerHTML = rows.map(([city, count], i) => `<div class="leader-row"><span>${String(i + 1).padStart(2, '0')} ${city}</span><b>${count}</b></div>`).join(''); }
function showToast(text) { const toast = $('toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800); }
function ensureAudio() { if (!audioCtx) audioCtx = new AudioContext(); }
function playSound(kind) { if (selected.muted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); const now = audioCtx.currentTime; const freq = kind === 'boom' ? 76 : kind === 'squeak' ? 540 : 220; osc.type = kind === 'boom' ? 'sawtooth' : 'triangle'; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(kind === 'boom' ? 42 : freq * 1.7, now + .18); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .015); gain.gain.exponentialRampToValueAtTime(.0001, now + .24); osc.connect(gain).connect(audioCtx.destination); osc.start(now); osc.stop(now + .25); }

$('mute-btn').onclick = () => { selected.muted = !selected.muted; $('mute-btn').textContent = selected.muted ? '◒ UNMUTE' : '◒ MUTE'; ensureAudio(); };
$('follow-btn').onclick = () => { selected.follow = !selected.follow; $('follow-btn').classList.toggle('active', selected.follow); };
$('reset-btn').onclick = () => { globe.pointOfView({ lat: 22, lng: 12, altitude: 2.35 }, 900); globe.controls().autoRotate = true; };
$('return-orbit').onclick = returnToOrbit;
$('origin-btn').onclick = () => { const options = ['orbital', 'previous', 'random']; selected.origin = options[(options.indexOf(selected.origin) + 1) % options.length]; $('origin-btn').innerHTML = `↟ ORIGIN: <b>${selected.origin.toUpperCase()}</b>`; };
$('clear-btn').onclick = () => { active.splice(0).forEach((item) => { globe.scene().remove(item.group, item.trail); disposeObject3D(item.group); item.trailGeometry.dispose(); item.trailMaterial.dispose(); }); clearCityAttacks(); globe.ringsData([]); stats.craters = []; refreshMarkers(); showToast('FIELD CLEARED // NO MISCHIEF REMAINS'); };
$('chaos-btn').onclick = () => { if (chaosTimer) return; let remaining = 10; $('chaos-status').textContent = `${remaining}s`; chaosTimer = setInterval(() => { remaining -= 1; $('chaos-status').textContent = remaining ? `${remaining}s` : 'STANDBY'; if (remaining <= 0) { clearInterval(chaosTimer); chaosTimer = null; showToast('CHAOS COMPLETE // VERY LITTLE WAS LEARNED'); return; } const p = PROJECTILES[Math.floor(Math.random() * PROJECTILES.length)]; const lat = Math.random() * 140 - 70; const lng = Math.random() * 360 - 180; launchProjectile(p, { lat, lng }); }, 900); };
$('search-btn').onclick = () => searchPlace($('search-input').value.trim());
$('search-input').onkeydown = (event) => { if (event.key === 'Enter') searchPlace($('search-input').value.trim()); if (event.key === 'Escape') hideSuggestions(); };
$('search-input').onfocus = () => { if ($('search-input').dataset.locked) { $('search-input').value = ''; $('search-input').placeholder = 'Search another address…'; delete $('search-input').dataset.locked; $('search-result').textContent = ''; } };
$('search-input').oninput = () => { const query = $('search-input').value.trim(); delete $('search-input').dataset.locked; $('search-input').placeholder = 'Search an address or place…'; $('search-result').textContent = ''; clearTimeout(searchTimer); if (query.length < 3) return hideSuggestions(); searchTimer = setTimeout(() => fetchSuggestions(query), 260); };
async function fetchSuggestions(query) { const requestId = ++searchRequest; const localPlace = localPlaceFor(query); if (localPlace) return renderSuggestions([localPlace]); renderSearchStatus('SEARCHING…'); try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&dedupe=1&accept-language=en&q=${encodeURIComponent(query)}`); const results = await response.json(); if (requestId !== searchRequest) return; renderSuggestions(results); } catch { if (requestId === searchRequest) renderSearchStatus('NO SIGNAL — TRY ANOTHER PLACE'); } }
function renderSuggestions(results) { const suggestions = $('search-suggestions'); if (!results.length) { suggestions.innerHTML = `<div class="suggestion-empty">NO MATCHES — TRY A STREET, CITY, OR LANDMARK</div>`; suggestions.classList.add('open'); return; } suggestions.innerHTML = results.map((hit, index) => `<button class="suggestion" data-result-index="${index}" role="option"><b>${hit.display_name.split(',').slice(0, 2).join(', ')}</b><small>${hit.type || 'place'} · ${Number(hit.lat).toFixed(3)}°, ${Number(hit.lon).toFixed(3)}°</small></button>`).join(''); suggestions.classList.add('open'); suggestions.querySelectorAll('.suggestion').forEach((button) => { button.onclick = () => focusSearchResult(results[Number(button.dataset.resultIndex)]); }); $('search-result').textContent = ''; }
function focusSearchResult(hit) { const label = hit.display_name.split(',').slice(0, 3).join(', '); const lat = Number(hit.lat); const lng = Number(hit.lon); $('search-input').value = ''; $('search-input').placeholder = 'Search another address…'; $('search-input').dataset.locked = 'true'; hideSuggestions(); $('search-result').textContent = '3D LOCK // EXACT COORDINATES'; setTarget(lat, lng, false, label); openCityMap(lat, lng, label); showToast(`LOCATION LOCKED // ${label.toUpperCase()}`); }
function hideSuggestions() { $('search-suggestions').classList.remove('open'); }
function renderSearchStatus(text) { $('search-result').textContent = text; hideSuggestions(); }
function localPlaceFor(query) { const normalized = query.toLowerCase(); return LOCAL_PLACES.find((place) => place.keywords.every((keyword) => normalized.includes(keyword))) || null; }
async function searchPlace(query) { if (!query) return; const localPlace = localPlaceFor(query); if (localPlace) return focusSearchResult(localPlace); renderSearchStatus('LOCATING…'); try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&dedupe=1&accept-language=en&q=${encodeURIComponent(query)}`); const results = await response.json(); if (!results.length) throw new Error('not found'); focusSearchResult(results[0]); } catch { renderSearchStatus('NO SIGNAL — TRY ANOTHER PLACE'); } }

window.addEventListener('keydown', (event) => { const p = PROJECTILES.find((item) => item.hotkey === event.key); if (p) selectProjectile(p.id); });
let previous = performance.now();
function animate(now) { const delta = Math.min((now - previous) / 1000, .05); previous = now; tick(delta); requestAnimationFrame(animate); }
requestAnimationFrame(animate);


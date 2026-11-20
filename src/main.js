import Globe from 'globe.gl';
import * as THREE from 'three';
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

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="app-shell">
    <div id="globe-stage" aria-label="Interactive Earth globe"></div>
    <div class="scanlines"></div>
    <header class="topbar">
      <div class="brand-lockup"><div class="brand-mark">✦</div><div><div class="brand">ORBITAL MISCHIEF</div><div class="subtitle">GLOBAL MISCHIEF CONTROL SYSTEM</div></div></div>
      <div class="live-pill"><span></span> LIVE // ORBITAL LINK STABLE</div>
      <div class="telemetry"><div><small>IMPACTS</small><strong id="impact-count">0</strong></div><div><small>LAUNCHED</small><strong id="launch-count">0</strong></div><div class="chaos-readout"><small>CHAOS MODE</small><strong id="chaos-status">STANDBY</strong></div></div>
    </header>
    <section class="target-card glass-panel"><div class="eyebrow">TARGETING SOLUTION</div><div class="coordinates" id="coords">Awaiting a target<span>click the globe to begin</span></div><div class="target-name" id="target-name">NO COORDINATES LOCKED</div><div class="target-bar"><i id="target-bar-fill"></i></div></section>
    <aside class="intel-panel glass-panel"><div class="panel-heading"><span>FIELD NOTES</span><span class="tiny-status">RECENT ACTIVITY</span></div><div id="activity-feed" class="activity-feed"><div class="empty-feed">No mischief logged yet.<br><span>Be the first to do something silly.</span></div></div><div class="leaderboard"><div class="panel-heading"><span>TOP TARGETS</span><span class="tiny-status">SESSION</span></div><div id="leaderboard-list"><div class="empty-feed">Leaderboard is waiting for chaos.</div></div></div></aside>
    <div class="search-wrap glass-panel"><input id="search-input" placeholder="Search a place…" aria-label="Search a place"><button id="search-btn">LOCATE</button><div id="search-result"></div></div>
    <div class="controls"><button class="control-btn" id="mute-btn">◒ MUTE</button><button class="control-btn" id="follow-btn">⌁ FOLLOW CAM</button><button class="control-btn" id="reset-btn">◎ RESET</button><button class="control-btn" id="origin-btn">↟ ORIGIN: <b>ORBITAL</b></button><button class="control-btn danger" id="clear-btn">× CLEAR ALL</button></div>
    <div class="projectile-dock"><div class="dock-label">SELECT PAYLOAD <span>PRESS 1—8</span></div><div class="projectile-grid" id="projectile-grid"></div><button class="chaos-btn" id="chaos-btn"><span>⚡</span><b>CHAOS MODE</b><small>10 SEC RAPID FIRE</small></button></div>
    <div class="reticle" id="reticle"><div class="reticle-ring"></div><span id="reticle-label">LOCK</span></div>
    <div class="toast" id="toast"></div>
  </div>`;

const $ = (id) => document.getElementById(id);
const stage = $('globe-stage');
const selected = { projectile: PROJECTILES[0], target: null, follow: false, muted: false, origin: 'orbital' };
const stats = { launched: 0, impacts: 0, activity: [], targets: new Map() };
const active = [];
let audioCtx;
let chaosTimer;

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
  .pointLat('lat').pointLng('lng').pointColor(() => '#ff713b').pointAltitude(0.012).pointRadius(0.22)
  .onGlobeClick(({ lat, lng }) => setTarget(lat, lng, true));
const vectorCoords = (lat, lng, altitude) => new THREE.Vector3(...globe.getCoords(lat, lng, altitude));

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

function setTarget(lat, lng, launch = false) {
  selected.target = { lat, lng };
  const city = nearestCity(lat, lng);
  $('coords').innerHTML = `${lat.toFixed(3)}° ${lat >= 0 ? 'N' : 'S'} &nbsp; ${Math.abs(lng).toFixed(3)}° ${lng >= 0 ? 'E' : 'W'}<span>targeting lock acquired</span>`;
  $('target-name').textContent = city.name ? `${city.name.toUpperCase()} // ${selected.projectile.name.toUpperCase()}` : 'UNKNOWN SECTOR // RAW COORDINATES';
  $('target-bar-fill').style.width = '100%';
  const pos = vectorCoords(lat, lng, 0.045);
  const projected = pos.clone().project(globe.camera());
  const rect = stage.getBoundingClientRect();
  const x = (projected.x * 0.5 + 0.5) * rect.width;
  const y = (-projected.y * 0.5 + 0.5) * rect.height;
  $('reticle').style.left = `${x}px`; $('reticle').style.top = `${y}px`; $('reticle-label').textContent = `${lat.toFixed(1)}°, ${lng.toFixed(1)}°`;
  $('reticle').classList.add('visible', 'locking');
  setTimeout(() => $('reticle').classList.remove('locking'), 360);
  if (launch) launchProjectile(selected.projectile, { lat, lng });
}

function launchProjectile(projectile, target) {
  ensureAudio();
  stats.launched += 1; $('launch-count').textContent = stats.launched;
  const group = new THREE.Group();
  const sprite = makeEmojiSprite(projectile.emoji, projectile.color);
  group.add(sprite); globe.scene().add(group);
  const start = getOrigin(projectile);
  const end = vectorCoords(target.lat, target.lng, 0.065);
  const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(100 + projectile.arc * 80);
  const trailMaterial = new THREE.LineBasicMaterial({ color: projectile.color, transparent: true, opacity: 0.7 });
  const trailGeometry = new THREE.BufferGeometry().setFromPoints([start.clone(), start.clone()]);
  const trail = new THREE.Line(trailGeometry, trailMaterial); globe.scene().add(trail);
  active.push({ group, sprite, trail, trailGeometry, trailMaterial, start, mid, end, target, projectile, t: 0, duration: Math.max(0.9, 1.75 / projectile.speed) });
  playSound(projectile.id === 'chicken' ? 'squeak' : 'launch');
  addActivity(`${projectile.emoji} ${projectile.name} launched toward ${nearestCity(target.lat, target.lng).name || 'a mysterious ocean'}`);
}

function getOrigin(projectile) {
  if (selected.origin === 'previous' && stats.activity.length) {
    const recent = selected.target || { lat: 0, lng: 0 }; return vectorCoords(recent.lat, recent.lng, 2.6);
  }
  if (selected.origin === 'random') return new THREE.Vector3((Math.random() - .5) * 260, 80 + Math.random() * 100, (Math.random() - .5) * 260);
  return new THREE.Vector3(0, 270, 0);
}

function makeEmojiSprite(emoji, color) {
  const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160;
  const ctx = canvas.getContext('2d'); ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.font = '112px Apple Color Emoji, Segoe UI Emoji, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 80, 83);
  const texture = new THREE.CanvasTexture(canvas); const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }); const sprite = new THREE.Sprite(material); sprite.scale.set(19, 19, 1); return sprite;
}

function tick(delta) {
  active.slice().forEach((item) => {
    item.t += delta / item.duration; const t = Math.min(item.t, 1); const eased = t * t * (3 - 2 * t);
    const a = item.start.clone().multiplyScalar((1 - eased) ** 2); const b = item.mid.clone().multiplyScalar(2 * (1 - eased) * eased); const c = item.end.clone().multiplyScalar(eased ** 2); const pos = a.add(b).add(c);
    item.group.position.copy(pos); item.sprite.material.rotation += delta * 3.6;
    const trailEnd = item.start.clone().lerp(pos, 0.9); item.trailGeometry.setFromPoints([trailEnd, pos]);
    if (selected.follow) globe.camera().lookAt(pos);
    if (t >= 1) { impact(item); active.splice(active.indexOf(item), 1); }
  });
}

function impact(item) {
  const { target, projectile } = item;
  globe.scene().remove(item.group, item.trail); item.trailGeometry.dispose(); item.trailMaterial.dispose(); item.sprite.material.map.dispose(); item.sprite.material.dispose();
  stats.impacts += 1; $('impact-count').textContent = stats.impacts;
  const crater = { lat: target.lat, lng: target.lng, id: `${Date.now()}-${Math.random()}` }; globe.pointsData([...globe.pointsData(), crater].slice(-40));
  globe.ringsData([{ lat: target.lat, lng: target.lng, id: Date.now() }, ...globe.ringsData()].slice(0, 20));
  spawnParticles(target, projectile.color); playSound(projectile.impact === 'SQUEAK' ? 'squeak' : 'boom');
  const city = nearestCity(target.lat, target.lng); const line = `${projectile.emoji} ${projectile.name} destroyed absolutely nothing in ${city.name || 'the open sea'}`; addActivity(line); trackTarget(city.name || 'Uncharted coordinates'); showToast(`${projectile.impact} // ${city.name || 'TARGET ZONE'}`);
}

function spawnParticles(target, color) {
  const origin = vectorCoords(target.lat, target.lng, 0.12); const points = [];
  for (let i = 0; i < 14; i++) { const p = origin.clone().add(new THREE.Vector3((Math.random() - .5) * 10, Math.random() * 10, (Math.random() - .5) * 10)); points.push(p); }
  const geometry = new THREE.BufferGeometry().setFromPoints(points); const material = new THREE.PointsMaterial({ color, size: 3.8, transparent: true, opacity: 1, depthWrite: false }); const particles = new THREE.Points(geometry, material); globe.scene().add(particles);
  setTimeout(() => { globe.scene().remove(particles); geometry.dispose(); material.dispose(); }, 680);
}

function nearestCity(lat, lng) { let closest = { name: null, distance: Infinity }; cities.forEach(([name, a, b]) => { const distance = Math.hypot(lat - a, lng - b); if (distance < closest.distance) closest = { name, distance }; }); return closest.distance < 12 ? closest : { name: null, distance: closest.distance }; }
function addActivity(text) { stats.activity.unshift({ text, time: new Date() }); stats.activity = stats.activity.slice(0, 8); $('activity-feed').innerHTML = stats.activity.map((a) => `<div class="activity-item"><span>${a.text}</span><time>${a.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>`).join(''); }
function trackTarget(name) { stats.targets.set(name, (stats.targets.get(name) || 0) + 1); const rows = [...stats.targets].sort((a, b) => b[1] - a[1]).slice(0, 4); $('leaderboard-list').innerHTML = rows.map(([city, count], i) => `<div class="leader-row"><span>${String(i + 1).padStart(2, '0')} ${city}</span><b>${count}</b></div>`).join(''); }
function showToast(text) { const toast = $('toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800); }
function ensureAudio() { if (!audioCtx) audioCtx = new AudioContext(); }
function playSound(kind) { if (selected.muted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); const now = audioCtx.currentTime; const freq = kind === 'boom' ? 76 : kind === 'squeak' ? 540 : 220; osc.type = kind === 'boom' ? 'sawtooth' : 'triangle'; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(kind === 'boom' ? 42 : freq * 1.7, now + .18); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .015); gain.gain.exponentialRampToValueAtTime(.0001, now + .24); osc.connect(gain).connect(audioCtx.destination); osc.start(now); osc.stop(now + .25); }

$('mute-btn').onclick = () => { selected.muted = !selected.muted; $('mute-btn').textContent = selected.muted ? '◒ UNMUTE' : '◒ MUTE'; ensureAudio(); };
$('follow-btn').onclick = () => { selected.follow = !selected.follow; $('follow-btn').classList.toggle('active', selected.follow); };
$('reset-btn').onclick = () => { globe.pointOfView({ lat: 22, lng: 12, altitude: 2.35 }, 900); globe.controls().autoRotate = true; };
$('origin-btn').onclick = () => { const options = ['orbital', 'previous', 'random']; selected.origin = options[(options.indexOf(selected.origin) + 1) % options.length]; $('origin-btn').innerHTML = `↟ ORIGIN: <b>${selected.origin.toUpperCase()}</b>`; };
$('clear-btn').onclick = () => { active.splice(0).forEach((item) => { globe.scene().remove(item.group, item.trail); item.trailGeometry.dispose(); item.trailMaterial.dispose(); }); globe.ringsData([]); globe.pointsData([]); showToast('FIELD CLEARED // NO MISCHIEF REMAINS'); };
$('chaos-btn').onclick = () => { if (chaosTimer) return; let remaining = 10; $('chaos-status').textContent = `${remaining}s`; chaosTimer = setInterval(() => { remaining -= 1; $('chaos-status').textContent = remaining ? `${remaining}s` : 'STANDBY'; if (remaining <= 0) { clearInterval(chaosTimer); chaosTimer = null; showToast('CHAOS COMPLETE // VERY LITTLE WAS LEARNED'); return; } const p = PROJECTILES[Math.floor(Math.random() * PROJECTILES.length)]; const lat = Math.random() * 140 - 70; const lng = Math.random() * 360 - 180; launchProjectile(p, { lat, lng }); }, 900); };
$('search-btn').onclick = searchPlace;
$('search-input').onkeydown = (event) => { if (event.key === 'Enter') searchPlace(); };
async function searchPlace() { const query = $('search-input').value.trim(); if (!query) return; $('search-result').textContent = 'LOCATING…'; try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`); const results = await response.json(); if (!results.length) throw new Error('not found'); const hit = results[0]; const lat = Number(hit.lat); const lng = Number(hit.lon); globe.pointOfView({ lat, lng, altitude: 1.5 }, 900); $('search-result').textContent = hit.display_name.split(',').slice(0, 2).join(', '); setTarget(lat, lng, false); } catch { $('search-result').textContent = 'NO SIGNAL — TRY ANOTHER PLACE'; } }

window.addEventListener('keydown', (event) => { const p = PROJECTILES.find((item) => item.hotkey === event.key); if (p) selectProjectile(p.id); });
let previous = performance.now();
function animate(now) { const delta = Math.min((now - previous) / 1000, .05); previous = now; tick(delta); requestAnimationFrame(animate); }
requestAnimationFrame(animate);


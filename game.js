import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildProceduralBMW, loadExternalGLBVehicle } from './carBuilder.js';

// ============================================================================
// 1. AUDIO SYNTHESIS ENGINE (Procedural Web Audio API - Zero External MP3s)
// ============================================================================
class AutomotiveAudioEngine {
constructor() {
this.ctx = null;
this.enabled = true;
this.masterVolume = 0.8;
this.sportExhaust = true;
this.initialized = false;
}

init() {
if (this.initialized) return;
try {
const AudioCtx = window.AudioContext || window.webkitAudioContext;
this.ctx = new AudioCtx();

this.masterGain = this.ctx.createGain();  
  this.masterGain.gain.value = this.masterVolume * 0.28;  
  this.masterGain.connect(this.ctx.destination);  

  // Inline-6 Cylinder Dual-Oscillator Synthesis  
  this.engineGain = this.ctx.createGain();  
  this.engineFilter = this.ctx.createBiquadFilter();  
  this.engineFilter.type = 'lowpass';  
  this.engineFilter.frequency.value = 380;  

  this.osc1 = this.ctx.createOscillator();  
  this.osc2 = this.ctx.createOscillator();  
  this.osc1.type = 'sawtooth';  
  this.osc2.type = 'triangle';  

  this.osc1.connect(this.engineFilter);  
  this.osc2.connect(this.engineFilter);  
  this.engineFilter.connect(this.engineGain);  
  this.engineGain.connect(this.masterGain);  

  this.osc1.start();  
  this.osc2.start();  

  // Tire Squeal / Road Spray Noise Generator  
  const bufferSize = this.ctx.sampleRate * 1.5;  
  const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);  
  const output = noiseBuffer.getChannelData(0);  
  for (let i = 0; i < bufferSize; i++) {  
    output[i] = Math.random() * 2 - 1;  
  }  

  this.skidSource = this.ctx.createBufferSource();  
  this.skidSource.buffer = noiseBuffer;  
  this.skidSource.loop = true;  

  this.skidFilter = this.ctx.createBiquadFilter();  
  this.skidFilter.type = 'bandpass';  
  this.skidFilter.frequency.value = 1150;  
  this.skidFilter.Q.value = 3.5;  

  this.skidGain = this.ctx.createGain();  
  this.skidGain.gain.value = 0.0;  

  this.skidSource.connect(this.skidFilter);  
  this.skidFilter.connect(this.skidGain);  
  this.skidGain.connect(this.masterGain);  
  this.skidSource.start();  

  this.initialized = true;  
} catch (e) {  
  console.warn('Web Audio API unavailable:', e);  
}

}

update(rpm, throttle, slipAmount, speedKmh) {
if (!this.initialized || !this.ctx) return;
if (this.ctx.state === 'suspended' && this.enabled) {
this.ctx.resume();
}
const now = this.ctx.currentTime;
if (!this.enabled) {
this.masterGain.gain.setTargetAtTime(0, now, 0.05);
return;
}

this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.26, now, 0.05);  

const baseFreq = Math.max(28, (rpm / 60) * 1.5);  
this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);  
this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);  

const exhaustMult = this.sportExhaust ? 1.55 : 0.9;  
const cutoff = 220 + (rpm / 7200) * 1400 * exhaustMult + throttle * 350;  
this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.04);  
this.engineGain.gain.setTargetAtTime(0.4 + throttle * 0.45, now, 0.04);  

// Tire squeal when drifting or cornering hard at speed  
const squeal = speedKmh > 18 && slipAmount > 0.22 ? Math.min(0.65, (slipAmount - 0.22) * 1.2) : 0;  
this.skidGain.gain.setTargetAtTime(squeal, now, 0.05);

}
}

// ============================================================================
// 2. PROCEDURAL TEXTURES & WORLD GENERATOR (City, Highway, Coast)
// ============================================================================
function createAsphaltTexture() {
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#1c1f24';
ctx.fillRect(0, 0, 512, 512);

// Subtle asphalt grain
for (let i = 0; i < 9000; i++) {
const shade = 22 + Math.floor(Math.random() * 24);
  ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 2})`;
ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
}

// Edge solid lines
ctx.fillStyle = '#d8dee9';
ctx.fillRect(18, 0, 8, 512);
ctx.fillRect(486, 0, 8, 512);

// Center dashed double-yellow / white highway divider
ctx.fillStyle = '#e5b546';
for (let y = 0; y < 512; y += 64) {
ctx.fillRect(252, y + 10, 8, 36);
}

const tex = new THREE.CanvasTexture(canvas);
tex.wrapS = THREE.RepeatWrapping;
tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(1, 75);
tex.anisotropy = 4;
return tex;
}

function createBuildingFacadeTexture() {
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 512;
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#0e131a';
ctx.fillRect(0, 0, 256, 512);

for (let r = 8; r < 500; r += 20) {
for (let c = 8; c < 248; c += 24) {
const lit = Math.random() > 0.42;
if (lit) {
const warm = Math.random() > 0.35;
ctx.fillStyle = warm ? '#ffe4b5' : '#9be2ff';
} else {
ctx.fillStyle = '#161e29';
}
ctx.fillRect(c, r, 16, 12);
}
}
const tex = new THREE.CanvasTexture(canvas);
tex.wrapS = THREE.RepeatWrapping;
tex.wrapT = THREE.RepeatWrapping;
return tex;
}

// ============================================================================
// 3. MAIN GAME ENGINE
// ============================================================================
class UltimateDriveSimulator {
constructor() {
this.canvas = document.getElementById('game-canvas');
this.minimapCanvas = document.getElementById('minimap-canvas');
this.minimapCtx = this.minimapCanvas.getContext('2d');

this.state = {  
  mode: 'MENU', // 'MENU', 'INTRO', 'DRIVING'  
  timeOfDay: 'sunset',  
  weather: 'clear',  
  preset: 'high',  
  resScale: 1.0,  
  fov: 62,  
  steerSens: 1.0,  
  assistMode: 'sim',  
  cameraIndex: 0, // 0: Chase, 1: Close Chase, 2: Hood, 3: Cockpit  
  headlightsOn: true,  
  introTimer: 0  
};  

this.input = {  
  left: false,  
  right: false,  
  throttle: false,  
  brake: false,  
  handbrake: false  
};  

this.physics = {  
  pos: new THREE.Vector3(0, 0.2, 0),  
  vel: new THREE.Vector3(0, 0, 0),  
  heading: 0,  
  angularVel: 0,  
  speedMps: 0,  
  speedKmh: 0,  
  steerAngle: 0,  
  rpm: 850,  
  gear: 1,  
  pitch: 0,  
  roll: 0,  
  slipRatio: 0,  
  wheelRotation: 0  
};  

this.audio = new AutomotiveAudioEngine();  
this.traffic = [];  
this.smokeParticles = [];  
this.clock = new THREE.Clock();  
this.fpsFrames = 0;  
this.fpsTime = 0;  

this.initWebGL();  
this.buildWorld();  
this.buildVehicle();  
this.buildWeatherAndParticles();  
this.bindUIAndControls();  
this.applyEnvironmentState();  
this.applyGraphicsPreset(this.state.preset);  

// Spawn initially in Downtown City  
this.teleportToZone('city');  

// Dismiss Loading Screen  
document.getElementById('progress-fill').style.width = '100%';  
setTimeout(() => {  
  document.getElementById('loading-screen').classList.add('hidden');  
}, 350);  

this.animate = this.animate.bind(this);  
requestAnimationFrame(this.animate);

}

initWebGL() {
try {
this.renderer = new THREE.WebGLRenderer({
canvas: this.canvas,
antialias: true,
powerPreference: 'high-performance'
});
} catch (err) {
document.getElementById('webgl-error').classList.remove('hidden');
throw err;
}

this.renderer.outputColorSpace = THREE.SRGBColorSpace;  
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;  
this.renderer.toneMappingExposure = 1.05;  
this.renderer.shadowMap.enabled = true;  
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;  

this.canvas.addEventListener('webglcontextlost', (e) => {  
  e.preventDefault();  
  document.getElementById('webgl-error-msg').textContent = 'WebGL graphics context was lost. Reload the page to resume.';  
  document.getElementById('webgl-error').classList.remove('hidden');  
});  

this.scene = new THREE.Scene();  
this.scene.fog = new THREE.FogExp2(0x1f2430, 0.0022);  

this.camera = new THREE.PerspectiveCamera(  
  this.state.fov,  
  window.innerWidth / window.innerHeight,  
  0.15,  
  1100  
);  

// Studio/Automotive Environment Map Reflections  
const pmremGenerator = new THREE.PMREMGenerator(this.renderer);  
this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;  

// Lighting  
this.ambientLight = new THREE.HemisphereLight(0xddeeff, 0x1a1e24, 0.65);  
this.scene.add(this.ambientLight);  

this.sunLight = new THREE.DirectionalLight(0xffb870, 2.6);  
this.sunLight.position.set(120, 95, 80);  
this.sunLight.castShadow = true;  
this.sunLight.shadow.mapSize.set(1024, 1024);  
this.sunLight.shadow.camera.near = 10;  
this.sunLight.shadow.camera.far = 350;  
const d = 55;  
this.sunLight.shadow.camera.left = -d;  
this.sunLight.shadow.camera.right = d;  
this.sunLight.shadow.camera.top = d;  
this.sunLight.shadow.camera.bottom = -d;  
this.scene.add(this.sunLight);  
this.scene.add(this.sunLight.target);  

window.addEventListener('resize', () => this.updateViewportSize());  
this.updateViewportSize();

}

updateViewportSize() {
const w = window.innerWidth;
const h = window.innerHeight;
this.camera.aspect = w / h;
this.camera.updateProjectionMatrix();
const maxDPR = Math.min(window.devicePixelRatio || 1, 2) * this.state.resScale;
this.renderer.setPixelRatio(maxDPR);
this.renderer.setSize(w, h, false);
}

// --------------------------------------------------------------------------
// OPEN-WORLD NETWORK (Connected City + Mountain Highway + Coastal Ocean Loop)
// --------------------------------------------------------------------------
buildWorld() {
this.roadWidth = 15.5;
this.halfRoad = this.roadWidth * 0.5;

// Closed CatmullRom spline through 3 distinct biomes  
const controlPoints = [  
  // Zone A: Modern City Straight & Junctions  
  new THREE.Vector3(0, 0.2, -160),  
  new THREE.Vector3(0, 0.2, 0),  
  new THREE.Vector3(0, 0.2, 170),  
  new THREE.Vector3(95, 0.2, 260),  
  // Zone B: Scenic Mountain Highway & Overpass  
  new THREE.Vector3(260, 7.5, 230),  
  new THREE.Vector3(380, 12.0, 90),  
  new THREE.Vector3(410, 6.0, -90),  
  new THREE.Vector3(290, 1.5, -260),  
  // Zone C: Winding Coastal Route  
  new THREE.Vector3(110, 0.4, -330),  
  new THREE.Vector3(-120, 0.4, -310),  
  new THREE.Vector3(-240, 0.4, -180),  
  new THREE.Vector3(-160, 0.2, -170)  
];  

this.roadCurve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.45);  
this.roadSamples = [];  
const sampleCount = 500;  

// Build ribbon geometry for main road and guardrails  
const roadPositions = [];  
const roadUVs = [];  
const roadIndices = [];  
const barrierPositions = [];  
const barrierIndices = [];  

for (let i = 0; i <= sampleCount; i++) {  
  const t = i / sampleCount;  
  const pt = this.roadCurve.getPointAt(t);  
  const tangent = this.roadCurve.getTangentAt(t).normalize();  
  const up = new THREE.Vector3(0, 1, 0);  
  const right = new THREE.Vector3().crossVectors(tangent, up).normalize();  

  if (i < sampleCount) {  
    this.roadSamples.push({ t, pt, tangent, right });  
  }  

  const leftEdge = pt.clone().addScaledVector(right, -this.halfRoad);  
  const rightEdge = pt.clone().addScaledVector(right, this.halfRoad);  

  roadPositions.push(leftEdge.x, leftEdge.y, leftEdge.z);  
  roadPositions.push(rightEdge.x, rightEdge.y, rightEdge.z);  
  roadUVs.push(0, t * 85, 1, t * 85);  

  // Concrete/Steel Guardrails along road edges  
  const bLeftBot = leftEdge.clone().addScaledVector(right, -0.4);  
  const bLeftTop = bLeftBot.clone().add(new THREE.Vector3(0, 0.75, 0));  
  const bRightBot = rightEdge.clone().addScaledVector(right, 0.4);  
  const bRightTop = bRightBot.clone().add(new THREE.Vector3(0, 0.75, 0));  

  barrierPositions.push(  
    bLeftBot.x, bLeftBot.y, bLeftBot.z,  
    bLeftTop.x, bLeftTop.y, bLeftTop.z,  
    bRightBot.x, bRightBot.y, bRightBot.z,  
    bRightTop.x, bRightTop.y, bRightTop.z  
  );  

  if (i < sampleCount) {  
    const rIdx = i * 2;  
    roadIndices.push(rIdx, rIdx + 1, rIdx + 2, rIdx + 1, rIdx + 3, rIdx + 2);  

    const bIdx = i * 4;  
    barrierIndices.push(bIdx, bIdx + 1, bIdx + 4, bIdx + 1, bIdx + 5, bIdx + 4);  
    barrierIndices.push(bIdx + 2, bIdx + 6, bIdx + 3, bIdx + 3, bIdx + 6, bIdx + 7);  
  }  
}  

const roadGeo = new THREE.BufferGeometry();  
roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));  
roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));  
roadGeo.setIndex(roadIndices);  
roadGeo.computeVertexNormals();  

this.roadMaterial = new THREE.MeshStandardMaterial({  
  map: createAsphaltTexture(),  
  roughness: 0.65,  
  metalness: 0.15  
});  

const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);  
roadMesh.receiveShadow = true;  
this.scene.add(roadMesh);  

const barrierGeo = new THREE.BufferGeometry();  
barrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(barrierPositions, 3));  
barrierGeo.setIndex(barrierIndices);  
barrierGeo.computeVertexNormals();  
const barrierMat = new THREE.MeshStandardMaterial({ color: 0x3a404a, roughness: 0.6, metalness: 0.4 });  
const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);  
this.scene.add(barrierMesh);  

// Base Ground & Coastal Ocean Plane  
const groundGeo = new THREE.PlaneGeometry(1600, 1600);  
groundGeo.rotateX(-Math.PI / 2);  
const groundMat = new THREE.MeshStandardMaterial({ color: 0x131915, roughness: 0.92 });  
const ground = new THREE.Mesh(groundGeo, groundMat);  
ground.position.y = -0.05;  
ground.receiveShadow = true;  
this.scene.add(ground);  

// Coastal Ocean Water Plane (South-West Region)  
const oceanGeo = new THREE.PlaneGeometry(900, 600);  
oceanGeo.rotateX(-Math.PI / 2);  
this.oceanMat = new THREE.MeshStandardMaterial({  
  color: 0x09253a,  
  roughness: 0.12,  
  metalness: 0.85  
});  
const ocean = new THREE.Mesh(oceanGeo, this.oceanMat);  
ocean.position.set(-140, 0.02, -450);  
this.scene.add(ocean);  

// Instanced Modern City Skyscrapers (Zero draw-call bloat)  
const bldgGeo = new THREE.BoxGeometry(1, 1, 1);  
bldgGeo.translate(0, 0.5, 0);  
this.bldgMat = new THREE.MeshStandardMaterial({  
  map: createBuildingFacadeTexture(),  
  roughness: 0.3,  
  metalness: 0.65  
});  

const buildingCount = 95;  
const instancedBldgs = new THREE.InstancedMesh(bldgGeo, this.bldgMat, buildingCount);  
instancedBldgs.castShadow = true;  
instancedBldgs.receiveShadow = true;  

const dummy = new THREE.Object3D();  
let idx = 0;  
for (let z = -150; z <= 220; z += 26) {  
  for (let side of [-1, 1]) {  
    if (idx >= buildingCount) break;  
    const distFromRoad = 22 + Math.random() * 45;  
    const w = 14 + Math.random() * 14;  
    const d = 14 + Math.random() * 14;  
    const h = 24 + Math.random() * 72;  
    dummy.position.set(side * distFromRoad, 0, z + (Math.random() - 0.5) * 8);  
    dummy.scale.set(w, h, d);  
    dummy.updateMatrix();  
    instancedBldgs.setMatrixAt(idx++, dummy.matrix);  
  }  
}  
this.scene.add(instancedBldgs);  

// Mountain Highway Silhouettes & Trees  
const mountainGeo = new THREE.ConeGeometry(85, 110, 7);  
const mountainMat = new THREE.MeshStandardMaterial({ color: 0x182026, roughness: 0.9 });  
const mountainPositions = [  
  [480, 45, 220], [520, 52, 40], [490, 40, -140], [340, 35, 360]  
];  
mountainPositions.forEach(([mx, my, mz]) => {  
  const m = new THREE.Mesh(mountainGeo, mountainMat);  
  m.position.set(mx, my, mz);  
  this.scene.add(m);  
});  

// Highway Tunnel Arch Overpass  
const tunnelGeo = new THREE.CylinderGeometry(12.5, 12.5, 55, 16, 1, true, 0, Math.PI);  
tunnelGeo.rotateZ(Math.PI / 2);  
const tunnelMat = new THREE.MeshStandardMaterial({  
  color: 0x22262c,  
  side: THREE.DoubleSide,  
  roughness: 0.7  
});  
const tunnelPt = this.roadCurve.getPointAt(0.45);  
const tunnelTan = this.roadCurve.getTangentAt(0.45);  
const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);  
tunnelMesh.position.copy(tunnelPt).add(new THREE.Vector3(0, 0.2, 0));  
tunnelMesh.lookAt(tunnelPt.clone().add(tunnelTan));  
this.scene.add(tunnelMesh);  

// Instanced Streetlights along the road network  
const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 6);  
poleGeo.translate(0, 3.75, 0);  
const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c323b, metalness: 0.8 });  
const lightCount = 100;  
const instancedPoles = new THREE.InstancedMesh(poleGeo, poleMat, lightCount);  
for (let i = 0; i < lightCount; i++) {  
  const sample = this.roadSamples[(i * 5) % this.roadSamples.length];  
  const side = i % 2 === 0 ? 1 : -1;  
  dummy.position.copy(sample.pt).addScaledVector(sample.right, side * (this.halfRoad + 1.1));  
  dummy.scale.set(1, 1, 1);  
  dummy.updateMatrix();  
  instancedPoles.setMatrixAt(i, dummy.matrix);  
}  
this.scene.add(instancedPoles);  

// Spawn AI Traffic Vehicles  
this.spawnTraffic(10);

}

spawnTraffic(count) {
const trafficColors = [0xd8dee9, 0x2e3440, 0x5e81ac, 0xbf616a, 0x4c566a];
for (let i = 0; i < count; i++) {
const group = new THREE.Group();
const mat = new THREE.MeshStandardMaterial({
color: trafficColors[i % trafficColors.length],
metalness: 0.7,
roughness: 0.25
});
const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.3), mat);
chassis.position.y = 0.55;
chassis.castShadow = true;
group.add(chassis);

const cabin = new THREE.Mesh(  
    new THREE.BoxGeometry(1.55, 0.48, 2.1),  
    new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.1 })  
  );  
  cabin.position.set(0, 1.05, -0.2);  
  group.add(cabin);  

  // Headlights & Taillights on AI traffic  
  const hl = new THREE.Mesh(  
    new THREE.BoxGeometry(1.5, 0.12, 0.08),  
    new THREE.MeshBasicMaterial({ color: 0xdff6ff })  
  );  
  hl.position.set(0, 0.58, 2.15);  
  group.add(hl);  

  const tl = new THREE.Mesh(  
    new THREE.BoxGeometry(1.5, 0.12, 0.08),  
    new THREE.MeshBasicMaterial({ color: 0xff1111 })  
  );  
  tl.position.set(0, 0.62, -2.15);  
  group.add(tl);  

  this.scene.add(group);  
  this.traffic.push({  
    mesh: group,  
    t: (i / count + 0.08) % 1.0,  
    speed: 14 + (i % 4) * 2.5,  
    laneOffset: i % 2 === 0 ? 3.7 : -3.7,  
    dir: i % 2 === 0 ? 1 : -1  
  });  
}

}

// --------------------------------------------------------------------------
// VEHICLE & WEATHER PARTICLES
// --------------------------------------------------------------------------
buildVehicle() {
this.carRig = buildProceduralBMW();
this.scene.add(this.carRig.root);
}

buildWeatherAndParticles() {
// Rain Particle System
const rainCount = 1400;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount * 3; i += 3) {
rainPos[i] = (Math.random() - 0.5) * 70;
rainPos[i + 1] = Math.random() * 35;
rainPos[i + 2] = (Math.random() - 0.5) * 70;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
color: 0xaec6df,
size: 0.22,
transparent: true,
opacity: 0.65
});
this.rainSystem = new THREE.Points(rainGeo, rainMat);
this.rainSystem.visible = false;
this.scene.add(this.rainSystem);

// Tire Smoke / Wet Spray Pool  
const smokeGeo = new THREE.SphereGeometry(0.28, 6, 6);  
const smokeMat = new THREE.MeshBasicMaterial({  
  color: 0xd0d8e0,  
  transparent: true,  
  opacity: 0.35  
});  
for (let i = 0; i < 24; i++) {  
  const p = new THREE.Mesh(smokeGeo, smokeMat.clone());  
  p.visible = false;  
  this.scene.add(p);  
  this.smokeParticles.push({ mesh: p, life: 0, vel: new THREE.Vector3() });  
}

}

spawnWheelParticle(worldPos) {
const item = this.smokeParticles.find((p) => p.life <= 0);
if (!item) return;
item.life = 1.0;
item.mesh.visible = true;
item.mesh.position.copy(worldPos);
item.mesh.scale.setScalar(0.6);
item.vel.set((Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 1.5);
}

// --------------------------------------------------------------------------
// DRIVING PHYSICS (Fixed-Step Pace

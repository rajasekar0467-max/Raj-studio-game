import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildProceduralBMW, loadExternalGLBVehicle } from './carBuilder.js';

// ============================================================================
// 0. UI ELEMENT IDS - edit these so they match the ids in your index.html.
//    Any id that does not exist is simply skipped (nothing will crash).
// ============================================================================
const UI = {
  loading: 'loading-screen', progress: 'progress-fill',
  glError: 'webgl-error', glErrorMsg: 'webgl-error-msg',
  menu: 'menu-screen', hud: 'hud',
  start: 'btn-start', cont: 'btn-continue', skip: 'btn-skip-intro', pause: 'btn-pause',
  camBtn: 'btn-camera', lightsBtn: 'btn-lights', audioBtn: 'btn-audio', gfxBtn: 'btn-gfx',
  paint: 'sel-paint', glbUrl: 'glb-url', glbLoad: 'btn-load-glb',
  time: 'sel-time', weather: 'sel-weather', spawn: 'sel-spawn',
  preset: 'sel-preset', res: 'rng-res', fov: 'rng-fov', steer: 'rng-steer', assist: 'sel-assist',
  audioMode: 'sel-audio', exhaust: 'sel-exhaust', volume: 'rng-volume',
  resLabel: 'lbl-res', fovLabel: 'lbl-fov', steerLabel: 'lbl-steer', volLabel: 'lbl-volume',
  speed: 'hud-speed', rpm: 'hud-rpm', gear: 'hud-gear', fps: 'hud-fps',
  zone: 'hud-zone', cam: 'hud-cam', info: 'hud-info',
  left: 'btn-left', right: 'btn-right', throttle: 'btn-throttle', brake: 'btn-brake', pbrake: 'btn-pbrake'
};

const $ = (id) => document.getElementById(id);
const on = (id, ev, fn, opts) => { const el = $(id); if (el) el.addEventListener(ev, fn, opts); };
const setText = (id, t) => { const el = $(id); if (el && el.textContent !== t) el.textContent = t; };
const show = (id, v) => { const el = $(id); if (el) el.classList.toggle('hidden', !v); };
const bindValue = (id, fn) => {
  const el = $(id);
  if (!el) return;
  const h = () => fn(el.value);
  el.addEventListener('input', h);
  el.addEventListener('change', h);
};

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
// 2. PROCEDURAL TEXTURES
// ============================================================================
function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const shade = 22 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  ctx.fillStyle = '#d8dee9';
  ctx.fillRect(18, 0, 8, 512);
  ctx.fillRect(486, 0, 8, 512);

  ctx.fillStyle = '#e5b546';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(252, y + 10, 8, 36);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createSmokeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(235,235,235,0.9)');
  grad.addColorStop(1, 'rgba(235,235,235,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ============================================================================
// 3. ENVIRONMENT PRESETS
// ============================================================================
const TIME_PRESETS = {
  morning: { sky: 0x9fc3dd, sun: 0xfff0d8, sunI: 2.8, sunPos: [-90, 90, 70], hemi: 0.9, exp: 1.0, win: 0.0, env: 1.0, fog: 0.0018, label: 'MORNING' },
  sunset:  { sky: 0x7a4f52, sun: 0xffb870, sunI: 2.6, sunPos: [120, 45, 80], hemi: 0.65, exp: 1.05, win: 0.35, env: 0.8, fog: 0.0022, label: 'SUNSET' },
  night:   { sky: 0x05070d, sun: 0x6f8cff, sunI: 0.35, sunPos: [-60, 80, -40], hemi: 0.22, exp: 1.25, win: 1.0, env: 0.25, fog: 0.0026, label: 'NIGHT' }
};
const WEATHER_PRESETS = {
  clear: { dark: 1.0, fogMul: 1.0, rain: 0, rough: 0.65, metal: 0.15, grip: 1.0, label: 'CLEAR' },
  rain:  { dark: 0.75, fogMul: 1.8, rain: 0.5, rough: 0.3, metal: 0.35, grip: 0.8, label: 'RAIN' },
  storm: { dark: 0.5, fogMul: 3.2, rain: 1.0, rough: 0.2, metal: 0.4, grip: 0.65, label: 'STORM' }
};
const PAINTS = { black: 0x0b0d12, grey: 0x8d9096, blue: 0x2a2f8f };
const ZONE_T = { city: 0.08, mountain: 0.47, coast: 0.83 };
const GEAR_MAX_KMH = [55, 95, 140, 190, 240, 300];

// ============================================================================
// 4. MAIN GAME ENGINE
// ============================================================================
class UltimateDriveSimulator {
  constructor() {
    this.canvas = $('game-canvas');
    this.minimapCanvas = $('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

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
      introTimer: 0,
      started: false
    };

    this.input = { left: false, right: false, throttle: false, brake: false, handbrake: false };

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
    this.fps = 60;
    this.throttleVal = 0;
    this.longAccel = 0;
    this.orbitAngle = 0;
    this.flash = 0;
    this.baseHemi = 0.65;
    this.sunOffset = new THREE.Vector3(120, 95, 80);
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();

    this.initWebGL();
    this.buildWorld();
    this.buildVehicle();
    this.buildWeatherAndParticles();
    this.buildMinimap();
    this.bindUIAndControls();
    this.applyEnvironmentState();
    this.applyGraphicsPreset(this.state.preset);

    // Spawn initially in Downtown City
    this.teleportToZone('city');

    // Dismiss Loading Screen
    const pf = $(UI.progress);
    if (pf) pf.style.width = '100%';
    setTimeout(() => show(UI.loading, false), 350);

    // If the page has no menu/start button, just start driving.
    if (!$(UI.start)) this.startGame(true);
    else { show(UI.menu, true); show(UI.hud, false); }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // --------------------------------------------------------------------------
  // RENDERER / SCENE
  // --------------------------------------------------------------------------
  initWebGL() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      show(UI.glError, true);
      show(UI.loading, false);
      throw err;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      setText(UI.glErrorMsg, 'WebGL graphics context was lost. Reload the page to resume.');
      show(UI.glError, true);
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1f2430);
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
    this.roadLength = this.roadCurve.getLength();
    this.roadSamples = [];
    const sampleCount = 500;

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
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x3a404a, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide
    });
    this.scene.add(new THREE.Mesh(barrierGeo, barrierMat));

    // Base Ground
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x131915, roughness: 0.92 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Coastal Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(900, 600);
    oceanGeo.rotateX(-Math.PI / 2);
    this.oceanMat = new THREE.MeshStandardMaterial({ color: 0x09253a, roughness: 0.12, metalness: 0.85 });
    const ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    ocean.position.set(-140, 0.02, -450);
    this.scene.add(ocean);

    // Instanced Modern City Skyscrapers
    const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
    bldgGeo.translate(0, 0.5, 0);
    this.bldgMat = new THREE.MeshStandardMaterial({
      map: createBuildingFacadeTexture(),
      roughness: 0.3,
      metalness: 0.65,
      emissive: 0xffffff,
      emissiveIntensity: 0
    });
    this.bldgMat.emissiveMap = this.bldgMat.map;

    const buildingCount = 95;
    const instancedBldgs = new THREE.InstancedMesh(bldgGeo, this.bldgMat, buildingCount);
    instancedBldgs.castShadow = true;
    instancedBldgs.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let z = -150; z <= 220; z += 26) {
      for (const side of [-1, 1]) {
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
    instancedBldgs.count = idx; // don't draw unused identity-matrix instances at the origin
    this.scene.add(instancedBldgs);

    // Mountain Silhouettes
    const mountainGeo = new THREE.ConeGeometry(85, 110, 7);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x182026, roughness: 0.9 });
    [[480, 45, 220], [520, 52, 40], [490, 40, -140], [340, 35, 360]].forEach(([mx, my, mz]) => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(mx, my, mz);
      this.scene.add(m);
    });

    // Highway Tunnel Arch (axis along the road, arch on top)
    const tunnelGeo = new THREE.CylinderGeometry(12.5, 12.5, 55, 16, 1, true, Math.PI / 2, Math.PI);
    tunnelGeo.rotateX(Math.PI / 2);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x22262c, side: THREE.DoubleSide, roughness: 0.7 });
    const tunnelPt = this.roadCurve.getPointAt(0.45);
    const tunnelTan = this.roadCurve.getTangentAt(0.45);
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.position.copy(tunnelPt).add(new THREE.Vector3(0, 0.2, 0));
    tunnelMesh.lookAt(tunnelPt.clone().add(tunnelTan));
    this.scene.add(tunnelMesh);

    // Instanced Streetlight poles
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
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedPoles.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(instancedPoles);

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

      const hl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xdff6ff }));
      hl.position.set(0, 0.58, 2.15);
      group.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xff1111 }));
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
    this.carRig.root.rotation.order = 'YXZ';
    this.scene.add(this.carRig.root);
    this.attachHeadlights();
  }

  attachHeadlights() {
    if (this.headlight) {
      if (this.headlight.parent) this.headlight.parent.remove(this.headlight);
      if (this.headlight.target.parent) this.headlight.target.parent.remove(this.headlight.target);
    }
    this.headlight = new THREE.SpotLight(0xfff2dd, 120, 90, 0.5, 0.55, 1.2);
    this.headlight.position.set(0, 0.8, 2.0);
    this.headlight.target.position.set(0, 0.4, 22);
    this.carRig.root.add(this.headlight);
    this.carRig.root.add(this.headlight.target);
    this.setHeadlights(this.state.headlightsOn);
  }

  setHeadlights(on_) {
    this.state.headlightsOn = on_;
    if (this.headlight) this.headlight.visible = on_;
    if (typeof this.carRig.setHeadlights === 'function') this.carRig.setHeadlights(on_);
  }

  setPaint(hex) {
    if (typeof this.carRig.setPaint === 'function') {
      this.carRig.setPaint(hex);
      return;
    }
    this.carRig.root.traverse((o) => {
      const m = o.isMesh ? o.material : null;
      if (m && !Array.isArray(m) && m.color && (m.userData?.paint || /paint|body/i.test(m.name || ''))) {
        m.color.setHex(hex);
      }
    });
  }

  async loadGLB(url) {
    if (!url) return;
    try {
      const result = await loadExternalGLBVehicle(url);
      if (!result) return;
      const rig = result.root ? result : { root: result };
      this.scene.remove(this.carRig.root);
      this.carRig = rig;
      this.carRig.root.rotation.order = 'YXZ';
      this.scene.add(this.carRig.root);
      this.attachHeadlights();
    } catch (e) {
      console.warn('GLB load failed (check the URL and that the server allows CORS):', e);
    }
  }

  buildWeatherAndParticles() {
    // Rain streaks
    this.rainCount = 1400;
    this.rainPos = new Float32Array(this.rainCount * 6);
    for (let i = 0; i < this.rainCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 35;
      const z = (Math.random() - 0.5) * 70;
      this.rainPos.set([x, y, z, x, y + 0.9, z], i * 6);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rain = new THREE.LineSegments(
      rainGeo,
      new THREE.LineBasicMaterial({ color: 0xaec6e0, transparent: true, opacity: 0.45, depthWrite: false })
    );
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);

    // Tire smoke sprite pool
    const smokeTex = createSmokeTexture();
    for (let i = 0; i < 36; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: smokeTex, transparent: true, opacity: 0, depthWrite: false
      }));
      sp.visible = false;
      this.scene.add(sp);
      this.smokeParticles.push({ sprite: sp, life: 0, maxLife: 1, vel: new THREE.Vector3() });
    }
    this.smokeIndex = 0;
  }

  emitSmoke(pos, vel) {
    const p = this.smokeParticles[this.smokeIndex];
    this.smokeIndex = (this.smokeIndex + 1) % this.smokeParticles.length;
    p.life = p.maxLife = 0.9 + Math.random() * 0.5;
    p.sprite.position.copy(pos);
    p.sprite.scale.setScalar(0.8);
    p.sprite.material.opacity = 0.45;
    p.sprite.visible = true;
    p.vel.copy(vel).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8));
  }

  updateParticles(dt) {
    const p = this.physics;
    const wet = WEATHER_PRESETS[this.state.weather];

    // Rain
    if (this.rain.visible) {
      this.rain.position.set(p.pos.x, 0, p.pos.z);
      const a = this.rainPos;
      const fall = 38 * dt;
      for (let i = 0; i < this.rainCount; i++) {
        const o = i * 6;
        let y = a[o + 1] - fall;
        if (y < 0) {
          y = 30 + Math.random() * 5;
          a[o] = (Math.random() - 0.5) * 70;
          a[o + 2] = (Math.random() - 0.5) * 70;
        }
        a[o + 1] = y;
        a[o + 3] = a[o];
        a[o + 4] = y + 0.9;
        a[o + 5] = a[o + 2];
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // Lightning flashes in storms
    if (this.state.weather === 'storm' && Math.random() < 0.004) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.ambientLight.intensity = this.baseHemi + this.flash * 3.0;

    // Tire smoke
    const f = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    const l = new THREE.Vector3(f.z, 0, -f.x);
    if (this.state.mode === 'DRIVING' && Math.abs(p.speedKmh) > 12 && (p.slipRatio > 0.45 || this.input.handbrake && p.slipRatio > 0.2)) {
      for (const side of [-0.85, 0.85]) {
        const pos = p.pos.clone().addScaledVector(f, -1.5).addScaledVector(l, side);
        pos.y += 0.2;
        this.emitSmoke(pos, p.vel.clone().multiplyScalar(0.15));
      }
    }
    for (const s of this.smokeParticles) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) { s.sprite.visible = false; continue; }
      const k = 1 - s.life / s.maxLife;
      s.sprite.position.addScaledVector(s.vel, dt);
      s.sprite.scale.setScalar(0.8 + k * 3.2);
      s.sprite.material.opacity = 0.45 * (1 - k);
    }
    void wet;
  }

  // --------------------------------------------------------------------------
  // ENVIRONMENT / GRAPHICS STATE
  // --------------------------------------------------------------------------
  applyEnvironmentState() {
    const T = TIME_PRESETS[this.state.timeOfDay] || TIME_PRESETS.sunset;
    const W = WEATHER_PRESETS[this.state.weather] || WEATHER_PRESETS.clear;

    const sky = new THREE.Color(T.sky).multiplyScalar(W.dark);
    this.scene.background.copy(sky);
    this.scene.fog.color.copy(sky);
    this.scene.fog.density = T.fog * W.fogMul;

    this.sunLight.color.setHex(T.sun);
    this.sunLight.intensity = T.sunI * W.dark;
    this.sunOffset.set(T.sunPos[0], T.sunPos[1], T.sunPos[2]);
    this.baseHemi = T.hemi * (0.6 + 0.4 * W.dark);
    this.ambientLight.intensity = this.baseHemi;
    this.renderer.toneMappingExposure = T.exp;
    this.scene.environmentIntensity = T.env * W.dark;

    this.bldgMat.emissiveIntensity = T.win;
    this.roadMaterial.roughness = W.rough;
    this.roadMaterial.metalness = W.metal;

    this.rain.visible = W.rain > 0;
    this.rain.material.opacity = 0.25 + W.rain * 0.35;
    this.rain.geometry.setDrawRange(0, Math.floor(this.rainCount * W.rain) * 2);

    if (this.state.timeOfDay === 'night' || this.state.weather === 'storm') this.setHeadlights(true);

    setText(UI.info, `${T.label} | ${W.label}`);
  }

  applyGraphicsPreset(preset) {
    this.state.preset = preset;
    const cfg = {
      low: { res: 0.7, shadow: false, map: 512 },
      medium: { res: 0.85, shadow: true, map: 1024 },
      high: { res: 1.0, shadow: true, map: 2048 }
    }[preset] || { res: 1.0, shadow: true, map: 1024 };

    this.state.resScale = cfg.res;
    this.sunLight.castShadow = cfg.shadow;
    if (this.sunLight.shadow.mapSize.x !== cfg.map) {
      if (this.sunLight.shadow.map) { this.sunLight.shadow.map.dispose(); this.sunLight.shadow.map = null; }
      this.sunLight.shadow.mapSize.set(cfg.map, cfg.map);
    }
    this.updateViewportSize();
    setText(UI.gfxBtn, `GFX: ${preset.toUpperCase()}`);
    setText(UI.resLabel, `${Math.round(cfg.res * 100)}%`);
  }

  teleportToZone(zone) {
    const t = ZONE_T[zone] ?? 0;
    const pt = this.roadCurve.getPointAt(t);
    const tan = this.roadCurve.getTangentAt(t);
    const p = this.physics;
    p.pos.copy(pt);
    p.vel.set(0, 0, 0);
    p.heading = Math.atan2(tan.x, tan.z);
    p.angularVel = 0;
    p.steerAngle = 0;
    p.speedMps = 0;
    p.speedKmh = 0;
    p.rpm = 850;
    p.gear = 1;
    this.syncCarMesh();
  }

  zoneName(t) {
    if (t < 0.33) return 'DOWNTOWN CORE';
    if (t < 0.66) return 'MOUNTAIN HIGHWAY';
    return 'COASTAL ROUTE';
  }

  // --------------------------------------------------------------------------
  // MINIMAP
  // --------------------------------------------------------------------------
  buildMinimap() {
    if (!this.minimapCanvas) return;
    const w = this.minimapCanvas.width, h = this.minimapCanvas.height;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of this.roadSamples) {
      minX = Math.min(minX, s.pt.x); maxX = Math.max(maxX, s.pt.x);
      minZ = Math.min(minZ, s.pt.z); maxZ = Math.max(maxZ, s.pt.z);
    }
    this.mm = {
      w, h,
      scale: Math.min((w - 20) / (maxX - minX), (h - 20) / (maxZ - minZ)),
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2
    };
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const g = layer.getContext('2d');
    g.strokeStyle = 'rgba(200,215,235,0.75)';
    g.lineWidth = 3;
    g.lineJoin = 'round';
    g.beginPath();
    this.roadSamples.forEach((s, i) => {
      const [x, y] = this.mmPoint(s.pt.x, s.pt.z);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    });
    g.closePath();
    g.stroke();
    this.mm.layer = layer;
  }

  mmPoint(x, z) {
    const m = this.mm;
    return [(x - m.cx) * m.scale + m.w / 2, (z - m.cz) * m.scale + m.h / 2];
  }

  drawMinimap() {
    if (!this.minimapCtx || !this.mm) return;
    const g = this.minimapCtx;
    g.clearRect(0, 0, this.mm.w, this.mm.h);
    g.drawImage(this.mm.layer, 0, 0);
    g.fillStyle = '#ffb347';
    for (const tr of this.traffic) {
      const [x, y] = this.mmPoint(tr.mesh.position.x, tr.mesh.position.z);
      g.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    const [px, py] = this.mmPoint(this.physics.pos.x, this.physics.pos.z);
    g.save();
    g.translate(px, py);
    g.rotate(Math.PI - this.physics.heading);
    g.fillStyle = '#2ea0ff';
    g.beginPath();
    g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5);
    g.closePath();
    g.fill();
    g.restore();
  }

  // --------------------------------------------------------------------------
  // UI + CONTROLS
  // --------------------------------------------------------------------------
  startGame(skipIntro = false) {
    this.audio.init();
    this.state.started = true;
    this.state.introTimer = 0;
    this.state.mode = skipIntro ? 'DRIVING' : 'INTRO';
    show(UI.menu, false);
    show(UI.hud, true);
    show(UI.cont, true);
  }

  togglePause() {
    if (!this.state.started) return;
    if (this.state.mode === 'DRIVING') {
      this.state.mode = 'MENU';
      show(UI.menu, true);
    } else {
      this.state.mode = 'DRIVING';
      show(UI.menu, false);
    }
  }

  cycleCamera() {
    this.state.cameraIndex = (this.state.cameraIndex + 1) % 4;
  }

  bindUIAndControls() {
    // Buttons
    on(UI.start, 'click', () => {
      this.teleportToZone('city');
      this.startGame(false);
    });
    on(UI.cont, 'click', () => {
      this.audio.init();
      this.state.mode = 'DRIVING';
      show(UI.menu, false);
      show(UI.hud, true);
    });
    on(UI.skip, 'click', () => { this.state.mode = 'DRIVING'; });
    on(UI.pause, 'click', () => this.togglePause());
    on(UI.camBtn, 'click', () => this.cycleCamera());
    on(UI.lightsBtn, 'click', () => this.setHeadlights(!this.state.headlightsOn));
    on(UI.audioBtn, 'click', () => {
      this.audio.init();
      this.audio.enabled = !this.audio.enabled;
      setText(UI.audioBtn, this.audio.enabled ? 'AUDIO' : 'MUTED');
    });
    on(UI.gfxBtn, 'click', () => {
      const order = ['low', 'medium', 'high'];
      this.applyGraphicsPreset(order[(order.indexOf(this.state.preset) + 1) % 3]);
    });
    on(UI.glbLoad, 'click', () => { const el = $(UI.glbUrl); if (el) this.loadGLB(el.value.trim()); });

    // Menu options
    bindValue(UI.paint, (v) => this.setPaint(PAINTS[v] ?? PAINTS.black));
    bindValue(UI.time, (v) => { this.state.timeOfDay = v; this.applyEnvironmentState(); });
    bindValue(UI.weather, (v) => { this.state.weather = v; this.applyEnvironmentState(); });
    bindValue(UI.spawn, (v) => this.teleportToZone(v));
    bindValue(UI.preset, (v) => this.applyGraphicsPreset(v));
    bindValue(UI.res, (v) => {
      let r = parseFloat(v); if (r > 3) r /= 100;
      this.state.resScale = THREE.MathUtils.clamp(r || 1, 0.4, 1.5);
      this.updateViewportSize();
      setText(UI.resLabel, `${Math.round(this.state.resScale * 100)}%`);
    });
    bindValue(UI.fov, (v) => {
      this.state.fov = THREE.MathUtils.clamp(parseFloat(v) || 62, 40, 100);
      setText(UI.fovLabel, `${Math.round(this.state.fov)}°`);
    });
    bindValue(UI.steer, (v) => {
      this.state.steerSens = THREE.MathUtils.clamp(parseFloat(v) || 1, 0.4, 2);
      setText(UI.steerLabel, `${this.state.steerSens.toFixed(1)}x`);
    });
    bindValue(UI.assist, (v) => { this.state.assistMode = v; });
    bindValue(UI.audioMode, (v) => { this.audio.init(); this.audio.enabled = !(v === 'off' || v === 'muted'); });
    bindValue(UI.exhaust, (v) => { this.audio.sportExhaust = v === 'sport'; });
    bindValue(UI.volume, (v) => {
      let vol = parseFloat(v); if (vol > 1) vol /= 100;
      this.audio.masterVolume = THREE.MathUtils.clamp(vol || 0, 0, 1);
      setText(UI.volLabel, `${Math.round(this.audio.masterVolume * 100)}%`);
    });

    // Touch / on-screen hold buttons
    const hold = (id, key) => {
      const el = $(id);
      if (!el) return;
      const down = (e) => { e.preventDefault(); this.audio.init(); this.input[key] = true; };
      const up = (e) => { e.preventDefault(); this.input[key] = false; };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    hold(UI.left, 'left');
    hold(UI.right, 'right');
    hold(UI.throttle, 'throttle');
    hold(UI.brake, 'brake');
    hold(UI.pbrake, 'handbrake');

    // Keyboard
    const keyMap = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'throttle', KeyW: 'throttle', ArrowDown: 'brake', KeyS: 'brake', Space: 'handbrake'
    };
    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (keyMap[e.code]) {
        e.preventDefault();
        this.audio.init();
        this.input[keyMap[e.code]] = true;
      } else if (e.code === 'KeyC') this.cycleCamera();
      else if (e.code === 'KeyL') this.setHeadlights(!this.state.headlightsOn);
      else if (e.code === 'KeyM') { this.audio.enabled = !this.audio.enabled; }
      else if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
      else if (e.code === 'KeyR') this.resetToRoad();
    });
    window.addEventListener('keyup', (e) => {
      if (keyMap[e.code]) { e.preventDefault(); this.input[keyMap[e.code]] = false; }
    });
    window.addEventListener('blur', () => {
      Object.keys(this.input).forEach((k) => { this.input[k] = false; });
    });
  }

  resetToRoad() {
    const i = this.nearestSample(this.physics.pos);
    const s = this.roadSamples[i];
    this.physics.pos.copy(s.pt);
    this.physics.vel.set(0, 0, 0);
    this.physics.heading = Math.atan2(s.tangent.x, s.tangent.z);
    this.physics.angularVel = 0;
  }

  // --------------------------------------------------------------------------
  // PHYSICS
  // --------------------------------------------------------------------------
  nearestSample(pos) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.roadSamples.length; i++) {
      const s = this.roadSamples[i].pt;
      const dx = pos.x - s.x, dz = pos.z - s.z;
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  updatePhysics(dt) {
    const p = this.physics, inp = this.input;
    const sim = this.state.assistMode === 'sim';
    const W = WEATHER_PRESETS[this.state.weather];

    let f = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    let l = new THREE.Vector3(f.z, 0, -f.x);
    const vl0 = p.vel.dot(f);
    let vl = vl0;

    // Longitudinal
    this.throttleVal += ((inp.throttle ? 1 : 0) - this.throttleVal) * Math.min(1, dt * 6);
    let acc = 0;
    if (inp.throttle) acc += 11.5 * Math.max(0, 1 - vl / 80) * Math.min(1, W.grip + 0.15);
    if (inp.brake) {
      if (vl > 0.5) acc -= 15 * W.grip;
      else if (vl > -10) acc -= 5;
    }
    acc -= vl * 0.04 + Math.sign(vl) * 0.0011 * vl * vl;
    if (inp.handbrake && Math.abs(vl) > 0.3) acc -= Math.sign(vl) * 6;
    vl += acc * dt;
    if (!inp.throttle && !inp.brake && !inp.handbrake && Math.abs(vl) < 0.15) vl = 0;
    p.vel.addScaledVector(f, vl - vl0);
    this.longAccel = acc;

    // Steering / yaw
    const speedAbs = Math.abs(vl);
    const maxSteer = (0.58 / (1 + speedAbs * 0.05)) * this.state.steerSens;
    const target = ((inp.left ? 1 : 0) - (inp.right ? 1 : 0)) * maxSteer;
    p.steerAngle += (target - p.steerAngle) * Math.min(1, dt * (target === 0 ? 9 : 6));
    let yawRate = (vl * Math.tan(p.steerAngle)) / 2.85;
    yawRate = THREE.MathUtils.clamp(yawRate, sim ? -1.8 : -1.3, sim ? 1.8 : 1.3);
    if (inp.handbrake && speedAbs > 8) yawRate *= 1.5;
    p.angularVel += (yawRate - p.angularVel) * Math.min(1, dt * 8);
    p.heading += p.angularVel * dt;

    // Lateral grip
    f = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    l = new THREE.Vector3(f.z, 0, -f.x);
    let vlF = p.vel.dot(f);
    let vlat = p.vel.dot(l);
    let grip = (sim ? 5.5 : 9) * W.grip;
    if (inp.handbrake) grip = 1.1;
    grip = Math.max(grip, 12 * Math.max(0, 1 - p.vel.length() / 6));
    vlat *= Math.exp(-grip * dt);
    p.vel.copy(f).multiplyScalar(vlF).addScaledVector(l, vlat);
    p.slipRatio = Math.min(1, Math.abs(vlat) / 5.5);

    // Integrate
    p.pos.addScaledVector(p.vel, dt);

    // Road bounds (guardrails) + height
    const si = this.nearestSample(p.pos);
    const s = this.roadSamples[si];
    const relX = p.pos.x - s.pt.x, relZ = p.pos.z - s.pt.z;
    const lat = relX * s.right.x + relZ * s.right.z;
    const limit = this.halfRoad - 0.6;
    if (Math.abs(lat) > limit) {
      const side = Math.sign(lat);
      const over = lat - side * limit;
      p.pos.x -= s.right.x * over;
      p.pos.z -= s.right.z * over;
      const n = s.right.clone().multiplyScalar(side);
      const vn = p.vel.dot(n);
      if (vn > 0) {
        p.vel.addScaledVector(n, -vn * 1.6);
        p.vel.multiplyScalar(0.92);
      }
    }
    p.pos.y = s.pt.y;

    // Traffic collisions
    for (const tr of this.traffic) {
      const dx = p.pos.x - tr.mesh.position.x, dz = p.pos.z - tr.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 3.1 && d > 0.001) {
        const nx = dx / d, nz = dz / d;
        p.pos.x += nx * (3.1 - d);
        p.pos.z += nz * (3.1 - d);
        p.vel.multiplyScalar(0.75);
        p.vel.x += nx * 2;
        p.vel.z += nz * 2;
      }
    }

    // Derived values
    vlF = p.vel.dot(f);
    p.speedMps = Math.abs(vlF);
    p.speedKmh = vlF * 3.6;
    const kmh = Math.abs(p.speedKmh);
    let g = 1;
    while (g < 6 && kmh > GEAR_MAX_KMH[g - 1]) g++;
    p.gear = g;
    const lo = g === 1 ? 0 : GEAR_MAX_KMH[g - 2];
    const frac = (kmh - lo) / (GEAR_MAX_KMH[g - 1] - lo);
    const rpmTarget = kmh < 2 ? 850 + this.throttleVal * 4800 : 850 + Math.min(1, 0.1 + 0.9 * frac) * 6350;
    p.rpm += (rpmTarget - p.rpm) * Math.min(1, dt * 9);
    p.rpm = THREE.MathUtils.clamp(p.rpm, 850, 7200);

    // Body motion
    const pitchT = THREE.MathUtils.clamp(-acc * 0.0035, -0.06, 0.06);
    const rollT = THREE.MathUtils.clamp(p.angularVel * vlF * 0.0018, -0.08, 0.08);
    p.pitch += (pitchT - p.pitch) * Math.min(1, dt * 5);
    p.roll += (rollT - p.roll) * Math.min(1, dt * 5);
    p.wheelRotation += (vlF * dt) / 0.34;
  }

  updateTraffic(dt) {
    for (const tr of this.traffic) {
      tr.t = (tr.t + (tr.dir * tr.speed * dt) / this.roadLength + 1) % 1;
      const pt = this.roadCurve.getPointAt(tr.t);
      const tan = this.roadCurve.getTangentAt(tr.t);
      const rx = -tan.z, rz = tan.x;
      tr.mesh.position.set(pt.x + rx * tr.laneOffset, pt.y, pt.z + rz * tr.laneOffset);
      tr.mesh.rotation.y = Math.atan2(tan.x * tr.dir, tan.z * tr.dir);
    }
  }

  syncCarMesh() {
    const p = this.physics;
    const root = this.carRig.root;
    root.position.copy(p.pos);
    root.rotation.set(p.pitch, p.heading, p.roll);
    if (Array.isArray(this.carRig.wheels)) {
      this.carRig.wheels.forEach((w) => { w.rotation.x = p.wheelRotation; });
    }
    if (Array.isArray(this.carRig.frontWheelPivots)) {
      this.carRig.frontWheelPivots.forEach((w) => { w.rotation.y = p.steerAngle; });
    }
    if (typeof this.carRig.setBrakeLights === 'function') this.carRig.setBrakeLights(this.input.brake);
  }

  // --------------------------------------------------------------------------
  // CAMERA
  // --------------------------------------------------------------------------
  updateCamera(dt) {
    const p = this.physics;
    const f = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    const l = new THREE.Vector3(f.z, 0, -f.x);
    let fov = this.state.fov;

    if (this.state.mode !== 'DRIVING') {
      // Showcase / intro orbit
      const intro = this.state.mode === 'INTRO';
      this.orbitAngle += dt * (intro ? 0.55 : 0.25);
      const k = intro ? Math.min(1, this.state.introTimer / 6) : 0;
      const r = intro ? 9 + k * 1 : 7.5;
      const a = intro ? p.heading + Math.PI * 0.9 + (1 - k) * 2.4 : this.orbitAngle;
      const wantPos = new THREE.Vector3(p.pos.x + Math.sin(a) * r, p.pos.y + 2.2 + (intro ? k * 1 : 0), p.pos.z + Math.cos(a) * r);
      this.camPos.copy(wantPos);
      this.camLook.copy(p.pos).add(new THREE.Vector3(0, 0.9, 0));
    } else {
      const idx = this.state.cameraIndex;
      let wantPos, wantLook;
      if (idx === 0 || idx === 1) {
        const back = idx === 0 ? 8.2 : 5.6;
        const up = idx === 0 ? 3.2 : 2.0;
        wantPos = p.pos.clone().addScaledVector(f, -back).add(new THREE.Vector3(0, up, 0));
        wantLook = p.pos.clone().addScaledVector(f, 4).add(new THREE.Vector3(0, 1.1, 0));
        const k = 1 - Math.exp(-dt * 6);
        this.camPos.lerp(wantPos, k);
        this.camLook.lerp(wantLook, k);
        fov += Math.min(18, Math.abs(p.speedKmh) * 0.06);
      } else {
        const off = idx === 2
          ? p.pos.clone().addScaledVector(f, 1.1).add(new THREE.Vector3(0, 1.18, 0))
          : p.pos.clone().addScaledVector(f, 0.05).addScaledVector(l, 0.36).add(new THREE.Vector3(0, 1.2, 0));
        this.camPos.copy(off);
        this.camLook.copy(off).addScaledVector(f, 20);
        // keep the look target following the car's pitch/roll very slightly
        this.camLook.y += p.pitch * -8;
      }
    }

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  // --------------------------------------------------------------------------
  // HUD
  // --------------------------------------------------------------------------
  updateHUD() {
    const p = this.physics;
    setText(UI.speed, String(Math.round(Math.abs(p.speedKmh))));
    setText(UI.rpm, String(Math.round(p.rpm / 10) * 10));
    const gear = p.speedKmh < -1 ? 'R' : Math.abs(p.speedKmh) < 1 && !this.input.throttle ? 'N' : String(p.gear);
    setText(UI.gear, gear);
    setText(UI.fps, `${this.fps} FPS`);
    setText(UI.cam, `CAM: ${['CHASE', 'CLOSE', 'HOOD', 'COCKPIT'][this.state.cameraIndex]}`);
    const si = this.nearestSample(p.pos);
    setText(UI.zone, this.zoneName(this.roadSamples[si].t));
  }

  // --------------------------------------------------------------------------
  // MAIN LOOP
  // --------------------------------------------------------------------------
  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    if (this.state.mode === 'INTRO') {
      this.state.introTimer += dt;
      if (this.state.introTimer > 6) this.state.mode = 'DRIVING';
    }

    if (this.state.mode === 'DRIVING') this.updatePhysics(dt);
    else this.physics.vel.multiplyScalar(Math.max(0, 1 - dt * 3));

    this.updateTraffic(dt);
    this.syncCarMesh();
    this.updateParticles(dt);
    this.updateCamera(dt);

    // Keep the sun's shadow box centred on the car
    this.sunLight.target.position.copy(this.physics.pos);
    this.sunLight.position.copy(this.physics.pos).add(this.sunOffset);

    const p = this.physics;
    this.audio.update(p.rpm, this.throttleVal, p.slipRatio, Math.abs(p.speedKmh));
    this.updateHUD();
    this.drawMinimap();

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// 5. BOOT
// ============================================================================
function boot() {
  try {
    window.__game = new UltimateDriveSimulator();
  } catch (err) {
    console.error('Failed to start simulator:', err);
    show(UI.glError, true);
    setText(UI.glErrorMsg, 'Failed to start: ' + (err && err.message ? err.message : err));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

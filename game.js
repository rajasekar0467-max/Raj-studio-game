import * as THREE from 'three';
import './hud-upgrade.css';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildProceduralBMW, loadExternalGLBVehicle } from './carBuilder.js';

// ============================================================================
// 0. UI ELEMENT IDS - edit these so they match the ids in your index.html.
//    Any id that does not exist is simply skipped (nothing will crash).
// ============================================================================
const UI = {
  loading: 'loading-screen', progress: 'progress-fill',
  glError: 'webgl-error', glErrorMsg: 'webgl-error-msg',
  menu: 'main-menu', hud: 'driving-hud', barTop: 'cinematic-bar-top', barBottom: 'cinematic-bar-bottom',
  start: 'btn-start-drive', cont: 'btn-continue-drive', skip: 'btn-skip-intro',
  pause: 'btn-hud-pause', camBtn: 'btn-hud-camera', lightsBtn: 'btn-hud-lights',
  audioBtn: 'btn-hud-sound', gfxBtn: 'btn-hud-gfx',
  glbUrl: 'input-glb-url', glbLoad: 'btn-load-glb',
  res: 'slider-res', fov: 'slider-fov', steer: 'slider-sens', volume: 'slider-vol',
  resLabel: 'lbl-res-scale', fovLabel: 'lbl-fov', steerLabel: 'lbl-sens', volLabel: 'lbl-vol',
  speed: 'hud-speed', rpm: 'hud-rpm', gear: 'hud-gear', fps: 'hud-fps', rpmBar: 'rpm-bar-fill',
  zone: 'zone-label', info: 'hud-env-badge', menuInfo: 'menu-env-summary',
  left: 'touch-left', right: 'touch-right', throttle: 'touch-throttle',
  brake: 'touch-brake', pbrake: 'touch-handbrake'
};

// Asset URLs go through Vite's BASE_URL so they work on Netlify (root) and GitHub Pages (sub-path)
const ASSET = (p) => `${import.meta.env.BASE_URL}assets/${p}`;
const LANE_TILE_M = 60;   // one lane-marking tile = 5 dashes = ~60 m of road

const _els = new Map();
const $ = (id) => {
  let e = _els.get(id);
  if (e === undefined) { e = document.getElementById(id); _els.set(id, e); }
  return e;
};
const _txt = new Map();
const on = (id, ev, fn, opts) => { const el = $(id); if (el) el.addEventListener(ev, fn, opts); };
const setText = (id, t) => {
  if (_txt.get(id) === t) return;
  const el = $(id);
  if (el) { el.textContent = t; _txt.set(id, t); }
};
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
    this.lastPop = 0;
    this.shiftUntil = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = (this.ctx = new AudioCtx());

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.masterVolume * 0.28;
      this.masterGain.connect(ctx.destination);

      // Inline-6 style engine: saw + triangle fundamentals + square octave for bite
      this.engineGain = ctx.createGain();
      this.engineFilter = ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 380;
      this.osc1 = ctx.createOscillator();
      this.osc2 = ctx.createOscillator();
      this.osc3 = ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';
      this.osc3.type = 'square';
      const osc3Gain = ctx.createGain();
      osc3Gain.gain.value = 0.1;
      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.osc3.connect(osc3Gain);
      osc3Gain.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.osc1.start();
      this.osc2.start();
      this.osc3.start();

      // Turbo whistle
      this.turboOsc = ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboGain = ctx.createGain();
      this.turboGain.gain.value = 0;
      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();

      // Shared noise buffer -> tire, wind, brake squeal, exhaust crackle
      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
      const mkNoise = (type, freq, q) => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(f);
        f.connect(g);
        g.connect(this.masterGain);
        src.start();
        return { f, g };
      };
      this.skid = mkNoise('bandpass', 1150, 3.5);
      this.wind = mkNoise('bandpass', 650, 0.5);
      this.brakeN = mkNoise('bandpass', 2800, 7);
      this.pop = mkNoise('bandpass', 170, 1.1);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API unavailable:', e);
    }
  }

  popBurst(now) {
    const g = this.pop.g.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0.45 + Math.random() * 0.4, now);
    g.exponentialRampToValueAtTime(0.0001, now + 0.07);
    this.lastPop = now;
  }

  // Called on every gear change: brief torque cut + exhaust pop on hard upshifts
  shift(up, throttle) {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.shiftUntil = now + 0.14;
    if (this.sportExhaust && up && throttle > 0.4) this.popBurst(now);
  }

  update(rpm, throttle, slipAmount, speedKmh, brake = 0) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended' && this.enabled) this.ctx.resume();
    const now = this.ctx.currentTime;
    if (!this.enabled) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }
    this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.26, now, 0.05);

    const dip = now < this.shiftUntil ? 0.35 : 1;
    const baseFreq = Math.max(28, (rpm / 60) * 1.5);
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
    this.osc3.frequency.setTargetAtTime(baseFreq * 2, now, 0.03);

    const exhaustMult = this.sportExhaust ? 1.55 : 0.9;
    const cutoff = 220 + (rpm / 7200) * 1400 * exhaustMult + throttle * 350;
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.04);
    this.engineGain.gain.setTargetAtTime((0.4 + throttle * 0.45) * dip, now, 0.03);

    // Turbo spool whistle under load
    const turbo = throttle > 0.5 && rpm > 2500 ? 0.012 + 0.03 * (rpm / 7200) : 0;
    this.turboOsc.frequency.setTargetAtTime(1800 + (rpm / 7200) * 3200, now, 0.08);
    this.turboGain.gain.setTargetAtTime(turbo, now, 0.12);

    // Wind + road noise rise with speed
    const w = Math.min(0.22, Math.pow(speedKmh / 200, 1.5) * 0.25);
    this.wind.g.gain.setTargetAtTime(w, now, 0.2);
    this.wind.f.frequency.setTargetAtTime(400 + speedKmh * 4, now, 0.2);

    // Brake squeal when braking hard from speed
    const bq = brake && speedKmh > 25 ? Math.min(0.1, (speedKmh - 25) / 450) : 0;
    this.brakeN.g.gain.setTargetAtTime(bq, now, 0.08);

    // Tire squeal when drifting or cornering hard
    const squeal = speedKmh > 18 && slipAmount > 0.22 ? Math.min(0.65, (slipAmount - 0.22) * 1.2) : 0;
    this.skid.g.gain.setTargetAtTime(squeal, now, 0.05);

    // Overrun crackle on throttle lift (sport exhaust)
    if (this.sportExhaust && throttle < 0.05 && rpm > 3800 && speedKmh > 10 &&
        now - this.lastPop > 0.09 && Math.random() < 0.18) {
      this.popBurst(now);
    }
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
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  return tex;
}

function createFacade() {
  const W = 256, H = 512;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const mapC = mk(), emC = mk();
  const rects = [];
  for (let r = 8; r < 500; r += 20) {
    for (let c = 8; c < 248; c += 24) {
      rects.push({ x: c, y: r, lit: Math.random() > 0.42, col: Math.random() > 0.35 ? '#ffe4b5' : '#9be2ff' });
    }
  }
  const mkTex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const map = mkTex(mapC), emissive = mkTex(emC);
  const draw = (concreteImg) => {
    const g = mapC.getContext('2d');
    g.fillStyle = '#0e131a';
    g.fillRect(0, 0, W, H);
    if (concreteImg) { g.globalAlpha = 0.4; g.drawImage(concreteImg, 0, 0, W, H); g.globalAlpha = 1; }
    const e = emC.getContext('2d');
    e.fillStyle = '#000';
    e.fillRect(0, 0, W, H);
    for (const w of rects) {
      g.fillStyle = w.lit ? '#33455a' : '#161e29';   // reflective glass by day
      g.fillRect(w.x, w.y, 16, 12);
      if (w.lit) { e.fillStyle = w.col; e.fillRect(w.x, w.y, 16, 12); }   // lit windows glow at night
    }
    map.needsUpdate = true;
    emissive.needsUpdate = true;
  };
  draw(null);
  return { map, emissive, draw };
}

function createPlainAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1c1f24';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3500; i++) {
    const sh = 22 + Math.floor(Math.random() * 24);
    g.fillStyle = `rgb(${sh},${sh},${sh + 2})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  tex.anisotropy = 4;
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
  morning: { sky: 0x9fc3dd, sun: 0xfff0d8, sunI: 2.8, sunPos: [-90, 90, 70], hemi: 0.9, exp: 1.0, win: 0.0, env: 1.0, fog: 0.0018, label: 'MORNING', menu: 'MORNING' },
  sunset:  { sky: 0x7a4f52, sun: 0xffb870, sunI: 2.6, sunPos: [120, 45, 80], hemi: 0.65, exp: 1.05, win: 0.35, env: 0.8, fog: 0.0022, label: 'SUNSET', menu: 'GOLDEN HOUR' },
  night:   { sky: 0x05070d, sun: 0x6f8cff, sunI: 0.35, sunPos: [-60, 80, -40], hemi: 0.22, exp: 1.25, win: 1.0, env: 0.25, fog: 0.0026, label: 'NIGHT', menu: 'NIGHT CITY' }
};
const WEATHER_PRESETS = {
  clear:      { dark: 1.0, fogMul: 1.0, rain: 0, rough: 0.9, metal: 0.04, grip: 1.0, label: 'CLEAR' },
  light_rain: { dark: 0.75, fogMul: 1.8, rain: 0.5, rough: 0.45, metal: 0.2, grip: 0.8, label: 'LIGHT RAIN' },
  heavy_rain: { dark: 0.5, fogMul: 3.2, rain: 1.0, rough: 0.28, metal: 0.3, grip: 0.65, label: 'STORM' }
};
const ZONE_T = { city: 0.08, highway: 0.47, coast: 0.83 };
const GEAR_MAX_KMH = [55, 95, 140, 190, 240, 300];

const IS_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);

// Cross streets on the downtown straight (x = 0)
const JUNCTION_Z = [-50, 100];
const nearJunction = (pt, r) => JUNCTION_Z.some((jz) => Math.abs(pt.z - jz) < r && Math.abs(pt.x) < 15);

// Sky gradients per time of day (zenith / horizon / sun glow strength)
const SKY = {
  morning: { top: 0x3f7fcf, hor: 0xbfd9ee, glow: 1.0, mix: 0.7, tint: [1.5, 1.55, 1.6] },
  sunset:  { top: 0x27345f, hor: 0xff9a5c, glow: 1.4, mix: 0.5, tint: [1.0, 0.95, 0.9] },
  night:   { top: 0x01030a, hor: 0x0a1322, glow: 0.25, mix: 0.0, tint: [0.1, 0.12, 0.2] }
};

// Graphics presets: dpr = pixel-ratio cap, every = shadow update interval (frames)
const PRESETS = {
  low:    { dpr: 1.0,  res: 0.85, shadow: false, map: 512,  every: 0, spots: false,   tail: false, trees: 0.3, traffic: 5,  rain: 0.4, glass: false, coat: false },
  medium: { dpr: 1.25, res: 1.0,  shadow: true,  map: 1024, every: 2, spots: 'night', tail: false, trees: 0.7, traffic: 8,  rain: 0.7, glass: false, coat: true },
  high:   { dpr: 1.75, res: 1.0,  shadow: true,  map: 2048, every: 1, spots: true,    tail: true,  trees: 1,   traffic: 10, rain: 1,   glass: false, coat: true },
  ultra:  { dpr: 2.0,  res: 1.0,  shadow: true,  map: 2048, every: 1, spots: true,    tail: true,  trees: 1,   traffic: 10, rain: 1,   glass: true,  coat: true }
};
const PRESET_ORDER = ['low', 'medium', 'high', 'ultra'];
const ENV_NUM = ['sunI', 'sunPow', 'hemi', 'exp', 'win', 'envI', 'fog', 'rough', 'metal', 'skyMix'];
const cloneEnv = (e) => ({
  top: e.top.clone(), hor: e.hor.clone(), sun: e.sun.clone(), sunPos: e.sunPos.clone(), tint: e.tint.clone(),
  sunI: e.sunI, sunPow: e.sunPow, hemi: e.hemi, exp: e.exp, win: e.win, envI: e.envI,
  fog: e.fog, rough: e.rough, metal: e.metal, skyMix: e.skyMix
});

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
      preset: IS_MOBILE ? 'medium' : 'high',
      resScale: 1.0,
      fov: 62,
      steerSens: 1.0,
      assistMode: 'sim',
      cameraIndex: 0, // 0: Chase, 1: Close Chase, 2: Hood, 3: Cockpit
      headlightsOn: true,
      introTimer: 0,
      started: false,
      spawn: 'city'
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
      wheelRotation: 0,
      heave: 0,
      heaveVel: 0,
      slope: 0
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
    this.frame = 0;
    this.hudAcc = 0;
    this.dynScale = 1;
    this.autoQuality = true;
    this.adaptT = 0;
    this.goodT = 0;
    this.prevGear = 1;
    this.lastIdx = 0;
    this.lastHaptic = 0;
    this.envBlend = false;
    this.envTimer = 0;
    this.camInit = false;
    this.camKey = '';
    this.camBlend = 1;
    this.camFromPos = new THREE.Vector3();
    this.camFromLook = new THREE.Vector3();
    this.camSmPos = new THREE.Vector3();
    this.camSmLook = new THREE.Vector3();
    this.fovCur = 62;
    this.dialVal = 0;
    this.loadDone = false;
    this.assets = {};
    this.baseHemi = 0.65;
    this.sunOffset = new THREE.Vector3(120, 95, 80);
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();

    this.initWebGL();
    this.buildSky();
    this.buildWorld();
    this.buildVehicle();
    this.buildWeatherAndParticles();
    this.buildMinimap();
    this.bindUIAndControls();
    this.applyEnvironmentState(true);
    this.applyGraphicsPreset(this.state.preset);
    this.refreshEnvMap();

    // Spawn initially in Downtown City
    this.teleportToZone('city');

    // Load the texture pack (every asset has a procedural fallback); loading screen hides when done
    this.loadAssets();

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
        antialias: !IS_MOBILE,
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

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
    const pmremGenerator = (this.pmrem = new THREE.PMREMGenerator(this.renderer));
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
    const cap = this.cfg ? this.cfg.dpr : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, cap) * this.state.resScale * this.dynScale;
    this.renderer.setPixelRatio(Math.max(0.5, dpr));
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
    this.laneTiles = Math.max(1, Math.round(this.roadLength / LANE_TILE_M));
    this.roadSamples = [];
    const sampleCount = 500;

    const roadPositions = [];
    const roadUVs = [];
    const roadIndices = [];
    const barrierPositions = [];
    const barrierIndices = [];
    const barrierUVs = [];

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
      const dv = t * this.laneTiles;
      roadUVs.push(0, dv, 1, dv);

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
      const bd = (t * this.roadLength) / 4;
      barrierUVs.push(0, bd, 0.3, bd, 0, bd, 0.3, bd);

      if (i < sampleCount) {
        const rIdx = i * 2;
        roadIndices.push(rIdx, rIdx + 1, rIdx + 2, rIdx + 1, rIdx + 3, rIdx + 2);

        if (!nearJunction(pt, 6.5)) {
          const bIdx = i * 4;
          barrierIndices.push(bIdx, bIdx + 1, bIdx + 4, bIdx + 1, bIdx + 5, bIdx + 4);
          barrierIndices.push(bIdx + 2, bIdx + 6, bIdx + 3, bIdx + 3, bIdx + 6, bIdx + 7);
        }
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

    // Lane markings: a transparent overlay that SHARES the road geometry (no extra vertex memory).
    // Lifted 1 cm + polygon offset so it never z-fights; hidden until the asphalt asset has loaded.
    this.laneCanvas = document.createElement('canvas');
    this.laneCanvas.width = this.laneCanvas.height = 512;
    this.laneTex = new THREE.CanvasTexture(this.laneCanvas);
    this.laneTex.colorSpace = THREE.SRGBColorSpace;
    this.laneTex.wrapS = THREE.ClampToEdgeWrapping;
    this.laneTex.wrapT = THREE.RepeatWrapping;
    this.laneTex.anisotropy = 4;
    this.drawLaneOverlay(null);
    const laneMat = new THREE.MeshStandardMaterial({
      map: this.laneTex, transparent: true, depthWrite: false, roughness: 0.7, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    this.laneMesh = new THREE.Mesh(roadGeo, laneMat);
    this.laneMesh.position.y = 0.01;
    this.laneMesh.receiveShadow = true;
    this.laneMesh.renderOrder = 1;
    this.laneMesh.visible = false;
    this.scene.add(this.laneMesh);

    const barrierGeo = new THREE.BufferGeometry();
    barrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(barrierPositions, 3));
    barrierGeo.setAttribute('uv', new THREE.Float32BufferAttribute(barrierUVs, 2));
    barrierGeo.setIndex(barrierIndices);
    barrierGeo.computeVertexNormals();
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x3a404a, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide
    });
    this.barrierMat = barrierMat;
    this.scene.add(new THREE.Mesh(barrierGeo, barrierMat));

    // Base Ground
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x131915, roughness: 0.92 });
    this.groundMat = groundMat;
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
      map: (this.facade = createFacade()).map,
      roughness: 0.3,
      metalness: 0.65,
      emissive: 0xffffff,
      emissiveIntensity: 0
    });
    this.bldgMat.emissiveMap = this.facade.emissive;

    const buildingCount = 95;
    const instancedBldgs = new THREE.InstancedMesh(bldgGeo, this.bldgMat, buildingCount);
    instancedBldgs.castShadow = true;
    instancedBldgs.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let z = -150; z <= 220; z += 26) {
      if (JUNCTION_Z.some((j) => Math.abs(z - j) < 28)) continue;
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
    this.mountainMat = mountainMat;
    [[480, 45, 220], [520, 52, 40], [490, 40, -140], [340, 35, 360]].forEach(([mx, my, mz]) => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(mx, my, mz);
      this.scene.add(m);
    });

    // Highway Tunnel Arch (axis along the road, arch on top)
    const tunnelGeo = new THREE.CylinderGeometry(12.5, 12.5, 55, 16, 1, true, Math.PI / 2, Math.PI);
    tunnelGeo.rotateX(Math.PI / 2);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x22262c, side: THREE.DoubleSide, roughness: 0.7 });
    this.tunnelMat = tunnelMat;
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

    this.buildScenery();
    // Static geometry never moves: skip per-frame matrix updates
    this.scene.traverse((o) => {
      if (o.isMesh && !o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; }
    });

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
    this.setHeadlights(this.state.headlightsOn);
  }

  setHeadlights(on_) {
    this.state.headlightsOn = on_;
    const hb = $(UI.lightsBtn);
    if (hb) hb.classList.toggle('active', on_);
    const r = this.carRig;
    if (!r) return;
    if (r.lights) {
      const allowed = this.spotsAllowed();
      r.lights.headSpotL.visible = r.lights.headSpotR.visible = allowed;
      r.lights.headSpotL.intensity = on_ ? 28 : 0;
      r.lights.headSpotR.intensity = on_ ? 28 : 0;
    }
    if (r.materials && r.materials.headlightMat) r.materials.headlightMat.emissiveIntensity = on_ ? 3.5 : 0.4;
  }

  setPaint(hex) {
    const m = this.carRig.materials && this.carRig.materials.bodyPaintMat;
    if (m) m.color.set(hex);
  }

  loadGLB(url) {
    if (!url) return;
    const b = $(UI.glbLoad);
    loadExternalGLBVehicle(url, this.carRig, (msg) => {
      console.log(msg);
      if (!b) return;
      b.textContent = /fail/i.test(msg) ? 'Failed' : /success/i.test(msg) ? 'Loaded' : 'Loading...';
      setTimeout(() => { b.textContent = 'Load GLB'; }, 2500);
    });
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
      for (let i = 0; i < this.rainActive; i++) {
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
    if (this.state.weather === 'heavy_rain' && Math.random() < 0.004) this.flash = 1;
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
  applyEnvironmentState(snap = false) {
    const T = TIME_PRESETS[this.state.timeOfDay] || TIME_PRESETS.sunset;
    const W = WEATHER_PRESETS[this.state.weather] || WEATHER_PRESETS.clear;
    const SK = SKY[this.state.timeOfDay] || SKY.sunset;
    const e = this.envT || (this.envT = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), sunPos: new THREE.Vector3(), tint: new THREE.Color() });
    e.top.setHex(SK.top).multiplyScalar(W.dark);
    e.hor.setHex(SK.hor).multiplyScalar(W.dark);
    e.sun.setHex(T.sun);
    e.sunPos.set(T.sunPos[0], T.sunPos[1], T.sunPos[2]);
    e.sunI = T.sunI * W.dark;
    e.sunPow = SK.glow * W.dark * (W.rain > 0 ? 0.35 : 1);
    e.hemi = T.hemi * (0.6 + 0.4 * W.dark);
    e.exp = T.exp;
    e.win = T.win;
    e.envI = T.env * W.dark;
    e.fog = T.fog * W.fogMul;
    e.rough = W.rough;
    e.metal = W.metal;
    e.skyMix = this.skyTexReady ? SK.mix : 0;
    e.tint.setRGB(SK.tint[0], SK.tint[1], SK.tint[2]).multiplyScalar(W.dark);

    if (!this.envC || snap) {
      this.envC = cloneEnv(e);
      this.envBlend = false;
      this.applyEnvC();
    } else {
      this.envBlend = true; // fade smoothly to the new look
      this.envTimer = 2.5;
    }

    this.rain.visible = W.rain > 0;
    this.rain.material.opacity = 0.25 + W.rain * 0.35;
    this.applyRainRange();

    if (this.state.timeOfDay === 'night' || this.state.weather === 'heavy_rain') this.setHeadlights(true);
    else this.setHeadlights(this.state.headlightsOn);
    this.updateSummary();
  }

  updateSummary() {
    const T = TIME_PRESETS[this.state.timeOfDay] || TIME_PRESETS.sunset;
    const W = WEATHER_PRESETS[this.state.weather] || WEATHER_PRESETS.clear;
    setText(UI.info, `${T.label} | ${W.label}`);
    setText(UI.menuInfo, `${T.menu} | ${W.label} | ${this.state.preset.toUpperCase()} PRESET`);
  }

  syncChips(selector, attr, value) {
    document.querySelectorAll(selector).forEach((b) => b.classList.toggle('active', b.dataset[attr] === value));
  }

  applyGraphicsPreset(preset) {
    const CFG = PRESETS[preset] || PRESETS.high;
    preset = PRESETS[preset] ? preset : 'high';
    this.cfg = CFG;
    this.state.preset = preset;
    this.state.resScale = CFG.res;
    this.dynScale = 1;
    this.adaptT = 0;
    this.goodT = 0;

    // Car materials: glass transmission (Ultra only) and clearcoat (not on Low)
    this.carRig.root.traverse((o) => {
      const m = o.isMesh ? o.material : null;
      if (!m || !m.isMeshPhysicalMaterial) return;
      if (m.userData.t0 === undefined) { m.userData.t0 = m.transmission; m.userData.cc0 = m.clearcoat; }
      const t = CFG.glass ? m.userData.t0 : 0;
      const cc = CFG.coat ? m.userData.cc0 : 0;
      if (m.transmission !== t || m.clearcoat !== cc) { m.transmission = t; m.clearcoat = cc; m.needsUpdate = true; }
    });

    // Shadows
    this.sunLight.castShadow = CFG.shadow;
    if (this.sunLight.shadow.mapSize.x !== CFG.map) {
      if (this.sunLight.shadow.map) { this.sunLight.shadow.map.dispose(); this.sunLight.shadow.map = null; }
      this.sunLight.shadow.mapSize.set(CFG.map, CFG.map);
    }
    this.renderer.shadowMap.needsUpdate = true;

    // Detail density
    this.traffic.forEach((t, i) => { t.mesh.visible = i < CFG.traffic; });
    if (this.treeMeshes) {
      const n = Math.floor(this.treeTotal * CFG.trees);
      this.treeMeshes.forEach((m) => { m.count = n; });
    }
    if (this.carRig.lights) this.carRig.lights.tailPointLight.visible = CFG.tail;
    this.setHeadlights(this.state.headlightsOn);
    this.applyRainRange();

    this.updateViewportSize();
    setText(UI.gfxBtn, `GFX: ${preset.toUpperCase()}`);
    setText(UI.resLabel, `${Math.round(CFG.res * 100)}%`);
    const sl = $(UI.res);
    if (sl) sl.value = String(CFG.res);
    this.syncChips('#preset-select .chip-btn', 'preset', preset);
    this.updateSummary();
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
    for (const j of this.junctions || []) {
      const [x1, y1] = this.mmPoint(j.x - 28, j.z);
      const [x2, y2] = this.mmPoint(j.x + 28, j.z);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
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
      if (!tr.mesh.visible) continue;
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
    show(UI.menu, false);
    show(UI.cont, true);
    if (skipIntro) {
      this.endIntro();
    } else {
      this.state.mode = 'INTRO';
      show(UI.barTop, true);
      show(UI.barBottom, true);
      show(UI.hud, false);
    }
  }

  endIntro() {
    this.state.mode = 'DRIVING';
    show(UI.barTop, false);
    show(UI.barBottom, false);
    show(UI.menu, false);
    show(UI.hud, true);
  }

  togglePause() {
    if (this.state.mode === 'DRIVING') {
      this.state.mode = 'MENU';
      show(UI.menu, true);
      show(UI.hud, false);
    } else if (this.state.mode === 'MENU' && this.state.started) {
      this.state.mode = 'DRIVING';
      show(UI.menu, false);
      show(UI.hud, true);
    }
  }

  cycleCamera() {
    this.state.cameraIndex = (this.state.cameraIndex + 1) % 4;
  }

  setAudioEnabled(v) {
    this.audio.init();
    this.audio.enabled = v;
    const b = $(UI.audioBtn);
    if (b) b.classList.toggle('active', v);
    this.syncChips('#audio-toggle-group .chip-btn', 'audio', v ? 'on' : 'off');
  }

  bindChips(selector, attr, fn) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.parentElement.querySelectorAll('.chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
        fn(btn.dataset[attr]);
      });
    });
  }

  bindUIAndControls() {
    // Add the ULTRA preset chip (index.html only ships Low/Medium/High)
    const pg = $('preset-select');
    if (pg && !pg.querySelector('[data-preset="ultra"]')) {
      const b = document.createElement('button');
      b.className = 'chip-btn';
      b.dataset.preset = 'ultra';
      b.textContent = 'ULTRA (Max)';
      pg.appendChild(b);
    }
    this.setupPaintChips();
    this.buildDial();
    window.addEventListener('orientationchange', () => setTimeout(() => this.updateViewportSize(), 250));
    window.addEventListener('pagehide', () => this.dispose());
    this.canvas.addEventListener('webglcontextrestored', () => show(UI.glError, false));
    // Mobile: no tap flash / pull-to-refresh; pause when the tab is hidden; keep screen awake
    const st = document.createElement('style');
    st.textContent = '*{-webkit-tap-highlight-color:transparent}html,body{overscroll-behavior:none}.touch-btn{touch-action:none}';
    document.head.appendChild(st);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.mode === 'DRIVING') this.togglePause();
    });
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ }

    // Menu tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((o) => o.classList.toggle('active', o === t));
      document.querySelectorAll('.menu-panel').forEach((p) => p.classList.toggle('hidden', p.id !== t.dataset.panel));
    }));
    if (tabs[0]) tabs[0].classList.add('active');

    // Main buttons
    on(UI.start, 'click', () => {
      this.teleportToZone(this.state.spawn);
      this.startGame(false);
    });
    on(UI.cont, 'click', () => {
      this.audio.init();
      this.state.mode = 'DRIVING';
      show(UI.menu, false);
      show(UI.hud, true);
    });
    on(UI.skip, 'click', () => { if (this.state.mode === 'INTRO') this.endIntro(); });
    on(UI.pause, 'click', () => this.togglePause());
    on(UI.camBtn, 'click', () => this.cycleCamera());
    on(UI.lightsBtn, 'click', () => this.setHeadlights(!this.state.headlightsOn));
    on(UI.audioBtn, 'click', () => this.setAudioEnabled(!this.audio.enabled));
    on(UI.gfxBtn, 'click', () => {
      this.applyGraphicsPreset(PRESET_ORDER[(PRESET_ORDER.indexOf(this.state.preset) + 1) % PRESET_ORDER.length]);
    });
    on(UI.glbLoad, 'click', () => { const el = $(UI.glbUrl); if (el) this.loadGLB(el.value.trim()); });

    // Option chips (they use data-* attributes in index.html)
    this.bindChips('.chip-btn[data-paint]', 'paint', (v) => this.setPaint(v));
    this.bindChips('#time-select .chip-btn', 'time', (v) => { this.state.timeOfDay = v; this.applyEnvironmentState(); });
    this.bindChips('#weather-select .chip-btn', 'weather', (v) => { this.state.weather = v; this.applyEnvironmentState(); });
    this.bindChips('#spawn-select .chip-btn', 'spawn', (v) => { this.state.spawn = v; this.teleportToZone(v); });
    this.bindChips('#preset-select .chip-btn', 'preset', (v) => this.applyGraphicsPreset(v));
    this.bindChips('#assist-select .chip-btn', 'assist', (v) => { this.state.assistMode = v; });
    this.bindChips('#audio-toggle-group .chip-btn', 'audio', (v) => this.setAudioEnabled(v === 'on'));
    this.bindChips('#exhaust-select .chip-btn', 'exhaust', (v) => { this.audio.sportExhaust = v === 'sport'; });

    // Sliders
    bindValue(UI.res, (v) => {
      this.state.resScale = THREE.MathUtils.clamp(parseFloat(v) || 1, 0.4, 1.5);
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
    bindValue(UI.volume, (v) => {
      this.audio.masterVolume = THREE.MathUtils.clamp((parseFloat(v) || 0) / 100, 0, 1);
      setText(UI.volLabel, `${Math.round(this.audio.masterVolume * 100)}%`);
    });

    // Touch hold buttons
    const hold = (id, key) => {
      const el = $(id);
      if (!el) return;
      const down = (e) => { e.preventDefault(); this.audio.init(); this.input[key] = true; el.classList.add('pressed'); };
      const up = (e) => { e.preventDefault(); this.input[key] = false; el.classList.remove('pressed'); };
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
      else if (e.code === 'KeyM') this.setAudioEnabled(!this.audio.enabled);
      else if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
      else if (e.code === 'KeyR') this.resetToRoad();
    });
    window.addEventListener('keyup', (e) => {
      if (keyMap[e.code]) { e.preventDefault(); this.input[keyMap[e.code]] = false; }
    });
    window.addEventListener('blur', () => {
      Object.keys(this.input).forEach((k) => { this.input[k] = false; });
      document.querySelectorAll('.touch-btn.pressed').forEach((b) => b.classList.remove('pressed'));
    });
  }

  // --------------------------------------------------------------------------
  // SKY, REFLECTIONS, SCENERY
  // --------------------------------------------------------------------------
  buildSky() {
    this.skyUniforms = {
      top: { value: new THREE.Color(0x27345f) },
      horizon: { value: new THREE.Color(0xff9a5c) },
      ground: { value: new THREE.Color(0x0a0c10) },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color(0xffb870) },
      sunPow: { value: 1 },
      skyTex: { value: new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1) },
      skyMix: { value: 0 },
      skyTint: { value: new THREE.Color(1, 1, 1) }
    };
    this.skyUniforms.skyTex.value.needsUpdate = true;
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunPow;
        uniform sampler2D skyTex; uniform float skyMix; uniform vec3 skyTint;
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, ground, clamp(-h * 5.0, 0.0, 1.0));
          if (h > 0.0 && skyMix > 0.0) {
            vec3 tx = texture2D(skyTex, vec2(0.5 + 0.12 * d.x, 0.5 + asin(clamp(h, 0.0, 1.0)) / 3.14159265)).rgb * skyTint;
            c = mix(c, tx, skyMix * smoothstep(0.04, 0.55, h));
          }
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunColor * (pow(s, 600.0) * 6.0 + pow(s, 24.0) * 0.45 + pow(s, 4.0) * 0.12) * sunPow;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const geo = new THREE.SphereGeometry(900, 32, 16);
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -1000;
    this.sky.userData.dynamic = true;
    this.scene.add(this.sky);
    this.envScene = new THREE.Scene();
    this.envScene.add(new THREE.Mesh(geo, mat));
  }

  // Car/road reflections come from the live sky (regenerated only when the look changes)
  refreshEnvMap() {
    if (!this.pmrem || !this.envScene) return;
    const rt = this.pmrem.fromScene(this.envScene, 0.02, 0.1, 1000);
    if (this.envRT) this.envRT.dispose();
    this.envRT = rt;
    this.scene.environment = rt.texture;
  }

  applyEnvC() {
    const c = this.envC, u = this.skyUniforms;
    u.top.value.copy(c.top);
    u.horizon.value.copy(c.hor);
    u.sunColor.value.copy(c.sun);
    u.sunDir.value.copy(c.sunPos).normalize();
    u.sunPow.value = c.sunPow;
    u.skyMix.value = c.skyMix;
    u.skyTint.value.copy(c.tint);
    this.scene.background.copy(c.hor);
    this.scene.fog.color.copy(c.hor);
    this.scene.fog.density = c.fog;
    this.sunLight.color.copy(c.sun);
    this.sunLight.intensity = c.sunI;
    this.sunOffset.copy(c.sunPos);
    this.baseHemi = c.hemi;
    this.ambientLight.intensity = c.hemi;
    this.renderer.toneMappingExposure = c.exp;
    this.scene.environmentIntensity = c.envI;
    this.bldgMat.emissiveIntensity = c.win;
    this.roadMaterial.roughness = c.rough;
    this.roadMaterial.metalness = c.metal;
    if (this.junctionMat) { this.junctionMat.roughness = c.rough; this.junctionMat.metalness = c.metal; }
    if (this.lampMat) this.lampMat.color.setHex(0xffe2b0).multiplyScalar(0.25 + c.win * 1.6);
  }

  updateEnv(dt) {
    if (!this.envBlend) return;
    const c = this.envC, t = this.envT;
    this.envTimer -= dt;
    if (this.envTimer <= 0) {
      this.envC = cloneEnv(t);
      this.envBlend = false;
      this.applyEnvC();
      this.refreshEnvMap();
      return;
    }
    const k = 1 - Math.exp(-dt * 2.5);
    c.top.lerp(t.top, k);
    c.hor.lerp(t.hor, k);
    c.sun.lerp(t.sun, k);
    c.sunPos.lerp(t.sunPos, k);
    c.tint.lerp(t.tint, k);
    for (const n of ENV_NUM) c[n] += (t[n] - c[n]) * k;
    this.applyEnvC();
  }

  buildScenery() {
    const dummy = new THREE.Object3D();
    const R = Math.random;
    const S = this.roadSamples;

    // Sidewalks along both sides of the whole loop (skipped at junctions)
    const sp = [], si = [], suv = [];
    let vi = 0;
    for (let i = 0; i < S.length; i++) {
      const a = S[i], b = S[(i + 1) % S.length];
      if (nearJunction(a.pt, 7)) continue;
      for (const side of [-1, 1]) {
        const o0 = this.halfRoad + 0.8, o1 = this.halfRoad + 4.2;
        const p0 = a.pt.clone().addScaledVector(a.right, side * o0), p1 = a.pt.clone().addScaledVector(a.right, side * o1);
        const p2 = b.pt.clone().addScaledVector(b.right, side * o0), p3 = b.pt.clone().addScaledVector(b.right, side * o1);
        [p0, p1, p2, p3].forEach((q) => sp.push(q.x, q.y + 0.1, q.z));
        const da = (a.t * this.roadLength) / 4, db = da + a.pt.distanceTo(b.pt) / 4;
        suv.push(0, da, 0.85, da, 0, db, 0.85, db);
        si.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
        vi += 4;
      }
    }
    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    swGeo.setAttribute('uv', new THREE.Float32BufferAttribute(suv, 2));
    swGeo.setIndex(si);
    swGeo.computeVertexNormals();
    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.9, side: THREE.DoubleSide });
    const sw = new THREE.Mesh(swGeo, this.sidewalkMat);
    sw.receiveShadow = true;
    this.scene.add(sw);

    // Trees (2 instanced draw calls): sparse in the city, denser on highway/coast
    const maxTrees = 280;
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.16, 0.24, 2.4, 5).translate(0, 1.2, 0),
      new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 }), maxTrees);
    const crowns = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.7, 5.4, 6).translate(0, 4.9, 0),
      new THREE.MeshStandardMaterial({ color: 0x1f4a2a, roughness: 0.95 }), maxTrees);
    let n = 0;
    for (let i = 0; i < S.length && n < maxTrees; i += 3) {
      const s = S[i];
      if (nearJunction(s.pt, 12)) continue;
      const city = s.t < 0.3;
      for (const side of [-1, 1]) {
        if (n >= maxTrees || R() < (city ? 0.7 : 0.3)) continue;
        const off = city ? this.halfRoad + 2.6 : this.halfRoad + 5 + R() * 18;
        dummy.position.copy(s.pt).addScaledVector(s.right, side * off);
        dummy.position.y = s.pt.y;
        const sc = 0.8 + R() * 0.8;
        dummy.scale.setScalar(sc);
        dummy.rotation.set(0, R() * 6.28, 0);
        dummy.updateMatrix();
        trunks.setMatrixAt(n, dummy.matrix);
        crowns.setMatrixAt(n, dummy.matrix);
        n++;
      }
    }
    trunks.count = crowns.count = n;
    this.treeTotal = n;
    this.treeMeshes = [trunks, crowns];
    this.scene.add(trunks, crowns);

    // Glowing lamp heads on top of the streetlight poles (no real lights: cheap)
    const lampCount = 100;
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
    const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.14, 0.4), this.lampMat, lampCount);
    for (let i = 0; i < lampCount; i++) {
      const s = S[(i * 5) % S.length];
      const side = i % 2 === 0 ? 1 : -1;
      dummy.position.copy(s.pt).addScaledVector(s.right, side * (this.halfRoad + 1.1) - side * 0.6);
      dummy.position.y = s.pt.y + 7.5;
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, Math.atan2(s.tangent.x, s.tangent.z), 0);
      dummy.updateMatrix();
      lamps.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(lamps);

    // Intersections: cross streets with zebra crossings
    this.junctions = JUNCTION_Z.map((z) => ({ x: 0, z }));
    this.junctionMat = new THREE.MeshStandardMaterial({ map: createPlainAsphaltTexture(), roughness: 0.65, metalness: 0.15 });
    const stubGeo = (this.stubGeo = new THREE.BoxGeometry(56, 0.04, 11));
    const zebra = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.7, 0.03, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.7 }), JUNCTION_Z.length * 20);
    let zi = 0;
    for (const jz of JUNCTION_Z) {
      const stub = new THREE.Mesh(stubGeo, this.junctionMat);
      stub.position.set(0, 0.2, jz);
      stub.receiveShadow = true;
      this.scene.add(stub);
      for (const dz of [-8.5, 8.5]) {
        for (let k = 0; k < 10; k++) {
          dummy.position.set(-5.85 + k * 1.3, 0.23, jz + dz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          zebra.setMatrixAt(zi++, dummy.matrix);
        }
      }
    }
    zebra.receiveShadow = true;
    this.scene.add(zebra);
  }

  inJunction(pos) {
    for (const jz of JUNCTION_Z) if (Math.abs(pos.z - jz) < 5.2 && Math.abs(pos.x) < 28) return true;
    return false;
  }

  spotsAllowed() {
    const c = this.cfg;
    if (!c || c.spots === true) return true;
    if (c.spots === 'night') return this.state.timeOfDay === 'night' || this.state.weather === 'heavy_rain';
    return false;
  }

  applyRainRange() {
    const W = WEATHER_PRESETS[this.state.weather] || WEATHER_PRESETS.clear;
    this.rainActive = Math.floor(this.rainCount * W.rain * (this.cfg ? this.cfg.rain : 1));
    this.rain.geometry.setDrawRange(0, this.rainActive * 2);
  }

  // Automatic quality: lower the render resolution when FPS drops, raise it back
  // when there is headroom, and step the preset down if resolution alone is not enough.
  adaptQuality(fps) {
    if (!this.autoQuality || this.clock.elapsedTime < 4 || document.hidden) return;
    this.adaptT += 0.5;
    if (fps < 40 && this.adaptT >= 1.5) {
      this.adaptT = 0;
      this.goodT = 0;
      if (this.dynScale > 0.6) {
        this.dynScale = Math.max(0.55, this.dynScale - 0.1);
        this.updateViewportSize();
      } else if (fps < 30) {
        const i = PRESET_ORDER.indexOf(this.state.preset);
        if (i > 0) this.applyGraphicsPreset(PRESET_ORDER[i - 1]);
      }
    } else if (fps >= 57) {
      this.goodT += 0.5;
      if (this.goodT >= 6 && this.dynScale < 1) {
        this.goodT = 0;
        this.dynScale = Math.min(1, this.dynScale + 0.05);
        this.updateViewportSize();
      }
    } else {
      this.goodT = 0;
    }
  }

  haptic() {
    if (!IS_MOBILE || !navigator.vibrate) return;
    const now = performance.now();
    if (now - this.lastHaptic < 400) return;
    this.lastHaptic = now;
    navigator.vibrate(18);
  }

  pulseGear() {
    const el = $(UI.gear);
    if (el && el.animate) el.animate([{ transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  }

  // --------------------------------------------------------------------------
  // ASSET PACK (every asset has a procedural fallback; nothing blocks the game)
  // --------------------------------------------------------------------------
  loadAssets() {
    const mgr = new THREE.LoadingManager();
    mgr.onProgress = (url, done, total) => {
      const pf = $(UI.progress);
      if (pf) pf.style.width = `${Math.round((done / total) * 100)}%`;
    };
    mgr.onLoad = () => this.finishLoading();
    const loader = new THREE.TextureLoader(mgr);
    const aniso = Math.min(this.renderer.capabilities.getMaxAnisotropy(), IS_MOBILE ? 2 : 4);
    const load = (file, apply) => loader.load(
      ASSET(file),
      (t) => {
        t.anisotropy = aniso;
        t.colorSpace = THREE.SRGBColorSpace;
        try { apply(t); } catch (e) { console.warn('Asset could not be applied, using fallback:', file, e); }
      },
      undefined,
      () => console.warn('Asset failed to load, using fallback:', file)
    );
    const tile = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    // swap a material's map and free the old (procedural) texture's GPU memory
    const setMap = (mat, tex, tint) => {
      const old = mat.map;
      mat.map = tex;
      if (tint !== undefined) mat.color.setHex(tint);
      mat.needsUpdate = true;
      if (old && old !== tex) old.dispose();
    };

    load('textures/asphalt_512.png', (t) => {
      tile(t, 4, this.roadLength / this.laneTiles / 4);   // ~4 m asphalt tiles
      setMap(this.roadMaterial, t);
      this.laneMesh.visible = true;
      // cross streets: scale UVs instead of cloning the texture (shares one GPU copy)
      const uv = this.stubGeo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.5, uv.getY(i) * 0.1833);
      uv.needsUpdate = true;
      setMap(this.junctionMat, t);
      this.assets.asphalt = t;
    });
    load('textures/lane_markings_512.png', (t) => {
      this.drawLaneOverlay(t.image);
      t.dispose();   // only used as a source image for the overlay canvas
    });
    load('textures/grass_512.png', (t) => {
      setMap(this.groundMat, tile(t, 266, 266), 0xa8c690);   // ~6 m tiles over the 1600 m ground
    });
    load('textures/concrete_512.png', (t) => {
      setMap(this.sidewalkMat, tile(t, 1, 1), 0xb8bcc2);
      setMap(this.barrierMat, t, 0xaab0b8);
      const rock = t.clone(); rock.repeat.set(10, 6); rock.needsUpdate = true;
      setMap(this.mountainMat, rock, 0x6a7078);
      const tun = t.clone(); tun.repeat.set(10, 14); tun.needsUpdate = true;
      setMap(this.tunnelMat, tun, 0x9aa0a8);
      this.facade.draw(t.image);   // concrete wall under the window pattern
      this.assets.concrete = t;
    });
    load('environment/sky_gradient_1024x512.png', (t) => {
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      this.skyUniforms.skyTex.value = t;
      this.skyTexReady = true;
      this.applyEnvironmentState(true);
      this.refreshEnvMap();
      this.assets.sky = t;
    });
    load('textures/carbon_fiber_512.png', (t) => { this.assets.carbon = tile(t, 2, 2); this.applyCarTextures(); });
    load('textures/tire_rubber_512.png', (t) => { this.assets.tire = tile(t, 6, 1); this.applyCarTextures(); });

    setTimeout(() => this.finishLoading(), 6000);   // never keep the player waiting on a slow network
  }

  finishLoading() {
    if (this.loadDone) return;
    this.loadDone = true;
    const pf = $(UI.progress);
    if (pf) pf.style.width = '100%';
    setTimeout(() => show(UI.loading, false), 250);
  }

  // 5 evenly spaced dashes cropped from the pack's lane texture = a seamless tile; edge lines drawn on top
  drawLaneOverlay(img) {
    const c = this.laneCanvas, g = c.getContext('2d');
    g.clearRect(0, 0, 512, 512);
    if (img) {
      g.drawImage(img, 0, 20, 512, 450, 0, 0, 512, 512);
    } else {
      g.fillStyle = '#e8e4d4';
      for (let i = 0; i < 5; i++) g.fillRect(248, i * 102.4 + 24, 18, 56);
    }
    g.fillStyle = 'rgba(232,228,212,0.92)';
    g.fillRect(14, 0, 8, 512);
    g.fillRect(490, 0, 8, 512);
    this.laneTex.needsUpdate = true;
  }

  // Carbon on the splitter/spoiler/diffuser trim and rubber on the tyres. The procedural car does not
  // expose these materials, so they are matched by their original colours (no-op if carBuilder changes).
  applyCarTextures() {
    const { carbon, tire } = this.assets;
    this.carRig.root.traverse((o) => {
      const m = o.isMesh ? o.material : null;
      if (!m || Array.isArray(m) || !m.isMeshStandardMaterial || m.userData.texDone) return;
      const hex = m.color.getHex();
      if (carbon && hex === 0x15171a) { m.map = carbon; m.color.setHex(0xffffff); m.needsUpdate = true; m.userData.texDone = true; }
      else if (tire && hex === 0x121316) { m.map = tire; m.color.setHex(0xffffff); m.needsUpdate = true; m.userData.texDone = true; }
    });
  }

  // Paint atlas: extra paint colours sampled from its swatches + a swatch dot on each chip
  setupPaintChips() {
    const first = document.querySelector('.chip-btn[data-paint]');
    if (!first) return;
    const group = first.parentElement;
    const cell = (b, cx, cy) => {
      b.classList.add('has-swatch');
      b.style.setProperty('--sw-x', `${(cx / 2) * 100}%`);
      b.style.setProperty('--sw-y', `${((cy / 1.048) * 100).toFixed(1)}%`);
    };
    const MATCH = { '#08090c': [0, 1], '#0a1f44': [0, 0] };
    [['Silverstone', '#b4b8be', 1, 0], ['Toronto Red', '#780f16', 2, 0], ['Alpine White', '#e1e1dc', 1, 1], ['Atlantis Teal', '#0a506e', 2, 1]]
      .forEach(([name, hex, cx, cy]) => {
        if (group.querySelector(`[data-paint="${hex}"]`)) return;
        const b = document.createElement('button');
        b.className = 'chip-btn';
        b.dataset.paint = hex;
        b.textContent = name;
        cell(b, cx, cy);
        group.appendChild(b);
      });
    group.querySelectorAll('.chip-btn[data-paint]').forEach((b) => {
      const m = MATCH[b.dataset.paint];
      if (m) cell(b, m[0], m[1]);
      else if (!b.classList.contains('has-swatch')) b.style.setProperty('--sw-bg', b.dataset.paint);
    });
  }

  // Speedometer dial overlay + needle (inside the existing instrument cluster) and a RESET button
  buildDial() {
    const cluster = document.querySelector('.instrument-cluster');
    if (cluster && !cluster.querySelector('.dial-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'dial-wrap';
      wrap.innerHTML = '<div class="dial-needle"></div>';
      cluster.insertBefore(wrap, cluster.firstChild);
      this.needle = wrap.firstChild;
    }
    const tr = document.querySelector('.hud-top-right');
    if (tr && !$('btn-hud-reset')) {
      const b = document.createElement('button');
      b.id = 'btn-hud-reset';
      b.className = 'hud-icon-btn';
      b.textContent = 'RESET';
      b.title = 'Reset onto the road (R)';
      b.addEventListener('click', () => this.resetToRoad());
      tr.appendChild(b);
    }
  }

  // Free GPU memory (page hide / unload)
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => {
        ['map', 'emissiveMap', 'normalMap', 'roughnessMap'].forEach((k) => { if (m[k]) m[k].dispose(); });
        m.dispose();
      });
    });
    if (this.envRT) this.envRT.dispose();
    if (this.pmrem) this.pmrem.dispose();
    if (this.skyUniforms) this.skyUniforms.skyTex.value.dispose();
    if (this.facade) { this.facade.map.dispose(); this.facade.emissive.dispose(); }
    if (this.laneTex) this.laneTex.dispose();
    Object.values(this.assets).forEach((t) => t.dispose && t.dispose());
    if (this.audio && this.audio.ctx) this.audio.ctx.close().catch(() => {});
    this.renderer.dispose();
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
    const S = this.roadSamples, n = S.length;
    let best = this.lastIdx || 0, bd = Infinity;
    const c = S[best].pt;
    const far = (pos.x - c.x) * (pos.x - c.x) + (pos.z - c.z) * (pos.z - c.z) > 900;
    if (far) {
      for (let i = 0; i < n; i++) {
        const q = S[i].pt;
        const d = (pos.x - q.x) * (pos.x - q.x) + (pos.z - q.z) * (pos.z - q.z);
        if (d < bd) { bd = d; best = i; }
      }
    } else {
      const c0 = best;
      for (let o = -12; o <= 12; o++) {
        const i = (c0 + o + n) % n;
        const q = S[i].pt;
        const d = (pos.x - q.x) * (pos.x - q.x) + (pos.z - q.z) * (pos.z - q.z);
        if (d < bd) { bd = d; best = i; }
      }
    }
    this.lastIdx = best;
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
    if (Math.abs(lat) > limit && !this.inJunction(p.pos)) {
      const side = Math.sign(lat);
      const over = lat - side * limit;
      p.pos.x -= s.right.x * over;
      p.pos.z -= s.right.z * over;
      const n = s.right.clone().multiplyScalar(side);
      const vn = p.vel.dot(n);
      if (vn > 2.5) this.haptic();
      if (vn > 0) {
        p.vel.addScaledVector(n, -vn * 1.6);
        p.vel.multiplyScalar(0.92);
      }
    }
    p.pos.y = s.pt.y;

    // Traffic collisions
    for (const tr of this.traffic) {
      if (!tr.mesh.visible) continue;
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
    if (g !== this.prevGear && kmh > 5) {
      const up = g > this.prevGear;
      this.audio.shift(up, this.throttleVal);
      if (up) p.rpm = Math.max(900, p.rpm - 1400);
      this.pulseGear();
    }
    this.prevGear = g;
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
    p.wheelRotation += (vlF * dt) / 0.36;

    // Road slope (nose follows hills) + spring/damper body heave over bumps
    const th = Math.hypot(s.tangent.x, s.tangent.z) || 1;
    const dirSign = s.tangent.x * f.x + s.tangent.z * f.z >= 0 ? 1 : -1;
    p.slope += (-Math.atan2(s.tangent.y, th) * dirSign - p.slope) * Math.min(1, dt * 6);
    const sp = Math.min(1, p.speedMps / 25);
    const bump = (Math.sin(p.pos.x * 0.83 + p.pos.z * 1.17) + Math.sin(p.pos.x * 2.1 - p.pos.z * 1.7) * 0.5) * 0.006 * sp;
    const heaveT = -Math.abs(p.roll) * 0.25 + bump;
    p.heaveVel += (-120 * (p.heave - heaveT) - 14 * p.heaveVel) * dt;
    p.heave = THREE.MathUtils.clamp(p.heave + p.heaveVel * dt, -0.06, 0.06);

    // Allow driving into cross streets, but stop at their far ends
    if (this.inJunction(p.pos) && Math.abs(p.pos.x) > 27) {
      const sx = Math.sign(p.pos.x);
      p.pos.x = sx * 27;
      if (p.vel.x * sx > 0) p.vel.x *= -0.2;
    }
  }

  updateTraffic(dt) {
    for (const tr of this.traffic) {
      if (!tr.mesh.visible) continue;
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
    const rig = this.carRig;
    const root = rig.root;
    root.position.copy(p.pos);
    if (rig.bodyGroup) {
      // Chassis pitch/roll/heave on the body only: wheels stay planted (suspension feel)
      root.rotation.set(p.slope, p.heading, 0);
      rig.bodyGroup.rotation.set(p.pitch, 0, p.roll);
      rig.bodyGroup.position.y = p.heave;
    } else {
      root.rotation.set(p.pitch + p.slope, p.heading, p.roll);
    }
    if (Array.isArray(rig.wheels)) {
      rig.wheels.forEach((w) => {
        w.spinGroup.rotation.x = p.wheelRotation;
        if (w.isFront) w.steerPivot.rotation.y = p.steerAngle;
      });
    }
    if (rig.steeringWheelGroup) rig.steeringWheelGroup.rotation.z = -p.steerAngle * 4;
    if (rig.materials) {
      rig.materials.taillightMat.emissiveIntensity = this.input.brake ? 4 : 1.2;
      rig.materials.reverseLightMat.emissiveIntensity = p.speedKmh < -1 ? 2.5 : 0;
    }
    if (rig.lights) rig.lights.tailPointLight.intensity = this.input.brake ? 3 : 1.2;
  }

  // --------------------------------------------------------------------------
  // CAMERA
  // --------------------------------------------------------------------------
  updateCamera(dt) {
    const p = this.physics;
    const f = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    const l = new THREE.Vector3(f.z, 0, -f.x);
    let fov = this.state.fov;
    let wantPos, wantLook, snap = false, key;

    if (this.state.mode !== 'DRIVING') {
      const intro = this.state.mode === 'INTRO';
      key = this.state.mode;
      this.orbitAngle += dt * (intro ? 0.55 : 0.25);
      const k = intro ? Math.min(1, this.state.introTimer / 6) : 0;
      const r = intro ? 9 + k : 7.5;
      const a = intro ? p.heading + Math.PI * 0.9 + (1 - k) * 2.4 : this.orbitAngle;
      wantPos = new THREE.Vector3(p.pos.x + Math.sin(a) * r, p.pos.y + 2.2 + k, p.pos.z + Math.cos(a) * r);
      wantLook = p.pos.clone().add(new THREE.Vector3(0, 0.9, 0));
      snap = true;
    } else {
      const idx = this.state.cameraIndex;
      key = 'D' + idx;
      if (idx < 2) {
        // Chase: pulls back and swings outward in corners, looks into the turn
        const spd = Math.min(1, Math.abs(p.speedKmh) / 200);
        const back = (idx === 0 ? 8.2 : 5.6) + spd * 1.8;
        const up = (idx === 0 ? 3.2 : 2.0) - spd * 0.3;
        wantPos = p.pos.clone().addScaledVector(f, -back).add(new THREE.Vector3(0, up, 0)).addScaledVector(l, p.angularVel * -0.9);
        wantLook = p.pos.clone().addScaledVector(f, 4 + spd * 3).addScaledVector(l, p.angularVel * 1.6).add(new THREE.Vector3(0, 1.1, 0));
        fov += spd * 14;
      } else {
        snap = true;
        wantPos = idx === 2
          ? p.pos.clone().addScaledVector(f, 1.1).add(new THREE.Vector3(0, 1.18, 0))
          : p.pos.clone().addScaledVector(f, -0.2).addScaledVector(l, -0.36).add(new THREE.Vector3(0, 1.2, 0));
        wantLook = wantPos.clone().addScaledVector(f, 20);
        wantLook.y += p.pitch * -8;
      }
    }

    if (!this.camInit) { this.camSmPos.copy(wantPos); this.camSmLook.copy(wantLook); this.camInit = true; }
    if (snap) {
      this.camSmPos.copy(wantPos);
      this.camSmLook.copy(wantLook);
    } else {
      this.camSmPos.lerp(wantPos, 1 - Math.exp(-dt * 5.5));
      this.camSmLook.lerp(wantLook, 1 - Math.exp(-dt * 9));
    }

    // Smooth blend whenever the camera mode changes
    if (key !== this.camKey) {
      this.camFromPos.copy(this.camPos);
      this.camFromLook.copy(this.camLook);
      this.camBlend = this.camKey ? 0 : 1;
      this.camKey = key;
    }
    if (this.camBlend < 1) {
      this.camBlend = Math.min(1, this.camBlend + dt / 0.55);
      const e = this.camBlend * this.camBlend * (3 - 2 * this.camBlend);
      this.camPos.copy(this.camFromPos).lerp(this.camSmPos, e);
      this.camLook.copy(this.camFromLook).lerp(this.camSmLook, e);
    } else {
      this.camPos.copy(this.camSmPos);
      this.camLook.copy(this.camSmLook);
    }

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.fovCur += (fov - this.fovCur) * (1 - Math.exp(-dt * 4));
    if (Math.abs(this.camera.fov - this.fovCur) > 0.05) {
      this.camera.fov = this.fovCur;
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
    setText(UI.camBtn, `CAM: ${['CHASE', 'CLOSE', 'HOOD', 'COCKPIT'][this.state.cameraIndex]}`);
    const bar = $(UI.rpmBar);
    if (bar) bar.style.width = `${(p.rpm / 7200 * 100).toFixed(1)}%`;
    if (this.needle) {
      const target = THREE.MathUtils.clamp(Math.abs(p.speedKmh) / 300, 0, 1);
      this.dialVal += (target - this.dialVal) * 0.45;
      this.needle.style.transform = `rotate(${(-65.4 + this.dialVal * 130.8).toFixed(1)}deg)`;
    }
    const si = this.nearestSample(p.pos);
    setText(UI.zone, this.zoneName(this.roadSamples[si].t));
  }

  // --------------------------------------------------------------------------
  // MAIN LOOP
  // --------------------------------------------------------------------------
  animate() {
    requestAnimationFrame(this.animate);
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.frame++;

    this.fpsFrames++;
    this.fpsTime += rawDt;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
      this.adaptQuality(this.fps);
    }

    if (this.state.mode === 'INTRO') {
      this.state.introTimer += dt;
      if (this.state.introTimer > 6) this.endIntro();
    }

    if (this.state.mode === 'DRIVING') this.updatePhysics(dt);
    else this.physics.vel.multiplyScalar(Math.max(0, 1 - dt * 3));

    this.updateTraffic(dt);
    this.syncCarMesh();
    this.updateParticles(dt);
    this.updateEnv(dt);
    this.updateCamera(dt);

    this.sky.position.copy(this.camera.position);
    this.sunLight.target.position.copy(this.physics.pos);
    this.sunLight.position.copy(this.physics.pos).add(this.sunOffset);
    const c = this.cfg;
    if (c && c.shadow && c.every && this.frame % c.every === 0) this.renderer.shadowMap.needsUpdate = true;

    const p = this.physics;
    this.audio.update(p.rpm, this.throttleVal, p.slipRatio, Math.abs(p.speedKmh), this.input.brake ? 1 : 0);

    // HUD + minimap at 20 Hz: plenty smooth, much cheaper
    this.hudAcc += dt;
    if (this.hudAcc >= 0.05) {
      this.hudAcc = 0;
      this.updateHUD();
      this.drawMinimap();
    }

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
    const title = document.querySelector('#webgl-error h2');
    if (title) title.textContent = 'Game failed to start';
    const el = $(UI.glErrorMsg);
    if (el) {
      const stack = String((err && err.stack) || '').split('\n').slice(0, 6).join('\n');
      el.style.whiteSpace = 'pre-wrap';
      el.style.fontSize = '11px';
      el.style.wordBreak = 'break-all';
      el.textContent = (err && err.message ? err.message : String(err)) + '\n\n' + stack;
    }
    show(UI.glError, true);
    show(UI.loading, false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

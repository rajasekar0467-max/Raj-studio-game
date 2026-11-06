import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildProceduralBMW, loadExternalGLBVehicle } from './carBuilder.js';

// ============================================================================
// 0. UI ELEMENT IDS - synchronized with index.html (Phase 1 Foundation Overhaul)
// ============================================================================
const UI = {
  loading: 'loading-screen', progress: 'progress-fill', loadingStatus: 'loading-status',
  loadingAsset: 'loading-asset-item', loadingPct: 'loading-pct',
  glError: 'webgl-error', glErrorTitle: 'webgl-error-title', glErrorMsg: 'webgl-error-msg',
  glDiag: 'webgl-diag-box', reloadGl: 'btn-reload-webgl',
  orientOverlay: 'orientation-overlay', dismissPortrait: 'btn-dismiss-portrait',
  menu: 'main-menu', garage: 'garage-screen', settings: 'settings-screen',
  pauseMenu: 'pause-menu', infoModal: 'info-modal', exitModal: 'exit-modal', hud: 'driving-hud',
  barTop: 'cinematic-bar-top', barBottom: 'cinematic-bar-bottom',
  // Main Menu buttons (7 items: Play, Garage, Multiplayer, Settings, Controls, Sound, About)
  start: 'btn-start-drive', cont: 'btn-continue-drive', skip: 'btn-skip-intro',
  openGarage: 'btn-open-garage', openMultiplayer: 'btn-open-multiplayer',
  openSettings: 'btn-open-settings', openControls: 'btn-open-controls',
  openSound: 'btn-open-sound', openAbout: 'btn-open-about',
  menuFps: 'menu-fps-badge', playLabel: 'lbl-play-btn',
  // Garage buttons & labels
  garageHome: 'btn-garage-home', garageBack: 'btn-garage-back', garageSelect: 'btn-garage-select',
  garagePaintLabel: 'garage-paint-label', glbUrl: 'input-glb-url', glbLoad: 'btn-load-glb', glbStatus: 'glb-status-msg',
  statSpeedVal: 'stat-speed-val', statAccelVal: 'stat-accel-val', statHandlingVal: 'stat-handling-val', statBrakeVal: 'stat-brake-val',
  statBarSpeed: 'stat-bar-speed', statBarAccel: 'stat-bar-accel', statBarHandling: 'stat-bar-handling', statBarBraking: 'stat-bar-braking',
  // Settings controls & labels
  settingsBack: 'btn-settings-back', settingsApply: 'btn-settings-apply',
  hwTierLabel: 'lbl-hw-tier', toggleAutoRes: 'toggle-auto-res',
  res: 'slider-res', fov: 'slider-fov', steer: 'slider-sens', volume: 'slider-vol',
  engineVol: 'slider-engine-vol', musicVol: 'slider-music-vol', fxVol: 'slider-fx-vol',
  touchScale: 'slider-touch-scale', camSens: 'slider-cam-sens',
  resLabel: 'lbl-res-scale', fovLabel: 'lbl-fov', steerLabel: 'lbl-sens', volLabel: 'lbl-vol',
  engineVolLabel: 'lbl-engine-vol', musicVolLabel: 'lbl-music-vol', fxVolLabel: 'lbl-fx-vol',
  touchScaleLabel: 'lbl-touch-scale', camSensLabel: 'lbl-cam-sens',
  toggleShadows: 'toggle-shadows', toggleAA: 'toggle-aa', togglePostFx: 'toggle-postfx', toggleFullscreen: 'toggle-fullscreen',
  previewPresetTitle: 'preview-preset-title', previewEnvSub: 'preview-env-sub',
  // Pause Menu buttons
  pauseResume: 'btn-pause-resume', pauseRestart: 'btn-pause-restart',
  pauseGarage: 'btn-pause-garage', pauseSettings: 'btn-pause-settings', pauseMainMenu: 'btn-pause-mainmenu',
  // Info Modal (Multiplayer Coming Soon & About RR Studios)
  infoTitle: 'info-modal-title', infoDesc: 'info-modal-desc', infoBadges: 'info-modal-badges', infoClose: 'btn-info-close',
  // Exit Confirmation Modal
  exitTitle: 'exit-modal-title', exitDesc: 'exit-modal-desc',
  exitStay: 'btn-exit-stay', exitConfirm: 'btn-exit-confirm',
  // Driving HUD controls & readouts
  pause: 'btn-hud-pause', camBtn: 'btn-hud-camera', camLabel: 'hud-cam-label',
  lightsBtn: 'btn-hud-lights', audioBtn: 'btn-hud-sound', gfxBtn: 'btn-hud-gfx', gfxShort: 'hud-gfx-short', resetBtn: 'btn-hud-reset',
  speed: 'hud-speed', speedUnit: 'hud-speed-unit', rpm: 'hud-rpm', gear: 'hud-gear', driveChar: 'hud-drive-char',
  fps: 'hud-fps', rpmBar: 'rpm-bar-fill', tachArc: 'tach-active-arc',
  fuel: 'hud-fuel', temp: 'hud-temp', weatherTemp: 'hud-weather-temp', cityShort: 'hud-city-short', clockTime: 'hud-clock-time',
  indLeft: 'ind-turn-left', indRight: 'ind-turn-right', indLights: 'ind-headlights', indBrake: 'ind-handbrake',
  cluster: 'hud-cluster', modePill: 'hud-mode-pill', shiftPill: 'hud-shift-pill',
  zone: 'zone-label', info: 'hud-env-badge', menuInfo: 'menu-env-summary',
  // Touch buttons & manual gear paddles
  left: 'touch-left', right: 'touch-right', throttle: 'touch-throttle',
  brake: 'touch-brake', pbrake: 'touch-handbrake',
  gearUp: 'touch-gear-up', gearDown: 'touch-gear-down'
};

const STORAGE_KEY = 'rr_studios_bmw_phase1_settings';
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
  ? import.meta.env.BASE_URL
  : './';
const ASSET = (p) => `${BASE_URL}assets/${p.replace(/^\/?assets\//, '')}`;
const ASSET_FALLBACK = (p) => `${BASE_URL}public/assets/${p.replace(/^\/?assets\//, '')}`;

const PHYS_STEP = 1 / 60;
const LANE_TILE_M = 60;
const CAMERA_NAMES = ['CHASE', 'CLOSE', 'FRONT', 'SIDE', 'COCKPIT'];
const TACH_ARC_LEN = 364.4;

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

// Reusable scratch vectors to eliminate per-frame allocations inside hot loops
const _vForward = new THREE.Vector3();
const _vLeft = new THREE.Vector3();
const _vNormal = new THREE.Vector3();
const _vWantPos = new THREE.Vector3();
const _vWantLook = new THREE.Vector3();
const _vSmokePos = new THREE.Vector3();
const _vSmokeVel = new THREE.Vector3();

// ============================================================================
// 1. AUDIO SYNTHESIS ENGINE (Part 9: Engine + UI Clicks + Gear Pops + Ambience)
// ============================================================================
class AutomotiveAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.8;
    this.engineVolume = 0.9;
    this.musicVolume = 0.4;
    this.fxVolume = 0.85;
    this.sportExhaust = true;
    this.initialized = false;
    this.lastPop = 0;
    this.shiftUntil = 0;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended' && this.enabled) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = (this.ctx = new AudioCtx());

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.masterVolume * 0.28;
      this.masterGain.connect(ctx.destination);

      // Engine harmonic stack
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
      osc3Gain.gain.value = 0.11;
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

      // Ambient synth pad for Environment / Music Volume channel
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 520;
      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);
      [110, 164.81, 220].forEach((freq) => {
        const mOsc = ctx.createOscillator();
        mOsc.type = 'sine';
        mOsc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.08;
        mOsc.connect(g);
        g.connect(this.musicFilter);
        mOsc.start();
      });

      // Shared noise buffer -> tire squeal, wind, brake, exhaust pop
      const bufferSize = Math.floor(ctx.sampleRate * 1.5);
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

  // Synthesizes a crisp automotive iDrive UI button click/confirm tone
  playUIClick(accent = false) {
    this.init();
    if (!this.initialized || !this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(accent ? 880 : 620, now);
      osc.frequency.exponentialRampToValueAtTime(accent ? 1320 : 340, now + 0.045);
      gain.gain.setValueAtTime(0.18 * this.fxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch (_) { /* ignore */ }
  }

  popBurst(now) {
    if (!this.pop) return;
    const g = this.pop.g.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime((0.45 + Math.random() * 0.4) * this.engineVolume, now);
    g.exponentialRampToValueAtTime(0.0001, now + 0.07);
    this.lastPop = now;
  }

  shift(up, throttle) {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.shiftUntil = now + 0.14;
    if (this.sportExhaust && (up || throttle > 0.3)) this.popBurst(now);
  }

  suspend() {
    if (this.initialized && this.ctx && this.ctx.state === 'running') {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
  }

  update(rpm, throttle, slipAmount, speedKmh, brake = 0, inMenu = false) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended' && this.enabled) {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;
    if (!this.enabled) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }
    this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.28, now, 0.05);

    const musicTarget = this.musicVolume * (inMenu ? 0.35 : 0.16);
    this.musicGain.gain.setTargetAtTime(musicTarget, now, 0.15);

    if (inMenu) {
      this.osc1.frequency.setTargetAtTime(34, now, 0.08);
      this.osc2.frequency.setTargetAtTime(17, now, 0.08);
      this.osc3.frequency.setTargetAtTime(68, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.12 * this.engineVolume, now, 0.1);
      this.turboGain.gain.setTargetAtTime(0, now, 0.1);
      this.wind.g.gain.setTargetAtTime(0, now, 0.1);
      this.brakeN.g.gain.setTargetAtTime(0, now, 0.1);
      this.skid.g.gain.setTargetAtTime(0, now, 0.1);
      return;
    }

    const dip = now < this.shiftUntil ? 0.35 : 1;
    const baseFreq = Math.max(28, (rpm / 60) * 1.5);
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
    this.osc3.frequency.setTargetAtTime(baseFreq * 2, now, 0.03);

    const exhaustMult = this.sportExhaust ? 1.55 : 0.9;
    const cutoff = 220 + (rpm / 7200) * 1400 * exhaustMult + throttle * 350;
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.04);
    this.engineGain.gain.setTargetAtTime((0.4 + throttle * 0.45) * dip * this.engineVolume, now, 0.03);

    const turbo = throttle > 0.5 && rpm > 2500 ? (0.012 + 0.03 * (rpm / 7200)) * this.engineVolume : 0;
    this.turboOsc.frequency.setTargetAtTime(1800 + (rpm / 7200) * 3200, now, 0.08);
    this.turboGain.gain.setTargetAtTime(turbo, now, 0.12);

    const w = Math.min(0.22, Math.pow(speedKmh / 200, 1.5) * 0.25) * this.fxVolume;
    this.wind.g.gain.setTargetAtTime(w, now, 0.2);
    this.wind.f.frequency.setTargetAtTime(400 + speedKmh * 4, now, 0.2);

    const bq = brake && speedKmh > 25 ? Math.min(0.1, (speedKmh - 25) / 450) * this.fxVolume : 0;
    this.brakeN.g.gain.setTargetAtTime(bq, now, 0.08);

    const squeal = speedKmh > 18 && slipAmount > 0.22 ? Math.min(0.65, (slipAmount - 0.22) * 1.2) * this.fxVolume : 0;
    this.skid.g.gain.setTargetAtTime(squeal, now, 0.05);

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

  ctx.fillStyle = '#1b1e24';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 11000; i++) {
    const shade = 20 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  ctx.fillStyle = 'rgba(10, 12, 16, 0.22)';
  ctx.fillRect(110, 0, 56, 512);
  ctx.fillRect(346, 0, 56, 512);

  ctx.fillStyle = '#d8dee9';
  ctx.fillRect(16, 0, 8, 512);
  ctx.fillRect(488, 0, 8, 512);

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
      g.fillStyle = w.lit ? '#33455a' : '#161e29';
      g.fillRect(w.x, w.y, 16, 12);
      if (w.lit) { e.fillStyle = w.col; e.fillRect(w.x, w.y, 16, 12); }
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
// 3. ENVIRONMENT & UNIFIED REALISTIC GRAPHICS ENGINE (Part 4)
// ============================================================================
const TIME_PRESETS = {
  morning: { sky: 0x9fc3dd, sun: 0xfff0d8, sunI: 2.8, sunPos: [-90, 90, 70], hemi: 0.9, exp: 1.0, win: 0.0, env: 1.0, fog: 0.00055, label: 'MORNING', menu: 'MORNING', clock: '08:15', tempC: 19 },
  sunset:  { sky: 0x7a4f52, sun: 0xffb870, sunI: 2.6, sunPos: [120, 45, 80], hemi: 0.65, exp: 1.05, win: 0.35, env: 0.85, fog: 0.00075, label: 'SUNSET', menu: 'GOLDEN HOUR', clock: '17:45', tempC: 26 },
  night:   { sky: 0x05070d, sun: 0x6f8cff, sunI: 0.35, sunPos: [-60, 80, -40], hemi: 0.24, exp: 1.25, win: 1.0, env: 0.28, fog: 0.0010, label: 'NIGHT', menu: 'NIGHT CITY', clock: '23:10', tempC: 16 }
};
const WEATHER_PRESETS = {
  clear:      { dark: 1.0, fogMul: 1.0, rain: 0, rough: 0.82, metal: 0.06, grip: 1.0, label: 'CLEAR', tempDelta: 0 },
  light_rain: { dark: 0.75, fogMul: 1.7, rain: 0.5, rough: 0.42, metal: 0.22, grip: 0.82, label: 'LIGHT RAIN', tempDelta: -4 },
  heavy_rain: { dark: 0.52, fogMul: 2.9, rain: 1.0, rough: 0.26, metal: 0.32, grip: 0.66, label: 'STORM', tempDelta: -7 }
};
const GEAR_MAX_KMH = [55, 95, 140, 190, 240, 300];

const IS_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);

const JUNCTION_Z = [-80, 70, 210];
const nearJunction = (pt, r) => JUNCTION_Z.some((jz) => Math.abs(pt.z - jz) < r && Math.abs(pt.x) < 16);

const SKY = {
  morning: { top: 0x3f7fcf, hor: 0xbfd9ee, glow: 1.0, mix: 0.7, tint: [1.5, 1.55, 1.6] },
  sunset:  { top: 0x27345f, hor: 0xff9a5c, glow: 1.4, mix: 0.5, tint: [1.0, 0.95, 0.9] },
  night:   { top: 0x01030a, hor: 0x0a1322, glow: 0.25, mix: 0.0, tint: [0.1, 0.12, 0.2] }
};

// Part 4: Hardware Tier Profiles inside the single unified "REALISTIC" graphics option.
// Automatically selected at boot from device memory, CPU cores, and GPU capabilities,
// and dynamically adjusted at runtime to maintain smooth Android gameplay.
const REALISTIC_TIERS = {
  0: { name: 'REALISTIC // MOBILE BALANCED', dpr: 1.35, res: 0.9,  shadow: true, map: 1024, every: 2, spots: 'night', tail: false, trees: 0.65, traffic: 10, rain: 0.6, glass: false, coat: true, bump: false, far: 2400 },
  1: { name: 'REALISTIC // HIGH PBR',        dpr: 1.85, res: 1.0,  shadow: true, map: 1536, every: 1, spots: true,    tail: true,  trees: 0.90, traffic: 14, rain: 0.85, glass: false, coat: true, bump: true,  far: 3000 },
  2: { name: 'REALISTIC // ULTRA MAX',       dpr: 2.50, res: 1.05, shadow: true, map: 2048, every: 1, spots: true,    tail: true,  trees: 1.00, traffic: 16, rain: 1.00, glass: true,  coat: true, bump: true,  far: 3600 }
};

const ENV_NUM = ['sunI', 'sunPow', 'hemi', 'exp', 'win', 'envI', 'fog', 'rough', 'metal', 'skyMix'];
const cloneEnv = (e) => ({
  top: e.top.clone(), hor: e.hor.clone(), sun: e.sun.clone(), sunPos: e.sunPos.clone(), tint: e.tint.clone(),
  sunI: e.sunI, sunPow: e.sunPow, hemi: e.hemi, exp: e.exp, win: e.win, envI: e.envI,
  fog: e.fog, rough: e.rough, metal: e.metal, skyMix: e.skyMix
});

// ============================================================================
// 4. MAIN GAME ENGINE + NAVIGATION STACK
// ============================================================================
class UltimateDriveSimulator {
  constructor() {
    this.canvas = $('game-canvas');
    this.minimapCanvas = $('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Detect initial hardware tier for the unified REALISTIC graphics engine
    this.hwTier = this.detectInitialHardwareTier();

    this.state = {
      mode: 'MENU',        // 'MENU' | 'INTRO' | 'DRIVING' | 'PAUSED'
      screen: 'MAIN_MENU', // 'MAIN_MENU' | 'GARAGE' | 'SETTINGS' | 'DRIVING' | 'PAUSE'
      timeOfDay: 'sunset',
      weather: 'clear',
      preset: 'realistic', // Single unified REALISTIC graphics option
      resScale: 1.0,
      autoQuality: true,
      shadowsEnabled: true,
      aaEnabled: true,
      postFxEnabled: true,
      fov: 62,
      camSens: 1.0,
      steerSens: 1.0,
      touchScale: 1.0,
      controlLayout: 'standard',
      transMode: 'auto',   // 'auto' | 'manual'
      units: 'kmh',
      assistMode: 'sim',
      cameraIndex: 0,      // 0: Chase, 1: Close, 2: Front, 3: Side, 4: Cockpit
      headlightsOn: true,
      introTimer: 0,
      started: false,
      spawn: 'city',
      paintHex: '#0a2b6e',
      paintName: 'Tanzanite Blue II',
      portraitPaused: false,
      portraitDismissed: false
    };

    this.navStack = ['MAIN_MENU'];
    this.suppressPop = false;
    this.exitModalContext = 'APP';
    this.pendingPaintHex = this.state.paintHex;
    this.pendingPaintName = this.state.paintName;

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
      slope: 0,
      fuel: 98.4,
      engineTemp: 88.0,
      distanceMeters: 0
    };

    this.audio = new AutomotiveAudioEngine();
    this.traffic = [];
    this.smokeParticles = [];
    this.clock = new THREE.Clock();
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.fps = 60;
    this.throttleVal = 0;
    this.brakeVal = 0;
    this.longAccel = 0;
    this.orbitAngle = 0.55;
    this.garageDragActive = false;
    this.garageDragX = 0;
    this.flash = 0;
    this.frame = 0;
    this.hudAcc = 0;
    this.dynScale = 1;
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
    this.accum = 0;
    this.loadDone = false;
    this.assets = {};
    this.baseHemi = 0.65;
    this.sunOffset = new THREE.Vector3(120, 95, 80);
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();

    this.loadSavedSettings();
    this.initWebGL();
    this.buildSky();
    this.buildWorld();
    this.buildVehicle();
    this.buildWeatherAndParticles();
    this.buildMinimap();
    this.bindUIAndControls();
    this.initHistoryNavigation();
    this.applyEnvironmentState(true);
    this.applyRealisticTier(this.hwTier, true);
    this.syncSettingsUIFromState();
    this.refreshEnvMap();

    this.teleportToZone(this.state.spawn);
    this.loadAssets();

    this.showScreen('MAIN_MENU');
    this.checkOrientation();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  detectInitialHardwareTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    if (!IS_MOBILE && cores >= 8 && mem >= 8) return 2;
    if (IS_MOBILE && (cores <= 4 || mem <= 3)) return 0;
    return 1;
  }

  // --------------------------------------------------------------------------
  // PART 1: AUTOMATIC IMMERSIVE FULLSCREEN & LANDSCAPE LOCK ON PLAY
  // --------------------------------------------------------------------------
  requestImmersiveFullscreen() {
    const docEl = document.documentElement;
    const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    if (reqFs && !document.fullscreenElement && !document.webkitFullscreenElement) {
      Promise.resolve(reqFs.call(docEl))
        .then(() => {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
          const fsToggle = $(UI.toggleFullscreen);
          if (fsToggle) fsToggle.checked = true;
          this.updateViewportSize();
        })
        .catch(() => {
          // Gracefully continue if browser blocks or does not support Fullscreen API
        });
    } else if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  // --------------------------------------------------------------------------
  // PERSISTENT SETTINGS (localStorage with safe try/catch)
  // --------------------------------------------------------------------------
  loadSavedSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.resScale === 'number') this.state.resScale = THREE.MathUtils.clamp(d.resScale, 0.6, 1.25);
      if (typeof d.autoQuality === 'boolean') this.state.autoQuality = d.autoQuality;
      if (typeof d.shadowsEnabled === 'boolean') this.state.shadowsEnabled = d.shadowsEnabled;
      if (typeof d.aaEnabled === 'boolean') this.state.aaEnabled = d.aaEnabled;
      if (typeof d.postFxEnabled === 'boolean') this.state.postFxEnabled = d.postFxEnabled;
      if (typeof d.fov === 'number') this.state.fov = THREE.MathUtils.clamp(d.fov, 50, 85);
      if (typeof d.camSens === 'number') this.state.camSens = THREE.MathUtils.clamp(d.camSens, 0.5, 1.5);
      if (typeof d.steerSens === 'number') this.state.steerSens = THREE.MathUtils.clamp(d.steerSens, 0.5, 1.8);
      if (typeof d.touchScale === 'number') this.state.touchScale = THREE.MathUtils.clamp(d.touchScale, 0.85, 1.25);
      if (d.controlLayout === 'flipped' || d.controlLayout === 'standard') this.state.controlLayout = d.controlLayout;
      if (d.transMode === 'manual' || d.transMode === 'auto') this.state.transMode = d.transMode;
      if (d.units === 'mph' || d.units === 'kmh') this.state.units = d.units;
      if (d.assistMode === 'arcade' || d.assistMode === 'sim') this.state.assistMode = d.assistMode;
      if (d.timeOfDay && TIME_PRESETS[d.timeOfDay]) this.state.timeOfDay = d.timeOfDay;
      if (d.weather && WEATHER_PRESETS[d.weather]) this.state.weather = d.weather;
      if (d.spawn && ['city', 'highway', 'coast'].includes(d.spawn)) this.state.spawn = d.spawn;
      if (typeof d.paintHex === 'string') {
        this.state.paintHex = d.paintHex;
        this.pendingPaintHex = d.paintHex;
      }
      if (typeof d.paintName === 'string') {
        this.state.paintName = d.paintName;
        this.pendingPaintName = d.paintName;
      }
      if (typeof d.audioEnabled === 'boolean') this.audio.enabled = d.audioEnabled;
      if (typeof d.masterVolume === 'number') this.audio.masterVolume = THREE.MathUtils.clamp(d.masterVolume, 0, 1);
      if (typeof d.engineVolume === 'number') this.audio.engineVolume = THREE.MathUtils.clamp(d.engineVolume, 0, 1);
      if (typeof d.musicVolume === 'number') this.audio.musicVolume = THREE.MathUtils.clamp(d.musicVolume, 0, 1);
      if (typeof d.fxVolume === 'number') this.audio.fxVolume = THREE.MathUtils.clamp(d.fxVolume, 0, 1);
      if (typeof d.sportExhaust === 'boolean') this.audio.sportExhaust = d.sportExhaust;
    } catch (e) {
      console.warn('Could not load saved settings:', e);
    }
  }

  saveSettings() {
    try {
      const payload = {
        resScale: this.state.resScale,
        autoQuality: this.state.autoQuality,
        shadowsEnabled: this.state.shadowsEnabled,
        aaEnabled: this.state.aaEnabled,
        postFxEnabled: this.state.postFxEnabled,
        fov: this.state.fov,
        camSens: this.state.camSens,
        steerSens: this.state.steerSens,
        touchScale: this.state.touchScale,
        controlLayout: this.state.controlLayout,
        transMode: this.state.transMode,
        units: this.state.units,
        assistMode: this.state.assistMode,
        timeOfDay: this.state.timeOfDay,
        weather: this.state.weather,
        spawn: this.state.spawn,
        paintHex: this.state.paintHex,
        paintName: this.state.paintName,
        audioEnabled: this.audio.enabled,
        masterVolume: this.audio.masterVolume,
        engineVolume: this.audio.engineVolume,
        musicVolume: this.audio.musicVolume,
        fxVolume: this.audio.fxVolume,
        sportExhaust: this.audio.sportExhaust
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { /* ignore */ }
  }

  // --------------------------------------------------------------------------
  // PART 6: CONTROLLED NAVIGATION STACK & ANDROID BACK BUTTON SYSTEM
  // --------------------------------------------------------------------------
  initHistoryNavigation() {
    try {
      window.history.replaceState({ rrStudioNav: 'ROOT' }, '', window.location.href);
      window.history.pushState({ rrStudioNav: 'MAIN_MENU' }, '', window.location.href);
    } catch (_) { /* ignore */ }

    this._onPopState = () => {
      if (this.suppressPop) {
        this.suppressPop = false;
        return;
      }
      try {
        window.history.pushState({ rrStudioNav: this.state.screen }, '', window.location.href);
      } catch (_) { /* ignore */ }
      this.handleBackAction();
    };
    window.addEventListener('popstate', this._onPopState);
  }

  navigateTo(screen) {
    if (this.state.screen === screen) return;
    if (this.navStack[this.navStack.length - 1] !== screen) {
      this.navStack.push(screen);
      try {
        window.history.replaceState({ rrStudioNav: screen }, '', window.location.href);
      } catch (_) { /* ignore */ }
    }
    this.showScreen(screen);
  }

  handleBackAction() {
    this.audio.playUIClick(false);

    const infoEl = $(UI.infoModal);
    if (infoEl && !infoEl.classList.contains('hidden')) {
      show(UI.infoModal, false);
      return;
    }

    const exitEl = $(UI.exitModal);
    if (exitEl && !exitEl.classList.contains('hidden')) {
      this.closeExitModal();
      return;
    }

    if (this.state.mode === 'INTRO') {
      this.endIntro();
      return;
    }

    const cur = this.state.screen;

    if (cur === 'DRIVING') {
      this.pauseDriving();
      return;
    }

    if (cur === 'PAUSE') {
      this.resumeDriving();
      return;
    }

    if (cur === 'GARAGE') {
      this.setPaint(this.state.paintHex, this.state.paintName, false);
      this.popToPreviousScreen();
      return;
    }

    if (cur === 'SETTINGS') {
      this.saveSettings();
      this.popToPreviousScreen();
      return;
    }

    if (cur === 'MAIN_MENU') {
      this.openExitModal('APP');
    }
  }

  popToPreviousScreen() {
    if (this.navStack.length > 1) {
      this.navStack.pop();
    }
    const target = this.navStack[this.navStack.length - 1] || 'MAIN_MENU';
    this.showScreen(target);
  }

  showScreen(screen) {
    this.state.screen = screen;

    show(UI.menu, screen === 'MAIN_MENU');
    show(UI.garage, screen === 'GARAGE');
    show(UI.settings, screen === 'SETTINGS');
    show(UI.pauseMenu, screen === 'PAUSE');
    show(UI.hud, screen === 'DRIVING');

    if (this.garageRing) {
      this.garageRing.visible = (screen === 'GARAGE' || screen === 'MAIN_MENU');
    }

    if (screen === 'DRIVING') {
      this.state.mode = 'DRIVING';
    } else if (screen === 'PAUSE') {
      this.state.mode = 'PAUSED';
    } else {
      this.state.mode = 'MENU';
    }

    if (screen === 'GARAGE') {
      this.pendingPaintHex = this.state.paintHex;
      this.pendingPaintName = this.state.paintName;
      this.updateGarageStatsUI();
    }
  }

  openInfoModal(type) {
    this.audio.playUIClick(true);
    if (type === 'MULTIPLAYER') {
      setText(UI.infoTitle, 'ONLINE MULTIPLAYER // COMING SOON');
      setText(UI.infoDesc, 'Real-time lobbies, live tandem drift sessions, and leaderboard time trials are scheduled for RR STUDIOS Phase 2. Enjoy single-player Open World Realistic Drive in Phase 1!');
      const b = $(UI.infoBadges);
      if (b) {
        b.innerHTML = `
          <div><span>STATUS</span><strong>In Development (Phase 2)</strong></div>
          <div><span>MODE</span><strong>Open World Freeroam &amp; Drift</strong></div>
          <div><span>CAPACITY</span><strong>Up to 8 Players / Lobby</strong></div>
          <div><span>CURRENT BUILD</span><strong>Single-Player Active</strong></div>
        `;
      }
    } else {
      setText(UI.infoTitle, 'ABOUT RR STUDIOS');
      setText(UI.infoDesc, 'RR STUDIOS builds high-craft mobile & web automotive simulations engineered for Android landscape performance, physically based materials, and responsive touch dynamics.');
      const b = $(UI.infoBadges);
      if (b) {
        b.innerHTML = `
          <div><span>STUDIO</span><strong>RR STUDIOS</strong></div>
          <div><span>VERSION</span><strong>Phase 1 Foundation (v2.5)</strong></div>
          <div><span>RENDERER</span><strong>Three.js r180 PBR Pipeline</strong></div>
          <div><span>VEHICLE</span><strong>M4 Competition Inspired Coupe</strong></div>
        `;
      }
    }
    show(UI.infoModal, true);
  }

  openExitModal(context = 'APP') {
    this.exitModalContext = context;
    if (context === 'TO_MAIN_MENU') {
      setText(UI.exitTitle, 'RETURN TO MAIN MENU?');
      setText(UI.exitDesc, 'Are you sure you want to leave your current driving session and return to the RR STUDIOS Main Menu?');
    } else {
      setText(UI.exitTitle, 'EXIT RR STUDIOS?');
      setText(UI.exitDesc, 'Are you sure you want to exit BMW Ultimate Realistic Drive?');
    }
    show(UI.exitModal, true);
  }

  closeExitModal() {
    show(UI.exitModal, false);
  }

  // --------------------------------------------------------------------------
  // PART 8: WEBGL 2 & GRAPHICS STABILITY (Multi-Stage Fallback + Diagnostics)
  // --------------------------------------------------------------------------
  initWebGL() {
    const attempts = [
      { label: 'WebGL 2 High-Performance AA', opts: { canvas: this.canvas, antialias: true, powerPreference: 'high-performance', alpha: false } },
      { label: 'WebGL 2 Balanced No-AA', opts: { canvas: this.canvas, antialias: false, powerPreference: 'default', alpha: false } },
      { label: 'WebGL Standard Fallback', opts: { canvas: this.canvas, antialias: false, alpha: false, failIfMajorPerformanceCaveat: false } }
    ];

    let lastErr = null;
    for (const att of attempts) {
      try {
        this.renderer = new THREE.WebGLRenderer(att.opts);
        this.glProfileLabel = att.label;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!this.renderer) {
      const hasWGL2 = !!window.WebGL2RenderingContext;
      const hasWGL1 = !!window.WebGLRenderingContext;
      setText(UI.glErrorTitle, '3D Hardware Acceleration Unavailable');
      setText(
        UI.glErrorMsg,
        'Your browser or device could not create a WebGL rendering context. Ensure Hardware Acceleration is enabled in browser settings and no other heavy 3D tabs are exhausting GPU memory.'
      );
      setText(
        UI.glDiag,
        `WebGL2 API: ${hasWGL2 ? 'Present' : 'Missing'} | WebGL1 API: ${hasWGL1 ? 'Present' : 'Missing'}\nDetails: ${lastErr && lastErr.message ? lastErr.message : String(lastErr)}`
      );
      show(UI.glError, true);
      show(UI.loading, false);
      throw lastErr || new Error('Unable to create WebGLRenderer');
    }

    const isWebGL2 = this.renderer.capabilities.isWebGL2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isWebGL2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
      if (this.state.screen === 'DRIVING') this.pauseDriving();
      setText(UI.glErrorTitle, 'Graphics Context Paused');
      setText(UI.glErrorMsg, 'Android reclaimed GPU memory in the background. Waiting to restore 3D context automatically, or tap Retry below.');
      setText(UI.glDiag, `Profile: ${this.glProfileLabel} | Tier: ${this.hwTier}`);
      show(UI.glError, true);
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
      show(UI.glError, false);
      this.refreshEnvMap();
      this.renderer.shadowMap.needsUpdate = true;
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1f2430);
    this.scene.fog = new THREE.FogExp2(0x1f2430, 0.0018);

    this.camera = new THREE.PerspectiveCamera(
      this.state.fov,
      window.innerWidth / window.innerHeight,
      0.18,
      3200
    );

    const pmremGenerator = (this.pmrem = new THREE.PMREMGenerator(this.renderer));
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    this.ambientLight = new THREE.HemisphereLight(0xddeeff, 0x1a1e24, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffb870, 2.6);
    this.sunLight.position.set(120, 95, 80);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 360;
    const d = 58;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    window.addEventListener('resize', () => {
      this.updateViewportSize();
      this.checkOrientation();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this.updateViewportSize();
        this.checkOrientation();
      });
    }
    document.addEventListener('fullscreenchange', () => {
      const fsToggle = $(UI.toggleFullscreen);
      if (fsToggle) fsToggle.checked = !!document.fullscreenElement;
      this.updateViewportSize();
      this.checkOrientation();
    });
    this.updateViewportSize();
  }

  updateViewportSize() {
    if (!this.renderer || !this.camera) return;
    const vv = window.visualViewport;
    const w = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
    const h = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const cap = this.cfg ? this.cfg.dpr : 1.65;
    const aaBoost = this.state.aaEnabled ? 1.0 : 0.78;
    const dpr = Math.min(window.devicePixelRatio || 1, cap) * this.state.resScale * this.dynScale * aaBoost;
    this.renderer.setPixelRatio(Math.max(0.55, dpr));
    this.renderer.setSize(w, h, false);
  }

  checkOrientation() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w * 1.08 && (IS_MOBILE || w < 640);
    if (isPortrait && !this.state.portraitDismissed) {
      show(UI.orientOverlay, true);
      this.state.portraitPaused = true;
      this.audio.suspend();
    } else {
      show(UI.orientOverlay, false);
      this.state.portraitPaused = false;
    }
  }

  // --------------------------------------------------------------------------
  // OPEN-WORLD NETWORK
  // --------------------------------------------------------------------------
  buildWorld() {
    this.roadWidth = 16.0;
    this.halfRoad = this.roadWidth * 0.5;

    const controlPoints = [
      new THREE.Vector3(0, 0.2, -240),
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0, 0.2, 260),
      new THREE.Vector3(120, 0.4, 420),
      new THREE.Vector3(440, 3.0, 820),
      new THREE.Vector3(920, 9.5, 780),
      new THREE.Vector3(1380, 18.0, 540),
      new THREE.Vector3(1660, 32.0, 160),
      new THREE.Vector3(1720, 38.0, -320),
      new THREE.Vector3(1480, 28.0, -780),
      new THREE.Vector3(1060, 15.0, -1160),
      new THREE.Vector3(540, 6.0, -1340),
      new THREE.Vector3(40, 1.2, -1300),
      new THREE.Vector3(-480, 0.5, -1120),
      new THREE.Vector3(-920, 0.5, -780),
      new THREE.Vector3(-1060, 0.5, -420),
      new THREE.Vector3(-780, 0.35, -220),
      new THREE.Vector3(-240, 0.2, -260)
    ];

    this.roadCurve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.45);
    this.roadLength = this.roadCurve.getLength();
    this.laneTiles = Math.max(1, Math.round(this.roadLength / LANE_TILE_M));
    this.roadSamples = [];
    const sampleCount = Math.max(650, Math.round(this.roadLength / 4));

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
      const bLeftTop = bLeftBot.clone().add(new THREE.Vector3(0, 0.78, 0));
      const bRightBot = rightEdge.clone().addScaledVector(right, 0.4);
      const bRightTop = bRightBot.clone().add(new THREE.Vector3(0, 0.78, 0));

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

        if (!nearJunction(pt, 6.8)) {
          const bIdx = i * 4;
          barrierIndices.push(bIdx, bIdx + 1, bIdx + 4, bIdx + 1, bIdx + 5, bIdx + 4);
          barrierIndices.push(bIdx + 2, bIdx + 6, bIdx + 3, bIdx + 3, bIdx + 6, bIdx + 7);
        }
      }
    }

    this.zoneT = { city: this.tAtPoint(120, 420), mountain: this.tAtPoint(40, -1300) };
    this.zoneSpawn = {
      city: this.tAtPoint(0, -110),
      highway: this.tAtPoint(1660, 160),
      coast: this.tAtPoint(-1060, -420)
    };

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: createAsphaltTexture(),
      roughness: 0.65,
      metalness: 0.14
    });

    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

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
      color: 0x3a404a, roughness: 0.58, metalness: 0.42, side: THREE.DoubleSide
    });
    this.barrierMat = barrierMat;
    this.scene.add(new THREE.Mesh(barrierGeo, barrierMat));

    const groundGeo = new THREE.PlaneGeometry(8500, 8500);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x131915, roughness: 0.92 });
    this.groundMat = groundMat;
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(320, -0.05, -240);
    ground.receiveShadow = true;
    this.scene.add(ground);

    {
      const ep = [], ei = [], eu = [];
      let ev = 0;
      const N = this.roadSamples.length, U = 1 / 8500, o0 = this.halfRoad + 4.2;
      const run = (h) => Math.max(0.6, (h + 0.1) * 1.7);
      for (let i = 0; i < N; i++) {
        const a = this.roadSamples[i], b = this.roadSamples[(i + 1) % N];
        if (nearJunction(a.pt, 7)) continue;
        for (const side of [-1, 1]) {
          const A0 = a.pt.clone().addScaledVector(a.right, side * o0); A0.y = a.pt.y + 0.1;
          const A1 = a.pt.clone().addScaledVector(a.right, side * (o0 + run(a.pt.y))); A1.y = -0.05;
          const B0 = b.pt.clone().addScaledVector(b.right, side * o0); B0.y = b.pt.y + 0.1;
          const B1 = b.pt.clone().addScaledVector(b.right, side * (o0 + run(b.pt.y))); B1.y = -0.05;
          [A0, A1, B0, B1].forEach((q) => { ep.push(q.x, q.y, q.z); eu.push(q.x * U, q.z * U); });
          ei.push(ev, ev + 1, ev + 2, ev + 1, ev + 3, ev + 2);
          ev += 4;
        }
      }
      const eg = new THREE.BufferGeometry();
      eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
      eg.setAttribute('uv', new THREE.Float32BufferAttribute(eu, 2));
      eg.setIndex(ei);
      eg.computeVertexNormals();
      groundMat.side = THREE.DoubleSide;
      const em = new THREE.Mesh(eg, groundMat);
      em.receiveShadow = true;
      this.scene.add(em);
    }

    const oceanGeo = new THREE.PlaneGeometry(3000, 3200);
    oceanGeo.rotateX(-Math.PI / 2);
    this.oceanMat = new THREE.MeshStandardMaterial({ color: 0x09253a, roughness: 0.12, metalness: 0.85 });
    const ocean = new THREE.Mesh(oceanGeo, this.oceanMat);
    ocean.position.set(-2400, 0.02, -560);
    this.scene.add(ocean);

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

    const buildingCount = 120;
    const instancedBldgs = new THREE.InstancedMesh(bldgGeo, this.bldgMat, buildingCount);
    instancedBldgs.castShadow = true;
    instancedBldgs.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let z = -220; z <= 310; z += 26) {
      if (JUNCTION_Z.some((j) => Math.abs(z - j) < 28)) continue;
      for (const side of [-1, 1]) {
        if (idx >= buildingCount) break;
        const distFromRoad = 23 + Math.random() * 48;
        const w = 14 + Math.random() * 15;
        const d = 14 + Math.random() * 15;
        const h = 26 + Math.random() * 78;
        dummy.position.set(side * distFromRoad, 0, z + (Math.random() - 0.5) * 8);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        instancedBldgs.setMatrixAt(idx++, dummy.matrix);
      }
    }
    instancedBldgs.count = idx;
    this.scene.add(instancedBldgs);

    const mountainGeo = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x182026, roughness: 0.9 });
    this.mountainMat = mountainMat;
    const ring = new THREE.InstancedMesh(mountainGeo, mountainMat, 30);
    let mi = 0;
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.12;
      const r = 2100 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 750;
      const mx = 340 + Math.cos(a) * r, mz = -250 + Math.sin(a) * r;
      if (mx < -1300) continue;
      const rad = 280 + (Math.sin(i * 39.346) * 0.5 + 0.5) * 240;
      const hgt = 180 + (Math.sin(i * 11.135) * 0.5 + 0.5) * 240;
      dummy.position.set(mx, -4, mz);
      dummy.rotation.set(0, i, 0);
      dummy.scale.set(rad, hgt, rad);
      dummy.updateMatrix();
      ring.setMatrixAt(mi++, dummy.matrix);
    }
    ring.count = mi;
    ring.frustumCulled = false;
    this.scene.add(ring);

    const tunnelGeo = new THREE.CylinderGeometry(13.0, 13.0, 64, 16, 1, true, Math.PI / 2, Math.PI);
    tunnelGeo.rotateX(Math.PI / 2);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x22262c, side: THREE.DoubleSide, roughness: 0.7 });
    this.tunnelMat = tunnelMat;
    const tunnelPt = this.roadCurve.getPointAt(0.45);
    const tunnelTan = this.roadCurve.getTangentAt(0.45);
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.position.copy(tunnelPt).add(new THREE.Vector3(0, 0.2, 0));
    tunnelMesh.lookAt(tunnelPt.clone().add(tunnelTan));
    this.scene.add(tunnelMesh);

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 6);
    poleGeo.translate(0, 3.75, 0);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c323b, metalness: 0.8 });
    const lightCount = Math.floor(this.roadSamples.length / 5);
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
    this.scene.traverse((o) => {
      if (o.isMesh && !o.userData.dynamic) { o.updateMatrix(); o.matrixAutoUpdate = false; }
    });

    this.spawnTraffic(16);
  }

  spawnTraffic(count) {
    const trafficColors = [0xd8dee9, 0x2e3440, 0x5e81ac, 0xbf616a, 0x4c566a, 0xebcb8b];
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: trafficColors[i % trafficColors.length],
        metalness: 0.72,
        roughness: 0.24
      });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.35), mat);
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
      hl.position.set(0, 0.58, 2.18);
      group.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xff1111 }));
      tl.position.set(0, 0.62, -2.18);
      group.add(tl);

      this.scene.add(group);
      this.traffic.push({
        mesh: group,
        t: (i / count + 0.06) % 1.0,
        speed: 14 + (i % 4) * 2.6,
        laneOffset: i % 2 === 0 ? 3.8 : -3.8,
        dir: i % 2 === 0 ? 1 : -1
      });
    }
  }

  // --------------------------------------------------------------------------
  // VEHICLE, GARAGE TURNTABLE RING & WEATHER PARTICLES
  // --------------------------------------------------------------------------
  buildVehicle() {
    this.carRig = buildProceduralBMW();
    this.carRig.root.rotation.order = 'YXZ';
    this.scene.add(this.carRig.root);
    this.buildBlobShadow();
    this.buildGarageFloorRing();
    this.setPaint(this.state.paintHex, this.state.paintName, false);
    this.setHeadlights(this.state.headlightsOn);
  }

  buildGarageFloorRing() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const cx = 128, cy = 128;
    for (const [r, col, w] of [[118, 'rgba(0,168,255,0.65)', 4], [108, 'rgba(255,255,255,0.85)', 2], [92, 'rgba(0,102,177,0.45)', 3]]) {
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.strokeStyle = col;
      g.lineWidth = w;
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.garageRing = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 6.8).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false })
    );
    this.garageRing.position.y = 0.04;
    this.garageRing.renderOrder = 3;
    this.garageRing.visible = true;
    this.carRig.root.add(this.garageRing);
  }

  setHeadlights(on_) {
    this.state.headlightsOn = on_;
    const hb = $(UI.lightsBtn);
    if (hb) hb.classList.toggle('active', on_);
    const ind = $(UI.indLights);
    if (ind) ind.classList.toggle('active', on_);
    const r = this.carRig;
    if (!r) return;
    if (r.lights) {
      const allowed = this.spotsAllowed();
      r.lights.headSpotL.visible = r.lights.headSpotR.visible = allowed;
      r.lights.headSpotL.intensity = on_ ? 28 : 0;
      r.lights.headSpotR.intensity = on_ ? 28 : 0;
    }
    const hm = r.headMats || (r.materials && r.materials.headlightMat ? [r.materials.headlightMat] : []);
    hm.forEach((m) => { m.emissiveIntensity = on_ ? 3.5 : 0.4; });
  }

  setPaint(hex, name = '', commit = true) {
    if (!hex) return;
    this.pendingPaintHex = hex;
    if (name) this.pendingPaintName = name;
    if (commit) {
      this.state.paintHex = hex;
      if (name) this.state.paintName = name;
      this.saveSettings();
    }
    const r = this.carRig;
    const list = r.paintMats || (r.materials && r.materials.bodyPaintMat ? [r.materials.bodyPaintMat] : []);
    list.forEach((m) => m.color.set(hex));

    const labelName = name || this.pendingPaintName || hex.toUpperCase();
    setText(UI.garagePaintLabel, `PAINT: ${labelName.toUpperCase()}`);
    document.querySelectorAll('#paint-select [data-paint]').forEach((b) => {
      b.classList.toggle('active', b.dataset.paint.toLowerCase() === hex.toLowerCase());
    });
  }

  updateGarageStatsUI() {
    const isSim = this.state.assistMode === 'sim';
    const isMph = this.state.units === 'mph';
    setText(UI.statSpeedVal, isMph ? '186 MPH' : '300 KM/H');
    setText(UI.statAccelVal, isMph ? '3.4s 0-60' : '3.5s 0-100');
    setText(UI.statHandlingVal, isSim ? 'M-DYNAMIC' : 'STABLE');
    setText(UI.statBrakeVal, '6-PISTON M');
    const hBar = $(UI.statBarHandling);
    if (hBar) hBar.style.width = isSim ? '86%' : '94%';
  }

  loadGLB(url) {
    if (!url) return;
    const b = $(UI.glbLoad);
    const setStatus = (msg) => setText(UI.glbStatus, msg);
    const flash = (t) => { if (!b) return; b.textContent = t; setTimeout(() => { b.textContent = 'Load GLB'; }, 2500); };
    flash('Loading...');
    setStatus(`Loading ${url}...`);
    this.loadVehicleGLB(url).then((ok) => {
      if (ok) {
        flash('Loaded');
        setStatus(`External GLB active: ${url}`);
      } else {
        loadExternalGLBVehicle(url, this.carRig, (st) => setStatus(st));
        flash('Fallback');
      }
    });
  }

  buildWeatherAndParticles() {
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
    p.vel.copy(vel);
    p.vel.x += (Math.random() - 0.5) * 0.8;
    p.vel.y += 0.6 + Math.random() * 0.5;
    p.vel.z += (Math.random() - 0.5) * 0.8;
  }

  updateParticles(dt) {
    const p = this.physics;

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

    if (this.state.weather === 'heavy_rain' && Math.random() < 0.004) this.flash = 1;
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.ambientLight.intensity = this.baseHemi + this.flash * 3.0;

    _vForward.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    _vLeft.set(_vForward.z, 0, -_vForward.x);
    if (this.state.mode === 'DRIVING' && Math.abs(p.speedKmh) > 12 && (p.slipRatio > 0.45 || (this.input.handbrake && p.slipRatio > 0.2))) {
      for (const side of [-0.85, 0.85]) {
        _vSmokePos.copy(p.pos).addScaledVector(_vForward, -1.5).addScaledVector(_vLeft, side);
        _vSmokePos.y += 0.2;
        _vSmokeVel.copy(p.vel).multiplyScalar(0.15);
        this.emitSmoke(_vSmokePos, _vSmokeVel);
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
  }

  // --------------------------------------------------------------------------
  // PART 4: REALISTIC GRAPHICS — SINGLE UNIFIED ADAPTIVE ENGINE
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
      this.envBlend = true;
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
    setText(UI.menuInfo, `${T.menu} | ${W.label} | REALISTIC GRAPHICS`);
    setText(UI.clockTime, T.clock);
    setText(UI.weatherTemp, `${T.tempC + W.tempDelta}°C`);
  }

  syncChips(selector, attr, value) {
    document.querySelectorAll(selector).forEach((b) => b.classList.toggle('active', b.dataset[attr] === value));
  }

  applyRealisticTier(tierIndex, keepCustomRes = false) {
    const clampedTier = THREE.MathUtils.clamp(tierIndex, 0, 2);
    this.hwTier = clampedTier;
    const CFG = REALISTIC_TIERS[clampedTier];
    this.cfg = CFG;
    this.state.preset = 'realistic';

    if (!keepCustomRes) {
      this.state.resScale = CFG.res;
    }

    if (this.camera && this.camera.far !== CFG.far) {
      this.camera.far = CFG.far;
      this.camera.updateProjectionMatrix();
    }

    this.carRig.root.traverse((o) => {
      const m = o.isMesh ? o.material : null;
      if (!m || !m.isMeshPhysicalMaterial) return;
      if (m.userData.t0 === undefined) { m.userData.t0 = m.transmission; m.userData.cc0 = m.clearcoat; }
      const t = CFG.glass ? m.userData.t0 : 0;
      const cc = CFG.coat ? m.userData.cc0 : 0;
      if (m.transmission !== t || m.clearcoat !== cc) { m.transmission = t; m.clearcoat = cc; m.needsUpdate = true; }
    });

    const useShadows = CFG.shadow && this.state.shadowsEnabled;
    this.sunLight.castShadow = useShadows;
    if (this.sunLight.shadow.mapSize.x !== CFG.map) {
      if (this.sunLight.shadow.map) { this.sunLight.shadow.map.dispose(); this.sunLight.shadow.map = null; }
      this.sunLight.shadow.mapSize.set(CFG.map, CFG.map);
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = this.state.postFxEnabled ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;

    this.traffic.forEach((t, i) => { t.mesh.visible = i < CFG.traffic; });
    if (this.treeMeshes) {
      const n = Math.floor(this.treeTotal * CFG.trees);
      this.treeMeshes.forEach((m) => { m.count = n; });
    }
    if (this.carRig.lights) this.carRig.lights.tailPointLight.visible = CFG.tail;
    this.setHeadlights(this.state.headlightsOn);
    this.applyRainRange();

    this.updateViewportSize();
    setText(UI.gfxShort, 'REALISTIC');
    setText(UI.hwTierLabel, `${CFG.name} (${Math.round(this.dynScale * 100)}% SCALE)`);
    setText(UI.resLabel, `${Math.round(this.state.resScale * 100)}%`);
    setText(UI.previewPresetTitle, 'REALISTIC GRAPHICS');
    setText(UI.previewEnvSub, CFG.name);
    const sl = $(UI.res);
    if (sl) sl.value = String(this.state.resScale);
    if (this.blob) this.blob.material.opacity = useShadows && CFG.every === 1 ? 0.32 : 0.55;
    this.applyBump();
    this.updateSummary();
  }

  syncSettingsUIFromState() {
    this.syncChips('#time-select .chip-btn', 'time', this.state.timeOfDay);
    this.syncChips('#weather-select .chip-btn', 'weather', this.state.weather);
    this.syncChips('#spawn-select .chip-btn', 'spawn', this.state.spawn);
    this.syncChips('#assist-select .chip-btn', 'assist', this.state.assistMode);
    this.syncChips('#units-select .chip-btn', 'units', this.state.units);
    this.syncChips('#layout-select .chip-btn', 'layout', this.state.controlLayout);
    this.syncChips('#trans-select .chip-btn', 'trans', this.state.transMode);
    this.syncChips('#audio-toggle-group .chip-btn', 'audio', this.audio.enabled ? 'on' : 'off');
    this.syncChips('#exhaust-select .chip-btn', 'exhaust', this.audio.sportExhaust ? 'sport' : 'comfort');

    const setSlider = (id, lblId, val, fmt) => {
      const el = $(id);
      if (el) el.value = String(val);
      setText(lblId, fmt);
    };
    setSlider(UI.res, UI.resLabel, this.state.resScale, `${Math.round(this.state.resScale * 100)}%`);
    setSlider(UI.fov, UI.fovLabel, this.state.fov, `${Math.round(this.state.fov)}°`);
    setSlider(UI.steer, UI.steerLabel, this.state.steerSens, `${this.state.steerSens.toFixed(1)}x`);
    setSlider(UI.camSens, UI.camSensLabel, Math.round(this.state.camSens * 100), `${Math.round(this.state.camSens * 100)}%`);
    setSlider(UI.touchScale, UI.touchScaleLabel, Math.round(this.state.touchScale * 100), `${Math.round(this.state.touchScale * 100)}%`);
    setSlider(UI.volume, UI.volLabel, Math.round(this.audio.masterVolume * 100), `${Math.round(this.audio.masterVolume * 100)}%`);
    setSlider(UI.engineVol, UI.engineVolLabel, Math.round(this.audio.engineVolume * 100), `${Math.round(this.audio.engineVolume * 100)}%`);
    setSlider(UI.musicVol, UI.musicVolLabel, Math.round(this.audio.musicVolume * 100), `${Math.round(this.audio.musicVolume * 100)}%`);
    setSlider(UI.fxVol, UI.fxVolLabel, Math.round(this.audio.fxVolume * 100), `${Math.round(this.audio.fxVolume * 100)}%`);

    document.documentElement.style.setProperty('--touch-scale', String(this.state.touchScale));
    document.body.classList.toggle('controls-flipped', this.state.controlLayout === 'flipped');
    setText(UI.speedUnit, this.state.units === 'mph' ? 'MPH' : 'KM/H');
    setText(UI.modePill, this.state.assistMode === 'sim' ? 'M-DYNAMIC' : 'STABLE');

    const ar = $(UI.toggleAutoRes); if (ar) ar.checked = this.state.autoQuality;
    const sh = $(UI.toggleShadows); if (sh) sh.checked = this.state.shadowsEnabled;
    const aa = $(UI.toggleAA); if (aa) aa.checked = this.state.aaEnabled;
    const pf = $(UI.togglePostFx); if (pf) pf.checked = this.state.postFxEnabled;
  }

  teleportToZone(zone) {
    const t = (this.zoneSpawn && this.zoneSpawn[zone]) ?? 0;
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
    p.fuel = 98.4;
    p.engineTemp = 88.0;
    this.lastIdx = Math.floor(t * this.roadSamples.length) % this.roadSamples.length;
    this.syncCarMesh();
  }

  zoneName(t) {
    if (t < this.zoneT.city) return 'DOWNTOWN CORE';
    if (t < this.zoneT.mountain) return 'MOUNTAIN HIGHWAY';
    return 'COASTAL ROUTE';
  }

  zoneShortName(t) {
    if (t < this.zoneT.city) return 'City';
    if (t < this.zoneT.mountain) return 'Mountain';
    return 'Coast';
  }

  // --------------------------------------------------------------------------
  // MINIMAP
  // --------------------------------------------------------------------------
  buildMinimap() {
    if (!this.minimapCanvas) return;
    const w = this.minimapCanvas.width, h = this.minimapCanvas.height;
    this.mm = { w, h, scale: w / 720 };
  }

  mmPoint(x, z) {
    const m = this.mm, p = this.physics;
    return [m.w / 2 + (x - p.pos.x) * m.scale, m.h / 2 + (z - p.pos.z) * m.scale];
  }

  drawMinimap() {
    if (!this.minimapCtx || !this.mm) return;
    const g = this.minimapCtx, m = this.mm, p = this.physics;
    g.clearRect(0, 0, m.w, m.h);
    g.save();
    g.beginPath();
    g.arc(m.w / 2, m.h / 2, m.w / 2 - 2, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = 'rgba(10, 15, 24, 0.88)';
    g.fillRect(0, 0, m.w, m.h);

    g.strokeStyle = 'rgba(0, 168, 255, 0.14)';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(m.w / 2, m.h / 2, m.w * 0.28, 0, Math.PI * 2);
    g.stroke();

    const S = this.roadSamples, n = S.length;
    const rad = m.w / 2 / m.scale, R2 = rad * rad * 1.8;

    g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    g.lineWidth = 6.5;
    g.lineJoin = 'round';
    g.beginPath();
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const q = S[i % n].pt;
      const dx = q.x - p.pos.x, dz = q.z - p.pos.z;
      if (dx * dx + dz * dz > R2) { pen = false; continue; }
      const x = m.w / 2 + dx * m.scale, y = m.h / 2 + dz * m.scale;
      if (!pen) { g.moveTo(x, y); pen = true; } else g.lineTo(x, y);
    }
    g.stroke();

    g.strokeStyle = 'rgba(235, 242, 252, 0.95)';
    g.lineWidth = 3.2;
    g.stroke();

    for (const j of this.junctions || []) {
      const [x1, y1] = this.mmPoint(j.x - 28, j.z);
      const [x2, y2] = this.mmPoint(j.x + 28, j.z);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }

    g.fillStyle = '#ffb347';
    for (const tr of this.traffic) {
      if (!tr.mesh.visible) continue;
      const [x, y] = this.mmPoint(tr.mesh.position.x, tr.mesh.position.z);
      g.fillRect(x - 2, y - 2, 4, 4);
    }

    g.save();
    g.translate(m.w / 2, m.h / 2);
    g.rotate(Math.PI - p.heading);
    g.fillStyle = '#00c8ff';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 4); g.lineTo(-6, 7);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
    g.restore();
  }

  // --------------------------------------------------------------------------
  // UI + NAVIGATION FLOWS
  // --------------------------------------------------------------------------
  startGame(skipIntro = false) {
    this.audio.playUIClick(true);
    this.requestImmersiveFullscreen();
    this.state.started = true;
    this.state.introTimer = 0;
    show(UI.cont, true);
    if (skipIntro) {
      this.endIntro();
    } else {
      this.state.mode = 'INTRO';
      show(UI.menu, false);
      show(UI.garage, false);
      show(UI.settings, false);
      show(UI.pauseMenu, false);
      show(UI.hud, false);
      show(UI.barTop, true);
      show(UI.barBottom, true);
    }
  }

  endIntro() {
    show(UI.barTop, false);
    show(UI.barBottom, false);
    this.navStack = ['MAIN_MENU', 'DRIVING'];
    try { window.history.replaceState({ rrStudioNav: 'DRIVING' }, '', window.location.href); } catch (_) { /* ignore */ }
    this.showScreen('DRIVING');
  }

  pauseDriving() {
    if (this.state.screen === 'PAUSE') return;
    this.navigateTo('PAUSE');
  }

  resumeDriving() {
    this.audio.playUIClick(true);
    this.navStack = ['MAIN_MENU', 'DRIVING'];
    this.showScreen('DRIVING');
  }

  restartDrivingSession() {
    this.audio.playUIClick(true);
    this.teleportToZone(this.state.spawn);
    this.resumeDriving();
  }

  openSettingsWithTab(panelId) {
    this.audio.playUIClick(false);
    const tabs = document.querySelectorAll('.settings-tab-btn');
    tabs.forEach((o) => o.classList.toggle('active', o.dataset.panel === panelId));
    document.querySelectorAll('#settings-screen .menu-panel').forEach((p) => {
      p.classList.toggle('hidden', p.id !== panelId);
    });
    this.navigateTo('SETTINGS');
  }

  togglePause() {
    if (this.state.screen === 'DRIVING') {
      this.pauseDriving();
    } else if (this.state.screen === 'PAUSE') {
      this.resumeDriving();
    }
  }

  cycleCamera() {
    this.audio.playUIClick(false);
    this.state.cameraIndex = (this.state.cameraIndex + 1) % CAMERA_NAMES.length;
    setText(UI.camLabel, CAMERA_NAMES[this.state.cameraIndex]);
  }

  shiftGearManual(delta) {
    this.state.transMode = 'manual';
    this.syncChips('#trans-select .chip-btn', 'trans', 'manual');
    const p = this.physics;
    const nextGear = THREE.MathUtils.clamp(p.gear + delta, 1, 6);
    if (nextGear !== p.gear) {
      const up = nextGear > p.gear;
      p.gear = nextGear;
      this.prevGear = nextGear;
      this.audio.shift(up, this.throttleVal);
      p.rpm = THREE.MathUtils.clamp(up ? p.rpm - 1350 : p.rpm + 1150, 950, 7200);
      this.pulseGear();
    } else {
      this.audio.playUIClick(false);
    }
  }

  setAudioEnabled(v) {
    this.audio.init();
    this.audio.enabled = v;
    const b = $(UI.audioBtn);
    if (b) b.classList.toggle('active', v);
    this.syncChips('#audio-toggle-group .chip-btn', 'audio', v ? 'on' : 'off');
    this.saveSettings();
  }

  bindChips(selector, attr, fn) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playUIClick(false);
        btn.parentElement.querySelectorAll('.chip-btn, .garage-swatch-btn').forEach((b) => b.classList.toggle('active', b === btn));
        fn(btn.dataset[attr], btn);
      });
    });
  }

  bindUIAndControls() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateViewportSize();
        this.checkOrientation();
      }, 220);
    });
    window.addEventListener('pagehide', () => this.dispose());

    on(UI.reloadGl, 'click', () => window.location.reload());
    on(UI.dismissPortrait, 'click', () => {
      this.audio.playUIClick(false);
      this.state.portraitDismissed = true;
      this.checkOrientation();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.screen === 'DRIVING') this.pauseDriving();
    });
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (_) { /* ignore */ }

    const tabs = document.querySelectorAll('.settings-tab-btn');
    tabs.forEach((t) => t.addEventListener('click', () => {
      this.audio.playUIClick(false);
      tabs.forEach((o) => o.classList.toggle('active', o === t));
      document.querySelectorAll('#settings-screen .menu-panel').forEach((p) => p.classList.toggle('hidden', p.id !== t.dataset.panel));
    }));

    on(UI.start, 'click', () => {
      if (!this.state.started) {
        this.teleportToZone(this.state.spawn);
        this.startGame(false);
      } else {
        this.requestImmersiveFullscreen();
        this.resumeDriving();
      }
    });
    on(UI.cont, 'click', () => {
      this.requestImmersiveFullscreen();
      this.resumeDriving();
    });
    on(UI.skip, 'click', () => { if (this.state.mode === 'INTRO') this.endIntro(); });
    on(UI.openGarage, 'click', () => { this.audio.playUIClick(false); this.navigateTo('GARAGE'); });
    on(UI.openMultiplayer, 'click', () => this.openInfoModal('MULTIPLAYER'));
    on(UI.openSettings, 'click', () => this.openSettingsWithTab('panel-graphics'));
    on(UI.openControls, 'click', () => this.openSettingsWithTab('panel-controls'));
    on(UI.openSound, 'click', () => this.openSettingsWithTab('panel-audio'));
    on(UI.openAbout, 'click', () => this.openInfoModal('ABOUT'));

    on(UI.infoClose, 'click', () => {
      this.audio.playUIClick(false);
      show(UI.infoModal, false);
    });

    on(UI.garageHome, 'click', () => {
      this.audio.playUIClick(false);
      this.setPaint(this.state.paintHex, this.state.paintName, false);
      this.navStack = ['MAIN_MENU'];
      this.showScreen('MAIN_MENU');
    });
    on(UI.garageBack, 'click', () => {
      this.audio.playUIClick(false);
      this.setPaint(this.state.paintHex, this.state.paintName, false);
      this.popToPreviousScreen();
    });
    on(UI.garageSelect, 'click', () => {
      this.audio.playUIClick(true);
      this.setPaint(this.pendingPaintHex, this.pendingPaintName, true);
      this.popToPreviousScreen();
    });
    on(UI.glbLoad, 'click', () => { const el = $(UI.glbUrl); if (el) this.loadGLB(el.value.trim()); });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state.screen === 'GARAGE' || this.state.screen === 'MAIN_MENU') {
        this.garageDragActive = true;
        this.garageDragX = e.clientX;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.garageDragActive) return;
      const dx = e.clientX - this.garageDragX;
      this.garageDragX = e.clientX;
      this.orbitAngle -= dx * 0.008;
    });
    window.addEventListener('pointerup', () => { this.garageDragActive = false; });

    on(UI.settingsBack, 'click', () => {
      this.audio.playUIClick(false);
      this.saveSettings();
      this.popToPreviousScreen();
    });
    on(UI.settingsApply, 'click', () => {
      this.audio.playUIClick(true);
      this.saveSettings();
      this.popToPreviousScreen();
    });

    on(UI.pauseResume, 'click', () => this.resumeDriving());
    on(UI.pauseRestart, 'click', () => this.restartDrivingSession());
    on(UI.pauseGarage, 'click', () => { this.audio.playUIClick(false); this.navigateTo('GARAGE'); });
    on(UI.pauseSettings, 'click', () => this.openSettingsWithTab('panel-graphics'));
    on(UI.pauseMainMenu, 'click', () => { this.audio.playUIClick(false); this.openExitModal('TO_MAIN_MENU'); });

    on(UI.exitStay, 'click', () => { this.audio.playUIClick(false); this.closeExitModal(); });
    on(UI.exitConfirm, 'click', () => {
      this.audio.playUIClick(true);
      this.closeExitModal();
      if (this.exitModalContext === 'TO_MAIN_MENU') {
        this.navStack = ['MAIN_MENU'];
        this.showScreen('MAIN_MENU');
      } else {
        this.teleportToZone(this.state.spawn);
        this.navStack = ['MAIN_MENU'];
        this.showScreen('MAIN_MENU');
      }
    });

    on(UI.pause, 'click', () => { this.audio.playUIClick(false); this.pauseDriving(); });
    on(UI.camBtn, 'click', () => this.cycleCamera());
    on(UI.lightsBtn, 'click', () => { this.audio.playUIClick(false); this.setHeadlights(!this.state.headlightsOn); });
    on(UI.audioBtn, 'click', () => { this.audio.playUIClick(false); this.setAudioEnabled(!this.audio.enabled); });
    on(UI.resetBtn, 'click', () => { this.audio.playUIClick(false); this.resetToRoad(); });
    on(UI.gfxBtn, 'click', () => {
      this.audio.playUIClick(true);
      this.dynScale = 1.0;
      this.applyRealisticTier(this.hwTier, true);
    });
    on(UI.gearUp, 'click', () => this.shiftGearManual(1));
    on(UI.gearDown, 'click', () => this.shiftGearManual(-1));

    this.bindChips('#paint-select [data-paint]', 'paint', (v, btn) => {
      this.setPaint(v, btn ? btn.dataset.paintName : '', false);
    });
    this.bindChips('#time-select .chip-btn', 'time', (v) => { this.state.timeOfDay = v; this.applyEnvironmentState(); this.saveSettings(); });
    this.bindChips('#weather-select .chip-btn', 'weather', (v) => { this.state.weather = v; this.applyEnvironmentState(); this.saveSettings(); });
    this.bindChips('#spawn-select .chip-btn', 'spawn', (v) => { this.state.spawn = v; this.teleportToZone(v); this.saveSettings(); });
    this.bindChips('#preset-select .chip-btn', 'preset', () => {
      this.dynScale = 1.0;
      this.applyRealisticTier(this.hwTier, false);
      this.saveSettings();
    });
    this.bindChips('#assist-select .chip-btn', 'assist', (v) => {
      this.state.assistMode = v;
      setText(UI.modePill, v === 'sim' ? 'M-DYNAMIC' : 'STABLE');
      this.updateGarageStatsUI();
      this.saveSettings();
    });
    this.bindChips('#trans-select .chip-btn', 'trans', (v) => {
      this.state.transMode = v;
      this.saveSettings();
    });
    this.bindChips('#units-select .chip-btn', 'units', (v) => {
      this.state.units = v;
      setText(UI.speedUnit, v === 'mph' ? 'MPH' : 'KM/H');
      this.updateGarageStatsUI();
      this.saveSettings();
    });
    this.bindChips('#layout-select .chip-btn', 'layout', (v) => {
      this.state.controlLayout = v;
      document.body.classList.toggle('controls-flipped', v === 'flipped');
      this.saveSettings();
    });
    this.bindChips('#audio-toggle-group .chip-btn', 'audio', (v) => this.setAudioEnabled(v === 'on'));
    this.bindChips('#exhaust-select .chip-btn', 'exhaust', (v) => { this.audio.sportExhaust = v === 'sport'; this.saveSettings(); });

    on(UI.toggleAutoRes, 'change', (e) => {
      this.state.autoQuality = !!e.target.checked;
      if (!this.state.autoQuality) {
        this.dynScale = 1.0;
        this.updateViewportSize();
      }
      this.saveSettings();
    });
    on(UI.toggleShadows, 'change', (e) => {
      this.state.shadowsEnabled = !!e.target.checked;
      this.sunLight.castShadow = this.state.shadowsEnabled && this.cfg.shadow;
      this.renderer.shadowMap.needsUpdate = true;
      this.saveSettings();
    });
    on(UI.toggleAA, 'change', (e) => {
      this.state.aaEnabled = !!e.target.checked;
      this.updateViewportSize();
      this.saveSettings();
    });
    on(UI.togglePostFx, 'change', (e) => {
      this.state.postFxEnabled = !!e.target.checked;
      this.renderer.toneMapping = this.state.postFxEnabled ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;
      this.saveSettings();
    });
    on(UI.toggleFullscreen, 'change', (e) => {
      if (e.target.checked) {
        this.requestImmersiveFullscreen();
      } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    });

    bindValue(UI.res, (v) => {
      this.state.resScale = THREE.MathUtils.clamp(parseFloat(v) || 1, 0.6, 1.25);
      this.updateViewportSize();
      setText(UI.resLabel, `${Math.round(this.state.resScale * 100)}%`);
    });
    bindValue(UI.fov, (v) => {
      this.state.fov = THREE.MathUtils.clamp(parseFloat(v) || 62, 50, 85);
      setText(UI.fovLabel, `${Math.round(this.state.fov)}°`);
    });
    bindValue(UI.camSens, (v) => {
      const pct = THREE.MathUtils.clamp(parseFloat(v) || 100, 50, 150);
      this.state.camSens = pct / 100;
      setText(UI.camSensLabel, `${Math.round(pct)}%`);
    });
    bindValue(UI.steer, (v) => {
      this.state.steerSens = THREE.MathUtils.clamp(parseFloat(v) || 1, 0.5, 1.8);
      setText(UI.steerLabel, `${this.state.steerSens.toFixed(1)}x`);
    });
    bindValue(UI.touchScale, (v) => {
      const pct = THREE.MathUtils.clamp(parseFloat(v) || 100, 85, 125);
      this.state.touchScale = pct / 100;
      document.documentElement.style.setProperty('--touch-scale', String(this.state.touchScale));
      setText(UI.touchScaleLabel, `${Math.round(pct)}%`);
    });
    bindValue(UI.volume, (v) => {
      this.audio.masterVolume = THREE.MathUtils.clamp((parseFloat(v) || 0) / 100, 0, 1);
      setText(UI.volLabel, `${Math.round(this.audio.masterVolume * 100)}%`);
    });
    bindValue(UI.engineVol, (v) => {
      this.audio.engineVolume = THREE.MathUtils.clamp((parseFloat(v) || 0) / 100, 0, 1);
      setText(UI.engineVolLabel, `${Math.round(this.audio.engineVolume * 100)}%`);
    });
    bindValue(UI.musicVol, (v) => {
      this.audio.musicVolume = THREE.MathUtils.clamp((parseFloat(v) || 0) / 100, 0, 1);
      setText(UI.musicVolLabel, `${Math.round(this.audio.musicVolume * 100)}%`);
    });
    bindValue(UI.fxVol, (v) => {
      this.audio.fxVolume = THREE.MathUtils.clamp((parseFloat(v) || 0) / 100, 0, 1);
      setText(UI.fxVolLabel, `${Math.round(this.audio.fxVolume * 100)}%`);
    });

    const hold = (id, key) => {
      const el = $(id);
      if (!el) return;
      const activePointers = new Set();
      const down = (e) => {
        e.preventDefault();
        if (e.pointerId !== undefined) {
          activePointers.add(e.pointerId);
          if (el.setPointerCapture) {
            try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
          }
        }
        this.audio.init();
        this.input[key] = true;
        el.classList.add('pressed');
      };
      const up = (e) => {
        e.preventDefault();
        if (e.pointerId !== undefined) activePointers.delete(e.pointerId);
        if (activePointers.size === 0) {
          this.input[key] = false;
          el.classList.remove('pressed');
        }
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    hold(UI.left, 'left');
    hold(UI.right, 'right');
    hold(UI.throttle, 'throttle');
    hold(UI.brake, 'brake');
    hold(UI.pbrake, 'handbrake');

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
      else if (e.code === 'KeyQ') this.shiftGearManual(-1);
      else if (e.code === 'KeyE') this.shiftGearManual(1);
      else if (e.code === 'KeyP') this.togglePause();
      else if (e.code === 'Escape') {
        e.preventDefault();
        this.handleBackAction();
      } else if (e.code === 'KeyR') this.resetToRoad();
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
            vec2 skyUV = vec2(fract(0.5 + atan(d.z, d.x) / 6.2831853), clamp(pow(clamp(h, 0.0, 1.0), 0.72), 0.02, 0.98));
            vec3 tx = texture2D(skyTex, skyUV).rgb * skyTint;
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

    const maxTrees = 1250;
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
      const city = s.t < this.zoneT.city;
      for (const side of [-1, 1]) {
        if (n >= maxTrees || R() < (city ? 0.68 : 0.28)) continue;
        const off = city ? this.halfRoad + 2.6 : this.halfRoad + 5 + R() * 20;
        dummy.position.copy(s.pt).addScaledVector(s.right, side * off);
        dummy.position.y = Math.max(0, s.pt.y + 0.1 - Math.max(0, off - (this.halfRoad + 4.2)) / 1.7);
        const sc = 0.8 + R() * 0.85;
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

    const lampCount = Math.floor(this.roadSamples.length / 5);
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
    for (const jz of JUNCTION_Z) if (Math.abs(pos.z - jz) < 5.5 && Math.abs(pos.x) < 28) return true;
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

  adaptQuality(fps) {
    if (!this.state.autoQuality || this.clock.elapsedTime < 4 || document.hidden || this.state.portraitPaused) return;
    this.adaptT += 0.5;
    if (fps < 42 && this.adaptT >= 1.5) {
      this.adaptT = 0;
      this.goodT = 0;
      if (this.dynScale > 0.78) {
        this.dynScale = Math.max(0.75, this.dynScale - 0.05);
        this.updateViewportSize();
        setText(UI.hwTierLabel, `${this.cfg.name} (${Math.round(this.dynScale * 100)}% SCALE)`);
      } else if (fps < 30 && this.hwTier > 0) {
        this.dynScale = 0.92;
        this.applyRealisticTier(this.hwTier - 1, true);
      }
    } else if (fps >= 57) {
      this.goodT += 0.5;
      if (this.goodT >= 5) {
        this.goodT = 0;
        if (this.dynScale < 1.0) {
          this.dynScale = Math.min(1.0, this.dynScale + 0.05);
          this.updateViewportSize();
          setText(UI.hwTierLabel, `${this.cfg.name} (${Math.round(this.dynScale * 100)}% SCALE)`);
        } else if (this.hwTier < 2 && !IS_MOBILE) {
          this.applyRealisticTier(this.hwTier + 1, true);
        }
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
    try { navigator.vibrate(18); } catch (_) { /* ignore */ }
  }

  pulseGear() {
    const el = $(UI.gear);
    if (el && el.animate) el.animate([{ transform: 'scale(1.38)' }, { transform: 'scale(1)' }], { duration: 210, easing: 'ease-out' });
  }

  // --------------------------------------------------------------------------
  // PART 7: MEASURED ASSET LOADING WITH REAL PROGRESS FEEDBACK
  // --------------------------------------------------------------------------
  loadAssets() {
    const totalExpected = 14;
    let settledCount = 0;
    const recordAssetProgress = (name) => {
      settledCount = Math.min(totalExpected, settledCount + 1);
      const pct = Math.round((settledCount / totalExpected) * 100);
      const pf = $(UI.progress);
      if (pf) pf.style.width = `${pct}%`;
      setText(UI.loadingPct, `${pct}%`);
      setText(UI.loadingAsset, `Loaded ${name} (${settledCount}/${totalExpected})`);
      if (settledCount >= totalExpected) {
        this.finishLoading();
      }
    };

    const loader = new THREE.TextureLoader();
    const aniso = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4);
    const onTex = (t, apply, label) => {
      t.anisotropy = aniso;
      t.colorSpace = THREE.SRGBColorSpace;
      try { apply(t); } catch (_) { /* keep procedural fallback */ }
      recordAssetProgress(label);
    };
    const load = (file, label, apply) => loader.load(
      ASSET(file),
      (t) => onTex(t, apply, label),
      undefined,
      () => {
        loader.load(
          ASSET_FALLBACK(file),
          (t2) => onTex(t2, apply, label),
          undefined,
          () => recordAssetProgress(`${label} (Procedural Fallback)`)
        );
      }
    );
    const tile = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const setMap = (mat, tex, tint) => {
      const old = mat.map;
      mat.map = tex;
      if (tint !== undefined) mat.color.setHex(tint);
      mat.needsUpdate = true;
      if (old && old !== tex) old.dispose();
    };

    load('textures/asphalt_512.png', 'Road Asphalt PBR', (t) => {
      tile(t, 4, this.roadLength / this.laneTiles / 4);
      setMap(this.roadMaterial, t);
      this.laneMesh.visible = true;
      const uv = this.stubGeo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.5, uv.getY(i) * 0.1833);
      uv.needsUpdate = true;
      setMap(this.junctionMat, t);
      this.assets.asphalt = t;
      this.applyBump();
    });
    load('textures/asphalt_normal_512.png', 'Road Micro-Relief Normal', (t) => {
      t.colorSpace = THREE.NoColorSpace;
      tile(t, 4, this.roadLength / this.laneTiles / 4);
      this.assets.asphaltNormal = t;
      this.applyBump();
    });
    load('textures/lane_markings_512.png', 'Lane Markings', (t) => {
      this.drawLaneOverlay(t.image);
      t.dispose();
    });
    load('textures/grass_512.png', 'Terrain Grass', (t) => {
      setMap(this.groundMat, tile(t, 1200, 1200), 0xc4d8b4);
    });
    load('textures/concrete_512.png', 'Urban Concrete', (t) => {
      setMap(this.sidewalkMat, tile(t, 1, 1), 0xc8ccd2);
      setMap(this.barrierMat, t, 0xb8bec6);
      const rock = t.clone(); rock.repeat.set(10, 6); rock.needsUpdate = true;
      setMap(this.mountainMat, rock, 0x767c86);
      const tun = t.clone(); tun.repeat.set(10, 14); tun.needsUpdate = true;
      setMap(this.tunnelMat, tun, 0xa2a8b0);
      this.facade.draw(t.image);
      this.assets.concrete = t;
    });
    load('textures/building_facade_512.png', 'Architectural Curtain Wall', (t) => {
      tile(t, 1, 1);
      setMap(this.bldgMat, t);
      this.assets.bldgFacade = t;
    });
    load('textures/building_emissive_512.png', 'City Night Illumination', (t) => {
      tile(t, 1, 1);
      const old = this.bldgMat.emissiveMap;
      this.bldgMat.emissiveMap = t;
      this.bldgMat.needsUpdate = true;
      if (old && old !== t) old.dispose();
      this.assets.bldgEmissive = t;
    });
    load('textures/water_normal_512.png', 'Ocean Wave Normals', (t) => {
      t.colorSpace = THREE.NoColorSpace;
      tile(t, 42, 42);
      this.oceanMat.normalMap = t;
      this.oceanMat.normalScale = new THREE.Vector2(0.45, 0.45);
      this.oceanMat.needsUpdate = true;
      this.assets.waterNormal = t;
    });
    load('environment/sky_gradient_1024x512.png', 'HDRI Sky Dome', (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      this.skyUniforms.skyTex.value = t;
      this.skyTexReady = true;
      this.applyEnvironmentState(true);
      this.refreshEnvMap();
      this.assets.sky = t;
    });
    load('ui/garage_floor_glow.png', 'Showroom Lighting', (t) => {
      if (this.garageRing) {
        const old = this.garageRing.material.map;
        this.garageRing.material.map = t;
        this.garageRing.material.needsUpdate = true;
        if (old && old !== t) old.dispose();
      }
    });
    load('textures/carbon_fiber_512.png', 'M-Carbon Weave', (t) => { this.assets.carbon = tile(t, 2, 2); this.applyCarTextures(); });
    load('textures/tire_rubber_512.png', 'Performance Tire Tread', (t) => { this.assets.tire = tile(t, 6, 1); this.applyCarTextures(); });
    load('textures/interior_leather_512.png', 'Merino Leather Interior', (t) => { this.assets.leather = tile(t, 4, 4); this.applyCarTextures(); });
    load('textures/brushed_metal_512.png', 'CNC Brushed Alloys', (t) => { this.assets.metal = tile(t, 2, 2); this.applyCarTextures(); });

    this.loadVehicleGLB(ASSET('vehicles/bmw_m4.glb'), new GLTFLoader());

    setTimeout(() => this.finishLoading(), 3500);
  }

  finishLoading() {
    if (this.loadDone) return;
    this.loadDone = true;
    const pf = $(UI.progress);
    if (pf) pf.style.width = '100%';
    setText(UI.loadingPct, '100%');
    setText(UI.loadingStatus, 'RR STUDIOS Realistic Engine Ready');
    setTimeout(() => show(UI.loading, false), 260);
  }

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

  applyCarTextures() {
    const { carbon, tire, leather, metal } = this.assets;
    this.carRig.root.traverse((o) => {
      const m = o.isMesh ? o.material : null;
      if (!m || Array.isArray(m) || !m.isMeshStandardMaterial) return;
      const hex = m.userData.origHex !== undefined ? m.userData.origHex : (m.userData.origHex = m.color.getHex());
      if (carbon && hex === 0x15171a && m.map !== carbon) { m.map = carbon; m.color.setHex(0xffffff); m.needsUpdate = true; }
      else if (tire && hex === 0x121316 && m.map !== tire) { m.map = tire; m.color.setHex(0xffffff); m.needsUpdate = true; }
      else if (leather && (hex === 0x181c24 || hex === 0x10131a) && m.map !== leather) { m.map = leather; m.color.setHex(0xd8e0ec); m.needsUpdate = true; }
      else if (metal && hex === 0x262b33 && m.map !== metal) { m.map = metal; m.color.setHex(0xb8c2d0); m.needsUpdate = true; }
    });
  }

  buildBlobShadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 5.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.5, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
      })
    );
    this.blob.position.y = 0.03;
    this.blob.renderOrder = 2;
    this.carRig.root.add(this.blob);
  }

  disposeObject(o) {
    o.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      const ms = Array.isArray(c.material) ? c.material : c.material ? [c.material] : [];
      ms.forEach((m) => m.dispose());
    });
  }

  async loadVehicleGLB(url, loader) {
    try {
      const gltf = await (loader || new GLTFLoader()).loadAsync(url);
      return this.installVehicleModel(gltf.scene);
    } catch (_) {
      return false;
    }
  }

  installVehicleModel(model) {
    const rig = this.carRig, root = rig.root;
    const params = new URLSearchParams(location.search);
    const holder = new THREE.Group();
    holder.add(model);

    let box = new THREE.Box3().setFromObject(holder);
    let size = box.getSize(new THREE.Vector3());
    if (size.x > size.z) model.rotation.y = Math.PI / 2;
    if (params.get('carFlip') === '1') model.rotation.y += Math.PI;
    holder.updateMatrixWorld(true);
    size = box.setFromObject(holder).getSize(new THREE.Vector3());
    model.scale.multiplyScalar(4.79 / Math.max(size.z, 0.001));
    holder.updateMatrixWorld(true);
    box.setFromObject(holder);
    const c0 = box.getCenter(new THREE.Vector3());
    model.position.x -= c0.x;
    model.position.z -= c0.z;
    model.position.y -= box.min.y;
    holder.updateMatrixWorld(true);

    const keep = new Set([
      rig.lights.headSpotL, rig.lights.headSpotL.target,
      rig.lights.headSpotR, rig.lights.headSpotR.target,
      rig.lights.tailPointLight, rig.cockpitGroup
    ]);
    for (const ch of [...rig.bodyGroup.children]) {
      if (keep.has(ch)) continue;
      rig.bodyGroup.remove(ch);
      this.disposeObject(ch);
    }
    rig.bodyGroup.add(holder);
    root.updateMatrixWorld(true);

    const wheelRe = /(wheel|tire|tyre|rim|rotor|brake_?disc)/i;
    const nodes = [];
    model.traverse((o) => {
      if (o === model || !wheelRe.test(o.name || '')) return;
      for (let p = o.parent; p && p !== model; p = p.parent) if (wheelRe.test(p.name || '')) return;
      nodes.push(o);
    });
    const corners = new Map();
    for (const n of nodes) {
      const b = new THREE.Box3().setFromObject(n);
      const c = b.getCenter(new THREE.Vector3());
      if (Math.abs(c.x) < 0.4) continue;
      const key = `${c.z > 0 ? 'F' : 'R'}${c.x > 0 ? 'L' : 'R'}`;
      if (!corners.has(key)) corners.set(key, { nodes: [], box: new THREE.Box3(), front: c.z > 0 });
      const e = corners.get(key);
      e.nodes.push(n);
      e.box.union(b);
    }
    let wheelsOk = corners.size === 4;
    if (wheelsOk) {
      for (const e of corners.values()) {
        const d = e.box.getSize(new THREE.Vector3());
        if (Math.max(d.y, d.z) < 0.45 || Math.max(d.y, d.z) > 1.0) wheelsOk = false;
      }
    }
    if (wheelsOk) {
      const newWheels = [];
      for (const e of corners.values()) {
        const hub = holder.localToWorld(e.box.getCenter(new THREE.Vector3()).clone());
        const steer = new THREE.Group(), spin = new THREE.Group();
        steer.position.copy(root.worldToLocal(hub));
        steer.add(spin);
        root.add(steer);
        root.updateMatrixWorld(true);
        e.nodes.forEach((n) => spin.attach(n));
        newWheels.push({ steerPivot: steer, spinGroup: spin, isFront: e.front, baseY: steer.position.y });
      }
      (rig.wheels || []).forEach((w) => { root.remove(w.steerPivot); this.disposeObject(w.steerPivot); });
      rig.wheels = newWheels;
    }

    const paint = [], heads = [], tails = [], seen = new Map();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      const arr = Array.isArray(o.material) ? o.material : [o.material];
      const out = arr.map((m) => {
        if (seen.has(m)) return seen.get(m);
        const n = `${m.name || ''} ${o.name || ''}`;
        let r = m;
        if (/glass|window|windshield|windscreen/i.test(n)) {
          r = new THREE.MeshPhysicalMaterial({
            color: 0x0b0f14, metalness: 0, roughness: 0.04,
            transparent: true, opacity: 0.38, envMapIntensity: 1.6,
            depthWrite: false, side: THREE.FrontSide
          });
        } else if (/head.?(light|lamp)|\bdrl\b/i.test(n) && m.emissive) {
          m.emissive.set(0xd8f0ff); m.emissiveIntensity = 3; heads.push(m);
        } else if (/tail|brake.?light|rear.?(light|lamp)/i.test(n) && m.emissive) {
          m.emissive.set(0xff1111); m.emissiveIntensity = 1.2; tails.push(m);
        } else if (/tire|tyre|rubber/i.test(n)) {
          m.roughness = 0.85; m.metalness = 0;
        } else if (/paint|body|carpaint|exterior|shell/i.test(n)) {
          r = m.isMeshPhysicalMaterial ? m : new THREE.MeshPhysicalMaterial({
            color: m.color.clone(), map: m.map, normalMap: m.normalMap,
            roughness: Math.min(m.roughness ?? 0.3, 0.35), metalness: Math.max(m.metalness ?? 0, 0.8)
          });
          r.clearcoat = 1; r.clearcoatRoughness = 0.06;
          paint.push(r);
        }
        seen.set(m, r);
        return r;
      });
      o.material = Array.isArray(o.material) ? out : out[0];
    });
    rig.paintMats = paint;
    rig.headMats = heads;
    rig.tailMats = tails;
    rig.materials = {
      bodyPaintMat: paint[0] || rig.materials.bodyPaintMat,
      headlightMat: heads[0] || rig.materials.headlightMat,
      taillightMat: tails[0] || rig.materials.taillightMat,
      reverseLightMat: rig.materials.reverseLightMat
    };
    this.setPaint(this.state.paintHex, this.state.paintName, false);
    this.setHeadlights(this.state.headlightsOn);
    this.applyRealisticTier(this.hwTier, true);
    setText(UI.glbStatus, 'Custom GLB vehicle model installed.');
    return true;
  }

  applyBump() {
    const wantBump = this.cfg && this.cfg.bump && this.assets.asphalt ? this.assets.asphalt : null;
    const wantNorm = this.cfg && this.cfg.bump && this.assets.asphaltNormal ? this.assets.asphaltNormal : null;
    const m = this.roadMaterial;
    if (m.bumpMap !== wantBump || m.normalMap !== wantNorm) {
      m.bumpMap = wantBump;
      m.bumpScale = 0.24;
      m.normalMap = wantNorm;
      if (!m.normalScale) m.normalScale = new THREE.Vector2(0.55, 0.55);
      else m.normalScale.set(0.55, 0.55);
      m.needsUpdate = true;
    }
  }

  tAtPoint(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.roadSamples.length; i++) {
      const q = this.roadSamples[i].pt;
      const d = (q.x - x) * (q.x - x) + (q.z - z) * (q.z - z);
      if (d < bd) { bd = d; best = i; }
    }
    return this.roadSamples[best].t;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this._onPopState) window.removeEventListener('popstate', this._onPopState);
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
    if (this.renderer) this.renderer.dispose();
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
  // PHYSICS (Progressive Throttle & Brake + Auto/Manual 6-Speed Transmission)
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
      for (let o = -14; o <= 14; o++) {
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

    _vForward.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    _vLeft.set(_vForward.z, 0, -_vForward.x);
    const vl0 = p.vel.dot(_vForward);
    let vl = vl0;

    const throttleRate = inp.throttle ? 4.8 : 7.2;
    this.throttleVal += ((inp.throttle ? 1 : 0) - this.throttleVal) * Math.min(1, dt * throttleRate);
    this.brakeVal += ((inp.brake ? 1 : 0) - this.brakeVal) * Math.min(1, dt * 8.0);

    const gearTopMps = (GEAR_MAX_KMH[p.gear - 1] || 300) / 3.6;
    const gearTorqueMult = this.state.transMode === 'manual' && vl > gearTopMps * 1.03 ? 0.15 : 1.0;

    let acc = 0;
    if (this.throttleVal > 0.02) {
      acc += 11.8 * this.throttleVal * gearTorqueMult * Math.max(0, 1 - vl / 83) * Math.min(1, W.grip + 0.15);
    }
    if (inp.brake) {
      if (vl > 0.5) acc -= 15.8 * this.brakeVal * W.grip;
      else if (vl > -11) acc -= 5.2;
    }
    acc -= vl * 0.04 + Math.sign(vl) * 0.0011 * vl * vl;
    if (inp.handbrake && Math.abs(vl) > 0.3) acc -= Math.sign(vl) * 6.5;
    vl += acc * dt;
    if (!inp.throttle && !inp.brake && !inp.handbrake && Math.abs(vl) < 0.15) vl = 0;
    p.vel.addScaledVector(_vForward, vl - vl0);
    this.longAccel = acc;

    const speedAbs = Math.abs(vl);
    const maxSteer = (0.58 / (1 + speedAbs * 0.052)) * this.state.steerSens;
    const target = ((inp.left ? 1 : 0) - (inp.right ? 1 : 0)) * maxSteer;
    p.steerAngle += (target - p.steerAngle) * Math.min(1, dt * (target === 0 ? 9.5 : 6.2));
    let yawRate = (vl * Math.tan(p.steerAngle)) / 2.85;
    yawRate = THREE.MathUtils.clamp(yawRate, sim ? -1.8 : -1.3, sim ? 1.8 : 1.3);
    if (inp.handbrake && speedAbs > 8) yawRate *= 1.48;
    p.angularVel += (yawRate - p.angularVel) * Math.min(1, dt * 8.5);
    p.heading += p.angularVel * dt;

    _vForward.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    _vLeft.set(_vForward.z, 0, -_vForward.x);
    let vlF = p.vel.dot(_vForward);
    let vlat = p.vel.dot(_vLeft);
    let grip = (sim ? 5.6 : 9.2) * W.grip;
    if (inp.handbrake) grip = 1.15;
    grip = Math.max(grip, 12 * Math.max(0, 1 - p.vel.length() / 6));
    vlat *= Math.exp(-grip * dt);
    p.vel.copy(_vForward).multiplyScalar(vlF).addScaledVector(_vLeft, vlat);
    p.slipRatio = Math.min(1, Math.abs(vlat) / 5.5);

    p.pos.addScaledVector(p.vel, dt);

    const si = this.nearestSample(p.pos);
    const s = this.roadSamples[si];
    const relX = p.pos.x - s.pt.x, relZ = p.pos.z - s.pt.z;
    const lat = relX * s.right.x + relZ * s.right.z;
    const limit = this.halfRoad - 0.65;
    if (Math.abs(lat) > limit && !this.inJunction(p.pos)) {
      const side = Math.sign(lat);
      const over = lat - side * limit;
      p.pos.x -= s.right.x * over;
      p.pos.z -= s.right.z * over;
      _vNormal.copy(s.right).multiplyScalar(side);
      const vn = p.vel.dot(_vNormal);
      if (vn > 2.5) this.haptic();
      if (vn > 0) {
        p.vel.addScaledVector(_vNormal, -vn * 1.55);
        p.vel.multiplyScalar(0.92);
      }
    }
    p.pos.y = s.pt.y;

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
        this.haptic();
      }
    }

    vlF = p.vel.dot(_vForward);
    p.speedMps = Math.abs(vlF);
    p.speedKmh = vlF * 3.6;
    p.distanceMeters += p.speedMps * dt;

    p.fuel = Math.max(5.0, p.fuel - (p.speedMps * 0.00018 + this.throttleVal * 0.0014) * dt);
    const targetTemp = 88.0 + (p.rpm / 7200) * 14.0 + this.throttleVal * 4.0 - Math.min(6.0, p.speedMps * 0.08);
    p.engineTemp += (targetTemp - p.engineTemp) * Math.min(1, dt * 0.45);

    const kmh = Math.abs(p.speedKmh);
    if (this.state.transMode === 'auto') {
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
    }

    const g = p.gear;
    const lo = g === 1 ? 0 : GEAR_MAX_KMH[g - 2] * 0.75;
    const hi = GEAR_MAX_KMH[g - 1];
    const frac = THREE.MathUtils.clamp((kmh - lo) / Math.max(10, hi - lo), 0, 1.08);
    const rpmTarget = kmh < 2 ? 850 + this.throttleVal * 4800 : 850 + Math.min(1.03, 0.12 + 0.88 * frac) * 6350;
    p.rpm += (rpmTarget - p.rpm) * Math.min(1, dt * 9);
    p.rpm = THREE.MathUtils.clamp(p.rpm, 850, 7400);

    const pitchT = THREE.MathUtils.clamp(-acc * 0.0035, -0.06, 0.06);
    const rollT = THREE.MathUtils.clamp(p.angularVel * vlF * 0.0018, -0.08, 0.08);
    p.pitch += (pitchT - p.pitch) * Math.min(1, dt * 5);
    p.roll += (rollT - p.roll) * Math.min(1, dt * 5);
    p.wheelRotation += (vlF * dt) / 0.36;

    const th = Math.hypot(s.tangent.x, s.tangent.z) || 1;
    const dirSign = s.tangent.x * _vForward.x + s.tangent.z * _vForward.z >= 0 ? 1 : -1;
    p.slope += (-Math.atan2(s.tangent.y, th) * dirSign - p.slope) * Math.min(1, dt * 6);
    const sp = Math.min(1, p.speedMps / 25);
    const bump = (Math.sin(p.pos.x * 0.83 + p.pos.z * 1.17) + Math.sin(p.pos.x * 2.1 - p.pos.z * 1.7) * 0.5) * 0.0055 * sp;
    const heaveT = -Math.abs(p.roll) * 0.25 + bump;
    p.heaveVel += (-120 * (p.heave - heaveT) - 14 * p.heaveVel) * dt;
    p.heave = THREE.MathUtils.clamp(p.heave + p.heaveVel * dt, -0.06, 0.06);

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
    if (rig.steeringWheelGroup) rig.steeringWheelGroup.rotation.z = -p.steerAngle * 4.2;
    const tm = rig.tailMats || (rig.materials ? [rig.materials.taillightMat] : []);
    const braking = this.input.brake || this.input.handbrake;
    const be = braking ? 4.2 : 1.2;
    for (const m of tm) m.emissiveIntensity = be;
    if (rig.materials && rig.materials.reverseLightMat) rig.materials.reverseLightMat.emissiveIntensity = p.speedKmh < -1 ? 2.5 : 0;
    if (rig.lights) rig.lights.tailPointLight.intensity = braking ? 3.2 : 1.2;
  }

  // --------------------------------------------------------------------------
  // CAMERA (Elevated Chase Framing + Showroom + 5 Driving Views)
  // --------------------------------------------------------------------------
  updateCamera(dt) {
    const p = this.physics;
    _vForward.set(Math.sin(p.heading), 0, Math.cos(p.heading));
    _vLeft.set(_vForward.z, 0, -_vForward.x);
    let fov = this.state.fov;
    let snap = false, key;

    if (this.state.mode === 'INTRO') {
      key = 'INTRO';
      this.orbitAngle += dt * 0.55;
      const k = Math.min(1, this.state.introTimer / 6);
      const r = 9 + k;
      const a = p.heading + Math.PI * 0.9 + (1 - k) * 2.4;
      _vWantPos.set(p.pos.x + Math.sin(a) * r, p.pos.y + 2.1 + k, p.pos.z + Math.cos(a) * r);
      _vWantLook.copy(p.pos).add(new THREE.Vector3(0, 0.88, 0));
      snap = true;
    } else if (this.state.screen === 'GARAGE') {
      key = 'GARAGE';
      if (!this.garageDragActive) this.orbitAngle += dt * 0.18;
      const r = 5.4;
      const a = p.heading + this.orbitAngle;
      _vWantPos.set(p.pos.x + Math.sin(a) * r, p.pos.y + 1.32, p.pos.z + Math.cos(a) * r);
      _vWantLook.copy(p.pos).add(new THREE.Vector3(0, 0.68, 0));
      fov = 50;
    } else if (this.state.screen === 'MAIN_MENU' || this.state.screen === 'SETTINGS') {
      key = 'HERO';
      if (!this.garageDragActive) this.orbitAngle += dt * 0.08;
      const a = p.heading + 0.58 + Math.sin(this.orbitAngle) * 0.22;
      const r = 5.2;
      _vWantPos.set(p.pos.x + Math.sin(a) * r, p.pos.y + 1.15, p.pos.z + Math.cos(a) * r);
      _vWantLook.copy(p.pos).addScaledVector(_vLeft, -0.75).add(new THREE.Vector3(0, 0.68, 0));
      fov = 52;
    } else if (this.state.screen === 'PAUSE') {
      key = 'PAUSE';
      _vWantPos.copy(p.pos).addScaledVector(_vForward, -5.6).addScaledVector(_vLeft, 1.35);
      _vWantPos.y += 1.48;
      _vWantLook.copy(p.pos).addScaledVector(_vForward, 2.2).addScaledVector(_vLeft, 0.85);
      _vWantLook.y += 0.82;
      fov = 56;
    } else {
      const idx = this.state.cameraIndex;
      key = 'D' + idx;
      const spd = Math.min(1, Math.abs(p.speedKmh) / 200);

      if (idx === 0 || idx === 1) {
        const back = (idx === 0 ? 6.8 : 4.7) + spd * 1.4;
        const up = (idx === 0 ? 2.45 : 1.72) - spd * 0.18;
        _vWantPos.copy(p.pos).addScaledVector(_vForward, -back).addScaledVector(_vLeft, p.angularVel * -0.85);
        _vWantPos.y += up;
        _vWantLook.copy(p.pos).addScaledVector(_vForward, 4.5 + spd * 3.0).addScaledVector(_vLeft, p.angularVel * 1.5);
        _vWantLook.y += 0.42;
        fov += spd * 12;
      } else if (idx === 2) {
        snap = true;
        _vWantPos.copy(p.pos).addScaledVector(_vForward, 1.15);
        _vWantPos.y += 1.18 + p.heave;
        _vWantLook.copy(_vWantPos).addScaledVector(_vForward, 24);
        _vWantLook.y += (p.pitch + p.slope) * -12;
        fov += spd * 10;
      } else if (idx === 3) {
        _vWantPos.copy(p.pos).addScaledVector(_vLeft, -3.5).addScaledVector(_vForward, 1.35);
        _vWantPos.y += 1.05;
        _vWantLook.copy(p.pos).addScaledVector(_vForward, 0.35);
        _vWantLook.y += 0.72;
      } else {
        snap = true;
        _vWantPos.copy(p.pos).addScaledVector(_vForward, -0.14).addScaledVector(_vLeft, -0.36);
        _vWantPos.y += 1.13 + p.heave * 0.8;
        _vWantLook.copy(_vWantPos).addScaledVector(_vForward, 20).addScaledVector(_vLeft, p.steerAngle * 1.8);
        _vWantLook.y += -0.45 + (p.pitch + p.slope) * -10;
      }
    }

    if (this.state.screen !== 'DRIVING' || this.state.cameraIndex !== 4) {
      const minCamY = p.pos.y + 0.55;
      if (_vWantPos.y < minCamY) _vWantPos.y = minCamY;
    }

    if (!this.camInit) { this.camSmPos.copy(_vWantPos); this.camSmLook.copy(_vWantLook); this.camInit = true; }
    if (snap) {
      this.camSmPos.copy(_vWantPos);
      this.camSmLook.copy(_vWantLook);
    } else {
      const stiff = 6.0 * this.state.camSens;
      this.camSmPos.lerp(_vWantPos, 1 - Math.exp(-dt * stiff));
      this.camSmLook.lerp(_vWantLook, 1 - Math.exp(-dt * (stiff * 1.5)));
    }

    if (key !== this.camKey) {
      this.camFromPos.copy(this.camPos);
      this.camFromLook.copy(this.camLook);
      this.camBlend = this.camKey ? 0 : 1;
      this.camKey = key;
    }
    if (this.camBlend < 1) {
      this.camBlend = Math.min(1, this.camBlend + dt / 0.45);
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
  // PART 3: DIGITAL SPEEDOMETER & HUD UPDATE
  // --------------------------------------------------------------------------
  updateHUD() {
    const p = this.physics;
    const isMph = this.state.units === 'mph';
    const rawSpeed = Math.abs(p.speedKmh) * (isMph ? 0.621371 : 1.0);
    const speedRounded = Math.round(rawSpeed);
    const rpmRounded = Math.round(p.rpm / 10) * 10;

    let driveChar = this.state.transMode === 'manual' ? 'M' : 'D';
    let gearStr = String(p.gear);
    if (p.speedKmh < -1) {
      driveChar = 'R';
      gearStr = '1';
    } else if (Math.abs(p.speedKmh) < 1 && !this.input.throttle && this.state.transMode === 'auto') {
      driveChar = 'N';
      gearStr = '-';
    }

    setText(UI.speed, String(speedRounded));
    setText(UI.rpm, String(rpmRounded));
    setText(UI.driveChar, driveChar);
    setText(UI.gear, gearStr);
    setText(UI.fps, `${this.fps} FPS`);
    setText(UI.menuFps, `FPS: ${this.fps}`);
    setText(UI.fuel, `${Math.round(p.fuel)}%`);
    setText(UI.temp, `${Math.round(p.engineTemp)}°C`);

    const rpmFrac = THREE.MathUtils.clamp(p.rpm / 8000, 0.04, 1.0);
    const arcEl = $(UI.tachArc);
    if (arcEl) {
      const offset = TACH_ARC_LEN * (1 - rpmFrac);
      arcEl.style.strokeDashoffset = offset.toFixed(1);
    }

    const bar = $(UI.rpmBar);
    if (bar) bar.style.width = `${(p.rpm / 7200 * 100).toFixed(1)}%`;

    const isShiftZone = p.rpm >= 6250 && driveChar !== 'N' && driveChar !== 'R';
    const shiftPill = $(UI.shiftPill);
    const cluster = $(UI.cluster);
    if (shiftPill) shiftPill.classList.toggle('active', isShiftZone);
    if (cluster) cluster.classList.toggle('redline-shift', isShiftZone);

    const blinkOn = Math.floor(this.clock.elapsedTime * 3.5) % 2 === 0;
    const indL = $(UI.indLeft);
    const indR = $(UI.indRight);
    const indB = $(UI.indBrake);
    if (indL) indL.classList.toggle('active', this.input.left && blinkOn);
    if (indR) indR.classList.toggle('active', this.input.right && blinkOn);
    if (indB) indB.classList.toggle('active', this.input.handbrake || this.input.brake);

    if (this.carRig && this.carRig.cockpitScreen && this.state.cameraIndex === 4) {
      this.carRig.cockpitScreen.draw(speedRounded, gearStr, rpmRounded, isMph ? 'MPH' : 'KM/H');
    }

    const si = this.nearestSample(p.pos);
    const t = this.roadSamples[si].t;
    setText(UI.zone, this.zoneName(t));
    setText(UI.cityShort, this.zoneShortName(t));
  }

  // --------------------------------------------------------------------------
  // MAIN LOOP
  // --------------------------------------------------------------------------
  animate() {
    requestAnimationFrame(this.animate);
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.state.portraitPaused || this.contextLost) return;

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

    if (this.state.mode === 'DRIVING') {
      this.accum = Math.min(this.accum + dt, 0.1);
      while (this.accum >= PHYS_STEP) { this.updatePhysics(PHYS_STEP); this.accum -= PHYS_STEP; }
      this.updateTraffic(dt);
      this.updateParticles(dt);
    } else if (this.state.mode === 'PAUSED') {
      this.accum = 0;
    } else {
      this.accum = 0;
      this.physics.vel.multiplyScalar(Math.max(0, 1 - dt * 3));
      this.updateTraffic(dt);
      this.updateParticles(dt);
    }

    this.syncCarMesh();
    this.updateEnv(dt);
    this.updateCamera(dt);

    this.sky.position.copy(this.camera.position);
    this.sunLight.target.position.copy(this.physics.pos);
    this.sunLight.position.copy(this.physics.pos).add(this.sunOffset);
    const c = this.cfg;
    if (c && c.shadow && this.state.shadowsEnabled && c.every && this.frame % c.every === 0) {
      this.renderer.shadowMap.needsUpdate = true;
    }

    const p = this.physics;
    const inMenu = this.state.mode !== 'DRIVING';
    this.audio.update(p.rpm, this.throttleVal, p.slipRatio, Math.abs(p.speedKmh), this.input.brake ? 1 : 0, inMenu);

    this.hudAcc += dt;
    if (this.hudAcc >= 0.05) {
      this.hudAcc = 0;
      this.updateHUD();
      if (this.state.screen === 'DRIVING') this.drawMinimap();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// 5. BOOT (with built-in compact HUD style safeguard)
// ============================================================================
function boot() {
  try {
    if (!document.querySelector('link[href*="hud-upgrade.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './hud-upgrade.css';
      document.head.appendChild(link);
    }
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

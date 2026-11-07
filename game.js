import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VEHICLE_CATALOG, buildProceduralBMW, buildRivalBMWCoupe, buildNPCPedestrian, loadExternalGLBVehicle } from './carBuilder.js';

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
  // Touch buttons, manual gear paddles & Phase 2 M-Boost Nitro
  left: 'touch-left', right: 'touch-right', throttle: 'touch-throttle',
  brake: 'touch-brake', pbrake: 'touch-handbrake',
  gearUp: 'touch-gear-up', gearDown: 'touch-gear-down',
  nitro: 'touch-nitro', nitroPct: 'hud-nitro-pct',
  // Phase 2 Garage Tuning & Customizer IDs
  garageTabStyle: 'garage-tab-style', garageTabPerf: 'garage-tab-perf',
  garagePanelStyle: 'garage-panel-style', garagePanelPerf: 'garage-panel-perf',
  garageCredits: 'garage-credits', garageHpBadge: 'garage-hp-badge',
  lblUpgEngine: 'lbl-upg-engine', lblUpgBrakes: 'lbl-upg-brakes',
  lblUpgSusp: 'lbl-upg-susp', lblUpgNitro: 'lbl-upg-nitro',
  btnUpgEngine: 'btn-upg-engine', btnUpgBrakes: 'btn-upg-brakes',
  btnUpgSusp: 'btn-upg-susp', btnUpgNitro: 'btn-upg-nitro',
  // Phase 2 Multiplayer & Convoy Hub IDs
  mpScreen: 'multiplayer-screen', mpHome: 'btn-mp-home', mpBack: 'btn-mp-back', mpLaunch: 'btn-mp-launch',
  mpStatusPill: 'mp-status-pill', mpCallsign: 'mp-callsign-input', mpRoom: 'mp-room-input',
  mpJoin: 'btn-mp-join', mpHost: 'btn-mp-host', mpModeDesc: 'mp-mode-desc',
  mpPeerCount: 'mp-peer-count', mpRosterList: 'mp-roster-list', mpNametags: 'mp-nametags-layer',
  // Phase 2 HUD Event Telemetry, Hazard & Horn IDs
  hudEventBanner: 'hud-event-banner', hudEventMode: 'hud-event-mode',
  hudEventStatus: 'hud-event-status', hudSessionCredits: 'hud-session-credits',
  hudSkillToast: 'hud-skill-toast', hudHazard: 'btn-hud-hazard', hudHorn: 'btn-hud-horn',
  // Ultimate Evolution: Open-World Map, Missions, Vehicle Carousel & HUD Prompts
  openMap: 'btn-open-map', openMissions: 'btn-open-missions',
  carPrev: 'btn-car-prev', carNext: 'btn-car-next', vehicleCarousel: 'vehicle-carousel',
  worldMapScreen: 'world-map-screen', mapHome: 'btn-map-home', mapBack: 'btn-map-back',
  mapFastTravel: 'btn-map-fast-travel', mapClearWp: 'btn-map-clear-wp',
  worldMapCanvas: 'world-map-canvas', mapDiscoveredLabel: 'map-discovered-label',
  mapSelectedZone: 'map-selected-zone', mapPoiType: 'map-poi-type',
  mapPoiTitle: 'map-poi-title', mapPoiDesc: 'map-poi-desc',
  missionsScreen: 'missions-screen', missionsHome: 'btn-missions-home',
  missionsBack: 'btn-missions-back', missionsFreeroam: 'btn-missions-freeroam',
  missionsGrid: 'missions-grid', missionsProgress: 'missions-progress-label',
  missionModal: 'mission-complete-modal', missionModalTitle: 'mission-modal-title',
  missionModalDesc: 'mission-modal-desc', mmStatName: 'mm-stat-name',
  mmStatTime: 'mm-stat-time', mmStatReward: 'mm-stat-reward',
  mmStatBalance: 'mm-stat-balance', btnMissionClaim: 'btn-mission-claim',
  hudMapBtn: 'btn-hud-map', hudMissionPrompt: 'hud-mission-prompt',
  hudCountdown: 'hud-countdown-overlay'
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

const escapeHTML = (str) => String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sanitizeCallsign = (str) => String(str || '').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().slice(0, 16) || 'RR_PILOT';
const sanitizeHex = (str, fallback = '#168BFF') => /^#[0-9a-fA-F]{6}$/.test(String(str || '')) ? str : fallback;

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
    this.engineProfile = 'I6_TURBO';
    this.interiorView = false;
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
  playEngineStart(profile = 'I6_TURBO') {
    this.engineProfile = profile || 'I6_TURBO';
    this.init();
    if (!this.initialized || !this.enabled || !this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = profile === 'V10_SCREAM' ? 'sawtooth' : 'triangle';
      const baseF = profile === 'V8_RUMBLE' ? 68 : (profile === 'V10_SCREAM' ? 115 : 88);
      osc.frequency.setValueAtTime(baseF * 0.6, now);
      osc.frequency.exponentialRampToValueAtTime(baseF * 2.6, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(baseF * 1.1, now + 0.55);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.18 * this.engineVolume, now + 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.60);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.62);
    } catch (_) {}
  }

  playCollisionSound(intensity = 0.6) {
    this.init();
    if (!this.initialized || !this.enabled || !this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
      g.gain.setValueAtTime(Math.min(0.28, intensity * 0.22) * this.fxVolume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (_) {}
  }

  playHorn() {
    this.init();
    if (!this.initialized || !this.enabled || !this.ctx) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      for (const freq of [415, 498]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.11 * this.fxVolume, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 0.38);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.40);
      }
    } catch (_) {}
  }

  playBlinkerTick(high = true) {
    if (!this.enabled || !this.initialized || !this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(high ? 1180 : 860, now);
      g.gain.setValueAtTime(0.05 * this.fxVolume, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.028);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.032);
    } catch (_) {}
  }

  playRewardChime() {
    this.init();
    if (!this.initialized || !this.enabled || !this.ctx) return;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      [587.33, 880.0, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        g.gain.setValueAtTime(0.08 * this.fxVolume, now + idx * 0.055);
        g.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.055 + 0.24);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.26);
      });
    } catch (_) {}
  }

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
    const profMult = this.engineProfile === 'V10_SCREAM' ? 1.38 : (this.engineProfile === 'V8_RUMBLE' ? 0.78 : 1.0);
    const baseFreq = Math.max(24, (rpm / 60) * 1.5 * profMult);
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.osc2.frequency.setTargetAtTime(baseFreq * (this.engineProfile === 'V8_RUMBLE' ? 0.38 : 0.5), now, 0.03);
    this.osc3.frequency.setTargetAtTime(baseFreq * (this.engineProfile === 'V10_SCREAM' ? 2.5 : 2.0), now, 0.03);

    const exhaustMult = this.sportExhaust ? 1.55 : 0.9;
    const cabinMuffle = this.interiorView ? 0.62 : 1.0;
    const cutoff = (220 + (rpm / 7200) * 1400 * exhaustMult + throttle * 350) * cabinMuffle;
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
  sunrise: { sky: 0xd98a6c, sun: 0xffc288, sunI: 2.3, sunPos: [-130, 38, 90], hemi: 0.72, exp: 1.04, win: 0.22, env: 0.88, fog: 0.00070, label: 'SUNRISE', menu: 'SUNRISE DAWN', clock: '06:10', tempC: 17 },
  morning: { sky: 0x8fc0e8, sun: 0xfff5e4, sunI: 2.9, sunPos: [-80, 110, 70], hemi: 0.94, exp: 1.0, win: 0.0, env: 1.05, fog: 0.00048, label: 'DAYTIME', menu: 'DAYTIME CLEAR', clock: '12:30', tempC: 24 },
  sunset:  { sky: 0x7a4f52, sun: 0xffb870, sunI: 2.6, sunPos: [120, 45, 80], hemi: 0.65, exp: 1.05, win: 0.35, env: 0.85, fog: 0.00075, label: 'SUNSET', menu: 'GOLDEN HOUR', clock: '17:45', tempC: 26 },
  night:   { sky: 0x05070d, sun: 0x6f8cff, sunI: 0.35, sunPos: [-60, 80, -40], hemi: 0.24, exp: 1.25, win: 1.0, env: 0.28, fog: 0.0010, label: 'NIGHT', menu: 'NIGHT CITY', clock: '23:10', tempC: 16 }
};
const WEATHER_PRESETS = {
  clear:      { dark: 1.0, fogMul: 1.0, rain: 0, rough: 0.80, metal: 0.08, grip: 1.0, label: 'CLEAR', tempDelta: 0 },
  cloudy:     { dark: 0.86, fogMul: 1.35, rain: 0, rough: 0.74, metal: 0.12, grip: 0.95, label: 'CLOUDY', tempDelta: -2 },
  light_rain: { dark: 0.75, fogMul: 1.7, rain: 0.5, rough: 0.32, metal: 0.28, grip: 0.82, label: 'RAIN', tempDelta: -4 },
  heavy_rain: { dark: 0.52, fogMul: 2.9, rain: 1.0, rough: 0.18, metal: 0.38, grip: 0.68, label: 'STORM', tempDelta: -7 }
};
const GEAR_MAX_KMH = [55, 95, 140, 190, 240, 300];

const IS_MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);

const JUNCTION_Z = [-80, 70, 210];
const nearJunction = (pt, r) => JUNCTION_Z.some((jz) => Math.abs(pt.z - jz) < r && Math.abs(pt.x) < 16);

const SKY = {
  sunrise: { top: 0x2d4c7c, hor: 0xf49b72, glow: 1.3, mix: 0.65, tint: [1.2, 1.05, 0.95] },
  morning: { top: 0x2e73d2, hor: 0xbfd9ee, glow: 1.0, mix: 0.75, tint: [1.45, 1.52, 1.6] },
  sunset:  { top: 0x27345f, hor: 0xff9a5c, glow: 1.4, mix: 0.55, tint: [1.0, 0.95, 0.9] },
  night:   { top: 0x01030a, hor: 0x0a1322, glow: 0.25, mix: 0.0, tint: [0.1, 0.12, 0.2] }
};

// Part 4: Hardware Tier Profiles inside the single unified "REALISTIC" graphics option.
// Automatically selected at boot from device memory, CPU cores, and GPU capabilities,
// and dynamically adjusted at runtime to maintain smooth Android gameplay.

const GRAPHICS_PRESET_PROFILES = {
  performance: { name: 'PERFORMANCE // 60 FPS MOBILE', dpr: 1.05, res: 0.82, shadow: false, map: 512,  every: 4, spots: false,   tail: false, trees: 0.45, traffic: 8,  npcs: 8,  rain: 0.35, glass: false, coat: true, bump: false, far: 1800 },
  balanced:    { name: 'BALANCED // MOBILE HD',        dpr: 1.25, res: 0.92, shadow: true,  map: 1024, every: 2, spots: 'night', tail: false, trees: 0.68, traffic: 12, npcs: 14, rain: 0.60, glass: false, coat: true, bump: false, far: 2400 },
  high:        { name: 'HIGH // PBR ENHANCED',         dpr: 1.65, res: 1.00, shadow: true,  map: 1536, every: 1, spots: true,    tail: true,  trees: 0.88, traffic: 16, npcs: 22, rain: 0.85, glass: false, coat: true, bump: true,  far: 3000 },
  ultra:       { name: 'ULTRA // 4K SHOWCASE',         dpr: 2.25, res: 1.05, shadow: true,  map: 2048, every: 1, spots: true,    tail: true,  trees: 1.00, traffic: 20, npcs: 32, rain: 1.00, glass: true,  coat: true, bump: true,  far: 3600 }
};

const OPEN_WORLD_LANDMARKS = [
  { id: 'lm_city',       name: 'Centennial Glass Plaza',    zone: 'city',        t: 0.04, desc: 'Downtown luxury skyscraper district & central intersection.' },
  { id: 'lm_festival',   name: 'Horizon Festival Mainstage', zone: 'festival',   t: 0.18, desc: 'Electric-blue neon festival arches, grandstands, and crowd arena.' },
  { id: 'lm_forest',     name: 'Emerald Pine Village',      zone: 'countryside', t: 0.34, desc: 'Countryside timber cottages surrounded by dense pine woodland.' },
  { id: 'lm_mountain',   name: 'Alpine Summit Tunnel',      zone: 'highway',     t: 0.56, desc: 'High-altitude mountain ridge pass and illuminated rock tunnel.' },
  { id: 'lm_coast',      name: 'Azure Lakefront Pier',      zone: 'coast',       t: 0.74, desc: 'Panoramic coastal highway overlooking shimmering waters.' },
  { id: 'lm_industrial', name: 'Port Gantry & Drift Yard',  zone: 'industrial',  t: 0.90, desc: 'Shipping container port, logistics warehouses, and drift pad.' }
];

const MISSION_CATALOG = [
  { id: 'm_street_race',  title: 'Horizon Street Race',      type: 'STREET RACE',      startT: 0.06, checkpoints: 6, timeLimit: 85,  targetSpeed: 0,   reward: 20000, desc: 'Battle AI rivals across Downtown and the Festival circuit through 6 checkpoints.' },
  { id: 'm_checkpoint',   title: 'Electric Checkpoint Blitz', type: 'CHECKPOINT',      startT: 0.18, checkpoints: 8, timeLimit: 95,  targetSpeed: 0,   reward: 15000, desc: 'Beat the countdown clock through 8 Horizon checkpoints.' },
  { id: 'm_time_trial',   title: 'Alpine Mountain Time Trial', type: 'TIME TRIAL',     startT: 0.48, checkpoints: 5, timeLimit: 70,  targetSpeed: 0,   reward: 18000, desc: 'Pure high-speed precision sprint through the Alpine Pass and Tunnel.' },
  { id: 'm_speed_trap',   title: '240 KM/H Highway Radar',    type: 'SPEED CHALLENGE', startT: 0.28, checkpoints: 2, timeLimit: 60,  targetSpeed: 240, reward: 12000, desc: 'Accelerate past 240 KM/H before hitting the highway radar gate.' },
  { id: 'm_highway',      title: 'Highway Traffic Slalom',    type: 'HIGHWAY EVENT',   startT: 0.66, checkpoints: 5, timeLimit: 80,  targetSpeed: 0,   reward: 14000, desc: 'Thread through moving coastal highway traffic across 5 gates.' },
  { id: 'm_exploration',  title: 'Horizon Landmark Tour',     type: 'EXPLORATION',     startT: 0.35, checkpoints: 4, timeLimit: 110, targetSpeed: 0,   reward: 16000, desc: 'Explore the Countryside, Mountain Pass, and Coastline vista points.' },
  { id: 'm_delivery',     title: 'VIP Prototype Delivery',    type: 'DELIVERY',        startT: 0.12, checkpoints: 6, timeLimit: 90,  targetSpeed: 0,   reward: 22000, desc: 'Deliver the prototype vehicle to the Industrial Port before time expires.' },
  { id: 'm_drift',        title: 'Industrial Drift Mastery',  type: 'DRIFT EVENT',     startT: 0.88, checkpoints: 4, timeLimit: 75,  targetSpeed: 0,   reward: 15000, desc: 'Slide through the Industrial Port & Downtown corners to complete 4 drift gates.' }
];

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
      rimHex: '#262a30',
      caliperHex: '#0055aa',
      underglowHex: 'off',
      credits: 125000,
      upgrades: { engine: 0, brakes: 0, susp: 0, nitro: 1 },
      garageTab: 'style',
      selectedVehicleId: 'm4_comp',
      previewVehicleId: 'm4_comp',
      unlockedVehicles: ['m4_comp', 'm2_cs', 'm8_gt'],
      completedMissions: [],
      discoveredLandmarks: ['lm_city'],
      mpCallsign: 'RR_PILOT_01',
      mpRoom: 'BMW-884',
      mpMode: 'convoy', // 'convoy' | 'sprint' | 'overtake'
      mpRivalCount: 3,
      signalMode: 'off', // 'off' | 'left' | 'right' | 'hazard'
      portraitPaused: false,
      portraitDismissed: false
    };

    this.navStack = ['MAIN_MENU'];
    this.suppressPop = false;
    this.exitModalContext = 'APP';
    this.pendingPaintHex = this.state.paintHex;
    this.pendingPaintName = this.state.paintName;

    this.input = { left: false, right: false, throttle: false, brake: false, handbrake: false, nitro: false };

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
      nitro: 100.0,
      distanceMeters: 0
    };

    this.audio = new AutomotiveAudioEngine();
    this.traffic = [];
    this.rivals = [];
    this.npcs = [];
    this.worldChunks = [];
    this.missionBeacons = [];
    this.activeMission = null;
    this.nearbyMission = null;
    this.countdownTimer = 0;
    this.gpsWaypoint = null;
    this.selectedMapZone = 'city';
    this.peerInstance = null;
    this.peerConnections = new Map();
    this.mpHeartbeatAcc = 0;
    this.mpPeers = new Map();
    this.mpChannel = null;
    this.mpBroadcastAcc = 0;
    this.checkpoints = [];
    this.sprintActive = false;
    this.sprintIndex = 0;
    this.sprintTime = 0;
    this.overtakeCombo = 1;
    this.overtakeTimer = 0;
    this.toastTimer = 0;
    this.lastBlinkState = false;
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
    this.initPhase2Systems();
    this.bindPhase2UIEvents();
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
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        const rendererStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
        if (/Mali-G52|Mali-G57|Mali-G68|Adreno \(TM\) 61|PowerVR/i.test(rendererStr)) {
          return 0; // Realme 9i 5G (Mali-G57 MC2) & mid-range mobile GPUs get locked 60 FPS Tier 0 profile
        }
      }
    } catch (_) {}
    if (!IS_MOBILE && cores >= 8 && mem >= 8) return 2;
    if (IS_MOBILE) return mem >= 8 && cores >= 8 ? 1 : 0;
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
      if (typeof d.rimHex === 'string') this.state.rimHex = d.rimHex;
      if (typeof d.caliperHex === 'string') this.state.caliperHex = d.caliperHex;
      if (typeof d.underglowHex === 'string') this.state.underglowHex = d.underglowHex;
      if (typeof d.credits === 'number' && Number.isFinite(d.credits)) this.state.credits = Math.max(0, Math.round(d.credits));
      if (d.upgrades && typeof d.upgrades === 'object') {
        for (const k of ['engine', 'brakes', 'susp', 'nitro']) {
          if (typeof d.upgrades[k] === 'number') this.state.upgrades[k] = THREE.MathUtils.clamp(d.upgrades[k], 0, 3);
        }
      }
      if (typeof d.mpCallsign === 'string' && d.mpCallsign.trim()) this.state.mpCallsign = d.mpCallsign.trim().slice(0, 16);
      if (typeof d.mpRoom === 'string' && d.mpRoom.trim()) this.state.mpRoom = d.mpRoom.trim().slice(0, 10);
      if (typeof d.selectedVehicleId === 'string' && VEHICLE_CATALOG.some((v) => v.id === d.selectedVehicleId)) {
        this.state.selectedVehicleId = d.selectedVehicleId;
        this.state.previewVehicleId = d.selectedVehicleId;
      }
      if (Array.isArray(d.unlockedVehicles)) {
        this.state.unlockedVehicles = Array.from(new Set(['m4_comp', 'm2_cs', 'm8_gt', ...d.unlockedVehicles]));
      }
      if (Array.isArray(d.completedMissions)) this.state.completedMissions = d.completedMissions;
      if (Array.isArray(d.discoveredLandmarks)) this.state.discoveredLandmarks = Array.from(new Set(['lm_city', ...d.discoveredLandmarks]));
      if (typeof d.preset === 'string') this.state.preset = d.preset;
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
        rimHex: this.state.rimHex,
        caliperHex: this.state.caliperHex,
        underglowHex: this.state.underglowHex,
        credits: this.state.credits,
        upgrades: this.state.upgrades,
        mpCallsign: this.state.mpCallsign,
        mpRoom: this.state.mpRoom,
        selectedVehicleId: this.state.selectedVehicleId,
        unlockedVehicles: this.state.unlockedVehicles,
        completedMissions: this.state.completedMissions,
        discoveredLandmarks: this.state.discoveredLandmarks,
        preset: this.state.preset,
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

    const mmEl = $(UI.missionModal);
    if (mmEl && !mmEl.classList.contains('hidden')) {
      show(UI.missionModal, false);
      return;
    }

    if (cur === 'SETTINGS' || cur === 'MULTIPLAYER' || cur === 'WORLD_MAP' || cur === 'MISSIONS') {
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
    show(UI.mpScreen, screen === 'MULTIPLAYER');
    show(UI.worldMapScreen, screen === 'WORLD_MAP');
    show(UI.missionsScreen, screen === 'MISSIONS');
    show(UI.settings, screen === 'SETTINGS');
    show(UI.pauseMenu, screen === 'PAUSE');
    show(UI.hud, screen === 'DRIVING');

    if (this.rivals) {
      const showRivals = screen !== 'GARAGE';
      this.rivals.forEach((r) => { if (r.mesh) r.mesh.visible = showRivals; });
    }
    if (screen === 'WORLD_MAP') this.drawInteractiveWorldMap();
    if (screen === 'MISSIONS') this.renderMissionsGrid();

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
      this.state.previewVehicleId = this.state.selectedVehicleId;
      this.renderVehicleCarousel();
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
  replaceCanvasElement() {
    if (!this.canvas || !this.canvas.parentNode) return this.canvas;
    const fresh = this.canvas.cloneNode(false);
    this.canvas.parentNode.replaceChild(fresh, this.canvas);
    this.canvas = fresh;
    _els.set('game-canvas', fresh);
    return fresh;
  }

  createSoftwareFallbackRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth || 1024;
    let height = window.innerHeight || 512;
    canvas.width = width;
    canvas.height = height;
    const self = this;

    return {
      domElement: canvas,
      isSoftwareFallback: true,
      outputColorSpace: THREE.SRGBColorSpace,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      shadowMap: { enabled: false, type: THREE.PCFShadowMap, autoUpdate: false, needsUpdate: false },
      capabilities: { isWebGL2: false, getMaxAnisotropy: () => 1 },
      setPixelRatio() {},
      setSize(w, h) {
        width = Math.max(1, Math.floor(w));
        height = Math.max(1, Math.floor(h));
        canvas.width = width;
        canvas.height = height;
      },
      render() {
        if (!ctx) return;
        const p = self.physics || { speedKmh: 0, distanceMeters: 0, steerAngle: 0 };
        const tod = self.state ? self.state.timeOfDay : 'sunset';
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.56);
        if (tod === 'night') {
          skyGrad.addColorStop(0, '#040711');
          skyGrad.addColorStop(1, '#101d38');
        } else if (tod === 'morning') {
          skyGrad.addColorStop(0, '#2b5ea8');
          skyGrad.addColorStop(1, '#b8d8f0');
        } else {
          skyGrad.addColorStop(0, '#1b294d');
          skyGrad.addColorStop(0.65, '#7e4e60');
          skyGrad.addColorStop(1, '#f59856');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.56);

        const groundGrad = ctx.createLinearGradient(0, height * 0.54, 0, height);
        groundGrad.addColorStop(0, '#141923');
        groundGrad.addColorStop(1, '#090c12');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, height * 0.54, width, height * 0.46);

        const hx = width * 0.5 - (p.steerAngle || 0) * 140;
        const hy = height * 0.54;
        ctx.fillStyle = '#1d222c';
        ctx.beginPath();
        ctx.moveTo(hx - width * 0.05, hy);
        ctx.lineTo(hx + width * 0.05, hy);
        ctx.lineTo(width * 0.92, height);
        ctx.lineTo(width * 0.08, height);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e8e2cc';
        ctx.lineWidth = 4;
        ctx.setLineDash([28, 28]);
        ctx.lineDashOffset = -((p.distanceMeters || 0) * 12) % 56;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(width * 0.5, height);
        ctx.stroke();
        ctx.setLineDash([]);

        const cx = width * 0.5, cy = height * 0.75;
        const cw = Math.min(260, width * 0.24), ch = cw * 0.48;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + ch * 0.48, cw * 0.58, ch * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (self.state && self.state.paintHex) ? self.state.paintHex : '#0a2b6e';
        ctx.beginPath();
        ctx.roundRect(cx - cw * 0.5, cy - ch * 0.35, cw, ch * 0.72, 14);
        ctx.fill();

        ctx.fillStyle = '#0e1522';
        ctx.beginPath();
        ctx.roundRect(cx - cw * 0.36, cy - ch * 0.68, cw * 0.72, ch * 0.38, 10);
        ctx.fill();

        ctx.fillStyle = '#ff1e26';
        ctx.fillRect(cx - cw * 0.46, cy - ch * 0.18, cw * 0.24, ch * 0.11);
        ctx.fillRect(cx + cw * 0.22, cy - ch * 0.18, cw * 0.24, ch * 0.11);
      },
      dispose() {}
    };
  }

  initWebGL() {
    const configs = [
      { label: 'WebGL 2 High-Performance AA', ctxTypes: ['webgl2'], attrs: { antialias: true, powerPreference: 'high-performance', alpha: false } },
      { label: 'WebGL 2 Balanced No-AA', ctxTypes: ['webgl2'], attrs: { antialias: false, powerPreference: 'default', alpha: false } },
      { label: 'WebGL 1 / Compatible Fallback', ctxTypes: ['webgl2', 'webgl', 'experimental-webgl'], attrs: { antialias: false, alpha: false, failIfMajorPerformanceCaveat: false } }
    ];

    let lastErr = null;
    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      if (i > 0) this.replaceCanvasElement();
      try {
        let gl = null;
        for (const t of cfg.ctxTypes) {
          try {
            gl = this.canvas.getContext(t, cfg.attrs);
            if (gl) break;
          } catch (_) {}
        }
        if (gl) {
          this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, context: gl, ...cfg.attrs });
        } else {
          this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, ...cfg.attrs });
        }
        this.glProfileLabel = cfg.label;
        break;
      } catch (err) {
        lastErr = err;
        this.renderer = null;
      }
    }

    if (!this.renderer) {
      console.warn('Hardware WebGL unavailable; activating Canvas2D Safe-Mode Fallback Renderer:', lastErr);
      this.replaceCanvasElement();
      this.renderer = this.createSoftwareFallbackRenderer(this.canvas);
      this.glProfileLabel = 'Canvas2D Safe-Mode Fallback';
    }

    const isWebGL2 = Boolean(this.renderer.capabilities && this.renderer.capabilities.isWebGL2);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    if (!this.renderer.isSoftwareFallback) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = isWebGL2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      this.renderer.shadowMap.autoUpdate = false;
      this.renderer.shadowMap.needsUpdate = true;
    }

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

    if (!this.renderer.isSoftwareFallback) {
      try {
        const pmremGenerator = (this.pmrem = new THREE.PMREMGenerator(this.renderer));
        this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      } catch (_) {
        this.pmrem = null;
      }
    } else {
      this.pmrem = null;
    }

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
    const trafficColors = [0xd8dee9, 0x168bff, 0x5e81ac, 0xbf616a, 0x2e3440, 0xebcb8b, 0x125432];
    const vehicleTypes = [
      { type: 'sedan',  w: 1.86, h: 0.62, l: 4.45, cw: 1.54, ch: 0.46, cl: 2.10, spd: 16.5 },
      { type: 'suv',    w: 2.02, h: 0.78, l: 4.72, cw: 1.72, ch: 0.58, cl: 2.65, spd: 14.8 },
      { type: 'coupe',  w: 1.92, h: 0.54, l: 4.32, cw: 1.48, ch: 0.40, cl: 1.78, spd: 19.5 },
      { type: 'van',    w: 2.08, h: 1.15, l: 5.10, cw: 1.96, ch: 0.72, cl: 3.40, spd: 12.8 }
    ];
    for (let i = 0; i < count; i++) {
      const vt = vehicleTypes[i % vehicleTypes.length];
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: trafficColors[i % trafficColors.length],
        metalness: 0.75,
        roughness: 0.22
      });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(vt.w, vt.h, vt.l), mat);
      chassis.position.y = vt.h * 0.5 + 0.22;
      chassis.castShadow = true;
      group.add(chassis);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(vt.cw, vt.ch, vt.cl),
        new THREE.MeshStandardMaterial({ color: 0x0d131c, roughness: 0.08, metalness: 0.8 })
      );
      cabin.position.set(0, vt.h + vt.ch * 0.42 + 0.18, -0.15);
      group.add(cabin);

      const hl = new THREE.Mesh(new THREE.BoxGeometry(vt.w * 0.82, 0.11, 0.08), new THREE.MeshBasicMaterial({ color: 0xdff6ff }));
      hl.position.set(0, vt.h * 0.55 + 0.22, vt.l * 0.5 + 0.01);
      group.add(hl);

      const tlMat = new THREE.MeshBasicMaterial({ color: 0xaa1111 });
      const tl = new THREE.Mesh(new THREE.BoxGeometry(vt.w * 0.82, 0.12, 0.08), tlMat);
      tl.position.set(0, vt.h * 0.62 + 0.22, -vt.l * 0.5 - 0.01);
      group.add(tl);

      this.scene.add(group);
      this.traffic.push({
        type: vt.type,
        mesh: group,
        tlMat,
        t: (i / count + 0.04) % 1.0,
        baseSpeed: vt.spd + (i % 3) * 1.4,
        speed: vt.spd,
        laneOffset: i % 2 === 0 ? 3.8 : -3.8,
        dir: i % 2 === 0 ? 1 : -1
      });
    }
  }

  // --------------------------------------------------------------------------
  // VEHICLE, GARAGE TURNTABLE RING & WEATHER PARTICLES
  // --------------------------------------------------------------------------
  buildVehicle() {
    this.carRig = buildProceduralBMW(this.state.selectedVehicleId || 'm4_comp');
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
    const u = this.state.upgrades || { engine: 0, brakes: 0, susp: 0, nitro: 1 };
    const curId = this.state.previewVehicleId || this.state.selectedVehicleId || 'm4_comp';
    const spec = VEHICLE_CATALOG.find((v) => v.id === curId) || VEHICLE_CATALOG[0];
    const isMph = this.state.units === 'mph';
    const topKmh = spec.topSpeedKmh + u.engine * 14;
    const topDisp = isMph ? `${Math.round(topKmh * 0.621371)} MPH` : `${topKmh} KM/H`;
    const accelSec = Math.max(2.1, spec.accel0to100 - u.engine * 0.18 - u.nitro * 0.05).toFixed(1);
    const hp = spec.hp + u.engine * 65 + u.nitro * 15;

    setText(UI.garageCredits, `${this.state.credits.toLocaleString()} CR`);
    setText(UI.garageHpBadge, `${hp} HP`);
    setText(UI.statSpeedVal, topDisp);
    setText(UI.statAccelVal, `${accelSec}s 0-100`);
    setText(UI.statHandlingVal, u.susp > 0 ? `KW V4 STAGE ${u.susp}` : 'M-DYNAMIC PRO');
    setText(UI.statBrakeVal, u.brakes > 0 ? `CERAMIC STG ${u.brakes}` : '6-PISTON M');

    const setBar = (id, pct) => { const el = $(id); if (el) el.style.width = `${Math.min(100, pct)}%`; };
    setBar(UI.statBarSpeed, 84 + u.engine * 5);
    setBar(UI.statBarAccel, 82 + u.engine * 4 + u.nitro * 2);
    setBar(UI.statBarHandling, 82 + u.susp * 6);
    setBar(UI.statBarBraking, 80 + u.brakes * 6.5);

    const syncUpgCard = (lblId, btnId, stage, baseCost) => {
      setText(lblId, `STAGE ${stage}/3`);
      const btn = $(btnId);
      if (btn) {
        if (stage >= 3) {
          btn.textContent = 'MAX STAGE INSTALLED';
          btn.disabled = true;
        } else {
          btn.textContent = `UPGRADE • ${(baseCost * (stage + 1)).toLocaleString()} CR`;
          btn.disabled = false;
        }
      }
    };
    syncUpgCard(UI.lblUpgEngine, UI.btnUpgEngine, u.engine, 15000);
    syncUpgCard(UI.lblUpgBrakes, UI.btnUpgBrakes, u.brakes, 12000);
    syncUpgCard(UI.lblUpgSusp, UI.btnUpgSusp, u.susp, 12000);
    syncUpgCard(UI.lblUpgNitro, UI.btnUpgNitro, u.nitro, 15000);
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
    const presetKey = this.state.preset || 'realistic';
    const CFG = (presetKey !== 'realistic' && GRAPHICS_PRESET_PROFILES[presetKey])
      ? GRAPHICS_PRESET_PROFILES[presetKey]
      : REALISTIC_TIERS[clampedTier];
    this.cfg = CFG;

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
    const mapT = { city: 0.02, festival: 0.18, countryside: 0.34, highway: 0.50, mountain: 0.50, coast: 0.74, industrial: 0.89 };
    const t = mapT[zone] !== undefined ? mapT[zone] : ((this.zoneSpawn && this.zoneSpawn[zone]) ?? 0);
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
    if (t < 0.14) return 'DOWNTOWN METROPOLIS';
    if (t < 0.27) return 'HORIZON FESTIVAL GROUNDS';
    if (t < 0.44) return 'EMERALD FOREST & VILLAGE';
    if (t < 0.62) return 'ALPINE MOUNTAIN PASS';
    if (t < 0.82) return 'AZURE COASTAL LAKEFRONT';
    return 'INDUSTRIAL PORT & DRIFT YARD';
  }

  zoneShortName(t) {
    if (t < 0.14) return 'City';
    if (t < 0.27) return 'Festival';
    if (t < 0.44) return 'Forest';
    if (t < 0.62) return 'Mountain';
    if (t < 0.82) return 'Coast';
    return 'Industrial';
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

    // Draw GPS Waypoint line & Mission Markers on Minimap
    if (this.gpsWaypoint) {
      const [wx, wy] = this.mmPoint(this.gpsWaypoint.x, this.gpsWaypoint.z);
      g.strokeStyle = '#168BFF';
      g.lineWidth = 2.5;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(m.w / 2, m.h / 2);
      g.lineTo(wx, wy);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#00f5d4';
      g.beginPath();
      g.arc(wx, wy, 4.2, 0, Math.PI * 2);
      g.fill();
    }
    if (this.missionBeacons) {
      g.fillStyle = '#168BFF';
      for (const mb of this.missionBeacons) {
        const [mx, my] = this.mmPoint(mb.pt.x, mb.pt.z);
        g.fillRect(mx - 2.5, my - 2.5, 5, 5);
      }
    }
    // Draw AI Convoy Rivals & P2P Peers on Minimap
    g.fillStyle = '#ff385c';
    for (const r of this.rivals) {
      const [rx, ry] = this.mmPoint(r.mesh.position.x, r.mesh.position.z);
      g.beginPath();
      g.arc(rx, ry, 3.2, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#00ffaa';
    this.mpPeers.forEach((peer) => {
      const [px, py] = this.mmPoint(peer.mesh.position.x, peer.mesh.position.z);
      g.beginPath();
      g.arc(px, py, 3.8, 0, Math.PI * 2);
      g.fill();
    });

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
    on(UI.openMultiplayer, 'click', () => {
      this.audio.playUIClick(true);
      this.renderMultiplayerRoster();
      this.navigateTo('MULTIPLAYER');
    });
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
    this.bindChips('#preset-select .chip-btn', 'preset', (v) => {
      this.state.preset = v || 'realistic';
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
      ArrowUp: 'throttle', KeyW: 'throttle', ArrowDown: 'brake', KeyS: 'brake', Space: 'handbrake',
      ShiftLeft: 'nitro', ShiftRight: 'nitro', KeyB: 'nitro'
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
      else if (e.code === 'KeyV') this.audio.playHorn();
      else if (e.code === 'KeyH') this.toggleSignal('hazard');
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

  // --------------------------------------------------------------------------
  // PHASE 2 ULTIMATE EVOLUTION: BIOMES, NPCS, VEHICLES, MISSIONS, MAP & P2P/WEBRTC
  // --------------------------------------------------------------------------
  disposeObject3D(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m && m.dispose && m.dispose());
      }
    });
  }

  initPhase2Systems() {
    this.setRimColor(this.state.rimHex, false);
    this.setCaliperColor(this.state.caliperHex, false);
    this.setUnderglow(this.state.underglowHex, false);
    this.buildOpenWorldBiomesAndChunks();
    this.buildNPCPopulation(32);
    this.buildMissionBeacons();
    this.spawnConvoyRivals(this.state.mpRivalCount);
    this.buildSprintCheckpoints();
    this.connectMultiplayerChannel(this.state.mpRoom);
    this.renderVehicleCarousel();
    this.updateGarageStatsUI();
    this.renderMultiplayerRoster();
    this.renderMissionsGrid();

    window.addEventListener('beforeunload', () => {
      this.sendMultiplayerPacket({ type: 'leave', id: this.clientId });
    });
  }

  // --- SECTION 4: 6-BIOME OPEN WORLD & CHUNK STREAMING ---
  buildOpenWorldBiomesAndChunks() {
    this.worldChunks = [];
    const S = this.roadSamples;
    if (!S || !S.length) return;

    // Create 12 spatial chunks along the road loop for distance-based streaming
    const numChunks = 12;
    for (let c = 0; c < numChunks; c++) {
      const group = new THREE.Group();
      const centerSample = S[Math.floor((c / numChunks) * S.length)];
      this.scene.add(group);
      this.worldChunks.push({ index: c, center: centerSample.pt.clone(), group });
    }

    const getChunkGroup = (t) => {
      const idx = Math.min(numChunks - 1, Math.floor(t * numChunks));
      return this.worldChunks[idx].group;
    };

    // 1. Horizon Festival Grounds (t = 0.14 .. 0.26): Electric-blue Festival Arches & Grandstands
    const archGeo = new THREE.TorusGeometry(11.5, 0.38, 10, 32, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({ color: 0x168bff });
    for (const ft of [0.16, 0.19, 0.22, 0.25]) {
      const pt = this.roadCurve.getPointAt(ft);
      const tan = this.roadCurve.getTangentAt(ft);
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.copy(pt);
      arch.rotation.y = Math.atan2(tan.x, tan.z);
      getChunkGroup(ft).add(arch);
    }

    // 2. Emerald Forest & Countryside Village Cottages (t = 0.29 .. 0.43)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc2, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a3b2e, roughness: 0.75 });
    for (let i = 0; i < 14; i++) {
      const vt = 0.30 + (i / 14) * 0.12;
      const pt = this.roadCurve.getPointAt(vt);
      const tan = this.roadCurve.getTangentAt(vt);
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const house = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 5.2), wallMat);
      base.position.y = 1.9;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4).rotateY(Math.PI / 4), roofMat);
      roof.position.y = 4.9;
      house.add(base, roof);
      house.position.copy(pt).addScaledVector(right, side * (this.halfRoad + 14 + (i % 3) * 4));
      house.rotation.y = Math.atan2(tan.x, tan.z);
      getChunkGroup(vt).add(house);
    }

    // 3. Industrial Port & Shipping Container Yard (t = 0.84 .. 0.96)
    const containerColors = [0x168bff, 0xc0392b, 0x27ae60, 0xd35400, 0x2c3e50];
    const contGeo = new THREE.BoxGeometry(2.6, 2.7, 6.2);
    for (let i = 0; i < 24; i++) {
      const it = 0.85 + (i / 24) * 0.10;
      const pt = this.roadCurve.getPointAt(it);
      const tan = this.roadCurve.getTangentAt(it);
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const cMat = new THREE.MeshStandardMaterial({ color: containerColors[i % containerColors.length], metalness: 0.55, roughness: 0.45 });
      const box = new THREE.Mesh(contGeo, cMat);
      const stackH = (i % 3 === 0) ? 4.05 : 1.35;
      box.position.copy(pt).addScaledVector(right, side * (this.halfRoad + 11 + (i % 4) * 3.2));
      box.position.y = pt.y + stackH;
      box.rotation.y = Math.atan2(tan.x, tan.z);
      getChunkGroup(it).add(box);
    }

    // 4. Discoverable Landmark Beacons
    this.landmarkMeshes = [];
    const lmGeo = new THREE.CylinderGeometry(0.45, 0.45, 16, 12);
    const lmMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.42, depthWrite: false });
    OPEN_WORLD_LANDMARKS.forEach((lm) => {
      const pt = this.roadCurve.getPointAt(lm.t);
      const tan = this.roadCurve.getTangentAt(lm.t);
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const pos = pt.clone().addScaledVector(right, this.halfRoad + 5.5);
      const pillar = new THREE.Mesh(lmGeo, lmMat);
      pillar.position.copy(pos);
      pillar.position.y += 8.0;
      getChunkGroup(lm.t).add(pillar);
      this.landmarkMeshes.push({ lm, pos, pillar });
    });
  }

  updateWorldStreaming() {
    const pPos = this.physics.pos;
    const streamRadius = (this.cfg && this.cfg.far) ? Math.min(950, this.cfg.far * 0.42) : 720;
    for (const chunk of this.worldChunks) {
      const d = pPos.distanceTo(chunk.center);
      chunk.group.visible = d <= streamRadius;
    }

    // Check Landmark Discovery
    if (this.landmarkMeshes) {
      for (const item of this.landmarkMeshes) {
        if (!this.state.discoveredLandmarks.includes(item.lm.id)) {
          if (pPos.distanceTo(item.pos) < 38) {
            this.state.discoveredLandmarks.push(item.lm.id);
            this.audio.playRewardChime();
            this.addCredits(2500, `LANDMARK DISCOVERED: ${item.lm.name.toUpperCase()} • +2,500 CR`);
            setText(UI.mapDiscoveredLabel, `LANDMARKS DISCOVERED: ${this.state.discoveredLandmarks.length} / ${OPEN_WORLD_LANDMARKS.length}`);
            this.saveSettings();
          }
        }
      }
    }
  }

  // --- SECTION 5: BELIEVABLE ANIMATED NPC PEDESTRIANS ---
  buildNPCPopulation(maxCount = 32) {
    this.npcs.forEach((n) => {
      this.scene.remove(n.rig.root);
      this.disposeObject3D(n.rig.root);
    });
    this.npcs = [];
    const shirts = [0x168bff, 0xe63946, 0x2a9d8f, 0xf4a261, 0xe9c46a, 0x8ecae6, 0xffffff];
    const pants = [0x151d29, 0x264653, 0x1d3557, 0x2b2d42];
    const skins = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];

    for (let i = 0; i < maxCount; i++) {
      const rig = buildNPCPedestrian(shirts[i % shirts.length], pants[i % pants.length], skins[i % skins.length]);
      this.scene.add(rig.root);
      // Distribute NPCs across City, Festival Grounds, and Village sidewalks
      const zoneSlots = [0.02, 0.05, 0.09, 0.13, 0.17, 0.21, 0.24, 0.33, 0.37, 0.74, 0.89];
      const baseT = (zoneSlots[i % zoneSlots.length] + (i * 0.004)) % 1.0;
      this.npcs.push({
        rig,
        t: baseT,
        dir: i % 2 === 0 ? 1 : -1,
        side: i % 2 === 0 ? 1 : -1,
        walkSpeed: 1.35 + (i % 4) * 0.22,
        phase: i * 1.1
      });
    }
  }

  updateNPCs(dt) {
    const pPos = this.physics.pos;
    const maxActive = (this.cfg && this.cfg.npcs) ? this.cfg.npcs : 20;
    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      if (i >= maxActive) {
        npc.rig.root.visible = false;
        continue;
      }
      const pt = this.roadCurve.getPointAt(npc.t);
      const distPlayer = Math.hypot(pPos.x - pt.x, pPos.z - pt.z);
      if (distPlayer > 140) {
        npc.rig.root.visible = false;
        continue;
      }
      npc.rig.root.visible = true;

      // Collision awareness: step back & pause if player car approaches within 7.5m
      const tan = this.roadCurve.getTangentAt(npc.t);
      const rx = -tan.z, rz = tan.x;
      const sidewalkOffset = this.halfRoad + 2.3;
      const wx = pt.x + rx * npc.side * sidewalkOffset;
      const wz = pt.z + rz * npc.side * sidewalkOffset;
      const dCar = Math.hypot(pPos.x - wx, pPos.z - wz);

      if (dCar < 7.5 && Math.abs(this.physics.speedKmh) > 5) {
        // Evade away from road edge and face car
        npc.rig.root.position.set(wx + rx * npc.side * 1.2, pt.y + 0.1, wz + rz * npc.side * 1.2);
        npc.rig.root.rotation.y = Math.atan2(pPos.x - wx, pPos.z - wz);
        npc.rig.leftLeg.rotation.x = 0;
        npc.rig.rightLeg.rotation.x = 0;
      } else {
        npc.t = (npc.t + (npc.dir * npc.walkSpeed * dt) / this.roadLength + 1) % 1;
        npc.phase += dt * npc.walkSpeed * 5.2;
        const swing = Math.sin(npc.phase) * 0.48;
        npc.rig.leftLeg.rotation.x = swing;
        npc.rig.rightLeg.rotation.x = -swing;
        npc.rig.leftArm.rotation.x = -swing * 0.75;
        npc.rig.rightArm.rotation.x = swing * 0.75;
        npc.rig.root.position.set(wx, pt.y + 0.1, wz);
        npc.rig.root.rotation.y = Math.atan2(tan.x * npc.dir, tan.z * npc.dir);
      }
    }
  }

  // --- SECTION 8: RACE-MASTER STYLE MULTI-VEHICLE SELECTION & SWITCHING ---
  renderVehicleCarousel() {
    const strip = $(UI.vehicleCarousel);
    if (!strip) return;
    const unlocked = this.state.unlockedVehicles || ['m4_comp', 'm2_cs', 'm8_gt'];
    const curId = this.state.previewVehicleId || this.state.selectedVehicleId;

    strip.innerHTML = VEHICLE_CATALOG.map((v) => {
      const isUnlocked = unlocked.includes(v.id);
      const isSelected = v.id === curId;
      const statusTxt = isUnlocked
        ? (v.id === this.state.selectedVehicleId ? 'EQUIPPED' : 'OWNED')
        : `LOCKED &bull; ${v.price.toLocaleString()} CR`;
      return `
        <button class="vehicle-card-pill ${isSelected ? 'active' : ''}" data-car-id="${escapeHTML(v.id)}" type="button">
          <small>${escapeHTML(v.category)}</small>
          <strong>${escapeHTML(v.name.replace('BMW ', '').replace('RR ', ''))}</strong>
          <span>${statusTxt}</span>
        </button>
      `;
    }).join('');

    strip.querySelectorAll('.vehicle-card-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.previewGarageVehicle(btn.dataset.carId);
      });
    });

    const spec = VEHICLE_CATALOG.find((v) => v.id === curId) || VEHICLE_CATALOG[0];
    setText('garage-car-title', `${spec.name} (${spec.category})`);
    const selBtn = $(UI.garageSelect);
    if (selBtn) {
      const span = selBtn.querySelector('span');
      const isUnl = unlocked.includes(spec.id);
      if (span) {
        span.textContent = isUnl ? 'SELECT & DRIVE' : `UNLOCK (${spec.price.toLocaleString()} CR)`;
      }
    }
  }

  previewGarageVehicle(vehicleId) {
    const spec = VEHICLE_CATALOG.find((v) => v.id === vehicleId);
    if (!spec) return;
    this.state.previewVehicleId = spec.id;
    this.audio.playEngineStart(spec.engineAudio);
    this.rebuildPlayerVehicleMesh(spec.id, false);
    this.renderVehicleCarousel();
    this.updateGarageStatsUI();
  }

  rebuildPlayerVehicleMesh(vehicleId, commitSelection = true) {
    const spec = VEHICLE_CATALOG.find((v) => v.id === vehicleId) || VEHICLE_CATALOG[0];
    if (commitSelection) {
      this.state.selectedVehicleId = spec.id;
      this.state.previewVehicleId = spec.id;
      this.audio.engineProfile = spec.engineAudio || 'I6_TURBO';
    }
    const oldPos = this.carRig ? this.carRig.root.position.clone() : new THREE.Vector3();
    const oldRot = this.carRig ? this.carRig.root.rotation.clone() : new THREE.Euler();

    if (this.carRig && this.carRig.root) {
      this.scene.remove(this.carRig.root);
      this.disposeObject3D(this.carRig.root);
    }

    this.carRig = buildProceduralBMW(spec);
    this.carRig.root.rotation.order = 'YXZ';
    this.carRig.root.position.copy(oldPos);
    this.carRig.root.rotation.copy(oldRot);
    this.scene.add(this.carRig.root);

    this.buildBlobShadow();
    this.buildGarageFloorRing();
    if (this.garageRing) {
      this.garageRing.visible = (this.state.screen === 'GARAGE' || this.state.screen === 'MAIN_MENU');
    }
    this.applyCarTextures();
    this.setPaint(this.pendingPaintHex || spec.defaultPaint, this.pendingPaintName || spec.defaultPaintName, commitSelection);
    this.setRimColor(this.state.rimHex, false);
    this.setCaliperColor(this.state.caliperHex, false);
    this.setUnderglow(this.state.underglowHex, false);
    this.setHeadlights(this.state.headlightsOn);
  }

  // --- SECTION 7: PLAYABLE OPEN-WORLD MISSION & FESTIVAL EVENT SYSTEM ---
  buildMissionBeacons() {
    this.missionBeacons = [];
    const ringGeo = new THREE.CylinderGeometry(3.6, 3.6, 0.35, 24);
    const pillarGeo = new THREE.CylinderGeometry(3.2, 3.2, 11.0, 20, 1, true);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x168bff });
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0x168bff, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false });

    MISSION_CATALOG.forEach((m) => {
      const pt = this.roadCurve.getPointAt(m.startT);
      const group = new THREE.Group();
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.25;
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.y = 5.6;
      group.add(ring, pillar);
      group.position.copy(pt);
      this.scene.add(group);
      this.missionBeacons.push({ mission: m, pt: pt.clone(), group });
    });
  }

  renderMissionsGrid() {
    const grid = $(UI.missionsGrid);
    if (!grid) return;
    const done = this.state.completedMissions || [];
    setText(UI.missionsProgress, `${done.length} / ${MISSION_CATALOG.length} COMPLETED`);

    grid.innerHTML = MISSION_CATALOG.map((m) => {
      const isDone = done.includes(m.id);
      return `
        <div class="mission-event-card">
          <div>
            <div class="mission-card-top">
              <span class="mission-type-badge">${escapeHTML(m.type)}</span>
              <span class="mission-reward-badge">+${m.reward.toLocaleString()} CR ${isDone ? '&#10003;' : ''}</span>
            </div>
            <h4>${escapeHTML(m.title)}</h4>
            <p>${escapeHTML(m.desc)}</p>
          </div>
          <div class="mission-card-actions">
            <button class="chip-btn active btn-start-mission" data-mid="${escapeHTML(m.id)}" type="button">START EVENT</button>
            <button class="chip-btn btn-gps-mission" data-mid="${escapeHTML(m.id)}" type="button">SET GPS</button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-start-mission').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playUIClick(true);
        this.launchMissionById(btn.dataset.mid, true);
      });
    });
    grid.querySelectorAll('.btn-gps-mission').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = MISSION_CATALOG.find((x) => x.id === btn.dataset.mid);
        if (m) {
          const pt = this.roadCurve.getPointAt(m.startT);
          this.gpsWaypoint = { x: pt.x, z: pt.z, label: m.title };
          this.audio.playRewardChime();
          this.requestImmersiveFullscreen();
          this.resumeDriving();
          this.addCredits(0, `GPS SET TO ${m.title.toUpperCase()}`);
        }
      });
    });
  }

  launchMissionById(missionId, teleportToStart = true) {
    const m = MISSION_CATALOG.find((x) => x.id === missionId);
    if (!m) return;
    this.requestImmersiveFullscreen();
    if (teleportToStart) {
      const pt = this.roadCurve.getPointAt(m.startT);
      const tan = this.roadCurve.getTangentAt(m.startT);
      this.physics.pos.copy(pt);
      this.physics.vel.set(0, 0, 0);
      this.physics.heading = Math.atan2(tan.x, tan.z);
    }

    // Build mission checkpoints along road starting from m.startT
    this.checkpoints.forEach((cp) => { cp.mesh.visible = false; });
    const count = Math.min(this.checkpoints.length, m.checkpoints || 6);
    for (let i = 0; i < count; i++) {
      const t = (m.startT + ((i + 1) * 0.055)) % 1.0;
      const pt = this.roadCurve.getPointAt(t);
      const tan = this.roadCurve.getTangentAt(t);
      this.checkpoints[i].t = t;
      this.checkpoints[i].pt.copy(pt);
      this.checkpoints[i].mesh.position.copy(pt);
      this.checkpoints[i].mesh.position.y += 0.2;
      this.checkpoints[i].mesh.rotation.y = Math.atan2(tan.x, tan.z);
      this.checkpoints[i].mesh.visible = (i === 0);
    }

    this.activeMission = {
      spec: m,
      totalCP: count,
      cpIndex: 0,
      timeRemaining: m.timeLimit,
      elapsed: 0,
      maxSpeedReached: 0
    };
    this.sprintActive = false;
    this.countdownTimer = 3.2;
    this.gpsWaypoint = { x: this.checkpoints[0].pt.x, z: this.checkpoints[0].pt.z, label: `${m.title} CP 1` };

    setText(UI.hudEventMode, m.type);
    setText(UI.hudEventStatus, `${m.title.toUpperCase()} • GET READY!`);
    show(UI.hudMissionPrompt, false);
    this.state.started = true;
    show(UI.cont, true);
    this.resumeDriving();
  }

  completeActiveMission() {
    if (!this.activeMission) return;
    const m = this.activeMission.spec;
    const elapsed = this.activeMission.elapsed;
    this.activeMission = null;
    this.gpsWaypoint = null;
    this.checkpoints.forEach((cp) => { cp.mesh.visible = false; });

    if (!this.state.completedMissions.includes(m.id)) {
      this.state.completedMissions.push(m.id);
    }
    this.audio.playRewardChime();
    this.addCredits(m.reward, `${m.title.toUpperCase()} COMPLETE • +${m.reward.toLocaleString()} CR!`);
    this.saveSettings();

    setText(UI.mmStatName, m.title);
    setText(UI.mmStatTime, `${elapsed.toFixed(1)}s`);
    setText(UI.mmStatReward, `+${m.reward.toLocaleString()} CR`);
    setText(UI.mmStatBalance, `${this.state.credits.toLocaleString()} CR`);
    show(UI.missionModal, true);
  }

  // --- SECTION 14: INTERACTIVE OPEN-WORLD MAP & GPS WAYPOINT ROUTING ---
  drawInteractiveWorldMap() {
    const canvas = $(UI.worldMapCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#080B10';
    ctx.fillRect(0, 0, W, H);

    // Subtle topographic grid
    ctx.strokeStyle = 'rgba(22, 139, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const S = this.roadSamples;
    if (!S || !S.length) return;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of S) {
      if (s.pt.x < minX) minX = s.pt.x;
      if (s.pt.x > maxX) maxX = s.pt.x;
      if (s.pt.z < minZ) minZ = s.pt.z;
      if (s.pt.z > maxZ) maxZ = s.pt.z;
    }
    const pad = 42;
    const scaleX = (W - pad * 2) / Math.max(1, maxX - minX);
    const scaleZ = (H - pad * 2) / Math.max(1, maxZ - minZ);
    const sc = Math.min(scaleX, scaleZ);
    const ox = W * 0.5 - ((minX + maxX) * 0.5) * sc;
    const oy = H * 0.5 - ((minZ + maxZ) * 0.5) * sc;
    this._mapTransform = { sc, ox, oy };
    const toMap = (wx, wz) => [ox + wx * sc, oy + wz * sc];

    // Draw Connected Highway Loop
    ctx.strokeStyle = 'rgba(22, 139, 255, 0.28)';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    S.forEach((s, idx) => {
      const [mx, my] = toMap(s.pt.x, s.pt.z);
      if (idx === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#d8e4f2';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Draw GPS Waypoint Line if active
    const p = this.physics.pos;
    const [px, py] = toMap(p.x, p.z);
    if (this.gpsWaypoint) {
      const [wx, wy] = toMap(this.gpsWaypoint.x, this.gpsWaypoint.z);
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(wx, wy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(wx, wy, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Landmark Markers
    OPEN_WORLD_LANDMARKS.forEach((lm) => {
      const pt = this.roadCurve.getPointAt(lm.t);
      const [lx, ly] = toMap(pt.x, pt.z);
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9BA8B8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(lm.name, lx + 8, ly + 3);
    });

    // Draw Mission Start Markers
    MISSION_CATALOG.forEach((m) => {
      const pt = this.roadCurve.getPointAt(m.startT);
      const [mx, my] = toMap(pt.x, pt.z);
      ctx.fillStyle = '#ffb800';
      ctx.beginPath();
      ctx.arc(mx, my, 5.0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Marker
    ctx.fillStyle = '#168BFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  setRimColor(hex, save = true) {
    this.state.rimHex = hex;
    if (this.carRig && this.carRig.materials && this.carRig.materials.rimMat) {
      this.carRig.materials.rimMat.color.set(hex);
      this.carRig.materials.rimMat.needsUpdate = true;
    }
    this.syncChips('#rim-select .chip-btn', 'rim', hex);
    if (save) this.saveSettings();
  }

  setCaliperColor(hex, save = true) {
    this.state.caliperHex = hex;
    if (this.carRig && this.carRig.materials && this.carRig.materials.caliperMat) {
      this.carRig.materials.caliperMat.color.set(hex);
      this.carRig.materials.caliperMat.needsUpdate = true;
    }
    this.syncChips('#caliper-select .chip-btn', 'caliper', hex);
    if (save) this.saveSettings();
  }

  setUnderglow(val, save = true) {
    this.state.underglowHex = val;
    if (this.carRig && this.carRig.underglowMesh && this.carRig.materials.underglowMat) {
      if (val === 'off') {
        this.carRig.underglowMesh.visible = false;
      } else {
        this.carRig.underglowMesh.visible = true;
        this.carRig.materials.underglowMat.color.set(val);
      }
    }
    this.syncChips('#underglow-select .chip-btn', 'glow', val);
    if (save) this.saveSettings();
  }

  buyUpgrade(key, baseCost) {
    const cur = this.state.upgrades[key] || 0;
    if (cur >= 3) return;
    const cost = baseCost * (cur + 1);
    if (this.state.credits < cost) {
      setText(UI.glbStatus, `Insufficient Credits! Need ${cost.toLocaleString()} CR (Earn CR in Missions & Overtakes).`);
      this.audio.playUIClick(false);
      return;
    }
    this.state.credits -= cost;
    this.state.upgrades[key] = cur + 1;
    this.audio.playRewardChime();
    this.updateGarageStatsUI();
    this.saveSettings();
    setText(UI.glbStatus, `Installed ${key.toUpperCase()} Stage ${cur + 1}/3 upgrade!`);
  }

  addCredits(amount, reasonText) {
    if (amount > 0) this.state.credits += Math.round(amount);
    setText(UI.garageCredits, `${this.state.credits.toLocaleString()} CR`);
    setText(UI.hudSessionCredits, `${this.state.credits.toLocaleString()} CR`);
    if (reasonText) {
      setText(UI.hudSkillToast, reasonText);
      show(UI.hudSkillToast, true);
      this.toastTimer = 2.2;
    }
  }

  toggleSignal(mode) {
    this.audio.playUIClick(false);
    this.state.signalMode = this.state.signalMode === mode ? 'off' : mode;
    const hazBtn = $(UI.hudHazard);
    if (hazBtn) hazBtn.classList.toggle('active', this.state.signalMode === 'hazard');
  }

  spawnConvoyRivals(count) {
    if (this.rivals.length > 0) {
      this.rivals.forEach((r) => {
        this.scene.remove(r.mesh);
        this.disposeObject3D(r.mesh);
        if (r.tagEl && r.tagEl.parentNode) r.tagEl.parentNode.removeChild(r.tagEl);
      });
      this.rivals = [];
    }
    const callsigns = ['M4_GT3_APEX', 'G82_NITRO_KING', 'RR_SHADOW_M', 'M3_COMP_TOUR', 'CSL_MEISTER'];
    const colors = ['#168BFF', '#b8141c', '#e5a914', '#125432', '#7b1fa2'];
    const layer = $(UI.mpNametags);

    for (let i = 0; i < count; i++) {
      const { group } = buildRivalBMWCoupe(colors[i % colors.length]);
      group.visible = this.state.screen !== 'GARAGE';
      this.scene.add(group);
      let tagEl = null;
      if (layer) {
        tagEl = document.createElement('div');
        tagEl.className = 'mp-nametag-pill';
        layer.appendChild(tagEl);
      }
      this.rivals.push({
        callsign: callsigns[i % callsigns.length],
        color: colors[i % colors.length],
        hp: 530 + i * 35,
        mesh: group,
        tagEl,
        t: (0.025 + i * 0.045) % 1.0,
        speed: 34 + (i % 3) * 5.5,
        baseSpeed: 34 + (i % 3) * 5.5,
        laneOffset: i % 2 === 0 ? 3.5 : -3.5,
        overtakenCooldown: 0
      });
    }
  }

  buildSprintCheckpoints() {
    this.checkpoints = [];
    const totalCP = 8;
    const ringGeo = new THREE.TorusGeometry(6.8, 0.24, 10, 28, Math.PI);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x168bff, transparent: true, opacity: 0.82 });
    for (let i = 0; i < totalCP; i++) {
      const t = ((i + 1) / (totalCP + 1)) * 0.92;
      const pt = this.roadCurve.getPointAt(t);
      const tan = this.roadCurve.getTangentAt(t);
      const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
      mesh.position.copy(pt);
      mesh.position.y += 0.2;
      mesh.rotation.y = Math.atan2(tan.x, tan.z);
      mesh.visible = false;
      this.scene.add(mesh);
      this.checkpoints.push({ t, pt: pt.clone(), mesh });
    }
  }

  // --- SECTION 16: CROSS-DEVICE WEBRTC (PEERJS) + BROADCASTCHANNEL MULTIPLAYER ---
  connectMultiplayerChannel(roomCode) {
    const cleanRoom = String(roomCode || 'BMW-884').replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase().slice(0, 10) || 'BMW-884';
    this.state.mpRoom = cleanRoom;
    this.state.mpCallsign = sanitizeCallsign(this.state.mpCallsign);
    if (!this.clientId) this.clientId = 'p_' + Math.random().toString(36).slice(2, 9);

    if (this.mpChannel) {
      try { this.mpChannel.close(); } catch (_) {}
      this.mpChannel = null;
    }
    this.mpPeers.forEach((peer) => {
      if (peer.mesh) {
        this.scene.remove(peer.mesh);
        this.disposeObject3D(peer.mesh);
      }
      if (peer.tagEl && peer.tagEl.parentNode) peer.tagEl.parentNode.removeChild(peer.tagEl);
    });
    this.mpPeers.clear();

    // 1. Same-Device / Multi-Tab BroadcastChannel Transport
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.mpChannel = new BroadcastChannel(`rr_studios_mp_${cleanRoom}`);
        this.mpChannel.onmessage = (ev) => this.onMultiplayerMessage(ev.data);
      } catch (_) {}
    }

    // 2. Cross-Device WebRTC PeerJS DataChannel Transport (connects separate Android phones over internet!)
    this.initWebRTCPeerRoom(cleanRoom);

    // Immediately broadcast join presence packet
    this.broadcastTelemetryPacket('hello');
    setText(UI.mpStatusPill, `ROOM ${cleanRoom} • P2P + ${this.rivals.length} AI M-RIVALS`);
    this.renderMultiplayerRoster();
  }

  initWebRTCPeerRoom(cleanRoom) {
    if (typeof window.Peer === 'undefined') return;
    if (this.peerInstance) {
      try { this.peerInstance.destroy(); } catch (_) {}
      this.peerInstance = null;
    }
    this.peerConnections.clear();

    const hostPeerId = `rr-studios-bmw-room-${cleanRoom.toLowerCase()}-host`;
    try {
      const peer = new window.Peer(hostPeerId);
      this.peerInstance = peer;
      peer.on('open', () => {
        setText(UI.mpStatusPill, `ROOM ${cleanRoom} • WEBRTC HOST ONLINE`);
      });
      peer.on('connection', (conn) => {
        this.setupWebRTCConn(conn);
      });
      peer.on('error', (err) => {
        if (err && err.type === 'unavailable-id') {
          // Host already exists on another device! Connect as client peer to hostPeerId
          try { peer.destroy(); } catch (_) {}
          const clientPeer = new window.Peer();
          this.peerInstance = clientPeer;
          clientPeer.on('open', () => {
            const conn = clientPeer.connect(hostPeerId, { reliable: false });
            this.setupWebRTCConn(conn);
            setText(UI.mpStatusPill, `ROOM ${cleanRoom} • WEBRTC PEER CONNECTED`);
          });
          clientPeer.on('connection', (c) => this.setupWebRTCConn(c));
        }
      });
    } catch (_) {}
  }

  setupWebRTCConn(conn) {
    if (!conn) return;
    conn.on('open', () => {
      this.peerConnections.set(conn.peer, conn);
      this.broadcastTelemetryPacket('hello');
    });
    conn.on('data', (data) => {
      this.onMultiplayerMessage(data);
      // If we are host, relay packet to other connected WebRTC peers
      this.peerConnections.forEach((otherConn, pid) => {
        if (pid !== conn.peer && otherConn.open) {
          try { otherConn.send(data); } catch (_) {}
        }
      });
    });
    conn.on('close', () => {
      this.peerConnections.delete(conn.peer);
    });
  }

  sendMultiplayerPacket(pkt) {
    if (this.mpChannel) {
      try { this.mpChannel.postMessage(pkt); } catch (_) {}
    }
    this.peerConnections.forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send(pkt); } catch (_) {}
      }
    });
  }

  broadcastTelemetryPacket(type = 'state') {
    if (!this.clientId) this.clientId = 'p_' + Math.random().toString(36).slice(2, 9);
    const p = this.physics;
    this.sendMultiplayerPacket({
      type,
      id: this.clientId,
      callsign: sanitizeCallsign(this.state.mpCallsign),
      paintHex: sanitizeHex(this.state.paintHex),
      pos: [Number(p.pos.x.toFixed(2)), Number(p.pos.y.toFixed(2)), Number(p.pos.z.toFixed(2))],
      heading: Number(p.heading.toFixed(3)),
      steerAngle: Number((p.steerAngle || 0).toFixed(3)),
      speedKmh: Math.round(Math.abs(p.speedKmh)),
      braking: Boolean(this.input.brake || this.input.handbrake),
      boosting: Boolean(this.input.nitro && p.nitro > 1.5)
    });
  }

  onMultiplayerMessage(msg) {
    if (!msg || !msg.id || msg.id === this.clientId) return;
    if (msg.type === 'leave') {
      const dead = this.mpPeers.get(msg.id);
      if (dead) {
        if (dead.mesh) { this.scene.remove(dead.mesh); this.disposeObject3D(dead.mesh); }
        if (dead.tagEl && dead.tagEl.parentNode) dead.tagEl.parentNode.removeChild(dead.tagEl);
        this.mpPeers.delete(msg.id);
        this.renderMultiplayerRoster();
      }
      return;
    }

    const safeCallsign = sanitizeCallsign(msg.callsign || 'MP_PEER');
    const safeColor = sanitizeHex(msg.paintHex, '#168BFF');
    let peer = this.mpPeers.get(msg.id);
    if (!peer) {
      const { group, paintMat, tailMat } = buildRivalBMWCoupe(safeColor);
      this.scene.add(group);
      let tagEl = null;
      const layer = $(UI.mpNametags);
      if (layer) {
        tagEl = document.createElement('div');
        tagEl.className = 'mp-nametag-pill';
        layer.appendChild(tagEl);
      }
      peer = {
        id: msg.id,
        callsign: safeCallsign,
        color: safeColor,
        mesh: group,
        paintMat,
        tailMat,
        tagEl,
        targetPos: new THREE.Vector3(),
        targetHeading: 0,
        speedKmh: 0,
        lastSeen: performance.now()
      };
      if (Array.isArray(msg.pos) && msg.pos.length === 3) {
        peer.mesh.position.set(msg.pos[0], msg.pos[1], msg.pos[2]);
        peer.targetPos.copy(peer.mesh.position);
      }
      this.mpPeers.set(msg.id, peer);
      this.renderMultiplayerRoster();
      if (msg.type === 'hello') this.broadcastTelemetryPacket('state');
    }
    peer.lastSeen = performance.now();
    peer.callsign = safeCallsign;
    peer.speedKmh = Number(msg.speedKmh) || 0;
    if (Array.isArray(msg.pos) && msg.pos.length === 3) {
      peer.targetPos.set(Number(msg.pos[0]) || 0, Number(msg.pos[1]) || 0, Number(msg.pos[2]) || 0);
    }
    if (typeof msg.heading === 'number') peer.targetHeading = msg.heading;
    if (peer.tailMat) peer.tailMat.color.setHex(msg.braking ? 0xff3333 : 0xaa1111);
  }

  updateMultiplayerLobbyHeartbeat(dt) {
    this.mpHeartbeatAcc += dt;
    if (this.mpHeartbeatAcc >= 1.0) {
      this.mpHeartbeatAcc = 0;
      this.broadcastTelemetryPacket('heartbeat');
      this.evictStaleMultiplayerPeers();
    }
  }

  evictStaleMultiplayerPeers() {
    const now = performance.now();
    let changed = false;
    this.mpPeers.forEach((peer, id) => {
      if (now - peer.lastSeen > 6500) {
        if (peer.mesh) { this.scene.remove(peer.mesh); this.disposeObject3D(peer.mesh); }
        if (peer.tagEl && peer.tagEl.parentNode) peer.tagEl.parentNode.removeChild(peer.tagEl);
        this.mpPeers.delete(id);
        changed = true;
      }
    });
    if (changed) this.renderMultiplayerRoster();
  }

  renderMultiplayerRoster() {
    const list = $(UI.mpRosterList);
    if (!list) return;
    const rows = [];
    const spec = VEHICLE_CATALOG.find((v) => v.id === this.state.selectedVehicleId) || VEHICLE_CATALOG[0];
    const hp = spec.hp + this.state.upgrades.engine * 65 + this.state.upgrades.nitro * 15;
    rows.push(`
      <div class="mp-driver-row">
        <div class="mp-driver-left">
          <span class="mp-color-dot" style="background:${escapeHTML( sanitizeHex(this.state.paintHex) )};"></span>
          <span class="mp-driver-tag">${escapeHTML(sanitizeCallsign(this.state.mpCallsign))} (YOU)</span>
        </div>
        <span class="mp-driver-meta">${hp} HP &bull; ${escapeHTML(spec.name.split(' ').slice(0, 2).join(' '))}</span>
      </div>
    `);
    this.mpPeers.forEach((peer) => {
      rows.push(`
        <div class="mp-driver-row">
          <div class="mp-driver-left">
            <span class="mp-color-dot" style="background:${escapeHTML(sanitizeHex(peer.color))};"></span>
            <span class="mp-driver-tag">${escapeHTML(sanitizeCallsign(peer.callsign))}</span>
          </div>
          <span class="mp-driver-meta">LIVE P2P PEER</span>
        </div>
      `);
    });
    this.rivals.forEach((r) => {
      rows.push(`
        <div class="mp-driver-row">
          <div class="mp-driver-left">
            <span class="mp-color-dot" style="background:${escapeHTML(sanitizeHex(r.color))};"></span>
            <span class="mp-driver-tag">${escapeHTML(sanitizeCallsign(r.callsign))}</span>
          </div>
          <span class="mp-driver-meta">${r.hp} HP &bull; AI M-RIVAL</span>
        </div>
      `);
    });
    list.innerHTML = rows.join('');
    const totalDrivers = 1 + this.mpPeers.size + this.rivals.length;
    setText(UI.mpPeerCount, `${totalDrivers} DRIVERS`);
    setText(UI.mpStatusPill, `ROOM ${this.state.mpRoom} • ${totalDrivers} IN SESSION`);
  }

  startPhase2EventMode(mode) {
    this.state.mpMode = mode;
    this.activeMission = null;
    this.checkpoints.forEach((cp, idx) => {
      cp.mesh.visible = (mode === 'sprint' && idx === 0);
    });
    if (mode === 'sprint') {
      this.sprintActive = true;
      this.sprintIndex = 0;
      this.sprintTime = 0;
      setText(UI.hudEventMode, 'HIGHWAY SPRINT RACE');
      setText(UI.hudEventStatus, `CHECKPOINT 1/${this.checkpoints.length} • 00:00.0`);
    } else if (mode === 'overtake') {
      this.sprintActive = false;
      this.overtakeCombo = 1;
      setText(UI.hudEventMode, 'OVERTAKE & DRIFT CHALLENGE');
      setText(UI.hudEventStatus, 'PASS CARS CLOSE AT 80+ KM/H FOR COMBO CR');
    } else {
      this.sprintActive = false;
      setText(UI.hudEventMode, `CONVOY • ROOM ${this.state.mpRoom}`);
      setText(UI.hudEventStatus, `${1 + this.mpPeers.size + this.rivals.length} DRIVERS IN OPEN WORLD`);
    }
  }

  updatePhase2Gameplay(dt) {
    const p = this.physics;
    const kmh = Math.abs(p.speedKmh);

    // 0. Update Open-World Chunk Streaming & Animated NPC Pedestrians
    if (this.frame % 10 === 0) this.updateWorldStreaming();
    this.updateNPCs(dt);

    // 1. Countdown Overlay (3 - 2 - 1 - GO!)
    if (this.countdownTimer > 0) {
      this.countdownTimer -= dt;
      show(UI.hudCountdown, true);
      const sec = Math.ceil(this.countdownTimer);
      setText(UI.hudCountdown, sec > 0 ? String(sec) : 'GO!');
      if (this.countdownTimer <= 0) show(UI.hudCountdown, false);
    }

    // 2. Update Toast & Combo timers
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) show(UI.hudSkillToast, false);
    }
    if (this.overtakeTimer > 0) {
      this.overtakeTimer -= dt;
      if (this.overtakeTimer <= 0) this.overtakeCombo = 1;
    }

    // 3. Broadcast P2P Multiplayer Telemetry at 20 Hz + Smooth 60 FPS Peer Interpolation
    this.mpBroadcastAcc += dt;
    if (this.mpBroadcastAcc >= 0.05) {
      this.mpBroadcastAcc = 0;
      this.broadcastTelemetryPacket('state');
    }
    this.mpHeartbeatAcc += dt;
    if (this.mpHeartbeatAcc >= 1.5) {
      this.mpHeartbeatAcc = 0;
      this.evictStaleMultiplayerPeers();
    }
    this.mpPeers.forEach((peer) => {
      if (peer.mesh && peer.targetPos) {
        peer.mesh.position.lerp(peer.targetPos, Math.min(1, dt * 12));
        const diff = ((peer.targetHeading - peer.mesh.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        peer.mesh.rotation.y += diff * Math.min(1, dt * 12);
      }
    });

    // 4. Update Autonomous M-Series Convoy Rivals
    for (const r of this.rivals) {
      if (r.overtakenCooldown > 0) r.overtakenCooldown -= dt;
      const dynamicSpeed = r.baseSpeed + Math.sin(this.clock.elapsedTime * 0.7 + r.hp) * 4.0;
      r.speed = dynamicSpeed;
      r.t = (r.t + (r.speed * dt) / this.roadLength + 1) % 1;
      const pt = this.roadCurve.getPointAt(r.t);
      const tan = this.roadCurve.getTangentAt(r.t);
      const rx = -tan.z, rz = tan.x;
      r.mesh.position.set(pt.x + rx * r.laneOffset, pt.y, pt.z + rz * r.laneOffset);
      r.mesh.rotation.y = Math.atan2(tan.x, tan.z);

      const d = Math.hypot(p.pos.x - r.mesh.position.x, p.pos.z - r.mesh.position.z);
      if (d < 5.6 && kmh > 75 && r.overtakenCooldown <= 0) {
        r.overtakenCooldown = 3.5;
        this.overtakeCombo = Math.min(5, this.overtakeCombo + 1);
        this.overtakeTimer = 5.0;
        const reward = 250 * this.overtakeCombo;
        this.audio.playRewardChime();
        this.addCredits(reward, `RIVAL OVERTAKE ${this.overtakeCombo}x • +${reward} CR`);
      }
    }

    // Near-miss against traffic
    for (const tr of this.traffic) {
      if (tr.nearCooldown > 0) tr.nearCooldown -= dt;
      const d = Math.hypot(p.pos.x - tr.mesh.position.x, p.pos.z - tr.mesh.position.z);
      if (d > 3.15 && d < 5.2 && kmh > 85 && (!tr.nearCooldown || tr.nearCooldown <= 0)) {
        tr.nearCooldown = 3.0;
        const reward = 150 * this.overtakeCombo;
        this.overtakeCombo = Math.min(5, this.overtakeCombo + 1);
        this.overtakeTimer = 4.5;
        this.addCredits(reward, `NEAR MISS ${this.overtakeCombo}x • +${reward} CR`);
      }
    }

    // Power Drift credit accumulation
    if (kmh > 45 && p.slipRatio > 0.34) {
      this.driftAcc = (this.driftAcc || 0) + dt;
      if (this.driftAcc >= 1.1) {
        this.driftAcc = 0;
        this.addCredits(200, 'HORIZON DRIFT • +200 CR');
      }
    } else {
      this.driftAcc = 0;
    }

    // 5. Check Open-World Mission Beacons Proximity
    if (!this.activeMission && !this.sprintActive && this.missionBeacons) {
      let foundMission = null;
      for (const mb of this.missionBeacons) {
        mb.group.rotation.y += dt * 1.4;
        if (p.pos.distanceTo(mb.pt) < 15.0) {
          foundMission = mb.mission;
          break;
        }
      }
      this.nearbyMission = foundMission;
      if (foundMission) {
        setText(UI.hudMissionPrompt, `START ${foundMission.title.toUpperCase()} [F]`);
        show(UI.hudMissionPrompt, true);
      } else {
        show(UI.hudMissionPrompt, false);
      }
    }

    // 6. Update Active Open-World Mission Progression
    if (this.activeMission) {
      const am = this.activeMission;
      am.elapsed += dt;
      am.timeRemaining = Math.max(0, am.timeRemaining - dt);
      if (kmh > am.maxSpeedReached) am.maxSpeedReached = kmh;

      const cp = this.checkpoints[am.cpIndex];
      if (cp) {
        cp.mesh.rotation.z = Math.sin(this.clock.elapsedTime * 3.5) * 0.1;
        const dist = Math.hypot(p.pos.x - cp.pt.x, p.pos.z - cp.pt.z);
        if (dist < 14.5) {
          cp.mesh.visible = false;
          this.audio.playRewardChime();
          am.cpIndex++;
          if (am.cpIndex >= am.totalCP) {
            if (am.spec.targetSpeed > 0 && am.maxSpeedReached < am.spec.targetSpeed) {
              this.addCredits(2000, `REACHED ${Math.round(am.maxSpeedReached)}/${am.spec.targetSpeed} KM/H • +2,000 CR`);
              this.activeMission = null;
              this.gpsWaypoint = null;
            } else {
              this.completeActiveMission();
            }
          } else {
            this.checkpoints[am.cpIndex].mesh.visible = true;
            this.gpsWaypoint = { x: this.checkpoints[am.cpIndex].pt.x, z: this.checkpoints[am.cpIndex].pt.z, label: `CP ${am.cpIndex + 1}` };
            this.addCredits(500, `CHECKPOINT ${am.cpIndex}/${am.totalCP} • +500 CR`);
          }
        }
      }
      if (this.activeMission) {
        setText(UI.hudEventStatus, `CP ${am.cpIndex + 1}/${am.totalCP} • TIME LEFT ${am.timeRemaining.toFixed(1)}s`);
        if (am.timeRemaining <= 0) {
          this.activeMission = null;
          this.gpsWaypoint = null;
          this.checkpoints.forEach((c) => { c.mesh.visible = false; });
          setText(UI.hudEventStatus, 'MISSION TIME EXPIRED • TRY AGAIN FROM MISSIONS MENU');
        }
      }
    }

    // 7. Update Highway Sprint Checkpoint Race
    if (this.sprintActive && this.checkpoints.length > 0) {
      this.sprintTime += dt;
      const cp = this.checkpoints[this.sprintIndex];
      if (cp) {
        cp.mesh.rotation.z = Math.sin(this.clock.elapsedTime * 3.0) * 0.08;
        const dist = Math.hypot(p.pos.x - cp.pt.x, p.pos.z - cp.pt.z);
        if (dist < 13.5) {
          cp.mesh.visible = false;
          this.audio.playRewardChime();
          this.sprintIndex++;
          if (this.sprintIndex >= this.checkpoints.length) {
            this.sprintActive = false;
            this.addCredits(15000, `SPRINT COMPLETE (${this.sprintTime.toFixed(1)}s) • +15,000 CR!`);
            setText(UI.hudEventStatus, `FINISHED IN ${this.sprintTime.toFixed(1)}s • +15,000 CR WON`);
            this.saveSettings();
          } else {
            this.checkpoints[this.sprintIndex].mesh.visible = true;
            this.addCredits(1000, `CHECKPOINT ${this.sprintIndex}/${this.checkpoints.length} • +1,000 CR`);
          }
        }
        if (this.sprintActive) {
          setText(UI.hudEventStatus, `CP ${this.sprintIndex + 1}/${this.checkpoints.length} • ${this.sprintTime.toFixed(1)}s`);
        }
      }
    }
  }

  updateNametagsProjection() {
    if (!this.camera) return;
    const W = window.innerWidth, H = window.innerHeight;
    const projectActor = (mesh, tagEl, label, spdKmh) => {
      if (!tagEl || !mesh || !mesh.visible) {
        if (tagEl) tagEl.style.display = 'none';
        return;
      }
      const dx = mesh.position.x - this.physics.pos.x;
      const dz = mesh.position.z - this.physics.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 165) {
        tagEl.style.display = 'none';
        return;
      }
      _vWantPos.set(mesh.position.x, mesh.position.y + 1.95, mesh.position.z);
      _vWantPos.project(this.camera);
      if (_vWantPos.z > 1.0 || _vWantPos.z < -1.0) {
        tagEl.style.display = 'none';
        return;
      }
      const sx = (_vWantPos.x * 0.5 + 0.5) * W;
      const sy = (-_vWantPos.y * 0.5 + 0.5) * H;
      tagEl.style.display = 'block';
      tagEl.style.left = `${sx.toFixed(1)}px`;
      tagEl.style.top = `${sy.toFixed(1)}px`;
      tagEl.innerHTML = `${escapeHTML(sanitizeCallsign(label))} <b>${Math.round(spdKmh)} KM/H &bull; ${Math.round(dist)}m</b>`;
    };

    for (const r of this.rivals) {
      projectActor(r.mesh, r.tagEl, r.callsign, r.speed * 3.6);
    }
    this.mpPeers.forEach((peer) => {
      projectActor(peer.mesh, peer.tagEl, peer.callsign, peer.speedKmh);
    });
  }

  bindPhase2UIEvents() {
    // Main Menu OPEN WORLD & MISSIONS buttons
    on(UI.openMap, 'click', () => {
      this.audio.playUIClick(true);
      this.navigateTo('WORLD_MAP');
    });
    on(UI.openMissions, 'click', () => {
      this.audio.playUIClick(true);
      this.navigateTo('MISSIONS');
    });
    on(UI.hudMapBtn, 'click', () => {
      this.audio.playUIClick(false);
      this.navigateTo('WORLD_MAP');
    });
    const mmRing = document.querySelector('.minimap-ring');
    if (mmRing) {
      mmRing.addEventListener('click', () => {
        this.audio.playUIClick(false);
        this.navigateTo('WORLD_MAP');
      });
    }

    // World Map Screen events & Interactive Canvas Click-to-Set-GPS
    on(UI.mapHome, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.mapBack, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.mapClearWp, 'click', () => {
      this.audio.playUIClick(false);
      this.gpsWaypoint = null;
      this.drawInteractiveWorldMap();
    });
    this.bindChips('#map-zone-buttons .chip-btn', 'mapZone', (zone) => {
      this.selectedMapZone = zone;
      const lm = OPEN_WORLD_LANDMARKS.find((l) => l.zone === zone) || OPEN_WORLD_LANDMARKS[0];
      setText(UI.mapSelectedZone, lm.name.toUpperCase());
      setText(UI.mapPoiTitle, lm.name.toUpperCase());
      setText(UI.mapPoiDesc, lm.desc);
      const pt = this.roadCurve.getPointAt(lm.t);
      this.gpsWaypoint = { x: pt.x, z: pt.z, label: lm.name };
      this.drawInteractiveWorldMap();
    });
    on(UI.mapFastTravel, 'click', () => {
      this.audio.playRewardChime();
      this.teleportToZone(this.selectedMapZone || 'city');
      this.requestImmersiveFullscreen();
      if (!this.state.started) {
        this.startGame(true);
      } else {
        this.resumeDriving();
      }
    });
    const mapCanvas = $(UI.worldMapCanvas);
    if (mapCanvas) {
      mapCanvas.addEventListener('click', (e) => {
        if (!this._mapTransform) return;
        const rect = mapCanvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (mapCanvas.width / Math.max(1, rect.width));
        const cy = (e.clientY - rect.top) * (mapCanvas.height / Math.max(1, rect.height));
        const wx = (cx - this._mapTransform.ox) / this._mapTransform.sc;
        const wz = (cy - this._mapTransform.oy) / this._mapTransform.sc;
        this.gpsWaypoint = { x: wx, z: wz, label: 'CUSTOM GPS PIN' };
        this.audio.playUIClick(true);
        setText(UI.mapSelectedZone, 'CUSTOM GPS WAYPOINT');
        this.drawInteractiveWorldMap();
      });
    }

    // Missions Hub & Mission Complete Modal
    on(UI.missionsHome, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.missionsBack, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.missionsFreeroam, 'click', () => {
      this.audio.playUIClick(true);
      this.requestImmersiveFullscreen();
      if (!this.state.started) this.startGame(true);
      else this.resumeDriving();
    });
    on(UI.btnMissionClaim, 'click', () => {
      this.audio.playUIClick(true);
      show(UI.missionModal, false);
    });
    on(UI.hudMissionPrompt, 'click', () => {
      if (this.nearbyMission) this.launchMissionById(this.nearbyMission.id, false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF' && this.state.screen === 'DRIVING' && this.nearbyMission && !this.activeMission) {
        this.launchMissionById(this.nearbyMission.id, false);
      }
    });

    // Race-Master Vehicle Carousel Prev/Next & Unlock/Equip in Garage
    const cycleGarageCar = (dir) => {
      const curId = this.state.previewVehicleId || this.state.selectedVehicleId;
      const idx = VEHICLE_CATALOG.findIndex((v) => v.id === curId);
      const nextIdx = (idx + dir + VEHICLE_CATALOG.length) % VEHICLE_CATALOG.length;
      this.previewGarageVehicle(VEHICLE_CATALOG[nextIdx].id);
    };
    on(UI.carPrev, 'click', () => cycleGarageCar(-1));
    on(UI.carNext, 'click', () => cycleGarageCar(1));

    // Override Garage Select button to support Unlocking locked cars or Equipping owned cars
    const gSel = $(UI.garageSelect);
    if (gSel) {
      gSel.addEventListener('click', (e) => {
        const previewId = this.state.previewVehicleId || this.state.selectedVehicleId;
        const spec = VEHICLE_CATALOG.find((v) => v.id === previewId) || VEHICLE_CATALOG[0];
        const unlocked = this.state.unlockedVehicles || ['m4_comp', 'm2_cs', 'm8_gt'];
        if (!unlocked.includes(spec.id)) {
          e.stopImmediatePropagation();
          if (this.state.credits < spec.price) {
            this.audio.playUIClick(false);
            setText(UI.glbStatus, `Need ${spec.price.toLocaleString()} CR to unlock ${spec.name}! Complete Missions to earn CR.`);
            return;
          }
          this.state.credits -= spec.price;
          this.state.unlockedVehicles.push(spec.id);
          this.audio.playRewardChime();
          this.rebuildPlayerVehicleMesh(spec.id, true);
          this.renderVehicleCarousel();
          this.updateGarageStatsUI();
          this.saveSettings();
          setText(UI.glbStatus, `UNLOCKED & EQUIPPED ${spec.name}!`);
        } else {
          this.rebuildPlayerVehicleMesh(spec.id, true);
          this.saveSettings();
        }
      }, true);
    }

    // Garage Style vs Performance Tuning Tabs
    const switchGarageTab = (tab) => {
      this.audio.playUIClick(false);
      this.state.garageTab = tab;
      const isStyle = tab === 'style';
      const ts = $(UI.garageTabStyle), tp = $(UI.garageTabPerf);
      if (ts) ts.classList.toggle('active', isStyle);
      if (tp) tp.classList.toggle('active', !isStyle);
      show(UI.garagePanelStyle, isStyle);
      show('paint-select', isStyle);
      show(UI.garagePanelPerf, !isStyle);
    };
    on(UI.garageTabStyle, 'click', () => switchGarageTab('style'));
    on(UI.garageTabPerf, 'click', () => switchGarageTab('perf'));

    // Rim, Caliper & Underglow selectors
    this.bindChips('#rim-select .chip-btn', 'rim', (v) => this.setRimColor(v, true));
    this.bindChips('#caliper-select .chip-btn', 'caliper', (v) => this.setCaliperColor(v, true));
    this.bindChips('#underglow-select .chip-btn', 'glow', (v) => this.setUnderglow(v, true));

    // Stage 1-3 Performance Upgrade buttons
    on(UI.btnUpgEngine, 'click', () => this.buyUpgrade('engine', 15000));
    on(UI.btnUpgBrakes, 'click', () => this.buyUpgrade('brakes', 12000));
    on(UI.btnUpgSusp, 'click', () => this.buyUpgrade('susp', 12000));
    on(UI.btnUpgNitro, 'click', () => this.buyUpgrade('nitro', 15000));

    // Multiplayer & Convoy Hub events
    on(UI.mpHome, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.mpBack, 'click', () => { this.audio.playUIClick(false); this.popToPreviousScreen(); });
    on(UI.mpJoin, 'click', () => {
      this.audio.playRewardChime();
      const csEl = $(UI.mpCallsign), rmEl = $(UI.mpRoom);
      if (csEl && csEl.value.trim()) this.state.mpCallsign = sanitizeCallsign(csEl.value);
      if (rmEl && rmEl.value.trim()) this.connectMultiplayerChannel(rmEl.value.trim());
      this.saveSettings();
    });
    on(UI.mpHost, 'click', () => {
      this.audio.playUIClick(true);
      const code = 'BMW-' + Math.floor(100 + Math.random() * 900);
      const rmEl = $(UI.mpRoom);
      if (rmEl) rmEl.value = code;
      this.connectMultiplayerChannel(code);
      this.saveSettings();
    });
    this.bindChips('#mp-mode-select .chip-btn', 'mpMode', (mode) => {
      this.state.mpMode = mode;
      const descMap = {
        convoy: 'Cruise & race alongside live room peers and autonomous M-Series rivals.',
        sprint: 'Race through 8 highway neon checkpoints against the clock for +15,000 CR.',
        overtake: 'Score high-speed near-miss overtakes & drift combos for bonus Credits.'
      };
      setText(UI.mpModeDesc, descMap[mode] || descMap.convoy);
    });
    this.bindChips('#mp-rivals-select .chip-btn', 'rivals', (val) => {
      this.state.mpRivalCount = parseInt(val, 10) || 0;
      this.spawnConvoyRivals(this.state.mpRivalCount);
      this.renderMultiplayerRoster();
    });
    on(UI.mpLaunch, 'click', () => {
      this.audio.playUIClick(true);
      const csEl = $(UI.mpCallsign), rmEl = $(UI.mpRoom);
      if (csEl && csEl.value.trim()) this.state.mpCallsign = sanitizeCallsign(csEl.value);
      if (rmEl && rmEl.value.trim()) this.connectMultiplayerChannel(rmEl.value.trim());
      this.startPhase2EventMode(this.state.mpMode);
      this.requestImmersiveFullscreen();
      if (!this.state.started) {
        this.teleportToZone(this.state.spawn);
        this.startGame(true);
      } else {
        this.resumeDriving();
      }
    });

    // HUD Turn Signals, Hazard, Horn & M-Boost Nitro Touch button
    on(UI.indLeft, 'click', () => this.toggleSignal('left'));
    on(UI.indRight, 'click', () => this.toggleSignal('right'));
    on(UI.hudHazard, 'click', () => this.toggleSignal('hazard'));
    on(UI.hudHorn, 'click', () => this.audio.playHorn());

    const nitroEl = $(UI.nitro);
    if (nitroEl) {
      const releaseNitro = () => {
        this.input.nitro = false;
        nitroEl.classList.remove('pressed');
      };
      nitroEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { nitroEl.setPointerCapture(e.pointerId); } catch (_) {}
        this.input.nitro = true;
        nitroEl.classList.add('pressed');
        this.haptic(14);
      });
      nitroEl.addEventListener('pointerup', releaseNitro);
      nitroEl.addEventListener('pointercancel', releaseNitro);
      nitroEl.addEventListener('lostpointercapture', releaseNitro);
    }
  }

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

    const upg = this.state.upgrades;
    const vSpec = (this.carRig && this.carRig.spec && this.carRig.spec.physics) ? this.carRig.spec.physics : { accelMult: 1.0, topSpeedMps: 83.8, gripMult: 1.0, brakeMult: 1.0 };
    const engineMult = (1.0 + upg.engine * 0.095) * (vSpec.accelMult || 1.0);
    const topSpeedMps = (vSpec.topSpeedMps || 83.8) + upg.engine * 4.2;
    const brakePower = (15.8 + upg.brakes * 1.9) * (vSpec.brakeMult || 1.0);
    const nitroThrust = (inp.nitro && p.nitro > 1.5 && vl >= 0) ? (4.8 + upg.nitro * 1.15) : 0;

    if (inp.nitro && p.nitro > 1.5 && vl >= 0) {
      p.nitro = Math.max(0, p.nitro - (22.0 - upg.nitro * 2.5) * dt);
      this.throttleVal = Math.max(this.throttleVal, 0.95);
    } else {
      const recharge = (8.5 + upg.nitro * 2.8) * (1.0 + p.slipRatio * 1.5);
      p.nitro = Math.min(100.0, p.nitro + recharge * dt);
    }

    let acc = 0;
    if (this.throttleVal > 0.02 || nitroThrust > 0) {
      acc += (11.8 * engineMult * this.throttleVal * gearTorqueMult + nitroThrust) * Math.max(0, 1 - vl / topSpeedMps) * Math.min(1, W.grip + 0.15);
    }
    if (inp.brake) {
      if (vl > 0.5) acc -= brakePower * this.brakeVal * W.grip;
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
    const vGrip = (this.carRig && this.carRig.spec && this.carRig.spec.physics) ? (this.carRig.spec.physics.gripMult || 1.0) : 1.0;
    let grip = (sim ? 5.6 : 9.2) * (1.0 + this.state.upgrades.susp * 0.08) * vGrip * W.grip;
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

    const checkVehicleCollision = (otherPos, radius = 3.1) => {
      const dx = p.pos.x - otherPos.x, dz = p.pos.z - otherPos.z;
      const d = Math.hypot(dx, dz);
      if (d < radius && d > 0.001) {
        const nx = dx / d, nz = dz / d;
        p.pos.x += nx * (radius - d);
        p.pos.z += nz * (radius - d);
        const impact = Math.min(1, p.vel.length() / 25);
        p.vel.multiplyScalar(0.75);
        p.vel.x += nx * 2;
        p.vel.z += nz * 2;
        this.audio.playCollisionSound(impact);
        this.haptic();
      }
    };
    for (const tr of this.traffic) {
      if (tr.mesh.visible) checkVehicleCollision(tr.mesh.position, 3.1);
    }
    for (const r of this.rivals) {
      if (r.mesh && r.mesh.visible) checkVehicleCollision(r.mesh.position, 3.0);
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
    const pPos = this.physics.pos;
    for (let i = 0; i < this.traffic.length; i++) {
      const tr = this.traffic[i];
      if (!tr.mesh.visible) continue;

      // Forward obstacle avoidance & braking (checks player proximity and ahead traffic in same lane)
      let targetSpd = tr.baseSpeed;
      let braking = false;
      const dxP = pPos.x - tr.mesh.position.x;
      const dzP = pPos.z - tr.mesh.position.z;
      const distPlayer = Math.hypot(dxP, dzP);
      if (distPlayer < 16.0) {
        const fwdX = Math.sin(tr.mesh.rotation.y);
        const fwdZ = Math.cos(tr.mesh.rotation.y);
        const dotFwd = (dxP * fwdX + dzP * fwdZ) / Math.max(0.01, distPlayer);
        if (dotFwd > 0.72) {
          targetSpd = distPlayer < 8.5 ? 0 : tr.baseSpeed * 0.35;
          braking = true;
        }
      }
      // Slow slightly approaching city intersections
      if (nearJunction(tr.mesh.position, 14)) {
        targetSpd = Math.min(targetSpd, tr.baseSpeed * 0.65);
      }

      tr.speed += (targetSpd - tr.speed) * Math.min(1, dt * 5.0);
      if (tr.tlMat) tr.tlMat.color.setHex(braking ? 0xff2222 : 0x991111);

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
    const suspDrop = this.state.upgrades ? -this.state.upgrades.susp * 0.016 : 0;
    if (rig.bodyGroup) {
      root.rotation.set(p.slope, p.heading, 0);
      rig.bodyGroup.rotation.set(p.pitch, 0, p.roll);
      rig.bodyGroup.position.y = p.heave + suspDrop;
    }
    if (rig.nitroGroup) {
      const boosting = this.state.mode === 'DRIVING' && this.input.nitro && p.nitro > 1.5 && p.speedKmh >= -1;
      rig.nitroGroup.visible = boosting;
      if (boosting) {
        const flicker = 0.82 + Math.sin(this.clock.elapsedTime * 55) * 0.22;
        rig.nitroGroup.scale.set(1, 1, flicker);
        if (rig.nitroLight) rig.nitroLight.intensity = 3.2 * flicker;
      } else if (rig.nitroLight) {
        rig.nitroLight.intensity = 0;
      }
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
    } else if (this.state.screen === 'MAIN_MENU' || this.state.screen === 'SETTINGS' || this.state.screen === 'MULTIPLAYER') {
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

    const blinkOn = Math.floor(this.clock.elapsedTime * 3.2) % 2 === 0;
    const sig = this.state.signalMode;
    const leftSignalActive = (sig === 'left' || sig === 'hazard' || this.input.left) && blinkOn;
    const rightSignalActive = (sig === 'right' || sig === 'hazard' || this.input.right) && blinkOn;
    if (sig !== 'off' && blinkOn !== this.lastBlinkState && this.state.mode === 'DRIVING') {
      this.audio.playBlinkerTick(blinkOn);
    }
    this.lastBlinkState = blinkOn;

    const indL = $(UI.indLeft);
    const indR = $(UI.indRight);
    const indB = $(UI.indBrake);
    if (indL) indL.classList.toggle('active', leftSignalActive);
    if (indR) indR.classList.toggle('active', rightSignalActive);
    if (indB) indB.classList.toggle('active', this.input.handbrake || this.input.brake);

    if (this.carRig && this.carRig.materials) {
      const { turnLeftMat, turnRightMat } = this.carRig.materials;
      if (turnLeftMat) turnLeftMat.emissiveIntensity = leftSignalActive ? 3.5 : 0.0;
      if (turnRightMat) turnRightMat.emissiveIntensity = rightSignalActive ? 3.5 : 0.0;
    }

    setText(UI.nitroPct, `${Math.round(p.nitro)}%`);
    const nitroBtn = $(UI.nitro);
    if (nitroBtn) nitroBtn.classList.toggle('boosting', Boolean(this.input.nitro && p.nitro > 1.5));
    setText(UI.hudSessionCredits, `${this.state.credits.toLocaleString()} CR`);

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
      this.updatePhase2Gameplay(dt);
      this.updateParticles(dt);
    } else if (this.state.mode === 'PAUSED') {
      this.accum = 0;
    } else {
      this.accum = 0;
      this.physics.vel.multiplyScalar(Math.max(0, 1 - dt * 3));
      this.updateTraffic(dt);
      this.updateMultiplayerLobbyHeartbeat(dt);
      this.updateParticles(dt);
    }

    this.syncCarMesh();
    this.updateEnv(dt);
    this.updateCamera(dt);
    if (this.state.screen === 'DRIVING') this.updateNametagsProjection();

    this.sky.position.copy(this.camera.position);
    this.sunLight.target.position.copy(this.physics.pos);
    this.sunLight.position.copy(this.physics.pos).add(this.sunOffset);
    const c = this.cfg;
    if (c && c.shadow && this.state.shadowsEnabled && c.every && this.frame % c.every === 0) {
      this.renderer.shadowMap.needsUpdate = true;
    }

    const p = this.physics;
    const inMenu = this.state.mode !== 'DRIVING';
    this.audio.interiorView = (this.state.screen === 'DRIVING' && this.state.cameraIndex === 4);
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

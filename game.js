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
    ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
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
  // DRIVING PHYSICS (Fixed-Step Pacejka-Inspired Lateral Grip & Weight Transfer)
  // --------------------------------------------------------------------------
  getClosestRoadSample(position) {
    let bestDistSq = Infinity;
    let bestSample = this.roadSamples[0];
    for (let i = 0; i < this.roadSamples.length; i++) {
      const s = this.roadSamples[i];
      const dx = position.x - s.pt.x;
      const dz = position.z - s.pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestSample = s;
      }
    }
    return { sample: bestSample, dist: Math.sqrt(bestDistSq) };
  }

  stepPhysics(dt) {
    const p = this.physics;
    const isWet = this.state.weather !== 'clear';
    const gripFactor = (isWet ? 0.76 : 1.0) * (this.state.assistMode === 'arcade' ? 1.28 : 1.0);

    // Speed-sensitive steering
    const targetSteer = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
    const speedDamper = 1.0 / (1.0 + Math.abs(p.speedMps) * 0.036);
    const maxSteer = 0.62 * speedDamper * this.state.steerSens;
    p.steerAngle = THREE.MathUtils.lerp(p.steerAngle, targetSteer * maxSteer, dt * 9.5);

    const forward = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    const right = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading));

    let vLong = p.vel.dot(forward);
    let vLat = p.vel.dot(right);

    // Engine & Service Brake Forces
    let driveForce = 0;
    let isBraking = false;
    let isReversing = false;

    if (this.input.throttle) {
      driveForce = 10800;
    }
    if (this.input.brake) {
      if (vLong > 1.2) {
        driveForce = -17500;
        isBraking = true;
      } else {
        driveForce = -5600;
        isReversing = true;
      }
    }
    if (this.input.handbrake) {
      driveForce -= Math.sign(vLong) * 8500;
      isBraking = true;
    }

    const dragForce = -0.44 * vLong * Math.abs(vLong) - 140 * vLong;
    const mass = 1725;
    const longAcc = (driveForce + dragForce) / mass;
    vLong += longAcc * dt;

    // Lateral Grip & Handbrake Drifting
    const lateralDamping = this.input.handbrake ? 2.4 : 8.8 * gripFactor;
    vLat = THREE.MathUtils.lerp(vLat, 0, Math.min(1, dt * lateralDamping));

    // Angular Velocity & Oversteer
    if (Math.abs(vLong) > 0.25) {
      const turnRate = (vLong / 2.85) * Math.tan(p.steerAngle);
      p.heading += turnRate * dt;
      if (this.input.handbrake && Math.abs(vLong) > 6) {
        vLat += -Math.sign(p.steerAngle) * 3.8 * dt;
      }
    }

    const newForward = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
    const newRight = new THREE.Vector3(Math.cos(p.heading), 0, -Math.sin(p.heading));
    p.vel.copy(newForward).multiplyScalar(vLong).addScaledVector(newRight, vLat);
    p.pos.addScaledVector(p.vel, dt);

    // Road Elevation & Barrier Collision Detection
    const { sample, dist } = this.getClosestRoadSample(p.pos);
    p.pos.y = THREE.MathUtils.lerp(p.pos.y, sample.pt.y, dt * 14);

    const toCar = new THREE.Vector3().subVectors(p.pos, sample.pt);
    const lateralOffset = toCar.dot(sample.right);
    const maxRoadOffset = this.halfRoad - 1.05;

    if (Math.abs(lateralOffset) > maxRoadOffset) {
      const clampedOffset = Math.sign(lateralOffset) * maxRoadOffset;
      p.pos.x = sample.pt.x + sample.right.x * clampedOffset;
      p.pos.z = sample.pt.z + sample.right.z * clampedOffset;
      p.vel.multiplyScalar(0.75);
    }

    // Simple AI Traffic Collision Avoidance & Bump Check
    this.traffic.forEach((ai) => {
      const distToAI = p.pos.distanceTo(ai.mesh.position);
      if (distToAI < 3.6) {
        const push = new THREE.Vector3().subVectors(p.pos, ai.mesh.position).normalize();
        p.pos.addScaledVector(push, (3.6 - distToAI) * 0.5);
        p.vel.multiplyScalar(0.6);
      }
    });

    p.speedMps = vLong;
    p.speedKmh = Math.abs(vLong) * 3.6;
    p.slipRatio = Math.abs(vLat) / (Math.abs(vLong) + 2.5);

    // 8-Speed M-Steptronic Gear & RPM Simulation
    const gearSpeeds = [0, 38, 68, 102, 140, 182, 225, 275];
    if (isReversing && vLong < -0.5) {
      p.gear = 'R';
      p.rpm = Math.min(6500, 950 + (p.speedKmh / 45) * 5000);
    } else if (p.speedKmh < 2 && !this.input.throttle) {
      p.gear = 'N';
      p.rpm = THREE.MathUtils.lerp(p.rpm, 850, dt * 6);
    } else {
      let g = 1;
      for (let i = 1; i < gearSpeeds.length; i++) {
        if (p.speedKmh >= gearSpeeds[i]) g = i + 1;
      }
      p.gear = g;
      const minSpd = gearSpeeds[g - 1] * 0.7;
      const maxSpd = gearSpeeds[g] || 310;
      const ratio = THREE.MathUtils.clamp((p.speedKmh - minSpd) / (maxSpd - minSpd), 0.1, 0.98);
      p.rpm = THREE.MathUtils.lerp(p.rpm, 1100 + ratio * 6100, dt * 10);
    }

    // Chassis Pitch/Roll Weight Transfer & Suspension Articulation
    const targetPitch = THREE.MathUtils.clamp(-longAcc * 0.0045, -0.045, 0.045);
    const targetRoll = THREE.MathUtils.clamp(p.steerAngle * (vLong * 0.004), -0.055, 0.055);
    p.pitch = THREE.MathUtils.lerp(p.pitch, targetPitch, dt * 8);
    p.roll = THREE.MathUtils.lerp(p.roll, targetRoll, dt * 8);

    this.carRig.root.position.copy(p.pos);
    this.carRig.root.rotation.y = p.heading;
    this.carRig.bodyGroup.rotation.x = p.pitch;
    this.carRig.bodyGroup.rotation.z = p.roll;

    // Wheel Rotation & Steering Articulation
    p.wheelRotation += (vLong / 0.36) * dt;
    this.carRig.wheels.forEach((w, idx) => {
      w.spinGroup.rotation.x = p.wheelRotation;
      if (w.isFront) {
        w.steerPivot.rotation.y = p.steerAngle;
      }
      // Subtle suspension bounce over road surface
      const bump = Math.sin(p.wheelRotation * 2.0 + idx) * Math.min(0.012, p.speedKmh * 0.0001);
      w.steerPivot.position.y = w.baseY + bump;
    });

    // Cockpit Steering Wheel Rotation
    this.carRig.steeringWheelGroup.rotation.z = -p.steerAngle * 2.2;

    // Active Brake Lights & Reverse Lights
    this.carRig.materials.taillightMat.emissiveIntensity = isBraking ? 5.5 : 1.3;
    this.carRig.lights.tailPointLight.intensity = isBraking ? 3.8 : 1.0;
    this.carRig.materials.reverseLightMat.emissiveIntensity = p.gear === 'R' ? 3.0 : 0.0;

    // Emit Tire Smoke or Wet Spray
    if ((p.slipRatio > 0.25 || isWet) && p.speedKmh > 25 && Math.random() > 0.45) {
      const rearWheelWorld = new THREE.Vector3(0, 0.15, -1.4).applyMatrix4(this.carRig.root.matrixWorld);
      this.spawnWheelParticle(rearWheelWorld);
    }
  }

  // --------------------------------------------------------------------------
  // CAMERA MODES & AI TRAFFIC UPDATE
  // --------------------------------------------------------------------------
  updateCamera(dt) {
    const carPos = this.carRig.root.position;
    const heading = this.physics.heading;
    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));

    if (this.state.mode === 'MENU') {
      // Showcase Orbit Camera
      const angle = performance.now() * 0.00035;
      const orbitDist = 5.4;
      this.camera.position.set(
        carPos.x + Math.sin(angle) * orbitDist,
        carPos.y + 1.65,
        carPos.z + Math.cos(angle) * orbitDist
      );
      this.camera.lookAt(carPos.x, carPos.y + 0.7, carPos.z);
      return;
    }

    if (this.state.mode === 'INTRO') {
      this.state.introTimer += dt;
      const progress = Math.min(1, this.state.introTimer / 3.2);
      const angle = heading + (1 - progress) * Math.PI * 0.85;
      const dist = 4.2 + progress * 1.8;
      this.camera.position.set(
        carPos.x - Math.sin(angle) * dist,
        carPos.y + 1.1 + progress * 0.7,
        carPos.z - Math.cos(angle) * dist
      );
      this.camera.lookAt(carPos.x, carPos.y + 0.75, carPos.z);
      if (progress >= 1) this.finishIntro();
      return;
    }

    // Active Driving Camera Modes
    const speedShift = Math.min(0.65, this.physics.speedKmh / 240);
    this.camera.fov = this.state.fov + speedShift * 8;
    this.camera.updateProjectionMatrix();

    if (this.state.cameraIndex === 0) {
      // 0: Third-Person Chase Camera
      const idealOffset = new THREE.Vector3(0, 1.85, -5.8 - speedShift * 0.8);
      idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading - this.physics.steerAngle * 0.25);
      idealOffset.add(carPos);
      this.camera.position.lerp(idealOffset, Math.min(1, dt * 11));
      const lookTarget = carPos.clone().addScaledVector(forward, 6.0).add(new THREE.Vector3(0, 0.85, 0));
      this.camera.lookAt(lookTarget);
    } else if (this.state.cameraIndex === 1) {
      // 1: Close Action Rear Camera
      const idealOffset = new THREE.Vector3(0, 1.38, -4.1);
      idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
      idealOffset.add(carPos);
      this.camera.position.lerp(idealOffset, Math.min(1, dt * 15));
      this.camera.lookAt(carPos.clone().addScaledVector(forward, 8.0).add(new THREE.Vector3(0, 0.7, 0)));
    } else if (this.state.cameraIndex === 2) {
      // 2: Hood Camera
      const hoodPos = new THREE.Vector3(0, 1.08, 0.85).applyMatrix4(this.carRig.root.matrixWorld);
      this.camera.position.copy(hoodPos);
      this.camera.lookAt(carPos.clone().addScaledVector(forward, 20.0).add(new THREE.Vector3(0, 0.9, 0)));
    } else {
      // 3: First-Person Cockpit Camera
      const cockpitPos = new THREE.Vector3(-0.36, 1.06, -0.08).applyMatrix4(this.carRig.root.matrixWorld);
      this.camera.position.copy(cockpitPos);
      this.camera.lookAt(carPos.clone().addScaledVector(forward, 18.0).add(new THREE.Vector3(-0.36, 0.96, 0)));
    }
  }

  updateWorldActivity(dt) {
    // Move AI Traffic smoothly along road spline with simple spacing check
    this.traffic.forEach((ai) => {
      const distToPlayer = ai.mesh.position.distanceTo(this.physics.pos);
      const effectiveSpeed = distToPlayer < 12 ? ai.speed * 0.25 : ai.speed;
      ai.t = (ai.t + (ai.dir * effectiveSpeed * dt) / 1850 + 1.0) % 1.0;

      const pt = this.roadCurve.getPointAt(ai.t);
      const tan = this.roadCurve.getTangentAt(ai.t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      ai.mesh.position.copy(pt).addScaledVector(right, ai.laneOffset);
      const lookDir = ai.dir > 0 ? tan : tan.clone().negate();
      ai.mesh.lookAt(ai.mesh.position.clone().add(lookDir));
    });

    // Rain Follow & Fall Update
    if (this.rainSystem.visible) {
      this.rainSystem.position.x = this.physics.pos.x;
      this.rainSystem.position.z = this.physics.pos.z;
      const posAttr = this.rainSystem.geometry.attributes.position;
      const fallSpeed = this.state.weather === 'heavy_rain' ? 38 : 24;
      for (let i = 1; i < posAttr.count * 3; i += 3) {
        posAttr.array[i] -= fallSpeed * dt;
        if (posAttr.array[i] < 0) posAttr.array[i] = 32;
      }
      posAttr.needsUpdate = true;
    }

    // Smoke & Spray Particles
    this.smokeParticles.forEach((p) => {
      if (p.life > 0) {
        p.life -= dt * 1.8;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.addScalar(dt * 1.4);
        p.mesh.material.opacity = Math.max(0, p.life * 0.35);
        if (p.life <= 0) p.mesh.visible = false;
      }
    });
  }

  // --------------------------------------------------------------------------
  // HUD & MINIMAP RENDERING
  // --------------------------------------------------------------------------
  updateHUD(dt) {
    document.getElementById('hud-speed').textContent = Math.round(this.physics.speedKmh);
    document.getElementById('hud-gear').textContent = this.physics.gear;
    document.getElementById('hud-rpm').textContent = Math.round(this.physics.rpm);
    const rpmPct = Math.min(100, (this.physics.rpm / 7200) * 100);
    document.getElementById('rpm-bar-fill').style.width = `${rpmPct}%`;

    // Zone detection
    const px = this.physics.pos.x;
    const pz = this.physics.pos.z;
    let zoneName = 'DOWNTOWN CITY';
    if (px > 140) zoneName = 'MOUNTAIN HIGHWAY';
    else if (pz < -200) zoneName = 'COASTAL ROUTE';
    document.getElementById('zone-label').textContent = zoneName;

    // FPS Counter
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      const fps = Math.round(this.fpsFrames / this.fpsTime);
      document.getElementById('hud-fps').textContent = `${fps} FPS`;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }

    // Minimap Canvas Render
    const ctx = this.minimapCtx;
    ctx.clearRect(0, 0, 130, 130);
    ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
    ctx.fillRect(0, 0, 130, 130);

    const mapScale = 0.14;
    const cx = 65;
    const cy = 65;

    ctx.strokeStyle = '#3b4659';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < this.roadSamples.length; i += 4) {
      const pt = this.roadSamples[i].pt;
      const mx = cx + (pt.x - px) * mapScale;
      const my = cy + (pt.z - pz) * mapScale;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.stroke();

    // AI Dots
    ctx.fillStyle = '#ff9f43';
    this.traffic.forEach((ai) => {
      const ax = cx + (ai.mesh.position.x - px) * mapScale;
      const ay = cy + (ai.mesh.position.z - pz) * mapScale;
      ctx.fillRect(ax - 2, ay - 2, 4, 4);
    });

    // Player Arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.physics.heading + Math.PI);
    ctx.fillStyle = '#00a8ff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // ENVIRONMENT, GRAPHICS PRESETS & TELEPORT
  // --------------------------------------------------------------------------
  applyEnvironmentState() {
    const t = this.state.timeOfDay;
    const w = this.state.weather;

    if (t === 'morning') {
      this.scene.background = new THREE.Color(0x8ab4d8);
      this.scene.fog.color.setHex(0x8ab4d8);
      this.sunLight.color.setHex(0xfff4e0);
      this.sunLight.intensity = 2.5;
      this.sunLight.position.set(110, 130, 60);
      this.ambientLight.intensity = 0.85;
    } else if (t === 'sunset') {
      this.scene.background = new THREE.Color(0x281e2c);
      this.scene.fog.color.setHex(0x3b2635);
      this.sunLight.color.setHex(0xff7b39);
      this.sunLight.intensity = 2.8;
      this.sunLight.position.set(-140, 42, -90);
      this.ambientLight.intensity = 0.55;
    } else {
      // Night City
      this.scene.background = new THREE.Color(0x05070c);
      this.scene.fog.color.setHex(0x070a12);
      this.sunLight.color.setHex(0x3a558c);
      this.sunLight.intensity = 0.35;
      this.ambientLight.intensity = 0.22;
    }

    // Weather Material & Grip Adjustments
    if (w === 'clear') {
      this.rainSystem.visible = false;
      this.roadMaterial.roughness = 0.65;
      this.roadMaterial.metalness = 0.15;
      this.scene.fog.density = 0.0018;
    } else if (w === 'light_rain') {
      this.rainSystem.visible = true;
      this.roadMaterial.roughness = 0.18;
      this.roadMaterial.metalness = 0.65;
      this.scene.fog.density = 0.0032;
    } else {
      this.rainSystem.visible = true;
      this.roadMaterial.roughness = 0.09;
      this.roadMaterial.metalness = 0.82;
      this.scene.fog.density = 0.0048;
    }

    const summary = `${t.toUpperCase()} | ${w.replace('_', ' ').toUpperCase()} | ${this.state.preset.toUpperCase()}`;
    document.getElementById('menu-env-summary').textContent = summary;
    document.getElementById('hud-env-badge').textContent = `${t.toUpperCase()} | ${w.replace('_', ' ').toUpperCase()}`;
  }

  applyGraphicsPreset(preset) {
    this.state.preset = preset;
    if (preset === 'low') {
      this.state.resScale = 0.65;
      this.renderer.shadowMap.enabled = false;
      this.traffic.forEach((ai, idx) => (ai.mesh.visible = idx < 4));
    } else if (preset === 'medium') {
      this.state.resScale = 0.85;
      this.renderer.shadowMap.enabled = true;
      this.traffic.forEach((ai, idx) => (ai.mesh.visible = idx < 7));
    } else {
      this.state.resScale = 1.0;
      this.renderer.shadowMap.enabled = true;
      this.traffic.forEach((ai) => (ai.mesh.visible = true));
    }
    document.getElementById('slider-res').value = this.state.resScale;
    document.getElementById('lbl-res-scale').textContent = `${Math.round(this.state.resScale * 100)}%`;
    document.getElementById('btn-hud-gfx').textContent = `GFX: ${preset.toUpperCase()}`;
    this.updateViewportSize();
    this.applyEnvironmentState();
  }

  teleportToZone(zone) {
    let t = 0.08; // Downtown City
    if (zone === 'highway') t = 0.42;
    else if (zone === 'coast') t = 0.78;

    const pt = this.roadCurve.getPointAt(t);
    const tan = this.roadCurve.getTangentAt(t).normalize();
    this.physics.pos.copy(pt);
    this.physics.vel.set(0, 0, 0);
    this.physics.heading = Math.atan2(tan.x, tan.z);
    this.carRig.root.position.copy(this.physics.pos);
    this.carRig.root.rotation.y = this.physics.heading;
  }

  // --------------------------------------------------------------------------
  // UI & POINTER/TOUCH EVENT BINDINGS
  // --------------------------------------------------------------------------
  bindUIAndControls() {
    // Prevent default mobile touch gestures on canvas & HUD
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Menu Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.menu-panel').forEach((p) => p.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.panel).classList.remove('hidden');
      });
    });

    // Start & Continue Driving
    document.getElementById('btn-start-drive').addEventListener('click', () => {
      this.audio.init();
      this.state.mode = 'INTRO';
      this.state.introTimer = 0;
      document.getElementById('main-menu').classList.add('hidden');
      document.getElementById('cinematic-bar-top').classList.remove('hidden');
      document.getElementById('cinematic-bar-bottom').classList.remove('hidden');
      document.getElementById('btn-continue-drive').classList.remove('hidden');
    });

    document.getElementById('btn-continue-drive').addEventListener('click', () => {
      this.audio.init();
      this.finishIntro();
    });

    document.getElementById('btn-skip-intro').addEventListener('click', () => this.finishIntro());

    // Paint Selection
    document.querySelectorAll('[data-paint]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-paint]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.carRig.materials.bodyPaintMat.color.set(btn.dataset.paint);
      });
    });

    // Optional GLB Loader
    document.getElementById('btn-load-glb').addEventListener('click', () => {
      const url = document.getElementById('input-glb-url').value;
      loadExternalGLBVehicle(url, this.carRig, (msg) => alert(msg));
    });

    // Time of Day, Weather, Spawn, Graphics, Assist, Audio Chips
    const bindChipGroup = (selector, attr, callback) => {
      document.querySelectorAll(selector).forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll(selector).forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          callback(btn.dataset[attr]);
        });
      });
    };

    bindChipGroup('#time-select .chip-btn', 'time', (val) => {
      this.state.timeOfDay = val;
      this.applyEnvironmentState();
    });
    bindChipGroup('#weather-select .chip-btn', 'weather', (val) => {
      this.state.weather = val;
      this.applyEnvironmentState();
    });
    bindChipGroup('#spawn-select .chip-btn', 'spawn', (val) => this.teleportToZone(val));
    bindChipGroup('#preset-select .chip-btn', 'preset', (val) => this.applyGraphicsPreset(val));
    bindChipGroup('#assist-select .chip-btn', 'assist', (val) => (this.state.assistMode = val));
    bindChipGroup('#audio-toggle-group .chip-btn', 'audio', (val) => {
      this.audio.enabled = val === 'on';
      document.getElementById('btn-hud-sound').classList.toggle('active', this.audio.enabled);
    });
    bindChipGroup('#exhaust-select .chip-btn', 'exhaust', (val) => {
      this.audio.sportExhaust = val === 'sport';
    });

    // Sliders
    document.getElementById('slider-res').addEventListener('input', (e) => {
      this.state.resScale = parseFloat(e.target.value);
      document.getElementById('lbl-res-scale').textContent = `${Math.round(this.state.resScale * 100)}%`;
      this.updateViewportSize();
    });
    document.getElementById('slider-fov').addEventListener('input', (e) => {
      this.state.fov = parseInt(e.target.value, 10);
      document.getElementById('lbl-fov').textContent = `${this.state.fov}°`;
    });
    document.getElementById('slider-sens').addEventListener('input', (e) => {
      this.state.steerSens = parseFloat(e.target.value);
      document.getElementById('lbl-sens').textContent = `${this.state.steerSens.toFixed(1)}x`;
    });
    document.getElementById('slider-vol').addEventListener('input', (e) => {
      this.audio.masterVolume = parseInt(e.target.value, 10) / 100;
      document.getElementById('lbl-vol').textContent = `${e.target.value}%`;
    });

    // HUD Quick Buttons
    const camNames = ['CHASE', 'CLOSE', 'HOOD', 'COCKPIT'];
    document.getElementById('btn-hud-camera').addEventListener('click', () => {
      this.state.cameraIndex = (this.state.cameraIndex + 1) % 4;
      document.getElementById('btn-hud-camera').textContent = `CAM: ${camNames[this.state.cameraIndex]}`;
    });

    document.getElementById('btn-hud-lights').addEventListener('click', (e) => {
      this.state.headlightsOn = !this.state.headlightsOn;
      this.carRig.lights.headSpotL.visible = this.state.headlightsOn;
      this.carRig.lights.headSpotR.visible = this.state.headlightsOn;
      this.carRig.materials.headlightMat.emissiveIntensity = this.state.headlightsOn ? 3.5 : 0.2;
      e.currentTarget.classList.toggle('active', this.state.headlightsOn);
    });

    document.getElementById('btn-hud-sound').addEventListener('click', (e) => {
      this.audio.init();
      this.audio.enabled = !this.audio.enabled;
      e.currentTarget.classList.toggle('active', this.audio.enabled);
    });

    document.getElementById('btn-hud-gfx').addEventListener('click', () => {
      const order = ['low', 'medium', 'high'];
      const next = order[(order.indexOf(this.state.preset) + 1) % 3];
      this.applyGraphicsPreset(next);
    });

    document.getElementById('btn-hud-pause').addEventListener('click', () => this.pauseGame());

    // Mobile Pointer Controls (Handles multi-touch, release, and cancel cleanly)
    const bindTouchPedal = (id, key) => {
      const el = document.getElementById(id);
      const press = (e) => {
        e.preventDefault();
        this.audio.init();
        this.input[key] = true;
        el.classList.add('pressed');
      };
      const release = (e) => {
        e.preventDefault();
        this.input[key] = false;
        el.classList.remove('pressed');
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
    };

    bindTouchPedal('touch-left', 'left');
    bindTouchPedal('touch-right', 'right');
    bindTouchPedal('touch-throttle', 'throttle');
    bindTouchPedal('touch-brake', 'brake');
    bindTouchPedal('touch-handbrake', 'handbrake');

    // Desktop Keyboard Support
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.input.throttle = true;
      if (k === 's' || e.key === 'ArrowDown') this.input.brake = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.input.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.input.right = true;
      if (e.key === ' ') this.input.handbrake = true;
      if (k === 'c') document.getElementById('btn-hud-camera').click();
      if (k === 'l') document.getElementById('btn-hud-lights').click();
      if (e.key === 'Escape' && this.state.mode === 'DRIVING') this.pauseGame();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.input.throttle = false;
      if (k === 's' || e.key === 'ArrowDown') this.input.brake = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.input.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.input.right = false;
      if (e.key === ' ') this.input.handbrake = false;
    });
  }

  finishIntro() {
    this.state.mode = 'DRIVING';
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('cinematic-bar-top').classList.add('hidden');
    document.getElementById('cinematic-bar-bottom').classList.add('hidden');
    document.getElementById('driving-hud').classList.remove('hidden');
  }

  pauseGame() {
    this.state.mode = 'MENU';
    this.input.throttle = false;
    this.input.brake = false;
    this.input.left = false;
    this.input.right = false;
    this.input.handbrake = false;
    document.getElementById('driving-hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // MAIN RENDER & FIXED-TIMESTEP SIMULATION LOOP
  // --------------------------------------------------------------------------
  animate() {
    requestAnimationFrame(this.animate);
    const rawDt = Math.min(this.clock.getDelta(), 0.1);

    // Fixed physics substeps to prevent high-speed barrier tunneling
    const subSteps = 2;
    const subDt = rawDt / subSteps;
    if (this.state.mode === 'DRIVING') {
      for (let i = 0; i < subSteps; i++) {
        this.stepPhysics(subDt);
      }
      this.updateHUD(rawDt);
    }

    // Keep sun shadow frustum centered around the player car
    this.sunLight.target.position.copy(this.physics.pos);
    this.sunLight.position.x = this.physics.pos.x + (this.state.timeOfDay === 'sunset' ? -140 : 110);
    this.sunLight.position.z = this.physics.pos.z + (this.state.timeOfDay === 'sunset' ? -90 : 60);

    this.updateWorldActivity(rawDt);
    this.updateCamera(rawDt);
    this.audio.update(
      this.physics.rpm,
      this.input.throttle ? 1 : 0,
      this.physics.slipRatio,
      this.physics.speedKmh
    );

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new UltimateDriveSimulator();
});

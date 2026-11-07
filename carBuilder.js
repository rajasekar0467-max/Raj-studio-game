import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Complete Catalog of Playable Vehicles (Section 8: Sports, Supercar, Luxury, SUV, Off-Road, Performance)
 * Each vehicle has distinct 3D geometry proportions, physics handling parameters, and engine audio profile.
 */
export const VEHICLE_CATALOG = [
  {
    id: 'm4_comp',
    name: 'BMW M4 G82 COMPETITION',
    category: 'PERFORMANCE CAR',
    hp: 510,
    topSpeedKmh: 302,
    accel0to100: 3.5,
    handlingRating: 90,
    brakingRating: 88,
    price: 0,
    unlockedDefault: true,
    defaultPaint: '#0a2b6e',
    defaultPaintName: 'Tanzanite Blue II',
    engineAudio: 'I6_TURBO',
    physics: { accelMult: 1.0, topSpeedMps: 83.8, gripMult: 1.0, offroadGrip: 0.72, brakeMult: 1.0, rideHeight: 0.0, camHeight: 0.0 },
    dims: { width: 1.98, length: 4.66, beltH: 0.44, cabinH: 0.44, cabinZ: -0.22, cabinL: 1.88, wheelR: 0.36, roofStyle: 'coupe' }
  },
  {
    id: 'm2_cs',
    name: 'BMW M2 G87 CS TRACK',
    category: 'SPORTS CAR',
    hp: 480,
    topSpeedKmh: 292,
    accel0to100: 3.6,
    handlingRating: 95,
    brakingRating: 90,
    price: 0,
    unlockedDefault: true,
    defaultPaint: '#b8141c',
    defaultPaintName: 'Toronto Red Metallic',
    engineAudio: 'I6_TURBO',
    physics: { accelMult: 0.98, topSpeedMps: 81.1, gripMult: 1.10, offroadGrip: 0.74, brakeMult: 1.05, rideHeight: -0.01, camHeight: -0.02 },
    dims: { width: 1.94, length: 4.42, beltH: 0.43, cabinH: 0.43, cabinZ: -0.18, cabinL: 1.72, wheelR: 0.35, roofStyle: 'coupe', rearWing: true }
  },
  {
    id: 'm8_gt',
    name: 'BMW M8 GRAN COUPE V8',
    category: 'LUXURY CAR',
    hp: 625,
    topSpeedKmh: 318,
    accel0to100: 3.1,
    handlingRating: 88,
    brakingRating: 91,
    price: 0,
    unlockedDefault: true,
    defaultPaint: '#125432',
    defaultPaintName: 'Isle of Man Green',
    engineAudio: 'V8_RUMBLE',
    physics: { accelMult: 1.12, topSpeedMps: 88.3, gripMult: 0.98, offroadGrip: 0.70, brakeMult: 1.04, rideHeight: 0.0, camHeight: 0.02 },
    dims: { width: 2.02, length: 4.96, beltH: 0.45, cabinH: 0.42, cabinZ: -0.15, cabinL: 2.18, wheelR: 0.37, roofStyle: 'grancoupe' }
  },
  {
    id: 'x5m_suv',
    name: 'BMW X5 M COMPETITION',
    category: 'SUV',
    hp: 617,
    topSpeedKmh: 286,
    accel0to100: 3.7,
    handlingRating: 85,
    brakingRating: 86,
    price: 35000,
    unlockedDefault: false,
    defaultPaint: '#08090c',
    defaultPaintName: 'Sapphire Black',
    engineAudio: 'V8_RUMBLE',
    physics: { accelMult: 1.04, topSpeedMps: 79.4, gripMult: 0.96, offroadGrip: 0.92, brakeMult: 0.96, rideHeight: 0.14, camHeight: 0.28 },
    dims: { width: 2.08, length: 4.82, beltH: 0.58, cabinH: 0.56, cabinZ: -0.25, cabinL: 2.55, wheelR: 0.41, roofStyle: 'suv' }
  },
  {
    id: 'dakar_4x4',
    name: 'RR DAKAR TRAILBLAZER 4X4',
    category: 'OFF-ROAD VEHICLE',
    hp: 560,
    topSpeedKmh: 265,
    accel0to100: 3.9,
    handlingRating: 92,
    brakingRating: 87,
    price: 40000,
    unlockedDefault: false,
    defaultPaint: '#e5a914',
    defaultPaintName: 'Sao Paulo Yellow',
    engineAudio: 'V8_RUMBLE',
    physics: { accelMult: 1.02, topSpeedMps: 73.6, gripMult: 0.94, offroadGrip: 1.05, brakeMult: 0.98, rideHeight: 0.22, camHeight: 0.36 },
    dims: { width: 2.14, length: 4.68, beltH: 0.56, cabinH: 0.52, cabinZ: -0.12, cabinL: 2.25, wheelR: 0.44, roofStyle: 'offroad', roofRack: true }
  },
  {
    id: 'apex_v10',
    name: 'RR APEX V10 HYPER-GT',
    category: 'SUPERCAR',
    hp: 780,
    topSpeedKmh: 352,
    accel0to100: 2.6,
    handlingRating: 98,
    brakingRating: 97,
    price: 55000,
    unlockedDefault: false,
    defaultPaint: '#168BFF',
    defaultPaintName: 'Electric Horizon Blue',
    engineAudio: 'V10_SCREAM',
    physics: { accelMult: 1.28, topSpeedMps: 97.7, gripMult: 1.22, offroadGrip: 0.62, brakeMult: 1.18, rideHeight: -0.04, camHeight: -0.08 },
    dims: { width: 2.06, length: 4.62, beltH: 0.36, cabinH: 0.34, cabinZ: 0.08, cabinL: 1.68, wheelR: 0.36, roofStyle: 'supercar', rearWing: true }
  }
];

function createCockpitScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = (speedVal = 0, gear = '1', rpm = 850, unitLabel = 'KM/H') => {
    ctx.fillStyle = '#080b10';
    ctx.fillRect(0, 0, 512, 128);

    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#168bff');
    grad.addColorStop(0.5, '#00d2ff');
    grad.addColorStop(1, '#e41e26');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 4);

    ctx.fillStyle = '#9ba8b8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`SPEED ${unitLabel}`, 28, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(String(Math.round(Math.abs(speedVal))), 28, 88);

    ctx.fillStyle = 'rgba(22, 139, 255, 0.18)';
    ctx.fillRect(216, 22, 80, 84);
    ctx.strokeStyle = '#168bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(216, 22, 80, 84);
    ctx.fillStyle = '#168bff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(gear), 256, 84);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#9ba8b8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ENGINE RPM', 330, 34);
    ctx.fillStyle = rpm > 6300 ? '#e41e26' : '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(String(Math.round(rpm / 10) * 10), 330, 74);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(330, 88, 154, 14);
    const rpmFrac = Math.min(1, Math.max(0, rpm / 7200));
    ctx.fillStyle = rpm > 6300 ? '#e41e26' : '#168bff';
    ctx.fillRect(330, 88, Math.round(154 * rpmFrac), 14);

    tex.needsUpdate = true;
  };

  draw(0, '1', 850, 'KM/H');
  return { tex, draw };
}

function createUnderglowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.48)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds any playable vehicle from VEHICLE_CATALOG with ultra-detailed PBR paint,
 * clearcoat, carbon fiber weave, alloy wheels, brake rotors/calipers, interior cockpit,
 * 3D amber turn signals, quad-exhaust nitro flames, and chassis underglow.
 */
export function buildProceduralBMW(vehicleSpecOrId = 'm4_comp') {
  const spec = typeof vehicleSpecOrId === 'string'
    ? (VEHICLE_CATALOG.find((v) => v.id === vehicleSpecOrId) || VEHICLE_CATALOG[0])
    : (vehicleSpecOrId || VEHICLE_CATALOG[0]);
  const d = spec.dims || VEHICLE_CATALOG[0].dims;
  const liftY = spec.physics ? (spec.physics.rideHeight || 0) : 0;

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.defaultPaint || '#0a2b6e'),
    metalness: 0.88,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
    envMapIntensity: 1.45
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    metalness: 0.45,
    roughness: 0.32
  });

  const interiorTrimMat = new THREE.MeshStandardMaterial({
    color: 0x10131a,
    metalness: 0.2,
    roughness: 0.72
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    metalness: 0.1,
    roughness: 0.58
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x091018,
    metalness: 0.08,
    roughness: 0.05,
    transmission: 0.55,
    transparent: true,
    opacity: 0.62,
    envMapIntensity: 1.5,
    side: THREE.FrontSide
  });

  const chromeDarkMat = new THREE.MeshStandardMaterial({
    color: 0x262b33,
    metalness: 0.92,
    roughness: 0.18
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xd8f0ff,
    emissiveIntensity: 3.5,
    roughness: 0.1
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0x550000,
    emissive: 0xff1111,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });

  const reverseLightMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    emissive: 0xffffff,
    emissiveIntensity: 0.0
  });

  const turnLeftMat = new THREE.MeshStandardMaterial({
    color: 0x332000,
    emissive: 0xff9900,
    emissiveIntensity: 0.0,
    roughness: 0.2
  });

  const turnRightMat = new THREE.MeshStandardMaterial({
    color: 0x332000,
    emissive: 0xff9900,
    emissiveIntensity: 0.0,
    roughness: 0.2
  });

  const W = d.width;
  const L = d.length;
  const beltH = d.beltH;
  const cabinH = d.cabinH;
  const baseBeltY = 0.60 + liftY;
  const baseCabinY = baseBeltY + beltH * 0.5 + cabinH * 0.48;

  // 1. Lower Chassis & Floor Sill
  const lowerPan = new THREE.Mesh(new THREE.BoxGeometry(W * 0.97, 0.28, L * 0.98), carbonMat);
  lowerPan.position.set(0, 0.34 + liftY, 0.02);
  lowerPan.castShadow = true;
  lowerPan.receiveShadow = true;
  bodyGroup.add(lowerPan);

  // 2. Main Sculpted Body Beltline
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(W, beltH, L), bodyPaintMat);
  mainBody.position.set(0, baseBeltY, 0.0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  bodyGroup.add(mainBody);

  // Sculpted Hood Power Dome & Character Ribs
  const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(W * 0.90, 0.12, L * 0.34), bodyPaintMat);
  hoodSlope.position.set(0, baseBeltY + beltH * 0.52, L * 0.28);
  hoodSlope.rotation.x = d.roofStyle === 'supercar' ? 0.14 : 0.075;
  hoodSlope.castShadow = true;
  bodyGroup.add(hoodSlope);

  const powerDome = new THREE.Mesh(new THREE.BoxGeometry(W * 0.35, 0.06, L * 0.26), d.roofStyle === 'offroad' ? carbonMat : bodyPaintMat);
  powerDome.position.set(0, baseBeltY + beltH * 0.58, L * 0.26);
  powerDome.rotation.x = 0.065;
  bodyGroup.add(powerDome);

  for (const side of [-1, 1]) {
    const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.36), carbonMat);
    hoodVent.position.set(side * (W * 0.22), baseBeltY + beltH * 0.56, L * 0.30);
    hoodVent.rotation.x = 0.075;
    bodyGroup.add(hoodVent);
  }

  // Wide Muscular Fender Flares
  const frontZ = L * 0.305;
  const rearZ = -L * 0.295;
  const archPositions = [
    { x: -W * 0.49, y: baseBeltY - 0.04, z: frontZ, len: 0.92 },
    { x: W * 0.49, y: baseBeltY - 0.04, z: frontZ, len: 0.92 },
    { x: -W * 0.50, y: baseBeltY - 0.02, z: rearZ, len: 0.98 },
    { x: W * 0.50, y: baseBeltY - 0.02, z: rearZ, len: 0.98 }
  ];
  archPositions.forEach((ap) => {
    const flare = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.36, ap.len), d.roofStyle === 'offroad' ? carbonMat : bodyPaintMat);
    flare.position.set(ap.x, ap.y, ap.z);
    flare.castShadow = true;
    bodyGroup.add(flare);

    const archLip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, ap.len * 0.92), carbonMat);
    archLip.position.set(ap.x, ap.y + 0.17, ap.z);
    bodyGroup.add(archLip);
  });

  // Side Skirts + M-Gills
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, L * 0.44), carbonMat);
    skirt.position.set(side * (W * 0.50), 0.24 + liftY, 0.02);
    bodyGroup.add(skirt);

    const gill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.24), carbonMat);
    gill.position.set(side * (W * 0.505), baseBeltY + 0.06, L * 0.18);
    bodyGroup.add(gill);
  }

  // 3. Cabin & Carbon Roof
  const cabinW = W * 0.80;
  const cabinCore = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, d.cabinL), bodyPaintMat);
  cabinCore.position.set(0, baseCabinY, d.cabinZ);
  cabinCore.castShadow = true;
  bodyGroup.add(cabinCore);

  const carbonRoof = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.94, 0.06, d.cabinL * 0.88), d.roofStyle === 'suv' ? bodyPaintMat : carbonMat);
  carbonRoof.position.set(0, baseCabinY + cabinH * 0.52, d.cabinZ);
  carbonRoof.castShadow = true;
  bodyGroup.add(carbonRoof);

  // Off-Road Roof Lightbar & Safari Rack (for RR Dakar Trailblazer 4x4)
  if (d.roofRack) {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.88, 0.07, d.cabinL * 0.72), carbonMat);
    rack.position.set(0, baseCabinY + cabinH * 0.62, d.cabinZ);
    bodyGroup.add(rack);
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.82, 0.065, 0.08), headlightMat);
    lightBar.position.set(0, baseCabinY + cabinH * 0.66, d.cabinZ + d.cabinL * 0.34);
    bodyGroup.add(lightBar);
  }

  // High-Downforce GT Rear Wing (for M2 CS Track & RR Apex V10 Supercar)
  if (d.rearWing) {
    const wingY = baseBeltY + beltH * 0.5 + 0.24;
    const wingZ = -L * 0.47;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.04, 0.26), carbonMat);
    blade.position.set(0, wingY, wingZ);
    blade.rotation.x = 0.12;
    bodyGroup.add(blade);
    for (const side of [-1, 1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.16), carbonMat);
      strut.position.set(side * (W * 0.28), wingY - 0.12, wingZ + 0.04);
      bodyGroup.add(strut);
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.30), carbonMat);
      endplate.position.set(side * (W * 0.46), wingY, wingZ);
      bodyGroup.add(endplate);
    }
  }

  // Windshield, Rear Glass & Side Windows
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.95, cabinH * 1.25, 0.05), glassMat);
  frontGlass.position.set(0, baseCabinY, d.cabinZ + d.cabinL * 0.48);
  frontGlass.rotation.x = -0.88;
  bodyGroup.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.92, cabinH * 1.32, 0.05), glassMat);
  rearGlass.position.set(0, baseCabinY, d.cabinZ - d.cabinL * 0.52);
  rearGlass.rotation.x = d.roofStyle === 'suv' || d.roofStyle === 'offroad' ? 0.42 : 0.98;
  bodyGroup.add(rearGlass);

  for (const side of [-1, 1]) {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, cabinH * 0.82, d.cabinL * 0.88), glassMat);
    sideWin.position.set(side * (cabinW * 0.495), baseCabinY + 0.02, d.cabinZ);
    bodyGroup.add(sideWin);
  }

  // Rear Decklid & Carbon Ducktail Spoiler
  const spoilerLip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, 0.065, 0.18), carbonMat);
  spoilerLip.position.set(0, baseBeltY + beltH * 0.52, -L * 0.485);
  spoilerLip.rotation.x = 0.24;
  bodyGroup.add(spoilerLip);

  // 4. Front Fascia: Iconic Twin-Kidney Grille / Intake & Laser DRLs
  const frontZEdge = L * 0.485;
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, beltH * 0.95, 0.26), bodyPaintMat);
  frontBumper.position.set(0, baseBeltY - 0.10, frontZEdge);
  bodyGroup.add(frontBumper);

  const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, 0.065, 0.36), carbonMat);
  frontSplitter.position.set(0, 0.22 + liftY, frontZEdge + 0.02);
  bodyGroup.add(frontSplitter);

  for (const side of [-1, 1]) {
    const kidneyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.32, beltH * 0.98, 0.09), chromeDarkMat);
    kidneyFrame.position.set(side * 0.20, baseBeltY - 0.08, frontZEdge + 0.10);
    bodyGroup.add(kidneyFrame);

    const kidneyCore = new THREE.Mesh(new THREE.BoxGeometry(0.27, beltH * 0.88, 0.10), carbonMat);
    kidneyCore.position.set(side * 0.20, baseBeltY - 0.08, frontZEdge + 0.11);
    bodyGroup.add(kidneyCore);

    const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), carbonMat);
    hlHousing.position.set(side * (W * 0.34), baseBeltY + 0.09, frontZEdge + 0.02);
    hlHousing.rotation.y = -side * 0.16;
    bodyGroup.add(hlHousing);

    for (const ringOffset of [-0.09, 0.09]) {
      const drlBlade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.04), headlightMat);
      drlBlade.position.set(side * (W * 0.34 + ringOffset), baseBeltY + 0.07, frontZEdge + 0.10);
      drlBlade.rotation.y = -side * 0.16;
      bodyGroup.add(drlBlade);
    }

    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const frontTurnBrow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.026, 0.05), turnMat);
    frontTurnBrow.position.set(side * (W * 0.34), baseBeltY + 0.155, frontZEdge + 0.09);
    frontTurnBrow.rotation.y = -side * 0.16;
    bodyGroup.add(frontTurnBrow);
  }

  // 5. Rear Fascia: L-Blade LED Taillights, Carbon Diffuser & Quad Exhausts
  const rearZEdge = -L * 0.485;
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, beltH, 0.24), bodyPaintMat);
  rearBumper.position.set(0, baseBeltY - 0.08, rearZEdge);
  bodyGroup.add(rearBumper);

  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(W * 0.90, 0.22, 0.22), carbonMat);
  rearDiffuser.position.set(0, 0.28 + liftY, rearZEdge - 0.04);
  bodyGroup.add(rearDiffuser);

  for (const side of [-1, 1]) {
    const tailOuter = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.11, 0.08), taillightMat);
    tailOuter.position.set(side * (W * 0.33), baseBeltY + 0.14, rearZEdge - 0.08);
    bodyGroup.add(tailOuter);

    const revBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.09), reverseLightMat);
    revBar.position.set(side * (W * 0.28), baseBeltY + 0.09, rearZEdge - 0.09);
    bodyGroup.add(revBar);

    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const rearTurnStrip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.028, 0.09), turnMat);
    rearTurnStrip.position.set(side * (W * 0.34), baseBeltY + 0.065, rearZEdge - 0.09);
    bodyGroup.add(rearTurnStrip);

    for (const pipeOff of [-0.07, 0.07]) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.22, 14).rotateX(Math.PI / 2),
        chromeDarkMat
      );
      pipe.position.set(side * 0.46 + pipeOff, 0.26 + liftY, rearZEdge - 0.12);
      bodyGroup.add(pipe);
    }
  }

  // 6. Quad-Exhaust M-Boost / Nitrous Plasma Flame Group
  const nitroGroup = new THREE.Group();
  const nitroOuterMat = new THREE.MeshBasicMaterial({
    color: 0x168bff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const nitroCoreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  for (const side of [-1, 1]) {
    for (const pipeOff of [-0.07, 0.07]) {
      const coneOuter = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.72, 10).rotateX(-Math.PI / 2),
        nitroOuterMat
      );
      coneOuter.position.set(side * 0.46 + pipeOff, 0.26 + liftY, rearZEdge - 0.56);
      const coneCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.036, 0.44, 8).rotateX(-Math.PI / 2),
        nitroCoreMat
      );
      coneCore.position.set(side * 0.46 + pipeOff, 0.26 + liftY, rearZEdge - 0.42);
      nitroGroup.add(coneOuter, coneCore);
    }
  }
  const nitroLight = new THREE.PointLight(0x168bff, 0, 7.5);
  nitroLight.position.set(0, 0.35 + liftY, rearZEdge - 0.60);
  nitroGroup.add(nitroLight);
  nitroGroup.visible = false;
  bodyGroup.add(nitroGroup);

  // 7. Side Mirrors with Amber Turn Signal Repeaters
  for (const side of [-1, 1]) {
    const mirrorGroup = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.14), carbonMat);
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.06), carbonMat);
    stalk.position.set(-side * 0.06, -0.02, 0);
    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const mirrorBlink = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.03), turnMat);
    mirrorBlink.position.set(side * 0.02, 0.01, 0.065);
    mirrorGroup.add(cap, stalk, mirrorBlink);
    mirrorGroup.position.set(side * (W * 0.52), baseBeltY + 0.28, 0.52);
    bodyGroup.add(mirrorGroup);
  }

  // 8. Detailed Cockpit Interior
  const cockpitGroup = new THREE.Group();
  cockpitGroup.position.y = liftY;

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 1.85), interiorTrimMat);
  floorMesh.position.set(0, 0.36, -0.10);
  cockpitGroup.add(floorMesh);

  const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 1.35), leatherMat);
  consoleMesh.position.set(0, 0.54, -0.05);
  cockpitGroup.add(consoleMesh);

  const dashMesh = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.28, 0.52), leatherMat);
  dashMesh.position.set(0, 0.80, 0.46);
  cockpitGroup.add(dashMesh);

  const cockpitScreen = createCockpitScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: cockpitScreen.tex });
  const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.15, 0.025), screenMat);
  screenMesh.position.set(-0.10, 0.965, 0.30);
  screenMesh.rotation.y = 0.08;
  cockpitGroup.add(screenMesh);

  for (const side of [-1, 1]) {
    const seatGroup = new THREE.Group();
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.48), leatherMat);
    cushion.position.set(0, 0.46, -0.18);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.10), leatherMat);
    backrest.position.set(0, 0.76, -0.38);
    backrest.rotation.x = -0.18;
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.09), carbonMat);
    headrest.position.set(0, 1.10, -0.44);
    seatGroup.add(cushion, backrest, headrest);
    seatGroup.position.set(side * 0.36, 0, 0);
    cockpitGroup.add(seatGroup);
  }

  const steeringWheelGroup = new THREE.Group();
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.024, 10, 28), leatherMat);
  steeringWheelGroup.add(rimMesh);
  const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.04, 16).rotateX(Math.PI / 2), carbonMat);
  steeringWheelGroup.add(hubMesh);
  const spokeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.028, 0.022), chromeDarkMat);
  steeringWheelGroup.add(spokeMesh);

  steeringWheelGroup.position.set(-0.36, 0.87, 0.14);
  steeringWheelGroup.rotation.x = -0.32;
  cockpitGroup.add(steeringWheelGroup);
  bodyGroup.add(cockpitGroup);

  // 9. Four Separate Articulated Wheels
  const wR = d.wheelR || 0.36;
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.82, metalness: 0.1 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x262a30, metalness: 0.88, roughness: 0.22 });
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x777c85, metalness: 0.8, roughness: 0.35 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0x168bff, metalness: 0.6, roughness: 0.3 });

  const wheels = [];
  const wheelPositions = [
    { x: -W * 0.45, y: wR, z: frontZ, isFront: true, side: -1 },
    { x: W * 0.45, y: wR, z: frontZ, isFront: true, side: 1 },
    { x: -W * 0.46, y: wR, z: rearZ, isFront: false, side: -1 },
    { x: W * 0.46, y: wR, z: rearZ, isFront: false, side: 1 }
  ];

  wheelPositions.forEach((wp) => {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(wp.x, wp.y, wp.z);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.12), caliperMat);
    caliper.position.set(wp.side * 0.05, 0.06, -0.14);
    steerPivot.add(caliper);

    const spinGroup = new THREE.Group();
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(wR, wR, 0.28, 24).rotateZ(Math.PI / 2),
      tireMat
    );
    tire.castShadow = true;
    spinGroup.add(tire);

    const rimBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(wR * 0.78, wR * 0.78, 0.26, 20).rotateZ(Math.PI / 2),
      rimMat
    );
    spinGroup.add(rimBarrel);

    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(wR * 0.65, wR * 0.65, 0.04, 18).rotateZ(Math.PI / 2),
      rotorMat
    );
    spinGroup.add(rotor);

    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, wR * 1.52, 0.035), rimMat);
      spoke.position.x = wp.side * 0.115;
      spoke.rotation.x = (i * Math.PI) / 5;
      spinGroup.add(spoke);
    }

    steerPivot.add(spinGroup);
    root.add(steerPivot);
    wheels.push({ steerPivot, spinGroup, isFront: wp.isFront, baseY: wp.y });
  });

  // 10. Headlight Spotlights + Taillight Point Glow + Chassis Underglow
  const headSpotL = new THREE.SpotLight(0xdcf0ff, 28, 65, Math.PI / 5, 0.45, 1.4);
  headSpotL.position.set(-0.65, 0.65 + liftY, frontZEdge);
  headSpotL.target.position.set(-0.65, 0.0, 18.0);
  bodyGroup.add(headSpotL);
  bodyGroup.add(headSpotL.target);

  const headSpotR = new THREE.SpotLight(0xdcf0ff, 28, 65, Math.PI / 5, 0.45, 1.4);
  headSpotR.position.set(0.65, 0.65 + liftY, frontZEdge);
  headSpotR.target.position.set(0.65, 0.0, 18.0);
  bodyGroup.add(headSpotR);
  bodyGroup.add(headSpotR.target);

  const tailPointLight = new THREE.PointLight(0xff1111, 1.2, 6.5);
  tailPointLight.position.set(0, 0.65 + liftY, rearZEdge - 0.15);
  bodyGroup.add(tailPointLight);

  const underglowMat = new THREE.MeshBasicMaterial({
    map: createUnderglowTexture(),
    color: 0x168bff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5
  });
  const underglowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.35, L * 1.12).rotateX(-Math.PI / 2),
    underglowMat
  );
  underglowMesh.position.y = 0.045;
  underglowMesh.renderOrder = 3;
  underglowMesh.visible = false;
  root.add(underglowMesh);

  return {
    spec,
    root,
    bodyGroup,
    cockpitGroup,
    cockpitScreen,
    wheels,
    steeringWheelGroup,
    nitroGroup,
    nitroLight,
    underglowMesh,
    materials: {
      bodyPaintMat,
      headlightMat,
      taillightMat,
      reverseLightMat,
      turnLeftMat,
      turnRightMat,
      rimMat,
      caliperMat,
      glassMat,
      underglowMat
    },
    lights: {
      headSpotL,
      headSpotR,
      tailPointLight,
      nitroLight
    }
  };
}

/**
 * Builds a streamlined high-performance M-Coupe mesh for Multiplayer Peers & AI Rivals.
 */
export function buildRivalBMWCoupe(paintHex = '#b8141c') {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintHex),
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x141820, metalness: 0.4, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b121c, metalness: 0.9, roughness: 0.08 });
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xff1820 });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.26, 4.56), darkMat);
  lower.position.y = 0.32;
  group.add(lower);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.44, 4.62), paintMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.42, 1.92), glassMat);
  cabin.position.set(0, 1.00, -0.20);
  group.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.06, 1.62), darkMat);
  roof.position.set(0, 1.23, -0.20);
  group.add(roof);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.06, 0.18), darkMat);
  spoiler.position.set(0, 0.90, -2.24);
  group.add(spoiler);

  const hl = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.10, 0.08), hlMat);
  hl.position.set(0, 0.66, 2.32);
  group.add(hl);

  const tl = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.11, 0.08), tlMat);
  tl.position.set(0, 0.72, -2.32);
  group.add(tl);

  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 16).rotateZ(Math.PI / 2);
  for (const [wx, wz] of [[-0.88, 1.40], [0.88, 1.40], [-0.90, -1.36], [0.90, -1.36]]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(wx, 0.35, wz);
    group.add(w);
  }

  return { group, paintMat, tailMat: tlMat };
}

/**
 * Builds an articulated 3D NPC Pedestrian with swinging arms and walking legs (Section 5).
 */
export function buildNPCPedestrian(shirtColor = 0x168bff, pantsColor = 0x1a2230, skinColor = 0xe0b494) {
  const root = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.75 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x181412, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), shirtMat);
  torso.position.y = 1.08;
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
  head.position.y = 1.52;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.10, 0.25), hairMat);
  hair.position.y = 1.64;
  root.add(hair);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.18), pantsMat);
  leftLeg.position.set(-0.11, 0.42, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.18), pantsMat);
  rightLeg.position.set(0.11, 0.42, 0);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.14), shirtMat);
  leftArm.position.set(-0.29, 1.06, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.14), shirtMat);
  rightArm.position.set(0.29, 1.06, 0);

  root.add(leftLeg, rightLeg, leftArm, rightArm);
  return { root, leftLeg, rightLeg, leftArm, rightArm };
}

/**
 * Optional loader for external high-poly GLB vehicle models.
 */
export function loadExternalGLBVehicle(url, carRig, onStatus = () => {}) {
  if (!url || !url.trim()) return;
  const loader = new GLTFLoader();
  onStatus('Loading custom GLB asset...');
  loader.load(
    url.trim(),
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = 4.65 / Math.max(size.x, size.z, 0.01);
      model.scale.setScalar(scale);

      const keep = [
        carRig.lights.headSpotL,
        carRig.lights.headSpotL.target,
        carRig.lights.headSpotR,
        carRig.lights.headSpotR.target,
        carRig.lights.tailPointLight,
        carRig.nitroGroup
      ];
      for (let i = carRig.bodyGroup.children.length - 1; i >= 0; i--) {
        const child = carRig.bodyGroup.children[i];
        if (!keep.includes(child)) {
          carRig.bodyGroup.remove(child);
        }
      }
      carRig.bodyGroup.add(model);
      onStatus('Custom GLB loaded successfully.');
    },
    undefined,
    (err) => {
      console.warn('Optional GLB failed to load; keeping procedural vehicle:', err);
      onStatus('GLB load failed. Using built-in Procedural Vehicle.');
    }
  );
}

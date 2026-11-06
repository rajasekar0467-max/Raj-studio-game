import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Creates a procedural live iDrive digital cockpit display texture so the
 * interior screen shows real-time speed, gear, and RPM in Cockpit view.
 */
function createCockpitScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = (speedVal = 0, gear = '1', rpm = 850, unitLabel = 'KM/H') => {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 512, 128);

    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#00a8ff');
    grad.addColorStop(0.5, '#262262');
    grad.addColorStop(1, '#e41e26');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 4);

    ctx.fillStyle = '#8e9fb5';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`SPEED ${unitLabel}`, 28, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(String(Math.round(Math.abs(speedVal))), 28, 88);

    ctx.fillStyle = 'rgba(0, 168, 255, 0.16)';
    ctx.fillRect(216, 22, 80, 84);
    ctx.strokeStyle = '#00a8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(216, 22, 80, 84);
    ctx.fillStyle = '#00a8ff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(gear), 256, 84);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#8e9fb5';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ENGINE RPM', 330, 34);
    ctx.fillStyle = rpm > 6300 ? '#e41e26' : '#f2f6fa';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(String(Math.round(rpm / 10) * 10), 330, 74);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(330, 88, 154, 14);
    const rpmFrac = Math.min(1, Math.max(0, rpm / 7200));
    ctx.fillStyle = rpm > 6300 ? '#e41e26' : '#00a8ff';
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
 * Builds a detailed procedural BMW M4 Competition-inspired performance coupe
 * featuring sculpted aerodynamic bodywork, deep wheel arches, twin-kidney grille,
 * laser-style DRL headlights, L-blade taillights, 3D amber turn signals,
 * quad-exhaust M-Boost nitro flames, chassis neon underglow, articulated 10-spoke
 * wheels with drilled rotors & M-calipers, and a complete cockpit interior.
 */
export function buildProceduralBMW() {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0a2b6e'),
    metalness: 0.86,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    envMapIntensity: 1.35
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

  // 1. Lower Chassis & Floor Sill
  const lowerPan = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.28, 4.58), carbonMat);
  lowerPan.position.set(0, 0.34, 0.02);
  lowerPan.castShadow = true;
  lowerPan.receiveShadow = true;
  bodyGroup.add(lowerPan);

  // 2. Main Sculpted Body Beltline
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.44, 4.66), bodyPaintMat);
  mainBody.position.set(0, 0.60, 0.0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  bodyGroup.add(mainBody);

  // Sculpted Hood Power Dome & Character Ribs
  const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.12, 1.56), bodyPaintMat);
  hoodSlope.position.set(0, 0.83, 1.32);
  hoodSlope.rotation.x = 0.075;
  hoodSlope.castShadow = true;
  bodyGroup.add(hoodSlope);

  const powerDome = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 1.22), bodyPaintMat);
  powerDome.position.set(0, 0.87, 1.25);
  powerDome.rotation.x = 0.065;
  bodyGroup.add(powerDome);

  for (const side of [-1, 1]) {
    const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.36), carbonMat);
    hoodVent.position.set(side * 0.44, 0.86, 1.42);
    hoodVent.rotation.x = 0.075;
    bodyGroup.add(hoodVent);
  }

  // Wide Muscular M4 Fender Flares (Front & Rear)
  const archPositions = [
    { x: -0.96, y: 0.56, z: 1.42, len: 0.92 },
    { x: 0.96, y: 0.56, z: 1.42, len: 0.92 },
    { x: -0.99, y: 0.58, z: -1.38, len: 0.98 },
    { x: 0.99, y: 0.58, z: -1.38, len: 0.98 }
  ];
  archPositions.forEach((ap) => {
    const flare = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, ap.len), bodyPaintMat);
    flare.position.set(ap.x, ap.y, ap.z);
    flare.castShadow = true;
    bodyGroup.add(flare);

    const archLip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, ap.len * 0.92), carbonMat);
    archLip.position.set(ap.x, ap.y + 0.17, ap.z);
    bodyGroup.add(archLip);
  });

  // Side Skirts + M-Gills
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 2.05), carbonMat);
    skirt.position.set(side * 0.99, 0.24, 0.02);
    bodyGroup.add(skirt);

    const gill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.24), carbonMat);
    gill.position.set(side * 1.00, 0.68, 0.86);
    bodyGroup.add(gill);
  }

  // 3. Fastback Coupe Cabin & Carbon Fiber Roof
  const cabinCore = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.44, 1.88), bodyPaintMat);
  cabinCore.position.set(0, 1.04, -0.22);
  cabinCore.castShadow = true;
  bodyGroup.add(cabinCore);

  const carbonRoof = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.06, 1.65), carbonMat);
  carbonRoof.position.set(0, 1.27, -0.22);
  carbonRoof.castShadow = true;
  bodyGroup.add(carbonRoof);

  for (const side of [-1, 1]) {
    const roofFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 1.52), bodyPaintMat);
    roofFin.position.set(side * 0.68, 1.29, -0.22);
    bodyGroup.add(roofFin);
  }

  const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.18), carbonMat);
  sharkFin.position.set(0, 1.32, -0.88);
  bodyGroup.add(sharkFin);

  // Windshield, Rear Fastback Glass & Side Windows
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.56, 0.05), glassMat);
  frontGlass.position.set(0, 1.05, 0.68);
  frontGlass.rotation.x = -0.88;
  bodyGroup.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.62, 0.05), glassMat);
  rearGlass.position.set(0, 1.04, -1.24);
  rearGlass.rotation.x = 0.98;
  bodyGroup.add(rearGlass);

  for (const side of [-1, 1]) {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 1.66), glassMat);
    sideWin.position.set(side * 0.78, 1.06, -0.22);
    bodyGroup.add(sideWin);
  }

  // Rear Decklid & Carbon Ducktail Spoiler
  const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 0.74), bodyPaintMat);
  rearDeck.position.set(0, 0.84, -1.92);
  rearDeck.rotation.x = -0.06;
  rearDeck.castShadow = true;
  bodyGroup.add(rearDeck);

  const spoilerLip = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.065, 0.18), carbonMat);
  spoilerLip.position.set(0, 0.94, -2.26);
  spoilerLip.rotation.x = 0.24;
  bodyGroup.add(spoilerLip);

  // 4. Front Fascia: Iconic G82 Twin-Kidney Grille, Carbon Intake Splitters & Laser DRLs
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.42, 0.26), bodyPaintMat);
  frontBumper.position.set(0, 0.48, 2.26);
  bodyGroup.add(frontBumper);

  const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.065, 0.36), carbonMat);
  frontSplitter.position.set(0, 0.22, 2.28);
  bodyGroup.add(frontSplitter);

  for (const side of [-1, 1]) {
    const kidneyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.09), chromeDarkMat);
    kidneyFrame.position.set(side * 0.20, 0.50, 2.36);
    bodyGroup.add(kidneyFrame);

    const kidneyCore = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.41, 0.10), carbonMat);
    kidneyCore.position.set(side * 0.20, 0.50, 2.37);
    bodyGroup.add(kidneyCore);

    for (let s = -3; s <= 3; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.018, 0.11), chromeDarkMat);
      slat.position.set(side * 0.20, 0.50 + s * 0.052, 2.38);
      bodyGroup.add(slat);
    }

    const sideIntake = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.10), carbonMat);
    sideIntake.position.set(side * 0.72, 0.40, 2.35);
    bodyGroup.add(sideIntake);

    // Headlight Housing + Twin Hexagonal Angel-Eye DRL Signatures
    const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), carbonMat);
    hlHousing.position.set(side * 0.68, 0.69, 2.28);
    hlHousing.rotation.y = -side * 0.16;
    bodyGroup.add(hlHousing);

    for (const ringOffset of [-0.09, 0.09]) {
      const drlBlade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.04), headlightMat);
      drlBlade.position.set(side * (0.68 + ringOffset), 0.67, 2.36);
      drlBlade.rotation.y = -side * 0.16;
      bodyGroup.add(drlBlade);

      const drlVert = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.085, 0.04), headlightMat);
      drlVert.position.set(side * (0.68 + ringOffset + 0.05), 0.69, 2.36);
      bodyGroup.add(drlVert);
    }

    // Front Amber Turn Signal Eyebrow LED
    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const frontTurnBrow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.026, 0.05), turnMat);
    frontTurnBrow.position.set(side * 0.68, 0.755, 2.35);
    frontTurnBrow.rotation.y = -side * 0.16;
    bodyGroup.add(frontTurnBrow);
  }

  // 5. Rear Fascia: L-Blade LED Taillights, Carbon Diffuser & Quad Exhausts
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.44, 0.24), bodyPaintMat);
  rearBumper.position.set(0, 0.50, -2.26);
  bodyGroup.add(rearBumper);

  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.22, 0.22), carbonMat);
  rearDiffuser.position.set(0, 0.28, -2.30);
  bodyGroup.add(rearDiffuser);

  for (const side of [-1, 1]) {
    const tailOuter = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.11, 0.08), taillightMat);
    tailOuter.position.set(side * 0.66, 0.74, -2.34);
    bodyGroup.add(tailOuter);

    const tailVertical = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.08), taillightMat);
    tailVertical.position.set(side * 0.88, 0.76, -2.34);
    bodyGroup.add(tailVertical);

    const revBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.09), reverseLightMat);
    revBar.position.set(side * 0.56, 0.69, -2.35);
    bodyGroup.add(revBar);

    // Rear Amber Turn Signal Strip
    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const rearTurnStrip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.028, 0.09), turnMat);
    rearTurnStrip.position.set(side * 0.68, 0.665, -2.35);
    bodyGroup.add(rearTurnStrip);

    // Quad M-Exhaust Tips (2 per side)
    for (const pipeOff of [-0.07, 0.07]) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.22, 14).rotateX(Math.PI / 2),
        chromeDarkMat
      );
      pipe.position.set(side * 0.46 + pipeOff, 0.26, -2.38);
      bodyGroup.add(pipe);
    }
  }

  // 6. Phase 2 Quad-Exhaust M-Boost / Nitrous Plasma Flame Group
  const nitroGroup = new THREE.Group();
  const nitroOuterMat = new THREE.MeshBasicMaterial({
    color: 0x00c8ff,
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
      coneOuter.position.set(side * 0.46 + pipeOff, 0.26, -2.82);
      const coneCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.036, 0.44, 8).rotateX(-Math.PI / 2),
        nitroCoreMat
      );
      coneCore.position.set(side * 0.46 + pipeOff, 0.26, -2.68);
      nitroGroup.add(coneOuter, coneCore);
    }
  }
  const nitroLight = new THREE.PointLight(0x00d2ff, 0, 7.5);
  nitroLight.position.set(0, 0.35, -2.85);
  nitroGroup.add(nitroLight);
  nitroGroup.visible = false;
  bodyGroup.add(nitroGroup);

  // 7. M-Aerodynamic Twin-Stalk Side Mirrors with Amber Turn Signal Repeaters
  for (const side of [-1, 1]) {
    const mirrorGroup = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.14), carbonMat);
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.06), carbonMat);
    stalk.position.set(-side * 0.06, -0.02, 0);
    const turnMat = side < 0 ? turnLeftMat : turnRightMat;
    const mirrorBlink = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.03), turnMat);
    mirrorBlink.position.set(side * 0.02, 0.01, 0.065);
    mirrorGroup.add(cap, stalk, mirrorBlink);
    mirrorGroup.position.set(side * 1.03, 0.88, 0.52);
    bodyGroup.add(mirrorGroup);
  }

  // 8. Detailed Cockpit Interior
  const cockpitGroup = new THREE.Group();

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 1.85), interiorTrimMat);
  floorMesh.position.set(0, 0.36, -0.10);
  cockpitGroup.add(floorMesh);

  const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 1.35), leatherMat);
  consoleMesh.position.set(0, 0.54, -0.05);
  cockpitGroup.add(consoleMesh);

  const shifterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.075), carbonMat);
  shifterMesh.position.set(-0.04, 0.72, 0.12);
  shifterMesh.rotation.x = -0.15;
  cockpitGroup.add(shifterMesh);

  const dashGeo = new THREE.BoxGeometry(1.52, 0.28, 0.52);
  const dashMesh = new THREE.Mesh(dashGeo, leatherMat);
  dashMesh.position.set(0, 0.80, 0.46);
  cockpitGroup.add(dashMesh);

  const dashTrim = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.045, 0.46), carbonMat);
  dashTrim.position.set(0, 0.88, 0.42);
  cockpitGroup.add(dashTrim);

  const cockpitScreen = createCockpitScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: cockpitScreen.tex });
  const screenGeo = new THREE.BoxGeometry(0.74, 0.15, 0.025);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(-0.10, 0.965, 0.30);
  screenMesh.rotation.y = 0.08;
  cockpitGroup.add(screenMesh);

  for (const side of [-1, 1]) {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.52, 0.065), interiorTrimMat);
    aPillar.position.set(side * 0.70, 1.05, 0.42);
    aPillar.rotation.x = -0.62;
    aPillar.rotation.z = side * 0.18;
    cockpitGroup.add(aPillar);

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

  const rearViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.03), interiorTrimMat);
  rearViewMirror.position.set(0, 1.21, 0.25);
  cockpitGroup.add(rearViewMirror);

  const steeringWheelGroup = new THREE.Group();
  const rimGeo = new THREE.TorusGeometry(0.165, 0.024, 10, 28);
  const rimMesh = new THREE.Mesh(rimGeo, leatherMat);
  steeringWheelGroup.add(rimMesh);

  const markerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.052, 0.052),
    new THREE.MeshBasicMaterial({ color: 0xe41e26 })
  );
  markerMesh.position.set(0, 0.165, 0);
  steeringWheelGroup.add(markerMesh);

  const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.04, 16).rotateX(Math.PI / 2), carbonMat);
  steeringWheelGroup.add(hubMesh);

  const spokeGeo = new THREE.BoxGeometry(0.30, 0.028, 0.022);
  const spokeMesh = new THREE.Mesh(spokeGeo, chromeDarkMat);
  steeringWheelGroup.add(spokeMesh);

  const lowSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.022), chromeDarkMat);
  lowSpoke.position.set(0, -0.08, 0);
  steeringWheelGroup.add(lowSpoke);

  for (const side of [-1, 1]) {
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.012), carbonMat);
    paddle.position.set(side * 0.11, 0.03, 0.03);
    steeringWheelGroup.add(paddle);
  }

  steeringWheelGroup.position.set(-0.36, 0.87, 0.14);
  steeringWheelGroup.rotation.x = -0.32;
  cockpitGroup.add(steeringWheelGroup);
  bodyGroup.add(cockpitGroup);

  // 9. Four Separate Articulated Wheels
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.82, metalness: 0.1 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x262a30, metalness: 0.88, roughness: 0.22 });
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x777c85, metalness: 0.8, roughness: 0.35 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0x0055aa, metalness: 0.6, roughness: 0.3 });

  const wheels = [];
  const wheelPositions = [
    { x: -0.88, y: 0.36, z: 1.42, isFront: true, side: -1 },
    { x: 0.88, y: 0.36, z: 1.42, isFront: true, side: 1 },
    { x: -0.90, y: 0.36, z: -1.38, isFront: false, side: -1 },
    { x: 0.90, y: 0.36, z: -1.38, isFront: false, side: 1 }
  ];

  wheelPositions.forEach((wp) => {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(wp.x, wp.y, wp.z);

    const caliperGeo = new THREE.BoxGeometry(0.08, 0.18, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(wp.side * 0.05, 0.06, -0.14);
    steerPivot.add(caliper);

    const spinGroup = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    spinGroup.add(tire);

    const rimBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.285, 0.285, 0.26, 20).rotateZ(Math.PI / 2),
      rimMat
    );
    spinGroup.add(rimBarrel);

    const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 18);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    spinGroup.add(rotor);

    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.035), rimMat);
      spoke.position.x = wp.side * 0.115;
      spoke.rotation.x = (i * Math.PI) / 5;
      spinGroup.add(spoke);
    }

    steerPivot.add(spinGroup);
    root.add(steerPivot);
    wheels.push({ steerPivot, spinGroup, isFront: wp.isFront, baseY: wp.y });
  });

  // 10. Real Headlight Spotlights + Taillight Point Glow + Chassis Underglow
  const headSpotL = new THREE.SpotLight(0xdcf0ff, 28, 65, Math.PI / 5, 0.45, 1.4);
  headSpotL.position.set(-0.65, 0.65, 2.2);
  headSpotL.target.position.set(-0.65, 0.0, 18.0);
  bodyGroup.add(headSpotL);
  bodyGroup.add(headSpotL.target);

  const headSpotR = new THREE.SpotLight(0xdcf0ff, 28, 65, Math.PI / 5, 0.45, 1.4);
  headSpotR.position.set(0.65, 0.65, 2.2);
  headSpotR.target.position.set(0.65, 0.0, 18.0);
  bodyGroup.add(headSpotR);
  bodyGroup.add(headSpotR.target);

  const tailPointLight = new THREE.PointLight(0xff1111, 1.2, 6.5);
  tailPointLight.position.set(0, 0.65, -2.5);
  bodyGroup.add(tailPointLight);

  const underglowMat = new THREE.MeshBasicMaterial({
    map: createUnderglowTexture(),
    color: 0x00d8ff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5
  });
  const underglowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 5.2).rotateX(-Math.PI / 2),
    underglowMat
  );
  underglowMesh.position.y = 0.045;
  underglowMesh.renderOrder = 3;
  underglowMesh.visible = false;
  root.add(underglowMesh);

  return {
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
 * Builds a streamlined high-performance M-Coupe mesh for Phase 2 Multiplayer Peers
 * and AI Convoy Rivals on the highway.
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

  return { group, paintMat };
}

/**
 * Optional loader for external high-poly GLB vehicle models.
 * Falls back cleanly to the procedural vehicle if URL fails or is invalid.
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
      console.warn('Optional GLB failed to load; keeping procedural BMW M-Coupe:', err);
      onStatus('GLB load failed. Using built-in Procedural M-Coupe.');
    }
  );
}

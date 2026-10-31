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

  const draw = (speedKmh = 0, gear = '1', rpm = 850) => {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 512, 128);

    // Subtle M border accent
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#00a8ff');
    grad.addColorStop(0.5, '#262262');
    grad.addColorStop(1, '#e41e26');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 4);

    // Left Gauge: Speed
    ctx.fillStyle = '#8e9fb5';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SPEED KM/H', 28, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(String(Math.round(Math.abs(speedKmh))), 28, 88);

    // Center: Gear Indicator
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

    // Right: RPM + Bar
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

  draw(0, '1', 850);
  return { tex, draw };
}

/**
 * Builds a detailed procedural BMW M4 Competition-inspired performance coupe
 * featuring sculpted aerodynamic bodywork, deep wheel arches, twin-kidney grille,
 * laser-style DRL headlights, L-blade taillights, articulated 10-spoke wheels with
 * drilled rotors & M-calipers, and a complete cockpit interior visible from first-person cam.
 */
export function buildProceduralBMW() {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // PBR Materials
  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#08090c'),
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

  // Exterior glass: DoubleSide = false (FrontSide only) so from inside the cockpit
  // looking out, the windshield does not occlude or darken the road ahead, while
  // external camera views still show realistic tinted reflections.
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

  // 1. Sculpted Lower Chassis, Haunches & Fenders
  const lowerBodyGeo = new THREE.BoxGeometry(1.94, 0.52, 4.72, 10, 4, 20);
  const pos = lowerBodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Aerodynamic front nose slope
    if (z > 1.2 && y > 0) {
      y -= Math.pow((z - 1.2) / 1.16, 1.35) * 0.16;
    }
    // Slight rear decklid kick-up
    if (z < -1.6 && y > 0) {
      y += ((Math.abs(z) - 1.6) / 0.76) * 0.04;
    }
    // Taper front and rear bumpers smoothly
    if (Math.abs(z) > 1.92) {
      x *= 0.90;
    }
    // Pronounced M-fender flares around front and rear wheel arches
    const distFront = Math.abs(z - 1.42);
    const distRear = Math.abs(z + 1.38);
    if (distFront < 0.56 && Math.abs(x) > 0.72) {
      x *= 1.0 + Math.cos((distFront / 0.56) * (Math.PI * 0.5)) * 0.065;
    }
    if (distRear < 0.60 && Math.abs(x) > 0.72) {
      x *= 1.0 + Math.cos((distRear / 0.60) * (Math.PI * 0.5)) * 0.075;
    }
    // Sculpted door waist pinch
    if (Math.abs(z) < 0.75 && Math.abs(y) < 0.12 && Math.abs(x) > 0.85) {
      x *= 0.965;
    }
    pos.setXYZ(i, x, y, z);
  }
  lowerBodyGeo.computeVertexNormals();
  const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, bodyPaintMat);
  lowerBodyMesh.position.y = 0.54;
  lowerBodyMesh.castShadow = true;
  lowerBodyMesh.receiveShadow = true;
  bodyGroup.add(lowerBodyMesh);

  // Dark wheel well liners so the body never looks hollow around tires
  const wellMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
  const wellGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.34, 16, 1, false, 0, Math.PI);
  wellGeo.rotateZ(Math.PI / 2);
  [
    [-0.84, 0.38, 1.42],
    [0.84, 0.38, 1.42],
    [-0.86, 0.38, -1.38],
    [0.86, 0.38, -1.38]
  ].forEach(([wx, wy, wz]) => {
    const wMesh = new THREE.Mesh(wellGeo, wellMat);
    wMesh.position.set(wx, wy, wz);
    bodyGroup.add(wMesh);
  });

  // Side Skirts (Gloss Carbon) & Door Seams / Handles
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 2.05), carbonMat);
    skirt.position.set(side * 0.97, 0.29, 0.02);
    bodyGroup.add(skirt);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.18), bodyPaintMat);
    handle.position.set(side * 0.96, 0.72, -0.18);
    bodyGroup.add(handle);

    const gill = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.16), carbonMat);
    gill.position.set(side * 0.97, 0.66, 0.92);
    bodyGroup.add(gill);
  }

  // 2. Sculpted Powerdome Hood with Twin Recessed Channels
  const hoodDomeGeo = new THREE.BoxGeometry(1.18, 0.065, 1.38, 4, 1, 4);
  const hoodDome = new THREE.Mesh(hoodDomeGeo, bodyPaintMat);
  hoodDome.position.set(0, 0.805, 1.24);
  hoodDome.rotation.x = 0.065;
  hoodDome.castShadow = true;
  bodyGroup.add(hoodDome);

  for (const side of [-1, 1]) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.55), carbonMat);
    vent.position.set(side * 0.24, 0.835, 1.32);
    vent.rotation.x = 0.065;
    bodyGroup.add(vent);
  }

  // 3. Fastback Greenhouse (Cabin), Pillars & Carbon Roof
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.58, 0);
  cabinShape.lineTo(-0.78, 0.49);
  cabinShape.lineTo(0.32, 0.49);
  cabinShape.lineTo(1.06, 0);
  cabinShape.closePath();

  const cabinExtrude = new THREE.ExtrudeGeometry(cabinShape, {
    steps: 1,
    depth: 1.48,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3
  });
  cabinExtrude.center();
  const cabinMesh = new THREE.Mesh(cabinExtrude, glassMat);
  cabinMesh.rotation.y = Math.PI / 2;
  cabinMesh.position.set(0, 1.03, -0.22);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Carbon Fiber Roof Panel with twin aerodynamic fins
  const roofGeo = new THREE.BoxGeometry(1.36, 0.042, 1.18);
  const roofMesh = new THREE.Mesh(roofGeo, carbonMat);
  roofMesh.position.set(0, 1.295, -0.18);
  roofMesh.castShadow = true;
  bodyGroup.add(roofMesh);

  for (const side of [-1, 1]) {
    const roofRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.055, 1.16), bodyPaintMat);
    roofRail.position.set(side * 0.66, 1.30, -0.18);
    bodyGroup.add(roofRail);
  }

  // 4. Recognizable Twin-Kidney Vertical Grille + Lower Mesh
  const kidneyGroup = new THREE.Group();
  for (const side of [-1, 1]) {
    const frameGeo = new THREE.BoxGeometry(0.28, 0.38, 0.08);
    const frame = new THREE.Mesh(frameGeo, chromeDarkMat);
    frame.position.set(side * 0.165, 0.50, 2.34);
    kidneyGroup.add(frame);

    for (let s = -0.14; s <= 0.14; s += 0.042) {
      const slatGeo = new THREE.BoxGeometry(0.24, 0.015, 0.095);
      const slat = new THREE.Mesh(slatGeo, carbonMat);
      slat.position.set(side * 0.165, 0.50 + s, 2.348);
      kidneyGroup.add(slat);
    }
  }
  bodyGroup.add(kidneyGroup);

  // Front Carbon Splitter & Sculpted Side Air Curtains
  const splitterGeo = new THREE.BoxGeometry(1.88, 0.048, 0.28);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.285, 2.30);
  bodyGroup.add(splitter);

  for (const side of [-1, 1]) {
    const intakeGeo = new THREE.BoxGeometry(0.42, 0.22, 0.09);
    const intake = new THREE.Mesh(intakeGeo, carbonMat);
    intake.position.set(side * 0.64, 0.42, 2.32);
    bodyGroup.add(intake);

    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.18), carbonMat);
    canard.position.set(side * 0.89, 0.36, 2.26);
    canard.rotation.z = side * 0.25;
    bodyGroup.add(canard);
  }

  // 5. Dual-Halo LED Headlights ("Angel Eyes")
  const createHeadlightCluster = (side) => {
    const group = new THREE.Group();
    const housingGeo = new THREE.BoxGeometry(0.43, 0.12, 0.17);
    const housing = new THREE.Mesh(housingGeo, carbonMat);
    group.add(housing);

    for (const offset of [-0.09, 0.09]) {
      const haloGeo = new THREE.BoxGeometry(0.14, 0.036, 0.045);
      const halo = new THREE.Mesh(haloGeo, headlightMat);
      halo.position.set(offset, -0.015, 0.072);
      halo.rotation.z = side * -0.12;
      group.add(halo);
    }
    group.position.set(side * 0.66, 0.635, 2.25);
    group.rotation.y = side * 0.18;
    return group;
  };
  bodyGroup.add(createHeadlightCluster(-1));
  bodyGroup.add(createHeadlightCluster(1));

  // 6. Sculpted L-Shape LED Taillights, Carbon Ducktail Spoiler & Quad Exhausts
  for (const side of [-1, 1]) {
    const tailGeo = new THREE.BoxGeometry(0.54, 0.11, 0.10);
    const tail = new THREE.Mesh(tailGeo, taillightMat);
    tail.position.set(side * 0.62, 0.69, -2.33);
    bodyGroup.add(tail);

    const revGeo = new THREE.BoxGeometry(0.18, 0.035, 0.11);
    const rev = new THREE.Mesh(revGeo, reverseLightMat);
    rev.position.set(side * 0.52, 0.645, -2.34);
    bodyGroup.add(rev);
  }

  const spoilerGeo = new THREE.BoxGeometry(1.54, 0.05, 0.17);
  const spoiler = new THREE.Mesh(spoilerGeo, carbonMat);
  spoiler.position.set(0, 0.85, -2.28);
  spoiler.rotation.x = 0.24;
  bodyGroup.add(spoiler);

  const diffuserGeo = new THREE.BoxGeometry(1.78, 0.19, 0.16);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.34, -2.31);
  bodyGroup.add(diffuser);

  const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.20, 14);
  exhaustGeo.rotateX(Math.PI / 2);
  [-0.52, -0.38, 0.38, 0.52].forEach((xPos) => {
    const pipe = new THREE.Mesh(exhaustGeo, chromeDarkMat);
    pipe.position.set(xPos, 0.32, -2.37);
    bodyGroup.add(pipe);
  });

  // 7. M-Wing Twin-Stalk Side Mirrors
  for (const side of [-1, 1]) {
    const mirrorGroup = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.14), bodyPaintMat);
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.025, 0.06), carbonMat);
    stalk.position.set(-side * 0.06, -0.02, 0);
    mirrorGroup.add(cap, stalk);
    mirrorGroup.position.set(side * 1.03, 0.88, 0.52);
    bodyGroup.add(mirrorGroup);
  }

  // 8. Detailed Cockpit Interior (Visible from Cockpit Camera & Exterior)
  const cockpitGroup = new THREE.Group();

  // Floor & Center Tunnel Console
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

  // Sculpted Upper & Lower Dashboard + Gauge Hood
  const dashGeo = new THREE.BoxGeometry(1.52, 0.28, 0.52);
  const dashMesh = new THREE.Mesh(dashGeo, leatherMat);
  dashMesh.position.set(0, 0.80, 0.46);
  cockpitGroup.add(dashMesh);

  const dashTrim = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.045, 0.46), carbonMat);
  dashTrim.position.set(0, 0.88, 0.42);
  cockpitGroup.add(dashTrim);

  // Curved BMW iDrive Live Digital Screen (updates dynamically with speed/gear/RPM)
  const cockpitScreen = createCockpitScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: cockpitScreen.tex });
  const screenGeo = new THREE.BoxGeometry(0.74, 0.15, 0.025);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(-0.10, 0.965, 0.30);
  screenMesh.rotation.y = 0.08;
  cockpitGroup.add(screenMesh);

  // Interior A-Pillars & Rearview Mirror (frames the windshield view in Cockpit Cam)
  for (const side of [-1, 1]) {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.52, 0.065), interiorTrimMat);
    aPillar.position.set(side * 0.70, 1.05, 0.42);
    aPillar.rotation.x = -0.62;
    aPillar.rotation.z = side * 0.18;
    cockpitGroup.add(aPillar);

    // M Carbon Bucket Seats (Driver + Passenger)
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

  // Articulated M-Sport Steering Wheel with Shift Paddles & Red 12-o'clock Marker
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

  // 9. Four Separate Articulated Wheels (Tire, Multi-Spoke Rim, Brake Disc, M-Caliper)
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

    // Non-rotating brake caliper attached to steering knuckle
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.18, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(wp.side * 0.05, 0.06, -0.14);
    steerPivot.add(caliper);

    // Rotating wheel assembly
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

    // 10-Spoke Twin-Star Alloy Rim
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

  // 10. Real Headlight Spotlights + Taillight Point Glow
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

  return {
    root,
    bodyGroup,
    cockpitGroup,
    cockpitScreen,
    wheels,
    steeringWheelGroup,
    materials: {
      bodyPaintMat,
      headlightMat,
      taillightMat,
      reverseLightMat
    },
    lights: {
      headSpotL,
      headSpotR,
      tailPointLight
    }
  };
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
        carRig.lights.tailPointLight
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

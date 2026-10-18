import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**

- Builds a detailed procedural BMW M4 Competition-inspired performance coupe
- using multi-mesh curved extrusions, PBR clearcoat materials, twin-kidney grilles,
- articulated caliper/rotor wheel assemblies, and interior cockpit dashboard.
  */
  export function buildProceduralBMW() {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

// PBR Materials
const bodyPaintMat = new THREE.MeshPhysicalMaterial({
color: new THREE.Color('#08090c'),
metalness: 0.88,
roughness: 0.16,
clearcoat: 1.0,
clearcoatRoughness: 0.06,
reflectivity: 1.0
});

const carbonMat = new THREE.MeshStandardMaterial({
color: 0x15171a,
metalness: 0.5,
roughness: 0.35
});

const glassMat = new THREE.MeshPhysicalMaterial({
color: 0x05070a,
metalness: 0.1,
roughness: 0.05,
transmission: 0.65,
transparent: true,
opacity: 0.88
});

const chromeDarkMat = new THREE.MeshStandardMaterial({
color: 0x22262b,
metalness: 0.9,
roughness: 0.2
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

// 1. Sculpted Lower Chassis &Fenders
const lowerBodyGeo = new THREE.BoxGeometry(1.94, 0.52, 4.68, 6, 2, 12);
const pos = lowerBodyGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
let x = pos.getX(i);
let y = pos.getY(i);
let z = pos.getZ(i);

// Aerodynamic front nose slope  
if (z > 1.3 && y > 0) {  
  y -= ((z - 1.3) / 1.04) * 0.14;  
}  
// Taper front and rear bumpers slightly  
if (Math.abs(z) > 1.95) {  
  x *= 0.91;  
}  
// Wide M-fender flares around wheel arches  
const nearFrontAxle = Math.abs(z - 1.42) < 0.52;  
const nearRearAxle = Math.abs(z + 1.38) < 0.55;  
if ((nearFrontAxle || nearRearAxle) && Math.abs(x) > 0.75) {  
  x *= 1.055;  
}  
pos.setXYZ(i, x, y, z);

}
lowerBodyGeo.computeVertexNormals();
const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, bodyPaintMat);
lowerBodyMesh.position.y = 0.54;
lowerBodyMesh.castShadow = true;
lowerBodyMesh.receiveShadow = true;
bodyGroup.add(lowerBodyMesh);

// 2. Sculpted Powerdome Hood
const hoodDomeGeo = new THREE.BoxGeometry(1.12, 0.06, 1.35);
const hoodDome = new THREE.Mesh(hoodDomeGeo, bodyPaintMat);
hoodDome.position.set(0, 0.80, 1.25);
hoodDome.rotation.x = 0.06;
bodyGroup.add(hoodDome);

// 3. Fastback Greenhouse (Cabin) & Carbon Roof
const cabinShape = new THREE.Shape();
cabinShape.moveTo(-1.55, 0);
cabinShape.lineTo(-0.78, 0.50);
cabinShape.lineTo(0.32, 0.50);
cabinShape.lineTo(1.05, 0);
cabinShape.closePath();

const cabinExtrude = new THREE.ExtrudeGeometry(cabinShape, {
steps: 1,
depth: 1.50,
bevelEnabled: true,
bevelThickness: 0.09,
bevelSize: 0.07,
bevelSegments: 3
});
cabinExtrude.center();
const cabinMesh = new THREE.Mesh(cabinExtrude, glassMat);
cabinMesh.rotation.y = Math.PI / 2;
cabinMesh.position.set(0, 1.03, -0.22);
cabinMesh.castShadow = true;
bodyGroup.add(cabinMesh);

// Carbon Fiber Roof Panel
const roofGeo = new THREE.BoxGeometry(1.38, 0.04, 1.15);
const roofMesh = new THREE.Mesh(roofGeo, carbonMat);
roofMesh.position.set(0, 1.30, -0.18);
bodyGroup.add(roofMesh);

// 4. Recognizable Twin-Kidney Vertical Grille
const kidneyGroup = new THREE.Group();
for (let side of [-1, 1]) {
const frameGeo = new THREE.BoxGeometry(0.28, 0.36, 0.08);
const frame = new THREE.Mesh(frameGeo, chromeDarkMat);
frame.position.set(side * 0.165, 0.50, 2.33);
kidneyGroup.add(frame);

// Horizontal M-slats  
for (let s = -0.13; s <= 0.13; s += 0.045) {  
  const slatGeo = new THREE.BoxGeometry(0.24, 0.015, 0.09);  
  const slat = new THREE.Mesh(slatGeo, carbonMat);  
  slat.position.set(side * 0.165, 0.50 + s, 2.335);  
  kidneyGroup.add(slat);  
}

}
bodyGroup.add(kidneyGroup);

// Front Carbon Splitter & Side Intakes
const splitterGeo = new THREE.BoxGeometry(1.88, 0.045, 0.26);
const splitter = new THREE.Mesh(splitterGeo, carbonMat);
splitter.position.set(0, 0.29, 2.28);
bodyGroup.add(splitter);

for (let side of [-1, 1]) {
const intakeGeo = new THREE.BoxGeometry(0.42, 0.22, 0.08);
const intake = new THREE.Mesh(intakeGeo, carbonMat);
intake.position.set(side * 0.64, 0.42, 2.31);
bodyGroup.add(intake);
}

// 5. Dual-Halo LED Headlights ("Angel Eyes")
const createHeadlightCluster = (side) => {
const group = new THREE.Group();
const housingGeo = new THREE.BoxGeometry(0.42, 0.12, 0.16);
const housing = new THREE.Mesh(housingGeo, carbonMat);
group.add(housing);

// Twin iconic hexagonal LED DRL signatures  
for (let offset of [-0.09, 0.09]) {  
  const haloGeo = new THREE.BoxGeometry(0.14, 0.035, 0.04);  
  const halo = new THREE.Mesh(haloGeo, headlightMat);  
  halo.position.set(offset, -0.02, 0.07);  
  halo.rotation.z = side * -0.12;  
  group.add(halo);  
}  
group.position.set(side * 0.66, 0.63, 2.24);  
group.rotation.y = side * 0.18;  
return group;

};
bodyGroup.add(createHeadlightCluster(-1));
bodyGroup.add(createHeadlightCluster(1));

// 6. Sculpted L-Shape LED Taillights, Carbon Spoiler & Quad Exhausts
for (let side of [-1, 1]) {
const tailGeo = new THREE.BoxGeometry(0.52, 0.11, 0.10);
const tail = new THREE.Mesh(tailGeo, taillightMat);
tail.position.set(side * 0.62, 0.68, -2.31);
bodyGroup.add(tail);

const revGeo = new THREE.BoxGeometry(0.18, 0.035, 0.11);  
const rev = new THREE.Mesh(revGeo, reverseLightMat);  
rev.position.set(side * 0.52, 0.64, -2.32);  
bodyGroup.add(rev);

}

// Rear Carbon Lip Spoiler
const spoilerGeo = new THREE.BoxGeometry(1.52, 0.05, 0.16);
const spoiler = new THREE.Mesh(spoilerGeo, carbonMat);
spoiler.position.set(0, 0.84, -2.26);
spoiler.rotation.x = 0.22;
bodyGroup.add(spoiler);

// Rear Diffuser & Quad Exhaust Tips
const diffuserGeo = new THREE.BoxGeometry(1.76, 0.18, 0.15);
const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
diffuser.position.set(0, 0.34, -2.29);
bodyGroup.add(diffuser);

const exhaustGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.18, 12);
exhaustGeo.rotateX(Math.PI / 2);
[-0.52, -0.39, 0.39, 0.52].forEach((xPos) => {
const pipe = new THREE.Mesh(exhaustGeo, chromeDarkMat);
pipe.position.set(xPos, 0.32, -2.35);
bodyGroup.add(pipe);
});

// 7. M-Wing Side Mirrors
for (let side of [-1, 1]) {
const mirrorGeo = new THREE.BoxGeometry(0.22, 0.09, 0.14);
const mirror = new THREE.Mesh(mirrorGeo, bodyPaintMat);
mirror.position.set(side * 1.03, 0.88, 0.52);
bodyGroup.add(mirror);
}

// 8. Cockpit Interior Dashboard & Steering Wheel (for Cockpit Cam)
const cockpitGroup = new THREE.Group();
const dashGeo = new THREE.BoxGeometry(1.42, 0.28, 0.45);
const dashMesh = new THREE.Mesh(dashGeo, carbonMat);
dashMesh.position.set(0, 0.82, 0.42);
cockpitGroup.add(dashMesh);

// Curved BMW iDrive Digital Screen
const screenMat = new THREE.MeshBasicMaterial({ color: 0x00a8ff });
const screenGeo = new THREE.BoxGeometry(0.68, 0.13, 0.02);
const screenMesh = new THREE.Mesh(screenGeo, screenMat);
screenMesh.position.set(-0.12, 0.96, 0.28);
cockpitGroup.add(screenMesh);

const steeringWheelGroup = new THREE.Group();
const rimGeo = new THREE.TorusGeometry(0.16, 0.022, 8, 24);
const rimMesh = new THREE.Mesh(rimGeo, carbonMat);
steeringWheelGroup.add(rimMesh);
const spokeGeo = new THREE.BoxGeometry(0.28, 0.03, 0.02);
const spokeMesh = new THREE.Mesh(spokeGeo, chromeDarkMat);
steeringWheelGroup.add(spokeMesh);
steeringWheelGroup.position.set(-0.36, 0.88, 0.16);
steeringWheelGroup.rotation.x = -0.35;
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

const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 18);  
rotorGeo.rotateZ(Math.PI / 2);  
const rotor = new THREE.Mesh(rotorGeo, rotorMat);  
spinGroup.add(rotor);  

// 10-Spoke Star Alloy Rim  
for (let i = 0; i < 5; i++) {  
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.035), rimMat);  
  spoke.position.x = wp.side * 0.11;  
  spoke.rotation.x = (i * Math.PI) / 5;  
  spinGroup.add(spoke);  
}  

steerPivot.add(spinGroup);  
root.add(steerPivot);  
wheels.push({ steerPivot, spinGroup, isFront: wp.isFront, baseY: wp.y });

});

// 10. Real Headlight Spotlights + Ground Pools
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

- Optional loader for external high-poly GLB vehicle models.

- Falls back cleanly to the procedural vehicle if URL fails or is invalid.
  */
  export function loadExternalGLBVehicle(url, carRig, onStatus) {
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

  // Clear procedural body visual children except lights
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

# BMW Driving Game Asset Pack (mobile optimized)

This pack contains original, generated starter textures and UI graphics for a Three.js/Vite driving game.

## Contents
- `textures/asphalt_512.png` — asphalt base texture
- `textures/lane_markings_512.png` — transparent road lane dashes
- `textures/grass_512.png` — grass/terrain texture
- `textures/concrete_512.png` — concrete texture
- `textures/carbon_fiber_512.png` — carbon-fiber style material texture
- `textures/tire_rubber_512.png` — rubber texture
- `textures/paint_swatch_atlas.png` — simple paint color swatch atlas (not a full car UV texture)
- `environment/sky_gradient_1024x512.png` — generated sky gradient texture
- `ui/speedometer_dial.png` — transparent speedometer dial overlay
- `ui/game_icons.png` — simple icon sheet (nitro, camera, weather, reset)
- `ui/hud_glass_panel.png` — transparent HUD glass panel

## Important: BMW M4 3D model
No BMW M4 model is included. A vehicle requires a 3D model file, typically `.glb` or `.gltf`. The images in this pack cannot replace the car geometry. Find a model whose license permits your use, download it, and place it at:
`public/models/bmw-m4.glb`

## Vite paths
Put these folders under your project's `public/assets/` folder, for example:
- `public/assets/textures/asphalt_512.png`
- `public/assets/ui/speedometer_dial.png`
- `public/assets/environment/sky_gradient_1024x512.png`

Then load images with URLs such as `/assets/textures/asphalt_512.png`.

## Three.js examples

### Load a texture
```js
const asphalt = new THREE.TextureLoader().load('/assets/textures/asphalt_512.png');
asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
asphalt.repeat.set(4, 4);
const roadMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92 });
```

### Load the lane-markings overlay
```js
const laneTexture = new THREE.TextureLoader().load('/assets/textures/lane_markings_512.png');
laneTexture.wrapS = laneTexture.wrapT = THREE.RepeatWrapping;
laneTexture.repeat.set(1, 4);
const laneMat = new THREE.MeshBasicMaterial({ map: laneTexture, transparent: true, depthWrite: false });
```

### Mobile performance tips
- Keep texture sizes at 512px except the sky panorama.
- Use compressed GLB geometry/textures where possible.
- Load textures once and reuse materials; don't create new textures inside the animation loop.
- Consider KTX2/Basis texture compression for a larger production asset pack.
- A generated sky gradient is a starter background, not a physically accurate HDR environment map.

## License
The image assets in this pack were generated for this request and are supplied as starter assets. No external model or third-party files are included.

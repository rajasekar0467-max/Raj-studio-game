BMW PROJECT: ULTIMATE REALISTIC DRIVE — ASSET & DEPLOYMENT GUIDE

1. OPTIONAL EXTERNAL VEHICLE MODEL (bmw_m4.glb)
- Exact Filename: bmw_m4.glb
- Exact Destination Path: public/assets/vehicles/bmw_m4.glb
- Supported Format: .glb (glTF 2.0 binary, single file with embedded textures; non-Draco/Meshopt).
- Fallback Behavior: The game runs 100% out-of-the-box without this file. If public/assets/vehicles/bmw_m4.glb is missing or fails to load, the built-in procedural M4-inspired performance coupe (with articulated wheels, brake calipers, and full cockpit interior) is used automatically. You can also load any custom .glb URL at runtime from the Vehicle Showcase menu.

EXPECTED GLB NAMING CONVENTIONS (Case-Insensitive)
- Wheels: Object names containing "wheel", "tire", "tyre", or "rim" (one per corner) receive automatic front steering and rolling rotation. If not found, the procedural wheels remain active.
- Body Paint: Material names containing "paint", "body", "carpaint", "exterior", or "shell" receive physical clearcoat and live menu paint-swatch recoloring.
- Glass: Material names containing "glass", "window", "windshield", or "windscreen" receive reflective tinted glass shading.
- Lights: Material names containing "headlight"/"drl" or "taillight"/"brakelight" receive active emissive glow and braking response.
- Orientation: If a third-party model faces backward, open the game URL with ?carFlip=1.

2. OPTIONAL TEXTURE PACK (public/assets/...)
All external textures are optional and automatically fall back to built-in procedural Canvas textures if omitted:
- public/assets/textures/asphalt_512.png (512x512 seamless road asphalt)
- public/assets/textures/lane_markings_512.png (512x512 road lane markings)
- public/assets/textures/grass_512.png (512x512 terrain grass)
- public/assets/textures/concrete_512.png (512x512 sidewalk, barrier, and tunnel concrete)
- public/assets/textures/carbon_fiber_512.png (512x512 weave for roof, splitter, spoiler, and trim)
- public/assets/textures/tire_rubber_512.png (512x512 tire tread/sidewall)
- public/assets/environment/sky_gradient_1024x512.png (1024x512 sky dome tint)

3. LICENSING & TRADEMARK NOTES
- Use only CC0, CC-BY (credit authors in LICENSE.txt), or properly licensed web-redistributable 3D models.
- Avoid redistributing trademarked manufacturer badges on public sites without permission.

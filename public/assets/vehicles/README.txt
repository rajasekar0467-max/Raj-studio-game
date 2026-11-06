REQUIRED ASSET: bmw_m4.glb   (place it in THIS folder: public/assets/vehicles/bmw_m4.glb)

The game loads it automatically on start. If the file is missing, the built-in procedural BMW M-Coupe is used.
No external car model is included here on purpose: a convincing M4 needs a real, correctly licensed model.

WHAT TO LOOK FOR
- Format: .glb (glTF 2.0), single file, textures embedded.
- Content: an M4 / sports-coupe exterior. Interior optional (the built-in 3D cockpit remains available).
  Ideally 40k-120k triangles (phone limit). Textures: 2048x2048 max, 4-6 materials.
- Licence: CC0, CC-BY (keep the credit in LICENSE.txt in this folder) or a paid licence that
  allows web redistribution. BMW logos/designs are trademarks: a "BMW M4 style" car is safer than
  a model that copies the badge, for a public website.
- Do NOT use Draco/Meshopt-compressed files yet (not enabled in this build).

NAMES THE MODEL SHOULD USE (the game finds parts by name, case-insensitive)
- Wheels:  objects whose name contains wheel / tire / tyre / rim (one per corner, e.g. Wheel_FL ...)
           -> they get steering and spinning. If missing, the procedural wheels are kept.
- Paint:   material name contains paint / body / carpaint  -> clearcoat + the colour swatches
- Glass:   material name contains glass / window           -> transparent + reflective
- Lights:  material names containing headlight / taillight -> glow, brake lights
- If the car faces backwards in the game, open the site with ?carFlip=1.

UI ASSETS (public/assets/ui/)
- speedometer_dial.png      (transparent dial backing)
- hud_glass_panel.png       (9-slice dark glass panel)
- game_icons.png            (icon sprite sheet)
- garage_floor_glow.png     (showroom turntable glow ring)
- settings_preview_card.png (settings graphics preview thumbnail)

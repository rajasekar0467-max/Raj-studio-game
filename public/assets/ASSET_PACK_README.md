# RR STUDIOS — Complete Photorealistic AAA Asset Pack (`public/assets/`)

This directory contains the complete, mobile-optimized photorealistic PBR texture, environment, and UI asset collection for **RR STUDIOS — BMW Ultimate Realistic Drive**.

## 1. Environment Assets (`public/assets/environment/`)
- `sky_gradient_1024x512.png` (`1024x512` RGB PNG) — Horizontally seamless (`RepeatWrapping`) 360-degree HDRI-tonemapped golden-hour sky dome with Rayleigh/Mie atmospheric scattering, volumetric stratocumulus and cirrus cloud decks, and sun corona glow. Used by `this.skyUniforms.skyTex` and `PMREMGenerator` environment reflections.

## 2. World & Vehicle PBR Textures (`public/assets/textures/`)
- `asphalt_512.png` (`512x512` RGB PNG, seamless) — Rolled highway bitumen asphalt with crushed basalt/granite aggregate, directional grain, and twin wheel-track wear bands (`this.roadMaterial`, `this.junctionMat`).
- `asphalt_normal_512.png` (`512x512` RGB PNG, seamless) — Tangent-space normal map derived from the asphalt heightfield for micro-surface road relief under sunlight and headlights (`this.roadMaterial.normalMap`).
- `lane_markings_512.png` (`512x512` RGBA PNG, seamless) — Retroreflective glass-bead thermoplastic highway lane markings with weathered alpha edges (`drawLaneOverlay` / `this.laneMesh`).
- `grass_512.png` (`512x512` RGB PNG, seamless) — Natural roadside turf and coastal meadow texture with multi-scale grass blade and soil variation (`this.groundMat`).
- `concrete_512.png` (`512x512` RGB PNG, seamless) — Architectural pre-cast urban concrete with aggregate pores and expansion joints (`this.sidewalkMat`, `this.barrierMat`, `this.mountainMat`, `this.tunnelMat`).
- `building_facade_512.png` (`512x512` RGB PNG, seamless) — Modern skyscraper curtain-wall glass facade with structural aluminum mullions and floor spandrel bands (`this.bldgMat.map`).
- `building_emissive_512.png` (`512x512` RGB PNG, seamless) — Warm and cool illuminated office/apartment night window emissive texture (`this.bldgMat.emissiveMap`).
- `water_normal_512.png` (`512x512` RGB PNG, seamless) — Directional ocean wave normal map for coastal water reflections (`this.oceanMat.normalMap`).
- `carbon_fiber_512.png` (`512x512` RGB PNG, seamless) — Authentic BMW M-Performance 2x2 twill carbon fiber weave with anisotropic filament highlights (`this.assets.carbon`).
- `tire_rubber_512.png` (`512x512` RGB PNG, seamless) — Michelin Pilot Sport 4S-inspired asymmetric performance tread with rain channels, shoulder blocks, and sipes (`this.assets.tire`).
- `interior_leather_512.png` (`512x512` RGB PNG, seamless) — BMW Merino dark charcoal perforated leather grain (`this.assets.leather`).
- `brushed_metal_512.png` (`512x512` RGB PNG, seamless) — Anisotropic CNC-brushed dark gunmetal aluminum for alloy rims and trim (`this.assets.metal`).
- `paint_swatch_atlas.png` (`512x512` RGB PNG) — 6-panel BMW M Individual metallic paint speedform swatch atlas (Tanzanite Blue II, Brooklyn Grey, Toronto Red, Black Sapphire, Alpine White, Isle of Man Green).

## 3. UI & Showroom Assets (`public/assets/ui/`)
- `garage_floor_glow.png` (`512x512` RGBA PNG) — BMW M Showroom LED turntable floor ring with concentric neon tubes, degree ticks, and M-tricolor accent arcs (`this.garageRing`).
- `speedometer_dial.png` (`512x512` RGBA PNG) — 4x supersampled BMW M Live Cockpit dial backing with precision laser-etched RPM/speed ticks (`0–8,000 RPM`), redline zone, and M badge.
- `hud_glass_panel.png` (`512x160` RGBA PNG) — Smoked dark-glass telemetry backing panel with chamfered cyan border, specular glass reflection streak, and M-tricolor laser bar.
- `game_icons.png` (`512x128` RGBA PNG) — 4x `128x128` automotive HUD icon sprite sheet (M-Boost, Cinema Camera, Dynamic Weather, Track Reset).
- `settings_preview_card.png` (`640x360` RGB PNG) — 16:9 HD photorealistic BMW M4 Competition golden-hour coastal highway preview card (`#settings-preview-img`).
- `rr_studios_logo.png` (`512x512` RGBA PNG) — 3D metallic RR STUDIOS shield crest with M-tricolor stripes.

## 4. Reference Design Sheets (`public/assets/references/`)
- `main-menu.png`, `speedometer.png`, `controls.png`, `graphics-ui.png`, `pause-menu.png`, `exit-confirmation.png` — Visual UI/UX reference sheets.

# STRATA launch page

A scroll-driven 3D landing page for STRATA, an invented sparkling energy drink
"built in four layers". Concept work for a portfolio; not a real product.

## Run it

ES modules need a server (opening `index.html` from disk will not load the scripts):

```bash
python3 -m http.server 4321 --directory strata-launch
```

Then open http://localhost:4321.

## What happens on scroll

| Section    | The can                                                        |
|------------|----------------------------------------------------------------|
| Hero       | Spins slowly, leaning over the STRATA wordmark                 |
| Layers     | Splits apart: lid and tab lift, sleeve opens, four strata glow in turn with callouts |
| Flavors    | Reassembles and turns once per flavor; label, layers and page color change |
| Nutrition  | Tilts left beside the nutrition panel                          |
| Drop       | Returns to the right for the countdown and waitlist            |

## Files

- `js/main.js` boots the scene and runs the frame loop
- `js/timeline.js` keyframe tracks (desktop and compact) and the scroll clock
- `js/can.js` procedural can: lathe top and bottom, split sleeve, four core layers, pull tab
- `js/label.js` draws the printed label on a canvas texture per flavor
- `js/flavors.js` flavor palettes and color blending
- `js/annotations.js` callout chips projected from 3D positions
- `js/bubbles.js` instanced carbonation particles
- `js/can-parts.js` can geometry: necked shoulder, double seam, countersunk lid, stand ring, pull tab, shadow
- `js/studio.js` product-photography softbox environment baked into the reflections
- `js/label-art.js` sleeve artwork: bare-metal wordmark, strata bands, ingredients, barcode, fine print
- `js/droplets.js` condensation bump and roughness maps for the label
- `js/ui.js` syncs page colors, flavor list, backdrop word and chapter counter
- `js/intro.js` loader and the hero entrance timing
- `js/smooth.js` Lenis inertial scrolling and anchor links
- `js/waitlist.js` countdown and the (non-sending) waitlist form
- `css/styles.css` base layout · `css/components.css` stats, meters, ticker, progress, footer · `css/intro.css` loader, reveals, grain

Three.js 0.169 loads from jsDelivr through an import map, Lenis 1.1.13 as a script. Fonts: Anybody, Hanken Grotesk, IBM Plex Mono.

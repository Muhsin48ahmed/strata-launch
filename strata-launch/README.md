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

## Motion on top of the can

- **Peeling wordmark**: the giant backdrop word is cut into four strata that slide apart while the can is open
  or turning between flavors, shear against fast scrolling and drift at different depths with the cursor.
- **Cursor lean**: on mouse devices the can turns and tilts toward the pointer; buttons are magnetic.
- **Scrubbed type**: section headlines rise letter by letter as a section arrives and lift away as it leaves,
  the hero lines shear apart on the way out, and the footer wordmark stacks up at the end of the page.
- **Velocity ticker**: the ticker band speeds up, leans and follows the direction you scroll.

GSAP 3.13 (ScrollTrigger, SplitText) loads after first paint from jsDelivr, and not at all under
`prefers-reduced-motion: reduce`; Lenis is also off then, the wordmark stays whole and all copy sits in place.
If GSAP fails to load the page stays static and readable.

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
- `js/ui.js` syncs page colors, flavor list and chapter counter
- `js/strata-word.js` the sliced backdrop wordmark · `js/pointer.js` eased cursor position · `js/math.js` damp and clamp
- `js/motion.js` lazy-loads GSAP and wires `js/split-reveals.js`, `js/velocity-ticker.js`, `js/magnetic.js`
- `js/intro.js` loader and the hero entrance timing
- `js/smooth.js` Lenis inertial scrolling and anchor links; hands its clock to GSAP's ticker once it loads
- `js/waitlist.js` countdown and the (non-sending) waitlist form
- `css/styles.css` base layout · `css/components.css` stats, meters, ticker, progress, footer · `css/intro.css` loader, reveals, grain

Three.js 0.169 loads from jsDelivr through an import map, Lenis 1.1.13 as a script, GSAP 3.13.0 on demand. Fonts: Anybody, Hanken Grotesk, IBM Plex Mono.

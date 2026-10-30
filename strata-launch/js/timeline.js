// Scroll is measured as `t`: section index + progress through that section.
// 0 hero · 1 layers · 2 flavors · 3 nutrition · 4 drop
// Each track is a list of [t, value] keys, eased with smoothstep between keys.

const DESKTOP_TRACKS = {
  explode: [[0, 0], [0.55, 0], [1.12, 1], [1.6, 1], [1.85, 0]],
  focus: [[1.12, 0], [1.58, 3]],
  spin: [[0, 1], [0.5, 1], [0.9, 0], [1.7, 0], [1.95, 1]],
  flavor: [[0, 0], [2.08, 0], [2.18, 1], [2.3, 1], [2.4, 2], [2.52, 2], [2.62, 3]],
  posX: [[0, 1.45], [0.5, 1.45], [1.05, 0.55], [1.7, 0.55], [2.02, 1.55], [2.8, 1.55], [3.15, -1.75], [3.8, -1.75], [4.1, 1.5]],
  posY: [[0, -0.05], [0.6, -0.05], [1.05, -0.12], [1.7, -0.12], [2.02, -0.05], [4.1, -0.05]],
  scale: [[0, 1], [0.6, 1], [1.05, 0.72], [1.7, 0.72], [2.02, 1.02], [2.8, 1.02], [3.15, 0.98], [4.1, 0.95]],
  tiltZ: [[0, 0.14], [0.7, 0], [1.72, 0], [2.02, -0.12], [2.8, -0.12], [3.15, 0.4], [3.8, 0.4], [4.1, 0.12]],
  tiltX: [[0, 0.12], [0.7, 0.08], [1.7, 0.08], [2.02, 0.14], [4.1, 0.14]],
  word: [[0, 0], [0.55, 0], [1.12, 1], [1.62, 1], [1.88, 0.2]],
  wordOpacity: [[0, 1], [1.72, 1], [1.88, 0], [2.02, 1], [2.78, 1], [2.92, 0], [3.85, 0], [4.05, 1]],
};

// Compact layout keeps the can centred in the top half, above the copy card.
const COMPACT_OVERRIDES = {
  posX: [[0, 0]],
  posY: [[0, 0.55], [1.05, 0.75], [1.7, 0.75], [2.02, 0.65], [3.15, 0.9], [4.1, 0.75]],
  scale: [[0, 0.64], [1.05, 0.48], [1.7, 0.48], [2.02, 0.6], [3.15, 0.5], [4.1, 0.55]],
  tiltZ: [[0, 0.1], [0.7, 0], [1.72, 0], [2.02, -0.1], [3.15, 0.25], [4.1, 0.08]],
};

const COMPACT_TRACKS = { ...DESKTOP_TRACKS, ...COMPACT_OVERRIDES };

function sampleTrack(track, t) {
  const first = track[0];
  const last = track[track.length - 1];
  if (t <= first[0]) return first[1];
  if (t >= last[0]) return last[1];

  const i = track.findIndex(([key]) => key >= t);
  const [t0, v0] = track[i - 1];
  const [t1, v1] = track[i];
  const k = (t - t0) / (t1 - t0);
  const eased = k * k * (3 - 2 * k);
  return v0 + (v1 - v0) * eased;
}

export function sampleState(t, isCompact) {
  const tracks = isCompact ? COMPACT_TRACKS : DESKTOP_TRACKS;
  return Object.fromEntries(
    Object.entries(tracks).map(([name, track]) => [name, sampleTrack(track, t)]),
  );
}

export function createScrollClock(sections) {
  let spans = [];

  const measure = () => {
    spans = sections.map((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: Math.max(1, rect.height) };
    });
  };

  const read = () => {
    const y = window.scrollY;
    let t = 0;
    for (let i = 0; i < spans.length; i += 1) {
      const { top, height } = spans[i];
      if (y < top) break;
      t = i + Math.min(1, (y - top) / height);
    }
    return t;
  };

  measure();
  return { measure, read };
}

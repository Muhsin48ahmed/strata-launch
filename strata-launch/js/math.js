// Frame-rate independent easing toward a target; higher lambda follows more tightly.
export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Adds a classic <script> and resolves once it has run.
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // keep execution in insertion order
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error(`Could not load ${src}`)));
    document.head.append(script);
  });
}

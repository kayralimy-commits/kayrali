// Silk: a full-screen fragment shader behind the hero.
// Domain-warped noise pulled into long folds, lit like satin, in the brand rust and gold.
import * as THREE from 'three';

const canvas = document.getElementById('silk');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!canvas || reduce) {
  if (canvas) canvas.remove();
} else {
  init();
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseT: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      void main() { gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;
      uniform float uScroll;

      // --- noise ---
      vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 3; i++) { v += a * snoise(p); p = r * p * 2.0 + 0.7; a *= 0.5; }
        return v;
      }

      // Folds: a height field with long, drawn-out ridges.
      float folds(vec2 p, float t){
        vec2 q = vec2(fbm(p * 0.6 + vec2(0.0, t * 0.06)), fbm(p * 0.6 + vec2(5.2, 1.3) - t * 0.04));
        vec2 w = p + 1.2 * q;
        float h = fbm(w * vec2(0.35, 1.1) + vec2(t * 0.02, 0.0));
        return h;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
        float t = uTime;

        // Mouse pulls the cloth toward it, softly.
        vec2 m = (uMouse - 0.5) * vec2(uRes.x / min(uRes.x, uRes.y), uRes.y / min(uRes.x, uRes.y));
        float d = length(p - m);
        p += (m - p) * 0.12 * exp(-d * d * 2.2);

        float h = folds(p * 0.9, t);
        float e = 0.012;
        float hx = folds((p + vec2(e, 0.0)) * 0.9, t);
        float hy = folds((p + vec2(0.0, e)) * 0.9, t);
        vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 2.2));

        vec3 L = normalize(vec3(-0.5, 0.7, 0.9));
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 H = normalize(L + V);
        float diff = max(dot(n, L), 0.0);
        float spec = pow(max(dot(n, H), 0.0), 24.0);
        float sheen = pow(1.0 - max(dot(n, V), 0.0), 3.0);

        vec3 ink   = vec3(0.070, 0.027, 0.016);
        vec3 rust  = vec3(0.443, 0.204, 0.063);
        vec3 ember = vec3(0.640, 0.290, 0.090);
        vec3 gold  = vec3(0.886, 0.725, 0.420);

        vec3 base = mix(ink, rust, smoothstep(-0.5, 0.8, h) * 0.85);
        base = mix(base, ember, diff * 0.45);
        vec3 col = base + gold * spec * 1.1 + gold * sheen * 0.18;

        // Vignette and a top fade so the header sits on dark.
        float vig = smoothstep(1.35, 0.35, length(p * vec2(0.85, 1.0)));
        col *= mix(0.35, 1.0, vig);
        col = mix(col, ink, smoothstep(0.78, 1.0, uv.y) * 0.6);

        // Scroll dims the whole thing away.
        col = mix(col, ink, uScroll);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    const dpr = renderer.getPixelRatio();
    uniforms.uRes.value.set(w * dpr, h * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    uniforms.uMouseT.value.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  }, { passive: true });

  // Fade out with scroll; main.js can also drive this through window.__silk.
  let scrollFade = 0;
  window.__silk = {
    setScroll(v) { scrollFade = Math.min(Math.max(v, 0), 1); },
  };

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    // Stop rendering once the hero is fully scrolled away.
    if (scrollFade >= 1 && uniforms.uScroll.value >= 0.999) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(uniforms.uMouseT.value, 0.05);
    uniforms.uScroll.value += (scrollFade - uniforms.uScroll.value) * 0.1;
    renderer.render(scene, camera);
  }
  frame();
}

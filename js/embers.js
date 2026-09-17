/* Embers: drifting gold sparks behind the whole page. Canvas 2D, cheap, scroll-aware. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('embers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = 0, h = 0, particles = [];
  let scrollY = window.scrollY, lastScroll = scrollY, velocity = 0;

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / 16000));
    particles = Array.from({ length: count }, spawn);
  }
  function spawn() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 2.2,
      a: 0.15 + Math.random() * 0.5,
      vy: 0.08 + Math.random() * 0.25,
      drift: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.004,
      depth: 0.3 + Math.random() * 0.7, // parallax factor
      hue: Math.random() < 0.8 ? '226, 185, 107' : '254, 249, 240',
    };
  }
  // Pre-rendered glow sprites: one drawImage per particle instead of a shadowBlur each.
  function sprite(rgb) {
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const g = s.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${rgb}, 1)`); grad.addColorStop(0.35, `rgba(${rgb}, 0.55)`); grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
    return s;
  }
  const sprites = { '226, 185, 107': sprite('226, 185, 107'), '254, 249, 240': sprite('254, 249, 240') };
  resize();
  window.addEventListener('resize', resize);
  window.__embers = { setScroll(y) { scrollY = y; } };

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!running) return;
    velocity += ((scrollY - lastScroll) - velocity) * 0.1;
    lastScroll = scrollY;
    ctx.clearRect(0, 0, w, h);
    const t = performance.now() * 0.001;
    for (const p of particles) {
      p.drift += p.speed;
      p.x += Math.sin(p.drift + t * 0.2) * 0.25;
      p.y -= p.vy + velocity * 0.02 * p.depth;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      const tw = 0.7 + 0.3 * Math.sin(t * 2 + p.drift * 7);
      const stretch = 1 + Math.min(Math.abs(velocity) * 0.02, 3);
      const size = p.r * 5;
      ctx.globalAlpha = p.a * tw;
      ctx.drawImage(sprites[p.hue], p.x - size / 2, p.y - (size * stretch) / 2, size, size * stretch);
    }
    ctx.globalAlpha = 1;
  }
  frame();
})();

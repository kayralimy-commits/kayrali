/* Threads: fine gold zari threads flowing across the hero, bending around the cursor.
   Canvas 2D, a flow field of cheap trig noise, fading trails. Replaces the old WebGL silk. */
(function () {
  'use strict';
  const canvas = document.getElementById('silk');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.remove(); return; }
  const ctx = canvas.getContext('2d', { alpha: false });
  const dpr = 1; // trails at 1x look like woven thread; higher DPR only costs
  let w = 0, h = 0, threads = [];
  let mx = -1e4, my = -1e4, tmx = -1e4, tmy = -1e4;
  let fade = 0, running = true;

  const INK = '#120704';

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = INK; ctx.fillRect(0, 0, w, h);
    const count = Math.round(Math.min(650, (w * h) / 2200));
    threads = Array.from({ length: count }, () => spawn(true));
  }
  function spawn(anywhere) {
    const gold = Math.random();
    return {
      x: anywhere ? Math.random() * w : -10,
      y: Math.random() * h,
      px: 0, py: 0,
      speed: 0.9 + Math.random() * 1.6,
      life: 0, max: 200 + Math.random() * 400,
      width: 0.8 + Math.random() * 1.4,
      color: gold < 0.7 ? '226, 185, 107' : gold < 0.9 ? '184, 134, 58' : '254, 249, 240',
      alpha: 0.35 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    };
  }
  // Flow field: layered sines give a slow, silky current without real noise cost.
  function angle(x, y, t) {
    const nx = x * 0.0022, ny = y * 0.0032;
    return Math.sin(nx * 1.3 + t * 0.35) * 0.9
         + Math.cos(ny * 1.7 - t * 0.27) * 0.7
         + Math.sin((nx + ny) * 0.9 + t * 0.15) * 0.5
         + 0.25; // gentle drift to the right
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => { tmx = e.clientX; tmy = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  window.__silk = { setScroll(v) { fade = Math.min(Math.max(v, 0), 1); }, step() { draw(); } };

  let t = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!running || fade >= 1) return;
    draw();
  }
  function draw() {
    t += 0.016;
    mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;

    // Fade previous frame toward ink: this is what turns paths into trailing threads.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(18, 7, 4, 0.055)';
    ctx.fillRect(0, 0, w, h);

    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (const p of threads) {
      p.px = p.x; p.py = p.y;
      let a = angle(p.x, p.y, t + p.phase * 0.05);
      // Cursor: threads part around it like fabric pushed by a hand.
      const dx = p.x - mx, dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 48000) {
        const push = (1 - d2 / 48000);
        a += Math.atan2(dy, dx) * 0 + push * 1.4 * (Math.sin(p.phase) > 0 ? 1 : -1);
        p.x += (dx / Math.sqrt(d2 + 1)) * push * 2.2;
        p.y += (dy / Math.sqrt(d2 + 1)) * push * 2.2;
      }
      p.x += Math.cos(a) * p.speed;
      p.y += Math.sin(a) * p.speed;
      p.life++;
      const lifeFade = Math.min(p.life / 40, 1) * Math.min((p.max - p.life) / 40, 1);
      ctx.strokeStyle = `rgba(${p.color}, ${p.alpha * Math.max(lifeFade, 0)})`;
      ctx.lineWidth = p.width;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (p.life > p.max || p.x > w + 20 || p.x < -20 || p.y > h + 20 || p.y < -20) {
        Object.assign(p, spawn(false), { y: Math.random() * h });
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  frame();
})();

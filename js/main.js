/* Kayrali — page motion. Runs after gsap, ScrollTrigger and Lenis (all deferred). */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const desktop = () => window.matchMedia('(min-width: 901px) and (hover: hover)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- Inline the kolam symbol where CSS needs to reach individual paths ----
  const symbol = $('#k');
  ['.loader-kolam', '.steps-kolam svg', '.wardrobe-kolam'].forEach((sel) => {
    const svg = $(sel);
    if (!svg || !symbol) return;
    svg.innerHTML = symbol.innerHTML;
    ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].forEach((a) => {
      if (!svg.hasAttribute(a)) svg.setAttribute(a, symbol.getAttribute(a));
    });
  });

  // ---- Footer year ----
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // ---- Smooth scroll ----
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      scrollTo(target);
    });
  });

  // ---- Header ----
  const header = $('#site-header');
  const toggle = $('#nav-toggle');
  function closeNav() {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start();
  }
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  const silkCanvas = $('#silk');
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle('is-solid', y > 40);
    if (Math.abs(y - lastY) > 4) {
      header.classList.toggle('is-hidden', y > 200 && y > lastY && !header.classList.contains('nav-open'));
      lastY = y;
    }
    const fade = Math.min(1, y / (window.innerHeight * 0.9));
    if (window.__silk) window.__silk.setScroll(fade);
    if (silkCanvas) silkCanvas.style.opacity = String(1 - fade);
    if (window.__embers) window.__embers.setScroll(y);
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  // ---- Cursor ----
  const cursor = $('#cursor');
  if (fine && cursor && !reduce) {
    const dot = $('.cursor-dot', cursor);
    const ring = $('.cursor-ring', cursor);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.add('cursor-hidden'));
    document.addEventListener('pointerenter', () => document.body.classList.remove('cursor-hidden'));
    (function tick() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    })();
    $$('a, button, summary').forEach((el) => {
      el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // ---- Magnetic buttons ----
  if (fine && !reduce && hasGsap) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.35;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // ---- Tilt on collection pieces ----
  if (fine && !reduce && hasGsap) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 12, rotateX: -py * 12, transformPerspective: 900, duration: 0.5, ease: 'power2.out' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power3.out' });
      });
    });
  }

  // ---- Wardrobe scene: outfit changes with scroll (desktop) or on a timer ----
  const stage = $('#wardrobe-stage');
  if (stage) {
    const looks = $$('.wf', stage);
    const tags = $$('.wardrobe-tags li', stage);
    let current = -1;
    const show = (i) => {
      if (i === current) return;
      current = i;
      looks.forEach((l, k) => l.classList.toggle('is-on', k === i));
      tags.forEach((t, k) => t.classList.toggle('is-on', k === i));
    };
    show(0);
    let pinned = false;
    if (hasGsap && !reduce) {
      ScrollTrigger.matchMedia({
        '(min-width: 901px) and (hover: hover)': () => {
          pinned = true;
          const st = ScrollTrigger.create({
            trigger: stage.closest('.wardrobe'), pin: true, scrub: true,
            start: 'top top', end: '+=' + looks.length * 60 + '%',
            onUpdate: (self) => {
              show(Math.min(looks.length - 1, Math.floor(self.progress * looks.length)));
            },
          });
          return () => { st.kill(); pinned = false; };
        },
      });
    }
    setInterval(() => { if (!pinned) show((current + 1) % looks.length); }, 2400);
  }

  // ---- Ledger: strike through buying, tick renting ----
  const ledgerItems = $$('.ledger-col li');
  if (ledgerItems.length && 'IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const list = Array.from(en.target.parentElement.children);
        const idx = list.indexOf(en.target);
        setTimeout(() => en.target.classList.add('is-on'), idx * 220);
        io.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    ledgerItems.forEach((li) => io.observe(li));
  } else {
    ledgerItems.forEach((li) => li.classList.add('is-on'));
  }

  // ---- Cinematic scroll: ghost words, float-in, velocity skew, marquee speed, footer scale ----
  if (hasGsap && !reduce) {
    $$('[data-ghost]').forEach((g) => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      gsap.fromTo(g, { xPercent: dir * 8 }, { xPercent: dir * -18, ease: 'none',
        scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    });
    $$('[data-float]').forEach((sec) => {
      gsap.fromTo(sec, { y: 90, scale: 0.94, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 95%', end: 'top 35%', scrub: 0.8 } });
    });
    // velocity skew
    const skewEls = $$('[data-skew]');
    const skewSetter = gsap.quickTo(skewEls, 'skewY', { duration: 0.5, ease: 'power3.out' });
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 400);
        skewSetter(v);
      },
    });
    // marquee speed follows scroll velocity
    const track = $('.marquee-track');
    if (track) {
      track.style.animation = 'none';
      const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 });
      ScrollTrigger.create({ onUpdate: (self) => {
        const v = Math.abs(self.getVelocity());
        gsap.to(tween, { timeScale: 1 + Math.min(v / 600, 6), duration: 0.6, overwrite: true });
      } });
      gsap.ticker.add(() => { if (tween.timeScale() > 1) tween.timeScale(Math.max(1, tween.timeScale() * 0.985)); });
    }
    // footer wordmark grows as you arrive; kolam spins up
    const fw = $('.footer-word');
    if (fw) gsap.fromTo(fw, { scale: 0.7 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
    const fk = $('.footer-kolam');
    if (fk) { fk.style.animation = 'none'; gsap.fromTo(fk, { rotate: -120 }, { rotate: 60, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } }); }
  }

  // ---- Section reveals (titles, visit block, faq items, map, footer word) ----
  if (hasGsap && !reduce) {
    $$('.t-inner').forEach((el) => {
      gsap.to(el, { y: 0, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-reveal]').forEach((block) => {
      gsap.to(block.children, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: block, start: 'top 80%', once: true } });
    });
    const faqItems = $$('.faq-item');
    if (faqItems.length) gsap.to(faqItems, { opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: faqItems[0], start: 'top 85%', once: true } });
    const map = $('[data-reveal-map]');
    if (map) gsap.to(map, { clipPath: 'inset(0 0% 0% 0 round 200px 6px 6px 6px)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: map, start: 'top 80%', once: true } });
    const letters = $$('.footer-word .fl');
    if (letters.length) gsap.to(letters, { y: 0, duration: 1.1, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: '.site-footer', start: 'top 70%', once: true } });
    const hourRows = $$('.visit-hours div');
    if (hourRows.length) ScrollTrigger.create({ trigger: '.visit-hours', start: 'top 85%', once: true, onEnter: () => hourRows.forEach((r, i) => setTimeout(() => r.classList.add('is-on'), i * 180)) });
  } else {
    $$('.t-inner').forEach((el) => (el.style.transform = 'none'));
    $$('[data-reveal] > *').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.faq-item').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    const map = $('[data-reveal-map]'); if (map) map.style.clipPath = 'none';
    $$('.footer-word .fl').forEach((el) => (el.style.transform = 'none'));
    $$('.visit-hours div').forEach((r) => r.classList.add('is-on'));
  }

  // ---- FAQ: animate open and close ----
  $$('.faq-item').forEach((item) => {
    const summary = $('summary', item);
    const body = $('.faq-body', item);
    if (!summary || !body) return;
    summary.addEventListener('click', (e) => {
      if (!hasGsap || reduce) return;
      e.preventDefault();
      if (item.open) {
        gsap.to(body, { height: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { item.open = false; body.style.height = ''; } });
      } else {
        // close any sibling that is open (same behaviour as the name attribute)
        $$('.faq-item[open]').forEach((other) => {
          if (other === item) return;
          const ob = $('.faq-body', other);
          gsap.to(ob, { height: 0, duration: 0.35, ease: 'power3.inOut', onComplete: () => { other.open = false; ob.style.height = ''; } });
        });
        item.open = true;
        gsap.from(body, { height: 0, duration: 0.55, ease: 'power3.out', clearProps: 'height' });
        gsap.from(body.firstElementChild, { opacity: 0, y: -8, duration: 0.5, delay: 0.1 });
      }
    });
  });

  // ---- Open now: store hours in Malaysia time ----
  const openEl = $('#open-now');
  const openText = $('#open-now-text');
  if (openEl && openText) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const mins = now.getHours() * 60 + now.getMinutes();
    const hours = { 0: [660, 1080], 2: [660, 1200], 3: [660, 1200], 4: [660, 1200], 5: [660, 1200], 6: [660, 1200] };
    const fmt = (m) => (m % 60 ? `${((m / 60) % 12) || 12}:${String(m % 60).padStart(2, '0')}` : `${((m / 60) % 12) || 12}`) + (m >= 720 ? 'pm' : 'am');
    const today = hours[day];
    let text, closed = false;
    if (today && mins >= today[0] && mins < today[1]) {
      text = `Open now, until ${fmt(today[1])}`;
    } else {
      closed = true;
      let d = day, add = 0;
      if (!today || mins >= today[1]) { do { d = (d + 1) % 7; add++; } while (!hours[d]); }
      const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const when = add === 0 ? 'today' : add === 1 ? 'tomorrow' : names[d];
      text = `Closed now, opens ${when} at ${fmt(hours[d][0])}`;
    }
    openText.textContent = text;
    openEl.classList.toggle('is-closed', closed);
    openEl.hidden = false;
  }

  // ---- Collection rail: pinned horizontal scroll on desktop ----
  const rail = $('#rail');
  const track = $('#rail-track');
  if (rail && track && hasGsap && !reduce) {
    ScrollTrigger.matchMedia({
      '(min-width: 901px) and (hover: hover)': () => {
        const distance = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: rail.closest('.rail-section'), pin: true, scrub: 1,
            start: 'top top',
            end: () => '+=' + distance(),
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        return () => tween.kill();
      },
    });
  }

  // ---- Steps as a pinned film sequence on desktop (created after the rail so pins sort in page order) ----
  if (hasGsap && !reduce) {
    ScrollTrigger.matchMedia({
      '(min-width: 901px) and (hover: hover)': () => {
        const stepsSec = $('.steps');
        const stepEls = $$('.step');
        const kolamSvg = $('.steps-kolam svg');
        if (!stepsSec || !stepEls.length) return;
        const activate = (i) => {
          stepEls.forEach((s, k) => s.classList.toggle('is-active', k === i));
          const n = String(i + 1);
          const kolamBox = $('.steps-kolam');
          if (kolamBox) kolamBox.dataset.active = n;
          const count = $('#steps-current');
          if (count && count.textContent !== n) { count.textContent = n; count.classList.remove('flip'); void count.offsetWidth; count.classList.add('flip'); }
        };
        const st = ScrollTrigger.create({
          trigger: stepsSec, pin: true, scrub: true, start: 'top top', refreshPriority: -1, end: '+=' + stepEls.length * 80 + '%',
          onUpdate: (self) => {
            activate(Math.min(stepEls.length - 1, Math.floor(self.progress * stepEls.length)));
            if (kolamSvg) kolamSvg.style.transform = `rotate(${-self.progress * 270}deg)`;
          },
        });
        activate(0);
        return () => st.kill();
      },
    });
  }

  // ---- Steps: active state + kolam quadrant ----
  const steps = $$('.step');
  const kolam = $('.steps-kolam');
  const count = $('#steps-current');
  if (steps.length && 'IntersectionObserver' in window && !(hasGsap && !reduce && desktop())) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        steps.forEach((s) => s.classList.remove('is-active'));
        en.target.classList.add('is-active');
        const n = en.target.dataset.step;
        if (kolam) {
          kolam.dataset.active = n;
          const svg = kolam.querySelector('svg');
          if (svg) svg.style.transform = `rotate(${-(n - 1) * 90}deg)`;
        }
        if (count && count.textContent !== n) {
          count.textContent = n;
          count.classList.remove('flip'); void count.offsetWidth; count.classList.add('flip');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  } else if (!(hasGsap && !reduce && desktop())) {
    steps.forEach((s) => s.classList.add('is-active'));
  }

  // Recompute scroll positions once fonts and layout settle
  if (hasGsap && document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => { if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 300); });

  // ---- Loader and hero entrance: the one orchestrated moment ----
  const loader = $('#loader');
  const heroLines = $$('.hero-title .line-inner');
  const heroRest = ['.hero-side', '.hero-meta', '.scroll-cue'].map((s) => $(s)).filter(Boolean);

  function enterHero() {
    if (!hasGsap || reduce) {
      heroLines.forEach((l) => (l.style.transform = 'none'));
      heroRest.forEach((el) => (el.style.opacity = 1));
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(heroLines, { y: 0, duration: 1.4, stagger: 0.12 }, 0)
      .to(heroRest, { opacity: 1, duration: 1.2, stagger: 0.1 }, 0.5);
  }

  if (loader && !reduce) {
    document.body.classList.add('is-loading');
    if (lenis) lenis.stop();
    const strokes = $$('path', loader);
    const dots = $('.kolam-dots', loader);
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      enterHero();
      if (hasGsap) ScrollTrigger.refresh();
      setTimeout(() => loader.remove(), 1400);
    };
    if (hasGsap) {
      gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
      const tl = gsap.timeline({ onComplete: done });
      setTimeout(done, 5000); // never let the loader hold the page hostage
      tl.to(dots, { opacity: 1, duration: 0.4 }, 0)
        .to(strokes, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.05 }, 0.2)
        .add(() => loader.classList.add('is-drawn'), 1.3)
        .to({}, { duration: 0.7 });
    } else {
      setTimeout(done, 600);
    }
  } else {
    if (loader) loader.remove();
    document.body.classList.remove('is-loading');
    enterHero();
  }
})();

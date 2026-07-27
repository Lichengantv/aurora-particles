/**
 * Aurora Particles — Interactive Cosmic Playground
 * Zero-dependency particle system with gravity wells, trails, and color modes.
 * Built for pure browser performance and visual delight.
 */

(() => {
  'use strict';

  // ─── Config & State ───
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  let W, H, dpr;
  let particles = [];
  let wells = [];
  let mouse = { x: 0, y: 0, active: false };

  const settings = {
    count: 900,
    gravity: 0.35,
    trail: 12,
    colorMode: 'aurora',
  };

  // Color palettes (HSL based for smooth interpolation)
  const palettes = {
    aurora: [
      { h: 160, s: 90, l: 60 },
      { h: 190, s: 95, l: 55 },
      { h: 280, s: 80, l: 65 },
      { h: 320, s: 85, l: 60 },
    ],
    neon: [
      { h: 300, s: 100, l: 60 },
      { h: 180, s: 100, l: 55 },
      { h: 60, s: 100, l: 55 },
      { h: 330, s: 100, l: 60 },
    ],
    fire: [
      { h: 10, s: 100, l: 55 },
      { h: 30, s: 100, l: 55 },
      { h: 45, s: 100, l: 60 },
      { h: 0, s: 90, l: 50 },
    ],
    ocean: [
      { h: 190, s: 90, l: 50 },
      { h: 210, s: 85, l: 45 },
      { h: 170, s: 80, l: 55 },
      { h: 230, s: 70, l: 60 },
    ],
    mono: [
      { h: 210, s: 20, l: 80 },
      { h: 210, s: 15, l: 70 },
      { h: 210, s: 10, l: 60 },
      { h: 210, s: 5, l: 90 },
    ],
  };

  // ─── Particle Class ───
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(randomPos = false) {
      this.x = randomPos ? Math.random() * W : W / 2 + (Math.random() - 0.5) * 40;
      this.y = randomPos ? Math.random() * H : H / 2 + (Math.random() - 0.5) * 40;
      this.vx = (Math.random() - 0.5) * 1.8;
      this.vy = (Math.random() - 0.5) * 1.8;
      this.size = 0.8 + Math.random() * 2.2;
      this.life = 1;
      this.maxLife = 0.6 + Math.random() * 0.8;
      this.hueIndex = Math.floor(Math.random() * 4);
      this.trail = [];
    }

    update() {
      // Mouse attraction
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.min(settings.gravity * 120 / dist, 4);
        this.vx += (dx / dist) * force * 0.08;
        this.vy += (dy / dist) * force * 0.08;
      }

      // Gravity wells
      for (const well of wells) {
        const dx = well.x - this.x;
        const dy = well.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.min(well.strength * 80 / dist, 5);
        this.vx += (dx / dist) * force * 0.06;
        this.vy += (dy / dist) * force * 0.06;
      }

      // Mild center drift to keep things alive
      this.vx += (W / 2 - this.x) * 0.00002;
      this.vy += (H / 2 - this.y) * 0.00002;

      // Damping
      this.vx *= 0.985;
      this.vy *= 0.985;

      this.x += this.vx;
      this.y += this.vy;

      // Soft wrap
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;

      // Trail
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > settings.trail) {
        this.trail.shift();
      }
    }

    draw() {
      const palette = palettes[settings.colorMode];
      const c = palette[this.hueIndex];

      // Trail
      if (this.trail.length > 1 && settings.trail > 0) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.25)`;
        ctx.lineWidth = this.size * 0.6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Core
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
      grad.addColorStop(0, `hsla(${c.h}, ${c.s}%, ${c.l + 15}%, 0.95)`);
      grad.addColorStop(0.4, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.5)`);
      grad.addColorStop(1, `hsla(${c.h}, ${c.s}%, ${c.l}%, 0)`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // ─── Core Functions ───
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < settings.count; i++) {
      particles.push(new Particle());
    }
  }

  function explode() {
    const cx = W / 2;
    const cy = H / 2;
    for (const p of particles) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.x = cx + (Math.random() - 0.5) * 30;
      p.y = cy + (Math.random() - 0.5) * 30;
      p.trail = [];
    }
  }

  function drawWells() {
    for (const well of wells) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.004 + well.phase);
      const r = 18 + pulse * 12;

      const grad = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, r * 2.5);
      grad.addColorStop(0, `rgba(167, 139, 250, ${0.35 * pulse})`);
      grad.addColorStop(0.5, `rgba(110, 231, 255, ${0.15 * pulse})`);
      grad.addColorStop(1, 'rgba(110, 231, 255, 0)');

      ctx.beginPath();
      ctx.arc(well.x, well.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(well.x, well.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    }
  }

  function loop() {
    // Fade background for trails
    ctx.fillStyle = `rgba(5, 5, 10, ${0.18 + (30 - settings.trail) * 0.008})`;
    ctx.fillRect(0, 0, W, H);

    drawWells();

    for (const p of particles) {
      p.update();
      p.draw();
    }

    requestAnimationFrame(loop);
  }

  // ─── Event Handlers ───
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left);
    mouse.y = (e.clientY - rect.top);
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    wells.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      strength: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    });
    if (wells.length > 8) wells.shift();
  }

  function onDblClick() {
    wells = [];
  }

  // ─── UI Binding ───
  function bindUI() {
    const countEl = document.getElementById('count');
    const gravityEl = document.getElementById('gravity');
    const trailEl = document.getElementById('trail');
    const colorEl = document.getElementById('colorMode');

    const updateVal = (id, val) => {
      document.getElementById(id).textContent = val;
    };

    countEl.addEventListener('input', () => {
      settings.count = +countEl.value;
      updateVal('count-val', settings.count);
      initParticles();
    });

    gravityEl.addEventListener('input', () => {
      settings.gravity = +gravityEl.value / 100;
      updateVal('gravity-val', gravityEl.value);
    });

    trailEl.addEventListener('input', () => {
      settings.trail = +trailEl.value;
      updateVal('trail-val', settings.trail);
    });

    colorEl.addEventListener('change', () => {
      settings.colorMode = colorEl.value;
    });

    document.getElementById('reset').addEventListener('click', () => {
      wells = [];
      initParticles();
    });

    document.getElementById('explode').addEventListener('click', explode);
  }

  // ─── Boot ───
  function boot() {
    resize();
    initParticles();
    bindUI();

    window.addEventListener('resize', () => {
      resize();
    });

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);

    // Touch support
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onPointerMove(t);
    }, { passive: false });

    requestAnimationFrame(loop);
  }

  boot();
})();
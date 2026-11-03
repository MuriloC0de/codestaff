const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const starCanvas = document.querySelector('#starfield');
const starCtx = starCanvas.getContext('2d');
const loaderCanvas = document.querySelector('#loaderCanvas');
const loaderCtx = loaderCanvas.getContext('2d');
let stars = [];
let particles = [];
let pointer = { x: 0.5, y: 0.5 };

function resizeCanvas(canvas, ctx) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createStars() {
  stars = Array.from({ length: Math.min(240, Math.round(innerWidth / 5)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.35 + 0.12,
    a: Math.random() * 0.75 + 0.15,
    speed: Math.random() * 0.18 + 0.02,
  }));
}

function drawStars() {
  starCtx.clearRect(0, 0, innerWidth, innerHeight);
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > innerHeight + 4) star.y = -4;
    const shiftX = (pointer.x - 0.5) * star.r * 8;
    starCtx.beginPath();
    starCtx.fillStyle = `rgba(224, 237, 255, ${star.a})`;
    starCtx.arc(star.x + shiftX, star.y, star.r, 0, Math.PI * 2);
    starCtx.fill();
  }
  if (!reducedMotion) requestAnimationFrame(drawStars);
}

function setupLoader() {
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;
  particles = Array.from({ length: 180 }, (_, index) => {
    const angle = Math.random() * Math.PI * 2;
    return { angle, radius: Math.random() * 8, speed: Math.random() * 7 + 2, size: Math.random() * 1.7 + .2, alpha: Math.random() * .8 + .2, delay: index * 1.5 };
  });
  const start = performance.now();
  const duration = reducedMotion ? 250 : 2400;
  const progress = document.querySelector('#loaderProgress');
  const counter = document.querySelector('#loaderCounter');

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(1, Math.max(0, elapsed / duration));
    loaderCtx.clearRect(0, 0, innerWidth, innerHeight);
    const radius = 40 + t * Math.max(innerWidth, innerHeight) * .42;
    loaderCtx.beginPath();
    loaderCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    loaderCtx.strokeStyle = `rgba(225, 239, 255, ${Math.max(0, .75 - t)})`;
    loaderCtx.lineWidth = 1.3;
    loaderCtx.stroke();
    for (const p of particles) {
      const distance = p.radius + Math.max(0, t - p.delay / 5000) * p.speed * Math.max(innerWidth, innerHeight) * .5;
      const x = centerX + Math.cos(p.angle) * distance;
      const y = centerY + Math.sin(p.angle) * distance;
      loaderCtx.fillStyle = `rgba(220, 237, 255, ${Math.max(0, p.alpha * (1 - t * .8))})`;
      loaderCtx.fillRect(x, y, p.size, p.size);
    }
    progress.style.width = `${t * 100}%`;
    counter.textContent = `${String(Math.round(t * 100)).padStart(3, '0')}%`;
    if (t < 1) requestAnimationFrame(frame);
    else setTimeout(() => document.body.classList.add('loaded'), reducedMotion ? 0 : 280);
  }
  requestAnimationFrame(frame);
}

function init() {
  resizeCanvas(starCanvas, starCtx);
  resizeCanvas(loaderCanvas, loaderCtx);
  createStars();
  drawStars();
  setupLoader();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  document.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX / innerWidth, y: event.clientY / innerHeight };
    if (!reducedMotion) {
      document.querySelectorAll('[data-tilt]').forEach((element) => {
        const x = (pointer.x - .5) * 8;
        const y = (pointer.y - .5) * -8;
        element.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
      });
    }
  });
  window.addEventListener('resize', () => { resizeCanvas(starCanvas, starCtx); resizeCanvas(loaderCanvas, loaderCtx); createStars(); });
}

init();

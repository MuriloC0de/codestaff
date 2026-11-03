const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const preloader = document.querySelector('#preloader');
const preloaderCanvas = document.querySelector('#preloaderCanvas');
const preloaderCtx = preloaderCanvas.getContext('2d');
const starCanvas = document.querySelector('#starCanvas');
const starCtx = starCanvas.getContext('2d');
const earthScene = document.querySelector('#earthScene');
const scrollProgress = document.querySelector('#scrollProgress');
const topbar = document.querySelector('#topbar');
let backgroundStars = [];
let warpStars = [];
let burstParticles = [];
let pointer = { x: .5, y: .5 };
let introFinished = false;
let resizeTimer;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;

function resizeCanvas(canvas, context) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeBackgroundStars() {
  const quantity = Math.min(220, Math.max(95, Math.round(window.innerWidth / 5)));
  backgroundStars = Array.from({ length: quantity }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.15 + .15,
    alpha: Math.random() * .56 + .12,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * .0007 + .0002,
    depth: Math.random() * .8 + .2,
  }));
}

function drawBackgroundStars(now = 0) {
  starCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const shiftX = (pointer.x - .5) * 22;
  const shiftY = (pointer.y - .5) * 15;

  backgroundStars.forEach((star) => {
    const twinkle = .72 + Math.sin(now * star.speed + star.phase) * .28;
    const x = star.x + shiftX * star.depth;
    const y = star.y + shiftY * star.depth;
    starCtx.beginPath();
    starCtx.fillStyle = `rgba(216, 234, 234, ${star.alpha * twinkle})`;
    starCtx.arc(x, y, star.radius, 0, Math.PI * 2);
    starCtx.fill();
  });
  if (!reducedMotion) requestAnimationFrame(drawBackgroundStars);
}

function makeWarpScene() {
  warpStars = Array.from({ length: 230 }, () => ({
    angle: Math.random() * Math.PI * 2,
    depth: Math.random(),
    speed: Math.random() * .14 + .055,
    size: Math.random() * 1.25 + .3,
    alpha: Math.random() * .68 + .2,
  }));
  burstParticles = Array.from({ length: 210 }, (_, index) => ({
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * .83 + .2,
    size: Math.random() * 1.8 + .35,
    alpha: Math.random() * .78 + .18,
    delay: Math.random() * .16 + index / 210 * .14,
    curve: (Math.random() - .5) * .45,
  }));
}

function drawPreloader(time) {
  const { width, height } = preloaderCanvas;
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;
  const cx = cssWidth / 2;
  const cy = cssHeight / 2;
  const elapsed = time - introStarted;
  const linear = clamp(elapsed / INTRO_DURATION, 0, 1);
  const eased = 1 - Math.pow(1 - linear, 3);
  const diag = Math.hypot(cssWidth, cssHeight);

  preloaderCtx.clearRect(0, 0, cssWidth, cssHeight);
  const message = document.querySelector('#preloaderMessage');
  const nextMessage = linear < .24 ? 'preparando a ignição' : linear < .56 ? 'saindo da órbita' : linear < .84 ? 'atravessando o espaço' : 'chegando ao IAPE';
  if (message.textContent !== nextMessage) message.textContent = nextMessage;

  const burstStart = .2;
  const burstProgress = clamp((linear - burstStart) / .7, 0, 1);
  const flash = Math.exp(-Math.pow((linear - .28) / .1, 2));

  preloaderCtx.save();
  preloaderCtx.globalCompositeOperation = 'screen';
  warpStars.forEach((star) => {
    star.depth += star.speed * (.014 + linear * .09);
    if (star.depth > 1) star.depth = .025 + Math.random() * .1;
    const radius = star.depth * diag * .72;
    const x = cx + Math.cos(star.angle) * radius;
    const y = cy + Math.sin(star.angle) * radius;
    const tail = Math.max(2, star.speed * (8 + linear * 170));
    const previousRadius = Math.max(0, radius - tail);
    const previousX = cx + Math.cos(star.angle) * previousRadius;
    const previousY = cy + Math.sin(star.angle) * previousRadius;
    const alpha = star.alpha * clamp((linear + .08) * 2.5, .08, .8) * (1 - star.depth * .13);
    preloaderCtx.beginPath();
    preloaderCtx.moveTo(previousX, previousY);
    preloaderCtx.lineTo(x, y);
    preloaderCtx.strokeStyle = `rgba(206, 238, 244, ${alpha})`;
    preloaderCtx.lineWidth = star.size * (1 + linear * 1.5);
    preloaderCtx.stroke();
  });

  const ringRadius = 14 + Math.pow(eased, 1.5) * diag * .74;
  preloaderCtx.beginPath();
  preloaderCtx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
  preloaderCtx.strokeStyle = `rgba(225, 246, 248, ${Math.max(0, .52 * (1 - linear * .8))})`;
  preloaderCtx.lineWidth = 1 + flash * 2;
  preloaderCtx.stroke();

  preloaderCtx.beginPath();
  preloaderCtx.arc(cx, cy, 3 + flash * 26, 0, Math.PI * 2);
  preloaderCtx.fillStyle = `rgba(237, 250, 250, ${.1 + flash * .57})`;
  preloaderCtx.shadowColor = 'rgba(185, 237, 244, .9)';
  preloaderCtx.shadowBlur = 13 + flash * 85;
  preloaderCtx.fill();
  preloaderCtx.shadowBlur = 0;

  burstParticles.forEach((particle) => {
    const local = clamp((burstProgress - particle.delay) / (1 - particle.delay), 0, 1);
    if (local <= 0) return;
    const distance = Math.pow(local, .72) * particle.speed * diag * 1.08;
    const angle = particle.angle + particle.curve * local;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    const opacity = particle.alpha * (1 - Math.pow(local, 1.65)) * clamp(linear * 5, 0, 1);
    preloaderCtx.beginPath();
    preloaderCtx.moveTo(cx + Math.cos(angle) * Math.max(0, distance - 16), cy + Math.sin(angle) * Math.max(0, distance - 16));
    preloaderCtx.lineTo(x, y);
    preloaderCtx.strokeStyle = `rgba(215, 241, 245, ${opacity})`;
    preloaderCtx.lineWidth = particle.size;
    preloaderCtx.stroke();
  });
  preloaderCtx.restore();

  document.querySelector('#preloaderBar').style.width = `${linear * 100}%`;
  document.querySelector('#preloaderPercent').textContent = String(Math.round(linear * 100)).padStart(2, '0');

  if (linear < 1 && !introFinished) requestAnimationFrame(drawPreloader);
  else finishIntro();
}

const INTRO_DURATION = 3150;
let introStarted = 0;

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  document.body.classList.add('intro-complete');
  setTimeout(() => preloader?.remove(), 1600);
}

function startIntro() {
  if (reducedMotion) {
    finishIntro();
    return;
  }
  introStarted = performance.now();
  requestAnimationFrame(drawPreloader);
}

function onScroll() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const progress = total > 0 ? window.scrollY / total : 0;
  scrollProgress.style.width = `${progress * 100}%`;
  topbar.classList.toggle('is-scrolled', window.scrollY > 30);

  const heroHeight = Math.max(1, document.querySelector('.hero').offsetHeight);
  const heroProgress = clamp(window.scrollY / heroHeight, 0, 1);
  const pointerX = (pointer.x - .5) * 15;
  const pointerY = (pointer.y - .5) * 11;
  earthScene.style.transform = `translate3d(${pointerX}px, calc(-50% + ${heroProgress * 94 + pointerY}px), 0) scale(${1 - heroProgress * .075})`;
  earthScene.style.opacity = String(1 - heroProgress * .64);
}

function setupReveal() {
  const revealItems = document.querySelectorAll('.reveal-up');
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.classList.contains('process')) entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -4% 0px' });

  revealItems.forEach((item) => observer.observe(item));
  document.querySelectorAll('.process').forEach((section) => observer.observe(section));
}

function setupNavSpy() {
  const sections = [...document.querySelectorAll('#sobre, #missoes, #tripulacao')];
  const links = [...document.querySelectorAll('[data-nav]')];
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

function setupTilt() {
  if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(1100px) rotateX(${y * -3.2}deg) rotateY(${x * 4}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function init() {
  resizeCanvas(starCanvas, starCtx);
  resizeCanvas(preloaderCanvas, preloaderCtx);
  makeBackgroundStars();
  makeWarpScene();
  requestAnimationFrame(drawBackgroundStars);
  setupReveal();
  setupNavSpy();
  setupTilt();
  onScroll();

  document.querySelector('#skipIntro').addEventListener('click', finishIntro);
  window.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight };
    if (introFinished) onScroll();
  }, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas(starCanvas, starCtx);
      if (!introFinished) resizeCanvas(preloaderCanvas, preloaderCtx);
      makeBackgroundStars();
      onScroll();
    }, 120);
  }, { passive: true });

  if (preloader) startIntro();
}

init();

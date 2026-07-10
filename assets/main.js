// ---- Always start at the top on reload (no scroll restore) ----
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
});

// ---- Language switch (UA default, EN via data-en attributes) ----
function setLang(lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'uk';
  document.querySelectorAll('[data-en]').forEach(el => {
    if (!el.hasAttribute('data-uk')) el.setAttribute('data-uk', el.innerHTML);
    el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-uk');
  });
  document.querySelectorAll('[data-en-ph]').forEach(el => {
    if (!el.hasAttribute('data-uk-ph')) el.setAttribute('data-uk-ph', el.getAttribute('placeholder') || '');
    el.placeholder = lang === 'en' ? el.getAttribute('data-en-ph') : el.getAttribute('data-uk-ph');
  });
  document.querySelectorAll('[data-lang-label]').forEach(b => b.textContent = lang === 'en' ? 'УКР' : 'ENG');
  try { localStorage.setItem('lang', lang); } catch (e) {}
  // marquees hold generated copies of their base content, rebuild them in the new language
  if (typeof rebuildMarquees === 'function') rebuildMarquees();
}
const savedLang = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
document.querySelectorAll('[data-lang-label]').forEach(btn =>
  btn.addEventListener('click', () => setLang(document.documentElement.lang === 'en' ? 'uk' : 'en'))
);

// ---- Mobile nav toggle ----
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );
}

// ---- Scroll reveal ----
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
  io.observe(el);
});
// fallback for webviews where IntersectionObserver never fires
function revealFallback() {
  const vh = innerHeight;
  document.querySelectorAll('.reveal:not(.in)').forEach(el => {
    if (el.getBoundingClientRect().top < vh - 40) el.classList.add('in');
  });
}
addEventListener('scroll', revealFallback, { passive: true });
addEventListener('load', revealFallback);

// ---- Live clock (experimental variant HUD) ----
const clockEl = document.getElementById('hud-clock');
if (clockEl) {
  const tick = () => clockEl.textContent = new Date().toLocaleTimeString('uk-UA', { hour12: false });
  tick(); setInterval(tick, 1000);
}

// ====================================================================
//  TELEGRAM SETTINGS
// ====================================================================
const TELEGRAM = {
  token: '8984325595:AAFAAEnJix6oYxOTDrl76pKGte5Lwh_DZoQ',
  chatId: '479351502'
};

// ---- Contact form (sends straight to Karina's Telegram) ----
const form = document.querySelector('#contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = form.querySelector('.form-success');
    const btn = form.querySelector('button[type="submit"]');
    const f = (n) => (form.querySelector(`[name="${n}"]`) || {}).value || '·';
    const text =
      '🔔 Нова заявка з сайту-портфоліо\n\n' +
      `👤 Імʼя: ${f('name')}\n` +
      `📲 Контакт: ${f('contact')}\n` +
      `🗂 Тип: ${f('type')}\n` +
      `💶 Бюджет: ${f('budget')}\n` +
      `📝 Деталі: ${f('message')}`;
    if (btn) btn.disabled = true;
    try {
      if (TELEGRAM.token.startsWith('PASTE')) throw new Error('not configured');
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM.chatId, text })
      });
      if (!res.ok) throw new Error('bad response');
      form.querySelectorAll('input, textarea, select').forEach(el => { el.value = ''; });
      if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    } catch (err) {
      alert(document.documentElement.lang === 'en'
        ? 'Couldn\'t send. Please message me on Telegram @kari_kdn or email karinakudina762@gmail.com.'
        : 'Не вдалося надіслати. Напишіть у Telegram @kari_kdn або на karinakudina762@gmail.com.');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// ---- Footer year ----
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// ---- Seamless marquee: duplicate content until one half exceeds the viewport ----
const marqueeTracks = [...document.querySelectorAll('.vel-track, .t-track')];
function buildMarquee(track) {
  if (!track.dataset.base) track.dataset.base = track.innerHTML;
  const base = track.dataset.base;
  let unit = base;
  track.innerHTML = unit;
  let guard = 0;
  while (track.scrollWidth < innerWidth + 260 && guard < 24) { unit += base; track.innerHTML = unit; guard++; }
  track.innerHTML = unit + unit;                 // two identical halves → -50% loops seamlessly
  const half = track.scrollWidth / 2;
  track.style.animationDuration = Math.max(18, half / 80) + 's';  // constant speed regardless of width
}
function rebuildMarquees() {
  marqueeTracks.forEach(t => { delete t.dataset.base; buildMarquee(t); });
}
// apply saved language first (so marquees are built from translated content), then build
setLang(savedLang === 'en' ? 'en' : 'uk');
if (marqueeTracks.length) {
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => marqueeTracks.forEach(buildMarquee), 200); });
}

// ===== Precise anchor navigation =====
(function () {
  const header = document.querySelector('.site-header');
  const off = () => (header ? header.offsetHeight : 72) + 14;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      const sec = document.querySelector(hash);
      if (!sec) return;
      e.preventDefault();
      const links = document.querySelector('.nav-links');
      if (links) links.classList.remove('open');
      let y = 0;
      if (hash !== '#top') {
        const head = sec.querySelector('.section-head, .about-grid, h2, h1') || sec;
        y = head.getBoundingClientRect().top + window.scrollY - off();
      }
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
    });
  });
})();

// ===== Scroll-spy: highlight current section in the header =====
(function () {
  const links = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => { links[a.getAttribute('href').slice(1)] = a; });
  const sections = [...document.querySelectorAll('main section[id]')];
  if (!sections.length) return;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      Object.values(links).forEach(a => a.classList.remove('active'));
      const a = links[e.target.id];
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));
})();

// ===== Showreel mode: open index.html?reel to auto-scroll for screen recording =====
(function () {
  if (!/[?&]reel/.test(location.search)) return;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function run() {
    const total = document.documentElement.scrollHeight - innerHeight;
    if (total <= 0) return;
    const duration = Math.max(38000, total * 7.5);
    let start = null;
    function step(ts) {
      if (start === null) start = ts;
      let t = Math.min((ts - start) / duration, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      window.scrollTo(0, e * total);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('load', () => setTimeout(run, reduce ? 100 : 1600));
})();

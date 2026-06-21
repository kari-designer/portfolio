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
}
const savedLang = (() => { try { return localStorage.getItem('lang'); } catch (e) { return null; } })();
setLang(savedLang === 'en' ? 'en' : 'uk');
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

// ---- Sticky header shadow ----
const header = document.querySelector('.site-header');
const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

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

// ====================================================================
//  TELEGRAM SETTINGS — paste your two values between the quotes below.
//  How to get them (one time, ~3 min):
//   1. In Telegram open @BotFather → /newbot → copy the TOKEN it gives.
//   2. Open @userinfobot → it replies with your numeric "Id" → that's CHAT_ID.
//   3. Send any message to YOUR new bot once so it can write to you.
// ====================================================================
const TELEGRAM = {
  token: 'PASTE_BOT_TOKEN_HERE',     // e.g. '7712345678:AAH...'
  chatId: 'PASTE_CHAT_ID_HERE'       // e.g. '123456789'
};

// ---- Contact form (sends straight to Karina's Telegram) ----
const form = document.querySelector('#contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = form.querySelector('.form-success');
    const btn = form.querySelector('button[type="submit"]');
    const f = (n) => (form.querySelector(`[name="${n}"]`) || {}).value || '—';
    const text =
      '🔔 Нова заявка з сайту-портфоліо\n\n' +
      `👤 Імʼя: ${f('name')}\n` +
      `✉️ Email: ${f('email')}\n` +
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

// =====================================================================
//  EXPERIMENTAL INTERACTIONS (cursor, parallax, horizontal & velocity)
// =====================================================================
(function () {
  const fine = matchMedia('(pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const lerp = (a, b, n) => a + (b - a) * n;

  // ---- Custom cursor ----
  const dot = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if (dot && ring && fine && !reduce) {
    document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    // subtle trail: a short chain of fading dots that follow with delay
    const trail = [];
    for (let i = 0; i < 14; i++) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      document.body.appendChild(t);
      trail.push({ el: t, x: mx, y: my });
    }
    let moved = false;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; moved = true; dot.style.transform = `translate(${mx}px,${my}px)`; });
    (function ring_loop() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      let px = mx, py = my;
      trail.forEach((p, i) => {
        p.x = lerp(p.x, px, 0.35); p.y = lerp(p.y, py, 0.35);
        px = p.x; py = p.y;
        const k = 1 - i / trail.length;
        p.el.style.transform = `translate(${p.x}px,${p.y}px) scale(${k})`;
        p.el.style.opacity = moved ? (0.5 * k).toFixed(2) : 0;
      });
      requestAnimationFrame(ring_loop);
    })();
    // Big ring only over the photo
    document.querySelectorAll('.cursor-xl').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
    // Small ring over links, buttons and interactive text
    document.querySelectorAll('a, button, .btn, .svc, input, textarea, select').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('sm'));
      el.addEventListener('mouseleave', () => ring.classList.remove('sm'));
    });
    addEventListener('mouseleave', () => ring.classList.add('hide'));
    addEventListener('mouseenter', () => ring.classList.remove('hide'));
  }

  // ---- Mouse-depth parallax ([data-depth]) ----
  const depthEls = [...document.querySelectorAll('[data-depth]')];
  if (depthEls.length && fine && !reduce) {
    addEventListener('mousemove', e => {
      const dx = (e.clientX / innerWidth - 0.5), dy = (e.clientY / innerHeight - 0.5);
      depthEls.forEach(el => {
        const d = parseFloat(el.dataset.depth) || 1;
        el.style.transform = `translate3d(${dx * d * 36}px, ${dy * d * 36}px, 0)`;
      });
    });
  }

  // ---- Scroll parallax ([data-speed]) ----
  const speedEls = [...document.querySelectorAll('[data-speed]')];
  function scrollPar() { const y = scrollY; speedEls.forEach(el => { el.style.transform = `translate3d(0, ${y * (parseFloat(el.dataset.speed) || 0)}px, 0)`; }); }
  if (speedEls.length && !reduce) { addEventListener('scroll', scrollPar, { passive: true }); scrollPar(); }

  // ---- Horizontal scroll section (.h-scroll) ----
  const hWrap = document.querySelector('.h-scroll');
  if (hWrap && !reduce) {
    const pin = hWrap.querySelector('.h-pin');
    const track = hWrap.querySelector('.h-track');
    function hsc() {
      if (innerWidth <= 820) { track.style.transform = ''; return; }
      const max = track.scrollWidth - pin.clientWidth;
      const dist = hWrap.offsetHeight - pin.clientHeight;
      let p = (scrollY - hWrap.offsetTop) / dist;
      p = Math.max(0, Math.min(1, p));
      track.style.transform = `translate3d(${-p * max}px,0,0)`;
    }
    addEventListener('scroll', hsc, { passive: true });
    addEventListener('resize', hsc);
    hsc();
  }

  // ---- Seamless marquee: duplicate content until one half exceeds the viewport ----
  function buildMarquee(track) {
    if (!track.dataset.base) track.dataset.base = track.innerHTML;
    const base = track.dataset.base;
    let unit = base;
    track.innerHTML = unit;
    let guard = 0;
    while (track.scrollWidth < innerWidth + 260 && guard < 24) { unit += base; track.innerHTML = unit; guard++; }
    track.innerHTML = unit + unit;                 // two identical halves → -50% loops seamlessly
    const half = track.scrollWidth / 2;
    track.style.animationDuration = Math.max(16, half / 90) + 's';  // constant speed regardless of width
  }
  const velTracks = [...document.querySelectorAll('.vel-track, .t-track')];
  if (velTracks.length) {
    velTracks.forEach(buildMarquee);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => velTracks.forEach(buildMarquee), 200); });
  }
})();

// ===== Precise anchor navigation + pricing spotlight =====
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
        const head = sec.querySelector('.section-head, .inner, .h-intro, h2, h1') || sec;
        y = head.getBoundingClientRect().top + window.scrollY - off();
      }
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
    });
  });

  // Spotlight follows the cursor — unified across all cards
  document.querySelectorAll('.price, .card, .photo-mask').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();

// ===== Services rail arrows =====
(function () {
  const rail = document.querySelector('.ss-rail');
  if (!rail) return;
  document.querySelectorAll('.ss-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tile = rail.querySelector('.ss-tile');
      const step = (tile ? tile.offsetWidth : 280) + 32;
      rail.scrollBy({ left: step * parseInt(btn.dataset.dir, 10), behavior: 'smooth' });
    });
  });
})();

// ===== Scroll-spy: highlight current section in the header =====
(function () {
  const links = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => { links[a.getAttribute('href').slice(1)] = a; });
  const sections = [...document.querySelectorAll('main section[id], main div[id]')];
  if (!sections.length) return;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      Object.values(links).forEach(a => a.classList.remove('active'));
      const a = links[e.target.id] || (e.target.id === 'top' ? null : null);
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));
})();

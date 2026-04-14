/* ========================================
   KALYANAM — Wedding Invitation Scripts
   ======================================== */

// --- Scroll Animations (Intersection Observer) ---
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

// --- Countdown Timer ---
function initCountdown() {
  const weddingDate = new Date('2026-05-18T11:00:00+05:30');
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl) return;

  function update() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      daysEl.textContent = '0';
      hoursEl.textContent = '0';
      minutesEl.textContent = '0';
      secondsEl.textContent = '0';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = days;
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// --- Add to Calendar (Google Calendar link) ---
function initCalendar() {
  const btn = document.getElementById('add-to-calendar');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.open('https://calendar.app.google/xQf9W2kCfK2Cx94CA', '_blank', 'noopener');
  });
}

// --- Parallax on Hero (subtle) ---
function initParallax() {
  const hero = document.querySelector('.hero__photo');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const smallViewport = window.matchMedia('(max-width: 768px)').matches;
  if (!hero || reduceMotion || coarsePointer || smallViewport) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = window.innerHeight;
        if (scrollY < heroHeight) {
          hero.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// --- Music Toggle ---
function initMusic() {
  const btn = document.getElementById('music-toggle');
  const fallbackAudio = document.getElementById('bg-music-fallback');
  const iframe = document.getElementById('sc-player');
  const sourceLink = document.getElementById('music-source-link');
  if (!btn) return;

  const scTrackUrl = (btn.dataset.scTrackUrl || '').trim();
  const fallbackSrc = (btn.dataset.fallbackSrc || '').trim();
  const sourceUrl = (btn.dataset.sourceUrl || scTrackUrl).trim();
  const SOUND_CLOUD_CONFIRM_MS = 1800;

  let widget = null;
  let widgetReady = false;
  let activeBackend = 'none';
  let isPlaying = false;
  let awaitingSoundCloudPlay = false;
  let playConfirmTimeout = null;

  function setButtonState(playing) {
    isPlaying = playing;
    btn.classList.toggle('is-playing', playing);
    btn.classList.toggle('is-paused', !playing);
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  }

  function clearPlayTimeout() {
    if (!playConfirmTimeout) return;
    window.clearTimeout(playConfirmTimeout);
    playConfirmTimeout = null;
  }

  function pauseSoundCloudSilently() {
    if (!widget) return;
    try {
      widget.pause();
    } catch (_) {}
  }

  function stopActivePlayback() {
    clearPlayTimeout();
    awaitingSoundCloudPlay = false;
    if (activeBackend === 'soundcloud') {
      pauseSoundCloudSilently();
    } else if (activeBackend === 'fallback' && fallbackAudio) {
      fallbackAudio.pause();
    }
    activeBackend = 'none';
    setButtonState(false);
  }

  async function playFallback() {
    if (!fallbackAudio) {
      console.warn('[music] Fallback audio element not found.');
      activeBackend = 'none';
      setButtonState(false);
      return false;
    }

    if (fallbackSrc && fallbackAudio.getAttribute('src') !== fallbackSrc) {
      fallbackAudio.setAttribute('src', fallbackSrc);
      fallbackAudio.load();
    }

    try {
      activeBackend = 'fallback';
      await fallbackAudio.play();
      setButtonState(true);
      return true;
    } catch (error) {
      console.warn('[music] Fallback audio failed to play.', error);
      activeBackend = 'none';
      setButtonState(false);
      return false;
    }
  }

  function playSoundCloud() {
    if (!widget || !widgetReady) return false;

    clearPlayTimeout();
    awaitingSoundCloudPlay = true;
    activeBackend = 'soundcloud';

    try {
      widget.play();
    } catch (error) {
      console.warn('[music] SoundCloud play request failed.', error);
      awaitingSoundCloudPlay = false;
      activeBackend = 'none';
      return false;
    }

    playConfirmTimeout = window.setTimeout(() => {
      if (!awaitingSoundCloudPlay) return;
      awaitingSoundCloudPlay = false;
      pauseSoundCloudSilently();
      void playFallback();
    }, SOUND_CLOUD_CONFIRM_MS);

    return true;
  }

  function configureAttribution() {
    if (!sourceLink) return;
    if (!sourceUrl) {
      sourceLink.removeAttribute('href');
      sourceLink.textContent = 'SoundCloud track (set data-sc-track-url)';
      return;
    }
    sourceLink.href = sourceUrl;
  }

  function initSoundCloudWidget() {
    if (!iframe) {
      console.warn('[music] SoundCloud iframe not found.');
      return;
    }
    if (!scTrackUrl) {
      console.warn('[music] Missing data-sc-track-url on #music-toggle.');
      return;
    }

    const params = new URLSearchParams({
      url: scTrackUrl,
      auto_play: 'false',
      visual: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      buying: 'false',
      sharing: 'false',
      download: 'false'
    });

    iframe.src = `https://w.soundcloud.com/player/?${params.toString()}`;

    if (!(window.SC && typeof window.SC.Widget === 'function')) {
      console.warn('[music] SoundCloud Widget API unavailable. Fallback will be used.');
      return;
    }

    widget = window.SC.Widget(iframe);
    widget.bind(window.SC.Widget.Events.READY, () => {
      widgetReady = true;
    });
    widget.bind(window.SC.Widget.Events.PLAY, () => {
      clearPlayTimeout();
      awaitingSoundCloudPlay = false;
      activeBackend = 'soundcloud';
      setButtonState(true);
      if (fallbackAudio && !fallbackAudio.paused) {
        fallbackAudio.pause();
      }
    });
    widget.bind(window.SC.Widget.Events.PAUSE, () => {
      if (activeBackend !== 'soundcloud' || awaitingSoundCloudPlay) return;
      activeBackend = 'none';
      setButtonState(false);
    });
    widget.bind(window.SC.Widget.Events.FINISH, () => {
      if (activeBackend !== 'soundcloud') return;
      activeBackend = 'none';
      setButtonState(false);
    });
  }

  if (fallbackAudio) {
    fallbackAudio.addEventListener('play', () => {
      if (activeBackend !== 'fallback') return;
      setButtonState(true);
    });
    fallbackAudio.addEventListener('pause', () => {
      if (activeBackend !== 'fallback' || fallbackAudio.ended) return;
      activeBackend = 'none';
      setButtonState(false);
    });
    fallbackAudio.addEventListener('ended', () => {
      if (activeBackend !== 'fallback') return;
      activeBackend = 'none';
      setButtonState(false);
    });
    fallbackAudio.addEventListener('error', () => {
      if (activeBackend !== 'fallback') return;
      console.warn('[music] Fallback audio encountered an error.');
      activeBackend = 'none';
      setButtonState(false);
    });
  }

  configureAttribution();
  initSoundCloudWidget();
  setButtonState(false);

  btn.addEventListener('click', async () => {
    if (isPlaying) {
      stopActivePlayback();
      return;
    }

    const startedSoundCloud = playSoundCloud();
    if (startedSoundCloud) return;
    await playFallback();
  });
}

// --- Live Per-Letter Auto-Contrast ---
function initAutoContrast() {
  const tagline = document.querySelector('[data-autocontrast]');
  const heroImg = document.querySelector('.hero__photo img');
  const heroPhoto = document.querySelector('.hero__photo');
  if (!tagline || !heroImg || !heroPhoto) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const smallViewport = window.matchMedia('(max-width: 768px)').matches;
  const lightweightMode = coarsePointer || smallViewport || reduceMotion;

  // Wrap each character in a span
  const text = tagline.textContent;
  tagline.innerHTML = '';
  const letters = [];
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'ac-letter';
    span.textContent = text[i];
    tagline.appendChild(span);
    letters.push(span);
  }

  // Create off-screen canvas for sampling
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let ready = false;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    ready = true;
    updateLetters();
  };
  img.src = heroImg.src;

  // Overlay gradient parameters (must match CSS)
  // Top overlay: rgba(45,80,22) from 0.85 to 0 over top 40%
  // Bottom overlay: rgba(30,60,15) from 0.95 to 0 over bottom 50%
  function getOverlayAlpha(yRatio) {
    let alpha = 0;
    let oR = 45, oG = 80, oB = 22;
    // Top overlay: 0..0.4 of hero height
    if (yRatio < 0.4) {
      const t = yRatio / 0.4; // 0 at top, 1 at 40%
      alpha = 0.85 * (1 - t * t); // quadratic fade
      oR = 45; oG = 80; oB = 22;
    }
    // Bottom overlay: 0.5..1.0 of hero height
    if (yRatio > 0.5) {
      const t = (yRatio - 0.5) / 0.5; // 0 at 50%, 1 at bottom
      const botAlpha = 0.95 * t * t;
      if (botAlpha > alpha) {
        alpha = botAlpha;
        oR = 30; oG = 60; oB = 15;
      }
    }
    return { alpha, oR, oG, oB };
  }

  function updateLetters() {
    if (!ready) return;
    const hero = document.querySelector('.hero');
    const heroRect = hero.getBoundingClientRect();
    const parallaxOffset = getHeroParallaxOffset();

    for (const span of letters) {
      if (span.textContent.trim() === '') continue; // skip spaces

      const r = span.getBoundingClientRect();
      const cx = (r.left + r.width / 2 - heroRect.left) / heroRect.width;
      const localY = r.top + r.height / 2 - heroRect.top;
      // Account for hero image translateY applied by parallax.
      const cy = (localY - parallaxOffset) / heroRect.height;

      if (cx < 0 || cx > 1 || cy < 0 || cy > 1) continue;

      // Sample image pixel
      const sx = Math.floor(cx * canvas.width);
      const sy = Math.floor(cy * canvas.height);
      const pixel = ctx.getImageData(
        Math.max(0, Math.min(sx, canvas.width - 1)),
        Math.max(0, Math.min(sy, canvas.height - 1)),
        1, 1
      ).data;

      let imgR = pixel[0], imgG = pixel[1], imgB = pixel[2];

      // Blend with CSS overlay
      const ov = getOverlayAlpha(cy);
      const a = ov.alpha;
      const blendR = imgR * (1 - a) + ov.oR * a;
      const blendG = imgG * (1 - a) + ov.oG * a;
      const blendB = imgB * (1 - a) + ov.oB * a;

      // Compute relative luminance
      const lum = (0.299 * blendR + 0.587 * blendG + 0.114 * blendB) / 255;

      // Pick high-contrast monochrome color.
      if (lum > 0.45) {
        span.style.color = '#1a1a1a';
      } else {
        span.style.color = '#ffffff';
      }
    }
  }

  function getHeroParallaxOffset() {
    const transform = heroPhoto.style.transform;
    if (!transform) return 0;
    const match = transform.match(/translateY\((-?\d+(\.\d+)?)px\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  // Run on scroll and resize.
  let rafId = null;
  let heroInView = true;
  function scheduleUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      if (!heroInView) {
        rafId = null;
        return;
      }
      updateLetters();
      rafId = null;
    });
  }

  if (!lightweightMode) {
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
  }
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  // Also refresh when the hero re-enters the viewport.
  const heroObserver = new IntersectionObserver((entries) => {
    heroInView = entries[0].isIntersecting;
    if (heroInView) {
      scheduleUpdate();
    }
  }, { threshold: 0 });
  heroObserver.observe(document.querySelector('.hero'));
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initCountdown();
  initCalendar();
  initParallax();
  initMusic();
  initAutoContrast();
  // Editor is self-initializing via editor.js
});

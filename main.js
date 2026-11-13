/* HÁBITAT · Nimus × Biofilium — interacción mínima, sin dependencias */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  /* Entradas: escalonado en el hero al cargar; el resto aparece al entrar en pantalla */
  const hero = $('.hero');
  nextFrame(() => $$('[data-reveal]', hero).forEach((el) => el.classList.add('in')));
  const pending = $$('[data-reveal]').filter((el) => !hero.contains(el) && !el.closest('[hidden]'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    pending.forEach((el) => io.observe(el));
  } else {
    pending.forEach((el) => el.classList.add('in'));
  }

  /* Nav: se vuelve sólida al bajar, se oculta al seguir bajando y vuelve al subir */
  const nav = $('#nav');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 24);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 480 && !nav.contains(document.activeElement)) nav.classList.add('is-hidden');
    else if (goingUp || y <= 480) nav.classList.remove('is-hidden');
    if (goingDown || goingUp) lastY = y;
    ticking = false;
  };
  onScroll();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  /* Sección activa en la nav */
  const links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const a = map.get(e.target.id);
        links.forEach((l) => l.removeAttribute('aria-current'));
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section, footer').forEach((s) => spy.observe(s));
  }

  /* Configurador + reserva.
     Hábitat y tamaño viven en el formulario de reserva y mueven el visor;
     la vista se elige con las miniaturas. Cambio de imagen: cross-fade de opacidad en 150ms. */
  const form = $('#waitlist');
  const viewsSet = $('#views');
  const stage = $('#stage');
  const names = { carbon: 'Carbón', marfil: 'Marfil' };
  const folder = { carbon: 'negro', marfil: 'beige' };
  const views = { '01': 'Frontal', '02': 'Perspectiva', '04': 'Perfil', '06': 'Detalle' };
  const src = (c, s, v) => `assets/renders/${s}/${folder[c]}/${v}.webp`;
  const state = () => ({
    c: (form && form.elements.habitat.value) || 'carbon',
    s: (form && form.elements.size.value) || '180',
    v: ($('input[name="view"]:checked') || { value: '01' }).value,
  });

  if (form && stage && viewsSet) {
    const imgs = $$('.stage__img', stage);
    const thumbs = $$('.thumb', viewsSet);
    const label = $('#stage-label');
    const viewLabel = $('#stage-view');
    const btnLabel = $('#f-submit .btn__label');
    let front = 0;
    let token = 0;

    const paintThumbs = (c, s) => thumbs.forEach((t) => { t.src = src(c, s, t.dataset.v); });

    const update = () => {
      const { c, s, v } = state();
      stage.dataset.color = c;
      viewsSet.dataset.color = c;
      label.textContent = `Ø${s} × 60 mm · ${names[c]}`;
      viewLabel.textContent = views[v];
      if (form.dataset.state !== 'busy') btnLabel.textContent = `Reservar ${names[c]} · Ø${s}`;
      paintThumbs(c, s);

      const next = imgs[1 - front];
      const cur = imgs[front];
      const my = ++token;
      next.onload = () => {
        if (my !== token) return;
        next.dataset.view = v;
        next.alt = `Pieza HÁBITAT en ${names[c]}, Ø${s} mm, vista ${views[v].toLowerCase()}.`;
        next.removeAttribute('aria-hidden');
        cur.alt = ''; cur.setAttribute('aria-hidden', 'true');
        next.classList.add('is-on'); cur.classList.remove('is-on');
        front = 1 - front;
      };
      next.src = src(c, s, v);
      if (next.complete && next.naturalWidth) next.onload();
    };

    paintThumbs('carbon', '180');
    form.addEventListener('change', (e) => { if (e.target.name === 'habitat' || e.target.name === 'size') update(); });
    viewsSet.addEventListener('change', update);

    window.addEventListener('load', () => {
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
      idle(() => {
        ['carbon', 'marfil'].forEach((c) => ['180', '130'].forEach((s) =>
          Object.keys(views).forEach((v) => { const i = new Image(); i.src = src(c, s, v); })));
      });
    });
  }

  /* Archivo: anterior / siguiente */
  const strip = $('#strip');
  const prev = $('#strip-prev');
  const nextBtn = $('#strip-next');
  if (strip && prev && nextBtn) {
    const step = () => Math.max(strip.clientWidth * 0.8, 240);
    const go = (dir) => strip.scrollBy({ left: dir * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    const sync = () => {
      prev.disabled = strip.scrollLeft <= 4;
      nextBtn.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    };
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* Envío de la reserva */
  if (form) {
    const email = $('#f-email');
    const consent = $('#f-consent');
    const emailErr = $('#f-email-err');
    const consentErr = $('#f-consent-err');
    const status = $('#f-status');
    const btn = $('#f-submit');
    const btnLabel = $('.btn__label', btn);
    const ok = $('#waitlist-ok');
    const okDetail = $('#ok-detail');
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const setErr = (input, el, msg) => {
      el.textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };
    const setBusy = (busy) => {
      const { c, s } = state();
      form.dataset.state = busy ? 'busy' : 'idle';
      btn.disabled = busy;
      btn.dataset.state = busy ? 'busy' : 'idle';
      btnLabel.textContent = busy ? 'Guardando…' : `Reservar ${names[c]} · Ø${s}`;
      if (busy) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
    };

    email.addEventListener('input', () => { if (email.getAttribute('aria-invalid') && isEmail(email.value.trim())) setErr(email, emailErr, ''); });
    consent.addEventListener('change', () => { if (consent.checked) setErr(consent, consentErr, ''); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      let first = null;
      if (!isEmail(email.value.trim())) { setErr(email, emailErr, 'Escribe un correo válido, por ejemplo nombre@correo.com.'); first = email; } else setErr(email, emailErr, '');
      if (!consent.checked) { setErr(consent, consentErr, 'Necesitamos tu permiso para escribirte.'); first = first || consent; } else setErr(consent, consentErr, '');
      if (first) { first.focus(); return; }

      const { c, s } = state();
      const data = {
        email: email.value.trim(),
        name: $('#f-name').value.trim(),
        habitat: c,
        size: s,
        consent: true,
      };

      setBusy(true);
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        okDetail.textContent = `Guardamos tu elección: HÁBITAT ${names[c]}, Ø${s} mm. Te escribiremos antes que a nadie cuando abra la preventa.`;
        // Salida corta del formulario (150ms) y entrada escalonada de la confirmación
        form.classList.add('is-leaving');
        setTimeout(() => {
          form.hidden = true;
          ok.hidden = false;
          ok.focus();
          nextFrame(() => $$('[data-reveal]', ok).forEach((el) => el.classList.add('in')));
        }, 150);
      } catch (err) {
        status.textContent = 'No pudimos guardar tu lugar. Revisa tu conexión e inténtalo de nuevo.';
        setBusy(false);
      }
    });
  }
})();

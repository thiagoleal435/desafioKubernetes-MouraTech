// UUBJ Front — app.js
(() => {
  // ano no rodapé
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  const page = document.body.dataset.page || '';

  // ===============================
  // HOME: Carrossel do HERO
  // ===============================
  if (page === 'home') {
    const slider = document.querySelector('.hero-slider .slider');
    if (!slider) return;

    const track = slider.querySelector('.slider__track');
    const slides = Array.from(track.querySelectorAll('.slide'));
    const prevBtn = slider.querySelector('.slider__nav.prev');
    const nextBtn = slider.querySelector('.slider__nav.next');
    const dotsEl  = slider.querySelector('.slider__dots');

    let i = 0;
    let timer = null;
    const AUTOPLAY = Number(slider.dataset.autoplay || 0);

    // cria dots
    slides.forEach((_, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir para o slide ${idx + 1}`);
      b.addEventListener('click', () => go(idx, true));
      dotsEl.appendChild(b);
    });

    function mark() {
      const ds = Array.from(dotsEl.children);
      ds.forEach((d, idx) => d.setAttribute('aria-selected', idx === i ? 'true' : 'false'));
    }

    function go(idx, userTriggered = false) {
      // loop infinito
      i = (idx + slides.length) % slides.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      mark();
      if (userTriggered) restart(); // reinicia autoplay se o usuário clicou
    }

    function next() { go(i + 1); }
    function prev() { go(i - 1); }

    // listeners das setas
    nextBtn?.addEventListener('click', next);
    prevBtn?.addEventListener('click', prev);

    // autoplay
    function restart() {
      if (!AUTOPLAY) return;
      clearInterval(timer);
      timer = setInterval(next, AUTOPLAY);
    }
    if (AUTOPLAY) restart();

    // pausa ao interagir
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown']
      .forEach(ev => slider.addEventListener(ev, () => clearInterval(timer)));
    ['mouseleave', 'focusout', 'touchend', 'pointerup']
      .forEach(ev => slider.addEventListener(ev, () => restart()));

    // swipe (arrastar)
    let startX = null;
    let pointerId = null;
    track.addEventListener('pointerdown', e => {
      startX = e.clientX;
      pointerId = e.pointerId;
      track.setPointerCapture(pointerId);
    });
    track.addEventListener('pointerup', e => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
      startX = null;
      pointerId = null;
    });

    // teclado (setas esquerda/direita)
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // inicia
    go(0);
  }
})();

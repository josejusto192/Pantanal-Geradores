// Menu mobile
const navbar = document.querySelector('.navbar');
const toggle = navbar.querySelector('.navbar__toggle');

toggle.addEventListener('click', () => {
  const open = navbar.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

navbar.querySelectorAll('.navbar__links a').forEach((link) =>
  link.addEventListener('click', () => {
    navbar.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  })
);

// Megamenu de Serviços: abre no hover (desktop), no clique e com o teclado
const servicosItem = document.querySelector('.navbar__servicos');
const servicosTrigger = servicosItem.querySelector('.navbar__trigger');
const telaGrande = matchMedia('(min-width: 1101px)');
let megaTimer;

function abrirMega(abrir) {
  servicosItem.classList.toggle('is-open', abrir);
  servicosTrigger.setAttribute('aria-expanded', abrir);
}

servicosItem.addEventListener('mouseenter', () => {
  if (!telaGrande.matches) return;
  clearTimeout(megaTimer);
  megaTimer = setTimeout(() => abrirMega(true), 80);
});
servicosItem.addEventListener('mouseleave', () => {
  if (!telaGrande.matches) return;
  clearTimeout(megaTimer);
  megaTimer = setTimeout(() => abrirMega(false), 180);
});
servicosTrigger.addEventListener('click', () => abrirMega(!servicosItem.classList.contains('is-open')));
servicosItem.addEventListener('focusin', () => abrirMega(true));
servicosItem.addEventListener('focusout', (e) => {
  if (!servicosItem.contains(e.relatedTarget)) abrirMega(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrirMega(false); });
document.addEventListener('click', (e) => { if (!servicosItem.contains(e.target)) abrirMega(false); });
servicosItem.querySelectorAll('.mega a').forEach((a) => a.addEventListener('click', () => abrirMega(false)));

// Serviços: carrossel infinito. O DOM é rotacionado (1º card vai pro fim e vice-versa),
// então o card "anterior" sempre aparece cortado à esquerda, como no Figma.
const track = document.querySelector('.servicos__track');
const servDots = document.querySelector('.servicos__dots');
const total = track.children.length;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 0; // índice do card alinhado ao container
let moving = false;

track.prepend(track.lastElementChild);

for (let i = 0; i < total; i++) {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Serviço ${i + 1}`);
  dot.addEventListener('click', () => {
    const ahead = (i - current + total) % total; // caminho mais curto
    moveCarousel(ahead <= total / 2 ? ahead : ahead - total);
  });
  servDots.append(dot);
}

function markActive(pos = 1) { // pos = posição no DOM do card alinhado ao container
  [...track.children].forEach((card, i) => card.classList.toggle('is-active', i === pos));
  [...servDots.children].forEach((dot, i) => dot.setAttribute('aria-current', i === current));
}

function moveCarousel(steps) {
  if (!steps || moving) return;
  moving = true;
  track.classList.add('is-moving');
  const style = getComputedStyle(track);
  const shift = Math.abs(steps) * (track.children[0].offsetWidth + parseFloat(style.columnGap));
  const duration = reduceMotion.matches ? 0 : 500;
  const animate = (to) => {
    track.offsetHeight; // garante que a posição inicial seja aplicada antes de animar
    track.style.transition = `transform ${duration}ms cubic-bezier(.4, 0, .2, 1)`;
    track.style.transform = to;
  };

  current = (current + steps + total) % total;
  if (steps > 0) {
    markActive(1 + steps);
    animate(`translateX(${-shift}px)`);
  } else {
    track.style.transition = 'none';
    for (let i = 0; i < -steps; i++) track.prepend(track.lastElementChild);
    track.style.transform = `translateX(${-shift}px)`;
    markActive();
    animate('');
  }

  setTimeout(() => {
    if (steps > 0) {
      track.style.transition = 'none';
      for (let i = 0; i < steps; i++) track.append(track.firstElementChild);
      track.style.transform = '';
    }
    markActive();
    track.classList.remove('is-moving');
    moving = false;
  }, duration);
}

document.querySelectorAll('.servicos__btn').forEach((btn) =>
  btn.addEventListener('click', () => moveCarousel(Number(btn.dataset.dir)))
);

// arrastar para o lado (touch e mouse)
let dragStart = null;
let dragged = false;
track.addEventListener('pointerdown', (e) => { dragStart = e.clientX; dragged = false; });
track.addEventListener('pointerup', (e) => {
  if (dragStart === null) return;
  const dx = e.clientX - dragStart;
  dragStart = null;
  if (Math.abs(dx) > 50) {
    dragged = true;
    moveCarousel(dx < 0 ? 1 : -1);
  }
});
track.addEventListener('pointercancel', () => { dragStart = null; });
// não segue o link se o gesto foi um arraste
track.addEventListener('click', (e) => { if (dragged) e.preventDefault(); }, true);

markActive();

// Portfólio: duplica os itens de cada faixa (2 cópias) para o loop contínuo e só então liga a animação
document.querySelectorAll('.marquee').forEach((marquee) => {
  const track = marquee.querySelector('.marquee__track');
  const items = [...track.children];
  for (let i = 0; i < 2; i++) {
    items.forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.append(copy);
    });
  }
  marquee.classList.add('is-ready');
});

// Contato: monta a mensagem com os dados do formulário e abre o WhatsApp
const WHATSAPP_NUMERO = '5565996479191'; // (65) 99647-9191, o número que está no rodapé do Figma
document.getElementById('form-contato').addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = new FormData(e.currentTarget);
  const campo = (nome) => String(dados.get(nome)).trim();
  const texto = `Olá! Meu nome é ${campo('nome')}.\nPreciso de: ${campo('servico')}\nCidade: ${campo('cidade')}`;
  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
});

// Links diretos para o WhatsApp (usam o mesmo número do formulário)
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  const texto = link.dataset.mensagem || 'Olá! Vim pelo site e gostaria de falar com a equipe da Pantanal Geradores.';
  link.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
  link.target = '_blank';
  link.rel = 'noopener';
});

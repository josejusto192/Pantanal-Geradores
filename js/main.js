// Menu mobile
const navbar = document.querySelector('.navbar');
const toggle = navbar.querySelector('.navbar__toggle');

toggle.addEventListener('click', () => {
  const open = navbar.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  if (!open) document.querySelector('.navbar__servicos').classList.remove('is-open'); // volta ao menu principal
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

const megaPainel = document.getElementById('megamenu');

// a setinha do painel aponta para o item "Serviços"
function posicionarSeta() {
  const painel = megaPainel.getBoundingClientRect();
  const botao = servicosTrigger.getBoundingClientRect();
  megaPainel.style.setProperty('--seta', `${botao.left + botao.width / 2 - painel.left}px`);
}

const listaMenu = document.getElementById('nav-links');

function abrirMega(abrir) {
  servicosItem.classList.toggle('is-open', abrir);
  servicosTrigger.setAttribute('aria-expanded', abrir);
  // no mobile o submenu ocupa a altura do painel: o painel passa a ter a altura da lista de serviços
  const submenuMobile = abrir && !telaGrande.matches;
  listaMenu.classList.toggle('tem-submenu', submenuMobile);
  if (submenuMobile) {
    // o submenu é absoluto (inset: 0), então a altura vem do último filho, não do scrollHeight
    const ultimo = megaPainel.lastElementChild;
    listaMenu.style.height = ultimo.offsetTop + ultimo.offsetHeight + 12 + 'px';
  } else {
    listaMenu.style.height = '';
  }
  if (abrir && telaGrande.matches) posicionarSeta();
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
// botão "voltar" do submenu no mobile
servicosItem.querySelector('.mega__voltar').addEventListener('click', () => abrirMega(false));

// Serviços: carrossel infinito. O DOM é rotacionado (1º card vai pro fim e vice-versa),
// então o card "anterior" sempre aparece cortado à esquerda, como no Figma.
const track = document.querySelector('.servicos__track');
const servDots = document.querySelector('.servicos__dots');
const total = track.children.length;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 0; // índice do card alinhado ao container
let moving = false;
let antes = 0; // quantos cards ficam antes do container (cortados à esquerda)

function passo() {
  return track.children[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap);
}

// leva cards do fim para o começo (ou de volta) até cobrir a borda esquerda da tela
function ajustarAntes() {
  const p = passo();
  if (!p || !isFinite(p)) return; // layout ainda não pronto: nada a medir
  // quantos cards cabem entre a borda da tela e o container (a borda não muda com o --serv-antes)
  const desejado = Math.max(1, Math.ceil(track.parentElement.getBoundingClientRect().left / p));
  const faltam = desejado - antes;
  for (let i = 0; i < faltam; i++) track.prepend(track.lastElementChild);
  for (let i = 0; i < -faltam; i++) track.append(track.firstElementChild); // sobrou card à esquerda
  antes = desejado;
  track.style.setProperty('--serv-antes', antes);
}

ajustarAntes();

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

function markActive(pos = antes) { // pos = posição no DOM do card alinhado ao container
  [...track.children].forEach((card, i) => card.classList.toggle('is-active', i === pos));
  [...servDots.children].forEach((dot, i) => dot.setAttribute('aria-current', i === current));
}

function moveCarousel(steps) {
  if (!steps || moving) return;
  moving = true;
  track.classList.add('is-moving');
  const shift = Math.abs(steps) * passo();
  const duration = reduceMotion.matches ? 0 : 500;
  const animate = (to) => {
    track.offsetHeight; // garante que a posição inicial seja aplicada antes de animar
    track.style.transition = `transform ${duration}ms cubic-bezier(.4, 0, .2, 1)`;
    track.style.transform = to;
  };

  current = (current + steps + total) % total;
  if (steps > 0) {
    markActive(antes + steps);
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

// ao redimensionar (ou girar a tela), pode faltar card na borda esquerda
let redimensionar;
addEventListener('resize', () => {
  clearTimeout(redimensionar);
  redimensionar = setTimeout(remedirCarrosseis, 200);
});

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

// Faixas contínuas (portfólio e depoimentos): duplica os itens o mínimo necessário para o loop.
// Poucas cópias = faixa mais curta, que no celular evita falhas de renderização.
let larguraFaixas = 0;

// remontar reinicia a animação, então no resize só refaz se a largura mudou de fato
// (no iOS o resize dispara a toda hora quando a barra de endereço aparece/some)
function montarFaixas(forcar = false) {
  if (!forcar && innerWidth === larguraFaixas) return;
  larguraFaixas = innerWidth;
  document.querySelectorAll('.marquee').forEach((marquee) => {
    const track = marquee.querySelector('.marquee__track');
    track.querySelectorAll('[data-copia]').forEach((c) => c.remove()); // remonta do zero
    const items = [...track.children];
    const conjunto = track.scrollWidth; // largura de um conjunto, já com o espaçamento final
    if (!conjunto) return; // layout ainda não pronto
    const alvo = Math.max(innerWidth, screen.width || 0); // cobre também o giro da tela
    const copias = Math.max(2, Math.ceil(alvo / conjunto) + 1);

    for (let i = 1; i < copias; i++) {
      items.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.dataset.copia = '1';
        track.append(copy);
      });
    }
    track.style.setProperty('--copias', copias);
    marquee.classList.add('is-ready');
  });
}

montarFaixas(true);

// as medidas acima dependem da fonte e das imagens; no celular elas chegam depois do script
function remedirCarrosseis(forcar = false) {
  if (!moving) { ajustarAntes(); markActive(); }
  montarFaixas(forcar);
}

document.fonts.ready.then(() => remedirCarrosseis(true));
addEventListener('load', () => remedirCarrosseis(true));

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

// Como Funciona: etapas entram ao aparecer e a linha verde preenche conforme a rolagem
const listaEtapas = document.querySelector('.etapas');
const etapas = [...listaEtapas.querySelectorAll('.etapa')];
const numeros = etapas.map((e) => e.querySelector('.etapa__numero'));

if (reduceMotion.matches) {
  etapas.forEach((e) => e.style.setProperty('--preenchido', 1));
} else {
  listaEtapas.classList.add('anima');
  etapas.forEach((e) => e.style.setProperty('--preenchido', 0));

  // mostra as etapas que já entraram na tela e preenche cada trecho da linha
  function animarEtapas() {
    const referencia = innerHeight * 0.62;

    etapas.forEach((etapa, i) => {
      const r = etapa.getBoundingClientRect();
      if (r.top < innerHeight * 0.88 && r.bottom > 0) etapa.classList.add('is-visivel');

      // o número acende quando a linha verde chega nele
      const n = numeros[i].getBoundingClientRect();
      etapa.classList.toggle('is-alcancada', n.top + n.height / 2 <= referencia);
    });

    etapas.slice(0, -1).forEach((etapa, i) => {
      const a = numeros[i].getBoundingClientRect();
      const b = numeros[i + 1].getBoundingClientRect();
      const inicio = a.top + a.height / 2;
      const fim = b.top + b.height / 2;
      const p = Math.min(1, Math.max(0, (referencia - inicio) / (fim - inicio || 1)));
      etapa.style.setProperty('--preenchido', p.toFixed(3));
    });
  }

  addEventListener('scroll', animarEtapas, { passive: true });
  addEventListener('resize', animarEtapas);
  animarEtapas();
}

/* ==========================================================================
   Scroll suave (inércia) — só no desktop com mouse; toque e teclado usam o nativo
   ========================================================================== */
const mouseFino = matchMedia('(hover: hover) and (pointer: fine)');

if (!reduceMotion.matches && mouseFino.matches) {
  let alvo = scrollY;
  let animando = false;

  const limite = () => document.documentElement.scrollHeight - innerHeight;
  // elementos com rolagem própria (menu, submenu) continuam com o scroll nativo
  const temScrollProprio = (el) => el instanceof Element && el.closest('.navbar__links, .mega');

  function passoScroll() {
    const restante = alvo - scrollY;
    // 'instant' porque html { scroll-behavior: smooth } animaria cada passo e travaria a inércia
    if (Math.abs(restante) < 0.5) {
      scrollTo({ top: alvo, behavior: 'instant' });
      animando = false;
      return;
    }
    scrollTo({ top: scrollY + restante * 0.1, behavior: 'instant' });
    requestAnimationFrame(passoScroll);
  }

  // Firefox e alguns mouses mandam o delta em linhas (1) ou páginas (2), não em pixels
  const emPixels = (e) => e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);

  addEventListener('wheel', (e) => {
    if (e.ctrlKey || temScrollProprio(e.target)) return;
    e.preventDefault();
    alvo = Math.min(limite(), Math.max(0, (animando ? alvo : scrollY) + emPixels(e)));
    if (!animando) {
      animando = true;
      requestAnimationFrame(passoScroll);
    }
  }, { passive: false });

  // qualquer outro tipo de rolagem (âncora, teclado, barra) recalibra o alvo
  addEventListener('scroll', () => { if (!animando) alvo = scrollY; }, { passive: true });
}

/* ==========================================================================
   Entrada dos cards (soluções, abordagem, benefícios)
   ========================================================================== */
const gruposEntrada = ['.solucoes__cards > *', '.abordagem__lista > li', '.beneficios__cards > *'];

if (!reduceMotion.matches) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('entrou');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  gruposEntrada.forEach((seletor) => {
    document.querySelectorAll(seletor).forEach((el, i) => {
      el.classList.add('entra');
      el.style.setProperty('--i', i); // escalona a entrada dentro do grupo
      observador.observe(el);
    });
  });
}

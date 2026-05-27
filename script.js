/* =============================================================
   TERRUNO WINE & SPIRITS — script.js
============================================================= */

'use strict';

/* ── Hero Canvas — Particle System ─────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const PARTICLE_COUNT = 55;
  const COLOR_POOL = [
    'rgba(240, 192, 96, 0.6)',
    'rgba(212, 149, 106, 0.5)',
    'rgba(240, 192, 96, 0.35)',
    'rgba(255, 255, 255, 0.18)',
    'rgba(212, 149, 106, 0.3)',
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle(forceBottom = false) {
    const r = Math.random() * 2.5 + 0.5;
    return {
      x: Math.random() * W,
      y: forceBottom ? H + r : Math.random() * H,
      r,
      color: COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)],
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.55 + 0.2),
      alpha: Math.random() * 0.7 + 0.3,
      drift: Math.sin(Math.random() * Math.PI * 2),
      driftSpeed: Math.random() * 0.015 + 0.005,
      life: 0,
      maxLife: Math.random() * 400 + 200,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(false));
    }
  }

  function drawStar(x, y, r, alpha, color) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // soft glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // Subtle animated stars in the upper sky
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5 + 50) % W);
      const sy = ((i * 79.3 + 20) % (H * 0.45));
      const flicker = 0.3 + 0.2 * Math.sin(Date.now() * 0.001 * (0.5 + (i % 7) * 0.15) + i);
      ctx.save();
      ctx.globalAlpha = flicker * 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    particles.forEach((p, idx) => {
      p.life++;
      p.x += p.vx + Math.sin(p.life * p.driftSpeed) * 0.25;
      p.y += p.vy;

      const t = p.life / p.maxLife;
      const alpha = t < 0.1
        ? t / 0.1 * p.alpha
        : t > 0.8
          ? (1 - (t - 0.8) / 0.2) * p.alpha
          : p.alpha;

      drawStar(p.x, p.y, p.r, alpha, p.color);

      if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > W + 10) {
        particles[idx] = createParticle(true);
      }
    });

    animId = requestAnimationFrame(tick);
  }

  function start() {
    resize();
    initParticles();
    tick();
  }

  const ro = new ResizeObserver(() => {
    resize();
    initParticles();
  });
  ro.observe(canvas.parentElement || document.body);

  // Pause when offscreen (IntersectionObserver)
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!animId) tick();
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  io.observe(canvas);

  start();
})();


/* ── Animated Leaves ─────────────────────────────────────────── */
(function initLeaves() {
  const container = document.getElementById('heroLeaves');
  if (!container) return;

  const LEAF_COUNT = 18;

  for (let i = 0; i < LEAF_COUNT; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';

    const startX = Math.random() * 100;
    const size   = Math.random() * 8 + 6;
    const dur    = Math.random() * 12 + 10;
    const delay  = Math.random() * 15;
    const drift  = (Math.random() - 0.5) * 120 + 'px';
    const spin   = (Math.random() - 0.5) * 360 + 'deg';
    const hue    = Math.random() > 0.5 ? '#454411' : '#797853';

    leaf.style.cssText = `
      left: ${startX}%;
      bottom: ${Math.random() * 30}%;
      width: ${size}px;
      height: ${size * 1.4}px;
      background: ${hue};
      opacity: 0;
      --drift: ${drift};
      --spin: ${spin};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(leaf);
  }
})();


/* ── Navigation: scroll state + hamburger ────────────────────── */
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobileNav');
  const mobileLinks = document.querySelectorAll('.nav__mobile-link');

  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);

    // Drive the scroll-progress line via CSS custom property
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? (y / maxScroll) * 100 : 0;
    nav.style.setProperty('--scroll-pct', pct.toFixed(1) + '%');

    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileLinks.forEach(l => l.addEventListener('click', closeMenu));

  // Close on outside click
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();


/* ── Parallax on hero hills ──────────────────────────────────── */
(function initParallax() {
  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;

  function onScroll() {
    const y = window.scrollY;
    layers.forEach(el => {
      const speed = parseFloat(el.dataset.parallax);
      el.style.transform = `translateY(${y * speed}px)`;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ── Scroll Reveal (IntersectionObserver) ────────────────────── */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  let delay = 0;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Stagger siblings in the same parent
      const siblings = [...el.parentElement.querySelectorAll('.reveal:not(.visible)')];
      const idx = siblings.indexOf(el);

      setTimeout(() => {
        el.classList.add('visible');
        io.unobserve(el);
      }, idx * 80);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => io.observe(el));
})();



/* ── Smooth Active Nav Link ──────────────────────────────────── */
(function initActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${entry.target.id}`
        );
      });
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => io.observe(s));
})();


/* ── Contact Form ────────────────────────────────────────────── */
(function initForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const btn     = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const required = form.querySelectorAll('[required]');
    let valid = true;

    required.forEach(input => {
      input.style.borderColor = '';
      if (!input.value.trim()) {
        input.style.borderColor = '#b54a2a';
        valid = false;
      }
    });

    if (!valid) return;

    // Simulate submission (swap with real API call)
    btn.disabled = true;
    btn.querySelector('.btn-submit__text').textContent = 'Sending…';

    setTimeout(() => {
      form.querySelectorAll('.form-input').forEach(el => el.value = '');
      btn.style.display = 'none';
      if (success) {
        success.classList.add('visible');
        success.style.display = 'flex';
      }
    }, 1200);
  });

  // Live validation feedback
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.style.borderColor = '';
    });
  });
})();



/* ── Mexico Regions Map (D3 + GeoJSON, lazy-loaded) ─────────── */
(function initRegionsMap() {
  const wrap = document.getElementById('mexicoMap');
  if (!wrap) return;

  const STATE_TO_WINERY = {
    'baja california': 'concierto',
    'guanajuato':      'cuna',
  };

  const NAME_OVERRIDES = {
    'coahuila de zaragoza':             'coahuila',
    'michoacan de ocampo':              'michoacan',
    'veracruz de ignacio de la llave':  'veracruz',
    'baja california norte':            'baja california',
    'mexico':                           'estado de mexico',
  };

  const CARD_DATA = {
    concierto: { abbr: 'BC',  name: 'Concierto Enológico', sub: 'Valle de Guadalupe \u00b7 Baja California', stats: ['6 Wines', '12 Awards', '18mo Barrel Aged'] },
    cuna:      { abbr: 'GTO', name: 'Cuna de Tierra',      sub: 'Dolores Hidalgo \u00b7 Guanajuato',         stats: ['6 Wines', '40+ Awards', '2,000m Altitude'] },
  };

  const FILL_ACTIVE      = 'rgba(212, 185, 122, 1)';
  const FILL_HIGHLIGHTED = 'rgba(212, 185, 122, 0.55)';
  const FILL_SECONDARY   = 'rgba(212, 185, 122, 0.22)';
  const FILL_DEFAULT     = 'rgba(241, 237, 222, 0.07)';
  const STROKE           = 'rgba(241, 237, 222, 0.13)';

  const SECONDARY_STATES = new Set(['sonora', 'coahuila', 'durango', 'zacatecas', 'aguascalientes', 'queretaro']);

  let activeWinery = 'cuna';
  let stateEls     = {};
  let centroids    = {};
  let cardEls      = {};
  let arrowSvgEl   = null;
  let mapSvgEl     = null;
  let resizeTimer  = null;

  function normalizeKey(str) {
    const base = str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return NAME_OVERRIDES[base] || base;
  }

  function getStateName(feature) {
    const p = feature.properties || {};
    return p.name || p.NAME_1 || p.ESTADO || p.state_name || p.NOM_ENT || p.NAME || '';
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function drawArrows() {
    if (!arrowSvgEl || !mapSvgEl) return;
    arrowSvgEl.querySelectorAll('.rm-arrow-g').forEach(function(el) { el.remove(); });

    const body = wrap.closest('.regions__body');
    if (!body) return;
    const bodyRect = body.getBoundingClientRect();
    const svgRect  = mapSvgEl.getBoundingClientRect();
    const vb       = mapSvgEl.getAttribute('viewBox').split(' ');
    const scX      = svgRect.width  / parseFloat(vb[2]);
    const scY      = svgRect.height / parseFloat(vb[3]);
    const ox       = svgRect.left - bodyRect.left;
    const oy       = svgRect.top  - bodyRect.top;

    const ns = 'http://www.w3.org/2000/svg';
    Object.entries(centroids).forEach(function([key, centroid]) {
      const cvx = centroid[0]; const cvy = centroid[1];
      const wk   = STATE_TO_WINERY[key];
      const card = cardEls[wk];
      if (!card) return;

      const cr  = card.getBoundingClientRect();
      const sx  = ox + cvx * scX;
      const sy  = oy + cvy * scY;
      const cardMidX = cr.left - bodyRect.left + cr.width / 2;
      const ex  = cardMidX < sx ? cr.right - bodyRect.left : cr.left - bodyRect.left;
      const ey  = cr.top  - bodyRect.top + cr.height / 2;

      const dx   = ex - sx;
      const cp1x = sx + dx * 0.5;
      const cp1y = sy;
      const cp2x = ex - dx * 0.2;
      const cp2y = ey;

      const isActive = wk === activeWinery;
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'rm-arrow-g');

      const pulse = document.createElementNS(ns, 'circle');
      pulse.setAttribute('cx', sx); pulse.setAttribute('cy', sy); pulse.setAttribute('r', 8);
      pulse.setAttribute('fill', isActive ? 'rgba(212,185,122,0.35)' : 'rgba(212,185,122,0.15)');
      pulse.setAttribute('class', 'pf-arrow-pulse');
      g.appendChild(pulse);

      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', sx); dot.setAttribute('cy', sy); dot.setAttribute('r', 3.5);
      dot.setAttribute('fill', isActive ? 'rgba(212,185,122,1)' : 'rgba(212,185,122,0.55)');
      g.appendChild(dot);

      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M ' + sx + ' ' + sy + ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + ex + ' ' + ey);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', isActive ? 'rgba(212,185,122,0.7)' : 'rgba(212,185,122,0.3)');
      path.setAttribute('stroke-width', isActive ? 1.5 : 1);
      path.setAttribute('marker-end', 'url(#rm-arrowhead)');
      g.appendChild(path);

      arrowSvgEl.appendChild(g);
    });
  }

  function updateActive(winery) {
    activeWinery = winery;
    Object.entries(stateEls).forEach(function([key, el]) {
      const wk = STATE_TO_WINERY[key];
      el.setAttribute('fill', wk === winery ? FILL_ACTIVE : FILL_HIGHLIGHTED);
    });
    Object.entries(cardEls).forEach(function([key, el]) {
      el.classList.toggle('rm-card--active', key === winery);
    });
    drawArrows();
  }

  window.updatePortfolioMapActive = updateActive;

  async function render() {
    try {
      await loadScript('https://d3js.org/d3.v7.min.js');

      const geoData = await d3.json(
        'https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json'
      );

      document.getElementById('mapLoading')?.remove();

      const body = wrap.closest('.regions__body');
      if (body) {
        body.style.cssText += ';display:flex;align-items:center;position:relative';
        wrap.style.cssText += ';flex:0 0 58%;min-width:0';
      }

      const W = Math.max(wrap.clientWidth, 300);
      const H = Math.round(W * 0.6);

      const svg = d3.select(wrap)
        .append('svg')
        .attr('viewBox', '0 0 ' + W + ' ' + H)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', 'auto');
      mapSvgEl = wrap.querySelector('svg');

      const proj    = d3.geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], geoData);
      const pathGen = d3.geoPath().projection(proj);
      const g       = svg.append('g');

      g.selectAll('path')
        .data(geoData.features)
        .enter().append('path')
        .attr('d', pathGen)
        .attr('stroke', STROKE)
        .attr('stroke-width', 0.5)
        .each(function(d) {
          const key = normalizeKey(getStateName(d));
          const wk  = STATE_TO_WINERY[key];
          if (wk) {
            stateEls[key] = this;
            const c = pathGen.centroid(d);
            if (c && !isNaN(c[0])) centroids[key] = c;
          }
          let fill = FILL_DEFAULT;
          if (wk) {
            fill = wk === activeWinery ? FILL_ACTIVE : FILL_HIGHLIGHTED;
          } else if (SECONDARY_STATES.has(key)) {
            fill = FILL_SECONDARY;
          }
          this.setAttribute('fill', fill);
        });

      if (body) {
        function makeCard(key) {
          const d    = CARD_DATA[key];
          const card = document.createElement('div');
          card.className = 'rm-card' + (key === activeWinery ? ' rm-card--active' : '');
          card.dataset.winery = key;
          card.innerHTML =
            '<span class="rm-card__abbr">' + d.abbr + '</span>' +
            '<h4 class="rm-card__name">' + d.name + '</h4>' +
            '<p class="rm-card__sub">' + d.sub + '</p>' +
            '<div class="rm-card__stats">' + d.stats.map(function(s) { return '<span>' + s + '</span>'; }).join('') + '</div>';
          card.addEventListener('click', function() {
            const btn = document.querySelector('.winery-btn[data-winery="' + key + '"]');
            if (btn) {
              btn.click();
              document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
            }
          });
          cardEls[key] = card;
          return card;
        }

        const leftCardsWrap = document.createElement('div');
        leftCardsWrap.className = 'rm-cards rm-cards--left';
        leftCardsWrap.appendChild(makeCard('concierto'));
        body.insertBefore(leftCardsWrap, wrap);

        const rightCardsWrap = document.createElement('div');
        rightCardsWrap.className = 'rm-cards rm-cards--right';
        rightCardsWrap.appendChild(makeCard('cuna'));
        body.appendChild(rightCardsWrap);

        const ns2 = 'http://www.w3.org/2000/svg';
        arrowSvgEl = document.createElementNS(ns2, 'svg');
        arrowSvgEl.setAttribute('aria-hidden', 'true');
        arrowSvgEl.setAttribute('class', 'rm-arrow-overlay');
        arrowSvgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible';
        arrowSvgEl.innerHTML = '<defs><marker id="rm-arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polygon points="0 0, 7 3.5, 0 7" fill="rgba(212,185,122,0.7)"/></marker></defs>';
        body.appendChild(arrowSvgEl);

        const ro = new ResizeObserver(function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(drawArrows, 120);
        });
        ro.observe(body);
      }

      setTimeout(drawArrows, 80);

    } catch (err) {
      console.error('Mexico map error:', err);
      const loading = document.getElementById('mapLoading');
      if (loading) loading.innerHTML = '<p style="font-family:var(--font-ui);font-size:0.75rem;color:rgba(241,237,222,0.3);text-align:center;">Map unavailable</p>';
    }
  }

  const section = document.getElementById('regions');
  if (section) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { io.disconnect(); render(); }
    }, { threshold: 0.1 });
    io.observe(section);
  }
})();

/* ── Portfolio — Embedded Section ─────────────────────────── */
(function initPortfolio() {
  if (!document.getElementById('pfCarouselTrack')) return;

  const wineryMeta = {
    cuna: {
      label: 'Cuna de Tierra Collection',
      desc: "Every bottle carries the story of Guanajuato's high-altitude terroir — where volcanic soils, generous sun, and cool nights converge to produce wines of extraordinary character.",
      stats: [{ n:'16', t:'Wines' }, { n:'2,000m', t:'Elevation' }, { n:'40+', t:'Awards' }]
    },
    concierto: {
      label: 'Concierto Enológico Collection',
      desc: "From the sun-kissed soils of Valle de Guadalupe, Concierto Enológico harmonizes artisanal tradition with Baja California's singular terroir — expressive, elegant, and beautifully crafted.",
      stats: [{ n:'6', t:'Wines' }, { n:'12', t:'Awards' }, { n:'18mo', t:'Barrel Aged' }]
    }
  };

  const wines = [
    /* ════ CUNA DE TIERRA ════ */
    { id:'torre-blanco', winery:'cuna', collection:'Torre de Tierra', img:'torre-de-tierra-blanco.webp', name:'Torre de Tierra', sub:'Semillón', type:'white', typeLabel:'White Wine', grapes:'Semillón', region:'Dolores Hidalgo, Guanajuato', production:'2,500 bottles/year', winemaker:'Juan Manchón', sight:'Elegant pale straw color', nose:'Citrus notes, green apple, pear, epazote, and delicate hints of poblano pepper', palate:'Crisp acidity, very fresh, medium body', serving:'12°C (54°F)', pairing:'Ceviche, tuna tostadas, tiraditos, grilled langoustine, padrón peppers with olive oil and sea salt', vin:'Cold storage after harvest · Low-temperature fermentation to enhance aromas · Decanting in stainless steel tanks · Eco-friendly tangential filtration to preserve flavor', awards:[{m:'🥉',t:'Bronze Medal — Decanter World Wine Awards 2019'},{m:'⭐',t:'91 points — Guía Catadores 2022'}], top:'91 pts — Guía Catadores 2022' },
    { id:'viognier', winery:'cuna', collection:'Cuna de Tierra', img:'cuna-de-tierra-viognier.webp', name:'Viognier', sub:'Vino Blanco', type:'white', typeLabel:'White Wine', grapes:'Viognier', region:'Dolores Hidalgo, Guanajuato', production:'1,200 bottles/year', winemaker:'Juan Manchón', sight:'Pale golden color with greenish highlights', nose:'Very fresh notes of citrus and peach', palate:'Intense attack, with fresh mid-palate tones that invite another sip', serving:'12°C (54°F)', pairing:'Salads, ceviches, tiraditos, aguachiles, tuna sashimi, grilled fish, baked salmon', vin:'Cold storage after harvest · Low-temperature fermentation to enhance aromas · Decanting in stainless steel tanks', awards:[], top:null },
    { id:'torre-rojo', winery:'cuna', collection:'Torre de Tierra', img:'torre-de-tierra-tinto.webp', name:'Torre de Tierra', sub:'Tempranillo Blend', type:'red', typeLabel:'Red Wine', grapes:'Tempranillo, Cabernet Sauvignon, Petite Sirah', region:'Dolores Hidalgo, Guanajuato', production:'11,500 bottles/year', winemaker:'Juan Manchón', sight:'Plum red with medium intensity', nose:'Ripe red and black fruits, with notes of dark chocolate', palate:'Full-bodied, explosive attack, and vibrant acidity', serving:'18°C (64°F)', pairing:'Lean meats, grilled cuts, aged cheeses', vin:'Partial carbonic maceration of Tempranillo to boost freshness and aromatic intensity · Aged at least 3 months in second- and third-use barrels: French, Hungarian, and American oak', awards:[{m:'🥈',t:'Silver Medal — Decanter World Wine Awards 2023'},{m:'🥇',t:'Gold Medal — Les Citadelles du Vin, Bordeaux 2019'}], top:'Gold Medal — Les Citadelles du Vin, Bordeaux 2019' },
    { id:'syrah', winery:'cuna', collection:'Cuna de Tierra', img:'cuna-de-tierra-syrah.webp', name:'Syrah', sub:'Vino Tinto', type:'red', typeLabel:'Red Wine', grapes:'Syrah', region:'Dolores Hidalgo, Guanajuato', production:'5,350 bottles/year', winemaker:'Juan Manchón', sight:'Ruby red with garnet hues and high color intensity', nose:'Spicy notes with hints of cherry, blackberry, cinnamon, and dark chocolate', palate:'Broad attack with noticeable acidity. Silky, well-structured tannins and a long finish', serving:'16°C – 18°C (61–64°F)', pairing:'Lean meats, spiced dishes, aged cheeses, game meats', vin:'Cold pre-fermentation maceration to extract fine aromas · Aged 12 months in new and second-use barrels: French, Hungarian, and American oak', awards:[{m:'🏆',t:'Grand Gold Medal — Bacchus 2026'},{m:'⭐',t:'95 points — Guía Catadores 2023'},{m:'🥉',t:'Bronze Medal — Decanter World Wine Awards 2023'},{m:'⭐',t:'93 points — Guía Catadores 2022'}], top:'Grand Gold — Bacchus 2026 · 95 pts Guía Catadores' },
    { id:'nebbiolo', winery:'cuna', collection:'Cuna de Tierra', img:'cuna-de-tierra-nebiolo.webp', name:'Nebbiolo', sub:'Vino Tinto', type:'red', typeLabel:'Red Wine', grapes:'Nebbiolo, Cabernet Sauvignon', region:'Dolores Hidalgo, Guanajuato', production:'11,000 bottles/year', winemaker:'Juan Manchón', sight:'Deep ruby with violet highlights', nose:'Black tea, black pepper, dark fruits, chocolate, vanilla, and a Darjeeling finish', palate:'Intense attack, balanced acidity, blackcurrant-filled palate, elegant and persistent', serving:'16°C – 18°C (61–64°F)', pairing:'Venison, wild boar, game birds, spiced meats, risotto', vin:'Cold pre-fermentation maceration to extract fine aromas · Aged 12 months in new and second-use barrels: French, Hungarian, and American oak', awards:[{m:'🥇',t:'Gold Medal — Bacchus 2026'},{m:'🏆',t:'Grand Gold Medal — Les Citadelles du Vin, Bordeaux 2023'},{m:'🥇',t:'Gold Medal — Bacchus 2023'},{m:'⭐',t:'95 points — Guía Catadores 2022'}], top:'Grand Gold — Les Citadelles du Vin, Bordeaux 2023' },
    { id:'pago-de-vega', winery:'cuna', collection:'Cuna de Tierra', img:'pago-de-vega.webp', name:'Pago de Vega', sub:'Bordeaux Blend', type:'red', typeLabel:'Red Wine', grapes:'Cabernet Sauvignon, Cabernet Franc, Merlot', region:'Dolores Hidalgo, Guanajuato', production:'5,200 bottles/year', winemaker:'Juan Manchón', sight:'Medium-layer plum red', nose:'Ripe red fruits, blackcurrant, white pepper, undergrowth, moss, truffle', palate:'Fine and persistent attack, fresh acidity, broad on the palate', serving:'18°C (64°F)', pairing:'Lean meats, grilled cuts, aged cheeses', vin:'Selection of finest vineyards — soils contribute an elegant mineral character · Cold pre-fermentation maceration · Aged 12 months in new French oak barrels', awards:[{m:'⭐',t:'96 points — Guía Catadores 2023'},{m:'⭐',t:'97 points — Guía Catadores 2022'},{m:'🥇',t:'Gold Medal — Concours Mondial de Bruxelles 2022'},{m:'🥇',t:'Gold Medal — Les Citadelles du Vin, Bordeaux 2019'}], top:'97 pts Guía Catadores · Gold CMB 2022' },
    /* ════ CONCIERTO ENOLÓGICO ════ */
    { id:'allegro', winery:'concierto', collection:'Concierto Enológico', img:'allegro_2022.webp', name:'Allegro', sub:'2022', type:'white', typeLabel:'White Wine', grapes:'Chardonnay, Sauvignon Blanc', region:'Valle de Guadalupe, Baja California', alcohol:'13.4%', aging:'3 months in French oak barrels', sight:'Medium intensity, yellow straw with gold flashes', nose:'Notes of honey, pineapple, dried fruits, peppers, guava, lemon, white flowers, and lemongrass', palate:'Medium acidity with a refreshing taste; persistent, well-balanced finish', serving:'10°C – 12°C (50–54°F)', pairing:'Fresh ceviche, grilled fish, shrimp tacos, tropical fruit salads, soft cheeses', vin:'3 months aging in French oak barrels · Cold low-temperature fermentation to preserve aromatic freshness · Careful selection of Chardonnay and Sauvignon Blanc from Valle de Guadalupe', awards:[{m:'🥇',t:'Gold — XXII International Competition of Bacchus Wines 2024'},{m:'⭐',t:'87 points — Peñín Guide 2021'}], top:'Gold — Bacchus Wines 2024' },
    { id:'vivacce', winery:'concierto', collection:'Concierto Enológico', img:'vivacce_2022.webp', name:'Vivacce', sub:'2022', type:'rose', typeLabel:'Rosé Wine', grapes:'100% Grenache', region:'Valle de Guadalupe, Baja California', alcohol:'12.9%', aging:null, sight:'Pale salmon with golden flashes', nose:'Very aromatic — notes of peach, strawberry, rose petals, and a touch of grapefruit skin', palate:'Medium acidity, subtle and elegant, with persistent fruity notes', serving:'10°C – 12°C (50–54°F)', pairing:'Charcuterie boards, grilled salmon, summer salads, caprese, light tapas', vin:'Direct press of 100% Grenache · Cold low-temperature fermentation to preserve aromatic freshness · Gentle handling to achieve the signature pale salmon hue', awards:[{m:'🥇',t:'Gold — México Selection by CMB / Concours Mondial de Bruxelles 2023 Yucatán'},{m:'🥇',t:'Gold — México International Wine Competition 2023'},{m:'⭐',t:'86 points — Peñín Guide 2022'},{m:'🏅',t:'México International Wine Competition 2024'}], top:'Double Gold — CMB Yucatán & México International Wine Competition 2023' },
    { id:'obertura', winery:'concierto', collection:'Concierto Enológico', img:'obertura_2022.webp', name:'Obertura', sub:'2022', type:'red', typeLabel:'Red Wine', grapes:'Cabernet Sauvignon, Merlot', region:'Valle de Guadalupe, Baja California', alcohol:'12.9%', aging:null, sight:'Medium intensity ruby red', nose:'Scents of dried red fruits, cooked hibiscus, with a slight lactic note', palate:'Smooth texture, fresh on the palate with young tannins, balanced acidity and alcohol, ending with a fruity finish', serving:'16°C – 18°C (61–64°F)', pairing:'Grilled chicken, mushroom risotto, light pasta dishes, tapas, charcuterie boards', vin:'Harvest from Valle de Guadalupe · Fermentation in temperature-controlled stainless steel tanks · Gentle extraction to preserve fresh red fruit character', awards:[{m:'🥇',t:'Gold — México Selection by CMB / Concours Mondial de Bruxelles 2023 Yucatán'},{m:'🥇',t:'Gold — México International Wine Competition 2023'},{m:'⭐',t:'90 points — Peñín Guide 2022'}], top:'90 pts — Peñín Guide 2022 · Gold — México International Wine Competition 2023' },
    { id:'pauta', winery:'concierto', collection:'Concierto Enológico', img:'pauta_2022.webp', name:'Pauta', sub:'2022', type:'red', typeLabel:'Red Wine', grapes:'Cabernet Sauvignon, Merlot, Tempranillo, Barbera, Grenache', region:'Valle de Guadalupe, Baja California', alcohol:'13.9%', aging:'6 months in French oak barrels', sight:'Deep violet with ruby flashes', nose:'Notes of pomegranate, dark fruits, licorice, vanilla, clove, and a slight mineral quality', palate:'Medium body, medium acidity, young tannins, and a persistent finish', serving:'16°C – 18°C (61–64°F)', pairing:'Slow-braised meats, lamb chops, aged manchego, beef tenderloin, charcuterie', vin:'Five-varietal coupage: Cabernet Sauvignon, Merlot, Tempranillo, Barbera & Grenache · 6 months aging in French oak barrels · Careful selection for aromatic complexity and structure', awards:[{m:'🥇',t:'Gold — México International Wine Competition'},{m:'⭐',t:'89 points — Peñín Guide 2021'}], top:'89 pts — Peñín Guide 2021 · Gold — México International Wine Competition' },
    { id:'forza', winery:'concierto', collection:'Concierto Enológico', img:'forza_2021.webp', name:'Forza', sub:'2021', type:'red', typeLabel:'Red Wine', grapes:'Cabernet Sauvignon, Merlot, Barbera', region:'Valle de Guadalupe, Baja California', alcohol:'13.9%', aging:'12 months in French oak barrels', sight:'Medium intensity garnet red with a brick-colored rim', nose:'Notes of dark compote fruits, tobacco, ash, slight menthol, and leather', palate:'Polished tannins, medium acidity, long finish, and extremely enjoyable on the palate', serving:'16°C – 18°C (61–64°F)', pairing:'Venison, duck confit, beef short ribs, aged hard cheeses, truffle dishes', vin:'Careful selection of Cabernet Sauvignon, Merlot & Barbera · 12 months aging in French oak barrels · Extended maceration for depth of color and tannin refinement', awards:[{m:'🥈',t:'Silver Medal — Concours Mondial de Bruxelles 2024'}], top:'Silver — Concours Mondial de Bruxelles 2024' },
    { id:'concierto-wine', winery:'concierto', collection:'Concierto Enológico', img:'concierto_2020.webp', name:'Concierto', sub:'2020', type:'red', typeLabel:'Red Wine', grapes:'Cabernet Sauvignon, Merlot, Nebbiolo', region:'Valle de Guadalupe, Baja California', alcohol:'13.9%', aging:'18 months in French oak barrels', sight:'Garnet red with brick flashes', nose:'Very expressive aromas of matured dark fruits — fig, date, truffle, and mocha', palate:'Medium bodied, well rounded, and elegant. Polished tannins and a long, distinguished finish', serving:'16°C – 18°C (61–64°F)', pairing:'Wagyu beef, rack of lamb, game birds, fine aged cheeses, risotto nero', vin:"Flagship blend of Cabernet Sauvignon, Merlot & Nebbiolo · 18 months aging in French oak barrels · The winery's finest expression — harmonizing Baja California's terroir with Italian grape character", awards:[], top:null }
  ];

  const wineryFolder = {
    cuna: 'assets/cuna-de-tierra',
    concierto: 'assets/concierto-enologico'
  };

  let currentWinery = 'cuna';
  let currentType   = 'all';

  /* ── Carousel state ── */
  const CGAP = 28;
  let cList = [], cIdx = 0, cTimer = null, cPaused = false;

  function cVisible() { return window.innerWidth < 580 ? 1 : window.innerWidth < 960 ? 2 : 3; }
  function cCardW()   { const vp = document.getElementById('pfCarouselViewport'); return vp ? (vp.offsetWidth - (cVisible()-1)*CGAP) / cVisible() : 360; }
  function cMaxIdx()  { return Math.max(0, cList.length - cVisible()); }

  function cGoTo(idx, animate=true) {
    const max = cMaxIdx();
    if (idx < 0) idx = max;
    else if (idx > max) idx = 0;
    cIdx = idx;
    const track = document.getElementById('pfCarouselTrack');
    if (track) {
      track.style.transition = animate ? 'transform .55s cubic-bezier(.25,.46,.45,.94)' : 'none';
      track.style.transform  = `translateX(-${cIdx * (cCardW() + CGAP)}px)`;
    }
    cUpdateNav();
  }

  function cUpdateNav() {
    const prev   = document.getElementById('pfCarouselPrev');
    const next   = document.getElementById('pfCarouselNext');
    const dotsEl = document.getElementById('pfCarouselDots');
    if (prev) prev.disabled = false;
    if (next) next.disabled = false;
    if (!dotsEl) return;
    const steps = cMaxIdx() + 1;
    if (steps <= 7) {
      if (+dotsEl.dataset.count !== steps) {
        dotsEl.dataset.count = steps;
        dotsEl.innerHTML = '';
        for (let i = 0; i < steps; i++) {
          const d = document.createElement('button');
          d.className = 'carousel-dot';
          d.setAttribute('aria-label', `Go to position ${i + 1}`);
          d.addEventListener('click', () => { cGoTo(i); cResetTimer(); });
          dotsEl.appendChild(d);
        }
      }
      dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === cIdx));
    } else {
      dotsEl.innerHTML = `<span class="carousel-counter">${cIdx + 1} / ${steps}</span>`;
    }
  }

  function cResetTimer() {
    clearInterval(cTimer);
    cTimer = setInterval(() => { if (!cPaused) cGoTo(cIdx >= cMaxIdx() ? 0 : cIdx + 1); }, 3500);
  }

  function cResize() {
    const wrap = document.getElementById('pfCarouselWrap');
    if (wrap) wrap.style.setProperty('--card-w', cCardW() + 'px');
    cGoTo(Math.min(cIdx, cMaxIdx()), false);
  }

  function renderCards(winery, type) {
    const track = document.getElementById('pfCarouselTrack');
    if (!track) return;
    track.innerHTML = '';
    cList = wines.filter(w => w.winery === winery && (type === 'all' || w.type === type));

    cList.forEach(w => {
      const card = document.createElement('article');
      card.className = 'wine-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View details for ${w.name}`);
      const footLeft = w.production
        ? `<span class="card-production">${w.production}</span>`
        : w.alcohol ? `<span class="card-production">${w.alcohol} Alc.</span>` : '';
      card.innerHTML = `
        ${w.img ? `
        <div class="card-bottle">
          <img src="${wineryFolder[w.winery]}/${w.img}" alt="${w.name}" loading="lazy">
          <div class="card-bottle__label">
            <span class="card-badge">${w.typeLabel}</span>
            <div class="card-winery">${w.collection}</div>
            <h3 class="card-name">${w.name}</h3>
            ${w.sub ? `<div class="card-sub">${w.sub}</div>` : ''}
          </div>
        </div>` : `
        <div class="card-head card-head--${w.type}">
          <span class="card-badge">${w.typeLabel}</span>
          <div class="card-winery">${w.collection}</div>
          <h3 class="card-name">${w.name}</h3>
          ${w.sub ? `<div class="card-sub">${w.sub}</div>` : ''}
        </div>`}
        <div class="card-body">
          <div class="card-grapes">${w.grapes}</div>
          <div class="card-region">
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style="flex-shrink:0"><path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 5 3.5 1.5 1.5 0 0 1 5 6.5z" fill="#797853"/></svg>
            ${w.region}
          </div>
          ${w.top ? `<hr class="card-divider"><div class="card-award"><span>🏅</span><span>${w.top}</span></div>` : ''}
        </div>
        <div class="card-foot">
          ${footLeft}
          <span class="card-explore">Explore <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M9 1l4 4-4 4M1 5h12" stroke="#454411" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </div>`;
      card.addEventListener('click', () => openModal(w.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(w.id); });
      track.appendChild(card);
    });

    cIdx = 0;
    cResize();
    cUpdateNav();
    cResetTimer();
  }

  function updateHero(key) {
    if (window.updatePortfolioMapActive) window.updatePortfolioMapActive(key);
  }

  function updateFilters(key) {
    const types = new Set(wines.filter(w => w.winery === key).map(w => w.type));
    document.querySelectorAll('.pf-filters .filter-btn[data-filter]').forEach(btn => {
      if (btn.dataset.filter !== 'all') btn.hidden = !types.has(btn.dataset.filter);
    });
    document.querySelectorAll('.pf-filters .filter-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === 'all'));
    currentType = 'all';
  }

  function switchWinery(key) {
    currentWinery = key;
    document.querySelectorAll('.winery-btn').forEach(b => b.classList.toggle('active', b.dataset.winery === key));
    const pfBg = document.querySelector('#portfolio .pf-intro-bg');
    if (pfBg) {
      pfBg.querySelector('.hero-bg-layer--cuna').style.opacity      = key === 'cuna'      ? '1' : '0';
      pfBg.querySelector('.hero-bg-layer--concierto').style.opacity = key === 'concierto' ? '1' : '0';
    }
    updateHero(key);
    updateFilters(key);
    renderCards(key, 'all');
  }

  function openModal(id) {
    const w = wines.find(x => x.id === id);
    if (!w) return;
    const vinSteps = w.vin.split('·').map(s => s.trim()).filter(Boolean);
    const awardsHTML = w.awards.length
      ? w.awards.map(a => `<div class="award-row"><span>${a.m}</span><span>${a.t}</span></div>`).join('')
      : '<p style="color:#797853;font-size:.82rem">No international awards recorded yet.</p>';
    const factsHTML = [
      `<div class="m-fact"><span class="m-fact-lbl">Grapes</span><span class="m-fact-val">${w.grapes}</span></div>`,
      `<div class="m-fact"><span class="m-fact-lbl">Region</span><span class="m-fact-val">${w.region}</span></div>`,
      w.alcohol    ? `<div class="m-fact"><span class="m-fact-lbl">Alcohol</span><span class="m-fact-val">${w.alcohol}</span></div>` : '',
      w.aging      ? `<div class="m-fact"><span class="m-fact-lbl">Aging</span><span class="m-fact-val">${w.aging}</span></div>` : '',
      w.winemaker  ? `<div class="m-fact"><span class="m-fact-lbl">Winemaker</span><span class="m-fact-val">${w.winemaker}</span></div>` : '',
      w.production ? `<div class="m-fact"><span class="m-fact-lbl">Production</span><span class="m-fact-val">${w.production}</span></div>` : '',
    ].filter(Boolean).join('');

    document.getElementById('pfModal').innerHTML = `
      ${w.img ? `
      <div class="m-hero">
        <div class="m-img"><img src="${wineryFolder[w.winery]}/${w.img}" alt="${w.name}"></div>
        <div class="m-info">
          <button class="m-close" id="pfMClose" aria-label="Close">✕</button>
          <div class="m-meta"><span class="m-pill m-pill--${w.type}">${w.typeLabel}</span><span class="m-winery">${w.collection}</span></div>
          <h2 class="m-name">${w.name}</h2>
          ${w.sub ? `<div class="m-subtitle">${w.sub}</div>` : ''}
          <div class="m-facts">${factsHTML}</div>
        </div>
      </div>` : `
      <div class="m-head">
        <button class="m-close" id="pfMClose" aria-label="Close">✕</button>
        <div class="m-meta"><span class="m-pill m-pill--${w.type}">${w.typeLabel}</span><span class="m-winery">${w.collection}</span></div>
        <h2 class="m-name">${w.name}</h2>
        ${w.sub ? `<div class="m-subtitle">${w.sub}</div>` : ''}
      </div>
      <div class="m-facts">${factsHTML}</div>`}
      <div class="m-tasting">
        <div class="m-section-lbl">Tasting Notes</div>
        <div class="taste-grid">
          <div class="taste-item"><div class="taste-disc">👁</div><div class="taste-title">Sight</div><div class="taste-text">${w.sight}</div></div>
          <div class="taste-item"><div class="taste-disc">🌿</div><div class="taste-title">Nose</div><div class="taste-text">${w.nose}</div></div>
          <div class="taste-item"><div class="taste-disc">✨</div><div class="taste-title">Palate</div><div class="taste-text">${w.palate}</div></div>
        </div>
      </div>
      <div class="m-section"><hr><h4>Vinification &amp; Aging</h4><ul>${vinSteps.map(s => `<li>${s}</li>`).join('')}</ul></div>
      <div class="m-section"><hr><h4>Awards &amp; Recognition</h4>${awardsHTML}</div>
      <div class="m-section"><hr><div class="details-grid"><div><h4>Food Pairing</h4><p>${w.pairing}</p></div><div><h4>Serving Temperature</h4><p>${w.serving}</p></div></div></div>
      <div style="height:1.5rem"></div>`;

    const bg = document.getElementById('pfModalBg');
    bg.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('pfMClose').addEventListener('click', closeModal);
  }

  function closeModal() {
    document.getElementById('pfModalBg').classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('pfModalBg').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.winery-btn').forEach(btn =>
    btn.addEventListener('click', () => switchWinery(btn.dataset.winery)));

  document.querySelectorAll('.pf-filters .filter-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      currentType = btn.dataset.filter;
      document.querySelectorAll('.pf-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards(currentWinery, currentType);
    }));

  renderCards('cuna', 'all');
  updateFilters('cuna');

  /* ── Carousel events ── */
  document.getElementById('pfCarouselPrev').addEventListener('click', () => { cGoTo(cIdx - 1); cResetTimer(); });
  document.getElementById('pfCarouselNext').addEventListener('click', () => { cGoTo(cIdx + 1); cResetTimer(); });
  document.getElementById('pfCarouselViewport').addEventListener('mouseenter', () => { cPaused = true; });
  document.getElementById('pfCarouselViewport').addEventListener('mouseleave', () => { cPaused = false; });
  let pfResizeT;
  window.addEventListener('resize', () => { clearTimeout(pfResizeT); pfResizeT = setTimeout(cResize, 100); });
})();


/* ── Portfolio Region Map (arrows from states → winery cards) ── */

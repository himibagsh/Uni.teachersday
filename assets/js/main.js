/* Багшийн баярын хуудас.
   Бичлэг бэлэн болоход зөвхөн энэ файлыг засна. */

'use strict';

var CONFIG = {

  /* Нээлтийн болзоот цаг. Тодорхой өдөр амлаагүй бол null байлгана:
     тоолуур харагдахгүй, зүгээр л «бэлэн болмогц» гэж бичигдэнэ.
     Огноо тавих бол: '2026-10-12T12:00:00' маягаар. */
  premiere: null,

  /* Эвлүүлэг дуусмагц үүнийг true болгоод videoSrc-г бөглөнө.
     Ингэснээр хүрээ плеерээр солигдож, тоолуур зогсоно. */
  videoReady: false,

  /* Эсвэл assets/video/ дотор хийсэн файл:
       videoSrc: 'assets/video/beltgel.mp4'
     эсвэл YouTube, Vimeo-гийн embed хаяг:
       videoSrc: 'https://www.youtube.com/embed/VIDEO_ID'          */
  videoSrc: '',

  /* Өөрийн файл тавьсан бол нүүр зураг. */
  videoPoster: '',

  /* Бэлтгэлийн явц: 'done', 'active', 'pending'. */
  stages: [
    { label: 'Зураг авалт', state: 'done'    },
    { label: 'Эвлүүлэг',    state: 'active'  },
    { label: 'Дуу, өнгө',   state: 'pending' }
  ]
};

(function () {

  var stage = document.getElementById('stage');
  var statusList = document.getElementById('status');
  var countdown = document.getElementById('countdown');
  var slateLine = document.getElementById('slate-line');
  var slateKicker = document.getElementById('slate-kicker');

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- бэлтгэлийн явц ---- */

  function drawStages() {
    if (!statusList || !CONFIG.stages || !CONFIG.stages.length) return;
    statusList.textContent = '';
    CONFIG.stages.forEach(function (s) {
      var li = document.createElement('li');
      li.setAttribute('data-state', s.state || 'pending');
      li.textContent = s.label;
      statusList.appendChild(li);
    });
  }

  /* ---- бичлэг бэлэн болоход ---- */

  function buildPlayer(src, poster) {
    if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(src)) {
      var video = document.createElement('video');
      video.className = 'player';
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      if (poster) video.poster = poster;
      video.src = src;
      return video;
    }
    var frame = document.createElement('iframe');
    frame.className = 'player';
    frame.src = src;
    frame.title = 'Бидний бэлтгэл';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    return frame;
  }

  function mountPlayer() {
    if (!stage || !CONFIG.videoReady || !CONFIG.videoSrc) return false;
    stage.textContent = '';
    stage.appendChild(buildPlayer(CONFIG.videoSrc, CONFIG.videoPoster));
    return true;
  }

  /* ---- нээлт хүртэлх тоолуур ---- */

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function put(unit, value) {
    var cell = countdown.querySelector('[data-unit="' + unit + '"]');
    if (!cell || cell.textContent === value) return;
    cell.textContent = value;
    if (calm) return;
    cell.classList.remove('tick');
    void cell.offsetWidth;          /* дахин эхлүүлэхийн тулд */
    cell.classList.add('tick');
  }

  /* Огноогүй, эсвэл товлосон цаг өнгөрсөн ч бичлэг бэлэн болоогүй үед.
     Өнгөрсөн огноо руу тоолуур харуулахгүй. */
  function waiting() {
    if (countdown) countdown.hidden = true;
    if (slateLine) slateLine.textContent = 'Бичлэг бэлэн болмогц энд тавигдана';
    if (slateKicker) slateKicker.textContent = 'Бичлэг · бэлтгэгдэж байна';
  }

  function startCountdown() {
    if (!countdown) return;

    if (!CONFIG.premiere) {       /* огноо амлаагүй */
      waiting();
      return;
    }

    var target = new Date(CONFIG.premiere).getTime();
    if (isNaN(target) || target <= Date.now()) {
      waiting();
      return;
    }

    function tick() {
      var left = target - Date.now();
      if (left <= 0) {
        waiting();
        return false;
      }
      var seconds = Math.floor(left / 1000);
      put('days', String(Math.floor(seconds / 86400)));
      put('hours', pad(Math.floor(seconds / 3600) % 24));
      put('minutes', pad(Math.floor(seconds / 60) % 60));
      put('seconds', pad(seconds % 60));
      return true;
    }

    if (tick()) {
      var timer = setInterval(function () {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }
  }

  /* ---- сэжүүрийн тайлал ----
     Нүд бүр дангаараа эргэнэ. Арван нүд бүгд эргэмэгц мэндчилгээ гарч ирнэ. */

  function wireReveal() {
    var button = document.getElementById('reveal');
    var greeting = document.getElementById('greeting');
    var tiles = [].slice.call(document.querySelectorAll('.tile'));
    if (!button || !greeting || !tiles.length) return;

    var pending = null;

    function flipped() {
      return tiles.filter(function (t) { return t.classList.contains('is-flipped'); }).length;
    }

    function sync(justOpenedAll) {
      var n = flipped();
      var all = n === tiles.length;

      button.setAttribute('aria-expanded', all ? 'true' : 'false');
      button.textContent = all ? 'Хариуг нуух' : 'Хариуг харах';

      if (pending) { clearTimeout(pending); pending = null; }

      if (!all) {
        greeting.hidden = true;
        return;
      }
      /* бүх хавтас эргэж дуусахыг хүлээнэ */
      var wait = calm ? 0 : (justOpenedAll ? 1150 : 420);
      if (wait === 0) {
        greeting.hidden = false;
      } else {
        pending = setTimeout(function () { greeting.hidden = false; pending = null; }, wait);
      }
    }

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        var on = !tile.classList.contains('is-flipped');
        tile.classList.toggle('is-flipped', on);
        tile.setAttribute('aria-pressed', on ? 'true' : 'false');
        /* дангаар дарахад дараалсан саатал хэрэггүй */
        tile.style.setProperty('--i', '0');
        sync(false);
      });
    });

    button.addEventListener('click', function () {
      var open = flipped() !== tiles.length;
      tiles.forEach(function (tile, i) {
        tile.style.setProperty('--i', open ? String(i) : '0');
        tile.classList.toggle('is-flipped', open);
        tile.setAttribute('aria-pressed', open ? 'true' : 'false');
      });
      sync(open);
    });
  }

  /* ---- эхлэл ---- */

  /* ---- гарчгийн үсэг бүрийг тусад нь ---- */

  function splitLetters() {
    var el = document.querySelector('[data-letters]');
    if (!el || calm) return;
    var text = el.textContent;
    el.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.style.setProperty('--l', String(i));
      span.textContent = text.charAt(i);
      el.appendChild(span);
    }
  }

  /* ---- нэрсийн нүд ээлжлэн ---- */

  function orderPeople() {
    var groups = document.querySelectorAll('.roster__group');
    for (var g = 0; g < groups.length; g++) {
      var people = groups[g].querySelectorAll('.person');
      for (var i = 0; i < people.length; i++) {
        people[i].style.setProperty('--k', String(i));
      }
    }
  }

  drawStages();
  if (!mountPlayer()) startCountdown();
  wireReveal();
  splitLetters();
  orderPeople();

}());

/* ===================================================================
   Хөдөлгөөнт дэвсгэр: бензолын цагираг хөвж, атомууд хоорондоо түр
   холбоо үүсгэнэ. Хуруу эсвэл хулгана ойртоход атомууд зайлна.
   =================================================================== */

(function () {

  var canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, dpr = 1;
  var rings = [], atoms = [], raf = null, running = false;
  var pointer = { x: -1e4, y: -1e4, live: false };

  var BOND = 128;          /* холбоо татах зай */
  var RING_R = 26;         /* цагирагийн радиус */

  function palette() {
    var s = getComputedStyle(document.documentElement);
    return {
      line: (s.getPropertyValue('--ink') || '#1b2240').trim(),
      hot:  (s.getPropertyValue('--copper') || '#b35228').trim()
    };
  }
  var col = palette();

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    var area = W * H;
    var nRings = Math.max(3, Math.min(9, Math.round(area / 210000)));
    var nAtoms = Math.max(10, Math.min(34, Math.round(area / 46000)));

    rings = [];
    for (var i = 0; i < nRings; i++) {
      rings.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.11, 0.11), vy: rand(-0.11, 0.11),
        a: rand(0, Math.PI * 2), va: rand(-0.0022, 0.0022),
        r: RING_R * rand(0.8, 1.35),
        hot: Math.random() < 0.3
      });
    }
    atoms = [];
    for (var j = 0; j < nAtoms; j++) {
      atoms.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.16, 0.16), vy: rand(-0.16, 0.16),
        r: rand(1.6, 3.1),
        hot: Math.random() < 0.18
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    col = palette();
    build();
  }

  /* Цагирагийн 6 оройг эргэлтийн өнцгөөр нь тооцно */
  function ringPoints(r) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var t = r.a + i * Math.PI / 3;
      pts.push([r.x + Math.cos(t) * r.r, r.y + Math.sin(t) * r.r]);
    }
    return pts;
  }

  function drawRing(r) {
    var pts = ringPoints(r);
    var stroke = r.hot ? col.hot : col.line;

    ctx.strokeStyle = stroke;
    ctx.globalAlpha = r.hot ? 0.3 : 0.22;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var p = pts[i];
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
    ctx.stroke();

    /* давхар холбоо: бензолын ээлжилсэн холбоог дотогш зурна */
    ctx.globalAlpha = r.hot ? 0.24 : 0.17;
    ctx.beginPath();
    for (var k = 0; k < 6; k += 2) {
      var a = pts[k], b = pts[(k + 1) % 6];
      var mx = (a[0] + b[0]) / 2 - r.x, my = (a[1] + b[1]) / 2 - r.y;
      var len = Math.sqrt(mx * mx + my * my) || 1;
      var ox = (mx / len) * 4.4, oy = (my / len) * 4.4;
      ctx.moveTo(a[0] - ox, a[1] - oy);
      ctx.lineTo(b[0] - ox, b[1] - oy);
    }
    ctx.stroke();

    ctx.globalAlpha = r.hot ? 0.42 : 0.3;
    ctx.fillStyle = stroke;
    for (var m = 0; m < 6; m++) {
      ctx.beginPath();
      ctx.arc(pts[m][0], pts[m][1], 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    var i, a;

    for (i = 0; i < rings.length; i++) {
      var r = rings[i];
      r.x += r.vx; r.y += r.vy; r.a += r.va;
      var pad = r.r + 10;
      if (r.x < -pad) r.x = W + pad; else if (r.x > W + pad) r.x = -pad;
      if (r.y < -pad) r.y = H + pad; else if (r.y > H + pad) r.y = -pad;
    }

    for (i = 0; i < atoms.length; i++) {
      a = atoms[i];
      a.x += a.vx; a.y += a.vy;

      if (pointer.live) {
        var dx = a.x - pointer.x, dy = a.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 19000 && d2 > 0.5) {
          var f = (1 - d2 / 19000) * 0.5;
          var d = Math.sqrt(d2);
          a.vx += (dx / d) * f;
          a.vy += (dy / d) * f;
        }
      }
      /* хурдыг барих */
      a.vx *= 0.986; a.vy *= 0.986;
      var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (sp < 0.05) { a.vx += rand(-0.02, 0.02); a.vy += rand(-0.02, 0.02); }
      if (sp > 1.5) { a.vx *= 0.9; a.vy *= 0.9; }

      if (a.x < -12) a.x = W + 12; else if (a.x > W + 12) a.x = -12;
      if (a.y < -12) a.y = H + 12; else if (a.y > H + 12) a.y = -12;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* чөлөөт атомуудын хооронд түр үүсэх холбоо */
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = col.line;
    for (var i = 0; i < atoms.length; i++) {
      for (var j = i + 1; j < atoms.length; j++) {
        var dx = atoms[i].x - atoms[j].x, dy = atoms[i].y - atoms[j].y;
        var d2 = dx * dx + dy * dy;
        if (d2 > BOND * BOND) continue;
        ctx.globalAlpha = (1 - Math.sqrt(d2) / BOND) * 0.16;
        ctx.beginPath();
        ctx.moveTo(atoms[i].x, atoms[i].y);
        ctx.lineTo(atoms[j].x, atoms[j].y);
        ctx.stroke();
      }
    }

    for (var k = 0; k < atoms.length; k++) {
      var a = atoms[k];
      ctx.globalAlpha = a.hot ? 0.5 : 0.34;
      ctx.strokeStyle = a.hot ? col.hot : col.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (var m = 0; m < rings.length; m++) drawRing(rings[m]);
    ctx.globalAlpha = 1;
  }

  function frame() {
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || calm) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); draw(); }, 180);
  });

  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.live = true;
  }, { passive: true });

  window.addEventListener('pointerleave', function () { pointer.live = false; }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  /* өнгөний горим солигдвол будгаа шинэчилнэ */
  if (window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (scheme.addEventListener) {
      scheme.addEventListener('change', function () { col = palette(); });
    }
  }

  resize();
  draw();          /* нэг кадрыг шууд зурж, хуудас ачаалахад хоосон харагдахгүй */
  start();
}());


/* ===================================================================
   Үелэх хүснэгт: хуруу, хулганы байрлалаар гэрэлтэнэ. Хөдөлгөөнгүй
   үед өөрөө намуухан эргэлдэнэ.
   =================================================================== */

(function () {

  var hero = document.getElementById('hero');
  var table = hero && hero.querySelector('.hero__table');
  if (!table) return;

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tx = 50, ty = 42, idle = true, t = 0, raf = null;

  function put(x, y) {
    table.style.setProperty('--mx', x.toFixed(2) + '%');
    table.style.setProperty('--my', y.toFixed(2) + '%');
  }

  function drift() {
    t += 0.0042;
    if (idle) put(50 + Math.cos(t) * 31, 44 + Math.sin(t * 1.3) * 25);
    raf = requestAnimationFrame(drift);
  }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    idle = false;
    put(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  }, { passive: true });

  hero.addEventListener('pointerleave', function () { idle = true; }, { passive: true });

  put(tx, ty);
  if (!calm) raf = requestAnimationFrame(drift);

  /* гүйлгэхэд хүснэгт намуухан хоцорч хөдөлнө */
  if (!calm && 'IntersectionObserver' in window) {
    var visible = true;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    window.addEventListener('scroll', function () {
      if (!visible) return;
      var y = window.scrollY || window.pageYOffset;
      table.style.setProperty('--shift', (y * 0.14).toFixed(1) + 'px');
    }, { passive: true });
  }
}());


/* ===================================================================
   Уншсан хэмжээг заах зураас, бүлгүүдийг гүйлгэхэд гаргах
   =================================================================== */

(function () {

  var bar = document.getElementById('progress');
  if (bar) {
    var fill = bar.firstElementChild;
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(1, (window.scrollY || window.pageYOffset) / h) : 0;
        fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        tick = false;
      });
    }, { passive: true });
  }

  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  for (var j = 0; j < items.length; j++) io.observe(items[j]);
}());

/* ===================================================================
   Багшийн зураг дээр дарахад түүнд бичсэн захидлууд нээгдэнэ.
   Өгөгдөл assets/data/letters.js дотор.
   =================================================================== */

(function () {

  var dialog = document.getElementById('letters');
  var buttons = [].slice.call(document.querySelectorAll('.person__btn'));
  if (!dialog || !buttons.length) return;

  var DATA = (window.LETTERS && typeof window.LETTERS === 'object') ? window.LETTERS : {};
  var BOX = (DATA.letters && typeof DATA.letters === 'object') ? DATA.letters : {};

  var photo = document.getElementById('letters-photo');
  var nameEl = document.getElementById('letters-name');
  var roleEl = document.getElementById('letters-role');
  var body = document.getElementById('letters-body');
  var opener = null;

  /* Захидал үлдээх урилга: маягтын хаяг байвал л харуулна */
  var cta = document.getElementById('roster-cta');
  var ctaLink = document.getElementById('letter-form');
  if (cta && ctaLink && DATA.form) {
    ctaLink.href = DATA.form;
    cta.hidden = false;
  }

  /* Хэдэн захидалтайг нь зураган дээр нь тэмдэглэнэ */
  buttons.forEach(function (b) {
    var list = BOX[b.getAttribute('data-slug')];
    var n = (list && list.length) || 0;
    b.setAttribute('data-count', String(n));
    if (!n) return;
    var cell = b.querySelector('.person__cell');
    if (!cell) return;
    var badge = document.createElement('span');
    badge.className = 'person__badge';
    badge.textContent = String(n);
    badge.setAttribute('aria-hidden', 'true');
    cell.appendChild(badge);
    b.setAttribute('aria-label', b.getAttribute('data-name') + ' · ' + n + ' захидал');
  });

  function text(tag, cls, value) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value) el.textContent = value;
    return el;
  }

  function fill(btn) {
    var slug = btn.getAttribute('data-slug');
    var list = BOX[slug] || [];

    photo.src = btn.getAttribute('data-photo') || '';
    photo.alt = btn.getAttribute('data-name') || '';
    nameEl.textContent = btn.getAttribute('data-name') || '';
    roleEl.textContent = btn.getAttribute('data-role') || '';

    body.textContent = '';

    if (!list.length) {
      var empty = text('div', 'letters__empty');
      empty.appendChild(text('p', 'letters__empty-line',
        'Одоогоор захидал алга байна.'));
      if (DATA.form) {
        var a = document.createElement('a');
        a.className = 'letters__write';
        a.href = DATA.form;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Хамгийн түрүүнд бичих';
        empty.appendChild(a);
      }
      body.appendChild(empty);
      return;
    }

    var count = text('p', 'letters__count', list.length + ' захидал');
    body.appendChild(count);

    list.forEach(function (item) {
      var fig = document.createElement('figure');
      fig.className = 'letter';
      fig.appendChild(text('blockquote', 'letter__text', item.text || ''));
      if (item.from || item.note) {
        var cap = text('figcaption', 'letter__from');
        cap.textContent = '— ' + [item.from, item.note].filter(Boolean).join(' · ');
        fig.appendChild(cap);
      }
      body.appendChild(fig);
    });
  }

  function open(btn) {
    opener = btn;
    fill(btn);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    body.scrollTop = 0;
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { open(b); });
  });

  /* Гадна талд дарахад хаана */
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    if (opener) { opener.focus(); opener = null; }
  });
}());

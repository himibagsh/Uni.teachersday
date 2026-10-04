/* Багшийн баярын хуудас.
   Бичлэг бэлэн болоход зөвхөн энэ файлыг засна. */

'use strict';

var CONFIG = {

  /* Бичлэгийн нээлт. Үзэгчийн утасны цагаар тоолно. */
  premiere: '2026-10-05T12:00:00',

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
  ],

  /* Багш нарын жагсаалт. Нэг ч багш нэмэхэд «Багш нартаа» хэсэг
     өөрөө гарч ирнэ. Жишээ:

       { name: 'Б. Отгонбаатар', role: 'Профессор', symbol: 'От',
         photo: 'assets/img/bagsh/otgonbaatar.jpg' }

     symbol нь элементийн тэмдэг шиг 1-2 үсэг. photo байхгүй бол
     symbol нь нүүрний оронд харагдана. */
  teachers: []
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
    if (cell) cell.textContent = value;
  }

  function arrived() {
    if (countdown) countdown.hidden = true;
    if (slateLine) slateLine.textContent = 'Бичлэг удахгүй энд тавигдана';
    if (slateKicker) slateKicker.textContent = 'Бичлэг · эцсийн засвар';
  }

  function startCountdown() {
    if (!countdown) return;

    var target = new Date(CONFIG.premiere).getTime();
    if (isNaN(target)) {
      countdown.hidden = true;
      return;
    }

    function tick() {
      var left = target - Date.now();
      if (left <= 0) {
        arrived();
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

  /* ---- сэжүүрийн тайлал ---- */

  function wireReveal() {
    var button = document.getElementById('reveal');
    var greeting = document.getElementById('greeting');
    var groups = [document.getElementById('word1'), document.getElementById('word2')];
    if (!button || !greeting) return;

    var open = false;
    var pending = null;

    button.addEventListener('click', function () {
      open = !open;
      if (pending) { clearTimeout(pending); pending = null; }

      groups.forEach(function (g) {
        if (g) g.classList.toggle('is-open', open);
      });

      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open ? 'Хариуг нуух' : 'Хариуг харах';

      if (!open) {
        greeting.hidden = true;
        return;
      }
      if (calm) {
        greeting.hidden = false;
      } else {
        /* Бүх хавтас эргэж дуусахыг хүлээнэ. */
        pending = setTimeout(function () {
          greeting.hidden = false;
          pending = null;
        }, 1150);
      }
    });
  }

  /* ---- багш нар ---- */

  function renderTeachers() {
    var section = document.getElementById('bagsh');
    var list = document.getElementById('teachers');
    if (!section || !list) return;

    var people = CONFIG.teachers || [];
    if (!people.length) return;

    people.forEach(function (person, index) {
      var li = document.createElement('li');
      li.className = 'teacher';

      var tile = document.createElement('div');
      tile.className = 'teacher__tile';

      if (person.photo) {
        var img = document.createElement('img');
        img.className = 'teacher__photo';
        img.src = person.photo;
        img.alt = person.name || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        tile.appendChild(img);
      } else {
        var sym = document.createElement('span');
        sym.className = 'teacher__sym';
        sym.textContent = person.symbol || (person.name || '?').trim().charAt(0);
        tile.appendChild(sym);
      }

      var z = document.createElement('span');
      z.className = 'teacher__z';
      z.textContent = String(index + 1);
      tile.appendChild(z);

      li.appendChild(tile);

      if (person.name) {
        var name = document.createElement('p');
        name.className = 'teacher__name';
        name.textContent = person.name;
        li.appendChild(name);
      }

      if (person.role) {
        var role = document.createElement('p');
        role.className = 'teacher__role';
        role.textContent = person.role;
        li.appendChild(role);
      }

      list.appendChild(li);
    });

    section.hidden = false;
  }

  /* ---- эхлэл ---- */

  drawStages();
  if (!mountPlayer()) startCountdown();
  wireReveal();
  renderTeachers();

}());

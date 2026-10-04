/* Teachers' Day page.
   This is the only file you need to edit when the film is ready. */

'use strict';

var CONFIG = {

  /* When the film is first shown, read on the viewer's own clock. */
  premiere: '2026-10-05T12:00:00',

  /* Flip this to true once the cut is finished, then fill in videoSrc.
     The slate is replaced by a real player and the countdown stops. */
  videoReady: false,

  /* Either a file dropped into assets/video/ ...
       videoSrc: 'assets/video/teachers-day.mp4'
     ... or an embed address from YouTube or Vimeo:
       videoSrc: 'https://www.youtube.com/embed/VIDEO_ID'          */
  videoSrc: '',

  /* Optional still frame, used only for a self-hosted file. */
  videoPoster: '',

  /* How far the production has got. One of 'done', 'active', 'pending'. */
  stages: [
    { label: 'Filming',        state: 'done'    },
    { label: 'Edit',           state: 'active'  },
    { label: 'Sound & colour', state: 'pending' }
  ]
};

(function () {

  var stage = document.getElementById('stage');
  var statusList = document.getElementById('status');
  var countdown = document.getElementById('countdown');
  var slateLine = document.getElementById('slate-line');

  /* ---- production stages ---- */

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

  /* ---- the player, once there is something to play ---- */

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
    frame.title = 'Teachers’ Day film';
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

  /* ---- countdown to the premiere ---- */

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function put(unit, value) {
    var cell = countdown.querySelector('[data-unit="' + unit + '"]');
    if (cell) cell.textContent = value;
  }

  function arrived() {
    if (countdown) countdown.hidden = true;
    if (slateLine) slateLine.textContent = 'The premiere is under way in the Main Hall';
    var kicker = document.querySelector('.slate__kicker');
    if (kicker) kicker.textContent = 'Reel 1 · rolling';
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

  /* ---- go ---- */

  drawStages();
  if (!mountPlayer()) startCountdown();

}());

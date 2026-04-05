/* ══════════════════════════════════════════════
   CONFIG — Apps Script Web App URL
══════════════════════════════════════════════ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzvYJWXE0G0gHM97DWIn9FLR4RoLajfgs5W9y-jxXH3KLV-JCTtJubNMc0RTpCuVaTwg/exec'

/* ══════════════════════════════════════════════
   GUEST NAME — read from URL param (?guest=)
══════════════════════════════════════════════ */
let guestName = '';
(function () {
  const raw = new URLSearchParams(window.location.search).get('guest');
  guestName = raw ? decodeURIComponent(raw.trim()) : 'ភ្ញៀវកិត្តិយសជាទីស្រឡាញ់';
})();

/* ══════════════════════════════════════════════
   RSVP STATE MANAGEMENT — Prevent Duplicates
   KEY includes guest name so each guest is independent
══════════════════════════════════════════════ */
const RSVP_STORAGE_KEY = `rsvp_done_satha_rasmey_${encodeURIComponent(guestName)}`;

function checkRSVPStatus() {
  if (localStorage.getItem(RSVP_STORAGE_KEY)) {
    showAlreadySubmittedState();
    return true;
  }
  return false;
}

function showAlreadySubmittedState() {
  const btn = document.getElementById('rsvp-btn');
  const successMsg = document.getElementById('rsvp-success');
  const btnText = document.getElementById('rsvp-btn-text');
  const spinner = document.getElementById('rsvp-spinner');

  if (btn) {
    btn.disabled = true;
    btn.classList.add('confirmed');
  }
  if (spinner) spinner.style.display = 'none';
  if (btnText) {
    btnText.innerHTML = '✓ បានបញ្ជាក់រួចរាល់';
  }

  if (successMsg) {
    successMsg.classList.add('show');
    const successText = document.getElementById('rsvp-success-text');
    if (successText) {
      successText.textContent = 'សូមអរគុណ! អ្នកបានបញ្ជាក់វត្តមានរួចរាល់ហើយ ❤️';
    }
  }

  const confirmText = document.getElementById('rsvp-confirm-text');
  if (confirmText) {
    confirmText.innerHTML = `សូមអរគុណ <span>${guestName}</span> សម្រាប់ការបញ្ជាក់វត្តមាន!`;
  }
}

function markAsSubmitted() {
  localStorage.setItem(RSVP_STORAGE_KEY, 'true');
  localStorage.setItem(`${RSVP_STORAGE_KEY}_time`, new Date().toISOString());
  localStorage.setItem(`${RSVP_STORAGE_KEY}_name`, guestName);
}

/* ══════════════════════════════════════════════
   OVERLAY
══════════════════════════════════════════════ */
function openInvitation() {
  const overlay = document.getElementById('invite-overlay');
  overlay.classList.add('hidden');
  setTimeout(() => { overlay.style.display = 'none'; }, 500);
  setTimeout(tryAutoPlay, 600);
}

/* ══════════════════════════════════════════════
   RSVP — Submit to Google Sheet via Apps Script
══════════════════════════════════════════════ */
function handleRSVP() {
  // PREVENT DUPLICATE
  if (localStorage.getItem(RSVP_STORAGE_KEY)) {
    showAlreadySubmittedState();
    return;
  }

  const btn = document.getElementById('rsvp-btn');
  const spinner = document.getElementById('rsvp-spinner');
  const btnText = document.getElementById('rsvp-btn-text');
  const errorMsg = document.getElementById('rsvp-error');

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = 'កំពុងផ្ញើ...';
  if (errorMsg) errorMsg.classList.remove('show');

  const params = new URLSearchParams();
  params.append('name', guestName);
  params.append('rsvp', 'Yes');

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // Apps Script requires this
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  .then(() => {
    // no-cors means we can't read the response, but if fetch didn't throw it went through
    markAsSubmitted();
    showAlreadySubmittedState();
  })
  .catch(() => {
    // Network failure
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = 'បញ្ជាក់វត្តមាន';
    if (errorMsg) errorMsg.classList.add('show');
  });
}

/* ══════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

/* ══════════════════════════════════════════════
   GALLERY ANIMATIONS
══════════════════════════════════════════════ */
function animateGallerySection(containerId, direction) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      container.querySelectorAll('.gallery-item').forEach((item, i) => {
        setTimeout(() => {
          item.style.animation = `${direction === 'left' ? 'slideLeft' : 'slideRight'} 0.75s ease both`;
          item.classList.add('anim-in');
        }, i * 160);
      });
      observer.disconnect();
    });
  }, { threshold: 0.15 });

  observer.observe(container);
}

/* ══════════════════════════════════════════════
   YOUTUBE MUSIC
══════════════════════════════════════════════ */
const YT_VIDEO_ID = 'PmOqnjhLLTk';
let ytPlayer = null;
let isPlaying = false;
let ytReady = false;
let autoPlayPending = false;

const ytScript = document.createElement('script');
ytScript.src = 'https://www.youtube.com/iframe_api';
ytScript.async = true;
document.head.appendChild(ytScript);

const ytMount = document.createElement('div');
ytMount.id = 'yt-hidden-player';
ytMount.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0;z-index:-99;';
document.body.appendChild(ytMount);

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-hidden-player', {
    videoId: YT_VIDEO_ID,
    playerVars: {
      autoplay: 0, controls: 0, loop: 1,
      playlist: YT_VIDEO_ID, mute: 0,
      start: 9,
      playsinline: 1, rel: 0, modestbranding: 1
    },
    events: {
      onReady(e) {
        e.target.setVolume(60);
        ytReady = true;
        if (autoPlayPending) { e.target.playVideo(); autoPlayPending = false; }
      },
      onStateChange(e) {
        const S = YT.PlayerState;
        if (e.data === S.PLAYING) setMusicState(true);
        else if (e.data === S.PAUSED || e.data === S.ENDED) setMusicState(false);
      }
    }
  });
};

function tryAutoPlay() {
  if (ytReady && ytPlayer) ytPlayer.playVideo();
  else autoPlayPending = true;
}

function setMusicState(playing) {
  isPlaying = playing;
  const disc = document.getElementById('music-disc');
  const label = document.getElementById('music-fab-label');

  disc.querySelectorAll('.ring').forEach(r => r.classList.toggle('paused', !playing));
  disc.classList.toggle('is-playing', playing);
  label.textContent = playing ? 'Music On' : 'Tap to Play';
  disc.setAttribute('aria-label', playing ? 'Pause wedding music' : 'Play wedding music');

  if (playing) spawnNotes();
}

const NOTE_CHARS = ['♪', '♫', '♩', '♬'];
let noteInterval = null;

function spawnNotes() {
  if (noteInterval) return;
  noteInterval = setInterval(() => {
    if (!isPlaying) { clearInterval(noteInterval); noteInterval = null; return; }
    const note = document.createElement('span');
    note.className = 'floating-note';
    note.textContent = NOTE_CHARS[Math.floor(Math.random() * NOTE_CHARS.length)];
    note.style.setProperty('--dx', ((Math.random() - 0.5) * 40) + 'px');
    note.style.left = (Math.random() * 30 + 5) + 'px';
    note.style.bottom = '58px';
    note.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    document.getElementById('music-disc').appendChild(note);
    setTimeout(() => note.remove(), 2200);
  }, 700);
}

function toggleMusic() {
  if (!ytPlayer || !ytReady) { autoPlayPending = true; return; }
  if (isPlaying) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
}

/* ══════════════════════════════════════════════
   DOM READY — Initialize Everything
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  // Update guest name displays
  const guestDisplay = document.getElementById('guest-display');
  const rsvpGuestName = document.getElementById('rsvp-guest-name');
  if (guestDisplay) guestDisplay.textContent = guestName;
  if (rsvpGuestName) rsvpGuestName.textContent = guestName;

  // Update confirm text with guest name
  const confirmText = document.getElementById('rsvp-confirm-text');
  if (confirmText) {
    confirmText.innerHTML = `តើលោកអ្នកនឹងបានមកចូលរួមដែរឬទេ? <span>${guestName}</span>`;
  }

  // Check if already RSVPed (on page load)
  checkRSVPStatus();

  // Setup scroll reveal
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Setup gallery animations
  animateGallerySection('gallery-top', 'right');
  animateGallerySection('gallery-bottom', 'left');

  // Setup music player
  const musicDisc = document.getElementById('music-disc');
  if (musicDisc) {
    musicDisc.addEventListener('click', toggleMusic);
    musicDisc.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMusic(); }
    });
  }
});
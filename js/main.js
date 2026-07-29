// main.js
// This is the file that starts everything. It shows the intro, then the
// hub menu, and switches to the mode they want

import { playIntro } from './intro-globe.js';
import { mountHub } from './hub-menu.js';
import * as reactorStudy from './modes/reactor-study.js';
import * as nuclearFission from './modes/nuclear-fission.js';
import * as nuclearWorld from './modes/nuclear-world.js';
import * as ask from './modes/ask.js';

// this connects each mode name to its file
var MODE_MAP = {
  'reactor-study': reactorStudy,
  'nuclear-fission': nuclearFission,
  'nuclear-world': nuclearWorld,
  'ask': ask
};

var introEl = document.getElementById('intro-globe');
var hubEl = document.getElementById('hub-menu');
var modeEl = document.getElementById('mode-container');
var backBtn = document.getElementById('back-to-hub');

var currentUnmount = null;

function showHub() {
  modeEl.classList.remove('active');
  modeEl.innerHTML = '';
  backBtn.classList.remove('visible');
  hubEl.classList.add('active');
  hubEl.style.display = '';
  mountHub(hubEl, enterMode);
}

function enterMode(modeId) {
  var mode = MODE_MAP[modeId];
  if (!mode) {
    console.log('unknown mode: ' + modeId);
    return;
  }
  hubEl.classList.remove('active');
  hubEl.style.display = 'none';
  modeEl.classList.add('active');
  backBtn.classList.add('visible');
  currentUnmount = mode.mount(modeEl);
}

backBtn.addEventListener('click', function () {
  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }
  showHub();
});

// start everything: play intro, then show the hub
playIntro(introEl, function () {
  introEl.style.display = 'none';
  showHub();
});

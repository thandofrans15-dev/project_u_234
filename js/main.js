/* main.js
   Boot sequence + mode router. This is the one file that knows about
   every other module. To add a fifth mode: drop a file in js/modes/
   exporting mount(container) -> unmount, then add one line to MODE_MAP.
*/
import { playIntro } from './intro-globe.js';
import { mountHub } from './hub-menu.js';
import * as reactorStudy from './reactor-study.js';
import * as nuclearFission from './nuclear-fission.js';
import * as nuclearWorld from './nuclear-world.js';
import * as ask from './ask.js';

const MODE_MAP = {
  'reactor-study': reactorStudy,
  'nuclear-fission': nuclearFission,
  'nuclear-world': nuclearWorld,
  'ask': ask
};

const introEl = document.getElementById('intro-globe');
const hubEl = document.getElementById('hub-menu');
const modeEl = document.getElementById('mode-container');
const backBtn = document.getElementById('back-to-hub');

let currentUnmount = null;

function showHub() {
  modeEl.classList.remove('active');
  modeEl.innerHTML = '';
  backBtn.classList.remove('visible');
  hubEl.classList.add('active');
  hubEl.style.display = '';
  mountHubMenu();
}

function mountHubMenu() {
  mountHub(hubEl, (modeId) => enterMode(modeId));
}

function enterMode(modeId) {
  const mode = MODE_MAP[modeId];
  if (!mode) {
    console.warn(`Unknown mode: ${modeId}`);
    return;
  }
  hubEl.classList.remove('active');
  hubEl.style.display = 'none';
  modeEl.classList.add('active');
  backBtn.classList.add('visible');
  currentUnmount = mode.mount(modeEl);
}

backBtn.addEventListener('click', () => {
  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }
  showHub();
});

// boot: intro -> hub
playIntro(introEl, () => {
  introEl.style.display = 'none';
  showHub();
});

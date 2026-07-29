/* intro-globe.js
   Cinematic intro sequence that plays once on boot, then calls onComplete()
   so main.js can transition into the hub menu. 
*/
export function playIntro(container, onComplete) {
  container.innerHTML = `
    <div id="intro-wrap">
      <div id="intro-label">INITIALIZING REACTOR NETWORK…</div>
    </div>
  `;
  // placeholder timing — swap for your real globe animation completion event
  const timer = setTimeout(() => {
    container.innerHTML = '';
    onComplete();
  }, 1800);

  return function skipIntro() {
    clearTimeout(timer);
    container.innerHTML = '';
    onComplete();
  };
}

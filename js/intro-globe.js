// intro-globe.js
// loading screen that shows a globe

function playIntro(container, onComplete) {
  container.innerHTML =
    '<div id="intro-wrap"><div id="intro-label">Loading Reactor Network...</div></div>';

  var timer = setTimeout(function () {
    container.innerHTML = '';
    onComplete();
  }, 1500);

  function skipIntro() {
    clearTimeout(timer);
    container.innerHTML = '';
    onComplete();
  }
  return skipIntro;
}

export { playIntro };

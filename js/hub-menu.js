// hub-menu.js
// Draws the 4 buttons for picking a mode. When you click one it calls
// onSelect with the name of the mode.

var MODES = [
  { id: 'reactor-study', label: 'Reactor Study' },
  { id: 'nuclear-fission', label: 'Nuclear Fission' },
  { id: 'nuclear-world', label: 'Nuclear World' },
  { id: 'ask', label: 'Ask' }
];

function mountHub(container, onSelect) {
  var html = '<div id="hub-ring">';
  for (var i = 0; i < MODES.length; i++) {
    html += '<button class="hub-node" data-mode="' + MODES[i].id + '">' + MODES[i].label + '</button>';
  }
  html += '</div>';
  container.innerHTML = html;

  var buttons = container.querySelectorAll('.hub-node');
  function handleClick(event) {
    var modeId = event.currentTarget.getAttribute('data-mode');
    onSelect(modeId);
  }
  for (var b = 0; b < buttons.length; b++) {
    buttons[b].addEventListener('click', handleClick);
  }

  function unmountHub() {
    for (var b2 = 0; b2 < buttons.length; b2++) {
      buttons[b2].removeEventListener('click', handleClick);
    }
    container.innerHTML = '';
  }
  return unmountHub;
}

export { mountHub };

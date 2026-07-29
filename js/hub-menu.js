/* hub-menu.js
   Renders the radial menu hub with the four modes and calls onSelect(id)
   when the user picks one. main.js owns the router; this module only
   knows how to draw itself and report clicks.
*/
const MODES = [
  { id: 'reactor-study', label: 'REACTOR STUDY' },
  { id: 'nuclear-fission', label: 'NUCLEAR FISSION' },
  { id: 'nuclear-world', label: 'NUCLEAR WORLD' },
  { id: 'ask', label: 'ASK' }
];

export function mountHub(container, onSelect) {
  container.innerHTML = `
    <div id="hub-ring">
      ${MODES.map((m, i) => `
        <button class="hub-node" data-mode="${m.id}" style="--i:${i}">
          <span>${m.label}</span>
        </button>
      `).join('')}
    </div>
  `;
  const buttons = container.querySelectorAll('.hub-node');
  function handler(e) {
    onSelect(e.currentTarget.dataset.mode);
  }
  buttons.forEach(b => b.addEventListener('click', handler));

  return function unmountHub() {
    buttons.forEach(b => b.removeEventListener('click', handler));
    container.innerHTML = '';
  };
}

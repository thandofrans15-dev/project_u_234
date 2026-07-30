/* nuclear-fission.js
   Placeholder mode. Same mount(container) -> unmount() contract as every
   other mode, so main.js's router doesn't need to know it's a stub.
   Replace the body of mount() with the real fission visualization when
   ready — keep the same export shape.
*/
export function mount(container) {
  container.innerHTML = `
    <div class="rs-panel" style="position:absolute; inset:40px; padding:24px; display:flex;
      align-items:center; justify-content:center; flex-direction:column; gap:12px;">
      <div class="rs-title" style="color:var(--rs-cyan); font-size:16px; letter-spacing:4px;">
        NUCLEAR FISSION <span style="color:var(--rs-text-dim); font-size:11px;">// MODULE PENDING</span>
      </div>
      <div style="color:var(--rs-text-dim); font-size:12px; letter-spacing:1px; max-width:420px; text-align:center;">
        This mode is scaffolded and wired into the router — build the
        chain-reaction / neutron visualization here using the same
        mount(container) → unmount() contract as reactor-study.js.
      </div>
    </div>
  `;
  return function unmount() {
    container.innerHTML = '';
  };
}

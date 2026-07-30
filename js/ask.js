/* ask.js
   Placeholder mode — same mount(container) -> unmount() contract as
   every other mode. Fill in with the real Q&A / chat interface when ready.
*/
export function mount(container) {
  container.innerHTML = `
    <div class="rs-panel" style="position:absolute; inset:40px; padding:24px; display:flex;
      align-items:center; justify-content:center; flex-direction:column; gap:12px;">
      <div class="rs-title" style="color:var(--rs-cyan); font-size:16px; letter-spacing:4px;">
        ASK <span style="color:var(--rs-text-dim); font-size:11px;">// MODULE PENDING</span>
      </div>
      <div style="color:var(--rs-text-dim); font-size:12px; letter-spacing:1px; max-width:420px; text-align:center;">
        Scaffolded and wired into the router. Build the Q&A interface here.
      </div>
    </div>
  `;
  return function unmount() {
    container.innerHTML = '';
  };
}

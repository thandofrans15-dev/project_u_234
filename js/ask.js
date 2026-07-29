function mount(container) {
  container.innerHTML =
    '<div class="rs-panel" style="position:absolute; top:60px; left:60px; right:60px; bottom:60px; ' +
    'padding:20px; display:flex; align-items:center; justify-content:center; flex-direction:column;">' +
    '<h2 style="color:dodgerblue;">Ask</h2>' +
    '<p style="color:#aaaaaa; max-width:400px; text-align:center;">This part is not finished yet.</p>' +
    '</div>';

  function unmount() {
    container.innerHTML = '';
  }
  return unmount;
}

export { mount };

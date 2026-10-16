// Lazy loading keeps WebGL/Three.js off phones and out of the classic games.
let active = null, modulePromise;
export function disposeThreeView() { if (active) { active.cancelled = true; active.view?.dispose(); active = null; } }
export function updateThreeView(container, state) {
  if (!container) return;
  if (active?.container === container) { active.state = state; active.view?.update(state); return; }
  disposeThreeView();
  const current = { container, state, cancelled: false }; active = current;
  container.dataset.state = 'loading'; container.textContent = '3D oyun hazırlanıyor…';
  modulePromise ||= import('./three-scenes.js');
  modulePromise.then(module => {
    if (current.cancelled || !container.isConnected) return;
    current.view = module.createThreeView(container, current.state);
  }).catch(error => {
    if (current.cancelled || !container.isConnected) return;
    container.dataset.state = 'error'; container.textContent = '3D görüntü açılamadı. WebGL 2 destekleyen bir tarayıcıda donanım hızlandırmayı açıp tekrar deneyin. Klasik oyunlar oyun rafında kullanılabilir.';
    console.error('3D renderer could not start:', error);
  });
}

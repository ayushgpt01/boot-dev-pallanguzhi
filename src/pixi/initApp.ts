import { Application } from 'pixi.js';

export async function initApp() {
  const app = new Application();
  await app.init({
    background: '#4E342E',
    width: 1000,   // set width
    height: 500   // set height
  });
  const container = document.getElementById('pixi-container');
  if (container) {
    container.appendChild(app.canvas);
  }
  return app;
}

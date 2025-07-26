import { Application, Assets, Sprite } from "pixi.js";

export async function initApp() {
  const app = new Application();
  await app.init({ background: "#4E342E", resizeTo: window });
  document.getElementById("pixi-container").appendChild(app.canvas);
  return app;
}

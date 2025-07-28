import { Application, Text, TextStyle } from 'pixi.js';

export function createTitleText(app: Application) {
  const style = new TextStyle({
    fill: 0x000000,
    fontSize: 48,
    fontFamily: 'Cinzel-Bold'
  });

  const title = new Text({
    // text: 'Pallanguzhi',
    text: '',
    style
  });

  title.anchor.set(0.5);
  title.x = app.screen.width / 2;
  title.y = 50;

  return title;
}

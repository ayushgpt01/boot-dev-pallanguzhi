import { TextStyle, Text } from "pixi.js";

export function createTitleText(app) {
  const style = new TextStyle({
    // fill: 0xffffff,
    fill: 0x000000,
    fontSize: 72,
    fontFamily: "Cinzel",
  });

  const text = new Text({
    text: "Alaguli Mane/Pallanguzhi",
    style,
  });

  text.anchor.set(0.5, 0);
  text.x = app.screen.width / 2;
  text.y = 30;

  return text;
}

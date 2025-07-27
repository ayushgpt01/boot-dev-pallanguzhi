import { Sprite, Assets } from "pixi.js";

export async function createSeeds(app) {
  const seedPaths = [
    // "/assets/seed.svg",
    "/assets/seeds/seed_one.png",
    "/assets/seeds/seed_two.png",
    "/assets/seeds/seed_three.png",
    "/assets/seeds/seed_four.png",
    "/assets/seeds/seed_one.png",
  ];

  const sprites = [];

  for (let i = 0; i < seedPaths.length; i++) {
    const texture = await Assets.load(seedPaths[i]);
    const sprite = Sprite.from(texture);
    sprite.scale.set(0.3);
    sprite.x = 100 + i * 60;
    sprite.y = 100;
    sprites.push(sprite);
  }

  return sprites;
}

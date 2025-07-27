import { Application, Sprite, Assets } from 'pixi.js';

export async function createSeeds(app: Application) {
  const seedAssets = await Assets.loadBundle('seeds');
  const seeds: Sprite[] = [];

  for (let i = 0; i < 5; i++) {
    const seedSprite = Sprite.from(
      (Object as any).values(seedAssets)[
        Math.floor(Math.random() * Object.keys(seedAssets).length)
      ]
    );

    seedSprite.anchor.set(0.5);
    seedSprite.scale.set(0.15);

    seedSprite.x = 100 + i * 100;
    seedSprite.y = 100;

    seeds.push(seedSprite);
  }

  return seeds;
}

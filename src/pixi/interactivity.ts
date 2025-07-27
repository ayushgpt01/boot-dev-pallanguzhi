import { Sprite } from 'pixi.js';

export function setupSeedInteractivity(seedSprite: Sprite) {
  seedSprite.eventMode = 'static';
  seedSprite.cursor = 'pointer';

  seedSprite.on('pointerover', () => {
    seedSprite.scale.set(1.2);
  });

  seedSprite.on('pointerout', () => {
    seedSprite.scale.set(1);
  });

  seedSprite.on('pointerdown', () => {
    console.log('Seed clicked!');
  });
}

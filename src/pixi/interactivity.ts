export function setupSeedInteractivity(seedSprite) {
  seedSprite.eventMode = "static";
  seedSprite.cursor = "pointer";

  seedSprite.on("mousedown", () => {
    seedSprite.x += 10;
    seedSprite.y -= 10;
  });
}

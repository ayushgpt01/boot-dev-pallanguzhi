interface Position {
  player: 'player1' | 'player2';
  pitIndex: number;
}

interface GameConfig {
  initialSeeds: number;
  pitsPerPlayer: number;
  maxDistributions: number;
}

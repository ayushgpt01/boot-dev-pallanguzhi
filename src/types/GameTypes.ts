interface Position {
  player: 'player1' | 'player2';
  pitIndex: number;
}

interface GameConfig {
  /** The initial number of seeds in each pit */
  initialSeeds: number;
  /** Pits per player */
  pitsPerPlayer: number;
  /** This is added for Point 5 but currently there's no max limit to how many rounds can one player play */
  maxDistributions: number;
}

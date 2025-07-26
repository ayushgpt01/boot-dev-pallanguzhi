export type GameEventType = 'move' | 'pause' | 'resume' | 'game_over';
export type GameState = 'playing' | 'paused' | 'over';

export interface GameEvent {
  type: GameEventType;
  data: any;
}
